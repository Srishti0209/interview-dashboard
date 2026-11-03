# Backend Engineer — Code Review & Debugging

## What do you look for in a code review?
- id: be-review-01
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: code review, quality, collaboration, feedback

### Prompt
What do you look for when reviewing a pull request? How do you give feedback, and how do you keep reviews fast and useful?

### Answer
#### What the interviewer is really testing
- A **prioritised** view of what matters (correctness, design, security) vs nitpicks.
- **Backend-specific** concerns: data integrity, concurrency, migrations, performance, observability.
- **Communication**: kind, specific, actionable feedback; distinguishing blocking from optional comments.
- **Team process**: small PRs, automation, turnaround time, knowledge sharing.

#### Key points
- Start with **context**: what problem is this solving? Read the description, ticket, design doc.
- Priorities: **correctness** → **design/architecture fit** → **security** → **data and migrations** → **performance** → **error handling and observability** → **tests** → **readability** → style (automate).
- Backend checks: transactions and consistency, idempotency, concurrency, N+1 queries, migrations (locking, backward compatibility), timeouts/retries, logging without secrets, API compatibility.
- Feedback: ask questions, explain **why**, suggest alternatives, label comments (**blocking**, **suggestion**, **nit**), praise good work.
- Process: **small PRs**, quick turnaround (e.g. within a working day), linters/formatters for style, checklists, pairing for complex changes.

#### Model answer
"I review in passes, from most to least important, so I don't spend my energy on naming while missing a data-loss bug.

**1. Understand the context.**
- Read the PR description, linked ticket or design doc. What's the goal? What's out of scope?
- If the description is missing or the PR is huge, I'll ask for context or suggest splitting it before diving in.

**2. Correctness.**
- Does it do what it claims? Edge cases: empty inputs, nulls, large inputs, time zones, Unicode, duplicates.
- Error paths: what happens when the DB call fails, the downstream times out, the message is redelivered?
- Concurrency: shared state, race conditions, check-then-act patterns, lost updates.

**3. Design and fit.**
- Is this the right place for this logic? Does it follow existing patterns, or introduce a new one without reason?
- Coupling: does it reach into another module's internals or tables?
- Is it over-engineered or under-engineered for the need?

**4. Security.**
- Authorisation checks on new endpoints (object-level, tenant scoping).
- Input validation, parameterised queries, no secrets in code or logs, safe handling of user-provided URLs (SSRF).

**5. Data and migrations.**
- Migrations: will they lock large tables? Are they backward compatible with the currently deployed code (expand-contract)? Is there a backfill plan?
- Transactions: are multi-step writes atomic? Are external calls kept outside transactions?
- Idempotency for retried operations and message consumers.

**6. Performance.**
- N+1 queries, missing indexes for new queries, unbounded queries (no pagination/limits), loading large data into memory, hot paths doing unnecessary work.
- I don't micro-optimise in review; I look for order-of-magnitude problems.

**7. Operability.**
- Timeouts and retries with backoff on new network calls.
- Logging and metrics for new behaviour; useful error messages; no PII in logs.
- Feature flags for risky changes; rollback considerations.

**8. Tests.**
- Do tests cover the important behaviour and edge cases, not just the happy path? Are they deterministic (no sleeps, real clock dependencies)?
- Would a test fail if the code were broken?

**9. Readability and maintainability.**
- Clear names, reasonable function size, comments explaining *why* for non-obvious decisions.
- Style issues should be handled by **formatters and linters**, not humans.

**How I give feedback:**
- **Label severity**: 'blocking: this can double-charge on retry', 'suggestion: consider extracting…', 'nit: typo'. Authors then know what must change.
- **Explain why** and offer an alternative: 'If two requests arrive together, both could pass this check. Could we use `INSERT ... ON CONFLICT` instead?'
- **Ask questions** rather than assert when unsure: 'What happens if the queue redelivers this message?'
- Comment on the code, not the person; acknowledge good work ('Nice use of the outbox here').
- For larger design disagreements, **move to a call** rather than long comment threads.

**Keeping reviews fast and useful:**
- Encourage **small PRs** (a few hundred lines); stacked PRs for larger features.
- Aim to respond within a few working hours; reviews are high-priority work because blocked PRs slow the whole team.
- Automate style, linting, type checks, security scanning in CI so humans focus on logic.
- A team review checklist for backend risks (migrations, authz, idempotency, observability).
- Rotate reviewers so knowledge spreads; pair-review complex or risky changes."

#### Another worked example: a review that prevented double charges
"A PR added automatic retries to the payment client for timeouts. The code looked clean and tests passed. In review I asked: 'If the first request actually succeeded but timed out, does the retry charge again?' It would have. We added an idempotency key per payment attempt, passed to the provider, plus a test simulating a timeout-after-success. The comment was labelled blocking, with the reasoning and a suggested fix."

#### A third worked example: a migration that would have locked a table
"A PR added a NOT NULL column with a default to a 300-million-row table and an index on it in the same migration. On our PostgreSQL version the column addition was fine, but creating the index without `CONCURRENTLY` would have blocked writes for minutes. I suggested `CREATE INDEX CONCURRENTLY` in a separate migration and a lock timeout. The author added a migration checklist item to the PR template for the team."

#### Variations you might be asked
- "How do you review code in an area you don't know?": focus on what you can assess (tests, error handling, clarity), ask questions, and request a reviewer with domain knowledge for correctness.
- "How do you handle a reviewer who blocks on style preferences?": agree team conventions, automate them, and treat personal preferences as non-blocking.
- "How big should a PR be?": small enough to review thoroughly in 15–30 minutes; split refactors from behaviour changes.

