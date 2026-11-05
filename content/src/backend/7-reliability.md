# Backend Engineer — Reliability & Operations

## Observability: logs, metrics and traces
- id: be-ops-01
- roles: backend, fullstack
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: observability, logging, metrics, tracing, OpenTelemetry

### Prompt
How would you make a backend service observable? Explain the roles of logs, metrics and traces, what you'd instrument, and how you'd use them to debug an issue.

### Answer
#### What the interviewer is really testing
- Understanding the **three pillars** and when each is the right tool.
- Practical instrumentation: **structured logs, RED/USE metrics, distributed tracing, correlation IDs**.
- Avoiding pitfalls: **high cardinality**, log noise, PII in logs, cost.
- Using observability to **answer unknown questions** during incidents, not just dashboards.

#### Key points
- **Metrics:** numeric time series (counters, gauges, histograms); cheap to store; for **alerting and dashboards**; low cardinality labels.
- **Logs:** detailed event records; **structured JSON** with consistent fields; for investigating specific requests/errors.
- **Traces:** follow a request across services as **spans** with timings; show where latency and errors occur in distributed systems.
- **Correlation:** a trace/request ID in every log line and propagated across services (W3C `traceparent`).
- **RED** for services (Rate, Errors, Duration); **USE** for resources (Utilisation, Saturation, Errors); plus **business metrics**.
- **OpenTelemetry** as a vendor-neutral standard for instrumentation.
- Pitfalls: high-cardinality metric labels (user IDs), logging secrets/PII, unbounded log volume, alerting on causes instead of symptoms.

#### Model answer
"Observability is the ability to understand what's happening inside a system from its outputs, including questions we didn't anticipate. I use three complementary signals.

**Metrics: 'is something wrong, and how much?'**
- Numeric time series aggregated over time: request rate, error rate, latency histograms, queue depth, CPU, memory, DB pool usage.
- Cheap to store and query, perfect for **dashboards and alerts**.
- I instrument every service with **RED**: **R**ate (requests/s), **E**rrors (failed requests/s), **D**uration (latency histograms giving p50/p95/p99) per endpoint.
- For resources (DB, queues, thread pools), **USE**: **U**tilisation, **S**aturation (queue length, waiting), **E**rrors.
- **Business metrics**: orders placed, payments failed, sign-ups: often the clearest signal something's broken.
- Keep label cardinality low: `endpoint`, `status_class`, `region` are fine; `user_id` or full URL paths will explode storage.

**Logs: 'what exactly happened?'**
- **Structured** (JSON) with consistent fields: timestamp, level, service, environment, `trace_id`, `request_id`, user/tenant ID (where allowed), event name, and relevant context.
```json
{"ts":"2026-03-01T10:15:32Z","level":"error","service":"orders","trace_id":"4bf92f...",
 "event":"payment_failed","order_id":"o_123","provider":"stripe","error":"card_declined","duration_ms":842}
```
- Log meaningful events and errors, not every line of code; use levels properly; sample high-volume debug logs.
- **Never log secrets or sensitive PII** (passwords, tokens, card numbers); scrub or hash.

**Traces: 'where did the time go across services?'**
- A trace represents one request; each operation (HTTP call, DB query, queue publish) is a **span** with start, duration, attributes and parent.
- Context propagates through headers (`traceparent`), including across queues (in message headers).
- Traces show the critical path: e.g. checkout took 2.3 s, of which 1.9 s was a call to the inventory service, which spent 1.8 s on a slow DB query.
- **Sampling**: head-based (e.g. 10% of requests) or **tail-based** (keep all slow/error traces, sample the rest).

**Instrumentation approach:**
- Use **OpenTelemetry** SDKs and auto-instrumentation for HTTP frameworks, DB clients and messaging, exporting to a backend (Prometheus/Grafana, Datadog, Honeycomb, Jaeger/Tempo).
- Add custom spans and attributes for important business operations.
- Inject the **trace ID into every log line**, so you can jump from a metric spike → example traces → logs for that request.
- Health endpoints and **synthetic checks** for critical journeys.

**Alerting:**
- Alert on **symptoms** users feel (error rate, latency SLO burn), not on every cause (CPU 80%).
- Each alert should be actionable with a **runbook** link.
- Use dashboards per service: golden signals at the top, dependencies below.

**Debugging flow example:**
1. Alert: checkout p99 latency SLO burning fast.
2. Metrics dashboard: latency up only for `POST /checkout` in one region, starting at 14:05, coinciding with a deploy.
3. Traces filtered to slow checkouts: the new version calls the pricing service once per cart item (N+1).
4. Logs for those trace IDs confirm the new code path and the cart sizes.
5. Roll back, then fix with a batch pricing call."

#### Another worked example: a high-cardinality bill
"A team added `user_id` as a label on a request latency histogram. With 2 million users and 20 histogram buckets, the metrics backend ingested 40 million new time series, the bill jumped 10× and queries timed out. We removed the label, kept per-user detail in logs and traces (where high cardinality is fine), and added a cardinality check in code review."

#### A third worked example: tracing across a queue
"Orders were sometimes confirmed minutes late. Traces stopped at the 'publish to queue' span, so we couldn't see the consumer side. We propagated trace context in message headers and created consumer spans linked to the producer's trace. The full trace showed messages waiting 4 minutes in the queue because the consumer group was under-provisioned during peaks, which we fixed with autoscaling on consumer lag."

