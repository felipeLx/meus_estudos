# Python Backend & REST API — Core

Senior backend expectations: HTTP semantics, validation, errors, versioning, testing. FastAPI as
the reference framework, Flask/Django noted where they differ.

## HTTP methods and what they promise

| Method | Safe | Idempotent | Body | Use |
|---|---|---|---|---|
| GET | yes | yes | no | read; cacheable |
| POST | no | **no** | yes | create, or actions that don't fit |
| PUT | no | yes | yes | full replace at a known URI |
| PATCH | no | no (usually) | yes | partial update |
| DELETE | no | yes | no | remove; deleting twice is still 204/404 |

**Safe** = no server state change. **Idempotent** = same request N times leaves the same state.
That is why a client may retry GET/PUT/DELETE automatically but not POST — and why POST endpoints
that can be retried need an **idempotency key** (see the drills deck).

Interview line: *"PUT is idempotent, POST is not — so any create endpoint a client might retry on
timeout takes an `Idempotency-Key` header and I store the key with the result."*

## Status codes that matter

| Code | Meaning | Typical cause |
|---|---|---|
| 200 / 201 / 204 | OK / Created (+`Location`) / No content | reads, creates, deletes |
| 202 | Accepted | async job queued; return a status URL |
| 400 | Bad request | malformed syntax |
| 401 vs 403 | not authenticated vs authenticated but not allowed | the classic mix-up |
| 404 | Not found — also used to hide existence from unauthorised callers |
| 409 | Conflict | duplicate unique key, version conflict |
| 422 | Unprocessable entity | syntactically valid, semantically wrong — FastAPI's validation default |
| 429 | Too many requests | rate limit; send `Retry-After` |
| 500 vs 502/503/504 | your bug vs upstream/unavailable/timeout |

Rule: 4xx = caller can fix it, 5xx = you must. Never return 200 with `{"error": ...}` — it breaks
every client's retry and monitoring logic.

## Resource design

- Nouns, plural, lowercase, hyphenated: `/api/v1/customers/42/invoices`.
- Nest one level deep at most; beyond that use query filters: `/invoices?customer_id=42`.
- Verbs only for genuine actions that are not CRUD: `POST /invoices/42/void`.
- Filtering, sorting, pagination in the query string: `?status=open&sort=-created_at&limit=50`.
- Return the created resource plus `Location` on 201.

**Pagination**: offset/limit is simple but drifts and gets slow (`OFFSET 100000` scans). **Cursor
(keyset)** pagination — `WHERE (created_at, id) < (:ts, :id) ORDER BY created_at DESC, id DESC` —
is stable under inserts and stays fast. Say that trade-off out loud; it is a standard senior probe.

**Versioning**: URL prefix (`/v1/`) is the pragmatic default — visible, cache-friendly, easy to
route. Header/media-type versioning is purer but harder to debug. Never break v1 in place; add
optional fields (backward compatible), deprecate with a sunset header and a timeline.

## FastAPI — the shape of a real endpoint

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field, EmailStr, field_validator

router = APIRouter(prefix="/api/v1/customers", tags=["customers"])

class CustomerIn(BaseModel):
    model_config = {"extra": "forbid"}          # reject unknown fields — anti mass-assignment
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    credit_limit: float = Field(ge=0, le=1_000_000)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

class CustomerOut(BaseModel):                    # never reuse the input model for output
    id: int
    name: str
    email: EmailStr

@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
async def create_customer(payload: CustomerIn, svc: Service = Depends(get_service)):
    if await svc.email_exists(payload.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "email already registered")
    return await svc.create(payload)

@router.get("", response_model=list[CustomerOut])
async def list_customers(limit: int = Query(50, ge=1, le=200), cursor: str | None = None):
    return await svc.list(limit=limit, cursor=cursor)
```

What each piece signals: `response_model` guarantees the response shape and **strips fields the
model does not declare** (no accidental password leak); `extra="forbid"` blocks mass assignment;
`Field` constraints put validation in the schema instead of in `if` statements; `Depends` is how
auth, DB sessions and services get injected and overridden in tests.

## Pydantic v2 — validation you should know

```python
from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Annotated, Literal
from datetime import date

Money = Annotated[float, Field(ge=0, le=1e9)]

class BookingIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    kind: Literal["one_way", "round_trip"]
    start: date
    end: date | None = None
    amount: Money

    @model_validator(mode="after")
    def check_dates(self):
        if self.kind == "round_trip" and self.end is None:
            raise ValueError("round_trip requires end")
        if self.end and self.end < self.start:
            raise ValueError("end must be on or after start")
        return self
```

- `field_validator` = one field; `model_validator(mode="after")` = cross-field rules.
- Validate at the **edge**, once. Inside the service everything is already a typed model.
- v2 renames to know: `parse_obj`→`model_validate`, `.dict()`→`.model_dump()`, `Config`→`model_config`,
  `@validator`→`@field_validator`, and `orm_mode`→`from_attributes=True`.
- Validation errors → **422** with a machine-readable list of `loc`, `msg`, `type`.

## Error handling — one contract, no leaks

```python
from fastapi import Request
from fastapi.responses import JSONResponse

