# Backend, API & Security Quiz

REST, GraphQL, FastAPI/pydantic, API security, AI-tool evaluation and incident reporting.

---

## Questions

**1.** An idempotent HTTP method means:
- A) It never changes state
- B) Repeating the same request leaves the same server state
- C) It is cacheable
- D) It returns the same response body every time

**2.** Which method is NOT idempotent?
- A) GET
- B) PUT
- C) POST
- D) DELETE

**3.** A client times out on `POST /payments` and retries. The correct defence is:
- A) Make POST idempotent by convention
- B) An `Idempotency-Key` header stored with the result, unique-indexed
- C) Tell clients not to retry
- D) Switch to PUT

**4.** 401 vs 403:
- A) 401 = not authenticated, 403 = authenticated but not allowed
- B) 401 = forbidden, 403 = unauthorised
- C) They are interchangeable
- D) 401 is for APIs, 403 for browsers

**5.** A caller requests another user's invoice by id. Best response:
- A) 403 with "not your invoice"
- B) 404 — do not confirm the resource exists
- C) 200 with an empty body
- D) 500

**6.** FastAPI returns which status for a body that fails pydantic validation?
- A) 400
- B) 422
- C) 409
- D) 412

**7.** A duplicate unique key on create should return:
- A) 400
- B) 409 Conflict
- C) 422
- D) 500

**8.** An upstream dependency times out. Your API should return:
- A) 500
- B) 503 or 504 — the failure is not the caller's fault and is retryable
- C) 200 with an error object
- D) 429

**9.** Returning HTTP 200 with `{"error": ...}` is wrong because:
- A) It is slower
- B) Clients, proxies and monitoring key off the status code for retries and alerting
- C) JSON cannot hold errors
- D) It breaks CORS

**10.** Offset pagination is a poor default because:
- A) It is not RESTful
- B) Deep offsets scan many rows, and concurrent inserts make pages skip or repeat rows
- C) It cannot be sorted
- D) Clients cannot parse it

**11.** Keyset/cursor pagination needs a tiebreaker column because:
- A) Timestamps are not unique, so rows would be skipped or duplicated
- B) SQL requires two ORDER BY columns
- C) It makes the cursor shorter
- D) Indexes need two columns

**12.** A cursor should be opaque (base64) so that:
- A) It is smaller
- B) Clients cannot depend on its internals, leaving you free to change them
- C) It is encrypted
- D) It can be cached

**13.** The pragmatic default for API versioning is:
- A) URL prefix `/v1/` — visible, routable, cache-friendly
- B) A custom header only
- C) Query parameter
- D) No versioning ever

**14.** Which change is backward compatible?
- A) Removing a response field
- B) Adding an optional request field with a default
- C) Renaming a field
- D) Making an optional field required

**15.** `model_config = ConfigDict(extra="forbid")` defends against:
- A) SQL injection
- B) Mass assignment — clients setting fields you never declared
- C) CSRF
- D) Rate abuse

**16.** Declaring a separate `ItemOut` response model prevents:
- A) Excessive data exposure — internal fields like `password_hash` cannot leak
- B) Injection
- C) N+1 queries
- D) Replay attacks

**17.** Cross-field rules in pydantic v2 go in:
- A) `@field_validator`
- B) `@model_validator(mode="after")`
- C) `Config`
- D) The route function

**18.** In pydantic v2, `.dict()` and `parse_obj` became:
- A) `.model_dump()` and `model_validate`
- B) `.json()` and `from_dict`
- C) `.to_dict()` and `load`
- D) Unchanged

**19.** `Depends` matters for testing because:
- A) It is faster
- B) `app.dependency_overrides` swaps the DB, auth or clients without touching endpoint code
- C) It validates input
- D) It caches results

**20.** Best practice for an error contract:
- A) Whatever the framework emits per exception
- B) One envelope everywhere: stable `code`, human `message`, `request_id`, optional `details`
- C) Plain-text messages
- D) Always 400 with the traceback

**21.** A 500 handler must never:
- A) Log the traceback
- B) Return the traceback, SQL or internal paths to the client
- C) Include a request id
- D) Return JSON

**22.** `except Exception: pass` around a DB call is wrong because:
- A) It is slow
- B) It hides failures and lets corrupted state continue silently
- C) It breaks typing
- D) It is not PEP 8

**23.** A blocking `requests.get()` inside `async def`:
- A) Runs in a threadpool automatically
- B) Blocks the event loop, stalling every other request in the worker
- C) Raises an error
- D) Is fine if it is fast

