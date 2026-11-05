// Checks the story-AI validator (src/lib/storyAi/validate.ts) and that every
// canned fixture in api/_lib/fixtures.ts matches its schema. Pure Node: the
// TypeScript modules are loaded through Vite's SSR loader.
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});
let failed = 0;
const test = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${name}\n  ${e.message}`);
  }
};

try {
  const S = await vite.ssrLoadModule('/src/lib/storyAi/schemas.ts');
  const { validate, validateReply } = await vite.ssrLoadModule('/src/lib/storyAi/validate.ts');
  const { FIXTURES } = await vite.ssrLoadModule('/api/_lib/fixtures.ts');

  const pairs = {
    parse: S.resumeParsedSchema,
    drafts: S.draftsSchema,
    questions: S.questionsSchema,
    write: S.writeUpSchema,
    critique: S.critiqueSchema,
    jd: S.jdReportSchema,
  };
  for (const [task, schema] of Object.entries(pairs)) {
    await test(`fixture "${task}" matches its schema`, () => {
      const r = validate(schema, FIXTURES[task]);
      assert.ok(r.ok, JSON.stringify(r.errors));
    });
  }

  const good = JSON.stringify(FIXTURES.critique);
  await test('accepts plain JSON', () => assert.ok(validateReply(S.critiqueSchema, good).ok));
  await test('accepts JSON in a code fence with prose around it', () => {
    const text = 'Here is your critique:\n```json\n' + good + '\n```\nGood luck!';
    assert.ok(validateReply(S.critiqueSchema, text).ok);
  });
  await test('reports a missing field by name', () => {
    const { score, ...rest } = FIXTURES.critique;
    const r = validateReply(S.critiqueSchema, JSON.stringify(rest));
    assert.ok(!r.ok && r.errors.some((e) => e.includes('score is missing')), JSON.stringify(r));
  });
  await test('reports a wrong type with its path', () => {
    const bad = { ...FIXTURES.critique, dimensions: [{ name: 'x', score: 'high', note: '' }] };
    const r = validate(S.critiqueSchema, bad);
    assert.ok(!r.ok && r.errors.some((e) => e.includes('dimensions[0].score')), JSON.stringify(r));
  });
  await test('rejects a bad enum value', () => {
    const bad = structuredClone(FIXTURES.jd);
    bad.storyGaps[0].strength = 'great';
    assert.ok(!validate(S.jdReportSchema, bad).ok);
  });
  await test('explains truncated JSON', () => {
    const r = validateReply(S.critiqueSchema, good.slice(0, good.length - 1));
    assert.ok(!r.ok && /incomplete|No JSON/.test(r.errors[0]), JSON.stringify(r));
  });
  await test('says when there is no JSON at all', () => {
    const r = validateReply(S.critiqueSchema, 'Sure! What would you like?');
    assert.ok(!r.ok && r.errors[0].includes('No JSON'));
  });
  await test('caps list lengths and drops unknown keys', () => {
    const many = { stories: Array(20).fill(FIXTURES.drafts.stories[0]), extra: 1 };
    const r = validate(S.draftsSchema, many);
    assert.ok(r.ok);
    assert.equal(r.value.stories.length, 12);
    assert.equal('extra' in r.value, false);
  });
  await test('truncates oversize text', () => {
    const big = { ...FIXTURES.critique, toAdd: ['x'.repeat(20000)] };
    const r = validate(S.critiqueSchema, big);
    assert.ok(r.ok && r.value.toAdd[0].length === 8000);
  });
} finally {
  await vite.close();
}
console.log(failed ? `\n${failed} failed` : '\nAll passed');
process.exit(failed ? 1 : 0);
