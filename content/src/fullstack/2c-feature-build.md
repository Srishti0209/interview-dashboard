# Full Stack Engineer — Feature Build (continued)

## Build a notifications inbox with unread counts
- id: fs-build-07
- round: FULLSTACK_FEATURE_BUILD
- difficulty: medium
- levels:
- tags: notifications, unread counts, real-time, pagination, fan-out

### Prompt
Build an in-app notifications inbox: a bell icon with an unread count, a dropdown listing recent notifications, "mark as read" (single and all), and new notifications appearing live. Cover the data model, the API, delivery and the UI.

### Answer
#### What the interviewer is really testing
- A data model that makes **unread counts cheap** and "mark all as read" fast.
- **Creating notifications** from other parts of the system without coupling (events, jobs).
- **Live delivery** and keeping the badge correct across tabs and devices.
- **UI details**: optimistic mark-as-read, grouping, pagination, accessibility of the bell and dropdown.
- **Scale and fan-out** for notifications sent to many users at once.

#### Key points
- Table `notifications(id, user_id, type, actor_id, entity_type, entity_id, data jsonb, created_at, read_at)` with an index on `(user_id, created_at desc)` and a **partial index** on `(user_id) where read_at is null` for counts.
- **"Mark all as read"** can be a single update, or a **read watermark** per user (`last_read_at`): everything older is read. The watermark makes the operation O(1) at the cost of losing per-item unread state for old items.
- Create notifications **asynchronously**: domain events (comment created) → a notification worker decides recipients, applies preferences, de-duplicates and inserts rows.
- **Group** similar notifications ("Alex and 4 others liked your post") either at write time (upsert into an aggregate row) or at read time.
- **Live updates**: push `notification.created` and `unread.count` over the user's real-time channel (WebSocket/SSE); fall back to polling the count every 60 seconds.
- Cap the displayed badge ("99+"), and fetch the list lazily when the dropdown opens.

#### Model answer
"**Data model.**
```sql
notifications(
  id bigserial pk, user_id uuid not null, type text not null,      -- 'comment.reply', 'mention', ...
  actor_ids uuid[] not null, entity_type text, entity_id text,
  group_key text, data jsonb, created_at timestamptz default now(),
  updated_at timestamptz default now(), read_at timestamptz);
create index on notifications (user_id, updated_at desc, id desc);
create index notifications_unread on notifications (user_id) where read_at is null;
create unique index on notifications (user_id, group_key) where read_at is null and group_key is not null;
```
The unique partial index lets me **group unread notifications**: a second like on the same post updates the existing unread row (`actor_ids` appended, `updated_at` bumped) instead of creating a new one.

**Creating notifications.** The comments service emits `comment.created`. A notification worker consumes it:
1. Decide recipients (post author, people mentioned, thread participants), minus the actor.
2. Check each recipient's preferences (muted thread, notification type off).
3. Upsert:
```sql
insert into notifications (user_id, type, actor_ids, entity_type, entity_id, group_key, data)
values ($1, 'post.liked', array[$2], 'post', $3, 'post.liked:' || $3, $4)
on conflict (user_id, group_key) where read_at is null and group_key is not null
do update set actor_ids = array_append(notifications.actor_ids, $2), updated_at = now();
```
4. Publish `{ type: 'notification', id }` and the new unread count to the user's channel.
5. Optionally enqueue email/push for users who are offline, after a delay, if still unread.

**API.**
```
GET   /api/notifications?cursor=&limit=20     → { items, nextCursor }
GET   /api/notifications/unread-count         → { count }
POST  /api/notifications/:id/read
POST  /api/notifications/read-all { before: <timestamp of newest item seen> }
```
`read-all` takes a `before` timestamp so a notification arriving while the user clicks isn't wrongly marked read. Counts: `select count(*) from notifications where user_id = $1 and read_at is null` uses the partial index; I'd cap it (`limit 100` inside a subquery) since the UI shows '99+' anyway.

**UI.**
- The bell is a `<button aria-label="Notifications, 3 unread" aria-haspopup="true" aria-expanded>` with a visual badge. The count comes from `useQuery(['notifications','unread'])`.
- Opening the dropdown fetches the first page (`useInfiniteQuery`) and shows items with avatar, rendered text ('Alex and 4 others liked **Launch plan**'), relative time and an unread dot. Clicking navigates to the entity and marks it read.
- **Optimistic mark-as-read**: set `read_at` in the cache and decrement the badge immediately; roll back on error.
- 'Mark all as read' sends the newest `updated_at` as `before` and clears the badge optimistically.
- Live events: on `notification`, invalidate the unread count and prepend the new item if the dropdown's list is loaded; announce 'New notification' in a polite live region (not for every grouped update).
- Text is rendered **from structured data** (`type`, actors, entity title) by a client-side template map, so wording can change and be translated without rewriting stored rows.

