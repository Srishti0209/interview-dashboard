// Prompts for the story bank and JD features. The API path sends
// system/context/user separately (so the stable parts are cached); the
// hand-off path joins them into one prompt that asks for a single JSON reply.
//
// Shared by the browser and the /api functions: no `@/` imports.
import { COMPETENCIES, CRITIQUE_DIMENSIONS, type JdReport, type Schema } from './schemas.js';
import { STAGES } from './stages.js';

export interface Candidate {
  /** e.g. "Senior Frontend Engineer" */
  targetRole: string;
  /** What they do today, e.g. "Software Engineer" (may be empty). */
  currentPosition: string;
}

export interface PromptParts {
  system: string;
  context: string;
  user: string;
}

/** A JSON skeleton of a schema, with descriptions as placeholder values. */
export function schemaTemplate(schema: Schema): unknown {
  switch (schema.type) {
    case 'string':
      return schema.enum ? schema.enum.join(' | ') : (schema.description ?? '…');
    case 'integer':
    case 'number':
      return schema.description ? `<number: ${schema.description}>` : 0;
    case 'boolean':
      return false;
    case 'array':
      return [schemaTemplate(schema.items)];
    case 'object':
      return Object.fromEntries(
        Object.entries(schema.properties).map(([k, v]) => [k, schemaTemplate(v)]),
      );
  }
}

/** Joins prompt parts into one prompt for the "Do it in Claude" hand-off. */
export function handOffPrompt(parts: PromptParts, schema: Schema): string {
  return [
    parts.system,
    parts.context,
    parts.user,
    '## How to reply',
    'Reply with ONE JSON object only, in a ```json code block, with exactly this shape (the values show what goes in each field):',
    '```json\n' + JSON.stringify(schemaTemplate(schema), null, 2) + '\n```',
    'Do not add any other text. If the reply would be too long, keep going until the JSON is complete.',
  ].join('\n\n');
}

const competencyList = COMPETENCIES.join(', ');

// ---------------------------------------------------------------------------
// Quick drafts from a resume
// ---------------------------------------------------------------------------
const RESUME_SYSTEM = `You help candidates prepare for behavioural interviews by turning their resume into draft interview stories and likely questions.

Ground rules:
- Use only facts stated in the resume. Never invent numbers, team sizes, outcomes, company details or names.
- When a story needs a fact the resume doesn't give (impact, scale, stakes, what went wrong, who was involved), leave it out of the story text and add a short, specific question to "gaps" instead, e.g. "Roughly how many customers did the outage affect?".
- Write in the first person ("I"), plain and specific. British English.
- Competencies ("bestFor") come from this list: ${competencyList}.`;

function resumeContext(resume: string, who: Candidate): string {
  return [
    `Target role: ${who.targetRole}`,
    who.currentPosition ? `Current position: ${who.currentPosition}` : '',
    '<resume>',
    resume.trim(),
    '</resume>',
  ]
    .filter(Boolean)
    .join('\n');
}

const PARSE_ASK = `Extract the resume's structure: each role (company, title, dates, highlights as written), skills, notable projects, and every number the resume states, verbatim.`;

const DRAFTS_ASK = `Draft 8 to 12 distinct interview stories from this resume, the strongest first. Pick achievements that suit behavioural questions for the target role, and spread them across different competencies (ownership, conflict, failure, leadership, impact and so on). Each story: a short memorable title; situation, task, action and result of one to three sentences each; metrics: only numbers the resume states for this achievement (e.g. "20% more conversions"), or empty if there are none, never a description; best-for competencies; topic tags; and the gaps the candidate must fill in to make the story strong.`;

const QUESTIONS_ASK = `Write 10 to 15 behavioural questions an interviewer for the target role would likely ask THIS candidate, based on their resume: e.g. "Walk me through your career", questions about specific roles, transitions, projects and achievements. For each: the question as asked, one or two sentences of context, an answer outline in Markdown (bullet points, naming which of the candidate's story titles to use where one fits), and tags (always include "resume").`;

