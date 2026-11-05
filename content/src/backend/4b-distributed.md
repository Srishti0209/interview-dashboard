# Backend Engineer — Distributed Systems (continued)

## Distributed transactions and the saga pattern
- id: be-dist-04
- round: DISTRIBUTED_SYSTEMS
- difficulty: hard
- levels:
- tags: sagas, distributed transactions, microservices, compensation

### Prompt
An order process spans several services: orders, payments, inventory and shipping. How do you keep data consistent across them without a single database transaction?

### Answer
#### What the interviewer is really testing
- Understanding why **two-phase commit (2PC)** is usually avoided in microservices.
- The **saga pattern**: local transactions plus **compensating actions**.
- **Orchestration vs choreography** trade-offs.
- Handling **failures, retries, idempotency** and **visibility** of long-running processes.

#### Key points
- **2PC** coordinates a commit across resources but is **blocking**, couples services, and is poorly supported across modern databases and message brokers.
- **Saga**: a sequence of **local transactions**, each publishing an event or triggering the next step. If a step fails, previously completed steps are undone with **compensating transactions**.
- **Choreography**: services react to each other's events (no central coordinator). Simple for few steps; hard to follow as flows grow.
- **Orchestration**: a central **orchestrator** (state machine/workflow engine) tells services what to do. Clearer flow, easier monitoring; the orchestrator is an extra component.
- Steps and compensations must be **idempotent**; use the **outbox pattern** to publish events reliably.
- Sagas give **eventual consistency**: intermediate states are visible (e.g. "order pending").
- Some actions can't be undone (emails sent): use **semantic compensation** (send a correction) or order steps so irreversible ones come last.

#### Model answer
"In a microservices architecture, each service owns its database, so a single ACID transaction across orders, payments, inventory and shipping isn't practical. **Two-phase commit** would lock resources across services while waiting for a coordinator, reducing availability and coupling everything. Instead, I'd use a **saga**.

**Saga for placing an order:**
1. **Orders**: create order with status `PENDING`.
2. **Inventory**: reserve items.
3. **Payments**: charge the customer.
4. **Orders**: mark `CONFIRMED`.
5. **Shipping**: create shipment.

**Compensations if something fails:**
- Payment fails → **release inventory reservation** → mark order `FAILED` and notify the customer.
- Shipping creation fails permanently → **refund payment** → **release inventory** → mark order `CANCELLED` (or retry shipping before giving up).

**Orchestration vs choreography:**
- **Choreography**: Orders publishes `OrderCreated`; Inventory listens, reserves, publishes `InventoryReserved`; Payments listens, charges, publishes `PaymentSucceeded`… Each service knows which events to react to. Good for simple flows, but with 5+ steps it becomes hard to understand, test and change, because the flow is implicit across many services.
- **Orchestration**: an **Order Saga Orchestrator** (or a workflow engine like Temporal, AWS Step Functions, Camunda) holds the state machine: it calls Inventory, waits for the result, calls Payments, and so on, running compensations on failure. The flow is explicit, observable and easier to change.

For an order flow with several steps and compensations, I'd choose **orchestration**.

**Making it reliable:**
- **Idempotency**: every step and compensation must be safe to retry (e.g. 'reserve inventory for order X' does nothing if already reserved).
- **Outbox pattern**: when a service updates its database and publishes an event, both happen atomically via an outbox table, so events aren't lost or duplicated inconsistently.
- **Timeouts and retries**: transient failures are retried with backoff; permanent failures trigger compensation.
- **Persistence of saga state**: the orchestrator stores progress, so it can resume after crashes.
- **Visibility**: dashboards showing sagas in each state, stuck sagas, and failure reasons.

**Designing for eventual consistency:**
- Users see intermediate states ('Order received, confirming payment…').
- Place **irreversible steps last** (e.g. send the confirmation email after payment succeeds).
- For actions that can't be truly undone, use **semantic compensation**: a refund instead of 'un-charging', a cancellation email after a confirmation."

#### Another worked example: travel booking
"Booking a trip involves a flight, hotel and car rental from different providers:
- Reserve flight → reserve hotel → reserve car → take payment → confirm all.
- If the car rental fails, compensate by cancelling the hotel and flight reservations (if within free-cancellation windows).
- Some providers charge cancellation fees, so the saga's order matters: reserve the hardest-to-get or most likely to fail items first, and take payment only when everything is reserved."

#### A third worked example: a saga that got stuck
"An orchestrator crashed after reserving inventory but before calling payments. Because saga state was persisted, on restart it resumed and called payments with the same idempotency key. One reservation, however, belonged to a saga whose state record had been lost due to a bug; inventory stayed reserved indefinitely. We added reservation expiry as a safety net and a reconciliation job that releases reservations without an active saga."

#### Variations you might be asked
- "When would you still use 2PC/XA?": within a single database or tightly coupled systems that support it well, where availability trade-offs are acceptable.
- "How do you test sagas?": unit tests for the state machine, integration tests with failures injected at each step, and contract tests between services.
- "How do you handle a compensation that fails?": retry with backoff, alert, and route to a manual resolution queue if it keeps failing.

