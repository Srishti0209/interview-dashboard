# Backend Engineer — System Design

## How do you approach a system design interview?
- id: be-design-01
- roles: backend, fullstack
- round: BE_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: system design, framework, interview technique

### Prompt
You're given an open-ended prompt like "Design Twitter" or "Design a payment system" with 45 minutes. How do you structure your approach?

### Answer
#### What the interviewer is really testing
- Whether you can take a **vague problem** and turn it into a **clear, scoped design**.
- Your ability to **reason about trade-offs** (consistency vs availability, cost vs latency), not to recite a "correct" architecture.
- **Communication**: can the interviewer follow your thinking, and do you invite input?
- **Depth on demand**: can you go deep on the part they care about (data model, scaling, failure handling)?
- At senior/staff level: **judgement**, operational maturity and awareness of organisational constraints.

#### Key points
- There's no single right answer. A clear structure and explicit trade-offs score far more than a buzzword-heavy diagram.
- Spend the first **5–8 minutes on requirements and scope**. Most weak answers skip this.
- Separate **functional** requirements (what it does) from **non-functional** ones (scale, latency, availability, consistency, durability, cost).
- Do a **quick capacity estimate** to justify design choices (e.g. "~6k writes/sec means one database won't be enough").
- Start with a **simple high-level design**, then **deep-dive** on 1–2 components, then cover **bottlenecks, failure modes and scaling**.
- **Think out loud**, state assumptions, and check in with the interviewer regularly.

#### Model answer
"I use a consistent structure, roughly timed for a 45-minute interview.

**1. Clarify requirements (5–8 minutes).**
I'd ask questions until the problem is scoped. For 'design a URL shortener', for example:
- *Functional*: create short links, redirect, custom aliases? Expiry? Analytics?
- *Non-functional*: how many links created per day, how many redirects? Latency target for redirects? How long do links live? Is it OK if analytics are slightly delayed?
- *Out of scope*: I'd explicitly park things like user accounts or spam detection unless the interviewer wants them.

I write the agreed requirements somewhere visible, because I'll refer back to them when making trade-offs.

**2. Estimate scale (3–5 minutes).**
Rough numbers drive design. E.g. 100M new links/month ≈ 40 writes/sec average; with a 100:1 read ratio ≈ 4,000 reads/sec, maybe 10× at peak. Storage: 100M × 12 months × 5 years × ~500 bytes ≈ 3 TB. That tells me reads dominate (so caching matters) and storage is modest.

**3. Define the API and data model (5 minutes).**
- API: `POST /links {long_url, alias?, expires_at?} → {short_code}` and `GET /{short_code} → 301/302 redirect`.
- Core table: `links(short_code PK, long_url, owner_id, created_at, expires_at)`.

Getting the API right early forces clarity about what the system actually does.

**4. High-level design (5–10 minutes).**
Draw the main components and the request flow:

```
Client → Load balancer → App servers → Cache (Redis) → Database
                               ↓
                         Analytics queue → Analytics store
```

I'd walk through one write and one read end to end.

**5. Deep dive (10–15 minutes).**
Pick the most interesting or risky parts, ideally asking the interviewer which they prefer: here, how to generate unique short codes, and how to keep redirects fast and available. I'd compare options (hash + collision check vs counter + base62 encoding vs pre-generated key ranges), choose one, and explain why.

**6. Bottlenecks, failures and scaling (5 minutes).**
- What happens if the cache goes down? (Fall back to the database; protect it with rate limits.)
- What if a link goes viral? (Hot keys: cache with long TTL, CDN for redirects.)
- How does it scale 10×? (Read replicas, sharding by short code, more cache nodes.)
- Monitoring: redirect latency, error rates, cache hit ratio.

**7. Summarise (1–2 minutes).**
Recap the design, the key trade-offs I made, and what I'd do next with more time.

Throughout, I think out loud and check in: 'Does this level of detail work, or would you like me to go deeper on storage?'"

#### Another worked example: applying the structure to "design a notification system"
"- **Requirements**: send email, SMS and push notifications triggered by other services; user preferences and quiet hours; at-least-once delivery; ~10M notifications/day with spikes during campaigns.
- **Estimate**: 10M/day ≈ 115/sec average, but campaign spikes might hit 5,000/sec, so the design must absorb bursts.
- **API**: `POST /notifications {user_id, type, template_id, data, priority}`.
- **High level**: producers → notification service (validates, applies preferences) → queue per channel → channel workers → providers (SES, Twilio, APNs/FCM) → delivery status store.
- **Deep dive**: queues decouple spikes from provider rate limits; idempotency keys prevent duplicates on retry; priorities ensure password resets aren't stuck behind marketing emails.
- **Failures**: provider outage → retry with backoff, fail over to a secondary provider for critical messages.