**24.** CPU-heavy work in an endpoint should go to:
- A) The event loop
- B) A threadpool or, better, a worker queue returning 202 + status URL
- C) A longer timeout
- D) An async generator

**25.** A plain `def` endpoint in FastAPI:
- A) Is rejected
- B) Runs in a threadpool, so blocking code is safe but pool-bounded
- C) Blocks the loop
- D) Is deprecated

**26.** `asyncio.gather` over 500 URLs without limits is risky because:
- A) It is sequential
- B) Unbounded concurrency exhausts sockets and hammers the upstream — use a Semaphore
- C) It cannot handle exceptions
- D) It does not preserve order

**27.** `return_exceptions=True` in `gather`:
- A) Raises the first error
- B) Returns exceptions as results so one failure does not cancel the batch
- C) Retries failures
- D) Suppresses logging

**28.** Every outbound HTTP call must have:
- A) A retry
- B) Connect and read timeouts
- C) A circuit breaker
- D) A cache

**29.** Retries should be applied:
- A) To everything, always
- B) Only to idempotent operations, on 429/5xx, with exponential backoff plus jitter
- C) Only on 4xx
- D) Without delay, to be fast

**30.** Jitter in backoff exists to:
- A) Randomise the load so retries from many clients do not synchronise into a spike
- B) Make retries faster
- C) Improve caching
- D) Satisfy the spec

**31.** A circuit breaker:
- A) Retries forever
- B) Fails fast after repeated failures, then probes for recovery
- C) Rate limits clients
- D) Caches responses

**32.** GraphQL's biggest operational difference from REST:
- A) It uses TCP
- B) One endpoint, usually HTTP 200 even on errors — caching, rate limiting and monitoring must be rebuilt
- C) It cannot mutate data
- D) It requires WebSockets

**33.** `[Invoice!]!` means:
- A) A nullable list of nullable invoices
- B) A non-null list of non-null invoices
- C) At least one invoice
- D) A list of exactly one

**34.** The N+1 problem in GraphQL comes from:
- A) Mutations running in parallel
- B) A nested field resolver firing once per parent item
- C) Fragments
- D) Introspection

**35.** DataLoader fixes it by:
- A) Caching globally
- B) Batching the ids from one tick into a single query, returning results in input order
- C) Denormalising the DB
- D) Running resolvers in threads

**36.** A DataLoader instance must be created:
- A) Once per process
- B) Once per request — a shared loader leaks one user's data to another
- C) Once per resolver call
- D) At import time

**37.** Per-endpoint rate limiting does not protect GraphQL because:
- A) There is one endpoint and a single request can cost anything — you need depth and cost limits
- B) GraphQL bypasses middleware
- C) Queries are cached
- D) It uses GET

**38.** Alias amplification is:
- A) `q1: user(id:1) q2: user(id:2) …` repeating a costly field to multiply work in one request
- B) Renaming types
- C) A caching strategy
- D) Schema stitching

**39.** In production, GraphQL introspection should be:
- A) Public — it is just the schema
- B) Disabled or authenticated; it maps your whole API for an attacker
- C) Cached
- D) Rate limited only

**40.** "Errors as data" (typed `errors` in the mutation payload) is preferred for:
- A) Unexpected internal failures
- B) Expected user-facing validation failures, because they stay typed and cannot be ignored
- C) Auth failures only
- D) Nothing — always throw

**41.** OWASP API #1 is:
- A) Injection
- B) Broken object level authorisation (BOLA/IDOR)
- C) Misconfiguration
- D) SSRF

**42.** The most robust place to enforce object ownership:
- A) In the route with an `if` after fetching
- B) In the data-access query itself (`get_for_owner(id, user.id)`), so the safe path is the default
- C) In the frontend
- D) In a middleware that parses the URL

**43.** Which fixes SQL injection for a **column name** in ORDER BY?
- A) Bind it as a parameter
- B) An allow-list dict mapping user input to real column names
- C) Escaping quotes
- D) A regex denying `;`

**44.** Storing a JWT and needing instant revocation implies:
- A) JWTs revoke instantly
- B) Short-lived access tokens plus a server-side, rotatable refresh token
- C) Longer expiry
- D) Encrypting the JWT

**45.** Validating a JWT must include:
- A) Signature only
- B) Signature with a **pinned algorithm**, plus `exp`, `iss`, `aud`
- C) The `alg` value from the token header
- D) Just decoding the payload

