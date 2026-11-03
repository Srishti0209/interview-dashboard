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
