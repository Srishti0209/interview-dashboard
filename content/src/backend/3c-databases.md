# Backend Engineer — Databases & Storage (continued)

## Data modelling exercise: a social app
- id: be-db-13
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: data modelling, schema design, relationships, indexes

### Prompt
Design the database schema for a social app where users create posts, follow each other, like and comment on posts, and see a feed. Walk through tables, keys, indexes and trade-offs.

### Answer
#### What the interviewer is really testing
- Translating requirements into **entities and relationships**.
- Choosing **keys, constraints and indexes** based on queries.
- Handling **many-to-many** relationships and **counters** at scale.
- Recognising which parts belong in **other stores** (feed cache, search, media).

#### Key points
- Start from **entities**: users, posts, follows, likes, comments, media.
- Model **many-to-many** with join tables: `follows(follower_id, followee_id)`, `likes(user_id, post_id)`.
- **Composite primary keys** on join tables enforce uniqueness (no double likes/follows).
- **Indexes from queries**: posts by author and time, followers of a user, who a user follows, comments on a post by time.
- **Counters** (likes, followers) are denormalised for fast reads, updated transactionally or asynchronously, with reconciliation.
- **Soft deletes** and **privacy** flags; media in object storage; feeds in a cache; search in a search engine.
- Use **time-sortable IDs** (Snowflake/ULID) for pagination and sharding.

#### Model answer
"**1. Requirements and key queries**
- Show a user's profile with follower/following counts and their posts (newest first).
- Show a post with like count, whether the viewer liked it, and comments (paginated).
- Follow/unfollow, like/unlike, comment, delete own content.
- Home feed of posts from followed users (served from a feed cache, but built from these tables).

**2. Schema (PostgreSQL)**
```sql
users (
  id            bigint PRIMARY KEY,          -- Snowflake-style, time-sortable
  username      citext UNIQUE NOT NULL,
  display_name  text NOT NULL,
  bio           text,
  is_private    boolean NOT NULL DEFAULT false,
  follower_count  int NOT NULL DEFAULT 0,
  following_count int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

posts (
  id          bigint PRIMARY KEY,
  author_id   bigint NOT NULL REFERENCES users(id),
  body        text,
  media_keys  text[],                         -- object storage keys
  like_count  int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  visibility  text NOT NULL DEFAULT 'public',
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_author_created ON posts (author_id, created_at DESC) WHERE deleted_at IS NULL;

follows (
  follower_id bigint NOT NULL REFERENCES users(id),
  followee_id bigint NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)       -- who do I follow?
);
CREATE INDEX follows_followee ON follows (followee_id, follower_id);  -- who follows me?

likes (
  user_id    bigint NOT NULL REFERENCES users(id),
  post_id    bigint NOT NULL REFERENCES posts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)               -- did viewer like post? list likers
);
CREATE INDEX likes_user ON likes (user_id, created_at DESC);         -- posts I liked

comments (
  id         bigint PRIMARY KEY,
  post_id    bigint NOT NULL REFERENCES posts(id),
  author_id  bigint NOT NULL REFERENCES users(id),
  body       text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_created ON comments (post_id, created_at);
```

**3. Key design decisions**
- **Composite primary keys** on `follows` and `likes` prevent duplicates at the database level, so double-tapping 'like' can't create two likes.
- **Two indexes for follows** support both directions (followers and following).
- **Counters** (`like_count`, `follower_count`) avoid `COUNT(*)` on every view. Updated in the **same transaction** as the like/follow insert at moderate scale; at very high scale (celebrity posts), updated asynchronously via events to avoid hot-row contention, with periodic reconciliation.
- **Soft deletes** (`deleted_at`) allow moderation, undo, and cleanup jobs; partial indexes exclude deleted rows.
- **Time-sortable IDs** support cursor pagination and later sharding by user ID.

**4. What lives elsewhere**
- **Media**: object storage + CDN; only keys in the database.
- **Home feed**: precomputed timelines in Redis (fan-out), rebuilt from these tables if lost.
- **Search**: users and posts indexed into a search engine via CDC.
- **Notifications**: separate service/table.

**5. Scaling path**
- Read replicas for profile and post reads; caching for hot posts and profiles.
- Shard by `user_id` later (posts by author, follows by follower), with global lookups (username → user ID) in a separate table."

