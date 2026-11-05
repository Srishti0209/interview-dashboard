# Full Stack Engineer — Data & APIs

## Designing a data model from a product spec
- id: fs-data-01
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: data modelling, schema design, product spec, Postgres, constraints

### Prompt
Product hands you a one-page spec and mockups for a "team events" feature: teams create events with a date, location and capacity; members RSVP (going / maybe / not going); there's a waitlist when full; organisers can post updates; members get reminders. Turn this into a data model and explain your decisions.

### Answer
#### What the interviewer is really testing
- Can you go from **screens and user stories** to **entities, relationships and constraints**?
- Do you ask the right **clarifying questions** (time zones, recurring events, who can edit, what happens on cancellation)?
- Do you put **invariants in the database** (unique, check, foreign keys) instead of only in code?
- Do you model for the **queries the UI needs** (event page, "my upcoming events", attendee lists) and index accordingly?
- Do you think about **change over time**: soft deletes, history, migrations as the spec evolves?

#### Key points
- Start from **nouns and verbs** in the spec: team, member, event, RSVP, waitlist, update, reminder.
- Ask about **cardinality and ownership**: can a user be in several teams? Can events belong to several teams? Who can create/edit?
- Store **timestamps as `timestamptz` plus the event's IANA time zone**, because "7 pm in London" must survive DST and be shown correctly to travellers.
- Model **RSVP as one row per (event, user)** with a status enum; a **unique constraint** prevents duplicates. Waitlist can be a status plus a position or timestamp.
- **Capacity** is an invariant under concurrency: enforce with a transaction and row lock (or a conditional update), not just a count in the UI.
- Derive, don't duplicate, unless performance demands it (e.g. a cached `going_count` maintained in the same transaction).
- Design **indexes from screens**: "upcoming events for my teams", "attendees of event X", "events I'm going to".
- Plan for **soft delete / cancellation** states rather than hard deletes, because RSVPs and notifications reference events.

#### Model answer
"I'd first walk the mockups and ask a few questions:
- Can a user belong to several teams? (Yes.)
- Are events ever recurring? (Not in v1.) Online events? (Yes, location can be a URL.)
- Who can create and edit events? (Team organisers.)
- When someone drops out of a full event, does the first waitlisted person get promoted automatically? (Yes, and notified.)
- Can capacity be unlimited? (Yes, null means unlimited.)

**Entities and relationships.**
```
users ─< team_members >─ teams ─< events ─< rsvps >─ users
                                     └─< event_updates
                                     └─< reminders (scheduled jobs)
```

**Schema (Postgres).**
```sql
create table teams (id uuid primary key, name text not null, created_at timestamptz default now());

create table team_members (
  team_id uuid references teams on delete cascade,
  user_id uuid references users on delete cascade,
  role text not null check (role in ('organiser','member')),
  primary key (team_id, user_id));

create table events (
  id uuid primary key,
  team_id uuid not null references teams,
  title text not null check (length(title) between 3 and 120),
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,                       -- e.g. 'Europe/London', for display and reminders
  location_text text, location_url text,
  capacity int check (capacity is null or capacity > 0),
  going_count int not null default 0,           -- maintained transactionally
  status text not null default 'scheduled' check (status in ('scheduled','cancelled')),
  created_by uuid not null references users,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  check (ends_at > starts_at));
create index on events (team_id, starts_at) where status = 'scheduled';

create table rsvps (
  event_id uuid references events on delete cascade,
  user_id uuid references users on delete cascade,
  status text not null check (status in ('going','maybe','not_going','waitlisted')),
  waitlisted_at timestamptz,
  updated_at timestamptz default now(),
  primary key (event_id, user_id));
create index on rsvps (user_id, status);
create index on rsvps (event_id, status, waitlisted_at);

create table event_updates (
  id uuid primary key, event_id uuid references events on delete cascade,
  author_id uuid references users, body text not null, created_at timestamptz default now());
```

**Decisions explained.**
- **RSVP primary key `(event_id, user_id)`**: one answer per person, changing your mind is an update.
- **Waitlist as a status** with `waitlisted_at` for ordering; no separate table, so a person is in exactly one state.
- **Capacity under concurrency**: changing to 'going' runs in a transaction:
```sql
begin;
select capacity, going_count from events where id = $1 for update;   -- lock the event row
-- if capacity is null or going_count < capacity: set rsvp 'going', going_count + 1
-- else: set rsvp 'waitlisted', waitlisted_at = now()
commit;
```
When someone leaves 'going', the same transaction decrements the count and promotes the earliest waitlisted RSVP, then enqueues a notification.
- **Time**: `starts_at` is an absolute instant; `timezone` lets the UI show 'Thu 7 pm (London time)' and lets reminders be phrased locally.
- **Cancellation** is a status, so RSVPs and updates stay intact and attendees can be notified.
- **Reminders** aren't rows users see; they're scheduled jobs (e.g. 24 hours and 1 hour before) keyed by event id, rescheduled if the time changes.

**Queries the screens need.**
- Team page: `events where team_id = ? and status = 'scheduled' and starts_at > now() order by starts_at` → index `(team_id, starts_at)`.
- 'My upcoming events': join `rsvps (user_id, status in going/maybe)` with events → index `rsvps(user_id, status)`.
- Event page: event + counts + my RSVP + first 20 attendees (`rsvps (event_id, status)`) + updates."

#### Another worked example: when the spec changes to recurring events
"Six months later product wants weekly recurring events. Two models:
- **Store a series + materialised occurrences**: `event_series(rrule, timezone, ...)` and generate `events` rows for the next N weeks with `series_id`. RSVPs stay per occurrence, which matches how people attend. Editing 'this and following' splits the series.
- **Compute occurrences on the fly** from the RRULE: fewer rows, but RSVPs and exceptions need special handling.
I'd materialise occurrences (rolling 3 months ahead via a job), because every existing query, index and RSVP rule keeps working. The migration adds a nullable `series_id` to `events`, which is backward compatible."

#### Step-by-step framework
1. **Clarify** cardinality, permissions, lifecycle and edge cases.
2. **List entities and relationships** from nouns and verbs.
3. **Choose keys** (natural composite keys for join tables).
4. **Encode invariants** with constraints (unique, check, FK, not null).
5. **Handle concurrency** for business rules like capacity.
6. **Design indexes from screens and queries**.
7. **Plan lifecycle**: statuses, soft delete, history.
8. **Anticipate change** and show how the model evolves.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Starts with tables before asking questions | Clarifies edge cases first |
| `rsvp_going_ids` array on the event | RSVP join table with a composite key |
| Capacity checked only in the UI | Transaction with a row lock or conditional update |
| Local date/time strings without zone | `timestamptz` + IANA zone |
| Hard delete of cancelled events | Status field; history preserved |
| No indexes discussed | Indexes derived from the screens |

#### Useful phrases
- "Let me ask a few questions before I draw tables."
- "One RSVP row per person per event, with the pair as the primary key."
- "Capacity is an invariant under concurrency, so it's enforced in a transaction."
- "I store an absolute instant plus the event's time zone."
- "These indexes come straight from the screens in the mockup."