#### Variations you might be asked
- "Monitoring vs observability?": monitoring checks known failure modes with predefined dashboards and alerts; observability lets you explore unknown problems with rich, correlated, high-cardinality data.
- "What are the four golden signals?": latency, traffic, errors and saturation (from Google's SRE book).
- "How do you control logging costs?": sampling, dropping debug logs in production, shorter retention for verbose logs, and metrics instead of logs for counts.

#### Signals compared
| Signal | Best for | Cost | Cardinality |
|---|---|---|---|
| Metrics | Alerts, trends, dashboards | Low | Must be low |
| Logs | Detailed events, errors | Medium–high | High OK |
| Traces | Cross-service latency, dependencies | Medium (sampled) | High OK |

#### Step-by-step framework
1. **Define the three signals** and their purposes.
2. **Instrument RED/USE + business metrics.**
3. **Structured logs** with trace IDs; no secrets.
4. **Distributed tracing** with propagation and sampling.
5. **Symptom-based alerts** with runbooks.
6. **Walk through a debugging flow.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We have logs" | Metrics, logs and traces with distinct roles |
| Plain-text logs | Structured logs with correlation IDs |
| Alerts on CPU | Symptom/SLO-based alerts |
| User IDs as metric labels | Cardinality awareness |
| No debugging story | Metric → trace → log flow |

#### Useful phrases
- "Metrics tell me something's wrong, traces tell me where, logs tell me why."
- "Every log line carries the trace ID."
- "Alert on what users feel, not on every cause."
- "High cardinality belongs in logs and traces, not metric labels."

#### Common pitfalls
- **Logging sensitive data.**
- **Alert fatigue.**
- **Averages instead of percentiles.**
- **Broken trace propagation** across async boundaries.

#### Follow-ups to expect (with sample answers)
- **"Why percentiles instead of averages?"**
  "Averages hide tail latency; p99 shows what the slowest 1% of users experience."
- **"Head vs tail sampling?"**
  "Head sampling decides at the start (cheap, may miss rare errors); tail sampling decides after the trace completes, keeping errors and slow traces."
- **"What would you put on a service dashboard?"**
  "RED metrics per endpoint, saturation of pools and queues, dependency latencies and errors, deploy markers, and key business metrics."

#### What senior interviewers look for
- **Practical, opinionated instrumentation.**
- **Cost and cardinality awareness.**
- **Fast incident diagnosis** using correlated signals.

#### Practise it
1. Design a dashboard for an orders service: list 10 panels and why.
2. Write an example structured log line for a failed payment.
3. Walk through debugging a latency spike using metrics, traces and logs, out loud.

## SLIs, SLOs and error budgets
- id: be-ops-02
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: SLI, SLO, SLA, error budget, reliability, alerting

### Prompt
What are SLIs, SLOs, SLAs and error budgets? How would you define them for an API, and how do they change how a team works?

### Answer
#### What the interviewer is really testing
- Precise definitions and the **difference between SLO and SLA**.
- Choosing **user-centric SLIs** and sensible targets (not 100%).
- Using **error budgets** to balance reliability and feature velocity.
- **Burn-rate alerting** and the organisational impact.

#### Key points
- **SLI (indicator):** a measured ratio of good events to valid events, e.g. % of requests succeeding within 300 ms.
- **SLO (objective):** target for an SLI over a window, e.g. 99.9% over 28 days.
- **SLA (agreement):** a contractual promise with consequences (credits); set **looser** than internal SLOs.
- **Error budget:** 100% − SLO; e.g. 99.9% → 0.1% → ~43 minutes of full downtime per 30 days, or 1 in 1,000 requests failing.
- **100% is the wrong target:** it's unachievable and stops all change; users can't tell the difference beyond a point.
- **Burn-rate alerts:** alert when budget is consumed too fast (multi-window, e.g. 2% of monthly budget in 1 hour).
- Error budget **policy**: if exhausted, prioritise reliability work and slow risky releases.

#### Model answer
"**Definitions:**
- **SLI (Service Level Indicator):** a quantitative measure of user experience, ideally expressed as `good events / valid events`. Examples: proportion of HTTP requests that return non-5xx; proportion served under 300 ms; proportion of messages processed within 5 minutes.
- **SLO (Service Level Objective):** a target for an SLI over a time window: '99.9% of checkout requests succeed over a rolling 28 days.'
- **SLA (Service Level Agreement):** a contract with customers, with penalties such as service credits. It should be looser than the SLO, so we notice problems and act before breaching contracts (e.g. SLO 99.9%, SLA 99.5%).
- **Error budget:** the allowed unreliability: 100% − SLO. At 99.9% over 30 days, the budget is 0.1% of requests, or ~43 minutes if fully down.

| SLO | Allowed downtime / 30 days |
|---|---|
| 99% | ~7.2 hours |
| 99.9% | ~43 minutes |
| 99.95% | ~22 minutes |
| 99.99% | ~4.3 minutes |

**Defining SLOs for an API (e.g. an orders API):**
1. **Identify critical user journeys**: browse catalogue, add to cart, checkout, view order status.
2. **Choose SLIs per journey**, measured as close to the user as possible (load balancer or client-side, not just inside the service):
   - Availability: proportion of valid requests not returning 5xx (4xx are usually excluded as client errors, except 429s caused by us).
   - Latency: proportion of requests faster than a threshold (e.g. 95% under 300 ms and 99% under 1 s).
   - For async work: freshness, e.g. 99% of orders confirmed within 2 minutes.
3. **Set targets** from current performance and user needs: checkout might be 99.95%, order history 99.5%. Each extra nine costs dramatically more, and the service can't be more reliable than its critical dependencies.
4. **Pick a window**: rolling 28 or 30 days.
5. **Write an error budget policy**, agreed with product: what happens when the budget is spent.

**Alerting with burn rates.** Alerting on every error spike causes noise; alerting only when the monthly SLO is breached is too late. Burn rate = how fast we're consuming budget relative to plan. A standard multi-window approach:
- **Page** if burning at 14.4× (2% of the monthly budget in 1 hour), confirmed over a short window (5 minutes) to avoid flapping.
- **Page** at 6× over 6 hours (5% of budget).
- **Ticket** at 1× over 3 days (slow burn).

**How it changes team behaviour:**
- Reliability becomes a **shared, quantified goal** between engineering and product rather than an argument.
- With budget left, the team can **ship faster** and take risks (experiments, migrations).
- When the budget is exhausted, the policy kicks in: freeze non-critical releases, prioritise reliability fixes, review postmortems.
- It discourages over-engineering: if we're consistently at 99.99% against a 99.9% SLO, we may be investing too much in reliability, or could tighten the SLO if users need it.
- It informs dependency decisions: you can't promise 99.99% on top of a dependency offering 99.9% without redundancy."

#### Another worked example: introducing SLOs to a noisy team
"A team received 200 alerts a week, mostly CPU and individual error spikes, and ignored most. We defined three SLOs (checkout availability 99.9%, checkout p99 under 1 s for 99% of requests, order confirmation within 2 minutes for 99%), replaced cause-based pages with burn-rate alerts, and moved other alerts to dashboards. Pages dropped to 3 per week, every one actionable, and the team used the error budget to agree with product on a two-week reliability sprint after a bad month."

#### A third worked example: SLO math with dependencies
"Our API depended synchronously on three services, each with 99.9% availability. Even with our own code perfect, availability could be as low as 99.7% (0.999³). To meet a 99.9% SLO we added caching for one dependency, made another call asynchronous, and added a fallback for the third, decoupling our availability from theirs."

#### Variations you might be asked
- "Should 4xx errors count against the SLO?": usually no (client errors), except those caused by our bugs or throttling we caused; define 'valid' events carefully.
- "Request-based vs time-based SLOs?": request-based measures proportion of good requests (better for high-traffic services); time-based measures good minutes (useful for low traffic).
- "Who owns the SLO?": the service team, agreed with product; SLOs are reviewed periodically.

#### Step-by-step framework
1. **Define SLI, SLO, SLA, error budget.**
2. **Pick critical user journeys.**
3. **Choose user-centric SLIs** and measurement points.
4. **Set realistic targets** considering dependencies and cost.
5. **Alert on burn rate.**
6. **Agree an error budget policy.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "SLA and SLO are the same" | Distinguishes contract vs internal target |
| Targets 100% | Explains why 100% is wrong |
| Server CPU as SLI | User-centric SLIs (success, latency) |
| Alerts on every error | Burn-rate alerts |
| No policy | Error budget policy agreed with product |

#### Useful phrases
- "An SLI is good events divided by valid events."
- "The SLA should be looser than the SLO, so we have a safety margin."
- "Error budgets turn reliability debates into data-driven decisions."
- "We alert when we're burning budget too fast, not on every spike."

#### Common pitfalls
- **Too many SLOs.**
- **Measuring at the wrong place** (inside the service only).
- **SLOs without a policy.**
- **Unrealistic nines.**

#### Follow-ups to expect (with sample answers)
- **"How do you choose the latency threshold?"**
  "From user research and current performance: what latency feels acceptable for that journey, and what the p95/p99 currently is."
- **"What if a dependency burns our budget?"**
  "It still counts: users don't care whose fault it is. We add resilience (caching, fallbacks) or negotiate with the dependency team."
- **"How do you report SLOs?"**
  "Dashboards showing SLI over the window, budget remaining, and burn rate; reviewed in weekly ops meetings."

#### What senior interviewers look for
- **User-centric thinking.**
- **Balancing reliability and velocity.**
- **Practical alerting** experience.

#### Practise it
1. Define SLIs and SLOs for three journeys in a product you know.
2. Calculate error budgets for 99.9% and 99.95% in minutes per month.
3. Explain burn-rate alerting, out loud, in 60 seconds.

## Incident response and blameless postmortems
- id: be-ops-03
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: incident response, on-call, postmortem, blameless, mitigation

### Prompt
Walk me through how you handle a production incident from the alert to the postmortem. What makes a good postmortem?

### Answer
#### What the interviewer is really testing
- A **calm, structured process**: detect, triage, mitigate, communicate, resolve, learn.
- **Mitigation before root cause**: restoring service first.
- **Roles** (incident commander, communications) and communication cadence.
- **Blameless culture** and postmortems that produce real improvements.

#### Key points
- **Detect:** alerts (ideally SLO-based), customer reports, synthetic checks.
- **Triage:** assess impact and severity; declare an incident; assign an **incident commander**.
- **Mitigate first:** rollback, feature flag off, failover, scale up, shed load. **Stop the bleeding** before finding the root cause.
- **Communicate:** regular updates to stakeholders and status page; one channel for the incident.
- **Resolve and verify:** metrics back to normal; monitor.
- **Postmortem:** blameless; timeline, impact, root causes and contributing factors, what went well, **action items with owners and dates**.
- Track action items to completion; share learnings.

#### Model answer
"I follow a structured process so that, under pressure, nothing important is forgotten.

**1. Detect and acknowledge.** An alert fires (e.g. checkout error rate SLO burning at 20×). The on-call engineer acknowledges within minutes and checks dashboards to confirm it's real.

**2. Triage and declare.**
- **Assess impact**: which users, which features, how many, since when? Is it getting worse?
- **Assign a severity** (e.g. SEV1: major customer-facing outage; SEV2: partial degradation; SEV3: minor).
- For SEV1/2, **declare an incident**: open a dedicated channel, start a timeline, and assign roles:
  - **Incident commander (IC):** coordinates, makes decisions, doesn't necessarily debug.
  - **Operations/subject experts:** investigate and act.
  - **Communications lead:** updates stakeholders, support and the status page.
  - **Scribe:** records the timeline (can be the IC in small teams).

**3. Mitigate first.** The priority is restoring service, not understanding everything. Typical first questions:
- *What changed?* Recent deploys, config changes, feature flags, infrastructure changes, traffic patterns, dependency status.
- Mitigations: **roll back** the deploy, **disable a feature flag**, **fail over** to another region, **scale up**, **shed load** or rate limit, **block abusive traffic**, restart unhealthy instances.
- Prefer **reversible, low-risk** actions; announce each action in the channel before doing it.

**4. Communicate regularly.** Updates every 15–30 minutes, even if 'no change': what's impacted, what we're doing, next update time. Status page for customers. Avoid speculation in external comms.

**5. Resolve and verify.** Confirm metrics have recovered, watch for recurrence, then declare resolved. Clean up temporary mitigations later deliberately.

**6. Postmortem** within a few days, for any significant incident.

**What makes a good postmortem:**
- **Blameless:** focuses on systems and processes, not individuals. People act reasonably given the information and tools they had; if a human could make a mistake, the system allowed it. Blame drives hiding, and hiding prevents learning.
- **Clear summary and impact:** duration, users affected, revenue or SLO budget consumed.
- **Detailed timeline:** detection, key decisions, mitigation, resolution, with timestamps.
- **Root cause and contributing factors:** using '5 whys' or similar, going beyond the trigger. E.g. trigger: a bad config; contributing: no validation, no canary for config, alert took 20 minutes, runbook outdated.
- **What went well** and **where we got lucky**.
- **Action items**: specific, owned, prioritised, with due dates, categorised as prevent, detect faster, mitigate faster. Tracked to completion.
- **Shared widely** so other teams learn.

**Example timeline excerpt:**
```
14:02  Deploy v3.41 of pricing service begins (canary skipped: config-only change)
14:06  Checkout error rate rises to 18%; SLO burn alert fires
14:09  On-call acknowledges; incident declared SEV1; IC assigned
14:14  Correlated with pricing deploy; decision to roll back
14:19  Rollback complete; errors falling
14:25  Error rate normal; monitoring
14:55  Incident resolved
```
Action items: enforce canary for config changes (prevent), add config schema validation (prevent), alert on pricing-service 5xx directly (detect), document rollback for config (mitigate)."

#### Another worked example: an incident where root cause took days
"A memory-related crash loop hit our search service at 2 a.m. We couldn't find the cause quickly, so we mitigated by scaling to more, larger instances and enabling a cached fallback for search results, restoring service in 25 minutes. The root cause, a pathological query pattern causing huge allocations, took two days to find. Separating mitigation from root cause analysis kept the outage short."

#### A third worked example: a postmortem that changed culture
"After an engineer ran a migration that locked a large table during peak hours, the initial reaction was 'they should have known'. The blameless postmortem asked why the system allowed it: no migration review checklist, no lock timeout, no tooling to detect blocking migrations. Actions: `lock_timeout` defaults, an online migration tool, and CI checks flagging risky DDL. Engineers became more willing to report near misses afterwards."

#### Variations you might be asked
- "What would you do if you were on call and didn't know the system?": follow runbooks, escalate early, focus on mitigation (rollback), and communicate what you know.
- "How do you avoid alert fatigue for on-call?": SLO-based alerts, removing non-actionable alerts, reviewing pages weekly.
- "When do you escalate?": when impact is high, you're not making progress within a set time, or you need expertise or authority you don't have.

#### Step-by-step framework
1. **Detect and acknowledge.**
2. **Assess impact, set severity, assign roles.**
3. **Mitigate first** (what changed? roll back?).
4. **Communicate on a cadence.**
5. **Resolve and verify.**
6. **Blameless postmortem** with tracked action items.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Starts debugging root cause immediately | Mitigates first |
| No roles or communication | IC, comms, regular updates |
| "Find who caused it" | Blameless, systemic causes |
| Vague actions ("be more careful") | Specific, owned, dated actions |
| Postmortem filed and forgotten | Tracked to completion, shared |

#### Useful phrases
- "First: what changed? Can we roll it back?"
- "Stop the bleeding, then find the cause."
- "If a person could make that mistake, the system allowed it."
- "Every action item has an owner and a date."

#### Common pitfalls
- **Heroic solo debugging** without communication.
- **Risky fixes during the incident.**
- **Blame-focused postmortems.**
- **Action items never done.**

#### Follow-ups to expect (with sample answers)
- **"How do you decide severity?"**
  "By user impact (scope, critical features, data loss), predefined in a severity matrix."
- **"What's the '5 whys' technique?"**
  "Repeatedly asking why to move from the immediate trigger to underlying causes; useful but there are usually multiple contributing factors, not one root cause."
- **"What metrics track incident response quality?"**
  "Time to detect, time to mitigate, time to resolve, incidents per month, action item completion rate."

#### What senior interviewers look for
- **Calm leadership** under pressure.
- **Mitigation-first instinct.**
- **Learning culture** and follow-through.

#### Practise it
1. Write a postmortem for an incident you've experienced (or a public one) using the structure above.
2. Role-play the first 15 minutes of an incident as IC, out loud.
3. Prepare a STAR story about an incident you handled.

## Deployment strategies: blue-green, canary, rolling
- id: be-ops-04
- roles: backend, fullstack
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: deployment, canary, blue-green, rolling, feature flags, rollback

### Prompt
Compare rolling, blue-green and canary deployments. How do you deploy safely, roll back quickly, and handle database changes during deployments?

### Answer
#### What the interviewer is really testing
- Understanding each strategy's **mechanics, costs and risks**.
- **Automated analysis** and **fast rollback**.
- Decoupling **deploy from release** with feature flags.
- **Backward-compatible database migrations** (expand-contract).

#### Key points
- **Rolling:** replace instances gradually; low extra capacity; old and new versions run **simultaneously**; rollback = another rolling deploy.
- **Blue-green:** full parallel environment; switch traffic at once; **instant rollback** by switching back; costs double capacity during deploys; all users hit the new version at once.
- **Canary:** send a small percentage of traffic to the new version, monitor, increase gradually; limits blast radius; needs good **metrics and automated analysis**.
- **Feature flags:** deploy code dark, release to users separately; kill switch for features.
- **Database changes:** **expand-contract** (add new, dual-write/backfill, switch reads, remove old) so old and new versions both work.
- Health checks, readiness, connection draining, and automated rollback on SLO regressions.

#### Model answer
"**Rolling deployment:**
- Replace instances in batches (e.g. 25% at a time); each new instance must pass readiness checks before the next batch.
- **Pros:** no extra infrastructure; default in Kubernetes (`maxSurge`, `maxUnavailable`).
- **Cons:** old and new versions serve traffic simultaneously (so they must be compatible); problems may reach many users before detected; rollback takes as long as the deploy.

**Blue-green deployment:**
- Two identical environments: blue (live) and green (new version). Deploy to green, test it, then switch the router/load balancer to green.
- **Pros:** **instant rollback** (switch back to blue); test the new version in a production-like environment before it takes traffic.
- **Cons:** double capacity during deploys; all users switch at once, so a bug not caught in testing affects everyone; database shared between both, so schema must be compatible with both versions; long-lived connections need draining.

**Canary deployment:**
- Deploy the new version to a small subset (e.g. 1–5% of traffic or one instance), compare its metrics with the baseline (error rate, latency, business metrics like checkout conversion), then gradually increase: 5% → 25% → 50% → 100%.
- **Pros:** limits **blast radius**; real production traffic validates the change.
- **Cons:** needs traffic splitting (service mesh, load balancer weights) and good observability; low-traffic services need longer bakes for statistical confidence.
- **Automated canary analysis** (e.g. Argo Rollouts, Flagger, Spinnaker/Kayenta) can promote or roll back automatically based on metric comparisons.

**Feature flags: separating deploy from release:**
- Ship code to production disabled, then enable it for internal users, then a percentage of customers, then everyone.
- A bad feature can be turned off in seconds without a deploy.
- Clean up old flags to avoid complexity.

**Safe deployment practices:**
- Small, frequent deploys (easier to diagnose and roll back).
- Readiness probes and connection draining for zero downtime.
- Deploy markers on dashboards.
- **Automated rollback** when SLO metrics regress.
- Deploy during working hours with the author available; avoid Friday evening big-bangs.
- Config changes go through the same safety (canary, validation), since many incidents come from config.

**Database changes: expand-contract.** During any deploy (especially rolling/canary), old and new code run at the same time against the same database, so schema changes must be backward compatible. Example: renaming `customer_name` to `full_name`:
1. **Expand:** add `full_name` (nullable). Deploy code that writes to both columns, still reads the old.
2. **Backfill:** copy existing data in batches.
3. **Switch reads:** deploy code that reads `full_name`.
4. **Contract:** stop writing `customer_name`; later drop it once no code uses it.
Each step is independently deployable and reversible. Avoid locking migrations on large tables (use online schema change tools, add indexes concurrently, set lock timeouts).

**Choosing:**
| Strategy | Rollback speed | Extra cost | Blast radius | Complexity |
|---|---|---|---|---|
| Rolling | Medium | Low | Grows during rollout | Low |
| Blue-green | Instant | High (2×) | All at switch | Medium |
| Canary | Fast | Low–medium | Small initially | High (needs metrics) |

For most services I'd use **canary with automated analysis**, plus feature flags for risky features; blue-green where instant full rollback matters and capacity is cheap; rolling for low-risk internal services."

#### Another worked example: a canary that saved checkout
"A new payment library version passed all tests. At 5% canary traffic, automated analysis saw checkout success drop from 97.8% to 95.1% for the canary group within 12 minutes, caused by a timeout default change affecting one card provider. The rollout automatically rolled back; only a fraction of 5% of users were affected for a few minutes."

#### A third worked example: a migration that broke rolling deploys
"A team renamed a column and deployed code using the new name in one release. During the rolling deploy, old instances still queried the old column, which no longer existed, and errored for 10 minutes. Afterwards, the team adopted expand-contract migrations and a CI check that flags destructive schema changes (drops/renames) in the same release as code changes."

#### Variations you might be asked
- "What's a shadow deployment?": mirror production traffic to the new version without returning its responses, comparing results; great for risky rewrites (but avoid side effects like double writes).
- "How do you deploy mobile backends with old clients?": keep APIs backward compatible for a long time; version APIs and monitor client versions.
- "What's GitOps?": the desired state in git, with an agent (Argo CD, Flux) reconciling clusters to match it.

#### Step-by-step framework
1. **Explain each strategy's mechanics.**
2. **Compare rollback, cost, blast radius.**
3. **Separate deploy and release** with feature flags.
4. **Automate analysis and rollback.**
5. **Handle DB migrations** with expand-contract.
6. **Recommend** based on context.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Lists names only | Explains mechanics and trade-offs |
| Ignores version overlap | Notes old/new compatibility needs |
| Manual monitoring | Automated canary analysis and rollback |
| Schema change in same deploy | Expand-contract migrations |
| No feature flags | Deploy vs release separation |

#### Useful phrases
- "Canary limits blast radius; blue-green gives instant rollback."
- "During a rolling deploy, old and new versions run side by side."
- "Feature flags separate deploying code from releasing features."
- "Schema changes go expand, migrate, contract."

#### Common pitfalls
- **Breaking schema changes.**
- **Canary without meaningful metrics.**
- **Config changes bypassing safeguards.**
- **Never removing feature flags.**

#### Follow-ups to expect (with sample answers)
- **"How long should a canary bake?"**
  "Long enough for statistical confidence and to cover relevant traffic patterns: minutes for high-traffic services, longer for low traffic or periodic jobs."
- **"How do you roll back a database migration?"**
  "Prefer forward-only, backward-compatible migrations so code can roll back without schema rollback; destructive steps happen only after the new code is proven."
- **"How do you deploy with zero downtime?"**
  "Readiness checks, connection draining, graceful shutdown, backward-compatible APIs and schemas."

#### What senior interviewers look for
- **Risk management** through blast radius and rollback.
- **Database migration discipline.**
- **Automation** over manual vigilance.

#### Practise it
1. Explain the three strategies with a diagram, out loud.
2. Write an expand-contract plan for splitting a `name` column into `first_name` and `last_name`.
3. Define automated canary success criteria for a checkout service.

## Containers and Kubernetes basics
- id: be-ops-05
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: containers, Docker, Kubernetes, pods, deployments, probes

### Prompt
What are containers, and how do they differ from virtual machines? Explain the core Kubernetes concepts a backend engineer needs, and what you'd configure to run a service reliably on Kubernetes.

### Answer
#### What the interviewer is really testing
- Understanding **containers vs VMs** (isolation, overhead, images).
- Core Kubernetes objects: **Pod, Deployment, Service, ConfigMap/Secret, Ingress, HPA**.
- Production configuration: **resource requests/limits, probes, graceful shutdown, disruption budgets**.
- Writing **good container images** (small, secure, reproducible).

#### Key points
- **Containers** package an app with its dependencies, sharing the host **kernel**; isolation via namespaces and cgroups. Lightweight, start in seconds.
- **VMs** virtualise hardware with a full guest OS; stronger isolation, heavier.
- **Images** are layered and immutable; build once, run anywhere; tag by version/commit, not `latest`.
- **Kubernetes:** declarative desired state reconciled by controllers.
- **Pod:** smallest unit (one or more containers sharing network/storage). **Deployment:** manages ReplicaSets for stateless pods with rolling updates. **Service:** stable virtual IP/DNS for a set of pods. **Ingress/Gateway:** HTTP routing from outside. **ConfigMap/Secret:** configuration. **StatefulSet:** stable identity/storage. **Job/CronJob:** batch work. **HPA:** autoscaling.
- Reliability config: **requests/limits**, **readiness/liveness/startup probes**, **graceful shutdown**, **PodDisruptionBudgets**, **anti-affinity/topology spread**.

#### Model answer
"**Containers vs VMs.**
- A **VM** runs a full guest operating system on a hypervisor: strong isolation, but each VM uses GBs of memory and boots in tens of seconds or minutes.
- A **container** is a process (or group) isolated using Linux **namespaces** (its own view of processes, network, filesystem) and limited using **cgroups** (CPU, memory). Containers share the host kernel, so they're lightweight and start in milliseconds to seconds.
- Trade-off: weaker isolation than VMs (a kernel exploit can escape), so multi-tenant untrusted workloads may use VMs or sandboxed runtimes (gVisor, Firecracker).

**Container images:**
- Built from a Dockerfile into immutable layers. Good practices:
```dockerfile
# multi-stage build: compile in one stage, ship a small runtime image
FROM python:3.12-slim AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt
COPY . .

FROM python:3.12-slim
COPY --from=build /install /usr/local
COPY --from=build /app /app
WORKDIR /app
USER 10001                       # don't run as root
EXPOSE 8000
CMD ["gunicorn", "app:app", "-b", "0.0.0.0:8000", "--workers", "4"]
```
- Small base images, non-root user, pinned versions, scanned for vulnerabilities, tagged with the git SHA, config from environment (not baked in), logs to stdout.

**Kubernetes core concepts:**
- **Declarative model:** you submit desired state (YAML); controllers continuously reconcile actual state towards it. If a pod dies, the Deployment's ReplicaSet creates a new one.
- **Pod:** one or more tightly coupled containers sharing an IP and volumes (e.g. app + sidecar). Pods are ephemeral and replaceable.
- **Deployment:** declares the pod template and replica count; handles rolling updates and rollbacks.
- **Service:** a stable DNS name and virtual IP that load-balances to pods matching a label selector, only routing to **ready** pods.
- **Ingress / Gateway API:** HTTP(S) routing from outside the cluster to services.
- **ConfigMap / Secret:** configuration and sensitive values, mounted as env vars or files (Secrets should be encrypted at rest and ideally sourced from a secret manager).
- **StatefulSet:** stable network identity and persistent volumes per pod (databases, Kafka); **Job / CronJob:** run-to-completion and scheduled tasks.
- **HorizontalPodAutoscaler:** scales replicas on CPU, memory or custom metrics.
- **Namespaces:** logical separation for teams/environments with RBAC and quotas.

**Configuring a service reliably:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: orders }
spec:
  replicas: 3
  strategy: { rollingUpdate: { maxSurge: 1, maxUnavailable: 0 } }
  selector: { matchLabels: { app: orders } }
  template:
    metadata: { labels: { app: orders } }
    spec:
      terminationGracePeriodSeconds: 30
      topologySpreadConstraints:
        - { maxSkew: 1, topologyKey: topology.kubernetes.io/zone,
            whenUnsatisfiable: ScheduleAnyway, labelSelector: { matchLabels: { app: orders } } }
      containers:
        - name: orders
          image: registry.example.com/orders:3f2a1c9
          ports: [{ containerPort: 8000 }]
          resources:
            requests: { cpu: "500m", memory: "512Mi" }
            limits:   { memory: "512Mi" }
          readinessProbe: { httpGet: { path: /ready, port: 8000 }, periodSeconds: 5 }
          livenessProbe:  { httpGet: { path: /live,  port: 8000 }, periodSeconds: 10, failureThreshold: 3 }
          startupProbe:   { httpGet: { path: /live,  port: 8000 }, failureThreshold: 30, periodSeconds: 2 }
          lifecycle: { preStop: { exec: { command: ["sleep", "5"] } } }
