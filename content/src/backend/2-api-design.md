# Backend Engineer — API Design

## REST principles and resource design
- id: be-api-01
- round: API_DESIGN
- difficulty: easy
- levels:
- tags: REST, HTTP, resource modelling

### Prompt
What makes an API "RESTful"? How do you design good resource URLs and choose HTTP methods?

### Answer
#### What the interviewer is really testing
- Understanding of **REST constraints** beyond "it uses JSON over HTTP".
- Ability to model a domain as **resources** with sensible URLs.
- Correct use of **HTTP methods, status codes and idempotency**.
- Pragmatism: knowing when strict REST doesn't fit and what to do.

#### Key points
- REST (Roy Fielding) constraints include **client–server**, **statelessness**, **cacheability**, **uniform interface**, **layered system** (and optional code-on-demand). In practice, most "REST APIs" focus on resources, HTTP semantics and statelessness.
- Model **nouns as resources** (`/orders`, `/orders/{id}`), not verbs (`/createOrder`).
- **HTTP methods**:
  - `GET` read (safe, idempotent, cacheable).
  - `POST` create / non-idempotent actions.
  - `PUT` full replace (idempotent).
  - `PATCH` partial update (not necessarily idempotent).
  - `DELETE` remove (idempotent).
- Use **plural nouns**, **nesting for clear ownership** (shallow: 1–2 levels), **query parameters** for filtering, sorting and pagination.
- **Stateless**: each request carries everything needed (auth token, parameters).
- For **actions** that don't map cleanly to CRUD, use sub-resources (`POST /orders/{id}/cancellation`) or explicit action endpoints, consistently.

#### Model answer
"A RESTful API models the domain as **resources** identified by URLs, manipulated through a **uniform interface** (standard HTTP methods), with **stateless** requests and **cacheable** responses where appropriate.

**Resource design**, using an online store as an example:
```
GET    /products                      list products (filter, sort, paginate)
GET    /products/{productId}          get one product
POST   /orders                        create an order
GET    /orders/{orderId}              get an order
PATCH  /orders/{orderId}              update mutable fields (e.g. delivery notes)
GET    /customers/{customerId}/orders orders for a customer
POST   /orders/{orderId}/cancellation cancel an order (an action as a sub-resource)
DELETE /carts/{cartId}/items/{itemId} remove an item from a cart
```

**Principles I follow:**
1. **Nouns, not verbs**: `/orders`, not `/getOrders` or `/createOrder`. The HTTP method expresses the action.
2. **Plural collections** and IDs for individual items.
3. **Shallow nesting**: nest only when the child clearly belongs to the parent (`/orders/{id}/items`); avoid deep chains like `/customers/1/orders/2/items/3/reviews`.
4. **Query parameters** for filtering, sorting, pagination and field selection: `GET /orders?status=shipped&sort=-created_at&limit=20&cursor=abc`.
5. **Correct method semantics**:
   - `GET` must never change state.
   - `PUT` and `DELETE` are idempotent: repeating them has the same effect.
   - `POST` isn't idempotent by default, so I support **idempotency keys** for important creates (e.g. payments).
6. **Meaningful status codes**: `201 Created` with a `Location` header for creates, `204 No Content` for deletes, `400/404/409/422` for client errors, `5xx` for server errors.
7. **Consistent naming and formats**: one casing convention (e.g. snake_case or camelCase), ISO 8601 timestamps in UTC, amounts in minor units with currency codes.
8. **Stateless requests**: authentication via tokens in headers, no server-side session state required to interpret a request.
9. **Caching**: `ETag`/`Last-Modified` headers on cacheable `GET`s, `Cache-Control` where appropriate.

**Actions that don't fit CRUD.** For 'cancel order', I prefer modelling it as a resource or state transition (`POST /orders/{id}/cancellation` or `PATCH /orders/{id} {status: 'cancelled'}` with validation), and I keep the chosen style consistent across the API."

#### Another worked example: designing for a library system
"Resources: books, copies, members, loans.
- `GET /books?author=...` searches the catalogue.
- `POST /loans {copy_id, member_id}` borrows a copy (returns 409 if already on loan).
- `POST /loans/{id}/return` marks it returned (or `PATCH /loans/{id} {returned_at}`).
- `GET /members/{id}/loans?status=active` lists current loans.
- Business rules (max loans per member) produce `422 Unprocessable Entity` with a clear error code.

Modelling 'loan' as its own resource, rather than an action on a book, makes history, due dates and returns natural."

#### HTTP methods at a glance
| Method | Purpose | Safe | Idempotent | Typical success code |
|---|---|---|---|---|
| GET | Read | Yes | Yes | 200 |
| POST | Create / action | No | No (unless keyed) | 201 / 200 / 202 |
| PUT | Replace | No | Yes | 200 / 204 |
| PATCH | Partial update | No | Not guaranteed | 200 |
| DELETE | Remove | No | Yes | 204 |

#### A third worked example: fixing an RPC-style API
"An internal API had endpoints like `/getUser`, `/updateUserEmail`, `/deleteUserAddress` and `/listUserOrders`, all using POST.
- **Refactored to resources**: `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}/addresses/{addressId}`, `GET /users/{id}/orders`.
- **Benefits**: GET responses became cacheable, retries of GET/PUT/DELETE became safe by default, and new engineers could guess endpoints without reading docs.
- **Migration**: old endpoints stayed as thin wrappers for one quarter, with logs showing which clients still used them."

