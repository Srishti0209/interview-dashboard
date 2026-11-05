# Full Stack Engineer — Feature Build (continued)

## Build a file upload with presigned URLs and progress
- id: fs-build-03
- round: FULLSTACK_FEATURE_BUILD
- difficulty: medium
- levels:
- tags: file upload, presigned URLs, S3, progress, XHR, validation

### Prompt
Build an "attach files" feature: users pick or drop files, see per-file progress, can cancel or retry, and the files end up in object storage linked to a record. You write the API and the UI. Walk through the implementation.

### Answer
#### What the interviewer is really testing
- Do you upload **directly to storage** with presigned URLs instead of streaming bytes through your API?
- **Server-side enforcement** of size and type, not just a client check.
- **Progress, cancel and retry** in the browser, which `fetch` alone doesn't fully give you (upload progress needs XHR or streams).
- **Lifecycle correctness**: what happens to half-finished uploads, how the record learns the file is there.
- **Accessible, clear UI** for drag-and-drop and errors.

#### Key points
- Three steps: **(1) request an upload** (API validates, creates a `pending` attachment row, returns a presigned URL), **(2) PUT/POST the bytes to storage**, **(3) confirm** (client calls `complete`, or a storage event marks it `ready`).
- Prefer **presigned POST policies** (S3) when you need the storage service to enforce `content-length-range` and content type; a presigned PUT can lock the content type and is fine with a server-side size check on `complete`.
- On `complete`, the server **verifies the object exists** (HEAD) and its size/type match before marking it ready.
- **Upload progress**: `XMLHttpRequest.upload.onprogress` (widely supported). Cancel with `xhr.abort()`; retry by requesting a fresh URL.
- **Concurrency**: upload 2–3 files at a time, queue the rest.
- **Cleanup**: a scheduled job deletes `pending` rows and objects older than a day; also set a bucket lifecycle rule for an `uploads/tmp/` prefix.
- **Downloads** use short-lived presigned GET URLs (private buckets), with `Content-Disposition` set to the original filename.

#### Model answer
"**Contract.**
```
POST /api/records/:id/attachments        { name, type, size }
  → 201 { attachmentId, upload: { url, fields } }   (presigned POST)
POST /api/attachments/:id/complete       → 200 { attachment }
GET  /api/attachments/:id/download       → 302 to a presigned GET (5 min)
DELETE /api/attachments/:id
```

**Server.**
```ts
const ALLOWED = ['image/png', 'image/jpeg', 'application/pdf', 'text/csv'];
const MAX = 25 * 1024 * 1024;

app.post('/api/records/:id/attachments', requireUser, async (req, res) => {
  const { name, type, size } = z.object({
    name: z.string().min(1).max(200), type: z.enum(ALLOWED as [string, ...string[]]),
    size: z.number().int().positive().max(MAX),
  }).parse(req.body);
  await assertCanEdit(req.user, req.params.id);

  const id = randomUUID();
  const key = `records/${req.params.id}/${id}`;          // never the user's filename
  await db.attachments.insert({ id, record_id: req.params.id, key, name, type, size,
                                status: 'pending', created_by: req.user.id });
  const upload = await createPresignedPost(s3, {
    Bucket: BUCKET, Key: key, Expires: 600,
    Conditions: [['content-length-range', 1, MAX], ['eq', '$Content-Type', type]],
    Fields: { 'Content-Type': type },
  });
  res.status(201).json({ attachmentId: id, upload });
});

app.post('/api/attachments/:id/complete', requireUser, async (req, res) => {
  const a = await db.attachments.get(req.params.id);
  await assertCanEdit(req.user, a.record_id);
  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: a.key }))
                      .catch(() => null);
  if (!head) return res.status(409).json({ code: 'not_uploaded' });
  if (head.ContentLength !== a.size) return res.status(422).json({ code: 'size_mismatch' });
  const updated = await db.attachments.update(a.id, { status: 'ready' });
  res.json({ attachment: toDto(updated) });
});
```
Notes: the object key never uses the user's filename (no path tricks, no collisions); the original name is stored in the row and used in `Content-Disposition` on download. If files need scanning (malware, content checks), `complete` sets `status = 'scanning'` and a worker sets `ready` later.

