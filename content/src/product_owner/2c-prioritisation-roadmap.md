# Product Owner — Prioritisation & Roadmap (continued)

## How do you run quarterly planning?
- id: po-prioritisation-13
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: quarterly planning, OKRs, alignment, capacity

### Prompt
Walk me through how you prepare for and run quarterly planning with your team and stakeholders.

### Answer
#### What the interviewer is really testing
- Your ability to **connect strategy to execution**.
- Whether planning is **evidence-based and collaborative**.
- Realistic **capacity planning** and handling **dependencies**.
- How you produce **clear commitments** while staying flexible.

#### Key points
- Planning connects **company goals → team OKRs → roadmap bets → capacity**.
- **Prepare** with evidence: last quarter's results, customer insights, data, stakeholder input, technical needs.
- **Involve the team** in shaping goals and estimating.
- Plan to **realistic capacity**: holidays, support, tech health, buffer.
- Identify **dependencies** with other teams early.
- Output: **OKRs, prioritised bets, risks**, and clear communication.
- Treat the plan as a **forecast**, reviewed during the quarter.

#### Model answer
"I treat quarterly planning as a few weeks of preparation followed by a short, focused planning process.

**1. Prepare (2–4 weeks before):**
- **Review last quarter**: which OKRs did we hit or miss, and why? What did we learn?
- **Company goals**: what leadership needs from us next quarter.
- **Evidence**: customer research themes, product data, support trends, sales feedback.
- **Stakeholder input**: one-to-ones with key stakeholders about their needs.
- **Technical needs**: tech lead's view on debt, upgrades and platform work.

**2. Draft goals and candidate bets.** I draft 1–3 objectives with key results that support company goals, and a list of candidate initiatives (bets) for each, with rough value and effort.

**3. Shape with the team.** In a workshop with engineers and designers:
- Walk through goals and evidence.
- Discuss candidate bets, challenge them, and add new ideas.
- Rough-size them (t-shirt sizes), and identify risks and dependencies.

**4. Plan to realistic capacity.**
- Start with available people-weeks, minus holidays and known absences.
- Subtract support and on-call time, tech health allocation (e.g. 20%), and a buffer (10–15%).
- Fit the highest-priority bets into what's left, being honest about what doesn't fit.

**5. Align dependencies.** Share draft plans with teams we depend on (or who depend on us), agree timings, and flag conflicts early.

**6. Review with stakeholders and leadership.** Present: OKRs, prioritised bets, what's **not** included and why, risks, and dependencies. Adjust based on feedback.

**7. Communicate and track.** Share the final plan with everyone, review progress every two weeks, and update the plan if evidence changes, explaining why.

**Example output for a quarter:**
- **Objective**: help new customers get paid faster.
- **KR1**: reduce median days to first payment from 34 to 28.
- **KR2**: 25% of active customers use automatic reminders.
- **Bets**: payment reminders (M), pay-now links (S), onboarding improvements (M).
- **Not this quarter**: multi-currency, advanced reporting.
- **Risks**: legal review of reminder wording; dependency on the payments team for links."

#### Another worked example: a scaled planning event
"In a larger organisation, several teams planned together in a two-day event:
- Each team presented draft plans and dependencies.
- A shared board showed cross-team dependencies and risks.
- Teams adjusted plans to unblock each other, and leadership resolved conflicts in real time.
- This is similar to **PI planning** in SAFe, but can be done more lightly without the full framework."

#### Capacity planning example
| Item | People-weeks |
|---|---|
| Total available (5 engineers × 12 weeks) | 60 |
| Holidays and absences | −6 |
| Support and on-call | −6 |
| Tech health (20%) | −10 |
| Buffer (10%) | −4 |
| **Available for roadmap bets** | **34** |