```
- **Resource requests** tell the scheduler how much to reserve; **limits** cap usage. Exceeding the memory limit gets the container **OOMKilled**; CPU limits cause **throttling** (many teams set CPU requests but no CPU limit for latency-sensitive services).
- **Readiness probe:** only receive traffic when ready; **liveness probe:** restart if stuck (keep it simple; don't check dependencies); **startup probe:** protects slow-starting apps from premature liveness kills.
- **Graceful shutdown:** on SIGTERM, stop accepting new requests, finish in-flight ones, close connections; a short `preStop` sleep lets endpoints update before shutdown.
- **High availability:** at least 2–3 replicas spread across zones, plus a **PodDisruptionBudget** (e.g. `minAvailable: 2`) so node maintenance doesn't take all pods down.
- **Autoscaling:** HPA on CPU or request rate, with cluster autoscaler adding nodes.
- **Observability:** logs to stdout, metrics endpoints scraped, traces exported."

#### Another worked example: an OOMKill loop
"A Java service kept restarting with `OOMKilled`. The container memory limit was 1 GiB, but the JVM heap was set to 1 GiB too, leaving no room for metaspace, threads and native memory. We set `-XX:MaxRAMPercentage=70` so the heap scales with the container limit, and raised the limit to 1.5 GiB after profiling. Restarts stopped."

#### A third worked example: liveness probes causing an outage
"A service's liveness probe checked the database. During a brief database failover, every pod failed liveness and Kubernetes restarted them all simultaneously; the restart storm prolonged the outage. We changed liveness to a simple 'process responsive' check, moved dependency checks to readiness (with care), and the next failover caused only brief errors."

#### Variations you might be asked
- "What happens when you run `kubectl apply`?": the API server validates and stores the object in etcd; controllers notice and act (e.g. create ReplicaSets/pods); the scheduler assigns pods to nodes; kubelets start containers.
- "What's a sidecar?": a helper container in the same pod (log shipper, service mesh proxy).
- "When would you not use Kubernetes?": small teams or simple apps where a managed PaaS (Cloud Run, App Runner, Heroku-style) is simpler and cheaper to operate.

#### Step-by-step framework
1. **Containers vs VMs.**
2. **Good images.**
3. **Core Kubernetes objects** and the declarative model.
4. **Resources and probes.**
5. **Graceful shutdown, HA, disruption budgets.**
6. **Autoscaling and observability.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Containers are lightweight VMs" | Namespaces, cgroups, shared kernel |
| `latest` tags, root user | SHA tags, non-root, small images |
| No resource requests | Requests/limits and OOM/throttling awareness |
| Liveness checks dependencies | Liveness simple, readiness for traffic |
| Single replica | Replicas across zones + PDB |

#### Useful phrases
- "Kubernetes continuously reconciles actual state with desired state."
- "Readiness controls traffic; liveness controls restarts."
- "Memory limits cause OOM kills; CPU limits cause throttling."
- "Pods are cattle: any one can disappear at any time."

#### Common pitfalls
- **No requests/limits.**
- **Deep liveness checks.**
- **Ignoring SIGTERM.**
- **Secrets in images or plain ConfigMaps.**

#### Follow-ups to expect (with sample answers)
- **"How do pods find each other?"**
  "Through Services and cluster DNS: `orders.default.svc.cluster.local` resolves to the Service's IP, which routes to ready pods."
- **"How do you roll back a bad deployment?"**
  "`kubectl rollout undo`, or revert the manifest in git with GitOps; ideally automated on failed health metrics."
- **"How would you run a database on Kubernetes?"**
  "StatefulSets with persistent volumes and an operator, but often a managed database service is the better choice."

#### What senior interviewers look for
- **Practical production config.**
- **Understanding failure modes** (OOM, probe storms).
- **Pragmatism** about when Kubernetes is worth it.

#### Practise it
1. Write a Deployment and Service YAML for a simple API with probes and resources.
2. Explain what happens when a pod receives SIGTERM, step by step.
3. Explain containers vs VMs, out loud, in 60 seconds.

## Designing a CI/CD pipeline
- id: be-ops-06
- roles: backend, fullstack
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: CI/CD, testing, pipelines, automation, supply chain

### Prompt
Design a CI/CD pipeline for a backend service from commit to production. What stages would you include, how would you keep it fast and reliable, and how do you make deployments safe?

### Answer
#### What the interviewer is really testing
- Knowledge of pipeline **stages** and the **test pyramid**.
- Balancing **speed** (fast feedback) with **safety**.
- **Build once, promote the same artifact**; environment parity.
- **Security** in the pipeline (secrets, dependency scanning, signed artifacts) and **progressive delivery**.

#### Key points
- **CI** (on every push/PR): lint, type check, unit tests, build, integration tests, security scans; **fast** (target under ~10 minutes).
- **CD**: build an immutable artifact (container image tagged with commit SHA) **once**; deploy the same artifact to staging and production.
- Test pyramid: many **unit**, fewer **integration/contract**, very few **end-to-end** tests.
- Speed: caching, parallelism, running only affected tests, fast test suites; fix or quarantine **flaky tests**.
- Safety: automated migrations (backward compatible), canary/progressive delivery, automated rollback, deploy markers.
- Security: least-privilege CI credentials (OIDC), secret scanning, dependency/image scanning, SBOM, signed images.
- **Trunk-based development** with small PRs and feature flags.

#### Model answer
"**Principles:** fast feedback, build once and promote, automate everything repeatable, make deployments small, frequent and reversible.

**Pipeline stages:**
```
PR opened/updated
  ├─ Lint, format, type check                 (1 min)
  ├─ Unit tests (parallel)                    (2–4 min)
  ├─ Build container image (cached layers)    (2 min)
  ├─ Integration tests (DB/Redis via containers), contract tests (3–5 min)
  └─ Security: secret scan, dependency scan, SAST, image scan
