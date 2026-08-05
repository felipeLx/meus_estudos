# Backend API — Coding Drills

50-minute-exercise shapes: build an endpoint, validate it, secure it, handle failure. Write it
before revealing. Target 6–10 minutes each.

## CRUD endpoint with validation and proper status codes

<!-- difficulty: 3 -->
FastAPI: `POST /api/v1/items` creating an item. Requirements: name 1–100 chars, price ≥ 0,
optional tags (max 10, unique), reject unknown fields, 201 with the created resource,
409 if the name already exists.

### Solution

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator

router = APIRouter(prefix="/api/v1/items", tags=["items"])

class ItemIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=100)
    price_cents: int = Field(ge=0)
    tags: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("tags")
    @classmethod
    def unique_tags(cls, v: list[str]) -> list[str]:
        if len(set(v)) != len(v):
            raise ValueError("tags must be unique")
        return v

class ItemOut(BaseModel):
    id: int
    name: str
    price_cents: int
    tags: list[str]

@router.post("", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(payload: ItemIn, repo: Repo = Depends(get_repo)) -> ItemOut:
    if await repo.exists_by_name(payload.name):
        raise HTTPException(status.HTTP_409_CONFLICT, "item name already exists")
    return await repo.create(payload)
```

Talking points while you type: `extra="forbid"` = mass-assignment defence; separate `ItemOut` so
internal fields cannot leak; money as **integer cents**, never float; 409 not 400 for a duplicate;
validation failures return 422 automatically with field paths.

## Cursor pagination

<!-- difficulty: 3 -->
`GET /items?limit=50&cursor=…` returning stable pages under concurrent inserts. Explain why offset
is wrong.

### Solution

```python
import base64, json

def encode_cursor(created_at, id_) -> str:
    return base64.urlsafe_b64encode(json.dumps([created_at.isoformat(), id_]).encode()).decode()

@router.get("", response_model=Page[ItemOut])
async def list_items(limit: int = Query(50, ge=1, le=200), cursor: str | None = None):
    after = decode_cursor(cursor) if cursor else None
    rows = await repo.page(limit=limit + 1, after=after)   # fetch one extra to know hasNext
    has_next = len(rows) > limit
    rows = rows[:limit]
    return Page(items=rows, next_cursor=encode_cursor(*key(rows[-1])) if has_next else None)
```

```sql
SELECT * FROM items
WHERE (created_at, id) < (:ts, :id)          -- keyset, uses the index
ORDER BY created_at DESC, id DESC
LIMIT :limit;
```

Offset pagination re-scans `OFFSET` rows (slow at depth) and **skips or repeats rows** when items
are inserted between requests. Keyset is O(log n) via the index and stable. The tiebreaker `id` is
required — `created_at` alone is not unique. Cursor is opaque: clients must not parse it.

## Idempotent POST

<!-- difficulty: 4 -->
`POST /payments` must be safe to retry after a network timeout. Design and implement it.

### Solution

```python
@router.post("/payments", status_code=201)
async def create_payment(
    payload: PaymentIn,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=8, max_length=128),
    repo: Repo = Depends(get_repo),
):
    fingerprint = hashlib.sha256(payload.model_dump_json().encode()).hexdigest()
    existing = await repo.get_idempotency(idempotency_key)
    if existing:
        if existing.fingerprint != fingerprint:
            raise HTTPException(422, "idempotency key reused with a different body")
        return existing.response          # replay the stored result, do not charge twice
    async with repo.transaction():
        payment = await repo.create_payment(payload)
        await repo.save_idempotency(idempotency_key, fingerprint, payment)   # unique index on key
    return payment
```

Key points: the key is **client-generated** (UUID) and stored with a unique constraint, so a race
between two concurrent retries fails one of them at the DB level; store the *response*, not just a
flag; bind the key to a body fingerprint so a reused key with different data is rejected; expire
keys after 24h. Same idea protects any non-idempotent write.

## Auth dependency + object-level authorisation

<!-- difficulty: 4 -->
Add JWT bearer auth, and make `GET /invoices/{id}` return only invoices the caller owns.

### Solution

```python
from fastapi import Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

bearer = HTTPBearer(auto_error=True)

async def current_user(cred: HTTPAuthorizationCredentials = Security(bearer),
                       settings: Settings = Depends(get_settings)) -> User:
    try:
        claims = jwt.decode(
            cred.credentials,
            settings.jwt_public_key,
            algorithms=["RS256"],          # pin the algorithm — never trust the header's alg
            audience="my-api", issuer="https://auth.example.com",
        )
    except jwt.PyJWTError:
        raise HTTPException(401, "invalid token")     # 401, not 403
    return User(id=claims["sub"], scopes=claims.get("scope", "").split())

