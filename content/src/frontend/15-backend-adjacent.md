# Frontend Engineer — Backend-Adjacent

## REST vs GraphQL vs tRPC. When use which?
- id: 88bd14a7-fa3c-4363-97b0-76afcc520f25
- roles: frontend, fullstack, ai
- round: BACKEND_ADJACENT
- difficulty: medium
- levels:
- companies: Stripe, OpenAI
- tags: backend, API-design

### Prompt
Compare REST, GraphQL and tRPC from a frontend engineer's point of view. What does each do well, what are the costs, and how would you choose for (a) a public API, (b) a product with web and mobile clients and many teams, and (c) a small full-stack TypeScript app?

### Answer
#### What the interviewer is really testing
- Understanding each approach's **model**: resources over HTTP (REST), a typed graph queried by clients (GraphQL), and TypeScript procedures shared between client and server (tRPC).
- **Trade-offs** that matter to frontends: over-fetching and under-fetching, number of round trips, type safety, caching, tooling, versioning, error handling, file uploads, real time.
- **Organisational fit**: who owns the API, how many clients, whether consumers are external.
- A **context-driven recommendation**, not a favourite.

#### Key points
- **REST:** resources and HTTP verbs (`GET /orders/123`), status codes, simple and universal, works with HTTP caching and CDNs, easy for public and third-party consumers. Downsides: fixed response shapes cause **over-fetching** (too many fields) and **under-fetching** (several requests to build one screen); types aren't shared unless you add OpenAPI and generate clients.
- **GraphQL:** a schema of types; clients ask for exactly the fields they need in one request; strong tooling (codegen, Apollo, Relay, urql); a single endpoint across many services (federation). Downsides: HTTP caching harder (POSTs to one URL; use persisted queries and GET), server complexity (N+1 queries, needing DataLoader), query cost limits for security, error handling inside 200 responses, file uploads awkward, learning curve.
- **tRPC:** call server functions from the client with **end-to-end TypeScript types inferred directly**, no schema or codegen. Very fast for full-stack TypeScript monorepos. Downsides: tied to TypeScript on both ends, not suitable as a public API for other languages, couples client and server deployment, less standard HTTP semantics.
- **Others worth naming:** OpenAPI with generated typed clients gives REST much of tRPC's type safety; gRPC/gRPC-web for internal services; Server Actions in Next.js for app-internal mutations.
- **Choosing:**
  - Public API for third parties → **REST** with OpenAPI (Stripe's model), maybe webhooks.
  - Many clients (web, iOS, Android) with varied data needs and many backend teams → **GraphQL** (often federated) or a BFF per client.
  - Small or medium full-stack TypeScript app, one team → **tRPC** or Server Actions.

#### Model answer
"I'd frame it around who consumes the API and how varied their needs are.

**REST** models resources: `GET /orders/123`, `POST /orders`, with HTTP status codes and caching headers. Its strengths are universality, any language and tool can call it, and HTTP caching: CDNs and browsers can cache GET responses with ETags and `Cache-Control`. For a frontend, the pain points are shape mismatches. An order screen might need `/orders/123`, `/customers/9` and `/products?ids=...`, three round trips, which hurts on mobile, while each response includes fields we don't use. Types aren't shared by default, but publishing an OpenAPI spec and generating a typed client solves most of that.

**GraphQL** gives clients a typed schema to query. The order screen asks for exactly `order { id total items { name qty } customer { name } }` in one request. That's great when many clients, a web app, iOS and Android, need different shapes from the same data, and when data lives across many services that can be federated behind one graph. Tooling like codegen gives typed hooks per query, and Relay's fragments let each component declare its own data needs. The costs: caching moves from HTTP to the client cache, because everything is a POST to one endpoint, unless you use persisted queries over GET; the server needs DataLoader to avoid N+1 database queries; you must limit query depth and cost to stop abusive queries; and errors arrive inside a 200 response, so error handling is different.

**tRPC** is for full-stack TypeScript. You define procedures on the server, and the client calls them with types inferred directly from the server code, with no schema file or codegen. Rename a field on the server and the client fails to compile immediately. It's the fastest developer experience for a small team in a monorepo. The costs: both sides must be TypeScript, it's not a public API for other languages, and client and server are coupled, so independent mobile apps on old versions are a problem.

**My choices:**
- **(a) Public API:** REST with an OpenAPI spec, versioning, idempotency keys and webhooks. That's what Stripe does, and third parties expect it.
- **(b) Web plus mobile, many teams:** GraphQL, likely federated, so each team owns part of the graph and clients fetch exactly what each screen needs in one round trip. An alternative is REST with a backend-for-frontend per client.
- **(c) Small full-stack TypeScript app:** tRPC, or Next.js Server Actions for mutations. Maximum type safety, minimal ceremony.

These aren't exclusive. A common setup is internal tRPC or GraphQL for the product, plus a public REST API for integrations."

#### Another worked example
**Fixing a waterfall without changing the backend style.** A dashboard made 14 REST calls, some dependent on others, taking 2.3 seconds on 4G. Options: (1) add a REST aggregate endpoint `/dashboard-summary` owned by the frontend team (a mini BFF); (2) put a GraphQL layer over the existing services; (3) parallelise and prefetch. They chose the aggregate endpoint: one request, 600ms, and no new technology. The lesson: the problem was round trips and shapes, which several approaches can solve.

#### A third worked example
**GraphQL pitfalls in practice.** A team adopted GraphQL and saw database load triple: a query for 50 orders with their customers caused 51 database queries. DataLoader batching fixed the N+1 pattern. Later, a crafted deeply nested query took down a service, so they added depth limits, cost analysis and persisted queries (only pre-registered queries allowed from their own clients).

#### Variations you might be asked
- "What are the downsides of GraphQL?"
- "How would you make a REST API type-safe for the frontend?"
- "Would you use GraphQL for a public API?"

#### Step-by-step framework
1. **Identify consumers**: public, internal, how many clients and languages.
2. **Describe each model** briefly.
3. **Compare** shape flexibility, round trips, types, caching, tooling, operations.
4. **Name costs**: N+1 and query limits (GraphQL), coupling (tRPC), shape mismatch (REST).
5. **Recommend per scenario** and note hybrids.
6. **Mention alternatives**: OpenAPI codegen, BFF, Server Actions, gRPC-web.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "GraphQL is better than REST" | Choice depends on consumers and organisation |
| Ignores caching | Explains HTTP caching vs client caching |
| tRPC for everything | Notes TypeScript-only and coupling limits |
| No mention of N+1 or query limits | Covers DataLoader, depth and cost limits |
| Assumes REST can't be typed | OpenAPI with generated clients |

#### Useful phrases
- "REST optimises for universality, GraphQL for client flexibility, tRPC for TypeScript developer speed."
- "Most frontend pain with REST is round trips and shapes, not REST itself."
- "GraphQL moves complexity from the client to the server."
- "tRPC is great until you need a client that isn't your TypeScript app."

#### Common pitfalls
- Choosing GraphQL for **one web client** with simple needs.
- Forgetting **security limits** on GraphQL queries.
- Using tRPC for an API that **mobile apps on old versions** depend on.
- No **versioning strategy** for REST.
- Assuming GraphQL removes the need for **pagination and caching design**.

#### Follow-ups to expect (with sample answers)
- **"How does caching work in GraphQL clients?"** — "Apollo and Relay normalise objects by type and id, so updating an order anywhere updates every query showing it."
- **"How do you version GraphQL?"** — "Evolve the schema additively and deprecate fields, rather than versioning the whole API."
- **"How do you handle file uploads?"** — "Usually outside GraphQL: get a presigned URL from a mutation, upload directly to storage."
- **"What about real time?"** — "GraphQL subscriptions over WebSocket, tRPC subscriptions, or SSE alongside REST."
- **"What is a persisted query?"** — "The client sends a hash of a pre-registered query instead of the text, allowing GET caching and blocking arbitrary queries."

#### What senior interviewers look for
- **Balanced, scenario-based** judgement.
- Understanding of **operational costs**, not just developer experience.
- Awareness of **hybrid** architectures.

#### Practise it
- Sketch the same order screen's data fetching in REST, GraphQL and tRPC, counting round trips and noting where types come from.
- Explain in two minutes what you'd choose for a startup with one web app and a planned mobile app.
- Checklist: consumers · shapes and round trips · types · caching · server costs · security limits · coupling · recommendation per scenario.

## WebSocket vs SSE vs polling. Trade-offs?
- id: 127ecd28-2109-4c0b-8ed5-c6393881e73b
- roles: frontend, fullstack, ai
- round: BACKEND_ADJACENT
- difficulty: medium
- levels:
- companies: Anthropic, OpenAI
- tags: backend, realtime

### Prompt
Compare short polling, long polling, server-sent events (SSE) and WebSockets for getting real-time updates into a web app. When would you choose each? Cover reconnection, scaling, proxies and infrastructure, authentication, and what you'd use for an AI chat that streams tokens, a live dashboard, and a collaborative editor.

### Answer
#### What the interviewer is really testing
- Knowing **how each transport works** at the HTTP level and the direction of data flow.
- Practical concerns: **reconnection and missed messages, proxies and load balancers, HTTP/2, connection limits, server cost, authentication, mobile battery**.
- Picking the **simplest thing that works** for each use case.
- Awareness of **streaming with fetch** for AI responses and newer options (WebTransport).

#### Key points
- **Short polling:** the client asks every N seconds (`setInterval` + fetch). Simple, works everywhere, cacheable, but wastes requests and has up to N seconds of latency.
- **Long polling:** the client sends a request that the server holds open until there's data or a timeout, then the client immediately reconnects. Lower latency than polling, works through any proxy, but each message costs a full request and servers must hold many pending requests.
- **SSE (server-sent events):** one long-lived HTTP response with `Content-Type: text/event-stream`, server → client only. Built-in `EventSource` with **automatic reconnection** and `Last-Event-ID` resume. Plain HTTP, works well with HTTP/2 (multiplexed, no 6-connection limit per domain like HTTP/1.1). Limitations: text only, one direction, and `EventSource` only supports GET without custom headers (use `fetch` streaming for POST bodies or auth headers).
- **WebSocket:** an upgraded TCP connection with **full-duplex** messaging (text or binary) and low overhead per message. Best for frequent two-way traffic: chat with typing indicators, games, collaborative editing, presence. Costs: stateful connections (sticky routing or a pub/sub backbone like Redis to fan out across servers), proxies and corporate firewalls sometimes interfere, no built-in reconnection or message replay (you build heartbeats, backoff and resync), authentication on connect.
- **Streaming responses with `fetch`:** read `response.body` as a stream; the standard approach for AI token streaming (often in SSE format) because it allows POST with a JSON body and auth headers.
- **Choosing:**
  - Updates every minute or two, simple dashboard → **polling** (with `visibilitychange` pause).
  - Server-to-client feed (notifications, live scores, AI token streams, progress) → **SSE / fetch streaming**.
  - Frequent two-way, low-latency interaction (chat, multiplayer, collaboration) → **WebSocket**.
- **Always design for:** reconnection with exponential backoff and jitter, resuming from the last event id or a cursor, de-duplication, pausing when the tab is hidden, and server limits.

#### Model answer
"I'd pick based on direction, frequency and how much infrastructure complexity is justified.

**Short polling** is just asking on a timer: fetch `/notifications` every 30 seconds. It's simple, stateless, works through every proxy and can use HTTP caching, but it wastes requests when nothing changes and adds up to the interval in latency. For a dashboard that updates every minute, it's often the right answer, especially if I pause it when the tab is hidden.

**Long polling** holds the request open on the server until there's news, then the client reconnects. It gives near-real-time updates using plain HTTP, so it works in very restrictive networks, which is why libraries like Socket.IO used it as a fallback. But each message costs a whole request, and the server holds many hanging requests.

**Server-sent events** keep one HTTP response open and the server writes events into it. It's one-directional, server to client, which covers a surprising number of cases: notifications, live scores, progress updates and AI token streaming. The browser's `EventSource` reconnects automatically and sends `Last-Event-ID`, so the server can resume where it left off. Because it's plain HTTP, it works with existing load balancers, and with HTTP/2 many streams share one connection, avoiding the old six-connections-per-domain limit. The catch is that `EventSource` only does GET without custom headers, so for AI chat, which needs a POST with the conversation and an auth header, I use `fetch` and read the response body as a stream, parsing the SSE format myself.

**WebSockets** upgrade the connection to a full-duplex channel. Both sides can send messages at any time with tiny overhead, and binary data is supported. That's what I'd use when the client sends frequently too: chat with typing indicators and presence, multiplayer games, collaborative editing. The cost is operational. Connections are stateful, so with several servers you need a pub/sub layer like Redis to deliver a message to whichever server holds the recipient's connection. There's no built-in reconnection or replay, so I'd implement heartbeats to detect dead connections, reconnection with exponential backoff and jitter, and a resync step that fetches missed messages since the last sequence number. Authentication happens on connect, usually with a cookie or a short-lived token, and permissions must be checked per subscription.

**For the three examples:**
- **AI chat streaming tokens:** fetch streaming in SSE format. It's request-response shaped: one request, one streamed reply. Stop is just aborting the fetch.
- **Live dashboard:** polling every 30 to 60 seconds if freshness requirements are loose, or SSE if updates are frequent; pause when hidden.
- **Collaborative editor:** WebSocket, because edits, cursors and presence flow constantly in both directions."

#### Another worked example
**Reconnection done properly (WebSocket).**
```ts
function connect(lastSeq: number, attempt = 0) {
  const ws = new WebSocket(WS_URL + '?since=' + lastSeq);
  let heartbeat: number;
  ws.onopen = () => { attempt = 0; heartbeat = window.setInterval(() => ws.send('{"type":"ping"}'), 25000); };
  ws.onmessage = (e) => { const msg = JSON.parse(e.data); if (msg.seq <= lastSeq) return; lastSeq = msg.seq; apply(msg); };
  ws.onclose = () => {
    clearInterval(heartbeat);
    const delay = Math.min(30000, 1000 * 2 ** attempt) * (0.5 + Math.random() / 2);   // backoff + jitter
    setTimeout(() => connect(lastSeq, attempt + 1), delay);
  };
}
```
The server replays messages after `since`, the client ignores duplicates by sequence number, and jitter stops thousands of clients reconnecting at the same moment after a server restart.

#### A third worked example
**Infrastructure surprise.** A team shipped SSE and found events arrived in bursts every few seconds instead of instantly. A proxy was buffering the response. Fixes: set `Cache-Control: no-cache`, disable proxy buffering (`X-Accel-Buffering: no` for nginx), send periodic comment lines (`:\n\n`) as keep-alives so idle connections aren't closed, and make sure compression doesn't buffer.

#### Variations you might be asked
- "How would you build live notifications for a web app?"
- "Why does ChatGPT-style streaming use SSE rather than WebSockets?"
- "How do you scale WebSockets to a million connections?"

#### Step-by-step framework
1. **Direction and frequency** of messages.
2. **Latency need** and acceptable cost.
3. **Describe options**: polling, long polling, SSE/fetch streaming, WebSocket.
4. **Operational concerns**: proxies, load balancing, HTTP/2, scaling, auth.
5. **Reliability**: reconnection, backoff with jitter, resume, de-duplication.
6. **Efficiency**: pause when hidden, batch updates, mobile battery.
7. **Recommend per use case.**

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "WebSockets for everything real-time" | Simplest transport for the direction and frequency |
| Ignores reconnection | Backoff, jitter, resume from last id, de-duplication |
| Uses EventSource with auth headers | Knows its limits; uses fetch streaming |
| Ignores scaling | Sticky sessions or pub/sub for WebSocket fan-out |
| Polls in background tabs | Pauses on visibilitychange |

#### Useful phrases
- "If only the server talks, SSE is usually enough."
- "WebSockets are cheap per message but expensive to operate."
- "Every real-time connection drops eventually; the question is what happens next."
- "AI streaming is request-response shaped, so fetch streaming fits."

#### Common pitfalls
- **No resync** after reconnect, silently losing messages.
- **Thundering herd** reconnections without jitter.
- **Proxy buffering** breaking SSE.
- Forgetting **per-subscription authorisation** on WebSocket channels.
- Keeping connections open in **hidden tabs** on mobile.

#### Follow-ups to expect (with sample answers)
- **"What's WebTransport?"** — "A newer API over HTTP/3 offering bidirectional streams and unreliable datagrams; useful for games and media, but support and infrastructure are less mature."
- **"How many SSE connections can a browser open?"** — "Over HTTP/1.1 about six per domain shared with other requests; over HTTP/2 many streams share one connection."
- **"How do you authenticate a WebSocket?"** — "Cookies on the handshake (with origin checks), or a short-lived token obtained over HTTPS, then validate subscriptions server-side."
- **"How do you share one connection across tabs?"** — "A SharedWorker or a leader tab elected with the Web Locks API, broadcasting messages via BroadcastChannel."
- **"How would you test reconnection?"** — "Kill the server or toggle offline in DevTools/Playwright and assert the UI recovers and shows missed messages."

#### What senior interviewers look for
- **Right-sizing** the solution.
- **Reliability engineering** around reconnection.
- **Infrastructure awareness**.

#### Practise it
- Build a tiny SSE endpoint and client, then kill the server and watch `EventSource` reconnect with `Last-Event-ID`.
- Implement the WebSocket reconnect above with a server that replays missed messages.
- Checklist: direction · frequency · simplest option · proxies · scaling · auth · reconnection with jitter · resume · dedupe · pause when hidden.

## Optimistic vs pessimistic updates. Failure modes?
- id: 1d732e4b-e664-4359-8996-cb8398f44027
- roles: frontend, fullstack, ai
- round: BACKEND_ADJACENT
- difficulty: medium
- levels:
- companies: Stripe, Meta
- tags: backend, UX-state

### Prompt
Explain optimistic and pessimistic UI updates. When do you use each, how do you implement optimistic updates with rollback, and what are the failure modes: errors, races between concurrent mutations, conflicts with other users, duplicates on retry and stale caches?

### Answer
#### What the interviewer is really testing
- Knowing the **trade-off**: perceived speed versus honesty about what has actually happened.
- Choosing by **risk and failure rate**: likes and reorders versus payments and deletes.
- Implementing optimistic updates **correctly**: snapshot, apply, rollback, reconcile with the server response.
- Understanding **failure modes**: out-of-order responses, concurrent mutations to the same item, server-side validation differences, conflicts with other users, retries causing duplicates, cache invalidation.
- **UX for failure**: clear errors, retry, preserving user input, undo as an alternative.

#### Key points
- **Pessimistic:** wait for the server before updating the UI; show a pending state. Use when the action is risky, irreversible, likely to fail, or the server decides the result (payments, booking, sending money, account deletion, complex validation).
- **Optimistic:** update the UI immediately, assuming success; reconcile with the server and roll back on failure. Use for frequent, low-risk, high-success actions (likes, toggles, renames, reordering, adding comments, marking read).
- **Implementation pattern:** snapshot previous state → apply change → send request → on success, replace with server data (real ids, computed fields) → on error, roll back and tell the user → finally, revalidate.
- **Failure modes:**
  - **Request fails:** roll back; show a clear, non-blocking error with retry; don't lose user input (e.g. keep a failed comment's text).
  - **Out-of-order responses:** two quick toggles; the first response arrives last and overwrites the second. Fix: cancel in-flight queries, send the final state, version numbers, or ignore stale responses.
  - **Concurrent mutations to one item:** rollback of one mutation can undo another's optimistic change; snapshot per mutation carefully, or serialise mutations per item.
  - **Server disagrees:** validation or business rules change the result (rounded price, renamed slug); reconcile with the server response.
  - **Conflicts with other users:** another user edited or deleted the item; use versions (ETag/If-Match) and handle 409 by showing the latest state.
  - **Duplicates on retry:** network timeout after the server succeeded; retries create two items. Fix: client-generated ids or idempotency keys.
  - **Stale caches elsewhere:** the item appears in several lists; update or invalidate all.
