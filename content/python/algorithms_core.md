# Algorithms — The Ones Worth Knowing

Not a CS course. These are the patterns that actually appear in data/analytics coding tests,
plus the complexity you must be able to state out loud. For each: **when you recognise it →
the template → the cost**.

## How to recognise which pattern a problem wants

| Clue in the problem | Pattern |
|---|---|
| "count / frequency / most common" | hash map (`Counter`) |
| "has it been seen / duplicates / missing" | set |
| "sorted input" + "find a value or boundary" | binary search |
| "sorted input" + "pair / triplet summing to" | two pointers |
| "contiguous subarray / substring", "window of size k" | sliding window |
| "top K / K largest / K closest" | heap |
| "range sum / average between i and j" | prefix sum |
| "next greater / nearest smaller / valid parentheses" | stack |
| "shortest path in unweighted graph / levels" | BFS |
| "all paths / connected / cycle / dependencies" | DFS / topological sort |
| "groups that merge / are these connected" | union-find |
| "max/min total, choices, overlapping subproblems" | dynamic programming |
| "schedule / minimum rooms / merge intervals" | sort by start, sweep |

Say the pattern name before you code. Interviewers grade recognition more than syntax.

## Complexity — what you must be able to state

| Class | Name | Typical source |
|---|---|---|
| O(1) | constant | dict/set lookup, arithmetic |
| O(log n) | logarithmic | binary search, heap push/pop |
| O(n) | linear | one pass over the data |
| O(n log n) | linearithmic | **sorting**, heapify + n pops |
| O(n²) | quadratic | nested loop, `in` against a list inside a loop |
| O(2ⁿ) | exponential | naive recursion over subsets |

Rules for the interview:
- Drop constants and lower terms: `O(3n + 5)` is `O(n)`.
- Nested loops **multiply**, sequential loops **add**.
- Always give **time and space**. "O(n) time, O(k) extra space for the heap."
- Sorting is the usual floor: if your solution sorts, you cannot beat O(n log n) unless you switch to hashing or counting sort.

## Binary search — template and the boundary variant

Requires **sorted** input. O(log n) time, O(1) space.

```python
def search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2          # in Python no overflow, but lo + (hi-lo)//2 is the safe idiom
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

The variant that gets asked more: **leftmost insertion point** — use the stdlib and say so.

```python
import bisect
i = bisect.bisect_left(a, x)    # first index where a[i] >= x
j = bisect.bisect_right(a, x)   # first index where a[i] > x
count_of_x = j - i              # occurrences, in O(log n)
```

Also binary-search **the answer**: "minimum capacity such that it fits in D days" — the predicate is monotonic, so search over the answer range, not the array.

## Two pointers — sorted pair sum, and the in-place variants

O(n) after sorting, O(1) extra space.

```python
def two_sum_sorted(a, target):
    i, j = 0, len(a) - 1
    while i < j:
        s = a[i] + a[j]
        if s == target:
            return i, j
        if s < target:
            i += 1        # need bigger
        else:
            j -= 1        # need smaller
    return None
```

Unsorted input? Do **not** sort — one pass with a hash map is O(n):

```python
def two_sum(a, target):
    seen = {}                       # value -> index
    for i, v in enumerate(a):
        if target - v in seen:
            return seen[target - v], i
        seen[v] = i
```

Same shape solves: remove duplicates in place, merge two sorted lists, container-with-most-water, palindrome check (pointers from both ends).

## Sliding window — fixed and variable size

Turns an O(n·k) nested loop into O(n). The window only ever moves right.

```python
# fixed size k: max sum of any k consecutive values
def max_window(a, k):
    cur = sum(a[:k])
    best = cur
    for i in range(k, len(a)):
        cur += a[i] - a[i - k]      # add entering, drop leaving
        best = max(best, cur)
    return best

# variable size: longest substring with no repeated character
def longest_unique(s):
    last = {}
    start = best = 0
    for i, ch in enumerate(s):
        if ch in last and last[ch] >= start:
            start = last[ch] + 1    # shrink from the left
        last[ch] = i
        best = max(best, i - start + 1)
    return best