**Retention.** Delete read notifications older than 90 days, unread older than a year, with a nightly batch job."

#### Another worked example: a broadcast to 1M users
"An announcement to every user ('New feature: dark mode') shouldn't insert 1M rows synchronously. Options:
- **Fan-out on write in batches**: a job inserts rows in chunks of 5,000 over a few minutes. Simple, and each user's inbox query stays the same.
- **Fan-out on read**: store one `broadcasts` row; the inbox query unions the user's notifications with broadcasts newer than their sign-up date, and read state lives in a small `broadcast_reads(user_id, broadcast_id)` table.
For occasional announcements, fan-out on read is cheaper; for targeted segments of a few thousand users, batched writes are fine."

#### Step-by-step framework
1. **Schema** with indexes for list, unread count and grouping.
2. **Producers → worker**: recipients, preferences, de-dupe/grouping, insert.
3. **API**: list (cursor), count, mark one, mark all with a `before` bound.
4. **Delivery**: real-time push with polling fallback; offline email/push.
5. **UI**: accessible bell, lazy list, optimistic reads, live updates, templates.
6. **Scale & retention**: broadcasts, pruning.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `SELECT COUNT(*)` with no index on every page load | Partial index for unread, capped count, cached in the query client |
| Notifications inserted inside the request that caused them | Event → worker with preferences and grouping |
| 50 rows for 50 likes | Grouped unread notification with an actor list |
| 'Mark all read' races with new arrivals | `before` timestamp bound |
| Stored rendered English sentences | Structured data rendered by templates |
| One million inserts in one request | Batched fan-out or fan-out on read |

#### Useful phrases
- "The unread count uses a partial index, so it stays cheap."
- "Notifications are created by a worker reacting to events, so features don't need to know about the inbox."
- "Unread notifications for the same thing are grouped with an upsert."
- "Mark-all-read takes the newest timestamp the user saw."
- "I store structured data and render text on the client."

#### Common pitfalls
- **Notifying the actor about their own action.**
- **Badge drift** between tabs and devices (refresh the count on focus and on push).
- **Notification spam**: no grouping, no preferences, no rate limits.
- **Leaking content** about entities the user can no longer access (check access when rendering or on click).
- **Unbounded table growth.**

#### Follow-ups to expect (with sample answers)
- **"How do you avoid emailing someone about something they've already seen in the app?"**
  "Queue the email with a delay (say 10 minutes), and when the job runs, skip it if the notification has been read."
- **"How would you add notification preferences?"**
  "A `notification_preferences(user_id, type, channel, enabled)` table with defaults in code; the worker checks it per recipient and channel; a settings page lists types grouped by area."
- **"What about mobile push?"**
  "Store device tokens per user, send through APNs/FCM from the worker for offline users, and remove tokens that the provider reports as invalid."
- **"How do you test grouping?"**
  "Worker tests that two likes on the same post produce one unread row with two actors, and a like after reading creates a new row."

#### What senior interviewers look for
- **Cheap counts** and correct read semantics.
- **Decoupled creation** with preferences and grouping.
- **Consistent badges** across devices.
- Awareness of **fan-out trade-offs**.

#### Practise it
1. Implement the schema and the grouping upsert; test with concurrent likes.
2. Build the bell dropdown with optimistic mark-as-read and an accessible label.
3. Add SSE delivery and watch the badge update in two tabs.
4. Explain fan-out on write versus read to a friend.

## Build a CSV import with progress and error report
- id: fs-build-08
- round: FULLSTACK_FEATURE_BUILD
- difficulty: medium
- levels:
- tags: CSV import, background jobs, validation, progress, streaming, bulk insert

### Prompt
Build a "Import contacts from CSV" feature: users upload a file of up to 200k rows, map columns to fields, see progress while it imports, and get a downloadable report of rows that failed. Cover upload, parsing, validation, the background job and the UI.