#### Orchestration vs choreography
| Aspect | Choreography | Orchestration |
|---|---|---|
| Control | Distributed via events | Central coordinator |
| Visibility | Hard to see the full flow | Explicit state machine |
| Coupling | Services coupled to events | Services coupled to orchestrator |
| Best for | Simple, few steps | Complex flows with compensations |
| Tools | Message broker | Temporal, Step Functions, Camunda |

#### Step-by-step framework
1. **Explain why not 2PC.**
2. **Define the saga steps** as local transactions.
3. **Define compensations** for each step.
4. **Choose orchestration or choreography.**
5. **Ensure reliability**: idempotency, outbox, retries, persistence.
6. **Design UX for intermediate states** and irreversible actions.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use a distributed transaction" | Explains why 2PC is avoided; uses sagas |
| No compensation plan | Compensations for each step |
| Events published after DB commit (dual write) | Outbox pattern |
| Non-idempotent steps | Idempotent steps and compensations |
| No visibility | Saga state persistence and dashboards |

#### Useful phrases
- "Each service commits locally; if a later step fails, earlier steps are compensated."
- "For a flow with several steps, I'd use an orchestrator so the process is explicit."
- "Irreversible actions like emails go last."
- "Every step must be idempotent because retries will happen."

#### Common pitfalls
- **Assuming ACID across services.**
- **Missing compensations.**
- **Dual writes** losing events.
- **Choreography spaghetti** for complex flows.
- **No reconciliation** for stuck sagas.

#### Follow-ups to expect (with sample answers)
- **"What if a customer cancels during the saga?"**
  "The orchestrator handles a cancel signal: it stops forward steps and runs compensations for completed ones."
- **"How do you keep the order status accurate?"**
  "The orchestrator updates the order service at each step, and the order status reflects saga state."
- **"What's the difference between a saga and a workflow engine?"**
  "A saga is the pattern; a workflow engine is a tool that implements durable state machines, retries and timers, making orchestrated sagas easier."

#### What senior interviewers look for
- **Failure-first** thinking.
- **Pragmatic tooling** choices.
- **Business-aware** compensation design.

#### Practise it
1. Write the saga steps and compensations for an order flow.
2. Compare orchestration and choreography, out loud.
3. Describe what happens if the orchestrator crashes mid-saga.

## Message queues vs event streams (RabbitMQ vs Kafka)
- id: be-dist-05
- roles: backend, fullstack
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: Kafka, RabbitMQ, messaging, event streaming

### Prompt
What's the difference between a message queue like RabbitMQ/SQS and an event streaming platform like Kafka? When would you use each?

### Answer
#### What the interviewer is really testing
- Understanding of **queue semantics** (work distribution, deletion on ack) vs **log semantics** (retention, replay, multiple consumers).
- Knowledge of **partitions, consumer groups, offsets, ordering**.
- Matching tools to **use cases**: task queues vs event-driven architectures and data pipelines.
- Awareness of **operational** trade-offs.

#### Key points
- **Message queue** (RabbitMQ, SQS, ActiveMQ): messages are delivered to consumers and **removed once acknowledged**. Good for **task distribution**, work queues, request buffering; supports routing, priorities, delays, dead-letter queues.
- **Event stream / log** (Kafka, Pulsar, Kinesis): events are **appended to a durable log** and **retained** (days or forever). Consumers track their own **offsets**; **many consumer groups** can read the same events independently and **replay** history.
- Kafka **ordering** is guaranteed **within a partition**; partition by key (e.g. order ID) for per-entity ordering.
- Kafka scales via **partitions**; consumer parallelism is limited by partition count.
- Choose queues for **jobs/commands**; streams for **events consumed by many services**, **analytics pipelines**, **event sourcing**, **CDC**.

#### Model answer
"They solve related but different problems.

**Message queues (RabbitMQ, Amazon SQS):**
- A producer sends a message; a consumer receives it, processes it and **acknowledges** it; the message is then **deleted**.
- Multiple consumers on the same queue **share the work** (competing consumers).
- Features: routing (RabbitMQ exchanges), priorities, delayed messages, per-message acknowledgement, **dead-letter queues** for failed messages.
- **Use cases**: background jobs (send email, resize image, generate report), smoothing traffic spikes, commands to a specific service.

**Event streaming (Kafka):**
- Producers append events to a **topic**, split into **partitions**. Events are **retained** for a configured period regardless of consumption.
- Each **consumer group** tracks its own **offset** per partition, so several independent systems (billing, analytics, search indexing, notifications) can all read the same events at their own pace.
- Consumers can **replay** from an earlier offset, e.g. to rebuild a search index or recover from a bug.
- **Ordering** is guaranteed within a partition; choosing a key like `order_id` keeps all events for an order in order.
- Very **high throughput** and horizontal scaling via partitions.
- **Use cases**: event-driven microservices (`OrderPlaced` consumed by many services), CDC pipelines, activity streams, metrics/log pipelines, event sourcing.

**How I choose:**
- 'Process this job once, by one worker' → **queue** (SQS/RabbitMQ).
- 'Tell everyone who cares that this happened, keep a history, allow replay' → **stream** (Kafka).
- Very high-volume data pipelines → **Kafka**.
- Simple needs on a cloud platform → managed services (SQS/SNS, or managed Kafka) to reduce operational load.