#### Another worked example: adding private accounts
"With private accounts, follows need approval:
- Add `status` to `follows` (`pending`, `accepted`) or a separate `follow_requests` table.
- Post visibility checks: a viewer can see a private user's posts only if an accepted follow exists. This check must happen on every read path (profile, feed hydration, search results).
- Indexes on `(followee_id, status)` support listing pending requests."

#### A third worked example: hot counters on viral posts
"A viral post received 50,000 likes per minute. Updating `like_count` in the same transaction as each like created heavy contention on one row. We switched to inserting likes immediately (unique per user), publishing an event, and incrementing a Redis counter; a worker flushed aggregated counts to the database every few seconds. Displayed counts were slightly delayed but the database stayed healthy."

#### Variations you might be asked
- "How would you model reposts/shares?": a `reposts(user_id, post_id, created_at)` table, or posts with an `original_post_id` reference.
- "How do you model hashtags?": `hashtags(id, tag)` and `post_hashtags(post_id, hashtag_id)` join table, plus search indexing.
- "How do you model blocks?": a `blocks(blocker_id, blocked_id)` table checked on reads, follows and messaging.

#### Query → index mapping
| Query | Index |
|---|---|
| A user's posts, newest first | `posts(author_id, created_at DESC)` |
| Who I follow | `follows PK (follower_id, followee_id)` |
| Who follows me | `follows(followee_id, follower_id)` |
| Did viewer like this post? | `likes PK (post_id, user_id)` |
| Comments on a post | `comments(post_id, created_at)` |

#### Step-by-step framework
1. **List entities and key queries.**
2. **Define tables, keys and constraints.**
3. **Model many-to-many** with join tables and composite keys.
4. **Add indexes** per query.
5. **Decide on counters** and their consistency.
6. **Move non-relational concerns** to other stores.
7. **Plan the scaling path.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Stores likes as an array on posts | Join table with composite primary key |
| `COUNT(*)` on every page view | Denormalised counters with reconciliation |
| No indexes discussed | Indexes mapped to specific queries |
| Media blobs in the database | Object storage keys |
| Ignores privacy and deletes | Visibility rules and soft deletes |

#### Useful phrases
- "The composite primary key on likes prevents duplicate likes at the database level."
- "I need two indexes on follows, one for each direction."
- "Counters are denormalised, updated transactionally at first and asynchronously at scale."
- "The feed is a cache built from these tables, not the source of truth."

#### Common pitfalls
- **Arrays of IDs** instead of join tables.
- **Missing reverse-direction indexes.**
- **Hot-row contention** on counters.
- **Forgetting privacy checks** on all read paths.
- **No soft delete / moderation** strategy.

#### Follow-ups to expect (with sample answers)
- **"How would you show 'friends who also liked this'?"**
  "Intersect the viewer's following list with the post's likers, usually computed for small sets or precomputed for popular posts."
- **"How do you delete a user and their data (GDPR)?"**
  "A deletion workflow: anonymise or delete posts, comments, likes and follows in batches, purge media, remove from search and caches, and log completion."
- **"Would you use a graph database?"**
  "For complex graph queries (recommendations, multi-hop paths) maybe as a secondary store; basic follows work fine relationally."

#### What senior interviewers look for
- **Query-driven** schema design.
- **Scaling and contention** awareness.
- **Privacy, moderation and data lifecycle** considerations.

#### Practise it
1. Draw the entity-relationship diagram for this app from memory.
2. Write indexes for five key queries and explain each.
3. Explain how counters stay accurate at scale, out loud.

## Backups, point-in-time recovery and restore testing
- id: be-db-14
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: backups, disaster recovery, RPO, RTO, operations

### Prompt
How do you design a backup and recovery strategy for a production database? How would you recover if someone accidentally deleted a large amount of data?

### Answer
#### What the interviewer is really testing
- Understanding of **RPO** (how much data you can lose) and **RTO** (how fast you must recover).
- Knowledge of **full backups, incremental/WAL archiving and point-in-time recovery (PITR)**.
- Recognising that **replicas are not backups**.
- The importance of **restore testing**, security and retention.

#### Key points
- **RPO** (Recovery Point Objective): maximum acceptable data loss (e.g. 5 minutes).
- **RTO** (Recovery Time Objective): maximum acceptable downtime (e.g. 1 hour).
- **Full backups** (daily snapshots) + **continuous WAL/binlog archiving** enable **point-in-time recovery**.
- **Replicas copy mistakes too**: a `DELETE` replicates instantly, so replicas don't replace backups (delayed replicas can help).
- Store backups **off-site / cross-region**, **encrypted**, with restricted access, and **immutable** copies (protection against ransomware or malicious deletion).
- **Test restores regularly**: an untested backup is not a backup.
- **Retention policy** balancing compliance and cost.