### Answer
#### What the interviewer is really testing
- Moving long work into a **background job** with **progress reporting**, rather than a 5-minute HTTP request.
- **Streaming parsing** and **batched writes** so memory and database load stay bounded.
- **Validation design**: row-level errors collected and reported, not "the whole import failed".
- **Idempotency and re-runs**: duplicates, partial failures, retries of the job itself.
- **UX**: column mapping, preview, progress, a useful error report.

#### Key points
- Upload the file to **object storage** (presigned), then create an **import job** row. A worker processes it; the UI polls or subscribes for progress.
- **Two phases**: (1) a quick **preview** (parse the first ~20 rows, detect headers and delimiter, suggest column mapping); (2) the **full import** after the user confirms the mapping.
- **Stream** the file with a CSV parser (Papa Parse, `csv-parse`) and process in **batches of ~1,000**: validate, normalise, then bulk upsert (`INSERT ... ON CONFLICT`).
- **Row errors** go to an errors file/table with row number, values and reason; the job continues. Abort only on systemic errors (wrong file, too many errors, e.g. > 10%).
- **Progress**: update `processed_rows`, `succeeded`, `failed` on the job row every batch; the UI shows a progress bar based on bytes read or rows.
- **Idempotent**: dedupe on a natural key (email) with upsert; checkpoint the last processed row so a crashed job resumes.
- Watch for **encoding** (UTF-8 with BOM, Windows-1252), **delimiters**, quoted newlines, and **CSV injection** when exporting the report (prefix cells starting with `=`, `+`, `-`, `@`).

#### Model answer
"**Flow.**
```
1. UI: choose file → POST /api/imports { filename, size } → presigned upload → PUT to storage
2. POST /api/imports/:id/preview → worker-less quick parse of first 64 KB
     → { headers, sampleRows, suggestedMapping, delimiter, encoding }
3. UI: user maps columns (Email → email, 'First name' → firstName…), confirms
4. POST /api/imports/:id/start { mapping, options: { updateExisting: true } }
     → job status = queued → worker
5. UI polls GET /api/imports/:id every 2 s (or SSE) → progress
6. Done → summary + 'Download error report (312 rows)'
```

**Schema.**
```sql
imports(id, org_id, user_id, file_key, status queued|running|completed|failed|cancelled,
        mapping jsonb, total_bytes, bytes_read, processed int, created int, updated int,
        failed int, last_row int, error_file_key, started_at, finished_at)
```

**Worker.**
```ts
async function runImport(importId: string) {
  const job = await db.imports.claim(importId);              // status=running, idempotent claim
  const stream = storage.getObjectStream(job.file_key);
  const parser = stream.pipe(stripBom()).pipe(csvParse({ columns: true, relax_column_count: true }));
  const errors = csvWriter(['row', 'email', 'reason']);       // streams to storage
  let batch: Contact[] = [];
  let row = 0;

  for await (const record of parser) {
    row++;
    if (row <= job.last_row) continue;                       // resume after a crash
    const result = ContactRow.safeParse(applyMapping(record, job.mapping));
    if (!result.success) { errors.write([row, record[emailCol], explain(result.error)]); job.failed++; continue; }
    batch.push({ ...normalise(result.data), org_id: job.org_id });
    if (batch.length === 1000) await flush();
    if (await isCancelled(importId)) break;
  }
  await flush();
  await db.imports.finish(importId, { error_file_key: await errors.close() });

  async function flush() {
    if (!batch.length) return;
    const deduped = dedupeByEmail(batch);                    // last row wins within a batch
    const { created, updated } = await db.contacts.upsertMany(deduped); // ON CONFLICT (org_id, email)
    job.created += created; job.updated += updated; job.processed = row; job.last_row = row;
    await db.imports.progress(importId, { ...counts(job), bytes_read: parser.bytesRead });
    batch = [];
  }
}
```
- Memory stays flat: only one batch is held at a time.
- The upsert uses `ON CONFLICT (org_id, email) DO UPDATE` (or `DO NOTHING` if 'update existing' is off), returning `xmax = 0` to tell inserts from updates.
- If the error rate after the first 1,000 rows is above 50%, stop and mark the job `failed` with 'Most rows are invalid; check your column mapping'.
- The job runs in a queue (BullMQ, SQS + worker, or a Postgres-backed queue) with a single concurrent import per org to protect the database.

