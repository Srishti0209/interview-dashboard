# Frontend Engineer — State & Data Fetching

## Server state vs client state
- id: fe-state-01
- roles: frontend, fullstack
- round: STATE_DATA_FETCHING
- difficulty: medium
- levels:
- tags: state management, server state, client state, architecture

### Prompt
What's the difference between server state and client state? Why does mixing them in one global store cause problems, and how would you structure state in a modern React application (server cache, URL state, form state, local UI state, global client state)?

### Answer
#### What the interviewer is really testing
- Recognising that **server data is a cache of remote state**, with different needs from UI state.
- Knowing the **categories of state** and the right home for each.
- Understanding problems of **putting API data in Redux/Context** manually (staleness, duplication, loading flags, cache invalidation).
- Designing a **coherent state architecture** that minimises global state.

#### Key points
- **Server state**: data owned by the backend (users, orders, products). It's **asynchronous**, **shared** across clients, can become **stale**, and needs **fetching, caching, deduplication, background refetching, invalidation, pagination, optimistic updates, retries**.
- **Client state**: data owned by the browser session (theme, open modal, selected tab, draft input, wizard step). Synchronous and usually local.
- Mixing server data into global stores means **re-implementing a cache** badly: manual loading/error flags, duplicated entities, stale data, invalidation bugs.
- Categories and homes:
  - **Server cache**: TanStack Query / SWR / RTK Query / Apollo, or **Server Components** for read-heavy pages.
  - **URL state**: filters, sort, pagination, selected tab, search (shareable, back button).
  - **Form state**: React Hook Form / form actions.
  - **Local UI state**: `useState`/`useReducer` in the component that needs it.
  - **Global client state**: small store (Zustand/Redux/Context) for genuinely cross-cutting state (auth session info, theme, feature flags, multi-step flows spanning pages).
  - **Persistent client state**: localStorage/IndexedDB for preferences, drafts, offline data.
- Principle: **colocate** state; derive instead of duplicate; keep global state minimal.

#### Model answer
"I split state by who owns it. **Server state** is data whose source of truth lives on the backend: products, orders, users. **Client state** is data that only exists in the browser: whether a menu is open, which tab is selected, a draft message, the current theme. They behave differently, so they need different tools.

**Why server state is different:**
- It's **remote and asynchronous**: you need loading and error states.
- It's **shared and changes without you**: other users or processes modify it, so your copy goes **stale**.
- It's a **cache**: you need deduplication (two components requesting the same data → one request), background refetching (on window focus, reconnect), invalidation after mutations, pagination and infinite loading, retries, and garbage collection of unused data.
- Updates often benefit from **optimistic UI** with rollback.

**What goes wrong when it lives in a global store:**
```ts
// The classic Redux approach for every resource
{ orders: { items: [], isLoading: false, error: null, lastFetched: null } }
// plus thunks: fetchOrders, fetchOrdersSuccess, fetchOrdersFailure…
```
For every resource you hand-write loading/error flags, caching rules and invalidation. Common bugs: stale data after a mutation elsewhere, duplicate requests from multiple components, the same entity duplicated across slices and getting out of sync, no refetch on focus, race conditions. You end up building a worse version of a data-fetching library.

**A server-state library handles it:**
```tsx
function OrdersPage() {
  const { data: orders, isPending, isError, refetch } = useQuery({
    queryKey: ['orders', { status: 'open' }],
    queryFn: () => api.getOrders({ status: 'open' }),
    staleTime: 30_000,
  });
  ...
}

const queryClient = useQueryClient();
const cancelOrder = useMutation({
  mutationFn: api.cancelOrder,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),   // all order lists refresh
});
```
Caching, dedupe, background refetching, retries and invalidation come built in. In Next.js App Router, read-heavy pages can fetch in **Server Components** instead, with revalidation handling freshness.

**Where each kind of state lives:**
| State | Examples | Home |
|---|---|---|
| Server cache | Products, orders, user profile from API | TanStack Query/SWR/RTK Query/Apollo, or Server Components |
| URL state | Filters, sort, page, selected tab, search query | URL search params / route params |
| Form state | Inputs, validation, dirty/touched | React Hook Form, form actions, local state |
| Local UI state | Open/closed, hover, active step | `useState`/`useReducer` in the owning component |
| Global client state | Theme, auth session info, feature flags, cross-page wizard | Context (rarely changing) or a small store (Zustand/Redux) |
| Persistent client state | Preferences, drafts, offline data | localStorage/IndexedDB (synced via hooks) |

**URL as state** deserves emphasis: filters and pagination in the URL make views shareable, bookmarkable, survive refresh, and work with the back button. It's often the right home for state people put in Redux.

**Principles I follow:**
1. **Colocate**: keep state as close as possible to where it's used; lift only when siblings need it.
2. **Derive, don't duplicate**: compute filtered lists, totals and 'isValid' from source state instead of storing them.
3. **Single source of truth**: don't copy server data into local state unless you're editing a draft (and then key it by record).
4. **Minimal global state**: most apps need very little after moving server data into a query cache.
5. **Normalise only when needed**: query caches keyed by request avoid most normalisation needs; for highly relational, frequently updated entities, consider normalised caches (Apollo, RTK Query entity adapters).

**Result in practice:** after separating server state, many teams find their Redux store shrinks by 80–90%, leaving only true client state, or they remove Redux entirely in favour of a small Zustand store plus TanStack Query."

#### Another worked example: shrinking a Redux store
"A React app had a 4,000-line Redux store where 85% of slices were API data with hand-written loading flags and refetch logic. Bugs included stale order lists after cancellations and duplicate requests on dashboard load. We migrated server data to TanStack Query feature by feature, moved filters into the URL, and kept a tiny Zustand store for UI preferences. The store shrank to ~300 lines, duplicate requests disappeared (deduplication), and invalidation fixed the stale lists."

#### A third worked example: the copied-prop bug
"An edit form copied `user` from a query into local state on mount (`useState(user)`), then a background refetch updated the query, but the form kept showing old data, and saving overwrote newer server changes. We made the form a draft explicitly keyed by `user.id` and `updatedAt`, warned if the server version changed during editing, and used optimistic concurrency (version checks) on save."

#### Variations you might be asked
- "Is Redux obsolete?": no; Redux Toolkit (with RTK Query for server state) is still solid for complex client state, devtools and large teams; but many apps need less global state than they think.
- "Where does WebSocket data go?": update the query cache (`queryClient.setQueryData`) from socket events, or a dedicated store for streaming data.
- "How do you share state between micro-frontends?": minimise it; use URL, events, or a small shared store/contract.

#### Step-by-step framework
1. **Define server vs client state.**
2. **Explain server state's special needs.**
3. **Show problems of manual global stores.**
4. **Map state categories to homes.**
5. **Principles**: colocate, derive, single source, minimal global.
6. **Real migration outcomes.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Put everything in Redux" | Separates server and client state |
| Hand-written loading flags | Query library caching and invalidation |
| Filters in global state | URL state for shareable views |
| Copies server data into local state | Single source; drafts keyed explicitly |
| No architecture | Clear homes per state category |

#### Useful phrases
- "Server state is a cache of data someone else owns."
- "Once API data moves into a query cache, global client state usually becomes tiny."
- "Filters and pagination belong in the URL."
- "I derive values rather than storing them twice."

