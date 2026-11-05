# Frontend Engineer — React & Framework

## Explain the React rendering pipeline: render phase vs commit phase
- id: 641fd6e2-0550-485c-b8cf-e04559c522b9
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, internals
- companies: Meta, Anthropic

### Prompt
Explain what happens when React renders. What triggers a render, what happens in the render phase vs the commit phase, how reconciliation and Fiber work, where effects run, and what concurrent rendering changes. Senior interviews go deep here.

### Answer
#### What the interviewer is really testing
- A correct model of **render triggers** and that "render" means calling components, not updating the DOM.
- The split between the **pure, interruptible render phase** and the **synchronous commit phase**.
- **Reconciliation**, keys, and **Fiber** as the unit of work.
- **Effect timing** (`useLayoutEffect` vs `useEffect`) and **concurrent features** (transitions, Suspense, batching).
- Applying the model to **performance and bugs** (unnecessary renders, side effects in render, StrictMode double rendering).

#### Key points
- **Triggers**: initial mount (`root.render`), **state updates** (`setState`, `useReducer` dispatch), **parent re-render** (children re-render by default), **context value changes**, external store changes (`useSyncExternalStore`).
- **Render phase**: React calls components to produce a new tree of elements, then **reconciles** (diffs) it against the previous tree to compute changes. Must be **pure**: no side effects. Can be **paused, interrupted, or thrown away** in concurrent rendering.
- **Commit phase**: React applies DOM mutations, updates refs, runs **`useLayoutEffect`** synchronously (before paint), then the browser paints, then **`useEffect`** runs (after paint, asynchronously). Commit is **synchronous and not interruptible**.
- **Reconciliation heuristics**: different element type → replace subtree; same type → update props and recurse; lists matched by **keys**.
- **Fiber**: React's internal data structure (one fiber per component instance/element) enabling incremental work, priorities and resumption; double buffering (current vs work-in-progress tree).
- **Batching**: multiple state updates in the same event (and since React 18, in promises/timeouts) produce one render.
- **Concurrent rendering**: `startTransition`, `useDeferredValue`, Suspense let React prepare low-priority renders without blocking urgent updates.
- **StrictMode** in development double-invokes render functions and effects to surface impure code.

#### Model answer
"In React, 'rendering' means React calling your components to figure out what the UI should look like. Updating the DOM is a separate, later step. Keeping those two apart explains most React performance behaviour.

**1. What triggers a render**
- Initial mount: `createRoot(el).render(<App />)`.
- A **state update** in a component (`setCount`, `dispatch`).
- A **parent re-rendering**: by default, all children render again, even if their props didn't change (unless memoized).
- A **context value** changing: all consumers of that context re-render.
- An external store notifying (Redux, Zustand via `useSyncExternalStore`).
Props changing is a consequence of the parent rendering, not an independent trigger.

**2. Render phase**
React walks the tree from where the update happened:
- Calls each component function with its props and current state, getting React elements (the JSX result).
- **Reconciles**: compares the new elements with the previous tree to work out what changed.
  - Different element type at the same position (`<div>` → `<section>`, or `<ProfileA>` → `<ProfileB>`): tear down the old subtree (unmount, lose state) and build a new one.
  - Same type: keep the instance and state, update props, recurse into children.
  - Lists: match children by **key**; keys preserve identity when items move.
- Produces a list of changes (effects) to apply.

The render phase must be **pure**: same props and state → same output, with no side effects (no fetching, subscriptions, DOM mutations, logging that matters). That's because, in concurrent rendering, React may:
- render a component and **throw the result away** (if a higher-priority update interrupts),
- render it **more than once**,
- **pause** and resume later.
StrictMode deliberately double-invokes component functions in development to expose impure code.

**3. Fiber: how React does incremental work**
Each component instance or element corresponds to a **fiber**: an object holding its type, props, state (hooks list), and links to parent, child and sibling. React builds a **work-in-progress tree** alongside the **current tree** (double buffering). Because work is split into fiber-sized units, React can process some fibers, yield to the browser (letting it handle input), and continue, or abandon the work-in-progress tree if something more urgent arrives. When finished, the work-in-progress tree becomes the current tree in the commit.

**4. Commit phase (synchronous, not interruptible)**
1. **Mutation**: apply DOM insertions, updates and deletions; run cleanup of removed components' effects/refs.
2. **Layout**: attach refs; run **`useLayoutEffect`** callbacks (and class `componentDidMount/Update`) synchronously, before the browser paints. Use for measuring DOM and synchronously adjusting layout to avoid flicker (e.g. positioning a tooltip).
3. **Browser paints.**
4. **Passive effects**: **`useEffect`** callbacks run after paint (asynchronously), for subscriptions, fetching, logging. (If an update inside a discrete event like a click needs them, React may flush them earlier.)

```tsx
function Example() {
  console.log('render');                       // render phase (may run twice in StrictMode)
  useLayoutEffect(() => { console.log('layout effect'); });   // commit, before paint
  useEffect(() => { console.log('effect'); });                 // after paint
  return <div ref={(el) => console.log('ref', !!el)} />;      // refs attached in commit
}
// Order: render → ref true → layout effect → (paint) → effect
```

**5. Batching**
```tsx
function onClick() {
  setCount((c) => c + 1);
  setFlag(true);
  // one render, not two
}
```
Since React 18 with `createRoot`, updates in promises, timeouts and native handlers are batched too (automatic batching). `flushSync` forces a synchronous render when truly needed.

**6. Concurrent rendering**
React 18+ can treat updates with different priorities:
- **Urgent** updates (typing, clicking) render immediately.
- **Transitions** (`startTransition(() => setFilter(x))`) are interruptible: React renders them in the background and discards the work if the user types again, keeping input responsive.
- **`useDeferredValue`** lets a slow part of the UI lag behind a fast input.
- **Suspense** lets components 'wait' for data or code; React shows fallbacks and can keep showing old UI during transitions.
All of this relies on the render phase being pure and interruptible, with only the commit being synchronous.

**7. Applying the model to performance**
- Re-rendering isn't automatically expensive: if the reconciled output is the same, the DOM isn't touched. Cost comes from rendering many components or expensive computations during render.
- Reduce unnecessary renders: keep state close to where it's used, split contexts, memoize expensive children (`React.memo`, `useMemo`), or rely on the **React Compiler** to auto-memoize.
- Use the **React DevTools Profiler** to see which components rendered, why, and how long they took."

#### Another worked example: a side effect in render
"A component called `analytics.track('viewed')` directly in its body. In development with StrictMode it fired twice; in production, with concurrent features, it occasionally fired for renders that were discarded during transitions, inflating metrics. Moving the call into `useEffect` (which runs once per commit) fixed both. The rule: anything observable outside React belongs in effects or event handlers, never in render."

#### A third worked example: tooltip flicker
"A tooltip positioned itself in `useEffect` by measuring its trigger. Users saw it flash at the top-left corner for one frame before jumping into place, because `useEffect` runs after paint. Measuring and positioning in `useLayoutEffect` (before paint) removed the flicker. I use useLayoutEffect sparingly because it blocks painting, but measurement-then-position is exactly its job."

#### Variations you might be asked
- "Does setState update state immediately?": no; it schedules an update. The new value is available on the next render; reading state right after setState gives the old value.
- "What's the difference between rendering and committing for memo?": `React.memo` skips the render phase for a component whose props are shallowly equal; commit only happens for changes found during render.
- "What happens when a component throws during render?": React unwinds to the nearest error boundary, which renders its fallback; with Suspense, a thrown promise shows the nearest Suspense fallback.

#### Step-by-step framework
1. **Triggers** of rendering.
2. **Render phase**: calling components, reconciliation, purity.
3. **Fiber** and interruptible work.
4. **Commit phase**: mutations, layout effects, paint, passive effects.
5. **Batching and concurrent features.**
6. **Performance implications** and profiling.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "React re-renders when props change" | Lists real triggers (state, parent, context, stores) |
| Render = DOM update | Separates render (compute) and commit (apply) |
| No idea why purity matters | Explains interruptible/discarded renders, StrictMode |
| Confuses effect timings | useLayoutEffect before paint, useEffect after |
| No performance link | Profiler, state colocation, memo/Compiler |

#### Useful phrases
- "Rendering is React calling my components; committing is React updating the DOM."
- "The render phase must be pure because React may run it more than once or throw it away."
- "Layout effects run before paint; regular effects run after."
- "A re-render that produces the same output doesn't touch the DOM."

#### Common pitfalls
- **Side effects in render.**
- **Assuming setState is synchronous.**
- **Overusing useLayoutEffect.**
- **Blaming 'too many renders' without profiling.**

#### Follow-ups to expect (with sample answers)
- **"Why does StrictMode run effects twice in development?"**
  "It mounts, unmounts and remounts components to verify effects clean up correctly, preparing for features like Offscreen/Activity that preserve state while hidden."
- **"What's the virtual DOM?"**
  "The tree of React elements describing UI; React compares new and old trees to compute minimal DOM changes. 'Virtual DOM' is a loose term for that process."
- **"How does React decide priority?"**
  "Updates are assigned lanes: discrete events (clicks, typing) are high priority, transitions lower, idle work lowest; the scheduler processes higher lanes first."

#### What senior interviewers look for
- **Accurate internals at the right depth.**
- **Connecting internals to real bugs and performance.**
- **Modern React knowledge** (concurrency, Compiler).

#### Practise it
1. Log render, ref, layout effect and effect order in a demo component, with and without StrictMode.
2. Profile an app with React DevTools and explain why each component rendered.
3. Explain render vs commit phase, out loud, in 90 seconds.

## Difference between useMemo and useCallback. When does each help?
- id: 09fdfa86-8ffc-4be2-bcbd-4995190f1825
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, performance, hooks
- companies: Meta, OpenAI, Apple

### Prompt
What's the difference between `useMemo` and `useCallback`? When do they actually improve performance, when are they useless or harmful, and how does the React Compiler change this? Many developers misuse both.

### Answer
#### What the interviewer is really testing
- Understanding that both hooks **cache values between renders** based on dependencies.
- Knowing they help mainly for **expensive computations** and **referential stability** (memoized children, effect dependencies).
- Recognising **overuse**: wrapping everything costs memory and readability without benefit.
- Correct **dependency arrays** and the stale closure risks.
- Awareness of the **React Compiler** making manual memoization largely unnecessary.

#### Key points
- **`useMemo(fn, deps)`** caches the **result of calling `fn`**; recomputes only when a dependency changes (compared with `Object.is`).
- **`useCallback(fn, deps)`** caches the **function itself**; equivalent to `useMemo(() => fn, deps)`.
- They help in two situations: (1) **expensive calculations** during render; (2) **referential equality** when a value or function is passed to a **`React.memo` child**, used as an **effect dependency**, or used as a dependency of other hooks/context values.
- Passing a memoized callback to a **non-memoized** child (or a DOM element) gives **no benefit**.
- They have costs: memory, dependency comparisons, code complexity; they're **hints**, not guarantees (React may discard caches).
- **Fix the root cause first**: move state down, lift content up (children as props), split components, avoid creating new objects needlessly.
- The **React Compiler** (React 19 era) automatically memoizes components and values, removing most manual useMemo/useCallback.

#### Model answer
"Both hooks remember something between renders and only recalculate when their dependencies change. The difference is what they remember: `useMemo` remembers a computed value; `useCallback` remembers a function.

```tsx
const sorted = useMemo(() => sortProducts(products, sortKey), [products, sortKey]);   // cached value
const handleSelect = useCallback((id: string) => setSelected(id), []);               // cached function
// useCallback(fn, deps) is the same as useMemo(() => fn, deps)
```

**Why this matters at all:** every render creates new objects, arrays and functions. Usually that's fine. It matters only when:

**1. The calculation is genuinely expensive:**
```tsx
function Report({ transactions, filter }: Props) {
  // filtering and aggregating 50,000 rows takes ~40 ms
  const summary = useMemo(() => summarise(transactions, filter), [transactions, filter]);
  const [hovered, setHovered] = useState<string | null>(null);   // hovering re-renders, but summary is cached
  ...
}
```
Without `useMemo`, every hover (unrelated state) would recompute the summary. 'Expensive' means measurably slow (think >1 ms in profiling), not 'a `.map` over 20 items'.

**2. Referential stability is required:**
```tsx
const Row = React.memo(function Row({ item, onSelect }: RowProps) { ... });

function List({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string>();
  const onSelect = useCallback((id: string) => setSelected(id), []);   // same function every render
  return items.map((item) => <Row key={item.id} item={item} onSelect={onSelect} />);
}
```
`React.memo` skips re-rendering a row when its props are shallowly equal. Without `useCallback`, `onSelect` would be a new function each render, so every row would re-render anyway, making the `memo` useless.

Effect dependencies:
```tsx
const options = useMemo(() => ({ userId, includeArchived }), [userId, includeArchived]);
useEffect(() => { fetchOrders(options).then(setOrders); }, [options]);
// without useMemo, options is a new object each render → effect runs every render (possibly an infinite loop)
```
(Often simpler: depend on the primitives directly: `[userId, includeArchived]`.)

Context values:
```tsx
const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// a new object every render would re-render every consumer
```

**When they're useless or harmful:**
```tsx
// Useless: Button isn't memoized, so a stable function changes nothing
const onClick = useCallback(() => setOpen(true), []);
return <button onClick={onClick}>Open</button>;

// Useless: trivial computation; the hook costs more than the work
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
```
Costs of overuse:
- Extra memory and dependency comparisons on every render.
- **Harder-to-read code**, and **dependency bugs**: a missing dependency returns a stale value or a callback with stale state (the exhaustive-deps lint rule helps).
- False sense of optimisation while the real problem (a huge component re-rendering on every keystroke) remains.
- React treats them as performance hints; caches can be discarded (e.g. offscreen), so never rely on them for correctness.

**Better fixes often come first:**
1. **Move state down**: if only the search box needs `query`, keep it in a `SearchBox` component so typing doesn't re-render the whole page.
2. **Lift content up / pass children**: a component that changes often can render `children` passed from a parent; those children aren't re-rendered by the child's state changes.
3. **Split contexts** so frequently changing values don't re-render all consumers.
4. **Virtualise long lists** rather than memoizing thousands of rows.
5. **Measure** with the React DevTools Profiler before and after.

**The React Compiler:** React's compiler analyses components at build time and automatically memoizes values, callbacks and JSX where safe, effectively applying `useMemo`/`useCallback`/`memo` everywhere it helps. With it enabled, I'd stop adding manual memoization in new code and keep existing hooks only where needed for effect semantics. It requires components to follow the Rules of React (pure render, no mutation of props/state).

**My rule of thumb:** use `useMemo` for measured expensive calculations and for values that must be referentially stable (context values, effect deps, props to memoized children); use `useCallback` only when the function goes to a memoized child, an effect dependency or another hook's dependency list. Otherwise, skip them, or let the Compiler handle it."

#### Another worked example: a typing lag fix
"A dashboard's search input lagged badly. Profiling showed every keystroke re-rendered a chart component that recomputed aggregates for 30,000 points (~50 ms). Wrapping the aggregation in `useMemo` keyed on the data and date range (not the search query) and memoizing the chart with `React.memo` (with stable callbacks via `useCallback`) dropped keystroke render time to ~4 ms. We later moved search state into its own component, which removed the dependency entirely."

#### A third worked example: removing useless memoization
"A codebase wrapped nearly every function in useCallback and every derived value in useMemo, 'for performance'. Profiling showed no measurable gain, and several bugs came from stale dependencies (a callback captured an old filter value). We removed memoization except where profiling justified it, enabled the exhaustive-deps lint rule, and later adopted the React Compiler. Code became simpler and the stale-callback bugs disappeared."

#### Variations you might be asked
- "Is useMemo a semantic guarantee?": no; React may discard memoized values, so code must still work if the computation re-runs.
- "What's the difference between React.memo and useMemo?": React.memo memoizes a component's render output based on props; useMemo memoizes a value inside a component.
- "How do you keep a callback stable but always read latest state?": use functional updates (`setX(prev => ...)`) or a ref holding the latest value; React's `useEffectEvent` (experimental/new) addresses this for effects.

#### Step-by-step framework
1. **Define both hooks** and their relationship.
2. **Expensive computation use case.**
3. **Referential stability use cases** (memo children, effect deps, context).
4. **Useless and harmful cases.**
5. **Root-cause fixes** before memoization.
6. **React Compiler** and a rule of thumb.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "useCallback makes functions faster" | Explains referential stability purpose |
| Wraps everything | Uses only for measured cost or required stability |
| Memoized callback to non-memo child | Knows it's useless without memo |
| Ignores dependency bugs | Exhaustive-deps, stale closure awareness |
| Unaware of the Compiler | Explains auto-memoization impact |

#### Useful phrases
- "useMemo caches a value; useCallback caches a function."
- "A stable callback only helps if the child is memoized or the function is a dependency."
- "I profile first; memoization isn't free."
- "Often moving state down fixes the problem without any memoization."

#### Common pitfalls
- **Memoizing trivial work.**
- **Missing dependencies** causing stale values.
- **Memo without stable props.**
- **Using memoization to paper over architecture problems.**

#### Follow-ups to expect (with sample answers)
- **"How does React compare dependencies?"**
  "With Object.is for each item in the array; objects and functions compare by reference."
- **"Will useMemo prevent child re-renders by itself?"**
  "No; the child must be memoized (React.memo) and receive the memoized value as a prop."
- **"What does the React Compiler need from my code?"**
  "Components and hooks that follow the Rules of React: pure render, no mutating props/state, hooks called unconditionally. It can bail out of components that break the rules."

#### What senior interviewers look for
- **Precise understanding** of why and when.
- **Profiling-driven decisions.**
- **Modern React awareness.**

#### Practise it
1. Profile a list with React.memo rows, with and without useCallback on the handler.
2. Fix a re-rendering problem by moving state down instead of memoizing.
3. Explain when useCallback is pointless, out loud.

## What is useTransition and when do you use it?
- id: a7945ea3-9fec-4ba6-a252-f0c0cabdcaa8
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, concurrent, performance
- companies: Meta, Anthropic

### Prompt
What does `useTransition` do in React 18+? How is it different from debouncing, and from `useDeferredValue`? Show an example where it improves responsiveness, explain `isPending`, and describe its limitations, including how transitions interact with Suspense and async actions in React 19.

### Answer
#### What the interviewer is really testing
- Understanding **concurrent rendering** and **update priorities**.
- Knowing what transitions **do** (interruptible, low-priority renders) and **don't** do (make slow code fast, delay network requests).
- Choosing between **useTransition, useDeferredValue and debouncing**.
- Using **isPending**, Suspense integration, and React 19 **async transitions/Actions**.

#### Key points
- `const [isPending, startTransition] = useTransition()`; updates inside `startTransition` are marked **non-urgent**.
- **Urgent updates** (typing, clicking) render immediately; **transition updates** render in the background and can be **interrupted** and restarted if new urgent input arrives.
- Keeps inputs **responsive** when an update causes an expensive re-render (filtering a big list, switching tabs with heavy content, charts).
- **`isPending`** lets you show a subtle pending indicator while keeping the old UI visible.
- With **Suspense**, transitions keep the **previous content visible** instead of showing fallbacks for already-revealed content.
- **Not debouncing**: work isn't delayed by a fixed time; it starts immediately and is interruptible. Network requests aren't reduced (debounce still useful for API calls).
- **`useDeferredValue(value)`** defers a value you receive (e.g. a prop) when you don't control the state update.
- Transitions don't make expensive renders cheaper, they just schedule them better; still memoize/virtualise.
- **React 19**: `startTransition` accepts **async functions** (Actions); `isPending` stays true until the async work and resulting updates finish.
- Can't use transitions for controlled input values (the input's own state must update urgently).

#### Model answer
"`useTransition` lets me tell React that a state update is not urgent. React then keeps urgent updates (like typing) snappy and renders the non-urgent update in the background, abandoning that work if more urgent input comes in.

**The problem it solves:**
```tsx
function ProductSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const filtered = filterAndRank(products, query);   // 10,000 products, ~80 ms per render
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ProductList items={filtered} />
    </>
  );
}
```
Every keystroke re-renders the expensive list synchronously, so typing lags: each character appears only after ~80 ms of rendering.

**With useTransition:**
```tsx
function ProductSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');          // urgent: what's in the input
  const [listQuery, setListQuery] = useState('');  // non-urgent: what the list shows
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => filterAndRank(products, listQuery), [products, listQuery]);

  return (
    <>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);                         // renders immediately
          startTransition(() => setListQuery(e.target.value));  // interruptible background render
        }}
      />
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        <ProductList items={filtered} />
      </div>
    </>
  );
}
```
What happens when the user types 'react' quickly:
1. Each keystroke updates `query` urgently, so the input stays responsive.
2. The list render for 'r' starts in the background.
3. When 'e' arrives, React interrupts the 'r' render (throws it away) and starts on 're'.
4. Only the final render for the latest value usually completes; meanwhile `isPending` is true and the old list stays visible (dimmed).

**How it differs from debouncing:**
| | Debounce | useTransition |
|---|---|---|
| Delay | Fixed wait (e.g. 300 ms) before doing anything | Starts immediately, interruptible |
| Fast devices | Still wait the full delay | Update appears as soon as it's rendered |
| Reduces network calls | Yes | No |
| Keeps input responsive during heavy render | Partly | Yes |

So for an expensive **local render**, transitions are better; for **network requests**, I still debounce (and abort stale requests), possibly combined with a transition for rendering results.

**useDeferredValue: when you don't own the state update:**
```tsx
function ResultsList({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);   // lags behind during heavy renders
  const items = useMemo(() => search(deferredQuery), [deferredQuery]);
  const isStale = query !== deferredQuery;
  return <List items={items} style={{ opacity: isStale ? 0.6 : 1 }} />;
}
```
It's the same mechanism from the other side: the parent updates `query` urgently, and this component renders the expensive part with a deferred copy. Use it when the value arrives as a prop or from a hook you don't control.

**Transitions and Suspense:**
```tsx
function Tabs() {
  const [tab, setTab] = useState('overview');
  const [isPending, startTransition] = useTransition();
  return (
    <>
      <TabButtons onSelect={(t) => startTransition(() => setTab(t))} pending={isPending} />
      <Suspense fallback={<Spinner />}>
        {tab === 'overview' ? <Overview /> : <Analytics />}   {/* Analytics suspends while loading */}
      </Suspense>
    </>
  );
}
```
Without a transition, switching to a tab that suspends replaces the current content with the spinner. With a transition, React keeps showing the current tab (with `isPending` true) until the new one is ready, avoiding a jarring flash of loading state. Router navigations in frameworks like Next.js are wrapped in transitions for this reason.

**React 19 async transitions (Actions):**
```tsx
const [isPending, startTransition] = useTransition();
function onSave() {
  startTransition(async () => {
    const error = await saveProfile(form);       // async work inside the transition
    if (error) setError(error);
    else router.refresh();
  });
}
<button disabled={isPending}>{isPending ? 'Saving…' : 'Save'}</button>
```
`isPending` stays true for the whole async action, giving built-in pending state; `useActionState` and form actions build on this.

**Limitations:**
- It doesn't make rendering cheaper; a 2-second render is still 2 seconds of CPU work (now interruptible). Combine with memoization, virtualisation or moving work to a worker.
- Controlled input values must not be updated in a transition (the input would lag or behave oddly).
- Updates inside `setTimeout` within the transition callback aren't marked as transitions (pre-React 19 async rules); keep the state update directly inside.
- Works only with concurrent rendering (`createRoot`)."

#### Another worked example: a heavy tab switch
"An admin app's 'Analytics' tab rendered 12 charts (~300 ms). Clicking it froze the tab bar, and rapid clicks between tabs queued slow renders. Wrapping `setActiveTab` in `startTransition` kept the tab buttons responsive, showed a pending indicator on the clicked tab, and cancelled the analytics render if the user clicked elsewhere before it finished. INP for tab clicks dropped from ~350 ms to under 100 ms."

#### A third worked example: when a transition wasn't the answer
"A team wrapped a search API call's state update in startTransition expecting fewer requests. It didn't reduce requests at all, because transitions affect rendering, not when effects or fetches run. We added a 250 ms debounce and AbortController for the network side and kept the transition for rendering the large results list."

#### Variations you might be asked
- "Is startTransition without the hook useful?": yes, the standalone `startTransition` import marks updates as transitions when you don't need `isPending` (e.g. outside components).
- "What's the priority model?": discrete input (clicks, typing) gets high priority lanes; transitions use lower lanes that can be interrupted.
- "How do transitions affect useEffect?": effects run after the transition commits; discarded renders never run effects.

#### Step-by-step framework
1. **Explain urgent vs non-urgent updates.**
2. **Show a laggy example** and the transition fix.
3. **Explain interruption and isPending.**
4. **Compare with debouncing and useDeferredValue.**
5. **Suspense and React 19 async transitions.**
6. **Limitations.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It makes renders faster" | Schedules and interrupts, doesn't speed up |
| Wraps the input's own state | Keeps input urgent, transitions the expensive state |
| Same as debounce | Explains differences and when to use each |
| Ignores Suspense | Keeps old UI visible instead of fallbacks |
| Unaware of React 19 | Async transitions and Actions |

#### Useful phrases
- "Typing stays urgent; the expensive list update is a transition."
- "React throws away outdated transition renders when new input arrives."
- "Transitions don't reduce network calls, so I still debounce requests."
- "With Suspense, a transition keeps the current screen visible while the next one loads."

#### Common pitfalls
- **Transitioning controlled input state.**
- **Expecting fewer API calls.**
- **No pending feedback.**
- **Using transitions to hide fundamentally slow renders** instead of fixing them.

#### Follow-ups to expect (with sample answers)
- **"When would you use useDeferredValue instead?"**
  "When I receive the changing value as a prop or from a library hook and can't wrap its setter."
- **"Does a transition delay rendering on fast machines?"**
  "No; if the render finishes quickly, the update shows almost immediately, unlike a fixed debounce delay."
- **"How do you test transitions?"**
  "In tests, wrap interactions with act and assert final UI; for responsiveness, profile INP and use the React Profiler to see interrupted renders."

#### What senior interviewers look for
- **Correct concurrency model.**
- **Tool selection judgement.**
- **Awareness of limits.**

#### Practise it
1. Build the laggy search, then fix it with useTransition and compare with debounce.
2. Use a transition for a Suspense tab switch and observe the difference.
3. Explain transitions vs debouncing, out loud.

## Server Components vs Client Components in Next.js 15. When use which?
- id: f111d00a-0b4b-426b-bcac-956e7a52c1b1
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: hard
- levels:
- tags: React, Next.js, RSC
- companies: OpenAI, Anthropic

### Prompt
Explain React Server Components and how they differ from Client Components in the Next.js App Router. What can each do, how do you compose them, where does data fetching happen, what are Server Actions, and what are common mistakes (such as marking too much as "use client" or leaking secrets)?

### Answer
#### What the interviewer is really testing
- A clear model of **where code runs** (server-only vs client + server) and what ships to the browser.
- **Capabilities and restrictions** of each component type.
- **Composition patterns**: client boundaries, passing server components as children, serialisable props.
- **Data fetching, caching and mutations** with Server Actions.
- **Pitfalls**: client boundary creep, non-serialisable props, secrets, waterfalls, hydration.

#### Key points
- **Server Components (default in App Router)**: run only on the server (at build or request time); their code **never ships to the browser**; can be `async`, access databases, file system and secrets directly; **can't use state, effects, event handlers or browser APIs**.
- **Client Components** (`'use client'` at the top of a file): rendered on the server for initial HTML **and** hydrated in the browser; can use state, effects, event handlers, browser APIs, context; their code is in the JS bundle.
- `'use client'` marks a **boundary**: that module and everything it imports become client code.
- **Composition**: Server Components can render Client Components; Client Components **can't import** Server Components but **can receive them as children/props**.
- Props from server to client must be **serialisable** (no functions except Server Actions, no class instances).
- **Data fetching** happens in Server Components (async/await), close to the data, reducing client JS and waterfalls; use `Suspense` for streaming.
- **Server Actions** (`'use server'`) are functions callable from client forms/handlers that run on the server for mutations; must validate input and check auth.
- **`server-only`** package prevents server modules (secrets) being imported into client code.
- Caching and revalidation (`revalidatePath`, `revalidateTag`, fetch cache options) control freshness.
- Default to Server Components; add `'use client'` at the **leaves** that need interactivity.

#### Model answer
"In the App Router, every component is a Server Component unless I opt into the client with `'use client'`. The main question for each piece of UI is: does it need interactivity or browser APIs? If not, it stays on the server, which means its code never ships to the browser.

**Server Components:**
```tsx
// app/products/[id]/page.tsx — Server Component (default)
import { db } from '@/lib/db';                 // direct database access, never bundled for the client
import { AddToCartButton } from './AddToCartButton';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();
  return (
    <article>
      <h1>{product.name}</h1>
      <Price amount={product.price} />                          {/* server component */}
      <Markdown content={product.description} />                {/* heavy markdown lib stays on server */}
      <AddToCartButton productId={product.id} />                {/* client island */}
    </article>
  );
}
```
- Can be `async` and await data directly.
- Can use secrets, databases, internal services, the file system.
- Heavy dependencies (markdown parsers, date libraries, syntax highlighters) used only for rendering add **zero client JavaScript**.
- Can't use `useState`, `useEffect`, event handlers, context providers, or browser APIs.

**Client Components:**
```tsx
'use client';
import { useState, useTransition } from 'react';
import { addToCart } from './actions';

export function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await addToCart(productId); setAdded(true); })}
    >
      {added ? 'Added ✓' : isPending ? 'Adding…' : 'Add to cart'}
    </button>
  );
}
```
- Rendered to HTML on the server for the first load, then **hydrated** in the browser, so their code ships in the bundle.
- Can use state, effects, handlers, browser APIs and context.

**Comparison:**
| | Server Component | Client Component |
|---|---|---|
| Runs | Server only | Server (SSR) + browser |
| Ships JS to browser | No | Yes |
| async/await data | Yes | Via hooks/libraries |
| Secrets/DB access | Yes | No |
| State, effects, handlers | No | Yes |
| Browser APIs | No | Yes (in effects/handlers) |

**Composition rules:**
1. `'use client'` creates a boundary: the file and **everything it imports** become client code. So put it as low in the tree as possible (on the button, not the page).
2. A Client Component **can't import** a Server Component, but it can **render Server Components passed as children**:
```tsx
// Server Component
<Modal trigger="Details">
  <ProductSpecs id={id} />          {/* still a Server Component, rendered on the server */}
</Modal>

// Modal.tsx
'use client';
export function Modal({ trigger, children }: { trigger: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>{<button onClick={() => setOpen(true)}>{trigger}</button>}{open && <dialog open>{children}</dialog>}</>;
}
```
3. Props crossing the boundary must be **serialisable**: plain objects, arrays, strings, numbers, Dates, Promises (which can be unwrapped with `use()`), JSX, and Server Actions; not arbitrary functions or class instances.
4. **Context providers** are client components; wrap them in a small client `Providers` component and render server children inside.

**Data fetching and streaming:**
- Fetch in Server Components, close to where data is used; parallelise independent requests (`Promise.all`) to avoid waterfalls.
- Wrap slow parts in `<Suspense>` so the page shell streams immediately and slower sections stream in.
- Client-side fetching (TanStack Query) still fits for highly interactive, frequently updating client state (live dashboards, infinite scrolling with client filters).

**Mutations with Server Actions:**
```ts
// app/products/[id]/actions.ts
'use server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const Input = z.object({ productId: z.string().uuid() });

export async function addToCart(productId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorised');            // actions are public endpoints: check auth
  const { productId: id } = Input.parse({ productId });       // validate input
  await db.cartItem.upsert({ where: { userId_productId: { userId: session.user.id, productId: id } }, create: { userId: session.user.id, productId: id, qty: 1 }, update: { qty: { increment: 1 } } });
  revalidatePath('/cart');
}
```
Server Actions work with `<form action={...}>` (progressive enhancement: forms work before JS loads), `useActionState` and `useOptimistic`. Treat them like public API endpoints: validate, authenticate, authorise.