**UI.**
- **Step 1: Upload** with a drop zone; accept `.csv`, max 50 MB.
- **Step 2: Map columns**: a table of the file's headers with a select for each ('Email', 'First name', 'Don't import'), pre-filled from the suggestion; the 5-row preview updates to show mapped values. Required fields must be mapped before 'Start import' enables.
- **Step 3: Progress**: a `<progress>` bar from `bytes_read / total_bytes`, live counts ('12,000 imported · 41 failed'), a Cancel button. The user can navigate away; a banner elsewhere in the app shows the running import, and they get a notification when it finishes.
- **Step 4: Summary**: created / updated / failed counts and a link to download the error report CSV, with each row's original number and a human reason ('Email is not valid', 'Missing required field: Last name').
- The import history page lists past imports and their reports."

#### Another worked example: parsing in the browser instead
"For small files (say under 5 MB / 10k rows), I'd parse in the browser with Papa Parse in a Web Worker, show validation errors inline before anything is sent, let the user fix or skip rows, then send the clean rows to `POST /api/contacts/bulk` in batches of 500 with a progress bar. It's a nicer experience (instant feedback, no waiting for a job) but doesn't scale to 200k rows or survive closing the tab, so I'd use it only below a size threshold and keep the server path for big files."

#### Step-by-step framework
1. **Upload to storage**, create the import record.
2. **Preview**: headers, delimiter, encoding, suggested mapping.
3. **Mapping UI** with required-field checks and live preview.
4. **Background job**: stream, validate per row, batch upsert, checkpoint.
5. **Error report** written as a stream; abort on systemic failure.
6. **Progress** via job row + polling/SSE; cancel support.
7. **Summary and history**; notification on completion.
8. **Safety**: per-org concurrency, CSV injection in exports, encoding.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Parses the whole file in the HTTP request | Background job with progress |
| `readFile` into memory | Streaming parser and fixed-size batches |
| One `INSERT` per row | Batched upserts |
| First invalid row fails everything | Row-level errors collected; abort only on systemic issues |
| Re-running duplicates contacts | Upsert on a natural key, resumable checkpoint |
| Error report: "312 rows failed" | Downloadable CSV with row numbers and reasons |

#### Useful phrases
- "This is long-running work, so it belongs in a background job with progress, not a request."
- "I stream the file and write in batches of a thousand, so memory stays flat."
- "Bad rows go to an error report; the import keeps going."
- "Upserting on email makes the import safe to re-run."
- "If most rows fail early, the mapping is probably wrong, so I stop and say so."

#### Common pitfalls
- **Timeouts** from doing it synchronously.
- **Encoding bugs**: BOMs in the first header, Excel's Windows-1252 exports.
- **Duplicate emails within the same batch** breaking `ON CONFLICT` ('cannot affect row a second time'); dedupe first.
- **CSV injection** in exported error reports opened in Excel.
- **Overloading the database** with parallel imports.

#### Follow-ups to expect (with sample answers)
- **"How would you let users undo an import?"**
  "Tag created contacts with `import_id`; 'Undo' deletes contacts created by that import (and, if we stored previous values for updates, restores them) within a time window."
- **"How do you handle 5M rows?"**
  "Same design with larger batches, `COPY` into a staging table then a set-based merge, and perhaps splitting the file into chunks processed in parallel with ordered merging."
- **"How do you detect the delimiter and encoding?"**
  "Sniff the first few KB: count candidate delimiters per line for consistency; detect a BOM; try UTF-8 and fall back to Windows-1252 if decoding fails; let the user override."
- **"How do you test it?"**
  "Fixture CSVs covering quotes, newlines in fields, BOMs, bad rows and duplicates; a test that a killed worker resumes without duplicates."

#### What senior interviewers look for
- **Background job thinking**: progress, cancel, resume, idempotency.
- **Bounded resources**: streaming and batching.
- **User-centred error reporting**.
- Awareness of **CSV's real-world messiness**.

#### Practise it
1. Write a streaming import with `csv-parse` and batched upserts; import 200k generated rows and watch memory.
2. Kill the worker mid-import and confirm it resumes without duplicates.
3. Build the column mapping step with a live preview.
4. Explain CSV injection to a friend and how you'd prevent it.

## Build an optimistic "like" button backed by an API
- id: fs-build-09
- round: FULLSTACK_FEATURE_BUILD
- difficulty: easy
- levels:
- tags: optimistic updates, idempotency, counters, React Query, race conditions

### Prompt
Build a "like" button for posts: clicking toggles the like instantly, the count updates, and it stays correct even with fast repeated clicks, slow networks and multiple tabs. You write the endpoint, the database side and the React component.

