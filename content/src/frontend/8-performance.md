# Frontend Engineer — Performance

## Core Web Vitals explained: LCP, INP, CLS
- id: fe-perf-01
- roles: frontend, fullstack
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- tags: Core Web Vitals, LCP, INP, CLS, metrics

### Prompt
Explain the Core Web Vitals: LCP, INP and CLS. What does each measure, what are the thresholds, what commonly causes poor scores, how do you measure them in the lab and in the field, and how would you improve each?

### Answer
#### What the interviewer is really testing
- Precise definitions and **thresholds** (good / needs improvement / poor at p75).
- Knowing **common causes** and **fixes** for each metric.
- Understanding **lab vs field data** (Lighthouse vs CrUX/RUM) and why they differ.
- Connecting metrics to **user experience and business outcomes**; supporting metrics (TTFB, FCP, TBT).

#### Key points
- **LCP (Largest Contentful Paint)**: time until the largest image/text block in the viewport renders. Good ≤ **2.5 s**, poor > 4 s.
- **INP (Interaction to Next Paint)**: responsiveness: the latency from user input (click, tap, key) until the next frame paints, reported near the worst interaction (p98) across the page visit. Good ≤ **200 ms**, poor > 500 ms. Replaced FID in March 2024.
- **CLS (Cumulative Layout Shift)**: visual stability: sum of unexpected layout shift scores in the largest session window. Good ≤ **0.1**, poor > 0.25.
- Assessed at the **75th percentile** of real users, separately for mobile and desktop.
- **Field data** (CrUX, RUM via `web-vitals` library) reflects real devices/networks; **lab data** (Lighthouse, WebPageTest) is reproducible for debugging. Lighthouse can't measure INP directly; **TBT** is a lab proxy.
- LCP breaks down into **TTFB, resource load delay, resource load time, element render delay**.
- INP breaks down into **input delay, processing time, presentation delay**.
- Business impact: faster LCP and better INP correlate with conversion and engagement; CWV are a Google ranking signal (page experience).

#### Model answer
"Core Web Vitals are Google's three user-centred metrics for loading, responsiveness and visual stability. They're measured on real users and judged at the 75th percentile, separately for mobile and desktop.

| Metric | Measures | Good | Needs improvement | Poor |
|---|---|---|---|---|
| LCP | Loading: when the main content appears | ≤ 2.5 s | 2.5–4 s | > 4 s |
| INP | Responsiveness: input to next paint | ≤ 200 ms | 200–500 ms | > 500 ms |
| CLS | Visual stability: unexpected shifts | ≤ 0.1 | 0.1–0.25 | > 0.25 |

**LCP: Largest Contentful Paint**
The time until the largest visible element (usually a hero image, video poster or big heading/text block) has rendered.

Break it into four parts to diagnose:
1. **TTFB**: server response time (slow backend, no CDN, redirects).
2. **Resource load delay**: how long before the browser starts fetching the LCP image (discovered late: CSS background, client-rendered, lazy-loaded).
3. **Resource load time**: download time (huge image, wrong format, no CDN).
4. **Element render delay**: time from download to paint (render-blocking CSS/JS, client-side rendering, hydration blocking).

Fixes: CDN and caching for HTML, server rendering/streaming, put the LCP image in the HTML as an `<img>` with `fetchpriority="high"` (never lazy-load it), preload if discovered late, serve AVIF/WebP at the right size with srcset/sizes, inline critical CSS, defer non-critical JS, preconnect to critical origins, optimise web fonts for text LCP.

**INP: Interaction to Next Paint**
Measures how quickly the page responds visually to clicks, taps and key presses throughout the visit. For each interaction it measures:
1. **Input delay**: the main thread was busy (long tasks from other scripts, hydration) when the user interacted.
2. **Processing time**: event handlers' execution (expensive React re-renders, synchronous work).
3. **Presentation delay**: rendering the next frame (large DOM, layout, paint).
The page's INP is roughly the worst interaction (ignoring outliers on pages with many interactions).

Fixes: break up long tasks (yield with `scheduler.yield()`/setTimeout), reduce JavaScript and third-party scripts, avoid large synchronous work in handlers (move to Web Workers), optimise React renders (state colocation, memoization, virtualisation, `useTransition` for non-urgent updates), give immediate visual feedback before heavy work, reduce DOM size, avoid layout thrashing, defer hydration or use Server Components to reduce client JS.

**CLS: Cumulative Layout Shift**
Measures unexpected movement of visible content. Each shift's score = impact fraction × distance fraction; CLS sums shifts within the worst 'session window' (bursts within 5 s). Shifts within 500 ms of user input are excluded (expected).

Common causes: images/videos/iframes without dimensions, ads and embeds injected without reserved space, web fonts swapping and changing text size, content inserted above existing content (banners, cookie notices), animations of layout properties.
Fixes: `width`/`height` attributes or `aspect-ratio`, reserve space for ads/embeds (min-height containers), `font-display: optional` or metric-matched fallback fonts (`size-adjust`), insert dynamic content below the fold or in overlays, animate with `transform`.

**Measuring:**
- **Field (real users)**: Chrome UX Report (CrUX, via PageSpeed Insights or Search Console), and our own **RUM** with the `web-vitals` library sending metrics plus attribution (which element was LCP, which interaction was slow) to analytics:
```ts
import { onLCP, onINP, onCLS } from 'web-vitals/attribution';
onINP((metric) => sendToAnalytics({ name: metric.name, value: metric.value, target: metric.attribution.interactionTarget, page: location.pathname }));
onLCP(sendToAnalytics); onCLS(sendToAnalytics);
```
- **Lab**: Lighthouse, WebPageTest, Chrome DevTools Performance panel (with CPU throttling and network throttling). Lighthouse reports LCP and CLS but uses **Total Blocking Time** as a proxy for responsiveness; INP needs real interactions (DevTools Performance panel shows interactions and INP-like timings when you interact).
- Field and lab differ: real users have slower devices, varied networks, cached states and real interactions. Optimise with lab tools, verify with field data.

**Supporting metrics:** TTFB (server), FCP (first content), TBT (lab main-thread blocking), and custom business metrics (time to first product image, time to interactive search).

**Why it matters:** faster pages convert better (many retail case studies show measurable revenue gains per 100 ms), and Core Web Vitals are part of Google's page experience signals. I'd set performance budgets per template and monitor p75 by device type."

#### Another worked example: improving INP on a product listing page
"RUM showed p75 INP of 420 ms on mobile for the listing page; attribution pointed at filter checkbox clicks. Profiling revealed each click synchronously re-rendered 120 product cards and ran sorting on the main thread, plus a third-party analytics script's long task. Fixes: wrapped the filter state update in `useTransition` (checkbox updates instantly), memoized product cards, moved sorting to a precomputed index, and deferred the analytics script until idle. p75 INP dropped to 160 ms."

#### A third worked example: fixing CLS from a cookie banner and fonts
"A news site had p75 CLS of 0.28. Causes: a cookie banner pushing content down after load, article images without dimensions, and a web font swap changing line heights. We made the banner an overlay fixed at the bottom, added dimensions from the CMS, and used a metric-adjusted fallback font. CLS fell to 0.04."

#### Variations you might be asked
- "Why was FID replaced by INP?": FID only measured the input delay of the first interaction; INP covers the full latency of all interactions throughout the visit.
- "What element can be LCP?": images (including CSS backgrounds), video posters, and block-level text elements; it can change during loading as larger elements render.
- "Do SPAs measure soft navigations?": standard CWV are per page load; soft navigation measurement is being worked on, so RUM tools often add custom route-change metrics.

#### Step-by-step framework
1. **Define each metric and threshold.**
2. **Break LCP into sub-parts** and fixes.
3. **Break INP into phases** and fixes.
4. **CLS causes** and fixes.
5. **Field vs lab measurement**, RUM with attribution.
6. **Business impact and budgets.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Vague definitions | Precise definitions and p75 thresholds |
| Still talks about FID | INP and its three phases |
| Lighthouse score only | Field RUM with attribution plus lab debugging |
| Generic advice | Specific causes and fixes per metric |
| No business link | Conversion and SEO context |

#### Useful phrases
- "Core Web Vitals are judged at the 75th percentile of real users."
- "I break LCP into TTFB, load delay, load time and render delay to find the bottleneck."
- "INP is input delay plus processing plus presentation delay."
- "Lab tools help me debug; field data tells me if users actually improved."

#### Common pitfalls
- **Optimising Lighthouse scores only.**
- **Lazy-loading the LCP image.**
- **Ignoring third-party scripts** for INP.
- **Not reserving space** for dynamic content.

#### Follow-ups to expect (with sample answers)
- **"How do you find which interaction causes poor INP?"**
  "web-vitals attribution reports the interaction target and timing breakdown; reproduce it in the Performance panel with CPU throttling."
- **"What's a good TTFB?"**
  "Under about 800 ms at p75 as a guide; it's a large part of LCP."
- **"How do you prevent regressions?"**
  "Performance budgets in CI (Lighthouse CI, bundle size checks), RUM dashboards with alerts per template."

#### What senior interviewers look for
- **Metric fluency.**
- **Diagnosis methodology.**
- **Measurement maturity.**

#### Practise it
1. Run PageSpeed Insights on a site you know and explain each metric's causes.
2. Add web-vitals attribution reporting to an app.
3. Explain LCP's four sub-parts, out loud.

## Code splitting, lazy loading and bundle analysis
- id: fe-perf-02
- roles: frontend, fullstack
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- tags: code splitting, lazy loading, bundle size, tree shaking

### Prompt
How do you reduce JavaScript bundle size and load only what's needed? Explain route-based and component-based code splitting, dynamic imports and React.lazy, analysing bundles, tree shaking, dependency choices, and the trade-offs of splitting too much.

### Answer
#### What the interviewer is really testing
- Understanding **why JS cost matters** (download, parse, compile, execute, hydration) especially on mobile.
- **Splitting strategies**: route-level, component-level, interaction-triggered, vendor chunking.
- **Bundle analysis** skills and **dependency hygiene** (heavy libraries, duplicates, polyfills).
- **Trade-offs**: request waterfalls, loading states, prefetching.

#### Key points
- JavaScript is the most **expensive resource per byte**: it must be downloaded, parsed, compiled and executed on the main thread; large bundles hurt LCP, INP and battery on mid-range phones.
- **Route-based splitting**: each route is a chunk (frameworks do this automatically).
- **Component-based splitting**: `React.lazy(() => import('./Chart'))` / `next/dynamic` for heavy, below-the-fold or rarely used components (editors, charts, maps, modals).
- **Interaction-based loading**: import on click/hover (e.g. load the rich text editor when the user clicks "Edit").
- **Prefetching** likely-next chunks (on hover, idle, viewport) to hide latency.
- **Bundle analysis**: `rollup-plugin-visualizer` / `vite-bundle-visualizer`, `@next/bundle-analyzer`, `source-map-explorer`; check for large deps, duplicates, polyfills, whole-library imports.
- **Tree shaking** needs ESM and side-effect-free modules; import named functions (`lodash-es`), avoid barrel files that pull everything.
- **Dependency choices**: replace heavy libraries (moment → date-fns/Intl, lodash → native), check cost with bundlephobia/pkg-size.
- **Server Components** move rendering code off the client entirely.
- Trade-offs: too many tiny chunks → request overhead and waterfalls; lazy-loading above-the-fold content hurts LCP.
- Enforce **budgets** in CI (size-limit, bundlewatch).

#### Model answer
"JavaScript is the most expensive resource on the web byte for byte: after downloading, the browser has to parse, compile and execute it on the main thread, and frameworks also hydrate. On a mid-range phone, 500 KB of JS can mean seconds of CPU work, hurting load time and responsiveness. So the goal is to ship less JS and load it only when needed.

**1. Measure first: bundle analysis**
```bash
npx vite-bundle-visualizer          # or ANALYZE=true next build with @next/bundle-analyzer
npx source-map-explorer dist/assets/*.js
```
I look for: the biggest dependencies, libraries imported in full when only a function is used, duplicate versions of the same package, polyfills for browsers we don't support, and code that's only needed on one route ending up in the main chunk.

**2. Route-based splitting** (the biggest default win): each page loads its own code. Next.js, Remix and Vite-based routers do this automatically; with React Router:
```tsx
const Settings = lazy(() => import('./routes/Settings'));
const Reports = lazy(() => import('./routes/Reports'));
<Route path="/settings" element={<Suspense fallback={<PageSkeleton />}><Settings /></Suspense>} />
```

**3. Component-based splitting** for heavy components that aren't needed immediately:
```tsx
const RichTextEditor = lazy(() => import('./RichTextEditor'));     // ~200 KB editor
function CommentBox() {
  const [editing, setEditing] = useState(false);
  return editing
    ? <Suspense fallback={<EditorSkeleton />}><RichTextEditor /></Suspense>
    : <button onClick={() => setEditing(true)}>Write a comment</button>;
}

// Next.js: client-only heavy widget
const Map = dynamic(() => import('./Map'), { ssr: false, loading: () => <MapSkeleton /> });
```
Good candidates: charts, maps, rich text/code editors, PDF viewers, video players, admin-only features, modals and drawers, below-the-fold sections.

**4. Load on interaction or intent, and prefetch:**
```ts
const loadEditor = () => import('./RichTextEditor');
<button onMouseEnter={loadEditor} onFocus={loadEditor} onClick={openEditor}>Edit</button>   // start loading on intent
```
Frameworks prefetch route chunks for links in the viewport or on hover; `requestIdleCallback` can warm likely chunks.

**5. Tree shaking and import hygiene:**
```ts
import _ from 'lodash';                 // ❌ whole library (CommonJS, not tree-shakable)
import { debounce } from 'lodash-es';   // ✓ only debounce
import debounce from 'lodash/debounce'; // ✓ per-method import
```
- Tree shaking needs ES modules and `sideEffects: false` packages.
- **Barrel files** (`index.ts` re-exporting everything) can defeat tree shaking or slow builds; import from specific paths or configure `optimizePackageImports` (Next.js) for icon/UI libraries.
- Import icons individually rather than a whole icon set.

**6. Dependency choices:**
| Instead of | Consider |
|---|---|
| moment.js (with locales) | date-fns, dayjs, or `Intl` APIs |
| lodash (full) | Native methods, lodash-es named imports |
| Heavy UI kit for one component | A small headless library or custom component |
| axios (if only basic needs) | fetch |
| Large charting library for sparklines | Lightweight chart or SVG |
Check costs with bundlephobia/pkg-size before adding dependencies.

**7. Modern build settings:** target modern browsers (no unnecessary transpilation/polyfills), minification, compression (Brotli), and long-term caching with content hashes; split vendor chunks sensibly so app changes don't invalidate cached library code.

