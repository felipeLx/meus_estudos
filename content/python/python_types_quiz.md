# Python — Types, Methods & Built-ins Quiz

Dict, list, str, set, built-in functions. The API questions that decide a timed test.

---

## Questions

**1.** `len(d)` on a dictionary returns:
- A) The number of keys (= number of items)
- B) The number of values including duplicates
- C) The length of the longest key
- D) The number of characters

**2.** `if key in dictionary` checks:
- A) Keys only, in O(1)
- B) Keys and values
- C) Values only
- D) Keys, in O(n)

**3.** Iterating both key and value at once:
- A) `for k, v in d.items()`
- B) `for k, v in d`
- C) `for k in d.keys(), d.values()`
- D) `for v in d.values()`

**4.** `d1 | d2` (Python 3.9+) produces:
- A) A new dict; on shared keys the value from `d2` wins
- B) A new dict; on shared keys `d1` wins
- C) A set union of the keys
- D) An error — dicts do not support `|`

**5.** `d1 |= d2` differs from `d1 | d2` because it:
- A) Updates `d1` in place instead of returning a new dict
- B) Only adds keys that are missing
- C) Is a bitwise operation
- D) Returns a list of items

**6.** `d.get(key, 0)` when the key is missing:
- A) Returns `0`, no exception
- B) Raises `KeyError`
- C) Inserts `key: 0` and returns 0
- D) Returns `None`

**7.** `d.keys()` returns a view object, which means:
- A) It is iterable and reflects later changes to the dict, but is not indexable
- B) It is a list copy
- C) It is a frozen tuple
- D) It can be indexed with `[0]`

**8.** `d[key].append(value)` works only when:
- A) The existing value is a mutable sequence such as a list
- B) The key is a string
- C) The dict is a `Counter`
- D) It always works

**9.** `d.update(other)` behaves how?
- A) Existing keys are overwritten, new keys are added
- B) Only new keys are added
- C) It raises on duplicate keys
- D) It returns a new dict and leaves `d` alone

**10.** `d.copy()` gives you:
- A) A shallow copy — nested objects are still shared
- B) A deep copy
- C) A reference to the same dict
- D) A list of keys

**11.** `del d[key]` on a missing key:
- A) Raises `KeyError`
- B) Does nothing
- C) Returns `None`
- D) Inserts the key

**12.** Removing a key safely, returning a fallback when absent:
- A) `d.pop(key, None)`
- B) `del d[key]`
- C) `d.remove(key)`
- D) `d.clear()`

**13.** Grouping rows into lists by a key, without an import:
- A) `d.setdefault(k, []).append(row)`
- B) `d[k].append(row)`
- C) `d.update(k, row)`
- D) `d.get(k).append(row)`

**14.** Which cannot be used as a dictionary key?
- A) A list
- B) A tuple of strings
- C) An int
- D) A string

**15.** `x = my_list.sort()` — what is `x`?
- A) `None` — `sort()` sorts in place and returns nothing
- B) The sorted list
- C) A copy of the list
- D) An iterator

**16.** You need the sorted result as a new list, original untouched:
- A) `sorted(lst)`
- B) `lst.sort()`
- C) `lst.sorted()`
- D) `reversed(lst)`

**17.** `lst.pop(0)` in a loop over a big list is bad because:
- A) It is O(n) each call — shifts every element; use `collections.deque`
- B) It raises on empty lists
- C) It returns None
- D) It reverses the list

**18.** `lst.remove(x)` removes:
- A) The first occurrence by value, raising `ValueError` if absent
- B) The element at index `x`
- C) Every occurrence
- D) The last occurrence

**19.** `[[]] * 3` creates:
- A) Three references to the *same* list
- B) Three independent empty lists
- C) A list of three `None`
- D) A syntax error

**20.** Fastest membership test for repeated lookups over 100k values:
- A) Convert to a `set` once, then `in` — O(1) per check
- B) `in` on the list
- C) `list.index()` inside try/except
- D) Sort then scan