Merge to main
  ├─ Build & tag image with commit SHA, push to registry, sign, generate SBOM
  ├─ Deploy to staging (same image)
  ├─ Run migrations (backward compatible)
  ├─ Smoke tests + small E2E suite on critical journeys
  ├─ Deploy to production: canary 5% → automated analysis → 25% → 100%
  └─ Post-deploy checks; automatic rollback on SLO regression
```

**CI details:**
- **Fast checks first** so developers get feedback in minutes.
- **Unit tests** for logic, **integration tests** against real dependencies in containers (Testcontainers) rather than heavy mocks, **contract tests** (e.g. Pact or schema checks) to catch API breaking changes between services.
- Required status checks before merge, plus code review.

**Build once, promote:** the artifact deployed to production must be **exactly** what was tested in staging: same image digest, with environment-specific configuration injected at runtime. Rebuilding per environment risks differences.

**CD and safety:**
- **Migrations**: run as a separate step before the code deploy, always backward compatible (expand-contract), with lock timeouts.
- **Progressive delivery**: canary with automated metric analysis (error rate, latency, business KPIs), automated rollback.
- **Feature flags** for releasing risky features separately from deploys.
- **Deploy markers** on dashboards and notifications in team chat.
- Approval gates only where truly needed (regulated environments); otherwise automate.

**Keeping it fast:**
- Cache dependencies and Docker layers; order Dockerfile steps from least to most frequently changing.
- Parallelise test shards; run tests affected by the change in monorepos (Bazel, Nx, Turborepo).
- Keep E2E tests few and focused on critical journeys.
- Track pipeline duration as a metric and treat slowness as a bug.

**Keeping it reliable:**
- **Flaky tests** erode trust: detect them (rerun statistics), quarantine, and fix promptly.
- Hermetic builds with pinned versions.
- Pipeline as code, reviewed like application code.

**Security in the pipeline (supply chain):**
- CI authenticates to cloud via **OIDC** short-lived credentials, not long-lived keys.
- Secrets in a secret manager, masked in logs; secret scanning on commits.
- Dependency scanning (and automated update PRs), container image scanning, SBOM generation.
- **Signed images** (e.g. Sigstore/cosign) and admission policies that only allow signed images from trusted registries.
- Protect main branch: required reviews, no force pushes.

**Metrics I'd track (DORA):** deployment frequency, lead time for changes, change failure rate, and time to restore service."

#### Another worked example: from weekly releases to daily deploys
"A team released weekly with a 2-hour manual checklist and frequent rollbacks. We introduced a pipeline with parallel tests (CI from 40 to 9 minutes), built images once and promoted them, automated backward-compatible migrations, and added canary analysis. Within three months they deployed 5–10 times per day, change failure rate fell from 25% to 6%, and rollbacks became automatic and rare."

#### A third worked example: a flaky test culture problem
"Developers routinely clicked 'rerun' on failing pipelines because 8% of runs failed from flaky tests. A real bug slipped through when a genuine failure was assumed to be flaky. We added flaky-test detection, quarantined offenders with owner tickets, fixed timing-dependent tests (fake clocks, awaiting conditions instead of sleeps), and brought flake rate under 0.5%."

#### Variations you might be asked
- "Continuous delivery vs continuous deployment?": delivery means every change is deployable (release may be manual); deployment means every passing change goes to production automatically.
- "How do you handle a monorepo?": affected-target detection, build caching and per-service deploy pipelines.
- "How do you test database migrations?": run them in CI against a production-like schema snapshot, check for locking operations, and test rollback/compatibility with the previous app version.

#### Step-by-step framework
1. **Define principles** (fast feedback, build once, automate).
2. **CI stages** with test pyramid.
3. **Artifact build, signing and promotion.**
4. **CD with migrations and progressive delivery.**
5. **Speed and reliability practices.**
6. **Security and metrics (DORA).**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Run tests then deploy" | Detailed stages and timing |
| Rebuild per environment | Build once, promote by digest |
| Many slow E2E tests | Test pyramid, contract tests |
| Ignores flakiness | Detect, quarantine, fix |
| Long-lived CI secrets | OIDC, scanning, signed images |
| No safety on deploy | Canary, automated rollback, flags |

#### Useful phrases
- "Build once and promote the same image through environments."
- "Fast checks first: developers should know within minutes."
- "Flaky tests are worse than no tests because people learn to ignore failures."
- "We track DORA metrics to see if the pipeline helps."

#### Common pitfalls
- **Slow pipelines** leading to big batched changes.
- **Environment drift** between staging and prod.
- **Manual deploy steps.**
- **Secrets in pipeline config.**

#### Follow-ups to expect (with sample answers)
- **"What's a good CI duration target?"**
  "Under about 10 minutes for PR feedback; beyond that, people context-switch and batch changes."
- **"Who can deploy to production?"**
  "The pipeline, triggered by merges to main; humans don't need production credentials for routine deploys."
- **"How do you deploy multiple dependent services?"**
  "Keep APIs backward compatible so services deploy independently; avoid lockstep releases."

#### What senior interviewers look for
- **End-to-end ownership** of delivery.
- **Balance of speed and safety.**
- **Supply chain security awareness.**

#### Practise it
1. Draw your ideal pipeline with stage timings.
2. List five ways to speed up a 30-minute CI pipeline.
3. Explain the four DORA metrics, out loud.

## Scaling under load: autoscaling and load testing
- id: be-ops-07
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: autoscaling, load testing, capacity planning, bottlenecks

### Prompt
Your service needs to handle a 10× traffic spike for a big launch. How do you prepare: load testing, autoscaling, capacity planning and finding bottlenecks?

### Answer
#### What the interviewer is really testing
- A structured **capacity planning** approach: estimate, test, find bottlenecks, fix, re-test.
- **Load testing** methodology (realistic traffic, ramp patterns, metrics).
- **Autoscaling** mechanics and limits (warm-up time, downstream capacity).
- Recognising that **stateful components** (databases) are usually the real bottleneck.

#### Key points
- **Estimate** expected load: peak requests/s per endpoint, traffic mix, data volumes.
- **Load test** with realistic scenarios: steady, **ramp**, **spike**, **soak** tests; tools like k6, Gatling, Locust, JMeter.
- Measure **throughput, latency percentiles, error rate, resource saturation** (CPU, memory, DB connections, queue depth).
- Find the **bottleneck** (usually database, connection pools, locks, external APIs), fix, repeat.
- **Autoscaling:** horizontal (more instances) on CPU/request rate/queue lag; vertical for databases; scheduled scaling for known events; mind **scale-up delay**.
- **Pre-scale** before known spikes; warm caches.
- Protect with **rate limiting, load shedding, graceful degradation**, and queues for async work.
- Check **downstream and third-party** limits, cloud quotas.

#### Model answer
"I'd treat it as a project with four parts: **estimate, test, fix, protect**.

**1. Estimate the load.**
- From current traffic: e.g. normal peak 500 req/s; launch expected 10× → **5,000 req/s**, with the mix shifting towards specific endpoints (sign-up, product page, checkout).
- Translate into resource needs: DB queries per request, cache hit rates, payload sizes, third-party calls per request.
- Identify the **critical journeys** that must work (checkout) vs those that can degrade (recommendations).

**2. Load test realistically.**
- Environment: production-like (same instance types, data volume, configuration), or production itself during low traffic with care.
- **Realistic scenarios**: traffic mix per endpoint, realistic user think times, data variety (not the same product ID every time, which would make caches unrealistically effective).
- Test types:
  - **Ramp test**: gradually increase until failure, finding the breaking point.
  - **Spike test**: jump from 1× to 10× in a minute, testing autoscaling and cold caches.
  - **Soak test**: sustained high load for hours, finding leaks and slow degradation.
- Example k6 script:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  stages: [
    { duration: '5m', target: 500 },
    { duration: '10m', target: 5000 },   // ramp to launch level
    { duration: '30m', target: 5000 },   // hold
    { duration: '5m', target: 0 },
  ],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(99)<800'] },
};
export default function () {
  const id = Math.floor(Math.random() * 100000);
  const res = http.get(`https://staging.example.com/api/products/${id}`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```
