# Full Stack Engineer question catalogue

The full list of Full Stack Engineer interview questions to cover, by round.
`[x]` = written in the long format (see content/README.md) and loaded.
Levels: questions marked (senior) or (staff) are tagged for those levels;
everything else applies to all levels (mid, senior, staff).

The Full Stack bank also includes every frontend question (roles frontend,
fullstack) and 49 backend questions tagged `roles: backend, fullstack`
(system design basics, all of API design, core databases, auth, ops and
testing). This catalogue lists only the new `fs-*` questions, which cover
the end-to-end seams neither bank owns.

## Full Stack System Design (`1-system-design.md`, …)
- [x] How a full stack system design interview differs from a backend one (fs-design-01)
- [x] Design a collaborative to-do / project board, end to end (fs-design-02)
- [x] Design a SaaS analytics dashboard, end to end (fs-design-03)
- [x] Design a real-time comments and presence feature (fs-design-04)
- [x] Design an image upload, processing and gallery feature (fs-design-05)
- [x] Design an online marketplace listing and search experience (fs-design-06)
- [x] Design a booking / scheduling app like Calendly (fs-design-07)
- [x] Design an offline-first mobile/web notes app with sync (fs-design-08) (senior)
- [x] Design a multi-tenant B2B SaaS admin portal (fs-design-09) (senior)
- [x] Design a live polling / quiz app for 100k concurrent users (fs-design-10)
- [x] Design a CMS-driven marketing site with previews (fs-design-11)
- [x] Design an AI-powered document Q&A product, end to end (fs-design-12) (senior)

## Full Stack Feature Build (`2-feature-build.md`, …)
- [x] Build a paginated, filterable list: API plus UI (fs-build-01)
- [x] Build a signup and login flow end to end (fs-build-02)
- [x] Build a file upload with presigned URLs and progress (fs-build-03)
- [x] Build a search-as-you-type endpoint and UI (fs-build-04)
- [x] Build a form with server-side validation and good error UX (fs-build-05)
- [x] Build a shopping cart that survives refresh and login (fs-build-06)
- [x] Build a notifications inbox with unread counts (fs-build-07)
- [x] Build a CSV import with progress and error report (fs-build-08)
- [x] Build an optimistic "like" button backed by an API (fs-build-09)
- [x] Build a Stripe-style checkout with webhooks (fs-build-10) (senior)

## Full Stack Architecture (`3-architecture.md`, …)
- [x] Rendering strategies: CSR, SSR, SSG, ISR and streaming (fs-arch-01)
- [x] React Server Components and server actions (fs-arch-02)
- [x] Choosing a full stack framework: Next.js, Remix, SvelteKit, Rails (fs-arch-03)
- [x] End-to-end type safety: shared types, tRPC, OpenAPI codegen (fs-arch-04)
- [x] Monolith, modular monolith or microservices for a product team (fs-arch-05)
- [x] Caching across the stack: browser, CDN, server, database (fs-arch-06)
- [x] Serverless vs containers vs a long-running server (fs-arch-07)
- [x] Edge computing and edge functions: when they help (fs-arch-08)
- [x] Real-time architecture: WebSockets at scale, pub/sub fan-out (fs-arch-09)
- [x] Background jobs and queues in a web app (fs-arch-10)
- [x] Feature flags and progressive delivery across client and server (fs-arch-11)
- [x] Designing for offline and flaky networks end to end (fs-arch-12) (senior)

## Auth & Security (`4-auth-security.md`)
- [x] Sessions vs tokens: designing auth for a web app (fs-sec-01)
- [x] OAuth 2.0 / OIDC login with Google: the full flow (fs-sec-02)
- [x] Passwordless and passkeys (WebAuthn) (fs-sec-03)
- [x] Row-level security and multi-tenant data isolation (fs-sec-04)
- [x] Protecting an API used by your own SPA: CORS, CSRF, rate limits (fs-sec-05)
- [x] Secure file uploads end to end (fs-sec-06)
- [x] Handling secrets in frontend builds and serverless functions (fs-sec-07)
- [x] Threat modelling a new feature (fs-sec-08) (senior)

## Data & APIs (`5-data-apis.md`)
- [x] Designing a data model from a product spec (fs-data-01)
- [x] ORMs vs query builders vs raw SQL (fs-data-02)
- [x] Schema migrations without downtime (fs-data-03)
- [x] Solving N+1 queries from UI to database (fs-data-04)
- [x] GraphQL in a full stack app: schema, resolvers, dataloaders (fs-data-05)
- [x] Full-text search: Postgres vs Elasticsearch vs a hosted service (fs-data-06)
- [x] Data fetching contracts: what the UI needs vs what the API returns (fs-data-07)

## Delivery & Operations (`6-delivery-ops.md`)
- [x] CI/CD for a full stack app (fs-ops-01)
- [x] Preview environments per pull request (fs-ops-02)
- [x] Observability end to end: RUM, traces, logs (fs-ops-03)
- [x] Debugging a slow page: frontend or backend? (fs-ops-04)
- [x] Deploying frontend and backend changes safely together (fs-ops-05)
- [x] Environment configuration and twelve-factor apps (fs-ops-06)
- [x] Cost awareness: hosting, database and third-party bills (fs-ops-07) (senior)
- [x] Testing a full stack feature: what goes where (fs-ops-08)

## Code Review & Debugging (`7-code-review.md`)
- [x] Review this full stack pull request (API + UI diff) (fs-review-01)
- [x] A bug only happens in production: trace it across the stack (fs-review-02)
- [x] Data looks wrong in the UI: frontend, API or database? (fs-review-03)
- [x] Race conditions between UI and server state (fs-review-04)
- [x] Reviewing a database migration (fs-review-05)

## Architecture & Tech Leadership (`8-tech-lead.md`) — senior / staff
- [x] Owning a feature end to end as a full stack engineer (fs-lead-01) (senior)
- [x] Splitting work between frontend and backend teams (fs-lead-02) (senior)
- [x] Choosing a tech stack for a new product (fs-lead-03) (senior)
- [x] Generalist vs specialist: staying deep enough on both sides (fs-lead-04) (senior)
- [x] Leading a rewrite or framework migration (fs-lead-05) (staff)

## Behavioural (`9-behavioural.md`)
- [x] Why full stack? Walk me through your career (fs-behavioural-01)
- [x] A feature you shipped end to end (fs-behavioural-02)
- [x] A time you worked outside your comfort zone in the stack (fs-behavioural-03)
- [x] Balancing speed and quality on a small team (fs-behavioural-04)
- [x] A time you simplified an over-engineered system (fs-behavioural-05)
- [x] Working with designers and product managers (fs-behavioural-06)
- [x] A production issue you debugged across the stack (fs-behavioural-07)
- [x] Questions to ask your interviewer (full stack edition) (fs-behavioural-08)
