# Frontend Engineer — Testing

## Frontend testing strategy: the pyramid and the trophy
- id: fe-test-01
- roles: frontend, fullstack
- round: TESTING
- difficulty: medium
- levels:
- tags: testing, strategy, test pyramid, testing trophy, unit, integration, e2e

### Prompt
How do you decide what to test in a frontend application, and at which level? Explain the test pyramid and the testing trophy, the trade-offs between unit, integration and end-to-end tests, and describe the testing strategy you'd set up for a new React app.

### Answer
#### What the interviewer is really testing
- Whether you think of tests as **buying confidence per unit of cost** (writing, running, maintaining, debugging flakes), not as a coverage number.
- Knowing the **models**: Mike Cohn's test pyramid, Kent C. Dodds's testing trophy (static → unit → integration → E2E), and why frontend often shifts weight towards integration.
- Being able to say **what belongs where**: pure logic in unit tests, user flows through components in integration tests, a few critical journeys in E2E, and contract or visual tests where they pay off.
- Practical concerns: **speed, flakiness, CI time, mocking boundaries, test data**, and ownership.

#### Key points
- **The pyramid:** many fast unit tests at the bottom, fewer integration tests, very few slow E2E tests on top. The reasoning is cost and speed: lower tests are cheap and precise; higher ones are slow and brittle.
- **The trophy:** static analysis at the base (TypeScript, ESLint), a modest layer of unit tests, the **largest layer of integration tests**, and a small E2E cap. The argument: "The more your tests resemble the way your software is used, the more confidence they can give you." In UI code, much of the risk sits in how components, state and data fetching work together, which isolated unit tests miss.
- **Confidence vs cost:** E2E tests give the most confidence per test but are slow and flaky; unit tests are fast but can pass while the feature is broken. Integration tests with a mocked network (MSW) are often the sweet spot for frontend.
- **What goes where:**
  - **Static:** TypeScript strict mode, ESLint (including `jsx-a11y`, hooks rules). Catches whole classes of bugs for free.
  - **Unit:** pure functions, reducers, formatters, validation, custom hooks with complex logic, utility libraries.
  - **Integration (component):** render a feature (a form, a page section) with React Testing Library, real child components, real state management, and the network mocked at the HTTP layer. Assert on what the user sees.
  - **E2E:** a handful of critical journeys (sign up, checkout, core create/edit flow) against a deployed environment with Playwright.
  - **Others when justified:** visual regression for design systems, contract tests for API boundaries, accessibility checks (axe), performance budgets.
- **Don't test implementation details**: internal state, private functions, component instance methods. Those tests break on refactors without catching bugs.
- **Coverage** is a smell detector, not a target. 100% coverage of trivial code is worth less than 70% coverage that exercises real behaviour.
- **Flakiness is a bug.** Quarantine and fix flaky tests quickly, or the team learns to ignore red builds.

#### Model answer
"I think of tests as an investment in confidence, and each type has a different cost: time to write, time to run, how often it breaks for reasons that aren't bugs, and how quickly it tells you what's wrong.

The classic **test pyramid** says to have lots of unit tests, fewer integration tests and very few end-to-end tests, because unit tests are cheap and fast. For frontend I lean towards the **testing trophy** instead: a strong static layer with TypeScript and ESLint, some unit tests, the most investment in integration tests, and a small number of E2E tests. The reason is where the bugs are. In a React app, a `formatPrice` function rarely breaks. What breaks is the form that doesn't disable the submit button while saving, or the list that doesn't refresh after a mutation, which sit between components, state and the network.

For a new React app, my strategy would be:
- **Static:** TypeScript strict, ESLint with the hooks and `jsx-a11y` plugins, run in the editor and in CI.
- **Unit tests with Vitest** for pure logic: pricing rules, date handling, validation schemas, reducers and complex custom hooks.
- **Integration tests with React Testing Library and MSW** as the main layer. I render a whole feature, like the checkout form, with its real children and real providers, mock the network at the HTTP level with MSW, and test it the way a user would: type into fields by their label, click buttons by their role, and assert on visible text. These run in milliseconds in jsdom and survive refactors.
- **E2E tests with Playwright** for five to ten critical journeys only: sign-in, checkout, the core create-and-edit flow. They run against a preview deployment on each PR and production after deploy, with seeded test data.
- **Extras where they pay off:** Storybook plus visual regression for the design system, axe checks in component tests, and contract tests or generated types if the API is owned by another team.

Operationally: tests run in parallel in CI in under ten minutes, flaky tests are quarantined and fixed within days, and coverage is reported but not gated, except maybe on critical modules like payments."

#### Another worked example
**Inheriting an app with 2,000 brittle tests and frequent production bugs.**

The audit showed:
```
1,600 shallow-rendered unit tests (Enzyme) asserting state and props
  → broke on every refactor, never caught a real bug in 6 months
350 Cypress E2E tests, 18% flaky, 45-minute CI run
50 integration tests
Production bugs: mostly data-flow issues between components and APIs
```
The plan, over two quarters:
1. Deleted shallow tests that only asserted implementation details as their features were touched (about 1,100 removed).
2. Added RTL + MSW integration tests per feature, focused on user-visible behaviour (about 300 written, 2 to 4 minutes total).
3. Cut E2E to 25 critical journeys and made them reliable: stable test IDs only where roles weren't possible, seeded data via API, no fixed waits.
4. Turned on TypeScript strict mode, which surfaced 40 latent null bugs.

CI went from 45 minutes to 11. Escaped production bugs fell by about 60% over the next two quarters, and engineers started trusting red builds again.

#### A third worked example
**A design-system team.** Their product is components, not flows. Their mix was different: unit and interaction tests per component (keyboard behaviour, ARIA states), **visual regression** with Storybook and Chromatic across themes and viewports, and automated axe checks on every story. E2E barely mattered. The point I make in interviews: **the right shape depends on where the risk is**, not on a diagram.

