import type {
  RoundType,
  Difficulty,
  Archetype,
  AiPolicy,
  ApplicationStatus,
} from '@/types';

export const ROUND_TYPES: RoundType[] = [
  'BEHAVIORAL_BAR_RAISER',
  'JS_FUNDAMENTALS',
  'REACT_FRAMEWORK',
  'MACHINE_CODING',
  'FE_SYSTEM_DESIGN_COMPONENT',
  'FE_SYSTEM_DESIGN_APPLICATION',
  'AI_ASSISTED_CODING',
  'AI_PRODUCT_ENGINEERING',
  'PERFORMANCE_OPTIMIZATION',
  'CODE_REVIEW_DEBUG',
  'BACKEND_ADJACENT',
  'ARCHITECTURE_TECH_LEAD',
];

export const ROUND_LABEL: Record<RoundType, string> = {
  BEHAVIORAL_BAR_RAISER: 'Behavioral / Bar Raiser',
  JS_FUNDAMENTALS: 'JS Fundamentals',
  REACT_FRAMEWORK: 'React & Framework',
  MACHINE_CODING: 'Machine Coding',
  FE_SYSTEM_DESIGN_COMPONENT: 'FE System Design — Component',
  FE_SYSTEM_DESIGN_APPLICATION: 'FE System Design — Application',
  AI_ASSISTED_CODING: 'AI-Assisted Coding',
  AI_PRODUCT_ENGINEERING: 'AI Product Engineering',
  PERFORMANCE_OPTIMIZATION: 'Performance Optimization',
  CODE_REVIEW_DEBUG: 'Code Review & Debug',
  BACKEND_ADJACENT: 'Backend-Adjacent',
  ARCHITECTURE_TECH_LEAD: 'Architecture / Tech Lead',
};

// Tailwind utility classes per round type (used for pills). Light + dark.
export const ROUND_COLOR: Record<RoundType, string> = {
  BEHAVIORAL_BAR_RAISER:
    'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  JS_FUNDAMENTALS:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  REACT_FRAMEWORK:
    'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  MACHINE_CODING:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  FE_SYSTEM_DESIGN_COMPONENT:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  FE_SYSTEM_DESIGN_APPLICATION:
    'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  AI_ASSISTED_CODING:
    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  AI_PRODUCT_ENGINEERING:
    'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  PERFORMANCE_OPTIMIZATION:
    'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  CODE_REVIEW_DEBUG:
    'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  BACKEND_ADJACENT:
    'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300',
  ARCHITECTURE_TECH_LEAD:
    'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  ai_lab: 'AI Lab',
  ai_scaleup: 'AI Scale-up',
  fintech: 'Fintech',
  big_tech: 'Big Tech',
  product_led: 'Product-Led',
};

export const AI_POLICY_LABEL: Record<AiPolicy, string> = {
  encouraged: 'AI Encouraged',
  allowed_take_home: 'AI Allowed (take-home)',
  banned_live: 'AI Banned (live)',
  mixed: 'AI Mixed',
};

export const AI_POLICY_COLOR: Record<AiPolicy, string> = {
  encouraged:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  allowed_take_home:
    'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  banned_live:
    'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  mixed: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'not_applied',
  'applied',
  'phone_screen',
  'onsite',
  'offer',
  'rejected',
  'declined',
];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  not_applied: 'Not Applied',
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  onsite: 'Onsite',
  offer: 'Offer',
  rejected: 'Rejected',
  declined: 'Declined',
};

export const APPLICATION_STATUS_COLOR: Record<ApplicationStatus, string> = {
  not_applied: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700/40 dark:text-zinc-300',
  applied: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  phone_screen:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  onsite: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  offer:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  declined: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700/40 dark:text-zinc-400',
};
