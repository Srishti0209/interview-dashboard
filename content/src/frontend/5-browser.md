# Frontend Engineer — Browser & Web Platform

## What happens when you type a URL and press Enter
- id: fe-browser-01
- roles: frontend, fullstack
- round: BROWSER_WEB_PLATFORM
- difficulty: medium
- levels:
- tags: networking, DNS, TLS, HTTP, rendering

### Prompt
Walk through what happens from typing a URL into the browser and pressing Enter until the page is interactive. Go as deep as you can on networking (DNS, TCP/QUIC, TLS, HTTP), the server side, and how the browser parses and renders the page. Where are the performance opportunities at each step?

### Answer
#### What the interviewer is really testing
- **Breadth and structure**: a clear end-to-end story.
- **Depth** where it matters for frontend: caching, connection setup, HTTP/2/3, critical rendering path.
- Linking each step to **performance optimisations** (CDNs, preconnect, compression, caching, render-blocking resources).
- Clear communication: knowing when to zoom in and out.

#### Key points
- **URL parsing and input handling**: is it a URL or a search? HSTS list may force HTTPS.
- **Caches first**: service worker, HTTP cache (memory/disk), maybe bfcache for back/forward.
- **DNS resolution**: browser cache → OS cache → router → recursive resolver → root → TLD → authoritative; result cached by TTL.
- **Connection**: TCP handshake (1 RTT) + TLS 1.3 (1 RTT) for HTTP/1.1 and HTTP/2; **HTTP/3 over QUIC** combines transport and TLS (1 RTT, 0-RTT on resumption).
- **HTTP request/response**: headers, cookies, compression (Brotli/gzip), status codes, redirects (each costs RTTs), caching headers.
- **Server side**: CDN edge → origin → app server → database; SSR/static/streaming HTML.
- **Browser parsing**: HTML → DOM (streaming), preload scanner discovers resources, CSS → CSSOM, JS can block parsing (unless defer/async/module).
- **Rendering**: render tree → layout → paint → composite; first paint, FCP, LCP.
- **Interactivity**: JS execution, hydration; long tasks delay input (INP).
- Optimisations: CDN, fewer redirects, preconnect, HTTP/2/3, compression, caching, critical CSS, defer JS, preload LCP image, SSR/streaming, small JS.

#### Model answer
"I'll go through it in order and mention the performance levers at each step.

**1. Input and URL handling**
- The browser decides if the text is a URL or a search query.
- It checks the **HSTS** list; if the domain requires HTTPS, it upgrades `http://` without a request.
- It may already have started work while you typed (predictive DNS lookups, preconnects, even prerendering on some browsers).

**2. Caches before the network**
- **Back/forward cache** (for history navigation) can restore the whole page instantly.
- A **service worker** (if registered) can intercept the navigation and respond from cache (offline/PWA).
- The **HTTP cache** may hold a fresh copy (based on `Cache-Control`), avoiding the network or allowing a conditional request (`If-None-Match` → 304).

**3. DNS resolution**
- Browser DNS cache → OS cache → configured resolver (ISP, 1.1.1.1, DoH) → if not cached: root servers → TLD servers (`.com`) → the domain's authoritative servers → IP address.
- Typical cost: 0 ms when cached, 20–120 ms otherwise.
- Levers: fewer third-party domains, `<link rel="dns-prefetch">`/`preconnect` for critical origins, sensible TTLs.

**4. Connection setup**
- **HTTP/1.1 and HTTP/2**: TCP three-way handshake (1 round trip), then **TLS 1.3** handshake (1 round trip; TLS 1.2 needed 2). Certificate verification, possibly OCSP stapling.
- **HTTP/3** runs over **QUIC** (UDP), combining transport and TLS setup into 1 round trip, with 0-RTT resumption for repeat visits, and avoiding TCP head-of-line blocking on lossy networks.
- On a mobile network with 100 ms round trips, connection setup alone can cost 200–300 ms, which is why **CDNs** (edge servers close to users) and **connection reuse** matter.
- Levers: CDN, HTTP/2/3, TLS 1.3, `preconnect` to critical third-party origins, avoiding unnecessary domain sharding.

**5. HTTP request and response**
- The browser sends `GET /path` with headers: `Host`, `Accept`, `Accept-Encoding: br, gzip`, `Accept-Language`, cookies, `User-Agent`/client hints.
- **Redirects** (`http → https`, `example.com → www.example.com`, trailing slashes) each cost a round trip or more; avoid chains.
- Response: status code, headers (`Content-Type`, `Content-Encoding: br`, `Cache-Control`, `Set-Cookie`, security headers like CSP and HSTS), and the HTML body, ideally **compressed** and **streamed**.
- **103 Early Hints** can tell the browser to preload critical resources while the server is still generating HTML.

**6. Server side**
- Request hits a **CDN edge**: cached static HTML can be served immediately; otherwise forwarded to the origin.
- Load balancer → application server → maybe databases, caches and APIs → HTML generated (SSR), served static (SSG), or streamed in chunks (React streaming SSR sends the shell first).
- **TTFB** (time to first byte) measures this: aim for under ~800 ms at p75. Levers: edge caching, static generation, streaming, faster backends.

**7. Parsing HTML and loading resources**
- The browser parses HTML **incrementally** into the **DOM** as bytes arrive.
- The **preload scanner** looks ahead and starts fetching discovered resources (CSS, JS, images) early, even while the main parser is blocked.
- **CSS** is render-blocking: the browser won't paint until it has the CSSOM for stylesheets in the head.
- **Classic `<script>`** without `defer`/`async` blocks HTML parsing while it downloads and executes. `defer` downloads in parallel and runs after parsing in order; `async` runs as soon as downloaded (any order); `type="module"` is deferred by default.
- Levers: inline critical CSS, defer non-critical JS, avoid render-blocking third parties, preload fonts and the LCP image, keep HTML small.

**8. Rendering**
- DOM + CSSOM → **render tree** (visible elements with computed styles) → **layout** (geometry: sizes and positions) → **paint** (pixels into layers) → **composite** (layers combined on the GPU).
- Milestones: **First Contentful Paint** (first text/image), **Largest Contentful Paint** (main content visible, a Core Web Vital, aim ≤ 2.5 s).
- Images and fonts load progressively; layout shifts (CLS) happen if space isn't reserved.

**9. Becoming interactive**
- JavaScript downloads, parses and executes; frameworks **hydrate** server-rendered HTML (attach event handlers, reconcile).
- Long tasks during this phase delay responses to clicks (hurting **INP**). Levers: less JS, code splitting, deferring non-critical scripts, partial/progressive hydration, React Server Components.
- After load: analytics, prefetching of likely next pages, service worker installation.

**Summary of the biggest wins I'd look for:** CDN and caching for HTML and assets, no redirect chains, HTTP/2 or 3, compression, critical CSS and deferred JS, preloaded LCP image with `fetchpriority`, streaming SSR, and shipping less JavaScript."

#### Another worked example: shaving a second off mobile load
"A marketing site's mobile LCP was 3.8 s. The waterfall showed: an `http → https → www` redirect chain (2 round trips), a render-blocking third-party font CSS on another domain (DNS + TLS + download), and a hero image discovered late through CSS. Fixes: a single canonical URL with HSTS preload, self-hosted fonts with `preload` and `font-display: swap`, the hero as an `<img fetchpriority=high>`, and serving HTML from the CDN edge. LCP dropped to 2.1 s."

#### A third worked example: reading a waterfall
"In DevTools' Network panel, each request's timing breaks down into queueing, DNS, initial connection, SSL, request sent, waiting (TTFB) and content download. When I see long 'waiting' times, the server or origin is slow; long DNS/SSL bars on third-party domains suggest preconnect or self-hosting; late-starting important requests suggest discovery problems fixable with preload."

#### Variations you might be asked
- "What's the difference between HTTP/1.1, HTTP/2 and HTTP/3?": HTTP/2 multiplexes many requests over one TCP connection with header compression; HTTP/3 uses QUIC over UDP, avoiding TCP head-of-line blocking and enabling faster setup.
- "What is TTFB affected by?": DNS, connection setup, redirects, and server processing time.
- "What does the preload scanner not find?": resources referenced in CSS (fonts, background images), injected by JavaScript, or loaded after client-side rendering.

#### Step-by-step framework
1. **Input, HSTS and caches.**
2. **DNS.**
3. **Connection setup** (TCP/TLS or QUIC).
4. **HTTP request/response and server side.**
5. **Parsing and resource loading.**
6. **Rendering and interactivity**, with optimisations at each step.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "DNS, then the server sends HTML" | Structured end-to-end with caches, TLS, HTTP versions |
| No numbers | Round trips and realistic latencies |
| Skips rendering details | DOM, CSSOM, blocking scripts, render tree, layout, paint |
| No performance link | Optimisation at each step |
| Outdated (TLS 1.2 only, no HTTP/3) | TLS 1.3, QUIC, Early Hints, streaming |

#### Useful phrases
- "On a 100 ms mobile round trip, connection setup alone can cost a few hundred milliseconds."
- "CSS blocks rendering; classic scripts block parsing unless deferred."
- "The preload scanner can only find what's in the HTML."
- "Every redirect is another round trip."

#### Common pitfalls
- **Ignoring caches and service workers.**
- **Forgetting redirects and third-party origins.**
- **Vague rendering description.**
- **No connection to Core Web Vitals.**

