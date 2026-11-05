# Full Stack Engineer — Code Review & Debugging

## Review this full stack pull request (API + UI diff)
- id: fs-review-01
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: code review, security, API, React, SQL, review comments

### Prompt
The interviewer shows a pull request adding "export my invoices as CSV": an Express endpoint and a React button. Review it out loud. What do you look for, what problems do you find, and how do you phrase your comments?

```ts
// api/invoices.ts
app.get('/api/invoices/export', async (req, res) => {
  const { userId, from, to } = req.query;
  const rows = await db.query(
    `SELECT * FROM invoices WHERE user_id = ${userId} AND created_at BETWEEN '${from}' AND '${to}'`);
  let csv = 'id,number,amount,customer\n';
  rows.forEach(r => { csv += `${r.id},${r.number},${r.amount},${r.customer_name}\n`; });
  res.send(csv);
});

// ExportButton.tsx
export function ExportButton({ userId }) {
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const onClick = async () => {
    const res = await fetch(`/api/invoices/export?userId=${userId}&from=${from}&to=${to}`);
    const text = await res.text();
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + text; a.download = 'invoices.csv'; a.click();
  };
  return <div><input onChange={e => setFrom(e.target.value)} /><input onChange={e => setTo(e.target.value)} />
         <div onClick={onClick}>Export</div></div>;
}
```

### Answer
#### What the interviewer is really testing
- A **prioritised review**: security and correctness first, then reliability and performance, then readability and style.
- Spotting **full stack issues**: SQL injection, broken authorisation (IDOR), CSV injection, unbounded queries, memory use, encoding, accessibility, error handling.
- **Constructive communication**: clear severity, reasoning and a suggested fix, without nitpicking or condescension.
- Knowing when to **approve with comments** vs **request changes**.

#### Key points
- Review **in priority order**: (1) security, (2) correctness, (3) data/performance at scale, (4) UX and accessibility, (5) maintainability and tests.
- Label comments: **blocking** vs **suggestion/nit**; explain *why* and propose a fix.
- In this PR the blockers are: **SQL injection**, **IDOR** (`userId` from the query string), **CSV injection and escaping**, **unbounded export** (memory/timeouts), and **no input validation or error handling**.
- Non-blocking but important: `SELECT *`, data-URL download for large files, missing labels/keyboard access, no tests.
- Praise good parts and keep tone collaborative: "What do you think about…".

#### Model answer
"I'd read the PR description first to understand intent ('users export their invoices for accounting'), then review in priority order. I'd request changes because of the security issues.

**Blocking: security.**
1. **SQL injection.** `userId`, `from` and `to` are interpolated into SQL. `?from=2024-01-01' OR '1'='1` returns everything; worse payloads could modify data. *Suggestion*: parameterised query:
```ts
await db.query(`SELECT id, number, amount_pence, currency, customer_name, created_at
                  FROM invoices WHERE account_id = $1 AND created_at >= $2 AND created_at < $3
                 ORDER BY created_at, id`, [req.user.accountId, from, to]);
```
2. **Broken authorisation (IDOR).** The user id comes from the query string, so anyone can export anyone's invoices by changing `userId`. *Suggestion*: use the authenticated user from the session (`requireUser` middleware) and drop the parameter entirely. Also, invoices probably belong to an account/org rather than a user; check with product.
3. **CSV injection.** Customer names like `=HYPERLINK("http://evil",...)` execute as formulas when opened in Excel. *Suggestion*: prefix cells starting with `=`, `+`, `-`, `@`, tab or CR with `'`, and use a CSV library that also handles **quoting** of commas, quotes and newlines (a customer named `Smith, Jones` currently breaks the columns).

**Blocking: correctness and reliability.**
4. **No validation.** Missing or malformed dates produce SQL errors (500s). *Suggestion*: Zod schema for `from`/`to` (ISO dates, `from <= to`, max range e.g. 1 year), 400 on invalid input.
5. **Unbounded export.** A large account could have 500k invoices; building one giant string in memory and sending it can exhaust memory and time out. *Suggestion*: stream rows (cursor/`pg-query-stream`) through a CSV stringifier to the response, or for very large exports, a background job that emails a download link.
6. **Headers.** Set `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="invoices-2026-10.csv"`; add a UTF-8 BOM if Excel users need accented names to display correctly.
7. **Amounts.** `amount` presumably in minor units; the export should format it (`12.50`) and include currency, or the accounting team will misread it.

**Frontend.**
8. **Download approach.** Building a `data:` URL from the whole response text breaks on large files and on `#` characters (unencoded). Since the endpoint uses cookie auth and sets `Content-Disposition`, the button can simply be a link: `<a href="/api/invoices/export?from=…&to=…" download>`; or use `res.blob()` + `URL.createObjectURL` if we need to handle errors first.
9. **Error handling.** If the request fails, the user downloads an error page named `invoices.csv`. Check `res.ok` and show an error message.
10. **Accessibility.** The 'button' is a `div` (not focusable, no keyboard support, no role) and the inputs have no labels or types. *Suggestion*: `<button type="button">`, `<label>` + `<input type="date">`, disable the button while exporting with a 'Preparing…' state.
11. `userId` prop no longer needed once the server uses the session.