```

Recognise it from "contiguous", "consecutive", "within the last N". Data version: rolling 7-day metric per user.

## Hash map patterns — the highest-value pattern in tests

Trading O(n) memory for O(1) lookups. Four shapes cover most problems:

```python
from collections import Counter, defaultdict

Counter(items).most_common(3)                 # frequency + top K

seen = set()                                  # dedupe / "have I seen this"
dups = {x for x in items if x in seen or seen.add(x)}

groups = defaultdict(list)                    # group by a key
for r in rows:
    groups[r["dept"]].append(r)

anagrams = defaultdict(list)                  # canonical key
for w in words:
    anagrams["".join(sorted(w))].append(w)
```

The **complement trick** (two-sum) generalises: while scanning, ask "have I already seen the thing that completes this?".
Cost: O(n) time, O(n) space — say the trade-off out loud, it is the whole point.

## Heaps — top K without sorting everything

`heapq` is a **min-heap** of a plain list. Push/pop O(log n), peek `h[0]` O(1).

```python
import heapq

heapq.nlargest(3, rows, key=lambda r: r["amount"])    # readable, fine for small K
heapq.nsmallest(3, values)

# streaming top-K: keep a heap of size K -> O(n log k) time, O(k) space
h = []
for v in stream:
    heapq.heappush(h, v)
    if len(h) > k:
        heapq.heappop(h)      # drops the smallest, so h holds the K largest

# max-heap: push negatives
heapq.heappush(h, -x); biggest = -heapq.heappop(h)

heapq.merge(a, b)             # lazily merge sorted iterables — constant memory
```

Why not just sort? Sorting is O(n log n) and needs all the data in memory. A size-K heap is **O(n log k)** and streams — that is the answer when the input "does not fit in memory".

## Prefix sums — range queries in O(1)

Precompute once, answer any range in constant time.

```python
pre = [0]
for v in a:
    pre.append(pre[-1] + v)

range_sum = pre[j + 1] - pre[i]        # inclusive i..j

import itertools
pre = list(itertools.accumulate(a))    # stdlib version
```

The companion trick: **count subarrays summing to k** with a hash map of prefix counts — O(n) instead of O(n²).

```python
from collections import defaultdict
def subarrays_with_sum(a, k):
    counts = defaultdict(int); counts[0] = 1
    running = total = 0
    for v in a:
        running += v
        total += counts[running - k]
        counts[running] += 1
    return total
```

SQL equivalent: a running total is `SUM(x) OVER (ORDER BY ts)`. Same idea, different engine.

## Sorting — what you actually need to know

Python's `sorted`/`.sort` is **Timsort**: O(n log n) worst case, O(n) on already-sorted data, and **stable**.

```python
sorted(rows, key=lambda r: (r["dept"], -r["salary"]))   # asc, then desc
sorted(words, key=len)
rows.sort(key=itemgetter("ts"))                          # operator.itemgetter is faster
```

Say-out-loud facts:
- **Stability** means you can sort in passes: sort by secondary key, then by primary.
- Descending on a numeric field: negate it in the tuple key. On a string field you cannot negate — sort twice, or use `reverse=True` on a separate pass.
- Merge sort O(n log n) stable / quicksort O(n log n) average, O(n²) worst / heapsort O(n log n) in place, unstable.
- **Counting sort** is O(n + k) when values are small bounded integers — the only way to beat n log n.

## Stacks and queues — the problems they solve

```python
stack = []; stack.append(x); stack.pop()               # LIFO
from collections import deque
q = deque(); q.append(x); q.popleft()                  # FIFO, both ends O(1)
```

Stack problems: **matching parentheses**, undo, **next greater element** (monotonic stack, O(n)), evaluating RPN, iterative DFS.

```python
def next_greater(a):
    res = [-1] * len(a)
    stack = []                       # holds indices, values decreasing
    for i, v in enumerate(a):
        while stack and a[stack[-1]] < v:
            res[stack.pop()] = v
        stack.append(i)
    return res
