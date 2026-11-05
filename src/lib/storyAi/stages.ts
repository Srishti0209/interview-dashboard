// The Story Builder's interview stages: what each one is for, what a strong
// answer covers, and a sample answer. The samples all come from one made-up
// story (a payment-provider migration) so users can see what "specific"
// looks like at every stage. Shared by the browser and the /api functions.

export interface Stage {
  title: string;
  /** What this stage pins down, for the coach prompt. */
  goal: string;
  covers: string[];
  /** The coach's opening question for the stage. */
  ask: string;
  sample: string;
}

export const STAGES: Stage[] = [
  {
    title: 'Context and stakes',
    goal: 'Where and when this happened, what the product or business was, and what was at stake.',
    covers: [
      'Company, team and roughly when',
      'What the product or system did, and its scale',
      'What was at stake: money, customers, a deadline, reputation',
      'Why it mattered right then',
    ],
    ask: 'Set the scene for me: where were you, what was the product, and what was at stake if this went wrong?',
    sample:
      'At a travel booking company, checkout handled about £2m of bookings a day. Our payment provider was shutting down in six months, so if we didn’t migrate we’d lose the ability to take payments at all.',
  },
  {
    title: 'Your role and ownership',
    goal: 'What the candidate personally owned and decided, as opposed to the team.',
    covers: [
      'Your title and what you owned',
      'What was yours versus the team’s',
      'Who you worked with or reported to on it',
      'Why it landed with you',
    ],
    ask: 'What exactly was your role? What did you own and decide yourself, and what did others handle?',
    sample:
      'I was the senior frontend engineer and owned the migration plan end to end. Two engineers worked with me, and the head of engineering signed off each phase.',
  },
  {
    title: 'Key decisions and alternatives',
    goal: 'The two or three decisions that shaped the outcome, the options considered and why one won. These become the action beats.',
    covers: [
      'Two or three decisions that shaped the outcome',
      'The options you weighed for each',
      'Why you chose what you chose',
      'The trade-offs you accepted',
    ],
    ask: 'What were the big decisions you made along the way? For the most important one, what options did you consider, and why did you pick the one you did?',
    sample:
      'The big decision was how to switch over: a big-bang cutover or sending a small share of traffic to the new provider first. Big-bang was faster but all-or-nothing, so I chose a 5% split we could ramp up, and roll back in minutes.',
  },
  {
    title: 'Obstacles and what went wrong',
    goal: 'The hardest problem, what broke or surprised them, and how they recovered, including their own mistakes.',
    covers: [
      'The hardest problem you hit',
      'Something that broke or surprised you',
      'How you diagnosed it and recovered',
      'A mistake you made, and what you did about it',
    ],
    ask: 'What was the hardest part, or something that went wrong? How did you find out, and what did you do?',
    sample:
      'At 5% we saw card checks failing for one bank. I traced it to a redirect URL mismatch, paused the ramp for two days and added an automated check for each card type before resuming.',
  },
  {
    title: 'People and stakeholders',
    goal: 'Who else was involved, how the candidate aligned or persuaded them, and any disagreement.',
    covers: [
      'Who else was involved, by role',
      'How you got people aligned or persuaded them',
      'A disagreement, and how you handled it',
      'How you kept people informed',
    ],
    ask: 'Who else was involved, and how did you bring them along? Was there any disagreement?',
    sample:
      'Finance wanted to switch in one weekend to save fees. I showed them the revenue at risk per hour of downtime, and we agreed weekly go/no-go reviews with clear rollback triggers.',
  },
  {
    title: 'Numbers and result',
    goal: 'The measurable outcome: before and after figures, timescale and business impact. Honest estimates are fine if labelled.',
    covers: [
      'The measurable outcome, with before and after figures',
      'How long it took',
      'The business impact',
      'If you don’t have exact numbers, an honest estimate',
    ],
    ask: 'How did it turn out? What numbers can you put on it, even rough ones?',
    sample:
      'We finished two weeks early with zero checkout downtime, and payment success rose from 94% to 96.5%, roughly £50k a month in recovered bookings.',
  },
  {
    title: 'Reflection',
    goal: 'What the candidate learned, what they would do differently, and how they have applied it since.',
    covers: [
      'What you learned',
      'What you’d do differently next time',
      'How you’ve used that lesson since',
    ],
    ask: 'Looking back, what did you learn, and what would you do differently?',
    sample:
      'I learned that migrations are trust problems as much as technical ones. Next time I’d get analytics to agree the go/no-go metric before the first traffic shift, rather than building it in parallel.',
  },
  {
    title: 'Deep-dive rehearsal',
    goal: 'Rehearse the follow-up questions a senior interviewer would ask about this story.',
    covers: [
      'Why this approach over the obvious alternatives',
      'How you measured success',
      'A technical detail you can explain clearly',
      'What you’d do with more time',
    ],
    ask: 'Let’s rehearse the follow-ups an interviewer would ask. First one: why did you choose that approach over the obvious alternative?',
    sample:
      'Q: Why not just use feature flags? A: Flags test code paths, but not the whole payment flow. A traffic split tested real cards, banks and redirects end to end.',
  },
];

/** The first message of a new Story Builder session (written locally, free). */
export function openingMessage(title: string, seed?: string): string {
  const what = title.trim()
    ? `Let’s turn “${title.trim()}” into a story you can tell with confidence.`
    : seed
      ? `Let’s build a story that shows ${seed.toLowerCase()}.`
      : 'Let’s build a story you can tell with confidence.';
  return `${what} I’ll ask a few questions at a time, stage by stage. Short, specific answers work best, and rough numbers are fine.\n\n${STAGES[0].ask}`;
}

/** Strips the coach's trailing stage marker; returns the stage it named. */
export function parseStageMarker(text: string): { text: string; stage?: number } {
  const m = text.match(/<stage>\s*(\d+)\s*<\/stage>\s*$/);
  if (!m) {
    // Mid-stream: hide a marker that has only partly arrived ("<sta", "<stage>3").
    const at = text.lastIndexOf('<');
    const tail = at === -1 ? '' : text.slice(at);
    const partial = tail && ('<stage>'.startsWith(tail) || tail.startsWith('<stage>') || '</stage>'.startsWith(tail));
    const open = text.lastIndexOf('<stage>');
    const cut = open !== -1 && !text.slice(open).includes('</stage>') ? open : partial ? at : text.length;
    return { text: text.slice(0, cut).trimEnd() };
  }
  const n = Number(m[1]);
  return {
    text: text.slice(0, m.index).trimEnd(),
    stage: n >= 1 && n <= STAGES.length ? n : undefined,
  };
}