**Common mistakes:**
- **`'use client'` at the top of the page or layout**, turning the whole tree into client code and losing the benefits. Push interactivity down to leaves.
- **Passing non-serialisable props** (functions, class instances) from server to client.
- **Leaking secrets**: importing a server module with API keys into a client component. Use `import 'server-only'` in server modules so the build fails if that happens; never prefix secrets with `NEXT_PUBLIC_`.
- **Using browser APIs** in Server Components (window, localStorage).
- **Waterfalls**: sequential awaits in nested components; parallelise or use Suspense boundaries.
- **Hydration mismatches** in client components (dates, random values, `typeof window` branches).
- **Over-fetching into client props**: passing a whole database record (including sensitive fields) to a client component serialises it into the page; pass only needed fields (React's taint APIs can help guard).

**When to use which (my default):** Server Components for pages, layouts, data display, static content and heavy rendering; Client Components for interactive leaves: forms with local state, dropdowns, modals, carousels, charts with interaction, anything using browser APIs."

#### Another worked example: shrinking a product page bundle
"A Next.js product page had `'use client'` at the top because one 'Add to cart' button needed state. Everything (markdown rendering, review formatting, date libraries) shipped to the browser: 380 KB of JS. Moving `'use client'` to the button and a small reviews-filter component reduced page JS to 95 KB, improved INP and LCP on mobile, and let the page fetch data directly from the database in the Server Component."

#### A third worked example: a secret nearly leaked
"A developer imported a `lib/payments.ts` module (which read a Stripe secret key from env) into a client component to reuse a helper function. Next.js doesn't expose non-public env vars to the client, so the key was undefined in the browser and the feature broke, but the near-miss prompted us to add `import 'server-only'` to all server modules, making such imports fail at build time with a clear error."

#### Variations you might be asked
- "Are Server Components the same as SSR?": no; SSR renders HTML for initial load (including client components). Server Components are a component type whose code only runs on the server and whose output (RSC payload) is streamed and merged on the client.
- "Can Server Components re-render on the client?": they re-run on the server when navigating or after revalidation (`router.refresh`), and the new payload is merged without losing client state.
- "How do you share code between server and client?": utilities without server-only dependencies can be imported by both; keep server-only code isolated with `server-only`.

#### Step-by-step framework
1. **Define both component types** and where they run.
2. **Capabilities table.**
3. **Composition rules** and serialisable props.
4. **Data fetching and streaming.**
5. **Server Actions** with validation and auth.
6. **Common mistakes** and a default strategy.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Server Components are SSR" | Distinguishes RSC from SSR |
| 'use client' at page level | Client boundaries at leaves |
| Can't explain children composition | Passes server components into client wrappers |
| Server Actions without checks | Validation, auth, revalidation |
| Ignores secrets and serialisation | server-only, minimal props |

#### Useful phrases
- "Server Components never ship their code to the browser."
- "'use client' marks a boundary; everything it imports becomes client code."
- "Client components can't import server components, but they can render them as children."
- "A Server Action is a public endpoint, so I validate and authorise every call."

#### Common pitfalls
- **Client boundary creep.**
- **Non-serialisable props.**
- **Secrets imported into client code.**
- **Sequential data waterfalls.**

#### Follow-ups to expect (with sample answers)
- **"How do you use context with Server Components?"**
  "Create a client Providers component that wraps children; server components render inside it but can't read the context themselves."
- **"What's the RSC payload?"**
  "A serialised description of the server-rendered component tree, including references to client components and their props, streamed to the client."
- **"When would you still fetch on the client?"**
  "For data that changes in response to client interactions frequently, real-time updates, or user-specific polling where server round trips through navigation are awkward."

#### What senior interviewers look for
- **Clear architectural model.**
- **Security awareness.**
- **Performance-conscious boundaries.**

#### Practise it
1. Refactor a page with 'use client' at the top so only interactive leaves are client components.
2. Write a Server Action with Zod validation, auth check and revalidation.
3. Explain RSC vs SSR, out loud.

## You have a list of 10,000 items and the page is janky. Walk through diagnosis.
- id: 087e91d1-987d-4bf6-b9ec-be390bc3dae6
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, performance, virtualization
- companies: Meta, Apple

### Prompt
A page renders a list of 10,000 items and scrolling, filtering and typing feel janky. Walk through how you'd diagnose the problem and the fixes you'd consider, from measuring to virtualisation, memoization, and rethinking whether 10,000 items need to be on the page at all.

### Answer
#### What the interviewer is really testing
- A **measure-first** approach with the right tools.
- Distinguishing **render count** problems from **render cost** and **DOM size** problems.
- Knowing **virtualisation**, memoization, stable keys, and state colocation.
- **Product thinking**: pagination, server-side filtering, progressive loading.

#### Key points
- **Measure**: React DevTools Profiler (which components render, why, how long), Chrome Performance panel (long tasks, scripting vs layout vs paint), INP metrics.
- Categorise: **too many renders** (unstable props, context, parent re-renders), **expensive renders** (heavy computation per item), **too much DOM** (10,000 rows = layout/paint/memory cost), **expensive work outside React** (filtering/sorting on every keystroke).
- Biggest fix for DOM size: **virtualisation/windowing** (TanStack Virtual, react-window, react-virtuoso): render only visible rows plus overscan.
- **Memoize rows** (`React.memo`) with **stable props** (useCallback, IDs instead of objects) and **stable keys**.
- **Move expensive filtering/sorting** into `useMemo`, a transition (`useTransition`/`useDeferredValue`), or a **Web Worker**.
- **State colocation**: keep fast-changing state (hover, input) out of the list's parent.
- CSS: `content-visibility: auto` for simpler cases; avoid expensive styles per row.
- **Product options**: pagination, infinite scroll with server-side filtering, search-first UIs; do users need 10,000 items at once?

#### Model answer
"I'd start by measuring, because 'janky list' can mean very different problems, then fix the biggest bottleneck first.

**Step 1: Reproduce and measure**
- Reproduce on a **realistic device** (mid-range phone or CPU throttling at 4× in DevTools); a fast laptop hides problems.
- **React DevTools Profiler**: record typing in the filter and scrolling. Look at commit durations, which components rendered, and 'Why did this render?' (enable in settings).
- **Chrome Performance panel**: are long tasks dominated by **scripting** (React rendering, filtering), **rendering/layout** (huge DOM), or **painting**?
- Check **DOM node count** (10,000 rows × ~10 nodes = 100,000 nodes).

**Step 2: Categorise the problem**
| Symptom in profiler | Likely cause |
|---|---|
| Every row re-renders on each keystroke | Unstable props, parent state, context |
| Each render is slow even when few components render | Expensive per-render computation |
| Long layout/paint, slow scroll, high memory | Too many DOM nodes |
| Long scripting not in React components | Filtering/sorting/formatting on every change |

**Step 3: Fixes, roughly in order of impact**

**a) Virtualise the list** (usually the biggest win):
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,          // estimated row height
    overscan: 8,                     // extra rows above/below for smooth scrolling
  });
  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((v) => (
          <div key={items[v.index].id}
               style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${v.start}px)` }}>
            <Row item={items[v.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```
Only ~20 rows exist in the DOM instead of 10,000. Rendering, layout, paint and memory all drop dramatically. Considerations: dynamic row heights (measure elements), keyboard navigation and accessibility (`aria-rowcount`/`aria-rowindex` or `aria-setsize`/`aria-posinset`), browser find-in-page doesn't see unrendered rows, and scroll restoration.

**b) Stop unnecessary re-renders:**
```tsx
const Row = React.memo(function Row({ item, onToggle }: { item: Item; onToggle: (id: string) => void }) { ... });

function List({ items }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const onToggle = useCallback((id: string) => {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  ...
}
```
- Pass primitives/IDs or stable objects to rows; avoid inline objects/arrays/functions as props to memoized rows.
- **Stable keys** (item IDs, not indexes) so React doesn't remount rows when filtering or sorting.
- **Colocate state**: hover and input state shouldn't live in the list parent if it forces all rows to re-render.
- **Context**: if rows consume a context that changes often, split it or use a selector-based store (Zustand, `useSyncExternalStore`) so only affected rows update.

**c) Make expensive work cheaper or non-blocking:**
- `useMemo` for filtering/sorting so it doesn't rerun on unrelated renders.
- `useTransition`/`useDeferredValue` so typing stays responsive while the list updates.
- Precompute search keys (lowercased names) once, not per keystroke.
- For very heavy computations (fuzzy search across 100k items), a **Web Worker**.
- Debounce if filtering triggers network requests.

**d) Cheaper rows:** fewer DOM nodes per row, avoid heavy components (tooltips, menus) per row; render them on demand (e.g. one shared menu positioned on click). Avoid expensive CSS (large box-shadows, filters) repeated thousands of times.

**e) Rethink the product:** does anyone need 10,000 items rendered? Options: **pagination**, **infinite loading** from the server, **server-side filtering/search**, grouping/collapsing, a search-first interface. Sometimes the best performance fix is a product decision.

**Step 4: Verify**: re-profile on the throttled device; confirm commit times, scroll FPS, INP and memory improved, and add a performance regression check (e.g. a Playwright test measuring interaction timing, or React Profiler budgets in CI for critical components)."

#### Another worked example: an admin orders table
"An admin table with 8,000 orders took 1.4 s to respond to each filter keystroke and scrolled at ~15 fps. Profiling showed every row re-rendering (inline `onClick` closures and a context holding the hovered row ID) plus 90,000 DOM nodes. We virtualised with TanStack Virtual, memoized rows with stable callbacks, moved hover state into the row itself, and wrapped filtering in `useDeferredValue`. Filter response dropped to ~60 ms and scrolling hit 60 fps on a mid-range laptop with 4× CPU throttling."

#### A third worked example: the product fix
"A logistics dashboard showed all 20,000 shipments on one page because 'users want to see everything'. User research showed people always searched or filtered by status first. We moved filtering server-side with a search-first UI and pagination of 50; performance problems disappeared, and users found shipments faster."

#### Variations you might be asked
- "Virtualise a grid or table?": TanStack Virtual supports rows and columns; keep header cells sticky and maintain table semantics or ARIA grid roles.
- "What about content-visibility instead of virtualisation?": `content-visibility: auto` skips rendering off-screen elements but still creates all DOM nodes and React components; good for long documents, less so for 10,000 interactive rows.
- "How do you handle variable row heights?": measure rendered rows (`measureElement`), cache sizes, and estimate unknown ones.

#### Step-by-step framework
1. **Reproduce on realistic hardware.**
2. **Measure** with React Profiler and Performance panel.
3. **Categorise**: renders, render cost, DOM size, other work.
4. **Fix**: virtualise, memoize with stable props/keys, colocate state, defer/offload work.
5. **Reconsider product design.**
6. **Verify and guard** against regressions.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add React.memo everywhere" | Measures first, categorises the bottleneck |
| Ignores DOM size | Virtualisation with accessibility caveats |
| Memo with unstable props | Stable callbacks, IDs, keys |
| Filtering on every keystroke synchronously | useMemo, deferred value, worker |
| Accepts 10,000 rows as given | Questions the product need |

#### Useful phrases
- "First I find out whether it's render count, render cost or DOM size."
- "Virtualisation keeps only the visible rows in the DOM."
- "React.memo only helps if the props are stable."
- "Sometimes the best performance fix is not rendering 10,000 things."

#### Common pitfalls
- **Profiling on a fast laptop only.**
- **Index keys with filtering.**
- **Context that changes per hover.**
- **Virtualisation that breaks keyboard and screen reader access.**

#### Follow-ups to expect (with sample answers)
- **"What's overscan?"**
  "Extra rows rendered just outside the viewport so fast scrolling doesn't show blank gaps."
- **"How does virtualisation affect accessibility?"**
  "Screen readers only see rendered rows, so set ARIA counts/positions, preserve keyboard navigation, and provide search since find-in-page won't find unrendered items."
- **"How do you prevent regressions?"**
  "Performance tests in CI measuring interaction timings, profiling budgets for critical screens, and RUM monitoring of INP."

#### What senior interviewers look for
- **Structured, measurement-driven debugging.**
- **Broad toolkit.**
- **Product judgement.**

#### Practise it
1. Build a 10,000-row list, profile it, then virtualise and compare.
2. Fix unnecessary row re-renders using the Profiler's 'why did this render'.
3. Walk through your diagnosis steps out loud in 3 minutes.

## How does React reconciliation handle keys? What goes wrong with index-as-key?
- id: db013018-0c2c-4914-a93c-0d28d5f35605
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: easy
- levels:
- tags: React, reconciliation
- companies: Apple, Meta

### Prompt
Explain how React uses keys when reconciling lists. What goes wrong when you use the array index as a key, when is it acceptable, and how can you use keys deliberately to reset component state?

### Answer
#### What the interviewer is really testing
- Understanding that keys define **identity** across renders.
- Concrete bugs from **index keys**: wrong state attached to items, broken inputs, animations, performance.
- Knowing **when index keys are fine**.
- Using **keys to reset state** intentionally, and other key rules (unique among siblings, stable, not random).

#### Key points
- When reconciling a list, React matches old and new children by **key**; matching keys mean "same item": keep its component instance, state and DOM node.
- Keys must be **unique among siblings** and **stable** across renders (IDs from data).
- **Index as key** ties identity to **position**: inserting, deleting, sorting or filtering shifts indexes, so React reuses the wrong instances: **state and DOM (input values, focus, scroll, animations) stick to the wrong items**, and React does more DOM work.
- Index keys are acceptable when the list is **static** (never reordered, filtered or inserted into the middle) and items have **no state**.
- **Random keys** (`Math.random()`, `uuid()` at render) are worse: every render remounts everything.
- **Changing a key** forces a remount: a deliberate way to **reset state** (e.g. `key={userId}` on a form).
- Keys aren't passed as props; use a separate prop if the child needs the ID.

#### Model answer
"Keys tell React which item is which between renders. When a list changes, React matches old children to new children by key: same key means same item, so React keeps that component's state and DOM node and just updates its props. Without good keys, React matches by position.

**The index-key bug:**
```tsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 'a', text: 'Buy milk' },
    { id: 'b', text: 'Walk dog' },
  ]);
  return (
    <>
      <button onClick={() => setTodos((t) => [{ id: crypto.randomUUID(), text: 'New todo' }, ...t])}>Add to top</button>
      {todos.map((todo, index) => (
        <TodoItem key={index} todo={todo} />     // index as key
      ))}
    </>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const [note, setNote] = useState('');          // local state per item
  return <li>{todo.text} <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note" /></li>;
}
```
Type a note on 'Buy milk' (index 0), then click 'Add to top':
- New list: `['New todo', 'Buy milk', 'Walk dog']` with keys `0, 1, 2`.
- React sees key 0 still exists, so it keeps the **instance at key 0** (which holds the note you typed) and gives it the new props ('New todo').
- Result: your note now appears next to 'New todo'; 'Buy milk' gets the old 'Walk dog' instance's empty state. State is attached to positions, not items.

With `key={todo.id}`, React sees a new key 'x' at the top and keys 'a' and 'b' moved down, so it creates one new instance and moves the existing ones. Notes stay with their items.

**Things that break with index keys when lists change:**
- Local component state (inputs, toggles, expanded/collapsed).
- Uncontrolled input values and **focus** (focus jumps to a different item).
- **Animations/transitions** (wrong elements animate).
- Third-party widgets holding DOM state.
- Performance: React may update every item's content instead of moving a few DOM nodes.

**When index keys are acceptable:**
- The list is **static** or only appended to at the end, **never** reordered, filtered or inserted into, and items have no internal state or uncontrolled inputs. For example, rendering fixed breadcrumbs or a read-only list of paragraphs.
- If items have no IDs, generate them **once when the data is created or loaded** (not during render), e.g. assign `crypto.randomUUID()` when adding a todo or when receiving API data.

**Never use random keys at render:**
```tsx
{items.map((item) => <Row key={Math.random()} item={item} />)}   // remounts every row every render
```
This destroys and recreates every component and DOM node on each render: lost state, lost focus, poor performance.

**Keys to reset state deliberately:**
```tsx
<ProfileForm key={selectedUserId} user={user} />
```
When `selectedUserId` changes, the key changes, so React unmounts the old form and mounts a fresh one with clean state. This is cleaner than a `useEffect` that resets each field when the user changes (which renders stale values for a frame and is error-prone). Same trick for resetting a chat input per conversation, a wizard per order, or an animation.

**Other key rules:**
- Unique among **siblings** only (not globally).
- Put the key on the element returned from `map`, not inside the child.
- `key` isn't available as a prop inside the component; pass `id` separately if needed.
- With Fragments in a list, use `<Fragment key={id}>`.
- Keys also matter outside lists: the same component at the same position keeps state; changing type or key resets it."

#### Another worked example: a sortable table bug
"A sortable table with inline-editable cells used index keys. After sorting by price, the input a user was editing (with unsaved text) stayed in position 3 but now belonged to a different product; saving updated the wrong product. Switching to `key={row.id}` fixed it; the edit state now moved with its row. A data integrity bug caused by one key choice."

#### A third worked example: resetting a form with a key
"A customer details panel let support agents switch customers in a sidebar. The form used local state initialised from props, so switching customers kept the previous customer's edits visible. Adding `key={customer.id}` to the form remounted it per customer with correct initial values, and removed a buggy useEffect that tried to sync state from props."

#### Variations you might be asked
- "Why does React warn about missing keys?": without keys it falls back to index matching, which causes the bugs above; the warning encourages stable identity.
- "Can keys be non-strings?": keys are coerced to strings; numbers work if unique and stable.
- "What if two items share an ID?": duplicate keys cause unpredictable behaviour and warnings; deduplicate data or combine fields to make unique keys.

#### Step-by-step framework
1. **Explain identity matching** by key.
2. **Show the index-key bug** with state.
3. **List what breaks.**
4. **When index keys are OK** and how to generate IDs properly.
5. **Random keys anti-pattern.**
6. **Keys for resetting state** and other rules.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Keys remove the warning" | Explains identity and state preservation |
| "Index keys are slower" only | Shows state attaching to wrong items |
| Uses Math.random() | Stable IDs generated at data creation |
| Never index | Knows when index keys are fine |
| Resets state with effects | Uses key to remount deliberately |

#### Useful phrases
- "Keys are identity: same key, same component instance and state."
- "Index keys tie state to positions, so inserting or sorting moves state to the wrong items."
- "Random keys remount everything on every render."
- "Changing the key is the cleanest way to reset a component's state."

#### Common pitfalls
- **Index keys in dynamic lists.**
- **Keys generated during render.**
- **Duplicate keys.**
- **Syncing state from props with effects** instead of keying.

#### Follow-ups to expect (with sample answers)
- **"Does the key need to be globally unique?"**
  "No, only among siblings in the same list."
- **"How does React move DOM nodes when keys reorder?"**
  "It matches keys, keeps existing nodes, and inserts/moves them to the new positions rather than recreating them."
- **"Can I access key inside the component?"**
  "No; it's used by React only. Pass the ID as a separate prop."

#### What senior interviewers look for
- **Clear identity model.**
- **Real bug awareness.**
- **Deliberate use of keys.**

#### Practise it
1. Reproduce the todo note bug with index keys, then fix it.
2. Use a key to reset a form when the selected record changes.
3. Explain when index keys are acceptable, out loud.

## How do you handle race conditions in useEffect that fires fetches?
- id: 6f3b563a-8668-49cf-8e66-2a795bea7264
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, race-conditions, hooks
- companies: Meta, Anthropic

### Prompt
A component fetches data in `useEffect` whenever an ID or query changes. Explain the race condition this can cause, and show how to fix it with an ignore flag, `AbortController`, and data-fetching libraries. Also cover StrictMode double effects and setting state after unmount.

### Answer
#### What the interviewer is really testing
- Understanding **why responses can arrive out of order** and overwrite newer data.
- Using **effect cleanup** correctly to ignore or cancel stale requests.
- **AbortController** usage, including handling `AbortError`.
- Knowing that **data-fetching libraries** (TanStack Query, SWR, framework loaders, RSC) solve this and more.
- Awareness of **StrictMode** double-invocation in development.

#### Key points
- If `userId` changes from 1 to 2 quickly, request 1 may resolve **after** request 2; without protection, the UI shows user 1's data for user 2: a **race condition**.
- The effect **cleanup** runs before the next effect (and on unmount): use it to mark the previous request as stale or abort it.
- **Ignore flag**: `let ignore = false; ... if (!ignore) setData(...); return () => { ignore = true; }`.
- **AbortController**: cancel the network request in cleanup; catch and ignore `AbortError`. Saves bandwidth and server work.
- Also handle **loading and error states**, and reset data appropriately when the key changes.
- **StrictMode** (development) mounts, unmounts and remounts effects, so you'll see a request start and abort; correct cleanup makes this harmless.
- "Can't set state on unmounted component" warnings are gone in React 18, but stale updates are still bugs.
- Prefer **TanStack Query/SWR** or framework data loading (Server Components, route loaders) for caching, dedupe, retries and race handling.

#### Model answer
"The race happens because network responses don't come back in the order requests were sent.

**The buggy version:**
```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then(setUser);              // sets whatever arrives, even if it's outdated
  }, [userId]);
  return user ? <Profile user={user} /> : <Spinner />;
}
```
Timeline when switching quickly from user 1 to user 2:
```
t=0    request A: /users/1 (slow: 800 ms)
t=100  userId → 2, request B: /users/2 (fast: 200 ms)
t=300  B resolves → setUser(user 2)   ✓
t=800  A resolves → setUser(user 1)   ✗ the page now shows user 1 while the URL says user 2
```

**Fix 1: ignore stale responses with cleanup:**
```tsx
useEffect(() => {
  let ignore = false;
  setUser(null);                                   // or keep previous data with a stale indicator
  fetch(`/api/users/${userId}`)
    .then((r) => r.json())
    .then((data) => { if (!ignore) setUser(data); });
  return () => { ignore = true; };                 // runs before the next effect and on unmount
}, [userId]);
```
When `userId` changes, React runs the previous effect's cleanup, marking that request's result as stale; only the latest effect's result is applied.

**Fix 2: abort the request with AbortController:**
```tsx
useEffect(() => {
  const controller = new AbortController();
  setStatus('loading');
  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => { setUser(data); setStatus('success'); })
    .catch((err) => {
      if (err.name === 'AbortError') return;      // expected when superseded or unmounted
      setError(err);
      setStatus('error');
    });
  return () => controller.abort();
}, [userId]);
```
Benefits over the flag: the browser actually cancels the request (saving bandwidth and possibly server work), and it's the same mechanism used for timeouts. Remember: `fetch` rejects with `AbortError` on abort, which must not be shown as an error.

With async/await inside an effect:
```tsx
useEffect(() => {
  const controller = new AbortController();
  (async () => {
    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      setData(data);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(e as Error);
    }
  })();
  return () => controller.abort();
}, [url]);
```
(The effect callback itself can't be async because it must return the cleanup function, not a promise.)

**StrictMode in development:** React mounts the component, runs effects, simulates unmount (runs cleanups), then runs effects again. You'll see the first request aborted and a second one made. That's intentional: it proves cleanup works. Don't 'fix' it by removing StrictMode or adding refs to skip the second run.

**Setting state after unmount:** React 18 removed the warning, but the underlying issue (doing work for a component that no longer exists) still matters; aborting in cleanup handles it.

**Better: use a data-fetching library or the framework:**
```tsx
const { data: user, isPending, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: ({ signal }) => fetch(`/api/users/${userId}`, { signal }).then((r) => r.json()),
});
```
TanStack Query (or SWR) handles races (results are keyed by `userId`, so a stale response can't overwrite the current key's data), caching, deduplication of identical requests, retries, background refetching, and passes an AbortSignal. In Next.js App Router, fetching in Server Components or route loaders avoids client-side effect fetching for initial data entirely. The React docs themselves recommend not writing fetch-in-effect by hand for most apps.

**Other details worth mentioning:**
- Decide UX on key change: clear old data (show spinner) or keep it with a 'stale' indicator (`placeholderData: keepPreviousData` in TanStack Query).
- Debounce for search inputs to reduce requests; abort handles ordering.
- Server-side: aborting the client request may not stop server work unless the server listens for disconnects."

#### Another worked example: a chat conversation switcher
"Support agents switching quickly between conversations sometimes saw messages from the previous customer in the new conversation, a privacy issue. The messages effect had no cleanup. Adding AbortController-based cleanup fixed the race; we then moved to TanStack Query keyed by conversation ID, which also cached recently viewed conversations so switching back was instant."

#### A third worked example: StrictMode confusion
"A developer noticed two requests per page load in development and added a `useRef` flag to skip the second effect run. In production (no double invocation) it worked, but it broke when the component remounted legitimately (switching tabs), skipping the fetch. Removing the hack and adding proper abort cleanup made both development and production behave correctly."

#### Variations you might be asked
- "How do you handle races without AbortController (e.g. non-fetch promises)?": the ignore flag, or a request counter/ID comparing against the latest.
- "What about race conditions with user actions (double submit)?": disable buttons while pending, idempotency keys on the server, and ignore duplicate submissions.
- "Can useEffect be async?": no; use an inner async function and return a cleanup.

#### Step-by-step framework
1. **Explain the out-of-order response race** with a timeline.
2. **Fix with ignore flag** in cleanup.
3. **Fix with AbortController**, handling AbortError.
4. **Loading/error/UX on key change.**
5. **StrictMode explanation.**
6. **Recommend libraries/framework data loading.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use async/await" | Explains out-of-order responses |
| No cleanup | Ignore flag or abort in cleanup |
| Shows AbortError as failure | Filters AbortError |
| Disables StrictMode | Understands double effects as a cleanup check |
| Hand-rolls everything | Recommends TanStack Query/SWR/framework loaders |

#### Useful phrases
- "Responses can arrive in a different order from requests."
- "The effect cleanup marks the previous request as stale or aborts it."
- "An aborted fetch rejects with AbortError, which isn't a real error."
- "In production code I'd use TanStack Query, which keys results by the request."

#### Common pitfalls
- **No cleanup in fetching effects.**
- **Treating AbortError as an error.**
- **Async effect callbacks.**
- **Hacks to skip StrictMode double effects.**

#### Follow-ups to expect (with sample answers)
- **"Why does the cleanup run before the next effect?"**
  "React guarantees each effect's cleanup runs before re-running the effect with new dependencies, so resources from the previous run can be released."
- **"Does aborting stop the server work?"**
  "Not necessarily; the server must observe the closed connection and cancel work explicitly."
- **"What's keepPreviousData?"**
  "A TanStack Query option to keep showing the last successful data while fetching a new key, avoiding spinners on pagination."

#### What senior interviewers look for
- **Clear understanding of async timing.**
- **Correct cleanup patterns.**
- **Pragmatic library choices.**

#### Practise it
1. Reproduce the race with artificial delays, then fix with both techniques.
2. Rewrite the component with TanStack Query and compare.
3. Explain why StrictMode runs effects twice, out loud.

## What's wrong with this Search component?
- id: d1bf19a0-b848-45e8-8a3f-5acce1536c6b
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, code-review, race-conditions
- companies: Apple, Meta, Stripe

### Prompt
Review this component. List everything that's wrong or missing, explain the impact of each issue, and write an improved version.

```jsx
function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  useEffect(() => {
    fetch(`/api?q=${query}`).then(r => r.json()).then(setResults);
  }, [query]);
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Answer
#### What the interviewer is really testing
- A **systematic code review**: correctness, performance, UX, accessibility, security.
- Spotting **race conditions** and missing **cleanup**.
- Recognising missing **debounce, empty-query handling, encoding, error and loading states**.
- Writing a **clean improved version** and knowing when to use a library.

#### Key points
- **Results are never rendered** (bug or unfinished).
- **Race condition**: out-of-order responses can show results for an older query; no **abort/cleanup**.
- **No debounce**: a request per keystroke, hammering the API.
- **Empty query** still fetches (`/api?q=`), and very short queries may be pointless.
- **No URL encoding**: `&`, `#`, `?`, spaces break the URL or inject params; use `URLSearchParams`/`encodeURIComponent`.
- **No HTTP error handling**: fetch doesn't reject on 4xx/5xx; `r.json()` may throw on HTML error pages.
- **No loading, empty or error states.**
- **Accessibility**: input has no label; results changes aren't announced; consider combobox semantics if it's an autocomplete.
- **Unhandled promise rejections**; setting state for stale/unmounted requests.
- Other: no caching (repeated queries refetch), state for derived data, StrictMode double requests (fine with cleanup), possibly sync query to URL.
- Better: debounce + AbortController, or TanStack Query with `keepPreviousData`.

#### Model answer
"I'd go through it as I would a real code review, starting with correctness, then performance, UX, accessibility and security.

**1. Results are never rendered.** `results` is stored but the component only returns the input. Either it's unfinished or a bug; I'd ask, and render a results list.

**2. Race condition (correctness).** Typing 'react' fires requests for 'r', 're', 'rea', 'reac', 'react'. Responses can arrive in any order; if 'rea' resolves last, the UI shows results for 'rea' while the input says 'react'. The effect has no cleanup to ignore or abort stale requests.

**3. No debouncing (performance/cost).** One request per keystroke. A 10-character query sends 10 requests, wasting server capacity and bandwidth, and possibly triggering rate limits. Debounce by ~250–300 ms.

**4. Empty and short queries.** On mount (query `''`) it fetches `/api?q=` immediately; clearing the input fetches again. Skip the request (and clear results) for empty queries, maybe require 2+ characters.

**5. No URL encoding (correctness/security).** A query like `shoes & socks` or `50%` or `a#b` produces a malformed URL or injects extra parameters (`q=a&admin=true`). Use `URLSearchParams` or `encodeURIComponent`.

**6. No error handling.** `fetch` only rejects on network failure; a 500 response still resolves, and `r.json()` may throw if the server returns HTML. There's no `.catch`, so failures become unhandled promise rejections and the user sees nothing.

**7. No loading or empty states (UX).** Users can't tell whether a search is running, failed, or returned nothing.

**8. Accessibility.** The input has no label (screen readers announce 'edit text' with no context); result updates aren't announced. If it's an autocomplete with a dropdown, it needs the combobox pattern; for a results list, a polite live region with the result count.

**9. Other improvements:** cache repeated queries (TanStack Query), keep previous results visible while loading the next query to avoid flicker, consider syncing the query to the URL (shareable searches, back button), and in StrictMode the effect runs twice in development, which is fine once cleanup exists.

**Improved version (hand-written):**
```tsx
type Result = { id: string; title: string };
type Status = 'idle' | 'loading' | 'success' | 'error';

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    const params = new URLSearchParams({ q: debouncedQuery });

    fetch(`/api/search?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        return res.json() as Promise<{ results: Result[] }>;
      })
      .then((data) => { setResults(data.results); setStatus('success'); })
      .catch((err) => {
        if (err.name === 'AbortError') return;      // superseded by a newer query or unmounted
        setStatus('error');
      });

    return () => controller.abort();               // cancel stale requests: fixes the race
  }, [debouncedQuery]);

  return (
    <div role="search">
      <label htmlFor="site-search">Search products</label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <p role="status" aria-live="polite" className="visually-hidden">
        {status === 'loading' ? 'Searching…'
          : status === 'success' ? `${results.length} results`
          : status === 'error' ? 'Search failed. Please try again.' : ''}
      </p>
      {status === 'error' && <p className="error">Something went wrong. Try again.</p>}
      {status === 'success' && results.length === 0 && <p>No results for “{debouncedQuery}”.</p>}
      <ul aria-busy={status === 'loading'}>
        {results.map((r) => <li key={r.id}>{r.title}</li>)}
      </ul>
    </div>
  );
}
```

**Production version with TanStack Query** (what I'd actually ship):
```tsx
const { data, isFetching, isError } = useQuery({
  queryKey: ['search', debouncedQuery],
  queryFn: ({ signal }) =>
    fetch(`/api/search?${new URLSearchParams({ q: debouncedQuery })}`, { signal }).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }),
  enabled: debouncedQuery.length >= 2,
  placeholderData: keepPreviousData,       // keep old results visible while fetching new ones
  staleTime: 60_000,                       // cache repeated queries for a minute
});
```
This adds caching, request deduplication, retries and race safety by keying data on the query.

**How I'd phrase the review feedback:** blocking items first (race condition, results not rendered, encoding, error handling), then strongly recommended (debounce, empty query guard, loading/empty states, label and announcements), then suggestions (caching via TanStack Query, URL sync)."

#### Another worked example: the production incident behind this pattern
"A marketplace's search API saw traffic spikes of 5× after a redesign that removed debouncing; each keystroke triggered a request, and the search cluster's latency degraded for everyone. Users also occasionally saw results for partial queries due to the race. Restoring a 300 ms debounce, aborting stale requests and caching recent queries cut search traffic by ~70% and eliminated the mismatched results."

#### A third worked example: encoding bug
"Searching for 'R&D' returned results for 'R' only, because the unencoded ampersand split the query string into `q=R` and an empty `D` parameter. Switching to `URLSearchParams` fixed it. A small detail, but interviewers love candidates who notice it."

#### Variations you might be asked
- "What if the API is fast; do you still need abort?": yes; ordering isn't guaranteed regardless of average speed (caching layers, retries, network variability).
- "Should you debounce the input value itself?": no; keep the input responsive (urgent state) and debounce the value used for fetching.
- "How do you test this component?": MSW to mock the API with delays (to reproduce races), fake timers for debounce, and assertions on loading, empty, error and final results.

#### Step-by-step framework
1. **Correctness**: rendering, race, encoding, errors.
2. **Performance**: debounce, empty queries, caching.
3. **UX**: loading, empty, error, previous results.
4. **Accessibility**: label, announcements, combobox if needed.
5. **Improved implementation.**
6. **Production approach** and review prioritisation.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add debounce" only | Systematic list across correctness, performance, UX, a11y |
| Misses the race condition | Explains out-of-order responses, adds abort |
| Misses encoding | URLSearchParams |
| Assumes fetch rejects on 500 | Checks res.ok |
| No improved code | Clean rewrite plus TanStack Query version |

#### Useful phrases
- "The results are stored but never rendered, so I'd confirm intent first."
- "Debounce controls frequency; aborting controls ordering."
- "fetch doesn't reject on a 500, so I check res.ok."
- "I'd mark the race and encoding issues as blocking."

#### Common pitfalls
- **Only fixing one issue.**
- **Debouncing the controlled input itself.**
- **Showing AbortError as failure.**
- **Forgetting accessibility in reviews.**

#### Follow-ups to expect (with sample answers)
- **"How would you sync the query to the URL?"**
  "Store it in search params (router), read on load, update with replace while typing (debounced), so searches are shareable and back works."
- **"How would you highlight matches in results?"**
  "Split the title by the query (escaped for regex) and wrap matches in <mark>, avoiding dangerouslySetInnerHTML."
- **"What if results must be an autocomplete dropdown?"**
  "Use the combobox pattern with aria-activedescendant and keyboard navigation, or a library like React Aria."

#### What senior interviewers look for
- **Thorough, prioritised review.**
- **Correct async handling.**
- **Production-quality rewrite.**

#### Practise it
1. Write your review comments for the original code, prioritised.
2. Implement the improved version and test races with MSW delays.
3. Explain debounce vs abort in 30 seconds, out loud.

## You're upgrading React 17 to React 18. What do you check for breaking changes?
- id: 9ff3bb65-573e-4f50-9f6e-a65a5db1e082
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: hard
- levels:
- tags: React, migration, story-bank

### Prompt
You're leading the upgrade of a large React 17 application to React 18 (and planning ahead for React 19). What changes and breaking behaviours do you check, how do you plan and roll out the upgrade safely, and how do you verify nothing regressed?

### Answer
#### What the interviewer is really testing
- Knowledge of **what actually changed** in React 18: the new root API, automatic batching, concurrent features, StrictMode double effects, SSR streaming, TypeScript type changes.
- A **safe migration plan**: dependency audit, incremental adoption, testing, rollout with monitoring.
- Recognising the **real-world breakages**: third-party libraries, tests, effect assumptions, hydration.
- **Leadership**: communication, sequencing, and measuring the outcome.

#### Key points
- **New root API**: `ReactDOM.render` → `createRoot(container).render(<App />)`; `hydrate` → `hydrateRoot`. Concurrent features only work with the new root; the legacy API logs warnings.
- **Automatic batching**: state updates in promises, timeouts and native handlers are now batched; code relying on synchronous re-renders between `setState` calls may change behaviour (use `flushSync` if needed).
- **StrictMode** (development) now **mounts, unmounts and remounts** components: effects without proper cleanup show bugs (double subscriptions, double requests).
- **Concurrent features** are opt-in (`startTransition`, `useDeferredValue`, Suspense improvements); rendering can be interrupted, so impure render code may misbehave.
- **TypeScript**: `@types/react` 18 removed implicit `children` from `React.FC` and tightened some types.
- **SSR**: `renderToPipeableStream`/`renderToReadableStream` for streaming; Suspense on the server; stricter **hydration mismatch** handling.
- **Removed/changed**: IE11 support dropped, `unstable_` APIs, no warning for setState on unmounted components, `useId` added for SSR-safe IDs, `useSyncExternalStore` for stores.
- **Dependencies**: router, state libraries (Redux/MobX versions with `useSyncExternalStore`), testing libraries (RTL 13+), component libraries, React DevTools, Next.js/Gatsby versions.
- Plan: audit → upgrade dependencies → switch root → fix tests → enable StrictMode → gradual rollout with monitoring → adopt concurrent features deliberately.

#### Model answer
"I'd treat the upgrade as two steps: first get onto React 18 with equivalent behaviour and no regressions, then adopt new features (transitions, streaming SSR) deliberately where they help.

**1. Audit and preparation**
- Read the official upgrade guide and changelog; list our usage of affected APIs: `ReactDOM.render`/`hydrate`, `unmountComponentAtNode`, `findDOMNode`, legacy context, string refs, `UNSAFE_` lifecycles.
- **Dependency audit** (often the biggest effort): React Router, Redux/react-redux (v8 uses `useSyncExternalStore`), MobX, React Query/SWR, component libraries (MUI, Ant Design), animation libraries, form libraries, testing libraries (`@testing-library/react` 13+ supports React 18; `react-test-renderer` and Enzyme don't support 18, so Enzyme tests need migrating), Storybook, and framework versions (Next.js 12.1+, Gatsby).
- Check `peerDependencies` warnings to find libraries pinned to React 17.
- Agree a branch strategy and a feature-freeze-free plan with the team.

**2. Mechanical upgrade**
```tsx
// Before (React 17)
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// After (React 18)
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')!).render(<App />);

