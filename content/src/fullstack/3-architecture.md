# Full Stack Engineer — Architecture

## Rendering strategies: CSR, SSR, SSG, ISR and streaming
- id: fs-arch-01
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: rendering, SSR, SSG, ISR, CSR, streaming, hydration, SEO

### Prompt
Explain client-side rendering, server-side rendering, static generation, incremental static regeneration and streaming SSR. How do you choose between them for different pages of the same product?

### Answer
#### What the interviewer is really testing
- That you understand **where and when HTML is produced**, and what that means for performance, SEO, freshness, cost and complexity.
- Knowing the **hydration cost**: SSR improves first paint but not necessarily interactivity.
- Choosing **per page or per component**, not one strategy for the whole app.
- Awareness of **caching**: static and ISR pages live on a CDN; SSR responses may or may not be cacheable.
- Familiarity with how frameworks (Next.js, Remix, Nuxt, SvelteKit, Astro) express these choices.

#### Key points
- **CSR**: the server sends a near-empty HTML shell and JS; the browser fetches data and renders. Cheap to host, great for app-like logged-in pages, poor for SEO and first contentful paint on slow devices.
- **SSR**: HTML is rendered per request on the server with fresh data, then **hydrated** in the browser. Good SEO and first paint; costs server time per request; TTFB depends on the slowest data fetch.
- **SSG**: HTML is rendered **at build time** and served from a CDN. Fastest and cheapest; data is as old as the last build.
- **ISR / revalidation**: static pages regenerated **in the background** after a time window or **on demand** (webhook). Static speed with bounded staleness.
- **Streaming SSR**: the server sends HTML in chunks (`<Suspense>` boundaries), so the shell and fast parts arrive immediately and slow parts stream in. Improves TTFB and perceived speed.
- **Partial hydration / islands / Server Components**: only interactive parts ship JS. Reduces the hydration cost of SSR/SSG.
- Choose by: **does it need SEO? how fresh must the data be? is it personalised? how interactive is it?**

#### Model answer
"The real question is *when* and *where* HTML gets built, and each answer trades freshness against speed and cost.

| Strategy | HTML built | Freshness | First paint | SEO | Server cost |
|---|---|---|---|---|---|
| CSR | In the browser | Live | Slow (JS + fetch first) | Weak | Very low |
| SSR | Per request on the server | Live | Fast, but TTFB waits for data | Strong | Per request |
| Streaming SSR | Per request, in chunks | Live | Fast shell, slow parts stream | Strong | Per request |
| SSG | At build time | As of the last build | Fastest (CDN) | Strong | Near zero |
| ISR | At build + background regeneration | Bounded staleness | Fastest (CDN) | Strong | Low |

I choose per page. For an e-commerce product:
- **Marketing and blog pages** → **SSG**, with on-demand revalidation when the CMS publishes.
- **Product pages** (thousands of them, SEO critical, prices change sometimes) → **ISR** with ~60-second revalidation plus on-demand revalidation when a price or stock changes. Stock-level badges that must be live can be fetched client-side or streamed.
- **Search results** (infinite filter combinations, SEO for key categories) → **SSR** for the first load, cacheable at the CDN for 30 seconds for anonymous users; client-side updates after that.
- **Checkout and account pages** (personalised, no SEO) → **CSR or SSR without caching**. SSR gives a faster first paint, but CSR is fine and simpler if the app shell is light.
- **Dashboard** (logged-in, highly interactive) → **CSR** or SSR with streaming so the layout appears instantly and slow widgets stream in.

**Hydration matters.** SSR shows content early, but the page isn't interactive until JS has downloaded and React has hydrated. A heavy bundle gives you a page that looks ready and ignores clicks (poor INP). So SSR should come with code splitting and, ideally, **Server Components or islands** so static parts never hydrate.

**Streaming** solves SSR's 'slowest query blocks everything' problem:
```tsx
export default function ProductPage({ params }) {
  return (
    <>
      <ProductHeader id={params.id} />              {/* fast, from cache */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews id={params.id} />                  {/* slow service, streams in later */}
      </Suspense>
    </>
  );
}
```
The browser gets the header and skeleton in the first chunk; reviews arrive in a later chunk of the same response, without a client-side fetch.

**Caching per strategy.** SSG/ISR output is immutable per version and sits on the CDN. SSR responses can be cached at the CDN only if they're not personalised (`Cache-Control: public, s-maxage=30, stale-while-revalidate=300`); personalised SSR must be `private` and often is the expensive path, so I keep personalisation in small client-side or streamed islands where possible."

#### Another worked example: a news site on election night
"Article pages are SSG/ISR because they're read by millions and change rarely. The live results page needs updates every few seconds for millions of readers. SSR per request would melt the servers, so I'd render it with ISR at a **5-second revalidate** (one regeneration every 5 seconds regardless of traffic, everyone else gets the CDN copy), plus a small client island that polls a cached JSON endpoint every 10 seconds to update numbers without a reload. The CDN absorbs the traffic; the origin sees a handful of requests per second."

#### Step-by-step framework
1. For each page ask: **SEO needed? Personalised? Freshness requirement? Interactivity? Traffic?**
2. Not personalised + rarely changes → **SSG**.
3. Not personalised + changes sometimes / many pages → **ISR** (time + on-demand).
4. Needs request-time data (personalised or must be live) and SEO/first paint → **SSR**, streamed, with caching where possible.
5. Logged-in, interactive, no SEO → **CSR** (or light SSR shell).
6. Minimise hydration: **Server Components / islands**, code splitting.
7. Set **cache headers** to match.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "SSR is better for performance" | Explains TTFB, hydration and when SSR can be slower |
| One strategy for the whole app | Chooses per page, even per component |
| Ignores caching | Matches each strategy to CDN caching rules |
| SSR blocked by the slowest query | Streaming with Suspense boundaries |
| Personalised data baked into cached pages | Personalisation in client/streamed islands |
| No mention of hydration cost | Server Components / islands to reduce JS |