Same structure, different system. The structure is what makes you look calm and senior."

#### Step-by-step framework
| Step | Time (45 min) | Output |
|---|---|---|
| 1. Requirements | 5–8 min | Functional, non-functional, out of scope |
| 2. Estimation | 3–5 min | QPS, storage, bandwidth, read/write ratio |
| 3. API & data model | ~5 min | Endpoints, core entities |
| 4. High-level design | 5–10 min | Components and request flow |
| 5. Deep dive | 10–15 min | 1–2 components in detail with trade-offs |
| 6. Bottlenecks & failures | ~5 min | Scaling, failure handling, monitoring |
| 7. Summary | 1–2 min | Recap and next steps |

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Starts drawing boxes immediately | Clarifies requirements and scope first |
| "We'll use Kafka, Kubernetes and microservices" | Chooses components because of requirements |
| No numbers | Quick estimates justify decisions |
| One option presented as the answer | Compares options and explains trade-offs |
| Ignores failures | Discusses failure modes, monitoring and recovery |
| Monologue | Thinks out loud and checks in with the interviewer |

#### Useful phrases
- "Before I design anything, let me make sure I understand the requirements."
- "I'll assume about 100M new items a month. Does that sound reasonable?"
- "Reads outnumber writes by about 100 to 1, so caching will be important."
- "There are two main options here; I'd choose the second because…"
- "Which part would you like me to go deeper on?"
- "If this component fails, here's what happens…"

#### Common pitfalls
- **Skipping requirements** and designing the wrong system.
- **Over-engineering**: microservices and global multi-region for a system with 50 requests/second.
- **Buzzword architecture** with no justification.
- **Going too deep too early** on one detail and running out of time.
- **Ignoring non-functional requirements** like availability and consistency.
- **Not managing time**: never reaching scaling or failure handling.

#### Follow-ups to expect (with sample answers)
- **"How would this change at 100× scale?"**
  "Identify which component breaks first, usually the database or a hot partition, then add caching, read replicas, sharding or asynchronous processing as appropriate."
- **"What would you monitor?"**
  "The golden signals for each service (latency, traffic, errors, saturation), plus business metrics like successful redirects or notifications delivered."
- **"Why did you choose SQL over NoSQL here?"**
  "Because the data is relational and the scale fits comfortably with replication and later sharding; I'd switch if access patterns or scale demanded it."
- **"What would you do differently with more time?"**
  "Cover areas I parked: security, multi-region failover, cost, and a detailed data retention policy."

#### What senior interviewers look for
- **Driving the conversation** with structure while adapting to the interviewer's interests.
- **Operational maturity**: deployment, monitoring, on-call, data migrations.
- **Pragmatism**: the simplest design that meets requirements, with a clear path to scale.
- At **staff** level: cross-team implications, build-vs-buy, cost and long-term evolution.

#### Practise it
1. Pick three prompts (URL shortener, chat app, notification system) and run each against the 7-step framework with a **45-minute timer**, out loud.
2. Record yourself and check: did I clarify requirements? Did I estimate? Did I compare options? Did I cover failures?
3. Practise drawing a clean high-level diagram in under 3 minutes.
4. Do at least one mock with a friend who interrupts with "why?" and "what if this fails?"

## Back-of-the-envelope capacity estimation
- id: be-design-02
- roles: backend, fullstack
- round: BE_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: estimation, capacity planning, scalability

### Prompt
Estimate the storage, throughput and bandwidth needed for a photo-sharing service with 50 million daily active users. Walk me through your numbers.

### Answer
#### What the interviewer is really testing
- Whether you can produce **reasonable numbers quickly** with clear assumptions.
- Whether you know **useful reference values** (seconds per day, typical object sizes, latency numbers).
- Whether you can **use the numbers to make design decisions**, not just calculate.
- Comfort with **orders of magnitude** rather than false precision.

#### Key points
- Useful constants: **~86,400 seconds/day ≈ 10⁵**; **1 million requests/day ≈ 12/sec**; **1 billion/day ≈ 12,000/sec**.
- Data units: KB = 10³, MB = 10⁶, GB = 10⁹, TB = 10¹², PB = 10¹⁵ bytes (approximate powers of ten are fine).
- Estimate **average** and **peak** (often 2–10× average).
- Consider **reads vs writes**, **storage growth over time**, **replication** and **bandwidth**.
- Round aggressively and **state assumptions** out loud.
- Finish with **implications**: "we need a CDN", "a single database won't fit", "cache the top 20%".

#### Model answer
"I'll state assumptions as I go and round generously.

