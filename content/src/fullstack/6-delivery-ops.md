# Full Stack Engineer — Delivery & Operations

## CI/CD for a full stack app
- id: fs-ops-01
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: CI/CD, GitHub Actions, pipelines, deployment, monorepo, caching

### Prompt
Design the CI/CD pipeline for a full stack app (React frontend, Node API, Postgres, background workers) in a monorepo. What runs on every pull request, what happens on merge, and how do you keep it fast and safe?

### Answer
#### What the interviewer is really testing
- A **clear pipeline structure**: fast feedback on PRs, safe automated deploys on merge.
- Knowing **what to check** (types, lint, unit, integration, E2E, build, security) and **where** in the pipeline.
- **Speed techniques**: caching, parallelism, affected-only builds in a monorepo, test splitting.
- **Deployment safety**: build once and promote, migrations ordering, health checks, canaries, rollback.
- **Supply-chain and secret hygiene** in CI.

#### Key points
- **On every PR**: install with lockfile → typecheck → lint → unit tests → build → integration tests against real Postgres (service container) → E2E smoke on a preview environment → security scans (dependencies, secrets). Fail fast: cheapest checks first, run independent jobs in parallel.
- **Monorepo**: use **affected detection** (Turborepo, Nx, path filters) so a frontend-only change doesn't run backend suites; remote caching of build/test outputs.
- **On merge to main**: build **immutable artifacts once** (Docker images tagged with the commit SHA, static bundles), run migrations, deploy to staging (or straight to production with progressive delivery), smoke tests, then production.
- **Migrations**: run as a separate step before new code (expand migrations only); contract migrations later.
- **Deploy strategy**: rolling, blue/green or canary with automated health checks and metric-based rollback.
- **Rollback** = redeploy the previous artifact; database changes are backward compatible so rollback is safe.
- **Branch protection**: required checks, reviews, no direct pushes to main.
- **CI security**: least-privilege tokens, OIDC to cloud providers instead of long-lived keys, pinned action versions, secrets only in protected environments.

#### Model answer
"I'd aim for **PR feedback in under 10 minutes** and **main → production in under 30 minutes**, fully automated, with every deploy reversible.

**PR pipeline (GitHub Actions example).**
```yaml
on: pull_request
jobs:
  setup:            # restore pnpm store + Turborepo remote cache
  static:           # turbo run typecheck lint --filter=...[origin/main]   (affected only)
  unit:             # turbo run test --filter=...[origin/main]   (parallel shards)
  integration:
    services: { postgres: { image: postgres:16, ... }, redis: { image: redis:7 } }
    steps: [migrate test db, run API integration tests]
  build:            # turbo run build; upload artifacts
  preview:          # deploy to a per-PR preview environment (see below)
  e2e:              # Playwright smoke suite against the preview URL
  security:         # npm audit / osv-scanner, secret scan (gitleaks), license check
```
- **Order and parallelism**: typecheck/lint/unit run in parallel and finish in 2–3 minutes; integration and build in parallel; E2E only after preview deploy.
- **Affected-only**: Turborepo's `--filter=...[origin/main]` runs tasks only for changed packages and their dependents; remote caching means unchanged packages are cache hits.
- **Real dependencies**: integration tests use Postgres and Redis service containers, not mocks, so SQL and migrations are actually tested.
- **Flaky test policy**: retries are allowed only with quarantine and an owner ticket; flakiness is tracked.

**Main pipeline.**
```
merge → build once (docker image api:<sha>, worker:<sha>, web bundle <sha>) → push to registry
      → run expand migrations against staging → deploy staging → smoke tests
      → run expand migrations against production → canary 5% → watch error rate/latency 10 min
      → 100% → post-deploy smoke tests → notify
```
- **Build once, promote everywhere**: staging and production run the exact same artifact; environment differences are config only.
- **Migrations as a separate job** with `lock_timeout`, before the new code, and only backward-compatible (expand) changes in the same release.
- **Canary with automated rollback**: compare error rate and p95 latency of the canary against the stable version; if worse beyond a threshold, roll back automatically.
- **Frontend**: static assets uploaded with content-hashed names to the CDN before the new HTML goes live, and old assets kept for a while so open tabs still load lazy chunks.
- **Workers**: deployed with graceful shutdown (finish or release in-flight jobs).

**Safety and hygiene.**
- Branch protection with required checks and one review; `CODEOWNERS` for sensitive areas (migrations, auth).
- Cloud access via **OIDC** (no long-lived keys in CI secrets); production secrets only available to the production deploy job with an environment approval if needed.
- Third-party actions pinned to commit SHAs; Dependabot/Renovate for updates.
- Deploy events annotated on dashboards so incidents can be correlated with releases.

**Rollback.** Redeploy the previous image tag (one click or automatic). Because migrations are expand-only, the old code still works with the new schema."

#### Another worked example: a pipeline that took 45 minutes
"A team's CI took 45 minutes per PR, so people batched changes and skipped running it locally. Fixes, measured one by one: caching `node_modules`/pnpm store and Docker layers (−8 min), running lint/typecheck/unit in parallel jobs (−10 min), affected-only builds with Turborepo remote cache (−12 min for most PRs), sharding Playwright across 4 runners (−7 min), and moving the full E2E regression suite to a nightly run while PRs run a 5-minute smoke subset. Result: ~9 minutes typical PR time. Deploy frequency doubled within a month, which also made each deploy smaller and safer."

#### Step-by-step framework
1. **Define targets**: PR feedback time, deploy lead time.
2. **PR stages**: static checks → unit → integration (real deps) → build → preview → E2E smoke → security.
3. **Speed**: caching, parallel jobs, affected-only, sharding, remote cache.
4. **Main**: build once, immutable artifacts tagged by SHA.
5. **Migrations** as their own step; expand before code.
6. **Progressive deploy** with health checks and automated rollback.
7. **Hygiene**: branch protection, OIDC, pinned actions, scoped secrets.
8. **Observe**: deploy markers, DORA metrics.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| One long sequential job | Parallel stages, cheapest first |
| Rebuilds per environment | Build once, promote the same artifact |
| Mocks the database in all tests | Real Postgres in integration tests |
| Migrations run by the app on startup | Separate migration step with ordering rules |
| Manual deploys on Friday evenings | Automated canary with metric-based rollback |
| Long-lived cloud keys in CI secrets | OIDC, scoped environments, pinned actions |

#### Useful phrases
- "Fast feedback on PRs, safe automation on merge."
- "We build once and promote the same artifact through environments."
- "In a monorepo, CI only runs what the change affects."
- "Migrations are a separate step, and they're backward compatible."
- "Canary first, with automatic rollback on error-rate regression."

#### Common pitfalls
- **Slow CI** leading to big batched PRs.
- **Environment drift** from rebuilding artifacts per stage.
- **Migrations coupled to app startup**, running many times in parallel.
- **Deleting old frontend assets** on deploy, breaking open tabs.
- **Over-privileged CI tokens** and unpinned third-party actions.

#### Follow-ups to expect (with sample answers)
- **"How do you measure CI/CD health?"**
  "DORA metrics: deployment frequency, lead time for changes, change failure rate and time to restore; plus PR pipeline duration and flaky test rate."
- **"Continuous deployment or delivery?"**
  "Continuous deployment (every merge goes to production) when tests and progressive delivery are strong; continuous delivery with a manual approval gate if compliance or risk requires it."
- **"How do you handle secrets for preview environments?"**
  "Separate, low-privilege test credentials; never production secrets; forked PRs don't get secrets at all."
- **"What if E2E tests are flaky?"**
  "Quarantine with an owner, fix root causes (waits on network, test data isolation), and keep the blocking suite small and reliable."

#### What senior interviewers look for
- **Speed and safety balanced** with concrete techniques.
- **Release engineering** maturity: artifacts, migrations, canaries, rollback.
- **Security of the pipeline** itself.
- **Metrics** to improve the system over time.