#### Step-by-step framework
1. **Identify resources** (nouns) and relationships.
2. **Design URLs**: plural collections, IDs, shallow nesting.
3. **Map operations to methods** with correct semantics.
4. **Define request/response shapes** and conventions.
5. **Choose status codes** and error format.
6. **Add pagination, filtering, caching and idempotency.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "REST means JSON over HTTP" | Explains resources, uniform interface, statelessness |
| `/createOrder`, `/getUserById` | Noun-based resources with HTTP methods |
| `GET` requests that change data | Safe GETs; correct idempotency |
| Always returns 200 | Meaningful status codes |
| Deeply nested URLs | Shallow nesting and query parameters |

#### Useful phrases
- "The URL identifies the resource; the HTTP method expresses the action."
- "GET must be safe, and PUT and DELETE should be idempotent."
- "For actions that don't fit CRUD, I model them as sub-resources or state transitions, consistently."
- "Filtering, sorting and pagination belong in query parameters."

#### Common pitfalls
- **Verbs in URLs.**
- **Using POST for everything.**
- **Ignoring idempotency.**
- **Inconsistent naming** and formats.
- **Leaking database structure** directly into the API.

#### Follow-ups to expect (with sample answers)
- **"What's HATEOAS?"**
  "Hypermedia as the engine of application state: responses include links to related actions. It's part of strict REST, but rarely fully used in practice; I'd include useful links like pagination `next`."
- **"PUT or PATCH for updates?"**
  "PATCH for partial updates (most common), PUT when clients send the full representation and replacement semantics are clear."
- **"How do you design bulk operations?"**
  "A batch endpoint (e.g. `POST /orders/batch`) with per-item results, or asynchronous jobs for large batches."

- **"Should the API mirror the database tables?"**
  "No. Resources should reflect how clients think about the domain; the database can change without breaking clients."
- **"How do you handle very large payloads?"**
  "Support compression, field selection (`?fields=`), pagination, and for files, separate upload/download mechanisms like pre-signed URLs."

#### What senior interviewers look for
- **Consistency** and **API style guides** across teams.
- Designing for **evolution** (backward compatibility).
- Balancing REST purity with **pragmatism** and developer experience.

#### Practise it
1. Design REST endpoints for a hotel booking system (hotels, rooms, bookings, guests).
2. For each endpoint, write the method, URL and success status code.
3. Explain your choices for one non-CRUD action, out loud.

## Design the API for an orders service
- id: be-api-02
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: API design, orders, state machine, idempotency

### Prompt
Design a public API for an orders service that partners use to create, view, update and cancel orders. Walk through the endpoints, payloads and edge cases.

### Answer
#### What the interviewer is really testing
- Translating **business requirements** into a clean API.
- Handling **state transitions**, **validation** and **concurrency**.
- **Idempotency**, **pagination**, **errors**, **versioning** and **security** for a public API.
- Thinking about the **developer experience** of partners.

#### Key points
- Clarify requirements: who calls it, what operations, volumes, order lifecycle.
- Model the order **state machine** and expose transitions safely.
- **Idempotency keys** on create; **optimistic concurrency** (ETags/versions) on update.
- Consistent **error format** with machine-readable codes.
- **Cursor pagination** and filtering for listing.
- **Webhooks** for status changes so partners don't poll.
- Versioning, authentication (OAuth client credentials / API keys), rate limits, documentation.

#### Model answer
"**1. Clarify requirements**
- Partners (e.g. marketplaces) create orders on behalf of customers, check status, update shipping details before dispatch, cancel before shipment, and get notified of status changes.
- Order lifecycle: `pending → confirmed → packed → shipped → delivered`, with `cancelled` possible before `shipped`.

**2. Endpoints**
```
POST   /v1/orders                         create order (Idempotency-Key header required)
GET    /v1/orders/{orderId}               get order
GET    /v1/orders?status=&created_after=&limit=&cursor=   list orders
PATCH  /v1/orders/{orderId}               update shipping address / notes (If-Match required)
POST   /v1/orders/{orderId}/cancel        cancel order
GET    /v1/orders/{orderId}/events        status history
```

**3. Create order**
Request:
```json
POST /v1/orders
Idempotency-Key: 6b1f0c2e-...
{
  "external_reference": "partner-98765",
  "customer": { "name": "Ana Silva", "email": "ana@example.com" },
  "shipping_address": { "line1": "1 High St", "city": "London", "postcode": "N1 1AA", "country": "GB" },
  "items": [ { "sku": "TSHIRT-RED-M", "quantity": 2 } ],
  "currency": "GBP"
}
```
Response `201 Created`, `Location: /v1/orders/ord_123`:
```json
{
  "id": "ord_123",
  "status": "pending",
  "items": [ { "sku": "TSHIRT-RED-M", "quantity": 2, "unit_price": 1500 } ],
  "total": 3000,
  "currency": "GBP",
  "version": 1,
  "created_at": "2026-11-03T10:15:00Z"
}
```
- Retrying with the same `Idempotency-Key` returns the same result without creating a duplicate.
- Prices are calculated server-side (never trusted from the client); amounts in minor units.

