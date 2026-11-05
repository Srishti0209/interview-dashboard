# Full Stack Engineer — System Design (continued)

## Design an offline-first mobile/web notes app with sync
- id: fs-design-08
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: hard
- levels: senior, staff
- tags: offline-first, sync, conflict resolution, IndexedDB, CRDT, service worker

### Prompt
Design a notes app that works fully offline on web and mobile: users create and edit notes without a connection, and changes sync across their devices when they reconnect. Cover local storage, the sync protocol, conflict handling and the server.

### Answer
#### What the interviewer is really testing
- Whether you treat the **local database as the primary store** for the UI, with the server as a sync peer, instead of "an online app with a cache".
- A concrete **sync protocol**: how a device knows what to send and what to fetch, idempotently, after hours or weeks offline.
- **Conflict resolution** with a clear policy per field (last-writer-wins, merge, CRDT) and an honest discussion of trade-offs.
- **Platform knowledge**: IndexedDB, service workers, background sync, storage limits and eviction.
- **Correctness under failure**: interrupted syncs, duplicate requests, clock skew, deleted-on-one-device-edited-on-another.

#### Key points
- **Local-first architecture**: the UI reads and writes a local store (IndexedDB on web, SQLite on mobile). A sync engine moves changes between the local store and the server in the background.
- Every change is recorded in a **local outbox** (operation log) with a client-generated **UUID** for the entity and a unique **operation id** for idempotency.
- **Pull** uses a server-assigned, monotonically increasing **change sequence** (cursor): "give me everything after seq 18 342". Don't use client timestamps as cursors.
- **Push** sends outbox operations with the **base version** they were made against. The server applies them idempotently and returns new versions.
- **Conflicts**: field-level last-writer-wins (using server order, or a hybrid logical clock) for titles, tags and flags; **CRDTs** (Yjs, Automerge) for note bodies if concurrent text edits must merge. Deletes need **tombstones**.
- The **app shell** is cached by a service worker so the app opens offline; data comes from IndexedDB.
- Ask the browser for **persistent storage** (`navigator.storage.persist()`) to reduce eviction risk.

#### Model answer
"**Requirements.** Notes with a title, rich-text body, tags, pinned flag and folder. Full create/edit/delete offline. Sync across up to ~5 devices per user within seconds when online. Notes are private to one user (sharing is a later phase). 5M users, average 500 notes each.

**Client architecture.**
```
UI (React) ──reads/writes──► Local store (IndexedDB via Dexie / SQLite on mobile)
                                 │  notes, folders, outbox, sync_state
                                 ▼
                           Sync engine (in a worker)
                                 │ push outbox / pull changes
                                 ▼
                           Sync API (HTTPS) + realtime 'poke' (WebSocket/SSE)
```
- The UI never waits for the network. Saving a note writes the note row and an outbox entry in **one local transaction**.
- A **service worker** caches the app shell and static assets, so the app opens with no connection.

**Local schema.**
```
notes(id uuid, title, body_doc (CRDT bytes or HTML), tags[], pinned, folder_id,
      version, deleted bool, updated_at_local)
outbox(op_id uuid, entity_id, kind, fields jsonb, base_version, created_at)
sync_state(last_pulled_seq)
```

**Server schema.**
```sql
notes(id uuid PK, user_id, title, body_doc bytea, tags text[], pinned, folder_id,
      version int, deleted bool, updated_at)
changes(seq bigserial PK, user_id, entity_id, version, changed_fields text[])
applied_ops(op_id uuid PK, user_id, result jsonb, applied_at)  -- idempotency
```

**Push** (`POST /sync/push { ops: [...] }`):
For each op, in order: if `op_id` is already in `applied_ops`, return the stored result (idempotent retry). Otherwise apply it:
- *Scalar fields* (title, pinned, tags, folder): if the server's version equals `base_version`, apply. If not, a **field-level merge**: fields changed only by this op are applied, and for fields changed on both sides the later op in server-arrival order wins (or by hybrid logical clock if I care about true edit order).
- *Body*: if bodies are CRDT documents, the op contains a CRDT update; the server merges it into the stored doc. No conflict is possible; concurrent edits interleave.
- *Delete*: set `deleted = true` (a **tombstone**). An edit arriving for a deleted note on another device can either resurrect it or be dropped; I'd resurrect and tell the user ('Restored a note you edited on your phone'), because losing edits is worse.
Each applied change bumps `version` and inserts a row into `changes`. The response returns the new versions.

**Pull** (`GET /sync/pull?after=18342&limit=500`):
Returns changed notes (full current state) with `seq > after` for this user, plus the new cursor. The client applies them in a local transaction, **skipping notes that still have pending outbox ops** (those get reconciled after their push returns), and saves `last_pulled_seq`.

**Triggering sync.** On app start, on `online` events, after local writes (debounced ~2 seconds), and when the server sends a 'poke' over a WebSocket/SSE channel because another device changed something. On the web, Background Sync can retry when connectivity returns even if the tab is closed (where supported).

**First sync on a new device.** Pull pages of 500 until caught up, showing progress; or download a compressed snapshot, then pull changes after the snapshot's seq.

**Server scale.** 5M users × 500 notes is 2.5B rows: partition `notes` and `changes` by `user_id` hash. Pulls are always per user, so they're cheap index range scans. Prune `changes` older than ~90 days; a device that's been offline longer does a full resync."