**Assumptions:**
- 50M daily active users (DAU).
- 10% of DAU upload one photo a day → **5M uploads/day**.
- Each user views about 50 photos a day → **2.5B photo views/day**.
- Average photo after compression: **~2 MB** original, plus thumbnails (~200 KB total for several sizes).
- Keep photos forever; plan for **5 years**.

**Throughput:**
- Uploads: 5M / 86,400 ≈ **~60 writes/sec** average; peak maybe **~300/sec**.
- Views: 2.5B / 86,400 ≈ **~30,000 reads/sec** average; peak **~100,000/sec**.
- Read:write ratio ≈ 500:1. This is a **read-heavy** system.

**Storage:**
- Per day: 5M × ~2.2 MB ≈ **11 TB/day**.
- Per year: 11 TB × 365 ≈ **4 PB/year**.
- 5 years: **~20 PB**, before replication. With 3× replication (or erasure coding at ~1.5×), **30–60 PB** of raw capacity.
- Metadata (photo ID, user, caption, timestamps): ~1 KB × 5M/day ≈ 5 GB/day ≈ **~9 TB over 5 years**. That fits in a sharded database comfortably.

**Bandwidth:**
- Upload: 60/sec × 2 MB ≈ **120 MB/s** average.
- Download: if most views load a ~200 KB feed-sized image, 30,000/sec × 200 KB ≈ **6 GB/s** average, much more at peak.

**Design implications:**
1. **Object storage** (e.g. S3-style) for image files, not a database: petabyte scale and cheap.
2. **CDN is essential**: 6+ GB/s of image traffic must be served from edge caches, not origin servers.
3. **Generate multiple sizes** at upload time (thumbnail, feed, full), so clients download small images most of the time. That's a big bandwidth saving.
4. **Metadata database** must handle ~30k reads/sec: caching (popular photos and feeds) plus read replicas, and sharding by user ID or photo ID as data grows.
5. **Upload path** at a few hundred writes/sec is modest; processing (resizing) can be **asynchronous** via a queue.
6. **Cost**: storage dominates long-term cost, so consider tiering older, rarely viewed photos to cheaper storage classes."

#### Another worked example: a chat service
"Assume 20M DAU, each sending 40 messages a day:
- **Messages**: 800M/day ≈ **~9,000 writes/sec** average, peak ~30,000/sec.
- **Message size**: ~200 bytes including metadata → 800M × 200 B ≈ **160 GB/day** ≈ 60 TB/year.
- **Connections**: if 25% of DAU are online at peak, **5M concurrent connections**. At, say, 50k connections per server, that's ~100 connection servers.
- **Implications**: write-heavy storage optimised for appends (e.g. a wide-column store partitioned by conversation), a dedicated connection-gateway layer, and fan-out to group members as the main scaling challenge."

#### Reference numbers worth memorising
| Item | Approximate value |
|---|---|
| Seconds in a day | 86,400 (~10⁵) |
| 1M requests/day | ~12 requests/sec |
| 1B requests/day | ~12,000 requests/sec |
| Typical text record | 100 B – 1 KB |
| Compressed photo | 200 KB – 3 MB |
| 1 minute of HD video | ~50–100 MB |
| Memory read (main memory) | ~100 ns |
| SSD random read | ~100 µs |
| Round trip within a data centre | ~0.5 ms |
| Round trip across continents | ~100–150 ms |

#### Step-by-step framework
1. **State user numbers and behaviour** (DAU, actions per user).
2. **Compute requests/day**, then **per second** (÷ ~10⁵), with **peak** multiplier.
3. **Estimate object sizes** and **storage per day → per year → total**, including replication.
4. **Estimate bandwidth** for reads and writes.
5. **Estimate memory for caching** if relevant (e.g. cache the hottest 20%).
6. **Draw conclusions** that shape the design.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Silent calculation | States each assumption out loud |
| Precise numbers like 57,870.37/sec | Rounded orders of magnitude |
| Average only | Average and peak |
| Forgets replication and growth | Includes replication and multi-year growth |
| Stops at the numbers | Uses numbers to justify CDN, sharding, caching |

#### Useful phrases
- "I'll round 86,400 seconds to about 100,000 to keep the maths simple."
- "Let's assume a peak of about 3–5× the average."
- "That's roughly 20 PB over five years before replication."
- "These numbers tell me this is read-heavy, so a CDN and caching are essential."

#### Common pitfalls
- **Getting lost in arithmetic** and running out of time.
- **Mixing units** (bits vs bytes, MB vs MiB): approximate is fine, but be consistent.
- **Ignoring peaks**: systems fail at peak, not average.
- **Forgetting metadata vs blob storage** differences.
- **Not connecting estimates to design decisions.**

