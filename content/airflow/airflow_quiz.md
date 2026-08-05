# Airflow — Concept Quiz

Multiple choice over lessons 01–18 (`Workspace/airflow`). Answer first, key at the bottom.

---

## Questions

**1.** `poke_interval` and `mode="reschedule"` on a sensor exist to:
- A) Speed up the sensor
- B) Free the worker slot between checks instead of holding it idle
- C) Retry the DAG
- D) Set the schedule interval

**2.** In TaskFlow API, data passed between `@task` functions travels via:
- A) Global variables
- B) XCom (serialized, stored in the metadata DB)
- C) The local filesystem
- D) Airflow Variables

**3.** `{{ ds }}` inside `bucket_key="data/{{ ds }}/file.csv"` is replaced:
- A) When the DAG file is parsed
- B) At task runtime, with the logical/execution date
- C) At import time
- D) Never — it is a literal string

**4.** `ExternalTaskSensor` needs `execution_delta` because:
- A) It retries faster
- B) It looks for the upstream DAG run at the *same* logical date by default, so a schedule offset must be declared
- C) It cannot cross DAGs otherwise
- D) It sets the timeout

**5.** `depends_on_past=True` means:
- A) The task waits for upstream tasks
- B) The task instance only runs if the same task succeeded in the previous DAG run
- C) The DAG runs only once
- D) Backfill is disabled

**6.** Default `trigger_rule` for a task is:
- A) all_done  B) all_success  C) one_failed  D) none_failed

**7.** A failure-notification task wired after processing must use:
- A) all_success  B) one_failed  C) always  D) none_skipped

**8.** A cleanup task that must run whether upstream passed or failed uses:
- A) all_done  B) all_success  C) one_success  D) dummy

**9.** `Variable.get("x")` called at the top level of a DAG file is bad because:
- A) It returns None
- B) It hits the metadata DB on every scheduler parse (every ~30s), per DAG
- C) Variables cannot be read in DAGs
- D) It breaks Jinja

**10.** Safe way to read a Variable without parse-time DB hits:
- A) `Variable.get` inside the task function, or Jinja `{{ var.value.x }}` in a templated field
- B) Hardcode it
- C) Environment variable only
- D) `Variable.set` in the DAG body

**11.** `catchup=False` on a DAG means:
- A) Failed runs are not retried
- B) Missed intervals between `start_date` and now are not backfilled — only the current interval runs
- C) The DAG never runs
- D) Retries are disabled

**12.** `schedule="0 6 * * 1-5"` fires:
- A) Every 6 hours
- B) 06:00 on weekdays (Mon–Fri)
- C) Every Monday at 6
- D) Six times a day

**13.** With `schedule="@daily"`, a run with logical date `2024-03-01` is triggered:
- A) At the start of 2024-03-01
- B) After the interval ends — early on 2024-03-02
- C) Immediately on deploy
- D) Manually only

**14.** Hooks (`S3Hook`, `PostgresHook`) exist mainly to:
- A) Replace operators
- B) Wrap connection handling — credentials come from `conn_id`, never hardcoded
- C) Schedule tasks
- D) Store XComs

**15.** `PostgresHook.get_pandas_df(sql)` vs `run(sql)`:
- A) Identical
- B) `get_pandas_df` returns a DataFrame from a SELECT; `run` executes DDL/DML with no result set
- C) `run` returns rows
- D) `get_pandas_df` writes data

**16.** The "validation sandwich" pattern is:
- A) validate source → process → quality-check output
- B) Three retries
- C) Two sensors around a task
- D) Nested DAGs

**17.** A quality check that must stop the pipeline on failure should:
- A) Log a warning
- B) Raise an exception (or `AirflowFailException`) so the task fails and downstream stops
- C) Return False
- D) Send an email and continue

**18.** `retries=3` with `retry_delay=timedelta(minutes=5)` and `retry_exponential_backoff=True` gives:
- A) Three retries 5 min apart
- B) Growing gaps — roughly 5, 10, 20 min
- C) Immediate retries
- D) One retry

