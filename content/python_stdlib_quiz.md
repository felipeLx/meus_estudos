# Python — Stdlib Quiz (hackathon / coding tests)

Which package, which structure, which idiom. The stuff timed tests assume you know cold.

---

## Questions

**1.** Counting occurrences of every element in a list, fastest to write:
- A) `dict` with manual `if key in d`
- B) `collections.Counter(items)`
- C) `set(items)`
- D) `sorted(items)`

**2.** `Counter.most_common(3)` returns:
- A) The 3 rarest elements
- B) A list of `(element, count)` tuples for the 3 highest counts
- C) A dict
- D) The first 3 inserted

**3.** Grouping rows by key without checking whether the key exists:
- A) `collections.defaultdict(list)`
- B) `dict.get(key)`
- C) `collections.deque`
- D) `set`

**4.** `d = defaultdict(int); d['x'] += 1` works because:
- A) `int` is imported
- B) Missing keys are created by calling the factory — `int()` returns 0
- C) Python coerces None to 0
- D) It raises and is caught

**5.** O(1) pops from *both* ends of a queue:
- A) `list` with `pop(0)`
- B) `collections.deque` with `popleft()` / `pop()`
- C) `tuple`
- D) `set`

**6.** `deque(maxlen=5)` behaves as:
- A) An error after 5 items
- B) A sliding window — appending past the limit drops from the other end
- C) A sorted list
- D) A fixed tuple

**7.** A lightweight record with named fields, immutable, tuple-cheap:
- A) `collections.namedtuple` (or `typing.NamedTuple`)
- B) `dict`
- C) `list`
- D) `set`

**8.** For a mutable record with defaults, type hints and free `__repr__`/`__eq__`:
- A) `dataclasses.dataclass`
- B) `namedtuple`
- C) `struct`
- D) `object`

**9.** Mutable default in a dataclass field must use:
- A) `x: list = []`
- B) `x: list = field(default_factory=list)`
- C) `x: list = None`
- D) `x = list`

**10.** Smallest/largest N of a big iterable without a full sort:
- A) `sorted(x)[:n]`
- B) `heapq.nsmallest(n, x)` / `heapq.nlargest(n, x)`
- C) `min(x)` in a loop
- D) `random.sample`

**11.** A priority queue in Python is:
- A) `queue.Queue`
- B) `heapq` on a plain list — `heappush` / `heappop` keep the min at index 0
- C) `deque`
- D) `sorted()` every insert

**12.** To pop the *largest* with `heapq`:
- A) `heappop` returns it already
- B) Push negated values (`-x`) and negate on pop
- C) Impossible
- D) Use `sort(reverse=True)`

**13.** Insert position into a sorted list in O(log n):
- A) `bisect.bisect_left` / `insort`
- B) `list.index`
- C) `in`
- D) `sorted()`

**14.** Cartesian product / pairs / running accumulation come from:
- A) `itertools` — `product`, `combinations`, `accumulate`
- B) `functools`
- C) `operator`
- D) `math`

**15.** `itertools.groupby(rows, key=f)` requires:
- A) Nothing special
- B) The input already sorted by the same key — it groups consecutive runs only
- C) A dict input
- D) Unique keys

**16.** Flattening `[[1,2],[3,4]]`:
- A) `itertools.chain.from_iterable(x)` or `[i for s in x for i in s]`
- B) `sum(x)`
- C) `x.flat()`
- D) `zip(*x)`

**17.** Memoizing a pure recursive function:
- A) `functools.lru_cache` / `functools.cache`
- B) A global dict, by hand
- C) `staticmethod`
- D) `itertools.cycle`

**18.** `functools.reduce(lambda a, b: a + b, nums)` is equivalent to:
- A) `sum(nums)`
- B) `max(nums)`
- C) `sorted(nums)`
- D) `len(nums)`

**19.** Sorting objects by two keys, second descending on a numeric field:
- A) `sorted(x, key=lambda r: (r.a, -r.b))`
- B) `sorted(x, key=r.a, reverse=True)`
- C) Two separate sorts always break
- D) `x.sort(cmp=...)`