**4. Update with concurrency control**
- `GET` returns an `ETag` (or `version`). `PATCH` requires `If-Match: "1"`; if the order changed meanwhile, return `412 Precondition Failed`. This prevents lost updates.
- Only certain fields are editable, and only in certain states (e.g. address editable before `packed`), else `409 Conflict` with code `order_not_editable`.

**5. Cancel**
- `POST /v1/orders/{id}/cancel {"reason": "customer_request"}` → `200` with updated order. If already shipped → `409` with code `order_already_shipped`. Cancelling an already-cancelled order returns `200` with the current state (idempotent).

**6. Listing and pagination**
- Cursor-based pagination: response includes `next_cursor`; stable ordering by `created_at, id`.
- Filters: status, created date range, external reference.

**7. Errors**
Consistent format:
```json
{ "error": { "code": "validation_error", "message": "quantity must be at least 1",
             "details": [ { "field": "items[0].quantity", "issue": "min_value" } ],
             "request_id": "req_abc" } }
```

**8. Webhooks**
- Partners register endpoints for `order.confirmed`, `order.shipped`, etc. Payloads are signed (HMAC), include an event ID for dedup, and are retried with backoff.

**9. Cross-cutting**
- **Auth**: OAuth 2.0 client credentials; each partner sees only their orders.
- **Rate limits** with 429 and headers.
- **Versioning** in the URL (`/v1`); additive changes only within a version.
- **Docs**: OpenAPI spec, examples, sandbox environment."

#### Another worked example: an internal API between services
"For an internal orders API used by other microservices:
- gRPC might be preferred for performance and strong typing.
- Authentication via service identity (mTLS).
- Events published to a message bus replace webhooks.
- The same principles apply: idempotency, concurrency control, clear errors, backward-compatible changes."

#### Edge cases to cover
| Edge case | Handling |
|---|---|
| Duplicate create from retry | Idempotency key returns original result |
| Concurrent updates | ETag / version with If-Match → 412 |
| Invalid transition (cancel after ship) | 409 with specific error code |
| Out-of-stock item | 409/422 with item-level details |
| Partner sends prices | Ignore; calculate server-side |
| Large result sets | Cursor pagination |

#### A third worked example: order amendments after confirmation
"Partners asked to add items after an order was confirmed but before packing.
- Rather than allowing free-form edits, we added `POST /v1/orders/{id}/amendments` with the items to add.
- The amendment is validated (stock, order state), priced server-side, and either applied (new order version, updated total, webhook `order.amended`) or rejected with a clear code.
- Keeping amendments as explicit resources preserved an audit trail and avoided race conditions with the warehouse."

#### Step-by-step framework
1. Clarify consumers, operations and lifecycle.
2. Define resources and endpoints.
3. Specify payloads, IDs, formats (amounts, timestamps).
4. Handle idempotency and concurrency.
5. Define errors and status codes.
6. Add pagination, filtering, webhooks.
7. Cover auth, rate limits, versioning, docs.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Lists CRUD endpoints only | Models the lifecycle and transitions |
| No idempotency | Idempotency keys on create |
| Last write wins silently | Optimistic concurrency with ETags |
| Generic 400 errors | Structured errors with codes and details |
| Partners must poll | Signed webhooks with retries |

#### Useful phrases
- "Create requires an idempotency key, so partner retries are safe."
- "Updates use If-Match, so concurrent edits don't overwrite each other."
- "Prices are always calculated on our side."
- "Status changes are pushed via signed webhooks."

#### Common pitfalls
- **Trusting client-provided prices or totals.**
- **No state validation** on updates.
- **Floating-point money.**
- **Offset pagination** on fast-changing data.
- **No webhook signing.**

#### Follow-ups to expect (with sample answers)
- **"How long do you keep idempotency keys?"**
  "Typically 24 hours to a few days, long enough to cover client retries; store the key with the request hash and response."
- **"What if the same idempotency key is reused with a different body?"**
  "Return an error (e.g. 422), because it indicates a client bug."
- **"How would you support partial fulfilment?"**
  "Model shipments as a sub-resource (`/orders/{id}/shipments`), each with its own items and status."

- **"How would you let partners test safely?"**
  "A sandbox environment with test data, the same API surface, and simulated webhooks for each order state."
- **"How do you expose order totals with tax?"**
  "Return a breakdown: subtotal, tax lines, shipping, discounts and total, all in minor units with currency, calculated server-side."

#### What senior interviewers look for
- **Domain modelling** and lifecycle thinking.
- **Robustness** under retries and concurrency.
- **Partner developer experience** and long-term evolution.

#### Practise it
1. Write the full request and response for creating an order, including headers.
2. List five error codes your API would return and when.
3. Explain the concurrency control flow with ETags, out loud.

## Pagination: offset, cursor and keyset
- id: be-api-03
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: pagination, performance, API design, databases

### Prompt
Your API returns lists of items that can contain millions of records. How do you paginate, and what are the trade-offs between approaches?

### Answer
#### What the interviewer is really testing
- Knowing **offset vs cursor/keyset** pagination and their trade-offs.
- **Database performance** implications (deep offsets).
- **Consistency** issues when data changes during paging.
- Designing a clean **API contract** for pagination.

