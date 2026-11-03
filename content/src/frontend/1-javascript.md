# Frontend Engineer — JavaScript Fundamentals

## Implement debounce(fn, delay)
- id: 48bf9fd4-d5bc-41eb-95e4-59e6f850801a
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: polyfill, closure, timing
- companies: Apple, Meta, OpenAI, Stripe

### Prompt
Implement `debounce(fn, delay)`. The returned function should only call `fn` once calls have stopped for `delay` milliseconds. Common follow-ups: support a leading-edge call, a `cancel()` method, a `flush()` method and a maximum wait time.

### Answer
#### What the interviewer is really testing
- **Closures**: keeping a timer and the latest arguments between calls.
- **Timing and the event loop**: how `setTimeout` and `clearTimeout` behave.
- Preserving **`this` and arguments** so the wrapper is a drop-in replacement.
- **Extending a design** cleanly under follow-ups (leading edge, cancel, flush, maxWait) without rewriting.
- Knowing **when to use debounce vs throttle** in real UIs.

#### Key points
- Debounce **groups a burst of calls into one**, fired after the burst ends (trailing edge) or at its start (leading edge).
- Each call **clears the previous timer and starts a new one**; only the last call in a quiet window wins.
- Store the latest `this` and arguments so the eventual call uses **the most recent values**.
- Use a regular `function` for the wrapper (not an arrow function) so callers' `this` is preserved.
- Typical uses: search-as-you-type, auto-saving a form, resize handlers that recompute layout, validating input after typing stops.
- Return value: a debounced function can't synchronously return `fn`'s result; either return `undefined` or return a promise.

#### Model answer
"Debounce delays calling a function until things have been quiet for a set time. If I type 'react' in a search box with a 300 ms debounce, I want one request for 'react', not five requests for 'r', 're', 'rea'…

**Basic trailing-edge version:**
```js
function debounce(fn, delay) {
  let timerId = null;

  return function debounced(...args) {
    const context = this;            // keep the caller's `this`
    clearTimeout(timerId);           // cancel the previous pending call
    timerId = setTimeout(() => {
      timerId = null;
      fn.apply(context, args);       // call with the latest this + args
    }, delay);
  };
}

// usage
const search = debounce((q) => fetchResults(q), 300);
input.addEventListener('input', (e) => search(e.target.value));
```
How it works:
- `timerId` lives in the closure, shared across every call to `debounced`.
- Each call clears the pending timer, so earlier calls never fire.
- When calls stop for `delay` ms, the last scheduled timer runs `fn` with the most recent arguments.

**Adding leading edge, cancel and flush.** The interviewer usually asks for these next, so I'd structure the code so they're easy to add:
```js
function debounce(fn, delay, { leading = false, trailing = true } = {}) {
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;

  function invoke() {
    const args = lastArgs, ctx = lastThis;
    lastArgs = lastThis = null;
    return fn.apply(ctx, args);
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    const isFirstCallOfBurst = timerId === null;

    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      if (trailing && lastArgs) invoke();   // skip if leading already used these args
    }, delay);

    if (leading && isFirstCallOfBurst) invoke();
  }

  debounced.cancel = () => {
    clearTimeout(timerId);
    timerId = lastArgs = lastThis = null;
  };

  debounced.flush = () => {
    if (timerId === null) return;
    clearTimeout(timerId);
    timerId = null;
    if (lastArgs) invoke();
  };

  return debounced;
}
```
Design decisions worth saying out loud:
- **Leading edge** fires immediately on the first call of a burst, then ignores calls until the quiet period ends. With both leading and trailing enabled, a single call shouldn't fire twice: clearing `lastArgs` after the leading call handles that.
- **cancel()** is essential in React: clear pending calls when a component unmounts, or a stale call may update state on an unmounted component or send an outdated request.
- **flush()** is useful for auto-save: when the user clicks 'Save' or closes the page, run the pending call now.

**maxWait.** With pure debounce, a user who types continuously for 20 seconds never triggers a save. `maxWait` guarantees a call at least every N ms during continuous activity. Implementation: record the time of the first call in a burst and, on each call, if `now - burstStart >= maxWait`, invoke immediately and reset. Lodash's debounce with `maxWait` equal to `wait` is effectively throttle, which shows how closely related the two are.

**Debounce vs throttle:**
| | Debounce | Throttle |
|---|---|---|
| Fires | After activity stops | At most once per interval during activity |
| Good for | Search input, auto-save, resize-end | Scroll position, mousemove, analytics pings |
| During continuous activity | Never (without maxWait) | Regularly |

**In React**, I'd create the debounced function once (with `useMemo` or `useRef`) so it isn't recreated every render, which would reset the timer and break debouncing, and cancel it in a cleanup:
```js
function useDebouncedCallback(fn, delay) {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });          // always call the latest fn
  const debounced = useMemo(
    () => debounce((...args) => fnRef.current(...args), delay),
    [delay],
  );
  useEffect(() => () => debounced.cancel(), [debounced]);
  return debounced;
}
```
"

#### Another worked example: search-as-you-type with stale responses
"Debounce reduces requests, but it doesn't guarantee responses arrive in order. If the request for 'rea' is slow and 'react' is fast, the slower response can overwrite the newer results. In a search box I combine debounce with an `AbortController` (cancel the previous request when a new one starts) or a request ID check, so only the latest response updates the UI:
```js
let controller;
const search = debounce(async (q) => {
  controller?.abort();
  controller = new AbortController();
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
    render(await res.json());
  } catch (e) {
    if (e.name !== 'AbortError') showError(e);
  }
}, 300);
```
This is a common follow-up: debounce solves *frequency*, not *ordering*."

#### A third worked example: auto-saving a document
"For an editor that auto-saves, I'd use debounce with a 1–2 second delay plus `maxWait` of 10 seconds, so a user typing continuously still gets periodic saves. On `beforeunload` or route change, I call `flush()` so the latest edits aren't lost, and show a 'Saving…' / 'Saved' indicator driven by the debounced call's promise."

#### Variations you might be asked
- "Make it return a promise of fn's result": keep a pending promise per burst and resolve all callers in that burst with the same result.
- "Implement it without setTimeout": not really possible in the browser; you could use `requestAnimationFrame` loops with timestamps, but setTimeout is the right tool.
- "Debounce with an immediate option, like underscore's `immediate`": the same as leading-edge only.

#### Step-by-step framework
1. **Clarify** trailing vs leading, cancel/flush, return value, `this` handling.
2. **Write the minimal trailing version** with a closure timer.
3. **Preserve `this` and latest args.**
4. **Add options** (leading, cancel, flush, maxWait) without restructuring.
5. **Walk through a timeline** of calls to show it works.
6. **Discuss real usage** (React lifecycle, request ordering).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Arrow wrapper loses `this` | Regular function, `apply` with saved context |
| Uses first call's args | Uses the latest args |
| No cancel | `cancel()` for unmount, `flush()` for save |
| Recreates debounce each render in React | Stable instance with `useMemo`/`useRef` |
| Thinks debounce fixes stale responses | Adds abort or request IDs for ordering |

#### Useful phrases
- "Each call resets the timer, so only the last call in a quiet window fires."
- "I keep the timer in a closure so every call shares it."
- "Debounce controls how often we call; it doesn't control response order."
- "In React I keep one debounced instance and cancel it on unmount."

#### Common pitfalls
- **Losing `this`** by using arrow functions or not using `apply`.
- **Double-firing** with leading and trailing on a single call.
- **Creating a new debounced function on every render.**
- **Forgetting cleanup**, causing calls after unmount.

#### Follow-ups to expect (with sample answers)
- **"What's the difference between debounce and throttle?"**
  "Debounce waits for a pause and fires once; throttle fires at most once per interval during continuous activity."
- **"What delay would you choose for search?"**
  "Usually 200–400 ms: short enough to feel responsive, long enough to skip intermediate keystrokes. I'd tune it with real usage."
- **"How would you test it?"**
  "With fake timers (`vi.useFakeTimers()` / `jest.useFakeTimers()`): call it several times, advance time, and assert fn was called once with the last arguments."

#### What senior interviewers look for
- **Clean, extensible code** that handles follow-ups gracefully.
- **Real-world awareness**: React lifecycles, request races, auto-save.
- **Testing approach** with fake timers.

#### Practise it
1. Write the basic version from memory in under 5 minutes.
2. Add leading, cancel, flush and maxWait, then test with fake timers.
3. Explain debounce vs throttle with a scroll and search example, out loud.

## Implement throttle(fn, limit)
- id: 46d1f675-7f21-4638-bf37-27a5ac1b9fee
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: polyfill, closure, timing
- companies: Apple, Meta

### Prompt
Implement `throttle(fn, limit)` so that `fn` runs at most once every `limit` milliseconds. Follow-ups: what's the difference from debounce, should the last call be guaranteed to run (trailing call), and when would you use `requestAnimationFrame` instead?

### Answer
#### What the interviewer is really testing
- Understanding **rate limiting** in the UI and how it differs from debounce.
- **Closure state**: last run time, pending timer, latest arguments.
- Handling the **trailing call** so the final state isn't lost.
- Choosing **requestAnimationFrame** for visual updates.

#### Key points
- Throttle guarantees **regular execution during continuous activity**, at most once per interval.
- Two approaches: **timestamp-based** (fire if enough time has passed) and **timer-based** (block calls while a timer is pending).
- A good throttle usually fires on the **leading edge** and also schedules a **trailing call** with the latest arguments, so the last event is processed.
- For work that updates visuals on scroll or mousemove, **requestAnimationFrame throttling** aligns updates with the browser's paint cycle.
- Typical uses: scroll position tracking, infinite scroll triggers, mousemove/drag handling, window resize, analytics events, rate-limiting button clicks.

#### Model answer
"Throttle limits how often a function can run. If a scroll event fires 100 times per second and I throttle my handler to 100 ms, it runs about 10 times per second, regularly, while scrolling continues. That's different from debounce, which would wait until scrolling stops.

**Simple timestamp version (leading edge only):**
```js
function throttle(fn, limit) {
  let lastRun = 0;
  return function throttled(...args) {
    const now = Date.now();
    if (now - lastRun >= limit) {
      lastRun = now;
      fn.apply(this, args);
    }
  };
}
```
Problem: calls inside the interval are simply dropped, including the **last** one. If the user scrolls and stops 50 ms after the previous run, the final scroll position is never processed, so a sticky header might stay in the wrong state.

**Leading + trailing version (what I'd actually use):**
```js
function throttle(fn, limit, { leading = true, trailing = true } = {}) {
  let lastRun = 0;
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;

  function invoke(time) {
    lastRun = time;
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  }

  function throttled(...args) {
    const now = Date.now();
    if (!lastRun && !leading) lastRun = now;      // skip the leading call if disabled
    const remaining = limit - (now - lastRun);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      clearTimeout(timerId);
      timerId = null;
      invoke(now);                                 // enough time has passed: run now
    } else if (!timerId && trailing) {
      timerId = setTimeout(() => {                 // schedule the trailing call
        timerId = null;
        if (lastArgs) invoke(leading ? Date.now() : 0);
      }, remaining);
    }
  }

  throttled.cancel = () => {
    clearTimeout(timerId);
    timerId = null;
    lastRun = 0;
    lastArgs = lastThis = null;
  };

  return throttled;
}
```
Walkthrough with `limit = 100`:
| Time (ms) | Call | Result |
|---|---|---|
| 0 | scroll | runs immediately (leading) |
| 30 | scroll | schedules trailing call at 100 |
| 60 | scroll | updates latest args; timer already scheduled |
| 100 | (timer) | runs with args from the 60 ms call |
| 250 | scroll | runs immediately |

**requestAnimationFrame throttling.** For handlers that change what's on screen (moving an element on drag, parallax, updating a progress bar on scroll), running more than once per frame is wasted work. I'd throttle to animation frames:
```js
function rafThrottle(fn) {
  let frame = null;
  let lastArgs;
  return function (...args) {
    lastArgs = args;
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      fn.apply(this, lastArgs);
    });
  };
}
```
This runs at most once per frame (about 60 times per second, or 120 on high-refresh displays), always with the latest event, and pauses automatically in background tabs.

**Choosing:**
- **Debounce**: you only care about the final value (search input, resize-end, auto-save).
- **Throttle**: you need regular updates during activity (infinite scroll checks, analytics, rate-limiting expensive API calls).
- **rAF**: visual updates tied to rendering.
- **Better than any of these**: sometimes the platform has a purpose-built API. For 'is this element visible?' use `IntersectionObserver`; for 'did this element resize?' use `ResizeObserver`. They avoid scroll/resize listeners entirely."

#### Another worked example: infinite scroll
"A feed loaded the next page when the user scrolled near the bottom. The original scroll handler ran on every scroll event and called `getBoundingClientRect()`, causing layout work at 100+ events per second and duplicate page requests. A 200 ms throttle with a trailing call fixed the performance and, combined with an `isLoading` flag, prevented duplicate requests. Later we replaced it with an `IntersectionObserver` on a sentinel element at the bottom of the list, which removed the scroll listener altogether."

#### A third worked example: rate-limiting a costly action
"In a dashboard, users could click 'Refresh' repeatedly, firing expensive report queries. Throttling the click handler to once every 5 seconds (leading edge, no trailing) gave immediate feedback on the first click and ignored rapid repeats. We also disabled the button while a request was in flight, since throttling alone doesn't express 'still loading' to the user."

#### Variations you might be asked
- "Implement throttle using only setTimeout (timer-based)": set a flag when running, clear it after `limit` ms; drop calls while the flag is set (and optionally remember the last args for a trailing call).
- "Make throttle return the last result": store and return the result of the most recent invocation.
- "Why might Date.now() be a problem?": system clock changes; `performance.now()` is monotonic and better for measuring intervals.

#### Step-by-step framework
1. **Clarify** leading/trailing behaviour and cancel.
2. **Write the timestamp version.**
3. **Add the trailing call** with latest args.
4. **Walk through a timeline.**
5. **Compare with debounce and rAF.**
6. **Mention platform alternatives** (IntersectionObserver, ResizeObserver).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Drops the last call | Trailing call with latest args |
| Confuses with debounce | Clear comparison table and use cases |
| Throttles visual updates with setTimeout | Uses requestAnimationFrame |
| Scroll listener for visibility | IntersectionObserver |
| No cleanup | `cancel()` on unmount |

#### Useful phrases
- "Throttle gives regular updates during activity; debounce waits for it to stop."
- "I always keep a trailing call so the final state is processed."
- "For visual updates, I throttle to animation frames."
- "If the question is visibility, IntersectionObserver is better than throttled scroll."

#### Common pitfalls
- **No trailing call**, leaving the UI in a stale state.
- **Using `Date.now()`** without considering clock changes (minor, but good to mention).
- **Throttling with too long an interval**, making the UI feel laggy.
- **Forgetting `this` and arguments.**

#### Follow-ups to expect (with sample answers)
- **"How would you test throttle?"**
  "Fake timers: call it at controlled times, advance the clock, and assert the number and arguments of calls, including the trailing call."
- **"Is a scroll listener expensive by itself?"**
  "The listener is cheap; the work inside (layout reads, state updates) is the problem. Passive listeners (`{ passive: true }`) also stop scroll handlers from blocking scrolling."
- **"How does lodash implement throttle?"**
  "As debounce with `maxWait` equal to the wait time, with leading and trailing options."

#### What senior interviewers look for
- **Precise behaviour** at the edges (first and last call).
- **Performance awareness** (rAF, passive listeners, observers).
- **Clear use-case judgement.**

#### Practise it
1. Write leading+trailing throttle from memory and test it with a timeline.
2. Write `rafThrottle` and use it for a drag handler.
3. Explain debounce vs throttle vs rAF in 60 seconds, out loud.

## Implement Promise.all
- id: 798c061f-2f0d-44ed-ac5f-d53a4b36f524
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, promises, async
- companies: OpenAI, Meta

### Prompt
Implement your own version of `Promise.all(iterable)`. It should resolve with an array of results in input order when all inputs resolve, and reject as soon as any input rejects.

### Answer
#### What the interviewer is really testing
- Deep understanding of **Promise semantics**: resolution, rejection, settling once.
- Preserving **input order** even when results arrive out of order.
- Handling **edge cases**: empty input, non-promise values, thenables, any iterable.
- Knowing the **behaviour of the built-in** (fail-fast, no cancellation) and when to use alternatives.

#### Key points
- Return a **new Promise**; resolve with results in **the same order as the inputs**, not completion order.
- Use **`Promise.resolve(item)`** for each input so plain values and thenables work.
- Track a **count of completed promises**; resolve when it reaches the total.
- **Reject immediately** on the first rejection (fail-fast); later results are ignored because a promise can only settle once.
- **Empty input resolves immediately** with `[]`.
- Accept **any iterable** (arrays, Sets, generators), so convert with `Array.from` or iterate with `for...of`.
- Promise.all **doesn't cancel** the other operations when one fails; they keep running.

#### Model answer
"Promise.all takes many promises and gives back one promise that resolves when all of them have resolved, with their results in input order, or rejects as soon as any of them rejects.

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);       // supports any iterable
    const results = new Array(items.length);
    let completed = 0;

    if (items.length === 0) {
      resolve([]);                            // empty input resolves immediately
      return;
    }

    items.forEach((item, index) => {
      Promise.resolve(item)                   // handles plain values and thenables
        .then((value) => {
          results[index] = value;             // keep input order
          completed += 1;
          if (completed === items.length) resolve(results);
        })
        .catch(reject);                       // first rejection wins; later calls are no-ops
    });
  });
}
```

**Why each detail matters:**
- **`results[index] = value`** rather than `results.push(value)`: promises finish in any order. If the second request finishes first, `push` would put its result in position 0.
- **Counting completions** rather than checking `results.length`: assigning `results[2]` on an empty array makes `length` 3 even if indexes 0 and 1 aren't filled yet.
- **`Promise.resolve(item)`**: inputs might be plain values (`promiseAll([1, fetchUser()])`) or thenables from other libraries; `Promise.resolve` normalises them.
- **`reject` can be called many times safely**: once a promise settles, further `resolve`/`reject` calls are ignored. That's what makes fail-fast simple.
- **Empty input**: without the special case, the promise would never settle, because no `then` callback ever runs.

**Testing it:**
```js
const delay = (ms, v, fail) =>
  new Promise((res, rej) => setTimeout(() => (fail ? rej(new Error(v)) : res(v)), ms));

promiseAll([delay(300, 'a'), delay(100, 'b'), 42])
  .then(console.log);                 // ['a', 'b', 42] after ~300 ms, in input order

promiseAll([delay(300, 'a'), delay(100, 'boom', true)])
  .catch((e) => console.log(e.message)); // 'boom' after ~100 ms (fail-fast)

promiseAll([]).then(console.log);     // []
```

**Behaviour to mention:**
- The other operations **keep running** after a rejection; Promise.all can't cancel them. To cancel fetches, I'd pass a shared `AbortController` signal and abort in the catch handler.
- If I need all results regardless of failures, I'd use **`Promise.allSettled`**. If I need the first success, **`Promise.any`**. For the first settled, **`Promise.race`**.
- Running many requests at once can overwhelm a server or browser connection limits; for large lists I'd use a **concurrency-limited pool**.

**Using async/await inside?** I could write it with async functions, but the core logic (index-based results, counter, fail-fast) stays the same; the version above makes the settling behaviour explicit, which is what the question is testing."

#### Another worked example: loading a dashboard
"A dashboard needs user, permissions and settings before rendering. `Promise.all([getUser(), getPermissions(), getSettings()])` runs the requests in parallel, so total time is the slowest request (~300 ms) instead of the sum (~800 ms if awaited one by one). But if the settings call fails, the whole dashboard errors. Since settings are optional, I'd use `allSettled` and fall back to defaults for settings, while keeping user and permissions mandatory."

#### A third worked example: cancelling siblings on failure
```js
async function loadAll(urls) {
  const controller = new AbortController();
  try {
    return await Promise.all(
      urls.map((u) => fetch(u, { signal: controller.signal }).then((r) => {
        if (!r.ok) throw new Error(`${u}: ${r.status}`);
        return r.json();
      })),
    );
  } catch (e) {
    controller.abort();          // stop the remaining requests
    throw e;
  }
}
```
"This shows I know Promise.all is fail-fast but not cancelling, and that `fetch` doesn't reject on HTTP errors, so I check `r.ok`."

#### Variations you might be asked
- "Implement it with async/await": iterate, start all promises first (don't await in a loop, which serialises them), then handle completions.
- "What's the difference between awaiting in a loop and Promise.all?": a loop with `await` runs sequentially; Promise.all runs concurrently.
- "Make it work with object input (`{ user: p1, posts: p2 }`)": map entries, run Promise.all on values, rebuild the object with the same keys.

#### Step-by-step framework
1. **State the contract**: order, fail-fast, empty input, non-promises.
2. **Return a new Promise.**
3. **Normalise inputs** with `Promise.resolve`.
4. **Store by index and count completions.**
5. **Reject on first error.**
6. **Test** with out-of-order, failure and empty cases; discuss cancellation and alternatives.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `results.push()` | Index-based results preserve order |
| Checks `results.length` | Counts completions |
| Hangs on empty input | Resolves `[]` immediately |
| Breaks with plain values | `Promise.resolve` normalisation |
| Thinks it cancels other work | Knows it doesn't; uses AbortController |

#### Useful phrases
- "I store results by index because promises finish in any order."
- "A promise can only settle once, so the first rejection wins automatically."
- "Promise.all is fail-fast, but it doesn't cancel the other operations."
- "If I need every outcome, I'd use allSettled instead."

#### Common pitfalls
- **Order bugs** from `push`.
- **Never resolving** for empty input.
- **Awaiting inside a loop**, which runs requests sequentially.
- **Assuming fetch rejects on 404/500.**

#### Follow-ups to expect (with sample answers)
- **"What happens if one promise never settles?"**
  "Promise.all never settles either. I'd add a timeout with `Promise.race` against a timer, or `AbortSignal.timeout()` for fetches."
- **"Is Promise.all parallel?"**
  "It's concurrent: all operations are started before Promise.all is even called. JavaScript is single-threaded, but the I/O happens concurrently."
- **"What's the error if multiple reject?"**
  "Only the first rejection is reported; the others are ignored (though you may see unhandled rejection warnings if they aren't caught elsewhere)."

#### What senior interviewers look for
- **Precise semantics** and edge cases.
- **Practical awareness**: cancellation, timeouts, HTTP errors.
- **Choosing the right combinator.**

#### Practise it
1. Implement `promiseAll` from memory and test the three cases above.
2. Write a version that accepts an object of promises.
3. Explain all, allSettled, any and race in 60 seconds, out loud.

## Implement Promise.allSettled
- id: 66cb216d-e141-48f6-b558-64829313c696
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, promises

### Prompt
Implement `Promise.allSettled(iterable)`. Unlike `Promise.all`, it never rejects: it waits for every input to settle and resolves with an array of `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }` objects in input order.

### Answer
#### What the interviewer is really testing
- Understanding the **difference between all and allSettled**, and when each is appropriate.
- Correct **result shape** and **ordering**.
- Converting rejections into values (**error as data**).
- Applying it to **partial-failure UIs**.

#### Key points
- allSettled **always resolves** (unless the iterable itself throws), never rejects.
- Each result is `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`, matching the spec exactly.
- Results must be in **input order**; count settlements and resolve when all have settled.
- **Empty input** resolves to `[]`.
- Can be built on top of `Promise.all` by mapping each promise to a promise that never rejects.
- Use it when **partial success is acceptable**: dashboards with independent widgets, bulk operations where you report per-item results.

#### Model answer
"allSettled waits for everything to finish, successes and failures alike, and tells me what happened to each one. It's the right tool when one failure shouldn't throw away the other results.

**Implementation from scratch:**
```js
function promiseAllSettled(iterable) {
  return new Promise((resolve) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let settled = 0;

    if (items.length === 0) return resolve([]);

    items.forEach((item, i) => {
      Promise.resolve(item)
        .then(
          (value) => { results[i] = { status: 'fulfilled', value }; },
          (reason) => { results[i] = { status: 'rejected', reason }; },
        )
        .finally(() => {
          settled += 1;
          if (settled === items.length) resolve(results);
        });
    });
  });
}
```
Note: I use the two-argument form of `then(onFulfilled, onRejected)` so a rejection is turned into a value right there. The `finally` runs once per item after it has been recorded.

**Elegant version on top of Promise.all:**
```js
const promiseAllSettled2 = (iterable) =>
  Promise.all(
    Array.from(iterable, (item) =>
      Promise.resolve(item).then(
        (value) => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected', reason }),
      ),
    ),
  );
```
Each input becomes a promise that **never rejects**, so Promise.all can never fail fast, and ordering comes for free. This version is a nice way to show I understand how the combinators relate.

**Using the results:**
```js
const results = await Promise.allSettled([getProfile(), getOrders(), getRecommendations()]);

const [profile, orders, recs] = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
const failures = results.filter((r) => r.status === 'rejected');
failures.forEach((f) => reportError(f.reason));
```

**When to use which:**
| Combinator | Resolves when | Rejects when | Use for |
|---|---|---|---|
| `all` | all fulfil | any rejects (fail-fast) | Everything is required |
| `allSettled` | all settle | never | Independent tasks, partial results OK |
| `any` | first fulfils | all reject (AggregateError) | Redundant sources, take the first success |
| `race` | first settles | first settles with rejection | Timeouts, first response wins |

**TypeScript bonus:** the result type is `PromiseSettledResult<T>[]`, a discriminated union, so after checking `r.status === 'fulfilled'`, TypeScript knows `r.value` exists."

#### Another worked example: a dashboard with independent widgets
"A homepage shows profile, orders and recommendations. With Promise.all, a recommendations outage would blank the whole page. With allSettled, each widget renders its own data or its own error state ('Recommendations are unavailable right now'), and we report the failure to monitoring. In React I'd go further and let each widget fetch independently with its own loading and error boundary, but allSettled is the right tool when the data must be loaded together, such as on the server."

#### A third worked example: bulk operations
"A user selects 50 files to delete. Calling the API for each and using allSettled lets me show 'Deleted 47 files; 3 failed' with a retry button for the failures, instead of failing everything or stopping at the first error. For large batches I'd limit concurrency with a pool so we don't send 50 requests at once."

#### Typing the results in TypeScript
```ts
function isFulfilled<T>(r: PromiseSettledResult<T>): r is PromiseFulfilledResult<T> {
  return r.status === 'fulfilled';
}
const settled = await Promise.allSettled(ids.map(fetchUser));
const users = settled.filter(isFulfilled).map((r) => r.value);   // typed as User[]
const errors = settled.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
```
"A small type guard keeps the success and failure paths fully typed, which avoids `any` creeping in when processing bulk results."

#### Variations you might be asked
- "Implement Promise.any": resolve on first fulfilment; reject with an `AggregateError` of all reasons if every input rejects; empty input rejects immediately.
- "How would you add a timeout per item?": race each promise against a timer that rejects, then allSettled the raced promises.
- "Does allSettled run things in parallel?": yes, the operations are already running; allSettled just waits for them.

#### Step-by-step framework
1. **State the contract** (never rejects, result shape, order).
2. **Implement with a counter** and index-based results.
3. **Show the Promise.all-based version.**
4. **Demonstrate processing results.**
5. **Compare combinators.**
6. **Apply to a partial-failure UI.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Rejects on failure | Never rejects |
| Wrong result shape | Exact `{status, value/reason}` shape |
| Order by completion | Input order |
| Only one implementation | Scratch version and composition with Promise.all |
| No use case | Partial-failure UI and bulk operations |

#### Useful phrases
- "allSettled turns failures into data, so nothing gets thrown away."
- "Each item becomes a promise that never rejects, so Promise.all can't fail fast."
- "I'd use it when partial results are better than none."
- "The settled result is a discriminated union in TypeScript."

#### Common pitfalls
- **Forgetting empty input.**
- **Using allSettled when everything is required** (hiding failures).
- **Not reporting rejected items** to monitoring.
- **Unbounded concurrency** for large lists.

#### Follow-ups to expect (with sample answers)
- **"Why not just catch errors in Promise.all?"**
  "That's essentially what the composed version does; allSettled standardises the result shape."
- **"How do you show partial failure to users?"**
  "Render successful parts normally, show inline error states with retry for failed parts, and summarise bulk results."
- **"When was allSettled added?"**
  "ES2020; older environments needed a polyfill like this one."

#### What senior interviewers look for
- **Clear understanding of combinator semantics.**
- **Product thinking** about partial failures.
- **Clean, composable code.**

#### Practise it
1. Implement allSettled both ways from memory.
2. Implement Promise.any with AggregateError.
3. Design the UI for a bulk action where some items fail, out loud.

## Implement a Promise pool with concurrency n
- id: 66c04f90-8536-4067-a4f6-c9a8fea4cdc8
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: hard
- levels:
- tags: polyfill, concurrency, AI-relevant
- companies: Anthropic, OpenAI

### Prompt
Write `promisePool(tasks, concurrency)` where `tasks` is an array of functions that each return a promise. Run at most `concurrency` tasks at a time and resolve with all results in input order. This comes up often in AI and streaming work, for example limiting concurrent calls to a model API.

### Answer
#### What the interviewer is really testing
- **Concurrency control** in a single-threaded, async environment.
- Understanding why tasks must be **functions** (lazy) rather than promises (already running).
- **Ordering, error handling and completion** logic.
- Practical concerns: **rate limits, retries, cancellation, progress**.

#### Key points
- Tasks are **functions returning promises** so the pool controls *when* each starts; a promise is already running when created.
- Start `min(concurrency, tasks.length)` workers; each worker **takes the next task when it finishes one**.
- Store results **by index** to preserve input order.
- Decide error behaviour: **fail-fast** (like Promise.all) or **collect all results** (like allSettled).
- Use cases: calling LLM APIs within rate limits, uploading files, crawling, bulk API operations, image processing.
- Production extras: retries with backoff, cancellation via AbortSignal, progress reporting, rate limits per time window (not just concurrency).

#### Model answer
"The goal is to run a lot of async work without doing all of it at once. If I have 200 documents to send to a model API that allows 5 concurrent requests, firing 200 requests would trigger rate-limit errors and overload the browser or server. A pool keeps exactly 5 in flight and starts the next one as soon as one finishes.

**Why tasks are functions:** if I passed `[fetch(a), fetch(b), ...]`, all requests would already be running. Passing `[() => fetch(a), () => fetch(b)]` lets the pool decide when to start each.

**Worker-based implementation:**
```js
async function promisePool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;          // claim a task (safe: JS is single-threaded)
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);             // rejects on the first failing task
  return results;
}
```
How it works:
- We start N workers. Each loops: claim the next index, run that task, store the result, repeat.
- `nextIndex++` is safe without locks because JavaScript runs one piece of code at a time; there's no interleaving between reading and incrementing.
- When all tasks are claimed and finished, the workers return and `Promise.all(workers)` resolves.
- If a task throws, its worker's promise rejects and `Promise.all` rejects (fail-fast). Other workers keep running their current tasks, though, and would continue claiming new ones.

**Fail-fast that stops starting new tasks:**
```js
async function promisePool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let nextIndex = 0;
  let failed = false;

  async function worker() {
    while (!failed && nextIndex < tasks.length) {
      const index = nextIndex++;
      try {
        results[index] = await tasks[index]();
      } catch (err) {
        failed = true;                    // stop other workers claiming new tasks
        throw err;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}
```

**Collect-all version (allSettled semantics)**, often better for bulk jobs:
```js
results[index] = await tasks[index]().then(
  (value) => ({ status: 'fulfilled', value }),
  (reason) => ({ status: 'rejected', reason }),
);
```

**Walkthrough** with concurrency 2 and tasks taking 300, 100, 200, 100 ms:
| Time | Running | Event |
|---|---|---|
| 0 | T0, T1 | two workers start |
| 100 | T0, T2 | T1 done; worker 2 takes T2 |
| 300 | T2→done at 300, T3 | T0 and T2 done; T3 starts |
| 400 | — | T3 done; all results in order [T0, T1, T2, T3] |

**Production additions** (worth mentioning for an AI-company interview):
- **Retries with exponential backoff and jitter** for 429/5xx errors, respecting `Retry-After` headers.
- **Cancellation**: pass an `AbortSignal` so the user can stop a long batch; workers check `signal.aborted` before claiming tasks and pass the signal to fetch.
- **Progress**: call `onProgress(completed, total)` after each task to drive a progress bar.
- **Rate limits per time window** (e.g. 60 requests per minute) are different from concurrency; combine the pool with a token bucket.
- **Adaptive concurrency**: reduce concurrency when 429s appear.

Libraries like `p-limit` and `p-map` do this in production; I'd use one rather than hand-rolling unless there's a reason."

#### Another worked example: embedding documents with a rate-limited API
"An app uploaded 1,000 document chunks to an embeddings API limited to 10 concurrent requests and 3,000 requests per minute. We used a pool with concurrency 8 (headroom below the limit), retried 429s with backoff honouring `Retry-After`, recorded per-chunk failures (allSettled semantics) and showed progress. Throughput was stable at about 40 chunks per second with no rate-limit cascades, versus the original `Promise.all` approach that failed with hundreds of 429 errors."

#### A third worked example: a p-limit style API
```js
function createLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const { task, resolve, reject } = queue.shift();
    task().then(resolve, reject).finally(() => { active--; next(); });
  };
  return (task) => new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    next();
  });
}