#### Step-by-step framework
1. **Identify risks**: where have bugs come from, and what would hurt users or revenue most?
2. **Static first**: TypeScript strict, ESLint, formatting. Cheapest bugs to catch.
3. **Integration as the backbone** for UI features, with the network mocked at the HTTP layer.
4. **Unit tests** for complex pure logic.
5. **A thin E2E layer** for critical journeys, run against real environments.
6. **Specialised tests** where needed: visual, accessibility, contract, performance.
7. **Run fast in CI**: parallel, sharded, affected-only where possible.
8. **Maintain health**: flaky-test quarantine, deletion of low-value tests, coverage as a signal.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Aim for 100% coverage" | Treats coverage as a signal; aims for confidence |
| Only unit tests, mocking every child | Integration tests that render real children with a mocked network |
| Hundreds of E2E tests | A few critical journeys, reliable and fast |
| Tests internal state | Tests what the user sees and does |
| Ignores flakiness | Quarantines and fixes flaky tests quickly |

#### Useful phrases
- "Tests buy confidence; I want the most confidence per minute of maintenance."
- "The more a test resembles how the software is used, the more it can tell me."
- "Mock at the network boundary, not at the component boundary."
- "A flaky test is a bug, either in the test or in the app."
- "The shape depends on where the risk is."

#### Common pitfalls
- **Over-mocking**: mocking child components, hooks and fetch so thoroughly that tests verify the mocks, not the app.
- **Snapshot tests** of large trees that people update without reading.
- **E2E for everything**, leading to slow, flaky pipelines.
- **Testing implementation details**: state names, CSS classes, internal methods.
- No **test data strategy** for E2E, so tests depend on each other or on shared staging data.
- Treating the pyramid or trophy as **dogma** rather than a starting point.

#### Follow-ups to expect (with sample answers)
- **"How do you decide if something needs an E2E test?"** — "If it breaking would cost real money or trust, it crosses many systems, and lower-level tests can't cover the integration. Sign-in, payments and the core workflow, typically."
- **"What do you do with a flaky test?"** — "Quarantine it so it doesn't block merges, open a ticket with an owner, and fix the root cause: usually a race (waiting for a fixed time instead of a condition), shared state between tests, or real non-determinism like time or random data."
- **"Are snapshot tests useful?"** — "Small, focused snapshots of serialised output, like a generated config, can be. Large component snapshots usually aren't, because they're noisy and get rubber-stamped."
- **"How do you test custom hooks?"** — "If the logic is complex, with `renderHook` in isolation. Otherwise through the component that uses them, which is more realistic."
- **"How do you keep CI fast as tests grow?"** — "Parallelise and shard, run only affected tests on PRs (Nx or Turborepo), cache dependencies, and keep E2E small."

#### What senior interviewers look for
- **Risk-based** reasoning instead of a fixed formula.
- Experience **changing a team's testing culture**: deleting tests, fixing flakiness, CI speed.
- Understanding of **cost of ownership**, not just cost of writing.
- Clear opinions with trade-offs, such as when unit tests or E2E tests are the right call.

#### Practise it
- Take a feature you built and list which tests you'd write at each level, and why.
- Find one test in your codebase that tests implementation details and rewrite it to test behaviour.
- Explain the pyramid versus the trophy in 60 seconds.

#### Variations you might be asked
- "What's your testing philosophy?"
- "How would you improve testing on a team where CI takes an hour?"
- "Unit tests vs integration tests: which matter more for a React app?"

## React Testing Library: philosophy and good tests
- id: fe-test-02
- roles: frontend, fullstack
- round: TESTING
- difficulty: medium
- levels:
- tags: testing, React Testing Library, jest, vitest, queries, user-event

### Prompt
Explain the philosophy behind React Testing Library. How do you choose queries, simulate user interactions and handle asynchronous updates? Walk through writing a good test for a component, and point out common mistakes.

### Answer
#### What the interviewer is really testing
- Understanding the guiding principle: **test the component the way a user uses it**, not its internals.
- Knowing the **query priority**: `getByRole` (with accessible name) first, then `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`, `getByAltText`, `getByTitle`, and `getByTestId` last.
- Knowing **`getBy` vs `queryBy` vs `findBy`**, and when to use each.
- Using **`@testing-library/user-event`** instead of `fireEvent`, and its async API.
- Handling **async** correctly: `findBy*`, `waitFor`, avoiding `act` warnings, not adding fixed waits.
- Mocking at the right layer, usually with **MSW**.

#### Key points
- **Philosophy:** "The more your tests resemble the way your software is used, the more confidence they can give you." RTL gives you DOM queries only, with no access to component state, props or instances. That pushes you towards behaviour, and towards accessible markup.
- **Query priority:**
  1. `getByRole('button', { name: /save/i })`: matches how assistive technology sees the page, and checks accessibility as a side effect.
  2. `getByLabelText('Email')`: for form fields.
  3. `getByPlaceholderText`, `getByText`, `getByDisplayValue`.
  4. `getByAltText`, `getByTitle`.
  5. `getByTestId`: a last resort when there's no user-facing handle.
- **Query variants:**
  - `getBy*`: throws if not found; use for things that should be there now.
  - `queryBy*`: returns `null`; use **only** to assert something is absent.
  - `findBy*`: returns a promise and retries until found (default 1 second); use for things that appear asynchronously.
  - `*AllBy*` versions return arrays.
- **`user-event`** simulates full interactions (pointer events, focus, keydown/keypress/input/keyup, selection), unlike `fireEvent`, which dispatches a single event. Use `const user = userEvent.setup()` and `await user.click(...)`, `await user.type(...)`.
- **Async:** prefer `await screen.findByText(...)`. Use `waitFor` for assertions that need retrying, with **one assertion inside** and no side effects in the callback. Never use `setTimeout` sleeps.
- **`act` warnings** usually mean a state update happened after the test finished or outside RTL's helpers; the fix is usually awaiting the right `findBy` or mocking timers properly, not wrapping things in `act` manually.
- Use **`screen`** rather than destructuring render's result; use **`jest-dom`** matchers (`toBeInTheDocument`, `toBeDisabled`, `toHaveValue`, `toHaveAccessibleName`).
- **Mock the network, not the hooks**: MSW intercepts `fetch` so your real data-fetching code (TanStack Query, SWR) runs in tests.