**Client: an upload queue hook.**
```ts
type Item = { id: string; file: File; progress: number;
              status: 'queued'|'uploading'|'done'|'error'|'cancelled'; error?: string; xhr?: XMLHttpRequest };

function uploadToS3(upload, file, onProgress): { promise: Promise<void>; xhr: XMLHttpRequest } {
  const xhr = new XMLHttpRequest();
  const form = new FormData();
  Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v as string));
  form.append('file', file);                                 // must be last
  const promise = new Promise<void>((resolve, reject) => {
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`S3 ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
  });
  xhr.open('POST', upload.url);
  xhr.send(form);
  return { promise, xhr };
}
```
A `useUploadQueue` hook keeps an array of items, starts up to 3 at a time, and for each: calls the API to create the attachment, uploads with progress, calls `complete`, then marks `done` and invalidates the record's attachments query. Errors set `status: 'error'` with a readable message; **Retry** restarts from step 1 (presigned URLs expire). **Cancel** calls `xhr.abort()` and `DELETE`s the pending attachment.

**UI.**
- A drop zone that is also a real `<button>` opening a hidden `<input type="file" multiple accept=".png,.jpg,.pdf,.csv">`, so it works by keyboard and screen reader. Dragging over it shows a highlighted state.
- Client-side checks (type, size) show errors instantly, before any request.
- A list of files: name, size, a `<progress value max>` element with an accessible label, and Cancel/Retry buttons. A polite live region announces 'report.pdf uploaded'.
- `beforeunload` warning while uploads are in progress.

**Cleanup job.** Hourly: delete `pending` attachments older than 24 hours and their objects (if present)."

#### Another worked example: uploading straight from a form submit
"For a 'create expense' form with a receipt, I'd start uploading as soon as the file is chosen (not on submit), so by the time the user has filled in the amount, the upload is usually done. The form holds the `attachmentId`; submit is disabled with 'Waiting for upload…' while it's in progress. On submit, the server checks the attachment is `ready` and belongs to this user before linking it to the new expense. If the user abandons the form, the cleanup job removes the orphaned upload."

#### Step-by-step framework
1. **Contract**: create attachment → upload → complete → download.
2. **Server validation**: auth, type allow-list, size limit, safe key.
3. **Presigned POST** with conditions (or PUT + verification on complete).
4. **Complete step** verifies the object with HEAD.
5. **Client queue**: concurrency, XHR progress, cancel, retry with a fresh URL.
6. **UI**: accessible drop zone, progress, errors, live announcements.
7. **Downloads** via short-lived presigned GETs.
8. **Cleanup** of pending uploads.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `multipart/form-data` to the API, which writes to S3 | Presigned direct upload; API never handles bytes |
| Size limit only in the browser | Size and type enforced by the presigned policy and verified on complete |
| Uses the user's filename as the object key | Random key; original name stored separately |
| `fetch` with no progress | XHR upload progress, cancel and retry |
| Drop zone is a `div` | Keyboard-accessible button + file input |
| Abandoned uploads stay forever | Pending rows and objects cleaned up |

#### Useful phrases
- "The browser uploads straight to storage; our API only signs the request."
- "The presigned policy enforces the size range and content type, so a client can't bypass them."
- "I verify the object exists and matches before marking it ready."
- "Retry asks for a fresh URL, since the old one may have expired."
- "Keys are random; the original filename is metadata."

#### Common pitfalls
- **Proxying uploads** through serverless functions with tight body limits.
- **Trusting the client's `type`** for security decisions (it's just a hint; check magic bytes if it matters).
- **Public buckets** for private files.
- **No cleanup**, leaving orphaned objects and pending rows.
- **Forgetting CORS on the bucket**, so browser uploads fail.

#### Follow-ups to expect (with sample answers)
- **"How would you handle 5 GB files?"**
  "Multipart upload with presigned part URLs, parallel parts, resume from IndexedDB-stored progress, and a complete call with the part list."
- **"How do you stop malware?"**
  "Scan on upload completion (e.g. ClamAV in a worker or a storage-integrated scanner), keep files in a quarantine prefix until clean, and serve downloads with `Content-Disposition: attachment`."
- **"Can you use fetch for progress?"**
  "Download progress, yes, by reading the response stream. Upload progress with fetch needs streaming request bodies, which aren't universally supported yet, so XHR is the safe choice."
- **"What CORS config does the bucket need?"**
  "Allow our origin, the POST/PUT method and the headers we send, and expose `ETag` if we use multipart."

#### What senior interviewers look for
- The **three-step flow** with server-side enforcement.
- **Lifecycle thinking**: pending, ready, failed, cleanup.
- **Real browser knowledge**: XHR progress, abort, CORS.
- Good, accessible **UX for errors and progress**.

#### Practise it
1. Implement the presigned POST endpoint and upload a file from a plain HTML page.
2. Add progress and cancel with XHR, then test with Chrome DevTools network throttling.
3. Try uploading a file over the size limit directly with curl and confirm S3 rejects it.
4. Explain the three-step flow to a friend in one minute.

## Build a search-as-you-type endpoint and UI
- id: fs-build-04
- round: FULLSTACK_FEATURE_BUILD
- difficulty: medium
- levels:
- tags: search, autocomplete, debounce, Postgres full-text, pg_trgm, combobox, accessibility

### Prompt
Build a search box that suggests matching products as the user types (top 8 results with highlighting), and an endpoint that serves it quickly over ~1M products. Cover the database query, the API, and an accessible combobox UI.

### Answer
#### What the interviewer is really testing
- A **fast, relevant query**: prefix and fuzzy matching with the right index.
- **Request management** on the client: debouncing, cancelling stale requests, out-of-order responses, caching.
- **Accessible combobox** behaviour: keyboard navigation, ARIA roles, screen reader announcements.
- **Performance budgets**: response time under ~100 ms, small payloads, caching hot prefixes.
- **Safe highlighting** without `dangerouslySetInnerHTML` pitfalls.

#### Key points
- **Database**: Postgres with `pg_trgm` (GIN trigram index) handles `ILIKE '%term%'` and typo tolerance (`similarity`, `%` operator); `tsvector` full-text search handles word stemming and ranking. For prefix-heavy autocomplete, a dedicated `prefix` index or a search engine (Typesense, Meilisearch, Elasticsearch) may be better at scale.
- **API**: `GET /api/search/suggest?q=red sh&limit=8` returns a small payload (`id`, `name`, `category`, maybe a thumbnail). Minimum query length (2 characters), max length, rate limit.
- **Caching**: suggestions for short popular prefixes are cacheable at the CDN for ~60 seconds (`Cache-Control: public, max-age=60`), as long as results aren't personalised.
- **Client**: debounce 150–250 ms, `AbortController` to cancel, ignore responses that don't match the latest query, cache results per query (TanStack Query does this).
- **Combobox pattern** (WAI-ARIA): `input` with `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; a `listbox` of `option`s; arrow keys move, Enter selects, Escape closes.
- **Highlighting**: split the text on the match and wrap parts in `<mark>` as React elements; never inject HTML from the server.