#### Follow-ups to expect (with sample answers)
- **"How much cache memory would you need?"**
  "If 20% of photos' metadata accounts for most reads, and daily active metadata is ~50M items × 1 KB = 50 GB, caching 20% is ~10 GB, which fits on a small Redis cluster."
- **"What if uploads double?"**
  "Storage growth doubles, which matters most for cost; throughput is still modest, so the upload path barely changes."
- **"Why not store images in the database?"**
  "Databases are expensive and inefficient for large blobs at petabyte scale; object storage plus a CDN is cheaper, more durable and built for this."

#### What senior interviewers look for
- **Speed and confidence** with estimates.
- Turning numbers into **architecture and cost decisions**.
- Awareness of **growth, replication, tiering and regional distribution**.

#### Practise it
1. Estimate QPS, storage and bandwidth for: a URL shortener (100M links/month), a video platform (1M uploads/day), and a ride-sharing location service (1M drivers sending GPS every 4 seconds).
2. Time yourself: aim for under 5 minutes each, out loud.
3. For each, write three design decisions the numbers justify.

## Design a URL shortener
- id: be-design-03
- roles: backend, fullstack
- round: BE_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: system design, hashing, caching, key generation

### Prompt
Design a URL shortening service like bit.ly. Users submit a long URL and get a short link; visiting the short link redirects to the original.

### Answer
#### What the interviewer is really testing
- **Requirement gathering** on a seemingly simple problem.
- **Unique ID generation** strategies and their trade-offs.
- **Read-heavy design**: caching, CDN, database choice.
- **Scaling** and **failure handling** for a system that must be extremely available.

#### Key points
- Very **read-heavy** (often 100:1 or more). Redirects must be **fast** (<10–50 ms) and **highly available**.
- Short codes: **base62** (a–z, A–Z, 0–9). 7 characters give 62⁷ ≈ **3.5 trillion** combinations.
- Code generation options: **hash + truncate** (collision handling), **global counter + base62**, **pre-generated key ranges** per server (key generation service).
- **301 vs 302**: 301 (permanent) is cached by browsers (less load, but loses analytics visibility); 302 (temporary) hits your servers every time.
- **Cache** hot links (Redis), possibly serve redirects from a **CDN/edge**.
- Analytics via an **asynchronous pipeline**, not in the redirect path.

#### Model answer
"**1. Requirements**
- Functional: create a short link for a long URL; redirect; optional custom alias; optional expiry; basic click analytics.
- Non-functional: redirect latency under ~50 ms at p99; very high availability for redirects (99.99%); links shouldn't be guessable sequentially (to prevent scraping); durability. Analytics can be eventually consistent.
- Scale assumption: 100M new links/month, 10B redirects/month.

**2. Estimates**
- Writes: 100M/month ≈ **~40/sec**, peak ~200/sec.
- Reads: 10B/month ≈ **~4,000/sec**, peak ~20,000/sec.
- Storage: 100M × 12 × 5 years = 6B links × ~500 B ≈ **3 TB**. Easily manageable.

**3. API**
```
POST /api/links
  { "long_url": "...", "custom_alias": "optional", "expires_at": "optional" }
  → 201 { "short_url": "https://sho.rt/aZ3kP9q" }

GET /{code} → 302 Location: <long_url>   (404 if unknown, 410 if expired)
```

**4. Data model**
```
links(code PK, long_url, owner_id, created_at, expires_at)
```
A key-value access pattern (look up by code) suits either a relational database (with the code as primary key) or a key-value store like DynamoDB/Cassandra. At 3 TB and ~20k reads/sec with caching, a sharded relational database or a managed key-value store both work. I'd pick a **key-value store** for simple horizontal scaling.

**5. High-level design**
```
           ┌──────────── write path ─────────────┐
Client → LB → API servers → Key generator → DB (code → long_url)
           │
           └─ read path: LB → Redirect service → Redis cache → DB (on miss)
                                   │
                                   └→ click events → Queue → Analytics workers → Analytics DB
```

**6. Deep dive: generating short codes**
- **Option A: hash (e.g. MD5/SHA-256) of the long URL, take the first 7 base62 characters.** Simple, and the same URL gives the same code. But collisions are possible, so each insert needs a check-and-retry. Also, two users shortening the same URL share a link, which may break per-user analytics.
- **Option B: global auto-increment counter → base62.** No collisions, very short codes. But a single counter is a bottleneck and single point of failure, and sequential codes are guessable.
- **Option C: key generation service (KGS).** A service pre-allocates ranges of IDs (e.g. 1,000,000 at a time) to each API server. Servers encode IDs in base62, optionally after a reversible scramble (e.g. multiply by a large odd number modulo 62⁷ or use a simple bijective cipher) so codes aren't sequential.

