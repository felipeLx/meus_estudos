# Nix — Deep Concepts

Open-answer cards for the verbal round. Answer out loud in 60–90 seconds, then reveal.
Pattern for every answer: **what it is → why it happens → how you detect it → what you do → the trade-off**.

## Walk through what happens when a Spark job runs

Driver builds a logical plan from your transformations — nothing executes yet. On an **action**, Catalyst optimises (predicate pushdown, column pruning, join reordering, constant folding) and produces a physical plan. The plan is cut into **stages at every shuffle boundary**; each stage becomes a set of **tasks**, one per partition. Cluster manager gives executors, the scheduler ships tasks to where the data is, and results flow back.

Say this next, it is the part interviewers want: **the shuffle is the expensive part** — data is written to local disk, fetched over the network, and re-sorted. Everything about tuning Spark is either "avoid the shuffle" or "make the shuffle balanced".

## Diagnose a slow Spark job — the order you check things

1. **Spark UI, stage view**: which stage dominates wall time?
2. **Task distribution in that stage**: max vs median duration and shuffle read. Big gap = **skew**.
3. **Partition count and size**: 200 default shuffle partitions on a 500 GB job = 2.5 GB tasks; on 500 MB = 2.5 MB tasks. Target ~128–200 MB.
4. **Spill**: memory spill / disk spill columns non-zero = execution memory too small or partitions too big.
5. **GC time**: high = heap too large or too much cached.
6. **Input**: how many files, how big? Small-file storm, or no partition pruning (full scan when you filtered on a non-partition column).
7. **Plan**: `df.explain(True)` — is the join a `BroadcastHashJoin` or a `SortMergeJoin`? Did the filter push down?

Only then change knobs. Guessing at `executor.memory` first is the junior answer.

## Data skew — detect, fix, trade-off

**What**: one key holds a disproportionate share of rows, so one task does most of the work while the cluster idles.

**Detect**: in the failing stage, max task duration/shuffle-read ≫ median. Confirm with `df.groupBy(key).count().orderBy(desc("count")).show(10)`.

**Fixes, cheapest first**

1. **Enable AQE skew join** — `spark.sql.adaptive.enabled` + `adaptive.skewJoin.enabled` splits oversized partitions automatically.
2. **Broadcast the small side** — no shuffle, so no skew.
3. **Salting** when the big side is genuinely skewed and both sides are large:

```python
from pyspark.sql import functions as F

SALTS = 16
big_salted = big.withColumn("salt", (F.rand() * SALTS).cast("int"))
small_exploded = (small
    .withColumn("salt", F.explode(F.array([F.lit(i) for i in range(SALTS)]))))

joined = (big_salted
    .join(small_exploded, ["store_id", "salt"], "left")
    .drop("salt"))
```

4. **Isolate the hot keys**: join them separately (broadcast) and union with the rest.

**Trade-off**: salting multiplies the small side by N — more shuffle volume and CPU in exchange for parallelism. Only pay it when skew is proven.

## Partitioning strategy — how you choose the column

Pick the column that **most queries filter on** and that has **moderate cardinality**. In practice: a date (`dt`) for time-series facts, sometimes date + region.

Rules:
- Target partition size **~100 MB–1 GB** of data per partition value.
- **High cardinality kills you**: partitioning by `user_id` creates millions of directories, and listing metadata costs more than reading data.
- **Low cardinality wastes pruning**: partitioning by a boolean prunes almost nothing.
- Filter on the **raw partition column** — `WHERE dt = '2024-03-01'`, not `WHERE year(ts) = 2024`, or pruning is lost.
- Need fine-grained lookups inside a partition? **Bucket or sort** by that key (`bucketBy`, Z-order/clustering in Delta/Iceberg) instead of partitioning by it.

Re-partitioning a table later is a full rewrite — cheap to decide right, expensive to fix.

## Joins in Spark — pick the strategy and say why

| Strategy | When Spark picks it | Cost |
|---|---|---|
| **Broadcast hash join** | one side under `autoBroadcastJoinThreshold` (10 MB default), or a `broadcast()` hint | no shuffle; driver + executor memory for the copy |
| **Sort-merge join** | both sides large, join keys sortable | two shuffles + sort — the default heavy path |
| **Shuffle hash join** | one side small enough to hash per partition, sorting undesirable | one shuffle + hash build |
| **Broadcast nested loop** | non-equi joins | quadratic, avoid |

Levers: raise the broadcast threshold when the small side is well under executor memory; pre-**bucket** both tables on the join key to skip the shuffle entirely for repeated joins; filter **before** the join so less data is shuffled.

## Memory model and OOM triage

Executor memory = **unified region** (execution: shuffle/sort/join/aggregation buffers; storage: cached blocks — they borrow from each other) + **user memory** + **reserved** + **`memoryOverhead`** outside the heap for Python workers, netty buffers and off-heap.

Common OOMs and their real cause:

