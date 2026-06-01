# Interview Prep PWA

A local-first Progressive Web App for senior frontend / AI Product Engineer
interview preparation. Single user, no backend — everything persists in
IndexedDB and works fully offline after first load.

## Requirements

- **Node 18+ (Node 24 recommended).** This machine's shell defaults to Node 14,
  which can't run Vite 8 / React 19. Run `nvm use` (an `.nvmrc` pins 24) before
  any command.

## Getting started

```bash
nvm use            # -> Node 24
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # production build (PWA service worker + manifest)
npm run preview    # serve the production build
npm run lint       # eslint
```

## What's inside

| Area | Route | Notes |
|------|-------|-------|
| Dashboard | `/` | Due-today queue, stats, confidence histogram, streak, active prep mode |
| Question Bank | `/questions` | Filter sidebar, search, list/cards/study-deck views, J/K nav |
| Question detail | `/questions/:id` | My Answer / Model Answer / Notes tabs, autosave, SM-2 review, Practice-with-AI |
| Add question | `/my-questions/new` | Create + edit user questions (⌘N) |
| Notepad | `/notes` | Tiptap block editor: code, KaTeX math, Mermaid, callouts, tables, images, question references, slash commands, markdown/ZIP export |
| Story Bank | `/stories` | STAR stories + tag-overlap story matcher |
| Companies | `/companies` | Loop playbooks, AI-policy badges, application status timeline, research notes |
| Mock Interview | `/mock` | Timed multi-round mock, scratchpad, self-rating, history |
| Settings | `/settings` | Theme, font size, SM-2 tuning, export/import JSON, reset-to-seed |

Keyboard: `⌘K` command palette · `⌘N` new question · `⌘⇧N` new note ·
`J/K` move in list · `Enter` open · `1–4` review (Again/Hard/Good/Easy) ·
`E` edit · `B` bookmark.

## Architecture

- **React 19 + TypeScript (strict)**, **Vite 8**, **Tailwind v4** + shadcn-style
  components, **React Router v7**, **Zustand** (UI state), **Dexie** (IndexedDB).
- **Tiptap v3** notes editor with custom Callout / QuestionReference / Mermaid
  nodes and a slash-command menu; **KaTeX** math, **lowlight** code highlighting,
  **Mermaid** diagrams (lazy-loaded).
- Data layer in `src/lib/*` (`db`, `seed`, `questions`, `notes`, `stories`,
  `companies`, `mock`, `sm2`, `backup`). Live queries via `dexie-react-hooks`.
- Seed content loads from `/public/seed/seed.json`; re-seeding **preserves all
  user-owned fields** (`personalAnswer`, `personalNotes`, bookmarks, notes,
  application status, mock history).
- Heavy routes (Notes, Mock) are code-split; the initial JS bundle is ~235 KB
  gzipped.

## Tests / verification

Headless checks driven against the real Google Chrome via Playwright
(`channel: 'chrome'`), plus pure-Node logic tests:

```bash
node scripts/test-seed.mjs        # Dexie schema + re-seed preservation (fake-indexeddb)
node scripts/test-sm2.mjs         # SM-2 interval/ease math

# browser smokes (run `npm run dev -- --port 5182` first, or set SMOKE_URL)
node scripts/smoke.mjs            # bank, detail tabs, answer persistence
node scripts/smoke-phase4.mjs     # create / edit / delete user questions
node scripts/smoke-phase5.mjs     # review -> SM-2 state, streak, due queue
node scripts/smoke-phase6.mjs     # notes editor blocks + bidirectional links
node scripts/smoke-phase7.mjs     # story bank + matcher
node scripts/smoke-phase8.mjs     # company status timeline
node scripts/smoke-phase9.mjs     # timed mock + history
node scripts/smoke-phase10.mjs    # command palette, shortcuts, theme
node scripts/smoke-settings.mjs   # export / import round-trip + reset preserves
node scripts/smoke-pwa.mjs        # (against `npm run preview`) SW + offline boot
```

## Backup

All data lives in this browser's IndexedDB. Use **Settings → Export all (JSON)**
regularly; **Import** restores an exact copy. There is no cross-device sync.