```

Queue problems: BFS levels, rate limiting, buffering. **Never** use `list.pop(0)` for a queue — O(n) each time.

## BFS and DFS — graph traversal templates

Graph as `dict[node] -> list[node]`. Both O(V + E).

```python
from collections import deque

def bfs(graph, start):               # shortest path in an UNWEIGHTED graph, level by level
    seen = {start}
    q = deque([start])
    while q:
        node = q.popleft()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                q.append(nxt)
    return seen

def dfs(graph, node, seen=None):     # reachability, cycles, components
    seen = seen or set()
    seen.add(node)
    for nxt in graph[node]:
        if nxt not in seen:
            dfs(graph, nxt, seen)
    return seen
```

BFS when you need **fewest steps / nearest**. DFS when you need **all paths / structure**. Recursive DFS blows the stack around ~1000 deep — use the explicit-stack version on big graphs. Weighted shortest path is **Dijkstra** (BFS with a heap).

## Topological sort — the DAG algorithm you already use

Ordering tasks so every dependency runs first. This *is* Airflow's scheduler, and the honest answer when asked "any graph algorithms in your work?".

```python
from collections import deque, defaultdict

def topo_sort(nodes, edges):                     # edges: (a, b) means a before b
    indeg = {n: 0 for n in nodes}
    adj = defaultdict(list)
    for a, b in edges:
        adj[a].append(b)
        indeg[b] += 1

    q = deque([n for n in nodes if indeg[n] == 0])
    order = []
    while q:
        n = q.popleft()
        order.append(n)
        for m in adj[n]:
            indeg[m] -= 1
            if indeg[m] == 0:
                q.append(m)

    if len(order) != len(nodes):
        raise ValueError("cycle detected")       # exactly how a DAG validator works
    return order
```

O(V + E). The leftover nodes when the queue empties are the **cycle** — that is the cycle detection, for free.

## Union-find — "are these connected"

Near-O(1) per operation with path compression. Use for merging groups: dedupe entity resolution, connected components, Kruskal's MST.

```python
class DSU:
    def __init__(self, n):
        self.p = list(range(n))

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]     # path compression
            x = self.p[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                      # already together
        self.p[rb] = ra
        return True
```

Data use case: "these email/phone records belong to the same customer" — union every matching pair, then group by root.

## Dynamic programming — the minimum you should be able to write

Recognise it when: choices at each step, an optimal answer, and **overlapping subproblems**.
Method: define the state, write the recurrence, decide top-down (memo) or bottom-up (table).

```python
from functools import cache

@cache                                  # memoised recursion — the cheap way in
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

def climb(n):                           # bottom-up, O(n) time, O(1) space
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

def coin_change(coins, amount):         # min coins, O(amount * len(coins))
    dp = [0] + [float("inf")] * amount
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i:
                dp[i] = min(dp[i], dp[i - c] + 1)
    return -1 if dp[amount] == float("inf") else dp[amount]
```

`@cache` (3.9+) / `@lru_cache` turns exponential recursion into linear with one line — mention it, it shows stdlib fluency. Classics worth recognising: knapsack, longest common subsequence, edit distance, max subarray (Kadane).

## Kadane and the one-pass aggregation habit

```python
def max_subarray(a):                    # O(n), O(1)
    best = cur = a[0]
    for v in a[1:]:
        cur = max(v, cur + v)           # extend, or start fresh here
        best = max(best, cur)
    return best
```

The general habit this teaches, and the one that transfers to data work: **carry a small running state through a single pass** instead of re-scanning. Count, sum, min, max, last-seen, running total, current group — all in one loop, O(n) time, O(1) or O(k) memory. That is also why streaming aggregations are cheap and why `GROUP BY` beats a self-join.

## Intervals — merge, overlap, room count

Sort by start, then sweep. O(n log n) dominated by the sort.

```python
def merge(intervals):
    out = []
    for start, end in sorted(intervals):
        if out and start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)   # overlaps -> extend
        else:
            out.append([start, end])
    return out
```

Two intervals overlap iff `a.start < b.end and b.start < a.end`.
"Minimum meeting rooms" = sweep the sorted start/end events, +1 on a start, −1 on an end, track the max — the same shape as sessionization and as counting concurrent users.
