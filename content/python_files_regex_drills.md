# Python — Files, CSV & Regex Drills

From the Google/Coursera automation chapter, plus the versions an interview asks. Write the
function before revealing.

## Create a Python script and return its size

<!-- difficulty: 2 -->
Write `create_python_script(filename)` that writes the comment
`# Start of a new Python program` to `filename` and returns the file size in bytes.

### Solution

```python
import os

def create_python_script(filename):
    comments = "# Start of a new Python program"
    with open(filename, "w") as file:
        file.write(comments)
    return os.path.getsize(filename)

print(create_python_script("program.py"))   # 31
```

`os.path.getsize()` returns real bytes on disk — not `len(comments)` characters. They match here
because the text is ASCII; with accents or emoji, UTF-8 makes the byte count larger.

## Create a directory and an empty file inside it

<!-- difficulty: 2 -->
Write `new_directory(directory, filename)` that creates `directory` if it does not exist,
creates an empty `filename` inside it, and returns the directory listing.

### Solution

```python
import os

def new_directory(directory, filename):
    if not os.path.isdir(directory):
        os.mkdir(directory)
    os.chdir(directory)
    with open(filename, "w"):
        pass
    return os.listdir()
```

`os.mkdir` fails if the directory exists — hence the `isdir` guard, or use
`os.makedirs(directory, exist_ok=True)`. `with open(...) : pass` creates an empty file.

`os.chdir` mutates process-wide state; in real code prefer
`open(os.path.join(directory, filename), "w")` and never change directory.

## File modification date as YYYY-MM-DD

<!-- difficulty: 2 -->
Write `file_date(filename)` that creates the file, then returns its modification date
formatted `YYYY-MM-DD`.

### Solution

```python
import os
import datetime

def file_date(filename):
    with open(filename, "w"):
        pass
    timestamp = os.path.getmtime(filename)
    return datetime.datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
```

`getmtime` gives epoch seconds (a float); `fromtimestamp` converts to local time, `strftime`
formats. `getctime` = metadata change on Unix, creation on Windows — `getmtime` is the portable
"last modified".

## Absolute path of the parent directory

<!-- difficulty: 1 -->
Write `parent_directory()` returning the absolute path of the directory above the current one.

### Solution

```python
import os

def parent_directory():
    relative_parent = os.path.join(os.getcwd(), "..")
    return os.path.abspath(relative_parent)
```

`..` is the relative "one level up"; `abspath` normalises it away. Modern equivalent:
`Path.cwd().parent` or `os.path.dirname(os.getcwd())`.

## Read a CSV with DictReader

<!-- difficulty: 2 -->
Given a CSV with headers `name,color,type`, return a string with one line per row:
`a {color} {name} is {type}`.

### Solution

```python
import csv

def contents_of_file(filename):
    return_string = ""
    with open(filename, "r", newline="") as file:
        for row in csv.DictReader(file):
            return_string += "a {} {} is {}\n".format(row["color"], row["name"], row["type"])
    return return_string
```

`DictReader` consumes the header line and keys every row by column name — order-independent, so
a reordered source file does not silently swap your fields.

## Read the same CSV without DictReader

<!-- difficulty: 2 -->
Same output, using `csv.reader`. Skip the header.

### Solution

```python
import csv

def contents_of_file(filename):
    return_string = ""
    with open(filename, "r", newline="") as f:
        reader = csv.reader(f)
        next(reader)                       # skip header
        for name, color, kind in reader:   # tuple unpacking per row
            return_string += "a {} {} is {}\n".format(color, name, kind)
    return return_string
```

`next(reader)` discards the header. Unpacking directly in the `for` fails loudly on a malformed
row — usually what you want. Avoid shadowing the builtin `type`, hence `kind`.

Never replace this with `line.split(",")`: a quoted field containing a comma breaks it.

## Regex — a, e, i separated by one character each

<!-- difficulty: 2 -->
`check_aei(text)` → True when the text contains `a`, then any single character, then `e`, then
any single character, then `i`. `"academia"` True, `"aerial"` False.

### Solution

```python
import re

def check_aei(text):
    return re.search(r"a.e.i", text) is not None
```

`.` is **exactly one** character, any character except newline. `"aerial"` fails because `e`
follows `a` immediately — no character between them.

## Regex — at least two a/A

<!-- difficulty: 2 -->
`repeating_letter_a(text)` → True when the text contains `a` or `A` at least twice.
`"banana"` True, `"pineapple"` False.

### Solution

```python
import re

def repeating_letter_a(text):
    return re.search(r"[aA].*[aA]", text) is not None
```

`[aA]` is a character class matching either letter; `.*` allows anything (including nothing)
between them. Case-insensitive alternative: `re.search(r"a.*a", text, re.IGNORECASE)`.

## Regex — two alphanumeric groups separated by whitespace

<!-- difficulty: 2 -->
`check_character_groups(text)` → True when the text has two groups of word characters separated
by one or more spaces. `"One"` False, `"123  Ready Set GO"` True.

### Solution

```python
import re

def check_character_groups(text):
    return re.search(r"\w+\s+\w+", text) is not None
```

