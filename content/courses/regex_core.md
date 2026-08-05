# Regex & String Manipulation — Core

The Coursera/Google chapter, plus what interviews and real pipelines actually use.

## Why raw strings, always

```python
re.search(r"\d+", text)     # right
re.search("\d+", text)      # works today, DeprecationWarning, breaks on \b \\ etc.
```

Python strings eat backslashes before regex sees them. `"\b"` is a backspace character;
`r"\b"` is the word-boundary token. Rule: **every pattern is a raw string**, no exceptions.

Same trap in reverse for replacements: `re.sub(r"\s+", " ", s)` uses `\1`, `\g<name>` in the
replacement string, so that one is raw too.

## The `re` API — what each function returns

| Call | Returns | Use for |
|---|---|---|
| `re.search(p, s)` | first match object **anywhere**, or `None` | "does it contain …?" |
| `re.match(p, s)` | match only at the **start**, or `None` | rarely what you want |
| `re.fullmatch(p, s)` | match only if the **whole** string fits | validation |
| `re.findall(p, s)` | list of strings (or tuples if >1 group) | extract all |
| `re.finditer(p, s)` | iterator of match objects | extract all + positions |
| `re.sub(p, repl, s)` | new string | clean / normalise |
| `re.subn(p, repl, s)` | `(new_string, count)` | when you need the count |
| `re.split(p, s)` | list | split on a pattern, not a literal |
| `re.compile(p)` | pattern object | reuse in a loop |

Truthiness trap: a match object is truthy, but `re.search` returns `None` on failure — so
`if re.search(...)` is fine, and `return re.search(...) is not None` is the explicit form the
course uses. A **zero-length match is still truthy**, so never test `if re.match(...) == ''`.

```python
m = re.search(r"(\w+)@(\w+)\.com", "mail bob@corp.com now")
m.group(0)   # 'bob@corp.com'  — whole match
m.group(1)   # 'bob'           — first group
m.groups()   # ('bob', 'corp')
m.span()     # (5, 17)
```

## Character classes and quantifiers

| Token | Means |
|---|---|
| `.` | any single character **except newline** (unless `re.DOTALL`) |
| `\d` `\D` | digit / not digit |
| `\w` `\W` | word char `[a-zA-Z0-9_]` / not |
| `\s` `\S` | whitespace / not |
| `[aA]` | literally `a` or `A` |
| `[a-z0-9_]` | ranges inside a class |
| `[^abc]` | **not** a, b or c — `^` only negates inside `[]` |
| `\b` | word boundary — `r"\bcat\b"` misses "concatenate" |

| Quantifier | Means |
|---|---|
| `*` | 0 or more |
| `+` | 1 or more |
| `?` | 0 or 1 (optional) |
| `{3}` `{2,4}` `{2,}` | exact / range / at least |
| `*?` `+?` `??` | **lazy** — shortest match instead of longest |

Inside `[]` most metacharacters lose their power: `[.+*]` matches a literal dot, plus or star.
`-` must be first, last or escaped.

## Anchors — the difference between "contains" and "is"

- `^` start of string (or of each line with `re.MULTILINE`)
- `$` end of string (allows one trailing `\n`)
- `re.fullmatch(p, s)` ≡ `re.search(r"^p$", s)` and is clearer

The course sentence checker:

```python
re.search(r"^[A-Z][a-z\s]+[.!?]$", text)
```

Reads as: capital first letter, then one-or-more lowercase-or-space, then one terminator, and
nothing else. `"Is this a sentence?"` passes; `"is this a sentence?"` fails on the capital.
What surprises people: it also rejects anything containing a digit, comma or second capital —
`[a-z\s]` is a deliberately narrow class.

## Greedy vs lazy — the classic bug

```python
s = "<b>bold</b> and <i>italic</i>"
re.findall(r"<.+>", s)    # ['<b>bold</b> and <i>italic</i>']  greedy: one huge match
re.findall(r"<.+?>", s)   # ['<b>', '</b>', '<i>', '</i>']      lazy: what you meant
re.findall(r"<[^>]+>", s) # same result, faster — negated class beats lazy
```

`*` and `+` grab as much as possible then backtrack. When a pattern is slow or matches too
much, the answer is almost always a **negated character class**, not more `.*`.

## Groups: capture, non-capture, named

```python
re.findall(r"(\d{4})-(\d{2})-(\d{2})", "2026-07-30")   # [('2026','07','30')] — tuples!
re.findall(r"(?:\d{4})-(\d{2})", "2026-07")            # ['07'] — (?: ) groups without capturing
m = re.search(r"(?P<year>\d{4})-(?P<month>\d{2})", "2026-07")
m.group("year")        # '2026'
m.groupdict()          # {'year': '2026', 'month': '07'}
```

Gotcha to remember: **`findall` returns tuples as soon as the pattern has more than one group**,
and returns only the group (not the whole match) when there is exactly one. Use `finditer` when
you want the match object every time.

Alternation: `r"cat|dog"` — wrap it when it sits inside a bigger pattern: `r"^(cat|dog)s?$"`.

## `re.sub` — replacement and backreferences