#### A third worked example: planning when goals change mid-quarter
"Halfway through a quarter, leadership shifted company focus from growth to profitability.
- **I re-ran a lightweight planning session** with the team: which current bets still fit, which should stop, and what new opportunities matched profitability (e.g. reducing support costs, improving conversion to paid plans)?
- **Changes**: paused a growth experiment, accelerated a self-service billing feature expected to cut support tickets by 25%, and added a pricing-page test.
- **Communication**: shared the revised plan and reasoning with stakeholders within a week.
- **Result**: the team stayed focused and aligned, and the billing feature reduced support costs significantly within two months."

#### Common planning mistakes
- Treating planning as a **document exercise** rather than a conversation.
- **Ignoring capacity reality** (holidays, support, tech health).
- **Too many objectives**, so nothing has focus.
- **Not involving engineering** in sizing and risks.

#### Step-by-step framework
1. **Review** last quarter's results.
2. **Gather** goals, evidence and stakeholder input.
3. **Draft** OKRs and candidate bets.
4. **Shape** with the team.
5. **Plan** to realistic capacity.
6. **Align** dependencies.
7. **Review**, **communicate** and **track**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I decide what we'll build next quarter." | Collaborative planning with team and stakeholders |
| Plans to 100% capacity | Accounts for absences, support, tech health and buffer |
| Feature list | OKRs plus prioritised bets |
| Ignores other teams | Aligns dependencies early |
| Plan fixed for the quarter | Reviewed and adjusted as evidence changes |

#### Useful phrases
- "We start by reviewing what we learned last quarter."
- "After absences, support, tech health and buffer, we have about 34 people-weeks for roadmap work."
- "Here's what we're not doing this quarter, and why."
- "The plan is a forecast; we'll review it every two weeks."

#### Common pitfalls
- **Over-committing** by planning to full capacity.
- **Planning alone**, without the team.
- **Ignoring dependencies.**
- **No review** of the previous quarter.
- **Treating the plan as fixed.**

#### Follow-ups to expect (with sample answers)
- **"How long should planning take?"**
  "Preparation over a few weeks, but the core planning sessions should be a day or two at most, to keep it lightweight."
- **"What if stakeholders disagree with the plan?"**
  "Go back to the shared goals and evidence, discuss trade-offs openly, and escalate with a recommendation if needed."
- **"What if something big changes mid-quarter?"**
  "Assess the impact, re-prioritise, and communicate clearly what's changing and why."

- **"How do you plan when there's a lot of uncertainty?"**
  "Commit firmly to the first month or so, keep the rest as candidate bets, and schedule a mid-quarter review."
- **"How do you get stakeholders to accept what's not in the plan?"**
  "Show the goals, evidence and capacity, explain the trade-offs, and give a clear view of when excluded items might be reconsidered."

#### What senior interviewers look for
- **Multi-team planning** and dependency management.
- Connecting **company strategy to team plans**.
- Lightweight processes that don't become **bureaucracy**.

#### Practise it
1. Draft a quarterly plan for a product you know: one objective, two key results, three bets, and two items you'd exclude.
2. Do a capacity calculation for a team of five.
3. Present the plan **out loud in 4 minutes**.

## How do you use opportunity solution trees to choose between opportunities?
- id: po-prioritisation-14
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: opportunity solution tree, continuous discovery, outcomes

### Prompt
How do you decide which customer opportunities to pursue when there are many possible problems to solve? Have you used opportunity solution trees?

### Answer
#### What the interviewer is really testing
- Familiarity with **modern discovery practices** (Teresa Torres, *Continuous Discovery Habits*).
- Whether you connect **outcomes, opportunities and solutions** clearly.
- How you **compare and choose** opportunities.
- Whether you **test assumptions** before building.

#### Key points
- An **opportunity solution tree (OST)** is a visual map:
  - **Outcome** at the top (the metric to move).
  - **Opportunities** below (customer needs, pain points or desires discovered through research).
  - **Solutions** under each opportunity.
  - **Experiments / assumption tests** under each solution.
- It keeps the team focused on the **outcome**, and prevents jumping straight to solutions.
- Compare opportunities by **size, frequency, importance to customers, alignment with strategy, and your ability to address them**.
- Explore **multiple solutions** per opportunity and **test assumptions** quickly.

