# Backend Engineer — Distributed Systems (continued)

## Consistent hashing
- id: be-dist-10
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: consistent hashing, partitioning, caching, load distribution

### Prompt
What is consistent hashing, what problem does it solve, and where is it used?

### Answer
#### What the interviewer is really testing
- Understanding why **modulo hashing** breaks when nodes change.
- How the **hash ring** works and why only a fraction of keys move.
- The role of **virtual nodes** in balancing load.
- Real uses: **distributed caches, databases (Dynamo, Cassandra), load balancers**.

#### Key points
- With `node = hash(key) % N`, changing N (adding/removing a node) remaps **almost all keys**, causing massive cache misses or data movement.
- **Consistent hashing**: map both nodes and keys onto a **ring** (hash space). A key belongs to the **first node clockwise** from its position.
- Adding/removing a node moves only the keys in its **adjacent range**: roughly **1/N** of keys.
- **Virtual nodes**: each physical node appears at many points on the ring, smoothing distribution and allowing weighting by capacity.
- Used in **Memcached client libraries**, **DynamoDB/Cassandra** partitioning, **load balancers** (sticky routing), **CDNs**.
- Alternatives: **rendezvous (highest random weight) hashing**, **jump consistent hashing**.

#### Model answer
"**The problem.** Suppose we have 4 cache servers and choose a server with `hash(key) % 4`. If we add a fifth server, the formula becomes `% 5`, and most keys now map to a different server. Suddenly almost every cache lookup misses, and the database gets hammered. The same issue applies to distributing data across database nodes: changing the node count would require moving most of the data.

**Consistent hashing:**
1. Imagine the hash space (e.g. 0 to 2³² − 1) as a **ring**.
2. Hash each **node** (e.g. its ID) to a position on the ring.
3. Hash each **key** to a position; the key is owned by the **first node clockwise** from it.
4. **Adding a node**: it takes over only the keys between its position and the previous node, about 1/N of the keys. Everything else stays put.
5. **Removing a node**: its keys move to the next node clockwise; again only its share moves.

**Virtual nodes.** With only a few nodes, their positions can be uneven, so one node might own 40% of the ring. To fix this, each physical node is placed at **many positions** (e.g. 100–200 virtual nodes). This:
- Spreads load evenly.
- Lets more powerful machines take more virtual nodes (weighting).
- When a node fails, its load spreads across many other nodes instead of all going to one neighbour.

**Replication.** Systems like Dynamo/Cassandra store each key on the next **R distinct nodes** clockwise, giving replicas automatically.

**Where it's used:**
- **Distributed caches**: client libraries for Memcached/Redis use consistent hashing so adding a cache node invalidates only a small fraction of keys.
- **Databases**: Amazon Dynamo, Cassandra and Riak partition data using rings with virtual nodes.
- **Load balancers / proxies**: route requests for the same user or key to the same backend (useful for local caches), e.g. Envoy's ring hash or Maglev.
- **CDNs**: mapping content to edge servers.

**Trade-offs and alternatives:**
- Hot keys can still overload a node; consistent hashing balances *keys*, not *traffic* per key.
- **Rendezvous hashing**: for each key, compute a score for every node and pick the highest; simple and evenly balanced, but O(N) per lookup.
- **Jump consistent hash**: very fast and memory-efficient for numbered buckets, but doesn't easily support arbitrary node removal."

#### Another worked example: scaling a cache cluster
"A Redis cache cluster of 10 nodes using modulo hashing needed an 11th node for Black Friday. Adding it with modulo hashing would have caused ~90% cache misses at the worst possible time. After switching the client to consistent hashing with virtual nodes, adding the node caused only ~9% of keys to move, a small, brief rise in database load."

#### A third worked example: a hot key on the ring
"Even with consistent hashing, a celebrity's profile key received 30% of all cache reads, overloading its node. Consistent hashing can't spread a single key. We added a small in-process cache in each app server for that key type and replicated hot keys across multiple nodes with a random suffix (`profile:123#3`), spreading the load."

#### Variations you might be asked
- "How does Redis Cluster distribute keys?": it uses 16,384 fixed hash slots assigned to nodes; slots move between nodes when rebalancing, which achieves a similar effect to consistent hashing.
- "How would you implement a ring lookup efficiently?": store virtual node positions in a sorted array or tree and binary search for the first position ≥ the key's hash.
- "What happens to replicas when a node joins?": the new node takes over part of a range and receives copies of the affected keys from existing replicas.

