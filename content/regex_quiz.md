# Regex & String Manipulation Quiz

`re`, `os`, `csv` — the Coursera chapter plus the traps interviews use.

---

## Questions

**1.** Patterns should be raw strings (`r"\d+"`) because:
- A) They run faster
- B) Python would otherwise interpret escapes like `\b` before regex sees them
- C) Raw strings allow Unicode
- D) It is only a style convention

**2.** `re.search` differs from `re.match` in that:
- A) `search` looks anywhere, `match` only at the start of the string
- B) `search` returns a list
- C) `match` is case-insensitive
- D) `search` requires a compiled pattern

**3.** To require that the **whole** string matches, the clearest call is:
- A) `re.match`
- B) `re.fullmatch`
- C) `re.findall`
- D) `re.search` with `re.MULTILINE`

**4.** `re.search` returns, on failure:
- A) `False`
- B) An empty string
- C) `None`
- D) An empty match object

**5.** `.` in a regex matches:
- A) Any single character except newline
- B) Any number of characters
- C) A literal dot
- D) A word character

**6.** `check_aei = r"a.e.i"` says:
- A) a, e and i in any order
- B) a, then exactly one character, then e, then exactly one character, then i
- C) a, e, i separated by any number of characters
- D) The letters a, e, i anywhere

**7.** `"aerial"` fails `r"a.e.i"` because:
- A) It has no `i`
- B) `e` follows `a` with no character in between
- C) The string is too short
- D) The pattern is anchored

**8.** `[aA]` means:
- A) The literal two-character sequence "aA"
- B) Either `a` or `A` — one character
- C) `a` repeated
- D) Any letter

**9.** `r"[aA].*[aA]"` matches "banana" because:
- A) `.*` allows any characters, including none, between two a's
- B) `[aA]` matches all a's at once
- C) It is case-insensitive by default
- D) `banana` starts with b

**10.** `\w` is equivalent to:
- A) `[a-zA-Z]`
- B) `[a-zA-Z0-9_]`
- C) Any non-whitespace
- D) Any printable character

**11.** `\s+` matches:
- A) Exactly one space
- B) One or more whitespace characters, including tabs and newlines
- C) Zero or more spaces
- D) Only the space character

**12.** In `r"\w+\s+\w+"`, `"One"` returns no match because:
- A) `\w` excludes uppercase
- B) There is no whitespace-separated second group
- C) `+` needs at least two characters
- D) The string is not anchored

**13.** `^` inside a character class, as in `[^abc]`:
- A) Anchors to the start
- B) Negates the class — anything except a, b or c
- C) Is a literal caret
- D) Is invalid syntax

**14.** In `r"^[A-Z][a-z\s]+[.!?]$"`, the `$`:
- A) Escapes the terminator
- B) Anchors the match to the end of the string
- C) Means "one or more"
- D) Matches a literal dollar sign

**15.** That same sentence pattern rejects `"Is this a Sentence?"` because:
- A) The question mark is not in the class
- B) `[a-z\s]` excludes the second capital letter
- C) It is too long
- D) `^` fails on "Is"

**16.** Inside `[]`, the characters `.` `+` `*`:
- A) Keep their special meaning
- B) Are literal, no escaping needed
- C) Are invalid
- D) Must always be escaped with a backslash

**17.** `+` versus `*`:
- A) `+` is one or more, `*` is zero or more
- B) `+` is zero or more, `*` is one or more
- C) They are identical
- D) `+` matches literal plus signs

**18.** `?` after a token means:
- A) That token is optional (zero or one)
- B) Any character
- C) End of the pattern
- D) Case-insensitive

**19.** `r"\d{2,4}"` matches:
- A) Exactly 2 digits
- B) Between 2 and 4 digits
- C) At least 4 digits
- D) 2 or 4 digits only

