# Backend Engineer — Databases & Storage

## SQL vs NoSQL: how do you choose?
- id: be-db-01
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: SQL, NoSQL, data modelling, database selection

### Prompt
How do you decide between a relational (SQL) database and a NoSQL database for a new service?

### Answer
#### What the interviewer is really testing
- Whether you choose databases based on **access patterns and requirements**, not trends.
- Knowledge of **NoSQL categories** and what each is good at.
- Understanding of **consistency, transactions, scaling and operational** trade-offs.
- Pragmatism: defaulting to boring, proven technology unless there's a reason not to.

#### Key points
- **Relational (PostgreSQL, MySQL)**: structured schema, **joins**, **ACID transactions**, flexible ad-hoc queries, strong consistency. Scales vertically and with read replicas; sharding is possible but harder.
- **NoSQL categories**:
  - **Key-value** (Redis, DynamoDB): very fast lookups by key, simple access patterns, massive scale.
  - **Document** (MongoDB, Couchbase): flexible JSON documents, good when data is naturally nested and read as a unit.
  - **Wide-column** (Cassandra, ScyllaDB, Bigtable): huge write throughput, partitioned by key, time-series/event data.
  - **Graph** (Neo4j): relationship-heavy queries (social graphs, recommendations).
  - **Search** (Elasticsearch/OpenSearch): full-text search and analytics.
- Decide based on **data relationships, query patterns, consistency needs, scale, team skills and operations**.
- Many systems use **polyglot persistence**: e.g. Postgres as the source of truth plus Redis for caching and Elasticsearch for search.

#### Model answer
"I start from the **requirements and access patterns**, not the technology.

**Questions I ask:**
1. **What does the data look like?** Highly relational (orders, customers, products with many relationships) or self-contained documents/events?
2. **How will it be queried?** Known, simple lookups by key, or flexible ad-hoc queries, joins and reporting?
3. **Consistency needs**: do we need multi-row ACID transactions (money, inventory)? Or is eventual consistency acceptable?
4. **Scale**: data volume and read/write throughput now and in 2–3 years.
5. **Operational and team factors**: what does the team know, what's managed in our cloud, what are the costs?

**My default** for most business applications is **PostgreSQL**:
- Strong consistency and transactions.
- Flexible querying, joins, indexes, constraints.
- JSONB columns for semi-structured data when needed.
- Mature tooling, managed offerings, and it scales further than many people think (vertical scaling, read replicas, partitioning).

**When I'd choose NoSQL:**
- **Key-value / wide-column** when access is by a known key at **very high scale** with predictable patterns, e.g. user sessions, shopping carts, IoT telemetry, chat messages partitioned by conversation. DynamoDB or Cassandra give horizontal scaling and high availability, but require designing tables around queries upfront.
- **Document stores** when data is naturally hierarchical and read/written as a whole, with evolving schemas, e.g. product catalogue entries with varying attributes, CMS content.
- **Graph databases** for queries like 'friends of friends who like X', which are painful with joins.
- **Search engines** for full-text search, typically alongside a primary database.

**Example decision.** For an order management service (orders, line items, payments, inventory reservations, strong consistency, reporting), I'd choose **PostgreSQL**. For storing 50,000 IoT sensor readings per second, queried by device and time range, I'd choose a **time-series or wide-column store**."

#### Another worked example: a shopping cart
"Carts are accessed by a single key (user or session ID), read and written as a whole, very frequently, and losing one occasionally is tolerable. A key-value store like DynamoDB or Redis (with persistence) suits this well: simple, fast, scalable. Orders created from the cart, however, go into the relational database where transactions matter."

#### A third worked example: when NoSQL was the wrong choice
"A team chose a document database for a financial reconciliation system because the schema 'might change'. Soon they needed joins across accounts, transactions and settlements, plus multi-document consistency. They ended up writing complex application-level joins and consistency checks. Migrating to PostgreSQL simplified the code and fixed data integrity issues. The lesson: flexible schemas are rarely worth losing relational guarantees for relational data."

#### Comparison
| Aspect | Relational (SQL) | NoSQL (varies by type) |
|---|---|---|
| Schema | Defined, enforced | Flexible or query-driven |
| Queries | Ad-hoc, joins, aggregations | Optimised for known access patterns |
| Transactions | ACID across rows/tables | Often per item/partition (some support more) |
| Scaling | Vertical + replicas; sharding harder | Horizontal scaling built in (many types) |
| Consistency | Strong by default | Often tunable / eventual |
| Best for | Business data, finance, reporting | Huge scale, simple patterns, special data shapes |

#### Step-by-step framework
1. **Understand data shape and relationships.**
2. **List access patterns** (reads, writes, queries).
3. **Determine consistency and transaction needs.**
4. **Estimate scale** now and later.
5. **Consider team skills, operations and cost.**
6. **Choose**, possibly combining stores (polyglot persistence).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "NoSQL scales better, so use it" | Chooses based on access patterns and consistency |
| Treats NoSQL as one thing | Distinguishes key-value, document, wide-column, graph, search |
| Ignores transactions | Considers ACID needs explicitly |
| No mention of operations | Considers team skills, managed services, cost |
| Single database for everything | Polyglot persistence where justified |