#### Model answer
"I find opportunity solution trees really useful, because they make the link between our goal and what we build visible.

**How it works**, using an example:
- **Outcome**: 'Increase week-4 retention of new users from 25% to 32%.'
- **Opportunities** (from interviews and data):
  1. 'I don't know where to start when I first open the app.'
  2. 'I forget to come back after the first few days.'
  3. 'I can't see my progress, so I lose motivation.'
  4. 'The content is too easy or too hard for me.'
- **Solutions** for opportunity 2 ('I forget to come back'):
  - Smart reminders at the user's preferred time.
  - A weekly progress email.
  - Calendar integration for planned sessions.
- **Assumption tests** for 'smart reminders':
  - Do users opt in to reminders when asked during onboarding? (A quick prototype test.)
  - Do reminders increase return visits without increasing uninstalls? (A small A/B test.)

**Choosing between opportunities.** I'd compare them on:
- **Size**: how many users experience it, and how often?
- **Importance**: how much does it matter to them, and how strongly does it relate to the outcome? (E.g. users who forget to return churn far more.)
- **Strategic fit.**
- **Our ability to address it** with reasonable effort.

Say data shows 55% of churned users stopped returning within the first week, and interviews consistently mention forgetting. Opportunity 2 is large and closely linked to retention, so we'd pursue it first.

**Why it helps:**
- It keeps everyone focused on the **outcome**, not a feature list.
- It encourages **multiple solutions** rather than falling in love with the first idea.
- It makes **assumptions explicit** and testable.
- It's a great **communication tool** for stakeholders: they can see why we chose this path.

I update the tree continuously as we learn from interviews and experiments."

#### Another worked example: B2B
"Outcome: 'Increase trial-to-paid conversion from 18% to 24%.'
- Opportunities: 'Setup takes too long', 'I can't see value before the trial ends', 'I need approval from my manager to buy'.
- Interviews revealed the third opportunity was common and overlooked.
- Solutions: a shareable ROI summary for managers, a trial extension for teams, a 'request approval' email.
- Test: a fake-door 'share with your manager' button. 12% of trial users clicked it, which justified building the ROI summary."

#### Opportunity solution tree structure
| Level | Content | Example |
|---|---|---|
| Outcome | Metric to move | Week-4 retention 25% → 32% |
| Opportunities | Customer needs and pain points | "I forget to come back" |
| Solutions | Ideas to address an opportunity | Smart reminders |
| Assumption tests | Quick experiments | Opt-in prototype test |

#### A third worked example: using the tree with stakeholders
"A stakeholder was pushing for a specific feature, a gamified leaderboard.
- I showed the opportunity solution tree for our outcome (week-4 retention). The leaderboard sat under the opportunity 'I lose motivation', but our research showed 'I forget to come back' affected far more churned users.
- We agreed to keep the leaderboard as one solution to test later, and focus first on reminders, which addressed the larger opportunity.
- The visual map made the conversation about evidence rather than opinions, and the stakeholder appreciated seeing their idea on the tree."

#### Tips for building a good tree
- Keep **one outcome** per tree.
- Write opportunities **from the customer's perspective** ("I…").
- Break big opportunities into **smaller, specific ones**.
- Aim for **at least three solutions** per chosen opportunity.
- Update it **after every round of interviews and experiments**.

#### Step-by-step framework
1. **Set the outcome.**
2. **Discover opportunities** through interviews and data.
3. **Structure** them in the tree.
4. **Compare and choose** an opportunity.
5. **Generate multiple solutions.**
6. **Test assumptions** quickly.
7. **Update the tree** continuously.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Jumps straight to solutions | Maps outcome → opportunities → solutions → tests |
| One solution per problem | Explores several solutions |
| Opportunities from opinions | Opportunities from research and data |
| No comparison criteria | Compares by size, importance, fit and feasibility |
| Static | Updated continuously |

#### Useful phrases
- "The tree keeps us focused on the outcome, not a feature list."
- "This opportunity came up in most interviews and is strongly linked to churn."
- "For each opportunity, we explore at least three solutions."
- "Before building, we test the riskiest assumption."

