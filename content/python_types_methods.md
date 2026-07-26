# Python — Types, Methods & Built-in Functions

The everyday API. One card per type: the operations, the methods, the traps.
Say the answer out loud before revealing — in a coding test you type these without thinking.

## dict — operations you use every day

```python
len(d)                    # number of items
for key in d: ...         # iterate keys
for k, v in d.items(): ...# iterate key/value pairs
for v in d.values(): ...  # iterate values
if key in d: ...          # membership test — O(1), checks KEYS not values
d[key]                    # read (KeyError if missing)
d[key] = value            # insert or overwrite
del d[key]                # remove (KeyError if missing)

merged = d1 | d2          # new dict, d2 wins on shared keys   (3.9+)
d1 |= d2                  # update d1 in place from d2         (3.9+)
```

Notes that matter:
- `in` on a dict tests **keys**. For values: `value in d.values()` — and that is O(n).
- Dicts keep **insertion order** (3.7+). `sorted(d)` gives sorted keys.
- Keys must be **hashable**: str, int, tuple ok — list, dict, set are not.
- `d1 | d2` and `{**d1, **d2}` are equivalent; `|` is the modern spelling.

## dict — methods

```python
d.get(key, default)       # value or default, never raises
d.keys()                  # live view: iterable, NOT indexable (no d.keys()[0])
d.values()                # live view of values, updates when d changes
d.items()                 # live view of (key, value) pairs
d.setdefault(key, [])     # get, inserting the default first if key is missing
d.pop(key, default)       # remove and return
d.popitem()               # remove and return the LAST inserted pair (3.7+)
d.update(other)           # merge in place: existing keys overwritten, new keys added
d.clear()                 # empty it
d.copy()                  # SHALLOW copy — nested objects are still shared
d[key].append(value)      # only works if the value is mutable (a list)
```

Traps:
- `.keys()` is a **view**, not a list. Need indexing? `list(d.keys())[0]`.
- A view iterated while the dict changes size raises `RuntimeError` — iterate `list(d.items())` if you mutate.
- `d.copy()` is shallow: `import copy; copy.deepcopy(d)` for nested structures.
- `d[key].append(v)` on a missing key raises — use `defaultdict(list)` or `setdefault`.

## dict — the four ways to group/count, and which to pick

```python
# 1. verbose, works everywhere
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1

# 2. setdefault — one line, no import
groups = {}
for r in rows:
    groups.setdefault(r["dept"], []).append(r)

# 3. defaultdict — cleanest when grouping
from collections import defaultdict
groups = defaultdict(list)
for r in rows:
    groups[r["dept"]].append(r)

# 4. Counter — cleanest when counting
from collections import Counter
counts = Counter(words)
counts.most_common(3)
```

Pick: **counting → `Counter`**, **grouping → `defaultdict(list)`**, **one-off with no import → `.get()`/`setdefault`**.
Careful with `defaultdict`: merely *reading* `d[missing]` creates the key. Use `.get()` when you only want to look.

## dict & set comprehensions — the shapes worth memorising

```python
{k: v for k, v in pairs}                     # build from pairs
{v: k for k, v in d.items()}                 # invert (last duplicate wins)
{k: v for k, v in d.items() if v > 10}       # filter
{k: f(v) for k, v in d.items()}              # map values
dict(zip(keys, values))                      # two parallel lists -> dict
{r["id"]: r for r in rows}                   # index rows by key (dedupe, last wins)
{x for x in items if cond}                   # set comprehension
```

`zip(keys, values)` stops at the shorter one — `zip(..., strict=True)` (3.10+) raises instead, which is what you want in ETL.

## list — operations and methods

```python
lst[i]      lst[-1]      lst[a:b]     lst[::-1]      # index, last, slice, reverse
lst.append(x)          # O(1) add one at the end
lst.extend(other)      # O(k) add many        (lst += other)
lst.insert(0, x)       # O(n) — shifts everything
lst.pop()              # O(1) from the end
lst.pop(0)             # O(n) — use collections.deque for a queue
lst.remove(x)          # removes FIRST occurrence by value, ValueError if absent
lst.index(x)           # position of first occurrence
lst.count(x)           # occurrences
lst.sort(key=..., reverse=True)   # IN PLACE, returns None
sorted(lst, key=...)              # NEW list
lst.reverse()          # in place    |  reversed(lst) -> iterator
lst.copy()             # shallow     |  lst[:] same thing
```

Traps:
- `x = lst.sort()` gives `None`. In-place methods return `None` — this is the classic test mistake.
- `x in lst` is **O(n)**; on a `set` it is O(1). Membership in a loop = convert to a set first.
- `[[]] * 3` makes three references to the **same** list. Use `[[] for _ in range(3)]`.
- Never delete from a list you are iterating — build a new one with a comprehension.

## str — the methods that show up in every test