#### Common pitfalls
- **Over-normalising** into many tiny tables for v1, or **under-normalising** into JSON blobs that can't be constrained.
- **Race conditions** around capacity or uniqueness.
- **Time zone bugs**.
- **No room for change**: enums baked into code with no migration plan.
- **Forgetting permissions**: who can edit what isn't in the model.

#### Follow-ups to expect (with sample answers)
- **"Would you use a Postgres enum type for status?"**
  "A text column with a check constraint is easier to change in migrations; enum types are fine but adding/removing values is clunkier."
- **"How would you show 'Alex and 12 others are going' quickly?"**
  "Use the maintained `going_count` and fetch two or three names with a limited query, ideally friends first."
- **"Would NoSQL be better here?"**
  "The data is relational with strong invariants (capacity, uniqueness), so a relational database fits well."
- **"How do you handle a user leaving a team?"**
  "Remove the membership; keep their past RSVPs for history, and remove future RSVPs (promoting waitlisted people) in the same transaction."

#### What senior interviewers look for
- **Questions before tables**.
- **Invariants in the database** and concurrency awareness.
- **Query-driven indexing** linked to the UI.
- **Evolution** of the model as the product grows.

#### Practise it
1. Take any product's screens (Meetup, Eventbrite) and produce a schema in 30 minutes.
2. Write the capacity/waitlist transaction and test it with 50 concurrent RSVPs.
3. List each screen's queries and check them with `EXPLAIN`.
4. Explain to a friend why `timestamptz` plus a zone beats a local time string.

## ORMs vs query builders vs raw SQL
- id: fs-data-02
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: ORM, Prisma, Drizzle, Kysely, SQL, query builders, data access

### Prompt
Your team is debating whether to use an ORM (Prisma, TypeORM, ActiveRecord), a query builder (Kysely, Knex, Drizzle) or raw SQL. What are the trade-offs, and what would you choose for a TypeScript full stack app?

### Answer
#### What the interviewer is really testing
- Understanding **abstraction levels** and what each hides (and what that costs).
- Awareness of **performance pitfalls**: N+1 queries, over-fetching, inefficient generated SQL.
- **Type safety** across options in TypeScript.
- **Migrations, testing and team skills** as part of the decision.
- A **pragmatic, mixed** answer rather than dogma.

#### Key points
- **ORMs** map tables to objects/models with relations, change tracking and migrations. Fast for CRUD, consistent, approachable. Risks: hidden queries (lazy loading → N+1), hard-to-express complex queries, generated SQL you don't control, leaky abstractions under load.
- **Query builders** give composable, typed SQL in code. Close to SQL, predictable queries, good TypeScript inference (Kysely, Drizzle). Less magic for relations.
- **Raw SQL** offers full power (CTEs, window functions, `ON CONFLICT`, JSON ops) and is easiest to tune. Needs care for parameterisation and types (tools like `sqlc`, `pgtyped` or typed tagged templates help).
- Most mature codebases **mix**: an ORM or builder for everyday CRUD, raw SQL for reports and hot paths, behind a repository layer.
- Whatever you choose: **always parameterise**, **log and inspect generated SQL**, **review query plans** for hot paths.

#### Model answer
"I'd pick based on the team, the query complexity and how much control we need, and I'm comfortable mixing.

| | ORM (Prisma, TypeORM, ActiveRecord) | Query builder (Kysely, Drizzle, Knex) | Raw SQL (+ typing tools) |
|---|---|---|---|
| Productivity for CRUD | Highest | High | Lower |
| Control over SQL | Low–medium | High | Total |
| Complex queries (CTEs, windows) | Awkward; drop to raw | Good | Best |
| TypeScript types | Generated from schema | Inferred from schema types | Via codegen (`pgtyped`, `sqlc`) |
| Performance surprises | N+1, over-fetching, odd SQL | Few; what you write is what runs | None hidden |
| Learning curve | Low (but ORM-specific) | Needs SQL knowledge | Needs good SQL knowledge |
| Migrations | Built in | Built in (Drizzle Kit) or separate | Separate tool |

**For a TypeScript full stack app**, I'd usually choose **Drizzle or Kysely**: typed, SQL-shaped queries with predictable output, and easy escape to raw SQL. With a team that values speed over control and a CRUD-heavy domain, **Prisma** is a reasonable choice, with known escape hatches.

**Rules I'd set regardless:**
1. **Data access lives in a repository/service layer**, not scattered in components or route handlers. That keeps queries discoverable and the tool replaceable.
2. **Select only what you need.** `select *` and fetching entire object graphs slow pages down and leak fields.
3. **Load relations explicitly** (joins or batched `IN` queries), never lazily inside loops.
4. **Log SQL in development** with timings; review query plans for anything on a hot path.
5. **Raw SQL is allowed** for complex reporting, bulk upserts, and performance-critical paths, always parameterised.

**Example: the same query three ways.** 'Projects in my org with their open task count, most recently active first.'
```ts
// Prisma
const projects = await prisma.project.findMany({
  where: { orgId },
  select: { id: true, name: true, _count: { select: { tasks: { where: { done: false } } } } },
  orderBy: { lastActivityAt: 'desc' }, take: 20,
});

// Kysely
const projects = await db.selectFrom('projects as p')
  .leftJoin('tasks as t', (j) => j.onRef('t.project_id', '=', 'p.id').on('t.done', '=', false))
  .select(['p.id', 'p.name', (eb) => eb.fn.count<number>('t.id').as('openTasks')])
  .where('p.org_id', '=', orgId)
  .groupBy('p.id').orderBy('p.last_activity_at', 'desc').limit(20).execute();

// Raw SQL
const { rows } = await pool.query(
  `select p.id, p.name, count(t.id) filter (where not t.done) as open_tasks
     from projects p left join tasks t on t.project_id = p.id
    where p.org_id = $1
    group by p.id order by p.last_activity_at desc limit 20`, [orgId]);
```
All three are fine here. The difference shows up with harder queries (ranking, recursive CTEs, upserts with conditions), where builders and raw SQL stay readable and ORMs push you to their escape hatches."

#### Another worked example: an ORM N+1 found in production
"A dashboard rendered 50 projects and, for each, accessed `project.owner.name` in a template. With lazy loading (TypeORM/ActiveRecord style), that was 1 query for projects plus 50 for owners. Page time was 900 ms. Fixes: eager-load (`include: { owner: true }` / `.includes(:owner)`), or a single join selecting only `owner_name`. I'd also add query counting to tests ('this endpoint makes at most 5 queries') and a development warning when the same query shape runs more than N times in a request."

#### Step-by-step framework
1. **Assess the domain**: CRUD-heavy vs analytics-heavy queries.
2. **Assess the team's SQL skills** and preferences.
3. **Choose a default** (ORM or builder) and an **escape hatch** (raw SQL).
4. **Wrap data access** in repositories.
5. **Set rules**: explicit selects, explicit relation loading, parameterisation.
6. **Instrument**: SQL logs, query counts in tests, plans for hot paths.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "ORMs are bad" / "raw SQL is unmaintainable" | Trade-offs by context; mixes approaches |
| Lazy loading everywhere | Explicit eager loading or joins |
| Queries scattered across components | Repository layer |
| Never looks at generated SQL | Logs and reviews SQL and plans |
| String-concatenated raw SQL | Parameterised queries, typed tooling |
| Picks a tool the team doesn't know | Weighs team skills |

