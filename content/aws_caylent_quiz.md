# AWS Data Services Quiz (Caylent)

DMS/SCT, Kinesis, RDS HA, S3, Glue vs EMR, Athena, Redshift, IaC, cost, security.
Ordered roughly by the weekend priority list — migration first.

---

## Questions

**1.** DMS migration type for a zero-downtime cutover:
- A) Full Load + CDC
- B) Full Load only
- C) Snapshot restore
- D) CDC only, no initial copy

**2.** DMS CDC reads changes from:
- A) The source transaction logs — redo logs on Oracle, WAL on PostgreSQL
- B) Periodic `SELECT *` polling
- C) Triggers installed on every table
- D) S3 event notifications

**3.** The DMS replication instance is:
- A) An EC2 instance DMS runs on, sized to the data volume
- B) A serverless Lambda
- C) A read replica of the source
- D) A Glue job

**4.** DMS table mappings are used to:
- A) Select schemas/tables and apply rename/filter transformation rules
- B) Store the migration state
- C) Convert stored procedures
- D) Define the replication instance size

**5.** SCT (Schema Conversion Tool) converts:
- A) Schema objects — tables, views, indexes, procedures, triggers, sequences, data types
- B) The data rows
- C) The network topology
- D) IAM policies

**6.** In a typical Oracle→PostgreSQL SCT assessment, the hardest part is:
- A) Stored procedures — SCT handles roughly 80%, the rest is manual PL/SQL → PL/pgSQL work
- B) Table DDL
- C) Index creation
- D) Sequence naming

**7.** Oracle `NUMBER` → PostgreSQL is a migration risk because:
- A) Precision and scale semantics differ, so `NUMERIC` mapping can silently change values
- B) PostgreSQL has no numeric type
- C) It always becomes text
- D) It is not supported

**8.** The 6 R's — moving Oracle on-prem into an S3/Iceberg lakehouse is:
- A) Re-architect
- B) Rehost (lift & shift)
- C) Re-platform
- D) Repurchase

**9.** Re-platform means:
- A) Same engine, now managed — Oracle on EC2 → RDS Oracle
- B) Rewriting the application
- C) Buying a SaaS product
- D) Keeping it on-prem

**10.** The safe order for a migration cutover:
- A) Assess with SCT → full load → enable CDC → parallel validation → cutover when CDC lag ≈ 0 → decommission after a bake period
- B) Cutover first, validate later
- C) CDC only, never a full load
- D) Restore a snapshot into production

**11.** Kinesis Data Streams shard capacity:
- A) 1 MB/s in and 2 MB/s out per shard
- B) 10 MB/s in per shard
- C) Unlimited
- D) 1 GB/s per stream

**12.** Kinesis Data Firehose latency floor:
- A) About 60 seconds — it buffers before delivering
- B) Sub-second
- C) 15 minutes
- D) 1 hour

**13.** "Deliver logs to S3 as Parquet with no code to maintain":
- A) Firehose, with an optional Lambda transform
- B) Kinesis Data Streams with a KCL consumer
- C) EMR Streaming
- D) DMS

**14.** "Sub-second custom processing of IoT events":
- A) Kinesis Data Streams
- B) Firehose
- C) Glue bookmarks
- D) Athena

**15.** Windowed SQL or Flink aggregations over a stream:
- A) Kinesis Data Analytics
- B) Kinesis Firehose
- C) Redshift Spectrum
- D) Step Functions

**16.** Default Kinesis Data Streams retention (extendable):
- A) 24 hours, up to 365 days
- B) 7 days fixed
- C) 1 hour
- D) Unlimited

**17.** RDS Multi-AZ gives you:
- A) A synchronous standby in another AZ with automatic failover — RPO ≈ 0, RTO ≈ 1–2 min
- B) Read scaling
- C) Cross-region DR
- D) Cheaper storage

**18.** RDS read replicas are:
- A) Asynchronous copies used to scale reads; replica lag means RPO in seconds
- B) Synchronous copies
- C) Automatic failover targets with zero data loss
- D) Backups

**19.** RPO stands for and measures:
- A) Recovery Point Objective — how much data loss is tolerable
- B) Recovery Process Order
- C) Replication Priority Objective
- D) How long recovery takes

**20.** RTO for restoring from a snapshot is typically:
- A) 30–60 minutes
- B) Seconds
- C) 1–2 minutes
- D) Zero

**21.** Aurora stores:
- A) 6 copies of the data across 3 AZs, with storage auto-scaling to 128 TB
- B) 2 copies in one AZ
- C) 3 copies in one AZ
- D) One copy plus a nightly snapshot

