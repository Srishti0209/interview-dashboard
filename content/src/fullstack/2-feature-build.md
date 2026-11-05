# Full Stack Engineer — Feature Build

## Build a paginated, filterable list: API plus UI
- id: fs-build-01
- round: FULLSTACK_FEATURE_BUILD
- difficulty: medium
- levels:
- tags: pagination, filtering, sorting, URL state, React Query, SQL

### Prompt
In a 60–90 minute pairing session you're asked to build an "Orders" page: a table of orders with search, status filter, sort by date or amount, and pagination. You own both the API endpoint and the React UI. Walk through how you'd build it.

### Answer
#### What the interviewer is really testing
- Whether you can **ship a working vertical slice** quickly, then improve it, rather than over-designing.
- **API design** for list endpoints: validated query parameters, stable sorting, cursor or offset pagination, a predictable response shape.
- **Database awareness**: indexes that match the filters and sort, avoiding `OFFSET` traps on large tables.
- **Frontend state**: filters in the URL, debounced search, loading/empty/error states, no race conditions.
- **Working style**: talking through trade-offs, writing a test or two, and keeping the code clean under time pressure.

#### Key points
- Start with the **contract**: `GET /api/orders?q=&status=&sort=created_at:desc&limit=25&cursor=` → `{ items, nextCursor, total? }`.
- **Validate and allow-list** query parameters (e.g. with Zod); never interpolate a sort column straight into SQL.
- **Stable sort**: always add a unique tie-breaker (`id`) so pages don't skip or repeat rows.
- **Keyset (cursor) pagination** for large or live data; **offset** is fine for small tables or when users need page numbers. Say which you chose and why.
- **Indexes** matching the common query: e.g. `(customer_id, status, created_at desc, id)`.
- **URL as state**: filters, sort and cursor/page live in the query string; the data hook keys on them.
- **Debounce** search input (~300 ms), keep previous results visible while loading (`placeholderData`), cancel stale requests.
- Accessible table: real `<table>` markup, sortable headers as buttons with `aria-sort`.

#### Model answer
"I'd build a thin vertical slice first: endpoint returning real data, table rendering it. Then add filters, sort and pagination one at a time, testing as I go.

**1. Contract (2 minutes, agreed with the interviewer).**
```
GET /api/orders?q=smith&status=shipped&sort=created_at:desc&limit=25&cursor=eyJ...
200 { items: Order[], nextCursor: string | null }
Order = { id, number, customerName, status, totalPence, currency, createdAt }
```

**2. API (Node/Express + Postgres as an example).**
```ts
const Query = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled']).optional(),
  sort: z.enum(['created_at:desc', 'created_at:asc', 'total:desc', 'total:asc'])
         .default('created_at:desc'),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

app.get('/api/orders', requireUser, async (req, res) => {
  const p = Query.safeParse(req.query);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const { q, status, sort, limit, cursor } = p.data;
  const [col, dir] = sort.split(':');              // allow-listed above
  const column = col === 'total' ? 'total_pence' : 'created_at';
  const after = cursor ? decodeCursor(cursor) : null; // { v, id }

  const where = ['account_id = $1'];
  const args: unknown[] = [req.user.accountId];
  if (status) { args.push(status); where.push(`status = $${args.length}`); }
  if (q) { args.push(`%${q}%`); where.push(`(customer_name ILIKE $${args.length} OR number ILIKE $${args.length})`); }
  if (after) {
    args.push(after.v, after.id);
    const op = dir === 'desc' ? '<' : '>';
    where.push(`(${column}, id) ${op} ($${args.length - 1}, $${args.length})`);
  }
  args.push(limit + 1);
  const rows = await db.query(
    `SELECT id, number, customer_name, status, total_pence, currency, created_at
       FROM orders WHERE ${where.join(' AND ')}
      ORDER BY ${column} ${dir}, id ${dir} LIMIT $${args.length}`, args);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  res.json({
    items: items.map(toDto),
    nextCursor: hasMore ? encodeCursor({ v: last[column], id: last.id }) : null,
  });
});
```
Points I'd call out: every value is a bound parameter; the sort column comes from an allow-list; the row comparison `(created_at, id) < (...)` gives stable keyset pagination; I fetch `limit + 1` to know if there's another page without a `COUNT(*)`. The cursor is base64 JSON (could be signed if tampering matters). Index: `CREATE INDEX ON orders (account_id, created_at DESC, id DESC)` plus one for total, and a `pg_trgm` GIN index if `ILIKE` search becomes slow.

