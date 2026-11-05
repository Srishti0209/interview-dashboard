# Frontend Engineer — Architecture & Tech Leadership

## You're brought into a team where the codebase is a mess. 30+ engineers, no tests, mixed React versions, three state libraries. What's your 90-day plan?
- id: 56074a4d-f7fb-4367-bbf2-bfb7c44bb4fb
- roles: frontend, fullstack, ai
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels:
- companies: Anthropic, OpenAI, Stripe
- tags: leadership, staff-level, change-management

### Prompt
You join as a senior or staff frontend engineer. The codebase is a mess: 30+ engineers contribute, there are almost no tests, several React versions across packages, three different state management libraries, slow builds and frequent production incidents. Leadership wants improvement without stopping feature work. What's your 90-day plan?

### Answer
#### What the interviewer is really testing
- Whether you **listen and diagnose before prescribing**: understanding why the codebase got this way and what actually hurts the business.
- **Prioritisation by impact and risk**, not by personal taste ("rewrite it in my favourite stack").
- **Incremental change** that coexists with feature delivery: guardrails, strangler patterns, golden paths.
- **Influence without authority**: building consensus, getting buy-in from engineers, product and leadership, and making progress visible.
- **Measurement**: baselines and metrics that show improvement.

#### Key points
- **Days 1–30: listen, measure, earn trust.**
  - 1:1s with engineers, tech leads, product managers, support and on-call; ask what slows them down and what breaks.
  - Read incident reports, CI history, bug tracker, analytics; ship a few small changes yourself to learn the workflow.
  - Baseline metrics: build and CI time, deploy frequency, change failure rate, incidents and their causes, Core Web Vitals, bundle size, test coverage of critical flows, time from PR open to merge.
  - Map the architecture: packages, React versions, the three state libraries and where each is used, ownership.
  - Find **quick wins** that build credibility (speed up CI, fix the top incident cause, remove a flaky deploy step).
- **Days 31–60: decide and set guardrails.**
  - Write a **technical strategy doc / RFCs** with a target architecture and a migration path, reviewed widely.
  - **Stop the bleeding**: CI checks (TypeScript, lint, a smoke E2E suite on critical journeys), required reviews, error monitoring with alerts.
  - **Pick one standard** for new code (e.g. TanStack Query for server state, Zustand or context for the rest) and document a golden path; don't migrate everything at once.
  - Add **tests where risk is highest**: E2E for checkout/login, integration tests for the most incident-prone areas.
  - Align **React versions** via a dependency plan (shared version in the monorepo, upgrade the lowest first).
- **Days 61–90: execute incrementally and make progress visible.**
  - Migrate the **highest-churn, highest-incident** areas first (strangler pattern); "boy scout" rule for touched code.
  - Dashboards for metrics; monthly updates to leadership.
  - Grow **champions** in each team; working groups for the state library migration and testing.
  - Plan the next two quarters with explicit capacity (e.g. 15–20% for platform work).
- **Avoid:** a big-bang rewrite, mandating changes without buy-in, focusing on aesthetics over business impact, trying to fix everything at once.

#### Model answer
"I'd resist the temptation to start fixing things in week one. A codebase gets like this for reasons: deadlines, team growth, missing ownership. If I don't understand those, I'll fix symptoms and lose the team's trust.

**Days 1 to 30: listen and measure.** I'd have 1:1s with as many engineers as I can, plus tech leads, product managers, on-call and support, asking what slows them down, what breaks most, and what they'd fix first. I'd read the last few months of incident reports and the bug tracker, and look at CI history. I'd also ship small fixes myself to feel the pain directly.

Then I'd baseline metrics: CI and build times, deploy frequency, how often deploys cause incidents, the top incident causes, PR cycle time, Core Web Vitals and bundle size, and whether the critical journeys like login and checkout have any automated tests. I'd map which React versions and which state libraries are used where, and who owns what.

I'd also look for a couple of quick wins that matter to people: maybe CI takes 40 minutes and caching gets it to 15, or one fragile module causes half the incidents. Early, visible wins earn the credibility needed for bigger changes.

**Days 31 to 60: decide together and add guardrails.** I'd write a technical strategy with a target state and a migration path, and share it as an RFC for feedback, so it's the team's plan, not mine. Typical decisions:
- **Stop the bleeding first:** TypeScript and lint in CI, error monitoring with alerts, and a small, reliable E2E suite covering the five journeys that make money.
- **One standard for new code:** for example, TanStack Query for server state, and a single small store for client state. The three existing libraries stay until we migrate them; the rule is no new usage, enforced by lint.
- **React versions:** consolidate on one version through the package manager, upgrading the oldest packages first, behind tests.
- **Tests where risk is:** integration tests for the most incident-prone areas, not a coverage target.
- **Golden path docs:** how to build a new feature the right way, with templates and examples.

**Days 61 to 90: execute incrementally and show progress.** Migrations happen area by area, starting where churn and incidents are highest, using a strangler approach so features keep shipping. I'd agree a capacity share with product, perhaps 15 to 20 percent per team, and set up working groups with a champion from each team. A dashboard tracks the baseline metrics, and I'd send a short monthly update to leadership: CI time down from 40 to 12 minutes, incidents from deploys down by half, E2E coverage of all critical journeys.

**What I wouldn't do:** propose a rewrite, mandate changes without discussion, or chase consistency for its own sake. Every change should connect to something the business feels: fewer incidents, faster delivery, better performance."

#### Another worked example
**A real-shaped 90-day outcome (B2B SaaS, 35 engineers).**
```
Baseline (week 3):  CI 42 min · 18 prod incidents/quarter (60% from 2 modules) · 0 E2E tests
                    React 16/17/18 across 9 packages · Redux + MobX + Context-heavy store
Day 45:  CI 14 min (caching, parallel jobs) · Sentry alerts · 6 E2E journeys in CI
         RFC accepted: TanStack Query + Zustand for new code, lint rule bans new MobX/Redux slices
Day 90:  React 18 everywhere · top-incident module covered by integration tests and partly migrated
         Incidents trending to 7/quarter · PR cycle time 3.1 → 1.8 days · golden-path template used by 4 teams
```

#### A third worked example
**When the 'mess' was organisational.** At another company, the real cause was that no team owned shared code: everyone added to a shared `components` folder, nobody maintained it. Technical fixes kept regressing until ownership was assigned (a small design-system team plus CODEOWNERS) and a contribution process existed. The lesson I'd share: diagnose people and process, not just code.

#### Variations you might be asked
- "What would you do in your first 30 days as tech lead?"
- "How do you get buy-in for technical debt work?"
- "How do you migrate three state libraries to one?"

#### Step-by-step framework
1. **Listen**: 1:1s across roles, incidents, tracker, ship small things.
2. **Measure**: baseline delivery, quality, performance metrics.
3. **Quick wins** that matter to people.
4. **Strategy as an RFC**: target state and migration path, reviewed widely.
5. **Guardrails**: CI checks, monitoring, critical-path E2E, lint rules banning legacy patterns.
6. **Incremental migration** by churn and incident risk, with agreed capacity.
7. **Visible progress**: dashboards and leadership updates.
8. **Scale through people**: champions, working groups, golden paths.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Rewrite it in Next.js and Zustand" | Diagnose, prioritise, migrate incrementally |
| Mandates standards on day one | Builds consensus with an RFC |
| Coverage target of 80% | Tests on critical, incident-prone flows first |
| No metrics | Baselines and progress dashboards |
| Ignores product | Negotiates capacity and ties work to business impact |

#### Useful phrases
- "First I want to understand why it got this way."
- "Stop the bleeding, then improve the patient."
- "New code follows the standard; old code migrates when we touch it or when it hurts."
- "Every improvement connects to incidents, speed or user experience."

#### Common pitfalls
- **Big-bang rewrites** that stall feature work and never finish.
- **Changing everything at once** and burning out the team.
- **Ignoring culture and ownership**.
- **No measurement**, so progress is invisible.
- **Solo heroics** instead of building champions.

#### Follow-ups to expect (with sample answers)
- **"How do you convince product to give you capacity?"** — "Show the cost of the status quo in their terms: incidents, slower delivery, customer complaints, and propose a bounded, measurable investment."
- **"What if senior engineers disagree with your plan?"** — "Involve them early, make them co-authors of the RFC, run small experiments, and be willing to change my mind."
- **"How do you handle a team that keeps adding to the legacy library?"** — "Lint rules that block new usage, a clear golden path, and helping them with their first migration."
- **"What's your first technical change?"** — "Usually CI reliability and speed, or error monitoring, because everything else depends on fast, trustworthy feedback."
- **"How do you know the plan worked?"** — "The baseline metrics improve, and engineers report it's easier to ship."

#### What senior interviewers look for
- **Diagnosis before prescription**.
- **Leverage**: guardrails and standards that scale beyond you.
- **Influence and communication** across engineering and product.
- **Measured, incremental** delivery.

