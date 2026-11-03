# Frontend Engineer — Accessibility

## Accessibility fundamentals: WCAG and POUR
- id: fe-a11y-01
- roles: frontend, fullstack
- round: ACCESSIBILITY
- difficulty: easy
- levels:
- tags: accessibility, WCAG, POUR, inclusive design

### Prompt
What does web accessibility mean, and why does it matter? Explain WCAG, its conformance levels and the four POUR principles, give concrete examples of each, and describe how you build accessibility into a team's everyday workflow.

### Answer
#### What the interviewer is really testing
- Understanding **who accessibility serves** (beyond screen reader users).
- Knowing **WCAG structure**: principles, guidelines, success criteria, A/AA/AAA.
- Concrete, **practical examples** of common failures and fixes.
- Building accessibility into the **process**, not as a final audit.

#### Key points
- Accessibility means people with **disabilities** (visual, hearing, motor, cognitive, temporary or situational) can perceive, understand, navigate and interact with the product.
- Around 1 in 5 people have a disability; accessibility also helps everyone (captions in noisy places, keyboard power users, older users).
- Legal requirements in many places (ADA in the US, European Accessibility Act from 2025, UK Equality Act; public sector rules). **WCAG 2.2 AA** is the common target.
- **POUR**: **Perceivable** (alt text, captions, contrast), **Operable** (keyboard, focus, enough time, no seizures), **Understandable** (clear language, predictable, error help), **Robust** (valid semantics, works with assistive tech).
- Levels: **A** (minimum), **AA** (standard target), **AAA** (enhanced, not required across whole sites).
- Most common failures (WebAIM Million): low contrast, missing alt text, empty links/buttons, missing form labels, missing document language.
- Process: design reviews, semantic components, automated checks (axe) in CI, keyboard and screen reader testing, accessibility in the definition of done.

#### Model answer
"Accessibility means making sure people can use our product regardless of disability, whether that's someone who's blind using a screen reader, someone with a tremor using only a keyboard or switch device, someone with low vision zooming to 400%, someone deaf watching a video, or someone with a cognitive disability filling in a form. It also includes temporary and situational limitations: a broken arm, bright sunlight on a phone, a noisy train.

**Why it matters:**
- **People**: roughly 1 in 5 people have a disability; excluding them is excluding customers.
- **Legal**: the ADA (US), the European Accessibility Act (applying to many digital products and services since June 2025), the UK Equality Act and public sector regulations; WCAG 2.1/2.2 AA is the usual benchmark in lawsuits and procurement.
- **Business and quality**: accessible sites are usually more usable, better for SEO, and more robust.

**WCAG** (Web Content Accessibility Guidelines) is organised as 4 principles → 13 guidelines → testable success criteria, each at level A, AA or AAA. Most organisations target **WCAG 2.2 AA**.

**The four POUR principles with examples:**

**1. Perceivable**: information must be presentable in ways users can perceive.
- Text alternatives: meaningful `alt` text for informative images; `alt=""` for decorative ones.
- Captions and transcripts for audio/video.
- **Colour contrast**: at least 4.5:1 for normal text, 3:1 for large text and UI components/graphics (AA).
- Don't rely on colour alone: error fields need an icon or text, not just a red border; charts need labels or patterns.
- Content reflows at 320 px width / 400% zoom without horizontal scrolling.

**2. Operable**: users must be able to operate the interface.
- Everything works with a **keyboard**; no keyboard traps.
- **Visible focus** indicators (never `outline: none` without a replacement).
- Skip links and logical focus order.
- Enough time: warn before session timeouts and allow extending.
- No content flashing more than three times per second (seizure risk).
- Target size at least 24×24 CSS px (WCAG 2.2), better 44×44 for touch.
- Alternatives to complex gestures (drag-and-drop must have a non-drag alternative, WCAG 2.2).

**3. Understandable**: content and operation must be understandable.
- Page language set (`<html lang="en">`).
- Clear labels and instructions; errors identified in text with suggestions ('Enter a date in the format DD/MM/YYYY').
- Predictable behaviour: no unexpected context changes on focus or input.
- Consistent navigation and help placement across pages (WCAG 2.2).
- Don't require users to re-enter information they've already given (WCAG 2.2 redundant entry).

**4. Robust**: content works reliably with current and future assistive technologies.
- Semantic HTML so roles, names and states are exposed correctly.
- Correct ARIA only when needed; valid relationships (labels, `aria-describedby`).
- Status messages announced (`role="status"`, live regions) without moving focus.

**Most common real-world failures** (from large-scale audits like the WebAIM Million): low-contrast text, missing alt text, empty links and buttons (icon-only with no accessible name), missing form labels, and missing document language. Fixing these alone covers a large share of issues.

**Building it into the workflow:**
1. **Design**: contrast-checked palettes, focus states designed, annotations for headings, landmarks and reading order; accessibility reviews of designs.
2. **Components**: an accessible design system (buttons, dialogs, menus, comboboxes built to ARIA Authoring Practices patterns), so product teams get accessibility by default.
3. **Development**: semantic HTML, ESLint `jsx-a11y`, Testing Library queries by role (which encourages accessible markup).
4. **Automated checks**: axe-core in unit/component tests and Playwright E2E, Lighthouse CI. Automation catches roughly 30–50% of issues.
5. **Manual testing**: keyboard-only pass for every feature, screen reader smoke tests (VoiceOver, NVDA), zoom to 400%.
6. **Definition of done** includes accessibility criteria; periodic audits and, ideally, testing with disabled users.
7. **Accessibility statement** and a way for users to report issues."

#### Another worked example: an inaccessible checkout
"An audit found our checkout failed WCAG AA in several places: the card number field had only a placeholder (no label), errors were shown only in red, the 'Pay' button was a div, and a session timeout logged users out without warning. Fixes: visible labels, text errors linked with `aria-describedby` and an error summary focused on submit, a real `<button>`, and a timeout warning dialog with an 'extend' option. Completion rate for keyboard and screen reader users went from near zero to normal, and overall checkout errors dropped too."

#### A third worked example: shifting left with a design system
"Rather than fixing the same issues in every team, we invested in accessible design system components: Dialog with focus trapping and return focus, Combobox following the ARIA pattern, and form fields that wire up labels, hints and errors automatically. New features built from these components passed audits with far fewer issues, and axe checks in CI caught regressions such as missing labels before merge."

#### Variations you might be asked
- "What changed in WCAG 2.2?": new criteria including focus not obscured, dragging movements, target size (minimum), consistent help, redundant entry, accessible authentication; and 4.1.1 Parsing was removed.
- "What's the difference between accessibility and usability?": accessibility focuses on people with disabilities being able to use the product; usability on how easy it is for everyone; they overlap heavily.
- "How do you prioritise a large backlog of a11y issues?": by severity (blocks a task?), frequency/traffic, and legal risk; fix shared components first.