**22.** DB engine configuration in RDS (`max_connections`, `work_mem`) lives in:
- A) Parameter groups
- B) Option groups
- C) Security groups
- D) Subnet groups

**23.** S3 request-rate limits per prefix:
- A) ~5,500 GET/s and ~3,500 PUT/s — spread load across prefixes
- B) 100 requests/s total per bucket
- C) Unlimited, no partitioning needed
- D) 1,000 GET/s per bucket

**24.** S3 lifecycle policies exist to:
- A) Transition objects to IA/Glacier automatically as they age
- B) Encrypt objects
- C) Replicate across regions
- D) Trigger Lambda functions

**25.** S3 durability and Standard availability:
- A) 11 nines durability, 99.99% availability
- B) 99.9% durability
- C) 5 nines durability
- D) 100% both

**26.** Protection against an accidental object delete:
- A) Versioning
- B) A lifecycle policy
- C) Intelligent Tiering
- D) SSE-KMS

**27.** The Glue Data Catalog is:
- A) A managed metastore — the Hive Metastore equivalent, shared by Athena, EMR and Redshift Spectrum
- B) An ETL engine
- C) A query engine
- D) A storage class

**28.** Glue crawlers do what?
- A) Discover schema and partitions from S3/RDS and register tables in the Catalog
- B) Run PySpark transforms
- C) Move data between buckets
- D) Convert schemas between engines

**29.** Glue job bookmarks provide:
- A) Incremental processing — the job resumes from what it already consumed
- B) Job scheduling
- C) Cost tracking
- D) Version control

**30.** Choose EMR over Glue when:
- A) You need full cluster control, complex Spark tuning or ML — Glue is serverless but limited
- B) You want serverless
- C) You only need the catalog
- D) Startup time must be under a minute

**31.** Transient EMR clusters save money because:
- A) Airflow creates the cluster, submits the steps, and terminates it — no idle cluster hours
- B) They use cheaper storage
- C) They skip the master node
- D) Spot pricing is mandatory

**32.** EMR node type that is compute-only and the natural Spot candidate:
- A) Task nodes
- B) Master node
- C) Core nodes
- D) Edge node

**33.** Athena pricing model:
- A) $5 per TB **scanned** — Parquet, partitioning and compression cut it directly
- B) Per query, flat
- C) Per cluster-hour
- D) Per stored TB

**34.** Athena is built on:
- A) Trino (formerly Presto)
- B) Spark
- C) Hive MapReduce
- D) Redshift

**35.** Partition pruning in Athena requires:
- A) A filter on the partition column itself, on a partitioned table
- B) `SELECT *`
- C) A sort key
- D) A Glue crawler running per query

**36.** Athena CTAS is used to:
- A) Materialise a frequent query result as a new table, usually in Parquet
- B) Create an external table
- C) Copy data to Redshift
- D) Define a partition spec

**37.** Redshift distribution style `ALL` fits:
- A) Small dimension tables — a full copy on every node avoids the join shuffle
- B) The largest fact table
- C) Staging tables
- D) Anything with a unique key

**38.** Redshift distribution style `KEY` does what?
- A) Hashes rows by a column so matching join keys land on the same node
- B) Spreads rows round-robin
- C) Copies data everywhere
- D) Sorts data physically

**39.** Fastest bulk load into Redshift from S3:
- A) The `COPY` command with an IAM role
- B) Row-by-row `INSERT`
- C) A Glue Python shell job
- D) `UNLOAD`

**40.** Redshift Spectrum lets you:
- A) Query S3 data as external tables from Redshift, without loading it
- B) Auto-scale the cluster
- C) Stream from Kinesis
- D) Convert schemas

**41.** Lambda hard limits to remember:
- A) 15 minutes maximum execution, 10 GB memory
- B) 5 minutes, 3 GB
- C) 1 hour, 10 GB
- D) No limits

**42.** Classic serverless ingestion validation chain:
- A) S3 event → Lambda validates the file → starts a Glue job
- B) Glue → Lambda → S3
- C) Athena → Lambda → S3
- D) Redshift → Lambda → S3

**43.** Step Functions versus Airflow:
- A) Step Functions is serverless and priced per state transition, best for AWS-native workflows; Airflow handles complex multi-system DAGs
- B) Step Functions is better for multi-cloud
- C) They are the same service
- D) Airflow cannot orchestrate AWS

**44.** Medallion layers, in order:
- A) Bronze raw and append-only → Silver deduplicated and typed → Gold aggregated business models
- B) Gold → Silver → Bronze
- C) Raw → Gold → Silver
- D) Staging → Bronze → Warehouse

