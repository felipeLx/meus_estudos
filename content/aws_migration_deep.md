# AWS — Migration, HA/DR & Cost Deep Dive

Spoken-answer cards for the Caylent round. Consultancy interview: they want the **migration
story**, the **trade-off**, and evidence you have done it under pressure — not service trivia.
Answer out loud in 60–90 s. Pattern: **what → why → how you'd do it here → the risk → the trade-off**.

## Design a full Oracle on-prem to AWS migration, end to end

**Phase 0 — discovery.** Inventory schemas, table sizes, growth, peak write rate, uptime window, downstream consumers, compliance constraints. Ask what the target must *do*: still transactional, or analytics only? That single answer picks the target.

**Phase 1 — assess.** Run **SCT** for the schema conversion report: what auto-converts, what needs review, what needs a rewrite. Stored procedures and packages are where the effort hides (~80% automatic, the rest manual PL/SQL → PL/pgSQL).

**Phase 2 — target choice.** Transactional workload → **RDS/Aurora PostgreSQL**. Analytics → **S3 + Iceberg + Glue Catalog**, query via Athena/EMR. Mixed → both, with CDC feeding the lake.

**Phase 3 — move data.** **DMS full load**, then **CDC** from the redo logs for ongoing sync. Table mappings select schemas and apply renames/filters.

**Phase 4 — validate in parallel.** Row counts per table, checksums/aggregates on key columns, and a set of business queries run on both sides. Automate it — this is what buys the cutover decision.

**Phase 5 — cutover.** Freeze writes briefly, wait for **CDC lag ≈ 0**, repoint the application, keep the source readable as a fallback.

**Phase 6 — bake and decommission.** Run parallel for an agreed period, then retire the source.

**Risks to name yourself**: data-type precision drift (Oracle `NUMBER`), sequences/identity, character-set/encoding, LOB handling, and no performance baseline to compare against. State that you capture the baseline *before* you migrate.

## DMS CDC — how it actually works, and how it fails

**What**: after the full load, DMS reads the source **transaction log** — redo logs on Oracle, WAL on PostgreSQL, binlog on MySQL — and applies inserts/updates/deletes to the target continuously.

**Why log-based**: no triggers, no `SELECT` polling, minimal load on the source, and you capture deletes (a timestamp-based incremental pull cannot).

**Prerequisites** worth saying out loud: supplemental logging / `ARCHIVELOG` on Oracle, `wal_level = logical` on PostgreSQL, a user with the right log-read privileges, and enough log retention that DMS can catch up after a hiccup.

**Failure modes and what you do**
- **CDC lag grows** → replication instance undersized, or the target cannot absorb the write rate. Scale the instance, batch-apply, or reduce parallel tasks.
- **Source log truncated before DMS read it** → lag exceeded retention; increase retention, then re-seed the affected tables.
- **Tables without a primary key** → updates/deletes cannot be targeted. Add a key, or migrate them as append-only and reconcile.
- **LOB columns** → limited LOB mode truncates; full LOB mode is slow. Decide per table.
- **DDL on the source mid-migration** → DMS handles some, not all. Freeze schema changes during the window.

**Trade-off**: CDC gives near-zero downtime for real operational cost — an always-on replication instance, monitoring, and a validation harness. For a small database an overnight full load may simply be cheaper.

## Landing CDC into a lakehouse — the pattern

```
Source DB → DMS (full load + CDC) → S3 raw CDC events (I/U/D, with op + timestamp)
          → Spark/Glue job → MERGE INTO Iceberg silver table
```

```sql
MERGE INTO silver.customers t
USING (
  SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY op_ts DESC) rn
    FROM raw.cdc_customers WHERE op_ts > :watermark
  ) WHERE rn = 1                      -- last change per key wins
) s
ON t.id = s.id
WHEN MATCHED AND s.op = 'D' THEN DELETE
WHEN MATCHED               THEN UPDATE SET *
WHEN NOT MATCHED AND s.op <> 'D' THEN INSERT *
```

Two details that show experience:
1. **Deduplicate the batch before merging** — a key can change several times in one window; `ROW_NUMBER` by operation timestamp picks the final state.
2. **Idempotency** — the MERGE plus a watermark means re-running the batch is safe. That is what makes a backfill or a retry harmless.