// SSR hydration
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root')!, <App />);
```
Until the root changes, the app runs in legacy mode (React 17 behaviour with a warning), which allows upgrading packages first and switching the root as a separate, revertible step.

**3. Behaviour changes to check**

*Automatic batching:*
```tsx
// React 17: inside a timeout, these caused two renders; React 18: one render
setTimeout(() => {
  setCount((c) => c + 1);
  setFlag(true);
}, 0);
```
Most code benefits. Code that read the DOM between two state updates expecting the first to be rendered needs `flushSync`:
```tsx
flushSync(() => setItems(next));     // force render now
listRef.current?.lastElementChild?.scrollIntoView();
```

*StrictMode double mounting (development only):*
React 18 simulates unmount and remount to verify effects clean up. Components that subscribe without unsubscribing, start intervals without clearing them, or fetch without abort show duplicates. Fix the cleanup rather than removing StrictMode; this prepares the code for future features (offscreen/Activity rendering, fast refresh).

*Concurrent rendering assumptions:*
Only applies where we opt in (transitions, Suspense), but render functions must be pure: side effects in render, mutating props or module-level state during render, or reading refs during render can misbehave.

*External stores:*
Custom subscription hooks may cause 'tearing' (different parts of the UI showing different store values) under concurrent rendering; migrate to `useSyncExternalStore` or library versions that use it.

*TypeScript:*
`React.FC` no longer includes `children` implicitly; add `children?: React.ReactNode` where needed. Expect many small type errors in large codebases; codemods (`types-react-codemod`) help.

*SSR and hydration:*
React 18 is stricter about hydration mismatches; mismatches fall back to client rendering for the nearest Suspense boundary and report errors. Audit components that render dates, random IDs (`Math.random()` → `useId`), or `typeof window` branches.

*Tests:*
- Enzyme doesn't support React 18: migrate to React Testing Library (often the largest test effort).
- Wrap updates in `act` correctly; RTL handles most of it; set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` in custom setups.
- Tests relying on unbatched intermediate states may need updating.

**4. Rollout**
- Upgrade on a branch; run the full test suite, visual regression tests and E2E tests on critical journeys.
- Deploy to staging and run exploratory testing on high-risk areas (forms, modals, drag-and-drop, animations, third-party widgets).
- Release behind a **canary** (a percentage of traffic or internal users first) where the architecture allows, watching error rates (Sentry), hydration warnings, Core Web Vitals and business metrics.
- Keep the root switch revertible for a release or two.

**5. Adopt new features deliberately**
- `startTransition`/`useDeferredValue` for slow updates (filters, tab switches).
- Streaming SSR with Suspense for slow data sections.
- `useId` for accessible IDs in SSR.
- Measure INP before and after.

**6. Looking ahead to React 19**
Fix deprecation warnings now: string refs, `defaultProps` on function components, legacy context, `propTypes` checks (removed), `ReactDOM.render` (removed in 19). React 19 also passes `ref` as a regular prop, adds Actions (`useActionState`, `useOptimistic`, form actions), the `use` API and ships the React Compiler separately.

**What typically goes wrong (from experience across teams):**
- An old library version breaking in subtle ways (e.g. a drag-and-drop library relying on legacy behaviour).
- Effects without cleanup exposed by StrictMode.
- Enzyme test suites requiring weeks of migration.
- Hydration mismatches surfacing in production logs."

#### Another worked example: an e-commerce upgrade
"For a large e-commerce React app, the upgrade took about six weeks: two weeks auditing and upgrading 40+ dependencies (including replacing an unmaintained carousel), one week switching the root and fixing ~200 TypeScript errors from `React.FC` children changes (mostly with a codemod), two weeks migrating the remaining Enzyme tests to RTL, and a week of staged rollout. StrictMode exposed eight effects without cleanup (two caused duplicate analytics events in production too). After rollout, we used `startTransition` on product filtering, improving INP on listing pages by about 30%."

#### A third worked example: a batching-related bug
"After switching to `createRoot`, a chat component that called `setMessages` then immediately scrolled to the last message stopped scrolling correctly: with automatic batching, the new message wasn't in the DOM yet. Using `flushSync` for that update (or scrolling in a layout effect keyed on messages) fixed it. It was the only batching-related issue in a large app, but it's the classic one."

#### Variations you might be asked
- "Can you upgrade incrementally?": yes; upgrade packages first while still using the legacy root (React 17 behaviour), then switch roots; concurrent features are opt-in per update.
- "How do you handle micro-frontends on different React versions?": each mounts its own root with its own React copy; avoid sharing React state across them, or align versions via module federation.
- "Why remove Enzyme?": it relies on React internals and never added support for React 18; RTL tests behaviour through the DOM instead.

#### Step-by-step framework
1. **Audit APIs and dependencies.**
2. **Upgrade packages**, then **switch the root**.
3. **Check behaviour changes**: batching, StrictMode, purity, stores, types, hydration.
4. **Fix and modernise tests.**
5. **Roll out gradually with monitoring.**
6. **Adopt new features** and prepare for React 19.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Bump the version and run tests" | Audit, staged plan, rollout with monitoring |
| Unaware of createRoot significance | Legacy vs concurrent root explained |
| Doesn't mention batching or StrictMode changes | Explains both with fixes |
| Ignores libraries and tests | Dependency and Enzyme migration plans |
| Stops at React 18 | Prepares for React 19 deprecations |

#### Useful phrases
- "First we get on React 18 with equivalent behaviour; then we adopt concurrent features deliberately."
- "Automatic batching means fewer renders; code that needed the DOM between updates uses flushSync."
- "StrictMode double-mounting reveals effects without cleanup; we fix the cleanup, not StrictMode."
- "The dependency audit is usually the biggest part of the work."

#### Common pitfalls
- **Removing StrictMode** to silence double effects.
- **Ignoring peer dependency warnings.**
- **Big-bang release without monitoring.**
- **Not checking hydration in SSR apps.**

#### Follow-ups to expect (with sample answers)
- **"What does useSyncExternalStore solve?"**
  "Safe subscriptions to external stores under concurrent rendering, preventing tearing between components reading the same store."
- **"Will concurrent rendering break my app automatically?"**
  "No; it only applies to updates you mark as transitions or Suspense features. Legacy behaviour is mostly preserved, except batching and StrictMode checks."
- **"How do you measure success?"**
  "No increase in error rates, stable or improved Web Vitals, and specific INP improvements where transitions were adopted."

#### What senior interviewers look for
- **Concrete change knowledge.**
- **Risk-managed rollout.**
- **Leadership of a cross-cutting upgrade.**

#### Practise it
1. Write an upgrade checklist for a React 17 app you know.
2. Reproduce an automatic batching difference and fix it with flushSync.
3. Tell a STAR story (real or prepared) about leading a framework upgrade.

## You're upgrading Next.js 12 to 15. Walk through your strategy.
- id: f709b79b-8f43-471a-92b5-55a69fc0ef83
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: hard
- levels:
- tags: Next.js, migration, story-bank

### Prompt
You own a large Next.js 12 application using the Pages Router, `getServerSideProps`/`getStaticProps`, custom webpack config and an API routes layer. Walk through how you'd upgrade it to Next.js 15, including whether and how to adopt the App Router, React Server Components and the new caching model, without stopping feature work.

### Answer
#### What the interviewer is really testing
- Knowledge of the **major changes from 12 to 15**: React 18/19 requirements, SWC/Turbopack, middleware, `next/image`, App Router, async request APIs, caching defaults.
- A **phased plan**: upgrade versions on the Pages Router first, then adopt the App Router incrementally route by route.
- Understanding **App Router concepts** (Server Components, layouts, loading/error, Server Actions, caching/revalidation) and the **mental model shift**.
- **Risk management**: testing, performance and SEO monitoring, rollback, team enablement.

#### Key points
- **Two separate projects**: (1) version upgrade 12 → 13 → 14 → 15 staying on the **Pages Router** (still supported); (2) **incremental App Router migration** (`app/` and `pages/` can coexist).
- Version changes: **React 18 minimum (Next 13), React 19 for App Router in Next 15**; Node version bumps; **SWC** replaces Babel by default; `next/image` new component (old one as `next/legacy/image`); `next/link` no longer needs a child `<a>`; middleware stable (12.2) and its API changed; `@next/font` → `next/font`.
- Next 15: **async request APIs** (`cookies()`, `headers()`, `params`, `searchParams` become Promises) with a codemod; **fetch and GET route handlers no longer cached by default**; Turbopack for dev stable; `next.config.ts` support.
- Use the **official codemods** (`npx @next/codemod`) for links, images, async APIs.
- **Custom webpack config**: check compatibility with SWC/Turbopack; replace Babel plugins with SWC equivalents.
- App Router migration: start with **leaf or new routes**, recreate `_app`/`_document` as root `layout.tsx`, move data fetching from `getServerSideProps` to Server Components, `getStaticProps` + `revalidate` to `fetch` caching/`revalidate` exports, API routes to **Route Handlers** or **Server Actions**.
- Watch out for: client components boundaries, CSS-in-JS runtime libraries, context providers, `next/router` → `next/navigation`, SEO metadata API, i18n routing changes.
- Measure: Core Web Vitals, bundle size, server costs, SEO rankings; roll out with canaries.

#### Model answer
"I'd split this into two projects with different risk profiles: first a version upgrade that keeps the Pages Router (mostly mechanical), then a gradual, route-by-route move to the App Router where it gives clear benefits. Next.js lets `pages/` and `app/` coexist, so there's no need for a big-bang rewrite.

**Phase 0: Preparation**
- Inventory: routes, data-fetching methods per page, custom `_app`/`_document`, custom webpack and Babel config, middleware, API routes, i18n config, image usage, CSS approach (CSS Modules, styled-components, Emotion), auth library, analytics and third-party scripts.
- Baseline metrics: Core Web Vitals per key template, bundle sizes, build times, TTFB, error rates, SEO indexing.
- Strong test safety net: E2E tests for critical journeys (Playwright), visual regression for key templates.

**Phase 1: Version upgrade on the Pages Router (12 → 15)**
I'd go one major at a time, deploying each step:

*12 → 13:*
- React 18 required (do the React 18 upgrade first, see that checklist).
- `next/link`: child `<a>` no longer needed (codemod `new-link`).
- `next/image`: new implementation (codemod to `next/legacy/image` first, then migrate to the new component deliberately, checking layout and sizing).
- `@next/font` → `next/font` (14), SWC as default compiler: replace Babel plugins (styled-components and Emotion have SWC transforms).
- Node version bump; check middleware API changes (since 12.2 stable).

*13 → 14:*
- Node 18.17+, `next export` replaced by `output: 'export'` config.
- Server Actions stable (App Router only), metadata improvements.

*14 → 15:*
- React 19 for the App Router; the Pages Router supports React 18 still (check the version policy for the exact release).
- **Async request APIs**: `cookies()`, `headers()`, `draftMode()`, `params` and `searchParams` are now async in the App Router; run `npx @next/codemod@latest next-async-request-api`.
- **Caching defaults changed**: `fetch` requests and GET Route Handlers are no longer cached by default; client router cache defaults changed. Explicitly opt in where caching is desired.
- `next.config.ts` supported; Turbopack dev stable (`next dev --turbo`).

At each step: run codemods, fix build errors, run tests, deploy to staging, then production with monitoring. Custom webpack config is the usual friction point: verify each loader/plugin, and remove ones Next now handles natively.

**Phase 2: Adopt the App Router incrementally**
Why bother: Server Components reduce client JS, nested layouts preserve state across navigation, streaming with Suspense improves perceived performance, colocated loading/error states, Server Actions simplify mutations, and new features land there first.

Approach:
1. **Create the root layout** in `app/layout.tsx`, recreating what `_app` and `_document` did (global CSS, fonts, providers in a client `Providers` component, analytics scripts via `next/script`).
2. **Pick a low-risk route first** (e.g. a marketing page or a new feature), then progressively move higher-value routes (product listing, product detail).
3. **Data fetching translation:**
| Pages Router | App Router |
|---|---|
| `getServerSideProps` | Async Server Component fetching data (dynamic rendering) |
| `getStaticProps` + `revalidate` | `fetch` with `next: { revalidate }` or `export const revalidate = 60` |
| `getStaticPaths` | `generateStaticParams` |
| API routes for mutations | Server Actions (or Route Handlers for external clients) |
| `next/head` | `metadata` export / `generateMetadata` |
| `useRouter` from `next/router` | `useRouter`, `usePathname`, `useSearchParams` from `next/navigation` |
| `_error`, custom 404 | `error.tsx`, `not-found.tsx` |
| Loading spinners in pages | `loading.tsx` and Suspense boundaries |
4. **Client boundaries**: keep pages and data display as Server Components; mark interactive leaves `'use client'`.
5. **Runtime CSS-in-JS** (styled-components/Emotion) needs client components and registry setup in the App Router; consider migrating to CSS Modules, Tailwind or zero-runtime solutions over time.
6. **Shared components**: anything using hooks or browser APIs needs `'use client'`; audit component libraries for App Router compatibility.
7. **Caching and revalidation**: define per route whether it's static, ISR-like or dynamic; use tags (`revalidateTag`) for on-demand revalidation from the CMS or admin actions. With Next 15's defaults, be explicit.
8. **Auth**: middleware for route protection, plus server-side checks in Server Components and Server Actions (never rely on middleware alone).

**Phase 3: Clean up and optimise**
Remove the Pages Router once all routes have moved (or keep stable legacy pages there indefinitely if they work), delete unused dependencies, adopt Turbopack, and compare metrics with the baseline.

**Risk management throughout:**
- Ship in small increments; never pause feature work for months.
- Canary or percentage rollouts where possible; watch errors, Web Vitals, conversion and SEO (crawl errors, indexing changes after URL/metadata changes).
- Keep a rollback plan for each deploy.
- Enable the team: an App Router guide covering server vs client components, caching rules and patterns, with examples from our codebase."

#### Another worked example: a phased migration outcome
"For a content-heavy marketplace, the Pages Router upgrade from 12 to 14 took four weeks (mostly `next/image` changes, replacing Babel plugins with SWC equivalents, and two incompatible webpack plugins). The App Router migration then ran for five months alongside feature work: marketing pages first, then search and product detail. Product detail pages moved data fetching into Server Components with Suspense-streamed reviews; client JS on that template dropped ~45% and LCP improved from 2.9 s to 2.0 s at p75. The Next 15 upgrade later required the async request API codemod and explicit caching for a few data fetches whose behaviour changed."

#### A third worked example: a caching surprise
"After moving to Next 15, a dashboard became slower: several `fetch` calls had relied on the previous default caching in the App Router and were now dynamic on every request. We audited data access, added explicit `revalidate` values where data could be minutes old, used `revalidateTag` after admin updates, and kept user-specific data uncached. Being explicit about caching made the behaviour easier to reason about."

#### Variations you might be asked
- "Would you migrate to the App Router at all?": if the Pages Router meets needs and the team is stretched, it's supported; migrate where benefits are clear (heavy client JS, complex layouts, streaming needs).
- "How do you handle i18n?": the App Router has no built-in i18n routing config; use a `[locale]` segment with middleware, or a library like next-intl.
- "How do you migrate API routes used by mobile apps?": keep them as Route Handlers (public HTTP endpoints); Server Actions are for your own UI.

#### Step-by-step framework
1. **Prepare**: inventory, baseline metrics, tests.
2. **Version upgrade** on the Pages Router, one major at a time with codemods.
3. **Handle breaking changes** (images, links, SWC, async APIs, caching defaults).
4. **Incremental App Router adoption** route by route with a translation table.
5. **Client boundaries, CSS-in-JS, auth, caching.**
6. **Roll out, monitor, enable the team**, clean up.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Rewrite everything in the App Router" | Version upgrade first, then incremental migration |
| Unaware of Next 15 async APIs/caching changes | Uses codemods, makes caching explicit |
| Ignores custom webpack/Babel | Plans SWC/Turbopack compatibility |
| No translation of data fetching | Maps gSSP/gSP/API routes to App Router patterns |
| No monitoring | Baselines, canaries, SEO and Web Vitals checks |

#### Useful phrases
- "Pages and App Router coexist, so we migrate route by route."
- "I go one major version at a time and run the official codemods."
- "In Next 15, caching is opt-in, so we're explicit about revalidation."
- "Middleware isn't enough for auth; every Server Action checks permissions."

#### Common pitfalls
- **Big-bang migrations.**
- **'use client' at layout level.**
- **Assuming old caching behaviour.**
- **Ignoring SEO metadata changes.**

#### Follow-ups to expect (with sample answers)
- **"How does App Router routing differ?"**
  "Folders define routes with special files (page, layout, loading, error); layouts persist across navigations, and route groups/parallel routes enable complex UIs."
- **"What happens to `_app` providers?"**
  "They move into a client Providers component rendered by the root layout."
- **"How do you test Server Components?"**
  "E2E tests (Playwright) for full behaviour, unit tests for pure logic extracted from them, and component tests for client leaves; async Server Component unit testing support is still evolving."

#### What senior interviewers look for
- **Up-to-date framework knowledge.**
- **Incremental, low-risk planning.**
- **Clear architectural reasoning.**

#### Practise it
1. Write a migration plan for a Pages Router app you know, with phases and metrics.
2. Convert one getServerSideProps page into an App Router Server Component with Suspense.
3. Explain Next 15's caching changes, out loud.

## What is Suspense and how does it work with data fetching?
- id: 7e509f40-c402-4a0a-b7e4-0e042ade96f9
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, data-fetching, concurrent
- companies: Meta, OpenAI

### Prompt
Explain React Suspense. How does it work for code splitting and for data fetching, how do boundaries and fallbacks behave, how does it interact with transitions, streaming SSR and error boundaries, and what's the `use` API in React 19?

### Answer
#### What the interviewer is really testing
- Understanding Suspense as a **declarative loading-state mechanism** for anything a component waits on.
- Knowing the **supported ways** to suspend: `React.lazy`, Suspense-enabled data libraries/frameworks, `use(promise)`, Server Components.
- **Boundary design**: placement, nesting, avoiding waterfalls and spinner overload.
- Interaction with **transitions, streaming SSR, error boundaries**.

#### Key points
- `<Suspense fallback={...}>` shows the fallback while **any component inside** is waiting (suspended), then reveals the content.
- Components "suspend" by **throwing a promise** internally (implementation detail); you use it via `React.lazy`, **Suspense-enabled libraries** (TanStack Query `useSuspenseQuery`, Relay, SWR suspense), **frameworks** (Next.js App Router, Remix), or **`use(promise)`** in React 19.
- **Boundaries** define loading granularity: one boundary for the page vs several for sections. Nested boundaries reveal progressively.
- **Transitions** keep already-visible content on screen instead of re-showing fallbacks when navigating.
- **Streaming SSR**: the server sends HTML for ready parts and streams suspended parts later; selective hydration lets interactive parts hydrate first.
- **Errors** aren't handled by Suspense: pair with **error boundaries**.
- **Waterfalls**: sequential suspending components fetch one after another; start fetches early (prefetch, parallel fetching at route level, render-as-you-fetch).
- Don't create promises during render for `use()` without caching (new promise each render → infinite suspense).

#### Model answer
"Suspense lets a component say 'I'm not ready yet', and React shows the nearest fallback until it is. Instead of every component managing its own `isLoading` flags, loading states are declared by where you put boundaries.

**Code splitting (the original use):**
```tsx
const SettingsPage = React.lazy(() => import('./SettingsPage'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsPage />
    </Suspense>
  );
}
```
While the chunk downloads, `SettingsPage` suspends and the skeleton shows.

**Data fetching.** A component can suspend while its data loads, but only through Suspense-aware sources:
```tsx
// TanStack Query
function OrderList() {
  const { data: orders } = useSuspenseQuery({ queryKey: ['orders'], queryFn: fetchOrders });
  return <ul>{orders.map((o) => <OrderRow key={o.id} order={o} />)}</ul>;   // data is always defined
}

function OrdersPage() {
  return (
    <ErrorBoundary fallback={<ErrorPanel />}>
      <Suspense fallback={<ListSkeleton />}>
        <OrderList />
      </Suspense>
    </ErrorBoundary>
  );
}
```
The component code reads as if the data were synchronous: no loading branches, `data` is never undefined.

**React 19's use API:**
```tsx
// Server Component starts the fetch and passes the promise down
export default function Page() {
  const commentsPromise = getComments();          // not awaited: starts immediately
  return (
    <>
      <Article />
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </>
  );
}

// Client Component
'use client';
import { use } from 'react';
function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise);          // suspends until resolved
  return comments.map((c) => <CommentItem key={c.id} comment={c} />);
}
```
Rule: the promise must be **stable** (created outside render or cached). Creating `fetch(...)` inside the render of the component calling `use()` makes a new promise every render, which suspends forever. `use` can also read context conditionally.

**How Suspense works conceptually:** when a component needs data that isn't ready, it throws (suspends); React catches it at the nearest `<Suspense>` boundary, renders the fallback, and retries rendering when the promise resolves. Libraries cache the result so the retry renders immediately.

**Designing boundaries:**
```tsx
<Suspense fallback={<PageSkeleton />}>          {/* outer: page shell */}
  <Header />
  <Suspense fallback={<ProductSkeleton />}>
    <ProductDetails id={id} />                  {/* critical content */}
  </Suspense>
  <Suspense fallback={<ReviewsSkeleton />}>
    <Reviews id={id} />                         {/* slower, non-critical */}
  </Suspense>
</Suspense>
```
- One boundary around everything: simple, but the whole page waits for the slowest part.
- Too many boundaries: 'popcorn' UI with many spinners popping in at different times.
- Good design groups content that should appear together and lets slow, non-critical sections load independently.
- Skeletons matching final layout reduce layout shift.

**Avoiding waterfalls:** if `<ProductDetails>` suspends and only then renders `<Reviews>` which starts its own fetch, requests happen sequentially. Better: start both fetches at the route level (render-as-you-fetch), prefetch on hover/route match, or fetch in parallel in a Server Component and pass promises down.

**Suspense and transitions:**
```tsx
const [isPending, startTransition] = useTransition();
<button onClick={() => startTransition(() => setTab('reviews'))}>Reviews</button>
```
Without a transition, switching tabs to suspending content replaces visible content with the fallback. With a transition, React keeps the current UI visible (showing `isPending`) until the new content is ready. Router navigations in Next.js are transitions, so pages don't flash back to skeletons.

**Streaming SSR and selective hydration:**
- On the server, React sends the HTML shell immediately with fallbacks for suspended parts, then streams the missing HTML (with inline scripts that put it in place) as data resolves. Users see content sooner.
- On the client, React hydrates Suspense boundaries independently and prioritises the one the user interacts with (selective hydration).

