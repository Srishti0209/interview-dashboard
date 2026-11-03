// Signs the smoke-test user in with a password and returns a Playwright
// context whose localStorage already holds the Supabase session, so pages
// load straight past the sign-in gate.
//
// Needs in .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
// SMOKE_EMAIL, SMOKE_PASSWORD (a confirmed user created in the Supabase
// dashboard → Authentication → Users → Add user).
import { existsSync, readFileSync } from 'node:fs';

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

/**
 * Resets the smoke account to the state a brand-new local install used to
 * have: none of the user's own data, plus the seed story bank. This deletes
 * the account's data, so it only runs when .env.local marks the smoke
 * account as disposable (SMOKE_ACCOUNT_IS_DISPOSABLE=yes).
 */
export async function resetSmokeData() {
  if (process.env.SMOKE_ACCOUNT_IS_DISPOSABLE !== 'yes') {
    throw new Error(
      'Refusing to wipe the smoke account. Use a dedicated test account and set SMOKE_ACCOUNT_IS_DISPOSABLE=yes in .env.local.',
    );
  }
  const { user } = await getSmokeSession();
  for (const table of [
    'user_question_state',
    'user_company_state',
    'notes',
    'stories',
    'mock_sessions',
    'study_days',
    'revisions',
  ]) {
    await rest(`${table}?user_id=eq.${user.id}`, { method: 'DELETE' });
  }
  await rest(`questions?owner_id=eq.${user.id}`, { method: 'DELETE' });

  const seed = JSON.parse(readFileSync('public/seed/seed.json', 'utf8'));
  const now = Date.now();
  await rest('stories', {
    method: 'POST',
    body: JSON.stringify(
      seed.stories.map((st, i) => ({
        id: st.id,
        title: st.title,
        situation: st.situation,
        task: st.task,
        action: st.action,
        result: st.result,
        metrics: st.metrics,
        applicable_to: st.applicableTo,
        tags: st.tags,
        created_at: now + i,
        updated_at: now,
      })),
    ),
  });
}

/** Retries `read` until `check(value)` passes (writes sync asynchronously). */
export async function eventually(read, check, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let value;
  for (;;) {
    value = await read();
    if (check(value) || Date.now() > deadline) return value;
    await new Promise((r) => setTimeout(r, 250));
  }
}

/** The account's question bank merged with the smoke user's personal fields. */
export async function questionsWithState() {
  const [qs, states] = await Promise.all([
    rest('questions?select=id,title,source,answer,owner_id&order=id'),
    rest('user_question_state?select=*'),
  ]);
  const byId = new Map(states.map((st) => [st.question_id, st]));
  return qs.map((q) => {
    const st = byId.get(q.id);
    return {
      ...q,
      personalAnswer: st?.personal_answer ?? undefined,
      personalNotes: st?.personal_notes ?? undefined,
      bookmarked: st?.bookmarked ?? false,
      review: st && st.next_due !== null
        ? {
            confidence: st.confidence,
            nextDue: Number(st.next_due),
            intervalDays: st.interval_days,
            reviewCount: st.review_count,
          }
        : null,
    };
  });
}

export async function notes() {
  const rows = await rest('notes?select=*');
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    linkedQuestionIds: n.linked_question_ids,
    updatedAt: Number(n.updated_at),
  }));
}

export async function newSignedInContext(
  browser,
  options = {},
  { onboarded = true, reset = true } = {},
) {
  const session = await getSmokeSession();
  // Each script starts from a clean account, like a fresh install did.
  if (reset) await resetSmokeData();
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

/** The app's persisted query cache (IndexedDB via idb-keyval) as a string. */
export function readAppCache(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.open('keyval-store');
        req.onerror = () => resolve('');
        req.onsuccess = () => {
          try {
            const get = req.result
              .transaction('keyval')
              .objectStore('keyval')
              .get('interview-prep-cache');
            get.onsuccess = () => resolve(String(get.result ?? ''));
            get.onerror = () => resolve('');
          } catch {
            resolve('');
          }
        };
      }),
  );
}