#### Practise it
- Write a one-page 30/60/90 plan for a codebase you know, with three metrics.
- If you've led a clean-up or migration, prepare it as a STAR story with baseline and result numbers; if not, prepare one about improving a smaller area.
- Checklist: listen · baseline · quick wins · RFC · guardrails · one standard for new code · risk-based tests · incremental migration · capacity agreement · dashboards · champions.

## How do you decide build vs buy?
- id: ca8a7fe1-1348-47cf-8efd-833be871ee1b
- roles: frontend, fullstack, ai
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels:
- tags: leadership, decision-making

### Prompt
Your team needs a capability: for example a rich text editor, feature flags, authentication, a charting library, or a full design system. How do you decide whether to build it yourselves, buy a commercial product, or adopt an open-source library? Walk through the criteria and how you'd make and communicate the decision.

### Answer
#### What the interviewer is really testing
- A **structured, repeatable framework** rather than gut feeling or "not invented here".
- Distinguishing **core differentiators** (build) from **commodities** (buy or adopt).
- Thinking about **total cost of ownership** over years, not just initial effort.
- Evaluating **risk**: vendor lock-in, security and compliance, maintenance health of open source, exit strategy.
- **Decision hygiene**: time-boxed spikes, written decision records, revisiting decisions.

#### Key points
- **Start with the problem:** requirements, constraints, how central it is to the product.
- **Core vs context:** if it's how you win customers (e.g. Figma's canvas engine, Notion's editor), lean towards building or deep customisation; if it's commodity (auth, feature flags, error tracking, payments), buy or adopt.
- **Total cost of ownership:** build cost plus years of maintenance, security patches, accessibility, browser bugs, on-call, documentation, onboarding; versus licence fees, integration and migration costs.
- **Evaluate options against criteria:**
  - Fit to requirements (must-haves) and extensibility.
  - Quality: accessibility, performance, bundle size, browser support.
  - Health (open source): maintainers, release cadence, issue response, adoption, licence (MIT vs GPL vs BSL).
  - Vendor: pricing at our scale, SLAs, security/compliance (SOC 2, GDPR, data residency), support, roadmap, stability.
  - Integration: APIs, SSR support, framework compatibility, data export.
  - Exit strategy: how hard is it to leave?
- **Time-boxed spike or proof of concept** on the hardest requirement.
- **Hybrid options:** headless libraries (build UI on a proven core), open source with paid support, wrapping vendors behind an internal interface to reduce lock-in.
- **Document** the decision (ADR), with review date and the conditions that would change it.

#### Model answer
"I start from the problem and how central it is to our product. The key question is: is this how we win, or is it plumbing? If it's a differentiator, like the collaborative canvas in a design tool, owning it can be worth it, because the details are the product. If it's commodity, like authentication, feature flags, error tracking or payments, someone has already spent years solving it better than we could in a quarter.

Then I compare options on total cost of ownership over several years, not just the first version. Building a date picker takes two weeks; making it accessible, internationalised, tested across browsers and maintained for five years takes far more. Buying has licence costs that grow with usage, plus integration and the cost of leaving later.

I'd evaluate each candidate against agreed criteria:
- **Requirements fit**: must-haves met, and room to extend.
- **Quality**: accessibility, performance and bundle size, SSR and framework compatibility.
- **For open source**: maintenance health (recent releases, responsive maintainers, more than one maintainer), adoption, and licence.
- **For vendors**: pricing at our expected scale, security and compliance like SOC 2, GDPR and data residency, SLAs, support quality, and whether we can export our data.
- **Lock-in and exit**: how hard would it be to replace?

For anything non-trivial, I'd run a time-boxed spike, a few days, on the hardest requirement with the top one or two options, because demos hide the hard parts.

There are often hybrid answers. For a rich text editor, I'd adopt a proven engine like ProseMirror, Lexical or TipTap and build our own UI and features on top, rather than building an editor engine from scratch or buying a closed widget we can't customise. For a vendor like a feature-flag service, I'd wrap it behind a small internal interface so swapping vendors later touches one module.

Finally, I'd write it up as an architecture decision record: options, criteria, scores, decision, risks, and the conditions under which we'd revisit, like pricing above a threshold. That makes it reviewable and stops the same debate recurring every six months."

#### Another worked example
**Feature flags: build vs buy.** The team had a homegrown JSON config for flags. Requirements grew: percentage rollouts, targeting by account, audit logs, instant kill switches, experimentation. Building those plus a UI and reliability guarantees was estimated at a quarter of one team's time, plus ongoing maintenance. A vendor cost less than a tenth of that per year. Decision: buy, with an internal `useFlag()` wrapper and a fallback to default values if the vendor is unavailable. Revisit if annual cost exceeds a threshold or data residency requirements change.

#### A third worked example
**Design system: build on headless primitives.** Buying a complete component library (MUI) would have been fastest, but the brand needed a distinctive look and the team fought the library's styles constantly. Building every component from scratch would repeat hard accessibility work. The hybrid: Radix or React Aria primitives for behaviour and accessibility, with the company's own styling and API. Fast to deliver, accessible, and on-brand.

#### Variations you might be asked
- "Should we build our own component library?"
- "How do you evaluate an open-source dependency before adding it?"
- "A vendor doubled its price. What do you do?"

#### Step-by-step framework
1. **Define the problem** and requirements, must-haves versus nice-to-haves.
2. **Core or commodity?**
3. **List options**: build, buy, adopt open source, hybrid.
4. **Evaluate** against agreed criteria, including TCO and exit costs.
5. **Spike** the hardest requirement.
6. **Decide and document** in an ADR with revisit triggers.
7. **Reduce lock-in** with internal interfaces.
8. **Review** periodically.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "We can build it in a sprint" | Counts years of maintenance, a11y and on-call |
| "Always buy" or "always build" | Core vs commodity with criteria |
| Picks the most popular library | Checks health, licence, bundle size, a11y, SSR |
| No exit plan | Internal wrapper and data export |
| Decision in a meeting, undocumented | ADR with revisit conditions |

#### Useful phrases
- "Is this how we win, or is it plumbing?"
- "The first version is the cheapest part of building."
- "Demos hide the hard parts, so we spike the hardest requirement."
- "Wrap the vendor so leaving touches one module."

#### Common pitfalls
- **Not-invented-here** syndrome.
- **Underestimating maintenance** and accessibility.
- **Ignoring licence terms** (GPL, source-available changes).
- **Vendor pricing at scale** surprises.
- **No owner** for an adopted dependency.

#### Follow-ups to expect (with sample answers)
- **"How do you evaluate an open-source library's health?"** — "Release frequency, issue and PR response times, number of active maintainers, downloads and dependents, test coverage, and whether companies sponsor it."
- **"When is building justified for commodity features?"** — "When requirements are genuinely unusual, vendors can't meet compliance needs, or scale makes vendor costs prohibitive."
- **"How do you include product and finance?"** — "Present options with cost, time-to-value and risk in their terms, and agree criteria upfront."
- **"What if the team wants to build because it's fun?"** — "Acknowledge it, but tie the decision to business value; offer interesting work elsewhere, like the parts that differentiate us."
- **"How do you avoid lock-in?"** — "Standards-based integrations, internal interfaces, regular data exports, and contract terms."

#### What senior interviewers look for
- **Business-aware** reasoning.
- **Rigorous evaluation** with TCO and risk.
- **Clear communication** and documented decisions.

#### Practise it
- Write an ADR for a build-vs-buy decision you know (a date picker, auth, charts), with criteria and revisit triggers.
- Explain 'core vs commodity' with two examples in 60 seconds.
- Checklist: problem · core or commodity · options incl. hybrid · criteria · TCO · health and licence · spike · ADR · wrapper · revisit.

## Walk me through the riskiest engineering decision you've made.
- id: 853eae48-a90a-4435-b003-fe0b94e05e04
- roles: frontend, fullstack, ai
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels:
- tags: leadership, story-bank, risk

### Prompt
Tell me about the riskiest engineering decision you've made. What was at stake, what options did you consider, how did you reduce the risk, what happened, and what would you do differently?

### Answer
#### What the interviewer is really testing
- Whether you've **owned consequential decisions**, not just executed others'.
- **Risk thinking**: identifying what could go wrong, how likely and how bad, and reducing it before and during execution.
- **Judgement under uncertainty**: options considered, trade-offs, data used, who you involved.
- **Execution safeguards**: incremental rollout, feature flags, rollback plans, monitoring.
- **Honesty and learning**: what went wrong or nearly did, and what you'd change.

#### Key points
- **Choose a story with real stakes** for users, revenue or the team: a migration, a re-architecture, removing a system, a launch under pressure, a security change, choosing a new framework.
- **Structure (STAR plus risk):** Situation and stakes → options and why this one → risks identified → mitigations (spikes, staged rollout, flags, dual running, rollback, monitoring, communication) → result with numbers → reflection.
- **Show you involved others**: RFCs, reviews, stakeholders, a pre-mortem.
- **Show reversible versus irreversible thinking**: make decisions reversible where possible ("two-way doors").
- **Be honest** about what went wrong; interviewers distrust stories where everything was perfect.
- **Avoid** stories where the risk was reckless (no rollback, deployed Friday night) unless the lesson is strong and clearly learned.

