# Frontend Engineer — AI-Assisted Coding

## Universal playbook: how to approach any AI-assisted coding round
- id: 424a8850-dec7-4465-a8ad-0770ae5d6a92
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, methodology, meta
- companies: Meta, Anthropic, OpenAI, Apple, Canva, Shopify

### Prompt
You are about to sit an AI-assisted coding round: you get an existing codebase, a task (build a feature, extend a partial implementation, or fix a bug) and an AI assistant such as Claude, Copilot or Cursor. Walk through how you approach the round from the first minute to the last, and explain what the interviewer is grading.

### Answer
#### What the interviewer is really testing
- **Engineering judgment with a powerful tool in hand.** Everyone has the same assistant, so the signal is how you decide what to ask it, what to accept and what to throw away.
- **Critical reading.** Can you spot when generated code is wrong, subtly off, inconsistent with the codebase, or solves a different problem?
- **Ownership.** You must be able to explain every line that ends up in the diff, as if you had typed it yourself.
- **Process.** Reading before writing, running tests early, small steps, verifying each step.
- **Communication.** Narrating what you are about to ask the AI, what you expect back, and why you accept or reject it.
- What they are **not** grading: how often you use the AI, how eloquent your prompts are, or how fast you type.

#### Key points
- **Read first, code second (5 to 10 minutes).** List the files, open the entry points, trace one user action through the code. Note conventions: state management, naming, test style, error handling.
- **Run the app and the tests immediately.** Failing tests tell you what is expected and what is broken; passing tests are your safety net.
- **State a plan out loud before prompting.** "I'll add X in Y, write a test for Z, verify by running A." The plan is the evidence of judgment; the AI just executes it.
- **Use the AI as a fast typist and a second pair of eyes, not as the thinker.** Good asks: boilerplate, a reducer case that mirrors existing ones, a test skeleton, "explain this regex", "what edge cases am I missing?". Weak asks: "how should I solve this?" with no context.
- **Give the AI context, constraints and a shape.** Name the file, the existing pattern to follow, the types, and what must not change.
- **Verify every output.** Read it, run it, test edge cases. Watch for hallucinated APIs, wrong library versions, type mismatches, missing edge cases, and silently changed behaviour elsewhere.
- **Iterate in small steps.** Never accept 200 lines you haven't read. Generate, read, run, commit mentally, next.
- **Say so out loud when the AI is wrong**, and fix it yourself or with a sharper prompt.
- **Manage time.** Working core first, then edge cases, tests and polish. Leave five minutes to summarise.

#### Model answer
"My approach has four phases: understand, plan, build in small verified steps, and wrap up.

**Understand (first 5 to 10 minutes).** I don't touch the AI yet. I list the files and open the obvious entry points: the page component, the state store, the API layer, the types. I trace one existing flow end to end, for example 'what happens when I click Add to cart?', because the new feature will almost always mirror an existing one. I note the conventions: is state in a reducer or Zustand, are tests in RTL or Enzyme, how are errors surfaced? Then I run the tests and the app. If something is already failing, I say so: 'Two tests fail before I've changed anything; I'll note that so we don't confuse them with my changes.'

At this point I might use the AI to speed up reading: 'Summarise what CartContext.tsx exports and which components consume it.' But I check its summary against the code, because a wrong mental model is the most expensive mistake in the round.

**Plan (2 to 3 minutes, out loud).** I describe the change in plain words: 'I'll add a savedItems slice to the existing reducer with two new actions, then a button in the cart row and a new section below the cart. I'll test the reducer first, because that's where the logic lives.' I also name open questions and ask the interviewer, rather than letting the AI guess: 'If an item is already saved and you save it again, should quantities merge?'

**Build in small verified steps.** For each step I tell the interviewer what I'm about to ask and what I expect. 'I'll ask Claude to add the two reducer cases following the existing ADD pattern. I expect it might mutate state or forget to remove the item from the cart, so I'll check that.' My prompts are specific:

```text
In src/cart/CartContext.tsx, add two reducer cases, SAVE_FOR_LATER and
MOVE_TO_CART, following the same style as the existing REMOVE case.
State shape: { items: Record<string, CartItem>, savedItems: Record<string, CartItem> }.
Do not change the public hook API (useCart). Return immutable updates only.
```

Then I read every line it gives me. I'm looking for five things: does it match the existing style, are the types right, did it touch anything I didn't ask for, are the edge cases handled, and does every API it calls actually exist in the version we have? I run the tests after each step. If the AI suggests something I don't fully understand, I either ask it to explain and then verify the explanation, or I write that part myself.

When it's wrong, I say it out loud: 'It used structuredClone, but this project targets Node 16 in the test runner, so I'll use a spread instead.' Catching that is exactly the signal they want.

**Wrap up (last 5 minutes).** I run the full test suite, click through the feature once, and summarise: what I built, what I verified, what I'd do with more time (persistence, analytics, an accessibility pass), and where the AI helped or misled me."

#### Another worked example
**A debugging round.** The task: "Users report the pagination shows duplicate items when they click fast." A strong candidate:
1. Reproduces it first: clicks quickly through pages in the running app and watches the network tab. Two responses arrive out of order.
2. Forms a hypothesis before prompting: "The effect fetches on page change without cancelling the previous request, so a slow page-2 response lands after page 3 and appends."
3. Uses the AI narrowly: "Here is usePagedItems.ts. Point out any way two in-flight requests can both write to state." The AI might confirm the race, or might blame React StrictMode double-invoking effects. The candidate checks: StrictMode only runs effects twice in development, and the bug is reported in production, so that's not the root cause.
4. Fixes it with an `AbortController` in the effect cleanup (or a request id check), and writes a test with MSW where page 2 is delayed.
5. Explains why the fix works and what the AI got right and wrong.

The interviewer sees a hypothesis-driven debugger who uses the AI to check reasoning, not to replace it.

#### A third worked example
**An extend-the-partial round.** A rate limiter has a fixed-window implementation; add a sliding window. The candidate reads the existing interface first (`allow(key): boolean`), writes the tests for the boundary case that breaks fixed windows (a burst at the end of one window and the start of the next), and only then asks the AI for a sliding-window-log implementation behind the same interface. The AI's version stores every timestamp forever; the candidate spots the memory growth and prunes timestamps older than the window. Then they discuss the trade-off with a sliding-window counter (approximate, constant memory). The tests written first make the AI output easy to judge.

#### Step-by-step framework
1. **Clarify the task** with the interviewer: scope, what "done" means, any constraints.
2. **Read the code**: file list, entry points, one existing flow, conventions.
3. **Run the app and tests**; note anything already broken.
4. **Plan out loud**: the change, the order, how you'll verify, open questions.
5. **Prompt with context**: file, pattern to follow, types, what must not change.
6. **Read every line**: style, types, scope creep, edge cases, real APIs.
7. **Run and test after each step**; keep diffs small.
8. **Call out AI mistakes** and fix them deliberately.
9. **Handle edge cases and add tests** once the core works.
10. **Summarise**: what you did, how you verified it, what's next.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Pastes the task into the AI in minute one | Reads the code and runs tests before prompting |
| "Write me a save for later feature" | Names the file, pattern, types and constraints |
| Accepts 200 generated lines unread | Small steps, reads every line, runs tests each time |
| Can't explain a line when asked | Owns every line and can justify it |
| Silent while the AI works | Narrates what they expect and what they check |
| Treats AI errors as bad luck | Calls them out and explains how they caught them |
| Runs out of time mid-feature | Working core first, then polish, then summary |

#### Useful phrases
- "Before I prompt anything, I want to understand how the existing flow works."
- "I'll ask it for the boilerplate, because the logic is the part I want to own."
- "I expect it to miss X, so that's what I'll check first."
- "That method doesn't exist in the version in package.json, so I'll replace it."
- "Let me run the tests before moving on; I don't want to stack changes on an unverified step."
- "Here is what the AI helped with, and here is where I overrode it."

#### Common pitfalls
- **Prompting before reading**, so the AI invents structure that clashes with the codebase.
- **Accepting large diffs** that change unrelated files, rename things or reformat.
- **Trusting hallucinated APIs**: methods that don't exist, wrong option names, APIs from a newer major version.
- **Over-engineering from the AI**: a generic abstraction where the codebase uses a simple pattern.
- **Not testing**: "it compiles" is not verification.
- **Fighting the AI for ten minutes** instead of writing the five lines yourself.
- **Going silent**: the interviewer can't grade reasoning they can't hear.
- **Refusing to use the AI at all**: you are also assessed on using it well.

#### Follow-ups to expect (with sample answers)
- **"Why did you write that part yourself instead of asking the AI?"** — "It was the core logic and only a few lines. Writing it was faster than describing it precisely and then verifying someone else's version."
- **"How do you know the AI's code is correct?"** — "I don't assume it is. I read it against the types and conventions, check any unfamiliar API in the docs or node_modules, and run tests that cover the edge cases I listed before prompting."
- **"What would you do if the AI kept giving you wrong answers?"** — "Stop and reset: re-read the code, narrow the question, give it the exact error and the relevant file, or just write it myself. Looping on bad suggestions wastes the round."
- **"How do you use AI in your day-to-day work?"** — "For scaffolding, tests, refactors with a clear pattern, reading unfamiliar code and rubber-ducking. I don't use it to make design decisions without checking them, and everything goes through review and CI like any other code."
- **"Would you ship this?"** — "With the tests I added, yes for the core. I'd want an accessibility check and a quick review of the persistence migration first."

#### What senior interviewers look for
- **Judgment about where the AI adds value** and where it adds risk.
- **Respect for the existing codebase**: changes that look like they belong.
- **Verification habits** that would catch AI mistakes in production code review.
- **Calm, structured time management** and a clear summary at the end.
- The ability to **explain trade-offs** the AI didn't mention.

#### Practise it
- Take a small open-source React app, pick a feature to add, and do it in 45 minutes with an AI assistant while recording yourself narrating. Rewatch it: how long before your first prompt? Did you read every diff?
- Keep a log of AI mistakes you catch in daily work (hallucinated APIs, wrong versions, missing edge cases). They make great interview examples.
- Checklist: read code · run tests · plan out loud · context-rich prompts · read every line · test each step · call out errors · edge cases · summary.

#### Variations you might be asked
- "Walk me through how you'd use AI to get productive in an unfamiliar codebase."
- "What are the risks of AI-generated code in a production frontend?"
- "Show me a prompt you'd use for this task and explain why it's written that way."

## Build feature: add 'save for later' to existing e-commerce cart
- id: c1c62b04-62e7-44a1-9ddb-31b9c5edc5a2
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, build-feature, state-management
- companies: Meta, Shopify

### Prompt
You inherit a Next.js and TypeScript e-commerce app with `Cart.tsx`, `Product.tsx`, `CartContext.tsx` and `types.ts`. The cart supports add, remove and set quantity. Using the AI assistant, implement "save for later": a "Save for later" button on each cart row moves the item into a "Saved for later" section below the cart, and a "Move to cart" button moves it back.

### Answer
#### What the interviewer is really testing
- Do you **read the existing state design** and extend it in the same style, instead of bolting on a parallel system?
- **State modelling**: one source of truth, immutable updates, no item in both lists at once.
- **Edge-case thinking**: duplicates, quantities, out-of-stock, persistence, server sync.
- **Prompting with precise context** and **verifying** the AI's reducer changes didn't break existing actions or types.
- **Accessible, sensible UI**: real buttons, clear labels, focus management after an item moves.

#### Key points
- **Read first:** `CartContext` is a `useReducer` with `ADD`, `REMOVE`, `SET_QTY`; items are keyed by `productId`; `types.ts` has `CartItem`; there may be a localStorage serializer.
- **Model:** add `savedItems: Record<string, CartItem>` next to `items`. Moving is an atomic action, so an item is never in both or neither.
- **Actions:** `SAVE_FOR_LATER(productId)` and `MOVE_TO_CART(productId)`, both pure and immutable.
- **Keep the public API stable:** `useCart()` still returns what existing components use; add `saveForLater` and `moveToCart` helpers.
- **Edge cases to clarify:** saving an item already saved (merge or replace quantity?), moving back an item already in the cart (merge quantities, capped by stock?), out-of-stock saved items, guest versus logged-in.
- **Totals:** the subtotal must only count `items`, not `savedItems`. Check every selector that iterates the state.
- **Persistence:** extend the serializer, and handle old stored data without `savedItems` (a migration default).
- **UI:** a button per row with an accessible name ("Save Blue Mug for later"), a "Saved for later (2)" heading, an empty state, and focus moved somewhere sensible when the row disappears.
- **Tests:** reducer unit tests first, then an RTL test for the flow.

#### Model answer
"I'll start by reading the cart. CartContext is a useReducer with ADD, REMOVE and SET_QTY, items keyed by productId, and it persists to localStorage in an effect. Cart.tsx maps over items and renders CartRow; the subtotal is computed with a reduce over `Object.values(state.items)`. Tests exist for the reducer. I'll run them: all green.

My plan: add a `savedItems` record to the same reducer, with two actions that move an item atomically. Keeping it in the same reducer means one dispatch updates both lists, so the UI can never show an item in both places. Then a button on CartRow, a SavedItems section, persistence, and tests.

Two questions for you first: if I save an item that's already saved, should quantities merge? And when moving back to the cart, should quantity merge with an existing cart line? I'll assume merge, capped at stock, unless you'd prefer otherwise.

Now the prompt. I'm giving it the file, the pattern and the constraints:

```text
In src/cart/CartContext.tsx, extend CartState with
savedItems: Record<string, CartItem>, initialised to {}.
Add reducer cases SAVE_FOR_LATER and MOVE_TO_CART with payload { productId }.
Each moves the item between items and savedItems; if the item already exists in
the destination, add the quantities. Follow the style of the REMOVE case.
Immutable updates only. Do not change existing cases or the useCart return shape,
only add saveForLater and moveToCart functions to it.
```

I expect it might mutate with `delete state.items[id]`, or forget the merge case. Here's what it gave back, roughly:

```ts
case 'SAVE_FOR_LATER': {
  const item = state.items[action.productId];
  if (!item) return state;
  const { [action.productId]: _, ...rest } = state.items;
  const existing = state.savedItems[action.productId];
  return {
    ...state,
    items: rest,
    savedItems: {
      ...state.savedItems,
      [action.productId]: existing
        ? { ...existing, qty: existing.qty + item.qty }
        : item,
    },
  };
}
```

Reading it: the guard returns the same state if the item isn't there, which avoids a pointless re-render. The rest-destructure removes the key immutably. The merge is right. MOVE_TO_CART mirrors it. One thing it missed: the cap at stock when merging into the cart. I'll add `Math.min(existing.qty + item.qty, item.stock)` myself, since that's a business rule.

Next, I check what else reads the state. The subtotal only uses `state.items`, good. But the header badge uses `Object.keys(state).length` somewhere? Let me search... no, it uses `items`. And the persistence effect serialises the whole state, so savedItems is included, but loading old data would give `savedItems: undefined`. I'll default it on hydrate: `savedItems: parsed.savedItems ?? {}`.

Then the reducer tests. I'll ask the AI to draft them from my list: save moves the item, saving twice merges, move back merges and caps at stock, unknown id is a no-op, existing actions are unchanged. I'll read them to make sure they assert on behaviour, not just 'doesn't throw'.

For the UI: a button in CartRow with an accessible name including the product, `aria-label` like 'Save Blue Mug for later'. A SavedItems component below the cart with a heading, a count and an empty state. When a row disappears, focus would be lost to the body, so I'll move focus to the next row's button or the 'Saved for later' heading. Finally an RTL test: click Save on a row, assert it's gone from the cart list, present in the saved list, and the subtotal dropped.

To wrap up: the core works and is tested; with more time I'd sync saved items to the server for logged-in users, and show 'Out of stock' on saved items using fresh product data rather than the stored snapshot."

#### Another worked example
**The same feature where the cart is server-side.** The cart lives in an API (`/api/cart`), fetched with TanStack Query. Now "save for later" is a mutation: `POST /api/cart/items/:id/save`. The candidate:
- Reads the existing mutation hooks and copies the pattern, including optimistic updates with `onMutate`, rollback in `onError` and `invalidateQueries` in `onSettled`.
- Asks the AI to scaffold `useSaveForLater` following `useRemoveFromCart`, then checks that the optimistic update removes from one cached list and adds to the other in a single `setQueryData`, and that the rollback restores both.
- Points out a failure mode the AI ignored: a double click firing two mutations. Disabling the button while pending or making the endpoint idempotent fixes it.

#### A third worked example
**A Redux Toolkit codebase.** The cart is a slice with `createSlice` and Immer. Here, mutating syntax inside reducers is correct, because Immer produces immutable updates. If the AI writes spread-based code, that's fine but inconsistent; if it writes `state.items = state.items.filter(...)` outside Immer, that's a bug. The candidate notices the codebase uses `createEntityAdapter` for items and asks the AI to use a second adapter for saved items, so selectors like `selectAll` stay consistent. Recognising the house style is the signal.

#### Step-by-step framework
1. **Read** the context, reducer, selectors, persistence and tests; run them.
2. **Clarify** merge rules, stock caps, guest versus logged-in.
3. **Plan** out loud: state shape, actions, UI, persistence, tests.
4. **Prompt** for the reducer cases with file, pattern, types and constraints.
5. **Verify**: immutability, merge, no-op guard, existing cases untouched.
6. **Audit consumers**: totals, badges, analytics, serializers.
7. **Handle hydration** of old stored data.
8. **Build the UI** with accessible names, empty state, focus management.
9. **Test** the reducer and the user flow.
10. **Summarise** and list next steps.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Separate `useState` for saved items in Cart.tsx | Same reducer, atomic move action |
| Item can appear in both lists | Single dispatch moves it |
| Subtotal accidentally counts saved items | Audits every consumer of the state |
| Old localStorage data crashes the app | Defaults `savedItems` on hydrate |
| Generic "Save" buttons | Accessible names, empty state, focus handling |
| Trusts the generated reducer | Reads it, adds stock cap, writes tests |

#### Useful phrases
- "I want the move to be one action, so the item can never be in both lists."
- "I'll keep the existing hook API stable and only add to it."
- "The AI handled the merge, but the stock cap is a business rule, so I'll add it myself."
- "Old persisted carts won't have this field, so I'll default it on load."
- "When the row disappears, focus would drop to the body, so I'll move it deliberately."

#### Common pitfalls
- Building a **parallel state** outside the context, which drifts out of sync.
- **Mutating state** in a plain reducer (`delete state.items[id]`).
- Forgetting the **subtotal or badge** and counting saved items.
- **Breaking existing persisted data** with a new required field.
- Ignoring **duplicate saves** and quantity merging.
- Letting the AI **rename or reformat** unrelated parts of the file.

#### Follow-ups to expect (with sample answers)
- **"How would you sync this for logged-in users?"** — "Store saved items server-side, merge the guest's local list into the account on sign-in (union by productId, merging quantities), and use optimistic mutations with rollback."
- **"The price changed since they saved it. What do you show?"** — "Store only the productId and quantity, and render price and stock from fresh product data. Optionally flag 'Price dropped' by comparing with the price at save time."
- **"Why not a separate context for saved items?"** — "Moving between lists would then need two dispatches across two contexts, which can render an in-between state. One reducer makes the move atomic."
- **"How would you test focus management?"** — "In RTL, click Save on the first row and assert `document.activeElement` is the next row's Save button, or the heading if the cart is empty."

#### What senior interviewers look for
- Extending the **existing architecture** rather than reinventing it.
- **Data integrity**: atomic moves, hydration defaults, consumers audited.
- **Product sense**: stock, price changes, guest to account merge.
- Clear separation of **what they delegated to the AI and what they owned**.

#### Practise it
- Build a tiny cart with useReducer and localStorage, then add save for later with an AI assistant in 30 minutes, narrating. Then repeat with a TanStack Query server cart.
- Write the reducer tests before prompting, and judge the AI output against them.
- Checklist: same reducer · atomic move · merge rules · stock cap · consumers audited · hydration default · accessible buttons · focus · tests.

#### Variations you might be asked
- "Add a wishlist that persists across devices."
- "Add 'buy it again' from past orders into the cart."
- "Let users split one cart line into two shipping addresses."

## Build feature: add typing indicators to a chat UI
- id: e6c5c3f0-54ed-4130-9cc3-8e4bd7f52c95
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, build-feature, realtime, AI-relevant
- companies: Anthropic, OpenAI, Meta

### Prompt
You are given a React chat app that already sends and receives messages over a WebSocket (`useChatSocket.ts`, `MessageList.tsx`, `Composer.tsx`, a small Node server). Using the AI assistant, add typing indicators: when other people in the conversation are typing, show "Alex is typing…" (or "Alex and 2 others are typing…") above the composer.

### Answer
#### What the interviewer is really testing
- **Realtime protocol design**: which events to send, how often, and how the indicator ends.
- **Throttling and timeouts**: not flooding the socket on every keystroke, and clearing stale indicators when a client disconnects mid-typing.
- **State modelling** for a set of typing users with expiry.
- **Reading the existing socket layer** and extending its message format rather than opening a second channel.
- **Verifying AI output** around timers, cleanup and race conditions, which is where generated code is often subtly wrong.
- **Accessibility**: announcing typing without spamming screen readers.

#### Key points
- **Events:** `typing:start` and `typing:stop` with `{ conversationId, userId }`, or a single `typing` heartbeat that the receiver expires.
- **Sender:** throttle `typing` to at most once every 2 to 3 seconds while the user types; send `stop` when the input is cleared, a message is sent, or after ~3 seconds idle; also stop on blur and unmount.
- **Receiver:** keep a `Map<userId, expiresAt>`; each heartbeat extends the expiry; a timer removes expired entries. This self-heals if a `stop` event is lost (tab closed, network drop).
- **Server:** relay to others in the room, never echo back to the sender; optionally drop typing events from users not in the conversation.
- **Clear on message:** when a message from Alex arrives, remove Alex from the typing set immediately.
- **Display text:** one, two, or "and N others" formatting; exclude yourself.
- **Accessibility:** an `aria-live="polite"` region is tempting but noisy; announce only on transitions, or leave it visual-only and rely on new-message announcements.
- **Cleanup:** clear intervals and timeouts on unmount, and when switching conversations.

#### Model answer
"Let me read the socket layer first. `useChatSocket` opens one WebSocket, parses JSON messages with a `type` field and switches on it: currently `message:new` and `presence`. It exposes `send(type, payload)`. The server keeps rooms per conversation and broadcasts to everyone in the room. MessageList renders messages; Composer is a controlled textarea that calls `send('message:new', …)` on submit.

So the plan: extend the existing message protocol with a `typing` event rather than opening anything new. Sender side, throttle it. Receiver side, a map of userId to expiry time, so an indicator disappears on its own if the 'stop' never arrives. Server side, relay to everyone in the room except the sender.

I'll do the receiver first, because it's the most error-prone. My prompt:

```text
Create src/chat/useTypingUsers.ts. It receives typing events
{ conversationId, userId, isTyping } from useChatSocket's subscribe(type, handler).
Keep a Map<string, number> of userId to expiresAt (now + 5000 ms) for the current
conversationId. isTyping false removes the user immediately.
Run one interval every 1000 ms that removes expired users, only while the map is
non-empty. Return an array of typing userIds, excluding currentUserId.
Clear everything when conversationId changes. Clean up on unmount.
```

I expect two likely mistakes: storing the map in a ref but never triggering a re-render, or starting a new interval on every event. Reading the output... it stores the map in state as a new Map each update, which is correct for re-rendering. But the interval effect depends on `typing` itself, so it restarts on every event. That works, but it resets the 1-second tick constantly; I'd rather depend on `typing.size > 0`. Also it doesn't remove a user when a real message from them arrives. I'll add a subscription to `message:new` that deletes the author.

Now the sender in Composer. Throttling is easy to get subtly wrong, so I'll write it myself:

```ts
const lastSent = useRef(0);
const stopTimer = useRef<ReturnType<typeof setTimeout>>();

function notifyTyping() {
  const now = Date.now();
  if (now - lastSent.current > 2500) {
    send('typing', { conversationId, isTyping: true });
    lastSent.current = now;
  }
  clearTimeout(stopTimer.current);
  stopTimer.current = setTimeout(stopTyping, 3000);
}

function stopTyping() {
  clearTimeout(stopTimer.current);
  if (lastSent.current) {
    send('typing', { conversationId, isTyping: false });
    lastSent.current = 0;
  }
}
```

`notifyTyping` runs in onChange when the value is non-empty; `stopTyping` runs on submit, when the input is cleared, on blur, and in an unmount cleanup. The receiver expiry is 5 seconds, longer than the 2.5-second heartbeat, so a steady typist never flickers.

Server: in the message handler, add a `typing` case that attaches `userId` from the authenticated socket, not from the payload, so a client can't fake someone else typing, then broadcast to the room excluding the sender. I'll check the AI's broadcast helper: the existing one sends to everyone including the sender, so I need the variant that skips it.

UI: a TypingIndicator component above the composer. Formatting: one name, two names joined by 'and', or 'Alex and 2 others are typing'. I'll keep it visual with three animated dots, `aria-hidden` on the dots, and not put it in a live region, because announcing every start and stop would be noisy. New messages are already announced.

Testing: a unit test for useTypingUsers with fake timers, checking that a user appears, is extended by a second event, expires after 5 seconds, and is removed by a message. Then two browser tabs side by side to try it for real, including closing one tab mid-typing to confirm the indicator expires."

#### Another worked example
**An AI assistant chat (like Claude or ChatGPT) rather than human chat.** Here "typing" means the model is generating. There's no heartbeat: the indicator is driven by the stream state. Show "thinking" between sending and the first token, then stream tokens into the message. The tricky parts are different: cancelling with a Stop button (an `AbortController` on the fetch), handling a stream that errors halfway, and not re-rendering the whole message list on every token (memoise finished messages, append tokens to only the streaming one). A candidate who notices that the problem changes shape in this context shows real product understanding.

#### A third worked example
**Group chat at scale (thousands in a room).** Broadcasting every typing event to every member is wasteful. The candidate suggests: only send typing events to clients that have the conversation open, aggregate on the server ("3 people typing") and send at most once per second, and drop typing entirely above a size threshold, as Slack does in large channels. The AI may happily generate per-user broadcasts; the candidate's job is to question the cost.

#### Step-by-step framework
1. **Read** the socket hook, message format, server rooms, and composer.
2. **Design the protocol**: event name, payload, who sets userId, throttle and expiry numbers.
3. **Receiver** first: expiry map, interval cleanup, clear on message and on conversation change.
4. **Sender**: throttled heartbeat, stop on idle, submit, clear, blur, unmount.
5. **Server**: authenticate userId, relay to room except sender.
6. **UI**: names formatting, exclude self, animation, accessibility decision.
7. **Test** with fake timers, then two real tabs including a dropped connection.
8. **Summarise** trade-offs and scaling.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Sends an event on every keystroke | Throttled heartbeat every ~2.5 s |
| Relies only on a stop event | Receiver expiry self-heals lost stops |
| Trusts userId from the client payload | Server attaches userId from the authenticated socket |
| Shows "You are typing" | Excludes the current user |
| Intervals never cleared | Cleanup on unmount and conversation change |
| Live region announcing every change | Deliberate, quiet accessibility choice |

#### Useful phrases
- "I'll extend the existing message protocol instead of opening a second connection."
- "The stop event can get lost, so the receiver must expire indicators on its own."
- "The expiry is longer than the heartbeat interval, so it doesn't flicker."
- "The server sets the userId, so clients can't impersonate each other."
- "Timer code is where generated code tends to be subtly wrong, so I'll read this part carefully."

#### Common pitfalls
- **Socket flooding** from un-throttled keystroke events.
- **Stuck indicators** when a tab closes mid-typing.
- **Echoing to the sender**, so you see yourself typing.
- **Leaked intervals** that keep running after leaving the conversation.
- **Stale closures** in timers that capture an old `conversationId`.
- **Forgetting to clear** the indicator when the message arrives.