#### Useful phrases
- "The question is when and where the HTML is built."
- "I'd choose per page: static for marketing, ISR for product pages, CSR for the dashboard."
- "SSR helps first paint but hydration still costs; I'd keep client JS small."
- "Streaming lets the fast parts arrive while slow parts load."
- "Personalised bits go in small islands so the page itself stays cacheable."

#### Common pitfalls
- **Caching personalised SSR** at the CDN and showing one user's data to another.
- **Huge hydration bundles** that make SSR pages unresponsive.
- **Hydration mismatches** from rendering time- or locale-dependent values differently on server and client.
- **Rebuilding the whole site** for every content change instead of ISR/on-demand revalidation.
- **Assuming CSR can't do SEO at all**: Google renders JS, but slowly and less reliably; other crawlers and link previews often don't.

#### Follow-ups to expect (with sample answers)
- **"What causes hydration mismatch errors?"**
  "The server HTML differs from the first client render: `Date.now()`, random ids, `window` checks, locale formatting. Fix by rendering stable values on the server and updating after mount, or using `useId`."
- **"Is SSR more expensive to run?"**
  "Yes, every request does rendering work, and serverless cold starts add latency. Caching anonymous responses and streaming help."
- **"How does Astro differ from Next.js here?"**
  "Astro defaults to zero JS and hydrates only explicitly marked islands; it suits content sites. Next.js uses React Server Components to get a similar effect inside a React app."
- **"How would you measure which is better?"**
  "Field data (Core Web Vitals from real users: LCP, INP, CLS), TTFB, server cost and cache hit rate, compared per page type."

#### What senior interviewers look for
- **Trade-off reasoning** grounded in metrics (TTFB, LCP, INP).
- **Per-page decisions** tied to business needs (SEO, freshness).
- Awareness of **hydration and caching** pitfalls.
- Knowing the **modern tools** (streaming, Server Components, islands) and when they matter.

#### Practise it
1. Build one page four ways (CSR, SSR, SSG, ISR) in Next.js and compare TTFB and LCP with throttling.
2. Add a slow component behind `Suspense` and watch the streamed chunks in DevTools.
3. Trigger a hydration mismatch deliberately, then fix it.
4. Explain to a friend which strategy you'd use for five pages of an online shop.

## React Server Components and server actions
- id: fs-arch-02
- round: FULLSTACK_ARCHITECTURE
- difficulty: hard
- levels:
- tags: React Server Components, server actions, Next.js, App Router, data fetching

### Prompt
What are React Server Components and server actions? How do they change how you build a full stack React app, and what are their trade-offs and pitfalls?

### Answer
#### What the interviewer is really testing
- A clear mental model: **Server Components run only on the server** and send a serialised description of UI (not JS) to the client; **Client Components** hydrate and handle interactivity.
- How data fetching moves **into components** on the server, and why that removes many API endpoints and client-side waterfalls.
- **Server actions** as typed RPC from client to server for mutations, with progressive enhancement.
- The **boundary rules**: what can cross from server to client, `"use client"`, serialisable props.
- Trade-offs: caching complexity, security of exposed actions, framework lock-in, debugging.

#### Key points
- **Server Components (RSC)**: rendered on the server (at request or build time), can be `async`, can access databases and secrets directly, ship **zero JS** for themselves. Can't use state, effects or browser APIs.
- **Client Components** (`"use client"` at the top of the file): rendered on the server for HTML and hydrated on the client; can use hooks and events. The directive marks a **boundary**: everything imported from there is client code.
- Server Components can **render** Client Components and pass **serialisable props** (no functions, except server actions). Client Components can receive Server Components as `children`.
- **Server actions** (`"use server"`): async functions callable from forms or client code; the framework creates an endpoint behind the scenes. Work with `<form action={...}>` even without JS.
- After a mutation, **revalidate** (`revalidatePath`/`revalidateTag`) so Server Components re-render with fresh data.
- **Security**: every server action is a public endpoint. Validate input, check authentication and authorisation inside it.
- Pitfalls: accidental **client boundary creep**, leaking secrets via props, **request waterfalls** in nested async components, confusing caching defaults.

#### Model answer
"React Server Components split the component tree in two. **Server Components** run only on the server, can be `async` and talk to the database directly; their output is sent as a serialised tree (the RSC payload) that the client merges into the page, so their code never ships to the browser. **Client Components**, marked with `'use client'`, are the interactive parts: they render to HTML on the server and then hydrate.

**What it changes in practice:**
```tsx
// app/projects/[id]/page.tsx  — a Server Component
export default async function ProjectPage({ params }) {
  const user = await requireUser();                       // reads the session cookie
  const project = await db.project.findFirst({ where: { id: params.id, orgId: user.orgId } });
  if (!project) notFound();
  return (
    <>
      <h1>{project.name}</h1>
      <Markdown source={project.description} />           {/* big parser stays on the server */}
      <Suspense fallback={<TasksSkeleton />}>
        <TaskList projectId={project.id} />               {/* async server component, streams */}
      </Suspense>
      <RenameForm id={project.id} name={project.name} />  {/* client component */}
    </>
  );
}
```
- No `GET /api/projects/:id` endpoint, no `useEffect` fetch, no loading spinner for the main content: the data is in the HTML.
- The Markdown library never reaches the browser bundle.
- Authorisation happens next to the query.

**Server actions for mutations:**
```ts
// app/projects/actions.ts
'use server';
const Rename = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(80) });

export async function renameProject(_prev: State, formData: FormData): Promise<State> {
  const user = await requireUser();                        // actions are public endpoints!
  const parsed = Rename.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const updated = await db.project.updateMany({
    where: { id: parsed.data.id, orgId: user.orgId }, data: { name: parsed.data.name } });
  if (updated.count === 0) return { errors: { form: ['not_found'] } };
  revalidatePath(`/projects/${parsed.data.id}`);
  return { ok: true };
}
```
```tsx
'use client';
export function RenameForm({ id, name }) {
  const [state, action, pending] = useActionState(renameProject, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input name="name" defaultValue={name} aria-invalid={!!state.errors?.name} />
      <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
    </form>
  );
}
```
The form works before JS loads (it posts to the action), and with JS it submits without a reload. `revalidatePath` makes the page's Server Components re-render with the new name.