**Trade-offs:**
- Kafka is more complex to operate (partitions, rebalancing, retention, schema management) unless managed.
- Kafka consumer parallelism is limited by partitions; per-message retries/delays are less natural than in queues (often handled with retry topics).
- Queues don't offer replay or multiple independent consumers of the same message without fan-out (e.g. SNS → multiple SQS queues)."

#### Another worked example: combining both
"In an e-commerce system:
- `OrderPlaced` events go to **Kafka**, consumed by inventory, analytics, recommendations and notifications, each at its own pace, with replay for new consumers.
- The notification service, when it receives `OrderPlaced`, enqueues an 'send confirmation email' **job in SQS**, processed by email workers with retries and a dead-letter queue.
Streams for facts that many care about; queues for work to be done."

#### A third worked example: replay saves the day
"A bug in the search indexer corrupted product documents for six hours. Because product change events were retained in Kafka for 7 days, we fixed the bug, reset the indexer's consumer group offset to before the incident, and replayed the events to rebuild the index. With a traditional queue, those messages would have been gone."

#### Variations you might be asked
- "How many partitions should a Kafka topic have?": enough for expected consumer parallelism and throughput, with room to grow; increasing later changes key-to-partition mapping, so plan ahead.
- "How do you handle poison messages in Kafka?": catch errors, send the message to a retry or dead-letter topic, and continue, so one bad message doesn't block the partition.
- "What's SNS + SQS fan-out?": publishing to an SNS topic delivers copies to several SQS queues, giving multiple independent consumers with queue semantics.

#### Comparison
| Aspect | Message queue | Event stream (Kafka) |
|---|---|---|
| Model | Messages removed after ack | Append-only log, retained |
| Consumers | Compete for messages | Many independent groups |
| Replay | No | Yes (within retention) |
| Ordering | Per queue (often best-effort) | Per partition |
| Strength | Task distribution, routing, delays | High throughput, fan-out, history |
| Typical use | Background jobs | Event-driven architecture, pipelines |

#### Step-by-step framework
1. **Explain queue semantics.**
2. **Explain log/stream semantics** (partitions, offsets, retention).
3. **Compare** ordering, replay, fan-out, throughput.
4. **Map use cases** to each.
5. **Discuss operations** and managed options.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Kafka is a faster queue" | Explains log vs queue semantics |
| Ignores ordering | Per-partition ordering and keys |
| No replay discussion | Replay and multiple consumer groups |
| Same tool for everything | Queues for jobs, streams for events |

#### Useful phrases
- "A queue distributes work; a stream records facts many services can read."
- "Kafka keeps events after consumption, so consumers can replay."
- "Ordering is per partition, so I'd key by order ID."
- "For simple background jobs, SQS is easier to run."

#### Common pitfalls
- **Using Kafka as a job queue** without retry design.
- **Too few partitions** for future scale.
- **Ignoring ordering** requirements.
- **No schema management** for events.

#### Follow-ups to expect (with sample answers)
- **"What's a consumer group?"**
  "A set of consumers sharing a topic's partitions; each partition is read by one consumer in the group, giving parallelism, while other groups read independently."
- **"How do you manage event schemas?"**
  "A schema registry (Avro/Protobuf/JSON Schema) with compatibility rules, so producers can't publish breaking changes."
- **"What's log compaction?"**
  "Kafka keeps only the latest value per key in a compacted topic, useful for changelogs and state snapshots."

#### What senior interviewers look for
- **Right tool selection** and hybrid designs.
- **Operational** understanding (partitions, retention, schemas).
- **Data pipeline** thinking.

#### Practise it
1. List three use cases for queues and three for streams.
2. Explain partitions, offsets and consumer groups, out loud.
3. Design a topic and key strategy for order events.

## Delivery semantics: at-most-once, at-least-once, exactly-once
- id: be-dist-06
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: delivery guarantees, messaging, idempotency, Kafka

### Prompt
Explain at-most-once, at-least-once and exactly-once delivery. Which do you design for, and is exactly-once really possible?

### Answer
#### What the interviewer is really testing
- Precise understanding of **delivery guarantees** and where messages can be lost or duplicated.
- The practical stance: **at-least-once delivery + idempotent processing** = effectively once.
- Awareness of **Kafka's exactly-once semantics** and their scope.
- Where failures occur: **producer → broker**, **broker → consumer**, **consumer → side effects**.

#### Key points
- **At-most-once**: send/process at most once; messages may be **lost**, never duplicated (e.g. acknowledge before processing).
- **At-least-once**: messages are never lost, but may be **duplicated** (e.g. acknowledge after processing; retry on failure).
- **Exactly-once**: each message affects the system exactly once. True end-to-end exactly-once **delivery** is impossible in general, but **exactly-once processing/effects** can be achieved with **idempotency**, **deduplication** or **transactions** within a system.
- Kafka offers **idempotent producers** and **transactions** for exactly-once **within Kafka** (read-process-write between topics), not for arbitrary external side effects.
- Default design: **at-least-once + idempotent consumers**.

#### Model answer
"These describe how many times a message is delivered or processed when failures occur.