#### Key points
- **Offset/limit** (`?page=5&limit=20` → `OFFSET 80 LIMIT 20`): simple, supports jumping to pages, but **slow at deep offsets** (database scans and discards rows) and **unstable** when rows are inserted/deleted (duplicates or skipped items).
- **Keyset pagination** (`WHERE (created_at, id) < (:last_created_at, :last_id) ORDER BY created_at DESC, id DESC LIMIT 20`): fast at any depth with an index, stable under inserts. No arbitrary page jumps.
- **Cursor pagination**: an **opaque token** encoding the keyset position (e.g. base64 of `{created_at, id}`), so clients don't depend on internals.
- Always use a **deterministic sort** with a **unique tiebreaker** (e.g. `id`).
- Return `next_cursor` (and optionally `prev_cursor`), and `has_more`. Avoid expensive **total counts** on huge tables (or provide approximate counts).

#### Model answer
"There are two main approaches.

**1. Offset pagination**
```
GET /orders?limit=20&offset=1000
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 1000;
```
- **Pros**: simple to implement and understand; supports 'go to page 50'.
- **Cons**:
  - **Performance**: the database still reads and discards the first 1,000 rows. At offset 1,000,000, queries become very slow.
  - **Consistency**: if new orders are inserted while a user pages, items shift. They may see duplicates or miss items.

Offset is fine for small datasets or admin UIs that need page numbers.

**2. Keyset (cursor) pagination**
```
GET /orders?limit=20&cursor=eyJjIjoiMjAyNi0xMS0wM1QxMDoxNTowMFoiLCJpIjoib3JkXzEyMyJ9

SELECT * FROM orders
WHERE (created_at, id) < ('2026-11-03T10:15:00Z', 'ord_123')
ORDER BY created_at DESC, id DESC
LIMIT 21;   -- fetch one extra to know if there's a next page
```
- The cursor is an **opaque, base64-encoded** token containing the last item's sort values. Clients just pass it back.
- With an index on `(created_at, id)`, each page is an index seek: **fast at any depth**.
- **Stable**: new inserts don't cause duplicates or gaps in the pages already being traversed.
- **Cons**: no jumping to arbitrary pages; cursors are tied to a sort order; slightly more complex.

**Response shape**
```json
{
  "data": [ ... 20 orders ... ],
  "pagination": { "next_cursor": "eyJjIjoi...", "has_more": true }
}
```

**My default**: cursor-based pagination for public APIs and large or fast-changing collections, offset only for small, admin-style lists.

**Other details:**
- **Deterministic sort** with a unique tiebreaker (`id`) so ordering is stable even when timestamps tie.
- **Limit caps** (e.g. max 100) to protect the server.
- **Filters** must be part of the cursor context (or validated), so a cursor isn't reused with different filters.
- **Total counts**: `COUNT(*)` on huge tables is expensive; omit it, cache it, or return an estimate."

#### Another worked example: infinite scroll in a mobile feed
"A feed sorted by newest first uses cursor pagination going backwards in time (`next_cursor` for older items). For pulling new items at the top, the client asks for items *newer* than the first item it has (`?after_cursor=...`). Keyset pagination handles both directions cleanly with the same index."

#### Offset vs cursor
| Aspect | Offset | Cursor / keyset |
|---|---|---|
| Performance at depth | Degrades (scans skipped rows) | Constant (index seek) |
| Stability under inserts | Duplicates/skips possible | Stable |
| Jump to page N | Yes | No |
| Implementation | Simple | Moderate |
| Best for | Small lists, admin UIs | Public APIs, feeds, large tables |

#### A third worked example: exporting millions of rows
"A partner needed to export all 20M historical transactions. Paging through the API at 100 per page would take 200,000 requests.
- We offered an **asynchronous export**: `POST /exports` returns a job ID; a background worker writes the data to compressed files in object storage; `GET /exports/{id}` returns status and download links.
- The regular cursor-paginated API stayed for incremental syncs (`?updated_after=`).
- This protected the database and gave the partner a much faster export."

#### Step-by-step framework
1. Ask about **data size**, change rate and UI needs (page numbers vs infinite scroll).
2. Choose **offset** or **cursor**, explaining trade-offs.
3. Define **sort order** with a unique tiebreaker and a supporting **index**.
4. Design the **response** (data, next_cursor, has_more).
5. Add **limits**, **filters** and **count** strategy.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use page numbers" for millions of rows | Cursor/keyset for large, changing data |
| Ignores performance at depth | Explains offset scan cost |
| Non-deterministic sort | Unique tiebreaker and matching index |
| Exposes raw IDs/timestamps as page params | Opaque cursor tokens |
| Always returns total counts | Avoids expensive counts or estimates |

#### Useful phrases
- "Offset pagination gets slower the deeper you go, because the database still scans the skipped rows."
- "Keyset pagination seeks directly to the next page using an index."
- "Cursors are opaque, so clients don't depend on our internals."
- "I always add a unique tiebreaker to the sort."

#### Common pitfalls
- **Deep offsets** on large tables.
- **Unstable sorting** without a tiebreaker.
- **No index** supporting the sort.
- **Unbounded limits.**
- **Expensive total counts.**

#### Follow-ups to expect (with sample answers)
- **"How do you support 'previous page' with cursors?"**
  "Encode direction in the cursor or provide a `prev_cursor` that queries in the opposite direction, then reverse the results."
- **"What if items are deleted while paging?"**
  "Keyset pagination simply skips them; no duplicates or shifts occur."