**Trade-offs I'd mention:**
- **Pros**: less client JS; fewer API endpoints and client waterfalls; secrets and heavy libraries stay on the server; colocated data and UI; progressive enhancement.
- **Cons**: a new mental model and boundary rules; **caching** behaviour (fetch cache, router cache, revalidation) can surprise; server actions are tied to the framework, so a mobile app still needs a real API; debugging spans server and client; long-running server work blocks rendering unless streamed.
- **When I'd still write an API**: mobile or third-party clients, webhooks, public APIs, or when a separate backend team owns the service."

#### Another worked example: avoiding waterfalls in nested Server Components
"A page awaits the project, then renders `<TaskList>`, which awaits tasks, which renders `<Assignees>`, which awaits users: three sequential round trips to the database. Fixes:
- **Start fetches in parallel** at the top: `const [project, tasks] = await Promise.all([...])`, or kick off promises without awaiting and pass them down to be `use()`d.
- **Use `Suspense`** so independent sections stream separately instead of blocking each other.
- **Batch per request**: wrap data-access functions in `React.cache()` so several components asking for the same user hit the database once, and use a DataLoader-style batch for lists.
It's the N+1 problem in a new place."

#### Step-by-step framework
1. **Default to Server Components**; add `'use client'` only at the leaves that need interactivity.
2. **Fetch data where it's rendered** (server), in parallel, with `Suspense` for slow parts.
3. **Pass serialisable props** across the boundary; never secrets.
4. **Mutations via server actions** (or API routes), each with validation, authentication and authorisation.
5. **Revalidate** the affected paths/tags after mutations.
6. **Keep a real API** for non-web clients.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "RSC is just SSR" | Explains zero-JS server components vs hydrated client components |
| `'use client'` at the top of every page | Client boundaries pushed to small interactive leaves |
| Server action without auth checks | Validates input and checks permissions in every action |
| Passes a full user record (with secrets) as props | Passes only what the client needs |
| Nested sequential awaits | Parallel fetches, Suspense, `React.cache` |
| Assumes actions replace all APIs | Keeps APIs for mobile, webhooks, public integrations |

#### Useful phrases
- "Server Components send UI, not code, to the browser."
- "I push `'use client'` down to the smallest interactive pieces."
- "Every server action is a public endpoint, so it validates and authorises like one."
- "After a mutation I revalidate the paths or tags that show that data."
- "Mobile clients still need a proper API."

#### Common pitfalls
- **Importing a client-only library** in a Server Component (or vice versa) and getting confusing errors.
- **Leaking data**: everything passed to a Client Component is visible in the page payload.
- **Stale UI** after mutations because nothing was revalidated.
- **Over-trusting framework caching defaults** without understanding them.
- **Putting heavy interactivity in Server Components** and fighting the model.

#### Follow-ups to expect (with sample answers)
- **"How do you do optimistic updates with server actions?"**
  "`useOptimistic` shows the expected state immediately while the action runs; when the action finishes and the page revalidates, the real state replaces it."
- **"Can a Client Component import a Server Component?"**
  "Not directly. It can receive one as `children` or another prop from a Server Component parent, which is how you wrap server content in interactive shells."
- **"How do you test Server Components?"**
  "Test data-access functions and actions as plain async functions; test client components with Testing Library; use end-to-end tests (Playwright) for the integrated page."
- **"What's in the RSC payload?"**
  "A serialised tree of rendered elements, props for client components, and references to client component bundles, which the client uses to build or update the React tree."

#### What senior interviewers look for
- A precise **mental model** of the boundary.
- **Security discipline** for server actions.
- **Performance awareness**: bundle size, waterfalls, streaming.
- **Balanced judgement**: when RSC helps and when a classic API is better.

#### Practise it
1. Convert a page that uses `useEffect` + an API route into a Server Component with a server action.
2. Check the client bundle size before and after with the build analyser.
3. Write a server action with Zod validation and an authorisation check, then call it with curl to confirm it rejects bad input.
4. Explain the difference between SSR and RSC to a friend in one minute.

## Choosing a full stack framework: Next.js, Remix, SvelteKit, Rails
- id: fs-arch-03
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: frameworks, Next.js, Remix, React Router, SvelteKit, Rails, Django, technology choice

### Prompt
You're starting a new product with a small team. How would you choose between full stack frameworks like Next.js, Remix/React Router, SvelteKit, Nuxt, Rails or Django? What criteria matter and what would you pick for a few example products?

### Answer
#### What the interviewer is really testing
- A **structured decision process** rather than personal preference.
- Knowledge of what each framework is **good at** and what it costs (complexity, hosting, ecosystem).
- Weighing **team skills, hiring, product needs and time to market** over hype.
- Thinking about **long-term maintenance**: upgrades, lock-in, community health.
- Being able to make a call and explain the **trade-offs you accept**.

#### Key points
- Criteria: **product shape** (content site, interactive app, CRUD-heavy back office, real-time), **team skills**, **hiring market**, **rendering needs** (SEO, streaming), **backend needs** (jobs, admin, ORM, auth), **hosting** and cost, **ecosystem maturity**, **upgrade path and lock-in**.
- **Next.js**: React, RSC, many rendering modes, huge ecosystem; complexity and caching subtleties; works best on Vercel but self-hostable.
- **Remix / React Router v7 (framework mode)**: web-standards-first (loaders/actions, forms, `Request`/`Response`), simpler data model, progressive enhancement; smaller ecosystem than Next.js.
- **SvelteKit / Nuxt**: similar full stack capabilities in Svelte/Vue; smaller bundles (Svelte), friendly DX; smaller hiring pools in some markets.
- **Rails / Django / Laravel**: batteries included (ORM, migrations, auth, admin, jobs, mailers), extremely productive for CRUD and B2B; pair with Hotwire/HTMX or a React front end when rich interactivity is needed.
- Decide **reversibility**: keep business logic in plain modules and data access behind a layer so the framework is replaceable.