- **Alternative:** "undo" pattern for deletes: hide immediately, delay the real delete for a few seconds, offer Undo.

#### Model answer
"Optimistic updates show the result straight away, assuming the server will agree; pessimistic updates wait for the server. The choice is about risk: how likely is failure, and how bad is it if the user believes something happened that didn't?

**Pessimistic** is right for payments, bookings, transfers, sending emails to customers, or anything where the server decides the result. You show a clear pending state, 'Processing payment…', disable the button to prevent double submission, and then the confirmed result. Being honest beats being fast here.

**Optimistic** suits frequent, low-risk actions that almost always succeed: liking, starring, toggling a task, renaming, reordering, posting a comment. Waiting 300 milliseconds for each one makes the app feel sluggish.

**Implementation, with TanStack Query:**
```ts
const toggleTodo = useMutation({
  mutationFn: (t: Todo) => api.updateTodo(t.id, { done: !t.done }, { version: t.version }),
  onMutate: async (t) => {
    await qc.cancelQueries({ queryKey: ['todos'] });          // stop in-flight refetches overwriting us
    const previous = qc.getQueryData<Todo[]>(['todos']);
    qc.setQueryData<Todo[]>(['todos'], (old = []) => old.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    return { previous };
  },
  onError: (err, _t, ctx) => {
    qc.setQueryData(['todos'], ctx?.previous);                // roll back
    toast.error(err.status === 409 ? 'Someone else changed this task' : "Couldn't update the task. Try again.");
  },
  onSuccess: (saved) => qc.setQueryData<Todo[]>(['todos'], (old = []) => old.map((x) => (x.id === saved.id ? saved : x))),
  onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),   // reconcile with the server
});
```

