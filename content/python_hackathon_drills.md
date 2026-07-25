# Python — Hackathon Drills

Timed drills in the shape coding tests use. Read the task, write it, then reveal.

## Top-K customers by spend — one pass, no full sort

<!-- difficulty: 3 -->
Given `rows = [{"customer_id": str, "amount": float, "status": str}, ...]`, return the 3
customer ids with the highest total spend, counting only `status == "completed"`.

Target: 4 minutes. State the complexity.

### Solution

```python
from collections import defaultdict
import heapq

def top_spenders(rows, k=3):
    totals = defaultdict(float)
    for r in rows:                                   # O(n)
        if r["status"] == "completed":
            totals[r["customer_id"]] += r["amount"]
    return heapq.nlargest(k, totals, key=totals.get)  # O(m log k)
```

`O(n + m log k)` time, `O(m)` memory for m distinct customers. `nlargest` beats `sorted(...)[:k]` when m is large. `key=totals.get` avoids building tuples.

## Sliding window — max average over N consecutive days

<!-- difficulty: 3 -->
Given `daily = [(date, value), ...]` sorted by date, return the window of `n` consecutive
days with the highest average, as `(start_date, end_date, avg)`.

Must be O(n) — no recomputing the sum per window.

### Solution

```python
def best_window(daily, n):
    if len(daily) < n:
        return None
    total = sum(v for _, v in daily[:n])
    best = (daily[0][0], daily[n-1][0], total / n)
    for i in range(n, len(daily)):
        total += daily[i][1] - daily[i-n][1]          # add new, drop old
        avg = total / n
        if avg > best[2]:
            best = (daily[i-n+1][0], daily[i][0], avg)
    return best
```

The running-sum update is the whole trick: recomputing `sum()` per window is O(n·k). Same idea as SQL `ROWS BETWEEN n PRECEDING AND CURRENT ROW`.

## Deduplicate keeping the most recent record

<!-- difficulty: 3 -->
`rows` has repeated `id`s with an `updated_at` ISO string. Return one row per id — the
newest — sorted by id. Must be idempotent: running it twice gives the same output.

### Solution

```python
def dedupe_latest(rows):
    best = {}
    for r in rows:
        cur = best.get(r["id"])
        if cur is None or r["updated_at"] > cur["updated_at"]:   # ISO strings compare correctly
            best[r["id"]] = r
    return sorted(best.values(), key=lambda r: r["id"])
```

ISO-8601 strings sort lexicographically = chronologically, so no parsing needed. This is `ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) = 1` in Python.

## Parse a messy CSV string into clean records

<!-- difficulty: 4 -->
Input is one CSV string: header row, mixed delimiters inside the amount field (`1.234,56`
and `1234.56`), blank rows, whitespace-padded names, dates as `dd/mm/yyyy` or `yyyy-mm-dd`.
Return `list[dict]` with `name: str`, `date: date`, `amount: float`; skip unparseable rows.

### Solution

```python
import csv, io, re
from datetime import datetime, date

def parse(raw):
    out = []
    for row in csv.DictReader(io.StringIO(raw)):
        if not row or not (row.get("name") or "").strip():
            continue
        try:
            out.append({
                "name": " ".join(row["name"].split()).title(),
                "date": parse_date(row["date"]),
                "amount": parse_amount(row["amount"]),
            })
        except (ValueError, KeyError, TypeError):
            continue                                   # skip bad row, keep going
    return out

def parse_date(s):
    s = s.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"bad date {s!r}")

def parse_amount(s):
    s = re.sub(r"[^\d,.-]", "", s.strip())
    if "," in s and "." in s:                          # 1.234,56 -> 1234.56
        s = s.replace(".", "").replace(",", ".") if s.rindex(",") > s.rindex(".") else s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".")
    return float(s)
```

Graders look for: `csv` not `split(",")`, per-row try/except so one bad row doesn't kill the job, and a stated rule for ambiguous formats.

## Flatten nested JSON into flat columns

<!-- difficulty: 4 -->
Given nested dicts like `{"id": 1, "user": {"name": "a", "geo": {"city": "SP"}}, "tags": ["x","y"]}`,
produce a flat dict `{"id": 1, "user_name": "a", "user_geo_city": "SP", "tags": "x,y"}`.
Handle arbitrary depth.

### Solution

```python
def flatten(obj, prefix="", sep="_"):
    out = {}
    for k, v in obj.items():
        key = f"{prefix}{sep}{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key, sep))
        elif isinstance(v, list):
            out[key] = ",".join(map(str, v))       # or explode into rows, state the choice
        else:
            out[key] = v
    return out
```