**Errors:** Suspense handles waiting, not failure. A rejected promise throws to the nearest **error boundary**. Put error boundaries around Suspense boundaries at the same granularity, with retry (e.g. `react-error-boundary`'s `resetErrorBoundary` combined with query reset).

**Where Suspense doesn't apply:** data fetched in `useEffect` doesn't trigger Suspense; the component must read data through a Suspense-integrated source."

#### Another worked example: progressive product page
"A product page waited for product data, reviews, recommendations and stock before rendering anything (~2.4 s on slow connections). With the App Router we streamed it: product details in the first boundary (fast, critical), reviews and recommendations in separate boundaries with skeletons. The server started all fetches in parallel. Users saw the product in ~0.9 s while reviews streamed in, and LCP improved because the main content no longer waited for slow sections."

#### A third worked example: an infinite suspense bug
"A developer wrote `const data = use(fetch('/api/stats').then((r) => r.json()))` inside a client component. The page showed the spinner forever and hammered the API, because each render created a new promise. Moving the fetch into the Server Component parent (passing the promise as a prop) or using TanStack Query's suspense hook fixed it."

#### Variations you might be asked
- "What's SuspenseList?": an experimental component for coordinating reveal order of multiple boundaries (not stable).
- "How does Suspense relate to Server Components?": async Server Components suspend naturally while awaiting; Suspense boundaries define what streams later.
- "Can Suspense show a fallback only if loading takes longer than X?": React avoids flashing fallbacks for very fast loads in transitions; for initial loads, design skeletons or delay spinners with CSS animation delays.

#### Step-by-step framework
1. **Define Suspense** and fallback behaviour.
2. **Code splitting with lazy.**
3. **Data fetching via libraries, frameworks and use().**
4. **Boundary design** and avoiding waterfalls.
5. **Transitions and streaming SSR.**
6. **Error boundaries** and limitations.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Suspense is for lazy loading" | Code and data, via supported sources |
| Wraps whole app in one boundary | Deliberate nested boundaries |
| Creates promises in render | Stable promises, caching libraries |
| Ignores errors | Error boundaries paired with Suspense |
| Unaware of transitions/streaming | Explains both |

#### Useful phrases
- "Suspense moves loading states from flags in components to boundaries in the tree."
- "The component reads data as if it's already there; the boundary handles waiting."
- "Transitions keep the current screen instead of flashing back to a skeleton."
- "Suspense handles waiting; error boundaries handle failure."

#### Common pitfalls
- **Waterfalls from nested suspending components.**
- **Popcorn UI with too many spinners.**
- **Unstable promises with use().**
- **Expecting useEffect fetching to trigger Suspense.**

#### Follow-ups to expect (with sample answers)
- **"What's render-as-you-fetch?"**
  "Start fetching before rendering the component that needs the data (at route level or on interaction), then let components read the in-flight data via Suspense."
- **"How do you reset an errored Suspense subtree?"**
  "Use an error boundary with a reset function that also resets the failed query (TanStack Query's QueryErrorResetBoundary)."
- **"How does streaming affect SEO?"**
  "Crawlers receive the full streamed HTML; content inside Suspense still ends up in the response, unlike client-only rendering."

#### What senior interviewers look for
- **Correct mental model** and supported usage.
- **Thoughtful boundary design.**
- **Integration with modern React features.**

#### Practise it
1. Convert a page with loading flags to Suspense with useSuspenseQuery and nested boundaries.
2. Pass a promise from a Server Component to a client component using use().
3. Explain Suspense with transitions, out loud.

## What's hydration mismatch and how do you debug it?
- id: cdfcb7a9-b5d4-4603-837c-f2de8db3d272
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, SSR, debugging
- companies: Meta, Anthropic

### Prompt
What is hydration in server-rendered React apps, and what causes a hydration mismatch? Describe common causes (dates, randomness, browser-only APIs, invalid HTML, extensions), how React 18/19 reports and handles mismatches, how to debug them, and the right fixes.

### Answer
#### What the interviewer is really testing
- Understanding **hydration**: attaching React to server-rendered HTML, which requires the first client render to match.
- Knowing the **common causes** and how to recognise each.
- Correct **fixes** (deterministic rendering, client-only rendering after mount, `useId`, valid HTML) vs bad ones (suppressing everything).
- Debugging with **React 19 diff messages**, DevTools, and reproduction strategies.

#### Key points
- **SSR** sends HTML so users see content early; **hydration** is React running on the client, building its tree and attaching event handlers to existing DOM, expecting the **same output** as the server.
- A **mismatch** occurs when the client's first render differs from server HTML: text, attributes or structure.
- Consequences: React 18+ may **discard the server HTML** for the nearest Suspense boundary (or the root) and client-render it (losing SSR benefits, causing flicker), plus console errors; attribute mismatches may be left unfixed.
- Common causes: **dates/times and timezones**, **`Math.random()`/IDs**, **`typeof window` / localStorage / `navigator` branches during render**, **locale formatting** differences, **invalid HTML nesting** (`<div>` inside `<p>`, `<a>` in `<a>`), **browser extensions** modifying the DOM, **different data** between server and client, CSS-in-JS class mismatches.
- Fixes: render **deterministically** (same inputs), move client-only values into **`useEffect`/state after mount**, use **`useId`**, pass **server data/timezone** to the client, fix **HTML nesting**, use `suppressHydrationWarning` only for **intentional** single-element differences (like timestamps), **dynamic import with `ssr: false`** for client-only widgets.
- React 19 prints a **diff** of the mismatch, making debugging much easier.

#### Model answer
"With server-side rendering, the server sends HTML so users see content before JavaScript loads. Hydration is when React loads in the browser, renders the same component tree, and attaches itself to the existing HTML instead of recreating it. For that to work, the client's first render must produce exactly what the server produced. A hydration mismatch is when it doesn't.

**What happens on a mismatch:**
- React logs an error (React 19 shows a diff of expected vs actual).
- For text/structure mismatches, React 18+ throws away the server HTML for the nearest Suspense boundary (or the whole root) and re-renders on the client: visible flicker, wasted work, and lost SSR performance.
- Some attribute mismatches are left as server values (no patching), leaving subtle bugs.

**Common causes and fixes:**

**1. Dates, times and timezones:**
```tsx
// Server renders in UTC (or server locale); client renders in the user's timezone → mismatch
<p>Updated {new Date(updatedAt).toLocaleString()}</p>
```
Fixes:
- Render a deterministic format on the server and client (e.g. ISO date or a fixed timezone you pass through).
- Or render the relative/local time **after mount**:
```tsx
function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(() => new Date(iso).toISOString().slice(0, 10));   // stable for SSR
  useEffect(() => { setText(new Date(iso).toLocaleString()); }, [iso]);                // local after mount
  return <time dateTime={iso}>{text}</time>;
}
```
- For a single text node like a timestamp, `suppressHydrationWarning` on that element is acceptable (it only applies one level deep).
- `Date.now()` during render ('3 minutes ago') also differs between server and client time.

**2. Randomness and IDs:**
```tsx
const id = Math.random().toString(36);   // different on server and client
<label htmlFor={id}>Email</label><input id={id} />
```
Fix: `const id = useId();`, which generates matching IDs on server and client.

**3. Browser-only values during render:**
```tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;   // server: false; client: maybe true
return isMobile ? <MobileNav /> : <DesktopNav />;
```
Fixes: use CSS (media queries) for responsive differences; or read browser values in `useEffect` and render a consistent default first; or `useSyncExternalStore` with a `getServerSnapshot`. Same for `localStorage` (theme, preferences): render a neutral state on the server (or read from a cookie on the server so both sides agree).

**4. Invalid HTML nesting:**
```tsx
<p>Price: <div className="price">£20</div></p>      // <div> can't be inside <p>
```
The browser's HTML parser 'fixes' the server HTML (closing the `<p>` early), so the DOM differs from React's expected tree. Others: `<a>` inside `<a>`, `<button>` inside `<button>`, `<tr>` directly in `<table>` without `<tbody>`, interactive content inside `<label>` misuse. Fix the markup.

**5. Browser extensions:** password managers, translation tools and Grammarly inject attributes or elements into the DOM before hydration. React 19 is more tolerant of extra elements in `<head>`/`<body>`, but mismatches can still appear. Verify in a clean profile/incognito before chasing bugs.

**6. Different data on server and client:**
- The server rendered with data from time T; the client fetches again on mount with different data and renders it during hydration.
- Fix: pass the server data to the client (serialised props, framework loaders, dehydrated TanStack Query cache) so the first client render uses the same data.

**7. Feature flags / A/B tests / personalisation:** if the server and client evaluate a flag differently (e.g. client SDK not initialised), the output differs. Evaluate on the server and pass the result, or render the variant after mount.

**8. Client-only components:** charts, maps, editors that depend on `window`:
```tsx
const Map = dynamic(() => import('./Map'), { ssr: false, loading: () => <MapSkeleton /> });
```

**Debugging process:**
1. **Read the error**: React 19 and Next.js show the component stack and a diff of server vs client values. In React 18, the message is vaguer; check the component stack.
2. **View source vs DOM**: compare 'View Page Source' (server HTML) with the hydrated DOM in Elements.
3. **Reproduce consistently**: set a different timezone in DevTools (Sensors → location/timezone) or OS; disable extensions; test different locales.
4. **Bisect**: wrap suspicious sections in Suspense boundaries to localise where client re-rendering happens, or temporarily render components client-only to see if the error disappears.
5. **Search for culprits**: `new Date`, `Date.now`, `Math.random`, `typeof window`, `localStorage`, `navigator`, `toLocale*` used in render paths.
6. Add a **lint rule or code review checklist** for these patterns in SSR code.

**What not to do:**
- Spraying `suppressHydrationWarning` everywhere (it only silences one element and hides real problems).
- Disabling SSR for the whole page to make errors go away.
- Using `useLayoutEffect` hacks without understanding the cause."

#### Another worked example: a theme flicker and mismatch
"A Next.js app read the theme from localStorage during render to set a `className` on the body. The server always rendered light; dark-mode users got a hydration mismatch and a flash from light to dark. We stored the theme in a cookie so the server rendered the correct class, added a small inline script for first visits, and removed localStorage reads from render. The error and the flicker disappeared."

#### A third worked example: invalid nesting from a rich text field
"Product descriptions from the CMS were rendered inside a `<p>` and sometimes contained `<div>` or `<ul>` elements. The browser restructured the server HTML, causing mismatches only on certain products, which made it hard to spot. React 19's diff output pointed at the description component; changing the wrapper from `<p>` to `<div>` fixed it."

#### Variations you might be asked
- "Why does React need hydration to match?": it reuses the existing DOM nodes and assumes their structure corresponds to its tree; mismatches could attach handlers to the wrong elements.
- "What's partial or progressive hydration?": hydrating parts of the page independently (Suspense boundaries, islands architecture) to reduce upfront JS work.
- "Do Server Components hydrate?": no; only Client Components hydrate. Server Component output is static HTML plus the RSC payload.

#### Step-by-step framework
1. **Define SSR and hydration.**
2. **Explain mismatch consequences.**
3. **List causes** with code and fixes.
4. **Client-only patterns** (effects, dynamic import, useSyncExternalStore).
5. **Debugging process.**
6. **Anti-patterns to avoid.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "A React bug" | Explains server/client first-render equality |
| Only mentions dates | Dates, IDs, browser APIs, nesting, extensions, data, flags |
| suppressHydrationWarning everywhere | Targeted, with real fixes |
| Disables SSR | Client-only rendering only where needed |
| No debugging method | Diff, view source, timezone/extension repro, bisecting |

#### Useful phrases
- "The client's first render must match the server HTML exactly."
- "Anything that differs between server and client, like time or window size, goes into an effect after mount."
- "Invalid HTML nesting makes the browser change the DOM before React hydrates."
- "I check in an incognito window first, because extensions can cause mismatches."

#### Common pitfalls
- **localStorage reads during render.**
- **Locale-dependent formatting** without a fixed locale/timezone.
- **Math.random IDs.**
- **Blanket suppression.**

#### Follow-ups to expect (with sample answers)
- **"How does useId work?"**
  "It generates IDs based on the component's position in the tree, which is the same on server and client."
- **"What's useSyncExternalStore's getServerSnapshot for?"**
  "Providing the value to use during SSR and hydration, so the first client render matches the server before switching to the live client value."
- **"Why do mismatches hurt performance?"**
  "React may discard server HTML and client-render that subtree, doing extra work and delaying interactivity, and users may see content flicker."

#### What senior interviewers look for
- **Clear SSR mental model.**
- **Systematic debugging.**
- **Correct, minimal fixes.**

#### Practise it
1. Create three mismatches (date, Math.random, invalid nesting) in a Next.js app and fix each.
2. Implement theme handling with a cookie so SSR matches.
3. Explain hydration mismatches, out loud, in 60 seconds.

## Implement useDebounce custom hook
- id: 8d9a5715-3c66-4d64-b95a-64957231c337
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: easy
- levels:
- tags: React, hooks, polyfill

### Prompt
Implement a `useDebounce` hook. Show both a debounced value hook (`useDebouncedValue(value, delay)`) and a debounced callback hook (`useDebouncedCallback(fn, delay)`), explain the differences, handle cleanup and stale closures correctly, and show how you'd test them.

### Answer
#### What the interviewer is really testing
- Translating debounce into **React's lifecycle** (effects, cleanup, refs).
- Knowing the **two flavours** (debounced value vs debounced function) and when each fits.
- Avoiding **stale closures** and **recreating the debounced function every render**.
- **Testing** with fake timers and React Testing Library.

#### Key points
- **Debounced value**: returns a value that updates only after `value` stops changing for `delay` ms; implemented with `useEffect` + `setTimeout` + cleanup.
- **Debounced callback**: returns a stable function that delays calling `fn`; implemented with refs for the timer and latest `fn`.
- Value version is simplest for "search as you type" (debounce the query used for fetching).
- Callback version suits event handlers (autosave, analytics, resize) and avoids extra renders.
- Always **clear timers on unmount** and when inputs change.
- Keep the **latest callback in a ref** to avoid stale state while keeping the debounced function stable.
- Optionally expose **cancel** and **flush**.
- Test with `vi.useFakeTimers()`/`jest.useFakeTimers()` and `act` around timer advances.

#### Model answer
"There are two useful versions, and which one I'd write depends on what's changing.

**1. Debounced value**: 'give me this value, but only once it stops changing':
```ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);       // value changed (or unmount) before delay: cancel
  }, [value, delay]);

  return debounced;
}

// usage: input stays responsive; the fetch uses the debounced query
function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const { data } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```
How it works: every change to `value` runs the effect, which schedules an update; if `value` changes again before `delay`, React runs the cleanup (clearing the timer) before scheduling a new one. Only the last value in a burst gets through.

Note: don't debounce the controlled input's own value; the input must update immediately or typing feels broken.

**2. Debounced callback**: 'give me a function that delays calling fn':
```ts
import { useCallback, useEffect, useMemo, useRef } from 'react';

export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 300,
) {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const argsRef = useRef<A | null>(null);

  useEffect(() => { fnRef.current = fn; });          // always call the latest fn (no stale state)

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    argsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (!timerRef.current || !argsRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const args = argsRef.current;
    argsRef.current = null;
    fnRef.current(...args);
  }, []);

  const debounced = useMemo(() => {
    const call = (...args: A) => {
      argsRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const a = argsRef.current!;
        argsRef.current = null;
        fnRef.current(...a);
      }, delay);
    };
    return Object.assign(call, { cancel, flush });
  }, [delay, cancel, flush]);

  useEffect(() => cancel, [cancel]);                 // clear pending call on unmount

  return debounced;
}

// usage: autosave a document 1s after typing stops
function Editor({ docId }: { docId: string }) {
  const [text, setText] = useState('');
  const save = useDebouncedCallback((value: string) => saveDraft(docId, value), 1000);
  useEffect(() => () => save.flush(), [save]);       // flush pending save on unmount
  return <textarea value={text} onChange={(e) => { setText(e.target.value); save(e.target.value); }} />;
}
```
Key decisions:
- **Stable identity**: the debounced function is created once (per `delay`), so the timer survives re-renders. A naive `const save = debounce(fn, 1000)` inside the component body creates a new debounced function (and a new timer) on every render, so it never actually debounces.
- **Latest callback via ref**: `fnRef.current` is updated after each render, so when the timer fires it calls the newest `fn` with current props/state. Without this, the debounced function would capture `fn` from the first render (stale `docId`).
- **Cleanup**: cancel (or flush, for saves) on unmount so we don't call functions for an unmounted component or lose data.

**Value vs callback:**
| | useDebouncedValue | useDebouncedCallback |
|---|---|---|
| Input | A changing value | A function |
| Output | A lagging value | A stable delayed function |
| Extra renders | Yes (when debounced value updates) | No |
| Best for | Deriving fetch queries, filters | Autosave, analytics, resize handlers, API calls in handlers |

**Testing with fake timers:**
```tsx
import { renderHook, act } from '@testing-library/react';

test('useDebouncedValue only updates after the delay', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), { initialProps: { v: 'a' } });
  rerender({ v: 'ab' });
  rerender({ v: 'abc' });
  expect(result.current).toBe('a');
  act(() => { vi.advanceTimersByTime(299); });
  expect(result.current).toBe('a');
  act(() => { vi.advanceTimersByTime(1); });
  expect(result.current).toBe('abc');
  vi.useRealTimers();
});

test('useDebouncedCallback calls the latest fn once', () => {
  vi.useFakeTimers();
  const spy = vi.fn();
  const { result } = renderHook(() => useDebouncedCallback(spy, 200));
  act(() => { result.current('x'); result.current('y'); });
  act(() => { vi.advanceTimersByTime(200); });
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith('y');
});
```

**Libraries:** `use-debounce` provides both hooks with leading/trailing/maxWait options; I'd use it in production unless the team prefers no dependency."

#### Another worked example: the recreated-debounce bug
"A filter panel called `const debouncedFetch = debounce(fetchResults, 300)` inside the component. Each keystroke caused a re-render, creating a new debounced function with its own timer, so every keystroke still triggered a request after 300 ms. Replacing it with `useDebouncedCallback` (stable across renders) reduced requests from one per keystroke to one per pause."

#### A third worked example: stale closure in autosave
"An autosave hook used `useCallback(debounce(() => save(doc), 1000), [])`. Saves always sent the document content from the first render (empty), because the debounced closure captured the initial `doc`. Using a ref for the latest values (as above) fixed it. This bug is common enough that I mention it proactively in interviews."

#### Variations you might be asked
- "Add a leading option": call immediately on the first call in a burst, then ignore until the delay passes.
- "useThrottle": similar refs, but track last-run time and allow a call at most once per interval, with a trailing call.
- "Should the debounced value hook reset on unmount?": the cleanup clears the pending timer; state is discarded with the component.

#### Step-by-step framework
1. **Clarify** value vs callback use.
2. **Implement the value hook** with effect cleanup.
3. **Implement the callback hook** with refs and stable identity.
4. **Handle latest callback, cancel and flush.**
5. **Compare** and show usage.
6. **Test** with fake timers.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Calls debounce() in render | Stable debounced function across renders |
| Stale state in callback | Latest fn via ref |
| No cleanup | Clear/flush on unmount |
| Debounces the input value itself | Input urgent, debounced derived value |
| No tests | Fake timer tests with renderHook and act |

#### Useful phrases
- "The effect cleanup cancels the previous timer whenever the value changes."
- "A debounce created during render never debounces, because each render makes a new timer."
- "I keep the latest callback in a ref so the debounced function stays stable but never stale."
- "For autosave I flush on unmount so no edits are lost."

#### Common pitfalls
- **Recreating debounced functions each render.**
- **Stale closures.**
- **Not clearing timers on unmount.**
- **Debouncing controlled input state.**

#### Follow-ups to expect (with sample answers)
- **"Why update fnRef in an effect rather than during render?"**
  "Writing refs during render is discouraged (render should be pure); updating after commit is safe. React's experimental useEffectEvent formalises this pattern."
- **"How would you debounce with useTransition instead?"**
  "Transitions don't delay work; they make rendering interruptible. For network requests I still debounce; for expensive local rendering, transitions can replace debouncing."
- **"What delay would you choose?"**
  "Around 200–400 ms for search, 500–1500 ms for autosave, tuned with user testing."

#### What senior interviewers look for
- **Correct React lifecycle handling.**
- **Awareness of stale closures and identity.**
- **Test discipline.**

#### Practise it
1. Implement both hooks from memory.
2. Write the fake-timer tests and make them pass.
3. Explain why calling debounce() in a component body doesn't work, out loud.

## Implement useOnClickOutside
- id: ca1c0139-f88f-4d02-ac6c-889a48d817a9
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, hooks, DOM

### Prompt
Implement a `useOnClickOutside(ref, handler)` hook used to close dropdowns, popovers and modals when the user clicks outside them. Handle touch devices, multiple refs (trigger plus popup), portals, Shadow DOM, stale handlers, and explain the accessibility considerations (keyboard users need Escape and focus handling too).

### Answer
#### What the interviewer is really testing
- Correct **event listener management** in effects (add/remove, stable handler).
- **Edge cases**: which event to use (pointerdown vs click), touch, the trigger button toggling, portals rendering outside the DOM subtree, iframes, Shadow DOM, scrollbar clicks, text selection drags.
- **Stale closure** handling with refs.
- **Accessibility**: outside click isn't enough; Escape key and focus management are required.

#### Key points
- Listen on `document` for **`pointerdown`** (covers mouse, touch and pen; fires before focus changes and before click), or `mousedown` + `touchstart` for older support.
- Check whether the event target is **inside** the element(s): `ref.current.contains(event.target)`; with Shadow DOM or portals, prefer **`event.composedPath()`** checks.
- Support **multiple refs** (e.g. trigger button and popup) so clicking the trigger doesn't immediately close and reopen.
- **Portals**: a popup rendered via `createPortal` is outside the parent's DOM subtree; include its ref explicitly.
- Keep the **handler in a ref** so the listener doesn't need re-binding every render and never calls a stale handler.
- Allow an **enabled** flag so listeners exist only while open.
- **Capture phase** listener (`true`) avoids being blocked by `stopPropagation` in children.
- Accessibility: also close on **Escape**, return **focus** to the trigger, and handle **focus moving out** (focusout) for keyboard users; modals should use `<dialog>`/inert rather than relying on outside clicks.

#### Model answer
"The hook listens for pointer presses anywhere on the document and calls the handler if the press happened outside the given element or elements.

**Implementation:**
```ts
import { RefObject, useEffect, useRef } from 'react';

type AnyRef = RefObject<HTMLElement | null>;

export function useOnClickOutside(
  refs: AnyRef | AnyRef[],
  handler: (event: PointerEvent) => void,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; });          // always call the latest handler

  useEffect(() => {
    if (!enabled) return;
    const list = Array.isArray(refs) ? refs : [refs];

    function onPointerDown(event: PointerEvent) {
      const path = event.composedPath();                        // works across Shadow DOM
      const inside = list.some((r) => r.current && path.includes(r.current));
      if (!inside) handlerRef.current(event);
    }

    document.addEventListener('pointerdown', onPointerDown, true);   // capture: not blocked by stopPropagation
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [enabled, ...(Array.isArray(refs) ? refs : [refs])]);
}
```

**Usage with a trigger and a portalled popup:**
```tsx
function Dropdown() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([buttonRef, menuRef], () => setOpen(false), { enabled: open });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }   // keyboard close + return focus
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button ref={buttonRef} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        Options
      </button>
      {open && createPortal(
        <div ref={menuRef} role="menu" className="menu">…</div>,
        document.body,
      )}
    </>
  );
}
```

**Design decisions explained:**
- **`pointerdown` instead of `click`**: covers mouse, touch and pen in one event; fires earlier (before focus moves), so the popup closes as the user starts interacting elsewhere. Using `click` causes edge cases: dragging to select text that starts inside and ends outside fires a click on the outside element, closing the menu unexpectedly.
- **Including the trigger ref**: otherwise pressing the trigger to close the menu fires outside-click (closing it) and then the button's onClick (reopening it), so the menu appears stuck open.
- **Portals**: the menu is rendered in `document.body`, outside the Dropdown's DOM subtree. A single wrapper ref with `contains` would treat clicks inside the menu as outside. Passing the menu's own ref solves it. (React events bubble through the React tree across portals, but native DOM containment checks don't.)
- **`composedPath()`**: in Shadow DOM, `event.target` is retargeted to the shadow host, so `contains(event.target)` can give wrong answers; `composedPath()` includes nodes inside open shadow roots.
- **Capture phase**: if an inner component calls `stopPropagation()` on pointerdown, a bubbling document listener would never see it; capture runs first.
- **Handler ref**: callers usually pass an inline arrow function, which changes every render. Storing it in a ref keeps the listener stable (no re-adding listeners each render) while always calling the latest handler (no stale state).
- **enabled flag**: only listen while open, avoiding work and surprise closes.

**Other edge cases:**
- **Iframes**: clicks inside an iframe don't reach the parent document. Listen for `window` `blur` (focus moved into the iframe) and close if appropriate.
- **Scrollbar clicks** on some browsers fire pointerdown on the document element; check `event.target === document.documentElement` if that matters.
- **Nested popovers** (a select inside a dialog): the inner popup must be counted as inside the outer, typically by registering refs in a shared context or using libraries that manage layers.
- **Right-click/context menu**: you may only want to react to primary button presses (`event.button === 0`).

**Accessibility:** outside click is a mouse/touch convenience. Keyboard and screen reader users need:
- **Escape** to close, with **focus returned** to the trigger.
- Closing when **focus leaves** the component via Tab (a `focusout` handler checking `relatedTarget`), or a deliberate focus trap for modal content.
- For modal dialogs, prefer the native `<dialog>` with `showModal()` (backdrop clicks can be handled via the dialog's click event and target check) and `inert` background.
- Many teams use headless libraries (Radix, React Aria, Floating UI's `useDismiss`) that implement all of this consistently."

#### Another worked example: the stuck-open dropdown
"A navigation dropdown couldn't be closed by clicking its own button: the outside-click handler closed it on mousedown, then the button's click handler reopened it. Adding the button to the hook's refs fixed it. Later, menus rendered in a portal started closing when users clicked menu items, because only the wrapper (not the portalled menu) was checked; passing the menu's ref fixed that too."

#### A third worked example: text selection closing a popover
"A comment editor in a popover closed whenever users selected text by dragging from inside the textarea to outside it, losing their draft. The hook used `click`, which fired on the element where the mouse was released. Switching to `pointerdown` (where the press started) fixed it, and we added a 'discard draft?' confirmation as a safety net."

#### Variations you might be asked
- "Implement it without refs (using a container element)": pass elements directly or use callback refs; refs are the idiomatic React approach.
- "Why not use onBlur instead?": blur events fire for focus changes, not clicks on non-focusable areas; and clicking a non-focusable element inside the component also blurs. Combine focusout for keyboard with pointerdown for pointer users.
- "How do you test it?": render the component, `userEvent.pointer`/click outside and inside, assert open state; test Escape and focus return.

#### Step-by-step framework
1. **Choose the event** (pointerdown, capture).
2. **Containment check** (contains/composedPath, multiple refs).
3. **Stable listener with handler ref** and enabled flag.
4. **Portals, Shadow DOM, iframes** edge cases.
5. **Usage** with trigger and popup.
6. **Accessibility**: Escape, focus return, focusout, dialogs.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| click listener with contains | pointerdown, capture, composedPath |
| Single ref only | Trigger + popup refs, portal-aware |
| Re-adds listener every render | Handler ref, stable effect |
| Ignores Shadow DOM/iframes | Handles retargeting and iframe blur |
| Mouse only | Escape, focus return, focusout for keyboard users |

#### Useful phrases
- "I listen for pointerdown so it covers mouse, touch and pen and fires before focus moves."
- "The trigger must count as inside, or clicking it closes and reopens the menu."
- "Portalled popups aren't inside the parent's DOM, so I pass their ref explicitly."
- "Outside click isn't enough for accessibility; Escape and focus handling are required."

#### Common pitfalls
- **Using click and closing on text-selection drags.**
- **Forgetting the trigger and portal refs.**
- **Stale handlers or listener churn.**
- **No keyboard dismissal.**

#### Follow-ups to expect (with sample answers)
- **"Why capture phase?"**
  "So inner components calling stopPropagation can't prevent the outside-click logic from seeing the event."
- **"What does composedPath return?"**
  "The list of nodes the event passes through, including inside open shadow roots, from target up to window."
- **"Would you use a library?"**
  "For production popovers, yes: Floating UI or Radix handle dismissal, layering, focus and positioning consistently."

#### What senior interviewers look for
- **Robust event handling.**
- **Edge-case awareness.**
- **Accessibility completeness.**

#### Practise it
1. Implement the hook and a dropdown with a portalled menu.
2. Add Escape handling with focus return and test with keyboard only.
3. Explain why pointerdown beats click here, out loud.

## Implement useIntersectionObserver for lazy loading
- id: f024b018-b1ad-4580-a31f-8b8e721cd4a9
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, hooks, IntersectionObserver, lazy-loading

### Prompt
Implement a `useIntersectionObserver` hook and use it for lazy loading content, infinite scroll and "seen" analytics. Explain the IntersectionObserver options (`root`, `rootMargin`, `threshold`), callback refs vs `useRef`, cleanup, sharing observers, and why this beats scroll listeners.

### Answer
#### What the interviewer is really testing
- Knowing **IntersectionObserver** and why it's better than scroll + `getBoundingClientRect`.
- Writing a hook with correct **lifecycle**: create, observe, disconnect, handle element changes.
- Understanding **callback refs** for elements that mount/unmount or change.
- Practical uses: **lazy rendering, infinite scroll sentinels, impression tracking, animations**, with options tuned correctly.

#### Key points
- **IntersectionObserver** asynchronously reports when a target enters/leaves the viewport (or a `root` element) without scroll listeners or forced layout.
- **Options**: `root` (scroll container, default viewport), **`rootMargin`** (grow/shrink the root box, e.g. `'200px'` to load early), **`threshold`** (visibility ratio(s) that trigger callbacks, e.g. 0, 0.5, 1).
- Entry fields: `isIntersecting`, `intersectionRatio`, `boundingClientRect`, `time`.
- Hook design: return `[ref, entry]` or `{ ref, isIntersecting }`; use a **callback ref** so changes in the target element are observed; **disconnect** on cleanup; optional **`freezeOnceVisible`** for one-time lazy loading.
- **Sharing observers** across many elements (one observer, many targets) is more efficient for large lists.
- Native `loading="lazy"` covers images/iframes; the hook is for components, data fetching, and custom behaviour.
- SSR: IntersectionObserver doesn't exist on the server; create it in effects only.

#### Model answer
"IntersectionObserver lets the browser tell me when an element becomes visible, instead of me checking positions on every scroll event. It's efficient (no layout thrashing, runs off the scroll path) and perfect for lazy loading, infinite scroll and impression tracking.

**The hook:**
```ts
import { useCallback, useEffect, useRef, useState } from 'react';

type Options = IntersectionObserverInit & { freezeOnceVisible?: boolean };

export function useIntersectionObserver<T extends Element>({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  freezeOnceVisible = false,
}: Options = {}) {
  const [node, setNode] = useState<T | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const frozen = freezeOnceVisible && !!entry?.isIntersecting;

  // callback ref: re-runs when the element mounts, unmounts or is replaced
  const ref = useCallback((el: T | null) => setNode(el), []);

  useEffect(() => {
    if (!node || frozen || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([e]) => setEntry(e), { root, rootMargin, threshold });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, root, rootMargin, frozen, Array.isArray(threshold) ? threshold.join(',') : threshold]);

  return { ref, entry, isIntersecting: !!entry?.isIntersecting };
}
```
Design decisions:
- **Callback ref + state** instead of `useRef`: with `useRef`, the effect wouldn't re-run if the element appears later (conditional rendering) or changes; a callback ref sets state, which re-runs the effect for the new element.
- **Cleanup with `disconnect()`** when the element, options or component change, avoiding leaks.
- **`freezeOnceVisible`**: for lazy loading, once visible we stop observing (content stays loaded).
- **Threshold arrays** are serialised in deps so a new array literal each render doesn't recreate the observer.
- **SSR guard**: the observer is created only in an effect, and the check protects older environments.

**Use 1: lazy render a heavy component:**
```tsx
function LazySection({ children, placeholderHeight = 400 }: { children: React.ReactNode; placeholderHeight?: number }) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ rootMargin: '300px', freezeOnceVisible: true });
  return (
    <div ref={ref} style={{ minHeight: isIntersecting ? undefined : placeholderHeight }}>
      {isIntersecting ? children : null}
    </div>
  );
}
// <LazySection><ReviewsWidget /></LazySection> — reviews code and data load when near the viewport
```
`rootMargin: '300px'` starts loading before the user reaches it, so content is ready when it scrolls in. The placeholder height prevents layout shift. Combine with `React.lazy` to defer the component's code too.

**Use 2: infinite scroll sentinel:**
```tsx
function Feed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({ /* ... */ });
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ rootMargin: '600px' });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      {data?.pages.flatMap((p) => p.items).map((item) => <FeedItem key={item.id} item={item} />)}
      <div ref={ref} aria-hidden="true" />
      {hasNextPage && <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>Load more</button>}
    </>
  );
}
```
The guard (`!isFetchingNextPage`) prevents duplicate fetches. I also include a 'Load more' button as an accessible fallback (keyboard users and screen reader users can trigger it; infinite scroll alone can trap keyboard users before the footer).

**Use 3: impression analytics ('seen' at least 50% for 1 second):**
```tsx
function TrackImpression({ id, children }: { id: string; children: React.ReactNode }) {
  const { ref, entry } = useIntersectionObserver<HTMLDivElement>({ threshold: 0.5 });
  const sent = useRef(false);
  useEffect(() => {
    if (!entry?.isIntersecting || sent.current) return;
    const t = setTimeout(() => { sent.current = true; track('impression', { id }); }, 1000);
    return () => clearTimeout(t);              // left the viewport before 1s: don't count
  }, [entry?.isIntersecting, id]);
  return <div ref={ref}>{children}</div>;
}
```

**Options explained:**
| Option | Meaning | Example |
|---|---|---|
| `root` | Element used as the viewport (must be an ancestor scroll container) | A scrollable sidebar |
| `rootMargin` | Expands/shrinks root bounds (CSS margin syntax) | `'200px 0px'` to trigger early |
| `threshold` | Visibility ratio(s) triggering callbacks | `0` any pixel, `0.5` half, `[0, 0.25, 0.5, 1]` progress |

**Why not scroll listeners?** A scroll handler that calls `getBoundingClientRect()` runs many times per second on the main thread and can force layout; IntersectionObserver computes intersections efficiently inside the browser's rendering pipeline and calls back asynchronously.

**Performance with many elements:** creating one observer per item in a 1,000-item list works but is wasteful. A shared observer (a module-level map from element to callback, one observer per options set) scales better; libraries like `react-intersection-observer` do this.

**When native features suffice:** `<img loading="lazy">` and `<iframe loading="lazy">` handle media; CSS `content-visibility: auto` skips rendering off-screen sections without JavaScript."

#### Another worked example: a long marketing page
"A landing page rendered 14 sections including a video carousel, a map and a reviews widget, shipping ~600 KB of JS upfront. Wrapping below-the-fold sections in `LazySection` with `React.lazy` deferred their code and data until within 300px of the viewport. Initial JS dropped to ~180 KB and LCP improved by 0.7 s on mobile, with no visible delay when scrolling."

#### A third worked example: duplicate page loads in infinite scroll
"An infinite feed sometimes loaded the same page twice and skipped items. The observer callback fired repeatedly while the sentinel stayed visible, and the fetch call had no in-flight guard. Adding `!isFetchingNextPage` to the condition (and letting TanStack Query manage cursors) fixed it."

#### Variations you might be asked
- "How would you implement a scroll-spy (highlight current section in a TOC)?": observe each section with thresholds and a rootMargin like `'-50% 0px -50% 0px'` so the section crossing the middle is active.
- "Can IntersectionObserver detect visibility behind other elements?": no; it measures geometric intersection, not occlusion (IntersectionObserver v2 adds trackVisibility in some browsers).
- "How do you test the hook?": mock IntersectionObserver in tests (jsdom doesn't implement it) and trigger entries manually; or test in Playwright with real scrolling.

#### Step-by-step framework
1. **Explain IntersectionObserver** and why it beats scroll handlers.
2. **Implement the hook** with callback ref, cleanup and options.
3. **Lazy section use case.**
4. **Infinite scroll with guards and accessible fallback.**
5. **Impression tracking.**
6. **Options, scaling and native alternatives.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Scroll listener with getBoundingClientRect | IntersectionObserver |
| useRef that misses late-mounting elements | Callback ref with state |
| No disconnect | Cleanup on change/unmount |
| Infinite scroll without guards | In-flight guard and Load more fallback |
| Ignores rootMargin | Prefetches with rootMargin |

#### Useful phrases
- "The browser tells me when the element becomes visible, so I don't poll on scroll."
- "A callback ref re-observes when the element mounts or changes."
- "rootMargin lets me start loading before the content is on screen."
- "I keep a Load more button so keyboard users aren't trapped by infinite scroll."

#### Common pitfalls
- **Missing cleanup.**
- **New threshold arrays recreating observers each render.**
- **Duplicate fetches.**
- **Layout shift** from unsized placeholders.

#### Follow-ups to expect (with sample answers)
- **"Why does isIntersecting fire immediately on observe?"**
  "The observer reports the initial state when observation starts, so components learn whether they're already visible."
- **"How do you observe within a scrollable container?"**
  "Pass that container as `root`; the target must be its descendant."
- **"What's the cost of many observers?"**
  "Each has overhead; share one observer for many targets with the same options."

#### What senior interviewers look for
- **Correct hook lifecycle.**
- **Practical UX and performance uses.**
- **Accessibility awareness.**

#### Practise it
1. Implement the hook and a LazySection, and verify deferred loading in the Network panel.
2. Build an infinite feed with a sentinel, guard and Load more button.
3. Explain why callback refs are used here, out loud.

## Next.js: ISR, SSR, SSG, CSR. Pick the right one for these cases.
- id: eeea5fcf-2f00-4cb1-b3c9-dafba129f000
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: Next.js, rendering-strategies
- companies: OpenAI, Anthropic

### Prompt
Explain static site generation (SSG), incremental static regeneration (ISR), server-side rendering (SSR), client-side rendering (CSR) and streaming/partial prerendering. Then choose and justify a strategy for: a marketing site, a logged-in analytics dashboard, an e-commerce product detail page, and a real-time chat app.

### Answer
#### What the interviewer is really testing
- Understanding **when HTML is generated** for each strategy and the trade-offs: performance, freshness, cost, SEO, personalisation.
- Mapping strategies to **App Router** concepts (static vs dynamic rendering, `revalidate`, tags, streaming, PPR).
- **Mixing strategies** per route and per component (static shell + dynamic parts).
- Justified, **context-specific** decisions for the four cases.

#### Key points
- **SSG**: HTML generated at **build time**; served from CDN; fastest, cheapest; stale until rebuild.
- **ISR**: static pages **regenerated in the background** after a revalidation period or **on demand** (webhook/tag); CDN speed with bounded staleness.
- **SSR (dynamic rendering)**: HTML generated **per request**; always fresh and personalised; costs server time, higher TTFB; cacheable only carefully.
- **CSR**: server sends a shell; JS fetches data and renders in the browser; good for highly interactive, private apps; worse first load and SEO.
- **Streaming SSR**: send the shell immediately and stream slower parts via Suspense.
- **Partial prerendering (PPR)**: static shell prerendered with dynamic holes streamed per request (Next.js, experimental/progressing).
- In the App Router, routes are **static by default** unless they use dynamic APIs (cookies, headers, searchParams) or opt out; `export const revalidate = n`, `fetch(..., { next: { revalidate, tags } })`, `revalidateTag`/`revalidatePath`.
- Choose **per route** and even **per component**; most real apps mix strategies.

#### Model answer
"The core question for each page is: when should the HTML be generated? At build time, periodically, on every request, or in the browser? The answer depends on how often the data changes, whether it's personalised, SEO needs, and cost.

**The strategies:**
| Strategy | HTML generated | Freshness | Speed | Personalisation | Cost | SEO |
|---|---|---|---|---|---|---|
| SSG | Build time | Until rebuild | Fastest (CDN) | None | Lowest | Excellent |
| ISR | Build + background regeneration | Bounded staleness / on-demand | CDN-fast | None (per page) | Low | Excellent |
| SSR / dynamic | Each request | Always fresh | Depends on server/data | Full | Higher | Excellent |
| CSR | In browser after JS loads | Fresh | Slow first load, fast after | Full | Low server | Weak for public content |
| Streaming / PPR | Shell immediately, rest streamed | Mixed | Fast first paint | Dynamic holes | Medium | Excellent |

**In the App Router:**
```tsx
// SSG: no dynamic data or APIs → static at build
export default async function About() { return <AboutContent />; }

// ISR: regenerate at most every 10 minutes, or on demand by tag
export const revalidate = 600;
const product = await fetch(`${API}/products/${id}`, { next: { revalidate: 600, tags: [`product-${id}`] } }).then((r) => r.json());
// in a CMS webhook / admin action:
revalidateTag(`product-${id}`);

// SSR (dynamic): uses cookies/headers/searchParams or opts out of caching
import { cookies } from 'next/headers';
export const dynamic = 'force-dynamic';

// Streaming: wrap slow parts
<Suspense fallback={<ReviewsSkeleton />}><Reviews id={id} /></Suspense>
```

**Case 1: Marketing site → SSG (with ISR for CMS content)**
- Content changes infrequently; must be fast, SEO-optimised and cheap to serve worldwide.
- Generate pages at build time; for CMS-driven pages (blog, landing pages), use ISR with **on-demand revalidation** triggered by a CMS webhook so edits appear within seconds without full rebuilds.
- Interactive bits (newsletter form, pricing toggle) are small client components.
- Personalisation (e.g. geo-based banners) via middleware/edge or small client-side fetches, keeping the page cacheable.

**Case 2: Logged-in analytics dashboard → dynamic SSR shell + client-side data (or CSR)**
- Private, personalised, no SEO needs; data updates frequently and users interact heavily (filters, date ranges, drill-downs).
- Server-render the authenticated shell and initial data (fast first view, auth checked on the server), then use client-side fetching (TanStack Query) for interactions, polling or websockets for live metrics.
- Pure CSR is also acceptable here (behind login, SEO irrelevant), but SSR of the first view improves perceived performance and avoids loading spinners for the whole page.
- Must not be cached publicly (`private`/dynamic).

**Case 3: E-commerce product detail page (PDP) → ISR/static with dynamic islands (or PPR)**
- High traffic, SEO-critical, performance directly affects conversion.
- Product content (title, images, description, reviews summary) changes occasionally: **static with ISR**, revalidated on demand when products are edited (webhooks) plus a periodic fallback (e.g. 10 minutes).
- **Price and stock** may change frequently and **cart/personalised recommendations** are user-specific: render those as **dynamic parts**: streamed server components in a Suspense boundary (PPR-style), or client components fetching fresh data.
- Use `generateStaticParams` for top-selling products at build; generate others on first request (cached thereafter).
- Result: CDN-speed LCP for the product content, fresh price/stock, personalised extras without making the whole page dynamic.

**Case 4: Real-time chat → CSR-heavy app with an SSR/static shell**
- Data changes constantly (messages, presence, typing indicators), is private, and SEO doesn't apply.
- Render the app shell (layout, sidebar skeleton) statically or with SSR for fast first paint and auth; conversation data loads client-side and updates over **WebSockets** (or SSE), with optimistic sending.
- Client state management (message lists, unread counts) and IndexedDB caching for offline/instant reloads.
- SSR of message history is possible for the first view, but real-time updates must be client-side.

**Mixing strategies and general rules:**
- Choose per route, and within a route by component (static shell + dynamic holes).
- Public + rarely changing → SSG/ISR. Public + frequently changing → ISR with short revalidation or streaming dynamic parts. Private/personalised → dynamic SSR and/or client fetching. Highly interactive real-time → client-side with an SSR shell.
- Watch caching correctness: never cache personalised HTML publicly; in Next 15, fetch caching is opt-in, so be explicit."

#### Another worked example: a PDP migration
"An e-commerce site server-rendered every product page on every request (~600 ms TTFB under load, high server costs). We switched product content to ISR with on-demand revalidation from the product catalogue service, and moved price, stock and 'recently viewed' into a dynamic Suspense boundary. p75 TTFB dropped to ~80 ms from the CDN, LCP improved by 0.9 s, server costs fell about 60%, and prices stayed accurate within seconds of changes."

#### A third worked example: a dashboard mistakenly cached
"A team marked a dashboard route static by accident (it fetched data without using cookies directly), so the first user's data was cached and shown to others in staging. We made the route dynamic (reading the session via `cookies()`), added `Cache-Control: private` headers, and added tests asserting that responses differ per user. Caching mistakes with personalised data are security bugs, not just performance bugs."

#### Variations you might be asked
- "What's the difference between ISR and SSR with CDN caching (s-maxage, stale-while-revalidate)?": conceptually similar; ISR is framework-managed regeneration with on-demand invalidation, while SSR + CDN caching uses HTTP headers.
- "How does SEO work with CSR?": Google can render JS, but it's slower and less reliable; other crawlers and social previews may not. Prefer server-rendered HTML for public pages.
- "What's edge rendering?": running SSR or middleware at CDN edge locations for lower latency, with runtime limitations (no full Node APIs, data often still far away).

#### Step-by-step framework
1. **Define each strategy** by when HTML is generated.
2. **Compare trade-offs** in a table.
3. **Map to App Router APIs.**
4. **Decide per case** with justification.
5. **Mix strategies** per route/component.
6. **Caching correctness** and monitoring.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| One strategy for the whole app | Per route and per component |
| "SSR is always best for SEO" | Uses SSG/ISR for public, cacheable content |
| PDP fully dynamic | Static content + dynamic price/stock islands |
| Chat via SSR | Client real-time with SSR shell |
| Ignores caching risks | Private data never publicly cached |

#### Useful phrases
- "The real question is when the HTML should be generated."
- "Product content is static with on-demand revalidation; price and stock are dynamic islands."
- "Behind a login, SEO doesn't matter, so I optimise for interactivity and freshness."
- "Personalised pages must never be cached publicly."

#### Common pitfalls
- **Everything SSR** (cost, TTFB).
- **Everything CSR** for public pages (SEO, LCP).
- **Stale prices** from long ISR intervals.
- **Accidental static caching** of personalised routes.

#### Follow-ups to expect (with sample answers)
- **"What's on-demand revalidation?"**
  "Invalidating a cached page or tag via `revalidateTag`/`revalidatePath` when data changes (e.g. CMS webhook), instead of waiting for a timer."
- **"How do you handle thousands of products at build?"**
  "Pre-generate the most popular with generateStaticParams; generate the rest on first request and cache them."
- **"What is partial prerendering?"**
  "A rendering model where the static parts of a route are prerendered and served instantly, while dynamic parts (wrapped in Suspense) stream in per request."

#### What senior interviewers look for
- **Clear trade-off reasoning.**
- **Modern Next.js knowledge.**
- **Caching safety.**

#### Practise it
1. For a site you know, assign a rendering strategy to each route with justification.
2. Implement ISR with on-demand revalidation for a product page.
3. Explain the four cases out loud in 3 minutes.

## Explain React 19 useOptimistic hook
- id: 47e0f407-3c07-4517-9f7a-7d1586b69c01
- roles: frontend, fullstack, ai
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React, React19, optimistic-ui
- companies: Meta, Anthropic

### Prompt
What does React 19's `useOptimistic` do? Show how to use it with an async action (e.g. sending a message or liking a post), explain how it reverts on failure, how it relates to transitions, Actions and `useActionState`, and compare it with optimistic updates in TanStack Query.

### Answer
#### What the interviewer is really testing
- Understanding **optimistic UI**: showing the expected result immediately before the server confirms.
- How **`useOptimistic`** derives temporary state that **automatically resets** when the action finishes.
- Integration with **transitions/Actions**, forms and Server Actions.
- **Error handling, rollback, reconciliation** and when optimistic UI is inappropriate.
- Comparison with **TanStack Query** `onMutate`/rollback patterns.

#### Key points
- `const [optimisticState, addOptimistic] = useOptimistic(state, updateFn)`: returns a value equal to `state` normally, or the optimistic version while an action is pending.
- `addOptimistic(input)` must be called **inside a transition or Action** (e.g. form action, `startTransition`).
- When the async action completes, React **discards** the optimistic state and shows the real `state` (updated from server data or parent state). On failure, the optimistic value disappears automatically (you still show an error).
- Works naturally with **form actions** and **Server Actions**; `useFormStatus`/`useActionState` provide pending state and results.
- Mark optimistic items (e.g. "Sending…") and handle **errors** visibly (retry).
- Use for **low-risk, high-confidence** actions (likes, messages, toggles, reordering); avoid for payments or irreversible actions.
- TanStack Query: manual `onMutate` (snapshot + update cache), `onError` (rollback), `onSettled` (invalidate); more control, works for cache-wide updates.

#### Model answer
"Optimistic UI shows the result of an action immediately, assuming it will succeed, then reconciles with the server's response. `useOptimistic` is React 19's built-in way to do this for state tied to an Action: it gives you a temporary version of state that only exists while the action is pending.

**Signature:**
```tsx
const [optimisticItems, addOptimisticItem] = useOptimistic(
  items,                                           // the real state (from server/parent)
  (current, newItem: Item) => [...current, newItem] // how to apply an optimistic change
);
```
- While no action is pending, `optimisticItems === items`.
- Calling `addOptimisticItem(x)` inside an Action/transition immediately renders `optimisticItems` with `x` applied.
- When the action finishes, React throws away the optimistic version and renders the real `items` again (which should now include the confirmed item if the action updated it, or not include it if it failed).

**Example: sending a chat message with a Server Action:**
```tsx
'use client';
import { useOptimistic, useRef } from 'react';
import { sendMessage } from './actions';            // 'use server' function

type Message = { id: string; text: string; sending?: boolean };

export function Thread({ messages }: { messages: Message[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (current, text: string) => [...current, { id: `temp-${Date.now()}`, text, sending: true }],
  );

  async function action(formData: FormData) {
    const text = String(formData.get('text') ?? '').trim();
    if (!text) return;
    addOptimistic(text);                            // shows immediately with 'Sending…'
    formRef.current?.reset();
    const result = await sendMessage(text);         // server persists and revalidates the thread
    if (!result.ok) toast.error('Message failed to send. Tap to retry.');
  }

  return (
    <>
      <ul>
        {optimisticMessages.map((m) => (
          <li key={m.id} aria-busy={m.sending}>
            {m.text} {m.sending && <small>Sending…</small>}
          </li>
        ))}
      </ul>
      <form ref={formRef} action={action}>
        <label htmlFor="text" className="visually-hidden">Message</label>
        <input id="text" name="text" autoComplete="off" />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
```
Flow:
1. User submits; the form action runs inside a transition automatically.
2. `addOptimistic` renders the message instantly, marked 'Sending…'.
3. The Server Action saves it and calls `revalidatePath`, so the parent re-renders with fresh `messages` including the real message (with its real ID).
4. The action completes; React drops the optimistic state and shows the real list. No manual cleanup.
5. On failure, the real list doesn't include the message, so the optimistic one disappears; we show an error and offer retry (for chat, keeping the failed text so the user doesn't lose it is important: store it in local state for a retry UI).

**Example: like button with startTransition:**
```tsx
function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  const [optimistic, setOptimistic] = useOptimistic(
    { liked, count },
    (cur, nextLiked: boolean) => ({ liked: nextLiked, count: cur.count + (nextLiked ? 1 : -1) }),
  );
  const [isPending, startTransition] = useTransition();

  return (
    <button
      aria-pressed={optimistic.liked}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic.liked);
          await toggleLike(postId, !optimistic.liked);   // Server Action / API; parent props update after revalidation
        })
      }
    >
      {optimistic.liked ? '♥' : '♡'} {optimistic.count}
    </button>
  );
}
```

**How it relates to the other React 19 pieces:**
- **Actions**: functions passed to `<form action>` or run in `startTransition(async () => ...)`; React tracks their pending state.
- **`useActionState(action, initialState)`**: returns `[state, formAction, isPending]` for form results (validation errors, success messages).
- **`useFormStatus()`**: lets a child (like a submit button) read the pending state of the parent form.
- **`useOptimistic`**: the temporary UI during the action.
Together: the form submits via an action, the button shows pending, the list shows optimistic items, and the action's returned state shows errors.

**Comparison with TanStack Query optimistic updates:**
```ts
useMutation({
  mutationFn: addTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData<Todo[]>(['todos']);
    queryClient.setQueryData<Todo[]>(['todos'], (old = []) => [...old, { ...newTodo, id: 'temp' }]);
    return { previous };
  },
  onError: (_err, _vars, ctx) => queryClient.setQueryData(['todos'], ctx?.previous),   // rollback
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),            // reconcile
});
```
| | useOptimistic | TanStack Query |
|---|---|---|
| Scope | Local component state during an action | Shared cache (all components using the query) |
| Rollback | Automatic when action ends | Manual snapshot and restore |
| Best with | Server Actions, forms, RSC data | Client-fetched data, complex caches |
| Reconciliation | Real state from revalidation/props | invalidate/refetch or setQueryData with response |

**When not to be optimistic:** payments, irreversible deletes without undo, actions with a high failure rate or complex server-side validation. For deletes, an 'Undo' toast (delay the real delete) is often better UX.

**Edge cases:** rapid repeated actions (each optimistic update stacks; the update function receives the current optimistic state), IDs for temporary items (replace with real IDs on reconciliation), accessibility (announce failures; mark pending items with `aria-busy`)."

#### Another worked example: a comment system
"Comments on a content site took 600–900 ms to appear after posting, and users double-posted. With `useOptimistic` and a Server Action that revalidated the comments list, comments appeared instantly with a subtle 'Posting…' label, and failures restored the text into the input with an error message. Double-posting stopped and engagement with comments rose."

#### A third worked example: when optimism backfired
"A team made 'Place order' optimistic, showing a confirmation page immediately. When payment authorisation failed (~3% of attempts), users had already left thinking the order succeeded. We reverted to a pessimistic flow with a clear processing state for payments, and kept optimistic UI for cart quantity changes, where failures are rare and easily corrected."

#### Variations you might be asked
- "Does useOptimistic work without Server Actions?": yes; any async function run in startTransition works, as long as the real state updates afterwards (e.g. from a refetch).
- "What if the server returns different data than predicted?": the real state replaces the optimistic one when the action ends, so the UI reconciles automatically.
- "How do you handle errors with useActionState?": return an error state from the action and render it; the optimistic value has already been discarded.

#### Step-by-step framework
1. **Define optimistic UI.**
2. **Explain useOptimistic's signature and lifecycle.**
3. **Show an example** with an Action.
4. **Error handling and reconciliation.**
5. **Relate to Actions, useActionState, useFormStatus.**
6. **Compare with TanStack Query** and when not to use it.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It updates state before the server" | Explains temporary derived state and automatic reset |
| Calls it outside transitions | Inside Actions/startTransition |
| No failure handling | Error message, retry, preserved input |
| Uses it for payments | Chooses low-risk actions |
| Unaware of TanStack patterns | Compares scope and rollback |

#### Useful phrases
- "The optimistic state only exists while the action is pending."
- "When the action finishes, React shows the real state again, so rollback is automatic."
- "I mark optimistic items as pending and handle failures visibly."
- "I don't make payments optimistic."

#### Common pitfalls
- **Forgetting to update the real state** (optimistic item vanishes even on success).
- **Calling addOptimistic outside a transition.**
- **Silent failures.**
- **Optimism for high-risk actions.**

#### Follow-ups to expect (with sample answers)
- **"Why must the real state change for the item to stay?"**
  "useOptimistic only overlays changes during the action; afterwards it shows the source state, which must reflect the server result."
- **"How do temporary IDs get replaced?"**
  "The real state from the server includes real IDs; when the optimistic overlay is discarded, React renders the real items."
- **"Can you stack multiple optimistic updates?"**
  "Yes; each call applies to the current optimistic state, and all are discarded when their actions complete."

#### What senior interviewers look for
- **Correct React 19 mental model.**
- **UX judgement about optimism.**
- **Data-layer comparisons.**

#### Practise it
1. Build an optimistic chat thread with a Server Action and failure handling.
2. Implement the same with TanStack Query and compare.
3. Explain when optimistic UI is inappropriate, out loud.

## The rules of hooks and why they exist
- id: fe-react-01
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: easy
- levels:
- tags: hooks, rules of hooks, React internals

### Prompt
What are the rules of hooks, and why do they exist? Explain how React stores hook state internally, what breaks if you call hooks conditionally or in loops, how custom hooks follow the rules, and the broader Rules of React (purity, immutability) that the React Compiler relies on.

### Answer
#### What the interviewer is really testing
- Knowing the **two rules**: call hooks at the **top level** and only from **React functions** (components or custom hooks).
- Understanding the **internal reason**: hooks are stored by **call order** per component instance.
- Recognising **real bugs** from violations and how to restructure code.
- Awareness of the **broader Rules of React** (pure render, no mutation) and lint enforcement.

#### Key points
- **Rule 1**: only call hooks at the top level: not inside conditions, loops, nested functions, after early returns, or in try/catch blocks.
- **Rule 2**: only call hooks from function components or custom hooks (names starting with `use`), not regular functions or class components.
- React stores hook state as an **ordered list per component instance** (on the fiber). On each render, the n-th hook call gets the n-th slot. Changing the order or count mismatches slots, corrupting state or crashing ("Rendered fewer hooks than expected").
- **Custom hooks** are functions that call hooks; each component using one gets its **own state**.
- Restructure conditionals: call the hook unconditionally and branch inside it, pass a flag (`enabled`), or split into separate components.
- Early returns must come **after** all hooks.
- **React 19's `use`** can be called conditionally (it's an API, not a stateful hook).
- **ESLint `react-hooks`** plugin enforces rules and exhaustive deps.
- Broader **Rules of React**: components and hooks must be **pure**/idempotent during render, **props and state are immutable**, return values/arguments of hooks shouldn't be mutated, side effects belong in effects/handlers. The **React Compiler** depends on these.

#### Model answer
"There are two rules: call hooks only at the top level of your component or custom hook, and call them only from React function components or other custom hooks. They exist because of how React remembers hook state.

**How React stores hooks.** React doesn't know your hooks by name. For each component instance, it keeps an ordered list of hook slots. On every render, the first hook call gets slot 1, the second gets slot 2, and so on:
```tsx
function Profile() {
  const [name, setName] = useState('');       // slot 1
  const [age, setAge] = useState(0);          // slot 2
  useEffect(() => { document.title = name; }, [name]);   // slot 3
  ...
}
```
Conceptually React does: `slots[0]` → name state, `slots[1]` → age state, `slots[2]` → effect. That only works if hooks are called in the **same order with the same count** on every render.

**What breaks with a conditional hook:**
```tsx
function Profile({ showAge }: { showAge: boolean }) {
  const [name, setName] = useState('');
  if (showAge) {
    const [age, setAge] = useState(0);        // ❌ only sometimes called
  }
  const [email, setEmail] = useState('');
}
```
When `showAge` is true, `email` is slot 3; when it becomes false, `email`'s `useState` reads slot 2, which holds `age` state. State gets mixed up, or React throws 'Rendered fewer/more hooks than during the previous render'.

**Other violations:**
```tsx
items.forEach((item) => { const [x] = useState(); });   // ❌ loop: count changes with items
function handleClick() { useEffect(() => {}); }          // ❌ inside a nested function
if (!user) return null;
const [tab, setTab] = useState('a');                     // ❌ after an early return
```

**Fixing patterns:**
1. **Call unconditionally, branch inside:**
```tsx
const [age, setAge] = useState(0);
useEffect(() => {
  if (!showAge) return;                     // condition inside the hook
  trackAgeShown();
}, [showAge]);
```
2. **Pass an enabled flag** to custom hooks: `useQuery({ queryKey, queryFn, enabled: !!userId })`.
3. **Move early returns after hooks:**
```tsx
function Page({ user }: { user: User | null }) {
  const [tab, setTab] = useState('overview');
  if (!user) return <SignInPrompt />;       // ✓ after all hooks
  return <Tabs value={tab} onChange={setTab} />;
}
```
4. **Split components** for lists or conditional features: render `<ItemRow item={item} />` per item, each with its own hooks:
```tsx
{items.map((item) => <ItemRow key={item.id} item={item} />)}   // hooks live inside ItemRow
{showAge && <AgeField />}                                       // conditional component, not conditional hook
```

**Rule 2 and custom hooks.** Hooks rely on React's 'current component being rendered' context, so they only work while React is rendering a component. Custom hooks (functions starting with `use` that call hooks) are just a way to reuse logic; every component calling `useWindowSize()` gets its own independent state, because the hook's internal `useState` calls are part of that component's slot list. The `use` prefix lets the lint rule check them.

**Exceptions:** React 19's `use(promise | context)` can be called conditionally and in loops, because it doesn't store state in a slot the same way. It still must be called during render.

**Enforcement:** `eslint-plugin-react-hooks` with `rules-of-hooks` (errors on violations) and `exhaustive-deps` (warns about missing effect/memo dependencies). I treat these as errors in CI.

**The broader Rules of React** (documented by the React team, and required by the React Compiler):
- **Components and hooks must be pure during render**: same inputs → same output; no side effects (network calls, subscriptions, DOM mutations, writing refs) during render.
- **Props and state are immutable**: never mutate them; create new values.
- **Don't mutate values after passing them to JSX or hooks** (e.g. pushing to an array after using it as a prop).
- **Never call component functions directly** (`MyComponent()`); render them as JSX so React manages their hooks.
- **Don't pass hooks around as values or call them dynamically.**
The React Compiler uses these assumptions to automatically memoize; code that breaks them may be skipped by the compiler or behave incorrectly."

#### Another worked example: a crash from an early return
"A component returned early while data was loading, and only defined a `useEffect` afterwards. When loading finished, React saw one more hook than on the previous render and crashed with 'Rendered more hooks than during the previous render'. Moving the effect above the early return (with a guard inside) fixed it. Enabling the lint rule as an error caught three similar issues elsewhere."

#### A third worked example: calling a component as a function
"Someone rendered tabs with `tabs.map((t) => t.render())` where `render` was a component using hooks. The hooks became part of the parent's slot list, and switching tabs (different components with different hook counts) caused state from one tab to appear in another. Rendering them as JSX elements (`<t.Component />`) gave each its own instance and state."

#### Variations you might be asked
- "Why can't class components use hooks?": hooks rely on function component rendering and fiber hook lists; classes have their own state mechanism.
- "Can you call hooks inside useMemo or useEffect callbacks?": no; those are nested functions called at other times.
- "How do hooks know which component they belong to?": React sets an internal 'currently rendering fiber' pointer while rendering each component; hooks read and write that fiber's hook list.

#### Step-by-step framework
1. **State the two rules.**
2. **Explain ordered slot storage.**
3. **Show what breaks** with conditionals, loops, early returns.
4. **Fix patterns**: unconditional calls, enabled flags, splitting components.
5. **Custom hooks and the use API exception.**
6. **Lint enforcement and broader Rules of React.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Recites rules only | Explains call-order storage |
| Can't fix violations | Shows restructuring patterns |
| Thinks custom hooks share state | Each component gets its own state |
| Unaware of `use` exception | Knows use() can be conditional |
| No mention of purity rules | Rules of React and the Compiler |

#### Useful phrases
- "React matches hooks by the order they're called, not by name."
- "Instead of a conditional hook, I render a conditional component."
- "Early returns go after all hooks."
- "The React Compiler relies on components being pure and not mutating props or state."

#### Common pitfalls
- **Hooks after early returns.**
- **Hooks in loops** instead of child components.
- **Calling components as functions.**
- **Disabling the lint rule.**

#### Follow-ups to expect (with sample answers)
- **"Why does the lint rule require the use prefix?"**
  "It identifies custom hooks so the linter can verify they follow the rules and that callers treat them as hooks."
- **"What error do you get for conditional hooks?"**
  "'Rendered more/fewer hooks than during the previous render' or mismatched state that's hard to debug."
- **"Is reading a ref during render allowed?"**
  "It's discouraged because refs are mutable and not tracked; reading during render can break purity (except lazy initialisation)."

#### What senior interviewers look for
- **Internal understanding.**
- **Practical restructuring skills.**
- **Awareness of modern rules and tooling.**

#### Practise it
1. Write a component with a conditional hook, observe the error, then fix it two ways.
2. Turn on the react-hooks lint rules as errors in a project.
3. Explain why hook order matters, out loud, in 60 seconds.

## useEffect pitfalls: you might not need an effect
- id: fe-react-02
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: useEffect, effects, derived state, React patterns

### Prompt
What are the most common `useEffect` mistakes? Explain when you don't need an effect (derived state, event-driven logic, resetting state, data fetching), how dependency arrays and cleanups really work, infinite loops, and what effects are actually for.

### Answer
#### What the interviewer is really testing
- Understanding that effects are for **synchronising with external systems**, not general logic.
- Recognising **unnecessary effects**: derived state, handling events, resetting state, chains of effects.
- Correct **dependencies, cleanups** and avoiding **infinite loops** and stale closures.
- Knowing **better alternatives**: compute during render, event handlers, keys, data libraries, `useSyncExternalStore`.

#### Key points
- **Effects synchronise a component with something outside React**: network, subscriptions, timers, DOM APIs, third-party widgets, analytics on display.
- **Don't use effects for derived data**: compute during render (with `useMemo` if expensive).
- **Don't use effects for user events**: put logic in the event handler (submitting, sending analytics for a click, showing a toast after an action).
- **Resetting state on prop change**: use a **key**, not an effect.
- **Adjusting state on prop change**: often derive instead; rarely, set state during render with a guard.
- **Chains of effects** (effect A sets state that triggers effect B…) cause extra renders and bugs; compute in one place or in the handler.
- **Data fetching**: possible with cleanup, but prefer **TanStack Query, framework loaders, Server Components**.
- **Dependencies** must include every reactive value used; objects/functions created during render change every time → loops or excess runs; fix by moving them inside the effect, memoizing, or depending on primitives.
- **Cleanup** runs before the next run and on unmount; required for subscriptions, timers, listeners, requests.
- **Infinite loops**: setting state that's in the dependency list without a condition, or new object deps each render.
- `useLayoutEffect` only for DOM measurement before paint.

#### Model answer
"I think of `useEffect` as an escape hatch for synchronising with systems outside React. A lot of effect code I review doesn't need an effect at all, and removing it makes components simpler, faster and less buggy.

**1. Derived state: compute during render**
```tsx
// ❌ effect + extra state: renders twice, can be out of sync for a frame
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(`${first} ${last}`); }, [first, last]);

// ✓ derive
const fullName = `${first} ${last}`;

// ✓ expensive derivation
const visibleTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);
```

**2. Event-driven logic: put it in the handler**
```tsx
// ❌ effect reacting to state set by a click
const [submitted, setSubmitted] = useState(false);
useEffect(() => {
  if (submitted) { post('/api/register', form); toast('Registered!'); }
}, [submitted]);

// ✓ do it where it happens
async function handleSubmit() {
  await post('/api/register', form);
  toast('Registered!');
}
```
Rule of thumb: if the code runs because the user did something, it belongs in the event handler. If it runs because the component is displayed, it may belong in an effect.

**3. Resetting state when a prop changes: use a key**
```tsx
// ❌ effect resets state after rendering stale state once
useEffect(() => { setComment(''); }, [userId]);

// ✓ remount with fresh state
<CommentBox key={userId} userId={userId} />
```

**4. Notifying parents: call the callback in the handler**
```tsx
// ❌ effect calls onChange after state updates (extra render, ordering bugs)
useEffect(() => { onChange(isOn); }, [isOn, onChange]);

// ✓
function toggle() { const next = !isOn; setIsOn(next); onChange(next); }
// or make it fully controlled by the parent
```

**5. Chains of effects**: effect A sets state X, effect B watches X and sets Y, effect C watches Y… Each step is an extra render and a chance for inconsistent intermediate states. Compute the final values in one event handler or derive them.

**6. Data fetching: possible, but prefer a library**
If I do fetch in an effect, it needs cleanup to avoid races:
```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/items?q=${encodeURIComponent(query)}`, { signal: controller.signal })
    .then((r) => r.json()).then(setItems)
    .catch((e) => { if (e.name !== 'AbortError') setError(e); });
  return () => controller.abort();
}, [query]);
```
But TanStack Query/SWR or the framework (Server Components, route loaders) handle caching, deduplication, retries and races, so I'd use those in production.

**What effects ARE for:**
```tsx
// Subscribing to an external system
useEffect(() => {
  const unsubscribe = chatClient.subscribe(roomId, onMessage);
  return unsubscribe;
}, [roomId]);