#### Another worked example: the same note edited on two offline devices
"On the train, my laptop changes the title to 'Q4 plan' and adds two paragraphs. Meanwhile my phone, also offline, pins the note and fixes a typo in paragraph one. Both had base version 7.
- The laptop reconnects first: push applies title + body CRDT update → version 8.
- The phone reconnects: its op says base version 7, server is at 8. Field-level merge: `pinned` was changed only by the phone → applied. The body is a CRDT update → merged, so the typo fix and the new paragraphs both survive. Version 9.
- Both devices pull seq for version 9 and converge.
Without a CRDT body I'd have had to pick one body (losing work) or keep both as a 'conflicted copy', which is what Dropbox-style apps do. Choosing CRDTs for the body and LWW for metadata is a deliberate per-field policy."

#### Step-by-step framework
1. **Local-first stance**: UI ↔ local DB; sync in the background.
2. **Identity**: client-generated UUIDs for entities and operations.
3. **Outbox** written in the same local transaction as the change.
4. **Push** with base versions, idempotent by op id.
5. **Pull** by a server sequence cursor, per user.
6. **Conflict policy per field**: LWW, merge, CRDT; tombstones for deletes.
7. **Triggers**: start, online, debounce after writes, server pokes.
8. **Bootstrapping, pruning and storage limits.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Cache API responses and retry when online" | Local DB is the source for the UI; explicit sync engine |
| Client timestamps decide everything | Server sequence cursors; HLCs if true order matters |
| Retries create duplicate notes | Client UUIDs + idempotent op ids |
| Whole-note last-write-wins | Field-level merge, CRDT for the body |
| Hard deletes | Tombstones, with a policy for edit-after-delete |
| No plan for a device offline for months | Change-log pruning + full resync fallback |

#### Useful phrases
- "The network is an optimisation; the local database is what the UI talks to."
- "Every operation has an id, so pushing twice is harmless."
- "I pull by a server-assigned sequence number, never by device clocks."
- "I'd choose the conflict policy per field: last-writer-wins for the pinned flag, a CRDT for the body."
- "Deletes are tombstones, otherwise a stale device would bring the note back."

#### Common pitfalls
- **Using `updated_at` from device clocks** as the sync cursor; skewed clocks lose changes.
- **Applying pulled changes over un-pushed local edits**, wiping the user's work.
- **Forgetting the outbox transaction**: the note saves but the op doesn't, so it never syncs.
- **Assuming IndexedDB is permanent**: browsers can evict storage under pressure; request persistence and keep the server as the backup.
- **Huge first syncs** with no pagination or progress.

#### Follow-ups to expect (with sample answers)
- **"How would sharing change the design?"**
  "Changes would be keyed by note rather than user, so pulls would need a per-user feed of the notes they can access. With concurrent editors, real-time CRDT sync over a WebSocket becomes important, and permissions must be checked on every push."
- **"Why not use a ready-made sync engine?"**
  "I would seriously consider one: PouchDB/CouchDB, Replicache, ElectricSQL, PowerSync or Automerge's sync server. The trade-off is lock-in and fitting their data model. The design above is what they do internally, so knowing it helps choose."
- **"How do you handle schema changes when old clients are offline?"**
  "Version the sync protocol. The server accepts old op shapes for a support window and upgrades them, and clients run local migrations on update. Truly obsolete clients are told to update before syncing."
- **"How big can CRDT documents get?"**
  "They keep history, so they grow. Yjs encodes efficiently, and you can snapshot/garbage-collect periodically, at the cost of being unable to merge very old offline edits."

#### What senior interviewers look for
- A **precise protocol** (cursors, op ids, base versions), not hand-waving about 'syncing'.
- A **deliberate conflict policy** with reasons, including deletes.
- **Platform realism**: storage eviction, service workers, background sync support, mobile background limits.
- Build-versus-buy judgement on sync engines.

#### Practise it
1. Build a toy version with Dexie: notes table, outbox written in the same transaction, a push/pull loop against a tiny Express server.
2. Simulate two offline clients editing the same note and check your merge produces the expected result.
3. Try Yjs: merge two documents edited independently and inspect the result.
4. Explain to a friend why client clocks make bad sync cursors.

## Design a multi-tenant B2B SaaS admin portal
- id: fs-design-09
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: hard
- levels: senior, staff
- tags: multi-tenancy, RBAC, SSO, audit logs, B2B, admin

### Prompt
Design the admin side of a B2B SaaS product: each customer organisation has admins who manage users, roles, SSO, billing and audit logs. Cover tenancy, authorisation, the admin UI and enterprise features.

### Answer
#### What the interviewer is really testing
- **Tenant isolation**: every query, cache key, file and background job scoped to the right organisation.
- **Authorisation design**: roles and permissions that customers can manage, checked consistently on the server and reflected in the UI.
- **Enterprise requirements**: SAML/OIDC SSO, SCIM provisioning, audit logs, data export.
- **Admin UX**: large user tables, bulk actions, invitations, dangerous-action confirmation.
- **Operational concerns**: support impersonation done safely, per-tenant limits, noisy neighbours.

#### Key points
- **Tenancy model**: shared database with a `tenant_id` column on every tenant-owned table (most common), schema-per-tenant, or database-per-tenant for the largest/regulated customers. Enforce isolation with **Postgres Row-Level Security** or a mandatory query scope, not developer discipline alone.
- **AuthZ**: users belong to organisations through **memberships** with a role; roles map to **permissions** (`users:invite`, `billing:manage`). Check permissions on the server for every action; the UI uses the same permission list to hide or disable controls.
- **SSO**: per-tenant SAML/OIDC configuration with verified domains; just-in-time provisioning; optional "SSO required" enforcement. **SCIM** lets the customer's identity provider create and deactivate users.
- **Audit log**: append-only record of who did what, when, from where, to which resource; searchable and exportable by the customer's admins.
- **Impersonation** for support: explicit, time-limited, logged, visible to the customer, and with destructive actions blocked.
- **Admin UI**: server-side paginated, filterable tables; bulk actions with progress; confirmation for destructive changes; optimistic but reversible where possible.