**20.** `operator.itemgetter('name')` versus a lambda:
- A) Identical but itemgetter is C-level, faster and cleaner in `sorted(key=...)`
- B) Slower
- C) Only works on tuples
- D) Deprecated

**21.** Splitting a messy string on any of `,` `;` `|`:
- A) `re.split(r'[;,|]\s*', s)`
- B) `s.split(',')` three times
- C) `str.partition`
- D) `s.strip()`

**22.** Extracting all numbers from text:
- A) `re.findall(r'-?\d+(?:\.\d+)?', s)`
- B) `re.match`
- C) `s.isdigit()`
- D) `int(s)`

**23.** `re.match` vs `re.search`:
- A) Identical
- B) `match` anchors at the string start; `search` scans anywhere
- C) `search` is anchored
- D) `match` returns a list

**24.** Parsing `"2024-03-01"` into a date:
- A) `datetime.strptime(s, "%Y-%m-%d")` or `date.fromisoformat(s)`
- B) `int(s)`
- C) `time.time()`
- D) `str(s)`

**25.** Adding 30 days to a date:
- A) `d + timedelta(days=30)`
- B) `d + 30`
- C) `d.add(30)`
- D) `datetime(30)`

**26.** Reading a CSV with a header into dicts, stdlib only:
- A) `csv.DictReader(open(path, newline=''))`
- B) `open(path).read().split(',')`
- C) `json.load`
- D) `pickle.load`

**27.** Joining paths portably:
- A) `pathlib.Path(base) / "sub" / "file.csv"`
- B) `base + "/" + name`
- C) `os.sep.join` by hand
- D) f-string with backslashes

**28.** Iterating a huge file without loading it into memory:
- A) `for line in open(path):` — the file object is a lazy iterator
- B) `f.readlines()`
- C) `f.read().split("\n")`
- D) `list(f)`

**29.** A generator (`yield`) beats a list when:
- A) You need indexing
- B) You stream large data and only consume it once — constant memory
- C) You need `len()`
- D) Always

**30.** `with open(path) as f:` guarantees:
- A) Faster IO
- B) The file is closed even if the block raises (context manager)
- C) The file is locked
- D) The content is cached

**31.** Deduplicating a list while preserving order:
- A) `list(dict.fromkeys(items))`
- B) `list(set(items))`
- C) `sorted(set(items))`
- D) `items.unique()`

**32.** `zip(*rows)` on a list of equal-length rows:
- A) Sorts them
- B) Transposes — columns become rows
- C) Raises
- D) Flattens

**33.** `enumerate(items, start=1)` gives:
- A) `(1, first_item)`, `(2, second_item)`, …
- B) `(0, first_item)`
- C) Only indexes
- D) A dict

**34.** Safe integer division that floors toward negative infinity:
- A) `a // b`
- B) `int(a / b)`
- C) `round(a / b)`
- D) `divmod` only

**35.** Money should not use `float` because:
- A) It is slow
- B) Binary floats cannot represent 0.1 exactly — use `decimal.Decimal`
- C) It has no `__add__`
- D) It is deprecated

**36.** `statistics.median(xs)` vs `mean(xs)` on skewed data:
- A) Identical
- B) Median resists outliers, mean is dragged by them
- C) Mean resists outliers
- D) Median needs sorted input

**37.** Type hints in a test are worth writing because:
- A) They run faster
- B) They document intent and catch shape errors early — the runtime ignores them
- C) They are mandatory
- D) They enable JIT

**38.** `json.dumps(obj, default=str)` helps when:
- A) The object holds non-serialisable values like `datetime`/`Decimal`
- B) The JSON is too big
- C) Keys are ints
- D) Never

**39.** `try/except KeyError` versus `d.get(k, default)`:
- A) `get` avoids the exception for an expected-missing key; exceptions are for exceptional paths
- B) Identical cost always
- C) `get` is deprecated
- D) `get` raises too