const limit = createLimiter(3);
const results = await Promise.all(urls.map((u) => limit(() => fetch(u))));
```
"This version lets you wrap tasks one at a time anywhere in your code, which suits apps where work arrives over time rather than as a fixed list."

#### Variations you might be asked
- "Process a stream of tasks arriving over time": the limiter version above.
- "Prioritise some tasks": use a priority queue instead of a FIFO queue.
- "Limit by tokens or bytes instead of count": track a budget and only start tasks whose cost fits.

#### Step-by-step framework
1. **Clarify**: tasks as functions, order, error semantics, cancellation.
2. **Explain why functions, not promises.**
3. **Implement workers** claiming the next index.
4. **Handle errors** (fail-fast vs collect-all).
5. **Walk through a timeline.**
6. **Production concerns**: retries, rate limits, progress, abort.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Takes an array of promises | Takes functions so the pool controls start time |
| Batches of N (waits for whole batch) | Starts next task as soon as any finishes |
| Results in completion order | Results in input order |
| No error policy | Clear fail-fast or collect-all choice |
| Ignores rate limits | Backoff, Retry-After, progress, abort |

#### Useful phrases
- "A promise is already running; a function lets me decide when it starts."
- "Each worker picks up the next task when it's free, so slots never sit idle."
- "Concurrency limits and rate limits per minute are different constraints."
- "For bulk jobs I'd collect all results and report failures per item."

#### Common pitfalls
- **Batching** (`await Promise.all(batch)` in chunks), which leaves slots idle while waiting for the slowest task in each batch.
- **Passing promises** instead of functions.
- **Unbounded retries** amplifying rate-limit problems.
- **No cancellation** for long jobs.

#### Follow-ups to expect (with sample answers)
- **"Why is `nextIndex++` safe without a lock?"**
  "JavaScript runs one task at a time on the event loop, and the read-increment happens synchronously, so no other worker can interleave."
- **"Why not process in batches of N?"**
  "Each batch waits for its slowest task; a pool keeps all N slots busy, finishing sooner."
- **"How would you choose the concurrency?"**
  "From the API's documented limits, browser connection limits (about 6 per host on HTTP/1.1) and measured latency, then tune."

#### What senior interviewers look for
- **Correct concurrency reasoning** in the event loop model.
- **Production-grade thinking** about rate limits and failures.
- **Clean, adaptable code.**

#### Practise it
1. Implement the worker pool from memory and test with the timeline above.
2. Implement the `createLimiter` version and use it with fetch.
3. Add retries with backoff and an AbortSignal, and explain them out loud.

## Implement curry(fn)
- id: 9f8ec47a-1035-48cb-ae3e-e41c6c6686d4
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, closure, functional
- companies: Apple

### Prompt
Implement `curry(fn)` so that a function taking several arguments can be called with them one at a time or in groups: `curry(add)(1)(2)(3)`, `curry(add)(1, 2)(3)` and `curry(add)(1)(2, 3)` should all return the same result. Follow-up: support infinite currying like `sum(1)(2)(3)()`.

### Answer
#### What the interviewer is really testing
- **Closures** that accumulate arguments across calls.
- Using **`fn.length`** (arity) and its limitations.
- **Recursion** and returning functions from functions.
- Knowing **where currying is useful** in real code (partial application, configuration).

#### Key points
- Currying transforms `f(a, b, c)` into a chain of functions that collect arguments until there are **enough to call `f`**.
- Use **`fn.length`** to know how many arguments are needed; it ignores default parameters and rest parameters, so mention that limitation.
- Each call returns either **the result** (enough arguments) or **another function** that remembers the arguments so far.
- Preserve **`this`** if the curried function might be used as a method.
- **Infinite currying** needs a terminator, such as calling with no arguments or using `valueOf`/`toString` coercion.
- Real-world: **partial application** to create specialised functions (`const logError = log('error')`), event handlers with preset arguments, function composition pipelines.

#### Model answer
"Currying lets me supply a function's arguments over several calls. Once enough arguments have been collected, the original function runs.

**Implementation:**
```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);                     // enough args: call fn
    }
    return function (...more) {
      return curried.apply(this, [...args, ...more]);  // collect and try again
    };
  };
}

const add = (a, b, c) => a + b + c;
const cAdd = curry(add);

cAdd(1)(2)(3);    // 6
cAdd(1, 2)(3);    // 6
cAdd(1)(2, 3);    // 6
cAdd(1, 2, 3);    // 6
```
How it works:
- `curried` checks whether it has at least `fn.length` arguments (3 for `add`).
- If not, it returns a new function that, when called, merges the previous arguments with the new ones and calls `curried` again.
- Each intermediate function closes over its own `args` array, so partial applications are independent:
```js
const add1 = cAdd(1);
const add1and2 = add1(2);
add1and2(10);     // 13
add1(5)(5);       // 11  — add1 is reusable, not mutated
```

**Limitations of `fn.length`:**
- Default parameters and anything after them don't count: `function f(a, b = 2, c) {}` has length 1.
- Rest parameters don't count: `function f(...args) {}` has length 0.
- So for those functions I'd accept an explicit arity: `curry(fn, arity = fn.length)`.

**Infinite currying** (`sum(1)(2)(3)()` → 6), a common follow-up:
```js
function sum(a) {
  let total = a;
  function next(b) {
    if (b === undefined) return total;   // empty call ends the chain
    total += b;
    return next;
  }
  return next;
}
sum(1)(2)(3)();   // 6
```
Bug to avoid: this version shares `total` across branches if you reuse an intermediate function. An immutable version creates a new closure each time:
```js
const sum = (a) => (b) => (b === undefined ? a : sum(a + b));
sum(1)(2)(3)();   // 6
const s = sum(1);
s(2)();           // 3
s(5)();           // 6 — no shared state
```
Another variant uses coercion so `+sum(1)(2)(3)` works, by defining `valueOf` on the returned function; I'd mention it but prefer the explicit terminator for clarity.

**Where currying helps in practice:**
- **Partial application** to configure functions once: `const fetchJson = request('GET')({ headers })`.
- **Event handlers** with preset data: `onClick={select(item.id)}` where `select = (id) => (event) => ...`.
- **Composition** with `pipe`/`compose`, where each step takes one argument.
- Libraries like Ramda and lodash/fp curry everything for point-free style. In everyday React code, simple closures (arrow functions) often achieve the same thing more readably, so I use currying where it genuinely simplifies the code."

#### Another worked example: configurable validators
```js
const minLength = curry((min, field, value) =>
  value.length >= min ? null : `${field} must be at least ${min} characters`);

const minLength8 = minLength(8);
const passwordRule = minLength8('Password');
passwordRule('abc');          // 'Password must be at least 8 characters'
passwordRule('correcthorse'); // null
```
"Currying makes it easy to build specific rules from a general one and reuse them in a form library."

#### A third worked example: logging with preset context
```js
const log = curry((level, module, message) =>
  console[level](`[${module}] ${message}`));
const warnPayments = log('warn')('payments');
warnPayments('Retrying charge');   // [payments] Retrying charge
```
"Each module gets a logger with its context baked in, without a class or extra wrapper."

#### Variations you might be asked
- "Implement partial(fn, ...presetArgs)": return a function that calls fn with preset args followed by new ones; the difference from currying is that partial application fixes some arguments once, while currying is one-at-a-time (or groups) until complete.
- "Support placeholders (`cAdd(_, 2)(1)(3)`)": track argument positions and fill placeholders with later arguments; lodash implements this.
- "Curry a method preserving `this`": the `apply(this, ...)` calls above handle it.

#### Step-by-step framework
1. **Clarify** behaviour with grouped arguments and arity.
2. **Implement** the recursive collector with `fn.length`.
3. **Show independence** of partial applications.
4. **Discuss `fn.length` limitations** and explicit arity.
5. **Handle infinite currying** without shared state bugs.
6. **Give practical uses.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Only supports one arg per call | Supports grouped arguments |
| Mutates a shared args array | Each partial application is independent |
| Doesn't know `fn.length` limits | Mentions defaults and rest params; explicit arity |
| Infinite sum with shared state bug | Immutable recursive version |
| Can't say when it's useful | Validators, loggers, composition |

#### Useful phrases
- "Each call either has enough arguments to run or returns a function waiting for more."
- "`fn.length` ignores default and rest parameters, so I'd allow an explicit arity."
- "Partial applications must not share state, so each one closes over its own array."
- "In React code, a simple closure is often clearer than a curried helper."

#### Common pitfalls
- **Shared mutable arguments** between branches.
- **Relying on `fn.length`** for variadic functions.
- **Losing `this`.**
- **Overusing currying**, making code harder to read.

#### Follow-ups to expect (with sample answers)
- **"What's the difference between currying and partial application?"**
  "Currying turns an n-argument function into a chain of calls; partial application fixes some arguments and returns a function for the rest. Curried functions make partial application trivial."
- **"Is currying slow?"**
  "Each step allocates a closure, which is negligible for normal use but avoid it in very hot loops."
- **"How would you type curry in TypeScript?"**
  "With recursive conditional types over the parameter tuple; it's complex, which is one reason libraries provide typed curry helpers."

#### What senior interviewers look for
- **Clean closure reasoning.**
- **Awareness of edge cases** (arity, shared state).
- **Pragmatic judgement** about readability.

#### Practise it
1. Implement `curry` from memory and test grouped calls and reuse.
2. Implement immutable infinite `sum`.
3. Explain currying vs partial application with an example, out loud.

## Implement deep clone (handle Date, Map, Set, RegExp, cycles)
- id: 348d32c2-0bea-4186-8bf5-abd64391413e
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: hard
- levels:
- tags: polyfill, recursion, edge-cases
- companies: Apple, Meta

### Prompt
Write `deepClone(value)` that returns a deep copy of any value, including nested objects and arrays, `Date`, `RegExp`, `Map` and `Set`, and objects with circular references. Most candidates miss cycles. Follow-up: when would you use `structuredClone` instead?

### Answer
#### What the interviewer is really testing
- **Recursive thinking** over arbitrary nested data.
- **Type awareness**: primitives vs objects, and special built-ins that need their own copying logic.
- Handling **circular and shared references** with a `WeakMap`.
- Knowing the **limits of shortcuts** (`JSON.parse(JSON.stringify())`, spread) and the modern built-in `structuredClone`.

#### Key points
- **Primitives** (and `null`) are returned as-is; functions are usually returned by reference (they can't be meaningfully cloned).
- **Arrays and plain objects** are cloned recursively, key by key.
- **Date**: `new Date(value.getTime())`. **RegExp**: `new RegExp(value.source, value.flags)` plus `lastIndex`.
- **Map / Set**: create a new one and clone keys/values recursively.
- **Cycles**: keep a `WeakMap` from original object → clone; if we've seen an object, return its clone. This also preserves **shared references** (two properties pointing to the same object stay pointing to the same clone).
- Decide on **prototypes and property descriptors**: preserve the prototype with `Object.create(Object.getPrototypeOf(obj))`; copying getters/setters and non-enumerable properties is optional depth.
- **`JSON.parse(JSON.stringify(x))`** loses Dates (become strings), `undefined`, functions, Map/Set, `NaN`/`Infinity`, and throws on cycles.
- **`structuredClone`** (built into modern browsers and Node 17+) handles Date, RegExp, Map, Set, typed arrays and cycles, but not functions, DOM nodes or class prototypes.

#### Model answer
"A shallow copy (`{...obj}` or `Object.assign`) only copies the top level; nested objects are still shared, so mutating `copy.address.city` changes the original. A deep clone copies every level.

**Implementation:**
```js
function deepClone(value, seen = new WeakMap()) {
  // 1. primitives, null and functions are returned as-is
  if (value === null || typeof value !== 'object') return value;

  // 2. cycles and shared references
  if (seen.has(value)) return seen.get(value);

  // 3. special built-ins
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) {
    const re = new RegExp(value.source, value.flags);
    re.lastIndex = value.lastIndex;
    return re;
  }
  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);                       // register before recursing
    value.forEach((v, k) => copy.set(deepClone(k, seen), deepClone(v, seen)));
    return copy;
  }
  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    value.forEach((v) => copy.add(deepClone(v, seen)));
    return copy;
  }

  // 4. arrays and objects (preserving the prototype)
  const copy = Array.isArray(value)
    ? []
    : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);                         // register BEFORE recursing into children

  for (const key of Reflect.ownKeys(value)) {    // includes symbol keys
    copy[key] = deepClone(value[key], seen);
  }
  return copy;
}
```

**Why each part matters:**
- **`typeof value !== 'object'`** covers strings, numbers, booleans, `undefined`, symbols, bigints and functions. `typeof null` is `'object'`, which is why `null` is checked first.
- **Registering in `seen` before recursing** is the key to cycles. For `a.self = a`, when we recurse into `a.self` we find `a` already in `seen` and return the clone we're building, instead of recursing forever.
- **`WeakMap`** rather than `Map`: keys are held weakly, so the lookup table doesn't keep objects alive after cloning finishes. It's created once per top-level call.
- **`Reflect.ownKeys`** includes symbol keys and non-enumerable own keys; `Object.keys` would miss symbols. (Copying non-enumerable keys as enumerable is a simplification; full fidelity uses `Object.getOwnPropertyDescriptors`.)
- **Preserving the prototype** means a cloned class instance still has its methods (`clone instanceof User === true`).

**Testing:**
```js
const original = {
  n: 1, s: 'x', d: new Date('2026-01-01'), re: /ab+c/gi,
  map: new Map([['k', { deep: true }]]), set: new Set([1, 2]),
  nested: { arr: [1, { y: 2 }] },
};
original.self = original;                 // cycle
original.shared = original.nested;        // shared reference

const c = deepClone(original);
c.nested.arr[1].y = 99;
console.log(original.nested.arr[1].y);    // 2 — independent
console.log(c.self === c);                // true — cycle preserved in the clone
console.log(c.shared === c.nested);       // true — shared reference preserved
console.log(c.d instanceof Date, c.d !== original.d);   // true true
```

**Shortcuts and when they're fine:**
| Approach | Handles | Fails on |
|---|---|---|
| Spread / `Object.assign` | Top level only | Nested objects (shared) |
| `JSON.parse(JSON.stringify())` | Plain JSON data | Dates, Map/Set, undefined, functions, cycles (throws), NaN |
| `structuredClone()` | Dates, RegExp, Map, Set, typed arrays, cycles | Functions, DOM nodes, class prototypes (become plain objects) |
| Custom `deepClone` | Whatever you implement | Your bugs |

**In real code** I'd use `structuredClone` for most data cloning today. I'd write a custom clone only for specific needs (preserving class instances, skipping certain fields). And often the better answer is to avoid deep cloning entirely: **immutable updates** (copy only the path you change, as React state updates do) are cheaper and preserve reference equality for unchanged parts, which matters for `React.memo` and selectors."

#### Another worked example: an undo stack
"An editor kept undo history by deep cloning the entire document (5 MB of JSON) on every keystroke, using `JSON.parse(JSON.stringify())`. It was slow and broke dates stored in the document. We switched to immutable updates with structural sharing (Immer), so each history entry shared unchanged parts with the previous one. Memory dropped dramatically and dates stayed `Date` objects."

#### A third worked example: the shared reference bug
"A form initialised its state with `{ ...defaultValues }`. Editing a nested `address.city` field mutated `defaultValues.address`, so 'Reset form' no longer reset the address. Deep cloning the defaults with `structuredClone(defaultValues)` (or building initial state from a factory function) fixed it. Interviewers like this example because it shows why shallow copies cause real bugs."

#### Variations you might be asked
- "Clone with property descriptors (getters/setters, non-writable)": use `Object.getOwnPropertyDescriptors` and `Object.defineProperties`, cloning each descriptor's `value`.
- "Implement it iteratively (no recursion)": use an explicit stack of `[source, target]` pairs to avoid stack overflow on very deep structures.
- "Clone typed arrays and ArrayBuffers": `new value.constructor(value)` for typed arrays; `value.slice(0)` for ArrayBuffer.

#### Step-by-step framework
1. **Clarify scope**: which types, functions, prototypes, descriptors.
2. **Handle primitives and null.**
3. **Add the `seen` WeakMap** for cycles and shared references.
4. **Handle special built-ins** (Date, RegExp, Map, Set).
5. **Recurse into arrays/objects**, registering before recursing.
6. **Test** cycles, shared refs, special types; discuss `structuredClone` and immutability.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `JSON.parse(JSON.stringify())` | Knows its failures; custom or `structuredClone` |
| Infinite recursion on cycles | `WeakMap` registered before recursing |
| Dates become plain objects | Special-cases Date, RegExp, Map, Set |
| Misses symbol keys | `Reflect.ownKeys` |
| Always deep clones | Prefers immutable updates where possible |

#### Useful phrases
- "I register the clone before recursing, so a cycle finds the clone in progress."
- "The WeakMap also preserves shared references, not just cycles."
- "JSON round-tripping silently turns Dates into strings."
- "Today I'd use structuredClone unless I need class instances preserved."

#### Common pitfalls
- **Checking `typeof x === 'object'` without handling `null`.**
- **Registering in `seen` after recursion** (cycles still overflow).
- **Ignoring Map/Set keys** that are objects.
- **Deep cloning large state on every update.**

#### Follow-ups to expect (with sample answers)
- **"Why a WeakMap and not a Map?"**
  "A WeakMap doesn't prevent garbage collection of its keys, and we only need lookups by object identity."
- **"What does structuredClone do with a class instance?"**
  "It copies own data properties into a plain object; the prototype (methods) is lost."
- **"Can you clone a function?"**
  "Not meaningfully: closures capture their scope. Returning the same function reference is the usual choice."

#### What senior interviewers look for
- **Edge-case completeness** (cycles, shared refs, built-ins).
- **Knowledge of platform APIs** and their limits.
- **Judgement** about immutability over cloning.

#### Practise it
1. Implement `deepClone` from memory and run the test object above.
2. Write the iterative version with an explicit stack.
3. Explain JSON cloning vs structuredClone vs custom, out loud.

## Implement EventEmitter (on, off, emit, once)
- id: 8ec624b4-a99f-4f08-8077-acd3a5f448e5
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, pubsub, system-building

### Prompt
Implement an `EventEmitter` class with `on(event, listener)`, `off(event, listener)`, `emit(event, ...args)` and `once(event, listener)`. Discuss edge cases such as removing listeners during emit, and memory leaks.

### Answer
#### What the interviewer is really testing
- Clean **class/API design** and choice of data structures.
- **Edge cases**: listeners removed or added during `emit`, `once` removal, duplicate listeners, errors in listeners.
- **Memory management**: unsubscribe patterns and leaks.
- Relating it to **real systems**: Node's EventEmitter, DOM events, state stores, WebSocket message routing.

#### Key points
- Store listeners in a **`Map<eventName, Set<listener>>`** or `Map<eventName, Array<listener>>`. A Set gives O(1) removal and ignores duplicates; an array preserves duplicate registrations and order.
- **`on` returns an unsubscribe function**: a convenient, leak-resistant API (used by many libraries).
- **`emit` iterates over a copy** of the listeners so adding/removing listeners during emit doesn't break iteration.
- **`once`** wraps the listener in a function that removes itself before calling; `off(event, original)` should also remove a pending `once` wrapper.
- Decide **error behaviour**: one throwing listener shouldn't stop the others (catch and report), or rethrow after all have run.
- Clean up empty event entries to avoid growing maps; warn on too many listeners (a common leak signal, like Node's `maxListeners`).

#### Model answer
"An EventEmitter lets parts of an app communicate without knowing about each other: publishers emit events, subscribers listen.

```js
class EventEmitter {
  #listeners = new Map();   // event -> Set of listener functions

  on(event, listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(listener);
    return () => this.off(event, listener);      // unsubscribe handle
  }

  off(event, listener) {
    const set = this.#listeners.get(event);
    if (!set) return;
    for (const l of set) {
      if (l === listener || l.original === listener) set.delete(l);  // also removes once-wrappers
    }
    if (set.size === 0) this.#listeners.delete(event);               // avoid empty entries
  }

  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);                  // remove first, so re-emits inside don't re-trigger
      listener.apply(this, args);
    };
    wrapper.original = listener;                 // lets off(event, listener) find it
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const set = this.#listeners.get(event);
    if (!set || set.size === 0) return false;
    const errors = [];
    for (const listener of [...set]) {           // iterate over a snapshot
      try {
        listener.apply(this, args);
      } catch (err) {
        errors.push(err);                        // keep calling other listeners
      }
    }
    if (errors.length) queueMicrotask(() => { throw new AggregateError(errors, `listener error on ${String(event)}`); });
    return true;
  }

  listenerCount(event) {
    return this.#listeners.get(event)?.size ?? 0;
  }
}
```

**Usage:**
```js
const bus = new EventEmitter();
const unsubscribe = bus.on('cart:updated', (cart) => renderBadge(cart.count));
bus.once('user:loggedIn', (user) => showWelcome(user.name));

bus.emit('cart:updated', { count: 3 });
unsubscribe();               // in React: return this from useEffect cleanup
```

**Design decisions to explain:**
- **Set vs array**: a Set prevents registering the same function twice and makes removal O(1). If the interviewer expects duplicates to be called twice (Node's behaviour), I'd use an array and remove the first matching entry.
- **Snapshot during emit** (`[...set]`): if a listener unsubscribes itself (common with `once`) or subscribes another listener while we're iterating, iterating the live collection can skip or double-call listeners. Copying first gives predictable behaviour: listeners present when `emit` started are called.
- **`once` removes itself before calling**: if the listener emits the same event again, it won't run twice.
- **`off` with the original function** works for `once` listeners thanks to `wrapper.original`.
- **Errors**: a throwing listener shouldn't prevent others from running. I collect errors and rethrow asynchronously so they surface in error monitoring without breaking the emit loop. Node's EventEmitter instead treats an unhandled `'error'` event specially (throws if no listener).
- **Return value** of `emit`: whether any listeners existed, matching Node.

**Memory leaks.** The classic leak: a component subscribes on mount and never unsubscribes, so the emitter holds references to the component's closures forever, and listeners pile up on every remount. Prevention: always return and call the unsubscribe function (React: `useEffect(() => bus.on('x', handler), [])` returns the unsubscribe as cleanup), and warn when an event exceeds a listener threshold.

**Where this appears in real systems:** Node's `EventEmitter` (streams, servers), DOM `EventTarget` (`addEventListener` with `{ once: true }` and `AbortSignal` for removal), WebSocket clients routing messages by type, state stores' `subscribe` APIs (Redux, Zustand), and micro-frontend communication buses."

#### Another worked example: a WebSocket message router
"A trading dashboard received many message types over one WebSocket. We wrapped it in an emitter: `socket.onmessage = (e) => { const msg = JSON.parse(e.data); bus.emit(msg.type, msg.payload); }`. Components subscribed to `price:update` or `order:filled` only. A leak appeared when a chart component subscribed in a callback rather than `useEffect`: every re-render added another listener, and after an hour each price update triggered 3,000 handler calls. Returning the unsubscribe function from `useEffect` and adding a listener-count warning fixed and guarded it."

#### A third worked example: DOM events with AbortSignal
```js
const controller = new AbortController();
window.addEventListener('resize', onResize, { signal: controller.signal });
document.addEventListener('keydown', onKey, { signal: controller.signal });
// later: remove both at once
controller.abort();
```
"Mentioning that the DOM supports signal-based removal shows awareness of modern platform APIs for the same leak problem."

#### Variations you might be asked
- "Add wildcard listeners (`*` or `user:*`)": maintain a separate list of pattern listeners and match event names on emit.
- "Make emit async and await listeners": `await Promise.all(listeners.map((l) => l(...args)))`, with a decision on errors.
- "Add priority ordering": store listeners with a priority and sort on insert.
- "Typed events in TypeScript": `class Emitter<Events extends Record<string, unknown[]>>` with `on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void)`.

#### Step-by-step framework
1. **Clarify** duplicates, ordering, error behaviour, return values.
2. **Choose data structures** (Map of Sets or arrays).
3. **Implement on/off/emit** with an unsubscribe handle.
4. **Implement once** with self-removal and `original` tracking.
5. **Handle edge cases** (snapshot during emit, errors, empty entries).
6. **Discuss leaks and real-world uses.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Iterates live array during emit | Iterates a snapshot |
| `once` can't be removed with `off` | Tracks `original` on the wrapper |
| One throwing listener stops all | Errors collected, others still run |
| No unsubscribe pattern | `on` returns unsubscribe |
| Ignores leaks | Cleanup in useEffect, listener count warnings |

#### Useful phrases
- "I iterate over a snapshot so listeners can safely unsubscribe during emit."
- "Returning an unsubscribe function makes cleanup hard to forget."
- "Once-listeners remove themselves before running."
- "Forgotten subscriptions are one of the most common memory leaks in SPAs."

#### Common pitfalls
- **Mutating the collection while iterating.**
- **Arrow functions in `once`** that can't be found by `off`.
- **Never deleting empty event keys.**
- **Subscribing during render** in React.

#### Follow-ups to expect (with sample answers)
- **"What's the difference between this and the DOM's EventTarget?"**
  "EventTarget dispatches Event objects with propagation (capture/bubble), `preventDefault`, and options like `once`, `passive` and `signal`; an EventEmitter is a simpler in-memory pub/sub."
- **"Should emit be synchronous?"**
  "Node's is synchronous, which is predictable; async emission avoids blocking but changes ordering guarantees. I'd default to sync and document it."
- **"How would you debug which listeners are registered?"**
  "Expose `listenerCount`/`eventNames`, and log in development when counts exceed a threshold."

#### What senior interviewers look for
- **Robust edge-case handling.**
- **API ergonomics** that prevent bugs.
- **Real-world memory awareness.**

#### Practise it
1. Implement the emitter from memory, including `once` and snapshot iteration.
2. Write tests for unsubscribing during emit and errors in listeners.
3. Explain how forgotten subscriptions leak memory, out loud.

## Implement memoize(fn, keyFn?)
- id: f2759d48-d1d6-4690-ab0e-fc6ec1abd4d0
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: polyfill, closure, caching

### Prompt
Implement `memoize(fn, keyFn)` that caches results of `fn` by its arguments. `keyFn` is optional and builds the cache key from the arguments. Discuss cache keys, memory growth, async functions, and how this relates to React's `useMemo`.

### Answer
#### What the interviewer is really testing
- **Closures** holding a cache.
- Choosing a correct **cache key** for different argument types.
- Understanding when memoization is **safe** (pure functions) and its **memory costs**.
- Extensions: **LRU/TTL limits, async memoization, WeakMap for object keys**, and React memoization.

#### Key points
- Memoize works only for **pure functions**: same inputs → same output, no side effects.
- Default key: the first argument for single-argument functions, or a serialised key (`JSON.stringify(args)`) for multiple primitive arguments; let callers pass **`keyFn`** for custom keys.
- `JSON.stringify` keys are **ambiguous or wrong** for objects with different key order, functions, `undefined`, Dates and cycles.
- For **object arguments**, use a `WeakMap` keyed by object identity, so cached entries can be garbage-collected.
- Unbounded caches **leak memory**: add max size (LRU) or TTL.
- **Async memoization**: cache the promise so concurrent calls share one request; remove it on rejection so failures aren't cached forever.
- React's `useMemo` is per-component memoization of the **last** value only, not a global cache.

#### Model answer
"Memoization caches a function's results so repeated calls with the same arguments return instantly instead of recomputing.

**Basic implementation:**
```js
function memoize(fn, keyFn = (...args) => (args.length === 1 ? args[0] : JSON.stringify(args))) {
  const cache = new Map();

  function memoized(...args) {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key);   // has() so cached undefined still counts
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  }

  memoized.cache = cache;                         // allow inspection / clearing
  memoized.clear = () => cache.clear();
  return memoized;
}