#### Model answer
"**Requirements.** Organisations sign up; their admins invite users, assign roles (Owner, Admin, Member, Billing, plus custom roles on the Enterprise plan), configure SSO, view audit logs and manage billing. 20k organisations, the biggest has 50k users. Isolation is a hard requirement.

**Tenancy.** Shared Postgres with `org_id` on every tenant table. A request's `org_id` comes from the authenticated membership (the URL's org slug is checked against it). I'd turn on **RLS**:
```sql
alter table projects enable row level security;
create policy org_isolation on projects
  using (org_id = current_setting('app.org_id')::uuid);
```
The API sets `app.org_id` per transaction after authenticating. Even a missing `WHERE` clause can't leak another tenant's rows. Caches use keys prefixed with the org id; object storage paths start with `orgs/{orgId}/`; background jobs carry `org_id` and set the same context. For a couple of very large or regulated customers, the design allows moving them to a dedicated database later, because nothing assumes a single cluster.

**Authorisation data.**
```sql
users(id, email, name, status)
organisations(id, slug, plan, sso_required)
memberships(user_id, org_id, role_id, status invited|active|deactivated)
roles(id, org_id null for built-ins, name)
role_permissions(role_id, permission)        -- 'users:invite', 'billing:manage', ...
audit_events(id, org_id, actor_id, actor_type user|support|scim, action,
             target_type, target_id, metadata jsonb, ip, user_agent, created_at)
```
Middleware loads the membership and permissions (cached for ~60 seconds, invalidated on role changes). Handlers declare what they need: `requirePermission('users:invite')`. The API also returns the user's permission list so the UI can hide the 'Invite' button rather than letting users hit a 403.

**SSO and provisioning.**
- Admin verifies a domain (DNS TXT record), then uploads IdP metadata (SAML) or OIDC client details. Login: user enters an email → we find the org by domain → redirect to their IdP → we validate the assertion → create or link the user (JIT) → session.
- With `sso_required`, password login is disabled for that org's members (except a break-glass owner).
- **SCIM** endpoints (`/scim/v2/Users`, `/Groups`) let Okta or Entra ID create, update and deactivate users and map groups to roles. Deactivation revokes sessions immediately.
- I'd strongly consider an auth provider (WorkOS, Auth0, Clerk) for SAML/SCIM; they're commodity and full of edge cases.

**Audit log.** Every mutating handler writes an audit event in the same transaction as the change. Admins search by actor, action and date range; export to CSV; Enterprise plans can stream to their SIEM via webhook. Retention depends on plan (90 days to 7 years); old events move to cheaper storage.

**Admin UI.**
- Users page: server-side paginated table (cursor), search by name/email, filters (role, status, last active), column sort. Bulk select → 'Change role' or 'Deactivate' runs as a background job with a progress indicator for large selections.
- Invitations: email invites with expiring tokens; a pending list with resend/revoke.
- Dangerous actions (remove an Owner, disable SSO, delete the organisation) need a typed confirmation and re-authentication, and are rate-limited.
- Settings pages each show who changed them last (from the audit log).

**Support impersonation.** Support staff request access to an org; it's granted for 1 hour, recorded in the audit log as `actor_type: support`, shown in a banner on the customer's audit page, and blocked from billing and deletion. Some Enterprise customers can require their approval first."