- **"How would you paginate search results ranked by relevance?"**
  "Search engines provide their own mechanisms (search-after with sort values, or scroll contexts); deep offset paging in search engines is usually limited."

- **"What's the risk of using timestamps alone as cursors?"**
  "Several rows can share a timestamp, causing duplicates or skipped rows, which is why a unique tiebreaker like the ID is needed."
- **"How do you support syncing changes since last time?"**
  "Provide an `updated_after` filter with keyset pagination on `(updated_at, id)`, or a dedicated change feed."

#### What senior interviewers look for
- **Database-aware** API design.
- **Consistency** reasoning under concurrent changes.
- Clean, **evolvable** pagination contracts.

#### Practise it
1. Write the keyset SQL query for a list sorted by `created_at DESC, id DESC`.
2. Explain why offset 1,000,000 is slow.
3. Design the JSON response for a paginated endpoint, out loud.

## Idempotency keys and safe retries
- id: be-api-04
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: idempotency, retries, reliability, payments

### Prompt
A client calls your "create payment" endpoint, the network times out, and the client retries. How do you make sure the customer isn't charged twice?

### Answer
#### What the interviewer is really testing
- Understanding of **idempotency** and why retries are unavoidable in distributed systems.
- How to **implement idempotency keys** correctly, including concurrency.
- Edge cases: **in-flight duplicates**, **different payloads with the same key**, **expiry**.
- Applying idempotency to **downstream calls** too.

#### Key points
- An operation is **idempotent** if doing it multiple times has the same effect as doing it once.
- Clients send an **Idempotency-Key** (unique per logical operation, e.g. a UUID) with non-idempotent requests like `POST`.
- Server stores `(key, request hash, status, response)`:
  - First request: process and store the response.
  - Repeat with the same key and same body: return the **stored response**.
  - Same key, **different body**: reject (422).
  - **Concurrent duplicate** while the first is in progress: return 409 / "in progress", or wait.
- Store keys with a **unique constraint** and a **TTL** (e.g. 24–72 hours).
- Pass idempotency keys to **downstream providers** as well.

#### Model answer
"Retries are unavoidable: networks time out, clients crash, load balancers drop connections. A timeout doesn't tell the client whether the payment happened. So the server must make retries **safe**.

**Design:**
1. The client generates an **Idempotency-Key** (e.g. a UUID v4) for each logical payment attempt and sends it in a header:
   ```
   POST /v1/payments
   Idempotency-Key: 9f8b4d1e-...
   { "order_id": "ord_123", "amount": 3000, "currency": "GBP", "payment_method": "pm_abc" }
   ```
2. The server has an `idempotency_keys` table:
   ```
   idempotency_keys(key PK, client_id, request_hash, status, response_code, response_body, created_at)
   ```
3. **Processing:**
   - Insert a row with `status = 'IN_PROGRESS'` and the request hash, relying on the **primary key / unique constraint** to detect duplicates atomically.
   - If the insert succeeds → this is the first request → process the payment → store the response and set `status = 'COMPLETED'`.
   - If the insert fails because the key exists:
     - `COMPLETED` and **same hash** → return the stored response (same status code and body).
     - **Different hash** → `422` (key reused with a different request: a client bug).
     - `IN_PROGRESS` → `409 Conflict` ('request in progress, retry later'), or briefly wait and return the result.
4. Keys expire after e.g. **24 hours** (cleanup job).

**Downstream calls.** When our service calls the payment provider, it passes **its own idempotency key** (derived from ours or the payment ID). If our call to the provider times out, retrying with the same key won't double-charge at the provider either.