**19.** `t1 >> [t2, t3] >> t4` means:
- A) t2 and t3 run in parallel after t1; t4 waits for both
- B) Sequential t1→t2→t3→t4
- C) t4 runs first
- D) Invalid syntax

**20.** Calling `spark-submit` via `subprocess.run(...)` inside a `@task` requires checking:
- A) Nothing, Airflow handles it
- B) `returncode` — a non-zero exit must raise, or the task falsely succeeds
- C) Only stdout
- D) The DAG timeout

**21.** Task-level `execution_timeout` protects against:
- A) Bad SQL
- B) A hung task holding a worker slot forever
- C) Import errors
- D) Backfill

**22.** DAG-level `max_active_runs=1` is used when:
- A) Tasks are slow
- B) Runs must not overlap — e.g. incremental loads writing the same target table
- C) There is one task
- D) Retries are on

**23.** Idempotency in an Airflow task means:
- A) The task runs once ever
- B) Re-running the same logical date produces the same result — delete-insert partition or upsert by key
- C) No XCom is used
- D) It never fails

**24.** A config-driven DAG factory (`dag_factory.py` + YAML) works because:
- A) Airflow parses the file and registers every DAG object found in the module globals
- B) YAML is faster
- C) Airflow reads YAML natively
- D) DAGs cannot be generated

**25.** XCom is the wrong tool for:
- A) Small scalars like a row count or file path
- B) Large payloads (whole DataFrames) — they land in the metadata DB; pass a path/URI instead
- C) Task IDs
- D) Dates

---

## Answer key

1-B · 2-B · 3-B · 4-B · 5-B · 6-B · 7-B · 8-A · 9-B · 10-A · 11-B · 12-B · 13-B · 14-B · 15-B · 16-A · 17-B · 18-B · 19-A · 20-B · 21-B · 22-B · 23-B · 24-A · 25-B

### One-line rationales (the reusable idea)
1. **reschedule mode** releases the slot between pokes; `poke` mode holds it. Long waits → always reschedule.
2. **XCom** is the TaskFlow return channel — serialized into the metadata DB, so keep it small.
3. **Jinja renders at runtime**, per task instance. That is why `{{ ds }}` makes a task re-runnable for any date.
4. **execution_delta** aligns logical dates across DAGs on different schedules.
5. **depends_on_past** serializes a task across runs — needed for stateful incremental loads, deadly for backfills.
6. **all_success** is the default trigger rule.
7. **one_failed** fires the alert branch as soon as any upstream fails.
8. **all_done** runs regardless of upstream state — cleanup / teardown.
9. Top-level code runs on **every scheduler parse**; DB calls there hammer the metadata DB.
10. Read Variables **inside tasks** or via **Jinja templating** — both defer to runtime.
11. **catchup=False** skips the backlog between `start_date` and now.
12. Cron fields: `min hour dom month dow` → `0 6 * * 1-5` = 06:00 weekdays.
13. Airflow runs an interval **after it closes** — logical date is the interval start.
14. **Hooks** wrap auth + client setup behind `conn_id`. Credentials live in Connections.
15. `get_pandas_df` = SELECT → DataFrame; `run` = execute statement, no rows back.
16. **Validation sandwich**: check inputs before, check outputs after, fail loudly.
17. A quality gate must **raise**; returning False silently passes the task.
18. **Exponential backoff** doubles the delay — good against rate limits and flaky APIs.
19. **List in bitshift** = fan-out then fan-in.
20. `subprocess` does not fail the task by itself — inspect **returncode** and raise.
21. **execution_timeout** kills hung tasks and frees the slot.
22. **max_active_runs=1** prevents concurrent runs racing on the same target.
23. **Idempotent** = safe re-run at the same logical date; the core of backfillable pipelines.
24. Airflow scans **module globals** for DAG objects — so loops/factories register many DAGs.
25. Big data through XCom bloats the DB — pass **pointers** (S3 key, table name), not payloads.