#### Model answer
"I'd start from the product and the team, not the framework, and write the decision down as a short ADR.

**Criteria, roughly in priority order:**
1. **Product shape.** Content-heavy and SEO-critical? Highly interactive app? Mostly forms and tables? Real-time collaboration?
2. **Team.** What do we already know well? A team fluent in React will ship faster in a React framework than in a 'better' one they're learning.
3. **Backend needs.** Do we need background jobs, an admin panel, complex permissions, emails? Batteries-included frameworks give these for free.
4. **Hiring.** React and Rails/Django have big talent pools in most markets.
5. **Hosting and cost.** Serverless-friendly? Do we need long-running processes (WebSockets, jobs)?
6. **Ecosystem and longevity.** Release cadence, breaking changes, community, commercial backing.
7. **Lock-in and reversibility.** How painful is leaving?

**Quick comparison:**
| | Next.js | Remix / React Router 7 | SvelteKit | Rails / Django |
|---|---|---|---|---|
| Strengths | RSC, streaming, every rendering mode, ecosystem | Web standards, loaders/actions, progressive enhancement, simple mental model | Small bundles, great DX, simple reactivity | ORM, migrations, auth, admin, jobs built in; very fast CRUD |
| Costs | Complexity, caching surprises, frequent changes | Smaller ecosystem | Smaller hiring pool / ecosystem | Rich client UIs need extra tooling (Hotwire, React) |
| Best for | SEO + rich interactivity, content + app hybrids | Form-heavy apps, teams who like web fundamentals | Teams valuing performance and simplicity | B2B, internal tools, CRUD-heavy products |

**Example calls:**
- **B2B SaaS with lots of forms, admin and background jobs, 3 engineers, speed matters most** → **Rails** (or Django) with Hotwire, plus React islands for the two or three rich screens. The admin, auth, mailers and jobs alone save weeks.
- **Consumer marketplace needing SEO, fast product pages and a rich buyer app** → **Next.js**: ISR for listings, RSC to keep pages light, React talent easy to hire. I'd keep a separate API layer for the future mobile app.
- **Data-entry-heavy internal tool where robustness on bad networks matters** → **React Router 7 / Remix**: forms and actions that work without JS, simple data loading.
- **Small team that values performance and dislikes React's complexity, content plus some interactivity** → **SvelteKit** or **Astro** for content.

**Reducing lock-in:** domain logic and data access live in plain TypeScript (or Ruby) modules, not inside framework-specific files. Route handlers and server actions are thin adapters. That keeps a later migration (or adding a mobile API) manageable."

#### Another worked example: a team arguing Next.js vs Rails
"A team of two React developers and one Rails veteran is split. I'd timebox a **spike**: build the same thin slice (sign-in, a list with filters, a form with validation, a background email) in both, two days each. Then compare: time taken, lines of code, how easy the pieces were to test, and how each person felt maintaining it. Often the result is less about the framework and more about which parts need custom work. I'd also check hiring plans: if we're going to hire four frontend-heavy engineers next year, that tips it towards Next.js even if Rails was slightly faster in the spike."

#### Step-by-step framework
1. **Describe the product shape** and the first 6 months of features.
2. **Inventory team skills** and hiring plans.
3. **List backend needs** (jobs, admin, auth, real-time).
4. **Shortlist 2–3** frameworks that fit.
5. **Spike a thin slice** in the top two if it's genuinely close.
6. **Score on criteria**, decide, and **write an ADR** with accepted trade-offs.
7. **Design for reversibility**: thin framework adapters.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Next.js, because it's the most popular" | Criteria-driven, product-specific choice |
| Ignores team skills | Weighs current skills and hiring plans |
| Feature checklists only | Considers hosting, upgrades, community and lock-in |
| Dismisses Rails/Django as old | Recognises batteries-included productivity |
| Business logic inside route files | Thin adapters over plain modules |
| No record of the decision | ADR with trade-offs accepted |

#### Useful phrases
- "I'd start from the product shape and the team, not the framework."
- "For a CRUD-heavy B2B app, batteries-included frameworks are hard to beat for speed."
- "If it's genuinely close, a two-day spike on the same slice settles it."
- "I keep domain logic out of framework files so we're not locked in."
- "Here are the trade-offs we're accepting with this choice."

#### Common pitfalls
- **Résumé-driven choices** (picking the newest thing).
- **Underestimating backend needs** (jobs, admin, emails) when picking a frontend-first framework.
- **Ignoring hosting constraints** (WebSockets on serverless).
- **Coupling business logic to the framework**.
- **Endless debate** without a timebox.

#### Follow-ups to expect (with sample answers)
- **"Would you use a separate backend with a SPA instead?"**
  "If there are several clients (web, mobile, partners) or a separate backend team, yes: an API service plus a web front end. For one web product and a small team, a full stack framework avoids duplicated types and plumbing."
- **"How do you handle framework upgrades?"**
  "Pin versions, upgrade regularly in small steps, read migration guides, rely on good end-to-end tests, and avoid deep reliance on experimental features."
- **"What about Go or Node with Express?"**
  "Great for APIs and services, but you assemble auth, ORM, migrations and admin yourself. Fine for an experienced backend team; slower for a small product team."
- **"What would make you switch frameworks later?"**
  "A real, measured pain (performance ceiling, hiring, a feature the framework can't support) that outweighs the migration cost, not novelty."