**At-most-once.** The consumer acknowledges (or commits its offset) **before** processing. If it crashes during processing, the message is gone, so **messages can be lost** but are never processed twice. Acceptable for things like metrics samples or non-critical telemetry where occasional loss doesn't matter.

**At-least-once.** The consumer processes first, then acknowledges. If it crashes after processing but before acknowledging, the message is redelivered and **processed again**. Producers also retry sends on timeouts, which can create duplicates in the broker. **No loss, possible duplicates.**

**Exactly-once.** Each message affects the system exactly once. In a general distributed system, you can't guarantee exactly-once *delivery*, because a sender can never be sure whether the receiver got the message before a failure (the two generals problem). What we can achieve is **exactly-once *effect***:
- **Idempotent processing**: processing the same message twice has the same effect as once (e.g. 'set order status to shipped' or 'insert payment with unique ID').
- **Deduplication**: store processed message IDs (with a TTL or in the same database transaction as the effect) and skip repeats.
- **Transactions**: in Kafka, idempotent producers + transactions allow 'read from topic A, process, write to topic B and commit offsets' atomically, which gives exactly-once *within Kafka*. Once you write to an external database or call an external API, you're back to needing idempotency.

**My default design: at-least-once delivery + idempotent consumers.**
- Consumers commit offsets/acks **after** successfully processing.
- Each message has a unique **event ID**.
- The consumer records the event ID in the **same database transaction** as its side effect (e.g. in a `processed_events` table with a unique constraint), so a duplicate either finds the ID and skips, or the transaction fails cleanly.
- External calls (e.g. payment provider) use **idempotency keys** derived from the event ID.

**Example.** A 'payment succeeded' event triggers 'mark order paid and send receipt'. With at-least-once delivery, the event may arrive twice. Marking paid is naturally idempotent (status update), and sending the receipt checks a `receipt_sent` flag set in the same transaction, so customers never get two receipts."

#### Another worked example: where duplicates come from
"Producer side: an order service publishes `OrderPlaced`, the broker writes it, but the acknowledgement is lost; the producer retries and the broker stores a duplicate (unless the producer is idempotent). Consumer side: the consumer processes the event, writes to its database, then crashes before committing the offset; on restart it reprocesses the event. Both paths create duplicates, which is why consumers must handle them regardless of broker features."

#### A third worked example: choosing at-most-once deliberately
"For a 'user is typing' indicator in chat, we used at-most-once: if a typing event is lost, nothing bad happens, and retrying would only show stale indicators. Lower latency and simpler processing were more valuable than reliability for this signal."

#### Variations you might be asked
- "How does SQS FIFO provide exactly-once processing?": it deduplicates messages with the same deduplication ID within a time window; consumers still need idempotency for side effects.
- "How do you make an email sender idempotent?": record a 'sent' marker keyed by event ID before or atomically with sending, and use provider-side idempotency if available.
- "What's the outbox pattern's role here?": it guarantees events are published if and only if the database change committed, removing a major source of inconsistency.

#### Guarantees compared
| Guarantee | Loss | Duplicates | How |
|---|---|---|---|
| At-most-once | Possible | No | Ack before processing |
| At-least-once | No | Possible | Ack after processing, retries |
| Exactly-once effect | No | No (effectively) | At-least-once + idempotency/dedup/transactions |

#### Step-by-step framework
1. **Define each guarantee** and how it arises.
2. **Explain why exactly-once delivery is impossible** in general.
3. **Explain exactly-once effects** (idempotency, dedup, transactions).
4. **State your default** (at-least-once + idempotent consumers).
5. **Show implementation** details.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Kafka gives exactly-once, so no worries" | Knows the scope of Kafka's guarantees |
| Ignores duplicates | Designs idempotent consumers |
| Acks before processing by accident | Acks after processing |
| Dedup in a separate store after the effect | Dedup in the same transaction as the effect |

#### Useful phrases
- "Exactly-once delivery isn't possible in general, but exactly-once effects are."
- "My default is at-least-once delivery with idempotent consumers."
- "We store the event ID in the same transaction as the side effect."
- "Kafka transactions give exactly-once within Kafka, not for external systems."

#### Common pitfalls
- **Overtrusting broker guarantees.**
- **Non-idempotent side effects** (double charges, double emails).
- **Committing offsets before processing** unintentionally (auto-commit).
- **Dedup windows too short.**

#### Follow-ups to expect (with sample answers)
- **"What's Kafka auto-commit's risk?"**
  "Offsets may be committed before processing finishes, causing message loss on crash; manual commits after processing are safer."
- **"How long should you keep processed event IDs?"**
  "Longer than the maximum redelivery window (e.g. retention period or retry duration)."
- **"Is ordering related to delivery guarantees?"**
  "Separately important: retries can reorder messages unless partitioning and in-order processing are maintained."

#### What senior interviewers look for
- **Precise reasoning** about failure points.
- **Practical patterns** that prevent real incidents.
- **Clear communication** of guarantees to other teams.

#### Practise it
1. Explain the three guarantees with one example each.
2. Write pseudocode for an idempotent consumer with a processed-events table.
3. Explain why exactly-once delivery is impossible, out loud.

