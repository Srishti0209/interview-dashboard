// Loads the shared content (question bank, companies, playbooks) from
// public/seed/seed.json and content/questions/*.json into Supabase. Idempotent: rows are upserted by id,
// so re-running picks up content edits. Per-user data (answers, reviews,
// application status) lives in separate tables and is never touched.
//
// Usage: node scripts/content/load-seed.mjs
// Needs VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const { VITE_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const seed = JSON.parse(readFileSync('public/seed/seed.json', 'utf8'));

// The original bank was written for frontend / full-stack / AI engineering.
// Phase 4 re-tags and adds the other role families.
const ORIGINAL_ROLE_FAMILIES = ['frontend', 'fullstack', 'ai'];
// Rounds from the original bank that don't apply to every original role.
const ROUND_ROLE_FAMILIES = {
  AI_PRODUCT_ENGINEERING: ['fullstack', 'ai'],
};

// Questions edited in the admin panel (migration 0005) are never overwritten.
async function adminEditedIds() {
  const { data, error } = await supabase.from('questions').select('id').eq('admin_edited', true);
  if (error) {
    // Before migration 0005 there is no admin_edited column: nothing to protect.
    if (/admin_edited/.test(error.message)) return new Set();
    throw new Error(`questions: ${error.message}`);
  }
  return new Set(data.map((r) => r.id));
}
const protectedIds = await adminEditedIds();
const notAdminEdited = (q) => !protectedIds.has(q.id);
if (protectedIds.size) console.log(`· skipping ${protectedIds.size} questions edited in the admin panel`);

async function upsert(table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(i, i + 200), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`✓ ${table}: ${rows.length} rows`);
}

await upsert(
  'companies',
  seed.companies.map((c) => ({
    id: c.id,
    name: c.name,
    location: c.location ?? '',
    archetype: c.archetype,
    ai_policy: c.aiPolicy,
    links: c.links ?? [],
  })),
  'id',
);

await upsert(
  'company_playbooks',
  seed.companies.map((c) => ({
    company_id: c.id,
    role_family: 'frontend',
    loop_structure: c.loopStructure ?? '',
    notes: c.notes ?? '',
    review_status: 'approved',
  })),
  'company_id,role_family',
);

await upsert(
  'questions',
  seed.questions.filter(notAdminEdited).map((q) => ({
    id: q.id,
    owner_id: null,
    role_families:
      q.roleFamilies ?? ROUND_ROLE_FAMILIES[q.roundType] ?? ORIGINAL_ROLE_FAMILIES,
    levels: q.levels ?? [],
    round_type: q.roundType,
    title: q.title,
    body: q.body ?? '',
    answer: q.answer ?? null,
    difficulty: q.difficulty,
    company: q.company ?? [],
    tags: q.tags ?? [],
    source: 'seed',
    review_status: 'approved',
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  })),
  'id',
);

// Role-specific banks built from content/src (see content/README.md).
const ts = Date.now();
const roleQuestions = existsSync('content/questions')
  ? readdirSync('content/questions')
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => JSON.parse(readFileSync(`content/questions/${f}`, 'utf8')))
  : [];
if (roleQuestions.length) {
  await upsert(
    'questions',
    roleQuestions.filter(notAdminEdited).map((q) => ({
      id: q.id,
      owner_id: null,
      role_families: q.roleFamilies,
      levels: q.levels,
      round_type: q.roundType,
      title: q.title,
      body: q.body,
      answer: q.answer,
      difficulty: q.difficulty,
      company: q.company,
      tags: q.tags,
      source: 'seed',
      review_status: 'approved',
      created_at: ts,
      updated_at: ts,
    })),
    'id',
  );
}
