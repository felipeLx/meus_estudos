# Python — Stdlib Cheatsheet

One card per package/idiom. Say what it is for and the API before revealing.

## collections — which type, when

```python
from collections import Counter, defaultdict, deque, namedtuple, OrderedDict, ChainMap
```

| Type | Use for | Key API |
|---|---|---|
| `Counter` | frequency tables, top-N | `Counter(it)`, `most_common(n)`, `+ - & \|`, `update` |
| `defaultdict` | grouping without key checks | `defaultdict(list/int/set)` |
| `deque` | queue, BFS, sliding window | `append`, `appendleft`, `pop`, `popleft`, `maxlen`, `rotate` |
| `namedtuple` | immutable record | `Point = namedtuple("Point","x y")`, `_replace`, `_asdict` |
| `ChainMap` | layered config lookup | `ChainMap(overrides, defaults)` |

```python
Counter("mississippi").most_common(2)      # [('i', 4), ('s', 4)]
by_user = defaultdict(list)
for r in rows: by_user[r["user_id"]].append(r)

window = deque(maxlen=3)                    # rolling last-3
for x in values: window.append(x); avg = sum(window)/len(window)
```

Counter arithmetic is the hidden gem: `Counter(a) - Counter(b)` = what `a` has extra; `&` = intersection of counts.

## itertools — the ones that show up in tests

```python
from itertools import chain, groupby, accumulate, combinations, product, islice, tee, count, cycle
```

```python
list(chain.from_iterable([[1,2],[3]]))          # [1, 2, 3]      flatten one level
list(accumulate([1,2,3,4]))                     # [1, 3, 6, 10]  running total
list(accumulate([3,1,4], max))                  # [3, 3, 4]      running max
list(combinations("abc", 2))                    # pairs, order-insensitive
list(product([0,1], repeat=3))                  # all 3-bit tuples
list(islice(infinite_gen(), 10))                # take 10, lazily
```

**groupby only groups consecutive runs** — sort first:

```python
rows.sort(key=itemgetter("dept"))
for dept, grp in groupby(rows, key=itemgetter("dept")):
    print(dept, sum(r["salary"] for r in grp))
```

## heapq — top-K and priority queues

```python
import heapq
heapq.nlargest(3, rows, key=lambda r: r["amount"])   # O(n log k), no full sort
heapq.nsmallest(3, nums)
```

Manual heap (min at index 0):

```python
h = []
heapq.heappush(h, (priority, task))
priority, task = heapq.heappop(h)
heapq.heapify(existing_list)                # O(n), in place
```

Max-heap = push negated keys: `heappush(h, (-score, item))`.

Streaming top-K in constant memory: keep a size-K heap, `heappushpop` for each new item.

## bisect — sorted lists in O(log n)

```python
import bisect
bisect.bisect_left(sorted_xs, x)     # insertion index, ties go left
bisect.insort(sorted_xs, x)          # insert keeping order
```

Classic uses: bucketing a value into ranges (grade boundaries, price tiers), "how many are below x" = `bisect_left`, nearest-neighbour on a sorted axis, and range counting `bisect_right(hi) - bisect_left(lo)`.

## functools — cache, partial, reduce

```python
from functools import lru_cache, cache, partial, reduce, wraps

@cache                                  # unbounded memo (3.9+); lru_cache(maxsize=None) before
def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)

to_int = partial(int, base=16)          # freeze arguments
reduce(operator.mul, nums, 1)           # product

def retry(fn):                          # @wraps keeps __name__/__doc__
    @wraps(fn)
    def inner(*a, **kw): ...
    return inner
```

Cached functions must be **pure** and take **hashable** args — no lists, no dicts.

## dataclasses vs namedtuple vs dict

```python
from dataclasses import dataclass, field, asdict

@dataclass
class Txn:
    id: int
    amount: float
    tags: list[str] = field(default_factory=list)   # never  = []
    status: str = "pending"

@dataclass(frozen=True, slots=True)     # immutable + low memory
class Point: x: float; y: float
```

- `dict` — dynamic keys, JSON in/out.
- `namedtuple` — immutable, tuple-cheap, unpackable.
- `dataclass` — named fields, defaults, `__eq__`, `__repr__`, `asdict()`, optional `frozen`/`order`/`slots`.