**21.** Strings are immutable, so building one in a loop with `+=`:
- A) Is O(n²) — collect into a list and `"".join(parts)`
- B) Is fine and O(n)
- C) Raises a TypeError
- D) Mutates in place

**22.** `" a  b ".split()` returns:
- A) `['a', 'b']` — splits on any whitespace run and drops empties
- B) `[' a ', ' b ']`
- C) `['', 'a', '', 'b', '']`
- D) `['a  b']`

**23.** `"a,b,,c".split(",")` returns:
- A) `['a', 'b', '', 'c']` — empty fields are preserved
- B) `['a', 'b', 'c']`
- C) `['a,b,,c']`
- D) An error

**24.** `"id_42".strip("id_")` returns:
- A) `"42"` by accident — `strip` removes those *characters*; use `removeprefix("id_")`
- B) `"id_42"` unchanged
- C) `"42"` because it removes the substring
- D) An error

**25.** `",".join(items)` fails when:
- A) `items` contains non-string elements — map them to `str` first
- B) `items` is a list
- C) `items` is empty
- D) The separator is a comma

**26.** `s.find("x")` versus `s.index("x")` when the substring is absent:
- A) `find` returns `-1`, `index` raises `ValueError`
- B) Both return `-1`
- C) Both raise
- D) `find` raises, `index` returns `-1`

**27.** `{}` creates:
- A) An empty dict — an empty set is `set()`
- B) An empty set
- C) An empty tuple
- D) `None`

**28.** `current_ids - previous_ids` on two sets gives:
- A) The ids present now and not before — the "new rows" answer
- B) The intersection
- C) The union
- D) A TypeError

**29.** Deduplicating a list **and keeping the original order**:
- A) `list(dict.fromkeys(items))`
- B) `list(set(items))`
- C) `sorted(set(items))`
- D) `items.unique()`

**30.** `sorted(rows, key=lambda r: (r["dept"], -r["salary"]))` sorts:
- A) By dept ascending, then salary descending
- B) By dept and salary both ascending
- C) By salary only
- D) Randomly — tuples are not valid keys

**31.** "Timsort is stable" matters because:
- A) Equal elements keep their previous order, so you can sort in successive passes
- B) It is faster
- C) It sorts in place
- D) It never raises

**32.** `any(r["amount"] < 0 for r in rows)`:
- A) Short-circuits at the first True and never builds a list
- B) Materialises the whole list first
- C) Returns the matching row
- D) Only works on lists

**33.** `min(rows, key=lambda r: r["ts"])` returns:
- A) The whole row with the smallest `ts`
- B) The smallest `ts` value
- C) A tuple `(ts, row)`
- D) An error — `min` takes no key

**34.** `round(2.5)` returns `2` because:
- A) Python uses banker's rounding (ties to even) — use `Decimal` for money
- B) It truncates
- C) It is a bug
- D) `2.5` is stored as `2.4999`

**35.** `def f(acc=[])` is a classic bug because:
- A) The default list is created once and shared across every call
- B) Lists cannot be defaults
- C) It shadows a builtin
- D) It is slower

**36.** `if x is None` rather than `if x == None`:
- A) `is` tests identity, which is the correct check for the `None` singleton
- B) They are identical, style only
- C) `==` raises on None
- D) `is` is faster on ints

**37.** `enumerate(items, start=1)` gives:
- A) `(1, first_item), (2, second_item), ...`
- B) `(0, first_item), ...`
- C) Only the indexes
- D) A list of tuples reversed

**38.** `zip(a, b)` when `a` has 5 items and `b` has 3:
- A) Stops at 3 — use `strict=True` (3.10+) to raise on a length mismatch
- B) Pads with None
- C) Raises
- D) Returns 5 pairs