**46.** A JWT payload is:
- A) Encrypted, unreadable by the client
- B) Signed but readable — never put secrets in it
- C) Hashed
- D) Compressed

**47.** Comparing a token or signature should use:
- A) `==`
- B) `hmac.compare_digest` — constant time, no timing leak
- C) `is`
- D) `hash()`

**48.** Password storage should use:
- A) SHA-256
- B) argon2id or bcrypt with a per-user salt
- C) MD5 with salt
- D) AES encryption

**49.** Input validation should be:
- A) Deny-list of dangerous patterns
- B) Allow-list: declare exactly what is valid and reject the rest
- C) Client-side only
- D) Done in the database

**50.** `allow_origins=["*"]` together with `allow_credentials=True`:
- A) Is the recommended default
- B) Is invalid and unsafe — credentialed CORS requires an explicit origin allow-list
- C) Only affects GET
- D) Is required for cookies

**51.** CSRF protection is needed when:
- A) Auth rides on cookies the browser sends automatically
- B) Using `Authorization: Bearer` headers
- C) The API is public
- D) Always

**52.** An endpoint that fetches a client-supplied URL risks:
- A) SSRF — reaching internal services or cloud metadata
- B) CSRF
- C) XSS
- D) Clickjacking

**53.** SSRF defence includes:
- A) Blocking only `localhost`
- B) Scheme/host allow-list, rejecting private and link-local IPs after DNS resolution, and re-checking on redirects
- C) A longer timeout
- D) Escaping the URL

**54.** Token bucket beats a fixed window because:
- A) It is simpler
- B) It allows a bounded burst then settles to the rate; fixed windows let ~2× through at the boundary
- C) It needs no state
- D) It never rejects

**55.** A 429 response should carry:
- A) `Retry-After`
- B) The client's IP
- C) A stack trace
- D) A new token

**56.** Distributed rate limiting needs:
- A) Per-process dictionaries
- B) Shared state with an atomic operation (Redis INCR/EXPIRE or a Lua script)
- C) Sticky sessions
- D) A database transaction per request

**57.** ReDoS is caused by:
- A) Too many regex imports
- B) Catastrophic backtracking, e.g. nested quantifiers like `(a+)+` on attacker-controlled input
- C) Unicode
- D) Compiled patterns

**58.** Secrets in a pydantic settings model should be typed:
- A) `str`
- B) `SecretStr`, so they stay out of `repr` and logs
- C) `bytes`
- D) `Any`

**59.** Which test matters most for senior signal?
- A) The happy path
- B) Failure paths: invalid input, unauthorised, duplicate, upstream timeout
- C) Import tests
- D) Coverage percentage

**60.** `TestClient` with `dependency_overrides` lets you:
- A) Skip validation
- B) Replace the DB and auth with fakes without changing endpoint code
- C) Test only sync endpoints
- D) Mock the network layer

**61.** Health endpoints split as:
- A) `/healthz` = process alive, `/readyz` = dependencies reachable
- B) They are the same
- C) `/healthz` checks the DB, `/readyz` checks the process
- D) Only one is needed

**62.** Structured request logs should include, but never include:
- A) Include request id, route, status, duration; never the raw body, tokens or PII
- B) Include the body; never the status
- C) Include tokens for debugging
- D) Include everything

**63.** Evaluating an AI coding tool should be:
- A) A per-axis rubric on a fixed task set, repeated runs, with failure examples attached
- B) A general impression after a week
- C) Vendor benchmark numbers
- D) Star rating

**64.** `pass@k` measures:
- A) Whether at least one of k sampled solutions passes the tests
- B) The k-th percentile latency
- C) Token accuracy
- D) Acceptance rate

**65.** The most useful adoption metric for a coding assistant:
- A) Lines generated
- B) Acceptance rate together with how much accepted code is later reverted
- C) Number of prompts
- D) Model size

**66.** "Hallucinated API" means:
- A) Slow response
- B) The model invented a method, flag or package that does not exist
- C) A wrong variable name
- D) A security bug

**67.** The dangerous failure mode of AI output is:
- A) Loud errors
- B) Plausible, confident, wrong — it passes review by looking right
- C) Refusals
- D) Latency

**68.** A bug report is unusable without:
- A) Exact repro steps, expected vs actual, and frequency
- B) A proposed patch
- C) A screenshot
- D) The reporter's opinion

**69.** For a bug in an AI tool, additionally record:
- A) Model and version, full prompt and response, settings, and how many of N runs reproduce
- B) Only the prompt
- C) Nothing — it is non-deterministic
- D) The developer's name

