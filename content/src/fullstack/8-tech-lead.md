# Full Stack Engineer — Architecture & Tech Leadership

## Owning a feature end to end as a full stack engineer
- id: fs-lead-01
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels: senior, staff
- tags: ownership, feature delivery, planning, scoping, product collaboration

### Prompt
You're given ownership of a significant feature (for example, "team workspaces with roles and invitations") from idea to launch. Walk through how you'd run it: discovery, design, breaking down work, building, launching and following up.

### Answer
#### What the interviewer is really testing
- **Ownership beyond code**: clarifying the problem, aligning stakeholders, managing scope and risk, launching and measuring.
- **Technical planning** across the stack: data model, API, UI, migrations, rollout.
- **Slicing work** into thin, shippable increments rather than a big-bang release.
- **Communication**: design docs, status updates, decision records, demos.
- **Follow-through**: metrics, bugs, documentation, clean-up.

#### Key points
- Start with the **problem and success metrics**, not the solution: who needs workspaces, why, and how we'll know it worked.
- Write a **short design doc / RFC**: goals, non-goals, user flows, data model, API, permissions, migration of existing data, rollout plan, risks, open questions. Review with product, design, backend/frontend peers, security.
- Identify **risky unknowns early** and spike them (e.g. migrating existing single-user data into workspaces).
- **Slice vertically**: each slice delivers end-to-end value behind a feature flag (create workspace → invite → roles → billing integration).
- **Plan the rollout**: flag, internal dogfooding, beta customers, gradual percentage, migration of existing users, docs and support readiness.
- **Communicate**: weekly updates with progress, risks and decisions; demos; ADRs for important decisions.
- **After launch**: metrics vs goals, bug triage, performance, clean up flags and dead code, retrospective.

#### Model answer
"I'd run it in five phases, keeping it shippable in small slices throughout.

**1. Discovery (week 1).**
- Meet the PM and designer: what problem are we solving? (Today accounts are single-user; teams share passwords to collaborate, which blocks larger customers.)
- Success metrics: % of paying accounts with 2+ members after 60 days; reduction in support tickets about shared logins; expansion revenue from seat-based billing.
- Constraints: launch before the Q1 sales push; must migrate ~40k existing accounts without disruption; SSO comes later (non-goal now).
- Talk to support and two customers if possible to validate assumptions.

**2. Design (week 1–2).**
A 3–5 page design doc:
- **User flows**: create workspace, invite by email, accept invite, switch workspace, change roles, remove member.
- **Data model**: `workspaces`, `memberships(workspace_id, user_id, role)`, `invitations(token_hash, email, role, expires_at)`; every existing resource gets `workspace_id`.
- **Permissions**: roles owner/admin/member with a permission catalogue; server-side checks plus RLS; UI hides actions users can't perform.
- **API**: endpoints for workspaces, members and invitations; `X-Workspace-Id` or path-based workspace scoping.
- **Migration**: create a personal workspace for each existing account and backfill `workspace_id` with expand–contract (nullable column → backfill in batches → enforce NOT NULL → switch queries).
- **Rollout**: feature flag per workspace; dogfood → beta → percentage.
- **Risks**: data leaks across workspaces (mitigated by RLS + tests), migration performance (spike first), invite abuse (rate limits).
I'd circulate it for comments, hold one review meeting, and record decisions as ADRs.

**3. Plan and slice (week 2).**
| Slice | Value | Notes |
|---|---|---|
| 0. Spike: backfill `workspace_id` on a production-size copy | De-risks migration | Measure duration |
| 1. Schema + personal workspaces for everyone (invisible) | Foundation | Expand migrations, backfill job |
| 2. Workspace switcher + create workspace | Internal dogfooding | Behind flag |
| 3. Invitations + accept flow | Core collaboration | Email templates, rate limits |
| 4. Roles and permissions UI | Admin control | RLS policies, tests |
| 5. Seat-based billing | Revenue | Billing provider integration |
| 6. Polish, docs, analytics, launch | Launch | Support training |
Each slice is a few PRs, merged to main behind the flag, demoable at the end of the week.

**4. Build (weeks 3–7).**
- I'd take the riskiest pieces myself (migration, permissions) and pair with others on the UI and invitations.
- Tests at the right levels: permission integration tests across workspaces, E2E for invite-accept.
- Weekly update to stakeholders: done, next, risks, decisions needed. Flag scope trade-offs early ('custom roles would add two weeks; propose post-launch').