@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(invoice_id: int, user: User = Depends(current_user), repo=Depends(get_repo)):
    invoice = await repo.get_for_owner(invoice_id, owner_id=user.id)   # ownership in the QUERY
    if invoice is None:
        raise HTTPException(404, "invoice not found")   # 404 hides existence from non-owners
    return invoice
```

This is **API1: BOLA**, the most common real API vulnerability. Fetch-then-compare (`if
invoice.owner_id != user.id`) also works but leaks through timing and is easy to forget on the next
endpoint — pushing ownership into the repository query makes the safe path the default.

## Token-bucket rate limiter

<!-- difficulty: 4 -->
Implement a per-user rate limiter (N requests per window) as middleware/dependency. Explain the
distributed version.

### Solution

```python
import time
from fastapi import Request

class TokenBucket:
    def __init__(self, capacity: int, refill_per_sec: float):
        self.capacity, self.rate = capacity, refill_per_sec
        self.state: dict[str, tuple[float, float]] = {}    # key -> (tokens, last_ts)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        tokens, last = self.state.get(key, (self.capacity, now))
        tokens = min(self.capacity, tokens + (now - last) * self.rate)   # refill
        if tokens < 1:
            self.state[key] = (tokens, now)
            return False
        self.state[key] = (tokens - 1, now)
        return True

async def rate_limit(request: Request, user: User = Depends(current_user)):
    if not bucket.allow(user.id):
        raise HTTPException(429, "rate limit exceeded", headers={"Retry-After": "60"})
```

In-process state only works for one worker. Distributed: Redis with an atomic **Lua script** (or
`INCR` + `EXPIRE`) so refill-and-consume is a single round trip and cannot race. Token bucket allows
a burst up to capacity then settles to the refill rate — better UX than a fixed window, which lets
2× the limit through around the boundary. Always return `429` + `Retry-After`.

## Resilient outbound HTTP call

<!-- difficulty: 3 -->
Call a flaky third-party API from an endpoint: timeouts, bounded retries with backoff and jitter,
no retry on non-idempotent failures, and a clear error to the caller.

### Solution

```python
import asyncio, random, httpx

RETRY_STATUS = {429, 500, 502, 503, 504}

async def fetch_rate(client: httpx.AsyncClient, url: str, attempts: int = 3) -> dict:
    for attempt in range(attempts):
        try:
            r = await client.get(url, timeout=httpx.Timeout(2.0, connect=1.0))
            if r.status_code in RETRY_STATUS and attempt < attempts - 1:
                raise httpx.HTTPError(f"retryable {r.status_code}")
            r.raise_for_status()
            return r.json()
        except (httpx.TimeoutException, httpx.HTTPError):
            if attempt == attempts - 1:
                raise HTTPException(503, "rate provider unavailable")   # 503, not 500
            await asyncio.sleep((2 ** attempt) * 0.2 + random.uniform(0, 0.1))  # backoff + jitter
```

Points to say: **every** call gets connect and read timeouts; retry only idempotent operations and
only on 429/5xx (never on 4xx — the request is wrong); jitter prevents synchronised retry storms;
cap total time so you do not blow the caller's own timeout; upstream failure maps to **503/504**,
not 500; add a circuit breaker when the dependency fails repeatedly; reuse one `AsyncClient`
(connection pooling) instead of creating one per request.

## Global error handling with a stable contract

<!-- difficulty: 3 -->
Every error must come back as `{"error": {"code", "message", "request_id"}}`, with no internal
detail leaking, and the request id in both response and logs.

### Solution

```python
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response

def envelope(request, code, message, status_code, details=None):
    body = {"error": {"code": code, "message": message,
                      "request_id": getattr(request.state, "request_id", None)}}
    if details:
        body["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=body)

@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc):
    return envelope(request, "validation_error", "Invalid request", 422, exc.errors())

@app.exception_handler(HTTPException)
async def http_handler(request, exc):
    return envelope(request, "http_error", exc.detail, exc.status_code)

@app.exception_handler(Exception)
async def unhandled_handler(request, exc):
    logger.exception("unhandled error", extra={"request_id": request.state.request_id})
    return envelope(request, "internal_error", "Internal server error", 500)
```

The 500 handler logs the traceback and returns **nothing** about it. The request id is the bridge:
the user quotes it in a bug report, you grep the logs.

## GraphQL resolver without N+1

<!-- difficulty: 4 -->
`{ customers(first: 50) { name invoices { id amount } } }` currently issues 51 queries. Fix it.

### Solution

```python
from collections import defaultdict
from strawberry.dataloader import DataLoader

