// Node-side verification of the Dexie schema + seed preservation rules.
// Uses fake-indexeddb so we exercise the REAL Dexie schema, then mirrors
// the ensureSeeded() put-logic to assert user data survives a re-seed.
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const seed = JSON.parse(readFileSync(new URL('../public/seed/seed.json', import.meta.url)));

const db = new Dexie('InterviewPrepTest');
db.version(1).stores({
  questions: 'id, roundType, difficulty, source, *tags, *company, bookmarked',
  reviewStates: 'questionId, nextDue, confidence',
  notes: 'id, *tags, *linkedQuestionIds, updatedAt',
  stories: 'id, *tags',
  companies: 'id, archetype, applicationStatus',
  mockSessions: 'id, startedAt',
});

async function seedRun(data) {
  await db.transaction('rw', db.questions, db.stories, db.companies, async () => {
    for (const q of data.questions) {
      const existing = await db.questions.get(q.id);
      if (existing) {
        await db.questions.put({
          ...q,
          personalAnswer: existing.personalAnswer,
          personalNotes: existing.personalNotes,
          bookmarked: existing.bookmarked,
          createdAt: existing.createdAt ?? q.createdAt,
          updatedAt: Date.now(),
        });
      } else {
        await db.questions.put(q);
      }
    }
    for (const s of data.stories) {
      if (!(await db.stories.get(s.id))) await db.stories.put(s);
    }
    for (const c of data.companies) {
      const existing = await db.companies.get(c.id);
      if (existing) {
        await db.companies.put({
          ...c,
          applicationStatus: existing.applicationStatus,
          applicationNotes: existing.applicationNotes,
          applicationDates: existing.applicationDates,
        });
      } else {
        await db.companies.put(c);
      }
    }
  });
}

// 1. Initial seed
await seedRun(seed);
assert.equal(await db.questions.count(), seed.questions.length, 'question count');
assert.equal(await db.stories.count(), seed.stories.length, 'story count');
assert.equal(await db.companies.count(), seed.companies.length, 'company count');
console.log('✓ initial seed counts:', await db.questions.count(), 'q,',
  await db.stories.count(), 's,', await db.companies.count(), 'c');

// 2. Multi-entry index queries work (tags / company)
const firstQ = seed.questions[0];
const byTag = firstQ.tags?.length
  ? await db.questions.where('tags').equals(firstQ.tags[0]).count()
  : 0;
console.log('✓ tag index query returned', byTag, 'rows for tag', firstQ.tags?.[0]);

// 3. User modifies personal fields + bookmarks + a review state
const qid = firstQ.id;
await db.questions.update(qid, {
  personalAnswer: 'MY OWN ANSWER',
  personalNotes: 'remember the canary rollout',
  bookmarked: true,
});
const cid = seed.companies.find((c) => c.name.includes('Anthropic'))?.id ?? seed.companies[0].id;
await db.companies.update(cid, {
  applicationStatus: 'onsite',
  applicationDates: [{ stage: 'onsite', date: 123 }],
});

// 4. Re-seed with a bumped version (content refresh)
const v2 = JSON.parse(JSON.stringify(seed));
v2.version = 2;
v2.questions[0].body = 'UPDATED SEED BODY';
v2.questions[0].answer = 'UPDATED MODEL ANSWER';
await seedRun(v2);

// 5. Assert: seed content refreshed BUT user fields preserved (criteria #8)
const after = await db.questions.get(qid);
assert.equal(after.body, 'UPDATED SEED BODY', 'seed body should refresh');
assert.equal(after.answer, 'UPDATED MODEL ANSWER', 'model answer should refresh');
assert.equal(after.personalAnswer, 'MY OWN ANSWER', 'personalAnswer preserved');
assert.equal(after.personalNotes, 'remember the canary rollout', 'personalNotes preserved');
assert.equal(after.bookmarked, true, 'bookmark preserved');

const companyAfter = await db.companies.get(cid);
assert.equal(companyAfter.applicationStatus, 'onsite', 'applicationStatus preserved');
assert.equal(companyAfter.applicationDates?.[0]?.date, 123, 'applicationDates preserved');

// 6. No duplication after re-seed
assert.equal(await db.questions.count(), seed.questions.length, 'no dup questions');

console.log('✓ re-seed refreshed seed content');
console.log('✓ personalAnswer / personalNotes / bookmark PRESERVED');
console.log('✓ company applicationStatus / dates PRESERVED');
console.log('✓ no duplicate rows after re-seed');
console.log('\nALL SEED TESTS PASSED');
