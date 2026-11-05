# Full Stack Engineer — Auth & Security

## Sessions vs tokens: designing auth for a web app
- id: fs-sec-01
- round: SECURITY
- difficulty: medium
- levels:
- tags: authentication, sessions, JWT, cookies, refresh tokens, revocation

### Prompt
You're designing authentication for a web app with a React frontend and an API (and a mobile app coming later). Would you use server-side sessions or tokens (JWTs)? Walk through the design, including where the credential lives in the browser, expiry, refresh and logout.

### Answer
#### What the interviewer is really testing
- Understanding the real difference: **stateful sessions** (server looks up an opaque id) vs **stateless tokens** (server verifies a signature).
- **Revocation and expiry** trade-offs, the main weakness of stateless tokens.
- **Browser storage security**: HttpOnly cookies vs `localStorage`, XSS and CSRF exposure.
- Designing for **multiple clients** (web and mobile) without weakening the web.
- Avoiding cargo-cult answers like "JWTs are modern, sessions are old".

#### Key points
- **Server-side sessions**: random opaque id in an `HttpOnly; Secure; SameSite=Lax` cookie; the session record (user, expiry, metadata) lives in a database/Redis. Instant revocation, simple, small cookies. Costs a lookup per request (cheap with Redis or caching).
- **JWT access tokens**: signed claims verified without a lookup. Good for service-to-service and for APIs with many clients. Can't be revoked before expiry without a denylist, so keep them **short-lived (5–15 minutes)** and pair them with **refresh tokens** stored server-side (rotated on use, revocable).
- **Browser storage**: tokens in `localStorage` are readable by any XSS. HttpOnly cookies can't be read by JS; they need **CSRF protection** (SameSite + origin checks or tokens).
- **Mobile apps** can't use cookies as naturally: give them access + refresh tokens stored in the OS keychain/keystore.
- **BFF pattern**: the web app talks to its own backend with a session cookie; the backend holds any upstream tokens. Best of both.
- Logout must **revoke server-side state** (session or refresh token), not just delete a client copy.

#### Model answer
"For the web app I'd use **server-side sessions in HttpOnly cookies**, and for the mobile app **short-lived access tokens with rotating refresh tokens**, both backed by the same session store so revocation works everywhere.

**Why sessions for the web.**
- The cookie is `HttpOnly`, so XSS can't steal it (it can still act as the user while the page is open, but can't exfiltrate a long-lived credential).
- **Revocation is instant**: delete the session row and the user is logged out, which matters for 'log out all devices', password changes and admin deactivation.
- No token parsing or key rotation on the client.
- The lookup cost is negligible: a Redis `GET` or an indexed primary-key query, cacheable for a few seconds if needed.

**Web design.**
```
POST /auth/login → Set-Cookie: sid=<random 256-bit>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
sessions(id_hash, user_id, created_at, last_seen_at, expires_at, ip, user_agent, mfa_verified)
```
- Store a **hash** of the session id so a database leak doesn't expose live sessions.
- **Sliding expiry**: extend `expires_at` on activity (at most once per hour to limit writes), with an absolute maximum (e.g. 30 days) and an idle timeout for sensitive apps.
- **Rotate the session id on login and privilege change** (session fixation).
- **CSRF**: `SameSite=Lax` blocks cross-site POSTs in modern browsers; I'd also verify the `Origin` header on state-changing requests (or use a CSRF token) as defence in depth.
- The React app calls `fetch('/api/...', { credentials: 'include' })`; it never touches the credential. Same-site API (`app.example.com` → `api.example.com`) keeps cookies working.

**Mobile design.**
```
POST /auth/token (password or OAuth code) → { access_token (JWT, 10 min), refresh_token (opaque, 60 days) }
refresh_tokens(id_hash, session_id, user_id, family_id, expires_at, used_at, revoked_at)
```
- Access tokens are JWTs signed with an asymmetric key (`RS256`/`ES256`), containing `sub`, `sid` (session id), `exp`, scopes. APIs verify them locally.
- **Refresh token rotation**: each refresh returns a new refresh token and marks the old one used. If a used token is presented again, that indicates theft: revoke the whole token family and force re-login.
- Stored in the iOS Keychain / Android Keystore.
- Because the access token carries `sid`, revoking the session stops refreshes immediately and access within 10 minutes. For high-risk actions, the API checks the session is still active.

**Logout.** Web: delete the session row, clear the cookie. Mobile: revoke the refresh token family. 'Log out everywhere' deletes all of the user's sessions.

**What I'd avoid.** Long-lived JWTs in `localStorage` for the web app. They're readable by any injected script, can't be revoked, and refreshing them securely in the browser is awkward. If the team insists on JWTs for the web, I'd keep them in HttpOnly cookies and short-lived, which mostly recreates sessions anyway."

#### Another worked example: the BFF approach with a third-party identity provider
"With Auth0/Okta/Entra ID as the identity provider, the OIDC flow returns ID, access and refresh tokens. Instead of handing those to the browser, a **backend-for-frontend** completes the OAuth code exchange server-side, stores the tokens in its session store, and gives the browser only an HttpOnly session cookie. When the React app calls `/api/orders`, the BFF attaches the upstream access token to the downstream API request and refreshes it when it expires. The browser never holds a bearer token, which is now the recommended pattern for browser-based apps in the OAuth security guidance."

#### Step-by-step framework
1. **Identify clients** (web, mobile, third parties, services).
2. **Web**: opaque session id in an HttpOnly, Secure, SameSite cookie; hashed server-side record.
3. **Expiry**: sliding + absolute + idle; rotate on login/privilege change.
4. **CSRF**: SameSite + Origin checks/tokens.
5. **Mobile/API**: short JWT access + rotating refresh tokens bound to a session.
6. **Revocation**: one session store controls both.
7. **Logout and 'log out everywhere'**.
8. **Monitoring**: active sessions page, suspicious login alerts.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "JWTs, because they're stateless and modern" | Chooses per client; explains revocation trade-off |
| Token in `localStorage` | HttpOnly cookie for the web |
| 30-day JWTs | Short access tokens + rotating refresh tokens |
| Logout clears client storage only | Server-side revocation |
| Ignores CSRF when using cookies | SameSite + Origin checks/tokens |
| Same session id before and after login | Rotates the session id |

#### Useful phrases
- "The real question is whether we need instant revocation, and for user logins we usually do."
- "For the browser I want the credential where JavaScript can't read it."
- "Access tokens are short-lived; refresh tokens are server-side, rotated and revocable."
- "Both web sessions and mobile tokens hang off the same session record."
- "Logout means revoking state on the server."