- Watch **latency percentiles, errors, throughput**, and **saturation** across all layers: app CPU/memory, thread and connection pools, DB CPU, locks and slow queries, cache hit rate, queue lag, network.

**3. Find and fix bottlenecks.** Usually in this order of likelihood:
- **Database**: slow queries (add indexes, fix N+1), too many connections (pooling, PgBouncer), write contention (hot rows), need for read replicas or caching.
- **Connection pools / thread pools** too small or too large.
- **External APIs** with rate limits: ask providers for limit increases, cache responses, queue calls.
- **Locks and contention** in application code.
- **Inefficient code paths**: profile under load (flame graphs).
- Fix the top bottleneck, re-test, and find the next one. Stop when target load + headroom (e.g. 1.5×) passes thresholds.

**4. Autoscaling and protection.**
- **Horizontal autoscaling** for stateless services on CPU, request rate or latency; for workers, on **queue depth/lag**.
- Autoscaling takes time (new nodes: minutes; JVM warm-up), so for a known launch, **pre-scale** (scheduled scaling) and set high minimum replicas; keep autoscaling for unexpected extra.
- **Databases** don't autoscale instantly: scale vertically ahead of time, add read replicas, verify connection limits.
- **Caches**: pre-warm hot keys (product pages); use CDN for static and cacheable content.
- **Protect the core**: rate limiting per client, load shedding with priority (keep checkout, shed recommendations), feature flags to turn off expensive features, queue non-urgent work (emails, analytics).
- Check **cloud quotas** (instance limits, IP addresses) and third-party limits in advance.
- Launch day: war room, dashboards, runbooks, and rollback/kill-switch plans."

#### Another worked example: the database was the real limit
"For a ticket sale, the API tier scaled from 10 to 80 pods easily in testing, but at 3,000 req/s the database hit 100% CPU and max connections. Causes: a missing index on `events.slug`, and each pod holding 20 connections (1,600 total). Fixes: the index (query from 120 ms to 2 ms), PgBouncer in transaction mode, a 30-second cache for event pages, and a queue-based checkout. The re-test sustained 8,000 req/s with p99 under 400 ms."

#### A third worked example: autoscaling too slow for a spike
"A push notification sent to 5 million users caused traffic to jump 15× in 60 seconds. The autoscaler needed 4 minutes to add capacity; meanwhile requests timed out. Fixes: staggering notifications over 15 minutes, scheduled pre-scaling before campaigns, and load shedding of non-critical endpoints during spikes."

#### Variations you might be asked
- "Vertical vs horizontal scaling?": vertical = bigger machines (simple, limited, often needs restart); horizontal = more machines (needs stateless design, scales further).
- "How do you capacity plan for steady growth?": track utilisation trends per service and database, forecast, and keep headroom (e.g. scale when sustained utilisation exceeds 60–70%).
- "How do you load test without affecting production users?": staging with production-like data, or production during off-peak with synthetic accounts and careful rate controls.

#### Step-by-step framework
1. **Estimate** peak load and traffic mix.
2. **Load test** (ramp, spike, soak) realistically.
3. **Monitor saturation** at every layer.
4. **Fix bottlenecks iteratively.**
5. **Autoscale and pre-scale**; prepare databases and caches.
6. **Protect** with rate limits, load shedding, feature flags; plan launch day.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Turn on autoscaling" | Estimate, test, fix, protect |
| Load tests one endpoint with one ID | Realistic mix and data |
| Ignores database | Database usually the bottleneck |
| Relies on reactive autoscaling for known spike | Pre-scaling and warm caches |
| No degradation plan | Load shedding, kill switches |

#### Useful phrases
- "Autoscaling handles the app tier; the database is usually what breaks."
- "I'd pre-scale for a known event rather than rely on reactive autoscaling."
- "Find the bottleneck, fix it, re-test: there's always a next one."
- "We keep checkout up by shedding non-critical features."

#### Common pitfalls
- **Unrealistic load tests** (cache always hit).
- **Ignoring connection limits.**
- **Forgetting third-party limits and quotas.**
- **No soak test** (leaks show up after hours).

#### Follow-ups to expect (with sample answers)
- **"What metric would you autoscale on?"**
  "CPU for compute-bound services, request rate or concurrency for I/O-bound ones, queue lag for workers; validated in load tests."
- **"How much headroom do you keep?"**
  "Enough to absorb a zone failure plus normal spikes: often running at 50–60% of capacity at peak."
- **"How do you know your load test matches reality?"**
  "Compare traffic mix and cache hit rates with production metrics, or replay sampled production traffic."

#### What senior interviewers look for
- **Methodical capacity planning.**
- **Bottleneck intuition** (databases, pools, third parties).
- **Launch readiness** and protective measures.

#### Practise it
1. Write a k6 (or Locust) script with ramp and spike stages for an API you know.
2. List the saturation metrics you'd watch at each layer.
3. Explain how you'd prepare for a 10× launch, out loud, in 3 minutes.

## Debugging a production latency spike
- id: be-ops-08
- roles: backend, fullstack
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: debugging, latency, performance, incident, profiling

### Prompt
p99 latency for your API jumped from 200 ms to 3 seconds in the last 30 minutes. Walk me through how you'd investigate and fix it.

### Answer
#### What the interviewer is really testing
- A **systematic, hypothesis-driven** debugging approach.
- **Mitigation first** when users are affected.
- Effective use of **metrics, traces, logs and profiling**.
- Knowledge of **common causes**: deploys, database, dependencies, saturation, GC, noisy neighbours, traffic changes.

#### Key points
- **Scope:** which endpoints, regions, instances, customers? All requests or a subset? Since when exactly?
- **What changed:** deploys, config, feature flags, traffic patterns, dependencies, infrastructure, data growth.
- **Mitigate** quickly if impact is serious: rollback, scale out, disable feature, shed load.
- Use **traces** to find where time goes; **metrics** for saturation (CPU, memory, GC, pools, DB); **logs** for errors/timeouts.
- Common causes: **slow database query** (plan change, lock contention, missing index), **dependency latency**, **pool exhaustion**, **GC pauses**, **CPU throttling**, **retry storms**, **hot keys**, **cache eviction**.
- Confirm the fix with metrics; follow up with a postmortem and prevention.

#### Model answer
"I'd work through it methodically and keep users in mind: if the spike is hurting customers, mitigation comes before full understanding.

**1. Confirm and scope (first few minutes):**
- Is it real? Check multiple sources (load balancer metrics, APM, synthetic checks).
- **Which requests?** All endpoints or one? One region/zone? Certain instances (one bad node)? Certain customers (one big tenant)? p99 only, or p50 too? If only p99, a subset of requests is slow; if p50 rose too, everything is slower.
- **When exactly** did it start? Overlay deploy markers and config change events.

**2. What changed?**
- Recent **deploys** or config/flag changes (most common cause).
- **Traffic**: volume spike, new client behaviour, a batch job, a bot.
- **Dependencies**: status of databases, caches, third-party APIs.
- **Infrastructure**: node changes, autoscaling events, cloud provider incidents.
- **Data**: a table crossing a size threshold, a query plan change after statistics updates.

**3. Mitigate if needed:**
- Correlates with a deploy → **roll back**.
- Saturation → **scale out**.
- A new feature path → **disable the flag**.
- One bad instance → remove it from the pool.
- Overload from a client → rate limit it.

**4. Dig in with signals:**
- **Traces** of slow requests: where is the time? E.g. 2.7 s in a DB span, or waiting to acquire a connection, or an external API call.
- **Saturation metrics** for each resource:
  - App: CPU (and **CPU throttling** in containers), memory, **GC pause time**, thread/worker pool usage, event loop lag.
  - Connection pools: wait time, active vs max.
  - Database: CPU, active queries, **slow query log**, **lock waits**, replication lag, cache hit ratio.
  - Cache: hit rate drop (eviction, a flush, a deploy changing keys), latency.
  - Downstream services: their latency and errors.
- **Logs**: timeouts, retries, errors that correlate.

**5. Common culprits and how they appear:**
| Symptom | Likely cause |
|---|---|
| Time in DB spans, one query slow | Plan change, missing index, data growth |
| Time waiting for connections | Pool exhaustion (slow queries or leak) |
| Many requests blocked on DB locks | Long transaction or migration holding locks |
| Periodic pauses across requests | GC pauses or CPU throttling |
| Only one instance slow | Bad node, noisy neighbour, hot partition |
| Dependency spans slow, retries up | Downstream degradation, retry storm |
| Cache hit rate dropped | Eviction, flush, key change after deploy |

**6. Fix and verify:** apply the targeted fix (index, revert, pool size, query rewrite, timeout and circuit breaker), watch latency return to baseline, and keep monitoring.

**7. Follow up:** postmortem; add alerts that would catch it earlier (e.g. pool wait time, slow query alerts); regression tests or query plan checks.

**Profiling tools when the cause is in our code:** continuous profilers (Pyroscope, Datadog profiler), flame graphs via py-spy/async-profiler/pprof on a live instance to see hot functions or lock contention."

#### Another worked example: a query plan flip
"p99 jumped to 4 s at 09:10 with no deploy. Traces showed the `GET /orders` DB span going from 15 ms to 3 s. `pg_stat_statements` showed one query's mean time exploding. `EXPLAIN ANALYZE` revealed the planner had switched from an index scan to a sequential scan after an auto-analyse updated statistics on a fast-growing table. Mitigation: we ran `ANALYZE` with a higher statistics target and added a composite index matching the filter and sort; latency recovered within minutes. Follow-up: alerting on per-query latency regressions."