// Browser APIs
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);

// Third-party widgets
useEffect(() => {
  const map = new MapLibrary(containerRef.current!, { center });
  return () => map.destroy();
}, []);

// Analytics when something is shown
useEffect(() => { track('page_view', { path }); }, [path]);
```
For subscribing to external stores (browser online status, a custom store), `useSyncExternalStore` is often better than an effect + state.

**Dependencies and how they really work:**
- After every render where any dependency changed (`Object.is` comparison), React runs the previous cleanup, then the effect.
- **Include every reactive value used inside** (props, state, values derived from them); the exhaustive-deps lint rule catches omissions. Omitting a dependency to 'run once' creates stale closures.
- **Objects and functions created during render** are new every time, so the effect runs every render:
```tsx
const options = { roomId, serverUrl };          // ❌ new object each render
useEffect(() => { connect(options); }, [options]);

useEffect(() => {                                // ✓ create inside the effect
  const conn = connect({ roomId, serverUrl });
  return () => conn.disconnect();
}, [roomId, serverUrl]);
```
- Functions used only by the effect: define them inside the effect, or memoize with `useCallback` if shared.
- Reading the latest value without re-running (e.g. a callback prop in a subscription): store it in a ref, or React's `useEffectEvent` (experimental/new) designed for this.

**Infinite loops:**
```tsx
useEffect(() => { setCount(count + 1); }, [count]);          // ❌ always changes its own dependency
useEffect(() => { setData(transform(raw)); });               // ❌ no deps: runs after every render, sets state, re-renders…
useEffect(() => { fetchItems(filters); }, [filters]);       // ❌ if filters is a new object each render
```
Fixes: derive instead of setting state, add correct deps, stabilise objects, or add conditions.

**Cleanup:** required whenever the effect starts something ongoing (subscriptions, timers, listeners, requests, widgets). StrictMode's double-invocation in development is there to verify cleanups exist.

**useLayoutEffect:** only when you must measure or mutate the DOM before the browser paints (tooltips, preventing flicker); it blocks painting, so avoid it otherwise."

#### Another worked example: removing a chain of effects
"A checkout form had five effects: when country changed, reset region; when region changed, recompute shipping options; when shipping changed, recompute totals; when totals changed, call `onTotalChange`; when the form was 'submitted', send the order. A bug showed old shipping prices for a frame after changing country. We replaced it with derived values (shipping options and totals computed during render with useMemo), resetting region in the country change handler, calling `onTotalChange` in handlers, and submitting in the submit handler. Four effects deleted, the stale-price bug gone, and fewer renders."

#### A third worked example: an infinite fetch loop
"A component fetched with `useEffect(() => { load(params) }, [params])` where `params` was built inline as `{ page, sort }`. Each render created a new object, re-running the effect, which set state and re-rendered: an infinite request loop hitting the API hundreds of times per second. Depending on `page` and `sort` directly (and later using TanStack Query with `queryKey: ['items', page, sort]`) fixed it."

#### Variations you might be asked
- "When would you set state during render?": rarely, to adjust state when a prop changes without an extra effect pass, guarded by comparing with a stored previous value; keys or derivation are usually better.
- "What's the difference between an empty dependency array and none?": `[]` runs after mount only (plus cleanup on unmount); no array runs after every render.
- "How does useSyncExternalStore help?": subscribes to external sources with correct concurrent rendering behaviour and SSR snapshots, replacing effect + setState patterns.

#### Step-by-step framework
1. **Define effects' purpose**: synchronising with external systems.
2. **Unnecessary effects**: derived state, events, resets, parent notifications, chains.
3. **Legitimate effects** with cleanup.
4. **Dependencies** and stabilising values.
5. **Infinite loops** and stale closures.
6. **Alternatives**: keys, handlers, libraries, useSyncExternalStore, useLayoutEffect usage.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Uses effects for everything | Effects only for external synchronisation |
| Derived state in effects | Computes during render |
| Event logic in effects | Logic in handlers |
| Omits deps to run once | Correct deps, stable values, refs for latest |
| No cleanup | Cleanup for every ongoing resource |

#### Useful phrases
- "If it's caused by a user action, it goes in the event handler, not an effect."
- "Derived values are computed during render."
- "A key resets state more cleanly than an effect."
- "Effects synchronise with things outside React and must clean up after themselves."

#### Common pitfalls
- **Effect chains.**
- **New objects in dependency arrays.**
- **Missing cleanup.**
- **Suppressing exhaustive-deps warnings.**

#### Follow-ups to expect (with sample answers)
- **"Why does StrictMode run my effect twice?"**
  "To check that the cleanup correctly undoes the effect; production runs it once per mount."
- **"How do you run code only once on app start?"**
  "Module-level code or a top-level guard outside components; effects with [] can still run twice in StrictMode development and per mount."
- **"How do you read the latest props inside a long-lived subscription?"**
  "Keep the latest value in a ref updated after render, or use useEffectEvent where available."

#### What senior interviewers look for
- **Effect discipline.**
- **Simpler, derived designs.**
- **Correct dependency and cleanup handling.**

#### Practise it
1. Find three effects in a codebase that can be removed (derived state, events, resets) and refactor them.
2. Reproduce an infinite loop from an object dependency and fix it.
3. Explain what effects are for, out loud, in 30 seconds.

## useRef, forwardRef and useImperativeHandle
- id: fe-react-03
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: refs, forwardRef, useImperativeHandle, DOM, React 19

### Prompt
Explain `useRef` for DOM access and for mutable values, how refs differ from state, callback refs, passing refs to child components (`forwardRef` and React 19's ref-as-prop), and `useImperativeHandle`. When are imperative APIs appropriate, and what are the common mistakes?

### Answer
#### What the interviewer is really testing
- Understanding refs as **mutable containers that don't trigger renders**.
- Correct **DOM ref** usage (focus, measure, scroll, integrate libraries).
- **Callback refs** for dynamic elements and measurement.
- **Ref forwarding** (`forwardRef` → ref as prop in React 19) and **useImperativeHandle** for limited imperative APIs.
- Avoiding **misuse**: refs instead of state for rendered values, reading refs during render.

#### Key points
- `useRef(initial)` returns a stable object `{ current }` that persists across renders; **changing `.current` doesn't re-render**.
- Two uses: **DOM references** (`<input ref={inputRef}>`) and **mutable instance values** (timer IDs, previous values, latest callbacks, flags).
- Use **state** for anything that affects what's rendered; use **refs** for values the UI doesn't display.
- **Don't read or write refs during render** (except lazy initialisation); do it in effects and handlers.
- **Callback refs** (`ref={(el) => ...}`) run when the element mounts/unmounts; useful for measuring, observing, or lists of refs. React 19 allows returning a cleanup from callback refs.
- **forwardRef** (React 18 and earlier) lets a component receive a `ref` and pass it to a child DOM element; **React 19 passes `ref` as a regular prop** for function components.
- **useImperativeHandle** customises what the parent's ref exposes (e.g. `focus`, `scrollToBottom`), hiding the internal DOM.
- Imperative APIs are appropriate for **focus, scroll, media playback, animations, measuring, integrating non-React libraries**; not for data flow.

#### Model answer
"A ref is a box (`{ current }`) that React keeps the same across renders. Unlike state, changing what's in the box doesn't cause a re-render. That makes refs useful for two things: pointing at DOM elements and storing values that the UI doesn't need to display.

**1. DOM refs:**
```tsx
function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus search</button>
    </>
  );
}
```
React sets `inputRef.current` to the DOM node after mounting and back to `null` on unmount. Common uses: focusing, selecting text, scrolling into view, measuring size/position, playing/pausing media, and handing a DOM node to a non-React library (charts, maps, editors).

**2. Mutable values that shouldn't trigger renders:**
```tsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);            // shown in UI → state
  const intervalRef = useRef<number | null>(null);       // not shown → ref

  const start = () => {
    if (intervalRef.current !== null) return;
    const startedAt = Date.now() - elapsed;
    intervalRef.current = window.setInterval(() => setElapsed(Date.now() - startedAt), 100);
  };
  const stop = () => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };
  useEffect(() => stop, []);                             // cleanup on unmount
  return <><p>{(elapsed / 1000).toFixed(1)}s</p><button onClick={start}>Start</button><button onClick={stop}>Stop</button></>;
}
```
Other typical ref values: previous values (`prevValueRef`), the latest callback for use in subscriptions, 'has this run' flags, AbortControllers, and instances of third-party objects.

**Refs vs state:**
| | State | Ref |
|---|---|---|
| Triggers re-render on change | Yes | No |
| Value during render | Snapshot for that render | Mutable, may change anytime |
| Use for | Anything displayed | DOM nodes, timers, instance values |

**Don't read or write refs during render** (other than lazy initialisation): render should be pure, and a ref's value isn't tracked by React, so the UI won't update when it changes. A common bug is storing displayed data in a ref and wondering why the screen doesn't update.

**3. Callback refs:**
```tsx
function MeasuredBox() {
  const [height, setHeight] = useState(0);
  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setHeight(node.getBoundingClientRect().height);
  }, []);
  return <div ref={measuredRef}>…content… (height: {height}px)</div>;
}
```
A callback ref runs when the element attaches (with the node) and detaches (with `null`; in React 19 you can return a cleanup function instead). Useful when the element appears conditionally, for observing with ResizeObserver/IntersectionObserver, or for refs to list items:
```tsx
const itemRefs = useRef(new Map<string, HTMLLIElement>());
{items.map((item) => (
  <li key={item.id} ref={(el) => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}>
    {item.label}
  </li>
))}
// later: itemRefs.current.get(id)?.scrollIntoView({ block: 'nearest' })
```

**4. Passing refs to child components.** A parent can't attach a ref to a custom component's DOM node unless the component forwards it.

*React 18 and earlier: forwardRef:*
```tsx
const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput({ label, ...rest }, ref) {
  return <label>{label}<input ref={ref} {...rest} /></label>;
});
```
*React 19: ref is a regular prop for function components:*
```tsx
function TextInput({ label, ref, ...rest }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return <label>{label}<input ref={ref} {...rest} /></label>;
}
```
Design system components (Button, Input) should forward refs so consumers can focus them, measure them, or use them with popover/tooltip libraries.

**5. useImperativeHandle: a limited imperative API:**
```tsx
type ChatHandle = { scrollToBottom: () => void; focusInput: () => void };

