# Airflow — Concepts & Recall

Open-answer cards. Say the answer out loud, then reveal. Source: lessons 01–18 in `Workspace/airflow`.

## Explain the Airflow execution model in one minute

Scheduler parses DAG files on a loop (default ~30s) and builds the DAG objects it finds in module globals. For each DAG it creates **DAG runs** per schedule interval, each carrying a **logical date** (the interval start). A run is triggered **after the interval closes** — `@daily` for `2024-03-01` fires early on `2024-03-02`.

Tasks become **task instances** (DAG id + task id + logical date). The scheduler queues instances whose upstream dependencies and `trigger_rule` are satisfied; an **executor** hands them to workers. State lives in the **metadata DB** — the worker holds no state between runs.

Consequence: task code must be idempotent and parameterised by the logical date, never by `datetime.now()`.

## Sensor: poke vs reschedule mode

`poke` — the task holds its worker slot and sleeps between checks. Fine for waits under a few minutes.

`reschedule` — the task instance goes back to `up_for_reschedule`, releases the slot, and is re-queued after `poke_interval`. Correct choice for hour-scale waits: a dozen `poke` sensors can deadlock a small pool.

Always set `timeout` plus a `soft_fail` decision: fail the run, or skip downstream.

```python
S3KeySensor(
    task_id="wait_raw_file",
    bucket_key="data/daily/{{ ds }}/file.csv",
    aws_conn_id="aws_default",
    mode="reschedule",
    poke_interval=300,
    timeout=14400,
)
```

## Trigger rules — the four you actually use

| Rule | Fires when | Use for |
|---|---|---|
| `all_success` (default) | every upstream succeeded | normal flow |
| `one_failed` | any upstream failed | failure alert branch |
| `all_done` | every upstream finished, any state | cleanup / teardown |
| `none_failed_min_one_success` | nothing failed, ≥1 succeeded | joins after branching |

Alert task with the default rule never fires — it is skipped when its upstream fails. That is the classic bug.

## Why top-level code in a DAG file is dangerous

The scheduler re-parses every DAG file on every loop. Top-level code therefore runs constantly, in the scheduler process, not on a worker.

Bad at top level: `Variable.get()`, DB queries, API calls, `pd.read_csv`, heavy imports.

Safe: read Variables **inside the task body**, or use Jinja in a templated field (`{{ var.value.my_key }}`) so the value resolves at runtime. Keep the module import-cheap.

## The validation sandwich

1. **Validate source** — file exists, row count above floor, schema matches, watermark advanced. Fail before touching the target.
2. **Process** — the transformation.
3. **Quality check** — nulls in key columns, duplicate business keys, row-count delta versus the previous run, totals reconcile.

Both gates must **raise** on failure. A check that returns `False` and logs a warning leaves the task green and ships bad data downstream.

## Idempotency in a task — the concrete patterns

Re-running the same logical date must produce the same result.

- **Delete-insert the partition**: `DELETE FROM t WHERE dt = '{{ ds }}'` then insert. Simple, works everywhere.
- **Upsert by business key**: `INSERT ... ON CONFLICT (key) DO UPDATE` (Postgres) or `MERGE` (Snowflake).
- **Overwrite partition** on object storage: write `dt={{ ds }}/` with overwrite, never append.

Anti-patterns: blind `INSERT`, `datetime.now()` as the partition value, auto-increment surrogate keys as the dedup key.

## XCom — limits and the right shape

XCom values are serialized into the metadata DB and pulled by downstream tasks. Small scalars only: row counts, S3 keys, table names, run flags.

Never push DataFrames or file contents — the DB grows, the scheduler slows, and pulls get expensive. Write the payload to S3/warehouse and push the **URI**.

TaskFlow does this implicitly: a `@task` function's return value is an XCom push, and passing it as an argument to another `@task` is the pull.

## Backfill: what breaks and why

Backfill replays past logical dates. Things that break it:

- `datetime.now()` anywhere in the transform — every replayed run reads today's data.
- `depends_on_past=True` — serializes the backfill and stalls on the first failure.
- Non-idempotent writes — every replay double-counts.
- Sensors waiting on files that no longer exist — use `soft_fail` or skip sensors during backfill.

Design rule: every task takes the date as a parameter (`{{ ds }}`) and writes exactly that partition.

## Retries, timeouts, and SLA — which knob for which failure

- `retries` + `retry_delay` + `retry_exponential_backoff` — transient failures (network, rate limit, brief outage).
- `execution_timeout` — a hung task; without it a stuck task holds a worker slot forever.
- `max_active_runs=1` at DAG level — runs must not overlap on a shared target table.
- `sla` — the run finished, but too late; it alerts without failing the task.

Retries do not fix a deterministic bug — three retries of bad SQL is three identical failures plus wasted time.

## Config-driven DAG factory — how and when

Airflow registers whatever DAG objects appear in a module's globals. So a loop over a YAML config can emit many DAGs from one file:

```python
for cfg in load_yaml("pipelines.yaml"):
    dag_id = cfg["dag_id"]
    globals()[dag_id] = build_dag(cfg)   # register in module globals
```

Use when a dozen pipelines share one shape and differ only in source/target/schedule. Avoid when each pipeline has bespoke logic — the factory then grows conditionals and becomes harder to read than plain DAGs.

Keep the factory import-cheap: parse local YAML, never call a DB or API to build the config.