#### Common pitfalls
- **Writing opportunities as solutions** ("we need reminders").
- **Too many outcomes** at once.
- **Opportunities based on assumptions** rather than research.
- **Building the first solution** without testing.

#### Follow-ups to expect (with sample answers)
- **"What's the difference between an opportunity and a solution?"**
  "An opportunity is a customer need or pain point ('I forget to come back'). A solution is our idea to address it ('smart reminders')."
- **"How often do you talk to customers?"**
  "Ideally every week, so the tree stays grounded in current evidence."
- **"How do you share the tree with stakeholders?"**
  "As a visual on a whiteboard or digital board, walking them through the outcome, top opportunities and current experiments."

- **"How do you prioritise between opportunities of similar size?"**
  "Consider which one we can address best given our strengths, which aligns most with strategy, and which has the most cost-effective first experiment."
- **"What tools do you use for the tree?"**
  "A digital whiteboard like Miro or FigJam works well; the key is that the team can see and update it together."

#### What senior interviewers look for
- Building **continuous discovery habits** in teams.
- Using OSTs to **align stakeholders** and justify decisions.
- Connecting **multiple trees** to company-level outcomes.

#### Practise it
1. Build an opportunity solution tree for a product you use: one outcome, four opportunities, three solutions for one opportunity, and one test.
2. Explain why you chose that opportunity, **out loud in 3 minutes**.

## How do you manage dependencies across teams on your roadmap?
- id: po-prioritisation-15
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: dependencies, cross-team, coordination, roadmap

### Prompt
Your roadmap depends on work from two other teams with their own priorities. How do you manage these dependencies?

### Answer
#### What the interviewer is really testing
- **Cross-team collaboration** and influence without authority.
- Whether you **identify dependencies early** and plan around them.
- **Risk management** and contingency planning.
- Whether you work to **reduce dependencies** over time.

#### Key points
- **Identify dependencies early**: during discovery and planning, not mid-sprint.
- **Build relationships** with the POs of other teams. Understand *their* goals.
- **Align roadmaps**: agree timing, scope and owners.
- **Make dependencies visible**: a shared board or tracker.
- **Plan contingencies**: what happens if the dependency slips?
- **Reduce dependencies**: contribute code to the other team's area (with agreement), use stable APIs, or restructure team ownership.

#### Model answer
"I'd manage dependencies in five steps.

**1. Identify them early.** During discovery and quarterly planning, I ask the tech lead: what do we need from other teams to deliver this? For example, our **'pay now' links** feature might depend on:
- The **payments team** adding a new payment-link API.
- The **notifications team** supporting new email templates.

**2. Talk to the other teams' POs early.** I'd explain what we need, why, and when, and understand their priorities. Often the best approach is showing how it helps them too: 'Payment links will increase payment volume, which is your team's key metric.' I'd involve both tech leads to agree the technical approach.

**3. Agree a plan:**
- **What** exactly is needed (scope of the API).
- **When** (aligned with their roadmap).
- **Who** owns what, and how we'll test it together.

**4. Make it visible and track it.** Dependencies go on a shared board, with dates and owners. I check in regularly with the other POs, and raise risks as soon as dates look uncertain.

**5. Plan contingencies.**
- Can we build our part against a **mock or contract** first, so we're not blocked?
- Can we release a **smaller version** that doesn't need the dependency?
- Can one of our engineers **contribute** to their codebase, with their review?

**6. Escalate early if needed.** If priorities genuinely conflict, I'd raise it with our managers with a clear proposal, rather than letting it slip silently.

**7. Reduce dependencies over time.** If we constantly depend on the same team, I'd discuss with leadership whether team ownership should change, or whether a self-service platform or API would help.

**Example.** The payments team couldn't deliver the API until mid-quarter. We agreed the API contract up front, built our side against a mock, and one of our engineers paired with them for a week. The feature launched only one week later than originally planned."