#### Model answer
*Example STAR story (adapt to your own experience):*

"**Situation.** At an e-commerce company, our checkout was a five-year-old jQuery and Backbone app, responsible for all revenue, around £2 million a day. It had frequent bugs, no tests, and every change took weeks. I proposed rewriting checkout in React, which was risky because any regression would directly cost money, and a previous rewrite attempt had been abandoned.

**Options.** We considered three: keep patching the old code, rewrite checkout as a big-bang release, or rebuild it incrementally behind a flag and run both versions in parallel. Patching wasn't sustainable; big-bang was the riskiest. I pushed for the incremental option.

**Risks I identified** in a pre-mortem with engineering, product and payments: conversion dropping because of subtle UX differences; payment edge cases like 3-D Secure and saved cards breaking; analytics events changing so we couldn't measure; and SEO or performance regressions.

**How we reduced them.**
- An inventory of every behaviour of the old checkout, including weird ones, captured as Playwright tests that we ran against both versions.
- Analytics event parity checked automatically, so the A/B comparison would be trustworthy.
- A feature flag routing a percentage of sessions to the new checkout: internal staff first, then 1%, 5%, 25%, 50%, 100%, with a kill switch.
- Guardrail metrics with automatic alerts: conversion rate, payment error rate, JavaScript errors and page speed, compared against the control group.
- A rollback plan that took seconds: flipping the flag.

**What happened.** At 5%, conversion was 1.8% lower in the new checkout. Because we had the control group, we saw it within two days, rolled back to 0%, and found the cause: the old checkout remembered the last delivery option and the new one didn't. After the fix, the new checkout converted 2.4% better at 50%, payment errors dropped by a third, and we completed the rollout over six weeks without an incident affecting more than a small percentage of users.

**Reflection.** The risk was real, and the 1.8% dip proved the safeguards were worth it. What I'd do differently: involve customer support earlier, because they knew about several quirks we only discovered in testing, and budget more time for the analytics parity work, which took twice my estimate."

#### Another worked example
*Example STAR story from a different context (adapt to your own experience):*

"**Situation.** At a B2B SaaS company, I decided to remove our in-house authentication and move to an external identity provider, affecting every customer login, including enterprise SSO customers. Getting it wrong meant locking customers out.

**Mitigations.** We ran both systems side by side with a per-tenant flag, migrated internal users first, then small customers, and enterprise customers last with scheduled windows and their IT teams on a call. We kept the old login available as a fallback for 30 days, and built a dashboard of login success rates per tenant.

**Result.** 1,200 tenants migrated over two months; one enterprise SAML misconfiguration caused a 20-minute lockout, caught by the per-tenant dashboard and fixed by reverting that tenant's flag. Login-related support tickets fell 40% afterwards.

**Reflection.** I'd add automated SAML configuration validation before migration, which would have prevented the lockout."

#### A third worked example
**Choosing your story.** Good candidates: a framework migration with traffic splitting, deleting a legacy service many teams relied on, a performance re-architecture before a peak event, adopting a new state or data layer across many teams, shipping under a regulatory deadline. Weak candidates: picking a library for a side project, or a story where the risk was purely to your own time.

#### Variations you might be asked
- "Tell me about a decision you made with incomplete information."
- "Tell me about a time a technical bet didn't pay off."
- "How do you de-risk a large migration?"

#### Step-by-step framework
1. **Situation and stakes** in numbers.
2. **Options considered** and why you chose one.
3. **Risks identified** (pre-mortem, stakeholders).
4. **Mitigations**: tests, flags, staged rollout, dual running, rollback, monitoring.
5. **What happened**, including problems.
6. **Results** with metrics.
7. **Reflection**: what you'd change.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| A risky decision with no safeguards | Risks identified and actively reduced |
| "It went perfectly" | Includes a problem and how safeguards caught it |
| Vague outcome | Concrete metrics |
| Solo decision | Involved stakeholders, pre-mortem, RFC |
| No reflection | Specific lessons and what you'd change |

#### Useful phrases
- "The stakes were…, so I wanted every step to be reversible."
- "We ran a pre-mortem: imagine it failed — why?"
- "The flag meant rollback took seconds."
- "The safeguards earned their keep when…"

#### Common pitfalls
- Picking a story with **low stakes**.
- Telling a story where the risk was **reckless**.
- **Hiding mistakes**.
- No **numbers**.
- Spending too long on technical background and too little on decisions.

#### Follow-ups to expect (with sample answers)
- **"How did you get buy-in?"** — "An RFC with the options and risks, a pre-mortem with stakeholders, and a staged plan with explicit go/no-go metrics."
- **"What would have made you abort?"** — "Agreed guardrails, like conversion more than 1% below control after statistical significance, or payment errors above a threshold."
- **"What's a two-way door?"** — "A decision you can reverse cheaply; I try to turn one-way doors into two-way ones with flags and dual running."
- **"How did you communicate during the rollout?"** — "Weekly updates to stakeholders, a shared dashboard, and a channel for issues."
- **"What did the team learn?"** — "Parity testing and staged rollouts became our standard for risky changes."

#### What senior interviewers look for
- **Ownership** of significant decisions.
- **Mature risk management** and reversibility.
- **Honest reflection**.

#### Practise it
- Find your story: list three decisions where users, revenue or the team were at stake; pick the one with the clearest risks and mitigations, and prepare it as a STAR story with numbers.
- Practise a 2-minute and a 5-minute version.
- Checklist: stakes · options · pre-mortem risks · mitigations · rollback · what went wrong · metrics · reflection.

## A senior engineer on your team is hostile to AI tooling. Blocks PRs with AI-generated code. What do you do?
- id: 8baa8ce0-3fc5-48ce-8193-feda38b8ee88
- roles: frontend, fullstack, ai
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels:
- companies: Anthropic
- tags: leadership, AI, team-dynamics

### Prompt
You're the tech lead. A respected senior engineer strongly opposes AI coding tools. They've started blocking pull requests they suspect contain AI-generated code, causing friction and slowing the team. How do you handle it?

### Answer
#### What the interviewer is really testing
- **Empathy and curiosity**: understanding the concerns, which are often valid (quality, security, licensing, skill erosion, review burden).
- Separating the **behaviour** (blocking PRs based on suspected origin) from the **underlying concerns**.
- Moving the conversation to **objective standards**: code is judged on quality, tests and understanding, whoever or whatever wrote it.
- Building a **team agreement or policy** on AI use with input from sceptics.
- **Handling conflict professionally**: private conversation first, clear expectations, escalation only if needed.
- Using the sceptic's expertise as an **asset** (e.g. owning review guidelines).

#### Key points
- **Talk privately first**, with curiosity: what specifically worries them? Common concerns:
  - Subtle bugs and code that looks plausible but is wrong.
  - Security issues, outdated APIs, hallucinated packages (supply-chain risk).
  - Licensing or IP concerns.
  - Authors who can't explain their own code; review burden shifting to reviewers.
  - Skill erosion in juniors.
  - Large, noisy PRs.
- **Acknowledge valid points**; many are real and deserve standards.
- **Reframe**: review the **code and the author's understanding**, not the tool. "The author is accountable for every line" is a tool-agnostic standard.
- **Create a team agreement** together (including the sceptic): disclosure norms, PR size limits, tests required, authors must be able to explain changes, no pasting secrets or proprietary code into unapproved tools, approved tools per company policy, extra scrutiny for security-sensitive areas, dependency checks.
- **Make review objective**: checklists, CI gates (types, lint, tests, security scanning), small PRs.
- **Address the behaviour**: blocking PRs based on suspicion isn't acceptable; review comments must be about concrete issues. Set that expectation clearly but respectfully.
- **Measure** outcomes (defect rates, review time) rather than arguing opinions.
- **Escalate** only if behaviour continues after clear expectations.

#### Model answer
"I'd start with a private, curious conversation rather than a confrontation, because a respected senior engineer usually has real reasons. I'd ask what they've seen: is it bugs, security issues, people submitting code they don't understand, huge PRs, or worries about juniors not learning?

Many of those concerns are valid. AI tools can produce plausible but wrong code, use outdated or insecure patterns, invent package names that attackers can squat, and make it easy to submit large changes the author doesn't fully understand, pushing the real work onto reviewers. I'd say so, and thank them for caring about quality.

Then I'd separate two things: the concerns, which we should address as a team, and the behaviour, blocking PRs because of suspected origin, which isn't a fair or workable standard. We can't reliably tell who or what wrote code, and it isn't the right question. The question is whether the code is correct, tested, secure, maintainable, and whether the author understands it.

So I'd propose building a team agreement together, and I'd ask them to help draft it, because their scepticism makes them good at spotting risks. It might include:
- **The author is accountable for every line**, however it was produced, and must be able to explain it in review.
- **PR size limits** and a description of what changed and why.
- **Tests required** for behaviour changes; CI gates for types, lint, tests and security scanning, including checking new dependencies exist and are reputable.
- **Approved tools** per company policy, and no pasting secrets or customer data into tools without approval.
- **Extra scrutiny** for security-sensitive areas like auth, payments and permissions.
- **Optional disclosure** when AI wrote substantial parts, so reviewers can calibrate, without stigma.
- **Learning expectations** for juniors: use tools, but explain and own the solution.