### Answer
#### What the interviewer is really testing
- **Idempotent API design**: "set liked = true/false" instead of "toggle".
- **Optimistic updates** with correct rollback.
- **Race conditions**: fast double clicks, out-of-order responses.
- **Counter correctness** at the database level (unique constraint, maintained counts).
- **Accessibility** of a toggle button.

#### Key points
- Model likes as rows: `likes(user_id, post_id, created_at, primary key (user_id, post_id))`. The primary key makes duplicate likes impossible.
- Use **idempotent endpoints**: `PUT /posts/:id/like` (like) and `DELETE /posts/:id/like` (unlike). Repeating either has the same effect. A "toggle" endpoint is not idempotent and breaks under retries.
- **Counts**: store `like_count` on `posts`, updated in the same transaction when a row is actually inserted/deleted (check affected rows), or computed from `likes` with caching. For very hot posts, count in Redis and flush.
- **Client**: update the cache immediately, send the request for the **desired final state**, and **serialise or coalesce** rapid clicks so the last intent wins. On error, roll back to the server state.
- Return the **authoritative** `{ liked, likeCount }` from the server and reconcile.
- Toggle button: `<button aria-pressed>`, with an accessible name including the count.

#### Model answer
"**Database.**
```sql
create table likes (user_id uuid, post_id uuid, created_at timestamptz default now(),
                    primary key (user_id, post_id));
alter table posts add column like_count int not null default 0;
```

**API.**
```ts
app.put('/api/posts/:id/like', requireUser, async (req, res) => {
  const result = await db.tx(async (t) => {
    const ins = await t.query(
      `insert into likes (user_id, post_id) values ($1, $2) on conflict do nothing`,
      [req.user.id, req.params.id]);
    if (ins.rowCount === 1)
      await t.query(`update posts set like_count = like_count + 1 where id = $1`, [req.params.id]);
    return t.one(`select like_count from posts where id = $1`, [req.params.id]);
  });
  res.json({ liked: true, likeCount: result.like_count });
});

app.delete('/api/posts/:id/like', requireUser, async (req, res) => {
  const result = await db.tx(async (t) => {
    const del = await t.query(`delete from likes where user_id = $1 and post_id = $2`,
                              [req.user.id, req.params.id]);
    if (del.rowCount === 1)
      await t.query(`update posts set like_count = like_count - 1 where id = $1`, [req.params.id]);
    return t.one(`select like_count from posts where id = $1`, [req.params.id]);
  });
  res.json({ liked: false, likeCount: result.like_count });
});
```
Only an actual insert/delete changes the counter, so retries and double requests can't skew it. (A nightly job could reconcile `like_count` against `count(*)` as a safety net.)

**Client.** The tricky part is fast clicking: like → unlike → like within 300 ms. If each click fires a request, responses can arrive out of order and the final state can be wrong. I coalesce: the UI flips instantly, and a small per-post controller sends only the **latest desired state**, one request at a time.
```tsx
function useLike(postId: string) {
  const qc = useQueryClient();
  const desired = useRef<boolean | null>(null);
  const inFlight = useRef(false);

  async function sync() {
    if (inFlight.current || desired.current === null) return;
    inFlight.current = true;
    const want = desired.current;
    desired.current = null;
    try {
      const res = await (want ? api.put : api.delete)(`/api/posts/${postId}/like`);
      if (desired.current === null) qc.setQueryData(['post', postId], (p: Post) => ({ ...p, ...res }));
    } catch {
      desired.current = null;
      qc.invalidateQueries({ queryKey: ['post', postId] });   // fall back to server truth
      toast('Couldn\'t update like. Please try again.');
    } finally {
      inFlight.current = false;
      if (desired.current !== null) sync();                  // user clicked again meanwhile
    }
  }

  return () => {
    qc.setQueryData(['post', postId], (p: Post) => ({
      ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) }));
    desired.current = qc.getQueryData<Post>(['post', postId])!.liked;
    sync();
  };
}
```
- The UI always reflects the user's latest click.
- At most one request per post is in flight; when it returns, if the user clicked again, the latest desired state is sent next.
- The server's response is applied only if no newer intent is pending, so it can't overwrite a newer optimistic state.

**Component.**
```tsx
<button type="button" aria-pressed={post.liked} onClick={toggle}
        aria-label={`${post.liked ? 'Unlike' : 'Like'} post, ${post.likeCount} likes`}>
  <HeartIcon filled={post.liked} aria-hidden /> <span aria-hidden>{formatCount(post.likeCount)}</span>
</button>
```
**Multiple tabs**: refetch on focus; or a `BroadcastChannel` message after a successful mutation so other tabs update the same post."