#### Model answer
"React Testing Library's philosophy is that tests should interact with a component the way a user does: find things by what they see or hear, interact with them, and check the visible result. It deliberately doesn't give you the component's state or instance, so tests survive refactors and fail only when behaviour breaks.

For queries I follow the priority order. `getByRole` with a name is my default, like `getByRole('button', { name: /place order/i })`, because it's how screen readers find elements, so the test also proves the button is accessible. For form fields, `getByLabelText`. `getByText` for non-interactive content, and `getByTestId` only when nothing user-facing works, like a canvas chart.

I use `getBy` when the element should already be there, `queryBy` only for asserting absence, like `expect(screen.queryByRole('alert')).not.toBeInTheDocument()`, and `findBy` for elements that appear after something asynchronous. For interactions, I use `user-event` rather than `fireEvent`, because `user.type` fires focus, key and input events like a real user, so things like `onKeyDown` handlers and validation on blur actually run.

For a login form, a good test reads like a user story:

```tsx
test('shows an error when credentials are wrong', async () => {
  server.use(
    http.post('/api/login', () =>
      HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 }),
    ),
  );
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText(/email/i), 'ana@example.com');
  await user.type(screen.getByLabelText(/password/i), 'wrong');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i);
  expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
});
```

The network is mocked with MSW, so the component's real fetch logic runs. There are no fixed waits: `findByRole` retries until the alert appears. And nothing in the test knows whether the form uses `useState`, React Hook Form or a reducer."

#### Another worked example
**Rewriting an implementation-detail test.**

Before (brittle, Enzyme-style thinking):
```tsx
const { container } = render(<Todo />);
fireEvent.change(container.querySelector('.todo-input')!, { target: { value: 'Milk' } });
fireEvent.click(container.querySelector('.add-btn')!);
expect(container.querySelectorAll('.todo-item').length).toBe(1);
```
After (behavioural):
```tsx
const user = userEvent.setup();
render(<Todo />);
await user.type(screen.getByRole('textbox', { name: /new todo/i }), 'Milk{Enter}');
const list = screen.getByRole('list', { name: /todos/i });
expect(within(list).getAllByRole('listitem')).toHaveLength(1);
expect(within(list).getByText('Milk')).toBeInTheDocument();
```
The second version survives renaming CSS classes, works if Enter submits instead of a button click, and fails if the input loses its label, which is a real accessibility bug. When the team first switched, a handful of components couldn't be queried by role or label, and every one of them turned out to be inaccessible to screen readers.

#### A third worked example
**Testing a debounced search with fake timers.**
```tsx
vi.useFakeTimers({ shouldAdvanceTime: true });
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
render(<SearchUsers />);
await user.type(screen.getByRole('searchbox', { name: /search users/i }), 'ana');
vi.advanceTimersByTime(300);
expect(await screen.findByRole('option', { name: /ana lopez/i })).toBeInTheDocument();
```
Key details: `user-event` must be told about fake timers (`advanceTimers`), otherwise it waits on real timers and the test hangs. MSW returns the matching users, and the assertion is on the visible option, not on how many times the fetch function ran.

#### Step-by-step framework
1. **Write the scenario as a user story**: given, when, then.
2. **Set up the network** with MSW handlers (default handlers plus per-test overrides).
3. **Render with real providers** using a custom `render` that wraps the router, query client and theme.
4. **Query by role and name** first; fall back down the priority list.
5. **Interact with `user-event`**, awaiting each action.
6. **Assert on visible outcomes** with `jest-dom` matchers; use `findBy` for async results.
7. **Cover the important states**: loading, success, empty, error, disabled.
8. **Keep tests independent**: reset MSW handlers and use a fresh QueryClient per test.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| `container.querySelector('.btn')` | `screen.getByRole('button', { name: /save/i })` |
| `fireEvent.change` for typing | `await user.type(...)` with `userEvent.setup()` |
| `await new Promise(r => setTimeout(r, 500))` | `await screen.findBy...` |
| Mocks `useQuery` or the API module | Mocks HTTP with MSW so real fetching code runs |
| Asserts on state or props | Asserts on what the user sees |

#### Useful phrases
- "If I can't find it by role or label, a screen reader user probably can't either."
- "`queryBy` is only for asserting that something isn't there."
- "No sleeps: wait for a condition, not for time."
- "Mock the network, not the component tree."

#### Common pitfalls
- Using **`getByTestId` everywhere**, losing the accessibility benefit.
- **Several assertions or side effects inside `waitFor`**, which slows tests and hides failures.
- Wrapping things in **`act` manually** to silence warnings instead of awaiting the right thing.
- A **shared QueryClient** between tests, so cached data leaks across tests (also disable retries in tests).
- Forgetting to **`await` user-event** calls (v14 is async).
- Testing **third-party library behaviour** instead of your own.

#### Follow-ups to expect (with sample answers)
- **"Why `user-event` over `fireEvent`?"** — "`fireEvent.click` dispatches one click event. A real click involves pointerdown, mousedown, focus, pointerup, mouseup and click, and `user-event` fires all of them, respecting disabled elements and pointer-events. It catches bugs `fireEvent` misses."
- **"What causes the `act` warning?"** — "A state update RTL didn't know to wait for, often an async effect that resolves after the test's last assertion. The fix is to await the resulting UI with `findBy`, or make sure the test waits for loading to finish."
- **"How do you test a component that uses React Query?"** — "Wrap it in a fresh `QueryClientProvider` per test with retries off, and mock the HTTP calls with MSW. Don't mock `useQuery` itself."
- **"When is `getByTestId` acceptable?"** — "When there's no accessible handle and adding one wouldn't make sense for users, like a specific canvas or a decorative container you need to measure."
- **"How do you test accessibility in RTL?"** — "Role-based queries already enforce a lot. Add `jest-axe` for automated checks, and test keyboard behaviour with `user.tab()` and `user.keyboard('{Escape}')`."

