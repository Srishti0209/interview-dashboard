export type RoundType =
  | 'BEHAVIORAL_BAR_RAISER'
  | 'JS_FUNDAMENTALS'
  | 'REACT_FRAMEWORK'
  | 'MACHINE_CODING'
  | 'FE_SYSTEM_DESIGN_COMPONENT'
  | 'FE_SYSTEM_DESIGN_APPLICATION'
  | 'AI_ASSISTED_CODING'
  | 'AI_PRODUCT_ENGINEERING'
  | 'PERFORMANCE_OPTIMIZATION'
  | 'CODE_REVIEW_DEBUG'
  | 'BACKEND_ADJACENT'
  | 'ARCHITECTURE_TECH_LEAD'
  // Product Owner rounds
  | 'PRODUCT_SENSE'
  | 'PRIORITIZATION_ROADMAP'
  | 'STAKEHOLDER_AGILE'
  | 'METRICS_ANALYTICS'
  | 'TECHNICAL_FLUENCY'
  // Backend rounds
  | 'DSA_CODING'
  | 'BE_SYSTEM_DESIGN'
  | 'API_DESIGN'
  | 'DATABASES_STORAGE'
  | 'DISTRIBUTED_SYSTEMS'
  | 'CONCURRENCY'
  | 'RELIABILITY_OPERATIONS'
  | 'SECURITY'
  // Frontend rounds
  | 'TYPESCRIPT'
  | 'HTML_CSS'
  | 'ACCESSIBILITY'
  | 'BROWSER_WEB_PLATFORM'
  | 'STATE_DATA_FETCHING'
  | 'TESTING'
  // Full Stack rounds
  | 'FULLSTACK_SYSTEM_DESIGN'
  | 'FULLSTACK_FEATURE_BUILD'
  | 'FULLSTACK_ARCHITECTURE'
  // AI Engineer rounds
  | 'ML_LLM_FUNDAMENTALS'
  | 'PROMPT_ENGINEERING'
  | 'LLM_SYSTEMS_RAG'
  | 'AGENTS_TOOLS'
  | 'EVALS_SAFETY'
  | 'FINE_TUNING'
  | 'LLM_OPS_SERVING'
  | 'AI_SYSTEM_DESIGN'
  | 'AI_CODING';

export type Difficulty = 'easy' | 'medium' | 'hard';
/** seed = shared bank; user = written by the user; ai = generated from their resume or a JD. */
export type Source = 'seed' | 'user' | 'ai';
export type Confidence = 0 | 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  roundType: RoundType;
  title: string;
  body: string; // markdown — the question prompt
  answer?: string; // markdown — seeded playbook/model answer
  difficulty: Difficulty;
  company?: string[];
  tags: string[];
  source: Source;
  /** Target roles this question is for (shared bank only). */
  roleFamilies?: RoleFamily[];

  // PERSONAL FIELDS — owned by the user, never overwritten by re-seed:
  personalAnswer?: string;
  personalNotes?: string;
  bookmarked?: boolean;

  createdAt: number;
  updatedAt: number;
}

export interface ReviewState {
  questionId: string;
  confidence: Confidence;
  lastReviewed?: number;
  nextDue: number;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
}

