# prep-web

Mobile study PWA over the exercise files in `../interviews` and `../airflow`.
Static site, no backend, no dependencies. Deploys to Cloudflare Pages.

- **849 cards / 48 decks** — most generated from the source files, the rest authored in `content/`.
- **Tracks**: curated paths (Nix round 3 health-insurance, Nix deep dive, Caylent AWS, Python coding tests, regex & files, Python API, algorithms, SQL, Airflow, theory, interview-day).
- **Spaced repetition** (SM-2 variant), progress in `localStorage` on the device.
- **Offline**: service worker caches the shell + content; installable to the home screen.
- Card types: `code` (recall → reveal solution), `mcq` (quiz with rationale), `concept` (Q → explanation), `read` (full reference).

## Use

```bash
npm run dev        # build content + serve http://localhost:4173
npm run build      # regenerate public/content.json only
npm run deploy     # build + wrangler pages deploy
```

Study loop: **Study now** takes everything due plus a few new cards. A **track** narrows the
pool to one subject; **Deep session — hardest first** orders by difficulty descending and
pulls 1.5× reviews / 2× new cards, for the round before a hard interview.
Reveal with the button / space / tap; grade Again–Easy (or swipe left = Again, right = Good).
MCQ cards auto-grade. **Read mode** on any deck is plain reading, no scheduling.

## How content is generated

`scripts/build.mjs` reads the source files listed in its `SOURCES` table and emits
`public/content.json`. Sources are never modified. Parsers:

| Parser | Matches | Used for |
|---|---|---|
| `blocks` | `-- EXERCISE 3: …` / `# LEVEL 2: …` comment headers | SQL + Python drill files |
| `mdqa` | `### Q4 ✅ Title` + `**Q:**` | `airflow/databricks_study_guide.md` |
| `mcq` | `**1.**` + `- A)` options + answer key | quiz markdown |
| `mdsections` | `## ` headings (split on `###` when long) | `nubank_gaps/`, concept notes |
| `lesson` | `# === TITLE ===` banner + snippet | `airflow/01–18` |
| `file` | whole file | reference DAGs, argument tables |
| `mdcards` | `## Task` + `### Solution` | `content/python_hackathon_drills.md` |
| `mdqbank` | `**Q: …**` + `A: "…"` | `interviews/caylent_study_guide.md` Q&A bank |

`mdsections` accepts `skip: /regex/` in the deck meta to drop navigation sections
(tables of contents, link lists). MCQ options are **shuffled deterministically** by card,
so the position of the correct answer in the source file carries no information.

Prompt/answer split rules: comment prose before the first code line is the prompt,
everything after (attempt + `-- SOLUTION`) is the answer. Blocks written as
`Q: … A: …` are split so the questions stay on the front.

Cards previously answered wrong in the Databricks guide (`❌`) start at max difficulty
so they surface earlier.

### Adding content

Two options:

1. Edit the source files in `interviews/` or `airflow/` following the existing header
   conventions, then `npm run build`.
2. Author a deck inside this repo under `content/` (see `content/airflow_quiz.md` for the
   MCQ format, `content/airflow_concepts.md` for open recall) and register it in the
   `SOURCES` table in `scripts/build.mjs`.

Tracks live in the `TRACKS` table in `scripts/build.mjs` — id, title, blurb, deck ids, and
`deep: true` for hardest-first ordering. Unknown deck ids are dropped with a warning at build
time, so a track never points at a deck that no longer exists.

Card ids are derived from deck id + title slug + index, so progress survives a rebuild
unless a card's title changes. Progress for cards that disappear is pruned on load.

## Deploy (Cloudflare Pages)

```bash
npx wrangler login
npm run deploy          # creates/updates the "prep-web" Pages project
```

Or connect the repo in the Cloudflare dashboard with:
build command `node scripts/build.mjs`, output directory `public`.
Note the build needs `../interviews` and `../airflow` present — for CI-based deploys
either vendor the generated `public/content.json` (commit it) or run the build locally
and deploy with wrangler.

On the phone: open the URL → *Add to Home Screen* → runs full screen and offline.