**3. UI (React + TanStack Query).**
```tsx
function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const filters = {
    q: params.get('q') ?? '', status: params.get('status') ?? '',
    sort: params.get('sort') ?? 'created_at:desc',
  };
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const cursor = cursorStack.at(-1);
  const debouncedQ = useDebounce(filters.q, 300);

  const query = useQuery({
    queryKey: ['orders', { ...filters, q: debouncedQ, cursor }],
    queryFn: ({ signal }) => fetchOrders({ ...filters, q: debouncedQ, cursor }, signal),
    placeholderData: keepPreviousData,
  });

  const update = (patch: Record<string, string>) => {
    setCursorStack([]);                       // filters change → back to page 1
    setParams(p => { for (const [k, v] of Object.entries(patch)) v ? p.set(k, v) : p.delete(k); return p; },
              { replace: true });
  };
  // render: search input, status select, table with sortable headers, Prev/Next
}
```
- Passing `signal` lets TanStack Query cancel stale requests.
- `keepPreviousData` keeps the table visible (dimmed) while the next page loads, so nothing jumps.
- Prev/Next use a stack of cursors. Cursors are kept out of the URL to keep links clean, though they could go in.
- States: skeleton rows on first load; 'No orders match these filters' with a 'Clear filters' button; an inline error with Retry.
- Sortable headers: `<th aria-sort="descending"><button onClick=…>Date</button></th>`.

**4. Tests (if time).** API: invalid sort returns 400; pagination returns each row exactly once across pages; another account's orders never appear. UI: changing the status filter updates the URL and resets to the first page."

#### Another worked example: when offset pagination is the right call
"For an admin page over a 5,000-row `products` table where users want 'page 7 of 20' and to jump to a page, I'd use `LIMIT 25 OFFSET 150` with a `COUNT(*)`. It's simpler, page numbers make sense, and `OFFSET` on 5,000 rows is cheap. The trade-offs only bite at large offsets (Postgres still scans the skipped rows) or when rows are inserted while paging (items shift). I'd say this explicitly: 'For this table offset is fine; for the orders table with millions of rows and new orders arriving, I'd use keyset.'"

#### Step-by-step framework
1. **Agree the contract** (params, response shape, page size limits).
2. **Thin vertical slice**: endpoint returns data, table renders it.
3. **Add filters** with validation and parameterised SQL.
4. **Add sort** from an allow-list with a unique tie-breaker.
5. **Add pagination**: keyset or offset, justified.
6. **Index** for the main query; mention trigram search if needed.
7. **UI state in the URL**; debounce; cancel; keep previous data.
8. **States and accessibility**; then **tests**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Builds the whole UI before the API works | Vertical slice first, then iterate |
| `ORDER BY ${req.query.sort}` | Allow-listed sort mapped to columns |
| Sorting by `created_at` only | Adds `id` as a tie-breaker for stable pages |
| `OFFSET 100000` on a huge table without comment | Keyset pagination with a reason |
| Filters in `useState`, lost on refresh | Filters in the URL |
| Table blanks out on every keystroke | Debounced, cancelled, previous data kept visible |