#### Modulo vs consistent hashing
| Aspect | Modulo hashing | Consistent hashing |
|---|---|---|
| Keys moved when adding a node | Almost all | ~1/N |
| Load balance | Even (if N fixed) | Even with virtual nodes |
| Node failures | Massive remapping | Only failed node's keys move |
| Complexity | Very simple | Moderate |

#### Step-by-step framework
1. **Explain the modulo problem.**
2. **Describe the ring** and clockwise ownership.
3. **Show what moves** when nodes change.
4. **Add virtual nodes** for balance and weighting.
5. **Mention replication** and real uses.
6. **Discuss limits** (hot keys) and alternatives.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Can't explain why modulo fails | Explains remapping problem clearly |
| No mention of virtual nodes | Virtual nodes for balance and weighting |
| No real examples | Caches, Dynamo/Cassandra, load balancers |
| Claims it solves hot keys | Knows hot keys need other solutions |

#### Useful phrases
- "With modulo hashing, adding one server remaps almost every key."
- "On the ring, a key belongs to the next node clockwise."
- "Only about one Nth of the keys move when a node joins."
- "Virtual nodes smooth out the distribution."

#### Common pitfalls
- **Forgetting virtual nodes.**
- **Believing it balances traffic** for hot keys.
- **Confusing it with sharding by range.**

#### Follow-ups to expect (with sample answers)
- **"Why do virtual nodes help when a node fails?"**
  "Its many small ranges are spread around the ring, so its load is redistributed across many nodes rather than one neighbour."
- **"What hash function would you use?"**
  "A fast, well-distributed non-cryptographic hash like MurmurHash or xxHash."
- **"Is consistent hashing used for databases with rebalancing?"**
  "Yes, Dynamo-style databases use it with virtual nodes to rebalance incrementally."

#### What senior interviewers look for
- **Clear mental model** and ability to draw it.
- Awareness of **operational consequences** (cache warm-up, rebalancing).
- Knowing **alternatives** and their trade-offs.

#### Practise it
1. Draw a ring with 3 nodes and 6 keys, then add a 4th node and show which keys move.
2. Explain virtual nodes in 30 seconds.
3. Describe how you'd handle a hot key, out loud.

## Leader election and distributed locks
- id: be-dist-11
- round: DISTRIBUTED_SYSTEMS
- difficulty: hard
- levels: senior, staff
- tags: leader election, distributed locks, fencing tokens, coordination

### Prompt
You need only one instance of a service to perform a task at a time (e.g. a scheduler or a migration job). How do you implement leader election or a distributed lock safely?

### Answer
#### What the interviewer is really testing
- Understanding why **naive locks** fail (process pauses, clock issues, network partitions).
- Using **leases with expiry** and **fencing tokens**.
- Choosing appropriate **coordination systems** (etcd, ZooKeeper, Consul, databases).
- Asking whether you need a lock at all (idempotency, partitioning).

#### Key points
- **Leader election**: choose one node to act as leader; others stand by.
- **Lease-based locks**: a lock with a **time-to-live** that the holder must renew; if it crashes, the lease expires.
- Danger: a holder **pauses** (GC, VM pause, network delay) longer than the lease, another node takes the lock, then the old holder **resumes** and acts as if it still holds it.
- **Fencing tokens**: each lock grant comes with an **increasing number**; resources reject operations with an older token.
- Use **consensus-backed** systems (etcd, ZooKeeper, Consul) for correctness-critical locks; **database locks** (e.g. advisory locks) are good when the protected resource is that database.
- **Redis locks** (SET NX PX) are fine for efficiency (avoiding duplicate work), but have edge cases for strict correctness.
- Often better: **avoid locks** via idempotency, partitioned ownership, or conditional updates.

#### Model answer
"First, I'd ask what kind of guarantee we need:
- **Efficiency**: avoid two instances doing the same work, but a rare duplicate is harmless (e.g. sending a daily report twice). A simple lease-based lock is enough.
- **Correctness**: two holders at once would corrupt data (e.g. two schedulers both issuing payments). We need strong guarantees and fencing.

**Leader election with leases (e.g. etcd):**
1. Each instance tries to create a key (e.g. `/scheduler/leader`) with a **lease** (TTL, say 15 seconds). etcd, backed by Raft, guarantees only one succeeds.
2. The leader **renews** the lease every few seconds. Others watch the key.
3. If the leader crashes or loses connectivity, its lease expires and another instance acquires leadership.

