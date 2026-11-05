// Shapes of every AI result in the story bank and JD features, as TypeScript
// types plus the JSON Schemas sent to the Claude API (structured outputs) and
// used to validate replies pasted back from the "Do it in Claude" hand-off.
//
// Shared by the browser and the /api functions: keep this file free of `@/`
// imports and browser or Node APIs.

/** Standard behavioural competencies (coverage matrix, best-for tags). */
export const COMPETENCIES = [
  'Ownership',
  'Leadership',
  'Conflict',
  'Failure',
  'Influence without authority',
  'Ambiguity',
  'Customer focus',
  'Delivery under pressure',
  'Technical depth',
  'Mentoring',
  'Prioritisation',
  'Learning fast',
  'Disagree and commit',
  'Impact and metrics',
] as const;

// ---------------------------------------------------------------------------
// JSON Schema subset (what structured outputs support; see validate.ts)
// ---------------------------------------------------------------------------
export type Schema =
  | { type: 'string'; enum?: readonly string[]; description?: string }
  | { type: 'integer' | 'number' | 'boolean'; description?: string }
  | { type: 'array'; items: Schema; description?: string }
  | {
      type: 'object';
      properties: Record<string, Schema>;
      required: string[];
      additionalProperties: false;
      description?: string;
    };

const str = (description?: string): Schema => ({ type: 'string', description });
const int = (description?: string): Schema => ({ type: 'integer', description });
const arr = (items: Schema, description?: string): Schema => ({
  type: 'array',
  items,
  description,
});
/** An object whose properties are all required. */
function obj(properties: Record<string, Schema>, description?: string): Schema {
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
    description,
  };
}

// ---------------------------------------------------------------------------
// Quick drafts from a resume
// ---------------------------------------------------------------------------
export interface ResumeParsed {
  roles: {
    company: string;
    title: string;
    start: string;
    end: string;
    highlights: string[];
  }[];
  skills: string[];
  projects: string[];
  metrics: string[];
}

export interface DraftStory {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics: string;
  bestFor: string[];
  tags: string[];
  /** Facts the resume doesn't give; the user must fill them in. */
  gaps: string[];
}

export interface ResumeQuestion {
  title: string;
  body: string;
  /** Markdown answer outline that points at the user's stories. */
  answer: string;
  tags: string[];
}

export interface DraftsResult {
  stories: DraftStory[];
}
export interface QuestionsResult {
  questions: ResumeQuestion[];
}
/** The hand-off returns all three steps in one object. */
export interface QuickDraftsResult {
  parsed: ResumeParsed;
  stories: DraftStory[];
  questions: ResumeQuestion[];
}

export const resumeParsedSchema = obj({
  roles: arr(
    obj({
      company: str(),
      title: str(),
      start: str('e.g. "2021-03" or "2021"; empty if unknown'),
      end: str('"present" for a current role; empty if unknown'),
      highlights: arr(str(), 'Achievements as written on the resume'),
    }),
  ),
  skills: arr(str()),
  projects: arr(str()),
  metrics: arr(str(), 'Numbers stated on the resume, verbatim'),
});

const draftStorySchema = obj({
  title: str('Short, memorable story name'),
  situation: str(),
  task: str(),
  action: str(),
  result: str(),
  metrics: str('Only numbers stated on the resume; empty if none'),
  bestFor: arr(str(), 'Competencies from the standard list'),
  tags: arr(str()),
  gaps: arr(str(), 'Questions the candidate must answer to complete this story'),
});

const resumeQuestionSchema = obj({
  title: str('The question as an interviewer would ask it'),
  body: str('One or two sentences of context for the question'),
  answer: str('Markdown answer outline that refers to story titles'),
  tags: arr(str()),
});

export const draftsSchema = obj({ stories: arr(draftStorySchema) });
export const questionsSchema = obj({ questions: arr(resumeQuestionSchema) });
export const quickDraftsSchema = obj({
  parsed: resumeParsedSchema,
  stories: arr(draftStorySchema),
  questions: arr(resumeQuestionSchema),
});

// ---------------------------------------------------------------------------
// Fixing unreadable characters in an extracted PDF resume
// ---------------------------------------------------------------------------
export interface ResumeReadResult {
  text: string;
}

export const resumeReadSchema = obj({
  text: str('The full resume text with every \uFFFD replaced by the right character(s)'),
});

// ---------------------------------------------------------------------------
// Story Builder write-up (rich format)
// ---------------------------------------------------------------------------
export interface StoryWriteUp {
  title: string;
  score: number;
  bestFor: string[];
  situation: string;
  task: string;
  beats: { name: string; text: string }[];
  result: string;
  reflection: string;
  metrics: string;
  deepDive: { question: string; answer: string }[];
  people: string;
  whatWentWrong: string;
  short30: string;
  long2min: string;
  gaps: string[];
  tags: string[];
}