#### Useful phrases
- "Let me get a thin slice working end to end, then layer on filters."
- "The sort column comes from an allow-list; values are always bound parameters."
- "I add the id as a tie-breaker so pagination is stable."
- "I fetch one extra row to know whether there's a next page without counting."
- "Filters live in the URL so the page is shareable and the back button works."

#### Common pitfalls
- **SQL injection** through sort or filter parameters.
- **Unstable ordering**, so rows repeat or vanish between pages.
- **No upper bound on `limit`**, letting someone request 1M rows.
- **Race conditions**: a slow old response overwriting a newer one.
- **Forgetting to reset pagination** when filters change.
- **Tenant leaks**: forgetting the account scope in the `WHERE` clause.

#### Follow-ups to expect (with sample answers)
- **"How would you show a total count?"**
  "`COUNT(*)` with the same filters, cached briefly, or an estimate from `EXPLAIN`/`reltuples` for big tables. Often 'Showing 1–25 of many' is enough."
- **"Search is slow. What now?"**
  "Check the plan. Add a `pg_trgm` GIN index for `ILIKE`, or switch to full-text search with `tsvector`; beyond that, a search service."
- **"How would you add infinite scroll instead?"**
  "`useInfiniteQuery` with `getNextPageParam: last => last.nextCursor` and an IntersectionObserver sentinel; plus virtualisation if the list grows large."
- **"How would you export the filtered list to CSV?"**
  "A separate endpoint that streams rows with the same filters (cursor batches) or, for big exports, a background job that emails a download link."

#### What senior interviewers look for
- **Delivering working software in the time box**, with good increments.
- **Safety by default**: validation, parameterisation, tenant scoping, limits.
- **Database and UX awareness in the same breath**.
- Clear narration of trade-offs (keyset vs offset, URL vs local state).

#### Practise it
1. Build this exact feature in 60 minutes with a timer, using any stack.
2. Write a test that pages through 1,000 rows with duplicate timestamps and checks every row appears exactly once.
3. Run `EXPLAIN ANALYZE` with and without the composite index.
4. Explain to a friend why `OFFSET` gets slow and how keyset fixes it.

## Build a signup and login flow end to end
- id: fs-build-02
- round: FULLSTACK_FEATURE_BUILD
- difficulty: medium
- levels:
- tags: authentication, sessions, password hashing, cookies, forms, security

### Prompt
Build email/password signup and login for a web app: the forms, the API endpoints, password storage, sessions and logout. Explain your security choices as you go.

### Answer
#### What the interviewer is really testing
- **Security fundamentals**: password hashing, session management, cookie flags, CSRF, rate limiting, user enumeration.
- **Clean API design** for auth endpoints and consistent error handling.
- **Form UX**: validation, accessible errors, password managers, loading states.
- Knowing what to **build vs buy**, and being able to build it properly when asked.
- **Edge cases**: duplicate emails, case sensitivity, email verification, session expiry.

#### Key points
- Hash passwords with a **slow, salted algorithm**: **Argon2id** (preferred) or bcrypt with a cost of ~12. Never SHA-256, never reversible encryption.
- **Sessions**: an opaque random session id stored server-side (database/Redis), sent in an **`HttpOnly`, `Secure`, `SameSite=Lax`** cookie. Easy revocation. (JWTs are possible but harder to revoke; explain the trade-off.)
- **Normalise emails** (trim, lowercase) and enforce a unique index on the normalised value.
- **Rate-limit** login and signup by IP and by account; add progressive delays or CAPTCHA after failures.
- **Generic errors** ("Email or password is incorrect") to avoid revealing which emails exist; signup can send "if this email is new, check your inbox" for strict anti-enumeration.
- **Regenerate the session id at login** (prevents session fixation); **destroy it at logout**.
- **CSRF**: `SameSite=Lax` cookies plus a CSRF token or `Origin` header check for state-changing requests.
- Password rules: minimum length (≥ 8, ideally 12+), check against breached-password lists, no arbitrary composition rules (NIST guidance).
- Email verification before sensitive actions.

