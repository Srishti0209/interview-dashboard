# Full Stack Engineer — System Design

## How a full stack system design interview differs from a backend one
- id: fs-design-01
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: system design, framework, interview technique, end to end

### Prompt
You're interviewing for a full stack role and get "Design a Trello-style board" with 45 minutes. How is this different from a backend system design round, and how do you structure your time?

### Answer
#### What the interviewer is really testing
- Whether you can design a **product end to end**: the UI and its state, the API contract, the data model, and the infrastructure behind it, without disappearing into one layer.
- Whether you **choose depth well**: which seam is the risky one for *this* product (real-time sync, offline, rendering, auth)?
- **User-facing judgement**: loading states, optimistic updates, perceived latency, accessibility. A backend round rarely asks about these.
- **Pragmatism at product scale**: most full stack roles build products for thousands to millions of users, not planet-scale infrastructure. Do you size the design to the problem?
- **Communication**: can you move between "what the user sees" and "what the database does" and keep the interviewer with you?

#### Key points
- A backend round centres on **throughput, storage, partitioning and consistency**. A full stack round adds **the client**: component structure, client state, data fetching, rendering strategy and the UX of failure.
- The **API contract is the centre of the design**. It's where frontend needs and backend constraints meet, so define it early and explicitly.
- Expect to be asked to go deep on **either side**. Prepare one deep dive per layer: one frontend (state, rendering, real-time UI) and one backend (data model, consistency, scaling).
- **Scale estimates still matter**, but they're usually modest. "10k teams, 50 concurrent editors per board" leads to a very different design from "1B users".
- **Cross-cutting concerns** are where full stack candidates stand out: auth flowing from login page to row-level checks, errors flowing from database to toast, caching at every layer.
- Draw **two diagrams**: a component/state diagram for the client and a service/data diagram for the server, joined by the API.

#### Model answer
"The main difference is that the user interface is part of the system I'm designing, not a black box that calls my API. So I budget time for the client, and I treat the API contract as the hinge between the two halves. Here's how I'd split 45 minutes for 'design a Trello-style board'.

**1. Requirements and scope (5–7 minutes).**
- *Functional*: boards, lists, cards; drag cards between lists; comments; members with roles; see other people's changes live.
- *Non-functional*: drag should feel instant (under 100 ms perceived); changes visible to others within about a second; works on a flaky mobile connection; boards up to ~1,000 cards.
- *Scale*: say 1M users, 100k daily active, a busy board has 20 people watching at once.
- *Out of scope for now*: attachments, search, billing.

**2. User journeys and screens (3–5 minutes).**
I sketch the two main screens, board list and board view, and the key interactions: open board, drag card, add comment. This tells me which data each screen needs and which interactions must feel instant.

**3. API and data model (8 minutes).**
```
GET    /boards/:id            → board + lists + cards (one round trip)
POST   /cards                 → create card
PATCH  /cards/:id             → { listId, position, version }
POST   /cards/:id/comments
WS     /boards/:id/events     → card.moved, card.updated, member.joined
```
Tables: `boards`, `lists(board_id, position)`, `cards(list_id, position, version)`, `comments`, `board_members(board_id, user_id, role)`.
For ordering I'd use **fractional positions** (a string or float between neighbours) so moving a card updates one row, not the whole list.

**4. High-level architecture (5 minutes).**
```
Browser (React SPA)                          Server
 ├─ Board page                               ├─ API (REST, auth middleware)
 │   ├─ query cache (TanStack Query)  ──────►│   └─ Postgres
 │   └─ optimistic mutations                 ├─ Realtime gateway (WebSocket)
 └─ WebSocket client  ◄──────────────────────┤   └─ Redis pub/sub (board channels)
                                             └─ CDN for static assets
```

**5. Deep dives (12–15 minutes), one per side.**
- *Client*: a drag applies an **optimistic update** to the cache, sends `PATCH` with the card's `version`, and rolls back with a toast on a conflict. Incoming WebSocket events patch the same cache, so there's one source of truth on the client. I'd ignore events that echo my own change (by mutation id).
- *Server*: `PATCH` checks board membership, then does `UPDATE cards SET ... WHERE id = $1 AND version = $2`. Zero rows updated → `409`. After commit, it publishes `card.moved` to the board's Redis channel, and every gateway instance with subscribers forwards it.

**6. Failure and scale (5 minutes).**
WebSocket drops → client reconnects with backoff and refetches the board (or asks for events since a sequence number). Hot boards → the gateway fans out per board, Redis handles the pub/sub. Database → one Postgres with read replicas is plenty at this scale.

**7. Summary (1–2 minutes).**
I recap the contract, the optimistic-update + version-check approach, and what I'd add next (offline queue, attachments via presigned uploads)."

#### Another worked example: the same structure for "design a URL shortener with an analytics dashboard"
"A backend candidate would spend most of the time on short-code generation and redirect throughput. As a full stack candidate I'd still cover those briefly (base62 counter, cache in front of the redirect, analytics events on a queue), but I'd also design the **dashboard**:
- The analytics API returns **pre-aggregated** series (`GET /links/:id/stats?range=7d&bucket=hour`) rather than raw clicks, so the chart renders quickly.
- The dashboard page is **server-rendered** for a fast first paint, then refreshes every 30 seconds in the background.
- Charts get loading skeletons, empty states ('no clicks yet') and an accessible table fallback.
- The 'create link' form validates the URL on the client for speed and on the server for safety, and shows the new short link optimistically.

Same backend, but the product only feels good because of the client-side decisions."

#### Step-by-step framework
| Step | Time (45 min) | Output |
|---|---|---|
| 1. Requirements | 5–7 min | Features, UX targets (perceived latency, offline), scale, out of scope |
| 2. Journeys & screens | 3–5 min | Key screens and interactions, data each one needs |
| 3. API & data model | ~8 min | Endpoints/events, tables, ordering/versioning choices |
| 4. Architecture | ~5 min | Client diagram + server diagram joined by the API |
| 5. Deep dives | 12–15 min | One client-side and one server-side, with trade-offs |
| 6. Failure & scale | ~5 min | Reconnects, conflicts, hot spots, monitoring |
| 7. Summary | 1–2 min | Recap and next steps |

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Treats the frontend as "a React app calls the API" | Designs client state, data fetching and failure UX |
| Or the reverse: all components, no data model | Balances both sides and joins them with a clear contract |
| Planet-scale infrastructure for 100k users | Sizes the design to the stated scale |
| No loading, error or conflict states | Covers optimistic updates, rollbacks and empty states |
| Auth mentioned once as "JWT" | Traces auth from the login screen to row-level checks |
| One undifferentiated diagram | Client diagram + server diagram + API between them |

#### Useful phrases
- "Let me sketch the two main screens first, because they tell us what the API needs to return."
- "The API contract is the hinge here, so I'll pin that down before the internals."
- "For this interaction the user needs instant feedback, so I'd update optimistically and reconcile."
- "At this scale one Postgres with a replica is enough; I'd revisit if we hit X."
- "Would you like me to go deeper on the client-side sync or on the server-side data model?"

#### Common pitfalls
- **Staying on your comfortable side.** Frontend-leaning candidates skip the data model; backend-leaning ones skip client state. Interviewers notice.
- **Over-fetching or chatty APIs**: ten requests to render one screen.
- **Ignoring perceived performance**: no thought about what the user sees while data loads.
- **Hand-waving real-time**: "we'll use WebSockets" without saying how events reach the right clients or how the client reconciles them.
- **Forgetting auth and permissions** until the end.
- **Running out of time** before failures and scaling.