Alongside that, I'd set a clear expectation with the senior engineer: review comments need to point to concrete issues against our standards, and 'this looks AI-generated' isn't a reason to block. If a PR is too big or not understood by its author, that's a valid comment on its own merits.

I'd also suggest measuring rather than arguing: track defect rates, review time and incidents for a quarter. If AI-assisted changes cause more issues, we tighten guidelines; if not, the data helps settle it.

If the blocking continued after that, it becomes a performance conversation and I'd involve their manager. But in my experience, when sceptics help write the rules, they often become the best reviewers of AI-assisted code."

#### Another worked example
*Example STAR story (adapt to your own experience):*
"On a payments team, a staff engineer rejected three PRs in a week with 'AI slop'. In a 1:1 I learned that one AI-assisted PR had introduced a currency rounding bug that reached staging, and he felt nobody was taking it seriously. We wrote an AI usage guideline together: authors explain every change, money-handling code needs property-based tests, PRs under 400 lines. He ran a short session on reviewing AI-assisted code. Over the next quarter, PR friction dropped, and the rounding class of bug was caught by the new property tests twice."

#### A third worked example
**The opposite situation.** A junior engineer submits large AI-generated PRs they can't explain. Same principle, different action: coach them to break work into smaller pieces, write tests first, and walk through their code before requesting review. The standard (understand and own your code) applies both ways.

#### Variations you might be asked
- "How would you introduce AI coding tools to a sceptical team?"
- "How do you handle a senior engineer who blocks progress?"
- "What guidelines would you set for AI-assisted development?"

#### Step-by-step framework
1. **Private, curious conversation**: understand the concerns.
2. **Acknowledge valid risks**.
3. **Separate concerns from behaviour**.
4. **Co-create a team agreement** with the sceptic's input.
5. **Make review objective**: standards, CI gates, PR size limits.
6. **Set clear expectations** on review behaviour.
7. **Measure outcomes** and adjust.
8. **Escalate** only if needed.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Tell them AI is the future and to get on board" | Explores and validates real concerns |
| Bans AI to keep the peace | Builds standards that address the risks |
| Ignores the blocking behaviour | Sets clear, respectful expectations |
| Judges code by its origin | Judges code by quality and author understanding |
| Opinions only | Measures defects and review time |

#### Useful phrases
- "What have you seen that worries you?"
- "The author owns every line, however it was written."
- "Let's review the code, not guess the tool."
- "Would you help us write the guidelines?"

#### Common pitfalls
- **Public confrontation** in PR threads.
- **Dismissing** concerns as resistance to change.
- **Banning or mandating** tools without discussion.
- **Leaving the behaviour unaddressed**, letting friction grow.
- Ignoring **company policy** on data and IP.

#### Follow-ups to expect (with sample answers)
- **"What if they're right and quality drops?"** — "Then we tighten guidelines, add tests and gates, or restrict use in sensitive areas; the data decides."
- **"Should AI use be disclosed?"** — "Encouraged without stigma, so reviewers can calibrate, but the standard is the same either way."
- **"How do you keep juniors learning?"** — "Pairing, asking them to explain choices, and tasks where they write the solution before using tools to review it."
- **"What about licensing risk?"** — "Follow company policy and approved tools with appropriate protections, and use dependency and licence scanning."
- **"What if the team splits into camps?"** — "Focus on shared goals, objective standards and data, and keep discussions in team forums rather than PR threads."

#### What senior interviewers look for
- **Emotional intelligence** and fairness.
- **Turning conflict into better standards**.
- **Clear expectations** without drama.

#### Practise it
- Draft a one-page AI-assisted development guideline for a team.
- If you've handled a disagreement with a senior colleague, prepare it as a STAR story; otherwise, prepare one about introducing a new tool or practice.
- Checklist: private conversation · valid concerns · behaviour vs concerns · co-created agreement · objective review · expectations · measurement · escalation path.

## Your team is split on TanStack Query vs SWR. As tech lead, how do you decide?
- id: d3022035-3ceb-4bbf-8dd1-e72f32f1b84b
- roles: frontend, fullstack, ai
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels:
- tags: leadership, decision-making

### Prompt
Half your team wants TanStack Query and half wants SWR for data fetching, and the debate has gone on for weeks. As tech lead, how do you reach a decision? Explain the process you'd run and, briefly, how the two libraries actually differ.

### Answer
#### What the interviewer is really testing
- A **decision process** that is fair, time-boxed and documented, rather than "I'd pick X".
- Recognising **reversible decisions** that don't merit weeks of debate, and the cost of indecision.
- Defining **criteria from requirements**, running a small comparison, and committing.
- Handling **disagreement**: disagree and commit, making sure everyone felt heard.
- Enough **technical knowledge** of both libraries to frame the trade-off credibly.

#### Key points
- **Reframe:** this is a medium-stakes, fairly reversible decision; both libraries are good. The bigger cost is the ongoing debate and inconsistency.
- **Process:**
  1. Write down **requirements** from our actual use cases (mutations with optimistic updates, infinite lists, SSR with Next.js, offline, devtools, polling, dependent queries, bundle size).
  2. **Agree criteria and weights** with the team before comparing.
  3. **Time-box a spike**: implement one or two representative features with each (e.g. a paginated list with an optimistic mutation).
  4. **Compare** results against criteria; gather input from both sides; check ecosystem fit (framework, existing patterns).
  5. **Decide** (the tech lead owns it if no consensus), write an **ADR**, set a revisit trigger.
  6. **Disagree and commit**: acknowledge trade-offs, involve the dissenters in rollout (writing guidelines, wrappers).
- **Technical difference (briefly):**
  - **SWR** (Vercel): small, simple API, stale-while-revalidate focus, great for read-heavy apps, smaller bundle; mutations and complex cache manipulation are more manual.
  - **TanStack Query**: more features: rich mutations with optimistic updates and rollback, query invalidation by key prefix, infinite queries, dehydration/hydration for SSR, persistence plugins, offline support, powerful devtools, framework-agnostic; bigger API and bundle.
  - Typical outcome: mutation-heavy apps lean TanStack Query; read-heavy, simple needs can lean SWR.
- **Reduce lock-in:** wrap data access in domain hooks (`useOrders()`), so the library is an implementation detail.

#### Model answer
"First I'd reframe the decision. Both libraries are well maintained and solve the same core problem: caching server state with stale-while-revalidate. The choice is fairly reversible, especially if we wrap data fetching in our own hooks. What's actually costing us is weeks of debate and, probably, inconsistent code in the meantime. So my goal is a fair, quick, documented decision.

**Process:**
1. **Requirements from our product, not opinions.** I'd list what we actually need: lots of mutations with optimistic updates? Infinite scrolling? Server rendering with Next.js? Offline support? Polling? Devtools for debugging cache issues? Bundle size constraints?
2. **Agree criteria and weights with the team** before anyone presents a comparison, so we're not arguing from conclusions backwards.
3. **Time-boxed spike**, two or three days: one person from each camp implements the same representative feature with the other camp's library, say a paginated orders list with an optimistic 'cancel order' mutation and SSR. Swapping sides keeps it honest.
4. **Review together** against the criteria: code clarity, amount of custom code, edge cases, bundle size, devtools experience.
5. **Decide.** If there's consensus, great. If not, as tech lead I make the call, explain the reasoning in an ADR, and set a trigger for revisiting.
6. **Disagree and commit.** I'd thank both sides, acknowledge what we're giving up, and invite people from the other camp to help shape the guidelines and the wrapper hooks.

**On the actual trade-off:** SWR is smaller and simpler, focused on fetching and revalidating, and great for read-heavy apps. TanStack Query has more depth: mutation lifecycle hooks for optimistic updates and rollback, invalidation by query-key prefix, infinite queries, first-class SSR dehydration and hydration, persistence and offline plugins, and excellent devtools, at the cost of a bigger API and bundle. For an app with many mutations and complex cache updates, I'd expect TanStack Query to win the spike; for a mostly read-only dashboard, SWR might.

Either way, I'd wrap usage in domain hooks like `useOrders()` and `useCancelOrder()`, so components don't depend on the library directly and a future switch touches one layer."

#### Another worked example
**A decision matrix from such a spike.**
```
Criteria (weight)                 TanStack Query   SWR
Optimistic mutations (5)          5                3
SSR with Next.js App Router (4)   5                4
Infinite lists (3)                5                4
Simplicity / learning curve (3)   3                5
Bundle size (2)                   3                5
Devtools (2)                      5                3
Weighted total                    88               78
Decision: TanStack Query; revisit if bundle budget is exceeded on mobile routes.
```

