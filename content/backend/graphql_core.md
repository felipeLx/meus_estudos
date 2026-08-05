# GraphQL — Schema, Resolvers & the Traps

What a backend interview asks about GraphQL: the schema model, N+1, security limits, and when NOT
to use it. Strawberry as the Python reference (Graphene and Ariadne noted).

## The model in one screen

```graphql
type Query {
  customer(id: ID!): Customer
  customers(first: Int = 20, after: String): CustomerConnection!
}

type Mutation {
  createInvoice(input: CreateInvoiceInput!): CreateInvoicePayload!
}

type Customer {
  id: ID!
  name: String!
  email: String
  invoices(first: Int = 10): [Invoice!]!     # nested resolver — where N+1 is born
}

input CreateInvoiceInput { customerId: ID!, amountCents: Int! }
type CreateInvoicePayload { invoice: Invoice, errors: [UserError!]! }
```

- `!` = non-null. `[Invoice!]!` = non-null list of non-null items.
- **Three root types**: `Query` (read), `Mutation` (write, executed serially at the top level),
  `Subscription` (stream over WebSocket/SSE).
- Everything is **one endpoint, POST /graphql**, and (by default) always HTTP **200** — errors live
  in the `errors` array of the body. That single fact breaks naive monitoring and is a favourite
  interview question.
- The schema is the contract; introspection publishes it (disable in production).

## REST vs GraphQL — answer with trade-offs, not preference

| | REST | GraphQL |
|---|---|---|
| Shape | server decides | **client decides** — no over/under-fetching |
| Round trips | several for a screen | one query |
| Caching | HTTP caching for free (GET, ETag, CDN) | needs client-side normalised cache or persisted queries |
| Errors | status codes | 200 + `errors[]` (or partial data) |
| Versioning | `/v1`, `/v2` | evolve the schema, `@deprecated`, no versions |
| File upload, streaming | natural | awkward |
| Rate limiting | per endpoint | must be **cost/complexity based** |
| Observability | per route | one route — needs per-operation instrumentation |

Senior line: *"GraphQL pays off when many clients need different shapes of the same graph — mobile
plus web plus partners. It costs you caching, and it moves rate limiting and monitoring from the
framework into your own code. For a service-to-service API with one consumer, REST is less machinery."*

## Strawberry — a typed Python schema

```python
import strawberry
from strawberry.types import Info

@strawberry.type
class Customer:
    id: strawberry.ID
    name: str

    @strawberry.field
    async def invoices(self, info: Info, first: int = 10) -> list["Invoice"]:
        return await info.context["invoice_loader"].load(self.id)   # batched, see below

@strawberry.type
class Query:
    @strawberry.field
    async def customer(self, info: Info, id: strawberry.ID) -> Customer | None:
        return await info.context["repo"].get(id)

schema = strawberry.Schema(query=Query, mutation=Mutation)
app.include_router(GraphQLRouter(schema, context_getter=get_context), prefix="/graphql")
```

`info.context` carries per-request state: the authenticated user, the DB session, the loaders.
Graphene is the older, class-heavy equivalent; Ariadne is schema-first (SDL + resolver functions).

## The N+1 problem and DataLoader

Query `customers(first: 50) { invoices { id } }` calls the `invoices` resolver **50 times** — one
query per customer, plus the original. That is N+1.

```python
from strawberry.dataloader import DataLoader

async def load_invoices(customer_ids: list[str]) -> list[list[Invoice]]:
    rows = await repo.invoices_for(customer_ids)            # ONE query: WHERE customer_id IN (...)
    by_customer = defaultdict(list)
    for r in rows:
        by_customer[r.customer_id].append(r)
    return [by_customer[cid] for cid in customer_ids]       # must return in the SAME order

# one loader instance PER REQUEST — never global, or you leak data across users
loader = DataLoader(load_fn=load_invoices)
```

Two rules that get checked: the batch function returns results **in the input order and same
length**, and the loader lives **per request** (a process-wide loader caches another user's data —
that is an authorisation bug, not a performance one).

## Security — GraphQL's specific attack surface

- **Depth limiting**: `{ a { b { a { b … } } } }` recursing through a cycle can be an infinite
  query. Cap depth (e.g. 10).
- **Complexity / cost analysis**: assign a cost per field and multiplier per list argument, reject
  above a budget. This replaces per-endpoint rate limiting.
- **Alias amplification**: `q1: user(id:1) q2: user(id:2) … q1000:` bypasses naive per-request
  limits — count aliases in the cost.
- **Disable introspection and GraphiQL in production**; the schema is a map for an attacker.
- **Field-level authorisation**: the client picks the fields, so a permission check on the root
  resolver is not enough. Enforce per field/type (Strawberry permission classes or a directive).
- **Batching endpoint abuse**: an array of operations in one POST multiplies work — cap it.
- **Error leakage**: `errors[].extensions` happily returns tracebacks in dev; mask in production.
- **Timeouts** per resolver and per operation; a deep query holds a DB connection.

## Errors: two schools

1. **Throw** — GraphQL returns `data: null` for that field (or bubbles to the nearest nullable
   parent) and appends to `errors[]`. Right for unexpected failures.
2. **Errors as data** — the mutation payload carries `errors: [UserError!]!` with typed codes and
   field paths. Right for expected, user-facing validation failures, because it stays typed and the
   client cannot forget to handle it.

Partial success is normal: `{ "data": {...}, "errors": [...] }` in the same response. Clients must
handle both halves — say this, it shows you have run GraphQL in production.

## Pagination — Relay connections

```graphql
type CustomerConnection { edges: [CustomerEdge!]!, pageInfo: PageInfo! }
type CustomerEdge { node: Customer!, cursor: String! }
type PageInfo { hasNextPage: Boolean!, endCursor: String }
```

`first`/`after` (or `last`/`before`) with **opaque cursors** — same keyset idea as REST, and the
cursor is an implementation detail the client must not parse.

## Performance and caching

- No HTTP caching by default (POST, one URL). Options: **persisted queries** (client sends a hash,
  server has the whole query — also a security allow-list) with GET so a CDN can cache; response
  caching per resolver; `@cacheControl` hints in a gateway.
- **Query allow-listing** in production is the strongest posture: only queries you shipped can run.
- Watch `p95` per **operation name**, not per route — instrument the execution phase.
- Schema stitching / federation when several services own parts of the graph.

## When to say no

Reject GraphQL for: file uploads and streaming, simple internal service-to-service calls, anything
where HTTP/CDN caching is the main performance lever, and small teams without the budget to build
cost limiting and observability. That answer scores higher than enthusiasm.