**20.** `re.findall(r"<.+>", "<b>x</b>")` returns one long match because `+` is:
- A) Lazy
- B) Greedy — it takes as much as possible, then backtracks
- C) Anchored
- D) Non-capturing

**21.** The lazy version of that quantifier is:
- A) `+?`
- B) `?+`
- C) `+*`
- D) `{,}`

**22.** The fastest correct way to extract `<...>` tags:
- A) `<.*>`
- B) `<[^>]+>` — a negated class cannot overrun
- C) `<.+?>` with `re.DOTALL`
- D) `.+`

**23.** `re.findall(r"(\d{4})-(\d{2})", "2026-07")` returns:
- A) `['2026-07']`
- B) `[('2026', '07')]`
- C) `['2026', '07']`
- D) `[('2026-07',)]`

**24.** `re.findall` with **one** capture group returns:
- A) The whole matches
- B) Only that group's text per match
- C) Tuples of one element
- D) Match objects

**25.** To group without capturing, use:
- A) `(?:...)`
- B) `(?=...)`
- C) `[...]`
- D) `{...}`

**26.** Named groups are written and read as:
- A) `(?P<name>...)` then `m.group("name")` / `m.groupdict()`
- B) `(<name>...)` then `m.name`
- C) `(?name:...)` then `m["name"]`
- D) `\k<name>`

**27.** `m.group(0)` is:
- A) The first capture group
- B) The entire match
- C) Always `None`
- D) The pattern

**28.** In `re.sub(r"(\w+), (\w+)", r"\2 \1", "Lisboa, Felipe")` the result is:
- A) `"Felipe Lisboa"`
- B) `"Lisboa Felipe"`
- C) `"\2 \1"`
- D) An error

**29.** The replacement argument of `re.sub` can also be:
- A) A function receiving the match object
- B) A compiled pattern
- C) A list
- D) Only a string

**30.** To replace only the first occurrence:
- A) `re.sub(p, r, s, count=1)`
- B) `re.sub1(p, r, s)`
- C) `re.match` then `sub`
- D) Not possible with `re.sub`

**31.** Collapsing all runs of whitespace into one space:
- A) `s.replace("  ", " ")`
- B) `re.sub(r"\s+", " ", s)`
- C) `s.strip()`
- D) `re.split(r"\s", s)`

**32.** `re.IGNORECASE` / `re.I`:
- A) Ignores whitespace in the pattern
- B) Makes the match case-insensitive
- C) Makes `.` match newline
- D) Makes `^`/`$` match per line

**33.** `re.MULTILINE` changes:
- A) `.` to match newlines
- B) `^` and `$` to match at each line boundary
- C) The return type of findall
- D) Nothing without `re.DOTALL`

**34.** `re.DOTALL` makes:
- A) `.` also match newline
- B) All quantifiers lazy
- C) Groups non-capturing
- D) The pattern verbose

**35.** `re.VERBOSE` is useful because:
- A) It prints debugging output
- B) It lets a long pattern carry whitespace and `#` comments so it is reviewable
- C) It validates the pattern
- D) It compiles faster

**36.** `re.compile` is worth it mainly when:
- A) The pattern is reused in a loop, and to name it once at module level
- B) The pattern has groups
- C) You need case-insensitivity
- D) Never — `re` caches everything

**37.** `\b` in `r"\bcat\b"`:
- A) Matches a backspace
- B) Is a word boundary, so "concatenate" does not match
- C) Matches the letter b
- D) Anchors to the string start

**38.** In PySpark, extracting a substring from a column is best done with:
- A) A Python UDF using `re`
- B) `regexp_extract` / `regexp_replace` / `rlike` — JVM native, no serialisation cost
- C) `collect()` then `re`
- D) `pandas_udf` always

**39.** Prefer `s.startswith("ERROR")` over a regex when:
- A) The pattern is a fixed literal — faster and clearer
- B) Never, regex is always better
- C) The string is long
- D) You need groups

