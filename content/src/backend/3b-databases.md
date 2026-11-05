# Backend Engineer — Databases & Storage (continued)

## Sharding and partitioning strategies
- id: be-db-07
- round: DATABASES_STORAGE
- difficulty: hard
- levels: senior, staff
- tags: sharding, partitioning, scalability, data distribution

### Prompt
Your single database primary can no longer handle the write load and data size. How would you shard it, and what problems does sharding introduce?

### Answer
#### What the interviewer is really testing
- Knowing **when** sharding is necessary (and alternatives to try first).
- Choosing a **shard key** and **partitioning strategy**.
- Handling **cross-shard queries, transactions, hot spots and resharding**.
- Planning a **safe migration** from one database to many.

#### Key points
- Try first: **query/index optimisation**, **caching**, **read replicas**, **vertical scaling**, **archiving old data**, **table partitioning** within one database, moving workloads elsewhere.
- **Sharding** splits data across multiple databases by a **shard key**.
- Strategies: **hash-based** (even distribution), **range-based** (efficient ranges, risk of hot spots), **directory/lookup-based** (flexible mapping), **geographic**.
- Good shard keys: **high cardinality**, **even load**, and **aligned with access patterns** (most queries include the key), e.g. `tenant_id` or `user_id`.
- Problems: **cross-shard queries and joins**, **distributed transactions**, **hot shards** (celebrity tenants), **resharding**, **global uniqueness** of IDs, operational complexity.
- Use **logical shards** (many virtual shards mapped to fewer physical nodes) to make rebalancing easier.

#### Model answer
"**1. Confirm sharding is needed.** Before sharding, I'd check we've exhausted simpler options:
- Optimised slow queries and indexes; added caching for hot reads.
- Moved reads to replicas.
- Scaled the primary vertically.
- Archived cold data (e.g. orders older than 2 years) to cheaper storage.
- Used **native table partitioning** (e.g. by month) to keep indexes smaller and make deletes cheap.
- Split unrelated workloads into separate databases (e.g. analytics events vs core orders).

If write throughput or data size still exceeds what one primary can handle, sharding is the next step.

**2. Choose the shard key.** For a multi-tenant SaaS product, **`tenant_id`** is usually best:
- Almost every query includes the tenant.
- A tenant's data stays together, so most joins and transactions stay **within one shard**.
- High cardinality (thousands of tenants).

For a consumer social app, **`user_id`** might be the key, with data like a user's posts co-located.

**3. Choose the distribution strategy:**
- **Hash-based**: `shard = hash(tenant_id) % N_logical`. Even distribution; range queries across keys are scattered (fine if queries are per tenant).
- **Range-based**: e.g. by date or ID range. Good for range scans; risk of **hot spots** (all new writes go to the latest range).
- **Directory-based**: a lookup table maps tenant → shard. Most flexible: large tenants can be moved to dedicated shards. Requires a highly available lookup service (heavily cached).

I'd use **logical shards**: e.g. 1,024 logical shards mapped to 8 physical databases. Rebalancing means moving logical shards between physical nodes, without rehashing everything.

**4. Handle the hard parts:**
- **Cross-shard queries**: global reports go to a **data warehouse** fed by CDC, not the shards.
- **Global uniqueness**: use UUIDs or Snowflake-style IDs instead of per-database auto-increments.
- **Cross-shard transactions**: design to avoid them; when unavoidable, use **sagas**.
- **Hot shards**: very large tenants get **dedicated shards** (directory mapping helps).
- **Routing**: a data-access layer or proxy (e.g. Vitess for MySQL, Citus for PostgreSQL) routes queries by shard key.

**5. Migration plan:**
1. Introduce the routing layer while everything still points to the single database (all logical shards → one physical node).
2. Ensure all queries include the shard key; fix those that don't.
3. Set up new physical shards; copy data for a set of logical shards (backfill + CDC to keep in sync).
4. Switch routing for those shards, verify, then repeat.
5. Monitor per-shard load, latency and errors.

**6. Operations:** backups, schema migrations and monitoring now happen across many databases, so automation is essential."

#### Another worked example: a single noisy tenant
"One enterprise tenant generated 30% of all writes, overloading the shard it shared with 200 small tenants. With directory-based mapping, we moved that tenant's logical shard to a dedicated database using backfill + CDC, then switched routing during a low-traffic window. The other 200 tenants' latency returned to normal."

#### A third worked example: partitioning instead of sharding
"An events table with 2 billion rows slowed down maintenance and queries. Rather than sharding, we used **monthly range partitions** in PostgreSQL. Queries filtered by date only touched relevant partitions (partition pruning), indexes per partition were smaller, and dropping old data became an instant `DROP PARTITION` instead of a huge `DELETE`. It bought years of headroom on a single primary."

#### Variations you might be asked
- "How would you shard a chat application?": shard by conversation ID so messages for a conversation stay together.
- "How do you shard when there's no natural tenant?": hash a user ID or entity ID, and keep global lookups (e.g. by email) in a separate index table.
- "How do you do schema migrations on 64 shards?": automated, backward-compatible migrations rolled out shard by shard with monitoring.

#### Sharding strategies
| Strategy | Pros | Cons |
|---|---|---|
| Hash | Even distribution | Scattered range queries; resharding needs care |
| Range | Efficient range scans | Hot spots on latest range |
| Directory | Flexible placement, isolate big tenants | Lookup service dependency |
| Geographic | Data residency, latency | Uneven regional load |