**Failure during processing.** If the server crashes after charging but before storing the response, the key stays `IN_PROGRESS`. On retry, we must determine the real outcome, e.g. query the provider using our payment ID/idempotency key, rather than charging again. Storing the payment record (with the provider's reference) in the **same transaction** as the key status helps make recovery deterministic.

**Scope.** Keys are scoped per client (API key), so different clients' keys never collide.

**Where else this matters:** order creation, transfers, sending emails, anything where duplicates cause harm."

#### Another worked example: message consumers
"Idempotency also applies to queue consumers. If a consumer processes 'order_shipped' and crashes before acknowledging, the message is redelivered. The consumer records processed event IDs (or uses a natural unique constraint, e.g. one shipment notification per order) so reprocessing has no extra effect."

#### Idempotency decision table
| Situation | Response |
|---|---|
| New key | Process, store result |
| Same key, same body, completed | Return stored response |
| Same key, different body | 422 error |
| Same key, still in progress | 409 (retry later) or wait |
| Key older than TTL | Treated as new (document this) |

#### A third worked example: idempotent transfers between accounts
"For a 'transfer money' endpoint, the idempotency key was stored in the same database transaction as the debit and credit ledger entries.
- If the transaction committed, a retry found the key and returned the stored result.
- If it rolled back (e.g. a crash mid-way), the key wasn't stored, so a retry processed the transfer cleanly.
- Keeping the key and the effect in one transaction made the outcome unambiguous."

#### Step-by-step framework
1. Explain **why retries happen** and why timeouts are ambiguous.
2. Introduce **client-generated idempotency keys**.
3. **Store keys atomically** with request hash and status.
4. Handle **duplicates, mismatches and in-flight requests**.
5. Propagate keys **downstream**.
6. Handle **crash recovery** and **expiry**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Check if a payment exists for the order" (racy) | Unique-constraint-based key storage |
| Ignores concurrent duplicates | Handles in-progress state |
| Same key with different body silently accepted | Rejects mismatched requests |
| Retries downstream with new requests | Propagates idempotency keys downstream |
| No crash recovery thinking | Determines real outcome before retrying |

#### Useful phrases
- "A timeout means the outcome is unknown, so retries must be safe."
- "The unique constraint on the key makes duplicate detection atomic."
- "If the same key arrives with a different body, that's a client bug, so we reject it."
- "We pass our own idempotency key to the payment provider too."

#### Common pitfalls
- **Race conditions** with check-then-insert.
- **Not storing the response**, returning different results on retry.
- **Ignoring in-flight duplicates.**
- **No TTL**, unbounded growth.
- **Forgetting downstream idempotency.**

#### Follow-ups to expect (with sample answers)
- **"Where should the key be generated?"**
  "By the client, per logical operation, so all retries share it. Generating it on the server defeats the purpose."
- **"Can you make POST naturally idempotent without keys?"**
  "Sometimes, using natural unique constraints (e.g. one payment per order ID), but explicit keys are more general."
- **"How long should keys live?"**
  "Long enough to cover realistic retry windows: often 24 hours, sometimes longer for batch systems."

- **"How do you handle idempotency across multiple services?"**
  "Each service stores its own processed-request keys, and the original key (or a derived one) is passed along each hop."
- **"Is GET idempotent? Does it need a key?"**
  "GET should be safe and idempotent by design, so no key is needed."

#### What senior interviewers look for
- **Correctness** under concurrency and crashes.
- **End-to-end** idempotency across services.
- Recognising idempotency as a **system-wide principle**.

#### Practise it
1. Design the `idempotency_keys` table and the processing logic in pseudocode.
2. Walk through a timeout and retry scenario step by step.
3. Explain how you'd recover if the server crashed mid-payment.

## API versioning and backward compatibility
- id: be-api-05
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: versioning, backward compatibility, API evolution

### Prompt
How do you evolve an API used by external clients without breaking them? How do you version it?

### Answer
#### What the interviewer is really testing
- Understanding of **breaking vs non-breaking changes**.
- Knowledge of **versioning strategies** and trade-offs.
- **Deprecation** processes and communication.
- Practical techniques to **avoid** versioning where possible.

#### Key points
- **Non-breaking** (additive) changes: new endpoints, new optional fields, new optional parameters, new enum values (if clients are told to tolerate unknown values).
- **Breaking** changes: removing/renaming fields or endpoints, changing types or meaning, making optional fields required, changing error formats or auth.
- **Clients should be tolerant readers**: ignore unknown fields.
- Versioning strategies: **URL path** (`/v1/`), **header** (`Accept: application/vnd.company.v2+json` or `API-Version: 2026-11-01`), **query parameter**. Date-based versions (Stripe-style) pin each client to the version they started with.
- **Deprecation**: announce, document, `Deprecation`/`Sunset` headers, monitor usage, give generous timelines, contact heavy users.
- Prefer **additive evolution**; version only for genuine breaking changes.

#### Model answer
"My first goal is to **avoid breaking changes** altogether through additive evolution; versioning is for when a breaking change is truly necessary.

**Non-breaking changes** (safe within a version):
- Adding new endpoints.
- Adding new **optional** request fields or query parameters.
- Adding new response fields. Clients must ignore unknown fields, which we document as a contract ('tolerant reader').
- Adding enum values, if we've told clients to handle unknown values gracefully.

**Breaking changes** (need a new version or a careful migration):
- Removing or renaming fields/endpoints.
- Changing a field's type or meaning (e.g. amount from decimal to integer minor units).
- Making an optional field required.
- Changing default behaviour or error formats.

**Versioning strategy.** For a public API, I'd use **URL versioning** (`/v1/orders`) because it's explicit, easy to route and easy for clients to understand. Alternatives:
- **Header-based versions** keep URLs clean and allow finer-grained versions.
- **Date-based versions** (like Stripe): each account is pinned to the API version from when it integrated; changes are applied through transformation layers, and clients upgrade explicitly. Very client-friendly, but more complex to maintain internally.

**Implementation.** Avoid duplicating the whole codebase per version. Keep one core domain model and add **version-specific adapters** (request/response transformers) at the edge.

**Deprecation process:**
1. Announce the change with a clear migration guide and timeline (e.g. 12 months for a public API).
2. Mark deprecated endpoints/fields in docs and add `Deprecation` and `Sunset` response headers.
3. **Monitor usage** per client of old versions/fields.
4. Contact active users directly as the deadline approaches.
5. Optionally run 'brownouts' (temporary planned failures) to surface forgotten integrations before final removal.
6. Remove only when usage is negligible or the deadline passes.

**Example.** We needed to change `amount` from a decimal string (`"30.00"`) to integer minor units (`3000`). Instead of changing it in place, we added `amount_minor` alongside `amount` in v1 (additive), documented `amount` as deprecated, and made `amount_minor` the only field in v2. Clients migrated at their own pace."

#### Another worked example: internal APIs between services
"For internal microservices, versioning is often handled by **expand-and-contract**:
1. **Expand**: add the new field/endpoint while keeping the old.
2. **Migrate** consumers to the new one.
3. **Contract**: remove the old once no consumers use it (verified with logs or contract tests).
Consumer-driven contract tests (e.g. Pact) catch breaking changes before deploy."

#### Versioning strategies compared
| Strategy | Example | Pros | Cons |
|---|---|---|---|
| URL path | `/v1/orders` | Explicit, simple routing | URL changes per version |
| Header | `API-Version: 2` | Clean URLs | Less visible, harder to test in browser |
| Date-based | `API-Version: 2026-11-01` | Per-client pinning, gradual upgrades | Complex internally |
| Query param | `?version=2` | Easy | Easy to forget; caching quirks |

#### A third worked example: renaming an enum value
"We needed to rename the order status `dispatched` to `shipped`.
- **Additive step**: started returning both `status: 'dispatched'` (legacy) and a new field `fulfilment_status: 'shipped'`, documenting the old field as deprecated.
- **Webhooks**: sent both event names for a transition period.
- **Monitoring**: tracked which clients still read the old field (via SDK telemetry and support conversations).
- **Removal** happened only in the next major version, 12 months later, with reminders sent at 6, 3 and 1 months."

#### Step-by-step framework
1. **Prefer additive changes**; establish tolerant-reader rules.
2. **Classify** each change as breaking or non-breaking.
3. **Choose a versioning strategy** for breaking changes.
4. **Implement** with adapters, not code duplication.
5. **Deprecate** with communication, headers, monitoring and timelines.
6. **Remove** only when safe.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Create v2 whenever anything changes" | Additive evolution first |
| Can't distinguish breaking changes | Clear breaking vs non-breaking rules |
| Copy-paste codebase per version | Shared core with version adapters |
| Turn off v1 suddenly | Deprecation process with monitoring and notice |
| Ignores internal consumers | Expand-and-contract and contract tests |

#### Useful phrases
- "Additive changes don't need a new version, as long as clients ignore unknown fields."
- "For a genuinely breaking change, I'd introduce v2 alongside v1."
- "We monitor usage of deprecated endpoints and contact heavy users directly."
- "Expand, migrate, then contract."

#### Common pitfalls
- **Breaking clients unintentionally** (renaming fields, changing types).
- **Too many versions** to maintain.
- **No deprecation communication.**
- **Not monitoring** who uses old versions.
- **Assuming clients tolerate unknown enum values** without documenting it.

#### Follow-ups to expect (with sample answers)
- **"Is adding a required request field breaking?"**
  "Yes. Existing clients won't send it. Make it optional with a sensible default, or introduce it in a new version."
- **"How do you version GraphQL APIs?"**
  "Usually without versions: add fields, deprecate old ones with the `@deprecated` directive, and monitor usage before removal."
- **"How long should you support old versions?"**
  "Depends on the audience: months for internal clients, often 12+ months for public APIs, longer for enterprise customers."

- **"How do SDKs help with versioning?"**
  "Official SDKs can pin a version, hide transformations, and warn developers about deprecated usage at compile time or runtime."
- **"How do you catch accidental breaking changes?"**
  "Automated schema diffing of the OpenAPI spec in CI, plus contract tests with key consumers."

#### What senior interviewers look for
- **API governance** and design review processes.
- Balancing **client stability** with internal agility.
- **Tooling**: schema diffing, contract tests, usage analytics.

#### Practise it
1. Classify ten example changes as breaking or non-breaking.
2. Write a deprecation plan for removing an endpoint.
3. Explain expand-and-contract with an example, out loud.

## REST vs GraphQL vs gRPC
- id: be-api-06
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: REST, GraphQL, gRPC, API styles

### Prompt
When would you choose REST, GraphQL or gRPC for an API? What are the trade-offs?

### Answer
#### What the interviewer is really testing
- Understanding of each **API style's strengths and weaknesses**.
- Matching technology to **consumers and use cases**.
- Awareness of **operational concerns**: caching, performance, tooling, security.

#### Key points
- **REST**: resource-oriented over HTTP; simple, cacheable, widely understood; can lead to **over-fetching/under-fetching** and multiple round trips.
- **GraphQL**: clients query exactly the fields they need in one request, from a typed schema; great for **diverse front-ends**; harder **HTTP caching**, risk of **expensive queries**, needs **N+1 protection** (DataLoader), more complex authorisation.
- **gRPC**: contract-first with **Protocol Buffers**, binary over HTTP/2, **streaming**, generated clients, fast; ideal for **internal service-to-service** calls; limited direct browser support (needs gRPC-Web/proxy), less human-readable.
- Many systems use **more than one**: gRPC internally, REST or GraphQL externally.

#### Model answer
"I'd choose based on who the consumers are and what they need.

**REST**
- **Strengths**: simple, ubiquitous, works with any HTTP client, easy to debug with curl, **HTTP caching** (CDNs, ETags) works naturally, great for public APIs and partners.
- **Weaknesses**: fixed response shapes can **over-fetch** (too much data) or **under-fetch** (needing several calls, e.g. order + customer + items). Evolving many client-specific needs can lead to lots of endpoints.
- **Choose it for**: public/partner APIs, simple CRUD services, cache-heavy read APIs.

**GraphQL**
- **Strengths**: clients request exactly the fields they need in **one round trip**; a strongly typed schema with introspection and great tooling; ideal when **multiple front-ends** (web, iOS, Android) need different data shapes; can aggregate several backend services behind one graph.
- **Weaknesses**:
  - **Caching** is harder (usually POST to one endpoint; needs client-side normalised caches or persisted queries).
  - **Performance risks**: deeply nested or expensive queries need **depth/complexity limits**, and resolvers need batching (**DataLoader**) to avoid N+1 database calls.
  - **Authorisation** must be enforced at field/resolver level.
  - Error handling differs (200 with errors array).
- **Choose it for**: product front-ends with complex, evolving data needs, especially mobile apps where round trips are costly.

**gRPC**
- **Strengths**: **contract-first** with Protobuf; efficient binary encoding; **HTTP/2** multiplexing; **bi-directional streaming**; generated clients in many languages; strong typing and backward-compatible schema evolution rules.
- **Weaknesses**: not natively callable from browsers (needs gRPC-Web or a gateway); harder to inspect manually; less suited to public APIs for third parties.
- **Choose it for**: **internal microservice communication**, low-latency/high-throughput calls, streaming (e.g. real-time updates between services).

**Typical architecture**
```
Web/mobile apps ──► GraphQL or REST gateway (BFF) ──► internal services (gRPC)
Partners ─────────► Public REST API ───────────────►
```

**Example decision.** For a mobile app showing an order screen with order details, items, delivery tracking and recommendations, REST needed four calls. A GraphQL query fetched it in one, cutting screen load time on slow networks. Internally, the GraphQL server called services over gRPC."

#### Another worked example: choosing REST over GraphQL
"For a public webhook-and-orders API for small partners, we chose REST: partners use many languages and low-code tools, docs and curl examples are easy, responses are cacheable, and the data shapes were stable. GraphQL's flexibility wouldn't have justified the learning curve for these consumers."

#### Comparison
| Aspect | REST | GraphQL | gRPC |
|---|---|---|---|
| Data fetching | Fixed per endpoint | Client-specified | Fixed per method |
| Transport | HTTP/1.1+ (JSON) | HTTP (usually POST, JSON) | HTTP/2 (Protobuf binary) |
| Caching | Easy (HTTP) | Harder | App-level |
| Streaming | Limited (SSE/WebSockets separately) | Subscriptions | Built-in |
| Browser support | Native | Native | Needs gRPC-Web/proxy |
| Best for | Public APIs, simple services | Complex front-ends | Internal services, performance |

#### A third worked example: adding streaming between services
"A pricing service needed to push price changes to 20 internal services in near real time.
- **REST polling** created heavy load and delays.
- **gRPC server streaming** let each consumer open a long-lived stream and receive updates as they happened, with backpressure handled by HTTP/2.
- For services not on gRPC, the same updates were also published to a message bus.
- The choice depended on consumers: direct streams for latency-critical services, events for everyone else."

#### Step-by-step framework
1. Identify **consumers** (public, front-end, internal).
2. Consider **data shape variability** and round-trip costs.
3. Consider **performance, streaming, caching** needs.
4. Consider **tooling, skills, operational complexity**.
5. Choose (possibly a combination) and explain trade-offs.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "GraphQL is better than REST" | Matches style to consumers and needs |
| Ignores GraphQL's operational risks | Mentions complexity limits, N+1, caching |
| Uses gRPC for a public partner API | gRPC internally, REST/GraphQL externally |
| No mention of caching | Discusses HTTP caching differences |

#### Useful phrases
- "I'd choose based on who's calling the API and what they need."
- "GraphQL shines when different front-ends need different data shapes."
- "gRPC is great for internal service-to-service calls and streaming."
- "With GraphQL, we'd need query complexity limits and DataLoader to avoid N+1 queries."

#### Common pitfalls
- **Hype-driven choices.**
- **Ignoring caching** implications.
- **Exposing GraphQL without query limits.**
- **Using gRPC where browsers or partners need simple access.**

#### Follow-ups to expect (with sample answers)
- **"What's a Backend for Frontend (BFF)?"**
  "A server-side layer tailored to a specific client (e.g. mobile), aggregating backend calls and shaping responses, often implemented with GraphQL or REST."
- **"How do you secure a GraphQL API?"**
  "Authentication at the gateway, authorisation in resolvers, query depth/complexity limits, persisted queries, and rate limiting by query cost."
- **"How does Protobuf handle schema evolution?"**
  "Fields have numbers; you can add new fields and deprecate old ones without reusing numbers, keeping old and new clients compatible."

- **"What is tRPC or a typed RPC approach?"**
  "Frameworks that share types between client and server (often TypeScript), giving end-to-end type safety for internal web apps without a separate schema language."
- **"Can you mix GraphQL and REST in one product?"**
  "Yes. Commonly GraphQL for the product's own front-ends and REST for public partners, both backed by the same services."

#### What senior interviewers look for
- **Architectural judgement** across the whole system.
- Awareness of **organisational** factors (skills, tooling, governance).
- **Hybrid architectures** where each style fits.

#### Practise it
1. For three scenarios (public partner API, mobile app, internal pricing service), choose a style and justify it.
2. Explain the N+1 problem in GraphQL and how DataLoader solves it.
3. Compare the three styles in a 2-minute spoken answer.