const slowSquare = (n) => { for (let i = 0; i < 1e8; i++); return n * n; };
const fastSquare = memoize(slowSquare);
fastSquare(9);   // slow the first time
fastSquare(9);   // instant
```
Details:
- **`cache.has(key)`** rather than `if (cache.get(key))`: results like `0`, `''`, `false` or `undefined` are valid cached values.
- **Default key**: for one argument, use it directly (a Map handles any key type by identity or value for primitives); for several, `JSON.stringify(args)`.
- **`this` preserved** with `apply`, in case the memoized function is a method.

**Cache key pitfalls:**
- `JSON.stringify({a: 1, b: 2})` and `JSON.stringify({b: 2, a: 1})` produce different strings for equal objects.
- `JSON.stringify([undefined])` and `JSON.stringify([null])` both give `[null]`: different arguments, same key, wrong result.
- Functions and symbols are dropped; Dates become strings; cycles throw.
So for non-trivial arguments, callers should supply `keyFn` (e.g. `(user) => user.id`).

**Object arguments with WeakMap:**
```js
function memoizeByObject(fn) {
  const cache = new WeakMap();
  return (obj) => {
    if (!cache.has(obj)) cache.set(obj, fn(obj));
    return cache.get(obj);
  };
}
const getTotal = memoizeByObject((cart) => cart.items.reduce((s, i) => s + i.price * i.qty, 0));
```
Cached results disappear when the object is garbage-collected, so no leak. This pairs well with immutable data: a new cart object means a new computation; the same object reuses the cached total. That's the idea behind selector libraries like Reselect.

**Bounded cache (LRU):** an unbounded cache on a function called with many distinct inputs (say, formatting every timestamp) grows forever. I'd cap it: since a `Map` keeps insertion order, delete and re-insert on hit, and evict `cache.keys().next().value` when over the limit.

**Async functions:**
```js
function memoizeAsync(fn, keyFn = (...a) => JSON.stringify(a)) {
  const cache = new Map();
  return (...args) => {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key);
    const promise = fn(...args).catch((err) => {
      cache.delete(key);              // don't cache failures
      throw err;
    });
    cache.set(key, promise);          // concurrent callers share the in-flight promise
    return promise;
  };
}
```
Caching the promise (not the resolved value) deduplicates concurrent requests, which is exactly what TanStack Query does internally, plus expiry and invalidation.

**Relation to React:**
- `useMemo(() => compute(a, b), [a, b])` remembers only the **last** result per component instance, recomputing when dependencies change by reference.
- `React.memo` skips re-rendering a component when props are shallowly equal.
- These are about avoiding work during renders, not long-term caching. And the React Compiler can now add much of this automatically."

#### Another worked example: expensive formatting in a table
"A data table formatted 10,000 currency values with `Intl.NumberFormat` on every render, creating a new formatter each time. Memoizing the formatter factory by `(locale, currency)` (`memoize(createFormatter, (l, c) => l + '|' + c)`) reused one formatter per combination, cutting render time from 180 ms to 25 ms."

#### A third worked example: a wrong cache key bug
"A pricing helper memoized `calculatePrice(product, options)` with `JSON.stringify(args)`. Options objects were sometimes built with keys in different orders, causing cache misses, and an `expiresAt: undefined` field was dropped, so two different option sets produced the same key and returned a wrong price. The fix was an explicit `keyFn` building a key from the fields that matter: `${product.id}|${options.currency}|${options.couponCode ?? ''}`."

#### Variations you might be asked
- "Memoize a recursive function like Fibonacci": the recursive calls must go through the memoized version (define `const fib = memoize((n) => n < 2 ? n : fib(n - 1) + fib(n - 2))`).
- "Add TTL": store `{ value, expiresAt }` and treat expired entries as misses.
- "Memoize with multiple object arguments": nested WeakMaps (a trie of WeakMaps keyed by each argument).

#### Step-by-step framework
1. **Confirm purity** of the function.
2. **Implement the closure cache** with `has()`.
3. **Design the key** (default vs `keyFn`), noting JSON pitfalls.
4. **Handle object args** with WeakMap.
5. **Bound the cache** (LRU/TTL).
6. **Async and React** considerations.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `if (cache[key])` misses falsy results | `cache.has(key)` |
| Always `JSON.stringify` | Knows its pitfalls; `keyFn` and WeakMap |
| Unbounded cache | LRU or TTL limits |
| Caches rejected promises | Deletes failures; dedupes in-flight calls |
| Confuses with useMemo | Explains per-render memo vs global cache |

#### Useful phrases
- "Memoization is only safe for pure functions."
- "The cache key is where most memoization bugs come from."
- "For object arguments, a WeakMap avoids leaks."
- "Caching the promise deduplicates concurrent requests."

#### Common pitfalls
- **Memoizing impure functions** (time, randomness, external state).
- **Ambiguous keys.**
- **Memory leaks** from unbounded caches.
- **Caching errors forever.**

#### Follow-ups to expect (with sample answers)
- **"When does memoization make things slower?"**
  "When computing is cheaper than building and looking up the key, or when inputs rarely repeat, so the cache only adds overhead and memory."
- **"How does Reselect decide to recompute?"**
  "It compares input selector results by reference; if they're the same as last time, it returns the cached output."
- **"Is a Map key comparison by value?"**
  "For primitives, yes (same value, same key); for objects, by reference."

#### What senior interviewers look for
- **Correct keys and safety reasoning.**
- **Memory awareness.**
- **Connections to real tools** (React, TanStack Query, Reselect).

#### Practise it
1. Implement `memoize` and `memoizeAsync` from memory.
2. Add an LRU limit using Map insertion order.
3. Explain when memoization hurts performance, out loud.

## Implement an LRU cache
- id: 76be6176-5197-450a-80c2-a4f1653c1db3
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: data-structure, caching
- companies: Meta, Apple, OpenAI

### Prompt
Implement an LRU (least recently used) cache class with `get(key)` and `put(key, value)` in O(1) time and a fixed capacity. In JavaScript, explain how `Map`'s insertion order helps, and when you'd need a doubly linked list instead.

### Answer
#### What the interviewer is really testing
- Knowing that **`Map` preserves insertion order** and using it for O(1) recency updates.
- The classic **hash map + doubly linked list** design, for languages or cases where Map ordering isn't enough.
- **Edge cases**: updating existing keys, capacity 1 or 0, `get` refreshing recency.
- **Frontend use cases**: caching API responses, images, computed layouts, memoization limits.

#### Key points
- LRU evicts the **entry used least recently** when full.
- `get` must **mark the key as recently used**; `put` on an existing key must update value and recency.
- **Map approach**: delete and re-insert to move a key to the end (most recent); the first key from `map.keys()` is the least recent. All operations O(1) on average.
- **Linked list approach**: a hash map for lookup plus a doubly linked list for order, with sentinel head/tail nodes; needed for features like moving to arbitrary positions, or for a language-agnostic answer.
- Use `has` rather than truthiness checks; decide what `get` returns on a miss (`undefined` or `-1`).
- Front-end uses: response caches with bounded memory, image/blob caches, virtualised list measurement caches, memoize with max size.

#### Model answer
"An LRU cache keeps a fixed number of entries and, when full, throws away the one that hasn't been used for the longest time.

**Map-based implementation (idiomatic JavaScript):**
```js
class LRUCache {
  #capacity;
  #map = new Map();   // iteration order = insertion order: first = least recent

  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity <= 0) throw new RangeError('capacity must be a positive integer');
    this.#capacity = capacity;
  }

  get(key) {
    if (!this.#map.has(key)) return undefined;
    const value = this.#map.get(key);
    this.#map.delete(key);            // move to the end = most recently used
    this.#map.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.#map.has(key)) this.#map.delete(key);   // refresh position on update
    this.#map.set(key, value);
    if (this.#map.size > this.#capacity) {
      const oldestKey = this.#map.keys().next().value; // first key = least recent
      this.#map.delete(oldestKey);
    }
  }

  get size() { return this.#map.size; }
}
```
Walkthrough with capacity 2:
```js
const c = new LRUCache(2);
c.put('a', 1); c.put('b', 2);   // order: a, b
c.get('a');                     // order: b, a
c.put('c', 3);                  // evicts b → order: a, c
c.get('b');                     // undefined
c.put('a', 10);                 // update refreshes a → order: c, a
```
Why it's O(1): `Map` `get`, `set`, `delete` and taking the first key from the iterator are all constant time on average.

**Classic design: hash map + doubly linked list.** In an interview that's language-agnostic, or where the interviewer says 'don't rely on Map ordering', I'd implement:
```js
class Node {
  constructor(key, value) { this.key = key; this.value = value; this.prev = this.next = null; }
}

class LRUCacheList {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();                       // key -> node
    this.head = new Node(); this.tail = new Node(); // sentinels
    this.head.next = this.tail; this.tail.prev = this.head;
  }
  #remove(node) { node.prev.next = node.next; node.next.prev = node.prev; }
  #addToFront(node) {
    node.next = this.head.next; node.prev = this.head;
    this.head.next.prev = node; this.head.next = node;
  }
  get(key) {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.#remove(node); this.#addToFront(node);
    return node.value;
  }
  put(key, value) {
    let node = this.map.get(key);
    if (node) { node.value = value; this.#remove(node); this.#addToFront(node); return; }
    node = new Node(key, value);
    this.map.set(key, node); this.#addToFront(node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev;
      this.#remove(lru); this.map.delete(lru.key);   // nodes store keys for this
    }
  }
}
```
Sentinel nodes remove all 'first/last node' special cases; nodes store their key so eviction can delete the map entry.

**Extensions I'd mention:**
- **TTL**: store `expiresAt` with each value; treat expired entries as misses on `get`.
- **Size-based limits**: for images or blobs, limit total bytes rather than entry count.
- **onEvict callback**: release resources, e.g. `URL.revokeObjectURL` for cached object URLs.
- Libraries: `lru-cache` on npm is the standard choice in Node and build tools.

**Where I've used LRU on the frontend:**
- Bounding a memoize cache for formatting or parsing functions.
- Caching measured row heights in a virtualised list (only for recently seen rows).
- Caching decoded images or generated thumbnails to avoid memory bloat in a gallery."

#### Another worked example: an API response cache
"A product comparison page fetched product details as users hovered over cards. Without limits, the in-memory cache grew to thousands of entries during long sessions. An LRU cache of 200 products with a 5-minute TTL kept hover previews instant for recently viewed items while bounding memory. (In an app already using TanStack Query, I'd rely on its `gcTime` instead.)"

#### A third worked example: object URLs leaking memory
"An image editor created object URLs for thumbnails with `URL.createObjectURL(blob)` and never revoked them, so blob memory grew until the tab crashed. We stored thumbnails in an LRU cache (100 entries) with an eviction callback that called `URL.revokeObjectURL(url)`, keeping memory stable."

#### Variations you might be asked
- "Implement LFU (least frequently used)": track counts and a map from frequency to an ordered set of keys, with a `minFreq` pointer.
- "Make `get` not affect recency (peek)": add a `peek(key)` method that reads without reordering.
- "Why not an array?": finding and moving an element in an array is O(n).

#### Step-by-step framework
1. **Clarify** capacity, miss value, update behaviour.
2. **Explain the ordering trick** with Map.
3. **Implement get/put** with refresh on access and update.
4. **Walk through evictions.**
5. **Show the linked list design** if needed.
6. **Discuss TTL, size limits, eviction callbacks and use cases.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Array with O(n) moves | Map ordering or linked list for O(1) |
| `get` doesn't refresh recency | Delete and re-insert on access |
| Updating a key doesn't refresh | Refreshes on put |
| No validation | Handles invalid capacity |
| No real use | Response caches, object URL cleanup |

#### Useful phrases
- "A JavaScript Map remembers insertion order, so the first key is the least recently used."
- "Get is a write operation for ordering purposes."
- "Sentinel nodes remove edge cases in the linked list version."
- "For object URLs, eviction needs to release the underlying blob."

#### Common pitfalls
- **Forgetting to refresh on get or update.**
- **Truthiness checks** that treat cached `0` or `''` as misses.
- **Not deleting the evicted key** from the map in the list version.
- **Unbounded caches** elsewhere in the app.

#### Follow-ups to expect (with sample answers)
- **"Is Map iteration order guaranteed?"**
  "Yes, the spec guarantees Map iterates in insertion order."
- **"What's the space complexity?"**
  "O(capacity)."
- **"How is LRU different from TanStack Query's cache?"**
  "TanStack Query removes inactive queries after `gcTime` (time-based) rather than by count, and adds staleness and refetching logic."

#### What senior interviewers look for
- **Idiomatic JavaScript** plus the classic design.
- **Correct recency semantics.**
- **Practical frontend memory awareness.**

#### Practise it
1. Implement the Map version in under 10 minutes.
2. Implement the linked list version with sentinels.
3. Add TTL and an onEvict callback, and explain them out loud.

## Implement Array.prototype.reduce from scratch
- id: dc5d1a84-6ce3-4793-a03a-8b16ba780202
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, iteration

### Prompt
Implement your own `Array.prototype.myReduce(callback, initialValue)` that behaves like the built-in `reduce`, including the behaviour with and without an initial value, empty arrays and sparse arrays.

### Answer
#### What the interviewer is really testing
- Precise knowledge of **reduce semantics**, including edge cases.
- Understanding **`this` inside prototype methods** and how polyfills are written.
- **Argument handling** (`arguments.length` to detect an omitted initial value, even if `undefined` is passed explicitly).
- Fluency in **using reduce** for real transformations (grouping, indexing, composing).

#### Key points
- Callback signature: `(accumulator, currentValue, index, array)`.
- **With an initial value**: the accumulator starts as it; iteration starts at index 0.
- **Without an initial value**: the accumulator starts as the first present element; iteration starts at the next index.
- **Empty array without initial value throws `TypeError`**; empty array with initial value returns the initial value without calling the callback.
- Detect "no initial value" with **`arguments.length < 2`**, because `reduce(fn, undefined)` *does* provide an initial value.
- **Sparse arrays**: holes are skipped (`i in array` check).
- Validate that the callback is a function; use a regular function so `this` is the array.

#### Model answer
"reduce walks through an array and combines all elements into a single result, passing an accumulator from one step to the next.

```js
Array.prototype.myReduce = function (callback, initialValue) {
  if (this == null) throw new TypeError('myReduce called on null or undefined');
  if (typeof callback !== 'function') throw new TypeError(`${callback} is not a function`);

  const array = Object(this);
  const length = array.length >>> 0;          // ToUint32, like the spec
  let index = 0;
  let accumulator;

  if (arguments.length >= 2) {
    accumulator = initialValue;               // explicit initial value (even if undefined)
  } else {
    // find the first present element (skip holes)
    while (index < length && !(index in array)) index++;
    if (index >= length) throw new TypeError('Reduce of empty array with no initial value');
    accumulator = array[index++];
  }

  for (; index < length; index++) {
    if (index in array) {                     // skip holes in sparse arrays
      accumulator = callback(accumulator, array[index], index, array);
    }
  }
  return accumulator;
};
```

**Edge cases demonstrated:**
```js
[1, 2, 3].myReduce((a, b) => a + b);          // 6 (starts with 1, iterates from index 1)
[1, 2, 3].myReduce((a, b) => a + b, 10);      // 16
[].myReduce((a, b) => a + b, 0);              // 0 (callback never called)
[].myReduce((a, b) => a + b);                 // TypeError
[, 5, , 7].myReduce((a, b) => a + b);         // 12 (holes skipped)
[1, 2].myReduce((acc) => acc, undefined);     // undefined (explicit initial value)
```

**Why `arguments.length` and not `initialValue === undefined`:** someone might legitimately pass `undefined` as the starting accumulator. Checking the value would treat that as 'no initial value' and start from the first element, changing behaviour. The spec checks whether the argument was supplied.

**Why a regular function:** inside a prototype method, `this` is the array the method was called on. An arrow function would capture the outer `this` (undefined in modules).

**Practical uses of reduce** (often a follow-up):
```js
// group by
const byCategory = products.reduce((groups, p) => {
  (groups[p.category] ??= []).push(p);
  return groups;
}, {});

// index by id for O(1) lookups
const byId = users.reduce((map, u) => map.set(u.id, u), new Map());

// compose functions
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);

// sequential async (one after another)
await urls.reduce((prev, url) => prev.then(() => fetch(url)), Promise.resolve());
```
Readability note: for simple cases, `for...of`, `map`/`filter`, or newer helpers like `Object.groupBy` are clearer than a clever reduce. I use reduce when the 'fold into one value' shape genuinely fits."

#### Another worked example: building a lookup table
"A table rendered 2,000 orders and looked up each order's customer with `customers.find(c => c.id === order.customerId)`, which is O(n×m). Building a lookup once with reduce (or `new Map(customers.map(c => [c.id, c]))`) made each lookup O(1), cutting render time by over 200 ms."

#### A third worked example: totals in a cart
```js
const totals = cart.items.reduce(
  (acc, item) => {
    acc.subtotal += item.price * item.qty;
    acc.count += item.qty;
    return acc;
  },
  { subtotal: 0, count: 0 },
);
```
"Mutating a fresh accumulator object that reduce itself created is fine and efficient; what I avoid is mutating shared external state inside the callback."

#### Variations you might be asked
- "Implement reduceRight": iterate from the end; the same initial value rules.
- "Implement map and filter using reduce": `arr.reduce((acc, x, i) => (acc.push(fn(x, i)), acc), [])`.
- "Implement it without modifying the prototype": write `reduce(array, callback, initial)` as a standalone function, which is better practice in application code.

#### Step-by-step framework
1. **State the signature and semantics.**
2. **Validate inputs** (`this`, callback).
3. **Handle initial value** with `arguments.length`.
4. **Find the first present element** when no initial value; throw if none.
5. **Iterate, skipping holes.**
6. **Test edge cases** and show practical uses.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `if (!initialValue)` | `arguments.length` check |
| Doesn't throw on empty array | Throws TypeError like the built-in |
| Calls callback for holes | Skips holes with `in` |
| Arrow function method | Regular function using `this` |
| Can't apply it | Group-by, index, pipe, sequential async |

#### Useful phrases
- "Passing undefined explicitly still counts as an initial value, so I check arguments.length."
- "Without an initial value, the first element becomes the accumulator."
- "Holes in sparse arrays are skipped, matching the spec."
- "I use reduce when the problem is genuinely folding into one value."

#### Common pitfalls
- **Falsy initial value bug** (`0` treated as missing).
- **Off-by-one start index.**
- **Overly clever reduces** that hurt readability.
- **Modifying built-in prototypes** in production code.

#### Follow-ups to expect (with sample answers)
- **"Why is extending Array.prototype discouraged?"**
  "It can clash with future standard methods or other libraries; that's what happened with MooTools and `Array.prototype.flatten`, which is why the standard method is called `flat`."
- **"What does reduce return for a single-element array with no initial value?"**
  "That element, without calling the callback."
- **"How would you reduce asynchronously in parallel?"**
  "Map to promises and `Promise.all`, then reduce the results; the promise-chain reduce above is sequential."

#### What senior interviewers look for
- **Spec-level precision.**
- **Practical fluency** and readability judgement.
- **Awareness of polyfill etiquette.**

#### Practise it
1. Implement `myReduce` and run all six edge-case examples.
2. Implement `map`, `filter` and `groupBy` using your reduce.
3. Explain why `arguments.length` matters, out loud.

## Implement compose(...fns) and pipe(...fns)
- id: 716b58e4-c313-45aa-9c87-38731ce64b37
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, functional

### Prompt
Implement `compose(...fns)` and `pipe(...fns)`. `compose(f, g, h)(x)` should equal `f(g(h(x)))` (right to left); `pipe(f, g, h)(x)` should equal `h(g(f(x)))` (left to right). Follow-ups: support async functions, multiple initial arguments, and explain where composition appears in real frontend code.

### Answer
#### What the interviewer is really testing
- **Higher-order functions** and using `reduce`/`reduceRight`.
- Understanding **evaluation order** and data flow.
- Edge cases: **no functions** (identity), first function taking multiple arguments.
- Extending to **async pipelines** and recognising composition in **middleware, HOCs and data transforms**.

#### Key points
- **compose** applies functions **right to left** (mathematical composition); **pipe** applies **left to right** (reads like a sequence of steps).
- Implement with **`reduceRight`** (compose) or **`reduce`** (pipe).
- With **no functions**, return the **identity** function.
- Allow the **first function to take multiple arguments**; every later function receives one value.
- **Async pipe**: start with `Promise.resolve(x)` and chain `.then(fn)`, or use `await` in a loop.
- Real uses: data transformation pipelines, Redux `compose` for store enhancers, middleware chains (Express/Koa/Redux), validation pipelines, HOCs (now mostly replaced by hooks).

#### Model answer
"Composition builds a new function out of smaller ones, passing the output of one as the input to the next.

**pipe (left to right):**
```js
const pipe = (...fns) => (...args) => {
  if (fns.length === 0) return args[0];            // identity
  const [first, ...rest] = fns;
  return rest.reduce((acc, fn) => fn(acc), first(...args));
};
```
**compose (right to left):**
```js
const compose = (...fns) => (...args) => {
  if (fns.length === 0) return args[0];
  const last = fns[fns.length - 1];
  return fns.slice(0, -1).reduceRight((acc, fn) => fn(acc), last(...args));
};
```
Or compose in terms of pipe: `const compose = (...fns) => pipe(...fns.reverse())`. (Careful: `reverse()` mutates, so on a copy: `pipe(...[...fns].reverse())`.)

**Example:**
```js
const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const slugify = (s) => s.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const toSlug = pipe(trim, lower, slugify);
toSlug('  Hello World! React 19  ');      // 'hello-world-react-19'

const toSlug2 = compose(slugify, lower, trim);   // same result, read right to left
```

**Why both exist:** compose matches maths notation `f ∘ g` and libraries like Redux (`compose(applyMiddleware(...), devTools)`); pipe reads in the order steps happen, which most people find easier for data pipelines. In application code I usually prefer pipe for readability.

**Multiple initial arguments:** the first function can receive all arguments (`pipe(add, double)(2, 3)` → 10), every later function gets a single value, which is why composition works best with **unary** functions (and why currying pairs well with it).

**Async pipe:**
```js
const pipeAsync = (...fns) => (input) =>
  fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(input));

const processUpload = pipeAsync(validateFile, compressImage, uploadToStorage, saveMetadata);
await processUpload(file);   // each step can be sync or async
```
Errors short-circuit naturally: if any step rejects, later steps are skipped and the returned promise rejects.

**Where composition shows up in frontend work:**
- **Data transforms**: `pipe(filterByStatus, sortByDate, paginate)(orders)`.
- **Redux**: `compose` combines store enhancers; middleware is composed functions (`store => next => action => ...`).
- **Middleware chains** in Express/Koa/Next.js middleware: each layer wraps the next.
- **Validation**: run a value through a pipeline of validators.
- **HOCs**: `compose(withRouter, withTheme, connect(mapState))(Component)`, common before hooks; today hooks usually replace stacked HOCs because they avoid wrapper hell and prop collisions.

**TypeScript note:** typing variadic pipe precisely requires overloads (as fp-ts and lodash do) or recursive tuple types; that's worth mentioning if the interviewer asks about types."

#### Another worked example: a search results pipeline
"A product listing applied filters, sorting and pagination in one 120-line function that was hard to test. We split it into small pure functions (`filterByPrice(range)`, `filterByBrand(brands)`, `sortBy(field)`, `paginate(page, size)`) and composed them with pipe based on the current URL parameters. Each step got its own unit tests, and adding a new filter became a one-line change."

#### A third worked example: middleware composition
```js
const composeMiddleware = (...middlewares) => (handler) =>
  middlewares.reduceRight((next, mw) => mw(next), handler);

const withLogging = (next) => async (req) => { console.time(req.url); const r = await next(req); console.timeEnd(req.url); return r; };
const withAuth = (next) => async (req) => (req.user ? next(req) : new Response('Unauthorized', { status: 401 }));

const handle = composeMiddleware(withLogging, withAuth)(async (req) => new Response('ok'));
```
"This is the same pattern Redux and Koa use: each middleware wraps the next, and reduceRight builds the onion from the inside out."

#### Variations you might be asked
- "Implement compose without reduce": a loop from the last function to the first.
- "Make pipe lazy/stream-friendly": compose transformer functions over iterables (generators) so items flow through one at a time.
- "Add a tap/debug step": `const tap = (fn) => (x) => (fn(x), x)` to log values mid-pipeline without changing them.

#### Step-by-step framework
1. **Define order** for compose vs pipe.
2. **Implement with reduce/reduceRight.**
3. **Handle identity and multi-argument first step.**
4. **Show a concrete example.**
5. **Extend to async.**
6. **Connect to real patterns** (middleware, Redux, data pipelines, HOCs vs hooks).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Mixes up the order | Clear right-to-left vs left-to-right |
| Crashes with no functions | Returns identity |
| Only single argument | First step can take multiple args |
| No async story | `pipeAsync` with promise chaining |
| Academic only | Middleware, Redux, data pipelines |

#### Useful phrases
- "compose reads like maths; pipe reads like the steps happen."
- "Composition works best with small, unary, pure functions."
- "Middleware is just composition: each layer wraps the next."
- "Hooks replaced most HOC composition in React."

#### Common pitfalls
- **Mutating `fns` with reverse().**
- **Order confusion** in compose.
- **Impure steps** that make pipelines hard to reason about.
- **Over-composing** trivial logic, hurting readability.

#### Follow-ups to expect (with sample answers)
- **"Why does currying help composition?"**
  "Curried functions can be partially applied into unary functions that slot directly into a pipeline."
- **"How do you debug a long pipeline?"**
  "Insert a `tap(console.log)` step, or test each function separately since they're pure."
- **"Is there a native pipe operator?"**
  "A pipeline operator (`|>`) has been proposed for JavaScript but isn't standard yet."

#### What senior interviewers look for
- **Functional fluency.**
- **Real-world pattern recognition.**
- **Readability judgement.**

#### Practise it
1. Implement pipe, compose and pipeAsync from memory.
2. Refactor a messy data transformation into a pipeline of pure functions.
3. Explain how Redux middleware uses composition, out loud.

## Explain the event loop: macrotasks, microtasks, animation frames
- id: 77e338e0-050a-4ed4-bfef-1f52683a86c4
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: event-loop, concepts, depth
- companies: Apple, Meta, OpenAI

### Prompt
Explain how the JavaScript event loop works in the browser: the call stack, the task (macrotask) queue, the microtask queue and `requestAnimationFrame`. Predict the output order of a snippet mixing `setTimeout`, promises and `queueMicrotask`. Senior interviews go deep here.

### Answer
#### What the interviewer is really testing
- A correct **mental model** of how single-threaded JavaScript handles async work.
- The **ordering rules**: synchronous code → all microtasks → render (maybe) → next task.
- Where **rendering** and `requestAnimationFrame` fit, and why long tasks cause jank.
- Applying the model to **real bugs**: UI not updating, timing surprises, starvation, React batching.

#### Key points
- JavaScript runs on **one main thread** with a **call stack**; async APIs (timers, network, events) are handled by the browser and queue callbacks when ready.
- **Tasks (macrotasks)**: `setTimeout`/`setInterval` callbacks, I/O events, user input events, `MessageChannel` messages, script execution itself.
- **Microtasks**: promise reactions (`.then`, `await` continuations), `queueMicrotask`, `MutationObserver` callbacks.
- **Loop order**: run one task → run **all** microtasks (including ones added during this phase) → if it's time, **render** (rAF callbacks → style → layout → paint) → next task.
- `requestAnimationFrame` runs **just before the browser paints**, roughly once per display refresh (60/120 Hz), and is paused in background tabs.
- Long tasks (> 50 ms) block input and rendering, causing **jank** and poor **INP**.
- `setTimeout(fn, 0)` isn't immediate: minimum delay, it waits for the current task and microtasks, and nested timers clamp to ≥ 4 ms.

#### Model answer
"JavaScript in the browser runs on a single main thread. Only one piece of code executes at a time, on the call stack. Things like timers, network requests and user events are handled by the browser in the background; when they're ready, their callbacks are put in queues. The event loop decides what runs next.

**The pieces:**
- **Call stack**: the currently running functions.
- **Task queue(s)**: callbacks from `setTimeout`, events (click, keydown), network responses, `postMessage`. Browsers actually have several task queues with priorities (input often goes first), but conceptually it's 'the next task'.
- **Microtask queue**: promise callbacks, `await` continuations, `queueMicrotask`, `MutationObserver`.
- **Rendering steps**: `requestAnimationFrame` callbacks, style recalculation, layout, paint, compositing.

**One iteration of the loop:**
```
1. Take the oldest task from a task queue and run it to completion.
2. Run ALL microtasks until the microtask queue is empty
   (microtasks queued during this step also run now).
3. If it's time to render (about every 16.7 ms at 60 Hz) and something changed:
     a. run requestAnimationFrame callbacks
     b. recalculate styles, layout, paint
4. Repeat.
```

**Classic output-order question:**
```js
console.log('1 sync');

setTimeout(() => console.log('2 timeout'), 0);

Promise.resolve().then(() => console.log('3 promise'));

queueMicrotask(() => console.log('4 microtask'));

requestAnimationFrame(() => console.log('5 rAF'));

(async () => {
  console.log('6 async start');
  await null;
  console.log('7 after await');
})();

console.log('8 sync end');
```
Output:
```
1 sync
6 async start        ← async functions run synchronously until the first await
8 sync end
3 promise            ← microtasks in the order they were queued
4 microtask
7 after await
2 timeout / 5 rAF    ← order between these varies: depends on when the next frame is due
```
Reasoning: all synchronous code first (including the start of the async function), then the whole microtask queue in FIFO order, then the next task (the timeout) and, whenever the browser decides to render, the rAF callback. Many people say rAF always runs before the timeout; in reality the timeout often runs first because a frame isn't due yet, so I'd explain that it depends.

**Why this matters in practice:**
1. **Long tasks freeze the UI.** If a click handler runs a 300 ms loop, nothing else (other input, rendering, animations) happens for 300 ms. Fixes: break work into chunks, yield to the main thread (`await scheduler.yield()` where available, or `setTimeout`), or move it to a Web Worker.
2. **DOM changes don't paint mid-task.** Setting `el.textContent = 'Loading…'` then doing heavy synchronous work means the user never sees 'Loading…', because rendering only happens between tasks. You need to yield first.
3. **Microtasks can starve rendering.** A promise chain that keeps queuing microtasks runs before any rendering or input, so the page freezes even though the code is 'async'.
4. **Animations belong in rAF.** It syncs with the display refresh, avoids doing work for frames that won't be painted, and pauses in background tabs.
5. **Reading layout after writing styles** within a task forces synchronous layout (layout thrashing); batching reads before writes, or doing writes in rAF, avoids it.

**React connection:** React 18 batches state updates from promises, timeouts and native events into one render (automatic batching). Concurrent features (`useTransition`) let React split rendering work and yield to the browser so input stays responsive, which is the event loop model applied to rendering.

**Node.js difference (bonus):** Node has phases (timers, poll, check for `setImmediate`, etc.) and `process.nextTick`, which runs before promise microtasks. The microtask-after-each-task rule still holds."

#### Another worked example: a loading spinner that never appears
"A button handler set `isLoading = true` (showing a spinner via direct DOM update), then parsed a 20 MB CSV synchronously. Users saw the page freeze with no spinner. Because rendering happens only between tasks, the spinner couldn't paint until the parse finished. We showed the spinner, yielded with `await new Promise(requestAnimationFrame)` and then `setTimeout` so a frame could paint, and moved parsing into a Web Worker. The spinner appeared instantly and the page stayed responsive."

#### A third worked example: chunking work to keep input responsive
```js
async function processInChunks(items, processItem, chunkSize = 200) {
  for (let i = 0; i < items.length; i += chunkSize) {
    items.slice(i, i + chunkSize).forEach(processItem);
    await new Promise((resolve) => setTimeout(resolve, 0));   // yield: lets input and rendering run
  }
}
```
"Each chunk is a short task; between chunks the browser can handle clicks and paint. Yielding with a promise that resolves immediately (`await Promise.resolve()`) would NOT help, because that's a microtask and runs before rendering."

#### Variations you might be asked
- "What's the difference between setTimeout(fn, 0) and queueMicrotask(fn)?": the microtask runs before the next render and before any other task; the timeout runs as a later task, after rendering may have happened.
- "Where does MutationObserver fit?": its callbacks are microtasks, batched after DOM mutations.
- "What is MessageChannel used for?": scheduling a task faster than setTimeout's clamping, which React's scheduler used.

#### Step-by-step framework
1. **Describe the single thread and call stack.**
2. **Define tasks and microtasks** with examples.
3. **State the loop order**, including rendering and rAF.
4. **Walk through an output-order example.**
5. **Connect to jank, long tasks and INP.**
6. **Give fixes** (chunking, yielding, workers, rAF) and React's batching/concurrency.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Async code runs in parallel" | Single thread; browser handles I/O, queues callbacks |
| Only mentions setTimeout | Tasks, microtasks, rendering, rAF |
| "rAF always runs before timeout" | Explains it depends on frame timing |
| No practical link | Jank, unpainted spinners, starvation, INP |
| No fixes | Chunking, yielding to tasks, workers, rAF |

#### Useful phrases
- "After every task, the browser drains the entire microtask queue before it can render."
- "Rendering only happens between tasks, so a long task freezes the screen."
- "Yielding with a resolved promise doesn't let the browser paint; a new task does."
- "Animations go in requestAnimationFrame so they line up with paints."

#### Common pitfalls
- **Thinking promises run 'later' like timers.**
- **Assuming DOM changes paint immediately.**
- **Using microtasks to 'yield'.**
- **Animating with setInterval.**

#### Follow-ups to expect (with sample answers)
- **"What's a long task?"**
  "A task running over 50 ms on the main thread; it delays input handling and hurts INP. Chrome DevTools marks them with red corners."
- **"How does await work in terms of the event loop?"**
  "The function pauses; the rest of it is scheduled as a microtask when the awaited promise settles."
- **"What's scheduler.yield()?"**
  "A newer API that yields to the browser and resumes with priority, making chunked work easier than setTimeout."

#### What senior interviewers look for
- **Precise ordering rules** including rendering.
- **Debugging intuition** for jank and frozen UIs.
- **Practical fixes** grounded in the model.

#### Practise it
1. Predict and then run the output-order snippet in a browser.
2. Write a chunked processing function and verify input stays responsive in DevTools.
3. Draw the event loop with tasks, microtasks and rendering, and explain it out loud.

## What's the difference between let, const, var? Explain hoisting.
- id: 40d037c8-aaeb-4a50-9044-c078fb65d9e1
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: language-basics, scope
- companies: Apple, Monzo

### Prompt
Explain the differences between `var`, `let` and `const`: scope, hoisting, the temporal dead zone, re-declaration and re-assignment. Then explain hoisting for functions and classes, and predict the output of a few snippets.

### Answer
#### What the interviewer is really testing
- Precise understanding of **function scope vs block scope**.
- What **hoisting** really means, and the **temporal dead zone (TDZ)**.
- Classic bugs like **var in loops with closures**.
- That **`const` means a constant binding, not an immutable value**.

#### Key points
- **var**: function-scoped (or global), hoisted and initialised to `undefined`, can be re-declared, creates a property on `window` at the top level of classic scripts.
- **let**: block-scoped, hoisted but **not initialised** (TDZ until the declaration line), can't be re-declared in the same scope, can be re-assigned.
- **const**: like let but **must be initialised** and **can't be re-assigned**; objects and arrays it points to can still be mutated.
- **Hoisting**: declarations are registered when a scope is created, before code runs. Function declarations are fully hoisted (callable before their line); function expressions and arrow functions follow their variable's rules; classes are hoisted but in the TDZ.
- **var in a loop** shares one variable across iterations; **let** creates a fresh binding per iteration, fixing closure bugs.
- Modern default: **const** by default, **let** when re-assignment is needed, avoid **var**.

#### Model answer
"The differences come down to scope, hoisting behaviour and whether the binding can change.

**Scope:**
```js
function scopes() {
  if (true) {
    var a = 1;     // function-scoped: visible in the whole function
    let b = 2;     // block-scoped: only inside these braces
    const c = 3;   // block-scoped
  }
  console.log(a);  // 1
  console.log(b);  // ReferenceError: b is not defined
}
```

**Hoisting and the temporal dead zone.** When a scope is entered, JavaScript registers all declarations in it before running code. The difference is initialisation:
```js
console.log(x);   // undefined — var is hoisted AND initialised to undefined
var x = 5;