#### Step-by-step framework
1. **Exhaust simpler options** first.
2. **Choose a shard key** aligned with access patterns.
3. **Choose a strategy** (hash/range/directory), with logical shards.
4. **Address cross-shard concerns** (queries, IDs, transactions, hot spots).
5. **Plan a gradual migration** with routing, backfill and CDC.
6. **Automate operations.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Shards immediately | Tries optimisation, replicas, partitioning first |
| Arbitrary shard key | Key aligned with queries and even load |
| Ignores cross-shard queries | Warehouse for global analytics; avoids cross-shard transactions |
| `hash % N` physical shards | Logical shards for easier rebalancing |
| Big-bang migration | Gradual, verified migration with CDC |

#### Useful phrases
- "Sharding is a last resort after optimisation, replicas and partitioning."
- "I'd shard by tenant ID so a tenant's data and transactions stay on one shard."
- "Logical shards make rebalancing a matter of moving a few shards, not rehashing everything."
- "Global reporting moves to a warehouse, not across shards."

#### Common pitfalls
- **Premature sharding.**
- **Poor shard key** causing hot spots or scatter-gather queries.
- **Auto-increment IDs** colliding across shards.
- **Cross-shard transactions** everywhere.
- **No resharding plan.**

#### Follow-ups to expect (with sample answers)
- **"What is consistent hashing and does it help?"**
  "It maps keys and nodes onto a ring so adding a node moves only a fraction of keys, which is useful for caches and some databases; logical shards achieve a similar benefit."
- **"How do you query by a non-shard-key field, like email?"**
  "Maintain a global index table mapping email → user/shard, or use a search index."
- **"What's the cost of sharding for developers?"**
  "Every query must include the shard key, joins across tenants become impossible in the database, and operations get more complex. It's worth it only when needed."

#### What senior interviewers look for
- **Judgement** about when to shard.
- **Migration** planning and **operational** maturity.
- Handling **tenant skew** and long-term growth.

#### Practise it
1. Choose shard keys for a SaaS app, a chat app and an e-commerce platform, with reasons.
2. Explain logical vs physical shards, out loud.
3. Write a step-by-step migration plan from one database to four shards.

## Caching strategies and cache invalidation
- id: be-db-08
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: caching, Redis, cache invalidation, performance

### Prompt
How would you add caching to a read-heavy service? Explain the main caching patterns and how you'd handle invalidation and consistency.

### Answer
#### What the interviewer is really testing
- Knowledge of **caching patterns** (cache-aside, read-through, write-through, write-behind).
- Handling **invalidation**, **TTLs** and **stale data**.
- Avoiding **cache stampedes**, **hot keys** and **penetration** problems.
- Deciding **what** to cache and **where** (client, CDN, application, database).

#### Key points
- **Cache-aside (lazy loading)**: app checks cache → on miss, reads DB and fills cache. Most common.
- **Read-through**: cache layer loads from DB itself on miss.
- **Write-through**: writes go to cache and DB synchronously; cache always fresh, slower writes.
- **Write-behind (write-back)**: write to cache, flush to DB asynchronously; fast but risk of data loss.
- **Invalidation**: on update, **delete** (not update) the cache key; use **TTLs** as a safety net.
- Problems: **stampede** (many misses at once) → request coalescing, locks, early refresh; **hot keys** → replication/local caches; **penetration** (requests for non-existent keys) → cache negative results, bloom filters.
- Caching layers: **browser/CDN**, **application (Redis/Memcached)**, **in-process memory**, **database buffer cache**.

#### Model answer
"**1. Decide what to cache.** Data that's **read often, changes rarely**, and is **expensive to compute or fetch**: product details, user profiles, configuration, rendered pages, results of heavy queries. I'd avoid caching data where staleness is dangerous (account balances during payments), or cache it only very briefly.

**2. Choose a pattern.** My default is **cache-aside** with Redis:
```python
def get_product(product_id):
    key = f"product:{product_id}:v1"
    cached = redis.get(key)
    if cached:
        return deserialize(cached)
    product = db.fetch_product(product_id)
    redis.set(key, serialize(product), ex=600)  # 10-minute TTL
    return product

def update_product(product_id, changes):
    db.update_product(product_id, changes)
    redis.delete(f"product:{product_id}:v1")   # invalidate after the write commits
```
- **Delete rather than update** the cache on writes, to avoid race conditions where an older value overwrites a newer one.
- **TTLs** limit how long stale data can survive if an invalidation is missed.

**3. Invalidation strategies:**
- **Explicit invalidation** after writes (as above), ideally triggered after the DB transaction commits.
- **Event-driven invalidation**: services publish change events (or use CDC), and a consumer deletes affected keys. Good when many services cache the same data.
- **Versioned keys**: include a version in the key (`product:123:v7`); updating bumps the version so old entries are simply never read again.
- **Short TTLs** for data that changes unpredictably.

**4. Avoid common problems:**
- **Cache stampede**: when a popular key expires, thousands of requests hit the database at once. Fixes: **request coalescing** (only one request recomputes, others wait), a short **lock** on recomputation, **probabilistic early refresh**, or serving slightly stale data while refreshing in the background.
- **Hot keys**: a single extremely popular key overloads one Redis node. Fixes: replicate the key, add a small **in-process cache** with a short TTL in each app server.
- **Cache penetration**: repeated requests for IDs that don't exist bypass the cache. Fix: cache 'not found' results briefly, or use a bloom filter.
- **Cold start**: after a cache flush, the database may be overwhelmed; warm critical keys or ramp traffic gradually.