#### Common pitfalls
- **JWTs without expiry** or with `alg: none` / weak HMAC secrets.
- **Putting sensitive data in JWT payloads** (they're only base64-encoded, not encrypted).
- **Refresh tokens in `localStorage`**, which is worse than access tokens there.
- **No CSRF protection** on cookie-authenticated APIs.
- **No session listing**, so users can't see or revoke devices.

#### Follow-ups to expect (with sample answers)
- **"Doesn't a session lookup on every request hurt performance?"**
  "It's a sub-millisecond Redis or primary-key lookup. If it ever matters, cache the session for a few seconds in-process, accepting a short revocation delay."
- **"How do you handle sessions across subdomains?"**
  "Set the cookie for the parent domain only if needed (`Domain=example.com`), or better, keep the API on the same host behind a path proxy to avoid broadening cookie scope."
- **"What's token binding / DPoP?"**
  "Techniques that tie a token to a client key so a stolen token can't be replayed from elsewhere. Useful for high-security APIs; not usually needed for a typical web app with HttpOnly cookies."
- **"How would you implement 'remember me'?"**
  "A longer absolute expiry for that session (e.g. 30 days vs 12 hours), still revocable, and re-authentication for sensitive actions."

#### What senior interviewers look for
- **Threat-driven reasoning** (XSS, CSRF, theft, revocation).
- **Multi-client design** without compromising the web.
- Awareness of **current OAuth guidance** (BFF, rotation).
- Practical details: hashing session ids, rotation, sliding expiry.

#### Practise it
1. Implement session auth with hashed session ids and a 'log out everywhere' button.
2. Implement refresh token rotation with reuse detection and write a test that replaying an old refresh token revokes the family.
3. Inspect your app's cookies in DevTools and confirm the flags.
4. Explain to a friend why `localStorage` is a poor place for tokens.

## OAuth 2.0 / OIDC login with Google: the full flow
- id: fs-sec-02
- round: SECURITY
- difficulty: medium
- levels:
- tags: OAuth 2.0, OpenID Connect, PKCE, social login, account linking

### Prompt
Implement "Sign in with Google" for your web app. Walk through the full OAuth 2.0 / OpenID Connect flow, what your backend must verify, how you link accounts with existing email/password users, and the common security mistakes.

### Answer
#### What the interviewer is really testing
- Knowing the **authorization code flow with PKCE** and why the implicit flow is obsolete.
- The difference between **OAuth (authorisation)** and **OIDC (authentication via the ID token)**.
- What must be **verified**: `state`, PKCE verifier, ID token signature, `iss`, `aud`, `exp`, `nonce`, `email_verified`.
- **Account linking** without enabling account takeover.
- Where tokens are stored and whether you need Google's access token at all.

#### Key points
- **Flow**: redirect to Google's authorization endpoint with `client_id`, `redirect_uri`, `response_type=code`, `scope=openid email profile`, `state`, `nonce`, `code_challenge` (PKCE) → user consents → Google redirects back with `code` and `state` → backend exchanges `code` + `code_verifier` (+ client secret for confidential clients) for tokens → verify the **ID token** → find or create the user → create your own session.
- **`state`**: random value tied to the user's browser (cookie) to prevent CSRF on the callback; **`nonce`**: ties the ID token to this login attempt (replay protection); **PKCE**: prevents stolen authorization codes being redeemed.
- **Verify the ID token**: signature against Google's JWKS, `iss` = `https://accounts.google.com`, `aud` = your client id, `exp` not passed, `nonce` matches, `email_verified` true.
- Identify users by the provider's **`sub`** (stable subject id), not by email alone. Store `(provider, sub)` in an `identities` table.
- **Account linking**: only auto-link to an existing account by email if the provider asserts the email is **verified** and your existing account's email is verified too; otherwise ask the user to sign in with their existing method first.
- After login, issue **your own session**. Discard Google tokens unless you need to call Google APIs (then store the refresh token encrypted, server-side).

#### Model answer
"I'd implement the **authorization code flow with PKCE**, handled entirely by the backend, ending in my own session cookie.

**Data model.**
```sql
users(id, email citext unique, email_verified_at, name, avatar_url, password_hash null)
identities(user_id, provider text, provider_sub text, email, created_at,
           primary key (provider, provider_sub))
```

**Step 1: start login** (`GET /auth/google`):
```ts
const state = randomToken(); const nonce = randomToken();
const verifier = randomToken(64); const challenge = base64url(sha256(verifier));
setTempCookie(res, 'oauth', sign({ state, nonce, verifier, next: safeNext(req.query.next) }), { maxAge: 600 });
res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: GOOGLE_CLIENT_ID, redirect_uri: `${ORIGIN}/auth/google/callback`,
  response_type: 'code', scope: 'openid email profile',
  state, nonce, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account',
}));
```
The temporary cookie is HttpOnly, signed, and `SameSite=Lax` (it must survive the top-level redirect back from Google).

**Step 2: callback** (`GET /auth/google/callback?code=…&state=…`):
```ts
const tmp = verifySigned(req.cookies.oauth);
if (!tmp || req.query.state !== tmp.state) return res.status(400).send('Invalid state');
const tokens = await exchangeCode({ code: req.query.code, code_verifier: tmp.verifier,
                                    client_id, client_secret, redirect_uri });
const claims = await verifyIdToken(tokens.id_token, {          // JWKS signature check
  issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: GOOGLE_CLIENT_ID });
if (claims.nonce !== tmp.nonce) return res.status(400).send('Invalid nonce');
```

**Step 3: find, link or create the user.**
```ts
let identity = await db.identities.find('google', claims.sub);
let user;
if (identity) user = await db.users.get(identity.user_id);
else {
  const existing = await db.users.findByEmail(claims.email);
  if (existing) {
    if (!claims.email_verified || !existing.email_verified_at)
      return redirectTo(res, '/login?error=link_required');   // sign in with password first, then link
    user = existing;
  } else {
    user = await db.users.insert({ email: claims.email, email_verified_at: claims.email_verified ? new Date() : null,
                                   name: claims.name, avatar_url: claims.picture });
  }
  await db.identities.insert({ user_id: user.id, provider: 'google', provider_sub: claims.sub, email: claims.email });
}
await startSession(res, user.id, req);       // our own HttpOnly session cookie, new id
clearCookie(res, 'oauth');
res.redirect(tmp.next ?? '/app');
```

**Why each check matters:**
- `state`: without it, an attacker could make your browser complete *their* login (login CSRF), so you'd be signed into the attacker's account.
- PKCE: if an authorization code leaks (logs, referrer, malicious extension), it's useless without the verifier.
- `aud`: an ID token issued to another app must not log users into ours.
- `nonce`: prevents replaying an old ID token.
- `email_verified` + linking rules: prevents someone creating an account at an identity provider with *your* unverified email and taking over your account.
- `safeNext`: only same-origin relative paths, preventing open redirects.

**Tokens.** I only need identity, so I discard Google's access token. If the product needed Google Calendar access, I'd request those scopes separately (incremental consent), store the refresh token encrypted server-side, and never send it to the browser.

**In practice** I'd use a well-maintained library (Auth.js, `openid-client`, Passport strategies) or an auth provider, but I'd still verify that it performs these checks."

#### Another worked example: a single-page app without a backend session
"For a pure SPA talking directly to an API, the SPA itself runs the code + PKCE flow (no client secret, since public clients can't keep one). Tokens end up in the browser, so I'd keep access tokens in memory only, use short lifetimes, and rely on refresh token rotation (or silent re-auth). Given XSS risk, current guidance prefers putting a thin BFF in front so tokens stay server-side; I'd recommend that unless there's a strong reason not to."

#### Step-by-step framework
1. **Authorization code + PKCE**, `state` and `nonce`, stored in a short-lived signed cookie.
2. **Exchange code** server-side.
3. **Verify the ID token** fully.
4. **Identify by `(provider, sub)`**.
5. **Link safely** using verified emails only.
6. **Create your own session**; discard or securely store provider tokens.
7. **Redirect safely** to a validated `next` path.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Implicit flow, token in the URL fragment | Code flow with PKCE |
| Decodes the ID token without verifying | Verifies signature, iss, aud, exp, nonce |
| Matches users by email only | Identities by provider `sub`; careful email linking |
| Auto-links unverified emails | Requires verified emails or explicit linking |
| Stores Google tokens in localStorage | Own session cookie; provider tokens server-side if needed |
| `redirect(req.query.next)` | Validated same-origin redirect |

#### Useful phrases
- "OAuth gives us an authorisation code; OIDC's ID token tells us who the user is."
- "State prevents login CSRF; PKCE makes stolen codes useless; nonce stops replays."
- "Users are identified by the provider's subject id, not their email."
- "I only auto-link accounts when both sides have verified the email."
- "After the callback we issue our own session; Google's tokens aren't needed for login."

#### Common pitfalls
- **Skipping `state`** (login CSRF).
- **Trusting unverified ID tokens** or the wrong audience.
- **Email-based account takeover** via unverified emails.
- **Open redirects** through the `next` parameter.
- **Requesting broad scopes** up front, scaring users at consent.

#### Follow-ups to expect (with sample answers)
- **"What happens if the user changes their Google email?"**
  "Nothing breaks, because we link on `sub`. We might update the stored email on the identity and offer to update the account email."
- **"How do you add Apple or GitHub later?"**
  "Same `identities` table and flow. Note quirks: Apple may hide the email (relay addresses) and only sends the name on first login; GitHub isn't OIDC, so we call its user API and check verified emails."
- **"How do you let users unlink Google?"**
  "Only if they have another way to sign in (password or another identity), otherwise they'd be locked out."
- **"Where does the client secret live?"**
  "Server-side configuration from a secrets manager, never in frontend code."

#### What senior interviewers look for
- **Every verification step explained**, not just "use a library".
- **Account linking** handled securely.
- **Token minimisation**: don't keep what you don't need.
- Awareness of **provider quirks** and current guidance.

#### Practise it
1. Implement Google login with `openid-client` (or similar) and log each verification step.
2. Try tampering with `state` and the ID token audience to see the failures.
3. Write tests for linking: verified email, unverified email, existing identity.
4. Explain to a friend what login CSRF is and how `state` prevents it.

## Passwordless and passkeys (WebAuthn)
- id: fs-sec-03
- round: SECURITY
- difficulty: medium
- levels:
- tags: passkeys, WebAuthn, FIDO2, magic links, passwordless, MFA

### Prompt
Product wants to reduce password problems. Compare magic links, one-time codes and passkeys (WebAuthn). How would you implement passkeys in a web app, and how would you handle account recovery?

### Answer
#### What the interviewer is really testing
- Understanding **why passwords fail** (reuse, phishing, breaches) and what each alternative fixes.
- How **WebAuthn/passkeys** work: public-key credentials bound to the site's origin (phishing-resistant).
- The **registration and authentication ceremonies**, challenges, and what the server stores.
- **UX realities**: device sync (iCloud Keychain, Google Password Manager), cross-device sign-in, fallback methods.
- **Account recovery** without undermining security.

#### Key points
- **Magic links**: email a single-use, short-lived link. No password to remember; security equals email account security; friction of switching apps; can be phished less easily but links can be forwarded.
- **One-time codes** (email/SMS): similar; SMS is weak (SIM swap). Codes are phishable (users type them into fake sites).
- **Passkeys**: a key pair per site; the private key stays on the device or the platform's synced keychain; the server stores only the **public key**. Sign-in signs a **server challenge**, and the browser scopes credentials to the **relying party ID** (domain), so a fake site can't use them: **phishing-resistant**.
- Ceremonies: **registration** (`navigator.credentials.create`) and **authentication** (`navigator.credentials.get`), each with a server-generated **challenge** verified afterwards.
- Store per credential: credential id, public key, sign counter, transports, created/last used, a user-friendly name.
- Support **conditional UI** (passkey suggestions in the username field's autofill) and **multiple passkeys** per account.
- **Recovery**: verified email + extra checks, recovery codes, or another registered passkey; recovery is the weakest link, so rate-limit it and notify the user.

#### Model answer
"Passwords fail because people reuse them and type them into phishing sites. Magic links and codes remove reuse but are only as strong as the email/phone and remain phishable. **Passkeys** fix both: there's no shared secret, and the browser will only use a credential on the domain it was created for.

**My recommended setup:** passkeys as the primary sign-in, email magic link as a fallback (and for first sign-up), recovery codes for emergencies. I'd use a maintained library (SimpleWebAuthn) for parsing and verification.

**Data.**
```sql
webauthn_credentials(id bytea pk, user_id, public_key bytea, sign_count bigint,
                     transports text[], device_type, backed_up bool,
                     name text, created_at, last_used_at)
webauthn_challenges(user_id or session_id, challenge, type, expires_at)
```

**Registration** (user is signed in, e.g. right after a magic-link login):
```ts
// server
const options = await generateRegistrationOptions({
  rpName: 'Acme', rpID: 'acme.com', userID: user.idBytes, userName: user.email,
  excludeCredentials: existing.map(c => ({ id: c.id, transports: c.transports })),
  authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
});
await saveChallenge(user.id, options.challenge, 'register');
// client
const attestation = await startRegistration({ optionsJSON: options });   // OS prompt: Face ID etc.
await api.post('/webauthn/register/verify', attestation);
// server
const v = await verifyRegistrationResponse({ response: body, expectedChallenge,
                                             expectedOrigin: 'https://acme.com', expectedRPID: 'acme.com' });
if (v.verified) save credential (id, publicKey, counter, transports, backedUp)
```
`residentKey: 'required'` creates a **discoverable credential**, so the user can sign in without typing a username.

**Authentication.**
```ts
// server: generateAuthenticationOptions({ rpID, userVerification: 'preferred' }) → save challenge in a temp cookie/session
// client (with conditional UI):
const assertion = await startAuthentication({ optionsJSON, useBrowserAutofill: true });
// server
const cred = await db.credentials.get(assertion.id);
const v = await verifyAuthenticationResponse({ response: assertion, expectedChallenge, expectedOrigin, expectedRPID,
                                               credential: { id: cred.id, publicKey: cred.public_key, counter: cred.sign_count } });
if (v.verified) { update sign_count + last_used_at; startSession(cred.user_id) }
```
- Challenges are random, single-use and expire after a few minutes.
- With **conditional UI**, the email field shows 'Sign in with a passkey' in autofill: one tap.
- **Cross-device**: on a desktop without a passkey, the browser offers a QR code to use a phone's passkey (hybrid transport), handled by the browser.

**Account settings.** List passkeys with names ('MacBook — iCloud Keychain'), last used dates, rename/remove buttons; require recent authentication to add or remove one; prevent removing the last sign-in method.

**Recovery.** If someone loses all devices (rare with synced passkeys), options in order of strength: another passkey or a security key; **recovery codes** generated at setup (stored hashed); email-based recovery with a delay and notifications ('Someone requested access recovery; if this wasn't you, cancel within 24 hours'). Recovery events are rate-limited and logged, and sensitive actions may require re-verification for a few days afterwards."

#### Another worked example: rolling passkeys out to an existing password user base
"I wouldn't force a switch. Steps: (1) after a successful password login, offer 'Sign in faster next time with a passkey' (one tap to create); (2) enable conditional UI on the login page so returning users with passkeys skip the password; (3) measure adoption and sign-in success rate; (4) for users with passkeys, offer to remove their password; (5) eventually make passkeys the default for new sign-ups with magic link as fallback. Support and recovery flows are updated before step 4, because that's where accounts get locked out."

#### Step-by-step framework
1. **Compare options** against threats (reuse, phishing, SIM swap).
2. **Choose a primary and fallback** method.
3. **Registration ceremony** with server challenges; store public keys.
4. **Authentication ceremony** with conditional UI and counter checks.
5. **Management UI**: list, name, revoke; protect last method.
6. **Recovery**: codes, alternate credentials, delayed email recovery with notifications.
7. **Rollout and metrics**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Passkeys are like a password stored in the browser" | Public-key credentials bound to the origin; server stores only public keys |
| SMS codes as strong MFA | Notes SIM swap and phishing; prefers passkeys |
| No challenge verification details | Single-use, expiring server challenges |
| Forces all users to switch at once | Gradual rollout with conditional UI |
| Recovery via a simple email link with no checks | Recovery codes, delays, notifications, rate limits |
| One passkey per account | Multiple named passkeys, management UI |

#### Useful phrases
- "Passkeys are phishing-resistant because the browser binds them to our domain."
- "The server only stores a public key, so a database breach leaks nothing usable."
- "Recovery is the weakest link, so it's slower, rate-limited and noisy by design."
- "Conditional UI makes passkeys a one-tap sign-in from the username field."
- "We'd roll out gradually and measure sign-in success."

#### Common pitfalls
- **Wrong `rpID`/origin configuration** across subdomains or environments.
- **Reusing challenges** or not expiring them.
- **Locking users out** by allowing removal of the last method.
- **Weak recovery** that bypasses all the strength of passkeys.
- **Ignoring browsers/devices** without passkey support (keep a fallback).

#### Follow-ups to expect (with sample answers)
- **"What does the sign counter do?"**
  "Detects cloned authenticators for hardware keys: the counter should increase. Synced passkeys often report 0, so treat it as a signal, not a hard rule."
- **"Should passkeys replace MFA?"**
  "A passkey with user verification (biometric or PIN) is already multi-factor (possession + inherence/knowledge), so it can satisfy MFA requirements."
- **"How do magic links work securely?"**
  "Random single-use token stored hashed, 10–15 minute expiry, bound to the requesting browser where possible (or show a code to compare), invalidated after use, and rate-limited sending."
- **"What about enterprise customers?"**
  "They'll usually use SSO via their identity provider, which may itself enforce passkeys or hardware keys."

#### What senior interviewers look for
- **Threat-model-driven** comparison.
- Real understanding of **WebAuthn mechanics**.
- **Recovery and rollout** planned as carefully as the happy path.
- Respect for **UX** and adoption.

#### Practise it
1. Implement passkey registration and login with SimpleWebAuthn on localhost.
2. Add conditional UI to the login form and test on Safari and Chrome.
3. Design the account recovery flow and write down its abuse cases.
4. Explain to a friend why passkeys can't be phished.

## Row-level security and multi-tenant data isolation
- id: fs-sec-04
- round: SECURITY
- difficulty: hard
- levels:
- tags: row-level security, Postgres, multi-tenancy, Supabase, authorisation, data isolation

### Prompt
Your SaaS stores every customer's data in one Postgres database. How do you guarantee one tenant can never read or modify another tenant's data? Explain application-level scoping, Postgres row-level security, and how this works with tools like Supabase where the browser talks to the database API directly.

### Answer
#### What the interviewer is really testing
- Understanding **defence in depth**: application checks + database-enforced policies.
- How **Postgres RLS** works: policies, `USING` vs `WITH CHECK`, session context, roles, `BYPASSRLS`.
- The special case of **client-direct database access** (Supabase/PostgREST) where RLS is the *only* barrier.
- **Performance** implications and indexing for policies.
- **Testing** isolation and avoiding common holes (views, functions, service keys, caches).

#### Key points
- **App-level scoping**: every query includes `tenant_id` from the authenticated context, ideally enforced by a repository layer or ORM middleware. Necessary but easy to forget once.
- **RLS**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` plus policies; Postgres adds the policy predicate to every query for roles without `BYPASSRLS`. Table owners bypass RLS unless `FORCE ROW LEVEL SECURITY`.
- **`USING`** filters rows you can see/update/delete; **`WITH CHECK`** validates rows you insert/update (prevents writing rows into another tenant).
- Passing identity: `SET LOCAL app.tenant_id = '…'` per transaction (with a pooled connection, always `SET LOCAL` inside a transaction), or JWT claims (`auth.uid()`, `auth.jwt()` in Supabase).
- **Supabase/PostgREST**: the browser sends a user JWT; the database runs as the `authenticated` role; **RLS policies are the security model**. The **service role key bypasses RLS** and must never reach the client.
- Watch **security definer functions, views** (use `security_invoker` views in Postgres 15+), **materialised views** (no RLS), and storage buckets (separate policies).
- **Index** the columns used in policies (`tenant_id`, membership lookups); wrap `auth.uid()` in a subselect so it's evaluated once.

#### Model answer
"I'd enforce isolation in two independent layers so a single bug can't leak data: **application scoping** and **Postgres row-level security**.

**1. Application scoping.** The tenant id comes from the authenticated membership, never from the request body or URL alone. Data access goes through a repository that requires a context:
```ts
const repo = forTenant(ctx);          // ctx = { userId, tenantId } from the session
await repo.projects.list();           // always adds WHERE tenant_id = ctx.tenantId
```

**2. RLS as the safety net (server-side API).**
```sql
alter table projects enable row level security;
alter table projects force row level security;            -- applies to the owner too

create policy tenant_isolation on projects
  using (tenant_id = current_setting('app.tenant_id', true)::uuid)
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);
```
The API connects as an application role without `BYPASSRLS` and, in each request's transaction:
```sql
begin;
set local app.tenant_id = '6f1c…';
set local app.user_id = '91ab…';
select * from projects where id = $1;     -- RLS adds the tenant predicate automatically
commit;
```
`SET LOCAL` scopes the setting to the transaction, which is essential with connection pooling. If the setting is missing, `current_setting(..., true)` returns null and the policy matches nothing (fail closed). Migrations and admin jobs use a separate role.

**3. Client-direct access (Supabase).** When the React app queries the database via Supabase's API, there's no application layer in between; **RLS is the authorisation layer**. Policies use the user's JWT:
```sql
create table memberships (user_id uuid, org_id uuid, role text, primary key (user_id, org_id));

alter table projects enable row level security;

create policy 'members read projects' on projects for select to authenticated
  using (org_id in (select org_id from memberships where user_id = (select auth.uid())));

create policy 'editors write projects' on projects for insert to authenticated
  with check (org_id in (select org_id from memberships
                         where user_id = (select auth.uid()) and role in ('owner','editor')));

create policy 'editors update projects' on projects for update to authenticated
  using (org_id in (select org_id from memberships where user_id = (select auth.uid()) and role in ('owner','editor')))
  with check (org_id in (select org_id from memberships where user_id = (select auth.uid()) and role in ('owner','editor')));
```
Rules I follow:
- **Every table in the exposed schema has RLS enabled**, even if the policy is 'deny all'. A table without RLS is readable by any signed-in user.
- Separate policies per command (`select`, `insert`, `update`, `delete`) with **`WITH CHECK`** on writes, so users can't move rows into another org.
- `(select auth.uid())` instead of `auth.uid()` so it's evaluated once per query, and indexes on `memberships(user_id, org_id)` and `projects(org_id)`.
- The **service role key** lives only in server code (API routes, jobs); it bypasses RLS.
- Columns users mustn't change (e.g. `org_id`, `role`) are protected by `WITH CHECK`, column privileges or triggers.
- **Views** are created `with (security_invoker = true)`; `security definer` functions validate inputs and set a safe `search_path`.
- **Storage** buckets get their own policies (e.g. path starts with the org id).

**4. Testing.** Automated tests create two tenants and assert that every table and endpoint returns nothing (or 404) for the other tenant's ids, for each role. In Postgres, `pgTAP` or simple SQL tests run as a test user with `set local role authenticated` and a JWT claim. A CI check lists tables in the exposed schema without RLS enabled and fails the build."

#### Another worked example: an RLS hole through a view
"A team added a `project_stats` view joining projects and tasks for a dashboard. Views run with the **owner's** privileges by default, and the owner bypassed RLS, so every user could read every tenant's stats through the API. Fix: recreate it with `security_invoker = true` (so the caller's RLS applies), and add a CI check that flags views without it in exposed schemas. Similar holes: materialised views (no RLS at all, so keep them out of exposed schemas) and `security definer` functions that don't check the caller."

#### Step-by-step framework
1. **Tenant context from authentication**, never from client input alone.
2. **Application scoping** via a repository/ORM layer.
3. **Enable and force RLS** on every tenant table; fail-closed policies.
4. **`USING` + `WITH CHECK`** per command.
5. **Pass identity safely**: `SET LOCAL` in transactions or JWT claims.
6. **Lock down bypasses**: service keys, definer functions, views, materialised views, storage.
7. **Index for policies**; check query plans.
8. **Test isolation automatically** and lint for missing RLS.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We always add WHERE tenant_id" | App scoping plus RLS as an independent layer |
| RLS policies with `USING` only | `WITH CHECK` on inserts and updates |
| `SET app.tenant_id` on pooled connections | `SET LOCAL` inside the transaction |
| Service role key in the frontend | Service key server-only |
| Forgets views and functions | `security_invoker` views, careful definer functions |
| No tests | Cross-tenant tests and a CI check for tables without RLS |

#### Useful phrases
- "RLS is the seatbelt: even a query with a missing WHERE clause can't cross tenants."
- "With Supabase, RLS isn't a safety net, it's the whole authorisation model."
- "Policies fail closed if the tenant setting is missing."
- "`WITH CHECK` stops someone writing a row into another tenant."
- "CI fails if any exposed table has RLS disabled."

#### Common pitfalls
- **Tables created without RLS** in an exposed schema.
- **Session settings leaking between pooled requests.**
- **Slow policies** doing per-row subqueries without indexes.
- **Caches and search indexes** that ignore tenancy even when the database is safe.
- **Superuser/owner connections** in the app, silently bypassing RLS.

#### Follow-ups to expect (with sample answers)
- **"Does RLS hurt performance?"**
  "Policies are just extra predicates. With indexes on the policy columns and `(select auth.uid())` caching, overhead is small; check `EXPLAIN` on hot queries."
- **"Schema-per-tenant instead?"**
  "Stronger separation and easy per-tenant backups, but migrations across thousands of schemas are painful. I'd use it for a small number of large tenants, not thousands of small ones."
- **"How do admins or support see all tenants?"**
  "Through a separate admin service using a privileged role, with audit logging, never via the customer-facing API."
- **"How do you handle users in multiple orgs?"**
  "Policies check membership tables, not a single org claim; the UI passes the active org, and policies verify membership for that org."

#### What senior interviewers look for
- **Defence in depth** and fail-closed design.
- Detailed **RLS mechanics** and known holes.
- Understanding of **client-direct architectures**.
- **Automated verification** of isolation.

#### Practise it
1. Create two tenants in a local Postgres, enable RLS with `SET LOCAL` context, and prove isolation with tests.
2. In a Supabase project, write select/insert/update policies with membership checks and try to bypass them from the browser console.
3. Write a SQL query that lists exposed tables without RLS and wire it into CI.
4. Explain the view/security-invoker hole to a friend.

## Protecting an API used by your own SPA: CORS, CSRF, rate limits
- id: fs-sec-05
- round: SECURITY
- difficulty: medium
- levels:
- tags: CORS, CSRF, rate limiting, API security, SPA, security headers

### Prompt
Your React single-page app calls your own JSON API with cookie-based auth. What can go wrong, and how do you configure CORS, CSRF protection, rate limiting and security headers properly? Clear up common misconceptions as you go.

### Answer
#### What the interviewer is really testing
- Knowing that **CORS is not a security control for your server**: it relaxes the browser's same-origin policy for reading responses; it doesn't stop requests from being sent.
- Understanding **CSRF** with cookie auth and how **SameSite**, origin checks and tokens defend against it.
- **Rate limiting** design: keys, algorithms, where to enforce, what to return.
- **Security headers** that harden the SPA (CSP, HSTS, frame-ancestors, nosniff).
- Not confusing "the API is only called by our SPA" with "only our SPA can call the API" (anyone can call it with curl).

#### Key points
- **Same-origin policy**: browsers block scripts from *reading* cross-origin responses unless the server allows it via CORS headers. Requests (especially simple ones like form POSTs) may still be **sent**.
- **CORS config**: allow only your exact origins; `Access-Control-Allow-Credentials: true` only with an explicit origin (never `*`); restrict methods and headers; cache preflights with `Access-Control-Max-Age`. Best of all: serve the API from the **same origin** (`/api` path) and avoid CORS entirely.
- **CSRF**: with cookies, a malicious site can make the browser send authenticated requests. Defences: **`SameSite=Lax` or `Strict` cookies**, **verify `Origin`/`Sec-Fetch-Site` headers** on state-changing requests, **CSRF tokens** (synchroniser or double-submit) for extra assurance, never change state on `GET`, require `Content-Type: application/json` (forces a preflight cross-origin).
- **Rate limiting**: per IP and per user/API key, stricter on auth endpoints; token bucket or sliding window in Redis or at the edge/gateway; return `429` with `Retry-After`.
- **Headers**: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `frame-ancestors`/`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Your API is public**: authenticate and authorise every endpoint; validate every input; never rely on the UI hiding things.

#### Model answer
"First, a framing point: our API is reachable by anyone with curl, not just our SPA. CORS and CSRF protections are about **what browsers let other websites do with our users' cookies**. Server-side authentication, authorisation and validation protect against everything else.

**1. Prefer same-origin.** If the SPA is served from `app.example.com` and the API at `app.example.com/api` (via a reverse proxy or the framework), there's no CORS at all, and cookies are first-party. That's my default.

**2. If the API is on another origin** (`api.example.com`):
```ts
const ALLOWED = new Set(['https://app.example.com', 'https://staging.example.com']);
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && ALLOWED.has(origin)) {
    res.set({ 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin',
              'Access-Control-Allow-Credentials': 'true' });
    if (req.method === 'OPTIONS') {
      res.set({ 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type,Idempotency-Key',
                'Access-Control-Max-Age': '600' });
      return res.sendStatus(204);
    }
  }
  next();
});
```
- Exact origin allow-list, echoing the matched origin (never reflecting any `Origin` blindly, never `*` with credentials).
- `Vary: Origin` so caches don't serve one origin's CORS headers to another.
- Note `app.example.com` and `api.example.com` are **same-site**, so `SameSite=Lax` cookies still flow.

**3. CSRF.** Cookies are `HttpOnly; Secure; SameSite=Lax`, which stops cross-site POSTs from carrying the cookie in modern browsers. Defence in depth, because SameSite has edge cases (older browsers, same-site subdomain attacks, top-level GET navigations):
```ts
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const site = req.get('Sec-Fetch-Site');                   // sent by modern browsers
  const origin = req.get('Origin');
  if (site && !['same-origin', 'same-site', 'none'].includes(site)) return res.sendStatus(403);
  if (origin && !ALLOWED.has(origin) && origin !== SELF) return res.sendStatus(403);
  next();
});
```
Plus: state changes never happen on `GET`; JSON endpoints require `Content-Type: application/json` (a cross-site form can't send that without a preflight, which CORS will reject). For high-risk actions (changing email, payouts), add a CSRF token or re-authentication.

**4. Rate limiting.**
- At the edge/API gateway: coarse per-IP limits (e.g. 300 requests/minute) to absorb abuse cheaply.
- In the app with Redis: per-user and per-endpoint limits, stricter for sensitive routes: login 5 attempts per 15 minutes per account and 20 per IP; signup and password reset per IP and per email; expensive endpoints (search, exports, AI calls) per user per minute/day.
- Algorithm: token bucket or sliding window counters (`INCR` + `EXPIRE`, or a Lua script for atomic sliding windows).
- Response: `429 Too Many Requests` with `Retry-After` and `RateLimit-*` headers; the SPA shows a friendly message and backs off.

**5. Security headers for the SPA and API.**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-…'; connect-src 'self' https://api.example.com;
                         img-src 'self' data: https://cdn.example.com; frame-ancestors 'none'; base-uri 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
CSP limits the damage of XSS (which would otherwise defeat every CSRF defence, since injected script runs same-origin).

**6. The basics behind it all:** every endpoint authenticates, checks authorisation on the specific resource (no IDOR), validates input with schemas, and returns minimal data."

#### Another worked example: the 'CORS fixed it' misconception
"A developer hit a CORS error calling the API from `localhost:5173`, so they set `Access-Control-Allow-Origin: *` and `Allow-Credentials: true` (which browsers reject), then switched to reflecting any `Origin`. That made it work, and it also let **any website** read authenticated responses from our API using a visitor's cookies, a real data-leak vulnerability. The fix: in development, proxy `/api` through the dev server (Vite's `server.proxy`) so it's same-origin; in production, an explicit allow-list. CORS errors are the browser protecting users; the answer is never 'allow everything'."

#### Step-by-step framework
1. **Same-origin API** by default.
2. If cross-origin: **exact allow-list**, credentials only with explicit origins, `Vary: Origin`.
3. **CSRF**: SameSite cookies + Origin/Sec-Fetch-Site checks + JSON content type + no state-changing GETs; tokens for high-risk actions.
4. **Rate limits** layered at edge and app; stricter on auth and expensive endpoints; `429` + `Retry-After`.
5. **Security headers** including CSP and HSTS.
6. **Authorise and validate everything** server-side.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "CORS protects our API from other callers" | CORS controls browser reads; server auth protects the API |
| Reflects any Origin with credentials | Exact allow-list, `Vary: Origin` |
| "We use JSON, so no CSRF" | SameSite + origin checks; explains the edge cases |
| One global rate limit | Layered, per-user and per-endpoint limits |
| No CSP | CSP and other hardening headers |
| Trusts the SPA to hide admin actions | Server-side authorisation on every endpoint |

#### Useful phrases
- "CORS relaxes the browser's same-origin policy; it isn't access control for our server."
- "I'd serve the API same-origin and avoid CORS entirely if I can."
- "SameSite cookies are the main CSRF defence, with origin checks as a backstop."
- "Rate limits are layered: cheap per-IP limits at the edge, per-user limits in the app."
- "Anything the browser can call, curl can call, so every endpoint authorises."

#### Common pitfalls
- **Reflecting arbitrary origins** with credentials.
- **State-changing `GET` endpoints** (logout, delete links).
- **Rate limiting only by IP**, which hurts users behind shared NAT and misses distributed attacks.
- **Missing `Vary: Origin`**, causing CDN-cached CORS headers for the wrong origin.
- **Relying on CSRF defences while having XSS**: XSS defeats them all, so CSP matters.

#### Follow-ups to expect (with sample answers)
- **"What triggers a CORS preflight?"**
  "Non-simple requests: methods other than GET/HEAD/POST, custom headers, or content types other than form/text/multipart (e.g. `application/json`)."
- **"Does SameSite=Strict break anything?"**
  "Following a link from another site (email, Slack) arrives without the cookie, so users look logged out on first click. Lax is usually the right balance; Strict for a separate high-security cookie."
- **"How do you rate limit across multiple app servers?"**
  "Shared counters in Redis (atomic operations or Lua), or enforce at the gateway/edge, which already sees all traffic."
- **"What's an IDOR?"**
  "Insecure direct object reference: `GET /invoices/123` returns someone else's invoice because the server checked authentication but not ownership."

#### What senior interviewers look for
- **Correct mental models** of CORS and CSRF.
- **Layered, practical** rate limiting.
- **Hardening headers** as defaults.
- A clear statement that **the server must authorise everything**.

#### Practise it
1. Build a tiny attacker page on another origin and try reading and writing your API with cookies; observe what CORS and SameSite block.
2. Implement the origin/Sec-Fetch-Site middleware and test it with curl and a cross-site form.
3. Add a Redis sliding-window limiter to your login route and test lockout and `Retry-After`.
4. Explain to a friend why CORS isn't a server-side security control.

## Secure file uploads end to end
- id: fs-sec-06
- round: SECURITY
- difficulty: medium
- levels:
- tags: file upload security, malware, content type, XSS, SVG, presigned URLs, storage

### Prompt
Users can upload profile pictures and attach documents (PDF, Word, images) that other users can download. What are the security risks of file uploads, and how do you mitigate them across the frontend, API, storage and delivery?

### Answer
#### What the interviewer is really testing
- Awareness of the **many attack vectors** in uploads: stored XSS (HTML/SVG), malware, path traversal, oversized files (DoS), content-type confusion, metadata leaks, unauthorised access.
- Knowing that **client-side checks are only UX**; the server and storage must enforce limits.
- **Safe delivery**: serving user content from a separate domain, `Content-Disposition`, `nosniff`, CSP.
- **Access control** on downloads (signed URLs, authorisation).
- **Processing safely**: re-encoding images, scanning, sandboxing parsers.

#### Key points
- **Allow-list file types** by checking **magic bytes** (file signature), not just extension or the client's `Content-Type`.
- **Size limits** enforced at storage (presigned POST `content-length-range`) and the API.
- **Random object keys**; never use user-supplied filenames as paths (path traversal, overwrites). Store the original name as metadata, sanitised for display.
- **Store outside the web root / in object storage**, private by default.
- **Serve user content from a separate, cookieless domain** (e.g. `usercontent.example-cdn.com`) so any active content can't access your app's cookies or DOM.
- **`Content-Disposition: attachment`** for documents (forces download), **`X-Content-Type-Options: nosniff`**, correct `Content-Type`, and a restrictive CSP (`sandbox`) on user-content responses.
- **SVG and HTML are dangerous** (they can contain scripts): reject, sanitise, or rasterise to PNG.
- **Re-encode images** (strip EXIF/GPS, neutralise polyglots and malformed payloads); **scan documents** for malware; quarantine until clean.
- **Authorise downloads** with short-lived signed URLs after checking permissions.
- Run **parsers/converters in sandboxes** (separate containers, limited resources): image libraries and document converters have had many vulnerabilities.

#### Model answer
"I'd treat every uploaded file as hostile and defend at each stage.

**1. Before upload (client).** Check type and size for fast feedback only. The real enforcement happens later.

**2. Upload authorisation (API).**
- The client asks for an upload slot: `POST /uploads { purpose: 'avatar' | 'attachment', filename, size, contentType }`.
- The API checks the user may upload for that purpose, validates against a **per-purpose allow-list** (avatars: JPEG/PNG/WebP up to 5 MB; attachments: PDF, DOCX, XLSX, PNG, JPEG up to 25 MB), creates a `pending` record with a **random key** (`quarantine/{uuid}`), and returns a **presigned POST** with `content-length-range` and content-type conditions. Bytes go straight to a **private** bucket.

**3. Verification and processing (worker), triggered by the storage event.**
- Read the first bytes and check **magic numbers** against the allow-list (`%PDF-`, PNG `89 50 4E 47`, ZIP-based `PK\x03\x04` for DOCX, then check its internal structure). Mismatch → reject.
- **Images**: decode and **re-encode** with a hardened library (`sharp`/libvips) in a sandboxed worker: strips EXIF (GPS location), normalises orientation, removes trailing data and polyglot tricks, limits pixel dimensions (decompression-bomb protection).
- **SVG**: rejected for avatars; if needed elsewhere, sanitised with a strict sanitiser or rasterised.
- **Documents**: scanned with an antivirus engine (ClamAV or a cloud scanning service); macros flagged or blocked for Office files; PDFs optionally re-rendered/flattened if they'll be previewed inline.
- Clean files move from `quarantine/` to `files/{uuid}`; the record becomes `ready`. Failures become `rejected` with a reason shown to the uploader.

**4. Delivery.**
- Downloads go through `GET /files/:id/download`: the API checks the requester can see the parent resource, then redirects to a **signed URL** valid for a few minutes.
- Files are served from a **separate domain** (`files.examplecdn.com`) with no cookies for our app.
- Response headers set at upload/processing time:
  - `Content-Type`: the verified type, never `text/html`.
  - `Content-Disposition: attachment; filename*=UTF-8''<sanitised name>` for documents; `inline` only for re-encoded images.
  - `X-Content-Type-Options: nosniff` and `Content-Security-Policy: sandbox; default-src 'none'`.
- Avatars (public, re-encoded images) can be served from a CDN with long cache lifetimes and random, unguessable keys.

**5. Display in the app.**
- Filenames are rendered as text (React escapes by default), truncated, with dangerous Unicode (right-to-left override) neutralised.
- Previews use the processed versions, never the original file inline in our origin.

**6. Abuse controls.** Per-user upload quotas and rate limits, maximum file counts, cleanup of pending files, logging of who uploaded what, and a report/takedown flow."

#### Another worked example: the SVG avatar XSS
"A site let users upload SVG avatars and served them from the main domain with `Content-Type: image/svg+xml`. An attacker uploaded an SVG containing `<script>fetch('/api/me').then(...)</script>`. Opening the avatar URL directly ran the script **on the app's origin**, with access to the victim's session for API calls. Embedding via `<img>` doesn't execute scripts, but direct navigation does. Fixes, any of which would have stopped it: reject SVG, rasterise to PNG, serve user files from a separate cookieless domain, add `Content-Security-Policy: sandbox` and `Content-Disposition: attachment`."

#### Step-by-step framework
1. **Per-purpose allow-lists and limits**, enforced by presigned policies.
2. **Random keys, private quarantine bucket**.
3. **Verify magic bytes**; **re-encode images**; **scan documents**; sandbox processors.
4. **Promote** clean files; reject others with reasons.
5. **Authorised, signed downloads** from a separate cookieless domain.
6. **Safe headers**: correct type, `attachment`, `nosniff`, CSP sandbox.
7. **Safe display** of names and previews.
8. **Quotas, rate limits, cleanup, audit**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Checks the extension in the browser | Magic-byte verification on the server |
| Saves to `/uploads/<original name>` on the web server | Random keys in private object storage |
| Serves files from the app domain inline | Separate cookieless domain, `attachment`, `nosniff`, CSP |
| Accepts SVG and HTML | Rejects, sanitises or rasterises active content |
| Public bucket URLs | Authorised short-lived signed URLs |
| No scanning or re-encoding | AV scanning, image re-encoding, sandboxed processing |

#### Useful phrases
- "Client checks are for UX; the presigned policy and the worker enforce the rules."
- "I verify the file's actual bytes, not its name or claimed type."
- "Images are re-encoded, which strips metadata and neutralises a lot of tricks."
- "User content is served from a separate domain, so it can never run on our origin."
- "Downloads are authorised and use short-lived signed URLs."

#### Common pitfalls
- **Trusting `Content-Type`** from the client.
- **Path traversal** through filenames (`../../config`).
- **Leaking GPS coordinates** in photo EXIF.
- **Decompression bombs** (tiny files that decode to huge images or archives).
- **Inline rendering** of HTML, SVG or PDFs on the main origin.

#### Follow-ups to expect (with sample answers)
- **"How do you preview PDFs safely?"**
  "Render pages to images server-side in a sandbox, or use a PDF viewer (pdf.js) in a sandboxed iframe on the separate content domain."
- **"What about zip files?"**
  "Avoid if possible. If allowed: limit total uncompressed size and file count, check for path traversal entries, and scan contents."
- **"How long should signed URLs last?"**
  "Minutes for private documents; long enough to start the download. Revocation is then just 'stop issuing new URLs'."
- **"Do you need antivirus if files are only stored?"**
  "If other users download them, yes: you'd be distributing malware. It also matters for compliance in many industries."

#### What senior interviewers look for
- **Breadth of threats** and **layered mitigations**.
- **Delivery isolation** (separate domain, headers).
- **Safe processing** with sandboxing.
- **Access control and abuse handling**.

#### Practise it
1. Write a magic-byte checker for PNG, JPEG, PDF and DOCX.
2. Upload an SVG with a script to a test app served from the same origin and see it run; then fix it with headers and a separate domain.
3. Re-encode an image with `sharp` and confirm EXIF GPS data is gone.
4. Explain to a friend why a separate user-content domain matters.

## Handling secrets in frontend builds and serverless functions
- id: fs-sec-07
- round: SECURITY
- difficulty: medium
- levels:
- tags: secrets management, environment variables, frontend builds, serverless, key rotation

### Prompt
Your full stack app uses API keys (payments, email, an AI provider, a database). How do you make sure secrets never end up in the browser bundle or the git repo, how are they managed across environments and serverless functions, and what do you do if one leaks?

### Answer
#### What the interviewer is really testing
- Knowing that **anything in a frontend bundle is public**, including "environment variables" baked in at build time.
- Understanding framework conventions (`NEXT_PUBLIC_`, `VITE_`) and how secrets leak through them.
- **Secret storage and injection**: secret managers, platform env vars, least privilege, per-environment keys.
- **Serverless specifics**: cold-start loading, caching secrets, not logging them.
- **Leak response**: rotate first, then investigate; scanning to prevent leaks.

#### Key points
- **Browser code can't keep secrets.** Build-time variables exposed to the client (`VITE_*`, `NEXT_PUBLIC_*`, `REACT_APP_*`) are inlined into JS and visible to anyone. Only put **public identifiers** there (publishable keys, analytics ids, a Supabase anon key designed to be public with RLS).
- **Secret keys stay server-side**: API routes, server actions, serverless functions or a backend proxy call the third party.
- **Storage**: a secrets manager (AWS Secrets Manager/SSM, GCP Secret Manager, Vault, Doppler, 1Password) or the platform's encrypted env vars; never committed. `.env.local` is gitignored; `.env.example` documents names without values.
- **Least privilege and separation**: different keys per environment; restricted scopes (e.g. Stripe restricted keys, read-only DB users); spending limits on AI keys.
- **Serverless**: inject as env vars or fetch from a secrets manager at cold start and cache in memory; never log env objects or include secrets in error reports.
- **Prevent leaks**: secret scanning (GitHub push protection, gitleaks) in pre-commit and CI; bundle checks for known key patterns.
- **On leak**: **revoke/rotate immediately**, check provider logs for misuse, then clean history and fix the root cause. Removing the commit is not enough.

#### Model answer
"My rule is simple: **if the browser can see it, it isn't a secret.** Everything else follows from that.

**1. Classify every key.**
| Key | Where it lives | Why |
|---|---|---|
| Stripe publishable key | Client (`VITE_STRIPE_PK`) | Designed to be public |
| Stripe secret key | Server only | Can move money |
| Supabase anon key | Client | Public by design; RLS enforces access |
| Supabase service role key | Server only | Bypasses RLS |
| Email provider key, AI provider key | Server only | Cost and abuse |
| Database URL with password | Server only | Full data access |

**2. Calling third parties.** The browser calls our own endpoint; the server adds the secret:
```ts
// api/ai/summarise.ts (serverless)
const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY?.trim() });
export async function POST(req: Request) {
  const user = await requireUser(req);                       // auth + per-user rate limits/caps
  const { text } = Body.parse(await req.json());
  const msg = await client.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 800,
                                             messages: [{ role: 'user', content: text }] });
  return Response.json({ summary: msg.content });
}
```
The proxy also enforces authentication, quotas and input limits, which an exposed key never could.

**3. Build-time hygiene.**
- Only variables with the public prefix reach the bundle; code reviews treat a new `VITE_`/`NEXT_PUBLIC_` variable as a security question.
- A CI step greps the built `dist/` for secret patterns (`sk_live_`, `-----BEGIN`, known prefixes) and fails if found.
- Server-only modules are marked (`import 'server-only'` in Next.js) so importing them from client code breaks the build.

**4. Storage and environments.**
- Local: `.env.local` (gitignored), with `.env.example` listing names.
- Deployed: platform encrypted env vars or a secrets manager; preview, staging and production have **different keys**, and previews never get production secrets.
- Access to production secrets limited to a few people and to the deploy pipeline; changes audited.
- Least privilege: restricted Stripe keys per service, a database role per app with only needed grants, spending caps and alerts on AI keys.

**5. Serverless details.**
- Read secrets once per cold start (module scope) and reuse across invocations; if fetched from a secrets manager, cache with a TTL so rotation is picked up.
- Never log `process.env` or full request configs; scrub secrets from error trackers (Sentry `beforeSend`).
- Use the platform's identity (IAM roles / workload identity) instead of static cloud credentials where possible.

**6. Prevention.** GitHub secret scanning with push protection, gitleaks as a pre-commit hook and in CI, and dependency review (a compromised dependency can read env vars at runtime).

**7. If a secret leaks.**
1. **Rotate/revoke immediately** at the provider (issue a new key, deploy it, revoke the old one), even before investigating. Bots scrape public repos within minutes.
2. **Check provider logs** for usage from unknown IPs; assess impact (charges, data access).
3. **Clean up**: remove from code, rewrite history if needed, invalidate caches/artifacts that contained it.
4. **Root cause**: why did it reach the repo or bundle? Add the missing guard (scanner rule, CI check, review step).
5. Notify stakeholders, and users if data was exposed."

#### Another worked example: the AI key in a Vite app
"A prototype called an AI provider directly from the browser with `VITE_AI_KEY`. It worked in the demo, then the key appeared in the built JS, someone found it, and ran up a large bill in a weekend. The fix: move the call into a serverless function that reads `AI_KEY` (no public prefix), require sign-in, add per-user daily caps, and set a spending limit and alert at the provider. Then rotate the leaked key. The pattern applies to every paid API: the browser talks to us, and we talk to them."

#### Step-by-step framework
1. **Classify keys**: public identifiers vs secrets.
2. **Secrets server-side only**; proxy third-party calls.
3. **Guard the build**: public prefixes reviewed, bundle scanning, server-only imports.
4. **Store in a secrets manager / encrypted env vars**, per environment.
5. **Least privilege**, spending limits, audit access.
6. **Serverless hygiene**: cache, don't log, use workload identity.
7. **Prevent** with secret scanning; **respond** with rotate-first.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It's in an env var, so it's safe" | Knows public-prefixed env vars are inlined into the bundle |
| Secret API key called from the browser | Server-side proxy with auth and quotas |
| Same keys in every environment | Separate, least-privilege keys per environment |
| `.env` committed "temporarily" | Gitignored, scanning with push protection |
| Leak response: delete the commit | Rotate immediately, check logs, then clean up |
| Logs full config on error | Scrubbed logs and error reports |

#### Useful phrases
- "If the browser can see it, it isn't a secret."
- "The browser calls our API; our server holds the provider key."
- "A new public-prefixed variable is a security review item."
- "Previews and staging never get production secrets."
- "On a leak, rotate first, investigate second."

#### Common pitfalls
- **Public-prefix mistakes** (`NEXT_PUBLIC_STRIPE_SECRET`).
- **Secrets in source maps or error messages.**
- **Long-lived, over-privileged keys** shared by many services.
- **Forgetting CI logs and build artifacts** as leak paths.
- **Assuming a private repo is safe** (laptops, forks, third-party CI access).

#### Follow-ups to expect (with sample answers)
- **"Is the Supabase anon key a secret?"**
  "No, it's meant to be public; security comes from RLS policies. The service role key is the secret."
- **"How do you rotate without downtime?"**
  "Support two active keys: add the new one, deploy, verify traffic uses it, then revoke the old one."
- **"How do you share secrets with teammates?"**
  "Through the secrets manager or a password manager with access controls, never Slack or email."
- **"What about secrets in mobile apps?"**
  "Same rule: apps can be decompiled. Use a backend proxy and short-lived user tokens."

#### What senior interviewers look for
- The **bundle-is-public** principle applied consistently.
- **Operational maturity**: per-environment keys, least privilege, scanning.
- **Calm, correct incident response**.
- Recognising **public-by-design keys**.

#### Practise it
1. Build a Vite app with a `VITE_` variable, run the build, and find the value in `dist/`.
2. Move a third-party call behind a serverless function with auth and a daily cap.
3. Add gitleaks to pre-commit and CI; commit a fake key to see it blocked.
4. Explain to a friend why the anon key is fine to expose but the service role key isn't.

## Threat modelling a new feature
- id: fs-sec-08
- round: SECURITY
- difficulty: medium
- levels: senior, staff
- tags: threat modelling, STRIDE, security review, abuse cases, secure design

### Prompt
Your team is about to build a "share a document via public link" feature. Walk through how you'd threat-model it: what process you'd use, what threats you'd find, and how the results change the design.

### Answer
#### What the interviewer is really testing
- That you can run a **lightweight, repeatable threat modelling process**, not just list OWASP items.
- **Data flow thinking**: assets, actors, trust boundaries, entry points.
- Using a framework (**STRIDE**, abuse cases) to find threats systematically.
- **Prioritising** threats by likelihood and impact and turning them into concrete design changes and tests.
- Making security a **team habit** rather than a gate at the end.

#### Key points
- Four questions (Shostack): **What are we building? What can go wrong? What are we going to do about it? Did we do a good job?**
- Draw a **data flow diagram**: users, browser, API, database, storage, third parties, with **trust boundaries** (internet ↔ API, API ↔ DB, our system ↔ third parties).
- Identify **assets** (document contents, share tokens, user identities) and **actors** (owner, link recipient, anonymous attacker, malicious insider, crawler).
- **STRIDE**: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. Walk each element/flow through it.
- Add **abuse cases**: "As an attacker, I want to enumerate share links", "As a spammer, I want to host malware via public links".
- Rate (e.g. high/medium/low on impact × likelihood), decide **mitigate, accept, transfer**, and turn mitigations into **tickets and tests**.
- Keep it **short** (an hour with the team), documented next to the design doc, and revisited when the design changes.

#### Model answer
"I'd run a one-hour session with the engineers, product owner and ideally someone from security, using the four questions.

**1. What are we building?**
Owner clicks 'Share' → chooses 'Anyone with the link can view' → the API creates a share token → anyone opening `https://app.example.com/s/<token>` can view (not edit) the document, without signing in. Owner can disable the link.

Data flow:
```
Owner (browser) ──[auth'd]──► API ──► DB (documents, shares)
Recipient (anonymous browser) ──► /s/:token ──► API ──► DB / object storage (attachments)
                                    ▲ trust boundary: anonymous internet
```
Assets: document content and attachments, the share token, the owner's identity and other documents, our infrastructure.

**2. What can go wrong? (STRIDE + abuse cases)**
| Threat | Category | Example | Rating |
|---|---|---|---|
| Guessing or enumerating tokens | Information disclosure | Sequential or short tokens let attackers find documents | High |
| Token leakage | Information disclosure | Link forwarded, posted, in Referer headers, in analytics/logs, indexed by search engines | High |
| Access beyond the shared doc | Elevation of privilege | Viewer page's API calls allow fetching other docs or attachments (IDOR) | High |
| Stale access | Information disclosure | Disabling the link doesn't revoke cached copies or signed attachment URLs | Medium |
| Editing via share link | Tampering | Mutation endpoints accept the share token | Medium |
| Malware/phishing hosting | Abuse / reputation | Spammers upload malicious files and share links widely | Medium |
| Scraping / heavy traffic | Denial of service | Viral link or bot hammers the endpoint | Medium |
| No audit trail | Repudiation | Owner can't tell who accessed or when links were created | Low–Medium |
| XSS in shared content | Spoofing / EoP | Malicious content runs script on our origin for viewers | High |

**3. What are we going to do about it? (design changes)**
- **Tokens**: 128+ bits of randomness (`crypto.randomBytes(16)` base64url), stored **hashed** in the database, never sequential. Rate-limit `/s/:token` lookups per IP to make enumeration pointless.
- **Scope**: the token grants `view` on exactly one document id. The viewer page uses a dedicated read-only endpoint (`GET /public/shares/:token`) that returns only that document's rendered content and attachment links; normal APIs never accept share tokens. Tests assert mutation endpoints reject them.
- **Leakage**: `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex` on share pages; tokens scrubbed from logs and analytics URLs; optional expiry dates and password protection; owners see 'Anyone with the link' clearly before enabling.
- **Revocation**: disabling deletes the share row; attachment downloads use signed URLs valid for minutes; share pages served `Cache-Control: private, no-store` so the CDN doesn't keep copies.
- **Content safety**: shared documents rendered with the same sanitisation as in-app; attachments served from the separate user-content domain with `attachment` disposition.
- **Abuse**: reporting link on share pages, malware scanning on attachments, limits on public shares for new or free accounts, automated takedown of reported links.
- **Availability**: CDN caching of static assets, per-IP rate limits, per-share access counters to spot viral or abusive links.
- **Audit**: log share creation, changes and disabling; record access counts and last access (without storing viewer IPs longer than needed, for privacy).

**4. Did we do a good job?**
- Each mitigation becomes a ticket with acceptance criteria and tests (e.g. 'share token cannot call PATCH /documents/:id').
- Security review of the PR for the endpoint.
- Revisit the model if we add 'anyone with the link can edit' or comments from anonymous users."

#### Another worked example: threat modelling an 'invite teammate by email' feature in ten minutes
"Quick pass: invite tokens must be random, single-use and expire (spoofing); accepting an invite must bind to the invited email or require verification, otherwise a forwarded invite lets someone else join (EoP); invites must respect the inviter's role (only admins can invite admins); rate-limit invite sending to prevent spam via our domain (abuse/DoS); log who invited whom (repudiation). Five threats, five concrete requirements, in ten minutes. Small features deserve small threat models, but not zero."

#### Step-by-step framework
1. **Scope and diagram**: actors, data flows, trust boundaries, assets.
2. **Enumerate threats**: STRIDE per element and flow, plus abuse cases.
3. **Rate**: impact × likelihood.
4. **Decide**: mitigate, accept (with sign-off), transfer.
5. **Turn mitigations into tickets and tests**.
6. **Review and revisit** when the design changes.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We'll follow OWASP" | Structured process with diagram and STRIDE |
| Lists threats without priorities | Rates and decides per threat |
| Security review after it's built | Threat model at design time, tests as outputs |
| Ignores abuse and misuse | Abuse cases (spam, malware, scraping) |
| Generic mitigations | Concrete design changes (token entropy, scope, headers, revocation) |
| One-off document | Revisited when scope changes |

#### Useful phrases
- "Let's start with the data flow and where the trust boundaries are."
- "I'll walk each flow through STRIDE, then add abuse cases."
- "The token should grant exactly one capability on exactly one resource."
- "Each mitigation becomes a ticket with a test."
- "We'll revisit this if we add editing via links."

#### Common pitfalls
- **Boiling the ocean**: three-day workshops nobody repeats.
- **Only technical threats**, missing abuse and privacy.
- **No follow-through**: findings never become tickets or tests.
- **Accepting risks silently** without an owner's sign-off.
- **Forgetting third parties** (analytics, CDNs, email providers) as leak paths.

#### Follow-ups to expect (with sample answers)
- **"How do you make threat modelling a habit?"**
  "A short template in the design doc, a 30–60 minute session for features touching auth, data sharing, payments or uploads, and security champions in each team."
- **"How is this different from a pen test?"**
  "Threat modelling finds design flaws before code exists; pen tests find implementation flaws afterwards. Both are useful; the first is much cheaper."
- **"What if product pushes back on mitigations as friction?"**
  "Explain the risk in user and business terms, offer lower-friction alternatives (expiry defaults instead of mandatory passwords), and record accepted risks with an owner."
- **"Other frameworks besides STRIDE?"**
  "LINDDUN for privacy threats, attack trees for deep dives on one goal, PASTA for risk-centric analysis; STRIDE is a good default for product teams."

#### What senior interviewers look for
- **Facilitation**: running a short, effective session with the team.
- **Systematic coverage** and **sensible prioritisation**.
- **Concrete, testable outcomes**.
- **Security culture** thinking.

#### Practise it
1. Threat-model a feature you've built recently using the four questions and STRIDE in 45 minutes.
2. Draw its data flow diagram with trust boundaries.
3. Turn your top three mitigations into tickets with test cases.
4. Explain STRIDE to a friend with one example per letter.