**Non-blocking.**
12. `SELECT *` → select explicit columns, which avoids leaking new sensitive columns into exports later.
13. Tests: API tests for auth (another account's invoices never included), validation, escaping (`=cmd` and commas) and a component test for the error state.
14. Consider rate limiting the export endpoint.

**Tone.** Comments would read like: 'Blocking: this interpolates query params into SQL, which allows SQL injection (e.g. `from=' OR 1=1 --`). Could we use parameters like this? …' And I'd add a positive note: 'Nice that this is scoped to a date range; makes the export much more useful for month-end.'"

#### Another worked example: phrasing a review that lands well
"Compare two comments on the same issue:
- 'This is wrong. Never put user input in SQL.'
- 'Blocking: `from` and `to` go straight into the SQL string, so a crafted value could read or change other data (SQL injection). Switching to `$1/$2` parameters fixes it; I've suggested the change inline. Happy to pair on it if useful.'
The second states severity, impact, the fix and an offer of help. Reviews are about the code and the users, not the author. For a junior author I'd also link a short reference (the OWASP SQL injection cheat sheet) rather than lecture in the comment."

#### Step-by-step framework
1. **Understand intent**: PR description, ticket, screenshots.
2. **Security**: injection, authn/authz, data exposure, XSS/CSV injection, secrets.
3. **Correctness**: validation, edge cases, error handling, encoding, money/time.
4. **Scale**: unbounded queries, memory, N+1, indexes, timeouts.
5. **UX & accessibility**: semantics, labels, states, errors.
6. **Maintainability & tests**.
7. **Communicate**: severity labels, reasons, concrete suggestions, positives; request changes only for blockers.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Starts with naming and formatting nits | Security and correctness first |
| Misses the `userId` IDOR | Spots authorisation via query param |
| Fixes SQL injection only | Also CSV injection, quoting, encoding |
| Ignores scale | Streams or backgrounds large exports |
| Doesn't look at the frontend | Reviews download handling, errors, accessibility |
| Blunt or vague comments | Severity, impact, suggested fix, kind tone |

#### Useful phrases
- "I'll go in priority order: security, correctness, scale, then UX and style."
- "Blocking: this lets any user export another user's invoices by changing the id."
- "Suggestion, not blocking: selecting explicit columns protects us from leaking future fields."
- "Here's what I'd change, and why."
- "Nice work on X; one thing I'd like us to fix before merging is Y."

#### Common pitfalls
- **Bike-shedding** while missing the security holes.
- **Reviewing only the backend** in a full stack PR.
- **Rewriting the PR in comments** instead of pointing out key issues with suggestions.
- **No severity labels**, leaving the author guessing what must change.
- **Approving with known blockers** 'to keep things moving'.

#### Follow-ups to expect (with sample answers)
- **"How long should a review take?"**
  "For a PR this size, 15–30 minutes. If PRs regularly need an hour, they're too big; I'd ask for smaller ones."
- **"What if the author disagrees with a blocking comment?"**
  "Discuss the risk with evidence (a demo payload); if still unresolved, involve a third person or the security champion. Security issues don't get waived silently."
- **"Would you use automated tools?"**
  "Yes: lint rules for SQL template strings, Semgrep/CodeQL for injection patterns, axe in tests. Humans focus on logic and design."
- **"How do you review AI-generated code?"**
  "The same way, with extra attention to plausible-looking but wrong details: auth checks, edge cases, and invented APIs."

#### What senior interviewers look for
- **Prioritisation** and breadth across the stack.
- **Security instincts** (IDOR, injection variants).
- **Constructive, clear communication**.
- **Pragmatic suggestions**, not rewrites.

#### Practise it
1. Take this snippet and write the fixed version (endpoint with streaming, validation and escaping; accessible button).
2. Exploit the original locally with an SQL injection and a CSV formula payload to see the impact.
3. Review a real PR using severity labels and see how the author responds.
4. Explain IDOR to a friend in one minute.

## A bug only happens in production: trace it across the stack
- id: fs-review-02
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: debugging, production, incident, environment differences, observability

### Prompt
Users report that saving their profile "sometimes fails" in production. You can't reproduce it locally or in staging. Walk through how you'd investigate across the frontend, network, API and database, and how you'd fix it safely.

### Answer
#### What the interviewer is really testing
- A **methodical debugging process** under uncertainty: gather evidence, form hypotheses, test them.
- Knowing the **usual production-only causes**: data shapes, scale/concurrency, configuration, infrastructure (proxies, CDNs, load balancers), third parties, browser/device diversity, timeouts.
- Using **observability tools** (RUM, error tracking, traces, logs) to narrow the problem.
- **Safe reproduction and fixing**: anonymised data, feature flags, canaries, regression tests.
- Communication during an incident.

#### Key points
- **Scope first**: who, when, how often, which browsers/regions/accounts, since which release?
- **Gather evidence** before theorising: error tracker events, RUM failed requests, API logs and traces for failing requests, status codes, payloads (redacted).
- **Production-only differences**: real data (long names, emoji, nulls, legacy rows), concurrency, multiple instances, proxies/WAF/CDN rules, request size limits, timeouts, config/flags, third-party behaviour, clock skew, old cached clients.
- **Bisect**: compare failing vs succeeding requests; correlate with deploys, flags, regions, instance ids.
- **Reproduce** with production-like data (anonymised copy, the exact payload) or in production safely (a test account, feature flag).
- **Fix with a test**, deploy carefully, verify with the same metrics, and write a short post-incident note.

#### Model answer
"I'd resist guessing and collect evidence until the failing case is precise.

**1. Scope.**
- Error tracker: `ProfileSaveError` events, ~2% of saves, started three days ago, all browsers.
- RUM/network logs: failing requests are `PATCH /api/profile` returning **413 Payload Too Large** for some users and **502** for others.
- Release history: three days ago we released 'profile photos as data URLs in the profile payload'.

**2. Compare failing and succeeding requests.**
- Traces show 413s are returned by the **load balancer/WAF**, never reaching the app: request bodies over 1 MB. Locally there's no proxy with that limit; staging has smaller test images.
- 502s: requests between 1 MB and the WAF limit reach the app, but the app's body parser limit is 100 KB in production config (`BODY_LIMIT` env var) vs unlimited in dev; the parser throws and, due to a bug in error middleware, the process returns no response before the proxy timeout.
- So the root cause is design: sending images inside JSON, plus environment-specific limits and an error-handling bug.

**3. Reproduce.** Locally, set the same `BODY_LIMIT` and add a reverse proxy with a 1 MB limit (or test against staging with a 2 MB photo). Both errors reproduce.

**4. Fix in stages.**
- **Immediate mitigation**: client-side resize/compress photos before upload (cap at ~200 KB), and show a clear error for oversize payloads instead of a generic failure. Deploy behind a flag, verify the error rate drops.
- **Proper fix**: upload photos via presigned URLs to object storage; the profile `PATCH` sends only the resulting key. Profile payloads become tiny again.
- **Error handling bug**: fix the error middleware so body-parser errors return `413` JSON responses; add a test.
- **Config parity**: document body limits for every environment; staging uses production-like proxy settings.

**5. Verify and follow up.** Save failure rate returns to baseline in RUM and the error tracker. A short incident note covers timeline, root cause, why tests missed it (no production-like limits in staging; small test images) and actions (parity checklist, large-payload test case)."

#### Another worked example: a bug caused by real data
"A different 'sometimes fails' case: saving failed only for some users with a 500. Logs showed `invalid input value for enum country_code: "GB "`. Legacy users imported years ago had trailing spaces in a field the new validation didn't trim, and the new code wrote it to an enum column. Local and staging seed data had clean values. Fix: normalise (trim, uppercase) at the API boundary, add a migration cleaning legacy rows, and add a property-based test with messy strings. Production data is always messier than fixtures."

#### Step-by-step framework
1. **Scope**: who, when, how often, since which change.
2. **Evidence**: errors, RUM, traces, logs, status codes, payloads.
3. **List production-only differences**: data, scale, config, infrastructure, third parties, clients.
4. **Compare** failing vs succeeding cases; correlate with deploys/flags/instances.
5. **Reproduce** with production-like conditions.
6. **Mitigate quickly**, then fix properly, with tests.
7. **Verify** with the same signals; write up and improve parity.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Can't reproduce, so add retries" | Collects evidence until the failure is precise |
| Looks only at app logs | Checks proxies, WAF, CDN, browser and network too |
| Guesses root cause from code reading | Compares failing vs succeeding requests |
| Hotfixes directly in production | Mitigation behind a flag, then a proper fix |
| No test added | Regression test reproducing the case |
| Fix and forget | Write-up and environment parity improvements |

#### Useful phrases
- "Before theorising, let me get the failing requests and compare them with successful ones."
- "Production differs in data, scale, config and infrastructure; let's check each."
- "The 413 is coming from the load balancer, not our app, which explains why we never saw it locally."
- "I'd mitigate first, then fix the design."
- "We should make staging limits match production so this class of bug shows up earlier."

#### Common pitfalls
- **Assuming the app produced the error** when a proxy did.
- **Ignoring old clients** (cached JS) sending old payload shapes.
- **Testing with tidy fixtures** only.
- **Fixing symptoms** (retries, bigger limits) rather than causes.
- **Debugging in production** without safeguards.

#### Follow-ups to expect (with sample answers)
- **"How do you safely inspect production data?"**
  "Read-only access, audited queries, minimal fields, and an anonymised snapshot for local reproduction."
- **"What if there are no logs for the failing requests?"**
  "Add targeted instrumentation behind a flag (log request size and status at the edge and app), deploy, and wait for occurrences."
- **"How do you communicate during this?"**
  "Post an update in the incident channel with impact, current hypothesis and next update time; inform support with a workaround."
- **"Could feature flags help debug?"**
  "Yes: turn the new behaviour off for a segment to confirm causality, or enable verbose logging for affected accounts only."

#### What senior interviewers look for
- **Evidence-driven** debugging and clear hypotheses.
- **Whole-system awareness** (proxies, configs, data).
- **Safe mitigation** and durable fixes.
- **Learning loop** after the incident.

#### Practise it
1. Put Nginx with a 1 MB body limit in front of a local app and observe how errors look to the browser.
2. Write a checklist of production-vs-local differences for an app you work on.
3. Practise reading a trace to tell whether an error came from the edge, the app or the database.
4. Explain to a friend how you'd debug a bug you can't reproduce.

## Data looks wrong in the UI: frontend, API or database?
- id: fs-review-03
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: debugging, data integrity, caching, time zones, serialization, binary search

### Prompt
A customer says their dashboard shows yesterday's revenue as £1,240 but their own records say £1,420, and the "orders" count also seems off. Walk through how you'd find out whether the problem is in the UI, the API, a cache, the data pipeline or the database.

### Answer
#### What the interviewer is really testing
- **Bisecting the data path**: database → query → API → cache → client state → rendering.
- Knowing **common culprits**: time zones and date boundaries, stale caches, rounding and money units, pagination/limits, filters, duplicated or missing rows in pipelines, race conditions, serialisation (floats, big numbers).
- **Verifying at each layer** with concrete checks, not assumptions.
- **Communicating** with the customer and fixing the root cause with tests.

#### Key points
- **Define "correct"** first: what does the customer count (orders created vs paid? refunds? tax included? which time zone's "yesterday")?
- **Bisect the path**: query the database directly → call the API directly → check cache contents → inspect the network response in the browser → inspect what's rendered.
- The layer where the number first diverges is where the bug is.
- Classic causes: **UTC vs local day boundaries**, **stale cached aggregates**, **pagination limits** (summing only the first page), **floating-point money**, **filters** (status, test orders), **double-counting** joins, **late-arriving events** in rollups, **client-side transformations**.
- Fix and **add a reconciliation test or check** for the metric.

#### Model answer
"I'd first pin down the definition, then walk the data path layer by layer until the numbers diverge.

**1. Clarify with the customer (via support).**
- 'Yesterday' in which time zone? Their business is in New York.
- Revenue: gross or net of refunds? Including tax and shipping? Paid orders only?
- Their £1,420 comes from their payment provider export, which uses their account's local time.

**2. Database ground truth.** I write the query that matches their definition directly:
```sql
select count(*), sum(total_pence) / 100.0
  from orders
 where account_id = $1 and status in ('paid','fulfilled')
   and paid_at >= ('2026-11-04 00:00' at time zone 'America/New_York')
   and paid_at <  ('2026-11-05 00:00' at time zone 'America/New_York');
```
Result: 31 orders, £1,420.00. The data is right in the database.

**3. The dashboard's query.** Reading the API code (or logging the generated SQL), the endpoint computes 'yesterday' with `date_trunc('day', now())` in **UTC**. The UTC day 4 November covers 8 pm 3 November to 8 pm 4 November in New York. Running that query returns £1,240 and 28 orders. **Divergence found at the API query.**

**4. Check other layers anyway** (there may be more than one bug):
- **Cache**: the API response is cached for 10 minutes keyed by account and date; fine, but the key uses the UTC date too, so it'll need to include the time zone after the fix.
- **Network**: the browser receives `{ revenue: 1240, orders: 28 }`, matching the API.
- **Client**: the UI formats `revenue` correctly; no client-side transformation issues.

**5. Fix.**
- Store each account's time zone (we already do in settings); compute day boundaries in that zone on the server, as above; pass `tz` explicitly through the rollup and cache key.
- If the dashboard uses pre-aggregated daily rollups, the rollups must also be bucketed by account time zone (or hourly in UTC and summed into local days at query time).
- Tests: a fixture with orders at 23:30 and 00:30 New York time around a day boundary, and around a DST change, asserting the correct day assignment.
- Show the time zone on the dashboard ('Times shown in New York time') to remove ambiguity.

**6. Communicate.** Tell the customer what happened, that the underlying data was correct, and when the fix ships. Check whether other customers in non-UTC zones were affected and whether any reports or emails used the same logic."

#### Another worked example: the number was right, then wrong after an edit
"Another case: a user edits an order total and the dashboard keeps showing the old revenue for a while, then corrects itself. Bisecting: database correct immediately; API correct when called with a cache-busting header; the normal API response is served from a Redis cache with a 15-minute TTL that isn't invalidated on order edits; additionally the client's TanStack Query `staleTime` is 5 minutes. Fixes: invalidate the account's dashboard cache keys on order changes (or tag-based invalidation), and invalidate the client query after the edit mutation succeeds. Different symptom, same method: find the first layer where the value differs."

#### Step-by-step framework
1. **Define the metric precisely** (time zone, inclusions, statuses).
2. **Compute ground truth** directly from the source data.
3. **Walk the path**: query → API → cache → network → client state → render.
4. **Find the first divergence**; inspect that layer's logic.
5. **Check neighbouring layers** for additional issues.
6. **Fix at the root** with boundary tests.
7. **Assess blast radius** and communicate.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Probably a caching issue" | Measures at each layer before deciding |
| Starts editing UI formatting | Establishes database ground truth first |
| Ignores definitions | Clarifies time zone, statuses, refunds, tax |
| Fixes one customer's numbers manually | Fixes the logic and checks blast radius |
| No tests | Day-boundary and DST fixture tests |
| Silent fix | Communicates with the customer and support |

#### Useful phrases
- "First, let's agree what 'yesterday's revenue' means for this customer."
- "The database says £1,420, so the data's fine; now I'll find where it changes."
- "The first layer where the number diverges is where the bug lives."
- "Day boundaries must be computed in the account's time zone."
- "Who else is affected by the same logic?"

#### Common pitfalls
- **UTC day boundaries** for local business days.
- **Summing only the first page** of results on the client.
- **Floating-point money** (`0.1 + 0.2`) instead of integer minor units.
- **Joins that double-count** (orders × items).
- **Assuming the cache** without checking.

#### Follow-ups to expect (with sample answers)
- **"How would you prevent metric bugs generally?"**
  "Define metrics in one place (a semantic layer or shared query module), add reconciliation jobs comparing dashboards with source-of-truth totals, and alert on mismatches."
- **"What if the payment provider and our DB disagree?"**
  "Run a reconciliation by transaction id to find missing or duplicated orders (failed webhooks, retries), then fix the ingestion path."
- **"How do you debug when you can't access production data?"**
  "Ask for a minimal export or screen share, use audited support tooling, and reproduce with synthetic data around the suspected boundary."
- **"Why integer pence?"**
  "Floating-point can't represent many decimal amounts exactly, so sums drift; integers in minor units are exact, and you format at the edge."

#### What senior interviewers look for
- **Disciplined bisection** across layers.
- **Domain precision** (definitions, time zones, money).
- **Root-cause fixes** with tests and blast-radius checks.
- **Customer communication**.

#### Practise it
1. Write the 'yesterday in the account's time zone' query in Postgres and test it across a DST change.
2. Take a dashboard you know and list every layer a number passes through.
3. Build a tiny reconciliation script comparing an aggregate with raw rows.
4. Explain to a friend why UTC day boundaries cause wrong daily totals.

## Race conditions between UI and server state
- id: fs-review-04
- round: CODE_REVIEW_DEBUG
- difficulty: hard
- levels:
- tags: race conditions, concurrency, optimistic updates, stale closures, idempotency, React

### Prompt
Users report intermittent weirdness: search results showing for an old query, a toggle that flips back after clicking, and occasionally duplicated items after double-clicking "Add". Explain the race conditions likely behind each, how you'd confirm them, and how to fix them on both client and server.

### Answer
#### What the interviewer is really testing
- Recognising **classic UI/server races**: out-of-order responses, stale closures, optimistic updates overwritten by refetches, double submissions, concurrent edits.
- Knowing **client fixes** (cancellation, request keys, latest-wins, mutation serialisation, disabling) and **server fixes** (idempotency, constraints, version checks).
- **Reproducing timing bugs** deliberately (throttling, artificial delays, tests with controlled promises).
- Choosing fixes that remain correct under retries and multiple tabs.

#### Key points
- **Out-of-order responses**: request for "re" returns after the request for "react", overwriting newer results. Fix: cancel previous requests (AbortController), key results by query, or ignore responses that don't match the latest request id.
- **Optimistic update overwritten**: a background refetch started *before* the mutation returns stale data *after* the optimistic update, flipping the toggle back. Fix: cancel in-flight queries for that key when mutating (`cancelQueries`), invalidate after the mutation settles, or version-check responses.
- **Rapid toggles**: multiple PATCHes race; final server state may not match the last click. Fix: send desired state (idempotent), serialise or coalesce mutations per entity.
- **Double submit**: two POSTs create duplicates. Fix client-side (disable while pending) **and** server-side (idempotency keys, unique constraints), because retries and double taps still happen.
- **Stale closures** in React: callbacks capturing old state (`setCount(count + 1)` twice). Fix with functional updates and correct dependencies.
- **Concurrent edits across tabs/users**: last write wins silently. Fix with version checks (409) and merges.
- **Reproduce** with network throttling, artificial server delays, and tests that resolve promises out of order.

#### Model answer
"Each symptom maps to a well-known race; I'd confirm each by forcing the timing, then fix it on the client and, where data integrity is involved, on the server.

**1. Search shows results for an old query (out-of-order responses).**
*Confirm*: add random 0–2 s server delay in dev, type 'react' quickly; sometimes results for 're' appear last.
*Cause*:
```ts
useEffect(() => { fetch(`/search?q=${q}`).then(r => r.json()).then(setResults); }, [q]);
```
Every keystroke starts a request; whichever finishes last wins.
*Fix*:
```ts
useEffect(() => {
  const ctrl = new AbortController();
  fetch(`/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
    .then(r => r.json()).then(setResults)
    .catch(e => { if (e.name !== 'AbortError') setError(e); });
  return () => ctrl.abort();             // abort the previous request when q changes
}, [q]);
```
Or use TanStack Query keyed by `['search', q]`, which renders the entry for the current key regardless of arrival order. Add debouncing to reduce load.

**2. Toggle flips back after clicking (optimistic update vs stale refetch).**
*Confirm*: the network panel shows a `GET /settings` (triggered by window focus or polling) that started before the `PATCH` and finished after it, returning the old value.
*Fix (TanStack Query)*:
```ts
useMutation({
  mutationFn: (enabled: boolean) => api.patch('/settings', { notifications: enabled }),
  onMutate: async (enabled) => {
    await qc.cancelQueries({ queryKey: ['settings'] });          // stop stale in-flight fetches
    const prev = qc.getQueryData(['settings']);
    qc.setQueryData(['settings'], (s) => ({ ...s, notifications: enabled }));
    return { prev };
  },
  onError: (_e, _v, ctx) => qc.setQueryData(['settings'], ctx.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: ['settings'] }),   // reconcile after
});
```
If users click rapidly, I'd send the **desired state** (idempotent PATCH) and coalesce so only the latest intent is sent after the in-flight request finishes.

**3. Duplicate items after double-clicking 'Add' (double submission).**
*Confirm*: two `POST /items` requests ~50 ms apart in the network panel; two rows in the database.
*Client fix*: disable the button while the mutation is pending (`disabled={mutation.isPending}`), or ignore clicks while pending.
*Server fix* (essential, because double taps, retries and flaky networks still happen):
- **Idempotency key**: the client generates a UUID when the form opens and sends `Idempotency-Key`; the server stores key → response and returns the stored response for repeats.
- Or a **client-generated id** for the new item with `INSERT ... ON CONFLICT (id) DO NOTHING`.
- Or a natural **unique constraint** (e.g. one item with the same name per list) if the domain has one.

**4. Related: stale closures.**
```ts
const increment = () => { setCount(count + 1); setCount(count + 1); };   // +1, not +2
const increment = () => { setCount(c => c + 1); setCount(c => c + 1); }; // +2
```
And intervals/listeners capturing old state: use refs or functional updates, with correct effect dependencies.

**5. Concurrent edits (two tabs or two people).** Version numbers on records, `409` on mismatch, and a merge or 'reload' prompt in the UI.

**Testing these races.** Component tests with MSW handlers that resolve in a controlled order (resolve the second request first and assert the UI shows the latest); API tests that send the same idempotency key twice concurrently and assert one row; E2E with network throttling for smoke coverage."

#### Another worked example: a race between two tabs
"A user had the settings page open in two tabs. In tab A they turned on 'weekly digest'; in tab B (stale) they changed their display name and saved the whole settings object, which still had 'weekly digest: off'. The second save silently reverted the first. Fixes: send **partial updates** (PATCH only changed fields) instead of the whole object, and include a version so the server rejects saves based on stale data; refetch on window focus so tab B shows current data. Whole-object PUTs from stale clients are a common source of 'my setting keeps resetting' bugs."

#### Step-by-step framework
1. **Map symptoms to race types**: out-of-order, stale refetch, rapid mutations, double submit, stale closures, concurrent edits.
2. **Reproduce** with delays, throttling and controlled-order tests.
3. **Client fixes**: cancellation, keyed results, cancelQueries, coalescing, disabling, functional updates.
4. **Server fixes**: idempotency keys, client ids, unique constraints, version checks, partial updates.
5. **Test** the race explicitly.
6. **Review patterns** in the codebase so similar bugs are fixed everywhere.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add a loading spinner" | Identifies the specific race and its mechanism |
| Disables the button only | Client guard **and** server idempotency |
| Ignores in-flight refetches | `cancelQueries` before optimistic updates |
| `setState(state + 1)` patterns | Functional updates, correct dependencies |
| Whole-object saves | Partial updates with version checks |
| Can't reproduce, so closes the ticket | Forces timing with delays and ordered tests |

#### Useful phrases
- "The last response to arrive wins, and that's not necessarily the latest request."
- "A refetch that started before the mutation can overwrite the optimistic state, so I cancel it first."
- "Disabling the button helps, but the server must be idempotent anyway."
- "Send the state you want, not 'toggle'."
- "I'd write a test that resolves the responses in the wrong order."

#### Common pitfalls
- **Fixing only the UI** for data-integrity races.
- **Relying on timing assumptions** ('the server is fast').
- **Effects without cleanup**, leaving stale requests updating unmounted components.
- **Optimistic updates without rollback**.
- **Whole-object writes** from stale state.

#### Follow-ups to expect (with sample answers)
- **"How does React 18+ help or hurt?"**
  "Concurrent rendering and Strict Mode's double-invoked effects in development surface missing cleanups; `useTransition`/`useDeferredValue` help keep typing responsive but don't fix network races."
- **"How do idempotency keys work under concurrency?"**
  "The server inserts the key with status 'in progress' under a unique constraint; a concurrent duplicate either waits and returns the stored result or gets a 409 'in progress'."
- **"What about WebSocket events racing with HTTP responses?"**
  "Use versions or sequence numbers; apply an update only if its version is newer than what the cache holds."
- **"How do you find these bugs proactively?"**
  "Code review checklists (cleanup in effects, idempotent mutations), lint rules for hooks, and chaos-style tests with randomised delays."

#### What senior interviewers look for
- **Precise mental models** of each race.
- **Defence on both client and server**.
- **Ability to reproduce** timing bugs deliberately.
- **Systemic fixes** across the codebase.

#### Practise it
1. Build a search box without cancellation, add random server delays, observe the bug, then fix it two ways.
2. Reproduce the 'toggle flips back' bug with a polling query and fix it with `cancelQueries`.
3. Implement an idempotency-key middleware and test concurrent duplicates.
4. Explain to a friend why disabling the button isn't enough.

## Reviewing a database migration
- id: fs-review-05
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: migrations, code review, Postgres, locking, data safety, rollback

### Prompt
A teammate's PR includes this migration for a 40M-row `orders` table, deployed together with the code that uses it. Review it: what could go wrong in production, and what would you ask them to change?

```sql
ALTER TABLE orders ADD COLUMN channel varchar(20) NOT NULL DEFAULT 'web';
UPDATE orders SET channel = 'app' WHERE source LIKE '%mobile%';
ALTER TABLE orders RENAME COLUMN source TO legacy_source;
CREATE INDEX idx_orders_channel ON orders(channel);
ALTER TABLE orders ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id);
```

### Answer
#### What the interviewer is really testing
- Knowing **Postgres locking behaviour** for common DDL and how it affects a live system.
- Spotting **backward-compatibility** problems with rolling deploys (old code still running).
- **Large data updates** in a single transaction: locks, WAL volume, replication lag, timeouts.
- **Safe alternatives**: `CONCURRENTLY`, `NOT VALID` + `VALIDATE`, batched backfills, expand–contract.
- **Rollback and verification** planning.

#### Key points
- **ADD COLUMN with a constant default** is metadata-only in Postgres 11+ (fast), but it still takes a brief `ACCESS EXCLUSIVE` lock, which can queue behind long transactions: set `lock_timeout`.
- **One big `UPDATE` on 40M rows** (or a matching subset) locks those rows for the whole transaction, generates huge WAL, bloats the table, causes replica lag, and may time out. Do it in **batches** outside the migration.
- **RENAME COLUMN** breaks **old code still running** during a rolling deploy (and any reports/ETL using `source`). Needs expand–contract.
- **CREATE INDEX** without `CONCURRENTLY` blocks writes for the whole build (minutes on 40M rows).
- **ADD FOREIGN KEY** scans the table and locks both tables; use `NOT VALID` then `VALIDATE CONSTRAINT` (which doesn't block writes). Also check orphaned rows exist first.
- If the migration tool wraps everything in **one transaction**, all locks are held until the end, multiplying the impact. `CONCURRENTLY` can't run in a transaction at all.
- Consider **`varchar(20)` vs text + check constraint**, the `LIKE '%mobile%'` correctness, and whether the default is semantically right for old rows.

#### Model answer
"I'd request changes. Individually some of these statements are fine, but together, in one transaction, deployed with the code, they risk a long outage and break running code. My review comments:

**1. Run order and transaction scope (blocking).** Most migration tools wrap a file in one transaction. Then the `ACCESS EXCLUSIVE` lock from `ADD COLUMN` is held while the `UPDATE`, index build and FK validation run: potentially many minutes during which **all reads and writes to `orders` block**. Please split into separate migrations, each small, with `SET lock_timeout = '5s'` so a lock wait fails fast instead of queueing every request behind it.

**2. `ADD COLUMN ... NOT NULL DEFAULT 'web'` (OK with a tweak).** Fast in Postgres 11+ since the default is constant. Keep it, in its own migration with `lock_timeout`. Question for product: is 'web' actually correct for historical orders that came from other channels (e.g. phone, marketplace)? Maybe default to `'unknown'` for old rows and set 'web' in application code for new ones. I'd also suggest `text` with a `CHECK (channel IN ('web','app','phone','marketplace','unknown'))` rather than `varchar(20)`, so invalid values can't appear.

**3. The `UPDATE` (blocking).** A single update over a 40M-row table (`LIKE '%mobile%'` can't use an index, so it scans everything) will hold row locks for its duration, write a lot of WAL, lag replicas and may hit statement timeouts. Please move it to a **batched backfill job**:
```sql
update orders set channel = 'app'
 where id in (select id from orders where channel <> 'app' and source ilike '%mobile%'
              and id > $last_id order by id limit 5000)
returning id;
```
Run in a loop with short sleeps, monitor replication lag, idempotent and resumable. Also: is `LIKE '%mobile%'` the right rule? Values like `'mobile-web'` would be classified as app. Let's check the distinct values of `source` first (`select source, count(*) ... group by 1`).

**4. `RENAME COLUMN` (blocking).** During a rolling deploy, old app instances still query `source` and will error the moment the rename commits. Analytics/ETL jobs may use it too. Use expand–contract instead: keep `source`, add `channel`, have new code read `channel`; drop or rename `source` in a later release once nothing uses it (search the codebase, check the data warehouse sync). Is the rename needed at all?

**5. `CREATE INDEX` (blocking).** Without `CONCURRENTLY`, this blocks writes for the entire build. Use:
```sql
create index concurrently if not exists idx_orders_channel on orders (channel);
```
in its own non-transactional migration. Also question whether it's needed: with 4–5 distinct values, a plain index on `channel` is rarely selective; if queries filter by channel *and* date, a composite `(channel, created_at)` or a partial index may be better. What query is it for?

**6. Foreign key (blocking).** Adding the FK validates every row while holding locks on `orders` and `customers`. And if any orphaned `customer_id`s exist, the migration fails midway. Safer:
```sql
-- first, check for orphans
select count(*) from orders o left join customers c on c.id = o.customer_id
 where o.customer_id is not null and c.id is null;
alter table orders add constraint orders_customer_fk
  foreign key (customer_id) references customers(id) not valid;    -- instant, enforces for new rows
alter table orders validate constraint orders_customer_fk;          -- scans without blocking writes
```
Also make sure `orders.customer_id` is indexed, or deleting customers will scan `orders`.

**7. Deploy ordering and rollback.** Expand migrations (new column, index, FK `NOT VALID`) go out **before** the code that uses them; the backfill runs as a job; the rename/drop comes in a later release. Rollback: reverting the app is safe because the old code ignores `channel`. Please add a short plan to the PR description: steps, expected duration, how to monitor (lock waits, replication lag), and how to abort.

**8. Tests.** Run the migrations against a production-sized copy or at least check them with a linter like `squawk`, which flags non-concurrent indexes, renames and validating constraints."

#### Another worked example: a 'harmless' migration that caused an outage
"A team ran `ALTER TABLE orders ADD COLUMN notes text;`, normally instant. But a long-running analytics query was reading `orders` at the time. The `ALTER` waited for an `ACCESS EXCLUSIVE` lock, and every subsequent query on `orders` queued behind the waiting `ALTER`. Checkout stalled for four minutes until the analytics query finished. With `lock_timeout = '5s'`, the migration would have failed harmlessly and been retried. 'Instant' DDL still needs a lock, and lock queues are what cause outages."

#### Step-by-step framework
1. **Check transaction scope** and split risky statements.
2. **For each statement**: lock level, duration, table size.
3. **Backward compatibility** with old running code and downstream consumers.
4. **Replace risky operations**: `CONCURRENTLY`, `NOT VALID`/`VALIDATE`, batched backfills, expand–contract.
5. **Data correctness**: defaults, classification rules, orphans.
6. **Indexes justified** by real queries.
7. **Deploy order, monitoring, rollback plan**.
8. **Automate checks** (migration linters, staging with real-size data).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Looks fine, SQL is valid" | Analyses locks, duration and compatibility per statement |
| Misses the transaction wrapping | Splits migrations, adds `lock_timeout` |
| Keeps the big UPDATE | Batched, resumable backfill job |
| Accepts the rename | Expand–contract; checks downstream consumers |
| Plain `CREATE INDEX` | `CONCURRENTLY`, and questions the index's value |
| FK added directly | Orphan check, `NOT VALID` then `VALIDATE` |

#### Useful phrases
- "In one transaction, these locks are held together for the whole run."
- "The rename breaks old instances during the rolling deploy."
- "The backfill should be a batched job, not part of the migration."
- "`NOT VALID` then `VALIDATE` adds the FK without blocking writes."
- "Can we add a lock timeout and a short rollout plan to the PR?"

#### Common pitfalls
- **Lock queues** behind long transactions.
- **Massive single-transaction updates.**
- **Breaking running code** with renames/drops.
- **Forgetting downstream consumers** (ETL, BI, other services).
- **Indexes nobody needs** that slow writes.

#### Follow-ups to expect (with sample answers)
- **"What lock does CREATE INDEX CONCURRENTLY take?"**
  "A `SHARE UPDATE EXCLUSIVE` lock, which allows reads and writes but not other schema changes; it takes longer and must not run in a transaction."
- **"How do you know what queries use `source`?"**
  "Search the code, check `pg_stat_statements` for queries mentioning it, and ask data/analytics owners; temporarily log access if unsure."
- **"Would you run migrations automatically in CI/CD?"**
  "Yes for safe, linted migrations with timeouts; risky ones (big backfills) run as separate, monitored jobs."
- **"How do you test migration duration?"**
  "Restore a recent anonymised production snapshot to a staging database and time each step there."

#### What senior interviewers look for
- **Locking expertise** and operational empathy.
- **Compatibility** across deploys and consumers.
- **Safe rewrites** of each risky step.
- **Clear review communication** with a rollout plan.

#### Practise it
1. Reproduce a lock queue locally: hold a long transaction, run `ALTER TABLE`, and watch other queries block; then retry with `lock_timeout`.
2. Rewrite this migration as a safe sequence of migrations plus a backfill job.
3. Run `squawk` on a few migrations in a project you know.
4. Explain `NOT VALID` + `VALIDATE CONSTRAINT` to a friend.