console.log(y);   // ReferenceError: Cannot access 'y' before initialization
let y = 5;        // let is hoisted but uninitialised until this line: the TDZ
```
The TDZ proves `let` is hoisted: in this example the inner `x` shadows the outer one from the start of the block, so the log throws instead of printing 'outer':
```js
let x = 'outer';
{
  console.log(x);   // ReferenceError — the inner x is already in scope, but in the TDZ
  let x = 'inner';
}
```

**Re-declaration and re-assignment:**
| | var | let | const |
|---|---|---|---|
| Scope | Function | Block | Block |
| Hoisted | Yes, initialised to undefined | Yes, TDZ | Yes, TDZ |
| Re-declare in same scope | Allowed | SyntaxError | SyntaxError |
| Re-assign | Allowed | Allowed | TypeError |
| Must initialise | No | No | Yes |
| Global object property (classic script) | Yes (`window.x`) | No | No |

**const is not immutability:**
```js
const user = { name: 'Asha' };
user.name = 'Ben';        // fine: the object is mutable
user = {};                // TypeError: Assignment to constant variable
const frozen = Object.freeze({ n: 1 }); // shallow immutability if you need it
```

**Functions and classes:**
```js
greet();                  // works: function declarations are fully hoisted
function greet() { console.log('hi'); }

sayHi();                  // TypeError: sayHi is not a function (var hoisted as undefined)
var sayHi = () => console.log('hi');

new Widget();             // ReferenceError: classes are in the TDZ
class Widget {}
```

**The classic loop bug:**
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));   // 3, 3, 3 — one shared i, already 3 when callbacks run
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j));   // 0, 1, 2 — a new j binding per iteration
}
```
Before `let`, people fixed this with an IIFE to capture each value.

**My practice:** use `const` by default (signals intent, prevents accidental re-assignment), `let` for counters and values that genuinely change, and never `var` in modern code. Linters (`no-var`, `prefer-const`) enforce it."

#### Another worked example: a production bug from var
"Legacy code attached click handlers in a loop with `var index`, so every button deleted the last item in the list instead of its own. Changing to `let` (or using `forEach` with its own callback scope) fixed it. It's the same closure-over-shared-variable bug as the setTimeout example, in a real UI."

#### A third worked example: accidental globals
"In an old non-module script, `var config = {...}` at the top level created `window.config`, which collided with a third-party widget that also used `window.config`. Moving to ES modules (where top-level declarations are module-scoped) and `const` removed the global pollution."

#### Variations you might be asked
- "What does `typeof undeclaredVariable` return vs `typeof tdzVariable`?": `'undefined'` for undeclared names, but a ReferenceError for a let/const in its TDZ.
- "Is a function expression hoisted?": the variable is (by var/let rules), the function value isn't assigned until that line runs.
- "What's block scope for in an if/switch?": `let`/`const` inside a `case` share the switch block unless you add braces, a common gotcha.

#### Step-by-step framework
1. **Scope**: function vs block.
2. **Hoisting**: declaration registration, var initialised to undefined.
3. **TDZ** for let/const/class.
4. **Re-declaration/re-assignment rules**, const vs immutability.
5. **Functions and classes hoisting.**
6. **Loop closure example** and modern best practice.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "let and const aren't hoisted" | Hoisted but in the TDZ, with proof |
| "const makes objects immutable" | Constant binding; Object.freeze for shallow immutability |
| Forgets function vs expression hoisting | Explains declarations vs expressions vs classes |
| No practical bug | Loop closure and global pollution bugs |
| No recommendation | const by default, let when needed, no var |

#### Useful phrases
- "Hoisting means the declaration is known from the start of the scope; let and const just aren't initialised yet."
- "const protects the binding, not the value."
- "let gives each loop iteration its own binding."
- "In modules, top-level declarations don't leak onto window."

#### Common pitfalls
- **Saying let isn't hoisted.**
- **Mutating const objects unexpectedly.**
- **Relying on function hoisting** for readability.
- **Switch-case scope collisions.**

#### Follow-ups to expect (with sample answers)
- **"Why does the TDZ exist?"**
  "To catch use-before-initialisation bugs and make const meaningful: a const should never be observed as undefined."
- **"Are there performance differences?"**
  "Not meaningful in practice; choose for correctness and readability."
- **"What happens with let in a for...of loop?"**
  "Same as a for loop: a fresh binding per iteration."

#### What senior interviewers look for
- **Precision** (TDZ, initialisation).
- **Bug recognition.**
- **Clear modern conventions.**

#### Practise it
1. Predict the output of each snippet above, then run them.
2. Explain the TDZ shadowing example to someone else.
3. Explain const vs immutability in 30 seconds, out loud.

## Explain closures with a practical example
- id: dd0fed4f-5708-45cb-a9ec-b19652a660d1
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: language-basics, closure

### Prompt
What is a closure? Explain with practical examples from real frontend code, including a bug that closures can cause (such as stale closures in React).

### Answer
#### What the interviewer is really testing
- A correct definition: a function plus the **lexical environment** it was created in.
- **Practical uses**: private state, factories, partial application, event handlers, hooks.
- Awareness of **closure-related bugs**: loop variables, **stale closures** in React, memory retention.
- Clear communication of an abstract concept.

#### Key points
- A **closure** is a function that **remembers variables from the scope where it was defined**, even after that outer function has returned.
- JavaScript uses **lexical scoping**: what a function can see is determined by where it's written, not where it's called.
- Closures capture **variables (bindings), not snapshots of values**; if the variable changes, the closure sees the new value. But in React, each render creates new variables, so old closures see old values (stale closures).
- Uses: **data privacy/encapsulation**, function factories, debounce/throttle/memoize, event handlers, module pattern, React hooks.
- Costs: closures keep referenced variables **alive in memory**; forgotten listeners or timers holding large data cause leaks.

#### Model answer
"A closure is a function bundled with the variables from the scope where it was created. Even after the outer function has finished, the inner function can still read and update those variables.

**Basic example: private state**
```js
function createCounter() {
  let count = 0;                       // not accessible from outside
  return {
    increment: () => ++count,
    current: () => count,
  };
}
const counter = createCounter();
counter.increment();
counter.increment();
counter.current();   // 2
counter.count;       // undefined — truly private
```
`createCounter` has returned, but `increment` and `current` still reference `count`. Each call to `createCounter` creates a new `count`, so counters are independent.

**Practical uses I see daily:**
1. **Event handlers with context:**
```js
function attachDelete(button, itemId) {
  button.addEventListener('click', () => deleteItem(itemId));   // remembers itemId
}
```
2. **Function factories / configuration:**
```js
const createApiClient = (baseUrl, token) => (path, init = {}) =>
  fetch(baseUrl + path, { ...init, headers: { ...init.headers, Authorization: 'Bearer ' + token } });
const api = createApiClient('https://api.example.com', token);
api('/orders');
```
3. **Utilities like debounce, throttle and memoize**, which keep timers or caches in a closure between calls.
4. **React hooks**: every event handler and effect inside a component is a closure over that render's props and state.

**The stale closure bug in React.** Closures capture the variables of the render they were created in:
```jsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);       // always sees count from the first render (0)
    }, 1000);
    return () => clearInterval(id);
  }, []);                        // empty deps: effect (and its closure) created once

  return <p>{count}</p>;         // stuck at 1
}
```
The interval callback was created during the first render, when `count` was 0, so it keeps setting 1. Fixes:
- **Functional update**: `setCount((c) => c + 1)`, which doesn't need to read `count` from the closure.
- **Correct dependencies**: include `count` in the deps (recreating the interval each change).
- **A ref** for values you need to read latest inside long-lived callbacks: `countRef.current`.

**The loop bug with var**: callbacks created in a `var` loop share one variable, so they all see its final value; `let` creates a new binding per iteration.

**Memory considerations:** a closure keeps everything it references alive. If an event listener on `window` closes over a large dataset and is never removed, that data can't be garbage-collected. Removing listeners and clearing timers on cleanup avoids leaks.

**How I'd explain it simply:** a closure is like a function carrying a backpack with the variables it needs from where it was born."

#### Another worked example: a stale closure in a chat app
"A chat component registered a WebSocket `onmessage` handler once in `useEffect([])`, and the handler appended messages using `setMessages([...messages, msg])`. Every new message replaced the list with just the initial messages plus the latest one, because `messages` was stale. Switching to `setMessages((prev) => [...prev, msg])` fixed it. This is the most common real closure bug I see in React code reviews."

#### A third worked example: once-only initialisation
```js
function once(fn) {
  let called = false, result;
  return function (...args) {
    if (!called) { called = true; result = fn.apply(this, args); }
    return result;
  };
}
const initAnalytics = once(() => loadScript('/analytics.js'));
initAnalytics(); initAnalytics();   // loads only once
```
"`called` and `result` live in the closure, giving each wrapped function its own memory."

#### Variations you might be asked
- "What's the module pattern?": an IIFE returning an object of functions that close over private variables; ES modules replace it today.
- "Do closures copy values?": no, they hold references to variables; primitives aren't copied at creation time.
- "Implement a function that can only be called n times": closure over a counter.

#### Step-by-step framework
1. **Define** with lexical scope.
2. **Show a minimal example** (counter).
3. **Give practical uses** (handlers, factories, utilities, hooks).
4. **Show a closure bug** (stale closure, var loop).
5. **Explain fixes.**
6. **Mention memory implications.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "A function inside a function" | Function + its lexical environment, outliving the outer call |
| Toy example only | Handlers, factories, hooks, utilities |
| Unaware of stale closures | Explains and fixes React stale closures |
| "Closures copy values" | Capture variables (bindings) |
| Ignores memory | Notes retention and cleanup |

#### Useful phrases
- "A closure remembers variables from where it was created, not where it's called."
- "Each render in React creates new variables, so old callbacks see old state."
- "Functional state updates avoid reading stale values."
- "Anything a closure references stays in memory as long as the closure does."

#### Common pitfalls
- **Stale state in long-lived callbacks.**
- **var in loops.**
- **Leaking large data** via listeners.
- **Over-explaining theory** without an example.

#### Follow-ups to expect (with sample answers)
- **"Why does useCallback exist?"**
  "To keep the same function identity across renders when dependencies haven't changed, which matters for memoized children and effect dependencies."
- **"Are all functions closures in JavaScript?"**
  "Technically yes, every function captures its lexical environment; we usually say 'closure' when it uses outer variables after the outer scope ends."
- **"How do you debug a stale closure?"**
  "Log values inside the callback, check the effect's dependency array, and use the exhaustive-deps lint rule."

#### What senior interviewers look for
- **Clear, accurate explanation.**
- **Real React experience** with closure pitfalls.
- **Memory awareness.**

#### Practise it
1. Write `createCounter` and `once` from memory.
2. Reproduce the stale interval bug in React and fix it three ways.
3. Explain closures in one sentence with the backpack analogy, out loud.

## Implement a basic observable / pub-sub (basic RxJS subject)
- id: d1739f1e-42b8-4e31-bf59-195d58a5e13b
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: pubsub, streaming, AI-relevant

### Prompt
Implement a minimal Observable/Subject: `subscribe(observer)` returning an unsubscribe function, `next(value)`, `error(err)` and `complete()`. Then add an operator like `map` or `filter`. This pattern underpins state libraries and AI streaming UIs.

### Answer
#### What the interviewer is really testing
- Understanding the **observer pattern** and push-based data flow.
- Handling the **lifecycle**: next, error, complete, and no emissions after completion.
- **Unsubscription** and resource cleanup.
- Composing **operators** and relating it to real tools (RxJS, state stores, streaming responses, `useSyncExternalStore`).

#### Key points
- An **observer** is an object with `next`, `error` and `complete` callbacks (all optional).
- A **Subject** is both observable and observer: you push values in with `next`, and all subscribers receive them (multicast).
- After `error` or `complete`, the subject is **closed**: no more emissions, and new subscribers are notified of the terminal state.
- `subscribe` returns an **unsubscribe** function (or subscription object).
- **Operators** like `map`/`filter` return a new observable that subscribes to the source and transforms values.
- **Cold vs hot**: an Observable created with a producer function starts work per subscriber (cold); a Subject shares one source among subscribers (hot).
- Front-end uses: stores (Redux/Zustand `subscribe`), event streams, WebSocket/SSE messages, streaming LLM tokens, form value changes.

#### Model answer
"An observable is a source of values over time that others can subscribe to. A Subject is the simplest version: you push values into it, and every subscriber gets them.

**Subject implementation:**
```js
class Subject {
  #observers = new Set();
  #closed = false;
  #error = null;
  #completed = false;

  subscribe(observerOrNext) {
    const observer = typeof observerOrNext === 'function'
      ? { next: observerOrNext }
      : observerOrNext;

    if (this.#error) { observer.error?.(this.#error); return () => {}; }
    if (this.#completed) { observer.complete?.(); return () => {}; }

    this.#observers.add(observer);
    return () => this.#observers.delete(observer);   // unsubscribe
  }

  next(value) {
    if (this.#closed) return;
    for (const o of [...this.#observers]) o.next?.(value);   // snapshot for safe unsubscribe
  }

  error(err) {
    if (this.#closed) return;
    this.#closed = true; this.#error = err;
    for (const o of [...this.#observers]) o.error?.(err);
    this.#observers.clear();
  }

  complete() {
    if (this.#closed) return;
    this.#closed = true; this.#completed = true;
    for (const o of [...this.#observers]) o.complete?.();
    this.#observers.clear();
  }
}
```

**Usage:**
```js
const messages$ = new Subject();
const unsubscribe = messages$.subscribe({
  next: (m) => console.log('message', m),
  error: (e) => console.error('failed', e),
  complete: () => console.log('done'),
});
messages$.next('hello');
messages$.next('world');
messages$.complete();
messages$.next('ignored');     // no effect after completion
```

**Operators.** To support chaining, I'd make an `Observable` class whose constructor takes a producer function, then build operators on it:
```js
class Observable {
  constructor(producer) { this.producer = producer; }   // (observer) => cleanup
  subscribe(observer) {
    const o = typeof observer === 'function' ? { next: observer } : observer;
    let closed = false;
    const safe = {
      next: (v) => { if (!closed) o.next?.(v); },
      error: (e) => { if (!closed) { closed = true; o.error?.(e); cleanup?.(); } },
      complete: () => { if (!closed) { closed = true; o.complete?.(); cleanup?.(); } },
    };
    const cleanup = this.producer(safe);
    return () => { closed = true; cleanup?.(); };
  }
  pipe(...ops) { return ops.reduce((src, op) => op(src), this); }
}

const map = (fn) => (source) => new Observable((obs) =>
  source.subscribe({ next: (v) => obs.next(fn(v)), error: obs.error, complete: obs.complete }));
const filter = (pred) => (source) => new Observable((obs) =>
  source.subscribe({ next: (v) => pred(v) && obs.next(v), error: obs.error, complete: obs.complete }));

// cold observable from DOM events
const fromEvent = (el, type) => new Observable((obs) => {
  const handler = (e) => obs.next(e);
  el.addEventListener(type, handler);
  return () => el.removeEventListener(type, handler);     // cleanup on unsubscribe
});

const stop = fromEvent(input, 'input')
  .pipe(map((e) => e.target.value.trim()), filter((v) => v.length > 2))
  .subscribe((q) => search(q));
```
Key design: each `subscribe` on an Observable runs the producer (cold), and the returned cleanup removes the event listener. That's how RxJS avoids leaks: unsubscribing tears down the whole chain.

**Real-world connections:**
- **Stores**: Redux/Zustand expose `subscribe(listener)`; React connects them with `useSyncExternalStore(subscribe, getSnapshot)`.
- **Streaming AI responses**: tokens arrive over SSE or a `ReadableStream`; an observable/subject lets the UI, a token counter and a logger all react to the same stream, with `complete` when the response ends and `error` on network failure.
- **WebSocket feeds**: a subject per message type.
- In modern code I'd often reach for async iterators (`for await (const chunk of stream)`) or a small store instead of full RxJS, unless the app needs complex stream composition (debounce, switchMap, retry), where RxJS shines."

#### Another worked example: streaming tokens to multiple consumers
"In an AI chat UI, the response stream needed to update the message bubble, a live token counter, and an autosave of the draft response. We read the `fetch` body with a reader and pushed decoded chunks into a Subject; each consumer subscribed independently. When the user pressed 'Stop', we aborted the fetch and called `complete()`; on network errors we called `error()` and the bubble showed a retry option. Separating the stream from its consumers made each feature simple to add."

#### A third worked example: connecting to React
```js
function useSubject(subject, initial) {
  const [value, setValue] = useState(initial);
  useEffect(() => subject.subscribe(setValue), [subject]);   // unsubscribe on unmount
  return value;
}
```
"Returning the unsubscribe function from the effect is the key line; forgetting it is the classic subscription leak."

#### Variations you might be asked
- "Implement BehaviorSubject": stores the latest value and emits it immediately to new subscribers (what most UI state needs).
- "Implement debounceTime / switchMap": debounceTime uses a timer per emission; switchMap unsubscribes from the previous inner observable when a new value arrives (great for search requests).
- "Observable vs Promise?": a promise is a single future value, eager and not cancellable; an observable is zero or more values over time, lazy (cold) and cancellable.

#### Step-by-step framework
1. **Define observer, observable, subject.**
2. **Implement subscribe/next/error/complete** with closed state.
3. **Return unsubscribe**; snapshot observers during emission.
4. **Add an Observable with producer cleanup.**
5. **Build operators via pipe.**
6. **Relate to stores, streaming and React.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Emits after complete | Closed state blocks further emissions |
| No unsubscribe | Returns unsubscribe, cleans up producers |
| Ignores errors | error() terminates and notifies |
| No operators | map/filter via pipe |
| No real use | Stores, streaming AI, WebSockets, React hook |

#### Useful phrases
- "A subject is both a source and a sink: push values in, subscribers receive them."
- "After complete or error, the stream is closed."
- "Unsubscribing should tear down the producer, like removing the event listener."
- "A promise is one value; an observable is many values over time."

#### Common pitfalls
- **Leaking subscriptions** in components.
- **Emitting after termination.**
- **Mutating observers while iterating.**
- **Using RxJS for simple cases** where a store or async iterator is enough.

#### Follow-ups to expect (with sample answers)
- **"Hot vs cold observables?"**
  "Cold starts its producer per subscriber (each gets its own HTTP request); hot shares one producer (all subscribers see the same WebSocket messages)."
- **"How would you handle backpressure?"**
  "Buffer, drop, sample or throttle values, or switch to a pull-based model like async iterators/streams."
- **"Why does useSyncExternalStore exist?"**
  "To subscribe React to external stores safely under concurrent rendering, avoiding tearing (different parts of the UI showing different values)."

#### What senior interviewers look for
- **Correct lifecycle semantics.**
- **Cleanup discipline.**
- **Judgement** on when to use streams vs simpler tools.

#### Practise it
1. Implement Subject from memory and test complete/error behaviour.
2. Add BehaviorSubject and a `useSubject` hook.
3. Explain Observable vs Promise vs async iterator, out loud.

## What happens when you JSON.stringify an object with a circular reference?
- id: 57a5557f-5406-412c-993f-3f2491b2959e
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: gotcha, serialization

### Prompt
What happens when you call `JSON.stringify` on an object that contains a circular reference? How would you serialise such an object safely, and what other values does JSON.stringify drop or change?

### Answer
#### What the interviewer is really testing
- Knowing that **JSON.stringify throws a TypeError** on cycles.
- Using the **replacer** argument (and `WeakSet`) to handle cycles.
- Awareness of **other lossy conversions** (undefined, functions, Dates, Map/Set, NaN, BigInt).
- Practical contexts: **logging, error reporting, state persistence, postMessage**, and alternatives.

#### Key points
- Circular references cause **`TypeError: Converting circular structure to JSON`**.
- Fix with a **replacer** that tracks seen objects in a `WeakSet` and replaces repeats with a placeholder like `'[Circular]'`.
- Note: a naive seen-set also replaces **shared (non-circular) references**; tracking the current ancestor path is more precise.
- JSON.stringify also: **drops** `undefined`, functions and symbols in objects (turns them into `null` in arrays); converts **Dates to ISO strings**; turns **NaN/Infinity into null**; serialises **Map/Set as `{}`**; **throws on BigInt**.
- Objects can define **`toJSON()`** to control serialisation.
- Alternatives: `structuredClone` (cycles OK, not a string), libraries like `flatted` or `superjson`, or reshaping data to avoid cycles.

#### Model answer
"JSON can't represent cycles, so `JSON.stringify` throws:
```js
const user = { name: 'Asha' };
user.self = user;
JSON.stringify(user);
// TypeError: Converting circular structure to JSON
//     --> starting at object with constructor 'Object'
//     --- property 'self' closes the circle
```
Common real sources: DOM nodes (parent ↔ child), framework objects (React fibers, Vue reactive objects), ORM entities (user ↔ orders), error objects with request/response references, and event objects.

**Safe serialisation with a replacer:**
```js
function safeStringify(value, space) {
  const seen = new WeakSet();
  return JSON.stringify(value, function (key, val) {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    return val;
  }, space);
}
safeStringify(user);   // '{"name":"Asha","self":"[Circular]"}'
```
The replacer is called for every key/value; `this` is the containing object. Limitation: an object referenced twice in different branches (not a cycle) is also marked `[Circular]` the second time. A more precise version tracks only the **ancestor stack**:
```js
function stringifyAncestors(value) {
  const ancestors = [];
  return JSON.stringify(value, function (key, val) {
    if (typeof val !== 'object' || val === null) return val;
    // `this` is the parent object; pop ancestors that are no longer on the path
    while (ancestors.length && ancestors[ancestors.length - 1] !== this) ancestors.pop();
    if (ancestors.includes(val)) return '[Circular]';
    ancestors.push(val);
    return val;
  });
}
```

**Other things JSON.stringify changes or drops:**
```js
JSON.stringify({
  u: undefined,          // dropped
  f() {},                // dropped
  s: Symbol('x'),        // dropped
  d: new Date(0),        // "1970-01-01T00:00:00.000Z" (via Date.prototype.toJSON)
  n: NaN,                // null
  i: Infinity,           // null
  m: new Map([[1, 2]]),  // {}
  set: new Set([1]),     // {}
  arr: [undefined, () => {}],   // [null, null]
});
JSON.stringify({ big: 10n });   // TypeError: Do not know how to serialize a BigInt
```
And `JSON.parse` doesn't revive Dates: they come back as strings unless you use a **reviver**.

**Controlling output with toJSON:**
```js
class Money {
  constructor(amount, currency) { this.amount = amount; this.currency = currency; }
  toJSON() { return `${this.amount} ${this.currency}`; }
}
JSON.stringify({ price: new Money(10, 'GBP') });   // '{"price":"10 GBP"}'
```

**Practical guidance:**
- **Logging and error reporting**: use a safe stringify (most logging libraries do) and limit depth/size so a huge object doesn't flood logs.
- **Persisting state** (localStorage): design state as plain, serialisable data (normalised by ID, no back-references), which also makes it work with Redux DevTools and SSR hydration.
- **Sending data between windows/workers**: `postMessage` uses the structured clone algorithm, which supports cycles, Maps and Dates without JSON.
- **Rich types across the network**: libraries like superjson (used by tRPC) preserve Dates, Maps, Sets and BigInts."

#### Another worked example: crashing error reporter
"Our error reporter called `JSON.stringify(error.context)` where the context included an Axios error with request and response objects referencing each other. The reporter itself threw, so the original error was lost. Switching to a safe serialiser with a depth limit and pulling only relevant fields (`status`, `url`, `message`) fixed it, and made reports smaller."

#### A third worked example: Dates lost in localStorage
"A booking app saved form state to localStorage. After reload, `state.checkIn.getTime()` threw because the Date had become a string. We stored ISO strings explicitly and parsed them on load with a reviver:
```js
JSON.parse(saved, (k, v) => (k === 'checkIn' || k === 'checkOut' ? new Date(v) : v));
```
Being explicit about serialisation boundaries prevents this class of bug."

#### Variations you might be asked
- "Serialise with a max depth": track depth via the ancestor stack and return '[Object]' beyond the limit.
- "How does JSON.stringify order keys?": in property order (integer-like keys ascending first, then insertion order); not guaranteed stable for comparisons across differently built objects.
- "Why might JSON.stringify be slow?": huge objects; for large payloads consider streaming serialisation or sending less data.

#### Step-by-step framework
1. **State the error.**
2. **Explain common sources** of cycles.
3. **Fix with a replacer** (WeakSet, then ancestor-precise version).
4. **List other lossy conversions.**
5. **Mention toJSON and revivers.**
6. **Suggest alternatives and design advice.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It returns an empty object" | Throws TypeError, with the message |
| No fix | Replacer with WeakSet, notes shared-ref limitation |
| Unaware of other losses | Lists undefined, functions, Dates, Map/Set, NaN, BigInt |
| No real context | Logging, persistence, postMessage examples |
| No alternatives | structuredClone, superjson, flatted |

#### Useful phrases
- "JSON is a tree format, so it can't represent cycles."
- "A WeakSet replacer handles cycles, but also flags shared references."
- "Dates go out as strings and don't come back as Dates without a reviver."
- "I keep application state as plain, serialisable data."

#### Common pitfalls
- **Logging huge objects** without limits.
- **Assuming round-trips preserve types.**
- **Serialising framework internals.**
- **Forgetting BigInt throws.**

#### Follow-ups to expect (with sample answers)
- **"What's the third argument of JSON.stringify?"**
  "`space` for indentation, a number or string, useful for readable logs."
- **"Can the replacer be an array?"**
  "Yes, an array of keys acts as an allow-list of properties to include."
- **"How does structured clone handle cycles?"**
  "It tracks visited objects and recreates the same graph shape in the copy."

#### What senior interviewers look for
- **Precise knowledge of JSON's limits.**
- **Robust utilities for logging and persistence.**
- **Good data design instincts.**

#### Practise it
1. Write `safeStringify` and the ancestor-precise version; test cycles and shared references.
2. List the outputs of the lossy example from memory.
3. Explain how you'd safely log an unknown error object, out loud.

## Explain async/await in terms of Promises
- id: 5b8c5883-61c4-4392-af5c-3931bd637f75
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: promises, async, concepts

### Prompt
Explain how `async`/`await` relates to Promises. Rewrite a promise chain using async/await and vice versa, explain error handling, and describe common mistakes such as accidental sequential awaits.

### Answer
#### What the interviewer is really testing
- Understanding that async/await is **syntax over Promises**, not a new concurrency model.
- What an **async function returns** and how **`await` pauses** (microtasks).
- **Error handling** equivalence (`try/catch` vs `.catch`), and unhandled rejections.
- Avoiding **performance mistakes** (sequential awaits) and knowing how to run work concurrently.

#### Key points
- An `async` function **always returns a Promise**: returning a value resolves it; throwing rejects it.
- `await expr` waits for the promise (or value) to settle; the rest of the function continues as a **microtask** after settlement. It doesn't block the thread.
- `try/catch/finally` around awaits corresponds to `.catch()` and `.finally()` in chains.
- **Sequential vs concurrent**: awaiting in a sequence runs operations one after another; start them first and `await Promise.all` to run concurrently.
- `await` in loops: `for...of` with await is sequential (sometimes desired); `forEach` with an async callback doesn't wait at all.
- **Unhandled rejections**: un-awaited promises that reject need handling; floating promises are a common bug.
- Top-level await works in ES modules.

#### Model answer
"async/await is a nicer way to write promise-based code. Under the hood it's the same thing: an async function returns a promise, and `await` is roughly 'pause here and continue in a `.then` when this promise settles'.