#### Useful phrases
- "I start from the access patterns and consistency requirements."
- "My default for business data is PostgreSQL, because of transactions and flexible queries."
- "With DynamoDB, I'd design the table around the queries upfront."
- "We'd keep Postgres as the source of truth and add search or caching alongside."

#### Common pitfalls
- **Choosing by hype** or resume value.
- **Underestimating relational databases'** scalability.
- **Using document stores for relational data.**
- **Ignoring operational complexity** (e.g. self-managing Cassandra).
- **Not planning for reporting/analytics** needs.

#### Follow-ups to expect (with sample answers)
- **"Can PostgreSQL handle millions of users?"**
  "Yes, for many workloads, with good indexing, connection pooling, read replicas, caching and partitioning; sharding when a single primary is no longer enough."
- **"What is NewSQL?"**
  "Distributed SQL databases (e.g. CockroachDB, Spanner, YugabyteDB) offering SQL and transactions with horizontal scaling, at the cost of complexity and latency."
- **"How do you move data between stores?"**
  "Change data capture (CDC) from the primary database into search, analytics or caches, rather than dual writes."

#### What senior interviewers look for
- **Long-term thinking**: evolution, migrations, analytics.
- **Operational maturity** and cost awareness.
- Clear **trade-off communication** to teams and stakeholders.

#### Practise it
1. For five systems (banking ledger, chat messages, product catalogue, social graph, sensor data), choose a database and justify it.
2. Explain why you'd default to PostgreSQL, out loud, in 90 seconds.
3. Describe one case where you'd regret choosing NoSQL.

## How indexes work, and when they hurt
- id: be-db-02
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: indexes, B-tree, query performance, PostgreSQL

### Prompt
Explain how database indexes work. How do you decide which indexes to add, and when can indexes hurt performance?

### Answer
#### What the interviewer is really testing
- Understanding of **B-tree indexes** and how they speed up lookups.
- Knowledge of **composite index ordering**, **covering indexes**, **selectivity**.
- Awareness of **write costs**, storage and maintenance.
- Using **EXPLAIN** to make decisions.

#### Key points
- Most indexes are **B-trees**: sorted, balanced trees allowing lookups, range scans and ordered reads in **O(log n)**.
- Without an index, queries may need a **full table scan**.
- **Composite indexes** follow the **leftmost-prefix rule**: an index on `(a, b, c)` helps queries filtering on `a`, `a,b` or `a,b,c`, not `b` alone.
- Put **equality** columns first, then **range/sort** columns.
- **Covering indexes** include all columns a query needs, avoiding table lookups (index-only scans).
- Indexes **cost**: slower writes (every insert/update/delete updates indexes), more storage, more memory, and bloat/maintenance.
- **Low-selectivity** columns (e.g. boolean with 50/50 split) rarely benefit, except via **partial indexes**.
- Use **EXPLAIN (ANALYZE)** to confirm the planner uses the index.

#### Model answer
"An index is a separate data structure that lets the database find rows without scanning the whole table.

**How a B-tree index works.** It stores the indexed column values in **sorted order** in a balanced tree, with pointers to the table rows. To find `email = 'ana@example.com'`, the database walks down the tree, a few page reads even for millions of rows, rather than checking every row. Because it's sorted, it also supports **range queries** (`created_at > ...`) and **ORDER BY** without sorting.

**Choosing indexes.** I start from the **actual queries**, especially frequent and slow ones:
- For `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20`, an index on **`(customer_id, created_at DESC)`** lets the database find the customer's orders and read them in order, stopping after 20.
- **Composite index order matters**: equality filters first (`customer_id`), then range/sort columns (`created_at`). An index on `(created_at, customer_id)` would be much less useful for this query.
- **Covering index**: if the query only needs `id, status, total`, adding those (e.g. `INCLUDE (status, total)` in PostgreSQL) enables an index-only scan.
- **Partial index**: for `WHERE status = 'pending'` where pending orders are a tiny fraction, `CREATE INDEX ... WHERE status = 'pending'` is small and fast.
- **Unique indexes** also enforce data integrity (e.g. one account per email).

I verify with **`EXPLAIN ANALYZE`**: is it doing an index scan, how many rows are read versus returned, and what's the actual time?

**When indexes hurt:**
- **Writes slow down**: every insert, update and delete must update every relevant index. A table with 12 indexes can have noticeably slower writes.
- **Storage and memory**: indexes compete for cache memory; too many means less of the hot data fits in memory.
- **Unused or duplicate indexes**: pure cost. I periodically check index usage statistics and drop unused ones.
- **Low selectivity**: an index on a boolean `is_active` (90% true) won't help most queries; the planner may ignore it.
- **Functions on columns** can prevent index use: `WHERE LOWER(email) = ...` needs an **expression index** on `LOWER(email)`.
- **Bloat**: frequently updated indexes may need maintenance (e.g. reindexing)."