**Failure modes I design for:**
1. **The request fails.** Roll back and say so clearly. For created content, like a comment, keep the text in the input or show it as 'Failed to send, tap to retry', so nothing the user typed is lost.
2. **Out-of-order responses.** If the user toggles twice quickly, the first request's response might arrive after the second and overwrite the state. Cancelling in-flight queries helps; sending the absolute desired state (`done: true`) rather than 'toggle' helps more; version numbers let the server reject stale writes.
3. **Concurrent mutations on the same item with rollback.** If mutation A fails after mutation B succeeded, restoring A's snapshot would undo B. So I roll back carefully, or serialise mutations per item, and always revalidate at the end.
4. **The server changes the result.** It might trim a name or assign a slug. On success I replace optimistic data with the server's version.
5. **Conflicts with other users.** Someone else edited or deleted the item. With version checks the server returns 409, and the UI shows the latest version instead of silently overwriting their work.
6. **Duplicates on retry.** If a create request times out after the server saved it, a retry creates a duplicate. Client-generated ids or idempotency keys make retries safe.
7. **Stale copies elsewhere.** The same item appears in the list, a detail view and a count badge. I update or invalidate all relevant queries.

**For deletes**, I often prefer an undo pattern: remove from view immediately, show 'Deleted. Undo', and only send the delete after a few seconds."

