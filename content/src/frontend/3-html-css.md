# Frontend Engineer — HTML & CSS

## Semantic HTML and why it matters
- id: fe-css-01
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: easy
- levels:
- tags: semantic HTML, accessibility, SEO, landmarks

### Prompt
What is semantic HTML, and why does it matter? Give examples of choosing the right elements (buttons vs links, landmarks, headings, lists, forms, tables), and explain the impact on accessibility, SEO, and maintainability.

### Answer
#### What the interviewer is really testing
- Knowing **which element to use** for which purpose, and why.
- Understanding the **built-in behaviour** semantic elements provide (keyboard, focus, roles).
- Awareness of **accessibility tree, landmarks and heading structure**.
- Recognising the cost of **div soup** and ARIA misuse.

#### Key points
- **Semantic HTML** uses elements for their meaning (`<button>`, `<nav>`, `<main>`, `<h1>`–`<h6>`, `<ul>`, `<label>`, `<table>`), not just their appearance.
- Semantic elements come with **free behaviour**: keyboard support, focusability, roles exposed to assistive technology, form submission, default styles.
- **Buttons perform actions; links navigate** (change URL). Don't use `<div onClick>` or `<a href="#">` for actions.
- **Landmarks** (`header`, `nav`, `main`, `aside`, `footer`, `section` with a heading, `form` with a name) let screen reader users jump around the page.
- **Headings** form an outline: one logical `h1`, no skipped levels for styling reasons.
- **Forms**: `<label for>`, `<fieldset>`/`<legend>`, correct input `type`s for mobile keyboards and validation.
- **Tables** for tabular data with `<th scope>` and `<caption>`; not for layout.
- Benefits: **accessibility**, **SEO** (search engines understand structure), **maintainability**, fewer bugs, less JavaScript.
- First rule of ARIA: **use native HTML first**.

#### Model answer
"Semantic HTML means choosing elements for what content *is* and what it *does*, not how it looks. Styling is CSS's job; HTML describes meaning and behaviour.

**Buttons vs links, the most common mistake:**
```html
<!-- Bad: not focusable, no keyboard support, no role for screen readers -->
<div class="btn" onclick="addToCart()">Add to cart</div>

<!-- Bad: a link that doesn't navigate -->
<a href="#" onclick="openModal()">Open details</a>

<!-- Good -->
<button type="button" onclick="addToCart()">Add to cart</button>
<a href="/products/42">View product</a>
```
A `<button>` is focusable, activates with Enter and Space, announces as 'button', and supports `disabled`. Rebuilding that on a div needs `role="button"`, `tabindex="0"`, key handlers for Enter and Space, and disabled handling, and people usually forget some. Rule: if it changes the URL, it's a link; if it does something on the page, it's a button. Inside forms, remember `type="button"` for non-submit buttons, since the default type is `submit`.

**Page structure with landmarks:**
```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>
    <nav aria-label="Main">
      <ul><li><a href="/">Home</a></li><li><a href="/orders">Orders</a></li></ul>
    </nav>
  </header>
  <main id="main">
    <h1>Your orders</h1>
    <section aria-labelledby="recent">
      <h2 id="recent">Recent orders</h2>
      <ul>…</ul>
    </section>
  </main>
  <aside aria-label="Help">…</aside>
  <footer>…</footer>
</body>
```
Screen reader users can list landmarks and headings and jump directly to 'main' or 'Recent orders', the equivalent of visually scanning the page. A page built from divs gives them nothing to navigate by.

**Headings:** one `h1` describing the page, then `h2` for sections, `h3` for subsections, without skipping levels to get a smaller font (style with CSS instead). Headings are the most common way screen reader users navigate.

**Lists:** navigation menus, search results, steps: use `<ul>`/`<ol>` so assistive tech announces '5 items'.

**Forms:**
```html
<form>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-hint">
  <p id="email-hint">We'll send your receipt here.</p>

  <fieldset>
    <legend>Delivery speed</legend>
    <label><input type="radio" name="speed" value="standard" checked> Standard</label>
    <label><input type="radio" name="speed" value="express"> Express</label>
  </fieldset>
  <button type="submit">Place order</button>
</form>
```
Labels make the click target bigger and give inputs accessible names; `type="email"` shows the right mobile keyboard and enables validation; `autocomplete` lets browsers fill fields; pressing Enter submits the form natively.

**Tables for data, with headers:**
```html
<table>
  <caption>Monthly revenue</caption>
  <thead><tr><th scope="col">Month</th><th scope="col">Revenue</th></tr></thead>
  <tbody><tr><th scope="row">January</th><td>£12,400</td></tr></tbody>
</table>
```
Screen readers announce the header for each cell as users move through the table.

**Other useful semantic elements:** `<time datetime>`, `<figure>`/`<figcaption>`, `<details>`/`<summary>` (a native disclosure widget with keyboard support), `<dialog>` (native modal with focus handling), `<address>`, `<mark>`, `<abbr>`.

**Why it matters:**
- **Accessibility**: the accessibility tree is built from semantics; correct elements give correct roles, names and states for free.
- **SEO**: search engines use headings, landmarks, links and structured content to understand pages.
- **Less JavaScript and fewer bugs**: native elements handle keyboard, focus and form behaviour.
- **Maintainability**: `<nav>` and `<button>` communicate intent better than `<div class="nav">`.
- **Resilience**: works with reader modes, browser extensions, and when CSS fails to load.

**ARIA is a supplement, not a substitute:** the first rule of ARIA is to use a native element if one exists. ARIA changes what's announced but adds no behaviour."

#### Another worked example: fixing a div-based dropdown
"An audit of an e-commerce site found its 'Sort by' control was a styled div list: unreachable by keyboard and announced as plain text. Replacing it with a native `<select>` (styled with CSS) fixed keyboard, screen reader and mobile behaviour in one change and removed 120 lines of JavaScript. For a richer custom listbox, we would have needed the full ARIA combobox pattern."

#### A third worked example: heading structure and SEO
"A marketing site used `h4` for every section title because the designer wanted small text, and had no `h1`. Restructuring to one `h1` and proper `h2`/`h3` levels, styled to match the design, improved screen reader navigation and, combined with other fixes, helped search snippets show meaningful section links."

#### Variations you might be asked
- "Is section the same as div?": `<section>` is a thematic grouping, ideally with a heading; it becomes a region landmark when labelled. Use div for purely stylistic wrappers.
- "When is article appropriate?": for self-contained content that could stand alone (blog post, comment, product card in a feed).
- "What is the accessibility tree?": the browser's representation of the page for assistive technology, built from elements' roles, names, states and relationships.

#### Step-by-step framework
1. **Define semantic HTML.**
2. **Buttons vs links.**
3. **Landmarks and headings.**
4. **Lists, forms, tables.**
5. **Benefits**: accessibility, SEO, less JS, maintainability.
6. **ARIA as last resort.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use HTML5 tags" | Explains meaning and built-in behaviour |
| Divs with click handlers | Buttons for actions, links for navigation |
| Headings chosen by size | Logical heading outline |
| Placeholder instead of label | Labels, fieldsets, input types, autocomplete |
| ARIA everywhere | Native elements first |

#### Useful phrases
- "If it changes the URL it's a link; if it does something, it's a button."
- "Native elements give us keyboard support and roles for free."
- "Landmarks and headings are how screen reader users scan a page."
- "The first rule of ARIA is not to use ARIA when HTML already does the job."

#### Common pitfalls
- **Clickable divs.**
- **`<a href="#">` for actions.**
- **Skipping heading levels.**
- **Placeholders as labels.**

#### Follow-ups to expect (with sample answers)
- **"How do you check semantics?"**
  "Inspect the accessibility tree in DevTools, run axe or Lighthouse, navigate with keyboard only, and try a screen reader (VoiceOver/NVDA)."
- **"What does `<button>` default to inside a form?"**
  "`type="submit"`, so set `type="button"` for other actions."
- **"Should every section have a heading?"**
  "Ideally yes; it gives the section a name and an entry in the heading outline."

#### What senior interviewers look for
- **Habitual correct element choice.**
- **Accessibility awareness.**
- **Pragmatic use of native features.**

#### Practise it
1. Audit a page you built: find clickable divs, heading gaps and unlabeled inputs.
2. Rebuild a div-based dropdown with a native select or details element.
3. Explain buttons vs links, out loud, in 30 seconds.

## The box model, box-sizing and margin collapse
- id: fe-css-02
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: easy
- levels:
- tags: box model, box-sizing, margin collapse, layout

### Prompt
Explain the CSS box model. What's the difference between `content-box` and `border-box`, how do margins collapse, how do inline vs block vs inline-block elements behave, and how do `display`, `overflow` and new formatting contexts affect layout?

### Answer
#### What the interviewer is really testing
- Precise understanding of **how element sizes are calculated**.
- Knowing why **`box-sizing: border-box`** is the common reset.
- Understanding **margin collapsing** and how to prevent it.
- **Display types** and **block formatting contexts**, the root of many layout bugs.