**The same logic both ways:**
```js
// Promise chain
function loadDashboard(userId) {
  return fetchUser(userId)
    .then((user) => fetchOrders(user.id))
    .then((orders) => render(orders))
    .catch((err) => showError(err))
    .finally(() => hideSpinner());
}

// async/await
async function loadDashboard(userId) {
  try {
    const user = await fetchUser(userId);
    const orders = await fetchOrders(user.id);
    render(orders);
  } catch (err) {
    showError(err);
  } finally {
    hideSpinner();
  }
}
```

**What async functions return:**
```js
async function f() { return 42; }
f();                         // Promise {<fulfilled>: 42}
async function g() { throw new Error('nope'); }
g().catch((e) => e.message); // 'nope' — a throw becomes a rejection
```

**How await schedules work:**
```js
async function demo() {
  console.log('A');
  await null;               // even a non-promise yields once
  console.log('C');
}
demo();
console.log('B');
// A, B, C — code after await runs in a microtask, after the current synchronous code
```
`await` doesn't block the thread; other code (rendering, events) can run while the function is suspended. That's why the UI stays responsive during a fetch.

**The most common performance mistake: accidental sequential awaits**
```js
// Sequential: ~900 ms if each takes 300 ms
const user = await getUser();
const settings = await getSettings();
const notifications = await getNotifications();

// Concurrent: ~300 ms — start all, then wait
const [user2, settings2, notifications2] = await Promise.all([
  getUser(), getSettings(), getNotifications(),
]);
```
Only await sequentially when a step depends on the previous result (orders need `user.id`).

**Loops:**
```js
// forEach does NOT wait — this logs 'done' before the saves finish, and errors are unhandled
items.forEach(async (item) => { await save(item); });
console.log('done');

// Sequential, in order (use when order or rate limits matter)
for (const item of items) await save(item);

// Concurrent
await Promise.all(items.map((item) => save(item)));
```

**Error handling details:**
- `try/catch` catches rejections of awaited promises and synchronous throws in the same block.
- A promise that's created but not awaited or caught is a **floating promise**; if it rejects, you get an unhandled rejection. Linters (`@typescript-eslint/no-floating-promises`) catch these.
- `return await` inside `try` matters: `return promise` (without await) inside try/catch skips the catch if that promise rejects, because the function returns before it settles.
```js
async function bad() { try { return fetchData(); } catch { return fallback; } }       // catch never runs for fetchData rejection
async function good() { try { return await fetchData(); } catch { return fallback; } }
```

**When I still use .then:** for quick one-liners, or when I want to start something without blocking the current function (`void logAnalytics().catch(reportError)`), and for combinators like Promise.all."

#### Another worked example: speeding up a page load
"A product page awaited the product, then reviews, then recommendations, then stock, one after another: about 1.4 s of waiting. Only reviews and recommendations depended on the product ID; stock didn't depend on anything. Restructuring to start stock immediately, await the product, then `Promise.all` reviews and recommendations cut total time to about 600 ms."

#### A third worked example: the forEach bug
"A bulk import showed 'Import complete' instantly while records were still saving, and failures produced unhandled rejection errors in the console. The code used `forEach(async ...)`. Replacing it with a concurrency-limited pool and `Promise.allSettled` gave accurate completion, per-item errors, and a correct summary."

#### Variations you might be asked
- "Implement async/await with generators": a runner that calls `gen.next(value)` on each resolved promise and `gen.throw(err)` on rejection, which is how Babel/regenerator originally transpiled it.
- "Can you await in a non-async function?": no, except top-level await in ES modules.
- "How do you add a timeout to an await?": `Promise.race` with a rejecting timer, or `AbortSignal.timeout(ms)` for fetch.

#### Step-by-step framework
1. **State the relationship**: syntax over promises.
2. **Show equivalent code** both ways.
3. **Explain return values and await scheduling.**
4. **Cover error handling** (try/catch, return await, floating promises).
5. **Highlight sequential vs concurrent.**
6. **Cover loops and practical patterns.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "await blocks until done" | Suspends the function, not the thread |
| Awaits everything sequentially | Concurrent with Promise.all where independent |
| Uses forEach with async | for...of or Promise.all |
| Ignores floating promises | Lint rules, explicit handling |
| Doesn't know return await nuance | Explains try/catch + return await |

#### Useful phrases
- "An async function always returns a promise."
- "await pauses the function, not the browser."
- "If two requests don't depend on each other, I start both before awaiting."
- "forEach doesn't wait for async callbacks."

#### Common pitfalls
- **Waterfall requests.**
- **forEach with async.**
- **Missing error handling** for un-awaited promises.
- **return without await** inside try.

#### Follow-ups to expect (with sample answers)
- **"Is async/await slower than promises?"**
  "No meaningful difference today; engines optimise it well."
- **"What happens if you await a non-promise?"**
  "It's wrapped in a resolved promise; the function still yields once."
- **"How do you cancel an async function?"**
  "You can't directly; pass an AbortSignal and check it, and pass it to fetch."

#### What senior interviewers look for
- **Accurate mental model.**
- **Performance awareness** (concurrency).
- **Robust error handling.**

#### Practise it
1. Convert three promise chains to async/await and back.
2. Find and fix a waterfall in real code (or the example above).
3. Explain the return-await nuance, out loud.

## What's the difference between Map and Object? When use which?
- id: dc5d5938-7463-46f6-a138-4c52db7ad254
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: data-structure, concepts

### Prompt
Compare `Map` and plain objects in JavaScript: key types, ordering, size, iteration, performance, prototype issues and serialisation. When would you choose each? Mention `WeakMap` and `Set` too.

### Answer
#### What the interviewer is really testing
- Practical knowledge of **key semantics** (strings/symbols vs any value).
- Awareness of **prototype pitfalls** and security issues (`__proto__`, prototype pollution).
- **Performance and API** differences for dynamic collections.
- Good judgement: **records vs dictionaries**, and serialisation constraints (JSON, React state).

#### Key points
- **Object keys** are strings or symbols (numbers become strings); **Map keys** can be any value, including objects and functions, compared by identity (SameValueZero).
- **Ordering**: Map iterates in insertion order; objects order integer-like keys ascending first, then string keys in insertion order.
- **Size**: `map.size` vs `Object.keys(obj).length`.
- **Iteration**: Map is directly iterable (`for...of`, `.forEach`, `.entries()`); objects need `Object.keys/entries`.
- **Prototype**: objects inherit from `Object.prototype`, so keys like `toString` or `__proto__` can collide; `Object.create(null)` avoids it. Maps have no such issue.
- **Performance**: Maps are optimised for frequent additions/deletions; objects are optimised for fixed-shape records (hidden classes).
- **Serialisation**: objects serialise to JSON directly; Maps become `{}` and need conversion (`Object.fromEntries(map)`).
- Use **objects for records/structured data**, **Maps for dynamic dictionaries** keyed by arbitrary or user-provided values; **WeakMap** for metadata attached to objects without leaks; **Set** for unique values.

#### Model answer
"Both store key-value pairs, but they're designed for different jobs: objects for records with known fields, Maps for dictionaries whose keys change at runtime.

**Key types:**
```js
const obj = {};
obj[1] = 'a';            // key becomes '1'
obj[{ id: 1 }] = 'b';    // key becomes '[object Object]' — collisions!
Object.keys(obj);        // ['1', '[object Object]']

const map = new Map();
const userA = { id: 1 }, userB = { id: 1 };
map.set(userA, 'selected');
map.get(userA);          // 'selected'
map.get(userB);          // undefined — different object identity
map.set(1, 'number'); map.set('1', 'string');   // distinct keys
```

**Prototype pitfalls:**
```js
const counts = {};
for (const word of ['constructor', 'apple']) counts[word] = (counts[word] || 0) + 1;
counts.constructor;      // "function Object() { [native code] }1" — collision with inherited property
```
With user-provided keys (tags, usernames, words), objects can collide with inherited properties, and writing to `__proto__` can even change the object's prototype, the root of **prototype pollution** vulnerabilities when merging untrusted JSON. A `Map` (or `Object.create(null)`) avoids this.

**API and iteration:**
```js
const m = new Map([['a', 1], ['b', 2]]);
m.size;                           // 2
m.has('a'); m.delete('a');
for (const [k, v] of m) {}        // insertion order
[...m.keys()];

const o = { a: 1, b: 2 };
Object.keys(o).length;
Object.hasOwn(o, 'a'); delete o.a;
for (const [k, v] of Object.entries(o)) {}
```

**Ordering gotcha with objects:**
```js
Object.keys({ b: 1, 2: 1, a: 1, 1: 1 });   // ['1', '2', 'b', 'a'] — integer-like keys first
```
Maps always keep insertion order, which matters for things like an LRU cache.

**Performance:** for many insertions and deletions (caches, counters, lookups built at runtime), Map is generally faster and more predictable. For fixed-shape records accessed by property name (`user.name`), objects are faster because engines optimise them with hidden classes; using `delete` on objects can de-optimise them.

**Serialisation and React:**
- `JSON.stringify(map)` gives `'{}'`. Convert explicitly: `JSON.stringify(Object.fromEntries(map))` (string keys only) or `[...map]` as an array of pairs.
- In React state, Maps work but must be replaced rather than mutated (`setMap(new Map(prev).set(k, v))`); Redux recommends plain objects because state must be serialisable for DevTools and persistence.

**WeakMap and Set:**
- **WeakMap**: keys must be objects, held weakly; entries disappear when the key is garbage-collected. Not iterable, no size. Perfect for attaching metadata or caches to objects (DOM nodes, component instances) without leaks.
- **Set**: unique values with O(1) `has`. Great for selected IDs, deduplication (`[...new Set(arr)]`), and visited tracking. Modern engines also support Set methods like `union` and `intersection`.

**My rule of thumb:**
| Use | Choose |
|---|---|
| Fixed fields describing one thing (user, config, props) | Object |
| JSON payloads, Redux state | Object |
| Dynamic keys, frequent add/remove, counting | Map |
| Keys that are objects or non-strings | Map |
| User-provided keys | Map (or Object.create(null)) |
| Metadata attached to objects | WeakMap |
| Unique values / membership | Set |

#### Another worked example: selection state in a table
"A table tracked selected rows in an array and used `selected.includes(id)` for each of 5,000 rows on every render, O(n²). Switching to a `Set` of IDs made each check O(1). For React state we replaced it immutably (`new Set(prev)` then add/delete) so React saw a new reference."

#### A third worked example: prototype pollution
"An app merged query parameters into a settings object with a naive deep merge. A crafted URL with `__proto__[isAdmin]=true` polluted `Object.prototype`, so every object suddenly had `isAdmin === true`. Fixes: use a safe merge that skips `__proto__`, `constructor` and `prototype` keys, validate input with a schema, and store dynamic user-controlled keys in Maps."

#### Variations you might be asked
- "How do you convert between Map and object?": `new Map(Object.entries(obj))` and `Object.fromEntries(map)`.
- "What's SameValueZero?": the equality Maps and Sets use: like `===` but `NaN` equals `NaN`.
- "Object.groupBy vs Map.groupBy?": newer helpers; `Map.groupBy` allows non-string group keys.

#### Step-by-step framework
1. **Key types** and identity semantics.
2. **Prototype pitfalls** and security.
3. **API, size, iteration, ordering.**
4. **Performance characteristics.**
5. **Serialisation and React/Redux constraints.**
6. **WeakMap/Set** and a decision table.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Map is just a fancier object" | Different key semantics and purposes |
| Unaware of prototype collisions | Explains collisions and prototype pollution |
| Ignores ordering differences | Integer-key ordering gotcha |
| Ignores serialisation | JSON and Redux constraints |
| No WeakMap/Set | Uses each for the right job |

#### Useful phrases
- "Objects are for records; Maps are for dictionaries."
- "Object keys are always strings or symbols; Map keys can be anything."
- "User-controlled keys belong in a Map, not an object."
- "A WeakMap lets me attach data to objects without keeping them alive."

#### Common pitfalls
- **Objects as keys in objects.**
- **Prototype pollution** via merges.
- **Mutating Maps in React state.**
- **Using arrays for membership checks** on large data.

#### Follow-ups to expect (with sample answers)
- **"Is Map iteration order guaranteed?"**
  "Yes, insertion order by spec."
- **"When would Object.create(null) be enough?"**
  "For string-keyed dictionaries that must serialise to JSON easily, without prototype collisions."
- **"Can a Map key be NaN?"**
  "Yes, and NaN matches NaN in Maps thanks to SameValueZero."

#### What senior interviewers look for
- **Practical, security-aware judgement.**
- **Understanding of engine performance traits.**
- **Clear decision rules.**

#### Practise it
1. Reproduce the object key collision and the ordering gotcha in a console.
2. Refactor an array-based selection to a Set in React state.
3. Explain your decision table out loud in 60 seconds.

## Explain microtask starvation with an example
- id: 077ffd4f-c879-4045-8e16-f6c8bb3cbe32
- roles: frontend, fullstack, ai
- round: JS_FUNDAMENTALS
- difficulty: hard
- levels:
- tags: event-loop, performance, depth
- companies: Apple

### Prompt
What is microtask starvation? Show an example that freezes the page even though it only uses promises, explain why, and describe how to fix it and how it differs from a long synchronous task.

### Answer
#### What the interviewer is really testing
- Deep understanding that the **microtask queue is drained completely** before rendering or other tasks.
- Recognising that "async" code using promises can still **block the main thread**.
- Knowing the **right way to yield** (new tasks, scheduler APIs, workers).
- Relating it to real issues: **frozen UIs, unresponsive input, INP**, and recursive promise loops.

#### Key points
- After each task, the browser runs microtasks **until the queue is empty**, including microtasks added during that phase.
- If microtasks keep scheduling more microtasks, the queue never empties: **no rendering, no input handling, no timers**. The page freezes: **starvation**.
- Example: a recursive function that calls itself via `Promise.resolve().then(...)` or `queueMicrotask`, or an `async` loop that `await`s already-resolved values.
- It looks asynchronous, but it's effectively **one giant blocking task**.
- Fix: yield with a **task** (`setTimeout`, `MessageChannel`, `scheduler.postTask`, `scheduler.yield()`), process in **time-sliced chunks**, or move work to a **Web Worker**.
- `requestAnimationFrame` loops don't starve the page because each callback runs once per frame.

#### Model answer
"Microtask starvation happens when microtasks keep queuing more microtasks, so the microtask queue never empties. Because the browser must drain the whole queue before it can render or handle the next task, the page freezes, even though the code is written with promises.

**Example that freezes the page:**
```js
let count = 0;
function spin() {
  count++;
  Promise.resolve().then(spin);   // schedules another microtask, forever
}
button.addEventListener('click', spin);
// After clicking: no repaint, clicks and typing ignored, setTimeout callbacks never fire
```
Even with a stop condition, a large loop like this runs to completion before any frame is painted:
```js
async function processAll(items) {
  for (const item of items) {
    await null;          // feels like yielding, but it's a microtask: rendering still can't happen
    heavyWork(item);
  }
}
```
With 100,000 items, the UI is frozen until the loop finishes. Developers are surprised because 'there's an await in the loop'.

**Why:** the event loop order is: run one task, then **drain all microtasks**, then maybe render, then the next task. Microtasks queued while draining are added to the same queue and run in the same drain. So a self-perpetuating microtask chain never lets the loop reach the render step or the next task.

**Comparison with a long synchronous task:**
| | Long synchronous task | Microtask starvation |
|---|---|---|
| Code looks like | A big loop | Promise chains / awaits |
| Blocks rendering and input | Yes | Yes |
| DevTools shows | One long task | One long task made of many microtasks |
| Fix | Chunk + yield, worker | Yield with a task, not a microtask |

**Fixes:**
1. **Yield with a task**, not a microtask:
```js
const yieldToMain = () =>
  'scheduler' in globalThis && 'yield' in scheduler
    ? scheduler.yield()                              // modern: resumes with priority
    : new Promise((resolve) => setTimeout(resolve, 0));

async function processAll(items) {
  let lastYield = performance.now();
  for (const item of items) {
    heavyWork(item);
    if (performance.now() - lastYield > 40) {        // time-slice: yield every ~40 ms
      await yieldToMain();                           // lets the browser render and handle input
      lastYield = performance.now();
    }
  }
}
```
Yielding based on elapsed time (rather than every item) avoids the overhead of thousands of timers and keeps each task under the 50 ms 'long task' threshold.
2. **MessageChannel** for faster task scheduling than setTimeout (no 4 ms clamping for nested timers); React's scheduler historically used this.
3. **Web Workers** for CPU-heavy work, keeping the main thread free.
4. **requestAnimationFrame** for visual loops (animations), which naturally run once per frame.
5. **Fix the recursion**: if a microtask loop is accidental (e.g. a state store notifying subscribers who trigger updates that notify again), break the cycle.

**Where I've seen it in real code:**
- A state library where a subscriber updated the store synchronously inside a promise callback, triggering infinite notification cycles.
- Recursive promise-based polling with no delay (`poll().then(poll)` where `poll` resolves immediately from cache).
- Large async data transformations using `await` on resolved values to 'make them async'."

#### Another worked example: a frozen import screen
"An import tool processed 200,000 CSV rows with `for (const row of rows) { await validate(row); }`. `validate` was synchronous but declared `async`, so each await resolved immediately as a microtask. The progress bar never moved and the browser showed 'Page unresponsive'. Profiling showed one 9-second task. We restructured validation into chunks with `scheduler.yield()` (with a setTimeout fallback) every ~40 ms, updating the progress bar between chunks; later we moved validation into a Web Worker. The page stayed responsive and the progress bar updated smoothly."

#### A third worked example: infinite notification loop
"A custom store notified subscribers via `queueMicrotask`. One subscriber called `store.set()` with a new object every time it was notified, even when the value hadn't changed, triggering another notification. The page froze on a specific screen. Adding an equality check (only notify if the value changed) and avoiding writes inside subscribers fixed it."

#### Variations you might be asked
- "Can setTimeout loops starve the page?": no; each timer callback is a separate task, so rendering and input can happen in between (though too many short tasks can still hurt).
- "How do you detect starvation?": the Performance panel shows a long task full of microtasks (promise callbacks); the Long Animation Frames API can report it in production.
- "Does Node have the same issue?": yes; recursive `process.nextTick` or promise chains can starve I/O.

#### Step-by-step framework
1. **Recall the drain-all-microtasks rule.**
2. **Show a starving example** (recursive promise, await in loop).
3. **Explain why rendering and input stop.**
4. **Compare with long synchronous tasks.**
5. **Fix** with task-based yielding, time slicing, workers, rAF.
6. **Give real examples** and detection methods.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Promises are async so they can't block" | Explains microtask draining blocks rendering |
| Yields with `await null` | Yields with a task or scheduler.yield() |
| Yields every item | Time-sliced yielding |
| No detection approach | Performance panel, long animation frames |
| Theory only | Real import and store examples |

#### Useful phrases
- "The browser can't render until the microtask queue is empty."
- "An await on a resolved promise doesn't give the browser a chance to paint."
- "I yield with a real task, roughly every 40 ms."
- "Heavy CPU work belongs in a Web Worker."

#### Common pitfalls
- **Using microtasks to 'break up' work.**
- **Declaring sync functions async** and assuming they yield.
- **Unbounded recursive promise loops.**
- **Too-frequent yielding** adding overhead.

#### Follow-ups to expect (with sample answers)
- **"Why not yield after every item?"**
  "Each yield has overhead (timer scheduling, clamping); time slicing keeps tasks short without thousands of yields."
- **"What's scheduler.postTask?"**
  "An API to schedule tasks with priorities (user-blocking, user-visible, background), giving finer control than setTimeout."
- **"How does React avoid blocking during large renders?"**
  "Concurrent rendering splits work into units and yields to the browser between them, checking if higher-priority updates arrived."

#### What senior interviewers look for
- **Deep event loop understanding.**
- **Correct yielding strategy.**
- **Production debugging experience.**