async def batch_invoices(customer_ids: list[str]) -> list[list[Invoice]]:
    rows = await repo.invoices_for(customer_ids)      # single IN (...) query
    grouped = defaultdict(list)
    for row in rows:
        grouped[row.customer_id].append(row)
    return [grouped[cid] for cid in customer_ids]     # same length, same order

async def get_context(request) -> dict:
    return {"invoice_loader": DataLoader(load_fn=batch_invoices),   # PER REQUEST
            "user": await current_user(request)}

@strawberry.type
class Customer:
    id: strawberry.ID
    name: str

    @strawberry.field
    async def invoices(self, info) -> list[Invoice]:
        return await info.context["invoice_loader"].load(self.id)
```

51 queries → 2. The loader batches within one tick of the event loop. Two things the interviewer
listens for: the batch function must return results **aligned to the input ids**, and the loader
must be **per request** — a global one caches another user's rows, which is an authz bug.

## Query cost limiting for GraphQL

<!-- difficulty: 4 -->
A client sends a deeply nested query with 1000 aliases. Stop it.

### Solution

```python
from strawberry.extensions import QueryDepthLimiter, MaxTokensLimiter

schema = strawberry.Schema(
    query=Query,
    extensions=[
        QueryDepthLimiter(max_depth=10),
        MaxTokensLimiter(max_token_count=2000),
        CostLimiter(max_cost=1000),     # cost per field × list multipliers
    ],
    config=StrawberryConfig(auto_camel_case=True),
)
# production: disable introspection + GraphiQL, and prefer a persisted-query allow-list
```

Per-endpoint rate limiting does not work for GraphQL — one request can cost anything. You need
**depth limiting** (recursion through cyclic types), **complexity/cost analysis** (fields ×
`first:` multipliers, rejected above a budget), **alias counting** (aliases multiply the same field),
and a **timeout per operation**. The strongest posture is an allow-list of persisted queries.

## Fix the vulnerable endpoint

<!-- difficulty: 4 -->
Name every flaw and rewrite:

```python
@app.get("/users/{user_id}/export")
def export(user_id: str, sort: str = "created_at", db=Depends(get_db)):
    rows = db.execute(f"SELECT * FROM users WHERE id = '{user_id}' ORDER BY {sort}").fetchall()
    return {"rows": [dict(r) for r in rows]}
```

### Solution

Flaws: (1) **SQL injection** via `user_id` and `sort`; (2) no authentication; (3) **BOLA** — any id
is exportable; (4) `SELECT *` returns `password_hash`, PII — excessive data exposure; (5) no
pagination or limit — unbounded response; (6) sort column is unvalidated input; (7) no rate limit on
an expensive export; (8) errors will surface DB detail.

```python
SORTABLE = {"created_at": "created_at", "name": "name"}      # allow-list, not interpolation

@app.get("/api/v1/users/{user_id}/export", response_model=list[UserExport])
async def export(
    user_id: int,                                            # typed: rejects non-numeric
    sort: Literal["created_at", "name"] = "created_at",
    limit: int = Query(100, ge=1, le=1000),
    user: User = Depends(current_user),                      # authn
    _: None = Depends(rate_limit),
    db=Depends(get_db),
):
    if user.id != user_id and "admin" not in user.scopes:    # authz
        raise HTTPException(404, "not found")
    stmt = text(f"SELECT id, name, email, created_at FROM users "   # explicit columns
                f"WHERE id = :uid ORDER BY {SORTABLE[sort]} LIMIT :lim")
    rows = await db.execute(stmt, {"uid": user_id, "lim": limit})   # parameterised
    return rows.mappings().all()
```

Identifiers (table/column names) cannot be bound as parameters — that is exactly why they go through
a dict allow-list. `response_model` guarantees no extra field escapes even if the query changes.

## Test the failure paths

<!-- difficulty: 3 -->
Write the tests a reviewer expects for `POST /api/v1/items`: happy path, validation, duplicate,
auth, and an upstream timeout.

### Solution

```python
@pytest.fixture
def client(fake_repo):
    app.dependency_overrides[get_repo] = lambda: fake_repo
    app.dependency_overrides[current_user] = lambda: User(id=1, scopes=[])
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_creates_item(client):
    r = client.post("/api/v1/items", json={"name": "x", "price_cents": 100})
    assert r.status_code == 201 and r.json()["name"] == "x"

@pytest.mark.parametrize("body,loc", [
    ({"name": "", "price_cents": 1}, "name"),
    ({"name": "x", "price_cents": -1}, "price_cents"),
    ({"name": "x", "price_cents": 1, "is_admin": True}, "is_admin"),   # extra forbidden
])
def test_validation(client, body, loc):
    r = client.post("/api/v1/items", json=body)
    assert r.status_code == 422 and loc in r.text

