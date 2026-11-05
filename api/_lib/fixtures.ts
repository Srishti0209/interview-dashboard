// Canned AI results for AI_FIXTURE=1 (local dev and smoke tests). Each one
// must validate against its schema in src/lib/storyAi/schemas.ts; see
// scripts/test-story-validate.mjs.
import type {
  CritiqueResult,
  DraftsResult,
  JdReport,
  QuestionsResult,
  ResumeParsed,
  StoryWriteUp,
} from '../../src/lib/storyAi/schemas.js';
import type { Task } from './claude.js';

const parse: ResumeParsed = {
  roles: [
    {
      company: 'Shopwise',
      title: 'Senior Software Engineer',
      start: '2021',
      end: 'present',
      highlights: [
        'Led the checkout rewrite to a new framework across 4 brands',
        'Cut p95 page load from 3.1s to 1.4s',
      ],
    },
    {
      company: 'Ledgerly',
      title: 'Software Engineer',
      start: '2018',
      end: '2021',
      highlights: ['Built the payments reconciliation service'],
    },
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  projects: ['Checkout rewrite', 'Reconciliation service'],
  metrics: ['p95 3.1s to 1.4s', '4 brands'],
};

const drafts: DraftsResult = {
  stories: [
    {
      title: 'Checkout rewrite across four brands',
      situation: 'At Shopwise the checkout ran on an ageing framework shared by four brands.',
      task: 'I led the rewrite without disrupting live revenue.',
      action: 'I sequenced the migration brand by brand and rolled it out gradually behind a traffic split.',
      result: 'All four brands moved to the new checkout.',
      metrics: '4 brands',
      bestFor: ['Ownership', 'Delivery under pressure'],
      tags: ['migration', 'checkout'],
      gaps: ['How much revenue went through checkout?', 'What went wrong during rollout?'],
    },
    {
      title: 'Halving page load time',
      situation: 'Customers on mobile were abandoning slow product pages.',
      task: 'I owned the performance work for the product page.',
      action: 'I profiled the page, removed render-blocking scripts and split the bundle.',
      result: 'p95 load fell from 3.1s to 1.4s.',
      metrics: 'p95 3.1s to 1.4s',
      bestFor: ['Impact and metrics', 'Technical depth'],
      tags: ['performance'],
      gaps: ['Did conversion change?', 'Who did you work with?'],
    },
    {
      title: 'Payments reconciliation service',
      situation: 'Finance reconciled payments by hand at Ledgerly.',
      task: 'I built the service that automated it.',
      action: 'I designed the matching rules with finance and built an idempotent pipeline.',
      result: 'Manual reconciliation was replaced.',
      metrics: '',
      bestFor: ['Customer focus'],
      tags: ['payments'],
      gaps: ['How many hours a week did it save?', 'What was the hardest edge case?'],
    },
  ],
};

const questions: QuestionsResult = {
  questions: [
    {
      title: 'Walk me through your career so far.',
      body: 'Asked at the start of most behavioural rounds.',
      answer:
        '- Ledgerly: payments reconciliation (story: **Payments reconciliation service**)\n- Shopwise: checkout rewrite and performance (stories: **Checkout rewrite across four brands**, **Halving page load time**)\n- Close with why this role is the next step.',
      tags: ['resume', 'career'],
    },
    {
      title: 'Tell me about the checkout rewrite at Shopwise.',
      body: 'The interviewer will dig into how you de-risked it.',
      answer: 'Use **Checkout rewrite across four brands**. Lead with the stakes (live revenue), then the gradual rollout.',
      tags: ['resume', 'migration'],
    },
  ],
};

const write: StoryWriteUp = {
  title: 'Checkout rewrite across four brands',
  score: 8,
  bestFor: ['Ownership', 'Delivery under pressure', 'Disagree and commit'],
  situation:
    'At Shopwise I led the checkout rewrite for our four brands. Checkout carried all of our revenue, ran on a framework that was out of support, and any downtime cost us sales by the minute.',
  task: 'I owned the migration plan and the go-live decision, with the CTO signing off each phase.',
  beats: [
    {
      name: 'Sequencing by revenue',
      text: 'I ranked the brands by revenue and risk and migrated the smallest first, with a parity tracker so we always knew what was left.',
    },
    {
      name: 'Gradual traffic split',
      text: 'Instead of a big-bang switch I routed 5% of sessions to the new checkout and compared revenue per session, not raw totals, before each step up.',
    },
    {
      name: 'Making risk visible',
      text: 'I turned the plan into a one-page go/no-go view for the CTO, with clear rollback triggers.',
    },
  ],
  result: 'All four brands moved over with no checkout outage, and each phase had a clear decision point.',
  reflection:
    'The lesson was that migrations are trust problems as much as technical ones. Next time I would get analytics to instrument the go/no-go metric before the first traffic shift.',
  metrics: '4 brands, 5% starting split',
  deepDive: [
    {
      question: 'Why a traffic split rather than feature flags?',
      answer: 'Flags test code paths, but not the whole stack. A split tested real traffic through the CDN, third-party scripts and payments.',
    },
    {
      question: 'How did you pick 5%?',
      answer: 'Small enough that a bad bug was cheap, big enough to get a meaningful signal within a few days.',
    },
    {
      question: 'What went wrong?',
      answer: 'A caching difference only showed up at 5%; we caught it before scaling up.',
    },
    {
      question: 'Who else was involved?',
      answer: 'QA owned testing, analytics provided conversion data, and the CTO made each phase call.',
    },
    {
      question: 'What would you do differently?',
      answer: 'Instrument the decision metric before the first traffic shift.',
    },
  ],
  people: 'QA team (testing), analytics (conversion data), CTO (phase sign-off).',
  whatWentWrong: 'A caching difference surfaced only under real traffic at 5%.',
  short30:
    'I led our checkout rewrite across four brands. Rather than a big-bang switch, I rolled it out from 5% of traffic, comparing revenue per session at each step, and we moved every brand with no outage.',
  long2min:
    'At Shopwise, checkout carried all our revenue and ran on an unsupported framework. I owned the migration and the go-live plan. I sequenced brands by revenue and risk, built a parity tracker, and rolled out behind a traffic split starting at 5%, comparing revenue per session rather than raw totals. I gave the CTO a one-page go/no-go view with rollback triggers. All four brands moved with no outage. The lesson: migrations are trust problems as much as technical ones.',
  gaps: ['Revenue at stake per day'],
  tags: ['migration', 'checkout', 'rollout'],
};

const critique: CritiqueResult = {
  score: 7,
  dimensions: [
    { name: 'Specificity', score: 8, note: 'Concrete steps and numbers.' },
    { name: 'Ownership ("I" not "we")', score: 8, note: 'Clear about your decisions.' },
    { name: 'Metrics', score: 5, note: 'No business impact figure yet.' },
    { name: 'Stakes', score: 7, note: 'Revenue risk is clear but not quantified.' },
    { name: 'Decisions and alternatives', score: 8, note: 'Good comparison with feature flags.' },
    { name: 'Reflection', score: 7, note: 'Honest and specific.' },
    { name: 'Length and pacing', score: 7, note: 'Action runs slightly long.' },
  ],
  toAdd: ['Quantify the revenue at stake per day', 'Say what happened to conversion after the move'],
  fixStage: 6,
};

const jd: JdReport = {
  parsed: {
    skills: ['TypeScript', 'React', 'System design', 'Mentoring'],
    seniority: 'Senior',
    focusAreas: ['Checkout and payments', 'Web performance'],
    likelyRounds: ['Behavioural', 'System design', 'Coding'],
    values: ['Customer obsession', 'Ownership', 'Disagree and commit'],
  },
  storyGaps: [
    {
      value: 'Ownership',
      storyId: '',
      otherStoryIds: [],
      strength: 'partial',
      advice: 'Your checkout story fits; deepen it with the revenue at stake.',
      likelyQuestions: ['Tell me about a time you owned a problem outside your remit.'],
    },
    {
      value: 'Disagree and commit',
      storyId: '',
      otherStoryIds: [],
      strength: 'missing',
      advice: 'Build a story about a decision you argued against but then fully backed.',
      likelyQuestions: ['Tell me about a decision you disagreed with but supported.'],
    },
  ],
  roundPrep: [
    {
      round: 'System design',
      questionTypes: ['Checkout and payment flows', 'Resilience to third-party outages'],
      examples: ['Design a checkout page that survives a payment provider outage.'],
    },
  ],
  questionGaps: [
    {
      topic: 'Payments system design',
      reason: 'The JD stresses payments, and you have not practised payment design questions.',
      questionIds: [],
    },
  ],
  newQuestions: [
    {
      title: 'How would you design checkout to survive a payment provider outage?',
      body: 'Asked for senior roles on payments-heavy teams.',
      answer: '- Multiple providers behind an interface\n- Idempotency keys\n- Queue and retry with clear user messaging',
      roundType: 'BE_SYSTEM_DESIGN',
      tags: ['payments', 'resilience'],
    },
  ],
};

export const FIXTURES: Record<Task, unknown> = {
  parse,
  read: null, // resume-read builds its fixture from the request
  drafts,
  questions,
  chat: null, // chat streams FIXTURE_CHAT_REPLY instead
  write,
  critique,
  jd,
};

export const FIXTURE_CHAT_REPLY =
  'Thanks, that gives me the context. What was at stake if this went wrong? For example: "Checkout carried about £40k of revenue an hour, so even ten minutes of downtime was visible to the CEO."';