#### A third worked example
**When the debate is a symptom.** On one team, the real disagreement was about ownership: two sub-teams wanted autonomy. The library decision went quickly once the team agreed a principle: shared standards for cross-cutting concerns (data fetching, forms, styling), team choice for local ones. The ADR template and decision process became reusable for later debates.

#### Variations you might be asked
- "Your team can't agree between Redux and Zustand. What do you do?"
- "How do you make technical decisions as a tech lead?"
- "What's 'disagree and commit'?"

#### Step-by-step framework
1. **Reframe** stakes and reversibility.
2. **Requirements** from real use cases.
3. **Criteria and weights** agreed upfront.
4. **Time-boxed spike** with swapped sides.
5. **Review** against criteria.
6. **Decide and document** (ADR, revisit trigger).
7. **Disagree and commit**; involve both camps in rollout.
8. **Wrap** the choice behind domain hooks.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "I'd pick TanStack Query because it's better" | Runs a fair, time-boxed process |
| Endless debate | Decision within a week, documented |
| Criteria chosen after comparing | Criteria agreed upfront |
| Losers feel ignored | Disagree and commit; dissenters shape guidelines |
| Library used directly everywhere | Domain hooks reduce lock-in |

#### Useful phrases
- "Both are good; the debate costs more than either choice."
- "Let's agree the criteria before we compare."
- "Swap sides for the spike."
- "We'll revisit if… — until then, we commit."

#### Common pitfalls
- **Letting debates drag** on reversible decisions.
- **Deciding by seniority or volume**.
- **Undocumented decisions** that get relitigated.
- **Mixing both libraries** indefinitely.
- **No migration plan** for existing code.

#### Follow-ups to expect (with sample answers)
- **"What if a senior engineer refuses to commit?"** — "Hear them out privately, check whether new information changes the decision, and if not, be clear that the decision stands and ask for their help making it work."
- **"When should a tech lead decide alone?"** — "When the team can't converge after a fair process, or when the decision is urgent; transparency about reasoning is essential."
- **"How do you migrate existing code?"** — "New code uses the chosen library; existing code migrates when touched or by priority, with a lint rule preventing new usage of the old one."
- **"What's an ADR?"** — "An architecture decision record: context, options, decision, consequences, and status, stored with the code."
- **"How do you avoid this next time?"** — "A lightweight decision process and template the team agrees to use for cross-cutting choices."

#### What senior interviewers look for
- **Facilitation and decisiveness**.
- **Technical credibility**.
- **Team health**: everyone heard, decision respected.

#### Practise it
- Write an ADR for a library choice your team made or debated.
- If you've resolved a technical disagreement, prepare it as a STAR story; focus on the process and how you kept the team together.
- Checklist: reframe stakes · requirements · criteria first · spike with swapped sides · decision · ADR · revisit trigger · disagree and commit · wrapper hooks.

## Micro-frontends: when they make sense
- id: fe-arch-01
- roles: frontend, fullstack
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels: senior, staff
- tags: micro-frontends, architecture, module federation, team topology

### Prompt
What are micro-frontends? When do they make sense, and when are they a mistake? Compare the main integration approaches (build-time packages, server-side composition, client-side composition with Module Federation or import maps, iframes), and explain how you'd handle shared dependencies, design consistency, routing, communication between parts, and performance.

### Answer
#### What the interviewer is really testing
- Understanding that micro-frontends are mainly an **organisational** solution: independent teams deploying parts of one product independently.
- **Honest judgement**: the costs (complexity, performance, consistency, tooling) usually outweigh the benefits for small and medium teams.
- Knowledge of **integration options** and their trade-offs.
- Handling the **hard parts**: shared dependencies and duplicate React, design system consistency, routing, cross-app communication, auth, observability, testing.
- Alternatives: a **well-structured monorepo** with modular boundaries.

#### Key points
- **Definition:** a frontend split into parts owned by different teams, each built, tested and deployed independently, composed into one user experience.
- **When they make sense:**
  - Many teams (often 5+ teams, 50+ engineers) on one product, blocked by a shared release train.
  - Clear business domains with separate ownership (e.g. search, checkout, account).
  - Need for independent deployment cadences or technology migration (strangling a legacy app area by area).
  - Different products embedded into a shell (admin consoles, enterprise suites).
- **When they're a mistake:** small teams, unclear domain boundaries, a desire to "use different frameworks", or to fix a messy codebase (they distribute the mess).
- **Integration approaches:**
  - **Build-time** (npm packages): simple, one bundle, but releases are coupled again.
  - **Server-side composition** (edge or server includes, route-level splitting by path through a reverse proxy): good performance and SEO; route-based split is the simplest true micro-frontend.
  - **Client-side runtime composition** (Webpack/Rspack Module Federation, import maps, single-spa): independent deploys with shared dependencies; complex versioning and runtime failure modes.
  - **iframes**: strong isolation, but poor UX integration (sizing, focus, routing, accessibility, performance).
- **Hard parts:**
  - **Shared dependencies:** one React instance (singletons in Module Federation), version policy, avoiding duplicate libraries.
  - **Consistency:** a shared design system and tokens, shared lint and conventions.
  - **Routing:** a shell owns top-level routes; each app owns its sub-routes.
  - **Communication:** URL, custom events or a tiny event bus; avoid shared global stores.
  - **Auth and session:** shell handles it; apps receive context.
  - **Performance budgets** per app; monitor duplicate code.
  - **Testing:** contract tests between shell and apps, plus E2E across the composed product.

#### Model answer
"Micro-frontends split one product's frontend into parts owned by different teams, which they build and deploy independently. I see them mainly as an organisational tool: the problem they solve is many teams blocked by a single codebase and release train. They don't make code better by themselves, and they add real complexity.

**When they make sense.** When there are many teams, say five or more, working on clearly separate business domains, like search, product pages, checkout and account, and the shared release process is genuinely slowing them down. Or when migrating a large legacy app area by area, where a new React section can replace an old Angular one route at a time. Or for a platform shell that hosts separately owned tools, like an admin console.

**When they're a mistake.** For a team of ten, the overhead isn't worth it. Nor to let every team use a different framework, which harms performance and hiring, or to fix a messy codebase, which just spreads the mess across repositories. Often a monorepo with clear module boundaries, CODEOWNERS and affected-only CI gives most of the team autonomy without runtime complexity.

**Integration options.**
- **Route-based composition** is the simplest: a reverse proxy sends `/checkout/*` to the checkout app and `/account/*` to the account app. Each is a normal app; navigating between them is a full page load, which is acceptable at domain boundaries. It's good for performance and SEO.
- **Server or edge composition** stitches fragments into one page on the server.
- **Client-side runtime composition** with Module Federation or import maps loads remote modules into a shell at runtime, so a header owned by one team and a product grid owned by another share one page and one React instance. This gives the most flexibility and the most complexity: version compatibility, runtime loading failures, and harder debugging.
- **Build-time packages** are simple but reintroduce coupled releases.
- **iframes** give strong isolation but poor integration, so I'd only use them for third-party or untrusted content.

**The hard parts.**
- **Shared dependencies:** React and the design system must be singletons; Module Federation's shared config with version ranges, plus a policy for upgrading everyone.
- **Consistency:** one design system with tokens, shared lint and conventions, and a platform team owning the shell and shared libraries.
- **Routing:** the shell owns top-level routes, apps own their sub-routes.
- **Communication:** prefer the URL and server state; for the rest, a small typed event contract. Avoid a shared global store, which recouples everything.
- **Performance:** per-app bundle budgets and monitoring for duplicated libraries.
- **Testing and observability:** contract tests for the shell–app interface, E2E across the composed product, and error monitoring tagged by app and version.

My default recommendation: start with a modular monorepo; move to route-based micro-frontends when team scale demands independent deployment; reach for runtime composition only when several teams must share one page."

#### Another worked example
**Strangling a legacy AngularJS admin app.** A 2015 admin console couldn't be rewritten at once. A React shell took over routing and the header; new sections shipped as React apps under their own routes, while unmigrated routes rendered the old AngularJS app inside the shell. Over 18 months, 40 screens moved across with no big-bang release, and the AngularJS bundle was deleted at the end.

#### A third worked example
**A micro-frontend regret.** A 12-engineer startup split its app into six micro-frontends with Module Federation. Each page loaded three copies of a date library and two versions of the UI kit; local development needed six servers; a breaking change in a shared type took a week to coordinate. They merged back into a monorepo with module boundaries and kept independent deploys only for the marketing site.

#### Variations you might be asked
- "How would you split a large e-commerce frontend across teams?"
- "Module Federation: how does it work and what can go wrong?"
- "Monorepo or micro-frontends?"

#### Step-by-step framework
1. **Diagnose the problem**: team scale and release coupling, not code quality.
2. **Check domain boundaries**.
3. **Consider alternatives**: modular monorepo.
4. **Choose integration**: route-based first, runtime composition only if needed.
5. **Shared dependencies and design system** policy.
6. **Routing, communication, auth** contracts.
7. **Performance budgets, testing, observability**.
8. **Platform team ownership** of shell and shared libraries.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Micro-frontends for scalability" | Organisational problem first |
| Each team picks its own framework | One framework, shared design system |
| Shared global store across apps | URL, server state, small event contracts |
| Runtime composition by default | Route-based first; runtime only when needed |
| Ignores performance | Budgets and duplicate-dependency monitoring |