#### Follow-ups to expect (with sample answers)
- **"How would you render the board page: CSR or SSR?"**
  "It's behind login and highly interactive, so a client-rendered SPA with a fast shell is fine. I'd server-render the public marketing pages and maybe the board's first paint if time-to-content mattered a lot."
- **"Two people move the same card at once. What happens?"**
  "Both clients update optimistically. The server accepts the first `PATCH`; the second gets a `409` because the version changed. That client rolls back, applies the winning event from the WebSocket, and shows a short notice."
- **"How do you keep the API from becoming tailored to one screen?"**
  "I design resource endpoints first, then add one aggregate read endpoint for the heavy screen. If several clients need different shapes, I'd consider a BFF or GraphQL."
- **"What would you monitor?"**
  "Server: API latency and error rates, WebSocket connection counts, Redis lag. Client: Core Web Vitals, JS errors and how often conflicts and rollbacks happen."

#### What senior interviewers look for
- **Choosing the risky seam** without being prompted: "the hard part of this product is sync, so I'll spend my deep dive there."
- **Consistency of the whole system**: the same versioning idea on the client cache, in the API and in the database.
- **Product sense**: knowing which latency the user feels and which they don't.
- At **staff** level: how teams would own the pieces, how the API evolves without breaking mobile clients, cost and build-versus-buy (e.g. a hosted real-time service).

#### Practise it
1. Take three prompts (Trello board, Calendly, an analytics dashboard) and run each against the 7-step framework with a **45-minute timer**, out loud.
2. For each, write down your **one client deep dive and one server deep dive** before you start.
3. Practise drawing the two-diagram layout (client and server joined by the API) in under 3 minutes.
4. Ask a friend to interrupt with "what does the user see while that's happening?" and "what if the network drops?"

## Design a collaborative to-do / project board, end to end
- id: fs-design-02
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: real-time, collaboration, optimistic updates, ordering, websockets

### Prompt
Design a collaborative project board (lists of cards, drag and drop, comments, several people editing at once). Cover the UI state, the API, the data model and how changes reach other users in real time.

### Answer
#### What the interviewer is really testing
- **Ordering**: can you store and update the order of cards without rewriting whole lists?
- **Concurrency**: what happens when two people edit or move the same thing?
- **Real-time delivery**: how events get from one user's action to everyone else's screen, across multiple server instances.
- **Client state design**: one coherent cache that optimistic updates, server responses and pushed events all feed into.
- **Permissions**: who can see and change a board, enforced on the server.

#### Key points
- Use **fractional indexing** (a sortable key between two neighbours, e.g. `"a0"`, `"a0V"`, `"a1"`) so a move updates **one row**. Rebalance keys rarely, in the background.
- Each card carries a **version** (or `updated_at`) for **optimistic concurrency**: updates include the version they were based on; mismatches return `409 Conflict`.
- **Real-time**: write to the database first, then publish an event to a per-board channel (Redis pub/sub or a managed service). WebSocket gateway instances subscribed to that channel push it to connected clients.
- The client uses a **normalised query cache**; optimistic updates, mutation responses and socket events all patch the same entries. Tag mutations with a client id so you can ignore your own echoes.
- On reconnect, **catch up**: refetch the board, or request events after the last sequence number you saw.
- Check **membership on every write and on socket subscribe**.
- Field-level edits (card title vs description) can be merged; **text co-editing inside a description** would need CRDTs or OT, which is usually out of scope.

#### Model answer
"**Requirements.** Boards contain lists, lists contain cards. Users drag cards within and between lists, edit card details, comment, and see collaborators' changes within about a second. Target: 100k daily active users, boards up to ~1,000 cards, up to ~50 people viewing one board. Moves must feel instant.

**Data model (Postgres).**
```sql
boards(id, workspace_id, name, created_at)
board_members(board_id, user_id, role)           -- owner | editor | viewer
lists(id, board_id, name, position text)
cards(id, list_id, board_id, title, description,
      position text, version int, updated_at, updated_by)
comments(id, card_id, author_id, body, created_at)
board_events(board_id, seq bigserial, type, payload jsonb, created_at)
```
`position` is a **fractional index**. Moving card C between A (`'a1'`) and B (`'a2'`) gives C a key like `'a1V'`, one row updated. `board_id` is denormalised onto cards so permission checks and fan-out don't need joins.

**API.**
```
GET   /boards/:id                    board, lists, cards (comments loaded lazily)
POST  /boards/:id/cards              { listId, title, position }
PATCH /cards/:id                     { listId?, position?, title?, version }
POST  /cards/:id/comments            { body }
WS    /realtime?board=:id            server → client events
```
`PATCH` returns `409` with the current card if `version` doesn't match.

**Write path.**
1. Auth middleware resolves the user; the handler checks `board_members` for an editor role.
2. `UPDATE cards SET list_id=$, position=$, version=version+1 WHERE id=$ AND version=$ RETURNING *`. Zero rows → `409`.
3. In the same transaction, insert into `board_events` (gives a per-board sequence number).
4. After commit, publish `{seq, type:'card.moved', card, clientMutationId}` to Redis channel `board:{id}`.

**Real-time fan-out.**
```
Client A ──PATCH──► API ──► Postgres
                     └──publish──► Redis board:42 ──► Gateway 1 ──► Clients B, C
                                                 └──► Gateway 2 ──► Client D
```
Gateways are stateless WebSocket servers; each subscribes to Redis channels for the boards its clients have open. On subscribe they check membership.

**Client.**
- The board query is cached under `['board', id]`, normalised so cards can be patched individually.
- **Drag**: compute the new position from neighbours, update the cache immediately, send `PATCH` with the card's version and a `clientMutationId`. On success, store the new version. On `409`, roll back to the server's card and show 'Someone else moved this card.'
- **Socket event**: if `clientMutationId` is mine, ignore it. Otherwise patch the cache. Track `lastSeq`; if an event arrives with a gap, refetch.
- **Reconnect**: exponential backoff with jitter, then `GET /boards/:id/events?after=lastSeq`, or a full refetch if too far behind.

**Scale.** 100k DAU is comfortable on one Postgres primary plus a read replica. The gateway layer scales horizontally; Redis pub/sub handles thousands of channels. `board_events` is pruned after a few days."

#### Another worked example: rebalancing fractional keys
"Fractional keys get longer if people keep inserting between the same two cards. For example, after many inserts at the top of a list you might see keys like `'a0000V'`. I'd handle it with a background job: when any key in a list exceeds, say, 20 characters, the job reassigns evenly spaced keys to the whole list in one transaction, bumps every card's version, and publishes a single `list.reordered` event. Clients replace that list's order in their cache. This happens rarely, so the common path stays a one-row update."

#### Step-by-step framework
1. **Scope**: entities, interactions, latency targets, scale.
2. **Model ordering** explicitly (fractional index vs integer positions).
3. **Define concurrency control** (version per card, `409` on conflict).
4. **Design the API** around the screens (one aggregate read, granular writes).
5. **Design fan-out**: database commit → pub/sub → gateway → client.
6. **Design client state**: one cache; optimistic updates; echo suppression; catch-up on reconnect.
7. **Permissions** at write time and subscribe time.
8. **Failure and scale**: reconnects, gaps, hot boards, pruning.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Integer positions, renumbering the whole list on each move | Fractional keys, one-row update, occasional rebalance |
| Last write wins silently | Version checks with `409` and clear rollback UX |
| "WebSockets" with no fan-out design | Commit → pub/sub → stateless gateways → clients |
| Separate client stores for socket data and fetched data | One normalised cache patched by all sources |
| Ignores reconnects | Sequence numbers, catch-up or refetch |
| Permissions only in the UI | Checks on every write and every subscription |