**45.** Bronze partitioning versus Silver partitioning, typically:
- A) Bronze by ingestion date, Silver by business date
- B) Both by ingestion date
- C) Bronze by business date, Silver by ingestion date
- D) Neither is partitioned

**46.** Iceberg gives you on top of Parquet:
- A) ACID commits, schema and partition evolution, time travel, hidden partitioning, compaction
- B) Columnar storage
- C) Compression
- D) A query engine

**47.** Iceberg partition evolution means:
- A) You can change the partition spec (days → months) without rewriting existing data
- B) Partitions are rewritten nightly
- C) Partitions cannot change
- D) Data must be reloaded

**48.** Iceberg hidden partitioning means:
- A) Queries filter on the raw column and Iceberg derives the partition — no `WHERE dt=` boilerplate
- B) Partitions are encrypted
- C) Partition columns are dropped
- D) Only admins see partitions

**49.** CDC events merged into an Iceberg table use:
- A) `MERGE INTO ... WHEN MATCHED UPDATE / DELETE, WHEN NOT MATCHED INSERT`
- B) `INSERT OVERWRITE` of the whole table
- C) `TRUNCATE` then insert
- D) `COPY`

**50.** Iceberg housekeeping that keeps costs and metadata sane:
- A) `rewrite_data_files` for compaction and `expire_snapshots` to drop old snapshots
- B) Versioning
- C) Lifecycle policies only
- D) Vacuuming the Glue Catalog

**51.** Lambda architecture (the data pattern, not the service):
- A) A batch layer plus a speed layer merged at serving — handles late data, but two codebases
- B) Streaming only
- C) Batch only
- D) A Lambda function per table

**52.** Kappa architecture reprocesses history by:
- A) Replaying the stream through the same streaming code
- B) Running a separate batch job
- C) Restoring a snapshot
- D) It cannot reprocess

**53.** Terraform state should be stored:
- A) Remotely in S3 with a DynamoDB lock table, and never hand-edited
- B) Locally in git
- C) In the resource tags
- D) Anywhere, it is disposable

**54.** `terraform plan` does what?
- A) Previews the changes without applying them
- B) Applies changes
- C) Downloads providers
- D) Destroys resources

**55.** CDK differs from CloudFormation by:
- A) Letting you define infrastructure in Python/TypeScript, which synthesises to CloudFormation
- B) Not using CloudFormation at all
- C) Being multi-cloud
- D) Managing state in S3

**56.** A sane CI/CD order for a data pipeline repo:
- A) Lint → unit tests → integration tests → build → deploy to staging → smoke test → deploy to prod
- B) Deploy → test → lint
- C) Build → deploy → unit tests
- D) Tests only in production

**57.** Biggest Athena/S3 cost lever:
- A) Read less — Parquet, partition pruning, compaction, incremental loads
- B) Bigger instances
- C) More concurrency
- D) Longer retention

**58.** Spot instances are appropriate for:
- A) Fault-tolerant, retryable batch work such as EMR task nodes — 60–90% cheaper
- B) The EMR master node
- C) Production RDS
- D) Anything latency-critical

**59.** Parquet versus CSV on a data lake:
- A) 75–90% smaller and columnar, so Athena scans a fraction of the bytes
- B) Slower to query
- C) Row-oriented
- D) No schema

**60.** Least privilege in practice means:
- A) Each service role gets only the actions and resource ARNs it needs — e.g. `s3:GetObject` on one prefix
- B) One admin role shared by all jobs
- C) Public bucket policies
- D) Long-lived access keys in the code

**61.** SSE-KMS versus SSE-S3:
- A) SSE-KMS uses a customer-managed key with auditable, controllable access; SSE-S3 uses an AWS-managed key
- B) SSE-S3 is stronger
- C) Only SSE-KMS encrypts at rest
- D) They are identical

**62.** An S3 **gateway** VPC endpoint gives you:
- A) Private access to S3 from private subnets with no NAT/internet, at no hourly cost
- B) A public IP
- C) Cross-region replication
- D) Column-level security

**63.** Lake Formation adds:
- A) Fine-grained column- and row-level access, plus tag-based access control over catalog data
- B) Encryption at rest
- C) Query caching
- D) Cluster autoscaling

**64.** Never do this with database credentials:
- A) Hardcode them in the job — use Secrets Manager
- B) Rotate them
- C) Store them in Secrets Manager
- D) Grant access through an IAM role

**65.** CloudTrail's role in securing a data lake:
- A) Audit logging of API calls — who did what, when
- B) Encrypting data
- C) Filtering rows
- D) Blocking public access

