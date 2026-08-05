# Troubleshooting & Debugging Quiz

Google IT Automation module 4 exam items plus the debugging/profiling ground the notes leave out.

---

## Questions

**1.** A web page is loading slowly and you want to measure it. Which tool?
- A) `top`
- B) `ab` (ApacheBench) — issues concurrent requests and reports latency and requests/second
- C) `nice`
- D) `pidof`

**2.** `top` on Linux shows you:
- A) Page response times
- B) Processes ranked by resource use, right now
- C) Disk health
- D) The system boot log

**3.** `nice` is used to:
- A) Measure web latency
- B) Start a process with a different scheduling priority
- C) List processes by name
- D) Compress files

**4.** `pidof nginx` returns:
- A) The process id(s) of nginx
- B) Nginx CPU usage
- C) The nginx config path
- D) Nginx log lines

**5.** On Windows, the tool that collects detailed CPU/memory/disk/network counters over time is:
- A) Resource Monitor
- B) Performance Monitor
- C) Event Viewer
- D) Device Manager

**6.** On Windows, real-time per-process resource usage is best seen in:
- A) Performance Monitor
- B) Resource Monitor / Task Manager
- C) Registry Editor
- D) Memtest86

**7.** Activity Monitor is the resource tool for:
- A) Windows
- B) macOS
- C) Linux
- D) Any Unix

**8.** `top` is available on:
- A) Windows only
- B) Linux and Unix-like systems (including macOS terminal)
- C) macOS GUI only
- D) All operating systems natively

**9.** To check whether a machine's RAM is faulty you use:
- A) Event Viewer
- B) Memtest86
- C) S.M.A.R.T. disk tools
- D) Process Monitor

**10.** Event Viewer's job is to:
- A) Test memory
- B) Show system and application logs
- C) Benchmark disks
- D) Monitor network packets

**11.** S.M.A.R.T. data reports on:
- A) RAM integrity
- B) Disk drive health (reallocated sectors, error rates)
- C) CPU temperature only
- D) Network errors

**12.** Random crashes across unrelated applications plus data corruption most suggests:
- A) A slow disk
- B) Failing RAM
- C) A DNS problem
- D) A missing dependency

**13.** The fastest place for a program to read its data from is:
- A) An SSD
- B) RAM — so a program small enough to fit in memory runs fastest
- C) Optical media
- D) A network share

**14.** Slowest of these storage/transport options:
- A) RAM
- B) SSD
- C) Spinning hard disk, optical media or the internet
- D) CPU cache

**15.** A program pinning one CPU core at 100% while the others idle is:
- A) I/O-bound
- B) CPU-bound and single-threaded
- C) Memory-bound
- D) Network-bound

**16.** A process that spends most of its time waiting on disk reads is:
- A) CPU-bound
- B) I/O-bound
- C) Memory-bound
- D) Lock-bound

**17.** The system slows down globally and swap usage climbs. The bottleneck is:
- A) Network
- B) Memory
- C) CPU
- D) Disk seek only

**18.** Throughput plateaus far below CPU capacity while transferring large files between hosts. Most likely:
- A) CPU-bound
- B) Network-bound
- C) Memory-bound
- D) A regex bug

**19.** `rsync` is efficient on re-runs because it:
- A) Compresses everything each time
- B) Compares size and modification time and sends only the differences
- C) Uses UDP
- D) Copies only new directories

**20.** In `rsync -avz`, the flags mean:
- A) archive, verbose, compress
- B) append, validate, zip
- C) all, verify, zero
- D) archive, verify, zip

**21.** `rsync -a` (archive) preserves:
- A) Only file contents
- B) Recursion plus permissions, ownership, timestamps and symlinks
- C) Only timestamps
- D) Nothing extra; it just means "all files"

**22.** `rsync -avz source/ dest/` versus `rsync -avz source dest/`:
- A) Identical
- B) The trailing slash copies the *contents* of source; without it, the directory itself is copied inside dest
- C) The trailing slash deletes extra files
- D) Without the slash it fails

**23.** Before running `rsync --delete` against a live target, the safe step is:
- A) Run it twice
- B) Run with `--dry-run` first to see what would change
- C) Use `-z`
- D) Disable compression