#### Step-by-step framework
1. **Understand context.**
2. **Correctness and edge cases.**
3. **Design fit.**
4. **Security, data, migrations.**
5. **Performance, operability, tests.**
6. **Readability**; give labelled, kind, specific feedback.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Focuses on style and naming | Prioritises correctness, security, data |
| "Looks good to me" without reading | Asks about edge cases and failure modes |
| Harsh or vague comments | Specific, explained, labelled feedback |
| Ignores migrations and ops | Checks locking, compatibility, observability |
| Slow reviews | Fast turnaround, small PRs, automation |

#### Useful phrases
- "Blocking: if this message is redelivered, we'd send the email twice."
- "What happens if this call times out after succeeding?"
- "Nit, not blocking: …"
- "Could we split the refactor from the behaviour change?"

#### Common pitfalls
- **Bikeshedding** on style.
- **Rubber-stamping** large PRs.
- **Ignoring tests' quality.**
- **Long comment wars** instead of a conversation.

#### Follow-ups to expect (with sample answers)
- **"How do you receive critical feedback on your own PRs?"**
  "Assume good intent, ask clarifying questions, change what's right, and explain my reasoning where I disagree; if needed, talk it through."
- **"What's in your review checklist?"**
  "Authz, input validation, transactions, idempotency, migrations, timeouts, N+1/limits, logging/metrics, tests for edge cases."
- **"How do you review AI-generated code?"**
  "The same standards, with extra attention to plausible-looking but wrong logic, invented APIs, missing edge cases and security issues."

#### What senior interviewers look for
- **Risk-focused reviewing.**
- **Constructive communication.**
- **Raising team standards** through process.

#### Practise it
1. Write your personal review checklist for backend PRs.
2. Rewrite three harsh comments into kind, specific, labelled feedback.
3. Review an open-source PR and note one blocking issue and one suggestion.

## Debugging a 500 error in production
- id: be-review-02
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: debugging, production, errors, logs, tracing

### Prompt
Users report intermittent 500 errors on an API endpoint. Walk me through how you'd debug it.

### Answer
#### What the interviewer is really testing
- A **systematic, evidence-based** debugging process.
- Using **logs, traces, metrics and error tracking** effectively.
- **Reproducing** the issue and isolating variables.
- Fixing properly (root cause, tests) and **improving the system** so it's easier next time.

#### Key points
- **Assess impact first**: error rate, users affected, trend; mitigate if severe (rollback, flag off).
- **Scope:** which endpoint, which requests (inputs, users, tenants), instances, regions, time window; correlate with **deploys and changes**.
- **Find the error:** error tracking (Sentry), logs filtered by status/endpoint, **stack traces**, request/trace IDs from user reports.
- **Look for patterns:** specific inputs, data states, dependencies timing out, specific instances, time-based (cron, peaks).
- **Reproduce** locally or in staging with the same input/data; write a failing test.
- **Fix the root cause**, add tests, deploy carefully, verify error rate drops.
- **Follow-up:** better error handling (correct 4xx vs 5xx), logging context, alerts.

#### Model answer
"**1. Assess impact and mitigate if needed.**
- How many errors? Error rate on that endpoint (0.1% or 30%)? Since when? Growing?
- If severe and correlated with a recent deploy, **roll back** first and debug afterwards.

**2. Gather evidence.**
- **Error tracking** (Sentry, Rollbar): grouped exceptions with stack traces, counts, first seen time, affected releases and sample request data.
- **Logs** for the endpoint filtered by 5xx status, including request IDs.
- If a user reported it, get their **request ID or timestamp** to find the exact log lines and **trace**.
- **Traces** for failed requests: which span failed (our code, DB, downstream service)?
- **Metrics**: does the error rate correlate with traffic peaks, a specific instance, a dependency's latency?

**3. Look for the pattern behind 'intermittent'.** Intermittent usually means some condition varies:
- **Specific inputs**: a particular field missing, unusual characters, very large payload, an edge-case date.
- **Specific data states**: a user with no address, a product with null price, a legacy record format.
- **Specific instances**: one pod with bad config, a stale cache, a different version mid-deploy.
- **Dependencies**: timeouts or errors from a downstream service or DB under load (connection pool exhaustion).
- **Concurrency**: race conditions under parallel requests (unique constraint violations, deadlocks).
- **Time**: scheduled jobs, token expiry, daylight-saving changes, month-end.

**4. Form hypotheses and test them.**
- E.g. stack trace shows `NoneType has no attribute 'currency'` in `format_price`. Hypothesis: some products have no price record. Query: `SELECT count(*) FROM products p LEFT JOIN prices pr ... WHERE pr.id IS NULL` → 312 products, all created via a new bulk import. Confirmed.
- Or: errors are `connection pool timeout` during peaks. Hypothesis: a slow query holds connections. Check pool metrics and slow query logs.

**5. Reproduce.**
- Recreate the input/data locally or in staging; write a **failing test** capturing the bug. This proves understanding and prevents regressions.

**6. Fix properly.**
- Fix the root cause (data validation in the import, plus defensive handling in rendering), not just wrap it in try/except.
- Return the **right status**: if it's bad client input, return 400/422 with a clear message, not 500. Unexpected server faults stay 500 but with good logging.
- Clean up bad data if needed (backfill missing prices or mark products unpublished).

**7. Deploy and verify.**
- Ship with the test; watch the error rate drop to baseline; confirm in error tracking that the issue is resolved and doesn't recur.

**8. Improve the system.**
- Add **context to logs** (product ID, tenant, request ID) so future errors are quicker to diagnose.
- **Alerts** on error-rate increases per endpoint.
- Validation at boundaries (imports, APIs) so bad data can't enter.
- A short write-up if impact was notable.