#### Practise it
1. Reproduce starvation with the recursive promise example in a test page (with a stop button that won't work).
2. Fix the await-in-loop example with time-sliced yielding.
3. Explain why `await null` doesn't let the browser paint, out loud.

## How this works: call, apply, bind and arrow functions
- id: fe-js-01
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: this, call, apply, bind, arrow functions

### Prompt
Explain how `this` is determined in JavaScript. Cover the four binding rules, how `call`, `apply` and `bind` change it, how arrow functions differ, and predict the output of a few tricky snippets (methods passed as callbacks, nested functions, class methods in event handlers).

### Answer
#### What the interviewer is really testing
- Knowing that `this` is decided **by how a function is called**, not where it's defined (except arrow functions).
- The **binding rules and their precedence**: new, explicit, implicit, default.
- **Losing `this`** when passing methods as callbacks, and the fixes.
- Practical knowledge of **arrow functions, class fields and event handlers** in modern code.

#### Key points
- **Default binding**: plain call `fn()` → `this` is `undefined` in strict mode (modules and classes are strict), or the global object in sloppy mode.
- **Implicit binding**: `obj.method()` → `this` is `obj` (the object before the dot at call time).
- **Explicit binding**: `fn.call(ctx, a, b)`, `fn.apply(ctx, [a, b])`, `fn.bind(ctx)` returns a new permanently bound function.
- **new binding**: `new Fn()` → `this` is the newly created object.
- **Precedence**: new > explicit (bind) > implicit > default.
- **Arrow functions have no own `this`**: they use `this` from the enclosing scope (lexical) and ignore call/apply/bind.
- Common bug: **extracting a method** (`const f = obj.method; f()` or `setTimeout(obj.method)`) loses `this`.
- DOM event listeners set `this` to the element (for regular functions).

#### Model answer
"`this` is a special variable whose value depends on how the function is called. The same function can have different `this` values in different calls. Arrow functions are the exception: they don't have their own `this`; they borrow it from where they were written.

**The four rules:**
```js
'use strict';
function show() { return this; }

// 1. Default binding: plain call
show();                              // undefined (strict mode)

// 2. Implicit binding: called as a method
const obj = { name: 'obj', show };
obj.show();                          // obj

// 3. Explicit binding
show.call({ name: 'a' });            // { name: 'a' }
show.apply({ name: 'b' }, []);       // { name: 'b' } — args as an array
const bound = show.bind({ name: 'c' });
bound();                             // { name: 'c' }
bound.call({ name: 'd' });           // still { name: 'c' } — bind wins over call

// 4. new binding
function User(name) { this.name = name; }
const u = new User('Asha');          // this = the new object
```

**call vs apply vs bind:**
| Method | Calls immediately? | Arguments | Returns |
|---|---|---|---|
| `call(ctx, a, b)` | Yes | Listed individually | Function's result |
| `apply(ctx, [a, b])` | Yes | As an array | Function's result |
| `bind(ctx, a)` | No | Optional preset args (partial application) | New bound function |

`apply` was historically used to spread arrays (`Math.max.apply(null, nums)`); today spread syntax (`Math.max(...nums)`) does that.

**Losing `this`, the most common bug:**
```js
const counter = {
  count: 0,
  increment() { this.count++; },
};
const inc = counter.increment;
inc();                               // TypeError in strict mode: this is undefined

setTimeout(counter.increment, 100);  // same problem: called as a plain function
button.addEventListener('click', counter.increment);   // this = button, not counter
```
Fixes:
```js
setTimeout(() => counter.increment(), 100);            // call it as a method
setTimeout(counter.increment.bind(counter), 100);      // bind
```

**Arrow functions use lexical `this`:**
```js
const team = {
  name: 'Payments',
  members: ['Asha', 'Ben'],
  list() {
    return this.members.map((m) => `${m} (${this.name})`);   // arrow: this = team
  },
  listBroken() {
    return this.members.map(function (m) { return `${m} (${this.name})`; });  // this undefined
  },
};
```
Arrow functions are ideal for callbacks inside methods. But they're wrong as object methods that need the object:
```js
const settings = {
  theme: 'dark',
  getTheme: () => this.theme,        // this = enclosing scope (module: undefined), NOT settings
};
```
And `call`/`apply`/`bind` can't change an arrow function's `this`.

**Classes and event handlers:**
```js
class SearchBox {
  query = '';
  constructor(input) {
    input.addEventListener('input', this.onInput);      // works because onInput is an arrow class field
  }
  onInput = (e) => { this.query = e.target.value; };    // class field arrow: bound to the instance
  onInputMethod(e) { this.query = e.target.value; }     // prototype method: would lose this as a listener
}
```
In old React class components, this was why constructors had `this.handleClick = this.handleClick.bind(this)` or used arrow class fields. Function components and hooks avoid `this` altogether, which is one reason they're simpler.

**Tricky output question:**
```js
const obj = {
  name: 'obj',
  regular() { return this.name; },
  arrow: () => this?.name,
  nested() {
    function inner() { return this?.name; }
    const innerArrow = () => this.name;
    return [inner(), innerArrow()];
  },
};
obj.regular();      // 'obj'
obj.arrow();        // undefined (module scope this)
obj.nested();       // [undefined, 'obj']
const r = obj.regular; r();            // TypeError or undefined depending on strictness
```
"

#### Another worked example: a callback losing context in a library
"A chart wrapper passed `this.handleHover` to a charting library's `onHover` option. The library called it as a plain function, so `this.setState` threw. Using an arrow class field (or binding in the constructor) fixed it. In code review, I look for methods passed as callbacks without binding: it's an easy bug to miss because it only fails when the callback fires."

#### A third worked example: borrowing methods with call
```js
function logArgs() {
  const args = Array.prototype.slice.call(arguments);   // borrow slice for array-like `arguments`
  console.log(args.join(', '));
}
// modern equivalent: Array.from(arguments) or rest parameters (...args)
```
"Method borrowing with `call` was common before rest parameters and `Array.from`; recognising it helps when reading older code."

#### Variations you might be asked
- "What's `this` in a top-level ES module?": `undefined`. In a classic script, it's `window`.
- "What does `new` do step by step?": create an object linked to `Fn.prototype`, call `Fn` with `this` set to it, and return it unless the function returns its own object.
- "Can you bind a function twice?": the first bind wins; binding a bound function again doesn't change `this` (though extra preset args accumulate).

#### Step-by-step framework
1. **State the core idea**: call-site determines `this` (except arrows).
2. **Walk through the four rules** with examples.
3. **Explain precedence.**
4. **Compare call, apply, bind.**
5. **Show the lost-this bug and fixes.**
6. **Arrow functions, classes and event handlers.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "this is the object the function belongs to" | Determined by how it's called |
| Doesn't know arrow function behaviour | Lexical this, can't be rebound |
| Uses arrows as object methods | Knows when arrows are wrong |
| Can't explain lost this | Explains extraction bug and fixes |
| Forgets strict mode default | undefined in strict mode/modules |

#### Useful phrases
- "For regular functions, what matters is the call site."
- "Arrow functions don't have their own this; they use the surrounding one."
- "Passing obj.method as a callback detaches it from obj."
- "bind creates a new function with this permanently set."

#### Common pitfalls
- **Arrow functions as methods.**
- **Unbound methods as callbacks.**
- **Expecting call/apply to work on arrows.**
- **Assuming sloppy-mode global this** in modules.

#### Follow-ups to expect (with sample answers)
- **"Why did React class components need bind?"**
  "Event handlers were passed as callbacks and called without the component as `this`, so methods had to be bound or written as arrow fields."
- **"What's `this` inside a DOM event listener?"**
  "For a regular function, the element the listener is attached to (`event.currentTarget`); for an arrow, the enclosing scope's this."
- **"Is bind expensive?"**
  "It creates a new function; fine normally, but avoid binding inside render loops repeatedly when identity matters."

#### What senior interviewers look for
- **Precise rules** and precedence.
- **Bug recognition** in real code.
- **Modern patterns** (arrows, class fields, hooks).

#### Practise it
1. Predict the output of the tricky snippet, then run it.
2. Write the four binding rules from memory with an example each.
3. Explain the lost-this bug and two fixes, out loud.

## Implement Function.prototype.bind
- id: fe-js-02
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, bind, this, prototypes

### Prompt
Implement `Function.prototype.myBind(context, ...presetArgs)` that behaves like the built-in `bind`: it returns a new function with `this` fixed, supports partial application, and works correctly when the bound function is called with `new`.

### Answer
#### What the interviewer is really testing
- Understanding of **this binding** and closures.
- **Partial application** (preset arguments plus call-time arguments).
- The subtle **`new` behaviour**: a bound function used as a constructor ignores the bound `this`.
- Knowing **prototype chains** so `instanceof` works with bound constructors.

#### Key points
- Return a function that calls the original with `apply(context, [...presetArgs, ...callArgs])`.
- `this` inside `myBind` is the **original function**; validate it's callable.
- **`new` precedence**: if the bound function is called with `new`, `this` should be the new object, not the bound context; detect with `new.target` (or `this instanceof bound`).
- Set the bound function's **prototype** so instances created with `new` are `instanceof` the original.
- Built-in extras: `name` is `"bound fn"`, `length` reduces by the number of preset args (nice to mention).
- Real code: bind is used for event handlers, partial application, and borrowing methods; arrow functions often replace it.

#### Model answer
"bind returns a new function that, whenever it's called, calls the original function with a fixed `this` and some preset arguments.

**Basic version:**
```js
Function.prototype.myBind = function (context, ...presetArgs) {
  const originalFn = this;                      // the function bind was called on
  if (typeof originalFn !== 'function') {
    throw new TypeError('myBind must be called on a function');
  }
  return function (...callArgs) {
    return originalFn.apply(context, [...presetArgs, ...callArgs]);
  };
};

function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}
const greetAsha = greet.myBind({ name: 'Asha' }, 'Hello');
greetAsha('!');                         // 'Hello, Asha!'
```

**Handling `new`.** The spec says that when a bound function is used with `new`, the bound `this` is ignored: `new` creates a fresh object, and preset arguments still apply. The basic version gets this wrong:
```js
function Point(x, y) { this.x = x; this.y = y; }
const BoundPoint = Point.myBind({ ignored: true }, 1);
const p = new BoundPoint(2);
// basic version: p is an empty object and { ignored: true } got x/y set on it — wrong
```

**Full version:**
```js
Function.prototype.myBind = function (context, ...presetArgs) {
  const originalFn = this;
  if (typeof originalFn !== 'function') {
    throw new TypeError('myBind must be called on a function');
  }

  function bound(...callArgs) {
    // If called with `new`, `new.target` is defined: use the new object as `this`
    const isNew = new.target !== undefined;
    return originalFn.apply(isNew ? this : context, [...presetArgs, ...callArgs]);
  }

  // So `new bound()` instances inherit from originalFn.prototype (instanceof works)
  if (originalFn.prototype) {
    bound.prototype = Object.create(originalFn.prototype);
  }
  return bound;
};

const BoundPoint2 = Point.myBind({ ignored: true }, 1);
const p2 = new BoundPoint2(2);
p2;                        // { x: 1, y: 2 }
p2 instanceof Point;       // true
```

**Details worth mentioning:**
- `new.target` is undefined in normal calls and set when called with `new`. Older polyfills used `this instanceof bound` instead.
- If the constructor returns its own object, `apply` returns it; when calling with `new`, JavaScript uses that returned object, matching normal constructor behaviour.
- Arrow functions have no prototype and can't be used with `new`, so the `if (originalFn.prototype)` guard avoids errors.
- The built-in also sets `name` (`'bound greet'`) and `length` (original length minus preset args, minimum 0). I could add these with `Object.defineProperty` if asked.

**Why bind still matters:** passing class methods as callbacks (`button.addEventListener('click', this.onClick.bind(this))`), partial application (`const logError = log.bind(null, 'error')`), and preserving context in libraries. In modern code, arrow functions and class field arrows often replace it, but understanding bind helps with legacy code and interviews."

#### Another worked example: partial application with bind
```js
function request(method, url, body) { return fetch(url, { method, body: JSON.stringify(body) }); }
const post = request.bind(null, 'POST');
post('/api/orders', { item: 'book' });
```
"`null` as context because `request` doesn't use `this`; bind is purely presetting the first argument."

#### A third worked example: removing a bound listener
"A component added `window.addEventListener('resize', this.onResize.bind(this))` and later tried `removeEventListener('resize', this.onResize.bind(this))`. Each bind creates a new function, so removal silently failed and the listener leaked. Storing the bound function once (`this.boundResize = this.onResize.bind(this)`) or using an AbortController signal fixed it."

#### Variations you might be asked
- "Implement call and apply": temporarily attach the function to the context object under a unique Symbol key, call it as a method, delete the key, return the result.
- "What happens if you bind a bound function?": the original binding of `this` wins; preset args accumulate.
- "Implement bind without using apply or call": use the Symbol method-attachment trick.

#### Step-by-step framework
1. **Clarify** behaviour: this, preset args, new.
2. **Capture the original function** via `this`.
3. **Return a closure** combining preset and call args.
4. **Handle new** with `new.target` and prototype linkage.
5. **Test** normal calls, partial application, new and instanceof.
6. **Mention name/length** and real uses.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Ignores preset args | Supports partial application |
| Breaks with new | Uses new.target, ignores bound this |
| instanceof fails | Links prototype |
| No validation | Throws if not called on a function |
| No real-world context | Event listeners, partial application, removal bug |

#### Useful phrases
- "Inside myBind, `this` is the function we're binding."
- "When called with new, the bound this is ignored."
- "I link the prototype so instanceof still works."
- "Each bind call creates a new function, which matters for removeEventListener."

#### Common pitfalls
- **Forgetting `new` semantics.**
- **Arrow function inside that captures the wrong `this`** for the new check.
- **Assuming bind returns the same function each time.**
- **Modifying built-in prototypes** in app code.

#### Follow-ups to expect (with sample answers)
- **"What's new.target?"**
  "A meta-property that's the constructor called with `new`, or undefined for normal calls."
- **"How would you implement call?"**
  "`ctx = ctx ?? globalThis; const key = Symbol(); ctx[key] = this; const r = ctx[key](...args); delete ctx[key]; return r;`"
- **"Why do bound functions have no prototype by default?"**
  "Built-in bound functions don't have a `prototype` property; `new` uses the target function's prototype instead. My polyfill approximates that by linking to it."

#### What senior interviewers look for
- **Spec awareness** (new precedence).
- **Clean closure-based code.**
- **Practical gotchas** like listener removal.

#### Practise it
1. Implement myBind with new support from memory and test instanceof.
2. Implement myCall using the Symbol trick.
3. Explain why removeEventListener fails with bind inline, out loud.

## Prototypes, prototypal inheritance and classes
- id: fe-js-03
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: prototypes, inheritance, classes, OOP

### Prompt
Explain how prototypes work in JavaScript. How does property lookup follow the prototype chain, how do ES6 classes relate to prototypes, and what's the difference between `__proto__`, `prototype` and `Object.getPrototypeOf`? When would you use composition over inheritance?

### Answer
#### What the interviewer is really testing
- A correct model of the **prototype chain** and property lookup.
- Understanding that **classes are syntax over prototypes**.
- Distinguishing **`prototype` (on constructors) from an object's internal `[[Prototype]]`**.
- Design judgement: **composition vs inheritance**, and where prototypes matter in frontend code.

#### Key points
- Every object has an internal **`[[Prototype]]`** link (another object or null). Accessing a missing property looks it up along this **chain**.
- **`Fn.prototype`** is the object that becomes the `[[Prototype]]` of instances created with `new Fn()`.
- **`Object.getPrototypeOf(obj)`** / `Object.setPrototypeOf` are the standard accessors; `__proto__` is a legacy accessor.
- **Methods live on the prototype** and are shared by all instances (memory-efficient); data lives on instances.
- **Classes** create constructor functions and prototype methods, plus features like `extends`/`super`, private fields (`#x`), static members, and class fields.
- **`Object.create(proto)`** creates an object with a given prototype; `Object.create(null)` creates one with no prototype.
- **Shadowing**: assigning a property on an instance hides the prototype's property; it doesn't change the prototype.
- Prefer **composition** (combining small behaviours) over deep inheritance hierarchies; React favours composition explicitly.

#### Model answer
"JavaScript objects inherit from other objects directly. Every object has a hidden link to another object, its prototype. When you read a property that isn't on the object, JavaScript looks at its prototype, then the prototype's prototype, until it finds it or reaches `null`.

**Prototype chain in action:**
```js
const animal = { eats: true, describe() { return `I eat: ${this.eats}`; } };
const dog = Object.create(animal);       // dog's prototype is animal
dog.barks = true;

dog.barks;            // true  (own property)
dog.eats;             // true  (found on animal)
dog.describe();       // 'I eat: true' — `this` is dog, method found on animal
dog.toString;         // found on Object.prototype
Object.getPrototypeOf(dog) === animal;              // true
Object.getPrototypeOf(animal) === Object.prototype; // true
Object.getPrototypeOf(Object.prototype);            // null — end of the chain
```

**Constructor functions and `prototype`:**
```js
function User(name) { this.name = name; }          // data on each instance
User.prototype.greet = function () {               // method shared by all instances
  return `Hi, I'm ${this.name}`;
};
const a = new User('Asha'), b = new User('Ben');
a.greet === b.greet;                               // true — one shared function
Object.getPrototypeOf(a) === User.prototype;       // true
```
`new User()` creates an object whose `[[Prototype]]` is `User.prototype`, runs `User` with `this` set to it, and returns it.

**The confusing names:**
| Term | What it is |
|---|---|
| `[[Prototype]]` | Internal link every object has |
| `Object.getPrototypeOf(obj)` | Standard way to read that link |
| `obj.__proto__` | Legacy getter/setter for the same link (avoid) |
| `Fn.prototype` | Property on functions: becomes instances' `[[Prototype]]` with `new` |

**Classes are syntax over the same mechanism:**
```js
class Animal {
  #id = crypto.randomUUID();           // private field (per instance)
  static count = 0;                    // on the constructor
  constructor(name) { this.name = name; Animal.count++; }
  speak() { return `${this.name} makes a sound`; }   // on Animal.prototype
}
class Dog extends Animal {
  speak() { return `${super.speak()} — woof`; }      // super uses the prototype chain
}
const d = new Dog('Rex');
Object.getPrototypeOf(Dog.prototype) === Animal.prototype;   // true
typeof Dog;                                                   // 'function'
```
Differences from hand-written constructors: class bodies are strict mode, classes must be called with `new`, methods are non-enumerable, and classes are in the temporal dead zone until declared.

**Shadowing and mutation:**
```js
const proto = { tags: [] , role: 'user' };
const x = Object.create(proto), y = Object.create(proto);
x.role = 'admin';          // shadows: creates own property on x
y.role;                    // 'user'
x.tags.push('vip');        // mutates the SHARED array on proto
y.tags;                    // ['vip'] — a classic bug: never put mutable data on prototypes
```

**Where prototypes matter in frontend work:**
- Understanding **built-ins**: array methods live on `Array.prototype`, which is why polyfills add to it and why `for...in` can show inherited enumerable properties.
- **Prototype pollution** security bugs: writing `__proto__` keys from untrusted input can modify `Object.prototype` for the whole app.
- Reading library code and **class-based APIs** (Web Components extend `HTMLElement`, error subclasses extend `Error`).
- **Performance**: shared methods on prototypes vs per-instance arrow functions (arrow class fields create one function per instance).

**Composition over inheritance.** Deep hierarchies (`BaseComponent → FormComponent → ValidatedFormComponent`) become rigid: changes ripple, and you inherit things you don't need. Composition combines small pieces:
```js
const withLogging = (obj) => ({ ...obj, log: (m) => console.log(`[${obj.name}] ${m}`) });
const withValidation = (obj, rules) => ({ ...obj, validate: (v) => rules.every((r) => r(v)) });
```
React explicitly favours composition (children, props, hooks) over component inheritance; custom hooks are composition of behaviour. I use inheritance sparingly, mainly for shallow, true 'is-a' relationships like custom Error types."

#### Another worked example: custom error classes
```js
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
try { throw new ApiError(404, 'Order not found'); }
catch (e) { if (e instanceof ApiError && e.status === 404) showNotFound(); }
```
"Extending Error is one of the few inheritance uses I'd recommend: `instanceof` checks make error handling clear, and the stack trace is preserved."

#### A third worked example: a shared mutable default bug
"A legacy widget library defined `Widget.prototype.options = {}` as defaults. Each instance's `this.options.color = 'red'` mutated the shared object, so changing one widget's colour changed all of them. The fix was to create options per instance in the constructor (`this.options = { ...defaults, ...userOptions }`)."

#### Variations you might be asked
- "Implement `instanceof`": walk `Object.getPrototypeOf(obj)` up the chain comparing with `Ctor.prototype`.
- "Implement `Object.create`": a temporary constructor whose prototype is the given object.
- "What does `hasOwnProperty`/`Object.hasOwn` do?": checks own properties only, excluding the chain.

#### Step-by-step framework
1. **Explain [[Prototype]] and lookup.**
2. **Constructor functions and `prototype`.**
3. **Clarify terminology.**
4. **Classes as syntax**, with extends/super/private fields.
5. **Shadowing and shared-mutable pitfalls.**
6. **Composition vs inheritance** and frontend relevance.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "JS has classes like Java" | Classes are syntax over prototypes |
| Confuses prototype and __proto__ | Clear terminology table |
| Doesn't know lookup order | Explains chain to null |
| Mutable data on prototypes | Knows the shared-state bug |
| Deep inheritance | Composition, hooks, shallow hierarchies |

#### Useful phrases
- "Objects inherit directly from other objects through the prototype chain."
- "Fn.prototype becomes the prototype of instances created with new."
- "Methods on the prototype are shared; data belongs on instances."
- "React prefers composition: props, children and hooks instead of inheritance."

#### Common pitfalls
- **Shared mutable data on prototypes.**
- **Using `__proto__` in code.**
- **Deep class hierarchies.**
- **Forgetting `super()`** in derived constructors.

#### Follow-ups to expect (with sample answers)
- **"What happens if you modify Array.prototype?"**
  "Every array gets the change, which can break libraries and future standards; avoid it outside polyfills."
- **"Why are arrow class fields memory-heavier?"**
  "Each instance gets its own function, while prototype methods are shared."
- **"How does for...in interact with prototypes?"**
  "It iterates enumerable inherited properties too; use Object.keys or for...of over entries."

#### What senior interviewers look for
- **Accurate mental model.**
- **Security and bug awareness** (pollution, shared state).
- **Design judgement.**

#### Practise it
1. Implement `myInstanceOf` and `myObjectCreate`.
2. Draw the prototype chain for a `Dog extends Animal` instance.
3. Explain composition over inheritance with a React example, out loud.

## Equality, type coercion and truthiness
- id: fe-js-04
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: easy
- levels:
- tags: coercion, equality, truthiness, types

### Prompt
Explain the difference between `==` and `===`, how type coercion works, and which values are falsy. Predict the results of some classic tricky comparisons, and explain `Object.is`, `??` vs `||`, and how these show up as real bugs.

### Answer
#### What the interviewer is really testing
- Knowing **strict vs loose equality** and when coercion happens.
- The **falsy values** list and truthiness pitfalls.
- **Nullish coalescing** vs logical OR, optional chaining.
- Applying this to **real bugs**: `0` treated as missing, string/number concatenation, NaN checks, form inputs as strings.

#### Key points
- **`===`** compares without type conversion; **`==`** converts types first using complex rules.
- **Falsy values**: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN`. Everything else is truthy, including `'0'`, `'false'`, `[]` and `{}`.
- `null == undefined` is true; neither equals anything else with `==`. This is the one widely accepted use of `==` (`x == null` checks both).
- **`NaN !== NaN`**; use `Number.isNaN` (not global `isNaN`, which coerces).
- **`Object.is`** is like `===` except `Object.is(NaN, NaN)` is true and `Object.is(0, -0)` is false; React uses it to compare state.
- **`+`** with a string concatenates; other arithmetic operators convert to numbers.
- **`??`** falls back only on `null`/`undefined`; **`||`** falls back on any falsy value (bug-prone for `0` and `''`).
- Form input values are **strings**; convert explicitly.

#### Model answer
"`===` checks that both the value and the type are the same. `==` first tries to convert both sides to a common type, following rules that produce surprising results. I use `===` everywhere, with one common exception: `x == null` to check for both null and undefined.

**Classic comparisons:**
```js
0 == ''            // true  ('' → 0)
0 == '0'           // true  ('0' → 0)
'' == '0'          // false (both strings, different)
false == '0'       // true  (false → 0, '0' → 0)
null == undefined  // true  (special rule)
null == 0          // false (null only loosely equals undefined)
NaN == NaN         // false (NaN is never equal to anything)
[] == false        // true  ([] → '' → 0, false → 0)
[] == ![]          // true  (![] is false, then as above)
[1] == 1           // true  ([1] → '1' → 1)
{} === {}          // false (different objects; compares references)
```
The rules (simplified): if types differ, booleans become numbers, strings become numbers when compared with numbers, and objects become primitives via `valueOf`/`toString`. That inconsistency (non-transitive equality: `0 == ''` and `0 == '0'` but `'' != '0'`) is why `===` is the default.

**Truthiness:**
```js
if ([]) {}           // runs: empty array is truthy
if ('0') {}          // runs: non-empty string
if ({}) {}           // runs
if (0) {}            // doesn't run
if (NaN) {}          // doesn't run
```
Falsy list: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN`.

**`||` vs `??`, a frequent real bug:**
```js
function setVolume(options) {
  const volume = options.volume || 50;   // bug: volume 0 becomes 50
  const volume2 = options.volume ?? 50;  // correct: only null/undefined fall back
}
const label = props.label || 'Untitled'; // '' becomes 'Untitled' — maybe intended, maybe not
```
And optional chaining avoids errors on missing paths: `user?.address?.city ?? 'Unknown'`.

**React rendering gotcha:**
```jsx
{items.length && <List items={items} />}   // renders "0" when items is empty
{items.length > 0 && <List items={items} />}   // correct
```
Because `0 && x` evaluates to `0`, and React renders numbers.

**Arithmetic coercion:**
```js
'5' + 3       // '53'  (+ with a string concatenates)
'5' - 3       // 2     (- converts to numbers)
'5' * '2'     // 10
1 + true      // 2
[] + {}       // '[object Object]'
+''           // 0
+'12px'       // NaN
```
Form values are strings, so `quantityInput.value + 1` gives `'21'` instead of `3`. Convert explicitly: `Number(value)` (strict, `''` → 0, `'12px'` → NaN) or `parseInt(value, 10)` (parses leading digits: `'12px'` → 12). I prefer `Number()` plus validation, or `valueAsNumber` on number inputs.

**NaN and Object.is:**
```js
Number.isNaN(NaN)       // true
Number.isNaN('hello')   // false (no coercion)
isNaN('hello')          // true  (coerces 'hello' to NaN — misleading)
Object.is(NaN, NaN)     // true
Object.is(0, -0)        // false
```
React uses `Object.is` to decide whether state changed: `setCount(NaN)` twice won't re-render, and mutating an object then setting it again won't re-render because the reference is the same.

**TypeScript** removes many of these bugs at compile time (it flags comparing a string with a number), but runtime data from APIs and forms still needs explicit parsing and validation (e.g. with Zod)."

#### Another worked example: a price filter bug
"A filter's minimum price defaulted with `minPrice || 10`. Users who set the minimum to 0 still saw it treated as 10, hiding free items. Switching to `minPrice ?? 10` fixed it. Code reviews where I see `||` used for defaults on numbers prompt a question: can this legitimately be 0?"

#### A third worked example: string concatenation in a cart
"A cart total showed '£2010' instead of '£30' because quantities from inputs (strings) were added: `'20' + '10'`. Parsing input values with `Number()` at the boundary, validating them, and typing them as numbers in state fixed it."

#### Variations you might be asked
- "When is == acceptable?": `value == null` for 'null or undefined'; otherwise avoid.
- "What's `typeof null`?": `'object'`, a historical bug; check `value === null` explicitly.
- "How do you compare objects by value?": deep equality (a library or custom `deepEqual`), or compare stable serialisations for simple data.

#### Step-by-step framework
1. **Define === vs ==.**
2. **Walk through tricky comparisons** and the rule behind them.
3. **List falsy values.**
4. **Explain ?? vs || and optional chaining.**
5. **Cover arithmetic coercion and NaN.**
6. **Connect to real bugs** (forms, React rendering, defaults).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "== checks value, === checks type" | Explains coercion rules and why they're surprising |
| Incomplete falsy list | Full list including -0, 0n, NaN |
| Uses `||` for numeric defaults | Uses `??` |
| Global isNaN | Number.isNaN, Object.is |
| No real bugs | Forms, React `0 &&`, price filter |

#### Useful phrases
- "I default to === and only use == null to check null or undefined."
- "`??` only falls back on null or undefined; `||` falls back on any falsy value."
- "Input values are strings, so I parse at the boundary."
- "React compares state with Object.is."

#### Common pitfalls
- **`count && <Component />`** rendering 0.
- **`||` for defaults** that can be 0 or ''.
- **String concatenation** of input values.
- **Global `isNaN`.**

#### Follow-ups to expect (with sample answers)
- **"Is `'false'` truthy?"**
  "Yes, any non-empty string is truthy."
- **"What's -0 and why does it matter?"**
  "A negative zero from operations like `-1 * 0`; `0 === -0` is true but Object.is distinguishes them, and `1 / -0` is -Infinity."
- **"Why doesn't [] == [] return true?"**
  "Both are objects; equality compares references, and they're different objects."

#### What senior interviewers look for
- **Precise knowledge** without memorising every edge case.
- **Defensive habits** (===, ??, parsing).
- **Real bug recognition.**

#### Practise it
1. Predict all the comparisons above, then check in a console.
2. Find `||` defaults in a codebase and decide which should be `??`.
3. Explain ?? vs || with the volume example, out loud.

## Generators, iterators and async iterators
- id: fe-js-05
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: generators, iterators, async iterators, streaming

### Prompt
Explain the iterator protocol, generators (`function*`, `yield`) and async iterators (`for await...of`). Make a custom object iterable, write a lazy generator, and show a practical frontend use such as reading a streaming response.

### Answer
#### What the interviewer is really testing
- Understanding the **iterable and iterator protocols** (`Symbol.iterator`, `next()`).
- How **generators pause and resume** and produce values lazily.
- **Async iteration** for streams and paginated data.
- Recognising **practical uses**: streaming fetch responses (AI chat), pagination, lazy sequences, Redux-Saga.

#### Key points
- An **iterator** is an object with `next()` returning `{ value, done }`.
- An **iterable** has a `[Symbol.iterator]()` method returning an iterator; arrays, strings, Maps, Sets, NodeLists are iterable. `for...of`, spread, destructuring and `Array.from` use this protocol.
- A **generator function** (`function*`) returns a generator object (both iterator and iterable); `yield` pauses execution and produces a value; calling `next()` resumes.
- Generators are **lazy**: values are computed on demand, enabling infinite sequences.
- `return()` on an iterator lets consumers stop early (e.g. `break` in `for...of`), triggering `finally` blocks for cleanup.
- **Async iterators** use `Symbol.asyncIterator` and `next()` returning promises; consumed with `for await...of`. `async function*` creates async generators.
- Practical uses: **streaming responses**, paginated API fetching, processing large data incrementally, custom collections.

#### Model answer
"Iterators are a standard way for something to hand out values one at a time. Generators are an easy way to write iterators: a function that can pause at each `yield` and continue later.

**The iterator protocol:**
```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let current = this.from, last = this.to;
    return {
      next: () => (current <= last ? { value: current++, done: false } : { value: undefined, done: true }),
    };
  },
};
for (const n of range) console.log(n);   // 1, 2, 3
[...range];                              // [1, 2, 3]
```

**The same with a generator:**
```js
const range2 = {
  from: 1, to: 3,
  *[Symbol.iterator]() {
    for (let i = this.from; i <= this.to; i++) yield i;
  },
};
```

**How generators pause:**
```js
function* steps() {
  console.log('start');
  const answer = yield 'first';       // pauses here; next(value) resumes with that value
  console.log('received', answer);
  yield 'second';
  return 'done';
}
const g = steps();
g.next();          // logs 'start' → { value: 'first', done: false }
g.next(42);        // logs 'received 42' → { value: 'second', done: false }
g.next();          // { value: 'done', done: true }
```
Nothing runs until the first `next()`. Each `next()` runs until the next `yield`.

**Laziness and infinite sequences:**
```js
function* naturals() { let n = 1; while (true) yield n++; }
function* take(iter, count) { for (const x of iter) { if (count-- <= 0) return; yield x; } }
function* map(iter, fn) { for (const x of iter) yield fn(x); }

[...take(map(naturals(), (n) => n * n), 5)];   // [1, 4, 9, 16, 25]
```
Only five squares are ever computed, even though `naturals` is infinite. This is useful for processing large datasets without building intermediate arrays (newer engines also have iterator helpers like `.map()` and `.take()` on iterators).

**Early exit and cleanup:**
```js
function* readLines() {
  try { yield 'line 1'; yield 'line 2'; yield 'line 3'; }
  finally { console.log('cleanup');  }   // runs on break/return/throw by the consumer
}
for (const line of readLines()) { if (line === 'line 2') break; }   // logs 'cleanup'
```

**Async iterators: streaming in the frontend.** The most practical use today is reading streaming responses, such as tokens from an AI model:
```js
async function* streamText(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();                 // cleanup if the consumer stops early
  }
}