#### Model answer
"I'd start from the business requirements: **RPO** and **RTO**. For an e-commerce orders database, perhaps RPO = 5 minutes and RTO = 1 hour.

**Backup strategy:**
1. **Daily full backups / snapshots** of the database.
2. **Continuous archiving** of the write-ahead log (PostgreSQL WAL, MySQL binlog) to object storage, every few seconds or per segment. Combined with full backups, this enables **point-in-time recovery (PITR)** to any moment within the retention window.
3. **Storage**: backups in a **separate account/region**, **encrypted**, with **immutable/object-lock** copies so even an attacker with production credentials can't delete them.
4. **Retention**: e.g. 35 days of PITR, monthly backups kept for a year (depending on compliance).
5. Managed databases (RDS, Cloud SQL, Aurora) provide much of this. I'd still verify settings and test restores.

**Replicas are not backups.** If someone runs `DELETE FROM orders WHERE ...` with a wrong condition, the delete replicates to every replica within milliseconds. A **delayed replica** (e.g. lagging 1 hour) can offer a quick safety net, but backups with PITR are the real protection.

**Recovering from accidental deletion** (e.g. a bad migration deleted 2 million orders at 14:32):
1. **Stop the damage**: halt the job or deployment; consider putting affected features in maintenance mode.
2. **Identify the exact time** of the bad operation from logs or audit trails.
3. **Restore to a new instance** using PITR to just before the deletion (e.g. 14:31:59). Don't overwrite production.
4. **Extract the missing data** from the restored copy and **carefully merge** it back into production (because legitimate writes have happened since 14:32). Use scripts with checks, ideally reviewed by a second engineer.
5. **Verify** with counts and spot checks; communicate with stakeholders.
6. **Post-mortem**: why was the bad operation possible? Add safeguards: reviewed migrations, `LIMIT`ed batch deletes, soft deletes, least-privilege credentials.

**Restore testing:**
- Automate a **regular restore drill** (e.g. weekly): restore the latest backup to an isolated environment, run integrity checks and sample queries, and measure how long it took (to validate RTO).
- Track backup job success and alert on failures or missing WAL segments.

**Other considerations:** logical backups (e.g. `pg_dump`) for smaller databases or specific tables; backup security (access controls, audit logs); documented runbooks so anyone on call can follow them."

#### Another worked example: a ransomware scenario
"Attackers gain access to cloud credentials and delete databases and their backups in the same account. Protection: backups replicated to a **separate account** with **object lock** (immutable for N days), break-glass access procedures, and alerts on backup deletion attempts. Recovery then uses the isolated, immutable copies."

#### A third worked example: discovering untested backups
"During a restore drill, a team discovered their nightly backup had been silently failing for three weeks due to a permissions change. Because drills ran weekly, they caught it before it mattered. They added alerts for backup job failures and for the age of the latest successful backup."

#### Variations you might be asked
- "How would you back up a sharded database?": coordinated snapshots per shard plus log archiving, and recovery tooling that restores shards consistently.
- "How do you back up Redis or other caches?": often you don't need to; if Redis holds important data, use persistence and snapshots to durable storage.
- "How do you comply with 'right to be forgotten' with backups?": document that deleted data expires from backups within the retention period, and re-apply deletions if a backup is restored.

#### Key concepts
| Concept | Meaning |
|---|---|
| RPO | Max acceptable data loss |
| RTO | Max acceptable downtime |
| Full backup | Complete copy at a point in time |
| WAL/binlog archiving | Continuous change log |
| PITR | Restore to any moment in the window |
| Delayed replica | Replica intentionally behind, for quick undo |
| Immutable backup | Cannot be altered or deleted for a period |

#### Step-by-step framework
1. **Define RPO and RTO** with the business.
2. **Full backups + log archiving** for PITR.
3. **Secure, off-site, immutable** storage.
4. **Retention** policy.
5. **Regular restore testing** and monitoring.
6. **Runbooks** for recovery scenarios.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We have replicas" | Knows replicas replicate mistakes |
| Nightly backup only | Full backups + log archiving for PITR |
| Restores over production | Restores to a new instance and merges carefully |
| Never tests restores | Automated restore drills measuring RTO |
| Backups in same account | Separate, encrypted, immutable copies |

