# Backend Engineer — System Design (continued)

## Design a chat / messaging system
- id: be-design-06
- roles: backend, fullstack
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: system design, websockets, real-time, messaging

### Prompt
Design a messaging service like WhatsApp or Slack: one-to-one and group chats, real-time delivery, message history, and online presence.

### Answer
#### What the interviewer is really testing
- **Real-time communication**: persistent connections (WebSockets), connection management at scale.
- **Message delivery guarantees**: ordering, at-least-once delivery, deduplication, offline delivery.
- **Storage design** for a write-heavy, append-only workload.
- **Group fan-out**, presence and read receipts trade-offs.

#### Key points
- Clients keep a **persistent connection** (WebSocket) to a **gateway/connection server**. A **session registry** (e.g. Redis) maps user → gateway server.
- Messages are **persisted first**, then delivered. Clients **acknowledge**; unacknowledged messages are retried or delivered on reconnect.
- **Ordering per conversation**: assign a monotonically increasing sequence number per conversation.
- **Client-generated message IDs** make retries idempotent (deduplicate on server).
- Storage: **partition by conversation ID**, sorted by sequence/time. Wide-column stores (Cassandra/ScyllaDB) or sharded SQL suit this.
- **Offline users** get push notifications and sync missed messages on reconnect.
- **Presence** is approximate and expensive at scale; use heartbeats with TTLs and limit who receives updates.

#### Model answer
"**1. Requirements**
- Functional: 1:1 and group chats (up to, say, 500 members), send/receive in real time, message history across devices, delivery and read receipts, online presence, push notifications when offline.
- Non-functional: low latency (<200 ms delivery when both online), no lost messages, per-conversation ordering, high availability. End-to-end encryption as a possible extension.
- Scale: 50M DAU, 40 messages/user/day → 2B messages/day ≈ **~23k messages/sec**, peak ~70k/sec; ~10M concurrent connections at peak.

**2. High-level design**
```
Client ⇄ WebSocket ⇄ Gateway servers ──► Chat service ──► Message store (partitioned by conversation)
                          ▲                    │
                          │                    ├─► Session registry (user → gateway)
                          └──── deliver ◄──────┤
                                               └─► Push notification service (offline users)
```

**3. Sending a message (1:1)**
1. Client creates a message with a **client message ID** (UUID) and sends it over its WebSocket.
2. Gateway forwards to the chat service, which:
   - Deduplicates using `(sender, client_message_id)`.
   - Assigns the next **sequence number** for the conversation.
   - **Persists** the message.
   - Acknowledges to the sender ('sent').
3. Chat service looks up the recipient's gateway in the session registry:
   - **Online** → forward to that gateway, which pushes over the WebSocket; the recipient's client acks ('delivered').
   - **Offline** → send a push notification; messages are fetched on reconnect.

**4. Reconnect and sync**
Each client stores the last sequence number it has seen per conversation. On reconnect, it asks 'give me messages after seq X' for each active conversation. This handles dropped connections, multiple devices and missed pushes.

**5. Group messages**
- Store the message **once** in the conversation partition.
- Fan out **delivery** to online members via their gateways; offline members sync later.
- For large groups (e.g. Slack channels with thousands of members), clients can pull new messages when they open the channel instead of the server pushing to everyone.

**6. Storage**
- Table keyed by `(conversation_id, seq)`, partitioned by conversation ID. Messages are append-only and read as recent ranges, which fits a wide-column store well.
- A separate `user_conversations` index lists each user's conversations with last-message metadata for the inbox view.
- Media (images, files) go to object storage; messages store URLs.

**7. Presence**
- Gateways record heartbeats in Redis with a short TTL (e.g. 60 seconds). 'Online' = key exists.
- Only send presence updates to users who are viewing the relevant conversation or contact list, to avoid huge fan-out.

**8. Scaling and failures**
- **Gateways** are stateful (connections). If one dies, clients reconnect (with jittered backoff) to another; the registry updates.
- **Chat service** is stateless and horizontally scalable.
- **Hot conversations** (huge groups) may need special handling, e.g. batching delivery.
- **Message store** replicated across zones; writes must succeed before acking 'sent', so messages are never lost."

