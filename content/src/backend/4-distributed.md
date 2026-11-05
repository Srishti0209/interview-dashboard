# Backend Engineer — Distributed Systems

## CAP and PACELC explained
- id: be-dist-01
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: CAP theorem, PACELC, consistency, availability

### Prompt
Explain the CAP theorem and PACELC. How do they affect the design decisions you make for a distributed database or service?

### Answer
#### What the interviewer is really testing
- Accurate understanding of **CAP** (not the common misconceptions).
- Awareness of **PACELC**, which captures latency trade-offs in normal operation.
- Ability to **apply** these to real systems and requirements.
- Nuance: consistency and availability exist on a **spectrum**.

#### Key points
- **CAP**: in the presence of a **network partition (P)**, a distributed system must choose between **Consistency (C)** (every read sees the latest write, linearisability) and **Availability (A)** (every request to a non-failing node gets a response).
- Partitions **will** happen, so "CA" isn't a real choice for distributed systems; the real choice is **CP vs AP during partitions**.
- **PACELC**: if **Partition**, choose **A or C**; **Else** (normal operation), choose **Latency or Consistency**.
- Examples (default configurations, simplified): **Spanner, etcd, ZooKeeper**: CP / EC. **Cassandra, DynamoDB (default)**: AP / EL, with tunable consistency.
- Many systems are **tunable** (e.g. quorum reads/writes).
- Choose per **use case**: money and inventory lean toward consistency; feeds and likes can be available and eventually consistent.

#### Model answer
"**CAP** says that when a **network partition** occurs (nodes can't communicate with each other), a distributed system can't guarantee both:
- **Consistency**: every read returns the most recent write (linearisability), and
- **Availability**: every request to a working node receives a non-error response.

Since partitions are a fact of life in distributed systems (network failures, overloaded links, cloud zone issues), the practical question is: **during a partition, do we prefer consistency or availability?**
- **CP systems** refuse some requests (return errors or time out) rather than risk returning stale or conflicting data. Example: a coordination service like etcd or ZooKeeper; if a node can't reach the majority, it stops accepting writes.
- **AP systems** keep responding on both sides of the partition, accepting that data may be stale or conflicting, and reconcile later. Example: Cassandra or DynamoDB configured for high availability.

**Common misconceptions:**
- 'Pick two of three' at all times: wrong. The trade-off only applies **during partitions**.
- 'CA systems': a single-node database is 'CA' only because it isn't distributed.
- Consistency in CAP (linearisability) is different from the **C in ACID** (constraints).

**PACELC** extends CAP: **if Partition → A or C; Else → Latency or Consistency.** Even when the network is fine, strong consistency usually requires coordination (waiting for a quorum or a leader across zones/regions), which adds **latency**. So systems also choose between **low latency** and **strong consistency** in normal operation.
- Spanner: consistent in both cases (PC/EC), paying latency for global consistency.
- Cassandra with low consistency levels: available and low-latency (PA/EL), with eventual consistency.