**66.** In the OOP pipeline pattern, `extract` / `transform` are abstract while `validate` / `load` have defaults because:
- A) Every source differs, but quality checks and idempotent writes are shared behaviour worth inheriting
- B) Abstract methods are faster
- C) You cannot override concrete methods
- D) Spark requires it

**67.** A pytest fixture with `scope="session"` for the Spark session:
- A) Creates one SparkSession reused across every test — session startup is the slow part
- B) Creates a new session per test
- C) Runs only once per file
- D) Disables Spark

**68.** Testing that a transform drops duplicates and null ids means:
- A) Building a small in-memory DataFrame with those exact defects and asserting the output count
- B) Running the job in production
- C) Checking the Spark UI
- D) Mocking Spark entirely

**69.** `pytest.raises(ValueError, match="Empty DataFrame")` verifies:
- A) That the validation step fails loudly on an empty result — the failure path is tested too
- B) That the pipeline succeeds
- C) That Spark is installed
- D) Performance

**70.** Skew signature in the Spark UI:
- A) One task takes far longer than the median in the same stage
- B) High GC across all tasks
- C) Many small stages
- D) Low shuffle write

**71.** `Spill (Disk) > 0` in a stage means:
- A) Partitions are too big for the execution memory — raise shuffle partitions or reduce data per task
- B) The job failed
- C) Caching is disabled
- D) Too few files

**72.** Coalesce before write is used to:
- A) Avoid a small-file storm in the output
- B) Speed up the shuffle
- C) Increase parallelism
- D) Enable pruning

**73.** `EXISTS` is often preferred over `IN` with a large subquery because:
- A) It can short-circuit per row and the optimiser handles it as a semi-join
- B) `IN` is invalid SQL there
- C) `EXISTS` returns more rows
- D) It avoids indexes

**74.** Deduplicating to the latest row per key in SQL:
- A) `ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC)` then keep `rn = 1`
- B) `DISTINCT`
- C) `GROUP BY key`
- D) `RANK()` and keep everything

**75.** Asked to design a platform for a new customer, start with:
- A) The business questions to answer, then work backwards through sources, ingestion, storage, processing, serving
- B) Choosing the compute engine
- C) Writing Terraform
- D) Picking the file format

## Answer key

1 - A
2 - A
3 - A
4 - A
5 - A
6 - A
7 - A
8 - A
9 - A
10 - A
11 - A
12 - A
13 - A
14 - A
15 - A
16 - A
17 - A
18 - A
19 - A
20 - A
21 - A
22 - A
23 - A
24 - A
25 - A
26 - A
27 - A
28 - A
29 - A
30 - A
31 - A
32 - A
33 - A
34 - A
35 - A
36 - A
37 - A
38 - A
39 - A
40 - A
41 - A
42 - A
43 - A
44 - A
45 - A
46 - A
47 - A
48 - A
49 - A
50 - A
51 - A
52 - A
53 - A
54 - A
55 - A
56 - A
57 - A
58 - A
59 - A
60 - A
61 - A
62 - A
63 - A
64 - A
65 - A
66 - A
67 - A
68 - A
69 - A
70 - A
71 - A
72 - A
73 - A
74 - A
75 - A

### One-line rationales

