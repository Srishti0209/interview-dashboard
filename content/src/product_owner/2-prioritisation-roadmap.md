# Product Owner — Prioritisation & Roadmap

## How do you prioritise your product backlog?
- id: po-prioritisation-01
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: prioritisation, RICE, MoSCoW, WSJF, backlog

### Prompt
Your backlog has 200 items and every stakeholder thinks theirs is the most important. How do you decide what the team works on?

### Answer
#### What the interviewer is really testing
- Whether you prioritise from **goals and evidence**, or from opinions and politics.
- Your knowledge of **prioritisation frameworks** and, more importantly, your judgement about when and how to use them.
- How you keep a backlog **healthy and manageable**.
- How you **communicate decisions** to stakeholders who don't get what they want.

#### Key points
- Prioritisation starts from **goals**, not from the backlog. Without a clear objective, every framework is just maths on opinions.
- Know the main frameworks and when each fits:
  - **RICE** (Reach, Impact, Confidence, Effort) for comparing features.
  - **MoSCoW** (Must, Should, Could, Won't) for agreeing a fixed release scope.
  - **WSJF** (Weighted Shortest Job First) for time-critical work, common in SAFe.
  - **Kano** for understanding basic expectations versus delighters.
  - **Value versus effort** for quick workshops.
- Frameworks support **judgement**; they don't replace it.
- A 200-item backlog is usually a sign of not saying no enough. Keep only the top items detailed and **archive** the rest.
- Make decisions **transparent**.

#### Model answer
"I'd tackle this in five steps.

**1. Anchor on goals.** Before looking at individual items, I make sure the team has clear goals for the quarter, ideally OKRs agreed with leadership. Say our objective is 'Make new customers successful faster', with the key result 'Increase activation from 35% to 45%'. That immediately gives me a filter: anything that doesn't help activation, or a few other agreed priorities like a regulatory deadline, drops down the list. In practice this alone cuts 200 items to perhaps 30–40 serious candidates.

**2. Clean up the backlog.** I'd archive items that are old, duplicated or no longer relevant. If nobody has asked about an item in six months, it probably doesn't matter. If it does, it will come back. I'd also group related items into themes, so we compare problems rather than dozens of small tickets.

**3. Score the candidates consistently.** For feature work, I like **RICE**:
- **Reach**: how many users it affects in a period, e.g. 4,000 new users per quarter.
- **Impact**: how much it moves our goal for each user: 3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal.
- **Confidence**: how sure we are, based on evidence: 100% (strong data), 80% (some evidence), 50% (a guess).
- **Effort**: total person-weeks across engineering, design and testing.

**RICE score = (Reach × Impact × Confidence) ÷ Effort.**

For example:
- *Simplify bank connection*: 4,000 × 2 × 80% ÷ 3 weeks ≈ **2,133**.
- *Add dark mode*: 10,000 × 0.25 × 100% ÷ 2 weeks ≈ **1,250**.
- *Rebuild reporting*: 800 × 1 × 50% ÷ 8 weeks ≈ **50**.

Even with rough numbers, this makes the conversation much more objective.

**4. Apply judgement.** Scores are an input, not the answer. I adjust for:
- **Dependencies**: something that unblocks three other items moves up.
- **Risk and obligations**: legal deadlines, security vulnerabilities, contractual commitments.
- **Strategic bets**: some important things are hard to quantify, like entering a new market.
- **Balance**: I agree a rough capacity split with the tech lead, e.g. 70% roadmap features, 20% technical health, 10% bugs and small improvements, so important but less visible work doesn't get starved.

**5. Make it visible and communicate.** I keep the top of the backlog in a shared, ordered view where each item has a one-line reason ('Moves activation; high confidence from user research'). In a regular stakeholder review I show the goals, the top priorities and *why*, and what's not making the cut. When someone asks 'why isn't my item in?', I can point to the goal and the evidence, which turns it from politics into a discussion about value.

Only the next 2–3 sprints of work are refined in detail. Anything further down stays rough, because priorities will change."

#### Another worked example: SAFe and WSJF
"In a larger organisation using SAFe, I'd use **WSJF** for epics:
- **Cost of delay** = user/business value + time criticality + risk reduction/opportunity enablement (each scored, e.g. on a Fibonacci scale 1–20).
- **WSJF = cost of delay ÷ job size.**

Example:
- *Open banking integration*: value 13 + time criticality 20 (regulatory deadline) + risk reduction 8 = 41, job size 13 → WSJF ≈ **3.2**.
- *New dashboard*: value 8 + time 3 + risk 2 = 13, job size 5 → WSJF **2.6**.
- *Refactor payments*: value 5 + time 5 + risk 13 = 23, job size 8 → WSJF ≈ **2.9**.

The integration goes first because of its deadline, even though it's the biggest job. WSJF is good at capturing urgency, which RICE doesn't."

#### Framework comparison
| Framework | How it works | Best for | Watch out for |
|---|---|---|---|
| RICE | (Reach × Impact × Confidence) ÷ Effort | Comparing features with some data | False precision; numbers can be gamed |
| MoSCoW | Must / Should / Could / Won't | Agreeing scope for a fixed date or release | Everything becomes a "Must" |
| WSJF | Cost of delay ÷ job size | Time-critical work; SAFe | Cost of delay is hard to estimate |
| Kano | Basic / performance / delighter features | Understanding customer expectations | Needs user research |
| Value vs effort 2×2 | Plot items on two axes | Quick team workshops | Very subjective |
| Opportunity scoring | Importance vs current satisfaction | Finding underserved needs | Needs survey data |

#### Step-by-step framework
1. **Confirm goals** (OKRs, strategy, obligations).
2. **Clean up**: archive, de-duplicate, group into themes.
3. **Score** candidates with a suitable framework.
4. **Adjust** for dependencies, risk, strategy and balance.
5. **Order** the backlog and refine only the top 2–3 sprints.
6. **Communicate** priorities and reasons, regularly.
7. **Revisit** when goals or evidence change.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I use MoSCoW." (and nothing more) | Explains how frameworks are used, and when each fits |
| Prioritises by who asks loudest | Starts from goals and evidence |
| Keeps every item forever | Archives regularly and keeps the backlog lean |
| Ignores tech debt | Reserves capacity for technical health |
| Decides privately | Makes priorities and reasons visible to stakeholders |

#### Useful phrases
- "The first thing I'd check is whether we have clear goals for the quarter, because that's what prioritisation is measured against."
- "I use RICE as a conversation tool, not a calculator."
- "This scored lower because we have low confidence in its impact. If we get more evidence, it could move up."
- "To keep the product healthy, we reserve around 20% of capacity for technical work."
- "Here's what's not making the cut this quarter, and why."

#### Common pitfalls
- **Naming a framework without explaining how you use it** in practice.
- **HiPPO prioritisation**: doing what the highest-paid person's opinion says.
- **Never deleting** backlog items.
- **Treating scores as absolute truth** instead of as an input.
- **Ignoring technical debt** until it becomes a crisis.
- **Not explaining decisions**, so stakeholders feel ignored.

#### Follow-ups to expect (with sample answers)
- **"How do you estimate impact when you have no data?"**
  "I use proxies (similar past features, competitor benchmarks, support ticket volume) and qualitative research. I give it a lower confidence score, and if it's a big item I'd run a quick test to get better evidence."
- **"A sales leader needs a feature to close a big deal. What do you do?"**
  "I find out the deal's value and likelihood, whether other customers want the same thing, and whether a smaller version would work. Then I compare it transparently with what it would displace."
- **"How often do you re-prioritise?"**
  "I review the top of the backlog weekly with the team, and the broader priorities monthly with stakeholders. Big changes happen when goals change or significant new evidence appears."
- **"What do you do with all the low-priority items?"**
  "Archive them with a note on why. If a need comes back with new evidence, we reconsider it."

#### What senior interviewers look for
- **Designing the prioritisation system** for several teams, not just one backlog.
- Linking priorities directly to **company strategy and OKRs**.
- Protecting capacity for **discovery, platform health and innovation**.
- Changing priorities when evidence changes, and **communicating** those changes well.

#### Practise it
1. Take 10 items from a real backlog, or invent them for a product you know.
2. Score them with RICE, showing your numbers.
3. Then re-order them using judgement (dependencies, risk, strategy) and note what changed and why.
4. Explain the final order **out loud in 5 minutes**, as if to a stakeholder whose item didn't make it.
5. Checklist: goals first · framework used correctly · judgement applied · tech health included · clear communication.

## Two senior stakeholders want conflicting things — what do you do?
- id: po-prioritisation-02
- round: PRIORITIZATION_ROADMAP
- difficulty: hard
- levels:
- tags: stakeholder management, conflict, negotiation, prioritisation

### Prompt
The Head of Sales wants feature A for a big client, and the Head of Operations wants feature B to reduce support costs. You only have capacity for one this quarter. How do you handle it?

### Answer
#### What the interviewer is really testing
- **Stakeholder management** under pressure, with people more senior than you.
- Whether you make decisions with **data and shared goals**, not politics.
- **Creativity**: can you find options beyond "A or B"?
- Whether you know **when and how to escalate** properly.
- How you **maintain relationships** after a difficult decision.

#### Key points
- Don't pick a side immediately, and don't escalate immediately.
- **Understand the underlying needs** of both stakeholders.
- **Quantify** both options in a common currency (revenue, cost, risk) and against company goals.
- **Explore creative options**: smaller versions, sequencing, workarounds.
- **Bring both together** with a clear recommendation.
- If still unresolved, **escalate with a recommendation**, not a problem.
- **Close the loop** with whoever doesn't get their way.

#### Model answer
"I'd take five steps.

**1. Understand each request deeply, separately.**

With the Head of Sales, I'd ask:
- How big is the deal, and how likely is it to close?
- Is feature A a deal-breaker, or one of several requirements?
- What exactly does the client need, and by when?
- Would other clients or prospects benefit too?

With the Head of Operations:
- How many support tickets does this cause, and how much does each cost?
- Is the problem growing?
- Does it affect customer satisfaction or churn?
- Are there workarounds?

Often the real need is narrower than the original request. For example, the client might need a monthly data export rather than the full integration that was asked for.

**2. Quantify both options.**
- **Feature A**: an £800k annual contract with about 60% chance of closing, so an expected value of roughly £480k a year. Three other prospects have asked for something similar.
- **Feature B**: 1,200 tickets a month at about £6 each, roughly £86k a year. Our data also shows customers who raise these tickets are twice as likely to churn, which puts around £200k of revenue at risk.

Then I'd check both against **company goals**. If this year's priority is enterprise growth, A aligns more strongly. If it's margin and retention, B carries more weight.

**3. Explore creative options:**
- A **smaller version of A**: could a manual export, or a lighter integration, satisfy the contract in 4 weeks instead of 10?
- A **non-engineering fix for B**: better help articles, a support macro or a simple internal tool to cut tickets by a third in the meantime.
- **Sequencing**: A's reduced version first, then B later in the quarter.
- **Temporary extra capacity**: help from another team, or an external contractor for a well-defined piece.

**4. Bring them together with a recommendation.** I'd set up a short meeting with both, share the data and options openly, and recommend, for example: 'Build the reduced version of A in 5 weeks, while Operations rolls out the help-centre improvements now. Then the team builds B in weeks 6–11.' Seeing the numbers side by side usually resolves it, because both people want what's best for the company.

**5. Escalate properly if needed.** If they still disagree, I'd go to our shared leader (e.g. the COO) with both perspectives fairly represented, the data, and my recommendation. I'd tell both stakeholders I'm doing it, so nobody feels ambushed.

**Afterwards.** I'd follow up with whoever 'lost' to explain when their item will be addressed and what's happening in the meantime, and keep them updated. That's how you keep their trust for the next conflict."

#### Another worked example: internal platform conflict
"Two product teams both need the platform team's help: the Payments team needs a new API for a launch, and the Mobile team needs performance improvements because app ratings are dropping.
- **Understand**: the payments launch is tied to a partner contract with penalties if late. App rating has dropped from 4.6 to 4.1 in two months.
- **Quantify**: the late-launch penalty is £50k plus reputational damage with the partner. The rating drop has reduced app-store conversion by 12%, costing an estimated £30k a month.
- **Options**: split the team for 3 weeks. Two engineers on the API, which has a fixed scope, and one on the top two performance issues identified by profiling.
- **Result**: both get progress. The API ships on time, and the performance fixes bring crash rates down, with ratings recovering over the following month."

#### Step-by-step framework
1. **Listen separately** to each stakeholder's underlying need.
2. **Quantify** both options in a common currency.
3. **Map to company goals.**
4. **Generate options**: reduce, sequence, work around, add capacity.
5. **Recommend** in a joint conversation.
6. **Escalate with a recommendation** if needed.
7. **Close the loop** and keep both informed.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd do what the more senior person wants." | Decides with data and company goals |
| "I'd escalate to my manager." | Tries to resolve it first, and escalates with a recommendation |
| Only considers A or B | Explores reduced scope, sequencing and workarounds |
| Decides privately and announces it | Brings both stakeholders together transparently |
| Forgets the stakeholder who lost | Follows up and keeps their trust |

#### Useful phrases
- "Before deciding, I want to understand exactly what each of you needs and why."
- "Let's put both options in the same terms: revenue, cost and risk."
- "Is there a smaller version that solves the core problem?"
- "Here's my recommendation, and here's the reasoning."
- "I know this isn't the outcome you wanted. Here's when we'll get to it and what we're doing in the meantime."

#### Common pitfalls
- **Deciding behind closed doors**, so one stakeholder feels ambushed.
- **Escalating without data or a recommendation.**
- **Letting seniority or volume decide.**
- **Agreeing to both** and overloading the team, which delivers neither well.
- **Damaging the relationship** with the stakeholder who didn't get their way.

#### Follow-ups to expect (with sample answers)
- **"What if the CEO overrules your recommendation?"**
  "I'd make sure the risks and trade-offs are clearly understood, then disagree and commit, executing their decision fully and measuring the results."
- **"How do you prevent these conflicts?"**
  "A regular prioritisation forum with key stakeholders, a shared view of goals and the roadmap, and an intake process for big requests, so conflicts surface early instead of mid-quarter."
- **"What if the numbers are very uncertain?"**
  "I'd show ranges and confidence levels, and look for a quick way to reduce uncertainty, like confirming with the client how essential the feature is to signing."

#### What senior interviewers look for
- Calm, data-driven **negotiation** with senior leaders.
- **Protecting the team** from constant priority changes.
- Building **long-term trust**, so stakeholders accept decisions even when they lose.
- Setting up **systems** (forums, intake processes) that make conflicts rarer.

#### Practise it
1. Think of a real conflict you've faced, or invent one with two plausible stakeholders.
2. Write down: each person's underlying need, a quantified view of each option, three creative alternatives, and your recommendation.
3. Practise delivering the recommendation **out loud in 3 minutes** as if both stakeholders are in the room.
4. Then practise the follow-up conversation with the stakeholder who didn't get their way.

## How do you build and communicate a product roadmap?
- id: po-prioritisation-03
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: roadmap, now-next-later, outcomes, communication

### Prompt
How do you create a product roadmap, and how do you communicate it to different audiences: engineers, executives and customers?

### Answer
#### What the interviewer is really testing
- Whether you see a roadmap as a **strategic communication tool** or as a list of features with dates.
- Whether you understand **outcome-based** roadmapping.
- Whether you can **tailor communication** to different audiences.
- How you handle **uncertainty and change**.

#### Key points
- A roadmap shows **direction and priorities**, not a promise of exact features on exact dates.
- Favour **outcomes** (problems to solve, metrics to move) over **outputs** (features).
- **Now / Next / Later** shows decreasing certainty over time.
- Build it **with** the team and stakeholders, from **vision, strategy and evidence**.
- Different audiences need **different views** of the same roadmap.
- **Keep it alive**: review regularly and explain changes.

#### Model answer
"**Building it.** I start from the product vision and strategy, and the company's goals for the year. Then I gather inputs:
- Customer research and feedback.
- Product data: where users struggle, drop off or churn.
- Stakeholder needs: sales, support, operations, leadership.
- Technical needs from engineering: platform work, scalability, tech debt.
- Market and competitor changes.

From that I identify the **biggest problems and opportunities**, and frame each roadmap item as an outcome. For example:
- Instead of 'Build retry logic for payments' → **'Reduce failed payments by 30%'**.
- Instead of 'New onboarding screens' → **'Help new users reach their first invoice within 1 day'**.

The team then works out the best solution, which might be the feature someone originally imagined or something quite different.

**Structure: Now / Next / Later.**
- **Now** (this quarter): committed and well understood. Solutions are mostly defined and the team is working on them.
- **Next** (next 1–2 quarters): problems we're confident are important. Solutions are still being explored.
- **Later**: strategic themes and bigger bets. Deliberately broad, because a lot will change.

**Communicating it to different audiences:**

*Engineers and designers:*
- Focus on the **why**: customer problems, data and constraints.
- Involve them early in shaping 'Now' items, so solutions and estimates are realistic.
- Link roadmap items to epics in the team's tools.
- They want to know what's coming so they can plan architecture and avoid surprises.

*Executives and leadership:*
- A **one-page view** linking each theme to company OKRs, with expected impact, investment, risks and dependencies.
- They're asking: 'Are we working on the most valuable things, and will it move the business?'
- I show progress against outcomes, not just features delivered.

*Sales, marketing and customer success:*
- What's coming soon, and how to talk about it.
- Clear guidance on what's **committed** (shareable) and what's **exploratory** (not to be promised).
- Early notice of launches so they can prepare.

*Customers:*
- High-level themes and directions, e.g. 'We're investing in faster onboarding and better reporting this year.'
- No firm dates for 'Next' or 'Later' items. Over-promising damages trust when plans change.

**Keeping it alive.** I review the roadmap monthly with the team and quarterly with leadership. When something changes, I explain *why* (new data, a strategy shift, a dependency), rather than quietly updating a slide."

#### Another worked example: a regulated business
"In a bank, some roadmap items are **fixed-date regulatory commitments**, such as a new payment rule by a certain date. I'd show these clearly with their dates, separately from outcome-based items, so everyone understands that they're non-negotiable. For example:
- **Now**: regulatory reporting changes (due 30 June), and 'reduce onboarding drop-off by 20%'.
- **Next**: 'increase card spend per active customer' (exploring rewards and spending insights).
- **Later**: 'become customers' main bank for salaries'.

This combines the certainty compliance teams need with the flexibility product work needs."

#### Feature roadmap versus outcome roadmap
| Feature-based roadmap | Outcome-based roadmap |
|---|---|
| "Q2: launch dark mode, new dashboard, export to PDF" | "Q2: increase weekly active usage among small businesses by 15%" |
| Commits to solutions early | Commits to problems; solutions emerge |
| Success = shipped on time | Success = metric moved |
| Breaks when plans change | Adapts as you learn |
| Easy to understand | Needs more explanation, but builds better products |

#### Step-by-step framework
1. **Start from vision, strategy and company goals.**
2. **Gather inputs**: customers, data, stakeholders, engineering, market.
3. **Identify the biggest problems and opportunities.**
4. **Frame items as outcomes**, with metrics.
5. **Arrange them in Now / Next / Later.**
6. **Create audience-specific views.**
7. **Review regularly** and communicate changes with reasons.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| A Gantt chart of features with dates 12 months out | Now / Next / Later with decreasing certainty |
| One roadmap for everyone | Tailored views for engineers, executives, sales and customers |
| Commits to solutions | Commits to outcomes and problems |
| Updated silently | Changes explained with reasons |
| Built alone by the PO | Built with input from the team and stakeholders |

#### Useful phrases
- "The roadmap shows our direction and priorities. It's not a release schedule."
- "Rather than committing to a specific feature, we're committing to solving this problem and moving this metric."
- "'Now' is committed; 'Next' and 'Later' are our current best thinking and will change as we learn."
- "This changed because we learned that… and here's what it means for you."

#### Common pitfalls
- **Feature lists with fixed dates** far into the future.
- **One roadmap for all audiences.**
- **Committing to solutions too early.**
- **No link to goals or metrics.**
- **Letting sales promise roadmap items** as if they're committed.
- **Never updating it**, or updating it without explanation.

#### Follow-ups to expect (with sample answers)
- **"Sales keeps promising roadmap items to customers. What do you do?"**
  "Give them a clear version of what's shareable, explain why 'Next' items aren't commitments, and create a process for deal-critical requests to come to me early. If it continues, I'd raise it with the sales leader, because broken promises hurt customers and the company."
- **"Stakeholders want dates. How do you handle that?"**
  "For 'Now' items, I give a confidence range, e.g. 'most likely end of May, at the latest mid-June'. For later items, I explain that fixing both date and scope that far out isn't realistic, and offer to agree the date with flexible scope instead."
- **"How do you include tech debt on the roadmap?"**
  "As outcomes too, e.g. 'reduce time to release from 2 weeks to 2 days' or 'cut incidents by 50%', so its value is visible to everyone."

#### What senior interviewers look for
- Owning a roadmap across **multiple teams**, with dependencies.
- A clear link to **business strategy**.
- Managing **executive expectations** about uncertainty.
- Balancing new features, **platform investment** and **discovery**.

#### Practise it
1. Create a Now / Next / Later roadmap for a product you know, with 2–3 outcome-based items in each column.
2. For each item, write the metric it should move.
3. Then explain it **out loud three times**, as you would to an engineer, an executive and a customer (2 minutes each), changing the level of detail and focus.
4. Checklist: outcomes not features · decreasing certainty · tailored messages · clear on what's committed.

## How do you balance technical debt against new features?
- id: po-prioritisation-04
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: tech debt, engineering partnership, capacity planning

### Prompt
Your engineers keep raising technical debt, but stakeholders want features. How do you decide how much time to spend on tech debt?

### Answer
#### What the interviewer is really testing
- Whether you see technical debt as a **product problem** or "engineering's problem".
- Your **partnership with engineering**: do you trust and understand their concerns?
- Your ability to **translate technical work into business value** for stakeholders.
- Practical approaches to **capacity planning**.

#### Key points
- **Technical debt** is the future cost of shortcuts or outdated technology. Like financial debt, it charges "interest": slower delivery, more bugs and incidents, harder hiring, security risk.
- It's a **product problem**, because it directly affects speed, reliability and customer experience.
- **Translate** debt into business impact so it can be compared fairly with features.
- Combine **standing capacity** (e.g. 15–20%) with **targeted investments** for big items.
- Track **health metrics** (e.g. the DORA metrics) to show the effect.

#### Model answer
"I treat tech debt as part of the product, because it determines how quickly and safely we can deliver value to customers.

**1. Understand it properly.** I'd sit with the tech lead and engineers and ask them to explain the main debt items in terms of impact:
- 'Every change to checkout takes 3 extra days because there are no automated tests, and we've had 4 incidents there this quarter.'
- 'This framework version stops receiving security updates in 6 months.'
- 'Our database queries slow down as data grows. Reports already take 40 seconds for large customers.'

I'd ask them to rate each item for **pain** (how much it slows us down now) and **risk** (what happens if we ignore it).

**2. Make it visible.** Debt items go in the **same backlog** as features, written as problems with business impact, not vague tasks like 'clean up code'. Hidden debt never gets prioritised.

**3. Agree a standing allocation.** With the tech lead, I'd agree a regular share of capacity, typically **15–20% of each sprint**, for ongoing technical health: refactoring, upgrades, test coverage and tooling. The engineers decide how to use it day to day. This builds trust and stops debt piling up.

**4. Build business cases for big items.** For large pieces, like re-architecting a service, I'd build a case with the tech lead in business terms. For example:
> 'Delivering features in payments has slowed from 2 weeks to 5 weeks over the past year, and incidents cost us around £20k a month in refunds and support time. A 6-week refactor should bring delivery back to around 2 weeks and halve incidents. That pays back within two quarters, and every payments feature after it will ship faster.'

Framed like this, stakeholders can compare it fairly against features.

**5. Combine with feature work.** When we're about to build a feature in a messy part of the code, we include refactoring in that work (the 'boy scout rule': leave the code better than you found it). That way the debt we pay down is in the areas that matter most.

**6. Measure it.** I'd track indicators with the team:
- **DORA metrics**: deployment frequency, lead time for changes, change failure rate, time to restore service.
- Incident counts and customer-facing bugs.
- Time spent on unplanned work.

Sharing these with stakeholders shows the cost of debt, and the payoff of fixing it, in terms they care about."

#### Another worked example: convincing sceptical stakeholders
"In a previous situation, leadership wanted to pause all technical work to hit a big launch. Instead of arguing, I showed a simple chart: over three quarters, story points delivered had stayed flat while the share of time spent on bugs and incidents had grown from 15% to 40%. I proposed a compromise: keep 20% for technical health during the launch, focused only on the areas the launch touched. We hit the launch date with fewer post-launch bugs than our previous launch, which built trust for more technical investment afterwards."

#### Types of technical debt
| Type | Example | Typical impact |
|---|---|---|
| Code quality | Duplicated, tangled code | Slower changes, more bugs |
| Testing | Few automated tests | Slow releases, regressions |
| Architecture | A monolith that can't scale | Performance issues, team bottlenecks |
| Outdated dependencies | Unsupported libraries | Security risk, harder upgrades |
| Infrastructure | Manual deployments | Slow, risky releases |
| Documentation | Missing knowledge | Slow onboarding, key-person risk |

#### Step-by-step framework
1. **Understand** debt items in terms of pain and risk.
2. **Make them visible** in the backlog, framed as problems.
3. **Agree standing capacity** (15–20%).
4. **Build business cases** for large investments.
5. **Combine** refactoring with feature work in the same area.
6. **Measure** health metrics and share them.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Engineering decides; it's not my area." | Owns tech health as part of the product |
| "We'll do it when we have time." | Agrees standing capacity and plans big items explicitly |
| Vague items like "refactor the code" | Debt framed as business impact (speed, incidents, risk) |
| Big-bang rewrites | Incremental improvements tied to feature work |
| No measurement | Tracks DORA metrics and incidents |

#### Useful phrases
- "Tech debt is a product problem because it decides how fast we can deliver value."
- "Can you help me understand the impact in terms of speed, incidents or risk?"
- "We reserve around 20% of capacity for technical health, so it never gets starved."
- "This refactor pays for itself within two quarters because…"
- "Every payments feature after this will be faster and safer."

#### Common pitfalls
- **"The engineers decide"** with no product involvement, or the opposite: never allocating time.
- **Accepting vague debt items** without understanding the impact.
- **Big-bang rewrites** with no incremental value and high risk.
- **Not explaining to stakeholders** why delivery slows down when debt builds up.
- **Creating new debt** carelessly through unrealistic deadlines.

#### Follow-ups to expect (with sample answers)
- **"What if leadership refuses any time for tech debt?"**
  "I'd show data on slowing delivery, incidents and their cost, start with a small allocation, and demonstrate results quickly. It's much easier to get more investment once you've shown a payoff."
- **"How do you avoid creating new tech debt?"**
  "Realistic estimates, quality standards in the Definition of Done (tests, reviews), and when we do take a deliberate shortcut, logging it in the backlog with a plan to fix it."
- **"How do you know if 20% is the right amount?"**
  "I watch the trends. If incidents and lead time keep getting worse, we need more. If they're improving and stable, 20% may be enough or even too much. It's a dial, not a fixed rule."

#### What senior interviewers look for
- A **genuine partnership** with engineering leadership.
- Explaining technical investment in **business language** to executives.
- **Long-term thinking** about platform health across several teams.
- Using **metrics** to manage technical health deliberately.

#### Practise it
1. Ask an engineer you know (or think back on your experience) for three examples of tech debt.
2. For each, write a one-sentence business impact and a rough payback argument.
3. Practise pitching the biggest one **out loud in 2 minutes** to an imaginary sceptical executive.
4. Checklist: impact in business terms · cost of doing nothing · payback period · measurement.

## You must cut scope to hit a fixed deadline — what do you do?
- id: po-prioritisation-05
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: MVP, scope management, deadlines, trade-offs

### Prompt
A regulatory deadline is fixed in 8 weeks, but the team estimates the full scope at 12 weeks. What do you do?

### Answer
#### What the interviewer is really testing
- Whether you understand the **trade-off triangle**: scope, time, resources and quality.
- Your ability to **cut scope intelligently** while still meeting the real requirement.
- **Risk management** and early, honest communication.
- Whether you **protect the team** rather than just pushing them harder.

#### Key points
- With a **fixed date**, scope is the main variable. Quality and safety should never be what gets cut.
- **Adding people late rarely helps** (Brooks's law: adding people to a late project makes it later, because of onboarding and coordination costs).
- **Understand the requirement precisely**. Teams often over-interpret what's legally required.
- Use **MoSCoW** to separate essentials from nice-to-haves.
- Look for **cheaper ways** to meet essentials, e.g. manual processes at first.
- **Communicate early**, and **plan the follow-up** work.

#### Model answer
"With a regulatory deadline, the date can't move, so my focus is on scope.

**1. Understand the requirement precisely.** I'd sit down with legal or compliance and go through the regulation line by line, asking: what exactly must be true on the deadline? Teams often build far more than the rule demands.

For example, a data-access regulation might require that customers can **request and receive** their data within 30 days. It doesn't require a polished self-service portal on day one. That distinction can save weeks.

**2. Break down and classify the scope with MoSCoW.**
- **Must have**: the legally required capability, plus what's needed to run it safely: audit logging, basic monitoring, security controls, and the ability to support customers.
- **Should have**: important improvements to the experience, e.g. a self-service download page.
- **Could have**: automation and polish, e.g. instant data exports and email notifications.
- **Won't have (for now)**: everything else, written down explicitly so nobody assumes it's coming.

**3. Find cheaper ways to meet the Musts.**
- Could operations handle some requests **manually** at first? For example, customers submit a form, and an internal script generates their data, which support sends securely.
- Could we use an **existing tool or third-party service**?
- Could we **reuse** existing components?

**4. Re-plan with the team.** I'd ask engineering to re-estimate the reduced scope and aim to finish the Musts in about **6–7 weeks**, leaving a buffer for testing, security review and surprises. I'd also **remove other work** from the team's plate. Expecting them to do this and their normal work is how deadlines get missed.

**5. Track risk closely.** A weekly burn-up chart of Must scope, early integration testing, and an agreed checkpoint at week 4. If we're behind then, we escalate options straight away, not at week 7.

**6. Communicate early.** I'd tell stakeholders immediately: what will be live on the deadline, what follows and when, and what the temporary manual process means for operations. Bad news delivered early is a plan. The same news delivered late is a crisis.

**7. Plan phase 2.** Manual workarounds have a cost and carry risk at scale, so I'd put the automation on the roadmap for the next quarter, with a clear owner, and track the manual workload until it's replaced."

#### Another worked example: a product launch with a fixed event date
"A marketing campaign for a new feature launches at a major industry event in 6 weeks. The full feature is estimated at 9 weeks.
- **Must**: the core experience shown in the campaign, working reliably for new sign-ups.
- **Should**: integrations with two popular tools.
- **Could**: advanced settings and admin controls.
- **Cheaper path**: launch with one integration (the most requested), offer the second via a simple CSV import, and limit early access to new customers through a waitlist so we can control load.
- **Communication**: align with marketing so the campaign promises only what's in the Must scope.

Result: the launch goes ahead on time with a smaller, stable feature, and the remaining scope ships in the following 4 weeks."

#### Ways to close a gap between scope and time
| Option | Effect | Risk |
|---|---|---|
| Cut scope (MoSCoW) | Best option for fixed dates | Must communicate what's deferred |
| Manual or temporary processes | Meets the requirement cheaply | Operational cost; must be replaced |
| Reuse or buy instead of build | Saves time | Integration or vendor risk |
| Remove other work from the team | Increases focus | Other stakeholders wait |
| Add people early | Can help if done very early | Little help (or harm) if late |
| Overtime | Short-term boost | Burnout, more bugs; avoid relying on it |
| Cut quality or testing | Never | Incidents, regulatory risk |

#### Step-by-step framework
1. **Clarify the exact requirement** with legal or compliance.
2. **Break down and classify** scope (MoSCoW).
3. **Find cheaper paths** for the Musts.
4. **Re-plan with a buffer**, and remove other work.
5. **Track progress** with checkpoints.
6. **Communicate early** and clearly.
7. **Plan the follow-up** work.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "The team will have to work harder." | Cuts scope intelligently and protects the team |
| Cuts testing and quality | Keeps quality and safety non-negotiable |
| Adds lots of engineers in week 6 | Knows late additions rarely help |
| Hides the problem until close to the deadline | Communicates immediately with a plan |
| Forgets the manual workarounds | Plans phase 2 to replace them |

#### Useful phrases
- "With a fixed date, the variable we control is scope."
- "Let's go through the regulation and agree exactly what must be true on the deadline."
- "We can meet this requirement with a manual process at first, and automate it next quarter."
- "I'd rather tell you now that we're reducing scope than surprise you in week 7."
- "Quality and security are non-negotiable, so we'll cut features, not testing."

#### Common pitfalls
- **Asking the team to "just work harder"**, which burns people out and increases defects.
- **Cutting quality, security or testing** instead of features.
- **Adding engineers late** in the project.
- **Hiding the problem** until close to the deadline.
- **Not involving compliance** in deciding what's truly required.

#### Follow-ups to expect (with sample answers)
- **"What if even the Musts don't fit in 8 weeks?"**
  "I'd escalate immediately with options: bringing in experienced people early, temporary help from another team, a larger manual process, or discussing with the regulator if there's any flexibility. I'd present the risks of each clearly."
- **"How would you track progress so there are no surprises?"**
  "A weekly burn-up chart for the Must scope, early end-to-end testing, a demo every week, and an explicit go/no-go checkpoint at the halfway mark."
- **"How do you keep the team motivated under pressure?"**
  "Be clear about why the deadline matters, protect them from distractions, celebrate progress, and make sure the plan is realistic, not heroic."

#### What senior interviewers look for
- Calm, structured **risk management**.
- A strong **partnership with legal, compliance and operations**.
- **Creative de-scoping** that still meets the real requirement.
- Protecting **team sustainability** while meeting commitments.

#### Practise it
1. Take a feature you know and list everything it includes.
2. Classify every part using MoSCoW for an imaginary deadline that is 30% shorter than the real estimate.
3. For each Must, write down one cheaper way to deliver it.
4. Practise explaining the plan **out loud in 4 minutes** to a stakeholder who expected the full scope.

## How do you say no to a feature request?
- id: po-prioritisation-06
- round: PRIORITIZATION_ROADMAP
- difficulty: easy
- levels:
- tags: saying no, stakeholder management, communication

### Prompt
How do you say no to feature requests from stakeholders or customers without damaging the relationship?

### Answer
#### What the interviewer is really testing
- Whether you **protect the team's focus** and the product's direction.
- **Diplomacy**: saying no while keeping trust and relationships.
- Whether you **understand the need behind the request** before deciding.
- Whether your decisions are **grounded in goals and evidence**, not personal preference.

#### Key points
- A good PO says no much more often than yes. Every yes to something small is a no to something more important.
- **Listen first**: understand the problem behind the request. You can often say no to the solution but yes to the problem.
- **Evaluate fairly** against the same criteria as everything else. Sometimes the right answer is yes.
- **Explain clearly** with reference to shared goals and evidence.
- **Offer alternatives** and be honest about timing.
- **Close the loop** and document decisions.

#### Model answer
"I think of it as 'no, but…' rather than a flat no. Here's how I approach it.

**1. Listen and dig into the problem.** When someone asks for a feature, I ask:
- What are you trying to achieve?
- Who is affected, and how often?
- What happens today, and what happens if we don't do this?

For example, a support lead asks for a 'bulk refund button'. After a few questions, I learn the real problem is that after a payment outage, agents spend about 2 hours a day manually refunding affected customers, perhaps 3–4 times a year.

**2. Evaluate it fairly.** I compare it against our current goals and priorities using the same criteria as everything else: reach, impact, effort and strategic fit. Sometimes the answer is actually yes, and saying no by reflex is as bad as saying yes by reflex.

**3. If it's a no, explain it clearly and early.**
- Tie it to shared goals: 'This quarter we're focused on reducing failed checkouts, which affects about 40,000 customers a week. Bulk refunds would affect a few hundred customers a few times a year, so I can't justify moving it ahead of that work.'
- Be honest about timing. If it's unlikely to happen this year, say so, rather than a vague 'maybe later'.

**4. Offer alternatives.**
- **Solve the underlying problem differently**: 'Could engineering prepare a script to process refunds in bulk after an outage? That's a few hours of work and solves 90% of the pain.'
- Point to **existing functionality**, or a **third-party tool**.
- Put it in the backlog with **clear criteria** for revisiting, e.g. 'If outages become more frequent, we'll revisit.'

**5. Close the loop.** I document the decision and reasoning, and if circumstances change, I go back to the person proactively. People accept a no much more easily when they trust you'll revisit it fairly.

Ultimately, saying no well is about respecting the team's focus and being transparent about trade-offs. Most people respond well when they understand the reasoning and feel heard."

#### Another worked example: saying no to a customer
"A large customer asks for a custom feature only they would use: a special approval workflow with five levels.
- **Listen**: they need finance approval for invoices over a certain value, for audit reasons.
- **Evaluate**: building a fully custom workflow would take 6 weeks and add complexity for every other customer.
- **Response**: 'We won't build a custom five-level workflow, because it would make the product more complex for everyone else. But we're adding configurable approval rules for invoices over a set amount next quarter, which covers your audit requirement. In the meantime, you could use our existing approval flag with a shared finance inbox.'
- **Outcome**: the customer feels heard, gets a solution to their real need, and the product stays simple."

#### Ways to say no constructively
| Situation | Constructive response |
|---|---|
| Valid problem, wrong solution | "Let's solve the problem differently." |
| Valid but low priority | "Not now. Here's why, and when we'll revisit." |
| Only benefits one user or customer | "This would add complexity for everyone; here's an alternative." |
| Doesn't fit the product strategy | "This isn't where we're taking the product, because…" |
| Already possible | "You can do this today by…" |

#### Step-by-step framework
1. **Listen** and find the problem behind the request.
2. **Evaluate** it against goals and the current priorities.
3. **Decide**: yes, not now, or no.
4. **Explain** with shared goals and evidence.
5. **Offer alternatives** for the underlying need.
6. **Document and close the loop**.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Says yes to avoid conflict | Says no when needed, with clear reasoning |
| "It's not a priority." (and nothing more) | Explains the trade-off against shared goals |
| Never offers alternatives | Solves the underlying problem in another way |
| "I'll put it in the backlog" (and forgets) | Honest about timing; sets criteria for revisiting |
| Doesn't record decisions | Documents decisions so they don't keep coming back |

#### Useful phrases
- "Help me understand what you're trying to achieve."
- "I can't prioritise this right now, and I want to explain why."
- "Our focus this quarter is X, which affects far more customers, so this would come at its expense."
- "What if we solved the underlying problem this way instead?"
- "I'll come back to you if anything changes."

#### Common pitfalls
- **Saying yes to avoid conflict**, then failing to deliver, which is worse than an honest no.
- **A dismissive no** without listening or explaining.
- **"Let me put it in the backlog"** as a polite way of ignoring it forever.
- **Inconsistency**: saying yes to some people and no to others for similar requests.
- **Not documenting decisions**, so the same request keeps coming back.

#### Follow-ups to expect (with sample answers)
- **"What if the request comes from your CEO?"**
  "The same process, with extra effort to understand their reasoning. They often have context I don't. I'd present the trade-off clearly and let them make an informed decision."
- **"Tell me about a time you said no to something."**
  Have a STAR story ready (see the behavioural round).
- **"How do you handle someone who keeps pushing after a no?"**
  "Revisit the reasoning together, check whether anything new has come up, and if they still disagree, agree to escalate together to someone who can weigh the trade-off."

#### What senior interviewers look for
- Confidence and diplomacy at **all levels**, including executives.
- No-decisions **consistently grounded in strategy**.
- **Systems that reduce one-off requests**: clear intake processes, a published roadmap and regular stakeholder forums.

#### Practise it
1. Write down three requests you've received (or imagine them): one from a customer, one from a colleague, one from an executive.
2. For each, write: the underlying problem, your decision, the reasoning in one sentence, and one alternative.
3. Practise each conversation **out loud in about 90 seconds**.
4. Checklist: listened first · tied to goals · offered an alternative · honest about timing.