#### Practise it
1. Write a GitHub Actions workflow with parallel jobs, a Postgres service and caching for a small monorepo.
2. Add Turborepo with affected-only filtering and measure the time saved on a frontend-only change.
3. Implement a deploy job that tags images by SHA and supports one-command rollback.
4. Explain 'build once, promote everywhere' to a friend.

## Preview environments per pull request
- id: fs-ops-02
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: preview environments, ephemeral environments, database branching, review apps, CI

### Prompt
Product managers and designers want to try every pull request in a real environment before it's merged. How would you set up per-PR preview environments for a full stack app including the API, database, background jobs and third-party integrations?

### Answer
#### What the interviewer is really testing
- Understanding **what an ephemeral environment needs**: frontend, backend, data, config, secrets, URLs, cleanup.
- **Data strategy**: shared staging DB vs per-PR database (branching, seeded templates), migrations per PR.
- Handling **third-party integrations** (payments, email, OAuth callbacks, webhooks) safely in previews.
- **Cost and lifecycle**: spin up on PR open, update on push, tear down on close; resource limits.
- **Security**: previews are internet-facing; protect them and keep production data out.

#### Key points
- **Frontend-only previews** are easy (Vercel/Netlify deploy per branch). Full stack previews also need **an API instance, a database, workers and config** per PR.
- **Database options**: (1) shared staging DB (cheap, but migrations from different PRs clash); (2) **per-PR database** created from a seeded template or via **database branching** (Neon, Supabase branching, PlanetScale) with the PR's migrations applied; (3) per-PR schema in a shared server.
- **Seed data**: deterministic, realistic, anonymised fixtures (never raw production data); a few known test accounts.
- **Infrastructure**: containers on a platform with per-PR services (Kubernetes namespaces, Render/Railway/Fly preview environments, or Docker Compose on a VM), routed by `pr-123.preview.example.com`.
- **Third parties**: test-mode keys (Stripe test mode), email captured by a sandbox (Mailpit, provider sandbox), OAuth via a single preview callback broker or wildcard redirect URIs where allowed, webhooks via test endpoints.
- **Lifecycle**: create on open, redeploy on push, destroy on close/merge, auto-expire idle previews; cap concurrent previews.
- **Access**: behind SSO/basic auth or IP allow-list; `noindex`; no production secrets.

#### Model answer
"I'd treat a preview as a small, disposable copy of the system, created by CI for each PR and destroyed when the PR closes.

**What each preview gets.**
```
pr-482.preview.example.com
 ├─ web    (static build or SSR container, API URL injected)
 ├─ api    (container image built from the PR)
 ├─ worker (same image, worker command, low concurrency)
 ├─ db     (branch of a seeded template database, PR migrations applied)
 └─ redis  (small shared instance, key prefix pr-482:)
```

**Pipeline steps** (on `pull_request` opened/synchronize):
1. Build images tagged `pr-482-<sha>`.
2. **Create or reset the database**: branch from the `preview-template` database (which holds schema + seed data from `main`), then run the PR's migrations. With Neon or Supabase branching this takes seconds and is copy-on-write; otherwise `CREATE DATABASE pr_482 TEMPLATE preview_template`.
3. Deploy services into a namespace/project `pr-482` with env vars: database URL, Redis prefix, test-mode third-party keys, `APP_URL=https://pr-482.preview.example.com`.
4. Run seed scripts for PR-specific fixtures if the PR adds them.
5. Run the E2E smoke suite against the preview URL.
6. Post the URL and test account details as a PR comment.
On `closed`: delete the namespace, the database branch and Redis keys. A nightly job removes previews idle for more than 5 days.

**Seed data.** Versioned seed scripts create a realistic but synthetic dataset: a few organisations with users in each role, sample projects, edge cases (very long names, empty states, a user with 2,000 items for pagination). Never a copy of production.

