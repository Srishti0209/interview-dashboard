// Signs the smoke-test user in with a password and returns a Playwright
// context whose localStorage already holds the Supabase session, so pages
// load straight past the sign-in gate.
//
// Needs in .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
// SMOKE_EMAIL, SMOKE_PASSWORD (a confirmed user created in the Supabase
// dashboard → Authentication → Users → Add user).
import { existsSync } from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env;
const { SMOKE_EMAIL: email, SMOKE_PASSWORD: password } = process.env;

let cached;

export async function getSmokeSession() {
  if (cached) return cached;
  if (!url || !key || !email || !password) {
    throw new Error(
      'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SMOKE_EMAIL / SMOKE_PASSWORD in .env.local',
    );
  }
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Smoke sign-in failed: ${body.error_description || body.msg || res.status}`);
  }
  cached = {
    ...body,
    expires_at: body.expires_at ?? Math.floor(Date.now() / 1000) + body.expires_in,
  };
  return cached;
}

/** supabase-js stores the session under sb-<project-ref>-auth-token. */
export function storageKey() {
  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
}

export async function newSignedInContext(browser, options = {}) {
  const session = await getSmokeSession();
  const ctx = await browser.newContext(options);
  await ctx.addInitScript(
    ([k, v]) => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, v);
    },
    [storageKey(), JSON.stringify(session)],
  );
  return ctx;
}