#### Another worked example
**Optimistic comment with a temporary id.**
```
User posts → insert { id: 'temp-7f3', text, status: 'sending' } at bottom, input cleared
Request POST /comments { clientId: 'temp-7f3', text } (clientId doubles as idempotency key)
Success → replace temp-7f3 with { id: 'c_981', ...server fields }, status removed
Timeout → retry with same clientId → server returns existing c_981, no duplicate
Failure → mark 'Failed to send' with Retry and Edit, text preserved
```

#### A third worked example
**Choosing per action in a banking app (Monzo/Revolut style).**
- Rename a savings pot, change a card's nickname, mark a notification read: **optimistic**.
- Freeze a card: **optimistic with careful messaging**? No: security-related, so **pessimistic** with a fast spinner, because the user must be sure it's frozen.
- Send money: **pessimistic**, with clear pending and final states.
The rule: optimistic only when being briefly wrong is harmless.

#### Variations you might be asked
- "How does React 19's useOptimistic compare?"
- "How would you implement undo for deletes?"
- "How do you handle offline mutations?"

#### Step-by-step framework
1. **Classify the action** by risk, failure rate and reversibility.
2. **Pessimistic path**: pending state, disable double submit, clear result.
3. **Optimistic path**: snapshot, apply, send, reconcile, roll back, revalidate.
4. **Races**: cancel in-flight, absolute values, versions.
5. **Conflicts**: version checks, 409 handling.
6. **Retries**: idempotency keys or client ids.
7. **UX for failure**: preserve input, retry, clear message; consider undo.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Optimistic everywhere | Chooses by risk; payments stay pessimistic |
| No rollback | Snapshot and rollback with a clear error |
| Sends 'toggle' commands | Sends absolute state, handles out-of-order responses |
| Retries create duplicates | Idempotency keys or client-generated ids |
| Keeps optimistic data forever | Reconciles with server data and revalidates |

#### Useful phrases
- "Optimistic only when being briefly wrong is harmless."
- "Send the desired state, not 'toggle'."
- "Every create carries an id the server can deduplicate on."
- "Failed actions keep the user's input."

#### Common pitfalls
- **Silent rollbacks** that confuse users.
- **Out-of-order** responses flipping state back.
- **Lost input** on failed posts.
- **Duplicate** records from retries.
- **Optimistic financial actions**.

#### Follow-ups to expect (with sample answers)
- **"How does useOptimistic work?"** — "It shows an optimistic value only while an action is pending and automatically falls back to real state when the action ends."
- **"What if the user navigates away before the request finishes?"** — "Mutations should continue (TanStack Query keeps them running) and errors still surface via a global toast."
- **"How do you test optimistic updates?"** — "MSW with delays and failures: assert the UI changes immediately, then rolls back with an error on failure."
- **"What's an ETag-based conflict check?"** — "The client sends `If-Match` with the version it edited; the server rejects with 412 or 409 if the resource changed."
- **"What about offline?"** — "Queue mutations locally with ids, apply optimistically, and sync later with conflict handling."

#### What senior interviewers look for
- **Risk-based judgement**.
- **Correct handling of races, retries and conflicts**.
- **User-centred failure UX**.

#### Practise it
- Implement an optimistic toggle with rollback and simulate a slow, failing server with MSW.
- Write the decision for five actions in an app you know: optimistic, pessimistic or undo, with reasons.
- Checklist: risk classification · snapshot/rollback · reconcile · absolute values · versions · idempotency · preserve input · revalidate.

## Explain CORS and the most common gotchas
- id: 4d50fc50-f6e0-441f-9e88-96d9326ada88
- roles: frontend, fullstack, ai
- round: BACKEND_ADJACENT
- difficulty: medium
- levels:
- companies: Stripe, Apple
- tags: backend, security, browser