#### Step-by-step framework
1. **Define accessibility** broadly.
2. **Why it matters** (people, legal, quality).
3. **WCAG structure** and AA target.
4. **POUR with examples.**
5. **Common failures.**
6. **Process**: design, components, automation, manual testing, definition of done.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add alt text" | Broad view of disabilities and situations |
| Doesn't know WCAG levels | WCAG 2.2 AA, principles and criteria |
| Abstract POUR | Concrete examples for each |
| Relies on audits at the end | Built into design, components, CI, definition of done |
| Thinks automation is enough | Knows automation catches only part |

#### Useful phrases
- "Accessibility covers permanent, temporary and situational disabilities."
- "Our target is WCAG 2.2 AA."
- "Automated tools catch maybe a third of issues; keyboard and screen reader testing catch the rest."
- "The design system is where accessibility scales."

#### Common pitfalls
- **Treating accessibility as a final audit.**
- **Removing focus outlines.**
- **Colour-only information.**
- **Over-relying on overlays/widgets** that claim to fix accessibility automatically.

#### Follow-ups to expect (with sample answers)
- **"What do you think of accessibility overlays?"**
  "They don't fix underlying issues and can interfere with assistive technology; many disabled users and experts advise against them. Fix the code instead."
- **"How do you test colour contrast?"**
  "DevTools contrast checker, axe, design tool plugins, and checking all states (hover, disabled, placeholder) and themes."
- **"How do you convince stakeholders to invest?"**
  "Legal risk (EAA, lawsuits), market size, procurement requirements, SEO and quality benefits, and that it's cheaper when built in."

#### What senior interviewers look for
- **Broad, practical understanding.**
- **Concrete criteria knowledge.**
- **Process and culture leadership.**

#### Practise it
1. Audit one page against POUR, listing one issue per principle.
2. Do a keyboard-only and VoiceOver/NVDA pass on a feature you built.
3. Explain POUR with examples, out loud, in 2 minutes.

## ARIA: the rules and when not to use it
- id: fe-a11y-02
- roles: frontend, fullstack
- round: ACCESSIBILITY
- difficulty: medium
- levels:
- tags: ARIA, roles, states, accessible names, live regions

### Prompt
What is ARIA, and what are its rules? Explain roles, states and properties, accessible names (`aria-label`, `aria-labelledby`, `aria-describedby`), live regions, and `aria-hidden`. Give examples of correct ARIA use and common misuse that makes things worse.

### Answer
#### What the interviewer is really testing
- Knowing ARIA **changes semantics only, not behaviour**.
- The **five rules of ARIA use**, especially "no ARIA is better than bad ARIA".
- Computing **accessible names and descriptions** correctly.
- Practical patterns: **toggle buttons, expanded states, live regions, hiding decorative content**.

#### Key points
- **ARIA** (Accessible Rich Internet Applications) adds roles, states and properties to the accessibility tree for custom widgets that HTML can't express.
- **Rule 1**: use native HTML elements/attributes when possible. **Rule 2**: don't change native semantics unnecessarily. **Rule 3**: all interactive ARIA controls must be keyboard operable. **Rule 4**: don't use `role="presentation"` or `aria-hidden="true"` on focusable elements. **Rule 5**: all interactive elements need an accessible name.
- ARIA adds **no behaviour**: `role="button"` doesn't make a div focusable or keyboard-activatable.
- **Roles** (button, dialog, tablist, tab, tabpanel, menu, combobox, alert, status), **states** (`aria-expanded`, `aria-pressed`, `aria-checked`, `aria-selected`, `aria-invalid`, `aria-disabled`, `aria-busy`), **properties** (`aria-controls`, `aria-haspopup`, `aria-describedby`, `aria-live`).
- **Accessible name** order: `aria-labelledby` > `aria-label` > native label (`<label>`, alt, contents) > title.
- **Live regions** (`role="status"`, `role="alert"`, `aria-live="polite"`) announce dynamic updates; the region must exist before content changes.
- `aria-hidden="true"` hides from assistive tech (decorative icons, duplicated content), never on focusable elements.
- Studies show pages with more ARIA tend to have **more** accessibility errors: misuse is common.

#### Model answer
"ARIA lets us describe custom widgets to assistive technology: what something is (role), what state it's in, and how it relates to other elements. But it only changes what's announced; it doesn't add any behaviour. That's why the first rule of ARIA is: if a native HTML element does the job, use it.

**The rules of ARIA use:**
1. Prefer native HTML (`<button>`, `<input type=checkbox>`, `<dialog>`, `<details>`, `<select>`).
2. Don't change native semantics unnecessarily (`<h2 role="button">` is wrong; put a button inside the heading).
3. Interactive ARIA widgets must be fully keyboard operable.
4. Never use `aria-hidden="true"` or `role="presentation"` on focusable elements.
5. Every interactive element must have an accessible name.

**ARIA adds no behaviour:**
```html
<!-- Announced as 'button', but not focusable, Enter/Space do nothing -->
<div role="button" onclick="save()">Save</div>

<!-- To make it work you'd also need: -->
<div role="button" tabindex="0" onclick="save()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();save()}">Save</div>

<!-- Or just: -->
<button type="button" onclick="save()">Save</button>
```

**Accessible names (what a screen reader says for a control):**
```html
<!-- Icon-only button: needs a name -->
<button aria-label="Close dialog"><svg aria-hidden="true">…</svg></button>

<!-- Name from visible text elsewhere -->
<h2 id="billing-title">Billing address</h2>
<section aria-labelledby="billing-title">…</section>

<!-- Description: extra info read after the name -->
<label for="pw">Password</label>
<input id="pw" type="password" aria-describedby="pw-hint pw-error" aria-invalid="true">
<p id="pw-hint">At least 12 characters.</p>
<p id="pw-error">Password is too short.</p>
```
Name computation priority: `aria-labelledby` → `aria-label` → native labelling (`<label>`, `alt`, text content) → `title`. Prefer visible labels (`<label>` or `aria-labelledby`) so sighted and screen reader users get the same name; `aria-label` text also isn't translated by some browser translation tools. WCAG 2.5.3 (label in name) requires the accessible name to include the visible label text, so voice control users can say 'click Search'.

**States that must stay in sync:**
```html
<button aria-expanded="false" aria-controls="filters">Filters</button>
<div id="filters" hidden>…</div>

<button aria-pressed="true">Bold</button>                 <!-- toggle button -->
<li role="option" aria-selected="true">United Kingdom</li> <!-- in a listbox -->
```
When JavaScript opens the panel, it must update `aria-expanded="true"`. Out-of-sync states are worse than none.

**Live regions for dynamic updates:**
```html
<div role="status" aria-live="polite" class="visually-hidden" id="cart-status"></div>
<script>
  // later, after adding to cart:
  document.getElementById('cart-status').textContent = 'Added to basket. 3 items in basket.';
</script>
```
- `role="status"` / `aria-live="polite"`: announced when the user is idle (search result counts, 'Saved').
- `role="alert"` / `aria-live="assertive"`: interrupts immediately; reserve for urgent errors.
- The live region must already be in the DOM before its content changes; inserting a region with text at the same moment often isn't announced.