#### Another worked example: adding end-to-end encryption
"If the interviewer asks for end-to-end encryption:
- Each device has a key pair; public keys are published to a key server.
- Senders encrypt messages per recipient device (e.g. Signal protocol); the server stores only ciphertext.
- Consequences: server-side search is impossible, group messages need per-device encryption or sender keys, and adding a new device requires secure key distribution.
- The delivery architecture stays similar; only payloads and key management change."

#### Design choices at a glance
| Concern | Choice | Why |
|---|---|---|
| Real-time transport | WebSockets via gateway servers | Bidirectional, low latency |
| Routing | Session registry (user → gateway) | Find the right connection |
| Ordering | Per-conversation sequence numbers | Simple, reliable ordering |
| Duplicates | Client message IDs | Idempotent retries |
| Storage | Partition by conversation | Append-only, range reads |
| Offline | Push + sync by last seq | Reliable catch-up |
| Presence | Heartbeats + TTL, limited fan-out | Cost control |

#### Step-by-step framework
1. Requirements and scale (connections, messages/sec, group size).
2. Connection layer (WebSockets, gateways, registry).
3. Send path with persistence, sequencing, acks and dedup.
4. Delivery to online and offline users; sync on reconnect.
5. Group fan-out strategy.
6. Storage model.
7. Presence, receipts, media, failures and scaling.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Clients poll the server every second" | Persistent WebSocket connections |
| Deliver before persisting | Persist first, then deliver |
| No ordering strategy | Per-conversation sequence numbers |
| Ignores duplicates and reconnects | Client message IDs and sync by last sequence |
| Push presence to everyone | Limited, TTL-based presence |

#### Useful phrases
- "Messages are persisted before we acknowledge them, so nothing is lost."
- "Each conversation has its own sequence number for ordering."
- "Clients sync from their last seen sequence number on reconnect."
- "Presence is approximate and expensive, so we only send it to people who need it."

#### Common pitfalls
- **Polling** at massive scale.
- **Losing messages** by delivering before persisting.
- **Global ordering** (unnecessary and expensive); per-conversation ordering is enough.
- **Ignoring multiple devices** per user.
- **Expensive presence fan-out.**

#### Follow-ups to expect (with sample answers)
- **"How many connections can one gateway handle?"**
  "Tens of thousands to a few hundred thousand depending on hardware and message rate; we'd load test and scale horizontally."
- **"How do you support message search?"**
  "Index messages asynchronously into a search engine partitioned by user or workspace (not possible with end-to-end encryption on the server)."
- **"How do read receipts work in groups?"**
  "Track each member's last-read sequence per conversation; display aggregated counts rather than updating every member in real time."

#### What senior interviewers look for
- Solid **delivery semantics** (acks, retries, dedup, sync).
- **Stateful connection layer** operations (deploys, reconnect storms).
- **Cost-aware** presence and fan-out decisions.

#### Practise it
1. Draw the send and delivery path for a 1:1 message, including acks, in under 5 minutes.
2. Explain how a phone that was offline for a day catches up.
3. Walk through how a gateway crash affects users, out loud.

## Design a notification system
- id: be-design-07
- roles: backend, fullstack
- round: BE_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: system design, queues, notifications, reliability

### Prompt
Design a system that sends notifications (email, SMS, push) for many internal services, respecting user preferences, at large scale.

### Answer
#### What the interviewer is really testing
- **Decoupling** producers from delivery with **queues**.
- Handling **third-party providers**: rate limits, failures, retries.
- **User preferences**, quiet hours, deduplication and priority.
- **Reliability and observability** (delivery tracking).

#### Key points
- A **central notification service** with a simple API for other services.
- **Validation and preference checks** before queueing.
- **Separate queues per channel and priority**, so marketing campaigns don't delay password resets.
- **Channel workers** call providers (SES/SendGrid, Twilio, APNs/FCM) with **retries, backoff and failover**.
- **Idempotency keys** to avoid duplicates.
- **Templates**, localisation and a **delivery status store** for tracking.

#### Model answer
"**1. Requirements**
- Functional: other services trigger notifications; channels email/SMS/push (and in-app); templates with variables; user preferences (opt-outs per category, quiet hours); scheduling; delivery tracking.
- Non-functional: critical notifications (password resets, security alerts) within seconds; at-least-once delivery without user-visible duplicates; handle campaign spikes; high availability.
- Scale: ~10M notifications/day normally (~115/sec), campaign spikes up to ~5,000/sec.