I'd choose **Option C**: no collisions, no per-request coordination, horizontally scalable, and non-guessable with scrambling. If a server crashes, the unused part of its range is simply lost, which is fine given trillions of possible codes.

Custom aliases: check availability with a conditional insert (`INSERT IF NOT EXISTS`); reserve a namespace so they never clash with generated codes (e.g. generated codes are exactly 7 characters, aliases must be 8+).

**7. Deep dive: fast, available redirects**
- **Cache**: Redis with LRU eviction holding hot codes. With a power-law distribution, a small cache gives a very high hit ratio.
- **302 vs 301**: I'd use **302** so every click reaches us (for analytics and the ability to update or disable links), and rely on caching for speed. If analytics weren't needed, 301 would reduce load further.
- **Edge**: for global users, deploy redirect services in multiple regions, or use edge functions with a replicated key-value store.
- **Analytics** are written to a queue (fire-and-forget) so the redirect never waits on analytics storage.

**8. Failures and scaling**
- Cache down → read from DB; protect it with connection limits and rate limiting.
- DB partitioned by code (hash), replicated across availability zones.
- Abuse: rate-limit link creation per user/IP, scan long URLs against malware/phishing lists.
- Expiry: lazy check on read, plus a background job to clean up expired links."

#### Another worked example: changing one requirement
"If the interviewer says 'every link must be unique per user, and we need per-user click stats', hashing the URL alone fails (same URL from two users collides). The KGS approach handles this naturally, because each creation gets a new ID. If they add 'links must be editable after creation', 302 becomes mandatory, because browsers would cache a 301 permanently."

#### Code generation options compared
| Approach | Collisions | Coordination | Guessable | Notes |
|---|---|---|---|---|
| Hash + truncate | Possible (retry) | None | No | Same URL → same code |
| Global counter | None | Every write | Yes | Bottleneck / SPOF |
| Key ranges (KGS) | None | Per range | No (if scrambled) | Scales horizontally |
| Random code + check | Rare (retry) | None | No | Simple; needs uniqueness check |

#### Step-by-step framework
1. Requirements and scale (stress read-heaviness and availability).
2. Estimates.
3. API and data model.
4. High-level design with separate read and write paths.
5. Deep dive: code generation.
6. Deep dive: redirect performance (cache, 301/302, edge).
7. Analytics pipeline, abuse prevention, failures.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Hash the URL" with no collision handling | Compares hashing, counters and key ranges |
| Analytics written synchronously on redirect | Asynchronous analytics pipeline |
| No mention of 301 vs 302 | Explains the trade-off |
| Ignores abuse | Rate limiting and malicious URL checks |
| Single database, no cache | Cache with high hit ratio, partitioned storage |

#### Useful phrases
- "This system is extremely read-heavy, so the redirect path is where I'll focus."
- "Seven base62 characters give us about 3.5 trillion codes."
- "I'd pre-allocate ID ranges to each server so there's no coordination per request."
- "Analytics shouldn't slow down redirects, so they go through a queue."

#### Common pitfalls
- **Ignoring collisions** with hash-based codes.
- **A single global counter** as a bottleneck.
- **Synchronous analytics** in the hot path.
- **No caching** for a read-heavy workload.
- **Forgetting custom aliases, expiry and abuse.**

#### Follow-ups to expect (with sample answers)
- **"How do you prevent people enumerating all links?"**
  "Non-sequential codes (scrambled IDs or random codes), rate limiting, and not exposing private links in any listing."
- **"How would you handle a link that suddenly gets 1M clicks a minute?"**
  "It'll be cached in Redis and at the edge; I'd ensure hot keys are replicated across cache nodes and consider a local in-process cache on redirect servers."
- **"How do you delete a link immediately?"**
  "Delete it in the database and invalidate the cache key, which is one reason to prefer 302 over 301."
- **"How would you store analytics?"**
  "Raw click events in a queue, aggregated by stream processors into a time-series or columnar store for dashboards."

#### What senior interviewers look for
- Clear reasoning on **ID generation** trade-offs.
- **Operational thinking**: abuse, expiry, cache invalidation, multi-region.
- **Right-sizing**: not over-engineering a 40 writes/sec system.

#### Practise it
1. Draw the read and write paths in under 5 minutes.
2. Explain base62 and why 7 characters are enough.
3. Practise defending your ID generation choice against two alternatives, out loud.

## Design a distributed rate limiter
- id: be-design-04
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: rate limiting, algorithms, Redis, distributed systems

### Prompt
Design a rate limiter that limits each API client to N requests per minute, across a fleet of API servers.

### Answer
#### What the interviewer is really testing
- Knowledge of **rate limiting algorithms** and their trade-offs.
- How to keep **shared state consistent** across many servers with low latency.
- Handling **race conditions** (atomic operations).
- **Failure behaviour**: what happens when the rate-limit store is unavailable?

