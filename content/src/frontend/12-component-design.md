# Frontend Engineer — FE System Design: Components

## Design an Autocomplete component (system design depth)
- id: 612cc598-5fd6-4d03-b71e-59661556a716
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_COMPONENT
- difficulty: medium
- levels:
- tags: system-design, autocomplete, RADIO
- companies: Apple, Meta, Anthropic

### Prompt
Design an Autocomplete (typeahead) component that will be used across a large product, for example search on a social network or an e-commerce site. Focus on architecture rather than code: requirements, component structure, data flow, caching, API design, performance, accessibility and how other teams will customise it. Use a framework such as RADIO.

### Answer
#### What the interviewer is really testing
- A **structured approach**: Requirements, Architecture, Data model, Interface (API), Optimisations (RADIO), and managing time across them.
- **Separating concerns**: input handling, data fetching and caching, results rendering, and keyboard/ARIA behaviour.
- **Network and caching strategy**: debouncing, cancellation, client cache with eviction, server-side ranking, prefetching.
- **Designing for reuse**: a component API that supports different data sources, custom rendering and controlled/uncontrolled usage, without becoming a giant prop list.
- **Non-functional depth**: performance at scale, accessibility, internationalisation, mobile, offline and failure modes.

#### Key points
- **Requirements (clarify for 3 to 5 minutes):**
  - Functional: suggestions as you type; result types (text, rich results with images, grouped categories); keyboard navigation; select fills input or navigates; recent searches; customisable rendering.
  - Non-functional: fast perceived response (suggestions within ~100 to 200ms of pausing), works on slow networks and low-end devices, accessible, i18n (IME, RTL, diacritics), reusable across products.
  - Scale: millions of users, so minimise request volume.
- **Architecture (components):**
  ```
  ┌──────────────── Autocomplete (controller) ────────────────┐
  │  Input field ──query──▶ Query controller (debounce, min   │
  │                         chars, abort)                      │
  │                               │                            │
  │                               ▼                            │
  │                         Cache (LRU by query) ◀── Data source│
  │                               │              (fn / URL)    │
  │                               ▼                            │
  │  Results popup ◀── state: {query, results, status,        │
  │  (list, groups,          activeIndex, open}                │
  │   item renderer)                                           │
  └────────────────────────────────────────────────────────────┘
  ```
  - A **headless core** (state machine + ARIA prop getters) and a **default UI** on top, so teams can restyle completely.
- **Data model:**
  - Client state: `query`, `results`, `status` (idle/loading/success/error), `activeIndex`, `isOpen`, `recentSearches`.
  - Cache: `Map<normalisedQuery, { results, timestamp }>` with LRU eviction and TTL.
  - Result item: `{ id, type, label, secondary?, imageUrl?, url?, highlightRanges? }`.
- **Interface (API):**
  - Component props: `source` (async function `(query, { signal }) => Promise<Item[]>` or a URL), `onSelect`, `renderItem`, `debounceMs`, `minChars`, `maxResults`, `placeholder`, `initialResults` (shown on focus), `cacheTTL`, controlled `value`/`onChange`.
  - Server API: `GET /suggest?q=ca&limit=8&locale=en-GB` returning ranked items; small payloads; cache headers.
- **Optimisations:**
  - Network: debounce (~150 to 300ms), min characters, abort stale requests, ignore out-of-order responses, client cache, reuse prefix results for local filtering when the server returned a complete set, HTTP caching/CDN for popular prefixes.
  - Rendering: limit results, memoize items, virtualize only if lists are long, avoid layout shift with a fixed-height popup.
  - Perceived speed: show cached or recent results instantly, prefetch the destination on highlight, keep previous results visible while loading (not a blank flash).
  - Accessibility: ARIA combobox pattern, `aria-activedescendant`, live region with result counts, visible focus, works with screen magnifiers (popup near input).
  - i18n: wait for IME composition to end, normalise diacritics/case, RTL layout.
  - Failure modes: offline → recent searches only; errors → keep typing usable, retry silently.

#### Model answer
"I'll use RADIO: requirements, architecture, data model, interface, then optimisations.

**Requirements.** I'd confirm: it suggests results as you type; results can be plain text or rich, like people with avatars and products with prices, possibly grouped; selecting either fills the input or navigates to the result; it shows recent searches on focus; it must be accessible and work on mobile. Non-functionally, it should feel instant, keep request volume low at scale, and be reusable by many teams with different data sources and designs. I'd also ask whether filtering is client-side, for small static lists, or server-side; I'll assume server-side, with a client-side mode as an option.

**Architecture.** I'd split it into a headless core and a default UI. The core is a state machine handling query changes, debouncing, fetching through a data-source function, caching, keyboard navigation and ARIA attributes. It exposes prop getters like `getInputProps`, `getListProps` and `getItemProps`. The default UI is an input plus a popup list using those getters. Teams that need full design control use the hook; most use the component. Libraries like Downshift and React Aria follow this split for good reason: behaviour and accessibility are hard, styling is product-specific.

The data flow is: the input updates the query immediately for responsiveness. A query controller applies minimum length and debounce, then checks the cache. On a miss, it calls the source with an `AbortSignal`, cancelling the previous request, and also checks a request id so a late response for an old query never overwrites newer results. Results go into the cache and state; the popup renders them.

**Data model.** Client state is the query, results, status, active index, open flag and recent searches. The cache is a map from normalised query, lowercased and trimmed, to results and timestamp, with LRU eviction at about 100 entries and a TTL of a few minutes, since suggestions change. Each result has an id, type, label, optional secondary text and image, a URL, and highlight ranges from the server so highlighting matches the server's matching logic, including fuzzy and diacritic matches.

**Interface.** The component takes a `source` function, `(query, { signal }) => Promise<Item[]>`, which keeps the component independent of any API. It takes `onSelect`, `renderItem` for custom rows, `debounceMs`, `minChars`, `initialResults` for the empty-focus state, and can be controlled or uncontrolled. For the server, I'd suggest `GET /suggest?q=&limit=&locale=` returning a small ranked list with highlight ranges, with `Cache-Control` set so a CDN can cache popular prefixes, which take a huge share of traffic.

**Optimisations.** For the network: debounce around 200 milliseconds, abort stale requests, cache client-side, and if the server says a result set for 'ca' is complete, filter 'cat' locally without a request. For perceived performance: show recent or cached results immediately on focus, keep the previous results visible with a subtle loading indicator rather than flashing empty, and prefetch the page for the highlighted result. For rendering: cap the results, memoize rows, and keep the popup a stable height to avoid layout shift. For accessibility: the combobox pattern with `aria-activedescendant` so focus stays in the input, a polite live region announcing result counts, and full keyboard support. For internationalisation: don't query during IME composition, normalise accents, and support RTL. For failures: when offline, show recent searches; on errors, keep the input usable and retry quietly on the next keystroke."

#### Another worked example
**E-commerce search versus a mention picker.** The same design adapts to different products:
- **E-commerce search bar (B2C, high traffic):** server-side ranking with popularity and personalisation; grouped results (Suggestions, Categories, Products with images); CDN caching for top prefixes; analytics on impressions and selections to improve ranking; selecting a product navigates, selecting a suggestion runs a search.
- **@mention picker in a B2B chat app:** the trigger is `@` inside a textarea rather than a dedicated input; the data set (workspace members) is often small enough to load once and filter on the client; the popup is positioned at the caret; selection inserts a token into the editor; recent collaborators rank first.
The headless core is reused in both; only the source, trigger and rendering differ. Pointing this out shows the API is designed well.

#### A third worked example
**Handling the race condition and caching, at design level.**
```
t=0ms    user types "c"   → below minChars, nothing
t=100ms  "ca"             → debounce timer starts
t=300ms  fire GET ?q=ca   (req #1)
t=350ms  "cat"            → debounce timer
t=550ms  fire GET ?q=cat  (req #2), abort #1
t=700ms  #2 returns       → render "cat" results, cache["cat"]
user deletes "t" → "ca" in cache? no (aborted) → fetch; if it had completed, render instantly
```
Two guards: abort the old request (saves bandwidth) and compare the response's query with the current query (protects against servers or caches that ignore aborts). Cache entries make backspacing instant.

#### Step-by-step framework
1. **Requirements**: functional, non-functional, scale; agree on scope (5 minutes).
2. **Architecture**: headless core + UI; diagram the data flow (10 minutes).
3. **Data model**: client state, cache structure, result item shape.
4. **Interface**: component props, hook API, server endpoint contract.
5. **Optimisations**: network, perceived performance, rendering.
6. **Accessibility and i18n**: combobox pattern, IME, RTL.
7. **Failure modes**: offline, errors, slow networks.
8. **Wrap up**: trade-offs made, what you'd measure (latency, selection rate), what you'd do next.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Jumps straight into JSX | Clarifies requirements, then RADIO structure |
| One monolithic component | Headless core with prop getters plus default UI |
| "Debounce the input" as the only optimisation | Debounce, abort, ordering guard, LRU cache, CDN, local prefix filtering |
| Hard-codes the API call | `source` function abstraction; server contract defined |
| Accessibility mentioned in one sentence | Combobox pattern, activedescendant, live region, IME, RTL |
| No failure discussion | Offline, errors, slow networks, stale results |

#### Useful phrases
- "Behaviour and accessibility are hard; styling is product-specific. So: headless core, default skin."
- "The source is a function, so the component doesn't care where results come from."
- "Two guards against races: abort the request and check the response matches the current query."
- "Show something useful instantly: recent searches or cached results."

#### Common pitfalls
- **Spending 20 minutes on code** in a design round.
- Ignoring **request volume** at scale (no debounce, no cache, no CDN).
- An API with **dozens of styling props** instead of render props or a headless hook.
- Forgetting **mobile**: virtual keyboard covering results, touch targets, `enterkeyhint`.
- Not discussing **ranking**: who decides order, and how highlight ranges are computed.
- No **metrics**: how would you know it's working?

#### Follow-ups to expect (with sample answers)
- **"How would you handle personalisation?"** — "Ranking happens on the server using the user's history; the client sends nothing extra besides auth. Personalised results shouldn't be CDN-cached, so I'd split cacheable global suggestions from a small personalised call, or cache per user in the client only."
- **"Client-side or server-side filtering?"** — "Client-side for small, static data like countries or workspace members, loaded once. Server-side for large or changing data. The `source` abstraction supports both."
- **"How would you measure success?"** — "Latency from keystroke to results (p50/p95), suggestion click-through rate, zero-result rate, and searches abandoned. Log impressions and selections with positions to improve ranking."
- **"How do you prevent layout shift and jank?"** — "Render the popup in a portal or absolutely positioned layer with a max height, limit results, reserve space for images, and avoid synchronous work in the input handler."
- **"How would you support thousands of options in a dropdown?"** — "Virtualize the list, keeping the active option rendered for `aria-activedescendant`, and set `aria-setsize` and `aria-posinset` so screen readers know the real size."

#### What senior interviewers look for
- **Clear structure** and time management.
- **Reusable architecture** with a well-reasoned API.
- **Depth in performance and network behaviour** at scale.
- **Accessibility and i18n** as first-class requirements, plus metrics and failure modes.

#### Practise it
- Talk through this design out loud in 30 minutes with a timer, drawing the diagram.
- Write the component's TypeScript props interface and the server contract.
- Checklist: requirements · headless + UI · data flow diagram · state and cache model · source abstraction · server API · debounce/abort/order guard · cache and CDN · perceived performance · a11y · i18n · failure modes · metrics.

#### Variations you might be asked
- "Design the search bar for a large e-commerce site."
- "Design an @mention feature for a chat app."
- "Design a location search with map integration."

## Design a Data Table for 100k rows
- id: c8a40575-e0bc-49ed-9379-f3d7fecde408
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_COMPONENT
- difficulty: hard
- levels:
- tags: system-design, table, performance
- companies: Stripe, Bloomberg, Atlassian

### Prompt
Design a reusable Data Table component that can handle 100,000 rows. It needs sticky headers and columns, virtual scrolling, sorting, multiple filters, column resizing and reordering, row selection, and export to CSV. Discuss architecture, data flow, performance and accessibility.

### Answer
#### What the interviewer is really testing
- The key early decision: **client-side vs server-side data operations** (sort, filter, paginate), and when each is appropriate.
- **Virtualization** in two dimensions, with sticky headers and pinned columns, and the layout choices that make it work.
- A **state model** for sorting, filters, column order/widths/visibility, and selection that can be persisted and shared via URL.
- **API design**: a headless table core (like TanStack Table) with column definitions, versus a rendered component.
- **Accessibility** of large grids (ARIA `grid` vs native `table`, keyboard navigation) and **export** without freezing the page.