## Sorting — key functions and stability

```python
rows.sort(key=itemgetter("dept", "name"))               # multi-key
rows.sort(key=lambda r: (r["dept"], -r["salary"]))      # second key descending
rows.sort(key=lambda r: r["name"].lower())              # case-insensitive
```

Python's sort is **stable**: equal keys keep their previous order, so you can sort by the secondary key first, then the primary — useful when one direction cannot be negated (strings).

`sorted()` returns a new list; `.sort()` mutates and returns `None`.

## Comprehensions, generators, and when each wins

```python
squares  = [x*x for x in xs]                 # list: needs len/index/reuse
lazy     = (x*x for x in xs)                 # generator: one pass, O(1) memory
by_id    = {r["id"]: r for r in rows}        # dict comp: index a list of dicts
seen     = {r["email"] for r in rows}        # set comp: membership in O(1)
```

```python
def read_batches(path, n=1000):              # generator streaming a big file
    batch = []
    for line in open(path):
        batch.append(line)
        if len(batch) == n:
            yield batch; batch = []
    if batch: yield batch
```

`any()`/`all()` over a generator short-circuits — don't build a list to test a condition.

## strings and re

```python
s.strip().lower().replace(",", "")
",".join(parts)                       # join is the fast concat
f"{value:,.2f}"                       # 1,234.57
s.startswith(("http://", "https://")) # tuple of prefixes
```

```python
import re
re.split(r"[;,|]\s*", raw)                    # mixed delimiters
re.findall(r"-?\d+(?:\.\d+)?", text)          # all numbers
m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)  # groups: m.group(1)…
re.sub(r"\s+", " ", messy).strip()            # collapse whitespace
pat = re.compile(r"^\w+@\w+\.\w+$")           # compile when reused in a loop
```

`match` = anchored at start, `search` = anywhere, `fullmatch` = entire string.

## datetime — parsing, arithmetic, ranges

```python
from datetime import datetime, date, timedelta, timezone

date.fromisoformat("2024-03-01")
datetime.strptime("01/03/2024 10:30", "%d/%m/%Y %H:%M")
d.strftime("%Y-%m-%d")

d + timedelta(days=30)
(d2 - d1).days
datetime.now(timezone.utc)                  # aware, never naive utcnow()
```

Month arithmetic has no timedelta — go via `(year, month)` maths or `dateutil.relativedelta`. First day of month: `d.replace(day=1)`. Last day: `next_month.replace(day=1) - timedelta(days=1)`.

## Files, csv, json, pathlib

```python
from pathlib import Path
p = Path("data") / "raw" / "sales.csv"
p.exists(); p.stem; p.suffix; p.parent
for f in Path("data").glob("**/*.csv"): ...
```

```python
import csv, json
with open(p, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):            # row is a dict keyed by header
        ...

with open(out, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)

json.loads(text); json.dumps(obj, default=str, indent=2)
```

Large JSON lines: read line by line and `json.loads` each — never `json.load` a 5 GB file.

## Errors, EAFP, and validation

```python
try:
    value = int(raw)
except ValueError:
    value = None                     # expected-bad input

d.get("key", default)                # expected-missing key: no exception
```

**EAFP** (try/except) for the rare failure, **LBYL** (`get`, `in`, `Path.exists`) for the common one. Never bare `except:` — it swallows `KeyboardInterrupt`. Catch the narrowest class, and re-raise with context: `raise ValueError(f"bad row {i}") from err`.

## One-pass aggregation — the pattern tests grade

```python
from collections import defaultdict

stats = defaultdict(lambda: {"n": 0, "total": 0.0, "max": float("-inf")})
for r in rows:                                     # single O(n) pass
    s = stats[r["user_id"]]
    s["n"] += 1
    s["total"] += r["amount"]
    s["max"] = max(s["max"], r["amount"])

out = [{"user_id": k, "avg": v["total"] / v["n"], **v} for k, v in stats.items()]
```

Rules that score points: one pass instead of repeated scans, hash lookup instead of nested loops, generator instead of intermediate lists, and stating the complexity out loud (`O(n) time, O(k) memory for k distinct keys`).