#### Key points
- Algorithms:
  - **Fixed window counter**: simple; allows bursts at window edges (up to 2× limit).
  - **Sliding window log**: precise; stores every timestamp, so memory-heavy.
  - **Sliding window counter**: approximates sliding windows using two fixed windows; good balance.
  - **Token bucket**: allows controlled bursts; tokens refill at a fixed rate. Very common.
  - **Leaky bucket**: smooths output to a constant rate (queue-like).
- Where to enforce: **API gateway / middleware** in front of services.
- Shared state in a fast store like **Redis**, updated **atomically** (Lua scripts or atomic increments).
- Return **HTTP 429** with `Retry-After` and rate-limit headers.
- Decide **fail-open vs fail-closed** when the store is down.

#### Model answer
"**1. Requirements**
- Limit each client (API key) to N requests per minute, e.g. 1,000/min, with different limits per plan.
- Works across ~50 API servers.
- Adds minimal latency: under ~2 ms per request.
- Highly available: the rate limiter must not take the API down.
- Clear feedback to clients: 429 status, headers showing remaining quota and reset time.

**2. Algorithm choice**
I'd use a **token bucket**:
- Each client has a bucket with capacity C (allowing bursts) and a refill rate R tokens/sec (e.g. 1,000/min ≈ 16.7/sec).
- Each request takes one token; if none are left, reject with 429.
- It allows short bursts (good for real clients) while enforcing the average rate.

An alternative is the **sliding window counter**, which estimates the count in the last 60 seconds as `current_window_count + previous_window_count × (overlap fraction)`. It's memory-cheap and avoids fixed-window edge bursts.

**3. Where state lives**
- A **Redis cluster** stores each client's bucket: `{tokens, last_refill_timestamp}`.
- Each API server calls Redis on every request. To avoid race conditions between servers, the read-modify-write happens **atomically in a Lua script** on Redis:

```lua
-- KEYS[1] = bucket key; ARGV = capacity, refill_rate_per_ms, now_ms
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local capacity, rate, now = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local tokens = tonumber(b[1]) or capacity
local ts = tonumber(b[2]) or now
tokens = math.min(capacity, tokens + (now - ts) * rate)
local allowed = tokens >= 1
if allowed then tokens = tokens - 1 end
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], 120000)
return { allowed and 1 or 0, tokens }
```

- Keys are partitioned across Redis nodes by client ID, so load spreads naturally.

**4. Architecture**
```
Client → API gateway / middleware ──(Lua script)──► Redis cluster
                 │ allowed
                 ▼
            Backend services
```
Rate-limit configuration (limits per plan, per endpoint) lives in a config service and is cached in memory on each gateway node.

**5. Responses**
- Allowed: forward the request; add headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Rejected: `429 Too Many Requests` with `Retry-After`.

**6. Performance optimisations**
- Redis round trip within a data centre is ~0.5–1 ms, which is acceptable.
- For extremely high traffic, use a **hybrid**: each server keeps a small local token allowance and syncs with Redis periodically. It slightly over-admits but cuts Redis load dramatically.

**7. Failure handling**
- If Redis is unavailable: **fail open** (allow requests, with local in-memory limits as a backstop) for most APIs, because blocking all traffic is worse than briefly exceeding limits. For sensitive endpoints (e.g. login attempts, to prevent brute force), **fail closed** or use stricter local limits.
- Redis replication with automatic failover for availability.
- Monitor: rejection rates, Redis latency, and clients consistently hitting limits.

**8. Multi-region**
Per-region limits are simplest (each region gets a share of the quota). Global exact limits would need cross-region coordination, which adds latency, so I'd accept approximate global limits unless the business needs exactness."

#### Another worked example: protecting a login endpoint
"For login, the goal is stopping brute-force attacks, not fairness:
- Limit by **IP** and by **account** (e.g. 5 failed attempts per account per 15 minutes).
- Use a **sliding window** for precision, since limits are small.
- **Fail closed** if the store is down for this endpoint.
- Add progressive delays or CAPTCHA after repeated failures, and alert on unusual patterns."

#### Algorithms compared
| Algorithm | Bursts | Memory | Precision | Typical use |
|---|---|---|---|---|
| Fixed window | Up to 2× at edges | Very low | Low | Simple quotas |
| Sliding window log | Precise | High | Exact | Small limits, security |
| Sliding window counter | Smoothed | Low | Approximate | General APIs |
| Token bucket | Controlled bursts | Low | Good | Most public APIs |
| Leaky bucket | Smoothed output | Low | Good | Traffic shaping, queues |