#### Useful phrases
- "I'd use a typed query builder by default and drop to raw SQL for complex or hot queries."
- "Whatever the tool, I want to see the SQL it runs."
- "Relations are loaded explicitly, never lazily inside loops."
- "Data access sits behind a repository so we can change tools later."
- "Query counts in tests catch N+1 regressions early."

#### Common pitfalls
- **N+1 queries** through lazy loading or per-item fetches in UI loops.
- **Over-fetching** whole rows and relations for small UI needs.
- **Fighting the ORM** for complex queries instead of using raw SQL.
- **Transactions handled inconsistently** across tools.
- **Leaking ORM models** directly as API responses.

#### Follow-ups to expect (with sample answers)
- **"How do you keep raw SQL type-safe?"**
  "Codegen tools (pgtyped, sqlc, Kysely's raw with types) or validating results with a schema at the repository boundary."
- **"Which handles migrations better?"**
  "Prisma and Drizzle generate migrations from schema changes; I'd still review generated SQL and handle risky changes (backfills, concurrent indexes) by hand."
- **"What about connection pooling with ORMs in serverless?"**
  "Use a pooler or an HTTP-based driver; some ORMs offer data proxies. Keep the client at module scope."
- **"How do you test the data layer?"**
  "Integration tests against a real Postgres (Docker or Testcontainers), each test in a transaction rolled back afterwards."

#### What senior interviewers look for
- **Balanced judgement** and clear rules for the team.
- **Performance awareness** (N+1, over-fetching, plans).
- **Architecture**: a data access layer that keeps choices reversible.
- Comfort with **SQL itself**.

#### Practise it
1. Write the same three queries in Prisma, Kysely and raw SQL; compare generated SQL and plans.
2. Create an N+1 deliberately with lazy loading, measure it, then fix it.
3. Add a query counter to an integration test.
4. Explain to a friend when you'd drop from an ORM to raw SQL.

## Schema migrations without downtime
- id: fs-data-03
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: migrations, expand-contract, zero downtime, deploys, backfills, Postgres

### Prompt
You need to rename a column (`users.name` → `users.full_name`), add a required column, and add an index on a 50M-row table, all while the app is serving traffic and old frontend and mobile clients are still in use. How do you plan and deploy these changes across the database, backend and clients?

### Answer
#### What the interviewer is really testing
- The **expand–contract** (parallel change) pattern across database, backend and clients.
- Knowing which DDL operations **lock tables** in Postgres and how to avoid long locks.
- **Backfilling** large tables safely.
- **Deploy ordering**: migrations vs code, rolling deploys where old and new code run at once.
- Respecting **old clients** (mobile apps, cached SPAs) that still use the old API shape.