#### What senior interviewers look for
- **Structured, defensible decisions** with explicit trade-offs.
- **Respect for team context and time to market**.
- **Reversibility thinking**.
- Breadth across ecosystems without tribalism.

#### Practise it
1. Write a one-page ADR choosing a framework for a product you know, with criteria and rejected options.
2. Build the same small feature in two frameworks and note the friction points.
3. Read the upgrade guides for the last two major versions of your favourite framework.
4. Explain to a friend why Rails can still be the right answer in 2026.

## End-to-end type safety: shared types, tRPC, OpenAPI codegen
- id: fs-arch-04
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: TypeScript, type safety, tRPC, OpenAPI, GraphQL codegen, Zod, contracts

### Prompt
How do you keep the frontend and backend in sync so that changing an API field breaks the build instead of production? Compare shared types, tRPC, OpenAPI with code generation and GraphQL codegen.

### Answer
#### What the interviewer is really testing
- Understanding that **TypeScript types vanish at runtime**: you need **runtime validation** at the boundary too.
- Knowing the main approaches and **when each fits** (monorepo vs separate repos, one client vs many, public API vs internal).
- **Contract evolution**: how changes are rolled out without breaking deployed clients (mobile apps, old tabs).
- Practical tooling: Zod, tRPC, OpenAPI generators, GraphQL Code Generator, contract tests.

#### Key points
- **Shared type package** (monorepo): simplest; but types alone don't validate data, and nothing guarantees the server actually returns that shape.
- **Schema-first validation** (Zod/Valibot): define schemas once, infer types from them, validate requests on the server (and optionally responses). Types and runtime checks can't drift.
- **tRPC**: procedures defined on the server with input schemas; the client imports the router's *type* and gets typed calls with no codegen. Excellent in a TypeScript monorepo with one web client; not a public, language-neutral API.
- **OpenAPI**: a language-neutral contract (written by hand or generated from code, e.g. from Zod or framework annotations); generate typed clients (`openapi-typescript`, `orval`) for any language. Best for public APIs, multiple clients and separate teams.
- **GraphQL**: the schema is the contract; codegen produces types per query. Great for many clients with different data needs.
- **Evolution**: additive changes are safe; removals and renames need deprecation, versioning, and checks against deployed clients (contract tests, schema diff in CI).

#### Model answer
"Type safety across the network has two halves: **compile-time types** so mistakes break the build, and **runtime validation** because whatever comes over the wire is just untyped JSON. I pick the mechanism by how many clients there are and who owns them.

**1. Shared schemas in a monorepo (baseline).**
```ts
// packages/contracts/project.ts
export const Project = z.object({ id: z.string().uuid(), name: z.string(), dueDate: z.string().date().nullable() });
export type Project = z.infer<typeof Project>;
export const CreateProject = Project.pick({ name: true, dueDate: true });
```
The server validates input with `CreateProject.parse(body)`; the client types responses as `Project` (and can validate in development). Rename a field and both sides fail to compile. This is the minimum I'd do in any TypeScript monorepo.

**2. tRPC (TypeScript monorepo, one main web client).**
```ts
// server
export const appRouter = router({
  project: router({
    byId: protectedProcedure.input(z.object({ id: z.string().uuid() }))
      .query(({ ctx, input }) => ctx.db.project.findFirstOrThrow({ where: { id: input.id, orgId: ctx.orgId } })),
    create: protectedProcedure.input(CreateProject)
      .mutation(({ ctx, input }) => ctx.db.project.create({ data: { ...input, orgId: ctx.orgId } })),
  }),
});
export type AppRouter = typeof appRouter;

// client
const project = trpc.project.byId.useQuery({ id });   // fully typed input and output
```
No codegen step, autocompletion everywhere, and integration with TanStack Query. Downsides: TypeScript-only, couples client and server deploys, not a natural public API.

**3. OpenAPI + codegen (several clients, separate teams, public API).**
The contract is an OpenAPI document, ideally generated from server code (e.g. Zod schemas via `zod-openapi`, or FastAPI/NestJS decorators) so it can't drift. CI generates a typed client:
```ts
import createClient from 'openapi-fetch';
import type { paths } from './generated/api';
const api = createClient<paths>({ baseUrl: '/api' });
const { data, error } = await api.GET('/projects/{id}', { params: { path: { id } } });
```
Mobile teams generate Swift/Kotlin clients from the same document. CI also runs a **breaking-change check** (`oasdiff`) against the published spec.

**4. GraphQL codegen.** The schema is the contract; GraphQL Code Generator produces types for each query document, so the frontend gets exactly the shape it asked for. Best when many clients need different shapes of the same graph.

**Contract evolution, regardless of tool:**
- Additive changes (new optional fields, new endpoints) are safe.
- For removals or renames: add the new field, migrate clients, watch usage, then remove (expand–contract).
- Remember **deployed clients**: mobile apps live for months and browser tabs for days. A schema diff in CI and usage metrics per field tell you when it's safe to remove something."

#### Another worked example: a production bug type safety didn't catch
"We had shared types and the client typed `dueDate` as `string`. The server, after an ORM upgrade, started returning `null` for missing dates. TypeScript was happy (types are erased at runtime), and the date formatter crashed in production. Fixes: make the shared schema the source of truth (`z.string().date().nullable()`), **validate responses in the server's tests** against the schema, and log (not crash) on client-side schema mismatches in production. Types only protect you if they describe what actually happens at runtime."

#### Step-by-step framework
1. **Single source of truth** for the contract (schema, router, OpenAPI or GraphQL schema).
2. **Derive types** from it on both sides; no hand-written duplicates.
3. **Validate at runtime** on the server for input; test (or sample-validate) outputs.
4. **Choose the mechanism**: tRPC for TS monorepo + one client; OpenAPI for multiple languages/public; GraphQL for many differing clients.
5. **CI checks**: compile both sides, breaking-change diff, contract tests.
6. **Evolve with expand–contract** and usage metrics.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Hand-written duplicate interfaces on each side | One source of truth, types derived |
| "TypeScript guarantees it" | Runtime validation at the boundary as well |
| tRPC for a public partner API | Chooses tooling by number and type of clients |
| Spec written once, then drifts | Spec generated from code, checked in CI |
| Renames a field in one deploy | Expand–contract with usage tracking |
| Forgets mobile clients | Considers long-lived deployed clients |

