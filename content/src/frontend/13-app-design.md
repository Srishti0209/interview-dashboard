# Frontend Engineer — FE System Design: Applications

## Design a chat application (Slack/Messenger)
- id: 202058da-c6f8-4ad2-900c-4e5cd5f602df
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, chat, realtime
- companies: Meta, Stripe, Slack, Anthropic

### Prompt
Design the frontend of a chat application like Slack or Messenger. Users belong to workspaces with channels and direct messages, see messages arrive in real time, send messages (including while offline), see typing indicators, unread counts and read receipts, and can scroll back through long histories. Senior-level depth is expected.

### Answer
#### What the interviewer is really testing
- A **structured application design**: requirements, high-level architecture, data model, API and real-time protocol, then deep dives.
- **Real-time architecture**: WebSocket connection management, reconnection, missed-message recovery, event ordering, multi-tab.
- **Client data layer**: normalised store, pagination of histories, cache, optimistic sends with idempotency, offline queue.
- **Rendering performance**: virtualized message lists with variable heights, bidirectional loading, scroll anchoring.
- **Product details** at scale: unread counts, read receipts, typing indicators, notifications, search, accessibility, and security.

#### Key points
- **Requirements (scope with the interviewer):**
  - Functional: workspaces, channels, DMs, send/receive text (plus attachments, reactions, threads as stretch), history, unread counts, typing indicators, presence, read receipts (DMs), notifications, search.
  - Non-functional: messages appear within ~100 to 300ms; works on flaky networks; offline compose; fast app start; handles channels with millions of messages; accessible; secure.
- **High-level architecture:**
  ```
  ┌─────────────────────── Browser ───────────────────────────────┐
  │ UI: Sidebar (channels, unread) | MessageList (virtualized)     │
  │     Composer | ThreadPanel | Search                            │
  │            ▲ selectors                                         │
  │ Client store (normalised): workspaces, channels, messages by   │
  │   channel (pages), users, readState, pendingMessages           │
  │            ▲ events            ▲ queries/mutations             │
  │ Realtime client (WebSocket)   API client (HTTP)                │
  │ - connect/auth/heartbeat      - history pages, search,         │
  │ - reconnect + resync (cursor)   uploads, send fallback         │
  │ Persistence: IndexedDB (recent messages, outbox)               │
  │ Shared across tabs: SharedWorker / leader tab + BroadcastChannel│
  └────────────────────────────────────────────────────────────────┘
          ▲ WebSocket (events)              ▲ HTTPS (REST/GraphQL)
     Gateway servers                     API servers
  ```
- **Data model:**
  - `Message { id, clientId, channelId, authorId, text, createdAt, editedAt?, threadRootId?, reactions, status: 'sending' | 'sent' | 'failed' }`.
  - `Channel { id, name, type, memberIds?, lastMessageId, lastReadMessageId (per user), unreadCount, mentionCount }`.
  - Messages per channel stored as ordered pages with cursors (`before`/`after`), normalised by id.
- **API:**
  - HTTP: `GET /channels/:id/messages?before=<cursor>&limit=50`, `GET ?after=` for gaps, `POST /channels/:id/messages { clientId, text }` (idempotent by `clientId`), `POST /channels/:id/read { messageId }`, search endpoint.
  - WebSocket events (server → client): `message.created`, `message.updated`, `message.deleted`, `reaction.added`, `typing`, `presence`, `read.updated`, `channel.updated`; each with a per-connection or per-channel sequence number. Client → server: `typing`, `subscribe`, optionally `send`.
- **Real-time deep dive:**
  - One connection per user (shared across tabs via SharedWorker or a leader tab elected with Web Locks), heartbeats, exponential backoff reconnect with jitter.
  - **Resync on reconnect**: send last seen event sequence/cursor; server replays missed events or the client fetches `?after=` for open channels and marks others stale.
  - **Ordering**: server-assigned timestamps/sequence numbers are the truth; client inserts by order, not arrival.
  - **De-duplication**: by message id and `clientId` (your own message arrives via both HTTP response and WebSocket).
- **Sending (optimistic + offline):** generate `clientId` (UUID), insert immediately as `sending`, persist in an IndexedDB outbox, send; on ack, replace with server message; on failure, mark `failed` with Retry; when offline, keep queued and flush in order on reconnect. Idempotency keys prevent duplicates on retry.
- **Message list rendering:** virtualized with variable heights (text, images, code), measured with ResizeObserver; reversed (newest at bottom); load older pages on scroll up while **anchoring scroll** so content doesn't jump; stick to bottom only if the user is at the bottom; "New messages" divider at last-read position and "Jump to latest" button; image placeholders with known dimensions to prevent shifting.
- **Unread and read state:** track `lastReadMessageId` per channel; mark read when the message is visible and the window is focused (IntersectionObserver + `visibilitychange`), debounced; unread/mention counts from the server, updated by events; sync across tabs and devices.
- **Typing and presence:** typing events throttled (send at most every 3s while typing), expire after ~5s without updates; presence via heartbeats, aggregated server-side; ephemeral, never persisted.
- **Performance and startup:** code-split rarely used panels; render the shell and last-opened channel from IndexedDB cache instantly (stale-while-revalidate); prefetch channel history on hover; limit in-memory messages per channel (evict old pages).
- **Notifications:** in-app badges; desktop notifications via the Notifications API when tab hidden; push via Service Worker when closed (with permission); respect mute settings.
- **Accessibility:** message list as `role="log"` with polite announcements for new messages in the current channel (throttled), keyboard navigation through messages (up/down to move, actions menu), composer labelled with the channel name, focus management when switching channels.
- **Security:** render message text safely (Markdown without raw HTML, sanitise), link previews generated server-side, auth on WebSocket connect (short-lived token, not in URL logs), per-channel authorisation for subscriptions, rate limiting.

#### Model answer
"I'll start with requirements, then the architecture, data model and APIs, then go deep on real-time delivery, sending, and rendering the message list.

**Requirements.** Users have workspaces with channels and direct messages. They can send and receive messages in real time, scroll back through history, see unread and mention counts, typing indicators, presence, and read receipts in DMs, and get notifications. Non-functionally: messages should appear within a few hundred milliseconds, the app must handle flaky networks and let users compose offline, start fast, and handle channels with years of history. I'll treat threads, reactions and attachments as extensions.

**Architecture.** In the browser I'd have four layers. The UI: sidebar, message list, composer, thread panel. A normalised client store holding workspaces, channels, users, messages per channel as paginated ranges, read state and an outbox of pending messages. Two transport clients: an HTTP client for history, search and mutations, and a real-time client over a WebSocket for events. And persistence in IndexedDB for recent messages and the outbox, so the app opens instantly and offline messages survive a refresh. Since users often have several tabs open, I'd share one WebSocket across tabs, using a SharedWorker or a leader tab elected with the Web Locks API, broadcasting events to other tabs via BroadcastChannel.

**Data model and API.** A message has a server id, a client-generated id for idempotency, channel, author, text, timestamps, optional thread root, reactions, and a local status: sending, sent or failed. A channel has its last message, the user's last-read message, and unread and mention counts. History is fetched with cursor pagination: `GET /channels/:id/messages?before=cursor&limit=50`. Sending is `POST` with the client id, so retries are safe. The WebSocket delivers events like message created, updated, deleted, reactions, typing, presence and read updates, each with a sequence number.

**Real-time deep dive.** The connection authenticates with a short-lived token, sends heartbeats, and reconnects with exponential backoff and jitter. The important part is what happens after a reconnect: messages sent while we were disconnected must not be lost. The client sends its last seen sequence number; the server replays missed events if it can, or tells the client to resync, in which case we fetch `?after=` the newest message we have for the open channel and mark other channels as stale, refreshing them when opened. Ordering comes from server timestamps or sequence numbers, not arrival order, and every event is de-duplicated by message id, because our own message arrives twice, once in the HTTP response and once over the socket.

**Sending.** Sending is optimistic. I generate a client id, insert the message immediately with status 'sending', save it in the IndexedDB outbox, and send it. When the server acknowledges, the pending message is replaced by the server version, matched by client id. If it fails, it shows as failed with a Retry option. If we're offline, messages stay queued and are sent in order when the connection returns; because the client id is an idempotency key, a retry after a timeout never creates a duplicate.

**Message list.** This is the hardest UI piece. Channels can have thousands of messages with variable heights: text, code blocks, images. I'd virtualize with measured heights. The list is anchored to the bottom: if the user is at the bottom, new messages keep them there; if they've scrolled up, we don't move them, and show a 'New messages' button. Scrolling up loads older pages, and when they're prepended I preserve the scroll position by adjusting for the added height, so the content doesn't jump. Opening a channel scrolls to the first unread message with a 'New' divider. Images reserve space using dimensions from the server so they don't push content around as they load.

**Unread state.** A message counts as read when it's actually visible and the window is focused, which I detect with IntersectionObserver and the visibility API. Read updates are debounced and sent as 'last read message id', and the server broadcasts them to the user's other tabs and devices, so unread badges stay consistent everywhere.

**Typing and presence** are ephemeral: typing events are throttled to one every few seconds while typing and expire after about five seconds; presence comes from heartbeats aggregated by the server.

**Startup and performance.** On load, we render the shell and the last channel from IndexedDB immediately, then revalidate from the network. Rarely used features like search and settings are code-split. We prefetch a channel's latest page when the user hovers it in the sidebar, and evict old pages from memory for channels not viewed recently.

**Notifications, accessibility and security.** Desktop notifications when the tab is hidden, push through a service worker when closed, respecting mute settings. The message list is a `log` region announcing new messages politely and throttled, with keyboard navigation through messages. Message text renders through Markdown without raw HTML, link previews are generated server-side, and channel subscriptions are authorised on the server."

#### Another worked example
**Scroll anchoring when loading older messages.**
```
Before prepend: scrollHeight = 12,000, scrollTop = 150 (user near top)
Prepend 50 older messages (+4,000px)
After prepend:  scrollHeight = 16,000
Restore: scrollTop = 150 + (16,000 - 12,000) = 4,150   ← user sees the same message
```
Do this in a layout effect (before paint). With virtualization, adjust the virtualizer's offset by the measured height of inserted items, or keep stable keys and let the library's anchoring handle it. CSS `overflow-anchor: auto` does this natively in Chrome and Firefox but not in Safari, so a manual fallback is needed. Many chat UIs render the list with `flex-direction: column-reverse` so the browser naturally anchors to the bottom; it simplifies stick-to-bottom but complicates some virtualization libraries.