**How it affects my designs:**
- **Payments, inventory, account balances**: prefer **consistency**. Better to reject or delay a request than to double-spend or oversell.
- **Social feeds, likes, view counts, product reviews**: prefer **availability and low latency**. A few seconds of staleness is fine.
- **Shopping carts**: often AP (Amazon's Dynamo paper famously chose availability for carts, merging conflicting versions), because losing the ability to add to cart costs more than occasional merge issues.
- Use **tunable consistency** where available, e.g. quorum reads/writes (R + W > N) for important data, single-node reads for less critical data."

#### Another worked example: a multi-region user profile service
"Users in Europe and the US update profiles. Options:
- **CP approach**: a single leader region for writes; during a cross-region partition, users far from the leader can't update profiles (writes fail) but data is always consistent.
- **AP approach**: write locally in each region, replicate asynchronously, resolve conflicts (last-writer-wins on each field).
For profile names and bios, AP with last-writer-wins is acceptable. For a user's account email (used for login and security), I'd keep a single source of truth (CP) to avoid conflicting security-critical data."

#### A third worked example: tunable quorums
"In a Cassandra-style system with replication factor N = 3:
- Writing with W = 2 and reading with R = 2 gives R + W > N, so reads overlap with the latest successful write on at least one replica: strong-ish consistency at higher latency.
- Writing with W = 1 and reading with R = 1 is fastest and most available, but reads may be stale.
We used quorum for order status updates and W=1/R=1 for clickstream counters."

#### Variations you might be asked
- "Is a relational database with replicas CP or AP?": it depends on configuration: reading from async replicas behaves like eventual consistency; failover behaviour determines what happens during partitions.
- "Where does Kafka sit?": it can be configured toward consistency (acks=all, min in-sync replicas) or availability (allowing unclean leader election).
- "Why not always choose consistency?": it costs latency and availability, which may harm user experience and revenue for features that tolerate staleness.

#### CAP / PACELC summary
| System (typical config) | Partition | Else | Notes |
|---|---|---|---|
| etcd / ZooKeeper | C | C | Coordination, leader election |
| Spanner | C | C | Global consistency, higher latency |
| Cassandra (low CL) | A | L | Tunable per query |
| DynamoDB (default reads) | A | L | Strongly consistent reads optional |
| Single-node PostgreSQL | n/a | C | Not distributed |

#### Step-by-step framework
1. **Define CAP correctly**, emphasising partitions.
2. **Explain CP vs AP** with examples.
3. **Correct misconceptions.**
4. **Introduce PACELC** (latency vs consistency).
5. **Apply per use case**, including tunable consistency.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Pick any two of three" | Trade-off applies during partitions |
| Claims systems are "CA" | Explains why CA isn't realistic for distributed systems |
| Ignores latency | Uses PACELC to discuss latency vs consistency |
| One choice for the whole system | Different choices per data type |
| Confuses ACID and CAP consistency | Distinguishes them |

#### Useful phrases
- "Partitions will happen, so the real choice is consistency or availability during a partition."
- "PACELC adds that even without partitions, stronger consistency costs latency."
- "For payments I'd choose consistency; for likes, availability."
- "With quorums, R plus W greater than N gives overlapping reads and writes."

#### Common pitfalls
- **Misstating CAP** as a permanent "pick two".
- **Claiming CA** for distributed systems.
- **Treating consistency as binary.**
- **Applying one trade-off** to all data.

#### Follow-ups to expect (with sample answers)
- **"What is linearisability?"**
  "A strong consistency model where operations appear to happen instantly at some point between start and finish, in a single global order consistent with real time."
- **"What's eventual consistency?"**
  "If no new updates occur, all replicas eventually converge to the same value, but reads in between may be stale."
- **"How do you handle conflicts in AP systems?"**
  "Last-writer-wins, version vectors with application merging, or CRDTs that merge automatically."

#### What senior interviewers look for
- **Precise** reasoning and correcting misconceptions.
- **Business-driven** consistency choices.
- Awareness of **real system configurations** and tuning.

#### Practise it
1. Explain CAP correctly in 60 seconds.
2. For five features (balance, cart, likes, inventory, profile bio), choose CP or AP and justify.
3. Explain PACELC with one example, out loud.

## Consistency models: strong, eventual, read-your-writes
- id: be-dist-02
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: consistency models, eventual consistency, session guarantees

### Prompt
Describe common consistency models in distributed systems. How would you give users a good experience on top of an eventually consistent system?

### Answer
#### What the interviewer is really testing
- Knowledge of the **consistency spectrum** beyond "strong vs eventual".
- **Session guarantees** that matter for user experience.
- Practical **techniques** to implement them.
- Matching consistency to **business requirements**.

#### Key points
- **Linearisable (strong)**: reads always see the latest write; behaves like a single copy.
- **Sequential consistency**: all nodes see operations in the same order (not necessarily real-time).
- **Causal consistency**: causally related operations (e.g. a reply after a post) are seen in order by everyone.
- **Eventual consistency**: replicas converge if updates stop; reads may be stale meanwhile.
- **Session guarantees**:
  - **Read-your-writes**: users always see their own updates.
  - **Monotonic reads**: users never see data go "back in time".
  - **Monotonic writes**: a user's writes are applied in order.
  - **Consistent prefix**: readers see updates in an order that makes sense (no answers before questions).
- Techniques: route to the **leader** after writes, **sticky sessions** to a replica, **version tokens/LSNs**, client-side optimistic UI.

#### Model answer
"Consistency is a **spectrum**:
- **Strong (linearisable)**: every read reflects the latest completed write, as if there were one copy. Easy to reason about, but requires coordination, which costs latency and availability.
- **Causal**: if one event causally depends on another (Bob's reply to Alice's comment), everyone sees them in that order. Unrelated events may appear in different orders.
- **Eventual**: replicas converge over time if updates stop. Reads may return stale data in the meantime.

For users, raw eventual consistency can feel broken, so I add **session guarantees**:

1. **Read-your-writes**: after a user changes their profile, they must see the change.
   - Route that user's reads to the **leader** for a short time after a write, or
   - Return a **version token** (e.g. the database log position) with the write response; subsequent reads include it, and the system only uses replicas that have caught up to that version, or
   - Update the UI **optimistically** on the client while the backend catches up.

2. **Monotonic reads**: a user shouldn't see a new comment and then, after refreshing, not see it.
   - Pin a user's session to the same replica (**sticky routing**), or use version tokens so reads never go backwards.

3. **Consistent prefix / causal ordering**: in a chat, never show a reply before the message it replies to.
   - Use **per-conversation sequence numbers** and order by them; or include causal dependencies.

4. **Monotonic writes**: a user's edits apply in the order made.
   - Route a user's writes through the same partition/leader, or use per-entity sequence numbers.

**Choosing per feature:**
- Balances, payments, inventory: **strong consistency**.
- Profile edits, settings: **eventual + read-your-writes**.
- Comments, chat: **causal ordering** within a conversation.
- View counts, likes: **eventual** is fine.

**Example.** On a marketplace, sellers updated a listing price and saw the old price on reload (served from a lagging replica), so they filed bug reports. We added read-your-writes: after a seller edits, their requests use the primary for 30 seconds. Complaints stopped, while buyers continued to read from replicas."

#### Another worked example: a globally distributed comment system
"Comments are replicated across regions asynchronously. A user in London posts a comment and a reply arrives from Sydney. Without causal ordering, some users might see the reply first. We attach a **causal timestamp** (e.g. vector clock or the parent comment's ID with sequence numbers per thread) and buffer replies until their parent is visible. The thread always reads in a sensible order."

#### A third worked example: optimistic UI as a consistency tool
"In a task app, when a user marks a task complete, the UI updates immediately (optimistic update) and sends the request. If the server rejects it (e.g. conflict), the UI reverts and shows a message. Combined with read-your-writes on the backend, users perceive the system as instant and consistent, even though replicas lag slightly."

#### Variations you might be asked
- "How would you implement read-your-writes with a cache in front of the database?": invalidate the user's cached entries on write, or bypass the cache for that user briefly.
- "What consistency does DynamoDB provide?": eventually consistent reads by default, with optional strongly consistent reads (at higher cost and latency) and transactions for multi-item operations.
- "What's 'bounded staleness'?": a guarantee that reads are at most a certain time or number of versions behind the latest write.

#### Consistency models at a glance
| Model | Guarantee | Typical use |
|---|---|---|
| Linearisable | Always latest | Money, locks, inventory |
| Sequential | Same order everywhere | Some replicated logs |
| Causal | Cause before effect | Comments, chat |
| Eventual | Converges eventually | Counters, feeds, caches |
| Read-your-writes | See own updates | Profiles, settings |
| Monotonic reads | No going back in time | Feeds, dashboards |

#### Step-by-step framework
1. **Explain the spectrum** of models.
2. **Introduce session guarantees.**
3. **Give implementation techniques** for each.
4. **Choose per feature** based on business needs.
5. **Include UX techniques** (optimistic UI).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Strong or eventual" only | Explains causal and session guarantees |
| Accepts confusing UX | Adds read-your-writes and monotonic reads |
| No implementation detail | Leader routing, version tokens, sticky sessions |
| Same consistency everywhere | Chosen per feature |

#### Useful phrases
- "Users should always see their own writes, even on an eventually consistent system."
- "Version tokens let us use replicas only once they've caught up."
- "For chat, causal ordering within a conversation is what matters."
- "View counts can be eventually consistent; balances can't."

#### Common pitfalls
- **Ignoring session guarantees.**
- **Overusing strong consistency** everywhere (latency, cost).
- **Out-of-order displays** in threaded content.
- **Not explaining staleness** to stakeholders.

#### Follow-ups to expect (with sample answers)
- **"How do vector clocks help?"**
  "They track causal history per node, letting systems detect whether events are causally related or concurrent (and therefore conflicting)."
- **"Can caching break read-your-writes?"**
  "Yes. Invalidate or update caches on writes, or bypass them for the writer briefly."
- **"How would you test consistency behaviour?"**
  "Inject replication lag in tests and staging, and use tools like Jepsen-style testing for distributed databases."

#### What senior interviewers look for
- **User-centred** consistency design.
- **Precise vocabulary** and implementation knowledge.
- **Cost/latency awareness**.

#### Practise it
1. Describe read-your-writes and two ways to implement it.
2. Give an example where causal ordering matters and how you'd enforce it.
3. Choose consistency models for five features, out loud.

## Consensus and Raft at a high level
- id: be-dist-03
- round: DISTRIBUTED_SYSTEMS
- difficulty: hard
- levels: senior, staff
- tags: consensus, Raft, leader election, replication

### Prompt
What problem do consensus algorithms solve? Explain how Raft works at a high level and where you'd encounter it in practice.

### Answer
#### What the interviewer is really testing
- Understanding **why consensus is needed** (agreement despite failures).
- A clear high-level explanation of **Raft**: leader election, log replication, safety.
- Knowledge of **quorums**, terms, and failure tolerance (2f + 1 nodes tolerate f failures).
- Practical awareness: **etcd, Consul, ZooKeeper, Kafka KRaft**, distributed databases.

#### Key points
- **Consensus**: getting a group of nodes to agree on a value or an ordered log, even when some nodes crash or messages are delayed.
- Used for **leader election**, **replicated state machines**, **configuration**, **distributed locks**, **metadata** management.
- **Raft** (designed for understandability):
  - Nodes are **followers**, **candidates** or **leader**.
  - **Terms** (numbered epochs) identify leadership periods.
  - **Leader election**: followers time out without heartbeats → become candidates → request votes → majority wins.
  - **Log replication**: leader appends entries, replicates to followers; an entry is **committed** once stored on a **majority**.
  - **Safety**: only candidates with up-to-date logs can win; committed entries are never lost.
- **Majority quorums**: 3 nodes tolerate 1 failure; 5 tolerate 2.
- Consensus is **CP**: without a majority, the system stops accepting writes.

#### Model answer
"**The problem.** In a distributed system, we often need nodes to **agree**: who is the leader? What's the order of operations? What's the current configuration? Doing this safely is hard because nodes crash, networks partition and messages are delayed. **Consensus algorithms** let a group agree on a sequence of values (a replicated log) as long as a **majority** of nodes are working and can communicate.

**Raft at a high level:**

**1. Roles and terms**
- Each node is a **follower**, **candidate** or **leader**.
- Time is divided into **terms** (1, 2, 3…). Each term has at most one leader.

**2. Leader election**
- The leader sends regular **heartbeats** to followers.
- If a follower hears nothing within a randomised **election timeout** (e.g. 150–300 ms), it becomes a **candidate**, increments the term, votes for itself and requests votes from others.
- A node votes for at most one candidate per term, and only if the candidate's log is **at least as up to date** as its own.
- A candidate with votes from a **majority** becomes leader. Randomised timeouts make split votes rare.

**3. Log replication**
- Clients send commands to the leader. The leader appends them to its log and sends them to followers (AppendEntries).
- Once a **majority** have stored an entry, it's **committed**; the leader applies it to its state machine and replies to the client. Followers apply committed entries in the same order.
- If a follower is behind or has conflicting entries, the leader overwrites them to match its log.

**4. Safety and failure tolerance**
- Committed entries survive leader changes, because any new leader must have all committed entries (it needed votes from a majority, which overlaps with the majority that stored the entry).
- With **5 nodes**, the cluster tolerates **2 failures**. With 3 nodes, 1 failure.
- If a partition leaves only a minority on one side, that side **can't elect a leader or commit writes**, which keeps it consistent (a CP choice).

**Where I'd encounter it:**
- **etcd** (Kubernetes' configuration store), **Consul**, **Kafka KRaft** (metadata), distributed SQL databases (CockroachDB, TiDB, YugabyteDB), and ZooKeeper (which uses a similar protocol, ZAB).
- As an application engineer, I rarely implement consensus. I **use** these systems for leader election, locks, service discovery and configuration, and I need to understand their failure behaviour: e.g. losing quorum makes them read-only or unavailable, and cross-region clusters have higher write latency.

**Practical guidance**: use odd numbers of nodes (3 or 5), spread across failure zones; keep consensus clusters small (more nodes = slower writes); don't use them as general-purpose databases."

#### Another worked example: leader election for a scheduler
"We needed exactly one active instance of a job scheduler. Instead of building our own election, each instance tried to acquire a **lease** in etcd (backed by Raft). The holder renewed it periodically; if it crashed, the lease expired and another instance took over within seconds. To protect against a paused old leader resuming, each lease came with a **fencing token** (increasing revision number) that downstream systems checked."

#### A third worked example: losing quorum
"A 3-node etcd cluster lost 2 nodes when a cloud zone and another node failed together. The remaining node couldn't form a majority, so Kubernetes' control plane stopped accepting changes (existing workloads kept running). Lesson: spread nodes across three zones, use 5 nodes for critical clusters, and monitor quorum health."

#### Variations you might be asked
- "What's the difference between Raft and Paxos?": both solve consensus; Raft was designed to be easier to understand and implement, with a strong leader and clear phases.
- "Why do you need a majority, not just any two nodes?": majorities always overlap, which guarantees a new leader knows about all committed entries.
- "Can consensus systems handle malicious nodes?": standard Raft/Paxos assume crash failures, not malicious behaviour; Byzantine fault tolerance needs different algorithms.

#### Cluster size vs fault tolerance
| Nodes | Majority | Failures tolerated |
|---|---|---|
| 3 | 2 | 1 |
| 5 | 3 | 2 |
| 7 | 4 | 3 |

#### Step-by-step framework
1. **State the problem** consensus solves.
2. **Describe Raft roles and terms.**
3. **Explain leader election.**
4. **Explain log replication and commitment.**
5. **Explain safety and failure tolerance.**
6. **Connect to real systems** and practical guidance.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It's how nodes vote" | Explains election, replication and commitment |
| Ignores majorities | Explains quorum overlap and fault tolerance |
| Suggests building your own | Uses etcd/Consul/ZooKeeper |
| Ignores partitions | Minority side stops writes (CP) |
| Even-numbered clusters | Odd numbers across zones |

#### Useful phrases
- "An entry is committed once a majority has stored it."
- "Randomised election timeouts make split votes unlikely."
- "With five nodes, we can lose two and keep working."
- "I'd use etcd for leader election rather than building consensus myself."

#### Common pitfalls
- **Implementing consensus from scratch.**
- **Even-sized clusters** (no extra fault tolerance).
- **Large clusters** that slow writes.
- **Ignoring fencing** for leases and locks.
- **Using consensus stores as general databases.**

#### Follow-ups to expect (with sample answers)
- **"What's a fencing token?"**
  "A monotonically increasing number issued with a lock/lease; resources reject operations with older tokens, preventing stale leaders from causing damage."
- **"Why is cross-region consensus slow?"**
  "Every commit needs acknowledgements from a majority, which requires round trips between regions."
- **"How do reads work in Raft?"**
  "Linearisable reads go through the leader (often confirming leadership with a heartbeat); follower reads can be stale unless extra mechanisms are used."

#### What senior interviewers look for
- **Conceptual clarity** without unnecessary detail.
- **Operational understanding** of consensus-based systems.
- Knowing **when to rely on them** and their limits.

#### Practise it
1. Draw a Raft election and log replication sequence.
2. Explain why 3 or 5 nodes, not 4.
3. Describe how you'd implement leader election for a service using etcd, out loud.