**Example error handler with good context:**
```python
@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    logger.exception(
        "unhandled_error",
        extra={"path": request.url.path, "method": request.method,
               "request_id": request.state.request_id, "tenant": getattr(request.state, "tenant", None)},
    )
    return JSONResponse(status_code=500,
                        content={"error": "internal_error", "request_id": request.state.request_id})
```
Returning the request ID lets support find the exact logs from a customer report."

#### Another worked example: an instance-specific failure
"About 10% of requests to `/api/export` failed with 500s. Grouping logs by pod showed all errors came from 2 of 20 pods. Those pods had been scheduled on nodes with a different, older base image missing a font library used for PDF generation. Cordoning the nodes and fixing the image template resolved it; we added a startup self-check for required libraries."

#### A third worked example: a timezone edge case
"An endpoint returned 500s only between midnight and 1 a.m. UTC on the last day of each month. The stack trace pointed to date calculation for 'billing period end', which built an invalid date (e.g. 31 November) when computing the next month in local time. A unit test with a frozen clock reproduced it; the fix used a proper date library's month arithmetic."

#### Variations you might be asked
- "What if there are no useful logs?": add logging/tracing around the suspected area, deploy, and wait for the next occurrence; use error tracking; reproduce with production-like data.
- "What if you can't reproduce it?": compare failing and successful requests' attributes, add instrumentation, check environment differences, consider concurrency and timing.
- "When is a 500 the right response?": for unexpected server-side failures; client mistakes should get 4xx, dependency outages may warrant 502/503/504.

#### Step-by-step framework
1. **Assess impact; mitigate.**
2. **Gather evidence** (error tracking, logs, traces, metrics).
3. **Find the pattern** behind intermittency.
4. **Hypothesise and test.**
5. **Reproduce with a failing test; fix root cause.**
6. **Verify and improve observability/validation.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Check the logs" | Structured evidence gathering |
| Wraps in try/except | Fixes root cause, correct status codes |
| Can't explain intermittency | Inputs, data, instances, dependencies, timing |
| No reproduction | Failing test before fixing |
| Fix and forget | Better logs, alerts, validation |

#### Useful phrases
- "Intermittent means something varies; I need to find what."
- "First, is it tied to a deploy? If so, roll back."
- "I'd write a failing test before fixing it."
- "Bad input should be a 4xx, not a 500."

#### Common pitfalls
- **Guessing without data.**
- **Swallowing exceptions.**
- **Fixing symptoms only.**
- **Not checking instance-level differences.**

#### Follow-ups to expect (with sample answers)
- **"How do you find all requests affected?"**
  "Query logs or error tracking by error group and time window, then map request IDs to users/tenants for follow-up."
- **"What context should every log line have?"**
  "Timestamp, service, version, request/trace ID, endpoint, tenant/user ID where allowed, and relevant entity IDs."
- **"How do you prevent this class of bug?"**
  "Validation at boundaries, property-based or edge-case tests, and contract tests with data producers."

#### What senior interviewers look for
- **Methodical debugging.**
- **Production tool fluency.**
- **Prevention mindset.**

#### Practise it
1. Write a debugging checklist for production 500s.
2. Take a real stack trace and walk through your investigation out loud.
3. Add request-ID propagation and error handling to a small API.

## Tracking down a flaky test
- id: be-review-03
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: flaky tests, testing, CI, debugging, determinism

### Prompt
A test in your CI pipeline fails about 1 time in 20 with no code changes. How do you find the cause and fix it? What are the common causes of flaky tests?

### Answer
#### What the interviewer is really testing
- Treating flaky tests as **real bugs** (in tests or code), not noise.
- Knowing **common causes**: timing, ordering, shared state, randomness, external dependencies, concurrency.
- A **systematic approach**: reproduce by repetition, isolate, gather evidence.
- **Team process**: quarantine, ownership, tracking flakiness metrics.

#### Key points
- Flaky tests destroy trust: people rerun and ignore failures, letting real bugs through.
- Common causes:
  - **Timing:** `sleep`-based waits, timeouts too tight, async operations not awaited.
  - **Test order dependence / shared state:** global variables, database rows left behind, caches, singletons.
  - **Time and dates:** real clock, time zones, DST, month ends.
  - **Randomness:** random data without fixed seeds; unordered collections (sets, dict order, DB rows without ORDER BY).
  - **Concurrency:** race conditions in code under test (a real bug!).
  - **External dependencies:** network calls, third-party APIs, shared test environments.
  - **Resource limits:** ports, file handles, CI machine load.
- Approach: **reproduce** by running the test many times (in isolation, in suite, in random order, under load), gather logs from failures, form hypotheses.
- Fix properly: wait on conditions, isolate state, inject clocks, fix seeds, mock external services, fix real race conditions.
- Process: **quarantine** with an owner and deadline; track flake rates.

#### Model answer
"**First, take it seriously.** A test that fails 5% of the time might be revealing a genuine race condition in production code. And flaky tests train people to ignore red builds, which is how real failures slip through.

**1. Gather evidence from past failures.**
- CI history: how often, since when (did it start with a specific commit?), on which runners, with which other tests in the same run?
- Failure messages and logs: is it always the same assertion or timeout, or varied?
- Save CI artifacts (logs, screenshots, DB state) on failure if not already.

**2. Reproduce by repetition.**
- Run the test alone many times: `pytest -k test_name --count=200` (pytest-repeat) or a loop.
- If it never fails alone, run it **with the rest of the suite**, then in **random order** (`pytest -p random_order`), which points to **shared state / order dependence**.
- Run under load or with CPU limits (`stress`, parallel workers) to expose **timing** issues.
- Change the clock/time zone (`TZ=Pacific/Auckland`), date (freeze at month end), or random seeds.