#### Another worked example: a slipping dependency
"Our launch depended on a data team delivering a new analytics pipeline, which slipped by a month.
- We launched with basic tracking using existing tools, and switched to the new pipeline once ready.
- Stakeholders were informed early of the trade-off (less detailed reporting for the first month).
- Lesson: always ask 'what's our plan B?' for any critical dependency."

#### Dependency management checklist
| Step | Action |
|---|---|
| Identify | During discovery and planning |
| Engage | Talk to other POs and tech leads early |
| Agree | Scope, timing, owners |
| Visualise | Shared tracker with dates |
| Contingency | Mocks, smaller release, contributing code |
| Escalate | Early, with a proposal |
| Reduce | Ownership changes, self-service platforms |

#### A third worked example: removing a recurring dependency
"Every new feature in my team needed a change to the shared customer database owned by the data platform team, causing delays of 2–3 weeks each time.
- **Data**: in one quarter, 6 of our 9 features were delayed by this dependency.
- **Proposal** to both teams' leads: the platform team would provide a self-service way to add new customer fields with their review, rather than doing every change themselves.
- **Result**: after a short project to build the self-service process, our team added fields in a day, the platform team spent less time on routine requests, and our feature lead time dropped noticeably."

#### Signs a dependency is becoming a structural problem
- The **same dependency** delays work repeatedly.
- Teams spend lots of time **waiting** or **coordinating**.
- **Ownership is unclear** for shared systems.
- One team becomes a **bottleneck** for many others.

#### Step-by-step framework
1. **Identify** dependencies early.
2. **Engage** other teams with shared goals.
3. **Agree** scope, timing and owners.
4. **Track** visibly.
5. **Plan contingencies.**
6. **Escalate early** if needed.
7. **Reduce** dependencies over time.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd ask them to prioritise our work." | Shows how it helps their goals too |
| Discovers dependencies mid-sprint | Identifies them during planning |
| No contingency | Mocks, smaller release, contributing code |
| Lets it slip silently | Tracks visibly and escalates early |
| Accepts permanent dependencies | Works to reduce them structurally |

#### Useful phrases
- "What do we need from other teams to deliver this?"
- "This will also help your team's goals, because…"
- "Let's agree the API contract now, so we can build against a mock."
- "What's our plan B if this slips?"

#### Common pitfalls
- **Late discovery** of dependencies.
- **Assuming** other teams will prioritise your work.
- **No contingency** plans.
- **Escalating too late**, or too aggressively.

#### Follow-ups to expect (with sample answers)
- **"What if the other team refuses?"**
  "Understand their constraints, look for alternatives (contributing code, a smaller scope), and if it's important to company goals, escalate together with a clear proposal."
- **"How do you handle dependencies in Scrum?"**
  "Make them visible in refinement and planning, avoid committing to stories blocked by dependencies, and coordinate in cross-team syncs."
- **"What is a contract-first approach?"**
  "Agreeing the interface (e.g. API format) before building, so both teams can work in parallel."

- **"How do you track dependencies across many teams?"**
  "A shared board or tool with each dependency, owner, date and status, reviewed in a regular cross-team sync."
- **"What's an inner-source model?"**
  "Teams contribute code to other teams' systems following the owners' standards and reviews, which reduces bottlenecks."

#### What senior interviewers look for
- **Organisational design thinking**: team boundaries that reduce dependencies.
- **Cross-team planning** processes.
- Strong **relationships** across the organisation.

#### Practise it
1. Map the dependencies for a feature you've worked on (or imagine one) with at least two other teams.
2. Write a contingency for each.
3. Explain your approach **out loud in 3 minutes**.

## How do you communicate a roadmap delay?
- id: po-prioritisation-16
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: communication, delays, trust, stakeholder management

### Prompt
A feature that stakeholders and customers were expecting is going to be delayed by six weeks. How do you communicate it?

### Answer
#### What the interviewer is really testing
- **Honesty and timeliness**: do you share bad news early?
- **Ownership**: do you explain without blaming?
- **Solutions**: do you come with options and a new plan?
- **Tailored communication** to different audiences.