#### Another worked example: designing custom roles
"Enterprise customers want a role like 'Project Manager': create projects and invite members, but no billing. I'd:
- Keep a **fixed catalogue of permissions** defined in code (we control what's checkable).
- Let admins create roles as named sets of those permissions in a UI with grouped checkboxes and plain-language descriptions.
- Validate rules: at least one Owner must always exist; nobody can grant permissions they don't hold.
- When we ship a new feature with a new permission, built-in roles get it by default; custom roles don't, and admins see a 'New permissions available' notice.
This avoids the trap of letting customers write arbitrary policy expressions, which are hard to support and test."

#### Step-by-step framework
1. **Tenancy model** and how isolation is enforced (RLS / mandatory scope).
2. **Identity model**: users ↔ memberships ↔ orgs.
3. **Permissions**: catalogue, roles, server checks, UI hints.
4. **Enterprise identity**: domain verification, SSO, SCIM, enforcement.
5. **Audit log**: same-transaction writes, search, export, retention.
6. **Admin UI**: tables, bulk jobs, invites, dangerous-action guards.
7. **Support access** done safely.
8. **Fairness and scale**: per-tenant limits, large-tenant migration path.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Every query has `WHERE org_id = ?`" | RLS or an enforced scope as a safety net |
| Roles checked only in the frontend | Server-side permission checks; UI reflects them |
| `isAdmin` boolean | Permission catalogue + roles (custom on higher plans) |
| SSO as "add Google login" | Per-tenant SAML/OIDC, domain verification, SCIM, enforcement |
| No audit trail | Append-only audit log written in the same transaction |
| Support logs in with customer passwords | Time-limited, logged, visible impersonation |

#### Useful phrases
- "The org id comes from the authenticated membership, never from the request body."
- "RLS is the seatbelt: even a buggy query can't cross tenants."
- "Permissions are defined in code; roles are just named sets of them."
- "Audit events are written in the same transaction as the change, so they can't drift."
- "SAML and SCIM are commodity; I'd buy that piece."

#### Common pitfalls
- **Tenant leaks through caches, search indexes or exports** even when the database is scoped.
- **Role checks scattered as `if (user.role === 'admin')`** throughout the code.
- **Deactivated users keeping sessions** until the token expires.
- **Locking customers out** with no break-glass path when SSO breaks.
- **Unbounded admin queries** on the biggest tenant's 50k-user table.

#### Follow-ups to expect (with sample answers)
- **"When would you use database-per-tenant?"**
  "When customers require it contractually (data residency, dedicated encryption keys) or one tenant's load dominates. It costs more to operate (migrations across many databases), so I'd make it an Enterprise option."
- **"How do you test tenant isolation?"**
  "Automated tests that create two orgs and assert every endpoint returns 404 for the other org's ids, plus RLS policy tests in the database, plus periodic security reviews."
- **"How do you handle a user in several organisations?"**
  "One user, many memberships. The UI has an org switcher; the session stores the active org, and every request re-checks membership."
- **"What about data residency (EU vs US)?"**
  "Deploy regional stacks and pin each org to a region at sign-up; a global directory maps email domains and org slugs to regions for login routing."

#### What senior interviewers look for
- **Defence in depth** for tenant isolation.
- A **permission model that scales** to custom roles without becoming a policy language.
- Fluency with **enterprise identity** (SSO, SCIM, enforcement, break-glass).
- **Trust features** (audit logs, safe support access) treated as product features.

#### Practise it
1. Write an RLS policy and a test proving one org can't read another's rows.
2. Implement `requirePermission()` middleware and expose the permission list to the UI.
3. Sketch the SSO login sequence diagram from email entry to session.
4. Explain to a friend why support impersonation must be time-limited and visible to the customer.

## Design a live polling / quiz app for 100k concurrent users
- id: fs-design-10
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: hard
- levels:
- tags: real-time, high concurrency, websockets, counters, leaderboards, fan-out

### Prompt
Design a live quiz app (think a presenter running a quiz during a big online event): 100k participants join with a code, see each question at the same moment, answer within 20 seconds, and see live results and a leaderboard. Cover joining, synchronised questions, answer ingestion, counting and the client.

### Answer
#### What the interviewer is really testing
- Handling a **thundering herd**: 100k people joining and answering within the same few seconds.
- **Fan-out** of one event to 100k connections quickly and fairly.
- **Counting at scale** without a hot database row.
- **Timing fairness**: everyone gets the same 20 seconds despite network latency and clock differences.
- **Client resilience**: reconnects mid-question, slow phones, tab backgrounding.

#### Key points
- **Connections**: 100k WebSockets spread over a fleet of gateway servers (~10–20k per instance is comfortable). Load balancer with connection-level balancing; gateways are stateless apart from their sockets.
- **Fan-out**: the quiz controller publishes "question 5 starts at T" once to a pub/sub channel; each gateway pushes it to its local connections. Send a **server timestamp deadline**, not "you have 20 seconds", and let clients compute the countdown using a **clock offset** measured at join.
- **Answer ingestion**: answers go over the socket (or HTTP) to gateways, which validate the deadline (with a small grace for latency) and forward to a **queue or stream** in batches. Never one database write per answer on the hot path.
- **Counting**: aggregate in memory per gateway, flush partial counts every ~250 ms to Redis (`HINCRBY quiz:5:q:5 optionB n`); live results read Redis. Durable answers are written asynchronously in bulk.
- **Leaderboard**: Redis sorted set (`ZINCRBY`), top 10 broadcast after each question; each player is sent their own rank individually or computes it from a rank query.
- **Degradation**: throttle live result updates to a few per second, and send small payloads.

#### Model answer
"**Requirements.** A presenter controls a quiz. Participants join with a 6-digit code and a nickname. Each question shows simultaneously; 20 seconds to answer; then results (percent per option) and a top-10 leaderboard; each participant sees their own score and rank. 100k participants in one quiz at peak; questions every ~40 seconds.

**Back-of-the-envelope.**
- Join: 100k joins over ~2 minutes ≈ 1k/sec, with spikes.
- Answers: 100k answers in 20 seconds, most in the first 8 → up to ~15–20k/sec.
- Fan-out: one 'question' event × 100k sockets within ~1 second.

**Architecture.**
```
Participants ──WS──► LB ──► Gateways (8–10 instances, ~12k sockets each)
                                 │ ▲
                    answers batch│ │ question/results events
                                 ▼ │
Presenter UI ──HTTP──► Quiz controller ──► Redis (pub/sub, counters, sorted sets)
                                 │
                                 └──► Kafka/SQS ──► Writer ──► Postgres (durable answers, final scores)
```

**Join.** `POST /join {code, nickname}` → returns a participant token and gateway URL. The client opens the WebSocket, and the gateway subscribes to `quiz:{id}` (one subscription per gateway, not per user). On connect, the client does a quick **clock sync** (send t0, server replies with its time, compute offset with half the round trip). The static quiz app is served from a CDN, so 100k page loads don't touch our servers.

**Starting a question.** Presenter clicks 'Next' → controller stores the question state in Redis (`current_question`, `starts_at`, `deadline`) and publishes `{type:'question', q:5, options, startsAt, deadline}`. Questions are **pre-loaded** to clients without answers marked (or sent just in time) so the payload is tiny. Each client starts its countdown from `deadline - offset`. Everyone sees the same deadline even if the message arrived 300 ms later for some.

**Answering.** Client sends `{q:5, option:'B', clientTs}`. The gateway checks: right question, before `deadline + 500 ms grace`, first answer from this participant (a local set, backed by Redis `SETNX` for reconnect cases). It increments in-memory counters and appends the answer to a buffer. Every 250 ms each gateway flushes: `HINCRBY` counts to Redis and a batch of answers to Kafka.

**Scoring.** Points depend on correctness and speed: `points = correct ? 500 + 500 × (timeLeft / 20) : 0`, computed from **server receive time** relative to the start (clients can't fake speed). Gateways send `ZINCRBY quiz:{id}:scores points participantId` in the same flush.

**Results.** After the deadline + grace, the controller reads the counts hash and `ZREVRANGE ... 0 9 WITHSCORES` and publishes `{type:'results', counts, top10}`. Each gateway also sends each participant their personal `{score, rank}` (from `ZREVRANK`, batched with pipelining) so everyone sees 'You're 4,312th'.

**Client.**
- Lightweight page (no heavy framework needed beyond the essentials), large touch targets, clear countdown.
- Locks the answer once tapped; shows 'Answer received ✓' when the gateway acks.
- On reconnect, asks for `current state` and resumes (if the question is still open and they haven't answered, they can still answer).
- If the tab was backgrounded, timers are recalculated from the deadline, not decremented per tick.

**Durability.** The writer consumes Kafka and bulk-inserts answers into Postgres for reports; final scores are persisted at the end. If Redis fails mid-quiz, the controller can rebuild counts from the stream, though for a live game a short pause is acceptable."

#### Another worked example: a smaller live poll on a webinar page
"For a 2,000-person webinar poll I wouldn't need gateways and Kafka. A managed real-time service (or SSE from one app server) to push the poll, `POST /polls/:id/votes` with a unique `(poll_id, user_id)` constraint, and a counts query cached for one second would be plenty. The design scales up by removing hot spots one at a time: first batch counts in Redis, then move answers onto the socket, then add the stream. Saying where you'd start is as important as the big design."

#### Step-by-step framework
1. **Numbers first**: joins/sec, answers/sec at peak, fan-out size.
2. **Connection layer**: gateways, sockets per instance, stateless design.
3. **Synchronisation**: server deadlines + client clock offset.
4. **Answer path**: validate at the edge, buffer, batch.
5. **Counting and scoring** in Redis; durable writes off the hot path.
6. **Results fan-out** plus personal ranks.
7. **Client resilience**: reconnect state, background tabs, acks.
8. **Failure modes and the smaller-scale version.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Each answer is an `INSERT` + `UPDATE counts` in Postgres | In-memory aggregation, Redis counters, async durable writes |
| "You have 20 seconds" in each message | Absolute deadline + clock offset |
| Speed scored from client timestamps | Scored from server receive time |
| Gateways subscribe per user | One channel subscription per gateway |
| Full leaderboard to everyone | Top 10 broadcast + each player's own rank |
| Same design for 2k and 100k users | Starts simple, explains when each piece is needed |

#### Useful phrases
- "The hot path never touches Postgres; durable writes happen in bulk afterwards."
- "I broadcast an absolute deadline and let clients correct for their clock offset."
- "Gateways aggregate locally and flush every 250 ms, so Redis sees thousands of increments, not 20k a second."
- "Score speed from server receive time; the client can't be trusted."
- "For 2,000 users I'd use a far simpler design."

#### Common pitfalls
- **A single hot counter row** in the database.
- **Per-user pub/sub subscriptions** multiplying Redis load.
- **Trusting client clocks or client-computed scores.**
- **Huge payloads** (the full leaderboard, question images inline) sent to 100k sockets.
- **Reconnect storms** after a gateway deploy, with no jitter.

#### Follow-ups to expect (with sample answers)
- **"How do you prevent cheating with multiple tabs?"**
  "One participant token per join, first answer wins via `SETNX`, and rate limits per IP/device for joins. For prize quizzes I'd require sign-in."
- **"What if a gateway dies mid-question?"**
  "Its clients reconnect to other gateways, fetch current state, and can still answer if the deadline hasn't passed. Unflushed buffered answers (up to 250 ms) could be lost; acks are sent only after flush if that matters."
- **"How would you scale to 1M participants?"**
  "More gateways, and a two-level fan-out (controller → regional relays → gateways). Counting stays sharded per gateway with periodic flushes; Redis Cluster for sorted sets, or approximate ranks for people outside the top few thousand."
- **"Would you use a managed service?"**
  "For the connection layer, often yes (Ably, Pusher, AWS API Gateway WebSockets), and keep counting and scoring in our services."

#### What senior interviewers look for
- **Numbers that drive the design**, not the other way round.
- Spotting **every hot spot**: joins, fan-out, counters, leaderboards.
- **Fairness** handled by server-side time.
- Knowing the **simple version** and when to graduate from it.

#### Practise it
1. Do the capacity maths for 100k and 1M participants out loud.
2. Implement clock offset estimation over a WebSocket and a countdown based on an absolute deadline.
3. Write the gateway flush loop: in-memory counters → `HINCRBY` pipeline every 250 ms.
4. Explain to a friend why scoring uses server receive time.

## Design a CMS-driven marketing site with previews
- id: fs-design-11
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: medium
- levels:
- tags: headless CMS, SSG, ISR, previews, SEO, CDN, i18n

### Prompt
Design a marketing website whose content is managed by non-engineers in a headless CMS: pages must be very fast and SEO-friendly, editors need to preview drafts before publishing, and published changes should go live within a minute. Cover content modelling, rendering, previews, caching and localisation.

### Answer
#### What the interviewer is really testing
- **Rendering strategy**: static generation, incremental regeneration and on-demand revalidation, and why.
- **Content modelling** that gives editors flexibility without breaking design (structured blocks, not raw HTML).
- **Preview mode**: showing drafts safely without leaking them or caching them publicly.
- **Cache invalidation** across build output, CDN and CMS webhooks.
- **SEO and performance**: metadata, sitemaps, images, Core Web Vitals, localisation.

#### Key points
- **Headless CMS** (Contentful, Sanity, Storyblok, Strapi, Payload) holds structured content; the site fetches it via API at build/regeneration time.
- Model pages as an ordered list of **typed blocks** (Hero, FeatureGrid, Testimonial, CTA, RichText) mapped to React components. Editors compose pages; engineers own the components and their constraints.
- Render with **SSG + ISR** (or full static with fast rebuilds): pages are HTML at the CDN edge. Publishing triggers a **webhook → on-demand revalidation** of affected paths (and pages that reference the changed entry).
- **Preview**: a signed preview route sets a draft-mode cookie; requests with it bypass the cache, fetch **draft** content with a preview token and render on demand. Add `noindex` and never cache those responses publicly.
- **SEO**: per-page title/description fields with sensible fallbacks, canonical URLs, `hreflang` for locales, generated sitemap and robots.txt, structured data.
- **Images** through the CMS image API or an image CDN with responsive sizes and modern formats.

#### Model answer
"**Requirements.** ~2,000 pages (product pages, landing pages, blog) in 5 languages. Editors build pages from components, schedule publishing and preview before going live. LCP under 2 seconds on mobile. Changes live within 60 seconds of publishing. Traffic spikes during campaigns.

**Content model.**
```
Page { slug, locale, seoTitle, seoDescription, ogImage, noindex, blocks: Block[] }
Block = Hero { heading, subheading, image, cta }
      | FeatureGrid { items: { icon, title, body }[] (max 6) }
      | Testimonial { quote, author, logo }
      | RichText { portableText }
      | CTA { text, link, variant: primary|secondary }
BlogPost { slug, locale, title, author→Author, body, tags, publishedAt }
Navigation, Footer (global singletons)
```
Validation lives in the CMS (required fields, max lengths, max items) so editors can't produce layouts the design can't handle. Rich text is structured (Portable Text / JSON), not HTML, so we control rendering and avoid XSS.

**Rendering (Next.js as an example).**
- `app/[locale]/[...slug]/page.tsx` fetches the page by slug and locale and maps blocks to components.
- `generateStaticParams` pre-builds the top pages; the rest render on first request and are cached (ISR).
- Each page fetch is **tagged** (`page:pricing`, `entry:abc123`, `nav`).
- Default revalidation every hour as a safety net.

**Publishing flow.**
```
Editor publishes ──► CMS webhook ──► /api/revalidate (secret verified)
                                       └── revalidateTag('entry:abc123') + paths that reference it
                                            └── next request regenerates; CDN serves new HTML
```
Changing the global navigation revalidates the `nav` tag, which refreshes every page that used it. Scheduled publishing is handled by the CMS, which fires the same webhook when the time comes.

**Preview.**
- The CMS 'Preview' button links to `/api/preview?secret=…&slug=/pricing&locale=de`.
- The handler checks the secret, enables draft mode (a signed, HTTP-only cookie) and redirects to the page.
- With draft mode on, data fetches use the **preview API token** and skip caches; responses get `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`. A banner shows 'Preview mode — exit'.
- Many CMSs support **live preview** (the page updates as the editor types) via a postMessage bridge in an iframe.

**Performance.**
- Static HTML from the CDN; minimal client JS (most blocks are server components; only interactive ones like carousels hydrate).
- Hero images: `priority` / `fetchpriority=high`, explicit sizes, AVIF/WebP from the image CDN; others lazy-loaded.
- Fonts self-hosted with `font-display: swap` and preloaded; third-party scripts (analytics, chat) loaded after interaction or idle.

**Localisation.**
- Locale in the path (`/de/preise`), localised slugs stored per locale.
- `hreflang` alternates and a per-locale sitemap; a language switcher that maps to the equivalent page, not the home page.
- Fallback: if a page isn't translated, either show the English version with a notice or 404, per editorial policy; never auto-index fallbacks as duplicates (canonical to the original).

**SEO.** Titles and descriptions from fields with fallbacks to the hero heading; canonical URLs; sitemap generated from the CMS; redirects managed in the CMS (a `Redirect` model) and applied in middleware, so editors can rename slugs without breaking links."

#### Another worked example: an editor renames a page slug
"An editor changes `/pricing-old` to `/pricing`. Without care, the old URL 404s, search rankings drop and internal links break. The flow:
1. The CMS's slug field has a hook that, on change, creates a `Redirect { from: '/pricing-old', to: '/pricing', permanent: true }` entry.
2. The publish webhook revalidates both paths and the redirects list.
3. Middleware loads the redirects map (cached, revalidated by tag) and returns `308` for the old path.
4. Internal links are references to entries, not hard-coded URLs, so they render the new slug automatically.
5. The sitemap regenerates without the old URL."

#### Step-by-step framework
1. **Requirements**: page count, locales, freshness, performance targets, editor workflows.
2. **Content model**: typed blocks, validations, structured rich text, globals.
3. **Rendering**: SSG/ISR, server components, tags for invalidation.
4. **Publishing**: webhook → on-demand revalidation (+ fallback TTL).
5. **Preview**: secret route, draft cookie, no caching, noindex.
6. **Performance**: images, fonts, minimal JS, third-party scripts.
7. **SEO & i18n**: metadata, hreflang, sitemaps, redirects.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Fetch CMS content in the browser on every visit | Static/ISR HTML at the CDN |
| Editors paste raw HTML | Typed blocks with validations; structured rich text |
| Full site rebuild on every typo fix | Tag/path-based on-demand revalidation |
| Preview via a hidden public URL | Signed draft-mode cookie, no cache, noindex |
| Slug changes break links | Managed redirects + entry references |
| Locale as a dropdown that resets to home | Localised paths, hreflang, equivalent-page switching |

#### Useful phrases
- "Editors compose pages from blocks; engineers own what each block can do."
- "Publishing triggers on-demand revalidation by tag, with a time-based safety net."
- "Preview requests bypass every cache and are marked noindex."
- "Most of the page is server-rendered with zero client JavaScript; only interactive blocks hydrate."
- "Links reference entries, so renames don't break them."

#### Common pitfalls
- **Over-flexible content models** that let editors break layouts.
- **Leaking drafts** through cached preview responses.
- **Forgetting dependent pages** when a shared entry (nav, an author) changes.
- **Heavy client bundles** on what should be static pages.
- **Duplicate content** across locales without canonical/hreflang.

#### Follow-ups to expect (with sample answers)
- **"Why not just use WordPress?"**
  "That's a valid option for content-heavy teams. Headless gives the engineering team full control of performance and components and lets content feed other channels; WordPress gives editors a richer out-of-the-box experience. I'd decide based on the team and how custom the front end must be."
- **"How would you A/B test landing pages?"**
  "Assign the variant at the edge (middleware sets a cookie), serve statically generated variants by rewriting to `/variant-b/...`, so pages stay cacheable, and track conversions in analytics."
- **"What if the CMS API goes down?"**
  "Published pages keep serving from the CDN cache. Revalidation fails safely (keep the old version). Only previews and new uncached pages are affected."
- **"How do you prevent editors breaking the design?"**
  "Validation in the CMS, constrained component variants, visual regression tests on a set of content fixtures, and a staging preview."

#### What senior interviewers look for
- A clear **invalidation story** including dependencies.
- **Safe previews**.
- Treating **editors as users** with a good workflow.
- Performance and SEO basics delivered by default.

#### Practise it
1. Build a Next.js page that renders CMS blocks via a component map and uses tag-based revalidation from a webhook.
2. Implement draft mode with a secret and confirm responses aren't cached.
3. Generate a sitemap and hreflang tags for two locales.
4. Explain to a friend how a slug rename works end to end.

## Design an AI-powered document Q&A product, end to end
- id: fs-design-12
- round: FULLSTACK_SYSTEM_DESIGN
- difficulty: hard
- levels: senior, staff
- tags: RAG, LLM, embeddings, streaming, vector search, AI product

### Prompt
Design a product where users upload documents (PDFs, Word files) to a workspace and ask questions in a chat; answers stream back with citations to the source passages. Cover ingestion, retrieval, the LLM call, streaming to the UI, permissions and cost.

### Answer
#### What the interviewer is really testing
- Understanding of **retrieval-augmented generation (RAG)**: chunking, embeddings, vector search, prompt assembly.
- **Full stack streaming**: tokens from the model through your server to the browser, with cancel and error handling.
- **Citations and trust**: grounding answers in sources and showing them in the UI.
- **Permissions in retrieval**: users must never get answers from documents they can't see.
- **Cost, latency and quality** trade-offs, plus how you'd evaluate answers.

#### Key points
- **Ingestion pipeline**: upload (presigned) → extract text (PDF parser/OCR) → clean → **chunk** (~300–800 tokens with overlap, respecting headings) → **embed** → store chunks with vectors and metadata (doc id, page, workspace, ACL).
- **Retrieval**: embed the question → **hybrid search** (vector + keyword/BM25) filtered by workspace and permissions → optional **re-ranker** → top ~5–10 chunks.
- **Generation**: prompt with system instructions ("answer only from the sources, cite them as [1], say if you don't know"), the retrieved chunks with ids, recent chat history and the question. **Stream** the response.
- **Streaming path**: model API (SSE) → your server (which adds auth, logging, citation parsing) → browser via SSE or a streamed `fetch` response. Support **cancel** (AbortController end to end).
- **Citations**: chunks carry ids; the model cites ids; the UI renders them as clickable chips that open the document at the right page with the passage highlighted.
- **Cost control**: cache embeddings, cap context size, choose model per task, rate-limit per user, log tokens per request.
- **Evaluation**: a test set of questions with expected sources/answers; measure retrieval recall and answer faithfulness before changing chunking or models.

#### Model answer
"**Requirements.** Teams create workspaces, upload up to thousands of documents, and chat with them. Answers stream within ~1–2 seconds to first token, include citations, and respect folder-level permissions. 5k workspaces, 10M chunks total.

**Ingestion.**
```
Browser ──presigned PUT──► Object storage
   └──POST /documents──► API (row: status=processing) ──► Queue
                                                         └──► Ingest worker:
     extract text per page (pdf parser; OCR if scanned) → split by headings/paragraphs
     → chunks of ~500 tokens, 50 overlap → embeddings (batch) → insert chunks
     → status=ready (push event to the UI)
```
```sql
documents(id, workspace_id, folder_id, name, status, pages, created_by)
chunks(id, document_id, workspace_id, folder_id, page, heading, text,
       embedding vector(1024), tsv tsvector)
-- HNSW index on embedding; GIN on tsv; btree on (workspace_id, folder_id)
```
Postgres + pgvector is fine for 10M chunks; a dedicated vector database is an option later.

**Question flow.**
```
POST /chats/:id/messages { text }   →  streamed response (text/event-stream)
```
1. Auth → resolve the user's accessible `folder_ids` in this workspace.
2. If there's history, rewrite the question into a standalone query (a small, cheap model call), e.g. 'what about Q3?' → 'What was revenue in Q3 2026?'.
3. **Hybrid retrieval**: top 30 by vector similarity + top 30 by keyword, both filtered `WHERE workspace_id = $1 AND folder_id = ANY($2)`; merge with reciprocal rank fusion; re-rank to the best 8.
4. Build the prompt: system rules, sources formatted as `[S1] (Doc name, p.4) text…`, the last few turns, the question.
5. Call the model with streaming. The server forwards text deltas as SSE `data:` events, and at the end sends a `sources` event mapping `S1…S8` to document ids and pages.
6. Persist the user message, the final answer, cited source ids, model, token counts and latency.

**Frontend.**
- Chat UI with a message list; the assistant message renders **incrementally** (Markdown rendered progressively; code blocks closed safely mid-stream).
- A **Stop** button aborts the fetch; the server sees the disconnect and aborts the upstream model call (saves tokens).
- Citation markers `[S2]` become chips; hovering shows the snippet; clicking opens a side panel PDF viewer at that page with the passage highlighted.
- States: 'Searching your documents…' before the first token, a friendly error with Retry if the stream fails, and 'I couldn't find this in your documents' when retrieval returns nothing relevant (the system prompt tells the model to say so rather than guess).
- Upload panel shows per-document processing status.

**Permissions.** Retrieval filters by the user's folders **before** anything reaches the model; the model can't leak what it never sees. Chat history is per user. Deleting a document deletes its chunks immediately.

**Cost and latency.**
- Embedding cost is paid once per chunk; re-embed only when the document changes.
- Context capped at ~8 sources (~4k tokens). Prompt caching for the static system prompt.
- A cheaper model for query rewriting; the stronger model for answers.
- Per-user and per-workspace daily token budgets, with usage shown to admins.

**Evaluation.** A golden set of ~200 questions per sample corpus, with the expected source passages. Track retrieval hit rate@8, answer faithfulness (an LLM judge plus human spot checks) and citation accuracy. Any change to chunking, embedding model or prompt is evaluated before shipping. In production, thumbs up/down and 'source was wrong' feedback feed the set."

#### Another worked example: why chunking matters
"A user asks 'What's the notice period in the contract?'. With fixed 1,000-character chunks, the clause heading 'Termination' landed in one chunk and '90 days' in the next, so retrieval found the heading but not the number, and the model answered 'not specified'. Switching to **structure-aware chunking** (split on headings and clauses, keep the heading as a prefix in every chunk, small overlap) fixed it. I'd always store the heading path ('Section 12 › Termination') with each chunk; it improves both retrieval and how citations read in the UI."

#### Step-by-step framework
1. **Requirements**: corpus size, latency, permissions, citation needs.
2. **Ingestion**: upload, extract, chunk (structure-aware), embed, index, status.
3. **Retrieval**: rewrite query, hybrid search with permission filters, re-rank.
4. **Generation**: grounded prompt, citations by id, streaming.
5. **Streaming plumbing**: model → server → browser, with cancel.
6. **UI**: incremental rendering, citation chips, source viewer, states.
7. **Cost & limits**: model choice, context caps, caching, budgets.
8. **Evaluation & feedback loop.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Send the whole document to the LLM" | RAG with chunking, retrieval and a context budget |
| Vector search only | Hybrid search + re-ranking |
| Permissions checked after generation | Permission filter inside retrieval |
| Waits for the full answer, then shows it | Streams tokens with a working Stop button |
| No citations | Source ids cited and rendered as clickable passages |
| "We'll see if users like it" | Golden-set evaluation before changes, feedback in production |

#### Useful phrases
- "Retrieval is filtered by the user's permissions, so the model never sees what they can't."
- "I'd use hybrid search, because vectors miss exact terms like invoice numbers."
- "Stopping in the UI should abort the upstream model call too, or we pay for tokens nobody reads."
- "The prompt tells the model to cite source ids and to say when the answer isn't in the documents."
- "I wouldn't change chunking or models without running the evaluation set."

#### Common pitfalls
- **Naive fixed-size chunking** that splits tables and clauses.
- **Leaking documents across users** by filtering after retrieval or caching answers across users.
- **No cancel path**, so abandoned answers keep consuming tokens.
- **Rendering half-finished Markdown** badly (unclosed code fences).
- **No evaluation**, so quality regressions go unnoticed.
- **Unbounded costs** with no per-user limits.

#### Follow-ups to expect (with sample answers)
- **"How do you handle tables and scanned PDFs?"**
  "OCR scanned pages; detect tables and convert them to Markdown or keep them as whole chunks with a caption; for heavy table use, consider a vision model during ingestion."
- **"How would you reduce hallucinations?"**
  "Better retrieval first, then strict instructions, citation requirements, a 'not found' path and optionally a verification pass that checks each claim against the cited source."
- **"How do you update when a document changes?"**
  "Re-ingest that document: compute chunk hashes, re-embed only changed chunks, delete removed ones, all in a transaction swapping the document's chunk set."
- **"Would you use an agent framework?"**
  "Not for this core flow; a fixed pipeline is easier to evaluate and cheaper. I'd add tool use when questions need actions (compare two documents, run a calculation)."

#### What senior interviewers look for
- Treating the LLM as **one component** in a system with retrieval, permissions, streaming and evaluation.
- **Security** designed into retrieval.
- **Cost and latency awareness** with concrete levers.
- A **quality process**, not prompt tinkering.

#### Practise it
1. Build a small RAG prototype with pgvector: ingest 20 PDFs, chunk by heading, ask questions, print retrieved chunks.
2. Stream an LLM response through your own API route to a React UI with a Stop button that aborts upstream.
3. Create a 30-question evaluation set and measure retrieval hit rate for two chunk sizes.
4. Explain to a friend why permission filtering must happen before generation.
