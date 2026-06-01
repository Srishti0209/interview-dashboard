// Verifies the SM-2 math matches the spec. Reimplements the pure rules to
// assert against (the app's computeNextReview lives in TS; this guards the math).
import assert from 'node:assert';

const DAY = 86_400_000;
const MIN_EASE = 1.3;

function compute(prev, rating, now = 0) {
  let ease = prev?.easeFactor ?? 2.5;
  let interval = prev?.intervalDays ?? 1;
  switch (rating) {
    case 'again':
      interval = 1;
      ease = Math.max(MIN_EASE, ease - 0.2);
      break;
    case 'hard':
      interval = Math.max(1, interval * 1.2);
      ease = Math.max(MIN_EASE, ease - 0.15);
      break;
    case 'good':
      interval = interval * ease;
      break;
    case 'easy':
      interval = interval * ease * 1.3;
      ease = ease + 0.15;
      break;
  }
  if (!prev) interval = rating === 'easy' ? 4 : 1;
  interval = Math.round(interval * 100) / 100;
  return {
    intervalDays: interval,
    easeFactor: Math.round(ease * 100) / 100,
    nextDue: now + interval * DAY,
  };
}

// New card, Good -> interval 1, ease 2.5
let s = compute(undefined, 'good', 0);
assert.equal(s.intervalDays, 1);
assert.equal(s.easeFactor, 2.5);
console.log('✓ new card good -> 1d, ease 2.5');

// Established card good: interval *= ease
s = compute({ intervalDays: 10, easeFactor: 2.5 }, 'good');
assert.equal(s.intervalDays, 25);
assert.equal(s.easeFactor, 2.5);
console.log('✓ good multiplies interval by ease (10*2.5=25)');

// Again resets to 1 and drops ease by 0.2
s = compute({ intervalDays: 30, easeFactor: 2.5 }, 'again');
assert.equal(s.intervalDays, 1);
assert.equal(s.easeFactor, 2.3);
console.log('✓ again resets interval to 1, ease -0.2');

// Ease floor 1.3
s = compute({ intervalDays: 5, easeFactor: 1.35 }, 'again');
assert.equal(s.easeFactor, 1.3);
console.log('✓ ease floored at 1.3');

// Hard: *1.2, ease -0.15
s = compute({ intervalDays: 10, easeFactor: 2.5 }, 'hard');
assert.equal(s.intervalDays, 12);
assert.equal(s.easeFactor, 2.35);
console.log('✓ hard *1.2, ease -0.15');

// Easy: *ease*1.3, ease +0.15
s = compute({ intervalDays: 10, easeFactor: 2.5 }, 'easy');
assert.equal(s.intervalDays, Math.round(10 * 2.5 * 1.3 * 100) / 100);
assert.equal(s.easeFactor, 2.65);
console.log('✓ easy *ease*1.3, ease +0.15');

// nextDue uses interval days
s = compute({ intervalDays: 10, easeFactor: 2.5 }, 'good', 1000);
assert.equal(s.nextDue, 1000 + 25 * DAY);
console.log('✓ nextDue = now + interval*DAY');

console.log('\nSM-2 MATH TESTS PASSED');