**2. API**
```
POST /notifications
{
  "idempotency_key": "order-123-shipped",
  "user_id": "u_42",
  "category": "order_updates",
  "template": "order_shipped",
  "data": { "order_id": "123" },
  "priority": "high",
  "send_at": null
}
```

**3. High-level design**
```
Services → Notification API → Validation + preferences + dedup
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              email queues    SMS queues     push queues    (high / low priority)
                    │              │              │
              email workers   SMS workers    push workers  → providers (with failover)
                    │              │              │
                    └──────► delivery status store ◄── provider webhooks (bounces, delivered)
```

**4. Processing steps**
1. **Validate** the request and template.
2. **Deduplicate** using the idempotency key (stored for e.g. 24 hours).
3. **Check preferences**: is the user opted in for this category and channel? Quiet hours? (Critical security notifications may bypass quiet hours.)
4. **Render** the template with user locale and data.
5. **Enqueue** to the right channel and priority queue (or a scheduler for `send_at`).
6. **Workers** send via providers, respecting provider rate limits.
7. **Track status**: queued → sent → delivered / bounced / failed, updated from provider callbacks.

**5. Reliability**
- **Retries with exponential backoff** for transient provider errors; **dead-letter queue** after max attempts, with alerts.
- **Provider failover**: if the primary SMS provider fails or slows, route critical messages to a secondary.
- **At-least-once** processing with idempotent sends (provider message IDs or our own dedup) to avoid duplicates.

**6. Spikes and priorities**
- Campaigns go to **low-priority queues** with throttled workers, so they don't consume provider capacity needed for critical messages.
- Autoscale workers based on queue depth.

**7. Data**
- `user_preferences(user_id, category, channel, enabled, quiet_hours, timezone)` cached for fast lookups.
- `notifications(id, user_id, channel, template, status, provider_id, created_at)` for tracking and support queries; partition by time and archive old records.

**8. Observability**
Dashboards for queue depth, send latency per priority, provider error rates, bounce and complaint rates (important for email reputation), and opt-out rates."

#### Another worked example: in-app notifications
"Adding an in-app notification inbox:
- Store notifications per user in a table (`user_id, created_at, read`), paginated.
- Deliver real-time updates via an existing WebSocket connection if the user is online; otherwise they see them on next load.
- Unread counts cached per user and updated on read.
- Same preference and dedup pipeline, with in-app as another channel."

#### Key design decisions
| Decision | Choice | Reason |
|---|---|---|
| Decoupling | Queues between API and workers | Absorb spikes; isolate failures |
| Priority | Separate high/low queues | Critical messages never wait |
| Duplicates | Idempotency keys | Safe retries from producers |
| Provider failure | Retries, DLQ, failover | Reliability |
| Preferences | Checked before queueing | Respect opt-outs, legal compliance |

#### A third worked example: digest notifications
"Users complained about getting 30 separate 'someone commented' emails a day on busy projects.
- **Change**: non-urgent activity notifications are written to a per-user **digest buffer** instead of being sent immediately.
- **Scheduler**: a job runs hourly (or daily, based on user preference), groups buffered events by user and project, renders one digest email, and clears the buffer.
- **Rules**: urgent categories (mentions, security) bypass the digest; if a user reads the activity in-app before the digest is sent, those items are dropped from the digest.
- **Result**: email volume per active user dropped by about 70%, unsubscribe rates fell, and engagement with the remaining emails rose, because each one was more useful."

#### Variations you might be asked
- "Design notifications for a ride-hailing app": real-time push dominates, location-triggered events, very tight latency for 'driver arriving'.
- "Design a scheduled reminder system": a durable scheduler (time-bucketed queues or a database polled by workers) becomes the core component.
- "Design in-app notification badges": unread counters per user, updated atomically and cached.

#### Step-by-step framework
1. Requirements, channels, scale and spikes.
2. API with idempotency and priority.
3. Pipeline: validate → dedup → preferences → render → enqueue.
4. Workers, provider rate limits, retries, failover.
5. Status tracking and webhooks.
6. Scaling and observability.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Services call email providers directly | Central service with queues |
| One queue for everything | Separate queues by channel and priority |
| No dedup | Idempotency keys |
| Ignores opt-outs | Preferences and quiet hours enforced |
| No tracking | Delivery status and provider webhooks |

#### Useful phrases
- "Queues decouple producers from slow or failing providers."
- "Password resets must never wait behind a marketing campaign."
- "Every request carries an idempotency key so retries don't create duplicates."
- "We fail over to a secondary provider for critical messages."