function ChatWindow({ ref, messages }: { ref?: React.Ref<ChatHandle>; messages: Message[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }),
    focusInput: () => inputRef.current?.focus(),
  }), []);
  return <>…</>;
}

// parent
const chatRef = useRef<ChatHandle>(null);
<button onClick={() => chatRef.current?.scrollToBottom()}>Jump to latest</button>
```
This exposes only the methods the parent needs, not the whole DOM, keeping the component's internals private and its API intentional.

**When imperative APIs are appropriate:** focus management, scrolling, text selection, media playback, triggering animations, measuring, and integrating non-React libraries. Not for data flow: if a parent calls `ref.current.setValue(x)`, it should probably pass `value` as a prop instead (declarative, predictable).

**Common mistakes:**
- Using a ref for values that should re-render the UI.
- Reading `ref.current` during render (stale or null on first render).
- Forgetting null checks (`ref.current?.focus()`).
- Expecting `useRef` to notify when the element changes (use a callback ref).
- Passing `ref` to a function component in React 18 without forwardRef (it's silently not forwarded; React warns).
- Overusing useImperativeHandle instead of props."

#### Another worked example: focus management after a dialog
"After closing a 'Rename file' dialog, focus jumped to the document body, losing keyboard users' place. We stored the trigger button in a ref when opening the dialog and called `triggerRef.current?.focus()` on close. Our design system Button forwards refs, which made this possible without hacks."

#### A third worked example: a value in a ref that should be state
"A form stored 'isDirty' in a ref so it 'wouldn't cause re-renders', but the 'Unsaved changes' banner never appeared because changing the ref didn't re-render. Moving it to state fixed the banner; the extra render was negligible. Refs are for values the UI doesn't show."

#### Variations you might be asked
- "How do you get the previous value of a prop?": store it in a ref updated in an effect after render (`usePrevious`), or compare during render with state for adjusted values.
- "Why does ref.current start as null for DOM refs?": the DOM node doesn't exist until commit; refs are attached during the commit phase.
- "Can you use useRef for lazy initialisation of expensive objects?": yes, with a check: `if (ref.current === null) ref.current = createExpensive();`.

#### Step-by-step framework
1. **Define refs** vs state.
2. **DOM refs** and common uses.
3. **Mutable instance values.**
4. **Callback refs.**
5. **Forwarding refs** (forwardRef, React 19 ref prop).
6. **useImperativeHandle**, appropriate imperative use, and mistakes.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Refs are for DOM only" | DOM and mutable instance values |
| Uses refs for displayed data | State for UI, refs for non-UI values |
| Reads refs in render | Effects and handlers only |
| Unaware of React 19 ref prop | Knows forwardRef and ref-as-prop |
| Exposes whole DOM to parents | useImperativeHandle with minimal API |

#### Useful phrases
- "Changing a ref doesn't re-render; changing state does."
- "If the UI needs to show it, it's state."
- "A callback ref tells me when the element actually attaches."
- "useImperativeHandle exposes only what the parent needs, like focus or scroll."

#### Common pitfalls
- **Refs instead of state for UI.**
- **Missing null checks.**
- **Not forwarding refs** in reusable components.
- **Imperative data flow** instead of props.

#### Follow-ups to expect (with sample answers)
- **"When is the ref set relative to effects?"**
  "During commit, before layout effects run, so useLayoutEffect and useEffect can read it."
- **"How do you combine a forwarded ref with an internal ref?"**
  "Use a merge-refs helper or useImperativeHandle to expose the internal node: `useImperativeHandle(ref, () => innerRef.current!)`."
- **"Why might React warn about refs on function components?"**
  "In React 18 and earlier, function components can't receive refs unless wrapped in forwardRef."

#### What senior interviewers look for
- **Clear mental model of refs.**
- **Appropriate imperative patterns.**
- **Modern React 19 knowledge.**

#### Practise it
1. Build a stopwatch using state for display and a ref for the interval.
2. Make a design-system Input forward its ref (both forwardRef and React 19 style).
3. Explain refs vs state, out loud, in 30 seconds.

## Context: performance pitfalls and patterns
- id: fe-react-04
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: context, performance, state management, re-renders

### Prompt
When should you use React Context, and what are its performance pitfalls? Explain why all consumers re-render when the value changes, and patterns to avoid unnecessary renders: memoizing values, splitting contexts, separating state and dispatch, composition, and selector-based stores.

### Answer
#### What the interviewer is really testing
- Understanding Context as **dependency injection**, not a full state management solution.
- Knowing **re-render behaviour**: every consumer re-renders when the provider value changes (by `Object.is`).
- **Mitigation patterns**: stable values, splitting contexts, state/dispatch separation, colocating providers, selector stores.
- Judgement on **when to reach for Zustand/Redux/Jotai** or server-state libraries instead.

#### Key points
- Context passes values deeply **without prop drilling**: theme, locale, auth user, feature flags, design system settings, dependency injection (API clients).
- When a provider's `value` changes (new reference), **every component calling `useContext` for it re-renders**, even if it uses only part of the value. `React.memo` doesn't stop context-triggered renders.
- A provider whose parent re-renders and passes `value={{ ... }}` inline creates a **new object every render** → all consumers re-render: memoize with `useMemo`.
- **Split contexts** by update frequency and concern (AuthContext vs ThemeContext vs CartContext).
- **Separate state and dispatch/actions** into two contexts so components that only trigger actions don't re-render on state changes.
- Keep providers **as low as possible** in the tree.
- **Composition / children** avoids drilling without context in many cases.
- For **frequently changing, widely read state** with fine-grained subscriptions, use a **selector-based store** (Zustand, Redux, Jotai, `useSyncExternalStore`).
- **Server data** belongs in TanStack Query/SWR or Server Components, not context.
- React 19: `<Context>` can be used directly as a provider; `use(Context)` can be called conditionally.

#### Model answer
"Context is great for passing values deep into the tree without prop drilling. Its performance characteristic is simple but important: when the provided value changes, every component that reads that context re-renders.

**Good uses:** theme, locale/i18n, the authenticated user and permissions, feature flags, design-system configuration, and injecting services (an API client, analytics). These change rarely and are read widely.

**Pitfall 1: unstable value objects**
```tsx
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const signOut = () => setUser(null);
  // ❌ new object every render of AuthProvider → every consumer re-renders
  return <AuthContext.Provider value={{ user, signOut }}>{children}</AuthContext.Provider>;
}
```
Fix: memoize the value and stabilise functions:
```tsx
const signOut = useCallback(() => setUser(null), []);
const value = useMemo(() => ({ user, signOut }), [user, signOut]);
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```
Now consumers only re-render when `user` actually changes.

**Pitfall 2: one big context for everything**
```tsx
// ❌ cursor position, cart, theme and user in one context: moving the mouse re-renders the whole app
<AppContext.Provider value={{ user, theme, cart, cursor }}>
```
Fix: **split by concern and update frequency**: AuthContext, ThemeContext, CartContext, with fast-changing state (cursor, form inputs) kept local or in a store. A component reading only the theme won't re-render when the cart changes.

**Pitfall 3: consumers that only need actions re-render on state changes**
```tsx
const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCart);
  const actions = useMemo(() => ({
    add: (item: Item) => dispatch({ type: 'add', item }),
    remove: (id: string) => dispatch({ type: 'remove', id }),
  }), []);                                         // dispatch is stable, so actions never change
  return (
    <CartActionsContext.Provider value={actions}>
      <CartStateContext.Provider value={state}>{children}</CartStateContext.Provider>
    </CartActionsContext.Provider>
  );
}
```
An 'Add to cart' button that only uses `CartActionsContext` never re-renders when items change; the cart badge uses `CartStateContext`.

**Pitfall 4: memo doesn't block context updates.** `React.memo` prevents re-renders from parent props, but a memoized component that calls `useContext` still re-renders when that context changes. A common workaround is to read context in a small wrapper and pass only the needed slice as props to a memoized child:
```tsx
function CartCount() {
  const { items } = useCartState();
  return <Badge count={items.length} />;          // Badge memoized; only re-renders if count changes
}
```

**Pattern: keep providers low.** If only the checkout area needs checkout form state, put the provider around checkout, not at the app root.

**Pattern: composition before context.** Often prop drilling can be avoided by passing components as children:
```tsx
// Instead of drilling `user` through Layout → Sidebar → UserMenu
<Layout sidebar={<Sidebar userMenu={<UserMenu user={user} />} />} />
```

**When context isn't the right tool:**
- **Frequently changing state read by many components** (e.g. a live editor, filters with many consumers, real-time data): use a store with **selectors** so components subscribe only to the slice they need:
```tsx
const useCartStore = create<CartStore>((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));
const count = useCartStore((s) => s.items.length);   // re-renders only when the count changes
```
Zustand, Redux (with `useSelector`), Jotai atoms or a custom store with `useSyncExternalStore` give fine-grained updates.
- **Server data** (users, products, orders): TanStack Query/SWR or Server Components handle caching and refetching; putting fetched data in context leads to stale data and over-rendering.

**React 19 notes:** you can render `<ThemeContext value={theme}>` directly (no `.Provider`), and `use(ThemeContext)` works conditionally.

**Diagnosing:** React DevTools Profiler with 'highlight updates' and 'why did this render' (it reports 'Context changed') shows when context is the cause."

#### Another worked example: a slow dashboard caused by context
"A dashboard kept filters, date range, selected rows and hover state in a single DashboardContext. Hovering over chart points updated context, re-rendering 400 components (~45 ms per mouse move). We moved hover state into the chart component, split filters into their own context with a memoized value, and moved selected rows to a Zustand store with selectors. Mouse interactions dropped to ~3 ms per update."

#### A third worked example: auth context done well
"Our AuthContext exposed `{ user, permissions }` (memoized) and a separate AuthActionsContext with `signIn`/`signOut`. Login buttons across the app used only actions and never re-rendered on user changes; the avatar and permission checks used the state context. Combined with a `useAuth()` hook that throws outside the provider, it was simple and fast."

#### Variations you might be asked
- "Is context a replacement for Redux?": for low-frequency global values, yes; for complex, frequently updated state with many consumers, devtools and middleware needs, a store is better.
- "What's the default value of createContext for?": used when there's no provider above; using null and throwing in a custom hook catches missing providers.
- "How does use-context-selector work?": a library that lets consumers subscribe to slices of context (React may add native support in the future).

#### Step-by-step framework
1. **Define good uses** of context.
2. **Explain consumer re-render behaviour.**
3. **Fix unstable values** with useMemo/useCallback.
4. **Split contexts** and separate state from actions.
5. **Composition and provider placement.**
6. **Selector stores and server-state libraries** when context doesn't fit.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Context replaces state management" | Context for low-frequency, widely read values |
| Inline value objects | Memoized values |
| One giant context | Split by concern and frequency |
| Thinks memo stops context renders | Knows it doesn't; passes slices to memo children |
| Server data in context | TanStack Query/RSC; stores with selectors for hot state |

#### Useful phrases
- "Every consumer re-renders when the context value changes."
- "I memoize the provider value so re-rendering the provider doesn't re-render consumers."
- "Splitting state and actions means action-only components never re-render."
- "For fast-changing shared state I use a store with selectors."

#### Common pitfalls
- **Inline provider values.**
- **Fast-changing values in app-wide context.**
- **Fetching data into context.**
- **Overusing context** where composition works.

#### Follow-ups to expect (with sample answers)
- **"Does a provider re-render its children when its value changes?"**
  "Only consumers re-render because of the context change; children passed as props don't re-render unless they consume the context or their parent re-renders them."
- **"How would you test context-dependent components?"**
  "Render them within the provider (or a test wrapper) with controlled values; custom render helpers in Testing Library."
- **"How do you prevent missing provider bugs?"**
  "Default to null and use a custom hook that throws a clear error if the provider is missing."

#### What senior interviewers look for
- **Accurate re-render model.**
- **Practical optimisation patterns.**
- **Good tool selection.**

#### Practise it
1. Profile an app with a single big context, then split it and compare.
2. Implement separate state and actions contexts for a cart.
3. Explain why memo doesn't stop context re-renders, out loud.

## Controlled vs uncontrolled components and form handling
- id: fe-react-05
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: forms, controlled components, uncontrolled, React Hook Form, validation

### Prompt
Explain controlled and uncontrolled components in React. What are the trade-offs for forms, how do libraries like React Hook Form work, how do React 19 form actions change things, and how would you build a large, performant, accessible form with validation?

### Answer
#### What the interviewer is really testing
- Understanding **who owns the value**: React state (controlled) or the DOM (uncontrolled).
- Trade-offs: **validation, formatting, conditional fields, performance** in large forms.
- Familiarity with **React Hook Form** (uncontrolled by default, refs, subscriptions) and **schema validation** (Zod).
- **React 19 actions** and progressive enhancement; **accessibility** of forms.

#### Key points
- **Controlled**: value lives in React state (`value` + `onChange`); React is the source of truth; easy to validate/format on the fly, sync, and conditionally render; each keystroke re-renders the owner.
- **Uncontrolled**: the DOM holds the value (`defaultValue`, read via `ref` or `FormData` on submit); fewer re-renders; simpler for basic forms; less control during typing.
- Don't switch an input from uncontrolled to controlled (`value` undefined → defined) (React warns).
- `<input type="file">` is always uncontrolled.
- **Large forms**: controlled state at the top re-renders everything per keystroke; solutions: field-level state, React Hook Form (uncontrolled + subscriptions), memoized fields.
- **React Hook Form**: registers inputs via refs, validates on configurable events, re-renders only what subscribes; integrates with **Zod** via resolvers; `Controller` for controlled third-party inputs.
- **React 19**: `<form action={fn}>` with `FormData`, `useActionState` for results/errors, `useFormStatus` for pending; works with Server Actions; progressive enhancement.
- **Validation**: client for UX, server always; show errors on blur/submit; accessible error messages.

#### Model answer
"The difference is who owns the input's current value.

**Controlled: React state is the source of truth:**
```tsx
function EmailField() {
  const [email, setEmail] = useState('');
  const invalid = email.length > 0 && !email.includes('@');
  return (
    <>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
             aria-invalid={invalid} aria-describedby={invalid ? 'email-error' : undefined} />
      {invalid && <p id="email-error">Enter a valid email address</p>}
    </>
  );
}
```
Pros: the value is always available in state, so instant validation, formatting (card numbers, masks), enabling/disabling other fields, and syncing with other UI are easy. Cons: every keystroke re-renders the component that owns the state, which can be costly when that's a large form.

**Uncontrolled: the DOM holds the value:**
```tsx
function NewsletterForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    subscribe(String(data.get('email')));
  }
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="nl-email">Email</label>
      <input id="nl-email" name="email" type="email" defaultValue="" required />
      <button>Subscribe</button>
    </form>
  );
}
```
Pros: no re-render per keystroke, simple, works with native validation. Cons: harder to react to values while typing (you need refs or events).

**Trade-offs:**
| | Controlled | Uncontrolled |
|---|---|---|
| Source of truth | React state | DOM |
| Re-renders per keystroke | Yes (owner) | No |
| Live validation/formatting | Easy | Harder |
| Conditional fields based on values | Easy | Needs watching |
| Simple forms | More code | Less code |
| File inputs | Not possible | Always |

**Large forms: performance and structure.** A 40-field form with all values in one `useState` at the top re-renders all 40 fields on every keystroke. Options:
1. **React Hook Form**: inputs are uncontrolled and registered via refs; the library reads values from the DOM, validates on chosen events and re-renders only components subscribed to specific fields or errors:
```tsx
const schema = z.object({
  name: z.string().min(1, 'Enter your name'),
  email: z.string().email('Enter a valid email address'),
  plan: z.enum(['free', 'pro']),
  company: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function SignupForm() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',                                   // validate when leaving a field
    defaultValues: { plan: 'free' },
  });
  const plan = watch('plan');                         // subscribe to just this field
  const onSubmit = handleSubmit(async (values) => { await createAccount(values); });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field label="Name" error={errors.name?.message}><input {...register('name')} autoComplete="name" /></Field>
      <Field label="Email" error={errors.email?.message}><input {...register('email')} type="email" autoComplete="email" /></Field>
      <fieldset>
        <legend>Plan</legend>
        <label><input type="radio" value="free" {...register('plan')} /> Free</label>
        <label><input type="radio" value="pro" {...register('plan')} /> Pro</label>
      </fieldset>
      {plan === 'pro' && <Field label="Company" error={errors.company?.message}><input {...register('company')} /></Field>}
      <button disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create account'}</button>
    </form>
  );
}
```
`Field` is a shared component that wires the label, hint, error message, `aria-invalid` and `aria-describedby`. Third-party controlled widgets (date pickers, rich selects) integrate via RHF's `Controller`.
2. **Field-level state**: each field component owns its value and reports up on blur/submit.
3. **Split the form into steps or sections** that mount independently.

**React 19 form actions:**
```tsx
'use client';
import { useActionState } from 'react';
import { updateProfile } from './actions';         // Server Action returning { errors?, message? }

function ProfileForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateProfile, { errors: {} });
  return (
    <form action={formAction}>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" defaultValue={user.name} aria-describedby="name-error" />
      {state.errors?.name && <p id="name-error">{state.errors.name}</p>}
      <SubmitButton />
      {state.message && <p role="status">{state.message}</p>}
    </form>
  );
}
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}
```
This is uncontrolled by nature (values come from `FormData`), works with progressive enhancement (the form submits even before JS loads when using Server Actions), and moves validation to the server action (still add client hints for UX). React resets uncontrolled form fields after a successful action unless you handle it.

**Validation strategy:**
- Shared **Zod schema** for client and server (same rules, typed values).
- Validate on **blur or submit**, then re-validate on change once a field has an error.
- Always validate on the **server**.
- Show **accessible errors** (text, linked with `aria-describedby`, error summary on submit).

**Gotchas:**
- Don't switch between `value` and `defaultValue` on the same input (controlled ↔ uncontrolled warning); initialise state with `''`, not `undefined`.
- Number inputs give strings; parse explicitly (`valueAsNumber` or schema coercion).
- Resetting forms when the record changes: use a `key`.
- Controlled inputs inside transitions: keep input state urgent."

#### Another worked example: a slow insurance quote form
"A 60-field quote form stored everything in one Redux slice updated on every keystroke; typing lagged noticeably on mid-range laptops. Moving to React Hook Form with Zod validation, sections rendered as separate components and `watch` used only for the few fields that drove conditional logic, cut per-keystroke render time from ~35 ms to ~2 ms. Validation messages became consistent because the same schema ran on the server."

#### A third worked example: progressive enhancement with actions
"A newsletter and contact form built with Server Actions and `useActionState` worked even when JavaScript failed to load on slow connections: the browser submitted the form natively, and the server action returned the result page. With JS, users got inline pending states and errors without a full reload."

#### Variations you might be asked
- "How do you format input as the user types (e.g. card numbers)?": controlled input with careful cursor handling, or a masking library; consider formatting on blur to avoid cursor jumps.
- "How do you warn about unsaved changes?": track dirty state (RHF's `isDirty`), use `beforeunload` and router navigation blocking.
- "Formik vs React Hook Form?": Formik is controlled (re-renders more); RHF is uncontrolled and generally faster for large forms.

#### Step-by-step framework
1. **Define controlled and uncontrolled** with examples.
2. **Trade-offs table.**
3. **Large-form performance** strategies (RHF, field state, sections).
4. **React 19 form actions** and progressive enhancement.
5. **Validation strategy** with shared schemas.
6. **Gotchas** and accessibility.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Always use controlled" | Chooses by need; knows trade-offs |
| One giant state object | RHF/field-level state for big forms |
| Client validation only | Shared schema, server validation |
| Ignores React 19 | Actions, useActionState, useFormStatus |
| No accessibility | Labels, aria-describedby, error summary |

#### Useful phrases
- "The question is who owns the value: React or the DOM."
- "For big forms I use React Hook Form so typing doesn't re-render every field."
- "One Zod schema validates on the client and the server."
- "Form actions with Server Actions work even before JavaScript loads."

#### Common pitfalls
- **Switching controlled/uncontrolled.**
- **Re-rendering huge forms per keystroke.**
- **Validating on every keystroke.**
- **Missing server validation.**

#### Follow-ups to expect (with sample answers)
- **"How do you integrate a controlled date picker with RHF?"**
  "Wrap it in `Controller`, passing `value` and `onChange` from the field render prop."
- **"How do you handle server validation errors in RHF?"**
  "Call `setError(field, { message })` for each server error after submission."
- **"Why does React warn 'A component is changing an uncontrolled input to be controlled'?"**
  "The value started as undefined (uncontrolled) and later became defined; initialise with an empty string."

#### What senior interviewers look for
- **Clear ownership model.**
- **Scalable form architecture.**
- **Validation and accessibility completeness.**

#### Practise it
1. Build the same form controlled, uncontrolled and with React Hook Form + Zod.
2. Convert a form to React 19 actions with useActionState.
3. Explain controlled vs uncontrolled, out loud, in 30 seconds.

## Error boundaries and error handling in React
- id: fe-react-06
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: error boundaries, error handling, resilience, monitoring

### Prompt
What are error boundaries in React? What errors do they catch and not catch, how do you design boundary placement, recovery (retry/reset), and reporting, and how does error handling work with async code, data libraries, Suspense and Next.js `error.tsx`?

### Answer
#### What the interviewer is really testing
- Knowing error boundaries catch **errors during rendering, lifecycle methods and constructors** of their subtree.
- Knowing what they **don't catch**: event handlers, async code, SSR errors (in some setups), errors in the boundary itself.
- **Granular placement** so one widget failing doesn't blank the app.
- **Recovery** (reset keys, retry with query reset) and **reporting** (Sentry with component stack).
- Integration with **Suspense, TanStack Query, Next.js error.tsx/global-error**.

#### Key points
- An **error boundary** is a component that catches JavaScript errors thrown while rendering its children, logs them, and shows a **fallback UI**.
- Implemented as a **class component** (`static getDerivedStateFromError`, `componentDidCatch`) or with **react-error-boundary**.
- Without boundaries, a render error **unmounts the whole app** (blank page) in React 16+.
- **Not caught**: errors in **event handlers** (use try/catch), **async code** (promises, timeouts), errors thrown **in the boundary itself**, and some SSR cases.
- To route async errors into a boundary: set state that throws during render, `useErrorBoundary().showBoundary(err)`, or data libraries' `throwOnError`/Suspense mode.
- **Placement**: app-level (last resort), route-level, and **widget-level** for independent sections.
- **Recovery**: `resetKeys` (reset when inputs change), a "Try again" button, resetting query cache (`QueryErrorResetBoundary`).
- **Reporting**: `componentDidCatch`/`onError` → Sentry with component stack; React 19 adds `onUncaughtError`/`onCaughtError` root options.
- **Next.js**: `error.tsx` per route segment (client component with `reset`), `global-error.tsx`, `not-found.tsx`.

#### Model answer
"Error boundaries are React's way of containing crashes. If a component throws while rendering, the nearest error boundary above it catches the error and renders a fallback instead of letting the whole app unmount.

**Basic implementation (class component):**
```tsx
type Props = { fallback: (error: Error, reset: () => void) => React.ReactNode; children: React.ReactNode; onError?: (e: Error, info: React.ErrorInfo) => void };
type State = { error: Error | null };

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }   // render fallback next
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);                                         // report (info.componentStack)
  }
  reset = () => this.setState({ error: null });
  render() {
    return this.state.error ? this.props.fallback(this.state.error, this.reset) : this.props.children;
  }
}
```
In practice I use `react-error-boundary`, which provides `ErrorBoundary`, `resetKeys`, `onReset` and a `useErrorBoundary` hook.

**What boundaries catch:** errors thrown during rendering, in lifecycle methods, and in constructors of components below them, including errors from `use()`/Suspense data that rejects.

**What they don't catch:**
- **Event handlers**: an error thrown in `onClick` doesn't happen during rendering. Handle with try/catch and show an error state.
- **Async code**: rejected promises in effects or `setTimeout` callbacks.
- **Errors in the boundary itself** (they propagate to the next boundary up).
- **Server-side rendering errors** in some setups (frameworks handle these separately).

To send async errors to a boundary deliberately:
```tsx
const { showBoundary } = useErrorBoundary();
useEffect(() => {
  loadReport().catch(showBoundary);           // render the nearest boundary's fallback
}, [showBoundary]);
```
Or use a data library's option: TanStack Query's `throwOnError: true` (or `useSuspenseQuery`) rethrows query errors during render so boundaries catch them.

**Placement strategy: granular boundaries:**
```tsx
<ErrorBoundary fallback={AppCrashScreen} onError={report}>          {/* last resort */}
  <Layout>
    <ErrorBoundary fallback={RouteError} resetKeys={[pathname]}>    {/* per route; resets on navigation */}
      <DashboardPage>
        <WidgetBoundary title="Revenue"><RevenueChart /></WidgetBoundary>
        <WidgetBoundary title="Orders"><RecentOrders /></WidgetBoundary>
        <WidgetBoundary title="Activity"><ActivityFeed /></WidgetBoundary>
      </DashboardPage>
    </ErrorBoundary>
  </Layout>
</ErrorBoundary>
```
- **App level**: a friendly crash screen with reload, so users never see a blank page.
- **Route level**: one broken page doesn't break navigation; `resetKeys={[pathname]}` clears the error when the user navigates away.
- **Widget level**: independent sections (charts, recommendations, third-party embeds) fail in isolation, showing 'This section couldn't load. Try again.'
Don't wrap every tiny component; group by what can fail independently and still leave the page useful.

**Recovery with data libraries:**
```tsx
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary onReset={reset} fallbackRender={({ resetErrorBoundary }) => (
      <div role="alert">
        <p>Couldn't load orders.</p>
        <button onClick={resetErrorBoundary}>Try again</button>
      </div>
    )}>
      <Suspense fallback={<OrdersSkeleton />}>
        <Orders />                              {/* useSuspenseQuery inside */}
      </Suspense>
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```
'Try again' resets both the boundary and the failed query, triggering a refetch. Pair Suspense (loading) with error boundaries (failure) at the same granularity.

**Reporting:**
```tsx
<ErrorBoundary FallbackComponent={Fallback} onError={(error, info) => {
  Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
}}>
```
React 19 adds root-level hooks: `createRoot(el, { onCaughtError, onUncaughtError, onRecoverableError })` for centralised reporting (including recoverable hydration errors). Include release version, route, and user context (no PII) with source maps uploaded.

**Next.js App Router:**
```tsx
// app/dashboard/error.tsx (must be a client component)
'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error); }, [error]);
  return (
    <div role="alert">
      <h2>Something went wrong loading the dashboard.</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```
- `error.tsx` wraps a route segment (and its children) in a boundary; layouts above stay interactive.
- `global-error.tsx` handles errors in the root layout.
- `not-found.tsx` with `notFound()` for 404s (not an error).
- Server errors are sanitised in production (only a `digest` is sent to the client), so log details on the server.

**Fallback UX and accessibility:** clear message, a recovery action (retry, go back, contact support), `role="alert"` or focus moved to the error heading, and no technical stack traces for users."

#### Another worked example: a third-party widget crash
"A reviews widget from a third-party SDK occasionally threw during render when its API returned malformed data, blanking our entire product page. Wrapping it in a widget-level error boundary with a compact fallback ('Reviews are unavailable right now') kept the page usable and buy buttons working. Sentry reports with component stacks helped the vendor fix the bug."

#### A third worked example: errors not caught by boundaries
"A team assumed their app-level boundary handled all errors, but failed 'Save' clicks silently did nothing: the error happened in an async event handler, which boundaries don't catch. We added try/catch with user-facing error states in handlers, global `unhandledrejection` reporting, and used `showBoundary` only for errors that should replace the UI."

#### Variations you might be asked
- "Why must error boundaries be class components?": the error-catching lifecycle methods only exist on classes; libraries wrap them for function component ergonomics.
- "What happens to the component state when the boundary resets?": the subtree remounts, so its state is fresh.
- "How do error boundaries work with Suspense?": a rejected promise or thrown error in a suspended component is caught by the nearest error boundary; Suspense only handles pending states.

#### Step-by-step framework
1. **Define error boundaries** and implementation.
2. **What they catch and don't catch.**
3. **Routing async errors** into boundaries.
4. **Placement strategy** (app, route, widget).
5. **Recovery and reporting.**
6. **Next.js and Suspense integration**, fallback UX.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Wrap the app in a boundary" | Granular app/route/widget boundaries |
| Thinks boundaries catch everything | Knows handler/async limits |
| No recovery | resetKeys, retry with query reset |
| No reporting | Sentry with component stacks, React 19 root hooks |
| Unaware of Next.js files | error.tsx, global-error, not-found |

#### Useful phrases
- "Boundaries catch errors during rendering, not in event handlers or async code."
- "I place boundaries so one failing widget doesn't take down the page."
- "Suspense handles loading; error boundaries handle failure."
- "Try again resets the boundary and the failed query together."

#### Common pitfalls
- **Single top-level boundary only.**
- **Silent async failures.**
- **Fallbacks without recovery.**
- **Leaking technical details to users.**

#### Follow-ups to expect (with sample answers)
- **"How do you test error boundaries?"**
  "Render a child that throws (suppress console.error in the test), assert the fallback, click retry and assert recovery."
- **"Should every component have a boundary?"**
  "No; place them around independently failing areas where a partial UI is still useful."
- **"What's the digest in Next.js errors?"**
  "A hash identifying a server error, sent to the client instead of the message, so you can find details in server logs."

#### What senior interviewers look for
- **Resilience architecture.**
- **Correct scope of boundaries.**
- **Observability and UX.**

#### Practise it
1. Add app, route and widget boundaries to a dashboard with retry.
2. Route a fetch error into a boundary with useErrorBoundary.
3. Explain what boundaries don't catch, out loud.

## React.memo, re-renders and how to find unnecessary renders
- id: fe-react-07
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React.memo, re-renders, profiling, performance

### Prompt
Why do React components re-render, and when is that a problem? Explain `React.memo`, shallow comparison, custom comparators, how to find unnecessary renders with the React DevTools Profiler, and structural fixes that work better than memoization.

### Answer
#### What the interviewer is really testing
- Understanding that **re-renders are normal** and often cheap; only some are problems.
- Knowing **why** components render (state, parent, context, hooks).
- Correct use of **React.memo** with **stable props**, and its limits.
- Using the **Profiler** effectively and applying **structural fixes** (state colocation, children composition, splitting components).
- Awareness of the **React Compiler**.

#### Key points
- A component re-renders when its **state changes**, its **parent re-renders**, a **context** it uses changes, or an **external store hook** updates.
- Re-rendering ≠ DOM updates; React only commits differences. Problems arise when renders are **expensive** or **very frequent** (typing, scrolling, animations).
- **`React.memo(Component)`** skips re-rendering if props are **shallowly equal** (`Object.is` per prop).
- Memo fails if props include **new objects, arrays, functions or JSX elements** each render → stabilise with `useMemo`/`useCallback` or pass primitives.
- **Custom comparator** (`React.memo(C, areEqual)`) for special cases; risky if it ignores props that matter.
- **Profiler**: record interactions, look at flame/ranked charts, enable "Record why each component rendered", "Highlight updates when components render".
- **Structural fixes**: move state down, lift content up (children), split large components, avoid passing fast-changing values through many layers, virtualise lists.
- **React Compiler** auto-memoizes, reducing manual memo.

#### Model answer
"Re-renders are how React works, and most are cheap. I only worry about them when profiling shows a slow or janky interaction, and then I fix the cause, usually structurally, sometimes with memoization.

**Why components re-render:**
1. Their own **state** changes.
2. Their **parent re-renders** (children re-render by default, regardless of props).
3. A **context** they read changes.
4. A **store** they subscribe to changes (Redux `useSelector`, Zustand).
Props changing isn't a separate trigger: props only change because the parent re-rendered.

**React.memo:**
```tsx
const ProductCard = React.memo(function ProductCard({ product, onAdd }: { product: Product; onAdd: (id: string) => void }) {
  return <article>{product.name}<button onClick={() => onAdd(product.id)}>Add</button></article>;
});
```
When the parent re-renders, React compares each prop with `Object.is`; if all are equal, it reuses the previous output and skips rendering this component and its subtree.

**Why memo often doesn't work:**
```tsx
function ProductGrid({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  return products.map((p) => (
    <ProductCard
      key={p.id}
      product={p}
      onAdd={(id) => addToCart(id)}          // ❌ new function every render → memo useless
      style={{ marginBottom: 8 }}            // ❌ new object every render
    />
  ));
}
```
Fixes: `const onAdd = useCallback((id: string) => addToCart(id), [])`, move static objects outside the component (or to CSS), pass primitives instead of derived objects. JSX passed as props (`icon={<Icon />}`) is also a new element each render.

**Custom comparators:**
```tsx
const Chart = React.memo(ChartImpl, (prev, next) => prev.data.version === next.data.version && prev.width === next.width);
```
Useful when a cheap version field tells you whether expensive data changed. Dangerous if you forget a prop that affects rendering (stale UI bugs).

**Finding unnecessary renders:**
1. **React DevTools Profiler**: record the slow interaction (typing, opening a panel).
   - **Flamegraph**: which components rendered in each commit and how long they took.
   - **Ranked chart**: slowest components.
   - Enable **'Record why each component rendered'** to see 'Props changed (onAdd)', 'Hook 2 changed', 'Parent component rendered', 'Context changed'.
2. **'Highlight updates when components render'**: flashes components as they render; great for spotting a whole page lighting up on every keystroke.
3. Chrome **Performance panel** to confirm how much of the frame time is React scripting vs layout/paint.
4. Measure on a throttled CPU; production builds are much faster than development, so profile with a production profiling build when precise.

**Structural fixes (usually better than memo):**

*Move state down:*
```tsx
// ❌ query state at page level: typing re-renders the whole page, including an expensive chart
function Page() {
  const [query, setQuery] = useState('');
  return <><SearchInput value={query} onChange={setQuery} /><ExpensiveChart /></>;
}
// ✓ search state lives in its own component
function Page() { return <><SearchBox /><ExpensiveChart /></>; }
```

*Lift content up (children don't re-render with the wrapper's state):*
```tsx
function HoverCard({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={hovered ? 'raised' : ''}>{children}</div>;
}
<HoverCard><ExpensiveContent /></HoverCard>   // ExpensiveContent was created by the parent; hover doesn't re-render it
```

*Split big components* so frequently changing parts are isolated.

*Context hygiene*: memoized values, split contexts, selector stores.

*Virtualise* long lists, and *defer* expensive updates with `useDeferredValue`/`useTransition`.

**When memo is the right tool:** list items in large lists, expensive leaf components (charts, maps, rich text), and components receiving stable props from a frequently re-rendering parent.

**React Compiler:** it analyses components and automatically memoizes components, values and callbacks, effectively applying memo/useMemo/useCallback where safe. With the compiler, I'd focus on structure and the Rules of React rather than manual memoization."

#### Another worked example: a settings page lagging on input
"A settings page re-rendered 1,200 components per keystroke in a name field: the form state lived at the page root, and every section re-rendered. Profiling with 'why did this render' showed 'parent component rendered' everywhere. Moving each section's state into the section and using React Hook Form reduced renders per keystroke to 3 components; typing latency dropped from ~60 ms to under 5 ms. No React.memo needed."

#### A third worked example: memo fixed with stable props
"A kanban board's cards were wrapped in React.memo, but profiling showed every card re-rendering on drag. Each card received `onMove={(to) => move(card.id, to)}`, a new function per render. Passing `cardId` and a stable `onMove` (useCallback) made memo effective: only the dragged card and the two affected columns re-rendered."

#### Variations you might be asked
- "Does React.memo compare children?": children is a prop; JSX children are new objects each render, so memo usually fails for components receiving children (unless children are memoized or static).
- "Is it bad to memo everything?": it adds comparison cost and complexity, and fails silently with unstable props; use it deliberately, or rely on the Compiler.
- "Why can development mode mislead profiling?": development React is slower and StrictMode double-renders; profile production builds for accurate numbers.

#### Step-by-step framework
1. **Explain render triggers.**
2. **Re-render vs DOM update**, when it's a problem.
3. **React.memo and stable props.**
4. **Profiling workflow.**
5. **Structural fixes.**
6. **When memo fits** and the Compiler.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Re-renders are bad" | Cheap usually; fix measured problems |
| memo with inline callbacks | Stabilises props or restructures |
| Guesses causes | Profiler with 'why did this render' |
| Memo everywhere | State colocation, children composition first |
| Unaware of Compiler | Explains its impact |

#### Useful phrases
- "A re-render that produces the same output doesn't touch the DOM."
- "React.memo only helps if every prop is stable."
- "The Profiler tells me why each component rendered."
- "Moving state down usually beats adding memo."

#### Common pitfalls
- **Inline objects/functions to memoized children.**
- **Custom comparators ignoring props.**
- **Profiling in development only.**
- **Premature memoization.**

#### Follow-ups to expect (with sample answers)
- **"What's the cost of React.memo?"**
  "A shallow comparison of props on each parent render plus memory for the previous props; cheap, but wasted when props always change."
- **"How do you stop a child re-rendering when the parent's unrelated state changes?"**
  "Move that state into a sibling or child component, pass the child as children from above, or memoize the child with stable props."
- **"What's 'highlight updates'?"**
  "A React DevTools setting that flashes components when they render, revealing render cascades."

#### What senior interviewers look for
- **Measurement-driven optimisation.**
- **Structural thinking.**
- **Correct memo mechanics.**

#### Practise it
1. Profile a page with 'why did this render' and fix the top cause structurally.
2. Make a memoized list item effective by stabilising its props.
3. Explain why children props often defeat React.memo, out loud.

## Designing reusable custom hooks
- id: fe-react-08
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: custom hooks, API design, reuse, testing

### Prompt
How do you design good custom hooks? Discuss when to extract a hook, naming and return shapes (objects vs tuples), accepting options and callbacks, stable references, handling cleanup and SSR, composition, testing, and anti-patterns such as hooks that do too much.

### Answer
#### What the interviewer is really testing
- Understanding hooks as a way to **reuse stateful logic**, not UI.
- **API design**: clear names, minimal inputs, predictable outputs, stable identities.
- Correct **effects, cleanup, SSR safety** and avoiding **stale closures**.
- **Composition** and **testing** with `renderHook`.
- Knowing **anti-patterns**: hooks that hide data fetching chaos, god hooks, unnecessary hooks.

#### Key points
- Extract a hook when **stateful logic** (state, effects, subscriptions) is **repeated** or when it **clarifies** a component by naming a concept (`useOnlineStatus`, `useCart`).
- Names start with **`use`** and describe the **purpose**, not the implementation (`useOnlineStatus` not `useEventListenerForOnline`).
- Each component calling a hook gets **its own state**; hooks share logic, not state (use context/stores to share state).
- **Return objects** for many values (named, extensible); **tuples** (`as const`) for two values like `useState` (easy renaming).
- Accept an **options object** for configurability; keep required params minimal.
- Return **stable functions** (useCallback) and **memoized objects** when consumers may use them in deps or memo children.
- Store the **latest callback in a ref** for subscriptions to avoid re-subscribing and stale closures.
- **Cleanup** every subscription; guard **browser APIs** for SSR (`useSyncExternalStore` with `getServerSnapshot`).
- Compose small hooks into bigger ones.
- Test with **`renderHook`**, fake timers, and mocked APIs (MSW).
- Anti-patterns: hooks for non-stateful helpers, "god hooks", hiding effects that surprise callers, ignoring rules of hooks.

#### Model answer
"A custom hook is a function that uses other hooks to package up stateful behaviour behind a meaningful name. Good hooks make components read like a description of what they do: `const isOnline = useOnlineStatus()`.

**When to extract:**
- The same state + effect logic appears in several components (subscriptions, timers, media queries, local storage sync).
- A component's logic is long and a name would clarify intent, even if used once.
- Not for plain functions without hooks: `formatPrice()` should be a regular function.

**Example 1: subscribing to a browser API, SSR-safe:**
```ts
function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,     // client snapshot
    () => true,                 // server snapshot: assume online during SSR
  );
}
```
`useSyncExternalStore` handles subscription, tearing and SSR correctly, better than `useState` + `useEffect` for external sources.

**Example 2: a hook with options, stable returns and cleanup:**
```ts
type Options = { interval?: number; enabled?: boolean; onError?: (e: unknown) => void };

export function usePolling<T>(fetcher: (signal: AbortSignal) => Promise<T>, { interval = 5000, enabled = true, onError }: Options = {}) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<unknown>();
  const fetcherRef = useRef(fetcher);
  const onErrorRef = useRef(onError);
  useEffect(() => { fetcherRef.current = fetcher; onErrorRef.current = onError; });   // latest callbacks, no re-subscribe

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await fetcherRef.current(signal ?? new AbortController().signal);
      setData(result);
      setError(undefined);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e);
      onErrorRef.current?.(e);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    refresh(controller.signal);
    const id = setInterval(() => refresh(controller.signal), interval);
    return () => { clearInterval(id); controller.abort(); };
  }, [enabled, interval, refresh]);

  return { data, error, refresh };            // object: named, easy to extend later
}
```
Design decisions:
- **Options object** for optional configuration: readable call sites, easy to add options without breaking callers.
- **Callbacks in refs**: callers usually pass inline functions; storing them in refs means changing them doesn't restart polling, yet the latest version is always called (no stale closures).
- **Stable `refresh`** via useCallback so consumers can put it in dependency arrays.
- **Cleanup** clears the interval and aborts in-flight requests.
- In production I'd use TanStack Query's `refetchInterval` rather than this hook, but it shows the design principles.

**Return shape:**
- **Tuple** (`[value, setValue] as const`) when there are two closely related values and callers will rename them (`useToggle`, `useLocalStorage`).
- **Object** when there are several values or the API may grow (`{ data, error, isLoading, refresh }`).

**Example 3: localStorage-synced state (tuple):**
```ts
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota/blocked */ }
  }, [key, value]);
  return [value, setValue] as const;
}
```
(For SSR apps, reading localStorage in the initialiser can cause hydration mismatches; a `useSyncExternalStore`-based version or reading after mount avoids that.)

**Composition:**
```ts
function useCheckout() {
  const cart = useCart();
  const user = useCurrentUser();
  const shipping = useShippingOptions(user?.address);
  const total = useMemo(() => calculateTotal(cart.items, shipping.selected), [cart.items, shipping.selected]);
  return { cart, user, shipping, total };
}
```
Small focused hooks compose into feature hooks. But avoid 'god hooks' that do everything for a page: they become hard to test and reuse, and they hide which state causes re-renders.

**Hooks share logic, not state:** two components calling `useCart()` each get separate state unless the hook reads from context or a store. If shared state is intended, the hook should wrap `useContext` or a store selector.

**Testing:**
```ts
import { renderHook, act, waitFor } from '@testing-library/react';

test('useToggle toggles', () => {
  const { result } = renderHook(() => useToggle(false));
  act(() => result.current[1]());
  expect(result.current[0]).toBe(true);
});

test('usePolling refreshes on interval', async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn().mockResolvedValue(1);
  renderHook(() => usePolling(fetcher, { interval: 1000 }));
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
  expect(fetcher).toHaveBeenCalledTimes(4);   // initial + 3 intervals
});
```
Use wrappers for providers, MSW for network, and fake timers for time-based hooks.

**Anti-patterns:**
- Hooks that don't use any hooks (just make them functions).
- Hooks with surprising side effects (a `useUser` that also tracks analytics and redirects).
- Returning new objects/functions each render that consumers put in deps, causing effect loops.
- Hiding data fetching without caching/races handled (use a data library underneath).
- Breaking rules of hooks inside (conditional calls based on options; use `enabled` flags instead)."

#### Another worked example: consolidating duplicated logic
"Five components implemented 'is this media query matching' with their own effects, some without cleanup and some causing hydration mismatches. We created `useMediaQuery(query)` with `useSyncExternalStore` and a server snapshot, tests for change events, and replaced all five. Bugs from missing cleanup disappeared, and new components used the hook consistently. (For layout changes, CSS media queries are still preferable; the hook was for behaviour like loading a different component.)"

#### A third worked example: a god hook broken apart
"A `useDashboard` hook (600 lines) fetched data, managed filters, handled URL syncing, tracked analytics and controlled modals. Every change risked breaking something, and any state change re-rendered the whole dashboard. We split it into `useDashboardFilters` (URL-synced), TanStack Query hooks for data, `useDashboardAnalytics`, and local modal state in the components that owned them. Each piece became testable, and re-renders became localised."

#### Variations you might be asked
- "How do you share state between components using the same hook?": back the hook with context or an external store (Zustand, useSyncExternalStore).
- "Should hooks return JSX?": usually no; hooks return data and functions; components render. (Render-prop components or headless components may return JSX.)
- "How do you document hooks?": TypeScript types, JSDoc with examples, and stories demonstrating usage in Storybook.

#### Step-by-step framework
1. **Decide when to extract.**
2. **Name by purpose**, choose return shape.
3. **Options object and stable outputs.**
4. **Latest callbacks via refs, cleanup, SSR safety.**
5. **Compose small hooks**, avoid god hooks.
6. **Test with renderHook**, avoid anti-patterns.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Extracts every function into a hook | Extracts stateful, reusable logic |
| Implementation-based names | Purpose-based names |
| Unstable returned functions | useCallback/useMemo for stable outputs |
| Ignores SSR and cleanup | useSyncExternalStore, server snapshots, cleanup |
| No tests | renderHook with timers and MSW |

#### Useful phrases
- "Hooks share logic, not state."
- "I return objects when the API might grow and tuples for value/setter pairs."
- "Callbacks go in refs so changing them doesn't restart subscriptions."
- "Small hooks compose; god hooks become untestable."

#### Common pitfalls
- **Unstable return values** used as dependencies.
- **Missing cleanup.**
- **Hydration mismatches** from browser reads.
- **Hooks that do too much.**

#### Follow-ups to expect (with sample answers)
- **"Why useSyncExternalStore over useEffect + useState?"**
  "It subscribes correctly under concurrent rendering, avoids tearing, and supports a server snapshot for SSR."
- **"How do you make a hook's options not cause re-subscriptions?"**
  "Depend only on primitive options in effects, and keep callback options in refs."
- **"When should logic be a component instead of a hook?"**
  "When it renders UI or needs to own a DOM subtree (e.g. headless components that provide render props or compound components)."

#### What senior interviewers look for
- **Thoughtful API design.**
- **Correct lifecycle handling.**
- **Testable, composable code.**

#### Practise it
1. Write `useOnlineStatus`, `useLocalStorage` and `useMediaQuery` with tests.
2. Refactor a large component's logic into two or three focused hooks.
3. Explain object vs tuple return shapes, out loud.

## Concurrent rendering and automatic batching
- id: fe-react-09
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: hard
- levels: senior, staff
- tags: concurrent rendering, batching, scheduling, React 18

### Prompt
Explain concurrent rendering in React 18+. What does "interruptible rendering" mean, how do priorities (lanes) work at a high level, what is automatic batching and `flushSync`, what is tearing and how does `useSyncExternalStore` prevent it, and what are the practical implications for application code?

### Answer
#### What the interviewer is really testing
- A clear model of **concurrent rendering**: rendering can be paused, resumed, abandoned; commits are atomic.
- **Priorities**: urgent vs transition updates; how React schedules work and yields to the browser.
- **Automatic batching** and when `flushSync` is needed.
- **Tearing** with external stores and the `useSyncExternalStore` fix.
- **Implications**: purity, effects, StrictMode, libraries, performance patterns.

#### Key points
- **Before React 18**: rendering was synchronous; once started, a render ran to completion, blocking input.
- **Concurrent rendering**: React can **prepare multiple versions of the UI**, **pause** rendering to handle urgent input, **resume** or **discard** work, then **commit** atomically (the user never sees partial trees).
- Opt-in via **concurrent features**: `startTransition`/`useTransition`, `useDeferredValue`, Suspense (with transitions), streaming SSR, selective hydration. Requires `createRoot`.
- **Lanes** (priority levels): sync/discrete input (clicks, keypresses) > continuous (mousemove) > default > transitions > idle. Higher-priority updates can interrupt lower ones.
- React **yields** to the browser periodically (time slicing ~5 ms chunks) during concurrent rendering.
- **Automatic batching**: multiple state updates in the same event loop tick (including promises, timeouts, native events) are batched into one render. `flushSync` forces a synchronous render.
- **Tearing**: during a concurrent render, an external mutable store changes, so components rendered earlier and later see different values. `useSyncExternalStore` forces consistent snapshots (de-opting to sync rendering when needed).
- Implications: **render must be pure** (it may run multiple times or be thrown away), side effects only in effects/handlers, StrictMode double-invocation in development, libraries must use `useSyncExternalStore`.

#### Model answer
"Concurrent rendering means React can work on rendering an update without blocking the main thread, and can pause, resume or throw away that work depending on what the user is doing. Before React 18, once React started rendering, it ran to completion, so a 300 ms render meant 300 ms of unresponsive input.

**Interruptible rendering:**
- React splits rendering into units of work (fibers) and, for concurrent updates, **yields to the browser** every few milliseconds to let it handle input and paint.
- If a **higher-priority update** arrives (the user types), React can **pause** the current render, handle the urgent update, and then **restart or resume** the lower-priority work.
- React builds the new tree in memory (work-in-progress); only when it's complete does it **commit** to the DOM in one go. Users never see a half-rendered tree.

**Priorities (lanes), simplified:**
| Priority | Examples |
|---|---|
| Sync / discrete | Clicks, key presses, focus: must feel instant |
| Continuous | mousemove, scroll-driven updates |
| Default | Updates from network responses, timers |
| Transition | `startTransition`, `useDeferredValue`: can be interrupted |
| Idle | Offscreen/prerendering work |

Urgent updates are rendered synchronously (not interruptible) because users expect immediate feedback; transitions are rendered concurrently.

**What's opt-in:** using `createRoot` enables the concurrent renderer, but most updates still behave synchronously. Concurrency kicks in when you use concurrent features: `startTransition`, `useDeferredValue`, Suspense-driven transitions, streaming SSR and selective hydration.

**Automatic batching:**
```tsx
// React 17: batched only inside React event handlers
setTimeout(() => {
  setCount((c) => c + 1);   // render
  setFlag((f) => !f);       // render
}, 0);