#### A third worked example: CPU throttling
"Latency spiked every few seconds on a Go service, but average CPU looked fine at 40%. Container metrics showed heavy **CPU throttling**: the CPU limit of 1 core was hit in bursts, pausing the process for the rest of each 100 ms period. Removing the CPU limit (keeping the request) and setting `GOMAXPROCS` to match the allocation removed the spikes."

#### Variations you might be asked
- "What if only one customer reports slowness?": check their requests specifically (trace by tenant ID): large data volumes, a specific region, or a pathological query.
- "Latency is high but CPU is low everywhere": suspect waiting: locks, pools, downstream calls, DNS, network.
- "How would you prevent this class of issue?": performance tests in CI, query plan monitoring, SLO burn alerts, capacity headroom.

#### Step-by-step framework
1. **Confirm and scope.**
2. **What changed?**
3. **Mitigate** if users are hurting.
4. **Traces → saturation metrics → logs.**
5. **Match symptoms to causes**, test hypotheses.
6. **Fix, verify, follow up.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Restart the servers" | Scopes and checks what changed first |
| Random guessing | Hypothesis-driven, signal by signal |
| Investigates for hours while users suffer | Mitigates early |
| Only looks at CPU | Pools, locks, GC, throttling, dependencies |
| Fix and forget | Postmortem and better alerts |

#### Useful phrases
- "Is it all requests or a subset? That splits the search space in half."
- "What changed around that time?"
- "Low CPU with high latency usually means we're waiting on something."
- "Traces show where the time goes; saturation metrics show why."

#### Common pitfalls
- **Looking at averages.**
- **Ignoring container CPU throttling.**
- **Not checking deploy markers.**
- **Changing many things at once.**

#### Follow-ups to expect (with sample answers)
- **"How do you find which query is slow in PostgreSQL?"**
  "`pg_stat_statements` for top queries by total and mean time, the slow query log, and `EXPLAIN (ANALYZE, BUFFERS)` for plans."
- **"What's a retry storm?"**
  "When a slow dependency causes clients to retry, multiplying load and making it slower; fix with backoff, jitter, retry budgets and circuit breakers."
- **"How do you debug intermittent latency spikes?"**
  "Correlate with periodic events (cron jobs, GC, backups), compare slow vs fast traces, and use continuous profiling."

#### What senior interviewers look for
- **Calm, structured debugging.**
- **Breadth of known causes.**
- **Production tool fluency.**

#### Practise it
1. Write your own latency debugging checklist.
2. Practise reading an `EXPLAIN ANALYZE` output for a slow query.
3. Walk through the scenario out loud in 5 minutes, including mitigation.

## Investigating a memory leak
- id: be-ops-09
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: memory leak, profiling, heap dump, garbage collection, debugging

### Prompt
A service's memory usage grows steadily until it's OOM-killed every few hours. How do you investigate and fix it?

### Answer
#### What the interviewer is really testing
- Distinguishing a **real leak** from expected growth (caches, warm-up) or misconfiguration.
- Using **heap profiling tools** (heap dumps, snapshots, allocation profilers) in your language.
- Knowing **common leak patterns** in garbage-collected languages.
- Mitigating safely while investigating, and preventing recurrence.

#### Key points
- Confirm the pattern: **sawtooth that keeps rising** (leak) vs plateau (cache filling) vs sudden spikes (large requests).
- Check **container limits vs runtime settings** (e.g. JVM heap vs container memory).
- **Mitigate**: more memory, more replicas, scheduled restarts, as temporary measures.
- **Correlate** growth with traffic, specific endpoints, deploys, background jobs.
- **Heap snapshots** at two points in time and **compare** to see which objects grow and what retains them (retainer paths/GC roots).
- Common causes: **unbounded caches/maps**, listeners/callbacks not removed, **global collections**, unclosed resources (connections, streams), thread-locals, goroutine leaks, large in-flight buffers, native memory.
- Fix, add bounded data structures, and add **memory regression tests/alerts**.

#### Model answer
"**1. Characterise the growth.**
- Graph memory per instance over time with deploys and traffic overlaid.
- **Steady climb regardless of traffic, never released** → likely a leak.
- **Growth with traffic, then plateau** → caches or pools warming up; maybe just under-provisioned.
- **Sudden jumps** → specific large requests (e.g. loading huge result sets).
- Distinguish **heap** from **native/off-heap** memory: in a JVM, compare heap usage (GC metrics) with container RSS; in Node, `heapUsed` vs `rss`.
- Check config: JVM `-Xmx` too close to the container limit, or no limit-aware setting, can cause OOM kills without any leak.

**2. Mitigate while investigating.**
- Increase memory or replicas so OOM kills don't hurt users; stagger restarts; add a temporary scheduled restart if necessary. This buys time but isn't the fix.

**3. Correlate.**
- Did it start with a deploy? Diff the release.
- Does growth rate track a particular endpoint, tenant, or background job? Try isolating by routing traffic or disabling a job on one instance.