**aria-hidden:**
```html
<button><svg aria-hidden="true" focusable="false">…</svg> Delete</button>   <!-- icon decorative -->
<span aria-hidden="true">★★★★☆</span><span class="visually-hidden">Rated 4 out of 5</span>
```
Never put `aria-hidden` on something focusable (or a container holding focusable elements): keyboard users could focus an element the screen reader says doesn't exist. For hiding background content behind a modal, use the `inert` attribute (or the native `<dialog>` modal behaviour).

**Common misuse that makes things worse:**
- `role="button"` on links that navigate (should be `<a>`), or `role="link"` on buttons.
- `aria-label` on non-interactive elements like `<div>` or `<span>` (often ignored or inconsistent).
- Redundant roles: `<button role="button">`, `<nav role="navigation">` (harmless but noise), or worse, conflicting ones: `<ul role="menu">` for a site navigation list, which forces menu-style keyboard expectations users won't get.
- `aria-hidden="true"` on the whole page body while a modal is open, accidentally hiding the modal too.
- Using `role="application"`, which disables normal screen reader navigation.
- Adding `aria-live="assertive"` to frequently updating content, constantly interrupting users.

**Where ARIA is genuinely needed:** custom widgets with no native equivalent or where native ones can't be styled sufficiently: tabs, comboboxes/autocomplete, tree views, menus (application-style menus), carousels, toasts/status messages, sortable tables. For these I follow the **WAI-ARIA Authoring Practices Guide** patterns, including expected keyboard interactions, or use well-tested headless libraries (Radix, React Aria, Headless UI)."

#### Another worked example: an icon toolbar with no names
"A text editor toolbar had 15 icon-only buttons with no accessible names; screen readers announced 'button, button, button'. Adding `aria-label`s (with tooltips showing the same text visually), `aria-pressed` for toggle buttons like Bold, and a `role="toolbar"` with arrow-key navigation made it usable. The label text matched the tooltip, satisfying label-in-name for voice control users."

#### A third worked example: announcing search results
"A filterable product list updated results instantly as users changed filters, but screen reader users had no idea anything happened. We added a persistent visually hidden `role="status"` region updated after each change ('24 products found'), debounced so it didn't announce on every keystroke. Users then got feedback without losing their place."