#### Key points
- **Communicate early**, as soon as you know. Don't wait hoping it will improve.
- **Explain the reason** honestly, without blaming individuals.
- **Bring options**: reduced scope sooner, phased delivery, workarounds.
- Give a **new, realistic date** with your confidence level.
- **Tailor the message**: executives, sales, customers, the team.
- **Learn**: what can be done to avoid similar delays?

#### Model answer
"I'd communicate it as early as possible, with an honest explanation, options and a new plan.

**1. Understand the situation fully first** (but quickly). With the tech lead: why is it delayed, how confident are we in the new estimate, and what options do we have? Say the delay is because integrating with a bank partner turned out more complex: their API has limitations we didn't know about.

**2. Prepare options:**
- **Option A**: full feature in 6 weeks.
- **Option B**: release a smaller version in 2 weeks (e.g. supporting the two most common banks), with the rest following.
- **Option C**: a temporary workaround for customers who need it urgently.

**3. Tell key stakeholders first, in person or on a call**, not just by email:
> 'I want to let you know early that the bank integration will be delayed by about six weeks. The partner's API has limitations we only discovered during integration testing. I take responsibility for not identifying that risk earlier. Here are three options… My recommendation is option B: we can release support for the two most-used banks in two weeks, covering about 70% of customers, with the rest by [date]. I'm fairly confident in that date, and I'll update you weekly.'

**4. Tailor for each audience:**
- **Executives**: business impact, options, recommendation, new date.
- **Sales and customer success**: what to tell customers, revised timelines, and how to handle customers waiting for it.
- **Customers**: an honest, simple message focusing on what they'll get and when. Avoid technical detail.
- **The team**: no blame. Focus on the plan and what we learned.

**5. Follow through.** Weekly updates until delivery, and immediate notice if anything changes again.

**6. Learn.** In the retrospective: how could we have spotted this earlier? Maybe a technical spike with the partner's API during discovery. We'd add that to our process for future integrations.

Delivering bad news early, with a plan, builds more trust than delivering good news late."

#### Another worked example: communicating to customers
"Message to customers waiting for a feature:
> 'We know many of you are waiting for bank sync. We've hit an unexpected technical issue with one of our partners, so the full release will be later than planned. From [date], you'll be able to connect accounts from [Bank A] and [Bank B], with more banks following by [date]. Thank you for your patience. We'll keep you updated.'"

#### Communication plan
| Audience | Focus | Channel |
|---|---|---|
| Executives | Impact, options, recommendation | Call or meeting, then written summary |
| Sales / success | Revised timeline, talking points | Briefing session, written FAQ |
| Customers | What they'll get and when | Email, in-app, release notes |
| Team | Plan, learning, no blame | Team meeting, retrospective |

#### A third worked example: a delay that affected a partner
"Our integration with a major retailer was delayed by four weeks because of security review findings.
- **Told the partner's product lead first**, by phone, explaining the security issue in general terms and our plan to fix it.
- **Offered options**: a limited pilot with test stores on the original date, or the full launch four weeks later.
- **The partner chose the pilot**, which gave both sides early learning.
- **Internally**, I updated sales and marketing, who adjusted the joint announcement.
- **Result**: the partner appreciated the early notice, the pilot surfaced two small issues we fixed before full launch, and the relationship strengthened."

#### Checklist before announcing a delay
- Do I understand the **cause** and **confidence** in the new date?
- What **options** can I offer?
- Who needs to hear first, and **in person**?
- What do **sales and support** need to say to customers?
- What will we **change** to avoid this next time?

#### Step-by-step framework
1. **Understand** the cause and options quickly.
2. **Prepare** options and a recommendation.
3. **Tell key stakeholders first**, in person.
4. **Tailor** messages for each audience.
5. **Follow through** with regular updates.
6. **Learn** and improve the process.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Waits until the deadline to say anything | Communicates as soon as the delay is known |
| Blames engineering or the partner | Explains honestly and takes ownership |
| Just announces the new date | Brings options and a recommendation |
| One message for everyone | Tailored to each audience |
| No follow-up | Regular updates and process improvement |