#### Model answer
"**Database.**
```sql
create extension if not exists pg_trgm;
create index products_name_trgm on products using gin (name gin_trgm_ops);
```
Query, ranking prefix matches first, then by similarity and popularity:
```sql
select id, name, category, thumb_url
  from products
 where active and (name ilike $1 || '%' or name % $1)        -- prefix or fuzzy
 order by (name ilike $1 || '%') desc,
          similarity(name, $1) desc,
          popularity desc
 limit 8;
```
(`$1` is the user's term with `%` and `_` escaped.) With the trigram index this is typically a few milliseconds on 1M rows. I'd check `EXPLAIN ANALYZE` and tune `pg_trgm.similarity_threshold`.

**API.**
```ts
app.get('/api/search/suggest', rateLimit('suggest', { perIp: 30, per: '10s' }), async (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 64);
  if (q.length < 2) return res.json({ items: [] });
  const term = q.replace(/[%_\\]/g, (c) => '\\' + c);
  const items = await db.query(SUGGEST_SQL, [term]);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ items });
});
```

**Client hook.**
```ts
function useSuggestions(input: string) {
  const q = useDebounce(input.trim(), 200);
  return useQuery({
    queryKey: ['suggest', q],
    queryFn: ({ signal }) => fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal })
                               .then(r => r.json()),
    enabled: q.length >= 2,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
```
Keying on the query means a late response for 'red' can never overwrite results for 'red sh': each lives in its own cache entry, and the UI renders the entry for the current key. `signal` cancels superseded requests.

**Combobox component.**
```tsx
function ProductSearch({ onSelect }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const { data, isFetching } = useSuggestions(text);
  const items = data?.items ?? [];
  const listId = useId();

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(items[active]); }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1); }
  }
  function choose(item) { onSelect(item); setText(item.name); setOpen(false); setActive(-1); }

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`}>Search products</label>
      <input id={`${listId}-input`} role="combobox" aria-autocomplete="list"
             aria-expanded={open && items.length > 0} aria-controls={listId}
             aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
             value={text} onKeyDown={onKeyDown}
             onChange={e => { setText(e.target.value); setOpen(true); setActive(-1); }}
             onBlur={() => setTimeout(() => setOpen(false), 100)} />
      {open && items.length > 0 && (
        <ul role="listbox" id={listId}>
          {items.map((it, i) => (
            <li key={it.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                onMouseDown={e => { e.preventDefault(); choose(it); }}>
              <Highlight text={it.name} query={text} /> <span>{it.category}</span>
            </li>
          ))}
        </ul>
      )}
      <div aria-live="polite" className="sr-only">
        {open && !isFetching ? `${items.length} suggestions` : ''}
      </div>
    </div>
  );
}