**40.** `re.fullmatch(r"\d{4}-\d{2}-\d{2}", "9999-99-99")`:
- A) Fails, because it is not a real date
- B) Matches — regex checks shape, not validity; parse with `strptime` after
- C) Raises ValueError
- D) Returns None

**41.** Parsing CSV with `line.split(",")` breaks when:
- A) The file is large
- B) A quoted field contains a comma
- C) There is a header
- D) Fields are numeric

**42.** `csv.DictReader` differs from `csv.reader` in that it:
- A) Skips the header and keys each row by column name
- B) Is faster
- C) Casts numeric columns
- D) Requires `newline=""`

**43.** With `csv.reader`, skipping the header line is:
- A) `next(reader)`
- B) `reader.skip()`
- C) `reader[1:]`
- D) `reader.header = True`

**44.** Values read by the `csv` module come back as:
- A) Their inferred Python types
- B) Strings — you cast them yourself
- C) Bytes
- D) `Decimal`

**45.** `os.path.getsize(path)` returns:
- A) The size in bytes on disk
- B) The number of characters
- C) The number of lines
- D) A `stat` object

**46.** `os.path.getmtime(path)` returns:
- A) A datetime
- B) An epoch timestamp — convert with `datetime.fromtimestamp`
- C) A formatted date string
- D) The creation time on all platforms

**47.** `os.mkdir(d)` when `d` already exists:
- A) Silently succeeds
- B) Raises `FileExistsError` — guard with `os.path.isdir` or use `makedirs(..., exist_ok=True)`
- C) Overwrites it
- D) Returns False

**48.** `os.path.join("a", "b")` is preferred over `"a" + "/" + "b"` because:
- A) It is faster
- B) It uses the correct separator per platform and handles edge cases
- C) It creates the path
- D) It returns absolute paths

**49.** `os.path.abspath(os.path.join(os.getcwd(), ".."))` gives:
- A) The current directory
- B) The absolute path of the parent directory
- C) The home directory
- D) The root

**50.** `os.chdir()` in a pipeline is risky because:
- A) It is slow
- B) It mutates process-wide state that other code depends on — prefer absolute paths
- C) It requires admin rights
- D) It fails on Windows

**51.** The `pathlib` equivalent of `os.path.join(a, b)` is:
- A) `Path(a) / b`
- B) `Path.join(a, b)`
- C) `Path(a).add(b)`
- D) `Path(a) + b`

**52.** `with open(filename, "w"): pass` is used to:
- A) Read the file
- B) Create an empty file (and truncate it if it existed)
- C) Append to the file
- D) Lock the file

**53.** Iterating `for line in open(path)` instead of `.readlines()`:
- A) Streams line by line instead of loading the whole file into memory
- B) Is required for CSV
- C) Skips blank lines
- D) Is slower

**54.** Masking PII in log lines is idiomatically:
- A) `str.replace` per known value
- B) `re.sub` with a compiled pattern and a fixed token or lambda
- C) Dropping the lines
- D) `re.findall` then string slicing

**55.** Good rule for regex versus a parser:
- A) Regex for anything text
- B) Regex to cheaply reject bad shapes; a real parser (csv, json, strptime, EDI lib) to interpret
- C) Parsers only for JSON
- D) Never use regex in production

## Answer key

1 - B
2 - A
3 - B
4 - C
5 - A
6 - B
7 - B
8 - B
9 - A
10 - B
11 - B
12 - B
13 - B
14 - B
15 - B
16 - B
17 - A
18 - A
19 - B
20 - B
21 - A
22 - B
23 - B
24 - B
25 - A
26 - A
27 - B
28 - A
29 - A
30 - A
31 - B
32 - B
33 - B
34 - A
35 - B
36 - A
37 - B
38 - B
39 - A
40 - B
41 - B
42 - A
43 - A
44 - B
45 - A
46 - B
47 - B
48 - B
49 - B
50 - B
51 - A
52 - B
53 - A
54 - B
55 - B