**24.** `psutil.disk_usage("/")` gives you:
- A) Read/write throughput
- B) Total, used and free space
- C) Disk temperature
- D) Filesystem type

**25.** `psutil.disk_io_counters()` gives you:
- A) Free space
- B) Cumulative read/write counts and bytes since boot
- C) Mount points
- D) Inode counts

**26.** `psutil.net_io_counters()` reports:
- A) Open sockets
- B) Bytes sent/received, errors and drops per interface
- C) DNS latency
- D) Firewall rules

**27.** To turn `psutil` I/O counters into a rate you must:
- A) Multiply by CPU count
- B) Sample twice and subtract, dividing by elapsed time — the counters are cumulative
- C) Call `reset()`
- D) Nothing; they are already per second

**28.** The main appeal of `psutil` over shelling out to `top`/`iostat` is:
- A) It is faster than the kernel
- B) One cross-platform API that works on Linux, Windows and macOS
- C) It needs no permissions
- D) It writes its own logs

**29.** `multiprocessing.Pool` exists to:
- A) Pool database connections
- B) Manage a set of worker processes and distribute tasks to them
- C) Share memory between threads
- D) Limit RAM usage

**30.** For a CPU-bound workload in Python, the right tool is:
- A) `threading`
- B) `multiprocessing`
- C) `asyncio`
- D) A bigger `try` block

**31.** Threads do not speed up CPU-bound Python because:
- A) Threads are deprecated
- B) The GIL lets only one thread execute Python bytecode at a time
- C) Threads cannot share memory
- D) The OS limits threads to one core

**32.** `threading` and `asyncio` are the right fit for:
- A) CPU-bound work
- B) I/O-bound work with lots of waiting
- C) Numerical simulation
- D) Memory-bound work

**33.** A cost of `multiprocessing` that threading does not have:
- A) Process startup and pickling of arguments and results
- B) The GIL
- C) Shared mutable state
- D) Higher latency per I/O call

**34.** `if __name__ == "__main__":` is required around multiprocessing code because:
- A) Style
- B) On spawn-based platforms (Windows, macOS) child processes re-import the module and would re-run it recursively
- C) It makes it faster
- D) `Pool` needs a name

**35.** After applying a short-term workaround to unblock users, you must not forget to:
- A) Close the ticket
- B) Report the bug to the developers so the root cause gets fixed
- C) Reboot the server weekly
- D) Delete the logs

**36.** The first step of a disciplined debugging process is:
- A) Restart the service
- B) Reproduce the problem reliably
- C) Read the source top to bottom
- D) Roll back the last deploy

**37.** Changing several things at once during debugging is bad because:
- A) It takes longer to type
- B) You cannot tell which change caused the result
- C) Git forbids it
- D) It uses more CPU

**38.** `git bisect` helps you find:
- A) Which file is largest
- B) Which commit introduced a regression, by binary search
- C) Merge conflicts
- D) Unused code

**39.** In a Python traceback, the exception that was actually raised appears:
- A) On the first line
- B) On the last line — "most recent call last"
- C) In the middle
- D) Only with `-v`

**40.** Modern way to drop into the debugger at a point in the code:
- A) `print()`
- B) `breakpoint()`
- C) `exit()`
- D) `assert False`

**41.** In `pdb`, `n` versus `s`:
- A) `n` executes the next line without entering calls; `s` steps into the call
- B) They are identical
- C) `n` means "new frame"
- D) `s` means "skip"

**42.** `logging` is preferred over `print` for diagnostics because:
- A) It is faster
- B) It has levels, named loggers and configurable destinations, and can be turned down in production
- C) `print` is deprecated
- D) It never writes to stdout

**43.** Inside an `except` block, the call that records the message plus the full traceback is:
- A) `logging.error(...)`
- B) `logging.exception(...)`
- C) `logging.warning(...)`
- D) `print(e)`

**44.** `raise NewError("...") from exc` is used to:
- A) Suppress the original error
- B) Preserve the causal chain so both exceptions appear in the traceback
- C) Retry the operation
- D) Convert the error to a warning

**45.** Before optimising code you should:
- A) Rewrite the slowest-looking function
- B) Profile it — measured hot spots beat intuition
- C) Add more threads
- D) Increase the cache size