const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ prompt }), signal });
for await (const chunk of streamText(res)) {
  appendToMessage(chunk);                 // update the UI as text arrives
}
```
In modern browsers `ReadableStream` is itself async iterable in some environments, so `for await (const chunk of res.body)` works where supported.

**Paginated APIs as an async generator:**
```js
async function* fetchAllOrders() {
  let cursor = null;
  do {
    const res = await fetch(`/api/orders?cursor=${cursor ?? ''}`);
    const page = await res.json();
    yield* page.items;                    // yield each item from this page
    cursor = page.nextCursor;
  } while (cursor);
}
for await (const order of fetchAllOrders()) {
  if (order.total > 1000) { flag(order); break; }   // stops fetching further pages
}
```
The consumer doesn't care about pages, and breaking early stops further requests.

**Other places you'll meet generators:** Redux-Saga uses generators for side effects; some animation and parsing libraries use them for step-by-step computation; and transpilers historically implemented async/await on top of generators."

#### Another worked example: chunked processing with a generator
"To render a 50,000-row CSV preview without freezing the page, we wrote `function* parseRows(text)` that yields one parsed row at a time, and a loop that consumed rows in batches of 500, yielding to the main thread between batches. Memory stayed low because we never built a 50,000-element intermediate array, and the UI stayed responsive."

#### A third worked example: a custom iterable collection
```js
class Playlist {
  #songs = [];
  add(song) { this.#songs.push(song); return this; }
  *[Symbol.iterator]() { yield* this.#songs; }
  *shuffled() {
    const copy = [...this.#songs];
    while (copy.length) yield copy.splice(Math.floor(Math.random() * copy.length), 1)[0];
  }
}
const p = new Playlist().add('A').add('B').add('C');
[...p];             // ['A', 'B', 'C']
[...p.shuffled()];  // random order
```
"Making a class iterable lets it work with for...of, spread and destructuring while keeping its internals private."

#### Variations you might be asked
- "What's the difference between `yield` and `yield*`?": `yield*` delegates to another iterable, yielding each of its values.
- "Implement a generator-based async runner (co)": call `next` with resolved values and `throw` with rejections.
- "Are generators slow?": slightly slower than plain loops, irrelevant for most UI code; useful for clarity and laziness.

#### Step-by-step framework
1. **Explain the protocols** (iterable, iterator, next/done).
2. **Implement a custom iterable** manually.
3. **Rewrite with a generator** and explain pausing.
4. **Show laziness** with infinite sequences.
5. **Cover cleanup** (return/finally).
6. **Async iterators** for streaming and pagination.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Generators are like async functions" | Explains pause/resume and the protocol |
| Can't make an object iterable | Implements Symbol.iterator |
| No laziness explanation | Infinite sequences with take/map |
| Ignores cleanup | finally runs on early exit |
| No frontend use | Streaming fetch, pagination |

#### Useful phrases
- "Anything with Symbol.iterator works with for...of and spread."
- "A generator runs until the next yield, then pauses."
- "Generators compute values lazily, only when asked."
- "for await...of is a clean way to consume streaming responses."

#### Common pitfalls
- **Forgetting the generator doesn't start until next().**
- **Building huge arrays** instead of iterating lazily.
- **Not releasing stream readers** on early exit.
- **Using for...in** (keys) instead of for...of (values).

#### Follow-ups to expect (with sample answers)
- **"Is a generator object reusable?"**
  "No, once exhausted it stays done; call the generator function again for a new one."
- **"How do you cancel a streaming response?"**
  "Abort the fetch with an AbortController, or break out of the loop so the iterator's return/finally releases the reader."
- **"How does Redux-Saga use generators?"**
  "Sagas yield effect descriptions (call, put, take); the middleware runs them and resumes the generator with results, making async flows testable."

#### What senior interviewers look for
- **Protocol-level understanding.**
- **Practical streaming knowledge.**
- **Clean, lazy data processing.**

#### Practise it
1. Implement `range` manually and with a generator.
2. Write `streamText` and use it with a streaming endpoint.
3. Explain lazy evaluation with the naturals/take example, out loud.

## ES modules vs CommonJS, and how bundlers use them
- id: fe-js-06
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: modules, ESM, CommonJS, bundlers, tree shaking

### Prompt
Compare ES modules (`import`/`export`) and CommonJS (`require`/`module.exports`). Cover static vs dynamic structure, live bindings, loading behaviour, interop problems, how bundlers use ESM for tree shaking and code splitting, and how you'd publish a library today.

### Answer
#### What the interviewer is really testing
- Understanding the **semantic differences** between module systems, not just syntax.
- Why **static ESM structure enables tree shaking** and better tooling.
- **Dynamic `import()`** for code splitting and lazy loading.
- Practical **interop headaches** (default exports, `"type": "module"`, dual packages) and modern tooling choices.

#### Key points
- **ESM**: `import`/`export`, the JavaScript standard, supported natively in browsers (`<script type="module">`) and Node. Imports are **static** (top-level, analysable before running), **hoisted**, and create **live bindings** (read-only views of the exporter's variables). Loaded **asynchronously**; supports **top-level await**. Module scope is strict by default.
- **CommonJS**: `require()`/`module.exports`, Node's original system. **Dynamic** (require can be called anywhere with computed paths), **synchronous**, exports a **copy of the value** at the time (for primitives).
- **Tree shaking** relies on static ESM imports/exports so bundlers can drop unused exports; it's limited with CommonJS and with **side effects** (mark packages with `"sideEffects": false`).
- **Dynamic `import()`** returns a promise and creates split points for **code splitting** (React.lazy, route-based splitting).
- Interop: importing CJS from ESM gives the whole `module.exports` as default; requiring ESM from CJS historically required dynamic import (newer Node versions allow `require` of synchronous ESM).
- Libraries today: publish **ESM** (often dual ESM + CJS via `exports` map), with type definitions.

#### Model answer
"Both let you split code into files and share functions between them, but they behave differently in ways that matter for performance and tooling.

**Syntax:**
```js
// ESM
export const formatPrice = (n) => `£${n.toFixed(2)}`;
export default function Cart() {}
import Cart, { formatPrice } from './cart.js';
import * as utils from './utils.js';

// CommonJS
const formatPrice = (n) => `£${n.toFixed(2)}`;
module.exports = { formatPrice };
const { formatPrice } = require('./cart');
```

**Key semantic differences:**
| | ES modules | CommonJS |
|---|---|---|
| Standard | Yes (browsers and Node) | Node convention |
| Structure | Static: imports/exports at top level | Dynamic: `require` anywhere, computed paths |
| Loading | Async; dependency graph resolved before execution | Sync, on demand at `require()` |
| Bindings | Live, read-only | Copy of the exported value |
| Top-level await | Supported | No |
| `this` at top level | `undefined` | `module.exports` |
| Tree shaking | Reliable | Limited |

**Live bindings example:**
```js
// counter.mjs
export let count = 0;
export function increment() { count++; }

// main.mjs
import { count, increment } from './counter.mjs';
increment();
console.log(count);   // 1 — live view of the exporter's variable
// count = 5;         // TypeError: imports are read-only
```
With CommonJS, `const { count } = require('./counter')` copies the number 0 at import time, so it stays 0.

**Why static structure matters: tree shaking.** Because ESM imports and exports are fixed and analysable without running code, bundlers (Vite/Rollup, webpack, esbuild) can see which exports are actually used and remove the rest:
```js
import { debounce } from 'lodash-es';   // only debounce ends up in the bundle
import _ from 'lodash';                 // CommonJS build: the whole library (~70 KB)
```
Tree shaking also needs **side-effect-free** modules: if importing a file runs code (registering globals, polyfills, CSS imports), the bundler must keep it. Packages declare `"sideEffects": false` (or list files with side effects) in `package.json` so bundlers can safely drop unused files.

**Dynamic import and code splitting:**
```js
// load a heavy feature only when needed
button.addEventListener('click', async () => {
  const { openChartEditor } = await import('./chart-editor.js');   // separate chunk
  openChartEditor();
});

// React route-based splitting
const Settings = React.lazy(() => import('./pages/Settings'));
```
Bundlers treat each `import()` as a split point, producing separate chunks loaded on demand, reducing the initial bundle.

**Interop pain points I've hit:**
- `"type": "module"` in package.json makes `.js` files ESM in Node; otherwise `.mjs` for ESM and `.cjs` for CommonJS.
- Default export confusion: importing a CJS module from ESM gives `module.exports` as the default, so named imports may or may not work depending on the tool's static analysis; you'll see `import pkg from 'x'; const { thing } = pkg;` workarounds.
- `__dirname`/`require` don't exist in ESM; use `import.meta.url` and `import.meta.dirname` (newer Node).
- Jest historically needed transforms for ESM; Vitest handles ESM natively, one reason teams switched.
- Dual-package hazard: if both ESM and CJS copies of a library load, you can get two instances (e.g. two React copies breaking hooks).

**Publishing a library today:**
```json
{
  "name": "my-ui-lib",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" }
  },
  "sideEffects": ["*.css"],
  "files": ["dist"]
}
```
ESM first, a CJS build if consumers still need it, an `exports` map to control entry points, type definitions, and accurate `sideEffects`. Tools like tsup or Vite library mode make this straightforward.

**In the browser:** native ESM works with `<script type="module">`, and import maps can map bare specifiers to URLs. Vite uses native ESM in development (no bundling, fast startup) and Rollup to bundle for production, because many small module requests are still slower than optimised chunks over the network."

#### Another worked example: shrinking a bundle with ESM imports
"A bundle analysis showed the whole of lodash (70 KB), moment.js with all locales (230 KB) and an icon library's entire set (500+ icons). We switched to `lodash-es` named imports, replaced moment with `date-fns` (tree-shakable ESM functions), and imported icons individually. The main bundle dropped from 1.1 MB to 420 KB, and LCP improved by about 0.8 s on mid-range phones."

#### A third worked example: breaking a circular dependency
"A Vite app threw 'Cannot access X before initialization' at startup. `store.js` imported `api.js`, which imported `store.js` to read the auth token. With ESM live bindings and hoisting, one module evaluated before the other's exports were initialised. We broke the cycle by passing the token getter into the API client instead of importing the store, and added a lint rule (`import/no-cycle`)."

#### Variations you might be asked
- "What's the difference between `export default` and named exports?": one default per module vs many named; named exports are clearer for tree shaking, auto-imports and refactoring, so many teams prefer them.
- "What is an import map?": a browser feature mapping bare specifiers like `'react'` to URLs, enabling ESM without a bundler.
- "Why does `require` work in some ESM bundles?": bundlers convert CommonJS to ESM-compatible code during build, with varying success.

#### Step-by-step framework
1. **Compare syntax and semantics** in a table.
2. **Explain live bindings vs copies.**
3. **Static structure → tree shaking**, plus side effects.
4. **Dynamic import → code splitting.**
5. **Interop problems** and Node settings.
6. **Library publishing and browser-native ESM.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Just different syntax" | Static vs dynamic, live bindings, async loading |
| Doesn't know why tree shaking needs ESM | Explains static analysis and sideEffects |
| No code splitting | Dynamic import and React.lazy |
| Unaware of interop issues | type: module, default export confusion, dual packages |
| No publishing knowledge | exports map, types, ESM-first |

#### Useful phrases
- "ESM's static structure is what lets bundlers tree shake."
- "Imports are live, read-only bindings, not copies."
- "Every dynamic import becomes a separate chunk."
- "sideEffects false tells the bundler unused files are safe to drop."

#### Common pitfalls
- **Importing whole CommonJS libraries.**
- **Side-effectful modules** defeating tree shaking.
- **Circular imports.**
- **Mixed module formats** causing duplicate library instances.

#### Follow-ups to expect (with sample answers)
- **"Does tree shaking work with `import * as utils`?"**
  "Usually yes, if the bundler can see which properties are accessed statically; dynamic access like `utils[name]` defeats it."
- **"Why does Vite not bundle in development?"**
  "Serving native ESM lets the browser request only modules it needs, so startup is fast; esbuild pre-bundles dependencies."
- **"What's top-level await useful for?"**
  "Loading config or initialising a WASM module before the module's exports are used; note it delays dependent modules."

#### What senior interviewers look for
- **Deep module semantics.**
- **Performance impact** via bundling.
- **Practical tooling experience.**

#### Practise it
1. Demonstrate live bindings vs CJS copies with two small files.
2. Run a bundle analyser on a project and find one tree-shaking opportunity.
3. Explain why ESM enables tree shaking, out loud, in 60 seconds.

## Memory management and memory leaks in JavaScript
- id: fe-js-07
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: memory, garbage collection, leaks, performance

### Prompt
How does memory management work in JavaScript? Explain garbage collection and reachability, list the common causes of memory leaks in frontend apps, and describe how you'd find and fix a leak using browser DevTools.

### Answer
#### What the interviewer is really testing
- Understanding **reachability-based garbage collection** (mark-and-sweep).
- Recognising the **common leak patterns** in SPAs.
- A practical **DevTools workflow** (heap snapshots, allocation timelines, detached nodes).
- **Prevention habits**: cleanup in effects, bounded caches, weak references.

#### Key points
- JavaScript allocates memory automatically; the **garbage collector frees objects that are no longer reachable** from roots (globals, the current call stack, active closures).
- Modern engines use **mark-and-sweep** with generational collection: most objects die young and are collected cheaply.
- A **leak** is memory that's still reachable but no longer needed, so it can't be collected.
- Common leaks: **forgotten event listeners**, **uncleared timers/intervals**, **subscriptions** (WebSocket, stores, observables), **closures** holding large data, **detached DOM nodes** referenced from JS, **unbounded caches/maps**, **global variables**, unrevoked **object URLs**, long-lived references in **singletons**.
- SPAs leak more because pages never reload.
- Tools: **Memory panel** (heap snapshots, comparison, retainers), **allocation instrumentation on timeline**, **Performance monitor** (JS heap size, DOM node count), `performance.memory` (Chrome only).

#### Model answer
"JavaScript manages memory for us: when we create objects, memory is allocated; when objects can no longer be reached from anywhere in the running program, the garbage collector frees them. A leak isn't memory the GC 'forgot'; it's memory we accidentally keep reachable.

**Reachability:**
- **Roots**: global variables, variables in currently executing functions, and anything referenced by active closures, timers, event listeners or the DOM.
- The GC marks everything reachable from roots, then sweeps (frees) the rest. Cycles are fine: two objects referencing each other are collected if nothing reachable points to them.
- Engines like V8 use a **generational** collector: new objects go into a young generation collected often and cheaply; survivors move to an old generation collected less often. Big pauses mostly come from collecting large old generations.

**Common leak patterns in frontend apps:**
1. **Event listeners not removed**:
```js
function mountChart(data) {
  const onResize = () => redraw(data);          // closure holds `data` (maybe megabytes)
  window.addEventListener('resize', onResize);
  // no removeEventListener on unmount → data and chart live forever
}
```
2. **Timers and intervals** never cleared (`setInterval` polling after the component is gone).
3. **Subscriptions**: store subscriptions, WebSocket handlers, observables without unsubscribe.
4. **Detached DOM nodes**: an element removed from the page but still referenced by a JS variable, cache or listener, keeping its whole subtree alive.
5. **Unbounded caches**: a Map that grows with every request or every item viewed.
6. **Closures capturing large objects** unnecessarily (e.g. a handler that only needs an ID but closes over the whole dataset).
7. **Object URLs** created with `URL.createObjectURL` and never revoked.
8. **Global variables** and accidentally global state in singletons.

**React-specific:**
```jsx
useEffect(() => {
  const id = setInterval(poll, 5000);
  const unsubscribe = store.subscribe(onChange);
  const controller = new AbortController();
  fetch(url, { signal: controller.signal }).then(setData).catch(() => {});
  return () => {                     // cleanup on unmount or deps change
    clearInterval(id);
    unsubscribe();
    controller.abort();
  };
}, [url]);
```
Every effect that sets something up should return a cleanup that tears it down.

**Finding a leak with DevTools (my workflow):**
1. **Reproduce** a suspected leaking action repeatedly (open/close a modal 10 times, navigate between two routes).
2. **Performance monitor**: watch JS heap size and DOM node count. If they climb steadily and don't drop after forcing GC (the trash-can button), something's retained.
3. **Heap snapshots**: take a snapshot, perform the action several times, force GC, take another snapshot. Use the **Comparison** view to see which object types grew (e.g. 10 more `ChartView` instances, thousands of `Detached HTMLDivElement`).
4. **Retainers panel**: select a leaked object and look at its retainer chain, showing exactly what's keeping it alive (e.g. `window → listeners → onResize closure → data`).
5. Filter by **'Detached'** to find DOM nodes removed from the document but still referenced.
6. **Allocation instrumentation on timeline** shows where allocations happen and which survive.
7. Fix, then repeat the measurement to confirm memory stabilises.

**Prevention habits:**
- Cleanup functions in every effect; return unsubscribe functions from APIs.
- `AbortController` to remove multiple listeners at once (`addEventListener(type, fn, { signal })`).
- Bounded caches (LRU, TTL) and libraries with garbage collection (TanStack Query's `gcTime`).
- `WeakMap`/`WeakRef` for metadata attached to objects.
- Revoke object URLs; null out references to large data when finished.
- Memory checks in long-session testing (dashboards, chat apps that stay open all day)."

#### Another worked example: a dashboard that crashed after hours
"Support users kept an operations dashboard open all day; after 6–8 hours the tab crashed. Heap snapshots before and after switching between two views 20 times showed 20 retained `MapWidget` instances and 40,000 detached DOM nodes. The retainer chain pointed to a map library's `resize` listener added in `useEffect` without cleanup, whose closure held the widget and its markers. Adding cleanup (`map.remove()` and removing the listener) kept heap size flat at ~120 MB over a day instead of growing past 2 GB."

#### A third worked example: an unbounded cache
"A translation helper cached formatted strings in a module-level Map keyed by the full message plus parameters, including timestamps. The cache grew by thousands of entries per hour. We changed the key to exclude volatile parameters and capped the cache with an LRU of 1,000 entries."

#### Variations you might be asked
- "Can closures cause leaks?": closures keep referenced variables alive; if a long-lived closure (listener, timer) references large data, that data can't be freed.
- "What's a detached DOM node?": an element removed from the document but still referenced from JavaScript, so it and its children can't be collected.
- "How does WeakMap help?": its keys don't keep objects alive, so metadata disappears when the object is collected.

#### Step-by-step framework
1. **Explain reachability and GC.**
2. **List leak patterns** with examples.
3. **Show React cleanup** patterns.
4. **Describe the DevTools workflow.**
5. **Fix and verify.**
6. **Prevention habits.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "JS has GC so no leaks" | Leaks are unwanted reachability |
| Vague list | Specific patterns with code |
| No tooling | Heap snapshot comparison, retainers, detached nodes |
| Fix by guessing | Measure, fix, re-measure |
| No prevention | Cleanup discipline, bounded caches, AbortController |

#### Useful phrases
- "The GC frees what's unreachable; a leak is something we keep reachable by accident."
- "Every effect that subscribes should return a cleanup."
- "The retainer chain tells me exactly what's holding the object."
- "SPAs leak more because the page never reloads."

#### Common pitfalls
- **Missing effect cleanups.**
- **Unbounded module-level caches.**
- **Third-party widgets** not destroyed on unmount.
- **Measuring without forcing GC first.**

#### Follow-ups to expect (with sample answers)
- **"How do you force garbage collection?"**
  "Use the 'Collect garbage' button in DevTools before taking snapshots; you can't force it from page code (except with special flags)."
- **"What's a shallow vs retained size?"**
  "Shallow size is the object's own memory; retained size includes everything that would be freed if it were collected."
- **"How do you monitor memory in production?"**
  "`performance.measureUserAgentSpecificMemory()` where available, crash/OOM reports, and session-length correlations in RUM tools."

#### What senior interviewers look for
- **Correct GC model.**
- **Practical leak-hunting experience.**
- **Preventive engineering habits.**

#### Practise it
1. Create a deliberate listener leak in a small React app and find it with heap snapshot comparison.
2. Write a cleanup checklist for effects.
3. Explain the retainer chain concept, out loud.

## Error handling in async code
- id: fe-js-08
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: error handling, promises, async, resilience

### Prompt
How do you handle errors in asynchronous JavaScript? Cover promise rejections, try/catch with async/await, unhandled rejections, errors in event handlers and timers, `fetch` HTTP errors, and how you'd structure error handling and reporting in a frontend app.

### Answer
#### What the interviewer is really testing
- How errors **propagate** through promises, async functions, callbacks and timers.
- Recognising **silent failures**: unhandled rejections, fetch not rejecting on HTTP errors, swallowed catches.
- **User-facing handling**: error states, retries, fallbacks, error boundaries.
- **Observability**: global handlers and error reporting.

#### Key points
- A thrown error in an async function **rejects its promise**; `try/catch` around `await` catches it.
- Errors thrown inside **callbacks** (`setTimeout`, event listeners) are **not** caught by an outer try/catch; they go to `window.onerror`.
- **Unhandled rejections** fire `unhandledrejection` on window; they're bugs to fix and report.
- **`fetch` only rejects on network failure**, not on 4xx/5xx; check `response.ok`.
- Distinguish **expected errors** (validation, 404, permission) from **unexpected** ones (bugs, outages); handle the first in UI, report the second.
- **AbortError** from cancelled requests should usually be ignored, not shown.
- Use **typed/normalised errors** (an `ApiError` class) so UI code can branch on status.
- React: **error boundaries** catch rendering errors, not async errors in effects or handlers; set error state or use a data library's error handling.
- Report errors with context (Sentry etc.), avoid swallowing errors silently.

#### Model answer
"Async error handling is mostly about making sure every failure goes somewhere deliberate: the UI shows a helpful state, expected failures are handled gracefully, and unexpected ones are reported.

**How errors propagate:**
```js
async function load() {
  throw new Error('boom');          // rejects the returned promise
}
load().catch((e) => console.log('caught', e.message));

try {
  setTimeout(() => { throw new Error('in timer'); }, 0);
} catch (e) {
  // never runs: the callback runs later, outside this try
}
```
Callback-based errors reach `window.onerror` (or `error` events); promise rejections without handlers reach `unhandledrejection`.

**fetch doesn't reject on HTTP errors:**
```js
class ApiError extends Error {
  constructor(status, message, body) { super(message); this.name = 'ApiError'; this.status = status; this.body = body; }
}

async function apiFetch(url, init) {
  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if (err.name === 'AbortError') throw err;            // cancellation: let caller ignore it
    throw new ApiError(0, 'Network error: check your connection', null);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);     // error body may not be JSON
    throw new ApiError(res.status, body?.message ?? res.statusText, body);
  }
  return res.status === 204 ? null : res.json();
}
```
Centralising this means every caller gets consistent errors with a status to branch on.

**Handling in the UI:**
```js
async function onSubmit(values) {
  setStatus('saving');
  try {
    await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(values) });
    setStatus('saved');
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (err instanceof ApiError && err.status === 422) {
      setFieldErrors(err.body.errors);                  // expected: show inline validation
    } else if (err instanceof ApiError && err.status === 401) {
      redirectToLogin();
    } else {
      setStatus('error');                               // unexpected: generic message + retry
      reportError(err, { action: 'saveProfile' });
    }
  }
}
```

**Patterns I follow:**
1. **Expected vs unexpected**: validation errors, 404s and permission errors are part of the product, so show specific messages. Bugs and outages get a friendly generic message, a retry option, and are reported.
2. **Never swallow errors silently**: `catch (e) {}` hides bugs. If I intentionally ignore something, I comment why.
3. **Parallel work**: `Promise.all` rejects on the first error; use `allSettled` when partial success is acceptable.
4. **Retries**: retry idempotent requests on network errors and 5xx/429 with backoff; never blindly retry non-idempotent writes without idempotency keys.
5. **Timeouts**: `AbortSignal.timeout(10000)` so requests don't hang forever.
6. **Cancellation**: ignore `AbortError` from aborted requests (component unmounted, newer search started).

**React specifics:**
- **Error boundaries** catch errors thrown during rendering and lifecycle, showing a fallback UI. They don't catch errors in event handlers, async code or effects' promises.
- For async data, use error state (or TanStack Query's `error`, `isError`, `retry` options). With `throwOnError`/Suspense patterns, query errors can be rethrown into the nearest error boundary.
- Granular boundaries (per widget/route) prevent one failure from blanking the whole app.

**Global safety nets and reporting:**
```js
window.addEventListener('error', (e) => reportError(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));
```
Error monitoring (Sentry, Datadog) with source maps, release tags, user/session context (without PII), and breadcrumbs of recent actions makes production errors debuggable."

#### Another worked example: silent 500s
"A settings page showed 'Saved!' even when the server returned 500, because the code awaited `fetch` and assumed success. Users lost changes without knowing. We introduced the `apiFetch` wrapper that throws on `!res.ok`, added error states and retry, and saw the real failure rate (2%) in Sentry, which led us to fix a backend validation bug."

#### A third worked example: noisy AbortErrors
"After adding request cancellation to a search box, error monitoring filled with AbortErrors because every fast keystroke cancelled the previous request. We filtered `AbortError` both in the UI and in the reporting layer, keeping real errors visible."

#### Variations you might be asked
- "What's the difference between `.catch` at the end of a chain and in the middle?": a catch in the middle handles errors from earlier steps and lets the chain continue with its return value; at the end it handles everything above.
- "How do you handle errors in Promise.all but keep other results?": allSettled, or catch per promise.
- "How do you show errors accessibly?": announce with `role="alert"` or a live region, connect field errors with `aria-describedby`, and move focus to an error summary on submit.

#### Step-by-step framework
1. **Propagation rules** (async, callbacks, timers).
2. **fetch and HTTP errors**, with a wrapper.
3. **Expected vs unexpected** handling in UI.
4. **Retries, timeouts, cancellation.**
5. **React boundaries and async error state.**
6. **Global handlers and reporting.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Wrap it in try/catch" | Explains propagation, including callbacks |
| Assumes fetch throws on 404 | Checks res.ok, normalised ApiError |
| One generic error message | Expected vs unexpected handling |
| Error boundaries catch everything | Knows their limits |
| No monitoring | Global handlers, Sentry with context |

#### Useful phrases
- "fetch only rejects on network failure, so I check response.ok."
- "Expected errors are product states; unexpected ones get reported."
- "Error boundaries don't catch errors in event handlers or async code."
- "I never leave an empty catch block without a reason."

#### Common pitfalls
- **Empty catch blocks.**
- **Treating cancellations as errors.**
- **Retrying non-idempotent writes.**
- **No user feedback on failure.**

#### Follow-ups to expect (with sample answers)
- **"How do you test error handling?"**
  "Mock failures with MSW (500s, network errors, slow responses) and assert error states, retries and messages in component tests."
- **"What context do you add to error reports?"**
  "Release version, route, user/tenant ID (non-PII), feature flags, and breadcrumbs of recent actions and requests."
- **"How do you handle errors in event handlers in React?"**
  "try/catch inside the handler, setting error state; boundaries won't see them."

#### What senior interviewers look for
- **Comprehensive propagation knowledge.**
- **User-centred error UX.**
- **Production observability.**

#### Practise it
1. Write `apiFetch` with ApiError and use it in a form submit handler.
2. Add global error and unhandledrejection handlers to a demo app.
3. Explain why error boundaries miss async errors, out loud.

## Implement Promise.race, Promise.any and retry with backoff
- id: fe-js-09
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: promises, polyfill, retry, backoff, timeouts

### Prompt
Implement `Promise.race` and `Promise.any`. Then write `retry(fn, { retries, baseDelay })` that retries a failing async function with exponential backoff and jitter, and a `withTimeout(promise, ms)` helper.

### Answer
#### What the interviewer is really testing
- Precise **combinator semantics**: race settles with the first settlement, any with the first fulfilment.
- **AggregateError** and empty-input edge cases.
- Building **resilience utilities**: retries, backoff, jitter, timeouts, cancellation.
- Judgement on **what to retry** (idempotency, status codes).

#### Key points
- **race**: settles (fulfil or reject) as soon as the first input settles. Empty input → **never settles**.
- **any**: fulfils with the first fulfilment; rejects with **`AggregateError`** containing all reasons if every input rejects. Empty input → rejects immediately.
- **Timeout** = race the real promise against a timer that rejects; clear the timer afterwards; better, use `AbortSignal.timeout` to actually cancel fetches.
- **Retry with exponential backoff**: delay = `baseDelay × 2^attempt`, capped; add **jitter** (randomness) to avoid synchronised retries (thundering herd).
- Retry only **transient** failures: network errors, 5xx, 429 (respect `Retry-After`); not 4xx validation errors; only **idempotent** operations or with idempotency keys.
- Support **cancellation** (AbortSignal) so retries stop if the user leaves.

#### Model answer
"These are building blocks for resilient network code in the frontend.

**Promise.race:**
```js
function promiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {
      Promise.resolve(item).then(resolve, reject);   // first to settle wins; later calls ignored
    }
  });
}
```
Empty input never settles, matching the built-in (there's nothing to race).

**Promise.any:**
```js
function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    if (items.length === 0) {
      return reject(new AggregateError([], 'All promises were rejected'));
    }
    const errors = new Array(items.length);
    let rejectedCount = 0;
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (err) => {
        errors[i] = err;                              // keep input order
        rejectedCount += 1;
        if (rejectedCount === items.length) {
          reject(new AggregateError(errors, 'All promises were rejected'));
        }
      });
    });
  });
}
```
Use case: fetching from several mirrors/CDNs and using whichever succeeds first.

**Timeout helper:**
```js
function withTimeout(promise, ms, message = `Timed out after ${ms} ms`) {
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}
```
Important caveat: this only stops *waiting*; the underlying work continues. For fetch, actually cancel it:
```js
const res = await fetch(url, { signal: AbortSignal.timeout(8000) });   // aborts the request
```

**Retry with exponential backoff and jitter:**
```js
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const id = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(id); reject(signal.reason); }, { once: true });
});

async function retry(fn, {
  retries = 3,
  baseDelay = 300,
  maxDelay = 5000,
  shouldRetry = (err) => true,
  signal,
} = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn({ attempt, signal });
    } catch (err) {
      if (signal?.aborted || attempt >= retries || !shouldRetry(err)) throw err;
      const exp = Math.min(maxDelay, baseDelay * 2 ** attempt);
      const delay = err.retryAfterMs ?? Math.random() * exp;   // 'full jitter'
      attempt += 1;
      await sleep(delay, signal);
    }
  }
}
```
Usage with sensible retry rules:
```js
const isTransient = (err) =>
  err.name === 'TypeError' ||                        // network failure from fetch
  (err.status >= 500) || err.status === 429;

const data = await retry(
  ({ signal }) => apiFetch('/api/orders', { signal }),
  { retries: 4, shouldRetry: isTransient, signal: controller.signal },
);
```

**Design decisions to explain:**
- **Exponential backoff** gives an overloaded server time to recover instead of hammering it.
- **Jitter** spreads retries out; without it, thousands of clients that failed at the same moment retry at the same moments, creating repeated spikes.
- **Respect `Retry-After`** on 429/503 responses.
- **Don't retry** client errors (400, 401, 403, 404, 422): they won't succeed on retry.
- **Idempotency**: retrying a `POST /payments` could double-charge unless the API supports idempotency keys; GETs and PUTs are generally safe.
- **Cancellation**: if the user navigates away, abort pending retries.
- **Limits**: cap total attempts and total time; show the user what's happening ('Reconnecting…').

In apps using TanStack Query, its built-in `retry` and `retryDelay` options cover most of this; I'd configure them rather than hand-roll, but understanding the mechanics helps tune them."

#### Another worked example: a flaky upstream API
"A dashboard depended on a third-party analytics API that returned intermittent 503s, about 3% of requests. Without retries, widgets showed errors daily. Adding retry with 3 attempts, full jitter and `Retry-After` support reduced user-visible errors to under 0.1%. We also capped retries so that during real outages users saw an error within ~5 seconds rather than waiting indefinitely."

#### A third worked example: racing mirrors with any
"A PDF viewer loaded a large font file from either our CDN or a backup origin. Using `Promise.any([fetchFrom(cdn), fetchFrom(backup)])` and aborting the slower request once one succeeded made loading resilient to CDN incidents, while `AggregateError` gave us both failure reasons when both were down."

#### Variations you might be asked
- "Implement a circuit breaker": track recent failures; after a threshold, fail fast for a cool-down period before trying again.
- "Retry only N times within T seconds": track timestamps of attempts and stop when the window is exhausted.
- "What's the difference between race and any for timeouts?": race rejects if the timer rejects first; any ignores rejections, so a rejecting timer wouldn't work with any.

#### Step-by-step framework
1. **State semantics** of race and any, including empty input.
2. **Implement both.**
3. **Build withTimeout**, noting it doesn't cancel work.
4. **Implement retry** with backoff, jitter, cap.
5. **Add shouldRetry and cancellation.**
6. **Discuss idempotency and library alternatives.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| any rejects with first error | AggregateError after all reject |
| Timeout without cleanup | Clears timer; uses AbortSignal to cancel |
| Fixed-delay retries | Exponential backoff with jitter and cap |
| Retries everything | Transient-only, idempotent-only |
| No cancellation | AbortSignal stops retries |

#### Useful phrases
- "race settles with the first result either way; any waits for the first success."
- "A timeout with race stops waiting, but doesn't stop the request."
- "Jitter prevents every client retrying at the same moment."
- "I only retry transient failures on idempotent operations."

#### Common pitfalls
- **Thundering herd** from synchronised retries.
- **Retrying 4xx errors.**
- **Leaking timers** in timeout helpers.
- **Infinite retries.**

#### Follow-ups to expect (with sample answers)
- **"What's full jitter vs equal jitter?"**
  "Full jitter picks a random delay between 0 and the exponential cap; equal jitter uses half the cap plus a random half. Full jitter spreads load best."
- **"How do you show retries to the user?"**
  "A subtle 'Retrying…' or 'Reconnecting…' state, and after the final failure a clear error with a manual retry button."
- **"Should retries happen on the client or server?"**
  "Both can; avoid stacking retries at every layer, which multiplies load. Coordinate retry budgets."

#### What senior interviewers look for
- **Correct semantics.**
- **Resilience engineering judgement.**
- **Awareness of cancellation and idempotency.**

#### Practise it
1. Implement race, any and withTimeout from memory.
2. Implement retry with jitter and test with a function that fails twice then succeeds.
3. Explain why jitter matters, out loud.

## Implement deepEqual
- id: fe-js-10
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, recursion, equality, edge-cases

### Prompt
Write `deepEqual(a, b)` that returns true if two values are structurally equal, handling primitives, `NaN`, arrays, plain objects, Dates, Maps, Sets and circular references. Discuss when deep equality is (and isn't) appropriate in React apps.

### Answer
#### What the interviewer is really testing
- **Recursive comparison** with careful type checks.
- **Edge cases**: NaN, +0/-0, null, arrays vs objects, different key counts, prototypes, Dates, Map/Set, cycles.
- **Performance awareness**: deep comparison costs, short-circuiting.
- Judgement about **shallow vs deep equality** in React (memo, effects, selectors).

#### Key points
- Start with **`Object.is(a, b)`** (handles NaN and identical references).
- If types differ, or either is not an object (after the identity check), they're **not equal**.
- **Arrays**: same length, each element deep-equal. Don't treat an array and an object with the same keys as equal.
- **Plain objects**: same set of own keys (count and names), each value deep-equal. Decide whether prototypes must match.
- **Date**: compare `getTime()`. **RegExp**: compare `source` and `flags`.
- **Map**: same size, each key present with deep-equal value (object keys compared by identity). **Set**: same size, each value present.
- **Cycles**: track compared pairs in a `WeakMap` to avoid infinite recursion.
- In React, prefer **shallow comparisons and immutable data**; deep equality on every render is expensive.

#### Model answer
"deepEqual checks whether two values have the same structure and contents, even if they're different objects in memory.

```js
function deepEqual(a, b, seen = new WeakMap()) {
  // identical values, including NaN (Object.is(NaN, NaN) === true)
  if (Object.is(a, b)) return true;

  // after this, both must be non-null objects to be equal
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  // different types/prototypes are not equal (array vs object, Date vs object)
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  // cycle handling: if we're already comparing a with b, assume equal for this branch
  if (seen.get(a) === b) return true;
  seen.set(a, b);

  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;

  if (a instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (!b.has(key) || !deepEqual(val, b.get(key), seen)) return false;
    }
    return true;
  }

  if (a instanceof Set) {
    if (a.size !== b.size) return false;
    for (const val of a) if (!b.has(val)) return false;   // object members compared by identity
    return true;
  }

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], seen)) return false;
    }
    return true;
  }

  // plain objects (own enumerable string and symbol keys)
  const keysA = Reflect.ownKeys(a), keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key], seen)) return false;
  }
  return true;
}
```

**Tests:**
```js
deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] });   // true
deepEqual([1, 2], { 0: 1, 1: 2, length: 2 });             // false (different prototypes)
deepEqual(NaN, NaN);                                      // true
deepEqual({ a: undefined }, { b: undefined });            // false (different keys)
deepEqual(new Date(0), new Date(0));                      // true
deepEqual(new Map([['x', [1]]]), new Map([['x', [1]]]));  // true
const x = { n: 1 }; x.self = x; const y = { n: 1 }; y.self = y;
deepEqual(x, y);                                          // true (cycles handled)
```

**Design choices to call out:**
- **`Object.is` first**: fast path for identical references and primitives; treats `NaN` as equal to itself. It also treats `+0` and `-0` as different, which may or may not be wanted; I'd ask.
- **Key count check** catches `{a: undefined}` vs `{b: undefined}`, which a naive 'for each key of a' loop would miss.
- **Prototype check** distinguishes arrays from array-like objects and class instances from plain objects.
- **Set with object members**: strict deep comparison of sets with objects requires pairing each member with some unmatched member of the other set (O(n²)); most implementations compare by identity, which is what I've done. I'd mention the trade-off.
- **Short-circuit early** on size/length mismatches for performance.

**Deep equality in React apps:**
- React compares state and props with `Object.is` (reference equality), and `React.memo` uses a shallow comparison. That's intentional: deep comparison on every render can cost more than re-rendering.
- **Immutable updates** make reference equality meaningful: if data changed, its reference changed; unchanged parts keep their references. That's why selectors, memo and effects work well with immutable data.
- Deep equality is useful in specific places: **tests** (`expect(x).toEqual(y)`), comparing **form values** against initial values to show 'unsaved changes', **deduplicating** API responses before updating state, and custom comparators for `React.memo` when props are complex but rarely change.
- A common anti-pattern: `useEffect(..., [JSON.stringify(obj)])` or deep-comparing deps on every render to avoid fixing unstable object references; better to memoise the object or depend on specific primitive fields."

#### Another worked example: 'unsaved changes' detection
"A settings form needed to warn users about unsaved changes when navigating away. We compared current form values with the initial values using deepEqual (nested address and notification preferences objects). Because it only ran on navigation attempts and blur events, not every keystroke render, the cost was negligible, and it avoided false warnings when users changed a value and then changed it back."

#### A third worked example: avoiding re-renders from polling
"A dashboard polled an endpoint every 10 seconds and set state with the response, re-rendering a large chart every time even when data hadn't changed. Comparing the new response with the current one using deepEqual before calling setState eliminated 90% of chart re-renders. (TanStack Query does this automatically with structural sharing.)"

#### Variations you might be asked
- "Make it configurable (ignore keys, custom comparators)": accept an options object with a key filter and type-specific comparators.
- "Compare typed arrays": same constructor, same length, element-wise comparison.
- "What does Jest's toEqual vs toStrictEqual check?": toStrictEqual also checks undefined properties, array sparseness and class types.

#### Step-by-step framework
1. **Clarify** which types and semantics (NaN, -0, prototypes).
2. **Fast path** with Object.is.
3. **Type and prototype checks.**
4. **Special types** (Date, RegExp, Map, Set).
5. **Arrays and objects** with key count checks; cycles via WeakMap.
6. **Discuss React usage** and performance.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `JSON.stringify(a) === JSON.stringify(b)` | Proper recursion; knows stringify fails on key order, Dates, undefined |
| Misses NaN | Object.is fast path |
| Only checks keys of a | Key count and membership |
| Infinite recursion on cycles | WeakMap of compared pairs |
| Deep-compares everywhere in React | Prefers immutable data and shallow checks |

#### Useful phrases
- "I start with Object.is so identical values and NaN are handled up front."
- "Checking key counts catches objects with different keys holding undefined."
- "React relies on reference equality, which works because we update immutably."
- "Deep equality belongs in tests and specific comparisons, not every render."

#### Common pitfalls
- **JSON-based comparison.**
- **Treating arrays and objects as equal.**
- **Ignoring Map/Set.**
- **Deep comparisons in hot render paths.**

#### Follow-ups to expect (with sample answers)
- **"What's the complexity?"**
  "O(n) in the total number of nested values, plus overhead for Set with object members if compared deeply."
- **"Why does React use shallow comparison?"**
  "It's cheap and, combined with immutable updates, accurately detects changes."
- **"What's structural sharing?"**
  "Creating a new object that reuses unchanged sub-objects by reference, so equality checks stay cheap and accurate."

#### What senior interviewers look for
- **Edge-case rigour.**
- **Performance and React judgement.**
- **Clear, testable code.**

#### Practise it
1. Implement deepEqual and run the test cases above.
2. Explain why JSON.stringify comparison is wrong with two examples.
3. Describe when you'd use deep equality in a React app, out loud.

## Implement flatten for arrays and nested objects
- id: fe-js-11
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: polyfill, recursion, arrays, objects

### Prompt
Implement `flatten(array, depth)` like `Array.prototype.flat`, both recursively and iteratively. Then implement `flattenObject(obj)` that turns `{ a: { b: { c: 1 } } }` into `{ 'a.b.c': 1 }`, and its inverse `unflatten`.

### Answer
#### What the interviewer is really testing
- **Recursion** and its iterative equivalent (explicit stack).
- **Depth control** and edge cases (empty arrays, holes, non-array values).
- **Object path construction** and handling arrays inside objects.
- Knowing **real uses**: form field paths, translation keys, query params, analytics payloads.

#### Key points
- `Array.prototype.flat(depth = 1)` flattens nested arrays up to `depth`; `Infinity` flattens fully; it **skips holes**.
- Recursive approach: for each element, if it's an array and depth > 0, recurse with depth − 1.
- Iterative approach: use a **stack** to avoid recursion limits on very deep nesting; preserve order.
- `flattenObject` builds **dot paths**; decide how to represent arrays (`'items.0.name'` or `'items[0].name'`) and empty objects/arrays.
- `unflatten` splits paths and rebuilds nested structure, creating arrays when the next key is numeric.
- Real uses: **form libraries** (field names like `address.city`), **i18n keys**, **flattening API errors** to fields, **query string serialisation**, analytics tools that need flat properties.

#### Model answer
"**Array flatten, recursive:**
```js
function flatten(arr, depth = 1) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (!(i in arr)) continue;                      // skip holes, like flat()
    const item = arr[i];
    if (Array.isArray(item) && depth > 0) {
      result.push(...flatten(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}

flatten([1, [2, [3, [4]]]]);            // [1, 2, [3, [4]]]
flatten([1, [2, [3, [4]]]], 2);         // [1, 2, 3, [4]]
flatten([1, [2, [3, [4]]]], Infinity);  // [1, 2, 3, 4]
```
(For very large arrays, `result.push(...bigArray)` can exceed argument limits; a loop pushing items avoids that.)

**Array flatten, iterative (no recursion limit):**
```js
function flattenDeep(arr) {
  const stack = [...arr];
  const result = [];
  while (stack.length) {
    const next = stack.pop();
    if (Array.isArray(next)) stack.push(...next);   // expand back onto the stack
    else result.push(next);
  }
  return result.reverse();                          // popping reverses order
}
```
With depth support, I'd push `[item, depth]` pairs onto the stack.

**Using reduce (concise, common in interviews):**
```js
const flat = (arr, d = 1) =>
  d > 0 ? arr.reduce((acc, x) => acc.concat(Array.isArray(x) ? flat(x, d - 1) : x), []) : arr.slice();
```

**Object flatten:**
```js
function flattenObject(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const isContainer = value !== null && typeof value === 'object' && !(value instanceof Date);
    if (isContainer && Object.keys(value).length > 0) {
      flattenObject(value, path, result);        // arrays recurse too: keys '0', '1'…
    } else {
      result[path] = value;                      // primitives, Dates, empty {} / []
    }
  }
  return result;
}

flattenObject({ user: { name: 'Asha', address: { city: 'Leeds' } }, tags: ['a', 'b'], meta: {} });
// { 'user.name': 'Asha', 'user.address.city': 'Leeds', 'tags.0': 'a', 'tags.1': 'b', meta: {} }
```
Decisions to state: Dates kept as values (not recursed into), empty objects/arrays kept so `unflatten` can restore them, and arrays use numeric path segments.

**Unflatten:**
```js
function unflatten(flat) {
  const result = {};
  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split('.');
    let node = result;
    keys.forEach((key, i) => {
      if (i === keys.length - 1) {
        node[key] = value;
      } else {
        const nextIsIndex = /^\d+$/.test(keys[i + 1]);
        node[key] ??= nextIsIndex ? [] : {};     // create arrays for numeric segments
        node = node[key];
      }
    });
  }
  return result;
}
```
Caveats: keys containing dots need escaping or a different separator, and the dangerous keys `__proto__`, `constructor` and `prototype` must be rejected when unflattening untrusted input, otherwise you get **prototype pollution**.

**Real uses:**
- **Form libraries** use dot paths (`errors['address.city']`, `register('items.0.quantity')`).
- **Server validation errors** often come back flat (`{ 'address.postcode': 'Invalid' }`) and need mapping to nested form fields.
- **i18n** files are nested JSON but looked up by flat keys (`t('checkout.payment.cardDeclined')`).
- **Analytics** tools often only accept flat properties.
- **Query strings**: `filters.price.min=10&filters.price.max=50`."

#### Another worked example: mapping server errors to form fields
"An API returned validation errors as `{ 'shipping.address.postcode': 'Postcode is invalid', 'items.2.quantity': 'Max 10' }`. Our form library used nested error objects. Running `unflatten` on the response let us pass errors straight into the form state, and each field showed its own error next to the right input."

#### A third worked example: diffing nested settings
"To show an audit trail of which settings changed, we flattened the before and after settings objects and compared keys: any path whose value differed was listed as 'notifications.email.weekly: off → on'. Flattening turned a recursive diff into a simple key comparison."

#### Variations you might be asked
- "Flatten with a custom separator or bracket notation for arrays": parameterise the path builder.
- "Flatten only N levels of an object": pass a depth like the array version.
- "Implement flatMap": map each element then flatten one level.

#### Step-by-step framework
1. **Clarify** depth, holes, separators, array representation.
2. **Recursive array flatten** with depth.
3. **Iterative version** with a stack.
4. **Object flatten** with path building and type decisions.
5. **Unflatten** with array detection and safety checks.
6. **Real uses** and edge cases.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Fully flattens regardless of depth | Respects depth like flat() |
| Only recursive | Also iterative for deep nesting |
| Recurses into Dates | Treats Dates and empty containers deliberately |
| Ignores unflatten safety | Rejects __proto__ keys |
| No use cases | Forms, i18n, analytics, server errors |

#### Useful phrases
- "flat() skips holes, so my version does too."
- "The iterative version avoids recursion limits."
- "When unflattening untrusted keys, I block __proto__ to avoid prototype pollution."
- "Form libraries and i18n both rely on dot paths."

#### Common pitfalls
- **Spread with huge arrays** (argument limits).
- **Losing empty objects/arrays.**
- **Keys containing the separator.**
- **Prototype pollution** in unflatten.

#### Follow-ups to expect (with sample answers)
- **"What's the time complexity?"**
  "O(n) in the total number of elements/properties visited."
- **"How does lodash handle paths?"**
  "`_.get`/`_.set` parse dot and bracket paths and create intermediate arrays or objects as needed."
- **"Why might stack order matter?"**
  "Popping from the end reverses order, so either reverse at the end or process with an index."

#### What senior interviewers look for
- **Recursion fluency** and iterative alternatives.
- **Careful edge-case decisions.**
- **Security awareness.**

#### Practise it
1. Implement flatten recursively, iteratively and with reduce.
2. Implement flattenObject and unflatten and round-trip a nested object.
3. Explain the prototype pollution risk in unflatten, out loud.

## WeakMap, WeakSet, WeakRef and when to use them
- id: fe-js-12
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: WeakMap, WeakRef, memory, garbage collection

### Prompt
What are `WeakMap`, `WeakSet`, `WeakRef` and `FinalizationRegistry`? How do they differ from `Map` and `Set`, and when would you use each in a frontend application?

### Answer
#### What the interviewer is really testing
- Understanding **weak references** and how they interact with garbage collection.
- Knowing the **API limitations** (object keys, not iterable, no size) and why they exist.
- Practical **use cases**: private data, caches keyed by objects, DOM metadata, tracking visited objects.
- Caution about **WeakRef/FinalizationRegistry** non-determinism.

#### Key points
- **WeakMap**: keys must be objects (or non-registered symbols); keys are held **weakly**, so if nothing else references a key object, the entry can be garbage-collected. Values are held strongly while the key is alive.
- **WeakSet**: a set of objects held weakly; useful for "have I seen/processed this object?".
- Weak collections are **not iterable** and have **no size**, because their contents depend on GC timing.
- **WeakRef**: holds a weak reference to a single object; `deref()` returns the object or `undefined` if collected.
- **FinalizationRegistry**: registers a callback to run (sometime, maybe never) after an object is collected.
- Use cases: **metadata or caches attached to objects** (DOM nodes, component instances, request objects), **private data** for classes (before `#private` fields), **cycle detection** in deep clone/equal, **memoizing by object identity**.
- WeakRef and finalisers are **non-deterministic**; avoid them for essential logic.