#### Variations you might be asked
- "What's the difference between aria-label and aria-labelledby?": aria-label provides a string directly; aria-labelledby references visible element(s) by ID, keeping visual and accessible names in sync (and translatable).
- "aria-disabled vs disabled?": `disabled` removes the element from tab order and blocks interaction; `aria-disabled="true"` keeps it focusable (useful so users can discover why it's disabled) but you must block activation yourself.
- "What does inert do?": makes a subtree non-focusable, non-clickable and hidden from assistive tech, ideal for background content behind modals.

#### Step-by-step framework
1. **Define ARIA** and that it changes semantics only.
2. **State the rules.**
3. **Accessible names and descriptions.**
4. **States that must stay in sync.**
5. **Live regions and aria-hidden.**
6. **Common misuse** and when ARIA is genuinely needed (APG patterns).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Adds ARIA everywhere | Native HTML first; no ARIA beats bad ARIA |
| role="button" on divs | Real buttons, or full keyboard support |
| aria-label on everything | Prefers visible labels, label-in-name |
| Static aria-expanded | Keeps states in sync |
| aria-hidden on focusables | Uses inert for background content |

#### Useful phrases
- "ARIA changes what's announced, not how it behaves."
- "No ARIA is better than bad ARIA."
- "Every interactive element needs an accessible name, ideally from visible text."
- "Live regions must exist before their content changes."

#### Common pitfalls
- **Missing keyboard support** for ARIA widgets.
- **Out-of-sync states.**
- **Assertive live regions** for routine updates.
- **Wrong widget roles** (menu for navigation).

#### Follow-ups to expect (with sample answers)
- **"How do you check accessible names?"**
  "DevTools Accessibility pane shows the computed name, role and states; axe flags missing names; screen readers confirm."
- **"Should site navigation use role=menu?"**
  "No; menus imply application-style keyboard behaviour. Use a nav landmark with a list of links."
- **"What's the visually-hidden class?"**
  "CSS that hides content visually but keeps it available to screen readers (clip, 1px size), unlike display: none."

#### What senior interviewers look for
- **Restraint and correctness.**
- **Accessible name expertise.**
- **Knowledge of APG patterns.**

#### Practise it
1. Fix an icon-only toolbar with names, pressed states and keyboard support.
2. Add a status live region for search results and test with a screen reader.
3. Explain the five rules of ARIA, out loud.

## Keyboard navigation and focus management
- id: fe-a11y-03
- roles: frontend, fullstack
- round: ACCESSIBILITY
- difficulty: medium
- levels:
- tags: keyboard, focus management, focus trap, tabindex, SPA routing

### Prompt
How do you make a web app fully keyboard accessible? Cover focus order and `tabindex`, visible focus styles, skip links, focus management in modals (trap and return), roving tabindex for composite widgets, and moving focus on route changes in single-page apps.

### Answer
#### What the interviewer is really testing
- Understanding **who relies on keyboard** (screen reader users, motor impairments, power users, switch devices).
- Correct **tabindex** usage and **focus order** principles.
- **Focus management** patterns: modals, menus, dynamic content, SPA navigation.
- **Visible focus** styling with `:focus-visible`.

#### Key points
- Everything interactive must be **reachable and operable by keyboard** (Tab, Shift+Tab, Enter, Space, arrows, Escape).
- **Focus order** should follow a logical reading order, which follows **DOM order**; avoid CSS reordering that breaks it.
- **`tabindex="0"`**: adds a non-interactive element to the tab order (only for custom widgets); **`tabindex="-1"`**: focusable by script, not by Tab; **positive tabindex**: avoid (breaks natural order).
- **Visible focus**: never remove outlines without a replacement; use **`:focus-visible`** so mouse users don't see rings on click while keyboard users do. WCAG 2.2 adds focus not obscured (sticky headers covering focus).
- **Skip link** to main content.
- **Modals**: move focus into the dialog, **trap** Tab within it, close on Escape, **return focus** to the trigger; make background **inert**. Native `<dialog>.showModal()` does most of this.
- **Composite widgets** (tabs, menus, listboxes, grids, toolbars): one Tab stop, arrow keys move within (**roving tabindex** or `aria-activedescendant`).
- **SPA route changes**: move focus to the new page's heading (or main) and announce the title, since there's no page reload.
- **Dynamic content**: when deleting an item, move focus to a sensible next element; don't let focus fall to `<body>`.

#### Model answer
"Keyboard accessibility matters for screen reader users, people with motor disabilities who can't use a mouse, switch-device users, and power users. The goal: every action can be done with the keyboard, focus is always visible, and focus goes somewhere sensible when the UI changes.

**1. Use native interactive elements.** Buttons, links, inputs and selects are focusable and keyboard-operable by default. Most keyboard bugs come from clickable divs.

**2. Focus order and tabindex:**
```html
<div tabindex="0" role="button">…</div>      <!-- only for custom widgets that need focus -->
<h1 tabindex="-1" id="page-title">Orders</h1> <!-- programmatically focusable, not in Tab order -->
<input tabindex="3">                          <!-- avoid: positive values create confusing order -->
```
Focus order follows DOM order, so the DOM should match the visual reading order. CSS `order`, `flex-direction: row-reverse` or absolute positioning can make focus jump around visually.

**3. Visible focus:**
```css
:focus-visible {
  outline: 3px solid var(--focus-ring, #2563eb);
  outline-offset: 2px;
}
/* Don't do this without a replacement: */
/* *:focus { outline: none; } */
```
`:focus-visible` shows the ring for keyboard focus but not usually for mouse clicks, which resolves the designer complaint that led people to remove outlines. Ensure the ring has 3:1 contrast against the background, and that sticky headers/footers don't cover the focused element (`scroll-padding-top` helps).

**4. Skip link:**
```html
<a class="skip-link" href="#main">Skip to main content</a>
…
<main id="main" tabindex="-1">…</main>
```
```css
.skip-link { position: absolute; left: -9999px; }
.skip-link:focus { left: 1rem; top: 1rem; z-index: 1000; }
```
Lets keyboard users bypass repeated navigation on every page.

**5. Modal dialogs:**
- On open: move focus into the dialog (first focusable element, or the dialog heading).
- While open: Tab and Shift+Tab cycle within the dialog (focus trap); background is inert.
- Escape closes.
- On close: return focus to the element that opened it.

Native first:
```html
<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Delete project?</h2>
  <button value="cancel" formmethod="dialog">Cancel</button>
  <button id="confirm-delete">Delete</button>
</dialog>
<script>
  const trigger = document.getElementById('delete-btn');
  const dialog = document.getElementById('confirm');
  trigger.addEventListener('click', () => dialog.showModal());   // focus moves in, background inert, Esc closes
  dialog.addEventListener('close', () => trigger.focus());         // return focus (browsers increasingly do this)
</script>
```
In React, libraries like Radix Dialog or React Aria handle trapping, `inert`, scroll locking and focus return.

**6. Composite widgets: roving tabindex.** A tab list, toolbar or menu should be a single Tab stop; arrow keys move between items:
```tsx
function Tabs({ tabs }: { tabs: { id: string; label: string }[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = tabs.length - 1;
    const next = e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="Account settings">
      {tabs.map((t, i) => (
        <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" id={`tab-${t.id}`}
          aria-selected={i === active} aria-controls={`panel-${t.id}`}
          tabIndex={i === active ? 0 : -1}                 // roving: only active tab is in Tab order
          onClick={() => setActive(i)} onKeyDown={(e) => onKeyDown(e, i)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
```
The alternative, `aria-activedescendant`, keeps focus on a container (like a combobox input) and points to the active option by ID.

**7. SPA route changes.** In a traditional site, a new page load resets focus to the top and screen readers announce the new title. In SPAs, focus stays on the clicked link (which may no longer exist), and nothing is announced. Fix:
```tsx
useEffect(() => {
  document.title = `${pageTitle} – Acme`;
  headingRef.current?.focus();          // h1 with tabIndex={-1}
}, [location.pathname]);
```
Some routers provide built-in route announcers (Next.js has one); moving focus to the h1 also gives screen reader users context.

**8. Dynamic changes:** after deleting a row, move focus to the next row (or the previous, or the list heading if empty); after closing an inline editor, return focus to its trigger; after loading more results, keep focus where it was and announce the count. Never let focus drop to `<body>`.

**Testing:** unplug the mouse and complete every user journey with Tab, Shift+Tab, Enter, Space, arrows and Escape; check focus is always visible and logical; automated tools can't verify this well."

#### Another worked example: lost focus after deleting
"In a task list, deleting a task removed the focused button, and focus jumped to the top of the document. Keyboard users had to tab through the entire navigation again after every deletion. We moved focus to the next task's delete button (or the 'Add task' input if the list became empty) and announced 'Task deleted' in a status region. A small change made the feature usable."

#### A third worked example: modal focus bugs
"A custom modal didn't trap focus: pressing Tab moved into the page behind, and screen reader users could browse background content. It also didn't return focus on close. Switching to the native `<dialog>` with `showModal()` fixed trapping, Escape and background inertness; we added focus return and initial focus on the heading. The bug count for that component went to zero."

#### Variations you might be asked
- "What's a keyboard trap?": a place where focus can enter but not leave with the keyboard (WCAG failure), common with embedded widgets or broken modals.
- "How do you handle focus in infinite scroll?": provide a 'Load more' button or ensure content after the feed is reachable; avoid trapping keyboard users in endless content.
- "Should every element be focusable?": no; only interactive ones. Making static text focusable adds noise to Tab navigation.

#### Step-by-step framework
1. **Native elements** first.
2. **Focus order** and tabindex rules.
3. **Visible focus** with focus-visible.
4. **Skip links.**
5. **Modals and composite widgets** (trap/return, roving tabindex).
6. **SPA route changes and dynamic content**, then keyboard-only testing.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add tabindex to everything" | Native elements; tabindex 0/-1 only when needed |
| Removes outlines | :focus-visible with good contrast |
| Modal without trap/return | Native dialog or tested library; focus return |
| Every tab is a Tab stop | Roving tabindex with arrow keys |
| Ignores SPA navigation | Focus h1 and announce title on route change |

#### Useful phrases
- "Focus order follows the DOM, so the DOM should match the reading order."
- "Composite widgets get one Tab stop; arrow keys move inside."
- "When a modal closes, focus goes back to what opened it."
- "In an SPA, I move focus to the new page heading on navigation."

#### Common pitfalls
- **Positive tabindex values.**
- **Focus lost after DOM removal.**
- **Hover-only menus.**
- **Sticky headers obscuring focused elements.**

#### Follow-ups to expect (with sample answers)
- **"How do you implement a focus trap manually?"**
  "On Tab keydown, find the first and last focusable elements in the dialog; if focus is on the last and Tab is pressed, move to the first (and vice versa with Shift); plus make the background inert."
- **"What's the difference between :focus and :focus-visible?"**
  ":focus matches any focus; :focus-visible matches when the browser determines a focus indicator should be shown, typically keyboard interaction."
- **"How do you test focus management automatically?"**
  "Playwright/Testing Library: press Tab and assert `document.activeElement` or `toHaveFocus()`, e.g. focus returns to the trigger after closing a dialog."

#### What senior interviewers look for
- **Thorough keyboard thinking.**
- **Solid focus management patterns.**
- **Real testing habits.**

#### Practise it
1. Do a keyboard-only pass through an app's main journey and list issues.
2. Implement roving tabindex tabs and a native dialog with focus return.
3. Explain SPA focus management, out loud.

## Accessible forms, labels and error messages
- id: fe-a11y-04
- roles: frontend, fullstack
- round: ACCESSIBILITY
- difficulty: medium
- levels:
- tags: forms, labels, validation, errors, accessibility

### Prompt
How do you build accessible forms? Cover labels, grouping, instructions and hints, required fields, input types and autocomplete, inline validation timing, error messages and error summaries, and how errors are communicated to screen reader users.

### Answer
#### What the interviewer is really testing
- Correct **labelling** and **grouping** techniques.
- Designing **validation and error handling** that works for everyone.
- **Programmatic associations** (`for`/`id`, `aria-describedby`, `aria-invalid`).
- UX judgement: **when to validate**, how to write errors, avoiding frustration (WCAG 2.2 redundant entry, accessible authentication).

#### Key points
- Every input needs a **visible `<label>`** associated via `for`/`id` (or wrapping); **placeholders are not labels**.
- **Group related controls** with `<fieldset>` and `<legend>` (radio groups, address blocks, date parts).
- **Hints** linked with `aria-describedby`; show format requirements **before** users type.
- **Required fields**: `required` attribute and a visible indicator explained once; or mark optional fields instead.
- **Input types** (`email`, `tel`, `number` carefully, `date`) and **`autocomplete`** tokens (`email`, `given-name`, `postal-code`, `one-time-code`, `current-password`, `new-password`) for mobile keyboards, autofill and WCAG 1.3.5.
- **Validation timing**: validate on blur or submit, not on every keystroke while typing; re-validate on input once a field has an error.
- **Errors**: text (not colour alone), specific and helpful, associated with the field via `aria-describedby`, `aria-invalid="true"`.
- On submit with errors: show an **error summary** at the top with links to fields, move focus to it; announce.
- Don't clear fields on error; preserve input; allow password managers and paste (accessible authentication).

#### Model answer
"Forms are where accessibility failures cost the most: if someone can't complete checkout or sign-up, nothing else matters. My checklist covers labels, structure, input help, validation timing and error communication.

**1. Labels: visible and programmatically associated:**
```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email" required>
```
- Clicking the label focuses the input (bigger target).
- Screen readers announce 'Email address, edit text, required'.
- **Placeholders are not labels**: they disappear when typing, often have low contrast, and aren't reliably announced. Use them only for examples, if at all.

**2. Grouping with fieldset and legend:**
```html
<fieldset>
  <legend>Delivery method</legend>
  <label><input type="radio" name="delivery" value="standard" checked> Standard (3–5 days)</label>
  <label><input type="radio" name="delivery" value="express"> Express (next day)</label>
</fieldset>

<fieldset>
  <legend>Date of birth</legend>
  <label for="dob-day">Day</label> <input id="dob-day" inputmode="numeric" autocomplete="bday-day">
  <label for="dob-month">Month</label> <input id="dob-month" inputmode="numeric" autocomplete="bday-month">
  <label for="dob-year">Year</label> <input id="dob-year" inputmode="numeric" autocomplete="bday-year">
</fieldset>
```
Screen readers announce the legend with each option ('Delivery method, Standard, radio button, 1 of 2').

**3. Hints and requirements up front:**
```html
<label for="pw">Create a password</label>
<p id="pw-hint">At least 12 characters. Use a mix of words you'll remember.</p>
<input id="pw" type="password" autocomplete="new-password" aria-describedby="pw-hint" required>
```
Tell people the rules before they fail them.

**4. Input types and autocomplete:**
- `type="email"`, `type="tel"`, `inputmode="numeric"` for numeric codes (avoid `type="number"` for things like card numbers or postcodes: it allows 'e', strips leading zeros and scroll-wheel changes values).
- `autocomplete` tokens let browsers and password managers fill fields, reducing effort for everyone and satisfying WCAG 1.3.5 (identify input purpose). `one-time-code` enables SMS code autofill.

**5. Required and optional:**
- Use the `required` attribute (announced) plus a visible indicator. GOV.UK's approach is to mark optional fields '(optional)' instead, since most fields should be required.

**6. Validation timing:**
- Don't show errors while someone is still typing their email ('Invalid email' after the first letter is hostile).
- Validate a field **on blur** (when leaving) or on **submit**; once a field has shown an error, re-validate **as they type** so the error clears as soon as it's fixed.
- Always validate on the server too; client validation is UX, not security.

**7. Error messages: specific, in text, associated:**
```html
<label for="postcode">Postcode</label>
<input id="postcode" name="postcode" autocomplete="postal-code"
       aria-invalid="true" aria-describedby="postcode-error">
<p id="postcode-error" class="field-error">
  <span aria-hidden="true">⚠</span> Enter a postcode, like SW1A 1AA
</p>
```
- Not colour alone: icon plus text.
- Helpful wording: say what's wrong and how to fix it ('Enter a date in the past', not 'Invalid input').
- `aria-invalid="true"` marks the field; `aria-describedby` makes the error read when the field is focused.

**8. On submit with errors: error summary and focus:**
```tsx
function ErrorSummary({ errors }: { errors: { field: string; message: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (errors.length) ref.current?.focus(); }, [errors]);
  if (!errors.length) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" aria-labelledby="error-summary-title" className="error-summary">
      <h2 id="error-summary-title">There is a problem</h2>
      <ul>
        {errors.map((e) => <li key={e.field}><a href={`#${e.field}`}>{e.message}</a></li>)}
      </ul>
    </div>
  );
}
```
Focusing the summary tells screen reader users what went wrong; links jump to each field. Also update the page `<title>` ('Error: Checkout – Acme') for context. For short forms, focusing the first invalid field directly is fine.

**9. Don't punish users:**
- Keep entered values after errors (including on server-side validation).
- Don't block paste in password or confirmation fields; support password managers (WCAG 2.2 accessible authentication).
- Don't ask for the same information twice in one process (WCAG 2.2 redundant entry): offer 'same as delivery address'.
- Give enough time; warn before session expiry and save progress for long forms.
- Disabled submit buttons are problematic (users don't know why); prefer enabled buttons that show errors on submit.

**10. Status after submission:** announce success ('Your changes have been saved') via a status region or by moving focus to a confirmation heading."

#### Another worked example: a sign-up form redesign
"A sign-up form validated on every keystroke, showed errors only as red borders, disabled the submit button until valid, and blocked paste into 'confirm password'. Completion rates were low across all users, and screen reader users couldn't complete it at all. We moved validation to blur/submit, added text errors linked with aria-describedby, an error summary on submit, removed the confirm field (with a 'show password' toggle instead), allowed paste and added autocomplete tokens. Completion rose by 18% overall."

#### A third worked example: server-side errors in a React form
"A payment form showed server errors ('Card declined') in a toast that disappeared after 3 seconds and wasn't announced. We mapped server errors to fields where possible (e.g. postcode mismatch), showed general payment errors in a persistent alert at the top that received focus, and kept all entered data. Support tickets about 'the form just did nothing' stopped."

#### Variations you might be asked
- "How do you build an accessible custom select or date picker?": prefer native controls; otherwise follow ARIA APG patterns (combobox, dialog grid) with full keyboard support, or use a tested headless library.
- "Should errors use role=alert per field?": usually not for each field (too noisy); use aria-describedby for field errors and one alert/summary on submit.
- "What about multi-step forms?": show progress ('Step 2 of 4'), move focus to each step's heading, allow going back without losing data.

#### Step-by-step framework
1. **Visible, associated labels.**
2. **Grouping with fieldset/legend.**
3. **Hints, input types, autocomplete, required indicators.**
4. **Validation timing.**
5. **Error messages and summary with focus.**
6. **Don't punish users**; announce success.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Placeholders as labels | Visible associated labels |
| Red borders only | Text errors with icons, aria-describedby, aria-invalid |
| Validates every keystroke | Blur/submit, then live re-validation |
| Disabled submit button | Error summary with focus on submit |
| Blocks paste, clears fields | Preserves input, supports password managers |

#### Useful phrases
- "Placeholders disappear; labels don't."
- "I validate when someone leaves a field, not while they're typing."
- "On submit, focus moves to an error summary that links to each field."
- "autocomplete tokens help everyone and satisfy WCAG's input purpose rule."

#### Common pitfalls
- **Missing labels** on icon or search inputs.
- **Hostile real-time validation.**
- **Unannounced errors.**
- **type=number for codes and card numbers.**

#### Follow-ups to expect (with sample answers)
- **"How do you label a search input with no visible label?"**
  "Use a visually hidden label or aria-label, plus a search landmark (`<search>` element or role=search) and a visible search button."
- **"How do you mark required fields accessibly?"**
  "The required attribute, plus a visible asterisk explained at the top, or '(optional)' on optional fields."
- **"How do React form libraries help?"**
  "React Hook Form and similar manage validation timing and errors; I still wire up labels, aria-invalid and aria-describedby (often in a shared Field component)."

#### What senior interviewers look for
- **End-to-end form accessibility.**
- **User-centred validation UX.**
- **Reusable field components.**

#### Practise it
1. Build a Field component that wires label, hint, error, aria-invalid and aria-describedby automatically.
2. Add an error summary with focus management to a form.
3. Explain good validation timing, out loud.

## Building an accessible custom component (tabs or combobox)
- id: fe-a11y-05
- roles: frontend, fullstack
- round: ACCESSIBILITY
- difficulty: hard
- levels:
- tags: combobox, autocomplete, ARIA patterns, keyboard, components

### Prompt
Build an accessible autocomplete (combobox) component. Explain the ARIA roles and attributes, keyboard interactions, focus handling with `aria-activedescendant`, announcing results, mouse and touch behaviour, and how you'd test it. When would you use a library instead?

### Answer
#### What the interviewer is really testing
- Knowledge of the **WAI-ARIA Authoring Practices** combobox pattern.
- Correct **roles, states and relationships** (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"`, `aria-selected`).
- **Keyboard behaviour** (arrows, Enter, Escape, Home/End, Tab) and focus staying in the input.
- **Announcements** of result counts, plus async loading, empty states, and **testing** with real assistive tech.