```python
re.sub(r"\s+", " ", messy).strip()                       # collapse whitespace
re.sub(r"(\w+), (\w+)", r"\2 \1", "Lisboa, Felipe")      # 'Felipe Lisboa'
re.sub(r"(?P<n>\d+)", r"<\g<n>>", "a1 b22")              # 'a<1> b<22>'
re.sub(r"\d", "#", "card 4111", count=1)                 # replace only the first
re.sub(r"\d+", lambda m: str(int(m.group()) * 2), "a3")  # 'a6' — repl can be a function
```

Masking PHI/PII in logs is `re.sub` with a function or a fixed token — the one regex use that
shows up in every data platform review.

## Flags

```python
re.search(r"error", line, re.IGNORECASE)     # re.I
re.findall(r"^\d+", text, re.MULTILINE)      # re.M — ^ and $ per line
re.search(r"a.b", text, re.DOTALL)           # re.S — . also matches \n
re.compile(r"""
    (\d{3})   # area
    -(\d{4})  # number
""", re.VERBOSE)                              # re.X — whitespace and comments ignored
```

`re.VERBOSE` is how a long production pattern stays readable and reviewable.

## `re.compile` — when it matters

```python
LOG = re.compile(r"^(?P<ts>\S+) (?P<level>\w+) (?P<msg>.*)$")
for line in file:                      # pattern compiled once, not per line
    m = LOG.match(line)
    if m:
        yield m.groupdict()
```

`re` caches recent patterns, so compiling rarely changes correctness — but it does document the
pattern once at module level and it wins in tight loops (log parsing, millions of rows).

**In Spark, do not use Python `re` in a UDF** when a built-in exists: `regexp_extract`,
`regexp_replace`, `rlike`, `split` run in the JVM with no serialisation cost.

## Str methods first — regex is the fallback

| Need | Reach for |
|---|---|
| starts / ends with a literal | `s.startswith()` / `s.endswith()` |
| contains a literal | `"x" in s` |
| split on a literal | `s.split(",")` |
| strip whitespace | `s.strip()` |
| replace a literal | `s.replace(a, b)` |
| case-insensitive equality | `a.casefold() == b.casefold()` |
| variable pattern, groups, alternation | **regex** |

Interview line worth having: *"I use string methods when the pattern is a literal — they are
faster and readable. Regex when the shape varies or I need to capture parts."*

## Patterns worth memorising

```python
r"^\d{3}-\d{2}-\d{4}$"                     # US SSN shape (validate, then mask)
r"[\w.+-]+@[\w-]+\.[\w.]+"                 # good-enough email
r"^\d{4}-\d{2}-\d{2}$"                     # ISO date shape
r"\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b" # card-like number, for masking
r"^[A-Za-z0-9_]+$"                         # safe identifier / column name
r"(?i)\berror\b|\bexception\b"             # log triage, inline flag
r"^(?P<ip>\S+) \S+ \S+ \[(?P<ts>[^\]]+)\] \"(?P<req>[^\"]*)\" (?P<code>\d{3})"  # access log
```

`[^\]]+` and `[^\"]*` — bracketed and quoted fields are extracted with negated classes, never
with `.*`.

## Validation ≠ parsing

Regex proves a string has a **shape**. It does not prove the value is valid: `9999-99-99`
matches the ISO date pattern. Sequence: regex to reject garbage cheaply, then a real parser
(`datetime.strptime`, `csv`, an EDI/JSON library) to interpret it. Never regex-parse HTML,
JSON or CSV that can contain quoted delimiters — use the library.

## `os` and `os.path` — the file half of the chapter

```python
os.path.getsize(path)      # bytes
os.path.getmtime(path)     # epoch seconds -> datetime.datetime.fromtimestamp(ts)
os.path.exists(path)       # file or dir
os.path.isfile / isdir(path)
os.path.join(a, b)         # portable separator — never "a" + "/" + "b"
os.path.abspath(p)         # resolve ".." and relative parts
os.path.basename / dirname / splitext(p)
os.getcwd() / os.chdir(d)
os.mkdir(d) / os.makedirs(d, exist_ok=True)
os.listdir(d) / os.scandir(d)   # scandir carries stat info, cheaper in big dirs
os.remove(f) / os.rename(a, b)
os.walk(root)              # recursive (dirpath, dirnames, filenames)
```

Modern equivalent, worth mentioning as the current idiom:

```python
from pathlib import Path
p = Path("data") / "raw.csv"
p.stat().st_size, p.exists(), p.suffix, p.parent, p.resolve()
Path("out").mkdir(parents=True, exist_ok=True)
list(Path("logs").glob("*.log"))
```

`os.chdir` changes global process state — fine in a course exercise, a bug magnet in a pipeline.
Prefer absolute paths over changing directory.

## `csv` — reader vs DictReader

```python
with open(f, newline="") as fh:          # newline="" is the documented, correct way
    for row in csv.reader(fh):           # row = list of strings
        ...

with open(f, newline="") as fh:
    for row in csv.DictReader(fh):       # row = dict keyed by header
        row["color"]

with open(out, "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=["name", "color"])
    w.writeheader()
    w.writerows(rows)
```

- `next(reader)` skips the header when using plain `reader`; `DictReader` consumes it for you.
- Everything comes back as **`str`** — cast numbers yourself.
- Never `line.split(",")` on real CSV: quoted fields containing commas break it. That is the
  single most common data bug from hand-rolled parsing.