`\w` = `[a-zA-Z0-9_]`, `\s` = any whitespace including tab and newline. `+` = one or more, so
`\s+` absorbs the double space.

## Regex — well-formed sentence

<!-- difficulty: 3 -->
`check_sentence(text)` → True when the text starts with a capital, contains only lowercase
letters and spaces after it, and ends with `.`, `?` or `!`.

### Solution

```python
import re

def check_sentence(text):
    return re.search(r"^[A-Z][a-z\s]+[.!?]$", text) is not None
```

- `^` start of string, `$` end of string — together they force the **whole** string to match.
- `[A-Z]` one capital, `[a-z\s]+` one or more lowercase-or-whitespace, `[.!?]` one terminator.
- Inside `[]` the `.` is literal, so no escaping needed.
- `re.fullmatch(r"[A-Z][a-z\s]+[.!?]", text)` says the same thing without the anchors.

## Regex — extract and rename with groups

<!-- difficulty: 3 -->
Given `"Lisboa, Felipe"` return `"Felipe Lisboa"`. Then, given a log line
`"2026-07-30 ERROR disk full"`, return a dict with keys `date`, `level`, `message`.

### Solution

```python
import re

def flip_name(name):
    return re.sub(r"^(\w+), (\w+)$", r"\2 \1", name)

LOG = re.compile(r"^(?P<date>\d{4}-\d{2}-\d{2}) (?P<level>\w+) (?P<message>.*)$")

def parse_log(line):
    m = LOG.match(line)
    return m.groupdict() if m else None
```

`\2 \1` backreferences the capture groups in the replacement — the replacement string is raw
too. Named groups plus `groupdict()` beat positional indexes as soon as there are three of them.

## Regex — mask card-like numbers in a log

<!-- difficulty: 3 -->
Replace any 16-digit sequence (optionally grouped by spaces or dashes) with `****`, keeping the
rest of the line intact. This is the PII/PHI masking pattern.

### Solution

```python
import re

CARD = re.compile(r"\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b")

def mask(line):
    return CARD.sub("****", line)

mask("paid with 4111 1111 1111 1111 ok")   # 'paid with **** ok'
```

`\b` word boundaries stop it eating part of a longer number. Keeping the last four instead:
`CARD.sub(lambda m: "****" + m.group()[-4:], line)` — `sub` accepts a function.

## Regex — count log levels across a file

<!-- difficulty: 3 -->
Read a log file and return a count per level (`ERROR`, `WARN`, `INFO`) using one compiled
pattern. Stream it — do not read the whole file into memory.

### Solution

```python
import re
from collections import Counter

LEVEL = re.compile(r"\b(ERROR|WARN|INFO)\b")

def level_counts(path):
    counts = Counter()
    with open(path) as fh:
        for line in fh:                     # streams line by line
            m = LEVEL.search(line)
            if m:
                counts[m.group(1)] += 1
    return counts
```

Compile once outside the loop; iterate the file handle instead of `.readlines()`. `Counter`
gives `.most_common()` for free.

## Greedy vs lazy — extract the tags

<!-- difficulty: 3 -->
From `"<b>bold</b> and <i>italic</i>"` return `['<b>', '</b>', '<i>', '</i>']`. Explain why the
obvious pattern fails.

### Solution

```python
import re

s = "<b>bold</b> and <i>italic</i>"
re.findall(r"<.+>", s)      # ['<b>bold</b> and <i>italic</i>']  — greedy, one match
re.findall(r"<.+?>", s)     # correct — lazy
re.findall(r"<[^>]+>", s)   # correct and faster — negated class, no backtracking
```

`+` is greedy: it takes everything to the last `>` then backtracks. `+?` is lazy. The negated
character class `[^>]+` is the answer that scales — it cannot overrun in the first place.

(And for real HTML: use a parser, not regex.)

## findall returns tuples once you have groups

<!-- difficulty: 3 -->
What do these three return for `"2026-07-30"`?

```python
re.findall(r"\d{4}-\d{2}-\d{2}", s)
re.findall(r"(\d{4})-\d{2}-\d{2}", s)
re.findall(r"(\d{4})-(\d{2})-(\d{2})", s)
```

### Solution

```python
['2026-07-30']          # no groups -> whole match
['2026']                # one group  -> that group only
[('2026', '07', '30')]  # 2+ groups  -> tuple per match
```

This silent shape change is a top source of "why is my list full of tuples". Use `(?:...)` for
grouping you do not want captured, or `finditer` to always get match objects.

## Validate then parse

<!-- difficulty: 2 -->
Why is `re.fullmatch(r"\d{4}-\d{2}-\d{2}", s)` not enough to accept a date column? Show the
right sequence.

### Solution

```python
from datetime import datetime
import re

ISO = re.compile(r"\d{4}-\d{2}-\d{2}")

def parse_date(s):
    if not ISO.fullmatch(s):
        return None                      # cheap shape rejection
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return None                      # 9999-99-99 matched the shape, is not a date
```

Regex checks **shape**, not validity. `2026-02-30` and `9999-99-99` both pass the pattern. Same
rule for CSV, JSON, HTML and EDI: regex to filter, a real parser to interpret.