#### Another worked example: a viral post with 50k likes a minute
"Updating one `posts` row 800 times a second creates lock contention on that row. I'd keep the `likes` rows (needed for 'did I like this?') but move the counter: increment a Redis counter `post:{id}:likes` on each real insert/delete and flush it to Postgres every few seconds, or use a sharded counter table (`post_like_counts(post_id, shard, count)` with a random shard per write, summed on read). Displayed counts on viral posts are rounded ('12.4k') anyway, so a few seconds of lag is invisible."

#### Step-by-step framework
1. **Schema**: likes table with a composite primary key; count column.
2. **Idempotent endpoints**: PUT/DELETE, not toggle.
3. **Counter updates** only on real changes, in the same transaction.
4. **Return authoritative state**.
5. **Client**: optimistic flip, coalesced latest intent, reconcile, rollback.
6. **Accessibility**: `aria-pressed`, labelled count.
7. **Scale**: hot rows → Redis or sharded counters.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `POST /toggle-like` | Idempotent `PUT`/`DELETE` |
| `UPDATE posts SET like_count = like_count + 1` on every request | Counter changes only when a row was inserted/deleted |
| No uniqueness, so double likes | Composite primary key |
| Each click fires a request; responses race | Coalesced latest intent; one in-flight request |
| Error leaves UI in the wrong state | Rollback via refetch, with a message |
| `<div onClick>` heart icon | `<button aria-pressed>` with a label |

#### Useful phrases
- "I'd make the API idempotent: send the state you want, not 'toggle'."
- "The primary key makes a double like impossible."
- "The counter only changes when the row actually changes."
- "The client sends the latest intent and never lets an old response overwrite a newer click."
- "For viral posts I'd move the counter off the hot row."

#### Common pitfalls
- **Toggle endpoints** that flip twice on a retry.
- **Drifting counters** from counting requests instead of changes.
- **Out-of-order responses** reverting the UI.
- **Optimistic counts going negative** from bad arithmetic on stale state.
- **Unlabelled icon buttons.**

#### Follow-ups to expect (with sample answers)
- **"How do you show 'liked by Alex and 3 friends'?"**
  "Query likes for the post joined with the viewer's following list, limited to a few names, cached per viewer briefly; it's a read-time personalisation."
- **"Would you use a mutation library's built-in optimistic updates?"**
  "Yes for simple cases (`onMutate`, `onError` rollback, `onSettled` invalidate). For rapid toggles, I'd still add coalescing or cancel the previous mutation, because rollbacks can otherwise fight each other."
- **"How do you test the race?"**
  "A component test with a mocked API that delays responses differently; click three times quickly; assert the final UI and the last request match the last click."
- **"Can the count be stale?"**
  "Yes, by design for others' likes. My own like is always reflected instantly; others' arrive on refetch or via a real-time update if the page subscribes."

#### What senior interviewers look for
- **Idempotency** as the default instinct.
- **Database correctness** under concurrency.
- A **thoughtful optimistic UI** that handles races, not just the happy path.
- Knowing the **hot-row** problem and its fixes.

#### Practise it
1. Build the endpoints and hammer them with 100 concurrent PUTs; the count must go up by exactly one.
2. Implement the coalescing hook and test rapid clicks with a 2-second network delay.
3. Implement a sharded counter and compare throughput.
4. Explain to a friend why toggle endpoints are dangerous.

## Build a Stripe-style checkout with webhooks
- id: fs-build-10
- round: FULLSTACK_FEATURE_BUILD
- difficulty: hard
- levels: senior, staff
- tags: payments, Stripe, webhooks, idempotency, order state machine, checkout

### Prompt
Build checkout for an online store using a payment provider like Stripe: create the order, take payment, handle 3-D Secure, and fulfil the order reliably even if the user closes the tab after paying. Cover the order model, the API, webhooks and the frontend.

### Answer
#### What the interviewer is really testing
- Knowing that the **webhook, not the browser redirect, is the source of truth** for payment success.
- **Idempotency** everywhere: creating payment intents, handling duplicate webhooks, retrying fulfilment.
- An explicit **order state machine** with valid transitions.
- **Security**: never trusting client amounts, verifying webhook signatures, keeping card data out of your servers (PCI scope).
- **Frontend payment UX**: embedded payment elements, 3-D Secure challenges, clear error and pending states.