**4. Capture and compare heap snapshots.**
- Take a snapshot shortly after startup and another after significant growth, from the same instance; compare object counts and retained sizes. The objects that keep growing and the **retainer paths** (what's holding references, up to GC roots) point to the culprit.
- Tools per language:
  - **Java:** heap dumps (`jcmd <pid> GC.heap_dump`), Eclipse MAT or VisualVM (dominator tree, leak suspects); JFR for allocation profiling; Native Memory Tracking for off-heap.
  - **Node.js:** `--inspect` + Chrome DevTools heap snapshots (comparison view), `heapdump` module, `clinic heapprofiler`.
  - **Python:** `tracemalloc` snapshots and comparisons, `objgraph`, `memray`, `guppy`.
  - **Go:** `pprof` heap profiles (`go tool pprof -diff_base`), and goroutine profiles for goroutine leaks.
- Example in Python:
```python
import tracemalloc
tracemalloc.start(25)
snap1 = tracemalloc.take_snapshot()
# ... let traffic run for a while ...
snap2 = tracemalloc.take_snapshot()
for stat in snap2.compare_to(snap1, "traceback")[:10]:
    print(stat)          # top growing allocation sites with tracebacks
```
- Heap dumps can contain sensitive data (tokens, PII): handle them securely and delete them afterwards.

**5. Common leak patterns:**
| Pattern | Example |
|---|---|
| Unbounded cache or map | `cache[user_id] = data` with no eviction |
| Event listeners not removed | Subscribing per request, never unsubscribing |
| Global collections | Appending request objects to a module-level list for 'debugging' |
| Closures capturing large objects | Timers/callbacks holding request contexts |
| Unclosed resources | Streams, DB cursors, HTTP responses not closed |
| Thread-locals in pools | Values never cleared on reused threads |
| Goroutine/task leaks | Blocked goroutines holding buffers |
| Metrics with unbounded labels | A new time series per user ID in-process |

**6. Fix and verify.**
- Bound the data structure (LRU with max size and TTL), remove listeners, close resources with context managers/`try-with-resources`, fix label cardinality.
- Verify with a **soak test**: run production-like load for hours and confirm memory plateaus.

**7. Prevent.**
- Alerts on memory growth rate, not just absolute usage.
- Soak tests in the release process for critical services.
- Code review checklist: every cache has bounds; every subscription has an unsubscribe."

#### Another worked example: an unbounded cache
"A Node.js API grew ~300 MB per hour and was OOM-killed every 6 hours. Two heap snapshots 30 minutes apart showed millions of growing `Object` entries retained by a module-level `Map` in a pricing helper, which cached prices keyed by `${productId}:${userId}:${timestamp}`: effectively never reused and never evicted. Replacing it with an LRU cache (10,000 entries, 60 s TTL) keyed by `productId` stabilised memory at 400 MB and improved hit rate."

#### A third worked example: not a leak at all
"A Java service was OOM-killed under peak load, and the team suspected a leak. Heap metrics showed heap usage stable at 1.2 GB, while container RSS reached the 2 GB limit. Native Memory Tracking revealed hundreds of threads (each with a 1 MB stack) created by an unbounded thread pool during traffic spikes, plus direct buffers from the HTTP client. Bounding the thread pool and setting `MaxDirectMemorySize` fixed it: a configuration problem, not a leak."

#### Variations you might be asked
- "Can garbage-collected languages leak memory?": yes; the GC only frees unreachable objects, so anything still referenced (by a cache, listener, global) stays forever.
- "How do you find a goroutine leak?": the goroutine count metric climbing, then `pprof` goroutine profiles showing where they block.
- "What's the difference between a leak and fragmentation?": fragmentation means free memory exists but in unusable pieces (common with native allocators); RSS stays high even though live objects are few.

#### Step-by-step framework
1. **Characterise** growth (leak vs plateau vs spikes; heap vs native).
2. **Check config** (limits vs runtime settings).
3. **Mitigate** temporarily.
4. **Correlate** with deploys, endpoints, jobs.
5. **Compare heap snapshots** and follow retainer paths.
6. **Fix, soak test, prevent.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add more memory" | Characterises growth and investigates |
| One heap dump | Two snapshots compared over time |
| Only heap | Heap vs native memory, threads |
| Restarts as the fix | Restarts only as temporary mitigation |
| No prevention | Bounded caches, soak tests, growth alerts |

#### Useful phrases
- "Is it a leak, or just a cache warming up?"
- "I'd compare two heap snapshots from the same instance."
- "The retainer path tells me who's keeping these objects alive."
- "Every cache needs a size limit and an eviction policy."

#### Common pitfalls
- **Assuming GC prevents leaks.**
- **Ignoring native memory.**
- **Fixing symptoms** with periodic restarts permanently.
- **Leaving heap dumps** with sensitive data lying around.

#### Follow-ups to expect (with sample answers)
- **"How do you take a heap dump safely in production?"**
  "On one instance removed from the load balancer, since dumps pause the process and need disk space; then store and delete securely."
- **"What's a weak reference?"**
  "A reference that doesn't prevent garbage collection; useful for caches keyed by objects (WeakMap/WeakHashMap)."
- **"How would you detect leaks before production?"**
  "Soak tests with memory assertions, and comparing memory profiles between releases."

#### What senior interviewers look for
- **Methodical diagnosis** with the right tools.
- **Understanding of runtime memory models.**
- **Prevention mindset.**

#### Practise it
1. Create a small program with a deliberate leak and find it with your language's profiler.
2. Explain heap vs native memory in your runtime, out loud.
3. Write a checklist of leak patterns to use in code review.

## Disaster recovery and multi-region design
- id: be-ops-10
- round: RELIABILITY_OPERATIONS
- difficulty: hard
- levels: senior, staff
- tags: disaster recovery, RPO, RTO, multi-region, backups, failover

### Prompt
How would you design disaster recovery for a critical service? Explain RPO and RTO, backup strategies, and active-passive vs active-active multi-region architectures.

### Answer
#### What the interviewer is really testing
- Understanding **RPO/RTO** and tying them to **business requirements and cost**.
- Practical **backup and restore** strategies (and testing them).
- Multi-region patterns: **backup/restore, pilot light, warm standby, active-active**, with trade-offs.
- Data replication challenges: **consistency, conflicts, failover, split brain**, and DNS/traffic management.

#### Key points
- **RPO (Recovery Point Objective):** maximum acceptable **data loss**, measured in time (e.g. 5 minutes of writes).
- **RTO (Recovery Time Objective):** maximum acceptable **downtime** to restore service (e.g. 1 hour).
- Disasters include region outages, data corruption, accidental deletion, **ransomware**, bad deploys; replication alone doesn't protect against corruption or deletion (it replicates the damage).
- **Backups:** automated, point-in-time recovery, **immutable/offsite** copies, encrypted, and **regularly restore-tested**.
- DR tiers (cost ↑, RTO/RPO ↓): **backup & restore** → **pilot light** → **warm standby** → **active-active**.
- Multi-region data: async replication (RPO > 0) vs sync (latency cost); active-active needs **conflict handling** or data partitioning by region/user.
- **Failover**: DNS/global load balancing, health checks, runbooks, automation, avoiding **split brain**; regular **game days**.

#### Model answer
"I'd start with the business: what does downtime and data loss cost for this service? That determines **RPO and RTO**, which determine architecture and cost.

**Definitions:**
- **RPO:** how much data can we afford to lose? RPO of 5 minutes means losing up to 5 minutes of recent writes is acceptable.
- **RTO:** how long can we be down? RTO of 1 hour means service must be restored within an hour.
- Example targets: payments ledger RPO ≈ 0, RTO 15 min; internal analytics RPO 24 h, RTO 1 day.

**What we're protecting against:**
- Instance or zone failures (handled by multi-AZ redundancy, not really DR).
- **Region outages.**
- **Data corruption or deletion** (bugs, bad migrations, human error, ransomware): replication copies the corruption instantly, so **backups with point-in-time recovery** are essential.
- Loss of a cloud account (compromise): backups in a separate account with restricted access.

**Backups:**
- Automated **daily snapshots + continuous WAL/binlog archiving** for point-in-time recovery (restore to 14:32 just before a bad migration).
- **Cross-region and cross-account copies**, **immutable** (object lock) to resist ransomware.
- Encrypted, with access tightly controlled.
- **Restore tests** regularly (e.g. monthly automated restore into a scratch environment with validation), and measure restore time against RTO. An untested backup is a hope, not a plan.

**DR architectures (increasing cost and decreasing RTO/RPO):**
| Strategy | Description | RTO | RPO | Cost |
|---|---|---|---|---|
| Backup & restore | Restore infra and data in another region from backups | Hours–day | Hours (backup frequency) | Low |
| Pilot light | Core data replicated; minimal infra running; scale up on failover | Tens of minutes–hours | Minutes | Medium-low |
| Warm standby | Scaled-down full copy running; scale up and switch traffic | Minutes | Seconds–minutes | Medium-high |
| Active-active | Multiple regions serving traffic simultaneously | ~Zero (reroute) | ~Zero to seconds | High, complex |

**Active-passive (pilot light / warm standby):**
- Primary region serves traffic; the database replicates **asynchronously** to the standby region (RPO = replication lag, typically seconds).
- Failover: promote the replica, scale the standby app tier, switch traffic via DNS/global load balancer.
- Infrastructure as code ensures the standby matches the primary.
- Risk: **split brain** if the old primary comes back and accepts writes; fencing (disable writes on the old primary) is part of the runbook.

**Active-active:**
- Both regions serve reads and writes, giving lower latency for global users and near-instant regional failover.
- The hard part is **data**:
  - **Partition data by region/user** (each user's 'home region' owns their writes), so writes don't conflict; other regions read replicas or route to the home region.
  - Or use globally distributed databases (Spanner, CockroachDB, DynamoDB global tables, Cosmos DB), accepting their latency/consistency trade-offs; DynamoDB global tables use last-writer-wins, which can lose concurrent updates.
  - **Synchronous cross-region replication** gives RPO 0 but adds tens to hundreds of ms per write.
- Every region must have capacity to absorb another's traffic (N+1 capacity).

**Traffic management:** DNS with health checks (Route 53, Cloud DNS) or global anycast load balancers; low DNS TTLs; clients and CDNs that respect failover.

**Operational readiness:**
- **Runbooks** with clear decision criteria (who declares a regional failover?), ideally automated steps.
- **Game days / DR drills**: actually fail over to the secondary region periodically; measure real RTO/RPO.
- Dependencies: third-party services, secrets, DNS, CI/CD, and observability must also work in the DR region.
- **Failback** plan: resync data and return to the primary deliberately.

**Recommendation pattern:** For most services, multi-AZ in one region + backups with PITR + a pilot light or warm standby in a second region. Active-active only for services where the business case justifies the complexity (global latency or near-zero RTO), ideally with data partitioned by home region."

#### Another worked example: a bad migration, not a region outage
"A migration accidentally ran `UPDATE orders SET status = 'cancelled'` without a WHERE clause on a subset of partitions. Replication copied it to all replicas within seconds, so multi-region replication didn't help. We restored a point-in-time copy from 2 minutes before the migration into a separate instance, then copied the correct statuses back for affected rows. RPO effectively 0 for those rows, recovery took 90 minutes. Follow-ups: migration review, safer tooling, and documented PITR runbooks."

#### A third worked example: a DR drill that revealed gaps
"A first DR drill for a warm-standby setup was planned for 30 minutes and took 4 hours. Problems: secrets weren't replicated to the DR region, the container registry was single-region, DNS TTLs were 1 hour, and the runbook skipped promoting the read replica's connection string. After fixing these and automating failover, the next drill completed in 18 minutes, within the 30-minute RTO."

#### Variations you might be asked
- "What's the difference between high availability and disaster recovery?": HA handles common failures automatically (instances, zones) with minimal disruption; DR handles rare large-scale disasters (regions, data corruption) with defined RTO/RPO.
- "How do you handle a partial regional outage?": decide based on impact and expected duration; failing over has its own risks, so define criteria in advance.
- "How do you test backups automatically?": scheduled restores into an isolated environment with data integrity checks and alerts on failure or restore time exceeding RTO.

#### Step-by-step framework
1. **Define RPO/RTO** with the business per service.
2. **Identify threats** (region loss, corruption, deletion, account compromise).
3. **Backups**: PITR, cross-region/account, immutable, restore-tested.
4. **Choose DR tier** (backup/restore → active-active) by cost vs targets.
5. **Design data replication and failover** (split brain, conflicts).
6. **Drill regularly** and include all dependencies.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We have replicas" | Knows replication spreads corruption; PITR backups |
| No RPO/RTO | Targets per service tied to business |
| Active-active by default | Chooses tier by cost and needs |
| Ignores data conflicts | Home-region partitioning, conflict strategies |
| Never tested | Game days, measured RTO |

#### Useful phrases
- "RPO is how much data we can lose; RTO is how long we can be down."
- "Replication protects against hardware loss, not against bad writes."
- "An untested backup is a hope, not a plan."
- "Active-active is mostly a data problem."

#### Common pitfalls
- **No restore testing.**
- **Backups in the same account/region.**
- **Forgetting dependencies** (secrets, registry, DNS) in DR region.
- **Split brain** after failover.

#### Follow-ups to expect (with sample answers)
- **"How do you decide to fail over a region?"**
  "Predefined criteria (duration, impact, provider status), an accountable decision-maker, and an automated runbook; avoid flapping."
- **"How do you achieve RPO 0 across regions?"**
  "Synchronous replication or a consensus-based database spanning regions, accepting higher write latency."
- **"What's the cost impact of warm standby?"**
  "Running a scaled-down copy continuously, often 20–50% of primary cost, plus cross-region data transfer."

#### What senior interviewers look for
- **Business-driven** reliability decisions.
- **Deep understanding of data replication** trade-offs.
- **Operational rigour** (drills, runbooks).

#### Practise it
1. Define RPO/RTO for three services in a product you know and pick a DR tier for each.
2. Write a regional failover runbook outline.
3. Explain why replication isn't a backup, out loud.

## Controlling cloud costs
- id: be-ops-11
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: cloud costs, FinOps, rightsizing, efficiency, architecture

### Prompt
Your team's cloud bill has doubled in six months while traffic grew 20%. How would you investigate and reduce costs without hurting reliability?

### Answer
#### What the interviewer is really testing
- Treating cost as an **engineering metric**, investigated with data.
- Knowing the **main cost drivers** (compute, storage, data transfer, managed services, observability).
- Practical levers: **rightsizing, autoscaling, commitments, spot, storage tiers, architecture changes**.
- Balancing savings against **reliability and engineering time**, and building lasting **cost visibility**.

#### Key points
- **Visibility first:** cost allocation by **tags/labels** (team, service, environment), cost explorer breakdowns, unit costs.
- Track **unit economics**: cost per request, per customer, per order, which should fall or stay flat as you grow.
- Biggest drivers: **compute** (over-provisioned instances), **databases**, **data transfer** (cross-AZ, cross-region, NAT gateways, egress), **storage** (old snapshots, logs), **observability** (log/metrics volume), idle resources.
- Levers: **rightsizing**, **autoscaling** (including scaling down at night), **commitments** (savings plans/reserved), **spot/preemptible** for fault-tolerant work, **storage lifecycle policies**, **caching/CDN**, fixing **inefficient code/queries**, deleting **unused resources**.
- Guardrails: budgets and anomaly alerts, cost review in design docs, ownership per team.

#### Model answer
"A bill doubling while traffic grows 20% means **cost per unit of work has risen ~65%**, so something is inefficient or wasteful. I'd approach it like a performance investigation: measure, find the biggest contributors, fix, and prevent regressions.

**1. Get visibility.**
- Break the bill down by **service category** (compute, database, storage, network, managed services) and by **team/service/environment** using tags. If tagging is poor, fixing it is step one.
- Look at the **trend**: which line items grew fastest and when? Correlate with launches, architecture changes, new environments.
- Define **unit costs** like cost per 1,000 requests or per active customer to track progress.

**2. Common culprits I'd check:**
- **Idle and forgotten resources:** old test environments, unattached volumes, old snapshots, idle load balancers, unused IPs, dev clusters running 24/7.
- **Over-provisioned compute:** instances at 10% CPU; Kubernetes pods with requests far above actual usage (the cluster reserves capacity for requests, not usage).
- **Databases:** oversized instances, provisioned IOPS not needed, too many replicas, expensive queries driving instance size.
- **Data transfer:** cross-AZ traffic between chatty services, **NAT gateway** charges for traffic to cloud services (fix with VPC endpoints), cross-region replication, internet egress (use a CDN).
- **Storage:** logs and backups kept forever on hot storage; no lifecycle policies.
- **Observability:** debug logs in production, high-cardinality metrics, 100% trace sampling; log ingestion is often a top-five cost.
- **Managed service pricing traps:** per-request services (serverless, API gateways) at high volume, where containers might be cheaper.

**3. Apply levers, highest value and lowest risk first:**
- **Delete waste** (no reliability impact): unused resources, old snapshots; schedule non-production environments to shut down at night/weekends (often saves ~65% of their cost).
- **Rightsize**: use utilisation data (p95 over weeks) to reduce instance sizes and pod requests, keeping headroom; vertical pod autoscaler recommendations help.
- **Autoscale**: scale down during off-peak hours rather than provisioning for peak 24/7.
- **Commitments**: savings plans or reserved instances for the steady baseline (30–60% discounts); keep variable load on demand.
- **Spot/preemptible instances** for stateless, fault-tolerant workloads (batch jobs, CI runners, some workers): 60–90% cheaper, with interruption handling.
- **Storage tiers and lifecycle**: move old data to infrequent-access/archive tiers; set log retention (e.g. 14 days hot, 1 year archive).
- **Reduce data transfer**: VPC endpoints, keep chatty services in the same AZ where safe, compress payloads, CDN for static content.
- **Observability tuning**: drop noisy logs, sample traces, remove high-cardinality labels.
- **Efficiency work**: fix N+1 queries, add caching, optimise hot code paths, which can shrink database and compute needs substantially.
- **Architecture**: e.g. moving a high-volume serverless function to containers, or batching writes.

**4. Protect reliability:**
- Don't remove the **headroom** needed for zone failures and spikes; rightsizing uses p95/p99 utilisation, not averages.
- Make changes gradually, with monitoring and rollback.
- Don't let cost cuts remove backups, multi-AZ, or DR for critical services.

**5. Make it stick (FinOps practices):**
- **Ownership**: each team sees and owns its costs; dashboards per service with unit costs.
- **Budgets and anomaly alerts** to catch sudden jumps (e.g. a runaway job) within a day, not at month-end.
- **Cost as a design consideration**: estimate costs in design docs for new systems.
- Periodic review of commitments and utilisation."

#### Another worked example: hidden network costs
"A team's bill rose $25k/month. The breakdown showed NAT gateway data processing charges: services pulled container images and wrote to S3 through NAT gateways. Adding VPC gateway endpoints for S3 and a pull-through registry cache in-region removed most of that traffic, saving $18k/month with no code changes."

#### A third worked example: Kubernetes requests vs usage
"A cluster of 60 nodes ran at 25% actual CPU usage. Pod CPU requests had been copied from a template (2 cores each) while services used ~0.3 cores. Rightsizing requests based on 30 days of p95 usage and enabling the cluster autoscaler reduced the cluster to 22 nodes, saving 60% of compute, with no change in latency."

#### Variations you might be asked
- "How do you build cost awareness in engineers?": show costs per service in dashboards and PRs (e.g. infrastructure cost estimates), celebrate savings, and include cost in design reviews.
- "When is optimising cost not worth it?": when engineering time costs more than the savings, or when it increases risk for critical systems; prioritise by savings vs effort.
- "Serverless vs containers cost?": serverless is cheap at low or spiky volume; at high steady volume, containers or VMs are usually cheaper.

#### Step-by-step framework
1. **Quantify** the problem (unit costs).
2. **Break down** the bill by category and owner.
3. **Find culprits** (waste, over-provisioning, network, storage, observability).
4. **Apply levers** from low-risk to architectural.
5. **Protect reliability** headroom.
6. **Institutionalise** ownership, budgets and alerts.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use smaller instances" | Data-driven breakdown first |
| Ignores unit costs | Cost per request/customer |
| Misses network and observability costs | Checks NAT, cross-AZ, logs, metrics |
| Cuts redundancy | Preserves reliability headroom |
| One-off clean-up | Ownership, budgets, anomaly alerts |

#### Useful phrases
- "Cost per request went up 65%; that's the real problem to explain."
- "We pay for requested capacity, not used capacity."
- "Data transfer is the cost line people forget."
- "Commitments for the baseline, on-demand or spot for the variable part."

#### Common pitfalls
- **No tagging**, so no ownership.
- **Rightsizing on averages.**
- **Buying commitments before rightsizing.**
- **Ignoring observability costs.**

#### Follow-ups to expect (with sample answers)
- **"What's a savings plan?"**
  "A commitment to spend a certain amount per hour on compute for 1–3 years in exchange for a discount, flexible across instance types."
- **"How do you handle spot interruptions?"**
  "Use them for stateless or checkpointed work, diversify instance types, handle the termination notice, and keep on-demand capacity as fallback."
- **"How would you catch a runaway cost quickly?"**
  "Daily cost anomaly detection and budget alerts per account/team, plus quotas on expensive resources."

#### What senior interviewers look for
- **Business awareness** of engineering costs.
- **Systematic, data-driven** optimisation.
- **Balance** between cost, reliability and effort.

#### Practise it
1. List the top five cost drivers in a system you know and one lever for each.
2. Calculate unit cost for a hypothetical service (bill / requests).
3. Explain how you'd reduce costs without affecting reliability, out loud.

## Graceful degradation and load shedding
- id: be-ops-12
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: graceful degradation, load shedding, resilience, fallbacks, overload

### Prompt
How do you design a service to degrade gracefully under overload or when dependencies fail? Explain load shedding, fallbacks and prioritisation.

### Answer
#### What the interviewer is really testing
- Understanding **overload dynamics** (queueing, latency collapse, retry storms).
- Designing **fallbacks** for failed dependencies.
- **Load shedding** strategies and **prioritising critical traffic**.
- Combining patterns: **timeouts, circuit breakers, bulkheads, rate limits, feature flags**.

#### Key points
- Overloaded systems often **collapse**: queues grow, latency exceeds client timeouts, clients retry, load increases further, so **throughput drops** even as work increases.
- **Load shedding:** reject excess requests **early and cheaply** (503/429) to keep serving the rest well.
- **Prioritise:** critical traffic (checkout, logins) over non-critical (recommendations, analytics, prefetch); shed lowest priority first.
- **Fallbacks:** cached/stale data, default values, simplified responses, hide non-essential features.
- **Timeouts and circuit breakers** prevent slow dependencies from consuming all resources; **bulkheads** isolate resources.
- **Feature flags / kill switches** to turn off expensive features manually.
- Clients: **retries with backoff, jitter and budgets**; respect `Retry-After`.
- Test with chaos experiments and load tests.

#### Model answer
"The goal is that when something goes wrong, the system does **less, but keeps doing the most important things well**, rather than failing completely.

**Why overload is dangerous.** If a service receives more requests than it can handle, requests queue. Latency rises past clients' timeouts, so clients give up but the server still processes those requests (wasted work), and clients retry, increasing load. Throughput of *useful* work collapses. This is why controlling overload explicitly matters.

**1. Load shedding: say no early.**
- Limit **concurrency** (max in-flight requests) or queue length; when exceeded, return **503 with Retry-After** immediately. Rejecting a request costs microseconds; processing it might cost hundreds of milliseconds.
- **Adaptive concurrency limits** (like Netflix's concurrency-limits library or Envoy's adaptive concurrency) adjust limits based on observed latency.
- **Deadline awareness:** if a request has already waited longer than the client's timeout, drop it instead of processing.
- **Queue discipline:** under overload, LIFO or dropping old requests can serve more users successfully than FIFO.

**2. Prioritise traffic.**
- Classify requests: **critical** (checkout, payment, login), **important** (search, product pages), **sheddable** (recommendations, analytics events, prefetching, background sync).
- Shed from the lowest priority first. Priority can come from the endpoint, a header set by the gateway, or the user tier.
```python
PRIORITY = {"/checkout": 0, "/login": 0, "/search": 1, "/recommendations": 2}

def admit(path: str, in_flight: int, limit: int) -> bool:
    p = PRIORITY.get(path, 1)
    # leave headroom for critical traffic: sheddable requests stop at 70% of capacity
    thresholds = {0: limit, 1: int(limit * 0.85), 2: int(limit * 0.7)}
    return in_flight < thresholds[p]
```

**3. Fallbacks when dependencies fail.**
- **Recommendations service down** → show bestsellers from a cache, or hide the widget.
- **Pricing service slow** → show cached prices with a short staleness tolerance (but re-validate at checkout).
- **Search degraded** → simpler query without personalisation.
- **Reviews unavailable** → render the product page without reviews.
- Design the UI and API so optional sections can be missing.
- Fallbacks must be **cheap and reliable** themselves, and **tested regularly**; an untested fallback often fails when needed.

**4. Contain failures.**
- **Timeouts** on every remote call, shorter than the caller's own timeout.
- **Circuit breakers**: after repeated failures, stop calling the dependency for a while and use the fallback immediately, giving it time to recover.
- **Bulkheads**: separate connection/thread pools per dependency so one slow dependency can't exhaust resources for others.
- **Retry budgets**: limit retries to a percentage of requests (e.g. 10%) to prevent retry storms; exponential backoff with jitter.

**5. Manual controls.**
- **Kill switches / feature flags** for expensive features (e.g. disable personalisation, disable exports) during incidents.
- **Degraded mode** configuration: static pages for the homepage, read-only mode for non-critical writes.

**6. Make it visible and tested.**
- Metrics for shed requests by priority, fallback usage, circuit breaker states.
- **Load tests** beyond capacity to verify the system sheds gracefully instead of collapsing.
- **Chaos experiments**: inject dependency failures and latency in staging/production to verify fallbacks work."

#### Another worked example: Black Friday degradation plan
"For Black Friday, an e-commerce team defined three degradation levels. Level 1: disable personalised recommendations and switch to cached bestsellers. Level 2: serve product pages from CDN-cached versions with 60-second staleness and disable reviews. Level 3: queue non-payment writes (wishlist, profile edits). Each level was a flag tested in a game day. On the day, a recommendation cluster overloaded at 11:00; flipping level 1 took 10 seconds, and checkout conversion was unaffected."

#### A third worked example: a retry storm
"A mobile app retried failed API calls immediately up to 5 times. When the API slowed briefly, retries multiplied traffic 4×, keeping it overloaded for 40 minutes after the original issue resolved. Fixes: exponential backoff with jitter in the app, server-side load shedding returning 503 with `Retry-After`, and a retry budget in the internal service mesh."

#### Variations you might be asked
- "Difference between rate limiting and load shedding?": rate limiting enforces per-client fairness limits regardless of server state; load shedding rejects work based on the server's current capacity.
- "How do you choose the concurrency limit?": from load tests (the concurrency where latency starts rising sharply), or adaptively based on latency.
- "What's brownout?": deliberately turning off optional features under load to preserve core functionality.

#### Step-by-step framework
1. **Explain overload collapse.**
2. **Shed load early** with concurrency limits and deadlines.
3. **Prioritise** critical traffic.
4. **Design fallbacks** per dependency.
5. **Contain failures** (timeouts, circuit breakers, bulkheads, retry budgets).
6. **Add kill switches, metrics and chaos testing.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Autoscale" | Explains overload collapse and shedding |
| All requests equal | Prioritises critical journeys |
| No fallbacks | Cached/default/hidden-feature fallbacks |
| Unlimited retries | Backoff, jitter, retry budgets |
| Untested plans | Game days and chaos experiments |

#### Useful phrases
- "Rejecting a request early is far cheaper than timing it out late."
- "Checkout keeps working even if recommendations disappear."
- "Fallbacks need to be tested, or they'll fail when we need them."
- "Retries without budgets turn small blips into outages."

#### Common pitfalls
- **Unbounded queues.**
- **Fallbacks that call another overloaded service.**
- **Retrying non-idempotent operations.**
- **Shedding critical traffic** equally.

#### Follow-ups to expect (with sample answers)
- **"Where should load shedding happen?"**
  "As early as possible: at the edge/gateway for broad protection, and in each service for its own capacity."
- **"How do you tell clients to back off?"**
  "503 or 429 with `Retry-After`, and well-behaved clients with exponential backoff and jitter."
- **"How do you avoid serving stale data in fallbacks inappropriately?"**
  "Define staleness tolerances per data type and revalidate critical data (like prices) at transaction time."

#### What senior interviewers look for
- **Systems thinking about overload.**
- **Product-aware prioritisation.**
- **Tested resilience** rather than theoretical.

#### Practise it
1. Classify the endpoints of a product you know into critical, important and sheddable.
2. Design fallbacks for three dependencies.
3. Explain overload collapse and load shedding, out loud.
