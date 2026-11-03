# Backend Engineer — System Design (continued)

## Design a ride-sharing / location tracking service
- id: be-design-11
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: system design, geospatial, real-time, matching

### Prompt
Design the backend for a ride-sharing app like Uber: drivers share their location, riders request trips, and the system matches riders with nearby drivers.

### Answer
#### What the interviewer is really testing
- Handling **high-frequency location updates** efficiently.
- **Geospatial indexing** (geohash, quadtrees, H3) for "find nearby drivers".
- **Matching** under concurrency (one driver shouldn't be assigned to two riders).
- **Trip state management** and real-time updates to both parties.

#### Key points
- Drivers send GPS updates every **3–5 seconds**: a large, write-heavy stream. Keep **current location in memory** (e.g. Redis geo, in-memory grid), not in a relational database.
- **Geospatial index**: divide the map into cells (geohash, S2, or Uber's **H3** hexagons). Query the rider's cell and neighbouring cells for available drivers.
- **Matching service** picks candidates by distance/ETA and offers the trip; use **atomic reservation** so a driver can't accept two trips.
- **Trip service** manages a state machine: requested → driver assigned → arriving → in progress → completed/cancelled.
- Store **location history** asynchronously for trip records, billing and analytics.
- **Partition by region/city**, since most activity is local.

#### Model answer
"**1. Requirements**
- Drivers go online and share location; riders see nearby cars, request a ride, get matched, track the driver, pay at the end.
- Non-functional: matching within a few seconds; location updates visible to riders within ~1–2 seconds; high availability; no double-assignment of drivers.
- Scale: 1M active drivers sending an update every 4 seconds → **~250,000 location writes/sec**. Ride requests: say 10M/day ≈ ~120/sec, peaks of ~1,000/sec.

**2. High-level design**
```
Driver app ─(location every 4s)─► Location gateway ─► Location service ─► In-memory geo index (by city)
                                                              │
                                                              └─► Location stream → history store (async)
Rider app ─► Trip API ─► Matching service ─(find nearby)─► Geo index
                              │
                              └─► Trip service (state machine, DB) ─► notifications to rider/driver (WebSocket/push)
```

**3. Location updates**
- Driver apps send `{driver_id, lat, lng, heading, status, timestamp}` over a persistent connection or lightweight HTTP.
- Location service updates the driver's position in an **in-memory geo index** for that city (e.g. Redis `GEOADD`, or a custom grid of H3 cells → set of driver IDs).
- Old positions aren't needed in the hot path; updates also go to a **stream** (e.g. Kafka) consumed by a history store for trip records and analytics.

**4. Finding nearby drivers**
- Convert the rider's location to a cell; query that cell plus neighbouring rings for **available** drivers.
- Rank candidates by **ETA**, not just straight-line distance (a routing service provides road-network ETAs for the top few candidates).

**5. Matching and reservation**
- Matching service picks the best candidate and **atomically reserves** them: e.g. `SET driver:{id}:lock trip_id NX EX 15` in Redis, or a conditional update on the driver's status.
- The offer is sent to the driver; if they decline or don't respond within ~10–15 seconds, the lock expires and the next candidate is tried.
- This prevents two riders being assigned the same driver.

**6. Trip lifecycle**
- Trip service persists trips in a strongly consistent database with a **state machine**; transitions are validated (e.g. can't start a trip that's been cancelled).
- During the trip, the rider app subscribes to the driver's location updates (pushed via WebSocket from the location service).

**7. Scaling and partitioning**
- Partition the geo index and matching by **city/region**: a city's drivers and riders are handled by the same shard, keeping queries local.
- Location service is horizontally scalable; geo index shards are replicated for availability.
- Surge pricing: compute supply/demand per cell from the live index.

**8. Failures**
- If a driver's app goes silent, their location entry expires (TTL), so they stop appearing as available.
- If the matching service crashes mid-match, reservations expire automatically; the rider's request is retried.
- Trip records are durable; location history can be rebuilt from the stream if needed."

#### Another worked example: food delivery dispatch
"For food delivery, matching considers the restaurant's preparation time:
- Assign a courier so they arrive at the restaurant when the food is ready, not too early.
- Batch two orders from the same restaurant or nearby restaurants to one courier when it doesn't delay either order much.
- The geo index and reservation logic are similar, but the optimisation includes prep times and batching."

#### Geospatial indexing options
| Approach | How it works | Notes |
|---|---|---|
| Geohash | Encodes lat/lng into a string; shared prefixes = nearby | Simple; edge effects at cell boundaries |
| Quadtree | Recursively splits space into four | Adapts to density |
| S2 / H3 | Hierarchical cells on a sphere (H3 = hexagons) | Uniform neighbours; used at large scale |
| Redis GEO | Built-in geo commands (geohash-based) | Easy start for moderate scale |

#### Step-by-step framework
1. Requirements and scale (location write rate).
2. Location ingestion and in-memory geo index.
3. Nearby search with cells and ETA ranking.
4. Matching with atomic reservation.
5. Trip state machine and real-time updates.
6. Partitioning by region; failure handling.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Write every GPS update to a SQL table | In-memory geo index; history via stream |
| Scan all drivers to find nearby ones | Geospatial cells and neighbour search |
| No protection against double assignment | Atomic reservation with expiry |
| Straight-line distance | ETA from a routing service |
| One global cluster | Partition by city/region |

#### Useful phrases
- "Location updates are a quarter of a million writes per second, so current positions live in memory."
- "We divide the map into cells and search the rider's cell and its neighbours."
- "A driver is reserved atomically with a short expiry, so they can't be double-booked."
- "Most activity is local, so we partition by city."

#### Common pitfalls
- **Persisting every location update** synchronously in a relational DB.
- **Inefficient nearby search.**
- **Race conditions** in matching.
- **Ignoring stale locations** from disconnected drivers.
- **Global data structures** that don't partition.

#### Follow-ups to expect (with sample answers)
- **"How do you handle drivers near cell boundaries?"**
  "Search neighbouring cells as well, expanding rings until enough candidates are found."
- **"How would you calculate ETA?"**
  "A routing service using a road graph with live traffic data; only compute it for the top few candidates to save cost."
- **"How do you reduce location update cost on mobile?"**
  "Adaptive frequency: send updates more often while on a trip or moving fast, less often when idle."

#### What senior interviewers look for
- **Geospatial** knowledge and realistic **write-rate** handling.
- **Concurrency correctness** in matching.
- **Regional partitioning** and failure thinking.

#### Practise it
1. Calculate location writes/sec for 500k drivers updating every 5 seconds.
2. Sketch how H3 or geohash cells find nearby drivers.
3. Explain the reservation flow when two riders request at the same moment.

## Design a ticket booking system with seat reservation
- id: be-design-12
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: system design, concurrency, inventory, reservations

### Prompt
Design a ticket booking system like Ticketmaster for concerts, where users choose specific seats and popular events sell out within minutes.

### Answer
#### What the interviewer is really testing
- **Preventing double booking** under heavy concurrency.
- **Temporary holds** with expiry while users pay.
- Handling **traffic spikes** (on-sale moments) fairly: virtual waiting rooms, queues.
- **Consistency** where it matters (seat inventory) versus caching where it doesn't (event pages).

#### Key points
- Seat state: **available → held (with expiry) → booked**.
- Use **atomic operations** for holds: conditional updates in the database (`UPDATE seats SET status='held' WHERE id=? AND status='available'`) or distributed locks with TTL.
- Holds expire after e.g. **10 minutes** if payment isn't completed; a background job or TTL releases them.
- **Virtual waiting room** for high-demand on-sales: admit users at a controlled rate.
- **Cache** event and venue information heavily; keep **seat availability** authoritative in the database (with a short-lived cache for display).
- **Idempotent** payments and booking confirmation.

#### Model answer
"**1. Requirements**
- Browse events, view a seat map, select seats, hold them while paying, confirm booking, receive tickets.
- Non-functional: **never double-book a seat**; handle huge spikes (e.g. 1M users trying to buy 50,000 seats at 10:00); fairness; reasonable latency.

**2. Data model**
```
events(id, venue_id, starts_at, on_sale_at, ...)
seats(event_id, seat_id, section, row, number, price, status, hold_id, hold_expires_at, booking_id)
holds(id, user_id, event_id, seat_ids, expires_at, status)
bookings(id, user_id, event_id, seat_ids, payment_id, status)
```
Seats for an event live in a strongly consistent relational database, partitioned by event.

**3. Holding seats (the critical path)**
- User selects seats → `POST /holds {event_id, seat_ids}`.
- In a transaction:
  ```sql
  UPDATE seats
  SET status='HELD', hold_id=:hold, hold_expires_at=now()+interval '10 minutes'
  WHERE event_id=:e AND seat_id IN (:seats) AND status='AVAILABLE';
  ```
  If the number of updated rows is less than requested, roll back. Some seats were taken, so return an error with alternatives.
- Conditional updates make this atomic: two users can't both hold the same seat.

**4. Expiry**
- Holds expire automatically: a background job releases seats where `hold_expires_at < now()` and status is still HELD, every few seconds. Reads also treat expired holds as available.

**5. Booking**
- User pays (payment flow with idempotency keys); on success, convert hold → booking in a transaction: seats `HELD → BOOKED` only if the hold is still valid.
- If payment succeeds after the hold expired (edge case), try to re-hold the same seats; if they've been taken, refund automatically and apologise. It's rare if hold times are generous.

**6. Handling the on-sale spike**
- **Virtual waiting room**: before the on-sale, users enter a queue (e.g. a token in a fast store). At on-sale, users are admitted in batches at a rate the booking system can handle (e.g. 2,000/minute), in random or arrival order.
- Event and seat-map pages are served from **cache/CDN**; seat availability is refreshed frequently but the hold operation is the source of truth.
- **Bot protection**: CAPTCHA, rate limits per account/IP, verified accounts for high-demand events.

**7. Scaling**
- Partition seat inventory by event; one hot event is the main challenge, so the waiting room protects the database.
- Booking and payment services scale horizontally.
- For general-admission events (no seat selection), use counters per section with atomic decrements instead of per-seat rows.

**8. Failures**
- If the booking service crashes after holding seats, holds simply expire.
- Payment uncertainty (timeouts) handled with idempotency and provider status checks.
- Monitor hold-to-booking conversion, hold expiry rates and queue throughput."

#### Another worked example: hotel room booking
"Hotels don't have individual seats but room types with counts per night:
- Inventory = `(hotel, room_type, date) → available_count`.
- A booking for 3 nights must decrement all three dates atomically (one transaction, conditional updates where count > 0).
- Overbooking policies may intentionally allow slight oversell, with rules for handling it, which is a business decision to clarify."

#### Concurrency strategies compared
| Strategy | How | Pros | Cons |
|---|---|---|---|
| Conditional update (optimistic) | `UPDATE ... WHERE status='AVAILABLE'` | Simple, scales well | Retries under contention |
| Pessimistic locks | `SELECT ... FOR UPDATE` | Strong guarantees | Lock contention, deadlocks |
| Distributed lock (Redis) | `SET key NX EX` per seat | Fast | Must align with DB; extra component |
| Queue per event | Serialise booking requests | No contention | Throughput limited, complexity |

#### Step-by-step framework
1. Requirements (seat selection, spikes, fairness).
2. Data model with seat states.
3. Atomic holds with expiry.
4. Booking confirmation with payment.
5. Spike handling: waiting room, caching, bot protection.
6. Partitioning, general admission, failures.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Check availability, then book (race condition) | Atomic conditional update |
| Seats locked until payment forever | Holds with expiry |
| Let a million users hit the database | Virtual waiting room |
| Everything strongly consistent and uncached | Cache event pages; consistency for inventory |
| Ignores bots | Rate limits, CAPTCHA, verification |

#### Useful phrases
- "The hold has to be atomic, so I'd use a conditional update on the seat status."
- "Holds expire after ten minutes, so abandoned checkouts release seats automatically."
- "A virtual waiting room admits users at a rate the system can handle."
- "Event pages can be cached; seat holds can't."

#### Common pitfalls
- **Check-then-act race conditions.**
- **No hold expiry.**
- **No spike protection.**
- **Ignoring payment edge cases** around expired holds.
- **Over-locking** the whole event.

#### Follow-ups to expect (with sample answers)
- **"How do you show accurate seat maps during a rush?"**
  "Refresh availability frequently from a short-TTL cache, accept that the map may be a few seconds stale, and rely on the hold operation to give the definitive answer."
- **"How do you ensure fairness?"**
  "Randomise queue position at on-sale (or first-come with protection), limit tickets per account, and block bots."
- **"What if the database for a hot event becomes a bottleneck?"**
  "Throttle admissions through the waiting room, partition seats by section across shards, or use in-memory reservation with durable confirmation."

#### What senior interviewers look for
- **Correctness under contention.**
- **Spike engineering** and fairness considerations.
- **Business edge cases** (expired holds, refunds, limits).

#### Practise it
1. Write the SQL for an atomic seat hold, including the rollback case.
2. Explain how holds expire and what happens if payment arrives late.
3. Design the waiting room for 1M users and 50k seats, out loud.

## Design a distributed job scheduler
- id: be-design-13
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels: senior, staff
- tags: system design, scheduling, queues, reliability

### Prompt
Design a distributed job scheduler that runs millions of jobs: one-off delayed jobs ("send this email in 2 hours") and recurring jobs ("every day at 2am"), reliably and at the right time.

### Answer
#### What the interviewer is really testing
- **Reliable, at-least-once execution** with no missed jobs.
- Avoiding **duplicate execution** across many scheduler instances.
- **Scalable storage and polling** of due jobs.
- Handling **retries, timeouts, failures and observability**.

#### Key points
- Separate **scheduling** (deciding a job is due) from **execution** (workers running jobs).
- Store jobs durably with `next_run_at`; index by time; **partition** by time bucket or job ID.
- Schedulers **poll for due jobs** and **claim** them atomically (lease with expiry), then enqueue to a work queue.
- Workers execute with **timeouts**, report results, and **retry with backoff**; failed jobs go to a **dead-letter queue**.
- Jobs should be **idempotent**, because at-least-once delivery means occasional duplicates.
- Recurring jobs: compute `next_run_at` from a cron expression after each run (in the right time zone).

#### Model answer
"**1. Requirements**
- Create one-off jobs with a run time, and recurring jobs with cron expressions; cancel/update jobs; retries with configurable policy; visibility into job status and history.
- Non-functional: jobs start within a few seconds of their scheduled time; **no lost jobs**; at-least-once execution; scale to millions of scheduled jobs and thousands of executions per second.

**2. Data model**
```
jobs(id, type, payload, schedule (cron or null), timezone, next_run_at, status,
     retry_policy, lease_owner, lease_expires_at, created_at)
job_runs(id, job_id, started_at, finished_at, status, attempt, error)
```
Index on `(next_run_at, status)`; partition by time bucket or hash of job ID.

**3. Architecture**
```
Clients → Job API → Jobs DB (durable)
                       ▲
Scheduler nodes ── poll due jobs, claim lease ──┘
       │
       └─► Work queue (per job type / priority) ─► Worker pools ─► job_runs + update next_run_at
                                                          └─► DLQ on repeated failure
```

**4. Claiming due jobs without duplicates**
- Multiple scheduler nodes run for availability. Each polls for due jobs in its **partition** (e.g. assigned via consistent hashing or a coordinator):
  ```sql
  UPDATE jobs
  SET lease_owner = :node, lease_expires_at = now() + interval '60 seconds'
  WHERE id IN (
    SELECT id FROM jobs
    WHERE next_run_at <= now() AND status = 'SCHEDULED'
      AND (lease_expires_at IS NULL OR lease_expires_at < now())
    ORDER BY next_run_at LIMIT 500
    FOR UPDATE SKIP LOCKED)
  RETURNING id;
  ```
- `SKIP LOCKED` lets several schedulers claim different rows concurrently without blocking.
- Claimed jobs are pushed to the work queue.

**5. Execution**
- Workers pull from the queue, run the job with a **timeout**, and record a `job_runs` entry.
- On success: one-off jobs → `COMPLETED`; recurring jobs → compute the next `next_run_at` from the cron expression and time zone, clear the lease.
- On failure: retry with **exponential backoff** (set `next_run_at` = now + backoff), up to max attempts, then mark `FAILED` and send to the **dead-letter queue** with an alert.
- If a worker crashes, the lease expires and the job becomes claimable again, which is why **jobs must be idempotent** (e.g. 'send email' checks a sent marker).

**6. Scaling**
- Partition jobs across database shards; each scheduler node owns some partitions.
- For very high volumes of near-term jobs, use a **time-bucketed** structure (e.g. a Redis sorted set by timestamp, or hierarchical timing wheels) for the next few minutes, fed from the durable store.
- Separate queues per job type/priority prevent noisy jobs starving important ones.

**7. Time correctness**
- Store times in UTC, but evaluate cron schedules in the job's time zone (handling daylight saving changes: e.g. a 2:30am job on a day when 2am–3am doesn't exist).
- Clock skew between nodes is minimised with NTP; lease logic uses database time.

**8. Observability**
- Metrics: scheduling lag (actual start − scheduled time), success/failure rates, retries, queue depth, DLQ size.
- Job history searchable by job ID for support and debugging."

#### Another worked example: a simpler approach for moderate scale
"For a company running ~10,000 scheduled jobs a day, a **single database table plus a few worker processes** using `SELECT ... FOR UPDATE SKIP LOCKED` is enough, with no Redis, no timing wheels. Libraries and managed services (cloud schedulers, Temporal, Sidekiq, Celery beat) may cover the need entirely. Recognising when to use an existing tool is a senior signal."

#### Design choices
| Concern | Choice |
|---|---|
| Durability | Jobs stored in a durable database |
| No duplicate claiming | Leases + `SKIP LOCKED` / conditional updates |
| Worker crashes | Lease expiry → reclaim; idempotent jobs |
| Failures | Retries with backoff, DLQ, alerts |
| Recurring jobs | Cron evaluated in job's time zone |
| Scale | Partitioning, time buckets, separate queues |

#### Step-by-step framework
1. Requirements (one-off, recurring, guarantees, scale).
2. Data model and indexes.
3. Scheduling: poll, claim with leases, enqueue.
4. Execution: timeouts, results, retries, DLQ.
5. Idempotency and failure recovery.
6. Scaling, time zones, observability.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| A single cron server | Multiple schedulers with partitioned, leased claiming |
| Jobs held only in memory | Durable storage |
| Assumes exactly-once | At-least-once with idempotent jobs |
| No retry policy | Backoff, max attempts, DLQ |
| Ignores time zones | Cron evaluated per time zone, DST-aware |

#### Useful phrases
- "Schedulers claim jobs with a lease, so if one dies the job is picked up again."
- "Because delivery is at-least-once, jobs must be idempotent."
- "`SKIP LOCKED` lets multiple schedulers claim different jobs without blocking."
- "I'd measure scheduling lag as the key health metric."

#### Common pitfalls
- **Single point of failure** scheduler.
- **Duplicate execution** without leases or idempotency.
- **Lost jobs** stored only in memory.
- **No visibility** into failures.
- **Time zone and DST bugs.**

#### Follow-ups to expect (with sample answers)
- **"How do you cancel a job that's already in the queue?"**
  "Workers check the job's status before executing; cancelled jobs are skipped."
- **"How do you handle a job that takes hours?"**
  "Long timeouts plus heartbeats that extend the lease; or break it into smaller steps (a workflow)."
- **"Would you build this or use an existing tool?"**
  "Prefer existing tools or managed services unless scale or requirements demand a custom system."

#### What senior interviewers look for
- **Failure-mode reasoning** (crashes, duplicates, clock issues).
- **Pragmatism**: knowing when off-the-shelf tools suffice.
- **Operability**: metrics, DLQ handling, support tooling.

#### Practise it
1. Write the claim query with leases and `SKIP LOCKED`.
2. Explain what happens when a worker crashes mid-job.
3. Describe how you'd compute the next run for a daily 2:30am job across a DST change.

## Design a metrics and logging pipeline
- id: be-design-14
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels: senior, staff
- tags: system design, observability, streaming, time-series

### Prompt
Design a system that collects logs and metrics from thousands of services, lets engineers query them, and powers dashboards and alerts.

### Answer
#### What the interviewer is really testing
- Designing **high-volume ingestion** with buffering and backpressure.
- Choosing storage for **time-series metrics** vs **logs** (different access patterns).
- **Retention, downsampling and cost** control.
- **Alerting** reliability and query performance.

#### Key points
- **Agents** on hosts collect logs/metrics and send them to an **ingestion layer**, buffered via a **stream** (e.g. Kafka) to absorb spikes.
- **Metrics**: numeric time series (name + labels + timestamp + value) stored in a **time-series database**; **downsample** old data (e.g. 10s → 1min → 1h).
- **Logs**: text/structured events stored in a **search/columnar store** (e.g. Elasticsearch/OpenSearch, ClickHouse, Loki-style indexing by labels).
- **Cardinality** (number of unique label combinations) is the main cost/performance risk for metrics.
- **Tiered retention**: hot (days), warm (weeks), cold/archive (months) in object storage.
- **Alerting** evaluates rules on recent metrics continuously, independent of dashboard load.

#### Model answer
"**1. Requirements**
- Collect metrics (counters, gauges, histograms) and structured logs from ~5,000 services across ~50,000 hosts.
- Query recent data quickly for dashboards and debugging; search logs by service, time, fields and text.
- Alerts within ~1 minute of a condition.
- Retention: detailed metrics 15 days, downsampled 1 year; logs 14 days hot, 1 year archive.
- Scale: e.g. 10M metric samples/sec and 2M log lines/sec (~1–2 GB/s of logs) at peak.

**2. Architecture**
```
Services/hosts → Agents (batch, compress, buffer locally)
                     │
                     ▼
              Ingestion gateways (auth, validation, rate limits)
                     │
                     ▼
              Stream (Kafka) — partitioned by tenant/service
              │                          │
      Metrics consumers            Log consumers
              │                          │
   Time-series DB (hot)          Log store (hot, indexed)  → archive to object storage
              │                          │
   Downsampler → long-term TSDB     Query service ← engineers / dashboards
              │
   Alerting engine (rule evaluation) → paging / chat
```

**3. Ingestion**
- Agents batch and compress data, buffer to disk if the network is down, and retry with backoff.
- Gateways authenticate, validate and apply per-team **quotas** (to stop one noisy service overwhelming the system).
- Kafka decouples producers from storage, absorbs spikes and allows replaying data after storage incidents.

**4. Metrics storage**
- Time-series DB with compression for timestamp/value pairs (very compact).
- **Downsampling**: keep raw 10-second data for 15 days, 1-minute aggregates for 90 days, hourly for a year.
- **Cardinality limits**: reject or drop labels with unbounded values (e.g. user IDs, request IDs) at ingestion, with clear feedback to teams.

**5. Log storage**
- Structured JSON logs with standard fields (service, level, trace_id, timestamp).
- Index only selected fields (service, level, trace ID) and keep full text in compressed columnar storage, or use a full-text index for hot data, which costs more.
- Hot storage for ~14 days; older data moved to object storage, queryable more slowly.

**6. Querying**
- Query service routes to the right store and time tier, applies tenant permissions, and enforces limits (max time range, max results) to protect the cluster.
- Correlation: logs and traces share **trace IDs**, so engineers can jump from a slow request's trace to its logs.

**7. Alerting**
- A separate alerting engine evaluates rules (e.g. error rate > 5% for 5 minutes) on recent data from the ingestion stream or hot TSDB.
- Alerting must be **more reliable than dashboards**: separate resources, redundancy, and 'dead man's switch' alerts if data stops arriving.

**8. Cost control**
- Sampling for debug-level logs and high-volume traces.
- Retention policies per team.
- Showback: report each team's ingestion volume and cost."

#### Another worked example: a smaller company
"For a startup with 50 services, running this yourself is overkill. A managed observability platform (or a managed Prometheus/Grafana plus a hosted log service) is cheaper and faster. Focus engineering effort on good instrumentation: structured logs, consistent metric names, trace IDs, and useful alerts."

#### Metrics vs logs vs traces
| Signal | Data shape | Best for | Storage |
|---|---|---|---|
| Metrics | Numbers over time, with labels | Dashboards, alerts, trends | Time-series DB |
| Logs | Discrete events (text/JSON) | Debugging specifics | Search / columnar store |
| Traces | Request paths across services | Latency analysis | Trace store, sampled |

#### Step-by-step framework
1. Requirements: volume, retention, query and alert needs.
2. Agents and ingestion with buffering and quotas.
3. Stream for decoupling and replay.
4. Metrics storage, downsampling, cardinality control.
5. Log storage, indexing and tiering.
6. Query layer, alerting, cost controls.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Services write directly to a database | Agents → gateways → stream → storage |
| One store for everything | Different stores for metrics, logs, traces |
| Keep everything forever | Tiered retention and downsampling |
| Ignores cardinality | Cardinality limits and feedback |
| Alerts share dashboard infrastructure | Independent, redundant alerting |

#### Useful phrases
- "Kafka absorbs spikes and lets us replay data if storage has problems."
- "High-cardinality labels like user IDs are the biggest risk for a metrics system."
- "We downsample older metrics so long-term storage stays affordable."
- "Alerting must be more reliable than the dashboards."

#### Common pitfalls
- **No buffering**, losing data during spikes or outages.
- **Unbounded cardinality.**
- **Indexing everything**, making logs very expensive.
- **No quotas**, letting one service overwhelm the system.
- **Alerting coupled** to query load.

#### Follow-ups to expect (with sample answers)
- **"How do you handle late-arriving data?"**
  "Accept data within a tolerance window and write it to the correct time bucket; alert rules account for ingestion delay."
- **"How do you make log search fast without indexing everything?"**
  "Index key fields, partition by time and service, and use columnar compression with parallel scans for the rest."
- **"How do you prevent alert fatigue?"**
  "Alert on symptoms that affect users (SLO burn rates) rather than every cause, route alerts to owners, and review noisy alerts regularly."

#### What senior interviewers look for
- **Data-volume realism** and **cost-aware** design.
- Understanding of **observability practices** (SLOs, tracing, alert quality).
- **Multi-tenant** protections and operability.

#### Practise it
1. Estimate storage for 2M log lines/sec at 500 bytes each for 14 days (before compression).
2. Explain cardinality with an example of a bad metric label.
3. Draw the pipeline from agent to alert in under 5 minutes.

## Design an e-commerce checkout and inventory system
- id: be-design-15
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: system design, inventory, consistency, sagas

### Prompt
Design the checkout and inventory system for an online store: customers place orders, stock must stay accurate, and flash sales cause big spikes.

### Answer
#### What the interviewer is really testing
- **Preventing overselling** while keeping checkout fast.
- **Reservation** strategies and their expiry.
- Coordinating **orders, payments and inventory** across services (sagas, compensation).
- Handling **flash-sale spikes**.

#### Key points
- Inventory counts per **SKU per warehouse**, updated with **atomic conditional decrements** (`stock = stock - n WHERE stock >= n`).
- **Reserve** stock at checkout (with expiry), **commit** on payment success, **release** on failure/timeout.
- Order flow across services as a **saga**: create order → reserve stock → take payment → confirm; with **compensating actions** on failure.
- **Idempotency** for order creation and payment.
- Flash sales: **queue requests**, pre-allocate stock in a fast store, limit per customer, protect the database.
- Display stock from a **cache** (approximate), but enforce with the authoritative store.

#### Model answer
"**1. Requirements**
- Cart → checkout → payment → order confirmation; inventory decremented accurately; no overselling (or within a tiny tolerance agreed with the business); order history.
- Spikes: flash sales with 100× normal traffic for limited-stock items.

**2. Services**
```
Cart service → Checkout/Order service ─┬─► Inventory service (reservations, stock DB)
                                        ├─► Payment service
                                        └─► Outbox → events → fulfilment, notifications
```

**3. Inventory model**
```
stock(sku, warehouse_id, on_hand, reserved)        -- available = on_hand - reserved
reservations(id, order_id, sku, qty, expires_at, status)
```

**4. Checkout flow (saga)**
1. **Create order** in `PENDING` with an idempotency key (from the client's checkout attempt).
2. **Reserve stock**: atomically
   ```sql
   UPDATE stock SET reserved = reserved + :qty
   WHERE sku = :sku AND warehouse_id = :w AND on_hand - reserved >= :qty;
   ```
   If no row updated → out of stock → order `FAILED` (or offer alternatives).
3. **Take payment** (idempotent). On failure → **release reservation** (compensation) → order `FAILED`.
4. On payment success → **commit**: `on_hand -= qty, reserved -= qty`; reservation `COMMITTED`; order `CONFIRMED`.
5. Publish `order_confirmed` via the **outbox** for fulfilment and emails.

Reservations have an **expiry** (e.g. 15 minutes); a sweeper releases expired ones so abandoned checkouts don't lock stock.

**5. Consistency choices**
- Inventory decrements are strongly consistent per SKU row.
- Product pages show **cached availability** ('in stock', 'only 3 left'), which can be slightly stale; the reservation step is the source of truth.

**6. Flash sales**
- **Pre-warm**: load the limited stock count into an in-memory store (e.g. Redis) and perform an atomic `DECR` there as a fast gate, then create durable reservations for successful decrements asynchronously.
- **Queue checkout requests** (or a waiting room) so the database sees a controlled rate.
- **Limits** per customer, bot protection.
- Serve product pages from CDN; keep the checkout path lean.

**7. Failures**
- Saga steps are retried idempotently; if a step fails permanently, compensations run (release stock, refund payment).
- Inventory and order states are reconciled periodically with warehouse systems (physical stock may differ due to damage or returns).

**8. Multi-warehouse**
- Choose a warehouse by proximity and availability; reservation tries the preferred warehouse first, then others."

#### Another worked example: allowing slight overselling
"Some businesses accept occasional overselling to keep checkout fast (e.g. selling from a cached count without reservation), then handle the rare oversell by apologising, offering a discount or back-ordering. This is a **business trade-off**: faster, simpler checkout versus occasional disappointed customers. A good answer asks which the business prefers."

#### Inventory strategies compared
| Strategy | Accuracy | Speed | Complexity |
|---|---|---|---|
| Decrement at payment only | Risk of oversell between checkout and payment | Fast | Low |
| Reserve at checkout (with expiry) | High | Good | Medium |
| In-memory gate + durable reservation | High under spikes | Very fast | Higher |
| Allow oversell + reconcile | Lower | Fastest | Business process needed |

#### A third worked example: buy online, pick up in store
"Adding 'click and collect' changes the inventory model:
- Stock is tracked **per store**, and store stock is less reliable (items may be on the shelf, misplaced or already in someone's basket).
- **Safety buffers**: only sell online if store stock is above a threshold (e.g. show available only if 3+ units), to reduce failed pickups.
- **Reservation flow**: reserve in the chosen store; store staff confirm picking within a time limit; if they can't find the item, the order is cancelled or switched to another store, and the customer is notified.
- **Reconciliation**: nightly stock counts and point-of-sale data update the system.

This shows how the same reservation pattern adapts when inventory data is less trustworthy."

#### Variations you might be asked
- "Design a shopping cart": persistence across devices, merging guest and logged-in carts, price changes between adding and checkout.
- "Design a flash-sale system": focus on the in-memory gate, queueing, fairness and bot protection.
- "Design order history": read-optimised views, pagination and archival of old orders.

#### Step-by-step framework
1. Requirements and spike profile.
2. Inventory model (on_hand, reserved).
3. Saga: order → reserve → pay → commit, with compensation.
4. Idempotency and outbox events.
5. Caching for display vs authoritative checks.
6. Flash-sale protections and multi-warehouse.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Read stock, then update (race) | Atomic conditional update |
| Decrement stock with no reservation expiry | Reservations that expire |
| Distributed transaction across services | Saga with compensations |
| Database handles flash sale directly | In-memory gate, queueing, limits |
| Never discusses business trade-offs | Asks about acceptable oversell |

#### Useful phrases
- "Available stock is on-hand minus reserved, and reservations expire."
- "The checkout is a saga: if payment fails, we release the reservation."
- "Product pages can show cached stock; the reservation is the real check."
- "For flash sales, an atomic counter in memory acts as a fast gate."

#### Common pitfalls
- **Race conditions** causing oversell.
- **Locking stock forever** for abandoned carts.
- **Two-phase commit** across microservices.
- **No compensation** on payment failure.
- **Ignoring physical stock** mismatches.

#### Follow-ups to expect (with sample answers)
- **"What if payment succeeds but the order service crashes before confirming?"**
  "The saga is driven by persisted state and events; on recovery, it sees payment succeeded and completes the commit, thanks to idempotent steps."
- **"How do you show 'only 2 left' accurately?"**
  "It's approximate, from a short-TTL cache; accuracy is enforced at reservation."
- **"How would you handle returns?"**
  "Returned items go through inspection; restock increases on_hand when items are confirmed sellable."

- **"How do you handle price changes during checkout?"**
  "Lock the price at the moment the order is created, show customers any changes before payment, and record the price paid on the order."
- **"How do you test the checkout under load?"**
  "Load tests replaying realistic traffic patterns, especially flash-sale spikes, in a production-like environment, watching database contention and reservation failures."

#### What senior interviewers look for
- **Distributed consistency** without heavyweight transactions.
- **Spike design** and business-aware trade-offs.
- **Operational reconciliation** with real-world inventory.

#### Practise it
1. Write the reserve and commit SQL statements.
2. Draw the saga with compensations for payment failure.
3. Design a flash sale for 1,000 items and 500,000 shoppers, out loud.

## Design a video upload and processing pipeline
- id: be-design-16
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels: staff
- tags: system design, video, transcoding, workflows, CDN

### Prompt
Design the backend for a video platform's upload pipeline: users upload videos that are processed into multiple formats and resolutions, then streamed to viewers worldwide.

### Answer
#### What the interviewer is really testing
- **Large file uploads** (resumable, direct to storage).
- **Asynchronous processing pipelines** with many steps (transcoding, thumbnails, moderation).
- **Workflow orchestration**, retries and partial failures.
- **Adaptive streaming** and **CDN** delivery; cost awareness at staff level.

#### Key points
- Clients upload directly to **object storage** using **resumable, chunked uploads** with pre-signed URLs.
- An upload-complete event triggers a **processing workflow**: validation → transcoding into multiple resolutions/bitrates → packaging for **adaptive streaming** (HLS/DASH segments) → thumbnails → content moderation → publish.
- **Parallelise** transcoding by splitting videos into segments.
- Use a **workflow engine** or state machine for orchestration with retries and idempotent steps.
- Serve segments through a **CDN**; manifests list available renditions so players switch quality based on bandwidth.
- Major costs: **compute for transcoding**, **storage**, **CDN egress**.

#### Model answer
"**1. Requirements**
- Upload videos up to several GB; process into 240p–1080p (maybe 4K) renditions; generate thumbnails; moderate content; publish; stream worldwide with adaptive quality.
- Non-functional: uploads resilient to network issues; processing in minutes for typical videos; high durability; cost efficiency.
- Scale: 500k uploads/day, average 10 minutes, so heavy compute.

**2. Architecture**
```
Client → Upload API (create upload, pre-signed URLs) → Object storage (raw)
                                                          │ upload complete event
                                                          ▼
                                          Workflow orchestrator (state per video)
                    ┌───────────────┬───────────────┬───────────────┬──────────────┐
                 Validate     Split into segments   Transcode (parallel workers)   Thumbnails
                                                          │
                                       Package HLS/DASH + manifests → Object storage (processed)
                                                          │
                                       Moderation → Publish (metadata DB, search index)
Viewers → CDN → processed segments & manifests
```

**3. Upload**
- `POST /uploads` returns an upload ID and pre-signed URLs for chunks (multipart upload).
- The client uploads chunks in parallel, retries failed chunks, and completes the multipart upload.
- Metadata (title, owner, status = `UPLOADING`) stored in the videos table.

**4. Processing workflow**
- Triggered by the storage 'object created' event → orchestrator creates a workflow for the video.
- Steps:
  1. **Validate** format and duration; extract metadata (codec, resolution).
  2. **Split** into short segments (e.g. 10 seconds) so transcoding parallelises across many workers.
  3. **Transcode** each segment into each target rendition (e.g. 5 resolutions × bitrates), on a fleet of workers (CPU or GPU, often spot instances to save cost).
  4. **Package** into HLS/DASH segments with manifests.
  5. Generate **thumbnails** and preview sprites.
  6. **Moderation**: automated checks (and human review queue for flagged content).
  7. **Publish**: status = `READY`, update search index, notify the uploader.
- Each step is **idempotent** (outputs written to deterministic paths), so retries are safe. The orchestrator tracks progress and retries failed steps without redoing completed ones.

**5. Prioritisation and cost**
- Transcode lower resolutions first so videos become watchable quickly; higher resolutions follow.
- Popular creators or premium tiers may get priority queues.
- Rarely watched videos might skip expensive renditions (e.g. 4K) until demand appears.

**6. Delivery**
- Players fetch a manifest listing renditions and choose quality based on bandwidth (adaptive bitrate streaming).
- CDN caches segments close to viewers; origin is object storage. Popular videos are almost entirely served from the CDN.

**7. Failures and monitoring**
- Worker failures → step retried on another worker.
- Poison videos (corrupt files) fail validation with a clear error to the uploader.
- Metrics: time from upload to ready, failure rates by step, queue depths, transcoding cost per minute of video, CDN hit ratio."

#### Another worked example: live streaming
"Live streaming changes the constraints:
- Ingest via RTMP/SRT to ingest servers, transcode in real time into a few renditions, and produce short segments (2–6 seconds) continuously.
- Latency targets matter (low-latency HLS/WebRTC for interactivity).
- There's no time to split and parallelise a whole file; capacity must be provisioned for concurrent live streams, with failover for ingest servers."

#### Pipeline stages and concerns
| Stage | Concern | Approach |
|---|---|---|
| Upload | Large files, flaky networks | Multipart, resumable, pre-signed URLs |
| Orchestration | Many steps, partial failures | Workflow engine, idempotent steps |
| Transcoding | Heavy compute | Segment-level parallelism, spot/GPU fleets |
| Packaging | Device compatibility | HLS/DASH, multiple renditions |
| Moderation | Safety, legal | Automated checks + human review |
| Delivery | Global latency, cost | CDN, adaptive bitrate |

#### Step-by-step framework
1. Requirements (sizes, renditions, latency to ready, scale).
2. Upload design.
3. Orchestrated processing workflow with idempotent steps.
4. Parallel transcoding and prioritisation.
5. Packaging and CDN delivery.
6. Failures, monitoring and cost.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Upload through app servers | Direct multipart uploads to storage |
| Transcode whole file on one machine | Split into segments, transcode in parallel |
| Chain of scripts | Orchestrated workflow with retries |
| Single MP4 output | Multiple renditions with adaptive streaming |
| Ignores cost | Discusses compute, storage, egress and spot instances |

#### Useful phrases
- "We split the video into segments so transcoding runs in parallel."
- "Each step writes to a deterministic location, so retries are safe."
- "Lower resolutions are produced first so the video is watchable quickly."
- "Adaptive bitrate streaming lets the player switch quality based on bandwidth."

#### Common pitfalls
- **Routing large uploads through app servers.**
- **Serial, single-machine transcoding.**
- **No orchestration**, losing track of partial failures.
- **Ignoring moderation and legal concerns.**
- **Ignoring cost**, which dominates at scale.

#### Follow-ups to expect (with sample answers)
- **"How do you estimate transcoding capacity?"**
  "From uploaded minutes per day × renditions × processing time per minute per rendition, divided by worker throughput, plus headroom for peaks."
- **"How do you handle copyright detection?"**
  "Fingerprint videos and compare against a reference database during processing, blocking or flagging matches."
- **"How would you reduce CDN costs?"**
  "Efficient codecs (e.g. newer codecs for supported devices), tuned bitrate ladders, and caching strategies; negotiate CDN pricing at scale."

#### What senior interviewers look for
- **Workflow orchestration** and idempotency across many steps.
- **Cost engineering** (codecs, spot capacity, rendition strategy).
- **End-to-end ownership**: upload, processing, moderation, delivery.

#### Practise it
1. Draw the pipeline from upload to playback in under 5 minutes.
2. Explain why segment-level parallelism speeds up processing.
3. List the three biggest cost drivers and one optimisation for each.