#### Key points
- **Server computes the amount** from the cart; creates an **order** (`pending_payment`) and a **PaymentIntent** (or Checkout Session) with the order id in metadata and an **idempotency key** tied to the order.
- **Client** collects card details with the provider's hosted fields/Payment Element (card data never touches your servers), then confirms the payment; the provider handles **3-D Secure** challenges.
- **Webhooks** (`payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`) drive state changes. Verify the **signature**, store processed **event ids** for idempotency, respond `2xx` quickly and do heavy work in a job.
- **Order state machine**: `pending_payment → paid → fulfilling → shipped → delivered`, plus `payment_failed`, `cancelled`, `refunded`. Transitions are conditional updates (`WHERE status = 'pending_payment'`).
- The **return page** shows "Processing…" and polls the order until the webhook has marked it paid; it never marks it paid itself.
- **Reconciliation**: a scheduled job checks for orders stuck in `pending_payment` and queries the provider.
- **Stock**: reserve at order creation with an expiry; release on failure/expiry.

#### Model answer
"**Order model.**
```sql
orders(id uuid pk, user_id, status text not null, currency, subtotal, shipping, tax, total,
       payment_intent_id text unique, reserved_until timestamptz, created_at, updated_at)
order_items(order_id, variant_id, quantity, unit_price)   -- snapshot of prices at purchase
webhook_events(id text pk, type, received_at, processed_at)
```

**1. Create the order and PaymentIntent** (`POST /api/checkout`, idempotency key from the client):
```ts
app.post('/api/checkout', requireUser, async (req, res) => {
  const key = req.get('Idempotency-Key');                       // stable per checkout attempt
  const existing = await db.orders.findByIdempotencyKey(req.user.id, key);
  if (existing) return res.json(await clientSecretFor(existing));

  const order = await db.tx(async (t) => {
    const priced = await priceCart(t, req.user.cartId);        // server-side prices, tax, shipping
    await reserveStock(t, priced.items, { minutes: 15 });       // fails → 409 with details
    return t.orders.insert({ user_id: req.user.id, status: 'pending_payment', ...priced.totals,
                             items: priced.items, idempotency_key: key,
                             reserved_until: addMinutes(now(), 15) });
  });

  const intent = await stripe.paymentIntents.create(
    { amount: order.total, currency: order.currency, metadata: { orderId: order.id },
      automatic_payment_methods: { enabled: true } },
    { idempotencyKey: `order-${order.id}` });
  await db.orders.update(order.id, { payment_intent_id: intent.id });
  res.json({ orderId: order.id, clientSecret: intent.client_secret, total: order.total });
});
```

