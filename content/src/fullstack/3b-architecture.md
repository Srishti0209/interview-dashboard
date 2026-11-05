# Full Stack Engineer — Architecture (continued)

## Serverless vs containers vs a long-running server
- id: fs-arch-07
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: serverless, containers, Kubernetes, hosting, cold starts, cost

### Prompt
For a new web product, how do you decide between serverless functions (Lambda, Vercel/Netlify functions, Cloud Run), containers on a managed platform or Kubernetes, and a traditional long-running server? What are the trade-offs?

### Answer
#### What the interviewer is really testing
- Understanding the **execution model** of each option and its consequences: cold starts, connection handling, timeouts, state.
- **Cost models**: pay-per-request vs pay-for-capacity, and where each becomes expensive.
- **Workload fit**: spiky HTTP traffic, WebSockets, long jobs, background workers, heavy CPU.
- **Operational burden** and team skills.
- Practical gotchas: database connection exhaustion, vendor lock-in, local development.

#### Key points
- **Serverless functions**: run per request/event, scale to zero, scale out instantly, no servers to manage. Limits: **cold starts**, **execution time limits**, no long-lived connections (WebSockets need a separate service), **database connection storms** (use a pooler such as PgBouncer/Supabase pooler/RDS Proxy or an HTTP-based driver), per-request cost grows with sustained high traffic.
- **Containers on a managed platform** (Cloud Run, Fly.io, Render, ECS Fargate, App Runner): you ship an image; the platform handles scaling. Supports long-running processes and WebSockets (with limits), more control, still low ops. Some (Cloud Run) scale to zero.
- **Kubernetes**: maximum control and portability for many services; significant operational cost. Justified with many services and a platform team.
- **Long-running server / VM**: simplest mental model, predictable cost, in-memory caches and connections; you handle scaling, patching and availability.
- **Hybrid is normal**: static assets on a CDN, API on functions or containers, workers on containers, real-time on a managed service.

#### Model answer
"I'd decide by workload shape, team size and cost profile, and I'd usually end up with a mix.

| | Serverless functions | Managed containers | Kubernetes | VM / long-running server |
|---|---|---|---|---|
| Scaling | Automatic, per request, to zero | Automatic, per instance, often to zero | Configurable autoscaling | Manual / autoscaling groups |
| Cold starts | Yes (100 ms–seconds) | Sometimes (if scaled to zero) | No | No |
| Long connections / WebSockets | No (needs separate service) | Yes (with limits) | Yes | Yes |
| Max duration | Seconds to ~15 min | Long | Unlimited | Unlimited |
| Ops burden | Lowest | Low | High | Medium |
| Cost at low traffic | Near zero | Low | High (cluster baseline) | Fixed |
| Cost at high steady traffic | Can be highest | Moderate | Efficient at scale | Efficient |

**Example decisions:**
- **Early-stage SaaS, spiky low traffic, small team**: Next.js on Vercel (functions) or a container on Cloud Run/Fly; Postgres via a managed provider with a **connection pooler**; background jobs via a queue service (or a single worker container). Minimal ops, near-zero idle cost.
- **Product with WebSockets** (live collaboration): API can stay serverless, but the real-time gateway runs as **long-running containers** (or a managed real-time service), because functions can't hold sockets.
- **Heavy, steady traffic** (thousands of requests/sec all day): containers on ECS/Kubernetes or VMs are usually cheaper than per-invocation pricing; I'd model cost before choosing.
- **Video transcoding / long jobs**: containers or batch services, not functions with 15-minute limits.

**Serverless gotchas I'd design for:**
- **Database connections**: each concurrent function instance may open a connection, and Postgres falls over at a few hundred. Use a transaction-mode pooler or an HTTP-based driver, and keep the client outside the handler so warm instances reuse it.
- **Cold starts**: keep bundles small, avoid heavy initialisation, choose regions near the database, use provisioned concurrency for latency-critical endpoints if needed.
- **Timeouts**: anything longer than a few seconds moves to a queue + worker.
- **Observability**: structured logs with request ids, tracing across functions.
- **Local dev**: emulate with the framework's dev server; keep handlers as plain functions that are easy to test.

**Lock-in**: I keep business logic in plain modules and use web-standard `Request → Response` handlers where possible, so moving between Vercel functions, Cloud Run and a Node server is mostly configuration."

#### Another worked example: a surprise serverless bill
"An image-heavy app resized images in a serverless function on every request. Traffic grew to 3M requests a day, each taking ~800 ms of 1 GB memory. The bill came to several thousand pounds a month, more than a few containers would have cost, and cold starts added latency. Fixes: put a CDN in front with long cache lifetimes (most resizes became cache hits), pre-generate common sizes at upload time, and move the remaining resize work to an always-on container service. The lesson: serverless is cheap for spiky, light work; sustained heavy compute is often cheaper on capacity-based hosting."

#### Step-by-step framework
1. **Profile workloads**: request/response APIs, real-time, background jobs, heavy compute.
2. **Estimate traffic shape and cost** for each option.
3. **Map each workload** to the simplest platform that fits.
4. **Plan connections, timeouts, cold starts** for serverless parts.
5. **Keep code portable**: thin platform adapters.
6. **Revisit** as traffic grows; measure cost per request.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Serverless is always cheaper" | Models cost for spiky vs steady traffic |
| Kubernetes for a 3-person startup | Picks the lowest-ops option that fits |
| WebSockets in Lambda functions | Separate long-running or managed real-time service |
| Opens a DB connection per invocation, no pooler | Pooler/HTTP driver, client reused across invocations |
| Long jobs in HTTP functions | Queue + worker containers |
| Logic tied to the platform's handler format | Portable handlers over plain modules |

#### Useful phrases
- "I'd match each workload to the simplest platform that fits it."
- "Serverless is ideal for spiky request/response work; steady heavy compute is often cheaper on containers."
- "Functions need a connection pooler in front of Postgres."
- "Anything long-running goes onto a queue and a worker."
- "Handlers stay thin so we can move platforms."