### One-line rationales

1. Python resolves `\b`, `\n` etc. first — **raw strings** hand the backslashes to `re` intact.
2. `search` scans the whole string; `match` is anchored at position 0.
3. `re.fullmatch` states "the entire string" without `^…$` noise.
4. Failure is **`None`**, which is why the course writes `is not None`.
5. `.` = exactly one character, newline excluded unless `re.DOTALL`.
6. `a.e.i` = a, one char, e, one char, i.
7. In "aerial" nothing separates `a` and `e`, so the first `.` has nothing to match.
8. `[aA]` is a class: **one** character, either case.
9. `.*` spans anything (or nothing) between the two a's — "banana" has three.
10. `\w` = `[a-zA-Z0-9_]`, underscore included.
11. `\s` covers space, tab, newline; `+` means one or more.
12. "One" has no whitespace and no second word group.
13. Leading `^` **inside a class** negates it.
14. `$` anchors the end; with `^` it forces a whole-string match.
15. `[a-z\s]` allows only lowercase and whitespace — a second capital breaks it.
16. Metacharacters are literal inside `[]`; `[.+*]` needs no escapes.
17. `+` = one or more, `*` = zero or more.
18. `?` makes the previous token optional.
19. `{2,4}` = between two and four repetitions.
20. `+` is **greedy** — it grabs to the last `>`, then backtracks.
21. `+?` is the lazy form; `*?` and `??` likewise.
22. `[^>]+` cannot cross a `>` at all — correct and faster than backtracking.
23. Two groups → **a tuple per match**.
24. One group → just that group's text, not the whole match.
25. `(?:...)` groups without capturing.
26. `(?P<name>...)` plus `groupdict()` is the readable form for 3+ fields.
27. `group(0)` is the **entire match**; groups start at 1.
28. `\2 \1` swaps the captures — the replacement string is raw too.
29. `repl` may be a **function** taking the match, which is how masking keeps the last 4 digits.
30. `count=1` limits the substitutions.
31. `re.sub(r"\s+", " ", s)` collapses any run of whitespace; `replace` only handles fixed runs.
32. `re.I` = case-insensitive.
33. `re.M` makes `^`/`$` match at every line boundary.
34. `re.S` lets `.` cross newlines.
35. `re.X` allows whitespace and comments — how long patterns stay reviewable.
36. Compile to **name the pattern once** and to avoid recompiling in hot loops.
37. `\b` is a word boundary — that is why raw strings matter (`"\b"` is a backspace).
38. Use Spark's **native regex functions**; a Python UDF pays serialisation per row.
39. Fixed literal → `startswith` / `in` is faster and reads better.
40. Regex validates **shape only** — `strptime` decides whether it is a real date.
41. Quoted fields containing commas defeat `split(",")` — the classic hand-rolled CSV bug.
42. `DictReader` consumes the header and keys rows by name, so column order can change safely.
43. `next(reader)` discards the header row.
44. The `csv` module returns **strings**; casting is yours.
45. `getsize` = bytes on disk, which differs from character count for non-ASCII.
46. `getmtime` = epoch float → `datetime.datetime.fromtimestamp(ts)`.
47. `os.mkdir` raises **`FileExistsError`**; guard or use `makedirs(exist_ok=True)`.
48. `os.path.join` is the portable, edge-case-safe way to build paths.
49. `getcwd()` + `".."` + `abspath` resolves to the **parent** directory.
50. `chdir` mutates global process state — absolute paths are safer in pipelines.
51. `pathlib` overloads `/`: `Path("data") / "raw.csv"`.
52. Opening in `"w"` and doing nothing creates (or truncates to) an empty file.
53. Iterating the handle **streams**; `readlines()` materialises the whole file.
54. Compiled `re.sub` with a token or lambda is the standard PII/PHI masking move.
55. Regex to reject cheaply, a real parser to interpret — never regex-parse structured formats.
