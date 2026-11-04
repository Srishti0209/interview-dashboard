# Frontend Engineer — Machine Coding

## Build an Autocomplete component
- id: ed4ad96b-83c9-49f7-8252-d9f2d1208d0f
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, a11y, autocomplete, system-design-light
- companies: Apple, Meta, OpenAI, Anthropic

### Prompt
Build an Autocomplete (search-as-you-type) component in React. Requirements: debounced API calls, keyboard navigation (up, down, Enter, Escape), ARIA combobox semantics, recent searches, a loading state and an empty state.

### Answer
#### What the interviewer is really testing
- Can you **scope and sequence** a 45 to 60-minute build: a working core first, then polish?
- **Async correctness**: debouncing, cancelling or ignoring stale responses (race conditions), caching.
- **Keyboard and accessibility**: the WAI-ARIA combobox pattern with `aria-activedescendant`, so focus stays in the input.
- **State modelling**: query, results, status, active index, open/closed, recent searches, without contradictory states.
- Clean **component API** and readable code while talking through decisions.

#### Key points
- **Clarify first (1 to 2 minutes):** minimum characters before searching? Debounce delay (~250ms)? Free text allowed, or must the user pick an option? How many results? Where do recent searches live (localStorage)? Highlight the matched text?
- **State:**
  - `query` (input text), `results`, `status: 'idle' | 'loading' | 'success' | 'error'`, `activeIndex` (-1 for none), `isOpen`.
  - Recent searches in localStorage, shown when the input is focused and empty.
- **Async:**
  - Debounce the query (a `useDebouncedValue` hook).
  - Cancel the previous request with `AbortController`, so a slow "a" response can't overwrite the "ab" results.
  - Optional: cache results per query in a `Map` so backspacing is instant.
- **Keyboard:**
  - ArrowDown / ArrowUp move `activeIndex` (wrapping), and open the list if closed.
  - Enter selects the active option (prevent form submit only when an option is active).
  - Escape closes the list; a second Escape can clear the input.
  - Tab closes the list without hijacking focus.
- **ARIA (combobox pattern):**
  - Input: `role="combobox"`, `aria-expanded`, `aria-controls={listId}`, `aria-autocomplete="list"`, `aria-activedescendant={optionId}` when an option is active.
  - List: `role="listbox"`; items `role="option"` with unique `id` and `aria-selected`.
  - A visually hidden `aria-live="polite"` region announcing "5 results available" or "No results".
  - A real `<label>` for the input.
- **Mouse:** use `onMouseDown` with `preventDefault` on options (so the input doesn't blur before the click registers), or handle blur with a check.
- **States to render:** loading (spinner or "Searching…"), error with retry, empty ("No results for 'xyz'"), recent searches, results with highlighted match.

#### Model answer
"Before coding, I'd confirm a few things: search after one or two characters, 250 milliseconds debounce, selecting an option fills the input and calls `onSelect`, and recent searches are the last five selections in localStorage. Then I'd build it in three passes: the data flow, the keyboard and ARIA layer, then the extra states.

For the data flow, I keep the raw `query` in state and derive a debounced copy. An effect on the debounced query fires the fetch with an `AbortController`, and the cleanup aborts it. That handles the race condition: if the user types 'a', then 'ab', the 'a' request is cancelled, so its late response can never overwrite the 'ab' results. I'd also keep a small cache keyed by query.

```tsx
function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Autocomplete({ fetchOptions, onSelect, label }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useRecentSearches('ac-recent', 5);
  const debounced = useDebouncedValue(query.trim());
  const cache = useRef(new Map<string, Item[]>());
  const id = useId();
  const listId = id + '-list';

  useEffect(() => {
    if (debounced.length < 2) { setStatus('idle'); setResults([]); return; }
    const hit = cache.current.get(debounced);
    if (hit) { setResults(hit); setStatus('success'); return; }
    const ctrl = new AbortController();
    setStatus('loading');
    fetchOptions(debounced, ctrl.signal)
      .then((items) => { cache.current.set(debounced, items); setResults(items); setStatus('success'); setActiveIndex(-1); })
      .catch((e) => { if (e.name !== 'AbortError') setStatus('error'); });
    return () => ctrl.abort();
  }, [debounced, fetchOptions]);

  const showRecent = query.trim() === '' && recent.length > 0;
  const options = showRecent ? recent : results;

  function select(item: Item) {
    setQuery(item.label); setOpen(false); setActiveIndex(-1);
    setRecent(item); onSelect(item);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      if (!options.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + options.length) % options.length);
    } else if (e.key === 'Enter' && open && activeIndex >= 0) {
      e.preventDefault(); select(options[activeIndex]);
    } else if (e.key === 'Escape') {
      if (open) setOpen(false); else setQuery('');
    }
  }

  return (
    <div className="ac">
      <label htmlFor={id}>{label}</label>
      <input
        id={id} role="combobox" value={query}
        aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? listId + '-' + activeIndex : undefined}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul id={listId} role="listbox" aria-label={showRecent ? 'Recent searches' : 'Suggestions'}>
          {status === 'loading' && !showRecent && <li className="ac-status">Searching…</li>}
          {status === 'error' && <li className="ac-status">Something went wrong.</li>}
          {status === 'success' && !results.length && !showRecent && <li className="ac-status">No results for “{debounced}”</li>}
          {options.map((item, i) => (
            <li
              key={item.id} id={listId + '-' + i} role="option" aria-selected={i === activeIndex}
              onMouseDown={(e) => e.preventDefault()} onClick={() => select(item)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <Highlight text={item.label} match={debounced} />
            </li>
          ))}
        </ul>
      )}
      <div aria-live="polite" className="visually-hidden">
        {status === 'success' && open ? results.length + ' results available' : ''}
      </div>
    </div>
  );
}
```

Focus never leaves the input. Instead, `aria-activedescendant` points at the active option's id, so screen readers announce it while the user keeps typing. The `onMouseDown` `preventDefault` on options stops the input blurring, and closing the list, before the click lands. The status messages are inside the listbox only for brevity; in production I'd move them outside it, because a listbox should contain only options, and rely on the live region to announce them."

#### Another worked example
**Highlighting the match safely.** Never build HTML strings with `dangerouslySetInnerHTML` for highlighting; split the text instead:
```tsx
function Highlight({ text, match }: { text: string; match: string }) {
  if (!match) return <>{text}</>;
  const i = text.toLowerCase().indexOf(match.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + match.length)}</mark>
      {text.slice(i + match.length)}
    </>
  );
}
```
And the recent-searches hook, with try/catch because localStorage can throw in private mode:
```tsx
function useRecentSearches(key: string, max: number) {
  const [items, setItems] = useState<Item[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });
  const add = useCallback((item: Item) => {
    setItems((prev) => {
      const next = [item, ...prev.filter((p) => p.id !== item.id)].slice(0, max);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key, max]);
  return [items, add] as const;
}
```

#### A third worked example
**Scrolling the active option into view, and a reducer version.** With long lists, ArrowDown can move the active option off-screen:
```tsx
useEffect(() => {
  if (activeIndex < 0) return;
  document.getElementById(listId + '-' + activeIndex)?.scrollIntoView({ block: 'nearest' });
}, [activeIndex, listId]);
```
If the interviewer pushes on state consistency, refactor the six `useState` calls into a `useReducer` with actions like `typed`, `resultsLoaded`, `moved`, `selected` and `closed`. This makes impossible states (open with a stale `activeIndex` beyond the results length) easier to prevent, because each action resets what it should.

#### Step-by-step framework
1. **Clarify** requirements and agree on the build order (2 minutes).
2. **Sketch state** and the component API (`fetchOptions`, `onSelect`, `label`).
3. **Build the data flow**: input, debounce, fetch with abort, render results.
4. **Add keyboard navigation** with wrapping and Enter/Escape.
5. **Add ARIA**: combobox, listbox, options, activedescendant, live region, label.
6. **Add states**: loading, error, empty, recent searches.
7. **Polish**: highlighting, caching, scroll into view, mouse handling.
8. **Talk through testing and trade-offs**: what you'd test with RTL and MSW, and what you'd add with more time.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Fetches on every keystroke | Debounced, with abort for stale requests |
| Moves DOM focus into the list | Keeps focus in the input with `aria-activedescendant` |
| `div`s with click handlers | Combobox, listbox and option roles, label, live region |
| Options vanish before click registers | `onMouseDown` `preventDefault` |
| Only happy path | Loading, error, empty and recent states |
| Silent coding | Narrates decisions and the build order |

#### Useful phrases
- "I'll get a working, ugly version end to end first, then layer keyboard and ARIA."
- "The abort in the cleanup is what prevents the race condition."
- "Focus stays in the input; `aria-activedescendant` tells assistive tech which option is active."
- "If I had more time, I'd move this into a reducer to rule out impossible states."

#### Common pitfalls
- **Debouncing the function inside the render** (a new debounced function every render, so it never fires correctly).
- **No race-condition handling**, so out-of-order responses show the wrong results.
- Using **`onClick` with `onBlur` closing the list**, so clicks never register.
- Forgetting **`e.preventDefault()`** on ArrowUp/Down (the cursor jumps) and on Enter (submits the form).
- **Duplicate ids** when two autocompletes are on the page; use `useId`.
- Spending 20 minutes on **styling** before the logic works.

#### Follow-ups to expect (with sample answers)
- **"Debounce or throttle?"** — "Debounce: we want to search once the user pauses, not at regular intervals while they type. Throttle suits continuous events like scroll."
- **"How would you handle 10,000 options returned at once?"** — "Limit results server-side, or virtualize the list. With virtualization, `aria-activedescendant` must point to an element that's rendered, so I'd keep the active option in the rendered window and set `aria-setsize` and `aria-posinset`."
- **"How would you test this?"** — "RTL with MSW: type a query, assert the options by role, press ArrowDown and check `aria-activedescendant`, press Enter and check `onSelect`. A race test with MSW `delay` that makes the first query slower, and fake timers for the debounce."
- **"How do you make it reusable across apps?"** — "Split it into a headless hook (`useCombobox`) that returns props for the input, list and options, and a styled component on top. That's how Downshift and React Aria work."
- **"What about mobile?"** — "Bigger touch targets, `inputmode` and `enterkeyhint="search"`, and making sure the virtual keyboard doesn't cover the list."

#### What senior interviewers look for
- **Structured delivery**: working core early, then increments, with time management.
- **Async rigour**: debouncing, cancellation, caching.
- **Accessibility done properly**, not as an afterthought.
- An eye for **API design and reuse** (headless hooks) and testing.

#### Practise it
- Build it from scratch in 45 minutes against a mock API with random latency, then test it with only a keyboard and a screen reader.
- Write an RTL test that proves stale responses are ignored.
- Checklist: debounce · abort · keyboard with wrap · combobox ARIA · live region · loading/error/empty · recent searches · mouse-down fix · `useId`.

#### Variations you might be asked
- "Build a typeahead that searches a local list of 5,000 countries."
- "Build a mention picker that opens when you type @ in a textarea."
- "Make the autocomplete support selecting multiple values."

## Build a Modal with focus trap, ESC to close, click outside, scroll lock, ARIA
- id: 06ed0ac7-342f-45a7-b647-3d68737414b7
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, a11y, modal, focus-management
- companies: Apple, Stripe

### Prompt
Build a reusable Modal dialog component in React. It should trap focus inside while open, close on Escape and on clicking the backdrop, lock background scrolling, restore focus when it closes, and use correct ARIA semantics. This is a common 60-minute problem.

### Answer
#### What the interviewer is really testing
- **Focus management**: moving focus in on open, trapping Tab and Shift+Tab, restoring focus to the trigger on close.
- **Accessibility semantics**: `role="dialog"`, `aria-modal`, labelling, and making the background inert.
- **Event handling details**: Escape, backdrop clicks that don't fire when a drag starts inside the dialog, nested modals.
- **Rendering into a portal**, and scroll lock that doesn't shift the layout.
- Whether you know the **native `<dialog>` element** and when to use it.

#### Key points
- **Two approaches**, worth mentioning upfront:
  1. **Native `<dialog>` with `showModal()`**: built-in focus trapping (via the top layer and inert background), Escape handling (the `cancel` event), `::backdrop`, and correct semantics. Now well supported; often the best real-world answer.
  2. **Custom implementation**: what most interviews want you to show, to prove you understand the mechanics.
- **Structure:** render with `createPortal` into `document.body` to escape `overflow: hidden` and z-index stacking contexts.
- **ARIA:**
  - `role="dialog"` (or `alertdialog` for confirmations that need a response), `aria-modal="true"`.
  - `aria-labelledby` pointing to the title; `aria-describedby` optionally to the body text.
  - Make the background inert: set the `inert` attribute on the app root (also removes it from the accessibility tree and blocks clicks and focus), or `aria-hidden="true"` as a fallback.
- **Focus:**
  - On open, focus the first focusable element, or a specific `initialFocus` element, or the dialog container itself (`tabIndex={-1}`) for long content.
  - Trap: on Tab from the last focusable element, wrap to the first; Shift+Tab from the first wraps to the last. With `inert` on the background, the browser keeps focus in the dialog anyway, but a manual trap handles browser chrome edge cases.
  - On close, return focus to the element that opened it (save `document.activeElement` on open).
- **Closing:**
  - Escape on `keydown`; stop propagation so a nested modal closes only itself.
  - Backdrop click: close only if both `mousedown` and `click` happened on the backdrop itself (`e.target === e.currentTarget`), so selecting text inside the dialog and releasing outside doesn't close it.
  - Allow a `dismissible={false}` option for flows that must not be dismissed accidentally.
- **Scroll lock:** `document.body.style.overflow = 'hidden'`, and add `padding-right` equal to the scrollbar width to avoid layout shift; restore previous values on close. iOS Safari needs extra care (`position: fixed` with saved scroll position, or `overscroll-behavior: contain`). Count open modals so nested ones don't unlock early.

#### Model answer
"I'd first mention that in a real product I'd seriously consider the native `<dialog>` element with `showModal()`, because it gives focus containment, Escape handling, a backdrop and correct semantics for free. But I'll build a custom one to show the mechanics, and keep the API similar: `open`, `onClose`, `title`, `children`, and optional `initialFocusRef`.

The structure is a portal to `document.body`, containing a backdrop and a dialog element with `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at the title's id.

```tsx
const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input:not([disabled]),select,[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, initialFocusRef }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const mouseDownOnBackdrop = useRef(false);

  // Focus in on open, restore on close
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const target = initialFocusRef?.current
      ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      ?? dialogRef.current;
    target?.focus();
    return () => previouslyFocused?.focus?.();
  }, [open, initialFocusRef]);

  // Scroll lock + inert background
  useEffect(() => {
    if (!open) return;
    const root = document.getElementById('root');
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prev = { overflow: document.body.style.overflow, pr: document.body.style.paddingRight };
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbar + 'px';
    root?.setAttribute('inert', '');
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.paddingRight = prev.pr;
      root?.removeAttribute('inert');
    };
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab') return;
    const nodes = dialogRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes.length) { e.preventDefault(); return; }
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  if (!open) return null;
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => { mouseDownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (mouseDownOnBackdrop.current && e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}
        tabIndex={-1} className="modal" onKeyDown={onKeyDown}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
      </div>
    </div>,
    document.body,
  );
}
```

Walking through it: on open, I save the currently focused element, which is usually the button that opened the modal, and focus either the requested element or the first focusable one. The effect's cleanup restores focus, so keyboard and screen reader users land back where they were.

The `inert` attribute on the app root makes everything behind the modal unfocusable, unclickable and hidden from assistive technology, which is what `aria-modal` promises. The manual Tab trap handles wrapping. I query focusable elements on each Tab press rather than once, because the content can change, for example a form showing an error with a link in it.

For the backdrop, I record whether the mousedown started on the backdrop itself. Otherwise, a user selecting text in an input and releasing the mouse outside the dialog would close it and lose their work.

Scroll lock saves and restores the previous inline styles, and compensates for the scrollbar width so the page doesn't jump sideways."

#### Another worked example
**The native `<dialog>` version, for comparison:**
```tsx
function NativeModal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref} aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose(); }}   // Escape
      onClick={(e) => { if (e.target === ref.current) onClose(); }} // backdrop
    >
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
```
`showModal()` puts the dialog in the top layer (no z-index battles), makes the rest of the page inert, handles Escape, and returns focus to the previously focused element when closed. Style the backdrop with `dialog::backdrop`. You still need your own scroll lock. Clicks on the backdrop target the dialog element itself, which is why `e.target === ref.current` works, provided the dialog's content has an inner wrapper with padding.

#### A third worked example
**Nested modals and a modal stack.** A "Delete project?" confirmation opens from an "Edit project" modal. Problems: Escape closes both, the inner close unlocks scrolling while the outer is still open, and focus restores to the wrong place. Fixes:
- `e.stopPropagation()` on Escape in the topmost modal, or keep a module-level stack and only let the top one react.
- **Reference-count scroll lock**: increment on open, decrement on close, unlock only at zero.
- Each modal saves its own `previouslyFocused`, so closing the confirm returns focus to the Delete button inside the edit modal.
- Apply `inert` to the lower modal while the top one is open.

#### Step-by-step framework
1. **Clarify**: dismissible or not, initial focus, sizes, animations, nested support. Mention native `<dialog>`.
2. **Render the shell**: portal, backdrop, dialog with role, `aria-modal`, `aria-labelledby`.
3. **Focus in on open** and **restore on close**.
4. **Trap Tab** and make the background inert.
5. **Close on Escape** and on genuine backdrop clicks.
6. **Lock scroll** without layout shift; restore previous styles.
7. **Handle edge cases**: nested modals, no focusable children, content changes, unmount while open.
8. **Describe tests**: open with keyboard, Tab wraps, Escape closes, focus returns, background not reachable.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| A fixed `div` with a high z-index | Portal, `role="dialog"`, `aria-modal`, labelled title |
| Focus stays on the page behind | Focus moves in, is trapped, and returns to the trigger |
| Any click outside closes, even after text selection | Mousedown and click must both be on the backdrop |
| `overflow: hidden` that shifts the layout and never restores | Saves and restores styles, compensates for the scrollbar |
| Never mentions `<dialog>` | Knows native `<dialog>` and the trade-offs |

#### Useful phrases
- "Focus in, focus trapped, focus back: those are the three rules of a modal."
- "`aria-modal` is a promise; `inert` is how I keep it."
- "In production I'd start from native `<dialog>`; here I'll show the mechanics."
- "I only close on a backdrop click if the press started on the backdrop too."

#### Common pitfalls
- **Not restoring focus**, so keyboard users are dumped at the top of the page.
- Querying focusable elements **once on open** when content changes later.
- Forgetting elements with **`tabindex="0"`**, `contenteditable`, or `summary` in the focusable selector.
- **Scroll lock that doesn't restore** after unmount or route change.
- Rendering inside a parent with **`transform`** or `overflow: hidden`, which clips a fixed-position modal; use a portal.
- Using **`aria-hidden` on an ancestor of the modal**, which hides the modal itself from screen readers.

#### Follow-ups to expect (with sample answers)
- **"Why `aria-modal` and `inert` both?"** — "`aria-modal` tells assistive technology that content outside is unavailable, but support has varied. `inert` actually removes the background from focus, clicks and the accessibility tree, so the promise is enforced."
- **"How do you animate the close?"** — "Keep it mounted during the exit animation: track a `closing` state, run the CSS transition, then unmount on `transitionend`. Respect `prefers-reduced-motion`."
- **"How would you make this a confirm dialog that returns a promise?"** — "A `useConfirm` hook that renders a modal and returns a promise resolved by the OK or Cancel button, so you can write `if (await confirm('Delete?'))`."
- **"What should get initial focus in a destructive confirm?"** — "The safe option, usually Cancel, so a stray Enter doesn't delete anything. Use `role="alertdialog"` for these."
- **"How do you test it?"** — "RTL: open via a button, assert the dialog is labelled by role and name, `user.tab()` cycles inside, `user.keyboard('{Escape}')` closes it, and focus returns to the trigger with `toHaveFocus()`."

#### What senior interviewers look for
- **Complete focus lifecycle**, not just a trap.
- Thoughtful **edge cases**: text-selection drags, nested modals, iOS scroll, changing content.
- Awareness of **platform features** (`<dialog>`, `inert`, top layer) and when to prefer them.
- A clean, **reusable API**, and a testing plan.

#### Practise it
- Build it in 45 minutes, then use it with only a keyboard and with VoiceOver or NVDA.
- Add nested modal support with a stack and reference-counted scroll lock.
- Checklist: portal · role/aria-modal/labelledby · initial focus · trap · inert background · Escape · safe backdrop click · scroll lock without shift · focus restore · nested.

#### Variations you might be asked
- "Build a drawer (side sheet) component."
- "Build a confirmation dialog that returns a promise."
- "Build a popover that closes when you click outside."

## Build a virtualized list of 100,000 rows with real-time filter
- id: cec17566-43ed-4953-a8e3-bd2eff08caa2
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: hard
- levels:
- tags: component, performance, virtualization
- companies: Meta, Apple, Stripe

### Prompt
Build a list that displays 100,000 rows and lets the user filter them in real time as they type, without the page freezing. Implement the virtualization yourself (no `react-window` or similar library). This is a performance-focused problem.

### Answer
#### What the interviewer is really testing
- Understanding **why** 100,000 DOM nodes are slow (layout, style, memory, React reconciliation) and how **windowing** fixes it.
- The **maths of virtualization**: visible range from `scrollTop`, viewport height and row height, plus an overscan buffer.
- Keeping **typing responsive** while filtering a large array: `useDeferredValue` / `useTransition`, debouncing, precomputation, Web Workers.
- **Measuring** with the Performance panel and React Profiler, not guessing.
- Handling harder cases: **variable row heights**, keyboard access, scroll position when the filter changes.

#### Key points
- **Why it's slow:** rendering 100k rows means 100k+ DOM nodes. Style recalculation and layout touch all of them; memory grows; React has to create and reconcile 100k elements on every filter change. Typing feels frozen.
- **Windowing:** render only the rows in view (plus a few extra), inside a container whose inner height equals the full list height, so the scrollbar behaves normally.
  - `totalHeight = count * rowHeight`
  - `start = Math.floor(scrollTop / rowHeight) - overscan` (clamped to 0)
  - `end = Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan` (clamped to count)
  - Position visible rows with `transform: translateY(start * rowHeight)` on a wrapper, or absolute `top` per row.
- **Scroll handling:** read `scrollTop` in a scroll listener and store it in state; React batches updates. For extra smoothness, update via `requestAnimationFrame`. Use a `ResizeObserver` for the viewport height.
- **Filtering 100k items:**
  - A simple `includes` over 100k short strings takes a few milliseconds, fine; the expensive part was rendering, which virtualization removes.
  - Precompute a lowercase search key per item once (`useMemo`), not on every keystroke.
  - Keep the input responsive with **`useDeferredValue(query)`**: the input updates immediately, and the filtered list re-renders at lower priority.
  - For heavier matching (fuzzy search, millions of rows), move filtering to a **Web Worker**.
- **On filter change:** reset `scrollTop` to 0, otherwise you may be scrolled past the end of a shorter list.
- **Accessibility:** a scrollable region with a label; `role="list"`/`listitem` with `aria-setsize` and `aria-posinset` so screen readers know the true size; keyboard scrolling works natively if the container is focusable (`tabIndex={0}`).
- **Variable heights:** measure rows as they render (ResizeObserver), store heights, compute offsets with a prefix-sum array, and find the start index with binary search.

#### Model answer
"I'd start by explaining the problem: 100,000 rows means at least 100,000 DOM nodes, and every filter keystroke makes React rebuild and diff them, then the browser restyles and lays them out. Virtualization fixes this by only rendering the rows the user can actually see, maybe 30, while a tall inner spacer keeps the scrollbar accurate.

Assuming fixed row heights first, which I'd confirm, the maths is simple. The container is a fixed-height scrollable div. Inside it is a spacer with height `count * rowHeight`. On scroll, I compute the first visible index as `scrollTop / rowHeight`, the last as `(scrollTop + viewportHeight) / rowHeight`, add a few rows of overscan on each side so fast scrolling doesn't show blank gaps, and render just that slice, offset with a transform.

```tsx
function useElementHeight(ref: React.RefObject<HTMLElement>) {
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([entry]) => setH(entry.contentRect.height));
    ro.observe(ref.current!);
    return () => ro.disconnect();
  }, [ref]);
  return h;
}