**46.** `python -m cProfile -s cumtime script.py` gives:
- A) Memory allocation by line
- B) Function call counts and cumulative time, so you can see where time goes
- C) A flame graph
- D) Type errors

**47.** To profile a process that is already running in production, with low overhead:
- A) `cProfile`
- B) `py-spy` (a sampling profiler that attaches to a live pid)
- C) `timeit`
- D) `pdb`

**48.** `tracemalloc` is for:
- A) Tracing network calls
- B) Tracking memory allocation by line, to find leaks
- C) Timing functions
- D) Tracing syscalls

**49.** `timeit` is the right tool when you want:
- A) A whole-program profile
- B) A reliable micro-benchmark of a small statement, run many times
- C) Memory usage
- D) Syscall counts

**50.** A Python process that keeps growing in RSS most often has:
- A) A true C-level leak
- B) Objects still referenced — an unbounded cache, list or handler
- C) Too little swap
- D) Fragmented disk

**51.** A container process vanishes with no traceback and exit code 137. That means:
- A) Segmentation fault
- B) Killed by SIGKILL — typically the OOM killer
- C) Clean exit
- D) Command not found

**52.** Exit code 143 corresponds to:
- A) SIGTERM (128 + 15) — a graceful stop request
- B) SIGINT
- C) A Python exception
- D) Disk full

**53.** The difference between SIGTERM and SIGKILL:
- A) None
- B) SIGTERM can be caught so the process flushes and shuts down cleanly; SIGKILL cannot be caught
- C) SIGKILL is slower
- D) SIGTERM only works on Windows

**54.** A test that fails 1 run in 50 and always passes under the debugger points to:
- A) A race condition — timing-dependent behaviour
- B) A syntax error
- C) A disk fault
- D) A bad assertion message

**55.** Everything hangs, CPU near zero, threads blocked on locks. Most likely:
- A) CPU-bound
- B) Deadlock
- C) Memory leak
- D) Network saturation

**56.** The correct response to a flaky test is:
- A) Add an automatic retry and move on
- B) Investigate — flakiness usually encodes a real race or shared-state bug
- C) Delete it
- D) Increase the timeout

**57.** Which command shows how much of each filesystem is used?
- A) `du -sh *`
- B) `df -h`
- C) `free -h`
- D) `lsof`

**58.** To see which process is listening on port 8000:
- A) `ping`
- B) `ss -tulpn` (or `netstat -tulpn`)
- C) `dmesg`
- D) `iostat`

**59.** `strace -p PID` shows:
- A) Python-level stack frames
- B) The system calls the process makes — useful when it hangs on a file or socket
- C) Memory allocations by line
- D) Compiler warnings

**60.** `dmesg -T` is where you confirm:
- A) Application log levels
- B) Kernel-level events such as OOM kills and hardware errors
- C) HTTP latency
- D) Package versions

**61.** "Works on my machine" is most often explained by:
- A) Compiler bugs
- B) A different interpreter/package version, env var, data or permission
- C) Random chance
- D) The user's monitor

**62.** A disk that is 100% full typically presents as:
- A) One clear error
- B) Many unrelated-looking failures across services
- C) High CPU
- D) Network timeouts only

**63.** `uptime` load average should be compared against:
- A) RAM size
- B) The number of CPU cores
- C) Disk size
- D) The number of processes

**64.** A production report suddenly returns wrong numbers with no errors. The most useful first move:
- A) Restart the scheduler
- B) Write a test that reproduces the wrong output for one known input, then bisect what changed
- C) Increase the cluster size
- D) Rewrite the query

**65.** The most durable performance win is usually:
- A) Micro-tuning the inner loop
- B) An algorithmic change — O(n²) to O(n) — or avoiding the work entirely
- C) More threads
- D) A faster machine

## Answer key

1 - B
2 - B
3 - B
4 - A
5 - B
6 - B
7 - B
8 - B
9 - B
10 - B
11 - B
12 - B
13 - B
14 - C
15 - B
16 - B
17 - B
18 - B
19 - B
20 - A
21 - B
22 - B
23 - B
24 - B
25 - B
26 - B
27 - B
28 - B
29 - B
30 - B
31 - B
32 - B
33 - A
34 - B
35 - B
36 - B
37 - B
38 - B
39 - B
40 - B
41 - A
42 - B
43 - B
44 - B
45 - B
46 - B
47 - B
48 - B
49 - B
50 - B
51 - B
52 - A
53 - B
54 - A
55 - B
56 - B
57 - B
58 - B
59 - B
60 - B
61 - B
62 - B
63 - B
64 - B
65 - B

