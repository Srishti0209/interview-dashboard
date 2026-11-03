// Signs the smoke-test user in with a password and returns a Playwright
// context whose localStorage already holds the Supabase session, so pages
// load straight past the sign-in gate.
//
// Needs in .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
// SMOKE_EMAIL, SMOKE_PASSWORD (a confirmed user created in the Supabase
// dashboard → Authentication → Users → Add user).
import { existsSync } from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

export const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env;
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

/** Calls the Supabase REST API as the smoke user. */
export async function rest(path, init = {}) {
  const session = await getSmokeSession();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...init.headers,
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${text}`);
  return body;
}

export const SMOKE_PROFILE = {
  current_position: 'Senior Software Engineer',
  target_role_family: 'frontend',
  target_level: 'senior',
  onboarded: true,
};

/** Updates the smoke user's profile row (defaults to a finished onboarding). */
export async function setSmokeProfile(patch = SMOKE_PROFILE) {
  const { user } = await getSmokeSession();
  return rest(`profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** supabase-js stores the session under sb-<project-ref>-auth-token. */
export function storageKey() {
  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
}

export async function newSignedInContext(browser, options = {}, { onboarded = true } = {}) {
  const session = await getSmokeSession();
  // Feature smokes expect the app itself, not the onboarding screen.
  if (onboarded) await setSmokeProfile();
  const ctx = await browser.newContext(options);
  await ctx.addInitScript(
    ([k, v]) => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, v);
    },
    [storageKey(), JSON.stringify(session)],
  );
  return ctx;
}