#### Common pitfalls
- **Re-implementing caching in Redux.**
- **Duplicated entities going out of sync.**
- **Global state for local concerns.**
- **Copying props/query data into state.**

#### Follow-ups to expect (with sample answers)
- **"When is a global store justified?"**
  "For client state used across distant parts of the app that changes often: e.g. a multi-step editor's state, complex UI preferences, or collaborative session state."
- **"How do Server Components change state management?"**
  "Read-only server data can be fetched on the server and rendered without client caches, leaving client state for interactivity."
- **"How do you avoid prop drilling without global state?"**
  "Composition (children), colocated context providers, and URL state."

#### What senior interviewers look for
- **Clear state taxonomy.**
- **Pragmatic tool choices.**
- **Experience simplifying architectures.**

#### Practise it
1. Categorise every piece of state in an app you know into the table above.
2. Migrate one Redux API slice to TanStack Query with invalidation.
3. Explain server vs client state, out loud, in 60 seconds.

## Choosing state management: Context, Redux Toolkit, Zustand, Jotai
- id: fe-state-02
- roles: frontend, fullstack
- round: STATE_DATA_FETCHING
- difficulty: medium
- levels:
- tags: state management, Redux Toolkit, Zustand, Jotai, Context

### Prompt
Compare the main client state management options in React: built-in state and Context, Redux Toolkit, Zustand, Jotai (and signals-style libraries). What are the trade-offs in boilerplate, performance, devtools, scalability and team fit? How would you choose for a new project?

### Answer
#### What the interviewer is really testing
- Knowing the **mental models**: single store with reducers, minimal store with selectors, atoms.
- **Performance** characteristics: subscription granularity, re-render scope.
- **Ecosystem and team considerations**: devtools, middleware, conventions, learning curve, TypeScript.
- A **context-driven decision**, starting from "do we need global state at all?"

#### Key points
- Start with **local state + composition**; then **URL state**; then **server-state library**; global client state only for what's left.
- **Context**: built-in, great for low-frequency values (theme, auth, flags); all consumers re-render on change; no selectors.
- **Redux Toolkit (RTK)**: single store, slices with reducers (Immer), actions, middleware, excellent **DevTools** (time travel), **RTK Query** for server state; predictable and conventional, more structure/boilerplate; good for large teams and complex state transitions.
- **Zustand**: tiny store with hooks and **selectors**, minimal boilerplate, works outside React, middleware (persist, devtools, immer); less prescriptive.
- **Jotai** (and Recoil-style): **atoms** as small independent pieces of state; derived atoms; fine-grained updates; great for many independent pieces and derived state.
- **Signals** (Preact signals, Legend State, MobX-style observables): fine-grained reactivity; different mental model from React's.
- Selection criteria: **frequency of updates**, **number of consumers**, **complexity of transitions**, **devtools needs**, **team familiarity**, **SSR/RSC compatibility**, **bundle size**.

#### Model answer
"Before choosing a library, I ask how much global client state we really need. With server data in TanStack Query (or Server Components), filters in the URL, forms in React Hook Form and UI state kept local, the remaining global state is often small: theme, session info, feature flags, maybe a complex editor's state. The choice depends on that remainder.

**Built-in: useState/useReducer + Context**
```tsx
const ThemeContext = createContext<Theme>('light');
```
- Pros: no dependency, simple, perfect for **rarely changing** values read widely.
- Cons: every consumer re-renders when the value changes; no selectors; needs care (memoized values, split contexts) as complexity grows.
- Use for: theme, locale, auth user, feature flags, dependency injection.

**Redux Toolkit**
```ts
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] as CartItem[] },
  reducers: {
    added(state, action: PayloadAction<CartItem>) { state.items.push(action.payload); },   // Immer: 'mutating' is safe
    removed(state, action: PayloadAction<string>) { state.items = state.items.filter((i) => i.id !== action.payload); },
  },
});
export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
const count = useSelector((s: RootState) => s.cart.items.length);   // selector-based subscription
```
- Pros: predictable **event-driven** model (actions describe what happened), excellent **DevTools** (action log, time travel, state diffs), middleware (logging, analytics, sagas/listeners), strong conventions for **large teams**, **RTK Query** built in for server state, great TypeScript support.
- Cons: more concepts and structure than needed for small apps; one global store.
- Use for: complex client state with many interacting transitions (editors, workflows), large teams wanting conventions, apps already on Redux.

**Zustand**
```ts
type CartStore = { items: CartItem[]; add: (i: CartItem) => void; remove: (id: string) => void };
export const useCartStore = create<CartStore>()(devtools(persist((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}), { name: 'cart' })));

const count = useCartStore((s) => s.items.length);    // re-renders only when count changes
```
- Pros: tiny (~1 KB), minimal boilerplate, **selector subscriptions** (fine-grained re-renders), usable outside React (`useCartStore.getState()`), middleware for devtools, persistence and Immer, easy to learn.
- Cons: fewer conventions (teams must agree patterns), less structured devtools story than Redux.
- Use for: most apps needing a modest amount of shared client state.

**Jotai (atoms)**
```ts
const filterAtom = atom<'all' | 'done'>('all');
const todosAtom = atom<Todo[]>([]);
const visibleTodosAtom = atom((get) => {
  const filter = get(filterAtom);
  return get(todosAtom).filter((t) => filter === 'all' || t.done);
});
const [visible] = useAtom(visibleTodosAtom);   // recomputes when dependencies change
```
- Pros: state as small, composable atoms; **derived state** is natural; fine-grained updates (only components using an atom re-render); good for UIs with many independent pieces (design tools, dashboards with many widgets).
- Cons: different mental model; can scatter state across many atoms without structure.
- Use for: many independent or derived pieces of state, complex interdependent UI.

**Signals/observables** (MobX, Preact signals, Legend State): automatic dependency tracking and fine-grained updates; very fast for highly dynamic UIs, but a different paradigm from React's immutable model and sometimes at odds with React's concurrency and the React Compiler.

**Comparison:**
| | Context | Redux Toolkit | Zustand | Jotai |
|---|---|---|---|---|
| Boilerplate | Low | Medium | Very low | Low |
| Re-render granularity | All consumers | Selectors | Selectors | Per atom |
| DevTools | React DevTools | Excellent | Good (middleware) | Good |
| Structure/conventions | None | Strong | Light | Light |
| Outside React | No | Yes | Yes | Limited |
| Server state | No | RTK Query | No (use TanStack) | No (use TanStack) |
| Best for | Low-frequency globals | Complex, large-team apps | Most modest needs | Many derived/independent pieces |

**SSR / Server Components considerations:** global stores are per-request on the server; create stores per request (or per provider) to avoid sharing state between users. Client stores only work in client components.

**How I'd choose for a new project:**
1. TanStack Query (or RSC) for server state, URL for filters, React Hook Form for forms, local state by default.
2. Context for theme/auth/flags.
3. If shared client state remains: **Zustand** by default for simplicity; **Redux Toolkit** if the domain has complex event-driven transitions, the team values strict conventions and DevTools, or there's existing Redux expertise; **Jotai** if the UI is made of many independent, derived pieces.
4. Document patterns (where state lives, naming, selectors) so the team is consistent."

#### Another worked example: choosing for a design tool
"A browser-based diagram editor had hundreds of shapes, each with position, style and selection state, plus derived values like bounding boxes. A single Redux store re-ran many selectors on every drag. Jotai atoms per shape (with derived atoms for selection bounds) limited re-renders to the shapes being moved, keeping dragging at 60 fps. We kept server persistence in TanStack Query mutations."