**40.** Grouping+aggregating 1M rows in pure Python, fastest shape:
- A) One pass with `defaultdict(list)` / `Counter`, O(n)
- B) Sort then scan repeatedly
- C) Nested loops over unique keys, O(n²)
- D) `pandas` always, even for a list of dicts

---

## Answer key

1-B · 2-B · 3-A · 4-B · 5-B · 6-B · 7-A · 8-A · 9-B · 10-B · 11-B · 12-B · 13-A · 14-A · 15-B · 16-A · 17-A · 18-A · 19-A · 20-A · 21-A · 22-A · 23-B · 24-A · 25-A · 26-A · 27-A · 28-A · 29-B · 30-B · 31-A · 32-B · 33-A · 34-A · 35-B · 36-B · 37-B · 38-A · 39-A · 40-A

### One-line rationales (the reusable idea)
1. **Counter** is the frequency table — `Counter(items)` in one line.
2. `most_common(n)` → `[(elem, count), …]` sorted by count desc.
3. **defaultdict(list)** removes every `if key not in d` branch.
4. Factory is *called* on a missing key: `int()`→0, `list()`→[], `set()`→set().
5. **deque** = O(1) both ends; `list.pop(0)` is O(n).
6. `deque(maxlen=n)` = free sliding window (rolling stats, last-N cache).
7. **namedtuple** = immutable record, tuple memory, `.field` access.
8. **dataclass** = mutable record with defaults, repr, eq, `asdict()`.
9. Shared mutable defaults are the classic bug — `field(default_factory=list)`.
10. **heapq.nsmallest/nlargest** = O(n log k), no full sort.
11. **heapq** turns a list into a min-heap: `heappush`, `heappop`, `heapify`.
12. Max-heap trick = push `-value`; for tuples push `(-score, item)`.
13. **bisect** = binary search on a sorted list; `insort` keeps it sorted.
14. **itertools**: `product`, `permutations`, `combinations`, `accumulate`, `islice`, `chain`, `cycle`, `groupby`.
15. **groupby groups consecutive runs** — sort by the key first or results silently fragment.
16. `chain.from_iterable` = flatten one level, lazily.
17. **@lru_cache(maxsize=None)** / `@cache` = memo in one decorator line.
18. `reduce(add)` = `sum`; reach for reduce only when there is no builtin.
19. Tuple keys sort lexicographically; negate a numeric field to flip its direction.
20. **operator.itemgetter/attrgetter** — C-level key functions, faster than lambdas.
21. **re.split** with a character class handles mixed delimiters in one pass.
22. `findall` with `-?\d+(?:\.\d+)?` grabs ints and floats, signed.
23. **match = anchored at start**, **search = anywhere**, `fullmatch` = whole string.
24. `date.fromisoformat` for ISO input; `strptime` for anything else.
25. **timedelta** does all date arithmetic; never add raw ints to dates.
26. **csv.DictReader** — and always `newline=''` on Windows to avoid blank rows.
27. **pathlib** — `/` operator, `.stem`, `.suffix`, `.exists()`, `.glob()`.
28. File objects **iterate lazily**, line by line — constant memory.
29. **Generators** stream: constant memory, single pass, no indexing/len.
30. **Context managers** close deterministically, even on exception.
31. `dict.fromkeys` dedupes and **keeps insertion order**; `set` loses it.
32. `zip(*rows)` **transposes** — rows ⇄ columns.
33. `enumerate(x, start=1)` for 1-based reports.
34. `//` floors (`-7 // 2 == -4`); `int(a/b)` truncates toward zero.
35. **Decimal** for money — binary floats drift (`0.1 + 0.2 != 0.3`).
36. **Median** is the robust centre; report both when data is skewed.
37. Hints are **documentation the reader trusts**; runtime ignores them.
38. `default=str` serialises `datetime`/`Decimal` without a custom encoder.
39. `get` for expected-missing keys; **exceptions for exceptional flow**.
40. **One hash pass, O(n)** — the pattern every timed test is grading.
