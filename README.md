# Interview Prep PWA

A Progressive Web App for software engineering interview preparation. Each
user signs in, picks the role they're preparing for (Product Owner, Backend,
Frontend, Full Stack or AI Engineer at mid, senior or staff level), and gets a
question bank, story bank, notes, company playbooks and mock interviews
tailored to that role. Optional Claude-powered features help turn a resume into
STAR stories, critique them, and analyse a job description for gaps.

Data is stored in the user's account (Supabase, protected by row-level
security) and cached on the device, so the app keeps working offline and syncs
when it's back online.

## Requirements

- **Node 24** (an `.nvmrc` pins it). The shell on this machine defaults to
  Node 14, which can't run Vite 8 or React 19, so run `nvm use` before any
  command.
- A **Supabase** project (database and auth).
- A **Claude API key**, only if you want the AI features to make real calls.

## Getting started

```bash
nvm use            # -> Node 24
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev        # http://localhost:5173
```

```bash
npm run build      # type-check + production build (PWA service worker + manifest)
npm run preview    # serve the production build
npm run lint       # eslint
```

### Setting up `.env.local`

Create `.env.local` in the project root (it's git-ignored, so your keys never
get committed) with at least these four values:

```bash
# Supabase: Dashboard → your project → Project Settings → API
VITE_SUPABASE_URL=https://<project-ref>.supabase.co   # "Project URL"
VITE_SUPABASE_ANON_KEY=<anon / publishable key>       # "anon public" key
SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key> # "service_role" key

# Claude: https://console.anthropic.com → API Keys → Create Key
CLAUDE_API_KEY=sk-ant-...
```

- **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** are used by the
  browser to sign in and read data. They're safe to expose because row-level
  security limits each user to their own data.
- **`SUPABASE_SERVICE_ROLE_KEY`** bypasses row-level security. It's used only
  by the server functions (to record AI usage) and by the scripts in `scripts/`
  (loading content, resetting the smoke-test account). Keep it secret and never
  prefix it with `VITE_`, or Vite will bundle it into the browser code.
- **`CLAUDE_API_KEY`** is used only by the server functions in `api/ai/`. The
  app runs without it: AI features are hidden, and the dev server's test mode
  still works. Real calls are billed to your Anthropic account, so set daily
  caps with `AI_DAILY_LIMITS` if others use the app.

Restart the dev server after changing `.env.local`; Vite reads it only at
start-up. On Vercel, add the same values under Project → Settings →
Environment Variables.

### Environment variables

The full list (see `.env.example`):