Keep the raw CDC events in **bronze, append-only**: they are your audit trail and let you rebuild silver from scratch.

## Kinesis Streams vs Firehose vs DMS CDC — how you choose

| Requirement | Choice | Why |
|---|---|---|
| Sub-second, custom consumer logic | **Kinesis Data Streams** | shard-level ordering, replay from retention, multiple consumers |
| "Just get these logs into S3 as Parquet" | **Firehose** | managed, buffers ~60 s, batches/compresses/converts, no code |
| Real-time windowed aggregation | **Kinesis Data Analytics (Flink)** | stateful windows, event time |
| Keep a database in sync | **DMS CDC** | log-based, captures deletes |

The senior answer: **latency is a requirement, not a preference.** Ask what decision is made on the data. If nobody acts within a minute, Firehose micro-batching into S3 plus Spark is cheaper, simpler to backfill and easier to test than true streaming. Streaming costs you a 24/7 cluster, state sizing, small-file compaction and a harder on-call story — take it only when the business genuinely acts in seconds.

## HA and DR — say it in RPO/RTO terms

Never answer "we use Multi-AZ". Answer with the numbers:

| Mechanism | RPO | RTO | What it is for |
|---|---|---|---|
| **Multi-AZ** (synchronous standby) | ≈ 0 | 1–2 min, automatic | AZ failure, patching, instance failure |
| **Read replica** (async) | seconds (replica lag) | minutes, manual promote | read scaling; DR only as a fallback |
| **Cross-region replica** | seconds–minutes | minutes | regional disaster, data residency |
| **Automated backups / PITR** | up to 5 min (log-based) | 30–60 min restore | logical corruption, bad deploy |
| **Manual snapshots** | since last snapshot | 30–60 min | long-term retention, cross-region copy |

Key distinction interviewers probe: **Multi-AZ is availability, not scaling** — the standby serves no traffic. **Read replicas are scaling, not HA** — promotion is manual and lags.

On S3: 11 nines durability, versioning against accidental deletes, **Cross-Region Replication** for regional DR. Durability is not backup — a `DELETE` you issued yourself is still a delete; that is what versioning and object lock are for.

Then close with the discipline: **an untested DR plan is not a DR plan.** Run the failover in a game day, measure the actual RTO, write it down.

## Idempotent, re-runnable pipelines — the thing that gets you hired

Any senior data engineer answer must include this. A pipeline run must produce the same result whether it runs once or five times.

How you achieve it:
- **Partition overwrite** rather than append: `INSERT OVERWRITE` / `replaceWhere` / `mode("overwrite")` scoped to the partition being processed.
- **MERGE on a business key** for upserts, never blind appends.
- **Deterministic partition from the run parameters**, not `now()` — the DAG's logical date decides which partition is written, so a rerun of yesterday rewrites yesterday.
- **Deduplicate on read** with `ROW_NUMBER` by key and event timestamp.
- **Bronze stays append-only** so silver/gold can always be rebuilt.
- **Atomic publish**: write then commit (Iceberg/Delta commit, or write to a temp prefix and swap) so readers never see half a table.

Payoff to state explicitly: backfills, retries and late-arriving data all become routine instead of incidents. This is exactly what an Airflow retry needs to be safe.

## Data quality — where checks go and what breaks the pipeline

Placement:
- **On ingest (bronze)**: file arrived, non-zero size, expected row count magnitude, schema matches contract. Fail fast, before you spend compute.
- **In transform (silver)**: not-null on keys, uniqueness of the primary key, referential checks against dimensions, type/range validity, accepted values.
- **On publish (gold)**: reconciliation against the source (counts, sums per period), volume anomaly versus the trailing average, freshness SLA.

Severity is a design choice, and saying so is the senior part: **hard fail** for anything that would corrupt downstream tables (duplicate keys, missing partition), **warn and continue** for cosmetic issues, **quarantine** the bad rows to a rejects table rather than dropping them silently.

Tooling: Glue Data Quality (DQDL), Great Expectations, dbt tests, or plain assertions in the job. The tool matters less than **where the check sits and who gets paged**. Mention the reconciliation app you built comparing source counts against the Iceberg tables — that is a concrete, checkable claim.

## Cost optimisation — ordered by impact, with numbers