#### Common pitfalls
- **Connection exhaustion** with serverless + Postgres.
- **Ignoring cold starts** on latency-sensitive endpoints.
- **Kubernetes before product-market fit.**
- **Hidden costs**: egress, NAT gateways, logs, provisioned concurrency.
- **Trying to hold state** in function memory between requests.

#### Follow-ups to expect (with sample answers)
- **"What are edge functions and how do they differ?"**
  "Lightweight functions on a CDN's edge network with a restricted runtime (V8 isolates): near-zero cold starts and low latency for things like redirects, auth checks and personalisation, but limited APIs and far from the database."
- **"How do you run background jobs with a serverless stack?"**
  "A managed queue (SQS, Cloud Tasks, Inngest, QStash) that invokes functions per job with retries, or a single worker container for long jobs."
- **"How would you migrate from Vercel to containers?"**
  "Build the app in standalone/server mode, put it in a Docker image, deploy behind a CDN, replace platform-specific features (ISR cache, image optimisation) with equivalents, and move gradually by route if needed."
- **"How do you reduce cold starts?"**
  "Smaller bundles, lazy imports, fewer SDKs at init, a lighter runtime, regions near dependencies, and provisioned or minimum instances for critical paths."

#### What senior interviewers look for
- **Workload-driven** decisions with **cost modelling**.
- Awareness of **platform limits** and how to design around them.
- **Low-ops bias** for small teams.
- **Portability** thinking.

#### Practise it
1. Deploy the same small API to a serverless platform and a container platform; measure cold and warm latency.
2. Load-test a serverless endpoint that talks to Postgres with and without a pooler.
3. Model monthly cost for 100k, 1M and 30M requests/day on both options.
4. Explain to a friend why WebSockets don't fit serverless functions.

## Edge computing and edge functions: when they help
- id: fs-arch-08
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: edge, CDN, edge functions, middleware, latency, personalisation

### Prompt
What does "running at the edge" mean for a web app, what are edge functions good for, and when do they make things worse? Give concrete examples.

### Answer
#### What the interviewer is really testing
- Understanding that the edge brings **compute close to users**, but your **data usually isn't** there.
- Knowing what edge runtimes can and can't do (V8 isolates, limited APIs, small bundles, short CPU time).
- Picking good use cases: **routing, redirects, auth checks, A/B assignment, geolocation, header manipulation, caching logic**.
- Recognising when edge makes latency **worse** (chatty calls to a far-away database).
- Awareness of edge data options (KV stores, read replicas, edge caches).

#### Key points
- **Edge functions** run in many CDN locations (Cloudflare Workers, Vercel Edge/Middleware, Netlify Edge, Fastly Compute) on lightweight runtimes with **near-zero cold starts**.
- Constraints: limited Node APIs (web-standard `fetch`, `Request`, `Response`, Web Crypto), small bundle limits, limited CPU time per request, no long-lived TCP connections to traditional databases (use HTTP-based drivers).
- Great for **request-time decisions that need little or no data**: redirects, rewrites, geo-based routing, bot filtering, JWT verification, A/B bucketing, adding security headers, serving cached personalised variants.
- **Bad fit** when the request needs several round trips to a database in one region: each round trip from Sydney to a Virginia database adds ~200 ms. Better to run that code **near the data** (regional function) and cache the result at the edge.
- **Edge data**: KV stores (eventually consistent, read-heavy), Durable Objects (strongly consistent per key), globally replicated databases, read replicas in several regions.

#### Model answer
"The edge is the CDN's network of locations close to users. Running code there cuts the network distance for the *first hop*, which matters for latency-sensitive decisions. But most apps keep their data in one region, so the edge only helps when the work needs little data or can use data replicated to the edge.