#### A third worked example: when Redux was the right call
"A fintech back-office app had complex multi-step workflows (KYC review, approvals, audit trails) with many actions affecting shared state, strict auditability, and 25 engineers. Redux Toolkit's action log, middleware for audit events and DevTools time travel made debugging and onboarding easier; RTK Query handled server data. Conventions mattered more than minimal boilerplate."

#### Variations you might be asked
- "How do you avoid sharing store state between requests in SSR?": create the store inside a provider per request (e.g. a `StoreProvider` that initialises with `useRef`), never a module-level singleton for request-specific data.
- "What's the difference between Zustand and Context?": Zustand supports selector subscriptions so components re-render only for the slice they use; Context re-renders all consumers.
- "Should forms go in global state?": rarely; form libraries or local state are better, except multi-page wizards that may use a store or URL.

#### Step-by-step framework
1. **Question the need** for global state.
2. **Explain each option's model** with code.
3. **Compare trade-offs** in a table.
4. **Consider SSR/RSC and server state separation.**
5. **Recommend** based on context.
6. **Document team conventions.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Redux is outdated" / "Redux always" | Context-driven choice |
| Puts server data in stores | Separates server state |
| Ignores re-render granularity | Selectors/atoms vs Context |
| No SSR consideration | Per-request stores |
| No conventions | Documents patterns |

#### Useful phrases
- "First I shrink the problem: server state, URL state and form state go elsewhere."
- "Zustand is my default for modest shared client state."
- "Redux Toolkit shines for complex event-driven state and big teams."
- "Jotai fits UIs made of many independent, derived pieces."

#### Common pitfalls
- **One giant store for everything.**
- **Context for high-frequency state.**
- **Module-level stores in SSR** leaking state across users.
- **Mixing many libraries** without rules.

#### Follow-ups to expect (with sample answers)
- **"How does Redux Toolkit reduce boilerplate?"**
  "createSlice generates actions and reducers, Immer allows 'mutating' updates, configureStore sets up devtools and middleware."
- **"How do you test a Zustand store?"**
  "Call actions via getState() and assert state, resetting the store between tests; or render components with the store."
- **"What problem do atoms solve?"**
  "They let state be split into small independent units with automatic dependency tracking for derived values, minimising re-renders."

#### What senior interviewers look for
- **Breadth with balanced judgement.**
- **Performance awareness.**
- **Architecture-first thinking.**

#### Practise it
1. Implement the same cart in Context, Redux Toolkit, Zustand and Jotai; compare code and re-renders.
2. Write a one-page state management decision record for a new project.
3. Explain when you'd choose Redux over Zustand, out loud.

## Data fetching with TanStack Query: caching, invalidation, dedupe
- id: fe-state-03
- roles: frontend, fullstack
- round: STATE_DATA_FETCHING
- difficulty: medium
- levels:
- tags: TanStack Query, caching, invalidation, server state

### Prompt
Explain how TanStack Query (React Query) works: query keys, the cache, `staleTime` vs `gcTime`, background refetching, deduplication, mutations and invalidation, optimistic updates, pagination/infinite queries, prefetching and SSR hydration. What mistakes do teams commonly make?

### Answer
#### What the interviewer is really testing
- A correct model of the **query cache** keyed by **query keys**.
- Understanding **freshness** (`staleTime`) vs **retention** (`gcTime`) and refetch triggers.
- **Mutations and invalidation** strategies, including **optimistic updates** with rollback.
- Advanced features: **dependent queries, pagination, infinite queries, prefetching, SSR/RSC hydration**.
- Common **mistakes**: bad keys, copying data into state, over-invalidation, staleTime 0 everywhere.

#### Key points
- A **query** = unique **key** (array) + **query function**; results are cached by key; components using the same key share data and requests (**deduplication**).
- **Query keys** must include **every variable** the query depends on (`['orders', { status, page }]`); keys are hashed deterministically.
- **`staleTime`** (default 0): how long data is considered fresh; fresh data isn't refetched. **`gcTime`** (default 5 min): how long **unused** data stays in cache before garbage collection.
- Stale data triggers **background refetch** on mount, window focus, reconnect, or interval; users see cached data instantly while it updates.
- **Mutations** (`useMutation`) change server data; afterwards **invalidate** related queries (`invalidateQueries({ queryKey: ['orders'] })`) or update the cache directly (`setQueryData`).
- **Optimistic updates**: `onMutate` snapshot + update cache, `onError` rollback, `onSettled` invalidate.
- **Infinite queries** (`useInfiniteQuery`) with cursors; **pagination** with `placeholderData: keepPreviousData`.
- **Prefetching** (`prefetchQuery`) on hover or route loaders; **SSR**: prefetch on the server and **dehydrate/hydrate** (`HydrationBoundary`).
- Built-in **retries** with backoff, **AbortSignal** support, devtools.
- Mistakes: missing key variables, syncing query data into useState, `staleTime: 0` causing refetch storms, invalidating everything, not using query key factories.

#### Model answer
"TanStack Query is a cache for server state. I tell it how to fetch data and give each piece of data a key; it handles caching, deduplication, background updates, retries and garbage collection, and components just read from it.

**Queries and keys:**
```tsx
function useOrders(filters: { status: OrderStatus; page: number }) {
  return useQuery({
    queryKey: ['orders', filters],                  // every variable the fetch depends on
    queryFn: ({ signal }) => api.getOrders(filters, { signal }),
    staleTime: 30_000,                             // fresh for 30s: no refetch on remount during that time
  });
}
```
- The **key** identifies the data. `['orders', { status: 'open', page: 2 }]` and `['orders', { status: 'open', page: 3 }]` are different cache entries. Missing a variable in the key is the most common bug: changing the page wouldn't refetch, or different filters would share cached data.
- Multiple components calling `useOrders` with the same filters share **one request** and one cache entry (**deduplication**).

**Freshness and retention:**
- **`staleTime`**: how long data counts as fresh. While fresh, mounting components get cached data without refetching. Default is 0 (immediately stale), which means refetch on every mount/focus; I usually set a sensible default (e.g. 30–60 s) per data type.
- **`gcTime`** (formerly cacheTime): how long data with **no active observers** stays in memory (default 5 minutes). Navigating away and back within that window shows cached data instantly (then refetches if stale).
- **Refetch triggers** for stale data: component mount, window refocus (`refetchOnWindowFocus`), reconnect, `refetchInterval` polling, or manual `refetch()`/invalidation.
This gives 'stale-while-revalidate' UX: show cached data immediately, update quietly in the background.

**Mutations and invalidation:**
```tsx
const queryClient = useQueryClient();
const cancelOrder = useMutation({
  mutationFn: (id: string) => api.cancelOrder(id),
  onSuccess: (updated) => {
    queryClient.setQueryData(['order', updated.id], updated);          // update the detail cache directly
    queryClient.invalidateQueries({ queryKey: ['orders'] });          // refetch all order lists (prefix match)
  },
});
```
- `invalidateQueries` marks matching queries stale and refetches active ones. Keys are matched by **prefix**, so `['orders']` invalidates every `['orders', {...}]` list.
- `setQueryData` updates the cache immediately when the response contains the new data, avoiding an extra request.

