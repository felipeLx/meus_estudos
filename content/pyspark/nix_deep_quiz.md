# Nix — Deep Quiz (Spark / big data)

Harder than the concept quizzes: internals, tuning numbers, failure modes.

---

## Questions

**1.** A stage boundary in Spark is created by:
- A) Any transformation
- B) A wide transformation — one that needs a shuffle (groupBy, join, repartition, distinct)
- C) An action
- D) Caching

**2.** Narrow vs wide transformation:
- A) Narrow = each input partition feeds exactly one output partition, no shuffle
- B) Narrow means fewer columns
- C) Wide means more executors
- D) They are the same after Catalyst

**3.** `spark.sql.shuffle.partitions` default 200 hurts a 10 GB job because:
- A) It is too few — always raise it
- B) It is arbitrary: fixed 200 tasks regardless of data size, so partitions end up too big or too small
- C) It controls executor count
- D) It only affects writes

**4.** Rule of thumb for a healthy shuffle partition size:
- A) ~1 MB  B) ~128–200 MB  C) ~2 GB  D) One per row

**5.** Adaptive Query Execution (AQE) at runtime can:
- A) Coalesce shuffle partitions, switch to broadcast join, split skewed partitions
- B) Rewrite your SQL semantics
- C) Add executors
- D) Nothing without a hint

**6.** Data skew shows up in the Spark UI as:
- A) All tasks slow
- B) One or a few tasks with far larger shuffle read / duration than the median while others finished
- C) High driver memory
- D) Many stages

**7.** The salting fix for a skewed join works by:
- A) Sorting the data
- B) Appending a random suffix to the hot key on the big side and exploding the small side across all salt values
- C) Broadcasting the big side
- D) Increasing retries

**8.** Broadcast join is appropriate when:
- A) Both sides are huge
- B) One side fits comfortably in executor memory (tens of MB up to ~a few hundred)
- C) The join key is skewed on both sides
- D) You need a full outer join of two 1 TB tables

**9.** `spark.sql.autoBroadcastJoinThreshold` default is about:
- A) 10 MB  B) 1 GB  C) 100 KB  D) Unlimited

**10.** Broadcasting a too-large table typically fails with:
- A) Slow scan
- B) Driver OOM (the table is collected to the driver first) or executor OOM
- C) Wrong results
- D) Skew

**11.** `repartition(n)` vs `coalesce(n)`:
- A) Identical
- B) `repartition` does a full shuffle and can increase or balance; `coalesce` merges locally, only decreases, can leave uneven partitions
- C) `coalesce` shuffles more
- D) `repartition` only decreases

**12.** Writing 50 000 tiny files to S3 is bad because:
- A) Storage cost only
- B) Listing/opening dominates read time and the metastore/driver bogs down — the small-file problem
- C) Parquet forbids it
- D) It breaks partitioning

**13.** Fix for the small-file problem on write:
- A) `coalesce`/`repartition` before write, or compaction jobs (OPTIMIZE)
- B) More executors
- C) Smaller partitions
- D) Cache the DataFrame

**14.** `cache()` / `persist()` is worth it when:
- A) A DataFrame is reused in more than one action/branch and recomputation is expensive
- B) Always
- C) On the last step before write
- D) Only for small data

**15.** Default `persist()` storage level in PySpark DataFrames:
- A) MEMORY_ONLY  B) MEMORY_AND_DISK  C) DISK_ONLY  D) OFF_HEAP

**16.** Predicate pushdown means:
- A) Filters run in the driver
- B) The filter is pushed into the file scan so Parquet row groups are skipped by min/max statistics
- C) Filters run after the join
- D) The optimizer reorders columns

**17.** Partition pruning requires:
- A) Filtering on the physical partition column (e.g. `dt`) so whole directories are skipped
- B) A bucketed table
- C) Caching
- D) Sorting

**18.** Over-partitioning a table by a high-cardinality column (e.g. `user_id`) causes:
- A) Faster reads
- B) Millions of tiny directories/files — metadata explosion and slow listing
- C) Better compression
- D) Skew removal

**19.** Parquet is columnar, which means:
- A) Rows are stored contiguously
- B) Only the referenced columns are read, and each column compresses homogeneously
- C) It cannot be split
- D) Schema is optional

**20.** Choose Avro over Parquet when:
- A) Analytical column scans dominate
- B) The workload is row-wise write/streaming with schema evolution (e.g. Kafka payloads)
- C) You need compression
- D) Never

**21.** `df.count()` inside a loop over 12 months is a problem because:
- A) It is an action — each call re-executes the whole lineage unless cached
- B) It is lazy
- C) It returns a DataFrame
- D) It shuffles nothing

**22.** Python UDFs are slow in PySpark because:
- A) They are interpreted twice
- B) Rows are serialised to a Python worker per row — leaving the JVM and blocking Catalyst optimisation
- C) They run on the driver
- D) They break lineage

**23.** The mitigation, in order of preference:
- A) Built-in `pyspark.sql.functions` → pandas UDF (vectorised, Arrow) → plain Python UDF last
- B) Always pandas UDF
- C) Rewrite in Scala first
- D) More executors

**24.** Executor memory is split into:
- A) Only heap
- B) Execution memory (shuffle/sort/join) and storage memory (cache), sharing a unified region, plus overhead
- C) Driver and worker
- D) JVM and Python only, no overhead

**25.** `spark.executor.memoryOverhead` matters for PySpark because:
- A) It is unused
- B) Python worker processes live outside the JVM heap — too little overhead means YARN/K8s kills the container
- C) It sets cache size
- D) It controls shuffle partitions