export interface Note {
  id: string;
  title: string;
  bodyJson: object; // Tiptap JSON document
  tags: string[];
  linkedQuestionIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Story {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics: string;
  applicableTo: string[];
  tags: string[];
  /** Absent on stories written by hand before Phase 6. */
  source?: 'ai' | 'user';
  /** AI draft the user hasn't reviewed yet. */
  isDraft?: boolean;
  resumeId?: string | null;
  details?: StoryDetails;
}

/** One action beat, e.g. "Migration architecture". */
export interface StoryBeat {
  name: string;
  text: string;
}

export interface DeepDiveItem {
  question: string;
  answer: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Story Builder progress, kept so a session can be resumed. */
export interface StoryBuilderState {
  stage: number;
  turns: ChatTurn[];
  /** Competency the story was started for (coverage matrix / JD gap). */
  seed?: string;
}

export interface StoryCritique {
  score: number;
  dimensions: { name: string; score: number; note: string }[];
  toAdd: string[];
  /** Builder stage (1-based) that would fix the biggest gap. */
  fixStage?: number;
  createdAt: number;
}

/** Rich story format (stories.details). Every field is optional. */
export interface StoryDetails {
  score?: number;
  bestFor?: string[];
  beats?: StoryBeat[];
  reflection?: string;
  deepDive?: DeepDiveItem[];
  people?: string;
  whatWentWrong?: string;
  short30?: string;
  long2min?: string;
  /** Facts the user still needs to fill in. */
  gaps?: string[];
  builder?: StoryBuilderState;
  critique?: StoryCritique;
}

export type Archetype =
  | 'ai_lab'
  | 'ai_scaleup'
  | 'fintech'
  | 'big_tech'
  | 'product_led';

export type AiPolicy =
  | 'encouraged'
  | 'allowed_take_home'
  | 'banned_live'
  | 'mixed';

export type ApplicationStatus =
  | 'not_applied'
  | 'applied'
  | 'phone_screen'
  | 'onsite'
  | 'offer'
  | 'rejected'
  | 'declined';

export interface Company {
  id: string;
  name: string;
  location: string;
  archetype: Archetype;
  loopStructure: string; // markdown
  notes: string; // markdown
  aiPolicy: AiPolicy;
  links: { label: string; url: string }[];
  applicationStatus?: ApplicationStatus;
  applicationNotes?: string;
  applicationDates?: { stage: string; date: number }[];
}

export interface MockSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  roundTypes: RoundType[];
  companyId?: string;
  selfRating?: number;
  notes?: string;
}

export interface SeedData {
  version: number;
  generatedAt: number;
  questions: Question[];
  stories: Story[];
  companies: Company[];
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------
export type RoleFamily =
  | 'product_owner'
  | 'backend'
  | 'frontend'
  | 'fullstack'
  | 'ai';

export type RoleLevel = 'mid' | 'senior' | 'staff';

export interface Profile {
  id: string;
  displayName: string | null;
  currentPosition: string | null;
  targetRoleFamily: RoleFamily | null;
  targetLevel: RoleLevel | null;
  onboarded: boolean;
  /** Can edit the shared question bank (set in the database only). */
  isAdmin: boolean;
  activeResumeId: string | null;
}

/** A job the user is preparing for (the JD page). */
export interface JobDescription {
  id: string;
  company: string;
  title: string;
  rawText: string;
  companyValues: string;
  fileName: string | null;
  interviewDate: string | null;
  /** From the gap analysis: skills, seniority, focus areas, rounds, values. */
  parsed: JobParsed | null;
  gaps: JobGaps | null;
  createdAt: string;
}

export interface JobParsed {
  skills: string[];
  seniority: string;
  focusAreas: string[];
  likelyRounds: string[];
  values: string[];
}

export interface JobGaps {
  storyGaps: {
    value: string;
    storyId: string;
    /** Back-up stories for the value (missing on older reports). */
    otherStoryIds?: string[];
    strength: 'strong' | 'partial' | 'missing';
    advice: string;
    likelyQuestions?: string[];
  }[];
  questionGaps: { topic: string; reason: string; questionIds: string[] }[];
  /** Question types to expect per round (missing on older reports). */
  roundPrep?: { round: string; questionTypes: string[]; examples: string[] }[];
  /** Ids of questions written for this job. */
  newQuestionIds: string[];
  analysedAt: number;
}

export interface Resume {
  id: string;
  fileName: string | null;
  storagePath: string | null;
  extractedText: string;
  /** Structure read from the resume by the quick-drafts run (null until then). */
  parsed: Record<string, unknown> | null;
  createdAt: string;
}
