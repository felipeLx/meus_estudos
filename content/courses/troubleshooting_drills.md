# Troubleshooting & Automation — Drills

Write the script before revealing. These are the shapes the Coursera module asks for, plus the
debugging tasks that come up in real interviews.

## System health report with psutil

<!-- difficulty: 2 -->
Write `health_check()` that returns a dict with CPU percent, memory percent, free disk GB on `/`,
and a list of warnings when CPU > 80%, memory > 90%, or free disk < 10%. Exit non-zero if any
warning fires.

### Solution

```python
import sys
import psutil

THRESHOLDS = {"cpu": 80.0, "memory": 90.0, "min_free_gb": 10.0}

def health_check(path: str = "/") -> dict:
    cpu = psutil.cpu_percent(interval=1)          # interval=1 -> real sample, not 0.0
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(path)
    free_gb = disk.free / 1024**3

    warnings = []
    if cpu > THRESHOLDS["cpu"]:
        warnings.append(f"CPU at {cpu:.0f}%")
    if mem.percent > THRESHOLDS["memory"]:
        warnings.append(f"memory at {mem.percent:.0f}%")
    if free_gb < THRESHOLDS["min_free_gb"]:
        warnings.append(f"only {free_gb:.1f} GB free on {path}")

    return {"cpu": cpu, "memory": mem.percent, "free_gb": round(free_gb, 1),
            "warnings": warnings}

if __name__ == "__main__":
    report = health_check()
    for w in report["warnings"]:
        print(f"WARNING: {w}", file=sys.stderr)
    sys.exit(1 if report["warnings"] else 0)
```

Traps: `cpu_percent()` with no interval returns `0.0` on the first call (it needs two samples);
`disk_usage` is space, `disk_io_counters` is throughput; exit codes are how a monitoring system
reads a check script.

## Turn cumulative I/O counters into a rate

<!-- difficulty: 3 -->
`psutil.disk_io_counters()` and `net_io_counters()` are cumulative since boot. Print read MB/s,
write MB/s and network receive MB/s once per second.

### Solution

```python
import time
import psutil

def io_rates(interval: float = 1.0):
    d0, n0 = psutil.disk_io_counters(), psutil.net_io_counters()
    t0 = time.monotonic()
    while True:
        time.sleep(interval)
        d1, n1 = psutil.disk_io_counters(), psutil.net_io_counters()
        t1 = time.monotonic()
        dt = t1 - t0
        yield {
            "read_mbs":  (d1.read_bytes  - d0.read_bytes)  / dt / 1024**2,
            "write_mbs": (d1.write_bytes - d0.write_bytes) / dt / 1024**2,
            "recv_mbs":  (n1.bytes_recv  - n0.bytes_recv)  / dt / 1024**2,
        }
        d0, n0, t0 = d1, n1, t1

for r in io_rates():
    print(f"r={r['read_mbs']:6.2f} w={r['write_mbs']:6.2f} net={r['recv_mbs']:6.2f} MB/s")
```

Use `time.monotonic()` for elapsed time — `time.time()` can jump backwards on NTP correction.

## Parallelise CPU-bound work correctly

<!-- difficulty: 3 -->
`checksum(path)` is CPU-bound (hashing). Compute it for 10 000 files using all cores, streaming
results as they finish, with a progress count. Then say why `threading` would not help.

### Solution

```python
import hashlib
import os
from concurrent.futures import ProcessPoolExecutor, as_completed

def checksum(path: str) -> tuple[str, str]:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):   # stream, don't load the file
            h.update(chunk)
    return path, h.hexdigest()

def checksum_all(paths: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as pool:
        futures = {pool.submit(checksum, p): p for p in paths}
        for done, fut in enumerate(as_completed(futures), 1):
            try:
                path, digest = fut.result()
                out[path] = digest
            except OSError as exc:                 # one bad file must not kill the run
                print(f"skip {futures[fut]}: {exc}")
            if done % 500 == 0:
                print(f"{done}/{len(paths)}")
    return out

if __name__ == "__main__":                          # required on spawn platforms
    ...
```

Equivalent with the module the course teaches: `with Pool(os.cpu_count()) as pool:
pool.imap_unordered(checksum, paths)`. Threads would not help: the GIL serialises Python bytecode,
so hashing in threads uses one core. (Hashing large buffers does release the GIL inside OpenSSL —
but the general rule stands: CPU-bound → processes.)

## Fix the slow function — profile first