**26.** Typical executor sizing advice:
- A) One giant executor per node
- B) ~4–5 cores and moderate memory per executor — very large heaps suffer GC pauses, one-core executors lose parallel task reuse
- C) One core per executor
- D) As many cores as the node has

**27.** `groupByKey` versus `reduceByKey` on RDDs:
- A) Identical
- B) `reduceByKey` combines map-side before the shuffle, moving far less data
- C) `groupByKey` is faster
- D) Both avoid shuffles

**28.** In DataFrame API the equivalent good habit is:
- A) `groupBy().agg()` with built-in aggregates, which get partial aggregation automatically
- B) `collect()` then aggregate in Python
- C) UDF aggregation
- D) `rdd.groupByKey`

**29.** `collect()` on a large DataFrame:
- A) Is distributed
- B) Pulls every row to the driver — OOM; use `take(n)`, `limit`, or write to storage
- C) Is lazy
- D) Streams to disk automatically

**30.** Delta/Iceberg give you over plain Parquet:
- A) ACID commits, time travel, schema evolution, compaction, and metadata that avoids full file listing
- B) Only compression
- C) A new file format
- D) Streaming only

**31.** Exactly-once-ish incremental loads on a lakehouse table use:
- A) Blind append
- B) MERGE on a business key, or overwrite of the affected partition — both idempotent per run
- C) Delete the table each run
- D) Random file names

**32.** Structured Streaming watermark exists to:
- A) Order events
- B) Bound how long state is kept for late events so aggregation state does not grow forever
- C) Deduplicate files
- D) Trigger batches

**33.** Checkpointing in Structured Streaming stores:
- A) Cached data
- B) Offsets and state so a restart resumes exactly where it stopped
- C) The query plan only
- D) Logs

**34.** A job runs fine on 1 GB and dies on 1 TB with "shuffle fetch failed". First checks:
- A) Skew and shuffle partition count/size, then executor memory/overhead, then AQE enabled
- B) Rewrite in pandas
- C) Add more retries
- D) Increase driver cores

**35.** Cost control on a cloud Spark platform comes mostly from:
- A) Reading less (partition pruning, column pruning, compaction), right-sized clusters, autoscaling and spot for retryable work
- B) Bigger clusters
- C) More caching
- D) Larger files only

---

## Answer key

1-B · 2-A · 3-B · 4-B · 5-A · 6-B · 7-B · 8-B · 9-A · 10-B · 11-B · 12-B · 13-A · 14-A · 15-B · 16-B · 17-A · 18-B · 19-B · 20-B · 21-A · 22-B · 23-A · 24-B · 25-B · 26-B · 27-B · 28-A · 29-B · 30-A · 31-B · 32-B · 33-B · 34-A · 35-A

### One-line rationales (the reusable idea)
1. **Shuffle = stage boundary.** Count the shuffles to count the stages.
2. **Narrow** = 1:1 partition lineage (map/filter/select), **wide** = redistribution.
3. **200 is a constant, your data is not** — size partitions, or let AQE coalesce them.
4. Aim for **~128–200 MB per shuffle partition**: fewer, bigger tasks lose parallelism; tiny tasks pay scheduling overhead.
5. **AQE** = runtime replanning: coalesce partitions, promote broadcast, split skewed joins.
6. Skew's signature: **max task time ≫ median task time** on one stage.
7. **Salting** spreads a hot key across N synthetic keys; the small side is replicated per salt.
8. **Broadcast** when one side is small enough to ship to every executor — kills the shuffle.
9. Default `autoBroadcastJoinThreshold` = **10 MB**.
10. Broadcast collects to the **driver** first — oversized broadcast = driver OOM.
11. **repartition = full shuffle, balanced**; **coalesce = local merge, cheap, possibly uneven**.
12. **Small files** kill read throughput and metadata operations, especially on object storage.
13. Fix on write: **coalesce/repartition**, or scheduled **compaction/OPTIMIZE**.
14. **Cache when reused**, and unpersist when done — caching a single-use DataFrame just steals memory.
15. DataFrame `persist()` defaults to **MEMORY_AND_DISK**.
16. **Predicate pushdown** skips row groups via Parquet min/max stats — filter early.
17. **Partition pruning** needs the filter on the partition column itself, not a derived expression.
18. **High-cardinality partitioning** explodes metadata; partition by date, bucket by id.
19. **Columnar** = read only what you select, compress like with like.
20. **Avro** = row-oriented, schema-evolution friendly → streams and landing zones; **Parquet** = analytics.
21. Every **action re-runs the lineage** — cache or restructure the loop.
22. **Python UDFs** cross the JVM↔Python boundary per row and are opaque to Catalyst.
23. Order: **built-ins → pandas/Arrow UDF → Python UDF**.
24. Unified memory: **execution + storage share a pool**, plus off-heap **overhead**.
25. PySpark workers live **outside the heap** — starve `memoryOverhead` and the container gets killed.
26. **~4–5 cores per executor** balances parallelism against GC and HDFS/S3 throughput.
27. **reduceByKey combines map-side**; `groupByKey` ships every value across the network.
28. `groupBy().agg()` with built-ins gets **partial aggregation** for free.
29. **`collect()` = everything to the driver.** Use `take`, `limit`, or write out.
30. **Delta/Iceberg** = table format on top of Parquet: ACID, time travel, evolution, compaction, fast metadata.
31. **MERGE or partition overwrite** = idempotent, re-runnable loads.
32. **Watermark** bounds state retention for late data.
33. **Checkpoint** = offsets + state → restart resumes without loss or duplication.
34. Debug order: **skew → partition sizing → memory/overhead → AQE**, reading the Spark UI, not guessing.
35. **Read less, size right, autoscale, spot** — the four levers that actually move the bill.