#### Model answer
"Normal Maps and Sets hold strong references: as long as the Map exists, its keys and values can't be garbage-collected, even if nothing else uses them. Weak collections let the garbage collector remove entries when the key object is no longer used anywhere else.

**WeakMap vs Map:**
```js
let element = document.querySelector('#chart');

const strong = new Map();
strong.set(element, { clicks: 0 });
element.remove();
element = null;
// The Map still references the element: it (and its subtree) can't be collected — leak

const weak = new WeakMap();
let el2 = document.querySelector('#table');
weak.set(el2, { clicks: 0 });
el2.remove();
el2 = null;
// No other references: the GC can remove the element AND its WeakMap entry
```

| | Map / Set | WeakMap / WeakSet |
|---|---|---|
| Key types | Anything | Objects (and non-registered symbols) |
| Keeps keys alive | Yes | No |
| Iterable, `.size` | Yes | No |
| Use for | General collections | Data attached to objects' lifetimes |

**Why no iteration or size?** Entries can disappear at any moment depending on when the GC runs. Exposing size or iteration would make program behaviour depend on GC timing, which is non-deterministic.

**Use cases:**
1. **Metadata about DOM nodes or objects you don't own:**
```js
const tooltipState = new WeakMap();
function attachTooltip(el, text) {
  tooltipState.set(el, { text, visible: false });
}
// when the element is removed and dropped, its state goes with it
```
2. **Caching by object identity** (memoize derived data per object):
```js
const totalsCache = new WeakMap();
function cartTotal(cart) {
  if (!totalsCache.has(cart)) totalsCache.set(cart, cart.items.reduce((s, i) => s + i.price * i.qty, 0));
  return totalsCache.get(cart);
}
```
With immutable updates, a new cart object gets a fresh computation, and old carts' cache entries are collected automatically.
3. **Private data** for classes or objects (the pre-`#private` pattern):
```js
const privates = new WeakMap();
class Account {
  constructor(balance) { privates.set(this, { balance }); }
  get balance() { return privates.get(this).balance; }
}
```
4. **WeakSet for 'already processed' tracking:**
```js
const initialised = new WeakSet();
function enhance(el) {
  if (initialised.has(el)) return;   // don't double-initialise
  initialised.add(el);
  // ...attach behaviour
}
```
5. **Cycle detection** in deepClone/deepEqual/safe stringify, where a WeakMap/WeakSet tracks visited objects during one operation.

**WeakRef and FinalizationRegistry:**
```js
const cache = new Map();                          // key: id → WeakRef(largeObject)
function getImageData(id) {
  const ref = cache.get(id);
  const cached = ref?.deref();
  if (cached) return cached;
  const data = decodeExpensiveImage(id);
  cache.set(id, new WeakRef(data));
  registry.register(data, id);                     // clean up the map entry after collection
  return data;
}
const registry = new FinalizationRegistry((id) => {
  if (!cache.get(id)?.deref()) cache.delete(id);
});
```
This builds a cache that lets the GC reclaim memory under pressure. But:
- GC timing is unpredictable; objects may live much longer than expected, or be collected sooner.
- Finalisers may run late or never (e.g. if the page closes).
- The spec advises avoiding them where possible. For most caches, a bounded LRU with explicit eviction is more predictable.

I'd use WeakMap/WeakSet freely for object-associated data, and WeakRef/FinalizationRegistry only for specialised cases like large decoded assets or interop cleanup, with a fallback that doesn't depend on them."

#### Another worked example: a component library's DOM metadata
"A vanilla-JS tooltip library stored per-element configuration in a Map keyed by elements. In a React SPA, elements were constantly created and removed, and the Map kept every removed element alive: thousands of detached nodes after an hour. Switching the Map to a WeakMap removed the leak without changing any other code."

#### A third worked example: per-request caching on the server
"In a Node SSR app, we computed expensive derived data for each request object. A WeakMap keyed by the request object meant the cached data vanished automatically when the request finished and was collected, without manual cleanup or risk of leaking across requests."

#### Variations you might be asked
- "Can you use a string as a WeakMap key?": no; primitives can't be weakly held (they aren't collected like objects).
- "Does a WeakMap value keep its key alive?": a value referencing its own key doesn't keep the entry alive (ephemeron semantics), as long as nothing else references the key.
- "When would you choose `#private` fields over WeakMap privacy?": almost always now; `#private` is built-in, clearer and faster.

#### Step-by-step framework
1. **Explain strong vs weak references.**
2. **Compare Map/Set with WeakMap/WeakSet.**
3. **Explain API limits** (no iteration/size) and why.
4. **Give use cases** with code.
5. **Introduce WeakRef/FinalizationRegistry** with caveats.
6. **State a preference** for predictable alternatives.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "WeakMap is a faster Map" | Explains weak references and GC |
| Doesn't know key restrictions | Objects only, no iteration/size and why |
| No use cases | DOM metadata, object-identity caches, WeakSet tracking |
| Uses WeakRef for core logic | Knows non-determinism, prefers LRU |
| Unaware of leak benefits | Shows Map leak vs WeakMap fix |

#### Useful phrases
- "A WeakMap lets data live exactly as long as the object it describes."
- "You can't iterate a WeakMap because its contents depend on GC timing."
- "For object-associated caches, WeakMap avoids manual cleanup."
- "WeakRef and finalisers are non-deterministic, so I don't rely on them for correctness."

#### Common pitfalls
- **Using Map for DOM metadata** in SPAs.
- **Expecting WeakMap entries to disappear immediately.**
- **Relying on finalisers** for important cleanup.
- **Trying primitive keys.**

#### Follow-ups to expect (with sample answers)
- **"How would you test that a WeakMap entry is collected?"**
  "You can't deterministically in normal code; in Node you can run with `--expose-gc` and call `gc()`, then check a WeakRef."
- **"Do WeakMaps prevent all leaks?"**
  "No, only those caused by the map itself; if something else holds the key, it stays alive."
- **"What's an ephemeron?"**
  "A key-value pair where the value is only reachable while the key is reachable via other references, which is how WeakMap entries behave."

#### What senior interviewers look for
- **Accurate GC understanding.**
- **Practical leak-prevention uses.**
- **Caution with non-deterministic APIs.**

#### Practise it
1. Rewrite a Map-based DOM metadata store as a WeakMap.
2. Implement the WeakSet 'initialise once' pattern.
3. Explain why WeakMaps aren't iterable, out loud.

## Immutability and structural sharing
- id: fe-js-13
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: immutability, structural sharing, state, React, Immer

### Prompt
What does immutability mean in JavaScript, and why do React and Redux rely on immutable updates? Show how to update deeply nested state immutably, explain structural sharing, and compare spread updates, Immer and `Object.freeze`.

### Answer
#### What the interviewer is really testing
- Understanding **reference equality** and why mutation breaks change detection.
- Writing **correct immutable updates** for nested objects and arrays.
- **Structural sharing**: copying only the changed path.
- Tooling and trade-offs: **spread, Immer, Object.freeze, structuredClone**, and performance.

#### Key points
- **Immutable update** = create new objects/arrays for changed data instead of modifying existing ones.
- React compares state with **`Object.is`**; mutating an object and setting the same reference **won't re-render**. `React.memo`, `useMemo`, selectors and effect deps rely on reference changes.
- **Structural sharing**: new objects are created only along the path to the change; unchanged branches keep their references, so equality checks remain cheap and accurate.
- Use **spread** for objects, **map/filter/concat/toSorted/with** for arrays (avoid `push`, `splice`, `sort`, `reverse` on state).
- **Immer** lets you write "mutating" code on a draft and produces an immutable result with structural sharing (used by Redux Toolkit).
- **Object.freeze** is shallow and only prevents mutation; useful in development to catch accidental mutation.
- Deep cloning on every update is wasteful and breaks sharing.

#### Model answer
"Immutability means that once you create a piece of data, you don't change it; to 'change' it, you create a new version. In React, that's how the framework knows something changed: it compares references, not contents.

**Why mutation breaks React:**
```jsx
const [todos, setTodos] = useState([{ id: 1, text: 'Write tests', done: false }]);

function toggleBroken(id) {
  const todo = todos.find((t) => t.id === id);
  todo.done = !todo.done;       // mutates the existing object
  setTodos(todos);              // same array reference → React bails out, no re-render
}

function toggle(id) {
  setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
}
```
In the correct version, the array is new, the toggled todo is new, and every other todo keeps its reference. A memoized `<TodoItem>` for unchanged todos won't re-render.

**Updating nested state immutably:**
```js
const state = {
  user: { id: 1, profile: { name: 'Asha', address: { city: 'Leeds', postcode: 'LS1' } } },
  settings: { theme: 'dark' },
};

const next = {
  ...state,
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      address: { ...state.user.profile.address, city: 'York' },
    },
  },
};

next === state;                                     // false
next.settings === state.settings;                   // true — shared, unchanged
next.user.profile.address === state.user.profile.address;   // false — on the changed path
```
That's **structural sharing**: we copied only the objects on the path to `city` (root → user → profile → address); `settings` is reused.

**Array operations:**
| Mutating (avoid on state) | Immutable alternative |
|---|---|
| `push(x)` | `[...arr, x]` |
| `splice(i, 1)` | `arr.filter((_, idx) => idx !== i)` or `arr.toSpliced(i, 1)` |
| `arr[i] = x` | `arr.map((v, idx) => idx === i ? x : v)` or `arr.with(i, x)` |
| `sort()` / `reverse()` | `arr.toSorted()` / `arr.toReversed()` (or copy first) |

**Immer for complex updates:**
```js
import { produce } from 'immer';
const next2 = produce(state, (draft) => {
  draft.user.profile.address.city = 'York';         // looks like mutation, works on a draft
});
```
Immer tracks changes on a proxy and produces a new state with structural sharing, freezing it in development. Redux Toolkit's `createSlice` uses Immer, which is why reducers there can 'mutate'.

**Object.freeze:**
```js
const frozen = Object.freeze({ a: 1, nested: { b: 2 } });
frozen.a = 2;            // ignored (TypeError in strict mode)
frozen.nested.b = 3;     // works — freeze is shallow
```
It prevents mutation rather than helping you update; useful for constants and as a development guard (deep-freeze state in dev to catch accidental mutation early).

**Why not deep clone everything?** `structuredClone(state)` then modifying works, but every object gets a new reference, so every memoized component and selector thinks everything changed, and it's slower. Structural sharing gives the best of both: correctness and cheap change detection.

**Benefits beyond React rendering:** predictable state (no 'spooky action at a distance'), time-travel debugging and undo/redo (keep previous versions cheaply), safe concurrent rendering, and easier testing.

**Normalising state** reduces deep nesting: store entities by ID (`{ usersById: {...}, orderIds: [...] }`), so updates touch shallow paths. Redux Toolkit's `createEntityAdapter` helps."

#### Another worked example: a list that wouldn't update
"A kanban board moved a card by calling `column.cards.splice(...)` on state and then `setBoard({ ...board })`. The top-level object changed, but the column objects were the same references, so memoized `Column` components didn't re-render and the card appeared in both columns until refresh. Rewriting the move as immutable updates on both affected columns (with Immer for readability) fixed it."

#### A third worked example: undo/redo with structural sharing
"A diagram editor stored a history array of states. Because updates were immutable with structural sharing, 200 history entries used little extra memory: each version shared all unchanged shapes with the previous one. Undo was just moving an index. With deep cloning, the same history consumed hundreds of megabytes."

#### Variations you might be asked
- "Implement a `setIn(obj, path, value)` immutable helper": recursively copy each level on the path, returning new objects only where changed.
- "Is `const` immutability?": no, it prevents re-assignment of the variable, not mutation of the object.
- "When is mutation fine?": local variables inside a function that no one else can see (e.g. building an array before returning it), and refs (`useRef`) that don't drive rendering.

#### Step-by-step framework
1. **Define immutability** and reference equality.
2. **Show a mutation bug** in React.
3. **Write nested immutable updates.**
4. **Explain structural sharing.**
5. **Array methods and Immer.**
6. **Freeze, deep clone trade-offs, normalisation.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use const" | Explains reference equality and new objects |
| Mutates then spreads top level | Copies every level on the changed path |
| Deep clones state | Structural sharing |
| Doesn't know Immer | Immer and Redux Toolkit |
| Thinks freeze is deep | Shallow freeze as dev guard |

#### Useful phrases
- "React notices changes by reference, so I create new objects for what changed."
- "Structural sharing copies only the path to the change."
- "Unchanged branches keep their references, which keeps memoization effective."
- "Immer lets me write readable updates while producing immutable results."

#### Common pitfalls
- **Mutating then setting the same reference.**
- **Shallow copy only at the top.**
- **Using sort/reverse on state arrays.**
- **Deep cloning entire state.**

#### Follow-ups to expect (with sample answers)
- **"How does Immer work?"**
  "It gives you a Proxy draft, records which parts you changed, and builds a new object tree copying only changed nodes."
- **"Is immutability slower?"**
  "Creating objects has a cost, but it's small, and cheap change detection usually saves far more by skipping renders."
- **"Why normalise state?"**
  "To avoid duplicated entities and deep nesting; updates become shallow and lookups O(1)."

#### What senior interviewers look for
- **Correct nested updates.**
- **Understanding of why React needs them.**
- **Tool and architecture judgement.**

#### Practise it
1. Write nested immutable updates for adding, editing and removing items in a nested list.
2. Rewrite them with Immer.
3. Explain structural sharing with a diagram, out loud.

## Numbers, floating point and dates: common traps
- id: fe-js-14
- roles: frontend, fullstack
- round: JS_FUNDAMENTALS
- difficulty: medium
- levels:
- tags: numbers, floating point, dates, timezones, Intl

### Prompt
Why does `0.1 + 0.2 !== 0.3` in JavaScript? How should you handle money, large integers and rounding? Then explain common Date and timezone pitfalls in frontend apps and how you'd format numbers and dates for users.

### Answer
#### What the interviewer is really testing
- Understanding **IEEE 754 double-precision** floating point and its consequences.
- Correct handling of **money** (integer minor units, decimal libraries) and **BigInt**.
- Awareness of **Date pitfalls**: parsing, timezones, DST, month indexing, mutability.
- Using **`Intl`** for locale-aware formatting, and modern alternatives (Temporal, date-fns).

#### Key points
- JavaScript numbers are **64-bit floating point**; many decimals (0.1, 0.2) can't be represented exactly, so arithmetic accumulates tiny errors.
- Compare floats with a **tolerance** (`Math.abs(a - b) < Number.EPSILON * scale`), or avoid floats for exact values.
- **Money**: store **integer minor units** (pence/cents), compute in integers, format at the edge; or use a decimal library; let the backend be the source of truth for totals.
- **Safe integers**: up to `Number.MAX_SAFE_INTEGER` (2^53 − 1); IDs larger than that (e.g. some database IDs) must be **strings or BigInt**.
- `toFixed` returns a string and rounds with binary representation surprises; `Math.round` rounds half up towards +∞.
- **Dates**: months are **0-indexed**; `Date` is **mutable**; `new Date('2026-03-01')` is parsed as **UTC**, while `new Date('2026-03-01T00:00')` is **local**; DST makes some local times not exist or repeat.
- Store and send timestamps in **UTC ISO 8601**; convert to the user's timezone only for display.
- Format with **`Intl.NumberFormat`** and **`Intl.DateTimeFormat`** / `RelativeTimeFormat`; don't hand-build strings.
- **Temporal** (newer standard API) fixes many Date problems; libraries like date-fns or Luxon in the meantime.

#### Model answer
"**Floating point.** JavaScript stores numbers as IEEE 754 doubles: binary fractions. Just as 1/3 can't be written exactly in decimal, 0.1 can't be represented exactly in binary, so small errors appear:
```js
0.1 + 0.2;                    // 0.30000000000000004
0.1 + 0.2 === 0.3;            // false
1.005.toFixed(2);             // '1.00' (1.005 is stored as 1.00499999…)
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;   // true — tolerance comparison
```

**Money: never use floats for exact amounts.**
```js
// Store and compute in integer minor units (pence)
const items = [{ pricePence: 1999, qty: 3 }, { pricePence: 450, qty: 2 }];
const subtotalPence = items.reduce((s, i) => s + i.pricePence * i.qty, 0);   // 6897
const vatPence = Math.round(subtotalPence * 0.2);                            // round once, deliberately

const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
fmt.format(subtotalPence / 100);   // '£68.97' — convert only for display
```
For complex calculations (currency conversion, tax rules, many decimal places), use a decimal library (e.g. decimal.js, dinero.js) and let the **backend calculate authoritative totals**; the frontend displays them.

**Large integers:**
```js
Number.MAX_SAFE_INTEGER;          // 9007199254740991
9007199254740993 === 9007199254740992;   // true — precision lost
JSON.parse('{"id": 1234567890123456789}').id;   // 1234567890123456800 — wrong ID!
```
Large IDs (Twitter/X snowflake IDs, some database IDs) must be sent as **strings**. For big integer arithmetic use **BigInt** (`10n ** 20n`), noting BigInt can't mix with Number without conversion and isn't JSON-serialisable by default.

**Rounding and parsing:**
- `Math.round(2.5)` → 3, `Math.round(-2.5)` → -2 (rounds towards +∞ at .5).
- Banking/financial rounding rules (half-even) need explicit implementation or a library.
- `parseFloat('12.5kg')` → 12.5; `Number('12.5kg')` → NaN. Validate user input explicitly.

**Dates: the common traps**
```js
new Date(2026, 0, 31);        // 31 January — months are 0-indexed!
const d = new Date(2026, 0, 31);
d.setMonth(1);                // 3 March (Feb 31 overflows) — and d is mutated

new Date('2026-03-01');        // parsed as UTC midnight → 28 Feb evening in New York
new Date('2026-03-01T00:00');  // parsed as LOCAL midnight
```
- **Date-only strings are UTC; date-time strings without offset are local**, a frequent source of 'off by one day' bugs for users west of UTC.
- **DST**: in the UK, 01:30 on the day clocks go forward doesn't exist; adding '24 hours' isn't always 'one day later at the same time'.
- **Mutability**: `setMonth` changes the object; sharing a Date between components causes surprises.

**Best practices:**
- Store and transmit **instants in UTC** (ISO 8601 with Z, or epoch milliseconds).
- For **calendar dates** without time (birthdays, booking dates), store `'2026-03-01'` as a plain date string and don't convert through timezones.
- Convert to the **user's timezone only for display**, using `Intl.DateTimeFormat` with `timeZone` when needed:
```js
new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London',
}).format(new Date('2026-03-29T00:30:00Z'));    // '29 Mar 2026, 00:30'

new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-1, 'day');   // 'yesterday'
```
- Use **date-fns** (immutable functions), **Luxon** or **Temporal** (the new standard API with `Temporal.PlainDate`, `ZonedDateTime` and correct DST arithmetic) for date maths.
- Be careful with **SSR hydration**: server and client may format dates in different timezones, causing mismatches; format on the client or pass the user's timezone.

**Number formatting:** `Intl.NumberFormat` handles locale separators (`1,234.56` vs `1.234,56`), currencies, percentages, compact notation (`1.2K`), and units, so we never hand-roll formatting."

#### Another worked example: the 'off by one day' booking bug
"Users in the US saw booking dates one day earlier than they selected. The date picker produced `'2026-07-14'`, which the app passed to `new Date()`, creating UTC midnight, then displayed in local time (13 July, 8 pm). We treated booking dates as plain calendar dates end to end (strings, or `Temporal.PlainDate`), never converting them through timezones, and the bug disappeared."

#### A third worked example: cart totals off by a penny
"A cart computed totals with floats and `toFixed(2)`, and occasionally showed £10.00 while the backend charged £9.99. We switched to integer pence in the frontend, rounded VAT once per line as the backend did, and displayed backend-calculated totals at checkout. Mismatches disappeared, and support tickets about 'wrong totals' stopped."

#### Variations you might be asked
- "How do you compare two floats?": tolerance based on the magnitude, or compare integers after scaling.
- "Why is `typeof NaN` 'number'?": NaN is a special IEEE 754 value representing an invalid numeric result.
- "How do you handle user timezones for scheduling?": store UTC instants plus the user's IANA timezone (e.g. 'Europe/London'), and compute recurring events in that timezone to handle DST.

#### Step-by-step framework
1. **Explain floating point** and its effects.
2. **Money handling** with integers and formatting at the edge.
3. **Safe integers and BigInt.**
4. **Rounding and parsing** caveats.
5. **Date pitfalls** (parsing, months, mutability, DST, timezones).
6. **Best practices**: UTC storage, Intl formatting, libraries/Temporal, SSR.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "JavaScript maths is buggy" | Explains IEEE 754 representation |
| Uses toFixed for money | Integer minor units, backend totals |
| Unaware of large ID precision | Strings/BigInt for big IDs |
| `new Date('2026-03-01')` everywhere | Knows UTC vs local parsing, plain dates |
| Hand-formats strings | Intl.NumberFormat / DateTimeFormat |

#### Useful phrases
- "0.1 can't be represented exactly in binary, so small errors accumulate."
- "I keep money in integer pence and format only for display."
- "Large IDs travel as strings so they don't lose precision."
- "Store instants in UTC; display in the user's timezone."

#### Common pitfalls
- **Float arithmetic for money.**
- **Large numeric IDs** in JSON.
- **Date-only strings** shifting a day.
- **Mutating shared Date objects.**

#### Follow-ups to expect (with sample answers)
- **"What's Number.EPSILON?"**
  "The difference between 1 and the next representable number, about 2.2e-16; useful for tolerance comparisons near 1."
- **"What problems does Temporal solve?"**
  "Immutable types, separate plain dates/times from zoned instants, correct DST and calendar arithmetic, and reliable parsing."
- **"How do you avoid hydration mismatches with dates?"**
  "Render a stable format on the server (e.g. UTC or the user's known timezone) or defer locale-specific formatting to the client after hydration."

#### What senior interviewers look for
- **Correct mental models** of numbers and time.
- **Production-safe practices** for money and dates.
- **Use of platform APIs** (Intl, Temporal).

#### Practise it
1. Reproduce `0.1 + 0.2`, the large ID problem and the date-only parsing bug in a console.
2. Rewrite a cart total calculation using integer pence and Intl formatting.
3. Explain UTC storage vs local display, out loud.