#### Key points
- Prefer native first: `<select>` for simple fixed lists, `<input list>` with `<datalist>` for basic suggestions; build a custom combobox when you need rich options, async search, or styling native controls can't provide.
- **Structure**: an `<input role="combobox">` with `aria-expanded`, `aria-controls` (listbox ID), `aria-autocomplete="list"`, and `aria-activedescendant` pointing to the highlighted option; a `<ul role="listbox">` with `<li role="option" id aria-selected>`.
- **Focus stays in the input**; the "active" option is communicated via `aria-activedescendant`, so users can keep typing.
- **Keyboard**: Down/Up move the active option (opening the list), Enter selects, Escape closes (then clears), Home/End optional, Tab moves on (optionally selecting).
- **Labels**: visible `<label>` for the input; options have readable text.
- **Announcements**: a polite live region for "5 results available" and "No results"; selection confirmed.
- **Mouse/touch**: clicking options selects; prevent the input blur from closing the list before the click registers (use `onMouseDown` + `preventDefault`).
- Test with **keyboard, VoiceOver, NVDA, JAWS**, mobile screen readers; automated tests for roles and keyboard.
- Libraries (React Aria, Radix, Downshift, Headless UI) encode years of edge cases; use them unless you have a strong reason.

#### Model answer
"An autocomplete looks simple, but it's one of the hardest widgets to make accessible, so I'd follow the WAI-ARIA Authoring Practices combobox pattern closely, and in production I'd strongly consider a tested library.