export function resumePrompts(resume: string, who: Candidate, storyTitles: string[] = []) {
  const context = resumeContext(resume, who);
  const titles = storyTitles.length
    ? `\n\nThe candidate's draft stories are titled: ${storyTitles.map((t) => `"${t}"`).join(', ')}.`
    : '';
  return {
    parse: { system: RESUME_SYSTEM, context, user: PARSE_ASK },
    drafts: { system: RESUME_SYSTEM, context, user: DRAFTS_ASK },
    questions: { system: RESUME_SYSTEM, context, user: QUESTIONS_ASK + titles },
    /** All three in one go, for the hand-off. */
    all: {
      system: RESUME_SYSTEM,
      context,
      user: [
        'Do three things and return them together:',
        `1. "parsed": ${PARSE_ASK}`,
        `2. "stories": ${DRAFTS_ASK}`,
        `3. "questions": ${QUESTIONS_ASK} Use the story titles from step 2 in the outlines.`,
      ].join('\n'),
    },
  } satisfies Record<string, PromptParts>;
}

// ---------------------------------------------------------------------------
// Fixing unreadable characters in an extracted PDF resume
// ---------------------------------------------------------------------------
const READ_SYSTEM = `You correct text extracted from a resume PDF. The extractor could not read some characters and shows them as \uFFFD. Read the attached PDF to find what each one really is (often "+", "-", or a ligature such as "fi" or "ffi").

Rules:
- Return the whole text, with the same wording, line breaks and order as the extracted text.
- Only replace the \uFFFD characters. Do not reword, summarise, reorder, add or remove anything else.`;

export function resumeReadPrompts(extracted: string, handOff = false): PromptParts {
  return {
    system: READ_SYSTEM,
    context: `<extracted_text>\n${extracted}\n</extracted_text>`,
    user: handOff
      ? 'I have attached my resume PDF to this message. Fix the unreadable characters in the extracted text above.'
      : 'Fix the unreadable characters in the extracted text, using the attached PDF.',
  };
}

/**
 * Guards against a reply that rewrote the resume instead of fixing a few
 * characters: the length must stay close to the original.
 */
export function plausibleFix(original: string, fixed: string): boolean {
  const a = original.replace(/\s+/g, '').length;
  const b = fixed.replace(/\s+/g, '').length;
  return a > 0 && b >= a * 0.9 && b <= a * 1.15;
}

// ---------------------------------------------------------------------------
// Story Builder: interview chat and write-up
// ---------------------------------------------------------------------------

/** What the builder knows about the story before the interview. */
export interface StorySeed {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics: string;
  gaps: string[];
  /** Competency the story should show (coverage matrix / JD gap). */
  competency?: string;
}

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

const stageList = STAGES.map(
  (st, i) => `${i + 1}. ${st.title}: ${st.goal} A strong answer covers: ${st.covers.join('; ')}.`,
).join('\n');

const COACH_SYSTEM = `You are an experienced interview coach. You are helping a candidate build ONE behavioural interview story in depth, by interviewing them. The goal is a story with real stakes, clear ownership, decisions with the alternatives they rejected, honest obstacles, numbers, and a reflection: the kind that holds up when a senior interviewer digs in.

Work through these stages in order:
${stageList}

How to interview:
- Ask one question at a time (two short related ones at most). Keep each reply under 80 words.
- Briefly acknowledge what they said, then ask the next thing.
- When an answer is vague, probe for specifics: numbers, names of systems or technologies, the options they rejected, what THEY did versus the team. For example, "large codebase" deserves "roughly how many files, teams or brands?".
- If they seem stuck, offer a short example of the kind of answer you mean, tailored to their story, clearly as an example.
- Never invent facts about their story. Rough or estimated numbers are fine if they say so.
- Ask at most two questions per stage, then move on: a full interview should take about 12 to 16 answers. Never ask for something again once they've skipped it or said they don't know; it becomes a gap in the write-up.
- After stage ${STAGES.length}, tell them the story is ready and to press "Write up my story".
- End EVERY reply with the stage your question belongs to, like <stage>3</stage>, on its own at the very end.
- British English. Warm, direct, no filler.`;