1. **Read less.** Parquet + partition pruning + column pruning. Athena bills $5/TB scanned: 1 TB of CSV scanned daily is ~$1,825/year; the same data as partitioned Parquet scanning ~3 GB/day is ~$5/year. That is the 99% saving, and it comes from format and layout, not from compute.
2. **Kill idle compute.** Transient EMR (create → run → terminate) instead of a long-running cluster; auto-terminate; EMR Serverless for spiky workloads.
3. **Spot for retryable work** — EMR task nodes, 60–90% off. Never the master, never SLA-critical single-attempt jobs.
4. **Commit where the load is steady** — Reserved Instances / Savings Plans on RDS and baseline compute (~30–40%).
5. **Incremental, not full reload.** Most expensive pipelines are recomputing history nobody asked for.
6. **Storage hygiene** — lifecycle to IA/Glacier, Iceberg `expire_snapshots`, compaction to cut small-file GET counts.
7. **Delete duplicated work** — one curated table many teams read, instead of five pipelines recomputing the same joins.

Then the professional move: **attribute cost before optimising.** Tags and cluster policies per pipeline, and you will find that a handful of jobs are most of the bill. Optimise those; ignore the rest.

## Securing a data lake — the layers, in the order you say them

1. **Identity**: IAM roles per service and per pipeline, least privilege scoped to specific actions and prefix ARNs. No long-lived keys; credentials from **Secrets Manager**; explicit `Deny` on sensitive prefixes such as PII.
2. **Encryption**: at rest with **SSE-KMS** (customer-managed keys, key policies, rotation, auditable use); in transit with TLS everywhere.
3. **Network**: private subnets for EMR/RDS/Glue connections, **VPC endpoints** for S3 (gateway, free) and Glue (interface) so lake traffic never touches the internet, security groups as tight as the traffic allows.
4. **Fine-grained access**: **Lake Formation** column- and row-level filters and LF-Tags — "analysts see every column except the document number".
5. **Guardrails**: S3 Block Public Access at the account level, bucket policies, versioning, object lock where retention is legally required.
6. **Audit**: **CloudTrail** for API calls, S3 access logs, and alerting on policy changes.
7. **Data-level treatment**: classify PII, mask or tokenise in silver, keep raw PII in a restricted prefix with its own key.

Close with the mindset: **security is a design input, not a review step.** In a consultancy that means the IaC ships the roles, keys and endpoints with the pipeline.

## IaC and CI/CD for data pipelines — what a good setup looks like

**IaC**: everything the pipeline needs is code — buckets, Glue databases and jobs, IAM roles, EMR configurations, Airflow/MWAA environment, alarms. **Terraform** for multi-account/multi-provider estates, **CDK** when the team prefers Python and stays AWS-native, **CloudFormation** when the client already standardised on it. State in **S3 + DynamoDB lock**, one workspace/state per environment, never edited by hand.

**Pipeline**: PR → lint (`ruff`) → **unit tests** on transforms with tiny in-memory DataFrames → integration test against a scratch environment → build artifact → deploy to staging → smoke test (run one small partition end to end) → deploy to prod. Credentials via **OIDC role assumption**, not stored keys.

**What makes data CI/CD different**, and worth saying: code is only half the deployment. You also version **schemas** (contracts, Iceberg evolution), **configuration** (table definitions, DAG parameters), and you need a **rollback story for data**, not just for code — time travel to a snapshot, or the ability to re-run a partition from bronze. That is why idempotency and append-only raw data are infrastructure decisions.

## The consultancy answer — how to talk about a client engagement

Caylent is a partner: you land in someone else's estate, often mid-migration, and have to deliver with incomplete information. Structure the answer that way.

1. **Discovery over assumption** — ask what the business needs to answer, what the uptime tolerance is, what the team can operate after you leave.
2. **Start simple, iterate** — a working Bronze→Silver slice in production beats a complete architecture diagram.
3. **Build for handover** — documentation, IaC, tests, runbooks. If the client cannot operate it, the project failed.
4. **Cost is a first-class requirement**, because it is the client's money and it shows up in every renewal conversation.
5. **Name the trade-off you chose and what would change it** — "Glue here because the team is small and the ETL is simple; EMR if the transforms grow or they need real Spark tuning".

Have one story ready in this shape: situation, the constraint that made it hard, what you chose, what you measured, what you would do differently. Interviewers grade the reasoning, not the tool list.