**First question: do we need a custom widget?** For a fixed list of 10 countries, a native `<select>` is fully accessible for free. A custom combobox is justified for searching thousands of items, async results, rich option content (avatars, descriptions) or multi-select chips.

**Structure and ARIA:**
```tsx
function Combobox({ label, options, onSelect }: { label: string; options: Item[]; onSelect: (i: Item) => void }) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())).slice(0, 50),
    [options, query],
  );
  const activeId = activeIndex >= 0 ? `${id}-opt-${results[activeIndex]?.id}` : undefined;

  function select(item: Item) {
    setQuery(item.label);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(item);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setOpen(true);
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (open && activeIndex >= 0) { e.preventDefault(); select(results[activeIndex]); }
        break;
      case 'Escape':
        if (open) setOpen(false); else setQuery('');   // first Esc closes, second clears
        setActiveIndex(-1);
        break;
    }
  }

  return (
    <div className="combobox">
      <label htmlFor={`${id}-input`}>{label}</label>
      <input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? activeId : undefined}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        autoComplete="off"
      />
      {open && (
        <ul id={listId} role="listbox" aria-label={label}>
          {results.map((item, i) => (
            <li
              key={item.id}
              id={`${id}-opt-${item.id}`}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'active' : undefined}
              onMouseDown={(e) => e.preventDefault()}      // keep focus in the input so blur doesn't close first
              onClick={() => select(item)}
              onMouseMove={() => setActiveIndex(i)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <div role="status" aria-live="polite" className="visually-hidden">
        {open ? (results.length ? `${results.length} results available. Use up and down arrows to choose.` : 'No results') : ''}
      </div>
    </div>
  );
}
```

**Why these pieces matter:**
- **`role="combobox"` on the input** tells assistive tech this text field controls a popup list.
- **`aria-expanded`** announces whether suggestions are showing.
- **`aria-controls`** links the input to the listbox.
- **`aria-activedescendant`**: focus stays in the input (so typing continues to work), while the screen reader announces the highlighted option as if focused. The referenced option must have a stable `id` and exist in the DOM.
- **`aria-selected`** on the active option; visual highlight must match.
- **Live region** announces result counts after typing (debounced for async search), since users otherwise don't know suggestions appeared.
- **`onMouseDown` preventDefault** stops the input losing focus before the click handler runs, a classic bug where clicking an option just closes the list.
- **Visible label** via `<label htmlFor>`.