#### Follow-ups to expect (with sample answers)
- **"Why a heartbeat instead of start and stop?"** — "Stop events are unreliable: tabs close, networks drop. A heartbeat plus expiry is self-correcting. I still send an explicit stop for responsiveness."
- **"What if the socket reconnects?"** — "Clear the typing map on reconnect, since we may have missed stop events, and let fresh heartbeats rebuild it."
- **"How would you test the throttle?"** — "Fake timers: simulate ten onChange calls over two seconds and assert one send; advance past the window, type again, assert a second send; advance three seconds idle, assert a stop."
- **"Privacy concern?"** — "Some apps let users turn off typing indicators. That's a setting checked on the sender side, so nothing is broadcast."

#### What senior interviewers look for
- Thinking about **failure modes of the network**, not just the happy path.
- **Security instinct** around trusting client payloads.
- **Cost awareness** at scale.
- Careful review of **timer and cleanup code** the AI produced.

#### Practise it
- Build a two-tab chat with a tiny `ws` server and add typing indicators in 40 minutes, narrating your prompts.
- Kill one tab mid-typing and confirm the indicator disappears in the other.
- Checklist: protocol · throttle · expiry · server userId · exclude self · clear on message · cleanup · formatting · tests.

#### Variations you might be asked
- "Add read receipts to the chat."
- "Show online and away presence for each participant."
- "Add a 'thinking' indicator and a stop button to an AI chat UI."

## Build feature: add auto-complete table of contents to a markdown blog
- id: c227b743-4b1a-4133-800e-f2e5cb5b2595
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, build-feature, parsing

### Prompt
A blog renders Markdown posts with a React Markdown renderer (`Post.tsx`, `markdown.ts`, `posts/*.md`). Using the AI assistant, add an automatically generated table of contents: list the post's headings (h2 and h3, nested), link each to its section, and highlight the section currently in view while scrolling.

