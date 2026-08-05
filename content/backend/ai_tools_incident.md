# AI Dev Tools Evaluation & Incident / Bug Reporting

The fourth focus area. This is judged on **structure and precision of communication**, not opinion.
Anything you say here should be reproducible, evidence-based and severity-ranked.

## What "evaluate an AI developer tool" means

You are being asked whether a tool (coding assistant, agent, code-review bot, test generator) should
be trusted in a real workflow. Evaluate along fixed axes and give a recommendation with conditions —
never "it's great" or "it hallucinates".

| Axis | What you actually measure |
|---|---|
| **Correctness** | does the generated code run and pass tests? on a fixed task set, not vibes |
| **Hallucination** | invented APIs, non-existent flags/packages, wrong signatures — count them |
| **Context handling** | does it respect repo conventions, existing types, the file it was given? |
| **Determinism / stability** | same prompt twice — same quality? version-to-version drift? |
| **Latency & throughput** | p50/p95 time to first token and to complete answer |
| **Cost** | per task and per developer-month, versus time saved |
| **Security of output** | does it emit SQL string interpolation, hardcoded secrets, disabled TLS? |
| **Safety of action** | can it delete files, push, run shell? what is gated? |
| **Failure mode** | does it stop and ask, or confidently produce plausible garbage? |
| **Ergonomics** | diff review, undo, editor integration, review burden it creates |
| **Data handling** | where does code go, retention, training opt-out, compliance |

Method sentence worth memorising: *"I evaluate on a fixed benchmark of tasks from our own repo, with
a rubric scored blind, run three times per tool to see variance, and I report per-axis scores with
the failure examples attached — not an overall grade."*

Metrics vocabulary: `pass@k` (does one of k samples pass tests), exact-match vs functional
correctness, human preference / side-by-side, regression suite between model versions, and the
critical one for tools — **acceptance rate and how much of the accepted code was later reverted**.

## Judging AI output as a reviewer

Failure classes to name explicitly:
1. **Hallucinated API** — method/flag/package does not exist. Cheapest to detect: run it.
2. **Plausible but wrong logic** — compiles, passes the happy path, breaks on an edge case.
3. **Silent scope drift** — solves a nearby problem, or refactors files it was not asked to touch.
4. **Stale knowledge** — deprecated API from an old version.
5. **Insecure by default** — string-formatted SQL, `verify=False`, secrets in code, `shell=True`.
6. **Overconfidence** — no uncertainty where the task was genuinely ambiguous.
7. **Test theatre** — tests that assert the implementation, or mock the thing under test.

Reviewer rule to state: **AI output is a proposal, not a patch.** Same review bar as a human PR, plus
"does this API exist" and "was this file supposed to change".

## Bug report — the template to write from memory

```
Title:        [component] short, specific, states the impact
Severity:     S1–S4 (see below)   Priority: P0–P3
Environment:  tool + version/model id, OS, runtime version, repo/commit, config flags
Steps to reproduce:
  1. exact command / prompt (verbatim, in a code block)
  2. …
  3. …
Expected:     what should happen, and why (spec/docs link)
Actual:       what happened — exact error text, request id, screenshot/log excerpt
Frequency:    always / N of 10 runs / only with X   ← say this, it drives triage
Impact:       who is blocked, is there data loss, is there a workaround
Evidence:     logs, request id, trace, minimal repro repo/gist
Notes:        first bad version, last good version, related issues
```

The three things a triager cannot work without: **exact repro steps, expected vs actual, and
frequency**. "Sometimes it fails" is not a report.

Extra fields when the bug is in an **AI tool**: the full prompt and any system prompt, model name
and version, temperature/settings, whether it reproduces at temperature 0, how many of N runs
reproduce, the full response (not a paraphrase), and the *correct* answer for comparison.
Non-determinism does not excuse a vague report — it makes the run count mandatory.

## Minimal reproduction

Strip the report to the smallest thing that still fails: cut the framework, cut the data, cut the
auth, inline the fixture. A 15-line repro gets fixed; a "clone our monorepo" bug sits in triage.
State what you already ruled out — that is what stops the round trip of "have you tried…".

