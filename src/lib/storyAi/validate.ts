// Validates AI results against the schemas in schemas.ts. Used on API
// responses (defence in depth) and on replies pasted back from Claude, where
// the JSON may be wrapped in prose or a code fence.
import { LIMITS, type Schema } from './schemas.js';

export type Validated<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const MAX_ERRORS = 8;
const MAX_STRING = 8000;

/** Pulls the JSON object out of a pasted reply. */
export function parseReply(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) {
    return { ok: false, error: 'No JSON object found. Paste Claude’s full reply, including the { … } block.' };
  }
  try {
    return { ok: true, value: JSON.parse(body.slice(start, end + 1)) };
  } catch (e) {
    return {
      ok: false,
      error: `The JSON is incomplete or malformed (${(e as Error).message}). If Claude’s reply was cut off, ask it to "continue", then paste the whole JSON.`,
    };
  }
}

function check(schema: Schema, value: unknown, path: string, errors: string[]): unknown {
  if (errors.length >= MAX_ERRORS) return value;
  const where = path || 'reply';
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${where} should be text`);
        return value;
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${where} should be one of: ${schema.enum.join(', ')}`);
      }
      return value.length > MAX_STRING ? value.slice(0, MAX_STRING) : value;
    case 'integer':
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push(`${where} should be a number`);
        return value;
      }
      return schema.type === 'integer' ? Math.round(value) : value;
    case 'boolean':
      if (typeof value !== 'boolean') errors.push(`${where} should be true or false`);
      return value;
    case 'array': {
      if (!Array.isArray(value)) {
        errors.push(`${where} should be a list`);
        return value;
      }
      const key = path.split('.').pop() ?? '';
      const capped = key in LIMITS ? value.slice(0, LIMITS[key]) : value;
      return capped.map((v, i) => check(schema.items, v, `${path}[${i}]`, errors));
    }
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`${where} should be an object`);
        return value;
      }
      const input = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const name of schema.required) {
        if (!(name in input)) errors.push(`${path ? `${path}.` : ''}${name} is missing`);
      }
      // Unknown keys are dropped rather than rejected: harmless in a paste.
      for (const [name, sub] of Object.entries(schema.properties)) {
        if (name in input) out[name] = check(sub, input[name], path ? `${path}.${name}` : name, errors);
      }
      return out;
    }
  }
}

/** Checks a parsed value against a schema; caps list lengths and long text. */
export function validate<T>(schema: Schema, value: unknown): Validated<T> {
  const errors: string[] = [];
  const cleaned = check(schema, value, '', errors);
  return errors.length ? { ok: false, errors } : { ok: true, value: cleaned as T };
}

/** parseReply + validate, for the paste box. */
export function validateReply<T>(schema: Schema, text: string): Validated<T> {
  const parsed = parseReply(text);
  if (!parsed.ok) return { ok: false, errors: [parsed.error] };
  return validate<T>(schema, parsed.value);
}