#### Key points
- **Never rename or drop in one step.** Expand (add new), migrate (dual-write, backfill, switch reads), contract (remove old) across several deploys.
- During rolling deploys, **old and new app versions run simultaneously**; each migration must work with both.
- **Adding a nullable column** is fast in Postgres. Adding `NOT NULL` with a default is fast in Postgres 11+ for non-volatile defaults; adding `NOT NULL` to an existing column requires a scan (use a `CHECK ... NOT VALID` constraint, then `VALIDATE CONSTRAINT`).
- **Indexes**: `CREATE INDEX CONCURRENTLY` (can't run inside a transaction; check for invalid indexes if it fails).
- **Backfills** in small batches with pauses, idempotent, resumable, off the request path.
- Set **`lock_timeout`** (and `statement_timeout`) on migrations so they fail fast instead of queueing behind long transactions and blocking everything.
- **API compatibility**: return both old and new fields during the transition; deprecate the old field with monitoring; remove only when clients have moved.

#### Model answer
"I'd break this into small, backward-compatible steps, each deployable and reversible, using expand–contract. Old and new code must both work at every step, because rolling deploys and old clients guarantee overlap.

**Change 1: rename `name` → `full_name`.**
| Step | Database | Backend | Clients |
|---|---|---|---|
| 1. Expand | `alter table users add column full_name text;` (instant) | — | — |
| 2. Dual-write | — | Writes set both `name` and `full_name`; reads still use `name` | — |
| 3. Backfill | Batched `update ... set full_name = name where full_name is null` | — | — |
| 4. Switch reads | — | Reads `coalesce(full_name, name)`, then `full_name`. API returns **both** `name` and `fullName` | Web app switches to `fullName` |
| 5. Wait | — | Monitor usage of `name` in API logs / mobile versions | Mobile release with `fullName`; wait for adoption |
| 6. Contract | `alter table users drop column name;` | Stop writing/returning `name` | — |
A trigger can do the dual-write instead of app code if many code paths write the column.

**Change 2: add a required column** (`users.locale`, required, default `'en-GB'`):
```sql
alter table users add column locale text not null default 'en-GB';   -- PG11+: metadata-only, instant
```
If the default must be computed per row, add it nullable, backfill, then enforce:
```sql
alter table users add constraint users_locale_not_null check (locale is not null) not valid;  -- instant
-- backfill...
alter table users validate constraint users_locale_not_null;  -- scans, but doesn't block writes
alter table users alter column locale set not null;           -- PG12+ uses the validated check, no rescan
alter table users drop constraint users_locale_not_null;
```
The backend must handle `locale` missing until the backfill finishes; clients that don't send it get the default.

**Change 3: index on 50M rows.**
```sql
set lock_timeout = '5s';
create index concurrently if not exists users_email_lower_idx on users (lower(email));
```
`CONCURRENTLY` builds without blocking writes (it takes longer). It can't run in a transaction, so the migration tool must allow non-transactional migrations. If it fails, it leaves an `INVALID` index that I'd drop and retry.

**Backfill job.**
```sql
update users set full_name = name
 where id in (select id from users where full_name is null order by id limit 5000);
```
Run in a loop from a job with a short sleep between batches, watching replication lag and database load; idempotent (`where full_name is null`) so it can stop and resume.

**Safety settings for every migration.**
- `lock_timeout = '5s'`: even 'instant' DDL needs a brief exclusive lock; if a long-running transaction holds a conflicting lock, the migration would queue and block every query behind it. Better to fail and retry.
- `statement_timeout` for data changes.
- Migrations run in CI against a production-sized copy (or at least are reviewed for locking behaviour).

**Deploy order.** Migrations that *expand* run **before** the new code deploys; migrations that *contract* run **after** all code no longer uses the old thing (and after a safe delay for rollbacks). Each step is its own PR."

#### Another worked example: changing a column type
"Changing `orders.amount` from `integer` (pence) to `bigint` because totals are approaching 2.1 billion. `ALTER COLUMN TYPE` rewrites the table under an exclusive lock: minutes of downtime on a big table. Instead: add `amount_big bigint`, dual-write via trigger, backfill in batches, switch reads, then swap names in a quick transaction (`rename` is metadata-only) and drop the old column later. Same expand–contract shape, applied to a type change."

#### Step-by-step framework
1. **Classify each change**: additive (safe) or breaking (needs expand–contract).
2. **Check locking behaviour** of each DDL statement; use `CONCURRENTLY`, `NOT VALID`, metadata-only defaults.
3. **Set `lock_timeout`/`statement_timeout`**.
4. **Expand → dual-write → backfill → switch reads → contract**, each a separate deploy.
5. **Order**: expand before code, contract after code.
6. **Keep APIs backward compatible**; monitor old field usage; deprecate.
7. **Batch backfills** with throttling and resumability.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `ALTER TABLE ... RENAME COLUMN` in one deploy | Expand–contract across several deploys |
| Adds `NOT NULL` with a full-table scan under lock | `NOT VALID` check, validate, then set NOT NULL |
| `CREATE INDEX` on a big table | `CREATE INDEX CONCURRENTLY` |
| One giant `UPDATE` backfill | Batched, throttled, resumable backfill |
| Ignores old mobile clients | API returns both fields; monitors usage before removal |
| No lock timeout | `lock_timeout` so migrations fail fast |

#### Useful phrases
- "Old and new code run at the same time during a deploy, so every step must work with both."
- "Rename is add, dual-write, backfill, switch reads, then drop."
- "Expand migrations go before the code; contract migrations go after."
- "I'd set a lock timeout so a migration can't block the whole table."
- "The API keeps the old field until usage drops to zero."

#### Common pitfalls
- **Lock queues**: a 'fast' DDL waiting behind a long transaction blocks all queries.
- **Dropping columns** while old code still selects them (`select *` with ORM models).
- **Backfills overwhelming replicas** or the primary.
- **Rollbacks that can't undo** data migrations.
- **Forgetting cached clients** (SPAs open for days, mobile apps for months).

#### Follow-ups to expect (with sample answers)
- **"How do you roll back step 4?"**
  "Switch reads back to `name`; because we're still dual-writing, both columns are current. That's why contract waits."
- **"What tools help?"**
  "Migration frameworks (Prisma Migrate, Drizzle Kit, Flyway, Rails), linters like `squawk` that flag dangerous Postgres DDL, and tools like `pg-osc`/`pgroll` for complex changes."
- **"What about ORMs that select all columns?"**
  "Before dropping, mark the field ignored in the ORM model and deploy that first, so no running code references the column."
- **"How do you coordinate with a separate mobile team?"**
  "Publish the deprecation in the API changelog, add the new field early, track usage by app version, and agree a removal date after the minimum supported version includes the change."

#### What senior interviewers look for
- **Expand–contract** as a reflex.
- **Postgres locking knowledge**.
- **End-to-end coordination**: database, backend, web and mobile.
- **Operational safety**: timeouts, throttled backfills, rollback plans.

#### Practise it
1. On a local Postgres with 10M rows, compare `CREATE INDEX` vs `CONCURRENTLY` while running writes.
2. Hold a long transaction open and run an `ALTER TABLE` without `lock_timeout`; watch other queries block.
3. Write a resumable batched backfill script.
4. Explain expand–contract to a friend with the rename example.

## Solving N+1 queries from UI to database
- id: fs-data-04
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: N+1, performance, data fetching, DataLoader, React, GraphQL, joins

### Prompt
A list page showing 50 orders with customer names and item counts takes 3 seconds. You suspect N+1 problems, possibly on both the frontend (a request per row) and backend (a query per row). How do you find and fix them across the stack?

### Answer
#### What the interviewer is really testing
- Recognising **N+1 at every layer**: component-level fetching in the UI, per-item API calls, ORM lazy loading, GraphQL resolvers, Server Components.
- **Diagnosis** with real tools: network waterfall, server traces, SQL logs, query counts.
- **Fix patterns**: aggregate endpoints, joins, batched `IN` queries, DataLoader, prefetching, denormalised counts.
- **Prevention**: tests that count queries, API design for screens.

#### Key points
- **Frontend N+1**: each row component fetches its own details (`useQuery(['customer', id])`), so 50 rows → 50 HTTP requests. Visible as a **waterfall** in DevTools.
- **Backend N+1**: the endpoint loads orders, then queries customers/items per order (ORM lazy loading or loops). Visible in **SQL logs or traces** (51 nearly identical queries).
- **Fixes (frontend)**: fetch the list with the fields the rows need (one request), or batch requests (`GET /customers?ids=…`), or hydrate the cache from the list response.
- **Fixes (backend)**: join or eager-load, or two queries (`orders` then `customers where id in (...)`), aggregate counts with `GROUP BY` or a maintained counter.
- **GraphQL / resolvers**: use **DataLoader** to batch and cache per request.
- **Server Components**: nested async components can cause N+1 and waterfalls; use `React.cache`, batching and parallel fetches.
- **Prevent**: query-count assertions in tests, tracing in staging, review of new list endpoints.

#### Model answer
"I'd measure first, layer by layer.

**1. Diagnose.**
- **Browser DevTools network tab**: I see `GET /api/orders` (200 ms), then 50 × `GET /api/customers/:id` and 50 × `GET /api/orders/:id/items` in a staircase. That's frontend N+1 and the main cause of 3 seconds (browser connection limits and round trips).
- **Server trace** (OpenTelemetry/APM) for `GET /api/orders`: 1 query for orders, then 50 queries for line item counts: backend N+1 too.

**2. Fix the frontend: fetch what the screen needs in one request.**
```ts
// before: each row
function OrderRow({ order }) {
  const { data: customer } = useQuery({ queryKey: ['customer', order.customerId], queryFn: … });
  const { data: items } = useQuery({ queryKey: ['order-items', order.id], queryFn: … });
  ...
}
// after: the list endpoint returns what rows display
GET /api/orders?limit=50 → [{ id, number, createdAt, total, status,
                              customer: { id, name }, itemCount }]
```
Rows become pure presentational components. If other pages need full customer objects later, I can seed the cache from the list response (`queryClient.setQueryData(['customer', c.id], …)`) to avoid refetching.

If the API can't change (third-party), I'd add a **batch endpoint** (`GET /api/customers?ids=1,2,3`) and collect ids in the list component, or use a small client-side batching helper that coalesces requests made in the same tick.

**3. Fix the backend: one or two queries.**
```sql
select o.id, o.number, o.created_at, o.total, o.status,
       c.id as customer_id, c.name as customer_name,
       count(oi.id) as item_count
  from orders o
  join customers c on c.id = o.customer_id
  left join order_items oi on oi.order_id = o.id
 where o.account_id = $1
 group by o.id, c.id
 order by o.created_at desc, o.id desc
 limit 50;
```
Or with an ORM: `include: { customer: { select: { id: true, name: true } }, _count: { select: { items: true } } }`. If item counts are needed on many screens and the table is huge, maintain `orders.item_count` when items change.

**4. Verify.** One HTTP request (~150 ms), three or fewer SQL queries. Page loads in ~300 ms.

**5. Prevent regressions.**
- An integration test: `expect(await countQueries(() => api.get('/api/orders'))).toBeLessThanOrEqual(3)`.
- Dev-mode warnings when the same SQL shape runs more than 10 times in one request.
- A review checklist item for list endpoints: 'Does the list response include everything the row renders?'"

#### Another worked example: GraphQL resolvers
"In GraphQL, `orders { customer { name } }` naturally triggers N+1: the `customer` resolver runs once per order. **DataLoader** fixes it:
```ts
const customerLoader = new DataLoader(async (ids: readonly string[]) => {
  const rows = await db.customers.findMany({ where: { id: { in: [...ids] } } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id) ?? null);     // same order as ids
});
// resolver
Order: { customer: (order, _, ctx) => ctx.loaders.customer.load(order.customerId) }
```
Loaders are created **per request** (so caching doesn't leak between users), and all `load` calls in the same tick become one `IN` query. The same pattern works in React Server Components with `React.cache` plus a batching function."

#### Step-by-step framework
1. **Measure**: network waterfall, server traces, SQL logs, query counts.
2. **Frontend**: shape list responses to include row data; batch endpoints if needed; seed caches.
3. **Backend**: joins / eager loading / `IN` queries; aggregates; maintained counters.
4. **GraphQL/RSC**: per-request DataLoader / `React.cache` batching.
5. **Verify** improvements with the same tools.
6. **Prevent**: query-count tests, dev warnings, review checklist.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add caching" | Removes the N+1 at its source |
| Fixes only the SQL | Fixes both the UI request waterfall and the SQL |
| Each row component fetches its own data | List response shaped for the screen |
| Global DataLoader shared across users | Per-request loaders |
| No measurement | Waterfalls, traces and query counts before/after |
| No regression protection | Query-count tests and dev warnings |

#### Useful phrases
- "There are two N+1s here: one in the browser and one in the database."
- "The list endpoint should return everything each row renders."
- "Batch with an `IN` query or a DataLoader, created per request."
- "I'd add a query-count assertion so this doesn't come back."
- "Measure first: the network waterfall and the trace tell the story."

#### Common pitfalls
- **Fixing symptoms with caching** while the N+1 remains for cold caches.
- **Over-eager loading**: joining everything everywhere and over-fetching.
- **DataLoader returning results in the wrong order** or sharing caches across requests.
- **`COUNT` per row** inside a loop.
- **Pagination plus joins** producing duplicate rows (use `GROUP BY` or subqueries).

#### Follow-ups to expect (with sample answers)
- **"Join or two queries?"**
  "For one-to-one or many-to-one (order → customer), a join is fine. For one-to-many with many children, two queries (parents, then children `IN`) avoid row multiplication."
- **"How do you spot N+1 in production?"**
  "APM traces showing many identical spans per request, slow query logs with high call counts, `pg_stat_statements` sorted by calls."
- **"Does HTTP/2 make frontend N+1 OK?"**
  "It reduces connection overhead, but each request still has latency, server cost and its own query. One shaped request is still better."
- **"What about infinite lists?"**
  "Same rule per page: each page request returns complete row data; prefetch the next page."

#### What senior interviewers look for
- **Full-stack diagnosis**, not just ORM tweaks.
- **API design for screens**.
- **Correct batching** semantics.
- **Prevention** built into tests and tooling.

#### Practise it
1. Build a list where each row fetches its own data; record the waterfall; refactor to one request.
2. Turn on SQL logging, reproduce a backend N+1, and fix it with a join and with an `IN` query.
3. Implement a per-request DataLoader in a GraphQL server.
4. Explain to a friend why caching isn't a fix for N+1.

## GraphQL in a full stack app: schema, resolvers, dataloaders
- id: fs-data-05
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: GraphQL, schema design, resolvers, DataLoader, Apollo, Relay, security

### Prompt
Your team is considering GraphQL for a web app and an upcoming mobile app. Walk through how you'd design the schema, implement resolvers efficiently, handle auth and errors, protect the server, and use it from React. When would you not choose GraphQL?

### Answer
#### What the interviewer is really testing
- **Schema design** thinking: modelling the domain as a graph, nullability, pagination (connections), mutations with payloads.
- **Resolver performance**: N+1 and DataLoader, per-request context.
- **Security**: authorisation per field/object, query depth/complexity limits, persisted queries, introspection.
- **Client usage**: normalised caches (Apollo/urql/Relay), fragments colocated with components, codegen.
- **Judgement** about when REST or tRPC is simpler.

#### Key points
- Design the schema around **client use cases**, not database tables; hide internal ids/fields.
- **Nullability**: fields that can fail independently are often nullable so partial data can return; make non-null where truly guaranteed.
- **Pagination**: Relay-style connections (`edges`, `node`, `pageInfo`, cursors) for lists that grow.
- **Mutations** return payload types with the changed object and user-facing errors (`{ project, errors }`), rather than throwing for validation problems.
- **Resolvers** get a per-request **context** (user, loaders, db). Use **DataLoader** for any field that loads by id.
- **Authorisation** in the domain/service layer called by resolvers (not only at the top-level query); check object access everywhere it can be reached.
- **Protection**: depth and complexity limits, timeouts, rate limits by complexity cost, **persisted queries** (allow-list) for first-party clients, disable or restrict introspection in production if appropriate.
- **Client**: fragments next to components, GraphQL Code Generator for types, normalised cache updates after mutations.
- **Caching**: HTTP caching is harder (POST to one endpoint); use persisted queries with GET + CDN for public data, or rely on client caches.

#### Model answer
"**When GraphQL fits:** several clients (web, mobile) with different data needs, deeply related data (projects → tasks → assignees → comments), and teams that benefit from a typed, self-documenting contract. For a single web client in a TypeScript monorepo, tRPC or REST is often simpler.

**Schema (client-driven):**
```graphql
type Query {
  viewer: User!
  project(id: ID!): Project
}
type User { id: ID! name: String! avatarUrl: String projects(first: Int, after: String): ProjectConnection! }
type Project {
  id: ID! name: String! dueDate: Date
  owner: User!
  tasks(first: Int = 20, after: String, status: TaskStatus): TaskConnection!
  openTaskCount: Int!
}
type Task { id: ID! title: String! status: TaskStatus! assignee: User comments(first: Int, after: String): CommentConnection! }
type ProjectConnection { edges: [ProjectEdge!]! pageInfo: PageInfo! }
type ProjectEdge { cursor: String! node: Project! }

type Mutation { createTask(input: CreateTaskInput!): CreateTaskPayload! }
input CreateTaskInput { projectId: ID! title: String! assigneeId: ID }
type CreateTaskPayload { task: Task errors: [UserError!]! }
type UserError { field: [String!] code: String! message: String! }
```
- `viewer` is the entry point for 'my stuff', so clients never pass their own user id.
- Validation problems come back in `errors` with codes; unexpected failures use GraphQL errors.

**Resolvers with context and DataLoader.**
```ts
const server = new ApolloServer({ typeDefs, resolvers, plugins: [depthLimit(8), costLimit(2000)] });
// per request
context: async ({ req }) => {
  const user = await authenticate(req);
  return { user, services: makeServices(user), loaders: makeLoaders() };   // fresh loaders per request
}

const resolvers = {
  Query: { project: (_, { id }, ctx) => ctx.services.projects.getForViewer(id) },   // authz inside
  Project: {
    owner: (p, _, ctx) => ctx.loaders.user.load(p.ownerId),
    openTaskCount: (p, _, ctx) => ctx.loaders.openTaskCount.load(p.id),           // batched GROUP BY
    tasks: (p, args, ctx) => ctx.services.tasks.listForProject(p.id, args),
  },
  Task: { assignee: (t, _, ctx) => (t.assigneeId ? ctx.loaders.user.load(t.assigneeId) : null) },
  Mutation: {
    createTask: async (_, { input }, ctx) => {
      const parsed = CreateTask.safeParse(input);
      if (!parsed.success) return { task: null, errors: toUserErrors(parsed.error) };
      const task = await ctx.services.tasks.create(parsed.data);   // checks project membership
      return { task, errors: [] };
    },
  },
};
```
Authorisation lives in services, so a `Project` reached through any path (`viewer.projects`, `task.project`, `project(id:)`) goes through the same checks.

**Protecting the server.**
- **Depth and complexity limits** (a query asking for `projects → tasks → comments → author → projects…` is rejected or costed).
- **Pagination required** on lists with max `first` (e.g. 100).
- **Persisted queries** for our web and mobile apps: clients send a hash; the server only executes known queries. This blocks arbitrary expensive queries and enables GET + CDN caching.
- Timeouts and rate limits by cost; introspection disabled or restricted in production if the API isn't public.

**React usage.**
```tsx
const TaskRowFragment = graphql(`fragment TaskRow on Task { id title status assignee { id name avatarUrl } }`);
const ProjectPageQuery = graphql(`query ProjectPage($id: ID!) {
  project(id: $id) { id name openTaskCount tasks(first: 20) { edges { node { ...TaskRow } } pageInfo { endCursor hasNextPage } } } }`);
```
- **Fragments colocated** with components; GraphQL Code Generator produces typed hooks/documents.
- The normalised cache (Apollo/urql Graphcache/Relay) updates every view of a task after a mutation returns it with its id.
- Mutations can use optimistic responses for instant UI.

**When I wouldn't use GraphQL:** a single web client with simple CRUD (REST/tRPC is less machinery); public APIs where HTTP caching and simplicity matter most; teams without capacity to handle its security and performance concerns; file uploads and streaming-heavy APIs (possible, but awkward)."

#### Another worked example: a complexity attack
"Without limits, a malicious (or careless) client can send `{ viewer { projects(first: 100) { edges { node { tasks(first: 100) { edges { node { comments(first: 100) { … } } } } } } } } }`: potentially a million objects from one request. A cost analysis assigns each field a cost multiplied by `first` arguments; anything over the budget is rejected before execution. With persisted queries for first-party clients, unknown queries are rejected outright, so the attack surface shrinks to the queries we wrote."

#### Step-by-step framework
1. **Decide if GraphQL fits** (clients, data shape, team).
2. **Design the schema** from client use cases: viewer entry point, connections, payloads with user errors.
3. **Per-request context** with user, services and DataLoaders.
4. **Authorisation in services**, reachable from all paths.
5. **Protect**: depth/complexity limits, pagination caps, persisted queries, timeouts.
6. **Client**: colocated fragments, codegen, normalised cache, optimistic updates.
7. **Observe**: per-operation metrics and tracing.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Schema mirrors database tables | Schema designed from client needs |
| Unbounded lists | Connections with capped page sizes |
| Resolvers query per item | DataLoader per request |
| Auth check only at the root | Authorisation in services for every access path |
| Any query accepted | Depth/cost limits and persisted queries |
| "GraphQL for everything" | Clear criteria for when REST/tRPC is better |

#### Useful phrases
- "The schema models what clients need, not what the tables look like."
- "Every field that loads by id goes through a per-request DataLoader."
- "Authorisation lives in the service layer so every path is covered."
- "Persisted queries mean the server only runs queries our apps actually send."
- "For a single web client I'd probably pick tRPC instead."

#### Common pitfalls
- **N+1 resolvers.**
- **Authorisation gaps** through nested paths (`task.project.owner.email`).
- **Unbounded query cost.**
- **Throwing for validation errors**, making clients parse error strings.
- **Shared DataLoader caches** across users.

#### Follow-ups to expect (with sample answers)
- **"How do you version a GraphQL API?"**
  "Evolve without versions: add fields, mark old ones `@deprecated(reason: …)`, track field usage per client, remove when unused."
- **"How do you cache GraphQL responses?"**
  "Client-side normalised caches; server-side DataLoader per request and Redis for expensive resolvers; persisted queries over GET for CDN caching of public data."
- **"Federation?"**
  "Useful when several teams own parts of the graph (Apollo Federation, GraphQL Mesh); it adds a gateway and coordination overhead, so only at larger scale."
- **"Subscriptions?"**
  "For real-time updates over WebSockets; they need the same auth and fan-out design as any real-time system."

#### What senior interviewers look for
- **Thoughtful schema design** and evolution.
- **Performance and security** handled systematically.
- **Client architecture** with fragments and caches.
- **Honest judgement** on fit.

#### Practise it
1. Build a small Apollo or Yoga server with the schema above and DataLoaders; log SQL to confirm batching.
2. Add depth and cost limits and try an abusive query.
3. Use GraphQL Code Generator with colocated fragments in a React app.
4. Explain to a friend when you'd choose REST, tRPC or GraphQL.

## Full-text search: Postgres vs Elasticsearch vs a hosted service
- id: fs-data-06
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: search, Postgres full-text, Elasticsearch, OpenSearch, Algolia, Typesense, Meilisearch

### Prompt
Your product needs search across help articles and user-generated records: keyword search with typo tolerance, filters, highlighting and decent relevance. Would you use Postgres full-text search, Elasticsearch/OpenSearch, or a hosted service like Algolia, Typesense or Meilisearch? How would you decide and implement it?

### Answer
#### What the interviewer is really testing
- Knowing **what each option does well** and its operational cost.
- **Search fundamentals**: tokenisation, stemming, ranking (BM25/ts_rank), typo tolerance, facets, highlighting.
- **Data sync** between the source of truth and a search index.
- **Permissions** in search results (multi-tenant data).
- Making a **staged decision**: start simple, migrate when needed, keep the contract stable.

#### Key points
- **Postgres FTS**: `tsvector` + GIN index, `websearch_to_tsquery`, `ts_rank`, `ts_headline` for highlighting; `pg_trgm` for fuzzy/typo matching; filters are just SQL. No extra infrastructure, transactional consistency, permissions via the same queries/RLS. Limits: relevance tuning, typo tolerance across words, synonyms, very large scale and faceting performance.
- **Elasticsearch/OpenSearch**: powerful relevance (BM25, boosting, function scores), analysers per language, synonyms, aggregations/facets, scale-out. Operationally heavy (cluster sizing, mappings, reindexing), eventually consistent with your database.
- **Hosted search** (Algolia, Typesense Cloud, Meilisearch Cloud, Elastic Cloud): instant-search UX, typo tolerance and facets out of the box, minimal ops; cost scales with records/queries; data leaves your infrastructure; less control.
- **Sync**: outbox/CDC → indexer; full reindex path; deletes and permission changes must propagate.
- **Permissions**: filter by tenant/ACL attributes in the index (and secured API keys for client-side search), or post-filter carefully.
- Keep a **search API contract** in your backend so you can switch engines.

#### Model answer
"I'd decide by scale, relevance needs, team capacity and data sensitivity, and I'd usually **start with Postgres** and move when a concrete need appears.

**Option comparison.**
| | Postgres FTS + pg_trgm | Elasticsearch / OpenSearch | Hosted (Algolia, Typesense, Meilisearch) |
|---|---|---|---|
| Setup | Already have it | Cluster to run (or managed) | Sign up, push records |
| Consistency | Transactional | Near real time (sync lag) | Near real time (sync lag) |
| Relevance tuning | Basic (weights, ts_rank) | Very flexible | Good defaults, tunable |
| Typo tolerance | Per-term via trigram similarity | Fuzzy queries | Excellent, built in |
| Facets | SQL `GROUP BY` (fine at modest scale) | Aggregations, fast | Built in |
| Ops burden | None extra | High | Low |
| Cost | Included | Infra + people | Per record/search |
| Data residency | Ours | Ours | Third party |

**Stage 1: Postgres** (tens of thousands to a few million rows):
```sql
alter table articles add column search tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(body,'')), 'B')) stored;
create index articles_search_idx on articles using gin (search);
create index articles_title_trgm on articles using gin (title gin_trgm_ops);

select id, title,
       ts_headline('english', body, q, 'MaxFragments=2, MinWords=5, MaxWords=20') as snippet,
       ts_rank(search, q) as rank
  from articles, websearch_to_tsquery('english', $1) q
 where org_id = $2 and (search @@ q or title % $1)
 order by rank desc, similarity(title, $1) desc
 limit 20;
```
`websearch_to_tsquery` understands quotes and `-exclude` like a search engine; trigram similarity on titles catches typos; highlighting comes from `ts_headline` (escaped before rendering, or rendered as text with our own markers). Permissions are the same `org_id` filter (or RLS) as everything else.

**Stage 2: when to move.** Signals: relevance complaints we can't fix with weights, typo tolerance needed across whole queries, multi-language analysers and synonyms, facets on millions of rows getting slow, or search load affecting the primary database. Then:
- **Hosted (Typesense/Meilisearch/Algolia)** if the team is small and data can live with a vendor: great instant-search UX quickly.
- **OpenSearch/Elasticsearch (managed)** if we need deep relevance control, large scale, data residency, or log/analytics use cases too.

**Sync design (either engine).**
```
DB write + outbox row (same transaction) → relay → indexer → search index
```
Indexed documents include filterable attributes: `org_id`, `visibility`, `allowed_group_ids`, `updated_at`. Deletes and permission changes emit events too. A **full reindex** job (backfill into a new index, switch an alias) handles mapping changes and recovery.

**Permissions.** Every query filters by tenant and ACL attributes server-side. For client-side instant search (Algolia/Typesense), generate **scoped/secured API keys** per user with embedded filters (`org_id = X`), short-lived, so users can't search outside their data.

**API contract.** The frontend calls `GET /api/search?q=&filters=` regardless of engine; the backend translates. Switching engines doesn't change the UI."

#### Another worked example: search that leaked private records
"A team indexed all records into a hosted search service and used a single search-only API key in the browser for instant search, filtering by `org_id` in client code. Anyone could edit the filter in DevTools and search other organisations' records. The fix: secured API keys generated per session with the `org_id` filter embedded and signed (so the client can't remove it), short expiry, and private fields excluded from the index or marked unretrievable. Search indexes are a copy of your data; they need the same access control."

#### Step-by-step framework
1. **Define requirements**: data size, languages, typo tolerance, facets, latency, freshness, residency.
2. **Start with Postgres FTS + trigram** if it meets them.
3. **Define the search API contract** in the backend.
4. **Set migration triggers** (relevance, scale, features).
5. **If moving**: choose hosted vs self-managed by team capacity and data constraints.
6. **Sync** via outbox/CDC; **reindex** via aliases.
7. **Enforce permissions** in queries and keys.
8. **Measure relevance** with query logs and click-through.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Elasticsearch, obviously" | Staged decision with migration triggers |
| `LIKE '%term%'` | `tsvector` + GIN, `websearch_to_tsquery`, trigrams |
| Dual writes to DB and index | Outbox/CDC with reindex path |
| Client-side filters for permissions | Server-side filters, secured scoped keys |
| UI tied to the engine's API | Stable backend search contract |
| No relevance measurement | Query logs, zero-result rate, click-through |

#### Useful phrases
- "I'd start with Postgres full-text search and move when a specific need appears."
- "The search index is a copy of our data, so it needs the same access control."
- "Writes go through an outbox so the index can't drift silently."
- "Client-side search uses keys with the tenant filter baked in and signed."
- "The UI talks to our search API, not directly to the engine's."

#### Common pitfalls
- **Premature Elasticsearch** with no one to run it.
- **Permission leaks** through search results or snippets.
- **Stale or orphaned documents** because deletes weren't propagated.
- **Rendering highlights as raw HTML** from untrusted content (XSS).
- **Ignoring language**: English stemming on German content.

#### Follow-ups to expect (with sample answers)
- **"How do you measure search quality?"**
  "Track zero-result queries, click-through rate and position of clicks, and reformulation rate; review top failed queries weekly; offline evaluation with judged query sets for big changes."
- **"How about semantic/vector search?"**
  "Add embeddings (pgvector or the engine's vector support) and combine with keyword search (hybrid), which helps natural-language queries; keep keyword search for exact terms and codes."
- **"How do you handle synonyms in Postgres?"**
  "A synonym dictionary in the text search configuration, or expand queries in the application; beyond simple cases, a search engine is easier."
- **"Search across several tables?"**
  "A unified search view or table (or index) with type, id, title, body and permissions, kept in sync, rather than querying every table separately."

#### What senior interviewers look for
- **Pragmatic staging** and clear triggers.
- **Search fundamentals** applied correctly.
- **Sync and permissions** treated as first-class concerns.
- **Measurement** of relevance.

#### Practise it
1. Implement the Postgres FTS query with weights, highlighting and trigram fallback on a sample dataset.
2. Index the same data into Typesense or Meilisearch and compare results for 20 queries.
3. Build an outbox-based indexer and test deletes and permission changes.
4. Explain to a friend why a single public search key is dangerous for multi-tenant data.

## Data fetching contracts: what the UI needs vs what the API returns
- id: fs-data-07
- round: API_DESIGN
- difficulty: medium
- levels:
- tags: API design, BFF, over-fetching, under-fetching, view models, DTOs, contracts

### Prompt
Frontend developers complain the API makes them call five endpoints to render one page and returns huge objects they don't need; backend developers complain about "screen-specific endpoints" multiplying. How do you design data contracts that serve the UI well without turning the API into a mess?

### Answer
#### What the interviewer is really testing
- Understanding **over-fetching, under-fetching and chattiness** and their costs (latency, bandwidth, battery, coupling).
- Knowing the **patterns**: resource APIs + aggregates, field selection/sparse fieldsets, includes/expansion, BFF, GraphQL, RSC.
- **Separating API contracts (DTOs) from database models**.
- Managing **ownership and evolution** between frontend and backend teams.
- Making a **reasoned recommendation** for a given team setup.

#### Key points
- **Resource-oriented endpoints** stay the backbone (stable, reusable, cacheable).
- Add **controlled flexibility**: `?fields=` (sparse fieldsets), `?include=customer,items` (expansion), with allow-lists and limits.
- For heavy or mobile screens, add **aggregate/view endpoints** or a **BFF** owned by the frontend team that composes backend calls into screen-shaped responses.
- **GraphQL** gives clients exact shapes from one endpoint; good when many clients have different needs.
- **Server Components / server loaders** let the web app fetch on the server close to the data, removing browser round trips.
- **DTOs/view models** decouple API responses from the database: rename, compute, hide fields freely.
- **Contracts are agreed**: API-first design reviews with frontend, schema/spec in the repo, contract tests.

#### Model answer
"Both complaints are valid, and the answer is layering: **stable resource APIs** for reuse, plus a **composition layer** for screens, owned by the people who need it.

**1. Fix the backbone first.**
- Responses are **DTOs**, not database rows: `{ id, number, status, total: { amount, currency }, customer: { id, name } }`, without internal columns (`deleted_at`, `stripe_customer_id`).
- **Sparse fieldsets and includes** with allow-lists:
  `GET /orders?fields=id,number,status,total&include=customer&limit=20`
  The server validates `fields` and `include` against allowed values and max depth, so clients pick what they need without arbitrary queries.
- **Batch endpoints** for common fan-out (`GET /customers?ids=…`).
- **Consistent pagination, errors and naming** so composition is easy.

**2. Add a composition layer for screens.**
- **Web app on a full stack framework**: Server Components or route loaders call internal services directly and pass exactly what each component needs. No extra public endpoints, no browser round trips.
- **Separate SPA or mobile apps**: a **BFF** per client type, owned by the frontend/mobile team:
```
Mobile app ──► Mobile BFF ──► Orders service, Customers service, Recommendations service
Web SPA   ──► Web BFF    ──┘
```
  The BFF exposes `GET /screens/order-details/:id` returning one screen-shaped payload, handles parallel calls, timeouts and partial failures (recommendations missing → still render the order), and can change when the screen changes without touching core services.
- **Many clients with divergent needs**: GraphQL as the composition layer (often implemented as the BFF).

**3. Rules to keep it tidy.**
- Core services own **domain resources**; BFFs own **screen shapes**. Screen-specific endpoints don't leak into core services.
- BFFs contain **composition and presentation logic only**, never business rules (pricing, permissions), which stay in services.
- **Contracts are designed together**: new screens start with a short API review where frontend lists the data needed per component; the spec/schema lives in the repo with generated types.
- **Performance budgets** per screen: e.g. one request, < 50 KB, < 300 ms server time.

**Example: order details page, before and after.**
- *Before*: `GET /orders/1` (returns 80 fields), `GET /customers/7`, `GET /orders/1/items`, `GET /products?ids=…`, `GET /shipments?orderId=1`: five sequential-ish calls, ~1.2 s on mobile.
- *After*: the web page's server loader calls the services in parallel and passes a `OrderDetailsView` to components; the mobile BFF exposes the same composition as one endpoint. One round trip, ~300 ms."

#### Another worked example: when the 'one endpoint per screen' approach went wrong
"A team let every new screen add an endpoint to the core API: `/dashboard-v2-widgets`, `/order-page-data`, `/order-page-data-mobile`. After two years there were 140 endpoints, many duplicating business logic slightly differently (three ways to compute 'order total'), and nobody dared delete any. The fix was to move screen endpoints into a BFF owned by the frontend team, have them call a smaller set of resource endpoints, and consolidate business logic in services. The core API shrank and became stable; the BFF changed freely with the UI."

#### Step-by-step framework
1. **Measure the pain**: requests per screen, payload sizes, latency on mobile.
2. **Clean resource APIs**: DTOs, sparse fields, includes, batch endpoints.
3. **Choose a composition layer**: RSC/loaders (web framework), BFF (separate clients), GraphQL (many clients).
4. **Draw ownership lines**: services own domain logic; BFFs own screen shapes.
5. **Agree contracts** with spec/schema in the repo and generated types.
6. **Set budgets** and monitor them.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Frontend should just make more calls" | Recognises latency and battery costs; adds composition |
| Screen-specific endpoints in core services | BFF or server loaders own screen shapes |
| Returns database rows | DTOs designed for consumers |
| Arbitrary `?fields=` with no limits | Allow-listed fields and includes |
| Business logic duplicated in BFFs | BFF composes; services own rules |
| No agreed contract | Spec/schema in repo, typed clients, reviews |

#### Useful phrases
- "Resource APIs stay stable; screen shapes live in a composition layer."
- "The BFF is owned by the team that owns the screen."
- "No business rules in the BFF, only composition and presentation."
- "We return DTOs, not database rows."
- "Each screen has a budget: one request, a payload limit, a latency target."

#### Common pitfalls
- **Chatty UIs** on mobile networks.
- **Huge payloads** with unused fields.
- **BFF sprawl** with business logic creeping in.
- **Coupling the API to database schema**, making refactors breaking changes.
- **No ownership**, so endpoints accumulate forever.

#### Follow-ups to expect (with sample answers)
- **"BFF vs GraphQL?"**
  "A BFF is simple and explicit, good for one or two client types. GraphQL suits many clients and flexible shapes but adds schema, security and caching work. A GraphQL server can itself be the BFF."
- **"How do you handle partial failures in a composed response?"**
  "Timeouts per downstream call, return the parts that succeeded, mark missing sections (`recommendations: null`), and let the UI render a fallback."
- **"How do you avoid breaking mobile clients?"**
  "Version or evolve BFF endpoints additively; mobile BFFs can keep older screen shapes alive for old app versions."
- **"Should the frontend team write backend code?"**
  "For a BFF, yes: it's thin, close to their needs, and often in the same language (TypeScript)."

#### What senior interviewers look for
- **Systemic thinking** about API layers and ownership.
- **Concrete patterns** with trade-offs.
- **Evolution and governance**.
- **User-centred performance** budgets.

#### Practise it
1. Count requests and bytes for three screens in an app you know; identify chattiness and over-fetching.
2. Add `fields` and `include` support with allow-lists to an endpoint.
3. Build a tiny BFF route that composes three services in parallel with timeouts and partial results.
4. Explain to a friend why business rules shouldn't live in a BFF.