#### Useful phrases
- "Types disappear at runtime, so the boundary needs validation too."
- "I'd keep one source of truth and derive everything else."
- "tRPC is great inside a TypeScript monorepo; for public or multi-language clients I'd use OpenAPI."
- "CI should fail on a breaking contract change."
- "Removals go through expand–contract, because old clients are still out there."

#### Common pitfalls
- **Trusting `as Project` casts** on fetch results.
- **Generated clients checked in and never regenerated.**
- **Breaking mobile apps** with a 'harmless' rename.
- **Over-validating responses** in hot paths in production (validate in tests/dev, sample in prod).
- **Leaking internal database types** directly as the API contract.

#### Follow-ups to expect (with sample answers)
- **"Should the API types be the database types?"**
  "No. Map database rows to DTOs. The database can change (new columns, renames) without changing the contract, and you avoid leaking internal fields."
- **"How do contract tests fit in?"**
  "Consumer-driven contract tests (e.g. Pact) let each client state what it relies on; the provider's CI verifies it still satisfies them. Useful with separate teams and repos."
- **"What about server actions in Next.js?"**
  "They're typed function calls, so you get tRPC-like safety for the web client, but you still validate inputs at runtime and need a separate API for other clients."
- **"How do you version an OpenAPI API?"**
  "Prefer additive evolution; for breaking changes, a new version path or header, run both for a deprecation window, and announce timelines."

#### What senior interviewers look for
- The **compile-time vs runtime** distinction, clearly stated.
- **Tool choice driven by context**.
- **Evolution discipline** for deployed clients.
- **CI enforcement**, not good intentions.

#### Practise it
1. Set up a monorepo with a shared Zod package used by an Express API and a React app; rename a field and watch both fail.
2. Build the same endpoint with tRPC and with OpenAPI + `openapi-fetch`; compare the developer experience.
3. Add `oasdiff` to CI and introduce a breaking change to see it fail.
4. Explain expand–contract to a friend with a field rename example.

## Monolith, modular monolith or microservices for a product team
- id: fs-arch-05
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: architecture, monolith, modular monolith, microservices, team topology

### Prompt
A growing product team (8 engineers today, 25 in a year) asks whether to split their monolith into microservices. What would you advise, and how would you structure the codebase either way?

### Answer
#### What the interviewer is really testing
- Understanding that architecture follows **team structure and real pain**, not fashion.
- Knowing the **costs of distribution**: network failures, data consistency, deployment and observability overhead.
- The **modular monolith** as the default middle ground, and how to enforce module boundaries.
- A **migration path** (strangler fig) if and when services are justified.
- Making a clear recommendation and stating what evidence would change it.

#### Key points
- **Monolith**: one deployable, one database. Simple to develop, test, deploy and debug. Problems appear with team size (merge conflicts, slow CI, unclear ownership), not usually with load.
- **Microservices**: independently deployable services owning their data. Pay off for **team autonomy at scale**, independent scaling, fault isolation and different technology needs. Cost: distributed transactions, eventual consistency, network failures, versioned APIs, platform investment (CI/CD per service, tracing, service discovery).
- **Modular monolith**: one deployable, but code organised into **modules with explicit public interfaces**, private internals, and ideally their **own tables/schemas**. Boundaries enforced by tooling (lint rules, package boundaries, ArchUnit-style tests).
- Split out a service when there's a **clear reason**: a module with very different scaling or reliability needs, a team blocked by shared deploys, a technology requirement, or compliance isolation.
- **Strangler fig**: route traffic for one capability to a new service gradually, keep the rest in the monolith.
- Conway's law: system structure mirrors communication structure. Align modules with teams.

#### Model answer
"My advice would be: **don't split yet; turn the monolith into a modular monolith now**, and extract services later only where there's specific evidence.

**Why not microservices now.** At 8 engineers, the monolith's problems are usually organisational (unclear ownership, tangled code, slow CI), and microservices don't fix tangled code; they turn it into tangled network calls. They also bring real costs: every call can fail or be slow, transactions across services become sagas, local development needs many services running, and we'd need investment in tracing, per-service pipelines, API versioning and on-call. A team of 8 would spend a big share of its time on the platform.

**What I'd do instead: a modular monolith.**
```
src/
  modules/
    billing/
      index.ts            ← public API: createInvoice(), getSubscription(), events
      internal/           ← services, repositories, not importable from outside
      db/                 ← billing.* tables, migrations owned by billing
    catalog/
    orders/
    identity/
  shared/                 ← tiny: logging, config, types
  app/                    ← HTTP routes, jobs: thin adapters calling module APIs
```
- **Boundaries enforced**: an ESLint rule (`no-restricted-imports` / `eslint-plugin-boundaries`, or Nx module boundaries) forbids importing another module's `internal/`. CI fails otherwise.
- **Data ownership**: each module owns its tables (a schema per module in Postgres); other modules go through its API, not its tables. No cross-module joins in new code.
- **Communication**: synchronous function calls through public APIs for queries; **in-process domain events** (e.g. `OrderPlaced`) for side effects, using an outbox if handlers must be reliable. These map directly to messages if a module ever becomes a service.
- **Ownership**: each module has an owning team listed in `CODEOWNERS`.
- **CI speed**: test only affected modules, cache builds.