### Prompt
What is CORS, why does it exist, and how does it work? Explain simple versus preflighted requests, credentials, and the most common CORS errors frontend engineers hit, how to diagnose them, and how to fix them correctly (rather than with a browser extension or a wildcard).

### Answer
#### What the interviewer is really testing
- Understanding the **same-origin policy** that CORS relaxes, and that CORS is enforced **by the browser**, not the server.
- Knowing what counts as an **origin** (scheme, host, port).
- **Simple vs preflighted** requests: what triggers an `OPTIONS` preflight and what headers the server must return.
- **Credentials**: cookies and auth headers, `credentials: 'include'`, why `Access-Control-Allow-Origin: *` can't be used with them.
- Diagnosing errors from the **console and Network tab**, and fixing them on the right side.
- Knowing CORS is **not** a security control for servers (curl ignores it), and not a CSRF defence.

#### Key points
- **Same-origin policy:** scripts on `https://app.example.com` can't read responses from `https://api.other.com` unless that server allows it. Origin = scheme + host + port; `http://localhost:3000` and `http://localhost:8080` are different origins.
- **CORS** lets a server declare which origins may read its responses via headers like `Access-Control-Allow-Origin`.
- The browser still **sends** many cross-origin requests; CORS controls whether JavaScript can **read** the response (and, with preflight, whether the request is sent at all).
- **Simple requests** (GET, HEAD, POST with only safe headers and `Content-Type` of `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`) are sent directly; the response must include an allowed origin.
- **Preflighted requests:** anything else (PUT, DELETE, PATCH, `Content-Type: application/json`, custom headers like `Authorization`) triggers an `OPTIONS` request first. The server must reply with `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` (and optionally `Access-Control-Max-Age` to cache the preflight).
- **Credentials:** to send cookies cross-origin, the client uses `credentials: 'include'` and the server must return `Access-Control-Allow-Credentials: true` and an **explicit origin** (not `*`). Cookies also need `SameSite=None; Secure` if the sites are cross-site.
- **Reading response headers:** custom response headers are hidden unless listed in `Access-Control-Expose-Headers`.
- **Common errors and fixes:**
  - "No 'Access-Control-Allow-Origin' header" → server doesn't allow that origin (or the request failed before CORS headers were added, e.g. a 500 or a proxy error page).
  - Preflight fails (404 or 405 on OPTIONS, or auth middleware rejecting OPTIONS) → handle OPTIONS before auth.
  - Wildcard with credentials → echo an allowlisted origin and add `Vary: Origin`.
  - Missing allowed header (`Authorization`, `Content-Type`) in `Access-Control-Allow-Headers`.
  - Redirects on preflight (http → https, trailing slash) → preflights can't follow redirects.
- **Fix on the server or avoid cross-origin entirely** with a same-origin proxy (dev server proxy, a BFF or rewrite rules).
- **Security:** don't reflect any origin with credentials; CORS doesn't stop non-browser clients or CSRF.

#### Model answer
"CORS exists because of the browser's same-origin policy. By default, JavaScript running on one origin, meaning scheme, host and port, can't read responses from another origin. That protects users: a malicious site you visit can't use your logged-in session to read your bank's API responses. CORS is how a server opts in, saying 'these origins may read my responses'.

It's enforced by the browser. The server just sends headers; the browser decides whether to hand the response to your JavaScript. That's why the same request works in curl or Postman but fails in the browser, and also why CORS isn't a server security control: non-browser clients ignore it.

**Simple versus preflighted requests.** A 'simple' request, like a GET or a form-style POST with no custom headers, is sent straight away, and the browser checks the response for `Access-Control-Allow-Origin` matching our origin. Anything else gets a preflight first: an `OPTIONS` request asking 'may I send a PUT with these headers?' JSON bodies and an `Authorization` header both trigger it, which means most API calls from SPAs are preflighted. The server must answer the OPTIONS with the allowed origin, methods and headers. `Access-Control-Max-Age` lets the browser cache the answer so not every call pays an extra round trip.

**Credentials.** If the API uses cookies, the client sets `credentials: 'include'`, and the server must return `Access-Control-Allow-Credentials: true` with an explicit origin; the wildcard `*` isn't allowed with credentials. Cross-site cookies also need `SameSite=None; Secure`, and some browsers block third-party cookies anyway, which is a reason to put the API on the same site.

**Common gotchas, and how I diagnose them.** I look at the Network tab, not just the console message.
- **The preflight fails.** The OPTIONS request returns 401 because auth middleware runs before CORS, or 404 because the route only handles POST. Fix: handle OPTIONS early, before auth.
- **'No Access-Control-Allow-Origin header' on an error.** The real problem is a 500 or a gateway error page that doesn't include CORS headers, so the browser reports CORS instead of the actual error. Make sure error responses include CORS headers too, and check server logs.
- **Wildcard with credentials.** Replace `*` with the specific origin from an allowlist, and add `Vary: Origin` so caches don't serve one origin's headers to another.
- **Missing allowed headers**, like `Authorization` or a custom `X-Request-Id`.
- **Redirects.** A preflight to `http://` that redirects to `https://`, or to a URL without the trailing slash, fails because preflights can't follow redirects.
- **Can't read a response header**, like pagination links or a request id: it must be listed in `Access-Control-Expose-Headers`.
- **localhost ports**: `localhost:3000` calling `localhost:8080` is cross-origin.

**The right fixes.** Configure CORS on the server with an explicit allowlist, or avoid cross-origin requests entirely: in development, use the dev server's proxy; in production, serve the API from the same origin through a reverse proxy or BFF (`app.example.com/api`). Never fix it with a browser extension that disables CORS, or by reflecting whatever origin is sent while allowing credentials, which would let any website read your users' data."

#### Another worked example
**Reading the Network tab.**
```
OPTIONS https://api.example.com/orders   → 401 Unauthorized
  Request:  Origin: https://app.example.com
            Access-Control-Request-Method: POST
            Access-Control-Request-Headers: authorization, content-type
  Response: (no Access-Control-* headers)
Console: "Response to preflight request doesn't pass access control check"
Cause: auth middleware rejects OPTIONS (browsers never send Authorization on preflight)
Fix:   CORS middleware first; respond 204 to OPTIONS with
       Access-Control-Allow-Origin: https://app.example.com
       Access-Control-Allow-Methods: GET, POST, PUT, DELETE
       Access-Control-Allow-Headers: authorization, content-type
       Access-Control-Max-Age: 600
```

#### A third worked example
**A dangerous 'fix' found in review.** A server set `Access-Control-Allow-Origin` to the request's `Origin` header for every request, with `Access-Control-Allow-Credentials: true`. That means any website a logged-in user visits can call the API with their cookies and read the response, a serious data leak. The fix: an explicit allowlist of origins, `Vary: Origin`, and alerts on unexpected origins.