- **Driver OOM** → `collect()`/`toPandas()` on a big DataFrame, or an oversized broadcast.
- **Executor OOM in a Python stage** → `memoryOverhead` too small (PySpark workers are off-heap).
- **Executor OOM during a join/aggregate** → partitions too large; increase shuffle partitions instead of memory.
- **Long GC pauses** → heap too big (>~32 GB loses compressed oops) or too much cached data; unpersist.

Fix order: **reduce partition size → reduce cached data → raise overhead → resize executors**. Adding memory to hide skew just makes an expensive job that still crashes at 2× volume.

## When to cache, and when caching hurts

Cache when a DataFrame is **consumed by more than one action or branch** and recomputing it costs a shuffle or an expensive scan — e.g. a cleaned fact table feeding three aggregations, or an iterative algorithm.

Do not cache: single-use DataFrames, anything larger than the storage pool (it spills and you pay disk twice), or the final DataFrame right before a single write.

Discipline: `df.cache()` → trigger once → reuse → **`df.unpersist()`**. Cached blocks steal execution memory and cause spills elsewhere. Storage level `MEMORY_AND_DISK` is the DataFrame default; `MEMORY_ONLY_SER`/off-heap trade CPU for footprint.

## Python UDF cost and the vectorised alternative

A plain Python UDF serialises **every row** out of the JVM into a Python worker and back, and Catalyst treats it as a black box — no pushdown, no reordering through it.

Order of preference:

1. **Built-in `pyspark.sql.functions`** — stays in the JVM, fully optimisable.
2. **Pandas / Arrow UDF** — batches of rows as pandas Series over Arrow; typically several times faster than a row UDF.

```python
@F.pandas_udf("double")
def norm(v: pd.Series) -> pd.Series:
    return (v - v.mean()) / v.std()
```

3. **Plain Python UDF** — last resort, for genuinely non-expressible logic.

Also true of `rdd.map` on DataFrames: dropping to RDDs throws away Catalyst and Tungsten.

## File formats and table formats — the decision

**File format**: **Parquet** for analytics (columnar, column pruning, min/max stats, good compression). **Avro** for row-wise streaming payloads and schema evolution. **ORC** where the ecosystem (Hive) prefers it. **CSV/JSON** only at the raw landing zone — no types, no stats, no pruning.

**Table format on top**: **Delta / Iceberg / Hudi** add ACID commits, snapshot isolation, **time travel**, schema evolution, `MERGE`, compaction (`OPTIMIZE`/rewrite), and metadata that avoids listing millions of files. Iceberg additionally offers hidden partitioning and partition evolution.

The honest trade-off: table formats add a metadata layer to maintain (commit logs, vacuum/expire snapshots) and lock you into engines that support them. Plain Parquet stays simplest for immutable append-only data nobody updates.

## Batch vs streaming — and what streaming really costs

Choose **streaming** only when the business acts on data in seconds-to-minutes. Otherwise batch is cheaper, simpler to backfill, and easier to test.

Structured Streaming essentials:
- **Trigger** — micro-batch interval (or `availableNow` for a batch-style catch-up run).
- **Checkpoint** — offsets + state; restart resumes exactly where it left off. Never share a checkpoint between queries.
- **Watermark** — bounds how long late events are accepted so aggregation state does not grow without limit.
- **Output modes** — append / update / complete, constrained by the aggregation.
- **Sink idempotency** — exactly-once end-to-end needs an idempotent or transactional sink (Delta) plus checkpointing.

Operational cost: a streaming job runs 24/7 (cluster always on), small-file churn needs regular compaction, and state stores need sizing. Say that out loud — it shows production experience.

## Cost optimisation on a cloud data platform

Biggest levers, in order of impact:

1. **Read less** — partition pruning, column pruning, compacted files, incremental instead of full loads. Most bills are wasted scans.
2. **Right-size compute** — fewer, well-sized executors; autoscaling with sane min/max; auto-terminate idle clusters.
3. **Spot / preemptible** for retryable batch work, on-demand for the driver and SLA-critical jobs.
4. **Storage tiering and retention** — expire snapshots, vacuum, archive cold partitions.
5. **Kill duplicated work** — one curated table many teams read, rather than five pipelines recomputing the same joins.

Measure before optimising: per-job cost attribution (tags/cluster policies) tells you which 5 jobs are 80% of the bill.

## The trade-off framework for any "how would you design X" question

1. **Restate the requirement** — volume, latency, freshness, consumers, correctness bar.
2. **Name 2–3 viable options**, not one.
3. **Compare on the axes that matter**: cost, latency, complexity/maintenance, correctness guarantees, team skill.
4. **Choose one and say why here** — tie it to the stated constraint.
5. **State what would change your mind** — "if volume grows 10× or we need sub-minute freshness, I would move to X".

This structure is worth more than any single technology answer: it shows you optimise for the business constraint rather than defending a favourite tool.