#### What senior interviewers look for
- Tests that are **readable as specifications** of behaviour.
- **Accessibility awareness** through the choice of queries.
- Correct handling of **async and timers** without flakiness.
- A team-level setup: custom render, MSW defaults, lint rules (`eslint-plugin-testing-library`).

#### Practise it
- Write a test for a form with validation errors using only role and label queries.
- Take a test using `fireEvent` and `getByTestId` and rewrite it in RTL best practice.
- Explain `getBy`, `queryBy` and `findBy` in 30 seconds.

#### Variations you might be asked
- "How do you test a modal dialog?"
- "How do you test a component that depends on context or the router?"
- "Enzyme vs React Testing Library: what changed and why?"

## Mocking the network with MSW
- id: fe-test-03
- roles: frontend, fullstack
- round: TESTING
- difficulty: medium
- levels:
- tags: testing, MSW, mocking, fetch, integration tests, storybook

### Prompt
How do you mock network requests in frontend tests? Explain how Mock Service Worker (MSW) works, why it's often preferred over mocking `fetch` or your API module, and how you would set it up for a React app's tests, Storybook and local development.

### Answer
#### What the interviewer is really testing
- Whether you know **where to put the seam** when mocking: at the network boundary, not inside your own code.
- Understanding of **how MSW intercepts requests**: a Service Worker in the browser, and request interception (via `@mswjs/interceptors`) in Node.
- Practical setup: **default handlers, per-test overrides, `resetHandlers`, `onUnhandledRequest: 'error'`**.
- Testing the **unhappy paths**: errors, slow responses, empty lists, network failures.
- Awareness of the **trade-off**: mocks can drift from the real API, so you need contract checks or generated types.

#### Key points
- **Three places to mock**, from worst to best for most tests:
  1. **Mock the hook or module** (`vi.mock('./useOrders')`): fast, but your data-fetching code never runs, so caching, error handling and parsing go untested.
  2. **Mock `fetch` globally** (`vi.spyOn(global, 'fetch')`): your code runs, but you hand-build `Response` objects, it breaks if you switch to axios, and matching requests is messy.
  3. **Intercept at the network level with MSW**: your real `fetch`/axios/TanStack Query code runs unchanged; handlers describe the API declaratively.
- **How MSW works:**
  - **Browser** (`setupWorker`): registers a Service Worker that intercepts `fetch` events and asks the page which handler matches. Requests show in the Network tab.
  - **Node** (`setupServer`): patches Node's `http`, `https`, `XMLHttpRequest` and global `fetch` in-process. No real server or port.
- **Handlers** (MSW v2 syntax): `http.get('/api/orders', () => HttpResponse.json([...]))`. Also `graphql.query('GetUser', ...)`, and WebSocket support in newer versions.
- **Lifecycle in tests:** `server.listen({ onUnhandledRequest: 'error' })` in `beforeAll`, `server.resetHandlers()` in `afterEach`, `server.close()` in `afterAll`. Override per test with `server.use(...)`.
- **One set of handlers, reused everywhere:** unit and integration tests, Storybook (via `msw-storybook-addon`), local development before the backend exists, and demos.
- **Scenarios to cover:** success, empty, 4xx validation errors, 500, network error (`HttpResponse.error()`), slow responses (`await delay(2000)`), and pagination.
- **Drift risk:** keep handlers typed from the OpenAPI schema or generated client, or use contract tests (Pact) or a schema validator so mocks match the real API.

#### Model answer
"I mock at the network boundary, and MSW is my default tool for it. The principle is that the code I own, including my fetch wrapper, React Query hooks, response parsing and error handling, should run for real in tests. Only the thing I don't own, the server, gets replaced.

If I mock the hook instead, the test passes even when my query key is wrong or my error handling is broken. If I mock `fetch` directly, I'm hand-building `Response` objects and coupling the test to the HTTP library. MSW sits below all of that.

In Node, `setupServer` patches the request modules in-process, so when my component calls `fetch('/api/orders')`, MSW matches it against my handlers and returns a response. In the browser, `setupWorker` registers a real Service Worker, so the same handlers work in Storybook and local development, and requests appear in DevTools.

My setup is a `handlers.ts` file with happy-path responses for every endpoint, and a test setup file:

```ts
// test/setup.ts
import { server } from './server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` is important: if a component calls an endpoint I didn't mock, the test fails loudly instead of hitting the real network or hanging.

Then individual tests override just what they need:

```tsx
test('shows a retry button when orders fail to load', async () => {
  server.use(
    http.get('/api/orders', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
  );
  const user = userEvent.setup();
  renderWithProviders(<OrdersPage />);

  expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load orders/i);
  server.resetHandlers(); // back to the happy path
  await user.click(screen.getByRole('button', { name: /retry/i }));
  expect(await screen.findByRole('row', { name: /order #1001/i })).toBeInTheDocument();
});
```

This exercises the real retry flow end to end inside the component. The main risk with any mock is drift from the real API, so I type the handlers from our OpenAPI-generated types, which means a changed response shape breaks the build, and we rely on a small set of E2E tests against a real backend to catch anything else."

#### Another worked example
**Asserting on what was sent, not just what came back.** For a checkout form, you want to verify the request body without mocking internals:

```ts
test('sends the selected shipping method', async () => {
  let body: unknown;
  server.use(
    http.post('/api/checkout', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ orderId: 'A1' }, { status: 201 });
    }),
  );
  const user = userEvent.setup();
  renderWithProviders(<Checkout />);
  await user.click(screen.getByRole('radio', { name: /express/i }));
  await user.click(screen.getByRole('button', { name: /place order/i }));

  expect(await screen.findByText(/order a1 confirmed/i)).toBeInTheDocument();
  expect(body).toMatchObject({ shipping: 'express' });
});
```