#### Variations you might be asked
- "Why does my request work in Postman but not in the browser?"
- "What's the difference between CORS and CSRF?"
- "How do you set up CORS for a public API?"

#### Step-by-step framework
1. **Explain the same-origin policy** and the definition of an origin.
2. **Explain CORS** as server opt-in enforced by the browser.
3. **Simple vs preflighted** and what triggers a preflight.
4. **Credentials rules**: include, Allow-Credentials, no wildcard, cookie attributes.
5. **Diagnose** with the Network tab: preflight status, headers, real errors.
6. **Fix on the right side**: server allowlist or same-origin proxy.
7. **Security notes**: no reflection with credentials, CORS isn't CSRF protection.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Add `*` and it works" | Explicit allowlist; no wildcard with credentials |
| Thinks CORS blocks requests from being sent | Explains read access vs preflight |
| Debugs from the console message only | Inspects the preflight and real status in Network tab |
| Disables CORS in the browser | Fixes server config or uses a same-origin proxy |
| Calls CORS a CSRF defence | Explains they protect different things |

#### Useful phrases
- "CORS is the browser asking the server for permission to let JavaScript read the response."
- "It works in Postman because Postman isn't a browser."
- "A CORS error on a 500 is often a server error in disguise."
- "The best CORS fix is often not being cross-origin at all."

#### Common pitfalls
- **Reflecting any origin** with credentials.
- **Auth before CORS** middleware.
- Forgetting **`Vary: Origin`** behind caches.
- **Redirecting preflights**.
- Not exposing **custom response headers**.

#### Follow-ups to expect (with sample answers)
- **"Does CORS protect the server?"** — "No. It protects users' data in browsers. Servers still need authentication and authorisation."
- **"Why does a JSON POST trigger a preflight?"** — "`application/json` isn't a 'simple' content type, so the browser asks permission first."
- **"What does `Access-Control-Max-Age` do?"** — "Caches the preflight result for that long, avoiding an extra round trip per request (browsers cap it)."
- **"How do you handle CORS for many customer domains?"** — "Look up the origin against the allowlist stored per customer and echo it if allowed, with Vary: Origin."
- **"What about `mode: 'no-cors'`?"** — "It sends the request but gives you an opaque response you can't read; it doesn't solve CORS for API calls."

#### What senior interviewers look for
- **Precise model** of what the browser enforces.
- **Efficient debugging**.
- **Security-aware** fixes.

#### Practise it
- Run two local servers on different ports and reproduce a preflight failure, then fix it.
- Explain CORS versus CSRF in 45 seconds.
- Checklist: same-origin · origin definition · simple vs preflight · credentials rules · Network tab · allowlist · Vary · same-origin proxy · security notes.

## What's a JWT and what are its drawbacks?
- id: 633cc264-be79-44e9-996d-e9e342175b2b
- roles: frontend, fullstack, ai
- round: BACKEND_ADJACENT
- difficulty: medium
- levels:
- companies: Stripe, Monzo, Revolut
- tags: backend, security, auth

### Prompt
What is a JSON Web Token (JWT), how is it structured and verified, and when is it a good fit? What are its drawbacks compared with server-side sessions: revocation, size, storage in the browser, algorithm pitfalls and data exposure? How would you design authentication for a web app using JWTs safely?

### Answer
#### What the interviewer is really testing
- Knowing the **structure**: header, payload (claims) and signature, Base64URL-encoded, **signed not encrypted**.
- Understanding **stateless verification** and why that's both the benefit and the main drawback (**revocation**).
- Awareness of **security pitfalls**: `alg: none`, algorithm confusion (RS256 vs HS256), weak secrets, missing `exp`/`aud`/`iss` checks, sensitive data in the payload.
- **Browser storage trade-offs** (covered in depth elsewhere) at a summary level.
- Knowing **when sessions are better**, and the common **short access token + refresh token** design.

#### Key points
- **Structure:** `header.payload.signature`, each part Base64URL-encoded.
  - Header: `{ "alg": "RS256", "typ": "JWT", "kid": "key-2026-10" }`.
  - Payload: claims like `sub` (user id), `iat`, `exp`, `aud`, `iss`, scopes or roles.
  - Signature: HMAC (HS256, shared secret) or RSA/ECDSA (RS256/ES256, private key signs, public key verifies).
- **Signed, not encrypted:** anyone can decode the payload (paste it into a decoder). Never put secrets or personal data you wouldn't show the user. (JWE is the encrypted variant.)
- **Verification:** check the signature with the expected algorithm and key, then `exp`, `nbf`, `iss`, `aud`. Without a database lookup, any service with the public key can verify, which is why JWTs suit **distributed systems and third-party APIs** (OAuth/OIDC access and ID tokens).
- **Drawbacks:**
  - **Revocation:** a valid token stays valid until it expires; logging out or banning a user doesn't invalidate it unless you add a deny-list or check a session/version on each request (which removes the stateless benefit).
  - **Staleness:** roles or permissions in the token stay old until refresh.
  - **Size:** tokens are larger than session ids and sent on every request.
  - **Storage:** in `localStorage` it's readable by any XSS; in cookies it needs CSRF protection.
  - **Implementation pitfalls:** accepting `alg: none`; algorithm confusion where a server verifying RS256 is tricked into HS256 using the public key as the secret; weak HMAC secrets; not checking `aud`, so a token for one service works on another.
- **Typical safe design:** short-lived access tokens (5 to 15 minutes) and rotating refresh tokens in an HttpOnly cookie (with reuse detection), or a BFF holding tokens server-side with a session cookie to the browser.
- **Sessions are often simpler** for a single web app: an opaque id in an HttpOnly cookie, server-side state, instant revocation.

#### Model answer
"A JWT is a compact, signed token that carries claims about a user. It has three Base64URL-encoded parts separated by dots: a header saying which algorithm and key were used, a payload with claims like the user id (`sub`), expiry (`exp`), issuer (`iss`) and audience (`aud`), and a signature over the first two parts.

The key word is signed, not encrypted. Anyone can decode the payload, so it should never contain secrets or personal data beyond what's necessary. The signature only guarantees that the contents weren't changed and that someone with the key issued it.

**Why use one?** Verification is stateless. A service checks the signature with a shared secret (HS256) or, better for distributed systems, a public key (RS256 or ES256), then checks expiry, issuer and audience, without a database lookup. That's great when many services or third parties need to verify identity, which is why OAuth and OpenID Connect use JWTs for access and ID tokens.