#### A third worked example
**Slack-style workspace at scale (B2B) versus Messenger (B2C).**
- **Slack (B2B):** many channels (hundreds per user), so the sidebar needs unread aggregation from the server rather than subscribing to every channel's messages; the client subscribes to message events only for the open channel and a few recent ones, and receives lightweight `channel.updated` events (last message, counts) for the rest. Enterprise needs: data retention policies, eDiscovery, SSO, and message edits/deletes propagating everywhere.
- **Messenger (B2C):** mostly 1:1 and small groups, read receipts and delivery ticks per message, end-to-end encryption in some products (then the server can't render previews or search; search happens client-side over a local index), heavy mobile usage, media-first messages with aggressive image optimisation.
Naming these differences shows you design for the product, not a generic template.

#### Step-by-step framework
1. **Requirements**: functional scope and non-functional targets; agree on stretch goals.
2. **High-level architecture**: UI, store, HTTP + WebSocket clients, persistence, multi-tab sharing.
3. **Data model**: messages, channels, read state; pagination model.
4. **APIs**: HTTP endpoints and real-time event types with sequence numbers.
5. **Real-time deep dive**: connection lifecycle, reconnect, resync, ordering, de-duplication.
6. **Sending**: optimistic, idempotent, offline outbox, retry.
7. **Message list**: virtualization, bidirectional loading, scroll anchoring, unread divider.
8. **Cross-cutting**: unread logic, typing/presence, startup performance, notifications, accessibility, security; wrap up with trade-offs.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Use WebSockets" and stop | Connection lifecycle, resync with sequence numbers, ordering, dedup |
| Waits for server before showing sent messages | Optimistic send with client ids, outbox, idempotent retry |
| Renders all messages | Virtualized variable-height list with scroll anchoring |
| Marks read on channel open | Visibility- and focus-based read tracking, synced across devices |
| One socket per tab | Shared connection via SharedWorker/leader tab |
| Ignores startup | IndexedDB cache, stale-while-revalidate, code splitting, prefetch on hover |

#### Useful phrases
- "The hard part isn't receiving messages; it's not losing any when the connection drops."
- "Every send has a client id, so retrying is always safe."
- "The server's sequence is the truth; arrival order isn't."
- "Prepending history must not move what the user is reading."

#### Common pitfalls
- **No resync after reconnect**, silently losing messages.
- **Duplicate messages** from HTTP response plus WebSocket echo.
- **Scroll jumps** when loading history or when images load.
- **Unread counts computed only client-side**, drifting across devices.
- **Typing indicators sent on every keystroke**.
- **Rendering user Markdown as HTML** without sanitising.

#### Follow-ups to expect (with sample answers)
- **"WebSocket, SSE or long polling?"** — "WebSocket, because it's bidirectional (typing indicators, subscriptions) and low overhead. SSE is fine for receive-only feeds and works well over HTTP/2. Long polling is a fallback for restrictive networks."
- **"How would you implement search?"** — "Server-side search with an index (e.g. Elasticsearch), queried with debouncing; results link to a message, and opening it loads the surrounding page of history (`around=` cursor) and highlights it. With end-to-end encryption, search must run on a local index."
- **"How do threads fit in?"** — "Thread replies are messages with a `threadRootId`; the root message shows a reply count and participants; opening the thread loads its messages in a side panel with its own pagination and subscription."
- **"How do you handle edits and deletes?"** — "Events update the normalised message by id, so every view (channel, thread, search results) updates. Deleted messages become tombstones so positions and thread counts stay consistent."
- **"How do you measure performance?"** — "Time from send to the message appearing for the recipient (end-to-end latency), app start to interactive, channel switch time, scroll frame rate, and reconnect success rate, tracked with real-user monitoring."

#### What senior interviewers look for
- **Depth on reliability** of real-time delivery and sending.
- **Sound client data architecture** with normalisation, caching and persistence.
- **Rendering expertise** for the message list.
- **Product awareness** (B2B vs B2C differences), accessibility and security, with clear trade-offs.

#### Practise it
- Present this design in 45 minutes with the architecture diagram, then do a 10-minute deep dive on reconnect and resync.
- Prototype a message list with bidirectional loading and scroll anchoring.
- Checklist: requirements · architecture diagram · normalised store · IndexedDB cache and outbox · shared socket across tabs · event types with sequences · reconnect + resync · ordering + dedup · optimistic idempotent send · virtualized list · scroll anchoring · unread via visibility · typing throttling · presence · startup strategy · notifications · a11y · security.

#### Variations you might be asked
- "Design WhatsApp Web."
- "Design a live comments section for a streaming event with 100,000 viewers."
- "Design a customer support chat widget embedded on other sites."

## Design Google Docs (collaborative editor)
- id: 7ee2718f-6093-45e0-8f50-ed2d1eb1de11
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, collaborative-editing, CRDT, OT
- companies: Google, Notion, Anthropic

### Prompt
Design the frontend of a collaborative document editor like Google Docs. Multiple people edit the same document at the same time and see each other's changes and cursors live. Cover the editing model, how concurrent edits are merged (OT vs CRDT), the client–server protocol, offline editing, comments and suggestions, version history, permissions and performance for long documents.

### Answer
#### What the interviewer is really testing
- The core depth: **how concurrent edits converge**. Can you explain **Operational Transformation** and **CRDTs** concretely, with an example, and choose between them?
- **Client architecture for collaboration**: local-first application of edits, pending/acknowledged operation queues, rebasing, cursor and selection mapping.
- **Protocol design**: versions/revisions, acknowledgements, reconnection and catch-up, snapshots plus operation logs.
- **Collaboration features**: presence, remote cursors, comments anchored to text that moves, suggestion mode, version history.
- **Operational concerns**: offline, permissions changing mid-session, very large documents, performance and testing.

#### Key points
- **Requirements:** rich text editing (headings, lists, tables, images); real-time co-editing by up to ~100 concurrent editors (more viewers); remote cursors and presence; comments and suggestions; version history and restore; offline editing with later sync; sharing and permissions (view, comment, edit); export; large documents (hundreds of pages).
- **Editing model:** a structured document model (tree or linear sequence of characters with formatting attributes), never the DOM. Every change is an **operation** (`insert(pos, text, attrs)`, `delete(pos, len)`, `format(pos, len, attrs)`).
- **Why merging is hard:**
  ```
  Doc: "abc"   Alice: insert(1, "X") → "aXbc"   Bob (concurrently): delete(2, 1) → "ab"
  Naively apply Bob's op on Alice's doc: delete(2,1) on "aXbc" → "aXc"  (deleted 'b' instead of 'c')
  Correct result: "aXb"
  ```
- **Operational Transformation (OT):**
  - Each operation is **transformed** against concurrent operations so its intent is preserved: Bob's `delete(2,1)` transformed against Alice's `insert(1,"X")` becomes `delete(3,1)`.
  - Google Docs uses a **central server** that defines a total order of operations (revision numbers). Client keeps: last acknowledged revision, one **in-flight** op, and a **buffer** of pending local ops (the Jupiter/Google Wave model). Incoming server ops are transformed against in-flight and buffered ops; acknowledged ops advance the revision.
  - Pros: compact operations, small documents, server can validate and enforce permissions, mature for rich text. Cons: transform functions are tricky to get right for rich text (tables, formatting), requires a server for ordering, offline for long periods means large rebases.
- **CRDTs (Conflict-free Replicated Data Types):**
  - Each character (or run) gets a **unique, immutable id** (site id + counter) and is positioned **relative to neighbours' ids**, not by index. Deletes leave **tombstones**. Any replica that has received the same set of operations computes the same document, regardless of order (commutative, idempotent merges). Sequence CRDTs: RGA, YATA (used by Yjs), Fugue; Automerge for JSON documents.
  - Pros: no central ordering needed, works peer-to-peer and offline for long periods, simpler server (relay and store). Cons: metadata overhead (ids, tombstones; mitigated by run-length encoding and garbage collection), harder server-side validation and permission enforcement (clients produce valid ops anyway), rich-text semantics (formatting spans, interleaving) need care.
  - **Choice:** Google-scale, server-authoritative, permission-heavy product: OT with central server (what Google does). Offline-first, local-first or peer-to-peer: CRDT (Yjs/Automerge). Many modern products use Yjs with a server relay and persistence. Either can work; justify by offline needs, server control and team expertise.
- **Client architecture:**
  ```
  Editor view (contenteditable via ProseMirror/Lexical) ⇄ Document model
          │ local ops (applied immediately)          ▲ remote ops (transformed / merged)
          ▼                                          │
  Collaboration client: pending queue, revision, rebase/merge, undo manager (local-only)
          │ WebSocket                                ▲
          ▼                                          │
  Doc service: order/merge ops, persist op log + snapshots, broadcast, presence
  ```
  - **Local-first**: apply your own edits instantly; never wait for the server.
  - **Selection/cursor mapping**: remote ops shift positions; map your cursor through each incoming op (OT) or store cursors as relative positions (CRDT).
  - **Undo**: local-only (undo my changes), implemented by inverting my ops and transforming them against later remote ops.
- **Protocol:** connect with doc id and last known revision; server sends missing ops (or a snapshot plus ops); client sends ops tagged with the base revision; server acks with the new revision; broadcast to others. Presence (cursor positions, selection, user colour) on a separate, lossy, ephemeral channel at ~10 to 20 updates/sec max.
- **Persistence and history:** op log plus periodic snapshots (every N ops) for fast loading; version history = named or automatic snapshots; restore = apply a new operation that changes the document to the old state (never rewrite history).
- **Comments and suggestions:** comments anchored to ranges that move with edits (positions transformed through ops, or CRDT relative positions); stored separately from content; suggestions are operations marked as "proposed" (rendered as insertions/deletions with author colours) that become real on accept.
- **Offline:** keep the document and pending ops in IndexedDB; on reconnect, send pending ops (OT: rebase against everything missed; CRDT: just merge); show "Offline, changes saved on this device" status.
- **Permissions:** enforced on the server for every op; if downgraded mid-session (edit → view), the server rejects ops, the client switches to read-only and discards or offers to copy pending changes.
- **Performance:** incremental rendering (only changed blocks/paragraphs), pagination layout computed off main thread or incrementally, virtualize offscreen pages for very long docs, lazy-load images, batch ops (coalesce keystrokes into one op every ~50 to 100ms).

#### Model answer
"I'll scope it, sketch the architecture, then spend most of the time on the core problem: merging concurrent edits.

**Requirements.** Rich-text editing with real-time co-editing, remote cursors and presence, comments and suggestions, version history, offline editing, view/comment/edit permissions, and long documents. Dozens of simultaneous editors, many more viewers.

**Editing model.** The document is a structured model, and every change is an operation: insert text at a position with attributes, delete a range, apply formatting. The editor, built on something like ProseMirror, renders the model and turns user input into operations. Crucially, local operations are applied immediately, so typing never waits for the network.

**The core problem.** Say the document is 'abc'. Alice inserts 'X' at position 1, giving 'aXbc'. At the same time Bob deletes position 2, the 'c'. If Alice's client applies Bob's delete as is, it deletes position 2 of 'aXbc', which is 'b'. Wrong. There are two families of solutions.

**Operational Transformation.** Concurrent operations are transformed against each other to preserve intent: Bob's delete at 2, transformed against Alice's insert at 1, becomes delete at 3. Google Docs uses OT with a central server that gives every operation a revision number, a single total order. Each client tracks the last revision it's seen, has at most one operation in flight to the server, and buffers further local operations. When a remote operation arrives, the client transforms it against its in-flight and buffered operations before applying it, and transforms its own pending operations too. When the server acknowledges, the in-flight operation is done and the next buffered one is sent. OT's strengths: operations are compact, and the server sees and orders everything, so it can validate and enforce permissions. The weakness is that transformation functions for rich text, with tables and overlapping formatting, are notoriously hard to get right, and you need the server for ordering.

**CRDTs.** Instead of positions, every character gets a unique id, like site id plus a counter, and an insert says 'put this after character id X'. Deletes mark characters as tombstones rather than removing them. Because operations reference ids, not indexes, they can be applied in any order and every replica converges to the same document; that's the 'conflict-free' part. Yjs uses an algorithm called YATA; Automerge handles JSON-like documents. Strengths: no central ordering, so offline for days or even peer-to-peer works naturally, and the server is mostly a relay and store. Weaknesses: metadata overhead, though run-length encoding and garbage collection keep it manageable, and server-side validation is harder because clients produce valid operations independently.

**My choice.** For a Google-scale product where the server must control permissions and content, and users are mostly online, I'd choose OT with a central server, as Google does. If offline-first editing or peer-to-peer were key requirements, I'd choose a CRDT like Yjs with a server for persistence and authorisation. Many newer products use Yjs plus a server, and that's a defensible choice too.

**Protocol.** On open, the client sends the document id and its last known revision; the server responds with a snapshot plus later operations. Clients send operations tagged with the revision they're based on; the server transforms, assigns the next revision, acknowledges, and broadcasts. Presence, meaning cursors and selections, travels on a separate lossy channel, throttled to maybe 10 updates a second, never persisted. Remote cursors are mapped through incoming operations so they stay in the right place.

**Persistence and history.** The server stores the operation log and snapshots every few hundred operations, so loading doesn't replay everything. Version history is a list of snapshots, and restoring a version creates a new operation that changes the document back, so history is never rewritten and collaborators simply see the change.

**Comments and suggestions.** Comments are stored separately from content, anchored to a range that moves as text is edited: positions are transformed through operations, or with a CRDT, anchored to character ids. Suggestion mode records operations as proposals with an author, rendered as coloured insertions and strikethroughs, and accepting turns them into normal operations.

**Offline.** The document and pending operations are saved in IndexedDB, and the UI shows that changes are saved on this device. On reconnect, OT rebases the pending operations against everything missed; with a CRDT, it's a merge.

**Permissions.** The server checks every operation. If someone is downgraded to viewer mid-session, their operations are rejected, the editor becomes read-only, and we offer to copy their unsent changes.

**Performance.** Keystrokes are coalesced into operations every 50 to 100 milliseconds, rendering is incremental per paragraph, page layout is computed incrementally, and very long documents virtualize offscreen pages."

#### Another worked example
**The OT client state machine (Jupiter model) in detail.**
```
State: revision r, inflight: Op | null, buffer: Op | null

Local edit e:
  if inflight == null: send(e, base=r); inflight = e
  else: buffer = compose(buffer, e)

Server ack:
  r++ ; inflight = buffer ; buffer = null ; if inflight: send(inflight, base=r)

Remote op o (from another client, revision r+1):
  [o', inflight'] = transform(o, inflight)      // o' applies after inflight
  [o'', buffer']  = transform(o', buffer)
  apply(o'') to local doc ; inflight = inflight' ; buffer = buffer' ; r++
```
Because only one operation is in flight at a time, the server only needs to transform an incoming op against ops the client hasn't seen, which keeps server logic simple. Composing the buffer keeps message counts low during fast typing.

#### A third worked example
**How a CRDT resolves the same conflict.**
```
"abc" with ids: a=(A,1) b=(A,2) c=(A,3)
Alice: insert X after (A,1) → id (Alice,1)
Bob:   delete (A,3)        → tombstone c
Merged on every replica, in any order: a X b [c†]  → visible "aXb"
Concurrent inserts at the same spot (Alice "X", Bob "Y", both after a):
  tie broken deterministically (e.g. by site id), so every replica shows "aXYbc" or "aYXbc" consistently.
```
Interleaving anomalies (two people typing words at the same place getting characters mixed) are what algorithms like YATA and Fugue are designed to avoid, by keeping runs from the same author together.

#### Step-by-step framework
1. **Requirements**: editing, collaboration scale, comments, history, offline, permissions, size.
2. **Editing model**: structured document, operations, local-first application.
3. **Explain the conflict** with a concrete example.
4. **OT**: transformation, central ordering, client in-flight/buffer model; pros and cons.
5. **CRDT**: ids, relative positions, tombstones, convergence; pros and cons.
6. **Choose and justify**; then the protocol (revisions, acks, snapshots, presence channel).
7. **Features**: cursors, comments anchoring, suggestions, history, offline, permissions.
8. **Performance and testing**: coalescing, incremental rendering, fuzz/property tests for convergence.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Use WebSockets and last write wins" | Explains why naive merging corrupts text, with an example |
| Name-drops OT and CRDT | Explains transform functions and id-based positioning concretely |
| Waits for server before showing edits | Local-first with in-flight/buffer queues |
| Comments stored as character offsets | Anchors transformed through ops or tied to CRDT ids |
| Version restore rewrites history | Restore as a new operation; snapshots + op log |
| No permission story | Server validates every op; handles downgrade mid-session |

#### Useful phrases
- "Positions change under you; OT fixes positions, CRDTs avoid them."
- "One op in flight, the rest buffered: that's what makes the OT server simple."
- "Your own edits are applied instantly; the network only decides how others' edits fit around them."
- "Presence is lossy and ephemeral; content operations are durable and ordered."

#### Common pitfalls
- **Last-write-wins** at document or paragraph level for text.
- Sending **full documents** instead of operations.
- **Undo that reverts collaborators' work**.
- **Cursor jumps** because remote ops aren't mapped through local selection.
- Ignoring **tombstone growth** in CRDTs.
- Treating presence updates like durable operations (expensive and unnecessary).

#### Follow-ups to expect (with sample answers)
- **"How do you test convergence?"** — "Randomised fuzz tests: simulate several clients generating random concurrent operations with random network delays and reorderings, then assert all replicas end up identical and match a reference model. This catches transform bugs that unit tests miss."
- **"How many concurrent editors can this support?"** — "Operation volume grows with editors; the server batches broadcasts, presence is throttled and limited (show only nearby cursors or the first N), and beyond a limit, extra users join as viewers. Google Docs caps simultaneous editors around 100."
- **"How do you handle a 300-page document?"** — "Load a snapshot and render incrementally, virtualize pages, compute layout lazily, split the document model into chunks so operations touch small structures, and lazy-load images."
- **"What happens if the server is down?"** — "Edits continue locally and are stored in IndexedDB; the UI shows the offline state; on recovery, pending ops are sent and rebased or merged."
- **"How does suggestion mode interact with collaboration?"** — "Suggestions are ordinary operations with a 'suggested' attribute and author; transformations apply to them like any other op, and accept/reject are operations too."

#### What senior interviewers look for
- **Genuine understanding of OT and CRDTs**, with concrete examples and trade-offs.
- **Correct client-side queueing and rebasing** model.
- **Product completeness**: comments, suggestions, history, permissions, offline.
- **Testing and scaling** awareness for a correctness-critical system.

#### Practise it
- Explain the conflict example and both solutions in 5 minutes, without notes.
- Build a tiny collaborative textarea with Yjs and a WebSocket provider; then read the Jupiter OT client algorithm and implement transform for plain-text insert/delete.
- Checklist: requirements · document model and ops · local-first · conflict example · OT transform + central order + inflight/buffer · CRDT ids + tombstones · choice justified · protocol with revisions/snapshots · presence channel · cursor mapping · comments anchoring · suggestions · history as new ops · offline · permissions · performance · fuzz testing.

#### Variations you might be asked
- "Design a collaborative code editor (like VS Code Live Share)."
- "Design a shared to-do list that works offline."
- "Explain how Figma's multiplayer differs from Google Docs."

## Design a news feed (Twitter/LinkedIn)
- id: 764ae3a4-09e7-4660-9f06-6d8ae3e4a6bf
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, feed, realtime
- companies: Meta, LinkedIn

### Prompt
Design the frontend of a social news feed like Twitter/X or LinkedIn. Users see a personalised, infinitely scrolling feed of posts (text, images, video, links), can like, comment and share, compose new posts, and see new content arrive. Cover rendering strategy, data fetching and caching, real-time updates, performance, accessibility and analytics.

### Answer
#### What the interviewer is really testing
- **Rendering strategy** for a high-traffic page: SSR/streaming for first load, client navigation after, hydration cost.
- **Feed data architecture**: cursor pagination, normalised cache (posts, users), optimistic interactions, keeping counts consistent across views.
- **Infinite scroll at scale**: virtualization, media handling, memory, scroll restoration.
- **Real-time updates** without disrupting reading: "new posts" pill, live counts, polling vs push.
- **Performance budgets** (Core Web Vitals on mid-range phones), **accessibility** of an endless feed, and **impression analytics**.

#### Key points
- **Requirements:** home feed (ranked, personalised); post types (text, images, video, link previews, polls, reposts); interactions (like, comment, repost, share, bookmark); compose with media upload; new posts indicator; post detail with comments; profile feeds; works on low-end mobile and slow networks; accessible; tracks impressions for ranking and ads.
- **Architecture:**
  ```
  Server (SSR/streaming) → HTML shell + first page of feed (data embedded)
  Client:
    Router ─ FeedPage ─ VirtualizedFeed ─ PostCard (memoized, type-specific renderers)
                    └ NewPostsPill            └ MediaGallery / VideoPlayer / LinkPreview
    Data layer: normalised cache { posts, users, feeds: { home: [ids], cursors } }
                (TanStack Query / Relay / Apollo), mutations with optimistic updates
    Realtime: polling or SSE for "new posts count" + live interaction counts (visible posts only)
    Analytics: impression tracker (IntersectionObserver ≥ 50% for ≥ 1s), batched beacons
  ```
- **Rendering:**
  - **SSR (or streaming SSR)** the shell and first ~10 posts for fast LCP and to work before JS; hydrate progressively (islands/selective hydration) so the first interaction isn't blocked.
  - Subsequent pages are client-fetched JSON.
  - Code-split heavy features (composer, video player, emoji picker) and load on interaction.
- **Data model:** `Post { id, author: userId, createdAt, type, text, entities (mentions, links, hashtags), media[], counts { likes, comments, reposts }, viewerState { liked, reposted, bookmarked } }`, `User { id, name, handle, avatar, verified }`. Feeds are lists of post ids with a cursor. Normalisation means liking a post updates it in the home feed, profile and detail views at once.
- **API:** `GET /feed/home?cursor=&limit=20` returns posts + users (dedup authors) + `nextCursor`; GraphQL fits well (fragments per post type, single round trip). Mutations: `POST /posts/:id/like` with optimistic UI. `GET /feed/home/new?since=<topPostId>` returns a count or posts.
- **Infinite scroll:** IntersectionObserver sentinel with generous rootMargin; cursor pagination (stable under inserts); virtualization with variable heights for long sessions (or `content-visibility: auto` as a lighter option); keep loaded pages in cache for back navigation and restore scroll position.
- **New content:** don't insert above the reader; poll every 30 to 60s (or SSE) for a count and show a "Show 12 new posts" pill; clicking prepends and scrolls to top. Live like counts updated only for visible posts (subscribe/unsubscribe by visibility) to limit traffic.
- **Media:** responsive images with width/height (no CLS), lazy loading below the fold, blurhash placeholders, video autoplay muted only when visible (IntersectionObserver) and paused when scrolled away, HLS for longer videos, respect data saver (`navigator.connection.saveData`) and reduced motion.
- **Optimistic interactions:** like toggles instantly with count change; rollback on failure; debounce rapid toggles (send final state); comments appear immediately as pending.
- **Composer:** draft persisted locally; media uploads start immediately in background; post appears at top of the feed optimistically; character counter that counts graphemes (emoji) and URLs consistently with the server.
- **Performance budgets:** LCP < 2.5s and INP < 200ms on mid-range Android over 4G; JS budget for the feed route (e.g. < 200KB compressed); memoized post cards; avoid layout thrash; long tasks split (`scheduler.yield`, `requestIdleCallback`).
- **Accessibility:** `role="feed"` with `article`s and `aria-posinset`/`aria-setsize`, `aria-busy` while loading; keyboard shortcuts (j/k to move between posts, l to like) with a help dialog; skip link past the feed; alt text for images (prompt authors to add it); captions for video; "Load more" fallback.
- **Analytics:** impressions logged when a post is ≥ 50% visible for ≥ 1s, batched and sent with `navigator.sendBeacon` on page hide; used for ranking and ad billing, so must be accurate and de-duplicated.
- **Security and safety:** render user text with entity parsing (no HTML), link previews fetched server-side, sanitise; content warnings/blur for sensitive media; rate limits on actions.

#### Model answer
"I'll scope, then cover rendering, data, infinite scrolling, real-time, media and performance.

**Requirements.** A personalised home feed of posts: text, images, video, link previews and reposts. Users like, comment, repost and bookmark, compose posts with media, and see when new posts are available. It must be fast on mid-range phones, accessible, and accurately record impressions, because they drive ranking and ad revenue.

**Rendering strategy.** The first load is server-rendered, ideally streamed: the shell and first ten or so posts arrive as HTML with their data embedded, so the largest contentful paint happens before JavaScript runs. Hydration is the expensive part on low-end phones, so I'd use selective or progressive hydration and code-split heavy features: the composer, video player and emoji picker load on demand. After that, the client fetches subsequent pages as JSON.

**Data layer.** I'd use a normalised cache, with something like Relay, Apollo or TanStack Query plus normalisation, where posts and users are stored by id and the feed is a list of post ids with a cursor. Normalisation matters because the same post appears in many places: the home feed, a profile, a detail page, search results. Liking it once should update it everywhere. The feed endpoint returns posts plus their authors, de-duplicated, and a next cursor. GraphQL fits well: each post type has a fragment, and the feed needs one round trip.

**Infinite scroll.** Pages load via an IntersectionObserver sentinel with a large root margin, so the next page is ready before the user reaches the end. Cursor pagination stays stable even though new posts are constantly being added. For long sessions, the DOM would grow huge, so I'd virtualize with variable heights, or start with `content-visibility: auto` on post cards, which is cheaper to implement. When the user opens a post and comes back, the cached pages render immediately and the scroll position is restored.

**New content.** I'd never insert new posts above what someone is reading. Instead, every 30 to 60 seconds, or via server-sent events, the client asks how many new posts there are and shows a 'Show 12 new posts' pill; clicking it prepends them and scrolls to the top. Live like counts are updated only for posts currently on screen, subscribing and unsubscribing based on visibility, to keep traffic low.

**Interactions.** Likes, reposts and bookmarks are optimistic: the UI changes immediately, and we roll back with a small error if the request fails. Rapid toggling is debounced so only the final state is sent. The composer saves drafts locally and starts uploading media as soon as it's attached, so posting is instant; the new post appears at the top of the feed optimistically.

**Media.** Images have explicit dimensions to avoid layout shift, load lazily below the fold, with blurred placeholders. Videos autoplay muted only when mostly visible and pause when scrolled away; longer videos use adaptive streaming. We respect data-saver settings and reduced motion.

**Performance.** Budgets: LCP under 2.5 seconds and INP under 200 milliseconds on a mid-range Android phone on 4G, plus a JavaScript budget for the feed route. Post cards are memoized and type-specific renderers are lazy-loaded for rare types like polls. Long tasks are split up so scrolling stays smooth.

**Accessibility.** The feed uses `role='feed'` with articles, position and size attributes, and `aria-busy` while loading. Keyboard shortcuts like J and K to move between posts are documented in a help dialog. There's a skip link past the feed, so keyboard users can reach the footer and sidebar, images have alt text, and videos have captions.

**Analytics.** Impressions are recorded when a post is at least half visible for at least a second, batched, and sent with `sendBeacon` when the page is hidden, so we don't lose them on navigation. Accuracy matters because ranking and ad billing depend on it."

#### Another worked example
**LinkedIn (B2B, professional) versus Twitter/X (B2C, real-time).**
- **LinkedIn:** slower-moving feed, longer posts with "see more" truncation, documents/carousels as post types, heavy SEO for public posts (server rendering crucial), "who viewed" and professional analytics, users often on desktop during work hours; new posts are less urgent, so polling every few minutes is fine.
- **Twitter/X:** fast-moving, real-time events (sports, news), "Show new posts" is central, threads and quote posts, very high write volume, live counts are part of the experience, heavier emphasis on mobile and low latency.
Same architecture; different tuning of freshness, truncation, SEO and post types.

#### A third worked example
**Impression tracking implementation sketch.**
```ts
const seen = new Set<string>();
const timers = new Map<string, number>();
const queue: Impression[] = [];
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const id = (e.target as HTMLElement).dataset.postId!;
    if (e.intersectionRatio >= 0.5 && !seen.has(id)) {
      timers.set(id, window.setTimeout(() => { seen.add(id); queue.push({ id, at: Date.now(), position: Number((e.target as HTMLElement).dataset.pos) }); }, 1000));
    } else {
      clearTimeout(timers.get(id)); timers.delete(id);
    }
  }
}, { threshold: [0, 0.5] });
const flush = () => { if (queue.length) navigator.sendBeacon('/analytics/impressions', JSON.stringify(queue.splice(0))); };
setInterval(flush, 10000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
```
De-duplicate per session, include feed position (for ranking models), and pause timers when the tab is hidden.

#### Step-by-step framework
1. **Requirements**: post types, interactions, freshness, devices, analytics.
2. **Rendering**: streaming SSR for first page, progressive hydration, code splitting.
3. **Data**: normalised cache, feed as ids with cursors, GraphQL/REST shape.
4. **Infinite scroll**: sentinel, cursor, virtualization or content-visibility, scroll restoration.
5. **Real-time**: new posts pill, visible-only live counts, polling vs SSE.
6. **Interactions and composer**: optimistic updates, drafts, background uploads.
7. **Media and performance**: dimensions, lazy loading, video visibility, budgets.
8. **Accessibility, analytics, safety**: feed semantics, shortcuts, impressions, sanitisation.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Client-only rendering with a spinner | Streaming SSR first page, progressive hydration |
| Feed stored as nested post objects per page | Normalised posts/users; feeds as id lists |
| Inserts new posts at the top while reading | "Show new posts" pill |
| Live counts for every loaded post | Live updates only for visible posts |
| Videos autoplay everywhere | Visible-only muted autoplay, data saver, reduced motion |
| No mention of impressions | Accurate, batched impression tracking with sendBeacon |

#### Useful phrases
- "The same post lives in many views, so it lives once in the cache."
- "Never move content under someone who's reading."
- "Subscribe to what's on screen, not to everything loaded."
- "Impressions are revenue data, so they need to be accurate and not lost on navigation."

#### Common pitfalls
- **Offset pagination** in a constantly changing feed (duplicates and gaps).
- **Hydrating the whole page** before anything is interactive on low-end devices.
- **Unbounded DOM growth** in long sessions.
- **Layout shift** from images and embeds.
- **Losing scroll position** on back navigation.
- **Impressions counted on render**, not on real visibility.

#### Follow-ups to expect (with sample answers)
- **"How is the feed ranked, and what does the frontend do?"** — "Ranking is server-side. The frontend's role is to send accurate signals (impressions, dwell time, interactions, hides) and to render the ranked list without reordering it locally."
- **"How do you handle deleted or hidden posts?"** — "Events or the next fetch mark posts as removed in the cache; the card collapses into a 'This post is unavailable' placeholder rather than vanishing, to avoid shifting the feed."
- **"How would you add ads?"** — "Ads are feed items of a special type returned by the server at positions it decides; they use the same card framework, with stricter impression and viewability tracking and clear labelling."
- **"How do you test performance regressions?"** — "Lighthouse CI on key routes with budgets, synthetic tests on throttled mid-range devices, and real-user monitoring of LCP/INP/CLS segmented by device class."
- **"How would offline work?"** — "Cache the last feed in IndexedDB via a service worker for instant reopen; queue likes and comments; show an offline banner and a 'last updated' time."

#### What senior interviewers look for
- **Rendering and hydration strategy** tied to performance budgets.
- **Normalised data and optimistic UX** done right.
- **Respect for the reader** in real-time updates and scrolling.
- **Analytics accuracy, accessibility and safety** included naturally.

#### Practise it
- Present this design in 40 minutes with the architecture diagram.
- Prototype a feed with cursor pagination, a new-posts pill and impression tracking.
- Checklist: requirements · streaming SSR · progressive hydration · code splitting · normalised cache · cursor pagination · virtualization/content-visibility · scroll restoration · new posts pill · visible-only live counts · optimistic interactions · composer drafts and uploads · media strategy · budgets · feed a11y · impressions · safety.

#### Variations you might be asked
- "Design Instagram's home feed."
- "Design Reddit's front page with voting."
- "Design the notifications page for a social network."

## Design Figma (collaborative design tool)
- id: a6e4a5aa-3191-40a8-bbd1-10345ce2cf64
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, canvas, CRDT, graphics
- companies: Figma, Anthropic

### Prompt
Design the frontend of a collaborative design tool like Figma. Users draw and edit shapes, text and images on an infinite canvas, zoom and pan smoothly with thousands of objects, and see collaborators' cursors and changes live ("multiplayer"). Cover the document model, rendering, hit testing, the multiplayer sync model, undo/redo, performance and offline.

### Answer
#### What the interviewer is really testing
- Knowing that **DOM/SVG won't scale** for this and reasoning about **Canvas 2D vs WebGL/WebGPU** (and WebAssembly for the engine).
- A **scene graph document model** with properties per node, suitable for syncing at property granularity.
- **Rendering pipeline**: camera transforms, culling, dirty regions, tiling/caching, text rendering, 60fps interactions.
- **Interaction engineering**: hit testing with spatial indexes, selection, snapping, transforms, keyboard shortcuts.
- **Multiplayer**: Figma's model of server-authoritative, property-level last-writer-wins (CRDT-inspired), fractional indexing for ordering, presence, and why it's simpler than text OT.
- **Undo/redo in multiplayer**, performance budgets and memory.

#### Key points
- **Requirements:** infinite canvas with pages; shapes (rectangles, ellipses, vectors/paths), frames (with auto layout), text, images, components/instances; select, move, resize, rotate, group; zoom 1% to 25,600% and pan at 60fps with 10,000+ nodes; multiplayer editing with cursors; comments; undo/redo; version history; offline tolerance; plugins.
- **Document model (scene graph):**
  ```
  Document → Page → nodes (tree)
  Node { id, type: FRAME|RECT|ELLIPSE|VECTOR|TEXT|IMAGE|GROUP|INSTANCE,
         parentId, index (fractional), props: { x, y, w, h, rotation, fills[], strokes[],
         effects[], opacity, constraints, text?, componentId? } }
  Stored as a flat map id → node; children ordered by fractional index.
  ```
  - Property-level granularity: `(nodeId, property) → value` is the unit of change and conflict resolution.
- **Rendering:**
  - **DOM/SVG** collapses beyond a few thousand elements (layout/style costs, no control over draw order and caching).
  - **Canvas 2D**: simpler, decent for moderate scenes; CPU-bound at scale.
  - **WebGL/WebGPU**: GPU-accelerated, what Figma uses (custom renderer, C++ compiled to WebAssembly). Best for many objects, effects (blur, shadows), smooth zoom.
  - Pipeline: camera (pan/zoom matrix) → **viewport culling** (spatial index query) → draw visible nodes in z-order → overlays (selection handles, guides, cursors) on a separate layer.
  - **Caching**: rasterise complex/static subtrees into textures (tiles) at the current zoom; re-rasterise when zoom changes significantly; show the scaled cache while re-rendering for smoothness. **Dirty rectangles**: redraw only changed regions.
  - **Text**: font loading, shaping (HarfBuzz-like in WASM), glyph atlases; consistent rendering across platforms matters to designers.
  - UI chrome (toolbars, properties panel, layers panel) in React/DOM, outside the canvas.
- **Hit testing:** spatial index (R-tree or quadtree) of node bounding boxes in world coordinates → candidate list for a pointer position → precise test (path contains point, accounting for rotation/stroke) from top-most down. Also used for marquee selection and snapping. Alternative: GPU picking (render ids to an offscreen buffer).
- **Interactions:** pointer events with capture; transforms applied to a temporary "preview" state during drag (rendered at 60fps) and committed as one change on pointer up; snapping to other objects' edges/centres via the spatial index; keyboard shortcuts; precise numeric editing in the properties panel.
- **Multiplayer (Figma's approach):**
  - Server-authoritative relay per document; clients send property changes; server applies and broadcasts.
  - **Conflict resolution: last-writer-wins per property** (server order decides). Two people changing the same rectangle's colour: last one wins; one changes colour and another moves it: both apply (different properties). Simpler than OT because design edits are mostly property assignments, not text insertions.
  - **Ordering children**: fractional indexes (between "a" and "b" insert "an"), so concurrent reorders don't conflict.
  - **Tree changes**: reparenting validated server-side to prevent cycles; deletes win over concurrent edits to deleted nodes.
  - **Local-first**: apply locally, send; ignore incoming server values for properties with unacknowledged local changes (so your own edits don't flicker back), then accept server state after ack.
  - **Text inside a text node**: needs a sequence CRDT/OT if co-editing the same text box is supported (or lock the text box while someone is typing).
  - **Presence**: cursor positions, selections, viewport (for "follow" mode) on a lossy channel, interpolated smoothly on the receiving side.
- **Undo/redo:** local, per user; undoing an action restores the properties you changed to their previous values (if they haven't been changed since by others, or apply anyway with clear rules); grouped by gesture (one drag = one undo step).
- **Performance budgets:** 16ms per frame for pan/zoom/drag; document load in seconds for large files (stream pages; load the current page first); memory caps (images downsampled to needed resolution, texture eviction).
- **Offline:** queue local changes, keep editing, reconcile on reconnect via the same LWW rules; persistent cache of recent files in IndexedDB.
- **Plugins:** run in a sandbox (iframe/realm with a limited API) so third-party code can't freeze the main thread or access user data improperly.

#### Model answer
"I'll scope it, then cover the document model, rendering, interaction, and multiplayer, which is where the interesting trade-offs are.

**Requirements.** An infinite canvas with pages; shapes, vector paths, frames, text, images, and reusable components; selecting, moving, resizing, rotating and grouping; smooth pan and zoom with tens of thousands of objects; real-time multiplayer with cursors; comments; undo and redo; version history; and plugins.

**Document model.** A scene graph: a document has pages, and each page is a tree of nodes, stored as a flat map from id to node. Each node has a type, a parent id, a fractional index for ordering among siblings, and a bag of properties: position, size, rotation, fills, strokes, effects, text content, component references. The key design choice is that the unit of change is a single property of a single node, which makes syncing and conflict resolution simple, as we'll see.

**Rendering.** DOM or SVG won't work at this scale: thousands of elements make style and layout expensive, and we need full control of drawing and caching. Canvas 2D is an option for smaller tools, but for Figma's scale, WebGL, or now WebGPU, renders on the GPU. Figma famously wrote its engine in C++ compiled to WebAssembly. The pipeline: a camera matrix for pan and zoom; viewport culling using a spatial index, so we only draw nodes that are on screen; draw visible nodes in z-order; then an overlay layer for selection handles, guides and collaborators' cursors. Complex subtrees are cached as textures at the current zoom, so panning just moves textures; when zoom changes a lot, we show the scaled cache immediately and re-rasterise at the new resolution in the background. Text needs proper font loading and shaping, and consistent rendering across platforms, which designers care about. The toolbars, layers panel and properties panel are normal React and DOM around the canvas.

**Hit testing and interactions.** To know what's under the pointer, I query a spatial index, an R-tree or quadtree of bounding boxes in world coordinates, for candidates, then do precise tests from the top-most node down, accounting for rotation and actual path shape. The same index powers marquee selection and snapping to other objects' edges. During a drag, the transform is applied to a preview state at 60 frames per second, and committed as one change on pointer up, which also gives one undo step per gesture.

**Multiplayer.** This is where Figma made a clever simplification. Unlike text editing, design edits are mostly property assignments: set this rectangle's x, set this fill. So the server is authoritative and resolves conflicts with last-writer-wins per property. If two people change the same rectangle's colour, the last change the server receives wins. If one changes its colour and another moves it, both changes apply, because they're different properties. That avoids the complexity of operational transformation. Ordering children uses fractional indexes, so two people reordering layers don't conflict; inserting between 'a' and 'b' creates 'an'. Structural changes like reparenting are validated by the server to prevent cycles, and deleting a node wins over concurrent edits to it.

On the client, edits are applied locally first and sent to the server. While a local change to a property is unacknowledged, incoming server values for that property are ignored, so your own edit doesn't flicker back to the old value; after the acknowledgement, the server's state is the truth. Text inside a single text box is the exception: if co-editing the same text is supported, it needs a sequence CRDT or OT, or the box is effectively locked while someone types.

Presence, meaning cursors, selections and viewports for 'follow' mode, goes over a lossy channel at a limited rate and is interpolated smoothly on the receiving side so cursors don't jitter.

**Undo.** Undo is per user: it restores the properties that I changed in that step to their previous values. Each gesture is one step.

**Performance and memory.** Budgets: 16 milliseconds per frame during pan, zoom and drag. Large files load the current page first and stream the rest. Images are decoded at the resolution needed for the current zoom, and textures are evicted when memory gets tight.

**Offline and plugins.** Offline, changes queue locally and reconcile with the same last-writer-wins rules on reconnect. Plugins run sandboxed with a limited API, so third-party code can't freeze the editor or access data it shouldn't."

#### Another worked example
**Conflict scenarios under property-level LWW.**
```
Rect R: { x: 0, fill: blue }
Alice sets R.fill = red      Bob sets R.x = 100        → both apply: { x: 100, fill: red }
Alice sets R.fill = red      Bob sets R.fill = green   → server order decides; last wins
Alice deletes R              Bob sets R.x = 100        → delete wins; Bob's change dropped
Alice moves R into Frame F   Bob moves F into Group G (inside R?) → server rejects the cycle-creating change
Alice drags R (unacked)      server broadcasts Bob's R.x = 50 → Alice's client ignores it until her change is acked
```
Being able to walk through these shows you understand why this model is "good enough" for design tools, and where it isn't (text).

#### A third worked example
**A whiteboard product (B2C, simpler) versus Figma (B2B pro tool).**
- **Whiteboard (Miro/Excalidraw-like):** fewer node types, hand-drawn shapes, sticky notes; Canvas 2D is often enough; CRDT (Yjs) for sync works well because offline and peer-to-peer are attractive and objects are simple; precision rendering matters less.
- **Figma:** precision geometry, components and variants, auto layout computations, prototyping, developer handoff; heavy GPU rendering and WASM; server-authoritative sync for permissions, branching and enterprise auditing.
The choice of rendering technology and sync model follows from object complexity, precision requirements and enterprise needs.

#### Step-by-step framework
1. **Requirements**: object types, scale, multiplayer, history, plugins, offline.
2. **Document model**: scene graph, flat map, property bags, fractional ordering.
3. **Rendering choice**: DOM vs Canvas vs WebGL/WebGPU (+WASM), with reasons.
4. **Rendering pipeline**: camera, culling, z-order drawing, overlays, texture caching, text.
5. **Hit testing and interactions**: spatial index, precise tests, preview state, snapping.
6. **Multiplayer**: server-authoritative, property-level LWW, fractional indexes, tree validation, local-first acks, text exception, presence.
7. **Undo/redo** per user, per gesture.
8. **Performance, memory, offline, plugins**: budgets, streaming load, texture eviction, sandboxing.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Each shape is a React component/DOM node | WebGL/WebGPU renderer with culling and caching; React for chrome only |
| Hit testing by looping over all shapes | Spatial index + precise geometric tests |
| "Use OT/CRDT" generically | Property-level LWW with server authority, fractional indexes, text exception |
| Own edits flicker when server echoes | Ignore server values for unacked local properties |
| Undo reverts others' changes | Per-user undo of own property changes, per gesture |
| No performance numbers | 16ms frame budget, streaming page load, memory caps |

#### Useful phrases
- "Design edits are property assignments, so last-writer-wins per property is enough."
- "Only draw what the camera can see."
- "During a drag it's a preview; on pointer up it becomes one change."
- "The canvas is the engine; React is only the chrome around it."

#### Common pitfalls
- **SVG/DOM** for the canvas at scale.
- **Recomputing everything** on every frame instead of culling and caching.
- **Whole-document sync** instead of property-level deltas.
- **Array indexes** for layer order in a multiplayer document.
- **Undo implemented as global history** across users.
- Running **plugins on the main thread** without sandboxing.

#### Follow-ups to expect (with sample answers)
- **"Why WebAssembly?"** — "Predictable performance for heavy computation (geometry, text shaping, layout), memory control, and code sharing with native apps. The JS–WASM boundary is kept coarse to avoid overhead."
- **"How would you implement auto layout?"** — "A layout engine (flexbox-like) that runs when properties of a frame or its children change, computing child positions as derived values; computed positions are not synced as user edits, so collaborators don't conflict over them."
- **"How do components and instances work?"** — "An instance references a main component and stores only overrides. Rendering resolves the component's properties plus overrides. Changes to the main component propagate to instances not overriding those properties."
- **"How do you load a 500MB file?"** — "Load the document structure and current page first, lazily load other pages and image assets, use low-resolution image placeholders, and stream binary-encoded document data rather than JSON."
- **"How do you test the renderer?"** — "Pixel-comparison tests on reference scenes across GPUs/browsers with tolerances, performance benchmarks in CI (frame times for pan/zoom on large files), and fuzzing multiplayer with simulated clients."

#### What senior interviewers look for
- **Correct technology choices** for rendering at scale, with reasons.
- **A sync model matched to the domain** (property-level LWW) and awareness of its limits.
- **Performance engineering** depth: culling, caching, spatial indexes, budgets.
- **Clear separation** of engine, UI chrome, multiplayer and plugins.

#### Practise it
- Present the design in 45 minutes, including the conflict scenarios table.
- Build a canvas prototype: 10,000 rectangles, pan/zoom with culling, quadtree hit testing.
- Checklist: requirements · scene graph · property granularity · rendering tech choice · camera/culling/caching · text · spatial index hit testing · preview vs commit · property LWW · fractional indexes · tree validation · unacked property handling · text exception · presence · per-user undo · budgets · offline · plugin sandbox.

#### Variations you might be asked
- "Design a collaborative whiteboard like Miro."
- "Design a diagramming tool like Lucidchart or draw.io."
- "Design an image editor in the browser (layers, filters)."

## Design Netflix
- id: 31da991e-beec-4329-89db-145a2b024aba
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, streaming, media
- companies: Netflix

### Prompt
Design the frontend of a video streaming service like Netflix for web (and discuss TV devices). Cover the browse experience with personalised rows, the video player with adaptive bitrate streaming, DRM, resuming playback across devices, performance on low-powered devices, and accessibility.

### Answer
#### What the interviewer is really testing
- **Two very different subsystems**: a content-heavy, personalised **browse UI** and a **media playback engine**.
- **Adaptive bitrate streaming** knowledge: HLS/DASH, segments and manifests, Media Source Extensions (MSE), bitrate selection, buffering strategy.
- **DRM** with Encrypted Media Extensions (EME) and CDMs (Widevine, PlayReady, FairPlay), and its constraints.
- **Performance on constrained devices** (smart TVs, set-top boxes): memory, CPU, image weight, spatial (D-pad) navigation.
- **Cross-device state** (continue watching, profiles), **analytics/QoE** metrics, and **accessibility** (subtitles, audio description).

#### Key points
- **Requirements:** profiles; home page with personalised rows (Continue Watching, Trending, Because you watched…); title details with trailers; search; playback with adaptive quality, subtitles and audio tracks, skip intro, next episode autoplay; resume across devices; downloads (mobile); parental controls; works on web, TVs and consoles; fast start and minimal rebuffering.
- **Browse architecture:**
  ```
  App shell (SSR for web/SEO landing; SPA after login)
   ├── HomePage: rows[] from a personalised "page layout" API (row definitions + first N items)
   │     Row (horizontally scrolling, lazy-mounted when near viewport)
   │       TitleCard (artwork chosen per user, lazy images, hover preview)
   ├── TitleDetails (modal or route; trailer autoplay muted)
   ├── Search (debounced, server-side)
   └── Player (code-split, full-screen route)
  Data: GraphQL/Falcor-style graph API; normalised cache of titles; per-profile state
  ```
  - The server decides row order and artwork (personalisation, A/B tests); the client renders a layout description.
  - Lazy-mount rows and lazy-load images (they dominate bytes); prefetch the next row on scroll; preload artwork for the hovered/focused title.
  - Hover/focus preview: after a short delay, start a muted trailer clip; cancel on leave to save bandwidth.
- **Player architecture:**
  ```
  UI controls (React) ↔ Player core (state machine: idle → loading → playing ⇄ buffering ⇄ paused → ended | error)
     ↔ ABR engine (bandwidth + buffer estimates → choose rendition)
     ↔ Streaming engine (fetch manifest, segments; append to MSE SourceBuffers)
     ↔ DRM (EME: requestMediaKeySystemAccess → license request to license server)
     ↔ <video> element
  ```
  - **Streams**: content encoded at multiple bitrates/resolutions (a "ladder"), split into 2 to 6s segments, described by a manifest (DASH MPD or HLS m3u8). Safari can play HLS natively; elsewhere use MSE (libraries: Shaka Player, hls.js, dash.js).
  - **ABR**: choose the next segment's rendition using measured throughput and buffer level (throughput-based, buffer-based like BOLA, or hybrid); start at a conservative bitrate for fast start, then ramp up; avoid oscillation; cap by screen size and device capability.
  - **Buffering**: target buffer (e.g. 30 to 60s ahead), prefetch the first segments of likely next content (next episode), seek handling (flush and refetch).
  - **DRM**: EME with platform CDMs: Widevine (Chrome, Firefox, Android), PlayReady (Edge/Windows, many TVs), FairPlay (Safari/Apple). Higher resolutions (4K) may require hardware-backed DRM, so the client advertises capabilities and the server selects allowed renditions.
  - **Subtitles**: WebVTT/TTML rendered as custom overlays (consistent styling, user-adjustable size and background); audio tracks including audio description.
- **Cross-device state:** playback position heartbeats (every ~10 to 30s and on pause/exit, with `sendBeacon`) to a viewing-history service; "Continue watching" reads it; conflict: last update wins; concurrent stream limits enforced by server.
- **Performance:**
  - Web: fast LCP on landing pages; on home, the first row and hero image prioritised; JS budgets; code-split the player.
  - **TV devices**: limited memory and CPU, old browser engines; small DOM, recycled row items (virtualization in both directions), image sizes matched to tiles, avoid heavy CSS effects, GPU-friendly transforms; Netflix uses its own lightweight UI stack on TVs.
  - **Spatial navigation** on TVs: D-pad focus management (focus engine choosing the nearest focusable item in the pressed direction), remembered focus per row, visible focus states.
- **Quality of Experience (QoE) analytics:** startup time, rebuffering ratio, bitrate switches, average bitrate, errors, dropped frames; logged per session to tune ABR and CDN choices.
- **Accessibility:** subtitles and closed captions with customisation, audio description tracks, keyboard controls (space, arrows, M, F, C), screen reader labels on controls, reduced motion (disable autoplaying previews), sufficient contrast over video.
- **Resilience:** CDN failover (multiple CDN URLs in the manifest or steering), retry segments with backoff, degrade bitrate on errors, clear error messages with codes.

#### Model answer
"I'd split this into two subsystems with very different concerns: the browse experience, which is a personalised, image-heavy UI, and the player, which is a media engine.

**Requirements.** Profiles; a home page of personalised rows; title details with trailers; search; playback with adaptive quality, subtitles, audio tracks, skip intro and next-episode autoplay; resume across devices; parental controls; and it must run on web browsers and on smart TVs with weak hardware.

**Browse.** The home page is driven by the server: a personalised layout API returns which rows to show, in which order, and the first set of titles for each, including which artwork to show this user, because Netflix personalises artwork and runs constant A/B tests. The client renders that description. Each row is a horizontally scrolling list, mounted only when it approaches the viewport. Images are most of the bytes, so they're lazy-loaded at the right size for the tile, with the hero image and first row prioritised. When a user hovers or focuses a title for a moment, we preload its details and start a muted preview clip, cancelling it as soon as they move on to save bandwidth. Data comes from a graph-style API with a normalised title cache. The player is code-split, because browsing users don't need its code.

**Player.** The player has a core state machine: loading, playing, buffering, paused, ended, error, with the UI controls on top. Underneath, content is encoded at several bitrates and resolutions, split into segments of a few seconds, and described by a manifest, DASH or HLS. On most browsers we use Media Source Extensions: our streaming engine fetches segments and appends them to the video element's source buffers. Safari can play HLS natively. In practice I'd build on Shaka Player or hls.js.

**Adaptive bitrate.** Before each segment, the ABR logic picks a rendition based on measured throughput and how much is buffered. We start at a modest bitrate so playback begins quickly, then ramp up; we avoid switching back and forth too often; and we cap resolution to the screen and device capability. The buffer target is something like 30 to 60 seconds ahead. Near the end of an episode, we prefetch the first segments of the next one, so autoplay starts instantly.

**DRM.** Licensed content requires DRM through Encrypted Media Extensions. The browser's content decryption module, Widevine on Chrome and Android, PlayReady on Edge and many TVs, FairPlay on Safari, requests a license from our license server. Higher resolutions like 4K often require hardware-backed DRM, so the client reports its capabilities and the server only offers renditions that device is allowed to play.

**Subtitles and audio.** Subtitles are rendered as our own overlay from WebVTT or TTML, so users can adjust size and background consistently; audio tracks include audio description.

**Cross-device resume.** The player sends position heartbeats every few seconds of playback and on pause or exit, using `sendBeacon` when the page is closing. 'Continue watching' on any device reads from that service. The server also enforces concurrent stream limits per plan.

**TV performance.** TVs have little memory and slow CPUs, so the UI keeps a small DOM, recycles row items, uses images sized exactly for tiles, avoids expensive CSS effects, and animates only transforms. Navigation is with a D-pad, so there's a spatial focus engine that moves focus to the nearest item in the pressed direction, remembers the focused position in each row, and makes focus states very visible.

**Quality metrics.** We log startup time, rebuffering ratio, average bitrate, bitrate switches, dropped frames and errors per session; these drive ABR tuning and CDN decisions.

**Resilience.** If a CDN struggles, the player can switch to an alternative CDN, retry segments with backoff, and drop quality before stalling.

**Accessibility.** Captions with customisation, audio description, full keyboard controls, labelled controls for screen readers, autoplaying previews disabled for reduced motion, and good contrast for controls over video."

#### Another worked example
**ABR decision walk-through.**
```
Ladder: 235 kbps (320p) · 750 (480p) · 1750 (720p) · 3000 (1080p) · 5800 (1080p high) · 16000 (4K)
t=0     buffer 0s,   throughput unknown → start 750 kbps (fast start)
t=4s    buffer 8s,   measured 6 Mbps   → step up to 1750 (don't jump straight to max)
t=12s   buffer 20s,  measured 6.5 Mbps → 3000
t=40s   buffer 45s,  measured 2 Mbps (train enters tunnel) → buffer still healthy: stay at 3000 for now
t=50s   buffer 25s and falling, measured 1.8 Mbps → drop to 1750
t=60s   buffer 10s  → drop to 750 to avoid rebuffering
```
Hybrid ABR uses throughput for quick decisions and buffer level as a safety net. Rebuffering hurts engagement far more than a temporary drop in quality, so the algorithm is biased towards safety.

#### A third worked example
**Web browser versus smart TV.**
- **Web:** keyboard and mouse, hover previews, larger JS budgets, SEO for public title pages, MSE everywhere, picture-in-picture, multiple tabs (enforce one playback).
- **Smart TV (2016 model, old WebKit):** 10-foot UI with large type, D-pad navigation, no hover, strict memory (a few hundred MB), slow JS; preload less, decode fewer images, aggressive recycling, careful with fonts; often a native or highly optimised custom rendering layer; app updates are slow, so server-driven UI configuration matters more.
Explaining this shows you design for the device, not just the browser.

#### Step-by-step framework
1. **Requirements** for browse and playback, and target devices.
2. **Browse architecture**: server-driven layout, rows, lazy mounting, images, previews.
3. **Data layer**: graph API, normalised titles, per-profile state.
4. **Player architecture**: state machine, streaming engine, MSE, manifests.
5. **ABR and buffering** strategy.
6. **DRM** via EME and device capability negotiation.
7. **Cross-device resume**, subtitles/audio, resilience.
8. **Device performance, spatial navigation, QoE analytics, accessibility.**

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Use a video tag with an MP4" | Segmented HLS/DASH via MSE, multiple renditions |
| Fixed quality setting | ABR using throughput and buffer, biased against rebuffering |
| Ignores DRM | EME, CDMs per platform, hardware-backed DRM for 4K |
| Client decides row order | Server-driven personalised layout and artwork |
| Same UI for TV and web | 10-foot UI, spatial navigation, memory-conscious rendering |
| No metrics | QoE metrics: startup, rebuffering, bitrate, errors |

#### Useful phrases
- "Browse is a personalised image grid; playback is a media engine. I'll design them separately."
- "A rebuffer hurts more than a quality drop, so ABR errs towards safety."
- "The server decides rows and artwork; the client renders the layout."
- "On a TV, memory is the budget and the D-pad is the mouse."

#### Common pitfalls
- **Loading all row images** at once.
- **Autoplaying previews everywhere**, wasting bandwidth and annoying users.
- **Oscillating bitrates** from naive throughput-only ABR.
- Forgetting **DRM capability differences** between browsers.
- **Hover-dependent UI** on TV and touch devices.
- **Losing playback position** when the tab closes (no beacon).

#### Follow-ups to expect (with sample answers)
- **"How does seeking work with segments?"** — "Find the segment containing the target time, flush the buffer if needed, fetch from that segment (often at a lower bitrate for speed), and resume. Trick-play thumbnails come from a sprite sheet or image track."
- **"How would offline downloads work?"** — "On native mobile apps with persistent DRM licenses with expiry; on web it's generally not offered due to DRM limitations."
- **"How do you choose which artwork to show?"** — "The server picks per user from candidate images based on personalisation models; the client logs impressions and plays per artwork so the model learns."
- **"How do you prevent multiple simultaneous streams?"** — "The license or playback session service tracks active streams per account; starting a new stream beyond the plan limit returns an error the UI explains."
- **"How do you test streaming quality?"** — "Network emulation (throttling, packet loss) in automated tests, device labs for TVs, and A/B testing ABR algorithms against QoE metrics in production."

#### What senior interviewers look for
- **Media engineering literacy**: MSE, ABR, DRM, manifests.
- **Personalisation-aware UI architecture** with performance discipline.
- **Device diversity** awareness (TVs, spatial navigation).
- **Metrics-driven** thinking (QoE) and resilience.

#### Practise it
- Present the design in 40 minutes, split into browse and playback.
- Play an HLS stream with hls.js, log bitrate switches under throttling in DevTools.
- Checklist: requirements · server-driven layout · lazy rows/images · hover previews with cancel · player state machine · MSE + manifests · ABR + buffer · DRM/EME · subtitles/audio · resume heartbeats · CDN failover · TV performance · spatial navigation · QoE metrics · a11y.

#### Variations you might be asked
- "Design YouTube's video player."
- "Design a live sports streaming page with low latency."
- "Design the TV app home screen for a streaming service."

## Design Amazon (e-commerce PDP + search + cart + checkout)
- id: 0348738d-f16a-489f-b801-116127b37c7a
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, ecommerce, performance
- companies: Amazon, Stripe

### Prompt
Design the frontend of a large e-commerce site like Amazon: search results with filters, product detail pages (PDP), the cart and checkout. Cover rendering strategies per page, SEO, performance, caching, state that spans pages (cart), checkout reliability and payments, experimentation and accessibility.

### Answer
#### What the interviewer is really testing
- Choosing **rendering strategies per page type** (SSG/ISR, SSR, streaming, CSR) based on SEO, freshness and personalisation.
- **Performance as revenue**: Core Web Vitals, image strategy, JavaScript budgets, caching at CDN and client.
- **Search UX architecture**: URL as state for filters, facets, pagination, instant feedback.
- **Cart and checkout reliability**: cross-device cart, optimistic updates, idempotent order submission, payment integrations (PCI scope, 3-D Secure), error handling.
- **Experimentation, analytics, accessibility and internationalisation** at scale.

#### Key points
- **Requirements:** home, search/browse with facets, PDP with variants (size/colour), reviews, recommendations, price and stock, delivery estimate; cart (guest and signed-in, merges on login); checkout (address, delivery option, payment, review, place order); order confirmation; SEO for product and category pages; global (currency, language); fast on mobile; accessible; heavy A/B testing.
- **Rendering strategy by page:**
  | Page | Strategy | Why |
  |---|---|---|
  | PDP | SSR or ISR (static shell + cached product data) with client-fetched price/stock/delivery and personalised widgets streamed or lazy | SEO + speed; dynamic bits can't be cached globally |
  | Search/category | SSR (URL params → results) cached at CDN for common queries; client-side updates on filter change | SEO for categories, shareable URLs |
  | Home | SSR shell + personalised modules streamed/lazy | Personalisation per user |
  | Cart/checkout | CSR or SSR without caching, no SEO | Private, highly dynamic |
- **Architecture:**
  ```
  CDN/edge (HTML caching for anonymous pages, image CDN, edge personalisation/geo)
     │
  Frontend servers (SSR/streaming; composition of page modules / micro-frontends per team)
     │ BFF / GraphQL aggregation
  Services: catalogue, pricing, inventory, search, reviews, recommendations, cart, checkout, payments
  Client: islands/partial hydration; cart store synced with server; analytics + experimentation SDK
  ```
- **PDP:** product data (title, images, description, specs) changes rarely → cache; price, stock and delivery estimate change often and depend on location → fetch separately (or edge-include), never cache wrongly; variant selection updates URL (`?color=blue&size=M`) and images/price without full reload; image gallery with priority hero image (LCP), zoom; reviews and recommendations below the fold, lazy-loaded; structured data (JSON-LD `Product`, `Offer`, `AggregateRating`) for rich search results.
- **Search:** query and filters in the URL (shareable, back button works, SEO for category facets with care: avoid infinite crawlable combinations via canonical URLs and noindex); debounced filter application or explicit "Apply" on mobile; facet counts from the search service; skeletons while loading; preserve scroll when going back from a PDP; autocomplete with suggestions; pagination (SEO-friendly) or load more.
- **Cart:** server-side cart keyed by user (or anonymous cart id cookie), merged on login; optimistic add-to-cart with mini-cart feedback; cart count in header from a lightweight endpoint (not cached in page HTML); sync across tabs (BroadcastChannel or refetch on focus); price/stock revalidated at checkout.
- **Checkout:**
  - Minimal JS, distraction-free layout, guest checkout, address autocomplete, saved payment methods.
  - **Payment**: use the provider's hosted fields/iframes (Stripe Elements, Adyen) so card data never touches our servers (reduced PCI scope); support wallets (Apple Pay, Google Pay via Payment Request API); handle **3-D Secure/SCA** challenges.
  - **Idempotent order submission**: generate an idempotency key per checkout attempt; disable the button and show progress; on timeout, poll order status rather than resubmitting blindly.
  - Validate inline, preserve entered data on errors, clear error recovery (payment declined → choose another method).
  - Security: strict CSP on checkout, no third-party tags, CSRF protection.
- **Performance:** budgets (LCP < 2.5s, INP < 200ms, CLS < 0.1 on mid-range mobile); image CDN with responsive sizes and modern formats; preconnect to critical origins; route-based code splitting; partial hydration (only interactive islands); third-party script governance (tag managers deferred, off checkout); prefetch PDP on hover/viewport in search results; HTTP caching with `stale-while-revalidate`.
- **Experimentation:** server-side assignment (avoid flicker), experiments evaluated at the edge or SSR; feature flags; metrics: conversion, add-to-cart rate, revenue per visitor, Web Vitals guardrails.
- **i18n:** currency and price formatting (`Intl.NumberFormat`), translations, regional catalogues, RTL, local payment methods, tax display rules.
- **Accessibility:** semantic headings and landmarks, accessible filters (checkbox groups, live result count), variant pickers as radio groups, image alt text, form labels and error summaries in checkout, focus management in mini-cart and modals; legal requirements (e.g. European Accessibility Act) apply to e-commerce.

#### Model answer
"I'd design this page by page, because the right rendering strategy differs for search, product pages, cart and checkout, and then cover the cross-cutting concerns: performance, cart state, payments, experiments and accessibility.

**Requirements.** Search and category browsing with filters; product detail pages with variants, images, reviews, recommendations, price, stock and delivery estimates; a cart for guests and signed-in users that merges on login; a reliable checkout; SEO for product and category pages; multiple countries and currencies; fast on mobile; accessible; and constant A/B testing.

**Architecture.** A CDN at the edge caches HTML for anonymous pages and serves images through an image CDN. Frontend servers render pages, often composed of modules owned by different teams. A backend-for-frontend or GraphQL layer aggregates catalogue, pricing, inventory, search, reviews, recommendations, cart and payment services. In the browser, we hydrate only interactive islands rather than the whole page.

**Product page.** The PDP must be fast and indexable, so it's server-rendered or incrementally statically generated. The trick is separating data by how often it changes and whether it's personal. Title, images, description and specs change rarely and can be cached at the edge. Price, stock and delivery estimates change often and depend on the user's location, so they're fetched separately or included at the edge, never baked into a globally cached page. Variant selection updates the URL, like `?color=blue&size=M`, plus images and price, without a full reload. The main image is the LCP element, so it's prioritised. Reviews and recommendations are below the fold and lazy-loaded. Structured data, JSON-LD for product, offer and rating, gives rich search results.

**Search.** The query and filters live in the URL, so results are shareable and the Back button works. Category pages are server-rendered for SEO and cached for common queries; changing filters updates results on the client. Facets come with counts from the search service. On mobile, filters open in a sheet with an Apply button rather than re-running on every tap. Returning from a product page restores the results and scroll position. Search results prefetch product pages when a result comes into view or on hover, so clicks feel instant. I'd be careful that filter combinations don't create millions of crawlable URLs, using canonical tags and noindex for deep combinations.

**Cart.** The cart lives on the server, keyed by user, or by an anonymous cart id in a cookie for guests, and merges on login. Adding to cart is optimistic, with a mini-cart confirmation. The header's cart count comes from a small endpoint, not from cached page HTML, otherwise users would see someone else's count. Prices and stock are revalidated at checkout, because they may have changed.

**Checkout.** Checkout is where reliability matters most. It's a focused layout with minimal JavaScript and no third-party marketing tags, protected by a strict Content Security Policy. Card details are entered in the payment provider's hosted fields, so card data never touches our servers, which keeps us out of most PCI scope; wallets like Apple Pay and Google Pay are offered through the Payment Request API. Strong Customer Authentication challenges, 3-D Secure, are handled in the provider's flow. Placing the order uses an idempotency key, the button is disabled with progress shown, and if the request times out, we poll the order status instead of resubmitting, so a customer is never charged twice. Validation is inline, entered data is never lost on errors, and a declined payment leads straight to choosing another method.

**Performance.** Performance is revenue here, so I'd set budgets: LCP under 2.5 seconds, INP under 200 milliseconds, CLS under 0.1 on mid-range phones. Responsive images in modern formats from the image CDN; code splitting per route; partial hydration; third-party scripts governed and deferred; `stale-while-revalidate` caching.

**Experiments.** A/B tests are assigned on the server or at the edge, so there's no flicker of the original version, with Web Vitals as guardrail metrics alongside conversion.

**Internationalisation and accessibility.** Prices formatted with `Intl.NumberFormat` in the local currency, regional catalogues and payment methods, translations and RTL. Accessibility: semantic landmarks and headings, filter groups as checkboxes with a live result count, variant pickers as radio groups, labelled forms with error summaries in checkout, and focus management for the mini-cart. In Europe, the Accessibility Act makes this a legal requirement for e-commerce."

#### Another worked example
**Idempotent order placement and timeout handling.**
```
Client: key = uuid() when checkout review loads (reused across retries of this attempt)
POST /orders { cartId, paymentMethodId, idempotencyKey: key }
  ├─ 201 { orderId } → confirmation page
  ├─ 402 payment_declined → show inline error, keep form, offer other methods
  ├─ 409 price_changed → show updated prices, ask to confirm
  └─ network timeout → GET /orders?idempotencyKey=key every 2s (max 30s)
        ├─ found → confirmation
        └─ not found → safe to retry with the same key
```
The server stores the key with the result, so a duplicate request returns the original response instead of creating a second order or charge. Stripe's API works the same way.

#### A third worked example
**Amazon-scale marketplace versus a single-brand D2C store.**
- **Marketplace:** hundreds of millions of products, so PDPs are rendered on demand with edge caching (can't prebuild); many sellers per product ("buy box"); huge reliance on search and recommendations; micro-frontends owned by many teams composing a page; extensive experimentation.
- **D2C brand store (Shopify-like, a few thousand products):** static generation with ISR for all PDPs, simpler search (hosted search service), checkout often handled by the platform, focus on brand storytelling and rich media while keeping performance.
Picking strategies based on catalogue size and team structure is the senior insight.

#### Step-by-step framework
1. **Requirements**: pages, SEO, personalisation, markets, scale.
2. **Architecture**: CDN/edge, rendering servers, BFF/GraphQL, services, islands.
3. **Rendering per page** with a table: PDP, search, home, cart, checkout.
4. **PDP details**: cacheable vs dynamic data, variants in URL, images, structured data.
5. **Search details**: URL state, facets, SEO hygiene, prefetching, scroll restoration.
6. **Cart and checkout**: server cart and merge, payments via hosted fields and wallets, SCA, idempotency, error recovery, CSP.
7. **Performance**: budgets, images, splitting, partial hydration, third-party governance.
8. **Experimentation, i18n, accessibility, metrics.**

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| One rendering approach for all pages | Strategy per page based on SEO, freshness, personalisation |
| Caches the whole PDP including price and stock | Separates cacheable product data from dynamic price/stock/delivery |
| Filters in component state | Filters in the URL; SEO hygiene for facet combinations |
| Card form posts to our server | Hosted fields/iframes, wallets, SCA |
| Submit button can double-charge | Idempotency keys and status polling on timeout |
| A/B tests via client-side swaps | Server/edge assignment to avoid flicker; Web Vitals guardrails |

#### Useful phrases
- "Cache what's the same for everyone; fetch what's personal or volatile."
- "The URL is the state of a search page."
- "Card data should never touch our servers."
- "Every order request carries an idempotency key, so retries can't double-charge."

#### Common pitfalls
- **Caching personalised or volatile data** (prices, cart counts) in shared HTML.
- **Crawl traps** from unbounded filter URLs.
- **Third-party tags on checkout**, hurting security and performance.
- **Client-side A/B flicker** harming CLS and trust.
- **Losing form data** on payment errors.
- Ignoring **guest-to-signed-in cart merging**.

#### Follow-ups to expect (with sample answers)
- **"How would you handle a flash sale with huge traffic?"** — "Static or edge-cached pages, a virtual waiting room in front of checkout, inventory reservation with short holds, graceful degradation of non-essential widgets (recommendations), and clear stock messaging."
- **"How do micro-frontends fit?"** — "Different teams own search, PDP modules, cart and checkout; compose at the server or edge, share a design system and a small shell; avoid duplicating heavy dependencies. I'd only use them when team scale demands it."
- **"How do you measure success?"** — "Conversion funnel (search → PDP → add to cart → checkout → order), revenue per session, Web Vitals by page type, error rates in checkout, and experiment metrics."
- **"How do you handle price changes between cart and order?"** — "Revalidate at checkout review and at submission; if prices changed, show the new total and require confirmation; the server is always authoritative."
- **"What about accessibility testing?"** — "Automated axe checks in CI on all templates, manual screen reader testing of search filters and checkout, and keyboard-only purchase flows as a release gate."

#### What senior interviewers look for
- **Deliberate rendering and caching choices** per page.
- **Revenue-aware performance** discipline.
- **Checkout reliability and payment security** depth.
- **Scale and organisation awareness**: experimentation, teams, i18n, legal accessibility.

#### Practise it
- Present the design in 45 minutes, starting with the rendering-per-page table.
- Audit a real e-commerce PDP with Lighthouse and WebPageTest; list what you'd change.
- Checklist: requirements · edge/CDN · rendering per page · PDP data split · variants in URL · structured data · search URL state and SEO hygiene · prefetch · server cart + merge · hosted payment fields · wallets · SCA · idempotency · CSP on checkout · budgets · partial hydration · server-side experiments · i18n · a11y.

#### Variations you might be asked
- "Design the checkout flow for a payments company."
- "Design a grocery delivery website with time slots."
- "Design a marketplace like eBay with auctions."

## Design a multi-brand e-commerce platform
- id: 598175cb-eb70-4754-aab6-106e45872d71
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, multi-brand, story-bank, migration

### Prompt
A company runs several e-commerce brands (for example a deals site, a travel site and a lifestyle store), each currently on its own separately built frontend. Design a single frontend platform that serves all brands from one codebase, with different looks, features and content per brand, and explain how you'd migrate the existing sites onto it without a risky big-bang rewrite.

### Answer
#### What the interviewer is really testing
- **Variation management**: how brands differ (theme, copy, features, layouts, integrations, domains) and the mechanisms for each (tokens, configuration, composition, feature flags, per-brand overrides).
- **Build-time vs runtime brand resolution**, and their effects on bundle size, caching, deployment and risk.
- **Architecture and repository structure**: monorepo, shared packages, design system with brand themes, brand-specific code boundaries.
- **Migration strategy**: strangler fig, routing at the edge, incremental page-by-page cutover, SEO and analytics continuity, measuring parity.
- **Organisational concerns**: ownership, testing across brands, release safety, avoiding a tangle of `if (brand === ...)` conditionals.

#### Key points
- **Requirements:** N brands (3 to 10+), separate domains; shared commerce capabilities (search, PDP, cart, checkout, account); per-brand theme (colours, typography, logos, spacing), copy and locale, feature set (e.g. travel needs date pickers and booking flows; deals needs countdown timers), page layouts and CMS content, third-party integrations (analytics IDs, payment methods), SEO settings; independent releases per brand where possible; shared improvements reach all brands; performance budgets per brand.
- **Variation mechanisms (from cheapest to most powerful):**
  1. **Design tokens and themes**: CSS custom properties per brand (`--color-primary`, `--font-heading`, `--radius`), generated from a token source (Style Dictionary). Components never hard-code brand values.
  2. **Configuration**: a typed brand config (`brands/deals/config.ts`): locale, currency, features enabled, analytics IDs, payment methods, routes, SEO defaults. Validated with a schema.
  3. **Content**: CMS-driven pages and copy per brand (a headless CMS with a brand dimension).
  4. **Feature flags**: per brand and per experiment, for gradual rollout.
  5. **Composition and slots**: shared page templates with slots that brands fill (e.g. PDP template with a `PriceBlock` slot: deals brand plugs in a countdown price block).
  6. **Brand overrides/modules**: for genuinely different components, a per-brand implementation behind a common interface, resolved by module aliasing at build time (`@brand/PriceBlock` → `brands/deals/PriceBlock.tsx`, falling back to `brands/default/`).
  - **Avoid runtime brand conditionals scattered in components** (`if (brand === 'travel')`): they grow without bound, ship every brand's code to every brand, and make changes risky. Push variation into tokens, config and module resolution.
- **Build-time vs runtime brand resolution:**
  - **Build-time** (one build per brand, module aliasing, tree-shaking): each brand ships only its code; smaller bundles; brand-specific deploys; more CI builds.
  - **Runtime** (one build, brand detected from domain): simpler pipeline, one deploy; larger bundles or lots of lazy loading; brand mix-ups possible; a bad deploy hits all brands.
  - Common answer: **one codebase, per-brand builds** (or per-brand entry points) with shared CI, plus runtime config for things that change without deploys.
- **Repository structure (monorepo):**
  ```
  apps/storefront            (Next.js app; brand selected via BRAND env at build)
  brands/default/            (default implementations of overridable modules)
  brands/deals/  brands/travel/  brands/lifestyle/   (config, tokens, overrides, assets)
  packages/design-system     (components consuming tokens)
  packages/commerce          (cart, checkout, API clients, hooks)
  packages/analytics, packages/i18n, packages/config-schema
  ```
  - Tooling: Turborepo/Nx for cached builds per brand; lint rules forbidding imports from one brand into another, and forbidding brand-name checks in shared code; an export-parity check that every brand implements (or inherits) every overridable module.
- **Rendering and infrastructure:** SSR/ISR per brand; CDN with per-domain caching; edge middleware maps domain → brand deployment; shared APIs/BFF with a brand header; per-brand performance budgets and monitoring.
- **Testing:** unit tests run against default brand; visual regression per brand (Storybook with a brand switcher, Chromatic modes); E2E smoke suite per brand for critical journeys; CI runs only affected brands (dependency graph).
- **Migration (strangler fig):**
  1. Put an **edge router/reverse proxy** in front of the legacy sites.
  2. Build the platform's shell, design system and one brand's theme.
  3. Migrate **page types incrementally** (start with low-risk, high-learning pages, e.g. static content or PDP for one brand), routing those paths to the new platform while the rest stay on legacy.
  4. **Share session/cart** between old and new (shared cookies on the same domain, shared cart API).
  5. Keep **URLs, redirects, canonical tags, structured data and analytics events** identical (parity checks), to protect SEO and reporting.
  6. Measure: Web Vitals, conversion, errors, A/B test new vs old where possible; roll back by switching routing.
  7. Repeat per page type and per brand; decommission legacy pieces as traffic moves.
- **Organisation:** platform team owns shared packages and the design system; brand teams own brand config, content and overrides; contribution model and RFCs for shared changes; clear versioning so a shared change doesn't silently break a brand.

#### Model answer
"I'd start by listing how brands actually differ, because the right mechanism depends on the kind of difference. Typically: visual identity, copy and locale, which features are enabled, page layouts and content, a few genuinely different components, third-party integrations like analytics and payment methods, and domains and SEO settings. Shared capabilities, like search, product pages, cart, checkout and accounts, should be built once.

**Variation mechanisms.** I'd use the cheapest mechanism that handles each difference.

Visual identity goes into design tokens: each brand has a token set compiled into CSS custom properties for colours, typography, spacing and radii, and components only reference tokens. Rebranding becomes a token change.

Behavioural and integration differences go into a typed brand configuration: locale, currency, enabled features, analytics ids, payment methods, SEO defaults, validated by a schema so a missing value fails the build, not production.

Content and page composition come from a headless CMS with a brand dimension.

For components that genuinely differ, say the deals brand's price block with a countdown timer versus the lifestyle brand's simple price, I'd use composition: shared page templates with slots, and per-brand implementations of a small set of overridable modules behind a shared interface. Those are resolved at build time by module aliasing: importing `@brand/PriceBlock` resolves to the brand's file, falling back to the default implementation.

What I'd actively avoid is runtime `if (brand === 'travel')` checks spread through shared components. They multiply, ship every brand's code to every user, and make every change risky because you can't see which brands it affects. I'd enforce that with lint rules.

**Build-time or runtime?** One build per brand, from one codebase. Each brand's bundle includes only its own overrides and enabled features, deployments can be per brand so a bad release doesn't take down every site, and the monorepo build tool caches shared packages so CI stays fast. Things that need to change without a deploy, like feature flags and CMS content, stay runtime.

**Repository.** A monorepo with the storefront app, a `brands` folder with one directory per brand holding config, tokens, assets and overrides, a default brand with baseline implementations, and shared packages: the design system, commerce logic like cart and checkout, analytics, i18n, and the config schema. CI checks that no brand imports another brand's code, and that every brand implements or inherits every overridable module, so adding a new override can't silently break a brand.

**Infrastructure.** Each brand is server-rendered or statically generated with its own domain; edge middleware maps domains to brand deployments; shared APIs receive a brand header. Each brand has its own performance budgets and dashboards.

**Testing.** Unit tests run on shared code; Storybook has a brand switcher, and visual regression runs every component in every brand theme; each brand has an E2E smoke suite for search, product, cart and checkout; and CI only builds and tests brands affected by a change.

**Migration.** I wouldn't do a big-bang rewrite. I'd use the strangler fig pattern. First, put an edge router in front of the existing sites, so we can route any path to old or new. Then build the platform foundation and one brand's theme, and migrate one page type for one brand, ideally something valuable but lower risk, like product pages, while everything else stays on the legacy site. Session and cart must be shared between old and new, through same-domain cookies and a shared cart API, so users can move between them without noticing. URLs, redirects, canonical tags, structured data and analytics events must match exactly, which I'd verify with automated parity checks, because breaking SEO or reporting is the classic way migrations fail. Each cutover is measured on Web Vitals, conversion and errors, ideally as an A/B test between old and new, and rollback is just a routing change. Then repeat page type by page type and brand by brand, and decommission legacy pieces as traffic moves over.

**Organisation.** A platform team owns the shared packages and design system; brand teams own their configuration, content and overrides; shared changes go through a lightweight RFC process with clear versioning."

#### Another worked example
**Module aliasing for brand overrides (Next.js/webpack sketch).**
```js
// next.config.js
const brand = process.env.BRAND; // 'deals' | 'travel' | 'lifestyle'
const fs = require('fs'), path = require('path');
module.exports = {
  webpack(config) {
    config.resolve.alias['@brand-config'] = path.resolve(__dirname, 'brands', brand, 'config.ts');
    config.resolve.plugins = [...(config.resolve.plugins || []), {
      apply(resolver) {
        resolver.getHook('resolve').tapAsync('BrandOverride', (req, ctx, cb) => {
          if (!req.request?.startsWith('@brand/')) return cb();
          const name = req.request.slice('@brand/'.length);
          const own = path.resolve(__dirname, 'brands', brand, name);
          const fallback = path.resolve(__dirname, 'brands', 'default', name);
          const target = ['.tsx', '.ts'].some((ext) => fs.existsSync(own + ext)) ? own : fallback;
          resolver.doResolve(resolver.getHook('resolve'), { ...req, request: target }, null, ctx, cb);
        });
      },
    }];
    return config;
  },
};
```
Shared code imports `@brand/PriceBlock`; the build for each brand bundles only that brand's version (or the default). The same idea works with Vite aliases or TypeScript path mapping plus a resolver plugin.

#### A third worked example
**Choosing a first migration slice.** Options for the first page type:
- **Home page:** highly visible, heavily personalised, many dependencies: risky first slice.
- **Static/content pages (help, about):** low risk, proves routing and theming, but teaches little about commerce.
- **PDP for one brand:** high traffic and SEO value, exercises design system, data fetching, caching and analytics; risk is manageable with A/B routing.
A common choice: content pages first (a week, proves infrastructure), then PDP for the smallest brand (proves commerce at moderate risk), then search, then cart/checkout last, because checkout has the highest risk and the most integrations.

#### Step-by-step framework
1. **Requirements**: brands, how they differ, shared capabilities, release independence.
2. **Classify variation** and map to mechanisms: tokens, config, CMS, flags, slots, overrides.
3. **Choose build-time vs runtime** resolution and justify.
4. **Repository and package structure**, with guardrails (lint, parity checks).
5. **Infrastructure**: rendering per brand, domains, edge routing, shared APIs.
6. **Testing**: brand-aware visual tests, per-brand E2E, affected-only CI.
7. **Migration**: strangler fig, edge router, slice order, shared session/cart, SEO and analytics parity, measurement, rollback.
8. **Organisation**: ownership, contribution model, versioning; wrap up with risks.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| `if (brand === 'x')` throughout components | Tokens, config, slots and build-time module overrides |
| One runtime bundle with every brand's code | Per-brand builds from one codebase; runtime only for flags/content |
| Big-bang rewrite and switch-over | Strangler fig with edge routing and incremental slices |
| Ignores SEO and analytics during migration | Automated parity checks for URLs, redirects, structured data, events |
| Test only one brand | Visual regression per brand, per-brand smoke E2E, affected-only CI |
| No ownership model | Platform team plus brand teams with RFCs and versioning |

#### Useful phrases
- "Each kind of difference gets the cheapest mechanism that handles it."
- "Brand differences live in tokens, config and overrides, not in if-statements."
- "Strangler fig: route path by path from old to new, with rollback as a routing change."
- "A migration that breaks SEO or analytics has failed, even if the new site is better."

#### Common pitfalls
- **Over-sharing**: forcing genuinely different flows (travel booking vs deals checkout) into one component with dozens of props.
- **Under-sharing**: forking per brand, so fixes must be applied N times.
- **Runtime brand detection bugs** (wrong theme flashing, wrong analytics ID).
- **Migrating checkout first**.
- Forgetting **shared sessions/carts** between legacy and new during migration.
- **No parity measurement**, so regressions in conversion go unnoticed.

#### Follow-ups to expect (with sample answers)
- **"How do you add a new brand?"** — "Create a brand folder from a template: tokens, config, assets; it inherits all default modules; add a domain and deployment; run the per-brand visual and E2E suites. Ideally days, not months, which is the platform's business value."
- **"How do you stop a shared change breaking a brand?"** — "Per-brand visual regression and smoke tests in CI on every PR affecting shared code, type-checked config and override interfaces, an export-parity check, and staged rollouts per brand with monitoring."
- **"When should a brand diverge completely?"** — "If its core flows differ fundamentally (e.g. travel booking vs product commerce), share the design system and infrastructure but let it own its page templates. Sharing should reduce cost, not force sameness."
- **"How do you handle per-brand performance?"** — "Separate budgets and dashboards; per-brand builds keep bundles lean; track Web Vitals by brand and page type; block merges that exceed budgets for any brand."
- **"How do you run the migration with a fixed team?"** — "Prioritise by value and risk, keep legacy maintenance minimal (freeze features on migrated pages), measure each slice, and communicate a roadmap with clear exit criteria per brand."

#### What senior interviewers look for
- **A principled variation strategy** and resistance to scattered conditionals.
- **Pragmatic build and deployment choices** with risk isolation.
- **A safe, measurable migration plan** that protects SEO and revenue.
- **Organisational design**: ownership, guardrails, and scaling to new brands.

#### Practise it
- Present the design in 40 minutes, then spend 10 minutes on the migration plan.
- Set up a small monorepo with two brands: tokens, a typed config and one module override resolved at build time.
- If you've done a migration like this, prepare a STAR story: the starting state, why a platform, the slicing strategy, a problem you hit (SEO, sessions, parity), and measured results.
- Checklist: brand differences listed · mechanism per difference · no runtime conditionals · per-brand builds · monorepo + guardrails · export parity · edge routing · brand-aware testing · strangler fig slices · shared session/cart · SEO and analytics parity · measurement and rollback · ownership model.

#### Variations you might be asked
- "Design a white-label platform where customers configure their own storefront."
- "How would you migrate a large app from one framework to another incrementally?"
- "Design a design system that supports multiple brands and dark mode."

## Design a real-time collaborative whiteboard (Excalidraw/Miro)
- id: 01ea770a-a76a-4a82-910b-c2df0de0dc9c
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- companies: Anthropic, Excalidraw
- tags: system-design, canvas, collaboration

### Prompt
Design the frontend of a real-time collaborative whiteboard like Excalidraw or Miro. Users draw freehand strokes, add shapes, sticky notes, arrows and text on an infinite canvas, see other people's cursors and edits live, and can keep working offline. Cover the data model, rendering, input handling, the sync model, undo/redo, persistence and performance for boards with thousands of objects.

### Answer
#### What the interviewer is really testing
- Whether you can **scope a whiteboard differently from a precision design tool**: simpler objects, looser precision, but heavy emphasis on freehand drawing, many concurrent users, and offline or peer-to-peer collaboration.
- A **document model** that syncs well: flat map of elements, each with a stable id, versioned properties, z-order by fractional index.
- **Choosing a sync model** with reasons: a CRDT library like Yjs or Automerge versus server-authoritative last-writer-wins, and how each handles offline edits.
- **Rendering on Canvas 2D** with a camera, culling, layered canvases and cached shapes, and knowing when you'd need WebGL.
- **Input engineering**: pointer events, pressure, stroke smoothing, coalesced events, gestures for pan and pinch-zoom, tools as a state machine.
- **Product details**: presence, follow mode, per-user undo, export, embeds, permissions, accessibility for a canvas.

#### Key points
- **Requirements to agree:** infinite canvas with pan and zoom; freehand pen, rectangles, ellipses, arrows (that stay attached to shapes), text, sticky notes, images; select, move, resize, rotate, group, lock; multiplayer with live cursors and selections; comments maybe; undo/redo; offline editing that merges later; export to PNG/SVG; boards of 5,000+ elements and 50+ simultaneous users (a workshop).
- **Data model:**
  ```
  Board { id, elements: Map<id, Element>, order: fractional index per element }
  Element { id, type: 'freedraw'|'rect'|'ellipse'|'arrow'|'text'|'sticky'|'image',
            x, y, width, height, angle, strokeColor, fill, opacity,
            points?: [x,y,pressure][], text?, startBinding?, endBinding?,
            groupIds: string[], locked, isDeleted, version, updatedBy }
  ```
  A flat map keyed by id makes every edit a small, mergeable change. Deletes are soft (`isDeleted`) so they merge correctly.
- **Sync model choice:**
  - **CRDT (Yjs, Automerge):** a `Y.Map` of elements, each element a `Y.Map` of properties. Concurrent edits to different properties merge; same-property edits resolve deterministically. Works offline and peer-to-peer; the server is a relay plus persistence. Excalidraw's own collaboration uses per-element versions with a reconciliation rule, which is a lightweight cousin of this idea.
  - **Server-authoritative LWW per property:** simpler server, easier permissions, but offline edits need careful rebasing.
  - For a whiteboard, where offline workshops and simple objects are common, a CRDT is a strong default.
- **Rendering:** Canvas 2D is enough for most whiteboards. Use a **static canvas** for committed elements and an **interactive canvas** on top for the shape being drawn, selection handles and remote cursors, so a drag doesn't redraw thousands of elements. Cull by viewport, cache each element as an offscreen bitmap or `Path2D` keyed by element version, and only redraw when something visible changed.
- **Freehand strokes:** capture with `pointermove` plus `getCoalescedEvents()` for high-frequency points, smooth them (Catmull-Rom or a library like perfect-freehand that uses pressure), and simplify stored points (Ramer-Douglas-Peucker) to keep the document small.
- **Hit testing:** spatial index (grid buckets or an R-tree) for candidate elements, then precise tests: distance to a polyline for strokes, point-in-rotated-rect for shapes.
- **Presence:** cursors, selections and the current viewport over an ephemeral channel (Yjs awareness), throttled to about 20 updates per second and interpolated on the receiver.
- **Undo/redo:** per-user, scoped to your own changes (Yjs `UndoManager` with a tracked origin), grouped per gesture.
- **Persistence:** CRDT updates stored as incremental binary updates plus periodic snapshots; local copy in IndexedDB so reloads are instant and offline works.

#### Model answer
"I'd start by pinning down what makes a whiteboard different from something like Figma. Objects are simpler and precision matters less, but freehand drawing has to feel instant, there can be 50 people in a workshop editing at once, and people expect it to work on a flaky conference Wi-Fi. That pushes me towards a CRDT-based sync model and a Canvas 2D renderer.

**Requirements.** Infinite canvas, pen, shapes, arrows that stay attached to the shapes they connect, text and sticky notes, images, selection and transforms, live cursors, undo per user, offline editing, and export. Scale target: around 5,000 elements and 50 concurrent editors.

**Architecture.**
```
 Pointer/keyboard input ──► Tool state machine (select | pen | rect | arrow | text | hand)
                                   │ local changes (transactions)
                                   ▼
   Yjs document (Y.Map elements) ◄──► Sync provider (WebSocket relay; WebRTC optional)
        │ observe deep changes                 ▲
        ▼                                      │ awareness: cursors, selections
   Scene cache (elements by id, spatial index, ordered list)
        │
        ▼
   Renderer: static canvas (committed, culled, cached)  +  interactive canvas (in-progress, handles, cursors)
   Persistence: y-indexeddb locally; server stores updates + snapshots
```
The UI chrome, the toolbar, colour pickers and the board list, is ordinary React. The canvas is driven imperatively, because re-rendering React on every pointer move would be far too slow.

**Data model.** Elements live in a flat map keyed by id. Each element has its geometry, style, type-specific data like stroke points or text, group ids, a lock flag and a soft-delete flag. Order between elements uses fractional indexes, so two people bringing different shapes to the front don't clash. Arrows store bindings to shape ids, and when a shape moves, the arrow's endpoints are recomputed locally, so the binding, not the coordinates, is the synced truth.

**Sync.** I'd use Yjs. The board is a `Y.Map` of element ids to `Y.Map`s of properties. If Ana moves a sticky while Ben recolours it, both changes apply. If both move it, Yjs resolves it deterministically and both screens converge. Because merging doesn't need a central authority, offline edits simply merge on reconnect, and peer-to-peer over WebRTC is possible for low latency in a room. The server's job is relaying updates, storing them, checking permissions on connect, and compacting history into snapshots. One subtlety: freehand points are written once when the stroke ends, not point by point, so the CRDT doesn't fill up with thousands of tiny updates; remote users see the live stroke through the awareness channel while it's being drawn.

**Rendering.** Two stacked canvases. The static canvas draws committed elements: I query the spatial index for elements in the viewport, sort by fractional index, and draw each one from a cached `Path2D` or offscreen bitmap keyed by its version, so unchanged elements are cheap. The interactive canvas redraws every frame during a gesture, but only contains the shape being drawn, selection handles and other people's cursors. Zooming is a transform on the context; at big zoom changes I invalidate bitmap caches so text and strokes stay crisp. I'd also handle `devicePixelRatio` so lines look sharp on retina screens.

**Input.** Pointer Events handle mouse, pen and touch together. For the pen I use `getCoalescedEvents()` to get every sampled point, pressure for stroke width, and a smoothing algorithm so strokes look natural. Two-finger gestures pan and pinch-zoom; space-drag pans on desktop. Tools are a small state machine so modes like 'drawing an arrow while hovering a shape to bind' stay predictable.

**Undo.** Per user: Yjs's `UndoManager` tracks only changes tagged with my origin, so undo never removes a collaborator's sticky note. A whole drag or stroke is one undo step.

**Performance and scale.** Culling plus caching keeps a 5,000-element board at 60 frames per second on a laptop. Awareness updates are throttled and interpolated. Large images are downscaled on upload and loaded lazily. If boards grew to tens of thousands of elements or needed heavy effects, I'd move the static layer to WebGL or render it in an OffscreenCanvas in a worker.

**Accessibility and export.** A canvas is invisible to screen readers, so I'd keep a hidden, ordered list of elements with text content, keyboard shortcuts to move between and edit elements, and export to SVG and PNG, which also gives a readable artefact."

#### Another worked example
**Workshop mode for 80 participants (B2B facilitation) versus a two-person sketch (B2C).**
- **Workshop:** most traffic is presence, not edits. Show only cursors inside your viewport plus a participant list, batch awareness updates, and let the facilitator lock the board, run a timer, and 'summon' everyone to their viewport (follow mode broadcasts the facilitator's camera). Votes on stickies are a counter per user stored as a map, so concurrent votes never overwrite each other.
- **Two-person sketch:** WebRTC peer-to-peer gives the lowest latency and can avoid a server entirely, with end-to-end encryption (Excalidraw's share links keep the key in the URL fragment, which the server never sees).
Same data model and renderer; different presence strategy, permissions and transport.

#### A third worked example
**Arrows that follow shapes under concurrent edits.**
```
Ana moves box B to x=400          Ben, offline, changes arrow A's label
A.endBinding = { elementId: B, focus: 0.2, gap: 8 }
On merge: A's points are recomputed locally from B's new bounds + binding
Result on both screens: arrow attached to B at its new position, with Ben's label
```
Because each client derives arrow geometry from the binding, there's no conflict to resolve. If someone deletes B, the binding points at a soft-deleted element, and the client falls back to the last stored endpoint so the arrow doesn't vanish.

#### Variations you might be asked
- "Design Miro's sticky-note brainstorming with voting and clustering."
- "How would you add real-time comments pinned to positions on the board?"
- "Design an infinite-canvas note app that works fully offline."

#### Step-by-step framework
1. **Requirements**: object types, scale, concurrency, offline, export, permissions.
2. **Data model**: flat element map, soft deletes, fractional order, bindings.
3. **Sync model**: CRDT vs server LWW, with a reason tied to offline and peer-to-peer needs.
4. **Architecture diagram**: input → tools → document → scene cache → renderer, plus provider and persistence.
5. **Rendering**: Canvas 2D, two layers, culling, per-element caches, DPR handling.
6. **Input**: pointer events, coalesced events, pressure, smoothing, gestures, tool state machine.
7. **Presence and undo**: awareness channel, per-user undo grouped per gesture.
8. **Scale, accessibility, export**: throttling, image handling, WebGL path, hidden element list.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Re-render a React component per shape | Imperative canvas with culling and cached paths |
| Sends every pointer point through the CRDT | Commits strokes on pointer up; live preview via awareness |
| "Use WebSockets" for sync | Chooses a CRDT and explains offline merge and peer-to-peer |
| Arrows store absolute endpoints | Arrows store bindings; geometry is derived |
| Global undo | Per-user undo scoped to your own changes |
| Ignores the canvas's accessibility | Hidden element list, keyboard navigation, SVG export |

#### Useful phrases
- "A whiteboard trades precision for immediacy and concurrency."
- "Commit the stroke once; stream the preview as presence."
- "Sync the binding, derive the geometry."
- "Two canvases: one that rarely changes and one that changes every frame."

#### Common pitfalls
- **CRDT bloat** from syncing every point of every stroke.
- **Redrawing the whole board** on every pointer move.
- Forgetting **devicePixelRatio**, so drawings look blurry on retina screens.
- **Hard deletes** that resurrect or conflict when an offline user edits a deleted element.
- Showing **all 80 cursors** at full rate, which floods the network and the screen.
- No plan for **history growth**: compaction and snapshots matter for long-lived boards.

#### Follow-ups to expect (with sample answers)
- **"Why Yjs rather than server-side last-writer-wins?"** — "Offline and peer-to-peer are first-class here, and Yjs merges without a central authority. For a product needing strict server-side validation, like an enterprise board with audit logs, I'd still keep the server as the only writer to storage and validate updates there."
- **"How do you stop the document growing forever?"** — "Yjs garbage-collects deleted content; the server periodically snapshots the merged state and drops old incremental updates. Soft-deleted elements can be purged after a retention window."
- **"How would you make freehand drawing feel instant on a slow device?"** — "Draw the in-progress stroke on the interactive canvas only, use coalesced events, avoid allocations per point, and defer smoothing to pointer up if needed."
- **"How do you handle images?"** — "Upload to object storage, store the file id in the element, downscale previews, and load full resolution only when zoomed in."
- **"How would you test convergence?"** — "Simulate several clients applying random edits with random delivery order, then assert their documents are identical."

#### What senior interviewers look for
- A sync model **matched to the product**, with honest trade-offs.
- **Rendering pragmatism**: Canvas 2D done well before reaching for WebGL.
- Attention to **input feel** and to **presence at scale**.
- Remembering **accessibility and export** for a canvas product.

#### Practise it
- Build a two-user whiteboard with Yjs, `y-websocket` and Canvas 2D: rectangles and freehand only, with culling.
- Explain why arrows store bindings, using the merge example above, in 60 seconds.
- Checklist: requirements · flat element map · soft deletes · fractional order · CRDT choice · stroke commit strategy · two canvases · culling and caches · pointer handling · awareness throttling · per-user undo · persistence and snapshots · accessibility.

## Design an AI chat application with multiple models and tools
- id: 7554093d-6250-4d78-a258-928875dc89ed
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- companies: Anthropic, OpenAI, Cohere
- tags: system-design, AI, streaming, chat

### Prompt
Design the frontend of an AI assistant like Claude.ai or ChatGPT. Users have conversations with a choice of models, responses stream in, the model can call tools (web search, code execution, file analysis) and the UI shows those steps, users can attach files, edit and regenerate messages, stop generation, and come back to past conversations. Cover the architecture, message data model, streaming protocol, tool-call UI, state management, performance and safety.

### Answer
#### What the interviewer is really testing
- Going beyond a basic streaming chat: a **message model made of typed content parts** (text, thinking, tool calls, tool results, citations, attachments) rather than a single string.
- **Streaming protocol design**: event types, partial JSON for tool inputs, resumable streams, cancellation, errors mid-stream.
- **Conversation as a tree**: edits and regenerations create branches, and the UI shows one path.
- **Tool use UX**: showing progress and results honestly, approvals for sensitive tools, and rendering rich outputs (tables, charts, code) safely.
- **Model selection** as a capability problem: context limits, vision support, tool support, cost, and what happens when you switch mid-conversation.
- **Performance and safety**: long conversations, Markdown and code rendering cost, untrusted model output, prompt injection through tool results, rate limits.

#### Key points
- **Requirements:** model picker; streaming replies with stop; tool calls shown inline with status; file and image attachments; edit a past user message, regenerate a reply, switch between versions; conversation list with search; sharing a conversation; usage limits shown to the user; mobile and desktop; accessible.
- **Architecture:**
  ```
  React UI ─► Conversation store (normalised messages, tree, active path)
     ▲                 │ send / regenerate / stop
     │                 ▼
     │      Stream client (fetch + ReadableStream, SSE parsing, AbortController)
     │                 │ POST /api/conversations/:id/messages
     │                 ▼
     │      BFF / API: auth, rate limit, model routing, tool orchestration, persistence
     │                 │
     └── events ◄──────┘  message_start · content_block_start · delta · tool_use · tool_result · message_stop · error
  ```
  The browser never holds provider API keys; the backend talks to model providers and runs tools.
- **Message model:**
  ```
  Message { id, conversationId, parentId, role: 'user'|'assistant', model, createdAt,
            status: 'streaming'|'complete'|'stopped'|'error',
            content: Part[] }
  Part = { type: 'text', text } | { type: 'thinking', text } |
         { type: 'tool_use', id, name, input, status } | { type: 'tool_result', toolUseId, output, isError } |
         { type: 'image' | 'file', fileId, name, mime } | { type: 'citation', source, quote }
  ```
- **Tree of messages:** each message has a `parentId`. Editing a user message creates a sibling with the same parent; regenerating creates a sibling assistant message. The active path is a list of chosen children; the UI shows arrows like "2 / 3" to switch.
- **Streaming:** `fetch` with POST and read `response.body`, parse SSE frames with a buffer, decode with `TextDecoder` in stream mode, apply deltas to the right content block by index, and flush to React at most once per animation frame.
- **Tool calls:** stream the tool input as partial JSON (accumulate, parse when the block ends), show a collapsible step ("Searching the web for…"), then the result. Sensitive tools (sending email, running code with network access) need an approval step in the UI before the backend executes.
- **Model capabilities:** keep a registry `{ id, contextWindow, supportsVision, supportsTools, maxOutput, costTier }`. Disable attachments a model can't handle, warn when a conversation exceeds the new model's context, and record which model produced each reply.
- **Performance:** virtualise very long conversations, memoise completed messages, render Markdown incrementally for the streaming message only, lazy-load syntax highlighting and math rendering.
- **Safety:** treat model output and tool results as untrusted (no raw HTML, sanitise links, sandbox artefacts in an iframe on a separate origin), show where tool content came from, and never let tool output trigger actions without user approval.

#### Model answer
"I'd treat this as a chat app whose messages are structured documents, not strings. A single assistant reply might contain some thinking, a web search, the search results, a code execution with a chart, and a final answer with citations, so the core design decision is the message model.

**Requirements.** Model picker, streaming with stop, tool steps visible inline, attachments, editing and regenerating with version switching, a searchable conversation list, sharing, and visible usage limits. Non-functionally: first token visible within a second of sending, smooth rendering of long replies, safe rendering of untrusted output, and graceful behaviour on mobile networks.

**Architecture.** The browser talks only to our backend. The backend authenticates, applies rate limits, routes to the chosen model provider, runs tools in sandboxes, and persists messages. It streams back a sequence of typed events: message start, content block start, deltas, tool use, tool result, message stop, and errors. On the client, a conversation store holds messages normalised by id, plus the tree structure and the active path. A stream client handles the POST, reads the body as a stream, parses events and feeds them to the store.

**Data model.** Each message has a parent id, a role, the model that produced it, a status, and an array of content parts. Parts are typed: text, thinking, tool use with its input and status, tool result, attachments and citations. Rendering is a switch over part types, so adding a new tool output type, like a chart or a map, is a new renderer, not a rewrite.

**Branching.** Edits and regenerations don't overwrite history. Editing a user message creates a sibling under the same parent, and regenerating creates a sibling assistant reply. The store keeps the selected child for each node, and the visible conversation is the path from the root through the selected children. A '2 of 3' control switches branches. When sending a new message, the backend receives the path, so the model sees exactly the history the user sees.

**Streaming.** I use `fetch` rather than `EventSource` because I need POST, a JSON body and auth headers. The reader keeps a buffer and only processes complete SSE events, and the `TextDecoder` runs in stream mode so emoji split across chunks don't corrupt. Deltas carry the content block index, so text goes to the right part even when the model interleaves thinking, text and tool use. Updates are batched into one state flush per animation frame, so 100 tokens per second costs about 60 renders, not 100. Stop calls `AbortController.abort()`, the backend cancels the provider request, and the message is saved with status 'stopped' and whatever text arrived.

**Tool calls.** When a tool-use block starts, I render a step like 'Searching the web' with a spinner, and accumulate its input, which streams as partial JSON, parsing it when the block closes. When the result arrives, the step updates to show a summary, with details collapsed. For tools with side effects, like sending an email or making a purchase, the backend pauses and sends an 'approval required' event; the UI shows exactly what will happen and waits for the user. Tool results are untrusted text, possibly containing prompt injection from a web page, so they're shown as quoted, attributed content, and they can never trigger actions by themselves.

**Models.** A capability registry drives the UI: if the selected model can't read images, the attach button explains why; if switching to a model with a smaller context window, I warn that older messages will be summarised or dropped. Each reply is labelled with its model, which matters when comparing regenerations.

**Performance.** Completed messages are memoised so only the streaming message re-renders. Markdown for completed messages is rendered once; the streaming message renders incrementally, with unclosed code fences closed temporarily so formatting doesn't flicker. Syntax highlighting and math rendering are lazy-loaded. Conversations with hundreds of messages are virtualised. The conversation list is paginated and searched server-side.

**Safety and reliability.** Markdown renders without raw HTML, links get `rel="noopener noreferrer"` and show their real domain, and generated artefacts like HTML or SVG previews run in a sandboxed iframe on a separate origin. If the stream drops mid-reply, I show the partial text with a 'Continue' or 'Retry' action; with server support, the client reconnects to the in-progress generation using the last event id. Rate limit errors show a clear message with the reset time rather than a generic failure."

#### Another worked example
**Rendering an interleaved reply.** Event sequence and resulting UI:
```
message_start            → empty assistant bubble, status streaming
content_block_start 0 thinking  → collapsible 'Thinking…'
delta 0 (thinking text)  → appended, collapsed by default
content_block_start 1 tool_use web_search  → step: 'Searching the web'
delta 1 input_json '{"query":"UK interest rate'   (partial, not parsed yet)
content_block_stop 1     → parse input → step shows 'Searching: UK interest rate November'
tool_result 1 (5 sources) → step shows 'Read 5 sources' (expandable list)
content_block_start 2 text → answer streams with citation markers [1] [2]
message_stop             → status complete; enable copy, regenerate, feedback
```
Each part has its own renderer; the store updates parts by index, so the UI never needs to re-parse the whole message.

#### A third worked example
**Enterprise assistant (B2B) versus consumer assistant (B2C).**
- **Enterprise:** single sign-on, admin-controlled model list and data retention, tools connected to internal systems (tickets, docs, databases) with per-user permissions checked on the backend, audit logs of tool calls, approvals for any write action, and no conversation sharing outside the organisation.
- **Consumer:** fast onboarding, visible usage limits and upgrade prompts, public share links with a read-only snapshot, stronger abuse prevention, and offline-tolerant history on mobile.
The message model and streaming client stay the same; policy, tools and sharing differ.

#### Variations you might be asked
- "How would you show a model's reasoning without overwhelming the user?"
- "Design side-by-side comparison of two models answering the same prompt."
- "How would you support voice input and spoken replies?"

#### Step-by-step framework
1. **Requirements**: models, tools, attachments, branching, history, sharing, limits.
2. **Architecture**: UI, store, stream client, backend with routing and tool orchestration.
3. **Message model**: typed parts, statuses, model per message.
4. **Conversation tree**: parent ids, siblings for edits and regenerations, active path.
5. **Streaming**: fetch body reader, buffered SSE parsing, block-indexed deltas, frame batching, abort.
6. **Tool UX**: partial JSON input, step states, approvals, attributed results.
7. **Model capabilities**: registry, context limits, attachment support.
8. **Performance and safety**: memoisation, virtualisation, lazy renderers, sanitised Markdown, sandboxed artefacts, resumable streams.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Message content is one string | Typed content parts with a renderer per type |
| Editing overwrites history | Tree of messages with branch switching |
| Shows tool calls as raw JSON | Readable steps with status, collapsible details, approvals |
| One setState per token | Block-indexed deltas, batched per frame |
| Model picker is cosmetic | Capability registry drives attachments and context warnings |
| Renders model HTML | Sanitised Markdown, sandboxed artefacts on a separate origin |

#### Useful phrases
- "A reply is a document of parts, not a string."
- "Edits and regenerations branch; they never overwrite."
- "Tool output is untrusted input, even when it comes from our own tool."
- "Anything with side effects waits for the user."

#### Common pitfalls
- Using **`EventSource`**, which can't send a POST body or auth headers.
- **Parsing partial tool JSON** on every delta and crashing on incomplete input.
- Letting the client **hold API keys** or call providers directly.
- **Re-rendering the whole conversation** for each token.
- Losing the user's **partial reply** when the connection drops.
- Ignoring **prompt injection** in tool results that tell the model to take actions.

#### Follow-ups to expect (with sample answers)
- **"How do you persist a reply that's still streaming?"** — "The backend writes the message as it streams, or at least at stop and completion, so a page reload shows the partial reply and can reconnect to the generation."
- **"How would you handle a 200-page PDF attachment?"** — "Upload directly to storage with a presigned URL, process it server-side (text extraction, chunking), show processing progress, and send the model either the full text or retrieved chunks depending on context size."
- **"How do you test the stream parser?"** — "Unit tests feeding events split at awkward byte boundaries, including mid-JSON and mid-emoji, plus MSW streams in component tests."
- **"How would you add model comparison?"** — "Send the same path to two models, render both as sibling assistant messages side by side, and let the user pick one to continue the branch."
- **"How do you show usage limits?"** — "The backend returns remaining quota and reset time in headers or events; the UI shows a subtle meter and a clear message before blocking."

#### What senior interviewers look for
- A **structured message model** that scales to new tools and output types.
- **Correct streaming mechanics**, cancellation and recovery.
- **Trust boundaries**: keys on the server, untrusted output, approvals for side effects.
- Product sense for **branching, model choice and limits**.

#### Practise it
- Build a stream parser that handles thinking, text and tool-use blocks with block indexes, and test it with randomly split chunks.
- Sketch the message tree for: send, regenerate twice, edit the first message, then switch back.
- Checklist: requirements · server-side keys · typed parts · message tree · fetch stream + buffered SSE · frame batching · abort · tool steps and approvals · capability registry · virtualisation · sanitised rendering · resumable streams.

## Design Notion (block-based docs with databases)
- id: 7c8b8726-13bd-4d8b-a129-40f398917712
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- companies: Notion
- tags: system-design, blocks, databases

### Prompt
Design the frontend of Notion at the application level: a workspace of nested pages made of blocks, plus databases (collections of pages with typed properties) shown as table, board, calendar and gallery views with filters, sorts and relations. Cover the data model, how pages and databases share it, loading and caching, offline and sync, permissions and sharing, search, and performance for large workspaces. You can treat the block editor itself as a component that already exists.

### Answer
#### What the interviewer is really testing
- Whether you see Notion's key idea: **everything is a block**, and a **database row is just a page** with typed properties, so docs and databases share one model.
- Designing **database views** as saved queries (filter, sort, group, visible properties) over a collection, rendered by different layouts.
- **Loading strategy** for a huge, deeply nested workspace: lazy page loading, a sidebar tree, record caches, pagination of large databases, server-side query execution.
- **Local-first behaviour**: a client-side record cache in IndexedDB, optimistic transactions, an offline queue, and real-time updates from other users.
- **Permissions inheritance** down a page tree, sharing, guests, and public pages.
- **Performance** for databases with tens of thousands of rows and pages with thousands of blocks.

#### Key points
- **Requirements:** workspaces and a sidebar page tree; pages of blocks; databases with property types (text, number, select, multi-select, date, person, checkbox, URL, relation, rollup, formula); views (table, board, calendar, gallery, list, timeline) each with filters, sorts, grouping and hidden properties; linked database views embedded in other pages; templates; search; sharing and permissions; comments; offline; real-time collaboration.
- **Unified record model:**
  ```
  Block   { id, type: 'page'|'paragraph'|'heading'|'todo'|'collection_view'|..., parentId, parentTable,
            properties, content: childIds[], spaceId, version, lastEditedBy, alive }
  Collection { id, name, schema: { propId: { name, type, options?, relation?: collectionId, formula? } },
               parentId }
  CollectionView { id, collectionId, type: 'table'|'board'|'calendar'|'gallery'|'timeline',
                   query: { filter, sort, groupBy }, format: { visibleProps, widths, cardCover } }
  ```
  A database row is a `page` block whose parent is a collection; its `properties` map follows the collection schema, and its `content` holds the page body.
- **Views are queries plus formatting.** Filtering, sorting and grouping run **on the server** for large collections (paginated results), and can run locally when the collection is small and cached.
- **Relations and rollups:** a relation property stores row ids in another collection; a rollup aggregates a property of related rows; formulas are computed from the row's properties. Computing these needs the related rows, so the server usually returns computed values with query results.
- **Loading:** fetch the sidebar tree shallowly (expand on demand); load a page's blocks when opened (and its children recursively up to a limit, lazily below the fold); load database views with the first page of results; prefetch on hover.
- **Record cache:** a normalised client store of records keyed by table and id with versions, persisted in IndexedDB so repeat visits and offline work are instant.
- **Writes as transactions:** each user action becomes a list of operations (`set`, `update`, `listAfter`, `listRemove`) applied optimistically, queued, and sent to the server; the server assigns versions and broadcasts changes over a WebSocket to subscribers of those records.
- **Permissions:** inherited down the page tree unless overridden; the server enforces them on every read and transaction; the client hides UI it can't use. Public pages are read-only snapshots served without a session.

#### Model answer
"I'll focus on the application around the editor: the workspace model, databases and views, loading, sync and permissions. The editor is a component that edits one page's blocks.

**The core idea.** In Notion, everything is a block, including pages. A database is a collection with a schema, and each row is just a page block whose parent is that collection. That's why you can open a row and write a full document inside it. So one model handles both docs and databases.

**Data model.** Three record types matter. Blocks have an id, type, parent, properties and an ordered list of child ids. Collections have a schema: property ids with a name, type and type-specific config, like select options, the target collection for a relation, or a formula expression. Collection views reference a collection and store a query (filter, sort, group-by) plus formatting (visible properties, column widths, card covers). A linked database embedded in another page is just another view block pointing at the same collection, which is why editing a row in one place updates it everywhere.

**Architecture.**
```
 Sidebar tree ─┐      Page view (editor)      Database view (table | board | calendar | gallery)
               │             │                           │
               └─────► Record store (normalised by table + id, versioned) ◄────┘
                           │  ▲                      │ query requests (paginated)
         transactions      │  │ change notifications ▼
         (optimistic) ─────┘  └──── Sync client: HTTP for loads/queries, WebSocket for subscriptions
                           │
                      IndexedDB cache + outbox (offline)
```
Every screen reads from the same record store, so a property changed in a board card instantly updates the table view and the open page.

**Loading.** Workspaces can have hundreds of thousands of pages, so nothing loads eagerly. The sidebar fetches top-level pages and expands children on demand. Opening a page loads its blocks, with very long pages loaded in chunks as you scroll. A database view requests the first page of query results, typically 50 to 100 rows with the properties the view shows, and loads more on scroll. Hovering a link prefetches that page. With IndexedDB persistence, a repeat visit renders from cache immediately and revalidates in the background.

**Views and queries.** A view is a saved query plus a layout. For large collections, filtering, sorting and grouping run on the server, because the client can't load 50,000 rows; the server returns ordered row ids, the records, and computed values for formulas and rollups. For small, fully cached collections, the client can run the same query locally, so changes feel instant. A board view is grouping by a select or status property; dragging a card between columns writes the new property value and an order position within the group. A calendar view is a date property query over a visible range. Each layout is a renderer over the same query result.

**Relations, rollups and formulas.** A relation stores row ids in another collection, and a rollup aggregates a property over the related rows, like summing task estimates for a project. These depend on records the client may not have, so the server computes them and returns them with query results, and the client recomputes locally only when everything needed is cached. When a related row changes, the server notifies subscribers of affected rows.

**Writes and sync.** Each user action becomes a transaction: a small list of operations like setting a property, inserting a block id after another in a parent's content list, or removing one. The client applies it optimistically to the store, saves it to an IndexedDB outbox, and sends it. The server checks permissions, applies it, bumps versions, and broadcasts change notifications over WebSocket to anyone subscribed to those records, who then fetch or receive the new versions. Property edits are last-writer-wins per property, which works because two people rarely set the same cell at the same moment; text inside blocks uses finer-grained merging in the editor layer.

**Offline.** Reads come from the IndexedDB cache; writes queue in the outbox and replay in order on reconnect, with the server's versions deciding conflicts per property. The UI shows which pages are available offline and when changes are pending.

**Permissions.** Access is inherited down the page tree: sharing a page with someone shares its subpages unless overridden. The server enforces permissions on every load, query and transaction; the client uses the effective permission to hide or disable editing. A database row inherits from its collection's page, which is why someone with view access to a database can't edit rows. Public sharing serves read-only pages through a separate, cacheable path.

**Search.** Server-side full-text search across pages the user can access, with recent pages and titles cached locally for instant quick-find, and filters for workspace, creator and date.

**Performance.** Large tables are virtualised in both directions; board columns virtualise cards; property cells use lightweight renderers until clicked into edit mode. Changes to one row only re-render that row, because components subscribe to records by id. Expensive formulas and rollups are computed server-side and cached."

#### Another worked example
**Moving a board card from 'In progress' to 'Done'.**
```
1. Drag ends over 'Done' column, between cards C4 and C7
2. Transaction:
   [ { op: 'set', table: 'block', id: C9, path: ['properties', statusPropId], value: 'Done' },
     { op: 'set', table: 'block', id: C9, path: ['format', 'boardOrder'], value: rankBetween(C4, C7) } ]
3. Apply optimistically → board, table view and open page for C9 all update from the store
4. Persist to outbox → send POST /saveTransactions
5. Server validates edit permission on the collection, applies, increments versions, notifies subscribers
6. Other users' boards receive the change and move the card
7. If rejected (permission removed), the client reverts and shows a message
```
Order within a group uses a fractional rank, so concurrent drags don't renumber the whole column.

#### A third worked example
**A 40,000-row CRM database (B2B) versus a personal habit tracker (B2C).**
- **CRM:** server-side queries with pagination, indexed properties for common filters, rollups computed server-side, virtualised table, saved views per team, permissions limiting who edits pipelines, and CSV import as a background job with progress.
- **Habit tracker:** 300 rows, fully cached locally, queries run on the client for instant filtering, works offline for weeks, and calendar view drives most interaction.
The same model scales by switching **where queries run**, which is a strong point to make in the interview.

#### Variations you might be asked
- "How would you implement formulas safely on the client and server?"
- "Design Airtable's grid with relational fields."
- "How would you implement page history and restore?"

#### Step-by-step framework
1. **Requirements**: pages, blocks, databases, property types, views, sharing, offline.
2. **Unified model**: blocks, collections, views; rows are pages.
3. **Architecture**: shared record store feeding sidebar, editor and views.
4. **Loading**: shallow tree, lazy pages, paginated view queries, prefetch, IndexedDB.
5. **Queries**: server-side for large collections, client-side for small cached ones; layouts as renderers.
6. **Relations, rollups, formulas**: where they're computed and how they update.
7. **Writes and sync**: optimistic transactions, outbox, versions, WebSocket notifications.
8. **Permissions, search and performance**: inheritance, server enforcement, virtualisation, per-record subscriptions.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Docs and databases as separate systems | Rows are pages; one record model |
| Loads the whole workspace | Shallow tree, lazy pages, paginated queries |
| Filters 50,000 rows in the browser | Server-side queries for large collections, local for small |
| Each view keeps its own copy of rows | Shared normalised store; edits appear everywhere |
| Permissions only in the UI | Inherited permissions enforced on every server read and write |
| Ignores offline | IndexedDB cache, outbox, version-based conflict handling |

#### Useful phrases
- "A database row is just a page with typed properties."
- "A view is a saved query plus a layout."
- "Where the query runs depends on how big the collection is."
- "Every screen reads the same record store, so an edit shows up everywhere."

#### Common pitfalls
- **Denormalising** rows into each view, so a linked view shows stale data.
- **Client-side rollups** that silently use incomplete data.
- Renumbering every card's position on each drag instead of using **fractional ranks**.
- Loading **entire page trees** recursively on open.
- Trusting the client to **enforce permissions**.
- Forgetting **schema changes**: renaming or deleting a property must update every view's filters and sorts.

#### Follow-ups to expect (with sample answers)
- **"What happens when someone changes a property type from text to select?"** — "It's a schema migration: the server converts values (creating options from distinct values), versions the collection, and views referencing that property update their filters. The client shows a confirmation because it can lose data."
- **"How do you keep a filtered view correct while someone else edits rows?"** — "On a change notification, the client re-evaluates the row locally if it can, or re-runs the query for that view, then animates rows in or out."
- **"How would templates work?"** — "A template is a page block whose subtree is copied with new ids when instantiated, with placeholders resolved, done server-side for large templates."
- **"How do you search permissions-aware?"** — "The search index stores access control info per page, and the server filters results by the user's effective permissions before returning them."
- **"How do you handle a page with 5,000 blocks?"** — "Load and render in chunks, virtualise far-off blocks, and defer heavy embeds until visible."

#### What senior interviewers look for
- Recognising the **unifying abstraction** and building on it.
- A **scalable loading and query strategy** with clear rules for client vs server work.
- **Correct sync and permission boundaries**.
- Thinking about **schema evolution** and real-world scale differences.

#### Practise it
- Model a projects database with a relation to tasks, a rollup of task estimates, and a board view grouped by status.
- Explain in 90 seconds how a linked database view stays in sync with the original.
- Checklist: requirements · rows are pages · collections and schemas · views as queries · shared record store · lazy loading · server vs client queries · rollups and formulas · optimistic transactions · outbox and offline · inherited permissions · search · virtualisation.

## Design a video streaming player (YouTube)
- id: fe-app-01
- roles: frontend, fullstack
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, video, media, player, streaming

### Prompt
Design the frontend of YouTube's watch page, with the video player at its centre. Cover the player's architecture (adaptive streaming, controls, captions, quality selection), fast start-up, ads, the surrounding page (comments, recommendations, live chat for live streams), analytics, accessibility, and how you'd make it fast on low-end phones and slow networks.

### Answer
#### What the interviewer is really testing
- Whether you can design a **media player as a component system**: playback engine, adaptive bitrate, controls UI, captions, ads, and analytics, each with clear boundaries.
- **Start-up performance**: time to first frame, preloading the right segments, the watch page's critical path.
- Knowledge of **MSE, HLS/DASH, ABR and codecs**, and how YouTube's free, ad-supported, global audience changes priorities compared with a subscription service (no heavy DRM for most content, huge device range, data-saving modes).
- **Ads integration** (pre-roll, mid-roll, VAST/IMA, measuring viewability) without breaking the content experience.
- **Live streaming** differences: low-latency HLS/DASH, live chat at scale, DVR window.
- **Accessibility and keyboard control** of a custom player.

#### Key points
- **Requirements:** watch page with player, title, channel, likes, description, comments, recommendations; play, pause, seek with thumbnails, volume, speed, quality, captions, theatre/fullscreen/picture-in-picture, autoplay next; ads; chapters; live streams with chat; resume where you left off; works on very slow connections and old devices.
- **Player architecture:**
  ```
  PlayerShell (React UI: controls, settings menu, captions overlay, ad overlay)
     │ commands / state
  PlayerCore (state machine: idle → loading → playing ⇄ paused ⇄ buffering → ended | error)
     ├─ StreamingEngine (manifest parsing, segment fetching, MSE SourceBuffers)
     ├─ ABRController (bandwidth + buffer + screen size → rendition)
     ├─ TextTracks (WebVTT/TTML parsing, rendering, styling)
     ├─ AdsManager (VAST/IMA SDK, schedule pre/mid/post-rolls, pause content)
     └─ Telemetry (QoE events: startup, rebuffers, bitrate switches, errors)
  ```
- **Streaming:** DASH or HLS with segments of 2 to 6 seconds; codec choice per device (AV1, VP9, H.264) via `MediaCapabilities.decodingInfo`; separate audio and video tracks so audio can stay high quality while video adapts.
- **Fast start:** inline the player config and first manifest in the HTML, preconnect to the video CDN, start at a conservative bitrate, fetch the first segments before the player UI fully hydrates, show the poster image immediately (likely the LCP element).
- **ABR:** combine throughput estimates and buffer level; cap resolution to the player's size and DPR; respect data-saver settings and user-chosen quality.
- **Seek previews:** storyboard sprite sheets (a grid of thumbnails per N seconds) loaded on hover.
- **Watch page around the player:** server-render title, description and metadata (SEO); load comments and recommendations lazily below the fold; recommendations prefetch the next video's metadata for autoplay.
- **Ads:** a separate ad player layer (often the IMA SDK in an iframe), content paused and its buffer kept, ad markers on the progress bar, viewability and quartile beacons.
- **Live:** low-latency playlists with partial segments, a 'Live' badge and catch-up, DVR seeking within a window; live chat via WebSocket with rate limiting, virtualised list and pausing auto-scroll when the user scrolls up.
- **Accessibility:** native-equivalent keyboard shortcuts (space/k, j/l, arrows, f, m, c), focusable controls with labels, a slider with `aria-valuetext` ('2 minutes 15 seconds of 10 minutes'), captions on by user preference, reduced motion for previews.

#### Model answer
"I'd split this into the player, which is a self-contained media system, and the watch page around it. The interesting difference from a subscription service like Netflix is the audience: YouTube is free, ad-funded and global, so it has to start fast on a cheap phone on 3G, handle ads gracefully, and support live streams, while heavy DRM matters less for most content.

**Requirements.** Play, pause, seek with thumbnail previews, quality and speed, captions, chapters, fullscreen and picture-in-picture, autoplay next, ads, resume position, and live streams with chat. The key metrics are time to first frame, rebuffering ratio and ad completion, on devices from flagship phones to five-year-old Androids.

**Player architecture.** I'd separate a framework-agnostic player core from the React controls UI. The core is a state machine: idle, loading, playing, paused, buffering, ended and error. It owns the streaming engine, which parses DASH or HLS manifests, fetches segments and appends them to Media Source Extensions buffers; the ABR controller; text tracks; the ads manager; and telemetry. The UI subscribes to core state and sends commands. Keeping the core independent means it can run in embeds on other sites, in the mobile web app and in TV apps, with different control skins.

**Codecs and streaming.** Video is encoded in several codecs. I'd ask the browser with `MediaCapabilities.decodingInfo` which ones it can decode smoothly and power-efficiently, preferring AV1 or VP9 where hardware supports them because they save bandwidth, and falling back to H.264. Audio and video are separate tracks, so on a weak connection video can drop to 240p while audio stays clear.

**Fast start.** The watch page HTML includes the player config and the first manifest inline, plus a preconnect to the video CDN, so the first segment request starts before JavaScript hydrates the page. The poster image is in the HTML with high fetch priority. The ABR starts at a modest rendition, then steps up as throughput is measured. On a hover over a thumbnail on the home page, I'd prefetch that video's metadata and maybe its first segment, so clicking feels instant.

**Adaptive bitrate.** The controller uses a throughput estimate and the buffer level, avoids oscillating, and caps resolution to the player's displayed size: there's no point fetching 1080p for a 360-pixel-wide mini player. Data-saver mode and a user-chosen quality override it.

**Seek previews and chapters.** Hovering the progress bar shows a thumbnail from a storyboard sprite sheet, one image with a grid of thumbnails every few seconds, loaded lazily on first hover. Chapters come from timestamps and render as segments on the bar.

**Ads.** Ads run in a separate layer, typically through an ads SDK in an iframe for isolation. For a pre-roll, the ad plays while the content's first segments buffer in the background, so content starts instantly after. For mid-rolls, the content pauses with its buffer kept, the ad plays, then content resumes. Ad markers appear on the progress bar, and the SDK fires quartile and viewability beacons. Ad failures time out quickly and fall back to content, because a broken ad must never block the video.

**The watch page.** Title, channel, description and structured metadata are server-rendered for SEO and fast display. Comments and recommendations load lazily, comments when scrolled into view, with cursor pagination and virtualisation for long threads. Recommendations prefetch the next video's metadata so autoplay is seamless. Navigation between videos is client-side, and the player instance is reused rather than destroyed, which avoids re-initialising codecs and lets picture-in-picture continue while browsing.

**Live streams.** Low-latency HLS or DASH with partial segments brings latency down to a few seconds. The player shows a Live badge, a 'jump to live' button when behind, and seeking within a DVR window. Live chat uses a WebSocket, batches incoming messages per animation frame, virtualises the list, pauses auto-scroll when the user scrolls up, and applies client-side rate limits and slow mode.

**Analytics.** Telemetry records startup time, rebuffer events, bitrate switches, errors and watch time, and sends them in batches with `sendBeacon` on page hide. Watch history and resume position are updated every few seconds of playback.

**Accessibility.** The custom controls are real buttons with labels, the progress bar is a slider with a human-readable value, keyboard shortcuts match what people expect, captions are on by default if the user prefers them, and caption styling is adjustable."

#### Another worked example
**Time to first frame on a slow 3G phone.**
```
Before: HTML 1.4s → JS bundle 3.2s → player init 0.6s → manifest 0.4s → first segment (720p) 2.8s = ~8.4s
After:
  - inline config + manifest in HTML, preconnect to CDN          (removes 0.4s, overlaps connection setup)
  - start first segment fetch from a tiny inline loader script    (overlaps with JS bundle download)
  - first segment at 240p (~60 KB instead of ~600 KB)             (2.8s → 0.5s)
  - poster image with fetchpriority=high as LCP                   (page looks ready at ~1.6s)
Result: first frame ~3s, then ABR steps up to 480p/720p as bandwidth allows
```

#### A third worked example
**Embedded player on third-party sites versus the YouTube watch page.**
- **Embed:** loads inside an iframe on someone else's page, so it must be tiny until clicked. A 'lite' facade (thumbnail and play button, under 10 KB) loads the full player only on click, protecting the host page's performance. It needs a postMessage API for host control and strict isolation.
- **Watch page:** the player is the main content, so it loads eagerly and keeps the instance alive across navigations.
Same player core; different loading strategy depending on whose page it is.

#### Variations you might be asked
- "Design YouTube Shorts (vertical swipe feed of short videos)."
- "How would you implement picture-in-picture that persists across page navigation?"
- "Design live streaming with sub-second latency for auctions."

#### Step-by-step framework
1. **Requirements**: player features, ads, live, audience and device range, metrics.
2. **Player architecture**: core state machine and modules, React controls on top.
3. **Streaming and codecs**: DASH/HLS, MSE, MediaCapabilities, separate audio.
4. **Fast start**: inline manifest, preconnect, low first rendition, poster as LCP, prefetch on hover.
5. **ABR**: throughput plus buffer, size caps, data saver.
6. **Ads**: separate layer, background content buffering, fast fallback.
7. **Watch page and live**: SSR metadata, lazy comments and recommendations, persistent player, live chat at scale.
8. **Analytics and accessibility**: QoE telemetry, beacons, keyboard and captions.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| A `<video src="video.mp4">` | MSE with DASH/HLS, codec selection and ABR |
| Player and page tightly coupled | Framework-agnostic core with a React skin, reused across navigations |
| Starts at high quality | Low first rendition and inline manifest for fast start |
| Ads block content when they fail | Separate ad layer with timeouts and fallback |
| Live is just a video | Low-latency playlists, DVR window, scalable live chat |
| Mouse-only controls | Labelled controls, slider semantics, standard shortcuts |

#### Useful phrases
- "The player core doesn't know React exists."
- "Start low, climb fast."
- "A broken ad must never block the video."
- "Cap the rendition to the size it's actually displayed at."

#### Common pitfalls
- Destroying and recreating the player on every **client-side navigation**.
- **Ignoring codec support**, so devices decode AV1 in software and drain the battery.
- Loading **comments and recommendations eagerly**, competing with the first segment.
- **Chat auto-scroll** that fights the user.
- No **error recovery**: segment retries, CDN failover, codec fallback.
- Sending **analytics per event** instead of batching.

#### Follow-ups to expect (with sample answers)
- **"How does this differ from Netflix?"** — "Netflix optimises for long sessions on big screens with strict DRM and a curated catalogue. YouTube optimises for instant start of short, ad-supported videos on any device, live streams, user-generated content and embeds."
- **"How would you implement Shorts?"** — "A vertical snap-scrolling feed that preloads the next two videos' first segments, keeps only a few player instances and recycles them, and pauses offscreen players."
- **"How do you measure quality of experience?"** — "Time to first frame, rebuffer ratio, average bitrate, playback failures and abandonment before start, segmented by device and network."
- **"What happens when the tab is hidden?"** — "Audio-only playback can continue for music; otherwise reduce buffering and pause analytics heartbeats."
- **"How do you test the player?"** — "Unit tests for the ABR logic with simulated bandwidth traces, integration tests with recorded manifests, and device-lab testing for codec and performance behaviour."

#### What senior interviewers look for
- **Clean modular player design** with reuse across surfaces.
- **Start-up performance** thinking tied to real network conditions.
- Product awareness of **ads, live and embeds**.
- Accessibility and **telemetry** treated as core requirements.

#### Practise it
- Play a DASH stream with dash.js or Shaka and log bitrate switches under DevTools network throttling.
- Sketch the player module diagram and explain it in two minutes.
- Checklist: requirements · core/UI split · codecs and MSE · fast start · ABR with caps · storyboards · ads layer · persistent player · lazy comments and recs · live chat · QoE telemetry · accessibility.

## Design a photo-sharing feed (Instagram)
- id: fe-app-02
- roles: frontend, fullstack
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, feed, images, upload, mobile web

### Prompt
Design the frontend of Instagram on the web: a media-first home feed of photos, carousels and short videos, stories at the top, likes and comments, and creating a post (select photos, crop, filter, caption, upload). Focus on what is specific to a visual, mobile-first product: image delivery, the upload and editing pipeline, stories, gestures and performance on phones.

### Answer
#### What the interviewer is really testing
- Treating this as a **media pipeline problem**, not just another feed: image formats, responsive sizes, placeholders, prefetching, decode cost and memory on phones.
- **Client-side media editing and upload**: cropping, filters on canvas or WebGL, resizing before upload, background upload with retries, optimistic posting.
- **Stories** as a separate experience: full-screen, timed, preloaded sequences with tap and swipe gestures.
- **Mobile web performance**: data usage, memory limits, low-end CPUs, installability (PWA).
- Reuse of feed fundamentals (cursor pagination, normalised cache, optimistic likes) without spending the whole interview on them.

#### Key points
- **Requirements:** home feed (posts with single images, carousels up to 10, short videos), stories tray with viewer, like (including double-tap), comment, save, share; profile grid; create post flow; works well on mid-range phones over 4G; installable; accessible.
- **Architecture:**
  ```
  App shell (SSR for profile/post pages, SPA navigation)
   ├─ StoriesTray ─► StoryViewer (full-screen, timed, preloaded)
   ├─ Feed (virtualised list of PostCards)
   │     PostCard: Header · Media (Image | Carousel | Video) · Actions · Caption · Comments preview
   ├─ CreatePost flow (select → crop → filter → caption → upload)
   └─ Data layer: normalised cache (posts, users, media), cursor pagination, optimistic mutations
  Media services: image CDN (resize/format on the fly), upload service (presigned URLs), service worker
  ```
- **Image delivery:** each media item has multiple renditions; use `srcset` with widths (320, 640, 1080) and `sizes` matching the layout; AVIF/WebP with JPEG fallback; fixed `aspect-ratio` from metadata (Instagram constrains ratios between 4:5 and 1.91:1) so there's no layout shift; tiny blurred placeholder (BlurHash or a 20px preview embedded in the API response).
- **Prefetching:** preload images for the next 2 to 3 posts beyond the viewport; for carousels, load only the first slide eagerly and the next slide on swipe intent; stop prefetching on slow or data-saver connections (`navigator.connection.saveData`, `effectiveType`).
- **Memory:** unload or downscale images far from the viewport (virtualisation), pause offscreen videos, limit concurrent image decodes, use `decoding="async"`.
- **Videos in feed:** muted autoplay only when at least 50% visible, pause when scrolled away, poster first, HLS for longer clips, and one playing video at a time.
- **Stories:** a full-screen viewer with progress bars, tap right/left for next/previous, swipe down to close, hold to pause; preload the next story's media while the current one plays; mark as seen; timers pause when the tab is hidden.
- **Create post:** read files with `<input type="file" accept="image/*" multiple>`; decode with `createImageBitmap`, crop and filter on canvas (WebGL for filters), resize to max 1080px wide and encode to JPEG/WebP client-side (saves upload time and data), handle EXIF orientation; upload directly to storage with presigned URLs, with retries and progress; optimistic post appears at the top of the profile with 'Posting…'.
- **Interactions:** optimistic likes with double-tap heart animation (transform/opacity only), comments with optimistic insert, save to collections.
- **Accessibility:** alt text (user-written plus automatic descriptions), carousel controls as buttons with 'Photo 2 of 5', stories with pause control and keyboard navigation, captions on videos.

#### Model answer
"I'll assume the feed basics, cursor pagination, a normalised cache and optimistic likes, are similar to any social feed, and spend most of my time on what makes Instagram different: it's media-first and mobile-first, so images, video, stories and the upload pipeline dominate both the user experience and the performance budget.

**Requirements.** Home feed of single photos, carousels and short videos; stories at the top; like, double-tap like, comment, save and share; profile grids; a create-post flow with crop, filters and caption. Targets: fast feed on a mid-range phone over 4G, sensible data use, no layout shift, smooth scrolling.

**Architecture.** An app shell with client navigation, server-rendering for public profile and post pages for SEO and link previews. The feed is a virtualised list of post cards. Each card has a header, a media component that switches on type, actions, caption and a comments preview. Media comes from an image CDN that generates renditions on demand; uploads go directly to storage via presigned URLs. A service worker caches the shell and recently viewed media for fast repeat visits.

**Image delivery.** This is the biggest lever. The API returns, for each media item, its aspect ratio, a tiny placeholder and a URL template for the CDN. Each image uses `srcset` with a few widths and `sizes` matching the layout, so a phone downloads a 640-pixel AVIF instead of a 1080-pixel JPEG. The container's `aspect-ratio` comes from the metadata, so nothing shifts when the image loads, and the blurred placeholder shows instantly. The first post's image is the LCP element, so it loads eagerly with high priority; everything else is lazy.

**Prefetching and memory.** As the user scrolls, I prefetch images for the next two or three posts so they're ready when they appear. In carousels, only the first slide loads eagerly; the second loads when the user starts swiping or when the post is fully in view. On slow connections or with data saver on, I prefetch less and pick smaller renditions. Phones run out of memory quickly with dozens of decoded photos, so virtualisation removes far-away cards, videos outside the viewport are paused and their sources released, and decoding is async.

**Video.** Feed videos autoplay muted when at least half visible, using an IntersectionObserver, and only one plays at a time. They show a poster first and use short HLS streams so quality adapts. Tapping unmutes and the choice is remembered for the session.

**Stories.** The tray loads the list of users with active stories and their seen state. The viewer is a full-screen route with segmented progress bars. Each story has a duration; tapping the right side advances, the left goes back, holding pauses, swiping down closes, and swiping sideways moves between users. While one story plays, the next one's media is preloaded so transitions are instant. Seen state is updated optimistically and batched to the server. Timers pause when the tab is hidden or when the user opens the reply box.

**Create post.** Users pick photos with a file input, or drag and drop on desktop. I decode them with `createImageBitmap`, respecting EXIF orientation, and let users crop to an allowed aspect ratio and apply filters. Filters are WebGL shaders for speed, with a canvas 2D fallback. Before uploading, I resize to 1080 pixels wide and re-encode, which cuts a 6MB phone photo to a few hundred kilobytes and makes uploads fast on mobile data. Upload goes straight to storage with presigned URLs, with progress, retries and the ability to continue if the user navigates. The post appears immediately on the profile as 'Posting…', and is confirmed when the server finishes processing.

**Interactions.** Likes are optimistic. Double-tap shows a heart animation that uses only transform and opacity, so it stays smooth. Comments appear optimistically with a pending state.

**Accessibility.** Alt text for every image, written by the user with an automatic description as a fallback, carousel controls as buttons announcing 'Photo 2 of 5', stories with a visible pause button and keyboard support, and captions for videos. Double-tap is a shortcut, never the only way to like."

#### Another worked example
**Client-side resize before upload.**
```ts
async function prepareImage(file: File, maxWidth = 1080): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
}
```
A 4032×3024 photo (about 5MB) becomes a roughly 300KB WebP. Doing it in a worker with `OffscreenCanvas` keeps the UI responsive while several photos are processed. The server still validates and creates its own renditions; the client step just saves bandwidth and time.

#### A third worked example
**Instagram (consumer, mobile web) versus a B2B digital asset manager.**
- **Instagram:** small images, aggressive compression, prefetch for scrolling, data-saving modes, stories and gestures, optimistic everything.
- **Asset manager (e.g. a brand team's photo library):** original-quality files must be preserved, uploads are huge and resumable (multipart), metadata and tagging matter, grids show thousands of thumbnails with virtualisation, and downloads need specific formats.
Both are image-heavy, but one optimises for speed and data, the other for fidelity and organisation.

#### Variations you might be asked
- "Design Pinterest's masonry grid with infinite scroll."
- "How would you build Instagram Reels (vertical video feed)?"
- "Design the photo editor with filters and adjustments."

#### Step-by-step framework
1. **Requirements**: post types, stories, interactions, create flow, mobile constraints.
2. **Architecture**: shell, virtualised feed, media components, stories viewer, create flow, CDN and upload service.
3. **Image delivery**: renditions, srcset/sizes, modern formats, aspect ratio, placeholders, LCP image.
4. **Prefetch and memory**: lookahead, carousel strategy, data saver, virtualisation, decode limits.
5. **Video**: visibility-based autoplay, one at a time, HLS.
6. **Stories**: timed viewer, gestures, preloading, seen state.
7. **Create post**: decode, crop, filters, resize, direct upload, optimistic post.
8. **Interactions and accessibility**: optimistic likes, smooth animations, alt text, controls.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Same 1080px image for every device | srcset/sizes, AVIF/WebP, CDN renditions |
| Images pop in and shift content | aspect-ratio from metadata plus blurred placeholders |
| Uploads the 6MB original over mobile data | Client-side resize and re-encode, direct-to-storage upload |
| All carousel slides load at once | First slide eager, next on swipe intent |
| Every visible video plays | One muted video at a time, visibility-based |
| Double-tap is the only way to like | Accessible button plus the gesture |

#### Useful phrases
- "On Instagram, the media pipeline is the product."
- "The API should give me the aspect ratio before the pixels."
- "Resize on the device, validate on the server."
- "Prefetch ahead, but back off when the network or data saver says so."

#### Common pitfalls
- **Lazy-loading the first image**, delaying LCP.
- Ignoring **EXIF orientation**, so photos upload sideways.
- **Memory crashes** on long scroll sessions from too many decoded images.
- **Story timers** that keep running in background tabs.
- Heavy filter processing on the **main thread**.
- Forgetting **alt text** for a visual product.

#### Follow-ups to expect (with sample answers)
- **"How do you make the feed work offline?"** — "Cache the last feed response and its smallest renditions via the service worker, show them with an offline banner, and queue likes and comments."
- **"How would you implement BlurHash placeholders?"** — "The API includes a short hash per image; the client decodes it to a tiny canvas or data URL and shows it as the background until the real image loads."
- **"What's the LCP element and how do you optimise it?"** — "Usually the first post's image: server-render the first posts, give that image `fetchpriority="high"`, preconnect to the CDN, and serve an appropriately sized rendition."
- **"How do you handle a failed upload?"** — "Keep the processed files in memory or IndexedDB, retry with backoff, show 'Couldn't post, tap to retry', and never lose the user's caption."
- **"How would you add tagging people in photos?"** — "Store tags as normalised coordinates on the media item, render them as positioned buttons on tap, and make them reachable by keyboard with a list alternative."

#### What senior interviewers look for
- Focus on **what's unique** to a media-first product rather than repeating generic feed design.
- **Mobile constraints** handled explicitly: data, memory, CPU.
- A **robust upload pipeline** with good UX for failure.
- **Accessibility** in a visual product.

#### Practise it
- Build a post card with srcset/sizes, aspect-ratio, BlurHash placeholder and lazy loading, and measure CLS.
- Implement client-side resize with OffscreenCanvas in a worker and compare file sizes.
- Checklist: requirements · virtualised feed · renditions and formats · aspect ratio · placeholders · LCP image · prefetch with data saver · memory limits · video autoplay rules · stories viewer · create flow · direct upload · optimistic interactions · alt text.

## Design an analytics dashboard
- id: fe-app-03
- roles: frontend, fullstack
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, dashboard, data visualisation, charts, performance

### Prompt
Design the frontend of a product analytics dashboard like Google Analytics, Mixpanel or Datadog. Users see a grid of widgets (KPIs, line and bar charts, tables, funnels) over a selectable date range and filters, can customise and save dashboards, share them, and drill down into details. Some widgets update in near real time. Cover architecture, data fetching, the widget model, chart rendering, performance with large datasets, and accessibility.

### Answer
#### What the interviewer is really testing
- **Widget architecture**: a dashboard as configuration (layout plus widget definitions with queries), rendered by a registry of widget types.
- **Data fetching at scale**: many independent queries, shared global filters, caching, cancellation, server-side aggregation, and not overloading the backend.
- **Chart rendering choices**: SVG vs Canvas vs WebGL depending on data volume, and downsampling.
- **State in the URL**: date range and filters shareable and bookmarkable.
- **Real-time updates** without re-rendering everything or hammering the API.
- **Failure isolation**, loading states, empty states and **accessible charts**.

#### Key points
- **Requirements:** dashboards with a grid of widgets; widget types (KPI with comparison, line/area, bar, pie/donut, table, funnel, heatmap); global date range with comparison period and timezone; global and per-widget filters; drag-and-drop layout editing; saved and shared dashboards with permissions; drill-down to a detailed view; export to CSV/PNG; some widgets refresh every few seconds.
- **Dashboard as data:**
  ```
  Dashboard { id, name, layout: [{ widgetId, x, y, w, h }], globalFilters, defaultRange, ownerId, sharing }
  Widget    { id, type: 'kpi'|'timeseries'|'bar'|'table'|'funnel', title,
              query: { metric, dimensions, filters, granularity, comparison }, display: { stacked, colours, axis } }
  ```
  A widget registry maps `type` to a component, a query builder, and a settings editor.
- **Architecture:**
  ```
  URL state (range, filters, compare) ─► Dashboard page
       │                                   │ layout (react-grid-layout)
       ▼                                   ▼
   Global filter bar                 WidgetFrame × N (error boundary, Suspense, header, menu)
                                           │ useWidgetData(widget.query + global filters)
                                           ▼
                           Query client (TanStack Query: cache key = resolved query, dedupe, abort)
                                           │ batched POST /query  (server aggregates, returns series)
                                           ▼
                                   Analytics query API (pre-aggregated tables, cache)
  ```
- **Data fetching:** each widget fetches independently so one slow query doesn't block the rest; the cache key is the fully resolved query (metric, filters, range, granularity, timezone); identical queries are deduplicated; changing the date range aborts in-flight requests; a small batching layer can combine requests into one HTTP call; limit concurrency so 30 widgets don't send 30 heavy queries at once; load widgets below the fold when visible.
- **Server does the heavy lifting:** aggregation, bucketing by granularity and top-N happen in the query engine; the client receives already-summarised series (hundreds of points, not millions of events).
- **Granularity:** pick bucket size from the range (minutes for an hour, hours for a day, days for a quarter) to keep points per series under about 500 to 1,000.
- **Rendering:** SVG charts (Recharts, Visx, ECharts SVG mode) for typical widget sizes; Canvas (ECharts, uPlot) for dense time series or many series; WebGL for millions of points (scatter plots, heatmaps). Downsample (LTTB) client-side if a series is still too dense.
- **Real-time:** for live widgets, poll at an interval or subscribe via WebSocket/SSE; append new points instead of refetching the whole range; pause when the tab is hidden or the widget is offscreen.
- **Resilience:** each widget in its own error boundary with retry; partial data warnings; stale data shown with a timestamp while refreshing.
- **Accessibility:** every chart has a text summary and a data table alternative, keyboard-focusable data points with tooltips, colour palettes that work for colour blindness with patterns or labels, and no meaning conveyed by colour alone.

#### Model answer
"I'd design the dashboard as configuration rendered by a widget registry, with each widget responsible for its own data, loading state and errors, and the server responsible for aggregation.

**Requirements.** A grid of widgets: KPIs, time series, bars, tables, funnels. A global date range with comparison and timezone, global filters, customisable layouts, saved and shared dashboards, drill-down, export, and some live widgets. Performance goals: the first widgets render within about a second, interactions with filters feel instant, and a 30-widget dashboard doesn't overload the browser or the backend.

**Dashboard as data.** A dashboard is a record with a layout, a list of widget positions and sizes, and widget definitions. Each widget has a type, a title, a query, meaning metric, dimensions, filters, granularity and comparison, and display options. A registry maps each type to its renderer, a function that builds its API query, and a settings panel. Adding a new widget type means registering those three things.

**URL state.** The date range, comparison and global filters live in the URL, so a link reproduces exactly what someone sees, the back button works, and refreshing keeps the context. I parse and validate them with a schema and default sensibly.

**Data fetching.** Each widget calls a hook that merges its own query with the global filters and asks TanStack Query for data. The cache key is the fully resolved query, so two widgets showing the same metric share one request, and switching back to a previous date range is instant from cache. When the user changes the range, in-flight queries are aborted. Widgets fetch independently and render as their data arrives, so one slow funnel doesn't block the KPIs. To avoid sending 30 heavy queries at once, a small client-side queue limits concurrency to around six, prioritising widgets in the viewport, and widgets below the fold start fetching when they're near the viewport. Optionally, a batching layer combines requests made in the same tick into one HTTP call.

**The server does aggregation.** The client never processes raw events. The query API aggregates by time bucket and dimension, applies top-N for breakdowns, and returns compact series. I choose the granularity from the range so each series has at most several hundred points: five-minute buckets for the last hour, hourly for a week, daily for a quarter.

**Rendering.** For typical widgets, SVG charting is fine and easy to make accessible. For dense time series, like a monitoring dashboard with 20 series of 2,000 points each, I'd switch to a Canvas library such as uPlot or ECharts in canvas mode, which handles that easily. For truly huge point clouds, WebGL. If a series still has more points than pixels, I downsample with LTTB, which keeps the shape including peaks.

**Layout editing.** Edit mode uses a grid layout library for drag and resize, with keyboard alternatives to move and resize widgets. Changes save to the dashboard record with optimistic updates, and the layout is responsive: widgets stack into one column on small screens.

**Real time.** Live widgets poll at an interval or subscribe to a server-sent event stream, and append new points instead of refetching the whole range. Polling pauses when the tab is hidden or the widget is offscreen, and backs off on errors.

**Resilience.** Each widget sits in an error boundary and a Suspense boundary, so a failing query shows a compact error with Retry while the rest of the dashboard works. When data is refreshing, I keep showing the previous data with a subtle 'updating' indicator and the last-updated time, instead of flashing spinners.

**Drill-down and export.** Clicking a bar or point navigates to a detail view with the clicked dimension added as a filter in the URL. Export uses the same query: CSV from the API for full data, PNG from the chart.

**Accessibility.** Every chart has a short text summary, like 'Sign-ups rose 12% week over week, peaking on Tuesday', a 'View as table' toggle, keyboard navigation between data points with announced values, and a palette that's distinguishable for colour-blind users, with labels or patterns so colour isn't the only signal."

#### Another worked example
**A dashboard that froze when the range changed to 'Last 90 days'.**
```
Before: 24 widgets, each fetching raw hourly data (2,160 points × up to 10 series),
        all requests fired at once, results re-rendered by SVG charts with tooltips on every point
        → 6s main-thread freeze, backend timeouts
After:
  - granularity auto-switches to daily for 90 days (90 points per series)
  - concurrency queue of 6, viewport widgets first, abort on range change
  - SVG for small widgets, uPlot canvas for the two dense ones
  - previous data shown while refreshing, per-widget skeleton only on first load
Result: first widgets in ~800ms, no long tasks over 100ms, backend load down ~70%
```

#### A third worked example
**Customer-facing embedded analytics (B2B SaaS) versus an internal ops dashboard.**
- **Embedded for customers:** each customer sees only their data (tenant id enforced server-side), dashboards are templated by us with limited customisation, branding matches the host app, embedding via iframe or SDK with signed tokens, and performance must be consistent for small and huge customers.
- **Internal ops (Datadog-style):** many live widgets, dense time series, heavy customisation, keyboard-driven exploration, and tolerance for complexity in exchange for power.
Same widget architecture; different permissions, customisation and rendering density.

#### Variations you might be asked
- "Design a real-time monitoring dashboard with alerts."
- "How would you build a drag-and-drop report builder?"
- "Design Google Analytics' funnel exploration."

#### Step-by-step framework
1. **Requirements**: widget types, filters, range, customisation, sharing, live data, scale.
2. **Dashboard as data**: layout, widget definitions, registry.
3. **URL state** for range and filters.
4. **Data fetching**: per-widget queries, resolved cache keys, dedupe, abort, concurrency, viewport priority.
5. **Server aggregation and granularity rules.**
6. **Rendering choice**: SVG, Canvas, WebGL, downsampling.
7. **Real time and resilience**: append updates, pause when hidden, error boundaries, stale-while-refreshing.
8. **Editing, drill-down, export and accessibility.**

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| One giant request for the whole dashboard | Independent widget queries with dedupe and concurrency limits |
| Client aggregates raw events | Server aggregates; client receives compact series |
| Same granularity for every range | Granularity derived from range to cap points |
| SVG for everything | SVG, Canvas or WebGL chosen by density, plus downsampling |
| Filters in component state | Filters and range in the URL |
| One failing widget breaks the page | Per-widget error boundaries and stale data with timestamps |
| Charts without alternatives | Text summaries, data tables, keyboard access, colour-safe palettes |

#### Useful phrases
- "A dashboard is configuration; widgets are plugins in a registry."
- "The browser should never see raw events."
- "Pick the bucket size so points per series stay below the pixel width."
- "Show yesterday's numbers while today's load, with a timestamp."

#### Common pitfalls
- **Cache keys missing the timezone** or comparison period, causing wrong data.
- Firing **every query at once** on load and on every filter change.
- Re-rendering **all widgets** when one widget's data changes.
- **Flashing spinners** on every refresh instead of keeping stale data.
- Colour-only legends that colour-blind users can't read.
- Live widgets **polling in background tabs** forever.

#### Follow-ups to expect (with sample answers)
- **"How do you handle timezones?"** — "Queries carry an explicit timezone (the user's or the account's reporting timezone), buckets are computed server-side in that zone, and the UI labels it. DST days have 23 or 25 hours, which the server handles."
- **"How would you cache across users?"** — "The query API caches identical aggregated queries for a short time; for shared dashboards, many viewers benefit. Per-user data uses user-scoped keys."
- **"How do you test charts?"** — "Unit-test data transforms and granularity rules, visual regression for chart rendering, and accessibility checks on the summaries and tables."
- **"What if a query takes 30 seconds?"** — "Run it asynchronously on the server, show progress, let the user keep working, and cache the result. Consider pre-aggregated rollup tables for common queries."
- **"How do you make dashboards load faster on repeat visits?"** — "Persist the query cache to IndexedDB and render cached data immediately with a 'last updated' label, then refresh in the background."

#### What senior interviewers look for
- **Extensible widget architecture** and configuration-driven design.
- Careful **data fetching discipline** that protects both browser and backend.
- **Rendering choices** justified by data volume.
- Attention to **URL state, resilience and accessibility** of data visualisation.

#### Practise it
- Build a two-widget dashboard where both widgets read the range from the URL and share a TanStack Query cache entry for the same metric.
- Write the granularity rule as a function and test it for 1 hour, 7 days and 90 days.
- Checklist: requirements · dashboard config · widget registry · URL state · resolved cache keys · abort and concurrency · server aggregation · granularity · rendering choice · downsampling · live updates · error boundaries · stale-while-refreshing · drill-down · accessible charts.

## Design a travel booking site (Airbnb)
- id: fe-app-04
- roles: frontend, fullstack
- round: FE_SYSTEM_DESIGN_APPLICATION
- difficulty: hard
- levels:
- tags: system-design, search, maps, booking, ecommerce

### Prompt
Design the frontend of a travel booking site like Airbnb: search by destination, dates and guests; browse results in a list alongside an interactive map; filter by price, type and amenities; view a listing with photos, availability calendar, reviews and price breakdown; and book with payment. Cover the architecture, search and map interaction, URL state, rendering strategy, the booking flow and its reliability, internationalisation and performance.

### Answer
#### What the interviewer is really testing
- Designing the **search experience as the product**: the list and the map in sync, moving the map changing the results, and filters, dates and guests all in the URL.
- **Map engineering**: a vector map library, clustering many markers, debounced "search this area", hovering a card highlights its pin, and not re-rendering hundreds of markers.
- **Availability and pricing** that depend on dates and guests: total price with fees and taxes, minimum stays, blocked nights, prices that change between search and checkout.
- **A reliable booking flow**: holds or instant book, idempotent reservation, payment with strong customer authentication, and clear failure states.
- **Rendering per page**: server-rendered listing pages for SEO, client-heavy search, private booking pages.
- **Global product concerns**: currencies, languages, time zones of the property, accessibility of maps and calendars.

#### Key points
- **Requirements:** home with search bar (where, check-in/check-out, guests); results page with list and map; filters (price range with histogram, type, rooms, amenities, instant book); listing page (gallery, description, amenities, host, reviews, location map, availability calendar, price breakdown); wishlists; booking (dates, guests, price confirmation, payment, house rules agreement, message to host); trips page; mobile and desktop; many languages and currencies.
- **Architecture:**
  ```
  Home (SSR, cached) ── search bar ──► /s/{place}?checkin&checkout&adults&price_min&bounds&zoom
                                          │
                Search page (client-heavy) │
                ├─ Filter bar / modal      ▼
                ├─ Results list  ◄── useSearch(params) ── GET /search (cursor, bounds, filters)
                └─ Map (MapLibre/Google) ◄─┘  markers = price pills; clustering; "search as I move"
  Listing page (SSR/ISR for content) + client islands: calendar, price quote, reserve card
  Booking page (private, dynamic) → quote → hold → payment (provider SDK) → confirmation
  ```
- **URL as state:** place, dates, guests, filters, map bounds and zoom are all search params, so searches are shareable and the Back button restores the exact view. Use `replace` while panning the map, `push` for explicit filter changes.
- **List–map sync:** results and markers come from the same query; hovering a card highlights its marker (shared hovered id in a small store, not a re-render of every marker); clicking a marker scrolls to or previews the card.
- **Map performance:** render prices as markers via the map library's native layers or a small number of DOM markers; cluster at low zoom (supercluster); debounce bound changes (about 400ms) and abort stale searches; only refetch when the bounds change meaningfully.
- **Dates and price:** search results show nightly or total price for the selected dates; the listing page requests a **price quote** for the exact dates and guests (nightly rates, cleaning fee, service fee, taxes, discounts); the calendar shows blocked dates and minimum-stay rules fetched per month.
- **Booking reliability:** the quote has an id and expiry; reservation requests carry an **idempotency key**; payment uses the provider's hosted fields and handles 3-D Secure; double-booking is prevented server-side with a hold or a transactional availability check; the UI handles 'dates no longer available' and 'price changed' explicitly.
- **Rendering:** listing pages server-rendered and cached (SEO, sharing), with dynamic islands for availability and price; search pages server-render the first results for popular destinations, then go client-side; booking and trips pages are private and dynamic.
- **i18n:** prices in the user's currency (formatted with `Intl.NumberFormat`), charged in a stated currency; dates as plain calendar dates in the property's time zone; RTL support; translated reviews on demand.

#### Model answer
"For a booking site the search page is the heart of the product, so I'd spend most of the design there, then cover the listing page and the booking flow, which has to be reliable because money and availability are involved.

**Requirements.** Search by destination, dates and guests; results in a list next to a map; filters; listing pages with photos, calendar, reviews and a price breakdown; wishlists; and booking with payment. Non-functionally: fast first results, smooth map interaction on phones, shareable search URLs, SEO for listing and destination pages, and correct prices and availability at checkout.

**Search state lives in the URL.** Destination, check-in and check-out, guests, every filter, and the map's bounds and zoom are search params. That makes searches shareable, lets the back button return to exactly where you were, and makes the URL the single source of truth: the results query and the map both derive from it. While the user pans the map I update the URL with `replace`, so history isn't flooded; an explicit filter change uses `push`.

**List and map.** One query, driven by the URL, returns a page of listings with coordinates and prices. The list renders cards with lazy-loaded image carousels; the map renders a price pill per listing. They share a small 'hovered listing' store: hovering a card updates one id, and only the two affected markers re-render, not all of them. Clicking a pin opens a preview card on the map and scrolls the list. When the user moves the map, 'search as I move the map' triggers a new query, debounced by about 400 milliseconds, with the previous request aborted so slow responses can't overwrite newer ones. I only refetch if the bounds changed meaningfully, so tiny drags don't cause requests.

**Map performance.** A map with hundreds of DOM markers gets slow on phones. I'd keep the number of rendered markers small: the API returns at most a page of results for the visible area, nearby markers cluster at low zoom, and markers are memoised by listing id. For heavy cases, rendering prices as a symbol layer in the map library's WebGL canvas is much cheaper than DOM elements. On mobile, the map is a separate full-screen view toggled from the list, rather than both on screen.

**Filters.** Filters open in a modal on mobile and apply on 'Show 312 places', where the count comes from a lightweight count endpoint called as the user changes options. The price filter shows a histogram of prices for the current search, which helps people pick a sensible range.

**Listing page.** Content that changes rarely, like photos, description, amenities and host info, is server-rendered and cached, because listing pages need SEO and fast loading from shared links. Availability and pricing depend on dates and guests, so they're client-side islands: the calendar fetches blocked dates and minimum-stay rules per month, and when dates are chosen, the reserve card requests a price quote for exactly those dates and guests: nightly rates, cleaning fee, service fee, taxes and any weekly discount. The gallery uses responsive images with the first one prioritised as the LCP element.

**Booking flow.** The quote returned by the server has an id and an expiry. The booking page shows the breakdown again, collects payment through the provider's hosted fields, so card data never touches our servers, and handles strong customer authentication challenges. The reserve request carries an idempotency key, so a double click or retry after a timeout can't create two bookings or two charges. Availability is re-checked transactionally on the server; if the dates were taken or the price changed since the quote, the UI explains exactly what changed and asks the user to confirm, never silently charging a different amount. For request-to-book listings, the payment is authorised but not captured until the host accepts, and the UI makes that status clear.

**Rendering strategy.** Destination landing pages and listing pages are server-rendered and cached for SEO. The search page server-renders the first results for common searches, then hydrates into a client-driven experience. Booking, trips and inbox pages are private and dynamic.

**Internationalisation.** Prices display in the user's chosen currency with `Intl.NumberFormat`, with a clear note of the currency actually charged. Check-in and check-out are plain calendar dates in the property's time zone, never converted through the user's time zone. Languages, RTL layouts and on-demand review translation are supported.

**Accessibility.** The map is an enhancement: every result is reachable in the list, map pins are buttons with labels like 'Flat in Lisbon, £120 per night', the date picker supports typed input and keyboard navigation, and the price breakdown is plain text, not only visuals."

#### Another worked example
**Panning the map.**
```
User drags map → map 'moveend' fires (once, not continuously)
  → compare new bounds with last searched bounds: moved > 20% of viewport? zoom changed?
  → yes: router.replace('?…&ne=38.75,-9.10&sw=38.69,-9.20&zoom=13')
  → useSearch(params) key changes → abort previous request → GET /search?bounds=…
  → keepPreviousData: old pins and cards stay visible, dimmed slightly, until new results arrive
  → new results: markers diffed by listing id (unchanged pins don't re-render), list scrolls to top
```

#### A third worked example
**Price changed between search and checkout.** A guest sees £120 per night in search, opens the listing a day later, and books. The host raised the price overnight.
```
Search result price (cached, approximate) → £120 × 4 = £480
Listing quote for exact dates/guests     → £135 × 4 + fees = £612 (quote id q_91, expires in 30 min)
Reserve with quote id q_91 + idempotency key
  Server: quote still valid? availability still free? → yes → book
  If quote expired and price differs → 409 PRICE_CHANGED { newTotal } → UI shows old vs new, asks to confirm
```
The rule: the user always confirms the exact amount charged, and the server is the source of truth for price and availability.

#### Variations you might be asked
- "Design hotel search with real-time room inventory from many suppliers."
- "Design a flight search with fare classes and seat selection."
- "How would you build the host's calendar and pricing tool?"

#### Step-by-step framework
1. **Requirements**: search, map, filters, listing, booking, global audience, SEO.
2. **URL as state** for every search input including map bounds.
3. **List–map architecture**: one query, shared hover state, debounced and aborted bound searches.
4. **Map performance**: page limits, clustering, memoised or WebGL markers, mobile toggle.
5. **Listing page**: cached content plus availability and price islands.
6. **Quotes and booking**: quote ids, idempotency keys, hosted payments, SCA, transactional availability.
7. **Rendering per page** and **i18n**: currencies, plain calendar dates, languages.
8. **Accessibility**: list-first, labelled pins, accessible date picker.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Filters and map position in component state | Everything in the URL, shareable and back-button friendly |
| Every map drag fires a request | Debounced, aborted, only on meaningful moves |
| Hover re-renders all markers | Shared hovered id; only affected markers update |
| Search price shown as the final price | Exact quote for dates and guests, confirmed at checkout |
| Retry can double-book | Idempotency key and server-side availability check |
| Map-only results | List always available; map is an enhancement |

#### Useful phrases
- "The URL is the search."
- "Search prices are estimates; the quote is the truth."
- "Every reservation request carries an idempotency key."
- "The map is an enhancement; the list must work on its own."

#### Common pitfalls
- **Converting check-in dates through time zones**, shifting bookings by a day.
- Hundreds of **DOM markers** on mobile.
- **Race conditions** when panning quickly, showing results for an old area.
- Treating payment authorisation and **booking confirmation** as the same thing for request-to-book.
- Forgetting **currency display vs charge currency**.
- No handling of **'dates just got booked'**.

#### Follow-ups to expect (with sample answers)
- **"How would you prevent two guests booking the same nights?"** — "Server-side: a transactional check-and-insert on availability, or a short hold when checkout starts. The frontend just handles the conflict clearly."
- **"How do you make the search page fast on first load?"** — "Server-render the first results for the URL, cache popular destination searches at the edge, load the map library lazily after the list, and prioritise the first card image."
- **"How do wishlists work for logged-out users?"** — "Prompt to sign in on the heart click, then complete the save after login, keeping the listing id in the redirect state."
- **"How would you test the booking flow?"** — "Unit-test the price breakdown, MSW for quote and booking error cases, and a Playwright journey in payment test mode including a 3-D Secure challenge."
- **"How do you handle many currencies?"** — "Rates from the server per session, prices formatted with Intl, and the charged currency always shown on checkout."

#### What senior interviewers look for
- **Search UX depth**: URL state, list–map sync, map performance.
- **Correctness around money and availability** with idempotency and quotes.
- **Rendering choices** matched to each page's needs.
- **Global and accessible** design.

#### Practise it
- Build a list plus map with MapLibre where hovering a card highlights one marker without re-rendering others.
- Write the state diagram for quote, hold, payment, confirmation and the failure branches.
- Checklist: requirements · URL state with bounds · debounced aborted searches · keepPreviousData · clustering · listing islands · quote with expiry · idempotent booking · hosted payments and SCA · plain calendar dates · currency display · accessible map and calendar.