Capture the request in the handler, and assert on it at the end alongside the visible result. Avoid asserting "fetch was called 3 times" unless call count is the actual requirement, like proving a debounce works.

#### A third worked example
**Testing loading states and race conditions with `delay`.**
```ts
server.use(
  http.get('/api/search', async ({ request }) => {
    const q = new URL(request.url).searchParams.get('q');
    await delay(q === 'a' ? 500 : 50); // the older query resolves last
    return HttpResponse.json({ results: [q + '-result'] });
  }),
);
```
Type "a", then "ab". The "a" response arrives after "ab". A correct component shows only "ab-result". This is how you prove a race-condition fix (AbortController or ignoring stale responses) without relying on luck. For a loading skeleton, use `delay('infinite')` and assert the skeleton is present.

#### Step-by-step framework
1. **Decide the seam**: the network, so all your fetching code runs.
2. **Write default handlers** for every endpoint's happy path, typed from the API schema.
3. **Create `server.ts` (Node) and `browser.ts` (worker)** sharing the same handlers.
4. **Wire the lifecycle** in the test setup file, with `onUnhandledRequest: 'error'`.
5. **Override per test** with `server.use` for errors, empty states and delays.
6. **Assert on visible output first**, request payloads second, call counts rarely.
7. **Reuse the handlers** in Storybook and local dev so every state is demoable.
8. **Guard against drift** with generated types, contract tests or a few real E2E tests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| `vi.mock('../api')` returning canned data | MSW handlers so the real client, parsing and caching run |
| Only tests the happy path | Covers 500s, network errors, empty lists, slow responses |
| Unmocked requests silently pass or hang | `onUnhandledRequest: 'error'` |
| Handlers leak between tests | `resetHandlers` in `afterEach`, fresh QueryClient per test |
| Hand-written response shapes that drift | Handlers typed from OpenAPI, plus a few real E2E tests |

#### Useful phrases
- "I mock what I don't own, the server, and let everything I do own run."
- "Unhandled requests should be errors, not silent passes."
- "The same handlers power tests, Storybook and local dev."
- "A mock is only as good as its match with the real API, so I type it from the schema."

#### Common pitfalls
- **Relative URLs in Node**: `fetch('/api/x')` needs a base URL in jsdom or Node; configure it or use absolute URLs in handlers.
- Forgetting **`resetHandlers`**, so an error override from one test breaks the next.
- A **shared QueryClient** with retries on: error tests take seconds and data leaks across tests.
- Mixing **MSW with `vi.mock` of the same module**, so the handler never fires.
- Forgetting to **serve `mockServiceWorker.js`** from the public folder for browser usage (`npx msw init public/`).
- Shipping the worker to production: only start it behind `if (import.meta.env.DEV)`.

#### Follow-ups to expect (with sample answers)
- **"How is MSW different from a JSON server or a staging API?"** — "It runs in-process, needs no port or network, is deterministic per test, and lets me create edge cases like a 503 or a 5-second delay that a real server won't produce on demand."
- **"How do you simulate a network failure?"** — "`return HttpResponse.error()`, which makes `fetch` reject with a TypeError, just like going offline. That's different from a 500, which resolves with `ok: false`, and the UI often needs to handle both."
- **"Can MSW mock GraphQL?"** — "Yes, with `graphql.query('GetUser', ({ variables }) => ...)` and `graphql.mutation`, matched by operation name."
- **"Won't mocks hide API changes?"** — "They can. Generated types catch shape changes at compile time, contract tests catch them in CI, and a thin E2E layer against a real backend catches integration issues."
- **"How do you use it in Storybook?"** — "With `msw-storybook-addon`: each story sets `parameters.msw.handlers`, so I can have Loaded, Empty, Error and Slow stories for one component, all using real fetching code."

#### What senior interviewers look for
- A clear **philosophy of where to mock**, and why.
- Systematic coverage of **failure and latency states**, not just success.
- A **shared mocking layer** used across tests, Storybook and dev, not three separate fake-data systems.
- Awareness of **drift** and a plan for it.

#### Practise it
- Set up MSW in a small app and write tests for success, empty, 500 and network-error states of one list page.
- Write a test that proves a search box ignores stale responses, using `delay`.
- Checklist: shared handlers · `onUnhandledRequest: 'error'` · `resetHandlers` · fresh QueryClient · failure states · typed handlers.

#### Variations you might be asked
- "How would you test a component that polls an API every 10 seconds?"
- "What's wrong with `jest.mock('axios')`?"
- "How do you develop a frontend before the backend endpoint exists?"

## End-to-end testing with Playwright or Cypress
- id: fe-test-04
- roles: frontend, fullstack
- round: TESTING
- difficulty: medium
- levels:
- tags: testing, e2e, Playwright, Cypress, flaky tests, CI

### Prompt
How do you approach end-to-end testing for a web app? Compare Playwright and Cypress, explain what you would and wouldn't cover with E2E tests, and describe how you keep an E2E suite fast and free of flaky tests.

### Answer
#### What the interviewer is really testing
- Knowing **what E2E tests are for**: a small number of critical user journeys through the real stack, not every edge case.
- A grounded comparison of **Playwright vs Cypress**: architecture, browser support, parallelism, debugging.
- Practical skills for **reliability**: auto-waiting, resilient locators, isolated test data, authentication setup.
- How you run E2E in **CI**: sharding, retries with traces, running against preview deployments.
- Whether you treat **flakiness as a bug** to fix, not something to retry away.