**8. Server Components and partial hydration:** in the App Router, code used only for rendering (markdown, syntax highlighting, date formatting) can stay on the server, shipping zero JS for those components.

**Trade-offs and pitfalls:**
- **Don't lazy-load what's visible immediately** (hero, above-the-fold content): it delays LCP and causes loading flashes.
- **Over-splitting** creates many tiny requests and chains (chunk A loads, then requests chunk B), adding latency; group related code.
- **Loading states**: each lazy boundary needs a good skeleton to avoid layout shift.
- **Chunk load failures** after deploys (old HTML referencing removed chunks): keep old assets available for a while and retry/reload on `ChunkLoadError`.

**9. Budgets and enforcement:**
```json
// size-limit config
[{ "path": "dist/assets/index-*.js", "limit": "170 KB" }]
```
Fail CI when the main bundle exceeds the budget, and review dependency additions."

#### Another worked example: halving a dashboard bundle
"A React dashboard shipped a 1.4 MB main bundle (gzipped 420 KB). Analysis showed a charting library (300 KB) loaded on every page, moment.js with all locales (230 KB), a full icon set (180 KB) and an admin-only reporting module in the main chunk. We lazy-loaded charts per widget, replaced moment with date-fns, imported icons individually, and split admin routes. The main bundle dropped to 520 KB (gzipped 150 KB), LCP improved by 1.1 s on throttled mobile, and INP improved because less JS competed for the main thread during load."

#### A third worked example: over-splitting
"A team lazy-loaded nearly every component, including the header and the product grid. The page showed cascading skeletons and LCP got worse because the grid's chunk was requested only after the page chunk executed. We reverted above-the-fold components to static imports and kept lazy loading for modals, charts and below-the-fold widgets, improving LCP by 600 ms."

#### Variations you might be asked
- "How do you handle ChunkLoadError?": catch dynamic import failures, retry once, then prompt a reload; keep previous deploy assets available.
- "What's module preloading?": `<link rel="modulepreload">` fetches and parses ES modules early, avoiding waterfalls; bundlers add it automatically for known dependencies.
- "How do you measure JS execution cost?": DevTools Performance panel (Scripting time), Coverage tab (unused bytes), and Lighthouse 'Reduce unused JavaScript'.

#### Step-by-step framework
1. **Explain why JS is expensive.**
2. **Analyse the bundle.**
3. **Split by route, component and interaction**, with prefetching.
4. **Tree shake and fix imports.**
5. **Choose lighter dependencies**, modern builds, Server Components.
6. **Avoid over-splitting; enforce budgets.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Minify the code" | Splitting, tree shaking, dependency hygiene |
| Lazy-loads everything | Above the fold static; heavy below-the-fold lazy |
| Never measures | Bundle analyser, coverage, budgets |
| Ignores waterfalls | Prefetching, grouping chunks |
| Keeps heavy libraries | Replaces moment/lodash etc. |

#### Useful phrases
- "JavaScript costs CPU after it downloads, so less JS improves both LCP and INP."
- "I split by route first, then lazy-load heavy components that aren't immediately visible."
- "Start loading on hover or focus so the click feels instant."
- "We enforce bundle budgets in CI so size doesn't creep back."

#### Common pitfalls
- **Lazy-loading LCP content.**
- **Whole-library imports.**
- **Barrel files** defeating tree shaking.
- **Chunk waterfalls.**

#### Follow-ups to expect (with sample answers)
- **"How do you decide what to lazy-load?"**
  "Large components that aren't needed for the first view or are used by a minority of users, confirmed by bundle analysis and usage data."
- **"Does gzip size or parsed size matter more?"**
  "Both: transfer size affects download; uncompressed size affects parse/compile/execute time on the device."
- **"How do Server Components reduce bundle size?"**
  "Their code never ships to the client; only client components and their dependencies are bundled."

#### What senior interviewers look for
- **Measurement-driven optimisation.**
- **Balanced splitting strategy.**
- **Sustainable budgets.**

#### Practise it
1. Run a bundle analyser on a project and list the top three wins.
2. Lazy-load a heavy component with intent-based prefetching.
3. Explain the trade-offs of over-splitting, out loud.

## Image and font optimisation
- id: fe-perf-03
- roles: frontend, fullstack
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- tags: images, fonts, LCP, CLS, performance

### Prompt
Images and web fonts are often the biggest contributors to slow LCP and layout shift. Walk through how you'd optimise both: formats, sizing, loading priority, CDNs, placeholders for images; and font formats, subsetting, loading strategies, `font-display`, preloading and fallback font matching for fonts.

### Answer
#### What the interviewer is really testing
- **Image strategy**: modern formats, responsive sizing, compression, priority, lazy loading, dimensions, CDNs.
- **Font strategy**: WOFF2, subsetting, variable fonts, self-hosting, preloading, `font-display`, fallback metrics to avoid CLS.
- Understanding the impact on **LCP, CLS and bandwidth**.
- Practical tools: **image CDNs, framework components (next/image, next/font)**, measurement.