<!-- difficulty: 3 -->
This takes 40 s on 200 000 rows. Find the bottleneck and fix it. Say which tool proves it.

```python
def enrich(rows, blocked_ids):
    out = ""
    for row in rows:
        if row["id"] in blocked_ids:      # blocked_ids is a list of 50k ids
            continue
        out += f"{row['id']},{row['name']}\n"
    return out
```

### Solution

```bash
python -m cProfile -s cumtime job.py | head -20     # shows time inside enrich / list __contains__
```

Two O(n²) bugs:

```python
def enrich(rows, blocked_ids):
    blocked = set(blocked_ids)                       # O(1) membership instead of O(n)
    parts = []                                       # no quadratic string concat
    for row in rows:
        if row["id"] in blocked:
            continue
        parts.append(f"{row['id']},{row['name']}")
    return "\n".join(parts) + "\n"
```

`row["id"] in list` scans 50 000 entries per row; `out +=` rebuilds the whole string every
iteration. Both are algorithmic, not constant-factor — which is why profiling then fixing the
dominant term beats micro-tuning. Re-measure after the change: that number is the deliverable.

## Find the memory leak

<!-- difficulty: 4 -->
A long-running worker grows from 200 MB to 4 GB over a day. Show how you would locate the cause
in Python, and name three usual suspects.

### Solution

```python
import tracemalloc, psutil, os

tracemalloc.start(25)                     # keep 25 frames of traceback per allocation
snap1 = tracemalloc.take_snapshot()
...run a batch...
snap2 = tracemalloc.take_snapshot()

for stat in snap2.compare_to(snap1, "lineno")[:10]:
    print(stat)                           # +MB by source line -> the growing structure

print(psutil.Process(os.getpid()).memory_info().rss / 1024**2, "MB RSS")
```

Usual suspects: an unbounded module-level cache or list that is appended to per item; an
`lru_cache` with no `maxsize` (and on a method, it pins every `self`); accumulating results
instead of streaming them (`results.append(df)` in a loop). Also check for handlers/callbacks
registered per iteration.

Fixes: `functools.lru_cache(maxsize=10_000)`, generators instead of lists, chunked writes, and
`__slots__` when there are millions of small objects. Confirm with the same RSS curve after the fix.

## Diagnose a hung process

<!-- difficulty: 4 -->
A Python job has been "running" for 3 hours with 0% CPU and produced no output. Walk through
finding out what it is waiting on, without restarting it.

### Solution

```bash
ps -o pid,stat,etime,wchan -p $PID       # state D = uninterruptible I/O wait, S = sleeping
py-spy dump --pid $PID                    # Python stack of every thread — the real answer
strace -p $PID                            # syscall it is blocked in (read, connect, futex)
lsof -p $PID                              # which file or socket it holds
ss -tanp | grep $PID                      # is a TCP connection stuck in ESTABLISHED/SYN_SENT?
```

Inside your own code, arm it in advance:

```python
import faulthandler
faulthandler.enable()                     # SIGABRT/SIGSEGV dump a Python traceback
faulthandler.dump_traceback_later(300, repeat=True)   # dump stacks every 5 min if still alive
```

Most common causes: a network call with **no timeout**, a lock held by another thread (deadlock),
an unbounded queue with no consumer, and waiting on a child process that never exits. The
permanent fix is a timeout on every external call, not a bigger retry loop.

## Make a flaky script debuggable

<!-- difficulty: 2 -->
A script fails intermittently in production and only prints "failed". Rewrite the logging and
error handling so that the next failure is diagnosable on the first look.

### Solution

```python
import logging
import sys
import uuid

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s [%(process)d] %(message)s",
    stream=sys.stdout,                       # containers collect stdout
)
log = logging.getLogger(__name__)

def process(batch_id: str, items: list[dict]) -> None:
    run_id = uuid.uuid4().hex[:8]
    log.info("start batch=%s run=%s items=%d", batch_id, run_id, len(items))
    failures = 0
    for i, item in enumerate(items):
        try:
            handle(item)
        except RetryableError:
            log.warning("retryable batch=%s run=%s idx=%d id=%s",
                        batch_id, run_id, i, item.get("id"))
            raise
        except Exception:
            failures += 1
            log.exception("item failed batch=%s run=%s idx=%d id=%s",
                          batch_id, run_id, i, item.get("id"))   # message + traceback
    log.info("done batch=%s run=%s failures=%d", batch_id, run_id, failures)
```