function VirtualList<T>({ items, rowHeight, overscan = 5, renderRow, label }: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const viewport = useElementHeight(scrollRef);

  const total = items.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(items.length, Math.ceil((scrollTop + viewport) / rowHeight) + overscan);
  const visible = items.slice(start, end);

  return (
    <div
      ref={scrollRef} className="vlist" tabIndex={0} aria-label={label}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{ height: '100%', overflowY: 'auto', position: 'relative' }}
    >
      <div style={{ height: total, position: 'relative' }}>
        <ul role="list" style={{ transform: 'translateY(' + start * rowHeight + 'px)', margin: 0, padding: 0 }}>
          {visible.map((item, i) => (
            <li
              key={start + i} role="listitem" aria-setsize={items.length} aria-posinset={start + i + 1}
              style={{ height: rowHeight, listStyle: 'none' }}
            >
              {renderRow(item, start + i)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

For the filter, the bottleneck mostly disappears once rendering is virtualized, because filtering 100,000 strings with `includes` takes a few milliseconds. I still do two things. I precompute a lowercased search string for each row once, so each keystroke doesn't call `toLowerCase` 100,000 times. And I use `useDeferredValue` so typing is never blocked: the input re-renders immediately with the new text, while the filtered list renders at lower priority and can be interrupted if the user keeps typing.

```tsx
function FilterableList({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const indexed = useMemo(() => rows.map((r) => ({ r, key: (r.name + ' ' + r.email).toLowerCase() })), [rows]);
  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    return q ? indexed.filter((x) => x.key.includes(q)).map((x) => x.r) : rows;
  }, [deferred, indexed, rows]);
  const isStale = query !== deferred;

  return (
    <>
      <label>Filter <input value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <p aria-live="polite">{filtered.length.toLocaleString()} results</p>
      <div style={{ height: 600, opacity: isStale ? 0.6 : 1 }}>
        <VirtualList key={deferred} items={filtered} rowHeight={36} label="People" renderRow={(r) => <PersonRow person={r} />} />
      </div>
    </>
  );
}
```

Keying the list by the deferred query remounts it when the filter changes, which resets the scroll position to the top, so the user doesn't end up scrolled past the end of a shorter result list. Then I'd verify in the Performance panel: typing should stay under about 16 milliseconds per frame, and the DOM should contain only around 30 rows."

#### Another worked example
**Variable row heights.** Comments or messages have unpredictable heights. Approach:
- Start with an **estimated height** for unmeasured rows.
- Measure each rendered row with a `ResizeObserver` (or `getBoundingClientRect` after render) and store it in a `heights` array.
- Maintain **prefix sums** of offsets: `offset[i] = offset[i-1] + height[i-1]`.
- Find the start index by **binary search** over offsets for `scrollTop`; walk forward until offsets exceed `scrollTop + viewport`.
- When a row above the viewport changes height, adjust `scrollTop` by the difference so the content doesn't jump (scroll anchoring).

```ts
function findStart(offsets: number[], scrollTop: number) {
  let lo = 0, hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid] <= scrollTop) lo = mid; else hi = mid - 1;
  }
  return lo;
}
```
This is roughly what TanStack Virtual does internally, and mentioning that you'd use it in production is fine once you've shown you understand it.

#### A third worked example
**Moving the filter to a Web Worker for fuzzy search on 1 million rows.** When matching gets heavier (fuzzy scoring, multiple fields, sorting by score), it can take 100ms+ per keystroke, which `useDeferredValue` can't fix, because the work itself blocks the main thread.
```ts
// filter.worker.ts
let rows: { id: number; key: string }[] = [];
self.onmessage = (e) => {
  if (e.data.type === 'load') rows = e.data.rows;
  if (e.data.type === 'query') {
    const q = e.data.q.toLowerCase();
    const ids = rows.filter((r) => r.key.includes(q)).map((r) => r.id);
    self.postMessage({ seq: e.data.seq, ids }); // seq lets the UI ignore stale results
  }
};
```
Send the data once, then only the query; return ids (or an `Int32Array` transferred without copying) and look rows up on the main thread. Tag each request with a sequence number so late results for an old query are discarded.

#### Step-by-step framework
1. **Clarify**: fixed or variable heights, row content, filter fields, fuzzy or substring, data source.
2. **Explain the problem**: DOM size and reconciliation, with numbers.
3. **Build fixed-height windowing**: spacer, visible range, overscan, transform.
4. **Add the filter**: precomputed keys, `useMemo`, `useDeferredValue`.
5. **Handle scroll reset** and result counts.
6. **Add accessibility**: label, focusable container, `aria-setsize`/`aria-posinset`, live result count.
7. **Measure**: Performance panel and React Profiler; show DOM node count.
8. **Discuss extensions**: variable heights, Workers, sticky headers, infinite loading.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Renders all 100k and adds `React.memo` | Windowing: ~30 rows in the DOM |
| Debounce as the only fix | `useDeferredValue` plus precomputed keys; Worker for heavy matching |
| Blank gaps when scrolling fast | Overscan buffer |
| Ignores scroll position on filter | Resets scroll on filter change |
| Assumes it's fast | Measures with Performance panel and Profiler |
| Only fixed heights | Explains measured heights, prefix sums, binary search |

#### Useful phrases
- "The cost was never the filtering; it was rendering 100,000 rows."
- "Overscan trades a few extra rows for no blank flashes during fast scrolling."
- "`useDeferredValue` keeps the input urgent and the list non-urgent."
- "If the work itself is too slow, scheduling won't help; it needs to move off the main thread."

#### Common pitfalls
- Using **array index keys incorrectly** across filter changes, so row components keep stale state; key by item id if rows have state.
- **Reading layout in render** (`getBoundingClientRect` on every render), causing layout thrashing.
- Forgetting the **ResizeObserver**, so the visible range is wrong after the window resizes.
- Recomputing **`toLowerCase` for every row on every keystroke**.
- Breaking **Ctrl+F (find in page)**: virtualized rows that aren't rendered can't be found; mention this trade-off and the in-app filter as the replacement.
- Not testing **keyboard scrolling** (focusable container) and screen reader behaviour.

#### Follow-ups to expect (with sample answers)
- **"Why not just paginate?"** — "Pagination is often better UX for searchable data and much simpler. Virtualization fits when users need to scan or scroll continuously, like logs, chat history or spreadsheets. I'd ask what users actually do with the list."
- **"What about CSS `content-visibility: auto`?"** — "It lets the browser skip rendering off-screen elements, which helps layout and paint, but all 100k nodes still exist in the DOM and React still reconciles them. Good for long documents, not a replacement here."
- **"How do you handle sticky group headers?"** — "Flatten groups into one list of header and row items, render headers like rows, and draw the current group header separately at the top based on the start index."
- **"How do you make it work with infinite loading?"** — "Treat the count as the loaded count plus a placeholder row, and when the end index gets near the loaded count, fetch the next page."
- **"How would you test performance regressions?"** — "A Playwright test that types into the filter and measures long tasks or interaction latency, and a budget on DOM node count, run in CI."

#### What senior interviewers look for
- **First-principles understanding** of browser and React rendering costs.
- Correct **windowing maths** and edge cases written cleanly.
- Choosing the **right tool per bottleneck**: scheduling vs moving work off-thread.
- **Measurement** and a questioning attitude about the UX requirement itself.

#### Practise it
- Build fixed-height virtualization in 30 minutes, then extend it to variable heights.
- Profile the non-virtualized and virtualized versions and compare DOM node counts and typing latency.
- Checklist: spacer height · start/end with overscan · transform offset · ResizeObserver · precomputed keys · `useDeferredValue` · scroll reset · aria-setsize/posinset · measured.

#### Variations you might be asked
- "Build a virtualized grid (rows and columns), like a spreadsheet."
- "Build a chat window that loads older messages when scrolling up, without jumping."
- "The filter is slow even with virtualization. What do you look at?"

## Build a streaming chat UI (AI assistant)
- id: 569899ad-455e-4497-86e8-1b3d98c01d80
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: hard
- levels:
- tags: component, AI, streaming, SSE
- companies: Anthropic, OpenAI, Cohere

### Prompt
Build a chat interface for an AI assistant in React. The assistant's reply should stream in token by token from an API that returns server-sent events. Support sending messages, a stop button to cancel generation, auto-scrolling, errors with retry, and rendering Markdown in replies. This is a common frontend interview at AI companies.

### Answer
#### What the interviewer is really testing
- **Streaming mechanics**: reading a `fetch` response body as a stream, decoding bytes, and parsing SSE frames that can be split across chunks.
- **State design** for a conversation with an in-progress assistant message, and efficient updates while tokens arrive quickly.
- **Cancellation** with `AbortController`, and what happens to the partial message.
- **UX details** that matter in AI products: auto-scroll that respects the user scrolling up, input behaviour, loading and error states, accessibility of live content.
- **Safety**: rendering model output as Markdown without XSS.

#### Key points
- **Why `fetch`, not `EventSource`:** `EventSource` only supports GET and can't send a JSON body or custom auth headers. Chat APIs use POST, so you read the `fetch` response body with `response.body.getReader()` and parse SSE yourself (or use a small parser library).
- **SSE format:** events separated by a blank line (`\n\n`); lines like `event: delta` and `data: {"text":"Hel"}`. A network chunk can end mid-line or mid-event, so **buffer** and only process complete events. A final event (`[DONE]` or `event: message_stop`) marks the end.
- **Decoding:** `TextDecoder` with `{ stream: true }` so multi-byte characters (emoji, non-Latin scripts) split across chunks decode correctly.
- **State shape:**
  - `messages: { id, role: 'user' | 'assistant', content, status: 'streaming' | 'done' | 'error' | 'stopped' }[]`
  - Append the user message and an empty assistant message immediately (optimistic), then append deltas to the assistant message by id.
  - `isStreaming` derived from the last message's status.
- **Performance:** tokens can arrive 50+ times a second. React 18 batches updates, but re-parsing Markdown for a long message on every token is expensive. Options: accumulate deltas in a ref and flush to state once per animation frame; memoize finished messages so only the streaming one re-renders.
- **Cancellation:** a Stop button calls `controller.abort()`; keep the partial text and mark the message `stopped`. Also abort on unmount.
- **Auto-scroll:** stick to the bottom only if the user is already near the bottom; if they scroll up to read, don't yank them down. Show a "Jump to latest" button.
- **Input:** Enter sends, Shift+Enter adds a newline; disable sending while streaming (or turn the Send button into Stop); keep focus in the textarea; auto-grow the textarea.
- **Errors:** network drops mid-stream, 429 rate limits, 5xx. Mark the assistant message as error with a Retry button that resends the conversation up to that user message.
- **Markdown safely:** `react-markdown` without raw HTML (no `rehype-raw`), so model output can't inject scripts; links get `rel="noopener noreferrer"`; code blocks with syntax highlighting and a copy button. Handle incomplete Markdown mid-stream (an unclosed code fence).
- **Accessibility:** the message list as `role="log"` with polite announcements, but avoid announcing every token; announce when a reply finishes, or let the user opt in.

#### Model answer
"I'd clarify the API contract first: a POST to `/api/chat` with the message history, returning `text/event-stream` with `data:` lines containing JSON deltas and a final `[DONE]`. Then I'd split the work into a streaming function, a `useChat` hook that owns state, and the UI components.

The streaming function reads the body as a stream. The important detail is that network chunks don't line up with SSE events, so I keep a buffer, split on the blank line that ends an event, and keep the last incomplete piece for the next chunk. `TextDecoder` with `stream: true` handles multi-byte characters split across chunks.

```ts
export async function streamChat(
  messages: ChatMessage[], signal: AbortSignal, onDelta: (text: string) => void,
) {
  const res = await fetch('/api/chat', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) }),
  });
  if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? ''; // incomplete event stays in the buffer
    for (const evt of events) {
      const data = evt.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n');
      if (!data) continue;
      if (data === '[DONE]') return;
      onDelta(JSON.parse(data).text);
    }
  }
}
```

The hook adds the user message and an empty assistant message straight away, so the UI responds instantly, then appends deltas to that assistant message by id. Tokens can arrive very fast, so I collect them in a ref and flush to state once per animation frame, which caps re-renders at about 60 a second no matter how fast the server sends.

```ts
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const pending = useRef('');
  const frame = useRef(0);

  const flush = (id: string) => {
    frame.current = 0;
    const chunk = pending.current; pending.current = '';
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)));
  };
  const setStatus = (id: string, status: Status) =>
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));

  async function run(history: ChatMessage[]) {
    const assistant: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', status: 'streaming' };
    setMessages([...history, assistant]);
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    try {
      await streamChat(history, ctrl.signal, (text) => {
        pending.current += text;
        if (!frame.current) frame.current = requestAnimationFrame(() => flush(assistant.id));
      });
      cancelAnimationFrame(frame.current); flush(assistant.id);
      setStatus(assistant.id, 'done');
    } catch (e) {
      cancelAnimationFrame(frame.current); flush(assistant.id);
      setStatus(assistant.id, ctrl.signal.aborted ? 'stopped' : 'error');
    }
  }

  const send = (text: string) =>
    run([...messages.filter((m) => m.status !== 'error'),
      { id: crypto.randomUUID(), role: 'user', content: text, status: 'done' }]);
  const stop = () => controllerRef.current?.abort();
  const retry = () => run(messages.slice(0, -1)); // drop the failed assistant message
  useEffect(() => () => controllerRef.current?.abort(), []);

  const isStreaming = messages.at(-1)?.status === 'streaming';
  return { messages, send, stop, retry, isStreaming };
}
```

Stop aborts the fetch; the catch sees the signal was aborted, keeps whatever text arrived, and marks the message 'stopped' rather than 'error'. Retry resends the history without the failed reply.

In the UI, each message is a memoized component, so only the streaming one re-renders. Markdown goes through `react-markdown` without raw HTML enabled, because model output is untrusted: a prompt injection could make the model output a script tag. Auto-scroll only sticks to the bottom if the user was already near the bottom, so someone scrolling up to reread isn't dragged back down. The composer sends on Enter, adds a newline on Shift+Enter, and the Send button becomes a Stop button while streaming."

#### Another worked example
**Auto-scroll that respects the reader:**
```tsx
function MessageList({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const onScroll = () => {
    const el = ref.current!;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };
  useLayoutEffect(() => {
    if (atBottom) ref.current!.scrollTop = ref.current!.scrollHeight;
  }, [messages, atBottom]);

  return (
    <div ref={ref} onScroll={onScroll} role="log" aria-label="Conversation" className="messages">
      {messages.map((m) => <Message key={m.id} message={m} />)}
      {!atBottom && (
        <button className="jump" onClick={() => setAtBottom(true)}>Jump to latest ↓</button>
      )}
    </div>
  );
}
const Message = memo(function Message({ message }: { message: ChatMessage }) {
  return (
    <article className={'msg ' + message.role} aria-busy={message.status === 'streaming'}>
      <ReactMarkdown components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}>
        {message.content}
      </ReactMarkdown>
      {message.status === 'stopped' && <p className="note">Stopped</p>}
    </article>
  );
});
```
A 40px threshold avoids fighting the user over a few pixels. CSS `overflow-anchor` can also help keep position stable as content grows.

#### A third worked example
**The composer with keyboard behaviour and IME support:**
```tsx
function Composer({ onSend, onStop, isStreaming }: ComposerProps) {
  const [text, setText] = useState('');
  function submit() {
    const t = text.trim();
    if (!t || isStreaming) return;
    onSend(t); setText('');
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="composer">
      <label htmlFor="prompt" className="visually-hidden">Message</label>
      <textarea
        id="prompt" value={text} rows={1}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
        }}
      />
      {isStreaming
        ? <button type="button" onClick={onStop}>Stop</button>
        : <button type="submit" disabled={!text.trim()}>Send</button>}
    </form>
  );
}
```
`isComposing` matters for Japanese, Chinese and Korean input: Enter confirms the IME candidate and must not send the message. Many chat UIs get this wrong.

#### Step-by-step framework
1. **Clarify the API**: request shape, SSE event format, end marker, error format, auth.
2. **Write the stream reader**: `getReader`, `TextDecoder` with `stream: true`, buffered SSE parsing.
3. **Design state**: messages with ids and statuses; optimistic user and assistant messages.
4. **Wire the hook**: send, stop (abort), retry, abort on unmount, batched token flushing.
5. **Build the UI**: memoized messages, Markdown without raw HTML, composer with Enter/Shift+Enter and IME handling.
6. **Add auto-scroll** that respects the user, plus "Jump to latest".
7. **Handle errors and edge cases**: HTTP errors, mid-stream drops, rate limits, empty input, double submits.
8. **Discuss production concerns**: persistence, regenerating replies, tool-use or citations, tests with a mocked stream.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Uses `EventSource` with a POST body (impossible) | `fetch` plus a stream reader and buffered SSE parsing |
| Splits each chunk on newlines and assumes complete events | Buffers partial events across chunks; `TextDecoder` with `stream: true` |
| `setState` per token, re-rendering every message | Batched flushes per frame; memoized finished messages |
| No stop button, or Stop discards the text | Abort keeps partial text, marked as stopped |
| Always scrolls to bottom | Sticks only when the user is near the bottom |
| Renders model HTML directly | Markdown without raw HTML; safe links |

#### Useful phrases
- "Network chunks don't respect event boundaries, so I buffer until I see a blank line."
- "Model output is untrusted input; I render Markdown, never raw HTML."
- "I flush tokens once per animation frame, so render cost doesn't scale with the token rate."
- "Stopping keeps what we have; it's a user choice, not an error."

#### Common pitfalls
- Parsing SSE **per chunk** without a buffer, causing intermittent `JSON.parse` errors.
- Using **`TextDecoder` without `stream: true`**, garbling emoji and non-Latin text at chunk boundaries.
- Updating state with **a stale `messages` closure** inside the stream callback instead of a functional update.
- Sending on **Enter during IME composition**.
- **Announcing every token** to screen readers, which makes the page unusable with assistive technology.
- Forgetting to **abort on unmount** or route change, so streams keep running and set state on an unmounted component.

#### Follow-ups to expect (with sample answers)
- **"How would you handle incomplete Markdown while streaming?"** — "An unclosed code fence makes the rest of the message render as code until the closing fence arrives. You can temporarily close open fences before rendering, or render the streaming message as plain text and switch to Markdown on completion; the first gives the better experience."
- **"How would you test this?"** — "Unit-test the SSE parser with chunks split at awkward points, including mid-JSON and mid-emoji. For the UI, MSW can return a `ReadableStream` that enqueues events with delays, then RTL asserts the text grows, Stop keeps partial text, and an error shows Retry."
- **"How would you support regenerating a reply or editing an earlier message?"** — "Treat the conversation as a tree: editing creates a new branch from that message. Store parent ids and the selected branch per node, and let users switch between versions."
- **"What if the connection drops mid-reply?"** — "Show the partial reply with an error and Retry. With server support, resume from the last event id, which SSE supports via `Last-Event-ID`, or store the generation server-side so the client can reconnect to it."
- **"How would you render tool calls or citations?"** — "Use typed events (`event: tool_use`, `event: citation`) and store message content as an array of typed parts, text, tool call, tool result, rendered by part type, instead of a single string."

#### What senior interviewers look for
- **Correct low-level streaming** code, including the edge cases most candidates miss.
- **Product sense** for AI UX: stop, retry, scroll behaviour, IME, partial results.
- **Security awareness** about model output.
- A design that **extends** to tool use, branching and persistence.

#### Practise it
- Build a tiny Node server that streams fake tokens as SSE with random chunk boundaries, then build the UI against it in 60 minutes.
- Write tests for the parser with events split mid-line and mid-emoji.
- Checklist: fetch stream reader · buffered SSE parsing · `TextDecoder` stream mode · optimistic messages · rAF batching · abort keeps partial text · retry · smart auto-scroll · safe Markdown · IME-aware Enter · abort on unmount.

#### Variations you might be asked
- "Build a live log viewer that streams lines from a server."
- "Add support for attaching images to messages."
- "How would you show the assistant 'thinking' and calling tools in the UI?"

## Build a Kanban board with drag-and-drop, no external libraries
- id: f6cc9e39-4720-46c3-80e9-dd0b441b292d
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: hard
- levels:
- tags: component, drag-drop, a11y
- companies: Meta, Stripe

### Prompt
Build a Kanban board in React with columns (To do, In progress, Done) and cards that can be dragged between columns and reordered within a column. Don't use a drag-and-drop library. Cards can be added, and the board should be usable with a keyboard.

### Answer
#### What the interviewer is really testing
- **State modelling** that makes moves cheap and correct: normalised cards plus ordered ids per column.
- Knowledge of **drag-and-drop mechanics**: the HTML5 Drag and Drop API (`draggable`, `dragstart`, `dragover`, `drop`) or Pointer Events, and their trade-offs.
- Calculating the **drop position** within a column from the pointer position.
- **Accessibility**: a keyboard alternative and screen reader announcements, because drag-and-drop alone excludes many users.
- Thinking about **persistence and optimistic updates** if there's a backend.

#### Key points
- **Clarify:** fixed columns or user-defined? Reorder within columns? Persist to localStorage or an API? Mobile/touch support needed? (HTML5 DnD doesn't work on most touch devices, which pushes you to Pointer Events.)
- **State shape:**
  ```
  cards:   { [id]: { id, title } }
  columns: [{ id: 'todo', title: 'To do', cardIds: ['c1', 'c3'] }, ...]
  ```
  A move is: remove the id from the source column's array, insert it into the target array at an index. One pure function, `moveCard(state, cardId, toColumnId, toIndex)`, used by mouse, keyboard and tests.
- **HTML5 DnD API:**
  - `draggable` on cards; `onDragStart` stores the card id (`e.dataTransfer.setData('text/plain', id)`) and in state for styling.
  - Columns handle `onDragOver` with **`e.preventDefault()`** (otherwise dropping isn't allowed) and compute the insertion index.
  - `onDrop` reads the id and calls `moveCard`; `onDragEnd` clears drag state (fires even if the drop was cancelled).
  - Pros: native, little code, works across windows. Cons: no touch support on most mobile browsers, limited styling of the drag image, quirky events (`dragleave` fires on children).
- **Pointer Events alternative:** `pointerdown` captures the card (`setPointerCapture`), `pointermove` moves a floating clone with `transform`, `elementFromPoint` finds the column under the pointer, `pointerup` drops. Works for mouse, touch and pen; more code.
- **Drop index:** for each card in the target column, compare the pointer's `clientY` with the card's vertical midpoint (`rect.top + rect.height / 2`); the first card whose midpoint is below the pointer is the insertion index. Show a placeholder line there.
- **Keyboard:** focusable cards; Space or Enter to "pick up", arrow keys to move (up/down within a column, left/right between columns), Space/Enter to drop, Escape to cancel. Announce each step in an `aria-live` region ("Picked up 'Fix login'. Column In progress, position 2 of 4.").
- **Persistence:** save to localStorage, or call the API optimistically and roll back on failure. For server ordering, use fractional or lexicographic ranks (LexoRank) so a move updates only one row.

#### Model answer
"I'd confirm scope first: three fixed columns, reorder within and across columns, add cards, persist to localStorage, and desktop first with keyboard support. I'll mention that touch support would push me from the HTML5 Drag and Drop API to Pointer Events.

The most important decision is the state shape. Cards are stored by id, and each column has an ordered array of card ids. That makes every move the same operation: remove the id from one array and insert it into another at an index. I write that as a pure function first, because mouse dragging, keyboard moves and tests all use it.

```ts
type Board = { cards: Record<string, Card>; columns: Column[] };

export function moveCard(board: Board, cardId: string, toCol: string, toIndex: number): Board {
  const columns = board.columns.map((c) => ({ ...c, cardIds: c.cardIds.filter((id) => id !== cardId) }));
  const from = board.columns.find((c) => c.cardIds.includes(cardId))!;
  const target = columns.find((c) => c.id === toCol)!;
  // If moving down within the same column, removing the card shifted later indexes by one
  const fromIndex = from.cardIds.indexOf(cardId);
  const index = from.id === toCol && fromIndex < toIndex ? toIndex - 1 : toIndex;
  target.cardIds.splice(Math.min(index, target.cardIds.length), 0, cardId);
  return { ...board, columns };
}
```

The off-by-one adjustment is the classic bug: when you move a card down within the same column, removing it first shifts every later index up by one.

For dragging I'd use the native API. Cards are `draggable`. On drag start I store the card id in `dataTransfer` and in state, so I can style the dragged card. Each column handles drag over: it must call `preventDefault` to allow dropping, and it calculates where the card would land by comparing the pointer's Y position with the midpoint of each card.

```tsx
function getDropIndex(listEl: HTMLElement, clientY: number) {
  const cards = [...listEl.querySelectorAll<HTMLElement>('[data-card]:not([data-dragging])')];
  const i = cards.findIndex((el) => {
    const r = el.getBoundingClientRect();
    return clientY < r.top + r.height / 2;
  });
  return i === -1 ? cards.length : i;
}

function ColumnView({ column, board, dispatch, drag, setDrag }: ColumnProps) {
  const listRef = useRef<HTMLUListElement>(null);
  return (
    <section className="column" aria-labelledby={column.id + '-title'}>
      <h2 id={column.id + '-title'}>{column.title} ({column.cardIds.length})</h2>
      <ul
        ref={listRef}
        onDragOver={(e) => {
          e.preventDefault();
          const index = getDropIndex(listRef.current!, e.clientY);
          if (drag && (drag.overCol !== column.id || drag.overIndex !== index))
            setDrag({ ...drag, overCol: column.id, overIndex: index });
        }}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData('text/plain');
          dispatch({ type: 'move', cardId: id, toCol: column.id, toIndex: drag?.overIndex ?? column.cardIds.length });
          setDrag(null);
        }}
      >
        {column.cardIds.map((id, i) => (
          <Fragment key={id}>
            {drag?.overCol === column.id && drag.overIndex === i && <li className="drop-line" aria-hidden />}
            <li
              data-card draggable tabIndex={0} className="card"
              data-dragging={drag?.cardId === id ? '' : undefined}
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; setDrag({ cardId: id, overCol: column.id, overIndex: i }); }}
              onDragEnd={() => setDrag(null)}
            >
              {board.cards[id].title}
            </li>
          </Fragment>
        ))}
        {drag?.overCol === column.id && drag.overIndex === column.cardIds.length && <li className="drop-line" aria-hidden />}
      </ul>
    </section>
  );
}
```

I only update drag state when the target index actually changes, because `dragover` fires every few milliseconds. `onDragEnd` always clears it, even if the user drops outside the board or presses Escape.

Drag-and-drop on its own excludes keyboard and many assistive technology users, so I add a keyboard mode: focus a card, press Space to pick it up, use arrows to move it, Space to drop, Escape to cancel, with each step announced in a live region. Both paths call the same `moveCard`. The board state lives in a reducer and is saved to localStorage on change."

#### Another worked example
**Keyboard moves with announcements:**
```tsx
function onCardKeyDown(e: React.KeyboardEvent, cardId: string) {
  const colIndex = board.columns.findIndex((c) => c.cardIds.includes(cardId));
  const col = board.columns[colIndex];
  const index = col.cardIds.indexOf(cardId);
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (!lifted) { setLifted({ cardId, origin: { col: col.id, index } }); announce('Picked up ' + title(cardId) + '. Use arrow keys to move, Space to drop, Escape to cancel.'); }
    else { setLifted(null); announce('Dropped in ' + col.title + ', position ' + (index + 1) + ' of ' + col.cardIds.length + '.'); }
    return;
  }
  if (!lifted) return;
  const moves: Record<string, [number, number]> = {
    ArrowUp: [colIndex, Math.max(0, index - 1)],
    ArrowDown: [colIndex, index + 2],   // +2 because moveCard adjusts same-column downward moves
    ArrowLeft: [Math.max(0, colIndex - 1), 0],
    ArrowRight: [Math.min(board.columns.length - 1, colIndex + 1), 0],
  };
  if (e.key in moves) {
    e.preventDefault();
    const [ci, ti] = moves[e.key];
    dispatch({ type: 'move', cardId, toCol: board.columns[ci].id, toIndex: ti });
    announce('Moved to ' + board.columns[ci].title + '.');
  } else if (e.key === 'Escape') {
    dispatch({ type: 'move', cardId, toCol: lifted.origin.col, toIndex: lifted.origin.index });
    setLifted(null); announce('Move cancelled.');
  }
}
```
After a move, React re-renders the card in its new place; keep focus on it (refs by card id, focusing in an effect) so the user can keep moving it. A simpler fallback many products use: a "Move to…" menu on each card.

#### A third worked example
**Persisting order to a server with fractional ranks.** Storing an integer `position` means a move to the top of a 500-card column updates 500 rows. Instead, give each card a rank between its neighbours: moving a card between ranks 1.0 and 2.0 gives it 1.5, so only one row changes. Use string-based ranks (LexoRank or fractional indexing libraries) to avoid floating-point precision limits, and rebalance occasionally. On the client, apply the move optimistically, send `PATCH /cards/:id { columnId, rank }`, and if it fails, restore the previous board and show a toast. For multi-user boards, receive others' moves over WebSockets and apply them with the same reducer.

#### Step-by-step framework
1. **Clarify** columns, reorder rules, persistence, touch support.
2. **Model state**: normalised cards, ordered ids per column, a pure `moveCard`.
3. **Render** columns and cards; add-card form.
4. **Implement dragging** with HTML5 DnD (or Pointer Events for touch).
5. **Compute the drop index** from midpoints; show a placeholder.
6. **Add keyboard moves** and live announcements, sharing `moveCard`.
7. **Persist** to localStorage or an API with optimistic updates and rollback.
8. **Polish and test**: reducer unit tests, drag styling, empty-column drop zones, focus management.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Cards nested inside column objects, copied around | Normalised cards, ordered id arrays, one pure move function |
| Forgets `preventDefault` in `dragover` | Knows dropping requires it |
| Drop always appends to the end | Midpoint-based insertion index with a placeholder |
| Mouse only | Keyboard pick-up/move/drop with announcements |
| Integer positions rewritten on every move | Fractional ranks, optimistic update with rollback |

#### Useful phrases
- "Every move is remove-then-insert, so I write that once as a pure function."
- "Native drag-and-drop doesn't work on most touch devices; if mobile matters, I'd use Pointer Events."
- "Drag-and-drop needs a keyboard equivalent, or it's inaccessible."
- "Fractional ranks mean a move touches one row, not the whole column."

#### Common pitfalls
- The **same-column off-by-one** when moving a card down.
- **Setting state on every `dragover` event** even when nothing changed, causing janky re-renders.
- `dragleave` flickering because it fires when moving over **child elements**.
- **Empty columns** with no height, so there's nowhere to drop.
- Losing **keyboard focus** after a move re-renders the card elsewhere.
- Mutating state arrays in place, so React doesn't re-render.

#### Follow-ups to expect (with sample answers)
- **"How would you support touch?"** — "Switch to Pointer Events: on `pointerdown` start a drag after a small movement threshold (so taps and scrolling still work), move a floating copy with `transform`, find the column under the pointer with `document.elementFromPoint`, and drop on `pointerup`. Auto-scroll the column when near its edges."
- **"How would you make it fast with 1,000 cards?"** — "Memoize card components so only affected ones re-render, avoid measuring every card on every `dragover` (cache rects at drag start), and virtualize long columns."
- **"How do you test it?"** — "Unit-test `moveCard` thoroughly, including the same-column cases. Test keyboard moves with RTL. For real drag-and-drop, Playwright's `dragTo` in an E2E test."
- **"How would real-time collaboration work?"** — "Broadcast moves as events, apply remote moves through the same reducer, and use server ranks as the source of truth. If two people move the same card, last write wins, and the UI reconciles."
- **"What does a library like dnd-kit add?"** — "Sensors for pointer, touch and keyboard, collision detection, auto-scrolling, accessible announcements and animations. In production I'd likely use it; here I'm showing the mechanics."

#### What senior interviewers look for
- A **clean data model** and pure core logic, separated from the DOM.
- **Correct DnD details**: preventDefault, drop index, cleanup on drag end.
- **Accessibility as a requirement**, not an extra.
- Awareness of **persistence, ordering and collaboration** at scale.

#### Practise it
- Build it in 60 minutes with HTML5 DnD, then add keyboard moves.
- Rewrite the dragging with Pointer Events and test it on a phone.
- Checklist: normalised state · pure `moveCard` with off-by-one fix · preventDefault in dragover · midpoint drop index · placeholder · drag end cleanup · keyboard mode · announcements · persistence.

#### Variations you might be asked
- "Build a sortable list (reorder items by dragging)."
- "Build a file-tree where items can be dragged into folders."
- "Build a Trello-style board where columns can also be reordered."

## Build an infinite-scroll feed
- id: e45c52f6-fe5a-4d33-ac55-a963466c8073
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, pagination, IntersectionObserver
- companies: Meta, Apple

### Prompt
Build an infinite-scroll feed in React that loads more posts as the user scrolls near the bottom. Handle loading, errors with retry, the end of the list, and duplicate requests. Explain how you'd keep it performant as the feed grows to thousands of items.

### Answer
#### What the interviewer is really testing
- Using **`IntersectionObserver`** on a sentinel element instead of scroll-event maths.
- **Pagination design**: cursor-based vs offset-based, and why cursors suit feeds.
- **Guarding against duplicate and out-of-order requests**, and de-duplicating items.
- Complete **state handling**: initial load, loading more, error with retry, end of feed, empty feed.
- **Performance and UX at scale**: virtualization, preserving scroll position on back navigation, accessibility of endless content.

#### Key points
- **Clarify:** page size, API shape (cursor or page number), whether new posts can arrive at the top, whether users navigate away and come back (scroll restoration), and mobile.
- **Detecting "near the bottom":**
  - **IntersectionObserver** watching a sentinel `div` after the last item, with `rootMargin: '600px'` so loading starts before the user reaches the end. Runs off the main thread's scroll path; no throttling needed.
  - Scroll listeners with `scrollTop + clientHeight >= scrollHeight - threshold` work but need throttling and cause more work per frame.
- **Pagination:**
  - **Offset** (`?page=3`): simple, but if new posts are added at the top while you scroll, items shift and you see duplicates or miss items.
  - **Cursor** (`?after=post_123`): the server returns `nextCursor`; stable under inserts; standard for feeds.
- **State:** `items`, `nextCursor`, `status: 'idle' | 'loading' | 'error'`, `hasMore`. Initial loading and "loading more" render differently (skeletons vs a footer spinner).
- **Duplicate request guard:** don't fetch if `status === 'loading'` or `!hasMore`. Use a ref for the in-flight flag, since the observer callback can fire again before state updates. Abort on unmount.
- **De-duplicate items by id** when appending, in case pages overlap.
- **Errors:** keep the loaded items, show an inline "Couldn't load more. Retry" footer. Stop auto-loading until the user retries, or the observer will hammer a failing API.
- **End of feed:** stop observing; show "You're all caught up".
- **At scale:** thousands of complex posts make the DOM heavy; virtualize (variable heights), lazy-load images with fixed aspect ratios to avoid layout shift, and keep the cache so navigating back restores position.
- **Accessibility:** infinite scroll can trap keyboard users (the footer is never reachable). Offer a "Load more" button as a fallback, announce new content politely, use `role="feed"` with `aria-busy` while loading, and `article` elements with `aria-setsize` (-1 if unknown) and `aria-posinset`.

#### Model answer
"I'd check the API first. I'd want cursor-based pagination, where each response returns the posts plus a `nextCursor`, because in a feed new posts arrive at the top all the time, and offset pagination would then repeat or skip items as the offsets shift.

For detecting when to load, I'd use an IntersectionObserver on an empty sentinel element after the last post, with a root margin of a few hundred pixels so the next page starts loading before the user hits the bottom. That's simpler and cheaper than scroll listeners: the browser tells us when the sentinel comes near the viewport, with no maths and no throttling.

I'll put the logic in a hook:

```tsx
function useInfiniteFeed(fetchPage: (cursor: string | null, signal: AbortSignal) => Promise<Page>) {
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const inFlight = useRef(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore) return;
    inFlight.current = true;
    setStatus('loading');
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    try {
      const page = await fetchPage(cursor, ctrl.signal);
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
      });
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
      setStatus('idle');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, [cursor, hasMore, fetchPage]);

  useEffect(() => () => ctrlRef.current?.abort(), []);
  return { items, hasMore, status, loadMore };
}
```

The in-flight ref is the duplicate-request guard. The observer can fire several times in quick succession, before React has re-rendered with the loading status, so checking state alone isn't enough. I also de-duplicate by id when appending, in case the server returns an overlapping item.

The component wires the observer to the sentinel:

```tsx
function Feed() {
  const { items, hasMore, status, loadMore } = useInfiniteFeed(fetchPosts);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || status === 'error') return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, hasMore, status]);

  if (status === 'loading' && items.length === 0) return <FeedSkeleton />;
  if (status === 'idle' && !hasMore && items.length === 0) return <EmptyState />;

  return (
    <div role="feed" aria-busy={status === 'loading'} aria-label="Posts">
      {items.map((post, i) => (
        <article key={post.id} aria-posinset={i + 1} aria-setsize={hasMore ? -1 : items.length}>
          <PostCard post={post} />
        </article>
      ))}
      <div ref={sentinelRef} />
      {status === 'loading' && <p className="feed-footer">Loading more…</p>}
      {status === 'error' && (
        <p className="feed-footer" role="alert">
          Couldn't load more posts. <button onClick={loadMore}>Retry</button>
        </p>
      )}
      {!hasMore && <p className="feed-footer">You're all caught up.</p>}
      {hasMore && status === 'idle' && <button className="visually-hidden-focusable" onClick={loadMore}>Load more posts</button>}
    </div>
  );
}
```

The observer effect re-subscribes when `loadMore` changes, which is when the cursor changes. A useful side effect: if the first page doesn't fill the screen, the re-created observer immediately reports the sentinel as intersecting and loads the next page, so we keep loading until the screen is full. On error I stop observing entirely, so we don't hammer a failing API, and the user retries explicitly.

For scale, once the feed reaches hundreds of rich posts, I'd virtualize with variable heights, and lazy-load images with reserved aspect ratios to prevent layout shift. In production I'd usually use TanStack Query's `useInfiniteQuery`, which handles caching, deduplication and keeping pages when the user navigates back."

#### Another worked example
**Restoring scroll position when the user returns from a post.** The user scrolls 200 posts deep, opens one, and presses Back. If the feed refetches from scratch, they lose their place, which is one of the most common complaints about infinite scroll.
- Keep the loaded pages in a cache that outlives the component (TanStack Query, or a module-level store).
- Save `window.scrollY` (or the first visible post id) in `sessionStorage` or `history.state` before navigating.
- On return, render the cached pages, then restore the scroll position in a layout effect, or scroll the saved post into view.
- With virtualization, restore by index (`scrollToIndex`), because the scroll offset depends on measured heights.
- Next.js and React Router have scroll restoration helpers, but they only work if the content is already there when they run, which is why the cache matters.

#### A third worked example
**New posts arriving at the top.** For a live feed, don't insert new posts above the user's current position; that pushes content down while they're reading. Instead, poll or subscribe for new posts, keep them in a separate `incoming` list, and show a "5 new posts" pill. Clicking it prepends them and scrolls to the top. If you must prepend while the user is mid-feed, preserve their position by measuring the scroll height before and after and adjusting `scrollTop` by the difference (CSS `overflow-anchor` does this automatically in most browsers, except Safari).

#### Step-by-step framework
1. **Clarify** API (cursor), page size, live updates, back navigation, mobile.
2. **Write the data hook**: items, cursor, hasMore, status, loadMore with an in-flight guard and de-duplication.
3. **Add the sentinel** with IntersectionObserver and a generous `rootMargin`.
4. **Render all states**: initial skeleton, empty, loading more, error with retry, end of feed.
5. **Add accessibility**: `role="feed"`, `aria-busy`, a Load more fallback, reachable footer.
6. **Handle scale**: virtualization, image lazy loading with reserved space.
7. **Preserve position** on back navigation with a cache and scroll restoration.
8. **Discuss testing**: mock IntersectionObserver in jsdom, MSW pages, an E2E scroll test.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Scroll listener with unthrottled maths | IntersectionObserver sentinel with `rootMargin` |
| Page numbers in a live feed | Cursor pagination, stable under inserts |
| Multiple parallel requests for the same page | In-flight ref guard and id de-duplication |
| Error loops retrying forever | Stops observing; explicit Retry |
| Loses position on Back | Cached pages and scroll restoration |
| Keyboard users can never reach the footer | Load more button fallback, `role="feed"` |

#### Useful phrases
- "Let the browser tell me when the sentinel is close, instead of doing scroll maths."
- "Cursors don't shift when new posts arrive; offsets do."
- "State updates are async, so the in-flight guard lives in a ref."
- "Infinite scroll needs an escape hatch for keyboard users."

#### Common pitfalls
- **No in-flight guard**, so fast scrolling triggers the same page several times.
- **Retrying automatically on error** in a tight loop.
- Forgetting the case where the **first page doesn't fill the viewport**.
- Using **array index as key**, causing wrong recycling when items are de-duplicated or prepended.
- **Images without dimensions**, so content jumps as they load and the sentinel position moves.
- Not **disconnecting the observer** on unmount.

#### Follow-ups to expect (with sample answers)
- **"How do you test IntersectionObserver code?"** — "jsdom doesn't implement it, so I mock it: a fake class that stores the callback, and a helper that triggers it with `isIntersecting: true`. For real behaviour, a Playwright test that scrolls and waits for more posts."
- **"Infinite scroll or pagination?"** — "Infinite scroll suits browsing, like social feeds. Pagination suits finding things, like search results or admin tables, because users can bookmark a page and reach the footer. Some products use a 'Load more' button as a middle ground."
- **"How would you do this with TanStack Query?"** — "`useInfiniteQuery` with `getNextPageParam: (last) => last.nextCursor`, then call `fetchNextPage` when the sentinel intersects, guarded by `hasNextPage && !isFetchingNextPage`. It caches pages and restores them on return."
- **"What happens to memory after 5,000 posts?"** — "Virtualize so only visible posts are in the DOM, and consider dropping far-away pages from memory and refetching them if the user scrolls back."
- **"How do you avoid layout shift?"** — "Reserve space for images with width and height or `aspect-ratio`, use skeletons with the same dimensions as posts, and never insert content above the viewport without anchoring."

#### What senior interviewers look for
- **Robust async logic**: guards, de-duplication, cancellation, error behaviour.
- **API awareness**: cursor pagination and why.
- **UX depth**: scroll restoration, new-post pills, layout stability.
- **Accessibility** of endless content, which many candidates ignore.

#### Practise it
- Build the feed against a mock API with random latency and a 10% error rate.
- Add scroll restoration when navigating to a post detail and back.
- Checklist: sentinel + rootMargin · cursor · in-flight ref · de-dupe by id · all states · stop on error · role="feed" · Load more fallback · virtualization plan · scroll restoration.

#### Variations you might be asked
- "Build a chat history that loads older messages when scrolling up."
- "Build an image gallery with infinite scroll and lazy loading."
- "How would you build a 'Load more' button version, and when is it better?"

## Build a notification toast system
- id: c10262a3-1ac6-4612-a531-9d939cbd6a0c
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, a11y, global-state

### Prompt
Build a toast notification system for a React app. Any component (or non-React code, like an API client) should be able to show a toast with `toast.success('Saved')`. Toasts stack, auto-dismiss after a timeout, can be dismissed manually, pause on hover, and must be accessible.

### Answer
#### What the interviewer is really testing
- **API design** for a cross-cutting concern: a simple imperative call usable from anywhere, including outside React.
- **Global state** choices: Context with a provider, or an external store with `useSyncExternalStore`.
- **Timer management**: auto-dismiss, pause and resume on hover and focus, cleanup.
- **Accessibility**: live regions with the right politeness, not stealing focus, enough time to read, reachable actions.
- Rendering details: **portal**, stacking, enter and exit animations, limits on visible toasts.

#### Key points
- **Clarify:** types (success, error, info, warning, loading), position, max visible, durations, actions (Undo), promise toasts ("Saving…" then "Saved"), whether errors should persist.
- **API:**
  ```
  toast('Message') / toast.success / toast.error / toast.dismiss(id) / toast.promise(p, { loading, success, error })
  ```
  Returns an id so callers can update or dismiss.
- **Architecture options:**
  1. **Context + provider:** `useToast()` returns `show`. Simple, but only usable inside React components, and the provider re-renders consumers when the list changes unless you split state and actions.
  2. **External store (module-level) + `useSyncExternalStore`:** a tiny pub/sub store holds the toast list; `toast()` is a plain function callable from anywhere (API interceptors, Redux middleware); a `<Toaster />` component subscribes and renders. This is how react-hot-toast and Sonner work.
- **Timers:** each toast has a duration. Pausing requires tracking the **remaining time**: on pause, clear the timeout and store `remaining = remaining - (now - startedAt)`; on resume, start a new timeout with the remaining time. Pause on `mouseenter` and `focusin` of the toaster region, and when the page is hidden (`visibilitychange`).
- **Accessibility:**
  - A container that's **always in the DOM** with `role="region"` and an `aria-label`, and inside it live regions: `role="status"` (polite) for most toasts, `role="alert"` (assertive) for errors.
  - Live regions must exist before content is inserted, otherwise screen readers may not announce.
  - **Don't move focus** to toasts; provide a keyboard shortcut (e.g. F8) to jump to the region if toasts have actions.
  - WCAG 2.2.1 (timing adjustable): give enough time (scale duration with text length, around 5 seconds minimum), pause on hover/focus, and don't auto-dismiss toasts containing actions or critical errors.
  - Close button with `aria-label="Dismiss notification"`.
- **Rendering:** portal to `document.body`, fixed position, newest on top or bottom consistently, max 3 to 5 visible with the rest queued, exit animation before removal, `prefers-reduced-motion` respected.

#### Model answer
"The main design decision is how components and non-component code trigger toasts. I want `toast.success('Saved')` to work from anywhere, including an API client's error interceptor, so instead of Context I'd use a small external store with a subscribe function, and a `<Toaster />` component that reads it with `useSyncExternalStore`. It's also what libraries like Sonner do.

```ts
// toast-store.ts
type ToastType = 'success' | 'error' | 'info' | 'loading';
export type Toast = { id: string; type: ToastType; message: string; duration: number; action?: { label: string; onClick: () => void } };

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const store = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  getSnapshot: () => toasts,
};

function add(type: ToastType, message: string, opts: Partial<Toast> = {}) {
  const id = opts.id ?? crypto.randomUUID();
  const duration = opts.duration ?? (type === 'error' || opts.action ? Infinity : Math.max(4000, message.length * 60));
  const next: Toast = { id, type, message, duration, action: opts.action };
  toasts = toasts.some((t) => t.id === id) ? toasts.map((t) => (t.id === id ? next : t)) : [...toasts, next];
  emit();
  return id;
}
export function dismiss(id: string) { toasts = toasts.filter((t) => t.id !== id); emit(); }

export const toast = Object.assign((m: string, o?: Partial<Toast>) => add('info', m, o), {
  success: (m: string, o?: Partial<Toast>) => add('success', m, o),
  error: (m: string, o?: Partial<Toast>) => add('error', m, o),
  dismiss,
  promise<T>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) {
    const id = add('loading', msgs.loading, { duration: Infinity });
    p.then(() => add('success', msgs.success, { id }), () => add('error', msgs.error, { id }));
    return p;
  },
});
```

Each update replaces the array instead of mutating it, which `useSyncExternalStore` needs to detect changes. Duration scales with message length, and errors or toasts with actions don't auto-dismiss, because WCAG asks that users get enough time, and you can't click Undo on a toast that vanished.

The `Toaster` renders into a portal. The region is always present, even when empty, because screen readers only reliably announce content added to a live region that already exists.

```tsx
export function Toaster({ max = 4 }: { max?: number }) {
  const all = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [paused, setPaused] = useState(false);
  const visible = all.slice(-max);
  return createPortal(
    <section
      aria-label="Notifications" className="toaster"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      <ol>
        {visible.map((t) => <ToastItem key={t.id} toast={t} paused={paused} />)}
      </ol>
    </section>,
    document.body,
  );
}
```

Each toast manages its own timer with pause support. The trick is tracking remaining time, so pausing and resuming doesn't restart the full duration:

```tsx
function ToastItem({ toast: t, paused }: { toast: Toast; paused: boolean }) {
  const remaining = useRef(t.duration);
  useEffect(() => { remaining.current = t.duration; }, [t.duration, t.message]);
  useEffect(() => {
    if (paused || remaining.current === Infinity) return;
    const start = Date.now();
    const timer = setTimeout(() => dismiss(t.id), remaining.current);
    return () => { clearTimeout(timer); remaining.current -= Date.now() - start; };
  }, [paused, t.id, t.duration, t.message]);

  return (
    <li className={'toast toast-' + t.type} role={t.type === 'error' ? 'alert' : 'status'}>
      <span>{t.message}</span>
      {t.action && <button onClick={() => { t.action!.onClick(); dismiss(t.id); }}>{t.action.label}</button>}
      <button aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>×</button>
    </li>
  );
}
```

When `paused` becomes true, the effect cleanup clears the timer and subtracts the elapsed time; when it becomes false, a new timer starts with what's left. Errors use `role="alert"` so they're announced immediately; everything else uses `role="status"`, which waits for the screen reader to finish speaking. Toasts never take focus, because that would interrupt whatever the user was doing."

#### Another worked example
**Using it from outside React, and with promises:**
```ts
// api.ts
export async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (res.status === 401) toast.error('Your session expired. Please sign in again.');
  if (res.status >= 500) toast.error('Something went wrong on our side. Try again in a moment.');
  return res;
}

// In a component
async function onSave() {
  await toast.promise(saveDraft(), {
    loading: 'Saving draft…',
    success: 'Draft saved',
    error: 'Could not save draft',
  });
}

// Undo pattern
function onDelete(item: Item) {
  removeLocally(item.id);
  const timer = setTimeout(() => api('/items/' + item.id, { method: 'DELETE' }), 6000);
  toast('Item deleted', { duration: 6000, action: { label: 'Undo', onClick: () => { clearTimeout(timer); restoreLocally(item); } } });
}
```
The promise toast updates in place using the same id, so the user sees one notification change state instead of two stacking up. For the undo example, I've set a fixed duration on purpose: the action can only be undone for six seconds. Say this trade-off out loud, because it conflicts with the "no auto-dismiss with actions" rule; one option is to keep the Undo also available elsewhere, like a "Recently deleted" view.

#### A third worked example
**Exit animations without losing the item.** If you remove the toast from state immediately, it disappears without animating. Approach: `dismiss` first marks the toast as `leaving: true`; the item gets a CSS class that runs a 200ms fade/slide; on `animationend` (or after a timeout, as a fallback in case the animation doesn't fire), it's removed from the store. With `prefers-reduced-motion: reduce`, skip the animation and remove immediately. For stacking, newer libraries collapse toasts into a stack that expands on hover, using `transform` and `--index` CSS variables, which only animates compositor-friendly properties.

#### Step-by-step framework
1. **Clarify** types, durations, position, max visible, actions, promise support.
2. **Design the API**: `toast()`, variants, `dismiss`, `promise`, returning ids.
3. **Choose state architecture**: external store with `useSyncExternalStore` for use anywhere.
4. **Build the Toaster**: portal, always-present region, max visible.
5. **Implement timers** with remaining-time pause on hover, focus and hidden tabs.
6. **Make it accessible**: status vs alert, no focus stealing, enough time, labelled dismiss button, keyboard path to actions.
7. **Add animation** with a leaving state and reduced-motion support.
8. **Test**: fake timers for auto-dismiss and pause, RTL role queries, API-triggered toasts.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Context only, unusable from API code | External store, callable from anywhere |
| `setTimeout` without cleanup | Per-toast timers cleaned up, with pause/resume of remaining time |
| Region rendered only when there's a toast | Always-present live region |
| Everything `role="alert"`, or no role | `status` for info, `alert` for errors |
| Fixed 2-second timeout for everything | Length-scaled durations; no auto-dismiss for errors and actions |
| Moves focus to the toast | Never steals focus; keyboard shortcut to reach actions |

#### Useful phrases
- "A toast is a cross-cutting concern, so the API should work outside components."
- "Pausing means remembering how much time is left, not restarting the timer."
- "The live region must exist before the message arrives."
- "If it has an action, it shouldn't disappear on its own."

#### Common pitfalls
- **Mutating the toasts array**, so `useSyncExternalStore` never sees a change.
- Timers that **keep running after unmount** or after manual dismissal.
- **Duplicate toasts** from the same error firing repeatedly (de-duplicate by id or message).
- Toasts **covering important UI** like a mobile bottom navigation or a chat input.
- **Hydration mismatch** in SSR: render the Toaster only on the client, or pass `getServerSnapshot`.
- Using toasts for **critical information** (form validation errors) that belongs inline.

#### Follow-ups to expect (with sample answers)
- **"Why `useSyncExternalStore` instead of `useState` in a provider?"** — "It lets a module-level store be the source of truth, so non-React code can call `toast()`, and it's safe with concurrent rendering, avoiding tearing where different components see different versions of the store."
- **"How do you test the auto-dismiss?"** — "Fake timers: show a toast, advance by the duration, assert it's gone. For pause, hover with user-event (configured with `advanceTimers`), advance past the duration, assert it's still there, unhover, advance the remaining time, assert it's gone."
- **"When shouldn't you use a toast?"** — "For errors the user must fix (show them inline next to the field), for critical confirmations (use a dialog), and for anything the user needs to refer back to."
- **"How do you prevent toast spam?"** — "Limit visible toasts, queue the rest, de-duplicate identical messages within a short window, and update an existing toast by id instead of adding new ones."
- **"How would you support multiple Toasters, like one per page area?"** — "Give each toast a `toasterId` and have each Toaster filter by its id, with a default for the global one."

#### What senior interviewers look for
- **API ergonomics** that make the right thing easy for the whole team.
- **Correct timer logic** with cleanup and pause semantics.
- **Real accessibility knowledge**: politeness levels, timing, focus.
- Judgement about **when toasts are the wrong pattern**.

#### Practise it
- Build the store, Toaster and timers in 45 minutes; then add `toast.promise` and an Undo action.
- Test with a screen reader that success and error toasts are announced differently.
- Checklist: callable anywhere · immutable store updates · portal · always-present region · status/alert · pause with remaining time · no focus stealing · durations · max visible · exit animation · reduced motion.

#### Variations you might be asked
- "Build an undo-able delete with a toast."
- "Build a global loading/progress indicator for API requests."
- "Design a notification centre that keeps a history of past toasts."

## Build a command palette (Cmd+K)
- id: e7d7667e-c8aa-44ef-a52e-95528a034b65
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: hard
- levels:
- tags: component, keyboard-shortcuts, fuzzy-search
- companies: Anthropic, Stripe

### Prompt
Build a command palette like the ones in Linear, Raycast or VS Code. Pressing Cmd+K (Ctrl+K on Windows) opens a dialog with a search input; typing filters a list of commands with fuzzy matching; arrow keys move through results; Enter runs the selected command; Escape closes it. Commands can be grouped and some open nested pages (for example, "Change theme…" shows theme options).

### Answer
#### What the interviewer is really testing
- A **global keyboard shortcut** done properly: platform detection, not firing inside text fields where it conflicts, cleanup.
- **Fuzzy search** implementation and ranking: subsequence matching, scoring consecutive characters and word starts, keywords.
- **Composition of earlier patterns**: a modal dialog (focus, Escape, restore focus) plus a combobox/listbox (`aria-activedescendant`).
- A **command registry** design: how features register commands, with context-awareness and nested pages.
- **Performance** with hundreds of commands and a smooth typing experience.

#### Key points
- **Shortcut:** listen on `window` for `keydown` where `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'`; `preventDefault` (browsers use Ctrl+K for the address bar search). Toggle open. Also commonly `/` or `?` but only when focus isn't in an input or contenteditable.
- **Dialog:** reuse modal behaviour: portal, `role="dialog"`, `aria-modal`, label, focus the input on open, Escape to close (or to go back a page in nested mode), restore focus on close, click backdrop to close.
- **Combobox:** input with `role="combobox"`, `aria-expanded="true"`, `aria-controls`, `aria-activedescendant`; list with `role="listbox"`; groups with `role="group"` and `aria-labelledby` a heading; options with `role="option"` and `aria-selected`.
- **Command model:**
  ```
  { id, title, group, keywords?: string[], shortcut?: string[], icon?, perform?: () => void, children?: Command[] }
  ```
  Register commands from anywhere (a registry/store or `useRegisterCommands(commands, deps)` that adds on mount and removes on unmount), so a page's commands appear only while that page is mounted.
- **Fuzzy matching:** check that the query's characters appear in order (subsequence) in the title (or keywords); score bonuses for matches at word starts, consecutive matches, and prefix matches; penalties for gaps. Sort by score; tie-break by recently used.
- **Navigation:** ArrowDown/ArrowUp wrap through the flat list of visible options (skipping group headings); Home/End; Enter runs the active command; reset active index to 0 when the query changes; scroll the active item into view.
- **Nested pages:** a stack of pages; selecting a command with `children` pushes it, clears the query, and shows a breadcrumb; Backspace on an empty input or Escape pops.
- **Recents:** store the last few command ids in localStorage and show them at the top when the query is empty.

#### Model answer
"I see this as three pieces I've built before, combined: a global shortcut, a modal dialog, and a combobox with filtering, plus a command registry and fuzzy search.

Commands are plain objects with an id, title, group, optional keywords and shortcut, and either a `perform` function or `children` for a nested page. They live in a small registry so any feature can register commands while it's mounted. That means the 'Archive issue' command only exists while an issue page is open.

The shortcut listener goes on `window`. I check `metaKey || ctrlKey` so it works on Mac and Windows, and call `preventDefault`, because Ctrl+K is the browser's search shortcut on some platforms.

```tsx
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen((o) => !o);
    }
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);
```

For search, I'd write a simple fuzzy scorer rather than plain `includes`, because users type things like 'gtset' for 'Go to settings'. The query characters must appear in order; consecutive matches and matches at the start of words score higher, and gaps cost a little.

```ts
export function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase(), t = text.toLowerCase();
  if (!q) return 1;
  let score = 0, ti = 0, prevMatch = -2;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;                      // not a subsequence
    const wordStart = found === 0 || t[found - 1] === ' ' || t[found - 1] === '-';
    score += 1;
    if (found === prevMatch + 1) score += 3;          // consecutive
    if (wordStart) score += 5;                        // start of a word
    score -= Math.min(found - ti, 3) * 0.5;           // small gap penalty
    prevMatch = found; ti = found + 1;
  }
  if (t.startsWith(q)) score += 10;                   // prefix bonus
  return score;
}

function rank(commands: Command[], query: string) {
  return commands
    .map((c) => ({ c, s: Math.max(fuzzyScore(query, c.title), ...(c.keywords ?? []).map((k) => fuzzyScore(query, k) * 0.8)) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}
```

This greedy version can miss the best alignment in some cases, which I'd mention; for production I'd use a library like `fuzzysort` or `command-score`.

The palette component keeps a page stack, the query, and the active index:

```tsx
function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState('');
  const [stack, setStack] = useState<Command[]>([]);
  const [active, setActive] = useState(0);
  const listId = useId();

  const source = stack.length ? stack[stack.length - 1].children! : commands;
  const results = useMemo(() => (query ? rank(source, query) : withRecentsFirst(source)), [source, query]);
  const groups = groupBy(results, (c) => (query ? 'Results' : c.group));
  useEffect(() => setActive(0), [query, stack]);
  useEffect(() => { if (!open) { setQuery(''); setStack([]); } }, [open]);

  function run(cmd: Command) {
    if (cmd.children) { setStack((s) => [...s, cmd]); setQuery(''); return; }
    saveRecent(cmd.id);
    onClose();
    cmd.perform?.();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const n = results.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % Math.max(n, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + n) % Math.max(n, 1)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); run(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); stack.length ? setStack((s) => s.slice(0, -1)) : onClose(); }
    else if (e.key === 'Backspace' && !query && stack.length) { setStack((s) => s.slice(0, -1)); }
  }

  let flatIndex = -1;
  return (
    <Modal open={open} onClose={onClose} title="Command palette" hideTitle>
      {stack.length > 0 && <nav aria-label="Breadcrumb">{stack.map((s) => s.title).join(' › ')}</nav>}
      <input
        autoFocus role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={results[active] ? listId + '-' + results[active].id : undefined}
        placeholder="Type a command or search…" value={query}
        onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
      />
      <div id={listId} role="listbox" aria-label="Commands">
        {results.length === 0 && <p className="empty">No commands match “{query}”.</p>}
        {Object.entries(groups).map(([group, cmds]) => (
          <div role="group" aria-label={group} key={group}>
            <div className="group-heading" aria-hidden>{group}</div>
            {cmds.map((cmd) => {
              const i = ++flatIndex;
              return (
                <div
                  key={cmd.id} id={listId + '-' + cmd.id} role="option" aria-selected={i === active}
                  onMouseMove={() => setActive(i)} onClick={() => run(cmd)}
                >
                  {cmd.title}{cmd.children && ' …'}
                  {cmd.shortcut && <kbd>{cmd.shortcut.join(' ')}</kbd>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Modal>
  );
}
```

The `Modal` provides focus restoration, the backdrop and the portal. The active index is over the flat result list, so groups are only visual; arrow keys move through options in order and skip headings. I use `onMouseMove` rather than `onMouseEnter` for hover, so a list scrolling under a stationary mouse doesn't steal the keyboard selection. I close the palette before running the command, so commands that open their own dialogs or move focus don't fight the palette's focus restoration."

#### Another worked example
**Registering commands from features:**
```tsx
const registry = createStore<Command[]>([]); // same pub/sub pattern as a toast store

export function useRegisterCommands(cmds: Command[], deps: unknown[]) {
  useEffect(() => {
    registry.set((all) => [...all, ...cmds]);
    return () => registry.set((all) => all.filter((c) => !cmds.includes(c)));
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

// In IssuePage
useRegisterCommands([
  { id: 'issue.assign-me', title: 'Assign to me', group: 'Issue', shortcut: ['I'], perform: () => assign(issue.id, me.id) },
  { id: 'issue.status', title: 'Change status…', group: 'Issue',
    children: STATUSES.map((s) => ({ id: 'status.' + s, title: s, group: 'Status', perform: () => setStatus(issue.id, s) })) },
], [issue.id]);
```
Commands appear when the page mounts and disappear when it unmounts, so the palette is always context-aware without a central file knowing about every feature.

#### A third worked example
**Highlighting matched characters and async results.** Return the matched indexes from the scorer and render matched characters in `<mark>` (split the string; never inject HTML). For async sources, like searching issues by title, debounce the query, fetch with an `AbortController`, and show a "Searching issues…" group below the static commands, so local commands appear instantly and server results stream in without reordering what the user is already looking at.

#### Step-by-step framework
1. **Clarify**: shortcut, command sources, nested pages, recents, async search.
2. **Model commands** and a registry that features can add to.
3. **Add the global shortcut** with platform handling and cleanup.
4. **Reuse a modal** for the shell: focus in, Escape, restore focus.
5. **Implement fuzzy ranking** with sensible bonuses and keywords.
6. **Build the combobox**: input, listbox, groups, active index, `aria-activedescendant`, scroll into view.
7. **Add nested pages**, breadcrumbs, Backspace/Escape to go back, and recents.
8. **Polish and test**: highlighting, empty state, async results, unit tests for the scorer, RTL keyboard tests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| `includes` substring filter | Fuzzy subsequence scoring with word-start and consecutive bonuses |
| Hard-coded command list | Registry that features add to while mounted |
| Focus moves into the list | Input keeps focus; `aria-activedescendant` |
| Only Cmd, broken on Windows | `metaKey` or `ctrlKey`, plus `preventDefault` |
| Runs the command, then closes | Closes first, so focus handling doesn't conflict |
| No nested pages | Page stack with breadcrumb and back behaviour |

#### Useful phrases
- "This is a modal plus a combobox plus a ranking function."
- "Commands register where they're relevant, so the palette is context-aware for free."
- "I rank, not just filter: word starts and consecutive characters matter."
- "Hover uses mouse move, so scrolling doesn't steal the keyboard selection."

#### Common pitfalls
- **Not resetting the active index** when results change, leaving it pointing beyond the list.
- Global shortcuts that **fire while typing** in inputs (for single-key shortcuts).
- **Listener leaks** from re-adding the keydown handler on every render.
- Running commands that **open dialogs while the palette's focus trap** is still active.
- Re-ranking hundreds of commands with **expensive per-keystroke work**; precompute lowercase titles.
- Forgetting **IME composition** (`e.nativeEvent.isComposing`) when handling Enter.

#### Follow-ups to expect (with sample answers)
- **"How do you show and handle per-command shortcuts like G then S?"** — "A sequence-aware key handler: on G, set a pending prefix with a short timeout; if S arrives in time, run 'Go to settings'. Skip it when focus is in a text field. Show shortcuts in the palette so users learn them."
- **"How would you scale to thousands of items, like all issues?"** — "Static commands rank locally; large sets are searched server-side with debouncing and cancellation. Virtualize the list if results are long, keeping the active option rendered."
- **"How do you test fuzzy ranking?"** — "Table-driven unit tests: for each query, assert the expected top result, like 'gs' ranks 'Go to settings' above 'Toggle sidebar'. That locks in ranking behaviour as the scorer changes."
- **"How would you make it accessible to screen readers?"** — "Dialog labelled 'Command palette', combobox and listbox roles, grouped options, active option via `aria-activedescendant`, and a polite live region announcing the result count."
- **"What about discoverability on mobile?"** — "There's no keyboard shortcut, so expose a search button that opens the same palette, with larger touch targets."

#### What senior interviewers look for
- **Reuse of solid primitives** (modal, combobox) rather than ad-hoc code.
- A **thoughtful ranking** approach and awareness of its limits.
- **Extensible architecture**: registry, context-aware commands, nested pages.
- Fine **keyboard UX details**: mousemove vs mouseenter, close-then-run, IME.

#### Practise it
- Build it in 60 minutes with 30 commands, two groups and one nested page.
- Write table-driven tests for your fuzzy scorer.
- Checklist: Cmd/Ctrl+K with preventDefault · modal behaviour · combobox ARIA · fuzzy ranking · groups · active index reset · scroll into view · nested pages · recents · close-then-run.

#### Variations you might be asked
- "Build a global search with keyboard navigation across multiple result types."
- "Build a keyboard shortcuts help dialog that lists all shortcuts."
- "Build a slash-command menu inside a text editor."

## Build an OTP input (6 separate digit boxes)
- id: 4f946ca6-d1e9-41b5-8d99-6d30ff1893e9
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, forms
- companies: Apple, Monzo, Revolut

### Prompt
Build a one-time passcode (OTP) input in React with six separate boxes, one digit per box. Typing moves focus to the next box, Backspace moves back, pasting a full code fills all boxes, and the component calls `onComplete` when all six digits are entered. It should work with SMS autofill on mobile and be accessible.

### Answer
#### What the interviewer is really testing
- **Focus management** across multiple inputs: advance, go back, arrow keys, selection on focus.
- **Edge cases** most candidates miss: paste, typing into a filled box, non-digit input, Backspace on an empty box, deleting from the middle.
- **Mobile and platform features**: `autocomplete="one-time-code"`, `inputMode="numeric"`, SMS autofill delivering all six digits into one field.
- **Accessibility**: labelling six inputs so screen readers make sense of them, and announcing errors.
- **Controlled state** design and a clean API (`length`, `value`/`onChange`, `onComplete`, `disabled`, `error`).

#### Key points
- **Clarify:** digits only or alphanumeric? Length configurable? Auto-submit on completion? Show a masked value? Error and resend states?
- **State:** an array of characters `string[]` of length N (empty strings for blanks). The value is `digits.join('')`.
- **Input attributes per box:** `inputMode="numeric"` (numeric keyboard on mobile), `pattern="[0-9]*"`, `maxLength` (careful: needs to allow paste/autofill of the full code into the first box, see below), `autoComplete="one-time-code"` on the first box (iOS and Android use it to offer the code from SMS), and an `aria-label` like "Digit 1 of 6".
- **Behaviours:**
  - **Type a digit:** set it, move focus to the next box. Typing into a filled box replaces its digit.
  - **Non-digits:** ignore.
  - **Backspace:** if the current box has a digit, clear it and stay; if empty, move to the previous box and clear it.
  - **ArrowLeft/ArrowRight:** move between boxes; Home/End optional.
  - **Paste** (in any box): take the digits from the clipboard, fill from that box onwards (or from the start if it's a full code), and focus the next empty box or the last box.
  - **Autofill:** the OS may insert the whole code into one input as a single change event; handle a multi-character change like a paste.
  - **Focus:** select the box's content on focus, so typing replaces it.
- **Completion:** when all boxes are filled, call `onComplete(code)` once (not repeatedly on re-renders). Optionally blur or submit.
- **Alternative design:** a **single hidden input** (with `autocomplete="one-time-code"`) styled to look like six boxes. Simpler autofill, paste and screen reader behaviour; the visual boxes are just a rendering of the value. Many production libraries take this approach. Worth mentioning as a trade-off.
- **Accessibility:** wrap in a `fieldset` with a `legend` ("Enter the 6-digit code we sent to •••• 1234"), associate errors with `aria-describedby`, and announce errors via `role="alert"`.

#### Model answer
"I'd confirm digits only, six by default, and that `onComplete` fires when the code is full so the parent can verify it. I'd also mention there are two designs: six real inputs, which is what's asked, or one real input styled as six boxes, which handles autofill and screen readers more simply. I'll build the six-input version and keep the logic in one place so either is easy.

State is an array of six strings. Every change goes through one function that takes a string of new characters and a starting index, and spreads them across the boxes. That single function handles typing, pasting and SMS autofill, which on iOS arrives as one change event containing all six digits.

```tsx
type Props = { length?: number; onComplete: (code: string) => void; disabled?: boolean; error?: string };

export function OtpInput({ length = 6, onComplete, disabled, error }: Props) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const errorId = useId();
  const completed = useRef('');

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  function fill(start: number, chars: string) {
    const clean = chars.replace(/\D/g, '');
    if (!clean) return;
    const from = clean.length >= length ? 0 : start; // a full code always fills from the first box
    const next = [...digits];
    clean.slice(0, length - from).split('').forEach((c, k) => { next[from + k] = c; });
    setDigits(next);
    const firstEmpty = next.findIndex((d) => d === '');
    focus(firstEmpty === -1 ? length - 1 : firstEmpty);
  }

  useEffect(() => {
    const code = digits.join('');
    if (code.length === length && completed.current !== code) {
      completed.current = code;
      onComplete(code);
    }
    if (code.length < length) completed.current = '';
  }, [digits, length, onComplete]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) { next[i] = ''; setDigits(next); }
      else if (i > 0) { next[i - 1] = ''; setDigits(next); focus(i - 1); }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1); }
  }

  return (
    <fieldset className="otp" disabled={disabled} aria-describedby={error ? errorId : undefined}>
      <legend>Enter the {length}-digit code</legend>
      <div className="otp-boxes">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={d}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={'Digit ' + (i + 1) + ' of ' + length}
            aria-invalid={!!error}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const v = e.target.value;
              // typing into a filled, selected box gives one char; autofill gives many
              fill(i, v.length > 1 && d ? v.replace(d, '') || v : v);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
            onPaste={(e) => { e.preventDefault(); fill(i, e.clipboardData.getData('text')); }}
          />
        ))}
      </div>
      {error && <p id={errorId} role="alert" className="otp-error">{error}</p>}
    </fieldset>
  );
}
```

A few details are worth calling out. I don't set `maxLength={1}`, because then SMS autofill and some paste paths can only insert one digit; instead the `fill` function takes whatever arrives and distributes it. Selecting the content on focus means typing into a filled box replaces the digit. If the box wasn't selected, for example the user clicked at the end, the change value has two characters, and I strip out the old digit to keep only the new one.

Backspace is handled in `keydown` with `preventDefault`, so I control the behaviour precisely: clear the current digit if there is one, otherwise go back and clear the previous one. That matches what users expect from banking apps.

`onComplete` is called from an effect when the code becomes complete, and a ref prevents it firing again for the same code on re-render; if the user edits a digit, it can fire again with the new code. Finally, the fieldset has a legend that says what to enter, each input is labelled 'Digit 1 of 6', and errors are announced with `role="alert"` and linked with `aria-describedby`."

#### Another worked example
**The single-input alternative:**
```tsx
function OtpSingle({ length = 6, onComplete }: { length?: number; onComplete: (c: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <label className="otp-single">
      <span className="visually-hidden">One-time code</span>
      <input
        value={value} inputMode="numeric" autoComplete="one-time-code" maxLength={length}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, length);
          setValue(v);
          if (v.length === length) onComplete(v);
        }}
        className="otp-hidden-input"   /* transparent, stretched over the boxes */
      />
      <div aria-hidden className="otp-boxes">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={'box' + (i === value.length ? ' active' : '')}>{value[i] ?? ''}</span>
        ))}
      </div>
    </label>
  );
}
```
Paste, autofill, Backspace and screen readers all work natively because it's one ordinary input. The boxes are purely visual. The cost is custom CSS to place the caret and active-box highlight. Being able to compare both designs is a strong signal.

#### A third worked example
**The surrounding flow at a bank (Monzo/Revolut style).**
- Auto-submit on completion; show a spinner and disable the inputs while verifying.
- On failure: clear the boxes, focus the first box, show "That code didn't match. You have 2 attempts left." in an alert.
- A "Resend code" button disabled with a countdown ("Resend in 0:27"), using an interval cleaned up on unmount.
- The WebOTP API (`navigator.credentials.get({ otp: { transport: ['sms'] } })`) on Android Chrome can read the SMS automatically if the message ends with `@yourdomain.com #123456`; it's a progressive enhancement on top of `autocomplete="one-time-code"`.
- Never log the code in analytics, and rate-limit verification on the server.

#### Step-by-step framework
1. **Clarify**: length, characters allowed, auto-submit, error and resend behaviour.
2. **Mention the two designs**: six inputs vs one input styled as six.
3. **Model state** as an array, with one `fill(start, chars)` function.
4. **Handle typing and focus advance**, selecting on focus.
5. **Handle Backspace and arrows** in keydown.
6. **Handle paste and autofill** through `fill`; avoid `maxLength={1}`.
7. **Fire `onComplete` once** per complete code.
8. **Accessibility and mobile**: fieldset/legend, per-box labels, error alert, `inputMode`, `autocomplete="one-time-code"`.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| `maxLength={1}`, so paste and autofill break | One `fill` function distributing multiple characters |
| Backspace only clears, never moves back | Clear current, or move back and clear previous |
| Typing into a filled box does nothing | Select on focus, replace the digit |
| `onComplete` fires on every render | Fires once per completed code |
| Six unlabelled inputs | Fieldset, legend, "Digit 1 of 6" labels, error alert |
| Unaware of SMS autofill | `autocomplete="one-time-code"`, `inputMode="numeric"`, WebOTP |

#### Useful phrases
- "Typing, paste and autofill all go through one function."
- "I avoid `maxLength={1}` because autofill delivers all six digits at once."
- "There's a simpler design: one real input that looks like six boxes."
- "Completion fires once per code, not once per render."

#### Common pitfalls
- **Using `type="number"`**: it allows `e`, `+` and `-`, shows spinners, and drops leading zeros. Use text with `inputMode="numeric"`.
- **Focusing the next box in `keydown`** before the value is set, causing the digit to land in the wrong box.
- Not handling **paste in a middle box**.
- Forgetting **Android keyboards** that don't send reliable `key` values in `keydown` for digits; rely on `onChange` for input and keydown only for navigation keys.
- **Refs array** not updated correctly when `length` changes.
- Calling `onComplete` with a **stale closure** if it isn't in the effect's dependencies.

#### Follow-ups to expect (with sample answers)
- **"Why not handle digits in `onKeyDown`?"** — "Mobile virtual keyboards, IMEs and autofill don't send reliable key events; some Android keyboards report `Unidentified`. `onChange` (the input event) always fires with the new value, so I read input there and use keydown only for Backspace and arrows."
- **"How would you test it?"** — "RTL with user-event: type six digits and assert `onComplete('123456')` and focus movement; `user.paste('654321')` in the third box fills all; Backspace on an empty box moves focus back; letters are ignored."
- **"How do you support alphanumeric codes?"** — "Make the allowed character pattern a prop, switch `inputMode` to `text`, and uppercase input. The `fill` logic doesn't change."
- **"Should the code be masked?"** — "Usually not; OTPs are short-lived and seeing the digits reduces errors. For PINs, mask with `type="password"` style dots and add a show/hide toggle."
- **"How do you handle right-to-left languages?"** — "Digits are still entered left to right; set `dir="ltr"` on the group so focus order and arrow keys behave consistently."

#### What senior interviewers look for
- **Thoroughness on edge cases** (paste, autofill, replace, Backspace).
- **Platform knowledge**: input events vs key events, mobile keyboards, OTP autofill.
- **Design trade-off awareness** (single vs multiple inputs).
- **Accessible grouping and error messaging**.

#### Practise it
- Build it in 30 minutes, then test on a phone with SMS autofill (or Safari's paste suggestion) and with VoiceOver.
- Build the single-input version and compare code size and behaviour.
- Checklist: array state · `fill` for type/paste/autofill · select on focus · Backspace back · arrows · no `maxLength={1}` · `inputMode` + `one-time-code` · onComplete once · fieldset/legend/labels · error alert.

#### Variations you might be asked
- "Build a PIN entry with masked digits and a numeric keypad."
- "Build a credit card number input that formats as the user types."
- "Build a phone number input with a country selector."

## Build a chip / token input (type, Enter, becomes chip)
- id: 55a951cc-79e4-4be6-8bcf-95c3f0aa8e19
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: easy
- levels:
- tags: component, forms

### Prompt
Build a chip (token) input in React, like the "To" field in an email client or a tags field. The user types text and presses Enter (or comma) to turn it into a chip. Chips can be removed with a close button or with Backspace when the input is empty. Prevent duplicates and support pasting a comma-separated list.

### Answer
#### What the interviewer is really testing
- Clean **controlled component** design: `value: string[]` and `onChange`, with the draft text as internal state.
- Careful **keyboard handling**: Enter, comma, Backspace on empty input, and not breaking normal typing or IME composition.
- **Validation and normalisation**: trimming, case-insensitive duplicates, max chips, per-chip validation (e.g. emails).
- **Accessibility**: labelling, removable chips that are keyboard reachable and announced, focus after removal.
- Getting a **working, polished result quickly**; it's an "easy" problem, so the bar is completeness.

#### Key points
- **Clarify:** what separates chips (Enter, comma, Tab, space)? Validation (emails)? Duplicates case-insensitive? Max count? Suggestions dropdown (then it becomes an autocomplete)? Editing a chip?
- **API:** `value: string[]`, `onChange(next: string[])`, `placeholder`, `validate?: (s) => string | null`, `max?`, `label`. Keep the draft text internal.
- **Adding:**
  - On Enter or comma (`e.key === ','`), `preventDefault`, trim the draft, reject empty, reject duplicates (case-insensitive), validate, then add and clear the draft.
  - Don't add while the IME is composing (`e.nativeEvent.isComposing`).
  - Optionally add on blur so typed-but-uncommitted text isn't lost.
  - Prevent Enter from submitting the parent form only when there's a draft.
- **Paste:** split the clipboard text on commas, semicolons and newlines; add each valid, non-duplicate item; leave invalid ones in the draft or report them.
- **Removing:**
  - Each chip has a button with `aria-label="Remove react"`.
  - Backspace on an empty draft: either remove the last chip immediately, or (better UX, Gmail-style) first highlight it, then remove on the second Backspace.
  - After removing via the button, move focus to the input (or to the next chip) so focus isn't lost to `body`.
- **Rendering:** a wrapper styled like an input (clicking it focuses the real input), chips as a list, the input flexing to fill the remaining space, wrapping onto multiple lines.
- **Accessibility:** a `<label>` for the input; chips in a `ul` with an accessible name ("Selected tags"); an `aria-live="polite"` region announcing "Added react" and "Removed react"; validation errors linked with `aria-describedby`.

#### Model answer
"I'd confirm Enter and comma add a chip, duplicates are case-insensitive, pasting a comma-separated list adds them all, and Backspace on an empty input removes the last chip. I'll make it controlled, with `value` and `onChange` for the chips, and keep the text being typed as internal state.

All adding goes through one function, used by keyboard, paste and blur, so normalisation, duplicates and validation live in one place:

```tsx
type Props = {
  label: string; value: string[]; onChange: (v: string[]) => void;
  validate?: (s: string) => string | null; max?: number; placeholder?: string;
};

export function ChipInput({ label, value, onChange, validate, max = Infinity, placeholder }: Props) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);       // last chip highlighted for removal
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function addMany(raw: string[]) {
    const next = [...value];
    const rejected: string[] = [];
    for (const r of raw) {
      const item = r.trim();
      if (!item) continue;
      if (next.some((v) => v.toLowerCase() === item.toLowerCase())) continue; // silent de-dupe
      const err = validate?.(item) ?? null;
      if (err || next.length >= max) { rejected.push(item); setError(err ?? 'You can add up to ' + max + '.'); continue; }
      next.push(item);
    }
    if (next.length !== value.length) {
      onChange(next);
      setAnnouncement('Added ' + next.slice(value.length).join(', '));
    }
    setDraft(rejected.join(', '));
    if (!rejected.length) setError(null);
  }

  function remove(index: number) {
    const removed = value[index];
    onChange(value.filter((_, i) => i !== index));
    setAnnouncement('Removed ' + removed);
    setArmed(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
      e.preventDefault();
      addMany([draft]);
    } else if (e.key === 'Backspace' && draft === '' && value.length) {
      e.preventDefault();
      if (armed) remove(value.length - 1); else setArmed(true);
    } else {
      setArmed(false);
    }
  }

  return (
    <div className="chip-field">
      <label htmlFor={id}>{label}</label>
      <div className={'chip-box' + (error ? ' invalid' : '')} onClick={() => inputRef.current?.focus()}>
        <ul aria-label={'Selected ' + label.toLowerCase()} className="chips">
          {value.map((chip, i) => (
            <li key={chip} className={'chip' + (armed && i === value.length - 1 ? ' armed' : '')}>
              <span>{chip}</span>
              <button type="button" aria-label={'Remove ' + chip} onClick={(e) => { e.stopPropagation(); remove(i); }}>×</button>
            </li>
          ))}
        </ul>
        <input
          ref={inputRef} id={id} value={draft} placeholder={value.length ? '' : placeholder}
          aria-invalid={!!error} aria-describedby={error ? id + '-err' : undefined}
          onChange={(e) => { setDraft(e.target.value); setArmed(false); }}
          onKeyDown={onKeyDown}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (/[,;\n]/.test(text)) { e.preventDefault(); addMany(text.split(/[,;\n]+/)); }
          }}
          onBlur={() => draft.trim() && addMany([draft])}
        />
      </div>
      {error && <p id={id + '-err'} className="chip-error" role="alert">{error}</p>}
      <div aria-live="polite" className="visually-hidden">{announcement}</div>
    </div>
  );
}
```

A few choices to point out. Enter and comma only add when there's a draft; otherwise Enter can submit the form as usual. I skip key handling during IME composition, because for Japanese or Chinese input, Enter confirms the composed characters. Backspace on an empty input uses a two-step pattern: the first press highlights the last chip, the second removes it, which prevents accidental deletions, as Gmail does. Any other key cancels the highlight.

Pasting 'react, vue, svelte' adds all three, skipping duplicates. Invalid items, say a malformed email, stay in the input with an error so the user can fix them rather than losing them. When a chip is removed via its button, focus goes back to the input; otherwise the button disappears and focus falls to the page body, which is disorienting for keyboard users. A polite live region announces additions and removals for screen reader users.

Keys are the chip strings, which is safe because duplicates aren't allowed."

#### Another worked example
**An email recipients field with validation and display names.**
```tsx
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
<ChipInput
  label="To"
  value={recipients}
  onChange={setRecipients}
  validate={(s) => (EMAIL.test(s) ? null : s + ' is not a valid email address')}
  max={50}
/>
```
Extensions an interviewer may ask for:
- Parse `Ana Lopez <ana@example.com>` into a name and address, showing the name on the chip and the address in a tooltip.
- Show invalid chips in red rather than refusing them (email clients do this), and block sending until fixed.
- Suggestions from contacts: this turns the input into a combobox, reusing the autocomplete pattern (`role="combobox"`, listbox, `aria-activedescendant`).

#### A third worked example
**Keyboard navigation between chips.** For power users and screen reader users, allow ArrowLeft from the start of an empty input to move focus onto the chips (each chip focusable via a roving `tabIndex`), ArrowLeft/ArrowRight to move between them, Delete or Backspace to remove the focused chip (focus then moves to the neighbouring chip, or back to the input when none are left), and ArrowRight from the last chip to return to the input. Only one chip is in the Tab order at a time, so Tab still moves out of the whole field in one step.

#### Step-by-step framework
1. **Clarify** separators, validation, duplicates, max, paste, editing, suggestions.
2. **Define the API**: controlled `value`/`onChange`, internal draft.
3. **Write `addMany`** for normalisation, de-duplication, validation and limits.
4. **Handle keys**: Enter/comma add, Backspace two-step remove, IME guard.
5. **Handle paste and blur** through the same function.
6. **Render** the chip box, chips with remove buttons, and a flexible input.
7. **Accessibility**: label, list name, remove button labels, focus after removal, live announcements, error association.
8. **Polish**: chip keyboard navigation, max reached state, tests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Adds on every Enter, even empty | Trims, ignores empty, de-duplicates case-insensitively |
| Enter always prevented, form can't submit | Prevents only when there's a draft |
| Backspace instantly deletes the last chip | Two-step highlight then remove (or clearly stated choice) |
| Paste adds one giant chip | Splits on separators, adds each valid item |
| Focus lost after removing a chip | Focus returns to the input |
| Icon-only "×" with no label | `aria-label="Remove react"` and live announcements |

#### Useful phrases
- "Keyboard, paste and blur all go through one add function."
- "Enter only adds a chip if there's something to add; otherwise the form submits normally."
- "Invalid items stay in the input so the user can fix them, not lose them."
- "When a focused element disappears, I decide where focus goes next."

#### Common pitfalls
- **Not trimming**, so "react " and "react" become two chips.
- Ignoring **IME composition**, adding half-composed text.
- **Index keys** with removable items, causing state to stick to the wrong chip.
- Clicking the **remove button bubbling** to the wrapper's click handler (harmless here, but stop it if the wrapper does more).
- Losing typed text on **blur** without adding it or keeping it.
- The input **not wrapping** properly, so long chip lists overflow horizontally.

#### Follow-ups to expect (with sample answers)
- **"How would you allow editing a chip?"** — "Double-click or Enter on a focused chip turns it back into an inline input with its text; Enter commits through the same validation, Escape cancels."
- **"How would you test it?"** — "RTL and user-event: type 'react{Enter}' and assert `onChange` gets ['react']; type 'React{Enter}' and assert no duplicate; paste 'a, b, c'; Backspace twice on an empty input removes the last chip; the remove button's accessible name is 'Remove react'."
- **"What if there are hundreds of chips?"** — "Collapse to the first few plus a '+120 more' chip that expands, and keep the input visible. For huge sets a different UI, like a multi-select list, may be better."
- **"Controlled or uncontrolled?"** — "Controlled for the chips, so forms and validation libraries can own the value; the draft text stays internal because parents rarely need it. I could expose `defaultValue` for an uncontrolled mode too."
- **"How does it integrate with React Hook Form?"** — "Wrap it in a `Controller`, passing `field.value` and `field.onChange`, and forward the ref to the inner input so focus-on-error works."

#### What senior interviewers look for
- A **complete, polished** solution within the time, as this is an easy problem.
- **Sensible defaults** and clearly stated UX choices.
- **Accessibility details**: focus after removal, labels, announcements.
- **Reusable API design** that fits forms libraries.

#### Practise it
- Build it in 25 minutes, then add email validation and the two-step Backspace.
- Add roving-tabindex chip navigation and test with only a keyboard.
- Checklist: controlled value · single add function · trim and de-dupe · Enter/comma with IME guard · conditional preventDefault · paste splitting · blur handling · two-step Backspace · labelled remove buttons · focus after removal · live region.

#### Variations you might be asked
- "Build a multi-select dropdown with tags for selected options."
- "Build an email recipients field with contact suggestions."
- "Build a tag editor that suggests existing tags as you type."

## Build a date range picker
- id: 591c5a86-09d0-40ed-927a-7a8b8d705ab0
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: hard
- levels:
- tags: component, a11y, i18n, date-handling
- companies: Apple, Airbnb

### Prompt
Build a date range picker in React, like the check-in/check-out picker on a booking site. It shows a month calendar, lets the user pick a start and end date with a highlighted range, supports disabled dates (past dates, unavailable days), keyboard navigation, and localisation (week start, month names). Don't use a date library for the calendar maths.

### Answer
#### What the interviewer is really testing
- **Date maths without bugs**: building a month grid, days in a month, weekday offsets, time zones and DST traps.
- **Range selection state machine**: first click sets start, second sets end, clicking before start resets, hover preview.
- **Keyboard and ARIA for grids**: the WAI-ARIA date picker pattern with a `grid`, roving `tabIndex`, arrow keys, Page Up/Down.
- **Internationalisation**: `Intl.DateTimeFormat` for names, locale-dependent week start, right-to-left layouts.
- **Component API and scope**: controlled value, constraints (`min`, `max`, `isDateDisabled`, `minNights`), and what to cut in 60 minutes.

#### Key points
- **Clarify and scope:** one month or two side by side? Popover attached to inputs or inline? Typed input allowed? Min/max nights? Blocked dates? Time zones? For 60 minutes: inline calendar with month navigation, range selection, disabled dates, keyboard support, `Intl` formatting.
- **Represent dates as calendar days, not instants.** A check-in date is a day, not a moment. Use local-midnight `Date`s created with `new Date(y, m, d)` (never parse `'2026-03-08'`, which is treated as UTC midnight and can show the previous day), or plain `{ y, m, d }` objects / ISO date strings `'YYYY-MM-DD'`. Compare by day key. The Temporal API's `PlainDate` is the right model where available.
- **Month grid:**
  - `daysInMonth = new Date(y, m + 1, 0).getDate()`.
  - Offset of the first day: `(new Date(y, m, 1).getDay() - weekStart + 7) % 7`.
  - Fill leading blanks (or previous month's days), then 1..N, then trailing cells to complete the week rows.
  - **Add days with `setDate(d.getDate() + n)`**, never by adding 86,400,000 ms (breaks across DST changes).
- **Selection state machine:**
  - No start: click sets `start`.
  - Start, no end: click after start sets `end`; click before (or on) start resets `start` to that day.
  - Both set: click starts a new range.
  - Hover (or keyboard focus) while choosing the end previews the range.
  - Disallow ranges containing disabled dates (for bookings), or enforce `minNights`.
- **Keyboard (WAI-ARIA dialog date picker pattern):** arrows move by day/week; Home/End to start/end of week; Page Up/Down change month (Shift for year); Enter/Space selects; focus moves across month boundaries and the visible month follows.
- **ARIA:** `role="grid"` with an `aria-label` of the month and year (or `aria-labelledby` the visible heading); rows `role="row"`; column headers `role="columnheader"` with abbreviations and full names (`abbr`); day cells `role="gridcell"` with a `button` inside; selected days `aria-selected="true"`; disabled days `aria-disabled="true"`; full accessible names ("Sunday, 8 March 2026"); a live region announcing the month on navigation; the current day `aria-current="date"`.
- **Localisation:** `Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })` for headings, `{ weekday: 'short' }` for headers; week start from `new Intl.Locale(locale).getWeekInfo?.().firstDay` (with a fallback), Sunday in the US, Monday in most of Europe; CSS logical properties and arrow-key reversal in RTL.

#### Model answer
"I'd scope it first: an inline calendar showing one month with next and previous buttons, start and end selection with a hover preview, disabled past dates plus an `isDateDisabled` callback, full keyboard support and localised names. Two side-by-side months, a popover and typed input would be next steps.

The most important decision is how to represent dates. Check-in is a calendar day, not a moment in time, so I avoid instants and time zones. I create dates with `new Date(year, month, day)`, which is local midnight, and never parse strings like '2026-03-08', which JavaScript treats as UTC and can display as the 7th in the Americas. For comparisons I use a day key, and to add days I use `setDate`, because adding 24 hours in milliseconds goes wrong on daylight-saving days.

```ts
export const dayKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
export const sameDay = (a?: Date | null, b?: Date | null) => !!a && !!b && dayKey(a) === dayKey(b);
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last)); // 31 Jan + 1 month = 28/29 Feb
};

export function monthGrid(year: number, month: number, weekStart: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() - weekStart + 7) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
}
```

Selection is a small state machine. With no start, a click sets the start. With a start but no end, clicking a later day sets the end, and clicking an earlier day moves the start. With both set, a click begins a new range. While choosing the end, the hovered or focused day previews the range, and I reject a range that contains a disabled date, because you can't book across an unavailable night.

```tsx
type Range = { start: Date | null; end: Date | null };

export function DateRangePicker({ value, onChange, locale = navigator.language, isDateDisabled, min = startOfToday() }: Props) {
  const weekStart = getWeekStart(locale);
  const [focused, setFocused] = useState<Date>(value.start ?? min);
  const [hovered, setHovered] = useState<Date | null>(null);
  const view = { y: focused.getFullYear(), m: focused.getMonth() };
  const grid = useMemo(() => monthGrid(view.y, view.m, weekStart), [view.y, view.m, weekStart]);
  const cellRefs = useRef(new Map<number, HTMLButtonElement>());
  const fmtMonth = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const fmtFull = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtDow = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  const disabled = (d: Date) => dayKey(d) < dayKey(min) || !!isDateDisabled?.(d);
  const rangeHasDisabled = (a: Date, b: Date) => {
    for (let d = a; dayKey(d) <= dayKey(b); d = addDays(d, 1)) if (disabled(d)) return true;
    return false;
  };

  function select(d: Date) {
    if (disabled(d)) return;
    const { start, end } = value;
    if (!start || end || dayKey(d) <= dayKey(start)) onChange({ start: d, end: null });
    else if (!rangeHasDisabled(start, d)) onChange({ start, end: d });
  }

  const previewEnd = value.start && !value.end ? hovered : value.end;
  const inRange = (d: Date) => !!value.start && !!previewEnd && dayKey(d) > dayKey(value.start) && dayKey(d) < dayKey(previewEnd);

  useEffect(() => { cellRefs.current.get(dayKey(focused))?.focus(); }, [focused]);

  function onKeyDown(e: React.KeyboardEvent) {
    const moves: Record<string, () => Date> = {
      ArrowRight: () => addDays(focused, 1), ArrowLeft: () => addDays(focused, -1),
      ArrowDown: () => addDays(focused, 7), ArrowUp: () => addDays(focused, -7),
      Home: () => addDays(focused, -((focused.getDay() - weekStart + 7) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() - weekStart + 7) % 7)),
      PageDown: () => addMonths(focused, e.shiftKey ? 12 : 1), PageUp: () => addMonths(focused, e.shiftKey ? -12 : -1),
    };
    if (moves[e.key]) { e.preventDefault(); const next = moves[e.key](); setFocused(next); setHovered(next); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(focused); }
  }

  const headingId = useId();
  return (
    <div className="drp">
      <div className="drp-header">
        <button aria-label="Previous month" onClick={() => setFocused(addMonths(focused, -1))}>‹</button>
        <h2 id={headingId} aria-live="polite">{fmtMonth.format(focused)}</h2>
        <button aria-label="Next month" onClick={() => setFocused(addMonths(focused, 1))}>›</button>
      </div>
      <table role="grid" aria-labelledby={headingId} onKeyDown={onKeyDown}>
        <thead>
          <tr>{Array.from({ length: 7 }, (_, i) => {
            const d = addDays(new Date(2024, 0, 7), (weekStart + i) % 7); // 7 Jan 2024 was a Sunday
            return <th key={i} scope="col" abbr={new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d)}>{fmtDow.format(d)}</th>;
          })}</tr>
        </thead>
        <tbody>
          {grid.map((week, r) => (
            <tr key={r}>
              {week.map((d, c) => d ? (
                <td key={c} role="gridcell" aria-selected={sameDay(d, value.start) || sameDay(d, value.end) || inRange(d)}
                    className={[sameDay(d, value.start) && 'start', sameDay(d, previewEnd) && 'end', inRange(d) && 'in-range'].filter(Boolean).join(' ')}>
                  <button
                    ref={(el) => { if (el) cellRefs.current.set(dayKey(d), el); else cellRefs.current.delete(dayKey(d)); }}
                    tabIndex={sameDay(d, focused) ? 0 : -1}
                    aria-label={fmtFull.format(d)}
                    aria-disabled={disabled(d) || undefined}
                    aria-current={sameDay(d, new Date()) ? 'date' : undefined}
                    onClick={() => { setFocused(d); select(d); }}
                    onMouseEnter={() => setHovered(d)}
                  >{d.getDate()}</button>
                </td>
              ) : <td key={c} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

The view month is derived from the focused date, so arrowing past the end of a month automatically shows the next month. Only the focused day has `tabIndex` 0, which is a roving tabindex: Tab enters the grid once and arrows move within it. Disabled days use `aria-disabled` rather than the `disabled` attribute, so they can still be focused and announced as unavailable while navigating.

For week start, I'd use `new Intl.Locale(locale).getWeekInfo()` where supported, with a small fallback table, Sunday for the US and Monday for most of Europe."

#### Another worked example
**Time zone and DST bugs you should name.**
- `new Date('2026-03-08')` is **UTC midnight**: in New York it's 7 March, 7pm. Parse date-only strings manually: `const [y, m, d] = s.split('-').map(Number); new Date(y, m - 1, d)`.
- `date.getTime() + 24 * 60 * 60 * 1000` lands on 11pm the same day when clocks go back. Use `setDate(+1)`.
- Counting nights by dividing millisecond differences by 86,400,000 gives 6.958 across DST; use `Math.round`, or count day keys.
- Send dates to the API as `'YYYY-MM-DD'` strings, not ISO timestamps, so the server doesn't shift them.
- With the Temporal API, `Temporal.PlainDate` removes these whole classes of bug, because it has no time or zone.

#### A third worked example
**A booking-style two-month popover.** Airbnb-style pickers show two months side by side, attach to "Check in" and "Check out" inputs, and display "5 nights" as the user hovers. Extensions:
- Render two grids (`focused` month and `addMonths(focused, 1)`), with shared keyboard focus across both.
- Clicking the "Check out" input with a start set means the next click sets the end.
- Per-day minimum stay ("3-night minimum from Friday"), and showing prices on days.
- On mobile: a full-screen sheet with vertically scrolling months, often virtualized.
- Text inputs that parse typed dates with locale-aware formats, validated against the same constraints.

#### Step-by-step framework
1. **Scope**: one inline month, range selection, disabled dates, keyboard, localisation; list what's out of scope.
2. **Choose a date representation**: calendar days, local-midnight dates or `YYYY-MM-DD`; helpers for keys and adding days.
3. **Build the month grid** with week start offset.
4. **Implement selection** as a state machine with hover preview and disabled-range checks.
5. **Add keyboard navigation** with a roving tabindex and focus following across months.
6. **Add ARIA**: grid, labelled by heading, column headers, full date labels, selected/disabled/current.
7. **Localise** with `Intl` and locale week start; consider RTL.
8. **Test** date helpers (month boundaries, leap years, DST), selection logic, and keyboard behaviour.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Parses `'YYYY-MM-DD'` with `new Date` | Builds local dates from parts; treats days as calendar days |
| Adds days in milliseconds | `setDate`-based helpers, DST-safe |
| Hard-coded English month names, Sunday start | `Intl.DateTimeFormat` and locale week start |
| Every day is a tab stop | Roving tabindex, arrows, Page Up/Down |
| Range can span blocked dates | Checks the range for disabled days |
| `disabled` buttons, unannounced | `aria-disabled`, full date labels, `aria-current` |

#### Useful phrases
- "A check-in date is a calendar day, not an instant, so I keep time zones out of it."
- "Never add days in milliseconds; daylight saving will find you."
- "The visible month follows the focused date."
- "Formatting and week start come from `Intl`, not hard-coded arrays."

#### Common pitfalls
- **Off-by-one months**: JavaScript months are 0-based.
- **31 January + 1 month** overflowing into March; clamp to the last day.
- Using **`getDay()` without the week start offset**.
- Focus lost when the **month changes** and the focused button unmounts.
- **Re-creating `Intl.DateTimeFormat`** objects on every render for every cell (cache them; they're relatively expensive).
- Building the whole thing before any **selection logic works**.

#### Follow-ups to expect (with sample answers)
- **"Why not use a date library?"** — "In production I'd use `date-fns` or Temporal for the maths and maybe React Aria for behaviour. Here I'm showing I understand the pitfalls those libraries solve."
- **"How would you test it?"** — "Unit tests for helpers: leap years, 31st plus a month, DST weeks, week start offsets. RTL tests for selection: click the 10th then the 14th and assert `onChange`; arrow keys move focus; Page Down shows the next month heading. Run tests in a fixed time zone and also in one with DST."
- **"How do you handle right-to-left locales?"** — "Set `dir` from the locale; the grid flips visually with logical CSS, and ArrowLeft/ArrowRight should swap meaning so that 'right' still moves forward visually."
- **"How would typed input work?"** — "Parse with a locale-aware pattern, validate against min, max and disabled dates, sync to the calendar on blur, and show errors inline. Never reformat while the user is typing."
- **"What about time zones for the booking itself?"** — "The booking dates are in the property's local calendar. The server stores them as dates without times, plus the property's time zone for any check-in time calculations."

#### What senior interviewers look for
- **Date correctness**: awareness of UTC parsing, DST and month overflow.
- **Accessible grid** behaviour that follows the WAI-ARIA pattern.
- **Internationalisation** done with platform APIs.
- **Scoping skill**: delivering a solid core and naming extensions.

#### Practise it
- Build the inline single-month version in 60 minutes; then add a second month and a popover.
- Write tests for month grids of February 2024 (leap year) and a DST week in your time zone.
- Checklist: calendar-day model · local date construction · DST-safe add · week start offset · state machine with preview · disabled-range check · roving tabindex · Page Up/Down · grid ARIA · Intl names · focus across months.

#### Variations you might be asked
- "Build a single date picker attached to an input."
- "Build a month/year picker for a credit card expiry."
- "Build a calendar view that shows events, like Google Calendar's month view."

## Build a multi-step form (wizard) with back/next, validation, async submit
- id: bb2f1280-a20e-4201-a887-7dc226eca597
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, forms, state-management

### Prompt
Build a multi-step form (wizard) in React, for example a sign-up flow with Account, Profile and Review steps. Users can go back and forward, each step validates before moving on, data is kept when going back, and the final step submits asynchronously with loading and error handling.

### Answer
#### What the interviewer is really testing
- **State architecture**: one source of truth for all steps' data, separate from which step is showing.
- **Validation design**: per-step schemas, when to show errors, server-side errors mapped back to fields.
- **Navigation rules**: Back never validates, Next validates the current step, jumping to a step from the review page, and browser Back behaviour.
- **Async submit** done properly: disable double submits, loading state, error recovery, success.
- **Accessibility**: a step indicator with `aria-current`, moving focus to the new step's heading, error summaries.

#### Key points
- **Clarify:** number of steps, conditional steps (e.g. a "Company" step only for business accounts), persistence across refresh, deep-linkable steps (URL), whether users can jump to any completed step.
- **State:**
  - `data`: one object for the whole form, e.g. `{ account: {...}, profile: {...} }`, owned by the wizard (useReducer, or a form library with one form instance).
  - `stepIndex`, and optionally `visited`/`completed` sets.
  - `status: 'idle' | 'submitting' | 'error' | 'success'` and `submitError`.
- **Steps as configuration:** an array of `{ id, title, fields component, schema, isVisible?(data) }`. The wizard renders the current one; conditional steps are filtered from the array using current data.
- **Validation:**
  - Per-step schema (Zod or hand-written). On Next, validate only that step's data; if invalid, show errors and focus the first invalid field (or an error summary).
  - Show errors after a field is touched or after a Next attempt, not while the user is first typing.
  - Back never validates and never loses data.
  - Validate the whole form again before submit (steps may have changed since).
- **Navigation:**
  - Step indicator: `nav` with an ordered list; the current step has `aria-current="step"`; completed steps are links/buttons to jump back.
  - Moving to a step: focus its heading (`tabIndex={-1}`), so screen reader users know the context changed; scroll to top.
  - Optionally sync the step to the URL (`?step=profile`) so the browser Back button moves between steps; guard against deep-linking to a step whose prerequisites aren't valid.
- **Submit:**
  - Disable the button and show "Creating account…" while submitting; ignore repeat submits (a ref guard).
  - On server validation errors (e.g. "email already taken"), map them to fields and navigate to the step that contains the field.
  - On network error, keep all data and offer retry.
  - On success, clear any saved draft and show confirmation.
- **Persistence:** save drafts to `sessionStorage` (never passwords) so a refresh doesn't lose progress.
- **Use a single `<form>` per step** with `onSubmit` for Next, so Enter works naturally.

#### Model answer
"I'd model this as one form split into steps, rather than separate forms. All data lives in one object owned by the wizard, and the step index only decides which part is shown. That guarantees that going back keeps data, and the review step can read everything.

Steps are configuration: each has an id, a title, a component that renders its fields, a validation function, and optionally a visibility rule for conditional steps.

```tsx
type Data = { account: { email: string; password: string }; profile: { name: string; type: 'personal' | 'business' }; company: { name: string; vat: string } };
type Errors = Partial<Record<string, string>>;

const steps: Step[] = [
  { id: 'account', title: 'Account', Fields: AccountFields, validate: (d) => ({
      'account.email': /^\S+@\S+\.\S+$/.test(d.account.email) ? undefined : 'Enter a valid email address',
      'account.password': d.account.password.length >= 12 ? undefined : 'Use at least 12 characters' }) },
  { id: 'profile', title: 'Profile', Fields: ProfileFields, validate: (d) => ({
      'profile.name': d.profile.name.trim() ? undefined : 'Enter your name' }) },
  { id: 'company', title: 'Company', Fields: CompanyFields, isVisible: (d) => d.profile.type === 'business',
    validate: (d) => ({ 'company.name': d.company.name.trim() ? undefined : 'Enter the company name' }) },
  { id: 'review', title: 'Review', Fields: ReviewStep, validate: () => ({}) },
];
const clean = (e: Errors) => Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errors;
```

The wizard component holds the data, the current step, errors and submit status:

```tsx
export function SignupWizard({ submit }: { submit: (d: Data) => Promise<void> }) {
  const [data, setData] = useState<Data>(() => loadDraft() ?? initialData);
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle');
  const submitting = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const visible = steps.filter((s) => !s.isVisible || s.isVisible(data));
  const step = visible[Math.min(index, visible.length - 1)];
  const isLast = step.id === 'review';

  useEffect(() => { headingRef.current?.focus(); }, [step.id]);
  useEffect(() => { saveDraft({ ...data, account: { ...data.account, password: '' } }); }, [data]);

  const update = (section: keyof Data, patch: object) => setData((d) => ({ ...d, [section]: { ...d[section], ...patch } }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLast) {
      const errs = clean(step.validate(data));
      setErrors(errs);
      if (Object.keys(errs).length) { focusFirstError(errs); return; }
      setIndex((i) => i + 1);
      return;
    }
    // final submit: re-validate every visible step
    for (const [i, s] of visible.entries()) {
      const errs = clean(s.validate(data));
      if (Object.keys(errs).length) { setIndex(i); setErrors(errs); return; }
    }
    if (submitting.current) return;
    submitting.current = true;
    setStatus('submitting');
    try {
      await submit(data);
      clearDraft();
      setStatus('success');
    } catch (err) {
      const fieldErrors = (err as ApiError).fieldErrors; // e.g. { 'account.email': 'Already registered' }
      if (fieldErrors) {
        const target = visible.findIndex((s) => Object.keys(fieldErrors).some((f) => f.startsWith(s.id + '.')));
        setErrors(fieldErrors); setIndex(Math.max(0, target)); setStatus('idle');
      } else setStatus('error');
    } finally {
      submitting.current = false;
    }
  }

  if (status === 'success') return <Success email={data.account.email} />;

  return (
    <div className="wizard">
      <nav aria-label="Sign-up progress">
        <ol>
          {visible.map((s, i) => (
            <li key={s.id} aria-current={i === index ? 'step' : undefined}>
              {i < index ? <button type="button" onClick={() => { setErrors({}); setIndex(i); }}>{s.title}</button> : <span>{s.title}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <form onSubmit={onSubmit} noValidate>
        <h2 ref={headingRef} tabIndex={-1}>Step {index + 1} of {visible.length}: {step.title}</h2>
        {Object.keys(errors).length > 0 && <ErrorSummary errors={errors} />}
        <step.Fields data={data} update={update} errors={errors} goTo={(id: string) => setIndex(visible.findIndex((s) => s.id === id))} />
        {status === 'error' && <p role="alert">We couldn't create your account. Check your connection and try again.</p>}
        <div className="wizard-actions">
          {index > 0 && <button type="button" onClick={() => { setErrors({}); setIndex((i) => i - 1); }}>Back</button>}
          <button type="submit" disabled={status === 'submitting'}>
            {isLast ? (status === 'submitting' ? 'Creating account…' : 'Create account') : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

A few choices to point out. Next is the form's submit button, so pressing Enter in a field moves forward, and validation runs in one place. Back is a plain button that never validates and keeps the data. Steps are filtered by visibility using the current data, so choosing 'business' inserts the Company step automatically. When the step changes, focus moves to the new heading, so screen reader users hear 'Step 2 of 4: Profile' instead of being left on a button that no longer exists.

On final submit I validate every step again, because users can jump back and change answers. A ref guards against double submits, since a fast double-click can fire before the disabled state renders. If the server says the email is already registered, I map that error to the field and jump back to the step that contains it. A network error keeps all data and shows a retry message. The draft is saved to sessionStorage without the password."

#### Another worked example
**The review step with edit links:**
```tsx
function ReviewStep({ data, goTo }: StepProps) {
  return (
    <dl className="review">
      <div><dt>Email</dt><dd>{data.account.email}</dd><dd><button type="button" onClick={() => goTo('account')}>Change <span className="visually-hidden">email</span></button></dd></div>
      <div><dt>Name</dt><dd>{data.profile.name}</dd><dd><button type="button" onClick={() => goTo('profile')}>Change <span className="visually-hidden">name</span></button></dd></div>
      {data.profile.type === 'business' && (
        <div><dt>Company</dt><dd>{data.company.name}</dd><dd><button type="button" onClick={() => goTo('company')}>Change <span className="visually-hidden">company</span></button></dd></div>
      )}
    </dl>
  );
}
```
Each "Change" button has hidden text so screen reader users hear "Change email" rather than three identical "Change" buttons. A nice touch: after editing from review, the Next button can say "Back to review" and return directly.

#### A third worked example
**With React Hook Form and Zod.** In a real codebase, I'd use one `useForm` instance for the whole wizard with a Zod schema per step:
```ts
const schemas = { account: AccountSchema, profile: ProfileSchema, company: CompanySchema };
const form = useForm<Data>({ resolver: zodResolver(FullSchema), mode: 'onTouched', shouldUnregister: false });
async function next() {
  const ok = await form.trigger(fieldsOf(step.id)); // validate only this step's fields
  if (ok) setIndex((i) => i + 1);
}
```
`shouldUnregister: false` keeps values of unmounted steps. `trigger` with a field list validates just the current step. Server errors go in with `form.setError('account.email', { message })`. The architecture stays the same: one form, steps as views over it.

#### Step-by-step framework
1. **Clarify** steps, conditional steps, persistence, URL sync, jump-back rules.
2. **Model one data object** and steps as configuration with validators.
3. **Render the current step** inside a form whose submit means Next.
4. **Validate per step on Next**, never on Back; show and focus errors.
5. **Add the step indicator** with `aria-current="step"` and jump-back for completed steps.
6. **Manage focus** on step change.
7. **Submit**: re-validate all, guard double submits, loading, map server errors to steps, retry on failure.
8. **Persist drafts** (minus secrets) and **test** navigation, validation and submit paths.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Separate state per step, lost on Back | One data object; steps are views |
| Validates on Back, or never | Validates current step on Next; all steps before submit |
| Errors appear while typing the first character | Shown after touch or a Next attempt |
| Focus stays on a removed button | Focus moves to the new step heading |
| Double-click creates two accounts | Ref guard plus disabled button |
| Server errors shown as a generic alert | Mapped to fields and the right step |

#### Useful phrases
- "It's one form with several views, not several forms."
- "Back is free; Next has to earn it."
- "Steps are data, so conditional steps are just a filter."
- "When the step changes, I tell assistive tech by moving focus to the heading."

#### Common pitfalls
- **Losing data** when a step unmounts (local state inside step components).
- Index-based navigation breaking when a **conditional step** appears or disappears.
- **Not re-validating** before final submit.
- Saving **passwords or payment data** in localStorage drafts.
- **Browser Back** leaving the whole wizard if the step isn't in the URL (decide and say which behaviour you want).
- Native browser validation bubbles conflicting with custom errors (use `noValidate` and handle it yourself).

#### Follow-ups to expect (with sample answers)
- **"How would you sync steps with the URL?"** — "Store the step id in the query string and push a history entry on Next, so browser Back goes to the previous step. On load, if the URL points to a step whose earlier steps aren't valid, redirect to the first invalid step."
- **"How would you test it?"** — "RTL: try Next with empty fields and assert errors and focus; fill and advance; Back keeps values; choosing business shows the Company step; MSW returns a 409 for the email and the test asserts we're back on Account with the error."
- **"Where should validation live?"** — "Shared schemas (Zod) used on the client for fast feedback and on the server as the source of truth. The client never replaces server validation."
- **"How would you handle a step that needs async validation, like checking a username?"** — "Debounced async check on blur, with a pending state that blocks Next until it resolves, and cancellation if the value changes."
- **"How do you show progress for long wizards?"** — "A step list with names rather than just a percentage, completed markers, and 'Step 3 of 6' in the heading."

#### What senior interviewers look for
- **Single source of truth** and configuration-driven steps.
- **Thoughtful validation timing** and server error handling.
- **Accessibility of dynamic content**: focus management and step indicators.
- **Robust async**: double submits, failure recovery, drafts.

#### Practise it
- Build a three-step wizard with a conditional step in 45 minutes.
- Add URL sync and test browser Back behaviour.
- Checklist: one data object · steps as config · Next validates current step · Back keeps data · conditional steps by filter · focus heading on change · `aria-current="step"` · re-validate before submit · double-submit guard · server errors mapped to steps · draft without secrets.

#### Variations you might be asked
- "Build a checkout flow with shipping, payment and review steps."
- "Build an onboarding flow where later steps depend on earlier answers."
- "How would you let users save a long application and come back later?"

## Build a comment thread with nested replies
- id: 1d0f1319-8db9-4fcb-9881-156ab3cd50d9
- roles: frontend, fullstack, ai
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, recursion

### Prompt
Build a comment thread with nested replies in React, like Reddit or Hacker News. Users can reply to any comment, replies are indented under their parent, threads can be collapsed, and new comments appear immediately. Discuss how you'd store the data and handle very deep or very large threads.

### Answer
#### What the interviewer is really testing
- **Data modelling**: flat list with `parentId` vs nested tree, and converting between them efficiently.
- **Recursive rendering** in React, and its limits (depth, performance).
- **State updates** in a tree: adding a reply, editing, deleting, collapsing, without deep mutation.
- **Optimistic updates** with rollback, and pagination of replies ("Load 12 more replies").
- **Accessibility** of nested discussions: structure, collapse buttons, focus after posting.

#### Key points
- **Clarify:** max depth (Reddit caps visual indentation and shows "Continue this thread"), sort order (newest, top), editing/deleting, votes, pagination, real-time updates.
- **Data model:**
  - Store **flat and normalised**: `byId: { [id]: Comment }` and `childrenOf: { [parentId | 'root']: id[] }`. This is what an API usually returns (rows with `parentId`), and updates touch one entry instead of rebuilding the tree.
  - Build a tree only if needed for rendering, in O(n) with a map (not O(n²) nested loops).
- **Rendering:** a recursive `CommentNode` that renders a comment and then its children's ids. Memoize nodes so adding a reply re-renders only the parent's branch.
- **Indentation:** CSS left padding/border per level, capped at a max visual depth (e.g. 6), beyond which replies stop indenting further or show "Continue thread →" linking to a sub-thread view.
- **Collapse:** a `collapsed` set of ids in state (UI state, separate from data); collapsed comments show "[+] author · 14 replies hidden".
- **Replying:** one reply box open at a time (`replyingTo` id); on submit, add optimistically with a temporary id and `pending: true`, call the API, then swap the temp id for the real one, or remove and restore the draft on failure.
- **Deletion:** if a comment has replies, show "[deleted]" placeholder instead of removing it, so the thread stays intact.
- **Large threads:** load top-level comments in pages and replies lazily per branch ("Load 12 more replies"); for huge flat lists, virtualization of a flattened visible tree.
- **Accessibility:** each comment an `article` (or `li` in nested `ul`s, which conveys nesting levels to screen readers); collapse buttons with `aria-expanded` and an accessible name that includes the author; reply textareas labelled "Reply to Ana"; after posting, focus moves to the new comment; timestamps with `<time dateTime>`.
- **Security:** render comment text as text (React escapes it); if Markdown is supported, sanitise and disallow raw HTML.

#### Model answer
"I'd start with the data model, because it decides how hard everything else is. APIs usually return comments as a flat list with a `parentId`. I'd keep them flat and normalised: a map of comments by id, and a map from parent id to an ordered list of child ids, with 'root' for top-level comments. Adding a reply then means inserting one comment and appending one id to its parent's list, without walking or copying a deep tree.

```ts
type Comment = { id: string; parentId: string | null; author: string; body: string; createdAt: string; pending?: boolean; deleted?: boolean };
type Thread = { byId: Record<string, Comment>; childrenOf: Record<string, string[]> };

export function normalise(list: Comment[]): Thread {
  const byId: Thread['byId'] = {};
  const childrenOf: Thread['childrenOf'] = { root: [] };
  for (const c of list) {
    byId[c.id] = c;
    const key = c.parentId ?? 'root';
    (childrenOf[key] ??= []).push(c.id);
  }
  return { byId, childrenOf };
}

export function threadReducer(state: Thread, action: Action): Thread {
  switch (action.type) {
    case 'add': {
      const key = action.comment.parentId ?? 'root';
      return {
        byId: { ...state.byId, [action.comment.id]: action.comment },
        childrenOf: { ...state.childrenOf, [key]: [...(state.childrenOf[key] ?? []), action.comment.id] },
      };
    }
    case 'confirm': { // swap temp id for server id
      const { tempId, comment } = action;
      const key = comment.parentId ?? 'root';
      const { [tempId]: _, ...rest } = state.byId;
      return {
        byId: { ...rest, [comment.id]: comment },
        childrenOf: { ...state.childrenOf, [key]: state.childrenOf[key].map((id) => (id === tempId ? comment.id : id)) },
      };
    }
    case 'remove': {
      const c = state.byId[action.id];
      const key = c.parentId ?? 'root';
      const { [action.id]: _, ...rest } = state.byId;
      return { byId: rest, childrenOf: { ...state.childrenOf, [key]: state.childrenOf[key].filter((id) => id !== action.id) } };
    }
    case 'softDelete':
      return { ...state, byId: { ...state.byId, [action.id]: { ...state.byId[action.id], body: '', deleted: true } } };
  }
}
```

Rendering is naturally recursive: a node renders the comment, then maps over its children's ids and renders a node for each. Nested lists give screen readers the nesting level for free.

```tsx
const MAX_INDENT = 6;

const CommentNode = memo(function CommentNode({ id, depth }: { id: string; depth: number }) {
  const { thread, collapsed, toggle, replyingTo, setReplyingTo, postReply } = useThreadContext();
  const c = thread.byId[id];
  const children = thread.childrenOf[id] ?? [];
  const isCollapsed = collapsed.has(id);
  const total = useMemo(() => countDescendants(thread, id), [thread, id]);

  return (
    <li className={'comment depth-' + Math.min(depth, MAX_INDENT)} id={'comment-' + id}>
      <article aria-labelledby={'meta-' + id}>
        <header id={'meta-' + id}>
          <button
            type="button" aria-expanded={!isCollapsed}
            aria-label={(isCollapsed ? 'Expand' : 'Collapse') + ' comment by ' + c.author}
            onClick={() => toggle(id)}
          >{isCollapsed ? '[+]' : '[–]'}</button>
          <strong>{c.deleted ? '[deleted]' : c.author}</strong> · <time dateTime={c.createdAt}>{timeAgo(c.createdAt)}</time>
          {isCollapsed && total > 0 && <span> · {total} {total === 1 ? 'reply' : 'replies'} hidden</span>}
        </header>
        {!isCollapsed && (
          <>
            <p className={c.pending ? 'pending' : undefined}>{c.deleted ? 'This comment was deleted.' : c.body}</p>
            {!c.deleted && !c.pending && <button type="button" onClick={() => setReplyingTo(id)}>Reply</button>}
            {replyingTo === id && <ReplyBox label={'Reply to ' + c.author} onSubmit={(text) => postReply(id, text)} onCancel={() => setReplyingTo(null)} />}
          </>
        )}
      </article>
      {!isCollapsed && children.length > 0 && (
        depth >= 10
          ? <a href={'?thread=' + id}>Continue this thread →</a>
          : <ul>{children.map((cid) => <CommentNode key={cid} id={cid} depth={depth + 1} />)}</ul>
      )}
    </li>
  );
});
```

Indentation is capped visually at six levels, so deep threads don't squeeze text into a narrow column on mobile, and beyond ten levels I link to a sub-thread view instead of rendering deeper, which also protects against very deep recursion.

Posting a reply is optimistic. I add the comment with a temporary id and a pending flag, so it appears instantly, slightly faded. When the server responds, I swap in the real comment. If it fails, I remove it and put the text back in the reply box with an error, so nothing the user typed is lost.

```ts
async function postReply(parentId: string | null, body: string) {
  const tempId = 'temp-' + crypto.randomUUID();
  dispatch({ type: 'add', comment: { id: tempId, parentId, author: me.name, body, createdAt: new Date().toISOString(), pending: true } });
  setReplyingTo(null);
  try {
    const saved = await api.createComment({ parentId, body });
    dispatch({ type: 'confirm', tempId, comment: saved });
    requestAnimationFrame(() => document.getElementById('comment-' + saved.id)?.querySelector('article')?.focus());
  } catch {
    dispatch({ type: 'remove', id: tempId });
    setReplyingTo(parentId ?? 'root');
    restoreDraft(parentId, body);
  }
}
```

Collapsed state is UI state, kept in a separate set, not mixed into the comment data. And deleting a comment that has replies replaces it with a '[deleted]' placeholder instead of removing it, so its replies don't become orphans."

#### Another worked example
**Building a tree in O(n), if your rendering needs nested objects:**
```ts
function buildTree(list: Comment[]) {
  const nodes = new Map(list.map((c) => [c.id, { ...c, children: [] as any[] }]));
  const roots: any[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) nodes.get(node.parentId)!.children.push(node);
    else roots.push(node); // also catches orphans whose parent was deleted or not loaded
  }
  return roots;
}
```
One pass to index, one pass to attach. The naive version, finding children by filtering the whole list for each comment, is O(n²) and noticeably slow at a few thousand comments. Interviewers often ask for this conversion explicitly.

#### A third worked example
**Large threads: lazy replies and virtualization.** A popular post has 8,000 comments.
- The API returns top-level comments in pages, each with the first 3 replies and a `replyCount`.
- Each branch shows "Load 12 more replies", which fetches that parent's children by cursor and merges them into `byId` and `childrenOf`.
- For virtualization, flatten the visible tree (respecting collapsed nodes) into a list of `{ id, depth }` rows with a depth-first traversal, and virtualize that list with variable heights; indentation comes from `depth`. Recompute the flattened list only when the thread or collapsed set changes.
- Real-time: new comments arriving over WebSockets go through the same `add` action, but are shown with a "3 new replies" indicator rather than shifting content under the reader.

#### Step-by-step framework
1. **Clarify** depth limits, sorting, editing/deleting, pagination, real-time.
2. **Model data flat and normalised**: `byId` and `childrenOf`.
3. **Write a reducer** for add, confirm, remove, soft delete, edit.
4. **Render recursively** with nested lists and memoized nodes.
5. **Add collapse** as separate UI state with hidden-reply counts.
6. **Add replying** with one open reply box and optimistic updates plus rollback.
7. **Handle depth and size**: capped indentation, continue-thread links, lazy reply loading, virtualization.
8. **Accessibility and security**: nested lists, labelled buttons and textareas, focus after posting, escaped text.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Deeply nested state mutated in place | Flat, normalised `byId` + `childrenOf`, immutable reducer |
| O(n²) tree building | O(n) map-based building |
| Unlimited indentation | Capped indentation and continue-thread links |
| Waits for the server before showing a reply | Optimistic insert with temp id, confirm or rollback |
| Deleting removes the whole branch | Soft delete placeholder keeps replies |
| `div` soup, unlabelled "[–]" buttons | Nested lists, `aria-expanded`, "Collapse comment by Ana" |

#### Useful phrases
- "Store flat, render nested."
- "Collapsed is UI state; it doesn't belong in the comment data."
- "Optimistic, with the draft restored if the server says no."
- "Past a certain depth, indentation hurts more than it helps."

#### Common pitfalls
- **Mutating nested arrays** so memoized nodes don't update (or update everything).
- **Index keys** in reply lists, breaking state when replies are inserted.
- Recursion with **no depth limit** on untrusted data (a malicious API response or a cycle could recurse forever; guard against cycles too).
- **Every node subscribing to the whole thread** context, so adding one comment re-renders thousands; split context or use a store with selectors.
- Losing the user's text when a **post fails**.
- Rendering comment HTML with **`dangerouslySetInnerHTML`** without sanitising.

#### Follow-ups to expect (with sample answers)
- **"How would you sort by votes within each level?"** — "Sort each `childrenOf` list by score when loading. With optimistic voting, avoid re-sorting immediately after the user votes, so the comment doesn't jump away from their pointer; re-sort on refresh."
- **"How do you avoid re-rendering the whole thread when one comment changes?"** — "Normalised state means unrelated entries keep their identity. Each node selects only its own comment and children from a store (Zustand or `useSyncExternalStore` selectors), and `memo` stops the rest."
- **"How do you test it?"** — "Unit-test the reducer and tree builder. RTL: reply to a nested comment and assert it appears under the right parent; collapse and assert the count; MSW failure restores the draft."
- **"How would you link to a specific comment?"** — "A URL with the comment id; load that comment's ancestors and the branch around it, expand collapsed ancestors, scroll it into view and highlight it."
- **"What about editing?"** — "An `edit` action that swaps the body for a textarea, saving optimistically with an 'edited' marker, and conflict handling if someone deleted it meanwhile."

#### What senior interviewers look for
- **Normalised data modelling** and efficient tree algorithms.
- **Render performance** awareness for big threads.
- **Optimistic UX** with honest failure handling.
- **Accessibility and security** of user-generated, nested content.

#### Practise it
- Build it from a flat array of 50 comments in 45 minutes, with replies and collapse.
- Generate 5,000 comments and measure; then add memoization or virtualization.
- Checklist: flat normalised state · reducer · O(n) tree build · recursive nested lists · memo · collapse set · single reply box · optimistic add/confirm/rollback · soft delete · capped indent · labelled controls · focus after post.

#### Variations you might be asked
- "Build a file explorer tree with expand/collapse."
- "Build a threaded chat like Slack threads."
- "Convert a flat list with parentId into a tree, and back."

## Build an accessible Tabs component
- id: fe-mc-01
- roles: frontend, fullstack
- round: MACHINE_CODING
- difficulty: easy
- levels:
- tags: component, a11y, tabs, compound components, keyboard navigation

### Prompt
Build a reusable, accessible Tabs component in React. It should follow the WAI-ARIA tabs pattern, support keyboard navigation, work as controlled or uncontrolled, and have an API that's pleasant for other engineers to use.

### Answer
#### What the interviewer is really testing
- Knowing the **WAI-ARIA tabs pattern**: `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`.
- **Roving tabindex** and keyboard behaviour: arrows, Home, End, and automatic vs manual activation.
- **API design**: compound components (`<Tabs><Tabs.List><Tabs.Tab>`) with context, controlled and uncontrolled modes.
- Details like **lazy rendering of panels**, preserving panel state, orientation, and disabled tabs.
- Writing a small component **completely and cleanly**, since it's an easy problem.

#### Key points
- **Semantics:**
  - Container of tabs: `role="tablist"` with an `aria-label` (or `aria-labelledby`), and `aria-orientation="vertical"` if vertical.
  - Each tab: a `button` with `role="tab"`, `aria-selected`, `aria-controls={panelId}`, `id={tabId}`.
  - Each panel: `role="tabpanel"`, `aria-labelledby={tabId}`, `id={panelId}`, `tabIndex={0}` (so keyboard users can reach panel content that has no focusable elements).
- **Keyboard:**
  - Tab moves into the tablist, landing on the **selected** tab only (roving tabindex: selected tab `tabIndex=0`, others `-1`). Tab again moves into the panel.
  - ArrowRight/ArrowLeft move between tabs (Up/Down for vertical), wrapping; Home/End go to the first/last; skip disabled tabs.
  - **Automatic activation** (default): moving focus selects the tab. **Manual activation**: arrows move focus, Enter/Space selects; use when switching panels is slow (data fetching).
  - In RTL, ArrowLeft and ArrowRight swap.
- **API:** compound components share state through context. Support `value`/`onValueChange` (controlled) and `defaultValue` (uncontrolled). Identify tabs by a `value` string rather than index, so reordering or conditional tabs don't break selection.
- **Panels:** render only the active panel (lazy) by default; offer `keepMounted` (render all, hide inactive with `hidden`) to preserve state like scroll position or form input.
- **Ids:** generate with `useId` so multiple Tabs instances don't clash.
- **Don't use tabs for navigation between pages**: if each tab changes the URL, it's a nav with links (`aria-current="page"`), not an ARIA tabs widget.

#### Model answer
"I'd build it as compound components, because that's the most flexible API: consumers compose `Tabs`, `Tabs.List`, `Tabs.Tab` and `Tabs.Panel`, and can put anything in between. State lives in the root and is shared through context. Tabs are identified by a `value` string rather than position, so conditional or reordered tabs don't break selection.

```tsx
type Ctx = { value: string; select: (v: string) => void; baseId: string; activation: 'automatic' | 'manual' };
const TabsContext = createContext<Ctx | null>(null);
const useTabs = () => { const c = useContext(TabsContext); if (!c) throw new Error('Tabs.* must be used inside <Tabs>'); return c; };

function Tabs({ value: controlled, defaultValue, onValueChange, activation = 'automatic', children }: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
  const value = controlled ?? uncontrolled;
  const select = useCallback((v: string) => {
    if (controlled === undefined) setUncontrolled(v);
    onValueChange?.(v);
  }, [controlled, onValueChange]);
  const baseId = useId();
  const ctx = useMemo(() => ({ value, select, baseId, activation }), [value, select, baseId, activation]);
  return <TabsContext.Provider value={ctx}>{children}</TabsContext.Provider>;
}
```

The list handles keyboard navigation for all its tabs, which is simpler than each tab knowing about its siblings. It finds the enabled tabs in DOM order, moves focus, and in automatic mode also selects:

```tsx
function TabList({ label, children, orientation = 'horizontal' }: TabListProps) {
  const { select, activation } = useTabs();
  const ref = useRef<HTMLDivElement>(null);
  function onKeyDown(e: React.KeyboardEvent) {
    const tabs = [...ref.current!.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')];
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i === -1) return;
    const rtl = getComputedStyle(ref.current!).direction === 'rtl';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    let target: number | null = null;
    if (e.key === nextKey) target = (i + 1) % tabs.length;
    else if (e.key === prevKey) target = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = tabs.length - 1;
    if (target === null) return;
    e.preventDefault();
    tabs[target].focus();
    if (activation === 'automatic') select(tabs[target].dataset.value!);
  }
  return (
    <div ref={ref} role="tablist" aria-label={label} aria-orientation={orientation} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

function Tab({ value, disabled, children }: TabProps) {
  const { value: selected, select, baseId } = useTabs();
  const isSelected = value === selected;
  return (
    <button
      type="button" role="tab" id={baseId + '-tab-' + value} data-value={value}
      aria-selected={isSelected} aria-controls={baseId + '-panel-' + value}
      tabIndex={isSelected ? 0 : -1} disabled={disabled}
      onClick={() => select(value)}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, keepMounted = false, children }: TabPanelProps) {
  const { value: selected, baseId } = useTabs();
  const isSelected = value === selected;
  if (!isSelected && !keepMounted) return null;
  return (
    <div role="tabpanel" id={baseId + '-panel-' + value} aria-labelledby={baseId + '-tab-' + value} tabIndex={0} hidden={!isSelected}>
      {children}
    </div>
  );
}

Tabs.List = TabList; Tabs.Tab = Tab; Tabs.Panel = TabPanel;
```

Usage reads naturally:

```tsx
<Tabs defaultValue="overview">
  <Tabs.List label="Project sections">
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="activity">Activity</Tabs.Tab>
    <Tabs.Tab value="settings" disabled={!isAdmin}>Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview"><Overview /></Tabs.Panel>
  <Tabs.Panel value="activity"><Activity /></Tabs.Panel>
  <Tabs.Panel value="settings" keepMounted><SettingsForm /></Tabs.Panel>
</Tabs>
```

The important accessibility details: only the selected tab is in the Tab order, so keyboard users don't have to tab through every tab to reach the content; arrows move between tabs; each tab and panel reference each other with `aria-controls` and `aria-labelledby`; and the panel is focusable so its content is reachable even if it has no links or buttons. If a consumer doesn't provide a `defaultValue`, I'd default to the first tab, which I can do by having tabs register themselves, or by reading the first tab's value in an effect."

#### Another worked example
**Manual activation for expensive panels.** If each panel fetches data, automatic activation fires a request for every tab the user arrows past. With `activation="manual"`, arrows only move focus, and Enter or Space (which trigger the button's click) select. The roving tabindex then needs to follow the *focused* tab rather than the selected one while navigating; track a `focusedValue` in context, set it on focus, and give `tabIndex={0}` to the focused tab, falling back to the selected tab when focus leaves the list.

#### A third worked example
**Tabs synced to the URL.** For a settings page where users share links to "Billing", control the component from the URL:
```tsx
const [params, setParams] = useSearchParams();
<Tabs value={params.get('tab') ?? 'profile'} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
```
Using `replace` avoids filling history with every tab click; use `push` if you want the browser Back button to switch tabs. If each tab is really a separate page with its own route, render a navigation landmark with links and `aria-current="page"` instead of ARIA tabs, because screen reader users expect links to navigate.

#### Step-by-step framework
1. **Clarify**: orientation, activation mode, lazy vs mounted panels, URL sync, disabled tabs.
2. **Design the API**: compound components with context, `value`-based identity, controlled and uncontrolled.
3. **Implement the root** with state and `useId`.
4. **Implement the list** with keyboard navigation (arrows, Home/End, wrap, skip disabled, RTL).
5. **Implement tabs** with roles, `aria-selected`, `aria-controls`, roving tabindex.
6. **Implement panels** with `tabpanel`, `aria-labelledby`, `tabIndex={0}`, lazy or `keepMounted`.
7. **Handle defaults and edge cases**: no default value, removed tabs, all disabled.
8. **Test**: roles and names, arrow navigation, Tab order, controlled mode.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| `div`s with click handlers | `tablist`/`tab`/`tabpanel` with linked ids |
| Every tab is a Tab stop | Roving tabindex; arrows move between tabs |
| Index-based selection | `value`-based identity |
| One giant component with an `items` prop only | Compound components, controlled and uncontrolled |
| Inactive panels always unmounted, losing form state | Lazy by default with a `keepMounted` option |
| Uses tabs for page navigation | Knows when it should be a nav with links |

#### Useful phrases
- "Only the selected tab is in the Tab order; arrows move within the list."
- "Tabs are identified by value, not index, so conditional tabs don't break."
- "Automatic activation by default, manual when switching is expensive."
- "If a tab changes the URL to a new page, it's navigation, not a tab widget."

#### Common pitfalls
- Forgetting **`tabIndex={0}` on panels** with no focusable content.
- **Duplicate ids** across multiple instances; use `useId`.
- Hiding inactive panels with **`display: none` via CSS only** while leaving them in the accessibility tree inconsistently; use `hidden` or unmount.
- Arrow keys that **don't skip disabled tabs**, or a focus trap when all are disabled.
- Switching between **controlled and uncontrolled** after mount.
- Putting **interactive elements inside tabs** (like a close button inside the tab button), which is invalid nesting; place it beside the tab.

#### Follow-ups to expect (with sample answers)
- **"How would you add closable tabs, like a browser?"** — "Put the close button next to the tab, not inside it; support Delete on the focused tab; after closing, select and focus the neighbouring tab."
- **"How would you animate a sliding indicator under the active tab?"** — "Measure the active tab's offset and width (in a layout effect and on resize), set them as CSS variables on an indicator element, and transition `transform` and `width`. Respect reduced motion."
- **"How would you handle overflow with many tabs?"** — "Scroll the tablist horizontally with scroll buttons, keep the focused tab scrolled into view, or move extra tabs into a 'More' menu."
- **"How do you test this?"** — "RTL: `getByRole('tab', { name: 'Activity' })`; `user.tab()` focuses the selected tab; `user.keyboard('{ArrowRight}')` moves selection; the visible panel has the right accessible name via `getByRole('tabpanel', { name: 'Activity' })`."
- **"Why compound components over an `items` array prop?"** — "Compound components let consumers wrap tabs in tooltips, add badges or place panels anywhere, without the component needing a prop for every case. An `items` prop is fine for simple, uniform cases, and you can offer both."

#### What senior interviewers look for
- **Precise ARIA pattern knowledge** and keyboard behaviour.
- **API design taste**: compound components, controlled and uncontrolled, value identity.
- Judgement about **semantics** (tabs vs navigation).
- A finished, **tested** component in limited time.

#### Practise it
- Build it in 30 minutes, then use it with only a keyboard and VoiceOver or NVDA.
- Add manual activation and vertical orientation.
- Checklist: roles and linked ids · roving tabindex · arrows/Home/End with wrap · skip disabled · RTL · panel focusable · lazy/keepMounted · controlled + uncontrolled · `useId` · value identity.

#### Variations you might be asked
- "Build a segmented control (like iOS) with the same keyboard behaviour."
- "Build a radio group with roving tabindex."
- "Build a toolbar component with arrow-key navigation."

## Build an Accordion
- id: fe-mc-02
- roles: frontend, fullstack
- round: MACHINE_CODING
- difficulty: easy
- levels:
- tags: component, a11y, accordion, details summary, animation

### Prompt
Build an Accordion component in React: a list of sections, each with a header that expands or collapses its content. Support single-open mode (opening one closes the others) and multiple-open mode, keyboard access, accessible semantics and a smooth height animation.

### Answer
#### What the interviewer is really testing
- **Semantics**: buttons inside headings, `aria-expanded`, `aria-controls`, region panels, or native `<details>`/`<summary>`.
- **State design** for single vs multiple modes, controlled and uncontrolled.
- **Keyboard behaviour**: native button behaviour, plus optional arrow/Home/End navigation between headers.
- **Animating height** from 0 to auto, which CSS historically couldn't do directly, and doing it without layout jank.
- Small details: `hidden="until-found"` so browser find-in-page can open sections, focus not lost, reduced motion.

#### Key points
- **Two approaches:**
  1. **Native `<details>`/`<summary>`**: built-in toggle, keyboard and semantics, zero JavaScript. The `name` attribute (newer browsers) makes a group exclusive, giving single-open mode natively. Styling the marker and animating are a little fiddlier.
  2. **Custom WAI-ARIA accordion**: what interviews usually want.
- **Custom structure per item:**
  ```
  <h3><button aria-expanded="false" aria-controls="panel-1" id="header-1">Shipping</button></h3>
  <div id="panel-1" role="region" aria-labelledby="header-1" hidden>…</div>
  ```
  - The **button inside a heading** gives keyboard access, button semantics and a place in the document outline. The heading level should fit the page.
  - `role="region"` is useful for a few panels; avoid it for long lists of panels (too many landmarks).
- **State:**
  - Store **open values as a set/array** of item values: single mode keeps at most one; multiple mode toggles membership.
  - `collapsible` option in single mode: whether clicking the open item closes it.
  - Controlled (`value`, `onValueChange`) and uncontrolled (`defaultValue`).
- **Keyboard:** Enter/Space come for free with `button`. Optional: ArrowDown/ArrowUp move focus between headers, Home/End to first/last.
- **Animation options:**
  - CSS grid trick: animate `grid-template-rows` from `0fr` to `1fr` on a wrapper; the child has `overflow: hidden`. Smooth, no measuring.
  - Measure `scrollHeight` and animate `height` from 0 to that value, then set `auto` on `transitionend`.
  - Newer CSS: `interpolate-size: allow-keywords` lets you transition to `height: auto` directly (progressive enhancement).
  - Respect `prefers-reduced-motion`.
- **Hidden content:** `hidden` removes it from the accessibility tree and find-in-page; `hidden="until-found"` (supported in Chromium) keeps it searchable and fires `beforematch` so you can open the panel when the browser finds text inside.

#### Model answer
"I'd mention first that native `<details>` and `<summary>` give an accordion with no JavaScript, keyboard support included, and the `name` attribute even makes a group exclusive in modern browsers. For a design-system component with controlled state and animation, I'd build the ARIA pattern instead, which is what I'll do here.

Each item is a heading containing a button, and a panel. The button has `aria-expanded` and `aria-controls`; the panel is labelled by the button. State lives in the root as a list of open item values, which handles both modes: single mode replaces the list, multiple mode toggles membership.

```tsx
type Mode = 'single' | 'multiple';
type Ctx = { open: string[]; toggle: (v: string) => void; baseId: string; headingLevel: 2 | 3 | 4 };
const AccordionCtx = createContext<Ctx | null>(null);
const ItemCtx = createContext<string>('');

function Accordion({ type = 'single', collapsible = true, value, defaultValue = [], onValueChange, headingLevel = 3, children }: AccordionProps) {
  const [inner, setInner] = useState<string[]>(defaultValue);
  const open = value ?? inner;
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback((v: string) => {
    const isOpen = open.includes(v);
    let next: string[];
    if (type === 'single') next = isOpen ? (collapsible ? [] : open) : [v];
    else next = isOpen ? open.filter((x) => x !== v) : [...open, v];
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }, [open, type, collapsible, value, onValueChange]);

  function onKeyDown(e: React.KeyboardEvent) {
    const headers = [...rootRef.current!.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]:not([disabled])')];
    const i = headers.indexOf(document.activeElement as HTMLButtonElement);
    if (i === -1) return;
    const map: Record<string, number> = { ArrowDown: (i + 1) % headers.length, ArrowUp: (i - 1 + headers.length) % headers.length, Home: 0, End: headers.length - 1 };
    if (e.key in map) { e.preventDefault(); headers[map[e.key]].focus(); }
  }

  return (
    <AccordionCtx.Provider value={{ open, toggle, baseId, headingLevel }}>
      <div ref={rootRef} className="accordion" onKeyDown={onKeyDown}>{children}</div>
    </AccordionCtx.Provider>
  );
}

function AccordionItem({ value, title, disabled, children }: ItemProps) {
  const { open, toggle, baseId, headingLevel } = useContext(AccordionCtx)!;
  const isOpen = open.includes(value);
  const H = ('h' + headingLevel) as 'h3';
  const headerId = baseId + '-h-' + value, panelId = baseId + '-p-' + value;
  return (
    <ItemCtx.Provider value={value}>
      <div className="accordion-item" data-state={isOpen ? 'open' : 'closed'}>
        <H className="accordion-heading">
          <button
            type="button" id={headerId} data-accordion-trigger
            aria-expanded={isOpen} aria-controls={panelId} disabled={disabled}
            onClick={() => toggle(value)}
          >
            <span>{title}</span>
            <svg aria-hidden="true" className="chevron" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" /></svg>
          </button>
        </H>
        <div id={panelId} role="region" aria-labelledby={headerId} className="accordion-panel" inert={!isOpen}>
          <div className="accordion-panel-inner">{children}</div>
        </div>
      </div>
    </ItemCtx.Provider>
  );
}
Accordion.Item = AccordionItem;
```

For animation, I'd use the CSS grid technique, which animates to the content's natural height without measuring anything in JavaScript:

```css
.accordion-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 200ms ease; }
.accordion-item[data-state='open'] .accordion-panel { grid-template-rows: 1fr; }
.accordion-panel-inner { overflow: hidden; min-height: 0; }
.chevron { transition: transform 200ms; }
.accordion-item[data-state='open'] .chevron { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) { .accordion-panel, .chevron { transition: none; } }
```

Because the panel stays in the DOM while collapsed (so it can animate), I mark it `inert` when closed. That removes its links and inputs from the Tab order and hides it from assistive technology, which `hidden` would normally do. In React 19 the `inert` prop accepts a boolean; in older versions you pass an empty string or set it via a ref.

The heading level is a prop, because an accordion inside a section with an `h2` needs `h3` headers to keep the document outline correct. Arrow keys between headers are optional in the ARIA pattern, but cheap to add at the root."

#### Another worked example
**The native version, with exclusive mode:**
```html
<details name="faq" open>
  <summary>What's your returns policy?</summary>
  <p>You can return items within 30 days…</p>
</details>
<details name="faq">
  <summary>Do you ship internationally?</summary>
  <p>Yes, to over 40 countries…</p>
</details>
```
Same `name` means opening one closes the others (supported in current Chrome, Safari and Firefox; older browsers degrade to multiple-open). Find-in-page automatically opens a closed `<details>` containing the match. To animate, use `::details-content` with `interpolate-size` where supported, or accept no animation. For many FAQ pages this is the best answer: fewer bugs, less code.

#### A third worked example
**Measured-height animation, for when you need precise control:**
```tsx
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    if (open) {
      el.style.height = el.scrollHeight + 'px';
      const done = () => { el.style.height = 'auto'; };
      el.addEventListener('transitionend', done, { once: true });
    } else {
      el.style.height = el.scrollHeight + 'px';  // from auto to a fixed number first
      el.getBoundingClientRect();                  // force reflow so the browser sees the start value
      el.style.height = '0px';
    }
  }, [open]);
  return <div ref={ref} style={{ overflow: 'hidden', height: open ? undefined : 0, transition: 'height 200ms ease' }} inert={!open}>{children}</div>;
}
```
The trick is that you can't transition to or from `auto`, so you convert to pixel heights at the start and back to `auto` at the end (so the panel can grow if its content changes). The forced reflow line is necessary, otherwise the browser batches both height changes and nothing animates. The grid technique avoids all of this.

#### Step-by-step framework
1. **Clarify**: single or multiple, collapsible, animation, heading level, find-in-page.
2. **Mention native `<details>`** and when it's enough.
3. **Design state** as a list of open values, controlled and uncontrolled.
4. **Build items**: heading > button with `aria-expanded`/`aria-controls`, labelled panel.
5. **Add keyboard extras**: arrows, Home, End across headers.
6. **Animate height** with the grid trick (or measurement), with reduced motion support.
7. **Hide closed content properly**: `inert` or `hidden`, consider `until-found`.
8. **Test**: toggling, single-mode exclusivity, keyboard, roles and names.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Clickable `div` headers | Button inside a heading with `aria-expanded` and `aria-controls` |
| Separate boolean per item, mode logic scattered | One open-values list handles single and multiple |
| `max-height: 1000px` hack | Grid `0fr`/`1fr` or measured height to auto |
| Collapsed links still reachable by Tab | `inert` or `hidden` on closed panels |
| Never mentions `<details>` | Knows native details/summary and the `name` attribute |
| Fixed `h3` everywhere | Configurable heading level |

#### Useful phrases
- "A heading containing a button gives me semantics, keyboard support and the outline."
- "Single and multiple modes are the same state: a list of open values."
- "You can't transition to `auto`, so I use the grid trick."
- "If it doesn't need custom behaviour, `<details>` is the better accordion."

#### Common pitfalls
- The **`max-height` hack**: wrong timing (animates over 1000px even for small content) and clipping when content is taller.
- **Collapsed content still focusable** when hidden only visually.
- Putting **interactive elements inside the header button** (invalid nesting).
- **Too many `region` landmarks** in long FAQ lists; drop `role="region"` beyond a handful.
- Losing **find-in-page**: closed panels with `hidden` can't be found by Ctrl+F; consider `until-found` or native details.
- Animating `height` on **huge content** causing jank; keep content light or skip the animation.

#### Follow-ups to expect (with sample answers)
- **"Accordion or tabs?"** — "Tabs suit a few parallel views where one is shown at a time, typically on wider screens. Accordions suit longer lists, mobile, and cases where users may want several sections open or want to scan all headings."
- **"How do you deep-link to an open section?"** — "Use the item value in the URL hash; on load, open that item and scroll its header into view. Update the hash when sections open, with `replaceState`."
- **"How do you test it?"** — "RTL: `getByRole('button', { name: 'Shipping' })` has `aria-expanded='false'`; click and assert `true` and that the region with that name is visible; in single mode, opening another closes the first."
- **"What's `hidden='until-found'`?"** — "A value for the `hidden` attribute that keeps content hidden but searchable. When find-in-page matches inside it, the browser fires `beforematch`, and you open the panel in that handler."
- **"How would you make a 'Expand all' button?"** — "In multiple mode, set the open list to all values; label it 'Expand all' or 'Collapse all' depending on state, and place it before the accordion."

#### What senior interviewers look for
- **Semantic HTML first**, ARIA only where needed.
- A **simple, unified state model**.
- **Animation competence** without hacks, and motion sensitivity.
- **Pragmatism** about native elements.

#### Practise it
- Build the custom accordion with the grid animation in 25 minutes; then build the native version and compare.
- Test with keyboard only and with a screen reader; verify closed content isn't reachable.
- Checklist: heading > button · aria-expanded/controls · labelled panel · open-values list · single/multiple/collapsible · controlled + uncontrolled · arrows/Home/End · grid animation · reduced motion · inert closed panels · heading level prop.

#### Variations you might be asked
- "Build an FAQ section that opens the right answer from a URL hash."
- "Build a collapsible sidebar navigation with nested groups."
- "Build a 'Read more' truncation with expand and collapse."

## Build a star rating widget
- id: fe-mc-03
- roles: frontend, fullstack
- round: MACHINE_CODING
- difficulty: easy
- levels:
- tags: component, a11y, forms, radio group, hover state

### Prompt
Build a star rating component in React. Users can hover to preview a rating, click to set it, use the keyboard, and optionally pick half stars. There should also be a read-only mode for displaying an average rating like 4.3. Make it accessible and usable inside forms.

### Answer
#### What the interviewer is really testing
- Choosing the **right semantics**: an interactive rating is a **radio group** (one choice from N); a display rating is just text or an image with a label.
- **Hover preview vs committed value** as separate state, and restoring on mouse leave.
- **Keyboard support** that comes for free with native radio inputs (arrows) rather than reinventing it.
- **Half stars and fractional display** (4.3 shown as partially filled) with CSS clipping.
- Form integration: `name`, controlled/uncontrolled, `required`, clearing a rating.

#### Key points
- **Clarify:** max stars (5), half steps, can the user clear their rating, read-only display with fractions, size, labels ("Terrible" to "Excellent"), form submission.
- **Semantics (interactive):** a `fieldset` with a `legend` ("Rate this product"), containing **native radio inputs** visually hidden, each with a label containing a star icon and visually hidden text ("3 stars"). Native radios give arrow-key navigation, one Tab stop, form submission and screen reader announcements ("3 stars, radio button, 3 of 5") for free.
  - Alternative: a custom `role="radiogroup"` with `role="radio"` elements, `aria-checked` and a roving tabindex; more code for the same result.
  - Another valid alternative: `role="slider"` with `aria-valuenow`, `aria-valuetext="3 out of 5 stars"`; reasonable but less familiar for ratings.
- **Semantics (read-only):** not interactive, so no radios; render stars `aria-hidden` plus visually hidden text "Rated 4.3 out of 5", or `role="img"` with `aria-label`.
- **State:** `value` (committed) and `hover` (preview, or null). The displayed fill is `hover ?? value`. Clear hover on `mouseleave` of the whole group (not each star, to avoid flicker between stars).
- **Half stars:** two hit areas per star (left half = n - 0.5), or compute from pointer position: `x < rect.width / 2`. With native radios, render 10 radios for 5 stars (values 0.5 to 5).
- **Fractional display:** a row of empty stars with a row of filled stars on top, clipped to `value / max * 100%` width (`overflow: hidden` on the overlay), or a CSS `linear-gradient` mask per star.
- **Clearing:** clicking the current value again sets it to 0 (if allowed), or provide a "Clear" button; a radio group can't normally be unchecked, so handle it explicitly.
- **Visual details:** focus ring visible on the star group (`:focus-visible` on the hidden input styles the label); `:hover` styles; colour plus shape (not colour alone) for filled vs empty; touch targets at least 24 to 44px.

#### Model answer
"An interactive star rating is really a choice of one value out of five, so semantically it's a radio group. I'll build it from native radio inputs, visually hidden, with the stars as their labels. That gives me arrow-key navigation, a single Tab stop, form submission with a `name`, and correct screen reader announcements without writing any keyboard code. The read-only display is a separate, much simpler component, because displaying 4.3 stars isn't interactive at all.

```tsx
type RatingProps = {
  name: string; label: string; max?: number; step?: 1 | 0.5;
  value?: number; defaultValue?: number; onChange?: (v: number) => void;
  allowClear?: boolean; required?: boolean; labels?: string[];
};

export function StarRating({ name, label, max = 5, step = 1, value: controlled, defaultValue = 0, onChange, allowClear = true, required, labels }: RatingProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  const id = useId();
  const options = Array.from({ length: max / step }, (_, i) => (i + 1) * step);

  function set(v: number) {
    if (controlled === undefined) setInner(v);
    onChange?.(v);
  }

  return (
    <fieldset className="rating" onMouseLeave={() => setHover(null)}>
      <legend>{label}</legend>
      <div className="stars">
        {options.map((v) => {
          const inputId = id + '-' + v;
          const half = step === 0.5 && v % 1 !== 0;
          const text = v + (v === 1 ? ' star' : ' stars') + (labels ? ', ' + labels[Math.ceil(v) - 1] : '');
          return (
            <Fragment key={v}>
              <input
                type="radio" className="visually-hidden" id={inputId} name={name} value={v}
                checked={value === v} required={required}
                onChange={() => set(v)}
                onClick={() => { if (allowClear && value === v) set(0); }}
              />
              <label
                htmlFor={inputId}
                className={'star' + (half ? ' half' : '') + (display >= v ? ' filled' : '')}
                onMouseEnter={() => setHover(v)}
              >
                <span className="visually-hidden">{text}</span>
                <StarIcon aria-hidden="true" />
              </label>
            </Fragment>
          );
        })}
      </div>
      <p className="rating-caption" aria-hidden="true">{display ? (labels?.[Math.ceil(display) - 1] ?? display + ' / ' + max) : 'No rating'}</p>
    </fieldset>
  );
}
```

The fill shown is the hover preview if there is one, otherwise the committed value. I clear the hover on `mouseleave` of the whole group rather than each star, so moving between stars doesn't flicker back to the committed value.

Clearing is the one thing native radios don't do: once a radio is checked, clicking it again doesn't uncheck it. So I handle a click on the already-selected value as 'clear' when `allowClear` is on. A click on a different value fires `onChange` as usual.

For half stars, I render ten radios for five stars, and style each half label as the left or right half of a star using CSS clipping:

```css
.stars { display: inline-flex; }
.star { position: relative; width: 28px; height: 28px; cursor: pointer; color: var(--star-empty); }
.star.filled { color: var(--star-filled); }
.star.half { width: 14px; overflow: hidden; }              /* left half of a star */
.star.half + input + .star { width: 14px; overflow: hidden; }
.star.half + input + .star svg { margin-left: -14px; }      /* right half shows the right side */
input:focus-visible + .star { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 4px; }
.star svg { width: 28px; height: 28px; fill: currentColor; stroke: var(--star-outline); }
```

The focus ring appears on the label of the focused radio via `:focus-visible`, so keyboard users can see where they are. The empty stars have an outline, so filled versus empty isn't communicated by colour alone.

The read-only version is just an image with a text alternative:

```tsx
export function RatingDisplay({ value, max = 5, count }: { value: number; max?: number; count?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="rating-display" role="img" aria-label={'Rated ' + value.toFixed(1) + ' out of ' + max + (count ? ', ' + count + ' reviews' : '')}>
      <span className="stars-empty" aria-hidden="true">{'★'.repeat(max)}</span>
      <span className="stars-filled" aria-hidden="true" style={{ width: pct + '%' }}>{'★'.repeat(max)}</span>
    </span>
  );
}
// .rating-display { position: relative; display: inline-block; }
// .stars-filled { position: absolute; inset: 0 auto 0 0; overflow: hidden; white-space: nowrap; color: var(--star-filled); }
```

The filled row sits on top of the empty row and is clipped to 86% for a 4.3 rating, so the fifth star appears partly filled."

#### Another worked example
**A custom `role="radiogroup"` version, if the interviewer insists on no native inputs:**
```tsx
<div role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}>
  {[1, 2, 3, 4, 5].map((v) => (
    <span
      key={v} role="radio" aria-checked={value === v}
      aria-label={v + (v === 1 ? ' star' : ' stars')}
      tabIndex={value === v || (value === 0 && v === 1) ? 0 : -1}
      onClick={() => set(v)} ref={(el) => (refs.current[v] = el)}
    >★</span>
  ))}
</div>
// onKeyDown: ArrowRight/ArrowUp -> min(5, value + 1), ArrowLeft/ArrowDown -> max(1, value - 1),
// Home -> 1, End -> 5; select and move focus together; Space selects the focused star.
```
It works, but you've re-implemented roving tabindex, arrow handling, RTL reversal and form submission (needing a hidden input) that native radios provide. Saying this out loud shows good judgement.

#### A third worked example
**Rating in a review form with React Hook Form.**
```tsx
<Controller
  name="rating" control={control} rules={{ min: { value: 1, message: 'Choose a rating' } }}
  render={({ field, fieldState }) => (
    <>
      <StarRating name={field.name} label="Your rating" value={field.value} onChange={field.onChange}
        labels={['Terrible', 'Poor', 'Okay', 'Good', 'Excellent']} />
      {fieldState.error && <p role="alert">{fieldState.error.message}</p>}
    </>
  )}
/>
```
Descriptive labels ("Good") help users understand what each value means, and are announced alongside the star count. Make sure the error message is associated with the fieldset (`aria-describedby`) so it's read when the user returns to the group.

#### Step-by-step framework
1. **Clarify**: max, half steps, clearing, read-only fractions, labels, form usage.
2. **Choose semantics**: native radios in a fieldset for input; `role="img"` with a label for display.
3. **Model state**: committed value and hover preview; controlled and uncontrolled.
4. **Render radios and star labels** with hidden text.
5. **Add hover preview** with group-level mouse leave.
6. **Handle clearing** explicitly; add half stars if needed.
7. **Style**: visible focus, colour plus outline, touch target size, RTL check.
8. **Build the read-only display** with clipped overlay; test both.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Clickable spans with no roles | Native radios in a fieldset with a legend |
| Custom keyboard code (or none) | Arrow keys and single Tab stop from native radios |
| Hover state overwrites the value | Separate hover preview restored on group mouse leave |
| Read-only display uses disabled radios | `role="img"` with "Rated 4.3 out of 5" |
| Can't clear a rating | Click-again-to-clear or a Clear button |
| Colour-only filled state, no focus ring | Outline plus colour, `:focus-visible` ring on labels |

#### Useful phrases
- "An interactive rating is a radio group; a displayed rating is an image with alt text."
- "Native radios give me keyboard support and form submission for free."
- "The preview is separate state, so the committed value is never lost."
- "4.3 stars is just two rows of stars with the top one clipped to 86%."

#### Common pitfalls
- Hiding radios with **`display: none`**, which removes them from keyboard and screen readers; use a visually-hidden class.
- **Flicker** from per-star `mouseleave` resetting hover.
- Each star a **separate Tab stop**.
- Using the interactive component (disabled) to **display averages**, announcing confusing "radio button, dimmed" to screen readers.
- **Floating-point keys** for half values (`0.5 * 3`) producing odd ids; build values from integers.
- Ignoring **RTL**: native radios reverse arrow direction appropriately; custom code must handle it.

#### Follow-ups to expect (with sample answers)
- **"How would you support touch dragging to choose a rating?"** — "Pointer events on the group: on `pointermove` with the pointer down, compute the value from the x position relative to the group width, snapping to the step, and commit on `pointerup`. Keep the radios for keyboard and screen readers."
- **"How do you test it?"** — "RTL: `getByRole('radio', { name: /3 stars/ })`, click it, assert `onChange(3)` and that it's checked; `user.keyboard('{ArrowRight}')` moves to 4; the display component is found by `getByRole('img', { name: 'Rated 4.3 out of 5' })`."
- **"Why not a slider?"** — "A slider works and is announced as a range, which suits continuous values. Ratings are a small set of discrete options, which users and screen readers recognise more easily as radio buttons."
- **"How would you show the distribution of ratings?"** — "A small bar chart per star level with counts, each row as a link that filters reviews; text alternatives like '5 stars: 62%'."
- **"How do you prevent layout shift when stars are icons?"** — "Fixed width and height on each star, inline SVG rather than a web font that loads late."

#### What senior interviewers look for
- **Semantics chosen deliberately**, with native elements preferred.
- Clean separation of **preview and value**, and of **input vs display** components.
- **Accessibility details**: legend, hidden text, focus visibility, non-colour cues.
- **Form readiness**: name, required, clearing, library integration.

#### Practise it
- Build both components in 25 minutes; then add half stars.
- Test with keyboard only and a screen reader; check the announcements make sense.
- Checklist: fieldset + legend · native radios visually hidden · hidden star text · hover preview with group leave · clear behaviour · half steps · focus-visible ring · non-colour cue · read-only `role="img"` · clipped fractional display.

#### Variations you might be asked
- "Build a thumbs up/down feedback control."
- "Build a 1–10 NPS score selector."
- "Build an emoji reaction picker."

## Build a file uploader with progress and retry
- id: fe-mc-04
- roles: frontend, fullstack
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, file upload, XMLHttpRequest, progress, drag and drop, concurrency

### Prompt
Build a file uploader in React. Users can pick files or drag and drop them, each file shows upload progress, failed uploads can be retried, uploads can be cancelled, and at most three upload at the same time. Validate file type and size before uploading.

### Answer
#### What the interviewer is really testing
- Knowing that **`fetch` can't report upload progress** (in most browsers), so you use `XMLHttpRequest` and `xhr.upload.onprogress`.
- A **per-file state machine**: queued, uploading, done, error, cancelled, with progress.
- A **concurrency-limited queue**: start the next file when one finishes.
- **Cancellation and retry** done cleanly, without leaking requests.
- **Input UX and accessibility**: a real file input, a keyboard-accessible drop zone, validation messages, progress announced accessibly.

#### Key points
- **Clarify:** single or multiple files? Max size and allowed types? Upload endpoint (direct to our API, or presigned URLs to S3)? Concurrency? Auto-start or an Upload button? Resume large files?
- **State per file:**
  ```
  { id, file, status: 'queued' | 'uploading' | 'done' | 'error' | 'cancelled', progress: 0..1, error?, url? }
  ```
  Keep the `XMLHttpRequest` objects in a ref map (`id → xhr`), not in state, since they're not rendered.
- **Upload with progress:** `xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(e.loaded / e.total)`; `onload` checks `xhr.status`; `onerror`/`ontimeout` for network failures; `xhr.abort()` to cancel. Send `FormData` or the raw file.
- **Queue:** after any status change, count uploading files; while fewer than the limit, start the next queued one. Put this in an effect that runs when the list changes, so it's declarative.
- **Validation before upload:** check `file.size` and `file.type` (and extension, because `type` can be empty or spoofed); show per-file errors immediately; never trust client checks (the server validates too).
- **Retry:** set the file back to `queued` with progress 0; the queue picks it up. Optional automatic retry with exponential backoff for network errors (not for 4xx).
- **Picking files:**
  - A real `<input type="file" multiple accept="image/*,.pdf">`, visually styled via its label; works with keyboard and screen readers.
  - Drop zone: `onDragOver` with `preventDefault` (and `dropEffect = 'copy'`), `onDrop` reads `e.dataTransfer.files`. Highlight on drag enter; use a counter to avoid flicker from child `dragleave` events.
  - Prevent the browser from opening the file if dropped outside the zone (`window` `dragover`/`drop` `preventDefault`).
- **Accessibility:** each file row with name, size, and a `<progress>` element (or `role="progressbar"` with `aria-valuenow`) labelled by the file name; a polite live region announcing "photo.jpg uploaded" or "photo.jpg failed"; Cancel and Retry buttons with names including the file ("Retry photo.jpg").
- **Previews:** `URL.createObjectURL(file)` for image thumbnails, with `URL.revokeObjectURL` on removal or unmount.

#### Model answer
"I'd confirm the limits first: multiple files, images and PDFs, up to 10MB each, three concurrent uploads, uploads start automatically, and a `POST /api/uploads` endpoint. Then I'd note one important detail: `fetch` doesn't give upload progress events in most browsers, so I'll use `XMLHttpRequest`, whose `upload.onprogress` event reports bytes sent.

Each file gets an entry with a status and progress. The XHR objects live in a ref, because they aren't rendered and I need them to cancel.

```tsx
type Status = 'queued' | 'uploading' | 'done' | 'error' | 'cancelled';
type Item = { id: string; file: File; status: Status; progress: number; error?: string };

const MAX = 10 * 1024 * 1024;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const LIMIT = 3;

function validate(file: File): string | null {
  if (!ACCEPT.includes(file.type)) return 'Only PNG, JPEG, WebP and PDF files are allowed';
  if (file.size > MAX) return 'Files must be 10 MB or smaller';
  return null;
}

export function Uploader({ endpoint = '/api/uploads' }: { endpoint?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const xhrs = useRef(new Map<string, XMLHttpRequest>());
  const [announcement, setAnnouncement] = useState('');

  const patch = (id: string, p: Partial<Item>) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...p } : it)));

  function addFiles(files: FileList | File[]) {
    const next = [...files].map((file) => {
      const error = validate(file);
      return { id: crypto.randomUUID(), file, status: error ? 'error' : 'queued', progress: 0, error } as Item;
    });
    setItems((list) => [...list, ...next]);
  }

  function start(item: Item) {
    const xhr = new XMLHttpRequest();
    xhrs.current.set(item.id, xhr);
    xhr.open('POST', endpoint);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) patch(item.id, { progress: e.loaded / e.total }); };
    xhr.onload = () => {
      xhrs.current.delete(item.id);
      if (xhr.status >= 200 && xhr.status < 300) { patch(item.id, { status: 'done', progress: 1 }); setAnnouncement(item.file.name + ' uploaded'); }
      else { patch(item.id, { status: 'error', error: 'Upload failed (' + xhr.status + ')' }); setAnnouncement(item.file.name + ' failed'); }
    };
    xhr.onerror = () => { xhrs.current.delete(item.id); patch(item.id, { status: 'error', error: 'Network error' }); setAnnouncement(item.file.name + ' failed'); };
    const body = new FormData();
    body.append('file', item.file);
    xhr.send(body);
    patch(item.id, { status: 'uploading', progress: 0 });
  }

  // The queue: whenever the list changes, fill free slots with queued items
  useEffect(() => {
    const active = items.filter((i) => i.status === 'uploading').length;
    items.filter((i) => i.status === 'queued').slice(0, LIMIT - active).forEach(start);
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => xhrs.current.forEach((x) => x.abort()), []);

  const cancel = (id: string) => { xhrs.current.get(id)?.abort(); xhrs.current.delete(id); patch(id, { status: 'cancelled' }); };
  const retry = (id: string) => patch(id, { status: 'queued', progress: 0, error: undefined });
  const remove = (id: string) => { cancel(id); setItems((l) => l.filter((i) => i.id !== id)); };

  return (
    <div className="uploader">
      <DropZone onFiles={addFiles} />
      <ul className="upload-list">
        {items.map((it) => (
          <li key={it.id} className={'upload ' + it.status}>
            <span id={'name-' + it.id}>{it.file.name}</span> <span>{formatBytes(it.file.size)}</span>
            {(it.status === 'uploading' || it.status === 'queued') && (
              <progress aria-labelledby={'name-' + it.id} max={1} value={it.status === 'queued' ? undefined : it.progress} />
            )}
            {it.status === 'error' && <span role="status">{it.error}</span>}
            {it.status === 'uploading' && <button onClick={() => cancel(it.id)}>Cancel <span className="visually-hidden">{it.file.name}</span></button>}
            {(it.status === 'error' || it.status === 'cancelled') && !validate(it.file) && (
              <button onClick={() => retry(it.id)}>Retry <span className="visually-hidden">{it.file.name}</span></button>
            )}
            {it.status !== 'uploading' && <button onClick={() => remove(it.id)}>Remove <span className="visually-hidden">{it.file.name}</span></button>}
          </li>
        ))}
      </ul>
      <div aria-live="polite" className="visually-hidden">{announcement}</div>
    </div>
  );
}
```

The queue is declarative: an effect looks at the list after every change and starts queued items while fewer than three are uploading. Because `start` immediately marks the item as uploading, the next run of the effect sees the updated count, so it never over-starts. Retry just sets the item back to queued, and the queue takes care of it.

Validation runs when files are added, so invalid files show an error straight away and are never uploaded. Retry isn't offered for files that failed validation, because retrying won't help. The server validates again, of course.

A queued item shows an indeterminate `<progress>` (no value). Buttons include the file name as hidden text, so a screen reader user hears 'Retry photo.jpg' rather than five identical 'Retry' buttons. A live region announces completions and failures, rather than every progress update, which would be overwhelming.

The drop zone wraps a real file input, so it works with the keyboard and screen readers:

```tsx
function DropZone({ onFiles }: { onFiles: (f: FileList) => void }) {
  const [over, setOver] = useState(false);
  const depth = useRef(0); // dragenter/leave fire for children too
  return (
    <label
      className={'dropzone' + (over ? ' over' : '')}
      onDragEnter={(e) => { e.preventDefault(); depth.current++; setOver(true); }}
      onDragLeave={() => { if (--depth.current === 0) setOver(false); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={(e) => { e.preventDefault(); depth.current = 0; setOver(false); onFiles(e.dataTransfer.files); }}
    >
      <input type="file" multiple accept={ACCEPT.join(',')} className="visually-hidden"
        onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ''; }} />
      <span>Drag files here or <u>browse</u></span>
      <span className="hint">PNG, JPEG, WebP or PDF, up to 10 MB</span>
    </label>
  );
}
```

Resetting `e.target.value` lets the user pick the same file again after removing it. The depth counter stops the highlight flickering when dragging over child elements."

#### Another worked example
**Direct-to-S3 uploads with presigned URLs.** For large files you don't want them going through your app server.
1. Client asks the API for an upload URL: `POST /api/uploads { name, type, size }` returns `{ uploadUrl, fileId }`. The server validates type and size and signs a URL that expires in minutes.
2. Client `PUT`s the file to `uploadUrl` with XHR (progress still works) and `Content-Type` set to the signed type.
3. Client confirms: `POST /api/uploads/:fileId/complete`. The server verifies the object exists (and may scan it for malware) before marking it usable.
For files over ~100MB, use **multipart uploads**: split with `file.slice(start, end)` into 5 to 10MB chunks, upload chunks in parallel with their own retries, and complete with the list of part ETags. A failed chunk retries alone, and uploads can resume after a refresh if you store the upload id.

#### A third worked example
**Automatic retry with backoff for transient failures.**
```ts
function scheduleRetry(item: Item & { attempts?: number }) {
  const attempts = (item.attempts ?? 0) + 1;
  if (attempts > 3) return patch(item.id, { status: 'error', error: 'Upload failed after 3 attempts' });
  const delay = Math.min(30000, 1000 * 2 ** attempts) * (0.5 + Math.random() / 2); // jittered backoff
  patch(item.id, { status: 'error', error: 'Retrying in ' + Math.round(delay / 1000) + 's…' });
  setTimeout(() => patch(item.id, { status: 'queued', attempts } as Partial<Item>), delay);
}
```
Only retry automatically on network errors, timeouts and 5xx/429 responses; 4xx errors like 413 (too large) or 415 (unsupported type) won't succeed on retry. Jitter prevents many clients retrying at the same moment. Clear pending timers on unmount.

#### Step-by-step framework
1. **Clarify** file limits, endpoint style, concurrency, auto-start, resumability.
2. **Model per-file state** and keep XHRs in a ref.
3. **Build file selection**: real input plus drop zone with `preventDefault`s and a drag counter.
4. **Validate** type and size on add.
5. **Upload with XHR** for progress; handle load, error, abort.
6. **Add the concurrency queue** as an effect over the list.
7. **Add cancel, retry and remove**, plus cleanup on unmount.
8. **Accessibility and polish**: labelled progress, live announcements, named buttons, previews with revoke.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| `fetch` with fake progress | XHR `upload.onprogress` (or explains fetch's limits) |
| All files upload at once | Concurrency-limited queue |
| No way to cancel | `xhr.abort()` with state update and unmount cleanup |
| Retry re-implements upload logic | Retry sets status to queued; queue handles it |
| Drop zone only, no input | Real file input inside the drop zone |
| Only checks `file.type` on the client | Type, extension and size on client, re-validated on server |

#### Useful phrases
- "Fetch can't tell me upload progress in most browsers, so I'll use XHR here."
- "The queue is just an effect: fill free slots with queued files."
- "Retry means 'put it back in the queue'."
- "Client validation is for fast feedback; the server is the real gate."

#### Common pitfalls
- Forgetting **`preventDefault` on `dragover`**, so `drop` never fires and the browser opens the file.
- **Flickering highlight** from `dragleave` on children.
- Storing **XHR objects in state**.
- Not resetting the **input value**, so selecting the same file again does nothing.
- **Leaking object URLs** for previews.
- Announcing **every progress tick** to screen readers.

#### Follow-ups to expect (with sample answers)
- **"Can fetch report upload progress?"** — "Not reliably: streaming request bodies with `ReadableStream` and `duplex: 'half'` exist in Chromium, but only over HTTP/2+ and not in all browsers, and you'd count bytes yourself. XHR is still the practical choice for upload progress."
- **"How do you handle very large files and flaky networks?"** — "Chunked or multipart uploads with per-chunk retries, and resumable protocols like tus, storing the upload id so a refresh can continue."
- **"How do you test it?"** — "Unit-test the queue logic. For the component, mock XHR (or use MSW, which can simulate upload progress in newer versions), drop files with `user.upload`, assert three uploading and the rest queued, fail one and retry it."
- **"How would you show overall progress?"** — "Sum loaded bytes across files divided by total bytes, rather than averaging percentages, so big files weigh more."
- **"What about security?"** — "Validate on the server, scan for malware, store uploads on a separate domain or bucket, set `Content-Disposition: attachment` for non-images, and never trust the file name."

#### What senior interviewers look for
- **Platform knowledge** (XHR progress, drag-and-drop quirks, object URLs).
- **Clean async orchestration**: queue, cancel, retry, cleanup.
- **Scalability thinking**: presigned URLs, multipart, resumability.
- **Accessibility and security** considered without prompting.

#### Practise it
- Build it in 45 minutes against a local server that randomly fails 20% of uploads and throttles speed.
- Add presigned URL support and chunked upload for files over 50MB.
- Checklist: XHR progress · per-file state · XHRs in ref · concurrency queue · cancel/retry/remove · unmount cleanup · validation · real input + drop zone · drag counter · labelled progress · live announcements · revoke object URLs.

#### Variations you might be asked
- "Build an avatar uploader with crop and preview."
- "Build a resumable upload for 5GB video files."
- "Design the backend and frontend for a Dropbox-style upload."

## Build an image carousel
- id: fe-mc-05
- roles: frontend, fullstack
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, carousel, a11y, touch, autoplay, lazy loading

### Prompt
Build an image carousel in React. It shows one slide at a time with previous/next buttons and dot indicators, supports swiping on touch devices, optionally autoplays, loops from the last slide to the first, and lazy-loads images. It must be accessible.

### Answer
#### What the interviewer is really testing
- **Core state and transitions**: current index, wrapping, animating with `transform` rather than layout properties.
- **Touch and pointer handling**: swipe detection with thresholds, following the finger, not breaking vertical scrolling.
- **Autoplay done responsibly**: pause on hover, focus and hidden tabs, a visible pause control, respect reduced motion (WCAG 2.2.2).
- **Accessibility pattern** for carousels: labelled region, slide labels ("3 of 5"), live region only when not autoplaying, inactive slides hidden.
- **Performance**: lazy-loading images, reserving space to avoid layout shift, prioritising the first slide.
- Knowing the **CSS scroll-snap alternative** and its trade-offs.

#### Key points
- **Clarify:** number of slides, autoplay and interval, loop, show multiple slides per view, thumbnails, captions, swipe required.
- **Two implementation approaches:**
  1. **Transform track:** all slides in a flex row; move the track with `transform: translateX(-index * 100%)` and a CSS transition. Full control over looping and autoplay.
  2. **CSS scroll snap:** a horizontally scrollable container with `scroll-snap-type: x mandatory`; native swipe, momentum and keyboard scrolling; buttons call `scrollTo`/`scrollIntoView`. Less JavaScript; looping is harder.
- **State:** `index`, `paused`, drag offset during a swipe. Wrapping: `next = (i + 1) % n`, `prev = (i - 1 + n) % n`.
- **Swipe (pointer events):** on `pointerdown` record the start x/y and capture the pointer; on `pointermove` set a drag offset (translate the track by `-index * width + dx`); decide early whether the gesture is horizontal (if |dy| > |dx|, release and let the page scroll); on `pointerup`, go next/prev if |dx| exceeds a threshold (e.g. 20% of width, or a fast flick by velocity), otherwise snap back. `touch-action: pan-y` lets the browser handle vertical scrolling.
- **Autoplay:** interval advancing the index; pause on `mouseenter`, `focusin`, `visibilitychange` hidden, and when the user interacts; a visible Pause/Play button as the first control; no autoplay if `prefers-reduced-motion: reduce`. WCAG requires a way to pause anything that moves automatically for more than 5 seconds.
- **ARIA (WAI-ARIA carousel pattern):**
  - Container: `section` with `aria-roledescription="carousel"` and `aria-label="Featured products"`.
  - Each slide: `role="group"`, `aria-roledescription="slide"`, `aria-label="3 of 5"`.
  - Inactive slides: `inert` (or `aria-hidden` plus no focusable children), so links in hidden slides can't be tabbed to.
  - Slide container `aria-live="polite"` when not autoplaying; `aria-live="off"` while autoplaying (otherwise constant announcements).
  - Dots as buttons: "Go to slide 3", with `aria-current="true"` (or `aria-disabled`) for the active one.
  - Images need meaningful `alt` text.
- **Images:** `loading="lazy"` for slides after the first; preload neighbours of the current slide; `fetchpriority="high"` on the first slide (it may be the LCP image); fixed `aspect-ratio` on the viewport to avoid layout shift; `srcset`/`sizes` for responsive images.

#### Model answer
"I'd confirm one slide per view, loop, autoplay every 5 seconds but off for reduced-motion users, dots and arrows, swipe on touch. I'll use the transform approach for full control, and mention scroll snap as the lighter alternative.

The structure is a viewport with `overflow: hidden` and a fixed aspect ratio, containing a flex track of slides each 100% wide. Moving between slides changes the track's `translateX`, which animates on the compositor, so it stays smooth.

```tsx
export function Carousel({ slides, label, interval = 5000 }: { slides: Slide[]; label: string; interval?: number }) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hovering, setHovering] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null);

  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);
  const autoplaying = !paused && !hovering && dragX === null;

  useEffect(() => {
    if (!autoplaying) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), interval);
    return () => clearInterval(t);
  }, [autoplaying, interval, n]);

  useEffect(() => {
    const onVis = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY, axis: null };
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = start.current; if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.axis && Math.abs(dx) + Math.abs(dy) > 8) {
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.axis === 'x') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (s.axis === 'x') setDragX(dx);
  }
  function onPointerUp() {
    const width = viewportRef.current!.clientWidth;
    if (dragX !== null && Math.abs(dragX) > width * 0.2) go(index + (dragX < 0 ? 1 : -1));
    setDragX(null); start.current = null;
  }

  const offset = 'calc(' + -index * 100 + '% + ' + (dragX ?? 0) + 'px)';
  return (
    <section aria-roledescription="carousel" aria-label={label} className="carousel"
      onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovering(false); }}>
      <div className="carousel-controls">
        <button onClick={() => setPaused((p) => !p)}>{paused ? 'Play' : 'Pause'} <span className="visually-hidden">slideshow</span></button>
        <button aria-label="Previous slide" onClick={() => go(index - 1)}>‹</button>
        <button aria-label="Next slide" onClick={() => go(index + 1)}>›</button>
      </div>
      <div ref={viewportRef} className="carousel-viewport"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className="carousel-track" aria-live={autoplaying ? 'off' : 'polite'}
          style={{ transform: 'translateX(' + offset + ')', transition: dragX === null ? 'transform 300ms ease' : 'none' }}>
          {slides.map((s, i) => (
            <div key={s.id} role="group" aria-roledescription="slide" aria-label={(i + 1) + ' of ' + n}
              className="carousel-slide" inert={i !== index}>
              <img src={s.src} srcSet={s.srcSet} sizes="(max-width: 768px) 100vw, 768px" alt={s.alt}
                loading={Math.abs(i - index) <= 1 || i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined} draggable={false} />
              {s.caption && <p className="caption">{s.caption}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="carousel-dots">
        {slides.map((s, i) => (
          <button key={s.id} aria-label={'Go to slide ' + (i + 1)} aria-current={i === index || undefined} onClick={() => go(i)} />
        ))}
      </div>
    </section>
  );
}
```

```css
.carousel-viewport { overflow: hidden; aspect-ratio: 16 / 9; touch-action: pan-y; }
.carousel-track { display: flex; height: 100%; will-change: transform; }
.carousel-slide { flex: 0 0 100%; }
.carousel-slide img { width: 100%; height: 100%; object-fit: cover; user-select: none; }
@media (prefers-reduced-motion: reduce) { .carousel-track { transition: none !important; } }
```

Some choices to point out. Autoplay is derived: it runs only when not paused, not hovered, not focused and not being dragged, so all of those pause it with one effect. Reduced-motion users start paused, and a hidden tab pauses it. The Pause button is the first control, because WCAG requires a way to stop moving content.

For swiping, I wait until the gesture has moved 8 pixels to decide its direction. If it's mostly vertical, I don't capture the pointer, so the page scrolls normally; `touch-action: pan-y` tells the browser it can handle vertical panning itself. While dragging horizontally, the track follows the finger with the transition disabled; on release, it moves to the next slide if the drag passed 20% of the width, otherwise it snaps back.

For accessibility, the carousel is labelled, each slide announces '3 of 5', inactive slides are `inert` so their links aren't in the Tab order, and the live region is polite only when the user is driving the carousel; during autoplay it's off, otherwise a screen reader would interrupt the user every five seconds.

For performance, the first image gets `fetchpriority="high"` because it's often the page's largest image, neighbours of the current slide load eagerly so the next swipe is instant, and the rest lazy-load. The fixed aspect ratio prevents layout shift."

#### Another worked example
**The CSS scroll-snap version:**
```tsx
function SnapCarousel({ slides }: { slides: Slide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setIndex(Number((e.target as HTMLElement).dataset.i))),
      { root: ref.current, threshold: 0.6 },
    );
    ref.current!.querySelectorAll('[data-i]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [slides]);
  const goTo = (i: number) => (ref.current!.children[i] as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  return (
    <>
      <div ref={ref} className="snap-track" tabIndex={0} aria-label="Gallery">
        {slides.map((s, i) => <img key={s.id} data-i={i} src={s.src} alt={s.alt} loading="lazy" />)}
      </div>
      <button onClick={() => goTo(Math.max(0, index - 1))}>Previous</button>
      <button onClick={() => goTo(Math.min(slides.length - 1, index + 1))}>Next</button>
    </>
  );
}
// .snap-track { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain; }
// .snap-track > img { flex: 0 0 100%; scroll-snap-align: start; }
```
Native momentum swiping, trackpad gestures and keyboard scrolling all work for free, and IntersectionObserver tracks the current slide. Trade-offs: infinite looping needs cloned slides, and autoplay must fight user scrolling. For product galleries, this is often the better choice. Newer CSS (`::scroll-button`, `::scroll-marker`) can even generate the buttons and dots natively in Chromium.

#### A third worked example
**Seamless infinite looping with clones.** With the transform approach, going from the last slide to the first animates backwards across all slides. To loop seamlessly: render a clone of the last slide before the first and a clone of the first after the last (`[last, ...slides, first]`), start at index 1. When the transition ends on a clone, disable the transition and jump to the real slide's index (`onTransitionEnd`), then re-enable on the next frame. Mark clones `aria-hidden` and `inert` so assistive tech sees only the real slides, and keep keys unique (`'clone-' + id`).

#### Step-by-step framework
1. **Clarify** slides per view, loop, autoplay, swipe, captions; mention scroll snap.
2. **Build structure**: labelled section, viewport with aspect ratio, flex track, slides.
3. **Navigation**: index with wrap, prev/next, dots with `aria-current`.
4. **Animate** with `transform` and a transition; reduced motion support.
5. **Add swipe** with pointer events, axis locking, threshold, `touch-action: pan-y`.
6. **Add autoplay** with derived pause conditions and a visible Pause button.
7. **Accessibility**: slide groups with "n of m", `inert` inactive slides, live region policy, alt text.
8. **Performance**: priority first image, eager neighbours, lazy rest, responsive images.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Animates `left` or `margin` | `transform` on the track, compositor-friendly |
| Swipe blocks vertical page scrolling | Axis locking and `touch-action: pan-y` |
| Autoplay with no pause control | Pause button, pauses on hover/focus/hidden, off for reduced motion |
| Links in hidden slides are tabbable | `inert` inactive slides |
| Live region announcing every autoplay change | Polite only when user-driven |
| All images load immediately, or first image lazy | Priority first image, eager neighbours, lazy rest |

#### Useful phrases
- "Anything that moves on its own needs a visible way to pause it."
- "I only take over the gesture once I know it's horizontal."
- "The first slide is probably the LCP image, so it loads with high priority."
- "For a simple gallery, scroll snap gives me native swiping for free."

#### Common pitfalls
- **Interval not cleared** or restarted on every render, causing drift and double speed.
- **Images dragged as ghost images** on desktop (set `draggable={false}`).
- Click handlers on slides firing **after a swipe**; suppress clicks if the drag distance was large.
- **Layout shift** when images load without reserved space.
- Forgetting **RTL**: next should move visually left in right-to-left locales.
- Carousels for **critical content**: many users never see slides beyond the first; say this to the interviewer as a product point.

#### Follow-ups to expect (with sample answers)
- **"How do you show several slides per view on desktop and one on mobile?"** — "Set slide width with a CSS variable per breakpoint (`flex-basis: calc(100% / var(--per-view))`) and move by one slide width; with scroll snap, that's just CSS."
- **"How do you test it?"** — "RTL for buttons, dots and labels; fake timers for autoplay and pause on hover; Playwright for real swipe gestures on a mobile viewport, and a visual check of the transform."
- **"Should carousels autoplay at all?"** — "Research shows low engagement past the first slide, and autoplay causes accessibility problems. I'd default to no autoplay and push back if it's only there to fit more promotions in."
- **"How would you add keyboard arrows?"** — "When focus is inside the carousel, ArrowLeft/ArrowRight call prev/next. The buttons already provide keyboard access, so this is an enhancement."
- **"How do you make thumbnails?"** — "A row of buttons with thumbnail images labelled 'Show image 3', `aria-current` for the active one, scrolling the thumbnail strip to keep the active thumbnail in view."

#### What senior interviewers look for
- **Smooth, correct interaction code** (transform, gestures, cleanup).
- **Accessibility and WCAG awareness** around motion and autoplay.
- **Performance** awareness for images and LCP.
- **Product judgement** about whether a carousel is the right pattern.

#### Practise it
- Build the transform version in 45 minutes; test swiping on a phone and keyboard-only on desktop.
- Build the scroll-snap version and compare code size and feel.
- Checklist: labelled carousel · transform track · wrap · dots with aria-current · swipe with axis lock · touch-action · autoplay with pause control and derived pausing · reduced motion · inert inactive slides · live region policy · image priorities · aspect ratio.

#### Variations you might be asked
- "Build a product image gallery with thumbnails and zoom."
- "Build a horizontally scrolling 'cards' row like Netflix."
- "Build a testimonial slider that autoplays."

## Build a nested checkbox tree
- id: fe-mc-06
- roles: frontend, fullstack
- round: MACHINE_CODING
- difficulty: medium
- levels:
- tags: component, recursion, checkbox, indeterminate, tree, state derivation

### Prompt
Build a nested checkbox tree in React, like a permissions picker or a file selector. Checking a parent checks all its descendants; checking some children puts the parent into an "indeterminate" (partially checked) state; and parents can be expanded and collapsed. The tree can be several levels deep and contain thousands of nodes.

### Answer
#### What the interviewer is really testing
- **State design**: storing only the minimum (checked leaves) and **deriving** parent states, instead of keeping every node's state in sync by hand.
- **Recursion** for rendering and for computing checked/indeterminate states, with sensible performance.
- Knowing that **`indeterminate` is a DOM property**, not an HTML attribute, so it must be set with a ref.
- **Accessibility**: either nested lists of native checkboxes, or the ARIA tree pattern with `aria-checked="mixed"`.
- Scaling to **thousands of nodes**: precomputed indexes, memoization, and virtualization of the flattened visible tree.

#### Key points
- **Clarify:** what's the value (only leaf ids, or also parent ids)? Can parents be selected independently? Expand/collapse? Search/filter? Disabled nodes? Size of tree?
- **Source of truth:** a `Set` of **checked leaf ids**. A parent is:
  - checked if all its leaves are checked,
  - unchecked if none are,
  - indeterminate otherwise.
  Deriving parent state avoids an entire class of sync bugs.
- **Toggling:**
  - Toggle a leaf: add/remove its id.
  - Toggle a parent: if it's fully checked, uncheck all its leaves; otherwise (unchecked or indeterminate) check all its leaves. This matches common UX (indeterminate click → check all).
- **Precompute** for each node its list of leaf ids (one DFS), so toggling a parent and computing its state is fast. Compute all parent states in one post-order traversal per change: O(n).
- **Indeterminate:** `ref.current.indeterminate = state === 'mixed'` in an effect or ref callback; screen readers announce "mixed" / "partially checked". Don't also set `aria-checked` on a native checkbox.
- **Rendering:** recursive `TreeNode` in nested `ul`s; each node has an expand/collapse button with `aria-expanded` (if it has children) and a labelled checkbox.
- **ARIA tree alternative:** `role="tree"`, `role="treeitem"` with `aria-checked` (`true`/`false`/`mixed`), `aria-expanded`, `aria-level`, roving tabindex, arrow keys (Right expands/moves to child, Left collapses/moves to parent, Up/Down move between visible items, Space toggles). More work; native checkboxes in nested lists are simpler and fully accessible.
- **Disabled nodes:** exclude disabled leaves from "check all" and from the "all checked" calculation (or count them as unchanged), and say which you chose.
- **Scaling:** flatten visible nodes (respecting collapsed state) into `{ id, depth }` rows and virtualize; memoize rows; use a `Set` for O(1) membership.

#### Model answer
"The key decision is what to store. If I stored a checked flag on every node, every click would mean updating ancestors and descendants and keeping them consistent, which is where bugs come from. Instead, I store only the set of checked leaf ids, and derive every parent's state: checked if all its leaves are checked, unchecked if none are, and indeterminate otherwise.

I precompute each node's leaf ids once, so toggling a parent and computing its state don't need to walk the tree repeatedly:

```ts
type Node = { id: string; label: string; children?: Node[] };
type CheckState = 'checked' | 'unchecked' | 'mixed';

function indexTree(roots: Node[]) {
  const leavesOf = new Map<string, string[]>();
  const visit = (n: Node): string[] => {
    const leaves = n.children?.length ? n.children.flatMap(visit) : [n.id];
    leavesOf.set(n.id, leaves);
    return leaves;
  };
  roots.forEach(visit);
  return leavesOf;
}

function computeStates(roots: Node[], checked: Set<string>) {
  const states = new Map<string, CheckState>();
  const visit = (n: Node): { all: boolean; some: boolean } => {
    if (!n.children?.length) {
      const on = checked.has(n.id);
      states.set(n.id, on ? 'checked' : 'unchecked');
      return { all: on, some: on };
    }
    let all = true, some = false;
    for (const c of n.children) { const r = visit(c); all &&= r.all; some ||= r.some; }
    states.set(n.id, all ? 'checked' : some ? 'mixed' : 'unchecked');
    return { all, some };
  };
  roots.forEach(visit);
  return states;
}
```

`computeStates` is a single post-order traversal, O(n), and runs in a `useMemo` whenever the checked set changes. For thousands of nodes that's well under a millisecond.

The component holds the checked set and the expanded set, both as state:

```tsx
export function CheckboxTree({ roots, value, onChange, label }: { roots: Node[]; value: string[]; onChange: (leafIds: string[]) => void; label: string }) {
  const leavesOf = useMemo(() => indexTree(roots), [roots]);
  const checked = useMemo(() => new Set(value), [value]);
  const states = useMemo(() => computeStates(roots, checked), [roots, checked]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(roots.map((r) => r.id)));

  const toggle = useCallback((id: string) => {
    const leaves = leavesOf.get(id)!;
    const next = new Set(checked);
    if (states.get(id) === 'checked') leaves.forEach((l) => next.delete(l));
    else leaves.forEach((l) => next.add(l));
    onChange([...next]);
  }, [leavesOf, checked, states, onChange]);

  const toggleExpanded = useCallback((id: string) => setExpanded((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  }), []);

  return (
    <fieldset className="checkbox-tree">
      <legend>{label}</legend>
      <ul>{roots.map((n) => <TreeNode key={n.id} node={n} states={states} expanded={expanded} onToggle={toggle} onExpand={toggleExpanded} />)}</ul>
    </fieldset>
  );
}

const TreeNode = memo(function TreeNode({ node, states, expanded, onToggle, onExpand }: TreeNodeProps) {
  const state = states.get(node.id)!;
  const hasChildren = !!node.children?.length;
  const isOpen = expanded.has(node.id);
  const inputId = 'cb-' + node.id;
  return (
    <li>
      <div className="tree-row">
        {hasChildren
          ? <button type="button" aria-expanded={isOpen} aria-label={(isOpen ? 'Collapse ' : 'Expand ') + node.label} onClick={() => onExpand(node.id)}>{isOpen ? '▾' : '▸'}</button>
          : <span className="tree-spacer" />}
        <input
          type="checkbox" id={inputId}
          checked={state === 'checked'}
          ref={(el) => { if (el) el.indeterminate = state === 'mixed'; }}
          onChange={() => onToggle(node.id)}
        />
        <label htmlFor={inputId}>{node.label}</label>
      </div>
      {hasChildren && isOpen && (
        <ul>{node.children!.map((c) => <TreeNode key={c.id} node={c} states={states} expanded={expanded} onToggle={onToggle} onExpand={onExpand} />)}</ul>
      )}
    </li>
  );
});
```

Two details matter here. First, `indeterminate` can only be set through JavaScript; there's no HTML attribute for it, so I set it in a ref callback whenever the node renders. Browsers then show the dash and screen readers announce 'mixed' or 'partially checked'. I don't add `aria-checked` to a native checkbox, because ARIA rules forbid overriding its native state. Second, clicking an indeterminate parent checks everything below it, which is what users generally expect, and checking a fully checked parent clears its subtree.

I chose native checkboxes in nested lists rather than the ARIA tree pattern. Nested lists already tell screen readers the level and position, checkboxes are announced correctly, and keyboard users get Tab and Space without custom code. The ARIA tree with arrow-key navigation is better for very large trees where tabbing through every checkbox would be tedious; I'd switch to it if the tree had hundreds of visible nodes.

The component's value is the list of checked leaf ids. If the backend needs 'all of Billing' rather than every leaf, I can derive a compact form: walk the tree and emit a parent id when it's fully checked, otherwise recurse."

#### Another worked example
**Compact value for the backend (e.g. permissions).**
```ts
function compact(roots: Node[], states: Map<string, CheckState>): string[] {
  const out: string[] = [];
  const visit = (n: Node) => {
    const s = states.get(n.id);
    if (s === 'checked') out.push(n.id);              // whole subtree selected: store the parent only
    else if (s === 'mixed') n.children?.forEach(visit);
  };
  roots.forEach(visit);
  return out;
}
```
Storing "billing" instead of 40 leaf permissions also means new permissions added under Billing later are included automatically, which may or may not be desired; that's a product decision worth raising.

#### A third worked example
**Search and filter in a large tree.** Filter by label, keeping ancestors of matching nodes so context is visible, and auto-expanding them:
```ts
function filterTree(nodes: Node[], q: string): Node[] {
  return nodes.flatMap((n) => {
    const kids = n.children ? filterTree(n.children, q) : [];
    if (n.label.toLowerCase().includes(q) || kids.length) return [{ ...n, children: n.children ? kids : undefined }];
    return [];
  });
}
```
Decide whether checking a parent while filtered selects all its leaves or only the visible ones; most products select only visible matches and show "12 of 40 selected" to be clear. For thousands of nodes, flatten the visible filtered tree into rows with depth and virtualize, so only ~40 rows render.

#### Step-by-step framework
1. **Clarify** the value shape, parent selection rules, size, search, disabled nodes.
2. **Choose the source of truth**: checked leaf ids in a Set.
3. **Precompute** leaf lists per node.
4. **Derive states** in one post-order traversal with `useMemo`.
5. **Implement toggle** rules for leaves and parents.
6. **Render recursively** with nested lists, expand buttons and labelled checkboxes; set `indeterminate` via ref.
7. **Accessibility**: fieldset/legend, `aria-expanded`, mixed state; consider ARIA tree for large trees.
8. **Scale and extend**: memoization, virtualization, search, compact value.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Stores `checked` on every node and syncs manually | Stores checked leaves; derives parents |
| Recomputes descendants by walking on every check | Precomputed leaf lists, one O(n) state pass |
| Tries `<input indeterminate>` as an attribute | Sets the `indeterminate` property via ref |
| Clicking indeterminate parent does something random | Clear rule: mixed or unchecked → check all |
| Unlabelled arrow icons | Expand buttons with `aria-expanded` and labels |
| Renders 10,000 nodes at once | Flattened visible rows, virtualized |

#### Useful phrases
- "Store the leaves, derive the parents."
- "`indeterminate` is a property, not an attribute, so it needs a ref."
- "Mixed means 'some', and clicking it means 'all'."
- "Nested lists of real checkboxes are accessible out of the box; the ARIA tree is for very large trees."

#### Common pitfalls
- **Inconsistent states** from storing and syncing every node.
- Forgetting **disabled leaves** in the all/some calculation.
- **Recomputing leaf lists** on every render for every node (O(n²)).
- Passing new **`Set` objects** that break memoization unnecessarily; derive once at the top.
- Losing **expanded state** when the tree data refetches (key by id, keep expanded ids).
- Not handling **empty parents** (a group with no children): decide whether it's a leaf.

#### Follow-ups to expect (with sample answers)
- **"How do you handle disabled nodes?"** — "Exclude disabled leaves from what a parent toggles, and compute 'checked' over enabled leaves only, while keeping disabled ones in whatever state they already had. Show the parent as checked when all enabled leaves are on."
- **"How do you test it?"** — "Unit-test `computeStates` and `toggle` with small trees. RTL: check two of three children and assert the parent's checkbox has `indeterminate` set to true (via the DOM property); click the parent and assert all children are checked."
- **"How would lazy-loaded children work?"** — "Unloaded parents have a `hasChildren` flag and load on expand. A parent's state is only known after loading, so treat 'select all' on an unloaded parent as selecting the parent id itself, and resolve it into leaves on the server."
- **"How would you implement keyboard navigation for the ARIA tree?"** — "Roving tabindex over visible items: Up/Down move, Right expands or moves to the first child, Left collapses or moves to the parent, Home/End, Space toggles the check, and typing a letter jumps to the next matching item."
- **"Why not let parents be selected independently of children?"** — "Some products want that, like 'subscribe to the folder', but it makes the meaning of mixed states unclear. If needed, the tree needs two separate concepts: selection of the node and coverage of its children."

#### What senior interviewers look for
- **Derivation over synchronisation** as a principle.
- **Efficient tree algorithms** and memoization.
- **Platform knowledge**: indeterminate property, native semantics vs ARIA tree.
- Thinking about **backend value shape** and product rules.

#### Practise it
- Build it in 40 minutes with a three-level tree; then add search.
- Generate a 5,000-node tree, measure, and add virtualization.
- Checklist: checked leaf set · precomputed leaves · one-pass derived states · clear toggle rules · indeterminate via ref (no aria-checked on native inputs) · nested lists · expand buttons with aria-expanded · disabled handling · compact value · virtualization plan.

#### Variations you might be asked
- "Build a file explorer with folders that expand and a multi-select."
- "Build a 'select all' checkbox for a paginated table."
- "Build a category filter with nested categories for an e-commerce site."