#### Key points
- Every element is a box: **content → padding → border → margin** (outside in: margin, border, padding, content).
- **`content-box`** (default): `width` sets content width only; padding and border are added on top.
- **`border-box`**: `width` includes content, padding and border; easier to reason about. Common reset: `*, *::before, *::after { box-sizing: border-box; }`.
- **Margin collapsing**: vertical margins between adjacent block elements combine into the larger of the two; parent and first/last child margins can collapse through the parent; empty blocks collapse their own top and bottom margins.
- Collapsing **doesn't happen** in flex/grid containers, for floated or absolutely positioned elements, horizontally, or when padding/border separates them.
- **Display**: `block` (full width, new line, respects width/height), `inline` (flows in text, width/height ignored, vertical margins don't push lines), `inline-block` (flows inline but respects width/height).
- A **block formatting context** (BFC), created by `display: flow-root`, `overflow` other than visible, flex/grid items, etc., contains floats and prevents parent-child margin collapse.
- **`overflow`** controls content that doesn't fit; `hidden`/`auto` also creates a BFC.

#### Model answer
"Every element is drawn as a rectangular box with four layers: the content, then padding, then border, then margin.

```
┌──────────── margin ────────────┐
│ ┌────────── border ──────────┐ │
│ │ ┌──────── padding ───────┐ │ │
│ │ │        content         │ │ │
│ │ └────────────────────────┘ │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

**content-box vs border-box:**
```css
.card { width: 300px; padding: 20px; border: 2px solid; }

/* content-box (default): rendered width = 300 + 20*2 + 2*2 = 344px */
/* border-box:             rendered width = 300px (content shrinks to 256px) */
```
With `content-box`, adding padding makes elements wider than you set, which breaks layouts like 'two columns at 50% each' (they no longer fit). That's why most projects use:
```css
*, *::before, *::after { box-sizing: border-box; }
```
Margins are never included in the width in either model.

**Margin collapsing**, the most common 'why is there extra/missing space?' bug:
```html
<h2 style="margin-bottom: 24px">Title</h2>
<p style="margin-top: 16px">Text</p>
<!-- gap is 24px, not 40px: adjacent vertical margins collapse to the larger -->
```
Parent-child collapse:
```html
<section class="hero" style="background: navy">
  <h1 style="margin-top: 40px">Welcome</h1>
</section>
<!-- the h1's top margin 'escapes' the section: the section moves down 40px,
     and there's no navy space above the heading -->
```
Fixes for parent-child collapse: give the parent padding or a border, or make it a new formatting context with `display: flow-root` (the modern, side-effect-free option), or make it a flex/grid container.

Collapsing doesn't happen for: horizontal margins, flex and grid items, floats, absolutely positioned elements, or inline-block elements. Many teams avoid collapse surprises by using only bottom margins, or by using `gap` in flex/grid layouts for spacing between children.

**Display types:**
| | block | inline | inline-block |
|---|---|---|---|
| Starts on a new line | Yes | No | No |
| Width/height respected | Yes | No | Yes |
| Vertical padding/margin affects layout | Yes | Padding paints but doesn't push lines; vertical margins ignored | Yes |
| Default examples | div, p, h1, section | span, a, strong | button, input, img (replaced) |

A common bug: setting `width` or `margin-top` on a `<span>` or `<a>` and nothing happens, because it's inline; use `inline-block`, `block`, or put it in a flex container.

**Block formatting contexts (BFC):** a BFC is a self-contained layout region. Elements that establish one include `display: flow-root`, `overflow` values other than visible, flex and grid items, floats, absolutely positioned elements, and `contain: layout`. A BFC:
- contains its floats (fixing the old 'collapsed parent with floated children' problem, which used to need a clearfix hack),
- prevents margins collapsing between it and its children,
- doesn't overlap floats beside it.

**Overflow:** `visible` (default, content spills out), `hidden` (clipped, also clips focus outlines and shadows, so careful), `auto` (scrollbars when needed), `clip` (like hidden but doesn't create a scroll container). `overflow: hidden` on a parent is a common cause of cut-off dropdowns and tooltips.

**Debugging:** DevTools shows the box model diagram for any element (content, padding, border, margin sizes) and highlights margins on hover, which makes collapse issues obvious."

#### Another worked example: a two-column layout that wrapped
"Two columns set to `width: 50%` with `padding: 16px` wrapped onto separate lines because, under content-box, each was 50% plus 32px. Adding the border-box reset fixed it; switching to a grid with `grid-template-columns: 1fr 1fr; gap: 16px` was even more robust, since gap handles spacing without padding maths."

#### A third worked example: the escaping heading margin
"A coloured hero section had an unexpected white strip above it. The heading's top margin collapsed through the section, pushing the section down. Adding `display: flow-root` to the section (or padding-top instead of the heading margin) fixed it. Understanding margin collapse turned a 30-minute 'random CSS tweak' session into a one-line fix."

#### Variations you might be asked
- "Does padding collapse?": no, only vertical margins collapse.
- "What about negative margins?": collapse sums the largest positive and the most negative margin.
- "What's the difference between `outline` and `border`?": outlines don't take up space or affect layout; they're drawn outside the border, used for focus indicators.

#### Step-by-step framework
1. **Draw the box model.**
2. **Compare content-box and border-box** with numbers.
3. **Explain margin collapsing** and parent-child escape.
4. **Compare display types.**
5. **Explain BFCs** and flow-root.
6. **Overflow and debugging with DevTools.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Lists the four layers only | Calculates sizes for both box-sizing values |
| Unaware of margin collapse | Explains sibling and parent-child collapse with fixes |
| Sets width on inline elements | Knows inline vs inline-block behaviour |
| Uses clearfix hacks | Uses flow-root/BFC knowledge |
| Debugs by trial and error | Uses DevTools box model view |

#### Useful phrases
- "With border-box, the width I set is the width I get."
- "Adjacent vertical margins collapse to the larger one."
- "display: flow-root creates a new formatting context without side effects."
- "Inline elements ignore width, height and vertical margins."

#### Common pitfalls
- **Width maths without border-box.**
- **Unexpected gaps from margin collapse.**
- **overflow: hidden clipping dropdowns and focus rings.**
- **Styling inline elements like blocks.**

#### Follow-ups to expect (with sample answers)
- **"Why does an empty div with margins create a gap?"**
  "Its own top and bottom margins collapse together, and with neighbours, unless it has height, padding or border."
- **"How does gap differ from margins?"**
  "gap adds space only between items in flex/grid containers, never on the outer edges, and doesn't collapse."
- **"What's a replaced element?"**
  "An element whose content comes from outside CSS, like img, video or input; they're inline but have intrinsic dimensions."

#### What senior interviewers look for
- **Precise layout fundamentals.**
- **Efficient debugging.**
- **Modern techniques** (flow-root, gap).

#### Practise it
1. Build the hero example and fix the escaping margin three ways.
2. Calculate rendered widths for both box-sizing values with different padding.
3. Explain margin collapsing, out loud, with a diagram.

## Specificity, the cascade and cascade layers
- id: fe-css-03
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: medium
- levels:
- tags: specificity, cascade, layers, inheritance

### Prompt
How does the CSS cascade decide which rule wins? Explain origin and importance, specificity calculation, source order, inheritance, `!important`, and modern tools like `@layer`, `:where()` and `:is()`. How do you keep specificity manageable in a large codebase?

### Answer
#### What the interviewer is really testing
- A correct model of the **cascade order**, not just "specificity".
- Calculating **specificity** accurately.
- Understanding **inheritance** vs cascade, and `inherit`/`initial`/`unset`/`revert`.
- Strategies for **scaling CSS**: low specificity, layers, avoiding `!important` wars.

#### Key points
- When several declarations apply to the same property, the cascade picks one by (in order): **origin and importance** → **context (shadow DOM)** → **inline style attribute** → **cascade layers** → **specificity** → **source order**.
- **Specificity** is a triple (a, b, c): **IDs** (a), **classes, attributes, pseudo-classes** (b), **elements and pseudo-elements** (c). Compare left to right. `*` and combinators add nothing.
- `:is()` and `:not()` take the specificity of their **most specific argument**; **`:where()` always has zero specificity**.
- **Inline styles** beat any selector (except `!important` ones); **`!important`** reverses normal precedence within its origin and should be rare.
- **`@layer`** groups rules into ordered layers; a later layer beats an earlier one **regardless of specificity**; unlayered styles beat layered ones.
- **Inheritance**: some properties (color, font, line-height) inherit by default; others (margin, border, background) don't. Keywords: `inherit`, `initial`, `unset`, `revert`, `revert-layer`.
- Scale with **flat, single-class selectors** (BEM, CSS Modules, utilities), avoid IDs and deep nesting, and use layers for resets, libraries and utilities.

#### Model answer
"When two rules set the same property on the same element, the browser runs the cascade to pick a winner. Specificity is only one step in it.

**Cascade order (simplified):**
1. **Origin and importance**: user-agent styles < user styles < author styles for normal declarations; `!important` reverses this order (important user styles beat important author styles, for accessibility).
2. **Inline `style` attributes** beat selectors.
3. **Cascade layers**: within author styles, later layers beat earlier layers; unlayered styles beat all layers.
4. **Specificity**: higher wins.
5. **Source order**: if everything else ties, the last declaration wins.

**Specificity calculation (IDs, classes, elements):**
```css
p                         /* (0, 0, 1) */
.card p                   /* (0, 1, 1) */
.card .title              /* (0, 2, 0) */
#header .nav a:hover      /* (1, 2, 1) */
a[href^='https']          /* (0, 1, 1)  attribute = class level */
li::before                /* (0, 0, 2)  pseudo-element = element level */
:is(#main, .content) p    /* (1, 0, 1)  :is takes its most specific argument */
:where(#main, .content) p /* (0, 0, 1)  :where contributes zero */
```
Compare left to right: one ID beats any number of classes; 10 classes don't beat 1 ID.

**A typical bug:**
```css
#sidebar a { color: navy; }        /* (1, 0, 1) */
.link--danger { color: red; }      /* (0, 1, 0) — loses, the link stays navy */
```
The usual 'fix' is `!important` or adding more selectors, which starts a specificity war. The real fix is to avoid IDs in styling and keep selectors flat.

**Inheritance vs cascade:** the cascade decides between competing declarations on an element; inheritance supplies values for properties with no declaration, from the parent. Inherited values have no specificity at all, so any direct rule beats them:
```css
.article { color: #333; }
a { color: blue; }        /* links inside .article are blue: direct rule beats inherited value */
```
Keywords: `inherit` (take parent's value), `initial` (spec default), `unset` (inherit if inheritable, else initial), `revert` (back to browser default), `revert-layer` (back to previous layer).

**Cascade layers (`@layer`):**
```css
@layer reset, base, components, utilities;      /* order declared once, up front */

@layer reset      { *, *::before, *::after { box-sizing: border-box; margin: 0; } }
@layer base       { a { color: var(--link); } }
@layer components { .btn { padding: 8px 16px; background: var(--primary); } }
@layer utilities  { .mt-0 { margin-top: 0; } .hidden { display: none; } }
```
Now `.hidden` in utilities beats a more specific selector in components, because layer order outranks specificity. Third-party CSS can be imported into a low layer (`@import url(lib.css) layer(vendor);`) so our styles override it without specificity hacks. Tailwind v4 uses layers for exactly this.

**`:where()` for low-specificity defaults:** libraries wrap selectors in `:where()` so consumers can override them easily:
```css
:where(.prose) h2 { margin-top: 2em; }   /* specificity (0, 0, 1) — trivial to override */
```

**`!important`:** acceptable for utilities meant to always win (`.sr-only`, `.hidden`) or overriding third-party inline styles; otherwise it's a smell. Layers mostly remove the need.

**Keeping specificity manageable in large codebases:**
- One class per selector where possible (BEM, CSS Modules, utility classes); no IDs for styling.
- Avoid deep nesting in preprocessors (`.page .main .card .title` becomes (0, 4, 0)).
- Use `@layer` to order resets, vendor styles, components and utilities.
- Use component-scoped styles (CSS Modules, CSS-in-JS) to avoid collisions.
- Lint rules (Stylelint `selector-max-specificity`, `selector-max-id`, `declaration-no-important`).
- DevTools' Styles panel shows crossed-out declarations and the winning rule, which is the fastest way to debug cascade issues."

#### Another worked example: overriding a component library
"Our app used a UI library whose button styles had selectors like `.lib-btn.lib-btn--primary:not(:disabled)` (0, 3, 0). Overriding padding required ugly selectors or `!important`. We imported the library CSS into a low layer (`@layer vendor`) and put our theme in a later layer; plain `.btn-compact` overrides then worked regardless of the library's specificity, and 40 `!important` declarations were deleted."

#### A third worked example: the ID specificity trap
"A legacy page styled everything under `#app`, so every rule started at (1, x, x). New component styles with single classes never applied, and developers kept adding `!important`. We gradually replaced `#app` with `:where(#app)` (zero specificity) in the legacy stylesheet, which immediately let component classes win, and then removed the `!important`s."

#### Variations you might be asked
- "Does the order of classes in the class attribute matter?": no; only the order of rules in the stylesheet (and layers) matters.
- "Do combinators affect specificity?": no; only the simple selectors around them count.
- "How do styles in Shadow DOM interact?": shadow styles are encapsulated; outer styles don't apply inside except inherited properties and parts/slots; `:host` rules have lower precedence than outer rules on the host element.

#### Step-by-step framework
1. **List the cascade steps** in order.
2. **Calculate specificity** with examples.
3. **Explain inheritance** and keywords.
4. **Introduce @layer** and `:where()`.
5. **Discuss !important.**
6. **Scaling strategies** and debugging.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "More specific wins" only | Full cascade: origin, inline, layers, specificity, order |
| Miscounts specificity | Correct (a, b, c) with :is/:where rules |
| Confuses inheritance with cascade | Inherited values have no specificity |
| Uses !important to fix conflicts | Uses layers and flat selectors |
| No scaling plan | BEM/modules, lint rules, layers |

#### Useful phrases
- "Specificity is only one step; layers and origin come before it."
- "One ID beats any number of classes."
- "`:where()` lets me write defaults that are trivial to override."
- "Putting vendor CSS in a lower layer ends specificity wars."

#### Common pitfalls
- **IDs in selectors.**
- **Deep preprocessor nesting.**
- **!important escalation.**
- **Assuming class attribute order matters.**

#### Follow-ups to expect (with sample answers)
- **"What beats an inline style?"**
  "An `!important` declaration in a stylesheet, or an important inline style itself."
- **"How do unlayered styles compare with layered ones?"**
  "Unlayered author styles beat layered ones for normal declarations; for important declarations the order reverses."
- **"How do you debug which rule is applied?"**
  "DevTools Styles and Computed panels show the winning declaration, crossed-out losers, and the layer each rule belongs to."

#### What senior interviewers look for
- **Precise cascade knowledge.**
- **Modern tools** (layers, :where).
- **Scalable CSS habits.**

#### Practise it
1. Calculate specificity for ten selectors from a real stylesheet.
2. Put a vendor stylesheet into a layer and override it with simple classes.
3. Explain the cascade order, out loud, in 60 seconds.

## Flexbox vs Grid: when to use which
- id: fe-css-04
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: medium
- levels:
- tags: flexbox, grid, layout, responsive

### Prompt
Compare Flexbox and CSS Grid. When do you use each? Build a few layouts: a navbar, a card grid that adapts to screen width without media queries, a holy-grail page layout, and centring. Explain `flex: 1`, `minmax`, `auto-fit` vs `auto-fill`, and subgrid.

### Answer
#### What the interviewer is really testing
- Understanding **one-dimensional vs two-dimensional** layout.
- Fluency with key properties: **flex shorthand, wrapping, alignment, grid templates, fr, minmax, auto-fit, areas, gap**.
- Building **responsive layouts with intrinsic sizing** instead of many media queries.
- Debugging classics: **flex items overflowing (min-width: auto)**, misaligned content in cards.

#### Key points
- **Flexbox**: one-dimensional (a row or a column); content-driven sizing; great for components (navbars, toolbars, button groups, media objects, centring).
- **Grid**: two-dimensional (rows and columns together); layout-driven; great for page layouts, card grids, galleries, forms with aligned labels.
- They combine well: Grid for the page/sections, Flexbox inside components.
- **`flex: 1`** = `flex: 1 1 0%` (grow, shrink, basis 0): items share space equally. `flex: auto` = `1 1 auto` (share remaining space after content size).
- Flex items have **`min-width: auto`** by default, so long content can overflow; set `min-width: 0` to allow shrinking (common bug with text truncation).
- **`repeat(auto-fit, minmax(240px, 1fr))`** gives responsive columns without media queries; `auto-fill` keeps empty tracks, `auto-fit` collapses them so items stretch.
- **`grid-template-areas`** makes page layouts readable and easy to rearrange at breakpoints.
- **`gap`** works in both for spacing between items.
- **Subgrid** lets nested grids align to the parent's tracks (e.g. card headers/footers aligned across a row).

#### Model answer
"The short version: Flexbox lays things out in one direction and lets content decide sizes; Grid lays things out in two directions and lets the container define the structure. I often use Grid for the overall layout and Flexbox inside components.

**Navbar (Flexbox):**
```css
.nav { display: flex; align-items: center; gap: 1rem; }
.nav .logo { margin-right: auto; }          /* pushes everything after it to the right */
```
`margin-right: auto` in a flex container absorbs free space, a neat trick for 'logo left, links right'.

**Centring anything:**
```css
.center { display: grid; place-items: center; }       /* grid: one line */
.center-flex { display: flex; justify-content: center; align-items: center; }
```

**Responsive card grid without media queries (Grid):**
```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 1.5rem;
}
```
- `minmax(240px, 1fr)`: each column is at least 240px and shares extra space equally.
- `auto-fit`: fits as many columns as possible; on a 1000px container that's 4 columns, on a phone 1.
- `min(240px, 100%)` prevents overflow on screens narrower than 240px.
- `auto-fill` vs `auto-fit`: with few items, `auto-fill` keeps empty column tracks (items stay 240px-ish); `auto-fit` collapses empty tracks so items stretch to fill the row.

**Holy-grail page layout with named areas:**
```css
.page {
  display: grid;
  min-height: 100dvh;
  grid-template-columns: 240px 1fr 280px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'header header header'
    'nav    main   aside'
    'footer footer footer';
}
.page > header { grid-area: header; }
.page > nav    { grid-area: nav; }
.page > main   { grid-area: main; }
.page > aside  { grid-area: aside; }
.page > footer { grid-area: footer; }

@media (max-width: 800px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas: 'header' 'main' 'nav' 'aside' 'footer';
  }
}
```
The layout is readable at a glance and rearranged at a breakpoint without touching HTML. (Keep DOM order logical for keyboard and screen reader users; visual reordering doesn't change reading order.)

**flex shorthand:**
| Value | Means | Effect |
|---|---|---|
| `flex: 1` | `1 1 0%` | Items share space equally regardless of content |
| `flex: auto` | `1 1 auto` | Share leftover space after content sizes |
| `flex: none` | `0 0 auto` | Rigid: content size, no grow/shrink |
| `flex: 0 0 200px` | fixed basis | Exactly 200px |

**The min-width: auto trap:**
```css
.row { display: flex; }
.row .title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Without min-width: 0, a long title won't shrink below its content width and overflows the row */
.row .title { min-width: 0; }
```
Flex (and grid) items default to `min-width: auto`, meaning 'don't shrink below content size'. Adding `min-width: 0` (or `overflow: hidden`) allows truncation. In grid, `minmax(0, 1fr)` solves the equivalent problem.

**Subgrid: aligning nested content:**
```css
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.card  { display: grid; grid-row: span 3; grid-template-rows: subgrid; }  /* header, body, footer rows shared */
```
Each card's header, body and footer align across the row even when content lengths differ, which previously needed fixed heights or JavaScript.

**Choosing:**
- Items flow in one line and their content should determine sizes → **Flexbox**.
- You need rows *and* columns aligned, or a defined layout skeleton → **Grid**.
- Unknown number of items wrapping into a neat grid → **Grid with auto-fit**.
- Small alignment tasks inside a component → **Flexbox**.

**Accessibility note:** `order`, `flex-direction: row-reverse` and grid placement change visual order but not DOM/tab order; mismatches confuse keyboard users, so keep the source order meaningful."

#### Another worked example: a product grid rewrite
"A product listing used floats and four media queries to manage 1–4 columns, with uneven card heights. Rewriting with `repeat(auto-fit, minmax(220px, 1fr))` and subgrid for card sections removed all the media queries, aligned prices and buttons across each row, and adapted correctly inside a narrower sidebar layout too."

#### A third worked example: a truncation bug in a chat list
"Conversation previews in a sidebar overflowed horizontally when messages were long, despite `text-overflow: ellipsis`. The preview text was a flex item with the default `min-width: auto`. Adding `min-width: 0` to the flex child fixed the truncation. This is one of the most common flexbox bugs in real apps."

#### Variations you might be asked
- "What's the difference between justify-content and align-items?": justify works on the main axis (row direction in flex rows), align on the cross axis; in grid, justify is the inline (row) axis and align the block (column) axis.
- "How do you make a sticky footer?": grid with `grid-template-rows: auto 1fr auto` and `min-height: 100dvh`, or flex column with `flex: 1` on main.
- "Masonry layouts?": not fully supported natively yet (CSS masonry is in progress); use columns, JS libraries, or grid approximations.

#### Step-by-step framework
1. **One-dimensional vs two-dimensional.**
2. **Flexbox component examples** (navbar, centring).
3. **Grid layouts** (auto-fit cards, named areas).
4. **flex shorthand and min-width trap.**
5. **Subgrid and alignment.**
6. **Choosing rules and accessibility.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Grid is newer, so better" | 1D vs 2D, content-driven vs layout-driven |
| Media queries for every column count | auto-fit + minmax |
| Doesn't know flex: 1 meaning | Explains shorthand values |
| Stuck on truncation bugs | min-width: 0 / minmax(0, 1fr) |
| Ignores source order | Notes visual vs DOM order accessibility |

#### Useful phrases
- "Flexbox for one direction driven by content; Grid for two directions driven by layout."
- "auto-fit with minmax gives responsive columns without media queries."
- "Flex items won't shrink below their content unless you set min-width: 0."
- "Subgrid aligns nested content to the parent grid."

#### Common pitfalls
- **Overflowing flex children.**
- **Using margins instead of gap.**
- **Visual reordering** that breaks keyboard order.
- **Fixed heights** to align cards.

#### Follow-ups to expect (with sample answers)
- **"What does fr mean?"**
  "A fraction of the free space in the grid container after fixed and content-sized tracks are placed."
- **"When would you use grid-auto-flow: dense?"**
  "To backfill gaps in galleries with varying item spans, accepting that visual order may differ from DOM order."
- **"Can you animate grid templates?"**
  "Modern browsers can animate grid-template-rows/columns, e.g. accordions with `0fr` to `1fr`."

#### What senior interviewers look for
- **Fluent layout building.**
- **Intrinsic, media-query-light designs.**
- **Bug-fixing experience.**

#### Practise it
1. Build the auto-fit card grid and test with 1–10 items.
2. Build the holy-grail layout with areas and a mobile rearrangement.
3. Reproduce and fix the min-width truncation bug, and explain it out loud.

## Positioning, stacking contexts and z-index bugs
- id: fe-css-05
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: medium
- levels:
- tags: positioning, z-index, stacking context, overlays

### Prompt
Explain CSS positioning (`static`, `relative`, `absolute`, `fixed`, `sticky`) and how stacking contexts work. Why does a modal with `z-index: 9999` still appear behind another element? How do you design a z-index strategy for an app with dropdowns, tooltips, modals and toasts?

### Answer
#### What the interviewer is really testing
- Knowing **each position value** and its containing block.
- Understanding **stacking contexts**, the real reason z-index "doesn't work".
- Knowing **what creates stacking contexts** (transform, opacity, filter, position + z-index, isolation…).
- Designing a **z-index scale** and using **portals / top layer** for overlays.

#### Key points
- **static**: normal flow, ignores top/left and z-index.
- **relative**: offset from its normal position; still takes up its original space; becomes a containing block for absolute children.
- **absolute**: removed from flow; positioned relative to the nearest **positioned ancestor** (non-static), or the initial containing block.
- **fixed**: relative to the viewport, unless an ancestor has `transform`, `filter` or `perspective` (then that ancestor is the containing block, a classic bug).
- **sticky**: behaves like relative until a scroll threshold, then sticks within its **scroll container**; fails if an ancestor has `overflow: hidden/auto` or the parent is too short.
- **z-index only compares elements within the same stacking context**; a child can never escape its parent's context.
- Stacking contexts are created by: root, positioned elements with z-index, **opacity < 1**, **transform**, **filter**, `will-change`, `isolation: isolate`, `contain: paint`, flex/grid children with z-index, `position: fixed/sticky`, and more.
- Solutions: **render overlays at the document root** (portals), use the **top layer** (`<dialog>.showModal()`, Popover API), and a **tokenised z-index scale**.

#### Model answer
"**Position values:**
```css
.relative { position: relative; top: 10px; }    /* nudged, original space kept */
.parent   { position: relative; }               /* containing block for... */
.badge    { position: absolute; top: 0; right: 0; }  /* ...this: corner of .parent */
.toolbar  { position: fixed; bottom: 0; inset-inline: 0; }   /* pinned to the viewport */
.header   { position: sticky; top: 0; }         /* scrolls, then sticks at the top */
```

**Why z-index 9999 loses: stacking contexts.** A stacking context is a self-contained layer. Elements inside it are ordered among themselves, and then the whole context is placed as a single unit within its parent context. A child's z-index can't lift it above things outside its parent's context.
```html
<header style="position: relative; z-index: 2">Header (dropdowns live here)</header>
<main style="position: relative; z-index: 1">
  <div class="modal" style="position: fixed; z-index: 9999">Modal</div>
</main>
```
The modal's 9999 only competes inside `main`'s context. `main` (z-index 1) is below `header` (z-index 2), so the modal renders under the header no matter how large its z-index is.

**Sneaky stacking context creators:**
```css
.card { transform: translateZ(0); }   /* added for 'performance' — creates a context */
.fade { opacity: 0.99; }              /* any opacity < 1 creates one */
.blur { filter: blur(0); }
.anim { will-change: transform; }
```
A modal or tooltip nested inside such an element gets trapped. Worse, `transform`/`filter` on an ancestor also changes what `position: fixed` is relative to: the 'fixed' modal now scrolls with that ancestor and is clipped by its overflow.

**Debugging:** inspect the element's ancestors for `z-index`, `transform`, `opacity`, `filter`, `will-change`, `isolation`; Chrome's Layers panel and the 3D view show stacking contexts and layers.

**Sticky gotchas:**
- An ancestor with `overflow: hidden | auto | scroll` becomes the sticky element's scroll container; if that ancestor doesn't scroll, sticky appears not to work.
- Sticky elements only stick within their parent; a short parent means nothing to stick in.
- A threshold (`top: 0`) is required.

**Designing overlays properly:**
1. **Portals**: render modals, dropdown menus, tooltips and toasts at the end of `<body>` (React `createPortal`), so they're not trapped by ancestors' stacking contexts or overflow.
2. **The top layer**: `<dialog>` opened with `showModal()` and elements using the **Popover API** (`popover` attribute) render in the browser's top layer, above everything, regardless of z-index and stacking contexts, with built-in backdrop and (for dialog) focus handling and Escape to close.
3. **Anchor positioning** (CSS `anchor-name`/`position-anchor`) is emerging for tooltips and menus positioned relative to triggers; libraries like Floating UI handle positioning and collision detection today.

**A z-index scale:**
```css
:root {
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;
}
.site-header { position: sticky; top: 0; z-index: var(--z-sticky); }
```
Rules: only use tokens (lint against raw z-index numbers); keep local stacking inside components small (1, 2, 3) and use `isolation: isolate` on component roots so internal z-indexes can't leak out and fight global layers."

#### Another worked example: a modal stuck behind a header
"After a designer added a subtle `transform: scale(1)` hover effect to the main content wrapper, the checkout modal (rendered inside it) began appearing behind the sticky header and scrolling with the page. The transform created a stacking context and a new containing block for fixed elements. Moving the modal into a portal at the body level fixed it permanently; later we migrated to native `<dialog>` with `showModal()`, which uses the top layer."

#### A third worked example: sticky table headers not sticking
"A data table's sticky header didn't stick. The table was inside a wrapper with `overflow-x: auto` for horizontal scrolling, which became the scroll container, and that wrapper didn't scroll vertically. We set a max-height on the wrapper so it scrolled in both directions (sticky works inside it), and the header stuck correctly within the table's scroll area."

#### Variations you might be asked
- "What's the painting order within a stacking context?": background/borders of the context, negative z-index children, block boxes, floats, inline content, z-index 0/auto positioned elements, then positive z-index children.
- "What does isolation: isolate do?": creates a new stacking context without other side effects, containing internal z-indexes.
- "Why is position: fixed janky on mobile?": dynamic toolbars change the viewport; use `dvh` units and test on devices.

#### Step-by-step framework
1. **Explain each position value.**
2. **Define stacking contexts.**
3. **Show the 9999 example.**
4. **List context creators** and fixed-position containing block gotcha.
5. **Sticky pitfalls.**
6. **Overlay strategy**: portals, top layer, z-index tokens, isolation.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Increase z-index" | Explains stacking contexts |
| Unaware of transform/opacity effects | Lists context creators and fixed containing block change |
| Sticky 'just broken' | Explains scroll containers and parent height |
| Random z-index numbers | Tokenised scale + isolation |
| Modals nested anywhere | Portals, dialog, Popover API |

#### Useful phrases
- "z-index only competes within the same stacking context."
- "A transform on an ancestor traps both z-index and position: fixed."
- "Overlays go in a portal or the top layer."
- "We use z-index tokens and isolation so components can't leak layers."

#### Common pitfalls
- **Huge arbitrary z-index values.**
- **Overlays rendered deep in the tree.**
- **Transforms added for 'performance'.**
- **Overflow wrappers breaking sticky.**

#### Follow-ups to expect (with sample answers)
- **"What's the top layer?"**
  "A browser layer above all stacking contexts used by modal dialogs, popovers and fullscreen elements."
- **"Does z-index work without position?"**
  "Only on flex and grid items (and positioned elements); otherwise it's ignored."
- **"How do you position a tooltip near its trigger in a portal?"**
  "Compute the trigger's bounding rect and position the tooltip with fixed coordinates, handling collisions (Floating UI), or use CSS anchor positioning where supported."

#### What senior interviewers look for
- **Deep stacking model understanding.**
- **Practical overlay architecture.**
- **Fast debugging.**

#### Practise it
1. Reproduce the 9999 bug and fix it with a portal and with dialog.
2. Create a z-index token scale and lint rule.
3. Explain stacking contexts, out loud, with a diagram.

## Responsive design, media queries and container queries
- id: fe-css-06
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: medium
- levels:
- tags: responsive design, media queries, container queries, fluid typography

### Prompt
How do you build responsive interfaces today? Discuss mobile-first media queries, fluid layouts and typography (`clamp()`), viewport units (including `dvh`), container queries, responsive images, and testing across devices. When would you use container queries instead of media queries?

### Answer
#### What the interviewer is really testing
- Modern **responsive strategy**: intrinsic layouts first, breakpoints where content needs them.
- Knowing **container queries** and why they suit component-based UIs.
- **Fluid sizing** with `clamp()`, `min()`, `max()`, relative units.
- Practical issues: **mobile viewport units**, touch targets, input modes, user preferences, testing.

#### Key points
- **Mobile-first**: base styles for small screens, then `min-width` media queries to enhance for larger screens.
- Prefer **intrinsic layouts** (flex wrap, grid auto-fit, minmax) that adapt without breakpoints; add breakpoints where **the content breaks**, not for specific devices.
- **Container queries** (`container-type: inline-size` + `@container (min-width: …)`) let a component respond to **its container's width**, so the same card works in a sidebar and a main column.
- **Fluid typography and spacing**: `font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`.
- Use **rem** for font sizes (respects user font settings), **em**/rem for spacing, **%/fr** for layout.
- **Viewport units**: `100vh` is unreliable on mobile (browser toolbars); use **`dvh`/`svh`/`lvh`**.
- **Media features beyond width**: `prefers-color-scheme`, `prefers-reduced-motion`, `hover`/`pointer` (touch vs mouse), `orientation`.
- **Responsive images**: `srcset`/`sizes`, `<picture>`.
- **Test**: DevTools device mode, real devices, zoom to 200–400% (WCAG reflow), different font sizes.

#### Model answer
"My approach is: start with layouts that adapt naturally, add container queries for components that live in different contexts, and use media queries for page-level changes and user preferences.

**1. Mobile-first base + min-width enhancements:**
```css
.layout { display: grid; gap: 1rem; }                       /* single column by default */
@media (min-width: 48rem) { .layout { grid-template-columns: 240px 1fr; } }
@media (min-width: 72rem) { .layout { grid-template-columns: 240px 1fr 300px; } }
```
Using `rem` breakpoints means layouts adapt when users increase their default font size. I choose breakpoints where the content starts to look cramped, not at 'iPhone width'.

**2. Intrinsic layouts reduce breakpoints:**
```css
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr)); gap: 1.5rem; }
.toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; }
```

**3. Container queries for components.** Media queries ask 'how wide is the viewport?'; a component placed in a narrow sidebar on a wide screen gets the wrong answer. Container queries ask 'how wide is my container?':
```css
.card-wrapper { container-type: inline-size; container-name: card; }

.card { display: grid; gap: 0.75rem; }                       /* stacked by default */
@container card (min-width: 28rem) {
  .card { grid-template-columns: 8rem 1fr; }                 /* image beside text when there's room */
}
@container card (min-width: 40rem) {
  .card .description { display: block; }                     /* show more detail in wide containers */
}
```
The same `ProductCard` component now looks right in a 3-column grid, a sidebar, a modal and a full-width list, without the page knowing about it. Container query units (`cqi`, `cqw`) also let typography scale with the container. This fits component-based design systems far better than viewport breakpoints.

**4. Fluid typography and spacing:**
```css
:root {
  --step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --step-3: clamp(1.75rem, 1.4rem + 1.5vw, 2.75rem);
  --space-m: clamp(1rem, 0.8rem + 1vw, 1.5rem);
}
h1 { font-size: var(--step-3); }
```
`clamp(min, preferred, max)` scales smoothly between limits. Including a `rem` component in the preferred value keeps zoom working (pure `vw` font sizes don't respond to browser zoom properly, an accessibility issue).

**5. Mobile viewport units:**
```css
.fullscreen { min-height: 100vh; min-height: 100dvh; }   /* fallback, then dynamic viewport height */
```
On mobile, `100vh` equals the largest viewport (toolbars hidden), so content gets cut off behind the address bar. `dvh` tracks the current visible height; `svh` is the smallest, `lvh` the largest.

**6. Beyond width: user preferences and input:**
```css
@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
@media (prefers-color-scheme: dark) { :root { --bg: #111; --fg: #eee; } }
@media (hover: none) and (pointer: coarse) { .btn { min-height: 44px; } .tooltip-on-hover { display: none; } }
```
Touch devices can't hover, so hover-only interactions need alternatives; touch targets should be at least 44×44 px (WCAG 2.2 sets 24×24 minimum).

**7. Responsive images:** `srcset` and `sizes` (or `<picture>` for art direction) so phones don't download desktop-sized images, plus `width`/`height` attributes to prevent layout shift.

**8. Testing:**
- DevTools device mode for quick checks, but also **real devices** (iOS Safari quirks, touch, performance).
- **Zoom to 200% and 400%**: WCAG reflow requires content to work at 320 CSS px width without horizontal scrolling.
- Larger default font sizes, landscape orientation, and long translated strings (German text is often 30% longer)."

#### Another worked example: one card, many contexts
"Our design system's product card had three viewport-based variants and props like `layout="compact"` that teams had to choose manually, and they often chose wrong (cramped cards in sidebars on desktop). Switching the card to container queries removed the variant prop: it adapted to wherever it was placed. Bugs about 'broken cards in the sidebar' disappeared, and the component's API got simpler."

#### A third worked example: mobile checkout button hidden
"On iOS Safari, the 'Pay now' button at the bottom of a `height: 100vh` checkout panel was hidden behind the browser toolbar for some users. Switching to `100dvh` with a `100vh` fallback, and adding safe-area padding (`padding-bottom: env(safe-area-inset-bottom)`) for notched phones, made the button reliably visible, and mobile checkout completion rose measurably."

#### Variations you might be asked
- "Desktop-first or mobile-first?": mobile-first generally leads to simpler base styles and progressive enhancement; either works if consistent.
- "How do you handle responsive tables?": horizontal scroll containers with sticky first column, or card layouts on narrow screens via container queries.
- "What's the :has() selector useful for in responsive design?": styling parents based on children (e.g. a card with an image gets a different layout), reducing the need for variant classes.

#### Step-by-step framework
1. **Mobile-first and content-driven breakpoints.**
2. **Intrinsic layouts** first.
3. **Container queries** for components.
4. **Fluid type and spacing** with clamp.
5. **Viewport units, preferences and input modes.**
6. **Responsive images and testing** (zoom, devices).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Breakpoints for specific devices | Content-driven, rem-based breakpoints |
| Only media queries | Container queries for components |
| Fixed px font sizes | clamp with rem for zoom-safe fluid type |
| 100vh on mobile | dvh/svh and safe areas |
| Only width | prefers-* and pointer/hover queries |

#### Useful phrases
- "I add a breakpoint where the content breaks, not where a device is."
- "Container queries let components respond to the space they're given."
- "clamp gives fluid sizes with sensible limits, and a rem term keeps zoom working."
- "100vh lies on mobile; dvh tracks the visible viewport."

#### Common pitfalls
- **Hover-only interactions** on touch devices.
- **vw-only font sizes** breaking zoom.
- **Viewport-based component variants.**
- **Testing only in desktop device emulation.**

#### Follow-ups to expect (with sample answers)
- **"What does container-type: inline-size require?"**
  "The container's inline size can't depend on its children's size (size containment in that axis), so it must get its width from its parent."
- **"How do you test reflow at 400%?"**
  "Zoom the browser to 400% on a 1280px-wide window, which simulates a 320px viewport, and check there's no horizontal scrolling or lost content."
- **"Should breakpoints be in px or rem/em?"**
  "rem/em, so layouts respond to users' font size settings."

#### What senior interviewers look for
- **Modern, component-oriented responsiveness.**
- **Accessibility-aware sizing.**
- **Real-device pragmatism.**

#### Practise it
1. Convert a viewport-breakpoint card to container queries.
2. Build a fluid type scale with clamp and test zoom.
3. Explain container vs media queries with an example, out loud.

## CSS architecture: BEM, CSS Modules, CSS-in-JS and Tailwind
- id: fe-css-07
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: medium
- levels:
- tags: CSS architecture, BEM, CSS Modules, CSS-in-JS, Tailwind

### Prompt
Compare the main approaches to styling large React applications: global CSS with BEM, CSS Modules, CSS-in-JS (runtime and zero-runtime), and utility-first CSS like Tailwind. What are the trade-offs for performance, maintainability, theming and server rendering? What would you choose for a new project, and why?

### Answer
#### What the interviewer is really testing
- Understanding the **problems** each approach solves (global scope, specificity, dead code, theming, co-location).
- **Performance trade-offs**, especially runtime CSS-in-JS with SSR and React Server Components.
- **Design system integration**: tokens, theming, variants.
- **Decision-making** grounded in team and product context.

#### Key points
- CSS's core scaling problems: **global namespace**, **specificity conflicts**, **dead code** (nobody dares delete), **coupling between markup and styles**, **theming**.
- **BEM** (`block__element--modifier`): naming convention, flat specificity, works anywhere; relies on discipline; global.
- **CSS Modules**: locally scoped class names generated at build time; plain CSS, zero runtime, co-located; theming via CSS variables.
- **Runtime CSS-in-JS** (styled-components, Emotion): co-located, dynamic styles from props, theming via context; costs **runtime JS**, style injection during render, SSR complexity, and poor fit with **React Server Components**.
- **Zero-runtime CSS-in-JS** (vanilla-extract, Linaria, Panda CSS, StyleX): typed styles in TS, extracted to static CSS at build time.
- **Utility-first (Tailwind)**: small atomic classes in markup, design tokens built in, tiny CSS output, no naming; markup can get verbose; needs component abstraction and conventions (`clsx`, `cva`, `tailwind-merge`).
- **CSS variables** are the common foundation for **theming** across approaches.
- Choose based on team skills, design system needs, SSR/RSC, performance budget and consistency.

#### Model answer
"All of these try to solve the same problems in plain global CSS at scale: class name collisions, specificity fights, unused CSS no one dares delete, and keeping styles consistent with a design system. They differ in where styles live and what they cost at runtime.

**1. Global CSS with BEM:**
```css
.card {}
.card__title {}
.card__button--primary {}
```
- Pros: no tooling, flat single-class specificity, readable, works with any framework.
- Cons: still a global namespace (collisions possible), relies on naming discipline, dead CSS accumulates because it's hard to know what's used.
- Good for: small sites, server-rendered pages, teams without a build pipeline.

**2. CSS Modules:**
```css
/* Card.module.css */
.card { padding: var(--space-4); border-radius: var(--radius-md); }
.title { font-size: var(--step-1); }
.primary { background: var(--color-primary); }
```
```tsx
import styles from './Card.module.css';
<div className={styles.card}><h3 className={styles.title}>…</h3></div>
```
- Class names are hashed at build time (`Card_title__x7a2`), so no collisions.
- Plain CSS with zero runtime cost; works with SSR and Server Components.
- Co-located with components; deleting a component deletes its styles.
- Dynamic styling via class toggles and CSS variables set through the style prop (e.g. `style={{ '--progress': pct + '%' }}`).
- Cons: some boilerplate, conditional class composition needs a helper (`clsx`), sharing tokens relies on CSS variables.

**3. Runtime CSS-in-JS (styled-components, Emotion):**
```tsx
const Button = styled.button<{ variant: 'primary' | 'ghost' }>`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  background: ${({ variant, theme }) => (variant === 'primary' ? theme.colors.primary : 'transparent')};
`;
```
- Pros: co-location, props-driven styles, theming via context, TypeScript integration.
- Cons: **runtime cost** (styles are generated and injected during render, adding JS and work on every render with changing props), **larger bundles**, more complex **SSR** (style collection and hydration), and incompatibility or awkwardness with **React Server Components** (needs client components and context). The React team and many libraries have moved away from runtime injection for these reasons.

**4. Zero-runtime CSS-in-JS (vanilla-extract, Panda, StyleX, Linaria):**
```ts
// button.css.ts (vanilla-extract)
export const button = recipe({
  base: { padding: vars.space[2], borderRadius: vars.radius.md },
  variants: { tone: { primary: { background: vars.color.primary }, ghost: { background: 'transparent' } } },
});
```
- Styles written in TypeScript (type-safe tokens, variants), extracted to static CSS at build time. Good fit for typed design systems; no runtime cost.
- Cons: build tooling complexity, less dynamic (use CSS variables for runtime values).

**5. Utility-first: Tailwind:**
```tsx
<button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus-visible:outline-2 disabled:opacity-50">
  Save
</button>
```
- Pros: no naming, design tokens enforced by the config (consistent spacing/colours), very small CSS output (only used classes), fast iteration, styles visible in markup, works great with SSR/RSC, easy deletion (styles go with markup).
- Cons: long class lists, a learning curve, and the need for **component abstraction** so classes aren't duplicated everywhere. Tooling helps: `cva` (class-variance-authority) for variants, `tailwind-merge` to resolve conflicting classes, Prettier plugin for class order.
```ts
const button = cva('inline-flex items-center rounded-md font-medium', {
  variants: {
    variant: { primary: 'bg-primary text-white', ghost: 'bg-transparent hover:bg-muted' },
    size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
```

**Comparison:**
| | BEM | CSS Modules | Runtime CSS-in-JS | Zero-runtime CSS-in-JS | Tailwind |
|---|---|---|---|---|---|
| Scoping | Convention | Build-time | Runtime | Build-time | Utilities (no custom classes) |
| Runtime cost | None | None | Yes | None | None |
| SSR / RSC | Easy | Easy | Harder | Easy | Easy |
| Dynamic styles | Classes/vars | Classes/vars | Props | Vars/variants | Classes/vars |
| Dead code removal | Hard | Easy | Easy | Easy | Automatic |
| Design tokens | Manual | CSS vars | Theme object | Typed vars | Config/theme |

**Theming across all approaches:** CSS custom properties (`--color-primary`) switched on a root attribute (`[data-theme='dark']`) are the most performant foundation; they change without re-rendering React.

**What I'd choose for a new React project (especially Next.js App Router):**
- **Tailwind + a component layer** (cva, shadcn/ui-style components) for most product teams: fast, consistent, zero runtime, great with RSC.
- **CSS Modules + CSS variables** if the team prefers writing CSS or the design is highly bespoke.
- **Zero-runtime CSS-in-JS** (vanilla-extract/Panda) for a typed design system shared across many apps.
- I'd avoid starting a new project on runtime CSS-in-JS today because of SSR/RSC and performance costs, though I wouldn't rewrite a working codebase just to switch without a measured reason."

#### Another worked example: migrating off runtime CSS-in-JS
"A Next.js app with styled-components spent ~40 ms per interaction re-generating styles for components with changing props, and moving to the App Router required marking most components as client components. We migrated incrementally to CSS Modules with CSS variables (dynamic values set via style props), starting with the most-rendered components. JS bundle shrank by 30 KB, INP improved by about 25%, and those components became server-renderable without client boundaries."

#### A third worked example: Tailwind consistency gains
"A team with eight engineers had 37 distinct greys and 20 spacing values across its CSS. Adopting Tailwind with a constrained theme (tokens from the design team) and a small set of cva-based components reduced UI inconsistencies, and design reviews started focusing on UX rather than pixel nitpicks. We added the Tailwind Prettier plugin and `tailwind-merge` to keep class lists manageable."

#### Variations you might be asked
- "How do you prevent Tailwind class soup?": extract components (not `@apply` everywhere), use cva for variants, keep consistent ordering with Prettier.
- "How do you share styles between React and non-React apps?": CSS variables and plain CSS/CSS Modules or Tailwind presets; avoid framework-specific runtime styling.
- "What about Sass?": still useful for mixins and nesting (native CSS nesting now exists), usually alongside CSS Modules.

#### Step-by-step framework
1. **State the problems** CSS architecture solves.
2. **Explain each approach** with code.
3. **Compare** performance, SSR/RSC, dynamic styling, dead code, tokens.
4. **Theming** with CSS variables.
5. **Recommend** based on context.
6. **Migration considerations.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Tailwind is ugly" / "Tailwind is best" | Balanced trade-offs |
| Unaware of runtime CSS-in-JS costs | Explains render-time injection, SSR, RSC issues |
| No theming strategy | CSS variables foundation |
| Ignores dead code | Notes co-location and automatic removal |
| Choice without context | Recommends based on team, SSR, design system |

#### Useful phrases
- "They all solve global scope, specificity and dead CSS, at different costs."
- "Runtime CSS-in-JS generates styles during render, which costs performance and complicates server components."
- "CSS variables are the best theming foundation regardless of approach."
- "For a new App Router project, I'd pick a zero-runtime option."

#### Common pitfalls
- **Mixing many approaches** without rules.
- **Runtime styles for frequently changing values** (use CSS variables).
- **Unabstracted utility repetition.**
- **Rewriting styling for fashion** rather than measured problems.

#### Follow-ups to expect (with sample answers)
- **"How do you do dark mode with Tailwind?"**
  "The `dark:` variant with class or media strategy, ideally mapped to CSS variable tokens so components don't need dark variants everywhere."
- **"How do CSS Modules handle global styles?"**
  "Use `:global(...)` or a separate global stylesheet for resets and base styles."
- **"What's StyleX?"**
  "Meta's zero-runtime CSS-in-JS that compiles to atomic CSS, used at Facebook/Instagram scale."

#### What senior interviewers look for
- **Architectural reasoning** over preference.
- **Performance and SSR awareness.**
- **Design system thinking.**

#### Practise it
1. Build the same Button with CSS Modules, Tailwind+cva and vanilla-extract.
2. Implement dark mode with CSS variables and a data-theme attribute.
3. Present your recommendation for a new Next.js project in 2 minutes, out loud.

## Animations and transitions that stay smooth
- id: fe-css-08
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: medium
- levels:
- tags: animations, transitions, performance, compositor, reduced motion

### Prompt
How do you build smooth animations on the web? Explain which CSS properties are cheap or expensive to animate, the compositor and `will-change`, CSS transitions vs keyframes vs the Web Animations API vs JavaScript libraries, animating height, View Transitions, and respecting reduced motion.

### Answer
#### What the interviewer is really testing
- Understanding the **rendering pipeline** (style → layout → paint → composite) and its cost per property.
- Knowing to animate **transform and opacity** for 60/120 fps.
- Choosing the right **animation tool** for the job.
- **Accessibility** (prefers-reduced-motion) and **UX** (duration, easing, purpose).

#### Key points
- Animating **layout properties** (width, height, top, left, margin) triggers **layout + paint** every frame → jank.
- Animating **paint properties** (background-color, box-shadow, border-radius) triggers paint; moderate cost.
- **transform** and **opacity** can be handled by the **compositor** on the GPU without layout or paint: smooth even when the main thread is busy.
- **`will-change: transform`** hints the browser to promote an element to its own layer; use sparingly (memory cost) and only shortly before animating.
- **CSS transitions** for state changes (hover, open/close); **@keyframes** for multi-step or looping; **Web Animations API** (`element.animate`) for JS control with compositor performance; libraries (Framer Motion/Motion, GSAP) for complex sequencing, gestures, layout animations.
- **Height animations**: use `grid-template-rows: 0fr → 1fr`, `interpolate-size`/`calc-size()` where supported, or transform-based techniques (FLIP).
- **View Transitions API** animates between DOM states or page navigations.
- Always respect **`prefers-reduced-motion`**; keep durations ~150–300 ms for UI; animations should communicate, not decorate.

#### Model answer
"Smooth animation means producing a frame every ~16.7 ms (60 Hz) or ~8.3 ms (120 Hz). Whether that's achievable depends mostly on which property you animate.

**The rendering pipeline per frame:**
```
JavaScript → Style → Layout → Paint → Composite
```
| Property type | Examples | Work per frame |
|---|---|---|
| Layout | width, height, top, left, margin, padding | Layout + paint + composite (expensive) |
| Paint | background-color, color, box-shadow | Paint + composite |
| Composite | transform, opacity (and filter in many cases) | Composite only (cheap, can run off main thread) |

**Animate transform and opacity:**
```css
/* Janky: moves by changing layout every frame */
.panel { transition: left 300ms; left: -300px; }
.panel.open { left: 0; }

/* Smooth: compositor-only */
.panel { transition: transform 300ms cubic-bezier(0.2, 0, 0, 1); transform: translateX(-100%); }
.panel.open { transform: translateX(0); }
```
Compositor animations keep running smoothly even if JavaScript is busy on the main thread, because the compositor thread moves the already-painted layer.

**will-change:**
```css
.drawer { will-change: transform; }     /* promote before animating */
```
It lets the browser prepare a separate layer, avoiding a hitch at the animation's start. But each layer costs GPU memory; applying `will-change` to many elements (or `*`) can make things slower, and it also creates a stacking context. I add it only to elements that animate frequently, or toggle it right before an animation.

**Choosing a tool:**
- **CSS transitions**: simple A → B state changes (hover, focus, open/close with a class).
- **@keyframes**: multi-step, looping or entrance animations (spinners, skeleton shimmers).
- **Web Animations API**: JS control (play, pause, reverse, `finished` promise) with the same performance as CSS:
```js
const anim = el.animate(
  [{ transform: 'scale(0.95)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
  { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'both' },
);
await anim.finished;
```
- **Libraries** (Motion/Framer Motion, GSAP): complex sequences, spring physics, gestures (drag), layout animations, exit animations in React (`AnimatePresence`). Worth their bundle cost when animation is central to the product.

**Animating height (accordion), the classic problem:** `height: auto` can't be transitioned traditionally. Options:
```css
/* Grid trick: animate rows from 0fr to 1fr */
.accordion-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 250ms ease; }
.accordion-panel[data-open='true'] { grid-template-rows: 1fr; }
.accordion-panel > .inner { overflow: hidden; }
```
Newer browsers support `interpolate-size: allow-keywords` (animate to `height: auto`) and `calc-size()`. For list reordering and expanding cards, the **FLIP** technique (First, Last, Invert, Play) measures positions and animates with transforms instead of layout.

**View Transitions API:**
```js
document.startViewTransition(() => {
  updateTheDOM();                 // e.g. switch from list view to detail view
});
```
The browser snapshots the old and new states and cross-fades or morphs elements (with `view-transition-name` for shared elements like a product image growing into a detail page). Cross-document view transitions also work for multi-page apps in supporting browsers.

**Reduced motion (accessibility):**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
For users with vestibular disorders, large motion (parallax, zooms, sliding pages) can cause nausea. Rather than removing all feedback, I swap big movements for fades. In JS, check `matchMedia('(prefers-reduced-motion: reduce)')`.

**UX guidelines:** 150–250 ms for small UI changes, 300–500 ms for larger transitions; ease-out for entering, ease-in for exiting; animate with purpose (show where something came from, confirm an action); never block interaction waiting for decorative animations.

**Debugging jank:** DevTools Performance panel (long frames, layout and paint events), Rendering tab (paint flashing, layer borders, FPS meter), and checking for **layout thrashing** in JS-driven animations (reading layout after writing styles in the same frame)."

#### Another worked example: a janky mobile menu
"A mobile navigation drawer animated `left` and `width`, dropping to ~25 fps on mid-range Android phones, especially while the page was loading. Switching to `transform: translateX()` with `will-change: transform` on the drawer and animating the backdrop's opacity made it consistently smooth, even with the main thread busy hydrating the page."

#### A third worked example: product grid to detail with View Transitions
"On a product listing, clicking a product now morphs its thumbnail into the detail page hero image using `view-transition-name: product-<id>` on both elements and `document.startViewTransition` around the route change. It made navigation feel faster without changing load time. We disabled the morph for reduced-motion users, falling back to an instant switch."

#### Variations you might be asked
- "Why does animating box-shadow cause jank?": it triggers paint each frame; animate the opacity of a pseudo-element with the final shadow instead.
- "What's the difference between transition and animation?": transitions interpolate between two states on change; animations run keyframes on their own timeline, can loop and start automatically.
- "How do you animate on scroll efficiently?": IntersectionObserver to trigger, or CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`), avoiding scroll event handlers.

#### Step-by-step framework
1. **Explain the pipeline** and property costs.
2. **Prefer transform and opacity.**
3. **Use will-change carefully.**
4. **Choose the right tool** (CSS, WAAPI, libraries).
5. **Handle tricky cases** (height, FLIP, View Transitions).
6. **Reduced motion, UX timing, and debugging.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Animates left/width/height | transform/opacity on the compositor |
| will-change everywhere | Targeted, temporary layer promotion |
| Library for everything | Picks CSS/WAAPI/library by need |
| Can't animate height | Grid 0fr→1fr, interpolate-size, FLIP |
| Ignores reduced motion | Respects prefers-reduced-motion |

#### Useful phrases
- "Transform and opacity can be animated by the compositor without layout or paint."
- "will-change is a hint with a memory cost, not a performance switch."
- "For height, I animate grid rows from 0fr to 1fr."
- "Reduced-motion users get fades instead of large movement."

#### Common pitfalls
- **Animating layout properties.**
- **Overusing will-change.**
- **Long decorative animations** blocking interaction.
- **Ignoring reduced-motion preferences.**

#### Follow-ups to expect (with sample answers)
- **"What is the compositor?"**
  "The part of the browser that combines painted layers into the final image, able to run on a separate thread and GPU."
- **"How do scroll-driven animations work?"**
  "CSS `animation-timeline: scroll()` or `view()` ties keyframe progress to scroll position, running off the main thread in supporting browsers."
- **"Are JS animations always slower?"**
  "Not if they use WAAPI or only transform/opacity and requestAnimationFrame; the problem is main-thread work and layout properties."

#### What senior interviewers look for
- **Rendering pipeline knowledge.**
- **Performance-first animation choices.**
- **Accessibility and UX judgement.**

#### Practise it
1. Rebuild a drawer animation from left to transform and compare in the Performance panel.
2. Build an accordion with the grid 0fr→1fr technique.
3. Explain compositor-only properties, out loud.

## Theming and dark mode with CSS custom properties
- id: fe-css-09
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: medium
- levels:
- tags: theming, dark mode, CSS variables, design tokens

### Prompt
How would you implement theming and dark mode in a web app? Cover CSS custom properties, design tokens, respecting the system preference, a user toggle that persists, avoiding a flash of the wrong theme on load, and multi-brand theming.

### Answer
#### What the interviewer is really testing
- Using **CSS custom properties** as the theming foundation.
- Structuring **design tokens** (primitive → semantic → component).
- Handling **system preference, user override and persistence**.
- Avoiding **FOUC/flash of incorrect theme** with SSR.
- Accessibility (**contrast**) and scaling to **multiple brands**.

#### Key points
- **CSS variables** are inherited and can change at runtime without re-rendering React or regenerating CSS.
- **Token layers**: primitives (`--blue-600`) → semantic (`--color-bg`, `--color-text`, `--color-primary`) → optionally component tokens (`--button-bg`). Components use **semantic** tokens only.
- **System preference**: `@media (prefers-color-scheme: dark)` and `color-scheme: light dark` so form controls and scrollbars match.
- **User choice**: three options (light, dark, system), stored in `localStorage` (or a cookie for SSR), applied as `data-theme` on `<html>`.
- **No flash**: set the theme attribute **before first paint** with a tiny inline script in `<head>` (or server-render it from a cookie).
- **`light-dark()`** CSS function simplifies paired values in modern browsers.
- Dark mode isn't just inverting colours: adjust **contrast, elevation (lighter surfaces), shadows, images and saturated colours**.
- **Multi-brand**: same semantic tokens, different values per brand (`[data-brand='x']`), possibly loaded as separate CSS files.

#### Model answer
"I'd build theming on CSS custom properties with semantic tokens, because switching a theme then means changing a few variables at the root, without touching component code or re-rendering.

**1. Tokens in layers:**
```css
:root {
  /* primitives: raw palette */
  --gray-50: #f9fafb; --gray-900: #111827;
  --blue-500: #3b82f6; --blue-400: #60a5fa;

  /* semantic tokens: what components use */
  --color-bg: var(--gray-50);
  --color-surface: #ffffff;
  --color-text: var(--gray-900);
  --color-text-muted: #4b5563;
  --color-primary: var(--blue-500);
  --color-border: #e5e7eb;
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.12);
  color-scheme: light;
}

[data-theme='dark'] {
  --color-bg: #0b0f17;
  --color-surface: #151b26;           /* elevated surfaces get lighter, not shadowier */
  --color-text: #e5e7eb;
  --color-text-muted: #9ca3af;
  --color-primary: var(--blue-400);   /* lighter blue keeps contrast on dark backgrounds */
  --color-border: #263042;
  --shadow-card: 0 0 0 1px var(--color-border);
  color-scheme: dark;                 /* native controls, scrollbars match */
}

.card { background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-card); }
```
Components never reference raw colours, only semantic tokens, so adding a theme is just another block of values.

**2. System preference as the default:**
```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    /* same dark values as above (or share via a mixin/build step) */
  }
}
```
Modern alternative: `color: light-dark(#111827, #e5e7eb);` with `color-scheme: light dark`, which picks values automatically based on the active scheme.

**3. User toggle with three states (light, dark, system):**
```js
const KEY = 'theme';                                 // 'light' | 'dark' | 'system'
function applyTheme(choice) {
  const dark = choice === 'dark' ||
    (choice === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
function setTheme(choice) {
  try { localStorage.setItem(KEY, choice); } catch {}   // storage may be blocked
  applyTheme(choice);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if ((localStorage.getItem(KEY) ?? 'system') === 'system') applyTheme('system');
});
```
Offering 'system' matters: many users want the site to follow their OS automatically.

**4. Avoiding the flash of the wrong theme.** If the theme is applied after React loads, users see a white flash before switching to dark. Fix: a tiny blocking inline script in `<head>`, before CSS paints:
```html
<script>
  (function () {
    try {
      var c = localStorage.getItem('theme') || 'system';
      var dark = c === 'dark' || (c === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    } catch (e) {}
  })();
</script>
```
With SSR, an alternative is storing the choice in a cookie so the server renders `<html data-theme="dark">` directly. Frameworks' theme libraries (e.g. next-themes) implement this pattern; in React, avoid reading localStorage during render to prevent hydration mismatches (the toggle's label can render after mount).

**5. Dark mode design details:**
- Don't pure-invert: use dark greys (not #000) to reduce eye strain and allow elevation.
- Re-check **contrast** for every token pair (WCAG AA: 4.5:1 for body text).
- Desaturate bright brand colours that vibrate on dark backgrounds.
- Images and illustrations: provide dark variants via `<picture>` with `media="(prefers-color-scheme: dark)"`, or reduce brightness slightly.
- Shadows are less visible; use borders or lighter surfaces for elevation.

**6. Multi-brand theming:**
```css
[data-brand='acme']  { --color-primary: #e11d48; --font-display: 'Acme Sans'; --radius-md: 4px; }
[data-brand='globex'] { --color-primary: #059669; --font-display: 'Globex Serif'; --radius-md: 12px; }
```
Same components, different token values per brand, combinable with light/dark (`[data-brand='acme'][data-theme='dark']`). For large brands, generate token CSS from a single source (Style Dictionary or Tokens Studio exporting JSON) and load only the active brand's CSS file to avoid shipping every brand's values.

**Integration with tools:** Tailwind can map its colours to CSS variables (`bg-surface` → `var(--color-surface)`) so `dark:` variants aren't needed everywhere; CSS-in-JS themes can expose the same variables."

#### Another worked example: multi-brand e-commerce
"A retail group ran four brands on one React codebase. Initially brand styles were if-statements in components and every page shipped all four brands' styles. We moved to semantic tokens generated from a design-token JSON per brand, applied via `data-brand` and loaded as a separate CSS file per brand. Components stayed brand-agnostic, CSS per page dropped by ~70%, and launching a fifth brand became mostly a token file plus assets."

#### A third worked example: fixing the dark mode flash
"After launching dark mode, users reported a white flash on every navigation in our server-rendered app. The theme was applied in a `useEffect`. Moving the logic into an inline head script and persisting the choice in a cookie (so the server rendered the right `data-theme`) eliminated the flash and a hydration warning about the toggle icon."

#### Variations you might be asked
- "How do you theme third-party components?": override their CSS variables if exposed, or map their theme API to your tokens.
- "How do you test themes?": visual regression screenshots per theme, automated contrast checks on token pairs, and Storybook toolbars to switch themes.
- "Can CSS variables be animated?": registered properties via `@property` with a syntax can be transitioned; unregistered ones switch instantly.

#### Step-by-step framework
1. **CSS variables** as the foundation.
2. **Token layers** (primitive → semantic → component).
3. **System preference** and `color-scheme`.
4. **Three-state toggle** with persistence.
5. **No-flash initialisation** (inline script or cookie SSR).
6. **Design details, contrast and multi-brand scaling.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Toggle a dark class and override many rules | Semantic tokens swapped at the root |
| Only light/dark | Light, dark and system with persistence |
| Applies theme in useEffect | Inline head script / cookie SSR, no flash |
| Inverts colours | Elevation, contrast, desaturation, image variants |
| Hard-coded brand ifs | Token files per brand via data attributes |

#### Useful phrases
- "Components use semantic tokens, never raw colours."
- "The theme is set before first paint, so there's no flash."
- "I offer a 'system' option so the site follows the OS setting."
- "Brands share components and differ only in token values."

#### Common pitfalls
- **Flash of light theme.**
- **Hydration mismatches** from reading storage during render.
- **Poor contrast** in dark mode.
- **Hard-coded colours** bypassing tokens.

#### Follow-ups to expect (with sample answers)
- **"What does color-scheme do?"**
  "Tells the browser which schemes the page supports so built-in UI (form controls, scrollbars, default backgrounds) renders appropriately."
- **"Why not use a React context for theme colours?"**
  "Context changes re-render consumers; CSS variables switch instantly with no React work. Context can hold the user's choice, but values should be CSS."
- **"How do design tokens reach code?"**
  "Exported from design tools as JSON and transformed (Style Dictionary) into CSS variables, TS constants and platform formats."

#### What senior interviewers look for
- **Scalable token architecture.**
- **Polished UX** (no flash, system option).
- **Accessibility awareness.**

#### Practise it
1. Build a three-state theme toggle with no flash on reload.
2. Define primitive and semantic tokens for light and dark, and check contrast.
3. Explain multi-brand theming with tokens, out loud.

## Responsive images: srcset, sizes, picture and lazy loading
- id: fe-css-10
- roles: frontend, fullstack
- round: HTML_CSS
- difficulty: medium
- levels:
- tags: images, srcset, picture, lazy loading, performance

### Prompt
How do you serve images efficiently and responsively? Explain `srcset` with width descriptors, `sizes`, density descriptors, `<picture>` for art direction and formats (AVIF/WebP), lazy loading, `fetchpriority`, preventing layout shift, and how image CDNs fit in.

### Answer
#### What the interviewer is really testing
- Knowing how browsers **choose an image candidate** from `srcset` and `sizes`.
- **Format negotiation** and **art direction** with `<picture>`.
- **Loading strategy**: lazy vs eager, `fetchpriority`, preloading the LCP image.
- Preventing **CLS** with dimensions and `aspect-ratio`.
- Using **image CDNs/framework components** for automation.

#### Key points
- Images are often the **largest bytes** and the **LCP element**; responsive images save bandwidth and improve LCP.
- **`srcset` with `w` descriptors** lists available widths; **`sizes`** tells the browser how wide the image will display at each breakpoint, so it can pick the right file *before* layout.
- **Density descriptors** (`1x`, `2x`) for fixed-size images like logos/avatars.
- **`<picture>`**: `<source type="image/avif">` / `image/webp` for formats with fallback; `<source media>` for **art direction** (different crop on mobile).
- **`loading="lazy"`** for below-the-fold images; **never** lazy-load the LCP image.
- **`fetchpriority="high"`** (and/or `<link rel="preload" as="image" imagesrcset imagesizes>`) for the LCP image.
- **`width`/`height` attributes** (or CSS `aspect-ratio`) reserve space and prevent layout shift.
- **`decoding="async"`** for non-critical images; correct `alt` text for accessibility.
- **Image CDNs** (Cloudinary, imgix, Vercel/Next Image, Cloudflare Images) resize, compress and convert formats on demand.

#### Model answer
"Images usually dominate page weight and often are the largest contentful paint, so serving the right size and format at the right priority is one of the biggest performance wins.

**1. Resolution switching with srcset + sizes:**
```html
<img
  src="/img/hero-800.jpg"
  srcset="/img/hero-480.jpg 480w, /img/hero-800.jpg 800w, /img/hero-1200.jpg 1200w, /img/hero-1600.jpg 1600w"
  sizes="(min-width: 64rem) 50vw, 100vw"
  width="1600" height="900"
  alt="Woman hiking along a coastal path at sunset">
```
- `480w` etc. tell the browser each file's intrinsic width.
- `sizes` says how wide the image will render: half the viewport on large screens, full width otherwise. The browser needs this because it chooses the file before CSS layout is known.
- The browser multiplies the slot width by device pixel ratio and picks the smallest adequate candidate. On a 375px phone at 3x DPR with a full-width slot, it needs ~1125px, so it picks the 1200w file; on a 1440px desktop at 1x DPR with a 50vw slot (720px), it picks 800w.
- A wrong or missing `sizes` defaults to `100vw`, making desktop browsers download images much larger than needed for small slots (a very common mistake).

**2. Density descriptors for fixed-size images:**
```html
<img src="/avatar-48.png" srcset="/avatar-48.png 1x, /avatar-96.png 2x, /avatar-144.png 3x" width="48" height="48" alt="">
```

**3. <picture> for modern formats and art direction:**
```html
<picture>
  <source type="image/avif" srcset="/hero-800.avif 800w, /hero-1600.avif 1600w" sizes="100vw">
  <source type="image/webp" srcset="/hero-800.webp 800w, /hero-1600.webp 1600w" sizes="100vw">
  <img src="/hero-800.jpg" srcset="/hero-800.jpg 800w, /hero-1600.jpg 1600w" sizes="100vw"
       width="1600" height="900" alt="…">
</picture>

<picture>
  <source media="(max-width: 40rem)" srcset="/banner-portrait.jpg">   <!-- tight crop for phones -->
  <img src="/banner-wide.jpg" alt="New spring collection" width="1600" height="600">
</picture>
```
AVIF is often ~50% smaller than JPEG and WebP ~30% smaller at similar quality; the browser picks the first supported source. Art direction changes the crop, not just the size.

**4. Loading priority:**
```html
<!-- LCP hero: load eagerly and early -->
<img src="/hero.jpg" fetchpriority="high" ... >
<!-- or preload when the image is discovered late (e.g. CSS background, client-rendered) -->
<link rel="preload" as="image" imagesrcset="/hero-800.webp 800w, /hero-1600.webp 1600w" imagesizes="100vw" fetchpriority="high">

<!-- Below-the-fold images -->
<img src="/gallery-1.jpg" loading="lazy" decoding="async" width="600" height="400" alt="…">
```
- **Never lazy-load the LCP image**: native lazy loading waits until layout determines visibility, delaying LCP.
- CSS background images are discovered late (after CSS parses); use `<img>` for important images.

**5. Prevent layout shift:**
- Always set `width` and `height` attributes (the browser derives the aspect ratio before the image loads), with CSS `max-width: 100%; height: auto;`.
- Or CSS `aspect-ratio: 16 / 9` on the container; `object-fit: cover` for cropping.
- Placeholders (blurred low-quality previews or dominant colour) improve perceived performance.

**6. Image CDNs and framework components:**
- Generating every size and format by hand doesn't scale. Image CDNs transform on the fly via URL parameters (`?w=800&fm=avif&q=70`), cache at the edge, and negotiate formats via the `Accept` header.
- Next.js `<Image>` (and similar components in other frameworks) generate srcset/sizes, lazy-load by default, set dimensions, and support `priority` for the LCP image. I still need to provide an accurate `sizes` value.

**7. Accessibility:** meaningful `alt` text describing purpose; `alt=""` for decorative images so screen readers skip them; no text baked into images where avoidable.

**SVG and icons:** use SVG for icons and logos (resolution-independent, tiny), with `aria-hidden="true"` for decorative icons and accessible names for meaningful ones."

#### Another worked example: fixing a slow product page
"A product page's LCP was 4.2 s on mobile. The hero image was a 2400px JPEG (900 KB) for every device, lazy-loaded by a carousel library, and rendered as a CSS background. We switched to an `<img>` with AVIF/WebP srcset via our image CDN, accurate `sizes`, `fetchpriority="high"` on the first slide, and lazy loading only for other slides. Mobile LCP dropped to 1.9 s and image bytes on mobile fell by ~80%."

#### A third worked example: layout shift from ads and images
"A news site's CLS was 0.35 because article images loaded without dimensions, pushing text down as users started reading. Adding width/height from the CMS's image metadata and reserving space with aspect-ratio for embeds brought CLS under 0.05."

#### Variations you might be asked
- "What's the difference between srcset with x and w descriptors?": x targets device pixel ratios for fixed display sizes; w lists file widths and requires sizes, letting the browser handle varying layout sizes and DPRs.
- "How do you handle images in a CMS?": store originals, serve transformed versions via an image CDN, and require alt text in the CMS.
- "What image quality should you use?": often 60–80 for AVIF/WebP/JPEG; test visually, since perceptual quality varies by image.

#### Step-by-step framework
1. **Why images matter** (bytes, LCP, CLS).
2. **srcset + sizes** with selection logic.
3. **Density descriptors** for fixed-size images.
4. **picture for formats and art direction.**
5. **Loading priority** (lazy, fetchpriority, preload) and dimensions.
6. **CDNs, framework components, accessibility.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| One large image for all devices | srcset/sizes with correct candidate selection |
| Omits sizes | Accurate sizes per layout |
| Lazy-loads everything | Eager + fetchpriority for LCP, lazy for the rest |
| No dimensions | width/height or aspect-ratio to prevent CLS |
| Manual resizing | Image CDN / framework image component |

#### Useful phrases
- "sizes tells the browser how big the image will render before layout happens."
- "Never lazy-load the LCP image; give it fetchpriority high."
- "width and height attributes let the browser reserve space."
- "An image CDN handles sizes and formats automatically."

#### Common pitfalls
- **Missing or wrong sizes.**
- **Lazy-loaded hero images.**
- **CSS background images for LCP.**
- **Missing alt text.**

#### Follow-ups to expect (with sample answers)
- **"How does the browser pick from srcset?"**
  "It computes required pixels from the sizes slot width × device pixel ratio and picks an adequate candidate, possibly considering network conditions or cache."
- **"When would you use preload for images?"**
  "When the LCP image is discovered late, such as a CSS background or an image rendered by client-side JavaScript."
- **"How do you measure image impact?"**
  "Lighthouse/PageSpeed opportunities, the LCP element in DevTools, network panel image sizes, and RUM LCP data."

#### What senior interviewers look for
- **Correct mechanics** of responsive images.
- **Performance prioritisation.**
- **Automation and accessibility.**

#### Practise it
1. Write srcset/sizes for a hero and a 3-column card grid image.
2. Optimise a page's LCP image and measure before/after.
3. Explain how the browser chooses a srcset candidate, out loud.