#### Useful phrases
- "I'll use fractional indexing so a move only touches one row."
- "Every write carries the version it was based on, so we detect conflicts instead of losing edits."
- "We commit first, then publish. The database is the source of truth; the socket is a notification."
- "The client ignores echoes of its own mutations using a client mutation id."
- "If the client sees a gap in sequence numbers, it refetches rather than guessing."

#### Common pitfalls
- **Publishing before the commit**, so other clients see changes that then roll back.
- **Relying on socket delivery being reliable.** Messages get lost on reconnect; you need catch-up.
- **Echo bugs**: your own change arriving back and causing a flicker or double-apply.
- **Sticky sessions as the whole scaling story** without pub/sub between instances.
- **Over-reaching for CRDTs** when field-level last-write-wins with versions is enough for cards.
- **Leaking board events** to users who were removed from the board (re-check on subscribe and drop subscriptions on removal).

#### Follow-ups to expect (with sample answers)
- **"How would you support offline edits?"**
  "Queue mutations locally (IndexedDB) with their base versions, apply them optimistically, and replay on reconnect. Conflicts come back as `409`s, which I'd resolve per field or surface to the user."
- **"Why not send changes over the WebSocket instead of REST?"**
  "That's possible, but REST gives me standard auth, retries, idempotency and logging. Using the socket for server-to-client only keeps the gateway simple. At very high interaction rates I might move writes onto the socket."
- **"How do you show who else is viewing?"**
  "Presence is ephemeral, so it doesn't go in Postgres. Gateways track connections per board in Redis with a short TTL and broadcast join/leave events."
- **"What about very large boards?"**
  "Load lists and the first N cards per list, virtualise rendering, and lazy-load the rest as the user scrolls a list."

#### What senior interviewers look for
- Recognising that **ordering and concurrency** are the heart of the problem.
- A **coherent consistency story** from the database version column to the client's rollback UX.
- Operational awareness: event pruning, gateway connection limits, deploys that drop sockets gracefully.
- Knowing when **not** to use CRDTs, and when you would (rich-text co-editing).

#### Practise it
1. Implement fractional indexing in 30 lines: a function `keyBetween(a, b)` that returns a string sorting between two keys.
2. Write the `PATCH /cards/:id` handler with the version check and event insert in one transaction.
3. Whiteboard the fan-out diagram from memory, including two gateway instances.
4. Explain to a friend, in two minutes, what happens on the client when a `409` comes back.

## Design a SaaS analytics dashboard, end to end
- id: fs-design-03
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: analytics, dashboards, aggregation, caching, charts, OLAP

### Prompt
Design a customer-facing analytics dashboard for a SaaS product: customers see charts of their usage (events over time, top pages, conversion funnels) with date-range filters. Cover ingestion, storage, the query API and the frontend.

### Answer
#### What the interviewer is really testing
- Do you separate **ingestion (write-heavy, append-only)** from **querying (read-heavy, aggregate)**?
- Do you know why the transactional database is the wrong place for analytical queries, and what to use instead (pre-aggregation, columnar stores)?
- **Multi-tenancy**: one customer must never see another's numbers, and one big customer shouldn't slow down everyone else.
- **Frontend data visualisation**: loading, empty and error states; time zones; accessibility; not shipping a million points to the browser.
- **Freshness vs cost** trade-offs: real-time is expensive; is "within 5 minutes" OK?

#### Key points
- **Ingestion**: SDK/beacon → collector endpoint → queue (Kafka, Kinesis, SQS) → workers that validate, enrich and write to the analytics store. The collector returns `202` fast and never does heavy work.
- **Storage**: raw events in a **columnar** store (ClickHouse, BigQuery, Druid, or Postgres with TimescaleDB at smaller scale), partitioned by **tenant and date**. Plus **rollup tables** (per tenant, per hour/day, per metric) for the common charts.
- **Query API** accepts a small, validated **query description** (metric, filters, range, bucket), not raw SQL. Always scoped by `tenant_id` from the auth token.
- **Caching**: cache query results keyed by tenant + normalised query; short TTL for ranges including "today", long TTL for closed past ranges.
- **Frontend**: server returns already-bucketed series (~100–500 points per chart). Charts lazy-load, show skeletons, handle empty data, and offer a table view for accessibility and export.
- **Time zones**: buckets must be computed in the **customer's time zone**, not UTC, or "daily" charts look wrong.

#### Model answer
"**Requirements.** Customers send product events (page views, clicks, sign-ups). The dashboard shows: events over time, top pages, a funnel, with date ranges up to 13 months and filters (country, device). Data should be fresh within ~5 minutes. Scale: 2,000 tenants, 500M events/day total, largest tenant 20% of volume. Dashboard loads in under 2 seconds.

**Ingestion.**
```
JS SDK / server SDK ──► Collector (stateless, POST /v1/events, returns 202)
                           └──► Kafka (partitioned by tenant_id)
                                  └──► Enrichment workers (geo-IP, UA parsing, validation)
                                         └──► ClickHouse events table
```
500M/day ≈ 6k events/sec average, maybe 30k/sec at peak. The collector batches and authenticates with a per-tenant write key, enforces per-tenant rate limits, and drops malformed events into a dead-letter topic.

**Storage.**
```sql
events(tenant_id, ts, event_name, user_id, page, country, device, props)
  ENGINE = MergeTree PARTITION BY toYYYYMM(ts) ORDER BY (tenant_id, event_name, ts)

events_hourly(tenant_id, hour, event_name, country, device, count, uniq_users_state)
  -- materialised view, updated on insert
```
Ordering by `tenant_id` first means every tenant's query reads only its own data blocks. The hourly rollup answers most charts in milliseconds; the raw table handles funnels and ad-hoc filters.

**Query API.**
```
POST /api/analytics/query
{ "metric": "events", "event": "signup", "range": {"from": "2026-10-01", "to": "2026-10-31"},
  "bucket": "day", "filters": {"country": ["GB"]}, "tz": "Europe/London" }
→ { "series": [{"t": "2026-10-01", "v": 182}, ...], "freshAsOf": "..." }
```
The server **validates** against an allow-list of metrics, filters and buckets, injects `tenant_id` from the session, and compiles to SQL with parameters. Queries get a timeout and per-tenant concurrency limits so one heavy customer can't starve others.

**Caching.** Redis key = `hash(tenant, normalised query)`. TTL: 60 seconds if the range includes today; 24 hours for closed ranges. The response includes `freshAsOf` so the UI can say 'Updated 2 minutes ago'.

**Frontend.**
- The dashboard page renders a **shell immediately** (layout, filters from the URL), then each chart fetches independently, so one slow chart doesn't block the rest.
- Filters live in the **URL query string**: shareable links, back button works.
- Charts receive ready-bucketed data, at most a few hundred points. Hovering shows tooltips; there's a 'View as table' toggle for screen readers and CSV export.
- States: skeleton while loading, 'No events in this range' empty state with a hint, an inline error with Retry per chart.
- Date-range changes are **debounced**, and in-flight requests for the old range are cancelled (AbortController) to avoid race conditions."

#### Another worked example: building the funnel
"A funnel (visited pricing → started trial → paid) can't come from simple rollups, because it needs per-user ordering. I'd run it against the raw table using ClickHouse's `windowFunnel` (or, in Postgres, a query that finds each user's first timestamp for each step and checks the order). It's expensive, so:
- Limit funnel ranges to 90 days by default.
- Cache results for the closed part of the range.
- Run large-tenant funnels **asynchronously**: the API returns `202` with a job id, the UI shows 'Calculating…' and polls (or gets an SSE update). The chart appears when it's ready.
That keeps the dashboard responsive even for the biggest customer."