function Highlight({ text, query }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}
```
`onMouseDown` + `preventDefault` stops the input blurring before the click registers. Highlighting builds React elements, so product names can't inject HTML. Enter without an active option submits a full search page (`/search?q=`)."

#### Another worked example: moving to a search engine
"If the catalogue grows to 50M products or we need synonyms ('trainers' = 'sneakers'), typo tolerance on every word and per-locale ranking, I'd index products into Typesense or Elasticsearch with an edge n-gram analyser for prefixes. The API contract stays identical, so the UI doesn't change. Indexing runs from an outbox/CDC stream; the suggest endpoint queries the engine with a 50 ms timeout and falls back to the Postgres query if the engine is unavailable."

#### Step-by-step framework
1. **Query and index**: trigram/full-text with prefix boosting; check the plan.
2. **API**: min/max length, escaping, small payload, rate limit, caching headers.
3. **Client data**: debounce, cancel, key by query, cache.
4. **Combobox semantics**: roles, `aria-activedescendant`, keyboard handling.
5. **Rendering**: safe highlight, loading and empty states, live region.
6. **Scale path**: search engine with the same contract.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `ILIKE '%term%'` with no index | Trigram GIN index, prefix-first ranking |
| Request on every keystroke | Debounced and cancelled |
| Results flicker or show stale responses | Cache keyed by query; latest key rendered |
| A `div` list clickable only by mouse | Full WAI-ARIA combobox with keyboard support |
| Server returns HTML with `<b>` tags | Highlighting built as React elements |
| No limits | Min length, max length, rate limit, payload cap |

#### Useful phrases
- "A trigram index lets Postgres handle substring and fuzzy matches quickly."
- "Each query string has its own cache entry, so out-of-order responses can't overwrite newer ones."
- "I follow the WAI-ARIA combobox pattern: focus stays in the input and `aria-activedescendant` points at the highlighted option."
- "Highlighting is done with React elements, never raw HTML."
- "The API contract stays the same if we move to a search engine."

#### Common pitfalls
- **Race conditions** showing results for an older query.
- **Blur closing the list before the click** lands.
- **Moving DOM focus into the list**, which breaks typing.
- **Unescaped `%` and `_`** in LIKE patterns.
- **Caching personalised results publicly.**

#### Follow-ups to expect (with sample answers)
- **"How would you add recent searches?"**
  "Store them locally (localStorage) and show them when the input is focused and empty, in a separate group with a 'Clear' option."
- **"How do you measure quality?"**
  "Log query, shown results and chosen position; track click-through rate and 'no results' rate; review top zero-result queries for synonyms."
- **"What about mobile?"**
  "Larger touch targets, `inputmode="search"` and `enterkeyhint="search"`, and a full-screen overlay for results on small screens."
- **"How would you test it?"**
  "Unit-test the highlight function; component tests with Testing Library for keyboard behaviour; an axe check; an API test that `%` is escaped."

#### What senior interviewers look for
- **End-to-end latency thinking**: index, payload, debounce, cache.
- **Correct request lifecycle** on the client.
- **Accessibility done properly**, not as an afterthought.
- A **migration path** that doesn't change the contract.

#### Practise it
1. Load 1M rows of fake products into Postgres, add the trigram index and compare query plans.
2. Build the combobox and test it with only the keyboard and VoiceOver/NVDA.
3. Throttle the network and type quickly to confirm results never go stale.
4. Explain `aria-activedescendant` to a friend.

## Build a form with server-side validation and good error UX
- id: fs-build-05
- round: FULLSTACK_FEATURE_BUILD
- difficulty: medium
- levels:
- tags: forms, validation, Zod, error handling, accessibility, React Hook Form

### Prompt
Build a "Create project" form with several fields (name, slug, description, start/end dates, budget, team members). Validation must happen on both client and server, and server errors must show next to the right fields. Walk through your approach.

### Answer
#### What the interviewer is really testing
- **One source of truth for validation rules**, shared by client and server where possible.
- A clear **error contract** from the API (field-level errors vs form-level errors).
- **Form UX**: when to validate, how errors are shown and announced, focus management, preventing double submits.
- Handling **server-only rules** (uniqueness, permissions, business rules) gracefully.
- **Accessibility** of forms: labels, descriptions, `aria-invalid`, error summaries.

#### Key points
- Define a **schema** (Zod, Valibot, Yup) in a shared package; the client uses it for instant feedback and the server uses it as the authority. The server may add rules the client can't check (slug uniqueness).
- **Error contract**: `422 { errors: { fieldErrors: { slug: ['taken'] }, formErrors: ['Budget exceeds your plan limit'] } }`. Use stable **error codes** that the UI maps to messages, rather than displaying server strings directly.
- **Validate on blur** (and on change once a field has an error), not on every keystroke from the start.
- On submit failure: show inline errors, an **error summary** at the top linking to fields, and **move focus** to the summary or first invalid field.
- **Disable/indicate submitting**, and make the endpoint **idempotent** (an idempotency key) to survive double clicks and retries.
- Cross-field rules (end date after start date) belong in the schema with the error attached to a specific field.

#### Model answer
"**Shared schema** (`packages/shared/project.ts`):
```ts
export const ProjectInput = z.object({
  name: z.string().trim().min(3, 'too_short').max(80, 'too_long'),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/, 'slug_format'),
  description: z.string().max(2000, 'too_long').optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budgetPence: z.number().int().min(0).max(100_000_000),
  memberIds: z.array(z.string().uuid()).max(50),
}).refine(d => d.endDate >= d.startDate, { path: ['endDate'], message: 'end_before_start' });
export type ProjectInput = z.infer<typeof ProjectInput>;
```
Messages are **codes**; the UI translates them (`end_before_start` → 'End date must be on or after the start date'). That also makes i18n easy.

**Server.**
```ts
app.post('/api/projects', requireUser, idempotent(), async (req, res) => {
  const parsed = ProjectInput.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ errors: parsed.error.flatten() });
  const input = parsed.data;

  const fieldErrors: Record<string, string[]> = {};
  if (await db.projects.slugExists(req.user.orgId, input.slug)) fieldErrors.slug = ['taken'];
  const invalidMembers = await db.members.notInOrg(req.user.orgId, input.memberIds);
  if (invalidMembers.length) fieldErrors.memberIds = ['unknown_member'];
  if (Object.keys(fieldErrors).length) return res.status(422).json({ errors: { fieldErrors, formErrors: [] } });

  if (input.budgetPence > (await planLimit(req.user.orgId)))
    return res.status(422).json({ errors: { fieldErrors: {}, formErrors: ['plan_budget_limit'] } });

  try {
    const project = await db.projects.insert({ ...input, org_id: req.user.orgId });
    res.status(201).json({ project });
  } catch (e) {
    if (isUniqueViolation(e, 'projects_org_slug_key'))     // race with another request
      return res.status(422).json({ errors: { fieldErrors: { slug: ['taken'] }, formErrors: [] } });
    throw e;
  }
});
```
The unique constraint is the real guarantee for the slug; the pre-check just gives a nicer error in the common case.

**Client (React Hook Form + Zod resolver).**
```tsx
const form = useForm<ProjectInput>({ resolver: zodResolver(ProjectInput), mode: 'onTouched' });
const create = useMutation({
  mutationFn: (v: ProjectInput) => api.post('/api/projects', v, { headers: { 'Idempotency-Key': key } }),
  onError: (err) => {
    if (err.status !== 422) return setBanner('Something went wrong. Please try again.');
    const { fieldErrors, formErrors } = err.body.errors;
    for (const [field, codes] of Object.entries(fieldErrors))
      form.setError(field as keyof ProjectInput, { message: codes[0] }, { shouldFocus: true });
    setFormErrors(formErrors);
  },
  onSuccess: ({ project }) => navigate(`/projects/${project.slug}`),
});
```
- `mode: 'onTouched'` validates after the user leaves a field, then live once there's an error: not shouting at people mid-typing.
- `setError` maps server codes onto the same fields as client errors, so both look identical.
- A stable idempotency key (generated when the form mounts) means a double click or retry creates one project.

**Field markup.**
```tsx
<div>
  <label htmlFor="slug">URL slug</label>
  <p id="slug-hint">Lowercase letters, numbers and hyphens.</p>
  <input id="slug" {...form.register('slug')}
         aria-invalid={!!errors.slug}
         aria-describedby={`slug-hint${errors.slug ? ' slug-error' : ''}`} />
  {errors.slug && <p id="slug-error" className="error">{t(errors.slug.message)}</p>}