#### Key points
- **Images**: AVIF/WebP with fallbacks; responsive `srcset`/`sizes`; compress (quality 60–80); never serve larger than displayed; `width`/`height` or `aspect-ratio`; `fetchpriority="high"` and no lazy loading for the LCP image; `loading="lazy"` + `decoding="async"` for others; SVG for icons; image CDN for automatic transforms; placeholders (blur/dominant colour).
- **Fonts**: **WOFF2** only; **subset** to needed characters/languages (`unicode-range`); **variable fonts** to replace multiple weights; **self-host** (avoid third-party connection costs, privacy); **preload** critical font files (with `crossorigin`); limit the number of families/weights.
- **`font-display`**: `swap` (show fallback immediately, swap when loaded; risk of CLS), `optional` (use the web font only if it's available very quickly; no swap shift), `fallback` (short block, short swap window).
- **Fallback matching**: `size-adjust`, `ascent-override`, `descent-override` on a local fallback font to match metrics, minimising CLS (next/font does this automatically).
- Consider **system font stacks** where brand allows.
- Measure with Lighthouse, WebPageTest filmstrips, and RUM LCP attribution.

#### Model answer
"Images are usually the heaviest bytes and often the LCP element; fonts can delay text rendering and cause layout shifts. I treat both as part of the critical path.

**Images**

1. **Right format:** AVIF (often ~50% smaller than JPEG) and WebP (~25–35% smaller), with JPEG/PNG fallback via `<picture>`, or let an image CDN negotiate via the `Accept` header. SVG for icons, logos and illustrations; avoid PNG for photos.

2. **Right size:** never send a 2400px image to a 400px slot. Use `srcset` + accurate `sizes` so the browser picks the right file for the slot and DPR:
```html
<img src="/img/hero-1200.avif"
     srcset="/img/hero-640.avif 640w, /img/hero-1200.avif 1200w, /img/hero-1920.avif 1920w"
     sizes="(min-width: 1024px) 60vw, 100vw"
     width="1920" height="1080" alt="Runner on a mountain trail at sunrise"
     fetchpriority="high">
```

3. **Right compression:** quality around 60–80 for photos (check visually); strip metadata.

4. **Right priority:**
- The **LCP image**: in the initial HTML, `fetchpriority="high"`, **not lazy-loaded**, preloaded if discovered late (CSS backgrounds, client-rendered carousels).
- Below-the-fold images: `loading="lazy"` and `decoding="async"`.
- Carousels: only the first slide eager; others lazy.

5. **No layout shift:** `width`/`height` attributes (browser computes aspect ratio) or CSS `aspect-ratio`; `object-fit: cover` for crops.

6. **Perceived performance:** low-quality blurred placeholders (LQIP/BlurHash) or dominant-colour backgrounds while loading.

7. **Automate with an image CDN** (Cloudinary, imgix, Cloudflare Images, Vercel image optimisation) or framework components:
```tsx
import Image from 'next/image';
<Image src={product.imageUrl} alt={product.name} width={800} height={800}
       sizes="(min-width: 1024px) 33vw, 50vw" priority={isAboveFold} placeholder="blur" blurDataURL={product.blur} />
```
`next/image` generates srcset, converts formats, lazy-loads by default and sets dimensions; `priority` marks the LCP image. I still need correct `sizes`.

**Fonts**

1. **Format:** WOFF2 only (supported everywhere modern, best compression).

2. **Fewer files:**
- Limit families and weights (e.g. one family, regular + bold).
- **Variable fonts**: one file covering many weights/widths, often smaller than three static files.
- **Subsetting**: include only the characters you need (Latin, Latin Extended), using `unicode-range` to load other scripts only when used:
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin.var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+20AC, U+2122;
}
```

3. **Self-host and preload the critical font:**
```html
<link rel="preload" href="/fonts/inter-latin.var.woff2" as="font" type="font/woff2" crossorigin>
```
Self-hosting avoids extra DNS/TLS connections to font providers (and privacy concerns); `crossorigin` is required for font preloads even on the same origin. Preload only the one or two fonts used above the fold, since preloads compete with the LCP image.

4. **font-display strategy:**
| Value | Behaviour | Trade-off |
|---|---|---|
| `swap` | Fallback text immediately, swap when loaded | Fast text; possible layout shift and 'flash' |
| `optional` | Very short block; use web font only if ready almost immediately, otherwise fallback for this page view | No shift; first-time visitors may see fallback |
| `fallback` | Short block, short swap window | Middle ground |
| `block` | Invisible text up to ~3 s | Avoid for body text |
For body text, `swap` with matched fallbacks or `optional` are good choices.

5. **Match fallback metrics to prevent CLS:**
```css
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
body { font-family: 'Inter', 'Inter Fallback', system-ui, sans-serif; }
```
When the web font swaps in, text occupies nearly the same space, so lines don't reflow. `next/font` (and tools like Fontaine/Capsize) compute these overrides automatically, self-host, and subset:
```ts
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });   // self-hosted at build, fallback metrics generated
```

6. **Consider system fonts** (`system-ui`) for UI-heavy apps where brand allows: zero font bytes, instant rendering.

**Measuring:** Lighthouse audits (properly size images, next-gen formats, preload LCP image, ensure text remains visible during webfont load), WebPageTest filmstrips (seeing font swaps and image arrival), DevTools Network (image sizes vs display sizes), and RUM LCP attribution identifying the LCP element per template."

#### Another worked example: e-commerce category page
"A category page loaded 48 product images at 1200px JPEGs (~180 KB each) regardless of a 300px grid slot, plus four font files from Google Fonts. We moved images to an image CDN with AVIF/WebP, srcset/sizes for the grid, lazy loading below the first row and dimensions; and self-hosted one variable font with a matched fallback and preload. Page weight dropped from 9.2 MB to 1.6 MB, mobile LCP from 3.9 s to 2.1 s, and CLS from 0.17 to 0.02."

#### A third worked example: invisible text on slow networks
"A brand site used `font-display: block` with three heavy fonts; on slow 3G users saw blank text for up to 3 seconds. Switching to `swap` with size-adjusted fallbacks, subsetting to Latin and moving from four static weights to one variable font made text visible immediately with negligible shift."

#### Variations you might be asked
- "Should you inline small images as data URIs?": only very small, critical images; data URIs bloat HTML/CSS and can't be cached separately.
- "How do you handle user-uploaded images?": process on upload (resize, strip EXIF, generate variants) or use an image CDN; enforce size limits.
- "Icon fonts or SVG icons?": SVG: better accessibility, no font loading issues, tree-shakable per icon.

#### Step-by-step framework
1. **Images: format, size, compression.**
2. **Images: priority, lazy loading, dimensions, placeholders.**
3. **Images: CDN and framework automation.**
4. **Fonts: WOFF2, fewer files, variable fonts, subsetting.**
5. **Fonts: self-host, preload, font-display, fallback matching.**
6. **Measure and verify.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Compress images" | Formats, srcset/sizes, priority, dimensions |
| Lazy-loads the hero | Eager + fetchpriority for LCP |
| Many font weights from a third party | Variable, subset, self-hosted, preloaded |
| font-display: block | swap/optional with matched fallbacks |
| No measurement | Lighthouse, filmstrips, RUM LCP attribution |

#### Useful phrases
- "The LCP image gets fetchpriority high and is never lazy-loaded."
- "sizes must match the layout, or the browser downloads the wrong file."
- "A variable font often replaces several static weights."
- "Matched fallback metrics stop the font swap from shifting the layout."

#### Common pitfalls
- **Oversized images.**
- **Missing dimensions** (CLS).
- **Too many font files.**
- **Over-preloading** competing with the LCP image.

#### Follow-ups to expect (with sample answers)
- **"Why does font preload need crossorigin?"**
  "Fonts are fetched in CORS mode; without crossorigin the preload doesn't match and the font downloads twice."
- **"What's unicode-range for?"**
  "It tells the browser which characters a font file covers, so it only downloads files for characters actually on the page."
- **"How do you choose image quality?"**
  "Test visually per image type; perceptual metrics (SSIM/Butteraugli) or CDN auto-quality settings help."

#### What senior interviewers look for
- **Deep practical knowledge.**
- **Metric-focused prioritisation.**
- **Automation and verification.**

#### Practise it
1. Optimise a page's images with srcset/sizes and measure bytes saved.
2. Self-host a variable font with a matched fallback and check CLS.
3. Explain font-display options and when to use each, out loud.

## Finding and fixing memory leaks in a single-page app
- id: fe-perf-04
- roles: frontend, fullstack
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- tags: memory leaks, SPA, DevTools, React, heap snapshots

### Prompt
Users report that your React single-page app gets slower and eventually crashes after being open for hours. How do you confirm it's a memory leak, find the cause with DevTools, and fix and prevent it? Cover the leak patterns specific to React and SPAs.

### Answer
#### What the interviewer is really testing
- A **systematic investigation**: reproduce, measure, compare snapshots, follow retainers.
- Knowing **SPA/React-specific leak sources**: effects without cleanup, subscriptions, global caches, detached DOM, third-party widgets, closures in long-lived objects.
- **DevTools fluency**: Performance monitor, Memory panel (heap snapshots, comparison, allocation timeline), detached elements.
- **Prevention**: patterns, lint, tests, monitoring of long sessions.

#### Key points
- SPAs never reload, so **small leaks accumulate** over long sessions (dashboards, chat, admin tools).
- Symptoms: increasing memory, slower interactions (GC pressure), eventual tab crash ("Aw, Snap" / out of memory).
- Confirm: repeat an action (navigate between routes, open/close modals) and watch **JS heap and DOM node count** in the **Performance monitor**; force GC; if it keeps rising, it's a leak.
- Diagnose: **heap snapshot comparison** (before/after N repetitions), filter **Detached** elements, inspect **retainers** to find what holds objects.
- React/SPA sources: `useEffect` without cleanup (listeners, intervals, subscriptions, observers), third-party library instances not destroyed, global stores/caches growing unbounded, module-level arrays/maps, closures captured by long-lived callbacks, unrevoked object URLs, WebSocket handlers, analytics queues, React Query cache with huge `gcTime`.
- Fix: cleanup functions, `AbortController`, destroy widgets on unmount, bounded caches, WeakMap for metadata, revoke URLs.
- Prevent: lint (exhaustive-deps), StrictMode (double mount surfaces missing cleanup), code review checklist, memory tests in E2E (heap after N cycles), RUM of long sessions.

#### Model answer
"A leak in a single-page app is memory that stays reachable after the feature using it is gone. Because the page never reloads, each leaked component instance, listener or cache entry adds up until the tab slows down or crashes.

**1. Reproduce and confirm**
- Get details from users: which screens, how long open, which actions.
- Pick a repeatable cycle: navigate Dashboard → Orders → Dashboard, or open and close a modal, 20 times.
- Chrome DevTools **Performance monitor**: watch **JS heap size**, **DOM nodes** and **JS event listeners** while repeating the cycle. Click 'Collect garbage' (trash icon in the Memory panel) between rounds. Healthy apps return to a baseline; leaks show a staircase that never comes down.

**2. Find what's leaking: heap snapshot comparison**
1. Load the app, perform the cycle once (to warm caches), force GC, take **Snapshot 1**.
2. Repeat the cycle 10 times, force GC, take **Snapshot 2**.
3. In Snapshot 2, choose **Comparison** with Snapshot 1 and sort by **# Delta** or **Size Delta**. Look for counts that grew by ~10 (one per cycle): component-related objects (`FiberNode`, your class names, closures), `Detached HTMLDivElement`, event listener objects, arrays in stores.
4. Type **'Detached'** in the class filter to find DOM nodes removed from the page but still referenced.
5. Select a leaked object and read the **Retainers** panel: the chain from a GC root to the object, e.g. `Window → listeners → resize → onResize (closure) → context → chartInstance → canvas → detached div`. That chain names the culprit.

**3. Common SPA and React leak sources (and fixes)**
```tsx
// ❌ listener added, never removed
useEffect(() => {
  window.addEventListener('resize', onResize);
}, []);
// ✓
useEffect(() => {
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```
- **Intervals/timeouts** without `clearInterval`.
- **Subscriptions**: stores, WebSockets, event emitters, observables without unsubscribe.
- **Observers**: `ResizeObserver`, `IntersectionObserver`, `MutationObserver` without `disconnect()`.
- **Third-party widgets**: charts, maps, editors, video players created in effects but never `.destroy()`ed; they often hold DOM and big data.
```tsx
useEffect(() => {
  const chart = new Chart(canvasRef.current!, config);
  return () => chart.destroy();           // releases canvas, listeners, data
}, [config]);
```
- **Module-level caches and arrays** that grow forever (`const cache = new Map()` at module scope keyed by request params): bound them (LRU) or use WeakMap.
- **Global stores** accumulating history (undo stacks, logs, message lists in chat): cap length or paginate out old data.
- **Closures in long-lived callbacks** capturing large objects (a global event handler closing over a whole dataset).
- **Object URLs** from `URL.createObjectURL` never revoked.
- **Detached DOM** referenced by refs stored outside components, or by non-React libraries.
- **Data library caches** with very long `gcTime` holding many large query results; tune or remove unused queries.
- **Pending async work** after unmount (fetches setting state into stale closures): abort in cleanup.
- **Development-only noise**: React DevTools, source maps and StrictMode can retain extra objects; always confirm in a production build.

**4. Allocation instrumentation:** the Memory panel's 'Allocation instrumentation on timeline' shows allocations over time; bars that stay blue (still alive) after GC point to retained allocations and their stack traces.

**5. Fix, then verify:** after fixing, repeat the same cycle and snapshot comparison: deltas should be near zero and the heap should return to baseline.

**6. Prevent regressions:**
- **StrictMode** in development: its mount → unmount → mount cycle exposes effects without cleanup.
- **Lint**: react-hooks rules; code review checklist ('every subscription has an unsubscribe').
- **Automated memory tests**: Playwright with CDP can measure `performance.memory`/heap usage after repeating a flow 50 times and fail if it grows beyond a threshold (tools like memlab from Meta automate leak detection in E2E flows).
- **Production monitoring**: track session length vs crash rates, and memory via `performance.measureUserAgentSpecificMemory()` where available; long-session users (support agents, traders) are the canaries."

#### Another worked example: an operations dashboard crash
"An operations dashboard crashed after 4–6 hours. Snapshot comparison after 10 route switches showed 10 extra chart instances and ~30,000 detached nodes; retainers pointed to a charting library's `window` resize listener created in a `useEffect` with no cleanup, holding the chart and its data. A second leak was a module-level Map caching formatted tooltips keyed by timestamp. Adding `chart.destroy()` in cleanup and an LRU for tooltips kept memory flat at ~150 MB across a full workday (previously growing past 2 GB)."

#### A third worked example: chat app message history
"A support chat app kept every message from every conversation the agent opened during a shift in a global store (tens of thousands of messages with attachments metadata). Not a classic leak, but unbounded retention. We kept only the last 200 messages per conversation in memory, loaded older ones on demand, and evicted closed conversations after 10 minutes. Memory and input latency stabilised."

#### Variations you might be asked
- "How do you tell a leak from a cache?": caches should be bounded and stabilise; leaks grow without bound as you repeat actions.
- "What's the difference between shallow and retained size?": shallow is the object itself; retained is everything freed if it were collected.
- "Can React itself leak?": rarely; most leaks come from app code or libraries holding references outside React's lifecycle.

#### Step-by-step framework
1. **Reproduce** with a repeatable cycle.
2. **Confirm** with Performance monitor and forced GC.
3. **Compare heap snapshots**, filter Detached.
4. **Follow retainers** to the culprit.
5. **Fix** with cleanup, destroy, bounded caches.
6. **Verify and prevent** (StrictMode, lint, memory tests, monitoring).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Restart the app" / guesses | Measured reproduction and confirmation |
| One snapshot | Comparison snapshots after N cycles |
| Ignores retainers | Follows retainer chains to root cause |
| Fixes symptoms | Cleanup, destroy, bounded caches |
| No prevention | StrictMode, lint, memory tests, long-session RUM |

#### Useful phrases
- "If memory climbs with each repetition and doesn't come down after GC, it's a leak."
- "Comparison snapshots show what grew by exactly one per cycle."
- "The retainer chain tells me who's keeping the object alive."
- "Every effect that creates something must clean it up."

#### Common pitfalls
- **Not forcing GC** before snapshots.
- **Profiling development builds only.**
- **Missing third-party destroy calls.**
- **Unbounded global stores.**

#### Follow-ups to expect (with sample answers)
- **"What's memlab?"**
  "A Meta tool that runs E2E scenarios, takes heap snapshots and automatically identifies leaked objects and retainer traces."
- **"Do detached DOM nodes always mean a leak?"**
  "Not always (some libraries keep templates), but growing detached counts per cycle usually do."
- **"How do you check event listener counts?"**
  "The Performance monitor shows JS event listeners; `getEventListeners(window)` in the console lists them."

#### What senior interviewers look for
- **Methodical debugging.**
- **Framework-specific knowledge.**
- **Prevention mindset.**

#### Practise it
1. Introduce a listener leak in a demo app and find it with snapshot comparison.
2. Write a Playwright test that repeats a flow and checks heap growth.
3. Explain retainers, out loud.

## Performance budgets and real-user monitoring
- id: fe-perf-05
- roles: frontend, fullstack
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels: senior, staff
- tags: performance budgets, RUM, Lighthouse CI, monitoring, culture

### Prompt
How do you keep a web app fast over time, not just fix it once? Explain performance budgets (what to budget and how to enforce them in CI), lab vs real-user monitoring, how to build a RUM pipeline and dashboards, alerting, and how to create a performance culture across teams.

### Answer
#### What the interviewer is really testing
- Understanding that performance **regresses gradually** without guardrails.
- Choosing **meaningful budgets**: metrics (LCP/INP/CLS), resource sizes (JS/CSS/images), third-party counts.
- **Enforcement** in CI and **monitoring** in production with RUM, segmented properly.
- **Organisational** practices: ownership, dashboards, reviews, linking performance to business outcomes.

#### Key points
- Performance degrades **one PR at a time** (new dependency, tracking script, larger images); budgets turn performance into a **requirement**.
- **Budget types**: **user-centric metrics** (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75), **quantity budgets** (JS ≤ 170 KB gzipped per route, image weight, request counts, fonts), **rule-based** (Lighthouse score ≥ 90), **third-party** limits.
- **Enforce in CI**: bundle size checks (size-limit, bundlewatch), **Lighthouse CI** assertions on key templates, PR comments showing deltas; block or require approval for regressions.
- **Lab** = consistent, catches regressions before release; **field (RUM)** = truth about real users (devices, networks, geographies).
- **RUM pipeline**: `web-vitals` library with attribution → analytics endpoint (or vendor: SpeedCurve, Datadog RUM, Sentry Performance, Vercel Analytics) → dashboards by **page template, device, connection, country, release**.
- Look at **p75** (CWV standard) and distributions, not averages; watch trends and release markers.
- **Alerting** on sustained regressions (p75 LCP up 20% for a template over a day).
- **Culture**: ownership per team/page, performance reviews in design and PRs, sharing business impact, performance champions, regular "perf days".

#### Model answer
"Performance rarely collapses in one release; it erodes one small change at a time. Keeping an app fast needs three things: budgets that define 'fast enough', automated enforcement before release, and real-user monitoring after release.

**1. Define budgets**
| Budget type | Example |
|---|---|
| User-centric metrics (field, p75) | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on mobile per template |
| Lab metrics (CI) | Lighthouse performance ≥ 90 on product page with mobile throttling; TBT ≤ 200 ms |
| JavaScript | ≤ 170 KB gzipped initial JS per route; no new dependency > 30 KB without review |
| CSS / fonts | ≤ 50 KB critical CSS; ≤ 2 font files above the fold |
| Images | LCP image ≤ 150 KB on mobile; all images with dimensions |
| Third parties | ≤ 5 third-party scripts on checkout; all loaded async |
Budgets should be based on current baselines and competitors, tied to business-critical pages (landing, search, product, checkout), and tightened over time.

**2. Enforce in CI**
```json
// .size-limit.json
[
  { "name": "main bundle", "path": ".next/static/chunks/main-*.js", "limit": "120 KB" },
  { "name": "product page", "path": ".next/static/chunks/app/products/**/*.js", "limit": "60 KB" }
]
```
```js
// lighthouserc.js
module.exports = {
  ci: {
    collect: { url: ['http://localhost:3000/', 'http://localhost:3000/products/demo'], numberOfRuns: 3 },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
  },
};
```
- PR bots comment with bundle size and Lighthouse deltas, making cost visible to authors and reviewers.
- Run Lighthouse multiple times and use medians (lab results are noisy).
- Allow exceptions with explicit approval (e.g. a new feature worth the cost), not silent drift.

**3. Real-user monitoring (RUM)**
Lab tests run on one simulated device; real users have slow Android phones, flaky networks and different usage patterns. RUM shows what they experience:
```ts
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals/attribution';

function send(metric: any) {
  const body = JSON.stringify({
    name: metric.name, value: metric.value, rating: metric.rating,
    page: routeTemplate(location.pathname),          // '/products/[id]', not the raw URL
    release: import.meta.env.VITE_RELEASE,
    connection: (navigator as any).connection?.effectiveType,
    device: matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop',
    attribution: metric.attribution,                 // LCP element, slow interaction target, shift sources
  });
  navigator.sendBeacon('/rum', body);                // survives page unload
}
onLCP(send); onINP(send); onCLS(send); onTTFB(send);
```
Then aggregate into dashboards:
- **p75 per metric per page template, device type and country**, over time with **release markers**.
- **Distributions** (histograms), because averages hide slow tails.
- **Attribution views**: most common LCP elements, slowest interaction targets for INP, top CLS sources.
- **Correlation with business metrics** (conversion rate by LCP bucket) to quantify impact.
Vendors (SpeedCurve, Datadog RUM, Sentry, New Relic, Vercel Analytics) provide this out of the box; CrUX gives a public baseline but with 28-day aggregation and less detail.

**4. Alerting:** alert on sustained regressions rather than noise, e.g. p75 INP on the product template above 250 ms for 6 hours, or a 15% regression versus the previous release. Route alerts to the owning team with the release diff.

**5. Process and culture:**
- **Ownership**: each page template or area has an owning team responsible for its budget.
- **Design reviews**: consider performance early (hero video autoplay? third-party embeds?).
- **PR checklist**: new dependency? images sized? lazy loading appropriate? third-party justified?
- **Third-party governance**: marketing tags go through a review with performance impact and loading strategy.
- **Make it visible**: dashboards in team channels, monthly performance reviews, celebrate wins with business impact ('LCP -600 ms → +3% conversion').
- **Performance champions** in each team and periodic 'performance days' for paying down regressions.

**Lab vs field summary:**
| | Lab (Lighthouse, WebPageTest, CI) | Field (RUM, CrUX) |
|---|---|---|
| Purpose | Catch regressions before release, debug | Measure real experience, prioritise |
| Consistency | High (controlled) | Varies with users |
| Coverage | Few pages, simulated device | All users, devices, networks |
| INP | Not directly (TBT proxy) | Yes |"

#### Another worked example: stopping slow erosion
"An e-commerce site's mobile LCP drifted from 2.1 s to 3.4 s over a year, with no single bad release. We introduced size-limit budgets per route, Lighthouse CI on five key templates, and RUM dashboards with release markers. The first month flagged a 90 KB A/B testing SDK and an unoptimised hero carousel. Within a quarter LCP was back to 2.2 s, and the budgets prevented new regressions; three PRs were redesigned after the bot flagged them."

#### A third worked example: RUM revealing a hidden problem
"Lab scores for our dashboard were excellent, but RUM showed p75 INP of 380 ms in India and Brazil. Attribution pointed to a filter dropdown on low-end Android devices where a large synchronous re-render dominated. Lab tests on a fast laptop never revealed it. Fixing the re-render (virtualisation and transitions) improved INP for those markets to 170 ms."

#### Variations you might be asked
- "How do you handle noisy lab results?": multiple runs, medians, consistent CI hardware, and thresholds with tolerance.
- "Should budgets block merges?": for clear regressions yes, with an explicit override path; otherwise warnings that require acknowledgement.
- "How do you measure SPA route changes?": custom timings for soft navigations (time from click to content rendered) in RUM.

#### Step-by-step framework
1. **Explain why budgets are needed.**
2. **Define budget types** tied to key pages.
3. **Enforce in CI** with size and Lighthouse checks.
4. **Build RUM** with attribution and segmentation.
5. **Dashboards and alerting.**
6. **Process and culture.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| One-off optimisation projects | Budgets, CI enforcement, RUM |
| Lighthouse score only | Field p75 by template and device |
| Averages | Distributions and p75 |
| No ownership | Teams own budgets per area |
| No business link | Correlates performance with conversion |

#### Useful phrases
- "Performance erodes one pull request at a time, so we need guardrails."
- "Lab catches regressions before release; RUM tells us what users actually experience."
- "I segment by page template, device and network, and look at p75."
- "Every budget has an owner and an exception process."

#### Common pitfalls
- **Budgets without enforcement.**
- **Ignoring third-party scripts.**
- **Raw URLs** fragmenting RUM data.
- **Alert fatigue** from noisy thresholds.

#### Follow-ups to expect (with sample answers)
- **"How do you pick budget numbers?"**
  "From current baselines, Core Web Vitals thresholds and competitors, then tighten gradually."
- **"What's CrUX good for?"**
  "A public, real-user baseline for your origin and competitors; less granular and slower than your own RUM."
- **"How do you get product managers to care?"**
  "Show experiments or correlations linking speed to conversion, bounce rate and revenue."

#### What senior interviewers look for
- **Systems thinking about performance.**
- **Practical tooling.**
- **Organisational influence.**

#### Practise it
1. Write a budget table for three templates in an app you know.
2. Add size-limit and Lighthouse CI to a project.
3. Explain lab vs field data, out loud.

## Rendering strategies and their performance trade-offs
- id: fe-perf-06
- roles: frontend, fullstack
- round: PERFORMANCE_OPTIMIZATION
- difficulty: hard
- levels: senior, staff
- tags: rendering strategies, SSR, CSR, SSG, islands, hydration, performance

### Prompt
Compare client-side rendering, server-side rendering, static generation, streaming SSR, islands architecture/partial hydration, React Server Components and resumability from a performance perspective. How does each affect TTFB, FCP, LCP, INP, JS size and server cost, and how do you choose?

### Answer
#### What the interviewer is really testing
- Understanding **where work happens** (server, build, CDN, client) and its effect on each metric.
- Knowing the **hydration cost** problem and approaches to reduce it (islands, RSC, progressive/selective hydration, resumability).
- **Trade-offs**: freshness, personalisation, infrastructure cost, complexity.
- **Context-driven choices** per page type, often mixed.

#### Key points
- **CSR**: minimal HTML, JS renders everything. Fast TTFB, slow FCP/LCP (waits for JS + data), large JS, SEO weaker; good for app-like, logged-in experiences.
- **SSR**: HTML per request: better FCP/LCP, but TTFB includes server work; still **hydration** cost (JS for whole page) affecting INP during load.
- **SSG/ISR**: prebuilt HTML from CDN: excellent TTFB/FCP/LCP and low cost; freshness limited (ISR mitigates).
- **Streaming SSR**: send shell early, stream slow parts with Suspense: better TTFB/FCP, progressive content; selective hydration prioritises interacted areas.
- **Islands/partial hydration** (Astro, Fresh): static HTML with only interactive components hydrated: minimal JS, great INP; best for content sites.
- **React Server Components**: server-only components ship no JS; client components hydrate; reduces bundle and hydration work; enables streaming.
- **Resumability** (Qwik): serialises state so the client resumes without re-executing components (no hydration); JS loaded on interaction.
- **Edge rendering** reduces latency for SSR but data may still be far away.
- Choose by: content dynamism, personalisation, interactivity, SEO, device mix, team/framework.

#### Model answer
"Every rendering strategy is a decision about where and when the work of turning data into pixels happens: at build time, on a server per request, at the edge, or on the user's device. Each choice moves cost between TTFB, LCP, JavaScript size and responsiveness.

**Strategies and their performance profile:**
| Strategy | TTFB | FCP/LCP | JS shipped / hydration | INP during load | Server cost | Freshness/personalisation |
|---|---|---|---|---|---|---|
| CSR (SPA) | Fast (static shell) | Slow: waits for JS + data | Large; renders everything | Risky on slow devices | Low | Full (client fetch) |
| SSR | Slower (server work) | Good | Large; full-page hydration | Hydration can block input | Higher | Full |
| SSG | Fastest (CDN) | Excellent | Depends on framework (often full hydration) | Depends | Lowest | Build-time only |
| ISR | Fast (CDN) | Excellent | Same as SSG | Depends | Low | Bounded staleness / on-demand |
| Streaming SSR | Fast first byte (shell) | Good, progressive | Hydration per Suspense boundary | Selective hydration helps | Medium | Full |
| Islands / partial hydration | Fast (often static) | Excellent | Only interactive islands | Excellent | Low | Mostly static with dynamic islands |
| React Server Components | Similar to SSR/streaming | Good | Only client components | Better (less hydration) | Medium | Full |
| Resumability (Qwik) | Similar to SSR | Good | Lazy, on interaction | Excellent at load | Medium | Full |

**The hydration problem.** With classic SSR, the server sends HTML (good LCP), but the client then downloads JavaScript for the whole page, re-runs every component to attach event handlers and rebuild state. On a mid-range phone that can be seconds of main-thread work: the page looks ready but doesn't respond (poor INP, 'uncanny valley'). Modern approaches all try to reduce this:
- **Code splitting and lazy hydration**: hydrate below-the-fold components later.
- **Selective hydration** (React 18 streaming): hydrate Suspense boundaries independently, prioritising what the user interacts with.
- **Islands**: only interactive widgets ship JS (a product page's add-to-cart and image carousel; the rest is static HTML).
- **Server Components**: server-only parts don't ship JS at all; only client components hydrate.
- **Resumability**: the server serialises listeners and state into HTML; the client doesn't re-execute components on load, loading code only when the user interacts.

**CSR in detail:** TTFB is tiny (a static shell from a CDN), but the browser must download, parse and execute the app bundle, then fetch data, then render, so LCP often lands at 3–5 s on mobile. Fine (and simpler) for authenticated, highly interactive apps where users stay long (email clients, design tools, admin dashboards), especially with good caching and a service worker for repeat visits. Weak for SEO-critical, first-visit-heavy pages.

**SSR and streaming:** the server renders HTML with data, improving FCP/LCP and SEO. TTFB includes data fetching, so slow backends hurt; **streaming** sends the shell immediately and streams slower sections, decoupling TTFB from the slowest query. Costs: servers to run, caching complexity, and hydration.

**SSG/ISR:** prerendered at build or regenerated in the background, served from CDNs worldwide: best TTFB/LCP and cheapest. Limited to content that isn't personalised per request (personalised parts can be client-side or dynamic islands).

**Islands (Astro-style):** pages are static HTML by default; interactive components are explicitly hydrated (`client:load`, `client:visible`, `client:idle`). Ideal for content-heavy sites (marketing, docs, blogs, e-commerce content pages) with little interactivity.

**React Server Components:** in Next.js App Router, components are server-only by default; only `'use client'` components ship JS and hydrate. Combined with streaming and partial prerendering, you get SSR-like LCP with much less client JS, while keeping React's component model for interactive parts.

**Edge rendering:** running SSR close to users reduces network latency, but if data lives in one region, edge functions may make slow round trips to the database; caching or regional data is needed.

**Choosing (often mixed per route):**
- **Marketing/content/docs**: SSG/ISR or islands; minimal JS.
- **E-commerce product/category pages**: static/ISR content with dynamic islands (price, stock, cart), RSC or islands to limit JS.
- **Search results**: SSR/streaming (SEO, fresh), client interactivity for filters.
- **Logged-in dashboards/apps**: SSR shell + client fetching, or CSR with good caching; focus on INP and bundle size.
- **Low-end device audiences**: favour approaches minimising client JS (islands, RSC, resumability).

**Measuring the decision:** compare TTFB, LCP and INP in RUM by template and device before and after; check JS bytes and main-thread time during load; account for server costs and operational complexity."

#### Another worked example: CSR to RSC for a marketplace
"A marketplace's category pages were a CSR React SPA: 900 KB JS, p75 mobile LCP 4.3 s, poor SEO. Moving to Next.js App Router with Server Components for listings and product cards (no client JS), client components only for filters and favourites, and ISR for category content reduced JS to 210 KB, LCP to 1.9 s and INP during load by about half. Organic traffic rose over the following months as pages became fully indexable."

#### A third worked example: islands for documentation
"A developer documentation site built as an SPA shipped 400 KB of JS to render mostly static text, with slow first loads on mobile. Rebuilding with an islands framework rendered all pages statically, hydrating only the search box, code copy buttons and an API playground (on visibility). JS on typical pages dropped to ~20 KB, LCP improved by over a second, and the playground still felt fully interactive."

#### Variations you might be asked
- "What is partial prerendering?": a static shell prerendered and cached, with dynamic Suspense holes streamed per request, combining SSG speed with SSR freshness.
- "Is SSR always better for performance?": not always; it can worsen TTFB and still ship large hydration JS. Static generation or islands may be better; CSR may be fine for apps.
- "How does hydration affect INP?": hydration runs long tasks on the main thread; interactions during hydration wait, increasing input delay.

#### Step-by-step framework
1. **Frame as where/when work happens.**
2. **Compare strategies by metric.**
3. **Explain the hydration problem** and modern solutions.
4. **Detail key strategies** (CSR, SSR/streaming, SSG/ISR, islands, RSC, resumability, edge).
5. **Choose per page type.**
6. **Measure outcomes** and costs.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "SSR is faster than CSR" | Metric-by-metric trade-offs |
| Ignores hydration | Explains hydration cost and fixes |
| One strategy for everything | Mixed per route |
| Unaware of islands/RSC/resumability | Compares modern approaches |
| No measurement | RUM by template and device |

#### Useful phrases
- "Rendering strategy is about where the work happens: build, server, edge or device."
- "SSR improves LCP but full hydration can hurt responsiveness."
- "Islands and Server Components ship JavaScript only for interactive parts."
- "I choose per route, and verify with real-user data."

#### Common pitfalls
- **CSR for SEO-critical first-visit pages.**
- **SSR with slow backends** and no streaming.
- **Hydrating everything.**
- **Edge rendering far from data.**

#### Follow-ups to expect (with sample answers)
- **"What's the uncanny valley in SSR?"**
  "When the page looks interactive (HTML painted) but clicks don't work because hydration hasn't finished."
- **"How does Qwik avoid hydration?"**
  "It serialises the application state and event listener references into HTML, so the client resumes and loads handlers lazily on interaction."
- **"When is CSR the right choice?"**
  "For authenticated, highly interactive apps with long sessions where SEO doesn't matter and repeat visits are cached."

#### What senior interviewers look for
- **Architectural performance reasoning.**
- **Modern landscape knowledge.**
- **Pragmatic, measured decisions.**

#### Practise it
1. Pick three page types and justify a rendering strategy for each with expected metric impact.
2. Measure hydration time on an SSR page in the Performance panel.
3. Explain the hydration problem and three solutions, out loud.

## Walk through optimizing a slow React page. What do you check first?
- id: 23915840-8727-45b4-a4e7-acfbc977df90
- roles: frontend, fullstack, ai
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- tags: performance, methodology
- companies: Meta, Apple, Stripe

### Prompt
A product manager says "the orders page is slow". Walk through how you'd investigate and optimise it, from clarifying what "slow" means to measuring, identifying the bottleneck (network, JavaScript, rendering, React) and verifying improvements. What do you check first?

### Answer
#### What the interviewer is really testing
- **Clarifying the problem**: slow to load, slow to respond, janky scrolling, which users and devices.
- A **measurement-first methodology**: field data, then lab reproduction and profiling.
- Systematically checking **network/server, JavaScript, rendering, React-specific** causes.
- **Prioritising** fixes by impact and verifying with metrics.

#### Key points
- "Slow" can mean **initial load** (LCP, TTFB), **interactions** (INP), **scrolling/animation** (dropped frames), or **data freshness/latency** (slow APIs).
- Start with **field data** (RUM/CrUX): which metric, which pages, devices, regions; then **reproduce** on realistic hardware (CPU throttling, slow network).
- **Network/server**: TTFB, API waterfalls, payload sizes, caching, too many requests.
- **JavaScript**: bundle size, long tasks, third-party scripts, hydration.
- **Rendering**: DOM size, layout thrashing, expensive styles, images.
- **React**: unnecessary re-renders (Profiler), expensive render computations, large lists without virtualisation, context churn, missing keys.
- Fix the **biggest bottleneck first**; measure before/after; add guardrails (budgets, RUM alerts).

#### Model answer
"The first thing I check is what 'slow' actually means, because the fix for slow loading is completely different from the fix for laggy typing.

**Step 1: Clarify**
- Slow to **load** (blank screen, spinners), slow to **respond** (clicking filters lags), **janky scrolling**, or slow **data** (API takes seconds)?
- Who's affected: all users or mobile, specific regions, large accounts with many orders?
- Since when: after a release, or gradually?

**Step 2: Look at field data first**
RUM dashboards (or CrUX) for the orders page: p75 LCP, INP, CLS and TTFB by device and release. Attribution tells me the LCP element and the slowest interactions. If INP is 450 ms on mobile and LCP is fine, I focus on interactions.

**Step 3: Reproduce in the lab on realistic conditions**
- Chrome DevTools with **4× CPU throttling** and 'Fast 4G' network, or a real mid-range Android phone.
- Production build (development React is much slower).
- Test with realistic data (an account with 5,000 orders, not 10).

**Step 4: Check the main areas systematically**

*Network and server (for load problems):*
- **Network panel waterfall**: TTFB of the HTML, API call timing, sequential requests (waterfalls: page loads, then fetches user, then fetches orders, then fetches customers per order).
- Payload sizes (fetching 5,000 orders with every field?), missing compression, missing caching.
- Fixes: parallelise requests, server-side rendering or prefetching, paginate and select only needed fields, add caching (TanStack Query staleTime, CDN), fix slow backend queries.

*JavaScript (load and interactions):*
- **Bundle analyser**: how much JS does this page load? Heavy libraries (charts, date libraries) in the main chunk?
- **Performance panel**: long tasks during load (parse/execute, hydration) and during interactions; third-party scripts.
- Fixes: code splitting, removing/deferring third parties, lighter dependencies, Server Components.

*Rendering:*
- DOM size (thousands of rows?), layout thrashing ('Forced reflow' warnings), expensive CSS, large unoptimised images.
- Fixes: virtualisation, batching DOM reads/writes, image optimisation.

*React specifically:*
- **React DevTools Profiler**: record the slow interaction. Which components render, how often, how long, and why ('why did this render').
- Common findings:
  - Typing in a filter re-renders the whole page (state too high, or context changes).
  - Every row re-renders because of inline callbacks/objects passed to memoized rows.
  - Expensive computations (sorting/grouping 5,000 orders) during every render.
  - Lists rendering thousands of rows without virtualisation.
  - Effects causing extra render passes or request loops.
- Fixes: move state down, memoize expensive computations and rows with stable props, `useTransition`/`useDeferredValue` for non-urgent updates, virtualise lists, fix effect dependencies.

**Step 5: Prioritise**
Estimate impact vs effort: e.g. virtualising the table (big INP and memory win, moderate effort), fixing the API waterfall (big LCP win, low effort), memoizing rows (small win, low effort). Fix the biggest bottleneck first; measure after each change so you know what helped.

**Step 6: Verify and protect**
- Re-measure in the lab with the same setup; confirm improvements in RUM after release.
- Add guardrails: bundle budgets, Lighthouse CI on the page, RUM alerts.
- Report results in user and business terms ('filter response from 450 ms to 120 ms on mobile')."

#### Another worked example: the orders page
"For an admin orders page reported as 'slow', RUM showed LCP 3.8 s and INP 520 ms on laptops of large-account users. The waterfall revealed three sequential API calls (user → permissions → orders) and a 4 MB orders payload; the Profiler showed the 3,000-row table re-rendering fully on every filter keystroke. Fixes: parallel requests plus server-side pagination (50 rows, only needed fields), virtualisation, filter state moved into the filter component with `useDeferredValue` for the table. LCP dropped to 1.6 s and INP to 140 ms."

#### A third worked example: it wasn't React
"A page felt sluggish after a release; developers suspected React re-renders. The Performance panel showed a 600 ms long task from a newly added session-replay script running on every click. Moving it to load after idle and sampling sessions fixed INP immediately. Measuring first prevented a week of unnecessary memoization work."

#### Variations you might be asked
- "What if you can't reproduce it?": segment RUM data (device, browser, account size), get session details or replays, test with production-like data and slower devices.
- "How do you profile React in production?": use React's profiling build or the Performance panel's user timings; RUM attribution for interactions.
- "What's the quickest win usually?": often removing waterfalls, reducing payloads, deferring third parties, or virtualising lists.

#### Step-by-step framework
1. **Clarify 'slow'.**
2. **Field data** by metric, device, release.
3. **Reproduce** realistically (throttling, production build, real data).
4. **Check network, JS, rendering, React** systematically.
5. **Prioritise** by impact and fix iteratively.
6. **Verify** and add guardrails.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Add React.memo and useMemo" | Clarifies and measures first |
| Tests on a fast laptop | CPU throttling, production build, real data |
| Only looks at React | Network, JS, rendering, React systematically |
| Many changes at once | Iterative, measured fixes |
| No follow-up | RUM verification and budgets |

#### Useful phrases
- "First I want to know whether it's slow to load or slow to respond."
- "I reproduce with CPU throttling, a production build and realistic data."
- "The Profiler tells me which components render and why."
- "I fix the biggest bottleneck first and measure after each change."

#### Common pitfalls
- **Premature memoization.**
- **Ignoring third-party scripts.**
- **Testing with tiny datasets.**
- **Development-mode profiling.**

#### Follow-ups to expect (with sample answers)
- **"What tools do you use?"**
  "RUM/CrUX, Lighthouse, Chrome Performance and Network panels, React DevTools Profiler, bundle analysers, WebPageTest."
- **"How do you explain the results to a PM?"**
  "In user terms and business impact: 'filters now respond instantly on mobile; we expect fewer abandoned searches.'"
- **"What if the API is the bottleneck?"**
  "Work with the backend team on query performance, pagination and caching; on the frontend, parallelise, cache and show skeletons/stale data."

#### What senior interviewers look for
- **Structured methodology.**
- **Breadth across the stack.**
- **Measurable outcomes.**

#### Practise it
1. Take a slow page you know and walk through the six steps, writing findings.
2. Record a Profiler session for a slow interaction and identify the top cause.
3. Explain your first three checks, out loud, in 60 seconds.

## What is INP and how is it different from FID?
- id: 84c51b35-ac26-4fea-9cd4-344cf0e341c1
- roles: frontend, fullstack, ai
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- tags: performance, CWV, INP
- companies: Apple, Meta

### Prompt
Explain Interaction to Next Paint (INP). How is it calculated, how does it differ from First Input Delay (FID), which it replaced as a Core Web Vital, what typically causes poor INP in React apps, and how do you debug and improve it?

### Answer
#### What the interviewer is really testing
- Precise understanding of **what INP measures** (full interaction latency to next paint, across the whole visit).
- Clear **contrast with FID** (only input delay of the first interaction).
- Knowing the **three phases** (input delay, processing, presentation) and their causes.
- Practical **debugging** (RUM attribution, DevTools) and **fixes** in React/JS.

#### Key points
- **INP** measures the latency of **all** clicks, taps and key presses during a page visit: from the input until the **next frame is painted** showing a response; the reported value is approximately the **worst** interaction (the 98th percentile for pages with many interactions).
- Thresholds (p75): **good ≤ 200 ms**, needs improvement ≤ 500 ms, **poor > 500 ms**.
- **FID** measured only the **input delay** of the **first** interaction (time until the handler started), ignoring processing and rendering, and later interactions. Most sites passed FID easily while still feeling sluggish.
- INP became a Core Web Vital in **March 2024**, replacing FID.
- Phases: **input delay** (main thread busy), **processing time** (event handlers), **presentation delay** (rendering/layout/paint of the next frame).
- Causes: long tasks (hydration, third parties), heavy handlers, large re-renders, large DOMs, layout thrashing, synchronous work (JSON parsing, sorting).
- Fixes: yield to main thread, reduce JS, optimise renders (transitions, memoization, virtualisation), immediate visual feedback, Web Workers, reduce DOM size.
- Lab: no direct INP in Lighthouse (TBT is a proxy); use DevTools interactions track; field: `web-vitals` with attribution.

#### Model answer
"INP, Interaction to Next Paint, measures how quickly a page visually responds to user interactions throughout the visit. For each click, tap or key press, it measures the time from the input to the next frame painted after the event handlers run. The page's INP is roughly its worst interaction (for pages with many interactions, the 98th percentile, so one outlier doesn't dominate).

**Thresholds (75th percentile of page visits):**
| | Good | Needs improvement | Poor |
|---|---|---|---|
| INP | ≤ 200 ms | 200–500 ms | > 500 ms |

**How it differs from FID:**
| | FID (retired) | INP (current) |
|---|---|---|
| Which interactions | First only | All during the visit |
| What it measured | Input delay only (until handler starts) | Input delay + processing + presentation (until next paint) |
| Typical pass rate | Very high (often misleading) | Lower; reflects real sluggishness |
| Status | Replaced in March 2024 | Core Web Vital |
FID could be great even if every click then took 400 ms of handler work and rendering, because it stopped measuring when the handler started. And interactions after the first (where most usage happens in apps) were ignored. INP captures the full experience.

**The three phases of an interaction:**
```
user clicks ──► [input delay] ──► [processing: event handlers] ──► [presentation delay: render, layout, paint] ──► next frame
```
1. **Input delay**: the main thread was busy with something else (hydration, a third-party script, a long task from a timer) when the user clicked.
2. **Processing time**: your event handlers run: React state updates and the resulting synchronous re-render, analytics calls, data processing.
3. **Presentation delay**: the browser computes styles and layout and paints; big DOM changes or forced layouts make this long.

**Common causes in React apps:**
- A click triggers a **state update that re-renders a huge tree** (state too high, context changes, unmemoized lists).
- **Expensive synchronous work in handlers**: filtering/sorting thousands of items, parsing JSON, building charts.
- **Hydration** occupying the main thread when users interact early.
- **Third-party scripts** (analytics, tag managers, chat widgets, A/B tools) running long tasks, sometimes on every click.
- **Large DOMs** making layout and paint slow.
- **Layout thrashing** in handlers.

**Debugging:**
1. **Field data with attribution**:
```ts
import { onINP } from 'web-vitals/attribution';
onINP(({ value, attribution }) => {
  report({
    value,
    target: attribution.interactionTarget,          // CSS selector of the element
    type: attribution.interactionType,              // pointer / keyboard
    inputDelay: attribution.inputDelay,
    processing: attribution.processingDuration,
    presentation: attribution.presentationDelay,
    longestScript: attribution.longAnimationFrameEntries?.[0]?.scripts?.[0]?.sourceURL,   // LoAF script attribution
  });
});
```
This tells me which element and which phase is slow, and often which script (via Long Animation Frames).
2. **Reproduce** in the DevTools Performance panel with CPU throttling: the Interactions track shows each interaction's duration split into phases; the flame chart shows what ran.
3. **React Profiler** to see what rendered and why during the slow interaction.

**Fixes by phase:**
- *Input delay*: break up long tasks (yield with `scheduler.yield()` or setTimeout), reduce/defer third-party scripts, reduce hydration cost (less JS, Server Components, lazy hydration), avoid heavy timers.
- *Processing*:
  - Give **immediate feedback** first (update the clicked control), then do heavy work in a **transition** or after yielding:
```tsx
function onFilterChange(value: string) {
  setFilterInput(value);                       // urgent: checkbox/input updates instantly
  startTransition(() => setAppliedFilter(value));   // heavy list update is interruptible
}
```
  - Avoid unnecessary re-renders (state colocation, memoized rows with stable props, split contexts).
  - Move heavy computation to a Web Worker or precompute.
  - Defer non-essential work (analytics) with `requestIdleCallback`/after paint.
- *Presentation*: smaller DOM (virtualisation, content-visibility), avoid forced layout, animate with transform/opacity, avoid huge style recalculations.

**Lab vs field:** Lighthouse can't measure INP because it doesn't interact; **Total Blocking Time** correlates with input delay during load. Real INP must come from RUM (or manual interaction profiling)."

#### Another worked example: a slow 'Add to cart'
"RUM showed p75 INP of 380 ms on product pages, attributed to the 'Add to cart' button. Breakdown: processing 290 ms. Profiling showed the click updated a global cart context, re-rendering the whole page (including a heavy reviews section), plus a synchronous call to three analytics SDKs. We split cart state into a selector-based store so only the cart badge re-rendered, showed the button's 'Added' state immediately, and queued analytics calls after paint. INP fell to 110 ms."

#### A third worked example: input delay from hydration
"On a news homepage, many users tapped the menu within the first 2 seconds, while a 1.2 s hydration task blocked the main thread, giving 900 ms+ interactions. Moving most of the page to Server Components (only the menu, search and video player as client components) cut hydration to ~200 ms, and p75 INP dropped from 310 ms to 150 ms."

#### Variations you might be asked
- "What counts as an interaction?": clicks, taps and key presses (not scrolling or hovering).
- "What's the Long Animation Frames API?": an API reporting frames that took over 50 ms with script attribution, helping identify what caused slow interactions.
- "Does INP include network time?": no; it measures until the next paint. If you show a spinner immediately while waiting for the network, INP is good (the response is visual feedback).

#### Step-by-step framework
1. **Define INP** and thresholds.
2. **Contrast with FID.**
3. **Explain the three phases.**
4. **List React/JS causes.**
5. **Debug** with RUM attribution, DevTools, Profiler.
6. **Fix by phase** and note lab limitations.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "INP is the new FID" | Explains what it measures and why it's stricter |
| Doesn't know phases | Input delay, processing, presentation |
| Lighthouse INP score | Knows INP needs field data; TBT proxy |
| Generic 'optimise JS' | Phase-specific fixes with code |
| No attribution | web-vitals attribution and LoAF |

#### Useful phrases
- "FID only measured waiting for the first handler; INP measures the whole interaction until the next paint."
- "I split INP into input delay, processing and presentation delay to know what to fix."
- "Give feedback immediately, then do the heavy work in a transition."
- "If a spinner appears instantly while we wait for the network, INP stays good."

#### Common pitfalls
- **Heavy synchronous handlers.**
- **Global state updates re-rendering everything.**
- **Unchecked third-party scripts.**
- **Relying on lab tools** for INP.

#### Follow-ups to expect (with sample answers)
- **"Why 98th percentile rather than worst?"**
  "Pages with many interactions would otherwise be judged by a single outlier; the high percentile reflects consistently slow experiences."
- **"How do you get immediate feedback for a slow action?"**
  "Update the UI optimistically or show a pending state in the same frame, and defer the expensive work."
- **"What's TBT's relationship to INP?"**
  "TBT measures main-thread blocking during load in the lab, correlating with input delay risk, but doesn't capture processing or presentation for real interactions."

#### What senior interviewers look for
- **Precise metric knowledge.**
- **Phase-based debugging.**
- **Effective React-specific fixes.**

#### Practise it
1. Add web-vitals INP attribution logging and trigger a slow interaction.
2. Fix a slow interaction using useTransition and immediate feedback.
3. Explain INP vs FID, out loud, in 45 seconds.

## LCP is 4 seconds. Walk through diagnostics.
- id: d12f5721-f267-420b-84e4-c43cce926bdc
- roles: frontend, fullstack, ai
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- tags: performance, LCP
- companies: Stripe, Meta

### Prompt
Your product page has a p75 mobile LCP of 4 seconds. Walk through how you'd diagnose the cause step by step, using the LCP sub-parts, and what fixes you'd apply for each. How would you verify the improvement?

### Answer
#### What the interviewer is really testing
- A **structured diagnosis** using the four **LCP sub-parts**.
- Identifying the **LCP element** and why it's slow.
- Knowing **specific fixes** per sub-part (server, discovery, download, render).
- Using **field and lab tools** properly and verifying in RUM.

#### Key points
- First identify the **LCP element** per device (hero image, product image, heading text) using RUM attribution or DevTools.
- LCP = **TTFB** + **resource load delay** + **resource load duration** + **element render delay**.
- **TTFB** (server/network): slow backend, no CDN/caching, redirects, cold starts. Fix: caching, CDN/edge, static/ISR, streaming, faster queries.
- **Load delay** (discovery): image found late (CSS background, JS-rendered, lazy-loaded, behind other resources). Fix: `<img>` in HTML, `fetchpriority="high"`, preload, no lazy loading, avoid client rendering.
- **Load duration** (download): large file, wrong format, competing downloads. Fix: AVIF/WebP, responsive sizes, compression, CDN, fewer competing requests.
- **Render delay** (blocked rendering): render-blocking CSS/JS, fonts (text LCP), client-side rendering/hydration, A/B testing anti-flicker. Fix: critical CSS, defer JS, SSR, font strategy, remove anti-flicker snippets.
- Verify in **lab** (Lighthouse, WebPageTest filmstrip) and **field** (RUM p75 after release).

#### Model answer
"I'd find out what the LCP element is, then break the 4 seconds into its four sub-parts. That tells me whether the problem is the server, discovering the image, downloading it, or rendering it, and each has different fixes.

**Step 1: Identify the LCP element and context**
- RUM attribution (`web-vitals` `onLCP` attribution) or CrUX/PageSpeed Insights: on mobile, is LCP the main product image, a hero banner, or a text block? Is it consistent across product pages?
- Reproduce with DevTools Performance panel (mobile emulation, CPU 4×, Slow 4G) or WebPageTest on a real mid-range phone. The Performance panel marks LCP and shows the element.

**Step 2: Break down LCP into sub-parts**
| Sub-part | What it is | Target share |
|---|---|---|
| TTFB | Time until the first byte of HTML | ~40% |
| Resource load delay | TTFB → when the LCP resource starts downloading | < 10% |
| Resource load duration | Download time of the LCP resource | ~40% |
| Element render delay | Resource loaded → element painted | < 10% |
(For text LCP, there's no resource: it's TTFB + render delay.) DevTools' performance insights and web-vitals attribution report these sub-parts directly.

Suppose we get: TTFB 1.2 s, load delay 1.4 s, load duration 0.9 s, render delay 0.5 s. Load delay is the biggest problem.

**Step 3: Fix each sub-part**

*TTFB (1.2 s):*
- Is the HTML server-rendered per request with slow data calls? Cache product pages (ISR/static with on-demand revalidation), serve from a CDN, or stream the shell immediately.
- Remove redirect chains (`http → https → www → /en/`).
- Speed up backend queries; avoid serverless cold starts on critical paths.

*Resource load delay (1.4 s):* the browser starts downloading the image late. Typical causes:
- The image is a **CSS background** (discovered only after CSS parses).
- It's **rendered by JavaScript** (client-side gallery that renders after hydration and data fetching).
- It's **lazy-loaded** (`loading="lazy"` or a carousel library lazy-loading every slide).
- Other resources hog bandwidth first (fonts, scripts, many images).
Fixes:
```html
<img src="/products/123-800.avif"
     srcset="/products/123-480.avif 480w, /products/123-800.avif 800w, /products/123-1200.avif 1200w"
     sizes="(min-width: 1024px) 50vw, 100vw"
     width="1200" height="1200" alt="Blue running shoe, side view"
     fetchpriority="high">                 <!-- in the server-rendered HTML, not lazy -->
```
If it must be discovered later (CSS background, JS-driven), preload it:
```html
<link rel="preload" as="image" imagesrcset="…" imagesizes="…" fetchpriority="high">
```

*Resource load duration (0.9 s):*
- Is the image 600 KB JPEG at 2400px for a 400px slot? Serve AVIF/WebP with responsive srcset/sizes via an image CDN; target ~100–150 KB on mobile.
- Is it on a different origin without preconnect? Serve from the same CDN or `preconnect`.
- Are fonts, scripts and below-the-fold images downloading at the same time? Lower their priority (lazy-load other images, defer scripts).

*Element render delay (0.5 s):* the image arrived but wasn't painted yet:
- Render-blocking CSS (large CSS bundles) or synchronous scripts in the head: inline critical CSS, defer JS.
- Client-side rendering: the element is only created after JS runs; server-render it.
- A/B testing or personalisation **anti-flicker snippets** hiding the page until scripts load: remove or move experiments server-side.
- Hydration-dependent rendering (e.g. carousels that hide images until initialised).
- For **text LCP**: web fonts with `font-display: block`; use `swap`/`optional` with matched fallbacks and preload the font.

**Step 4: Verify**
- Lab: re-run Lighthouse/WebPageTest with the same settings; compare filmstrips (hero visible earlier) and sub-part timings.
- Field: after release, watch p75 LCP for the product template on mobile in RUM; CrUX updates over 28 days.
- Add guardrails: Lighthouse CI assertion on LCP for the template and a check that the LCP image isn't lazy-loaded.

**Typical result** for this kind of page: TTFB 1.2 → 0.4 s (cached/ISR), load delay 1.4 → 0.1 s (HTML img + fetchpriority), duration 0.9 → 0.5 s (AVIF, right size), render delay 0.5 → 0.2 s (critical CSS, no anti-flicker): LCP ~1.2–1.8 s."

#### Another worked example: a client-rendered gallery
"A fashion retailer's product page used a client-side image gallery that fetched image URLs from an API after hydration and lazy-loaded every slide, including the first. p75 mobile LCP was 4.4 s with 2.1 s load delay. Server-rendering the first image as a plain `<img fetchpriority="high">` with AVIF srcset, initialising the gallery around it after hydration, and lazy-loading only the other slides cut LCP to 1.9 s. Conversion on mobile product pages rose by about 4% in an A/B test."

#### A third worked example: the anti-flicker snippet
"A page's LCP was 3.6 s despite a small, prioritised hero image. The render delay was 1.5 s: an A/B testing anti-flicker snippet set `opacity: 0` on the body until the experiment script loaded (up to 4 s timeout). Moving key experiments server-side and removing the snippet brought LCP to 2.0 s."

#### Variations you might be asked
- "What if LCP is a text element?": focus on TTFB, render-blocking CSS and fonts; preload the font and use font-display swap/optional.
- "Why can LCP differ between lab and field?": real users have different devices, networks, cache states, and the LCP element may differ (cookie banners, different viewport sizes).
- "Can a cookie banner become the LCP element?": yes, if it's the largest element; it can then dominate LCP, so render it efficiently or keep it smaller.

#### Step-by-step framework
1. **Identify the LCP element** (field + lab).
2. **Break into four sub-parts.**
3. **Fix TTFB.**
4. **Fix discovery (load delay).**
5. **Fix download (load duration).**
6. **Fix render delay, then verify** in lab and field.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Compress images and use a CDN" | Sub-part breakdown guides the fix |
| Doesn't identify the element | Uses attribution per device |
| Ignores discovery | Fixes late discovery with HTML img, priority, preload |
| Ignores render blockers | Critical CSS, anti-flicker, CSR issues |
| No verification | Lab filmstrips and field p75 after release |

#### Useful phrases
- "First, what is the LCP element on mobile?"
- "LCP is TTFB plus load delay plus load duration plus render delay."
- "The biggest LCP bug I see is the hero image being discovered late or lazy-loaded."
- "I verify in the lab, then confirm with real-user p75."

#### Common pitfalls
- **Lazy-loaded hero images.**
- **CSS background heroes.**
- **Anti-flicker snippets.**
- **Optimising images while ignoring TTFB.**

#### Follow-ups to expect (with sample answers)
- **"How do you find sub-parts in DevTools?"**
  "The Performance panel's insights show LCP breakdown; web-vitals attribution reports timeToFirstByte, resourceLoadDelay, resourceLoadDuration and elementRenderDelay."
- **"Is preloading always good?"**
  "Only for the critical resource discovered late; preloading many things competes for bandwidth and can make LCP worse."
- **"How does SSR vs CSR affect LCP?"**
  "SSR puts the content in HTML so it can render without waiting for JS and data; CSR adds JS download/execute and data fetching before LCP."

#### What senior interviewers look for
- **Structured diagnosis.**
- **Specific, correct fixes.**
- **Verification discipline.**

#### Practise it
1. Analyse a real page's LCP sub-parts with web-vitals attribution.
2. Fix a late-discovered LCP image with fetchpriority and preload.
3. Walk through the four sub-parts and fixes out loud in 2 minutes.

## You're using Next.js. The build size is 5MB. How do you cut it?
- id: 8ca195a5-0b67-42eb-9829-b59235a9a90a
- roles: frontend, fullstack, ai
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- companies: Meta, Stripe
- tags: performance, bundle-size

### Prompt
You're working on a Next.js app and the client JavaScript build is around 5MB. How do you find out where the weight comes from, and how do you cut it down? What would you change first, and how do you stop it growing back?

### Answer
#### What the interviewer is really testing
- Whether you **clarify what "5MB" means** (total output, first-load JS for one route, raw vs gzipped) before acting.
- A **measurement-first** approach: bundle analyser, per-route first-load JS, coverage, not guessing.
- Knowledge of the **usual culprits**: heavy dependencies, barrel imports, polyfills, client components that could be server components, things loaded eagerly that should be lazy.
- Next.js-specific tools: **App Router server components, `next/dynamic`, `optimizePackageImports`, `@next/bundle-analyzer`, `next/third-parties`, `next/font`, `next/image`**.
- Whether you **prevent regression** with budgets in CI, not just a one-off clean-up.

#### Key points
- **Clarify first.** 5MB of total build output across 200 routes is very different from 5MB of first-load JS on the home page. Ask: which route, gzipped or raw, client or server bundle? What matters to users is **first-load JS per route (compressed)** and what blocks interaction.
- **Measure.** `@next/bundle-analyzer` (`ANALYZE=true next build`) shows a treemap of client chunks. The `next build` output lists **First Load JS** per route. Chrome DevTools **Coverage** shows how much shipped code never runs.
- **Find the big dependencies.** Usual suspects: `moment` with all locales, full `lodash`, icon libraries imported via barrels, charting libraries (`chart.js`, `echarts`, `highcharts`), rich text editors, `aws-sdk` v2, date-fns locales, PDF libraries, animation libraries, duplicated versions of React or a UI kit.
- **Move work to the server.** In the App Router, components are server components by default. Every `'use client'` at a high level pulls the whole subtree into the client bundle. Push `'use client'` down to the leaves that actually need interactivity.
- **Lazy-load what isn't needed at first paint**: modals, editors, charts, maps, admin-only screens, via `next/dynamic` (with `ssr: false` for browser-only libraries).
- **Fix imports**: named imports from ESM packages, `optimizePackageImports` in `next.config.js` for barrel-heavy libraries, replace heavy libraries with lighter ones (`dayjs` or `date-fns` instead of `moment`, native `Intl`).
- **Trim polyfills and targets**: set a modern `browserslist`, so you don't ship ES5 transforms and core-js for browsers you don't support.
- **Third-party scripts**: load analytics, chat widgets and tag managers with `next/script` `strategy="lazyOnload"` or `afterInteractive`, or move them to a web worker (Partytown).
- **Lock it in**: a size budget (`size-limit`, or a CI step that fails if first-load JS exceeds a threshold), and a bundle-diff comment on every PR.

#### Model answer
"First I'd want to know what the 5MB actually is. If it's the total `.next` output, that includes server code and every route, and isn't what users download. The number that matters is first-load JS per route, compressed. So I'd run `next build` and look at the route table, then `ANALYZE=true next build` with `@next/bundle-analyzer` to get the treemap of client chunks.

In a typical case I'd expect to find a few things. One or two giant dependencies: say `moment` with all its locales at about 300KB, a charting library pulled into the shared layout, or a rich text editor imported on every page because it lives in a shared component. Barrel imports, like `import { Icon } from 'some-icon-lib'`, pulling the whole icon set. And, with the App Router, a `'use client'` directive high up, say in the root layout or a providers wrapper, that turns half the tree into client code.

Then I'd fix them in order of size times how many routes they affect. Shared-chunk wins come first, because they hit every page. I'd push `'use client'` down to leaf components, so the layout, navigation and content render as server components with zero client JS. Heavy, below-the-fold or interaction-triggered features, like the chart, editor, map or modal, go behind `next/dynamic`. I'd replace `moment` with `dayjs` or native `Intl`, and add `optimizePackageImports` for icon and UI libraries. I'd check for duplicate packages with `npm ls` or the analyser, and dedupe them. Third-party scripts move to `next/script` with `lazyOnload`.

After each change I'd re-run the analyser and check that first-load JS actually dropped, and that LCP and INP improved in a production build on a throttled device. Finally, I'd add a `size-limit` budget in CI and a bundle-size comment on PRs, so the next person who imports a 400KB library sees it before it ships."

#### Another worked example
**An e-commerce Next.js app with 1.9MB of first-load JS on the product page (5.2MB raw).**

Findings from the analyser:

```
Shared chunk (all routes)         780 KB gz
  ├─ @mui/icons-material (barrel)  210 KB
  ├─ moment + locales              290 KB
  ├─ lodash (full)                  72 KB
  └─ Providers ('use client' root) pulls Header, Footer, MegaMenu
Product route                     1.1 MB gz
  ├─ react-image-gallery + zoom    180 KB
  ├─ Reviews editor (Draft.js)     260 KB  ← only for logged-in reviewers
  ├─ recharts (price history)      150 KB  ← below the fold
  └─ product JSON inlined in props 300 KB  ← entire catalogue variant data
```

Fixes and results:
1. `optimizePackageImports: ['@mui/icons-material', 'lodash']` and named imports: −250KB.
2. `moment` → `dayjs` with two locales: −280KB.
3. Moved `'use client'` from `Providers` to only the cart and auth context. Header, Footer and MegaMenu became server components: −120KB.
4. Reviews editor and price chart behind `next/dynamic`, loaded on click and on scroll into view: −410KB from first load.
5. Trimmed the props payload: sent only the selected variant and fetched the rest on demand: −250KB of serialised JSON (which also costs hydration time).

First-load JS went from 1.9MB to 540KB gzipped. Mobile LCP improved from 4.1s to 2.3s, and INP from 380ms to 160ms, because there was much less to parse and hydrate.

#### A third worked example
**A dashboard with a 5MB build that turned out not to be a user-facing problem.**

The team panicked about "5MB". The route table showed most of it was **admin-only routes**: a PDF report builder and a data grid with Excel export. The public routes were already at 150KB. Code splitting by route was already doing its job: no customer downloaded the admin code.

The real work was narrower: the admin data grid route was 1.4MB and slow for internal staff. We lazy-loaded the Excel export (`xlsx` is about 400KB) and the PDF library on button click, which halved it. The lesson I share in interviews: **total build size is a vanity metric; first-load JS per route is what users pay for.**

#### Step-by-step framework
1. **Clarify**: which number, which route, compressed or raw, client or server.
2. **Measure**: `next build` route table, bundle analyser treemap, DevTools Coverage, production Lighthouse on a throttled profile.
3. **Rank** findings by size × number of routes affected (shared chunks first).
4. **Server first**: push `'use client'` to leaves; keep data fetching and static markup on the server.
5. **Defer**: `next/dynamic` for below-the-fold, interaction-triggered or role-specific features.
6. **Replace and trim**: lighter libraries, named imports, `optimizePackageImports`, modern browserslist, dedupe.
7. **Third parties**: `next/script` strategies, Partytown, or remove unused tags.
8. **Payload**: smaller page props and RSC payloads; don't serialise data you don't render.
9. **Verify** with metrics (LCP, INP, TBT), not just bytes.
10. **Guard**: size budgets in CI and bundle-diff comments on PRs.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Enable minification and gzip." (Next already does) | Clarifies the metric, measures per-route first-load JS, finds the actual culprits |
| "Use code splitting." (generic) | Names specific Next tools: server components, `next/dynamic`, `optimizePackageImports` |
| Removes random packages | Ranks by size × reach; fixes shared chunks first |
| Measures only bytes | Verifies LCP/INP improvements on a throttled device |
| One-off clean-up | Adds CI budgets so it doesn't regress |

#### Useful phrases
- "Total build size isn't what users download; first-load JS per route is."
- "Shared chunks first, because they tax every page."
- "Every `'use client'` at the top of the tree is a decision to ship that whole subtree."
- "Don't load the editor until someone actually wants to edit."
- "Bytes are a proxy; LCP and INP are the outcome."

#### Common pitfalls
- Optimising **raw** size when the compressed size is what goes over the wire (but remember raw size still costs parse and execution time).
- Putting `'use client'` on a **layout or provider** and accidentally making the whole app client-rendered.
- Using `next/dynamic` for something visible at first paint, which delays it and can **hurt LCP or cause layout shift**.
- Ignoring the **props/RSC payload**: huge serialised JSON costs download and hydration time.
- Forgetting **duplicate dependencies** (two versions of a date library or UI kit).
- Fixing it once with no **budget**, so it grows back within a quarter.

#### Follow-ups to expect (with sample answers)
- **"How do you know which component pulls in a dependency?"** — "The analyser shows the chunk; then I use `npx why-is-it-here`-style tools, the webpack stats `reasons`, or simply search imports. With barrel files, `import` cost is often hidden, so I look at what the barrel re-exports."
- **"When would you use `ssr: false`?"** — "For browser-only libraries that touch `window` at import time, like some map or editor libraries. It skips server rendering for that component, so I give it a sized placeholder to avoid layout shift."
- **"Does tree-shaking not handle this?"** — "Only for ESM packages with `sideEffects: false`, and only for static imports. CommonJS packages like old `lodash` or `moment` aren't tree-shakeable, and barrels can defeat it, which is why `optimizePackageImports` exists."
- **"Pages Router or App Router — does it matter?"** — "Yes. In the App Router, server components ship zero client JS, so the biggest win is usually moving `'use client'` down. In the Pages Router everything on the page hydrates, so dynamic imports and lighter libraries matter more."
- **"How would you set the budget?"** — "Start from today's number for key routes, set it slightly under, and tighten it as we improve. Budget compressed first-load JS per route, and fail the PR with a clear message pointing to the analyser."

#### What senior interviewers look for
- Refusing to optimise the wrong number; asking which metric and route.
- **Prioritisation** by impact and reach, not a laundry list.
- Understanding the **server/client boundary** in modern Next.js as the biggest lever.
- Tying bundle work to **user metrics and business outcomes**.
- **Organisational guardrails**: budgets, PR comments, dependency review for new packages.

#### Practise it
- Run `ANALYZE=true next build` on a project you know and list the five largest modules in the shared chunk.
- Explain out loud in 90 seconds why `'use client'` placement matters.
- Write a `size-limit` config for two routes and describe what happens when a PR exceeds it.

#### Variations you might be asked
- "Our Lighthouse score is 40 on mobile. Where do you start?"
- "A designer wants a 600KB animation library. How do you respond?"
- "How do you keep bundle size under control across 15 teams in one Next.js monorepo?"

## Multi-brand site: how do you avoid shipping all 4 brand bundles to every user?
- id: c005040b-5ac6-49e1-818e-a6876975613f
- roles: frontend, fullstack, ai
- round: PERFORMANCE_OPTIMIZATION
- difficulty: hard
- levels:
- tags: performance, multi-brand, story-bank

### Prompt
You maintain one codebase that serves four brands, each with its own theme, components, copy and sometimes features. Users of one brand should only download that brand's code. How do you structure the code and the build so no user downloads the other three brands' bundles?

### Answer
#### What the interviewer is really testing
- Whether you see that **runtime brand checks** (`if (brand === 'a')`) defeat code splitting, because all branches ship.
- Knowledge of the main approaches: **build-time per-brand builds**, **module aliasing / resolution**, **dynamic imports per brand**, and **design tokens via CSS variables**.
- Understanding the trade-offs: build time, deployment, caching, developer experience, test matrix.
- Ability to **enforce** the architecture so it doesn't decay: lint rules, export parity checks, bundle analysis per brand.

#### Key points
- **The anti-pattern:** `const Header = brand === 'a' ? HeaderA : HeaderB;` with static imports. The bundler can't know which branch runs, so every user gets every brand's code.
- **Option 1: build-time brand resolution (one build per brand).** A `BRAND` environment variable at build time, plus module aliasing (`@brand/Header` resolves to `brands/a/Header` or falls back to `brands/default/Header`). Dead code never enters the bundle. Each brand is deployed separately (or to separate paths), with its own CDN cache.
- **Option 2: one build, dynamic imports per brand.** `const theme = await import('./brands/' + brand + '/theme')`: the bundler makes a chunk per brand and the user downloads only theirs. Simpler deployment, but adds a waterfall unless you preload the right chunk, and shared code must be carefully separated.
- **Option 3: themes as data, not code.** Most brand differences are colours, fonts, spacing and copy. Express them as **design tokens** (CSS custom properties) and JSON content, loaded per brand. Only genuine behavioural differences need separate components.
- **Fallback chain:** `brands/<brand>/X` → `brands/default/X`, so brands override only what differs.
- **Enforcement:** lint rule against importing from `brands/<other>` and against runtime brand conditionals in components; a CI check that every brand exports the same interface (export parity); a per-brand bundle analyser run that fails if strings or modules from another brand appear.
- **Middle ground for features:** feature flags evaluated at build time (`process.env.BRAND_FEATURES`) get dead-code eliminated; runtime flags don't.

#### Model answer
"The core problem is that anything decided at runtime ships to everyone. If a component does `brand === 'a' ? <HeaderA/> : <HeaderB/>` with static imports, the bundler has to include both. So the rule is: **brand is a build-time or load-time decision, never a render-time branch.**

My preferred structure is build-time resolution. There's a `brands/` folder: `brands/default/` holds the base implementation of every brandable module, and `brands/a/`, `brands/b/` and so on hold only the overrides. Application code imports through an alias, like `import Header from '@brand/Header'`. At build time, with `BRAND=a`, a custom resolver (a webpack `resolve.plugins` entry or a Vite `resolve.alias` function) checks `brands/a/Header` first and falls back to `brands/default/Header`. Each brand gets its own build and deployment, so brand A's bundle literally doesn't contain brand B's code.

Before writing components, though, I'd push as much as possible into **design tokens**. Colours, typography, radii and spacing become CSS custom properties in a per-brand token file, and copy goes into per-brand JSON. Often 80% of 'brand differences' are tokens, which means one shared component set plus a 5KB stylesheet per brand.

To keep it that way I'd add guardrails: an ESLint rule banning `process.env.BRAND` or brand string comparisons in components, a rule that blocks imports from `brands/<specific>` outside the resolver, an export-parity test asserting every brand override exports the same names and prop types as default, and a CI job that builds each brand and greps its output for other brands' marker strings.

The trade-offs are four builds in CI, which you parallelise and cache, and a test matrix, where you run unit tests once and smoke tests per brand. If separate deployments aren't possible, I'd do one build with `import()` per brand for the brand modules, and preload the right chunk from the server based on the hostname so there's no waterfall."

#### Another worked example
**Retail group, four brands, 1.1MB first-load JS on every brand.**

Bundle analysis showed each brand was shipping all four themes, four logo SVG sets inlined as React components, and four versions of the checkout banner. The cause was a `BrandProvider` that imported every brand's config object into a map and selected one at runtime.

Changes:

```
Before:  import a from './a'; import b from './b'; ...  const cfg = map[brand]
After:   alias @brand/config → brands/$BRAND/config (fallback brands/default)
         tokens → brands/$BRAND/tokens.css (CSS variables)
         logos  → static SVG files under /public/brands/$BRAND/
```

Results: about 310KB less JS per brand, the CSS dropped from 180KB to 60KB, and builds were run as a matrix of four parallel jobs (about the same wall-clock time). A lint rule stopped a regression two weeks later when someone added `if (brand === 'c')` inside a component.

#### A third worked example
**When one build is required.** A SaaS white-label product where customers' brands are added at runtime, with hundreds of tenants, couldn't do per-brand builds. Here the approach is **themes as data**: the server injects the tenant's token stylesheet and config JSON into the HTML, logos are image URLs, and the very few tenant-specific features are lazy chunks behind `import()` keyed by a feature name, not a tenant name. Each user downloads only shared code plus their tenant's tiny theme file.

#### Step-by-step framework
1. **Inventory differences**: tokens, copy, assets, components, features. Most are tokens.
2. **Tokens as CSS variables** and copy as JSON per brand.
3. **Override folder structure** with a default fallback.
4. **Choose resolution**: build-time alias (best) or load-time `import()` with server preload.
5. **Ban runtime brand branching** in components with lint rules.
6. **Export parity** test so overrides can't drift from the default interface.
7. **Per-brand bundle check** in CI: size budgets and "no foreign brand strings".
8. **CI and deployment**: matrix builds, cache shared work, separate CDN paths.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Use `if (brand)` and tree-shaking will remove it" | Explains why runtime conditionals defeat tree-shaking |
| Separate repos per brand | One codebase with an override folder and default fallback |
| Duplicates components for styling differences | Tokens via CSS variables; components only for behaviour |
| No enforcement | Lint rules, export parity, per-brand bundle checks |
| Ignores build and deploy cost | Matrix builds, caching, CDN per brand |

#### Useful phrases
- "Brand is a build-time decision, not a render-time branch."
- "Override only what differs; default covers the rest."
- "Most brand differences are tokens, not components."
- "If it isn't enforced in CI, it will regress."

#### Common pitfalls
- A brand **map/registry** that statically imports every brand "for convenience".
- Inline SVG logos for every brand in one component.
- **Runtime feature flags** used for brand features, so the code ships anyway.
- Overrides with **different prop signatures** from the default, causing runtime crashes in one brand only.
- Testing only the default brand; brand C breaks in production.
- Dynamic `import()` per brand without **preload**, adding a request waterfall.

#### Follow-ups to expect (with sample answers)
- **"How does tree-shaking interact with `process.env.BRAND`?"** — "If the bundler replaces `process.env.BRAND` with a literal at build time (DefinePlugin or Vite `define`), `if ('a' === 'b')` becomes dead code and is removed. That works for build-time builds but not for a single runtime build."
- **"How do you test four brands without four times the CI time?"** — "Unit tests once against default, plus override-specific tests. Per-brand visual regression on key pages and a smoke E2E per brand, in parallel."
- **"How would you add brand five?"** — "Create `brands/e/` with tokens and copy, add it to the CI matrix, and override only what differs. If the architecture is right it's a day's work, mostly design tokens."
- **"What about server-side rendering?"** — "Same rule: the server bundle per brand, or the server resolves the brand from the hostname and loads that brand's module. Inject the right token stylesheet in the HTML head to avoid a flash of the wrong theme."

#### What senior interviewers look for
- Understanding of **bundler mechanics** (static analysis, dead code elimination).
- Designing for **the long term**: guardrails, parity checks, new-brand onboarding cost.
- Balancing **performance with build and deploy complexity**.
- Reducing the problem first (tokens) before reaching for architecture.

#### Practise it
- Sketch the folder structure and resolver for three brands with a default fallback.
- Write the ESLint rule description you'd add to ban runtime brand branching.
- Explain in one minute why `brand === 'a' ? A : B` ships both components.

#### Variations you might be asked
- "How do you theme a component library for multiple products?"
- "How would you do white-labelling for hundreds of tenants?"
- "Our feature flags bloat the bundle. What do you do?"

## Scroll-heavy page drops frames. Diagnose.
- id: d06721b5-ff9e-4ca1-ae92-de4818efa038
- roles: frontend, fullstack, ai
- round: PERFORMANCE_OPTIMIZATION
- difficulty: medium
- levels:
- companies: Meta, Apple
- tags: performance, scroll, rendering

### Prompt
A long, scroll-heavy page (a feed or a product list) stutters and drops frames while scrolling, especially on mid-range phones. How do you diagnose the cause, and what fixes would you consider?

### Answer
#### What the interviewer is really testing
- Knowing the **frame budget** (about 16.7ms at 60Hz, 8.3ms at 120Hz) and the **rendering pipeline**: JavaScript → style → layout → paint → composite.
- Using the **Performance panel** properly: CPU throttling, the frames track, long tasks, layout and paint events, "Layout Shift" and "Forced reflow" warnings.
- Recognising the common causes: **scroll handlers doing work, layout thrashing, expensive paints, too many DOM nodes, non-composited animations, images decoding on the main thread, React re-rendering on scroll**.
- Matching fixes to causes: **passive listeners, `IntersectionObserver`, virtualisation, `content-visibility`, compositor-only animations, `will-change` used sparingly, image sizing and `decoding="async"`**.

#### Key points
- **Scrolling itself happens on the compositor thread** when possible, so it can stay smooth even when the main thread is busy, unless something forces the browser to wait for the main thread (non-passive `touchstart`/`wheel` listeners, `position: fixed` repaints, scroll-linked JavaScript effects).
- **Diagnose in a reproducible setup**: production build, Performance panel with **4×–6× CPU throttling**, record a scroll, look at the **Frames** track (red/dropped frames), the **Main** thread flame chart, and the **Rendering** tab (Paint flashing, Layer borders, Frame rendering stats, Scrolling performance issues).
- **Common causes and fixes:**
  - Scroll listeners that read layout (`getBoundingClientRect`, `offsetTop`) and write styles → layout thrashing. Fix: `IntersectionObserver`, batch reads before writes, `requestAnimationFrame`, passive listeners.
  - React state updated on every scroll event → whole list re-renders. Fix: don't put scroll position in state; use refs, throttle with rAF, memoise rows.
  - **Thousands of DOM nodes** → slow style, layout and paint. Fix: virtualisation (`react-window`, TanStack Virtual) or `content-visibility: auto` with `contain-intrinsic-size`.
  - **Expensive paint**: large `box-shadow`, `filter: blur`, `backdrop-filter`, big gradients, many fixed elements. Fix: simplify, use pre-rendered images, promote to own layer carefully.
  - **Animations of layout properties** (`top`, `height`, `margin`) → layout every frame. Fix: animate `transform` and `opacity` only.
  - **Images**: large unsized images decoding on scroll, causing layout shifts and decode jank. Fix: correct `srcset`/`sizes`, width/height attributes, `loading="lazy"`, `decoding="async"`.
  - **Too many layers** from `will-change` everywhere → memory pressure and slow compositing on phones.
  - Third-party scripts (ads, analytics) doing work on scroll.

#### Model answer
"First I'd reproduce it properly: a production build, on a real mid-range Android device via remote debugging if possible, or DevTools with 4× or 6× CPU throttling. I'd record a scroll in the Performance panel and look at three things: the Frames track for dropped frames, the main thread flame chart for long tasks during scroll, and the summary for where time goes: scripting, rendering (style and layout) or painting.

I'd also switch on the Rendering tab tools: **Paint flashing** to see what repaints on scroll, **Layer borders** to see layer count, and **Scrolling performance issues**, which highlights elements with non-passive listeners or that slow scrolling.

Then I'd match the evidence to a cause:
- If it's **scripting**, I'd look for scroll handlers, often a sticky header or analytics 'element in view' tracking that calls `getBoundingClientRect` on every event. I'd replace that with `IntersectionObserver`, or at least make the listener passive and do the work once per frame with `requestAnimationFrame`. In React, a common culprit is `setScrollY` in state, causing the whole page to re-render 60 times a second.
- If it's **layout or style** with purple bars and 'Forced reflow' warnings, I'd look for read-write interleaving, and for a huge DOM. A feed with 3,000 rendered cards needs virtualisation or `content-visibility: auto`.
- If it's **paint** with green bars and big paint flashing areas, I'd look for heavy box-shadows, blur filters, fixed backgrounds, or animations on non-composited properties, and change them to `transform`/`opacity`.
- If it's **image decoding**, I'd size images properly and use `decoding="async"` and lazy loading.

After each fix I'd re-record under the same throttling and compare dropped frames and main-thread time, and I'd check field INP and any scroll jank metrics from RUM."

#### Another worked example
**A news feed that stuttered after about 50 items.**

Trace findings (6× throttle):
```
Scroll frame: 48ms
  Scripting  22ms  onScroll → setState(scrollY) → Feed re-render (300 cards)
  Layout      14ms  Forced reflow: card.getBoundingClientRect() in analytics viewability
  Paint        9ms  box-shadow: 0 10px 40px on every card; position: fixed header with blur
```
Fixes:
1. Sticky header: removed `scrollY` from React state; used a sentinel element with `IntersectionObserver` to toggle a class.
2. Viewability analytics: `IntersectionObserver` with `threshold: 0.5` instead of measuring on scroll.
3. Virtualised the feed with TanStack Virtual (about 25 cards in the DOM instead of 300+).
4. Replaced the large blur shadow with a smaller one and removed `backdrop-filter` on the header on low-end devices.

Frames went from about 40% dropped to under 3%. Field INP also improved, since taps during scrolling were no longer queued behind re-renders.

#### A third worked example
**A product grid that janked only while images loaded.** The trace showed long "Image Decode" and "Layout" events whenever a new row appeared. The images were 2000px originals scaled down with CSS and had no dimensions. Fix: responsive `srcset` with correct `sizes`, explicit `width`/`height` (no layout shift), `loading="lazy"` with a generous root margin, and `decoding="async"`. Jank disappeared, and CLS dropped too.

#### Step-by-step framework
1. **Reproduce** on a realistic device or with CPU throttling, production build.
2. **Record** a scroll; check Frames, Main thread, and the scripting/rendering/painting split.
3. **Use Rendering tools**: paint flashing, layer borders, scrolling performance issues.
4. **Classify** the bottleneck: script, style/layout, paint, composite, decode.
5. **Fix by category**: observers instead of listeners, batch reads/writes, virtualise, compositor-only animations, cheaper paints, sized images.
6. **Re-measure** under identical conditions.
7. **Monitor** in the field (INP, long animation frames via the LoAF API).

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Add debounce to the scroll handler" | Asks why there's work on scroll at all; uses `IntersectionObserver` |
| "Add `will-change: transform` everywhere" | Knows layer promotion costs memory; uses it sparingly |
| Guesses | Records a throttled trace and classifies the bottleneck |
| Only thinks about JavaScript | Covers layout, paint, compositing and image decode |
| Tests on a MacBook | Tests on a mid-range phone or with 6× throttling |

#### Useful phrases
- "At 60Hz we have about 16ms per frame, and the browser needs some of that itself."
- "Let me classify it first: script, layout, paint, or composite."
- "Scroll position doesn't belong in React state."
- "Animate transform and opacity; everything else costs layout or paint."

#### Common pitfalls
- **Debouncing** a scroll handler that drives visual effects, which makes them lag and jump.
- **Non-passive** `touchstart`/`wheel` listeners that block compositor scrolling.
- `will-change` on hundreds of elements, causing memory pressure and worse performance on phones.
- Virtualisation that breaks **find-in-page, accessibility and anchor links** without mitigation.
- Measuring only on a fast laptop where everything looks fine.

#### Follow-ups to expect (with sample answers)
- **"Virtualisation or `content-visibility`?"** — "`content-visibility: auto` is simpler and keeps the DOM intact for find-in-page and accessibility, but still has all the nodes in memory. For tens of thousands of items, virtualisation; for a few hundred heavy sections, `content-visibility`."
- **"What is layout thrashing?"** — "Interleaving DOM reads that need fresh layout (like `offsetHeight`) with writes that invalidate it, in a loop. Each read forces a synchronous layout. Fix by doing all reads, then all writes, or by using rAF and libraries like fastdom."
- **"How would you detect this in production?"** — "The Long Animation Frames API and INP attribution via the `web-vitals` library, sent to RUM, broken down by page and device class."
- **"What does `passive: true` do?"** — "It tells the browser the listener won't call `preventDefault`, so it can scroll on the compositor without waiting for the JavaScript."

#### What senior interviewers look for
- A clear mental model of the **rendering pipeline** and threads.
- **Evidence-driven** debugging with the right tools.
- Knowing the **costs of fixes** (layers, virtualisation and accessibility).
- Making it stick: field monitoring and performance tests for key pages.

#### Practise it
- Record a scroll on a long page with 6× throttling and name the biggest category of work.
- Turn on paint flashing on a site you use and find one expensive repaint.
- Rewrite a scroll-based "is visible" check using `IntersectionObserver`.

#### Variations you might be asked
- "An infinite scroll gets slower the longer you scroll. Why?"
- "A parallax effect is janky. How do you fix it?"
- "Why does a sticky header cause jank?"

## A page has high CLS. Most common cause?
- id: 370b7e40-5324-4e3a-a1c6-c42ee9d86955
- roles: frontend, fullstack, ai
- round: PERFORMANCE_OPTIMIZATION
- difficulty: easy
- levels:
- companies: Stripe
- tags: performance, CLS

### Prompt
A page has a high Cumulative Layout Shift (CLS) score. What's the most common cause, what other causes would you check, how do you find which elements are shifting, and how do you fix it?

### Answer
#### What the interviewer is really testing
- A quick, correct answer: **images, videos, iframes and embeds without reserved dimensions** are the most common cause.
- Knowing the **other causes**: late-injected content (ads, banners, cookie notices), web fonts swapping, content inserted above existing content, animations of layout properties, client-side rendering replacing a skeleton of the wrong size.
- How CLS is **calculated** (impact fraction × distance fraction, session windows) and the **0.1 / 0.25** thresholds.
- How to **find** the shifting elements: DevTools Performance panel "Layout shifts" track, Layout Shift Regions, the `web-vitals` attribution build in the field.
- Practical fixes: **`width`/`height` attributes or `aspect-ratio`, reserved slots, `font-display` and `size-adjust`, transforms for animations, inserting content below the viewport or on user action**.

#### Key points
- **Most common cause:** media without dimensions. The browser lays out the text, the image arrives, and everything below jumps. Fix: `width` and `height` attributes (modern browsers derive aspect ratio from them) or CSS `aspect-ratio`.
- **Other causes:**
  - Ads, embeds and iframes with no reserved space.
  - Dynamically injected content: cookie banners, promo bars, "app download" banners, consent dialogs pushing content down.
  - **Web fonts** swapping with different metrics (FOUT). Fix with `font-display: optional` or metric-matched fallbacks (`size-adjust`, `ascent-override`; `next/font` does this automatically).
  - Client-rendered content replacing a skeleton or placeholder of a different height.
  - Animating `top`, `height` or `margin` instead of `transform`.
  - Late-loading CSS that restyles content (e.g. a CSS file loaded asynchronously).
- **How it's scored:** each unexpected shift scores impact fraction × distance fraction. Shifts are grouped into **session windows** (shifts less than 1 second apart, window max 5 seconds); CLS is the **largest window**. Shifts within **500ms of user input** are excluded (expected).
- **Thresholds:** good ≤ 0.1, poor > 0.25, at the 75th percentile.
- **Lab vs field:** Lighthouse only measures shifts during load; real users also see shifts after scrolling and interacting (e.g. lazy-loaded ads), so field CLS is often worse.

#### Model answer
"The most common cause is images, video or embeds without reserved space. The browser doesn't know how tall an image is until it downloads it, so it lays out the text at zero height, then the image arrives and everything below it jumps. The fix is to set `width` and `height` attributes on the `img` tag, which browsers now use to calculate the aspect ratio before the image loads, or use CSS `aspect-ratio` for responsive containers.

After that, I'd check the other usual causes: ads and third-party embeds injected without a reserved slot; banners like cookie notices or promo bars inserted at the top of the page; web fonts swapping with different metrics; client-side components that replace a skeleton of the wrong height; and animations of layout properties.

To find the actual culprit, I'd look at field data first, since Lighthouse only sees load-time shifts. The `web-vitals` library's attribution build reports `largestShiftTarget`, the selector of the element that moved most, and when it happened, so I know whether it's during load or after interaction. In the lab I'd use the DevTools Performance panel: the Layout Shifts track shows each shift and highlights the moved nodes, and the Rendering tab's 'Layout Shift Regions' flashes them live.

Fixes match causes: dimensions or `aspect-ratio` for media; fixed-size slots with `min-height` for ads and embeds, even if they end up empty; overlays instead of pushing content for banners, or reserving space in the server HTML; `font-display: optional` or fallback fonts with `size-adjust` so the swap doesn't reflow; skeletons with the same dimensions as the real content; and `transform` for animations. Then I'd confirm in the field that p75 CLS drops below 0.1."

#### Another worked example
**A news article page with field CLS of 0.38.**

The `web-vitals` attribution data showed three main targets:
```
largestShiftTarget              share of poor sessions
div.ad-slot-top                 48%   (ad injected ~2s after load, 250px tall)
article img.hero                27%   (no width/height; CMS strips attributes)
body > div.cookie-banner        15%   (inserted at top, pushes everything)
```
Fixes:
1. Reserved `min-height: 250px` for the top ad slot (with a subtle "Advertisement" label when unfilled).
2. Changed the CMS image component to output `width`/`height` from the asset metadata, and added `aspect-ratio` CSS for responsive crops.
3. Made the cookie banner a fixed overlay at the bottom (overlays don't shift layout).

Field CLS dropped from 0.38 to 0.06 within the 28-day CrUX window. The ad team was initially worried about the reserved space when ads didn't fill, but viewability actually went up, because users weren't scrolling past ads that jumped in.

#### A third worked example
**A React SPA with CLS only after navigation.** Lighthouse showed 0.02, but RUM showed 0.21. The problem was a product list that rendered a 3-row skeleton and then 12 rows of real data, plus a "Recommended for you" carousel inserted above the list after an API call. Fixes: skeleton sized to the expected page size, carousel slot reserved with a fixed height, and data fetched in parallel so content arrived together. Lesson: **soft navigations and post-load content** need field measurement.

#### Step-by-step framework
1. **Confirm** with field data (CrUX/RUM); note page types and devices.
2. **Attribute**: `web-vitals` attribution for the shifting element and timing; DevTools Layout Shifts track; Layout Shift Regions.
3. **Classify**: media dimensions, injected content, fonts, skeleton mismatch, animations, late CSS.
4. **Fix**: reserve space, use overlays, match font metrics, size skeletons, animate transforms.
5. **Verify** in the lab, then watch the field p75 over the next weeks.
6. **Prevent**: lint or component rules (an `Image` component that requires dimensions), visual tests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Slow loading" | Names missing image dimensions as the most common cause |
| Only checks Lighthouse | Uses field attribution, since post-load shifts matter |
| Hides content until everything loads | Reserves space so content can render progressively |
| Doesn't know the scoring | Explains session windows and the 500ms input exclusion |
| Fixes one page | Fixes the shared component and adds guardrails |

#### Useful phrases
- "The browser can't reserve space it doesn't know about."
- "Overlay, don't push."
- "Lighthouse only sees load; users see the whole session."
- "Shifts within 500ms of a user's input don't count, because they're expected."

#### Common pitfalls
- Setting `width: 100%` in CSS but leaving out the `width`/`height` attributes, losing the aspect ratio hint.
- Using `loading="lazy"` on images without dimensions, which makes shifts happen during scroll.
- Fixing the lab score and **ignoring field data**.
- Reserving space only at one breakpoint.
- `font-display: swap` with a very differently sized fallback.

#### Follow-ups to expect (with sample answers)
- **"How is a layout shift score calculated?"** — "Impact fraction (the share of the viewport affected by the moving elements, before and after) multiplied by the distance fraction (the largest move as a share of the viewport's biggest dimension)."
- **"Does a transform animation cause CLS?"** — "No. Transforms don't change layout, so they're not counted."
- **"What if the ad slot size is unknown?"** — "Reserve the most common size, or the smallest, and let it expand below the fold. Or collapse it after a timeout only if it's below the viewport."
- **"How do fonts cause CLS?"** — "The fallback font has different metrics, so text reflows when the web font arrives. `size-adjust` and the ascent/descent overrides make the fallback match closely."

#### What senior interviewers look for
- A crisp answer first, then breadth.
- **Field-first** thinking and attribution.
- Fixing at the **system level** (shared image component, ad slot component).
- Working with other teams, such as ads and marketing, on trade-offs.

#### Practise it
- Turn on Layout Shift Regions and browse a news site; name each cause you see.
- Add the `web-vitals` attribution build to a demo and log `largestShiftTarget`.
- Explain the CLS formula in 30 seconds.

#### Variations you might be asked
- "Our CLS is fine in Lighthouse but poor in Search Console. Why?"
- "How do you build skeleton screens that don't cause shifts?"
- "How do you handle fonts without hurting LCP or CLS?"