| Variable | Where it's used | Notes |
|----------|-----------------|-------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Browser | Safe to expose; data is protected by row-level security |
| `SUPABASE_SERVICE_ROLE_KEY` | Server functions, scripts | Never prefix with `VITE_` |
| `CLAUDE_API_KEY` | Server functions | Needed for real AI calls |
| `AI_FIXTURE` | Dev server | AI calls return canned sample replies unless `AI_FIXTURE=0` |
| `AI_DAILY_LIMITS` | Server functions | Optional per-user daily caps, e.g. `resume=3,chat=150,jd=5`, or `off` |
| `AI_MODEL_*` | Server functions | Optional per-task model overrides (defaults in `api/_lib/claude.ts`) |
| `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `SMOKE_ACCOUNT_IS_DISPOSABLE` | Smoke tests | A dedicated test account; see [Tests](#tests--verification) |

### Database

Apply the migrations in `supabase/migrations/` in order (`0001` → `0004`) to
your Supabase project, then load the shared content:

```bash
node scripts/content/build-questions.mjs   # Markdown -> content/questions/<role>.json
node scripts/content/load-seed.mjs         # upsert questions, companies and playbooks
```

Re-loading shared content never touches users' own data (answers, notes,
review history and so on).

## AI features and test mode

AI features run through server functions in `api/ai/` (Vercel functions in
production, served by a small Vite plugin in development). The API key never
reaches the browser.

**The dev server runs in test mode by default**: every AI call returns a canned
sample reply and costs nothing. Screens show "Test mode: sample report, no AI
call" when this is the case. To make real calls locally:

```bash
AI_FIXTURE=0 npm run dev
```

| Feature | Where | What it does |
|---------|-------|--------------|
| Stories from resume | Story Bank, Account | Reads a resume and drafts STAR stories |
| Story Builder | `/stories/:id/build` | Chat that builds a story step by step |
| Story critic | Story detail | Scores a story and suggests what to add |
| Job analysis | `/jobs/:id` | Compares a job description and company values with your stories and questions: best and back-up stories per value, likely questions, question types per round, topics to practise, and new questions added to your bank |
| Fix with Claude | Resume upload | Repairs characters a PDF couldn't be read correctly |

Most features also have a "Do it in Claude instead" hand-off: copy a prompt into
Claude, paste the reply back, and it's imported the same way. Usage is recorded
per user and capped daily.

## What's inside

| Area | Route | Notes |
|------|-------|-------|
| Sign in / onboarding | `/` | Email link or password; onboarding asks for current role, target role and level, and a resume |
| Dashboard | `/` | Due-today queue, stats, confidence histogram, streak, active prep mode |
| Question Bank | `/questions` | Filter sidebar, search, list / cards / study-deck views, 10 per page, J/K navigation |
| Question detail | `/questions/:id` | My Answer / Model Answer / Notes tabs, autosave, spaced-repetition review |
| Add question | `/my-questions/new` | Create and edit your own questions (⌘N) |
| Notepad | `/notes` | Tiptap editor: code, KaTeX maths, Mermaid, callouts, tables, images, question references, slash commands, Markdown/ZIP export |
| Story Bank | `/stories` | STAR stories, coverage matrix, story matcher, AI builder and critic |
| Companies | `/companies` | Interview playbooks, AI-policy badges, application status timeline, research notes |
| Jobs | `/jobs` | Saved job descriptions with company values and AI gap analysis |
| Mock Interview | `/mock` | Timed multi-round mock, scratchpad, self-rating, history |
| Settings | `/settings` | Theme, font size, review tuning, export/import JSON, reload shared content |
| Account | `/account` | Name, email, current and target role, resume, sign out |

Keyboard: `⌘K` command palette · `⌘N` new question · `⌘⇧N` new note ·
`J/K` move in list · `Enter` open · `1–4` review (Again/Hard/Good/Easy) ·
`E` edit · `B` bookmark.

### Question banks

Model answers are written in Markdown under `content/src/<role>/` and built
into `content/questions/<role>.json`. Each question has metadata lines (`id`,
`roles`, `round`, `difficulty`, `levels`, `tags`), a prompt, and a long-form
answer with 11 sections (what the interviewer is testing, key points, model
answer, a second worked example, framework, strong versus weak answer, useful
phrases, pitfalls, follow-ups, what senior interviewers look for, practice).
Behavioural answers use sample stories for you to replace with your own.

| Role | Questions |
|------|-----------|
| Frontend | 231 |
| Backend | 124 |
| Product Owner | 112 |
| Full Stack | 75 own, plus shared frontend and backend questions |
| AI Engineer | Currently shares AI-related frontend questions; a dedicated bank is in progress |

## Architecture

- **React 19 + TypeScript (strict)**, **Vite 8**, **Tailwind v4** with
  shadcn-style components, **React Router v7**, **Zustand** for UI state.
- **Supabase** for auth and Postgres, with row-level security on every user
  table. Migrations live in `supabase/migrations/`.
- **TanStack Query** for server data, persisted to IndexedDB so the app starts
  and works offline. Writes update the cache immediately and go through an
  offline write queue (`src/lib/sync.ts`) that retries in order and survives
  reloads.
- **Server functions** in `api/` (Vercel) for AI calls, using the Anthropic
  SDK. Claude replies are checked against JSON schemas
  (`src/lib/storyAi/schemas.ts`) before they're saved.
- **Tiptap v3** notes editor with custom Callout, QuestionReference and Mermaid
  nodes and a slash-command menu; **KaTeX**, **lowlight** and **Mermaid**
  (lazy-loaded).
- Heavy routes (Notes, Mock) are code-split.

## Tests / verification

Pure-Node logic tests:

```bash
node scripts/test-sm2.mjs             # spaced-repetition maths
node scripts/test-load-seed.mjs       # reloading shared content never touches user data
node scripts/test-story-validate.mjs  # AI reply validation and fixtures
node scripts/test-pdf-layout.mjs      # PDF text rebuilt in reading order
```

Browser smoke tests use Playwright with the installed Google Chrome
(`channel: 'chrome'`). They sign in as the `SMOKE_EMAIL` account and **wipe its
data before each run**, so use a dedicated test account and set
`SMOKE_ACCOUNT_IS_DISPOSABLE=yes`. Never point them at a real account.

Run a dev server in test mode on a spare port, then run the smokes against it:

```bash
AI_FIXTURE=1 AI_DAILY_LIMITS= npx vite --port 5184 --strictPort
SMOKE_URL=http://localhost:5184 node scripts/smoke.mjs
```

| Script | Covers |
|--------|--------|
| `smoke.mjs` | Question bank, detail tabs, answer persistence |
| `smoke-signin.mjs` | Sign-in form, session survives reload, sign out |
| `smoke-onboarding.mjs` | Onboarding, account page, resume upload (PDF, DOCX, text) |
| `smoke-cloud.mjs` | Data saved to the account and synced |
| `smoke-roles.mjs` | Role-specific banks, round filters, mock round picker |
| `smoke-phase4.mjs` | Create, edit and delete your own questions |
| `smoke-phase5.mjs` | Review → spaced-repetition state, streak, due queue |
| `smoke-phase6.mjs` | Notes editor blocks and links |
| `smoke-phase7.mjs` | Story bank and matcher |
| `smoke-phase8.mjs` | Company status timeline |
| `smoke-phase9.mjs` | Timed mock and history |
| `smoke-phase10.mjs` | Command palette, shortcuts, theme |
| `smoke-settings.mjs` | Export → wipe → import round trip |
| `smoke-regressions.mjs` | Autosave targets the right question, hidden answers, note timestamps |
| `smoke-stories-ai.mjs` | Stories from resume, Fix with Claude |
| `smoke-story-builder.mjs` | Story Builder chat and hand-off |
| `smoke-story-critic.mjs` | Story critic and coverage matrix |
| `smoke-jobs.mjs` | Job descriptions and gap analysis |
| `smoke-pwa.mjs` | Service worker and offline start (against `npm run preview`) |

## Deployment

The app deploys to **Vercel**: the static build plus the functions in `api/`
(see `vercel.json`). Set the environment variables above in the Vercel project.

## Backup

Your data lives in your account and is available on any device you sign in on.
For an offline copy, use **Settings → Export all (JSON)**; **Import** restores
it.