#### Key points
- **What E2E is for:** proving critical journeys work across the real frontend, backend, database and third parties: sign-up, login, checkout, the main create/edit flow. Typically 10 to 50 tests, not hundreds.
- **What it isn't for:** validation rules, every error message, layout permutations. Those belong in component or integration tests, which are 10 to 100 times faster.
- **Playwright:**
  - Drives browsers out-of-process via the DevTools protocol (and patched WebKit/Firefox builds).
  - Chromium, Firefox and **WebKit (Safari engine)**; multiple tabs, origins and browser contexts.
  - Free **parallelism and sharding** built in; isolated `browserContext` per test is cheap.
  - **Trace Viewer** (DOM snapshots, network, console per step), codegen, UI mode.
  - Auto-waiting locators and web-first assertions: `await expect(locator).toBeVisible()`.
- **Cypress:**
  - Runs tests **inside the browser** alongside the app, giving an excellent interactive runner with time-travel snapshots.
  - Chromium-family and Firefox; WebKit is experimental. Historically limited with multiple tabs and cross-origin (improved with `cy.origin`).
  - Chained, command-queue API (`cy.get().click()`), not plain async/await.
  - Parallelism mainly through Cypress Cloud (paid) or third-party sharding.
  - Also strong at **component testing**.
- **Reliability practices:**
  - **Locators by role, label or text** (`getByRole('button', { name: 'Pay' })`), or `data-testid` for stable hooks. Never CSS chains like `div > span:nth-child(3)`.
  - **No fixed sleeps**; rely on auto-waiting and assertions that retry.
  - **Each test creates its own data** through the API or a seed endpoint, and doesn't depend on test order.
  - **Log in once** and reuse the session (`storageState` in Playwright, `cy.session` in Cypress), and test the login UI in just one test.
  - **Stub only third parties you can't control** (payment providers, email), via route interception or sandbox accounts.
- **CI:** run on every PR against a preview deployment or a docker-compose stack; shard across machines; upload traces, videos and screenshots on failure; quarantine flaky tests with an owner and a deadline.

#### Model answer
"I treat end-to-end tests as a thin safety net for the journeys that would cost us money or trust if they broke: signing up, logging in, the core create flow, and checkout. Everything else is tested lower down, where tests are faster and failures are easier to diagnose. So I'd expect a few dozen E2E tests, not hundreds.

Today I'd usually choose Playwright. It runs Chromium, Firefox and WebKit, so I get real Safari-engine coverage. Parallelism and sharding are built in and free. Each test gets an isolated browser context, which is cheap, and the Trace Viewer makes CI failures easy to debug, because I can step through DOM snapshots, network calls and console logs for every action. Cypress has a fantastic interactive runner and is great for component testing, and I'd happily stay with it on a team that already uses it, but its in-browser architecture has historically made multi-tab and cross-origin flows harder, and parallelism mostly goes through their paid cloud.

For reliability, I follow a few rules. Locators use roles and accessible names, the same as Testing Library, so tests don't break when markup changes. There are no fixed waits: Playwright's locators auto-wait for elements to be visible, enabled and stable, and assertions like `toHaveText` retry. Each test creates its own data through an API call, so tests can run in parallel and in any order. Authentication happens once in a setup project that saves `storageState`, and other tests start already logged in.

```ts
test('customer can buy an item', async ({ page, request }) => {
  const product = await createProduct(request, { name: 'Blue Mug', price: 12 });
  await page.goto('/products/' + product.slug);
  await page.getByRole('button', { name: 'Add to basket' }).click();
  await page.getByRole('link', { name: /basket \(1\)/i }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await fillTestCard(page); // Stripe test mode iframe
  await page.getByRole('button', { name: /pay £12/i }).click();
  await expect(page.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
});
```

In CI, the suite runs against the PR's preview deployment, sharded across four machines, with one retry that records a trace. A test that passes only on retry is reported as flaky and goes to a quarantine list with an owner. Flakiness is a bug, either in the test or in the app, and often it's a real race condition users hit too."

#### Another worked example
**Diagnosing a flaky test.** A test that "sometimes can't find the Save button" failed 1 in 20 runs. The trace showed the click landed while a skeleton loader was still covering the form, because the test clicked as soon as the button existed in the DOM. Cypress's and Playwright's actionability checks usually prevent this, but the button was technically visible under a transparent overlay. Fixes, in order of preference:
1. **Wait for the real signal**: `await expect(page.getByRole('progressbar')).toBeHidden()` before interacting.
2. **Fix the app**: the overlay shouldn't intercept clicks after loading, and the button should be disabled while saving.
3. Never: `await page.waitForTimeout(2000)`, which slows every run and still fails on a slow CI machine.

The real lesson was that users on slow connections could also click Save before data loaded, so the "test bug" was an app bug.

#### A third worked example
**Fast authentication with a setup project (Playwright).**
```ts
// auth.setup.ts
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER!);
  await page.getByLabel('Password').fill(process.env.E2E_PASS!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: '.auth/user.json' });
});
// playwright.config.ts: projects: [{ name: 'setup', testMatch: /auth\.setup/ },
//   { name: 'chromium', dependencies: ['setup'], use: { storageState: '.auth/user.json' } }]
```
Logging in through the UI once, instead of in every test, can cut minutes off a suite. Even faster: call the login API directly and save the cookies.

#### Step-by-step framework
1. **List the critical journeys** with product: what would be a P1 incident if it broke?
2. **Choose the tool** based on browser needs, parallelism, team familiarity and debugging.
3. **Build fixtures**: API helpers to create data, a logged-in state, test-mode third parties.
4. **Write tests with user-facing locators** and web-first assertions, no sleeps.
5. **Isolate tests** so they can run in parallel and in any order.
6. **Run in CI** on every PR against a realistic environment, sharded, with traces on failure.
7. **Track flakiness** as a metric; quarantine with owners, and fix root causes.
8. **Keep the suite thin**: push edge cases down to component and integration tests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "We E2E test everything" | A few dozen critical journeys; edge cases tested lower down |
| `cy.wait(3000)` / `waitForTimeout` | Auto-waiting locators and retrying assertions |
| CSS selectors tied to markup | Role, label or test-id locators |
| Tests depend on each other's data | Each test seeds its own data via the API |
| Retries hide flakiness | Retries record traces, flaky tests are tracked and fixed |
| Picks a tool by popularity | Compares architecture, browsers, parallelism and debugging |

