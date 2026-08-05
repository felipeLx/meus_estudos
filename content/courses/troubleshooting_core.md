# Troubleshooting, Debugging & Performance

Google IT Automation module 4, extended with what the course leaves out: Python debuggers,
profilers, log/syscall tooling, and the systematic method interviewers actually probe.

## The method — before any tool

1. **Reproduce it.** A bug you cannot trigger on demand cannot be fixed, only guessed at. Record the
   exact input, environment and frequency ("6 of 10 runs").
2. **Bound the problem.** Which layer: code, data, config, network, host, dependency? Bisect —
   halve the search space each step (`git bisect` for "when", commenting out for "where").
3. **Read the actual error.** Bottom of the traceback is the raised exception; the frames above are
   the path. Do not skim it.
4. **Change one thing at a time**, and write down what you changed. Two simultaneous changes make
   the result uninterpretable.
5. **Distinguish symptom from cause.** Restarting fixes the symptom; ask *why* it entered that state.
6. **Short-term workaround, long-term fix.** Both are legitimate — but after the workaround,
   **file the bug with the developers**, otherwise the same call comes back next week. (This is the
   course's answer to "what must you not forget after applying a workaround?")
7. **Document it.** Ticket, runbook entry or postmortem, so the next person spends 5 minutes, not 5 hours.

Interview phrasing: *"I reproduce, isolate by bisecting layers, form one hypothesis at a time, and I
separate the mitigation from the root-cause fix."*

## Slow, crashing, or wrong — three different investigations

| Symptom | First questions | First tools |
|---|---|---|
| **Slow** | slow for everyone or one user? always or under load? recently or always? | profiler, `top`/`htop`, `ab`, query plan |
| **Crashing** | exit code? traceback? OOM-killed? reproducible? | logs, `dmesg`, core dump, `pdb` |
| **Wrong output** | wrong for which input? since when? | unit test on that input, `git bisect`, data lineage |

"It's slow" is not a bug report — see the reporting deck for the fields that make it one.

## Resource bottlenecks — name the bound

- **CPU-bound**: the CPU is the limit; classic sign is one core pinned at 100% while others idle
  (single-threaded work). Fix: better algorithm, then parallelism across cores.
- **Memory-bound**: limited by available RAM; the tell is swapping, and everything gets slow at once.
- **I/O-bound (disk)**: high wait time, low CPU. `iostat`, `iotop`. Fix: fewer/bigger reads, caching,
  faster storage, batching.
- **Network-bound**: limited by bandwidth or latency; throughput plateaus well below CPU capacity.
- **Lock-bound**: threads waiting on each other — CPU low, throughput low, contention high.

Order of speed, which the course states plainly: data **in RAM** is fastest; anything that must hit
**disk, optical media or the network** is progressively slower. So the fastest program is one whose
working set fits in memory — and the first optimisation is usually "stop re-reading it".

Latency numbers worth carrying: RAM ~100 ns, SSD ~100 µs, spinning disk ~10 ms, same-datacentre
round trip ~0.5 ms, cross-continent ~150 ms.

## Linux/Unix diagnostic toolkit

| Question | Tool |
|---|---|
| What is using CPU/RAM right now? | `top`, `htop` |
| Load over time | `uptime` (1/5/15-min load averages; compare against core count) |
| Per-process detail | `ps aux`, `pidof`, `pgrep` |
| Disk I/O | `iostat -x`, `iotop` |
| Disk space / big directories | `df -h`, `du -sh *` |
| Memory and swap | `free -h`, `vmstat 1` |
| Open files and sockets | `lsof`, `lsof -p PID` |
| Listening ports / connections | `ss -tulpn` (modern), `netstat -tulpn` |
| Network path | `ping`, `traceroute`, `mtr`, `dig` |
| Packet capture | `tcpdump`, Wireshark |
| HTTP timing | `curl -w "%{time_total}"`, `ab` (ApacheBench), `wrk` |
| Syscalls a process makes | `strace -p PID` (`dtruss` on macOS) |
| Library calls | `ltrace` |
| Kernel ring buffer (OOM kills, hardware) | `dmesg -T` |
| System logs | `journalctl -u service -f`, `/var/log/` |
| Process priority | `nice`, `renice` |
| Signals | `kill -TERM` (graceful) vs `kill -9` (SIGKILL, no cleanup) |

**`ab` (ApacheBench)** is the answer to "a web page is slow, how do you measure it?" — it issues
concurrent requests and reports latency percentiles and requests/second. `top`, `nice` and `pidof`
are process tools; they say nothing about page response time.

## Windows and macOS equivalents

| Need | Windows | macOS |
|---|---|---|
| Live per-process resource use | **Resource Monitor** (`resmon`), Task Manager | **Activity Monitor** |
| Detailed metrics + counters over time | **Performance Monitor** (`perfmon`) | Instruments |
| System/application logs | **Event Viewer** | Console.app |
| Process/file/registry activity | **Process Monitor** (Sysinternals) | `fs_usage`, `dtruss` |
| Shell scripting | PowerShell | zsh/bash |

Course distinctions worth keeping straight: **Performance Monitor** collects detailed CPU/memory/
disk/network counters over time; **Resource Monitor** shows real-time usage per process;
**Activity Monitor** is macOS-only; **`top`** is Linux/Unix-only.

## Hardware health

- **RAM**: **Memtest86** (or memtest86+) — boots outside the OS and tests memory integrity. Symptoms
  of bad RAM: random crashes across unrelated programs, corrupted data, kernel panics.
- **Disks**: **S.M.A.R.T.** tools (`smartctl -a /dev/sda`) — reallocated sectors, pending sectors,
  read error rate. Rising reallocated-sector counts mean replace it now.
- **Event Viewer** shows logs, **Process Monitor** watches processes — neither tests RAM.
- Thermal throttling, failing PSU and a full disk all masquerade as "the software got slow".

## Files, transfer and sync

**rsync** — transfers and synchronises efficiently by comparing **modification time and size**, and
sending only the differences (delta algorithm), so re-running is cheap.

```bash
rsync -avz source/ user@host:/dest/     # archive, compress, verbose
rsync -avz --dry-run source/ dest/      # see what WOULD change first
rsync -avz --delete source/ dest/       # mirror: remove files gone from source (dangerous)
rsync -avzP --partial source/ dest/     # progress + resume interrupted transfers
```

- `-a` archive: recursive, preserves permissions, ownership, timestamps, symlinks.
- `-z` compress in transit. `-v` verbose. `-P` progress + partial (resumable).
- **Trailing slash matters**: `src/` copies the *contents*; `src` copies the *directory*.
- Runs over SSH by default; resumable and idempotent, which is why it beats `scp` for large or
  repeated transfers.

Related: `scp` (simple copy, no delta), `tar czf` for archives, `sha256sum` to verify integrity,
`find -mtime` to pick files by age.

## Python — psutil

Cross-platform system and process monitoring: the same code works on Linux, Windows and macOS.

```python
import psutil

psutil.cpu_percent(interval=1, percpu=True)   # per-core utilisation
psutil.virtual_memory()                       # total, available, percent
psutil.swap_memory()
psutil.disk_usage("/")                        # total, used, free, percent  ← space
psutil.disk_io_counters()                     # read_count/bytes, write_count/bytes  ← throughput
psutil.net_io_counters()                      # bytes_sent, bytes_recv, errin, dropin
psutil.sensors_battery()

for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info"]):
    ...
proc = psutil.Process(pid)
proc.open_files(), proc.connections(), proc.num_threads()
proc.terminate()        # SIGTERM, graceful
proc.kill()             # SIGKILL, last resort
```

Keep the pairs straight: `disk_usage` = **space**, `disk_io_counters` = **I/O activity**,
`net_io_counters` = **network traffic**. I/O counters are cumulative since boot — sample twice and
subtract to get a rate.

## Python — multiprocessing vs threading vs async

- **threading**: multiple threads in **one process**, sharing memory. The **GIL** means only one
  thread executes Python bytecode at a time, so threads help **I/O-bound** work (waiting releases the
  GIL) and not CPU-bound work.
- **multiprocessing**: multiple **independent processes**, each with its own interpreter and memory —
  true parallelism across cores. Right for **CPU-bound** work. Costs: process startup, and arguments and
  results must be **pickled** between processes.
- **asyncio**: one thread, cooperative concurrency for **I/O-bound** work with many waits; no GIL
  fight, but one blocking call stalls everything.

```python
from multiprocessing import Pool

def transform(chunk):
    return heavy_cpu_work(chunk)

if __name__ == "__main__":              # required on Windows/macOS spawn
    with Pool(processes=4) as pool:     # Pool manages the worker processes
        results = pool.map(transform, chunks)      # blocking, ordered
        # pool.imap_unordered(...)      # streaming, as results finish
        # pool.apply_async(...)         # single task, non-blocking
```

`Pool` is the class the course asks about: it maintains a set of worker processes and distributes
tasks to them. Rule of thumb: `processes = os.cpu_count()` for CPU-bound, higher only for I/O.
`concurrent.futures.ProcessPoolExecutor` / `ThreadPoolExecutor` is the modern, uniform API.

Decision line: **CPU-bound → processes. I/O-bound → threads or async. Both → processes of async workers.**

## Python — debugging tools the course skips

```python
breakpoint()                       # 3.7+, drops into pdb right here (PYTHONBREAKPOINT=0 disables)
import pdb; pdb.set_trace()        # older equivalent
python -m pdb script.py            # start under the debugger
python -X dev script.py            # dev mode: extra warnings and checks
```

pdb commands worth memorising: `l` list, `n` next, `s` step into, `c` continue, `w` where (stack),
`u`/`d` up/down frames, `p expr` print, `pp` pretty-print, `b file:line` breakpoint, `cl` clear,
`q` quit. `post_mortem()` debugs the traceback of an exception that already happened.

Reading tracebacks: **most recent call last** — the bottom line is the exception, the frame above it
is where it was raised, and the top is your entry point. `raise NewError(...) from exc` preserves the
chain; a bare `raise` inside `except` re-raises with the original traceback intact.

```python
import traceback, logging
logging.exception("failed processing %s", item)   # logs ERROR + traceback, inside except
traceback.format_exc()                            # the traceback as a string
```

Logging over print: levels (`DEBUG/INFO/WARNING/ERROR/CRITICAL`), destinations, and structure.
`logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s %(name)s %(message)s")`.
Use `logger = logging.getLogger(__name__)` per module; never log secrets or PII.

Static checks that catch bugs before runtime: `mypy` (types), `ruff`/`pylint`/`flake8` (lint),
`black` (format), `pytest -x --pdb` (drop into the debugger on first failure).

## Python — profiling before optimising

```bash
python -m cProfile -s cumtime script.py | head -30    # where the time actually goes
python -m timeit -s "setup" "statement"               # micro-benchmark
py-spy top --pid 1234                                 # sampling profiler on a LIVE process
python -X importtime script.py                        # slow start-up? it's usually imports
```

```python
import tracemalloc
tracemalloc.start()
...
snapshot = tracemalloc.take_snapshot()
for stat in snapshot.statistics("lineno")[:10]:
    print(stat)                       # allocation by line — memory leak hunting
```

Rules: **measure first** — intuition about hot spots is wrong more often than not; optimise the
dominant term only (Amdahl); re-measure after each change; and prefer an algorithmic fix (O(n²) → O(n))
over micro-tuning. `cProfile` = deterministic, adds overhead; `py-spy` = sampling, safe in production.

Common Python performance bugs: `in` against a list inside a loop (use a set), string `+=` in a loop
(use `"".join`), `list.pop(0)` (use `deque`), re-reading a file per iteration, recompiling a regex per
row, N+1 queries, and a pandas `.apply` where a vectorised operation exists.

## Memory problems

- **Leak** in Python usually means "still referenced": a growing module-level cache, an unbounded
  list, a logging handler holding records, or `functools.lru_cache` on a method keeping instances alive.
- Detect: RSS growth over time (`psutil.Process().memory_info().rss`), `tracemalloc` snapshots
  compared with `.compare_to()`, `gc.get_objects()` counts by type, `objgraph` for reference chains.
- **OOM kill**: the process disappears with no traceback and exit code 137 (128+9). Confirm in
  `dmesg -T | grep -i oom` or the container's termination reason.
- Fix patterns: stream instead of materialising (generators, chunked reads), bound caches
  (`lru_cache(maxsize=…)`), release references, use `__slots__` for many small objects.

## Concurrency and intermittent bugs

- **Race condition**: outcome depends on timing. Symptom: fails 1 in 50 runs, passes under the
  debugger (the debugger changes timing — that itself is a clue).
- **Deadlock**: two locks acquired in opposite orders; everything hangs with low CPU. Fix: a global
  lock ordering, or timeouts on acquisition.
- **Starvation / thundering herd**: many clients retry simultaneously — add jitter.
- Debugging tactics: log with timestamps and thread/process ids, add a stress loop
  (`pytest -p no:randomly --count=200`), use `faulthandler.dump_traceback_later()` to catch hangs,
  and `py-spy dump --pid` to see stacks of a stuck process.
- Never "fix" a flaky test by retrying it — that hides a real race.

## Environment and dependency issues

"Works on my machine" is almost always one of: different Python version, different package version,
different environment variables, different data, or different file permissions/locale/timezone.

```bash
python -V && which python          # which interpreter is actually running
pip list --format=freeze           # exact versions
python -c "import mod; print(mod.__file__)"   # which copy got imported
echo $PYTHONPATH                   # shadowing and import surprises
```

Use a virtualenv per project, a lock file, and pin versions. Match container and host versions.
Check file permissions and ownership (`ls -l`), disk space (`df -h`) and inode exhaustion
(`df -i`) — a full disk presents as a hundred different bugs.

## Exit codes and signals

`0` = success; `1` generic error; `2` misuse; `126` not executable; `127` command not found;
`130` = Ctrl-C (SIGINT, 128+2); `137` = SIGKILL/OOM (128+9); `143` = SIGTERM (128+15).

Graceful shutdown handles **SIGTERM** (flush, close, checkpoint) — SIGKILL cannot be caught. In a
container, that is the difference between a clean stop and corrupted partial output.