```python
s.strip() / .lstrip() / .rstrip()   # trim whitespace (or given chars)
s.lower() / .upper() / .title() / .casefold()
s.split(",")        # str -> list   ("a,b".split(",") -> ["a","b"])
s.split()           # split on ANY whitespace run, drops empties
",".join(parts)     # list -> str   (parts must be strings)
s.replace(old, new)
s.startswith(p) / s.endswith(p)     # both accept a tuple of options
s.find(sub)         # -1 if absent  |  s.index(sub) raises
s.count(sub)
s.zfill(3) / s.ljust(10) / s.rjust(10)
s.isdigit() / .isalpha() / .isalnum()
f"{value:.2f}"  f"{n:,}"  f"{name!r}"  f"{x=}"     # f-strings
```

Traps:
- Strings are **immutable**: every method returns a new string. Building one in a loop with `+=` is O(n²) — collect into a list and `"".join(...)`.
- `"a,b,,c".split(",")` → `['a','b','','c']` (empty kept), but `" a  b ".split()` → `['a','b']`.
- `.strip("abc")` strips any of those *characters*, not the substring `"abc"`.
- Removing a prefix: `s.removeprefix("id_")` (3.9+), not `.strip("id_")`.

## set — operations and when it saves you

```python
s.add(x)       s.discard(x)   # no error if absent   |  s.remove(x) raises
s.update(it)   s.pop()        # arbitrary element
a | b   a.union(b)            # union
a & b   a.intersection(b)     # common
a - b   a.difference(b)       # in a, not in b
a ^ b   a.symmetric_difference(b)
a <= b  a.issubset(b)         # containment
```

Use a set when you need: **dedupe** (`list(set(x))` — order lost; `list(dict.fromkeys(x))` keeps it),
**fast membership**, or **"which ids are missing / new / changed"** — that last one is the data-engineering answer:
`new = current_ids - previous_ids`.

Sets are unordered and hold only hashable items. `{}` is an empty **dict** — an empty set is `set()`.

## tuple, unpacking and namedtuple

```python
p = (10, 20)
x, y = p                      # unpack
a, b = b, a                   # swap, no temp
first, *rest = [1, 2, 3, 4]   # star unpacking -> 1, [2,3,4]
for i, v in enumerate(items, start=1): ...
for k, v in zip(keys, vals): ...
```

Tuples are immutable and **hashable**, so they work as dict keys and set members — that is how you key a composite:
`totals[(store, day)] += amount`. Sorting by several fields is a tuple key: `key=lambda r: (r["dept"], -r["salary"])`.

`collections.namedtuple` / `typing.NamedTuple` give tuples with field names; `dataclass` gives a mutable record with defaults and `__repr__`.

## Built-in functions ranked by how often you actually type them

```python
len, range, enumerate, zip, sorted, reversed
sum, min, max, abs, round
any, all
map, filter          # a comprehension is usually clearer
list, dict, set, tuple, str, int, float, bool
isinstance, type
print, input, open
sorted(x, key=..., reverse=...)
min(rows, key=lambda r: r["ts"])       # key works on min/max too
sum(1 for r in rows if r["ok"])        # count with a condition
divmod(a, b)    # (quotient, remainder)
```

High-value details:
- `sorted` is **stable** — sort by the secondary key first, then the primary, and ties keep the earlier order.
- `any()`/`all()` **short-circuit** and accept a generator: `any(r["amount"] < 0 for r in rows)`.
- `round()` uses banker's rounding: `round(2.5) == 2`. For money use `decimal.Decimal`.
- `enumerate(items, start=1)` beats a manual counter every time.
- `sum(list_of_lists, [])` flattens but is O(n²) — use `itertools.chain.from_iterable`.

## Truthiness, None and equality — the questions tests love

```python
falsy: 0, 0.0, "", [], {}, set(), None, False
if not items:        # empty check — pythonic
if x is None:        # identity for None, never ==
if x == 0 and x is not False:   # careful: False == 0 is True
```

- `is` compares identity, `==` compares value. Only use `is` with `None`, `True`, `False`.
- Mutable **default arguments** are the classic bug: `def f(acc=[])` shares one list across calls — use `def f(acc=None): acc = acc or []`.
- `0.1 + 0.2 != 0.3` — float binary representation. Compare with `math.isclose`, store money as `Decimal` or integer cents.
- Chained comparison works: `0 <= x < 10`.

## Big-O of the operations you pick between

| Operation | list | dict / set | deque |
|---|---|---|---|
| index `x[i]` | O(1) | — | O(n) |
| membership `x in c` | **O(n)** | **O(1)** | O(n) |
| append / add | O(1)* | O(1) | O(1) |
| insert/pop at front | **O(n)** | — | **O(1)** |
| delete by key/value | O(n) | O(1) | O(n) |
| sort | O(n log n) | — | — |

\* amortised. The single most common performance fix in a coding test: **an `in` check against a list inside a loop** → convert to a set. O(n²) becomes O(n).