**5. Measure:** cache hit ratio, latency, evictions, memory usage, and database load before/after."

#### Another worked example: caching a product page
"An e-commerce product page combined product details, price, stock and reviews.
- **Product details** (rarely change): cached 1 hour, invalidated on edit.
- **Price** (changes occasionally): cached 5 minutes, invalidated via price-change events.
- **Stock** (changes constantly): cached 10 seconds for display only; checkout always checks the database.
- **Reviews summary**: cached 15 minutes.
Different TTLs per component kept the page fast while keeping critical data fresh."

#### A third worked example: a stampede incident
"Our homepage 'top deals' query took 2 seconds and was cached with a 60-second TTL. Every minute, the key expired and hundreds of simultaneous requests ran the query, spiking database CPU. We added a lock so only one request recomputed the value while others served the previous value for a few seconds (stale-while-revalidate). The spikes disappeared."

#### Variations you might be asked
- "Where would you cache in a typical web stack?": CDN for static and public pages, Redis for shared application data, in-process memory for tiny hot data.
- "How do you cache personalised data?": per-user keys with shorter TTLs, or cache shared components and personalise at the edge.
- "Should you cache database query results or objects?": usually domain objects or computed views keyed by ID, which are easier to invalidate than arbitrary query results.

#### Caching patterns compared
| Pattern | Read path | Write path | Trade-off |
|---|---|---|---|
| Cache-aside | App checks cache, fills on miss | Write DB, delete key | Simple; first read after change is slow |
| Read-through | Cache loads on miss | Write DB, invalidate | Cleaner app code; cache must know DB |
| Write-through | Always from cache | Write cache + DB | Fresh cache; slower writes |
| Write-behind | From cache | Write cache, async DB | Fast writes; risk of loss |

#### Step-by-step framework
1. **Identify** what's worth caching.
2. **Choose the layer** (CDN, Redis, in-process).
3. **Choose a pattern** (usually cache-aside).
4. **Define invalidation and TTLs.**
5. **Protect against** stampede, hot keys, penetration.
6. **Measure** hit ratio and impact.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Cache everything in Redis" | Chooses what to cache based on access and staleness |
| Updates cache values on writes | Deletes keys to avoid races; TTL safety net |
| Ignores stampedes | Request coalescing, locks, stale-while-revalidate |
| One TTL for everything | TTLs per data type |
| No metrics | Monitors hit ratio and database load |

#### Useful phrases
- "There are only two hard things in computer science: cache invalidation and naming things."
- "I'd use cache-aside and delete the key after the write commits."
- "TTLs are a safety net in case an invalidation is missed."
- "Checkout always reads stock from the database; the cached value is for display only."

#### Common pitfalls
- **Caching data where staleness is harmful.**
- **Race conditions** when updating cache values.
- **No TTLs**, leaving stale data forever.
- **Stampedes** on popular keys.
- **Treating the cache as the source of truth.**

#### Follow-ups to expect (with sample answers)
- **"What happens if Redis goes down?"**
  "The app should fall back to the database, with rate limiting or circuit breakers to protect it, and degrade gracefully."
- **"How do you choose a TTL?"**
  "Based on how often data changes and how much staleness users can tolerate, balanced against database load."
- **"What's the difference between Redis and Memcached?"**
  "Memcached is a simple, fast key-value cache; Redis adds data structures, persistence options, replication and scripting."

#### What senior interviewers look for
- **Consistency reasoning** about stale data.
- **Failure-mode** design (cache outages, cold starts).
- **Multi-layer** caching strategies.

#### Practise it
1. Write cache-aside read and write functions in your language.
2. Explain a cache stampede and two fixes.
3. Choose TTLs for five data types in an app you know.

## When and how to use Redis
- id: be-db-09
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: easy
- levels:
- tags: Redis, data structures, caching, in-memory

### Prompt
What is Redis good for beyond simple caching? What are its limitations, and how do you use it safely in production?

### Answer
#### What the interviewer is really testing
- Knowledge of **Redis data structures** and matching them to use cases.
- Understanding of **persistence**, **replication** and **memory** trade-offs.
- Awareness of **operational risks**: memory limits, eviction, single-threaded blocking commands.
- Judgement about when Redis is **not** the right tool.

#### Key points
- In-memory key-value store with rich **data structures**: strings, hashes, lists, sets, **sorted sets**, streams, bitmaps, HyperLogLog, geospatial indexes.
- Use cases: **caching**, **sessions**, **rate limiting**, **leaderboards** (sorted sets), **queues/streams**, **distributed locks** (with care), **pub/sub**, **counters**, **deduplication**, **feature flags**.
- **Persistence**: RDB snapshots and/or AOF logs; still primarily memory-bound and not a replacement for a durable primary database for critical data.
- **High availability**: replication + Sentinel, or **Redis Cluster** for sharding.
- Risks: **memory limits** and **eviction policies**, **large keys**, **blocking commands** (e.g. `KEYS *`), network latency, data loss on failover with async replication.

#### Model answer
"Redis is an **in-memory data structure store**. Because data lives in memory, operations are typically sub-millisecond, and its data structures make many problems simple.