**Third-party integrations.**
- **Payments**: Stripe test mode keys; webhooks registered to a single preview gateway that routes by a metadata field or uses the Stripe CLI-style forwarding per preview.
- **Email**: all outbound mail goes to a captured inbox (Mailpit/MailHog per preview, or the provider's sandbox), linked from the PR comment, so reviewers can see sign-up emails without spamming anyone.
- **OAuth logins**: providers often don't allow wildcard redirect URIs, so I'd use one stable `auth.preview.example.com` callback that completes the flow and redirects to the right PR host based on a signed `state` parameter. Or use email/password test accounts in previews.
- **Other APIs**: sandbox credentials, or stubs/fakes for services without sandboxes.

**Security.** Previews are protected by SSO (an auth proxy in front) or at least basic auth, return `X-Robots-Tag: noindex`, and never receive production secrets or data. Forked PRs from outside contributors don't get deployed automatically.

**Cost control.** Small instance sizes, scale-to-zero platforms, shared Redis/Mailpit where isolation by prefix is enough, a maximum of ~15 concurrent previews, and auto-expiry."

#### Another worked example: migrations clashing on a shared staging database
"Before per-PR databases, previews shared one staging database. PR A added a column `orders.priority`; PR B renamed `orders.status` to `orders.state`. Both migrations ran against the same database; when PR A was closed without merging, staging kept its column, and PR B's preview broke PR C's. Migration history no longer matched `main`. Moving to per-PR database branches fixed it: each preview's schema = `main` + that PR's migrations, and closing a PR throws the branch away."

#### Step-by-step framework
1. **Inventory components** the app needs to run end to end.
2. **Choose a hosting model** for per-PR services (namespaces, platform previews).
3. **Database per PR** via branching or templates; apply PR migrations; synthetic seeds.
4. **Config and secrets**: preview-specific, test-mode only.
5. **Third parties**: sandboxes, captured email, OAuth callback broker, webhook routing.
6. **Lifecycle automation**: create, update, destroy, expire.
7. **Protect** previews and **control cost**.
8. **Use them**: E2E smoke tests, PR comments with URLs and accounts.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Frontend preview pointing at shared staging API | Full stack preview including API, workers and DB |
| One shared staging database | Per-PR database branch with that PR's migrations |
| Production data dump for realism | Synthetic, versioned seed data |
| Real emails sent from previews | Captured inbox per preview |
| Previews live forever | Destroyed on close; idle expiry |
| Public, indexable preview URLs | SSO/basic auth, noindex |

#### Useful phrases
- "Each preview is main plus this PR, including the database schema."
- "Database branching makes per-PR databases cheap and fast."
- "Previews use test-mode keys and capture all email."
- "OAuth goes through one stable callback that forwards to the right preview."
- "Previews are created and destroyed automatically by CI."

#### Common pitfalls
- **Shared databases** causing migration clashes.
- **Leaking production data** into previews.
- **Forgotten previews** running up cloud bills.
- **Third-party side effects** (real emails, real charges, webhooks hitting production).
- **Flaky previews** because seed data is random or depends on time.

#### Follow-ups to expect (with sample answers)
- **"How long should creating a preview take?"**
  "Ideally under 5 minutes: cached image builds, copy-on-write database branches, and services that start quickly."
- **"How do you handle background jobs and cron in previews?"**
  "Run the worker with low concurrency; disable or shorten scheduled jobs; give each preview its own queue prefix so jobs don't cross."
- **"What about feature flags in previews?"**
  "Default to the PR's intended flag state, with a toolbar to toggle flags so reviewers can see both paths."
- **"Is this worth the cost for a small team?"**
  "Frontend previews almost always are. Full stack previews pay off once several people review features or staging contention becomes a bottleneck."

#### What senior interviewers look for
- **End-to-end completeness** including data and integrations.
- **Isolation** done right (database per PR).
- **Automation and cost discipline**.
- **Security** of internet-facing environments.

#### Practise it
1. Create a database branch per PR with Neon or Supabase branching in a CI workflow.
2. Add Mailpit to a Docker Compose preview and link it from a PR comment.
3. Write synthetic seed scripts with a few edge-case accounts.
4. Explain to a friend why a shared staging database breaks previews.

## Observability end to end: RUM, traces, logs
- id: fs-ops-03
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: observability, OpenTelemetry, distributed tracing, RUM, logging, metrics, Sentry

### Prompt
Users report "the app feels slow and sometimes errors". How would you instrument a full stack app so you can see what's happening from the user's browser through the API, database and third parties? Cover metrics, logs, traces, real-user monitoring and alerting.

### Answer
#### What the interviewer is really testing
- Knowing the **three pillars** (metrics, logs, traces) plus **RUM** and **error tracking**, and what each answers.
- **Correlation**: following one user action from the browser to the database via trace context.
- **Useful signals**: Core Web Vitals, API latency percentiles, error rates, saturation; SLOs.
- **Structured logging** and avoiding noise and PII.
- **Alerting on symptoms** users feel, not on every internal metric.

#### Key points
- **RUM (real-user monitoring)**: Core Web Vitals (LCP, INP, CLS), page load and route change timings, JS errors, failed requests, by browser/device/country/release.
- **Error tracking** (Sentry etc.): grouped exceptions with stack traces (source maps uploaded), breadcrumbs, release tags, user/session ids (not PII).
- **Distributed tracing** (OpenTelemetry): spans for HTTP requests, DB queries, cache calls, external APIs, queue jobs. Propagate **W3C `traceparent`** from browser fetches to the API and on to workers.
- **Metrics**: RED (Rate, Errors, Duration) per endpoint, USE (Utilisation, Saturation, Errors) for resources, business metrics (sign-ups, checkouts).
- **Structured logs** (JSON) with `trace_id`, `request_id`, user/tenant ids, levels; sampled debug logs; redaction of secrets and personal data.
- **SLOs and alerts**: e.g. 99.9% of API requests succeed, p95 latency < 400 ms, LCP p75 < 2.5 s; alert on **burn rate**, not on single spikes.
- **Dashboards** per user journey (login, search, checkout) linking RUM → traces → logs.

#### Model answer
"I'd instrument so that one slow click can be followed all the way down, and so alerts fire on what users feel.

**1. Browser.**
- RUM via the `web-vitals` library (or a vendor SDK): LCP, INP, CLS, TTFB per page and route, tagged with release version, device type, connection type and country.
- Error tracking (Sentry): unhandled errors and promise rejections, React error boundaries reporting with component stacks, **source maps uploaded in CI** (not served publicly).
- Fetch instrumentation that adds a **`traceparent` header** to API calls and records request duration and status. The browser span becomes the root of the trace.

**2. API.**
- **OpenTelemetry SDK** with auto-instrumentation for HTTP, Express/Fastify, Postgres, Redis and outgoing HTTP. Each request creates a server span (continuing the browser's trace); DB queries, cache calls and third-party calls become child spans.
- Custom spans around important business steps (`price_cart`, `check_inventory`).
- **Structured logs** with Pino:
```json
{"level":"info","time":"...","msg":"order created","trace_id":"4bf9…","span_id":"00f0…",
 "request_id":"req_123","org_id":"org_9","route":"POST /orders","duration_ms":182}
```
  Secrets and personal data redacted by a logger serializer; request bodies not logged by default.
- **Metrics**: request rate, error rate and latency histograms per route (RED); DB pool usage, event-loop lag, memory; business counters.

**3. Background jobs.**
- Trace context is stored in job metadata when enqueued, so the worker's span links to the request that created it.
- Metrics: queue depth, age of oldest job, job duration and failure rate.

**4. Collection and storage.**
- An OpenTelemetry Collector receives traces, metrics and logs and exports to the backend(s): Grafana (Tempo/Loki/Prometheus), Honeycomb, Datadog, etc. **Tail-based sampling** keeps all traces with errors or high latency and a sample of the rest.

**5. SLOs, dashboards and alerts.**
- Journey dashboards: 'Checkout' shows RUM timings for the checkout pages, API latency/errors for the checkout endpoints, payment provider latency, and conversion rate.
- SLOs: 99.9% of API requests non-5xx over 30 days; p95 latency < 400 ms for key endpoints; LCP p75 < 2.5 s.
- Alerts on **error-budget burn rate** (fast burn pages someone; slow burn creates a ticket), plus a few direct alerts (queue age > 10 minutes, DB connections > 90%). Every alert links to a runbook.

**Investigating 'slow and sometimes errors'.**
1. RUM: is INP or LCP bad, for which pages, devices, releases?
2. Errors: new error groups since the last release?
3. For slow API calls, open example traces: is time in the DB (a missing index), in a third-party call, in cache misses, or in the browser after the response (heavy rendering)?
4. Logs for the specific trace id give details."

#### Another worked example: a slowdown only for some customers
"RUM showed INP p75 had doubled, but only for one large tenant. Traces for their requests showed `GET /projects` taking 2.8 s with a 2.5 s DB span. The log line for that trace showed the query and `org_id`; `EXPLAIN` revealed a sequential scan because their data distribution made the planner skip an index. A composite index on `(org_id, updated_at)` fixed it. Without tenant ids in spans and logs, the problem would have been averaged away in global p95s. High-cardinality attributes (tenant, route, release) on traces are what make this kind of investigation fast."

#### Step-by-step framework
1. **Define journeys and SLOs** with product.
2. **Browser**: RUM (Web Vitals), error tracking with source maps, trace propagation.
3. **Server**: OpenTelemetry traces, RED metrics, structured logs with trace ids.
4. **Async work**: propagate trace context into jobs; queue metrics.
5. **Collect** via an OTel Collector; tail-based sampling.
6. **Dashboards per journey**; link RUM → traces → logs.
7. **Alert on SLO burn** and a few saturation signals; runbooks.
8. **Protect privacy**: redaction, minimal PII.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add more logs" | Metrics, traces, logs, RUM and errors, each for its purpose |
| Unstructured `console.log` strings | Structured JSON logs with trace ids |
| Server-only monitoring | RUM and browser errors with source maps |
| No correlation | `traceparent` from browser to API to jobs |
| Alerts on CPU > 80% | Alerts on user-facing SLO burn rates |
| Logs full request bodies | Redaction and minimal PII |

#### Useful phrases
- "I want to follow one click from the browser to the database."
- "Every log line carries the trace id."
- "Alerts are based on what users feel: SLO burn, not CPU."
- "Tail-based sampling keeps every slow or failed trace."
- "Tenant and release attributes on spans let us find problems averages hide."

#### Common pitfalls
- **Alert fatigue** from noisy, symptom-less alerts.
- **Missing source maps**, making browser errors unreadable.
- **Logging secrets or personal data.**
- **Averages instead of percentiles.**
- **Broken trace propagation** across queues or third-party SDKs.

#### Follow-ups to expect (with sample answers)
- **"How do you control observability costs?"**
  "Sample traces (tail-based), drop debug logs in production, set retention by data type, avoid unbounded-cardinality metric labels, and put high-cardinality data in traces instead."
- **"What's the difference between monitoring and observability?"**
  "Monitoring checks known failure modes; observability lets you ask new questions about unknown ones, thanks to rich, correlated telemetry."
- **"Do you need CORS changes for traceparent?"**
  "Yes for cross-origin APIs: allow the `traceparent` and `tracestate` headers. Same-origin APIs need nothing."
- **"How do you know a deploy caused a regression?"**
  "Release tags on RUM, errors and traces, deploy markers on dashboards, and canary comparisons."

#### What senior interviewers look for
- **End-to-end correlation** as the core design goal.
- **SLO-driven alerting**.
- **Cost and privacy** awareness.
- A **practical investigation flow**.

#### Practise it
1. Add OpenTelemetry auto-instrumentation to a Node API and view traces in Jaeger or Grafana Tempo.
2. Propagate `traceparent` from a React app's fetch calls and see one trace spanning both.
3. Set up `web-vitals` reporting and a Sentry project with source maps from CI.
4. Define two SLOs for an app you know and write burn-rate alert rules.

## Debugging a slow page: frontend or backend?
- id: fs-ops-04
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: performance, debugging, Core Web Vitals, TTFB, DevTools, profiling, waterfalls

### Prompt
A key page takes 6 seconds to become usable. You don't know whether the problem is the frontend, the API, the database or the network. Walk through how you'd find the bottleneck systematically and what fixes you'd consider at each layer.

### Answer
#### What the interviewer is really testing
- A **systematic, measurement-first** approach rather than guessing.
- Breaking page time into **phases**: DNS/TLS/TTFB, HTML parse, resource loading, JS execution, data fetching waterfalls, rendering and hydration, interactivity.
- Using the **right tools**: field data (RUM), lab tools (Lighthouse, DevTools Performance and Network panels, WebPageTest), server traces, query plans.
- Knowing **typical fixes** per layer and prioritising by impact.
- Verifying improvements with the same metrics.

#### Key points
- **Start with field data**: which metric is bad (LCP, INP, TTFB), for whom (device, network, region), since when (release)?
- **Reproduce in the lab** with throttling that matches real users (mid-range phone CPU, 4G).
- **Network waterfall**: long TTFB → server; many sequential requests → waterfall/chattiness; huge JS → bundle; late LCP image → resource priority.
- **Performance panel**: long tasks on the main thread → JS cost (parsing, hydration, heavy renders); layout thrashing; third-party scripts.
- **Server traces**: time split between app code, DB queries, external calls, cache misses.
- **Database**: `EXPLAIN ANALYZE` for slow queries; missing indexes; N+1.
- Fix the **biggest contributor first**, re-measure, repeat.

#### Model answer
"I'd decompose the 6 seconds instead of guessing, starting from real-user data.

**1. Field data first.** RUM shows LCP p75 = 5.8 s on mobile, 2.1 s on desktop; INP fine; TTFB p75 = 1.4 s. Regressed two weeks ago with release 4.12. So: mostly a mobile loading problem, with a server component (TTFB), introduced recently.

**2. Lab reproduction.** Chrome DevTools with 4× CPU throttling and 'Fast 4G', or WebPageTest on a Moto G-class device. Record the **Network** waterfall and **Performance** profile.

**3. Read the waterfall.**
```
0.0s ─ HTML request ────────────── TTFB 1.4s
1.4s ─ main.js (900 KB gz) ──────────────── 2.6s download + parse
3.1s ─ GET /api/me ─ 300ms
3.4s ─ GET /api/dashboard ─ 900ms        ← waits for /api/me
4.3s ─ GET /api/widgets/1..6 (parallel) ─ 600ms
4.9s ─ hero image (lazy, discovered late) ─ 800ms
5.8s ─ LCP
```
That shows several problems at once:
- **TTFB 1.4 s**: server-side.
- **900 KB JS**: bundle size and parse time on mobile.
- **Request waterfall**: `/api/me` → `/api/dashboard` → widgets, all sequential and client-side.
- **LCP image discovered late** and lazy-loaded.

**4. Server investigation (TTFB and API).** Traces for the HTML request show 1.1 s in a `getFeatureConfig` call to a third-party service, added in release 4.12, uncached. `/api/dashboard` spends 700 ms in one query; `EXPLAIN ANALYZE` shows a sequential scan on `events` for the date filter.

**5. Fixes, by expected impact.**
| Problem | Fix | Expected gain |
|---|---|---|
| Uncached third-party config in the HTML path | Cache in memory/Redis for 60 s, add a timeout and fallback | −1.1 s TTFB |
| Slow dashboard query | Composite index `(org_id, created_at)`; select only needed columns | −600 ms |
| Client request waterfall | Fetch dashboard data on the server (SSR/loader) or one aggregate endpoint returning widgets; parallelise independent calls | −1 s |
| 900 KB JS | Code-split routes and heavy widgets (charts) with dynamic imports; remove a duplicated date library; analyse with the bundle analyser | −1 s+ on mobile |
| Late LCP image | Not lazy; `fetchpriority="high"`; preload; correct `srcset` sizes; AVIF/WebP | −500 ms |

**6. Re-measure** after each change in the lab, then confirm in RUM after release. Target: LCP p75 < 2.5 s on mobile.

**7. Prevent recurrence.** Performance budgets in CI (bundle size limits, Lighthouse CI thresholds on key pages), a timeout and cache policy for any third-party call on the critical path, and RUM alerts on LCP p75 regressions per release."

#### Another worked example: slow after it loads (INP)
"Another page loaded fine but typing in a filter box felt laggy: INP p75 600 ms. The Performance panel showed each keystroke triggering a 400 ms long task: the whole 5,000-row table re-rendered because filter state lived in a top-level context. Fixes: debounce the filter, use `useDeferredValue`/`startTransition` so typing stays responsive, memoise rows, and virtualise the table so only ~30 rows render. INP fell to 120 ms. The backend was never involved; measuring first saved a pointless API investigation."

#### Step-by-step framework
1. **Field data**: which metric, which users, since when.
2. **Reproduce** in the lab with realistic throttling.
3. **Waterfall**: TTFB, bundle, request chains, resource priority.
4. **Main-thread profile**: long tasks, hydration, third-party scripts.
5. **Server traces**: app vs DB vs external vs cache.
6. **Database plans** for slow queries.
7. **Fix biggest first**, re-measure, repeat.
8. **Budgets and alerts** to prevent regression.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add caching" or "use a CDN" immediately | Measures and decomposes the time first |
| Tests on a fast laptop | Throttled lab tests matching real users + RUM |
| Looks only at the backend | Covers network, JS, rendering and server |
| Optimises small things first | Prioritises by measured impact |
| No verification | Re-measures in lab and field |
| One-off fix | Performance budgets and regression alerts |

#### Useful phrases
- "Let me split the six seconds into phases before changing anything."
- "Field data tells me who's affected; the lab tells me why."
- "The waterfall shows a chain of dependent requests we can collapse."
- "TTFB points to the server; the trace shows where the time goes."
- "I'd add a budget so this doesn't regress next quarter."

#### Common pitfalls
- **Guessing** and optimising the wrong layer.
- **Testing only on desktop** with fast networks.
- **Lighthouse score chasing** instead of real-user metrics.
- **Ignoring third-party scripts and APIs** on the critical path.
- **Lazy-loading the LCP image.**

#### Follow-ups to expect (with sample answers)
- **"What's a good TTFB?"**
  "Under ~800 ms at p75 is Google's guidance; for cached HTML from a CDN, under 200 ms is achievable."
- **"How do you find which JS is heavy?"**
  "A bundle analyser (source-map-explorer, Vite/webpack visualisers) for size, and the Performance panel's bottom-up view for execution cost."
- **"What if the database is the bottleneck but the query is already indexed?"**
  "Check the plan for row estimates, look at locks and connection pool waits, reduce the data fetched, add caching or precomputed aggregates, or move heavy reads to a replica."
- **"How do you convince the team to prioritise this?"**
  "Tie it to business metrics (conversion or retention by LCP bucket), and show before/after numbers from a small fix."

#### What senior interviewers look for
- **Disciplined measurement** across the whole stack.
- **Correct interpretation** of waterfalls, profiles and traces.
- **Impact-based prioritisation**.
- **Prevention** via budgets and monitoring.

#### Practise it
1. Record a throttled Network and Performance profile for a real page and annotate where each second goes.
2. Find and fix one request waterfall by moving fetching to the server or combining endpoints.
3. Run a bundle analyser and remove the largest unnecessary dependency.
4. Explain to a friend how to tell from a waterfall whether a problem is frontend or backend.

## Deploying frontend and backend changes safely together
- id: fs-ops-05
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels:
- tags: deployment, backward compatibility, versioning, version skew, SPA, mobile clients

### Prompt
A feature needs a new API field, a changed request format and a new UI. The frontend and backend deploy separately, users keep tabs open for days, and there's a mobile app. How do you ship the change without breaking anyone during or after the rollout?

### Answer
#### What the interviewer is really testing
- Understanding **version skew**: at any moment, several frontend and backend versions are live together.
- **Backward and forward compatibility** rules for APIs (tolerant readers, additive changes).
- **Deploy ordering** (backend first for new capabilities; remove old paths last).
- Handling **long-lived clients**: open SPA tabs, cached service workers, mobile apps on old versions.
- **Feature flags** to decouple deploy from release, and **rollback** safety.

#### Key points
- Assume **N and N−1 (and older) clients and servers coexist**: rolling deploys, CDN caches, open tabs, app stores.
- **Additive changes** are safe: new optional fields, new endpoints, new enum values only if clients tolerate unknowns.
- **Breaking changes** use **expand–contract**: the backend accepts both old and new formats, clients migrate, then the old format is removed after usage drops.
- **Order**: deploy backend support **before** the frontend that uses it; remove old backend support **after** all clients have moved.
- **Tolerant reader**: clients ignore unknown fields and handle missing optional ones; servers ignore unknown request fields (or validate strictly but accept both versions during transitions).
- **Feature flags** enable the new UI after both sides are deployed; turning the flag off is the rollback.
- **SPA version skew**: detect new deployments (version endpoint or header), prompt to reload, keep old JS chunks available, handle chunk-load errors by reloading.
- **Mobile**: minimum supported version, forced-update mechanism, server-driven compatibility.

#### Model answer
"I'd assume version skew is permanent, plan the change so every combination of old and new works, and use a flag to release.

**The change.** Orders get a `deliveryWindow` field; `POST /orders` changes from `deliveryDate: string` to `delivery: { date, window }`; the UI adds a window picker.

**Step 1: backend expands (deploy, no visible change).**
- Database: add nullable `delivery_window` (expand migration).
- `POST /orders` accepts **both** shapes:
```ts
const OrderInput = z.union([
  LegacyOrderInput,                                   // { deliveryDate }
  z.object({ delivery: z.object({ date: z.string().date(), window: z.enum(['am','pm','eve']).optional() }) }),
]).transform(normaliseToNewShape);
```
- Responses add `delivery: { date, window }` **and keep** `deliveryDate` for old clients.
- Contract tests verify old-shape requests still work.

**Step 2: frontend deploys behind a flag.**
- New UI code ships with `delivery-windows` off; it reads `delivery` if present and falls back to `deliveryDate`.
- Open tabs on the old version keep working because the backend accepts the old shape.

**Step 3: release.**
- Turn the flag on for staff, then 10%, 50%, 100%, watching order errors and conversion.
- Rollback = flag off. No deploy needed, and both shapes remain valid.

**Step 4: mobile.**
- The mobile app adds the new shape in its next release. Old versions keep sending `deliveryDate`; the server keeps accepting it.
- Track request shape usage by `User-Agent`/app version in metrics.

**Step 5: contract (weeks or months later).**
- When legacy usage is near zero and the minimum supported mobile version uses the new shape, remove legacy parsing and the `deliveryDate` response field, then the old column if any.

**Handling SPA version skew in general.**
- The API sends an `X-App-Version` header (or the SPA polls `/version.json`); when the deployed version differs from the running one, show 'A new version is available — Reload'. For breaking cases, the server can respond with a specific code that triggers a reload.
- Static assets are **content-hashed and kept for several deploys**, so an old tab lazy-loading `Settings.4f2a.js` still finds it.
- A global handler for `ChunkLoadError` / failed dynamic imports reloads the page once.
- Service workers activate updates deliberately (prompt to refresh) rather than mixing old HTML with new assets.

**Mobile specifics.**
- A `/config` endpoint returns `minSupportedVersion`; older apps show a forced-update screen. Used rarely, but it caps how long compatibility must be kept.
- Server-driven flags let mobile features roll out without app releases.

**Rules of thumb I'd share with the team:**
1. Never change the meaning of an existing field; add a new one.
2. Backend ships capability first; clients use it second; old paths are removed last.
3. Clients tolerate unknown fields and enum values (render a sensible default).
4. Every breaking change has a written plan: expand, migrate, contract, with dates."

#### Another worked example: a new enum value broke old clients
"The backend added a new order status `partially_shipped`. Old mobile clients had a `switch` with no default, so the order screen crashed for affected orders. Fixes: clients always include a default branch (show a generic 'In progress' label) and log unknown values; the API contract documents that enums may grow; and for clients known not to tolerate it, the server can map new values to the closest old value based on the client version until the minimum version moves on. Adding an enum value *is* a breaking change for intolerant readers."

#### Step-by-step framework
1. **Assume skew**: list every client and server version that can coexist.
2. **Classify the change**: additive or breaking.
3. **Expand the backend** to accept old and new, return both.
4. **Ship clients** behind a flag; tolerant readers.
5. **Release via flag**; rollback via flag.
6. **Track usage** of old shapes by client version.
7. **Contract** when usage is gone and minimum versions allow.
8. **SPA/mobile hygiene**: version detection, asset retention, chunk-error reloads, forced updates.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Deploy both at the same time" | Assumes and designs for version skew |
| Changes the request format in place | Accepts both formats during transition |
| Frontend deployed first, calling a missing endpoint | Backend capability first, clients second |
| Old JS chunks deleted on deploy | Hashed assets retained; chunk-error reload |
| Removes old fields when the web app is updated | Waits for mobile adoption and minimum versions |
| Rollback means redeploying both | Flag off; both shapes still valid |

#### Useful phrases
- "There's never a moment when all clients are on the same version."
- "The backend learns the new format first and keeps accepting the old one."
- "Releasing is a flag flip, so rolling back is too."
- "Clients must tolerate fields and enum values they don't know."
- "We remove the old path only when metrics show nobody uses it."

#### Common pitfalls
- **Lockstep deploy assumptions.**
- **Strict clients** crashing on new enum values or fields.
- **Deleting old assets**, breaking lazy-loaded routes in open tabs.
- **Removing compatibility too early** for mobile users.
- **No visibility** into which clients use which shapes.

#### Follow-ups to expect (with sample answers)
- **"When would you version the API (v2) instead?"**
  "For broad, structural changes across many endpoints, or public APIs with external consumers. For a single field change, expand–contract is simpler."
- **"How do you test compatibility?"**
  "Contract tests with recorded requests from old client versions, and a test suite running the previous frontend build against the new backend."
- **"How long do you keep compatibility?"**
  "Web: a few days to weeks (tabs, caches). Mobile: until the minimum supported version, often months. Public APIs: per the published deprecation policy."
- **"What about GraphQL?"**
  "Same idea: add fields, deprecate old ones with `@deprecated`, monitor field usage per client, remove when unused."

#### What senior interviewers look for
- **Version-skew thinking** as the default.
- **Clear sequencing** and rollback via flags.
- **Client hygiene** for SPAs and mobile.
- **Data-driven contract** removal.

#### Practise it
1. Implement an endpoint accepting both old and new request shapes with a Zod union and contract tests for each.
2. Deploy a SPA twice and simulate an old tab lazy-loading a deleted chunk; add retention and a reload handler.
3. Add a version-check banner to an SPA.
4. Explain to a friend why adding an enum value can be a breaking change.

## Environment configuration and twelve-factor apps
- id: fs-ops-06
- round: RELIABILITY_OPERATIONS
- difficulty: easy
- levels:
- tags: configuration, environment variables, twelve-factor, config validation, environments

### Prompt
How do you manage configuration for a full stack app across local development, previews, staging and production? Explain the twelve-factor approach, how you validate config, and how frontend build-time config differs from server runtime config.

### Answer
#### What the interviewer is really testing
- Knowing the **twelve-factor principles** relevant to config: config in the environment, strict separation of config from code, dev/prod parity, build/release/run separation.
- **Validating config at startup** and failing fast with clear errors.
- The **frontend build-time vs runtime** distinction (values baked into bundles).
- Managing **secrets vs non-secret config**, per-environment differences and defaults.
- Avoiding environment-specific **code branches** (`if (env === 'staging')`).

#### Key points
- **Config** = everything that varies between deploys (URLs, credentials, feature toggles, limits). Code is the same everywhere; config changes per environment.
- **Store config in the environment** (env vars) or a config service, not in the repo (except non-secret defaults and `.env.example`).
- **Validate at startup** with a schema (Zod/envalid): required keys, types, formats; crash early with a readable list of what's wrong.
- **One typed config module** that the rest of the code imports; no `process.env` scattered across files.
- **Frontend**: bundlers inline public env vars at **build time**, so one build can't be promoted across environments unless config is injected at **runtime** (a `/config.json`, a `window.__CONFIG__` script injected by the server, or SSR).
- **Build, release, run**: build an artifact once; a release = artifact + config; run that release. Enables promotion and rollback.
- **Dev/prod parity**: same database engine and versions locally (Docker), similar services, so "works on my machine" is rare.
- **Prefer behaviour flags over environment checks**: `EMAIL_TRANSPORT=smtp|console` rather than `if (isDev)`.

#### Model answer
"I'd follow the twelve-factor approach: one codebase, one artifact, and everything environment-specific supplied as configuration and validated on startup.

**1. Typed, validated config module (server).**
```ts
// config.ts
const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  EMAIL_TRANSPORT: z.enum(['console', 'smtp', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(120),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
}).superRefine((e, ctx) => {
  if (e.EMAIL_TRANSPORT === 'resend' && !e.RESEND_API_KEY)
    ctx.addIssue({ code: 'custom', path: ['RESEND_API_KEY'], message: 'required when EMAIL_TRANSPORT=resend' });
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid configuration:\n' +
    parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'));
  process.exit(1);
}
export const config = Object.freeze(parsed.data);
```
- The app refuses to start with bad config, so a missing variable is caught at deploy time (health check fails, rollout stops), not at 3 am when the first email is sent.
- The rest of the code imports `config`, never `process.env`, so every setting is documented in one place and typed.
- Behaviour is chosen by explicit settings (`EMAIL_TRANSPORT`), not by `NODE_ENV` checks scattered around.

**2. Per-environment values.**
| Setting | Local | Preview | Staging | Production |
|---|---|---|---|---|
| `DATABASE_URL` | Docker Postgres | PR database branch | Staging DB | Production DB |
| `EMAIL_TRANSPORT` | console | smtp → Mailpit | resend (sandbox) | resend |
| `RATE_LIMIT_PER_MIN` | 10000 | 1000 | 120 | 120 |
| Secrets | `.env.local` (gitignored) | CI-injected test keys | Secrets manager | Secrets manager |
`.env.example` lists every variable with a comment; new variables must be added there and to the schema in the same PR.

**3. Frontend config.**
- Bundlers (Vite `import.meta.env.VITE_*`, Next.js `NEXT_PUBLIC_*`) **inline values at build time**. That means a bundle built for staging contains staging URLs, which breaks 'build once, promote everywhere'.
- Options:
  - **Runtime config**: the server (or an edge function) serves `/config.json` or injects `<script>window.__CONFIG__ = {...}</script>` into the HTML from environment variables at request time. The SPA reads it at startup. One build, any environment.
  - **SSR frameworks**: read config on the server and pass needed values to the client.
  - **Build per environment** is acceptable for simple static sites, but then staging and production artifacts differ, which I'd note as a trade-off.
- Only **public** values go to the client (API base URL, Sentry DSN, publishable keys, feature defaults). Validate the client config too, with a small schema.

**4. Build, release, run.** CI builds `api:<sha>` once. A release is that image + the environment's config (env vars from the platform/secrets manager). Rolling back means running the previous release; changing config means a new release, recorded and auditable.

**5. Dev/prod parity.** Docker Compose for Postgres 16, Redis 7 and Mailpit locally, matching production versions; the same migrations run everywhere; seed scripts for local data."

#### Another worked example: a typo that took down production email
"A deploy renamed `SMTP_HOST` to `EMAIL_HOST` in code, but production still had `SMTP_HOST`. The app started fine because config was read lazily inside the email function; password reset emails silently failed for six hours. With startup validation, the new release would have crashed on boot, failed its health check and never received traffic, and the error message would have said exactly which variable was missing. Lazy config reads hide problems; eager validation surfaces them at deploy time."

#### Step-by-step framework
1. **Inventory config**: everything that varies by environment; separate secrets.
2. **Schema + typed module**; validate at startup; fail fast.
3. **No `process.env` outside the module**; no environment-name branching.
4. **Per-environment values** in the platform/secrets manager; `.env.example` for docs.
5. **Frontend**: public-only values; runtime injection to keep one build.
6. **Build/release/run** separation for promotion and rollback.
7. **Dev/prod parity** with containers and the same versions.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `process.env.X` read all over the codebase | One validated, typed config module |
| Config errors discovered at runtime | Startup validation fails the deploy |
| `if (env === 'staging')` branches | Explicit behaviour settings |
| Separate builds per environment by default | Runtime config for one promotable build |
| Secrets in `.env` committed to git | Secrets manager; `.env.example` only |
| SQLite locally, Postgres in production | Same engine and versions everywhere |

#### Useful phrases
- "The artifact is the same everywhere; only config changes."
- "The app validates its config on startup and refuses to run if it's wrong."
- "Code reads one typed config object, never `process.env` directly."
- "Frontend build variables are baked in, so I inject runtime config to keep one build."
- "Behaviour is chosen by explicit settings, not by checking the environment name."

#### Common pitfalls
- **Lazy config reads** hiding missing values.
- **Environment drift**: staging config nobody remembers changing.
- **Leaking secrets into frontend config.**
- **Different database engines** locally and in production.
- **Undocumented variables** that new developers have to discover.

#### Follow-ups to expect (with sample answers)
- **"Env vars or a config service?"**
  "Env vars for most settings (simple, universal). A config service or secrets manager for secrets rotation, dynamic config and audit; often the platform injects secrets as env vars."
- **"How do you change config without a deploy?"**
  "Dynamic settings (rate limits, feature toggles) belong in a feature-flag or config service with audit; static infrastructure config changes through a new release."
- **"How do you handle config in tests?"**
  "A test environment file with safe defaults, plus helpers to override specific values per test; never real credentials."
- **"What are the other twelve factors?"**
  "Codebase, dependencies, config, backing services, build/release/run, stateless processes, port binding, concurrency, disposability, dev/prod parity, logs as event streams, admin processes."

#### What senior interviewers look for
- **Fail-fast, typed configuration** as standard practice.
- **Understanding of build-time vs runtime** config for frontends.
- **Promotion and rollback** enabled by build/release/run.
- **Parity and documentation** that make onboarding easy.

#### Practise it
1. Add a Zod-validated config module to a Node app and remove all other `process.env` uses.
2. Make a Vite SPA read runtime config from `/config.json` served by the backend, then promote one build to two environments.
3. Set up Docker Compose matching production service versions.
4. Explain to a friend why lazy config reads are dangerous.

## Cost awareness: hosting, database and third-party bills
- id: fs-ops-07
- round: RELIABILITY_OPERATIONS
- difficulty: medium
- levels: senior, staff
- tags: cost optimisation, FinOps, cloud costs, unit economics, observability costs, AI costs

### Prompt
Your startup's cloud and SaaS bills have tripled in six months while revenue grew 30%. As a senior full stack engineer, how would you find where the money goes, reduce costs without hurting the product, and keep costs under control afterwards?

### Answer
#### What the interviewer is really testing
- Treating **cost as an engineering metric**, like latency or error rate.
- Knowing **where costs typically hide**: databases, egress, NAT gateways, logs/observability, idle environments, serverless at sustained load, third-party APIs (including AI), over-provisioning.
- A **measurement-first** approach: tagging, attribution, unit economics (cost per customer/request).
- **Safe optimisations** prioritised by impact and risk.
- **Ongoing governance**: budgets, alerts, ownership, cost in design reviews.

#### Key points
- **Attribute first**: tag resources by service/team/environment; use billing exports; group SaaS invoices; compute **unit costs** (cost per active user, per request, per tenant).
- Common big wins: **right-sizing** over-provisioned databases and instances; **deleting idle** environments, volumes, snapshots and old previews; **observability** (log volume, retention, high-cardinality metrics); **egress and NAT** traffic (move traffic to CDN, VPC endpoints); **caching** to reduce compute and third-party calls; **storage tiers** and lifecycle rules.
- **Pricing models**: reserved instances/savings plans or committed use for steady load; spot/preemptible for batch; serverless for spiky load, containers for steady load.
- **Third-party and AI costs**: per-call pricing grows silently; add caching, batching, cheaper models for simple tasks, prompt caching, per-user caps and usage dashboards.
- **Guardrails**: budgets and anomaly alerts, cost dashboards per team, cost estimates in design docs, default auto-expiry for non-production resources.
- Don't trade away **reliability or security** (e.g. dropping backups or multi-AZ for production) without an explicit decision.

#### Model answer
"I'd treat it like a performance problem: measure, find the biggest contributors, fix the safest high-impact ones, and add monitoring so it doesn't creep back.

**1. Find where the money goes (week 1).**
- Export billing data (AWS Cost and Usage Report / GCP billing export) into a queryable table; group by service, tag and environment. Tag anything untagged.
- List SaaS bills: observability, error tracking, email, search, auth, AI providers, CI minutes.
- Compute **unit economics**: monthly cost ÷ active customers, cost per 1k API requests, cost per tenant for the biggest customers. If cost per customer rose, it's not just growth.

A typical breakdown I'd expect to find:
| Area | Share | Usual cause |
|---|---|---|
| Database | 30% | Oversized primary, unused replicas, high IOPS from missing indexes |
| Observability | 20% | Debug logs in production, 90-day retention for everything, high-cardinality metrics |
| Compute | 15% | Over-provisioned containers, serverless functions doing heavy sustained work |
| Networking | 10% | NAT gateway charges, cross-AZ traffic, egress not served via CDN |
| Non-production | 10% | Staging sized like production, previews never deleted |
| Third-party APIs / AI | 15% | Uncached calls, expensive models for simple tasks, no per-user limits |

**2. Fix by impact and risk (weeks 2–6).**
- **Database**: find top queries by total time in `pg_stat_statements`; add indexes so we can downsize instance or IOPS; drop unused read replicas; move analytics queries off the primary.
- **Observability**: drop debug logs in production, sample high-volume info logs, shorten retention (7–14 days hot, archive to object storage), remove unbounded-cardinality metric labels, tail-sample traces. Often cuts 50%+ of that bill without losing useful signal.
- **Compute**: right-size from actual utilisation (CPU/memory p95), autoscale on real signals, move steady heavy workloads off per-invocation pricing, buy savings plans for the stable baseline.
- **Networking**: serve assets and downloads via CDN, use VPC endpoints for S3/other services to avoid NAT charges, keep chatty services in the same AZ where appropriate.
- **Non-production**: scale staging down outside working hours, auto-expire previews, delete orphaned volumes and snapshots, lifecycle rules on buckets.
- **Third-party and AI**: cache responses where valid, batch calls, use smaller/cheaper models for classification and extraction, prompt caching for long system prompts, per-user and per-tenant caps, and dashboards of usage by feature.

**3. Keep it under control.**
- **Budgets and anomaly alerts** per account/project (e.g. alert at 80% of monthly budget and on daily spend 30% above trend).
- **Cost dashboards per team/service**, reviewed monthly, with cost per customer as a tracked metric.
- **Cost section in design docs**: 'expected monthly cost at current and 10× scale'.
- **Defaults**: every non-production resource has an owner tag and expiry; CI blocks untagged infrastructure (policy as code).
- **Pricing-aware architecture**: e.g. noting when a design moves from serverless to containers at a known traffic level.

**What I wouldn't cut** without an explicit, recorded decision: production backups and PITR, multi-AZ for the primary database, security tooling, or the observability we need to meet SLOs."

#### Another worked example: an AI feature's bill
"A 'summarise this document' feature launched on the largest model with no limits. Within a month it was the biggest line item: some users re-summarised the same 200-page documents repeatedly. Fixes: cache summaries by document hash and version (most requests became free), use a smaller model for documents under a length threshold with quality checked on an evaluation set, enable prompt caching for the long system prompt, cap free-tier users at 20 summaries/day, and show usage in the admin dashboard. Cost per summary fell by ~80% and the feature stayed. Pricing the feature properly (which plan includes it) followed from having the unit cost."

#### Step-by-step framework
1. **Attribute**: tags, billing exports, SaaS inventory.
2. **Unit economics**: cost per customer/request/tenant.
3. **Rank** by spend and growth; identify causes.
4. **Fix safe, high-impact items** first: idle resources, logs, right-sizing, caching.
5. **Change pricing models** for steady workloads.
6. **Control third-party/AI usage** with caching, model choice, caps.
7. **Guardrails**: budgets, anomaly alerts, ownership, design-doc cost estimates.
8. **Protect reliability and security** while cutting.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Move everything to cheaper instances" | Attributes costs before changing anything |
| Looks only at compute | Covers DB, observability, networking, SaaS, AI |
| No unit metrics | Cost per customer/request as a KPI |
| Cuts backups and redundancy | Protects reliability; explicit decisions only |
| One-off clean-up | Budgets, alerts, ownership and design reviews |
| Ignores product impact | Optimisations measured against latency and quality |

#### Useful phrases
- "First I'd find out where the money goes and what each customer costs us."
- "Logs and observability are often the quiet second-biggest bill."
- "Indexing the top queries can let us downsize the database."
- "For AI features: cache, pick the smallest model that passes our evals, and cap usage."
- "Every non-production resource has an owner and an expiry date."

#### Common pitfalls
- **Untagged resources** making attribution impossible.
- **Cutting blindly** and causing incidents.
- **Ignoring SaaS bills** outside the cloud console.
- **Optimising tiny line items** while the database dominates.
- **No ongoing monitoring**, so costs creep back.

#### Follow-ups to expect (with sample answers)
- **"How do you get engineers to care about cost?"**
  "Make it visible: per-team dashboards, cost per feature in release notes, and celebrating savings like performance wins."
- **"When do reserved instances make sense?"**
  "For the steady baseline you're confident you'll need for 1–3 years; keep variable load on on-demand or autoscaling."
- **"How do you estimate cost for a new design?"**
  "Model the main drivers (requests, storage, data transfer, third-party calls) at current and 10× scale using provider calculators, and note the break-even points between options."
- **"What's FinOps?"**
  "A practice of shared accountability for cloud spend between engineering, finance and product, with visibility, optimisation and governance as an ongoing loop."

#### What senior interviewers look for
- **Data-driven** cost analysis and **unit economics**.
- **Breadth** of cost sources, including AI and SaaS.
- **Balanced trade-offs** with reliability and product quality.
- **Sustainable governance**.

#### Practise it
1. Export a month of your cloud bill and group it by service and tag; find the top five lines.
2. Use `pg_stat_statements` to find the top queries by total time and fix one.
3. Calculate cost per active user for a project you know.
4. Explain to a friend three ways to cut an AI feature's cost without removing it.

## Testing a full stack feature: what goes where
- id: fs-ops-08
- round: TESTING
- difficulty: medium
- levels:
- tags: testing strategy, unit tests, integration tests, E2E, Playwright, contract tests, test pyramid

### Prompt
You've built a feature end to end: a React form, an API endpoint, database writes, an email job and a third-party payment call. How do you decide what to test with unit, component, integration, contract and end-to-end tests, and how do you keep the suite fast and reliable?

### Answer
#### What the interviewer is really testing
- A **testing strategy** that gives confidence at reasonable cost, not "100% coverage" or "only E2E".
- Knowing **what each test type is good at** and where it fails (speed, flakiness, realism).
- **Test boundaries**: what to mock (third parties) and what to run for real (your database).
- **Test data management** and isolation.
- Keeping suites **fast, deterministic and maintained**.

#### Key points
- **Unit tests**: pure logic (validation schemas, pricing, formatting, reducers). Very fast; many of them.
- **Component tests** (Testing Library): UI behaviour from the user's perspective (labels, roles, interactions, error messages), with the network mocked at the HTTP layer (MSW).
- **API integration tests**: the real HTTP handler + **real Postgres** (container), with auth, validation, DB constraints and transactions exercised. Third parties faked at the boundary.
- **Contract tests**: verify assumptions about external APIs (payment provider sandbox, recorded contracts) and between your own services/clients (consumer-driven contracts or schema checks).
- **End-to-end tests** (Playwright): a few critical user journeys in a real browser against a deployed stack (preview/staging), with test-mode third parties.
- Shape: the **testing trophy/pyramid**: most value from integration tests for a typical web app; a small, reliable E2E layer.
- **Determinism**: control time, randomness and data; no sleeps; isolated data per test.
- Test **behaviour, not implementation**.

#### Model answer
"I'd decide by asking, for each risk, 'what's the cheapest test that would catch this?'

**The feature:** 'Upgrade plan' form → `POST /api/subscriptions` → validates, creates a Stripe subscription, saves it, enqueues a confirmation email.

**1. Unit tests (milliseconds, many).**
- The shared Zod schema: valid/invalid inputs, error codes.
- `priceForPlan(plan, seats, coupon)`: proration, rounding, coupon edge cases (table-driven tests).
- Email template rendering with sample data.

**2. Component tests (React Testing Library + MSW).**
```ts
test('shows server field errors next to the right field', async () => {
  server.use(http.post('/api/subscriptions', () =>
    HttpResponse.json({ errors: { fieldErrors: { seats: ['too_many'] } } }, { status: 422 })));
  render(<UpgradeForm />);
  await user.selectOptions(screen.getByLabelText(/plan/i), 'team');
  await user.clear(screen.getByLabelText(/seats/i)); await user.type(screen.getByLabelText(/seats/i), '500');
  await user.click(screen.getByRole('button', { name: /upgrade/i }));
  expect(await screen.findByText(/maximum of 200 seats/i)).toBeVisible();
  expect(screen.getByLabelText(/seats/i)).toHaveAttribute('aria-invalid', 'true');
});
```
- Queries by role and label (also checks accessibility basics).
- Covers loading state, double-submit prevention, success redirect.

**3. API integration tests (real Postgres, faked Stripe).**
- Spin up Postgres in a container (Testcontainers or CI service), run migrations once, wrap each test in a transaction or truncate between tests.
- The Stripe client is injected; tests use a **fake** implementing the same interface (or nock/MSW at HTTP level).
- Cases: success writes the subscription row and enqueues one email job; validation errors return 422 shapes; user from another org gets 404; Stripe card declined returns a clear error and writes nothing; the same idempotency key twice creates one subscription; a DB unique constraint race returns the friendly error.
- These catch the bugs that matter most in full stack work: SQL, constraints, auth, transactions, error mapping.

**4. Job tests.** The email worker with a fake email provider: renders correctly, is idempotent on retry, handles provider errors with retry.

**5. Contract tests.**
- **Stripe**: a small suite against Stripe's **test mode** (nightly, not on every PR) verifying our assumptions: request shapes, webhook payloads, error codes. Plus webhook handler tests using signed fixture payloads.
- **Frontend ↔ API**: shared schemas/types compile on both sides; an OpenAPI diff or contract test in CI for breaking changes.

**6. End-to-end (Playwright, a handful).**
- One journey: sign in as a seeded user → open billing → upgrade with Stripe's test card → see confirmation → confirmation email visible in the preview's captured inbox.
- Runs against the PR preview environment. Stable selectors (roles, labels, `data-testid` where necessary), no fixed sleeps (auto-waiting assertions), test data created via API per test.

**Keeping it fast and reliable.**
- PR pipeline: unit + component + integration in parallel (~5 minutes); E2E smoke (~5 minutes) on the preview.
- Larger E2E regression and third-party contract suites nightly.
- Flaky tests are quarantined with an owner and fixed, not retried forever.
- Time controlled with fake clocks; random ids seeded or asserted loosely.
- Coverage used as a guide for untested risky code, not a target."

#### Another worked example: a bug that only an integration test caught
"Unit tests for the 'invite member' service mocked the repository and passed. In production, inviting someone already invited threw a 500: the database's unique constraint `(org_id, email)` raised an error the service didn't map. An integration test with the real database (invite twice, expect 409 with `already_invited`) would have caught it immediately. That's why I put the bulk of backend tests at the integration level with a real database: mocks of your own data layer test your assumptions, not your system."

#### Step-by-step framework
1. **List risks** for the feature (logic, UI behaviour, data integrity, auth, integrations, journeys).
2. **Map each risk to the cheapest catching test**.
3. **Unit**: pure logic. **Component**: UI behaviour with MSW.
4. **Integration**: real HTTP + real DB; fake third parties at the boundary.
5. **Contract**: third-party assumptions and internal API compatibility.
6. **E2E**: a few critical journeys on a real deployment.
7. **Speed and reliability**: parallelism, isolation, no sleeps, quarantine policy.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "100% unit test coverage" | Risk-based mix with integration tests as the backbone |
| Mocks the database everywhere | Real Postgres in integration tests |
| Calls real Stripe in every PR test | Fakes on PRs, sandbox contract tests nightly |
| Dozens of slow E2E tests for every edge case | A few critical journeys; edge cases lower down |
| Tests implementation details (state, internals) | Tests behaviour via roles, labels, HTTP responses |
| Retries flaky tests forever | Quarantine, fix root causes |

#### Useful phrases
- "For each risk I pick the cheapest test that would catch it."
- "Backend tests run against a real database; third parties are faked at the boundary."
- "Component tests query by role and label, the way users and screen readers do."
- "E2E covers a few critical journeys, end to end on a real deployment."
- "Flaky tests are bugs; they get quarantined and fixed."

#### Common pitfalls
- **Over-mocking**, so tests pass while the system is broken.
- **Too many E2E tests**, slow and flaky.
- **Shared test data** causing order-dependent failures.
- **Testing implementation details**, making refactors painful.
- **No tests for error paths** (declines, conflicts, timeouts).

#### Follow-ups to expect (with sample answers)
- **"How do you test emails?"**
  "Unit-test rendering; integration-test that the job is enqueued; in E2E, read the captured inbox (Mailpit) to follow links like verification."
- **"How do you test time-based logic (trials expiring)?"**
  "Inject a clock; use fake timers in unit tests; in integration tests set timestamps directly in the database."
- **"What about visual regressions?"**
  "Snapshot screenshots of key components (Storybook + Chromatic or Playwright screenshots) with tolerant diffing, reviewed in PRs."
- **"How do you test accessibility?"**
  "axe checks in component and E2E tests, plus role-based queries, plus occasional manual screen reader passes."

#### What senior interviewers look for
- **Risk-based strategy** with clear reasoning.
- **Realistic boundaries** (real DB, faked third parties).
- **Reliability practices** for suites.
- **Pragmatism** about cost and speed.

#### Practise it
1. For a feature you've built, list its risks and map each to a test type.
2. Set up Testcontainers Postgres for API integration tests with per-test isolation.
3. Write one component test with MSW and one Playwright journey with a captured inbox.
4. Explain to a friend why mocking your own repository layer can give false confidence.