Rules: log the **identifiers** you would need to reproduce (batch, index, record id), never the
whole record if it holds PII; `logging.exception` inside `except` to keep the traceback; one
correlation id per run; lazy `%s` formatting so DEBUG lines cost nothing when disabled; and
`WARNING` for degraded, `ERROR` for failed work.

## rsync backup with verification

<!-- difficulty: 2 -->
Write a backup command set that mirrors `/data` to a remote host nightly: resumable, compressed,
preview before deleting, and a log of what changed.

### Solution

```bash
# 1. preview — never mirror blind
rsync -avz --delete --dry-run /data/ backup@host:/backups/data/

# 2. real run: archive, compress, partial+progress, log, exclude junk
rsync -avzP --delete \
      --exclude '*.tmp' --exclude '.cache/' \
      --log-file=/var/log/backup-$(date +%F).log \
      /data/ backup@host:/backups/data/

# 3. verify a sample
ssh backup@host 'find /backups/data -newermt "-1 day" | wc -l'
```

`-a` preserves permissions/ownership/timestamps/symlinks, `-z` compresses in transit, `-P` gives
progress and resumes partial transfers, `--delete` makes it a true mirror (which is exactly why
the dry run comes first). The trailing slash on `/data/` copies the contents, not the directory.
Because rsync compares size and mtime and ships only deltas, the second night is cheap.

## Classify the bottleneck from the symptoms

<!-- difficulty: 3 -->
For each: name the bound and the one command you would run to confirm it.

1. Job takes 40 min; one core at 100%, 15 others idle.
2. Job slows down over hours; swap climbing; everything on the box gets slow.
3. Job reads 200 000 small files from network storage; CPU at 8%.
4. API p99 is 3 s; the service is idle; the downstream call is 2.9 s.
5. 16 threads running, throughput no better than 2 threads, CPU at 15%.

### Solution

1. **CPU-bound, single-threaded** — `top` (one core pinned). Fix: better algorithm, then
   `ProcessPoolExecutor`.
2. **Memory-bound / leak** — `free -h` and `vmstat 1` (swap in/out non-zero); `tracemalloc` in the
   process. Fix: bound the memory, stream instead of accumulate.
3. **I/O-bound, and the small-files problem** — `iostat -x` / `iotop`, plus latency per request.
   Fix: fewer, bigger reads; batch; compact.
4. **Network-bound / downstream latency** — `curl -w "%{time_total}"` against the dependency, and
   distributed traces. Fix: timeout, cache, parallelise, or push the work upstream.
5. **Lock-bound (or GIL-bound)** — low CPU with high thread count; `py-spy dump` shows threads in
   `acquire`. Fix: shrink the critical section, or move to processes.

The pattern to say out loud: *"I name the bound before I change anything, because each bound has a
different fix and the wrong fix makes it worse."*

## Write the bug report

<!-- difficulty: 2 -->
You applied a workaround (restarting the exporter clears it). Now write the report the developers
need — the step the course says people forget.

### Solution

```markdown
**Title:** Metrics exporter stops publishing after ~6 h; restart clears it

**Environment:** exporter 2.4.1, Python 3.11.6, Ubuntu 22.04, container image sha256:ab12…,
prod cluster eu-west-1, ~4 000 series

**Impact / severity:** S2 — dashboards and alerting go blind for the affected shard until a
restart. 3 occurrences in 5 days. Alerting on this service is effectively disabled meanwhile.

**Steps to reproduce:** run exporter with `--interval 15s` against ≥4 000 series; wait ~6 h.
Reproduced 3/3 times in staging with the same config.

**Expected:** metrics published every 15 s indefinitely.
**Actual:** publishing stops silently; process alive, 0% CPU, no error logged.

**Evidence:** `py-spy dump` shows all threads blocked in `queue.Queue.put` (attached);
RSS flat; last successful publish at 06:12 UTC (log excerpt attached); `ss` shows the
upstream connection in ESTABLISHED with no traffic.

**Suspected cause:** publisher thread died on an unhandled exception (no traceback because the
thread's target has a bare `except: pass`), leaving producers blocked on a full queue.

**Workaround in place:** cron restart every 4 h — masks the symptom, does not fix it.

**Requested:** propagate thread death, bound the queue with a timeout, log the exception.
```

Fields that make it actionable: version + environment, reproduction rate, expected vs actual,
evidence, severity in terms of user impact, and an explicit statement that the workaround is
temporary. A workaround with no ticket guarantees a repeat call.