**The process pause problem:**
- The leader experiences a 30-second GC pause. Its lease expires; instance B becomes leader. Then the old leader wakes up and, unaware, continues writing.
- **Fencing tokens** solve this: each time leadership is granted, the coordination system provides a monotonically increasing number (e.g. etcd revision). The leader includes the token in every write to the protected resource, and the resource **rejects** writes with a token lower than the highest seen. B's token (42) beats the old leader's (41).
- If the resource can't check tokens, the leader should also check it still holds the lease right before each critical action, which reduces (but doesn't eliminate) risk.

**Database-based options:**
- If the protected resource *is* a database, use its features: `SELECT ... FOR UPDATE` on a lock row, PostgreSQL **advisory locks**, or a 'leader' row updated with conditional writes (`UPDATE leader SET holder = :me, expires_at = now() + 15s WHERE expires_at < now() OR holder = :me`). The database's transactional guarantees act as the coordination system.

**Redis locks:**
- `SET lock:key <unique_token> NX PX 15000`, release via a Lua script that deletes only if the token matches.
- Fine for efficiency locks. For correctness, Redis replication is asynchronous, so a failover can lose the lock; Redlock (multi-node) has debated guarantees. Prefer etcd/ZooKeeper or the database for correctness.

**Avoiding locks entirely:**
- **Idempotent operations**: duplicates are harmless.
- **Partitioned ownership**: each instance owns a subset of work (e.g. via consistent hashing), so no global lock is needed.
- **Conditional updates**: 'claim job where status = pending' with `SKIP LOCKED`.

**Example.** For a payment batch scheduler, I'd use etcd leader election with fencing tokens included in batch records; the payments table rejects batches with stale tokens. For a 'regenerate sitemap' job, a Redis lock with a TTL is enough."

#### Another worked example: a migration runner
"Several app instances start simultaneously during a deploy, and each tries to run database migrations. Using a PostgreSQL advisory lock (`pg_try_advisory_lock(12345)`), only one instance runs migrations; others wait or skip. The lock is released automatically if the session ends, avoiding stuck locks."

#### A third worked example: a stale leader incident
"A reporting service used a Redis lock with a 30-second TTL for a job that usually took 10 seconds. One day a slow database query made the job take 90 seconds; the lock expired, a second instance started the same job, and customers received duplicate reports. Fixes: a lock renewal heartbeat while the job runs, idempotent report generation (unique per date), and alerts when jobs exceed expected duration."

#### Variations you might be asked
- "How do Kubernetes controllers do leader election?": they use lease objects stored in the API server (backed by etcd) with renewals.
- "How do you avoid split brain in leader election?": use a consensus system with quorum, leases, and fencing tokens.
- "What if the coordination service is down?": no new leader can be elected; design the system to degrade safely (e.g. pause the task) rather than risk two leaders.

#### Options compared
| Option | Good for | Caveats |
|---|---|---|
| etcd / ZooKeeper / Consul | Correctness-critical election/locks | Extra infrastructure |
| Database locks / leader row | Protecting that database's data | DB load, lock timeouts |
| Redis SET NX PX | Efficiency locks | Failover can break guarantees |
| No lock (idempotency, partitioning) | Many cases | Requires design effort |

#### Step-by-step framework
1. **Clarify** efficiency vs correctness needs.
2. **Choose a coordination mechanism.**
3. **Use leases** with renewal.
4. **Add fencing tokens** for correctness.
5. **Handle pauses, crashes and partitions.**
6. **Consider avoiding locks** altogether.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use a Redis lock" for everything | Distinguishes efficiency and correctness locks |
| No expiry | Leases with renewal |
| Ignores process pauses | Fencing tokens |
| Builds own consensus | Uses etcd/ZooKeeper/Consul or the database |
| Always uses locks | Considers idempotency and partitioning |

#### Useful phrases
- "Is this lock for efficiency or correctness? The answer changes the design."
- "A paused process can wake up believing it still holds the lock."
- "Fencing tokens let the resource reject writes from a stale leader."
- "Often the best lock is no lock: make the operation idempotent."

#### Common pitfalls
- **Locks without TTL** (stuck forever).
- **TTL shorter than work** without renewal.
- **No fencing** for correctness-critical work.
- **Trusting wall clocks** across machines.
- **Unnecessary global locks.**

#### Follow-ups to expect (with sample answers)
- **"How long should the lease be?"**
  "Long enough to tolerate brief network hiccups (seconds), short enough for fast failover; renew at a fraction of the TTL."