function seedText(seed: StorySeed, targetRole: string): string {
  const lines = [
    `Target role: ${targetRole}`,
    seed.competency ? `This story should show: ${seed.competency}` : '',
    seed.title ? `Working title: ${seed.title}` : '',
  ];
  const draft = [
    seed.situation && `Situation: ${seed.situation}`,
    seed.task && `Task: ${seed.task}`,
    seed.action && `Action: ${seed.action}`,
    seed.result && `Result: ${seed.result}`,
    seed.metrics && `Metrics: ${seed.metrics}`,
  ].filter(Boolean);
  if (draft.length) lines.push('', 'What we have so far (a draft from their resume or notes):', ...draft);
  if (seed.gaps.length) lines.push('', 'Known gaps to fill:', ...seed.gaps.map((g) => `- ${g}`));
  return lines.filter((l) => l !== undefined).join('\n').trim();
}

/** Messages for one chat turn: the seed first (cached), then the transcript. */
export function coachPrompt(seed: StorySeed, targetRole: string, turns: Turn[], stage: number) {
  const first: Turn = {
    role: 'user',
    content: `${seedText(seed, targetRole)}\n\nPlease interview me to build this story.`,
  };
  const messages: Turn[] = [first, ...turns.map((t) => ({ ...t }))];
  // The transcript must end with the candidate speaking.
  const last = messages[messages.length - 1];
  if (last.role === 'user' && last !== first) {
    last.content += `\n\n[We are on stage ${stage}: ${STAGES[stage - 1]?.title ?? ''}.]`;
  }
  return { system: COACH_SYSTEM, messages };
}

const WRITE_SYSTEM = `You turn an interview transcript into a candidate's behavioural interview story, written in their voice (first person, "I"), ready to say out loud.

Rules:
- Use only facts from the transcript and the draft. Never invent numbers, names, outcomes, lessons or opinions. If something important is missing, leave it out of the story and add it to "gaps".
- The reflection must be the candidate's own lesson from the transcript. If they never gave one, leave "reflection" empty and add it to "gaps"; don't infer one.
- Keep to these word counts (spoken at about 150 words a minute): situation 35-45 words, task 20-30, the action beats 130-160 in total across two or three named beats (e.g. "Canary rollout system"), result 20-30, reflection 20-30. Cut detail to fit; the extra detail belongs in the deep-dive answers.
- Plain, specific, confident spoken English. British English. No buzzwords.
- deepDive: the five to eight follow-ups a senior interviewer is most likely to ask about THIS story, each answered in the candidate's voice from what they said. If the transcript doesn't support an answer, say what they should prepare instead.
- score: honest strength from 1 to 10 for a senior interview (specificity, ownership, decisions, numbers, reflection). 9-10 only if all are strong.
- bestFor: competencies from this list: ${competencyList}.
- short30: the whole story in about 30 seconds; long2min: about 2 minutes.`;

function transcriptText(turns: Turn[]): string {
  return turns.map((t) => `${t.role === 'user' ? 'Candidate' : 'Coach'}: ${t.content}`).join('\n\n');
}

export function writeUpPrompts(seed: StorySeed, targetRole: string, turns: Turn[]): PromptParts {
  return {
    system: WRITE_SYSTEM,
    context: `${seedText(seed, targetRole)}\n\n<transcript>\n${transcriptText(turns)}\n</transcript>`,
    user: 'Write up this story.',
  };
}

/**
 * The whole Story Builder as one prompt for claude.ai: Claude runs the staged
 * interview in that chat, then replies with the write-up as JSON.
 */