### Answer
#### What the interviewer is really testing
- **Parsing judgment**: extracting headings robustly (not with a naive regex that matches `#` inside code blocks).
- **Stable, unique slugs** that match between the TOC links and the rendered heading ids.
- **Scroll-spy implementation** with `IntersectionObserver` instead of scroll listeners.
- **Reusing the existing pipeline** (remark/rehype plugins or the renderer's component overrides).
- **Accessibility**: a `nav` landmark, a nested list, `aria-current`.
- **Verifying AI output** on edge cases: duplicate headings, punctuation, emoji, non-English text, headings with inline code or links.

#### Key points
- **Extract headings from the parsed tree (AST), not raw text.** A regex like `/^#{2,3} (.*)/gm` also matches lines inside fenced code blocks.
- **Slugs:** lowercase, strip punctuation, spaces to hyphens, and de-duplicate (`setup`, `setup-1`). Use the same function for heading ids and TOC links, ideally `github-slugger` or `rehype-slug` so it's one source of truth.
- **Heading text:** use the plain text of the heading node (inline code and links flattened).
- **Nesting:** build a tree from a flat list of `{ depth, text, id }`; handle an h3 that appears before any h2.
- **Scroll spy:** `IntersectionObserver` on each heading with a `rootMargin` like `0px 0px -70% 0px`, tracking the last heading that crossed the top; account for a sticky header with `scroll-margin-top`.
- **Links:** plain `href="#id"` anchors so they work without JavaScript, can be shared, and keep browser history; optional smooth scroll with `scroll-behavior` respecting `prefers-reduced-motion`.
- **Where to compute:** at build time (static site generation) if posts are static, so no client parsing cost.
- **Accessibility:** `<nav aria-label="Table of contents">`, nested `<ol>`, `aria-current="true"` on the active link.

#### Model answer
"First I'll read the pipeline. `markdown.ts` uses unified with remark-parse, remark-gfm, remark-rehype and rehype-highlight, then Post.tsx renders the HTML. Headings currently have no ids. Posts are statically generated at build time. Let me look at a couple of posts: there are duplicate headings like 'Example' in one post, headings with inline code, and fenced code blocks containing `#` comments in bash. Those are my test cases.

Plan: add `rehype-slug` to the pipeline, so every heading gets an id from github-slugger, which handles duplicates. Then write a small plugin, or a function on the tree, that collects h2 and h3 with their ids and text, and returns them alongside the HTML. Render a TOC component from that list, and add scroll spy on the client.

I'll first check what the AI would do with a vague prompt in my head: it would likely write a regex over the raw markdown. That breaks on code blocks and wouldn't match the ids the renderer generates. So I'll be explicit:

```text
In src/lib/markdown.ts, add rehype-slug after remark-rehype. Then add a small rehype
plugin that walks the HAST tree with unist-util-visit, collects h2 and h3 elements
as { depth, id, text }, where text comes from hast-util-to-string, and stores them
on file.data.toc. Return { html, toc } from renderMarkdown. Don't parse raw markdown
with regex. Keep the existing plugins and their order.
```

Reading the result: it uses `visit(tree, 'element', …)` and checks `node.tagName === 'h2' or 'h3'`, takes `node.properties.id` (set by rehype-slug, because it runs earlier), and `toString(node)` for text. Good. I'll check that rehype-slug really runs before the plugin; if the order were reversed, the ids would be undefined. I'll also confirm these packages are in package.json or add them, rather than trusting the import.

Now nesting. I'll write it myself, it's short:

```ts
type Item = { depth: number; id: string; text: string; children: Item[] };

function nest(flat: Omit<Item, 'children'>[]): Item[] {
  const root: Item[] = [];
  let currentH2: Item | null = null;
  for (const h of flat) {
    const item = { ...h, children: [] };
    if (h.depth === 2 || !currentH2) {
      root.push(item);
      if (h.depth === 2) currentH2 = item;
    } else {
      currentH2.children.push(item);
    }
  }
  return root;
}
```

An h3 before any h2 goes to the top level instead of being lost.

Scroll spy: a `useActiveHeading(ids)` hook with one IntersectionObserver over all heading elements, `rootMargin: '0px 0px -70% 0px'`, so a heading counts as active once it's in the top 30% of the viewport. When entries fire, pick the visible one nearest the top; if none are visible, keep the last active one so the highlight doesn't flicker off between headings. I'll add `scroll-margin-top` in CSS equal to the sticky header height, so clicking a link doesn't hide the heading under the header.

UI: a `nav` with `aria-label`, nested `ol`, anchor links with `aria-current` on the active one, sticky in a sidebar on desktop and a collapsible details element on mobile. Hide the TOC when a post has fewer than three headings.

Tests: unit-test the plugin against a fixture with duplicate headings, inline code, emoji and a code block containing hash lines, and assert the ids match the rendered HTML ids. Then check in the browser: click links, scroll, share a URL with a hash."

#### Another worked example
**The renderer is react-markdown at runtime, not a unified pipeline at build time.** The candidate uses react-markdown's `rehypePlugins={[rehypeSlug]}` and a component override for `h2` and `h3`. They're careful not to collect headings during render with a mutable array (that breaks with StrictMode double rendering and concurrent rendering). Instead they parse once with `useMemo` using the same remark and rehype plugins to get the TOC list, or extract headings from the DOM after mount with `querySelectorAll('h2[id], h3[id]')`. The AI often proposes the push-into-array-during-render trick; the candidate explains why it's fragile.

#### A third worked example
**Documentation site with versioned docs and translated pages.** Slugs from translated headings may be non-Latin. github-slugger keeps Unicode letters, which is fine in URLs. But anchors shared between languages break, so the candidate suggests explicit ids in Markdown (`## Installation {#install}`) via a remark plugin, falling back to generated slugs. This shows they think about link stability over time, not just generation.

#### Step-by-step framework
1. **Read** the rendering pipeline and a few real posts; collect edge cases.
2. **Choose AST over regex**, and one slug function for ids and links.
3. **Prompt** for the plugin with exact libraries and ordering constraints.
4. **Verify** plugin order, package availability, text extraction.
5. **Nest** the flat list, handling orphan h3s.
6. **Scroll spy** with IntersectionObserver and sticky-header offset.
7. **Accessible UI** with nav, nested list, aria-current, mobile behaviour.
8. **Test** fixtures for duplicates, code blocks and special characters.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Regex over raw markdown | Walks the parsed tree |
| Separate slug logic for links and ids | One slugger, ids set by rehype-slug |
| Duplicate headings share an id | De-duplicated slugs |
| Scroll listener on every frame | IntersectionObserver |
| Heading hidden under sticky header | `scroll-margin-top` |
| `div`s with onClick scrolling | Real anchors in a nav landmark |

#### Useful phrases
- "A regex would match hash lines inside code blocks, so I'll work on the parsed tree."
- "The ids and the links must come from the same slug function, or they'll drift."
- "rehype-slug has to run before my plugin, otherwise the ids don't exist yet."
- "Plain anchors work without JavaScript and give shareable URLs for free."
- "I'll compute this at build time, since the posts are static."

#### Common pitfalls
- **Regex parsing** that breaks on code blocks, setext headings or escaped characters.
- **Mismatched slugs** between TOC and headings.
- **Duplicate ids**, which also break accessibility.
- **Collecting headings during render** with a mutable array.
- **Ignoring the sticky header** offset.
- **Smooth scroll** that ignores reduced-motion preferences.

#### Follow-ups to expect (with sample answers)
- **"Why IntersectionObserver over a scroll listener?"** — "It runs off the main thread's scroll path and only fires on threshold changes, so there's no layout reading on every scroll frame."
- **"How would you update the URL hash while scrolling?"** — "Use `history.replaceState` when the active heading changes, throttled, so it doesn't spam history entries."
- **"How do you handle very long posts with 100 headings?"** — "Only show h2 by default with expandable h3s, and keep the active item scrolled into view in the TOC itself."
- **"What if the author writes HTML headings inside markdown?"** — "With rehype-raw they become elements in the tree too, so the same plugin picks them up."

#### What senior interviewers look for
- Choosing the **robust parsing approach** and explaining why.
- **One source of truth** for ids.
- **Performance and accessibility** handled by default.
- Testing with **real, messy content** rather than a toy post.

#### Practise it
- Take a markdown file with duplicate headings and code blocks, build a TOC with an AI assistant, and see whether its first attempt survives your fixture.
- Implement scroll spy with IntersectionObserver from memory.
- Checklist: AST · shared slugger · dedupe · plugin order · nesting · observer · scroll-margin · nav and aria-current · build-time.

#### Variations you might be asked
- "Add copy-link buttons next to each heading."
- "Add a reading progress bar to the blog post."
- "Generate a search index from the blog's headings."

## Build feature: add dark mode that respects system preference
- id: dd6b7faf-06e2-44a2-8a9e-d41c3dd86a4d
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: easy
- levels:
- tags: AI-assisted, build-feature, theming

### Prompt
You are given a React app (Next.js or Vite) styled with CSS (or CSS modules) and hard-coded colours. Using the AI assistant, add dark mode. By default it follows the operating system preference; the user can override it with a Light / Dark / System control, and the choice persists across visits without a flash of the wrong theme on load.

### Answer
#### What the interviewer is really testing
- **CSS architecture**: replacing hard-coded colours with design tokens (CSS custom properties), not duplicating every rule.
- **The three-state model**: system, light, dark, where "system" keeps tracking OS changes live.
- **No flash of incorrect theme (FOUC)**: applying the theme before React hydrates.
- **SSR awareness** in Next.js: the server doesn't know the preference, so avoid hydration mismatches.
- **Accessibility**: contrast in both themes, `color-scheme` for native controls, an accessible toggle.
- **Directing the AI on a mechanical refactor** and checking it didn't miss or mangle colours.

#### Key points
- **Tokens:** define `--color-bg`, `--color-text`, `--color-surface`, `--color-border`, `--color-accent` and so on on `:root`; override them under `[data-theme='dark']`. Components use only tokens.
- **System default:** `@media (prefers-color-scheme: dark)` applies dark tokens when no explicit choice is set, for example `:root:not([data-theme='light'])` inside the media query.
- **State:** `'system' | 'light' | 'dark'` saved in localStorage; the resolved theme is derived.
- **Live updates:** `matchMedia('(prefers-color-scheme: dark)')` with a `change` listener, so "system" follows the OS switching at sunset.
- **No flash:** a tiny inline script in `<head>` reads localStorage and sets `data-theme` on `<html>` before first paint. In Next.js, put it in the root layout or `_document` (or use `next-themes`, which does exactly this).
- **Hydration:** the server can't know the theme; render the toggle's label only after mount, or use `suppressHydrationWarning` on `<html>` because the script changes its attribute.
- **`color-scheme: light dark`** so scrollbars, form controls and the default background match.
- **Images and shadows:** adjust shadows, invert or swap logos, dim very bright images.
- **Toggle:** a radio group or a select with three options, with a visible label, not an icon-only button with no name.

#### Model answer
"Reading the styles first. There's a global.css and about forty CSS modules. Searching for hex and rgb values, I find around 120 colour literals, but only about twelve distinct ones, plus some near-duplicates like #333 and #343434. That tells me the first step is tokens, and that it's a mechanical refactor the AI is well suited to, as long as I check it.

Plan:
1. Define tokens on `:root` for light, and dark overrides.
2. Replace literals with tokens across the modules.
3. A theme provider with system, light and dark, persisted.
4. An inline script to avoid the flash.
5. A three-way control in the header.

I'll map the palette myself, because naming tokens by role is a design decision: #fff is the page background, #f6f7f9 is surface, #333 and #343434 are both primary text, #6b7280 is muted text, and so on. Then the prompt:

```text
Here is a mapping of colour literals to CSS variables: [mapping].
In every file under src/**/*.module.css and src/styles/global.css, replace each
literal with var(--token). Treat #333 and #343434 as --color-text.
If you find a colour not in the mapping, do NOT invent a token: list the file,
line and value so I can decide. Change nothing except colour values.
```

The 'list unknowns' instruction matters: otherwise the AI tends to invent tokens or pick the nearest one silently. It comes back with five unmapped colours, two of which are brand colours in the logo that shouldn't change, and three that are error and success states, which need their own tokens. I'll spot-check the diff: only colour values changed, no reformatting.

Then the token sheet:

```css
:root {
  color-scheme: light;
  --color-bg: #ffffff;
  --color-surface: #f6f7f9;
  --color-text: #1f2328;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-accent: #2563eb;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;
    --color-bg: #0f1115;
    --color-surface: #171a21;
    --color-text: #e6e8eb;
    --color-muted: #9aa3af;
    --color-border: #2a2f3a;
    --color-accent: #60a5fa;
  }
}
:root[data-theme='dark'] { /* same dark values */ }
```

The accent is lighter in dark mode, because the light-mode blue fails contrast on a dark background. I'll check each text and background pair against 4.5:1.

For the state: a small ThemeProvider with `preference` in state, initialised from localStorage inside a try/catch (it can throw in private mode). When preference is 'system' I remove the data-theme attribute and let the media query decide; otherwise I set it. The provider also listens to matchMedia changes, but only to update the 'resolved' value exposed to components that need it, like a chart library.

The flash: React runs too late, after first paint. So in the root layout's head I add a blocking inline script:

```html
<script>
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

And `suppressHydrationWarning` on the html element, since this script changes it before React hydrates. The AI suggested reading localStorage in a useEffect; that's the classic flash, so I replaced it.

The control: a select labelled 'Theme' with System, Light and Dark, or a radio group. To test, I switch the OS theme with the setting on System and see it follow; pick Dark, reload, and check there's no white flash; and run an automated contrast check in both themes."

#### Another worked example
**Tailwind CSS codebase.** Set `darkMode: 'class'` (or a `data-theme` selector variant in newer Tailwind) so dark mode is driven by an attribute you control, not only the media query; otherwise the user override can't work. The AI might add `dark:` variants to every element (`bg-white dark:bg-gray-900` everywhere), which works but scatters the palette. The candidate prefers semantic colours in the Tailwind config that point at CSS variables (`bg-surface`, `text-muted`), so the theme lives in one place. Same flash script, same three-state logic.

#### A third worked example
**A component library or design system used by many apps.** The tokens become the public API. The candidate proposes primitive tokens (`blue-500`) and semantic tokens (`color-accent`), with themes only remapping semantic ones; components never reference primitives. They'd add visual regression snapshots of key components in both themes (Storybook with a theme toolbar and Chromatic), because dark mode regressions are visual and easy to miss in code review.

#### Step-by-step framework
1. **Audit colours**: count literals and distinct values.
2. **Name tokens by role** yourself; that's the design decision.
3. **Delegate the mechanical replacement** with strict rules and "report unknowns".
4. **Review the diff** for scope and mistakes.
5. **Write the dark palette** and check contrast pairs.
6. **Three-state provider** with safe localStorage and matchMedia.
7. **Inline head script** to prevent the flash; handle hydration.
8. **Accessible control**, `color-scheme`, images and shadows.
9. **Test**: OS switch, reload with no flash, contrast in both themes.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Duplicates every CSS rule for dark | Tokens with one override block |
| Only a light/dark toggle | System, light and dark, with live OS tracking |
| Reads localStorage in useEffect | Blocking head script, no flash |
| Hydration warnings ignored | Understands why and suppresses only on html |
| Same accent in both themes | Re-checks contrast per theme |
| Icon-only toggle with no name | Labelled select or radio group |

#### Useful phrases
- "Naming tokens by role is a design decision, so I'll do the mapping and let the AI do the replacing."
- "I told it to report unknown colours rather than guess."
- "React runs after first paint, so the theme must be applied by an inline script."
- "System is a real third state: it keeps following the OS."
- "Contrast has to be checked separately in dark mode; the same blue fails."

#### Common pitfalls
- The **flash of the wrong theme** on reload.
- **Losing the system option** once the user has clicked a toggle.
- **Hydration mismatch** from rendering theme-dependent text on the server.
- **localStorage throwing** in private mode or when blocked.
- **Forgetting `color-scheme`**, leaving white scrollbars and inputs.
- **Pure black backgrounds** and pure white text, which cause glare; use soft dark greys.

#### Follow-ups to expect (with sample answers)
- **"How would you store the preference for signed-in users?"** — "Save it to the profile and set a cookie, so the server can render the right attribute and there's no flash at all, even on a new device."
- **"Why not just use the media query?"** — "It covers the default but doesn't allow an override. Users may want dark mode in a light OS, or the reverse."
- **"How do you handle charts and third-party widgets?"** — "Expose the resolved theme from context and pass it to them, and listen for changes; some libraries need a re-render with new colours."
- **"How do you test it?"** — "Playwright with `colorScheme: 'dark'` emulation, a test that reloads and checks the attribute before hydration, and axe contrast checks in both themes."

#### What senior interviewers look for
- **Token-based architecture** that scales.
- **Knowing the flash and hydration pitfalls** and why they happen.
- **Splitting design decisions from mechanical work** when delegating to the AI.
- **Accessibility** treated as part of the feature.

#### Practise it
- Add dark mode to a small app with hard-coded colours using an AI assistant; time the token refactor and count how many unknown colours it reports.
- Reload with throttled CPU and confirm there is no flash.
- Checklist: audit · role tokens · strict replace prompt · dark palette · contrast · three states · matchMedia · head script · hydration · color-scheme · labelled control.

#### Variations you might be asked
- "Add a high-contrast theme alongside light and dark."
- "Let enterprise customers set their own brand colours."
- "Add a font-size preference that persists and applies before first paint."

## Build feature: undo toast for destructive actions
- id: 9f7c4d21-cc9e-4692-b753-0f1da76bc71f
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, build-feature, UX

### Prompt
A React app lists items (emails, tasks or files) with a Delete button that currently shows a confirm dialog and then calls `DELETE /api/items/:id`. Using the AI assistant, replace the confirm dialog with an undo pattern: the item disappears immediately, a toast says "Item deleted · Undo", and clicking Undo within a few seconds restores it.

### Answer
#### What the interviewer is really testing
- **Choosing the undo strategy**: delay the server call (deferred delete) or delete immediately and restore (soft delete with an undo endpoint).
- **Optimistic UI** done properly, including failure and rollback.
- **Timer and lifecycle edge cases**: multiple deletes in a row, navigating away, closing the tab before the timer ends.
- **Accessible toasts**: announced politely, keyboard-reachable Undo, enough time to act, not stealing focus.
- **Extending the existing data layer** (TanStack Query, Redux, context) and **reviewing AI-generated timer logic**.

#### Key points
- **Two strategies:**
  - **Deferred commit:** hide the item locally, start a timer (5 to 8 seconds), call DELETE only when it expires; Undo cancels the timer. Simple and needs no backend change, but the delete can be lost if the tab closes.
  - **Soft delete:** call DELETE immediately (the server marks `deletedAt`), Undo calls `POST /items/:id/restore`. Durable and works across devices; needs backend support and a cleanup job.
- **Tab close with deferred commit:** flush pending deletes on `pagehide` with `navigator.sendBeacon` or `fetch(…, { keepalive: true })`, or accept the risk and say so.
- **Optimistic state:** remove from the cached list, keep the item and its index to restore it in place.
- **Multiple deletes:** each has its own timer and toast entry, or the toast groups them ("3 items deleted · Undo"); Undo restores the right one.
- **Errors:** if the eventual DELETE fails, restore the item and show an error toast.
- **Toast accessibility:** `role="status"` (polite live region), Undo is a real button, the toast pauses while hovered or focused, and the duration is long enough (WCAG 2.2.1, timing adjustable). Don't move focus into the toast automatically; offer a keyboard shortcut if the app has them.
- **Focus after delete:** move focus to the next item in the list, so keyboard users aren't stranded.

#### Model answer
"Reading the code: ItemList uses TanStack Query, `useItems()` for the list and `useDeleteItem()` as a mutation that calls the API and invalidates the list on success. The confirm uses `window.confirm`. There's already a Toaster component from a small in-house toast context with `toast.show({ message, duration })`, but no action buttons. Tests use RTL and MSW.

First, a question for you: does the backend support soft delete or a restore endpoint? If not, I'll use the deferred approach, delaying the actual DELETE until the undo window closes. Assuming no backend change, deferred it is. I'll note the tab-close risk and handle it with keepalive.

Plan:
1. Extend the toast system with an optional action button and pause-on-hover.
2. A `useUndoableDelete` hook that hides the item optimistically, schedules the real delete, and supports undo.
3. Wire it into the Delete button and remove the confirm.
4. Flush pending deletes on pagehide.
5. Tests with fake timers.

The hook is the heart of it, so I'll describe it precisely:

```text
Create src/items/useUndoableDelete.ts using TanStack Query v5.
deleteItem(item): cancel outgoing ['items'] queries, remove the item from the
['items'] cache with setQueryData, remember its index, then start a 6000 ms timer.
On timer: call api.deleteItem(item.id); on failure, re-insert the item at its index
and show an error toast. Return undo(id) that clears the timer and re-inserts it.
Track pending deletes in a ref Map<id, { timer, item, index }> so multiple deletes
work independently. On unmount, do not cancel pending deletes: commit them.
```

The last line is a deliberate decision: if the user navigates away, they expect the delete to happen, not to be silently undone.

Reviewing the output: it uses `queryClient.setQueryData(['items'], old => old.filter(...))`, fine. Re-insertion uses `splice` on the old array, which mutates the cached array; I'll change that to a copy with `[...old.slice(0, i), item, ...old.slice(i)]`. It invalidates the list immediately after removing, which would refetch and bring the item back before the delete happens. That's a real bug; the invalidation must happen only after the actual DELETE succeeds. And on unmount it clears all timers, the opposite of what I asked, so I'll fix the cleanup to commit pending deletes right away.

Tab close: in a pagehide listener, for each pending delete call `fetch(url, { method: 'DELETE', keepalive: true })`. sendBeacon only sends POST, so keepalive fetch fits a DELETE endpoint better.

The toast: I'll extend `toast.show` with `action: { label, onClick }`. The toast container already has `role='status'`; I'll check it's present in the DOM before the message is inserted, otherwise screen readers may not announce it. The timer pauses on hover and on focus within, so a keyboard user tabbing to Undo doesn't lose it mid-reach. Six seconds by default.

Focus: after hiding the item, focus moves to the next item's delete button or the list heading.

Tests with fake timers and MSW: delete hides the item and no request is made; advancing 6 seconds sends the DELETE; clicking Undo before then restores it in the same position and sends nothing; a 500 response restores the item and shows an error; two deletes then undo the first restores only the first."

#### Another worked example
**Soft delete with a real undo endpoint (for example a Gmail-like inbox).** DELETE fires immediately; the server sets `deletedAt`. The toast's Undo calls `/restore`. This survives tab closes and works across devices, and a nightly job purges items older than 30 days ("Trash"). On the frontend it's a standard optimistic mutation with `onMutate` snapshot and `onError` rollback, plus an undo mutation that re-inserts. The candidate points out the race: if the user clicks Undo before the DELETE response arrives, the restore must wait for or be ordered after the delete, otherwise the server may process restore first and delete second. Using TanStack mutation scopes, or awaiting the pending delete promise before restoring, fixes it.

#### A third worked example
**Bulk delete of 200 files.** One toast: "200 files deleted · Undo". The candidate batches the request (`POST /files/bulk-delete`), and for undo, a bulk restore. They warn against 200 separate timers and requests, and against an undo window that's too short for a big action. They might also keep a confirm dialog for truly irreversible actions, such as permanently emptying the trash, because undo isn't possible there.

#### Step-by-step framework
1. **Read** the list, mutation, toast system and tests.
2. **Ask** whether the backend supports soft delete; choose a strategy and state the trade-off.
3. **Extend the toast** with an action, pause on hover and focus, polite announcements.
4. **Write the hook spec** precisely: optimistic remove, timers per item, undo, failure rollback, unmount behaviour.
5. **Review** for mutation of cache, premature invalidation, wrong cleanup.
6. **Handle tab close** with keepalive.
7. **Manage focus** after removal.
8. **Test** with fake timers and MSW across the edge cases.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Calls DELETE immediately, Undo does nothing real | Deferred commit or soft delete with restore |
| One global timer for all deletes | Independent pending deletes per item |
| Invalidates the list straight away | Invalidates only after the real delete |
| Restores item at the end of the list | Restores at its original index |
| Toast disappears while being focused | Pauses on hover and focus |
| Focus lost to the body | Moves focus to the next item |
| Ignores tab close | keepalive flush or explicit trade-off |

#### Useful phrases
- "There are two ways to do undo; the choice depends on whether the backend can restore."
- "Undo means the irreversible call hasn't happened yet, or can be reversed."
- "Invalidating now would refetch and bring the item back before it's deleted."
- "If the user navigates away, I commit the delete rather than silently undoing it."
- "The toast pauses while focused, so keyboard users have time to reach Undo."

#### Common pitfalls
- **Fake undo**: the server delete already happened and Undo only changes local state.
- **Premature refetch** that resurrects the item.
- **Mutating the query cache** with splice or push.
- **Timers cleared on unmount**, cancelling deletes the user intended.
- **Toasts that vanish too fast** or aren't announced.
- **Removing the confirm dialog** for actions that truly can't be undone.

#### Follow-ups to expect (with sample answers)
- **"Why is undo better than a confirm dialog?"** — "Confirm dialogs interrupt every delete, and people click through them automatically. Undo keeps the common case fast and still protects against mistakes."
- **"What if the user deletes, then edits another item, then clicks Undo?"** — "Each pending delete is keyed by id, so undo only affects that item. Other mutations are independent."
- **"How would you handle offline?"** — "Queue the delete in the offline mutation queue; Undo removes it from the queue if it hasn't been sent."
- **"What duration would you pick?"** — "Five to eight seconds, paused on hover and focus. Long enough to read and react; WCAG asks that time limits can be extended, which pausing supports."

#### What senior interviewers look for
- **Explicit trade-off** between deferred and soft delete.
- **Data correctness** under rapid actions, failures and navigation.
- **Accessibility** of transient UI.
- Catching the **subtle bugs in AI-generated optimistic code** (premature invalidation, cache mutation).

#### Practise it
- Build the deferred-delete version with TanStack Query and MSW, then ask an AI assistant to generate it and list every bug you find in its first attempt.
- Write the fake-timer tests before the implementation.
- Checklist: strategy · per-item pending map · optimistic remove · index restore · invalidate after commit · failure rollback · unmount commit · keepalive · accessible toast · focus.

#### Variations you might be asked
- "Add undo for archiving emails with a keyboard shortcut."
- "Add an undo and redo history to a drawing canvas."
- "Make bulk actions on a table undoable."

## Extend partial: maze solver — BFS exists, add DFS, then Dijkstra, then diagonal movement
- id: 043ec2d9-c376-425f-87c9-ddafb033fc3e
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: hard
- levels:
- companies: Meta, Anthropic
- tags: AI-assisted, extend, algorithms

### Prompt
You inherit a small TypeScript codebase with a `Maze` class: a 2D grid of cells (`'#'` for walls, `'.'` for open), a `start` and an `end`, and a working `bfs()` method that returns the shortest path as an array of coordinates (or `null`). There is a test file with a handful of mazes. Using the AI assistant, extend it in stages as the interviewer adds constraints: first add DFS, then support weighted cells with Dijkstra, then allow diagonal movement.

### Answer
#### What the interviewer is really testing
- **Reading and reusing existing structure.** BFS, DFS and Dijkstra share one skeleton (a frontier, a visited set, a parent map). Do you see that and refactor towards it, or paste three unrelated algorithms?
- **Algorithmic ownership.** The interviewer wants you to do the algorithmic thinking (which frontier, when to mark visited, why Dijkstra needs a priority queue) and let the AI do boilerplate.
- **Verification of generated data structures.** A hand-rolled min-heap from the AI is a classic source of subtle bugs (sift-down picking the wrong child, off-by-one on the last index).
- **Handling changing requirements** without breaking earlier stages: the BFS tests must still pass at the end.
- **Narration under progressive pressure.** Each stage arrives with ten minutes left on the clock; can you plan out loud quickly?

#### Key points
- **One skeleton, three frontiers:** BFS uses a FIFO queue, DFS a LIFO stack, Dijkstra a min-priority queue keyed by distance. Neighbour generation and path reconstruction are shared.
- **DFS does not find shortest paths.** Say it before the interviewer asks. It finds *a* path, often long and winding. Useful for "is it reachable?" and for maze generation.
- **Mark visited at the right time.** BFS can mark on enqueue. DFS with an explicit stack and Dijkstra must mark (or finalise) on pop, otherwise you get wrong results (Dijkstra) or a non-DFS order.
- **Dijkstra needs non-negative weights.** Stale heap entries are fine if you skip them on pop (`if (d > dist[key]) continue`), which avoids needing decrease-key.
- **Diagonal movement** changes only neighbour generation and costs: cardinal 1, diagonal √2 (or integers 10 and 14 to avoid floats). Decide about **corner cutting**: can you move diagonally between two walls that touch at a corner? Usually no.
- **Keep the existing API stable:** `bfs()` still returns the same shape; new methods follow the same signature.
- **Tests per stage:** DFS returns a valid path (contiguous, avoids walls, starts and ends correctly), not a specific one. Dijkstra returns minimal cost. Diagonal tests include a corner-cutting case.

#### Model answer
"Let me read before I prompt anything. `Maze` holds `grid: string[][]`, `start` and `end` as `{ r, c }`. `bfs()` uses an array as a queue with `shift()`, a `visited` Set of `'r,c'` strings, and a `parent` Map to rebuild the path. Neighbours are generated inline with four direction deltas. Tests check path length for three mazes and `null` for an unreachable one. I'll run them now: all green.

Stage 1, DFS. Structurally DFS is BFS with a stack instead of a queue. Rather than copy the method, I'll first extract the shared pieces: `neighbours(cell)` and `buildPath(parent, end)`. That's a mechanical refactor, so I'll let the AI do it and verify with the existing tests:

```text
In src/Maze.ts, refactor bfs() without changing its behaviour or return type:
extract a private neighbours(cell: Cell): Cell[] method using the existing four
direction deltas and wall check, and a private buildPath(parent: Map<string, Cell>,
end: Cell): Cell[] helper. Keep the 'r,c' string key format. Do not add new
features or change tests.
```

Reviewing the diff: it extracted both helpers, but it also changed `shift()` to an index pointer 'for performance'. That's a good idea, but I asked for no behaviour change, so I'll accept it only because the tests still pass and I can explain it: `shift()` is O(n), a head index makes the queue O(1). I'll mention it rather than let it slip in silently. Tests: green.

Now DFS itself I'll write, because it's ten lines and the interesting decision is when to mark visited. With an explicit stack, I mark on pop, not on push; otherwise a cell discovered early by one branch blocks a deeper branch from visiting it, which isn't true DFS order. It still finds a valid path either way, but I want it correct. I'll say clearly: DFS returns a path, not the shortest path. The test therefore checks validity: starts at start, ends at end, each step is adjacent, no walls.

Stage 2, weighted cells. The interviewer says digits 1 to 9 in the grid are traversal costs. Dijkstra is the same skeleton with a priority queue and a `dist` map. There's no heap in the codebase or in package.json, and I don't want to add a dependency in an interview, so I'll ask the AI for one and test it before using it:

```text
Create src/MinHeap.ts: a generic binary min-heap class MinHeap<T> constructed with
a compare(a: T, b: T) => number function. Methods: push(item), pop(): T | undefined,
peek(), size getter. Array-backed, standard siftUp/siftDown, no dependencies.
Then write src/MinHeap.test.ts that pushes 1000 random numbers and asserts pop()
returns them in sorted order, plus empty-heap cases.
```

Reviewing: siftDown compares the left child, then the right child against the *parent* instead of against the smaller of the two, so it can swap with the larger child. The randomised test would catch it, and it does: one failure. I fix siftDown to pick the smallest of parent, left and right. `pop()` on a one-element heap also had an issue: it moved the last element to index 0 after popping it, re-inserting the removed item. Fixed with an early return when size is 1. Now the heap test passes.

Dijkstra I write myself: `dist` initialised with start at 0, push `[0, start]`, pop the smallest, skip if its distance is stale, stop when we pop `end`, relax each neighbour with `dist + cost(neighbour)`. I'm using lazy deletion rather than decrease-key, so the heap may hold duplicates; that's O(E log E), fine for a grid. Assumption I state: costs are positive. Tests: a maze where the shortest-by-steps path goes through a 9 and a longer path through 1s is cheaper; Dijkstra should take the 1s.

Stage 3, diagonals. Only `neighbours()` and `cost()` change. I'll add an option `{ diagonal: boolean }` defaulting to false so every existing test is untouched:

```text
Update neighbours() in src/Maze.ts to accept { diagonal: boolean }. When true, add
the four diagonal deltas. Disallow corner cutting: a diagonal move from (r,c) to
(r+dr,c+dc) is only allowed if both (r+dr,c) and (r,c+dc) are open. Return each
neighbour with a stepCost: 1 for cardinal, Math.SQRT2 for diagonal, multiplied by
the destination cell weight. Do not change bfs() or dfs() behaviour when diagonal
is false.
```

Review: corner-cutting check is there, but it checked `(r+dr, c+dc)` twice instead of the two orthogonal cells. Classic copy-paste error, I fix it and add a test with two walls touching at a corner. It also applied the √2 cost inside BFS, which is meaningless because BFS counts steps; I keep BFS step-based and document that BFS with diagonals is shortest by moves, not distance. Floating point: comparing path costs in tests uses `toBeCloseTo`.

Final run: all original BFS tests, DFS validity, heap property tests, Dijkstra weighted case, diagonal and corner-cutting cases. Summary for you: the AI did the refactor, the heap and the neighbour boilerplate; I wrote the three search loops and caught three bugs in its output."

#### Another worked example
**Visualising the search in a React frontend.** A frontend variant asks you to animate the explored cells. The candidate turns each algorithm into a generator that `yield`s `{ type: 'visit', cell }` events, so the same skeleton powers both the solver and the animation. The AI scaffolds a `<Grid>` component and a `useStepper(generator, speed)` hook; the candidate reviews it for stale closures in `setInterval` (the AI captured an old generator after reset) and for re-rendering the whole 100×100 grid on every step (fixed by keeping visited cells in a ref and only re-rendering changed cells, or by drawing on a canvas).

#### A third worked example
**A* as the next stage.** If the interviewer adds "make it faster on large open grids", the candidate turns Dijkstra into A* by adding a heuristic to the priority: Manhattan distance for four-way movement, octile distance for eight-way. They point out the heuristic must be admissible (never overestimate) to keep paths optimal, and that using Euclidean with integer costs 10/14 needs consistent scaling. The AI writes the heuristic functions; the candidate checks them against hand-computed values.

#### Step-by-step framework
1. **Read** `Maze`, the existing BFS and the tests; run them.
2. **Refactor first** (neighbours, buildPath) with the AI; prove no behaviour change with the tests.
3. **Write each search loop yourself**, narrating frontier choice and when visited is marked.
4. **Ask the AI for data structures** (heap) with tests in the same prompt; run them before integrating.
5. **Isolate changes behind options** (`diagonal`) so earlier stages keep passing.
6. **Test properties, not exact paths**, where the algorithm doesn't define a unique answer.
7. **Summarise** what the AI did, what you did, and the bugs you caught.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Asks the AI to "add DFS and Dijkstra" in one go | Refactors shared skeleton, then adds one stage at a time |
| Claims DFS finds the shortest path | States DFS finds a path, tests validity |
| Uses the AI's heap without testing it | Randomised heap test catches siftDown bug |
| Uses Dijkstra with decrease-key confusion | Lazy deletion with stale-entry skip |
| Diagonals allowed through wall corners | Explicit corner-cutting rule and test |
| Floating-point equality in cost tests | toBeCloseTo or integer 10/14 costs |
| Breaks BFS tests while adding diagonals | Option flag defaults keep old behaviour |

#### Useful phrases
- "All three are the same loop with a different frontier: queue, stack, priority queue."
- "DFS gives me reachability and a path, not the shortest path."
- "I'll test the heap on its own before I trust Dijkstra on top of it."
- "Lazy deletion is simpler than decrease-key and has the same big-O on a grid."
- "Should diagonal moves be allowed between two walls that touch at a corner?"

#### Common pitfalls
- **Marking visited on push in Dijkstra**, which finalises nodes before their shortest distance is known.
- **Recursive DFS on a large grid**, overflowing the call stack; use an explicit stack.
- **Array `shift()` as a queue** on large inputs without mentioning the O(n) cost.
- **Mixing step counts and weighted costs** in the same method.
- **Accepting the AI's refactor plus extra 'improvements'** without noticing behaviour changes.
- **Testing exact DFS paths**, which ties tests to neighbour order.

#### Follow-ups to expect (with sample answers)
- **"Why not just use Dijkstra everywhere?"** — "On an unweighted grid BFS gives the same answer in O(V + E) without a heap. Dijkstra is only needed when costs vary."
- **"What if some cells have negative cost?"** — "Dijkstra breaks. I'd use Bellman-Ford, or ask whether negative costs are realistic; on a grid they'd usually create exploitable loops."
- **"How would you find the path in a 10,000 × 10,000 grid?"** — "A* with a good heuristic, possibly jump point search for uniform grids, and storing visited as a typed array indexed by r * width + c instead of string keys."
- **"How do you know the AI's heap is correct?"** — "Property test: push random values, pop all, check sorted. Plus edge cases: empty, one element, duplicates."

#### What senior interviewers look for
- Seeing the **shared abstraction** and refactoring towards it before extending.
- **Clear division of labour**: algorithmic core by hand, mechanical parts by the AI.
- **Bugs caught by tests you chose to write**, not by luck.
- **Stable APIs** across stages and explicit assumptions (positive weights, corner cutting).

#### Practise it
- Implement BFS on a grid, then ask an AI assistant for a min-heap and write the randomised test before reading its code. Count the bugs.
- Time yourself: each stage in under 12 minutes, narrating aloud.
- Checklist: run tests first · extract neighbours and buildPath · DFS validity test · heap property test · stale-entry skip · positive-weight assumption · diagonal flag · corner cutting · toBeCloseTo · summary.

#### Variations you might be asked
- "Add A* with a Manhattan heuristic."
- "Return all shortest paths, not just one."
- "Add keys and doors: a door can be passed only after collecting its key."
- "Animate the search in the browser."

## Extend partial: rate limiter — fixed window exists, add sliding window, then distributed
- id: d80a6f02-e699-4ab2-ae2f-49fb0da1b67e
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: hard
- levels:
- companies: Stripe, Anthropic, OpenAI
- tags: AI-assisted, extend, distributed-systems, rate-limiting

### Prompt
The codebase has a `RateLimiter` class with `allow(userId: string): boolean`, implementing a fixed window of 100 requests per minute in memory, plus a small test file using fake timers. Using the AI assistant, extend it in stages: first a sliding window, then a memory-efficient sliding window, then make it work across multiple server instances.

### Answer
#### What the interviewer is really testing
- **Knowing the algorithms and their trade-offs**: fixed window, sliding log, sliding window counter, token bucket.
- **Spotting the boundary problem** of fixed windows (200 requests in two seconds across a minute boundary) and explaining why sliding windows fix it.
- **Owning the subtle maths** (weighting the previous window) rather than accepting whatever the AI produces.
- **Distributed correctness**: atomicity, race conditions between instances, clock skew, failure modes when Redis is down.
- **Reviewing AI-generated concurrency code**, which often looks right and is not atomic.

#### Key points
- **Fixed window** is cheap (one counter per user per window) but allows bursts of up to 2× the limit at window boundaries.
- **Sliding log**: store each request timestamp per user; on `allow()`, drop timestamps older than the window, count, accept if under the limit. Exact, but memory is O(limit) per user.
- **Sliding window counter**: keep the current and previous window counts. Estimated count = `current + previous × (1 − elapsedFractionOfCurrent)`. O(1) memory, approximate, and good enough for almost everyone (Cloudflare uses it).
- **Token bucket**: capacity C, refill rate R per second; allows controlled bursts. Often the best fit for APIs.
- **Distributed**: state must live in a shared store (Redis). Read-then-write from the app is a race; make the check-and-increment atomic with a Lua script, or `MULTI` with care.
- **Time source**: use Redis time (`TIME`) or a single clock, not each instance's clock, to avoid skew.
- **Failure mode**: decide fail-open (allow if Redis is down) or fail-closed. For a public API usually fail-open with alerts; for an expensive or abusive endpoint, fail-closed.
- **Response headers**: `429 Too Many Requests`, `Retry-After`, and `RateLimit-*` headers so clients can back off.

#### Model answer
"Reading first. `RateLimiter` has a `Map<string, { windowStart: number, count: number }>`, `limit` and `windowMs` from the constructor, and `allow()` resets the count when `now - windowStart >= windowMs`. It uses `Date.now()` directly. Tests use Jest fake timers. I'll run them: green.

Before extending, a quick note on why we'd change it: with a fixed window, a user can send 100 requests at 12:00:59 and 100 more at 12:01:00, so 200 in one second. Sliding windows fix that.

One small refactor first so tests can control time without fake timers everywhere: inject a `now: () => number` clock defaulting to `Date.now`. I'll ask the AI to do that mechanically and keep behaviour the same. Tests still green.

Stage 1, sliding log. Data structure: per user, an array of timestamps in ascending order. On allow: drop entries older than `now - windowMs` from the front, if length < limit push now and return true, else false.

```text
In src/RateLimiter.ts add allowSlidingLog(userId: string): boolean. Store a
Map<string, number[]> of ascending timestamps per user. Use the injected
this.now() clock. Remove expired timestamps from the front (they are sorted),
then accept if the remaining count is below this.limit. Do not record rejected
requests. Add tests: 100 allowed, 101st rejected, allowed again once the oldest
timestamp leaves the window.
```

Reviewing: it filters the whole array with `.filter(t => t > now - windowMs)` on every call. Correct, but O(n) allocation per request; since it's sorted, I'll use a head index or `splice(0, k)` after finding k. More importantly, it pushes the timestamp *before* checking the limit, so rejected requests are recorded and a user hammering the endpoint is locked out forever. That's a real bug and my test for 'allowed again after the window' catches it. Fixed by pushing only on accept. Also: empty arrays are never deleted, so the Map grows with every user ever seen. I'll delete the key when the array empties.

Memory: this is O(limit) per active user, 100 numbers each. With a million active users that's 100 million timestamps. That motivates stage 2.

Stage 2, sliding window counter. This is the maths I'd rather own. For each user store `{ windowStart, current, previous }`. On allow:
- Compute which window `now` is in: `start = floor(now / windowMs) * windowMs`.
- If `start` moved on by exactly one window, `previous = current; current = 0`. If by more than one, both become 0.
- `elapsed = (now - start) / windowMs`, a fraction from 0 to 1.
- `estimate = current + previous * (1 - elapsed)`.
- If `estimate < limit`, increment current and allow.

I'll write this myself and ask the AI only for the test table:

```text
Write table-driven Jest tests for allowSlidingCounter with limit 10, windowMs
60000 and an injected clock. Cases: 10 requests at t=0 then one at t=59000 is
rejected; 10 requests at t=50000 then at t=90000 the estimate is
0 + 10 * (1 - 0.5) = 5 so 5 more are allowed and the 6th rejected; a gap of
more than two windows resets everything.
```

Reviewing the tests: one case expected 6 allowed instead of 5. I computed it by hand: at t=90000 we're halfway through the second window, previous=10, so estimate starts at 5 and allows 5. The AI's expectation was wrong, which is exactly why I don't let it write both the code and the expected values.

Stage 3, distributed. Now four API instances behind a load balancer. In-memory state means each instance allows 100, so 400 total. State moves to Redis. For the sliding log, Redis sorted sets fit: `ZREMRANGEBYSCORE key 0 (now - window)`, `ZCARD key`, `ZADD key now member`, `PEXPIRE key window`.

The trap: doing `ZCARD` in one call and `ZADD` in another lets two instances both read 99 and both add, giving 101. A pipeline doesn't fix that; it only batches network calls. `MULTI/EXEC` makes them atomic, but I can't branch on the count inside a transaction. So I'll use a Lua script, which Redis runs atomically:

```text
Write a Redis Lua script for a sliding-log rate limiter. KEYS[1] = key. ARGV:
now (ms), windowMs, limit, member (unique request id). Steps: ZREMRANGEBYSCORE
KEYS[1] 0 now-windowMs; count = ZCARD; if count < limit then ZADD now member and
PEXPIRE windowMs and return 1 else return 0. Then a TypeScript wrapper using
ioredis defineCommand. Do not use redis.call('TIME') yet.
```

Review: the script used `now` as the ZADD member, so two requests in the same millisecond collapse into one entry. That's why I passed a unique member; the AI ignored it in one branch, I fix it. It set `PEXPIRE` before checking, so rejected requests extend the key's life; harmless but I move it. Clock: instances' clocks can drift, so in production I'd call `redis.call('TIME')` inside the script and stop passing `now` (Redis 5+ replicates scripts by effects, so that's allowed). Failure mode: the wrapper should catch Redis errors and fail open with a metric, and I'd ask the product owner whether that's acceptable. Cost: sorted sets are heavy at high volume, so for scale I'd move to the sliding counter in Redis (two `INCR`ed keys per window, also in Lua) or a token bucket.

Tests: unit tests for the pure algorithms with the injected clock, and an integration test against a real Redis in Docker that fires 200 concurrent `allow()` calls with `Promise.all` and asserts exactly 100 return true. That test fails with the non-atomic version and passes with Lua."

#### Another worked example
**Client-side throttling in a frontend.** A frontend variant: the search box calls an API that returns 429 when hit too often. The candidate adds a client-side token bucket (capacity 5, refill 1 per second) around the fetch wrapper, honours `Retry-After` on 429 with exponential backoff and jitter, and debounces typing at 300 ms. The AI generates the backoff; the candidate catches that it retries non-idempotent POSTs and that its jitter is applied before capping, so delays can exceed the maximum. They point out client-side limits are a courtesy, never a security control; the server still enforces.

#### A third worked example
**Token bucket for a payments API.** The interviewer wants bursts allowed: 20 requests instantly, then 5 per second. The candidate stores `{ tokens, lastRefill }` and on each call adds `(now - lastRefill) / 1000 * rate` tokens, capped at capacity, then consumes one. In Redis it's a Lua script with `HMGET`/`HSET`. They mention per-key limits (per API key, per IP, per endpoint) layered together, and that Stripe-style APIs often combine a request-rate limiter with a concurrency limiter for expensive endpoints.

#### Step-by-step framework
1. **Read** the class and tests; note the clock and storage.
2. **Explain the flaw** in the current algorithm (boundary bursts).
3. **Inject the clock** so time is testable.
4. **Sliding log**: let the AI scaffold, review for recording rejected requests and memory leaks.
5. **Sliding counter**: write the weighting maths yourself, compute test expectations by hand.
6. **Distributed**: move state to Redis, make check-and-update atomic with Lua, use one clock.
7. **Decide failure mode** and response headers.
8. **Prove atomicity** with a concurrent integration test.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Doesn't know why fixed windows are a problem | Explains 2× burst at boundaries |
| Accepts AI code that records rejected hits | Catches permanent lockout with a test |
| Lets the AI write code and expected values | Computes expectations by hand |
| Believes a pipeline is atomic | Uses Lua for atomic check-and-add |
| Uses each server's clock | Uses Redis TIME or one clock |
| Ignores Redis outages | Explicit fail-open or fail-closed choice |
| No headers for clients | 429 with Retry-After and RateLimit headers |

#### Useful phrases
- "A pipeline batches round trips; it doesn't make read-then-write atomic."
- "The sliding counter trades exactness for constant memory, and the error is small in practice."
- "I'll compute the expected values myself so the AI isn't grading its own homework."
- "What should happen when Redis is unavailable: allow or reject?"
- "Rejected requests shouldn't count against the window, or users are locked out indefinitely."

#### Common pitfalls
- **TOCTOU races** between instances reading and writing counts.
- **Same-millisecond requests** collapsing in a sorted set because the member isn't unique.
- **Unbounded memory**: never deleting idle users' state.
- **Floating-point drift** in token buckets without capping.
- **Rate limiting only by IP**, which punishes users behind shared NAT and misses distributed abuse.
- **No observability**: no metrics on rejections, so false positives go unnoticed.

#### Follow-ups to expect (with sample answers)
- **"Which algorithm would you ship?"** — "Token bucket or sliding window counter in Redis via Lua: constant memory, atomic, allows a configurable burst. Sliding log only when exactness matters and volume is low."
- **"How would you avoid Redis being a bottleneck?"** — "Shard keys across a Redis Cluster by user id, keep scripts O(1), and optionally do a local pre-check that rejects obvious abusers without a round trip."
- **"What about multiple regions?"** — "Either per-region limits (simple, slightly over-permissive) or a global store with higher latency. Most systems accept per-region limits."
- **"How do you test it under concurrency?"** — "Fire N parallel requests against a real Redis and assert exactly the limit succeed; run it many times to shake out races."

#### What senior interviewers look for
- **Trade-off fluency** across the four algorithms.
- **Atomicity instinct** the moment state is shared.
- **Operational thinking**: failure modes, clocks, metrics, headers.
- **Using the AI for scaffolding while owning the maths and the concurrency.**

#### Practise it
- Implement fixed window, sliding log, sliding counter and token bucket with an injected clock in one evening, with table-driven tests.
- Ask an AI assistant for a Redis rate limiter and look for: pipelines claimed atomic, non-unique members, missing expiry.
- Checklist: boundary-burst explanation · injected clock · don't record rejected · delete idle keys · hand-computed expectations · Lua atomicity · unique member · Redis TIME · fail-open decision · 429 headers · concurrency test.

#### Variations you might be asked
- "Add per-endpoint limits on top of per-user limits."
- "Add a concurrency limiter: at most 3 in-flight requests per user."
- "Make the limit configurable per plan tier without redeploying."

## Extend partial: state machine — basic transition exists, add guards and actions
- id: 75efd6c2-76cb-4a1e-897a-c5504d1bca35
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, extend, state-machine

### Prompt
The codebase has a `StateMachine` class configured with states and their transitions, for example an order flow (`draft → submitted → paid → shipped`, with `cancel` from several states), and a `transition(event)` method that moves to the next state or ignores unknown events. Using the AI assistant, extend it to support guards (conditions that must be true for a transition to happen) and actions (side effects that run when a transition happens).

### Answer
#### What the interviewer is really testing
- **API design**: how guards and actions fit into the existing config without breaking current users.
- **Semantics**: when do actions run relative to the state change, what context they see, what happens if one throws.
- **Purity and testability**: keeping guards pure and side effects isolated.
- **Reviewing AI output** for subtle ordering bugs and for over-engineering (the AI loves to reinvent XState).
- **Knowing the prior art** (XState, statecharts) without importing all of it.

#### Key points
- **Config shape stays backwards compatible:** a transition can still be a string target (`submit: 'submitted'`) or become an object `{ target, guard?, actions? }`. Normalise both internally.
- **Context:** the machine needs extended state (for example `{ total, paymentId }`). Add `context` to the constructor; guards read it, actions can update it.
- **Guards** are pure predicates `(context, event) => boolean`. If false, the transition doesn't happen and the machine stays put. Support an array of candidate transitions for one event so the first passing guard wins (`submit` goes to `review` if total > 1000, else `submitted`).
- **Actions:** decide the order. A common, defensible order is exit actions of the old state, transition actions, then entry actions of the new state, then commit.
- **Errors in actions:** either roll back (don't change state, rethrow) or commit and report. Prefer pure "assign" actions for context updates (which can be computed before committing) and keep effectful actions (API calls) outside or after commit.
- **Events carry payloads:** `transition({ type: 'PAY', paymentId })` rather than strings only, but keep string events working.
- **Return value:** return the result (`{ changed, state, context }`) so callers and tests can see what happened.
- **Subscribers:** notify listeners after a successful transition, never on rejected ones.

#### Model answer
"Reading first. `StateMachine` takes `{ initial, states }` where `states.draft.on = { SUBMIT: 'submitted', CANCEL: 'cancelled' }`. `transition(event: string)` looks up `states[current].on[event]`, sets `current` if found, and calls `listeners` with the new state. Unknown events are ignored silently. Tests cover the happy path and an ignored event. All green.

Questions for you before I design anything: should guards see an event payload? And if an action throws, should the state change stick? My default: payloads yes; and the state change should not happen if a synchronous action throws, so the machine never ends up half-transitioned.

Plan:
1. Add `context` to the constructor and make events accept `string | { type, ...payload }`.
2. Normalise transition config: string, object, or array of objects.
3. Guards: evaluate candidates in order, pick the first that passes.
4. Actions: exit, transition, entry, in that order, computed against a draft context; commit only if all succeed.
5. Keep `transition()` returning a result object, and keep the old behaviour for string configs.

The normalisation is mechanical, so that goes to the AI with a tight spec:

```text
In src/StateMachine.ts, without changing behaviour for existing configs:
1. Accept an optional context in the constructor; expose machine.context.
2. Allow transition(event) where event is a string or { type: string, ...payload };
   normalise to an object internally.
3. A transition config entry may be: a target string, { target, guard?, actions? },
   or an array of those. Write a private normalise(entry) returning an array of
   { target, guard, actions[] }.
guard signature: (context, event) => boolean. action signature:
(context, event) => Partial<Context> | void. Do not implement evaluation yet.
```

Review: the normalisation is fine, but it typed `actions` as a single function or array and then only handled the array case, so a single function would be silently dropped. I'll normalise it to an array. It also added hierarchical state support 'for future use' with a `parent` field; that's scope creep that I'll delete, since nothing asked for it and it adds untested paths.

Now the evaluation, which I'll write myself because the ordering is the actual design:

```text
transition(event):
  candidates = normalise(states[current].on?.[event.type])
  chosen = first candidate where !guard or guard(context, event)
  if none: return { changed: false, state: current, context }
  draft = { ...context }
  for each fn in [...states[current].exit, ...chosen.actions, ...states[target].entry]:
     patch = fn(draft, event); if patch: draft = { ...draft, ...patch }
  current = target; context = draft
  notify listeners
  return { changed: true, state: current, context }
```

Actions run against a draft, so if one throws, nothing is committed and the error propagates to the caller. That gives us all-or-nothing semantics for context updates. Async side effects like calling the payment API shouldn't live inside the synchronous transition; I'd model them as states (`paying` with `PAYMENT_SUCCEEDED` and `PAYMENT_FAILED` events) or run them from a listener after commit. I'll say that out loud because it's the difference between a toy and something usable in a UI.

Self-transitions: if the target equals the current state, do we re-run exit and entry? XState distinguishes internal and external transitions. I'll keep it simple: for a self-transition run only transition actions, and document it.

Tests, which I'll ask the AI to draft and then check every expected value:
- String configs behave exactly as before.
- A guard returning false leaves the state and context unchanged and doesn't notify listeners.
- With two candidates for `SUBMIT`, total 1500 goes to `review`, total 200 to `submitted`.
- Actions run in exit, transition, entry order (record calls into an array).
- An action that throws leaves state and context as they were.
- Context patches from actions are visible to later actions in the same transition.

The AI's draft had an order test expecting entry before exit; I corrected it to match the semantics we chose. Everything green."

#### Another worked example
**A multi-step form wizard in React.** States `details → address → payment → review → submitted`. Guards check that each step's fields are valid before `NEXT`; `BACK` has no guard. Actions save the step's data into context. The candidate wraps the machine in a `useMachine(machine)` hook with `useSyncExternalStore` so React re-renders on transitions, and asks the AI for the hook. The review catches that the AI's hook recreated the machine on every render (losing state) because it was constructed inside the component; fixed with `useState(() => createMachine(config))`. They also show the payoff: impossible states like 'submitting while on the address step' can't happen.

#### A third worked example
**Media player.** `idle → loading → playing ⇄ paused`, with `ERROR` from loading or playing. A guard prevents `PLAY` when no source is set. Entry action on `playing` starts a progress timer, exit action stops it, so the timer can't leak when the state changes by any route. This shows why entry and exit actions are cleaner than putting cleanup in every transition.

#### Step-by-step framework
1. **Read** the config shape, transition logic and tests; run them.
2. **Ask** about payloads and error semantics; state your defaults.
3. **Extend the config** backwards-compatibly; let the AI normalise.
4. **Write the evaluation order yourself**: guards, then exit, transition, entry actions on a draft context, then commit and notify.
5. **Keep async effects out** of synchronous transitions; model them as states.
6. **Review** for dropped single actions, scope creep and wrong order.
7. **Test** compatibility, guards, ordering, rollback and context visibility.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Breaks existing string configs | Normalises old and new shapes |
| Changes state, then runs actions that may throw | Runs actions on a draft, commits only on success |
| Guards with side effects | Pure guards on context and event |
| Notifies listeners even when rejected | Notifies only after a committed change |
| Awaits API calls inside transition() | Models async work as states and events |
| Accepts AI-added hierarchy and history states | Removes scope creep, defers until asked |
| No return value, tests inspect internals | Returns { changed, state, context } |

#### Useful phrases
- "A guard decides whether; an action decides what happens as a result."
- "I'd rather the machine reject a transition than end up half-transitioned."
- "Async work becomes states, so loading and failure are visible and testable."
- "That's a statechart feature; useful, but not what we were asked for, so I'll leave it out."
- "Old configs must behave identically; that's my first test."

#### Common pitfalls
- **Mutating context directly** inside actions, so a failure leaves partial changes.
- **Ambiguous order** of exit, transition and entry actions.
- **Guards that read stale context** because context is captured at construction.
- **Swallowing errors** from actions, hiding bugs.
- **Over-generalising** into a full statechart engine in a 45-minute round.
- **String-only events**, forcing payloads into globals.

#### Follow-ups to expect (with sample answers)
- **"What if an action needs to call an API?"** — "I'd add an intermediate state such as `paying`, start the call from an entry effect or a listener, and send `SUCCESS` or `FAILURE` events back in. The transition itself stays synchronous."
- **"How would you add hierarchical states?"** — "States get a `states` child map; events bubble from the active leaf up to parents until one handles it; exit actions run from leaf up, entry from top down. I'd reach for XState rather than build it in production."
- **"How would you visualise or debug it?"** — "Log each transition with event, from, to and context diff; the config is data, so it can be rendered as a diagram."
- **"Why not just useReducer?"** — "A reducer works, but a machine makes allowed transitions explicit, so invalid events are rejected by design instead of by scattered if-statements."

#### What senior interviewers look for
- **Clear semantics** chosen deliberately and stated: order, rollback, self-transitions.
- **Backwards compatibility** as a first-class requirement.
- **Effects isolated** from pure transition logic.
- **Restraint** with AI-generated extras.

#### Practise it
- Build the order-flow machine with guards and actions, then compare your semantics with XState's documentation on action order.
- Ask an AI assistant to add guards to a simple machine and check whether it commits state before running actions.
- Checklist: compatible config · context in constructor · event payloads · first passing guard wins · draft context · exit, transition, entry order · commit then notify · async as states · tests for rollback.

#### Variations you might be asked
- "Add delayed transitions (after 5 seconds go to timeout)."
- "Add a history so the machine can return to the previous state."
- "Persist and restore the machine state across page reloads."

## Extend partial: promise pool — concurrency exists, add priority queue
- id: 09bb89f7-c9f8-4a38-a812-589c9c014cef
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, extend, concurrency, data-structures

### Prompt
The codebase has a `PromisePool` class: `new PromisePool(concurrency)`, `pool.add(task)` where a task is `() => Promise<T>`, returning a promise for that task's result. It runs at most N tasks at once and starts the next queued task when one finishes. Using the AI assistant, extend it so each task can have a priority, and higher-priority tasks start before lower-priority ones that are still waiting.

### Answer
#### What the interviewer is really testing
- **Understanding the existing concurrency control**: where the queue is, how slots free up, how results and errors flow back.
- **Choosing the data structure**: a heap versus a sorted array versus buckets, and stability for equal priorities.
- **Integration judgment**: the AI can write a heap; wiring it in correctly is your job.
- **Concurrency edge cases**: tasks that throw synchronously, tasks that never settle, starvation of low priorities.
- **Testing async scheduling deterministically.**

#### Key points
- **Only the waiting queue changes.** Replace the FIFO array with a priority queue; the slot-counting logic stays.
- **No preemption:** a running task can't be paused. Priority affects only which waiting task starts next. Say this out loud.
- **Stable ordering:** equal priorities should run in insertion order (FIFO). Binary heaps aren't stable, so add a sequence number as a tie-breaker: compare by `priority`, then `seq`.
- **Data structure choice:** a binary heap gives O(log n) insert and remove. If priorities are a small fixed set (high, normal, low), an array of FIFO queues per level is simpler and O(1).
- **Starvation:** with constant high-priority traffic, low tasks never run. Mitigate with ageing (increase priority with waiting time) or a weighted share.
- **Error isolation:** one task rejecting must not stop the pool; the slot must be released in `finally`. A task that throws synchronously (before returning a promise) must also be handled.
- **API compatibility:** `add(task)` keeps working with a default priority; new signature `add(task, { priority })`.
- **Convention:** decide whether a higher number means higher priority, and name it so (`priority: 10` beats `priority: 1`), or use named levels.

#### Model answer
"Reading first. `PromisePool` holds `concurrency`, `running = 0`, and `queue: Array<{ task, resolve, reject }>`. `add()` returns a new promise, pushes the entry, and calls `next()`. `next()` does `while (running < concurrency && queue.length)`: shift an entry, increment running, call `task().then(resolve, reject).finally(() => { running--; next(); })`. Tests check that at most N run at once and that results resolve in the right promises.

I see one existing bug while reading: if `task()` throws synchronously, the exception escapes `next()` and `running` is incremented but never decremented, so the pool permanently loses a slot. I'll note it and fix it as part of this change by wrapping with `Promise.resolve().then(task)` or a try/catch. I'll add a test for it first so the fix is proven.

Design: the only thing that changes is how `next()` picks the entry. I want higher numbers to mean higher priority, default 0, and FIFO among equals. A binary heap whose comparator orders by priority descending, then by `seq` ascending when priorities are equal, gives both.

I'll get the heap from the AI, with tests in the same prompt:

```text
Create src/PriorityQueue.ts: a generic binary heap PriorityQueue<T> constructed
with compare(a, b): number where a negative result means a comes out first.
Methods: push(item), pop(): T | undefined, size getter. No dependencies.
Tests: pushing items with priorities [1, 5, 3, 5, 0] and seq tie-breaker pops
in order 5(first), 5(second), 3, 1, 0; empty pop returns undefined; 500 random
items pop in sorted order.
```

Reviewing the heap: siftDown loops `while (2 * i + 1 < this.size)` correctly, picks the better child correctly. One issue: `pop()` doesn't handle size 1 properly; it reads the last element, assigns it to index 0, then pops, which returns the right value but leaves a duplicate in some paths. The 'empty after popping one' test caught it. Fixed.

Integration is mine:

```text
add(task, { priority = 0 } = {}):
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject, priority, seq: this.seq++ })
    this.next()
  })