- **"What's the problem with clock-based lock expiry?"**
  "Clocks on different machines drift; use the coordination system's time and leases rather than local clocks."
- **"Can you do leader election without external systems?"**
  "Using the shared database (leader row with conditional updates) is often simplest."

#### What senior interviewers look for
- Understanding of **subtle failure modes**.
- Pragmatic **tool choices** and avoiding unnecessary coordination.
- **Defence in depth** (fencing, idempotency, monitoring).

#### Practise it
1. Explain the process pause problem and fencing tokens with a timeline diagram.
2. Write the conditional SQL for a database-based leader row.
3. Decide efficiency vs correctness for three jobs, out loud.

## Clocks, ordering and Lamport timestamps
- id: be-dist-12
- round: DISTRIBUTED_SYSTEMS
- difficulty: hard
- levels: staff
- tags: clocks, ordering, Lamport timestamps, vector clocks

### Prompt
Why can't you rely on wall-clock timestamps to order events across machines? What are logical clocks, and how are they used?

### Answer
#### What the interviewer is really testing
- Awareness of **clock skew**, NTP adjustments and leap-second issues.
- Understanding **happens-before** and **causality**.
- **Lamport timestamps** vs **vector clocks**, and what each can tell you.
- Practical approaches: **hybrid logical clocks**, **TrueTime**, **sequence numbers from a single source**.

#### Key points
- Physical clocks on different machines **drift** and are corrected by NTP, sometimes **jumping backwards**; skew of milliseconds (or more) is common.
- Ordering events by wall-clock time across machines can be **wrong**, causing bugs like "last write wins" discarding the actual latest write.
- **Happens-before (→)**: A → B if A occurred before B in the same process, or A is sending a message B receives, or transitively.
- **Lamport clocks**: a counter incremented on each event and updated to `max(local, received) + 1` on receiving messages. If A → B, then L(A) < L(B), but **not** the reverse; they give a total order consistent with causality, but can't detect concurrency.
- **Vector clocks**: one counter per node; can determine whether events are **causally related or concurrent**, useful for conflict detection.
- **Hybrid logical clocks (HLC)**: combine physical time and logical counters (used in CockroachDB and others).
- **Google Spanner's TrueTime**: bounded clock uncertainty with waiting, enabling external consistency.
- Often simplest: **single source of ordering** (a leader, sequence numbers per partition).

#### Model answer
"**Why wall clocks are unreliable for ordering:**
- Each machine's clock drifts; NTP periodically corrects it, sometimes making it jump forwards or **backwards**.
- Skew between machines can be several milliseconds, and much more under misconfiguration.
- So if server A records an update at 10:00:00.005 and server B records a later update at 10:00:00.003 (its clock is slow), sorting by timestamp says B's update came first. In a last-write-wins system, the real latest update is **silently discarded**.