#### Follow-ups to expect (with sample answers)
- **"What's in a TLS handshake?"**
  "Client hello with supported ciphers and key share, server hello with certificate and key share, both derive session keys; TLS 1.3 does this in one round trip."
- **"How does a CDN speed things up?"**
  "Shorter round trips to nearby edges, cached content, optimised connections to the origin, and compression/protocol upgrades."
- **"What's the difference between defer and async?"**
  "Both download in parallel; defer executes in order after HTML parsing, async executes as soon as ready in any order."

#### What senior interviewers look for
- **Structured depth.**
- **Performance instincts.**
- **Current platform knowledge.**

#### Practise it
1. Tell the full story out loud in 5 minutes, then a 60-second version.
2. Record a page load in DevTools and annotate each phase of the waterfall.
3. List one optimisation per step for a site you know.

## The critical rendering path
- id: fe-browser-02
- roles: frontend, fullstack
- round: BROWSER_WEB_PLATFORM
- difficulty: medium
- levels:
- tags: critical rendering path, render-blocking, CSSOM, performance

### Prompt
What is the critical rendering path? Explain how HTML, CSS and JavaScript interact to produce the first paint, what is render-blocking or parser-blocking, and the techniques you'd use to optimise first paint and LCP.

### Answer
#### What the interviewer is really testing
- Understanding **DOM, CSSOM, render tree, layout, paint** and their dependencies.
- Knowing what **blocks rendering** (CSS) vs **blocks parsing** (synchronous JS).
- Practical **optimisation techniques**: critical CSS, defer/async, preload, fonts, resource hints.
- Measuring with **DevTools/Lighthouse** and tying it to **FCP/LCP**.

#### Key points
- **Critical rendering path (CRP)**: the steps from receiving bytes to pixels on screen: HTML → DOM, CSS → CSSOM, render tree, layout, paint, composite.
- **CSS is render-blocking**: the browser won't paint content until CSSOM for blocking stylesheets is built (to avoid flashes of unstyled content).
- **Synchronous scripts are parser-blocking**: the parser stops to download and execute them; scripts also wait for preceding CSS (since they might query styles).
- **Critical resources**: those needed for the first render; minimise their **number, size and round trips**.
- Techniques: **inline critical CSS**, load the rest asynchronously; `defer`/`async`/modules; **media attributes** on non-matching stylesheets; **preload** fonts and the LCP image; **preconnect**; **font-display**; compress and minify; reduce HTML size; avoid `@import` chains; SSR to deliver content in HTML.
- Measure **FCP, LCP**, and inspect render-blocking resources in Lighthouse and the Performance panel.

#### Model answer
"The critical rendering path is everything the browser must do before it can show the first pixels: build the DOM from HTML, build the CSSOM from CSS, combine them, calculate layout and paint. Optimising it means getting the essential resources to the browser quickly and not making it wait for anything non-essential.

**The steps:**
1. **HTML → DOM**: parsed incrementally as bytes stream in.
2. **CSS → CSSOM**: every stylesheet in the head must be downloaded and parsed; CSS isn't incremental in the same way because later rules can override earlier ones.
3. **Render tree**: DOM nodes that are visible, with computed styles (`display: none` nodes excluded).
4. **Layout**: compute each box's size and position for the viewport.
5. **Paint**: fill in pixels (text, colours, images, borders) into layers.
6. **Composite**: combine layers on the GPU and display.

**What blocks what:**
```html
<head>
  <link rel="stylesheet" href="/app.css">        <!-- render-blocking: no paint until loaded -->
  <script src="/analytics.js"></script>          <!-- parser-blocking: HTML parsing stops here -->
  <script src="/app.js" defer></script>          <!-- downloads in parallel, runs after parsing -->
  <script src="/widget.js" async></script>       <!-- runs when downloaded, any order -->
  <script type="module" src="/main.js"></script> <!-- deferred by default -->
</head>
```
- **CSS blocks rendering** to avoid a flash of unstyled content.
- **Synchronous scripts block parsing**, because they might call `document.write` or modify the DOM. And a script after a stylesheet also waits for that CSS to load (it might read computed styles), so a slow stylesheet can delay script execution too.
- Images don't block rendering, but the LCP image's arrival determines LCP.

**Optimisation techniques:**