export const writeUpSchema = obj({
  title: str(),
  score: int('Overall strength from 1 to 10'),
  bestFor: arr(str()),
  situation: str('About 15 seconds spoken (35-45 words)'),
  task: str('About 10 seconds spoken (25-30 words)'),
  beats: arr(
    obj({ name: str('Beat name, e.g. "Canary rollout system"'), text: str() }),
    'Two or three action beats, about 60 seconds in total',
  ),
  result: str('About 10 seconds spoken'),
  reflection: str('About 10 seconds spoken: the lesson and what you would change'),
  metrics: str(),
  deepDive: arr(
    obj({ question: str(), answer: str() }),
    'Five to eight likely follow-up questions with first-person answers',
  ),
  people: str('Who else was involved and what they did'),
  whatWentWrong: str(),
  short30: str('The whole story in about 30 seconds'),
  long2min: str('The whole story in about 2 minutes'),
  gaps: arr(str(), 'Facts still missing; empty if none'),
  tags: arr(str()),
});

// ---------------------------------------------------------------------------
// Story critique
// ---------------------------------------------------------------------------
export interface CritiqueResult {
  score: number;
  dimensions: { name: string; score: number; note: string }[];
  toAdd: string[];
  fixStage: number;
}

export const CRITIQUE_DIMENSIONS = [
  'Specificity',
  'Ownership ("I" not "we")',
  'Metrics',
  'Stakes',
  'Decisions and alternatives',
  'Reflection',
  'Length and pacing',
] as const;

export const critiqueSchema = obj({
  score: int('Overall strength from 1 to 10'),
  dimensions: arr(
    obj({ name: str(), score: int('1 to 10'), note: str('One sentence') }),
  ),
  toAdd: arr(str(), 'Concrete things to add or change, most important first'),
  fixStage: int('Story Builder stage (1-8) that would fix the biggest gap'),
});

// ---------------------------------------------------------------------------
// JD gap analysis
// ---------------------------------------------------------------------------
export interface JdReport {
  parsed: {
    skills: string[];
    seniority: string;
    focusAreas: string[];
    likelyRounds: string[];
    values: string[];
  };
  storyGaps: {
    value: string;
    /** Id of the best matching story, or empty when none fits. */
    storyId: string;
    /** Back-up story ids for the same value. */
    otherStoryIds: string[];
    strength: 'strong' | 'partial' | 'missing';
    advice: string;
    likelyQuestions: string[];
  }[];
  roundPrep: { round: string; questionTypes: string[]; examples: string[] }[];
  questionGaps: {
    topic: string;
    reason: string;
    /** Existing question ids worth practising for this topic. */
    questionIds: string[];
  }[];
  newQuestions: {
    title: string;
    body: string;
    answer: string;
    roundType: string;
    tags: string[];
  }[];
}

export const jdReportSchema = obj({
  parsed: obj({
    skills: arr(str()),
    seniority: str(),
    focusAreas: arr(str()),
    likelyRounds: arr(str()),
    values: arr(str(), 'Company values and key behavioural competencies'),
  }),
  storyGaps: arr(
    obj({
      value: str(),
      storyId: str('Id of the best matching story from the list, or empty'),
      otherStoryIds: arr(str(), 'Up to 2 more story ids from the list that could also answer for this value'),
      strength: { type: 'string', enum: ['strong', 'partial', 'missing'] },
      advice: str(),
      likelyQuestions: arr(str(), '2 or 3 behavioural questions an interviewer would ask to test this value'),
    }),
  ),
  roundPrep: arr(
    obj({
      round: str('A likely interview round, e.g. System design'),
      questionTypes: arr(str(), 'The kinds of questions to expect in this round for this job'),
      examples: arr(str(), '2 or 3 example questions'),
    }),
  ),
  questionGaps: arr(
    obj({
      topic: str(),
      reason: str(),
      questionIds: arr(str(), 'Ids from the question list only'),
    }),
  ),
  newQuestions: arr(
    obj({
      title: str(),
      body: str(),
      answer: str('Markdown answer outline'),
      roundType: str('One of the round types given'),
      tags: arr(str()),
    }),
  ),
});

/** Array length caps applied after validation (the API can't enforce them). */
export const LIMITS: Record<string, number> = {
  stories: 12,
  questions: 15,
  beats: 3,
  deepDive: 8,
  newQuestions: 10,
};