#### Useful phrases
- "Micro-frontends solve team scaling, not code quality."
- "Split by business domain, not by technical layer."
- "Route-based composition is the simplest version that works."
- "If everything shares one store, you've built a distributed monolith."

#### Common pitfalls
- **Duplicate React** or libraries across apps.
- **Inconsistent UX** without a design system.
- **Tight coupling** through shared state.
- **Local development pain**.
- Adopting them **too early**.

#### Follow-ups to expect (with sample answers)
- **"How does Module Federation share React?"** — "Both host and remotes declare React as a shared singleton with a compatible version range; the host's copy is used at runtime."
- **"How do you handle a remote failing to load?"** — "Error boundaries with fallbacks per remote, timeouts, and monitoring; the rest of the page must still work."
- **"How do teams share types?"** — "Published contract packages or generated types from the remote, versioned like APIs."
- **"What about SEO?"** — "Server-side or route-based composition renders full HTML; client-only composition needs SSR support."
- **"How do you upgrade React across apps?"** — "A coordinated window with compatibility ranges, or apps upgrading one by one if isolation allows it."

#### What senior interviewers look for
- **Organisational framing** and honest trade-offs.
- **Concrete integration knowledge**.
- **Governance**: platform ownership, budgets, contracts.

#### Practise it
- Draw how you'd split an e-commerce site into domains and choose an integration approach for each boundary.
- Explain in 60 seconds why a monorepo might be better for a 20-person team.
- Checklist: team-scale problem · domains · monorepo alternative · integration choice · singletons · design system · routing and communication · budgets · testing · ownership.

## Building and scaling a design system
- id: fe-arch-02
- roles: frontend, fullstack
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels: senior, staff
- tags: design systems, components, tokens, governance, accessibility

### Prompt
Your company has several product teams building UIs that look and behave inconsistently. You're asked to lead the creation of a design system. How do you approach it: what goes in it, how is it built (tokens, components, documentation), how do you drive adoption, how do you govern contributions and versioning, and how do you measure success?

### Answer
#### What the interviewer is really testing
- Seeing a design system as a **product with users** (product teams), not just a component library.
- **Layered architecture**: design tokens → primitives and components → patterns and templates → documentation and guidelines.
- **Technical choices**: headless primitives for accessibility, theming, styling approach, framework support, packaging and versioning.
- **Adoption and governance**: contribution models, migration support, breaking changes, ownership.
- **Measuring** success: adoption, consistency, delivery speed, accessibility.

#### Key points
- **Start with research:** audit existing UIs (screenshot inventory of buttons, inputs, modals), talk to product teams and designers, find the biggest pain points and most-used components.
- **Foundations: design tokens** for colour, typography, spacing, radii, shadows, motion, in a platform-agnostic source (e.g. JSON with Style Dictionary or Tokens Studio from Figma), output as CSS variables and TS constants; semantic tokens (`color.text.primary`) over raw values; support themes (dark mode, brands).
- **Components:** start with the most-used, highest-inconsistency ones (button, input, select, checkbox, modal, toast, table). Build on **headless accessible primitives** (Radix, React Aria) for behaviour; own the styling and API.
- **API design:** consistent props (`size`, `variant`, `tone`), composition (`Dialog.Title`), controlled/uncontrolled support, forwarding refs, extending native props, escape hatches (`className`, `asChild`) used sparingly.
- **Quality bar:** accessibility (WCAG AA, keyboard, screen reader tested), visual regression tests, interaction tests, performance (tree-shakeable, small).
- **Documentation:** Storybook or a docs site with usage guidelines (when to use and when not), code examples, accessibility notes, design files in sync (Figma library).
- **Distribution:** versioned npm packages with semver, changelogs, codemods for breaking changes, deprecation warnings.
- **Governance:** a core team owning the system; a contribution model (federated contributions with review); RFCs for new components; office hours.
- **Adoption:** start with one pilot team, make it easier than building your own, migration guides and codemods, lint rules discouraging raw HTML for common components, track usage.
- **Metrics:** component adoption coverage, number of custom one-off components, design–dev handoff time, accessibility issues, UI bugs, team satisfaction surveys.

#### Model answer
"I'd treat the design system as a product whose users are the product teams. If it doesn't make their work faster and better, they won't use it, however consistent it is.

**Research first.** I'd audit what exists: screenshot every button, input, modal and dropdown across products. It's common to find dozens of slightly different buttons. I'd interview designers and engineers about pain points, and check which components appear most often and cause most bugs. That shapes the priority list.

**Foundations: tokens.** Colours, type scale, spacing, radii, shadows and motion become design tokens in one source of truth shared with design, exported to CSS variables and TypeScript. I'd use semantic names, like `color.text.subtle` or `color.surface.raised`, not raw colours, so themes like dark mode or a second brand are just different token values.

**Components.** I'd start with the most-used and most inconsistent: button, text input, select, checkbox and radio, modal, toast, tabs, table. For behaviour and accessibility, I'd build on headless primitives like Radix or React Aria, because getting keyboard handling, focus management and ARIA right is hard and those libraries have years of work in them; we own the styling and the API. API conventions matter: consistent prop names for size, variant and tone, compound components where structure matters, refs forwarded, native props passed through, and limited escape hatches.

**Quality bar.** Every component meets WCAG AA, is tested with keyboard and a screen reader, has interaction tests and visual regression tests in Storybook, and is tree-shakeable so teams only ship what they use.

**Documentation.** Storybook or a docs site with live examples, do's and don'ts, accessibility notes and guidance on when not to use a component. The Figma library mirrors the code components with the same names and variants, so design and engineering speak the same language.

**Distribution and versioning.** Semver packages, clear changelogs, deprecation warnings before breaking changes, and codemods to automate migrations, so upgrading is cheap.

**Governance.** A small core team owns quality and direction. Other teams contribute through a defined process: propose with an RFC, build with the core team's review, and promote patterns that several teams need into the system. One-off needs stay in product code.

**Adoption.** Start with a pilot team on a real feature, fix what's painful, then expand. Make the system the easiest path: templates, starter projects, office hours, migration help. Lint rules can flag raw `<button>` elements or ad-hoc colours.

**Measuring success.** Adoption coverage (how much UI uses system components), fewer one-off components, accessibility issues found in audits, UI bug counts, design-to-ship time for new features, and developer satisfaction."

#### Another worked example
**Adoption numbers from a rollout (illustrative).**
```
Audit: 47 button variants, 12 modal implementations, 9 date pickers across 6 products
Quarter 1: tokens + 10 core components (Radix-based), pilot with Payments team
Quarter 2: codemod migrates 1,800 Button usages; lint rule flags raw buttons
Quarter 3: 4 of 6 products on the system; a11y audit issues -60%; dark mode shipped via tokens in 2 weeks
```

#### A third worked example
**Supporting several frameworks.** A company had React, Vue and server-rendered pages. Options: tokens and CSS shared everywhere with framework-specific components, or Web Components for the shared layer. They shared tokens and a CSS foundation, built React components on Radix for most teams, and provided simple CSS classes for server-rendered pages, avoiding the complexity of Web Components for forms and accessibility.

#### Variations you might be asked
- "How do you get teams to adopt a design system?"
- "Should you build components from scratch or on a library?"
- "How do you handle breaking changes in a component library?"

#### Step-by-step framework
1. **Research**: audit and interviews.
2. **Tokens** as the foundation, semantic and themeable.
3. **Core components** on accessible primitives, consistent APIs.
4. **Quality bar**: a11y, tests, performance.
5. **Documentation** and Figma parity.
6. **Distribution**: semver, changelogs, codemods.
7. **Governance**: core team, contributions, RFCs.
8. **Adoption and metrics**.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Build a component library" | A product with users, research and metrics |
| Hard-coded colours | Semantic tokens supporting themes |
| Hand-rolled modal accessibility | Headless accessible primitives |
| Big-bang mandate | Pilot, migration tooling, easiest path |
| No governance | Core team, contribution model, RFCs |

#### Useful phrases
- "The design system's customers are our product teams."
- "Tokens first, then components, then patterns."
- "We own the styling and API; proven primitives own the hard behaviour."
- "Adoption comes from being the easiest path, not from mandates."

#### Common pitfalls
- **Building in isolation** from product needs.
- **Too many props** and variants.
- **Ignoring accessibility**.
- **Breaking changes without migration help**.
- **No ownership**, so it decays.

#### Follow-ups to expect (with sample answers)
- **"How do you handle a team needing something the system lacks?"** — "Let them build it locally, and if several teams need it, promote it through the contribution process."
- **"How do you keep Figma and code in sync?"** — "Shared token source, matching names and variants, and regular reviews; tools can sync tokens automatically."
- **"How do you version components?"** — "Usually one package versioned together for simplicity, with semver and changelogs; codemods for breaking changes."
- **"How do you measure adoption?"** — "Static analysis of imports across repos, and the ratio of system components to custom ones."
- **"What about performance?"** — "Tree-shaking, per-component imports, avoiding runtime CSS-in-JS, and bundle budgets."