**Optimistic updates with rollback:**
```tsx
const toggleTodo = useMutation({
  mutationFn: api.toggleTodo,
  onMutate: async (id: string) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });         // avoid overwriting with in-flight refetch
    const previous = queryClient.getQueryData<Todo[]>(['todos']);
    queryClient.setQueryData<Todo[]>(['todos'], (old = []) => old.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    return { previous };
  },
  onError: (_err, _id, ctx) => { queryClient.setQueryData(['todos'], ctx?.previous); toast.error('Could not update'); },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});
```
A simpler alternative in v5: render optimistic UI from the mutation's `variables` while `isPending`, without touching the cache.

**Dependent queries:**
```tsx
const { data: user } = useQuery({ queryKey: ['me'], queryFn: api.me });
const { data: projects } = useQuery({
  queryKey: ['projects', user?.orgId],
  queryFn: () => api.projects(user!.orgId),
  enabled: !!user?.orgId,                         // wait until we know the org
});
```

**Pagination and infinite queries:**
```tsx
useQuery({ queryKey: ['products', page], queryFn: () => api.products(page), placeholderData: keepPreviousData });
// keeps showing page 2 while page 3 loads (no flashing spinners)

useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => api.feed({ cursor: pageParam }),
  initialPageParam: null as string | null,
  getNextPageParam: (last) => last.nextCursor ?? undefined,
});
```

**Prefetching and SSR:**
```tsx
// prefetch on hover for instant navigation
<Link href={`/orders/${id}`} onMouseEnter={() => queryClient.prefetchQuery({ queryKey: ['order', id], queryFn: () => api.order(id), staleTime: 60_000 })}>

// Next.js App Router: prefetch on the server, hydrate on the client
export default async function Page() {
  const qc = new QueryClient();
  await qc.prefetchQuery({ queryKey: ['orders', defaultFilters], queryFn: () => api.getOrders(defaultFilters) });
  return <HydrationBoundary state={dehydrate(qc)}><OrdersClient /></HydrationBoundary>;
}
```
The client's first render uses the server-fetched data (no loading spinner, no hydration mismatch), then TanStack Query takes over for interactivity.

**Query key factories** keep keys consistent:
```ts
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (f: Filters) => [...orderKeys.lists(), f] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};
```