**When I'd extract a service.** If, at 25 engineers, a module shows a concrete need:
- *Scaling profile*: e.g. image processing or search indexing needs very different resources.
- *Reliability isolation*: payments shouldn't go down because of a bug in reporting.
- *Team autonomy*: a team is genuinely blocked by shared releases.
- *Technology*: an ML service in Python.
Then I'd use the **strangler fig** pattern: the module's public API becomes an HTTP/gRPC client, its tables move to its own database, its events go onto a real broker, and traffic shifts gradually behind a feature flag. Because boundaries already exist, extraction is a mechanical change, not a rewrite.

**What would change my mind now:** a hard compliance requirement to isolate data, or a component already causing outages for everything else."

#### Another worked example: a premature microservices split
"A startup I'd describe as a cautionary tale split into 12 services with 10 engineers. A simple feature, 'show the customer's last order on their profile', touched users, orders and a BFF, needed three coordinated deploys and a new API version. Incidents took hours because a request crossed five services without tracing. They merged back into four services along team lines: identity, commerce (orders, catalog, cart), content and a BFF. Lead time for changes halved. The lesson: service boundaries should follow teams and real independence, not nouns in the domain."

#### Step-by-step framework
1. **Diagnose the real pain**: deploy friction, ownership, scaling, reliability?
2. **Default to a modular monolith** with enforced boundaries and data ownership.
3. **Align modules with teams** (Conway's law); `CODEOWNERS`.
4. **Use events for cross-module side effects**.
5. **Define extraction criteria** up front.
6. **Extract with the strangler fig**, one service at a time, with platform basics in place (tracing, CI/CD, on-call).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Microservices scale better" | Distinguishes load scaling from team scaling |
| Splits by domain nouns into many services | Modules aligned to teams; services only with evidence |
| Ignores distributed-systems costs | Names network failures, sagas, tracing, versioning |
| Modules with no enforced boundaries | Lint/CI rules and per-module data ownership |
| Big-bang rewrite | Strangler fig extraction |
| No criteria | Explicit triggers for extracting a service |

#### Useful phrases
- "Microservices solve team-scaling problems, and they cost a lot to run."
- "I'd make the monolith modular first; that's most of the benefit for a fraction of the cost."
- "Boundaries are enforced in CI, not by convention."
- "Each module owns its tables; others go through its API."
- "If a module needs to become a service, the boundary is already there."

#### Common pitfalls
- **Distributed monolith**: services that must deploy together and share a database.
- **Cross-module database joins** that make later extraction impossible.
- **No platform investment** before splitting (tracing, CI/CD, alerting).
- **Too many tiny services** per engineer.
- **Ignoring data consistency** across services.

#### Follow-ups to expect (with sample answers)
- **"How do you handle a transaction across two modules?"**
  "Inside a monolith, one database transaction is fine for now, but I'd prefer the outbox and events so it maps to a saga if split later."
- **"How do you share code between modules?"**
  "Keep `shared/` tiny (logging, config, primitives). Duplicate small bits rather than coupling modules through a shared 'utils' dumping ground."
- **"How do you know boundaries are right?"**
  "Look at change patterns: if most features touch two modules together, they may belong together. Git history tells you a lot."
- **"What platform pieces are needed before splitting?"**
  "Distributed tracing, centralised logs, per-service CI/CD, service-to-service auth, API versioning practices and on-call ownership."

#### What senior interviewers look for
- **Clear recommendation with conditions**, not "it depends" alone.
- Understanding of **Conway's law** and organisational design.
- **Concrete enforcement mechanisms** for modularity.
- A **safe migration path**.

#### Practise it
1. Draw module boundaries for a product you know and list which tables each owns.
2. Add a boundary lint rule to a repo and fix the violations it finds.
3. Analyse git history: which directories change together most often?
4. Explain the 'distributed monolith' anti-pattern to a friend.

## Caching across the stack: browser, CDN, server, database
- id: fs-arch-06
- round: FULLSTACK_ARCHITECTURE
- difficulty: medium
- levels:
- tags: caching, HTTP caching, CDN, Redis, Cache-Control, invalidation, stale-while-revalidate

### Prompt
Walk through the caching layers in a typical full stack web app, from the browser to the database. How do you decide what to cache where, and how do you keep caches correct when data changes?

### Answer
#### What the interviewer is really testing
- Knowledge of **each layer**: HTTP browser cache, service worker, CDN/edge, application/server cache, query/ORM cache, database buffer cache, and client data caches (TanStack Query).
- Mastery of **HTTP caching headers**: `Cache-Control`, `ETag`, `Last-Modified`, `Vary`, `s-maxage`, `stale-while-revalidate`.
- **Invalidation strategies**: TTLs, versioned URLs, purge/tag-based invalidation, write-through vs cache-aside.
- Avoiding **correctness and security bugs**: caching personalised responses publicly, stale data after writes, thundering herds.
- Measuring whether caching **actually helps** (hit rates, latency).

#### Key points
- **Static assets**: content-hashed filenames + `Cache-Control: public, max-age=31536000, immutable`. Never invalidate; deploy new names.
- **HTML**: usually `no-cache` (revalidate each time) or short `s-maxage` at the CDN with `stale-while-revalidate`; ISR/SSG pages cached at the CDN and purged on change.
- **API responses**: public data → CDN with short `s-maxage`; per-user data → `private` (browser only) or `no-store`; use `ETag` for cheap revalidation (`304 Not Modified`).
- **`Vary`** tells caches which request headers change the response (e.g. `Accept-Encoding`, `Accept-Language`). Never cache across `Authorization`/cookies unless you mean to.
- **Server-side cache** (Redis): cache-aside for expensive queries or third-party calls; keys include tenant/user/version; TTL plus explicit invalidation on writes.
- **Client data cache**: TanStack Query/SWR with `staleTime`, invalidation after mutations, optimistic updates.
- **Database**: indexes and the buffer cache first; materialised views for heavy aggregates.
- **Stampede protection**: request coalescing, locks, jittered TTLs, `stale-while-revalidate`.

#### Model answer
"I think of caching as layers, each closer to the user and cheaper per hit, but harder to invalidate. I push data as close to the user as correctness allows.

```
Browser memory (React Query) → Browser HTTP cache / service worker → CDN edge
  → App server (in-process LRU, Redis) → Database (buffer cache, materialised views)
```

**1. Static assets.** Built with content hashes (`app.3f9a1c.js`), served with `Cache-Control: public, max-age=31536000, immutable`. They're never invalidated; a deploy references new filenames. The HTML that references them must *not* be cached long, or users get old HTML pointing at deleted assets.

**2. HTML pages.**
- Static/ISR pages: cached at the CDN (`s-maxage=60, stale-while-revalidate=600`), purged by tag when content changes.
- Personalised pages: `Cache-Control: private, no-cache`, never stored at the CDN.

**3. API responses.**
- Public, shared data (product catalogue, exchange rates): `Cache-Control: public, s-maxage=30, stale-while-revalidate=120`. The CDN absorbs traffic; `stale-while-revalidate` serves instantly while refreshing in the background.
- Per-user data: `private, max-age=0, must-revalidate` with an `ETag`, so the browser revalidates and gets a `304` with no body if nothing changed.
- Sensitive data (account details, tokens): `no-store`.

**4. Server-side cache (Redis), cache-aside.**
```ts
async function getProduct(id: string) {
  const key = `product:v3:${id}`;
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);
  const product = await singleFlight(key, () => db.products.findWithPricing(id)); // coalesce concurrent misses
  await redis.set(key, JSON.stringify(product), 'EX', 300 + Math.floor(Math.random() * 60)); // jittered TTL
  return product;
}
async function updateProduct(id, patch) {
  await db.products.update(id, patch);
  await redis.del(`product:v3:${id}`);           // invalidate after commit
  await cdn.purgeTag(`product-${id}`);           // and the CDN copy
}
```
- `v3` in the key lets me change the cached shape without stale reads.
- Jittered TTLs avoid many keys expiring at once; single-flight prevents a stampede on a hot key.

**5. Client data cache.** TanStack Query with `staleTime` per query type (e.g. 5 minutes for reference data, 0 for live data), invalidation after mutations, and optimistic updates where it improves UX.

**6. Database.** Before adding caches, make sure queries are indexed; let Postgres's buffer cache do its job. For expensive dashboards, materialised views refreshed on a schedule.

**Choosing what to cache:** high read-to-write ratio, expensive to compute, tolerant of some staleness, and safe to share. Each cache needs a stated **staleness budget** ('product prices can be 60 seconds old; stock badges 10 seconds; checkout totals never cached')."

#### Another worked example: a caching bug that leaked data
"A team put `Cache-Control: public, s-maxage=60` on `GET /api/me` by copying headers from the catalogue endpoint. The CDN cached the first user's profile and served it to everyone for a minute. Prevention: default all API responses to `private, no-store` in middleware and opt in to public caching per route; make the CDN never cache responses that set cookies or vary by `Authorization`; and add a test that authenticated endpoints never return `public`. Also, treat a cache key that doesn't include the user/tenant as a security review item."

#### Step-by-step framework
1. **Classify data**: public vs per-user vs sensitive; staleness budget.
2. **Static assets**: hashed names, immutable caching.
3. **HTML**: CDN for static/ISR; private for personalised.
4. **APIs**: `s-maxage` + SWR for public; ETags for per-user; `no-store` for sensitive.
5. **Server cache**: cache-aside with versioned keys, TTL + invalidation, stampede protection.
6. **Client cache**: staleTime and invalidation on mutation.
7. **Measure**: hit rates, origin load, latency; remove caches that don't pay off.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add Redis" as the answer to everything | Uses the cheapest correct layer for each kind of data |
| Long-cached HTML with hashed assets | Short/no-cache HTML, immutable hashed assets |
| Public caching on personalised endpoints | `private`/`no-store` by default, public by opt-in |
| No invalidation plan | TTLs + explicit invalidation + tag purges |
| Ignores stampedes | Single-flight, jitter, stale-while-revalidate |
| No staleness requirements | Explicit staleness budget per data type |

#### Useful phrases
- "Hashed assets are cached forever; HTML is cached briefly or revalidated."
- "Public data goes to the CDN with stale-while-revalidate; personal data stays private."
- "I'd default every API response to no-store and opt in to caching."
- "Each cache has a stated staleness budget and an invalidation path."
- "Jittered TTLs and request coalescing prevent stampedes."

#### Common pitfalls
- **Caching personalised responses publicly.**
- **Forgetting `Vary`** for language or encoding.
- **Invalidating before the database commit**, so the old value is re-cached.
- **Caches without metrics**, so nobody knows if they help.
- **Over-caching** things that change often, causing confusing staleness bugs.

#### Follow-ups to expect (with sample answers)
- **"Cache-aside vs write-through?"**
  "Cache-aside loads on miss and invalidates on write: simple and resilient. Write-through updates the cache on every write: fresher but couples writes to the cache. I default to cache-aside."
- **"How does `stale-while-revalidate` work?"**
  "After `max-age`, the cache can serve the stale copy for the SWR window while fetching a fresh one in the background, so users never wait for a miss."
- **"What's the difference between `no-cache` and `no-store`?"**
  "`no-cache` allows storing but requires revalidation before use; `no-store` forbids storing at all."
- **"How do you invalidate a CDN at scale?"**
  "Tag-based purges (surrogate keys) rather than URL lists, or versioned URLs so purging isn't needed."

#### What senior interviewers look for
- **Correct HTTP caching semantics**.
- **Security-first defaults**.
- **Invalidation and stampede** thinking.
- **Staleness budgets** agreed with product.

#### Practise it
1. Add correct cache headers to a small app's assets, HTML and two APIs; verify in DevTools.
2. Put a CDN in front and watch `Age` and `cf-cache-status` / `x-cache` headers.
3. Implement cache-aside with single-flight and load-test a hot key.
4. Explain `no-cache` vs `no-store` to a friend.