**3. Common causes and fixes:**
| Cause | Symptom | Fix |
|---|---|---|
| Sleep-based waiting | Fails on slow CI | Wait for condition with timeout (polling/events) |
| Shared state between tests | Fails depending on order | Isolate: transactions rolled back, unique data, reset singletons |
| Real clock / time zone | Fails at certain times/dates | Inject or freeze time; use UTC |
| Unordered results | Assertion on order fails | `ORDER BY`, sort before comparing, compare sets |
| Randomness | Fails with certain values | Fixed seeds; log the seed; property tests with shrinking |
| External services | Network errors/timeouts | Mocks/fakes, contract tests, local containers |
| Race in production code | Rare wrong results | Fix the code (locks, atomic ops) and keep the test |
| Port/resource conflicts | 'Address in use' | Random free ports, cleanup |

**Example: replacing sleep with a condition wait:**
```python
# Flaky: assumes the worker finishes within 1 second
def test_order_processed():
    submit_order(order_id="o1")
    time.sleep(1)
    assert get_status("o1") == "processed"

# Robust: poll until done or timeout, failing with a clear message
def wait_for(predicate, timeout=10, interval=0.05):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return
        time.sleep(interval)
    raise AssertionError("condition not met within timeout")

def test_order_processed():
    submit_order(order_id="o1")
    wait_for(lambda: get_status("o1") == "processed")
```

**Example: test isolation for the database:**
- Wrap each test in a transaction rolled back afterwards, or truncate tables between tests, or generate unique IDs per test so parallel tests don't collide.

**4. Fix, then prove it.**
- After the fix, run the test hundreds of times in the conditions that previously failed (random order, under load). Zero failures in, say, 500 runs gives reasonable confidence for a 5% flake.

**5. Process.**
- If it can't be fixed immediately, **quarantine** it (skip in the blocking pipeline but run separately) with a ticket, owner and deadline. Don't leave it quarantined forever: that's deleting coverage silently.
- Track **flake rate** per test (many CI systems detect tests that pass on retry).
- Automatic retries in CI can reduce noise, but should report 'passed on retry' so flakes stay visible.
- Code review guidelines: no sleeps, no real clocks, no order assumptions, no external calls in unit tests."

#### Another worked example: a real race condition
"An integration test for creating user accounts failed 1 in 30 runs with a duplicate-key error. Running it 500 times in parallel reproduced it reliably. The cause was a real race in production code: a 'check username available, then insert' pattern. Two concurrent test setup requests hit the same username. The fix was `INSERT ... ON CONFLICT` with a proper 409 response; the 'flaky test' had found a production bug."

#### A third worked example: order dependence
"A test asserting 'no active promotions' passed alone but failed when run after another test that created a promotion and didn't clean up. With random test ordering, the failure became reproducible. We switched to per-test transactions rolled back automatically and added random ordering in CI to surface similar issues."

#### Variations you might be asked
- "Should CI automatically retry failed tests?": as a short-term mitigation with visibility (report retries), not as a permanent fix.
- "How do you prevent flaky end-to-end tests?": keep them few, use stable test data, wait on UI/API conditions, isolate environments, and push most coverage into lower-level tests.
- "What is a hermetic test?": a test that depends only on its own controlled inputs, no network, shared state or real time.

#### Step-by-step framework
1. **Treat as a bug**; gather failure history.
2. **Reproduce** by repetition, ordering and load.
3. **Identify cause category.**
4. **Fix** with conditions, isolation, injected time, seeds, fakes, or code fixes.
5. **Prove** with repeated runs.
6. **Process**: quarantine with owners, track flake rates.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Rerun it" | Treats flakiness as a bug |
| Increases sleep duration | Waits on conditions |
| Can't reproduce | Repetition, random order, load |
| Assumes test is wrong | Considers real race in code |
| Skips forever | Quarantine with owner and deadline |

#### Useful phrases
- "A flaky test is either a bad test or a real bug; both need fixing."
- "If it only fails with the full suite, I suspect shared state."
- "Replace sleeps with waiting for a condition."
- "I'd run it 500 times to prove the fix."

#### Common pitfalls
- **Longer sleeps.**
- **Permanent quarantine.**
- **Ignoring real race conditions.**
- **Tests depending on external services.**

#### Follow-ups to expect (with sample answers)
- **"How do you control time in tests?"**
  "Inject a clock interface or use libraries like freezegun/time-machine (Python), fake timers (Jest), or a Clock abstraction (Java)."
- **"How do you make parallel tests safe with a shared database?"**
  "Separate schemas or databases per worker, transactions per test, or unique data per test."
- **"What metrics show test suite health?"**
  "Flake rate, pass-on-retry counts, suite duration, and time to fix quarantined tests."

#### What senior interviewers look for
- **Engineering rigour** about test reliability.
- **Recognising production bugs** behind flakes.
- **Team practices** that keep CI trustworthy.

#### Practise it
1. Write a deliberately flaky test (sleep-based or order-dependent) and fix it.
2. Run a test suite in random order and fix any failures.
3. Explain the common causes of flaky tests, out loud, in 60 seconds.

## Getting productive in an unfamiliar codebase
- id: be-review-04
- round: CODE_REVIEW_DEBUG
- difficulty: easy
- levels:
- tags: onboarding, codebase navigation, learning, legacy code

### Prompt
You've just joined a team with a large, unfamiliar backend codebase. How do you get productive quickly? Walk me through your first few weeks.

### Answer
#### What the interviewer is really testing
- A **deliberate learning strategy** rather than reading everything or flailing.
- Balancing **learning and delivering** early value.
- Using **people, tools and runtime behaviour** (not just code) to understand systems.
- **Humility and communication**: asking good questions, documenting what you learn.