export function builderHandOffPrompt(seed: StorySeed, targetRole: string, schema: Schema): string {
  const coach = COACH_SYSTEM.replace(/\n- End EVERY reply[^\n]*/, '').replace(
    /tell them the story is ready and to press "Write up my story"/,
    'write up the story as described below',
  );
  return [
    coach,
    '## The story',
    seedText(seed, targetRole),
    '## When the interview is finished',
    `When stage ${STAGES.length} is done, or when I say "write it up", write up the story using these rules:`,
    WRITE_SYSTEM,
    'Reply with ONE JSON object only, in a ```json code block, with exactly this shape:',
    '```json\n' + JSON.stringify(schemaTemplate(schema), null, 2) + '\n```',
    'Start now with your first question.',
  ].join('\n\n');
}

// ---------------------------------------------------------------------------
// Story critic
// ---------------------------------------------------------------------------

/** The story as the critic sees it (plain fields plus the rich format). */
export interface CritiqueInput {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics: string;
  reflection?: string;
  beats?: { name: string; text: string }[];
  deepDive?: { question: string; answer: string }[];
}

const stageNames = STAGES.map((st, i) => `${i + 1} ${st.title}`).join('; ');

const CRITIC_SYSTEM = `You are a senior interviewer reviewing a candidate's behavioural interview story before they use it. Be honest and specific, as a good mentor would be: say what is strong, and exactly what is missing.

Score each of these dimensions from 1 to 10, with one sentence each, in this order: ${CRITIQUE_DIMENSIONS.join('; ')}.
- Specificity: concrete systems, scale, names of things, not generalities.
- Ownership: what the candidate personally decided and did ("I"), not "we".
- Metrics: before and after numbers, or honest estimates. Missing numbers cap this at 4.
- Stakes: why it mattered and what would have happened otherwise.
- Decisions and alternatives: the options weighed and why one won.
- Reflection: a real lesson and what they would do differently. Missing caps this at 3.
- Length and pacing: about 2 minutes spoken, situation and task short, most time on action.

Then give an overall score from 1 to 10 for a senior interview (9-10 only if everything is strong), and "toAdd": the three to six most valuable concrete additions or changes, most important first, phrased as instructions to the candidate (e.g. "Say roughly how many orders a day went through checkout").

fixStage: the Story Builder stage that would fix the biggest gap. Stages: ${stageNames}.

Never invent facts about their experience; point out what to add instead. British English.`;