#### Step-by-step framework
1. Requirements: limits, scope (per key/IP/endpoint), latency, availability.
2. Choose an algorithm and justify it.
3. Decide where to enforce (gateway/middleware).
4. Shared state and atomicity (Redis + Lua).
5. Client feedback (429, headers).
6. Performance (local allowances) and failure modes (fail open/closed).
7. Multi-region and monitoring.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Count requests in a database" | Fast in-memory store with atomic updates |
| One algorithm, no alternatives | Compares algorithms and trade-offs |
| Ignores race conditions | Uses atomic Lua scripts or atomic counters |
| No failure plan | Explicit fail-open vs fail-closed decisions |
| No client feedback | 429 with Retry-After and rate-limit headers |

#### Useful phrases
- "I'd use a token bucket because it allows short bursts while enforcing the average rate."
- "The check-and-decrement must be atomic, so I'd use a Lua script in Redis."
- "If Redis is down, I'd fail open for most APIs, but fail closed for login."
- "Clients get a 429 with Retry-After, so well-behaved clients can back off."

#### Common pitfalls
- **Race conditions** from non-atomic read-then-write.
- **Fixed windows** without acknowledging edge bursts.
- **Adding too much latency** (e.g. database calls per request).
- **Taking down the API** when the limiter's store fails.
- **Ignoring multi-region** behaviour.

#### Follow-ups to expect (with sample answers)
- **"How do you handle clock differences between servers?"**
  "Use Redis's own time (`TIME` command) inside the script, or pass timestamps from a single source, so all servers agree."
- **"How would you rate-limit by multiple dimensions (user, IP, endpoint)?"**
  "Check several buckets in one script call, rejecting if any is empty, with configuration defining which limits apply to which endpoints."
- **"What about distributed denial-of-service attacks?"**
  "Application rate limiting helps but isn't enough; DDoS protection belongs at the network edge (CDN/WAF) before traffic reaches our servers."

#### What senior interviewers look for
- **Algorithm trade-offs** and correctness under concurrency.
- **Operational judgement** on failure modes.
- **Product thinking**: fair limits per plan, good developer experience with clear headers.

#### Practise it
1. Explain the five algorithms in one sentence each.
2. Write the token bucket logic in your preferred language, then make it atomic for Redis.
3. Walk through the design out loud in 15 minutes, including failure modes.

## Design a news feed / timeline
- id: be-design-05
- roles: backend, fullstack
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: system design, fan-out, caching, feed ranking

### Prompt
Design the home timeline for a social network like Twitter/X or Instagram: users follow others and see a feed of recent posts from people they follow.

### Answer
#### What the interviewer is really testing
- Understanding of **fan-out on write vs fan-out on read** and the **celebrity problem**.
- **Caching** strategy for feeds.
- **Data modelling** for posts, follows and timelines.
- Trade-offs between **freshness, latency and cost**.

#### Key points
- **Fan-out on write (push)**: when a user posts, write the post ID into each follower's timeline cache. Fast reads, expensive writes for users with many followers.
- **Fan-out on read (pull)**: build the timeline when the user opens the app by fetching recent posts from everyone they follow. Cheap writes, slow reads.
- **Hybrid**: push for most users, **pull for celebrities** (accounts with millions of followers), merged at read time.
- Store timelines as **lists of post IDs** (e.g. in Redis), and **hydrate** with post content from a cache/database.
- Ranking can be chronological or **ranked** (relevance model), which adds a scoring step.

#### Model answer
"**1. Requirements**
- Users post short text/media; follow others; see a home timeline of recent posts from people they follow, newest first (ranking as a stretch goal).
- Non-functional: timeline loads in under ~200 ms; posts appear in followers' feeds within a few seconds (eventual consistency is acceptable); high availability.
- Scale: 300M DAU, average 200 follows, 100M posts/day, users open the feed ~10 times a day.

**2. Estimates**
- Post writes: 100M/day ≈ **~1,200/sec**, peak ~5,000/sec.
- Timeline reads: 300M × 10 = 3B/day ≈ **~35,000/sec**, peak ~100k/sec.
- Fan-out on write: average follower count ~200 → ~240k timeline inserts/sec on average, but celebrities with 50M followers make single posts extremely expensive.

**3. Data model**
```
users(id, name, ...)
posts(id, author_id, text, media_urls, created_at)        -- sharded by post id
follows(follower_id, followee_id, created_at)              -- indexed both ways
timeline cache: user_id → list of recent post ids (e.g. latest 800)
```
Post IDs are time-sortable (e.g. Snowflake-style: timestamp + machine ID + sequence), so sorting by ID sorts by time.

**4. High-level design**
```
Post:  Client → API → Post service → Posts DB
                         │
                         └→ Fan-out queue → Fan-out workers → Timeline cache (Redis lists)

Read:  Client → API → Timeline service → Timeline cache (post ids)
                                   │       + celebrity posts (pulled)
                                   └→ Post cache / DB (hydrate content) → ranked/merged feed
```