1. **Minimise critical CSS:**
```html
<style>/* inlined critical CSS: layout, header, hero, above-the-fold typography (~10–15 KB) */</style>
<link rel="preload" href="/app.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/app.css"></noscript>
```
Inlining the CSS needed for above-the-fold content avoids a round trip; the full stylesheet loads without blocking. Simpler alternatives: keep CSS small and split per route, so the blocking CSS is already small. Use `media` attributes for conditional CSS (`<link rel="stylesheet" href="print.css" media="print">` doesn't block screen rendering).

2. **Defer JavaScript**: `defer` or `type="module"` for app code; `async` for independent third parties; move non-essential third parties after load or behind interaction (load chat widgets when the user clicks 'Help').

3. **Avoid request chains**: CSS `@import` creates serial downloads; fonts referenced in CSS are discovered late. Preload what's critical:
```html
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://cdn.example.com" crossorigin>
```

4. **Fonts**: `font-display: swap` (or `optional`) so text renders immediately with a fallback; subset fonts; self-host to avoid third-party connection costs; use metric-compatible fallbacks (`size-adjust`) to reduce layout shift.

5. **The LCP element**: make sure it's in the initial HTML (not client-rendered), discoverable (an `<img>`, not a CSS background), prioritised (`fetchpriority="high"`), not lazy-loaded, and appropriately sized.

6. **Reduce bytes and round trips**: Brotli compression, minification, HTTP/2/3, CDN, caching; keep the HTML document small, and consider streaming SSR so the browser can start on the head while the server finishes the body.

7. **Server rendering**: content in HTML means the browser can paint without waiting for JavaScript to fetch and render data.

**Measuring:**
- Lighthouse 'Eliminate render-blocking resources' and 'Largest Contentful Paint element'.
- Performance panel: look for the gap between the HTML response and first paint, and which resources it waited on.
- Network panel with throttling (Slow 4G) to see chains clearly.
- WebPageTest filmstrips and waterfalls for real devices.

**Trade-offs:** inlining CSS prevents caching that CSS across pages and increases HTML size, so keep it small; too many preloads compete for bandwidth and can delay other critical resources; async CSS can cause flashes if critical styles are incomplete."

#### Another worked example: blank screen for two seconds
"A React SPA showed a blank white screen for about 2 seconds on mobile. The HTML contained an empty `<div id=root>`, a 300 KB blocking CSS file, and a 900 KB JS bundle; nothing could render until all JS executed and fetched data. We moved to server-side rendering for the landing pages, inlined 12 KB of critical CSS, split CSS per route, deferred the bundle and code-split it. First Contentful Paint went from 2.6 s to 0.9 s and LCP from 4.1 s to 1.8 s on a mid-range phone."

#### A third worked example: third-party script blocking parsing
"A synchronous A/B testing script in the head blocked parsing for up to 800 ms when its CDN was slow, delaying everything. We moved experiments server-side for key pages and loaded the remaining client-side tool asynchronously with an anti-flicker timeout of 300 ms, reducing worst-case delays dramatically."

#### Variations you might be asked
- "Does JavaScript block rendering?": synchronous scripts block parsing, so content after them can't render until they run; deferred scripts don't block.
- "What's FOUC and FOIT?": flash of unstyled content (CSS arrives late) and flash of invisible text (fonts blocking text rendering); font-display controls FOIT.
- "Why is CSS in the body discouraged?": stylesheets in the body can block rendering of content after them and cause reflows; modern React frameworks hoist critical styles.

#### Step-by-step framework
1. **Define the CRP steps.**
2. **Explain render-blocking CSS and parser-blocking JS.**
3. **Critical CSS and deferred JS.**
4. **Fonts, preload, preconnect, chains.**
5. **LCP element and SSR.**
6. **Measure and weigh trade-offs.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Put scripts at the bottom" | Explains defer/async/module and why |
| Doesn't know CSS blocks rendering | Render-blocking vs parser-blocking |
| Preloads everything | Targeted preloads with trade-offs |
| Ignores fonts | font-display, subsetting, self-hosting |
| No measurement | Lighthouse, Performance panel, WebPageTest |

#### Useful phrases
- "CSS blocks rendering; synchronous scripts block parsing."
- "I inline only the CSS needed for the first screen and load the rest without blocking."
- "The LCP image must be in the HTML and prioritised."
- "Preloads compete for bandwidth, so I only preload truly critical resources."

#### Common pitfalls
- **Huge blocking CSS bundles.**
- **Synchronous third-party scripts in the head.**
- **Client-only rendering** of above-the-fold content.
- **Over-preloading.**

#### Follow-ups to expect (with sample answers)
- **"How do you find critical CSS?"**
  "Tools like Critical/Critters extract above-the-fold CSS during build; frameworks like Next.js do some of this automatically."
- **"What's the difference between preload and prefetch?"**
  "Preload is for resources needed for the current page soon (high priority); prefetch is for likely future navigations (low priority, idle time)."
- **"How does HTTP/2 change bundling advice?"**
  "Multiplexing makes many small files cheaper, but bundling still helps compression and reduces request overhead; aim for sensible chunking, not one giant file or hundreds of tiny ones."

#### What senior interviewers look for
- **Clear mental model.**
- **Practical optimisation skill.**
- **Measurement-driven trade-offs.**

#### Practise it
1. Run Lighthouse on a page and fix its render-blocking resources.
2. Implement critical CSS inlining for one route and measure FCP.
3. Explain render-blocking vs parser-blocking, out loud.

## Reflow, repaint and compositing
- id: fe-browser-03
- roles: frontend, fullstack
- round: BROWSER_WEB_PLATFORM
- difficulty: medium
- levels:
- tags: reflow, repaint, layout thrashing, compositing, rendering performance

### Prompt
Explain reflow (layout), repaint and compositing. What triggers each, what is layout thrashing (forced synchronous layout), and how do you avoid it? Show how you'd diagnose rendering performance problems in DevTools.

### Answer
#### What the interviewer is really testing
- Understanding the **pixel pipeline** costs: style → layout → paint → composite.
- Knowing **what triggers layout and paint**, and which properties are compositor-only.
- Recognising and fixing **layout thrashing** (read/write interleaving).
- Using **DevTools** to diagnose (Performance panel, paint flashing, layout shift regions, layers).

#### Key points
- **Reflow/layout**: recalculating sizes and positions. Triggered by DOM changes, changing geometry properties (width, height, margin, padding, top/left, font-size), content changes, window resize, and **reading layout properties** after writes.
- **Repaint**: redrawing pixels without geometry changes (colour, background, visibility, shadows).
- **Composite**: combining layers; **transform** and **opacity** changes can skip layout and paint.
- **Layout thrashing**: alternating DOM writes and layout reads (`offsetHeight`, `getBoundingClientRect`, `scrollTop`, `getComputedStyle`) in a loop forces the browser to recalculate layout synchronously each time.
- Fixes: **batch reads then writes**, use `requestAnimationFrame` for writes, cache measurements, use **ResizeObserver/IntersectionObserver** instead of polling layout, use CSS **containment** (`contain`, `content-visibility`).
- Layout cost scales with **DOM size and scope**: large DOMs make every layout expensive.
- Diagnose with **Performance panel** (purple Layout, green Paint, 'Forced reflow' warnings), **Rendering tab** (paint flashing, layout shift regions, layer borders).

#### Model answer
"Each frame, the browser may run some or all of: JavaScript → style recalculation → layout → paint → composite. Performance depends on how much of that pipeline your changes trigger, and how often.

**Definitions:**
- **Layout (reflow)**: computing geometry: the size and position of elements. One element's change can affect its children, siblings and ancestors, so layout can touch much of the page.
- **Paint (repaint)**: filling pixels for visual properties (text, colours, backgrounds, borders, shadows).
- **Composite**: assembling already-painted layers; changes to `transform` and `opacity` on a layer can be handled here alone, often on the GPU and compositor thread.

**What triggers what:**
| Change | Layout | Paint | Composite |
|---|---|---|---|
| width, height, margin, padding, top/left, font-size, adding DOM nodes | Yes | Yes | Yes |
| color, background, box-shadow, visibility | No | Yes | Yes |
| transform, opacity (on own layer) | No | No | Yes |

**Layout thrashing (forced synchronous layout):**
```js
// Bad: read → write → read → write… forces layout on every iteration
const items = document.querySelectorAll('.card');
items.forEach((el) => {
  const h = el.offsetHeight;                // read: needs up-to-date layout
  el.style.height = `${h + 10}px`;          // write: invalidates layout
});
```
Normally the browser batches style changes and computes layout once before painting. But reading a layout property (`offsetHeight`) after a write forces it to compute layout immediately to give an accurate answer. Doing that inside a loop forces hundreds of layouts in one frame.

**Fix: batch reads, then writes:**
```js
const heights = Array.from(items, (el) => el.offsetHeight);   // all reads first (one layout)
items.forEach((el, i) => { el.style.height = `${heights[i] + 10}px`; });  // then all writes
```
For code where reads and writes come from different components, schedule writes in `requestAnimationFrame` (libraries like fastdom formalise read/write batching).

**Properties and methods that force layout when read** (after pending writes): `offsetTop/Left/Width/Height`, `clientWidth/Height`, `scrollTop/Height`, `getBoundingClientRect()`, `getComputedStyle()` (for layout-dependent values), `innerText`, `focus()` (may scroll), `scrollIntoView()`.

**Avoiding layout work in the first place:**
- Animate with `transform`/`opacity` rather than top/left/width.
- Use **observers** instead of polling layout on scroll: `IntersectionObserver` for visibility, `ResizeObserver` for size changes.
- **Batch DOM insertions** (build a fragment or let the framework batch renders) instead of inserting many nodes one by one with reads in between.
- **Reduce DOM size**: virtualise long lists (render only visible rows); Lighthouse warns above ~1,500 nodes. Every layout is proportional to the affected subtree.
- **CSS containment**: `contain: layout paint` tells the browser changes inside an element don't affect outside, limiting layout scope; `content-visibility: auto` skips rendering work for off-screen sections entirely (with `contain-intrinsic-size` to reserve space).
- Avoid layout-dependent work in scroll handlers; use passive listeners and rAF.

**React-specific notes:**
- React batches DOM writes during commit, but `useLayoutEffect` code that measures (reads) after rendering, then sets state (writes), can cause extra synchronous layouts and re-renders; keep it minimal.
- Large lists re-rendering cause big layout costs; virtualisation (TanStack Virtual, react-window) and memoisation help.

**Diagnosing in DevTools:**
1. **Performance panel**: record the interaction; look for purple 'Layout' and 'Recalculate Style' blocks and green 'Paint'. Red triangles mark 'Forced reflow' warnings with the JavaScript stack that caused them.
2. **Rendering tab**: 'Paint flashing' highlights repainted areas (large flashing areas during scroll are suspicious); 'Layout Shift Regions' shows CLS; 'Layer borders' shows composited layers; 'Frame rendering stats' shows FPS.
3. **Layers panel**: see why elements were promoted to layers and their memory cost.
4. Check **DOM size** and **selector complexity** in style recalculation costs."

#### Another worked example: a janky masonry grid
"A masonry photo grid positioned each tile by reading the column heights and setting `top`/`left` for every image as it loaded, interleaving reads and writes. With 300 images, scrolling stuttered and the Performance panel showed hundreds of forced reflows. We batched measurements, positioned tiles with `transform: translate()`, and used `ResizeObserver` to reposition only when sizes changed. Frame times dropped from ~60 ms to under 10 ms."

#### A third worked example: content-visibility for a long page
"A documentation page with 200 sections took 1.2 s of rendering work on load. Adding `content-visibility: auto; contain-intrinsic-size: auto 800px;` to each section let the browser skip layout and paint for off-screen sections until scrolled near. Initial rendering time dropped by about 70% with a two-line CSS change."

#### Variations you might be asked
- "Is display: none or visibility: hidden cheaper?": `display: none` removes the element from layout (changing it triggers layout); `visibility: hidden` keeps its space (changing it triggers paint only).
- "Does reading scrollTop always force layout?": only if there are pending layout-affecting changes; otherwise it returns cached values.
- "What's the cost of a big DOM?": more memory, slower style recalculation and layout, and slower queries; virtualise and lazy-render.

#### Step-by-step framework
1. **Describe the pipeline.**
2. **Define layout, paint, composite** with triggers.
3. **Explain layout thrashing** with code.
4. **Fix with batching and rAF.**
5. **Reduce work** (transform, observers, DOM size, containment).
6. **Diagnose with DevTools.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Reflow is bad" | Explains triggers and costs precisely |
| Unaware of forced synchronous layout | Read/write interleaving example and fix |
| Polls layout on scroll | IntersectionObserver/ResizeObserver |
| Huge DOMs | Virtualisation, containment, content-visibility |
| Guesses | Performance panel, paint flashing, layers |

#### Useful phrases
- "Reading layout after a write forces the browser to calculate layout immediately."
- "I batch all reads, then all writes."
- "Transform and opacity changes can skip layout and paint."
- "content-visibility lets the browser skip off-screen rendering work."

#### Common pitfalls
- **Measuring inside loops that write.**
- **Animating geometry properties.**
- **Scroll handlers with layout reads.**
- **Rendering thousands of DOM nodes.**

#### Follow-ups to expect (with sample answers)
- **"What's the difference between style recalculation and layout?"**
  "Style recalculation computes which CSS rules apply and the computed values; layout computes geometry from those values."
- **"How does will-change relate?"**
  "It can promote an element to its own layer so transform/opacity animations are composited without repaint."
- **"How do you measure an element without causing thrashing?"**
  "Read once and cache, read in a batch before writes, or use ResizeObserver which delivers sizes asynchronously."

#### What senior interviewers look for
- **Pipeline mastery.**
- **Practical fixes.**
- **Profiling skill.**

#### Practise it
1. Write a thrashing loop, profile it, then fix it with batching.
2. Use paint flashing to find unnecessary repaints on a page you own.
3. Explain forced synchronous layout, out loud.

## Browser storage: cookies, localStorage, sessionStorage, IndexedDB
- id: fe-browser-04
- roles: frontend, fullstack
- round: BROWSER_WEB_PLATFORM
- difficulty: medium
- levels:
- tags: storage, cookies, localStorage, IndexedDB, Cache API

### Prompt
Compare the browser storage options: cookies, `localStorage`, `sessionStorage`, IndexedDB and the Cache API. Discuss capacity, lifetime, scope, synchronous vs asynchronous access, security implications (including auth tokens), and which you'd use for different kinds of data.

### Answer
#### What the interviewer is really testing
- Knowing the **characteristics** of each storage mechanism.
- **Security awareness**: XSS access to storage, cookie flags, what not to store.
- **Performance**: synchronous APIs blocking the main thread; data sizes.
- **Choosing appropriately** for preferences, drafts, offline data, caches and auth.

#### Key points
- **Cookies**: small (~4 KB each), sent with **every matching HTTP request**, configurable lifetime, scoped by domain/path; flags **HttpOnly** (no JS access), **Secure**, **SameSite**. Best for **server-read data**, especially session identifiers.
- **localStorage**: ~5 MB per origin, strings only, **synchronous**, persists until cleared, shared across tabs of the same origin, `storage` event for cross-tab sync. Accessible to any JS on the page (XSS risk).
- **sessionStorage**: like localStorage but **per tab** and cleared when the tab closes.
- **IndexedDB**: large (hundreds of MB to GBs, quota-based), **asynchronous**, structured data (objects, Blobs), indexes and transactions; usable in workers. API is verbose; use wrappers (idb, Dexie).
- **Cache API**: stores Request/Response pairs, used by **service workers** for offline assets and API caching.
- All are **origin-scoped** and may be **evicted** under storage pressure unless persistent storage is granted; private browsing and Safari ITP limit lifetimes.
- **Don't store secrets** (tokens) in localStorage if avoidable; prefer HttpOnly cookies for sessions.
- Always wrap storage access in try/catch (blocked storage, quota errors) and handle missing data.

#### Model answer
"Each option fits a different job; the main questions are: does the server need to read it, how big is it, how long should it live, and how sensitive is it?

**Comparison:**
| | Cookies | localStorage | sessionStorage | IndexedDB | Cache API |
|---|---|---|---|---|---|
| Capacity | ~4 KB each | ~5 MB/origin | ~5 MB/origin | Large (quota, % of disk) | Large (quota) |
| Sent to server | Every matching request | No | No | No | No |
| API | String header / document.cookie | Sync, strings | Sync, strings | Async, structured, transactions | Async, Request/Response |
| Lifetime | Expiry date or session | Until cleared | Tab session | Until cleared/evicted | Until cleared/evicted |
| Scope | Domain/path | Origin, all tabs | Origin, one tab | Origin | Origin |
| JS access | Unless HttpOnly | Yes | Yes | Yes | Yes (incl. service worker) |
| Workers | No | No | No | Yes | Yes |

**Cookies:**
```http
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1209600
```
- Sent automatically with requests to the domain, so the server can identify the session.
- `HttpOnly`: JavaScript can't read it (protects against token theft via XSS). `Secure`: HTTPS only. `SameSite=Lax/Strict`: mitigates CSRF by not sending on most cross-site requests.
- Downsides: added to every request (bandwidth), small, and not suitable for app data.
- Best for: **session identifiers**, server-read preferences (theme for SSR, locale), CSRF tokens.

**localStorage:**
```js
function savePreferences(prefs) {
  try { localStorage.setItem('prefs', JSON.stringify(prefs)); }
  catch (e) { /* quota exceeded, storage blocked (private mode, settings) */ }
}
function loadPreferences() {
  try { return JSON.parse(localStorage.getItem('prefs') ?? 'null') ?? DEFAULTS; }
  catch { return DEFAULTS; }
}
window.addEventListener('storage', (e) => {        // fires in OTHER tabs when a key changes
  if (e.key === 'prefs') applyPreferences(loadPreferences());
});
```
- Simple, persistent, shared across tabs.
- **Synchronous**: large reads/writes block the main thread; keep data small.
- Strings only: JSON serialise (Dates become strings, see earlier).
- Any script on the page (including a compromised third-party script or XSS) can read it.
- Best for: **non-sensitive preferences and UI state** (theme choice, dismissed banners, recently viewed items), small caches.

**sessionStorage:**
- Per tab, cleared when the tab closes; survives reloads within the tab.
- Best for: **per-tab temporary state** like a multi-step form draft in this tab, or scroll position restoration.

**IndexedDB:**
```js
import { openDB } from 'idb';
const db = await openDB('app', 1, {
  upgrade(db) {
    const store = db.createObjectStore('messages', { keyPath: 'id' });
    store.createIndex('byConversation', 'conversationId');
  },
});
await db.put('messages', { id: 'm1', conversationId: 'c1', text: 'Hi', sentAt: new Date() });
const msgs = await db.getAllFromIndex('messages', 'byConversation', 'c1');
```
- Asynchronous (doesn't block UI), stores structured data including Dates and Blobs, supports indexes and transactions, works in Web Workers and service workers.
- Best for: **offline data** (emails, documents, drafts), **large client caches** (e.g. TanStack Query persistence), **queued offline mutations**, files.

**Cache API:**
```js
const cache = await caches.open('static-v3');
await cache.addAll(['/', '/app.js', '/styles.css', '/offline.html']);
const response = await caches.match(request);
```
- Stores HTTP responses; used by service workers to serve app shells, assets and API responses offline or faster (stale-while-revalidate).

**Auth tokens: a common interview topic:**
- Storing access tokens in localStorage is common in SPAs but means any XSS can steal them and use them elsewhere.
- Safer default: **HttpOnly, Secure, SameSite cookies** for session or refresh tokens (JS can't read them), with CSRF protection. A backend-for-frontend (BFF) can hold tokens server-side entirely.
- If tokens must be in JS (e.g. calling third-party APIs directly), keep short-lived access tokens **in memory**, refresh via an HttpOnly refresh cookie, and invest in XSS prevention (CSP).

**Practical considerations:**
- **Eviction and quotas**: browsers can evict storage under pressure (best-effort storage); request `navigator.storage.persist()` for important offline data; check usage with `navigator.storage.estimate()`.
- **Safari ITP** caps script-writable storage lifetime (e.g. 7 days without user interaction) for some contexts; don't rely on client storage as the only copy of important data.
- **Privacy and consent**: non-essential storage (analytics identifiers) may require consent under GDPR/ePrivacy.
- **Versioning**: include a schema version so you can migrate or discard stale stored data after app updates.
- **SSR**: storage APIs don't exist on the server; read them in effects, and use cookies when the server needs the value for the first render (e.g. theme)."

#### Another worked example: an offline-capable notes app
"Notes were stored in IndexedDB (via Dexie) so the app worked offline, with an outbox table of pending changes synced when online. UI preferences lived in localStorage, the session in an HttpOnly cookie, and the app shell in the Cache API via a service worker. Each piece of data went to the storage designed for it: large and structured in IndexedDB, small preferences in localStorage, secrets out of JS entirely."

#### A third worked example: moving tokens out of localStorage
"A security review flagged that our SPA stored a 30-day JWT in localStorage, so any XSS would leak long-lived account access. We moved to a BFF pattern: the browser holds only an HttpOnly, SameSite=Lax session cookie; the BFF exchanges it for API tokens server-side. Combined with a strict CSP, this significantly reduced the impact of any future XSS."

#### Variations you might be asked
- "What happens to localStorage in private browsing?": it usually works but is cleared when the private session ends; some older browsers threw on write.
- "How do you sync state across tabs?": the `storage` event for localStorage, or BroadcastChannel for messages between tabs.
- "Why is localStorage slow for large data?": it's synchronous and string-based, so serialising and reading large values blocks the main thread.

#### Step-by-step framework
1. **List options with characteristics.**
2. **Cookies** and their flags.
3. **localStorage/sessionStorage** with sync and security caveats.
4. **IndexedDB and Cache API** for large/offline data.
5. **Auth token storage** trade-offs.
6. **Eviction, privacy, versioning, SSR.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use localStorage for everything" | Matches data to storage type |
| Tokens in localStorage without concern | HttpOnly cookies/BFF or memory tokens + CSP |
| Unaware sync APIs block | Notes localStorage is synchronous |
| No error handling | try/catch for quota and blocked storage |
| Assumes storage is permanent | Eviction, ITP, persist() |

#### Useful phrases
- "Cookies are for data the server needs on every request."
- "localStorage is synchronous and readable by any script, so keep it small and non-sensitive."
- "IndexedDB is the right place for large, structured or offline data."
- "Session tokens belong in HttpOnly cookies where JavaScript can't read them."

#### Common pitfalls
- **Secrets in localStorage.**
- **Large JSON in localStorage.**
- **No schema versioning.**
- **Relying on client storage as the only copy** of important data.

#### Follow-ups to expect (with sample answers)
- **"What's SameSite=None used for?"**
  "Cookies needed in cross-site contexts (embedded widgets, third-party SSO); it requires Secure and is increasingly restricted by third-party cookie phase-outs."
- **"How much can IndexedDB store?"**
  "It depends on the browser and disk; often a significant percentage of free disk space per origin, subject to eviction unless persistent."
- **"How do you clear user data on logout?"**
  "Expire session cookies server-side, clear localStorage/sessionStorage keys, delete IndexedDB databases and caches containing user data, and reset in-memory state."

#### What senior interviewers look for
- **Security-conscious choices.**
- **Performance awareness.**
- **Robust handling of real-world storage limits.**

#### Practise it
1. Store preferences in localStorage with error handling and cross-tab sync.
2. Build a small IndexedDB store with an index using idb or Dexie.
3. Explain where you'd store auth tokens and why, out loud.

## HTTP caching, service workers and offline-first PWAs
- id: fe-browser-05
- roles: frontend, fullstack
- round: BROWSER_WEB_PLATFORM
- difficulty: medium
- levels:
- tags: HTTP caching, Cache-Control, service workers, PWA, offline

### Prompt
Explain HTTP caching (`Cache-Control`, `ETag`, revalidation, immutable hashed assets) and how service workers extend it. Describe caching strategies (cache-first, network-first, stale-while-revalidate), how you'd make an app work offline, and the pitfalls of service worker updates.

### Answer
#### What the interviewer is really testing
- Precise knowledge of **HTTP cache headers** and validation.
- A sensible **caching policy** for HTML, hashed assets and API responses.
- **Service worker lifecycle** and caching strategies.
- Awareness of **update pitfalls** (stale apps, broken deploys) and offline UX.

#### Key points
- **`Cache-Control`** directives: `max-age`, `s-maxage` (shared caches/CDN), `no-cache` (store but revalidate every time), `no-store` (never store), `private`/`public`, `immutable`, `stale-while-revalidate`.
- **Validation**: `ETag` / `If-None-Match` and `Last-Modified` / `If-Modified-Since` → **304 Not Modified** (no body).
- **Hashed static assets** (`app.3f9a1c.js`): `Cache-Control: public, max-age=31536000, immutable`; content changes produce a new file name.
- **HTML**: `no-cache` (or short max-age with revalidation) so users get new deployments quickly.
- **API responses**: usually `private, no-store` or short caching depending on data; CDN caching with `s-maxage` and `stale-while-revalidate` for public data.
- **Service worker**: a script running in the background that intercepts fetches, enabling offline, custom caching and background sync.
- Strategies: **cache-first** (static assets), **network-first** (HTML, fresh data), **stale-while-revalidate** (fast + eventually fresh), **network-only**, **cache-only**.
- Lifecycle: **install → waiting → activate**; new versions wait until old tabs close unless `skipWaiting`; handle updates with a "New version available, reload" prompt.
- Tools: **Workbox** simplifies precaching and strategies; frameworks/plugins (vite-plugin-pwa).

#### Model answer
"Caching is the cheapest performance win: the fastest request is one you never make. I think in two layers: HTTP caching, which browsers and CDNs do for free when headers are right, and service workers, which let the app control caching and work offline.

**HTTP caching policy by resource type:**
```http
# Hashed JS/CSS/images (content-addressed file names)
Cache-Control: public, max-age=31536000, immutable

# HTML documents
Cache-Control: no-cache
ETag: "abc123"

# Public API data that can be slightly stale (e.g. product catalogue via CDN)
Cache-Control: public, s-maxage=60, stale-while-revalidate=300

# Personal or sensitive data
Cache-Control: private, no-store
```
- **Hashed assets** never change under the same URL, so they can be cached for a year and marked `immutable` (the browser won't even revalidate on reload). A deploy produces new file names.
- **HTML** must be fresh so it references the new hashed assets: `no-cache` means 'you can store it but must check with the server first'; with an ETag, unchanged HTML returns a tiny **304**.
- `no-cache` ≠ `no-store`: `no-store` forbids storing at all (for sensitive pages).
- **CDN-specific**: `s-maxage` applies to shared caches; `stale-while-revalidate` serves a stale copy instantly while fetching a fresh one in the background.

**Revalidation flow:**
```
Browser: GET /index.html  (If-None-Match: "abc123")
Server:  304 Not Modified          → use cached copy (no body transferred)
   or:   200 OK, ETag: "def456"    → new content
```

**Common HTTP caching mistakes:**
- Caching HTML for a long time, so users load old HTML pointing to deleted asset files after a deploy (blank page, chunk load errors).
- Un-hashed asset names with long max-age (users stuck on old JS).
- Caching personalised API responses publicly at the CDN (data leaks between users); use `private` and vary correctly.

**Service workers.** A service worker is a script the browser runs separately from the page, which can intercept network requests from its scope:
```js
// sw.js (simplified)
const STATIC = 'static-v42';
const PRECACHE = ['/', '/offline.html', '/app.3f9a1c.js', '/styles.8b2e.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== STATIC).map((k) => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode === 'navigate') {
    // network-first for HTML, falling back to cache/offline page
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) ?? caches.match('/offline.html')));
  } else if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    // cache-first for static assets
    event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
  }
});
```

**Strategies:**
| Strategy | How | Good for |
|---|---|---|
| Cache-first | Cache, then network on miss | Hashed assets, fonts, icons |
| Network-first | Network, fall back to cache | HTML, frequently changing data |
| Stale-while-revalidate | Serve cache immediately, update in background | Avatars, non-critical API data, feeds |
| Network-only | Always network | Payments, auth |
| Cache-only | Precached only | App shell in offline mode |

**Making an app work offline:**
1. **Precache the app shell** (HTML, JS, CSS, icons) at install.
2. **Cache data** the user needs offline in **IndexedDB** (documents, messages) and render from it.
3. **Queue writes** made offline (an outbox in IndexedDB) and replay when back online, using **Background Sync** where supported or on the `online` event / next app start.
4. **Offline UX**: show connection status, mark unsynced changes, disable actions that truly need the network, handle conflicts.
5. A **web app manifest** (name, icons, display mode) makes it installable as a PWA.

**Service worker update pitfalls:**
- A new service worker installs but **waits** until all tabs using the old one are closed. Users may run old code for days.
- Calling `skipWaiting()` + `clients.claim()` activates immediately, but the page may now be running old JS while the SW serves new assets, risking mismatches. The safer UX: detect a waiting worker and show 'A new version is available — Reload'.
- A buggy service worker can **break the site for returning users**. Have a kill switch: deploy a no-op SW that clears caches and unregisters itself. Never cache `sw.js` itself for long (browsers check for updates, capped at 24 hours).
- Precaching too much wastes bandwidth and storage; precache the shell, cache the rest at runtime with limits (Workbox expiration).
- Test in DevTools Application panel (update on reload, bypass for network, offline mode).

**Tools:** Workbox (precaching with revisioned manifests, strategies, expiration, background sync), vite-plugin-pwa or framework integrations generate the service worker from the build output."

#### Another worked example: blank screens after deploys
"After each deploy, some users saw a blank page with 'ChunkLoadError'. The HTML was cached by the CDN for 10 minutes, referencing old chunk names that had been deleted. Fixes: `Cache-Control: no-cache` on HTML, keeping previous deploys' assets available for a few days, and a client-side handler that reloads once on chunk load errors. The errors disappeared from monitoring."

#### A third worked example: an offline field-inspection app
"Inspectors worked in buildings with no signal. We made the React app a PWA: Workbox precached the shell, inspection templates and photos were stored in IndexedDB, and submissions went into an outbox replayed when connectivity returned, with a visible 'Pending sync (3)' badge. A 'new version available' toast handled service worker updates safely. Inspectors could complete full days offline."

#### Variations you might be asked
- "What does Vary do?": tells caches which request headers affect the response (e.g. `Vary: Accept-Encoding` or `Accept-Language`), so different variants are cached separately.
- "Is the service worker cache the same as the HTTP cache?": no; the Cache API is controlled by your code; the HTTP cache is controlled by headers. A SW fetch to the network still goes through the HTTP cache.
- "What's bfcache?": the back/forward cache keeps entire pages in memory for instant history navigation; `unload` handlers and `Cache-Control: no-store` can prevent it.

#### Step-by-step framework
1. **Explain HTTP cache headers** and validation.
2. **Policy per resource type.**
3. **Common mistakes.**
4. **Service worker basics** and strategies.
5. **Offline architecture** (shell, IndexedDB, outbox, UX).
6. **Update pitfalls and tooling.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Cache everything for a long time" | Different policies for HTML, hashed assets, APIs |
| Confuses no-cache and no-store | Precise directive meanings |
| SW caches everything cache-first | Strategy per resource type |
| skipWaiting without thought | Update prompt, kill switch |
| Offline = cached pages | IndexedDB data, outbox sync, offline UX |

#### Useful phrases
- "Hashed assets are cached forever; HTML is revalidated every time."
- "no-cache means revalidate, not don't cache."
- "Stale-while-revalidate gives speed now and freshness soon."
- "A new service worker waits for old tabs to close, so I prompt users to reload."

#### Common pitfalls
- **Long-cached HTML.**
- **Publicly cached personal data.**
- **Service workers that can't be updated or removed.**
- **Precaching everything.**

#### Follow-ups to expect (with sample answers)
- **"How does the browser check for service worker updates?"**
  "On navigation and periodically (at most every 24 hours by default), it re-fetches sw.js and installs a new version if the bytes differ."
- **"How do you invalidate CDN caches on deploy?"**
  "Hashed asset URLs avoid invalidation; for HTML, short TTLs with revalidation or explicit purges via the CDN API."
- **"What's the scope of a service worker?"**
  "The path it's served from and below (e.g. /app/sw.js controls /app/), unless widened with the Service-Worker-Allowed header."

#### What senior interviewers look for
- **Precise caching knowledge.**
- **Safe service worker engineering.**
- **Offline-first product thinking.**

#### Practise it
1. Write the Cache-Control policy for a Vite app's HTML, assets and API.
2. Add a service worker with Workbox and an update prompt.
3. Explain stale-while-revalidate, out loud.

## Event propagation, delegation and the DOM event model
- id: fe-browser-06
- roles: frontend, fullstack
- round: BROWSER_WEB_PLATFORM
- difficulty: medium
- levels:
- tags: events, bubbling, capturing, delegation, DOM

### Prompt
Explain how DOM events propagate (capture, target, bubble), the difference between `target` and `currentTarget`, `stopPropagation` vs `preventDefault`, event delegation and its benefits, passive listeners, and how React's event system differs from native events.

### Answer
#### What the interviewer is really testing
- Precise understanding of the **three propagation phases**.
- Using **event delegation** correctly (with `closest`).
- Knowing the **side effects of stopping propagation** and the meaning of `preventDefault`.
- **Performance**: passive listeners, removing listeners; and **React's synthetic events** and root delegation.

#### Key points
- **Capture phase**: from `window` down to the target's parent; **target phase**; **bubble phase**: back up to `window`.
- `addEventListener(type, fn, { capture: true })` listens during capture; default is bubble.
- **`event.target`**: the element that originated the event; **`event.currentTarget`**: the element the listener is attached to.
- **`stopPropagation()`**: stops further propagation (other ancestors won't hear it); `stopImmediatePropagation()` also stops other listeners on the same element.
- **`preventDefault()`**: cancels the browser's default action (form submit, link navigation, checkbox toggle, scroll on touch) but doesn't stop propagation.
- Some events **don't bubble** (`focus`, `blur`, `mouseenter`, `mouseleave`); use `focusin`/`focusout` for delegation.
- **Event delegation**: one listener on a parent handles events for many children (including future ones) using `event.target.closest(selector)`.
- **Passive listeners** (`{ passive: true }`) for scroll/touch/wheel tell the browser you won't call preventDefault, so scrolling isn't blocked.
- **React** attaches listeners at the **root container** (since React 17) and dispatches synthetic events; `e.stopPropagation()` in React stops React propagation; native listeners on document still interact with root ordering.

#### Model answer
"When you click a button inside a list inside a page, the event doesn't just happen on the button: it travels through the DOM in three phases.

**Propagation phases:**
```
window → document → html → body → ul → li → button     (1. capture: top-down)
                                            button     (2. target)
window ← document ← html ← body ← ul ← li ← button     (3. bubble: bottom-up)
```
```js
document.querySelector('ul').addEventListener('click', () => console.log('ul capture'), { capture: true });
document.querySelector('ul').addEventListener('click', () => console.log('ul bubble'));
document.querySelector('button').addEventListener('click', () => console.log('button'));
// Clicking the button logs: 'ul capture', 'button', 'ul bubble'
```
Most handlers use the bubble phase (the default). Capture is useful when you need to see events before children handle them (e.g. closing popovers on any outside click, analytics).

**target vs currentTarget:**
```js
list.addEventListener('click', (e) => {
  console.log(e.target);         // the innermost element clicked (maybe an <svg> icon inside a button)
  console.log(e.currentTarget);  // the element this listener is attached to (the list)
});
```

**stopPropagation vs preventDefault:**
```js
link.addEventListener('click', (e) => {
  e.preventDefault();      // don't navigate — but ancestors still receive the click
});
menuItem.addEventListener('click', (e) => {
  e.stopPropagation();     // ancestors won't receive it — default action still happens
});
```
I avoid `stopPropagation` where possible: it breaks other code relying on bubbling, such as analytics listeners, 'click outside to close' logic on the document, and delegated handlers. A common bug: a dropdown calls stopPropagation, so a modal's outside-click handler never fires. Better: check `event.target` in the outer handler, or use `event.composedPath()` to see whether the click came from inside a component.

**Event delegation:**
```js
// One listener for any number of rows, including rows added later
table.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-action]');
  if (!button || !table.contains(button)) return;
  const row = button.closest('tr');
  const { action } = button.dataset;
  if (action === 'delete') deleteRow(row.dataset.id);
  if (action === 'edit') editRow(row.dataset.id);
});
```
Benefits: fewer listeners (memory, setup time), automatic handling of dynamically added elements, and one place for logic. `closest()` matters because `e.target` might be an icon or span inside the button.

Non-bubbling events: `focus`/`blur` don't bubble; use `focusin`/`focusout` for delegated focus handling. `mouseenter`/`mouseleave` don't bubble; use `mouseover`/`mouseout` with checks.

**Passive listeners and scrolling performance:**
```js
window.addEventListener('touchstart', onTouch, { passive: true });
window.addEventListener('wheel', onWheel, { passive: true });
```
If a touch or wheel listener might call `preventDefault`, the browser must wait for it before scrolling, causing scroll jank. Passive listeners promise not to, so scrolling starts immediately. Browsers default `touchstart`/`touchmove`/`wheel` on window/document/body to passive.

**Other useful options:** `{ once: true }` auto-removes after the first call; `{ signal }` removes the listener when an AbortController aborts (great for cleanup of many listeners at once).

**Custom events:**
```js
el.dispatchEvent(new CustomEvent('cart:add', { detail: { id: 42 }, bubbles: true, composed: true }));
```
`composed: true` lets an event cross Shadow DOM boundaries.

**React's event system:**
- React attaches a listener per event type at the **root container** (React 17+; previously `document`) and dispatches **synthetic events** through the React tree. It's effectively delegation built in.
- `onClick` on a component isn't a native listener on that DOM node.
- `e.stopPropagation()` stops propagation through React handlers; native listeners added to `document` still run (they're above the root), and native listeners on inner elements run before React's root listener.
- React provides capture variants (`onClickCapture`).
- React's `onChange` for inputs fires on every keystroke (like native `input`), not on blur like native `change`.
- Portals: React events bubble through the **React tree**, not the DOM tree, so a click inside a portalled modal bubbles to its React parent even though the DOM node is elsewhere. Useful, but surprising for outside-click logic that checks DOM containment."

#### Another worked example: outside-click handler broken by stopPropagation
"A dropdown closed on outside clicks via a document listener. A nested date picker inside it called `stopPropagation()` on clicks, so the dropdown never learned about clicks inside the date picker, and clicks on the date picker's own popup (rendered in a portal) were treated as outside clicks, closing everything. We removed stopPropagation and used `event.composedPath()` to check whether the click path included either the dropdown or the date picker's popup; both bugs disappeared."

#### A third worked example: delegation for a large table
"A table with 5,000 rows attached three listeners per row (15,000 listeners), slowing initial render and leaking listeners when rows were replaced. One delegated listener on the table with `closest('[data-action]')` reduced setup time noticeably and removed the leak. (In React, this is less necessary because React already delegates at the root, but it's relevant for vanilla JS and widget libraries.)"

#### Variations you might be asked
- "How do you implement click-outside?": a document listener (pointerdown, capture phase often) checking whether the event path includes the component's element(s).
- "What's the difference between pointer, mouse and touch events?": pointer events unify mouse, touch and pen; prefer them for new code.
- "Does preventDefault stop propagation?": no; they're independent.

#### Step-by-step framework
1. **Describe the three phases.**
2. **target vs currentTarget.**
3. **stopPropagation vs preventDefault**, with risks.
4. **Event delegation** with closest and non-bubbling events.
5. **Passive, once and signal options.**
6. **React's synthetic event system**, root delegation and portals.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Events bubble up" only | Capture, target, bubble with examples |
| Confuses target/currentTarget | Clear distinction |
| stopPropagation everywhere | Knows its side effects; uses composedPath |
| No delegation knowledge | closest-based delegation, focusin/focusout |
| Unaware of React specifics | Root delegation, portals bubbling through React tree |

#### Useful phrases
- "preventDefault cancels the browser's default action; stopPropagation stops the event travelling further."
- "With delegation, one listener handles current and future children."
- "I use closest() because the target might be an icon inside the button."
- "In React, events from a portal bubble through the React tree, not the DOM tree."

#### Common pitfalls
- **Overusing stopPropagation.**
- **Using e.target without closest.**
- **Non-passive scroll listeners.**
- **Forgetting to remove listeners.**

#### Follow-ups to expect (with sample answers)
- **"What's composedPath?"**
  "An array of the nodes the event will travel through, including shadow DOM internals when composed, useful for containment checks."
- **"Why did React move delegation from document to root in v17?"**
  "To allow multiple React versions/apps on one page and better interop with non-React code."
- **"Which events don't bubble?"**
  "focus, blur, mouseenter, mouseleave, load, scroll on elements (scroll bubbles from document to window in some cases), and media events."

#### What senior interviewers look for
- **Precise event model knowledge.**
- **Practical delegation and cleanup.**
- **Framework-level understanding.**

#### Practise it
1. Log capture/target/bubble order for nested elements.
2. Implement a delegated table action handler with closest.
3. Explain why stopPropagation can break outside-click handlers, out loud.

## Web Workers and moving work off the main thread
- id: fe-browser-07
- roles: frontend, fullstack
- round: BROWSER_WEB_PLATFORM
- difficulty: medium
- levels:
- tags: Web Workers, main thread, performance, Comlink, OffscreenCanvas

### Prompt
What are Web Workers, and when should you use them? Explain how communication works (postMessage, structured cloning, transferable objects, SharedArrayBuffer), what workers can and can't do, and show a practical example of moving heavy work off the main thread in a React app.

### Answer
#### What the interviewer is really testing
- Understanding the **single main thread** problem and when workers help.
- **Communication costs**: cloning vs transferring, message design.
- **Limits**: no DOM access, separate global scope, startup cost.
- Practical **integration** (Comlink, bundlers, React hooks) and alternatives (chunking, WASM, server-side).

#### Key points
- The **main thread** runs JS, layout, paint and input handling; long tasks there cause jank and poor INP.
- **Web Workers** run JS on a **separate thread** with their own event loop and global scope (`self`).
- Communicate via **`postMessage`**; data is copied with the **structured clone algorithm** (handles objects, Maps, Dates, Blobs, cycles; not functions or DOM nodes).
- **Transferable objects** (ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas) move ownership without copying: fast for large binary data.
- **SharedArrayBuffer** + Atomics allow shared memory but require **cross-origin isolation** headers (COOP/COEP).
- Workers **can't access the DOM** or `window`; they can use fetch, IndexedDB, timers, WebSockets, crypto, WASM, OffscreenCanvas.
- Types: **dedicated workers**, **shared workers** (shared across tabs), **service workers** (network proxy, not for computation).
- Use for: parsing large files (CSV/JSON), image processing, search indexing, syntax highlighting, diffing, encryption, data transforms, physics, ML inference.
- **Comlink** makes workers feel like async function calls; Vite supports `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`.

#### Model answer
"All JavaScript on the page normally runs on the main thread, the same thread that handles clicks, layout and painting. If I parse a 50 MB CSV there, the page freezes. Web Workers let me run that JavaScript on another thread, so the UI stays responsive.

**Basic worker:**
```ts
// csv.worker.ts
import Papa from 'papaparse';
self.onmessage = (e: MessageEvent<{ file: File }>) => {
  const rows: unknown[] = [];
  Papa.parse(e.data.file, {
    header: true,
    step: (r) => rows.push(r.data),
    complete: () => postMessage({ type: 'done', rows }),
    error: (err) => postMessage({ type: 'error', message: err.message }),
  });
};
```
```ts
// main thread
const worker = new Worker(new URL('./csv.worker.ts', import.meta.url), { type: 'module' });
worker.onmessage = (e) => {
  if (e.data.type === 'done') setRows(e.data.rows);
  else showError(e.data.message);
};
worker.postMessage({ file });
```
Bundlers like Vite handle the `new URL(..., import.meta.url)` pattern, bundling the worker separately.

**Communication and its costs:**
- `postMessage` copies data using the **structured clone algorithm** (objects, arrays, Maps, Sets, Dates, Blobs, Files and cyclic structures; but not functions, class prototypes or DOM nodes). Copying a huge object graph has a cost of its own: if the worker sends back 200 MB of objects, cloning can take hundreds of milliseconds on the main thread.
- **Transferables** move ownership instead of copying, near-instant regardless of size:
```ts
const buffer = imageData.data.buffer;            // ArrayBuffer
worker.postMessage({ buffer, width, height }, [buffer]);   // transferred; main thread can no longer use it
```
- **SharedArrayBuffer** gives true shared memory between threads (with `Atomics` for synchronisation), but requires cross-origin isolation (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`), which can break third-party embeds.
- Design messages to send **results, not raw data**, where possible: e.g. send back aggregates or only the visible page of rows.

**Comlink for ergonomic APIs:**
```ts
// search.worker.ts
import * as Comlink from 'comlink';
import MiniSearch from 'minisearch';
let index: MiniSearch;
const api = {
  build(docs: Doc[]) { index = new MiniSearch({ fields: ['title', 'body'] }); index.addAll(docs); },
  search(q: string) { return index.search(q).slice(0, 20); },
};
Comlink.expose(api);
export type SearchApi = typeof api;

// main thread
const search = Comlink.wrap<SearchApi>(new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' }));
await search.build(docs);
const results = await search.search('react hooks');   // feels like an async function call
```

**React integration pattern:**
```tsx
function useWorker<T>(factory: () => Worker) {
  const ref = useRef<Worker>();
  useEffect(() => {
    ref.current = factory();
    return () => ref.current?.terminate();       // clean up on unmount
  }, []);
  return ref;
}
```
Typically I create one long-lived worker per feature (startup costs a few to tens of milliseconds plus loading its script), reuse it, and terminate it when the feature unmounts.

**What workers can and can't do:**
| Can | Can't |
|---|---|
| fetch, WebSockets, IndexedDB, Cache API | Access the DOM or document |
| Timers, crypto.subtle, WASM | Access window, localStorage (sync APIs) |
| OffscreenCanvas rendering | Directly update React state |
| importScripts / ES module imports | Share variables with main thread (without SAB) |

**When to use workers (and when not):**
- Good fits: parsing/transforming large data, client-side search indexes, image/video/audio processing, PDF generation, syntax highlighting large code, diffing, compression, encryption, running ML models (e.g. ONNX/WebGPU-based inference), canvas rendering with OffscreenCanvas.
- Not worth it: small or quick tasks (message overhead and complexity exceed gains), DOM-heavy work, work that's slow because of React re-renders (fix rendering instead).
- Alternatives: chunk work with `scheduler.yield()`, WASM for raw compute speed (often inside a worker), or move work to the server.

**Measuring:** confirm long tasks disappear from the main thread in the Performance panel, and track INP before and after."

#### Another worked example: a spreadsheet import
"Importing a 200,000-row spreadsheet froze the page for 8 seconds ('Page unresponsive'). We moved parsing and validation into a worker that streamed progress messages every 5,000 rows, and only posted back summary statistics plus the first 100 rows for preview; the full dataset went directly from the worker to IndexedDB. The UI stayed at 60 fps with a live progress bar, and INP on the import page dropped from 1.8 s to 120 ms."

#### A third worked example: client-side search
"A documentation site with 3,000 pages built a search index in the browser on first search, blocking the main thread for ~600 ms. Moving index building and querying into a Comlink-wrapped worker (and caching the serialised index in IndexedDB) made search-as-you-type smooth, with results in under 20 ms per keystroke and no input lag."

#### Variations you might be asked
- "What's the difference between a Web Worker and a service worker?": web workers are for computation tied to a page; service workers act as a network proxy for an origin, run without a page, and control caching/offline.
- "What's a SharedWorker?": a worker shared by multiple tabs/windows of the same origin, useful for sharing one WebSocket connection; limited support on some mobile browsers.
- "Can React render in a worker?": not directly to the DOM; some experiments render off-main-thread and patch the DOM, but it's not mainstream.

#### Step-by-step framework
1. **Explain the main thread problem.**
2. **Create and message a worker.**
3. **Data transfer**: cloning, transferables, SAB.
4. **Ergonomics** with Comlink and React hooks.
5. **Capabilities and limits.**
6. **When to use, alternatives, and measurement.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Workers make JS multithreaded, use them everywhere" | Targets heavy, non-DOM work |
| Ignores data transfer cost | Structured clone cost, transferables |
| Messy message passing | Comlink or typed message protocol |
| Creates workers per call | Long-lived worker with cleanup |
| No measurement | Long tasks and INP before/after |

#### Useful phrases
- "Workers keep heavy JavaScript off the thread that handles input and rendering."
- "postMessage copies data; transferables move it without copying."
- "Workers can't touch the DOM, so they send results back for the UI to render."
- "If the slowness is React re-rendering, a worker won't help."

#### Common pitfalls
- **Sending huge object graphs back and forth.**
- **Workers for trivial tasks.**
- **Forgetting to terminate workers.**
- **SAB without cross-origin isolation.**

#### Follow-ups to expect (with sample answers)
- **"How do you handle errors in workers?"**
  "Catch inside the worker and post structured error messages; also listen to the worker's `error` and `messageerror` events on the main thread."
- **"How do you share types between main thread and worker?"**
  "Export the API type from the worker module (as with Comlink) or define a shared message union type."
- **"What's OffscreenCanvas?"**
  "A canvas that can be rendered from a worker, letting charts or games draw without blocking the main thread."

#### What senior interviewers look for
- **Correct problem diagnosis.**
- **Efficient communication design.**
- **Clean integration and cleanup.**

#### Practise it
1. Move a CSV parse into a worker with progress messages.
2. Wrap a search index in Comlink and use it from a React hook.
3. Explain cloning vs transferring, out loud.

## Web Components and Shadow DOM
- id: fe-browser-08
- roles: frontend, fullstack
- round: BROWSER_WEB_PLATFORM
- difficulty: medium
- levels:
- tags: Web Components, Custom Elements, Shadow DOM, design systems

### Prompt
What are Web Components? Explain Custom Elements, Shadow DOM, templates and slots, lifecycle callbacks, styling across the shadow boundary, and form participation. When would you choose Web Components over a framework component library, and how do they work with React?

### Answer
#### What the interviewer is really testing
- Knowledge of the **three core specs**: Custom Elements, Shadow DOM, HTML templates/slots.
- **Encapsulation** trade-offs: style isolation vs theming, accessibility across shadow roots.
- Practical concerns: **SSR (Declarative Shadow DOM)**, **forms (ElementInternals)**, **events**, **React interop**.
- **Use-case judgement**: framework-agnostic design systems, embeddable widgets, micro-frontends.

#### Key points
- **Custom Elements**: define new HTML tags (`customElements.define('my-button', class extends HTMLElement {})`); names must contain a hyphen.
- **Lifecycle callbacks**: `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback` (with `observedAttributes`), `adoptedCallback`.
- **Shadow DOM**: an encapsulated DOM subtree with **scoped styles**: outside styles don't leak in (except inherited properties and CSS custom properties), inside styles don't leak out.
- **Slots** project light-DOM children into the shadow tree; `::slotted()` styles them.
- Styling hooks: **CSS custom properties**, **`::part()`** (exposed parts), `:host`, `:host-context`.
- **Events** crossing the shadow boundary need `composed: true`; retargeting makes `event.target` the host.
- **Forms**: custom elements don't participate in forms by default; **form-associated custom elements** with `ElementInternals` set values, validity and labels.
- **Accessibility**: ARIA references (`aria-labelledby` by ID) can't cross shadow boundaries (reference target proposals in progress); `ElementInternals` can set default roles.
- **SSR**: **Declarative Shadow DOM** (`<template shadowrootmode="open">`) renders shadow roots in HTML.
- **React 19** supports custom elements properly (properties vs attributes, custom events); older React passed everything as string attributes.
- Libraries: **Lit**, Stencil, FAST simplify authoring.

#### Model answer
"Web Components are a set of browser standards for building reusable, encapsulated elements that work in any framework or none.

**1. Custom Elements:**
```js
class RatingStars extends HTMLElement {
  static observedAttributes = ['value', 'max'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  connectedCallback() { this.render(); }                   // added to the DOM
  disconnectedCallback() { /* clean up listeners, timers */ }
  attributeChangedCallback() { this.render(); }            // observed attribute changed

  get value() { return Number(this.getAttribute('value') ?? 0); }
  set value(v) { this.setAttribute('value', String(v)); }

  render() {
    const max = Number(this.getAttribute('max') ?? 5);
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-flex; gap: 2px; color: var(--rating-color, gold); }
        span[aria-hidden] { font-size: var(--rating-size, 1.25rem); }
      </style>
      <span role="img" aria-label="${this.value} out of ${max} stars">
        ${Array.from({ length: max }, (_, i) => `<span aria-hidden="true">${i < this.value ? '★' : '☆'}</span>`).join('')}
      </span>`;
  }
}
customElements.define('rating-stars', RatingStars);
```
```html
<rating-stars value="4" max="5" style="--rating-color: #f59e0b"></rating-stars>
```
Custom element names must contain a hyphen. Attributes are strings; properties can hold rich data (objects, arrays), so good components support both.

**2. Shadow DOM: encapsulation:**
- Styles inside the shadow root don't leak out, and page styles don't leak in (no accidental overrides by global CSS).
- What does cross the boundary: **inherited properties** (color, font) and **CSS custom properties**, which become the theming API.
- **`::part()`** exposes specific internal elements for styling: `<button part="control">` inside, `my-button::part(control) { border-radius: 0 }` outside.
- **`:host`** styles the element itself; `:host([variant='primary'])` for attribute-based variants.

**3. Templates and slots:**
```html
<template id="card-template">
  <style>.card { border: 1px solid var(--border, #ddd); padding: 1rem; } ::slotted(h2) { margin: 0; }</style>
  <div class="card">
    <slot name="title"></slot>
    <slot></slot>                       <!-- default slot for other children -->
  </div>
</template>
<ui-card>
  <h2 slot="title">Order #123</h2>
  <p>Shipped today</p>
</ui-card>
```
Slotted children stay in the light DOM (so page styles and accessibility relationships still apply to them) but are rendered in the shadow tree's slots.

**4. Events across the boundary:**
```js
this.dispatchEvent(new CustomEvent('rating-change', { detail: { value }, bubbles: true, composed: true }));
```
`composed: true` lets the event escape the shadow root. Events from inside are **retargeted**, so outside listeners see the host element as `event.target`.

**5. Forms: form-associated custom elements:**
```js
class FancyInput extends HTMLElement {
  static formAssociated = true;
  #internals = this.attachInternals();
  set value(v) { this.#internals.setFormValue(v); }
  validate(v) {
    if (!v) this.#internals.setValidity({ valueMissing: true }, 'Required', this.shadowRoot.querySelector('input'));
    else this.#internals.setValidity({});
  }
}
```
Without this, custom inputs don't submit with forms, don't participate in validation, and can't be labelled by `<label for>`.

**6. Accessibility considerations:** ID references don't cross shadow boundaries, so `aria-labelledby="external-id"` from inside the shadow root can't point to an element outside. Keep labels and controls in the same tree, use `ElementInternals` for roles/states, and test with screen readers.

**7. SSR: Declarative Shadow DOM:**
```html
<ui-card>
  <template shadowrootmode="open">
    <style>…</style><div class="card"><slot></slot></div>
  </template>
  <p>Shipped today</p>
</ui-card>
```
Lets server-rendered pages include shadow content without JavaScript, avoiding a flash before upgrade.

**8. React interop:**
- **React 19** handles custom elements properly: it sets properties for non-primitive values and supports custom events via `on` + event name props.
- Older React versions passed all props as string attributes and didn't attach custom event listeners, so wrappers (or `@lit/react`) were needed.

**When to choose Web Components:**
- A **design system used across multiple frameworks** (React, Angular, Vue, server-rendered pages): one implementation everywhere (e.g. Salesforce Lightning, Adobe Spectrum, GitHub's Primer elements, Shoelace/Web Awesome).
- **Embeddable widgets** for third-party sites (chat, payments) where style isolation protects both sides.
- **Micro-frontends** needing technology independence.
- **Long-lived components** that shouldn't depend on a framework's lifecycle.

**When a framework component library is better:** a single-framework product where you want tight integration (state, context, SSR streaming, server components), simpler testing, and the framework's ecosystem. Web Components add complexity around SSR, forms, theming and accessibility references.

**Authoring:** Lit adds reactive properties, efficient templating and good TypeScript support with a small runtime, which is how I'd build them in practice."

#### Another worked example: a cross-framework design system
"An enterprise had products in React, Angular and server-rendered Java pages, each with its own button and modal implementations. The design system team built core components with Lit as Web Components, exposed theming through CSS custom properties and `::part()`, and shipped thin React wrappers for ergonomic props and events. One implementation now served all products, and visual consistency improved; the trade-off was extra work on form participation and SSR via Declarative Shadow DOM."

#### A third worked example: an embeddable support widget
"A support chat widget embedded on customer sites kept breaking because customers' global CSS (e.g. `button { all: unset }`) changed its styling, and its styles leaked into their pages. Rebuilding it as a custom element with Shadow DOM isolated styles both ways; customers could still theme it with documented CSS custom properties."

#### Variations you might be asked
- "Open vs closed shadow roots?": open allows `element.shadowRoot` access from outside; closed hides it (rarely worth it; it hinders testing and tooling).
- "How do you test Web Components?": Web Test Runner or Playwright, piercing shadow DOM with locators (Playwright pierces open shadow roots by default).
- "What's a customized built-in element?": extending native elements (`is="fancy-button"`); not supported in Safari, so generally avoided.

#### Step-by-step framework
1. **Define the three specs.**
2. **Build a custom element** with lifecycle and attributes/properties.
3. **Shadow DOM encapsulation** and theming hooks.
4. **Slots, events, forms.**
5. **Accessibility and SSR considerations.**
6. **React interop and when to choose them.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Web Components replace React" | Positions them for cross-framework/embeddable use |
| Unaware of style theming hooks | Custom properties, ::part, :host |
| Ignores forms | Form-associated elements with ElementInternals |
| Ignores a11y boundary issues | Notes ID reference limits |
| No SSR knowledge | Declarative Shadow DOM |

#### Useful phrases
- "Shadow DOM isolates styles both ways; custom properties and parts are the theming API."
- "Events need composed: true to leave the shadow root."
- "Custom inputs need ElementInternals to work in forms."
- "Web Components shine when one component must work across frameworks."

#### Common pitfalls
- **String-only attributes for complex data.**
- **Broken form participation.**
- **ARIA references across shadow boundaries.**
- **Flash of unupgraded content** without SSR strategy.

#### Follow-ups to expect (with sample answers)
- **"How do you avoid a flash before custom elements upgrade?"**
  "Declarative Shadow DOM for SSR, or `:not(:defined)` CSS to hide or reserve space until defined."
- **"Can you use Tailwind inside Shadow DOM?"**
  "Global utility classes don't apply inside shadow roots; you'd need to inject a stylesheet into each shadow root (constructable stylesheets help)."
- **"What are constructable stylesheets?"**
  "CSSStyleSheet objects created in JS and shared across shadow roots via adoptedStyleSheets, avoiding duplicate style parsing."

#### What senior interviewers look for
- **Spec-level understanding.**
- **Awareness of real-world gaps.**
- **Sound architectural judgement.**

#### Practise it
1. Build a rating-stars element with attributes, properties and a composed change event.
2. Expose theming with custom properties and ::part, and use it from React.
3. Explain when you'd choose Web Components over React components, out loud.