function storyText(s: CritiqueInput): string {
  const action = s.beats?.length ? s.beats.map((b) => `${b.name}: ${b.text}`).join('\n') : s.action;
  return [
    `Title: ${s.title}`,
    `Situation: ${s.situation}`,
    `Task: ${s.task}`,
    `Action:\n${action}`,
    `Result: ${s.result}`,
    s.metrics && `Metrics: ${s.metrics}`,
    s.reflection && `Reflection: ${s.reflection}`,
    s.deepDive?.length && `Prepared follow-ups:\n${s.deepDive.map((q) => `Q: ${q.question}\nA: ${q.answer}`).join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function critiquePrompts(story: CritiqueInput, targetRole: string): PromptParts {
  return {
    system: CRITIC_SYSTEM,
    context: `Target role: ${targetRole}\n\n<story>\n${storyText(story)}\n</story>`,
    user: 'Review this story.',
  };
}

// ---------------------------------------------------------------------------
// JD gap analysis
// ---------------------------------------------------------------------------

export interface JdInput {
  company: string;
  title: string;
  text: string;
  values: string;
}
export interface JdStory {
  id: string;
  title: string;
  bestFor: string[];
  score?: number;
  summary: string;
}
export interface JdQuestion {
  id: string;
  round: string;
  title: string;
  practised: boolean;
}

const JD_SYSTEM = `You help a candidate prepare for a specific job. Compare the job description and the company's values with the candidate's story bank and question bank, and say exactly where they are under-prepared.

Return:
- parsed: the key skills, seniority, focus areas, likely interview rounds, and the values and behavioural competencies this company will assess (use the company's own wording for its values).
- storyGaps: one entry for EVERY value in company_values, in the order given and in the company's wording (do not merge, skip or rename any), then the JD's other key behavioural competencies that the values don't cover. If no values are given, use 5 to 8 competencies inferred from the JD. For each entry:
  - storyId: the candidate's best matching story, or empty if none fits. Match on what the story shows (its situation, actions and result), not only its "best for" labels: one story can serve several values.
  - otherStoryIds: up to 2 more stories that could also answer for this value, so the candidate has a back-up.
  - strength: how well the best story fits (strong, partial or missing).
  - advice: one or two sentences, e.g. what to emphasise in that story for this value, or what kind of story to build.
  - likelyQuestions: 2 or 3 behavioural questions this company would ask to test this value.
- roundPrep: one entry per likely interview round for this job (behavioural, coding, system design and so on). For each, the types of questions to expect given this JD (e.g. "frontend system design of a data-heavy dashboard", "React performance debugging") and 2 or 3 example questions.
- questionGaps: 3 to 6 topics from the JD where the candidate looks weakest, with a short reason and up to 8 ids from the question list worth practising (prefer ones not yet practised). Only use ids from the list.
- newQuestions: up to 8 questions this company is likely to ask that the question list doesn't already cover, each with a short Markdown answer outline and a round type from the given list.

Be concrete and honest. Never invent facts about the candidate. British English.`;

export function jdPrompts(
  jd: JdInput,
  stories: JdStory[],
  questions: JdQuestion[],
  roundTypes: string[],
  targetRole: string,
): PromptParts {
  const storyLines = stories.length
    ? stories.map((st) => `${st.id} | ${st.title} | best for: ${st.bestFor.join(', ') || '-'} | ${st.score ? st.score + '/10' : 'unscored'} | ${st.summary}`).join('\n')
    : '(no stories yet)';
  const questionLines = questions.map((q) => `${q.id} | ${q.round} | ${q.practised ? 'practised' : 'not practised'} | ${q.title}`).join('\n');
  return {
    system: JD_SYSTEM,
    context: [
      `Candidate's target role: ${targetRole}`,
      `<job company="${jd.company}" title="${jd.title}">\n${jd.text}\n</job>`,
      `<company_values>\n${jd.values || '(not given: infer the main behavioural competencies from the JD)'}\n</company_values>`,
      `<stories>\nid | title | best for | score | summary\n${storyLines}\n</stories>`,
      `<questions>\nid | round | status | title\n${questionLines}\n</questions>`,
      `Round types for new questions: ${roundTypes.join(', ')}`,
    ].join('\n\n'),
    user: 'Analyse my gaps for this job.',
  };
}

/**
 * Keeps a report's links to things the user really has: unknown story ids are
 * cleared, unknown question ids dropped, unknown round types defaulted.
 * Used by the API and the hand-off import.
 */
export function cleanJdReport(
  report: JdReport,
  known: { storyIds: Iterable<string>; questionIds: Iterable<string>; roundTypes: Iterable<string> },
): JdReport {
  const stories = new Set(known.storyIds);
  const questions = new Set(known.questionIds);
  const rounds = new Set(known.roundTypes);
  return {
    ...report,
    storyGaps: report.storyGaps.map((g) => {
      const storyId = stories.has(g.storyId) ? g.storyId : '';
      return {
        ...g,
        storyId,
        otherStoryIds: [...new Set(g.otherStoryIds ?? [])]
          .filter((id) => id !== storyId && stories.has(id))
          .slice(0, 2),
        likelyQuestions: (g.likelyQuestions ?? []).slice(0, 3),
      };
    }),
    roundPrep: (report.roundPrep ?? []).slice(0, 6).map((r) => ({
      ...r,
      questionTypes: r.questionTypes.slice(0, 5),
      examples: r.examples.slice(0, 3),
    })),
    questionGaps: report.questionGaps.map((g) => ({
      ...g,
      questionIds: g.questionIds.filter((id) => questions.has(id)).slice(0, 8),
    })),
    newQuestions: report.newQuestions.map((q) => ({
      ...q,
      roundType: rounds.has(q.roundType) ? q.roundType : 'BEHAVIORAL_BAR_RAISER',
    })),
  };
}
