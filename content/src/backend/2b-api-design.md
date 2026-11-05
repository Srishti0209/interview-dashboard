# Backend Engineer — API Design (continued)

## Error handling and HTTP status codes
- id: be-api-07
- roles: backend, fullstack
- round: API_DESIGN
- difficulty: easy
- levels:
- tags: errors, HTTP status codes, API design, developer experience

### Prompt
How do you design error handling for an API? Which status codes do you use, and what should an error response contain?

### Answer
#### What the interviewer is really testing
- Correct use of **HTTP status codes** (client vs server errors).
- A **consistent, machine-readable** error format.
- Thinking about **developer experience** (actionable messages) and **security** (not leaking internals).
- Handling **validation**, **business rule** and **unexpected** errors differently.

#### Key points
- **2xx** success, **4xx** client errors (the client can fix it), **5xx** server errors (the client generally can't fix it; may retry).
- Key codes: `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `405` method not allowed, `409` conflict, `412` precondition failed, `415` unsupported media type, `422` unprocessable (validation/business rule), `429` too many requests, `500` internal error, `502/503/504` upstream/unavailable/timeout.
- Consistent error body: **stable error code**, **human-readable message**, **field-level details**, **request ID** for support, optionally a **documentation link**. Consider **RFC 9457 (Problem Details)** as a standard format.
- Never expose **stack traces**, SQL errors or internal hostnames.
- Tell clients which errors are **retryable** (e.g. 429/503 with `Retry-After`).

#### Model answer
"I design errors as part of the API contract, as carefully as successful responses.

**1. Choose the right status code family:**
- **4xx** when the client did something wrong and can fix it: invalid input, missing auth, not allowed, resource doesn't exist, conflict with current state.
- **5xx** when something failed on our side: bugs, dependencies down, overload.

**2. Use specific codes consistently:**
- `400 Bad Request`: malformed JSON or missing required parameters.
- `401 Unauthorized`: missing or invalid credentials (really 'unauthenticated').
- `403 Forbidden`: authenticated but not allowed (e.g. accessing another tenant's order).
- `404 Not Found`: resource doesn't exist, or the caller shouldn't know it exists (to avoid leaking information).
- `409 Conflict`: conflicts with current state, e.g. cancelling a shipped order or duplicate unique values.
- `412 Precondition Failed`: `If-Match` version mismatch.
- `422 Unprocessable Entity`: well-formed but semantically invalid, e.g. quantity of 0.
- `429 Too Many Requests` with `Retry-After`.
- `500` unexpected errors; `503` temporarily unavailable (with `Retry-After`); `504` upstream timeout.

**3. Consistent error body:**
```json
HTTP/1.1 422 Unprocessable Entity
{
  "error": {
    "code": "invalid_quantity",
    "message": "Quantity must be between 1 and 100.",
    "details": [ { "field": "items[0].quantity", "issue": "out_of_range", "min": 1, "max": 100 } ],
    "request_id": "req_7f3a9c",
    "docs_url": "https://docs.example.com/errors#invalid_quantity"
  }
}
```
- **`code`** is stable and machine-readable; clients branch on it, not on the message text.
- **`message`** is clear and actionable for developers.
- **`details`** lists field-level problems so clients can highlight form fields.
- **`request_id`** links to our logs for support.

**4. Security:** internal errors return a generic message (`internal_error`) plus the request ID. Stack traces and SQL errors are logged server-side, never returned.

**5. Retry guidance:** document which errors are retryable (`429`, `503`, `504`, network errors), and include `Retry-After` where possible. `4xx` errors other than `429` generally shouldn't be retried without changes.

**6. Implementation:** a central error-handling middleware maps exceptions (validation errors, domain errors, not-found errors) to the standard format, so every endpoint behaves consistently."

#### Another worked example: validation with multiple errors
"For a sign-up request with several invalid fields, return all problems at once rather than one at a time:
```json
{ "error": { "code": "validation_error", "message": "The request has 2 invalid fields.",
  "details": [ { "field": "email", "issue": "invalid_format" },
               { "field": "password", "issue": "too_short", "min_length": 12 } ],
  "request_id": "req_123" } }
```
This saves round trips and gives a better user experience in forms."

#### A third worked example: errors from a dependency
"When our service depends on a payment provider that times out, we return `502 Bad Gateway` or `503 Service Unavailable` with code `payment_provider_unavailable` and `Retry-After: 5`, not a generic 500. The client can show 'Please try again shortly' and retry safely with its idempotency key, while our logs record the upstream failure for investigation."

#### Status code cheat sheet
| Code | Meaning | Example |
|---|---|---|
| 400 | Malformed request | Invalid JSON |
| 401 | Not authenticated | Missing/expired token |
| 403 | Not allowed | Accessing another account's data |
| 404 | Not found | Unknown order ID |
| 409 | State conflict | Cancel a shipped order |
| 412 | Precondition failed | Stale ETag |
| 422 | Semantic validation | Quantity 0 |
| 429 | Rate limited | Too many requests |
| 500 | Unexpected server error | Bug |
| 503 | Temporarily unavailable | Maintenance/overload |

#### Step-by-step framework
1. Decide **4xx vs 5xx** by who can fix the problem.
2. Use **specific codes** consistently.
3. Define a **standard error body** (code, message, details, request ID).
4. Protect **internal details**.
5. Document **retryable** errors.
6. Implement centrally in **middleware**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Always returns 200 with `{"success": false}` | Correct status codes |
| Free-text errors only | Stable machine-readable codes |
| Returns stack traces | Generic messages + request ID |
| One error at a time | Field-level details, all at once |
| No retry guidance | Retryable errors and Retry-After |

#### Useful phrases
- "4xx means the client can fix it; 5xx means we need to."
- "Clients branch on the error code, not the message."
- "Every error includes a request ID so support can find the logs."
- "We never return stack traces or database errors."

#### Common pitfalls
- **200 OK for errors.**
- **Inconsistent formats** across endpoints.
- **Leaking internals.**
- **Using 500 for client mistakes.**
- **Changing error codes**, which breaks clients.

#### Follow-ups to expect (with sample answers)
- **"401 or 403 when a token is valid but lacks permission?"**
  "403, because the client is authenticated but not authorised. 401 is for missing or invalid credentials."
- **"404 or 403 for a resource in another tenant?"**
  "Often 404, so we don't reveal that the resource exists."
- **"What's RFC 9457?"**
  "A standard 'Problem Details' JSON format for HTTP API errors, with fields like type, title, status, detail and instance."
- **"How do you localise error messages?"**
  "Keep stable codes for logic, and let clients map codes to localised messages, or return messages based on Accept-Language."

#### What senior interviewers look for
- **Consistency** across many services via shared libraries.
- **Observability** links (request IDs, tracing).
- Error design as part of **API governance**.

#### Practise it
1. Write error responses for five scenarios: invalid JSON, expired token, no permission, out of stock, provider timeout.
2. Map each to a status code and stable error code.
3. Explain 4xx vs 5xx with examples, out loud.

## Authentication and authorisation: OAuth 2.0, JWT and sessions
- id: be-api-08
- roles: backend, fullstack
- round: API_DESIGN
- difficulty: hard
- levels:
- tags: authentication, authorisation, OAuth, JWT, security

### Prompt
How would you handle authentication and authorisation for an API used by a web app, a mobile app and third-party partners? Explain sessions, JWTs and OAuth 2.0.

### Answer
#### What the interviewer is really testing
- Understanding the difference between **authentication** (who you are) and **authorisation** (what you can do).
- Knowledge of **sessions vs tokens (JWT)** and their trade-offs.
- **OAuth 2.0 flows** for different clients, and **OpenID Connect**.
- **Security practices**: token storage, expiry, revocation, scopes.

#### Key points
- **Sessions**: server stores session state; client holds a session ID in a secure, HttpOnly cookie. Easy revocation; requires shared session storage at scale.
- **JWT (JSON Web Token)**: signed token containing claims (user ID, scopes, expiry). Stateless verification; **hard to revoke** before expiry, so keep access tokens **short-lived** and use **refresh tokens**.
- **OAuth 2.0** is an **authorisation framework** for delegated access; **OpenID Connect (OIDC)** adds authentication (ID tokens).
- Flows: **Authorization Code + PKCE** (web/mobile apps, user login), **Client Credentials** (machine-to-machine, partners), Device Code (TVs). Avoid the deprecated Implicit and Password flows.
- **Scopes** limit what a token can do; fine-grained **authorisation checks** still happen in the service (e.g. "is this order in your account?").
- Store tokens securely: **HttpOnly, Secure, SameSite cookies** for browsers; secure storage (Keychain/Keystore) on mobile.

#### Model answer
"I'd separate the two concerns: **authentication** (who is calling) and **authorisation** (what they're allowed to do).

**Authentication options:**
- **Sessions**: after login, the server creates a session record and sets a session ID cookie (HttpOnly, Secure, SameSite). Each request looks up the session. Pros: easy to revoke (delete the session), small cookie. Cons: needs a shared session store (e.g. Redis) across servers.
- **JWT access tokens**: a signed token with claims like `sub` (user ID), `scope`, `exp`. Any service can verify it with the public key, so no lookup. Cons: you can't easily revoke a JWT before it expires, so access tokens should be **short-lived** (e.g. 5–15 minutes), paired with **refresh tokens** (longer-lived, stored securely, revocable, rotated on use).

**My design for the three client types:**
1. **Web app**: use an **identity provider** (our own auth service or a managed one) with **OIDC Authorization Code flow + PKCE**. For browser security, I'd often use a **backend-for-frontend** that keeps tokens server-side and gives the browser an HttpOnly session cookie, avoiding tokens in JavaScript-accessible storage (reducing XSS token theft).
2. **Mobile app**: **Authorization Code + PKCE** via the system browser; store refresh tokens in the Keychain/Keystore; short-lived access tokens sent as `Authorization: Bearer ...`.
3. **Partners (machine-to-machine)**: **OAuth Client Credentials**: partners exchange a client ID and secret (or private-key JWT) for an access token with limited **scopes** (e.g. `orders:read orders:write`). Tokens tied to the partner's tenant.

**Authorisation:**
- **Scopes** say what kind of actions a token permits.
- **Service-level checks** enforce resource ownership: the orders service verifies the order belongs to the caller's account/tenant on every request. This prevents 'insecure direct object reference' bugs where changing an ID in the URL exposes someone else's data.
- For complex rules, use **role-based** (RBAC) or **attribute-based** (ABAC) access control, possibly via a central policy engine.

**Token validation in services:**
- Verify signature (using the identity provider's published keys, cached and rotated), issuer, audience and expiry.
- An API gateway can do initial validation; services still enforce resource-level authorisation.

**Security details:**
- HTTPS everywhere; short expiry; refresh-token rotation and revocation on logout or suspicious activity; rate-limit login; MFA for sensitive accounts; never put sensitive data in JWT payloads (they're only base64-encoded, not encrypted)."

#### Another worked example: revoking access quickly
"A partner's credentials leaked. With JWT access tokens of 10 minutes:
- Revoke the partner's client credentials and refresh tokens immediately, so no new access tokens can be issued.
- Existing access tokens expire within 10 minutes; for urgent cases, add the token IDs (`jti`) or client ID to a short-lived **deny list** checked by the gateway.
- Rotate secrets, notify the partner, review audit logs for misuse.
This is why access tokens should be short-lived."

#### A third worked example: multi-tenant B2B API
"In a B2B SaaS product, each user belongs to an organisation. Tokens include `org_id` and roles (admin, member). Every query is scoped by `org_id` from the token (never from the request body), and database access goes through a repository layer that always applies the tenant filter. This prevents cross-tenant data leaks even if a developer forgets a check in a handler."

#### Sessions vs JWT
| Aspect | Server sessions | JWT access tokens |
|---|---|---|
| State | Server-side store | Stateless (self-contained) |
| Revocation | Easy | Hard (needs short expiry / deny list) |
| Scaling | Shared session store | No lookup needed |
| Size | Small cookie | Larger tokens |
| Best for | Browser apps (first-party) | APIs, microservices, mobile |

#### Step-by-step framework
1. Distinguish **authentication** and **authorisation**.
2. Identify **client types** (web, mobile, machine).
3. Choose **flows** (Auth Code + PKCE, Client Credentials).
4. Decide **session vs token** strategy and storage.
5. Enforce **scopes and resource-level authorisation**.
6. Plan **expiry, refresh, revocation** and monitoring.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use JWT" for everything | Chooses per client type with trade-offs |
| Long-lived JWTs | Short-lived access + rotating refresh tokens |
| Tokens in localStorage | HttpOnly cookies / BFF / secure mobile storage |
| Scopes as the only authorisation | Resource ownership checks in services |
| No revocation plan | Revocation, deny lists, rotation |

#### Useful phrases
- "Authentication is who you are; authorisation is what you can do."
- "JWTs are hard to revoke, so access tokens should be short-lived."
- "For partners, I'd use the client credentials flow with limited scopes."
- "Every request still checks that the resource belongs to the caller's tenant."

#### Common pitfalls
- **Confusing OAuth with authentication** (that's OIDC).
- **Long-lived, unrevocable tokens.**
- **Storing tokens insecurely** in the browser.
- **Missing object-level authorisation checks.**
- **Putting sensitive data in JWTs.**

#### Follow-ups to expect (with sample answers)
- **"What is PKCE?"**
  "Proof Key for Code Exchange: the client creates a secret verifier and sends a hash of it when starting login, then proves it has the verifier when exchanging the code, preventing intercepted codes from being used."
- **"Symmetric or asymmetric signing for JWTs?"**
  "Asymmetric (e.g. RS256/ES256) when many services verify tokens, so only the identity provider holds the private key."
- **"How do you handle API keys?"**
  "Hash them in storage, scope them, allow rotation, show them once at creation, and log their use."
- **"Where should authorisation logic live?"**
  "Close to the data in each service, possibly using a shared policy library or engine for consistency."

#### What senior interviewers look for
- **Threat-model thinking** (token theft, IDOR, replay).
- **Organisation-wide identity** architecture.
- Balancing **security and usability**.

#### Practise it
1. Draw the Authorization Code + PKCE flow from memory.
2. Explain how you'd revoke a compromised partner's access.
3. Describe how tenant isolation is enforced in your services, out loud.

## Rate limiting and quotas at the API layer
- id: be-api-09
- roles: backend, fullstack
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: rate limiting, quotas, API gateway, fairness

### Prompt
How would you design rate limiting and usage quotas for a public API with free and paid plans?

### Answer
#### What the interviewer is really testing
- Understanding **why** rate limits exist (protection, fairness, cost, business tiers).
- Choosing **dimensions** (per key, per user, per IP, per endpoint) and **algorithms**.
- Communicating limits clearly to **developers**.
- Separating **short-term rate limits** from **long-term quotas** and billing.

#### Key points
- **Rate limits** protect against bursts (e.g. 100 requests/second); **quotas** cap usage over longer periods (e.g. 100,000 requests/month), often tied to **pricing plans**.
- Enforce at the **API gateway** or shared middleware, with state in a fast store (Redis).
- Algorithms: **token bucket** (allows bursts), **sliding window** (smoother).
- Different limits per **plan**, **endpoint cost** (search vs simple GET) and **client type**.
- Respond with **429**, `Retry-After` and headers like `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
- Provide **usage dashboards**, alerts at thresholds, and upgrade paths.

#### Model answer
"I'd design two layers: **rate limits** for protection against bursts, and **quotas** for plan-based usage over time.

**1. Requirements**
- Free plan: 10 requests/sec, 10,000 requests/month.
- Pro plan: 100 requests/sec, 1M requests/month.
- Enterprise: custom limits.
- Expensive endpoints (e.g. `/search`, `/reports`) have lower limits.

**2. Where to enforce**
- At the **API gateway** (or a shared middleware), before requests reach services.
- Plan and limit configuration cached in memory on gateways, sourced from the billing/plan service.

**3. Rate limits (short term)**
- **Token bucket** per API key: capacity = burst allowance, refill = per-second rate.
- State in **Redis**, updated atomically (Lua script), keyed by `api_key` and optionally endpoint group.
- Extra **per-IP limits** for unauthenticated endpoints (e.g. sign-up, login) to stop abuse.

**4. Quotas (long term)**
- Count requests per key per billing period. For efficiency, increment counters in Redis and periodically flush to a durable usage store for billing and dashboards.
- When the quota is exceeded: either hard stop (`429` with code `quota_exceeded`) or allow overage billed at a rate, depending on the plan.
- Notify customers at 80% and 100% of quota by email and in the dashboard.

**5. Communicating limits**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 2
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 2
{ "error": { "code": "rate_limited", "message": "Too many requests. Retry after 2 seconds." } }
```
Include rate-limit headers on **successful** responses too, so clients can pace themselves.

**6. Fairness and protection**
- **Endpoint weighting**: a search request might cost 5 'units'.
- **Concurrency limits** for long-running endpoints (max 5 in-flight report generations per key).
- **Global protection** (load shedding) if the whole system is overloaded, prioritising paid plans.

**7. Developer experience**
- Clear documentation of limits per plan.
- A usage dashboard with history.
- SDKs that automatically back off on 429 using `Retry-After`.

**8. Failure modes**
- If Redis is unavailable, fall back to **local in-memory limits** per gateway node (approximate) rather than blocking all traffic.
- Monitor rejection rates; spikes may indicate abuse, client bugs or limits that are too low."

#### Another worked example: a noisy enterprise client
"An enterprise client's batch job sent 2,000 requests/second at midnight, slowing the API for others.
- We introduced **per-key concurrency limits** and a dedicated **bulk endpoint** that accepts batches of 500 items asynchronously.
- The client's job moved to the bulk endpoint, cutting their request count by 99%, and other customers' latency returned to normal.
- Lesson: sometimes the fix for rate-limit problems is a better API, not just stricter limits."

#### A third worked example: internal service quotas
"Internally, a shared search service was overwhelmed by one team's new feature. We added per-calling-service quotas (identified via service identity), with dashboards per team, and required capacity requests for large increases. This turned a technical outage risk into a planning conversation."

#### Rate limits vs quotas
| Aspect | Rate limit | Quota |
|---|---|---|
| Timescale | Seconds/minutes | Days/months |
| Purpose | Protect against bursts | Plan usage, billing |
| Enforcement | Token bucket / sliding window | Counters per period |
| Response | 429 + Retry-After | 429 quota_exceeded or overage billing |

#### Step-by-step framework
1. Define **goals** (protection, fairness, monetisation).
2. Choose **dimensions** (key, IP, endpoint, plan).
3. Choose **algorithms** and storage.
4. Separate **rate limits** and **quotas**.
5. Design **responses and headers**.
6. Provide **dashboards, alerts, SDK support**.
7. Plan **failure handling** and monitoring.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| One global limit | Limits per plan, key, endpoint, IP |
| Limits without headers | Clear 429 responses and rate-limit headers |
| No quotas or billing link | Quotas tied to plans with notifications |
| Blocks all traffic if Redis fails | Graceful local fallback |
| Only stricter limits | Better API patterns (bulk, async) |

#### Useful phrases
- "Rate limits protect the system; quotas reflect what customers pay for."
- "Expensive endpoints cost more units."
- "We include rate-limit headers on every response so clients can pace themselves."
- "Sometimes the right fix is a bulk endpoint, not a lower limit."

#### Common pitfalls
- **Confusing rate limits and quotas.**
- **No visibility** for customers.
- **Same limit for cheap and expensive endpoints.**
- **Single point of failure** in the limiter.
- **Silent throttling** without clear errors.

#### Follow-ups to expect (with sample answers)
- **"How do you prevent abuse with many free accounts?"**
  "Require verification (email, card), rate-limit by IP and device fingerprint, and monitor for suspicious patterns."
- **"How do you count usage accurately for billing?"**
  "Durable usage records (e.g. events written to a stream and aggregated), reconciled with Redis counters."
- **"Should limits be per user or per API key?"**
  "Usually per key (application) for partners, with per-user limits inside apps to stop one user consuming an app's whole allowance."

#### What senior interviewers look for
- Linking technical limits to **business models**.
- **Multi-tenant fairness** and graceful degradation.
- **Developer experience** focus.

#### Practise it
1. Design limits for free, pro and enterprise plans, including expensive endpoints.
2. Write the 429 response with headers.
3. Explain the difference between rate limits and quotas, out loud.

## Designing reliable webhooks
- id: be-api-10
- roles: backend, fullstack
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: webhooks, events, reliability, security

### Prompt
Design a webhook system that notifies partners when events happen (e.g. "order shipped"). How do you make it reliable and secure?

### Answer
#### What the interviewer is really testing
- **Reliable delivery** to endpoints you don't control (retries, backoff, failures).
- **Security**: signing payloads, preventing spoofing and replay, SSRF protection.
- **Idempotency** and **ordering** expectations for receivers.
- **Operability**: monitoring, disabling failing endpoints, replay tools.

#### Key points
- Events are generated reliably (e.g. via the **outbox pattern**) and queued for delivery.
- **Delivery workers** POST JSON to subscriber URLs with **timeouts**; treat **2xx** as success.
- **Retries with exponential backoff and jitter** over hours/days; then mark as failed and alert/disable.
- **Sign payloads** (HMAC-SHA256 with a per-subscriber secret) including a **timestamp** to prevent replay.
- Include a unique **event ID** so receivers can **deduplicate** (delivery is at-least-once).
- **Ordering** isn't guaranteed; include timestamps/versions so receivers can handle out-of-order events.
- Provide **delivery logs**, manual **replay**, and test events.
- Protect against **SSRF**: block internal IPs, validate URLs, require HTTPS.

#### Model answer
"**1. Requirements**
- Partners subscribe to event types (`order.created`, `order.shipped`) with an HTTPS URL.
- Delivery should be reliable (at-least-once), reasonably fast (seconds), secure, and observable.

**2. Architecture**
```
Domain services → Outbox → Event bus → Webhook dispatcher
                                            │ looks up subscriptions
                                            ▼
                                   Delivery queue (per subscriber)
                                            │
                                   Delivery workers ──HTTPS POST──► Partner endpoints
                                            │
                                   Delivery log (attempts, status) → dashboard, replay
```

**3. Payload**
```json
POST https://partner.example.com/webhooks
Webhook-Id: evt_01HXYZ...
Webhook-Timestamp: 1793714400
Webhook-Signature: v1=5d41402abc4b2a76b9719d911017c592...
{
  "id": "evt_01HXYZ",
  "type": "order.shipped",
  "created_at": "2026-11-03T10:20:00Z",
  "data": { "order_id": "ord_123", "status": "shipped", "tracking_number": "TRK123", "version": 5 }
}
```
- Payloads include enough data to act on, or a 'thin' event with an ID the receiver fetches via the API (safer for sensitive data and always up to date).

**4. Security**
- **Signature**: `HMAC_SHA256(secret, timestamp + '.' + body)`. Receivers recompute and compare using constant-time comparison.
- **Replay protection**: receivers reject requests with timestamps older than e.g. 5 minutes.
- **Secrets**: per subscriber, rotatable (support two active secrets during rotation).
- **SSRF protection**: validate URLs at registration, block private IP ranges and metadata endpoints, resolve DNS carefully, require HTTPS.

**5. Delivery and retries**
- Workers send with a short timeout (e.g. 10 seconds). Success = any 2xx.
- Failures (timeouts, 5xx, connection errors) are retried with **exponential backoff and jitter**: e.g. 1 min, 5 min, 30 min, 2 h, 6 h… up to ~3 days.
- 4xx responses (except 408/429) usually indicate a permanent problem; retry a few times then stop.
- After repeated failures, mark the endpoint as **unhealthy**, notify the partner, and pause deliveries to avoid wasting resources.
- **Per-subscriber queues** so one slow partner doesn't delay others.

**6. Guidance for receivers (in docs)**
- Respond **quickly** (2xx) and process asynchronously.
- **Deduplicate** by event ID (at-least-once delivery).
- Don't assume ordering; use `version` or `created_at` to ignore stale updates.

**7. Operability**
- Delivery logs per subscriber (request, response code, latency, attempts).
- **Replay** a single event or a time range.
- **Test** button to send a sample event.
- Metrics: success rate, retry backlog, latency per subscriber."

#### Another worked example: receiving webhooks from a provider
"On the receiving side (e.g. payment provider webhooks to us):
- Verify the signature and timestamp first; reject invalid ones.
- Store the raw event and its ID; return 200 immediately.
- Process asynchronously from a queue; skip duplicates by event ID.
- Handle out-of-order events by checking current state (e.g. ignore 'payment_pending' after 'payment_succeeded')."

#### A third worked example: a partner's endpoint goes down for a day
"A partner's server was down for 18 hours. Our retries continued with backoff, and the endpoint was marked unhealthy after 12 hours, which triggered an email to their technical contact. When they came back, queued deliveries resumed automatically, and they used the replay tool to resend a few events whose retries had expired. No data was lost, and their support team didn't have to contact ours."

#### Reliability and security checklist
| Concern | Solution |
|---|---|
| Lost events | Outbox + durable queue |
| Endpoint failures | Retries with backoff and jitter |
| Duplicate deliveries | Event IDs for receiver dedup |
| Out-of-order events | Versions/timestamps |
| Spoofing | HMAC signatures |
| Replay attacks | Signed timestamps, tolerance window |
| SSRF | URL validation, block private IPs |
| Noisy failures | Per-subscriber queues, auto-pause, alerts |

#### Step-by-step framework
1. Reliable **event generation** (outbox).
2. **Subscription** management.
3. **Payload** and headers design.
4. **Security**: signing, replay protection, SSRF.
5. **Delivery**: timeouts, retries, backoff, isolation.
6. **Receiver guidance**: fast ack, dedup, ordering.
7. **Operability**: logs, replay, metrics.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Fire-and-forget POST | Durable queue with retries and backoff |
| No signatures | HMAC signatures with timestamps |
| Assumes exactly-once, in order | At-least-once; event IDs and versions |
| One queue for all partners | Per-subscriber isolation |
| No visibility | Delivery logs, replay, alerts |

#### Useful phrases
- "Delivery is at-least-once, so every event has an ID for deduplication."
- "Payloads are signed with HMAC and a timestamp to prevent spoofing and replays."
- "Each subscriber has its own queue, so one slow endpoint doesn't affect others."
- "Receivers should acknowledge fast and process asynchronously."

#### Common pitfalls
- **No retries.**
- **Unsigned payloads.**
- **SSRF vulnerabilities** in URL registration.
- **Blocking** event production on webhook delivery.
- **No replay or logs.**

#### Follow-ups to expect (with sample answers)
- **"Fat or thin payloads?"**
  "Thin events (IDs) are safer and always current but need an API call; fat events save calls but can be stale and carry more sensitive data. Often a middle ground with key fields."
- **"How do you guarantee ordering if a partner needs it?"**
  "Deliver events for the same entity sequentially (per-entity queues), at the cost of throughput; most receivers should rely on versions instead."
- **"How do you rotate secrets?"**
  "Generate a new secret, sign with both for a transition period, let the partner switch, then retire the old one."

#### What senior interviewers look for
- **Distributed reliability** thinking.
- **Security depth** (SSRF, replay).
- **Partner operability** and support tooling.

#### Practise it
1. Write the HMAC signature verification steps a receiver should implement.
2. Design a retry schedule over three days.
3. Explain how per-subscriber queues prevent noisy-neighbour problems, out loud.

## Long-running operations and async APIs
- id: be-api-11
- roles: backend, fullstack
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: async APIs, jobs, polling, 202 Accepted

### Prompt
Some operations take minutes, like generating a large report or processing a video. How do you design the API for these long-running operations?

### Answer
#### What the interviewer is really testing
- Recognising when **synchronous requests** are inappropriate (timeouts, resource use).
- The **async request–response pattern** (202 Accepted + status resource).
- **Notification** options (polling, webhooks, WebSockets/SSE).
- Handling **cancellation, retries, idempotency and results storage**.

#### Key points
- Don't hold HTTP connections open for minutes: proxies time out, clients disconnect, servers waste resources.
- Pattern: `POST /reports` → **202 Accepted** with `Location: /reports/{id}` (or `/operations/{id}`) → client checks status → result available when **completed**.
- Status resource: `queued`, `running` (with progress), `succeeded` (with result link), `failed` (with error), `cancelled`.
- Notify via **polling** (with `Retry-After`), **webhooks**, or **WebSockets/SSE** for interactive UIs.
- Results stored in **object storage** with time-limited download URLs.
- Support **idempotency keys**, **cancellation**, **expiry** of results, and **progress** updates.

#### Model answer
"For operations that take more than a few seconds, I'd use an **asynchronous job pattern**.

**1. Start the operation**
```
POST /v1/reports
Idempotency-Key: 1c9e...
{ "type": "sales_summary", "from": "2026-01-01", "to": "2026-10-31", "format": "csv" }

HTTP/1.1 202 Accepted
Location: /v1/reports/rep_789
Retry-After: 10
{ "id": "rep_789", "status": "queued", "created_at": "2026-11-03T10:30:00Z" }
```

**2. Check status**
```
GET /v1/reports/rep_789
{ "id": "rep_789", "status": "running", "progress": 0.45 }

GET /v1/reports/rep_789
{ "id": "rep_789", "status": "succeeded",
  "result": { "download_url": "https://files.example.com/rep_789.csv?sig=...", "expires_at": "2026-11-04T10:31:00Z" } }
```
- Failed jobs return `status: 'failed'` with a structured error.

**3. Backend**
```
API → Jobs table (status) → Queue → Workers → Object storage (results)
                                       │
                                       └→ update status/progress; emit 'report.completed' event
```
- Workers update progress periodically; jobs are retried on transient failure; results saved to object storage with pre-signed, time-limited download URLs.

**4. Notification options**
- **Polling**: simple, works everywhere; `Retry-After` tells clients how often to check.
- **Webhooks**: for server-to-server clients (`report.completed` with the report ID).
- **WebSockets / Server-Sent Events**: for interactive web UIs showing live progress.

**5. Other concerns**
- **Idempotency**: repeated POSTs with the same key return the same job.
- **Cancellation**: `POST /v1/reports/rep_789/cancel` → workers check a cancel flag between steps.
- **Limits**: max concurrent jobs per client to protect resources.
- **Expiry**: results deleted after e.g. 7 days; job records retained for audit.
- **Deduplication**: identical requests might reuse a recent result (cache), saving compute.

**When to stay synchronous**: if the operation reliably completes within a few hundred milliseconds to a couple of seconds, async adds unnecessary complexity."

#### Another worked example: bulk import
"A customer uploads a CSV of 100,000 contacts:
- `POST /imports` with an upload URL reference → 202 with import ID.
- Workers validate and import in batches, tracking processed, succeeded and failed rows.
- Status endpoint returns counts and a link to an error report listing invalid rows.
- The UI shows progress via SSE, and an email is sent when it finishes."

#### A third worked example: when a synchronous endpoint caused outages
"A 'generate invoice PDF' endpoint took 20–40 seconds for large invoices, tying up web workers and causing timeouts under load. Moving it to an async job (202 + status) with workers in a separate pool freed the API servers, eliminated timeouts, and let us scale PDF generation independently."

#### Notification options compared
| Option | Best for | Pros | Cons |
|---|---|---|---|
| Polling | Any client | Simple | Wasteful if too frequent |
| Webhooks | Server-to-server | Efficient, push-based | Receiver must expose endpoint |
| WebSockets/SSE | Interactive UIs | Real-time progress | Connection management |
| Email/notifications | Humans | Familiar | Not for automation |

#### Variations you might be asked
- "Design an API for AI text generation that takes 30 seconds": stream partial results with Server-Sent Events for interactive use, or offer a job-based async mode for batch processing.
- "How would you design 'export my data' for GDPR?": an async export job, identity re-verification, a secure time-limited download link, and an email notification when ready.
- "How do you handle a job that depends on other jobs?": model it as a workflow (parent job with child steps), tracked by an orchestrator, with the parent's status derived from the children.

#### Step-by-step framework
1. Decide **sync vs async** based on duration and resources.
2. **202 Accepted** with a status resource.
3. Define **status states**, progress and errors.
4. Choose **notification** methods.
5. Store **results** securely with expiry.
6. Handle **idempotency, cancellation, limits**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Keep the HTTP request open for minutes | 202 + status resource |
| No progress or status | Clear states, progress, errors |
| Results returned inline (huge payloads) | Object storage with signed URLs |
| No cancellation | Cancel endpoint |
| Duplicate jobs on retries | Idempotency keys |

#### Useful phrases
- "Anything that takes more than a few seconds becomes an asynchronous job."
- "We return 202 Accepted with a link to a status resource."
- "Results are stored in object storage with time-limited download links."
- "Clients can poll, or receive a webhook when it completes."

#### Common pitfalls
- **Long-held synchronous requests.**
- **No way to track or cancel jobs.**
- **Unlimited concurrent jobs** per client.
- **Results stored forever.**
- **Polling guidance missing**, leading to aggressive polling.

#### Follow-ups to expect (with sample answers)
- **"How do you prevent clients from polling too often?"**
  "Return Retry-After, rate-limit status endpoints, and offer webhooks or SSE."
- **"What if a worker crashes mid-job?"**
  "The queue redelivers the job (or a lease expires); steps are idempotent or resume from checkpoints."
- **"Should status live in the same database as other data?"**
  "A jobs table is fine at moderate scale; at large scale, a dedicated store or the workflow engine's state."

- **"What status code should the status endpoint return when the job failed?"**
  "Still 200 for the status resource itself (the request to read status succeeded), with `status: 'failed'` and error details in the body."
- **"How do you design progress reporting so it isn't misleading?"**
  "Base it on measurable units (rows processed, steps completed), update it at sensible intervals, and avoid percentages that jump backwards."
- **"How would you test async APIs?"**
  "Integration tests that start a job, poll until completion with a timeout, and assert on results; plus tests for failure, cancellation and retries."

#### What senior interviewers look for
- **Resource isolation** (separate worker pools).
- **Workflow orchestration** for multi-step jobs.
- **Client experience** across different consumer types.

#### Practise it
1. Write the request/response sequence for an async export.
2. Choose a notification method for a mobile app, a partner server and a web dashboard.
3. Explain why long synchronous requests cause problems, out loud.

## API documentation, contracts and contract testing
- id: be-api-12
- roles: backend, fullstack
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: OpenAPI, contract testing, documentation, developer experience

### Prompt
How do you document APIs and make sure changes don't break the services and clients that depend on them?

### Answer
#### What the interviewer is really testing
- Treating the API **contract** as a first-class artefact.
- Knowledge of **OpenAPI / Protobuf / GraphQL schemas** and **design-first** vs **code-first**.
- **Contract testing** (consumer-driven contracts) and **schema diffing** in CI.
- Focus on **developer experience**: examples, SDKs, sandboxes, changelogs.

#### Key points
- Define APIs with machine-readable **schemas**: **OpenAPI** for REST, **Protobuf** for gRPC, **GraphQL SDL** for GraphQL.
- **Design-first**: write and review the spec before implementing; generate server stubs, client SDKs, mocks and docs.
- **Code-first**: generate the spec from code annotations; keep it accurate via CI.
- **Breaking-change detection**: diff schemas in CI and fail builds on breaking changes.
- **Consumer-driven contract tests** (e.g. Pact): consumers publish expectations; providers verify them before deploying.
- Great docs include **examples, error codes, auth guides, rate limits, changelogs, sandbox** and SDKs.

#### Model answer
"I treat the API contract as the source of truth, and automate as much as possible around it.

**1. Machine-readable contracts**
- **REST**: an **OpenAPI** specification describing endpoints, schemas, auth, errors and examples.
- **gRPC**: **Protobuf** definitions.
- **GraphQL**: the schema (SDL).

**2. Design-first process**
- For new or changed APIs, we write the spec first and review it (like a design review) with consumers: naming, resources, errors, pagination, versioning.
- From the spec we generate:
  - **Mock servers**, so consumers can build in parallel.
  - **Client SDKs** and **server stubs**.
  - **Reference documentation**.

**3. Preventing breaking changes**
- **Schema diffing in CI**: tools compare the new spec with the published one and flag breaking changes (removed fields, changed types, new required fields). Breaking changes fail the build unless explicitly approved for a new version.
- **Consumer-driven contract testing** (e.g. Pact) for internal services:
  - Each consumer writes tests describing the requests it makes and the responses it relies on.
  - These contracts are published to a broker.
  - The provider's CI verifies it still satisfies all consumers' contracts before deploying.
  - This catches breaking changes that a schema alone might not reveal (e.g. a field that's technically optional but a consumer depends on).
- **Runtime validation** in non-production environments: validate requests and responses against the spec to catch drift.

**4. Documentation that developers love**
- Quick-start guide (first successful call in minutes).
- Authentication guide.
- Every endpoint with request/response **examples**, including errors.
- **Error code reference**, rate limits, pagination guide.
- **Changelog** and deprecation notices.
- **Sandbox** environment and test credentials.
- Official **SDKs** for popular languages.

**5. Keeping docs accurate**
- Docs are generated from the spec, and the spec is tested against the implementation (contract tests, runtime validation), so they can't silently drift.

**Example.** A provider team renamed a response field they thought was unused. Pact verification failed in CI because the billing service's contract relied on it. The team kept the old field (adding the new one alongside), avoiding a production incident."

#### Another worked example: public API developer experience
"For a public API, we measured 'time to first successful call'. It was over an hour because auth setup was confusing. We added a guided quick-start, test API keys in the dashboard, copy-paste curl examples and a Postman collection. Time to first call dropped to under 10 minutes, and support tickets about getting started fell significantly."

#### A third worked example: drift between docs and implementation
"An API returned `null` for an optional field, but the docs said the field would be omitted. Clients written in strictly typed languages broke. We added response validation against the OpenAPI spec in our integration test suite and staging environment, which caught similar mismatches before release from then on."

#### Contract approaches
| Approach | What it catches | Typical use |
|---|---|---|
| Schema diffing (OpenAPI/Protobuf) | Structural breaking changes | All APIs |
| Consumer-driven contracts (Pact) | Changes breaking real consumers | Internal microservices |
| Runtime spec validation | Drift between spec and implementation | Test/staging environments |
| End-to-end tests | Integration issues | Critical journeys |

#### Variations you might be asked
- "How do you onboard a new team to your API?": share the spec, mock server and examples, and run a short walkthrough.
- "How do you document internal events (not HTTP)?": use AsyncAPI or a schema registry for event payloads, with the same review and compatibility checks.

#### Step-by-step framework
1. Choose the **contract format** (OpenAPI, Protobuf, GraphQL SDL).
2. **Design-first** reviews for new APIs.
3. **Generate** mocks, SDKs, docs.
4. **Schema diffing** in CI.
5. **Consumer-driven contract tests** for internal consumers.
6. **Runtime validation** to prevent drift.
7. Great **docs**, sandbox, changelog.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| A wiki page of endpoints | Machine-readable spec as source of truth |
| Docs written by hand, often stale | Generated from tested specs |
| Breaking changes found in production | Schema diffing and contract tests in CI |
| No examples | Examples, quick-start, sandbox, SDKs |

#### Useful phrases
- "The OpenAPI spec is our source of truth; docs and SDKs are generated from it."
- "Schema diffing in CI blocks accidental breaking changes."
- "Consumer-driven contracts tell the provider exactly what each consumer relies on."
- "We measure time to first successful call as a developer-experience metric."

#### Common pitfalls
- **Docs drifting** from reality.
- **No automated breaking-change checks.**
- **Ignoring error documentation.**
- **No sandbox or examples.**
- **Contract tests that are too strict** (testing irrelevant details), causing friction.

#### Follow-ups to expect (with sample answers)
- **"Design-first or code-first?"**
  "Design-first for public or widely used APIs (better review and parallel work); code-first can be fine for small internal APIs if CI keeps the spec accurate."
- **"What's the downside of contract testing?"**
  "Maintenance effort and coordination; contracts must focus on what consumers truly rely on."
- **"How do you document webhooks?"**
  "OpenAPI supports webhooks (3.1); document payloads, headers, signature verification and retry behaviour with examples."

- **"How do you keep SDKs in sync with the API?"**
  "Generate them from the spec in CI, version them alongside the API, and publish release notes with every change."

#### What senior interviewers look for
- **API governance** across many teams.
- **Automation** that prevents incidents.
- **Developer experience** as a product.

#### Practise it
1. Write a small OpenAPI snippet for one endpoint, including an error response.
2. Explain how Pact verification works in CI.
3. List the five most important sections of great API docs, out loud.
