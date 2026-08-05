# API Security & Robustness

OWASP API Top 10 in the shape an interviewer asks it, plus the defensive habits that show
production experience. Defensive material — how to build APIs that resist these classes of bug.

## OWASP API Security Top 10 (2023) — know the first three cold

| # | Risk | One-line meaning |
|---|---|---|
| API1 | **Broken object level authorisation (BOLA/IDOR)** | `/invoices/123` returns someone else's invoice because you checked *authenticated*, not *owns it* |
| API2 | Broken authentication | weak tokens, no expiry, no rotation, credential stuffing |
| API3 | Broken object **property** level authorisation | mass assignment (client sets `is_admin`) or excessive data exposure (returning `password_hash`) |
| API4 | Unrestricted resource consumption | no rate limit, no pagination cap, expensive queries, big uploads |
| API5 | Broken function level authorisation | a normal user reaching admin routes |
| API6 | Unrestricted access to sensitive business flows | automation abusing a legitimate flow (bulk buy, scraping) |
| API7 | **SSRF** | server fetches a URL the client supplied → hits internal metadata endpoints |
| API8 | Security misconfiguration | debug on, permissive CORS, stack traces, default creds |
| API9 | Improper inventory management | forgotten `/v1`, staging exposed, undocumented endpoints |
| API10 | Unsafe consumption of third-party APIs | trusting an upstream's response blindly |

**BOLA is number one because it is invisible to scanners** — only your business logic knows who owns
what. The fix is an authorisation check at the data-access layer, not in the route:

```python
# wrong: authenticated == authorised
invoice = await repo.get(invoice_id)

# right: ownership is part of the query
invoice = await repo.get_for_user(invoice_id, user.id)
if invoice is None:
    raise NotFound("invoice")        # 404, not 403 — do not confirm existence
```

## Authentication vs authorisation