**Keyboard behaviour (APG):**
| Key | Behaviour |
|---|---|
| Typing | Filters and opens the list |
| Down / Up | Moves the active option (Down opens if closed) |
| Enter | Selects the active option, closes the list |
| Escape | Closes the list; if already closed, clears input |
| Tab | Moves focus onward (optionally accepting the active option) |
| Home / End | Move caret in input (or first/last option, per design) |

**Async search additions:**
- Debounce requests, cancel stale ones (AbortController) so older responses don't replace newer results.
- Announce 'Loading…' politely, then results; show a visible loading indicator.
- Handle errors with a message inside the popup and in the live region.

**Visual and pointer details:**
- Highlight the active option with more than colour (background plus outline), 3:1 contrast.
- Scroll the active option into view (`scrollIntoView({ block: 'nearest' })`) when navigating long lists.
- Large enough touch targets on mobile; ensure the popup isn't obscured by the on-screen keyboard.
- Render the popup in a portal if it may be clipped by overflow, keeping the ARIA relationships intact.

**Testing:**
- **Automated**: Testing Library queries by role (`getByRole('combobox')`, `getByRole('option', { name: 'France' })`), keyboard interactions with `userEvent`, axe checks.
- **Manual**: keyboard-only; VoiceOver (Safari, iOS) and NVDA/JAWS (Chrome/Firefox on Windows); behaviour differs between screen readers, which is why APG patterns and libraries matter.

**When to use a library:** almost always in production. React Aria's `useComboBox`, Downshift, Radix or Headless UI handle screen reader quirks, virtualised lists, IME composition (typing Chinese/Japanese), mobile behaviour, RTL and internationalisation. I'd hand-build only for learning, or when a library can't meet a specific requirement, and then test across screen readers."

#### Another worked example: replacing a broken autocomplete
"An address lookup used a custom dropdown of divs: arrow keys didn't work, screen readers announced nothing as results appeared, and clicking an option sometimes closed the list without selecting. We replaced it with React Aria's combobox hooks styled with our design system, added a polite results count, and AbortController for request races. Accessibility audit issues for the checkout dropped from 11 to 0 for that step, and keyboard users could finally complete addresses."

#### A third worked example: tabs, the simpler pattern
"For an accessible tabs component, the APG pattern is: `role="tablist"` containing `role="tab"` buttons with `aria-selected` and `aria-controls`, panels with `role="tabpanel"` and `aria-labelledby`, roving tabindex so only the active tab is in the Tab order, arrow keys to move between tabs, and Tab to move into the panel. Deciding between automatic activation (arrow keys switch panels) and manual (Enter/Space) depends on whether panels load quickly."

#### Variations you might be asked
- "What's the difference between a combobox and a menu?": a combobox is an input with a popup of values to choose; a menu offers actions (like an app menu), with different roles and keyboard rules.
- "How do you handle multi-select?": `aria-multiselectable="true"` on the listbox, selected chips with remove buttons that have accessible names, and announcements on add/remove.
- "What about virtualised option lists?": `aria-setsize` and `aria-posinset` on options so screen readers know the total, while only rendering visible items.

#### Step-by-step framework
1. **Question the need** for a custom widget.
2. **Structure**: label, input with combobox role, listbox, options.
3. **States and relationships**: expanded, controls, activedescendant, selected.
4. **Keyboard interactions** per APG.
5. **Announcements, async, pointer details.**
6. **Testing** and library choice.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Div dropdown with click handlers | APG combobox pattern with correct roles |
| Moves DOM focus into options | aria-activedescendant keeps focus in input |
| No announcements | Polite live region for counts and loading |
| List closes before click registers | mousedown preventDefault |
| Hand-built for production without testing | Library or cross-screen-reader testing |

#### Useful phrases
- "If a native select works, I don't build a combobox."
- "Focus stays in the input; aria-activedescendant tells the screen reader which option is active."
- "I announce the number of results so users know suggestions appeared."
- "In production I'd use React Aria or Downshift, because they handle the screen reader quirks."

#### Common pitfalls
- **Mismatched visual and ARIA active states.**
- **Missing ids** for activedescendant targets.
- **Race conditions** in async results.
- **Ignoring IME composition** for non-Latin input.

#### Follow-ups to expect (with sample answers)
- **"Why not move real focus to options?"**
  "Users need to keep typing; moving focus would break text entry and complicate returning to the input."
- **"How do you handle IME input?"**
  "Ignore Enter/arrow handling during composition (check `event.nativeEvent.isComposing`) so users can confirm characters."
- **"How do you test with screen readers efficiently?"**
  "A short script of tasks per widget, run with VoiceOver and NVDA on each release of the design system component."

#### What senior interviewers look for
- **Pattern-level knowledge.**
- **Attention to real edge cases.**
- **Pragmatic library judgement.**

#### Practise it
1. Build the combobox above and test it with VoiceOver or NVDA.
2. Add async search with debounce, abort and loading announcements.
3. Explain aria-activedescendant, out loud.

## Auditing and improving accessibility in a large app
- id: fe-a11y-06
- roles: frontend, fullstack
- round: ACCESSIBILITY
- difficulty: medium
- levels: senior, staff
- tags: accessibility audit, axe, process, remediation, tech leadership

### Prompt
You've joined a company whose large web app has never been audited for accessibility, and a major customer now requires WCAG 2.2 AA compliance within six months. How do you assess the current state, prioritise fixes, deliver improvements, and prevent regressions?

### Answer
#### What the interviewer is really testing
- A **structured programme**: audit, prioritise, remediate, prevent.
- Knowing what **automation can and can't find**, and how to do manual testing.
- **Prioritisation** by user impact, critical journeys and shared components.
- **Organisational change**: ownership, training, design system, CI gates, reporting (VPAT/ACR).

#### Key points
- **Scope** critical user journeys first (sign-up, login, search, checkout, account management) and key templates.
- **Audit** with **automated tools** (axe, Lighthouse, WAVE), which find roughly 30–50% of issues, plus **manual testing**: keyboard-only, screen readers (NVDA, VoiceOver, JAWS), zoom/reflow, contrast, and ideally testing with disabled users. Consider an external audit for compliance evidence.
- **Log issues** with WCAG criterion, severity, location, component, and repro steps.
- **Prioritise** by **severity** (blocks completing a task?), **reach** (traffic, shared component), **legal/customer risk**; fix **shared components and design tokens first** for leverage.
- **Remediate** in parallel: design system fixes, page templates, then feature-specific issues.
- **Prevent regressions**: axe in CI (component and E2E), lint rules, accessibility in definition of done, design reviews, training, champions.
- **Report**: progress dashboard; produce an **Accessibility Conformance Report (VPAT)** and accessibility statement.