#### Useful phrases
- "Replicas replicate mistakes instantly, so they're not backups."
- "With WAL archiving, we can restore to one second before the bad delete."
- "I'd restore to a separate instance and merge the missing data back."
- "An untested backup isn't a backup."

#### Common pitfalls
- **Relying on replicas as backups.**
- **Never testing restores.**
- **Backups in the same failure domain.**
- **Overwriting production during recovery.**
- **No alerts** on backup failures.

#### Follow-ups to expect (with sample answers)
- **"How do you reduce RTO for large databases?"**
  "Snapshots on fast storage, parallel restores, pre-provisioned standby infrastructure, and practising the procedure."
- **"What's the difference between a snapshot and a logical backup?"**
  "Snapshots copy storage blocks (fast, whole database); logical backups export data as SQL/data files (portable, slower, good for specific tables)."
- **"How long should you keep backups?"**
  "Based on compliance, business needs and cost, e.g. 30 days PITR plus monthly archives for a year."

#### What senior interviewers look for
- **Business-aligned** recovery objectives.
- **Security** against malicious deletion.
- **Operational rigour**: drills, runbooks, monitoring.

#### Practise it
1. Define RPO and RTO for three systems (payments, analytics, internal wiki) and justify them.
2. Write the recovery steps for an accidental mass delete.
3. Explain why replicas aren't backups, out loud.

## Full-text search and inverted indexes
- id: be-db-15
- round: DATABASES_STORAGE
- difficulty: medium
- levels:
- tags: search, inverted index, Elasticsearch, relevance

### Prompt
Users need to search products by keywords with typo tolerance and relevance ranking. How does full-text search work, and how would you build it?

### Answer
#### What the interviewer is really testing
- Understanding of **inverted indexes**, **tokenisation** and **relevance scoring** (e.g. BM25).
- Knowing when **database full-text search** is enough vs a **search engine**.
- **Keeping the search index in sync** with the primary database.
- Handling **typos, synonyms, filters, facets** and **relevance tuning**.