**39.** `sum(list_of_lists, [])` to flatten is discouraged because:
- A) It is O(n²) — use `itertools.chain.from_iterable`
- B) It raises a TypeError
- C) It loses order
- D) It only works on ints

**40.** An `in` check against a **list** inside a loop over n rows costs:
- A) O(n²) — the single most common fix is converting the list to a set
- B) O(n)
- C) O(log n)
- D) O(1)

## Answer key

1 - A
2 - A
3 - A
4 - A
5 - A
6 - A
7 - A
8 - A
9 - A
10 - A
11 - A
12 - A
13 - A
14 - A
15 - A
16 - A
17 - A
18 - A
19 - A
20 - A
21 - A
22 - A
23 - A
24 - A
25 - A
26 - A
27 - A
28 - A
29 - A
30 - A
31 - A
32 - A
33 - A
34 - A
35 - A
36 - A
37 - A
38 - A
39 - A
40 - A

### One-line rationales

1. `len(d)` = number of items = number of keys.
2. `in` on a dict hashes the key — **O(1), keys only**. Values need `in d.values()`, O(n).
3. `.items()` yields `(key, value)` pairs; plain iteration yields keys.
4. **Merge operator**, right side wins on conflicts. Same as `{**d1, **d2}`.
5. `|=` is the **update in place** operator, equivalent to `d1.update(d2)`.
6. `.get()` is the never-raises read; the second argument is the fallback.
7. Views are **live and iterable, not indexable** — wrap in `list()` to index.
8. Appending requires the value to be a **mutable sequence**; missing keys raise, so use `defaultdict(list)`.
9. `.update()` overwrites existing keys and adds new ones, in place.
10. `.copy()` is **shallow** — `copy.deepcopy` for nested structures.
11. `del` on a missing key raises **KeyError**; `pop(key, default)` is the safe form.
12. `pop` with a default removes and returns without risk.
13. `setdefault(k, []).append(row)` is the import-free grouping idiom.
14. Keys must be **hashable** — lists (and dicts, sets) are not.
15. In-place methods return **None**. Assigning the result is the classic mistake.
16. `sorted()` returns a new list; `.sort()` mutates.
17. `pop(0)` shifts every element — **O(n)**. `deque.popleft()` is O(1).
18. `remove` works **by value**, first match only, and raises when absent.
19. `[[]] * 3` repeats the **same reference**. Use `[[] for _ in range(3)]`.
20. Set membership is **O(1)**; converting once pays for itself immediately.
21. Immutable strings mean `+=` copies every time — **join a list** instead.
22. Bare `.split()` splits on whitespace runs and **discards empty fields**.
23. `.split(",")` with an explicit separator **keeps empty fields** — exactly what CSV parsing needs.
24. `strip` takes a **character set**, not a substring. `removeprefix`/`removesuffix` (3.9+) are the correct tools.
25. `join` needs all elements to be strings: `",".join(map(str, items))`.
26. `find` → `-1`; `index` → **ValueError**.
27. `{}` is an empty **dict**; `set()` builds an empty set.
28. Set **difference** = "what is new". The DE idiom for change detection.
29. `dict.fromkeys` preserves insertion order; `set()` does not.
30. Tuple keys sort left to right; negating a number flips that field to **descending**.
31. **Stability** lets you sort by the secondary key first and then the primary.
32. `any`/`all` **short-circuit** and consume generators lazily.
33. `min`/`max` with `key` return the **whole element**, not the key value.
34. **Banker's rounding** — ties go to even. Money belongs in `Decimal`.
35. Default arguments are evaluated **once at definition**; use `None` as the sentinel.
36. `None` is a singleton — compare with **`is`**.
37. `start=1` shifts the counter; the values are unchanged.
38. `zip` stops at the **shortest** input; `strict=True` turns silent truncation into an error.
39. Repeated list concatenation is quadratic; `chain.from_iterable` is linear and lazy.
40. Linear membership inside a linear loop is **O(n²)** — the classic timeout in coding tests.