- **401** = who are you (missing/invalid credentials). **403** = I know you, you may not.
- **Sessions (cookie)**: server-side state, easy revocation, needs CSRF defence. Cookies must be
  `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
- **JWT**: stateless, self-contained, **hard to revoke**. Keep access tokens short (5–15 min) with a
  refresh token that is stored server-side and rotated. Always verify: signature, `alg` (reject
  `none` and never accept the token's own algorithm choice), `exp`, `iat`, `iss`, `aud`.
- JWT holds claims, not secrets — it is signed, not encrypted; anyone can read the payload.
- **OAuth2 / OIDC**: OAuth2 = delegated authorisation, OIDC = identity on top. Authorization Code +
  PKCE for user-facing apps; client credentials for service-to-service. Never the implicit flow.
- **API keys** for machine clients: high entropy, hashed at rest, scoped, rotatable, revocable.
- **mTLS** for internal service-to-service where you control both ends.
- Compare secrets with `hmac.compare_digest`, never `==` (timing).
- Passwords: **argon2id** or bcrypt with a per-user salt. Never MD5/SHA-1/SHA-256-plain.

## Input validation — allow-list, at the edge

- **Allow-list, not deny-list.** Enumerate what is valid (types, ranges, lengths, enums, regex) and
  reject everything else. Blocking "bad" strings always loses.
- Validate **type, range, length, format, and business rule** — schema validation is not enough:
  `amount: float` still needs `ge=0`.
- `extra="forbid"` on input models blocks **mass assignment**.
- Cap sizes: request body, array lengths, string lengths, upload size, page size, nesting depth.
- Never trust the client for identity, price, role, or state (`is_admin`, `total_cents`,
  `user_id`) — derive them server-side from the token.
- Canonicalise before validating (unicode normalise, decode once) so `..%2f..` cannot slip through.
- Validate **output** too: `response_model` strips fields you did not declare.

## Injection — the ones that actually happen

```python
# SQL injection
await db.execute(f"SELECT * FROM users WHERE email = '{email}'")     # never
await db.execute(text("SELECT * FROM users WHERE email = :e"), {"e": email})   # parameterised
# identifiers cannot be parameterised — map them through an allow-list dict
ORDER = {"created": "created_at", "name": "name"}
column = ORDER[sort_key]     # KeyError = rejected input
```

- **Command injection**: `subprocess.run([...], shell=False)` with a list, never a formatted string.
- **Path traversal**: resolve and confine — `p = (BASE / name).resolve(); p.is_relative_to(BASE)`.
- **Deserialisation**: never `pickle.loads` untrusted data; `yaml.safe_load`, not `yaml.load`.
- **Template injection**: never build Jinja templates from user input; keep autoescape on.
- **NoSQL/ORM injection**: passing a dict straight from JSON into a query filter lets the client
  inject operators — validate into a typed model first.
- **Log injection**: strip newlines from user data before logging; structured JSON logging avoids it.

## SSRF and outbound requests

Any endpoint that fetches a client-supplied URL (webhooks, "import from URL", avatar fetch) is an
SSRF candidate — the classic target is the cloud metadata endpoint.

Defences: allow-list of hosts/schemes; resolve the DNS name and **reject private/loopback/link-local
ranges** (and re-check after redirects — DNS rebinding); disable redirects or cap them; force
`http/https`; short timeouts; egress via a proxy with its own allow-list; never echo the raw
upstream response back.

## Rate limiting and resource control

- Limit per **identity** (user/API key) and per IP, at the edge and in the app.
- Algorithms: fixed window (simple, bursty at boundaries), sliding window, **token bucket** (allows
  a controlled burst — the usual choice), leaky bucket.
- Return **429** with `Retry-After`; expose `X-RateLimit-Limit/Remaining/Reset`.
- Stricter limits on expensive and auth endpoints; exponential lockout on failed logins.
- Cap pagination (`limit ≤ 200`), request body size, upload size, and query complexity (GraphQL).
- Timeouts everywhere: server request timeout, DB statement timeout, HTTP client timeout.
- Protect against **zip bombs / decompression bombs** and unbounded regex (ReDoS: avoid nested
  quantifiers like `(a+)+` on user input; prefer explicit classes and length caps).

## Secrets, transport, headers

- Secrets from environment or a secret manager (AWS Secrets Manager, Vault). Never in code, git,
  logs, or error responses. Rotate. `SecretStr` keeps them out of `repr`.
- TLS everywhere; HSTS; no secrets in URLs or query strings (they land in logs and referrers).
- **CORS**: explicit origin allow-list. `allow_origins=["*"]` **with** `allow_credentials=True` is
  invalid and dangerous — never reflect arbitrary `Origin`.
- CSRF applies to cookie-based auth, not to `Authorization: Bearer` headers.
- Security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`.
- Disable debug mode, API docs and introspection in production, or gate them behind auth.

## Data protection and privacy

- Encrypt in transit and at rest; scope keys per environment.
- **Minimum necessary**: return only the fields the caller needs; separate output models per role.
- Mask PII/PHI/secrets in logs (`re.sub` on card/SSN-like patterns; never log tokens or bodies).
- Deletion and retention policies; soft delete plus a purge job if you must keep referential links.
- Audit log for sensitive reads/writes: who, what, when, request id — append-only.

## Dependency and supply chain

Pin versions and commit a lock file; `pip-audit` / `safety` in CI; Dependabot/Renovate; verify you
are not importing typosquatted packages; SBOM if the client asks. Run containers as non-root, read-only
filesystem, minimal base image. Least-privilege IAM for the service identity.

## The checklist to recite for "how do you make an API robust?"

1. **Validate** at the edge, allow-list, forbid extras, cap sizes.
2. **AuthN then AuthZ per object**, enforced in the data layer.
3. **One error contract**, no internal detail, `request_id` on everything.
4. **Timeouts, retries with backoff+jitter, circuit breaker** on every outbound call.
5. **Idempotency keys** for retryable writes; transactions for consistency.
6. **Rate limit and paginate**, always with a hard maximum.
7. **Logs, metrics, traces** — structured, PII-free, alertable (error rate, p99, saturation).
8. **Tests for the failure paths**, not only the happy one.
9. **Secrets managed, dependencies patched, least privilege**.
10. **Graceful degradation and health checks** so a partial outage stays partial.