next():
  while (running < concurrency && queue.size > 0):
    const { task, resolve, reject } = queue.pop()
    running++
    Promise.resolve()
      .then(task)            // catches synchronous throws too
      .then(resolve, reject)
      .finally(() => { running--; this.next() })
```

One subtlety: because `add()` calls `next()` synchronously, if the pool has free slots, a low-priority task added first will start immediately, before a high-priority task added in the same tick. That's correct behaviour (there was a free slot), but it surprises people. If the interviewer wants batch-submitted tasks ordered by priority, I can defer `next()` with `queueMicrotask` so all tasks added in the same tick are queued before any start. I'll ask which they want.

Starvation: I'll mention ageing. Each time we pop, we could add a small bonus based on wait time, but that breaks the heap invariant because priorities change over time. The simpler practical approach: a fixed set of levels with weighted round-robin, say 3 high for every 1 normal. I'd only build it if asked.

Tests, written with controllable promises (deferreds) rather than timers so they're deterministic:
- Concurrency 1: start a blocker, add low then high then medium; release the blocker; start order is high, medium, low.
- Equal priorities start in insertion order.
- A task that rejects frees its slot and the next one starts.
- A task that throws synchronously rejects its own promise and frees its slot (the bug I found).
- `add(task)` with no options still works.
- At most N running at any moment, checked with a counter inside tasks.

All green, including the regression test for the slot leak."

#### Another worked example
**Image loading in a gallery.** A frontend version: a pool of 6 concurrent image fetches where images in the viewport get high priority, nearby ones normal, and the rest low. As the user scrolls, priorities change. The candidate adds `pool.reprioritise(id, priority)` which, in a heap, means remove and re-insert (or mark stale and push a new entry, skipping stale ones on pop). They also add cancellation with `AbortController` for images scrolled far away, and point out that browsers already support `fetchpriority="high"` and `loading="lazy"`, which may solve most of it natively.

#### A third worked example
**API request scheduler with retries.** User-initiated requests get high priority, background prefetches low. Failed requests are re-queued with backoff at their original priority. The candidate warns that retries going to the front of the queue can starve fresh work, so retries re-enter with their original sequence number or a delay. They also add a timeout per task so a hanging request can't hold a slot forever.

#### Step-by-step framework
1. **Read** the pool and find where tasks are queued and slots released.
2. **Look for existing bugs** (synchronous throws leaking slots) and add a regression test.
3. **Choose the structure**: heap with priority and sequence, or per-level queues.
4. **Ask the AI for the heap with tests**, review and run them.
5. **Integrate yourself**, keeping the slot logic and error handling intact.
6. **Clarify same-tick semantics** and decide whether to defer scheduling.
7. **Mention preemption and starvation** explicitly.
8. **Test with deferred promises**, not timers.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Sorts the whole array on every add | Heap or per-level queues with clear complexity |
| Equal priorities come out in random order | Sequence number tie-breaker keeps FIFO |
| Thinks priority can interrupt running tasks | States no preemption, only start order |
| Slot leaks on synchronous throw | Promise.resolve().then(task) and finally |
| Ignores starvation | Mentions ageing or weighted round-robin |
| Timer-based flaky tests | Deterministic deferred-promise tests |
| Changes the add() signature for everyone | Optional options object with default priority |

#### Useful phrases
- "Priority only decides who starts next; it can't pause what's already running."
- "Heaps aren't stable, so I add a sequence number as the tie-breaker."
- "Before I change anything, there's an existing slot leak on synchronous throws."
- "Do you want tasks added in the same tick to be ordered by priority before any start?"
- "With three fixed levels, three FIFO arrays are simpler than a heap."

#### Common pitfalls
- **Releasing the slot only on success**, so failures shrink the pool.
- **Comparator sign errors**, giving lowest-priority-first.
- **Recursion in next()** that grows the stack with many synchronous tasks; a loop avoids it.
- **Testing with setTimeout delays**, which are slow and flaky.
- **Losing results**: resolving the wrong promise when the queue reorders entries.
- **Accepting an AI heap** without a randomised test.

#### Follow-ups to expect (with sample answers)
- **"How would you support cancellation?"** — "`add()` accepts an AbortSignal. If aborted while queued, remove or mark the entry and reject with an AbortError; if running, pass the signal into the task so it can stop."
- **"How would you change concurrency at runtime?"** — "Update the limit and call next(); if it shrinks, running tasks finish naturally and no new ones start until we're under the limit."
- **"What's the complexity?"** — "O(log n) per add and per start with a heap; O(1) with fixed per-level queues."
- **"How would you add `onIdle()`?"** — "Return a promise that resolves when running is 0 and the queue is empty, checked in the finally handler."

#### What senior interviewers look for
- **Finding the latent bug** before extending.
- **Correct, stable ordering** with an explicit tie-breaker.
- **Honest limits** (no preemption, starvation) stated unprompted.
- **Deterministic async tests.**

#### Practise it
- Write a promise pool from scratch in 15 minutes, then add priorities with a heap you ask an AI to generate.
- Write the synchronous-throw test against your first version and see whether it leaks a slot.
- Checklist: read slot logic · find leak · regression test · heap with seq · comparator direction · integrate with finally · same-tick question · starvation note · deferred-promise tests.

#### Variations you might be asked
- "Add a per-task timeout."
- "Add pause() and resume()."
- "Limit concurrency per key (at most 2 requests per host) as well as globally."

## Extend partial: event emitter — basic on/off/emit exists, add wildcard listeners
- id: f92db2f6-acd3-4447-bdff-a784921ca475
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, extend, pubsub

### Prompt
The codebase has an `EventEmitter` with `on(event, fn)`, `off(event, fn)` and `emit(event, ...args)`, with event names like `user.login` and `cart.item.added`. Using the AI assistant, add support for `on('*', fn)` to receive every event and namespace patterns such as `on('user.*', fn)`.

### Answer
#### What the interviewer is really testing
- **Clarifying semantics** before writing code: does `user.*` match `user.profile.updated`? Does `*` alone match everything? What arguments does a wildcard listener receive?
- **Data structure choice**: scan all patterns on each emit, or index them by segment (a trie).
- **Correct emit behaviour**: removing listeners during emit, errors in one listener, duplicate registrations.
- **Keeping `off` and `once` consistent** with the new patterns.
- **Reviewing AI-generated regex code**, which is a common source of bugs (unescaped dots, missing anchors).

#### Key points
- **Agree the grammar.** A common choice: segments separated by `.`; `*` matches exactly one segment; `**` (or a trailing `#`, as in AMQP) matches zero or more segments; a bare `*` subscribes to everything. Confirm with the interviewer.
- **Wildcard listeners need the event name**, since they handle many events: call `fn(eventName, ...args)` or pass an event object. Decide and keep it consistent.
- **Storage:** keep exact listeners in `Map<string, Set<fn>>` (fast path) and pattern listeners in a separate list or trie. Emit looks up exact listeners in O(1) plus matching patterns.
- **Matching:** split both into segments and compare, rather than building regexes; it's clearer and avoids escaping bugs. If you do use a regex, escape dots and anchor with `^` and `$`.
- **Snapshot before iterating:** copy the listener list at the start of emit so listeners added or removed during emit don't affect the current dispatch.
- **Errors:** one throwing listener shouldn't stop the others; collect errors and rethrow after, or report them (Node emits an `error` event).
- **Duplicates:** if the same function is registered under `user.login` and `user.*`, it fires twice by default. That's usually correct; mention it.
- **off() with patterns** must remove the pattern listener exactly; `once` wrappers must be removable by the original function.

#### Model answer
"Reading first. `EventEmitter` has `listeners: Map<string, Set<Function>>`. `on` adds to the set and returns an unsubscribe function, `off` deletes, `emit` iterates `listeners.get(event)` and calls each with `...args`. There's a `once` that wraps the function and stores the wrapper, so `off(event, original)` doesn't currently remove a `once` listener; I'll note that as an existing bug. Tests cover on, off, emit, once.

Clarifying questions, with my defaults if you'd rather I decide:
1. Does `user.*` match `user.profile.updated`? My default: no, `*` is one segment, and I'll add `**` for any depth if you want it.
2. Does a bare `*` match everything including multi-segment events? Default: yes, `*` alone is a special 'all events' subscription, which is what most people expect.
3. Do wildcard listeners need the event name? Default: yes, so they get `(eventName, ...args)`. Exact listeners keep their current `(...args)` signature so nothing breaks.

Plan: keep the exact Map as the fast path; add `patternListeners: Array<{ pattern, segments, fn }>` and `allListeners: Set<fn>`. `on()` routes by whether the name contains `*`. `emit()` calls exact, then patterns that match, then all-listeners, from a snapshot.

The matching function is small and the part where bugs hide, so I'll write it myself:

```text
matches(patternSegs, eventSegs):
  if patternSegs.length !== eventSegs.length: return false   // single-segment * only
  every index i: patternSegs[i] === '*' or patternSegs[i] === eventSegs[i]
```

If you later want `**`, it becomes a small recursive match. I'll ask the AI for the routing and storage changes:

```text
In src/EventEmitter.ts, add wildcard support without changing behaviour for exact
event names. on(name, fn): if name === '*' add fn to this.allListeners; else if
name contains '*' push { pattern: name, segments: name.split('.'), fn } to
this.patternListeners; else use the existing Map. off(name, fn) must remove from
the right store. emit(name, ...args): take a snapshot array of exact listeners
(called with ...args), matching pattern listeners and all-listeners (both called
with name, ...args), then call them in that order. Use the existing matches()
helper I've written. If a listener throws, keep calling the others and rethrow
the first error at the end.
```

Reviewing: it builds the snapshot correctly for exact listeners but iterates `this.patternListeners` live, so a pattern listener that calls `off` on itself during emit causes the next listener to be skipped (array index shift). I'll snapshot that too. It used `name.includes('*')` for routing, fine. In `off`, it removed pattern listeners with `filter(l => l.fn !== fn)`, which removes that function from *every* pattern, not just the named one. Fixed to match both pattern and fn. The error handling is right.

While here, I'll fix the existing `once` bug: store `wrapper.original = fn` and have `off` match either the function or `wrapper.original`. That also makes `once('user.*', fn)` removable.

Performance: emit now scans all pattern listeners, O(P) per emit. For a UI app with dozens of patterns that's nothing. If we had thousands, I'd index patterns in a trie keyed by segment, with a `*` child at each level, so emit walks only matching branches. I'll mention it rather than build it.

Tests:
- Exact listeners unchanged, same arguments.
- `user.*` receives `user.login` with the name first, and doesn't receive `user.profile.updated` or `cart.add`.
- `*` receives everything.
- A function registered on both `user.login` and `user.*` fires twice.
- `off('user.*', fn)` removes only that pattern registration.
- A listener removing itself during emit doesn't cause another to be skipped.
- A throwing listener doesn't stop the rest, and the error surfaces.
- `once` with an exact name and a pattern can both be removed via the original function."

#### Another worked example
**Analytics event bus in a frontend app.** Components emit `checkout.step.viewed`, `checkout.payment.failed`. An analytics module subscribes to `**`, an error tracker to `*.*.failed` (or `**.failed`), and a debug panel to everything in development. The candidate uses the same segment matcher extended for `**`, and adds a `useEvent(name, handler)` React hook. Reviewing the AI's hook, they catch that it re-subscribes on every render because the handler is a new function each time; they store the handler in a ref and subscribe once per event name, and make sure the effect returns the unsubscribe function.

#### A third worked example
**Typed events in TypeScript.** The interviewer asks for type safety: `emitter.on('user.login', (p) => p.userId)` should be typed. The candidate defines an `Events` map type and a generic `on<K extends keyof Events>(name: K, fn: (payload: Events[K]) => void)`. For patterns, they use template literal types to derive the union of matching events, but note it gets complex quickly and offer a pragmatic fallback: pattern listeners receive `{ name: keyof Events, payload: Events[keyof Events] }` and narrow by name.

#### Step-by-step framework
1. **Read** storage, emit, off and once; run tests; note existing bugs.
2. **Clarify the grammar**: single versus multi-segment, bare `*`, listener arguments.
3. **Keep the exact fast path** and add separate stores for patterns and all-listeners.
4. **Write the matcher yourself** with segment comparison.
5. **Let the AI wire routing and emit**, then review for live iteration, over-broad off and error handling.
6. **Fix once/off consistency.**
7. **Mention a trie** for large pattern counts.
8. **Test** semantics, removal during emit, duplicates and errors.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Builds regexes with unescaped dots | Segment matching, or escaped and anchored regex |
| Never asks what * matches | Agrees grammar and defaults up front |
| Wildcard listeners don't know the event | Pass the event name first |
| Iterates live arrays during emit | Snapshots before dispatch |
| off removes the function from all patterns | Removes the exact pattern and fn pair |
| One throwing listener stops the rest | Isolates errors and rethrows after |
| Breaks exact-listener arguments | Exact path unchanged and tested |

#### Useful phrases
- "Before coding: does star match one segment or many?"
- "Wildcard listeners need the event name, otherwise they can't tell events apart."
- "I'll snapshot listeners, so unsubscribing inside a handler is safe."
- "A linear scan is fine for dozens of patterns; a trie if it's thousands."
- "There's an existing once/off bug; fixing it now since we're touching off."

#### Common pitfalls
- **`'user.*'` as a regex** matching `userXlogin` because the dot isn't escaped.
- **Missing anchors**, so `user.*` matches `admin.user.login`.
- **Memory leaks**: subscriptions in components without unsubscribe on unmount.
- **Inconsistent argument shapes** between exact and wildcard listeners without documenting it.
- **Infinite loops** when a `*` listener emits another event and receives it itself.
- **Silently deduplicating** listeners when the caller expected both to fire, or vice versa.

#### Follow-ups to expect (with sample answers)
- **"How would you support `**`?"** — "Recursive match: `**` either consumes zero segments (advance the pattern) or one segment (advance the event and stay on `**`). Memoise if patterns get long."
- **"What order should listeners fire in?"** — "Exact, then patterns, then catch-all, each in registration order. Some systems use one global registration order; either is fine if documented and tested."
- **"How would you make emit async?"** — "Offer `emitAsync` that awaits listeners in sequence or with Promise.allSettled, and returns errors. Keep sync emit for UI code."
- **"How do you prevent an infinite loop from a catch-all that emits?"** — "Track a dispatch depth and throw past a limit, or have the catch-all ignore its own events by name prefix."

#### What senior interviewers look for
- **Semantics first**, agreed and tested.
- **Safe dispatch**: snapshots, error isolation, consistent off and once.
- **Proportionate performance thinking** (scan now, trie if needed).
- **Spotting regex and removal bugs** in AI output.

#### Practise it
- Implement the segment matcher and `**` support on paper first, then compare with an AI-generated regex version and find its failure cases.
- Write the 'unsubscribe during emit' test and see how many implementations fail it.
- Checklist: grammar agreed · event name to wildcard listeners · exact fast path · segment matcher · snapshot · error isolation · precise off · once wrapper fix · trie mention · tests.

#### Variations you might be asked
- "Add `once` for patterns and a `listenerCount(name)` that includes matching patterns."
- "Add priority ordering for listeners."
- "Make it work across browser tabs with BroadcastChannel."

## Debug: failing calculator tests
- id: 0d5b1217-9942-4c06-a6db-ea545dcb7724
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- companies: Apple, Meta
- tags: AI-assisted, debug, parsing

### Prompt
You inherit a `Calculator` class with an `evaluate(expression: string): number` method that parses and evaluates arithmetic strings like `2 + 3 * (4 - 1)`. The test file has 12 tests and 7 are failing. Using the AI assistant where it helps, find and fix the bugs, explaining your process as you go.

### Answer
#### What the interviewer is really testing
- **Debugging method**: reading failures, forming hypotheses, confirming them by tracing, fixing one thing at a time.
- **Restraint with the AI**: not asking it to "fix all the bugs", which produces a rewrite you can't explain and may change behaviour the tests don't cover.
- **Parsing knowledge**: tokenising, operator precedence, associativity, unary minus, parentheses, floating-point.
- **Root-cause thinking**: seven failures often come from two or three bugs; fixing the root cause fixes several tests at once.
- **Verification**: re-running the full suite after each change and adding tests for anything uncovered.

#### Key points
- **Run the tests first and read the names**, not the code. Group failures by theme: precedence, negatives, parentheses, decimals, errors.
- **Pick the simplest failing test**, compute the expected result by hand, see what the code returns, and trace the difference.
- **Typical calculator bugs:**
  - Precedence: evaluating left to right so `2 + 3 * 4` gives 20.
  - Associativity: `10 - 4 - 3` evaluated as `10 - (4 - 3)` = 9 instead of 3; same for division.
  - Tokeniser: multi-digit or decimal numbers split into separate digits; whitespace not skipped; last token dropped (off-by-one).
  - Unary minus: `-3 + 5` or `2 * -1` treated as binary subtraction with a missing operand.
  - Parentheses: closing paren not consumed, so the parser stops early.
  - Floating point: `0.1 + 0.2` compared with `toBe(0.3)` in the test (the test is wrong; use `toBeCloseTo`).
  - Errors: division by zero or malformed input not throwing as the tests expect.
- **Fix one bug, re-run everything**, confirm which tests went green and that none went red.
- **Good AI uses here:** explain an unfamiliar parsing pattern, generate extra edge-case tests, add a debug trace helper, explain a stack trace. **Bad uses:** "make the tests pass".

#### Model answer
"I'll run the tests before opening the code. Seven failures:
1. 'respects operator precedence' (`2 + 3 * 4` expected 14, got 20)
2. 'handles parentheses' (`(2 + 3) * 4` expected 20, got 5)
3. 'subtraction is left-associative' (`10 - 4 - 3` expected 3, got 9)
4. 'handles multi-digit numbers' (`12 + 30` expected 42, got NaN)
5. 'handles decimals' (`1.5 * 2` expected 3, got NaN)
6. 'handles unary minus' (`-3 + 5` expected 2, threw 'Unexpected token')
7. 'adds floats' (`0.1 + 0.2` expected 0.3, got 0.30000000000000004)

Themes: tokenising (4, 5), precedence and associativity (1, 3), parentheses (2), unary minus (6), and 7 looks like a test bug, not a code bug. The passing tests include single-digit addition and division by zero throwing.

