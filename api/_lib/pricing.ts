// US dollars per million tokens (Anthropic API list prices, cached
// 2026-10-06). Used only for the admin cost estimate. ai_usage stores cached
// and uncached input together, so all input is priced at the full rate: the
// estimate can be a little high, never low.
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
};

/** Rows recorded before the model was logged: the task's default model. */
function defaultModel(endpoint: string): string {
  return /read|parse/.test(endpoint) ? 'claude-haiku-5-5' : 'claude-sonnet-5-5';
}

export function estimateCost(endpoint: string, model: string | null, tokensIn: number, tokensOut: number): number {
  const id = model && PRICES[model] ? model : defaultModel(endpoint);
  const p = PRICES[id] ?? PRICES['claude-sonnet-5-5'];
  return (tokensIn * p.input + tokensOut * p.output) / 1_000_000;
}