## Idempotent consumers and deduplication
- id: be-dist-07
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: idempotency, deduplication, consumers, messaging

### Prompt
Your service consumes events that may be delivered more than once or out of order. How do you make processing idempotent and correct?

### Answer
#### What the interviewer is really testing
- Practical **idempotency techniques** for consumers.
- Handling **out-of-order** events with **versions or sequence numbers**.
- Choosing where and how to store **deduplication** state.
- Thinking about **side effects** beyond the database.

#### Key points
- Make operations **naturally idempotent** where possible: "set status = shipped" vs "increment counter".
- **Deduplicate** with unique **event IDs** stored atomically with the effect (unique constraint).
- Use **upserts** and **conditional updates** keyed by business identifiers.
- Handle **ordering** with **version numbers / sequence numbers / timestamps**: ignore events older than the current state.
- **External side effects** (emails, payments) need their own idempotency (flags, idempotency keys).
- Retain dedup records long enough; consider **TTL** or partitioning for cleanup.

#### Model answer
"I'd use a combination of techniques depending on the operation.

**1. Prefer naturally idempotent operations**
- 'Set order status to SHIPPED' can be applied twice safely; 'add 1 to shipped_count' cannot.
- Upserts: `INSERT ... ON CONFLICT (order_id) DO UPDATE ...` keyed by a business identifier.

**2. Deduplicate by event ID**
Each event carries a unique `event_id`. In the **same transaction** as the business change:
```sql
BEGIN;
INSERT INTO processed_events (event_id, processed_at) VALUES (:event_id, now());
-- fails with unique violation if already processed → rollback and skip
UPDATE orders SET status = 'SHIPPED', shipped_at = :ts WHERE id = :order_id;
COMMIT;
```
If the insert fails due to the unique constraint, the event was already processed; acknowledge and skip.

**3. Handle out-of-order events with versions**
Events include a **version** or **sequence number** per entity (e.g. order version 5). The consumer stores the last applied version:
```sql
UPDATE orders
SET status = :status, version = :event_version
WHERE id = :order_id AND version < :event_version;
```
If an older event (version 4) arrives after version 5, the update affects 0 rows and is ignored. This prevents a delayed 'PAID' event from overwriting a newer 'SHIPPED' status.

Alternatives: ensure per-entity ordering by **partitioning by entity ID** (Kafka key) and processing each partition sequentially; but versions protect against reordering from retries or multiple sources too.

**4. Idempotent side effects**
- Emails/notifications: store a 'sent' record keyed by `(event_id or business key, notification_type)` before or atomically with sending; use the provider's idempotency features if available.
- Payments/external APIs: pass an **idempotency key** derived from the event ID.

**5. Cleanup**
- Keep `processed_events` rows longer than the maximum redelivery window (e.g. 7–30 days), then delete via partition drops or TTL.
- For very high volumes, use a fast store like Redis with TTL for dedup, accepting the small risk of a duplicate if Redis loses data, or use the database where correctness is critical.

**Testing**: replay the same events twice and out of order in integration tests, and assert the final state is identical."

#### Another worked example: a counter that must be accurate
"A consumer increments a 'total orders' counter per customer. Increments aren't idempotent, so we store `(customer_id, order_id)` in a `customer_orders` table with a unique constraint and derive the count from it (or increment only when the insert succeeds, in the same transaction). Duplicate events then can't double-count."

#### A third worked example: reordering in practice
"An inventory service received 'stock adjusted to 40' and then 'stock adjusted to 35', but due to a retry they arrived in the opposite order, leaving stock at 40 incorrectly. Adding a per-SKU sequence number and the conditional update `WHERE seq < :new_seq` fixed it: the stale event was ignored."

#### Variations you might be asked
- "How would you deduplicate when events don't have IDs?": derive a deterministic ID from content (e.g. hash of source, entity ID and version), or ask producers to add one.
- "Where should deduplication live: in the broker or the consumer?": broker features help, but the consumer is responsible for idempotent effects.
- "How do you replay events safely?": idempotent consumers make replays harmless; version checks prevent old events overwriting newer state.

#### Techniques summary
| Technique | Solves | Example |
|---|---|---|
| Natural idempotency | Duplicates | Set status instead of increment |
| Event ID dedup table | Duplicates | Unique constraint on event_id |
| Upserts | Duplicates | `ON CONFLICT DO UPDATE` |
| Versions / sequence numbers | Out-of-order | `WHERE version < :v` |
| Partition by key | Ordering | Kafka key = order ID |
| Idempotency keys | External side effects | Payment provider calls |

#### Step-by-step framework
1. **Identify operations** and whether they're naturally idempotent.
2. **Add dedup** by event ID in the same transaction.
3. **Handle ordering** with versions or partitioning.
4. **Protect external side effects.**
5. **Plan cleanup** of dedup state.
6. **Test** duplicates and reordering.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Check if we've seen it" in a separate step (racy) | Atomic dedup via unique constraint |
| Ignores ordering | Versions/sequence numbers |
| Forgets emails/payments | Idempotent side effects |
| Dedup forever, unbounded | Retention aligned with redelivery window |
| No tests | Replays duplicates and reordered events in tests |