// React 18 with createRoot: batched everywhere (timeouts, promises, native events)
fetchData().then(() => {
  setData(d);
  setLoading(false);        // one render with both updates
});
```
Benefits: fewer renders and no inconsistent intermediate states. When you genuinely need the DOM updated immediately (e.g. measure or scroll right after adding an item):
```tsx
import { flushSync } from 'react-dom';
flushSync(() => setMessages((m) => [...m, newMessage]));   // render and commit now
listRef.current!.lastElementChild!.scrollIntoView();
```
Use `flushSync` sparingly; it forces synchronous work and can hurt performance.

**Tearing and useSyncExternalStore:**
Concurrent rendering yields mid-render. If a component reads from an external mutable store (a global variable, a custom event emitter store, older Redux bindings) and the store changes during a yield, components rendered before and after the yield can show **different values** in the same commit: 'tearing'.
```ts
// Safe subscription to an external store
const count = useSyncExternalStore(
  store.subscribe,                // subscribe(callback) => unsubscribe
  () => store.getSnapshot(),      // must return the same value for the same store state (cached)
  () => store.getServerSnapshot(),// SSR
);
```
`useSyncExternalStore` guarantees all components see a consistent snapshot by detecting changes during render and, if needed, re-rendering synchronously. Libraries like Redux (react-redux v8+), Zustand and Jotai use it. Custom stores built with `useState` + `useEffect` subscriptions should migrate. Note: `getSnapshot` must return a cached/immutable value; returning a new object each call causes infinite re-renders.

**Practical implications for application code:**
1. **Render must be pure**: concurrent React may render a component multiple times or discard renders. Side effects in render (analytics calls, mutations, subscriptions) can run for UI that never commits. StrictMode's double rendering in development exists to catch this.
2. **Effects run only after commit**, so they're the right place for side effects.
3. **Refs**: don't read/write refs during render to make decisions; values may change between interrupted renders.
4. **Use transitions for expensive, non-urgent updates** (filtering, tab switches, navigation), keeping input responsive.
5. **External stores**: use `useSyncExternalStore` or libraries built on it.
6. **Don't rely on render timing or counts** in tests or logic.
7. **Batching**: code that expected separate renders per setState may need `flushSync` (rare).

**Example of the user-visible benefit:**
```tsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => expensiveSearch(items, deferredQuery), [items, deferredQuery]);
// Typing updates `query` urgently; the expensive results render at transition priority
// and are abandoned if the user keeps typing.
```

**Limits:** concurrent rendering doesn't make code faster; a 2-second computation still takes 2 seconds of CPU. It improves responsiveness by scheduling. For heavy computation, also memoize, virtualise, or move work to a Web Worker."

#### Another worked example: tearing in a custom store
"A trading screen used a homegrown global store read via `useState` + subscription effects. After adopting transitions for chart updates, users occasionally saw a price ticker and order book showing different prices for the same instrument in one frame. Migrating the store hooks to `useSyncExternalStore` with cached snapshots fixed the inconsistency."

#### A third worked example: an impure render exposed
"After enabling concurrent features, an analytics counter incremented more than expected: a component incremented a module-level counter during render to number list items. Discarded transition renders still incremented it. Moving numbering to derived data (index from the list) fixed it; StrictMode in development would have caught it earlier."

#### Variations you might be asked
- "Is concurrent rendering multi-threaded?": no; it's cooperative scheduling on the main thread with time slicing.
- "What's selective hydration?": with streaming SSR, React hydrates Suspense boundaries independently and prioritises the boundary the user interacts with.
- "Does useDeferredValue delay network requests?": no, it defers rendering with the new value; requests depend on where you fetch.

#### Step-by-step framework
1. **Contrast synchronous and concurrent rendering.**
2. **Explain interruptibility and atomic commits.**
3. **Priorities/lanes.**
4. **Automatic batching and flushSync.**
5. **Tearing and useSyncExternalStore.**
6. **Practical implications and limits.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "React renders in parallel threads" | Cooperative, interruptible scheduling |
| Doesn't know what's opt-in | Concurrent features trigger concurrency |
| Unaware of batching changes | Explains automatic batching and flushSync |
| No tearing knowledge | useSyncExternalStore and cached snapshots |
| No code implications | Purity, effects, stores, transitions |

#### Useful phrases
- "React can pause a low-priority render to handle typing, then resume or restart it."
- "Commits are atomic, so users never see half-rendered trees."
- "Automatic batching means one render for several updates, even in promises."
- "useSyncExternalStore prevents tearing with external stores."

#### Common pitfalls
- **Side effects in render.**
- **Custom stores without useSyncExternalStore.**
- **Overusing flushSync.**
- **Expecting concurrency to speed up slow code.**

#### Follow-ups to expect (with sample answers)
- **"Why must getSnapshot return cached values?"**
  "React compares snapshots with Object.is; a new object every call looks like a change every time, causing infinite re-renders."
- **"How long does React work before yielding?"**
  "The scheduler uses short time slices (around 5 ms) during concurrent rendering, then checks for higher-priority work."
- **"Can urgent updates be interrupted?"**
  "No; discrete input updates render synchronously; only transition-priority work is interruptible."

#### What senior interviewers look for
- **Deep, accurate model of React's scheduler.**
- **Implications for libraries and app code.**
- **Clear communication of complex internals.**

#### Practise it
1. Demonstrate automatic batching in a promise and a flushSync case.
2. Build a tiny external store and connect it with useSyncExternalStore.
3. Explain concurrent rendering and tearing, out loud, in 2 minutes.

## Server Actions and forms in React 19 / Next.js
- id: fe-react-10
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: Server Actions, forms, React 19, Next.js, mutations

### Prompt
What are Server Actions? Show how to build a form with a Server Action, validation, pending states, error messages and revalidation. Explain progressive enhancement, security considerations, and when you'd still use an API route or client-side mutation library instead.

### Answer
#### What the interviewer is really testing
- Understanding Server Actions as **server functions callable from the client**, implemented as POST endpoints.
- Building complete forms with **`useActionState`, `useFormStatus`, `useOptimistic`** and **revalidation**.
- **Security**: actions are public endpoints; validate input, authenticate, authorise, rate-limit; avoid leaking data.
- **Progressive enhancement** and limitations; choosing between actions, Route Handlers and client mutations.

#### Key points
- A **Server Action** is an async function marked `'use server'` (in a file or function) that runs on the server; the framework exposes it via a generated endpoint and handles serialisation.
- Use with `<form action={serverAction}>`: works **without JavaScript** (native form POST) and is enhanced when JS loads.
- **`useActionState(action, initialState)`** returns `[state, formAction, isPending]` for results/errors; **`useFormStatus()`** in children reads pending state; **`useOptimistic`** for instant feedback.
- After mutating, call **`revalidatePath`/`revalidateTag`** or `redirect()` so Server Components show fresh data.
- **Security**: treat each action as a **public API endpoint**: validate with Zod, check the session and permissions inside the action (never trust hidden form fields), rate-limit sensitive actions, return minimal data. Next.js includes CSRF protections (Origin checks) and unguessable action IDs, but authorisation is your job.
- Closures over variables in Server Components are **encrypted** but still sent; don't capture secrets.
- Use **Route Handlers/APIs** for external clients (mobile apps, webhooks), public APIs, file streaming; use **TanStack Query mutations** for client-heavy apps calling existing APIs.

#### Model answer
"Server Actions let a form (or any client code) call a function that runs on the server, without me writing an API route and fetch call. Under the hood, the framework creates a POST endpoint for the action and wires the form to it.

**A complete form:**
```ts
// app/settings/actions.ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const ProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  bio: z.string().max(280, 'Bio must be 280 characters or fewer').optional(),
});

export type ProfileState = { ok: boolean; message?: string; errors?: Partial<Record<'displayName' | 'bio', string[]>> };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session) return { ok: false, message: 'Please sign in again.' };           // authentication

  const parsed = ProfileSchema.safeParse({
    displayName: formData.get('displayName'),
    bio: formData.get('bio') || undefined,
  });
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };   // validation

  await db.user.update({ where: { id: session.user.id }, data: parsed.data });     // authorisation: only own record
  revalidatePath('/settings');                                                      // refresh server-rendered data
  return { ok: true, message: 'Profile saved.' };
}
```
```tsx
// app/settings/ProfileForm.tsx
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfile, type ProfileState } from './actions';

export function ProfileForm({ user }: { user: { displayName: string; bio: string } }) {
  const [state, formAction] = useActionState<ProfileState, FormData>(updateProfile, { ok: false });
  return (
    <form action={formAction} noValidate>
      <label htmlFor="displayName">Display name</label>
      <input id="displayName" name="displayName" defaultValue={user.displayName}
             aria-invalid={!!state.errors?.displayName} aria-describedby="displayName-error" />
      {state.errors?.displayName && <p id="displayName-error">{state.errors.displayName[0]}</p>}

      <label htmlFor="bio">Bio</label>
      <textarea id="bio" name="bio" defaultValue={user.bio} aria-describedby="bio-error" />
      {state.errors?.bio && <p id="bio-error">{state.errors.bio[0]}</p>}

      <SubmitButton />
      <p role="status" aria-live="polite">{state.message}</p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();          // reads the parent form's pending state
  return <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}
```

**What's happening:**
1. Submitting the form calls `formAction` with `FormData`, inside a transition.
2. `useFormStatus` shows the pending state on the button.
3. The action authenticates, validates and updates the database.
4. `revalidatePath('/settings')` tells Next.js to re-render the Server Components for that route with fresh data.
5. The returned state renders field errors or a success message (announced via a live region).

**Progressive enhancement:** because the form uses a real `<form action>`, it can submit as a normal POST even before JavaScript loads (or if it fails), and the server responds with the updated page. With JS, the same form updates without a full reload. That's a meaningful resilience win on slow mobile connections.

**Optimistic updates:** combine with `useOptimistic` for instant feedback (e.g. adding a comment appears immediately with 'Posting…').

**Calling actions outside forms:**
```tsx
'use client';
const [isPending, startTransition] = useTransition();
<button onClick={() => startTransition(async () => { await archiveProject(projectId); })} disabled={isPending}>
  Archive
</button>
```

**Security: actions are public endpoints:**
- Anyone can call an action with arbitrary arguments, not just your UI. So inside every action:
  - **Authenticate** (check the session).
  - **Authorise** (does this user own this project? `where: { id, ownerId: session.user.id }`), never trusting IDs from hidden fields.
  - **Validate** input with a schema.
  - **Rate-limit** sensitive actions (login, password reset, invites).
- Return only what the UI needs; don't return full database records with sensitive fields.
- Next.js protects against CSRF by checking the `Origin` header for actions and uses non-guessable action IDs, but that's not authorisation.
- Variables captured from Server Components into inline actions are encrypted and sent to the client; don't close over secrets.
- Log and monitor failures like any API.

**When I'd use something else:**
| Need | Use |
|---|---|
| Mutations from your own Next.js UI | Server Actions |
| Mobile apps, third parties, webhooks, public API | Route Handlers / separate API |
| Client-heavy SPA with existing REST/GraphQL backend | TanStack Query mutations |
| Streaming responses, file downloads | Route Handlers |
| Complex optimistic cache updates across many views | TanStack Query (or actions + careful revalidation) |

**Gotchas:**
- Actions run sequentially per client by default (queued), so they're not ideal for parallel bulk operations.
- Errors thrown inside actions surface to the nearest error boundary; return expected errors as state instead of throwing.
- Uncontrolled inputs reset after successful submission in React 19 form actions; preserve values on error by returning them or using `defaultValue` from state.
- Large file uploads need size limits configured (body size limits)."

#### Another worked example: replacing API boilerplate
"A settings area had 12 forms, each with an API route, a fetch wrapper, loading state, error parsing and manual cache invalidation. Moving them to Server Actions with a shared Zod-validated pattern, `useActionState` and `revalidatePath` removed ~1,500 lines. Forms also worked without JavaScript, and authorisation lived in one place per action. We kept Route Handlers for the mobile app's endpoints."

#### A third worked example: an authorisation bug caught in review
"A `deleteProject(projectId)` action deleted by ID without checking ownership: any logged-in user could delete any project by calling the action with another ID. Code review caught it; the fix was `db.project.delete({ where: { id: projectId, ownerId: session.user.id } })` plus a test calling the action as a different user. It's the same IDOR risk as any API endpoint."

#### Variations you might be asked
- "How do you show a toast after a Server Action?": return a message in state and show it in a client component effect, or use cookies/flash messages with redirects.
- "Can Server Actions be used outside Next.js?": they're a React feature supported by frameworks implementing React Server Components (Next.js, others adopting RSC).
- "How do you test Server Actions?": unit-test the action function directly (with mocked auth/db), and E2E test forms with Playwright.

#### Step-by-step framework
1. **Define Server Actions** and how they're exposed.
2. **Build a form** with validation, pending, errors, revalidation.
3. **Progressive enhancement.**
4. **Optimistic UI and non-form usage.**
5. **Security** checklist.
6. **When to use alternatives** and gotchas.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Magic functions on the server" | Explains generated POST endpoints |
| No validation or auth | Zod, session, ownership checks |
| No pending/errors | useActionState, useFormStatus, live regions |
| Forgets revalidation | revalidatePath/Tag after mutations |
| Uses actions for everything | Route Handlers for external clients |

#### Useful phrases
- "A Server Action is a public POST endpoint, so I validate and authorise inside it."
- "The form works before JavaScript loads and gets enhanced afterwards."
- "useFormStatus lets the submit button know the form is pending."
- "For mobile apps and webhooks, I still expose Route Handlers."

#### Common pitfalls
- **Trusting hidden fields for IDs/ownership.**
- **Throwing expected validation errors** instead of returning state.
- **Forgetting revalidation.**
- **Closing over secrets.**

#### Follow-ups to expect (with sample answers)
- **"How does revalidatePath work?"**
  "It marks cached data and rendered output for that path as stale so the next render (including the action's response) uses fresh data."
- **"Can an action redirect?"**
  "Yes, `redirect('/dashboard')` after success; it throws internally to perform the redirect, so call it outside try/catch."
- **"How do you prevent double submissions?"**
  "Disable the button while pending, and make the server operation idempotent where it matters."

#### What senior interviewers look for
- **End-to-end form design.**
- **Security rigour.**
- **Pragmatic architecture choices.**

#### Practise it
1. Build the profile form with validation errors, pending state and revalidation.
2. Write a test calling an action as an unauthorised user.
3. Explain why Server Actions need authorisation checks, out loud.

## The React Compiler: what it does and what changes
- id: fe-react-11
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: medium
- levels:
- tags: React Compiler, memoization, performance, Rules of React

### Prompt
What is the React Compiler? What does it optimise, what does it require from your code, how do you adopt it in an existing codebase, and how does it change the way you write `useMemo`, `useCallback` and `React.memo`?

### Answer
#### What the interviewer is really testing
- Understanding the compiler as a **build-time tool that auto-memoizes** components and hooks.
- Knowing it depends on the **Rules of React** (purity, immutability, rules of hooks).
- Practical **adoption**: lint rule first, incremental rollout, opting out, verifying with DevTools and profiling.
- Implications for **manual memoization** and coding style.

#### Key points
- The **React Compiler** (formerly "React Forget") is a Babel/SWC plugin that analyses components and hooks at **build time** and inserts **fine-grained memoization** automatically.
- It memoizes **JSX, computed values, callbacks and components' render output** so unchanged parts don't re-render or recompute, without manual `useMemo`/`useCallback`/`memo`.
- It's **more granular** than manual memo: can memoize parts of a component's output based on precise dependencies.
- Requires code that follows the **Rules of React**: pure render, no mutation of props/state/hook values, hooks called unconditionally, no reading refs during render.
- If a component breaks the rules (as detected), the compiler **skips** it (bails out) rather than producing broken code; the ESLint plugin reports violations.
- Adoption: enable the **eslint plugin** (`eslint-plugin-react-hooks` compiler rules) first, fix violations, then enable the compiler **incrementally** (directory/opt-in mode, `"use memo"`), with `"use no memo"` to opt out.
- Verify with **React DevTools** (compiled components show a "Memo ✨" badge) and profiling.
- Manual memoization becomes mostly unnecessary in new code; keep useMemo where you need **semantic guarantees** (e.g. effect dependencies) carefully, or rely on compiler behaviour.
- Works with React 19 (and 17/18 with a runtime package).

#### Model answer
"The React Compiler is a build-time tool that automatically memoizes React components and hooks. Instead of developers sprinkling `useMemo`, `useCallback` and `React.memo` (and getting dependencies wrong), the compiler analyses the code and inserts memoization where it's safe and useful.

**What it does, conceptually:**
```tsx
// What you write
function ProductList({ products, onSelect }: Props) {
  const sorted = products.toSorted((a, b) => a.price - b.price);
  return (
    <ul>
      {sorted.map((p) => <ProductRow key={p.id} product={p} onSelect={() => onSelect(p.id)} />)}
    </ul>
  );
}
```
The compiler transforms it to code that caches intermediate values keyed on their inputs: `sorted` is only recomputed when `products` changes, the JSX for the list is reused when neither `sorted` nor `onSelect` changed, and the inline callbacks are stable across renders when their captured values haven't changed. It's like applying `useMemo`/`useCallback`/`memo` everywhere, but with precise dependencies computed by static analysis, and at a finer granularity (parts of the JSX tree) than developers usually manage by hand.

**What it requires: the Rules of React:**
- **Pure components and hooks**: same inputs → same output; no side effects during render.
- **Immutability**: never mutate props, state, context values or values returned from hooks; create new values instead.
```tsx
// ❌ mutates a prop — the compiler may skip this component (or it would cache incorrectly)
function Tags({ tags }: { tags: string[] }) {
  tags.sort();
  return tags.map((t) => <Tag key={t} name={t} />);
}
// ✓
const sorted = [...tags].sort();   // or tags.toSorted()
```
- **Rules of hooks**: unconditional calls, only from components/hooks.
- **Don't read or write `ref.current` during render.**
- **Don't mutate values after they've been used in JSX.**
The compiler includes analysis to detect many violations; when it finds code it can't prove safe, it **bails out** for that component (leaving it uncompiled) rather than breaking it.

**Adopting it in an existing codebase:**
1. **Upgrade** to React 19 (or use the compiler runtime package for React 17/18).
2. **Enable the lint rules** first (React's ESLint plugin includes compiler-powered checks). Fix reported violations: mutations, impure renders, conditional hooks. This is valuable even without the compiler.
3. **Install and configure** the compiler (Babel plugin, or framework support: Next.js has a `reactCompiler` config option; Vite via the Babel plugin).
4. **Roll out incrementally**: opt-in mode (only files/components with `'use memo'`) or enabling it for specific directories, starting with leaf components or a single feature.
5. **Test**: run unit/E2E tests; watch for behaviour that depended on re-rendering (e.g. code that relied on a component re-rendering to re-read a mutable value).
6. **Verify**: React DevTools shows compiled components with a 'Memo ✨' badge; profile key interactions to confirm fewer renders.
7. **Opt out** problem components with `'use no memo'` while fixing them.

**How it changes everyday code:**
- **Stop adding manual `useMemo`/`useCallback`/`React.memo`** in new code by default; the compiler handles it with better precision.
- Existing manual memoization can stay (the compiler works with it) and be removed gradually.
- Focus shifts to **writing idiomatic, pure React** and good structure (state colocation, component boundaries).
- **Effects**: memoization for effect dependencies used to be a correctness tool ('only re-run when X changes'); with the compiler, values are stable when inputs are, but you should still design effects around real dependencies and not rely on memoization for semantic guarantees. React may also introduce `useEffectEvent` for callbacks inside effects.
- **Third-party libraries** relying on mutation patterns (some older state libraries) may cause components to be skipped or need care.

**What it doesn't do:**
- It doesn't fix **expensive algorithms**, huge DOM sizes (virtualisation is still needed), or network waterfalls.
- It doesn't replace **architectural decisions** like keeping fast-changing state local or splitting contexts (though it reduces the cost of re-renders).
- It doesn't make impure code correct; it skips it.

**Results teams report:** fewer unnecessary re-renders and faster interactions in apps with lots of small components, plus less memoization code and fewer dependency-array bugs. The size of the benefit depends on how much unnecessary rendering existed and how well code follows the rules."

#### Another worked example: lint first, then compile
"Before enabling the compiler in a large app, we turned on the compiler-powered lint rules. They flagged ~140 issues: props mutated with `sort()`, refs read during render to make decisions, and conditional hooks in old components. Fixing those took two sprints and also fixed two real bugs (a sidebar whose order changed unexpectedly because a shared array was sorted in place). Enabling the compiler afterwards worked with only three components needing `'use no memo'` temporarily."

#### A third worked example: measuring the benefit
"On a dashboard with many cards and filters, React DevTools showed most components compiled. Profiling typical interactions (changing a filter, hovering charts) showed render counts dropping by about 60% and interaction latency improving by roughly 30%. We then deleted ~300 manual useCallback/useMemo calls in the following months, simplifying code reviews."

#### Variations you might be asked
- "Is the compiler like Svelte or Solid's compilers?": it's a different approach: React keeps its runtime and component model; the compiler adds memoization rather than compiling to fine-grained reactive DOM updates.
- "Does the compiler make React.memo obsolete?": largely, for components compiled together; memoization still happens, just automatically.
- "How do you debug compiler issues?": check DevTools badges, use the compiler playground to see output, opt out components with 'use no memo', and fix rule violations.

#### Step-by-step framework
1. **Define the compiler** and build-time auto-memoization.
2. **What it optimises** and its granularity.
3. **Requirements**: Rules of React, bailouts.
4. **Adoption steps**: lint, configure, incremental rollout, verify.
5. **Impact on manual memoization and effects.**
6. **Limits** and measurable results.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It makes React faster" | Explains automatic, granular memoization |
| Unaware of requirements | Rules of React, bailouts on violations |
| Big-bang enablement | Lint first, incremental rollout, verification |
| Keeps adding manual memo | Stops by default in new code |
| Thinks it fixes everything | Knows it doesn't fix algorithms, DOM size, waterfalls |

#### Useful phrases
- "The compiler inserts memoization at build time, with dependencies it works out itself."
- "It relies on components being pure and not mutating props or state."
- "If it can't prove a component is safe, it skips it rather than breaking it."
- "I'd turn on the lint rules first, because fixing those violations is valuable anyway."

#### Common pitfalls
- **Mutating props/state** (compiler skips or bugs appear).
- **Relying on re-renders** to pick up mutable values.
- **Enabling everywhere without testing.**
- **Expecting it to fix non-render performance problems.**

#### Follow-ups to expect (with sample answers)
- **"Can I use it with React 18?"**
  "Yes, with the compiler runtime package, though React 19 is the primary target."
- **"How do I see what it changed?"**
  "DevTools shows a Memo badge on compiled components, and the compiler playground shows transformed output."
- **"Will it break code that uses useMemo for correctness?"**
  "It preserves existing hooks' semantics; but memoization in general is a performance hint, so code shouldn't depend on it for correctness."

#### What senior interviewers look for
- **Up-to-date React knowledge.**
- **Safe adoption strategy.**
- **Understanding of underlying rules.**

#### Practise it
1. Run the compiler lint rules on a project and fix the top violations.
2. Enable the compiler on one directory and verify with DevTools badges.
3. Explain what the compiler requires from your code, out loud.

## Next.js App Router: data fetching, caching and revalidation
- id: fe-react-12
- roles: frontend, fullstack
- round: REACT_FRAMEWORK
- difficulty: hard
- levels: senior, staff
- tags: Next.js, App Router, caching, revalidation, data fetching

### Prompt
Explain how data fetching and caching work in the Next.js App Router. Cover fetching in Server Components, request deduplication, static vs dynamic rendering, the data cache and full route cache, `revalidate` and tags, `revalidatePath`/`revalidateTag`, the client router cache, and how Next.js 15 changed caching defaults. How do you debug stale data?

### Answer
#### What the interviewer is really testing
- A clear model of the **caching layers** and how they interact.
- Knowing what makes a route **static vs dynamic**.
- **Revalidation strategies**: time-based and on-demand (tags/paths).
- **Next.js 15 changes**: fetch not cached by default, async request APIs, router cache defaults, `use cache` direction.
- Practical skill: **choosing caching per data type**, avoiding **stale or leaked personalised data**, debugging.

#### Key points
- **Fetch in Server Components** with async/await; parallelise independent requests; stream with Suspense.
- **Request memoization**: identical `fetch` calls (same URL/options) during one render pass are **deduplicated**; for non-fetch data sources, wrap with React's `cache()`.
- **Data Cache**: persistent server-side cache of fetch results across requests/deployments when opted in (`fetch(url, { cache: 'force-cache' })` or `next: { revalidate }`); in Next 15, **fetch is not cached by default**.
- **Full Route Cache**: static routes are prerendered at build (HTML + RSC payload) and cached; dynamic routes render per request.
- A route becomes **dynamic** when it uses dynamic APIs (`cookies()`, `headers()`, `searchParams`, `connection()`), uncached data with `dynamic = 'force-dynamic'`, etc.
- **Time-based revalidation**: `export const revalidate = 60` or `fetch(..., { next: { revalidate: 60 } })` (stale-while-revalidate behaviour).
- **On-demand revalidation**: `revalidateTag('products')` (with `next: { tags: ['products'] }`) or `revalidatePath('/products')` from Server Actions/Route Handlers/webhooks.
- **Client Router Cache**: in-memory cache of visited route segments for fast back/forward and prefetching; `router.refresh()` and revalidation in actions update it; Next 15 changed defaults so page segments aren't reused by default (staleTimes configurable).
- **`use cache`** directive (newer/experimental) for caching functions/components explicitly.
- Never cache **personalised data** in shared caches; scope by user or keep dynamic.

#### Model answer
"The App Router has several caching layers, and most 'why is my data stale?' or 'why is this slow?' questions come down to which layer is involved. My approach: fetch on the server close to where data is used, decide explicitly how fresh each piece of data needs to be, and use tags to invalidate precisely.

**1. Fetching in Server Components**
```tsx
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, reviews] = await Promise.all([      // parallel, not sequential
    getProduct(id),
    getReviewsSummary(id),
  ]);
  return (
    <>
      <ProductDetails product={product} reviews={reviews} />
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations productId={id} />             {/* slower; streams in */}
      </Suspense>
    </>
  );
}
```

**2. Request memoization (per render)**
If `getProduct(id)` is called in the page, the layout and `generateMetadata`, identical `fetch` calls in one render pass are deduplicated automatically. For database queries or SDK calls (not `fetch`), wrap them with React's `cache()`:
```ts
import { cache } from 'react';
export const getProduct = cache(async (id: string) => db.product.findUnique({ where: { id } }));
```
This lets components fetch what they need independently without duplicate queries.

**3. The Data Cache (across requests)**
Opt in per fetch:
```ts
// cache indefinitely until revalidated by tag
const product = await fetch(`${API}/products/${id}`, { next: { tags: ['products', `product-${id}`] }, cache: 'force-cache' });

// cache with time-based revalidation (stale-while-revalidate)
const categories = await fetch(`${API}/categories`, { next: { revalidate: 3600 } });

// never cache (default in Next 15)
const stock = await fetch(`${API}/stock/${id}`, { cache: 'no-store' });
```
In Next.js 14, `fetch` defaulted to caching, which surprised many teams with stale data; **Next.js 15 changed fetch to not cache by default**, so caching is an explicit decision. Newer versions also introduce the `'use cache'` directive with `cacheLife` and `cacheTag` to cache any async function or component explicitly.

**4. Static vs dynamic rendering and the Full Route Cache**
- **Static**: rendered at build time (or on first request then cached); served from cache/CDN. The rendered HTML and RSC payload are stored (Full Route Cache).
- **Dynamic**: rendered per request. A route becomes dynamic if it uses request-specific APIs (`cookies()`, `headers()`, `searchParams`), opts out (`export const dynamic = 'force-dynamic'`), or uses uncached data in ways that require request-time rendering.
- Partial prerendering (where enabled) combines both: static shell plus dynamic holes streamed per request.
- `next build` output marks each route as static or dynamic, a quick check.

**5. Revalidation**
*Time-based:*
```ts
export const revalidate = 300;   // route segment: re-render at most every 5 minutes
```
After the period, the next request serves the stale version and triggers regeneration in the background; subsequent requests get the fresh version.

*On-demand (precise and immediate):*
```ts
'use server';
export async function updateProduct(id: string, data: ProductInput) {
  await assertAdmin();
  await db.product.update({ where: { id }, data });
  revalidateTag(`product-${id}`);     // invalidate every cached fetch tagged with this product
  revalidatePath('/products');        // and the listing page
}
```
Also from a CMS webhook via a Route Handler (verify the webhook signature first). Tags are better than paths when the same data appears on many pages.

**6. The client-side Router Cache**
- The browser keeps an in-memory cache of route segments (RSC payloads) for visited and prefetched routes, making navigation instant.
- Server Actions that call `revalidatePath`/`revalidateTag` also update the router cache for affected routes; `router.refresh()` re-fetches the current route's server components without losing client state.
- Next 15 changed defaults so page segments aren't reused from the router cache by default on navigation (layouts and loading states still are), reducing stale-UI surprises; `staleTimes` config can tune it.

**Choosing caching per data type:**
| Data | Strategy |
|---|---|
| Marketing/CMS content | Static + tag revalidation via CMS webhook |
| Product details | Cached with tags; revalidate on product updates |
| Prices/stock | Short revalidate (or no-store) in a Suspense island |
| Personalised (cart, profile) | Dynamic, no shared cache; per-user only |
| Reference data (countries, categories) | Long revalidate (hours/days) |
| Real-time (chat, live metrics) | Client-side (WebSockets/polling) |

**Personalised data warning:** never put user-specific data into shared caches (Data Cache, Full Route Cache, CDN). Reading `cookies()` makes the route dynamic; ensure fetches including auth headers aren't cached in a way that's shared across users.

**Debugging stale data:**
1. Identify which layer: is it the **router cache** (fixed by a hard reload?), the **full route cache** (route static when it should be dynamic? check build output), or the **data cache** (fetch cached with a long revalidate or force-cache)?
2. Check fetch options and route segment config (`revalidate`, `dynamic`).
3. Confirm mutations call `revalidateTag`/`revalidatePath` with the right tags/paths.
4. Enable Next.js fetch logging (`logging.fetches.fullUrl` in next.config) to see cache HITs/MISSes in development.
5. Test in production mode (`next build && next start`); development mode behaves differently.
6. Check CDN/hosting cache headers too."

#### Another worked example: stale prices after an admin update
"Admins updated prices, but product pages showed old prices for up to an hour. The product fetch used `revalidate: 3600` and the admin update didn't trigger revalidation. We tagged product fetches with `product-${id}`, called `revalidateTag` in the admin Server Action, and moved price/stock into a separately fetched, short-lived island. Updates appeared within seconds while product pages stayed cached and fast."

#### A third worked example: an accidental static dashboard
"After upgrading, a team's account page started showing the same data for all users in staging. The page fetched data with the session token passed as a parameter (not via `cookies()`), so Next treated it as static and cached the first render. We made the page read the session with `cookies()` (making it dynamic), set `cache: 'no-store'` for user data, and added a test asserting different users see different data. The build output's 'static' marker for that route would have warned us earlier."

#### Variations you might be asked
- "What's the difference between revalidatePath and router.refresh?": revalidatePath invalidates server caches for a path (affecting all users); router.refresh re-fetches the current route for the current client.
- "How do you cache database queries (not fetch)?": React `cache()` for per-request dedupe; `unstable_cache` or `'use cache'` for cross-request caching with tags.
- "How does generateStaticParams interact with caching?": it prerenders listed dynamic routes at build; others render on demand and are cached if static.

#### Step-by-step framework
1. **Fetch in Server Components**, parallelise, stream.
2. **Request memoization** and React cache().
3. **Data Cache** and Next 15 defaults.
4. **Static vs dynamic routes** and Full Route Cache.
5. **Revalidation**: time-based and on-demand tags.
6. **Router Cache**, per-data strategy, personalised safety, debugging.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Next caches things automatically" | Explains each layer and when it applies |
| Unaware of Next 15 changes | Knows fetch isn't cached by default |
| Time-based only | Tags and on-demand revalidation |
| Caches personalised data | Keeps user data dynamic and private |
| Can't debug staleness | Layer-by-layer debugging, build output, fetch logs |

#### Useful phrases
- "I decide freshness per piece of data, not per app."
- "Tags let me invalidate every page showing a product when it changes."
- "Reading cookies makes a route dynamic, which is what personalised pages need."
- "To debug stale data, I first work out which cache layer is holding it."

#### Common pitfalls
- **Sequential awaits** (waterfalls).
- **Assuming old caching defaults.**
- **Forgetting revalidation after mutations.**
- **Personalised data in shared caches.**

#### Follow-ups to expect (with sample answers)
- **"What does stale-while-revalidate mean here?"**
  "After the revalidate period, the next visitor gets the cached (stale) page while Next regenerates it in the background; later visitors get the fresh version."
- **"How do you verify whether a route is static?"**
  "The `next build` output marks routes as static or dynamic; you can also check response headers and logs."
- **"What's `connection()`?"**
  "A function that marks rendering as dynamic (waiting for an incoming request) without reading cookies or headers."

#### What senior interviewers look for
- **Deep framework understanding.**
- **Data-freshness and correctness judgement.**
- **Debugging methodology.**

#### Practise it
1. Implement tag-based revalidation for a product page updated via a Server Action.
2. Use the build output to classify routes and fix one that's wrongly static or dynamic.
3. Explain the caching layers, out loud, in 2 minutes.
