# Algorithms & Complexity Quiz

Pattern recognition and Big-O. What a coding test checks before it checks your syntax.

---

## Questions

**1.** Membership testing in a `list` inside a loop over n items costs:
- A) O(n)
- B) O(n²)
- C) O(n log n)
- D) O(1)

**2.** Binary search requires:
- A) A hash map
- B) Distinct values
- C) Sorted input
- D) Integer values

**3.** Binary search complexity:
- A) O(log n) time, O(1) space
- B) O(n) time
- C) O(n log n)
- D) O(log n) space

**4.** "Find the k largest values in a 50 GB stream" — best structure:
- A) Sort everything then slice
- B) A min-heap of size k, O(n log k) time and O(k) memory
- C) A dict of every value
- D) Two pointers

**5.** `heapq` implements:
- A) A max-heap
- B) A balanced binary search tree
- C) A min-heap over a plain list
- D) A skip list

**6.** Getting a max-heap out of `heapq`:
- A) Push negated values and negate on pop
- B) Pass `reverse=True`
- C) Use `heapq.heapmax`
- D) Impossible

**7.** "Longest substring without repeating characters" is which pattern?
- A) Sliding window
- B) Binary search
- C) Union-find
- D) Topological sort

**8.** A sliding window turns an O(n·k) nested loop into:
- A) O(log n)
- B) O(n)
- C) O(n log n)
- D) O(k²)

**9.** Two-sum on an **unsorted** array, optimal:
- A) Sort then two pointers, O(n log n)
- B) Nested loops, O(n²)
- C) One pass with a hash map of complements, O(n)
- D) Binary search each element

**10.** Two pointers from both ends requires:
- A) Sorted input (or a symmetric property such as a palindrome)
- B) A heap
- C) Recursion
- D) Distinct values

**11.** Prefix sums let you answer a range-sum query in:
- A) O(1) after O(n) preprocessing
- B) O(n) per query
- C) O(log n) per query
- D) O(n log n)

**12.** The stdlib one-liner for prefix sums:
- A) `functools.reduce`
- B) `itertools.accumulate`
- C) `statistics.cumsum`
- D) `math.fsum`

**13.** Python's `sorted` uses Timsort, which is:
- A) O(n log n) worst case and **stable**
- B) O(n²) worst case
- C) Unstable but faster
- D) O(n) always

**14.** Stability means:
- A) It never raises
- B) It sorts in place
- C) Equal elements keep their relative order
- D) It handles mixed types

**15.** Sorting by dept ascending and salary descending in one pass:
- A) `key=lambda r: (r["dept"], -r["salary"])`
- B) `reverse=True`
- C) Two `sorted` calls with `reverse=True` on both
- D) Not possible with one key

**16.** Beating O(n log n) for sorting is only possible when:
- A) The data is already in memory
- B) Values are small bounded integers — counting/radix sort, O(n + k)
- C) You use a heap
- D) Never

**17.** "Next greater element" for every position, in O(n):
- A) Monotonic stack
- B) Nested loops
- C) Binary search
- D) BFS

**18.** Correct structure for a FIFO queue in Python:
- A) `list` with `pop(0)`
- B) `set`
- C) `collections.deque` with `popleft()`
- D) `heapq`

**19.** BFS on an unweighted graph gives you:
- A) The shortest path in number of edges
- B) The cheapest weighted path
- C) A topological order
- D) The minimum spanning tree

**20.** Complexity of BFS or DFS over a graph:
- A) O(V log V)
- B) O(V²) always
- C) O(V + E)
- D) O(E log V)

**21.** Recursive DFS on a very deep graph fails because:
- A) Python's recursion limit is about 1000 frames — use an explicit stack
- B) DFS cannot be recursive
- C) It is O(n²)
- D) `seen` sets overflow

**22.** Weighted shortest path needs:
- A) BFS
- B) Dijkstra — BFS with a priority queue
- C) Union-find
- D) Topological sort

**23.** Topological sort applies to:
- A) Any graph
- B) A DAG — and it is exactly how a scheduler like Airflow orders tasks
- C) Trees only
- D) Weighted graphs only

**24.** In Kahn's algorithm, nodes still unprocessed when the queue empties mean:
- A) The graph has a cycle
- B) The graph is disconnected
- C) Nothing, it is normal
- D) There are duplicate edges

**25.** Union-find is the right tool for:
- A) Shortest paths
- B) Sorting
- C) "Are these two records part of the same group" / connected components
- D) Range queries

**26.** Dynamic programming is signalled by:
- A) Sorted input
- B) A graph structure
- C) Optimal substructure plus **overlapping** subproblems
- D) Large memory

**27.** `@functools.cache` on a naive recursive `fib`:
- A) Turns exponential time into linear, trading O(n) memory
- B) Has no effect
- C) Makes it O(log n)
- D) Only works on ints

**28.** Kadane's algorithm (maximum subarray) costs:
- A) O(n) time, O(1) space
- B) O(n log n)
- C) O(n²)
- D) O(n) space

**29.** Merging overlapping intervals starts with:
- A) A heap
- B) Sorting by start time
- C) A hash map
- D) Binary search

