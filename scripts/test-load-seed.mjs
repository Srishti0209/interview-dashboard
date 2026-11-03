// Re-loading shared content (scripts/content/load-seed.mjs) must never touch
// per-user data, and must not duplicate rows. Replaces test-seed.mjs, which
// covered the old in-browser seeding.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert';
import { rest, resetSmokeData } from './lib/auth.mjs';

await resetSmokeData();
const [q] = await rest('questions?source=eq.seed&select=id&limit=1');
const [c] = await rest('companies?select=id&limit=1');

await rest('user_question_state', {
  method: 'POST',
  body: JSON.stringify({ question_id: q.id, personal_answer: 'MINE', bookmarked: true, next_due: 123 }),
});
await rest('user_company_state', {
  method: 'POST',
  body: JSON.stringify({ company_id: c.id, application_status: 'onsite' }),
});
const own = (
  await rest('questions', {
    method: 'POST',
    body: JSON.stringify({ round_type: 'JS_FUNDAMENTALS', title: 'Own Q', difficulty: 'easy', source: 'user' }),
  })
)[0];
const before = (await rest('questions?select=id')).length;

execFileSync('node', ['scripts/content/load-seed.mjs'], { stdio: 'ignore' });

const state = (await rest(`user_question_state?question_id=eq.${q.id}&select=*`))[0];
assert.equal(state.personal_answer, 'MINE');
assert.equal(state.bookmarked, true);
assert.equal(Number(state.next_due), 123);
console.log('✓ personal answer / bookmark / review state PRESERVED');

const app = (await rest(`user_company_state?company_id=eq.${c.id}&select=*`))[0];
assert.equal(app.application_status, 'onsite');
console.log('✓ application status PRESERVED');

assert.ok((await rest(`questions?id=eq.${own.id}&select=id`)).length === 1);
console.log("✓ user's own question PRESERVED");

assert.equal((await rest('questions?select=id')).length, before);
console.log('✓ no duplicate rows after re-load');

await resetSmokeData();
console.log('\nALL LOAD-SEED TESTS PASSED');