#### Useful phrases
- "I'd make the operation naturally idempotent where I can."
- "The event ID goes into a processed-events table in the same transaction."
- "Versions let us ignore stale events that arrive late."
- "Side effects like emails need their own idempotency."

#### Common pitfalls
- **Non-atomic dedup checks.**
- **Ignoring out-of-order delivery.**
- **Increment operations** without dedup.
- **Duplicate emails/payments.**
- **Unbounded dedup tables.**

#### Follow-ups to expect (with sample answers)
- **"What if the dedup store is a different database from the effect?"**
  "Then a crash between the two can cause duplicates or skips; keep them together, or make the effect itself idempotent."
- **"Can timestamps replace versions?"**
  "Sometimes, but clock skew across producers makes them unreliable; per-entity sequence numbers are safer."
- **"How do you handle duplicates across multiple consumers of the same group?"**
  "Kafka assigns each partition to one consumer, but rebalances can cause reprocessing, which is another reason for idempotency."

#### What senior interviewers look for
- **Correctness under real-world messaging behaviour.**
- **Simple, robust patterns** teams can apply consistently.
- **Testing discipline.**

#### Practise it
1. Write an idempotent consumer handler with dedup and version checks.
2. Describe how a stale event could corrupt state and how you'd prevent it.
3. Explain how you'd make sending a receipt email idempotent.

## Event-driven architecture and the outbox pattern
- id: be-dist-08
- round: DISTRIBUTED_SYSTEMS
- difficulty: hard
- levels:
- tags: event-driven, outbox pattern, CDC, dual writes

### Prompt
Your service updates its database and needs to publish an event to Kafka. Why is doing both in application code dangerous, and how does the outbox pattern solve it?

### Answer
#### What the interviewer is really testing
- Understanding the **dual-write problem**.
- How the **transactional outbox** guarantees consistency between state and events.
- Implementation options: **polling publisher** vs **CDC** (e.g. Debezium).
- Broader **event-driven architecture** trade-offs.

#### Key points
- **Dual write**: writing to the database and publishing to a broker are two separate operations; a crash between them leaves state and events **inconsistent** (event lost, or event published for a rolled-back change).
- **Transactional outbox**: in the **same database transaction** as the state change, insert the event into an **outbox table**. A separate process **relays** outbox rows to the broker, marking them published.
- Relay options: **polling** the outbox table, or **CDC** reading the database log (Debezium) to publish events.
- Delivery is **at-least-once**, so consumers must be **idempotent**.
- Preserve **ordering per aggregate** (e.g. per order) when publishing.
- Event-driven benefits: **loose coupling**, extensibility; costs: **eventual consistency**, debugging complexity, **schema governance**.

#### Model answer
"**The dual-write problem.** Imagine the order service does:
```python
db.save(order)             # 1. commit to database
kafka.publish(OrderPlaced) # 2. publish event
```
- If the service crashes **after 1 but before 2**, the order exists but no event is published, so inventory, payments and notifications never react.
- If we publish **first** and the database commit fails, consumers react to an order that doesn't exist.
- Retrying doesn't fully solve it, because the two systems can't share one atomic transaction.

**The transactional outbox pattern:**
1. In the **same local transaction** as the business change, insert a row into an `outbox` table:
   ```sql
   BEGIN;
   INSERT INTO orders (...) VALUES (...);
   INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload, created_at)
   VALUES (:event_id, 'order', :order_id, 'OrderPlaced', :json, now());
   COMMIT;
   ```
   Either both rows commit or neither does, so state and the record of the event are always consistent.
2. A **relay** process reads unpublished outbox rows and publishes them to Kafka, then marks them as published (or deletes them).
3. If the relay crashes after publishing but before marking, it republishes on restart, so delivery is **at-least-once**, and consumers dedupe by `event_id`.

**Relay options:**
- **Polling publisher**: a background job queries `outbox WHERE published_at IS NULL ORDER BY created_at LIMIT 100`, publishes and updates rows. Simple; adds some latency and database load.
- **Change data capture (CDC)**: a tool like **Debezium** reads the database's write-ahead log and publishes outbox inserts to Kafka. Low latency, no polling load, preserves commit order; more infrastructure.

**Ordering.** Publish events for the same aggregate in order and use the aggregate ID as the Kafka **key**, so all events for an order land in the same partition and are consumed in order.

**Housekeeping.** Delete or archive published outbox rows regularly (partition by time for cheap cleanup).