**The drawbacks:**
- **Revocation.** Because nothing is looked up, a stolen or logged-out token stays valid until it expires. You can add a deny-list or a per-user token version checked on each request, but then you've reintroduced state. The practical answer is short lifetimes.
- **Stale claims.** If a user's role changes, tokens issued earlier still carry the old role until they're refreshed.
- **Size.** JWTs are often hundreds of bytes to a few kilobytes, sent with every request, versus a 32-byte session id.
- **Browser storage.** Stored in `localStorage`, any XSS or compromised script can steal the token and use it elsewhere. Stored in a cookie, it's protected from JavaScript with HttpOnly but needs CSRF defences.
- **Implementation pitfalls.** Libraries have historically accepted `alg: none`, meaning no signature; algorithm confusion can let an attacker sign an HS256 token with the server's public RSA key if the verifier doesn't pin the algorithm; weak HMAC secrets can be brute-forced; and forgetting to check `aud` lets a token for one service be used on another.

**A safe design for a web app:** if it's one web app with its own backend, I'd often just use **server-side sessions**: an opaque id in a `__Host-` HttpOnly, Secure, SameSite cookie, with instant revocation. If we need JWTs, for example many microservices or an external identity provider, I'd use short-lived access tokens, 5 to 15 minutes, and rotating refresh tokens kept in an HttpOnly cookie scoped to the refresh endpoint, with reuse detection that revokes the session if an old refresh token is replayed. Even better for SPAs is a backend-for-frontend that holds the tokens server-side and gives the browser only a session cookie. On the verification side: pin the algorithm, use asymmetric keys with key ids and rotation, and always check `exp`, `iss` and `aud`."

#### Another worked example
**Decoding a token to show it isn't secret.**
```
eyJhbGciOiJSUzI1NiIsImtpZCI6ImsxIn0.eyJzdWIiOiJ1XzQyIiwiZW1haWwiOiJhbmFAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3OTk5OTk5OTl9.<signature>
header  → { "alg": "RS256", "kid": "k1" }
payload → { "sub": "u_42", "email": "ana@example.com", "role": "admin", "exp": 1799999999 }
```
Anyone can read the email and role. Changing `role` to something else breaks the signature, but reading it needs no key, so a token in a URL, a log or analytics leaks this data.

#### A third worked example
**Banning an abusive user (fintech).** Support bans an account, but the user keeps making API calls for 55 minutes because access tokens lasted an hour. Fixes: cut access token lifetime to 5 minutes, revoke the refresh token family on ban, and for high-risk actions (transfers) check the session state server-side on every request regardless of the token. Regulated products often keep this server-side check for sensitive operations.

#### Variations you might be asked
- "Sessions or JWTs for a new web app?"
- "How do refresh tokens work, and what is rotation?"
- "What's the difference between an ID token and an access token?"

#### Step-by-step framework
1. **Structure**: header, payload, signature; Base64URL; signed not encrypted.
2. **Verification**: algorithm, key, exp, iss, aud.
3. **Good fits**: distributed services, third-party identity, OAuth/OIDC.
4. **Drawbacks**: revocation, staleness, size, storage, pitfalls.
5. **Safe design**: sessions for simple apps; short access tokens plus rotating refresh tokens or a BFF.
6. **Operational details**: key rotation, clock skew, logging hygiene.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "JWTs are encrypted" | Signed, not encrypted; payload readable |
| "Stateless is always better" | Explains revocation and staleness costs |
| Long-lived tokens in localStorage | Short access tokens, HttpOnly refresh cookie or BFF |
| Trusts the header's alg | Pins the algorithm; checks iss, aud, exp |
| JWTs for every app | Knows sessions are often simpler |

#### Useful phrases
- "A JWT is a signed claim, not a secret."
- "Statelessness is the feature and the drawback: you can't easily take it back."
- "Short-lived access, rotating refresh."
- "For one web app with one backend, a session cookie is usually simpler and safer."

#### Common pitfalls
- **Sensitive data** in the payload.
- **Not validating** `aud` and `iss`.
- **Long expiry** with no revocation plan.
- Tokens in **URLs**, leaking via logs and Referer.
- **Clock skew** causing random expiry failures (allow a small leeway).

#### Follow-ups to expect (with sample answers)
- **"How do you rotate signing keys?"** — "Publish keys in a JWKS endpoint with `kid`s; sign new tokens with the new key while still accepting the old one until existing tokens expire."
- **"HS256 or RS256?"** — "RS256/ES256 when several services verify tokens, so only the issuer holds the private key; HS256 only when issuer and verifier are the same trusted service."
- **"How do you log a user out everywhere?"** — "Revoke their refresh tokens server-side; access tokens die within minutes; optionally bump a token version checked on sensitive calls."
- **"Can the frontend read the JWT?"** — "If it's in memory or localStorage, yes; in an HttpOnly cookie, no, so user info for display should come from a `/me` endpoint."
- **"What's JWE?"** — "An encrypted JWT format; rarely needed in browsers, where avoiding sensitive claims is simpler."

#### What senior interviewers look for
- **Accurate mental model** and honest trade-offs.
- **Security pitfalls** known from experience.
- **Pragmatic recommendations** for different system sizes.

#### Practise it
- Decode a JWT by hand (split on dots, Base64URL-decode) and explain what each claim means.
- Write the verification checklist your API middleware should apply.
- Checklist: structure · signed not encrypted · algorithm pinning · exp/iss/aud · revocation plan · storage choice · short access + rotating refresh · key rotation.

## Backend for Frontend (BFF): when and why
- id: fe-be-01
- roles: frontend, fullstack
- round: BACKEND_ADJACENT
- difficulty: medium
- levels:
- tags: BFF, API design, architecture, aggregation, security

### Prompt
What is the Backend for Frontend (BFF) pattern? When does a frontend team benefit from owning a thin server layer between the UI and backend services, what should and shouldn't live there, how does it compare with GraphQL or an API gateway, and what are the risks?

### Answer
#### What the interviewer is really testing
- Understanding a BFF as **a server owned by a frontend team, shaped for one client experience**.
- Knowing the **problems it solves**: chatty APIs and waterfalls, payload shaping, combining many services, hiding secrets and tokens, client-specific caching, and decoupling UI changes from backend release cycles.
- Knowing **what belongs there** (aggregation, shaping, auth/session handling, caching) and what **doesn't** (core business rules, data ownership).
- Comparing with **API gateways, GraphQL** and framework servers (Next.js route handlers, Server Components).
- **Risks**: duplicated logic, another service to run, latency, ownership confusion.

#### Key points
- **Definition:** a BFF is a backend layer dedicated to one frontend (or one family of clients: web, iOS, Android, partner portal). Sam Newman's guideline: one experience, one BFF, owned by the team building that experience.
- **Problems it solves:**
  - **Aggregation:** one request from the browser fans out to several services in parallel on a fast internal network, then returns one response shaped for the screen.
  - **Shaping:** strips unused fields, renames, formats, paginates, so mobile clients don't download huge payloads.
  - **Security and sessions:** holds OAuth tokens and API keys server-side; the browser gets an HttpOnly session cookie only.
  - **Client-specific caching and rate limiting** at the edge.
  - **Independence:** the frontend team can change the shape for a new screen without waiting for several backend teams.
  - **Protocol translation:** gRPC or SOAP or event streams internally, JSON or SSE outward.