#### Useful phrases
- "I want to let you know early, so you can plan around it."
- "Here's what happened, and here's what we can do."
- "My recommendation is to release a smaller version first."
- "I'm fairly confident in this date, and I'll update you weekly."
- "Bad news early is a plan; bad news late is a crisis."

#### Common pitfalls
- **Hiding delays** or hoping they'll resolve themselves.
- **Blaming** individuals or partners.
- **No options**, just a new date.
- **Over-promising again** with an unrealistic new date.
- **Forgetting sales and support**, who face customers directly.

#### Follow-ups to expect (with sample answers)
- **"What if the stakeholder is angry?"**
  "Acknowledge their frustration and its impact on them, stay calm, focus on options, and agree how we'll keep them informed."
- **"How do you avoid repeated delays?"**
  "Identify risks earlier (spikes, prototypes with partners), use ranges instead of single dates, and track progress against milestones."
- **"Would you ever not communicate a small delay?"**
  "If it doesn't affect anyone's plans, I'd still mention it in regular updates. Transparency builds trust."

- **"How do you handle repeated delays on the same project?"**
  "Step back with the team to understand the underlying cause, reassess scope and approach, reset expectations with ranges, and increase transparency with more frequent updates."
- **"Should you pad estimates to avoid delays?"**
  "Rather than hidden padding, communicate ranges and confidence levels honestly, and include explicit buffers in plans."

#### What senior interviewers look for
- **Executive communication** under pressure.
- Building **trust through transparency**.
- **Process improvements** that reduce delays across teams.

#### Practise it
1. Write a short message to an executive explaining a six-week delay, with options and a recommendation.
2. Rewrite it for customers.
3. Deliver the executive version **out loud in 2 minutes**.

## How do you deal with scope creep?
- id: po-prioritisation-17
- round: PRIORITIZATION_ROADMAP
- difficulty: easy
- levels:
- tags: scope creep, scope management, focus

### Prompt
During development, stakeholders keep adding "small" requests to a feature. How do you handle scope creep?

### Answer
#### What the interviewer is really testing
- Whether you **protect scope and delivery** while staying flexible.
- How you **evaluate new requests** against goals.
- Your **communication** with stakeholders when saying "not now".
- Whether you **prevent** scope creep through clear definition.

#### Key points
- **Scope creep**: uncontrolled growth of scope after work starts, often through many "small" additions.
- **Prevent it**: clear goals, an explicit **in/out of scope** list, and agreed **acceptance criteria** up front.
- **Evaluate new requests** against the goal: does it help achieve the outcome?
- **Make trade-offs visible**: adding something means removing something or extending the timeline.
- Keep a **"later" list** for good ideas that don't fit now.
- Be **flexible** for genuine learning (e.g. user testing reveals a real need).

#### Model answer
"I'd handle it in two ways: preventing it up front, and managing requests when they come.

**Prevention:**
- A clear **product brief** with the goal, success metrics and an explicit **in scope / out of scope** list, agreed with stakeholders before development starts.
- **Acceptance criteria** agreed in refinement.
- A shared understanding that the first release is a **first version**, with a plan for follow-ups.

**Managing new requests:**
1. **Listen and understand** the request and the reason behind it.
2. **Check it against the goal**: does it help achieve the outcome for this release? For example, if the goal is 'let customers send payment reminders', a request to add custom fonts to reminder emails doesn't help much.
3. **Assess the impact** with the team: how much effort, and what would it delay?
4. **Make the trade-off explicit**: 'We can add this, but it would push the release back by a week, or we'd need to drop X. Alternatively, we can add it to the follow-up release.'
5. **Decide**: usually it goes on the **'later' list**, with a clear note on when we'll consider it.
6. **Communicate** the decision and reasoning.