**Causality and happens-before.** What we often need is to respect **causality**: if event A could have influenced event B (same process, or A's message was received before B), then A must be ordered before B. Leslie Lamport defined this 'happens-before' relation.

**Lamport timestamps:**
- Each node keeps a counter.
- On every local event: counter += 1.
- When sending a message, include the counter.
- On receiving: counter = max(local, received) + 1.
- Guarantee: if A happens-before B, then L(A) < L(B). Ties are broken by node ID for a total order.
- Limitation: L(A) < L(B) does **not** mean A happened before B; they might be concurrent. Lamport clocks can't detect concurrency.

**Vector clocks:**
- Each node keeps a vector of counters, one per node.
- Comparing vectors tells you if A happened before B, B before A, or they're **concurrent** (neither dominates).
- Used to **detect conflicting concurrent updates** (e.g. Dynamo-style databases, then resolved by the application or CRDTs).
- Cost: vectors grow with the number of nodes/clients.

**Practical approaches I'd use:**
1. **Avoid needing global time**: route all writes for an entity through one leader or partition, which assigns **sequence numbers**. Ordering within that entity is then reliable (e.g. Kafka partition offsets, per-conversation sequence numbers in chat).
2. **Version numbers** for optimistic concurrency instead of timestamps.
3. **Hybrid logical clocks** in distributed databases: timestamps close to physical time but guaranteed monotonic and causality-respecting.
4. **TrueTime-like approaches** (Spanner) when global external consistency is required, using bounded uncertainty and commit-wait.
5. Use wall-clock time for **display and approximate analytics**, not for correctness decisions.

**Example.** A multi-region profile service used last-write-wins based on server timestamps. Users occasionally saw their newest edits reverted because of clock skew between regions. We switched to per-user version numbers (each write increments the version, conflicts detected on mismatch), eliminating the issue."

#### Another worked example: ordering chat messages
"Messages from different users' devices have unreliable device clocks. The server assigns a **per-conversation sequence number** when persisting each message, and clients display messages by sequence number. Device timestamps are shown to users (sent time) but never used for ordering."

#### A third worked example: detecting concurrent edits with vector clocks
"In an offline-capable notes app, two devices edit the same note while offline. Each device maintains a version vector. When they sync, the server compares vectors: neither dominates, so the edits are concurrent. Instead of silently picking one, the app keeps both versions and asks the user to merge (or merges automatically with a CRDT)."

#### Variations you might be asked
- "What is a CRDT?": a conflict-free replicated data type that can merge concurrent updates automatically and deterministically (e.g. counters, sets, collaborative text).
- "How do you generate globally unique, roughly time-ordered IDs?": Snowflake-style IDs (timestamp + machine ID + sequence) or ULIDs, accepting that ordering across machines is approximate.
- "What's commit-wait in Spanner?": after choosing a commit timestamp, Spanner waits out the clock uncertainty so no other transaction can get an earlier timestamp later.

#### Clock types compared
| Clock | Tells you | Limitation |
|---|---|---|
| Physical (wall) | Approximate real time | Skew, jumps; unreliable ordering |
| Lamport | Total order consistent with causality | Can't detect concurrency |
| Vector | Causal order and concurrency | Size grows with participants |
| Hybrid logical | Near-physical, causal, monotonic | Needs bounded skew |
| Sequence from leader | Exact order per partition | Leader is a bottleneck/SPOF per partition |

#### Step-by-step framework
1. **Explain clock skew** and its consequences.
2. **Define happens-before.**
3. **Explain Lamport clocks** and their limit.
4. **Explain vector clocks** and concurrency detection.
5. **Describe practical approaches** (sequence numbers, versions, HLC, TrueTime).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use NTP and timestamps" | Explains skew and why timestamps mislead |
| Can't define causality | Defines happens-before |
| Confuses Lamport and vector clocks | Explains what each can and can't determine |
| Theory only | Practical approaches (sequence numbers, versions) |

#### Useful phrases
- "Clocks drift and can jump backwards, so timestamps can't order events across machines reliably."
- "Lamport clocks respect causality but can't tell you if two events were concurrent."
- "Vector clocks can detect concurrent updates."
- "The simplest fix is often a single source of sequence numbers per entity."

#### Common pitfalls
- **Last-write-wins on wall clocks** for important data.
- **Assuming monotonic system time** (use monotonic clocks for durations).
- **Over-engineering** with vector clocks where sequence numbers suffice.
- **Trusting client device clocks.**

#### Follow-ups to expect (with sample answers)
- **"What's the difference between wall-clock and monotonic time?"**
  "Wall-clock time can jump (NTP adjustments); monotonic clocks only move forward, so use them for measuring durations and timeouts."
- **"How much clock skew is typical?"**
  "With well-configured NTP, often within a few milliseconds in a data centre, but it can be much worse; systems should tolerate it."
- **"How do databases like CockroachDB handle ordering?"**
  "Hybrid logical clocks plus uncertainty intervals, retrying transactions when timestamps fall within the uncertainty window."

#### What senior interviewers look for
- **Deep understanding** of distributed time.
- **Pragmatic** choice of ordering mechanisms.
- Recognising **subtle data-loss bugs** from timestamps.

#### Practise it
1. Explain with an example how clock skew causes a lost update under last-write-wins.
2. Simulate Lamport timestamps for three processes exchanging messages.
3. Explain when vector clocks are worth the cost, out loud.

## Monolith vs microservices (engineer's view)
- id: be-dist-13
- roles: backend, fullstack
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: microservices, monolith, architecture, service boundaries

### Prompt
When would you build a monolith, and when microservices? If you were splitting a monolith, how would you choose service boundaries?

### Answer
#### What the interviewer is really testing
- Balanced understanding of **trade-offs**, not dogma.
- Awareness of the **operational cost** of distributed systems.
- Using **domain boundaries** (DDD bounded contexts) to define services.
- Incremental **migration** strategies (strangler fig).

#### Key points
- **Monolith**: one deployable unit. Simple development, testing, deployment and debugging; transactions within one database; can become hard to change as code and teams grow.
- **Modular monolith**: one deployable with strong internal module boundaries, often the best starting point.
- **Microservices**: independently deployable services owning their data. Benefits: **team autonomy**, independent scaling and deployment, fault isolation, technology flexibility. Costs: **network calls**, distributed transactions, eventual consistency, observability, deployment infrastructure, data duplication.
- Choose microservices when **organisational scale** and **independent deployment** needs justify the cost.
- **Boundaries**: business capabilities / **bounded contexts**, high cohesion, low coupling, aligned with teams (Conway's law); each service owns its data.
- Migrate incrementally with the **strangler fig** pattern.

#### Model answer
"I'd decide based on team size, domain complexity and operational maturity rather than fashion.

**Start with a (modular) monolith when:**
- The team is small (one or a few teams).
- The product and domain are still evolving: boundaries are unclear and will change.
- Speed of iteration matters most.

A monolith gives simple local development, easy refactoring across the codebase, straightforward debugging, one deployment, and ACID transactions. I'd structure it as a **modular monolith**: clear modules (orders, payments, catalogue) with defined interfaces and no reaching into other modules' tables, so splitting later is easier.

**Consider microservices when:**
- **Many teams** step on each other in one codebase and deployment pipeline.
- Parts of the system need **independent scaling** (e.g. search or image processing).
- Parts have very different **reliability or release** needs.
- The organisation has the **operational capability**: CI/CD per service, observability (tracing, logs, metrics), service discovery, on-call ownership.

**Costs of microservices:**
- Network latency and failures between services: needing timeouts, retries, circuit breakers.
- **No cross-service ACID transactions**: sagas and eventual consistency.
- Data duplication and synchronisation via events.
- Harder debugging: distributed tracing is essential.
- More infrastructure and operational overhead.

**Choosing boundaries when splitting:**
- Use **business capabilities / bounded contexts** (from Domain-Driven Design): catalogue, ordering, payments, shipping, identity, notifications.
- Aim for **high cohesion** inside a service and **low coupling** between services: if two services must always change together or call each other constantly, they're probably one service.
- **Each service owns its data**: no shared database tables between services.
- Align with **team ownership** (Conway's law): one team can own a service end to end.
- Avoid splitting by technical layer ('database service', 'validation service').

**Migration: strangler fig pattern:**
1. Put a routing layer (API gateway/proxy) in front of the monolith.
2. Extract one capability with clear boundaries and real benefits (e.g. notifications, or a high-scale search).
3. Route its traffic to the new service; migrate its data, using events or CDC to sync during transition.
4. Repeat gradually, measuring benefits, and stop when further splitting isn't worth it."

#### Another worked example: splitting too early
"A startup of eight engineers built 20 microservices from day one. Simple features required changes across five services and coordinated deploys; local development needed a dozen containers; incidents were hard to trace. They consolidated into a modular monolith with three deployables, which doubled feature delivery speed. Microservices solved problems they didn't yet have."

#### A third worked example: a successful extraction
"In a large e-commerce monolith, image processing consumed most CPU during catalogue uploads and slowed checkout. Extracting it into a separate service fed by a queue let it scale independently on cheaper instances, and checkout latency stabilised. This was a clear, well-bounded capability with an obvious benefit, a good first extraction."

#### Variations you might be asked
- "What's a distributed monolith?": services that are deployed separately but tightly coupled (shared databases, synchronous chains, coordinated releases), getting the costs of both and the benefits of neither.
- "How big should a microservice be?": big enough to own a meaningful business capability and its data, small enough for one team to own end to end.
- "How do services share data?": through APIs and events, not shared tables; each keeps the data it needs, synced via events.

#### Comparison
| Aspect | Monolith | Microservices |
|---|---|---|
| Deployment | Single unit | Independent per service |
| Transactions | Local ACID | Sagas, eventual consistency |
| Debugging | Simpler | Distributed tracing needed |
| Team scaling | Harder with many teams | Team autonomy |
| Operational cost | Low | High |
| Best for | Small teams, evolving domains | Large orgs, clear domains, scale needs |

#### Step-by-step framework
1. **Assess team size, domain clarity, operational maturity.**
2. **Default to a modular monolith** when uncertain.
3. **Identify pain points** that microservices would solve.
4. **Choose boundaries** by business capability, data ownership and team ownership.
5. **Migrate incrementally** (strangler fig) and measure.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Microservices are modern and scalable" | Weighs trade-offs and operational costs |
| Splits by technical layer | Splits by business capability/bounded context |
| Shared database across services | Each service owns its data |
| Big-bang rewrite | Strangler fig, incremental extraction |
| Ignores team structure | Aligns with team ownership |

#### Useful phrases
- "I'd start with a modular monolith and split when there's a clear reason."
- "Microservices trade code complexity for operational complexity."
- "If two services always change together, they're probably one service."
- "Each service owns its data; no shared tables."

#### Common pitfalls
- **Premature microservices.**
- **Distributed monolith.**
- **Shared databases.**
- **Chatty synchronous calls** between services.
- **No observability** before splitting.

#### Follow-ups to expect (with sample answers)
- **"What's Conway's law?"**
  "Organisations design systems that mirror their communication structures, so service boundaries should match team boundaries."
- **"How do you handle shared reference data like countries or currencies?"**
  "A small owning service or a library/config shared read-only, with caching; avoid shared writable tables."
- **"How do you test across microservices?"**
  "Unit tests per service, contract tests between services, and a small set of end-to-end tests for critical journeys."

#### What senior interviewers look for
- **Pragmatism** over trends.
- **Organisational and operational** awareness.
- **Incremental migration** experience.

#### Practise it
1. For three companies (startup, scale-up, enterprise), recommend an architecture and justify it.
2. Draw bounded contexts for an e-commerce domain.
3. Explain the strangler fig pattern, out loud.

## Load balancing and service discovery
- id: be-dist-14
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: load balancing, service discovery, health checks, networking

### Prompt
How do load balancers and service discovery work in a microservices environment? What algorithms and health-checking strategies would you use?

### Answer
#### What the interviewer is really testing
- Understanding of **L4 vs L7** load balancing.
- Knowledge of **balancing algorithms** and their trade-offs.
- **Health checks**, connection draining and **zero-downtime deploys**.
- **Service discovery** patterns (client-side vs server-side, DNS, service registries, service meshes).

#### Key points
- **L4 (transport)**: balances TCP/UDP connections; fast, protocol-agnostic. **L7 (application)**: understands HTTP/gRPC; can route by path/headers, terminate TLS, retry, and balance per request.
- Algorithms: **round robin**, **weighted round robin**, **least connections / least outstanding requests**, **random with two choices (power of two)**, **consistent hashing** (session affinity).
- **Health checks**: **liveness** (is it running?) and **readiness** (can it serve traffic now?); active probes and passive outlier detection.
- **Connection draining**: stop sending new requests to an instance before terminating it.
- **Service discovery**: instances register in a registry (Consul, etcd, Kubernetes Services/Endpoints); clients or load balancers look them up. Patterns: **server-side** (LB knows instances) vs **client-side** (client library picks instance); **service mesh** sidecars (Envoy) handle discovery, balancing, retries and mTLS.
- **Sticky sessions** reduce flexibility; prefer stateless services.

#### Model answer
"**Load balancing layers:**
- **L4 load balancers** distribute TCP connections without understanding HTTP. Very fast, but with long-lived connections (e.g. HTTP/2, gRPC), one connection carrying many requests can create uneven load.
- **L7 load balancers** understand HTTP/gRPC: they can route `/api/orders` to the orders service, terminate TLS, add headers, retry failed requests, and balance **each request** rather than each connection, which is important for gRPC.

**Algorithms:**
- **Round robin**: simple, fine when instances and requests are similar.
- **Weighted round robin**: for instances of different sizes, or gradual traffic shifting (canaries).
- **Least outstanding requests / least connections**: sends traffic to the least busy instance; good when request durations vary.
- **Power of two random choices**: pick two instances at random and choose the less loaded one, nearly as good as least-loaded with much less coordination.
- **Consistent hashing**: route the same user/key to the same instance (useful for local caches), at the cost of less even load.

**Health checks:**
- **Liveness**: is the process alive? If not, restart it.
- **Readiness**: can it serve traffic right now (dependencies connected, warm-up complete)? If not, remove it from the pool but don't restart it.
- **Passive health checks / outlier detection**: eject instances that return many errors or timeouts.
- Keep health checks **cheap and meaningful**: a readiness check that calls every dependency can cause cascading removal of all instances when one dependency is slow.

**Zero-downtime deploys:**
- New instances start and only receive traffic once **ready**.
- Old instances are marked not ready, **drain** in-flight requests (connection draining, e.g. 30 seconds), then shut down gracefully (handling SIGTERM).

**Service discovery:**
- Instances register (or are registered by the platform) in a **registry**: Kubernetes Endpoints, Consul, etcd, cloud service registries.
- **Server-side discovery**: clients call a stable address (load balancer / Kubernetes Service), which knows the healthy instances.
- **Client-side discovery**: clients query the registry and pick an instance themselves (e.g. gRPC client-side load balancing), saving a hop but putting logic in clients.
- **Service mesh** (Istio/Linkerd with Envoy sidecars): sidecars handle discovery, L7 balancing, retries, timeouts, mTLS and metrics consistently, without application code changes, at the cost of extra complexity.

**State and stickiness.** I'd keep services **stateless** (sessions in Redis or tokens) so any instance can handle any request, avoiding sticky sessions that make scaling and failover harder."

#### Another worked example: gRPC load imbalance
"Our gRPC clients connected through an L4 load balancer. Because gRPC keeps long-lived HTTP/2 connections, each client stuck to one backend, and new instances added during autoscaling received almost no traffic. Switching to L7 balancing (Envoy) that balances per request, plus periodic connection recycling, spread load evenly."

#### A third worked example: a readiness check that caused an outage
"Each service's readiness check verified its database and two downstream services. When one downstream service slowed, every upstream instance failed readiness and was removed from the load balancer, taking the whole product offline, even though most features didn't need that dependency. We changed readiness to check only essential local dependencies and handled downstream failures with circuit breakers and fallbacks."

#### Variations you might be asked
- "How does DNS-based load balancing work, and its limits?": DNS returns multiple IPs or rotates them, but caching (TTLs) makes changes slow and health awareness limited.
- "How do you shift traffic gradually for a canary?": weighted routing at the L7 load balancer or mesh (e.g. 5% to the new version), monitored before increasing.
- "What's global server load balancing?": routing users to the nearest or healthiest region using DNS or anycast.

#### Algorithms compared
| Algorithm | Best for | Caveat |
|---|---|---|
| Round robin | Uniform instances and requests | Ignores load |
| Weighted round robin | Mixed capacity, canaries | Static weights |
| Least outstanding requests | Variable request times | Needs load info |
| Power of two choices | Large fleets, low coordination | Probabilistic |
| Consistent hashing | Affinity / local caches | Less even load |

#### Step-by-step framework
1. **L4 vs L7** and when each fits.
2. **Choose an algorithm** based on workload.
3. **Design health checks** (liveness, readiness, outlier detection).
4. **Plan zero-downtime deploys** (readiness, draining, graceful shutdown).
5. **Choose a discovery pattern** (server-side, client-side, mesh).
6. **Keep services stateless.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "The load balancer spreads traffic" | Explains L4 vs L7 and algorithms |
| Single health check | Liveness vs readiness, outlier detection |
| Ignores long-lived connections | Handles HTTP/2/gRPC balancing |
| Hard shutdowns | Draining and graceful shutdown |
| Sticky sessions by default | Stateless services |

#### Useful phrases
- "For gRPC, I'd use L7 balancing so requests, not connections, are balanced."
- "Readiness controls traffic; liveness controls restarts."
- "Old instances drain in-flight requests before shutting down."
- "Keeping services stateless lets any instance serve any request."

#### Common pitfalls
- **L4 balancing for HTTP/2/gRPC** causing imbalance.
- **Deep readiness checks** that cascade failures.
- **No connection draining.**
- **Sticky sessions** hiding statefulness.
- **Stale discovery data** without health checks.

#### Follow-ups to expect (with sample answers)
- **"How does Kubernetes do service discovery?"**
  "Services get stable DNS names and virtual IPs; kube-proxy or the CNI routes to healthy pod endpoints selected by labels and readiness."
- **"What's a sidecar?"**
  "A helper container running alongside the application container (e.g. Envoy) that handles networking concerns."
- **"How do you avoid a thundering herd when instances restart?"**
  "Gradual traffic ramp-up (slow start), warm caches before readiness, and staggered deploys."

#### What senior interviewers look for
- **Operational depth** in deployment and traffic management.
- Awareness of **protocol-specific** issues.
- **Resilience** thinking in health checks.

#### Practise it
1. Explain L4 vs L7 load balancing with an example, out loud.
2. Design liveness and readiness checks for a service with a database and two dependencies.
3. Describe a zero-downtime deployment sequence.