**5. Launch and follow-up (weeks 8–10).**
- Dogfood internally for a week, then 10 beta customers with a feedback channel, then 10% → 50% → 100% while watching errors, performance and support tickets.
- Support has an FAQ and admin tooling (see a workspace's members, resend invites).
- After launch: dashboard for the success metrics; bug triage; remove the flag and dead code; retrospective with the team; a short write-up of what we learned."

#### Another worked example: handling a scope crisis mid-project
"Halfway through, sales promised a customer SAML SSO with the workspaces launch. Instead of silently absorbing it, I'd quantify it (3–4 weeks including testing with their identity provider), present options to the PM and sales lead: (a) delay launch, (b) launch workspaces on time and deliver SSO for that customer four weeks later via a beta flag, (c) cut seat-based billing from v1. We'd agree on (b), I'd document the decision, update the plan and timeline, and tell the team why. Ownership includes saying 'here's the cost' early, not just working weekends."

#### Step-by-step framework
1. **Problem and metrics** first.
2. **Design doc** with goals, non-goals, flows, model, API, migration, rollout, risks.
3. **Spike unknowns** early.
4. **Vertical slices** behind a flag; demo regularly.
5. **Communicate** weekly; surface trade-offs early.
6. **Progressive rollout** with support readiness.
7. **Measure, clean up, reflect**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Starts coding from the ticket | Clarifies problem and success metrics |
| No written design | Short design doc reviewed by stakeholders |
| Builds layer by layer (all backend, then all UI) | Vertical slices, each demoable |
| Big-bang launch | Flags, dogfooding, beta, gradual rollout |
| Absorbs scope changes silently | Quantifies and presents options |
| Done at merge | Metrics, clean-up and retrospective |

#### Useful phrases
- "Before designing, I want to know how we'll measure success."
- "I'd spike the migration first because it's the riskiest unknown."
- "Each slice ships end to end behind a flag, so we can demo every week."
- "Here's what that change costs and the options we have."
- "After launch I'd check the metrics and remove the flag and dead code."

#### Common pitfalls
- **Solution-first** thinking without understanding the problem.
- **Horizontal slicing**, delaying integration until the end.
- **Hidden risks** discovered late (migrations, permissions).
- **Poor communication**, surprising stakeholders with delays.
- **Never finishing**: flags and old code left forever.

#### Follow-ups to expect (with sample answers)
- **"How do you estimate?"**
  "Break into slices, estimate each in days with ranges, add buffer for unknowns, and re-estimate after spikes. Communicate ranges, not single dates."
- **"How do you involve other engineers?"**
  "Share the design early, let people own slices end to end, pair on risky parts, and keep a clear task board."
- **"What if metrics don't move after launch?"**
  "Investigate with product: discoverability, onboarding friction, wrong assumption about the problem. Run small experiments rather than declaring success."
- **"How do you handle security review?"**
  "Threat model during design, involve security for permissions and invitations, and include isolation tests as acceptance criteria."

#### What senior interviewers look for
- **Product-minded ownership** with clear metrics.
- **Risk-first planning** and thin slicing.
- **Proactive communication** and trade-off management.
- **Finishing well**.

#### Practise it
1. Write a two-page design doc for a feature you know, including a rollout plan and risks.
2. Slice a big feature into five vertical, demoable increments.
3. Draft a weekly status update with progress, risks and decisions needed.
4. Explain to a friend how you'd handle a late scope change.

## Splitting work between frontend and backend teams
- id: fs-lead-02
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels: senior, staff
- tags: team collaboration, API contracts, parallel development, mocking, coordination

### Prompt
Your organisation has separate frontend and backend teams, and features keep stalling: frontend waits for APIs, APIs don't match what the UI needs, and integration happens at the last minute. As a senior full stack engineer, how would you improve the way work is split and coordinated?

### Answer
#### What the interviewer is really testing
- Understanding the **root causes**: sequential handoffs, unclear contracts, misaligned priorities, team boundaries that don't match features.
- **Contract-first development** and tools that enable parallel work (OpenAPI/GraphQL schemas, mocks, generated types).
- **Process and structure changes**: shared planning, feature teams or pods, definition of done including integration.
- Using full stack skills as a **bridge**, not becoming the bottleneck.
- Measuring improvement.

#### Key points
- Handoffs fail when the **contract is decided late** or by one side. Make API design a **joint, early step** for each feature.
- **Contract-first**: agree the OpenAPI spec / GraphQL schema / tRPC procedures in a short session; commit it; generate types and **mock servers** (MSW, Prism) so frontend builds against the contract immediately.
- **Vertical slices with integration early**: integrate a thin end-to-end path in the first days, not at the end.
- **Shared planning**: both teams plan features together with a single owner per feature; avoid separate backlogs that drift.
- **Structural options**: feature teams/pods (frontend + backend + design per feature area), or a BFF owned by frontend, so screen-specific needs don't wait on core teams.
- **Definition of done** includes the feature working end to end in staging/preview.
- **Contract tests** in CI to catch drift.
- Track **lead time** and **integration defects** before and after.

#### Model answer
"The symptoms point to sequential work and late contracts. I'd fix the contract process first, then the planning and team structure.

**1. Diagnose with data.** Pick the last five features and map the timeline: when was the API agreed, when did frontend start, when did integration start, how many bugs were integration mismatches? Typically: API decided by backend alone, frontend starts after the API ships, integration in the final days, 30% of bugs are 'field missing / shape wrong'.

**2. Contract-first for every feature.**
- At the start of a feature, a **30–60 minute API design session** with the frontend and backend engineers (and designer if helpful): walk the screens, list the data each component needs and the actions, then write the contract together.
- The contract lives in the repo (OpenAPI YAML generated from Zod, a GraphQL schema, or tRPC router stubs) and is reviewed like code.
- From it, CI generates **TypeScript types** and a **mock server** (MSW handlers with realistic fixtures, or Prism from OpenAPI). Frontend builds the UI against mocks on day one; backend implements against the same contract.
- **Contract tests** verify the backend matches the spec (schema validation of responses in API tests; `oasdiff` for breaking changes).

**3. Integrate early.**
- First milestone of every feature: a **walking skeleton**, the thinnest end-to-end path (real endpoint returning real but minimal data, UI rendering it) deployed to a preview environment within the first few days.
- Subsequent slices add fields and behaviour; integration happens continuously.

**4. Plan together.**
- One backlog per product area, features with a single **feature owner** (often a full stack or senior engineer) accountable for end-to-end delivery.
- Sprint planning includes both disciplines; dependencies are explicit on the board.
- **Definition of done**: works end to end in staging, with tests, behind a flag if needed. 'Backend done' isn't done.

**5. Adjust structure where it helps.**
- For product areas with constant cross-team work, form **feature pods** (2 frontend, 2 backend, 1 designer, 1 PM) that own outcomes.
- Or introduce a **BFF owned by the frontend team** for screen composition, so frontend can shape responses without waiting on core services; backend teams own domain APIs and invariants.

**6. My role as a full stack engineer.** I'd facilitate the contract sessions, build the first walking skeleton for a pilot feature to demonstrate the approach, pair across the boundary, and write the lightweight guidelines. But I'd avoid becoming the person who does all integration work; the goal is a process that works without me.

**7. Measure.** After two months: lead time per feature, % of bugs from integration mismatches, and time frontend spends blocked. Share results and iterate."

#### Another worked example: a pilot that changed minds
"Sceptical backend engineers worried that contract-first meant 'frontend dictating the API'. For the pilot, the contract session started from domain resources (backend's strength) and then added the screen's specific needs (frontend's strength), resulting in a clean resource API plus one aggregate endpoint. Frontend built against MSW mocks for a week while backend implemented; integration took half a day instead of the usual week, with two minor fixes. Showing the result on a real feature was more convincing than any process document."

#### Step-by-step framework
1. **Diagnose** with timelines and bug categories.
2. **Contract-first sessions** per feature; contract in the repo.
3. **Generate types and mocks**; parallel development.
4. **Walking skeleton** in the first days; continuous integration.
5. **Joint planning**, feature owners, end-to-end definition of done.
6. **Structural changes** (pods, BFF) where friction persists.
7. **Measure and iterate**; avoid becoming the bottleneck.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Backend should ship APIs faster" | Fixes the sequential handoff and late contracts |
| Contract decided by one team | Joint contract session from the screens and domain |
| Frontend waits for real endpoints | Generated mocks and types from day one |
| Integration at the end | Walking skeleton in the first days |
| 'Done' per team | End-to-end definition of done |
| Becomes the integration hero | Builds a process that works without them |

#### Useful phrases
- "The problem isn't speed, it's that the contract is decided late and by one side."
- "We agree the API together, commit it, and generate mocks so both sides start on day one."
- "Integration happens in week one with a walking skeleton, not in the last week."
- "A feature is done when it works end to end, not when one layer is finished."
- "I'd pilot it on one feature and measure the difference."

#### Common pitfalls
- **Over-specified contracts** that freeze too early; allow revisions with review.
- **Mocks drifting** from reality (generate them from the contract; contract tests).
- **Process for its own sake**: heavy ceremonies for small features.
- **Ignoring team incentives** (separate roadmaps and priorities).
- **Full stack engineers as permanent glue**, burning out and hiding the problem.

#### Follow-ups to expect (with sample answers)
- **"What if teams are in different time zones?"**
  "Contracts and mocks matter even more; asynchronous design reviews on the spec PR, with recorded walkthroughs."
- **"GraphQL, REST or tRPC for this?"**
  "Any works with contract-first; GraphQL's schema-first style and tRPC's shared types make parallel work natural; OpenAPI suits separate repos and languages."
- **"How do you handle changes to the contract mid-feature?"**
  "Change it in a PR reviewed by both sides; regenerated types make affected code fail to compile, so nothing breaks silently."
- **"Should all engineers be full stack?"**
  "Not necessarily; specialists bring depth. What matters is shared ownership of outcomes and good interfaces between people."

#### What senior interviewers look for
- **Systems thinking** about process and organisation.
- **Concrete enabling tools** (contracts, mocks, generated types).
- **Influence without authority** and piloting.
- **Measurement** of improvement.

#### Practise it
1. Run a mock contract session for a feature: screens → data needs → OpenAPI or GraphQL schema.
2. Generate types and MSW handlers from the contract and build a UI against them.
3. Map the timeline of a recent feature and find where waiting happened.
4. Explain to a friend what a walking skeleton is and why it helps.

## Choosing a tech stack for a new product
- id: fs-lead-03
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels: senior, staff
- tags: tech stack, decision making, ADR, build vs buy, boring technology

### Prompt
You're the first senior engineer at a seed-stage startup building a B2B SaaS product. The founders ask you to choose the tech stack and core infrastructure. How do you decide, what would you pick, and how do you avoid painting the company into a corner?

### Answer
#### What the interviewer is really testing
- **Decision-making under uncertainty** with a bias for speed and simplicity.
- **"Boring technology"** judgement: spending innovation tokens only where they create advantage.
- **Build vs buy** for commodity capabilities (auth, payments, email, analytics, search).
- Considering **hiring, cost, security, compliance** and **reversibility**.
- **Documenting decisions** and revisiting them as the company grows.

#### Key points
- Optimise for **speed of iteration and a small team**: one language across the stack, managed services, minimal infrastructure.
- **Boring, proven choices** (Postgres, TypeScript, a mainstream framework) unless something novel is core to the product.
- **Buy commodity**: auth (including SSO later), payments, email, error tracking, analytics, feature flags. Build what differentiates.
- Consider **B2B needs early**: multi-tenancy, audit logs, SSO readiness, data residency, SOC 2 path.
- **Hiring pool** and team skills matter more than benchmarks.
- **Reversibility**: keep business logic in plain modules, data in Postgres, avoid deep coupling to a single vendor's proprietary features where it's cheap to avoid.
- Write **ADRs** and set **revisit triggers** (e.g. "re-evaluate hosting at $5k/month or when we need long-running jobs").

#### Model answer
"I'd optimise for one thing: how fast a team of two to six engineers can ship and learn for the next 18 months, without creating risks that are expensive to undo.

**Principles.**
1. One language end to end (TypeScript): shared types, easy hiring, everyone can work anywhere.
2. Postgres as the default for everything data-shaped (relational data, JSON, full-text search, queues, even vectors) until it hurts.
3. Managed services over self-hosting; no Kubernetes.
4. Buy commodity, build the product.
5. Decisions written down with revisit triggers.

**Proposed stack.**
| Area | Choice | Why |
|---|---|---|
| Language | TypeScript | One language, shared types, large hiring pool |
| Web app | Next.js (or React Router 7) | Mainstream, SSR when needed, big ecosystem |
| API | Route handlers / tRPC inside the app; OpenAPI later for public API | Fast for one web client; public API when customers need it |
| Database | Managed Postgres (e.g. Neon, Supabase, RDS) with branching for previews | Proven, flexible, RLS for tenancy |
| ORM / queries | Drizzle or Kysely (typed SQL) | Predictable queries, easy raw SQL |
| Auth | Managed auth with SSO/SAML path (WorkOS, Clerk, Auth0, Supabase Auth) | B2B customers will ask for SSO and SCIM |
| Background jobs | Postgres-backed queue (pg-boss/Graphile Worker) or Inngest | Transactional enqueue, no extra infra |
| Hosting | Vercel or Render/Fly/Cloud Run containers | Low ops; previews per PR |
| Payments | Stripe Billing | Subscriptions, invoices, tax |
| Email | Resend/Postmark | Deliverability handled |
| Observability | Sentry + OpenTelemetry to a hosted backend | Errors and traces from day one |
| Analytics & flags | PostHog (or similar) | Product analytics, flags, experiments in one tool |
| CI/CD | GitHub Actions | Standard |

**B2B considerations from day one** (cheap now, expensive later):
- **Multi-tenancy**: `org_id` on every table, RLS policies, tenant-scoped caches and storage paths.
- **Audit log** table written in the same transaction as important changes.
- **SSO-ready auth provider**, so the first enterprise deal doesn't trigger an auth rewrite.
- **Security basics** toward SOC 2: SSO for internal tools, least-privilege access, backups with tested restores, dependency scanning.

**Avoiding corners.**
- Business logic in plain modules (`/domain`), not inside framework-specific files; route handlers and server actions are thin.
- Data in standard Postgres; vendor features used where they save real time, with a note on the exit path.
- Infrastructure defined as code where possible; environment config validated and documented.
- **ADRs** for each major choice, each with a **revisit trigger**: 'Revisit hosting when monthly cost exceeds $5k or we need long-running workers'; 'Revisit search when Postgres FTS relevance or latency becomes a support issue'; 'Introduce a separate API service if we add a mobile app or public API'.

**What I'd avoid at this stage:** microservices, Kubernetes, multiple languages, custom auth, self-hosted Kafka/Elasticsearch, and any technology only I know."

#### Another worked example: when to spend an 'innovation token'
"If the product's core value were real-time collaborative editing (like Figma for contracts), I'd spend innovation on that: a CRDT library (Yjs) with a sync server, or a specialised service, because it's what customers pay for and what differentiates us. Everything around it would stay boring. The rule: novel technology only where it's the product."

#### Step-by-step framework
1. **Clarify product needs**: B2B/B2C, real-time, data sensitivity, integrations, scale horizon.
2. **Assess the team**: skills, hiring plans.
3. **Set principles**: one language, boring defaults, managed services, buy commodity.
4. **Choose per area** with reasons.
5. **Include B2B foundations** (tenancy, audit, SSO readiness, security).
6. **Design for reversibility**.
7. **Document ADRs** with revisit triggers.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Picks favourite new technologies | Boring defaults; innovation only where it differentiates |
| Builds auth, billing and email in-house | Buys commodity services |
| Microservices and Kubernetes at seed stage | Modular monolith on managed hosting |
| Ignores B2B needs | Tenancy, audit, SSO readiness early |
| No documentation | ADRs with revisit triggers |
| Locks logic into vendor-specific APIs everywhere | Thin adapters, standard Postgres |

#### Useful phrases
- "I'm optimising for how fast a small team can ship for the next 18 months."
- "Postgres is the default until it hurts."
- "We buy commodity capabilities and build what makes us different."
- "Some B2B foundations are cheap now and very expensive later: tenancy, audit, SSO."
- "Each decision has a written revisit trigger."

#### Common pitfalls
- **Résumé-driven choices.**
- **Premature scaling architecture.**
- **Ignoring enterprise requirements** until a big deal depends on them.
- **Vendor sprawl** with overlapping tools and bills.
- **Undocumented decisions** that later engineers can't evaluate.

#### Follow-ups to expect (with sample answers)
- **"Why not Rails or Django?"**
  "They're excellent and might be faster for CRUD-heavy apps. I'd choose them if the team knows them; TypeScript wins here because of one-language hiring and a rich interactive front end."
- **"How do you control vendor costs?"**
  "Review SaaS spend quarterly, prefer usage-based tiers early, and know the exit cost of each vendor."
- **"When do you add a separate backend service?"**
  "When there's a second client (mobile, public API), a different scaling profile, or a team boundary that justifies it."
- **"What about AI features?"**
  "Call model APIs from the server through a thin internal client with logging, caching, cost caps and evaluation, so we can switch models or providers."

#### What senior interviewers look for
- **Pragmatism and speed** with eyes on risk.
- **Clear reasoning** per decision.
- **B2B awareness**.
- **Reversibility and documentation**.

#### Practise it
1. Write an ADR for one stack choice with alternatives, decision, consequences and a revisit trigger.
2. List which capabilities you'd buy vs build for a product you know, with monthly cost estimates.
3. Set up a skeleton app with tenancy (`org_id` + RLS) and an audit log table.
4. Explain 'innovation tokens' to a friend.

## Generalist vs specialist: staying deep enough on both sides
- id: fs-lead-04
- round: ARCHITECTURE_TECH_LEAD
- difficulty: easy
- levels: senior, staff
- tags: career, learning, T-shaped, full stack, depth vs breadth

### Prompt
"Full stack engineers are jacks of all trades, masters of none." How do you respond, and how do you personally stay deep enough on both frontend and backend to be effective at a senior level?

### Answer
#### What the interviewer is really testing
- **Self-awareness** about strengths and gaps.
- A credible **learning system**, not "I read Hacker News".
- Understanding the **value of full stack engineers** (end-to-end ownership, fewer handoffs, seeing seams) and their limits.
- Knowing **when to bring in specialists** and how to collaborate with them.
- Communication: a confident, non-defensive answer with concrete examples.

#### Key points
- Aim to be **T-shaped** (or comb-shaped): broad competence across the stack plus real depth in one or two areas.
- Full stack value is in the **seams**: API contracts, data flow, performance across layers, auth end to end, shipping features without handoffs.
- **Depth** means being able to debug and design in an area without hand-holding: e.g. Postgres query plans and locking, or browser rendering and accessibility.
- **Learning system**: deliberate projects, reading primary sources (specs, docs, RFCs), teaching/writing, code review exposure, incident retrospectives.
- **Know your edges**: bring in specialists for deep accessibility audits, database tuning at scale, security reviews; collaborate rather than bluff.
- Use **concrete examples** of depth on each side.

#### Model answer
"I'd agree there's a risk, and I manage it deliberately. My aim is to be T-shaped: comfortable across the whole stack, with genuine depth in two areas, and honest about where I'd bring in a specialist.

**Why full stack is valuable.** Many of the hardest problems live in the seams: an API shape that causes UI waterfalls, an auth flow spanning cookies, CORS and database policies, a slow page that's half bundle size and half a missing index. Someone who can follow a problem through every layer finds root causes quickly and ships features without handoffs. On small teams that's a multiplier.

**Where I'm deep.** For example:
- **Data and Postgres**: I read query plans, design indexes, know locking behaviour for migrations, and have run zero-downtime migrations on large tables.
- **Frontend performance and accessibility**: I profile with DevTools, fix INP and LCP problems, and build accessible components following WAI-ARIA patterns.
I keep these sharp by working on hard problems in them, not just reading.

**Where I'm competent but would consult.** Deep security reviews, large-scale infrastructure (Kubernetes internals, network design), and expert accessibility audits with assistive technology users. I know enough to spot problems and ask good questions, and I involve specialists for sign-off.

**My learning system.**
1. **Rotate depth projects**: each quarter I pick one area to go deeper (last quarter: Postgres internals; this quarter: React Server Components and streaming) with a concrete output, such as a small project, an internal talk or a write-up.
2. **Primary sources**: specs (HTML, ECMAScript proposals, HTTP RFCs), official docs and release notes, rather than only blog summaries.
3. **Learn from production**: incident retrospectives and performance investigations teach more than tutorials.
4. **Teach**: explaining something in a design review or a lunch talk reveals gaps quickly.
5. **Code review across the stack**: I review both frontend and backend PRs, and ask specialists to review mine in their areas.
6. **Small experiments** with new tools in side projects before proposing them at work.

**How I'd answer the sceptic in a team.** By results: features shipped end to end, bugs found at layer boundaries, and good collaboration with specialists rather than replacing them."

#### Another worked example: knowing when to call a specialist
"We had intermittent lock timeouts in Postgres during peak traffic. I investigated as far as I could: identified the queries involved, saw that a migration and a long-running report overlapped, and proposed fixes. But the root cause involved autovacuum behaviour and replication settings I hadn't worked with deeply, so I brought in our database specialist for an hour. Together we fixed the configuration, and I wrote up what I learned. Being full stack doesn't mean solving everything alone; it means knowing which questions to ask and who to ask."

#### Step-by-step framework
1. **Acknowledge** the risk honestly.
2. **Explain the value** of full stack in the seams.
3. **Show depth** with concrete examples on both sides.
4. **Name edges** where you'd consult specialists.
5. **Describe a learning system** with outputs.
6. **Give an example** of collaboration with a specialist.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'm equally expert at everything" | T-shaped, with named depth and named edges |
| Defensive tone | Acknowledges the risk calmly |
| "I read blogs" | Structured learning with outputs |
| No examples | Concrete depth examples on each side |
| Bluffs in unfamiliar areas | Brings in specialists and learns from them |
| Ignores the value of seams | Explains end-to-end problem solving |

#### Useful phrases
- "There's a real risk, and I manage it deliberately."
- "I aim to be T-shaped: broad across the stack, deep in two areas."
- "The hardest problems are often at the seams between layers."
- "Here's where I'd bring in a specialist, and how I learn from them."
- "Each quarter I pick one area to go deeper, with something concrete to show for it."

#### Common pitfalls
- **Claiming expertise everywhere**, which interviewers probe and expose.
- **Being vague** about learning habits.
- **Dismissing specialists**.
- **Not having current examples** (only old projects).
- **Undervaluing your strengths** out of modesty.

#### Follow-ups to expect (with sample answers)
- **"Which side are you stronger on?"**
  "Be honest and specific: 'Slightly stronger on backend and data; on frontend I'm strong in performance and accessibility, less in advanced animation.'"
- **"What did you learn recently, in depth?"**
  "Pick one topic and explain something non-trivial, such as how streaming SSR flushes Suspense boundaries, or how Postgres decides between index and sequential scans."
- **"How do you keep up without burning out?"**
  "Focus on depth in one area at a time, learn mostly through work problems, and ignore hype until something has proven value."
- **"Would you want to specialise later?"**
  "Possibly towards architecture or a domain, but the end-to-end perspective is something I'd keep."

#### What senior interviewers look for
- **Honesty and self-awareness**.
- **Concrete depth** demonstrated on the spot.
- **Sustainable learning habits**.
- **Collaboration** with specialists.

#### Practise it
1. Write down your two depth areas and three things in each you could explain on a whiteboard.
2. Pick one weaker area and plan a 6-week depth project with a concrete output.
3. Prepare one story about a bug you found at a layer boundary.
4. Practise answering the 'jack of all trades' challenge in under two minutes.

## Leading a rewrite or framework migration
- id: fs-lead-05
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels: staff
- tags: migration, rewrite, strangler fig, incremental migration, risk management, leadership

### Prompt
Your company's frontend is a large AngularJS (or old Create React App / jQuery) app with a legacy Node API, and leadership wants to "rewrite it in Next.js". As the staff engineer leading this, how do you decide whether and how to do it, and how do you run the migration without stopping feature work?

### Answer
#### What the interviewer is really testing
- **Scepticism about big-bang rewrites** and the ability to build a business case.
- **Incremental migration strategies**: strangler fig, route-by-route, component islands, shared design systems, API facades.
- **Risk management**: parity, regressions, SEO, performance, user disruption, team morale.
- **Organisational leadership**: aligning leadership, product and engineers; keeping feature delivery going; measuring progress.
- **Knowing when to stop**: finishing the migration and deleting the old system.

#### Key points
- Start with **why**: what concrete problems (hiring, security/EOL, performance, developer velocity, inability to build needed features) does the migration solve, and how will we measure success?
- Avoid **big-bang rewrites**: they freeze features, chase a moving target, and often fail. Prefer **incremental migration** with production traffic throughout.
- **Strangler fig at the routing layer**: a proxy/edge routes some paths to the new app and the rest to the old one; migrate route by route.
- **Shared foundations first**: design tokens/component library usable by both, shared auth/session, shared API client, analytics parity.
- **API**: introduce a facade or BFF so the new frontend isn't coupled to legacy API quirks; migrate backend endpoints separately.
- **Prioritise routes** by value and risk: start with a low-risk, high-learning page; then high-traffic or high-change areas.
- **Parity and quality gates**: E2E tests per route, analytics comparison, performance budgets, SEO checks (redirects, meta, structured data).
- **Rule**: new features are built in the new stack; bug fixes in old code are allowed; no new features in old code after a date.
- **Track progress publicly** (% of routes/traffic migrated) and **plan the decommission**.

#### Model answer
"I'd first make sure we're solving a real problem, then migrate incrementally so we ship value every month and never bet the company on a cutover date.

**1. Build the case (2–3 weeks).**
- Interview engineers, product and support; gather data: AngularJS is end-of-life (security and browser support risk), hiring is hard, build times are 6 minutes, LCP p75 is 4.8 s on key pages, and adding features in some areas takes 2–3× longer than estimates.
- Define goals and metrics: no EOL dependencies, LCP p75 < 2.5 s on top pages, lead time per feature down 30%, developer satisfaction up.
- Estimate options: (a) big-bang rewrite: 12–18 months with a feature freeze, high risk; (b) incremental strangler: 12–24 months, features continue, risk spread out; (c) partial: migrate only the highest-value areas. Recommend (b) with explicit checkpoints, and get leadership agreement on investment (e.g. 30% of frontend capacity).

**2. Foundations (first 6–8 weeks).**
- New Next.js app in the monorepo, deployed behind the same domain.
- **Routing layer**: an edge/proxy config routes `/settings/*` (first) to the new app and everything else to the legacy app. Both apps share the **session cookie** and auth middleware, so users don't notice.
- **Design system**: design tokens and a small component library. The old app gets the same CSS tokens so pages look consistent as users move between old and new.
- **Shared API client and types** generated from an OpenAPI spec of the existing API; a thin BFF/facade in the new app smooths legacy quirks.
- Analytics, error tracking, feature flags and i18n wired identically in both apps.
- CI: E2E tests that run across both apps; performance budgets for new routes.

**3. Migrate route by route.**
- **First route**: settings pages, low risk with real traffic, to prove the pipeline (auth, routing, design system, deploys).
- Then prioritise by **value × change frequency**: areas where most feature work happens (so new features land in the new stack), and top-traffic pages for performance wins (with SEO checks: same URLs, meta tags, structured data, canonical tags, redirects).
- For each route: parity checklist, E2E tests ported or written, analytics events compared, flag-based rollout (5% → 100%) with error and conversion monitoring, then delete the old route's code.
- **Islands** where a full route is too big: mount new React components inside old pages via a small bridge, as a stepping stone.

**4. Rules that keep it moving.**
- From a set date, **all new features are built in the new app**; old code only gets bug fixes.
- Each team owns migrating its areas, with a shared migration guild for patterns and help.
- A public dashboard shows % of routes and % of traffic served by the new app, plus the metrics we promised.

**5. Backend.** The legacy Node API is migrated separately and incrementally: new endpoints written cleanly behind the facade, old endpoints refactored or replaced when touched, database untouched unless needed. Frontend and backend migrations aren't coupled.

**6. Finish.** Plan the last 10% explicitly (it's always the hardest: admin pages, rarely used flows). Set a decommission date, migrate or delete remaining pages (some features turn out to be unused; analytics tells us), remove the routing split, delete the legacy app, and celebrate. Retrospective and write-up for the organisation."

#### Another worked example: a rewrite that failed and the lesson
"A previous company attempted a big-bang rewrite of its customer portal: a separate team rebuilt it for 14 months while the old app kept getting features. The new app was always behind, the cutover date slipped three times, and launch day brought dozens of regressions in edge cases nobody had documented. Leadership cancelled it, and the team that built it left. Those edge cases lived in old code as business rules. Incremental migration with production traffic surfaces them one route at a time, when they're cheap to fix."

#### Step-by-step framework
1. **Business case**: problems, metrics, options, recommendation, investment.
2. **Foundations**: routing split, shared auth, design system, API client, observability.
3. **First low-risk route** to prove the path.
4. **Prioritise** by value, change frequency and traffic.
5. **Per-route quality gates**: parity, E2E, analytics, SEO, performance, flags.
6. **Rules**: new features in the new stack; ownership per team.
7. **Track progress** publicly; keep backend migration decoupled.
8. **Finish and decommission**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Let's rewrite everything in Next.js" | Business case with measurable goals and options |
| Feature freeze for a year | Incremental migration; features continue |
| Big-bang cutover | Strangler fig routing, route by route |
| New app looks different, separate login | Shared session, design tokens, analytics parity |
| No quality gates | Parity checklists, E2E, SEO and performance checks per route |
| Migration never finishes | Rules, dashboard, decommission plan |

#### Useful phrases
- "First, what problem are we solving and how will we know it's solved?"
- "I'd migrate route by route behind a routing layer, with real traffic throughout."
- "New features go into the new stack from day X; old code only gets fixes."
- "Each route has a parity checklist and flag-based rollout."
- "The last 10% needs its own plan, or we'll run two apps forever."

#### Common pitfalls
- **Big-bang rewrites** chasing a moving target.
- **Undocumented business rules** lost in translation.
- **Inconsistent UX** between old and new parts.
- **SEO regressions** from URL or meta changes.
- **Never decommissioning**, doubling maintenance costs permanently.

#### Follow-ups to expect (with sample answers)
- **"How do you keep morale up during a long migration?"**
  "Visible progress, shared ownership, celebrating milestones, and letting engineers work on new features in the new stack rather than only porting."
- **"How do you handle shared state between old and new apps?"**
  "Keep shared state on the server (session, preferences) and URLs; avoid client-side shared stores across apps."
- **"What if leadership wants a date?"**
  "Give ranges per phase with checkpoints, and commit to measurable intermediate outcomes (e.g. top five pages migrated by Q2)."
- **"Would you use micro-frontends?"**
  "Only as a transitional tool (route-level split) or if team autonomy really needs it long-term; I'd avoid a permanent runtime composition layer unless justified."

#### What senior interviewers look for
- **Business-first reasoning** and risk awareness.
- **Concrete incremental techniques**.
- **Organisational leadership** across teams and leadership.
- **Commitment to finishing**.

#### Practise it
1. Write a one-page migration proposal with problems, metrics, options and a phased plan.
2. Set up a proxy that routes one path to a new app and the rest to an old one, sharing a session cookie.
3. Create a per-route parity checklist (functionality, analytics, SEO, accessibility, performance).
4. Explain the strangler fig pattern to a friend with a real example.