**Flexibility where it matters.** If user testing reveals a genuine problem (e.g. users can't find the reminder settings), that's not scope creep, that's learning. I'd adjust, even if it changes scope, but still make the trade-off visible.

**Example.** During development of payment reminders, stakeholders requested: SMS reminders, custom fonts, a reminder analytics dashboard, and translated templates. We kept the release focused on email reminders, added translated templates (they mattered for the target market and were small), and moved the rest to a follow-up list. The release shipped on time, and SMS reminders were prioritised later based on customer demand data."

#### Another worked example: "just one more field"
"Over three sprints, small additions to a sign-up form (extra fields requested by marketing, sales and compliance) added four fields. Conversion dropped. We reviewed each field against its purpose, removed two, made one optional, and agreed a rule: any new field needs a stated purpose and must be tested for its effect on conversion."

#### Handling new requests
| Question | If yes | If no |
|---|---|---|
| Does it support the release goal? | Consider adding, with a trade-off | Add to the "later" list |
| Is it small and essential? | Add, and communicate | Evaluate normally |
| Did testing reveal it as a real need? | Adjust scope | Treat as a new request |
| Does adding it risk the deadline? | Swap something out or move the date | Proceed |

#### A third worked example: scope creep from the team itself
"Scope creep isn't always from stakeholders. On one feature, engineers kept adding 'nice' improvements (extra settings, refactoring unrelated code), and the release slipped by two weeks.
- **In the retrospective**, we discussed it openly without blame.
- **Agreements**: improvements outside the agreed scope go on a 'later' list unless they're essential for quality; refactoring is limited to code touched by the feature; the team flags scope questions in the daily stand-up.
- **Result**: the next two releases shipped on time, and the 'later' list fed into planning, so good ideas weren't lost."

#### Questions to test a new request
- "Does this help us achieve the release goal?"
- "What happens if we ship without it?"
- "Could it be a follow-up release?"
- "What would it delay?"

#### Step-by-step framework
1. **Define scope** clearly up front (in/out, acceptance criteria).
2. **Listen** to new requests.
3. **Check against the goal.**
4. **Assess impact** with the team.
5. **Make trade-offs explicit.**
6. **Decide and communicate**, using a "later" list.
7. **Stay flexible** for genuine learning.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Accepts every small request | Evaluates requests against the release goal |
| Rejects all changes | Flexible for genuine learning |
| No defined scope | Explicit in/out scope agreed up front |
| Trade-offs hidden | Shows what adding something costs |
| Requests forgotten | "Later" list with clear follow-up |

#### Useful phrases
- "Does this help us achieve the goal of this release?"
- "We can add it, but something else would need to move."
- "Let's add it to the follow-up release, and here's when we'll review it."
- "That's not scope creep, that's learning from users, so let's adjust."

#### Common pitfalls
- **Saying yes to everything "small"**, which adds up.
- **No clear scope** to refer back to.
- **Hiding the impact** on timelines.
- **Being so rigid** you ignore real learning.

#### Follow-ups to expect (with sample answers)
- **"What if a senior stakeholder insists?"**
  "Show the trade-off clearly, and let them choose between adding it and delaying, or swapping it for something else."
- **"How is scope creep different from changing requirements?"**
  "Changing requirements based on new evidence is healthy. Scope creep is uncontrolled additions that don't serve the goal."
- **"How do you handle scope creep in fixed-price projects?"**
  "A formal change process: assess, estimate and agree any additions, with cost and timeline impact documented."

- **"How do you communicate the 'later' list so people trust it?"**
  "Keep it visible, review it in planning, and show when items from it get delivered."
- **"What's gold-plating?"**
  "Adding features or polish beyond what's needed, often by the team itself. It's a form of scope creep that delays value."

#### What senior interviewers look for
- **Disciplined scope management** across teams.
- Balancing **focus with adaptability**.
- Coaching **stakeholders** on the cost of additions.

#### Practise it
1. Write an in/out scope list for a feature you know.
2. Invent three new stakeholder requests and decide how to handle each.
3. Explain your approach **out loud in 3 minutes**.