**Event-driven architecture more broadly:**
- **Benefits**: services are decoupled (the order service doesn't need to know who consumes `OrderPlaced`), new consumers can be added without changing producers, and Kafka provides history and replay.
- **Costs**: eventual consistency, harder debugging across services (need tracing and correlation IDs), and **event schema** governance (use a schema registry and compatibility rules)."

#### Another worked example: the inbox pattern on the consumer side
"The consumer can mirror this with an **inbox**: it stores incoming event IDs in an `inbox` table in the same transaction as applying the event. Duplicates are rejected by the unique constraint. Outbox (producer) + inbox (consumer) together give reliable, effectively-once processing across services."

#### A third worked example: an incident caused by dual writes
"A user service updated email addresses and then published `EmailChanged` to Kafka. During a broker outage, publishes failed silently after the database commit. For two hours, the notification service kept sending emails to old addresses. After introducing the outbox with Debezium, broker outages only delayed events; nothing was lost, and events flowed as soon as the broker recovered."

#### Variations you might be asked
- "Can you use the outbox with a NoSQL database?": yes, if the database supports atomic writes of the state and outbox record (e.g. same document/partition, or transactions), plus a change stream for relaying.
- "What should an event payload contain?": event ID, type, aggregate ID, version, timestamp and either the full new state or a delta, versioned with a schema.
- "How do you monitor the outbox?": alert on outbox backlog size and age of the oldest unpublished event.

#### Approaches compared
| Approach | Consistency | Complexity | Notes |
|---|---|---|---|
| Dual write in app | Can diverge | Low | Avoid |
| Outbox + polling | Consistent, at-least-once | Medium | Simple to start |
| Outbox + CDC (Debezium) | Consistent, ordered | Higher | Low latency, scalable |
| Event sourcing | Events are the state | High | Different paradigm |

#### Step-by-step framework
1. **Explain dual writes** and failure scenarios.
2. **Describe the outbox** table and transaction.
3. **Describe relay options** (polling, CDC).
4. **Address ordering and idempotency.**
5. **Cleanup and monitoring.**
6. **Discuss EDA benefits and costs.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Publish after commit and retry" | Recognises dual-write inconsistency |
| No consumer idempotency | At-least-once + idempotent consumers |
| Ignores ordering | Aggregate ID as partition key |
| No monitoring | Alerts on outbox backlog |
| EDA only positives | Discusses eventual consistency and debugging costs |

#### Useful phrases
- "Writing to the database and the broker separately can leave them inconsistent."
- "The outbox row commits in the same transaction as the business change."
- "A relay or CDC publishes outbox rows, at least once."
- "We key events by aggregate ID to keep per-entity ordering."

#### Common pitfalls
- **Dual writes** in application code.
- **Non-idempotent consumers.**
- **Unbounded outbox tables.**
- **No schema governance** for events.
- **Ignoring tracing** in event-driven flows.

#### Follow-ups to expect (with sample answers)
- **"Why not use distributed transactions between the DB and Kafka?"**
  "They're complex, poorly supported across systems, and reduce availability; the outbox achieves the same goal with a local transaction."
- **"What's event sourcing, and how is it different?"**
  "Event sourcing stores the events themselves as the source of truth and derives state from them; the outbox stores state normally and publishes events alongside."
- **"How do you trace a request through events?"**
  "Propagate correlation/trace IDs in event headers and use distributed tracing across producers and consumers."

#### What senior interviewers look for
- **Recognising subtle consistency bugs.**
- **Choosing pragmatic implementations.**
- **Governance** for event-driven systems at scale.

#### Practise it
1. Write the transaction that saves an order and an outbox row.
2. Explain polling vs CDC relays, out loud.
3. Describe the dual-write failure scenarios in 60 seconds.

## Retries, backoff, timeouts and circuit breakers
- id: be-dist-09
- roles: backend, fullstack
- round: DISTRIBUTED_SYSTEMS
- difficulty: medium
- levels:
- tags: resilience, retries, circuit breakers, timeouts

### Prompt
Your service calls several downstream services. How do you make it resilient to slow or failing dependencies?

### Answer
#### What the interviewer is really testing
- Knowledge of core **resilience patterns**: timeouts, retries with backoff and jitter, circuit breakers, bulkheads, fallbacks.
- Avoiding **retry storms** and **cascading failures**.
- Understanding **idempotency** requirements for retries.
- Using **observability** to tune these settings.

#### Key points
- **Timeouts** on every network call: never wait forever. Set based on latency percentiles and an overall **deadline/budget**.
- **Retries** only for **transient** errors (timeouts, 503, connection resets), only for **idempotent** operations (or with idempotency keys), with **exponential backoff + jitter** and a **maximum** number of attempts.
- **Circuit breaker**: after repeated failures, **open** (fail fast) for a period, then **half-open** to test recovery, then **close**.
- **Bulkheads**: isolate resources (thread/connection pools) per dependency so one slow dependency doesn't exhaust everything.
- **Fallbacks / graceful degradation**: cached data, defaults, partial responses.
- **Retry budgets** and limiting retries at one layer to avoid **retry amplification**.

#### Model answer
"I'd layer several patterns.

**1. Timeouts everywhere**
- Every outbound call has a timeout based on the dependency's normal latency (e.g. p99 of 200 ms → timeout ~500 ms), not default library values (which can be minutes or infinite).
- Use an overall **request deadline**: if the user request has a 2-second budget, downstream calls get the remaining time, and deadlines propagate (e.g. gRPC deadlines).

**2. Retries, carefully**
- Retry only **transient** failures: timeouts, connection errors, `503`, `429` (respecting `Retry-After`).
- Only retry **idempotent** operations, or use **idempotency keys** for non-idempotent ones.
- **Exponential backoff with jitter**: e.g. 100 ms, 200 ms, 400 ms, each randomised, so thousands of clients don't retry in sync.
- **Limit attempts** (e.g. 2–3) and stay within the deadline.
- **Retry at one layer only**: if the client, gateway and service all retry 3 times, one failure can turn into 27 calls (retry amplification). Use **retry budgets** (e.g. retries ≤ 10% of requests).

**3. Circuit breakers**
- Track failures per dependency. If the error rate exceeds a threshold (e.g. 50% over 20 requests), the breaker **opens**: calls fail immediately without hitting the dependency, giving it time to recover and freeing our resources.
- After a cool-down, the breaker goes **half-open** and allows a few trial requests; if they succeed it **closes**, otherwise it opens again.

**4. Bulkheads**
- Separate connection pools / concurrency limits per dependency. If the recommendations service hangs, it can only use its own pool, not all the threads needed for checkout.

**5. Fallbacks and graceful degradation**
- Recommendations down → show popular items or hide the section.
- Pricing service slow → use cached prices for browsing, but always verify at checkout.
- Clearly distinguish **critical** dependencies (payments: fail the request) from **optional** ones (recommendations: degrade).

**6. Observability**
- Metrics per dependency: latency percentiles, error rates, timeouts, retries, circuit breaker state.
- Alerts when breakers open or retries spike.

**Example scenario.** A product page calls inventory, pricing, reviews and recommendations. Reviews becomes very slow. Without timeouts, request threads pile up waiting, the service runs out of threads, and the whole product page goes down: a **cascading failure**. With a 300 ms timeout, a circuit breaker and a bulkhead on reviews, the page loads without reviews ('Reviews temporarily unavailable'), and the rest of the site is unaffected."

#### Another worked example: a retry storm
"A database had a brief hiccup. Every service retried immediately three times with no jitter, and clients retried on top of that. When the database recovered, it was hit with several times the normal load and fell over again. Fixes: exponential backoff with jitter, retry budgets, retries only at the outermost appropriate layer, and load shedding at the database proxy."

#### A third worked example: tuning timeouts with data
"A payment provider's p99 latency was 1.8 seconds, but our timeout was 1 second, so we were timing out on legitimate requests and retrying, increasing duplicates and load. We set the timeout to 3 seconds for payment authorisation (with idempotency keys), and kept tighter timeouts for non-critical calls. Timeouts should reflect real latency distributions and business importance."

#### Variations you might be asked
- "What libraries help with this?": resilience libraries such as Resilience4j (Java), Polly (.NET), or service meshes (Envoy/Istio) that implement retries, timeouts and circuit breakers at the network layer.
- "How do you handle a dependency that's slow but not failing?": timeouts plus concurrency limits; consider hedged requests (send a second request after a delay) for read-only calls, carefully.
- "What's load shedding?": rejecting some requests early when overloaded to protect the system, prioritising critical traffic.

#### Patterns summary
| Pattern | Purpose |
|---|---|
| Timeout | Don't wait forever |
| Retry + backoff + jitter | Recover from transient failures without storms |
| Circuit breaker | Fail fast, let dependencies recover |
| Bulkhead | Isolate resources per dependency |
| Fallback | Degrade gracefully |
| Retry budget | Prevent retry amplification |
| Deadline propagation | Respect overall request time |

#### Step-by-step framework
1. **Set timeouts** and deadlines.
2. **Define retry policy** (transient errors, idempotency, backoff, limits).
3. **Add circuit breakers** per dependency.
4. **Isolate with bulkheads.**
5. **Design fallbacks** for optional dependencies.
6. **Observe and tune.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Retry on failure" | Retries only transient errors with backoff and jitter |
| Default timeouts | Explicit timeouts based on latency data |
| No circuit breakers | Breakers with half-open recovery |
| Shared pools for all calls | Bulkheads per dependency |
| All dependencies treated as critical | Fallbacks for optional dependencies |

#### Useful phrases
- "Every network call gets an explicit timeout within the request's deadline."
- "Retries use exponential backoff with jitter, and only for idempotent operations."
- "A circuit breaker fails fast so a struggling dependency can recover."
- "Recommendations can degrade; payments can't."

#### Common pitfalls
- **No timeouts** (or infinite defaults).
- **Retrying non-idempotent operations.**
- **Retry storms** without jitter or budgets.
- **Retries at every layer.**
- **No fallbacks**, causing cascading failures.

#### Follow-ups to expect (with sample answers)
- **"How do you choose circuit breaker thresholds?"**
  "Based on normal error rates and traffic volume, e.g. open when error rate exceeds 50% over a minimum number of requests, tuned using production metrics."
- **"What's the difference between a timeout and a deadline?"**
  "A timeout limits one call; a deadline is the absolute time by which the whole request must finish, propagated to downstream calls."
- **"Should clients or servers handle retries?"**
  "Usually the client closest to the failure, with others avoiding duplicate retries; services should return clear retryable error codes."

#### What senior interviewers look for
- **Systemic thinking** about cascading failures.
- **Data-driven tuning.**
- **Clear critical vs optional dependency** classification.

#### Practise it
1. Design resilience settings for a page calling four dependencies (two critical, two optional).
2. Explain circuit breaker states, out loud.
3. Calculate how retry amplification can multiply load across three layers.
