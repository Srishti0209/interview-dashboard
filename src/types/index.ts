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
  | 'ARCHITECTURE_TECH_LEAD';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Source = 'seed' | 'user';
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