</div>
```
On a failed submit, an **error summary** box at the top ('There are 2 problems') lists links to each invalid field and receives focus, which is the GOV.UK pattern and works well with screen readers. The submit button shows 'Creating…' and ignores repeat clicks while pending.

**Nice touches.** Auto-generate the slug from the name until the user edits the slug. Check slug availability asynchronously on blur (`GET /api/projects/slug-available?slug=`), debounced, showing 'Available ✓'. Warn before navigating away with unsaved changes."

#### Another worked example: validating with Next.js server actions
"With a server action, the same schema runs on the server inside the action; the action returns `{ fieldErrors, formErrors }` instead of throwing. `useActionState` gives the form the returned state, so errors render even without client-side JavaScript (progressive enhancement). I'd still add client-side validation for instant feedback when JS is available, using the same schema. The error contract is identical to the REST version, just returned from a function."

#### Step-by-step framework
1. **Shared schema** with error codes and cross-field refinements.
2. **Server**: parse, server-only checks, constraint-backed guarantees, consistent 422 shape.
3. **Client**: same schema via resolver; validate on touch.
4. **Map server errors** to fields and form-level messages.
5. **Accessibility**: labels, hints, `aria-invalid`, `aria-describedby`, error summary, focus.
6. **Submission safety**: pending state, idempotency key.
7. **Polish**: async availability checks, unsaved-changes warning.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Rules duplicated by hand on client and server | One shared schema; server adds server-only rules |
| Server returns `400 "Invalid input"` | Structured field and form errors with codes |
| Validates on every keystroke from the start | Validates on blur, then live once invalid |
| Errors shown in red text only | Linked with `aria-describedby`, summary, focus moved |
| Uniqueness checked only with a SELECT | Unique constraint + friendly mapping |
| Double click creates two projects | Pending state and idempotency key |

#### Useful phrases
- "The schema lives in a shared package; the server is still the authority."
- "Errors come back as codes, so the UI controls wording and translation."
- "The pre-check gives a friendly error; the unique constraint is the guarantee."
- "On failure, focus moves to an error summary that links to each field."
- "The idempotency key makes retries and double clicks safe."

#### Common pitfalls
- **Trusting client validation** and skipping server checks.
- **Showing raw server messages** (or stack traces) to users.
- **Losing user input** on error (full page reloads, resets).
- **Errors not associated with inputs**, so screen readers miss them.
- **Date handling bugs** (time zones turning 2026-11-05 into the 4th).

#### Follow-ups to expect (with sample answers)
- **"How would you handle a very long form?"**
  "Split into steps with per-step validation, save drafts on the server, and validate the whole thing again on final submit."
- **"How do you test this?"**
  "Schema unit tests for each rule, API tests for 422 shapes and the slug race, and component tests that server errors appear next to the right field and focus moves."
- **"What if the server adds a new rule the client doesn't know?"**
  "It returns a new code; the UI shows a generic message for unknown codes and logs it, so nothing breaks."
- **"Native HTML validation or custom?"**
  "Use native attributes (`required`, `type="email"`) as hints and for no-JS cases, but disable the default bubbles (`noValidate`) for consistent, accessible custom messages."

#### What senior interviewers look for
- A **clean, reusable error contract**.
- **Database-level guarantees** behind friendly checks.
- **Accessible, humane form UX**.
- Thinking about **retries and double submission**.

#### Practise it
1. Build the form with a shared Zod schema and an Express endpoint; return field errors with codes.
2. Use only a keyboard and a screen reader to submit an invalid form; fix anything confusing.
3. Fire two identical requests at once and confirm only one project is created.
4. Explain to a friend why errors should be codes, not strings.

## Build a shopping cart that survives refresh and login
- id: fs-build-06
- round: FULLSTACK_FEATURE_BUILD
- difficulty: medium
- levels:
- tags: cart, guest checkout, state merge, optimistic updates, localStorage, e-commerce

### Prompt
Build a shopping cart: guests can add items without logging in, the cart survives page refreshes and new tabs, and when a guest logs in their cart merges with any cart saved on their account. Cover storage, the API, merging and the UI.

### Answer
#### What the interviewer is really testing
- **Where cart state lives** for guests vs signed-in users, and why.
- A correct **merge strategy** at login.
- **Server authority over prices and stock**: the client never decides what something costs.
- **Optimistic UI** for add/remove/quantity changes with rollback.
- **Cross-tab consistency** and edge cases (item out of stock, price changed, product deleted).

#### Key points
- Store carts **on the server for everyone**: guests get an anonymous cart id in an **HttpOnly cookie**; signed-in users have a cart linked to their account. This keeps one code path and works across tabs automatically. (Local-only guest carts are possible, but harder to recover and to merge.)
- **Cart lines store product id and quantity**, not price. Prices, discounts, tax and availability are **computed on read** by the server.
- **Merge at login**: combine guest and account carts by product (sum quantities, capped by stock and per-item limits), then delete the guest cart and clear its cookie. Tell the user if anything changed.
- **Optimistic updates** on quantity changes with rollback on error; debounce rapid +/− clicks.
- **Cross-tab**: refetch on window focus, or broadcast changes via `BroadcastChannel`.
- **Validation at checkout**: re-price and re-check stock; show what changed before payment.

#### Model answer
"**Data model.**
```sql
carts(id uuid pk, user_id uuid null unique, created_at, updated_at, expires_at)
cart_items(cart_id, product_id, variant_id, quantity int check (quantity > 0),
           added_at, primary key (cart_id, variant_id))