class DomainError(Exception):
    status_code = 400
    code = "domain_error"

class NotFound(DomainError):
    status_code, code = 404, "not_found"

@app.exception_handler(DomainError)
async def domain_handler(request: Request, exc: DomainError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": str(exc),
                           "request_id": request.state.request_id}},
    )

@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    logger.exception("unhandled", extra={"request_id": request.state.request_id})
    return JSONResponse(status_code=500, content={"error": {
        "code": "internal_error", "message": "Internal server error",
        "request_id": request.state.request_id}})
```

Rules that come up in every review:
- **One error envelope** for the whole API: stable `code`, human `message`, `request_id`, optional
  `details`. RFC 7807 `application/problem+json` if you want the standard.
- **Never** return stack traces, SQL, or internal paths to the client. Log them with the request id.
- Catch narrow exceptions near the source, translate to domain errors, let one handler format them.
- A bare `except: pass` is the answer they want you to reject out loud.

## Dependencies, config, lifecycle

```python
async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:      # cleanup guaranteed after the response
        yield session

class Settings(BaseSettings):                  # pydantic-settings
    model_config = SettingsConfigDict(env_file=".env")
    database_url: str
    jwt_secret: SecretStr                      # SecretStr keeps it out of repr/logs
    rate_limit_per_min: int = 60

@lru_cache
def get_settings() -> Settings: return Settings()
```

Config from **environment**, never hard-coded; secrets as `SecretStr` and from a secret manager.
`app.dependency_overrides[get_db] = fake_db` is what makes the endpoints testable without a server.

## Async, blocking and concurrency

- `async def` only helps if the work is **I/O-bound and awaited**. One blocking call (`requests`,
  `time.sleep`, heavy CPU, sync DB driver) inside an async endpoint stalls the whole event loop.
- Blocking library, no async version → `await run_in_threadpool(fn, ...)` / `asyncio.to_thread`.
- CPU-bound → process pool or a worker queue (Celery/RQ/arq), not the request thread.
- FastAPI runs plain `def` endpoints in a threadpool automatically — that is the safe default when
  your driver is sync.
- Concurrent fan-out: `results = await asyncio.gather(*(fetch(u) for u in urls))`, with a
  `Semaphore` to bound it and `asyncio.timeout()` around it.

## Talking to other services without falling over

- **Timeouts on every call** — connect and read. A missing timeout is how one slow dependency takes
  down your API.
- **Retries with exponential backoff + jitter**, only for idempotent operations and 429/5xx.
- **Circuit breaker** after N consecutive failures: fail fast, recover on a probe.
- **Bulkhead / connection pool limits** so one dependency cannot exhaust all workers.
- **Graceful degradation**: cached or partial response beats a 500 when the data is non-critical.
- Propagate a **correlation/request id** header through every hop.

## Testing a backend

```python
@pytest.fixture
def client(fake_repo):
    app.dependency_overrides[get_repo] = lambda: fake_repo
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_rejects_unknown_field(client):
    r = client.post("/api/v1/customers", json={"name": "x", "email": "a@b.co", "admin": True})
    assert r.status_code == 422                      # extra="forbid" catches mass assignment

@pytest.mark.parametrize("payload,field", [({"email": "nope"}, "email"), ({"credit_limit": -1}, "credit_limit")])
def test_validation_errors(client, payload, field):
    r = client.post("/api/v1/customers", json={**valid, **payload})
    assert r.status_code == 422 and field in str(r.json())
```

Pyramid: many unit tests on pure logic, a layer of endpoint tests with `TestClient` and overridden
dependencies, a thin layer of integration tests against a real DB (testcontainers). Test the
**failure paths** — auth denied, invalid payload, upstream timeout, duplicate key — that is what
separates a senior test suite. `pytest.raises`, `freezegun`/fake clock, `respx`/`responses` for HTTP.

## Observability

Structured JSON logs with `request_id`, route, status, duration, user id — never the payload if it
holds PII/credentials. Metrics: request rate, error rate, p50/p95/p99 latency, saturation (the RED
method). Tracing with OpenTelemetry across services. Health endpoints: `/healthz` (process alive)
and `/readyz` (dependencies reachable) — Kubernetes treats them differently.

## Data layer notes that come up

- Use the ORM's parameter binding; **never** f-string SQL (that is the injection card).
- `select().where()` with explicit column lists beats `SELECT *` in an API.
- N+1 queries: eager-load relationships (`selectinload`) or batch by id.
- Transactions per request unit of work; keep them short, do not hold one across an HTTP call.
- Optimistic locking with a `version` column returns **409** on conflict instead of last-write-wins.