#### Another worked example: speeding up a slow dashboard query
"A dashboard query `WHERE tenant_id = ? AND created_at >= now() - interval '30 days'` took 4 seconds on a 200M-row table.
- `EXPLAIN ANALYZE` showed a sequential scan.
- Added `CREATE INDEX CONCURRENTLY ON events (tenant_id, created_at)` (concurrently to avoid locking writes).
- Query time dropped to 40 ms, reading only the relevant rows.
- I also checked write latency on the table afterwards, which increased only slightly."

#### A third worked example: removing indexes to speed up writes
"An ingestion table receiving 5,000 inserts/second had 9 indexes, several added years ago for queries no longer used. Index usage statistics showed 4 had zero scans in 30 days. Dropping them cut insert latency by about 35% and reduced storage by 40 GB, with no impact on reads."

#### Index types (PostgreSQL examples)
| Type | Good for |
|---|---|
| B-tree (default) | Equality, ranges, sorting |
| Hash | Equality only |
| GIN | Arrays, JSONB containment, full-text search |
| GiST / SP-GiST | Geospatial, ranges, similarity |
| BRIN | Huge, naturally ordered tables (e.g. time-series) |
| Partial / expression | Subsets of rows; computed values |

#### Step-by-step framework
1. **Find important queries** (frequency × latency).
2. **Run EXPLAIN ANALYZE.**
3. **Design indexes** (equality first, then range/sort; consider covering/partial).
4. **Create safely** (e.g. concurrently in production).
5. **Measure** read and write impact.
6. **Review periodically** and drop unused indexes.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Index every column" | Index based on real queries |
| Ignores composite order | Leftmost prefix; equality then range |
| Never checks the plan | Uses EXPLAIN ANALYZE |
| Ignores write cost | Weighs write, storage and memory costs |
| Never removes indexes | Reviews and drops unused indexes |

#### Useful phrases
- "A B-tree keeps values sorted, so lookups and range scans are logarithmic."
- "For this query I'd index customer_id then created_at, equality first, then the sort column."
- "Every index slows down writes, so I only add the ones queries need."
- "I'd confirm with EXPLAIN ANALYZE that the planner actually uses it."

#### Common pitfalls
- **Over-indexing** write-heavy tables.
- **Wrong column order** in composite indexes.
- **Wrapping indexed columns in functions.**
- **Creating indexes in production that lock the table.**
- **Not verifying** index usage.

#### Follow-ups to expect (with sample answers)
- **"Why might the database ignore my index?"**
  "Low selectivity, outdated statistics, type mismatches, functions on the column, or because scanning the table is genuinely cheaper for that query."
- **"What's a clustered index?"**
  "In some databases (e.g. MySQL InnoDB, SQL Server), the table rows are stored in the order of the primary/clustered key, making range reads on that key efficient."
- **"How do you index JSON fields?"**
  "Expression indexes on specific JSON paths, or GIN indexes for containment queries in PostgreSQL."

#### What senior interviewers look for
- **Query-plan literacy** and measurement-driven decisions.
- Awareness of **production safety** (concurrent index creation, locks).
- Balancing **read and write** workloads.

#### Practise it
1. Design indexes for three queries on an orders table and explain the column order.
2. Run EXPLAIN ANALYZE on a local database before and after adding an index.
3. Explain when an index hurts performance, out loud.

## Transactions, ACID and isolation levels
- id: be-db-03
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: hard
- levels:
- tags: transactions, ACID, isolation levels, concurrency

### Prompt
Explain ACID and transaction isolation levels. What anomalies can occur at each level, and how do you choose?

### Answer
#### What the interviewer is really testing
- Precise understanding of **ACID** properties.
- Knowledge of **isolation levels** and the **anomalies** they prevent.
- Ability to apply this to **real bugs** (lost updates, double booking).
- Awareness of database-specific behaviour (e.g. PostgreSQL MVCC).

#### Key points
- **ACID**:
  - **Atomicity**: all or nothing.
  - **Consistency**: transactions move the database between valid states (constraints hold).
  - **Isolation**: concurrent transactions don't interfere in unexpected ways.
  - **Durability**: committed data survives crashes.
- **Anomalies**: **dirty reads**, **non-repeatable reads**, **phantom reads**, **lost updates**, **write skew**.
- **Isolation levels** (SQL standard): **Read Uncommitted**, **Read Committed**, **Repeatable Read**, **Serializable**.
- PostgreSQL default is **Read Committed**; MySQL InnoDB default is **Repeatable Read**.
- Higher isolation = fewer anomalies but more contention/aborts. Handle **serialization failures** with retries.
- Alternatives: **explicit locks** (`SELECT ... FOR UPDATE`), **conditional updates**, **constraints**.