#### Useful phrases
- "E2E tests are a smoke alarm, not a microscope."
- "If a test needs a sleep, it's waiting for the wrong thing."
- "Every flaky test is either a test bug or a real race condition our users can hit."
- "Seed through the API, assert through the UI."

#### Common pitfalls
- Testing **everything through the UI**, so the suite takes an hour and nobody trusts it.
- Logging in through the UI **in every test**.
- **Shared test accounts** that tests mutate, causing order-dependent failures in parallel runs.
- Running E2E **only nightly**, so breakages are found a day late with many suspect commits.
- Testing against **real third-party services** (live payments, real email) instead of sandboxes or stubs.
- Ignoring **test data cleanup**, so staging fills with junk and queries slow down.

#### Follow-ups to expect (with sample answers)
- **"How do you handle third-party iframes like Stripe?"** — "Use the provider's test mode and test cards. Playwright's `frameLocator` can fill the iframe. For most tests I stub the payment API at the network layer with `page.route`, and keep one test that goes through the real sandbox."
- **"How do you test emails, like a password reset link?"** — "Send to a test inbox service such as Mailpit or MailSlurp, fetch the message via its API in the test, extract the link, and visit it."
- **"Where should E2E tests run: staging or preview?"** — "Per-PR preview environments are best, because failures map to one change. A smaller smoke suite also runs against production after deploys."
- **"How do you keep the suite fast?"** — "Fewer tests, parallel workers, sharding, API seeding, reused auth state, and blocking unneeded resources like analytics scripts with `page.route`."
- **"Cypress or Playwright for component tests?"** — "Both work. For pure React component tests I'd often use Vitest with Testing Library, or Vitest browser mode, and save the browser tools for flows."

#### What senior interviewers look for
- A **risk-based** choice of what to cover, agreed with product.
- **Operational maturity**: flakiness metrics, quarantine, traces, ownership.
- A balanced, evidence-based **tool comparison**, not fandom.
- Seeing flaky tests as **signals about the app**, not just noise.

#### Practise it
- Write a Playwright test for a login and one core flow, with auth reused via `storageState`.
- Intentionally introduce a race (a delayed overlay) and fix the test the right way.
- Checklist: critical journeys only · role locators · no sleeps · isolated data · reused auth · traces in CI · flakiness tracked.

#### Variations you might be asked
- "Your E2E suite takes 45 minutes and fails randomly. What do you do?"
- "How would you test a multi-user, real-time feature like collaborative editing?"
- "What's the difference between E2E, integration and contract testing?"

## Visual regression and component testing with Storybook
- id: fe-test-05
- roles: frontend, fullstack
- round: TESTING
- difficulty: medium
- levels:
- tags: testing, Storybook, visual regression, Chromatic, component testing, design systems

### Prompt
How do you use Storybook beyond documentation? Explain how you would set up component testing and visual regression testing for a design system or a large React app, what tools you'd use, and how you'd avoid noisy, flaky visual diffs.

### Answer
#### What the interviewer is really testing
- Seeing **stories as test cases**: each story is a rendered state you can check for visuals, interactions and accessibility.
- Understanding **visual regression testing**: screenshot, compare to an approved baseline, review diffs.
- Knowing the tools: **Chromatic, Playwright `toHaveScreenshot`, Percy, Loki**, and the Storybook test runner or Vitest addon.
- Practical skill at **reducing noise**: fonts, animations, dates, random data, rendering differences across machines.
- Fitting it into a **review workflow** so designers and engineers approve visual changes on PRs.

#### Key points
- **A story is a component in a specific state**: `Button/Primary`, `Button/Loading`, `DataTable/Empty`, `DataTable/Error`. Written once, it serves as documentation, a dev sandbox and a test case.
- **Three kinds of checks on the same stories:**
  1. **Smoke/render tests**: every story renders without throwing (the Storybook test runner or `@storybook/addon-vitest` does this automatically).
  2. **Interaction tests**: a `play` function uses Testing Library and `userEvent` to click, type and assert inside the story; it runs in a real browser.
  3. **Visual tests**: a screenshot of each story is compared to a baseline pixel by pixel (or perceptually).
  4. Plus **accessibility checks** with `@storybook/addon-a11y` (axe) on every story.
- **Visual regression catches what other tests can't**: CSS regressions, broken layouts, z-index bugs, theme token changes, dark mode issues, unexpected wrapping. A functional test won't notice a button turned white-on-white.
- **Tools:**
  - **Chromatic** (by the Storybook maintainers): cloud rendering in consistent browsers, a UI review workflow, baselines per branch, TurboSnap to only snapshot stories affected by changed files.
  - **Playwright `expect(page).toHaveScreenshot()`**: free, self-hosted; baselines committed to the repo; must generate them in the same OS/Docker image as CI.
  - **Percy, Applitools** (AI-based diffing), **Loki** (open source, Docker-based).
- **Reducing noise:**
  - Run in a **pinned environment** (same browser version, OS, fonts, device scale factor), usually Docker or a cloud service.
  - **Disable animations** and transitions; Chromatic pauses CSS animations, and you can add a `prefers-reduced-motion` decorator.
  - **Freeze time and randomness**: mock `Date`, seed faker, use fixed avatars.
  - **Wait for fonts and images** to load (`document.fonts.ready`).
  - **Mock the network** with MSW so data is deterministic.
  - Use a **diff threshold** sensibly, and ignore regions for genuinely dynamic content.
- **Workflow:** PR opens, snapshots are taken, changed stories are flagged, a reviewer (often a designer) accepts or rejects each change, accepted snapshots become the new baseline. Unreviewed changes block merge.

#### Model answer
"I think of Storybook as a catalogue of component states, and every story as a test case I get for free. If I write stories for `Default`, `Loading`, `Empty`, `Error`, `LongContent` and `DarkMode`, that's documentation for other engineers, a sandbox for building, and six things I can check automatically.