**5. Deep dive: fan-out strategy**
- For a normal user posting, a fan-out worker looks up their followers and pushes the post ID to each follower's timeline list (LPUSH + trim to N items). Reads are then a single fast cache lookup.
- For **celebrities** (say >1M followers), we skip fan-out. When a user loads their timeline, the timeline service fetches recent posts from the celebrities they follow (a small number per user) and merges them with their pushed timeline.
- **Inactive users**: don't fan out to users who haven't logged in for 30 days; rebuild their timeline on next login (pull). This saves a lot of work.

**6. Deep dive: reading and hydration**
- Timeline service gets ~50 post IDs from the cache, merges celebrity posts, then **hydrates** with a multi-get from a post cache (posts are immutable-ish, so cache well), plus author info and engagement counts.
- Pagination with a cursor (last post ID seen).

**7. Ranking (if required)**
- Candidate generation (the merged list) → feature lookup (engagement, recency, relationship strength) → scoring model → top-K. Ranking services must be fast; precompute features where possible.

**8. Failures and edge cases**
- Fan-out lag during spikes: the queue absorbs bursts; posts may appear a few seconds late, which is acceptable.
- Deleted posts: remove at read time during hydration (skip missing posts) rather than scrubbing millions of timelines immediately.
- Unfollow: filter at read time and lazily clean up.
- Cache loss: timelines can be rebuilt from the follows and posts data (pull), so the cache is not the source of truth."

#### Another worked example: a smaller-scale feed
"For a company intranet with 20,000 employees following teams and colleagues, a simple **fan-out on read** with good indexes is enough: query recent posts from followed IDs (`WHERE author_id IN (...) ORDER BY created_at DESC LIMIT 50`) with a short-lived cache per user. Fan-out infrastructure would be over-engineering. Recognising when the simple design is enough is part of the answer."

#### Fan-out strategies compared
| Strategy | Write cost | Read cost | Freshness | Best for |
|---|---|---|---|---|
| Fan-out on write | High (per follower) | Very low | Near real-time | Most users |
| Fan-out on read | Low | High | Real-time | Small scale, celebrities |
| Hybrid | Moderate | Low | Near real-time | Large social networks |

#### Step-by-step framework
1. Requirements (chronological vs ranked, freshness, scale).
2. Estimates, highlighting read/write imbalance and follower skew.
3. Data model with time-sortable IDs.
4. Fan-out strategy (push, pull, hybrid) and the celebrity problem.
5. Read path: cache, merge, hydrate, paginate.
6. Ranking (if needed).
7. Edge cases: deletes, unfollows, inactive users, cache rebuilds.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Query all followees' posts on every load" at huge scale | Explains push vs pull and chooses a hybrid |
| Ignores celebrities | Handles the celebrity problem explicitly |
| Stores full posts in every timeline | Stores IDs, hydrates from a post cache |
| No pagination | Cursor-based pagination |
| Ignores deletes and inactive users | Handles them efficiently |

#### Useful phrases
- "The core trade-off is fan-out on write versus fan-out on read."
- "For accounts with millions of followers, I'd pull their posts at read time instead of pushing."
- "Timelines store post IDs; we hydrate the content from a post cache."
- "The cache isn't the source of truth, so we can always rebuild a timeline."

#### Common pitfalls
- **Pure fan-out on write** without addressing celebrities.
- **Pure fan-out on read** at massive scale (slow, expensive reads).
- **Duplicating full post content** into millions of timelines.
- **Forgetting inactive users**, wasting fan-out work.
- **Ignoring consistency expectations** (a few seconds' delay is fine).

#### Follow-ups to expect (with sample answers)
- **"How do you decide who's a celebrity?"**
  "A follower-count threshold (tuned by measuring fan-out cost), possibly combined with posting frequency."
- **"How would you show new posts at the top while scrolling?"**
  "Poll or push a lightweight 'new posts available' signal, and fetch newer post IDs since the top cursor."
- **"How do you count likes at scale?"**
  "Write likes to a durable store, aggregate counts asynchronously, and cache approximate counts; exact counts aren't needed instantly."

#### What senior interviewers look for
- Clear grasp of **write amplification** and skew.
- Thoughtful **consistency and freshness** trade-offs.
- **Cost awareness** (memory for timeline caches, fan-out compute).

#### Practise it
1. Draw the post and read paths for the hybrid design in under 5 minutes.
2. Calculate fan-out writes per second for average users and for a 50M-follower celebrity.
3. Explain how you'd handle deletes, unfollows and inactive users, out loud in 3 minutes.