#### Key points
- **Inverted index**: maps each **term** to the list of documents containing it (like a book's index).
- **Analysis**: tokenisation, lowercasing, stop words, **stemming/lemmatisation** ("running" → "run"), synonyms.
- **Relevance scoring**: **TF-IDF / BM25**: terms that are frequent in a document but rare overall score higher; boost fields (title over description).
- **Typo tolerance**: fuzzy matching (edit distance), n-grams.
- Options: **PostgreSQL full-text search** (tsvector, GIN) for moderate needs; **Elasticsearch/OpenSearch**, **Solr**, Meilisearch, Typesense for richer search.
- Sync via **CDC or events** from the primary database; search index is a **derived store**, rebuildable.

#### Model answer
"**How full-text search works.** A database `LIKE '%shoe%'` query scans every row and can't rank results. Search engines build an **inverted index**:
- Each document (product) is **analysed**: text is split into tokens, lowercased, stop words removed, words stemmed ('running shoes' → 'run', 'shoe').
- The index maps **term → list of document IDs** (plus positions and frequencies).
- A query is analysed the same way; the engine looks up each term's document list and combines them quickly.

**Relevance.** Results are scored, typically with **BM25**:
- Documents mentioning the query terms **more often** score higher (with diminishing returns).
- **Rare terms** (e.g. 'waterproof') matter more than common ones (e.g. 'shoe').
- Shorter fields where the term appears are weighted more.
- I'd add **field boosts** (title > brand > description) and **business signals** (popularity, in stock, rating) carefully.

**Building product search:**
1. **Choose the engine**: for a large catalogue with typo tolerance, facets and relevance tuning, **Elasticsearch/OpenSearch** (or a managed search service). For a small app, PostgreSQL full-text search with a GIN index may be enough.
2. **Index design**: fields like `title` (analysed, boosted), `brand` (keyword + analysed), `description`, `category` (keyword, for filters/facets), `price` (numeric for ranges), `in_stock`, `popularity`.
3. **Analysis**: language-specific analysers, synonyms ('trainers' ↔ 'sneakers'), and **fuzzy matching** (e.g. edit distance 1–2) for typos; edge n-grams for prefix matching/autocomplete.
4. **Queries**: a multi-field query with boosts, filters (category, price range, in stock) as non-scoring filters, and **facets** (aggregations) to show counts per brand/category.
5. **Sync**: the primary database remains the source of truth. Changes flow via **CDC** (e.g. Debezium) or domain events into an indexing service that updates the search index. A **full reindex** job can rebuild the index from scratch (using index aliases to swap atomically with zero downtime).
6. **Relevance tuning**: track search analytics (click-through, zero-result queries, conversions), test changes with A/B tests, maintain synonym lists.

**Trade-offs**: search indexes are **eventually consistent** (a new product may take seconds to appear); the search cluster is another system to operate and size."

#### Another worked example: PostgreSQL full-text search
"For an internal knowledge base with 50,000 articles:
```sql
ALTER TABLE articles ADD COLUMN search tsvector
  GENERATED ALWAYS AS (setweight(to_tsvector('english', title), 'A') ||
                       setweight(to_tsvector('english', body), 'B')) STORED;
CREATE INDEX articles_search_idx ON articles USING GIN (search);
SELECT id, title FROM articles
WHERE search @@ websearch_to_tsquery('english', 'reset password')
ORDER BY ts_rank(search, websearch_to_tsquery('english', 'reset password')) DESC
LIMIT 20;
```
No extra infrastructure, transactional consistency, good enough relevance for this scale. Add `pg_trgm` for typo tolerance."

#### A third worked example: reindexing without downtime
"We changed the analyser to add synonyms. Rather than modifying the live index, we created a new index (`products_v2`) with the new settings, bulk-indexed all products from the database while CDC kept both indexes updated, compared results on sample queries, then switched the `products` alias from v1 to v2 atomically. Rollback meant switching the alias back."

#### Variations you might be asked
- "How do you handle search across multiple languages?": separate fields or indexes per language with language-specific analysers.
- "How would you implement 'did you mean?'": suggesters based on term frequencies and edit distance, or query logs of successful corrections.
- "How do you personalise search results?": add user-specific signals (past purchases, preferences) as boosts, carefully tested to avoid over-personalisation.

#### Options compared
| Option | Strengths | Limitations |
|---|---|---|
| SQL `LIKE` | Simple | Slow, no ranking, no stemming |
| PostgreSQL FTS (+ pg_trgm) | No extra system, consistent | Less flexible relevance and scale |
| Elasticsearch/OpenSearch | Rich features, scalable, facets | Operational overhead, eventual consistency |
| Hosted search (Algolia, etc.) | Fast to build, typo tolerance built in | Cost, less control |

#### Step-by-step framework
1. **Clarify needs**: scale, typos, facets, languages, relevance.
2. **Choose engine** (DB FTS vs search engine).
3. **Design fields and analysers.**
4. **Build queries**: boosts, filters, facets, fuzziness.
5. **Sync** from the source of truth (CDC/events) and support reindexing.
6. **Measure and tune** relevance.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `WHERE name LIKE '%term%'` | Inverted index with analysis and ranking |
| No relevance discussion | BM25, field boosts, business signals |
| Dual writes from app code | CDC/events with rebuildable index |
| Reindex in place | New index + alias swap |
| No measurement | Tracks zero-result queries and click-through |

#### Useful phrases
- "An inverted index maps each term to the documents containing it."
- "BM25 rewards terms that are frequent in a document but rare across the catalogue."
- "The database is the source of truth; the search index is derived and rebuildable."
- "We reindex into a new index and swap the alias for zero downtime."

#### Common pitfalls
- **LIKE queries** at scale.
- **Search engine as the source of truth.**
- **Dual writes** causing drift.
- **Ignoring relevance tuning** and analytics.
- **Over-engineering** small search needs.

#### Follow-ups to expect (with sample answers)
- **"What's stemming?"**
  "Reducing words to a root form ('running', 'runs' → 'run') so variations match."
- **"How does fuzzy matching work?"**
  "It matches terms within a small edit distance (insertions, deletions, substitutions), e.g. 'shoos' → 'shoes'."
- **"How do you keep search fast as the catalogue grows?"**
  "Shard and replicate the index, use filters efficiently, cache popular queries, and monitor query latency."

#### What senior interviewers look for
- **Search fundamentals** plus **product thinking** on relevance.
- **Data pipeline** reliability (CDC, reindexing).
- **Right-sizing** the solution.

#### Practise it
1. Draw a tiny inverted index for three product titles.
2. Design the field mappings for a product search index.
3. Explain how search stays in sync with the database, out loud.