#### Model answer
"**ACID** describes the guarantees of a transaction:
- **Atomicity**: a transfer that debits one account and credits another either fully happens or doesn't happen at all.
- **Consistency**: constraints (foreign keys, unique, check constraints) are never violated by committed transactions.
- **Isolation**: concurrent transactions behave as if they're isolated, to a degree defined by the isolation level.
- **Durability**: once committed, data survives crashes (written to the write-ahead log).

**Anomalies:**
- **Dirty read**: reading another transaction's uncommitted changes.
- **Non-repeatable read**: reading the same row twice in a transaction and getting different values because another transaction committed in between.
- **Phantom read**: re-running a query returns new rows inserted by another transaction.
- **Lost update**: two transactions read a value, both modify it, and one overwrites the other (e.g. both read stock = 10, both write 9).
- **Write skew**: two transactions read overlapping data and make decisions that are individually valid but jointly violate a rule (e.g. two doctors both go off call because each saw the other was on call).

**Isolation levels:**
| Level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| Read Uncommitted | Possible | Possible | Possible |
| Read Committed | Prevented | Possible | Possible |
| Repeatable Read | Prevented | Prevented | Possible (standard) |
| Serializable | Prevented | Prevented | Prevented |

(PostgreSQL's Repeatable Read uses snapshot isolation, which also prevents phantoms but still allows write skew; its Serializable level detects write skew too.)

**Choosing.** I usually stay at the **default (Read Committed in PostgreSQL)** and handle specific risks explicitly:
- **Lost updates**: use **atomic updates** (`UPDATE stock SET qty = qty - 1 WHERE id = ? AND qty > 0`) instead of read-modify-write in application code, or `SELECT ... FOR UPDATE` to lock the row, or optimistic concurrency with a version column.
- **Write skew / complex invariants**: use **Serializable** for those transactions and **retry on serialization failure**, or enforce the rule with constraints or explicit locks.

**Example: the double-booking bug.** Two requests check 'is seat 12A free?' (both see yes) and both insert a booking. At Read Committed, both succeed. Fixes: a **unique constraint** on `(event_id, seat_id)` in bookings (the database rejects the second), or a conditional update on the seat row, or Serializable isolation with retries."

#### Another worked example: a bank transfer
"```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100;
-- check 1 row updated, else ROLLBACK (insufficient funds)
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
INSERT INTO ledger (...) VALUES (...);
COMMIT;
```
Atomicity ensures both updates happen together; the conditional update prevents overdrafts even with concurrent transfers, without needing Serializable. Locking accounts in a consistent order (lower ID first) avoids deadlocks."

#### A third worked example: write skew in practice
"A rule says each project must have at least one admin. Two admins simultaneously remove their own admin rights; each transaction checks 'is there another admin?' and sees one. Both commit, leaving zero admins. Under Serializable isolation in PostgreSQL, one transaction fails with a serialization error and is retried, then sees it's the last admin and is blocked. Alternatively, lock the project row (`SELECT ... FOR UPDATE`) before checking."

#### Step-by-step framework
1. **Define ACID** with examples.
2. **Explain anomalies** with concrete cases.
3. **Map isolation levels** to anomalies.
4. **Explain your default** and targeted fixes.
5. **Mention retries** for serialization failures and deadlocks.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Vague definitions | Precise ACID definitions with examples |
| Doesn't know anomalies | Explains dirty, non-repeatable, phantom, lost update, write skew |
| "Always use Serializable" | Default level + targeted fixes; Serializable where needed |
| No retry handling | Retries on serialization failures/deadlocks |
| Application-level read-modify-write | Atomic conditional updates or locks |

#### Useful phrases
- "Atomicity means all or nothing; durability means committed data survives crashes."
- "Lost updates happen with read-modify-write in application code."
- "I'd use an atomic conditional update rather than raising the isolation level."
- "With Serializable, the application must retry on serialization failures."

#### Common pitfalls
- **Assuming transactions prevent all race conditions** at default isolation.
- **Read-modify-write** logic in application code.
- **Long transactions** holding locks.
- **Not retrying** serialization failures and deadlocks.
- **Confusing ACID consistency with CAP consistency.**

#### Follow-ups to expect (with sample answers)
- **"What is MVCC?"**
  "Multi-version concurrency control: readers see a snapshot of data without blocking writers, by keeping multiple versions of rows."
- **"How do you avoid deadlocks?"**
  "Acquire locks in a consistent order, keep transactions short, and retry on deadlock errors."
- **"Can you have transactions across microservices?"**
  "Not ACID transactions practically; use sagas with compensating actions and idempotency."

#### What senior interviewers look for
- Turning theory into **correct production code**.
- Understanding **database-specific** behaviours.
- **Designing invariants** with constraints and locks.

#### Practise it
1. Write an example of a lost update and fix it three ways.
2. Explain write skew with your own example.
3. Recite the isolation level/anomaly table from memory.

## Normalisation vs denormalisation
- id: be-db-04
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: normalisation, denormalisation, data modelling, performance

### Prompt
What is database normalisation, and when would you deliberately denormalise?

### Answer
#### What the interviewer is really testing
- Understanding of **normal forms** and why they reduce anomalies.
- Recognising **read performance** reasons for denormalisation.
- Knowing how to **keep denormalised data consistent**.
- Practical judgement, not textbook recitation.

#### Key points
- **Normalisation** organises data to **reduce redundancy** and **update anomalies**:
  - **1NF**: atomic values, no repeating groups.
  - **2NF**: no partial dependency on part of a composite key.
  - **3NF**: no transitive dependencies (non-key columns depend only on the key).
- Benefits: **single source of truth**, smaller storage, easier updates, fewer inconsistencies.
- **Denormalisation** duplicates or precomputes data to **speed up reads**, avoid expensive **joins** or **aggregations**.
- Techniques: **duplicated columns**, **precomputed counters/aggregates**, **materialised views**, **read models (CQRS)**, embedding in documents.
- Costs: **write complexity**, **risk of inconsistency**, more storage.
- Keep it consistent with **transactions**, **triggers**, **events/CDC**, or periodic **rebuilds**.

#### Model answer
"**Normalisation** means structuring tables so each fact is stored **once**. For example, instead of storing a customer's name and address on every order row, we store customers in a `customers` table and reference them by `customer_id`.

**Why it matters:**
- **Update anomalies**: if the address is copied to 500 orders, changing it means updating 500 rows, and missing one creates inconsistency.
- **Insert/delete anomalies**: you can't store a customer without an order, or deleting the last order loses the customer's details.
- Normal forms (1NF, 2NF, 3NF) are formal rules to avoid these problems; in practice, I aim for roughly **3NF** for transactional data.

**When I denormalise**: for **read performance or simplicity**, when profiling shows it's needed:
1. **Expensive aggregations**: showing 'number of comments' on every post by counting rows each time is costly. Store a `comment_count` column, updated when comments are added or removed.
2. **Hot joins**: a product list page joining five tables on every request might use a precomputed view.
3. **Historical snapshots** (often a correctness reason!): an order should store the **price and address at the time of purchase**, not reference the current product price. That's intentional duplication for correctness.
4. **Read models**: in CQRS, a separate read-optimised store (e.g. a search index or a denormalised table) built from events.

**Keeping denormalised data consistent:**
- Update in the **same transaction** where possible (e.g. insert comment + increment count).
- Use **database triggers** carefully, or **event-driven updates** / **change data capture** for read models.
- **Materialised views** refreshed on a schedule when slight staleness is fine.
- **Reconciliation jobs** that detect and fix drift.

My rule: **normalise by default, denormalise deliberately**, with a clear reason and a consistency strategy."

#### Another worked example: an analytics workload
"For a reporting dashboard over millions of orders, we built a **star schema** in a data warehouse: a central `fact_orders` table with denormalised dimensions (date, product category, region). Queries that took minutes on the normalised transactional database ran in seconds in the warehouse. The transactional database stayed normalised; the warehouse was loaded nightly via ETL."

#### A third worked example: a counter that drifted
"A `follower_count` column was updated by application code in two places, but one code path forgot to decrement on unfollow. Counts drifted upwards over months. We fixed the bug, moved the update into the same transaction as the follow/unfollow insert/delete, and added a weekly reconciliation job comparing counts with `COUNT(*)`. Denormalised data needs ownership and checks."

#### Normalised vs denormalised
| Aspect | Normalised | Denormalised |
|---|---|---|
| Redundancy | Minimal | Intentional duplication |
| Writes | Simple, consistent | More complex |
| Reads | May need joins/aggregations | Fast, simple |
| Consistency risk | Low | Higher (needs strategy) |
| Typical use | Transactional systems | Read-heavy views, analytics, caches |

#### Variations you might be asked
- "Normalise this schema": be ready to spot repeating groups (1NF), partial dependencies on composite keys (2NF) and transitive dependencies such as `city → country` stored on every order (3NF).
- "How would you model product variants (size, colour)?": a `products` table, a `variants` table (SKU, price, stock), and option tables, normalised for inventory accuracy, with a denormalised search document for browsing.
- "Where do you store computed totals?": store the order total on the order (a historical fact), but compute dashboards from aggregates or summary tables.

#### Step-by-step framework
1. **Start normalised** (≈3NF) for transactional data.
2. **Profile** read paths; find expensive joins/aggregations.
3. **Choose a denormalisation technique.**
4. **Define the consistency mechanism.**
5. **Monitor and reconcile.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Recites normal forms only | Explains anomalies with examples |
| "Denormalise for speed" without detail | Specific techniques and when to use them |
| Ignores consistency | Transactions, events, materialised views, reconciliation |
| Treats order snapshots as bad duplication | Recognises historical snapshots as correct |

#### Useful phrases
- "Normalise by default, denormalise deliberately."
- "Orders should store the price at purchase time. That duplication is intentional."
- "If we store a count, we update it in the same transaction as the change."
- "Read models can be rebuilt from the source of truth."

#### Common pitfalls
- **Premature denormalisation.**
- **No consistency strategy.**
- **Over-normalising** to the point of unusable queries.
- **Mixing analytics and transactional workloads** in one schema.

#### Follow-ups to expect (with sample answers)
- **"What's a materialised view?"**
  "A stored result of a query, refreshed periodically or on demand, giving fast reads of precomputed data."
- **"How does denormalisation apply to NoSQL?"**
  "NoSQL designs often denormalise heavily, shaping data around queries, which makes writes and consistency the main challenges."
- **"What's CQRS?"**
  "Command Query Responsibility Segregation: separate write and read models, with read models optimised for queries and updated from events."

- **"Is JSONB in PostgreSQL a form of denormalisation?"**
  "It can be. It's useful for flexible attributes read as a unit, but data you filter, join or enforce constraints on usually belongs in proper columns."
- **"How do you decide if denormalisation is worth it?"**
  "Measure: if a query is a real bottleneck and indexing or caching isn't enough, compare the read gain with the write complexity and consistency risk."

#### What senior interviewers look for
- **Data integrity** thinking alongside performance.
- **Operational processes** for derived data.
- Separating **OLTP and OLAP** workloads.

#### Practise it
1. Take an unnormalised order spreadsheet and normalise it into tables.
2. Identify two places you'd denormalise for performance and explain how you'd keep them consistent.
3. Explain the difference out loud in two minutes.

## Diagnosing a slow query and the N+1 problem
- id: be-db-05
- roles: backend, fullstack
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: query optimisation, N+1, ORMs, EXPLAIN

### Prompt
An API endpoint has become slow. You suspect the database. How do you find and fix the problem? What is the N+1 query problem?

### Answer
#### What the interviewer is really testing
- A **systematic approach** to performance investigation.
- Use of **observability tools** (APM, slow query logs, EXPLAIN).
- Recognising **common causes**: missing indexes, N+1, over-fetching, locks.
- Knowing **fixes** and verifying them.

#### Key points
- **Measure first**: APM traces, endpoint latency breakdown, slow query logs, `pg_stat_statements`.
- **EXPLAIN ANALYZE** to see plans, row estimates vs actuals, sequential scans, sorts, nested loops.
- **N+1 problem**: one query fetches N items, then the code runs one query per item (N extra queries), common with ORMs and lazy loading.
- Fixes: **eager loading / joins**, **batching** (`WHERE id IN (...)`), **DataLoader** pattern.
- Other causes: **missing/wrong indexes**, **SELECT \***, **large offsets**, **lock contention**, **stale statistics**, **connection pool exhaustion**, **chatty round trips**.
- Verify improvements and add **regression protection** (query count tests, monitoring).

#### Model answer
"I'd investigate systematically rather than guessing.

**1. Confirm where time goes**
- Look at the endpoint in our **APM/tracing** tool (e.g. Datadog, New Relic, OpenTelemetry traces). Is the time in database calls, external services, or application code?
- Check how many queries the request makes and which are slow.
- Check the database's **slow query log** or **`pg_stat_statements`** for the top queries by total time.

**2. Typical findings and fixes**

**a) The N+1 problem.** Example: an endpoint lists 50 orders and shows each customer's name. With an ORM:
```python
orders = Order.objects.filter(status='open')[:50]   # 1 query
for o in orders:
    print(o.customer.name)                           # 50 more queries (lazy loading)
```
That's **51 queries**; each is fast, but the round trips add up (e.g. 51 × 2 ms = 100+ ms, much worse under load).
Fixes:
- **Eager load**: `Order.objects.filter(...).select_related('customer')` (one JOIN) or `prefetch_related` (two queries: orders, then customers `WHERE id IN (...)`).
- In GraphQL resolvers, use **DataLoader** to batch lookups.

**b) Missing or wrong index.** `EXPLAIN ANALYZE` shows a sequential scan over millions of rows for a filtered query → add an appropriate (composite) index, created concurrently.

**c) Over-fetching.** `SELECT *` on wide tables with large text/JSON columns → select only needed columns; paginate.

**d) Deep offset pagination** → switch to keyset pagination.

**e) Lock contention.** Queries waiting on locks (visible in `pg_stat_activity` / lock views) → shorten transactions, avoid long-running updates during peak, fix hot-row updates.

**f) Bad plans from stale statistics** → `ANALYZE` the table; check estimates vs actual rows.

**3. Verify**
- Compare before/after latency (p50/p95/p99) and query counts.
- Load test if the endpoint is critical.

**4. Prevent regressions**
- Tests asserting **maximum query counts** for key endpoints (many frameworks support this).
- Alerts on slow queries and p95 latency.
- Code review checklist for ORM usage."

#### Another worked example: a slow report endpoint
"A '/reports/monthly' endpoint took 12 seconds.
- Tracing showed one query with a `GROUP BY` over 30M rows.
- `EXPLAIN ANALYZE` showed a sequential scan and a large sort spilling to disk.
- Fixes: a composite index on `(tenant_id, created_at)`, plus a nightly-maintained **summary table** with daily aggregates per tenant.
- The endpoint now queries 30 daily rows instead of 30M raw rows: under 50 ms."

#### A third worked example: connection pool exhaustion
"An endpoint was slow only during peaks. The database itself was fine; requests were **waiting for a connection** from the application's pool because a background job held connections during long external API calls. Fixes: release connections before external calls, size pools appropriately, and add PgBouncer for connection pooling. Tracing showed 'time waiting for connection' as the dominant cost."

#### Common causes checklist
| Symptom | Likely cause | Fix |
|---|---|---|
| Many small queries per request | N+1 | Eager loading, batching, DataLoader |
| Sequential scan on big table | Missing index | Composite/partial index |
| Slow with deep pages | Offset pagination | Keyset pagination |
| Slow only at peak | Lock contention / pool exhaustion | Short transactions, pooling |
| Plan estimates wildly off | Stale statistics | ANALYZE |
| Large response payloads | Over-fetching | Select needed columns |

#### Step-by-step framework
1. **Measure** with tracing and slow query logs.
2. **Identify** top offenders (query count, total time).
3. **Analyse** with EXPLAIN ANALYZE.
4. **Fix** the root cause.
5. **Verify** with metrics.
6. **Prevent** regressions.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add more servers" | Measures and finds the root cause |
| "Add indexes everywhere" | Uses EXPLAIN ANALYZE to target fixes |
| Doesn't know N+1 | Explains and fixes N+1 with eager loading/batching |
| No verification | Measures before/after and adds regression tests |

#### Useful phrases
- "First I'd check the trace to see whether time is in the database at all."
- "This is a classic N+1: one query for the list, then one per item."
- "I'd confirm the fix with EXPLAIN ANALYZE and p95 latency."
- "We add query-count assertions so the N+1 doesn't come back."

#### Common pitfalls
- **Guessing** without measurement.
- **Fixing symptoms** (bigger database) instead of causes.
- **Ignoring ORM-generated queries.**
- **Creating indexes that lock production tables.**
- **No regression protection.**

#### Follow-ups to expect (with sample answers)
- **"JOIN or separate batched queries?"**
  "JOINs for one-to-one or small one-to-many; batched `IN` queries to avoid row explosion with large one-to-many relationships."
- **"What's pg_stat_statements?"**
  "A PostgreSQL extension tracking execution statistics for all queries, useful for finding top queries by total time."
- **"How do you find N+1 issues automatically?"**
  "APM tools detect repeated query patterns; libraries (e.g. Bullet in Rails, nplusone in Python) warn in development; query-count tests in CI."

- **"How do you profile a query in MySQL vs PostgreSQL?"**
  "Both support EXPLAIN (with ANALYZE in PostgreSQL, EXPLAIN ANALYZE in MySQL 8+), plus slow query logs; the principles of reading plans are the same."
- **"What would you do if the query is fast alone but slow under load?"**
  "Look at contention: locks, connection pool waits, CPU or I/O saturation, and cache misses, using database metrics and tracing during the peak."

#### What senior interviewers look for
- **Methodical performance engineering.**
- **Observability** skills.
- Building **guardrails** for teams.

#### Practise it
1. Write an N+1 example in your ORM of choice and fix it.
2. Read an EXPLAIN ANALYZE output and identify the slowest node.
3. Walk through your investigation process out loud in 3 minutes.

## Replication and read replicas
- id: be-db-06
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: replication, read replicas, high availability, consistency

### Prompt
How does database replication work? How would you use read replicas, and what problems do they introduce?

### Answer
#### What the interviewer is really testing
- Understanding of **leader–follower replication** (synchronous vs asynchronous).
- Using replicas for **read scaling** and **high availability**.
- Handling **replication lag** and **read-your-writes** consistency.
- **Failover** and its risks.

#### Key points
- **Leader (primary) → followers (replicas)**: writes go to the leader; changes stream to replicas (e.g. via the write-ahead log).
- **Asynchronous replication**: low write latency, but replicas **lag**; failover can lose recent writes.
- **Synchronous replication**: commit waits for at least one replica; no data loss on failover, but higher latency and availability risk if replicas are slow.
- **Read replicas** scale reads; **replication lag** causes **stale reads**.
- Solutions: **read-your-writes** (route a user's reads to the primary shortly after they write), **monotonic reads** (stick to one replica), check replica lag before routing.
- **Failover**: promote a replica when the leader fails; avoid **split brain**; use managed services or proven tools.
- Multi-leader and leaderless replication exist (e.g. Cassandra) with conflict resolution trade-offs.

#### Model answer
"**How it works.** In leader–follower replication, all writes go to the **primary**. The primary records changes in its log (in PostgreSQL, the write-ahead log), and **replicas** stream and apply those changes, keeping a copy of the data.

**Synchronous vs asynchronous:**
- **Asynchronous** (common default): the primary commits without waiting for replicas. Fast writes, but replicas can be **seconds behind** under load, and if the primary dies, the most recent writes may not have reached any replica.
- **Synchronous**: the primary waits until at least one replica confirms. No data loss on failover, but higher write latency, and writes stall if the synchronous replica is unavailable (so usually configured with several candidates).

**Using read replicas.** Route **read-heavy, lag-tolerant** queries to replicas: product browsing, reports, analytics, search indexing. Keep **writes and consistency-critical reads** on the primary.

**The main problem: replication lag.**
Example: a user updates their profile name, then the page reloads and reads from a replica that hasn't received the change yet. They see their old name and think the update failed.

Solutions:
- **Read-your-writes**: after a user writes, route their reads to the primary for a short window (e.g. 10 seconds), or track the write's log position and only read from replicas that have caught up to it.
- **Monotonic reads**: pin a user's session to one replica so they don't see data 'go backwards' when switching between replicas with different lag.
- **Lag-aware routing**: exclude replicas whose lag exceeds a threshold.
- **Critical paths on primary**: checkout, payments, permission checks.

**High availability and failover:**
- If the primary fails, a replica is **promoted**. Managed databases (RDS, Cloud SQL, Aurora) and tools (Patroni) automate detection and promotion.
- Risks: **data loss** with async replication, and **split brain** (two nodes both thinking they're primary), avoided with consensus-based leader election and fencing.
- Applications need to **reconnect** to the new primary (via a stable DNS name or proxy).

**Monitoring**: replication lag, replica health, failover events, and read/write distribution."

#### Another worked example: scaling a read-heavy marketplace
"Our primary was at 80% CPU, mostly from product browsing queries.
- Added two read replicas and routed catalogue and search-index reads to them.
- Kept carts, checkout and account settings on the primary.
- Implemented read-your-writes for sellers editing listings (their dashboard read from the primary for 30 seconds after edits).
- Primary CPU dropped to 35%, and browse latency improved."

#### A third worked example: an incident caused by lag
"A nightly batch job wrote millions of rows, causing replicas to lag by 10 minutes. A background job read 'unprocessed' records from a replica, didn't see items just marked processed, and processed them twice. Fixes: the job now reads from the primary (or verifies with a conditional update), the batch job was throttled, and we alert when lag exceeds 30 seconds."

#### Replication modes
| Mode | Data loss on failover | Write latency | Notes |
|---|---|---|---|
| Asynchronous | Possible (recent writes) | Low | Most common |
| Synchronous | None (for acknowledged commits) | Higher | Needs healthy sync replicas |
| Semi-synchronous | Minimal | Moderate | Waits for one replica ack |

#### Step-by-step framework
1. **Explain leader–follower replication.**
2. **Compare sync vs async.**
3. **Describe read scaling** and what goes where.
4. **Address replication lag** (read-your-writes, monotonic reads).
5. **Explain failover** and split-brain risks.
6. **Monitor** lag and health.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add replicas to scale" | Explains what reads can go to replicas |
| Ignores lag | Read-your-writes and lag-aware routing |
| Assumes failover is free | Discusses data loss and split brain |
| No monitoring | Monitors lag and failovers |

#### Useful phrases
- "Writes go to the primary; replicas stream its write-ahead log."
- "With asynchronous replication, replicas can lag, so reads may be stale."
- "After a user writes, we read from the primary for a short window."
- "Failover with async replication can lose the last few writes."

#### Common pitfalls
- **Sending consistency-critical reads to replicas.**
- **Ignoring replication lag spikes** during batch jobs.
- **Assuming zero data loss** with async failover.
- **Applications hard-coding** the primary's address.

#### Follow-ups to expect (with sample answers)
- **"What's the difference between replication and sharding?"**
  "Replication copies the same data to multiple nodes (for reads and availability); sharding splits different data across nodes (for write scaling and size)."
- **"How do replicas help with backups?"**
  "Backups can be taken from replicas to avoid load on the primary, but replicas aren't backups themselves. Mistakes replicate too."
- **"What is multi-leader replication?"**
  "Several nodes accept writes (e.g. per region), syncing with each other; it needs conflict resolution and is more complex."

#### What senior interviewers look for
- **Consistency trade-offs** in application design.
- **Operational readiness** for failover.
- **Capacity planning** with replicas.

#### Practise it
1. Explain sync vs async replication and the failover risk, out loud.
2. Design read-your-writes for a profile update flow.
3. List which queries in an e-commerce app can go to replicas.