```
Guest carts have `user_id = null` and expire after 30 days of inactivity.

**Resolving the cart.** Middleware: if signed in → the user's cart (create on first use). Otherwise → the cart id from the `cart_id` cookie (HttpOnly, SameSite=Lax, 30 days); if missing or expired, create one lazily on first add.

**API.**
```
GET    /api/cart                         → priced cart
POST   /api/cart/items { variantId, quantity }
PATCH  /api/cart/items/:variantId { quantity }   (0 removes)
DELETE /api/cart/items/:variantId
```
The priced cart response:
```json
{ "items": [{ "variantId": "...", "name": "Linen shirt — M", "image": "...",
              "unitPrice": 4500, "quantity": 2, "lineTotal": 9000,
              "available": 7, "issues": [] }],
  "subtotal": 9000, "discounts": [], "shippingEstimate": 395, "currency": "GBP",
  "issues": [] }
```
`issues` holds things like `{ code: 'price_changed', from: 5000, to: 4500 }` or `out_of_stock`, computed by comparing against what the cart last showed (stored `last_seen_price` per line, or a cart snapshot).

Adding an item: validate the variant exists and is purchasable; `INSERT ... ON CONFLICT (cart_id, variant_id) DO UPDATE SET quantity = LEAST(cart_items.quantity + excluded.quantity, max_per_order)`.

**Merging at login.** In the login handler, after authentication:
```sql
begin;
insert into cart_items (cart_id, variant_id, quantity)
  select $userCart, variant_id, quantity from cart_items where cart_id = $guestCart
  on conflict (cart_id, variant_id)
  do update set quantity = least(cart_items.quantity + excluded.quantity, 10);
