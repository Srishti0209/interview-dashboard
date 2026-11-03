// Builds content/questions/<role>.json from the Markdown sources in
// content/src/<role>/*.md (format: content/README.md).
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROLES = ['product_owner', 'backend', 'frontend', 'fullstack', 'ai'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LEVELS = ['mid', 'senior', 'staff'];

const list = (v) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

function parseFile(path, role) {
  const text = readFileSync(path, 'utf8');
  const blocks = text.split(/^## (?!#)/m).slice(1);
  return blocks.map((block) => {
    const [titleLine, ...rest] = block.split('\n');
    const body = rest.join('\n');
    const meta = {};
    for (const line of body.split('\n')) {
      const m = line.match(/^- (\w+):\s*(.*)$/);
      if (m) meta[m[1]] = m[2].trim();
      else if (line.startsWith('### ')) break;
    }
    const prompt = body.match(/^### Prompt\s*\n([\s\S]*?)^### Answer\s*$/m)?.[1].trim();
    const answer = body.match(/^### Answer\s*\n([\s\S]*)$/m)?.[1].trim();
    const title = titleLine.trim();
    const where = `${path}: "${title}"`;
    if (!meta.id) throw new Error(`${where} has no id`);
    if (!meta.round) throw new Error(`${where} has no round`);
    if (!DIFFICULTIES.includes(meta.difficulty)) throw new Error(`${where} has a bad difficulty`);
    if (!prompt || !answer) throw new Error(`${where} needs ### Prompt and ### Answer`);
    const levels = list(meta.levels);
    for (const l of levels) if (!LEVELS.includes(l)) throw new Error(`${where} has a bad level "${l}"`);
    return {
      id: meta.id,
      roleFamilies: meta.roles ? list(meta.roles) : [role],
      levels,
      roundType: meta.round,
      title,
      body: prompt,
      answer,
      difficulty: meta.difficulty,
      company: list(meta.companies),
      tags: list(meta.tags),
    };
  });
}

mkdirSync('content/questions', { recursive: true });
const seen = new Set();
for (const role of ROLES) {
  const dir = join('content/src', role);
  if (!existsSync(dir)) continue;
  const questions = readdirSync(dir)
    .filter((f) => /^\d.*\.md$/.test(f)) // content files only (not CATALOGUE.md)
    .sort()
    .flatMap((f) => parseFile(join(dir, f), role));
  for (const q of questions) {
    if (seen.has(q.id)) throw new Error(`Duplicate id ${q.id}`);
    seen.add(q.id);
  }
  writeFileSync(`content/questions/${role}.json`, JSON.stringify(questions, null, 2) + '\n');
  console.log(`✓ ${role}: ${questions.length} questions`);
}