### One-line rationales

1. `ab` generates concurrent HTTP load and reports latency percentiles; `top`, `nice` and `pidof` are process tools.
2. `top` ranks processes by live resource use.
3. `nice`/`renice` change scheduling priority.
4. `pidof` maps a program name to its pid(s).
5. Performance Monitor collects counters over time; Resource Monitor is the live view.
6. Resource Monitor and Task Manager show real-time per-process usage.
7. Activity Monitor is macOS.
8. `top` is a Unix/Linux utility, present in the macOS terminal, absent on Windows.
9. Memtest86 boots outside the OS and tests memory integrity.
10. Event Viewer displays logs, not hardware tests.
11. S.M.A.R.T. is drive self-monitoring: reallocated sectors, error rates.
12. Random cross-application crashes plus corruption is the classic bad-RAM signature.
13. RAM is orders of magnitude faster than any persistent store.
14. Disk, optical media and network are the slow tiers.
15. One saturated core with others idle means single-threaded CPU-bound work.
16. High wait, low CPU = I/O-bound.
17. Swapping is the memory-bound signature and slows everything at once.
18. A throughput ceiling with idle CPU points at bandwidth or latency.
19. rsync compares size and mtime, then sends only deltas.
20. `-a` archive, `-v` verbose, `-z` compress.
21. Archive mode is recursive and preserves metadata and symlinks.
22. The trailing slash means "the contents of".
23. `--dry-run` shows the deletions before they happen.
24. `disk_usage` is about space.
25. `disk_io_counters` is about read/write activity.
26. `net_io_counters` is about traffic and errors per interface.
27. Counters are cumulative since boot, so a rate needs two samples.
28. Same code on all three platforms is the point of psutil.
29. `Pool` owns worker processes and hands tasks out.
30. CPU-bound work needs separate processes to use several cores.
31. The GIL serialises bytecode execution within one process.
32. Waiting releases the GIL, so threads and async win on I/O.
33. Spawning processes and pickling data across them is real overhead.
34. Spawn re-imports the module in the child; without the guard it recurses.
35. A workaround without a bug report guarantees the problem returns.
36. If you cannot reproduce it, you cannot verify a fix.
37. Multiple simultaneous changes make the result uninterpretable.
38. `git bisect` binary-searches history for the breaking commit.
39. Python prints "most recent call last"; the exception is on the last line.
40. `breakpoint()` (3.7+) enters pdb and is disableable via `PYTHONBREAKPOINT`.
41. `n` steps over calls, `s` steps into them.
42. Levels, named loggers and handlers make logging controllable in production.
43. `logging.exception` adds the traceback automatically inside `except`.
44. `from exc` keeps the original cause visible.
45. Profilers beat intuition about where time goes.
46. cProfile reports call counts and cumulative time per function.
47. py-spy samples an already-running process without modifying it.
48. tracemalloc attributes allocations to source lines.
49. timeit repeats a small statement to get stable timings.
50. Python "leaks" are usually live references, not lost memory.
51. 137 = 128 + 9 (SIGKILL), most often the OOM killer.
52. 143 = 128 + 15 (SIGTERM).
53. SIGTERM is catchable and allows cleanup; SIGKILL is not.
54. Timing-dependent, debugger-sensitive failure is a race condition.
55. Low CPU plus no progress plus blocked threads is deadlock.
56. Retrying a flaky test hides the underlying bug.
57. `df` reports filesystem usage; `du` reports directory sizes.
58. `ss`/`netstat` map listening sockets to processes.
59. strace shows syscalls, which reveals what a hung process is waiting on.
60. Kernel-level events like OOM kills land in the ring buffer.
61. Environment drift — versions, env vars, data, permissions — explains most of these.
62. A full disk breaks writes, logs, temp files and databases at once.
63. Load average is only meaningful relative to core count.
64. Reproduce on one input, then bisect code/data/config changes.
65. Doing less work beats doing the same work slightly faster.