#### What senior interviewers look for
- **Product thinking** and adoption strategy.
- **Technical depth** in tokens, APIs and accessibility.
- **Governance** that scales.

#### Practise it
- Audit buttons and inputs in an app you know, and propose a token set and component list.
- If you've contributed to or led a design system, prepare it as a STAR story with adoption metrics.
- Checklist: research · tokens · core components · primitives · API conventions · a11y and tests · docs and Figma · semver and codemods · governance · adoption metrics.

## Monorepos for frontend teams
- id: fe-arch-03
- roles: frontend, fullstack
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels: senior, staff
- tags: monorepo, Turborepo, Nx, pnpm, CI, architecture

### Prompt
Should a frontend organisation with several apps and shared libraries use a monorepo? Explain the benefits and costs, how you'd structure it, the tooling (pnpm workspaces, Turborepo, Nx, Changesets), how you keep CI fast, how you enforce boundaries between packages, and how you'd migrate from several separate repositories.

### Answer
#### What the interviewer is really testing
- Knowing **what problems a monorepo solves**: atomic changes across apps and libraries, shared tooling, easier refactoring, one version of dependencies.
- Knowing the **costs**: CI scale, tooling complexity, ownership, access control, noisy history.
- **Practical structure and tooling**: workspaces, task runners with caching, affected-only builds, versioning strategies.
- **Boundaries**: preventing a big ball of mud through dependency rules and ownership.
- **Migration** planning without stopping work.

#### Key points
- **Monorepo:** multiple apps and packages in one repository, often with a shared toolchain. Not the same as a monolith: apps still deploy independently.
- **Benefits:**
  - **Atomic changes**: update a shared component and all its consumers in one PR, with all tests run.
  - **Shared tooling** and config (TypeScript, ESLint, Prettier, test setup).
  - **Single dependency versions** reduce duplicates and drift (e.g. one React version).
  - **Easier refactoring and code discovery**; internal packages without publishing.
- **Costs:**
  - CI time grows without **caching and affected-only** runs.
  - Tooling learning curve and maintenance.
  - Need for **ownership** (CODEOWNERS) and **boundaries**.
  - Access control is coarser; very large repos need git tooling (sparse checkout).
- **Structure:**
  ```
  apps/        web, admin, marketing, docs
  packages/    ui (design system), api-client, utils, config-eslint, config-ts, feature-*
  tooling/     scripts, generators
  ```
- **Tooling:**
  - **pnpm workspaces** (strict, fast, disk-efficient) or npm/yarn workspaces.
  - **Turborepo** (task pipelines, local and remote caching, simple) or **Nx** (project graph, affected commands, generators, module boundary lint rules, more features).
  - **Changesets** for versioning and changelogs when packages are published; or keep internal packages unversioned (always consume latest via workspace protocol).