**Common mistakes:**
- **Missing variables in keys** (stale or wrong data across filters).
- **Copying query data into `useState`** (it stops updating with refetches).
- **`staleTime: 0` everywhere** with many components mounting, causing refetch storms; or **`staleTime: Infinity`** for data that changes.
- **Invalidating everything** (`invalidateQueries()` with no key) after every mutation.
- **Not handling errors and empty states.**
- Using it as a general client state store (it's for server state).
- Creating a new `QueryClient` on every render (must be stable)."

#### Another worked example: eliminating duplicate requests
"A dashboard made 14 requests on load, including the same `/me` and `/permissions` calls from five components. Moving to TanStack Query with shared keys and `staleTime: 5 minutes` for user data deduplicated them to 7 requests, and switching back to the tab showed data instantly while refreshing in the background. Load time dropped by about 40%."

#### A third worked example: the key bug
"A product table's 'Sort by price' didn't change results after the first load: the query key was `['products']` without the sort parameter, so the cached unsorted data was reused. Adding sort, filters and page to the key (via a key factory) fixed it, and we added an ESLint plugin for TanStack Query (exhaustive-deps for query keys) to catch it in review."

#### Variations you might be asked
- "How do you update caches from WebSockets?": on socket messages, call `setQueryData` for affected keys or invalidate them.
- "What's the difference between isPending and isFetching?": isPending means no data yet; isFetching means a request is in flight (including background refetches with cached data shown).
- "When would you use RTK Query or SWR instead?": RTK Query if already using Redux Toolkit; SWR for simpler needs; Apollo/Relay for GraphQL with normalised caching.

#### Step-by-step framework
1. **Queries and keys**, deduplication.
2. **staleTime vs gcTime**, refetch triggers.
3. **Mutations**: invalidation and setQueryData.
4. **Optimistic updates** with rollback.
5. **Dependent, paginated, infinite queries, prefetching, SSR hydration.**
6. **Key factories and common mistakes.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "A fetch wrapper" | A server-state cache with keys and lifecycle |
| Confuses staleTime and gcTime | Explains freshness vs retention |
| Refetches manually everywhere | Invalidation by key prefix |
| Optimistic updates without rollback | Snapshot, rollback, settle |
| Copies data into state | Reads from cache directly |

#### Useful phrases
- "The query key must include everything the request depends on."
- "staleTime controls refetching; gcTime controls how long unused data stays cached."
- "After a mutation, I invalidate by key prefix so every related list refreshes."
- "Server-side prefetch plus hydration means no loading spinner on first render."

#### Common pitfalls
- **Incomplete keys.**
- **useState copies of query data.**
- **Refetch storms** with zero staleTime.
- **Over-broad invalidation.**

#### Follow-ups to expect (with sample answers)
- **"What happens when two components request the same key at once?"**
  "One request is made; both subscribe to the same cache entry."
- **"How do retries work?"**
  "Failed queries retry 3 times by default with exponential backoff; configure per query or disable for 4xx errors."
- **"How do you handle auth expiry?"**
  "A global query/mutation error handler that refreshes tokens or redirects to login on 401s."

#### What senior interviewers look for
- **Correct cache mental model.**
- **Thoughtful freshness configuration.**
- **Robust mutation patterns.**

#### Practise it
1. Build a paginated list with keepPreviousData and a key factory.
2. Implement an optimistic toggle with rollback and invalidation.
3. Explain staleTime vs gcTime, out loud.

## URL as state: search params, filters and shareable views
- id: fe-state-04
- roles: frontend, fullstack
- round: STATE_DATA_FETCHING
- difficulty: medium
- levels:
- tags: URL state, search params, routing, filters

### Prompt
Why and when should you store state in the URL? Show how to manage filters, sorting, pagination and selected tabs in search params in React/Next.js, including parsing and validation, push vs replace, debouncing text input, and syncing with data fetching.

### Answer
#### What the interviewer is really testing
- Recognising which state belongs in the URL: **shareable, bookmarkable, navigable** view state.
- Practical implementation: **reading, writing, parsing, validating** search params with types.
- UX details: **push vs replace**, history spam, debouncing, scroll restoration, defaults.
- Integration with **data fetching** (query keys, Server Components) and SEO.

#### Key points
- Put state in the URL when users should be able to **share it, bookmark it, refresh without losing it, or use back/forward**: filters, search, sort, pagination, selected tab, selected item, map viewport.
- Don't put **sensitive data** (tokens, PII), large blobs, or ephemeral UI state (hover, open dropdown) in the URL.
- URLs are strings: **parse and validate** (Zod or libraries like **nuqs**), with **defaults** and safe handling of invalid values.
- **`replace`** for continuous changes (typing, slider) to avoid history spam; **`push`** for meaningful navigations (page change, tab switch, applying filters).
- **Debounce** URL updates from text input; keep the input's own state local for responsiveness.
- Use the URL as the **single source of truth**: derive filter UI from params; include params in **query keys** or Server Component data fetching.
- Remove params equal to defaults for clean URLs; keep param names stable (they become part of bookmarks).
- SEO: canonical URLs for filtered pages; `noindex` for infinite combinations if needed.

#### Model answer
"State belongs in the URL when the URL should reproduce what the user sees. If someone filters products to 'red shoes under £50, sorted by price, page 2', they should be able to share that link, refresh, bookmark it, and use the back button to undo the last filter change.

**What goes in the URL (and what doesn't):**
| URL state | Not URL state |
|---|---|
| Search query, filters, sort, page | Hover, focus, open dropdowns |
| Selected tab, selected item ID | Unsaved form drafts (usually) |
| Map viewport, date range | Tokens, personal data |
| View mode (grid/list) | Large data blobs |

**Parsing and validating (Next.js App Router, client component):**
```tsx
'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { z } from 'zod';

const FiltersSchema = z.object({
  q: z.string().optional().default(''),
  sort: z.enum(['relevance', 'price-asc', 'price-desc']).catch('relevance'),
  page: z.coerce.number().int().min(1).catch(1),
  colour: z.array(z.string()).catch([]),
});
type Filters = z.infer<typeof FiltersSchema>;
const DEFAULTS: Filters = { q: '', sort: 'relevance', page: 1, colour: [] };

export function useFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = FiltersSchema.parse({
    q: params.get('q') ?? undefined,
    sort: params.get('sort') ?? undefined,
    page: params.get('page') ?? undefined,
    colour: params.getAll('colour'),
  });

  function setFilters(next: Partial<Filters>, { replace = false } = {}) {
    const merged = { ...filters, ...next };
    if (!('page' in next)) merged.page = 1;                    // reset page when filters change
    const sp = new URLSearchParams();
    if (merged.q) sp.set('q', merged.q);
    if (merged.sort !== DEFAULTS.sort) sp.set('sort', merged.sort);
    if (merged.page !== DEFAULTS.page) sp.set('page', String(merged.page));
    merged.colour.forEach((c) => sp.append('colour', c));
    const url = sp.size ? `${pathname}?${sp}` : pathname;      // omit defaults for clean URLs
    replace ? router.replace(url, { scroll: false }) : router.push(url, { scroll: false });
  }

  return { filters, setFilters };
}
```
Key decisions:
- **Validation with fallbacks** (`.catch`): a hand-edited or old URL (`?page=abc`, `?sort=oldValue`) falls back to defaults instead of crashing.
- **Defaults omitted** from the URL to keep it short and canonical.
- **Reset page** when filters change, a classic bug otherwise (page 5 of a filter with only 2 pages).
- Libraries like **nuqs** provide typed `useQueryState` hooks with parsers, batching and throttling, reducing boilerplate.

**Push vs replace:**
- **push** creates a history entry: use for discrete, meaningful changes (applying a filter, switching tab, changing page) so Back undoes them.
- **replace** updates the URL without a history entry: use for continuous changes (typing a search query, dragging a price slider, panning a map), otherwise Back would step through every keystroke.

**Text search: debounce URL updates, keep input local:**
```tsx
function SearchInput() {
  const { filters, setFilters } = useFilters();
  const [text, setText] = useState(filters.q);
  const debounced = useDebouncedValue(text, 300);
  useEffect(() => {
    if (debounced !== filters.q) setFilters({ q: debounced }, { replace: true });
  }, [debounced]);                                          // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setText(filters.q); }, [filters.q]);   // sync when URL changes via back/forward
  return <input type="search" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search products" />;
}
```

**Data fetching from URL state:**
- **Client fetching**: include the parsed filters in the query key: `useQuery({ queryKey: ['products', filters], queryFn: () => api.products(filters), placeholderData: keepPreviousData })`. Any URL change triggers the right fetch, and back/forward reuse cached results.
- **Server Components**: read `searchParams` in the page (async in Next 15) and fetch on the server; the URL is the input to rendering:
```tsx
export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const filters = parseFilters(await searchParams);
  const products = await getProducts(filters);
  return <ProductGrid products={products} />;
}
```
Wrapping filter changes in `startTransition` keeps the current results visible while the new page renders.

**Other details:**
- **Scroll**: pass `scroll: false` when updating filters so the page doesn't jump to the top; for pagination, scroll to the results heading deliberately.
- **Encoding**: use `URLSearchParams` (handles special characters) rather than string concatenation.
- **Arrays**: repeated params (`colour=red&colour=blue`) or comma-separated values; be consistent.
- **SEO**: filtered URLs can create near-infinite crawlable combinations; set canonical URLs to the unfiltered or primary filtered pages, and `noindex` for low-value combinations.
- **Accessibility**: when results update, announce counts with a live region; manage focus for pagination."

#### Another worked example: shareable dashboards
"Support managers kept asking teammates 'which filters are you using?' because a ticket dashboard stored filters in Redux. Moving status, assignee, date range and sort into the URL (validated with Zod, defaults omitted) made every view a shareable link, preserved filters on refresh, and made Back undo filter changes. We removed the Redux filter slice entirely, and TanStack Query keys derived from the parsed URL handled caching."

#### A third worked example: history spam from a slider
"A price-range slider pushed a new URL on every pixel of movement, so pressing Back after adjusting it required dozens of presses. Switching to `replace` while dragging and a single `push` on release (pointerup) fixed it, along with throttled updates to avoid excessive refetching."

#### Variations you might be asked
- "Hash vs search params?": the hash isn't sent to the server and is used for in-page anchors or client-only state; search params are visible to servers and SSR.
- "How do you share state too large for the URL?": store it server-side (saved views) and put an ID in the URL.
- "React Router equivalent?": `useSearchParams()` returns params and a setter with `{ replace: true }` option.

#### Step-by-step framework
1. **Decide what belongs in the URL.**
2. **Parse and validate** with defaults.
3. **Write with push or replace** appropriately.
4. **Debounce text input**, keep input local.
5. **Drive data fetching** from parsed params.
6. **Handle scroll, encoding, arrays, SEO, accessibility.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Filters in global state | URL as source of truth |
| Trusts raw params | Validates with fallbacks |
| push on every keystroke | replace for continuous input, debounced |
| Page not reset on filter change | Resets pagination |
| Ignores SEO and scroll | Canonicals, scroll control |

#### Useful phrases
- "If someone should be able to share what they see, it goes in the URL."
- "Typing uses replace so Back doesn't step through every keystroke."
- "I validate params because URLs can be edited or outdated."
- "The parsed URL feeds the query key, so back and forward reuse the cache."

#### Common pitfalls
- **History spam.**
- **Unvalidated params crashing the page.**
- **Duplicated state** (URL and store out of sync).
- **Forgetting to reset page.**

#### Follow-ups to expect (with sample answers)
- **"Why does useSearchParams need Suspense in Next.js?"**
  "In static rendering, search params aren't known at build time; client components using them should be wrapped in Suspense so the rest can prerender."
- **"How do you handle default sort without cluttering URLs?"**
  "Omit params equal to defaults and apply defaults when parsing."
- **"How do you keep filter UI in sync with back/forward?"**
  "Derive the UI from the URL rather than local state, and resync any local input state when params change."

#### What senior interviewers look for
- **Good state placement judgement.**
- **Robust parsing and UX details.**
- **Integration with data fetching.**

#### Practise it
1. Implement useFilters with Zod validation, defaults and push/replace behaviour.
2. Connect it to TanStack Query with keepPreviousData.
3. Explain push vs replace with examples, out loud.

## Managing complex form state and validation
- id: fe-state-05
- roles: frontend, fullstack
- round: STATE_DATA_FETCHING
- difficulty: medium
- levels:
- tags: forms, validation, React Hook Form, Zod, multi-step

### Prompt
Design the state management for a complex form: a multi-step onboarding or checkout flow with dynamic field arrays, conditional sections, async validation (e.g. username availability), autosave of drafts, server-side validation errors, and unsaved-changes warnings. Which tools and patterns would you use?

### Answer
#### What the interviewer is really testing
- Choosing appropriate **form state tools** (React Hook Form, schema validation) and **architecture** for multi-step flows.
- Handling **dynamic arrays, conditional fields, dependent validation**, async checks.
- **Drafts and persistence**, server errors, dirty tracking and navigation guards.
- **Performance, accessibility and UX** (validation timing, error summaries, focus management).

#### Key points
- Use a **form library** (React Hook Form) with **schema validation** (Zod) for type safety and shared client/server rules.
- **Multi-step**: one form state across steps (single `useForm` in a parent or a store), **per-step schemas** for validating only the current step, a final full validation on submit; steps in the URL for back/refresh.
- **Field arrays** (`useFieldArray`) with stable keys (`field.id`) for add/remove/reorder.
- **Conditional fields**: `watch`/`useWatch` the controlling field; **discriminated union schemas** for conditional validation; unregister or clear hidden fields' values.
- **Async validation**: debounced, cancellable checks (username availability) with clear pending states; re-check on the server.
- **Autosave drafts**: debounced persistence to localStorage/IndexedDB or the server (draft endpoint), keyed by user/record; restore on return with a prompt.
- **Server errors**: map field errors with `setError`; general errors in an alert/summary.
- **Dirty tracking**: `formState.isDirty`; warn on navigation (`beforeunload`, router blocking).
- **Accessibility**: labels, error linking, error summary on step submit, focus to step heading on step change, progress indicator.
- Performance: uncontrolled inputs, isolated re-renders via `useWatch`/`Controller`.

#### Model answer
"For a complex flow like a multi-step onboarding with dynamic sections, I'd use React Hook Form for state and Zod for validation, structured so each step validates on its own and the whole form validates at the end, with drafts saved automatically.

**1. Schema design:**
```ts
const company = z.object({
  accountType: z.literal('company'),
  companyName: z.string().min(2, 'Enter your company name'),
  vatNumber: z.string().regex(/^GB\d{9}$/, 'Enter a valid VAT number, like GB123456789').optional(),
});
const individual = z.object({
  accountType: z.literal('individual'),
  dateOfBirth: z.coerce.date().max(new Date(), 'Date of birth must be in the past'),
});

export const stepSchemas = {
  account: z.object({ email: z.string().email('Enter a valid email'), username: z.string().min(3) }),
  details: z.discriminatedUnion('accountType', [company, individual]),     // conditional validation
  team: z.object({
    members: z.array(z.object({ name: z.string().min(1, 'Enter a name'), email: z.string().email(), role: z.enum(['admin', 'member']) }))
      .max(20, 'You can invite up to 20 people'),
  }),
};
export const fullSchema = stepSchemas.account.and(stepSchemas.details).and(stepSchemas.team);
export type OnboardingValues = z.infer<typeof fullSchema>;
```
The same schema is used on the server to validate submissions.

**2. One form, multiple steps:**
```tsx
const STEPS = ['account', 'details', 'team'] as const;

function Onboarding() {
  const methods = useForm<OnboardingValues>({
    mode: 'onTouched',                                   // validate after a field is touched
    defaultValues: loadDraft() ?? { accountType: 'individual', members: [] },
  });
  const [step, setStep] = useStepFromUrl(STEPS);        // step in the URL: refresh/back work
  const headingRef = useRef<HTMLHeadingElement>(null);

  async function next() {
    const fields = Object.keys(stepSchemas[step].shape ?? {}) as (keyof OnboardingValues)[];
    const valid = await methods.trigger(fields);          // validate only this step's fields
    if (!valid) { focusErrorSummary(); return; }
    setStep(STEPS[STEPS.indexOf(step) + 1]);
    headingRef.current?.focus();                          // move focus to the new step heading
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(submit)} noValidate>
        <p>Step {STEPS.indexOf(step) + 1} of {STEPS.length}</p>
        <h2 ref={headingRef} tabIndex={-1}>{titles[step]}</h2>
        <ErrorSummary />
        {step === 'account' && <AccountStep />}
        {step === 'details' && <DetailsStep />}
        {step === 'team' && <TeamStep />}
        <StepNav onNext={next} isLast={step === 'team'} />
      </form>
    </FormProvider>
  );
}
```
(For per-step schemas with discriminated unions, I'd use a resolver per step or validate step values with `safeParse` manually; the idea is the same.)

**3. Conditional sections:**
```tsx
function DetailsStep() {
  const { register } = useFormContext<OnboardingValues>();
  const accountType = useWatch({ name: 'accountType' });   // re-renders only this component
  return (
    <>
      <fieldset>
        <legend>Account type</legend>
        <label><input type="radio" value="individual" {...register('accountType')} /> Individual</label>
        <label><input type="radio" value="company" {...register('accountType')} /> Company</label>
      </fieldset>
      {accountType === 'company' ? <CompanyFields /> : <IndividualFields />}
    </>
  );
}
```
Use `shouldUnregister: true` (or clear values) so hidden fields' values aren't submitted or validated.

**4. Dynamic field arrays:**
```tsx
function TeamStep() {
  const { control, register, formState: { errors } } = useFormContext<OnboardingValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'members' });
  return (
    <>
      {fields.map((field, i) => (
        <fieldset key={field.id}>                         {/* stable id, not index */}
          <legend>Team member {i + 1}</legend>
          <Field label="Name" error={errors.members?.[i]?.name?.message}><input {...register(`members.${i}.name`)} /></Field>
          <Field label="Email" error={errors.members?.[i]?.email?.message}><input type="email" {...register(`members.${i}.email`)} /></Field>
          <button type="button" onClick={() => remove(i)} aria-label={`Remove team member ${i + 1}`}>Remove</button>
        </fieldset>
      ))}
      <button type="button" onClick={() => append({ name: '', email: '', role: 'member' })}>Add team member</button>
    </>
  );
}
```

**5. Async validation (username availability):**
```tsx
const usernameAvailable = async (value: string) => {
  if (value.length < 3) return true;                      // let the schema handle length
  const res = await fetch(`/api/username-available?${new URLSearchParams({ u: value })}`);
  const { available } = await res.json();
  return available || 'That username is taken';
};
<input {...register('username', { validate: debounceAsync(usernameAvailable, 400) })} />
```
Debounce and cancel stale checks, show 'Checking…', and always re-check on the server at submit (availability can change).

**6. Autosave drafts:**
```tsx
const values = useWatch({ control: methods.control });
const debouncedValues = useDebouncedValue(values, 1000);
useEffect(() => { saveDraft(debouncedValues); }, [debouncedValues]);   // localStorage/IndexedDB or a draft API
```
Key drafts by user (and record), exclude sensitive fields (passwords, card numbers), version them for schema changes, and on return ask 'Continue where you left off?'. Server-side drafts let users continue on another device.

**7. Server-side errors:**
```ts
async function submit(values: OnboardingValues) {
  const res = await api.completeOnboarding(values);
  if (res.status === 422) {
    Object.entries(res.body.errors).forEach(([field, message]) => methods.setError(field as any, { message }));
    jumpToStepContaining(Object.keys(res.body.errors)[0]);
    return;
  }
  clearDraft();
  router.push('/welcome');
}
```

**8. Unsaved changes:**
```tsx
const { isDirty, isSubmitSuccessful } = methods.formState;
useEffect(() => {
  if (!isDirty || isSubmitSuccessful) return;
  const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [isDirty, isSubmitSuccessful]);
```
Plus in-app navigation blocking (router-specific APIs) with a confirmation dialog. With autosave, the warning can be softer ('Your progress is saved').

**Accessibility and UX:** visible labels, errors linked with `aria-describedby`, an error summary focused on failed step submission, focus moved to each step's heading, a progress indicator, the ability to go back without losing data, and no validation while typing until a field has been touched."

#### Another worked example: a mortgage application form
"A 9-step mortgage application had separate component state per step, so going back lost data, and validation rules differed between client and server. We consolidated into one React Hook Form instance with per-step Zod schemas shared with the backend, step numbers in the URL, server-side drafts every 2 seconds of inactivity, and an error summary per step. Completion rate rose by 14%, and support tickets about 'lost my application' disappeared."

#### A third worked example: hidden fields causing validation failures
"Users choosing 'individual' couldn't submit because hidden company fields (from a previous selection) still failed validation. Using a discriminated union schema and unregistering hidden fields fixed it; we added tests switching account types back and forth."

#### Variations you might be asked
- "Would you use a state machine?": for flows with complex branching and side effects (XState), a machine makes transitions explicit; the form library still manages field values.
- "How do you handle file uploads in multi-step forms?": upload immediately to temporary storage and keep references (IDs) in form state.
- "How do you test multi-step forms?": component tests per step, plus E2E covering the full journey, back navigation, validation errors and draft restoration.

#### Step-by-step framework
1. **Schema design** (per step, conditional unions, shared with server).
2. **Single form across steps**, step in URL, per-step validation.
3. **Conditional fields and arrays.**
4. **Async validation.**
5. **Autosave drafts and server errors.**
6. **Unsaved changes, accessibility, UX.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Separate state per step (data lost going back) | One form state, step in URL |
| Validation duplicated client/server | Shared Zod schemas |
| Index keys for arrays | useFieldArray with field.id |
| Hidden fields still validated | Discriminated unions, unregister |
| No drafts or warnings | Debounced autosave, dirty guards |

#### Useful phrases
- "One form instance spans all steps; each step validates only its own fields."
- "The schema is shared with the server, so rules can't drift."
- "Hidden conditional fields are unregistered so they don't block submission."
- "Drafts autosave quietly, and we never store passwords or card numbers in them."

#### Common pitfalls
- **Losing data between steps.**
- **Async validation races.**
- **Persisting sensitive data in drafts.**
- **No focus management between steps.**

#### Follow-ups to expect (with sample answers)
- **"How do you keep re-renders down in big forms?"**
  "Uncontrolled inputs with React Hook Form, useWatch scoped to specific fields, and splitting sections into components."
- **"Where do you store the current step?"**
  "In the URL (so refresh and back work), validated so users can't skip to steps they haven't completed."
- **"How do you handle schema changes for saved drafts?"**
  "Version drafts; migrate or discard incompatible versions on load."

#### What senior interviewers look for
- **Architecture for complex forms.**
- **Validation consistency.**
- **User-centred resilience** (drafts, errors, accessibility).

#### Practise it
1. Build a three-step form with per-step validation and step in the URL.
2. Add a dynamic field array and conditional section with a discriminated union.
3. Explain your draft autosave design, out loud.

## Offline-first and syncing local changes to the server
- id: fe-state-06
- roles: frontend, fullstack
- round: STATE_DATA_FETCHING
- difficulty: hard
- levels: senior, staff
- tags: offline-first, sync, IndexedDB, conflict resolution, PWA

### Prompt
Design an offline-first web app (e.g. a notes or field-inspection app) where users can read and edit data without a connection and changes sync when they're back online. Cover local storage, the outbox pattern, sync triggers, conflict resolution, idempotency, schema migrations, and the UX of sync status.

### Answer
#### What the interviewer is really testing
- Architecture where the **local database is the primary source for the UI**, with **background sync** to the server.
- The **outbox pattern** for queued mutations, with **ordering, retries and idempotency**.
- **Conflict resolution** strategies (last-write-wins, field-level merge, version checks, CRDTs).
- **Pulling changes** (delta sync), **migrations**, **storage limits**, **security** on shared devices.
- **UX**: sync status, pending changes, conflicts, offline indicators.

#### Key points
- **Local-first data**: store data in **IndexedDB** (via Dexie/idb) and render from it; the app works identically online and offline.
- **App shell** cached by a **service worker** so the app loads offline.
- **Writes** go to the local DB immediately (optimistic) **and** to an **outbox** table of pending operations.
- A **sync engine** pushes outbox items in order when online (triggers: `online` event, app start, interval, Background Sync API where supported), with **exponential backoff** and **idempotency keys** so retries don't duplicate.
- **Pull** server changes with **delta sync** (`updatedSince` cursor/server change log), merge into local DB.
- **Conflicts**: version numbers/`updatedAt` with **optimistic concurrency** on the server; strategies: last-write-wins, field-level merge, keep both and ask the user, or **CRDTs** for collaborative text.
- **Deletes** as tombstones so they propagate.
- **Schema versioning/migrations** for local DB.
- **Storage**: request persistent storage; handle quota; clear data on logout (shared devices).
- **UX**: online/offline indicator, "3 changes pending", per-item sync state, conflict resolution UI, never silently lose data.

#### Model answer
"In an offline-first app, the UI always reads and writes a local database, and a background sync engine reconciles it with the server. The network becomes an optimisation rather than a requirement.

**Architecture:**
```
UI (React) ──reads/writes──► Local DB (IndexedDB via Dexie)
                                 │  ├── tables: notes, inspections, photos
                                 │  └── outbox: pending operations
                                 ▼
                         Sync engine (in app / service worker)
                                 │  push outbox (ordered, idempotent)
                                 │  pull deltas (since cursor)
                                 ▼
                              Server API (versioned records, change log)
```
Plus a **service worker** caching the app shell and static assets so the app opens without a connection.

**1. Local data and reactive UI:**
```ts
// db.ts
export const db = new Dexie('fieldApp') as Dexie & {
  inspections: Table<Inspection, string>;
  outbox: Table<OutboxItem, number>;
  meta: Table<{ key: string; value: string }, string>;
};
db.version(2).stores({
  inspections: 'id, siteId, updatedAt, syncState',
  outbox: '++seq, entityId, createdAt',
  meta: 'key',
}).upgrade((tx) => tx.table('inspections').toCollection().modify((i) => { i.syncState ??= 'synced'; }));
```
```tsx
const inspections = useLiveQuery(() => db.inspections.where('siteId').equals(siteId).toArray(), [siteId]);
```
The UI renders from IndexedDB reactively, regardless of connectivity.

**2. Writes: local first plus outbox (in one transaction):**
```ts
async function updateInspection(id: string, changes: Partial<Inspection>) {
  await db.transaction('rw', db.inspections, db.outbox, async () => {
    const current = await db.inspections.get(id);
    await db.inspections.update(id, { ...changes, updatedAt: Date.now(), syncState: 'pending' });
    await db.outbox.add({
      op: 'update',
      entityId: id,
      changes,
      baseVersion: current!.version,            // for conflict detection on the server
      idempotencyKey: crypto.randomUUID(),
      createdAt: Date.now(),
    });
  });
  syncSoon();
}
```
Writing the record and the outbox entry in the same transaction guarantees we never update locally without queueing the change (or vice versa).

**3. Push: processing the outbox:**
```ts
async function pushOutbox() {
  const items = await db.outbox.orderBy('seq').toArray();          // preserve order
  for (const item of items) {
    const res = await fetch(`/api/inspections/${item.entityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': item.idempotencyKey },
      body: JSON.stringify({ changes: item.changes, baseVersion: item.baseVersion }),
    });
    if (res.status === 409) { await recordConflict(item, await res.json()); continue; }
    if (!res.ok) throw new Error(`push failed: ${res.status}`);      // stop; retry later with backoff
    const saved = await res.json();
    await db.transaction('rw', db.inspections, db.outbox, async () => {
      await db.inspections.update(item.entityId, { version: saved.version, syncState: 'synced' });
      await db.outbox.delete(item.seq!);
    });
  }
}
```
- **Ordering** matters (create before update before delete for the same entity); process sequentially or per entity.
- **Idempotency keys** let the server recognise retried requests (e.g. when the response was lost after the server applied the change), preventing duplicates.
- **Retries** with exponential backoff and jitter; stop on persistent errors and surface them.
- **Compaction**: merge multiple pending updates to the same entity into one before sending.

**4. Sync triggers:** app start, `online` events, periodic intervals while open, after local writes (debounced), visibility change (tab focus), and the **Background Sync API** (service worker `sync` event) where supported (Chromium), so queued changes send even after the tab closes.

**5. Pull: getting server changes (delta sync):**
```ts
async function pullChanges() {
  const cursor = (await db.meta.get('cursor'))?.value ?? '0';
  const res = await fetch(`/api/changes?since=${cursor}`);       // server change log
  const { changes, nextCursor } = await res.json();
  await db.transaction('rw', db.inspections, db.meta, async () => {
    for (const change of changes) {
      const local = await db.inspections.get(change.id);
      if (local?.syncState === 'pending') { await markPotentialConflict(local, change); continue; }   // don't overwrite unsynced edits
      change.deleted ? await db.inspections.delete(change.id) : await db.inspections.put({ ...change, syncState: 'synced' });
    }
    await db.meta.put({ key: 'cursor', value: nextCursor });
  });
}
```
Deletes are represented as **tombstones** in the change log so other devices learn about them.

**6. Conflict resolution:** a conflict happens when the same record changed on the server (by another device/user) while local edits were pending.
| Strategy | How | Good for |
|---|---|---|
| Last-write-wins | Latest timestamp/version overwrites | Low-stakes data; simple but can lose edits |
| Field-level merge | Merge non-overlapping field changes; conflict only if same field changed | Forms, records with independent fields |
| Server rejects (409) + user resolves | Show both versions, user picks or merges | Important data (inspections, medical, financial) |
| CRDTs (Yjs, Automerge) | Data structures that merge automatically | Collaborative text, lists, real-time co-editing |
The server uses **optimistic concurrency**: updates include `baseVersion`; if the current version differs, return 409 with the server version. I'd avoid relying on client clocks for ordering (they're unreliable); use server versions.

**7. Files and large data:** photos stored locally as Blobs in IndexedDB, uploaded separately (resumable/chunked uploads), with records referencing upload IDs; show per-file progress.

**8. Storage, security and migrations:**
- Request **persistent storage** (`navigator.storage.persist()`) and monitor quota (`estimate()`); handle quota errors gracefully.
- **Version the local schema** and write migrations (as with Dexie versions).
- On **logout**, especially on shared devices, delete local databases and caches; consider encrypting sensitive local data.
- Keep auth tokens refreshable; queued requests may need new tokens when connectivity returns.

**9. UX of sync:**
- Clear **online/offline indicator**.
- Global 'All changes saved' vs '3 changes waiting to sync'.
- Per-item status (synced, pending, failed, conflict).
- Conflict resolution UI showing differences.
- Never silently discard user changes; failed items stay visible with retry.

**When not to go offline-first:** apps where data must be strictly real-time and consistent (trading, payments), or where offline use isn't needed; it's a significant complexity investment."

#### Another worked example: field inspections in basements
"Building inspectors worked in basements without signal and lost reports when the online-only app timed out. We rebuilt it offline-first: Dexie for inspections and photos, an outbox synced via Background Sync and on reconnect, idempotency keys on all writes, field-level merges with a conflict screen for checklist items edited by two inspectors. Over the next quarter, lost-report incidents went to zero and average report completion time dropped by 30% because inspectors no longer re-entered data."

#### A third worked example: duplicate records from retries
"An early version created duplicate notes when the network dropped after the server saved a note but before the response arrived; the client retried and the server created another. Adding client-generated IDs (UUIDs) for new records and idempotency keys for operations made retries safe: the server returned the existing note for a repeated create."

#### Variations you might be asked
- "Would you use a sync framework?": options like Replicache, ElectricSQL, PowerSync, RxDB, or Firebase/Firestore offline persistence provide sync engines; building your own makes sense only for specific needs.
- "How do you test offline behaviour?": DevTools offline mode and throttling, Playwright's `context.setOffline(true)`, tests that simulate lost responses and conflicts.
- "How do you order operations across entities with dependencies?": keep a single global outbox sequence, or dependency-aware queues (e.g. create parent before child).

#### Step-by-step framework
1. **Local-first architecture** with IndexedDB and service worker.
2. **Writes to local DB + outbox** in one transaction.
3. **Push** with ordering, retries, idempotency.
4. **Pull** with delta sync and tombstones.
5. **Conflict resolution strategy** per data type.
6. **Storage, security, migrations and sync UX.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Cache API responses for offline" | Local DB as primary UI source |
| Retries without idempotency | Idempotency keys, client IDs |
| Ignores conflicts | Versioned optimistic concurrency, strategies |
| Overwrites pending local edits on pull | Protects unsynced changes |
| No sync UX | Pending/failed/conflict states visible |

#### Useful phrases
- "The UI always reads from the local database; the network syncs in the background."
- "The record update and the outbox entry are written in one transaction."
- "Idempotency keys make retries safe when responses get lost."
- "For important data, conflicts are shown to the user rather than silently overwritten."

#### Common pitfalls
- **Last-write-wins losing edits** unexpectedly.
- **Client clocks for ordering.**
- **Not clearing local data on logout.**
- **No migration plan** for local schemas.

#### Follow-ups to expect (with sample answers)
- **"What's a tombstone?"**
  "A record marking that an entity was deleted, kept in the change log so other clients delete it too."
- **"Why not just use localStorage?"**
  "It's synchronous, small, string-only and blocks the main thread; IndexedDB handles large structured data and transactions."
- **"How do CRDTs avoid conflicts?"**
  "They're data types designed so concurrent operations commute: replicas applying the same set of operations in any order converge to the same state."

#### What senior interviewers look for
- **Robust sync architecture.**
- **Data integrity thinking.**
- **Thoughtful UX for uncertainty.**

#### Practise it
1. Build a small Dexie notes app with an outbox and push/pull sync.
2. Simulate a lost response and prove idempotency prevents duplicates.
3. Explain your conflict resolution choice for a given data type, out loud.