**Common uses:**
- **Caching**: strings or hashes with TTLs (cache-aside).
- **Sessions**: session data keyed by session ID, with expiry.
- **Rate limiting**: atomic `INCR` with `EXPIRE`, or token buckets in Lua scripts.
- **Leaderboards**: **sorted sets** (`ZADD`, `ZREVRANGE`) give ranked lists with O(log n) updates, e.g. top 100 players.
- **Counters and analytics**: `INCR`, and **HyperLogLog** for approximate unique visitor counts using tiny memory.
- **Queues and streams**: lists for simple queues; **Redis Streams** for consumer groups with acknowledgements.
- **Deduplication**: `SET key value NX EX 3600` to record processed message IDs.
- **Geospatial**: `GEOADD`/`GEOSEARCH` for nearby searches.
- **Pub/sub**: lightweight real-time notifications (fire-and-forget; messages aren't stored).
- **Distributed locks**: `SET lock_key token NX PX 30000`, releasing only if the token matches (via Lua). For correctness-critical locking, prefer the database or a consensus system, because Redis locks have edge cases under failover and long pauses.

**Limitations and safe usage:**
- **Memory-bound**: set `maxmemory` and an appropriate **eviction policy** (e.g. `allkeys-lru` for pure caches, `noeviction` for data you must not lose). Monitor memory usage.
- **Durability**: RDB snapshots and AOF provide persistence, but with async replication, a failover can lose recent writes. I don't use Redis as the only store for critical data like orders or payments.
- **Avoid blocking commands** on large data: `KEYS *`, large `SMEMBERS`, or deleting huge keys can block the server (Redis processes commands on a main thread). Use `SCAN`, `UNLINK` and keep values reasonably small.
- **Big keys and hot keys**: split large structures; replicate or locally cache hot keys.
- **High availability**: replicas with Sentinel or managed services; **Redis Cluster** shards keys across nodes (multi-key operations must use hash tags to stay on one shard).
- **Security**: require authentication, use TLS, never expose Redis to the internet.

**When not to use Redis:** as the system of record for important relational data, for large datasets that don't fit in memory affordably, or for durable messaging needs better served by Kafka or a proper queue."

#### Another worked example: a gaming leaderboard
"Each score update: `ZADD leaderboard:weekly <score> <player_id>`. Top 10: `ZREVRANGE leaderboard:weekly 0 9 WITHSCORES`. A player's rank: `ZREVRANK leaderboard:weekly <player_id>`. With millions of players, each operation is O(log n). Weekly boards use keys with expiry; scores are also written to the database for durability and history."

#### A third worked example: a production outage from `KEYS *`
"An engineer added a debugging endpoint that ran `KEYS session:*` on a Redis instance with 20 million keys. It blocked Redis for several seconds, causing timeouts across the site. We replaced it with `SCAN` (incremental, non-blocking), disabled dangerous commands in production via configuration, and added a code review rule."

#### Variations you might be asked
- "Redis or Kafka for a job queue?": Redis for simple, low-volume queues; Kafka or a managed queue for durable, high-throughput, replayable messaging.
- "How would you implement a 'recently viewed items' list?": a capped list per user (`LPUSH` + `LTRIM`) with an expiry.
- "How do you count unique daily visitors cheaply?": HyperLogLog (`PFADD`/`PFCOUNT`) for approximate counts with very little memory.

#### Redis data structures and uses
| Structure | Example use |
|---|---|
| String | Cache values, counters, locks |
| Hash | User/session objects |
| List | Simple queues, recent items |
| Set | Unique members, tags, dedup |
| Sorted set | Leaderboards, time-ordered indexes, rate limiting windows |
| Stream | Event log with consumer groups |
| HyperLogLog | Approximate unique counts |
| Geo | Nearby search |

#### Step-by-step framework
1. **Match the problem** to a data structure.
2. **Decide durability needs** (cache vs important data).
3. **Configure memory and eviction.**
4. **Plan HA** (replicas, Sentinel, Cluster).
5. **Avoid blocking operations** and big keys.
6. **Secure and monitor.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Redis is a cache" | Knows multiple data structures and uses |
| Uses Redis as primary database for orders | Understands durability limits |
| No memory/eviction plan | Configures maxmemory and eviction policy |
| Uses KEYS in production | Uses SCAN, avoids blocking commands |
| Trusts Redis locks for critical correctness | Knows locking caveats |

#### Useful phrases
- "Sorted sets make leaderboards trivial: O(log n) updates and ranked reads."
- "For a pure cache I'd use allkeys-lru eviction; for important data, noeviction and alerts."
- "I wouldn't make Redis the only copy of critical data."
- "Never run KEYS in production; use SCAN."

#### Common pitfalls
- **Treating Redis as durable storage** for critical data.
- **No memory limits.**
- **Blocking commands.**
- **Huge keys.**
- **Unsecured instances.**

#### Follow-ups to expect (with sample answers)
- **"Is Redis single-threaded?"**
  "Command execution is mainly single-threaded (with I/O threading in newer versions), which keeps operations atomic but means slow commands block others."
- **"How does Redis Cluster shard data?"**
  "Keys map to 16,384 hash slots distributed across nodes; hash tags (`{user123}`) keep related keys in the same slot."
- **"RDB vs AOF?"**
  "RDB takes periodic snapshots (compact, may lose recent data); AOF logs every write (more durable, larger); they can be combined."

#### What senior interviewers look for
- **Choosing the right tool** and understanding failure modes.
- **Operational discipline**: memory, eviction, HA, security.
- Awareness of **distributed lock** pitfalls.

#### Practise it
1. Pick five problems and choose a Redis data structure for each.
2. Write the commands for a rate limiter and a leaderboard.
3. Explain Redis's durability limits, out loud.

## Zero-downtime schema migrations
- id: be-db-10
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: hard
- levels:
- tags: migrations, zero downtime, deployments, expand-contract

### Prompt
You need to rename a column on a large, heavily used table without downtime. How do you do it? How do you approach schema migrations safely in general?

### Answer
#### What the interviewer is really testing
- Understanding that **application and schema deploy separately** and must be **compatible** during transitions.
- The **expand-and-contract** pattern.
- Knowledge of **locking** behaviour and operations that rewrite tables.
- **Backfills**, **rollbacks** and **testing** practices.

#### Key points
- During a deploy, **old and new application versions run simultaneously**, so every schema change must be **backward compatible**.
- **Expand-and-contract** (parallel change):
  1. **Expand**: add the new structure (column/table), nullable, no locks on big tables.
  2. **Dual write**: application writes both old and new.
  3. **Backfill** existing data in small batches.
  4. **Switch reads** to the new structure.
  5. **Stop writing** the old structure.
  6. **Contract**: drop the old structure later.
- Avoid long **locks**: add columns without defaults that rewrite the table (version-dependent), build indexes **concurrently**, add constraints as `NOT VALID` then validate.
- Use **lock timeouts**, **small batches**, and run migrations separately from app deploys.
- Prefer **forward-only** migrations with tested rollback plans.

#### Model answer
"A direct `ALTER TABLE ... RENAME COLUMN` would break running application instances still using the old name, and some operations take locks that block traffic on big tables. So I'd use **expand-and-contract** over several deploys.

**Example: rename `orders.addr` to `orders.shipping_address`.**

**Step 1 (expand)**: add the new column, nullable:
```sql
ALTER TABLE orders ADD COLUMN shipping_address text;   -- fast, metadata-only
```

**Step 2 (dual write)**: deploy application code that writes to **both** `addr` and `shipping_address` and still reads from `addr`. (Alternatively a temporary trigger syncing the columns.)

**Step 3 (backfill)**: copy existing values in **small batches** to avoid long locks and replication lag:
```sql
UPDATE orders SET shipping_address = addr
WHERE id BETWEEN :start AND :end AND shipping_address IS NULL;
```
Run in a loop with pauses, monitoring database load and replica lag.

**Step 4 (switch reads)**: deploy code that reads from `shipping_address` (still writing both). Verify with monitoring and data checks.

**Step 5 (stop old writes)**: deploy code that only uses `shipping_address`.

**Step 6 (contract)**: after a safe period, drop `addr`:
```sql
ALTER TABLE orders DROP COLUMN addr;
```

Each step is independently deployable and reversible until the final drop.

**General practices:**
- **Backward compatibility rule**: the schema must work with both the current and next app version.
- **Know which operations lock or rewrite tables** in your database version (e.g. changing column types, adding a column with a volatile default, adding `NOT NULL` without care).
- **Indexes**: `CREATE INDEX CONCURRENTLY` (PostgreSQL) to avoid blocking writes.
- **Constraints**: add foreign keys or checks as `NOT VALID`, then `VALIDATE CONSTRAINT` separately (lighter locks).
- **NOT NULL**: add a check constraint `NOT VALID`, validate, then set NOT NULL (avoids a long full-table scan under lock in modern PostgreSQL).
- **Lock timeouts**: `SET lock_timeout = '5s'` so a migration fails fast instead of queueing behind a long transaction and blocking everyone.
- **Separate migration deploys** from app deploys; run them in CI on production-like data volumes.
- **Tools**: migration frameworks (Flyway, Liquibase, Alembic, Rails/Django migrations), and online schema change tools for MySQL (gh-ost, pt-online-schema-change)."

#### Another worked example: splitting a table
"Moving `addresses` out of `users` into a separate table:
- Create `addresses` table (expand).
- Dual write: new and updated users write to both.
- Backfill existing addresses in batches.
- Switch reads to the new table behind a feature flag, comparing results for a sample of requests (shadow reads).
- Stop writing old columns; drop them weeks later.
The feature flag allowed instant rollback of the read path if mismatches appeared."

#### A third worked example: a migration that caused an outage
"A migration added an index without `CONCURRENTLY` on a 300M-row table during business hours. It locked writes for 20 minutes, causing checkout failures. Afterwards we added a CI check that flags non-concurrent index creation on large tables, required `lock_timeout` in all migrations, and scheduled risky migrations with a reviewer from the platform team."

#### Variations you might be asked
- "How do you change a column's type, e.g. int to bigint?": add a new bigint column, dual write, backfill, switch, drop. Or use tooling that does an online copy.
- "How do you add a NOT NULL column with a default?": add it nullable, backfill, add the constraint safely, then set the default for new rows.
- "How do you roll back a bad migration?": stop at the step before contraction; every earlier step leaves the old structure intact.

#### Risky vs safe operations (PostgreSQL examples)
| Operation | Risk | Safer approach |
|---|---|---|
| Rename/drop column in use | Breaks old app versions | Expand-and-contract |
| Create index | Blocks writes | `CREATE INDEX CONCURRENTLY` |
| Add foreign key/check | Long validation under lock | `NOT VALID` then `VALIDATE` |
| Change column type | Table rewrite | New column + backfill |
| Large UPDATE | Locks, replication lag | Small batches |

#### Step-by-step framework
1. **Make changes backward compatible.**
2. **Expand** (add new structures).
3. **Dual write** and **backfill** in batches.
4. **Switch reads**, verify.
5. **Stop old writes**.
6. **Contract** later.
7. Use **lock timeouts**, concurrent operations and CI checks.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `ALTER TABLE RENAME` during deploy | Expand-and-contract across deploys |
| Backfill in one huge UPDATE | Batched backfill with monitoring |
| Ignores locks | Knows locking behaviour; uses concurrent operations and lock timeouts |
| No rollback plan | Each step reversible until contraction |
| Migrations untested | Tested on production-like data in CI |

#### Useful phrases
- "During a deploy, old and new versions run at the same time, so the schema must support both."
- "I'd add the new column, dual write, backfill in batches, switch reads, then drop the old column."
- "Indexes are created concurrently so writes aren't blocked."
- "I set a lock timeout so a migration fails fast instead of blocking traffic."

#### Common pitfalls
- **Breaking running app versions.**
- **Long locks** on large tables.
- **Massive single-transaction backfills.**
- **Dropping columns too early.**
- **Running untested migrations** on production data volumes.

#### Follow-ups to expect (with sample answers)
- **"Should migrations run automatically on deploy?"**
  "Simple, safe ones can; risky ones on large tables should run as separate, monitored steps."
- **"How do you handle migrations with multiple services sharing a database?"**
  "Ideally each service owns its data; if shared, coordinate changes with all consumers and use expand-and-contract strictly."
- **"How do you verify a backfill?"**
  "Compare counts and checksums between old and new columns, and sample rows."

#### What senior interviewers look for
- **Deep operational knowledge** of the database.
- **Process and tooling** to make migrations safe for teams.
- **Risk management** for large data changes.

#### Practise it
1. Write the six steps of expand-and-contract for renaming a column.
2. List three operations that can lock tables and their safer alternatives.
3. Explain why backward compatibility matters during deploys, out loud.

## Optimistic vs pessimistic locking
- id: be-db-11
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: locking, concurrency control, versioning, transactions

### Prompt
Two users edit the same record at the same time. How do you prevent one from silently overwriting the other? Compare optimistic and pessimistic locking.

### Answer
#### What the interviewer is really testing
- Understanding the **lost update** problem.
- Knowing **optimistic** (version checks) vs **pessimistic** (locks) concurrency control.
- Choosing based on **contention levels** and user experience.
- Implementation details: **version columns**, **ETags**, **SELECT FOR UPDATE**, deadlocks and timeouts.

#### Key points
- **Lost update**: two users read version 1, both save; the second save overwrites the first without knowing.
- **Optimistic locking**: no lock while reading; on update, check the record hasn't changed (`WHERE id = ? AND version = ?`). If 0 rows are updated → conflict → reload/merge/retry. Best when **conflicts are rare**.
- **Pessimistic locking**: lock the row when reading for update (`SELECT ... FOR UPDATE`) so others wait. Best when **conflicts are frequent** or operations are short and critical.
- APIs expose optimistic locking via **ETags** and `If-Match` (412 on mismatch).
- Pessimistic locks risk **blocking**, **deadlocks** and poor scalability if held long; never hold DB locks during user think-time.

#### Model answer
"The problem is the **lost update**: Alice and Bob both open a product description (version 1). Alice saves her change. Bob saves his a minute later, and his save overwrites Alice's change without either knowing.

**Optimistic locking**
- Add a `version` column (or use `updated_at`).
- When reading, return the version (e.g. as an ETag in the API).
- When updating:
  ```sql
  UPDATE products
  SET description = :desc, version = version + 1
  WHERE id = :id AND version = :expected_version;
  ```
- If **1 row** is updated → success. If **0 rows** → someone else changed it → return a **conflict** (`409` or `412 Precondition Failed` with `If-Match`), and the client reloads, shows the differences, or retries.
- **Pros**: no locks held, scales well, great for web apps where users take minutes to edit.
- **Cons**: under heavy contention, many retries.

**Pessimistic locking**
- Lock the row when you read it for update:
  ```sql
  BEGIN;
  SELECT * FROM accounts WHERE id = :id FOR UPDATE;   -- others trying to lock wait
  -- calculate new balance
  UPDATE accounts SET balance = :new WHERE id = :id;
  COMMIT;
  ```
- **Pros**: no conflicts to handle; good for short, high-contention critical sections (e.g. updating a hot inventory row, sequential number allocation).
- **Cons**: blocking, risk of **deadlocks** (lock rows in a consistent order), reduced throughput; locks must never be held while waiting for a user or a slow external call.

**Choosing:**
- **User-facing editing** (documents, settings, product data): **optimistic**, because conflicts are rare and users can't hold locks for minutes.
- **Short backend operations with high contention**: **pessimistic**, or better, an **atomic conditional update** that avoids read-modify-write entirely (`UPDATE stock SET qty = qty - 1 WHERE id = ? AND qty > 0`).
- For a single counter-like change, atomic updates beat both.

**User experience for conflicts.** For optimistic locking in a UI: tell the user someone else changed the record, show what changed, and let them merge or reapply their edit. For simple fields, automatic merging can work."

#### Another worked example: collaborative editing
"For a team wiki, optimistic locking prevents overwrites, but frequent conflicts frustrated users editing long pages. We added **section-level** versioning (conflicts only if the same section changed) and showed a side-by-side diff when conflicts happened. For truly simultaneous editing, real-time collaboration (operational transforms or CRDTs) would be the next step."

#### A third worked example: a hot inventory row
"During flash sales, thousands of requests decremented the same product's stock. Optimistic locking caused constant version conflicts and retries. Switching to an atomic conditional update (`qty = qty - 1 WHERE qty > 0`) removed read-modify-write entirely; the database serialised the updates efficiently, and failures became clear 'out of stock' results rather than retries."

#### Variations you might be asked
- "How do you implement optimistic locking in an ORM?": most ORMs support a version column that's checked automatically on update (e.g. JPA `@Version`, Rails `lock_version`).
- "How do you prevent two workers processing the same job?": `SELECT ... FOR UPDATE SKIP LOCKED` or a conditional status update (`WHERE status = 'pending'`).
- "What about distributed locks across services?": prefer database-level guarantees; if needed, use a consensus-based lock service with fencing tokens.

#### Optimistic vs pessimistic
| Aspect | Optimistic | Pessimistic |
|---|---|---|
| Mechanism | Version check on update | Lock on read (`FOR UPDATE`) |
| Best when | Conflicts are rare | Conflicts are frequent, operations short |
| Blocking | None | Others wait |
| Failure mode | Conflict → retry/merge | Deadlocks, timeouts |
| Typical use | Web editing, APIs (ETags) | Financial updates, hot rows |

#### Step-by-step framework
1. **Describe the lost update.**
2. **Explain optimistic locking** with a version column and API ETags.
3. **Explain pessimistic locking** with `FOR UPDATE`.
4. **Choose by contention** and operation length.
5. **Mention atomic updates** as a third option.
6. **Design conflict UX** and deadlock handling.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use transactions" (doesn't prevent lost updates by default) | Explains version checks or locks explicitly |
| Locks held while users edit | Optimistic locking for user think-time |
| Ignores deadlocks | Consistent lock ordering, timeouts |
| No conflict UX | Shows changes and lets users merge |
| Only two options | Also atomic conditional updates |

#### Useful phrases
- "Without a version check, the second save silently overwrites the first."
- "Optimistic locking checks the version on update and fails if it changed."
- "I'd never hold a database lock while a user is thinking."
- "For counters, an atomic update avoids the problem entirely."

#### Common pitfalls
- **Assuming transactions alone prevent lost updates.**
- **Long-held pessimistic locks.**
- **Deadlocks** from inconsistent lock order.
- **Poor conflict UX.**
- **Optimistic locking under heavy contention** without retries.

#### Follow-ups to expect (with sample answers)
- **"Can you use timestamps instead of version numbers?"**
  "Yes, but timestamps can collide or have precision issues; integer versions are more reliable."
- **"What does SKIP LOCKED do?"**
  "Skips rows locked by other transactions instead of waiting, which is useful for job queues."
- **"How do ETags relate to optimistic locking?"**
  "The ETag represents the resource version; clients send If-Match on updates, and the server rejects stale ones with 412."

#### What senior interviewers look for
- Matching concurrency control to **workload and UX**.
- **Correctness** across APIs and databases.
- Knowledge of **database-specific locking** behaviour.

#### Practise it
1. Write the optimistic update SQL and the API response for a conflict.
2. Explain when you'd use `SELECT FOR UPDATE`.
3. Describe a lost update scenario and three fixes, out loud.

## Storing time-series and event data
- id: be-db-12
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: time-series, events, partitioning, retention

### Prompt
You need to store billions of time-stamped events (e.g. IoT readings, clickstream, metrics) and query them by time range. How would you design the storage?

### Answer
#### What the interviewer is really testing
- Understanding **time-series workload** characteristics (append-heavy, time-range queries, aggregation, retention).
- Choosing appropriate **storage engines** (time-series DBs, columnar stores, partitioned relational tables).
- **Partitioning**, **retention**, **downsampling** and **compression** strategies.
- Handling **late or out-of-order** data and **high cardinality**.

#### Key points
- Time-series workloads: **mostly inserts**, rarely updated, queried by **time range** and **series key** (device, user), often **aggregated**.
- Options:
  - **PostgreSQL + time partitioning** (or **TimescaleDB**) for moderate scale with SQL.
  - **Time-series DBs** (InfluxDB, Prometheus for metrics) for metrics-style data.
  - **Columnar analytical stores** (ClickHouse, BigQuery, Druid) for large-scale analytics.
  - **Wide-column** (Cassandra/ScyllaDB) for huge write throughput keyed by series and time bucket.
- **Partition by time** (daily/monthly) for fast range queries and cheap deletion.
- **Retention + downsampling**: keep raw data briefly, aggregates longer.
- **Compression**: columnar and time-series storage compress very well.
- Watch **cardinality** (number of unique series) and **late-arriving data**.

#### Model answer
"**1. Understand the workload.** Say IoT devices: 1M devices sending a reading every 10 seconds → **100,000 writes/sec**. Queries:
- Latest readings for a device.
- A device's readings over a time range (charts).
- Aggregations (hourly averages per device/region).
- Retention: raw data 30 days, hourly aggregates 2 years.

**2. Choose storage.** At this scale I'd consider:
- **TimescaleDB / partitioned PostgreSQL** if the team knows SQL and volumes are moderate: hypertables partitioned by time, compression, continuous aggregates.
- **ClickHouse** (columnar) for very high ingest and fast aggregations across billions of rows.
- **Cassandra/ScyllaDB** if the main access is 'readings for device X in time range', with massive write throughput, partitioned by `(device_id, day)`.

I'd pick based on query patterns: heavy aggregations favour **ClickHouse/Timescale**; simple per-device range reads at extreme scale favour **wide-column**.

**3. Schema (columnar/Timescale example):**
```
readings(device_id, ts, temperature, humidity, battery)
  partitioned by time (daily), ordered/indexed by (device_id, ts)
```
- Ordering by `(device_id, ts)` keeps a device's data together for range scans.
- **Wide-column alternative**: partition key `(device_id, day)`, clustering key `ts`. Bounding partitions by day avoids unbounded partitions.

**4. Ingestion:**
- Devices → ingestion gateway → **Kafka** (buffer, replay) → batch writers inserting in **bulk** (thousands of rows per insert), much more efficient than single-row inserts.
- **Late/out-of-order data**: accept within a window (e.g. 24 hours) and write to the right time partition; aggregates recomputed for affected windows.

**5. Retention and downsampling:**
- **Continuous aggregates / materialised views**: hourly and daily rollups (avg, min, max, count) per device.
- Drop raw partitions older than 30 days (instant partition drop rather than DELETE).
- Keep rollups for 2 years; archive raw data to object storage (Parquet files) if needed for future analysis.

**6. Serving queries:**
- Latest value per device: a small 'latest' table or cache updated on ingest.
- Dashboards query aggregates for long ranges and raw data only for short ranges.

**7. Watch out for:**
- **High cardinality** (e.g. adding user IDs as tags in metrics systems explodes the number of series).
- **Hot partitions** if partitioning only by time at very high ingest; distribute by device/hash plus time."

#### Another worked example: clickstream analytics
"For website clickstream events (page views, clicks) at 20,000 events/sec, used for product analytics:
- Events go to Kafka, then into **ClickHouse** (or a cloud warehouse) in batches.
- Partition by date; order by `(event_type, ts)` or `(user_id, ts)` depending on main queries.
- Funnels and cohorts query billions of rows in seconds thanks to columnar storage and compression.
- Raw events kept 13 months for year-over-year comparisons; PII minimised or pseudonymised."

#### A third worked example: when plain PostgreSQL was enough
"A fleet of 2,000 vehicles reporting every 30 seconds produces ~67 writes/sec. A single PostgreSQL table with monthly partitions, an index on `(vehicle_id, ts)` and a nightly rollup table handled it easily for years. Choosing a specialised time-series database would have added operational complexity without benefit."

#### Variations you might be asked
- "How would you store financial tick data?": columnar or specialised time-series stores, high write rates, precise timestamps, and strong retention requirements.
- "How do you show 'last seen' for millions of devices efficiently?": maintain a separate latest-state table or cache rather than querying the full history.
- "How do you handle devices with clock drift?": record both device time and server receive time, and correct or flag suspicious timestamps.

#### Storage options
| Option | Strengths | Best for |
|---|---|---|
| Partitioned PostgreSQL / TimescaleDB | SQL, joins, moderate-high scale | Mixed workloads, teams with SQL skills |
| ClickHouse / columnar warehouse | Fast aggregations, compression | Analytics over billions of rows |
| Cassandra / ScyllaDB | Massive writes, per-key ranges | Per-device/user range reads at huge scale |
| Prometheus / metrics TSDB | Metrics, alerting | Infrastructure/app metrics |

#### Step-by-step framework
1. **Characterise the workload** (write rate, queries, retention).
2. **Choose storage** by query patterns and scale.
3. **Design partitioning and ordering keys.**
4. **Batch ingestion** with buffering.
5. **Retention, downsampling, compression.**
6. **Handle late data and cardinality.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| One big unpartitioned table | Time partitioning and ordering by series key |
| Row-by-row inserts | Batched ingestion via a buffer |
| Keep everything forever | Retention, rollups, archiving |
| Ignores cardinality | Watches series cardinality |
| Over-engineers small workloads | Right-sizes (PostgreSQL may be enough) |

#### Useful phrases
- "Time-series data is append-heavy and queried by time range, so I'd partition by time."
- "Dropping a daily partition is instant compared with deleting billions of rows."
- "We keep raw data for 30 days and hourly rollups for two years."
- "Writes are batched through Kafka for efficiency and replay."

#### Common pitfalls
- **Unbounded partitions** in wide-column stores.
- **Single-row inserts** at high volume.
- **No retention policy.**
- **High-cardinality tags.**
- **Ignoring late-arriving data.**

#### Follow-ups to expect (with sample answers)
- **"Why are columnar databases good for analytics?"**
  "They store each column together, so queries read only needed columns, and similar values compress extremely well."
- **"How do you query the latest value per device quickly?"**
  "Maintain a latest-state table or cache updated on ingest, rather than scanning history."
- **"How do you handle a sudden spike in device data?"**
  "Kafka absorbs the burst; writers scale out and catch up; backpressure protects the database."

#### What senior interviewers look for
- **Workload-driven** storage choices.
- **Lifecycle management**: retention, cost, archiving.
- **Right-sizing**: not over-engineering.

#### Practise it
1. Calculate write rate and daily storage for 500k devices every 15 seconds at 100 bytes per reading.
2. Design partitioning and retention for that dataset.
3. Explain why columnar storage speeds up aggregations, out loud.