#### Key points
- Start from **purpose**: what the system does for users and the business; key domain concepts.
- Get the system **running locally** and run the tests; fix onboarding docs as you go.
- Learn the **architecture top-down**: services, data stores, main flows; then follow **one request end to end**.
- Use tools: **code search**, IDE navigation, **debugger**, **tracing**, logs, git history (`git blame`, `git log -p`), database schema.
- Ship a **small change early** (bug fix, test, docs) to learn the workflow: build, review, deploy, monitor.
- **Ask good questions** of the right people; pair with teammates; join on-call shadowing.
- **Write things down**: diagrams, glossaries, onboarding doc improvements.
- Don't rewrite or criticise early; understand **why** things are the way they are (Chesterton's fence).

#### Model answer
"My goal is to become useful quickly without making uninformed changes. I'd structure it roughly like this.

**Week 1: context and setup.**
- **Understand the product and domain:** use the product as a customer would; read product docs; learn the vocabulary (what's an 'order line', a 'fulfilment', a 'tenant'?). I keep a glossary.
- **Meet people:** my manager and tech lead (priorities, expectations for 30/60/90 days), teammates (who knows what), product manager, and neighbouring teams we depend on.
- **Set up the dev environment:** clone, build, run locally, run the tests. Wherever the README is wrong, I fix it in my first PR; that's a useful contribution on day two.
- **Read the high-level architecture:** existing diagrams, design docs, ADRs (architecture decision records). If there aren't any, I'll ask someone to sketch it on a whiteboard for 30 minutes, and I write it up.

**Week 1–2: follow the data and requests.**
- **Trace one important flow end to end** (e.g. 'place an order'): from the API route, through handlers and services, to the database tables and events published, to downstream consumers. I'd use:
  - **Code search and IDE navigation** (go to definition, find usages).
  - **A debugger** with breakpoints while sending a real request locally: seeing actual values beats reading abstractions.
  - **Distributed traces** in staging/production to see which services participate and how long each step takes.
  - **Logs** for real request examples.
- **Study the data model:** the database schema and key tables often explain the domain better than the code. An ER diagram of core tables is worth making.
- **Git history:** `git log` on key files and `git blame` to see why code changed, linked PRs and tickets. Understanding the history prevents re-introducing old bugs.
- **Tests as documentation:** good tests show intended behaviour and edge cases.

**Week 2–3: ship small changes.**
- Pick a **small, real task**: a bug fix, a minor feature, adding a missing test. It teaches the full workflow: branching, code review norms, CI, deployment, feature flags, monitoring.
- Ask for a 'good first issue' list if one exists.
- Pair with teammates on a larger task to absorb conventions and tacit knowledge.

**Week 3–4: operational understanding.**
- **Shadow on-call**: read runbooks, recent incident postmortems, dashboards and alerts. Postmortems are a fast way to learn where the system is fragile.
- Understand deployment and rollback; how to find logs and traces for a request.

**Ongoing habits:**
- **Ask good questions**: after trying for a reasonable time (say 30–60 minutes), with context: 'I'm trying to understand how refunds update inventory. I've traced `RefundService` to the `inventory.adjusted` event, but I can't find the consumer. Where should I look?' Batch non-urgent questions.
- **Write down what I learn**: update onboarding docs, add diagrams, record answers in the team wiki, so the next person benefits.
- **Withhold judgement**: code that looks odd often has reasons (a customer contract, a past incident). I ask 'why is it like this?' before proposing changes. After a month or so, I'll have informed opinions about improvements.

**Using AI tools:** I'd use AI-assisted code search or explanations to summarise unfamiliar modules or find where something is implemented, verifying against the actual code and tests, since explanations can be confidently wrong."

#### Another worked example: a first-week documentation fix
"At my previous job, the local setup guide took me a day and a half because it referenced a deprecated Docker Compose file and missing environment variables. I documented every step and fix, updated the README and added a `make dev` command. The next two new joiners set up in under an hour, and it gave me an early, visible contribution while learning the system."

#### A third worked example: learning through a bug
"In my second week I took a bug where some orders showed the wrong tax. Investigating it took me through the pricing engine, the tax provider integration, the order snapshot logic and two event consumers. I drew a diagram of the pricing flow as I went and shared it in the team channel. The fix was small, but that one bug taught me more than a week of reading, and the diagram became part of our onboarding docs."

#### Variations you might be asked
- "What if there's no documentation and the experts have left?": rely on code, tests, git history, runtime behaviour (traces, logs), and the database; document as you go; add characterisation tests before changing things.
- "How do you decide what to learn first?": prioritise the areas your first tasks touch and the most business-critical flows.
- "How do you avoid asking too many questions?": try first, timebox, batch questions, and write answers down so you never ask the same thing twice.

#### Step-by-step framework
1. **Understand purpose and domain.**
2. **Set up and run** locally; fix docs.
3. **Learn architecture top-down.**
4. **Trace a request end to end** with debugger, traces, logs.
5. **Ship small changes** early.
6. **Learn operations** (on-call, postmortems) and document everything.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Read all the code" | Purpose-driven, top-down then deep dive |
| Waits weeks before contributing | Ships small changes early |
| Only reads code | Uses debugger, traces, logs, git history, schema |
| Asks vague questions or none | Timeboxed, contextual questions |
| Proposes rewrites in week one | Understands why before changing |

#### Useful phrases
- "I'd trace one critical request end to end before anything else."
- "My first PR is usually fixing the setup docs."
- "Postmortems show me where the system is fragile."
- "I ask why it's built this way before suggesting changes."

#### Common pitfalls
- **Trying to understand everything** before contributing.
- **Suffering in silence** for days.
- **Early criticism** of existing design.
- **Not writing anything down.**

#### Follow-ups to expect (with sample answers)
- **"What would you aim to achieve in 30/60/90 days?"**
  "30: set up, shipped small changes, understand main flows. 60: own medium features, join on-call. 90: lead a project area and suggest improvements based on what I've learned."
- **"How do you understand a legacy module with no tests?"**
  "Run it with real inputs, add characterisation tests capturing current behaviour, then refactor carefully."
- **"How do you build relationships with the team?"**
  "Pair programming, asking for their context, offering help on reviews, and being reliable with small commitments."

#### What senior interviewers look for
- **Structured self-direction.**
- **Early impact** while learning.
- **Leaving things better** for the next person.

#### Practise it
1. Pick an open-source backend project and trace one request end to end, writing a one-page summary.
2. Write your own 30/60/90-day plan for a new role.
3. Practise phrasing three good questions with context.

## Refactoring legacy code safely
- id: be-review-05
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: refactoring, legacy code, characterisation tests, strangler fig

### Prompt
You need to change a critical, poorly tested legacy module (e.g. a 3,000-line pricing class). How do you refactor it safely without breaking production?

### Answer
#### What the interviewer is really testing
- Knowing that refactoring requires **a safety net** first (tests, observability).
- Techniques: **characterisation tests, seams, small steps, strangler fig, parallel run, feature flags**.
- **Incremental delivery** instead of big-bang rewrites.
- **Business judgement**: refactoring tied to value, with risk managed.

#### Key points
- Refactoring = changing structure **without changing behaviour**; mixing it with behaviour changes makes problems hard to detect.
- **Characterisation tests** capture current behaviour (including odd behaviour) before changes; golden master/snapshot tests with real inputs.
- Find **seams** (Michael Feathers): places to insert tests or alternative implementations (dependency injection, extracting interfaces).
- Work in **small, reversible steps**: extract method, rename, move, introduce interface; commit and deploy frequently.
- For bigger changes: **strangler fig** (new implementation alongside old, routing gradually), **parallel run / shadow mode** comparing outputs, **feature flags** for switching back.
- Use **observability**: metrics on the old and new paths, diff logs.
- Avoid **big-bang rewrites**; refactor in service of upcoming features (the "make the change easy, then make the easy change" approach).

#### Model answer
"With a critical and poorly tested module, the main risk is changing behaviour unintentionally. So I'd build a safety net first, then change it in small, verifiable steps.

**0. Clarify why.** What change do we need to make, and why is the current code blocking it? Refactoring should serve a goal (adding a new pricing rule safely, fixing recurring bugs, performance). This keeps scope bounded and justifies the time.

**1. Understand current behaviour.**
- Read the code paths relevant to the change; check git history and past incidents for known quirks.
- Talk to people who know the domain: some 'weird' behaviour is intentional (a contract with a big customer).

**2. Build a safety net: characterisation tests.**
- Tests that capture **what the code currently does**, not what it should do. If it rounds prices oddly, the test asserts the odd rounding; changing that is a separate, deliberate decision.
- **Golden master approach**: run the module with a large set of realistic inputs (e.g. 10,000 anonymised production carts) and record outputs; after each refactoring step, re-run and compare.
```python
import json, pytest
CASES = json.load(open("tests/golden/pricing_cases.json"))   # recorded inputs + outputs

@pytest.mark.parametrize("case", CASES, ids=lambda c: c["id"])
def test_pricing_matches_golden(case):
    result = PriceCalculator().calculate(case["cart"], case["customer"], case["date"])
    assert result == case["expected"]
```
- To make the code testable, find or create **seams**: e.g. the class calls `datetime.now()` and a database directly, so I'd introduce parameters or small interfaces (clock, price repository) with minimal, mechanical changes, so tests can control them.

**3. Refactor in small, safe steps.**
- Use automated IDE refactorings where possible (extract method, rename, move) since they're behaviour-preserving.
- Typical sequence for a huge class: extract pure functions for calculations; group related logic into smaller classes (discounts, taxes, shipping); replace conditionals with clear strategies where it helps; remove dead code (confirmed by metrics/logs that it's never hit).
- **Commit and deploy frequently**, each step small enough to review and roll back. Never mix refactoring and behaviour changes in one PR.

**4. For larger replacements: strangler fig and parallel runs.**
- If the module needs to be fundamentally redesigned, build the new implementation alongside the old behind an interface.
- **Shadow mode / parallel run**: production calls both; the old result is returned to users; differences are logged and investigated.
```python
def calculate_price(cart, customer):
    old = legacy_pricing.calculate(cart, customer)
    if flags.enabled("pricing_v2_shadow"):
        try:
            new = pricing_v2.calculate(cart, customer)
            if new != old:
                log.warning("pricing_mismatch", extra={"cart_id": cart.id, "old": old, "new": new})
        except Exception:
            log.exception("pricing_v2_error")
    return old
```
- When mismatches are explained and resolved, switch traffic gradually with a **feature flag** (1% → 10% → 100%), keeping the old path available for instant rollback; delete the old code once confident.

**5. Observability throughout.** Metrics on error rates, latency and mismatches for both paths; alerts during the rollout.

**6. Communicate.** Share the plan with the team and stakeholders (especially for business-critical logic like pricing); make progress visible; document new structure.

**Why not a big-bang rewrite?** Rewrites take longer than expected, must re-discover every edge case the old code handled, freeze feature work, and switch everything at once with high risk. Incremental refactoring delivers value continuously and can stop at any point."

#### Another worked example: a pricing engine refactor
"A 3,500-line pricing class caused frequent bugs whenever promotions changed. We recorded 50,000 anonymised real price calculations as golden tests, introduced a clock and repository seam, and extracted discounts, taxes and shipping into separate components over eight PRs deployed independently. Then we built a new promotions engine running in shadow mode for two weeks, investigating 14 mismatch types (3 were existing bugs, fixed deliberately with product sign-off). After switching via flag, promotion-related incidents dropped from about two per month to zero over the next quarter."

#### A third worked example: a refactor that went wrong
"A colleague refactored a billing module and changed rounding from 'round half up' to Python's default 'round half to even' while 'cleaning up'. Unit tests used round numbers, so they passed; invoices were off by a cent for thousands of customers. Lessons applied afterwards: golden tests with real data, never mixing behaviour changes into refactors, and explicit tests for rounding."

#### Variations you might be asked
- "How do you refactor code with no tests and no time?": add the smallest characterisation tests for the area you touch, make the minimal change, and leave the code slightly better (the boy scout rule).
- "How do you convince your manager to allocate time for refactoring?": tie it to business outcomes (faster feature delivery, fewer incidents), quantify costs of the status quo, and propose incremental steps alongside feature work.
- "What's a seam?": a place where you can change behaviour without editing code in that place, such as injecting a dependency, enabling tests or alternative implementations.

#### Step-by-step framework
1. **Clarify the goal** of refactoring.
2. **Understand current behaviour** and history.
3. **Characterisation/golden tests**, with seams for testability.
4. **Small, behaviour-preserving steps**, deployed often.
5. **Strangler fig + shadow mode + flags** for big changes.
6. **Observe, communicate, and delete old code.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Rewrite it cleanly" | Incremental refactoring with safety net |
| Changes behaviour while refactoring | Separates refactoring and behaviour changes |
| No tests before changing | Characterisation/golden tests |
| Big-bang switch | Shadow mode, gradual rollout, rollback |
| Refactors for its own sake | Tied to business goal |

#### Useful phrases
- "First I'd capture what the code does today, even the weird parts."
- "Make the change easy, then make the easy change."
- "Never mix refactoring and behaviour changes in one PR."
- "Run the new path in shadow mode and investigate every mismatch."

#### Common pitfalls
- **Big-bang rewrites.**
- **Tests that assert ideal behaviour** instead of current behaviour.
- **Huge PRs** that can't be reviewed.
- **Never deleting the old path.**

#### Follow-ups to expect (with sample answers)
- **"What if characterisation tests reveal bugs?"**
  "Record them, keep current behaviour during the refactor, then fix them deliberately as separate changes with stakeholder agreement."
- **"How do you handle side effects in shadow mode?"**
  "Only shadow pure computations or read paths; for writes, use separate sinks or compare intended operations without executing them."
- **"How do you know when to stop refactoring?"**
  "When the goal is achieved (the feature is easy to add, bugs reduced); further polishing needs its own justification."

#### What senior interviewers look for
- **Risk management** with critical code.
- **Pragmatic, incremental delivery.**
- **Clear communication** with stakeholders.

#### Practise it
1. Write golden master tests for a small legacy function with messy behaviour.
2. Describe a strangler-fig plan for replacing a legacy module you know.
3. Explain why rewrites fail, out loud, with an example.

## Testing strategy: unit, integration, contract, end-to-end
- id: be-review-06
- round: CODE_REVIEW_DEBUG
- difficulty: medium
- levels:
- tags: testing, test pyramid, integration tests, contract tests, TDD

### Prompt
What testing strategy would you use for a backend service that has a database, a message queue and calls to two other services? What goes in unit, integration, contract and end-to-end tests?

### Answer
#### What the interviewer is really testing
- Understanding the **test pyramid** (or trophy) and the trade-offs of each level.
- Testing against **real dependencies** where it matters (databases) vs mocks.
- **Contract testing** between services.
- Making tests **fast, deterministic and valuable**, and thinking about production verification.

#### Key points
- **Unit tests:** pure business logic in isolation; fast (milliseconds), many; mock only at boundaries.
- **Integration tests:** your code with **real infrastructure** (database, queue, cache) via containers (Testcontainers); catch SQL, mapping, transaction and serialisation bugs.
- **Contract tests:** verify that consumer expectations and provider APIs agree (Pact, schema checks for OpenAPI/protobuf/event schemas); replace many slow cross-service E2E tests.
- **End-to-end tests:** a few critical user journeys through the deployed system; slow and brittle, so keep minimal.
- Plus: **component tests** (service in isolation with fakes for other services), **property-based tests**, **performance/load tests**, **migration tests**.
- In production: **synthetic monitoring**, canary analysis, feature flags.
- Principles: test **behaviour not implementation**, deterministic tests (control time/randomness), fast feedback in CI.

#### Model answer
"I'd aim for confidence at the lowest cost: lots of fast tests for logic, real-dependency tests for integration points, contracts between services, and very few end-to-end tests.

**Example service:** an orders service with PostgreSQL, publishing `order.created` to Kafka, calling the pricing and inventory services.

**1. Unit tests (many, fast).**
- Business rules: order validation, total calculations, state transitions (e.g. an order can't be shipped before payment), discount logic.
- Keep domain logic in pure functions/classes free of I/O, so it's easy to test.
```python
def test_cannot_ship_unpaid_order():
    order = Order(status="created")
    with pytest.raises(InvalidTransition):
        order.ship()

@pytest.mark.parametrize("qty,unit,expected", [(1, 1000, 1000), (3, 999, 2997), (0, 500, 0)])
def test_line_total(qty, unit, expected):
    assert line_total(qty, unit) == expected
```
- Mocks only for true boundaries; overly mocked tests just verify implementation details and break on refactors.
- Property-based tests (Hypothesis) for logic with many input combinations (e.g. totals never negative, rounding invariants).

**2. Integration tests (real infrastructure).**
- Run against **real PostgreSQL and Kafka in containers** (Testcontainers or docker-compose in CI). In-memory substitutes (SQLite for PostgreSQL) hide real differences: SQL dialects, constraints, locking, JSON operators.
- What they catch: repository queries, migrations, transactions and rollback, unique constraints, the **outbox** writing events atomically with orders, message serialisation, idempotent consumer behaviour with duplicate messages.
```python
def test_create_order_writes_outbox_atomically(db):          # db: real Postgres fixture
    repo = OrderRepository(db)
    order_id = repo.create(customer_id="c1", lines=[("sku1", 2)])
    assert db.scalar("SELECT count(*) FROM outbox WHERE aggregate_id = %s", order_id) == 1
```
- Also: **migration tests** (apply migrations from scratch and from the previous version).

**3. Component tests (service in isolation).**
- Start the whole service with real DB/queue but **fake the other services** (WireMock or simple stub servers), and test through the HTTP API: create order → verify response, database state and published event.
- Include failure scenarios: pricing service timeout → order rejected with 503 and no partial writes; inventory returns 409 → order fails gracefully.

**4. Contract tests (between services).**
- Problem: our stubs of the pricing service might not match the real pricing API; E2E tests catch this but are slow and flaky.
- **Consumer-driven contracts (Pact):** our tests record the requests we make and responses we expect; the pricing team's CI verifies their service satisfies the contract. Breaking changes are caught before deployment.
- For events: **schema registry** compatibility checks (Avro/protobuf/JSON Schema), so producers can't publish breaking event changes.
- For OpenAPI: generate clients/servers from specs and run compatibility checks in CI.

**5. End-to-end tests (few).**
- A handful of critical journeys (browse → add to cart → checkout → order confirmed) in a staging environment.
- Slow, brittle, hard to debug; so keep them minimal and focused on 'is the system wired together correctly'.

**6. Beyond pre-production.**
- **Load tests** for performance-sensitive changes.
- **Synthetic monitoring** in production (a test order every few minutes with a test account).
- **Canary analysis** and feature flags as safety nets.
- Observability to detect what tests missed.

**Shape and speed:**
| Level | Count | Speed | Catches |
|---|---|---|---|
| Unit | Hundreds–thousands | ms | Logic bugs |
| Integration | Dozens–hundreds | seconds | SQL, transactions, serialisation |
| Component | Dozens | seconds | Service behaviour, failure handling |
| Contract | Per interaction | seconds | Cross-service incompatibility |
| E2E | Handful | minutes | Wiring, critical journeys |

**Principles:**
- Test **behaviour, not implementation**: assert outcomes (responses, DB state, events), not which private methods were called.
- **Deterministic**: inject clocks, fix random seeds, isolate data per test, no sleeps.
- **Fast CI**: parallelise, run unit tests first, keep the PR pipeline under ~10 minutes.
- **Every bug fix gets a test** reproducing it.
- Coverage is a hint, not a goal: 100% coverage with weak assertions proves little."

#### Another worked example: a bug only integration tests caught
"A team used SQLite in tests for a PostgreSQL service. A query using `ILIKE` and a JSONB operator passed tests but failed in production; another time, a missing unique constraint only existed in the PostgreSQL migration. Switching to Testcontainers with real PostgreSQL added 40 seconds to CI but caught three bugs in the first month that would have reached production."

#### A third worked example: replacing flaky E2E tests with contracts
"A platform had 400 end-to-end tests across 12 services, taking 90 minutes and failing randomly 20% of the time. Teams introduced Pact contracts for service interactions and component tests per service, then reduced E2E tests to 25 critical journeys. CI time fell to 15 minutes, flakiness to under 2%, and cross-service breaking changes were caught earlier by contract verification."

#### Variations you might be asked
- "What's the testing trophy?": an alternative shape (popularised for frontend) emphasising integration tests as the best value, with static analysis at the base.
- "How do you test message consumers?": unit-test handlers, integration-test with a real broker (including redelivery and duplicates), and validate event schemas.
- "Do you practise TDD?": I use it where it helps (complex logic, bug fixes), writing a failing test first; for exploratory work I add tests once the design settles.

#### Step-by-step framework
1. **Unit-test domain logic** extensively.
2. **Integration-test** with real infrastructure.
3. **Component-test** the service with fakes for neighbours, including failures.
4. **Contract-test** cross-service APIs and events.
5. **Few E2E tests** for critical journeys.
6. **Production verification** and deterministic, fast CI.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Unit test everything with mocks" | Layered strategy with real dependencies |
| SQLite instead of Postgres | Testcontainers with real DB/queue |
| Many slow E2E tests | Contracts + few E2E journeys |
| Coverage percentage as goal | Behaviour-focused, meaningful assertions |
| No failure-path tests | Timeouts, retries, duplicates tested |

#### Useful phrases
- "Business logic gets fast unit tests; anything touching SQL gets real-database tests."
- "Contract tests catch breaking API changes without a full environment."
- "We keep end-to-end tests to the journeys that make money."
- "Every bug fix comes with a test that reproduces it."

#### Common pitfalls
- **Over-mocking.**
- **Fake infrastructure** that behaves differently from production.
- **Testing only happy paths.**
- **Slow, flaky test suites** that people ignore.

#### Follow-ups to expect (with sample answers)
- **"How do you test database migrations?"**
  "Apply them in CI against a real database (fresh and from the previous version), check for locking operations, and test the app version before and after."
- **"How do you handle test data?"**
  "Builders/factories creating minimal valid data per test, unique IDs to avoid collisions, and no reliance on shared fixtures that tests mutate."
- **"What coverage target do you use?"**
  "I watch coverage of critical modules and changed lines rather than a global number; quality of assertions matters more."

#### What senior interviewers look for
- **Cost/benefit thinking** across test levels.
- **Realistic integration testing.**
- **Cross-team contract practices.**

#### Practise it
1. Design the test plan for a service you know: list five tests per level.
2. Write an integration test using a real PostgreSQL container.
3. Explain consumer-driven contract testing, out loud.
