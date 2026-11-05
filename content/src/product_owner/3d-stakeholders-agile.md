# Product Owner — Stakeholders & Agile Delivery (continued)

## Scaling agile: SAFe and PI planning
- id: po-agile-17
- round: STAKEHOLDER_AGILE
- difficulty: medium
- levels:
- tags: SAFe, PI planning, scaling agile, alignment

### Prompt
Have you worked in a scaled agile framework like SAFe? What is PI planning, and what is the Product Owner's role in it?

### Answer
#### What the interviewer is really testing
- Familiarity with **scaled agile** concepts, often used in banks, insurers, telecoms and the public sector.
- Understanding of **PI planning** and how teams align across an "Agile Release Train".
- The **PO's responsibilities** in a scaled setting.
- A **balanced view** of benefits and drawbacks.

#### Key points
- **SAFe (Scaled Agile Framework)** coordinates many agile teams working on a shared product or solution.
- **Agile Release Train (ART)**: a long-lived group of teams (often 5–12 teams, roughly 50–125 people) delivering together.
- **Program Increment (PI)**: a planning period, typically **8–12 weeks** (often 4–5 sprints plus an innovation and planning sprint).
- **PI planning**: a regular event (often 2 days) where all teams on the train plan together, align on objectives, and identify **dependencies and risks**.
- Roles: **Product Management** (owns the train's priorities and features), **Product Owners** (own team backlogs and stories), **Release Train Engineer** (facilitates the train, like a chief Scrum Master), **Business Owners** (key stakeholders).
- PO responsibilities in PI planning: **refining features into stories**, **drafting team PI objectives**, **managing dependencies**, **clarifying scope** with the team.

#### Model answer
"Yes. In a scaled setting, several teams contribute to the same product, so alignment becomes the big challenge. SAFe addresses that with a shared cadence and joint planning.

**Key concepts:**
- An **Agile Release Train** is a group of teams that plan, deliver and demo together, e.g. eight teams working on a bank's mobile app.
- A **Program Increment (PI)** is usually 8–12 weeks.
- **PI planning** is a regular event, often two days, where all teams plan the next increment together.

**How PI planning typically works:**
- **Day 1**: leadership presents business context and vision; Product Management presents the top **features** for the PI. Teams then break features into stories, estimate their capacity, and draft plans and **PI objectives**. Dependencies are mapped on a shared **programme board**.
- **Day 2**: teams adjust plans based on feedback and dependencies, identify **risks** and handle them using ROAM (Resolved, Owned, Accepted, Mitigated), and commit to their objectives with a **confidence vote**.

**My role as a PO in PI planning:**
- **Before**: work with Product Management to understand the features for my team, refine them into stories with my team, and clarify acceptance criteria.
- **During**: help the team plan stories into sprints within capacity, draft clear **PI objectives** with business value, negotiate scope with Product Management, and work with other POs on **dependencies**.
- **After**: keep the team backlog aligned with the PI plan, track progress, and communicate changes.

**Benefits:** alignment across many teams, dependencies surfaced early, and stakeholders get a clear view of what's coming.

**Drawbacks:** it can become heavy and bureaucratic, planning 10+ weeks ahead reduces flexibility, and teams can lose sight of customers if the focus shifts to process. I try to keep it focused on outcomes, keep plans adaptable, and maintain direct customer contact.

**Example.** In a PI planning event for a bank's mobile app, my team's planned feature (in-app card controls) depended on a security team's new authentication service. We spotted it on the programme board on day one, agreed a timeline with the security team's PO, and adjusted our sprint order, so the dependency was delivered in sprint 2 rather than discovered late."

#### Another worked example: a lighter alternative
"In a smaller organisation with three teams, full SAFe was too heavy. We used a lightweight quarterly planning day: shared goals, team plans, a dependency board and a risk review. It kept the alignment benefits without the full framework."

#### SAFe roles at a glance
| Role | Responsibility |
|---|---|
| Product Management | Train-level priorities and features |
| Product Owner | Team backlog, stories, acceptance |
| Release Train Engineer | Facilitates the train and events |
| Business Owners | Key stakeholders; assign business value |
| System Architect | Technical direction for the train |

#### Step-by-step framework
1. **Explain why scaling** is needed (alignment across teams).
2. **Define ART, PI and PI planning.**
3. **Describe the two days** of PI planning.
4. **Explain the PO's role** before, during and after.
5. **Give a balanced view** of benefits and drawbacks.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "SAFe is a big meeting every quarter." | Explains ART, PI and planning clearly |
| Doesn't know the PO's role | Describes PO responsibilities before, during and after |
| Uncritical, or dismissive | Balanced view of benefits and drawbacks |
| No example | Example of handling a dependency |

#### Useful phrases
- "In a scaled setting, alignment across teams is the main challenge."
- "PI planning surfaces dependencies early, on a shared board."
- "We write PI objectives that express business value, not just features."
- "I try to keep it focused on outcomes and customers, not just process."

#### Common pitfalls
- **Confusing roles** (Product Manager versus Product Owner in SAFe).
- **Over-committing** in PI planning.
- **Treating the PI plan as fixed.**
- **Losing customer focus** in process-heavy environments.

#### Follow-ups to expect (with sample answers)
- **"What does ROAM mean?"**
  "A way to handle risks: Resolved, Owned (someone takes responsibility), Accepted, or Mitigated."
- **"What's the confidence vote?"**
  "At the end of PI planning, teams vote (often 1–5 fingers) on their confidence in meeting the objectives. Low confidence triggers discussion and re-planning."
- **"Other scaling frameworks?"**
  "LeSS (Large-Scale Scrum), Scrum@Scale, Nexus, and lighter approaches like the Spotify-inspired model of squads and tribes, though each organisation adapts these."

#### What senior interviewers look for
- **Navigating large organisations** effectively.
- **Adapting frameworks** to context.
- Maintaining **outcome and customer focus** at scale.

#### Practise it
1. Explain PI planning **in 90 seconds** to someone who's never heard of it.
2. Write two PI objectives for a team, each with business value.
3. List three benefits and three risks of SAFe.

## Release planning, feature flags and staged rollouts
- id: po-agile-18
- round: STAKEHOLDER_AGILE
- difficulty: medium
- levels:
- tags: release planning, feature flags, rollouts, risk

### Prompt
How do you plan releases? How do you use feature flags and staged rollouts to reduce risk?

### Answer
#### What the interviewer is really testing
- Understanding of **modern release practices**.
- **Risk management**: limiting the impact of problems.
- Coordinating **technical releases with business launches**.
- Using releases to **learn** (experiments, beta groups).

#### Key points
- Separate **deployment** (code goes to production) from **release** (users see it). **Feature flags** make this possible.
- **Staged rollouts**: release to a small percentage first (e.g. internal → 1% → 10% → 50% → 100%), monitoring at each stage.
- **Beta programmes** and **early access** groups for feedback.
- **Monitoring and rollback plans** are essential.
- **Go/no-go criteria** for each stage.
- Coordinate with **marketing, support and sales** for launch timing.
- **Clean up flags** after full release.

#### Model answer
"I plan releases to minimise risk and maximise learning, using feature flags and staged rollouts.

**1. Separate deploying from releasing.** The team deploys code to production continuously, but new features are hidden behind **feature flags**. This means I can decide when, and for whom, a feature becomes visible, independently of the engineering schedule.

**2. Plan the rollout in stages.** For a new checkout flow:
- **Internal users** (staff) first, to catch obvious issues.
- **1%** of customers, monitoring errors and key metrics.
- **10%**, then **50%**, then **100%**, with checks at each step.

At each stage, we have **go/no-go criteria**: e.g. error rate below a threshold, payment success at least equal to the old flow, no spike in support tickets.

**3. Monitor and be ready to roll back.** Dashboards for errors, performance and business metrics, with alerts. If something goes wrong, we turn the flag off instantly. No emergency deployment needed.

**4. Use releases to learn.**
- **Beta programmes**: invite engaged customers to try features early and give feedback.
- **A/B tests**: release to a percentage and compare against the old experience.
- **Targeted releases**: e.g. release to one country or customer segment first.

**5. Coordinate the business launch.** Because the feature is already deployed and tested with real users, the marketing launch can happen on a chosen date by switching the flag on for everyone, with support and sales prepared in advance.

**6. Clean up.** Once fully released and stable, we remove the flag and the old code, to avoid technical debt.

**Example.** We rolled out a new payments provider to 1% of transactions first. Monitoring showed a slightly higher failure rate for one card type. We paused, fixed the issue, then continued to 100% over two weeks. Without staged rollout, that issue would have hit every customer."

#### Another worked example: a regulated launch
"For a banking feature requiring regulatory approval, we deployed it behind a flag weeks before approval, tested it internally and with a small staff group, and switched it on the day approval came through. This removed the usual last-minute release risk."

#### Rollout stages
| Stage | Audience | Purpose |
|---|---|---|
| Internal | Staff | Catch obvious issues |
| Canary (1%) | Small share of customers | Detect problems with minimal impact |
| Beta / early access | Engaged customers | Feedback |
| 10–50% | Larger share | Confirm metrics; A/B test |
| 100% | Everyone | Full launch |

#### A third worked example: rolling out a pricing change
"We needed to change our pricing page and checkout to introduce a new plan.
- **Feature flag by segment**: new visitors in one country first, so existing customers weren't affected.
- **Stages**: 10% of new visitors in that country for a week, then 50%, then 100%, then other countries.
- **Go/no-go criteria**: trial sign-up rate no lower than control, paid conversion stable, no increase in billing support tickets.
- **What we found**: at 10%, sign-ups were steady but customers asked support whether the old plan still existed. We added a comparison note before expanding.
- **Result**: full rollout in four weeks, with revenue per new customer up 9% and no spike in support tickets."

#### What to monitor at each stage
- **Technical**: error rates, latency, crashes.
- **Business**: conversion, revenue, task completion.
- **Customer**: support tickets, feedback, app reviews.
- **Operational**: load on support, operations or partners.

#### Step-by-step framework
1. **Deploy behind feature flags.**
2. **Plan staged rollout** with go/no-go criteria.
3. **Monitor** technical and business metrics.
4. **Roll back** instantly if needed.
5. **Learn** with betas and experiments.
6. **Coordinate** the business launch.
7. **Clean up** flags.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We release everything at once." | Staged rollouts with monitoring |
| Releases tied to deployments | Feature flags separate deploy from release |
| No rollback plan | Instant switch-off via flags |
| No criteria | Go/no-go criteria per stage |
| Flags left forever | Flags cleaned up |

#### Useful phrases
- "Feature flags let us deploy without releasing."
- "We'll start at 1%, check the metrics, then expand."
- "If something goes wrong, we turn it off in seconds."
- "The marketing launch is just switching the flag on for everyone."

#### Common pitfalls
- **Big-bang releases.**
- **No monitoring or rollback plan.**
- **Too many old flags**, increasing complexity.
- **Uncoordinated launches** with support and marketing.

#### Follow-ups to expect (with sample answers)
- **"What's a canary release?"**
  "Releasing to a small group first, like a canary in a coal mine, to detect problems before they affect everyone."
- **"What are the risks of feature flags?"**
  "Complexity, testing combinations of flags, and forgotten flags. We manage them with naming conventions, ownership and regular clean-up."
- **"Who decides when to move to the next stage?"**
  "The PO, with the tech lead, based on agreed criteria and monitoring data."

- **"How do you choose which users get a feature first?"**
  "Low-risk segments (internal staff, new users, a single market), or engaged customers who've opted into betas, depending on what we want to learn."
- **"How do you avoid inconsistent experiences for users during a rollout?"**
  "Keep assignment stable per user, avoid switching people between versions, and make sure support knows who sees what."

#### What senior interviewers look for
- **Progressive delivery** as a standard practice.
- **Release governance** that's safe but not slow.
- Linking releases to **learning and experimentation**.

#### Practise it
1. Write a staged rollout plan for a new feature, with go/no-go criteria at each stage.
2. Explain feature flags to a non-technical stakeholder **in 60 seconds**.
3. Describe what you'd monitor at the 1% stage.

## Working in a regulated environment
- id: po-agile-19
- round: STAKEHOLDER_AGILE
- difficulty: medium
- levels:
- tags: regulation, compliance, risk, financial services

### Prompt
How do you work as a Product Owner in a regulated industry like banking, insurance or healthcare? How do you balance compliance with speed?

### Answer
#### What the interviewer is really testing
- Experience or understanding of **regulated environments**.
- Whether you see compliance as a **partner**, not a blocker.
- How you **build compliance into the process** rather than leaving it to the end.
- Whether you can **deliver quickly** while meeting requirements.

#### Key points
- Regulations protect **customers** (e.g. fair treatment, data protection, financial safety). Understanding the **why** helps.
- **Involve compliance, legal and risk early**: in discovery and refinement, not just before launch.
- Build requirements into **acceptance criteria and the Definition of Done**.
- Maintain **audit trails** and documentation.
- Use **risk-based** approaches: more scrutiny for higher-risk changes.
- **Agile works in regulated industries** with the right practices.
- Examples: UK FCA rules (including **Consumer Duty**), GDPR, PSD2 (payments), healthcare data rules.

#### Model answer
"I see compliance as a partner in building products customers can trust. In regulated industries, the fastest way to deliver is to involve compliance early, so we avoid surprises and rework.

**1. Understand the 'why'.** Regulations generally exist to protect customers: making sure they're treated fairly, understand what they're buying, and their money and data are safe. For example, in UK financial services, the FCA's **Consumer Duty** requires firms to deliver good outcomes for customers. Understanding that helps me design better products, not just compliant ones.

**2. Involve compliance early:**
- Invite compliance and legal to **discovery** and **refinement** for relevant features.
- Share early concepts, wording and flows, so they can flag issues before development.
- Agree up front which changes need formal review and which don't.

**3. Build compliance into the process:**
- **Acceptance criteria**: e.g. 'Fees are displayed clearly before the customer confirms', 'Customer consent is recorded with timestamp'.
- **Definition of Done**: e.g. compliance sign-off for customer-facing wording, security review for personal data changes.
- **Templates** for common needs (e.g. approved wording for risk warnings).

**4. Risk-based approach.** Not every change needs the same scrutiny. A button colour change doesn't need compliance review; a change to how interest is calculated does. Agreeing categories speeds up the low-risk changes.

**5. Documentation and audit trails.** Record decisions, approvals and test evidence, so we can show regulators how we met requirements.

**6. Keep moving fast:**
- Small, frequent releases make reviews easier.
- Feature flags let us deploy and wait for approval to release.
- Regular check-ins with compliance avoid bottlenecks.

**Example.** For a new savings account feature, I involved compliance from discovery. They helped us design clearer interest-rate explanations and a cooling-off period flow. Because their requirements were in acceptance criteria from the start, final sign-off took two days instead of the usual two weeks, and customer complaints about unclear terms were lower than for previous launches."

#### Another worked example: healthcare
"In a health app handling patient data:
- Data protection and medical device rules shaped requirements early.
- Clinical safety review was included for features affecting health advice.
- We kept an audit trail of design decisions and testing.
- Releases were smaller and more frequent, which made reviews faster."

#### Building compliance into agile
| Practice | How |
|---|---|
| Early involvement | Compliance in discovery and refinement |
| Acceptance criteria | Regulatory requirements written into stories |
| Definition of Done | Reviews and sign-offs where needed |
| Risk categories | Different review levels by risk |
| Documentation | Decisions, approvals, test evidence |
| Feature flags | Deploy, then release after approval |

#### A third worked example: a fast compliance turnaround
"A competitor launched a feature letting customers split bills, and leadership wanted something similar within six weeks. In our bank, any new payment flow needed compliance review.
- **Week 1**: I shared the concept, flows and draft wording with compliance before design was finished.
- **Their input**: they asked for clear confirmation screens, limits on amounts, and fraud monitoring for unusual patterns.
- **Built in**: these became acceptance criteria and part of the Definition of Done.
- **Review**: compliance reviewed the working feature in a test environment two weeks before launch, with only minor wording changes.
- **Result**: launched in five and a half weeks, with no regulatory issues and lower fraud rates than our other peer-to-peer features."

#### Common regulations a PO may encounter
- **Data protection**: GDPR / UK GDPR.
- **Financial services**: FCA rules (including Consumer Duty), PSD2 / strong customer authentication, anti-money laundering checks.
- **Accessibility**: the Equality Act (UK), the European Accessibility Act.
- **Health**: medical device regulations, health data rules.
- **Consumer protection**: fair terms, clear pricing, cancellation rights.

#### Step-by-step framework
1. **Understand** the purpose of regulations.
2. **Involve** compliance, legal and risk early.
3. **Embed** requirements in stories and the Definition of Done.
4. **Use risk-based** review levels.
5. **Document** for audit.
6. **Release in small increments.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Compliance slows us down." | Treats compliance as a partner |
| Compliance at the end | Compliance involved from discovery |
| All changes reviewed the same | Risk-based review levels |
| No documentation | Audit trails maintained |
| Big releases | Small releases that are easier to review |

#### Useful phrases
- "Regulations exist to protect customers, so understanding the why helps us build better products."
- "Involving compliance early is the fastest route to launch."
- "Regulatory requirements are part of our acceptance criteria."
- "Low-risk changes don't need the same review as high-risk ones."

#### Common pitfalls
- **Treating compliance as a blocker.**
- **Involving compliance at the last minute.**
- **Ignoring documentation.**
- **Assuming agile can't work** in regulated industries.

#### Follow-ups to expect (with sample answers)
- **"What's Consumer Duty?"**
  "A UK FCA requirement for financial firms to deliver good outcomes for retail customers, covering products and services, price and value, consumer understanding, and consumer support."
- **"What if compliance and the business disagree?"**
  "Understand the specific risk, explore alternatives that meet both needs, and escalate with options if necessary. Compliance requirements themselves aren't negotiable."
- **"How do you handle regulatory deadlines?"**
  "Clarify the exact requirements, scope the minimum needed, plan with a buffer, and track progress closely."

- **"How do you stay up to date with regulations?"**
  "Regular check-ins with compliance and legal, internal briefings, and following regulator updates relevant to the product."
- **"How do you explain regulatory requirements to engineers?"**
  "Explain the customer-protection reason behind them, translate them into clear acceptance criteria, and invite compliance to refinement when needed."

#### What senior interviewers look for
- **Regulatory strategy** as part of product strategy.
- **Strong relationships** with compliance, legal and risk.
- **Processes** that balance speed and safety.

#### Practise it
1. Write three acceptance criteria for a financial product feature that reflect regulatory requirements.
2. Create a simple risk categorisation (low/medium/high) for product changes, with review levels.
3. Explain your approach **out loud in 3 minutes**.

## Your first 90 days as a new Product Owner
- id: po-agile-20
- round: STAKEHOLDER_AGILE
- difficulty: medium
- levels:
- tags: onboarding, first 90 days, relationships, learning

### Prompt
If you joined us as a Product Owner, what would you do in your first 90 days?

### Answer
#### What the interviewer is really testing
- Whether you **listen and learn** before making changes.
- How you **build relationships** and credibility.
- Whether you **deliver early value** while learning.
- Structured thinking about **onboarding into a new role**.

#### Key points
- **Days 1–30: learn**. People, product, customers, data, processes, strategy.
- **Days 31–60: contribute**. Small improvements, start shaping priorities, quick wins.
- **Days 61–90: lead**. Propose a clear plan or strategy for your area, based on what you've learned.
- **Build relationships** throughout.
- **Avoid big changes too early**, but don't be passive.
- **Quick wins** build trust.

#### Model answer
"I'd structure my first 90 days into three phases: learn, contribute, then lead.

**Days 1–30: Learn**
- **People**: meet my manager to understand expectations and how success will be measured. One-to-ones with every team member, key stakeholders (sales, support, marketing, operations, leadership), and other POs.
- **Customers**: talk to at least 5–10 customers, listen to support calls, read reviews and support tickets.
- **Product**: use the product extensively, including onboarding and key journeys.
- **Data**: understand key metrics, dashboards and current performance.
- **Processes**: observe how the team works (planning, refinement, releases), without changing anything yet.
- **Strategy**: understand company goals and how my product area contributes.

**Days 31–60: Contribute**
- Take ownership of the backlog and sprint goals.
- Make **small, visible improvements**: e.g. clearer stories, a better sprint review, cleaning up the backlog.
- Deliver a **quick win**, something valuable the team can ship quickly, e.g. fixing a top customer pain point found in research.
- Share what I'm learning: themes from customer conversations, observations about data.

**Days 61–90: Lead**
- Propose a **clear plan** for my area: goals, priorities, roadmap and key metrics, based on evidence gathered.
- Agree it with my manager, the team and stakeholders.
- Propose process improvements where needed, with the team.
- Set up regular rhythms: stakeholder updates, customer interviews, metric reviews.

**Throughout:** ask lots of questions, write down observations (a 'learning log'), and build trust by being reliable and transparent.

**Example.** In my last role, in the first month I discovered from support data that 20% of tickets related to one confusing billing screen. In month two, the team redesigned it in one sprint, and those tickets dropped by about 60%. That quick win built trust with the team and stakeholders, and gave me credibility when I proposed the quarterly roadmap in month three."

#### Another worked example: joining a struggling team
"If the team is behind on commitments and morale is low:
- In the first weeks, listen to the team's frustrations and understand root causes.
- Stabilise first: clearer priorities, realistic plans, protecting the team from distractions.
- Deliver one achievable goal to rebuild confidence.
- Then move to longer-term strategy."

#### 30/60/90 plan
| Phase | Focus | Key outputs |
|---|---|---|
| Days 1–30 | Learn | Relationships, customer insights, understanding of metrics and processes |
| Days 31–60 | Contribute | Backlog ownership, quick win, small improvements |
| Days 61–90 | Lead | Roadmap and goals, agreed plan, regular rhythms |

#### A third worked example: a 30/60/90 plan for a specific role
"For a PO role owning a mobile banking app's onboarding:
- **Days 1–30**: meet the team, compliance, fraud, marketing and support; review the onboarding funnel (completion, drop-off points, verification pass rates); listen to support calls; go through onboarding myself on several devices.
- **Days 31–60**: own the backlog; deliver a quick win, e.g. clearer error messages at identity verification, where data shows the biggest drop; start weekly customer interviews.
- **Days 61–90**: propose an onboarding roadmap with a goal such as 'increase completion from 58% to 68%', agreed with stakeholders; set up a funnel dashboard and a regular review rhythm.

This shows the interviewer you've thought specifically about *their* role."

#### Questions to ask in your first one-to-ones
- "What's working well, and what's frustrating?"
- "What do you need from the product team that you're not getting?"
- "What should I definitely not change in my first months?"
- "Who else should I talk to?"

#### Step-by-step framework
1. **Learn**: people, customers, product, data, processes, strategy.
2. **Contribute**: ownership, small improvements, quick win.
3. **Lead**: plan, roadmap, metrics, rhythms.
4. **Build relationships** throughout.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd change the process straight away." | Learns before changing |
| Only meets the team | Meets team, stakeholders and customers |
| No early value | Delivers a quick win |
| No clear plan | Proposes an evidence-based plan by day 90 |

#### Useful phrases
- "I'd spend the first month mostly listening and learning."
- "A quick win builds trust and momentum."
- "By day 90, I'd propose a plan based on what I've learned."
- "I'd talk to customers in my first weeks, not just colleagues."

#### Common pitfalls
- **Changing too much too soon.**
- **Being passive** for too long.
- **Not talking to customers.**
- **Ignoring relationships** with stakeholders.

#### Follow-ups to expect (with sample answers)
- **"What if you find serious problems in week one?"**
  "If it's urgent (e.g. a major customer issue), address it immediately. Otherwise, note it and understand the context before acting."
- **"How would you measure your success at 90 days?"**
  "Strong relationships, a clear agreed plan, a quick win delivered, and the team and stakeholders confident in the direction."
- **"What would you need from your manager?"**
  "Clear expectations, introductions to key people, access to data and customers, and regular feedback."

- **"What would you do if you disagreed with the existing roadmap?"**
  "Understand how and why it was set, gather evidence, and propose changes at the right time with data, rather than overturning it in week one."
- **"How do you build credibility quickly?"**
  "Listen well, learn the domain fast, deliver a visible quick win, and follow through on every commitment."

#### What senior interviewers look for
- **Strategic onboarding** into larger areas.
- **Diagnosing organisational issues** quickly.
- Building **credibility** with leadership early.

#### Practise it
1. Write a 30/60/90 plan for the role you're applying for, specific to the company.
2. List the 10 people you'd meet first and what you'd ask them.
3. Present it **out loud in 4 minutes**.

## A difficult stakeholder keeps bypassing you
- id: po-agile-21
- round: STAKEHOLDER_AGILE
- difficulty: hard
- levels:
- tags: stakeholder management, conflict, influence, boundaries

### Prompt
A senior stakeholder keeps going directly to your developers with requests, bypassing you and the backlog. How do you handle it?

### Answer
#### What the interviewer is really testing
- **Courage and diplomacy** in addressing a problem with a senior person.
- Whether you **understand the root cause** rather than reacting.
- How you **protect the team** without damaging relationships.
- Whether you **improve the process** so it doesn't happen again.

#### Key points
- **Understand why** they're bypassing you: urgency, lack of trust, frustration with the process, habit, or not knowing how to engage.
- **Talk to them privately**, focusing on shared goals and impact, not blame.
- **Explain the cost** of bypassing (disrupted focus, hidden trade-offs, delays to other commitments).
- **Make the right path easy**: quick response, a regular slot, transparency.
- **Support the team**: give them a simple way to redirect requests.
- **Escalate** only if the pattern continues.

#### Model answer
"I'd handle it in a few steps, starting with understanding rather than confronting.

**1. Understand the impact.** I'd talk to the developers: what has been asked, how often, and how it's affecting their work? Say the Head of Operations has asked three developers for 'small' changes over two sprints, which added up to about 20% of the team's capacity and caused us to miss a sprint goal.

**2. Understand why.** I'd think about possible reasons:
- Their requests feel **urgent** and they think the formal process is too slow.
- They **don't trust** that their requests will be prioritised.
- They have **good relationships** with developers and it's become a habit.
- They **don't know** the process.

**3. Talk to them privately**, with empathy and facts:
> 'I wanted to talk about how we can get your requests handled quickly. I've noticed several requests going straight to the developers. I completely understand the urgency, and I want to help. The challenge is that it's pulled about 20% of the team's time away from planned work, which caused us to miss our sprint goal for the payments release. If requests come through me, I can make the trade-offs visible and make sure the most important things get done first, including yours.'

**4. Make the right path easy:**
- **Respond quickly** to their requests, e.g. within a day.
- Offer a **regular slot**, such as a fortnightly 20-minute catch-up to review their needs.
- **Show transparency**: where their requests are on the backlog, and why.
- For genuinely urgent issues, agree a **fast-track process**.

**5. Support the team.** I'd give developers a simple, friendly way to redirect: 'Thanks, that sounds important. Can you raise it with our PO so we can prioritise it properly?' and make it clear I'll handle any follow-up.

**6. Follow up and escalate if needed.** If it continues after the conversation, I'd raise it with my manager and theirs, with data on the impact, focusing on finding a solution together.

**Example.** After this conversation and setting up a fortnightly slot, the Head of Operations stopped bypassing the team. We discovered several of their requests were related to the same reporting gap, which we solved properly in one feature, reducing their need for ad-hoc requests."

#### Another worked example: the bypass reveals a real problem
"A sales director kept asking developers for custom data exports. Investigating, I found sales genuinely needed better reporting, and the backlog hadn't prioritised it because their needs weren't visible. We built a self-service export, which removed the need for bypassing entirely. The bypassing was a symptom, not the problem."

#### A third worked example: a founder who bypasses the PO
"In a startup, the founder messaged developers directly with ideas late at night, and developers felt obliged to act on them.
- **Understood the cause**: the founder was full of ideas and worried things weren't moving fast enough.
- **Created a channel for ideas**: an 'ideas' board the founder could add to anytime, which I reviewed every morning.
- **Weekly 30-minute session** with the founder to discuss ideas and priorities, using customer data.
- **Agreed a rule with the team and founder**: developers could thank the founder for ideas and point them to the board.
- **Result**: the team's focus improved, sprint goals were met more often, and the founder said the weekly session helped them see their best ideas actually get built."

#### Scripts that help
- To the stakeholder: "I want your requests to get the attention they deserve. If they come through me, I can make sure the most important ones are done first."
- For developers: "That sounds important. Could you add it to the request board, or raise it with our PO, so we can prioritise it properly?"

#### Step-by-step framework
1. **Assess the impact** with the team.
2. **Understand the reasons** for bypassing.
3. **Talk privately** with empathy and facts.
4. **Make the right path easy**: speed, regular slot, transparency.
5. **Support the team** in redirecting.
6. **Follow up** and escalate only if needed.
7. **Look for root causes** behind repeated requests.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd tell them to stop." | Understands why, then talks with empathy |
| Escalates immediately | Talks directly first |
| Blames developers for helping | Supports developers in redirecting |
| Process enforcement only | Makes the process easier and faster |
| Ignores root causes | Finds the underlying need |

#### Useful phrases
- "I want to help you get your requests handled quickly."
- "When requests go directly to developers, the trade-offs become invisible."
- "Let's set up a regular slot so your needs are always on my radar."
- "If it's urgent, here's how we can fast-track it."

#### Common pitfalls
- **Confronting** them in public.
- **Escalating straight away.**
- **Blaming the developers.**
- **Making the process slower** or more bureaucratic.
- **Ignoring the underlying need.**

#### Follow-ups to expect (with sample answers)
- **"What if they're more senior than your manager?"**
  "The same approach: a respectful private conversation with facts and an offer to help. If needed, involve my manager to support the conversation."
- **"What if the requests are genuinely valuable?"**
  "Then they should be prioritised, through the backlog, so trade-offs are visible. Bypassing still causes hidden costs."
- **"How do you prevent this with new stakeholders?"**
  "Introduce myself early, explain how to engage, and set up regular check-ins."

- **"What if a developer enjoys the direct contact and keeps doing the work?"**
  "Talk to them privately about the impact on sprint goals and fairness to other stakeholders, and agree how to redirect requests while keeping the relationship."
- **"How do you avoid seeming territorial?"**
  "Focus on shared goals and outcomes, not ownership. Make it clear the aim is to get the most important things done, including theirs."

#### What senior interviewers look for
- **Executive influence** and boundary-setting with diplomacy.
- **Systems thinking**: fixing the underlying cause.
- Protecting team **focus and wellbeing**.

#### Practise it
1. Write the opening of a private conversation with a stakeholder who bypasses you (under 100 words).
2. Write a friendly script developers can use to redirect requests.
3. Role-play the conversation with a friend **for 3 minutes**.