#### Model answer
"In a real product I'd usually reach for a proven auth library or provider (Auth.js, Lucia-style patterns, Supabase Auth, Clerk). But here's how I'd build it so every piece is understood.

**Data model.**
```sql
users(id uuid pk, email citext unique not null, password_hash text not null,
      email_verified_at timestamptz, created_at timestamptz default now())
sessions(id text pk,              -- hash of the random token
         user_id uuid references users, created_at, expires_at, last_seen_at,
         user_agent, ip)
```
I store a **hash of the session token**, so a database leak doesn't hand out live sessions.

**Signup** (`POST /api/auth/signup { email, password }`):
```ts
const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254),
                        password: z.string().min(12).max(128) });
app.post('/api/auth/signup', rateLimit('signup', { perIp: 5, per: '1h' }), async (req, res) => {
  const { email, password } = Body.parse(req.body);
  if (await isBreachedPassword(password)) return res.status(422).json({ field: 'password', code: 'breached' });
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  try {
    const user = await db.users.insert({ email, password_hash: hash });
    await sendVerificationEmail(user);
    await startSession(res, user.id, req);
    return res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    if (isUniqueViolation(e)) return res.status(409).json({ field: 'email', code: 'taken' });
    throw e;
  }
});
```
(For strict anti-enumeration, I'd return the same response for taken emails and send the existing user a 'someone tried to sign up with your email' message instead. Many products accept the small enumeration risk at signup for better UX; I'd mention the choice.)

**Login** (`POST /api/auth/login`):
```ts
app.post('/api/auth/login', rateLimit('login', { perIp: 20, perAccount: 5, per: '15m' }), async (req, res) => {
  const { email, password } = Body.parse(req.body);
  const user = await db.users.findByEmail(email);
  const ok = user ? await argon2.verify(user.password_hash, password)
                  : (await argon2.verify(DUMMY_HASH, password), false); // equalise timing
  if (!ok) return res.status(401).json({ code: 'invalid_credentials' });
  await startSession(res, user.id, req);   // always a NEW session id
  res.json({ user: publicUser(user) });
});

async function startSession(res, userId, req) {
  const token = crypto.randomBytes(32).toString('base64url');
  await db.sessions.insert({ id: sha256(token), user_id: userId,
                             expires_at: addDays(new Date(), 30), ip: req.ip, user_agent: req.get('user-agent') });
  res.cookie('sid', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 30 * 864e5 });
}
```

**Session middleware.** Read the `sid` cookie → look up `sha256(token)` → check `expires_at` → attach `req.user`. Use sliding expiry (extend `expires_at` if last seen more than a day ago). An idle timeout is sensible for sensitive apps.

**Logout** (`POST /api/auth/logout`): delete the session row and clear the cookie. 'Log out of all devices' deletes all the user's sessions; a password change does the same except for the current one.

**CSRF.** Cookies are `SameSite=Lax`, which blocks cross-site POSTs in modern browsers. As defence in depth, state-changing endpoints check that the `Origin` header matches our origin (or use a double-submit CSRF token).

**Frontend forms.**
```tsx
<form onSubmit={onSubmit} noValidate>
  <label htmlFor="email">Email</label>
  <input id="email" name="email" type="email" autoComplete="email" required
         aria-invalid={!!errors.email} aria-describedby="email-error" />
  {errors.email && <p id="email-error" role="alert">{errors.email}</p>}
  <label htmlFor="password">Password</label>
  <input id="password" name="password" type={show ? 'text' : 'password'}
         autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={12} required />
  <button type="button" onClick={() => setShow(s => !s)} aria-pressed={show}>Show</button>
  <button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
</form>
```
- Correct `autocomplete` values so password managers work.
- Client-side checks for quick feedback; the server is the authority, and its field errors are mapped back to the inputs.
- On success, redirect to the page the user originally wanted (a validated, same-origin `next` param, to avoid open redirects).
- After a `401` from any API call, the app redirects to login."