#### Common pitfalls
- **Synchronous sending** from producer services.
- **No priority separation.**
- **Ignoring provider rate limits** and bounces.
- **Sending duplicates** on retries.
- **Ignoring legal opt-out requirements.**

#### Follow-ups to expect (with sample answers)
- **"How do you avoid spamming users?"**
  "Per-user frequency caps, batching (digest emails), and respecting preferences and quiet hours."
- **"How do you handle time zones for scheduled notifications?"**
  "Store user time zones and schedule in UTC based on local send times."
- **"How do you protect email sender reputation?"**
  "Track bounces and complaints, suppress invalid addresses, authenticate domains (SPF, DKIM, DMARC), and throttle large campaigns."

- **"How would you test a new notification template safely?"**
  "Send to internal users first, then a small percentage of real users, while monitoring complaints and click-through, with a kill switch per template."
- **"How do you guarantee ordering for related notifications?"**
  "Usually you don't need strict ordering; where it matters (e.g. 'order shipped' before 'order delivered'), partition the queue by user or order ID so they're processed in sequence."

#### What senior interviewers look for
- **Failure isolation** and graceful degradation.
- **Operational detail**: DLQs, dashboards, provider management.
- **Product and compliance awareness** (preferences, legal opt-outs).

#### Practise it
1. Draw the pipeline from API to provider in under 5 minutes.
2. Explain how a campaign of 10M emails avoids delaying password resets.
3. Describe what happens when the SMS provider goes down, out loud.

## Design a payment system
- id: be-design-08
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels: senior, staff
- tags: system design, payments, idempotency, consistency, ledger

### Prompt
Design the payment backend for an e-commerce platform: customers pay for orders by card through a payment provider, and the company must keep accurate records.

### Answer
#### What the interviewer is really testing
- **Correctness over everything**: no double charges, no lost payments.
- **Idempotency**, **state machines** and handling **uncertain outcomes** (timeouts).
- **Ledger** design and **reconciliation** with providers.
- Security and compliance awareness (**PCI DSS**).

#### Key points
- Never handle raw card data if you can avoid it: use the provider's **tokenisation / hosted fields** to minimise PCI scope.
- **Idempotency keys** on every payment request (to us and to the provider).
- Model payments as a **state machine**: created → authorised → captured → refunded / failed.
- Treat **timeouts as "unknown"**, not failures: query the provider or wait for **webhooks** before retrying.
- Record money movements in a **double-entry ledger** (immutable entries).
- Run **reconciliation** against provider settlement reports daily.
- Use the **outbox pattern** to publish events reliably.

#### Model answer
"**1. Requirements**
- Customers pay for orders by card; support authorisation and capture (e.g. capture when shipped), refunds, and webhooks from the provider.
- Non-functional: **exactly-once effect** for charges, strong consistency for payment state, full audit trail, high availability, PCI compliance.
- Scale: say 5M orders/day ≈ ~60 payments/sec average, peaks of ~1,000/sec during sales. Throughput is moderate; correctness is the challenge.

**2. High-level design**
```
Client ─(card details via provider's hosted fields)─► Payment provider → token
Client → Checkout API → Payment service ──► Provider API (authorise/capture/refund)
                              │   ▲
                              │   └── Provider webhooks (async results)
                              ├─► Payments DB (state machine) + Ledger (double entry)
                              └─► Outbox → Event bus → Order service, notifications
Daily: Reconciliation job ← provider settlement reports
```

**3. Payment flow**
1. Client collects card details using the provider's **hosted fields**; our servers only see a **payment method token**.
2. Checkout API calls the payment service with `order_id`, amount, currency, token and an **idempotency key** (e.g. derived from the order ID and attempt).
3. Payment service:
   - Checks the idempotency key. If seen, returns the stored result.
   - Creates a payment record in state `CREATED`.
   - Calls the provider's authorise API, passing **the same idempotency key**.
   - Updates state to `AUTHORISED` or `FAILED` based on the response.
4. When the order ships, the service **captures** the payment → `CAPTURED`, and writes ledger entries.
5. Events (`payment_authorised`, `payment_captured`) are written to an **outbox table in the same transaction** as the state change, then published to the event bus by a relay.