**70.** Severity vs priority:
- A) Severity = impact if it happens; priority = how soon we work on it
- B) They are synonyms
- C) Severity is set by the customer, priority by QA
- D) Priority = impact; severity = schedule

**71.** A rare crash with data loss is typically:
- A) S4/P3
- B) High severity, moderate priority — severity tracks impact, priority tracks scheduling
- C) Not a bug
- D) S1/P0 always

**72.** During an incident, the first move is:
- A) Find the root cause
- B) Mitigate — roll back, flag off, fail over — then diagnose
- C) Write the postmortem
- D) Notify legal

**73.** The incident commander's job is to:
- A) Fix the bug personally
- B) Coordinate: assign roles, track state, run comms — not to debug
- C) Approve the deploy
- D) Write the status page copy

**74.** Blameless postmortems exist because:
- A) Mistakes do not matter
- B) If reporting is punished, people hide problems and you lose the data that prevents recurrence
- C) Legal requires it
- D) It is faster

**75.** MTTR measures:
- A) Mean time to restore service
- B) Mean time to reproduce
- C) Mean tests to run
- D) Mean time to review

**76.** An error budget is:
- A) 100% − SLO; spending it pauses risky releases
- B) The bug backlog
- C) The SLA penalty
- D) Allowed test failures

**77.** Alerts should fire on:
- A) Symptoms users feel — error rate, latency, saturation
- B) Every CPU spike
- C) Each exception
- D) Deploys

**78.** When reporting a defect you found in someone's product, you should:
- A) Separate observed facts from your hypothesis, and label which is which
- B) Lead with your theory of the cause
- C) Report only if you can fix it
- D) Send the whole repo

**79.** Before pasting code into an AI tool, check:
- A) Nothing — it is a dev tool
- B) Data retention, training opt-out and contract terms; never paste secrets, customer data or PHI
- C) Only file size
- D) The model version

**80.** Accountability for AI-generated code sits with:
- A) The vendor
- B) The engineer who opens the PR — same review bar as human code, plus "does this API exist"
- C) The reviewer only
- D) Nobody

## Answer key

1 - B
2 - C
3 - B
4 - A
5 - B
6 - B
7 - B
8 - B
9 - B
10 - B
11 - A
12 - B
13 - A
14 - B
15 - B
16 - A
17 - B
18 - A
19 - B
20 - B
21 - B
22 - B
23 - B
24 - B
25 - B
26 - B
27 - B
28 - B
29 - B
30 - A
31 - B
32 - B
33 - B
34 - B
35 - B
36 - B
37 - A
38 - A
39 - B
40 - B
41 - B
42 - B
43 - B
44 - B
45 - B
46 - B
47 - B
48 - B
49 - B
50 - B
51 - A
52 - A
53 - B
54 - B
55 - A
56 - B
57 - B
58 - B
59 - B
60 - B
61 - A
62 - A
63 - A
64 - A
65 - B
66 - B
67 - B
68 - A
69 - A
70 - A
71 - B
72 - B
73 - B
74 - B
75 - A
76 - A
77 - A
78 - A
79 - B
80 - B

### One-line rationales