def test_duplicate_returns_409(client, fake_repo):
    fake_repo.exists = True
    assert client.post("/api/v1/items", json=valid).status_code == 409

def test_requires_auth(unauthenticated_client):
    assert unauthenticated_client.post("/api/v1/items", json=valid).status_code == 401

def test_upstream_timeout_maps_to_503(client, respx_mock):
    respx_mock.get("https://rates").mock(side_effect=httpx.TimeoutException("boom"))
    assert client.post("/api/v1/items", json=valid).status_code == 503
```

`dependency_overrides` replaces the DB and the auth without touching the endpoint code — the reason
to inject everything through `Depends`. Parametrise the validation cases instead of writing five
near-identical tests. **Failure-path coverage is the senior signal.**

## Async without blocking the loop

<!-- difficulty: 3 -->
This endpoint makes the whole service slow under load. Why, and what are the two fixes?

```python
@app.get("/report")
async def report(customer_id: int):
    data = requests.get(f"https://api.vendor.com/{customer_id}").json()   # sync HTTP
    pdf = render_pdf(data)                                                # CPU heavy, 2s
    return {"size": len(pdf)}
```

### Solution

`requests.get` is a blocking socket call and `render_pdf` is CPU-bound; inside `async def` both hold
the **event loop**, so no other request is served during them — one slow call stalls everyone.

```python
@app.get("/report")
async def report(customer_id: int, client: httpx.AsyncClient = Depends(get_client)):
    r = await client.get(f"https://api.vendor.com/{customer_id}", timeout=2.0)   # async I/O
    data = r.json()
    pdf = await run_in_threadpool(render_pdf, data)      # or a real worker queue
    return {"size": len(pdf)}
```

Fixes: async client for I/O; move CPU work off the loop (`run_in_threadpool` /
`asyncio.to_thread`, or a Celery/arq worker returning **202 + status URL** for anything that slow).
Third option: declare the endpoint `def` (not `async def`) and FastAPI runs it in a threadpool —
correct but caps you at the pool size.

## Concurrent fan-out with a bound

<!-- difficulty: 3 -->
Fetch 500 URLs concurrently, at most 20 in flight, with a per-call timeout, collecting failures
instead of aborting everything.

### Solution

```python
async def fetch_all(urls: list[str], concurrency: int = 20) -> tuple[list, list]:
    sem = asyncio.Semaphore(concurrency)

    async def one(url):
        async with sem:
            async with asyncio.timeout(5):
                r = await client.get(url)
                return r.json()

    results = await asyncio.gather(*(one(u) for u in urls), return_exceptions=True)
    ok = [r for r in results if not isinstance(r, Exception)]
    failed = [(u, r) for u, r in zip(urls, results) if isinstance(r, Exception)]
    return ok, failed
```

`Semaphore` bounds concurrency (unbounded `gather` over 500 URLs exhausts sockets and hammers the
upstream). `return_exceptions=True` keeps one failure from cancelling the batch. `asyncio.timeout`
(3.11+) is the per-task deadline; `asyncio.TaskGroup` is the alternative when you *do* want
all-or-nothing cancellation.

## Webhook receiver — verify before you trust

<!-- difficulty: 4 -->
Receive a provider webhook: verify the signature, reject replays, respond fast, process
asynchronously, tolerate duplicates.

### Solution

```python
@app.post("/webhooks/provider", status_code=202)
async def receive(request: Request, background: BackgroundTasks,
                  signature: str = Header(..., alias="X-Signature"),
                  timestamp: str = Header(..., alias="X-Timestamp")):
    raw = await request.body()                                   # verify the RAW bytes
    if abs(time.time() - int(timestamp)) > 300:                  # replay window
        raise HTTPException(400, "stale timestamp")
    expected = hmac.new(settings.webhook_secret.get_secret_value().encode(),
                        f"{timestamp}.".encode() + raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):             # constant time
        raise HTTPException(401, "bad signature")
    event = EventIn.model_validate_json(raw)
    if await repo.seen(event.id):                                # at-least-once delivery
        return {"status": "duplicate"}
    background.add_task(process_event, event)                    # ack fast, work after
    return {"status": "accepted"}
```

Points: verify on **raw bytes** (re-serialising changes them); `compare_digest` prevents timing
attacks; timestamp window blocks replay; providers deliver **at least once**, so dedupe by event id;
return 2xx quickly or the provider retries and backs off; do the real work in a task/queue.