**4. Handling uncertainty**
- If the provider call **times out**, the outcome is unknown. The payment might have succeeded. We mark the payment `PENDING_CONFIRMATION` and:
  - Retry with the **same idempotency key** (the provider returns the original result rather than charging twice), and/or
  - Wait for the provider's **webhook**, and/or
  - Query the provider's payment status API.
- Never create a new charge with a new key after a timeout. That's how double charges happen.

**5. State machine**
```
CREATED → AUTHORISED → CAPTURED → (PARTIALLY_)REFUNDED
   │           │
   └→ FAILED   └→ VOIDED (auth cancelled)
PENDING_CONFIRMATION → (AUTHORISED | FAILED) once confirmed
```
Transitions are validated (e.g. you can't capture a failed payment) and updated with **conditional writes** (`UPDATE ... WHERE id = ? AND state = 'AUTHORISED'`) to prevent races.

**6. Ledger**
- Every money movement creates **balanced double-entry records**, e.g. on capture: debit 'customer receivable' and credit 'revenue' and 'payment provider clearing'.
- Ledger entries are **immutable**: corrections are new entries, never updates.
- This makes balances auditable and supports financial reporting.

**7. Webhooks**
- Verify signatures; process idempotently (store provider event IDs); handle out-of-order events by checking current state before transitioning.

**8. Reconciliation**
- Daily job compares our captured payments and refunds with the provider's settlement reports. Mismatches (missing captures, amount differences) create alerts and tickets for finance.

**9. Reliability and security**
- Payments DB: strongly consistent relational database, replicated, with backups and point-in-time recovery.
- PCI scope minimised via tokenisation; secrets in a vault; strict access controls and audit logs.
- Monitor authorisation rates by card type and provider; consider a secondary provider for resilience."

#### Another worked example: refunds
"For a partial refund of £20 on a £100 captured payment:
- API call with an idempotency key (e.g. `refund-{order_id}-{n}`).
- Validate: refund total can't exceed captured amount.
- Call provider refund API; on success, state → `PARTIALLY_REFUNDED`, ledger entries reverse £20 of revenue.
- Publish `payment_refunded` via the outbox; notify the customer.
- Reconciliation confirms the refund appears in the provider's report."

#### Core principles
| Principle | Why it matters |
|---|---|
| Idempotency keys end to end | Retries never double-charge |
| Timeout = unknown | Prevents duplicate charges after timeouts |
| State machine with conditional updates | Prevents invalid transitions and races |
| Double-entry immutable ledger | Auditability and correctness |
| Outbox pattern | Reliable events without dual-write bugs |
| Reconciliation | Detect discrepancies with the provider |
| Tokenisation | Minimises PCI scope and risk |

#### Step-by-step framework
1. Requirements: auth/capture, refunds, correctness, compliance.
2. Minimise PCI scope with tokenisation.
3. Payment flow with idempotency keys.
4. State machine and conditional updates.
5. Timeouts and webhooks.
6. Ledger and outbox events.
7. Reconciliation, security, monitoring.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Stores card numbers in our database | Tokenisation via the provider |
| Retries timeouts with new requests | Same idempotency key; treats timeout as unknown |
| Mutable balance column | Immutable double-entry ledger |
| Publishes events after commit (dual write) | Outbox pattern |
| No reconciliation | Daily reconciliation with provider reports |

#### Useful phrases
- "A timeout doesn't mean the payment failed; it means we don't know yet."
- "Every call to the provider carries the same idempotency key on retry."
- "Ledger entries are immutable; corrections are new entries."
- "We reconcile daily against the provider's settlement report."

#### Common pitfalls
- **Double charging** from naive retries.
- **Storing raw card data** (huge compliance burden).
- **Updating balances in place** without an audit trail.
- **Losing events** due to dual writes.
- **Ignoring out-of-order webhooks.**

#### Follow-ups to expect (with sample answers)
- **"How do you support multiple currencies?"**
  "Store amounts as integers in minor units with a currency code; never use floating point; record exchange rates used at the time of the transaction."
- **"What's the difference between authorisation and capture?"**
  "Authorisation reserves funds on the card; capture actually moves the money. Separating them allows charging only when goods ship."
- **"How would you add a second payment provider?"**
  "Abstract providers behind an interface, route by rules (card type, region, cost, health), and reconcile per provider."

#### What senior interviewers look for
- Deep **correctness** reasoning under failures.
- **Financial domain** awareness (ledgers, reconciliation, compliance).
- **Operational maturity**: monitoring authorisation rates, incident handling for payments.

#### Practise it
1. Draw the payment state machine from memory.
2. Explain exactly what happens when the provider times out during authorisation.
3. Write the ledger entries for a capture and a partial refund.

## Design a file storage and sync service
- id: be-design-09
- round: BE_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: system design, object storage, sync, chunking

### Prompt
Design a file storage and synchronisation service like Dropbox or Google Drive: users upload files, access them from multiple devices, and changes sync automatically.

### Answer
#### What the interviewer is really testing
- Separating **metadata** from **file content** (blob storage).
- **Chunking**, **deduplication** and efficient **sync** of changes.
- **Upload reliability** (resumable uploads, pre-signed URLs).
- **Conflict handling** when files change on multiple devices.

#### Key points
- Store file **content in object storage** (S3-style), and **metadata** (names, folders, versions, permissions) in a database.
- Split files into **chunks** (e.g. 4 MB), identified by **content hash**. Only changed chunks are uploaded; identical chunks are **deduplicated**.
- Clients upload directly to storage with **pre-signed URLs**, not through app servers.
- **Sync** via a change log / version numbers: devices ask "what changed since version X?" and get notified via long polling/WebSockets.
- **Conflicts**: keep both versions ("conflicted copy") or apply last-writer-wins with version history.

#### Model answer
"**1. Requirements**
- Functional: upload/download files (up to several GB), folders, sync across devices, sharing, version history, offline edits that sync later.
- Non-functional: durability (never lose files), efficient bandwidth (don't re-upload unchanged data), reasonable sync latency (seconds), high availability.
- Scale: 100M users, 1B files, average file 1 MB but many large files → petabytes of storage.

**2. High-level design**
```
Client (sync agent) ── metadata API ──► Metadata service ──► Metadata DB (files, versions, chunks)
        │                                     │
        │  pre-signed URLs                    └─► Change log / notification service ─► other devices
        └──── upload/download chunks ────► Object storage (+ CDN for downloads)
```

**3. Chunking and deduplication**
- The client splits files into ~4 MB chunks and computes a hash (e.g. SHA-256) of each.
- It asks the metadata service which chunk hashes already exist. Only **missing chunks** are uploaded.
- A file version = an ordered list of chunk hashes.
- Benefits: editing a small part of a large file uploads only the changed chunk; identical files across users are stored once (with care for privacy and encryption).

**4. Upload flow**
1. Client: `POST /files/commit-intent` with file path and chunk hashes.
2. Server returns which chunks are missing plus **pre-signed upload URLs**.
3. Client uploads chunks directly to object storage (resumable: failed chunks are retried individually).
4. Client calls `POST /files/commit` with the chunk list; server verifies chunks exist, creates a new **file version**, and appends to the **change log**.

**5. Sync**
- Each user (or namespace) has a monotonically increasing **change log** (cursor).
- Devices keep their last cursor and ask `GET /changes?since=cursor` to get changed files.
- To avoid constant polling, devices keep a **long-poll or WebSocket** connection that notifies them when the cursor advances.
- The device downloads only the chunks it doesn't already have.

**6. Conflicts**
- Each file version records its **parent version**. If a device commits a change based on an old version (someone else changed it meanwhile), the server detects a conflict.
- Simple, safe approach: keep both, saving the second as 'filename (conflicted copy)'. For collaborative documents, real-time editing would need operational transforms or CRDTs (a different product).

**7. Metadata storage**
- `files(file_id, namespace_id, path, latest_version, deleted)`, `versions(file_id, version, chunk_list, parent_version, created_at)`, `chunks(hash, size, storage_location, ref_count)`.
- Shard metadata by namespace (user or team) so a user's files live together.

**8. Durability and other concerns**
- Object storage with high durability (replication or erasure coding across zones).
- Deleted files go to trash; chunks are garbage-collected when reference counts reach zero (after retention period).
- Sharing via permission entries on folders; links with tokens.
- Encryption at rest; per-user encryption complicates cross-user dedup, which is a trade-off."

#### Another worked example: a photo backup app
"A simpler variant (phone photo backup):
- Mostly append-only (photos rarely change), so chunk-level delta sync matters less.
- Focus on resumable uploads over mobile networks, deduplication by file hash, background uploads, and generating thumbnails asynchronously.
- Sync is one-way plus deletions, which simplifies conflict handling."

#### Key design decisions
| Concern | Approach |
|---|---|
| Large files | Chunking + resumable uploads |
| Bandwidth | Only upload changed/missing chunks |
| Storage efficiency | Content-hash deduplication |
| Server load | Pre-signed URLs, direct-to-storage |
| Multi-device sync | Change log cursors + notifications |
| Conflicts | Version parents; conflicted copies |
| Durability | Replicated object storage, versioning |

#### Step-by-step framework
1. Requirements (file sizes, devices, sharing, versions).
2. Split metadata and blob storage.
3. Chunking and dedup.
4. Upload flow with pre-signed URLs.
5. Sync protocol (cursor + notifications).
6. Conflict handling.
7. Metadata schema, durability, deletion, sharing, security.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Upload whole file through app servers | Direct-to-storage with pre-signed URLs |
| Re-upload entire file on every change | Chunk-level delta uploads |
| Files stored in the database | Object storage for content, DB for metadata |
| Devices poll constantly | Change log cursors with notifications |
| Ignores conflicts | Version parents and conflicted copies |

#### Useful phrases
- "File content goes to object storage; the database only holds metadata."
- "We split files into chunks identified by their hash, so we only upload what changed."
- "Clients upload directly to storage with pre-signed URLs."
- "If two devices edit the same version, we keep both copies rather than lose data."

#### Common pitfalls
- **Routing large uploads through app servers.**
- **No chunking**, wasting bandwidth.
- **Ignoring conflicts** (silent data loss).
- **Not separating metadata** from content.
- **Forgetting garbage collection** of unreferenced chunks.

#### Follow-ups to expect (with sample answers)
- **"How would you choose the chunk size?"**
  "A trade-off: smaller chunks dedup better and re-upload less on edits, but increase metadata and request overhead. A few MB is a common balance; content-defined chunking handles insertions better."
- **"How do you handle a 10 GB upload on a flaky connection?"**
  "Chunked, resumable uploads where each chunk retries independently, with progress stored on the client."
- **"How do you serve downloads quickly worldwide?"**
  "Through a CDN in front of object storage, with signed URLs for access control."

#### What senior interviewers look for
- Clear **metadata vs blob** separation and **sync protocol** design.
- Awareness of **dedup vs encryption/privacy** trade-offs.
- **Durability and lifecycle** management (versions, trash, GC).

#### Practise it
1. Draw the upload flow with pre-signed URLs in under 4 minutes.
2. Explain how editing one paragraph in a 500 MB file syncs efficiently.
3. Describe the conflict scenario and your resolution, out loud.

## Design search autocomplete
- id: be-design-10
- roles: backend, fullstack
- round: BE_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: system design, trie, caching, search

### Prompt
Design the autocomplete (typeahead) feature for a search box: as users type, show the top 5–10 suggested queries within milliseconds.

### Answer
#### What the interviewer is really testing
- **Low-latency read design** (tens of milliseconds end to end).
- Data structures: **tries** / prefix indexes with precomputed top-K.
- **Data pipeline** for collecting and aggregating query popularity.
- **Caching** at multiple layers and **client-side optimisations**.

#### Key points
- Latency budget is tight: suggestions must feel instant (often <100 ms total, so backend <20–50 ms).
- Use a **trie** (or prefix → top-K map) with **precomputed top suggestions per prefix**, rather than computing rankings at query time.
- Build/update the index **offline** from query logs (e.g. hourly or daily), with a faster path for trending queries.
- **Cache** popular prefixes heavily (CDN/edge, in-memory, client).
- Client: **debounce** keystrokes, cancel stale requests, cache recent results.
- Filter offensive or unsafe suggestions; personalisation as an extension.

#### Model answer
"**1. Requirements**
- Return top 10 suggestions for a prefix as the user types, ranked by popularity (optionally recency and personalisation).
- Latency: <50 ms at the backend p99.
- Scale: 10M DAU, ~10 searches each, ~4 keystrokes triggering requests per search → **400M requests/day ≈ ~5,000/sec**, peak ~20,000/sec.
- Suggestions can be slightly stale (updated hourly), but trending events should appear within minutes.

**2. Data structure**
- A **trie** where each node represents a prefix and stores the **top 10 completions** precomputed for that prefix.
- Lookup is O(length of prefix) and returns the stored list directly. No ranking at query time.
- Alternatively, a simple **key-value map** `prefix → [top suggestions]` for prefixes up to, say, 20 characters, stored in Redis or an in-memory service.

**3. Architecture**
```
Client (debounce) → CDN/edge cache → Suggest service (in-memory trie, replicated) 
                                           ▲
Query logs → Stream/batch aggregation → Index builder → New trie snapshot → deployed to suggest servers
```

**4. Building the index**
- Collect search queries in logs (anonymised).
- Aggregate counts with time decay (recent queries weigh more), filter out rare and unsafe queries.
- Build the trie with top-K per node, serialise a snapshot, and distribute to suggest servers, which swap atomically to the new version.
- **Trending**: a streaming job counts queries in short windows (e.g. 5 minutes) and injects spiking queries into a small 'trending' overlay merged at query time.

**5. Serving**
- Suggest servers hold the trie **in memory** (it can be sharded by prefix range if too large).
- Responses for popular prefixes (e.g. 'w', 'we', 'wea') are cached at the edge with short TTLs.

**6. Client optimisations**
- **Debounce** (e.g. 100–150 ms) to avoid a request per keystroke.
- **Cancel** in-flight requests when the user types more.
- **Local cache**: if the user deletes a character, reuse the earlier result.
- Possibly prefetch suggestions for the next likely characters.

**7. Quality and safety**
- Blocklists for offensive or harmful suggestions; legal removal requests.
- Personalisation: blend global suggestions with the user's recent searches on the client or in a small personal store.

**8. Scaling and failures**
- Suggest servers are stateless apart from the read-only snapshot, so scale horizontally.
- If the build pipeline fails, servers keep serving the last good snapshot."

#### Another worked example: e-commerce product autocomplete
"For an online shop, suggestions should include products and categories, not just past queries:
- Index product names, brands and categories with popularity signals (sales, clicks).
- Handle typos with fuzzy matching (edit distance) for short prefixes, using a search engine with completion features.
- Rank by relevance plus business signals (in stock, margin), while avoiding suggesting out-of-stock items."

#### Design choices
| Concern | Choice | Reason |
|---|---|---|
| Lookup | Trie / prefix map with precomputed top-K | O(prefix length), no runtime ranking |
| Freshness | Offline rebuild + trending overlay | Balance cost and recency |
| Latency | In-memory serving + edge cache | Milliseconds |
| Request volume | Client debounce and caching | Cut load substantially |
| Safety | Blocklists and filters | Avoid harmful suggestions |

#### Step-by-step framework
1. Requirements (latency, ranking, freshness, scale).
2. Data structure with precomputed top-K.
3. Index build pipeline from logs.
4. Serving path with caching.
5. Client optimisations.
6. Trending, personalisation, safety, failures.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `SELECT ... WHERE query LIKE 'pre%' ORDER BY count` per keystroke | Precomputed top-K per prefix in memory |
| Rebuild ranking on each request | Offline index build with snapshots |
| Request on every keystroke | Debounce, cancel, client cache |
| No freshness strategy | Trending overlay from streaming counts |
| No content filtering | Blocklists and safety filters |

#### Useful phrases
- "Each trie node stores the top 10 completions, so a lookup is just walking the prefix."
- "We rebuild the index offline and swap in new snapshots atomically."
- "Debouncing on the client cuts requests significantly."
- "Trending queries are merged from a short-window streaming job."

#### Common pitfalls
- **Database LIKE queries** on every keystroke.
- **Ranking at query time** at high QPS.
- **Ignoring client-side optimisation.**
- **No filtering** of inappropriate suggestions.
- **Forgetting freshness** for trending events.

#### Follow-ups to expect (with sample answers)
- **"How big is the trie?"**
  "Depends on the number of unique queries kept; limiting to popular queries and capping prefix length keeps it to gigabytes, which fits in memory and can be sharded if needed."
- **"How would you support multiple languages?"**
  "Separate tries per language/locale, chosen by the user's settings, with language-specific normalisation."
- **"How do you personalise without huge cost?"**
  "Blend a small per-user list of recent searches (client-side or a small key-value store) with global suggestions."

#### What senior interviewers look for
- Strong **latency budgeting** and precomputation.
- A clean **offline/online pipeline** separation.
- **Product sense**: quality, safety, relevance.

#### Practise it
1. Draw a trie for the words "cat, car, cart, care" with top-2 completions at each node.
2. Explain the full pipeline from query logs to served suggestions in 3 minutes.
3. List three client-side optimisations and their effect on load.