#### Step-by-step framework
1. **Requirements**: metrics, ranges, filters, freshness, scale, tenants.
2. **Ingestion path**: collector → queue → workers → store; rate limits and dead letters.
3. **Storage**: columnar raw events + rollups; partition and order by tenant and time.
4. **Query API**: validated query DSL, tenant injection, timeouts, concurrency limits.
5. **Caching** keyed by tenant + query, TTL by freshness.
6. **Frontend**: independent chart loading, URL state, states, accessibility, cancellation.
7. **Heavy queries**: async jobs for funnels and long ranges.
8. **Operations**: ingestion lag, query latency per tenant, storage cost.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `SELECT COUNT(*) ... GROUP BY` on the production Postgres | Separate analytics store with rollups |
| Frontend downloads raw events and aggregates in JS | Server returns bucketed series of a few hundred points |
| Accepts raw SQL or arbitrary filters | Allow-listed query DSL, tenant from the token |
| Ignores time zones | Buckets in the customer's time zone |
| Whole page waits for every chart | Each chart loads and fails independently |
| Real-time everything | Explicit freshness target with `freshAsOf` shown |

#### Useful phrases
- "Writes and reads have completely different shapes here, so I'd separate them."
- "Most charts can be answered from hourly rollups; the raw table is for funnels and ad-hoc filters."
- "The tenant id comes from the session, never from the request body."
- "Past ranges never change, so we can cache them for a long time."
- "Each chart owns its loading and error state, so one slow query doesn't block the page."

#### Common pitfalls
- **Running analytics on the OLTP database** and slowing down the product itself.
- **Noisy neighbours**: no per-tenant limits, so one customer's 13-month funnel takes down everyone's dashboard.
- **UTC-only buckets**, so a London customer's 'Monday' starts at 1 am in summer.
- **Unbounded cardinality**: letting customers group by user id or arbitrary properties.
- **Race conditions** in the UI when filters change quickly.
- **No freshness indicator**, so customers think the data is broken when it's just delayed.

#### Follow-ups to expect (with sample answers)
- **"Would you use Postgres at all?"**
  "At smaller scale, yes: Postgres with TimescaleDB or partitioned tables and materialised rollups handles tens of millions of events a day. I'd move to ClickHouse or BigQuery when query latency or storage cost demanded it."
- **"How do you count unique users across days?"**
  "Exact distinct counts don't add up across buckets, so I'd store HyperLogLog sketches in the rollups and merge them; ~1% error is fine for a dashboard."
- **"How do you handle late-arriving events?"**
  "Rollups are updated on insert, so late events still land in the right bucket. I'd invalidate cached results for recent ranges and accept that the last hour can still move."
- **"How do you test this?"**
  "Unit-test the query compiler (tenant always injected), golden-data tests for rollups, visual regression tests for charts, and synthetic load on ingestion."

#### What senior interviewers look for
- Clear **OLTP vs OLAP separation** with a reason, not a buzzword.
- **Tenant isolation and fairness** designed in, not bolted on.
- Respect for **cost**: storage tiers, retention policies, rollups instead of brute force.
- A frontend that's **honest about freshness** and degrades gracefully.

#### Practise it
1. Sketch the ingestion pipeline and label the throughput at each stage.
2. Write the query DSL validator: allowed metrics, buckets and filters, and tenant injection.
3. Build a small React chart page with URL-driven filters, AbortController cancellation and an empty state.
4. Explain to a friend why exact distinct counts don't sum across days, and how HyperLogLog helps.

## Design a real-time comments and presence feature
- id: fs-design-04
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: real-time, websockets, SSE, presence, comments, pub/sub

### Prompt
Design live comments with presence for a document or video page: users see new comments appear without refreshing, see who else is viewing, and see "X is typing…". Cover transport choice, backend fan-out, storage and the client.

### Answer
#### What the interviewer is really testing
- Choosing a **transport** (WebSocket, SSE, long polling) with reasons, not by default.
- Separating **durable data** (comments) from **ephemeral data** (presence, typing).
- **Fan-out across server instances** and handling reconnects without losing messages.
- **Client UX**: optimistic posting, ordering, scroll behaviour, not spamming the user with every typing event.
- **Abuse and scale**: rate limits, moderation hooks, very popular pages.

#### Key points
- **Comments are durable**: write through the API to the database, then publish an event. **Presence and typing are ephemeral**: keep them in memory/Redis with TTLs; never in the main database.
- **Transport**: SSE is enough if the client only receives events and posts via HTTP; WebSockets suit bi-directional, high-frequency signals like typing and cursors. Both need reconnect logic.
- **Fan-out**: per-page channel in Redis pub/sub (or a managed service such as Ably, Pusher, Supabase Realtime). Gateways subscribe to channels for pages their clients are watching.
- **Presence** = a set of `(user, connectionId)` per page with heartbeats; a user is present while at least one connection is alive. Expire entries if heartbeats stop.
- **Typing indicators**: throttle to one event every 2–3 seconds, auto-expire after ~5 seconds, never persist.
- **Ordering and catch-up**: server-assigned ids/timestamps; on reconnect fetch comments `after` the last id seen.

#### Model answer
"**Requirements.** On a document page: comments appear live for everyone viewing; avatars of current viewers; 'Alex is typing…'. Comments are permanent, presence isn't. Scale: 1M pages, most with 1–5 viewers, a few viral pages with 10k viewers.

**Transport.** I'd use **WebSockets**, because typing indicators and presence heartbeats go from client to server frequently. If it were only 'new comments appear', I'd pick **SSE**: simpler, works over plain HTTP, automatic reconnect with `Last-Event-ID`.

**Data model.**
```sql
comments(id bigserial, page_id, author_id, body, parent_id, created_at, deleted_at)
-- index (page_id, id)
```
Presence lives in Redis: `presence:page:{id}` as a hash of `connectionId → {userId, name, lastSeen}` with entries cleaned up when stale.