delete from carts where id = $guestCart;
commit;
```
Then clear the `cart_id` cookie. If quantities were capped or items unavailable, the next `GET /api/cart` returns `issues` and the UI shows a notice ('We combined your carts. 1 item is no longer available.').

Some shops prefer 'guest cart replaces account cart' if the guest cart is non-empty; I'd confirm the product decision with the interviewer, as summing can surprise users with an old forgotten cart.

**Client.**
- `useQuery(['cart'])` drives the header badge and the cart drawer.
- **Add to cart**: optimistic badge increment and a toast ('Added — View cart'); on error, roll back and show the reason (out of stock).
- **Quantity stepper**: update the cache immediately, debounce the PATCH by ~400 ms so five quick clicks send one request with the final number; on failure, revert to the server value.
- Prices displayed come **only from the server response**; while a PATCH is in flight, line totals show a subtle loading state rather than client-calculated numbers (or a calculated estimate labelled as such).
- **Cross-tab**: `refetchOnWindowFocus`, plus `BroadcastChannel('cart')` posting 'changed' after each successful mutation so other open tabs invalidate immediately.
- Accessibility: the badge has an accessible name ('Cart, 3 items'); quantity buttons have labels ('Increase quantity of Linen shirt'); changes are announced in a polite live region.

**Checkout boundary.** `POST /api/checkout` re-prices everything, reserves stock, and returns either a payment session or a `409` with the list of changes for the user to confirm."

#### Another worked example: a local-first guest cart
"If the requirement is 'no server writes until checkout' (e.g. a static storefront on a CDN), I'd keep the guest cart in `localStorage` as `[{ variantId, quantity }]`, sync tabs via the `storage` event, and call `POST /api/cart/price` with the lines to get prices for display. At login, the client sends its local lines to `POST /api/cart/merge`, then clears local storage. The trade-off: the cart is tied to one browser, and you can't email abandoned-cart reminders to guests."

#### Step-by-step framework
1. **Decide storage**: server carts with an anonymous cookie (or local-first), with reasons.
2. **Schema**: lines with product/variant and quantity only.
3. **Priced reads**: server computes prices, totals and issues.
4. **Mutations**: upsert with limits; validate purchasability.
5. **Merge at login** in a transaction; communicate changes.
6. **Client**: query cache, optimistic updates, debounced quantity, server-sourced prices.
7. **Cross-tab** sync and accessibility.
8. **Checkout re-validation**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Stores price in the cart and trusts it at checkout | Prices computed server-side on every read and at checkout |
| Guest cart lost at login | Explicit merge strategy in a transaction |
| Each +/− click is a request, totals flicker | Optimistic stepper with debounced PATCH |
| Other tabs show stale counts | Refetch on focus + BroadcastChannel |
| Silent changes when stock or price changes | `issues` returned and shown to the user |
| Cart id readable by JS | HttpOnly cookie for the anonymous cart id |

#### Useful phrases
- "The cart stores what and how many; the server always decides how much."
- "Guests get a server cart keyed by an HttpOnly cookie, so there's one code path."
- "At login I merge in one transaction and tell the user what changed."
- "The quantity stepper is optimistic and debounced."
- "Checkout re-prices and re-checks stock before taking payment."

#### Common pitfalls
- **Client-side prices** reaching the payment step.
- **Duplicate lines** for the same variant instead of upserting.
- **Merge races** when login happens in two tabs (the transaction and deleting the guest cart handle it).
- **Never-expiring guest carts** filling the database.
- **Forgetting deleted or discontinued products** in old carts.

#### Follow-ups to expect (with sample answers)
- **"How would you reserve stock?"**
  "Not at add-to-cart (it blocks other buyers); reserve at checkout start with a short expiry (10–15 minutes) and release on timeout or payment failure."
- **"How do you apply discount codes?"**
  "Store the code on the cart; the pricing function validates eligibility on every read and returns the discount line or an issue if it no longer applies."
- **"How would you do abandoned-cart emails?"**
  "For signed-in users (or guests who entered an email at checkout), a scheduled job finds carts idle for 24 hours with items and queues one reminder, respecting marketing consent."
- **"How do you keep the cart fast?"**
  "Cache product prices and availability in Redis with short TTLs; the cart read is then a small join plus cached lookups."

#### What senior interviewers look for
- **Server authority over money** without hurting UX.
- A **deliberate merge policy** and good communication of changes.
- Careful **optimistic UI** that doesn't lie about totals.
- Edge-case coverage: stock, price changes, expiry, multiple tabs.

#### Practise it
1. Implement the cart tables, the upsert and the merge transaction; test merging overlapping carts.
2. Build a debounced optimistic quantity stepper and test it on a throttled network.
3. Open two tabs and make sure the badge stays in sync.
4. Explain to a friend why prices must never be stored in the cart line.