Say the trade-off out loud: joining a list keeps one row per record; exploding it gives one row per element and changes the grain.

## Sessionize events by inactivity gap

<!-- difficulty: 5 -->
Given `events = [(user_id, timestamp)]` unsorted, group each user's events into sessions
where a gap over 30 minutes starts a new session. Return
`[(user_id, session_id, start, end, n_events)]`.

### Solution

```python
from collections import defaultdict
from datetime import timedelta

GAP = timedelta(minutes=30)

def sessionize(events):
    by_user = defaultdict(list)
    for uid, ts in events:
        by_user[uid].append(ts)

    out = []
    for uid, stamps in by_user.items():
        stamps.sort()
        sid, start, prev, n = 0, stamps[0], stamps[0], 0
        for ts in stamps:
            if ts - prev > GAP:
                out.append((uid, sid, start, prev, n))
                sid, start, n = sid + 1, ts, 0
            prev, n = ts, n + 1
        out.append((uid, sid, start, prev, n))
    return out
```

Same algorithm as the SQL sessionization exercise: `LAG` → gap flag → cumulative sum of flags = session id.

## Retry with exponential backoff — as a decorator

<!-- difficulty: 4 -->
Write `@retry(times=3, base=0.5)` that re-calls the wrapped function on exception with
delays 0.5s, 1s, 2s, re-raising the last error. Must preserve the function's name/doc.

### Solution

```python
import time, functools

def retry(times=3, base=0.5, exceptions=(Exception,)):
    def deco(fn):
        @functools.wraps(fn)
        def inner(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except exceptions as err:
                    if attempt == times - 1:
                        raise
                    time.sleep(base * 2 ** attempt)
        return inner
    return deco
```

Three nested functions because the decorator takes arguments. `@wraps` keeps `__name__`/`__doc__`. Catch a narrow exception tuple — retrying a `ValueError` from bad input is pointless.

## Merge two sorted streams without loading either

<!-- difficulty: 4 -->
Two sorted iterables of `(key, value)`. Yield merged pairs in key order, lazily, without
building a combined list.

### Solution

```python
import heapq

def merge_sorted(a, b):
    yield from heapq.merge(a, b, key=lambda kv: kv[0])
```

Hand-rolled, if they ask for it:

```python
def merge_manual(a, b):
    ia, ib = iter(a), iter(b)
    x, y = next(ia, None), next(ib, None)
    while x is not None and y is not None:
        if x[0] <= y[0]: yield x; x = next(ia, None)
        else:            yield y; y = next(ib, None)
    while x is not None: yield x; x = next(ia, None)
    while y is not None: yield y; y = next(ib, None)
```

`heapq.merge` is the stdlib answer and stays O(1) in memory — the merge step of an external sort.

## Rate limiter — token bucket

<!-- difficulty: 5 -->
Implement `TokenBucket(rate_per_sec, capacity)` with `allow() -> bool`, refilling
continuously by elapsed time.

### Solution

```python
import time

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity = rate, capacity
        self.tokens = float(capacity)
        self.last = time.monotonic()

    def allow(self, cost=1.0):
        now = time.monotonic()                       # monotonic: immune to clock changes
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False
```

Continuous refill by elapsed time, no background timer. `capacity` sets the burst size, `rate` the steady state. `time.monotonic` not `time.time`.

## Chunk an iterable into batches of N

<!-- difficulty: 2 -->
Write `batched(iterable, n)` yielding lists of at most `n` items, lazily, working on
generators (no `len`).

### Solution

```python
from itertools import islice

def batched(iterable, n):
    it = iter(iterable)
    while (chunk := list(islice(it, n))):
        yield chunk
```

`islice` pulls at most n items from the shared iterator; the walrus stops on the empty tail. Python 3.12 ships `itertools.batched`. This is the shape of every bulk-insert loop.

## Two-sum / pair lookup in one pass

<!-- difficulty: 2 -->
Given `nums` and `target`, return the indexes of two values summing to `target`, or `None`.
O(n), single pass.

### Solution

```python
def two_sum(nums, target):
    seen = {}                                  # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:
            return seen[target - x], i
        seen[x] = i
    return None
```

The hash-as-you-go pattern: check for the complement *before* inserting the current value, so an element is never paired with itself.

## Group anagrams / canonical-key grouping

<!-- difficulty: 3 -->
Group words that are anagrams of each other. Return a list of groups.

### Solution

```python
from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)      # canonical key
    return list(groups.values())
```

Generalises far past anagrams: any "same thing written differently" grouping = build a **canonical key** (sorted chars, normalised address, rounded timestamp) and bucket by it. `Counter(w)` as a frozen tuple works too when words are long.