1. **Idempotent** = same state after N identical requests, not the same response body.
2. **POST** creates something new each time; GET/PUT/DELETE are idempotent.
3. Client-generated **`Idempotency-Key`** stored with the result (unique index) makes retries safe.
4. **401** = unauthenticated, **403** = authenticated but not permitted.
5. **404** avoids confirming that another user's resource exists.
6. FastAPI/pydantic validation failures are **422** with `loc`/`msg`/`type`.
7. A duplicate unique key is a **409 Conflict**.
8. Upstream timeout → **503/504**; 500 says the bug is yours.
9. Status codes drive **retries, alerting and caching** — 200-with-error breaks all three.
10. Deep `OFFSET` scans, and inserts shift the window so rows **skip or repeat**.
11. Timestamps collide; the **id tiebreaker** makes the key total.
12. Opaque cursors keep the encoding an **implementation detail**.
13. **URL prefix versioning** is visible, routable and cache-friendly.
14. **Adding an optional field with a default** is the safe evolution.
15. `extra="forbid"` blocks **mass assignment**.
16. A dedicated output model prevents **excessive data exposure**.
17. **`model_validator(mode="after")`** sees all fields, so cross-field rules live there.
18. v2 renamed to **`model_dump()`** and **`model_validate`**.
19. **`dependency_overrides`** is why everything should arrive through `Depends`.
20. **One error envelope** with a stable code and request id.
21. Never leak **tracebacks, SQL or paths**; log them instead.
22. **Swallowed exceptions** hide failure and let corrupt state propagate.
23. A blocking call in `async def` **stalls the event loop** for every request.
24. CPU work belongs in a **worker queue** (202 + status URL) or at least a threadpool.
25. FastAPI runs `def` endpoints in a **threadpool** — safe, but bounded by pool size.
26. Bound fan-out with a **Semaphore**; unbounded gather exhausts sockets.
27. **`return_exceptions=True`** collects failures instead of cancelling the batch.
28. **Timeouts on every call** — the single most common resilience gap.
29. Retry only **idempotent** operations, on **429/5xx**, with backoff + jitter.
30. **Jitter** desynchronises clients so retries do not form a thundering herd.
31. A **circuit breaker** fails fast after repeated failures and probes to recover.
32. One endpoint, HTTP 200, `errors[]` — **caching, limiting and monitoring** must be rebuilt.
33. `[Invoice!]!` = **non-null list of non-null items**.
34. A nested resolver runs **once per parent** — that is N+1.
35. **DataLoader** batches ids from one tick into one query, aligned to input order.
36. Loaders are **per request**; a shared one leaks another user's cached rows.
37. A single GraphQL request can cost anything — you need **depth and cost limits**.
38. **Aliases** repeat an expensive field inside one request to multiply cost.
39. Disable or authenticate **introspection** in production.
40. **Errors as data** keeps expected validation failures typed and unmissable.
41. **BOLA/IDOR** is API1 — business logic, invisible to scanners.
42. Put ownership **in the query** so the safe path is the default.
43. Identifiers cannot be bound — use an **allow-list dict**.
44. JWTs cannot be revoked; use **short access tokens + server-side refresh**.
45. Verify signature with a **pinned algorithm**, plus `exp`, `iss`, `aud`.
46. A JWT is **signed, not encrypted** — the payload is readable.
47. **`hmac.compare_digest`** avoids timing side channels.
48. **argon2id/bcrypt** — password hashing must be deliberately slow.
49. **Allow-list** validation; deny-lists always miss a case.
50. Wildcard origin **with credentials** is invalid and unsafe.
51. CSRF applies to **cookie-borne** credentials the browser attaches automatically.
52. Client-supplied fetch URLs are the **SSRF** pattern.
53. Allow-list plus **private/link-local IP rejection after DNS**, re-checked on redirects.
54. **Token bucket** allows a bounded burst; fixed windows leak ~2× at the boundary.
55. **`Retry-After`** tells the client when to come back.
56. Distributed limits need **atomic shared state** (Redis INCR/EXPIRE or Lua).
57. **ReDoS** = catastrophic backtracking from nested quantifiers.
58. **`SecretStr`** keeps secrets out of `repr` and logs.
59. **Failure-path tests** are the senior signal, not happy-path count.
60. Overrides swap **DB and auth** for fakes with no endpoint changes.
61. **`/healthz`** = alive, **`/readyz`** = dependencies ready — Kubernetes treats them differently.
62. Log **request id, route, status, duration**; never bodies, tokens or PII.
63. Evaluate with a **rubric on a fixed task set**, repeated, with evidence.
64. **`pass@k`** = at least one of k samples passes the tests.
65. **Acceptance rate plus revert rate** — accepted-then-reverted code is negative value.
66. A **hallucinated API** is an invented method, flag or package.
67. The danger is **plausible and confident but wrong**, which survives review.
68. **Repro steps, expected vs actual, frequency** — without these, triage is blocked.
69. For AI bugs also log **model/version, full prompt and response, settings, N-of-runs**.
70. **Severity = impact, priority = scheduling.** They are set by different people.
71. Data loss is high **severity**; rarity affects **priority**, not severity.
72. **Mitigate first** — restore service, then diagnose.
73. The **incident commander coordinates**; someone else debugs.
74. **Blameless** because punishing reports destroys the reporting.
75. **MTTR** = mean time to restore service.
76. **Error budget** = 100% − SLO, and it gates risky releases.
77. Alert on **user-visible symptoms**, with a runbook per alert.
78. Label **fact vs hypothesis** — mixing them wastes the triager's time.
79. Check **retention and contract**; never paste secrets, customer data or PHI.
80. The **PR author owns** the code, whoever or whatever generated it.