**30.** Two intervals `a` and `b` overlap exactly when:
- A) `a.start < b.end and b.start < a.end`
- B) `a.start < b.start`
- C) `a.end == b.start`
- D) They share an endpoint

**31.** "Minimum meeting rooms needed" is solved by:
- A) Sorting once
- B) A sweep over sorted start/end events, +1 on start, −1 on end, tracking the max
- C) Union-find
- D) DP

**32.** Nested loops multiply and sequential loops:
- A) Multiply too
- B) Add — and you keep only the dominant term
- C) Cancel out
- D) Become logarithmic

**33.** `O(3n + 5)` is reported as:
- A) O(3n)
- B) O(n)
- C) O(n + 5)
- D) O(1)

**34.** Counting occurrences of every value, then the 3 most frequent:
- A) `collections.Counter(items).most_common(3)`
- B) `sorted(items)[:3]`
- C) `set(items)`
- D) `heapq.nsmallest(3, items)`

**35.** The general hash-map trick behind two-sum is:
- A) Sorting on the fly
- B) Recursion
- C) While scanning, ask whether the value that completes the answer was already seen
- D) Caching the whole array

**36.** `bisect.bisect_right(a, x) - bisect.bisect_left(a, x)` gives:
- A) The number of occurrences of x, in O(log n)
- B) The index of x
- C) The insertion point
- D) The length of a

**37.** Deciding between a heap and a full sort for "top 10 of 10 million":
- A) Sort — simpler and equally fast
- B) The heap: O(n log k) time and O(k) memory instead of O(n log n) and O(n)
- C) Identical either way
- D) Neither, use a set

**38.** When asked for complexity in an interview you should state:
- A) Time only
- B) Space only
- C) Both time and space, with the dominant source named
- D) Just "it is fast"

## Answer key

1 - B
2 - C
3 - A
4 - B
5 - C
6 - A
7 - A
8 - B
9 - C
10 - A
11 - A
12 - B
13 - A
14 - C
15 - A
16 - B
17 - A
18 - C
19 - A
20 - C
21 - A
22 - B
23 - B
24 - A
25 - C
26 - C
27 - A
28 - A
29 - B
30 - A
31 - B
32 - B
33 - B
34 - A
35 - C
36 - A
37 - B
38 - C

### One-line rationales

1. Linear scan inside a linear loop = **O(n²)**. Convert the list to a set first.
2. Binary search needs **sorted** input; that is the whole premise of halving.
3. **O(log n)** time, constant space — halve the range each step.
4. A size-k **min-heap** streams: keep k, drop the smallest. O(n log k), O(k) memory.
5. `heapq` is a **min-heap** implemented over an ordinary list.
6. Push **negated** values to invert the ordering.
7. Contiguous + "no repeats" = **sliding window** with a last-seen map.
8. The window moves right only, so each element enters and leaves once — **O(n)**.
9. **Hash map of complements**, one pass, O(n). Sorting throws away the original indices.
10. Two pointers converging need order (sorted) or symmetry (palindrome).
11. Precompute cumulative sums once, then any range is a **subtraction** — O(1).
12. `itertools.accumulate` is the built-in running total.
13. **Timsort**: O(n log n) worst case, O(n) on nearly-sorted input, and stable.
14. **Stability** = equal elements keep their prior order, enabling multi-pass sorting.
15. Tuple key with a **negated** numeric field flips that field to descending.
16. Comparison sorts are bounded at n log n; **counting/radix** sort escapes it for bounded integers.
17. A **monotonic stack** resolves each element once — O(n).
18. `deque.popleft()` is O(1); `list.pop(0)` is O(n).
19. BFS explores level by level, so it finds the **fewest-edge** path.
20. Every vertex and edge is touched once — **O(V + E)**.
21. The default recursion limit is ~1000; deep graphs need an **explicit stack**.
22. **Dijkstra** = BFS plus a priority queue for edge weights.
23. Topological order exists only for a **DAG** — this is Airflow's dependency resolution.
24. Leftover nodes mean a **cycle**; Kahn's algorithm detects it for free.
25. **Union-find** answers connectivity and merges groups near O(1) per operation.
26. DP needs **overlapping subproblems** plus optimal substructure — otherwise it is plain recursion or greedy.
27. Memoisation collapses the exponential call tree to **linear**, at O(n) cache cost.
28. **Kadane**: one pass carrying `cur` and `best` — O(n) time, O(1) space.
29. **Sort by start**, then sweep and extend the last interval when it overlaps.
30. Strict inequality on both sides is the standard overlap test.
31. The **event sweep** (+1 start, −1 end) tracks concurrency; the max is the room count.
32. Sequential work **adds**; you report only the dominant term.
33. Constants and lower-order terms are dropped: **O(n)**.
34. `Counter` + `most_common(k)` is the idiomatic frequency answer.
35. The **complement / "already seen"** scan generalises far beyond two-sum.
36. The gap between the two bisect points is the **count of equal values**, in O(log n).
37. A **bounded heap** wins on both time and memory when k ≪ n.
38. Always state **time and space**, and name what dominates.