- **Fast CI:** remote caching, `--filter=...[origin/main]` or `nx affected`, parallel jobs, cached dependency installs, build only what changed and what depends on it.
- **Boundaries:** Nx `enforce-module-boundaries` or ESLint import rules with tags (`type:ui` can't import `type:feature`), public entry points per package (`exports`), no deep imports, CODEOWNERS per package.
- **Migration:** move repos in one at a time preserving history (`git subtree` or tools), align tooling gradually, start with shared libraries and their main consumer.

#### Model answer
"A monorepo puts several apps and shared packages in one repository with shared tooling. Importantly, it's not a monolith: the web app, admin console and marketing site can still build and deploy independently.

**Why I'd choose one** for an organisation with a few apps and shared libraries: the biggest win is atomic change. If I change a design-system component's API, I update every consumer in the same PR, and CI tests all of them before merge. With separate repos, I publish a version, then open PRs in five repos, and some stay on the old version for months. Monorepos also mean shared configuration, one version of React and other key dependencies, and easier refactoring and discovery.

**The costs** are real: CI gets slow without caching, tooling has a learning curve, and without boundaries it becomes a tangle where everything imports everything. Ownership needs to be explicit.

**Structure.** `apps/` for deployable applications, `packages/` for shared code: the UI library, an API client, utilities, and shared ESLint and TypeScript config packages. Each package has a clear public entry point through its `package.json` `exports`.

**Tooling.** pnpm workspaces for dependency management, because they're strict about undeclared dependencies and efficient. For task orchestration, Turborepo or Nx: both understand the dependency graph between packages, run tasks in the right order, cache results locally and remotely, and can run only what's affected by a change. Turborepo is simpler; Nx adds generators, a project graph UI and built-in module boundary rules, which help larger organisations. If we publish packages externally, Changesets manages versions and changelogs; internal packages can just use the workspace version.

**Keeping CI fast.** Remote caching means a package that hasn't changed isn't rebuilt or retested, even across machines. Affected-only runs, like `turbo run test --filter=...[origin/main]`, test only changed packages and their dependents. Plus parallel jobs and cached installs. A change to the marketing site shouldn't run the admin app's E2E suite.

**Boundaries.** I'd tag packages by type and scope, and use lint rules to enforce allowed dependencies: apps can depend on features and libraries, UI components can't import app code, one product's feature package can't import another's internals. Deep imports into other packages' private folders are banned. CODEOWNERS assigns reviewers per package.

**Migration** from separate repos: move one repo at a time, preserving git history, starting with the shared library and its biggest consumer, align tooling gradually, and keep deployments unchanged at first so the move is low risk."

#### Another worked example
**CI before and after Turborepo remote caching.**
```
Before: every PR builds and tests all 4 apps + 12 packages → 38 min
After:  affected-only + remote cache
  PR touching packages/utils → rebuild utils + its 5 dependents, others cache hits → 9 min
  PR touching apps/marketing only → 3 min
  main branch full build → 6 min (most tasks restored from cache)
```

#### A third worked example
**Boundary rules preventing a tangle.**
```
tags: apps/web → scope:web, type:app ; packages/checkout → scope:web, type:feature ; packages/ui → scope:shared, type:ui
rules: type:ui may depend only on type:util
       type:feature may depend on type:ui, type:util, type:data
       scope:web may not depend on scope:admin
```
A PR importing an admin feature into the web app fails lint with a clear message, before it becomes a hidden coupling.

#### Variations you might be asked
- "Turborepo or Nx?"
- "How do you keep CI fast in a large monorepo?"
- "Monorepo or polyrepo for our company?"

#### Step-by-step framework
1. **State the problems**: cross-repo changes, drift, duplicated tooling.
2. **Weigh benefits and costs**.
3. **Structure** apps and packages with public entry points.
4. **Choose tooling**: workspaces, task runner, versioning.
5. **Fast CI**: caching, affected-only, parallelism.
6. **Boundaries and ownership** via lint rules and CODEOWNERS.
7. **Migration plan** one repo at a time.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| "Monorepo means one big app" | Independent deploys, shared tooling |
| CI runs everything every time | Remote caching and affected-only runs |
| No boundaries | Tag-based dependency rules and CODEOWNERS |
| Big-bang migration | One repo at a time, history preserved |
| Tool chosen by hype | Turborepo vs Nx by needs |

#### Useful phrases
- "A monorepo is about atomic changes, not one deploy."
- "Cache everything that hasn't changed."
- "Boundaries are enforced by tooling, not by hope."
- "Ownership per package via CODEOWNERS."

#### Common pitfalls
- **Slow CI** without caching.
- **Everything imports everything**.
- **Phantom dependencies** (using packages not declared), which pnpm prevents.
- **Unclear ownership**.
- **Forcing all apps onto one release schedule**.

#### Follow-ups to expect (with sample answers)
- **"How do internal packages get built?"** — "Either built with tsup and consumed as compiled output, or consumed as source via TypeScript paths and the app's bundler; source consumption is simpler for internal-only packages."
- **"How do you version shared packages?"** — "Internal-only: workspace versions, always latest. Published: Changesets with semver."
- **"What about dependency upgrades?"** — "One version per dependency across the repo, upgraded with Renovate in one PR with all tests."
- **"Does Google really use one repo?"** — "Yes, with custom tooling; most companies don't need that scale, but the principles are the same."
- **"How do you handle secrets and access control?"** — "Secrets stay out of the repo; very sensitive code can live elsewhere; CODEOWNERS and branch protection control changes."

#### What senior interviewers look for
- **Clear trade-offs**.
- **Practical CI and boundary knowledge**.
- **Migration realism**.

#### Practise it
- Set up a small pnpm + Turborepo workspace with one app and two packages, and observe cache hits.
- Write boundary rules for a repo you know.
- Checklist: benefits and costs · structure · public entry points · workspaces · task runner · caching and affected runs · boundaries · CODEOWNERS · migration.

## Internationalisation (i18n) architecture
- id: fe-arch-04
- roles: frontend, fullstack
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels:
- tags: i18n, localisation, Intl, RTL, architecture

### Prompt
Your product is expanding from English-only to 15 languages, including German, Japanese and Arabic. Design the frontend internationalisation architecture: message management, plurals and formatting, locale detection and routing, loading translations efficiently, right-to-left support, the translation workflow, and testing.

### Answer
#### What the interviewer is really testing
- Knowing **i18n vs l10n**: making the code locale-ready versus translating content for each locale.
- Correct **message formatting**: ICU MessageFormat for plurals, gender and selects; never concatenating strings.
- Using **`Intl` APIs** for numbers, currencies, dates, relative times, lists and sorting.
- **Locale strategy**: detection, URL routing, SEO (`hreflang`), user preference persistence.
- **Performance**: loading only the needed locale and namespace.
- **RTL support** with logical CSS properties and mirroring.
- **Workflow and quality**: extraction, translation management systems, context for translators, pseudo-localisation and testing.

#### Key points
- **No hard-coded strings**: every user-facing string has a key in message catalogues (`checkout.payButton`). Lint rules can catch hard-coded JSX text.
- **ICU MessageFormat** for grammar:
  ```
  "cart.items": "{count, plural, =0 {Your basket is empty} one {# item} other {# items}}"
  ```
  Languages have different plural categories (Arabic has six; Japanese has one). Don't concatenate ("You have " + n + " items"), because word order differs.
- **Formatting via `Intl`:** `Intl.NumberFormat` (currency, units, compact), `Intl.DateTimeFormat` (dates and times with time zones), `Intl.RelativeTimeFormat`, `Intl.ListFormat`, `Intl.PluralRules`, `Intl.Collator` for sorting names.
- **Libraries:** react-intl (FormatJS), i18next/react-i18next, next-intl, Lingui; choose one with ICU support and good tooling.
- **Locale detection and routing:** locale in the URL (`/de/products`) for shareability and SEO; detect from saved preference, then `Accept-Language`, then default; let users switch explicitly and persist it; `hreflang` alternate links and `<html lang>`.
- **Loading:** split catalogues by locale and namespace (per route or feature), load the current locale only, server-render with the right messages, avoid flashes of untranslated keys.
- **RTL:** `dir="rtl"` on `<html>`; CSS logical properties (`margin-inline-start`, `padding-inline-end`, `text-align: start`); mirror directional icons (arrows, chevrons) but not logos or media controls; test bidirectional text (`<bdi>` for user-generated names).
- **Layout resilience:** German strings are often 30% longer; avoid fixed widths; Japanese needs different line-breaking; fonts with full character support.
- **Workflow:** extract keys from code in CI, sync with a translation management system (Crowdin, Lokalise, Phrase), give translators context (screenshots, descriptions, character limits), review cycles, fallback to default language for missing keys with monitoring.
- **Testing:** pseudo-localisation (accented, expanded strings like `[Ŝàvé ðŕàƒţ ~~~]`) to find hard-coded text and truncation; RTL screenshot tests; formatting unit tests per locale.

#### Model answer
"I'd separate two things: internationalisation, making the product able to support any locale, and localisation, actually translating and adapting it for each one. The architecture is about the first, so that adding a sixteenth language is a content task, not an engineering project.

**Messages.** Every user-facing string lives in message catalogues keyed by meaningful ids, like `checkout.payButton`, never hard-coded in components. I'd add a lint rule that flags raw text in JSX. Messages use ICU MessageFormat so grammar is handled by translators, not code: `{count, plural, one {# item} other {# items}}`. That matters because languages have different plural rules: English has two forms, Arabic six, Japanese one. And I never build sentences by concatenation, because word order changes between languages; placeholders and rich-text tags inside messages handle that, like 'By continuing you agree to our `<link>`terms`</link>`'.

**Formatting.** Numbers, currencies, dates, relative times, lists and sorting all go through the `Intl` APIs with the active locale: `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })` gives '1.234,56 €'. Dates use the user's time zone where it's a moment in time, and plain dates for calendar values. Sorting names uses `Intl.Collator`.

**Library.** I'd pick a library with ICU support and good tooling, like FormatJS/react-intl, next-intl for a Next.js app, or i18next with the ICU plugin, and wrap it in our own small `t()` and `<Trans>` helpers.

**Locale routing.** The locale goes in the URL, `/de/...`, `/ja/...`, so pages are shareable and indexable. On first visit, I'd use a saved preference, then the `Accept-Language` header, then a default, and redirect accordingly, but always let users switch explicitly and remember the choice. Pages include `hreflang` alternates and `<html lang>` for SEO and screen readers.

**Loading translations.** Catalogues are split by locale and by namespace, per route or feature, so a German user on the checkout page downloads only German checkout and common messages, not all 15 languages. With server rendering, the right messages are rendered on the server, so there's no flash of untranslated keys.

**Right-to-left.** For Arabic, `dir='rtl'` on the html element, and CSS written with logical properties: `margin-inline-start` instead of `margin-left`, `text-align: start`. Directional icons like arrows and chevrons are mirrored; logos and media play buttons are not. User names in mixed-direction text get isolated with `<bdi>`.

**Layout resilience.** German text is often much longer, so no fixed widths on buttons and labels; Japanese needs suitable fonts and line breaking.

**Workflow.** CI extracts message keys and syncs them with a translation management system such as Lokalise or Crowdin. Translators get context: screenshots, descriptions and character limits. Missing translations fall back to English and are reported, so we can see gaps.

**Testing.** Pseudo-localisation, a fake locale that adds accents and expands strings by about 30%, quickly shows hard-coded text and truncation. RTL visual regression tests, and unit tests for formatting in key locales."

#### Another worked example
**Why concatenation breaks.**
```
Code:      "Deleted " + count + " files from " + folder
English:   Deleted 3 files from Reports
German:    3 Dateien aus Reports gelöscht   (verb at the end)
Japanese:  Reports から 3 個のファイルを削除しました
Fix:       t('files.deleted', { count, folder })
           en: "Deleted {count, plural, one {# file} other {# files}} from {folder}"
           de: "{count, plural, one {# Datei} other {# Dateien}} aus {folder} gelöscht"
```

#### A third worked example
**B2B dashboard versus consumer marketing site.**
- **B2B dashboard:** locale and time zone are user and account settings (not just browser language); numbers and dates in reports must match the account's reporting conventions; exports use locale-aware formats.
- **Consumer marketing site:** locale-prefixed URLs and `hreflang` for SEO, localised content per market (prices, imagery, legal text), sometimes different pages per country.

#### Variations you might be asked
- "How do you handle plurals in different languages?"
- "How would you add right-to-left support to an existing app?"
- "How do you prevent hard-coded strings from creeping back?"

#### Step-by-step framework
1. **i18n vs l10n** distinction.
2. **Message catalogues** with keys and ICU format; no concatenation.
3. **Intl formatting** for numbers, dates, lists and sorting.
4. **Locale detection and URL routing**, SEO.
5. **Efficient loading** by locale and namespace; SSR.
6. **RTL and layout resilience**.
7. **Translation workflow** with context and fallbacks.
8. **Testing**: pseudo-localisation, RTL screenshots, formatting tests.

#### Strong versus weak answer
| Weak | Strong |
|---|---|
| Translates strings with concatenation | ICU messages with plurals and placeholders |
| Hand-formatted dates and prices | Intl APIs with locale and time zone |
| Loads every language upfront | Per-locale, per-namespace loading |
| `margin-left` everywhere | Logical properties and selective mirroring |
| No translator context | Screenshots, descriptions, character limits |

#### Useful phrases
- "Adding a language should be a content task, not an engineering project."
- "Translators own grammar; code passes values."
- "Write CSS in logical directions: start and end, not left and right."
- "Pseudo-localisation finds the bugs before translators do."

#### Common pitfalls
- **String concatenation**.
- **Assuming two plural forms**.
- **Flags for languages** (languages aren't countries).
- **Fixed-width UI** that truncates German.
- **Locale only in localStorage**, hurting SEO and causing hydration mismatches.

#### Follow-ups to expect (with sample answers)
- **"Language or country?"** — "Separate them: language for messages (`es`), region for formatting and content (`es-MX`), and let users choose."
- **"How do you handle user-generated content?"** — "Store its language, offer machine translation on demand, and isolate it in mixed-direction text."
- **"How do you avoid hydration mismatches with dates?"** — "Render with the same locale and time zone on server and client, passing the user's settings from the server."
- **"How do you keep translations in sync with code changes?"** — "CI extraction, key change detection, and blocking releases only on missing critical-path translations."
- **"What about images with text?"** — "Avoid text in images; if needed, localised assets per locale."

#### What senior interviewers look for
- **Correct grammar handling** and Intl use.
- **Scalable workflow and performance**.
- **RTL and SEO awareness**.

#### Practise it
- Convert three concatenated strings in an app to ICU messages with plurals.
- Turn on a pseudo-locale and list every hard-coded string and truncation it reveals.
- Checklist: keys not strings · ICU plurals · no concatenation · Intl formatting · URL locales and hreflang · per-namespace loading · logical CSS · mirroring rules · translator context · pseudo-localisation.