**2. Frontend.**
```tsx
const stripe = useStripe(); const elements = useElements();
async function pay() {
  setState('submitting');
  const { error } = await stripe.confirmPayment({
    elements, confirmParams: { return_url: `${origin}/orders/${orderId}/complete` },
  });
  // Only reached if there's an immediate error (card declined, validation)
  if (error) { setState('error'); setMessage(error.message); }
}
```
- The **Payment Element** renders card (and wallet) fields in provider iframes; 3-D Secure challenges appear automatically.
- The Pay button shows the server-computed total, is disabled while submitting, and the page warns before leaving during payment.
- On the **return page** `/orders/:id/complete`, the UI shows 'Confirming your payment…' and polls `GET /api/orders/:id` every 2 seconds (up to ~1 minute) until status is `paid` (show confirmation) or `payment_failed` (show 'Payment didn't go through' with a retry button that reuses the same order and intent).

**3. Webhook handler** (`POST /api/webhooks/stripe`, raw body):
```ts
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), WEBHOOK_SECRET); }
  catch { return res.status(400).send('bad signature'); }

  const fresh = await db.query(
    `insert into webhook_events (id, type) values ($1, $2) on conflict do nothing`, [event.id, event.type]);
  if (fresh.rowCount === 0) return res.sendStatus(200);       // duplicate delivery
  await queue.add('stripe-event', { eventId: event.id, type: event.type, object: event.data.object });
  res.sendStatus(200);
});
```
**Job:**
```ts
case 'payment_intent.succeeded': {
  const orderId = obj.metadata.orderId;
  const updated = await db.query(
    `update orders set status = 'paid', updated_at = now()
      where id = $1 and status in ('pending_payment', 'payment_failed') returning *`, [orderId]);
  if (updated.rowCount === 1) {
    await commitStockReservation(orderId);
    await queue.add('fulfil-order', { orderId });            // warehouse, emails, invoices
  }
  break;
}
case 'payment_intent.payment_failed':
  await db.query(`update orders set status = 'payment_failed' where id = $1 and status = 'pending_payment'`, [obj.metadata.orderId]);
  break;
```
The conditional `UPDATE` makes transitions safe even if events arrive twice or out of order (e.g. a late `payment_failed` after a successful retry won't downgrade a `paid` order). If inserting into `webhook_events` succeeds but enqueueing fails, the handler returns 500 and Stripe retries; I'd delete the event row in that case, or insert it in the job instead.

**4. Reconciliation and expiry.**
- Every 10 minutes: orders in `pending_payment` older than 20 minutes → fetch the PaymentIntent; if succeeded, process as if the webhook arrived; if not, cancel the intent and release stock (status `expired`).
- Daily: compare provider payouts/charges with orders for finance."

#### Another worked example: using hosted Checkout Sessions instead
"With Stripe Checkout (a hosted payment page), I create a Checkout Session server-side with line items and `client_reference_id = orderId`, then redirect the browser to Stripe's URL. The user pays there; Stripe redirects back to `success_url`. Fulfilment still happens on the `checkout.session.completed` webhook, with the same idempotent handling. It's less UI control but much less code, built-in wallets and localisation, and minimal PCI scope. For a small team I'd start there and move to embedded elements only if conversion data said the redirect hurt."

#### Step-by-step framework
1. **Server-side pricing** and stock reservation; order in `pending_payment`.
2. **PaymentIntent/Session** with order metadata and an idempotency key.
3. **Client confirmation** with hosted fields; 3-D Secure handled by the provider.
4. **Return page polls**; never marks paid itself.
5. **Webhook**: verify signature, dedupe event ids, enqueue, `200` fast.
6. **State machine** with conditional transitions; fulfilment job.
7. **Reconciliation, expiry and refunds**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Client sends the amount | Server prices the cart and snapshots prices |
| Marks the order paid on the success redirect | Webhook is the source of truth; return page polls |
| Webhook handler does all the work synchronously | Verify, dedupe, enqueue, respond `200` |
| No signature verification | `constructEvent` with the signing secret |
| `UPDATE orders SET status = 'paid'` unconditionally | Conditional transitions in a state machine |
| No plan for missed webhooks | Reconciliation job for stuck orders |

#### Useful phrases
- "The amount is always computed on the server."
- "The webhook decides that an order is paid; the redirect only tells the user to wait."
- "I verify the signature, record the event id, and acknowledge quickly."
- "Transitions are conditional updates, so duplicate or late events are harmless."
- "A reconciliation job catches anything the webhooks missed."

#### Common pitfalls
- **Double fulfilment** from duplicate webhook deliveries.
- **Lost orders** when the user closes the tab after paying (if fulfilment depended on the redirect).
- **Parsing the webhook body as JSON** before verifying the signature (it needs the raw body).
- **Holding stock forever** for abandoned checkouts.
- **Logging card details** or putting them in your own forms (PCI scope).

#### Follow-ups to expect (with sample answers)
- **"How do you handle refunds?"**
  "Admin triggers `refunds.create` with an idempotency key; the `charge.refunded` webhook moves the order to `refunded` (or partially refunded) and restocks if appropriate."
- **"What about multiple currencies and tax?"**
  "Prices per currency stored in minor units; tax computed by a tax service (or Stripe Tax) at pricing time and snapshotted on the order."
- **"How do you test webhooks locally?"**
  "The Stripe CLI forwards test events to localhost; automated tests call the handler with signed fixture payloads, including duplicates and out-of-order events."
- **"What if the user pays twice in two tabs?"**
  "Both tabs share the same order and PaymentIntent via the idempotency key, so only one payment can succeed. If two intents somehow succeed, the reconciliation job flags it and refunds the duplicate."

#### What senior interviewers look for
- **Webhook-driven, idempotent** design as the default.
- A **clear state machine** that tolerates duplicates and reordering.
- **Security and PCI awareness**.
- **Operational completeness**: reconciliation, expiry, refunds, testing.

#### Practise it
1. Build the flow with Stripe test mode and the Payment Element, including a 3-D Secure test card.
2. Use the Stripe CLI to resend the same webhook event and confirm the order is fulfilled once.
3. Close the tab right after paying and check the order still becomes `paid`.
4. Draw the order state machine from memory and explain each transition.