- **What shouldn't live there:** core business logic and validation that must be consistent across clients (pricing, permissions decisions, payments), and data ownership. The BFF orchestrates; domain services decide.
- **Versus API gateway:** a gateway is shared infrastructure (routing, auth, rate limiting) for all clients; a BFF is product-specific composition. They often coexist: gateway → BFF → services.
- **Versus GraphQL:** a GraphQL layer lets clients choose shapes from one shared graph; a BFF hard-codes shapes per client. GraphQL suits many clients with varied needs and a platform team; a BFF suits one team wanting speed and simplicity. A GraphQL server can itself act as a BFF.
- **Modern framing:** Next.js route handlers, Server Actions, Remix loaders and React Server Components often are the BFF.
- **Risks:** logic drift between multiple BFFs, extra network hop, a new service to operate and monitor, unclear ownership if every team puts things in it.

#### Model answer
"A BFF is a thin server owned by the frontend team and built for one particular client experience, sitting between the UI and the backend services.

**When it helps.** The classic trigger is a screen that needs data from many services. Say the order page needs the order service, customer service, shipping provider, and recommendations. From the browser, that's four calls, some depending on each other, over a slow mobile network, plus payloads full of fields we don't use. A BFF endpoint like `GET /bff/order-page/:id` calls those services in parallel over the fast internal network, combines and trims the data, and returns exactly what the screen needs in one response. On a mobile connection that can turn two seconds of waterfalls into a few hundred milliseconds.

Other reasons I'd introduce one:
- **Security.** The BFF holds OAuth tokens and API keys, and the browser only gets an HttpOnly session cookie. Secrets never reach JavaScript.
- **Different clients, different needs.** A mobile app wants small payloads and fewer calls; a partner portal wants different fields. Separate BFFs keep each simple instead of one API trying to satisfy everyone.
- **Team independence.** The frontend team can reshape responses for a new design without negotiating changes with five backend teams.
- **Translation and caching.** Internal services might speak gRPC or publish events; the BFF exposes JSON or SSE, and can cache responses specific to the UI.

**What shouldn't go in it.** Business rules that must be the same everywhere, like calculating prices, deciding permissions, or validating payments, belong in the domain services. If the web BFF computes discounts and the iOS BFF computes them slightly differently, customers see different prices. The BFF orchestrates and shapes; it doesn't decide.

**Compared with alternatives.** An API gateway is shared infrastructure for routing, authentication and rate limiting across all clients; a BFF is product-specific and often sits behind it. GraphQL solves the same 'right shape, one request' problem differently: one shared graph that any client can query flexibly. With many clients and a platform team, GraphQL can be better; with one product team wanting to move fast, a simple REST BFF is often enough. And in modern frameworks, the BFF is frequently already there: Next.js route handlers, Server Actions and Server Components fetch and combine data on the server for the page.

**The risks.** It's one more service to deploy, monitor and scale; it adds a network hop; and without discipline it becomes a dumping ground for logic. I'd keep it thin, own it with the frontend team that uses it, give it the same observability as other services, and push any logic that two clients need down into a shared service."

#### Another worked example
**One endpoint replacing a waterfall.**
```
Before (browser, 4G):
  GET /orders/123        280ms
  GET /customers/9       260ms   (needs order first)
  GET /shipments?order=123  300ms (parallel with customer)
  GET /products?ids=...  290ms   (needs order first)
  ≈ 850ms+ with waterfalls, 180 KB JSON
After (BFF, internal network ~10ms per call, in parallel):
  GET /bff/order-page/123 → 320ms total, 14 KB JSON shaped for the page
```
The BFF also caches product details for a few minutes, since they rarely change.

#### A third worked example
**Two BFFs drifting apart.** A company had web and mobile BFFs, each formatting 'delivery estimate' from raw shipping data. Different rounding meant the app said 'Arrives Tuesday' while the website said 'Arrives Wednesday'. They moved estimate calculation into the shipping service and kept only display formatting in each BFF. Lesson: shared rules go down a layer.

#### Variations you might be asked
- "How would you reduce the number of API calls on our dashboard?"
- "Where should the OAuth tokens live for a single-page app?"
- "BFF or GraphQL for our web and mobile apps?"

#### Step-by-step framework
1. **Define** the BFF and its owner.
2. **Name the problems** it solves: aggregation, shaping, security, independence, translation.
3. **Set boundaries**: orchestration and shaping in, business rules out.
4. **Compare** with API gateway, GraphQL and framework servers.
5. **Operate it**: observability, scaling, timeouts and partial failures.
6. **Name risks** and mitigations.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "A BFF is just a proxy" | Explains aggregation, shaping, security and team ownership |
| Puts pricing and permissions in it | Keeps business rules in domain services |
| One BFF for every client | One BFF per experience, or a shared graph when appropriate |
| Ignores ops | Timeouts, partial failures, monitoring and scaling |
| Never considers frameworks | Recognises Next.js/Remix servers as BFFs |

#### Useful phrases
- "One experience, one BFF, owned by the team that builds the experience."
- "The BFF orchestrates; domain services decide."
- "Fan out on the fast network, return once over the slow one."
- "Tokens stay on the server; the browser gets a session cookie."

#### Common pitfalls
- **Business logic creep** into the BFF.
- **No timeouts** on downstream calls, so one slow service slows every page.
- **All-or-nothing responses** where a failing recommendations service breaks the whole page.
- **Duplicated logic** across several BFFs.
- Adding a BFF where **parallel client calls** would have been enough.

#### Follow-ups to expect (with sample answers)
- **"How do you handle a downstream service failing?"** — "Timeouts per call, return partial data with flags so the UI shows that section as unavailable, and circuit breakers for repeatedly failing services."
- **"Who owns the BFF?"** — "The frontend team that uses it, with on-call responsibility like any service."
- **"Does a BFF add latency?"** — "One extra hop, but it usually removes several client round trips, so overall latency drops, especially on mobile."
- **"How is it different from Next.js API routes?"** — "It isn't, conceptually: route handlers and server components in the same app are a convenient BFF."
- **"How do you test it?"** — "Contract tests against downstream services, unit tests for shaping, and the frontend's integration tests against its endpoints."

#### What senior interviewers look for
- **Clear boundaries** and ownership.
- **Performance and security** motivations explained with numbers.
- Balanced comparison with **GraphQL and gateways**.

#### Practise it
- Design a BFF endpoint for a screen that today makes four API calls, including timeouts and partial failure handling.
- Explain in one minute why business rules don't belong in the BFF.
- Checklist: definition and owner · aggregation · shaping · tokens server-side · boundaries · gateway and GraphQL comparison · timeouts and partial data · observability · drift risk.
