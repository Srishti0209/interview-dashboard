import { ROUND_LABEL } from '@/lib/constants';
import type { Question } from '@/types';

/** Builds an interview-practice prompt for a given question. */
export function buildPracticePrompt(q: Question): string {
  return [
    `Act as a senior interviewer for a ${ROUND_LABEL[q.roundType]} round.`,
    `Interview me on the following question, one step at a time. Ask me to respond, then probe my answer with follow-ups and push on edge cases. Do not give away the model answer until I ask.`,
    ``,
    `Question: ${q.title}`,
    ``,
    q.body,
  ].join('\n');
}

export function claudeUrl(prompt: string): string {
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
}

export function chatgptUrl(prompt: string): string {
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}