Now the code. `tokenize()` loops over characters and pushes each non-space character as a token. `evaluate()` is a recursive descent parser: `parseExpression()` calls `parseTerm()` and loops over plus and minus; `parseTerm()` calls `parseFactor()` and loops over times and divide; `parseFactor()` handles numbers and parentheses. That structure should give correct precedence, so failure 1 is surprising. Let me trace it rather than guess.

Starting with the tokeniser, because everything sits on top of it. `12 + 30` tokenises to `['1', '2', '+', '3', '0']`, so `parseFactor` reads 1, then sees 2 where it expects an operator. That explains 4 and 5. I'll ask the AI only for the narrow piece:

```text
In src/Calculator.ts, rewrite only tokenize(input: string): string[] so that
consecutive digits and a single decimal point form one number token, whitespace
is skipped, and + - * / ( ) are single tokens. Throw Error('Unexpected character
X') for anything else. Do not change the parser. Keep the return type.
```

Reviewing: it uses a regex `/\d+\.?\d*/`, which accepts `1.` (fine) but would also accept `1.2.3` as `1.2` then `.3`; a leading-dot number like `.5` isn't supported. I'll ask you whether `.5` should be valid; for now I'll leave it unsupported and add a test that it throws. Run tests: 4 and 5 now pass, nothing else changed. Good.

Failure 1 next. Tracing `2 + 3 * 4` through the parser with a quick log of each function entry: `parseExpression` gets 2 from `parseTerm`, sees plus, then calls... `parseFactor()`, not `parseTerm()`, for the right-hand side. So it gets 3, adds to make 5, then the loop continues and the next operator is times, which `parseExpression` doesn't handle, so... it actually falls into a generic branch that applies any operator. That's the bug: the right side of plus and minus must be parsed with `parseTerm()`, and `parseExpression` should only loop on plus and minus. Fixing that one line plus removing the generic branch.

Re-run: 1 passes, and so does 2. I want to understand why 2 went green before moving on. My first guess was that `parseFactor` never consumes the closing paren: it checks `tokens[pos] === ')'` and I couldn't see a `pos++`. But if that were true, the result would be 5, not 20, so my guess doesn't fit the evidence. Rather than keep reasoning in circles, I'll add a one-line trace that logs each function with `pos` and the current token.

The trace shows `parseFactor` does `pos++` a few lines further down, which I'd missed, so parentheses were fine all along. Test 2 was failing only because of the precedence bug in the outer expression. Good: one root cause, two tests. I'll also add a check at the end of `evaluate` that all tokens were consumed, so `(2 + 3` and `2 3` throw instead of returning partial results, with tests for both.

Failure 3, associativity. `10 - 4 - 3` gives 9, meaning it computed `10 - (4 - 3)`. In `parseExpression`, the loop is written recursively: `left - parseExpression()`, which makes the operator right-associative. The fix is a loop: `let value = parseTerm(); while (next is + or -) { op = take(); right = parseTerm(); value = op === '+' ? value + right : value - right }`. `parseTerm` has the same recursive shape for divide, so `8 / 4 / 2` would give 4 instead of 1. No test covers it, so I'll add one, see it fail, then fix both the same way. Re-run: 3 passes plus my new test.

Failure 6, unary minus. `parseFactor` only accepts numbers and `(`. I'll add: if the token is minus, consume it and return `-parseFactor()`. That handles `-3`, `2 * -1` and `-(2 + 3)`. Should `--3` be 3? With this recursion it is; I'll mention it. Tests: 6 passes, and I'll add `2 * -1` and `-(1 + 2)`.

Failure 7: `0.1 + 0.2` is `0.30000000000000004` in IEEE 754 doubles; the code is right and the test is wrong. Two options: change the test to `toBeCloseTo(0.3)`, or round results in `evaluate` (for example to 12 significant digits) if the product wants calculator-style display. Since it's a display calculator, I'd ask the product question; in the meantime I'll change the assertion and leave a note.

Final run: 12 original tests pass, plus 6 new ones: right-to-left division, unconsumed tokens, trailing operator, unary cases, `.5` behaviour. Summary: four real bugs (tokeniser, precedence branch, right-associativity in both loops, missing unary) and one wrong test. The AI wrote the tokeniser and some edge-case tests; I found every bug by tracing."