On top of those stories I layer three kinds of tests. First, render checks: the Storybook test runner, or the newer Vitest addon, renders every story in a real browser and fails if anything throws or the console logs an error. Second, interaction tests: a `play` function on a story clicks and types with Testing Library, then asserts. For example, a `Combobox/KeyboardNavigation` story presses arrow down twice and Enter, and checks the right option is selected. Because it runs in a real browser, focus and layout behave exactly as they do for users, and when it fails I can open the story and watch the steps in the Interactions panel. Third, accessibility checks with the a11y addon running axe on every story.

Then visual regression on top. Functional tests can't tell you that a padding token change shifted every card by 4 pixels, or that dark mode text became unreadable. Visual tests screenshot every story and compare it with the approved baseline. For a design system I'd use Chromatic: it renders in consistent cloud browsers, TurboSnap only re-tests stories affected by the changed files, and designers can approve changes directly on the PR. If budget is tight, Playwright's `toHaveScreenshot` against the built Storybook works well, as long as baselines are generated inside the same Docker image as CI, otherwise font rendering differences between a Mac and Linux create constant false diffs.

The biggest risk with visual testing is noise. If diffs are flaky, people start clicking 'accept all' and the tool becomes useless. So I make stories deterministic: frozen dates, seeded fake data, MSW for network data, animations disabled, and waiting for fonts. The goal is that every diff someone sees is a real change they should look at."

#### Another worked example
**An interaction test in a story:**
```tsx
export const SubmitsValidForm: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'correct horse');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'correct horse',
    });
  },
};
```
This story is a test in CI, a visual snapshot of the filled-in state, and a live demo that shows other engineers how the component behaves. `fn()` creates a spy that also logs to the Actions panel.

#### A third worked example
**A token change caught by visual tests.** A design system team changed `--space-3` from 12px to 16px to fix one component. Unit tests all passed. Chromatic flagged 140 changed stories across 30 components, including a table header that now wrapped onto two lines at common widths. Because each diff was grouped by component, the designer reviewed them in about 15 minutes, accepted most, and the team introduced a new token for the one component instead of changing the shared one. Without visual tests, the table bug would have shipped to every product using the design system.

#### Step-by-step framework
1. **Write stories for every meaningful state**, including edge cases: long text, empty, error, RTL, dark mode, small viewport.
2. **Make stories deterministic**: MSW for data, frozen time, seeded randomness, no animations.
3. **Add render and a11y checks** for all stories in CI.
4. **Add `play` functions** for key interactions in complex components.
5. **Choose a visual tool**: Chromatic for scale and review UX, Playwright screenshots for a free self-hosted option.
6. **Pin the rendering environment** and set baselines from CI, never from a developer laptop.
7. **Make review part of the PR**: visual changes must be approved, ideally by design for design-system work.
8. **Keep costs down** with TurboSnap or only snapshotting changed stories, and a few viewports, not all of them.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Storybook is only documentation | Stories double as render, interaction, a11y and visual tests |
| Screenshots of whole pages with live data | Deterministic component states with mocked data |
| Baselines generated on a Mac, CI on Linux | Pinned Docker or cloud environment for all snapshots |
| Team clicks "accept all" | Diffs are reviewed; noise is treated as a bug |
| Snapshots every story at every viewport on every commit | TurboSnap or changed-only, with chosen key viewports |

#### Useful phrases
- "Every story is a test case I get for free."
- "Visual tests catch the bugs that functional tests are blind to: CSS."
- "A noisy visual suite is worse than none, because people learn to approve everything."
- "Baselines come from CI, never from someone's laptop."

#### Common pitfalls
- Confusing **Jest DOM snapshot tests** (`toMatchSnapshot` of HTML) with visual regression; DOM snapshots are brittle and don't catch CSS problems.
- **Non-deterministic stories**: `new Date()`, random avatars, live API calls.
- Snapshotting **too many viewports and browsers**, making the suite slow and expensive.
- Stories that only cover the **happy path**, so error and empty states are never seen.
- No **ownership of review**, so diffs pile up and block merges.
- Forgetting **fonts**: snapshots taken before web fonts load show the fallback font.

#### Follow-ups to expect (with sample answers)
- **"Why not just use DOM snapshot tests?"** — "They capture markup, not appearance. They break on any harmless markup change, people update them blindly, and they miss CSS regressions entirely, which is the main thing visual tests are for."
- **"How do you handle components with animation?"** — "Disable animations in the test environment, or use a story parameter to pause at the final frame. Chromatic pauses CSS animations automatically."
- **"How do you test responsive behaviour?"** — "Pick two or three key viewports per component, set them as story or Chromatic modes, rather than snapshotting every width."
- **"What about cross-browser visual differences?"** — "Snapshot the browsers your users actually use. Expect small rendering differences between engines, so each browser gets its own baseline."
- **"How does this fit with Testing Library unit tests?"** — "Logic and behaviour stay in fast Vitest tests. Stories cover appearance and real-browser interactions. Where it fits, Storybook's Vitest integration can run stories as tests, so you avoid duplicating setup."

#### What senior interviewers look for
- **Treating stories as shared infrastructure** for design, docs and testing.
- A plan to keep visual tests **trustworthy**: determinism, pinned environments, review ownership.
- **Cost awareness**: TurboSnap, viewport choices, what's worth snapshotting.
- Collaboration with **design** on approving visual changes.

#### Practise it
- Add stories for all states of one component, with a `play` function and the a11y addon.
- Set up Playwright `toHaveScreenshot` against a built Storybook inside Docker, and make a CSS change to see a diff.
- Checklist: all states covered · deterministic data and time · animations off · fonts loaded · CI baselines · review owner.

#### Variations you might be asked
- "How would you stop a design system update from breaking product teams?"
- "What's the difference between snapshot tests and visual regression tests?"
- "How do you make sure dark mode doesn't regress?"