#### Model answer
"I'd run this like any other programme with a deadline: understand the current state quickly, fix what blocks users on the most important journeys first, get leverage from shared components, and put guardrails in place so we don't regress.

**Phase 1: Assess (weeks 1–3)**
1. **Scope**: list critical journeys (sign-up, login, search, product view, checkout, account settings, support) and the page templates and shared components they use. The customer's contract may specify particular areas.
2. **Automated scan**: run axe (via Playwright across key routes), Lighthouse and the axe DevTools extension. This quickly surfaces missing labels, contrast failures, missing alt text, ARIA errors and missing landmarks, but automation only catches around a third of issues.
3. **Manual testing** for what automation misses:
   - **Keyboard-only** walkthrough of each journey: can everything be reached and operated? Is focus visible and logical? Any traps?
   - **Screen readers**: NVDA + Firefox/Chrome on Windows, VoiceOver + Safari on macOS and iOS, TalkBack on Android for mobile web.
   - **Zoom 200%/400%** and 320px reflow; text spacing adjustments.
   - **Colour and contrast** in all states and themes.
   - Forms: labels, errors, timeouts; media: captions.
4. **Consider an external audit** by an accessibility specialist firm: valuable expertise, and often needed for credible compliance documentation.
5. **Log issues** in a tracker with: WCAG success criterion (e.g. 2.1.1 Keyboard), severity, affected journey and component, steps to reproduce, and suggested fix.

**Phase 2: Prioritise**
Severity scale:
| Severity | Meaning | Example |
|---|---|---|
| Critical | Blocks completing a task for some users | Checkout 'Pay' button not keyboard operable |
| High | Major difficulty or many users affected | Form errors not announced |
| Medium | Workarounds exist | Missing landmarks, inconsistent headings |
| Low | Minor | Redundant title attributes |

Priority = severity × reach (traffic, number of pages a component appears on) × contractual/legal risk. The biggest lever is **shared components**: fixing the design system's Button, Modal, Select, Tabs and form Field fixes hundreds of instances at once. Global fixes like focus styles, contrast tokens and `lang` attributes come next.

**Phase 3: Remediate (months 1–5)**
- **Workstream A, design system**: rebuild or fix core components to ARIA APG patterns (or adopt a headless library like React Aria/Radix), update colour tokens for contrast, add `:focus-visible` styles, a Field component that wires labels/hints/errors.
- **Workstream B, critical journeys**: fix journey-specific issues, ordered by severity; product teams own their areas with support from accessibility champions.
- **Workstream C, content**: alt text, captions, link text, headings; involve content designers and CMS validation (required alt fields).
- Track a burndown of issues by severity and journey; re-test fixes with the same manual scripts.

**Phase 4: Prevent regressions**
- **CI**: axe checks in component tests (Storybook test runner or jest-axe) and Playwright E2E on critical routes; fail builds on new serious/critical violations (with a baseline for known issues to avoid blocking everything on day one).
- **Linting**: `eslint-plugin-jsx-a11y`.
- **Testing Library role queries** in tests, nudging accessible markup.
- **Definition of done**: keyboard check and screen reader smoke test for UI changes; accessibility acceptance criteria in tickets.
- **Design process**: accessibility annotations (headings, focus order, labels) in design files; contrast checks in design tools.
- **People**: training sessions, accessibility champions per team, an internal guide.
- **Recurring audits**: quarterly sampling of journeys; external re-audit before the deadline.

**Reporting and compliance:**
- Progress dashboard for leadership and the customer: issues by severity, journeys passing, % of design system components compliant.
- An **Accessibility Conformance Report** (based on the VPAT template) documenting conformance per WCAG criterion, honestly noting partial support.
- A public **accessibility statement** with known issues and a contact method for users.

**What I'd avoid:** accessibility overlays (they don't achieve compliance and can harm users), treating automated scores as compliance, and fixing issues one page at a time without touching shared components."

#### Another worked example: six-month remediation
"At a B2B SaaS company facing a public sector procurement requirement, the initial audit found ~600 issues, 80% coming from 12 shared components and colour tokens. Fixing the design system in the first two months resolved roughly 450 issues; product teams fixed journey-specific issues over the next three months with champions' support. We added axe to Storybook and Playwright with a baseline, so new violations failed CI. The external re-audit at month six found the critical journeys conformant with WCAG 2.2 AA except two documented partial items, and the contract was signed."

#### A third worked example: the regression problem
"At another company, a one-off audit and fix cycle achieved good results, but a year later most issues had returned because new features were built without checks. The lasting fix was process, not code: CI gates, design annotations, a Field component that made the accessible way the easy way, and accessibility in the definition of done."

#### Variations you might be asked
- "How do you get product managers to prioritise accessibility?": tie it to contracts and revenue, legal risk, and show user impact (videos of screen reader users failing tasks are powerful).
- "How do you test with real disabled users?": recruit through specialist agencies or communities, pay participants, and observe them completing core tasks.
- "What's a VPAT?": a Voluntary Product Accessibility Template used to produce an Accessibility Conformance Report describing how a product meets standards like WCAG and Section 508.

#### Step-by-step framework
1. **Scope critical journeys and components.**
2. **Audit**: automated + manual + optional external.
3. **Log and prioritise** by severity, reach, risk.
4. **Remediate** via design system, journeys, content workstreams.
5. **Prevent** with CI, linting, process and training.
6. **Report** progress and conformance.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Run Lighthouse and fix the score" | Automated + manual + screen reader testing |
| Fixes pages one by one | Shared components first for leverage |
| No severity model | Severity × reach × risk prioritisation |
| One-off project | CI gates, definition of done, training |
| Buys an overlay | Fixes the code; documents conformance honestly |

#### Useful phrases
- "Automated tools find maybe a third of issues; manual testing finds the rest."
- "Fixing the design system fixes hundreds of instances at once."
- "Critical means someone can't complete the task."
- "CI gates and the definition of done stop us regressing."

#### Common pitfalls
- **Equating Lighthouse scores with compliance.**
- **No regression prevention.**
- **Ignoring content issues** (alt text, link text).
- **Overpromising conformance.**

#### Follow-ups to expect (with sample answers)
- **"How do you set a baseline in CI without blocking everyone?"**
  "Record existing violations as a baseline and fail only on new ones, then shrink the baseline over time."
- **"Which screen readers should you test?"**
  "NVDA and JAWS on Windows, VoiceOver on macOS/iOS, TalkBack on Android, based on your users and the WebAIM screen reader survey."
- **"How do you handle third-party widgets that aren't accessible?"**
  "Raise with the vendor, find alternatives, wrap or replace them, and document limitations in the conformance report."

#### What senior interviewers look for
- **Programme leadership.**
- **Realistic prioritisation.**
- **Sustainable process change.**

#### Practise it
1. Write a severity matrix and prioritisation formula for accessibility issues.
2. Set up axe in Playwright for three routes with a baseline.
3. Present a six-month remediation plan in 3 minutes, out loud.