(Note how the candidate briefly went down the wrong path on test 2 and recovered by adding a trace instead of guessing. Interviewers like seeing that recovery; it's realistic.)

#### Another worked example
**A React calculator UI with failing component tests.** Failures: 'shows result after equals', 'clears on AC', 'chains operations'. The candidate reads the reducer and finds that `=` stores the result in `display` but not in `accumulator`, so chaining `= + 2` starts from 0; AC resets `display` but not `pendingOp`. The AI is asked to explain why a test using `getByText('5')` finds two elements (the display and the 5 button); the fix is to query by role or test id for the display. Again, the AI explains and the candidate fixes.

#### A third worked example
**Off-by-one in a tokenising loop.** In another codebase the last number is dropped: `2 + 3` returns 2. Tracing shows the number buffer is flushed only when a non-digit is seen, and the loop ends without a final flush. One line after the loop fixes it. The candidate uses this to illustrate why reading the test names first ("handles trailing numbers") narrows the search to the end-of-input path in seconds.

#### Step-by-step framework
1. **Run the suite** and list failures with expected versus actual.
2. **Group by theme** and suspect shared root causes.
3. **Start at the bottom layer** (tokeniser) and work up (parser, evaluator).
4. **Trace the simplest failing case**, adding logging when reasoning stalls.
5. **Fix one root cause at a time**, re-running the full suite after each.
6. **Add tests** for bugs you discover that the suite didn't cover.
7. **Separate test bugs from code bugs** (floating point) and raise product questions.
8. **Summarise** bugs, fixes and what the AI contributed.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Asks the AI to fix everything | Uses the AI for narrow, reviewable pieces |
| Opens the code before reading failures | Reads test names and diffs first |
| Fixes tests one by one in order | Finds shared root causes |
| Guesses when confused | Adds a trace and verifies |
| Changes the float test silently | Explains IEEE 754 and asks about display rounding |
| Stops when 12 pass | Adds tests for uncovered bugs (division associativity) |
| Can't explain why a test started passing | Confirms the mechanism before moving on |

#### Useful phrases
- "Seven failures, but I suspect three or four root causes."
- "I'll start with the tokeniser, since everything else depends on it."
- "That test went green, but I want to understand why before I move on."
- "This one is a test bug: 0.1 plus 0.2 isn't exactly 0.3 in floating point."
- "There's no test for division associativity, so I'll add one and watch it fail first."

#### Common pitfalls
- **Shotgun fixes**: changing several things then re-running, so you don't know what helped.
- **Accepting a full AI rewrite** that passes tests but changes untested behaviour.
- **Using eval()** "to make it work", which is a security problem and ignores the exercise.
- **Not checking for unconsumed tokens**, so malformed input returns partial results.
- **Ignoring associativity** because no existing test covers it.
- **Silence while stuck**; narrate the hypothesis even when it's wrong.

#### Follow-ups to expect (with sample answers)
- **"Why not use eval?"** — "It executes arbitrary code, so it's a security risk with user input, and it gives no control over errors, precedence rules or supported syntax."
- **"How would you add exponentiation?"** — "A new precedence level above multiplication, right-associative, so `2 ^ 3 ^ 2` is 2 to the 9. Unary minus binds looser than ^, so `-2 ^ 2` is -4."
- **"How would you report errors with positions?"** — "Tokens carry their start index; the parser throws with the position and expected token, and the UI underlines it."
- **"How would you avoid floating-point surprises?"** — "Round for display, or use a decimal library or integer arithmetic for money."

#### What senior interviewers look for
- **A calm, systematic loop**: observe, hypothesise, trace, fix, verify.
- **Root-cause grouping** rather than test-by-test patching.
- **Honest recovery** from a wrong hypothesis.
- **AI used as a tool for narrow tasks**, with every change understood.

#### Practise it
- Write a recursive descent calculator, then plant four bugs (precedence, associativity, tokeniser, unary) and ask a friend or an AI to plant two more; debug it aloud in 25 minutes.
- Practise reading a failing test list and predicting root causes before opening code.
- Checklist: run tests · expected versus actual list · group themes · tokeniser first · trace · one fix at a time · full re-run · new tests for found bugs · float test discussion · summary.

#### Variations you might be asked
- "Add support for functions like sqrt and max."
- "Add variables: `x = 3` then `x * 2`."
- "Make the parser return an AST and pretty-print it."

## Debug: React app with memory leak — find and fix
- id: 0e04e695-76e4-46f4-870e-21b69be74eda
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: hard
- levels:
- companies: Meta, Anthropic
- tags: AI-assisted, debug, React, memory

### Prompt
You inherit a React single-page app (a live trading or chat dashboard) that users leave open all day. Support reports that the tab gets slower over time and eventually crashes; memory in Task Manager climbs from 150 MB to over 1 GB. Using the AI assistant where it helps, find the leak or leaks and fix them, explaining your process.

### Answer
#### What the interviewer is really testing
- **Measuring before guessing.** Memory bugs need evidence: heap snapshots, allocation timelines, a reproducible scenario. The AI's first guess is a hypothesis, not a diagnosis.
- **Tool fluency**: Chrome DevTools Memory panel (heap snapshots, comparison view, retainers), Performance monitor, React DevTools Profiler.
- **Knowing the usual React leak sources**: effects without cleanup, intervals, sockets, store subscriptions, global caches, closures holding large objects, detached DOM nodes.
- **Proving the fix**: the same scenario, measured again, shows memory flattening out.
- **Using the AI well**: auditing many effects for cleanup is tedious and a good AI task; deciding what's actually leaking is yours.

#### Key points
- **Reproduce with a loop.** Pick an action that should be memory-neutral (open and close a panel, switch between two routes 20 times) and measure before and after. Memory that grows after each cycle and survives a forced GC is a leak.
- **Three-snapshot technique:** snapshot (baseline), repeat the action N times, snapshot, repeat N more, snapshot. In comparison view, objects whose count grows by roughly N each time are leaking.
- **Read retainers**, not just sizes. The retainer path shows *what* is keeping the object alive: a listener on `window`, a closure in a `setInterval`, a module-level Map.
- **Detached DOM nodes** (filter for "Detached" in the snapshot) mean something still references unmounted elements.
- **Common culprits:**
  - `useEffect` adding `window`/`document` listeners or `ResizeObserver` without cleanup.
  - `setInterval` and `setTimeout` loops never cleared.
  - WebSocket `onmessage` handlers or store subscriptions not unsubscribed.
  - Module-level caches (`const cache = new Map()`) growing forever with no eviction.
  - Unbounded state arrays (appending every message into state).
  - Third-party widgets (charts, maps) not destroyed on unmount.
- **Not every growth is a leak.** An unbounded list of 50,000 messages is a product/design problem (virtualise, cap the buffer), not a missing cleanup.
- **Verify in production builds** too; React development mode and StrictMode change allocation patterns.

#### Model answer
"Before reading code, I'll reproduce and measure, because memory leaks are almost never where you first look.

I'll open the app in Chrome, open the Performance monitor to watch JS heap size, and pick a scenario. The dashboard has a symbol list on the left; clicking a symbol mounts a `SymbolPanel` with a live chart. I'll switch between two symbols 20 times. Heap goes from 60 MB to 140 MB and doesn't come back after clicking the garbage collection button. That's a leak, and it's tied to mounting and unmounting `SymbolPanel`. Separately, leaving the app idle for five minutes adds about 10 MB, which may be a second issue.

Three heap snapshots: baseline, after 20 switches, after 40. In comparison view sorted by delta, I see:
- `Detached HTMLCanvasElement`: +20 then +20. Each switch leaves a canvas behind.
- `(closure)` count growing by about 40 per batch.
- An Array of `Trade` objects growing steadily even when idle.

Retainers for the detached canvas: held by a `ChartInstance`, held by a `resize` listener on `window`. So the chart library registered a resize handler and was never destroyed.

Now I'll read the code. `SymbolPanel` has three effects. That's where the AI can save me time:

```text
Here are the three useEffect hooks from src/components/SymbolPanel.tsx and the
useLiveTrades hook from src/hooks/useLiveTrades.ts. For each effect, list every
resource it creates (listeners, timers, subscriptions, library instances, sockets)
and whether the cleanup function releases it. Don't rewrite the code; give me a
table. Note anything captured in closures that could keep large objects alive.
```

The AI's table:
1. Chart effect: creates `new Chart(canvas, ...)`, no cleanup. Matches the snapshot evidence.
2. Price-ticker effect: `setInterval` every second, cleanup clears it. Fine.
3. Socket effect: calls `socket.on('trade', handler)`, cleanup calls `socket.off('trade')`. The AI flagged this as fine. I'll check, because it's suspicious: our socket wrapper is in `src/lib/socket.ts`, and its `off(event, fn)` requires the handler. Called with no handler, it does nothing. So every mount adds a handler and none are removed. That explains the closure growth: each handler captures `setTrades` and the panel's props. The AI missed it because it assumed the socket.io API; our wrapper behaves differently. Good reminder to read the actual implementation.

And `useLiveTrades`: it appends each incoming trade to a module-level array `allTrades` 'for the history view', with no cap. That's the idle growth.

Three fixes, one at a time, re-measuring each.

Fix 1, chart: return `() => chart.destroy()` from the effect. I checked the library docs for the installed version (in node_modules, not from memory): `destroy()` exists and removes its resize listener. Re-run the 20-switch scenario: detached canvases now zero.

Fix 2, socket: pass the same handler reference to off.

```text
useEffect(() => {
  const handler = (t) => { if (t.symbol === symbol) setTrades(prev => [...prev.slice(-199), t]) }
  socket.on('trade', handler)
  return () => socket.off('trade', handler)
}, [symbol])
```

I also capped the panel's trades to the last 200, since the panel only displays 50. Re-measure: closures flat across batches.

Fix 3, the module-level history: it needs an upper bound. I'll ask you or the product owner what the history view needs; assuming the last hour or 10,000 trades, I'll replace the array with a ring buffer of fixed size. The AI can write the ring buffer quickly; I'll test that it overwrites the oldest entry and that iteration order is correct.

Final measurement: 40 switches plus 10 idle minutes; heap oscillates between 55 and 75 MB with GC and returns to baseline. I'd also add a regression check: a Playwright script that switches symbols 50 times and asserts `performance.memory.usedJSHeapSize` (Chrome only) stays under a threshold, run nightly rather than on every PR because it's slow and noisy.

Summary: three leaks, found by snapshots and retainers, not by guessing. The AI was useful for auditing effects but missed the socket bug because it assumed a different API."

#### Another worked example
**Leak from a global event bus in a design system.** A `Tooltip` component subscribes to a global `scroll` bus on mount to reposition itself. Hundreds of tooltips mount and unmount in a virtualised table. Snapshots show thousands of `Tooltip` closures retained by the bus's listener array. The fix is unsubscribe on unmount, but the candidate also moves to a single shared scroll listener with a Set of active tooltips, and uses `IntersectionObserver` so off-screen tooltips don't subscribe at all. They ask the AI to find every `bus.on` call without a matching `bus.off` across the repo, then verify each by hand.

#### A third worked example
**Not a leak: unbounded state.** A chat app slows after hours because every message is kept in state and rendered. Snapshots show the memory belongs to live, reachable messages and DOM nodes, not detached ones. The candidate says this isn't a cleanup bug; it's a design issue. Fix: virtualise the list (react-window or TanStack Virtual), keep only the last few hundred messages in memory and page older ones from the server or IndexedDB. Knowing the difference earns credit.

#### Step-by-step framework
1. **Reproduce** with a memory-neutral action loop; confirm growth survives forced GC.
2. **Three snapshots**, comparison view, sort by delta.
3. **Follow retainers** of growing objects and detached nodes to their owner.
4. **Audit related effects** with the AI for missing cleanup; verify each claim against the real code.
5. **Fix one leak at a time** and re-measure after each.
6. **Bound unbounded collections** (ring buffers, caps, eviction).
7. **Verify** in a production build and add a regression check if practical.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Starts by reading code and guessing | Reproduces and measures first |
| Looks only at total heap size | Compares snapshots and reads retainers |
| Trusts the AI saying cleanup is fine | Checks the wrapper's actual off() signature |
| Adds cleanup everywhere at once | One fix at a time, re-measured |
| Treats all growth as a missing cleanup | Distinguishes leaks from unbounded data |
| Assumes library destroy() exists | Checks the installed version's API |
| No proof the fix worked | Same scenario, flat memory afterwards |

#### Useful phrases
- "Memory bugs need data, so I'll get a reproducible scenario before reading code."
- "The retainer path tells me who's holding it, which is more useful than how big it is."
- "Detached canvas elements point at something outside React still referencing them."
- "The AI assumed socket.io semantics; our wrapper needs the handler reference."
- "This growth is reachable data, so it's a design question, not a missing cleanup."

#### Common pitfalls
- **Profiling in development mode only**, where StrictMode double-mounts and dev tooling adds allocations.
- **Forgetting to force GC** before snapshots, mistaking garbage for leaks.
- **Inline handler in off()**: `off('x', () => ...)` removes nothing because it's a new function.
- **Cleanup that captures the wrong instance**, such as clearing a timer id stored in state that has since changed.
- **Ignoring third-party instances** (charts, maps, editors) that need explicit destroy calls.
- **Fixing symptoms** with periodic page reloads.

#### Follow-ups to expect (with sample answers)
- **"How do you tell a leak from normal growth?"** — "Repeat a memory-neutral action; if memory keeps rising and survives forced GC, it's a leak. If it plateaus, it's caching or normal allocation."
- **"What's a detached DOM node?"** — "An element removed from the document but still referenced from JavaScript, so it can't be collected, along with its subtree."
- **"Can React itself leak?"** — "Rarely. Usually it's user code holding references. Since React 18, setting state on an unmounted component doesn't warn, so the leak shows up through subscriptions and timers instead."
- **"How would you catch this in CI?"** — "A browser test repeating the scenario and checking heap after forced GC, or tools like memlab that automate snapshot diffing, run nightly."

#### What senior interviewers look for
- **Evidence-driven debugging** with the right tools.
- **Healthy scepticism** of AI claims, checked against real implementations.
- **Fixes that address ownership** (who creates, who destroys) rather than patches.
- **Prevention**: lint rules, patterns like a `useSubscription` hook, regression checks.

#### Practise it
- Build a page with a chart, an interval and a socket handler, deliberately omit cleanups, and find each leak with three snapshots.
- Try memlab on the same page.
- Checklist: reproducible loop · forced GC · three snapshots · comparison delta · retainers · detached nodes · AI cleanup audit verified · one fix at a time · bounded collections · re-measure.

#### Variations you might be asked
- "The leak only happens in Safari."
- "Memory grows only when the tab is in the background."
- "Find a leak in a Node.js SSR server rather than the browser."

## Debug: pagination returns duplicate items on rapid page clicks
- id: eb6d56f4-1212-47f4-a997-c3c5700333d3
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, debug, race-conditions

### Prompt
A React product listing has numbered pagination. Users report that clicking pages quickly (2, then 3) sometimes shows page 2's items under the 'Page 3' label, and in the infinite-scroll variant on mobile, items appear twice. The data fetching is a hand-written `useEffect` with `fetch`. Using the AI assistant, find and fix the bug.

### Answer
#### What the interviewer is really testing
- **Recognising a race condition** from the symptom: the UI shows data from an older request.
- **Reproducing reliably** by controlling network timing (throttling, delayed mocks) instead of hoping to click fast enough.
- **Knowing the fix options** and their trade-offs: AbortController, a stale-response guard, or a data-fetching library keyed by page.
- **Seeing the second bug** in infinite scroll: duplicate appends from concurrent or repeated loads, and offset pagination shifting when data changes.
- **Testing async UI deterministically.**

#### Key points
- **Out-of-order responses:** request for page 2 is slow, page 3 is fast. Page 3 renders, then page 2's response arrives and overwrites state. The label says 3 because `page` state is correct; the items are stale.
- **Fix 1, AbortController:** each effect run creates a controller; cleanup aborts it. The aborted fetch rejects with `AbortError`, which must be ignored, not shown as an error. Also saves bandwidth.
- **Fix 2, ignore stale responses:** a local `let active = true` in the effect, set to false in cleanup; only call `setState` if still active. Works for any promise, including ones you can't abort.
- **Fix 3, use a library:** TanStack Query or SWR with `queryKey: ['products', page]` handles this, plus caching and `placeholderData` to keep the previous page visible while loading.
- **Infinite scroll duplicates** have different causes: the intersection observer firing twice before the first load finishes (no in-flight guard), StrictMode double effects in development, or offset pagination where new items inserted at the top shift everything down so the next page repeats items.
- **Cursor-based pagination** (`after=lastId`) fixes the shifting problem; de-duplicating by id on append is a safety net.
- **Reproduce with throttling or a test that resolves requests in reverse order.**

#### Model answer
"First, reproduce. Clicking fast on localhost is unreliable because responses come back in milliseconds. I'll make the server slow for page 2 only. With MSW in the dev setup, I'll add a handler that delays page 2 by two seconds. Now: click 2, click 3. Page 3 renders, then after two seconds the list switches to page 2's items while the label still says 3. Reproduced deterministically.

Reading `ProductList`:

```text
const [page, setPage] = useState(1)
const [items, setItems] = useState([])
useEffect(() => {
  setLoading(true)
  fetch('/api/products?page=' + page)
    .then(r => r.json())
    .then(data => { setItems(data.items); setLoading(false) })
}, [page])
```

No cleanup, so every response sets state, in whatever order it arrives. That's the race. The `loading` flag is also wrong: page 3's response sets loading false while page 2 is still pending.

Options: AbortController, an `active` flag, or moving to TanStack Query, which the app already uses elsewhere (I see it in package.json and in `useOrders`). For a minimal fix in the interview I'll use AbortController, then suggest migrating to the library pattern the codebase already has.

```text
In src/components/ProductList.tsx, update the fetch effect to use an
AbortController: create it inside the effect, pass signal to fetch, abort it in
the cleanup function. In the catch, ignore errors whose name is 'AbortError';
set an error state for any other error. Only set loading false for the request
that is still current. Don't change anything else in the component.
```

Reviewing the AI's diff: the abort and signal are right. In the catch, it checks `err instanceof DOMException`. That isn't specific enough: network failures in some environments are also DOMExceptions, and in Node test environments the abort error may not be a DOMException at all. Checking `err.name === 'AbortError'` is the reliable test, so I change it. Its `finally(() => setLoading(false))` runs for aborted requests too, which would flicker loading off while the new request is pending. I move `setLoading(false)` into the success and real-error paths, guarded by `!controller.signal.aborted`.

Also, it didn't check `r.ok`; a 500 response would try to parse an HTML error page as JSON. I add that.

Re-test with the delayed page 2 handler: click 2, click 3, page 3 stays, and the network tab shows page 2 cancelled.

Now the mobile infinite-scroll variant. `useInfiniteProducts` appends: `setItems(prev => [...prev, ...data.items])` when an IntersectionObserver sentinel becomes visible. Two problems:
1. The observer callback fires again while the first load is in flight (the sentinel stays visible), requesting the same page twice; both responses append. Fix: an in-flight ref guard, and only advance the page on success.
2. The API uses `offset`. If a new product is published while the user scrolls, everything shifts by one and the next page repeats the last item. The real fix is cursor pagination (`?after=lastId`), which needs a backend change; in the meantime de-duplicate by id when appending.

I'll ask the AI for the de-duplication helper and a test, and write the in-flight guard myself because it's three lines and the logic matters.

Tests with MSW and RTL:
- Page 2 delayed, page 3 fast: after both settle, page 3's items are shown and loading is false.
- Abort errors don't show the error banner.
- A 500 shows the error banner.
- Infinite scroll: triggering the sentinel twice quickly results in one request.
- Appending a page containing an existing id doesn't duplicate it.

Longer term: migrate to `useQuery({ queryKey: ['products', page], placeholderData: keepPreviousData })` and `useInfiniteQuery` with a cursor, which removes this whole class of bug and matches the rest of the codebase."

#### Another worked example
**Search-as-you-type showing results for an old query.** Typing 'rea' then 'react' shows results for 'rea' if that request was slower. Same root cause and same fixes: debounce reduces the number of requests but does not remove the race, so the candidate debounces *and* aborts the previous request. They point out that debouncing alone is a common wrong answer.

#### A third worked example
**Tabs switching between user profiles.** In a Next.js admin tool, switching quickly between users shows the wrong user's data in an edit form, and saving overwrites the wrong record. This is the dangerous version of the race: stale data plus a write. The candidate adds abort, keys the form by user id (`<UserForm key={userId} />`) so form state resets, and has the save request include the id from the form's own data rather than from the current route.

#### Step-by-step framework
1. **Reproduce deterministically** by delaying one response.
2. **Read the fetch logic** and look for missing cleanup or stale-response checks.
3. **Choose a fix**: abort, active flag, or the library the codebase already uses.
4. **Prompt narrowly**, then review abort-error handling, loading state and `r.ok`.
5. **Check the infinite-scroll path** for in-flight guards and offset shifting.
6. **De-duplicate by id** as a safety net; propose cursor pagination.
7. **Test** out-of-order responses with controlled mocks.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Tries clicking fast until it happens | Delays one response to reproduce every time |
| Adds a debounce and calls it fixed | Aborts or ignores stale responses |
| Shows an error banner on abort | Ignores AbortError by name |
| Loading flag cleared by any response | Loading tied to the current request |
| Dedupes items without asking why | Finds in-flight double loads and offset shifts |
| Writes a bespoke fetch layer | Uses the library already in the codebase |
| No test for the race | MSW test with reversed response order |

#### Useful phrases
- "The label is right and the items are wrong, so a stale response is winning."
- "Debounce reduces requests; it doesn't stop an old one finishing last."
- "I'll make page 2 artificially slow so I can reproduce it every time."
- "Offset pagination shifts when data changes; cursors don't."
- "The codebase already uses TanStack Query, so the long-term fix is to use it here too."

#### Common pitfalls
- **Ignoring the cleanup function** in data-fetching effects.
- **Treating AbortError as a failure** and showing error UI.
- **Using a single global `isMounted`** flag instead of per-effect-run state.
- **Duplicates hidden by key warnings**: React warns about duplicate keys, which is a clue people ignore.
- **Fixing only the paginated view** and missing the infinite-scroll path.
- **Testing with real timers and the real network**, producing flaky tests.

#### Follow-ups to expect (with sample answers)
- **"AbortController or an ignore flag?"** — "Abort when the API is fetch-based, because it also frees the network. The flag works for any promise. I often do both."
- **"How does TanStack Query avoid this?"** — "Results are cached per query key, and the component reads the key for the current page, so a late response for page 2 updates page 2's cache entry, not what page 3 is showing."
- **"Why did the bug only show in production?"** — "Real latency varies; locally everything returns in a few milliseconds in order."
- **"How would you keep the old page visible while loading?"** — "Keep previous data and show a subtle loading indicator, via `placeholderData: keepPreviousData` in TanStack Query or by not clearing items before fetching."

#### What senior interviewers look for
- **Immediate pattern recognition** of out-of-order responses.
- **Deterministic reproduction** and tests.
- **Seeing related bugs** (loading flag, infinite scroll, offset shifting, write-after-stale-read).
- **Aligning the fix with codebase conventions.**

#### Practise it
- Build a paginated list with a hand-written effect, add MSW with a delayed page, and fix it three ways.
- Ask an AI for an AbortController version and check its abort detection and loading handling.
- Checklist: deterministic repro · cleanup · AbortError by name · loading per request · r.ok · in-flight guard · dedupe by id · cursor proposal · MSW race test.

#### Variations you might be asked
- "The duplicates only appear in development." (StrictMode double effects.)
- "Prefetch the next page on hover."
- "Sync the current page to the URL so back and forward work."

## Debug: useEffect re-running infinitely
- id: 516efd87-a3de-4f65-a7a0-bf2e96863cbe
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: easy
- levels:
- companies: Apple, Meta
- tags: AI-assisted, debug, React, hooks

### Prompt
A React page fetches a user's notifications and filters them. Since a recent change, the network tab shows the notifications endpoint being called hundreds of times a second, the fan spins up, and sometimes React throws 'Maximum update depth exceeded'. Using the AI assistant where it helps, find and fix the cause.

### Answer
#### What the interviewer is really testing
- **Understanding how dependency arrays work**: React compares each dependency with `Object.is`, so new objects, arrays and functions every render count as changes.
- **Recognising the loop**: effect sets state → re-render → new dependency identity → effect runs again.
- **Fixing the cause rather than the symptom**: not deleting dependencies or silencing the exhaustive-deps lint rule.
- **Knowing modern alternatives**: derive state during render instead of syncing it with effects, move data fetching to a library.
- **Using the AI efficiently** for a well-known pattern while still verifying.

#### Key points
- **Common causes:**
  - An object or array literal in deps: `[{ status }]`, `[items.filter(...)]`, `[options]` where `options` is created in render.
  - A function defined in the component and listed in deps.
  - A prop object or callback from a parent that's recreated every render.
  - An effect that sets state it also depends on (`setCount(count + 1)` with `[count]`).
  - A custom hook returning a new object every call, used as a dependency.
- **Diagnose:** log inside the effect, and log which dependency changed (compare previous values with a ref, or use a `useWhyDidYouUpdate`-style helper).
- **Fixes, best first:**
  - **Depend on primitives**: `[user.id, filter.status]` instead of `[user, filter]`.
  - **Move the object or function inside the effect** if only the effect uses it.
  - **Derive, don't sync**: compute filtered lists during render (with `useMemo` if expensive) instead of an effect that sets `filtered` state.
  - **Stabilise identities** with `useMemo` and `useCallback` where they must be shared.
  - **Functional updates** (`setCount(c => c + 1)`) to drop state from deps.
  - **Use a data-fetching library** keyed by primitives.
- **Don't** remove deps or disable the lint rule; that turns an infinite loop into a stale-data bug.
- **StrictMode** running effects twice in development is not an infinite loop; know the difference.

#### Model answer
"First, confirm what's looping. I'll add a `console.count('notifications effect')` inside the effect and watch: it climbs continuously. So the effect itself re-runs, not just a re-render.

Reading `NotificationsPage`:

```text
function NotificationsPage({ user }) {
  const [notifications, setNotifications] = useState([])
  const [filtered, setFiltered] = useState([])
  const [status, setStatus] = useState('unread')
  const query = { userId: user.id, status }
  const fetchNotifications = async () => {
    const res = await api.get('/notifications', { params: query })
    setNotifications(res.data)
  }
  useEffect(() => { fetchNotifications() }, [query, fetchNotifications])
  useEffect(() => {
    setFiltered(notifications.filter(n => n.status === status))
  }, [notifications, status])
  ...
}
```

The problem is visible, but I'll check it rather than assume. Both `query` and `fetchNotifications` are created on every render, so their identity changes each time. The effect fetches, `setNotifications` triggers a render, which creates a new `query`, so the effect runs again: infinite fetching. The recent change in git log confirms it: someone added `query` and `fetchNotifications` to the deps to satisfy the lint rule, which was right in spirit, but the values aren't stable.

This is a well-known pattern, so it's a fair use of the AI to double-check my reading and spot anything else:

```text
Here is NotificationsPage.tsx. The first useEffect runs in an infinite loop.
Explain which dependencies change identity on every render and why. Then list
any other effects in this file that sync derived state and could be replaced by
computing during render. Don't rewrite the file.
```

The AI agrees about `query` and `fetchNotifications`, and notes the second effect is redundant derived state. Its suggested fix is to wrap `query` in `useMemo` and `fetchNotifications` in `useCallback`. That works, but it's more machinery than needed. The simplest correct fix is to depend on primitives and keep the function inside the effect:

```text
useEffect(() => {
  const controller = new AbortController()
  api.get('/notifications', { params: { userId: user.id, status }, signal: controller.signal })
    .then(res => setNotifications(res.data))
    .catch(err => { if (err.name !== 'CanceledError' && err.name !== 'AbortError') setError(err) })
  return () => controller.abort()
}, [user.id, status])
```

Now the deps are a string and a number, compared by value, so the effect runs only when the user or filter actually changes. I added abort while I'm here, since changing the filter quickly would otherwise race. The lint rule is satisfied without disabling anything. One detail: the AI wrote `err.name !== 'AbortError'`, but this project uses axios, which throws `CanceledError` on abort, so I check for both (or use `axios.isCancel(err)`).

Second effect: `filtered` is purely derived from `notifications` and `status`, so it shouldn't be state at all:

```text
const filtered = useMemo(() => notifications.filter(n => n.status === status), [notifications, status])
```

That removes an extra render per update, and a class of bugs where `filtered` lags one render behind.

Is there a parent issue too? `user` comes from props. If the parent creates a new `user` object every render, the old version would also have looped through `user` alone. Using `user.id` sidesteps that regardless.

Verify: the console count shows one run on mount (two in development because of StrictMode, which I'll mention isn't a loop), and one per filter change. Network tab: one request per change.

Test: render with MSW, assert the handler was called once after mount, change the filter, assert twice. And I'd note the longer-term move: this is exactly what TanStack Query does with `useQuery({ queryKey: ['notifications', user.id, status], queryFn })`, which the codebase could adopt."

#### Another worked example
**Infinite loop via a custom hook.** `const { filters } = useFilters()` returns `{ filters: { ...defaults, ...urlParams } }`, a new object each call, and a child's `useEffect(..., [filters])` refetches forever. The candidate fixes it at the source: `useFilters` memoises its return value based on the URL search string, so every consumer benefits. They explain that fixing every consumer with `JSON.stringify(filters)` in deps would work but spreads the problem; the hook should return stable identities.

#### A third worked example
**'Maximum update depth exceeded' without an effect.** A component calls `setOpen(true)` directly in the render body when a prop is true. That's an infinite render loop, not an effect loop. The fix is to derive `open` from the prop, or to use the 'adjust state when a prop changes' pattern with a stored previous value. The candidate shows they can tell render loops (stack trace in render) from effect loops (stack trace in commit phase).

#### Step-by-step framework
1. **Confirm** the effect is re-running with a counter log.
2. **Identify which dependency changes**: log identities or use a why-did-you-update helper.
3. **Check git history** for the change that introduced it.
4. **Ask the AI to explain** identity changes; verify its reasoning.
5. **Fix with primitives** or by moving values inside the effect; stabilise only when sharing is needed.
6. **Replace synced derived state** with computation during render.
7. **Verify** run counts and network requests; account for StrictMode.
8. **Add a test** that counts requests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Removes the deps array or the deps | Depends on primitive values |
| Disables exhaustive-deps lint | Satisfies the rule correctly |
| useMemo and useCallback everywhere | Moves the function into the effect |
| Keeps a filtered state synced by effect | Derives filtered during render |
| Panics about StrictMode double run | Explains it's development-only |
| Ignores the parent's unstable object | Uses user.id to be robust |
| No verification | Counts runs and requests, adds a test |

#### Useful phrases
- "React compares deps by identity, and this object is new on every render."
- "The lint rule was right; the values just weren't stable."
- "If only the effect uses it, it belongs inside the effect."
- "Filtered isn't state; it's a calculation."
- "Two runs in development is StrictMode, not a loop."

#### Common pitfalls
- **Empty deps array** to stop the loop, which then shows stale data when the user changes.
- **JSON.stringify in deps**, which works but hides the identity problem and is slow for large objects.
- **useCallback with unstable deps**, which recreates the function every render anyway.
- **Effects that set state they depend on** without functional updates.
- **Forgetting cleanup**, so the fix stops the loop but leaves a race.
- **Blaming React** rather than reading the dependency list.

#### Follow-ups to expect (with sample answers)
- **"When would you use useCallback?"** — "When a function is passed to a memoised child or is a dependency of an effect elsewhere and must be stable. Not by default."
- **"What does the React Compiler change?"** — "It memoises values and functions automatically, so many identity loops disappear, but effects that set their own dependencies still loop. Understanding the model still matters."
- **"How do you find which dependency changed?"** — "Store the previous deps in a ref and log which index differs with Object.is."
- **"Is useEffect the right place to fetch data?"** — "It works, but libraries such as TanStack Query handle caching, deduping and races; frameworks like Next.js can fetch on the server."

#### What senior interviewers look for
- **A precise mental model** of identity and dependencies.
- **Minimal, idiomatic fixes** rather than memoisation everywhere.
- **Removing unnecessary effects** ('you might not need an effect').
- **Using the AI for confirmation**, not as the only reasoning.

#### Practise it
- Write five deliberately looping effects (object dep, array dep, function dep, self-setting state, unstable hook return) and fix each the simplest way.
- Read the React docs page 'You Might Not Need an Effect' and refactor one of your own components.
- Checklist: counter log · which dep changed · git blame · primitives · move inside effect · derive don't sync · abort · StrictMode note · request-count test.

#### Variations you might be asked
- "The loop only happens when a context value changes."
- "An effect subscribes to a store and loops."
- "Fix a loop caused by a third-party hook returning new objects."

## Debug: dates display wrong for users outside London
- id: 2d87b6f0-9796-4d05-a6cf-c5eb089bf865
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, debug, timezones

### Prompt
A booking app built by a London team shows appointment dates and times. Users in New York report bookings appearing on the previous day; users in Sydney see the wrong time on some days of the year; a date-of-birth field shows one day earlier for US users. Everything looks correct in London. Using the AI assistant, find and fix the bugs.

### Answer
#### What the interviewer is really testing
- **A clear mental model of time**: an instant (a point on the timeline, stored as UTC), a wall-clock time in a zone, and a calendar date with no time at all.
- **Spotting the classic JavaScript traps**: `new Date('2026-03-14')` is parsed as UTC midnight, `getDate()` uses local time, and `toISOString()` converts to UTC.
- **Reproducing timezone bugs** without travelling: changing the machine or browser timezone, or `TZ=America/New_York` in tests.
- **Fixing at the right layer**: data model and API contract, not just formatting.
- **Using the AI for a tedious audit** of every date call, while verifying its claims.

#### Key points
- **Three kinds of value:**
  - **Instants** (a booking at 14:00 in London on 3 March): store as UTC ISO strings with `Z`, display in the relevant zone.
  - **Calendar dates** (birthday, a hotel check-in date): store as `YYYY-MM-DD` strings, never convert through `Date` with timezone shifts.
  - **Zoned wall time** (a clinic appointment at 9:00 in the clinic's local time): store the local time plus an IANA zone (`Europe/London`), or the instant plus the zone.
- **Traps:**
  - `new Date('2026-03-14')` is UTC midnight; in New York it's 13 March at 19:00 or 20:00 local time, so `toLocaleDateString()` shows the 13th.
  - `new Date('2026-03-14T09:00')` (no offset) is parsed as local time; the same string means different instants on different machines.
  - Building dates with `getHours()` and `setHours()` mixes local and UTC.
  - Hard-coded offsets (`+0`, `+1`) instead of IANA zones, which break at daylight-saving changes. London, New York and Sydney all change on different dates; Sydney's DST is in the southern summer.
- **Display:** `Intl.DateTimeFormat` with an explicit `timeZone` when the business meaning requires it (show the clinic's local time), otherwise the user's zone, and say which.
- **Reproduce:** Chrome DevTools Sensors panel can override the timezone; run tests under several `TZ` values in CI.
- **Libraries:** date-fns with date-fns-tz, Luxon, or the Temporal API where available (`Temporal.PlainDate`, `Temporal.ZonedDateTime`) make the three kinds explicit.

#### Model answer
"First, reproduce. My machine is in London, so everything looks right. I'll override the timezone in Chrome DevTools (Sensors → Location → timezone) to America/New_York and reload. A booking listed in London as 'Sat 14 Mar, 00:30' shows as 'Fri 13 Mar, 20:30' in New York. Is that actually wrong? If the booking is an online call, 20:30 on Friday is the right local time. If it's an in-person appointment at a London clinic, the user wants to see London time. That's a product question, and I'll ask: are these in-person bookings at a physical location? Assume yes: clinic appointments should show in the clinic's timezone, labelled.

Next, date of birth. I set a DOB of 14 March 1990 in the profile, and in New York it displays as 13 March. That's definitely a bug.

Now an audit. There are date calls everywhere, so this is a good AI task:

```text
Search src/ for every use of Date: new Date(...), Date.parse, getDate, getDay,
getHours, setHours, toISOString, toLocaleDateString, toLocaleString,
Intl.DateTimeFormat, and date-fns functions. For each, give file, line, what it
does, and whether it depends on the machine's local timezone. Output a table.
Do not change code.
```

The table has 31 entries. Reviewing the ones that matter:

1. `api/profile.ts`: `dob: new Date(form.dob).toISOString()`. The form gives '1990-03-14'. Parsed as UTC midnight, it's fine in London, then sent as '1990-03-14T00:00:00.000Z'. The display code does `new Date(dob).toLocaleDateString()`, which in New York shows 13 March. A date of birth is a calendar date with no timezone. Fix: store and send '1990-03-14' as a string, and format it without converting to an instant. To display it nicely, either parse the parts and format with `timeZone: 'UTC'`, or use `Temporal.PlainDate` or date-fns `parseISO` (which treats date-only strings as local midnight). I'll use the explicit approach: `new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(dob + 'T00:00:00Z'))`. It's a bit clunky, so I'll wrap it in `formatCalendarDate(dob)`.

2. `components/BookingCard.tsx`: `format(new Date(booking.startsAt), 'EEE d MMM, HH:mm')`. date-fns `format` uses the machine's local zone. For clinic appointments, we need the clinic's zone. The API returns `startsAt` as UTC and the clinic object has `timezone: 'Europe/London'`. Fix: `formatInTimeZone(booking.startsAt, clinic.timezone, 'EEE d MMM, HH:mm zzz')` from date-fns-tz, which is already a dependency (I checked package.json and the version exports `formatInTimeZone`). Adding the zone abbreviation makes it unambiguous.

3. `utils/slots.ts`: generating available slots with `const d = new Date(date); d.setHours(9, 0)` and then incrementing by 30 minutes, sending `toISOString()` to the server. In Sydney, 9:00 local becomes the previous day in UTC, and the server rejects slots outside clinic hours. The slots should be generated in the clinic's zone: build '2026-03-14T09:00' as a wall time in Europe/London and convert to UTC with `fromZonedTime` from date-fns-tz.

The AI's audit also flagged `Date.now()` comparisons as timezone-dependent. They aren't; `Date.now()` is a UTC epoch timestamp. I'll strike those from the list. It's a good example of why the audit is a starting point.

The Sydney 'some days of the year' report: the slot code also had a hard-coded `+ 60 * 60 * 1000` adjustment 'for BST'. That's correct for London only between late March and late October, and Sydney users hit the gap around both DST transitions. Deleting the manual offset and using IANA zones fixes it.

Tests: Jest with `process.env.TZ` set before Date is used. I'll add a CI matrix that runs the date tests under `TZ=UTC`, `TZ=America/New_York` and `TZ=Australia/Sydney`. Cases:
- DOB '1990-03-14' displays '14 March 1990' in all three zones.
- A booking at '2026-03-14T00:30:00Z' displays 'Sat 14 Mar, 00:30 GMT' for a London clinic in all zones.
- Slots for 29 March 2026 (the UK clocks change that day) start at 09:00 BST, which is 08:00Z.
- A round trip: generate a slot, send it, display it, same wall time.

Summary: three distinct bugs: a calendar date treated as an instant, formatting in the wrong zone, and wall times built in local time with a hand-coded DST offset."

#### Another worked example
**An analytics dashboard showing daily totals.** 'Today' in the chart doesn't match the finance report. The frontend groups events by `new Date(ts).getDate()`, the user's local day, while finance uses UTC days. Neither is wrong; they must agree. The candidate makes the reporting zone a setting (organisation timezone), groups in that zone on the server, and labels the chart 'Days in Europe/London'. The AI wrote the grouping helper; the candidate caught that it built day keys with `toISOString().slice(0, 10)`, which silently uses UTC.

#### A third worked example
**Recurring events.** 'Every Monday at 9:00' stored as a UTC time drifts by an hour after DST. The candidate stores the rule with a wall time and IANA zone (as iCalendar RRULE does) and expands occurrences in that zone. They mention Temporal's `ZonedDateTime` makes this much less error-prone.

#### Step-by-step framework
1. **Reproduce** by overriding the browser or machine timezone.
2. **Ask the product question**: whose time should be shown for each kind of value?
3. **Classify each field**: instant, calendar date or zoned wall time.
4. **AI audit** of all date calls; verify each flagged line yourself.
5. **Fix the data contract** first (date-only strings, UTC instants, IANA zones).
6. **Format explicitly** with `Intl.DateTimeFormat` or date-fns-tz, with a zone label where it matters.
7. **Remove hard-coded offsets.**
8. **Test across zones** and DST transition dates.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Adds or subtracts hours to fix it for one user | Classifies instants, dates and wall times |
| Treats birthdays as Date objects | Stores YYYY-MM-DD strings |
| Formats in the browser zone by default | Formats in the zone the business meaning requires |
| Hard-coded BST offset | IANA zone names |
| Trusts the AI's audit completely | Strikes false positives like Date.now |
| Tests only in London | CI matrix over several TZ values and DST dates |
| Doesn't label times | Shows zone abbreviation when it's not the user's |

#### Useful phrases
- "Is this an instant, a calendar date, or a time in a particular place?"
- "A date of birth doesn't have a timezone, so it shouldn't go through one."
- "Date-only strings parse as UTC; date-time strings without an offset parse as local."
- "Whose clock should this show: the user's or the clinic's?"
- "Hard-coded offsets are wrong for half the year."

#### Common pitfalls
- **Using `toISOString().slice(0, 10)`** to get 'today', which is the UTC date.
- **Server and client disagreeing** about the format (some fields with Z, some without).
- **Assuming the user's zone equals the business's zone.**
- **Testing only at midday**, missing bugs near midnight.
- **Storing offsets (+01:00) instead of zones**, losing DST rules.
- **Formatting on the server** in its own timezone for SSR, causing hydration mismatches.

#### Follow-ups to expect (with sample answers)
- **"How do you avoid hydration mismatches with dates in SSR?"** — "Render in a fixed zone that both sides know (the business zone), or render on the client only for user-local times, or pass the user's zone in a cookie."
- **"What's Temporal and would you use it?"** — "The new JavaScript date API with distinct types for instants, plain dates and zoned date-times. I'd use it where it's supported or via the polyfill; it removes most of these bugs by design."
- **"How do you get the user's timezone?"** — "`Intl.DateTimeFormat().resolvedOptions().timeZone`, and store it on the profile for emails and server-side formatting."
- **"How would you test DST?"** — "Fixed dates around transitions in each relevant zone, under several TZ values."

#### What senior interviewers look for
- **Conceptual clarity** about kinds of time.
- **Product thinking**: whose time, labelled how.
- **Fixing contracts and data**, not just display.
- **Systematic auditing** with AI help and human judgment.

#### Practise it
- Set your browser to Pacific/Auckland and use your own app for ten minutes; note every oddity.
- Ask an AI to audit a file for timezone bugs and count its false positives and misses.
- Checklist: reproduce with zone override · product question · classify fields · audit · date-only strings · explicit zone formatting · remove offsets · TZ matrix · DST cases.

#### Variations you might be asked
- "Show 'in 3 hours' relative times correctly across zones."
- "Let users pick their display timezone."
- "Emails show the wrong time; fix the server-side formatting."

## Debug: tests pass locally, fail in CI
- id: 2a8b7b94-9a34-40b7-888e-d3d099e30ef2
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, debug, CI

### Prompt
A frontend repo's test suite (Jest or Vitest with React Testing Library) passes on every developer's laptop, but in GitHub Actions three tests fail, and not always the same ones. You have the CI logs, the workflow file, and the repo. Using the AI assistant, find out why and fix it.

### Answer
#### What the interviewer is really testing
- **Systematic environment comparison**: Node version, OS, timezone, locale, CPU count, environment variables, dependency versions.
- **Recognising flakiness patterns**: time-dependent tests, randomness, shared state between tests, test order, timing assumptions, network calls.
- **Reproducing CI conditions locally** rather than pushing commits and hoping.
- **Fixing the test or the code properly**, not adding retries or bigger timeouts.
- **Using the AI to brainstorm and read logs**, while you confirm each hypothesis.

#### Key points
- **Compare environments first:**
  - Node version (`.nvmrc` versus the workflow's `node-version`).
  - Timezone (CI runners are UTC; many laptops aren't) and locale (`en-US` versus `en-GB` formatting).
  - OS (Linux is case-sensitive about file paths; macOS usually isn't).
  - CPU count (Jest runs workers in parallel differently; CI may run tests in a different order or split).
  - Install method: `npm ci` with the lockfile versus `npm install` drifting.
  - Environment variables (`CI=true` changes behaviour in some tools; missing `.env` values).
- **Flaky patterns:**
  - Dates: `new Date()` or `Date.now()` in tests or snapshots.
  - Random data or ids without a seed.
  - Shared module state, mocks not reset, test order dependence.
  - Fixed `setTimeout` waits instead of `findBy` and `waitFor`; CI is slower.
  - Real network calls that are rate-limited or blocked in CI.
  - Snapshot tests with locale-dependent formatting.
- **Reproduce locally:** `TZ=UTC LANG=C`, `--runInBand` versus parallel, `--randomize` or a fixed seed, the same Node version, Docker with the CI image, or `act` to run Actions locally.
- **Don't** mask with `jest.retryTimes` or bigger timeouts unless as a temporary measure with a ticket.

#### Model answer
"I'll start with the CI logs, not the code. Three failures in the last run:
1. `formatDate.test.ts`: expected '14 Mar 2026', received 'Mar 14, 2026'. That's a locale difference.
2. `BookingSummary.test.tsx`: snapshot mismatch in a date: expected '14 June', received '13 June'. Timezone.
3. `Search.test.tsx`: 'Unable to find element with text: 3 results', but in the previous CI run this one passed and `CartBadge.test.tsx` failed instead. Flaky.

Comparing environments. The workflow uses `ubuntu-latest`, `node-version: 20`, and `npm install`. `.nvmrc` says 22. Locally I'm on 22, in Europe/London, with locale en-GB. CI is UTC with locale probably C or en-US.

I'll ask the AI to help organise this, giving it the evidence:

```text
Here are the CI logs for three failing tests, the GitHub Actions workflow, our
.nvmrc and jest.config.js. List the environment differences between CI and a
macOS laptop in Europe/London that could explain each failure, ranked by
likelihood, and say how I could reproduce each one locally. Don't propose code
changes yet.
```

It suggests timezone and locale for 1 and 2, and for 3: timing, test order, or shared state. It also suggests 'Jest worker count differs because CI has 2 cores', which is a good point: with fewer workers, test files get grouped differently.

Reproduce 1 and 2 locally: `TZ=UTC LANG=en_US.UTF-8 npx jest formatDate BookingSummary`. Both fail. Confirmed.

Failure 1: `formatDate` calls `toLocaleDateString()` without a locale, so it uses the runtime default. The bug is in the code, not just the test: real users with other browser locales would also see a different format. The product wants en-GB formatting, so the fix is `new Intl.DateTimeFormat('en-GB', ...)`. Equally valid would be passing the user's locale explicitly; either way, the locale should be an argument, not an accident of the environment.

Failure 2: the component formats `new Date(booking.startsAt)` in local time, and the fixture is '2026-06-14T00:30:00+01:00', half past midnight British Summer Time. In UTC that's 13 June at 23:30. On a London laptop in summer time it displays 14 June; on a UTC runner it displays 13 June. So the test only passes when the machine is at UTC+1 or later. The right fix depends on product meaning, but for the test suite I'll set `process.env.TZ = 'UTC'` in Jest's global setup so tests are deterministic everywhere, and fix the component to format in an explicit zone. Setting TZ in global setup only, without fixing the component, would hide a real bug.

Failure 3 is the interesting one. I'll run the suite the way CI does: `npx jest --maxWorkers=2`, and also `--runInBand`. With `--runInBand`, `Search.test.tsx` fails every time. Running it alone, it passes. So it depends on another test file run before it in the same worker. That's shared state.

What's shared between test files in one worker? Module-level state. I'll ask the AI to look for it:

```text
In src/, list module-level mutable state (top-level let, Maps, caches,
singletons, mocked modules) that tests could leave in a modified state. Also list
any tests that call jest.mock, jest.spyOn or modify global objects (window,
localStorage, fetch) without restoring them.
```

It finds: `src/api/client.ts` has a module-level `cache = new Map()` for GET requests, and `Cart.test.tsx` uses `jest.spyOn(window, 'fetch')` without `mockRestore`. The cache is the culprit: another test fetches '/api/search?q=shoes' with different mock data, the result is cached, and `Search.test.tsx` gets the cached two results instead of its mocked three. Locally, Jest happened to put those files in different workers, so each had a fresh module registry.

Fixes:
- Export a `clearCache()` from the client and call it in a global `afterEach`, or better, have tests use MSW and a fresh QueryClient per test so there's no hidden cache.
- Set `restoreMocks: true` in jest.config so spies are restored automatically.
- Run tests in CI with a randomised order (`--randomize` in recent Jest, or Vitest's `sequence.shuffle`) occasionally, so order dependencies show up early.

Workflow fixes: use `node-version-file: .nvmrc`, `npm ci` instead of `npm install`, and set `TZ: UTC` in the job env to match the global setup (belt and braces).

Verification: run `TZ=UTC npx jest --runInBand --randomize` ten times locally; all pass. Push; CI green three runs in a row. I'd also note in the PR why each fix was made, so nobody 'fixes' it by adding retries later."

#### Another worked example
**Playwright end-to-end tests flaky in CI.** Tests that click 'Save' and immediately check a toast fail in CI because the CI machine is slower. The fix is web-first assertions (`await expect(page.getByRole('status')).toHaveText('Saved')`), which retry until a timeout, instead of `waitForTimeout(500)`. Another test fails only on Linux: an import of `./Components/Button` when the folder is `components`; macOS's case-insensitive filesystem hid it. The candidate asks the AI to search for case mismatches in imports and enables a lint rule (`import/no-unresolved` with case sensitivity) to prevent recurrence.

#### A third worked example
**Tests fail only on the first CI run after a dependency update.** `npm install` in CI resolved a newer minor version of a date library than the lockfile, changing formatting. The fix is `npm ci`, which installs exactly the lockfile and fails if package.json and the lockfile disagree. The candidate also adds Renovate or Dependabot so upgrades happen in dedicated PRs.

#### Step-by-step framework
1. **Read CI logs** and list each failure with expected versus actual.
2. **Diff environments**: Node, OS, TZ, locale, CPU, env vars, install method.
3. **Use the AI** to rank hypotheses and suggest local reproductions.
4. **Reproduce locally** with TZ, LANG, maxWorkers, runInBand and randomised order.
5. **Fix root causes in code** (explicit locale and zone) and in tests (isolation, restore mocks, async queries).
6. **Align CI with local** (node-version-file, npm ci, TZ).
7. **Verify repeatedly**, then document why.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Re-runs CI until it passes | Reads logs and diffs environments |
| Adds retries and longer timeouts | Finds the shared cache and fixes isolation |
| Sets TZ=UTC and stops there | Also fixes the component's implicit zone |
| Pushes commits to test theories | Reproduces CI conditions locally |
| Ignores Node version mismatch | node-version-file from .nvmrc |
| npm install in CI | npm ci with the lockfile |
| No prevention | restoreMocks, randomised order, lint rules |

#### Useful phrases
- "Same code, different results, so something in the environment differs. Let me list what."
- "It passes alone and fails in band, so it depends on what ran before it."
- "Setting TZ in tests makes them deterministic, but the component still has a real bug."
- "Retries would hide this; the cache would still leak between tests."
- "I'll reproduce it locally rather than debugging through CI commits."

#### Common pitfalls
- **Debugging by pushing commits**, burning time on CI queues.
- **Snapshots containing dates, random ids or locale-specific strings.**
- **Mocks and spies not restored**, leaking between tests.
- **Fixed sleeps** in tests instead of waiting for conditions.
- **Ignoring warnings** in CI logs (act warnings, unhandled promise rejections) that point to the cause.
- **Disabling the failing tests** to unblock the pipeline and never coming back.

#### Follow-ups to expect (with sample answers)
- **"How would you detect flaky tests systematically?"** — "Track failures per test over time in CI analytics, run the suite repeatedly on a schedule, and quarantine flaky tests with an owner and a deadline."
- **"What does `CI=true` change?"** — "Some tools behave differently: Create React App treats warnings as errors, Jest disables watch mode and may change snapshot writing (it won't write new snapshots with --ci)."
- **"Should tests run in UTC?"** — "Yes for determinism, plus a few targeted tests that deliberately run in other zones for code that's timezone-sensitive."
- **"How do you run GitHub Actions locally?"** — "`act`, or a Docker container from the same image with the same Node version and env vars."

#### What senior interviewers look for
- **Methodical diffing** of environments before touching code.
- **Distinguishing test bugs from product bugs** exposed by tests.
- **Durable fixes and prevention**, not retries.
- **Effective use of the AI** for log reading and hypothesis generation.

#### Practise it
- Take a project of yours and run tests with `TZ=Pacific/Kiritimati LANG=C --runInBand --randomize`. Fix whatever breaks.
- Write a test that leaks a module cache between files and watch it pass and fail depending on worker count.
- Checklist: logs · environment diff · TZ and locale reproduction · runInBand · randomise · shared state audit · restoreMocks · explicit locale and zone · node-version-file · npm ci · repeated verification.

#### Variations you might be asked
- "Tests fail only on Windows CI."
- "The build passes locally but fails in CI with 'module not found'."
- "Coverage drops in CI but not locally."

## Debug: login redirects in a loop between /login and /dashboard
- id: 4d5351c1-e44d-48fb-809f-ed0a7da37faa
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, debug, auth

### Prompt
In a React (or Next.js) app, some users get stuck in a redirect loop: the URL flickers between `/login` and `/dashboard` until the browser gives up. It happens most often after a session expires or right after logging in, and it's hard to reproduce. Using the AI assistant, find the cause and fix it.

### Answer
#### What the interviewer is really testing
- **Tracing control flow across routes**: what each guard checks, where the auth state comes from, and when it's read.
- **Spotting inconsistent sources of truth**: localStorage token versus React state versus a cookie checked by server middleware.
- **Handling the unknown state**: 'checking auth' is a third state that must not be treated as logged in or logged out.
- **Reproducing an intermittent bug** by recreating the exact conditions (expired token, slow refresh, empty value).
- **Security awareness**: where tokens live, what middleware can see, and avoiding open redirects with `?next=`.

#### Key points
- **A loop needs two guards that disagree.** `/dashboard` thinks the user is logged out and sends them to `/login`; `/login` thinks they're logged in and sends them to `/dashboard`.
- **Common causes:**
  - Different checks: one guard tests `token !== null`, another tests truthiness, and the token is `''` or the string `'undefined'`.
  - Different sources: Next.js middleware reads an httpOnly cookie, the client reads localStorage; after expiry, the cookie is gone but localStorage still has a token (or the reverse).
  - Async state: the login page writes the token to storage and navigates, but the auth context hasn't updated yet, so the dashboard guard reads stale 'logged out'.
  - Treating 'loading' as 'logged out', redirecting before the session check finishes.
  - An expired token: `/login` sees a token and redirects; `/dashboard`'s API call returns 401, which clears state and redirects back, and the token isn't actually removed from storage.
- **Fixes:**
  - **One source of truth** for auth state, read by every guard.
  - **Three states**: `loading`, `authenticated`, `unauthenticated`; render a spinner while loading, redirect only when known.
  - **Validate, don't just check presence**: check expiry, or ask the server (`/me`).
  - **Clear everything on logout or 401**: storage, cookie, context, query cache.
  - **Use `replace`** for redirects to avoid polluting history.
- **Safety net:** a redirect counter or guard that detects loops and shows an error instead of hammering the browser.

#### Model answer
"First, I'll map the flow before guessing. I'll ask the AI to help me read the relevant files quickly:

```text
Here are src/auth/AuthProvider.tsx, src/routes/ProtectedRoute.tsx,
src/pages/Login.tsx, src/api/client.ts and middleware.ts. For each, tell me
exactly what it reads to decide whether the user is logged in (which storage,
which state, which cookie), what value it treats as logged in, and when it
redirects. Present it as a table. Don't fix anything yet.
```

The table, which I verify against the code line by line:
- `middleware.ts` (Next.js edge middleware): on `/dashboard`, redirects to `/login` if the `session` cookie is missing.
- `ProtectedRoute`: redirects to `/login` if `auth.user` is null.
- `Login.tsx`: on mount, if `localStorage.getItem('token')` is truthy, redirects to `/dashboard`.
- `AuthProvider`: on mount, reads the token from localStorage, calls `/me`, sets `user`. Initial `user` is null, and there's no loading state.
- `api/client.ts`: on 401, clears the React user and redirects to `/login`, but doesn't remove the token from localStorage or the cookie.

Already I can see three disagreeing sources: cookie (middleware), React state (ProtectedRoute) and localStorage (Login). The AI's table said `Login.tsx` checks `auth.user`; it doesn't, it reads localStorage directly. I correct that in my notes; it's the most important line.

Now reproduce the 'after session expiry' case. In DevTools I'll set the token in localStorage to an expired JWT and delete the session cookie (simulating the cookie expiring first, since it has a shorter max-age). Visit `/dashboard`:
1. Middleware: no cookie → redirect to `/login`.
2. Login page: localStorage has a token (truthy) → redirect to `/dashboard`.
3. Loop. Reproduced.

The 'right after login' case: `Login.tsx` saves the token and calls `navigate('/dashboard')`. `ProtectedRoute` renders before `AuthProvider` has fetched `/me`, sees `user === null`, and redirects to `/login`; the login page sees the token and redirects back. Usually `/me` resolves within one cycle and it stops, which is why it's intermittent: on slow networks it loops a few times or until the browser throttles navigation.

Plan:
1. One source of truth: `AuthProvider` exposes `status: 'loading' | 'authenticated' | 'unauthenticated'` and `user`. Every client guard uses it; `Login.tsx` no longer reads localStorage directly.
2. Guards don't redirect while `status === 'loading'`; they render a spinner.
3. Login sets the auth state from the login response (user included) before navigating.
4. On 401 or logout, a single `clearSession()` removes the token, calls a logout endpoint to clear the cookie, resets the user and clears the query cache.
5. Middleware and client must agree: since middleware can only see cookies, the session must be cookie-based. I'd suggest moving the token into the httpOnly cookie entirely (safer against XSS too) and having the client learn auth state from `/me`. If that's too big a change today, at least make the client treat 'no cookie' as logged out by asking `/me`, which fails without the cookie.

The AuthProvider change is a good AI task with a precise spec:

```text
Refactor src/auth/AuthProvider.tsx: state is { status: 'loading' |
'authenticated' | 'unauthenticated', user: User | null }, initial status
'loading'. On mount call api.me(); success → authenticated with user; 401 or
network error → call clearSession() and set unauthenticated. Expose login(user)
which sets authenticated synchronously, and logout() which calls clearSession().
clearSession removes localStorage 'token', calls POST /api/logout, and calls
queryClient.clear(). Keep the existing context name and useAuth hook signature.
```

Reviewing the output: on mount, it sets `unauthenticated` immediately if there's no token in localStorage, skipping `/me`. With the cookie being the real session, that's wrong: a user with a valid cookie but cleared localStorage would be logged out. I remove the shortcut. It also treats a network error the same as 401, which logs people out when they're briefly offline; I change network errors to keep `loading` with a retry, or show an error state, and only treat 401 as unauthenticated. It forgot to guard against a state update after unmount, which is minor in React 18; fine.

Guards: `ProtectedRoute` returns a spinner when loading, `<Navigate to='/login' replace state={{ from: location }} />` when unauthenticated. `Login` redirects to `/dashboard` only when `status === 'authenticated'`. Both use `replace` so the back button isn't full of redirects.

The `next` parameter: Login redirects to `from` after login; I validate that it's a relative path starting with '/' and not '//', to avoid an open redirect to another site.

Tests:
- Expired token in storage, no cookie: visiting `/dashboard` ends on `/login` and stays there (assert the navigation count).
- Successful login: lands on `/dashboard` without visiting `/login` again.
- `/me` slow (MSW delay): spinner shows, no redirects happen until it resolves.
- A 401 from any API call clears storage and ends on `/login` once.
- `next=//evil.com` is ignored.

And a cheap safety net: if the app detects more than three auth redirects within a second (a counter in sessionStorage), it stops and shows 'We couldn't verify your session. Sign in again', with a button that clears everything."

#### Another worked example
**Next.js middleware with Supabase or NextAuth.** Middleware refreshes the session cookie, but the response it returns doesn't include the refreshed cookie (it creates a new response instead of passing cookies through), so the browser keeps the expired one; the server component sees no session and redirects to login, while the client library has a fresh session in memory and redirects back. The candidate follows the library's documented middleware pattern for copying cookies onto the response, and asks the AI to compare the code with the docs for the installed version, checking the docs themselves.

#### A third worked example
**Role-based loop.** `/admin` redirects non-admins to `/dashboard`, and `/dashboard` redirects users without a completed onboarding to `/onboarding`, which redirects admins to `/admin`. A three-route loop for an admin who hasn't finished onboarding. The candidate draws the redirect graph, finds the cycle, and centralises routing decisions in one function that maps user state to an allowed route, so every rule is in one place and testable.

#### Step-by-step framework
1. **Map every guard**: what it reads, what counts as logged in, where it redirects.
2. **Verify the AI's map** against the code.
3. **Reproduce** each scenario (expired token, missing cookie, slow `/me`, empty token).
4. **Introduce three-state auth** with one source of truth.
5. **Don't redirect while loading.**
6. **Clear everything on logout and 401.**
7. **Align server middleware and client** on the same session (cookie).
8. **Validate redirect targets**, use replace, add a loop breaker, test each scenario.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Adds a setTimeout before redirecting | Adds a loading state and waits for the answer |
| Patches one guard | Maps every guard and source of truth |
| Checks token presence | Validates with the server or checks expiry |
| 401 clears React state only | clearSession clears storage, cookie, state, cache |
| Middleware and client read different stores | Cookie-based session shared by both |
| Trusts the AI's summary of the guards | Verifies the Login page reads localStorage |
| Open redirect via next parameter | Validates relative paths |

#### Useful phrases
- "A loop means two guards disagree, so I'll find what each one reads."
- "Loading isn't logged out; it's 'we don't know yet'."
- "The middleware can only see cookies, so the client should trust the same thing."
- "On a 401 I want one function that clears every trace of the session."
- "I'll validate the next parameter so we don't create an open redirect."

#### Common pitfalls
- **Storing 'undefined' as a string** in localStorage after `setItem('token', undefined)`.
- **Redirecting during render** in multiple places instead of one guard.
- **Refresh token races**: several 401s at once each trying to refresh and logging the user out.
- **Caches outliving the session**, so the next user sees the previous user's data.
- **Using push instead of replace**, filling history with redirects.
- **Logging users out on network errors.**

#### Follow-ups to expect (with sample answers)
- **"Where should tokens be stored?"** — "Preferably an httpOnly, Secure, SameSite cookie, so JavaScript can't read it, which limits the damage from XSS. Then CSRF needs SameSite and possibly a CSRF token."
- **"How do you handle many simultaneous 401s?"** — "One in-flight refresh promise shared by all requests; they wait for it and retry once; if refresh fails, log out once."
- **"How would you debug this in production?"** — "Log redirect events with reason and auth status to the error tracker, and look for repeated sequences per session."
- **"How do you sync logout across tabs?"** — "A storage event or BroadcastChannel message triggers clearSession in other tabs."

#### What senior interviewers look for
- **Systems view** of auth across server and client.
- **Explicit loading state** and a single source of truth.
- **Security details**: token storage, open redirects, clearing caches.
- **Verified use of the AI** for mapping, with corrections where it was wrong.

#### Practise it
- Build a tiny app with a login page, a protected route and a fake `/me` with a delay; create the loop deliberately, then fix it with three-state auth.
- Draw the redirect graph for an app you know and look for cycles.
- Checklist: guard map · verify AI summary · reproduce expiry and slow /me · three states · no redirect while loading · clearSession · cookie alignment · replace · next validation · loop breaker · tests.

#### Variations you might be asked
- "The loop happens only in Safari." (Third-party cookie or ITP rules.)
- "Users are logged out randomly every hour." (Refresh token race.)
- "After logout, pressing Back shows the dashboard." (Cache and bfcache.)

## Meta: Why did you choose this AI prompt over another?
- id: e1a4e128-7c41-49d6-b42d-f68cc2179ec0
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- companies: Meta, Anthropic, Canva
- tags: AI-assisted, meta, prompting

### Prompt
Partway through an AI-assisted coding round, the interviewer points at something you typed into the assistant and asks: "Why did you write the prompt that way? What else could you have asked, and why didn't you?"

### Answer
#### What the interviewer is really testing
- **Intent**: did you write the prompt on purpose, or did you just type whatever came to mind?
- **Prompting as engineering**: context, constraints, scope and output shape are design decisions, the same as choosing a data structure.
- **Knowing the tool's failure modes**: making things up, ignoring constraints, over-building, losing context in long chats. A good prompt guards against these.
- **Keeping control**: the prompt should keep you the decision maker, with the AI doing the typing, not the other way round.
- **Explaining trade-offs out loud**: naming the alternative you rejected and why is the strongest signal you can give.

#### Key points
- **A good prompt has five parts:**
  - **Goal**: what you want done.
  - **Context**: the relevant code, versions and conventions.
  - **Constraints**: what it must not do.
  - **Scope**: one step, not the whole task.
  - **Output shape**: a plan, a diff, a single function, ranked hypotheses, or tests.
- **Always compare it to a weaker alternative.** "I could have asked 'build an autocomplete', but that would have given me 200 lines I'd have to reverse-engineer, with choices I didn't make."
- **Choose the output to fit the stage you're at:**
  - Exploring: ask for options or a plan.
  - Building: ask for a small, focused piece of code.
  - Debugging: ask for hypotheses, not a fix.
  - Verifying: ask for edge cases or tests.
- **Give it only the code it needs.** Paste the relevant function and types, not the whole repo. Less noise means fewer invented assumptions, and it shows you know where the problem is.
- **Say your constraints out loud.** "No new dependencies", "React 18, TypeScript", "use the existing `apiClient`". Each one rules out a failure you've seen before.
- **It's fine to admit a prompt didn't work.** Then explain how you changed it: "the first one was too broad, so I narrowed it." That shows you're learning as you go.

#### Model answer
"Sure. The task is a search box with autocomplete, so I'll talk through the prompt I just used.

I wrote: 'In this React 18 + TypeScript component, add debounced fetching of suggestions using our existing `useDebouncedValue` hook and the `apiClient.get` wrapper. Cancel in-flight requests when the query changes, using AbortController. Don't add dependencies. Don't touch the rendering yet. Return only the hook body and explain how stale responses are handled.'

The obvious alternative was 'build an autocomplete component'. I didn't use it for three reasons.

First, **scope**. A whole-component prompt makes dozens of decisions at once: styling, keyboard navigation, accessibility, data fetching, caching. If I accept that, I'm reviewing someone else's design under time pressure, and it's hard to tell which parts are wrong. Asking for one layer, the data fetching, gives me about 25 lines I can read properly in a minute.

Second, **constraints**. Each one rules out something I've seen these tools do. Without 'use our hook and our `apiClient`', it tends to write its own debounce with `setTimeout` and call `fetch` directly, which would work but wouldn't match the codebase. Without 'AbortController', it often ignores stale responses entirely, and that's the classic autocomplete bug where results for 'rea' arrive after results for 'react'. Without 'no new dependencies', it sometimes reaches for lodash.

Third, **output shape**. I asked it to explain how stale responses are handled because that's the part I care most about being right. If its explanation doesn't match its code, that tells me straight away something is off, before I've run anything.

What I deliberately left out: I didn't ask it to write tests in the same prompt. I'll do that next, with a list of cases I write myself (fast typing, an empty query, a network error, unmounting mid-request), because I want the test cases to come from my understanding, not the AI's.

And to be honest about the earlier one: my first prompt in this session, for the dropdown markup, was too vague. It gave me a `div` soup with no ARIA roles. So I re-prompted with 'use the combobox pattern: `role=combobox` on the input, `role=listbox` and `role=option`, `aria-activedescendant` for the highlighted item', and that came back right. The lesson is the same: be specific about the things you know matter."

#### Another worked example
**Debugging rather than building.** In a debugging round, a test for a cart total fails intermittently. The candidate's prompt: "Here is the failing test, the stack trace, and the `calculateTotal` function. Don't fix anything yet. Give me three hypotheses for why this could fail only sometimes, ranked by likelihood, and for each one the quickest check that would confirm or rule it out."

Asked why: "If I'd asked 'fix this test', the most likely result is a change that makes it pass, like a wider tolerance, a retry, or a mocked clock, without anyone knowing the cause. Asking for hypotheses with a check for each keeps me in the investigation. Its first hypothesis was floating-point rounding, which didn't fit because the inputs were integers in cents. The second was test order: a shared module-level cart wasn't being reset between tests. One `it.only` run confirmed it in thirty seconds. I didn't paste the whole test file because the other 40 tests would have been noise. I pasted the setup and teardown because shared state was one of my own suspicions."

#### A third worked example
**Asking for options before code.** In a component-design round about a data table with sorting, filtering and pagination, the candidate prompts: "List two or three ways to manage sorting, filtering and pagination state for a table backed by a paginated REST API, with trade-offs. Assume the URL should reflect the current view. No code yet."

Asked why: "This is a design decision with real consequences, like shareable URLs, the back button, and server versus client filtering. If I ask for code first, the AI picks one approach without saying so, and I've lost the chance to make the decision. With options, I can pick URL search params as the source of truth, explain why to you, and then prompt for code in that shape." The point: the right prompt depends on whether you're deciding or doing.

#### Step-by-step framework
1. **Say what stage you're at**: exploring, building, debugging or verifying.
2. **Pick the output shape for that stage**: options, a small diff, hypotheses, or tests.
3. **Give only the context it needs**: the relevant code, versions, and one example of the codebase's conventions.
4. **Add constraints that rule out failures you've seen before** (new dependencies, ignoring existing helpers, skipped edge cases).
5. **Keep it to one step** you can review in about a minute.
6. **Ask it to explain the part that's riskiest**, so you can check its reasoning against its code.
7. **When asked, name the alternative prompt** and explain why you didn't use it.
8. **When a prompt fails, say how you changed it.**

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "I just asked it to build it" | Explains scope, constraints and output shape |
| No alternative considered | Names the broader prompt and why it was rejected |
| Pastes the whole file every time | Pastes the function and types that matter |
| Same kind of prompt for every stage | Options to explore, hypotheses to debug, tests to verify |
| Hides prompts that didn't work | "My first prompt was too vague; here's how I fixed it" |
| Lets the AI write the test cases | Writes the cases, lets the AI write the code for them |

#### Useful phrases
- "I kept it to one layer so I could review it properly in a minute."
- "Each constraint rules out something I've seen these tools get wrong."
- "I asked for hypotheses, not a fix, because I want to understand the cause."
- "I asked it to explain the stale-response handling so I could check its reasoning against its code."
- "The broader prompt would have made design decisions I want to make myself."
- "That first prompt was too vague, so I narrowed it."

#### Common pitfalls
- **Not having a reason.** "It seemed fine" tells them you weren't thinking about it.
- **Over-explaining prompt tricks** (role-play intros, "you are an expert"), as if the wording were the skill. The skill is giving it the right context and the right scope.
- **Prompts that are too big**, then struggling to review a wall of code while the clock runs.
- **Prompts with no constraints**, then having to undo new dependencies or a different code style.
- **Long chats that drift.** After many turns, the AI may lose track of earlier constraints. Sometimes the best move is a fresh chat with a clean summary.
- **Getting defensive** when the interviewer suggests a better prompt. Agree, and use it.

#### Follow-ups to expect (with sample answers)
- **"How would you prompt differently if this were a codebase you didn't know?"** — "I'd start by asking it to explain, not to write: 'summarise how data fetching works in these three files and which helpers exist'. Then I'd check that summary against the code before asking for anything new."
- **"When do you start a new chat?"** — "When the conversation has gone off track, or after I've changed direction. Old wrong attempts in the context can pull new answers back towards them. I'll paste a short summary of the current state and constraints into a fresh chat."
- **"Do you ever give it the whole file?"** — "When the question is about the whole file, like 'what's the structure here?' For a specific change, I give the function and its types, plus one nearby example of the conventions."
- **"How do you know the prompt worked?"** — "I read the output against my constraints, check that its explanation matches its code, and run it against cases I wrote myself."

#### What senior interviewers look for
- **Prompts that follow a plan**: decide, then build in small steps, then verify.
- **Constraints based on experience** of how these tools fail.
- **Keeping the important decisions and the test cases for themselves.**
- **Being open about prompts that didn't work**, and adjusting quickly.
- **Brief explanations.** A 30-second answer that names the alternative beats a five-minute lecture on prompting.

#### Practise it
- Take a small feature (a debounced search, a modal, a paginated list) and write two prompts for it: one broad, one scoped with constraints and an output shape. Run both and compare how long each takes to review and what each got wrong.
- For your next three real prompts at work, write down in one sentence why you chose that output shape.
- Practise saying your answer in under 45 seconds: the prompt, the alternative, three reasons.
- Checklist: stage · output shape · minimal context · constraints · one step · explain the risky part · named alternative · how a failed prompt was fixed.

#### Variations you might be asked
- "Walk me through your prompting strategy for this whole task."
- "Your prompt was very long. Was all of that necessary?"
- "What would you have done if the AI ignored one of your constraints?"
- "Show me a prompt you'd write to get tests for this component."

## Meta: The AI gave you code that works but doesn't match the codebase style. What do you do?
- id: 5e4a455e-a89f-4da4-8705-e1890c5dbdef
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: easy
- levels:
- tags: AI-assisted, meta, code-quality

### Prompt
You're adding a feature to an existing codebase during an AI-assisted round. The AI's code works and the tests pass, but it doesn't look like the rest of the project: different patterns, naming, and libraries. The interviewer asks: "It works. Would you ship it like this? What do you do?"

### Answer
#### What the interviewer is really testing
- **Do you value maintainability** as well as "it works"? Code is read far more often than it's written.
- **Can you tell formatting apart from patterns?** Formatting is a tool's job. Patterns like data fetching, error handling and state management carry real meaning.
- **Do you look at the codebase before you write?** Spotting the mismatch means you know what "our way" is.
- **Do you fix the cause, not only the symptom?** Feeding the conventions to the AI stops the same mismatch happening on the next prompt.
- **Time judgment**: in a timed round, what you fix now versus what you note and leave.

#### Key points
- **Short answer: no, I wouldn't ship it as is, but most of it is a quick fix.** Working code that ignores conventions costs the next reader, makes reviews harder, and often skips things the project's helpers already handle.
- **Sort the differences into three groups:**
  - **Formatting** (quotes, semicolons, import order): run Prettier and ESLint. Don't spend thinking time on it.
  - **Naming and structure** (file names, named versus default exports, hook naming, folder layout): quick edits, worth doing.
  - **Patterns and libraries** (raw `fetch` instead of the shared `apiClient`, axios in a fetch codebase, `useEffect` fetching in a React Query codebase, inline styles in a CSS Modules codebase): these matter most, because the shared helpers usually do auth headers, error handling, retries, logging or caching for you.
- **Fix the cause.** Show the AI one existing file as an example ("match the style of `useOrders.ts`"), or put the conventions in a project rules file the assistant reads (such as `CLAUDE.md`, `.cursorrules`, or a contributing guide).
- **Not every difference is wrong.** If the AI's approach is better than the house style, raise it as a separate discussion. Don't quietly introduce a second way of doing things.
- **Say it out loud in the interview.** "It works, but it bypasses our `apiClient`, so it won't send the auth header on refresh. I'll switch it over." That gets you credit for noticing.

#### Model answer
"It works, but I wouldn't ship it like this. Let me show you what I mean and how I'd fix it.

I asked for a hook to load a user's saved addresses. Comparing it with the hooks already in `src/hooks`, I see three kinds of difference.

**Formatting**: it uses double quotes and no trailing commas, while the project uses single quotes. I won't think about that at all. Prettier is configured, so I'll run it on save and it's gone.

**Naming and structure**: it's a default export called `fetchAddresses` in `addressHook.ts`. Every other hook here is a named export, `useSomething`, in a file with the same name. So I'll rename it to `useSavedAddresses` in `useSavedAddresses.ts` with a named export. That takes thirty seconds, and it matters because people search for hooks by that convention, and the `use` prefix is what lets the React hooks lint rules check it.

**Patterns**: this is the one that actually matters. It calls `fetch` directly inside a `useEffect` with `useState` for loading and error. But the rest of the codebase uses React Query, through our `apiClient`. That's not just style. The `apiClient` adds the auth token and turns a 401 into a logout, and React Query gives us caching, deduplication and refetch on window focus. The AI's version would show stale addresses after the user adds one on another page, and it would fail silently if the token expired. So it 'works' in the demo, but it would cause bugs in production.

So I'll rewrite it as `useQuery({ queryKey: ['addresses', userId], queryFn: () => apiClient.get('/addresses') })`, matching `useOrders.ts`, and use the existing `queryKeys` helper if there is one.

Then I'll fix the cause. I'll paste `useOrders.ts` into the chat and say 'match this pattern for new data hooks', so the next hook comes out right first time. In a real project I'd add a line to the assistant's rules file: 'data fetching uses React Query via apiClient; hooks are named exports in matching files'.

One thing I would not do is decide the AI's style is better and leave it. If I thought the house style had a problem, I'd raise it with the team. Two ways of fetching data in one codebase is worse than either one."

#### Another worked example
**Styling mismatch in a design-system codebase.** The AI builds a promo banner with Tailwind classes and a hard-coded `#2563eb`, but the project uses CSS Modules with design tokens (`var(--color-primary)`) and a shared `Button` component. The candidate explains: "The colour will drift the next time the brand palette changes, and it won't switch in dark mode, because our tokens handle that. And the raw button misses the focus ring and loading state that our `Button` has." They swap in the `Button` component, move the styles into `PromoBanner.module.css` using tokens, and check the banner in dark mode. Then they point the AI at an existing component to use as an example for the next one.

#### A third worked example
**Error handling and types.** In a TypeScript codebase, the AI's form-submit handler uses `catch (e: any)` and `alert(e.message)`. The project has a `Result` type for API calls and a `useToast` hook, and the lint config forbids `any`. The candidate notes: "This passes because the strict lint step only runs in CI. But it would show users raw server messages, which can leak internal details, and it skips our error tracking." They switch to the existing pattern and run the linter locally so the mismatch is caught before review. That's another case where the tools enforce the convention, so the candidate doesn't have to remember it.

#### Step-by-step framework
1. **Look at two or three neighbouring files** before accepting AI code, so you know what the house style is.
2. **Run the formatter and linter** to remove formatting differences.
3. **Fix naming and structure**: exports, file names, folder layout, hook naming.
4. **Check patterns and libraries**: does the code bypass a shared helper, component or type? Ask what that helper does that this code doesn't.
5. **Rewrite to the existing pattern**, using a nearby file as the example.
6. **Fix the cause**: give the AI an example file or a rules file.
7. **Raise real disagreements with the team**, separately, rather than mixing styles.
8. **In a timed round, fix the patterns now** and note anything cosmetic you didn't get to.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "It works and tests pass, ship it" | Explains the maintenance and bug cost of mismatched patterns |
| Fixes quotes and spacing by hand | Lets Prettier and ESLint do that |
| Treats all differences as equal | Separates formatting, naming and patterns |
| Misses that it bypasses `apiClient` | Explains what the shared helper does that this code skips |
| Fixes the same mismatch every prompt | Gives the AI an example file or a rules file |
| Quietly adds a second pattern | Raises a better approach with the team |

#### Useful phrases
- "It works, but it doesn't work the way the rest of the code does, and that costs the next reader."
- "Formatting is the tool's job, so I'll just run Prettier."
- "This bypasses our `apiClient`, which means no auth refresh and no error logging."
- "I'll point the AI at `useOrders.ts` so the next one comes out matching."
- "If I think the house style is wrong, that's a team discussion, not something to change in one PR."

#### Common pitfalls
- **Treating style as cosmetic only.** Bypassing shared helpers is often a real bug waiting to happen.
- **Spending interview time on formatting** a tool would fix in a second.
- **Re-prompting with "match the codebase style"** without showing it any of the codebase. It can't match what it hasn't seen.
- **Mixing patterns** because the AI's way seemed nicer.
- **Not looking at the codebase first**, so the mismatch isn't noticed until review.
- **Over-correcting**: rewriting good logic just to look different, when only the outer layer needed changing.

#### Follow-ups to expect (with sample answers)
- **"How do you stop this happening on a team?"** — "Automate what you can: Prettier, ESLint rules, and sometimes custom lint rules like 'no direct fetch outside apiClient'. Keep a short conventions file the AI tools read. Then reviewers can focus on logic."
- **"What if there's no consistent style?"** — "I'd follow the most recent or most common pattern in that area, mention the inconsistency, and suggest the team pick one. I wouldn't add a third style."
- **"Is it ever OK to ship it as is?"** — "For a throwaway prototype or a spike, yes, as long as it's clearly marked. For code other people will maintain, the patterns should match."
- **"How long would you spend on this in the interview?"** — "A minute or two for patterns, because they affect behaviour. Formatting takes no time with tools. Anything cosmetic I didn't get to, I'd mention."

#### What senior interviewers look for
- **Seeing the hidden behaviour** in shared helpers, like auth, retries, caching and logging.
- **Automating consistency** rather than relying on people remembering.
- **Feeding conventions back into the AI** so the problem doesn't repeat.
- **Respect for team decisions**, while still being willing to raise improvements.

#### Practise it
- Pick a file in a codebase you know, ask an AI to write a similar one without showing it any examples, and list every difference. Then show it the example file and compare the second result.
- Write a five-line conventions file for a project you work on (data fetching, styling, exports, error handling, testing).
- For one AI-written function at work this week, ask what the shared helper does that the AI's code doesn't.
- Checklist: look at neighbours · formatter and linter · naming and structure · patterns and libraries · what the helper does · rewrite to example · fix the cause · raise disagreements separately.

#### Variations you might be asked
- "The AI used a library we don't have. Do you add it?"
- "The AI's code is actually better than ours. Now what?"
- "How would you review a teammate's PR that's obviously AI-written and off-style?"
- "What would you put in an AI rules file for this project?"

## Meta: The AI confidently claims library X has method Y. You're not sure. How do you check?
- id: 0b495b07-4c2d-47e0-bd5f-4a00f1fe4e62
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- companies: Meta, Apple
- tags: AI-assisted, meta, verification

### Prompt
During an AI-assisted round, the assistant suggests code that relies on a library method or option you don't recognise, and it presents it as fact. The interviewer asks: "Are you sure that exists? How would you check, quickly?"

### Answer
#### What the interviewer is really testing
- **Healthy scepticism**: AI tools can invent APIs, mix up versions, or describe a proposal as if it shipped. Do you know that?
- **A fast, ordered way to check** that fits inside a timed interview, not "I'd google it" and nothing more.
- **Version awareness**: the method may exist, but not in the version installed, or it may have been removed.
- **Using your own environment as the source of truth**: types, `node_modules`, a quick run, the existing codebase.
- **Calm honesty**: "I'm not sure, let me check" is a strong answer, not a weak one.

#### Key points
- **Don't ask the AI whether it's sure.** It may just agree with itself, or apologise and invent a different method. Check against something outside the chat.
- **Fastest checks first:**
  - **The editor and TypeScript**: does autocomplete offer it? Does it type-check? Go to the definition.
  - **The installed version**: look in `package.json` and the lockfile, then in the package's `.d.ts` files in `node_modules`.
  - **Run it**: a one-line test in the console, a REPL, or a tiny test.
  - **The codebase**: grep for existing uses.
  - **Official docs for the installed version**, plus the changelog or migration guide.
  - **MDN and caniuse** for browser APIs, to check where it's supported.
- **Common reasons for a wrong claim:**
  - It's from a different major version (old or new).
  - It's from a similar library (lodash versus Ramda, Moment versus date-fns).
  - It's a proposal that changed before shipping.
  - It was never real.
- **Once checked, fix the prompt.** Tell the AI the installed version, or paste the type definition, so it stops suggesting the wrong API.
- **Without internet**, rely on types, `node_modules` and running the code. These are the most accurate sources anyway, because they describe what is actually installed.

#### Model answer
"I'm not sure, so let me check rather than guess. That's a good example, actually.

The AI suggested this for loading the user's orders:

`useQuery({ queryKey: ['orders'], queryFn: fetchOrders, onSuccess: (data) => setSelected(data[0]) })`

The `onSuccess` option looks familiar, which is exactly why I'm suspicious. I remember it from older React Query code, and I think it changed.

So, quickest checks first. I'll hover over `onSuccess` in the editor. TypeScript shows a red underline: 'Object literal may only specify known properties'. That's already strong evidence. Next, `package.json` says `@tanstack/react-query` is version 5. I'll jump to the type definition for the `useQuery` options, and there's no `onSuccess`. So it exists in version 4 but not in the version we have. The v5 migration guide confirms it: the `onSuccess`, `onError` and `onSettled` callbacks were removed from `useQuery`.

Why that matters here: if this were plain JavaScript, there'd be no type error. The option would be silently ignored, and the first order would never be selected. No crash, just a bug that looks like a state problem. That's the dangerous kind of AI mistake: plausible, confident, and failing quietly.

The fix: in v5, derive the value instead of copying it into state. Something like `const selected = selectedId ? orders.find(o => o.id === selectedId) : orders?.[0]`. Or, if I really need a side effect when the data arrives, a `useEffect` on the data. That's actually better, because there's no second copy of the state to keep in sync.

Then I'll update the AI: 'We're on TanStack Query v5; `useQuery` has no `onSuccess`.' That stops it repeating the mistake in later suggestions.

If I didn't have types, say it's a JavaScript project, I'd go straight to the package's files in `node_modules` or run it with a `console.log` inside the callback to see if it fires. Thirty seconds, either way. The general rule I follow is: the installed code is the truth, the docs for that version come second, and the AI's claim is a hint."

#### Another worked example
**A JavaScript built-in that changed before shipping.** The AI suggests `orders.groupBy(o => o.status)` to group orders by status. The candidate isn't sure, so they type `[].groupBy` in the browser console: `undefined`. They then check MDN, which lists `Object.groupBy(items, callback)`. The array method was an earlier proposal, and it was renamed to a static method before it shipped. They check browser support on MDN against the project's browserslist, find it's only in recent browsers, and decide whether a small `reduce` is safer for the users they support. Explaining this: "The AI mixed up a proposal with what actually shipped. The console told me in five seconds, and MDN told me where it's supported."

#### A third worked example
**A CSS property and browser support.** The AI says, "Use `text-wrap: balance` for headings; it's supported everywhere." The candidate checks caniuse and MDN: it's supported in current browsers but missing from older ones still in their browserslist. Because it only affects how lines break, it degrades gracefully, so they keep it with no fallback, and note that a layout-critical feature would need an `@supports` fallback instead. The point: checking isn't only "does it exist", it's "does it exist for our users, and what happens if it doesn't".

#### Step-by-step framework
1. **Say you're not sure.** Don't pretend.
2. **Editor first**: autocomplete, type errors, go to definition.
3. **Installed version**: `package.json`, lockfile, the package's types in `node_modules`.
4. **Run it**: console, REPL, or a tiny test.
5. **Search the codebase** for existing uses.
6. **Official docs for that version**, the changelog and migration guide; MDN and caniuse for browser APIs.
7. **Fix it**, preferring the current recommended pattern.
8. **Tell the AI** the version or paste the type, so it stops repeating the mistake.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "I'll ask the AI if it's sure" | Checks something outside the chat |
| "I'd google it" | Editor, types, installed version, run it, then docs |
| Checks the latest docs only | Checks docs for the installed version |
| Uses it because no error appeared | Knows wrong options can be silently ignored in JavaScript |
| Forgets browser support | Checks MDN and caniuse against browserslist |
| Moves on after fixing | Updates the AI's context so it stops suggesting it |

#### Useful phrases
- "I'm not sure, so I'll check rather than guess."
- "The installed code is the truth; the AI's claim is a hint."
- "This is from version 4; we're on version 5."
- "In plain JavaScript this would be silently ignored, which is worse than a crash."
- "Let me tell the AI which version we're on so it stops suggesting this."

#### Common pitfalls
- **Asking the AI to check itself.** It may just repeat or invent a different answer.
- **Trusting it because it looks familiar.** Familiar APIs from older versions are the most common trap.
- **Reading the latest docs** when the project is on an older major version.
- **Assuming no error means it works.** Unknown options in plain objects are usually ignored.
- **Forgetting browser support** for new built-ins and CSS.
- **Spending five minutes in docs** when hovering in the editor would answer it in five seconds.

#### Follow-ups to expect (with sample answers)
- **"What if there are no types and no internet?"** — "Open the package in `node_modules`: its `package.json` gives the version and entry point, and I can search the source for the method name. Or log inside the callback and run it."
- **"How do you avoid this happening in the first place?"** — "Tell the AI the versions up front, keep strict TypeScript on, and treat anything unfamiliar as unconfirmed until it type-checks or runs."
- **"What if the AI's method does exist, but is deprecated?"** — "Then I'd use the recommended replacement, because deprecated APIs get removed in the next major version, and I'd check the migration guide for the reason."
- **"Have you seen an AI invent an API at work?"** — "Yes. The common ones are options from an older version and methods borrowed from a similar library. The type checker usually catches them; the dangerous ones are in untyped code."

#### What senior interviewers look for
- **A fast, ordered method** that starts with the cheapest checks.
- **Version thinking**: the right docs for the installed package.
- **Knowing how failures hide**: ignored options, silent no-ops, missing browser support.
- **Using types and tests to catch this kind of mistake automatically.**

#### Practise it
- Pick a library you use and find one option that was removed or renamed in its last major version. Write the old code, and see how TypeScript and the runtime react.
- Practise jumping from an import to its type definition, and finding a package's version in the lockfile, in under 15 seconds each.
- Ask an AI about a niche option of a library you know well, and check its answer against the installed types.
- Checklist: say you're unsure · editor and types · installed version · run it · grep codebase · versioned docs · MDN and caniuse · fix · update AI context.

#### Variations you might be asked
- "The AI says this CSS property works in Safari. How do you check?"
- "The AI cites a docs page that doesn't seem to exist. What now?"
- "Two AI answers contradict each other. Which do you believe?"
- "How would you check an AI's claim about a Node.js API?"

## Meta: You're stuck. The AI's suggestions aren't helping. What's your move?
- id: ff41c66d-e01d-47a7-9b32-f56ab5009872
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, meta, problem-solving

### Prompt
Twenty minutes into an AI-assisted round, something isn't working. You've tried three of the AI's suggestions and none of them fixed it. The interviewer asks: "What's your next move?"

### Answer
#### What the interviewer is really testing
- **Do you recognise a loop?** Re-prompting the same way and hoping for a different result is the most common failure in these rounds.
- **Can you debug without the tool?** Reproduce, observe, form a hypothesis, test it.
- **Can you change how you use the AI**, instead of just giving up on it?
- **Communication**: keeping the interviewer informed, and asking for a hint at the right time.
- **Time management**: knowing when to simplify the scope and deliver something working.

#### Key points
- **Stop prompting.** If three suggestions failed, the problem is likely the question, not the answers. The AI is solving the problem as you described it, and that description is probably wrong.
- **Go back to evidence:**
  - Reproduce it reliably.
  - Read the actual error or behaviour.
  - Add logs or breakpoints.
  - Shrink it to the smallest case that still fails.
- **State the problem out loud** in one sentence: expected, actual, and what you've ruled out. Often the gap shows itself here.
- **Change the question:**
  - Ask the AI to explain the code, or list hypotheses, instead of asking for a fix.
  - Start a fresh chat with a clean summary. Long chats full of failed attempts tend to pull answers back towards them.
- **Talk to the interviewer.** Say where you are, what you've ruled out, and what you're trying next. Asking for a hint after a real attempt shows good judgment, not weakness.
- **Have a fallback.** If time is short, deliver a simpler version that works, and explain what's left and how you'd approach it.

#### Model answer
"My next move is to stop asking the AI for fixes. Three failed suggestions tells me I've been describing the problem wrong, so it keeps solving the wrong problem.

Here's where I am. It's a search box: type a query, see results. The bug is that sometimes the results don't match what's in the box. I type 'react hooks' and I see results for 'react h'. I told the AI 'the results are stale', and it suggested a longer debounce, then `useCallback` on the handler, then adding the query to the effect's dependency array. Each one seemed reasonable, none fixed it, and the debounce one made it rarer, which made it look fixed for a minute.

So, evidence. I'll open the Network tab and throttle to 'Slow 4G' so I can reproduce it reliably. And there it is: the request for 'react h' was sent first, but it returned after the request for 'react hooks'. The responses are arriving out of order, and whichever arrives last overwrites the state. So it isn't a stale closure or a debounce problem at all. It's a race between requests. Debouncing just made the race less likely, which is why it seemed to help.

That's why the AI was stuck. I kept saying 'stale', which points to closures and dependency arrays. Now I can describe it properly, so I'll start a new chat, because the old one is full of debounce ideas, and ask: 'Requests for a search box can resolve out of order and overwrite newer results. Show me how to cancel the previous request with AbortController in this `useEffect`, and ignore an AbortError.'

The fix is: create an `AbortController` in the effect, pass its signal to `fetch`, and call `controller.abort()` in the cleanup. When the query changes, the previous request is cancelled, and even if a response sneaks in, it's ignored. Then I'll write a test that resolves two mocked requests in reverse order and checks the newer results win.

If that hadn't turned anything up after a few minutes, I'd have told you: 'I've ruled out the debounce and the closure; I think it's in the data layer. Can I get a hint?' And if we were near the end, I'd make the simplest working version, for example a request ID check, and explain what I'd improve."

#### Another worked example
**A layout bug the AI can't see.** A modal won't sit on top of a sticky header, even with `z-index: 9999`. The AI suggests ever larger `z-index` values, then `position: relative`. The candidate stops and opens DevTools. The modal is inside a parent with `transform: translateX(0)` (left over from an animation), which creates a new stacking context, so no `z-index` inside it can rise above the header. They explain: "The AI can't see the rendered page, only the snippet I pasted. The cause was in a parent I hadn't shown it." Fix: render the modal in a portal at the end of `body`. They tell the AI the actual cause and ask it to write the portal, which takes it one attempt.

#### A third worked example
**Shrinking the problem.** A Jest test fails with "Cannot use import statement outside a module", and the AI's config changes keep failing. The candidate makes a blank test file that imports only the suspect package. It fails the same way, so the problem is that package, not their code. The package ships only ES modules, and Jest isn't set up to transform files in `node_modules`. With that one sentence, the AI suggests the right `transformIgnorePatterns` change straight away. The point: shrinking to the smallest failing case turns a vague question into a precise one.

#### Step-by-step framework
1. **Notice the loop.** Two or three failed suggestions means stop.
2. **Tell the interviewer** where you are.
3. **Reproduce reliably**: throttle the network, fix the input, isolate the case.
4. **Observe**: read the full error, use DevTools, the Network tab, logs, breakpoints.
5. **Shrink**: remove things until the smallest failing case remains.
6. **Say it in one sentence**: expected, actual, ruled out.
7. **Change the question or start a fresh chat**: ask for hypotheses or an explanation, with the real evidence.
8. **Ask for a hint, or simplify the scope**, if time is running out.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Keeps re-prompting "it still doesn't work" | Stops after a few failed tries and gathers evidence |
| Tries random changes | Reproduces, observes, forms one hypothesis at a time |
| Goes silent for ten minutes | Explains what's ruled out and what's next |
| Stays in a long, confused chat | Starts a fresh chat with the real cause described |
| Never asks for help | Asks for a hint after a real attempt |
| Runs out of time with nothing working | Delivers a simpler working version and explains the rest |

#### Useful phrases
- "Three failed suggestions tells me I'm asking the wrong question."
- "Let me get evidence before I change anything else."
- "Here's what I've ruled out, and what I'm checking next."
- "I'll start a fresh chat. The old one is full of wrong ideas."
- "I'm going to get the simple version working first, then come back to this."

#### Common pitfalls
- **Re-prompting the same way.** "Still broken, try again" gets you variations of the same wrong idea.
- **Accepting a change that makes the bug rarer** as if it were a fix.
- **Not showing the AI what it needs**: the parent CSS, the Network tab timing, the full error.
- **Silence.** The interviewer can't give credit for thinking they can't hear.
- **Asking for a hint too early**, before trying anything, or too late, with no time left.
- **Losing the working version** while experimenting. Commit or note it first.

#### Follow-ups to expect (with sample answers)
- **"How do you know when to stop using the AI?"** — "When it's given two or three suggestions that didn't work, or when I can't explain why a suggestion should work. At that point I need evidence, not more ideas."
- **"Would you ever just ask the interviewer?"** — "Yes, after I've done some real work on it. I'll say what I've tried and what I think is going on. That's how I'd work with a teammate."
- **"What if you can't reproduce it?"** — "I'd change the conditions that could matter one at a time: network speed, data size, browser, timing. And add logging that records the sequence of events, so the next occurrence tells me something."
- **"What do you do differently in a real job versus an interview?"** — "Same method, different timescale. In a job I might also look at git history to see when it started, or ask whoever wrote the code."

#### What senior interviewers look for
- **Noticing the loop quickly** and changing approach.
- **Evidence over guessing.**
- **Using the AI more cleverly**: explaining, generating hypotheses, a fresh context.
- **Clear communication** and a sensible fallback under time pressure.

#### Practise it
- Build a search box with a fake API that delays responses randomly, reproduce the out-of-order bug, and fix it with AbortController. Then try describing it to an AI as "stale results" and see what it suggests.
- Next time you're stuck at work, write your one-sentence problem statement (expected, actual, ruled out) before prompting again.
- Practise saying "here's where I am" in under 20 seconds.
- Checklist: notice loop · tell the interviewer · reproduce · observe · shrink · one sentence · fresh chat or new question · hint or simpler scope.

#### Variations you might be asked
- "The AI's fix works on your machine but the test still fails in CI."
- "You've spent 15 minutes on one bug. What do you do with the remaining 20?"
- "The AI keeps going back to the same wrong suggestion. Why does that happen?"
- "How would you help a teammate who's stuck going round in circles with an AI tool?"

## Meta: How much should you rely on AI in this interview?
- id: ad8091a9-895c-4567-961c-6568b683d11b
- roles: frontend, fullstack, ai
- round: AI_ASSISTED_CODING
- difficulty: medium
- levels:
- tags: AI-assisted, meta, philosophy

### Prompt
At the start of an AI-assisted coding round, or after watching you work for a while, the interviewer asks: "How much do you think you should rely on the AI here? Where do you draw the line?"

### Answer
#### What the interviewer is really testing
- **A clear working model**: what you hand to the AI and what you keep for yourself, and why.
- **Ownership**: you're responsible for every line, whoever typed it.
- **Fundamentals**: can you still explain, debug and change the code without the AI?
- **Using it fully where it helps**: refusing to use it in an AI round is as weak as over-relying on it.
- **Respecting the rules**: checking what's allowed instead of assuming.

#### Key points
- **A simple rule: I make the decisions, the AI does a lot of the typing, and I read every line.**
- **Good uses of the AI:**
  - Boilerplate and scaffolding.
  - Recalling an API you half know (then checking it).
  - Turning test cases you wrote into test code.
  - Suggesting alternatives and edge cases.
  - Explaining unfamiliar code.
  - Repetitive changes across files.
- **Keep for yourself:**
  - Understanding the requirements and asking clarifying questions.
  - The design and data model.
  - The core logic the task is really about.
  - Deciding which edge cases matter.
  - Final checks on correctness, security and accessibility.
- **The test for every line: could I explain this and change it without the AI?** If not, it's not ready to accept.
- **How much depends on the task.** More AI for boilerplate in a familiar stack. Less for the core algorithm, security-sensitive code, or when the interviewer wants to see fundamentals.
- **Ask about the rules at the start**: "Is it fine to use the assistant for anything, or would you like me to write some parts myself?"

#### Model answer
"My rule is: I make the decisions, the AI does a good share of the typing, and I read every line before I accept it. If I couldn't explain a line and change it myself, it's not done.

Let me make that concrete with this task, the Kanban board with drag-and-drop between columns.

The first five minutes I'd do without the AI at all: ask you clarifying questions (do cards need to persist? reorder within a column, or only move between columns? keyboard support?), then sketch the data model. I'd choose `columns: { id, title, cardIds[] }` and `cards: Record<id, Card>`, so moving a card is just moving an ID between two arrays. That's the decision the rest of the solution depends on, so it's mine.

Then I'd lean on the AI for scaffolding: the `Board`, `Column` and `Card` components, the basic CSS layout, the TypeScript types from my model. That's quick for it and boring for me, and I can review it at a glance.

The `moveCard` function, which handles moving within a column, between columns and to an empty column, is the core of the task, so I'd write it myself. It's maybe fifteen lines, and it's where the bugs would be, like an off-by-one when moving down within the same column. If I let the AI write it, I'd have to check it just as carefully anyway, and you'd learn less about how I think.

For drag-and-drop, I'd ask the AI to wire up the native HTML drag events, or the library the codebase already uses, because that's API recall, not judgment. Then I'd check what's missing. Native drag-and-drop doesn't work with a keyboard, so I'd add move buttons or arrow-key handling, because accessibility is a check I own.

For tests, I'd write the list of cases myself (move to an empty column, move to the same position, move within a column down and up) and ask the AI to turn them into test code.

So, roughly: the AI probably types more than half the lines, but every decision and every line of the core logic is mine. And if you'd prefer I write more of it by hand, so you can see fundamentals, I'm happy to. That's why I'd ask about the rules at the start."

#### Another worked example
**Unfamiliar API, familiar problem.** The task is to lazy-load images in a long feed. The candidate knows the concept but doesn't remember the `IntersectionObserver` options. Here they rely on the AI more: "Show me an `IntersectionObserver` hook with `rootMargin` so images start loading 200px before they're visible." Then they check the parts that matter: the observer is disconnected on unmount, each image is unobserved after loading, and there's a fallback. They also mention that native `loading='lazy'` on `img` might be enough, and is simpler. Explaining: "I used the AI for the API details I didn't remember, and kept the decisions: whether we need the observer at all, and when to clean it up."

#### A third worked example
**When to rely on it less.** In a round about a password reset form, the candidate uses the AI for the form layout and validation messages, but writes the security-sensitive parts themselves and says why: the reset token must not end up in analytics or logs (it lives in the URL, so they check the referrer policy and don't send the full URL to tracking), error messages must not reveal whether an email address is registered, and the submit button must prevent double submission. "These are the places where AI-written code tends to look right but leak something, so I want to think them through myself rather than review someone else's version."

#### Step-by-step framework
1. **Ask about the rules** for using the AI in this round.
2. **Clarify requirements yourself**, without the AI.
3. **Design the data model and approach yourself**, and say it out loud.
4. **Use the AI for scaffolding, API recall and repetitive code.**
5. **Write the core logic yourself**, or check AI-written core logic line by line.
6. **Write the test cases yourself**; let the AI write the test code.
7. **Own the final checks**: correctness, accessibility, security, performance.
8. **Apply the rule to every accepted line**: could I explain it and change it without the AI?

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "As much as possible, it's faster" | Clear split: decisions are mine, typing is shared |
| "I prefer not to use it" in an AI round | Uses it fully for the right things |
| Lets the AI design the data model | Designs the model, then asks for scaffolding |
| Accepts code they can't explain | Every line passes "could I explain and change this?" |
| Never checks accessibility or security | Owns those checks explicitly |
| Assumes the rules | Asks what's allowed at the start |

#### Useful phrases
- "I make the decisions, the AI does a lot of the typing, and I read every line."
- "This function is the heart of the task, so I'll write it myself."
- "That's API recall, not judgment, so the AI can do it."
- "If I can't explain a line, it isn't ready to accept."
- "Would you like me to write any part by hand so you can see the fundamentals?"

#### Common pitfalls
- **Handing over the whole task** and spending the round reviewing someone else's design.
- **Refusing to use the AI** to look skilled, and running out of time in a round designed for it.
- **Letting the AI choose the data model**, then fighting it later.
- **Skipping the checks** that AI code often gets wrong: accessibility, cleanup, error states, security.
- **Not explaining your split**, so the interviewer can't tell what you understood.
- **Giving a number with no reasoning.** "70%" means nothing unless you explain what's in each part.

#### Follow-ups to expect (with sample answers)
- **"Isn't writing it yourself slower?"** — "For the core logic, not really. I'd need to check the AI's version line by line anyway, and writing it myself is often just as quick. For boilerplate, the AI is much faster, so that's where I use it."
- **"How do you stop your own skills fading?"** — "I keep writing the core parts myself, I read and understand every suggestion, and sometimes I solve a problem first and then compare with the AI's version."
- **"How do you use AI at work?"** — "The same split: scaffolding, tests from my cases, explaining unfamiliar code, repetitive refactors. Design, reviews and security are mine. And I treat its output like a pull request from a new teammate."
- **"What if the AI is better than you at something?"** — "Then I use it, and learn from it. But I still need to understand the result well enough to own it, because I'm the one who'll debug it later."

#### What senior interviewers look for
- **A clear, explained split** between what's delegated and what's owned.
- **Ownership of the important decisions**: data model, core logic, edge cases, security.
- **Confident use** of the AI where it adds speed.
- **Adjusting to the task and the rules**, not a fixed habit.

#### Practise it
- Do a 45-minute build (a Kanban board, an autocomplete, a paginated table) with an AI assistant. Afterwards, list each part as "I decided" or "AI decided", and see whether anything important ended up in the wrong column.
- Practise a 30-second answer to "how much should you rely on it?" using one concrete example.
- Take a function the AI wrote for you recently and rewrite it from memory. If you can't, you didn't really understand it.
- Checklist: ask the rules · clarify yourself · design yourself · AI for scaffolding and recall · core logic yours · test cases yours · own final checks · explain and change every line.

#### Variations you might be asked
- "Would you be comfortable doing this task with no AI?"
- "What's something you'd never let an AI write for you?"
- "How has AI changed how you work day to day?"
- "If a junior used AI for everything, what would you tell them?"