**Good uses (examples I'd actually ship):**
1. **Auth gate**: middleware verifies a signed session JWT with Web Crypto and redirects unauthenticated users to `/login`, without touching the origin.
2. **A/B testing without flicker**: assign a bucket at the edge, set a cookie, and rewrite to a pre-rendered variant (`/pricing` → `/pricing/b`). Both variants stay cacheable.
3. **Geo and locale routing**: redirect `/` to `/de` based on `Accept-Language` and the country header; block or adjust content for legal reasons by country.
4. **Redirect maps**: thousands of marketing redirects loaded from an edge KV store.
5. **Bot and abuse filtering**: rate-limit or challenge suspicious traffic before it reaches the origin.
6. **Personalised caching**: a cached page plus a small edge-inserted fragment (user's first name from the JWT, local currency from geo).

```ts
// middleware.ts (Next.js) — runs at the edge
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (req.nextUrl.pathname.startsWith('/app') && !(await verifyJwt(token))) {
    return NextResponse.redirect(new URL(`/login?next=${req.nextUrl.pathname}`, req.url));
  }
  if (req.nextUrl.pathname === '/pricing') {
    const bucket = req.cookies.get('ab_pricing')?.value ?? (Math.random() < 0.5 ? 'a' : 'b');
    const res = NextResponse.rewrite(new URL(`/pricing/${bucket}`, req.url));
    res.cookies.set('ab_pricing', bucket, { maxAge: 60 * 60 * 24 * 30 });
    return res;
  }
}
```

**When the edge makes things worse:** A product page rendered at the edge in Sydney that makes four sequential queries to a database in Virginia pays four round trips of ~200 ms: 800 ms, versus ~5 ms per query from a function in Virginia plus one 200 ms hop to the user. So:
- Data-heavy rendering → run **in the data's region**, cache the HTML/JSON at the edge.
- If global low latency for data is required → **replicate data** (read replicas in several regions, a globally distributed database, or edge KV for read-mostly config), and accept the consistency trade-offs.

**Other constraints:** no native Node modules, limited CPU time (heavy work like image processing or PDF generation doesn't belong there), smaller ecosystem of compatible libraries, and debugging across many locations needs good logging."

#### Another worked example: feature flags at the edge
"A team evaluated feature flags in the origin on every request, adding a call to the flag service. Moving evaluation to the edge: the flag configuration is pushed to an edge KV store whenever it changes; middleware reads it (local, sub-millisecond), evaluates the user's flags from their id and attributes, and passes them to the origin in a header and to the client in a cookie. Pages that only differ by flag can be cached per variant using the header in the cache key. The origin no longer calls the flag service at all."

#### Step-by-step framework
1. Ask: **does this request-time logic need data, and where does that data live?**
2. Little or replicated data → **edge**.
3. Lots of data in one region → **regional compute**, cache results at the edge.
4. Check **runtime constraints** (APIs, bundle size, CPU time).
5. Choose **edge data** if needed (KV, Durable Objects, replicas) and accept its consistency model.
6. **Measure** real-user latency before and after.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Run everything at the edge for speed" | Edge for light decisions; compute near data for heavy reads |
| Ignores where the database is | Counts round trips to the data region |
| Heavy libraries in edge functions | Respects runtime and CPU limits |
| Client-side A/B tests with flicker | Edge bucketing + rewrites to cached variants |
| Assumes edge KV is strongly consistent | Knows it's eventually consistent; uses Durable Objects or the origin when needed |
| No measurement | Real-user latency comparison |

#### Useful phrases
- "The edge shortens the first hop; it doesn't move your database."
- "Light request-time decisions belong at the edge; data-heavy rendering belongs near the data."
- "I'd bucket A/B tests at the edge and rewrite to cached variants, so there's no flicker."
- "Edge KV is great for read-mostly config, but it's eventually consistent."
- "Let's measure real-user latency before and after."

#### Common pitfalls
- **Chatty database calls from the edge.**
- **Incompatible dependencies** (Node-only modules) discovered at deploy time.
- **Leaking secrets** to edge logs or headers.
- **Cache keys** that don't include the variant, serving the wrong A/B version.
- **Complex business logic** spread across edge and origin, hard to test.

#### Follow-ups to expect (with sample answers)
- **"What's the difference between edge middleware and a CDN rule?"**
  "CDN rules are declarative (cache, redirect by pattern); middleware is code, so it can verify tokens, read KV and make conditional decisions."
- **"How do you connect to Postgres from the edge?"**
  "Through HTTP/WebSocket-based drivers or a data proxy, ideally a nearby read replica; but I'd question whether that request should run at the edge."
- **"Are edge functions secure for auth?"**
  "Verifying a signed token is fine; full authorisation that needs fresh database state still belongs at the origin."
- **"How do you test edge code?"**
  "Keep it small and pure, unit-test with web-standard `Request` objects, and use the provider's local emulator."

#### What senior interviewers look for
- **Physics-aware reasoning** about latency and data location.
- **Concrete, appropriate use cases**.
- Knowledge of **edge data consistency** models.
- Measurement over hype.

#### Practise it
1. Write edge middleware that does an auth redirect and an A/B rewrite; check the cache keys.
2. Measure latency of a page rendered at the edge with a remote database vs regionally.
3. Store a redirect map in an edge KV store and update it without a deploy.
4. Explain to a friend why edge rendering can be slower.

## Real-time architecture: WebSockets at scale, pub/sub fan-out
- id: fs-arch-09
- round: FULLSTACK_ARCHITECTURE
- difficulty: hard
- levels:
- tags: real-time, WebSockets, SSE, pub/sub, Redis, scaling, backpressure

### Prompt
Your product needs real-time updates (live dashboards, collaboration, notifications) for 500k concurrently connected users. How would you architect the real-time layer, and what problems do you have to solve at that scale?

### Answer
#### What the interviewer is really testing
- Separating the **connection layer** (holding sockets) from the **application layer** (business logic) and the **message bus**.
- Handling **fan-out** across many gateway instances via pub/sub.
- **Connection lifecycle**: auth, heartbeats, reconnects, deploys, load balancing.
- **Delivery semantics**: at-most-once vs at-least-once, ordering, catch-up after disconnects.
- **Backpressure and limits**: slow clients, message storms, per-connection memory.
- Build-vs-buy judgement (managed services).

#### Key points
- **Gateways** hold WebSocket/SSE connections and know which channels their clients subscribed to. They're horizontally scaled and mostly stateless apart from sockets. A tuned instance can hold tens of thousands of idle connections (memory is the limit; ~10–50 KB per connection).
- **Pub/sub bus** (Redis pub/sub or Streams, NATS, Kafka for durable streams) connects producers to gateways. Gateways subscribe to channels that have at least one local subscriber.
- **Producers** (API, workers) publish events **after** committing to the database.
- **Auth on connect** (token in the first message or cookie) and **authorisation per channel subscription**.
- **Heartbeats** (ping/pong) to detect dead connections; **reconnect with jittered exponential backoff**; **catch-up** via sequence numbers or by refetching state.
- **Deploys**: drain gateways gradually; tell clients to reconnect elsewhere; avoid reconnect storms.
- **Backpressure**: bounded per-connection send buffers; drop or coalesce messages for slow clients; disconnect clients that fall too far behind.
- **Load balancing**: L4/L7 balancers that support WebSockets; connection counts, not request counts, are the scaling signal.

#### Model answer
"I'd treat real-time as its own layer with three parts: **gateways** that hold connections, a **message bus** that routes events, and **producers** that publish events. The source of truth stays in the database; the socket is a notification channel.

```
Clients ──WS──► L4/L7 load balancer ──► Gateway fleet (e.g. 20 × 25k conns)
                                            │  subscribe/unsubscribe per channel
                                            ▼
API / workers ──publish (after commit)──► Message bus (Redis Cluster pub/sub / NATS)
```

**Sizing.** 500k connections at ~25k per gateway → 20 instances, plus headroom for deploys and failures (say 30). Memory per connection (buffers, subscription maps) is the main cost; message throughput depends on fan-out (one board update to 50 viewers = 50 sends).

**Connection lifecycle.**
1. Client connects with a short-lived token (fetched from the API, since browsers can't set headers on WebSocket upgrades; a cookie also works for same-site).
2. Gateway verifies it, then the client sends `subscribe` messages for channels (`board:42`, `user:7`). The gateway authorises each subscription (calling the API or checking claims), records it locally, and subscribes to the bus channel if it's the first local subscriber.
3. Heartbeats every ~25 seconds keep proxies from closing idle connections and detect dead clients.
4. On disconnect, the gateway cleans up subscriptions; the client reconnects with exponential backoff + jitter.

**Delivery semantics.** Pub/sub is **at-most-once**: if a client is disconnected, it misses messages. So every channel has a **sequence number** (from the database or a Redis Stream), clients track the last one they've seen, and on reconnect they either request missed events (`GET /events?channel=board:42&after=1234`, served from a Redis Stream or event table with a few hours of retention) or refetch current state. That turns at-most-once delivery into effectively-once state.

**Ordering.** Events within a channel are ordered by sequence number; clients apply them in order and refetch on gaps. No ordering guarantees across channels, and none are needed.

**Backpressure.** Each connection has a bounded send queue. If a slow mobile client falls behind, the gateway **coalesces** (only the latest state for 'presence' or 'cursor' messages), then drops non-critical messages, and finally disconnects the client, which reconnects and refetches. One slow client must never grow gateway memory without limit.

**Deploys.** Gateways receive SIGTERM → stop accepting connections → send clients a `reconnect` message with a random delay (0–30 seconds) → close. This spreads 25k reconnects over 30 seconds instead of one spike. Clients reconnect to other instances.

**Hot channels.** A channel with 100k subscribers (a live event) fans out across all gateways. That's fine for the bus (one message per gateway), but gateways must send 100k frames; I'd batch, reduce frequency (aggregate updates every second) and keep payloads tiny.

**Build vs buy.** Managed services (Ably, Pusher, PubNub, AWS AppSync/API Gateway WebSockets, Supabase Realtime, Cloudflare Durable Objects) handle connections, scaling and global presence. For a product team, I'd seriously consider buying the connection layer and keeping event production in our own services."

#### Another worked example: SSE instead of WebSockets
"For a live dashboard where updates only flow server → client, I'd use **Server-Sent Events**: plain HTTP, automatic reconnect with `Last-Event-ID`, works through most proxies, and multiplexes over HTTP/2 so many tabs don't exhaust connection limits. The architecture is the same (gateways, bus, sequence numbers), but the client code is just `new EventSource('/stream?channels=…')`. WebSockets win when clients send frequent messages too (typing, cursors, game input)."

#### Step-by-step framework
1. **Separate layers**: gateways, bus, producers; database stays the source of truth.
2. **Size** connections per instance and fan-out throughput.
3. **Auth on connect, authorisation per subscription**.
4. **Heartbeats, reconnect with jitter**.
5. **Sequence numbers + catch-up** for missed messages.
6. **Backpressure**: bounded queues, coalescing, disconnecting laggards.
7. **Graceful deploys** with spread-out reconnects.
8. **Build vs buy** decision.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use Socket.IO with sticky sessions" | Gateways + pub/sub bus across instances |
| Assumes messages always arrive | Sequence numbers and catch-up on reconnect |
| Business logic inside socket handlers | Producers publish after commit; gateways just route |
| No plan for slow clients | Bounded queues, coalescing, disconnects |
| Deploy restarts everything at once | Draining and jittered reconnects |
| Builds everything in-house by default | Considers managed real-time services |

#### Useful phrases
- "Gateways hold connections; the bus routes events; the database is the truth."
- "Pub/sub is at-most-once, so clients catch up by sequence number after reconnecting."
- "Each subscription is authorised, not just the connection."
- "Slow clients get coalesced updates and are eventually disconnected."
- "On deploy, reconnects are spread out with jitter."

#### Common pitfalls
- **Reconnect storms** after deploys or outages.
- **Unbounded memory** from slow consumers.
- **Authorising only at connect time**, so users keep receiving data after losing access.
- **Publishing before commit**, sending events for rolled-back changes.
- **Using connection count as an afterthought** in autoscaling.

#### Follow-ups to expect (with sample answers)
- **"Redis pub/sub or Kafka?"**
  "Redis pub/sub for low-latency, ephemeral fan-out to gateways; Kafka (or Redis Streams) when you need durable, replayable streams, e.g. for catch-up or analytics. Often both."
- **"How do you autoscale gateways?"**
  "On connection count and memory, not CPU or requests per second, with scale-in that drains connections gently."
- **"How do you handle multiple regions?"**
  "Gateways per region, bus replication or a global bus between regions, and clients connect to the nearest region; channels whose producers are elsewhere get events via cross-region links."
- **"How do you test it?"**
  "Load test with tools like k6 or Artillery holding many connections, chaos tests killing gateways, and tests that clients recover state after missed events."

#### What senior interviewers look for
- **Layered architecture** with clear responsibilities.
- **Delivery semantics** understood and compensated for.
- **Operational maturity**: deploys, backpressure, autoscaling.
- **Build-vs-buy** pragmatism.

#### Practise it
1. Build a gateway with `ws` and Redis pub/sub; run two instances and confirm cross-instance delivery.
2. Add sequence numbers and a catch-up endpoint; kill the connection and verify recovery.
3. Simulate a slow client and implement a bounded send queue.
4. Explain at-most-once vs at-least-once to a friend with a chat example.

## Background jobs and queues in a web app
- id: fs-arch-10
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: background jobs, queues, workers, retries, idempotency, BullMQ, SQS, outbox

### Prompt
What work should move out of the request/response cycle into background jobs? How would you design the job system: queue choice, retries, idempotency, scheduling, monitoring and how the UI shows progress?

### Answer
#### What the interviewer is really testing
- Recognising **what belongs in a job**: slow, unreliable, retryable or deferrable work.
- **Delivery semantics**: queues deliver at-least-once, so handlers must be **idempotent**.
- **Retries with backoff**, dead-letter queues, poison messages.
- **Reliability between the database and the queue** (the dual-write problem, outbox pattern).
- **Operational visibility** and **user-facing progress**.

#### Key points
- Move to jobs: sending email/SMS, calling third-party APIs, image/video processing, report generation, imports/exports, webhooks out, search indexing, anything > ~1 second or that can fail transiently.
- **Queue options**: Redis-based (BullMQ, Sidekiq), cloud queues (SQS, Cloud Tasks, Pub/Sub), Postgres-based (pg-boss, Graphile Worker, Solid Queue), workflow engines (Temporal, Inngest) for multi-step processes.
- **At-least-once delivery** means duplicates happen: use **idempotency keys**, conditional updates and unique constraints.
- **Retries** with exponential backoff + jitter, a max attempt count, then a **dead-letter queue** with alerting.
- **Outbox pattern**: write the job/event to a table in the same transaction as the business change; a relay enqueues it. Avoids "order saved but email job lost" (or vice versa).
- **Scheduling**: cron-like recurring jobs with a single-runner guarantee (locks or a scheduler service).
- **Visibility**: queue depth, job latency, failure rate, DLQ size; per-job logs with correlation ids.
- **Progress for users**: a job record (status, progress, result) the UI polls or subscribes to.

#### Model answer
"Anything slow, unreliable or not needed for the response goes to a job. The request does the minimum: validate, write the core data, enqueue, and respond.

**Example: 'Generate invoice PDF and email it' after an order.**
```ts
await db.tx(async (t) => {
  const order = await t.orders.markPaid(orderId);
  await t.outbox.insert({ type: 'invoice.generate', payload: { orderId }, dedupe_key: `invoice:${orderId}` });
});
// relay (separate process) moves outbox rows into the queue, then marks them sent
```
Without the outbox, I'd risk the transaction committing and the enqueue failing (lost email), or the enqueue succeeding and the transaction rolling back (email for an unpaid order). With a Postgres-backed queue (pg-boss, Graphile Worker), the job insert can simply be **part of the same transaction**, which is a strong reason to use one at modest scale.

**Worker:**
```ts
worker.process('invoice.generate', { concurrency: 5 }, async (job) => {
  const { orderId } = job.data;
  const invoice = await db.invoices.findOrCreate(orderId);       // unique(order_id) → idempotent
  if (!invoice.pdf_key) {
    const pdf = await renderInvoicePdf(invoice);
    const key = `invoices/${invoice.id}.pdf`;
    await storage.put(key, pdf);                                 // same key on retry → overwrite, harmless
    await db.invoices.update(invoice.id, { pdf_key: key });
  }
  if (!invoice.emailed_at) {
    await email.send({ to: invoice.email, template: 'invoice', attachments: [invoice.pdf_key] },
                     { idempotencyKey: `invoice-email:${invoice.id}` });
    await db.invoices.update(invoice.id, { emailed_at: new Date() });
  }
});
```
Each step checks whether it's already done, so a retry after a crash in the middle doesn't duplicate work. The email provider's idempotency key covers the gap between 'sent' and 'recorded'.

**Retries.** Transient errors (timeouts, 5xx, rate limits) retry with exponential backoff and jitter: 10 s, 30 s, 2 min, 10 min, 1 h, up to ~8 attempts. Permanent errors (validation, 4xx like 'invalid email') fail immediately. After max attempts, the job goes to a **dead-letter queue**, which alerts and can be replayed after a fix.

**Queues and priorities.** Separate queues for critical (password resets, payments), default and bulk (exports, marketing emails), each with its own concurrency, so a 100k-email campaign can't delay a password reset.

**Scheduling.** Recurring jobs (nightly cleanup, hourly reconciliation) via the queue's repeatable jobs or a cron service, with a lock so only one instance runs each schedule.

**Progress for users.** Long user-triggered jobs (exports, imports) get a `jobs` row: `status`, `progress`, `result_url`, `error`. The API returns `202 Accepted` with the job id; the UI polls `GET /jobs/:id` every few seconds or listens on the user's real-time channel, shows a progress bar, and offers the download when done. A notification covers users who navigated away.

**Monitoring.** Dashboards for queue depth, age of the oldest job, throughput, failure rate, DLQ count; alerts when the oldest job's age exceeds a threshold. Every job logs with a correlation id that links back to the originating request."

#### Another worked example: a multi-step onboarding workflow
"When a company signs up: create the tenant, provision a database schema, invite the admin, sync billing, wait 3 days, send a check-in email unless they've already created a project. Chaining plain jobs gets messy (state spread across jobs, waiting days, compensation if provisioning fails). A **workflow engine** (Temporal, Inngest, AWS Step Functions) models it as durable code: each step is retried independently, sleeps of days are cheap, and the history shows exactly where a run is. I'd reach for one when processes have many steps, long waits or compensation logic; for single-step jobs, a plain queue is simpler."

#### Step-by-step framework
1. **Identify job-worthy work**: slow, unreliable, deferrable.
2. **Choose a queue** to fit scale and stack (Postgres-backed at modest scale; Redis/cloud queues at higher).
3. **Enqueue reliably**: same transaction or outbox.
4. **Idempotent handlers**: checkpoints, unique constraints, provider idempotency keys.
5. **Retries, backoff, DLQ**; distinguish transient vs permanent errors.
6. **Priorities and isolation** via separate queues.
7. **Scheduling** with single-runner guarantees.
8. **Progress UX and monitoring**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Sends emails inside the request | Enqueues and responds quickly |
| `db.save(); queue.add();` | Outbox or transactional enqueue |
| Assumes each job runs once | Idempotent handlers for at-least-once delivery |
| Infinite immediate retries | Exponential backoff, max attempts, DLQ |
| One queue for everything | Separate queues and concurrency by priority |
| No visibility | Queue depth, oldest job age, failure alerts |

#### Useful phrases
- "The request does the minimum and hands the rest to a job."
- "Queues deliver at least once, so every handler is idempotent."
- "The enqueue happens in the same transaction, or through an outbox."
- "Critical jobs get their own queue so bulk work can't delay them."
- "The UI gets a job id and polls for progress."

#### Common pitfalls
- **Dual writes** between the database and the queue.
- **Non-idempotent side effects** (double charges, double emails).
- **Poison messages** retried forever, blocking a queue.
- **Huge payloads** in job data instead of ids.
- **Jobs that depend on request context** (the user's session) that isn't available in the worker.

#### Follow-ups to expect (with sample answers)
- **"Postgres as a queue: is that OK?"**
  "Yes at modest scale (thousands of jobs per second with `SKIP LOCKED`). Benefits: transactional enqueue, one less system. Move to Redis/SQS when throughput or isolation demands it."
- **"How do you handle rate-limited third-party APIs?"**
  "Queue-level rate limits (e.g. BullMQ limiter), concurrency caps, and respecting `Retry-After` by rescheduling the job."
- **"How do you guarantee ordering?"**
  "Most queues don't guarantee it globally. Use per-key ordering (SQS FIFO message groups, Kafka partitions by key) or make handlers order-independent with version checks."
- **"How do you deploy workers safely?"**
  "Graceful shutdown: stop taking new jobs, finish or release in-flight ones within a timeout; jobs must be safe to retry if a worker is killed."

#### What senior interviewers look for
- **At-least-once + idempotency** as reflexes.
- **Transactional reliability** (outbox).
- **Operational design**: isolation, DLQs, monitoring.
- Knowing when to use a **workflow engine**.

#### Practise it
1. Set up pg-boss or BullMQ, enqueue inside a transaction (or via an outbox), and process idempotently.
2. Kill a worker mid-job and confirm the retry doesn't duplicate side effects.
3. Add a DLQ alert and replay a failed job.
4. Explain the outbox pattern to a friend with the invoice email example.

## Feature flags and progressive delivery across client and server
- id: fs-arch-11
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: feature flags, progressive delivery, canary, A/B testing, kill switch, trunk-based development

### Prompt
How would you set up feature flags for a full stack product so that features can be released gradually, tested with a subset of users, and switched off instantly, consistently across the frontend and backend?

### Answer
#### What the interviewer is really testing
- Understanding **flag types** (release, experiment, ops/kill switch, permission) and their lifecycles.
- **Consistent evaluation** across server, client and edge for the same user.
- **Deterministic percentage rollouts** (hashing user ids), targeting rules and sticky assignment.
- **Performance and resilience**: local evaluation, defaults when the flag service is down, no flicker.
- **Flag debt**: cleaning up old flags, testing both paths.
- Linking flags to **observability** for safe rollouts.

#### Key points
- **Release flags** decouple deploy from release (trunk-based development); **experiment flags** split traffic for A/B tests; **ops flags / kill switches** turn off risky parts; **permission flags** gate plan features (often better modelled as entitlements).
- Evaluate with **SDKs that cache rules locally** and stream updates (LaunchDarkly, Unleash, Flagsmith, GrowthBook, Statsig, or a simple in-house service). No network call per evaluation.
- **Percentage rollouts** use a stable hash: `hash(flagKey + userId) % 100 < rollout%`, so the same user always gets the same result, and increasing the percentage only adds users.
- **Server-side evaluation first**: the server evaluates flags for the user and passes the resolved values to the client (in the HTML or an API response). Avoids flicker and keeps rules private.
- **Safe defaults** if flags can't be fetched: off for new features, on for kill switches of existing behaviour.
- **Monitor by variant**: errors and latency split by flag state; automated rollback if metrics degrade.
- **Lifecycle**: owner, expiry date, removal ticket; lint for stale flags.

#### Model answer
"I'd set up flags as a small platform with clear types, one evaluation model shared by client and server, and a cleanup process.

**Flag model.**
```ts
type Flag = { key: string; type: 'release' | 'experiment' | 'ops' | 'permission';
              owner: string; expiresAt?: string; defaultValue: boolean | string;
              rules: Rule[]; rollout?: { percent: number; salt: string } };
// Rule: { attribute: 'orgId' | 'plan' | 'country' | 'email', op: 'in' | 'eq', values: [...] , value }
```

**Evaluation.**
```ts
function evaluate(flag: Flag, ctx: { userId: string; orgId: string; plan: string; country: string }) {
  for (const rule of flag.rules) if (matches(rule, ctx)) return rule.value;   // targeting first
  if (flag.rollout) {
    const bucket = murmur3(`${flag.rollout.salt}:${ctx.orgId}`) % 100;      // B2B: bucket by org
    return bucket < flag.rollout.percent;
  }
  return flag.defaultValue;
}
```
- **Bucketing by org** in B2B products means everyone in a company sees the same UI; by user in consumer products.
- Increasing `percent` from 10 to 25 keeps the first 10% in and adds 15% more.

**Where flags are evaluated.**
- **Server**: the SDK holds rules in memory, updated via streaming or polling every few seconds. Request middleware builds the context once and evaluates the flags the request needs.
- **Client**: the server sends **resolved values** for client-relevant flags in the initial HTML (`window.__FLAGS__`) or via `GET /api/flags`. The client never sees targeting rules (which might reveal customer names or unreleased plans). Server-rendered pages already render the right variant, so there's no flicker.
- **Edge**: for A/B tests on cached pages, evaluate at the edge with the same function and rules, rewrite to a cached variant, and set a cookie so the client and origin agree.

**A rollout, step by step ('new checkout'):**
1. Merge code behind `new-checkout` (off) to main; deploy freely.
2. Turn on for internal staff (`email ends with @ourco.com`), then a beta customer list.
3. 5% → 25% → 50% → 100%, watching dashboards that split **checkout error rate, latency and conversion by flag variant**.
4. An alert on error-rate difference triggers automatic rollback to 0%.
5. At 100% for two weeks, delete the flag and the old code path (a ticket was created with the flag, with an expiry date).

**Resilience.** If the flag service is unreachable at startup, the SDK uses the last cached rules or the code defaults. Defaults are chosen so failure is safe: new features off, kill switches in the 'normal' position.

**Testing.** Unit tests for both branches of important flags; end-to-end suites run with the planned 'on' configuration before increasing rollout; a test helper to force flags in tests and in a dev toolbar."

#### Another worked example: a kill switch that saved an incident
"A recommendations widget on the product page called a new ML service. On Black Friday the service slowed to 5-second responses, which made product pages slow. Because the widget was behind an **ops flag** (`recs-enabled`), on-call turned it off in seconds: the server stopped calling the service and the UI rendered without the widget. No deploy, no rollback. Afterwards we added a timeout and circuit breaker so it degrades automatically, but the kill switch bought time. I'd put any non-essential dependency on a hot path behind one."

#### Step-by-step framework
1. **Define flag types** and their lifecycles.
2. **One evaluation function** with targeting rules and deterministic hashing.
3. **Server-side evaluation**, resolved values sent to the client; edge for cached variants.
4. **Local caching + streaming updates**; safe defaults.
5. **Progressive rollout** tied to metrics split by variant; auto-rollback.
6. **Testing both paths**; dev toolbar to force flags.
7. **Cleanup**: owners, expiry, stale-flag reports.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `if (Math.random() < 0.1)` | Deterministic hashing; sticky, monotonic rollouts |
| Client fetches rules and evaluates (flicker, leaked rules) | Server evaluates and sends resolved values |
| Network call per evaluation | Local SDK cache with streamed updates |
| Flags live forever | Owners, expiry dates, removal tickets |
| Rollout by gut feel | Metrics split by variant, automatic rollback |
| No defaults for outages | Safe defaults per flag type |

#### Useful phrases
- "Flags decouple deploying code from releasing features."
- "Bucketing uses a stable hash, so users don't flip between variants."
- "The server evaluates flags and sends the results to the client, so there's no flicker and rules stay private."
- "Every rollout step is watched by metrics split by variant."
- "Each flag has an owner and an expiry date."

#### Common pitfalls
- **Flag debt**: hundreds of stale flags and dead code paths.
- **Inconsistent evaluation** between client and server, showing a feature the API rejects.
- **Flicker** from client-side evaluation after first render.
- **Combinatorial complexity**: interacting flags nobody has tested together.
- **Using flags for permanent plan entitlements** instead of a proper entitlement system.

#### Follow-ups to expect (with sample answers)
- **"Build or buy?"**
  "Buy (or use open-source Unleash/GrowthBook) unless flags are trivial; the value is in the UI, audit log, targeting, experiments and SDKs. Building a reliable streaming flag system is a real project."
- **"How do flags interact with database migrations?"**
  "Schema changes go out first and are backward compatible (expand); the flag switches code to the new schema; after 100%, the old path and columns are removed (contract)."
- **"How do you run an A/B test properly?"**
  "Define the hypothesis and primary metric up front, compute sample size, randomise by a stable unit, avoid peeking, and analyse with the experiment platform's statistics."
- **"How do mobile apps handle flags?"**
  "Fetch resolved flags at launch, cache them, and apply on next launch or at safe points to avoid UI changing mid-session; old app versions need defaults that still work."

#### What senior interviewers look for
- **Consistency and determinism** across layers.
- **Operational safety**: kill switches, defaults, auto-rollback.
- **Lifecycle discipline** to avoid flag debt.
- Linking flags to **observability and experimentation**.

#### Practise it
1. Implement the evaluation function with hashing and write tests that rollouts are sticky and monotonic.
2. Wire a flag into an SSR page so the client receives resolved values; confirm no flicker.
3. Build a dashboard panel showing error rate split by flag variant.
4. Explain to a friend the difference between release, experiment and ops flags.

## Designing for offline and flaky networks end to end
- id: fs-arch-12
- round: FULLSTACK_ARCHITECTURE
- difficulty: hard
- levels: senior, staff
- tags: offline, PWA, service worker, resilience, retries, optimistic UI, sync

### Prompt
Users of your web app often work on trains, in warehouses or on poor mobile connections. How would you design the frontend and backend so the app stays usable when the network is slow, flaky or gone?

### Answer
#### What the interviewer is really testing
- Thinking about **network failure as normal**, not an exception.
- A layered approach: **app shell caching**, **data caching**, **offline writes**, **sync and conflicts**, **server idempotency**.
- **Service worker strategies** (cache-first, network-first, stale-while-revalidate) and their trade-offs.
- **Backend support**: idempotent APIs, retries, timeouts, conflict detection, delta sync.
- **UX honesty**: showing sync state, pending changes, and recovering from conflicts.

#### Key points
- **Degrees of offline support**: (1) resilient online (timeouts, retries, good errors); (2) offline read (cached shell and data); (3) offline write (queued mutations, optimistic UI); (4) full local-first (local database as source for the UI, background sync).
- **App shell**: a service worker precaches HTML/JS/CSS so the app opens without a network (Workbox or framework PWA plugins).
- **Data caching**: persist the client query cache (IndexedDB) so the last-known data shows instantly; stale-while-revalidate for API calls.
- **Offline writes**: an **outbox** of mutations in IndexedDB, each with a client-generated id and **idempotency key**; replayed in order when online.
- **Backend**: idempotent endpoints (idempotency keys or upserts by client ids), **version checks** for conflicts, **delta sync** endpoints (`changes since cursor`), sensible timeouts.
- **Network handling**: timeouts on every request (a slow network is worse than an offline one), retries with exponential backoff for idempotent operations, `navigator.onLine` only as a hint.
- **UX**: a clear status ('Offline — changes will sync', 'Syncing 3 changes', 'All changes saved'), pending markers on unsynced items, conflict resolution UI.

#### Model answer
"I'd design for flaky networks in layers and pick the level the product needs. For a warehouse stock-taking app, that's level 3: users must record counts offline.

**1. Resilient requests (every app).**
- Every fetch has a **timeout** (e.g. 10 s) via `AbortSignal.timeout`; hanging requests are worse than failures.
- **Retries** with exponential backoff and jitter, only for idempotent requests (GET, PUT with idempotency keys).
- Errors distinguish 'you're offline', 'server error' and 'validation error', each with a clear message and Retry.

**2. Offline app shell.**
- A service worker **precaches** the built assets and the app shell HTML; navigation requests are served from cache when the network fails. New versions install in the background and activate on next load (with an 'Update available' prompt).

**3. Offline reads.**
- The TanStack Query cache is **persisted to IndexedDB**, so reopening the app shows the last-known data instantly, marked with 'Last updated 2 hours ago' when stale.
- Reference data (product catalogue, locations) is synced proactively when online so it's available offline.
- API GETs use stale-while-revalidate at the service worker or query-cache level.

**4. Offline writes.**
```ts
// recording a stock count
const count = { id: crypto.randomUUID(), locationId, sku, qty, countedAt: new Date().toISOString(), baseVersion };
await db.transaction('rw', db.counts, db.outbox, async () => {
  await db.counts.put({ ...count, pending: true });
  await db.outbox.add({ opId: crypto.randomUUID(), type: 'count.create', payload: count });
});
syncSoon();
```
- The UI reads from the local store, so the count appears immediately with a 'pending' marker.
- A sync loop replays the outbox **in order** when online (triggered by `online` events, app start, a timer, and Background Sync where supported). Each op is sent with its `opId` as an **idempotency key**; on success, the op is removed and the record marked synced.
- Failures: network errors → retry later with backoff; `409 Conflict` → mark the record conflicted and show it in a 'Needs attention' list; `422` → show the validation error on that item.

**5. Backend support.**
```
POST /counts          Idempotency-Key: <opId>   body includes client-generated id
GET  /sync?since=<cursor>                       returns changes since cursor + next cursor
PATCH /items/:id      { ..., baseVersion }      409 if the version moved
```
- **Client-generated UUIDs** mean retries can't create duplicates (insert `ON CONFLICT (id) DO NOTHING` or idempotency records).
- **Version checks** detect conflicting edits; for append-only data like counts, conflicts are rare by design (each count is a new record; the server computes the current stock).
- **Delta sync** by server-side sequence cursor, so returning devices fetch only what changed.

**6. UX.**
- A status indicator in the header: 'Offline · 12 changes waiting', 'Syncing…', 'All changes saved'.
- Warn before logging out with pending changes.
- Conflicts presented with both values and a clear choice, not silently overwritten.

**Data modelling tip.** Designing data as **append-only events** where possible (counts, comments, check-ins) avoids most conflicts; mutable shared fields are where conflicts live."

#### Another worked example: 'slow 3G' rather than offline
"Many users aren't offline, they're on a connection with 2-second latency and packet loss. Improvements: reduce round trips (one aggregated request per screen instead of six), compress and trim payloads, prefetch the next likely screen, show skeletons immediately, make mutations optimistic so the UI never waits for a round trip, and set timeouts that fail fast to the offline path. Testing with DevTools 'Slow 3G' and real devices usually reveals spinner chains that were invisible on office Wi-Fi."

#### Step-by-step framework
1. **Choose the level** of offline support the product needs.
2. **Resilient requests**: timeouts, retries, error types.
3. **App shell** precached by a service worker; update flow.
4. **Persist data caches**; proactively sync reference data.
5. **Outbox for writes** with client ids and idempotency keys.
6. **Backend**: idempotent endpoints, versions, delta sync.
7. **Conflict policy** and append-only modelling.
8. **Honest UX** about sync state; test with throttling and real devices.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Show an error when offline" | Layered offline support matched to the product |
| Relies on `navigator.onLine` | Timeouts and real failure handling; `onLine` as a hint |
| Retries POSTs blindly | Idempotency keys and client-generated ids |
| Writes lost when the tab closes | Durable IndexedDB outbox |
| Silent overwrites on reconnect | Version checks and a conflict UI |
| No sync status | Clear pending/syncing/saved indicators |

#### Useful phrases
- "A slow network is the common case, so every request has a timeout."
- "Writes go to a local outbox first, with ids generated on the client."
- "The server makes retries safe with idempotency keys."
- "Modelling data as append-only events avoids most conflicts."
- "The UI always tells the user whether their changes are saved."

#### Common pitfalls
- **Service worker update bugs** leaving users on old versions forever.
- **Caching authenticated API responses** in shared caches.
- **Unbounded IndexedDB growth** or ignoring storage eviction.
- **Out-of-order replay** creating inconsistent server state.
- **Hiding pending state**, so users think data was saved when it wasn't.

#### Follow-ups to expect (with sample answers)
- **"How do you handle authentication expiring while offline?"**
  "Keep queued operations; when back online, refresh the session (or prompt for login) before replaying. Never drop the outbox on a 401."
- **"Which service worker caching strategy for which resources?"**
  "Precache/cache-first for hashed assets, network-first with cache fallback for HTML navigations, stale-while-revalidate for non-critical GETs, network-only for mutations."
- **"How do you test offline behaviour?"**
  "Playwright with `context.setOffline(true)`, network throttling, killing the server mid-sync, and reload tests to ensure the outbox survives."
- **"When is full local-first worth it?"**
  "When users spend long periods offline or the app must feel instant everywhere (notes, field work). It adds sync and conflict complexity, so I'd consider sync engines like Replicache, PowerSync or ElectricSQL."

#### What senior interviewers look for
- **Matching effort to need** (not everything must be local-first).
- **End-to-end thinking**: client outbox and server idempotency together.
- **Data modelling** that reduces conflicts.
- **Clear UX** for sync state.

#### Practise it
1. Add a service worker to an app with Workbox and confirm it opens offline.
2. Implement an IndexedDB outbox and an idempotent endpoint; go offline, make changes, reload, come back online.
3. Test the app with Slow 3G and fix the worst spinner chain.
4. Explain to a friend why client-generated ids make retries safe.