## Severity vs priority — do not merge them

- **Severity** = how bad the impact is if it happens (data loss / outage → cosmetic).
- **Priority** = how soon we work on it (business decision: reach, frequency, workaround).

A rare crash can be S1/P2; a typo on the pricing page is S4/P0. Being able to separate them is the
signal here.

| Sev | Typical definition |
|---|---|
| **S1** | data loss, security breach, production down, no workaround |
| **S2** | major feature broken, painful workaround, many users |
| **S3** | minor feature broken, clean workaround exists |
| **S4** | cosmetic, docs, low impact |

## Incident response — the shape

1. **Detect** — alert or report. Start the clock.
2. **Declare** severity and open a channel; assign **incident commander** (coordinates, does not fix),
   comms lead, ops lead.
3. **Mitigate first, diagnose second** — roll back, feature-flag off, fail over, rate limit. Restoring
   service beats understanding it.
4. **Communicate** on a fixed cadence: what is broken, who is affected, what we are doing, next update
   time. Status page for customers, no speculation, no blame.
5. **Resolve** and verify with real signals, not hope.
6. **Postmortem** within a few days — **blameless**, written, with action items that have owners and
   dates.

Metrics: **MTTD** (detect), **MTTA** (acknowledge), **MTTR** (restore), change failure rate. The four
DORA metrics — deploy frequency, lead time, change failure rate, time to restore — are the standard
frame if they ask how you measure delivery health.

## Postmortem structure

```
Summary:      one paragraph — what broke, for whom, for how long
Impact:       users affected, requests failed, revenue/SLA effect, data integrity
Timeline:     UTC timestamps: first error, first alert, ack, mitigations tried, resolution
Root cause:   the technical chain, not "human error" — ask why until it reaches the system
Detection:    how we found out, and why not sooner
Resolution:   what actually fixed it
What went well / what went badly / where we got lucky
Action items: owner + date + type (prevent | detect faster | reduce blast radius)
```

**Blameless** means the write-up targets systems and defaults, not people: "a config change was
deployed without a staged rollout" instead of "X deployed a bad config". The reason is practical — if
reporting costs you, people stop reporting, and you lose the data.

For an **AI-tool incident** add: model/version in play, whether a model update coincided, prompt and
response samples, whether it is deterministic, blast radius (how many generations affected), and the
rollback path (pin the previous model version / disable the feature flag).

## SLI / SLO / error budget

- **SLI** = the measurement (success rate, p99 latency).
- **SLO** = the target (99.9% of requests succeed over 30 days).
- **Error budget** = 100% − SLO; spending it pauses risky releases.
- **SLA** = the contractual promise with penalties, always weaker than the SLO.

Alert on **symptoms users feel** (error rate, latency, saturation), not on every CPU spike. Every
alert needs a runbook, otherwise it is noise that trains people to ignore pages.

## Communicating a defect you found in *their* product

The interview may hand you a broken tool and watch how you report it. Sequence:

1. Reproduce it twice before writing anything.
2. Reduce to a minimal case, note frequency (N of 10).
3. State impact in user terms first, mechanism second.
4. Separate **fact** (what you observed) from **hypothesis** (what you think causes it) — label them.
5. Propose severity with your reasoning, and offer a workaround if one exists.
6. Say what you would need to confirm the cause (a log, a version, an env var).

Never: "it's broken", "it doesn't work well", or a hypothesis presented as a finding.

## Working with AI tools as a senior engineer — the answer they want

- Use it for scaffolding, boilerplate, tests, unfamiliar APIs and refactors with good test coverage.
- Verify every generated dependency, signature and query — **run it**, do not read it and nod.
- Never paste secrets, customer data, PHI/PII or proprietary code into a tool without a contract and
  a data-retention policy that allows it.
- Keep the human accountable: the author of the PR owns the code regardless of who typed it.
- Watch for automation bias — the risk is not that it fails loudly, it is that it succeeds plausibly.
- Measure before adopting: a fixed task set, acceptance rate, revert rate, review time.