#### Another worked example: adding 'forgot password'
"1. `POST /api/auth/forgot { email }` always returns 200 with 'If an account exists, we've sent a link' (no enumeration). Rate-limited.
2. If the user exists, create `password_resets(token_hash, user_id, expires_at = now + 30 min, used_at)` and email a link containing the random token.
3. `POST /api/auth/reset { token, password }`: look up the hash, check expiry and unused, set the new password hash, mark the token used, **delete all sessions** for the user, start a fresh session, and email a 'your password was changed' notice.
4. The reset page uses `autocomplete="new-password"` and shows the same password rules."

#### Step-by-step framework
1. **Decide build vs buy**; say it out loud.
2. **Schema**: normalised unique email, password hash, sessions table.
3. **Signup**: validate, breached-password check, Argon2id, verification email, session.
4. **Login**: rate limits, constant-ish timing, generic errors, new session id.
5. **Session handling**: secure cookie flags, hashed tokens, expiry, middleware.
6. **Logout and revocation**.
7. **CSRF** and open-redirect protection.
8. **Forms**: autocomplete, accessible errors, loading states; then extras (reset, MFA).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `sha256(password)` or plain text | Argon2id / bcrypt with appropriate cost |
| JWT in `localStorage` | HttpOnly, Secure, SameSite session cookie |
| "Email not found" / "Wrong password" | One generic error message |
| No rate limiting | Per-IP and per-account limits |
| Same session id before and after login | New session id at login, deleted at logout |
| Password rules: "1 uppercase, 1 symbol" | Length + breached-password check |

#### Useful phrases
- "In production I'd likely use a proven auth library, but here's how it works underneath."
- "Passwords are hashed with Argon2id, which is deliberately slow and salted."
- "The session token is random, stored hashed, and sent in an HttpOnly cookie."
- "Login errors are generic so we don't reveal which emails are registered."
- "I issue a fresh session id on login to prevent session fixation."

#### Common pitfalls
- **Weak hashing** or homemade crypto.
- **Tokens readable by JavaScript**, so any XSS steals sessions.
- **Case-sensitive emails** creating duplicate accounts.
- **Open redirects** via an unvalidated `?next=` parameter.
- **Not invalidating sessions** after a password reset.
- **Inaccessible forms**: placeholders instead of labels, errors not announced.

#### Follow-ups to expect (with sample answers)
- **"Why not JWTs?"**
  "JWTs avoid a session lookup, but they can't be revoked before expiry without a denylist, which brings the lookup back. For a single web app, server sessions are simpler and safer. JWTs make more sense for short-lived tokens between services."
- **"How would you add MFA?"**
  "TOTP with an authenticator app (store an encrypted secret, verify a 6-digit code after the password step, issue recovery codes) or passkeys. The session gets an `mfa_verified` flag, and sensitive actions require it."
- **"How do you handle the SPA and API on different domains?"**
  "Prefer the same site (`app.example.com` and `api.example.com` are same-site, so `SameSite=Lax` works). Configure CORS with credentials for the exact origin."
- **"What would you log?"**
  "Login successes and failures with IP and user agent (never passwords), password changes and session revocations, as security events the user can see."

#### What senior interviewers look for
- **Security choices explained**, not just applied.
- Awareness of **current guidance** (NIST password rules, Argon2id, passkeys).
- Clean separation of **client convenience and server authority**.
- Pragmatic **build-vs-buy** judgement.

#### Practise it
1. Implement signup, login, logout and a protected route in an Express or Next.js app with a sessions table.
2. Inspect the cookie in DevTools and confirm `HttpOnly`, `Secure` and `SameSite` are set.
3. Write tests: duplicate email (any case), wrong password message, session id changes after login, logout invalidates the session.
4. Explain to a friend why `HttpOnly` cookies beat `localStorage` for session tokens.