1. **Full Load + CDC**: initial copy, then continuous sync until lag is zero — cut over with near-zero downtime.
2. CDC is **log-based** (Oracle redo, PostgreSQL WAL) — no polling, no triggers, low source impact.
3. The replication instance is an **EC2** box; undersize it and CDC falls behind.
4. **Table mappings** = selection rules plus transformation rules (rename, filter, schema mapping).
5. **SCT converts schema objects**, not data. DMS moves the data.
6. **Stored procedures** are the manual work — plan for ~20% rewrite.
7. Oracle `NUMBER` is variable precision; mapping to `NUMERIC` needs explicit precision/scale review.
8. Oracle on-prem → S3/Iceberg lakehouse is a **Re-architect** — new storage model and new engine.
9. **Re-platform** = same engine, managed service.
10. Assess → full load → CDC → **parallel validation** → cutover at zero lag → decommission after a bake period.
11. **1 MB/s in, 2 MB/s out per shard** — shard count is your capacity dial.
12. Firehose buffers, so **~60 s** is the floor. Near-real-time, not real-time.
13. **Firehose** auto-batches, compresses, converts to Parquet and encrypts — configuration, not code.
14. Sub-second with custom consumers = **Kinesis Data Streams**.
15. **Kinesis Data Analytics** runs SQL or Flink windowed aggregations on the stream.
16. **24 h default, up to 365 days** — longer retention buys replay.
17. **Multi-AZ = synchronous standby**, automatic failover: RPO ≈ 0, RTO ≈ 1–2 min.
18. Read replicas are **asynchronous** — read scaling, with lag as the data-loss window.
19. **RPO = tolerable data loss**; RTO = tolerable downtime.
20. Snapshot restore is the slow path: **30–60 min**.
21. Aurora keeps **6 copies over 3 AZs** and grows storage to 128 TB automatically.
22. **Parameter groups** hold engine configuration.
23. **~5,500 GET/s, ~3,500 PUT/s per prefix** — spread hot paths across prefixes.
24. **Lifecycle policies** age data into IA and Glacier without a job.
25. **11 nines durability**, 99.99% availability on Standard.
26. **Versioning** keeps the previous version when something is deleted or overwritten.
27. The **Glue Catalog** is the shared managed metastore.
28. **Crawlers** infer schema and partitions and register tables.
29. **Bookmarks** track processed data for incremental runs.
30. **EMR** for control, complex tuning and ML; Glue for serverless simple ETL and the catalog.
31. **Transient clusters** pay only for the run — Airflow creates, submits, terminates.
32. **Task nodes** hold no HDFS data, so losing one to a Spot reclaim is survivable.
33. Athena bills **$5/TB scanned** — every optimisation is about scanning less.
34. Athena is **Trino/Presto** under the hood.
35. Pruning needs a **partitioned table filtered on the partition column** itself.
36. **CTAS** materialises results (usually Parquet) so repeat queries scan less.
37. **`ALL`** replicates small dimensions everywhere, removing the join shuffle.
38. **`KEY`** hash-distributes so matching join keys co-locate.
39. **`COPY` from S3** is the fastest bulk load, parallel across slices.
40. **Spectrum** queries S3 external tables from Redshift.
41. Lambda caps at **15 min / 10 GB** — anything longer belongs in Glue, EMR or Fargate.
42. **S3 event → Lambda validation → Glue job** is the canonical guardrail at the landing zone.
43. **Step Functions**: serverless, per state transition, AWS-native. **Airflow**: complex, multi-system, per environment hour.
44. **Bronze raw/append-only → Silver clean/typed/deduped → Gold aggregated business models.**
45. Bronze partitions by **ingestion date** (what arrived), Silver by **business date** (what happened).
46. Iceberg is a **table format**: ACID, evolution, time travel, hidden partitioning, compaction.
47. **Partition evolution** changes the spec going forward, without rewriting history.
48. **Hidden partitioning** derives partition values from the column, so queries stay natural.
49. **`MERGE INTO`** applies I/U/D CDC rows idempotently.
50. **`rewrite_data_files`** compacts, **`expire_snapshots`** reclaims storage and metadata.
51. **Lambda architecture** = batch + speed layers merged; robust to late data, two codebases to keep in sync.
52. **Kappa** replays the stream through one codebase — reprocessing is a rewind.
53. Terraform state belongs in **S3 with DynamoDB locking**, never edited by hand.
54. **`plan`** is the dry run you read before applying.
55. **CDK** is real code that synthesises CloudFormation templates.
56. **Lint → unit → integration → build → staging → smoke → prod.** Fail cheap, fail early.
57. **Read less** — the single biggest lever on any scan-priced platform.
58. **Spot for retryable batch** (EMR task nodes); never the driver/master or production RDS.
59. **Parquet** is columnar and compressed: far fewer bytes scanned per query.
60. **Least privilege** = specific actions on specific ARNs, per role.
61. **SSE-KMS** = customer-managed key, key policies and CloudTrail auditing; SSE-S3 = AWS-managed.
62. An **S3 gateway endpoint** is private and free — no NAT charges for lake traffic.
63. **Lake Formation** provides column/row filters and LF-Tag based access control.
64. **Secrets Manager** or an IAM role — never a hardcoded credential.
65. **CloudTrail** answers "who called what" — the audit trail.
66. Sources differ (abstract `extract`/`transform`); **validation and idempotent writes are shared** and inherited.
67. `scope="session"` builds the SparkSession **once** — otherwise test time is all startup.
68. Tiny in-memory DataFrames with the **exact defects**, asserting counts — fast, deterministic unit tests.
69. Asserting the **raise** proves the guardrail works, not just the happy path.
70. **One straggler task** versus the median in a stage = skew.
71. **Spill** means partitions exceed execution memory — resize partitions before adding memory.
72. **Coalesce before write** prevents the small-file storm that kills read performance.
73. **`EXISTS`** becomes a semi-join and stops at the first match.
74. **`ROW_NUMBER` + `rn = 1`** is the standard latest-per-key dedup.
75. Start from the **business questions**, then work backwards — architecture follows requirements.