#### Key points
- **Requirements to clarify:** where does the data come from and how often does it change? Do all 100k rows arrive at once? Editable cells? Row heights fixed? Grouping/aggregation? Who uses it (finance analysts at Bloomberg need keyboard-heavy, dense UIs)? Persistence of user's column settings?
- **Client vs server operations:**
  - **Client-side**: load all 100k rows (maybe 10 to 30MB JSON), sort/filter in memory (sort ~100k rows in tens of milliseconds; can move to a Web Worker). Instant interactions; heavy initial load; data must fit in memory.
  - **Server-side**: send sort/filter/page params; server returns a window. Scales to millions; each interaction has latency.
  - **Hybrid**: server-side for filtering/sorting, with virtual scrolling fetching row windows on demand (infinite row model, as in AG Grid's server-side model).
  - Make the table core agnostic: it consumes a "row model" either way.
- **Architecture:**
  ```
  Column defs + data source
          │
          ▼
  Table core (headless): state { sorting, filters, columnOrder, columnSizing,
                                 columnPinning, columnVisibility, rowSelection }
          │  row model pipeline: core → filtered → sorted → (grouped) → windowed
          ▼
  Renderer: header (sticky) | pinned-left | scrollable centre | pinned-right
            row virtualizer (vertical) + column virtualizer (horizontal, if many columns)
  ```
- **Data model:** `ColumnDef { id, header, accessor, cell?, sortFn?, filterFn?, size, minSize, enableResize, pin? }`; table state as plain serialisable JSON (good for URL and localStorage persistence); selection as a `Set` of row ids, plus an "all selected except" mode for server-side "select all 100k".
- **Rendering and layout:**
  - **Vertical virtualization**: render ~30 to 50 visible rows plus overscan; fixed row height makes it trivial, variable heights need measurement.
  - **Horizontal virtualization** if there are many columns (50+).
  - **Sticky header**: `position: sticky; top: 0` inside the scroll container.
  - **Pinned columns**: `position: sticky; left: <offset>` on cells, with a computed cumulative offset per pinned column, or separate synchronised panes.
  - Use **CSS grid or absolutely positioned rows with fixed column widths**; avoid native `table-layout: auto` (expensive reflow).
  - Column widths as CSS variables on the container, so resizing updates one variable rather than re-rendering every cell.
- **Interactions:** sort (click header, shift-click for multi-sort); filters per column type (text contains, number range, date range, enum multi-select), debounced; resize via pointer drag on header edges (update CSS variable during drag, commit to state on release); reorder via drag-and-drop on headers with keyboard alternatives; row selection with shift-click ranges and header checkbox (tri-state).
- **Export to CSV:** client-side for loaded data: generate in a Web Worker in chunks, escape quotes/commas/newlines, guard against CSV formula injection (prefix cells starting with `=`, `+`, `-`, `@`), download via `Blob`. For server-side data: trigger a backend export job and email/download link.
- **Accessibility:** native `<table>` semantics are best for read-only tables; for interactive spreadsheet-like behaviour, `role="grid"` with roving focus on cells, arrow keys, Home/End, Page Up/Down. With virtualization, set `aria-rowcount`/`aria-colcount` and `aria-rowindex`/`aria-colindex` on rendered rows/cells so screen readers know the true size. Sortable headers have `aria-sort`.

#### Model answer
"I'll start with requirements, because the biggest design decision depends on them: do we do sorting and filtering on the client or on the server?

If the 100,000 rows are a dataset the user loads once, like a day's transactions, and they fit in memory, maybe 20 megabytes, client-side operations give instant interactions. Sorting 100k rows takes tens of milliseconds, and I can move it to a Web Worker if it gets heavier. If the data is larger, changes constantly, or must be fetched with permissions applied, I'd go server-side: the table sends sort and filter state, and the server returns windows of rows as the user scrolls. I'd design the core to support both through a pluggable row model.

**Architecture.** I'd build a headless table core plus a renderer. The core takes column definitions and a data source, owns table state, and produces rows through a pipeline: raw rows, then filtered, then sorted, then optionally grouped, then the visible window. Each stage is memoized, so changing the sort doesn't re-run filtering. TanStack Table is an example of this model. The renderer is our design-system component using the core.

**State.** All table state is plain, serialisable data: sorting as a list of column and direction, filters per column, column order, widths, visibility, pinning, and selected row ids. Because it's serialisable, I can persist a user's column settings to localStorage or their profile, and put sort and filters in the URL so views are shareable, which analysts love.

**Rendering.** Rendering 100k rows is impossible, so I virtualize vertically: a scroll container with a spacer of total height, and only the visible rows plus overscan rendered, about 40 rows. With fixed row heights the maths is trivial; variable heights need measurement. If there are many columns, I'd also virtualize horizontally. I'd avoid native table auto-layout, because it reflows the whole table when content changes; instead, rows are absolutely positioned or use CSS grid with fixed column widths stored as CSS variables. That makes resizing cheap: dragging a column edge updates one variable on the container, and the browser re-lays-out without React re-rendering every cell. I only commit the width to state on pointer up.

The header is `position: sticky` at the top of the scroll container. Pinned columns are `position: sticky` with a left offset equal to the sum of the widths of the pinned columns before them, plus a shadow when scrolled. Sticky inside a virtualized grid is fiddly but works well in modern browsers.

**Interactions.** Clicking a header sorts; shift-click adds secondary sorts; headers get `aria-sort`. Filters depend on column type: text contains, number and date ranges, multi-select for enums, debounced, and shown as removable chips above the table. Column reordering is drag-and-drop on headers, with a keyboard-accessible 'Move left/right' in a column menu. Row selection supports shift-click ranges and a tri-state header checkbox. For server-side data, 'select all' means 'all matching the current filters', represented as a flag plus excluded ids, not 100k ids in memory.

**Export.** For client-side data, I'd generate CSV in a Web Worker so the UI doesn't freeze, apply current filters, sort and visible columns, escape commas, quotes and newlines, and neutralise formula injection by prefixing cells that start with `=`, `+`, `-` or `@`. For server-side data, the export is a backend job that returns a download link.

**Accessibility.** If the table is mostly for reading, native table semantics are best. For spreadsheet-style use, I'd use the ARIA grid pattern: one Tab stop, arrow keys between cells, Enter to edit. With virtualization, screen readers only see rendered rows, so I set `aria-rowcount` on the grid and `aria-rowindex` on each row, so they announce 'row 5,431 of 100,000'.

**Performance budgets.** Scrolling at 60 frames per second, sort or filter results under 100 milliseconds for client data, and memoized cell renderers so scrolling doesn't re-render unchanged cells."

#### Another worked example
**A finance blotter with live updates (Bloomberg-style).** 100k rows with prices updating several times a second.
- Push updates over WebSocket into a store keyed by row id; batch them per animation frame.
- Only visible rows re-render (virtualization plus per-row subscriptions or memoization keyed by row version).
- Sorting by a live column would make rows jump constantly; offer a "freeze sort" mode, or re-sort on a timer (every 2 seconds), and highlight changed cells with a short flash using CSS animations, not React state per cell.
- Dense layout, full keyboard navigation, column presets per user, and copy-to-clipboard of selected cell ranges as tab-separated text so it pastes into Excel.

#### A third worked example
**Server-side windowed row model, at design level.**
```
Viewport needs rows 4,800–4,850
  → block size 100: need block 48 (rows 4,800–4,899)
  → cache: Map<blockIndex, rows>, LRU of ~20 blocks
  → miss: GET /rows?offset=4800&limit=100&sort=amount:desc&filter=status:paid
  → render placeholders (skeleton rows) until the block arrives
Filter/sort change → clear cache, reset scroll to top, refetch block 0 + total count
```
Use keyset pagination on the server for deep offsets if possible, debounce block fetching during fast scroll, and cancel requests for blocks that scroll out of view.

#### Step-by-step framework
1. **Requirements**: data size and source, client vs server operations, editing, live updates, users.
2. **Architecture**: headless core with a row-model pipeline, plus renderer.
3. **State model**: serialisable sort, filters, columns, selection; persistence and URL.
4. **Rendering**: virtualization, layout without table auto-layout, sticky header and pinned columns.
5. **Interactions**: sort, filters, resize (CSS variables), reorder, selection.
6. **Export**: worker-based CSV with escaping and formula-injection protection, or server job.
7. **Accessibility**: native table vs ARIA grid, row/col counts and indexes, `aria-sort`.
8. **Performance budgets and testing**: frame rate, interaction latency, memory; profiling.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Assumes all data is client-side | Decides client vs server vs hybrid from requirements |
| Renders all rows with pagination as an afterthought | Virtualization with overscan; row model pipeline |
| Native table auto-layout | Fixed widths via CSS variables; cheap resizing |
| Selection as 100k ids for "select all" | Flag plus exclusions for server-side select all |
| CSV built on the main thread, no escaping | Worker, proper escaping, formula-injection protection |
| `div` grid without semantics | Native table or ARIA grid with aria-rowcount/rowindex and aria-sort |

#### Useful phrases
- "The first question is where sorting and filtering happen."
- "Table state is plain data, so it can live in the URL and be persisted."
- "Resizing updates a CSS variable, not every cell."
- "With virtualization, I tell screen readers the true size with aria-rowcount."

#### Common pitfalls
- Underestimating **memory and parse time** for 100k rows of JSON on mobile.
- **Re-rendering all visible cells** on every scroll frame because cell components aren't memoized.
- Sticky columns breaking because of **`overflow` on an intermediate ancestor**.
- **Filtering on every keystroke** without debouncing for large client data.
- **Formula injection** in CSV exports.
- Ignoring **keyboard users** in a component whose main users are power users.

#### Follow-ups to expect (with sample answers)
- **"Build or buy?"** — "For a complex grid with grouping, pivoting and editing, AG Grid or a similar library saves months. For a design-system table with our styling, TanStack Table (headless) plus TanStack Virtual is a good middle ground. Building from scratch only makes sense if requirements are unusual."
- **"How do you handle variable row heights?"** — "Estimate, measure rendered rows with ResizeObserver, maintain offsets with prefix sums, and binary search for the start index. Keep scroll anchored when rows above change height."
- **"How would you add inline editing?"** — "Cell-level edit mode on Enter or double-click, validation per column, optimistic save per cell with rollback, and keyboard behaviour like spreadsheets (Enter saves and moves down, Escape cancels)."
- **"How do you test performance?"** — "Profile with the Performance panel while scrolling and sorting; automate checks in CI with Playwright measuring long tasks, and track interaction latency with real-user monitoring."
- **"How do you make the URL state manageable?"** — "Serialise only non-default state, use compact encodings for filters, and version the format so old links still work."

#### What senior interviewers look for
- **Requirements-driven architecture** choices (client vs server).
- **Deep rendering knowledge**: virtualization, layout cost, sticky positioning.
- **Extensible API** and serialisable state.
- **Accessibility, security (CSV injection) and performance budgets** considered.

#### Practise it
- Talk through the design in 35 minutes with a diagram, then sketch the `ColumnDef` and state types.
- Build a prototype with TanStack Table + Virtual for 100k rows and profile scrolling.
- Checklist: client vs server decision · headless core · row-model pipeline · serialisable state · vertical/horizontal virtualization · sticky header/pinned columns · CSS-variable widths · multi-sort · typed filters · selection model · worker CSV export · grid a11y with counts · budgets.

#### Variations you might be asked
- "Design a spreadsheet like Google Sheets."
- "Design a log viewer for millions of lines."
- "Design an admin table with server-side filters and saved views."

## Design a Rich Text Editor (block-based, Notion-style)
- id: 8606510c-5a30-44fb-b74f-3ca82cdb03df
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_COMPONENT
- difficulty: hard
- levels:
- tags: system-design, editor, CRDT
- companies: Notion, Anthropic

### Prompt
Design a block-based rich text editor like Notion. Documents are made of blocks (paragraphs, headings, lists, to-dos, images, code, embeds) that can be nested, reordered by drag-and-drop, and transformed with a slash command menu. Cover the document model, how editing works with `contenteditable`, undo/redo, persistence, and where real-time collaboration fits.

### Answer
#### What the interviewer is really testing
- Designing a **document model** that is separate from the DOM: a tree of typed blocks with rich-text content (text plus marks).
- Understanding why **raw `contenteditable` is hard** (browser inconsistencies, IME, selection) and how editors control it: model → view rendering, input interception via `beforeinput`, a selection model.
- **Operations/transactions** as the unit of change, enabling **undo/redo**, persistence and collaboration.
- **Collaboration boundaries**: OT vs CRDT, what's merged at which level, presence and cursors.
- **Performance** for long documents, **extensibility** (plugins for block types), and **accessibility**.

#### Key points
- **Requirements:** block types; nesting (toggle lists, columns); inline formatting (bold, italic, code, links, mentions); slash menu; drag to reorder; copy/paste from web and Word; markdown shortcuts (`# ` → heading); undo/redo; autosave; offline; real-time collaboration (maybe later); large documents (thousands of blocks); mobile.
- **Document model:**
  ```
  Page { id, title, rootBlockIds: [...] }
  Block { id, type: 'paragraph' | 'heading' | 'todo' | 'image' | ..., props: { level?, checked?, src? },
          content: RichText (for text blocks), childIds: [...], parentId }
  RichText = [{ text: 'Hello ', marks: [] }, { text: 'world', marks: ['bold', { link: 'https://…' }] }]
  ```
  - Normalised by id (`blocks: Record<id, Block>`), with ordered `childIds`. Moves and nesting are id-list operations; block-level identity enables per-block rendering, comments, permissions and syncing.
  - Ordering for sync: fractional indexes (or a CRDT sequence) instead of array positions, so concurrent inserts don't conflict.
- **Editing architecture (model → view):**
  - The model is the source of truth; the DOM is a rendering. Each block renders a `contenteditable` region (Notion-style, one editable per block) or the whole document is one `contenteditable` (ProseMirror/Lexical/Slate style). Per-block editables simplify block operations but make cross-block selection harder; one editable handles cross-block selection natively.
  - Intercept input with **`beforeinput`** events (`inputType`: `insertText`, `deleteContentBackward`, `insertParagraph`, `formatBold`, `insertFromPaste`...), translate to model operations, apply, re-render. Let the browser handle **IME composition** natively, then reconcile on `compositionend`.
  - **Selection model**: `{ anchor: { blockId, offset }, focus: { blockId, offset } }`, mapped to and from DOM selection after every render.
  - Prefer building on a proven engine (ProseMirror, Lexical, Slate, TipTap) and say so; the design discussion is about the model and boundaries.
- **Operations and transactions:** every change is an operation (`insertText`, `deleteText`, `addMark`, `splitBlock`, `mergeBlocks`, `moveBlock`, `setBlockType`, `setProps`). A user action produces a **transaction** (a list of ops) applied atomically.
- **Undo/redo:** stacks of transactions with their inverses; group typing into chunks (by time gap or word boundary); in collaboration, undo only your own operations (selective undo).
- **Persistence:** save operations (or block diffs) incrementally, debounced, via an API that accepts batches; keep an offline queue in IndexedDB; server stores blocks and an operation log; version history from snapshots plus ops.
- **Collaboration:**
  - **OT** (Google Docs): a central server transforms concurrent operations against each other; needs a server in the loop.
  - **CRDT** (Yjs, Automerge): data structures that merge concurrent changes deterministically without a central authority; great for offline and peer-to-peer; more memory.
  - **Notion-like pragmatic approach**: block-level last-write-wins for properties and structure, with text inside a block merged by OT/CRDT. Different granularity for different data.
  - **Presence**: cursors and selections via an ephemeral channel (not persisted).
- **Rendering performance:** memoize per block (re-render only changed blocks), virtualize very long pages (careful with selection and find), lazy-load heavy blocks (embeds, code highlighting).
- **Extensibility:** block types as plugins: `{ type, schema, render, toMarkdown, fromHTML, slashMenuEntry, keyboardShortcuts }`.
- **Paste:** sanitise HTML (allowlist), map to blocks and marks, handle images (upload), plain-text fallback.
- **Accessibility:** editable regions with `role="textbox"` and `aria-multiline` (native for contenteditable), headings as real headings, toolbar with roving tabindex, keyboard alternatives for drag-and-drop (move block up/down shortcuts), slash menu as an accessible listbox.

#### Model answer
"I'll scope first. I'll assume: paragraphs, headings, lists, to-dos, code, images and embeds; nesting; inline marks and links; a slash menu; markdown shortcuts; drag to reorder; undo/redo; autosave with offline support; and collaboration designed for, maybe shipped later. Pages can have thousands of blocks.

**Document model.** The model is the heart of it, and it's independent of the DOM. A page is a tree of blocks. Each block has an id, a type, type-specific properties like heading level or checked state, rich-text content for text blocks, and an ordered list of child ids. I store blocks normalised by id. Rich text is an array of text runs with marks, like bold or link. Block identity is valuable: it lets me render, sync, comment on and permission individual blocks, and moving a block is just moving an id between lists.

**Editing.** The DOM is a projection of the model. Raw `contenteditable` lets the browser mutate the DOM in inconsistent ways, so editors intercept input. I'd listen to `beforeinput`, which tells me the intent, like insertText, deleteContentBackward or insertParagraph, prevent the default where I can, convert the intent into model operations, apply them, and re-render. The exception is IME composition for languages like Japanese: I let the browser compose, then read the result at composition end, because interrupting composition breaks typing.

The selection lives in the model too, as block id plus offset for the anchor and focus, mapped to the DOM selection after each render. Realistically, I'd build on ProseMirror, Lexical or TipTap, which solve these problems, and focus our design on the block model, plugins and sync.

**Operations.** Every change is an operation: insert text, delete text, add mark, split block, merge blocks, move block, change type, set property. A user action creates a transaction, a list of operations applied atomically. This one abstraction powers undo, persistence and collaboration. Pressing Enter in the middle of a paragraph is a 'split block' operation; Backspace at the start is 'merge with previous'; typing '# ' is 'set type heading' plus 'delete text'.

**Undo/redo.** Each transaction stores its inverse. Typing is grouped into undo steps by pauses or word boundaries, so undo doesn't remove one character at a time. With collaboration, undo must only revert my own operations, transformed against others' later changes.

**Persistence.** Transactions are queued, debounced and sent in batches. The queue is in IndexedDB, so offline edits survive a refresh and sync later. The server stores current blocks plus an operation log, and periodic snapshots enable version history.

**Collaboration.** There are two main approaches. OT, as Google Docs uses, has a central server transform concurrent operations. CRDTs, like Yjs, merge changes deterministically on every client without a central authority, which suits offline. A pragmatic Notion-like design uses different granularity: structure and block properties use last-write-wins per field, which is fine because conflicts are rare and visible, while text inside a block uses a CRDT or OT, because concurrent typing in one paragraph is common. Block ordering uses fractional indexes so concurrent inserts don't collide. Presence, meaning other people's cursors, travels over a separate ephemeral channel and is never persisted.

**Performance.** Each block component is memoized and subscribes to its own block, so typing re-renders one block. For very long pages, I'd virtualize offscreen blocks, though it complicates selection across blocks and the browser's find-in-page, so I'd only do it past a threshold. Heavy blocks like embeds and syntax-highlighted code load lazily.

**Extensibility.** Block types are plugins defining their schema, renderer, slash-menu entry, shortcuts, and conversions to and from HTML and Markdown for copy and paste. Paste goes through a sanitiser with an allowlist, maps HTML to blocks, and uploads pasted images.

**Accessibility.** Text blocks are editable regions announced as text boxes, headings render as real headings, the toolbar uses a roving tabindex, the slash menu is a listbox with `aria-activedescendant`, and drag-and-drop has keyboard equivalents such as a shortcut to move the block up or down."

#### Another worked example
**Tracing one keystroke through the system.** The user presses Enter in the middle of "Hello world" (after "Hello").
```
beforeinput { inputType: 'insertParagraph' }  → preventDefault
  → command: splitBlock({ blockId: 'b1', offset: 5 })
  → transaction: [ updateContent(b1, 'Hello'), insertBlock(b2, after b1, type paragraph, 'world'),
                   setSelection(b2, 0) ]
  → apply to model (immutable update), push inverse onto undo stack
  → React re-renders b1 and inserts b2 (memoized others untouched)
  → selection mapped to DOM: caret at start of b2
  → persistence queue: enqueue transaction; debounce 500ms → POST /ops
  → collaboration: broadcast ops to peers; peers apply (transformed/merged)
```
If the block were a list item, the plugin for list items handles `splitBlock` differently (new list item; Enter on an empty item exits the list). Plugin-level command overrides keep the core generic.

#### A third worked example
**Choosing CRDT versus server-authoritative OT for a B2B product.**
- **CRDT (Yjs)**: offline-first, peer-to-peer possible, mature React bindings (y-prosemirror, Lexical's Yjs plugin); costs: document size grows with history (needs garbage collection and snapshots), harder server-side validation and permissions (any client can produce any change).
- **Server-authoritative OT or a central sequencer**: the server validates and orders every operation, which helps with permissions, audit logs and schema validation, which enterprise customers care about; costs: needs connectivity, more server complexity.
- **Hybrid**: CRDT for text, server validation of structural operations, and server snapshots for history. State the trade-off and pick based on offline needs and compliance requirements.

#### Step-by-step framework
1. **Requirements**: block types, nesting, editing features, collaboration, offline, scale.
2. **Document model**: normalised block tree, rich-text runs with marks, ordering strategy.
3. **Editing architecture**: model → view, `beforeinput` interception, IME, selection model; build on an engine.
4. **Operations and transactions** as the core abstraction.
5. **Undo/redo** with inverses and grouping.
6. **Persistence**: batched ops, offline queue, server log and snapshots.
7. **Collaboration**: OT vs CRDT, granularity per data type, presence.
8. **Performance, extensibility, paste, accessibility**: memoized blocks, plugins, sanitising, keyboard alternatives.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Store the page as one HTML string | Normalised block tree with typed props and rich-text runs |
| Let `contenteditable` mutate the DOM freely | Model → view with `beforeinput` interception and IME care |
| Undo by snapshotting the whole document | Transactions with inverses, grouped typing, selective undo |
| "Add WebSockets" for collaboration | OT vs CRDT trade-offs, granularity, presence channel |
| Re-render the whole page per keystroke | Per-block memoization and subscriptions |
| Paste raw HTML | Sanitise with allowlist, map to blocks, upload images |

#### Useful phrases
- "The DOM is a projection of the model, never the source of truth."
- "Every change is an operation; undo, saving and collaboration all build on that."
- "I'd let the browser own IME composition and reconcile afterwards."
- "Different data needs different merge rules: last-write-wins for block properties, CRDT for text."

#### Common pitfalls
- **Designing around the DOM** instead of a model.
- Ignoring **IME and mobile keyboards**, where `keydown` is unreliable.
- Using **array indexes for ordering** in a synced document.
- **Undo that also undoes collaborators' changes**.
- Underestimating **paste** from Word/Google Docs, which brings messy HTML.
- Proposing to **build the editing engine from scratch** without acknowledging the cost.

#### Follow-ups to expect (with sample answers)
- **"One contenteditable or one per block?"** — "One per block makes block-level operations and drag-and-drop simple, and isolates rendering, but cross-block selection and copy need custom handling. One editable for the document gives native cross-block selection but makes block operations go through the engine. Notion uses per-block; ProseMirror and Lexical use one root. I'd pick based on how important cross-block selection is."
- **"How would comments on text ranges work?"** — "Store comment anchors as positions that move with edits: in a CRDT, relative positions; in OT, map positions through each transaction. Render highlights as decorations, not as marks in the content."
- **"How do you handle large documents?"** — "Lazy-load blocks below the fold from the server, virtualize rendering beyond a threshold, and keep per-block memoization. Load nested toggles' children only when expanded."
- **"How do you export to Markdown or PDF?"** — "Each block plugin implements `toMarkdown` and `toHTML`; export walks the tree. PDF can be generated server-side from HTML."
- **"How do you test an editor?"** — "Unit-test operations and their inverses (apply then invert returns the original), property-based tests for random edit sequences, and Playwright tests for real typing, IME (where possible), paste and undo in multiple browsers."

#### What senior interviewers look for
- **A strong, DOM-independent model** and operation abstraction.
- **Realism about contenteditable** and building on proven engines.
- **Clear collaboration trade-offs** and boundaries.
- **Extensibility, performance and accessibility** considered as a platform.

#### Practise it
- Explain this design in 40 minutes with diagrams of the block model and the keystroke flow.
- Build a toy editor with Lexical or TipTap: custom block type, slash menu, markdown shortcut.
- Checklist: requirements · normalised block tree · rich-text runs · fractional ordering · model→view · beforeinput · IME · selection model · operations/transactions · undo grouping · offline queue · OT vs CRDT · presence · memoized blocks · plugins · paste sanitising · a11y.

#### Variations you might be asked
- "Design Google Docs."
- "Design a collaborative whiteboard like Figma or Miro."
- "Design a Markdown editor with live preview."

## Design a Modal component (advanced)
- id: a9baaea4-72f8-4bca-9917-0e1bb88c0bed
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_COMPONENT
- difficulty: hard
- levels:
- tags: system-design, modal, a11y
- companies: Apple, Stripe

### Prompt
Design the Modal (dialog) component for a design system used by dozens of product teams. Go beyond a basic implementation: nested and stacked modals, focus management, route-based modals (a URL that opens a modal over a page), the animation lifecycle, the API, and how you'd prevent teams from misusing it.

### Answer
#### What the interviewer is really testing
- Thinking at **design-system level**: an API that's hard to misuse, composition, variants, and governance, not just "a div with a backdrop".
- **Layering architecture**: portals, a modal stack manager, z-index strategy (or the native top layer), and how modals interact with toasts, popovers and dropdowns.
- **Focus and accessibility** at full depth: focus in/trap/restore, `inert`, nested modals, `alertdialog`, screen reader announcements.
- **Route-based modals**: URL as state, deep links, Back button behaviour, and rendering the background page.
- **Animation lifecycle**: mount → enter → open → exit → unmount, with reduced motion and interruption.

#### Key points
- **Requirements:** variants (dialog, confirm/alert dialog, drawer/sheet, full-screen on mobile); sizes; nested modals (a confirm inside an edit modal); dismissal rules; route-based modals; animations; SSR-safe; works with the existing toast and popover systems; accessible by default; small bundle.
- **Build on the platform:** native `<dialog>` with `showModal()` gives the top layer (no z-index wars), inert background, Escape (`cancel` event) and `::backdrop`. Decide whether to use it as the foundation or implement a portal-based layer; state the trade-off (native: less code, top layer; custom: more control over animation and stacking order across overlay types, older browser support).
- **Architecture:**
  ```
  <OverlayProvider>                    ← one per app
    stack: [{ id, type: 'modal', onDismiss, ... }]
    ├── App (inert when any modal open)
    └── Portal root (or top layer)
         ├── Modal A (z by stack index)
         └── Modal B (top: receives Escape, focus trap)
  ```
  - A **stack manager** knows the order of open overlays: only the top one handles Escape and outside clicks; scroll lock is reference-counted; the background and lower modals are `inert`.
  - **Popovers/dropdowns inside a modal** must render inside the modal's layer (or above it), otherwise they appear behind it or get inerted; provide a context so nested portals target the right container.
- **API (compound components):**
  ```
  <Dialog open onOpenChange>
    <Dialog.Trigger />            (optional, uncontrolled mode)
    <Dialog.Content size="md" initialFocus={ref} dismissible>
      <Dialog.Title /> <Dialog.Description />
      ...body...
      <Dialog.Footer><Dialog.Close /> <Button /></Dialog.Footer>
    </Dialog.Content>
  </Dialog>
  ```
  - Title is **required** (dev warning if missing) because `aria-labelledby` depends on it; a `visuallyHidden` option when design wants no visible title.
  - Separate `AlertDialog` for destructive confirms: `role="alertdialog"`, not dismissible by backdrop, initial focus on the safe action.
  - Imperative helper for confirms: `const ok = await confirm({ title, body, confirmLabel, tone: 'danger' })`.
- **Focus:** on open, focus `initialFocus` or the first focusable element or the content; trap within the top modal; on close, restore to the trigger (or a fallback if the trigger no longer exists, e.g. a deleted row).
- **Route-based modals:** the URL encodes the modal (`/photos/123` opened from the feed shows a modal over the feed; loaded directly, it shows a full page). Implementations: Next.js intercepting + parallel routes, React Router's "background location" pattern. Back closes the modal; closing via X calls `router.back()` if the modal was opened in-app, otherwise navigates to the parent route.
- **Animation lifecycle:** states `closed → opening → open → closing → closed`; keep mounted during exit; drive by CSS transitions/animations with `onAnimationEnd` fallback timers; interruption (reopen during closing) must reverse cleanly; `prefers-reduced-motion` → fade only or none. Native `<dialog>` can animate with `@starting-style` and `transition-behavior: allow-discrete`.
- **Mobile:** full-screen or bottom sheet on small screens; iOS scroll-lock quirks; virtual keyboard resizing (`visualViewport`, `dvh` units); safe-area insets.
- **Governance:** usage guidelines (when not to use a modal), lint rules or dev warnings (missing title, nested more than 2 deep, modal opened on page load), Storybook docs with do/don't, accessibility tests in CI.

#### Model answer
"I'd approach this as a design-system problem: the goal isn't only a working modal, but one that dozens of teams can use correctly without thinking about focus, layering or accessibility.

**Requirements.** Variants: a standard dialog, an alert dialog for destructive confirmations, a side drawer, and a full-screen sheet on mobile. It must support nesting, such as a confirm inside an edit dialog, route-based modals, enter and exit animations, SSR, and play well with our toasts, tooltips and dropdowns.

**Foundation.** I'd seriously consider building on the native `<dialog>` element with `showModal()`. It puts the dialog in the browser's top layer, so z-index conflicts disappear, makes everything else inert, and handles Escape. The trade-off is less control over stacking relative to other overlays, and animation needs newer CSS. If we need to support older browsers or tight control over overlay ordering, a portal-based layer with our own stack manager is the alternative. Either way, the API stays the same, so we can switch underneath.

**Architecture.** An `OverlayProvider` at the app root keeps a stack of open overlays. Only the top overlay responds to Escape and outside clicks, so pressing Escape in a nested confirm closes only the confirm. Scroll lock is reference-counted, so closing the inner modal doesn't unlock the page while the outer is open. The app root and lower modals are made `inert`. A subtle but important point: dropdowns and tooltips opened inside a modal must portal into the modal's layer, not the body, otherwise they render behind it or get inerted. So the modal provides a portal-container context that nested overlays use.

**API.** Compound components: `Dialog`, `Dialog.Trigger`, `Dialog.Content`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`, `Dialog.Footer`. It works controlled with `open` and `onOpenChange`, or uncontrolled via the trigger. The title is required, because it labels the dialog for screen readers; if design wants no visible title, it can be visually hidden, and we warn in development when it's missing. There's a separate `AlertDialog` for destructive actions: it uses `role="alertdialog"`, isn't dismissible by clicking outside, and focuses the safe action first. For simple confirmations I'd offer an imperative `await confirm({...})` that returns a promise, because it makes common code much cleaner.

**Focus.** On open, focus goes to an explicit `initialFocus`, or the first focusable element, or the content itself for long, read-only dialogs. On close, focus returns to the trigger. If the trigger no longer exists, for example the dialog deleted the row containing it, we accept a `finalFocus` fallback, so focus never drops to the body.

**Route-based modals.** For something like opening a photo from a feed, the URL should change to `/photos/123` so it's shareable and Back closes it. Opened in-app, it renders as a modal over the feed; loaded directly, the same URL renders a full page. In Next.js that's intercepting plus parallel routes; in React Router, the 'background location' pattern, where the previous location is stored in navigation state and used to render the page underneath. Closing the modal calls `history.back()` if it was opened in-app, otherwise navigates to the parent route.

**Animation lifecycle.** The modal has states: closed, opening, open, closing. It stays mounted during closing so the exit animation can play, and unmounts on animation end, with a timer fallback in case the event never fires. If it's reopened mid-close, the animation reverses rather than jumping. With reduced motion, we use a short fade or nothing.

**Mobile.** On small screens, dialogs become bottom sheets or full-screen, use dynamic viewport units so the virtual keyboard doesn't hide the footer, and respect safe-area insets.

**Governance.** We document when not to use a modal: for non-blocking messages, use a toast; for complex flows, use a page. Development warnings catch a missing title or modals nested more than two deep. Every variant has Storybook stories with automated accessibility checks and interaction tests for focus behaviour, and visual regression tests for animation end states."

#### Another worked example
**Route-based modal with React Router's background location:**
```tsx
// Opening: <Link to={'/photos/' + id} state={{ background: location }}>
function AppRoutes() {
  const location = useLocation();
  const background = location.state?.background;
  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/" element={<Feed />} />
        <Route path="/photos/:id" element={<PhotoPage />} />   {/* direct load: full page */}
      </Routes>
      {background && (
        <Routes>
          <Route path="/photos/:id" element={<PhotoModal onClose={() => navigate(-1)} />} />
        </Routes>
      )}
    </>
  );
}
```
The feed keeps rendering underneath (with its scroll position) because the main `Routes` uses the background location. Refreshing the page loses the in-memory state, so the URL renders the full page, which is the right fallback.

#### A third worked example
**A Stripe-style flow: modal versus page.** A "Create payment link" flow starts as a modal with three fields. Over time, product adds pricing tiers, tax settings and preview. The design system guidance should push this to a full-page or full-screen focused view once it has multiple steps, scrolling content or needs to be linkable. Signs a modal is wrong: it scrolls internally on desktop, contains its own navigation, opens other modals routinely, or users lose work when they click outside. Making the modal's default `dismissible` behaviour ask for confirmation when the form is dirty (an `onBeforeDismiss` hook) prevents data loss in the meantime.

#### Step-by-step framework
1. **Requirements**: variants, nesting, routing, animation, mobile, integration with other overlays.
2. **Foundation**: native `<dialog>` vs portal layer, with trade-offs.
3. **Architecture**: overlay provider, stack manager, inert, scroll lock counting, nested portal containers.
4. **API**: compound components, required title, AlertDialog, imperative confirm, controlled/uncontrolled.
5. **Focus**: initial, trap, restore, fallback.
6. **Route-based modals**: URL design, rendering the background, Back behaviour.
7. **Animation lifecycle** and reduced motion; mobile adaptations.
8. **Governance and testing**: guidelines, dev warnings, Storybook a11y and interaction tests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| A component with `isOpen` and `children` | Compound API, required title, AlertDialog, imperative confirm |
| z-index 9999 | Top layer or a stack manager with ordered layers |
| Escape closes all modals | Only the top overlay handles Escape and outside clicks |
| Dropdown inside modal renders behind it | Nested portal container context |
| No URL story | Route-based modals with background rendering and Back handling |
| Unmount immediately on close | Lifecycle states with exit animation and interruption |

#### Useful phrases
- "The best modal API makes the accessible thing the default and the wrong thing hard."
- "Only the top of the stack listens for Escape."
- "Overlays inside a modal portal into the modal, not the body."
- "If it needs a URL, steps and scrolling, it probably wants to be a page."

#### Common pitfalls
- **Global z-index escalation** between teams' overlays.
- **Scroll lock** released by an inner modal while the outer is still open.
- **Focus restore to a removed element**.
- Route modals that **break on refresh** or trap the Back button.
- **Animations that leave the modal mounted** forever if `animationend` never fires.
- **No governance**, so teams build their own modals and the problems come back.

#### Follow-ups to expect (with sample answers)
- **"How do toasts interact with modals?"** — "Toasts render in their own top-level region that isn't inerted by modals, so they stay visible and announced, but they shouldn't steal focus. With native dialogs, toasts may need to be shown inside the top layer as a popover (`popover` attribute) to appear above the dialog."
- **"How do you handle unsaved changes?"** — "An `onBeforeDismiss` hook that can return false or a promise; the modal shows a confirm before closing via backdrop, Escape or route change."
- **"How do you test focus management in CI?"** — "Storybook interaction tests and Playwright: open with keyboard, assert focus on the expected element, Tab cycles inside, Escape closes, focus returns to the trigger. Axe checks for labels."
- **"How do you version breaking changes?"** — "Semver for the design system, codemods for API changes, a deprecation period with dev warnings, and usage analytics to find teams on old APIs."
- **"Should modals open on page load?"** — "Rarely. It's disorienting, bad for screen reader users and often blocked by guidelines; we warn in development when a modal opens without a user action."

#### What senior interviewers look for
- **Platform-level thinking**: stack management, layering across overlay types.
- **Deep accessibility** handled by the system, not left to each team.
- **Routing integration** and real product cases.
- **Governance**: guidance, warnings, testing and versioning for a shared component.

#### Practise it
- Explain the design in 30 minutes with the stack diagram.
- Build a minimal overlay provider with a stack, nested confirm, and reference-counted scroll lock.
- Checklist: variants · native vs portal · stack manager · inert · scroll lock counting · nested portals · compound API · required title · AlertDialog · confirm helper · focus in/trap/restore/fallback · route modals · lifecycle animation · mobile · governance.

#### Variations you might be asked
- "Design the popover/tooltip system for a design system."
- "Design a drawer component that can be opened from anywhere."
- "How would you migrate 40 teams from their own modals to the shared one?"

## Design a Toast/Notification system
- id: 7b2acec1-60a8-4c57-98f3-064cd12d39fa
- roles: frontend, fullstack, ai
- round: FE_SYSTEM_DESIGN_COMPONENT
- difficulty: medium
- levels:
- tags: system-design, global-state, a11y

### Prompt
Design a toast/notification system for a large web application used by many teams. Cover stacking and queueing, de-duplication, priority, accessibility, how it's triggered from anywhere (including non-React code and server events), and how it relates to a persistent notification centre.

### Answer
#### What the interviewer is really testing
- **System thinking** beyond a component: a notification service with a store, policies (queue, dedup, priority, rate limits) and renderers.
- **Clear separation** between transient toasts and persistent notifications (inbox/notification centre), and between UI feedback and server-originated events.
- **API design** for many teams: a small imperative API, typed variants, actions, promise toasts, and guardrails.
- **Accessibility**: live region politeness, timing (WCAG 2.2.1), focus, keyboard access to actions.
- **Operational concerns**: multi-tab behaviour, real-time delivery, analytics, i18n, theming.

#### Key points
- **Requirements:** types (success, info, warning, error, loading); actions (Undo, View); promise toasts; positions; max visible; queueing beyond that; de-duplication; priority (errors before info); persistent errors; triggered from React, plain modules, and server pushes; a notification centre for important events; i18n; theming; mobile layout.
- **Architecture:**
  ```
  Producers                      Notification service (framework-agnostic store)
  - components: toast.success()  ┌──────────────────────────────────────────┐
  - API client interceptors ───▶ │ policies: dedup → priority queue → limit │
  - WebSocket events             │ timers (pause/resume), lifecycle states  │
  - service worker messages      └───────────────┬──────────────────────────┘
                                                  │ subscribe (useSyncExternalStore)
                                    ┌─────────────┴─────────────┐
                                    ▼                           ▼
                             <Toaster/> (transient)    <NotificationCenter/> (persistent,
                             live regions, portal       server-backed, unread counts)
  ```
- **Data model:** `Toast { id, dedupeKey?, type, title, description?, action?, priority, duration, createdAt, state: 'queued' | 'visible' | 'leaving', count }`.
- **Policies:**
  - **De-duplication:** same `dedupeKey` (or same type + message) within a window updates the existing toast and increments a counter ("Network error ×3") instead of stacking.
  - **Priority queue:** errors > warnings > success > info. Visible slots (e.g. 3) are filled by priority, then age. A new error can push out (or queue ahead of) info toasts.
  - **Rate limiting:** cap toasts per time window per source, to stop loops spamming the UI.
  - **Durations:** scale with text length; errors and toasts with actions persist until dismissed; pause on hover, focus and hidden tabs.
  - **Update in place:** promise toasts (`loading → success/error`) and progress reuse the same id.
- **API:** `toast(msg, opts)`, `toast.success/error/warning/info`, `toast.promise(p, msgs)`, `toast.dismiss(id)`, `toast.update(id, patch)`. Callable outside React. Typed options; i18n keys or already-translated strings; development warnings for misuse (e.g. form validation errors shown as toasts).
- **Accessibility:** the region is always rendered; polite (`role="status"`) for most, assertive (`role="alert"`) only for errors; never move focus; a hotkey (e.g. F6/F8) or landmark to reach toasts with actions; enough time; actions also available elsewhere (Undo in a menu or "Recently deleted").
- **Notification centre vs toasts:** toasts are ephemeral feedback for the current user action; the notification centre holds server-side events (mentions, approvals), persisted with read/unread state and synced across devices. A server event can produce both: a toast if the app is focused, a badge increment always, and a push/OS notification if the app is in the background.
- **Multi-tab:** server-originated notifications should toast only in the focused tab (coordinate via `BroadcastChannel` or check `document.visibilityState`), to avoid the same toast in five tabs.
- **Analytics:** log shown/dismissed/action-clicked to learn which messages help, and to find noisy sources.

#### Model answer
"I'd treat this as a small notification platform rather than a single component.

**Requirements.** We need transient toasts for feedback on user actions, with types, optional actions like Undo, and promise toasts that go from 'Saving…' to 'Saved'. They must be triggerable from anywhere: components, the API client, and real-time server events. We need policies so the UI doesn't get spammed: a visible limit, a queue, de-duplication and priority. And separately, there's a persistent notification centre for things like mentions or approvals, which are server data, not UI feedback.

**Architecture.** At the core is a framework-agnostic notification store. Producers call a simple API: components call `toast.success`, the API client's interceptor calls `toast.error` for 5xx responses, and the real-time layer converts certain server events into toasts. The store applies policies, manages timers and lifecycle, and notifies subscribers. Renderers subscribe with `useSyncExternalStore`: the `Toaster` renders transient toasts in a portal; the notification centre renders persistent items fetched from the server.

**Data model.** Each toast has an id, an optional dedupe key, type, title, optional description and action, priority, duration, created time, a count for duplicates, and a lifecycle state: queued, visible, or leaving.

**Policies.** De-duplication: if a toast with the same dedupe key arrives within a few seconds, I update the existing one and bump its count, so a flaky connection shows 'Connection lost ×3' rather than three toasts. Priority: visible slots, say three, are filled by priority and then age, so an error is never stuck behind info messages. Rate limiting per source protects against bugs like a retry loop toasting forty times. Durations scale with text length; errors and toasts with actions stay until dismissed, because you can't use an action that disappeared. Timers pause on hover, focus and when the tab is hidden.

**API.** Small and imperative: `toast(message, options)`, the type shortcuts, `toast.promise`, `toast.update` and `toast.dismiss`, all returning or accepting ids. It's callable outside React. We add development warnings for misuse; for example, our guidelines say validation errors belong inline next to fields, not in toasts.

**Accessibility.** The live region is always in the DOM, because announcements are only reliable when content is added to an existing region. Most toasts use `role="status"`, which waits for the screen reader to finish; only errors use `role="alert"`. Toasts never take focus. If a toast has an action, there's a keyboard shortcut to jump to the toast region, and the action is also available somewhere persistent, like Undo in the item's menu, because toasts are easy to miss.

**Notification centre.** Server events like 'Ana mentioned you' are stored server-side with read state, synced across devices and shown in an inbox with an unread badge. When such an event arrives over WebSocket, the app decides how to surface it: a toast if this tab is focused, always a badge increment, and a push notification if the app is in the background and the user opted in. With several tabs open, only the focused tab shows the toast; tabs coordinate via `BroadcastChannel`.

**Other concerns.** Strings come from our i18n system; positions and layout adapt on mobile so toasts don't cover bottom navigation; themes use design tokens; and we log shown, dismissed and action-clicked events to find noisy or unhelpful messages."

#### Another worked example
**De-duplication and priority in the store:**
```ts
function enqueue(input: ToastInput) {
  const key = input.dedupeKey ?? input.type + ':' + input.title;
  const existing = toasts.find((t) => t.key === key && t.state !== 'leaving' && Date.now() - t.createdAt < 5000);
  if (existing) { existing.count += 1; existing.createdAt = Date.now(); restartTimer(existing); return emit(), existing.id; }
  const t = { ...input, id: crypto.randomUUID(), key, count: 1, createdAt: Date.now(), state: 'queued' as const,
              priority: PRIORITY[input.type] };
  toasts = [...toasts, t];
  promote();
  return t.id;
}
function promote() {
  const visible = toasts.filter((t) => t.state === 'visible');
  const queued = toasts.filter((t) => t.state === 'queued').sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  const free = MAX_VISIBLE - visible.length;
  queued.slice(0, Math.max(0, free)).forEach((t) => { t.state = 'visible'; startTimer(t); });
  toasts = [...toasts]; emit();
}
```
(Mutating items then replacing the array is fine for a sketch; production code would produce new objects so subscribers see changes reliably.)

#### A third worked example
**B2B admin app versus consumer app.**
- **B2B (e.g. a Stripe-like dashboard):** long-running operations like exports and bulk refunds: a toast says "Export started", and the result arrives later as a notification centre item with a download link, plus an email if it takes minutes. Errors include a request id for support. Toasts are bottom-left so they don't cover primary actions on the right.
- **Consumer mobile web:** minimal toasts, short text, top position (bottom is where navigation and the keyboard live), swipe to dismiss, haptics not available on web so rely on clear copy. Background events use push notifications with explicit opt-in.

#### Step-by-step framework
1. **Requirements**: transient vs persistent, types, actions, producers, policies.
2. **Architecture**: framework-agnostic store, producers, renderers; diagram.
3. **Data model**: toast shape and lifecycle states.
4. **Policies**: dedup, priority queue, limits, rate limiting, durations, pause.
5. **API**: imperative, typed, usable anywhere; dev warnings.
6. **Accessibility**: live regions, politeness, focus, timing, reachable actions.
7. **Notification centre and real time**: server events, multi-tab, push.
8. **Operational**: i18n, theming, mobile, analytics, testing.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| A Toast component and a context | Framework-agnostic service with policies and multiple renderers |
| Every call adds a toast | Dedup with counts, priority queue, rate limits |
| Same timeout for everything | Length-based durations; persistent errors and actions; pause rules |
| Toasts for everything, including server mentions | Clear split between toasts and a persisted notification centre |
| Same toast in every open tab | Focused-tab delivery via BroadcastChannel |
| No metrics | Shown/dismissed/action analytics to tune messages |

#### Useful phrases
- "Toasts are feedback; notifications are data."
- "Policies live in the store, so every producer gets dedup and priority for free."
- "Three identical errors become one toast with a count."
- "If a toast has an action, the action must also exist somewhere permanent."

#### Common pitfalls
- **Toast storms** from loops or retries without rate limits.
- Using toasts for **critical or form errors**.
- **Assertive announcements** for every toast.
- Server notifications that are **lost** if the user wasn't looking (no persistence).
- **Duplicate toasts across tabs**.
- Toasts that **cover key UI** on mobile.

#### Follow-ups to expect (with sample answers)
- **"How would you deliver real-time notifications?"** — "A WebSocket or SSE connection per user (one per browser via a SharedWorker or leader tab), events carrying ids so the client can de-duplicate and fetch missed ones after reconnecting, and push notifications via a service worker when no tab is open."
- **"How do you test the policies?"** — "Unit tests with fake timers on the store: dedup within the window, priority ordering when slots are full, rate limiting, pause and resume. Component tests for roles and announcements."
- **"How do teams localise toast text?"** — "The API accepts already-translated strings from each team's i18n setup, or message keys with params; durations are computed after translation because text length changes."
- **"How do you stop teams overusing toasts?"** — "Guidelines with examples, dev warnings for patterns like toasts on page load, a lint rule against toasts in form validation, and analytics showing noisy sources."
- **"Where should toasts appear relative to modals?"** — "Above modals and not inerted by them; with native dialogs, render the toaster as a popover in the top layer."

#### What senior interviewers look for
- **Platform architecture** with clear separation of concerns.
- **Thoughtful policies** that protect users from noise.
- **Accessibility and timing** handled centrally.
- **Integration** with real-time, multi-tab and the notification centre.

#### Practise it
- Explain the design in 25 minutes with the producer/store/renderer diagram.
- Implement the store with dedup, priority and pause, and test it with fake timers.
- Checklist: transient vs persistent · store · producers incl. non-React · dedup with count · priority queue · rate limit · durations and pause · update in place · live regions and politeness · no focus stealing · reachable actions · notification centre · multi-tab · analytics.

#### Variations you might be asked
- "Design the notification centre (bell icon) for a SaaS product."
- "Design in-app announcements for new features."
- "Design how a web app shows background job progress."

## Design a Date Picker component
- id: fe-comp-01
- roles: frontend, fullstack
- round: FE_SYSTEM_DESIGN_COMPONENT
- difficulty: hard
- levels: senior, staff
- tags: system-design, date picker, i18n, a11y, design systems, time zones

### Prompt
Design a Date Picker for a design system that serves products in many countries. It should support single dates, ranges, optional times, typed input as well as a calendar popup, minimum/maximum and disabled dates, and different locales. Focus on architecture, the data model for dates, the API, internationalisation and accessibility rather than the calendar code.

### Answer
#### What the interviewer is really testing
- Recognising that the **hardest part is the data model**: calendar dates vs instants, time zones, and what value the component emits.
- **Layered architecture**: date maths, state management, input parsing/formatting, calendar grid, popover, and how variants (single, range, date-time) share them.
- **Internationalisation depth**: formats, first day of week, non-Gregorian calendars, numbering systems, RTL.
- **Accessibility** of both the typed input and the calendar grid, and why typed input matters.
- **API and bundle-size** decisions for a shared component.

#### Key points
- **Requirements:** single date, range, date-time, month/year pickers; typed input with locale-aware parsing; calendar popup; presets ("Last 7 days"); min/max; disabled dates (function); locales and calendars; time zones for date-time; forms integration (name, required, validation errors); mobile; accessible; small bundle.
- **Value model (most important decision):**
  - A **calendar date** (birthday, check-in, due date) has no time zone: represent as `'YYYY-MM-DD'` or a `PlainDate`-like object `{ year, month, day }`.
  - A **date-time** (meeting at 3pm) is an instant in a time zone: represent as `ZonedDateTime` (instant + IANA zone) or an ISO string with offset plus zone.
  - Never emit a JavaScript `Date` for a calendar date: it's an instant, and converting it for display in another time zone shifts the day.
  - Temporal API (`Temporal.PlainDate`, `ZonedDateTime`) models this correctly; use a polyfill or `@internationalized/date` until widely available.
- **Architecture:**
  ```
  ┌ Date core (pure): PlainDate maths, calendars, comparisons, ranges ┐
  ├ State hooks (headless): useDatePickerState / useRangePickerState  │
  │   value, focusedDate, open, validation, min/max/isDisabled        │
  ├ Field: segmented input (day | month | year) or free-text parser   │
  ├ Calendar: month grid(s), keyboard, ARIA grid                      │
  └ Popover: positioning, focus, dismissal (shared overlay system)    ┘
  Variants = compositions: DatePicker, DateRangePicker, DateTimePicker, MonthPicker
  ```
- **Typed input design:**
  - **Segmented fields** (each of day/month/year is a spinbutton, ordered per locale, e.g. MM/DD/YYYY in the US, DD/MM/YYYY in the UK, YYYY/MM/DD in Japan): unambiguous, keyboard friendly (arrows increment), accessible.
  - Or a **free-text field with a parser** that understands locale formats and maybe natural language ("next friday"); more ambiguity (is 03/04 March or April?).
  - Validate on blur; show errors with `aria-describedby`; never reformat while typing.
  - Mobile: consider native `<input type="date">`, which gives the OS picker; trade-off is limited styling and range support.
- **Internationalisation:**
  - Formatting and names via `Intl.DateTimeFormat`; segment order via `formatToParts`.
  - First day of week and weekend days via `Intl.Locale.prototype.getWeekInfo` (with fallback data).
  - Non-Gregorian calendars (Japanese era, Buddhist, Islamic, Hebrew, Persian): the core must convert between calendar systems; at minimum display with `calendar` options, ideally pick in the user's calendar while storing ISO.
  - Numbering systems (Arabic-Indic digits), RTL layouts with mirrored navigation.
  - Translations for labels ("Previous month", "Choose date").
- **Accessibility:**
  - Field: label, segments as `role="spinbutton"` with `aria-valuenow`, `aria-valuetext` and labels ("month"); or a text input with format hint.
  - Calendar: dialog or popover containing an ARIA grid, roving focus, arrows/Page Up/Down/Home/End, full date labels, `aria-selected`, `aria-disabled`, `aria-current="date"`, month heading as a live region.
  - **Typed input is an accessibility feature**: for keyboard and screen reader users, typing a known date is far faster than navigating a grid (think birth dates).
- **API:**
  ```
  <DatePicker label value onChange minValue maxValue isDateUnavailable locale calendar
              granularity="day|minute" timeZone defaultOpen presets errorMessage name required />
  ```
  Values are `PlainDate`/`ZonedDateTime`-like objects or ISO strings (pick one and be consistent); controlled and uncontrolled; headless hooks exported for custom UIs.
- **Bundle size:** date libraries and locale data are large; rely on `Intl` for formatting (zero bundle cost), tree-shake calendars, load non-Gregorian calendar support on demand.
- **Testing:** run tests in several time zones (including ones with DST and half-hour offsets) and locales; property tests for date maths; visual tests for RTL.

#### Model answer
"I'd start with the value model, because most date picker bugs come from it.

There are two different kinds of values. A calendar date, like a birthday, an invoice due date or a hotel check-in, is just a day: it has no time and no time zone. A date-time, like a meeting, is a moment, which only makes sense with a time zone. JavaScript's `Date` is always a moment, so if you store a birthday as a `Date` at local midnight and someone in another time zone views it, it can show the previous day. So the component emits a plain date, as an ISO `YYYY-MM-DD` string or a `PlainDate`-style object, for date granularity, and a zoned date-time, an instant plus an IANA time zone, for date-time granularity. The Temporal API models exactly this; until it's universally available, a library like `@internationalized/date` does the same.

**Architecture.** I'd layer it. At the bottom, a pure date core for date maths, calendar systems, comparisons and range logic. Above that, headless state hooks: `useDatePickerState` and `useRangePickerState`, which manage the value, the focused date in the calendar, open state, and validation against min, max and unavailable dates. Then UI pieces: a date field for typed input, a calendar grid, and a popover that reuses our overlay system. The public components, DatePicker, DateRangePicker, DateTimePicker and MonthPicker, are compositions of those pieces, and we export the hooks for teams that need a custom UI.

**Typed input.** I'd make typing a first-class path, not an afterthought. For many users, especially keyboard and screen reader users, or anyone entering a birth date from 1985, typing is much faster than navigating a calendar. I prefer a segmented field: separate day, month and year segments, ordered according to the locale, with arrow keys to increment and screen reader support as spin buttons. That removes ambiguity: in a free-text field, '03/04/2026' means March in the US and April in the UK. Validation runs on blur, and errors are linked with `aria-describedby`. On mobile, we could optionally fall back to the native date input, trading styling for the OS picker.

**Internationalisation.** Month and weekday names, and the order of segments, come from `Intl.DateTimeFormat` and `formatToParts`, which costs nothing in bundle size. The first day of the week and weekend days come from `Intl.Locale`'s week info with fallback data: Sunday in the US, Monday in most of Europe, Saturday in parts of the Middle East. Some users expect non-Gregorian calendars, like the Japanese era calendar, Buddhist calendar in Thailand, or Persian calendar in Iran. The core should support converting between calendars, so the user picks in their calendar while we store ISO dates. RTL locales mirror the layout and arrow-key directions, and some locales use different digits.

**Accessibility of the calendar.** The calendar is a grid with a roving tabindex: arrows move by day and week, Page Up and Down by month, Home and End to week boundaries. Each day has a full label like 'Tuesday, 3 March 2026', with selected, disabled and today states exposed. The month heading announces when it changes.

**API.** Props include `label`, `value` and `onChange`, `minValue`, `maxValue`, `isDateUnavailable`, `locale`, `calendar`, `granularity`, `timeZone` for date-times, `presets` for ranges like 'Last 30 days', plus form props: `name`, `required` and `errorMessage`. It's controlled or uncontrolled.

**Bundle and testing.** Locale data and calendar systems can be heavy, so formatting relies on `Intl`, and non-Gregorian calendars load on demand. Tests run in multiple time zones, including DST transitions and half-hour offsets like India's, and multiple locales, with visual regression for RTL."

#### Another worked example
**A date range for an analytics dashboard (B2B) versus a booking range (B2C).**
- **Analytics:** presets dominate ("Today", "Last 7 days", "This quarter", "Custom"); ranges are often relative and should stay relative when saved ("last 7 days" means a moving window, so store `{ preset: 'last7' }`, not two dates); time zone matters: "today" in the account's reporting time zone, not the browser's; comparisons ("vs previous period").
- **Booking:** absolute dates only; unavailable nights; minimum stay; price per night shown in cells; two months visible on desktop, scrolling months on mobile.
The same core and state hooks serve both; the differences are in presets, value shape and cell rendering, which is why the API exposes `renderCell` (or cell content slots) and a `presets` prop rather than baking either product in.

#### A third worked example
**The "off by one day" incident.** A team stored due dates by calling `new Date(input.value).toISOString()`. Users in the Americas saw tasks due a day early. Root cause: `new Date('2026-05-10')` is UTC midnight, displayed in UTC−5 as 9 May, 7pm; and `toISOString()` of a local midnight date in UTC+ zones returns the previous day. Fix: the design-system picker emits `'2026-05-10'` strings for date granularity, the API stores a SQL `DATE` column, and display formats the plain date without converting through instants. Teaching this through the component's types prevents the bug class across all teams.

#### Step-by-step framework
1. **Requirements**: granularities, ranges, typed input, constraints, locales, time zones, mobile.
2. **Value model**: plain dates vs zoned date-times; what the component emits.
3. **Architecture**: date core, headless state, field, calendar, popover; variants as compositions.
4. **Typed input**: segmented vs free text; validation; mobile native option.
5. **Internationalisation**: Intl formatting and parts, week info, calendars, numbering, RTL.
6. **Accessibility**: spinbutton segments, calendar grid, labels, live heading.
7. **API**: props, controlled/uncontrolled, headless hooks, presets, cell rendering.
8. **Bundle and testing**: Intl over data, lazy calendars, multi-time-zone and locale tests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Emits a JavaScript `Date` | Plain date for days; zoned date-time for moments |
| Calendar popup only | Typed input as a first-class, accessible path |
| Hard-coded English names and Sunday start | Intl formatting, formatToParts order, week info, calendars |
| One component with many boolean props | Core + headless hooks + composed variants |
| Ships a large date library and all locales | Intl for formatting, lazy-loaded calendars |
| Tests in one time zone | Tests across time zones, DST and locales |

#### Useful phrases
- "A birthday is a calendar date, not a moment, so it never goes through a time zone."
- "Typing a date is an accessibility feature, not a fallback."
- "Segment order and names come from Intl, not from our code."
- "Relative ranges should be stored as relative, or saved dashboards go stale."

#### Common pitfalls
- **UTC parsing** of date-only strings and `toISOString()` shifting days.
- **Ambiguous free-text formats** across locales.
- Treating **"today"** as the browser's today when the business uses an account time zone.
- Forgetting **non-Gregorian calendars** and RTL for global products.
- **Heavy bundles** from date libraries and locale data.
- **Reformatting while typing**, which fights the user's cursor.

#### Follow-ups to expect (with sample answers)
- **"Should we just use the native `input type=date`?"** — "It's great on mobile and accessible, but styling is limited, there's no range support, and desktop UIs differ by browser. A design system can offer it as the mobile default and the custom picker on desktop, with the same value format."
- **"How do you handle time zones for date-times?"** — "Store instants with the IANA zone they were chosen in. Show times in the user's zone by default, but for things tied to a place (a flight, an event venue), show the place's zone with a label."
- **"How would you test it?"** — "Property-based tests for the core (adding then subtracting days returns the original, ranges never invert), unit tests for parsing per locale, component tests for keyboard behaviour, and CI runs with `TZ` set to several zones."
- **"How do you make presets work across time zones?"** — "Compute preset ranges in the configured reporting time zone, store presets symbolically, and display the resolved dates next to the preset so users know exactly what 'Last 7 days' covers."
- **"What's your stance on build vs buy?"** — "React Aria's date components and `@internationalized/date` already implement most of this correctly. I'd build our styled layer on top rather than rewrite the core."

#### What senior interviewers look for
- **Correct value semantics** and awareness of the bug classes they prevent.
- **Layered, reusable architecture** with variants as compositions.
- **Global product thinking**: locales, calendars, time zones.
- **Accessibility** including typed input, plus pragmatic build vs buy.

#### Practise it
- Explain the design in 30 minutes, starting from the value model.
- Write the TypeScript types for the props and value of single, range and date-time variants.
- Checklist: plain vs zoned values · core/hooks/field/calendar/popover · segmented typed input · locale order via formatToParts · week info · calendars · RTL · grid a11y · presets stored relatively · bundle strategy · multi-time-zone tests.

#### Variations you might be asked
- "Design a time picker that works across time zones."
- "Design the date range filter for an analytics product."
- "How would you fix an 'off by one day' bug reported by users in Brazil?"

## Design an image carousel component
- id: fe-comp-02
- roles: frontend, fullstack
- round: FE_SYSTEM_DESIGN_COMPONENT
- difficulty: medium
- levels:
- tags: system-design, carousel, performance, images, a11y, design systems

### Prompt
Design a carousel component for a design system used by marketing pages, product detail pages and content rows (like a Netflix-style row of cards). Discuss requirements, architecture, API, image loading strategy, performance (including Core Web Vitals), accessibility and when teams should not use a carousel.

### Answer
#### What the interviewer is really testing
- Seeing one "carousel" as **several use cases** with different needs (hero slideshow, product gallery, scrolling card rows) and designing a flexible core.
- **Choosing the rendering foundation**: CSS scroll snap vs transform-based track, and the consequences for touch, looping and accessibility.
- **Image and performance strategy**: LCP, lazy loading, responsive images, layout shift, JavaScript cost, SSR.
- **Accessibility and motion policies** enforced by the component (autoplay rules, inert slides, announcements).
- **Product judgement and governance**: carousels often hide content; the design system should guide usage.

#### Key points
- **Use cases:**
  1. **Hero slideshow** (marketing): one slide per view, optional autoplay, large images, likely the LCP element.
  2. **Product gallery** (PDP): thumbnails, zoom, swipe, deep link to an image, no autoplay.
  3. **Content row** (cards): multiple items per view, responsive count, horizontal scrolling with arrows on desktop, free scrolling on touch.
- **Foundation:** default to **CSS scroll snap** (native touch momentum, trackpad, keyboard scrolling, works before JavaScript hydrates, minimal JS), with JavaScript enhancing it: arrows via `scrollBy`/`scrollIntoView`, current index via IntersectionObserver, dots. Use a **transform track** only for variants that need seamless infinite looping or precise animation.
- **Architecture:**
  ```
  <Carousel> (state: index, itemsPerView, paused; refs to viewport/items)
    ├── Carousel.Viewport (scroll-snap container, IntersectionObserver)
    │     └── Carousel.Item × n  (aria group "3 of 12", inert when hidden if paged)
    ├── Carousel.Previous / Carousel.Next  (scrollBy one page)
    ├── Carousel.Indicators (dots or thumbnails)
    └── Carousel.AutoplayControl (only when autoplay enabled)
  Headless hook: useCarousel({ count, loop, autoplay, itemsPerView })
  ```
- **API:** compound components plus a hook; props: `itemsPerView` (responsive object or CSS-driven), `loop`, `autoplay={{ interval, pauseOnHover }}`, `snap="start|center"`, `label` (required), `onIndexChange`, `initialIndex`. Slots for custom arrows and indicators.
- **Image strategy:**
  - First visible slide: eager, `fetchpriority="high"`, preloaded if it's the LCP image, and SSR-rendered (not inserted after hydration).
  - Others: `loading="lazy"`; prefetch the next slide when the user interacts.
  - `srcset`/`sizes` matched to slide width per breakpoint; modern formats (AVIF/WebP) via an image CDN.
  - **Reserve space** with `aspect-ratio` to prevent CLS; blurred placeholders (LQIP) optional.
- **Performance:** keep JS small (scroll snap needs little), avoid layout reads in scroll handlers (use IntersectionObserver), passive listeners, no re-render of all slides on index change, SSR the initial state so the first slide is visible without JS.
- **Accessibility (enforced by the component):**
  - Required `label`; `aria-roledescription="carousel"`; slides as groups labelled "n of m".
  - Autoplay: off by default, never when `prefers-reduced-motion`, visible pause control first in focus order, pauses on hover/focus/hidden tab.
  - Live announcements only for user-initiated changes.
  - Arrow buttons labelled; dots as buttons with `aria-current`; thumbnails labelled.
  - Content rows: all items reachable with Tab (if not paged) or inert off-page items with clear paging controls.
- **Governance:** guidelines on when not to use (critical content, legal notices, primary CTAs beyond slide one); default no autoplay; analytics on slide impressions to show teams the drop-off.

#### Model answer
"First I'd clarify which carousels we're designing for, because 'carousel' covers at least three patterns: a hero slideshow on marketing pages, a product image gallery with thumbnails, and horizontally scrolling rows of cards. They share mechanics but differ in autoplay, items per view, and how they relate to page performance.

**Foundation.** I'd build the default on CSS scroll snap: a horizontally scrolling container with snap points. That gives native touch momentum, trackpad swiping and keyboard scrolling, it works before JavaScript loads, which matters for server-rendered marketing pages, and needs little code. JavaScript enhances it: Previous and Next scroll by a page, an IntersectionObserver tracks which items are visible for the indicators, and autoplay advances by scrolling. Only a variant that needs seamless infinite looping or custom transitions would use a transform-based track.

**Architecture and API.** Compound components over a headless `useCarousel` hook: `Carousel`, `Carousel.Viewport`, `Carousel.Item`, `Carousel.Previous`, `Carousel.Next`, `Carousel.Indicators` and `Carousel.AutoplayControl`. Teams compose what they need: a hero uses indicators and maybe autoplay, a gallery swaps indicators for thumbnails, a content row uses only arrows. Props include a required `label`, `itemsPerView` (preferably driven by CSS custom properties per breakpoint, so the server render is correct without measuring), `loop`, `autoplay` options, `snap` alignment, `initialIndex` and `onIndexChange`.

**Images and performance.** For hero carousels, the first slide is often the page's Largest Contentful Paint element, so the component makes sure it's server-rendered, eager, with `fetchpriority='high'`, and not hidden behind JavaScript initialisation. Other slides are lazy-loaded, with the next one prefetched when the user starts interacting. Images use `srcset` and `sizes` that match the slide width at each breakpoint, served by our image CDN in modern formats. Every slide reserves its space with `aspect-ratio`, so nothing shifts as images load. On the JavaScript side: no scroll-position reads in scroll handlers, IntersectionObserver instead, and index changes re-render only controls, not every slide.

**Accessibility.** The design system enforces it so teams can't get it wrong: `label` is required; the carousel has a role description and slides are labelled '3 of 12'; autoplay is off by default, never runs with reduced motion, always shows a pause button as the first control, and pauses on hover, focus and hidden tabs. Announcements happen only for user-initiated changes. For paged carousels, off-page items are inert so keyboard users don't tab into invisible content; for free-scrolling rows, all items stay reachable and the container scrolls them into view on focus.

**Governance.** Data consistently shows that few users engage beyond the first slide, so our guidelines say: don't put critical content or the main call to action beyond slide one, prefer a static hero, and don't autoplay. We provide slide impression analytics so teams can see the drop-off for themselves."

#### Another worked example
**Product gallery on a PDP (e-commerce).** Requirements: main image plus thumbnails, swipe on mobile, click to zoom (full-screen lightbox), deep link to an image (`?image=3`), variant switching (choosing "Red" swaps the image set), video slides. Design notes: the gallery's first image is the LCP element, so it's server-rendered with high priority; thumbnails are buttons labelled "Show image 3 of 8"; the lightbox reuses the design system Dialog; pinch-zoom uses native gestures where possible; switching variants preloads the new first image before swapping to avoid a blank flash. This shows the core handles a very different product need through composition.

#### A third worked example
**Netflix-style content rows (B2C streaming).** Dozens of rows, each with 20 to 40 cards, on a single page. Concerns: rows below the fold shouldn't initialise until near the viewport (lazy-mount via IntersectionObserver), card images load lazily with low priority, rows use scroll snap with page-wise arrows on desktop and free scrolling on touch, hovering a card expands it without causing layout shift of neighbours (use `transform: scale` in an overlay layer), and TV/remote navigation needs spatial focus management (arrow keys move between rows and cards), which is a different input model the core should allow via a pluggable focus strategy.

#### Step-by-step framework
1. **Requirements**: identify use cases (hero, gallery, rows) and their needs.
2. **Foundation**: scroll snap by default; transform track for looping variants.
3. **Architecture**: headless hook plus compound components; diagram.
4. **API**: required label, items per view, loop, autoplay, snap, events, slots.
5. **Images**: LCP handling, lazy loading, srcset/sizes, aspect ratio, CDN.
6. **Performance**: small JS, IntersectionObserver, SSR initial state, lazy-mount rows.
7. **Accessibility**: enforced labels, autoplay policy, inert or reachable items, announcements.
8. **Governance**: usage guidance, analytics, defaults that discourage misuse.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| One slideshow component for every case | Identifies hero, gallery and row patterns; composable core |
| JS-driven transforms everywhere | Scroll snap by default, enhanced with JS |
| All images eager, or first image lazy | LCP image prioritised; rest lazy; srcset; aspect ratio |
| Autoplay on by default | Off by default, reduced motion respected, pause control |
| No opinion on usage | Guidelines and analytics on carousel effectiveness |
| Measures widths in JS before rendering | CSS-driven items per view for correct SSR |

#### Useful phrases
- "Carousel is three patterns wearing one name."
- "Scroll snap gives me native swiping and works before hydration."
- "The first slide is probably the LCP image, so the component protects it."
- "The design system should make the accessible carousel the only easy one to build."

#### Common pitfalls
- **Hydration-dependent first render**, so nothing shows until JS runs (hurts LCP and SEO).
- **CLS** from images without reserved space.
- **Hidden slides still tabbable** in paged carousels.
- **Autoplay without a pause control** (WCAG 2.2.2 failure).
- Building **looping on scroll snap** with fragile clone hacks instead of choosing the transform variant.
- **Initialising dozens of carousels** at page load on content-heavy pages.

#### Follow-ups to expect (with sample answers)
- **"How do you support infinite looping with scroll snap?"** — "It's awkward: you need cloned items and silent scroll jumps. If looping is truly required, use the transform-based variant; otherwise disable the Previous button at the start and Next at the end, which is often clearer anyway."
- **"How do you measure success of a carousel?"** — "Slide impressions per position, interactions with controls, and clicks per slide; compare against a static alternative in an A/B test."
- **"How do you handle RTL?"** — "Scroll containers reverse naturally in RTL with logical properties; arrows swap meaning; IntersectionObserver-based index logic should not depend on `scrollLeft` sign conventions, which differ between browsers in RTL."
- **"How would you test it?"** — "Unit tests for the hook, Storybook interaction tests for controls and autoplay with fake timers, visual regression at key breakpoints, and Lighthouse checks for LCP/CLS on a page using the hero variant."
- **"What about SEO?"** — "Server-render all slides' text content, so search engines see it, and use real `img` elements with alt text."

#### What senior interviewers look for
- **Use-case analysis** leading to a composable design.
- **Performance literacy** around LCP, CLS and hydration.
- **Accessibility built into the component's defaults**.
- **Product judgement** and governance.

#### Practise it
- Explain the design in 25 minutes covering the three use cases.
- Build a scroll-snap carousel with IntersectionObserver indicators and measure LCP/CLS with Lighthouse.
- Checklist: use cases · scroll snap foundation · transform variant for looping · headless + compound API · required label · CSS items per view · LCP handling · lazy images · aspect ratio · autoplay policy · inert/reachable items · lazy-mount rows · guidelines and analytics.

#### Variations you might be asked
- "Design a product image gallery with zoom."
- "Design horizontally scrolling content rows for a streaming home page."
- "Design an onboarding walkthrough with swipeable steps."

## Design a file upload component
- id: fe-comp-03
- roles: frontend, fullstack
- round: FE_SYSTEM_DESIGN_COMPONENT
- difficulty: hard
- levels: senior, staff
- tags: system-design, file upload, resumable uploads, S3, web workers, design systems

### Prompt
Design a file upload system for a product like Google Drive or a document-heavy SaaS app. Users upload many files, some several gigabytes, sometimes on unreliable networks. Cover the client architecture, the upload protocol with the backend, resumability, concurrency, background uploads while navigating, validation and security, and the component API for other teams.

### Answer
#### What the interviewer is really testing
- Moving from "a file input with progress" to an **upload system**: a client-side upload manager that outlives individual components.
- **Protocol design** with the backend: presigned URLs, multipart/chunked uploads, resumability, integrity checks, completion and post-processing.
- **Reliability**: retries with backoff, resume after refresh or network loss, concurrency control, bandwidth considerations.
- **Performance**: hashing and chunking without freezing the UI (Web Workers), memory use with huge files, many small files.
- **Security and UX**: validation, malware scanning, permissions, progress for many files, accessibility, and an API teams can reuse.

#### Key points
- **Requirements:** drag-and-drop files and folders; thousands of files per batch; files up to 5 to 50GB; pause/resume/cancel; survive navigation within the SPA; resume after refresh or crash; progress per file and overall; validation (type, size, quota); post-processing (virus scan, thumbnails, previews); notifications on completion; accessibility; mobile.
- **Architecture:**
  ```
  UI components (Dropzone, UploadList, UploadButton)  ← subscribe
          │ enqueue(files, destination)
          ▼
  Upload manager (singleton store, outside React tree)
    - queue + scheduler (global concurrency, per-file chunk concurrency)
    - per-file state machine: queued → preparing → uploading → completing → processing → done | error | paused | cancelled
    - persistence (IndexedDB): upload ids, completed parts, file handles where possible
          │                                 │
          ▼                                 ▼
  Worker pool (hashing, chunking)     Transport (XHR/fetch per part, retries, backoff)
          │
          ▼
  Backend API: create upload → presigned part URLs → upload parts to object storage → complete
  ```
- **Protocol (multipart, S3-style):**
  1. `POST /uploads { name, size, type, parentFolderId, sha256? }` → server validates quota, permissions, type; returns `uploadId`, part size, and presigned URLs (or an endpoint to request them lazily).
  2. Client uploads parts (5 to 100MB) directly to object storage with `PUT`, in parallel (3 to 6 parts), each with retries; records ETags.
  3. `POST /uploads/:id/complete { parts: [{ partNumber, etag }] }` → server finalises, then triggers async processing (scan, thumbnails).
  4. Client learns processing status via polling, SSE or WebSocket.
  - Alternatives: the **tus** open resumable upload protocol; simple single `PUT` for small files (under ~10MB) to avoid overhead.
- **Resumability:** persist `uploadId` and completed part numbers in IndexedDB. After refresh, the browser can't re-read a file without the user re-selecting it (unless using the File System Access API handles, where supported), so the UI asks the user to re-select the file; match by name, size, lastModified (and hash) and continue from the last completed part. Server can list uploaded parts (`ListParts`) as the source of truth.
- **Integrity and de-duplication:** hash files (SHA-256 via WebCrypto, streamed per chunk in a Worker) for integrity checks and content-addressed de-duplication ("this file already exists, skip upload"). Hashing a 10GB file costs time; make it optional or incremental.
- **Concurrency:** global limit across files (e.g. 6 concurrent requests total), small files batched, large files split into parallel parts; adapt to network conditions (reduce parallelism on errors/slow throughput).
- **Reliability:** exponential backoff with jitter per part; distinguish retryable (network, 5xx, 429) from fatal (403 expired URL → refresh URL; 413/415 → fail); resume on `online` event; refresh presigned URLs when they expire.
- **Background behaviour:** the upload manager lives outside route components, so navigation doesn't cancel uploads; a persistent upload panel shows progress; `beforeunload` warning while uploads are active; Service Workers can't reliably continue uploads after the tab closes (Background Fetch is limited to downloads in most browsers), so be honest about it.
- **Memory:** never read whole files into memory; `file.slice()` creates lightweight Blob views per part; stream hashing.
- **Validation and security:** client-side checks for fast feedback; server is authoritative (quota, permissions, size, type sniffing, not trusting extensions); malware scanning before files are shareable; uploads to a quarantine bucket; download served from a separate domain with `Content-Disposition`; presigned URLs scoped to one object and short-lived.
- **UX:** overall progress by bytes; per-file status; estimated time remaining (smoothed throughput); folder structure preserved (`webkitGetAsEntry` / `webkitRelativePath`); conflict handling ("replace, keep both, skip"); accessible progress and announcements; completion notification if the user navigated away.
- **API for teams:** `<UploadDropzone destination accept maxSize multiple onComplete />`, `useUploads(filter)` to show progress anywhere, and an imperative `uploads.enqueue(files, options)`.

#### Model answer
"I'd treat this as an upload system with three parts: an upload manager on the client, a protocol with the backend, and UI components that teams reuse.

**Requirements.** Users drop files or whole folders, sometimes thousands of files, sometimes files of tens of gigabytes. Uploads must survive navigation, be pausable and resumable, recover from network drops, and ideally resume after a refresh. Files go through post-processing such as virus scanning and thumbnail generation.

**Client architecture.** The core is an upload manager that lives outside the React tree as a singleton store, so navigating between pages doesn't cancel uploads. It owns a queue and scheduler, a state machine per file, and persistence in IndexedDB. Components like the dropzone and the upload panel subscribe to it. Expensive work, like hashing, runs in a pool of Web Workers so the UI stays responsive.

Each file moves through states: queued, preparing (validating and maybe hashing), uploading, completing, processing on the server, then done, or error, paused or cancelled.

**Protocol.** Files never go through our application servers; they go straight to object storage. The client first calls `POST /uploads` with name, size, type and destination. The server checks permissions and quota, and returns an upload id, a part size, and presigned URLs for the parts. For large files, the client slices the file into parts with `file.slice`, which doesn't load it into memory, and uploads several parts in parallel directly to storage, recording each part's ETag. Then it calls complete with the list of parts. The server finalises the object and starts processing; the client hears about the result over our real-time channel. Small files use a single presigned PUT to avoid multipart overhead. The open tus protocol is an alternative if we want a standard.

**Reliability.** Each part retries independently with exponential backoff and jitter. I distinguish errors: network failures, 5xx and 429 are retried; an expired presigned URL means fetching a fresh one; 413 or 415 mean fail with a clear message. When the browser goes offline, uploads pause, and resume on the `online` event. Concurrency is global, around six requests in total, and adapts downwards if throughput drops or errors increase.

**Resume after refresh.** The upload id and completed part numbers are stored in IndexedDB. After a refresh, JavaScript can't re-open the file without the user, so we show 'Resume uploads' and ask the user to re-select the files; we match them by name, size and last-modified time, and continue from the last confirmed part. The server's list of uploaded parts is the source of truth. Where the File System Access API is available, stored file handles can make this smoother.

**Integrity and de-duplication.** Optionally, a Worker computes a SHA-256 hash in a streaming way, chunk by chunk, which lets the server verify integrity and skip uploading files it already has. For very large files I'd make hashing incremental or skip it, because it costs time.

**Security.** Client validation gives fast feedback, but the server enforces type, size, quota and permissions, sniffs content rather than trusting extensions, scans for malware in a quarantine bucket before the file is usable, and serves downloads from a separate domain with `Content-Disposition` headers. Presigned URLs are scoped to one object and expire in minutes.

**UX and accessibility.** A persistent upload panel shows overall progress by bytes, per-file status, and a smoothed time estimate. Folder structure is preserved when dropping folders. Name conflicts ask: replace, keep both, or skip. While uploads are active, leaving the site triggers a `beforeunload` warning; I'd be honest that uploads can't continue after the tab closes in most browsers. Progress bars are labelled with file names, and completions and failures are announced politely, in batches rather than one per file.

**API for teams.** `UploadDropzone` with destination, accepted types, size limit and `onComplete`; a `useUploads` hook to show progress anywhere; and an imperative `uploads.enqueue` for custom triggers like paste."

#### Another worked example
**Thousands of small files (B2B document import) versus one huge video (creator platform).**
- **10,000 small files** (a folder of scanned invoices): request overhead dominates, so batch "create upload" calls (one request returns many presigned URLs), keep high file-level concurrency, skip hashing, and show aggregate progress ("8,412 of 10,000"). UI rendering of 10,000 rows must be virtualized. Server-side, enqueue processing in batches.
- **One 30GB video** (a creator uploads a 4K file): multipart with 64 to 128MB parts, a few parallel parts, aggressive retry and resume, URL refresh because the upload can take hours, and keep the tab awake messaging ("Keep this tab open"). Show transcoding progress after upload via server events.
The same manager handles both because concurrency is configurable per file size class.

#### A third worked example
**Choosing part size and concurrency.** Object stores often allow up to 10,000 parts per upload with a minimum part size of 5MB (except the last). For a 50GB file, 5MB parts would exceed the part limit, so part size = max(5MB, ceil(size / 10,000)), rounded up, often 8 to 64MB for big files. Larger parts mean fewer requests but more re-upload on failure; smaller parts recover faster on flaky mobile networks. Start with 3 to 4 parallel parts; measure throughput per part and add parallelism while throughput improves; back off on errors. Mention that HTTP/2 multiplexing helps with many requests to the same host.

#### Step-by-step framework
1. **Requirements**: file counts and sizes, reliability, background behaviour, processing, security.
2. **Client architecture**: upload manager outside React, state machine, workers, persistence; diagram.
3. **Protocol**: create → presigned parts → direct uploads → complete → processing events.
4. **Reliability**: per-part retries, error classification, offline handling, adaptive concurrency.
5. **Resumability**: IndexedDB records, re-selection matching, server part listing.
6. **Integrity and memory**: streaming hashes in workers, `file.slice`, dedup.
7. **Security**: server validation, scanning, quarantine, separate download domain, scoped URLs.
8. **UX and API**: upload panel, conflicts, folders, a11y, beforeunload; components and hooks for teams.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Upload state inside the dropzone component | Upload manager outside React, surviving navigation |
| POST the whole file to the app server | Presigned direct-to-storage multipart uploads |
| Retry the whole file on failure | Per-part retries with error classification and backoff |
| No resume story | IndexedDB records, re-selection matching, server part list |
| Reads the file into memory to hash it | Streaming hashes in Web Workers, `file.slice` |
| Trusts client validation | Server validation, malware scanning, quarantine, scoped URLs |

#### Useful phrases
- "Uploads are app-level state, not component state."
- "Files go straight to storage; our servers only sign and confirm."
- "Each part retries on its own, so a dropped connection costs one part, not the whole file."
- "The browser can't reopen a file after refresh without the user, so resume asks them to re-select it."

#### Common pitfalls
- Assuming uploads **continue after the tab closes**.
- **Loading large files into memory** (`FileReader.readAsArrayBuffer` on 10GB).
- **Hashing on the main thread**, freezing the UI.
- **Presigned URLs that expire** mid-upload with no refresh path.
- Rendering **thousands of upload rows** without virtualization.
- Making files **available before scanning**.

#### Follow-ups to expect (with sample answers)
- **"Why not upload through our API server?"** — "It doubles bandwidth, ties up server connections for hours with big files, and adds a scaling bottleneck. Presigned URLs let storage handle the heavy lifting while the API keeps control of permissions."
- **"How do you show accurate time remaining?"** — "Use an exponentially smoothed throughput over recent seconds and remaining bytes across the queue, and round to friendly units; raw instantaneous speed jumps around too much."
- **"How would you support pausing?"** — "Abort in-flight part requests (they'll be re-sent from the start of the part) and stop scheduling new parts; the upload id and completed parts remain valid until the server's expiry."
- **"How do you clean up abandoned uploads?"** — "Storage lifecycle rules abort incomplete multipart uploads after a few days, and the server expires upload records."
- **"How do you test this?"** — "Unit-test the scheduler and state machine with a fake transport that injects failures and latency; integration tests against a local S3-compatible store (MinIO); Playwright with network throttling and offline toggling; long-running soak tests for large files."

#### What senior interviewers look for
- **End-to-end ownership**: client architecture plus backend protocol.
- **Reliability engineering**: retries, resume, adaptive concurrency.
- **Performance and memory awareness** with huge files.
- **Security** and a **reusable API** for other teams.

#### Practise it
- Explain the design in 35 minutes, drawing the client architecture and protocol sequence.
- Prototype multipart upload against MinIO with per-part retries and resume from IndexedDB.
- Checklist: upload manager outside React · state machine · workers · IndexedDB persistence · presigned multipart protocol · small-file path · per-part retries and error classes · adaptive concurrency · resume with re-selection · streaming hash · server validation/scanning · upload panel · conflicts · a11y · team API.

#### Variations you might be asked
- "Design Google Drive's upload experience."
- "Design video upload and processing for a creator platform."
- "Design bulk CSV import with validation and error reporting."