**Flows.**
*Posting a comment*
1. Client shows the comment immediately as 'sending' (optimistic) with a temporary id.
2. `POST /pages/:id/comments` → validate, rate-limit (e.g. 5/min/user), sanitise, insert.
3. After commit, publish `comment.created` (with the client's temp id) to `page:{id}`.
4. All gateways subscribed to that channel push it. The author's client swaps the temp comment for the real one.

*Presence*
1. On socket connect with `pageId`, the gateway authorises access, adds the connection to the presence hash, publishes `presence.join` if this is the user's first connection.
2. The client sends a heartbeat every 20 seconds; the gateway updates `lastSeen`.
3. On disconnect, or when a sweeper finds `lastSeen` older than 60 seconds, remove the connection; if it was the user's last one, publish `presence.leave`.

*Typing*
Client sends `typing` at most every 3 seconds while the input changes. The gateway relays it to the channel without storing anything. Receivers show the indicator and hide it after 5 seconds without a new event.

**Architecture.**
```
Browser ──WS──► Gateway (N instances) ◄──► Redis (pub/sub + presence hashes)
   └──HTTP──► API ──► Postgres
                └──publish──► Redis
```

**Client.**
- Load the latest 50 comments over HTTP, then open the socket. Remember the highest comment id.
- New comments: if the user is scrolled to the bottom, append and auto-scroll; otherwise show a '3 new comments' pill.
- On reconnect: `GET /pages/:id/comments?after=lastId` to fill the gap, then resume.
- Presence avatars are de-duplicated per user (one person, three tabs = one avatar).

**Viral pages.** 10k viewers on one page means one comment fans out to 10k sockets; that's fine across gateways, but typing and presence events would be noisy. Above a threshold I'd **degrade**: show a viewer **count** instead of avatars, drop typing indicators, and batch comment events every second."

#### Another worked example: building it with SSE instead
"If the product only needs comments and a viewer count:
- `GET /pages/:id/stream` returns `text/event-stream`. Each comment is sent as `id: 1234\nevent: comment\ndata: {...}`.
- If the connection drops, the browser's `EventSource` reconnects automatically and sends `Last-Event-ID: 1234`; the server replays comments after 1234 from the database.
- Viewer count: the server tracks open streams per page in Redis and sends a `viewers` event every 10 seconds.
- Posting is a normal `POST`.
This is less code, passes through corporate proxies more easily, and works with HTTP/2 multiplexing. The catch is the one-way channel: anything frequent from the client (typing) becomes many small POSTs."

#### Step-by-step framework
1. **Classify data**: durable (comments) vs ephemeral (presence, typing).
2. **Choose transport** from the direction and frequency of messages.
3. **Durable path**: API → DB → publish after commit.
4. **Ephemeral path**: gateway ↔ Redis with TTLs and heartbeats.
5. **Fan-out** via per-page channels across gateway instances.
6. **Client**: initial HTTP load, socket, optimistic posts, catch-up on reconnect, scroll behaviour.
7. **Abuse and scale**: rate limits, sanitising, degrading on hot pages.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Stores presence and typing in Postgres | Ephemeral data in Redis with TTLs |
| WebSockets "because real-time" | Picks WebSocket or SSE based on message direction |
| Messages lost on reconnect | Catch-up by last id / `Last-Event-ID` |
| One user with three tabs shows three times | Presence by user, tracked per connection |
| Typing event on every keystroke | Throttled, auto-expiring typing signals |
| Same behaviour at 5 and 10k viewers | Degrades gracefully on hot pages |

#### Useful phrases
- "Comments are durable, presence is ephemeral, so they take different paths."
- "If the client only listens, SSE is simpler; typing pushes me towards WebSockets."
- "The socket is a notification channel; the database is the source of truth."
- "On reconnect the client asks for everything after the last id it saw."
- "For very popular pages I'd switch from avatars to a count and drop typing indicators."

#### Common pitfalls
- **Presence that never clears** because disconnects aren't always clean (mobile, sleep). Heartbeats and expiry fix it.
- **Unsanitised comment HTML** leading to stored XSS.
- **Auto-scrolling users away** from what they're reading.
- **Assuming sticky sessions solve fan-out**: users on different instances still need pub/sub.
- **No rate limits**, so a bot floods a page.

#### Follow-ups to expect (with sample answers)
- **"How do you handle a deploy that restarts gateways?"**
  "Gateways drain: stop accepting new connections, send a 'reconnect' message, close sockets gradually. Clients reconnect with jittered backoff to another instance and catch up by last id."
- **"How would you add notifications for replies?"**
  "On reply, enqueue a job that notifies the parent comment's author: in-app via their user channel if they're online, otherwise email after a delay, de-duplicated."
- **"Would you build this or buy it?"**
  "For a small team I'd seriously consider a managed real-time service; the hard parts are connection management and scaling. I'd keep comments in our own database either way."
- **"How do you moderate?"**
  "Run new comments through a moderation check (keyword rules or a classifier) asynchronously; flagged ones are hidden pending review and a `comment.hidden` event removes them from clients."

#### What senior interviewers look for
- Clean **separation of durable and ephemeral** state.
- **Graceful degradation** plans for hot spots.
- Realistic **connection lifecycle** handling: heartbeats, drains, reconnect storms.
- Willingness to **buy** commodity infrastructure when it's not the product's core.

#### Practise it
1. Build a tiny SSE endpoint that replays from `Last-Event-ID`, and kill the connection to watch it recover.
2. Implement presence with Redis hashes, heartbeats and a sweeper; open three tabs and close one.
3. Write the client logic for 'append and scroll if at bottom, otherwise show a new-comments pill'.
4. Explain to a friend when you'd choose SSE over WebSockets, in under a minute.

## Design an image upload, processing and gallery feature
- id: fs-design-05
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: file upload, presigned URLs, object storage, image processing, CDN, queues

### Prompt
Design a feature where users upload photos, the system generates thumbnails and optimised versions, and a gallery page displays them quickly. Cover the upload flow, processing, storage, delivery and the UI.

### Answer
#### What the interviewer is really testing
- Do you keep large files **off your application servers** (direct-to-storage uploads with presigned URLs)?
- **Asynchronous processing** with queues, and how the UI learns that processing finished.
- **Delivery performance**: CDN, responsive images, modern formats, lazy loading.
- **Security**: validating file types and sizes, stripping metadata, private vs public images.
- **Failure handling**: interrupted uploads, processing errors, orphaned files.

#### Key points
- Flow: client asks the API for a **presigned upload URL** → uploads **directly to object storage** (S3, GCS, R2) → storage event or client callback triggers **processing** → worker writes variants → database row marked `ready`.
- Create the **database record first** (status `pending`) so you can track, retry and clean up.
- Variants: thumbnail (e.g. 200px), medium (800px), large (1600px), in **WebP/AVIF** with a JPEG fallback. Strip EXIF (GPS!) and fix orientation.
- Serve through a **CDN** with long cache lifetimes; use content-hashed or versioned keys so you never need to purge.
- Frontend: `<img srcset sizes>` or `<picture>`, `loading="lazy"`, fixed aspect ratio (no layout shift), a blurred placeholder or dominant colour while loading.
- Large files: **multipart/resumable uploads**. Enforce size limits in the presigned policy, not just in the UI.

#### Model answer
"**Requirements.** Users upload up to 20 photos at once, each up to 25 MB. The gallery shows a grid of thumbnails; clicking opens a large view. Photos are private to the owner unless shared. Scale: 1M uploads/day, gallery loads in under 1.5 seconds.

**Upload flow.**
```
1. Client → API: POST /photos { filename, contentType, size }
   API: validate type/size, insert photos(id, owner, status='pending', key)
        return { photoId, uploadUrl (presigned PUT, 15 min, size + type locked) }
2. Client → S3: PUT uploadUrl (file bytes, progress via XHR/fetch upload events)
3. S3 → event notification → queue (SQS) → image worker
4. Worker: download original, verify it really is an image (magic bytes),
   strip EXIF, auto-rotate, generate variants (thumb/medium/large × AVIF/WebP/JPEG),
   upload to s3://photos/{owner}/{photoId}/{variant}.{ext}
   update photos set status='ready', width, height, blurhash
   publish photo.ready to the user's channel
```
The app servers never handle the bytes, so a burst of uploads doesn't tie them up.

**Data model.**
```sql
photos(id, owner_id, status pending|ready|failed, original_key,
       width, height, blurhash, created_at, visibility private|shared)
```

**Delivery.**
- Variants are served through a **CDN**. Private photos use **signed CDN URLs** (or signed cookies) valid for an hour; shared photos can be public.
- Keys include the photo id and variant and never change, so `Cache-Control: public, max-age=31536000, immutable` is safe.
- The gallery API returns, per photo, the variant URLs, width/height and the blurhash:
```
GET /photos?cursor=...&limit=60
→ [{ id, w, h, blurhash, src: { thumb: {avif, webp, jpg}, medium: {...} } }]
```

**Frontend.**
- **Uploader**: drag-and-drop or picker; client-side checks (type, size) for fast feedback; uploads 3 at a time with progress bars; retry per file; cancel via AbortController. Each tile shows 'Processing…' after the upload until `photo.ready` arrives (or polling `GET /photos/:id` every 2 seconds as a fallback).
- **Gallery**: CSS grid; each tile has a fixed aspect ratio from `w`/`h` so nothing shifts; the blurhash renders as a placeholder; `<picture>` with AVIF → WebP → JPEG sources and `srcset` for density; `loading="lazy"` below the fold; infinite scroll with a cursor.
- **Lightbox**: loads the `medium` variant, then `large` on zoom; keyboard navigation and focus management.

**Failures.**
- Upload interrupted: the row stays `pending`; a nightly job deletes pending rows and objects older than 24 hours.
- Processing fails (corrupt file): mark `failed` with a reason; the UI shows 'Couldn't process this photo' with a delete option. The queue retries transient errors and moves poison messages to a dead-letter queue."

#### Another worked example: resumable uploads for 2 GB videos
"For very large files I'd switch to **multipart upload**. The API starts a multipart upload and returns presigned URLs for each 10 MB part. The client uploads parts in parallel (3–4 at a time) and records completed part numbers (ETags) in IndexedDB. If the tab closes, it resumes by asking the API which parts already exist and uploads only the missing ones. When everything is uploaded, the client calls `POST /uploads/:id/complete` with the part list. Processing then runs as a longer job (transcoding) with progress events. The tus protocol is an off-the-shelf alternative if I want a standard resumable protocol."

#### Step-by-step framework
1. **Requirements**: file sizes, counts, privacy, variants, scale.
2. **Record first** (pending), then **presigned direct upload**.
3. **Processing** off a queue triggered by the storage event; idempotent worker.
4. **Variants and formats**; strip metadata; record dimensions and a placeholder.
5. **Delivery** via CDN with immutable keys; signed URLs for private content.
6. **UI**: upload progress, processing state, responsive images, no layout shift, lazy loading.
7. **Failures and cleanup**: retries, dead letters, orphan sweeps.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Uploads go through the API server as multipart form data | Presigned direct-to-storage uploads |
| Thumbnails generated during the upload request | Async processing from a queue |
| Serves originals and scales them with CSS | Multiple variants, modern formats, `srcset` |
| Trusts the file extension | Checks magic bytes, size limits in the presigned policy |
| Leaves GPS EXIF data in public images | Strips metadata |
| No placeholder; grid jumps as images load | Fixed aspect ratios and blurhash placeholders |

#### Useful phrases
- "The bytes should never touch our app servers: the client uploads straight to storage with a presigned URL."
- "I create the row first, so every upload is trackable and cleanable."
- "Processing is asynchronous and idempotent; the UI shows 'Processing' until a ready event."
- "Variant keys never change, so the CDN can cache them forever."
- "Width and height come back with the list, so the grid never shifts."

#### Common pitfalls
- **Proxying uploads through the API**, which exhausts memory and connections.
- **Presigned URLs without size or content-type conditions**, letting someone upload a 5 GB file.
- **Non-idempotent workers** that create duplicate variants on retry.
- **Public buckets for private photos.**
- **Forgetting orphan cleanup**, so storage costs grow forever.
- **Loading full-size images in a grid** on mobile data.

#### Follow-ups to expect (with sample answers)
- **"How would you resize images on demand instead of pre-generating?"**
  "Use an image CDN or a resizing function behind the CDN (`/img/{id}?w=400&fmt=avif`), cached after the first request. It's flexible but the first request is slow, and you must restrict allowed sizes to prevent abuse."
- **"How do you scan for malware or inappropriate content?"**
  "Add a moderation step in the worker pipeline (antivirus for documents, a classifier for images) and keep the photo hidden until it passes."
- **"How does the client know processing finished?"**
  "A push event on the user's real-time channel if we have one; otherwise poll the photo's status with backoff. Both read the same database state."
- **"How do you handle deletes?"**
  "Soft-delete the row immediately so it disappears from the UI, then a job deletes objects from storage. CDN copies of private images expire with their signed URLs."

#### What senior interviewers look for
- **Direct uploads, async processing and CDN delivery** as the default shape, without prompting.
- Awareness of **privacy** (EXIF, signed URLs) and **cost** (variants, storage classes, cleanup).
- Frontend craft: **no layout shift**, good progress and failure UX.
- Idempotency and cleanup thinking: "what happens to half-finished work?"

#### Practise it
1. Implement the presigned-URL endpoint with size and content-type conditions (S3 `createPresignedPost` or R2 equivalent).
2. Write an idempotent worker with `sharp` that produces three variants and records width, height and a blurhash.
3. Build a gallery grid with `aspect-ratio`, blurhash placeholders and `<picture>` sources; run Lighthouse and check CLS.
4. Explain the full flow to a friend in two minutes without using notes.

## Design an online marketplace listing and search experience
- id: fs-design-06
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: search, marketplace, SEO, SSR, Elasticsearch, faceted search

### Prompt
Design the listings side of a marketplace (think second-hand goods): sellers create listings with photos, buyers search and filter by category, price and location, and listing pages must rank well in Google. Cover data, search, rendering and the UI.

### Answer
#### What the interviewer is really testing
- **Search architecture**: primary database vs a search index, keeping them in sync, relevance and facets.
- **Rendering for SEO**: which pages need server rendering, caching and structured data.
- **Geo queries**: "within 10 miles of me".
- **Frontend search UX**: URL-driven filters, debouncing, facets with counts, pagination vs infinite scroll.
- **Consistency trade-offs**: a new listing appearing in search within seconds, not instantly.

#### Key points
- **Postgres is the source of truth** for listings; a **search index** (Elasticsearch/OpenSearch, Typesense, Algolia, or Postgres full-text + PostGIS at modest scale) serves search and facets.
- Sync via **change data capture or an outbox**: listing changes → event → indexer updates the document. Expect a few seconds of lag.
- **Facets** (category, condition, price buckets) come from aggregations in the search engine, returned with counts.
- **Geo**: store a lat/lng point; filter with geo-distance and optionally sort by distance. Never expose exact seller addresses.
- **Rendering**: listing pages and category pages are **server-rendered (or ISR)** with proper titles, meta descriptions, canonical URLs and `schema.org/Product` JSON-LD. The search results page with arbitrary filters is SSR for the first load, then client-side updates.
- **Filters in the URL**: `/search?q=bike&cat=cycling&max=200&near=SW1A`. Shareable, crawlable for key combinations, back button works.

#### Model answer
"**Requirements.** Sellers create listings (title, description, price, category, condition, photos, location). Buyers search with keywords and filters, sort by relevance, price, newest or distance. 20M active listings, 5k searches/sec at peak. Listing and category pages need strong SEO. New listings searchable within ~10 seconds.

**Data.**
```sql
listings(id, seller_id, title, description, price_pence, currency, category_id,
         condition, status active|sold|removed, location geography(Point),
         postcode_area, created_at, updated_at)
listing_photos(listing_id, position, key, w, h)
categories(id, parent_id, slug, name)
outbox(id, aggregate_id, type, payload, created_at, processed_at)
```
Writing a listing inserts into `listings` and `outbox` in one transaction.

**Indexing.**
```
Postgres ──outbox poller / Debezium──► Kafka ──► Indexer ──► OpenSearch "listings"
```
Indexed document: title and description (text, with stemming and synonyms), category path, price, condition, `geo_point` (rounded to ~1 km for privacy), created_at, seller rating, photo thumbnail URL. Sold or removed listings are deleted from the index.

**Search API.**
```
GET /api/search?q=road+bike&cat=cycling&min=50&max=300&cond=used&near=51.5,-0.12&radius=10mi&sort=relevance&cursor=...
→ { results: [...24 cards], facets: { category: [...], condition: [...], price: [...] }, total, nextCursor }
```
One query: `bool` with a `multi_match` on title^3 and description, filters for category/price/condition, a `geo_distance` filter, and aggregations for facets. Relevance can be boosted by recency and seller rating with a `function_score`.

**Rendering.**
- **Listing page** `/item/road-bike-carbon-123`: SSR or ISR with a revalidate time of ~60 seconds and on-demand revalidation when the seller edits. Includes `<title>`, meta description, Open Graph image, canonical URL and `Product` + `Offer` JSON-LD. When sold, still return 200 with 'Sold' and related items (keeps SEO value), or 410 after a while.
- **Category pages** `/c/cycling/road-bikes`: SSR with the first page of results, cached at the CDN for a minute.
- **Search page**: SSR on first load from the URL, then the client takes over: filter changes update the URL with `history.replaceState`/router push and fetch results client-side.

**Frontend search UX.**
- Keyword input **debounced** (~300 ms); previous requests aborted.
- Facets show counts and update with results; selected filters appear as removable chips.
- Results grid with fixed-ratio thumbnails, price and distance. **Paginated** with real URLs (`?page=2`) for SEO and back-button sanity; I might add 'Load more' on mobile while still updating the URL.
- Empty state suggests removing the most restrictive filter.
- Location: ask for the browser location only when the user picks 'Near me'; otherwise use a postcode box.

**Scale.** 5k searches/sec is a moderate OpenSearch cluster (several data nodes, 2 replicas), with popular queries cached at the CDN for ~30 seconds. Postgres handles writes and listing-page reads easily with read replicas."

#### Another worked example: the seller's "create listing" flow
"The seller form is multi-step: photos first (direct uploads with presigned URLs, processed in the background), then details, then price and location. Drafts autosave every few seconds to `listings` with `status='draft'`, so a closed tab doesn't lose work. Category suggestion runs on the title (a simple classifier or search over past listings). Price guidance comes from a percentile query over similar sold items. On publish, the status becomes `active`, the outbox event fires, and the seller is redirected to their listing page, which is rendered from Postgres directly, so they see it instantly even though search indexing takes a few seconds."

#### Step-by-step framework
1. **Requirements**: entities, filters, sorts, scale, freshness, SEO needs.
2. **Source of truth vs search index**, and how they sync (outbox / CDC).
3. **Index design**: text fields, filters, geo point, boosts.
4. **Search API**: one call returns results, facets and a cursor.
5. **Rendering per page type**: SSR/ISR for SEO pages, client updates for interactive search.
6. **Search UX**: URL state, debounce, chips, facets, empty states, pagination.
7. **Privacy and abuse**: rounded locations, spam listings, rate limits.
8. **Scale and caching**: CDN for category pages, cluster sizing.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `LIKE '%bike%'` on Postgres for 20M rows | Search index with relevance, synonyms and facets |
| Dual-writes to DB and index in the request | Outbox or CDC with an indexer; tolerates lag |
| Client-rendered SPA for listing pages | SSR/ISR with meta tags, canonical URLs and JSON-LD |
| Filters kept in component state | Filters in the URL; shareable and back-button friendly |
| Exact seller coordinates in the index | Locations rounded for privacy |
| Infinite scroll only | Real paginated URLs (plus 'load more' if wanted) |

#### Useful phrases
- "Postgres stays the source of truth; the search index is a derived view that can be rebuilt."
- "I'll accept a few seconds of indexing lag, but the seller sees their own listing straight from the database."
- "Pages that need to rank are server-rendered with structured data; the interactive bits hydrate on top."
- "Every filter lives in the URL."
- "Facets come back in the same query as results, with counts."

#### Common pitfalls
- **Dual writes** (DB then index in the same request) that drift apart when one fails.
- **SEO afterthoughts**: client-only rendering, missing canonical URLs, duplicate pages for every filter order.
- **Facet explosion**: indexing every attribute as a facet and letting crawlers index millions of filter combinations (use `noindex` on deep combinations).
- **No privacy rounding** on locations.
- **Ignoring stale results**: sold items still in search. Delete on status change.

#### Follow-ups to expect (with sample answers)
- **"How would you rebuild the index if the mapping changes?"**
  "Create a new index with the new mapping, backfill from Postgres in batches while the indexer writes to both, then switch an alias atomically and delete the old index."
- **"Could you do this without Elasticsearch?"**
  "At a few hundred thousand listings, yes: Postgres `tsvector` with GIN indexes, `pg_trgm` for typos, PostGIS for distance and `GROUP BY` for facets. I'd move to a search engine when relevance tuning or scale demanded it."
- **"How would you personalise ranking?"**
  "Start with a re-ranking layer over the top ~200 results using signals like the user's category affinity, then evaluate with A/B tests on contact-seller rate."
- **"How do you stop spam listings?"**
  "Rate limits for new accounts, duplicate-image detection, keyword and price-outlier rules, and a moderation queue, with listings held back from search until they pass."

#### What senior interviewers look for
- A clear **derived-data mindset**: the index is rebuildable, and you've thought about sync and reindexing.
- **Page-by-page rendering decisions** tied to SEO and interactivity.
- **Search UX maturity**: URL state, facets, empty states.
- Awareness of **privacy, abuse and cost**.

#### Practise it
1. Write an OpenSearch query with text match, price filter, geo-distance filter and two facet aggregations.
2. Build a search page whose filters are fully URL-driven, with debounced input and request cancellation.
3. Add JSON-LD `Product` markup to a listing page and test it with Google's Rich Results test.
4. Explain the outbox pattern to a friend and why it beats dual writes.

## Design a booking / scheduling app like Calendly
- id: fs-design-07
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: scheduling, time zones, double booking, calendar integration, concurrency

### Prompt
Design a scheduling app: hosts connect their calendars and define availability rules; invitees open a public link, see free slots in their own time zone and book one. Cover availability calculation, preventing double bookings, calendar sync and the booking UI.

### Answer
#### What the interviewer is really testing
- **Time zones and recurrence**: storing availability correctly and showing slots in the invitee's zone, across daylight-saving changes.
- **Concurrency**: two invitees grabbing the same slot at the same time.
- **Integration with external calendars** (Google, Microsoft): OAuth, sync, rate limits, eventual consistency.
- **Computation**: generating available slots efficiently from rules, existing events and buffers.
- **Public, unauthenticated UX**: fast booking page, clear time zone display, confirmation and rescheduling flows.

#### Key points
- Store availability **rules in the host's time zone** (e.g. Mon–Fri 09:00–17:00 Europe/London) and expand them to concrete UTC intervals for a date range at query time. Never store "9 am" as a UTC time.
- **Free slots** = expand rules → subtract busy intervals (external calendar events + existing bookings) → apply buffers, minimum notice and daily limits → cut into slot-length steps.
- **Prevent double booking in the database**: an exclusion constraint on `(host_id, tstzrange)` in Postgres, or a unique slot key, or a short **hold** with expiry. Check again at booking time; the slot list is only a hint.
- **Calendar sync**: OAuth tokens per host; read busy times via free/busy APIs, cached, refreshed by **push notifications/webhooks** plus periodic polling; write the booked event back to the host's calendar.
- **Client**: detect the invitee's zone with `Intl.DateTimeFormat().resolvedOptions().timeZone`, let them change it, render a month view with available days and a slot list for the selected day.

#### Model answer
"**Requirements.** Hosts define event types (30-minute intro call), weekly availability, buffers (10 minutes before/after), minimum notice (4 hours) and a max of 6 bookings per day. They connect Google or Outlook calendars. Invitees open `/alex/intro`, pick a day and slot in their own time zone, enter name and email, and get a confirmation with a calendar invite. Scale: 1M hosts, 200k bookings/day, slot pages must load in under a second.

**Data model.**
```sql
hosts(id, timezone, ...)
event_types(id, host_id, slug, duration_min, buffer_before, buffer_after,
            min_notice_min, max_per_day, rules jsonb)  -- weekly windows in host tz
date_overrides(host_id, date, windows jsonb)           -- holidays, special hours
calendar_connections(host_id, provider, refresh_token_encrypted, sync_token)
busy_cache(host_id, during tstzrange, source)          -- from external calendars
bookings(id, event_type_id, host_id, during tstzrange, invitee_email,
         status confirmed|cancelled, external_event_id, created_at,
         EXCLUDE USING gist (host_id WITH =, during WITH &&) WHERE (status = 'confirmed'))
```
The **exclusion constraint** makes overlapping confirmed bookings for the same host impossible, whatever the application code does. (I'd include buffers in `during` or store a separate padded range.)

**Slot calculation** (`GET /api/slots?eventType=intro&from=2026-11-10&to=2026-11-16&tz=America/New_York`).
1. Load rules and overrides; for each date in the range, build the windows **in the host's zone** and convert to UTC with a proper tz library (so DST shifts are handled).
2. Load busy intervals: confirmed bookings + `busy_cache` for that range.
3. Pad busy intervals by the buffers; subtract from windows.
4. Remove anything before now + minimum notice; enforce max per day.
5. Step through remaining windows in 15/30-minute increments to produce slot start times (UTC).
6. Return UTC timestamps; the client formats them in the invitee's zone.
Results are cached per host + event type + week for ~30 seconds, invalidated when a booking is made or a calendar webhook arrives.

**Booking.**
```
POST /api/bookings { eventTypeId, start, invitee: {name, email}, tz }
```
1. Recompute that one slot's validity (rules, notice, daily cap).
2. `INSERT INTO bookings ...`. If the exclusion constraint fires → `409 Slot no longer available`.
3. On success, enqueue jobs: create the event in the host's calendar, send emails with an `.ics` file, schedule reminders.
4. Return the confirmation with reschedule/cancel links (signed tokens).

**Calendar sync.**
- On connect, store an encrypted refresh token; subscribe to change notifications (Google `watch`, Microsoft Graph subscriptions).
- On a notification, fetch changes with the sync token and update `busy_cache` for the next ~60 days; invalidate slot caches.
- Fall back to polling every ~10 minutes in case notifications are missed; renew subscriptions before they expire.
- The external calendar is **eventually consistent** with us, so the booking step also does a quick live free/busy check for that slot if the cache is older than a minute.

**Frontend (public booking page).**
- SSR the shell with host name, event details and the detected zone placeholder; fetch slots client-side once the zone is known.
- Month calendar: days with slots are enabled; days without are disabled (with `aria-disabled` and a label).
- Slot list for the selected day, formatted with `Intl.DateTimeFormat` in the chosen zone; a time zone picker at the top ('Times shown in New York time — change').
- After choosing a slot: a short form, then optimistic 'Confirming…'. On `409`, refresh slots and say 'That time was just taken — here are the nearest options.'
- Confirmation page with add-to-calendar links."

#### Another worked example: the daylight-saving trap
"A London host works 09:00–17:00. On 27 October the UK leaves summer time. If I'd stored availability as '08:00–16:00 UTC' (correct in summer), from late October the host would appear available 08:00–16:00 London time, an hour early. Storing rules in the host's zone and converting **per date** fixes it. The invitee side matters too: a New York invitee looking at the week of 27 October sees the gap between the UK and US changes (the US switches a week later), so the same host slot moves from 5 am to 4 am New York time mid-week. That's correct, and the UI should just show it; I'd add tests for DST weeks in both zones."

#### Step-by-step framework
1. **Requirements**: event types, rules, buffers, notice, caps, integrations.
2. **Time model**: rules in host zone; expand per date; everything else in UTC; display in invitee zone.
3. **Slot algorithm**: windows − busy − buffers − notice → steps → caps.
4. **Double-booking prevention** in the database (exclusion constraint / unique key / holds).
5. **Calendar sync**: OAuth, webhooks + polling, busy cache, write-back.
6. **Booking flow**: revalidate, insert, async side effects, signed manage links.
7. **UI**: zone detection and picker, month + slot list, conflict recovery, accessibility.
8. **Edge cases**: DST, overrides, token expiry, reschedules.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Stores "9 am" in UTC | Rules in the host's zone, converted per date |
| Checks availability in code, then inserts | Database constraint makes double booking impossible |
| Calls Google on every slot page view | Busy cache fed by webhooks + polling |
| Shows times in the host's zone | Detects the invitee's zone and lets them change it |
| Sends emails inside the booking request | Async jobs for calendar write-back, emails, reminders |
| Ignores DST | Calls out DST and tests for it |

#### Useful phrases
- "Availability rules are local-time concepts, so I store them in the host's time zone."
- "The slot list is a hint; the database constraint is the real guarantee."
- "External calendars are eventually consistent with us, so I double-check at booking time if the cache is stale."
- "Side effects (emails, calendar events) happen asynchronously after the booking commits."
- "I'd test DST weeks explicitly, in both the host's and the invitee's zones."

#### Common pitfalls
- **Time zone bugs**: storing offsets instead of IANA zone names, converting rules once instead of per date.
- **Race conditions**: check-then-insert without a constraint or lock.
- **Hammering calendar APIs** and hitting rate limits.
- **Losing calendar access silently** when a refresh token is revoked; hosts should be alerted.
- **Unclear time zone display** for invitees, leading to missed meetings.

#### Follow-ups to expect (with sample answers)
- **"How would you support round-robin across a team?"**
  "Compute slots for each team member and take the union. At booking, pick the eligible member with the fewest recent bookings (or by priority) and insert; if their constraint fails, try the next member."
- **"How do holds work for a multi-step checkout (e.g. paid bookings)?"**
  "Insert a booking with status `held` and an expiry 10 minutes out, covered by the same exclusion constraint. Payment success confirms it; a job releases expired holds."
- **"How do reschedules work?"**
  "In one transaction, insert the new booking and cancel the old one, so the constraint still holds. Then update the external event rather than creating a new one."
- **"What if the host edits their calendar directly to overlap a booking?"**
  "That's their choice; we only prevent overlaps we control. The sync would show the conflict, and we could warn the host."

#### What senior interviewers look for
- **Correct time handling** explained clearly, including DST.
- **Database-level guarantees** for the core invariant.
- Realistic **integration design**: tokens, webhooks, renewals, rate limits, failure alerts.
- A booking UI that's **clear about time zones** and recovers well from conflicts.

#### Practise it
1. Write the slot algorithm for one day using a tz library (Luxon, date-fns-tz or Temporal), with tests for DST change days.
2. Create the `bookings` table with the exclusion constraint and prove two overlapping inserts can't both succeed.
3. Build the booking page's slot list with a time zone picker using `Intl.DateTimeFormat`.
4. Explain to a friend why rules are stored in the host's zone, using the October DST example.
