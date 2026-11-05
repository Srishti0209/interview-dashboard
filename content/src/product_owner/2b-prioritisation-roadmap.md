# Product Owner — Prioritisation & Roadmap (continued)

## Everything is "P1" — what now?
- id: po-prioritisation-07
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: prioritisation, urgency, stakeholder management

### Prompt
Every stakeholder labels their requests as "P1: urgent". The team can't do everything. How do you handle it?

### Answer
#### What the interviewer is really testing
- Whether you can **restore meaning to priority** when labels have lost their value.
- Your ability to separate **urgency from importance**.
- How you **set up a fair process** that stakeholders trust.
- Whether you can make **hard calls and explain them**.

#### Key points
- When everything is P1, **nothing is**. Labels without criteria become negotiation tools.
- Separate **urgent** (time-sensitive) from **important** (high value). Use the **Eisenhower matrix** as a simple lens.
- Define **clear priority criteria** that everyone agrees on (e.g. P1 = blocking customers from a core task, legal deadline, or security issue).
- **Force-rank** rather than label: an ordered list makes trade-offs visible.
- Create a **regular prioritisation forum** with stakeholders.
- Protect a small **capacity buffer** for genuine emergencies.

#### Model answer
"When everything is P1, the label has stopped meaning anything, so I'd fix the system rather than argue about individual items.

**1. Understand each 'P1'.** I'd ask each stakeholder: what happens if we don't do this in the next two weeks? Who's affected, and how much? Is there a real deadline? That quickly separates:
- **Truly urgent and important**: e.g. a bug stopping customers paying, a regulatory deadline, a security issue.
- **Important but not urgent**: valuable work without a hard deadline.
- **Urgent but less important**: time-sensitive requests with limited impact.
- **Neither**: nice-to-haves labelled P1 to get attention.

**2. Agree definitions.** With stakeholders and my manager, I'd agree clear criteria, for example:
- **P1 (now)**: customers blocked from a core task, data or security risk, legal or contractual deadline, or significant revenue loss.
- **P2 (next)**: high value, aligned with current goals.
- **P3 (later)**: useful, but not tied to current goals.

**3. Replace labels with a ranked list.** I'd maintain a single **ordered** backlog. When something new comes in, the question becomes 'what does it go above?', which makes trade-offs explicit.

**4. Set up a prioritisation forum.** A fortnightly 30-minute meeting with key stakeholders where we review the top of the list together, using the agreed criteria and data. When stakeholders see the full picture and each other's requests, they negotiate among themselves more reasonably.

**5. Keep a buffer for real emergencies.** E.g. 10–15% of capacity for unplanned urgent work, so true P1s don't derail everything.

**6. Communicate decisions.** Share the ranked list and the reasoning openly.

**Example.** At one company, 14 items were labelled P1. After applying agreed criteria, only 2 met the definition (a payment bug and a contractual deadline). The rest were re-ranked transparently in the forum. Within a month, stakeholders started using the criteria themselves when raising requests."

#### Another worked example: urgent support escalations
"Customer support kept escalating individual customer issues as urgent.
- I analysed a month of escalations: 60% related to three recurring problems.
- We fixed those root causes over two sprints, and introduced a triage rota where one engineer handled genuine urgent issues each week.
- Escalations dropped by half, and the rest of the team could focus on planned work."

#### Eisenhower matrix applied to product work
| | Urgent | Not urgent |
|---|---|---|
| **Important** | Do now (outage, legal deadline) | Plan and schedule (roadmap goals) |
| **Not important** | Minimise or delegate (one-off requests) | Drop or archive |

#### A third worked example: P1 inflation from a single team
"A sales team labelled almost every customer request P1 because they believed only P1s got attention.
- **Investigation**: in practice, P2 items often waited months, so labelling everything P1 was rational from their side.
- **Fix**: we published clear service levels, e.g. P2 requests are reviewed within two weeks and decided within a month, and shared monthly what had been delivered from sales requests.
- **Result**: sales used P1 properly once they trusted that P2 requests would actually be reviewed. The share of P1 requests dropped from about 70% to 15%."

#### Questions that cut through urgency
- "What's the cost if this waits two weeks?"
- "How many customers are affected, and how badly?"
- "Is there a contractual or legal deadline?"
- "What would you drop to make room for this?"

#### Step-by-step framework
1. **Question each P1**: impact, deadline, who's affected.
2. **Agree priority definitions** with stakeholders.
3. **Use one ranked list** instead of labels.
4. **Run a regular prioritisation forum.**
5. **Reserve a buffer** for genuine emergencies.
6. **Communicate** decisions and reasoning.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd work on the most senior person's P1." | Applies agreed criteria fairly |
| Tries to do everything | Makes trade-offs explicit with a ranked list |
| Argues item by item | Fixes the system (definitions, forum) |
| No emergency capacity | Keeps a buffer for real urgent work |

#### Useful phrases
- "What happens if we don't do this in the next two weeks?"
- "When everything is P1, nothing is. Let's agree what P1 actually means."
- "Instead of labels, let's agree on the order."
- "If this goes in, what should it go above?"

#### Common pitfalls
- **Accepting labels at face value.**
- **Prioritising by seniority or volume.**
- **No shared criteria.**
- **Not reserving capacity** for real emergencies.
- **Making decisions privately.**

#### Follow-ups to expect (with sample answers)
- **"What if two items genuinely meet the P1 criteria?"**
  "Compare impact and deadline, consider splitting capacity, and if needed escalate with a clear recommendation."
- **"How do you stop stakeholders bypassing the process?"**
  "Make the process fast and transparent so it's easier to use than to bypass, and agree with leadership that requests go through it."
- **"What if leadership keeps adding P1s?"**
  "Show the impact on current commitments, and ask them to choose what to drop or delay."

- **"How do you handle true emergencies from leadership?"**
  "Use the emergency buffer, assess impact quickly, swap work transparently, and inform the stakeholders affected."
- **"How do you stop priority labels from drifting again?"**
  "Review them regularly in the prioritisation forum, re-label items that don't meet the criteria, and keep the definitions visible."

#### What senior interviewers look for
- Designing **prioritisation systems** across teams.
- Getting **leadership buy-in** for shared criteria.
- Reducing **reactive work** through root-cause fixes.

#### Practise it
1. Write P1/P2/P3 definitions for a product you know.
2. Take 10 requests (real or invented), classify them, and rank them.
3. Explain the new process **out loud in 3 minutes** to a frustrated stakeholder.

## How do you prioritise bugs?
- id: po-prioritisation-08
- round: PRIORITIZATION_ROADMAP
- difficulty: easy
- levels:
- tags: bugs, severity, quality, triage

### Prompt
How do you decide which bugs to fix first, and how do you balance bug fixing with feature work?

### Answer
#### What the interviewer is really testing
- Whether you have a **clear, consistent triage process**.
- Whether you understand **severity versus priority**.
- How you **balance quality and new features**.
- Whether you look for **root causes and trends**.

#### Key points
- **Severity**: how bad the impact is (e.g. data loss versus a typo).
- **Priority**: how soon to fix it, considering severity, **number of users affected**, **frequency**, **business impact** and **workarounds**.
- Use a simple **triage matrix** and agreed **service levels** (e.g. critical bugs fixed within hours).
- **Regular triage** with QA and engineering.
- Reserve **capacity** for bugs, and track **quality trends**.
- Fix **root causes** of recurring bugs.

#### Model answer
"I use a simple, consistent triage process, agreed with engineering and QA.

**1. Assess each bug on several dimensions:**
- **Severity**: what happens? Data loss, security issue, payments failing (critical) → a feature broken with no workaround (high) → broken with a workaround (medium) → cosmetic (low).
- **Reach**: how many users are affected?
- **Frequency**: does it happen every time or rarely?
- **Business impact**: revenue, legal risk, reputation, key customers.
- **Workaround**: can users get around it easily?

**2. Map to priority levels with agreed response times:**
- **P1 / critical**: e.g. checkout broken, data exposed. Drop everything; fix within hours; communicate to stakeholders.
- **P2 / high**: major feature broken for many users without a workaround. Fix in the current or next sprint.
- **P3 / medium**: limited impact or a workaround exists. Schedule in the backlog.
- **P4 / low**: cosmetic or rare. Fix when convenient, or close if not worth it.

**3. Triage regularly.** A short weekly triage session (or daily for high-volume products) with QA and the tech lead to review new bugs, assign priorities and spot patterns.

**4. Balance with feature work:**
- Critical bugs interrupt the sprint.
- For the rest, I reserve capacity, e.g. **10–20% of each sprint** for bugs and small fixes, so quality doesn't slip.
- If the bug backlog grows quickly, I treat it as a signal that quality practices need attention, not just more bug fixing.

**5. Look for root causes and trends.**
- Group bugs by area: if one part of the product causes most bugs, that's a candidate for refactoring or better tests.
- Run short post-mortems on critical bugs, and add automated tests to prevent recurrence.

**6. Keep the backlog clean.** Close old, low-priority bugs that will realistically never be fixed, with a note, so the list stays meaningful.

**Example.** Bug analysis showed 40% of our bugs came from the invoice editor. We spent one sprint adding automated tests and refactoring the worst parts, and bugs in that area dropped by more than half over the next two months."

#### Another worked example: a high-profile customer bug
"A large client reported a bug affecting only their custom setup.
- **Severity**: medium (workaround existed). **Reach**: one customer. **Business impact**: high (major account, renewal coming up).
- **Decision**: prioritised as P2, fixed in the next sprint, with the account manager informed of the timeline and the workaround in the meantime.
- **Lesson**: business impact can raise priority even when reach is small."

#### Severity versus priority
| Example | Severity | Reach | Priority |
|---|---|---|---|
| Checkout fails for all users | Critical | All | P1, fix now |
| Data export broken, workaround exists | Medium | Many | P2–P3 |
| Typo on settings page | Low | Many | P4 |
| Crash for one major client's setup | High | One key account | P2 (business impact) |

#### Step-by-step framework
1. **Assess** severity, reach, frequency, business impact and workaround.
2. **Assign priority** with agreed response times.
3. **Triage regularly** with QA and engineering.
4. **Reserve capacity** for bugs.
5. **Find root causes** and trends.
6. **Keep the backlog clean.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Fix bugs as they come in." | Consistent triage criteria |
| Severity only | Severity plus reach, frequency, business impact |
| No capacity planned | Reserved capacity and clear service levels |
| Fix symptoms only | Root-cause analysis and preventive tests |
| Huge, stale bug backlog | Regular clean-up |

#### Useful phrases
- "Severity tells us how bad it is; priority tells us how soon to fix it."
- "Critical bugs interrupt the sprint; the rest go through triage."
- "If one area causes most bugs, we fix the root cause, not just the symptoms."
- "I'd rather close old low-priority bugs honestly than keep a list nobody trusts."

#### Common pitfalls
- **No consistent criteria**, so priority depends on who complains.
- **Ignoring low-severity bugs forever**, letting them pile up.
- **Letting bugs consume all capacity** without addressing quality practices.
- **Not communicating** with affected customers and support.

#### Follow-ups to expect (with sample answers)
- **"Who decides bug priority?"**
  "The PO decides priority, informed by QA's severity assessment and engineering's view of effort and risk."
- **"What's a bug versus a feature request?"**
  "A bug is when the product doesn't work as intended. A feature request is something new. Sometimes the line is blurry, and then I treat it based on user impact."
- **"How do you measure quality?"**
  "Escaped defects (bugs found in production), critical incidents, time to fix, and support tickets related to bugs."

#### What senior interviewers look for
- **Quality strategy** across teams: service levels, incident processes.
- Using **data** on bugs to guide technical investment.
- A **culture** of quality, not just bug fixing.

#### Practise it
1. Write a bug triage matrix with four priority levels and response times.
2. Classify five bugs (real or invented) using it.
3. Explain your process **out loud in 3 minutes**.

## Explain the Kano model and when you'd use it
- id: po-prioritisation-09
- round: PRIORITIZATION_ROADMAP
- difficulty: medium
- levels:
- tags: Kano model, customer satisfaction, prioritisation

### Prompt
What is the Kano model, and how would you use it in product decisions?

### Answer
#### What the interviewer is really testing
- Knowledge of a **well-known prioritisation framework**.
- Understanding that **features affect satisfaction differently**.
- Ability to **apply** it to real decisions.
- Awareness of how categories **change over time**.

#### Key points
- Developed by **Professor Noriaki Kano** in the 1980s.
- Classifies features by their effect on customer satisfaction:
  - **Basic (must-be)**: expected. Their absence causes dissatisfaction; their presence doesn't delight.
  - **Performance (one-dimensional)**: more is better. Satisfaction grows with how well they're delivered.
  - **Delighters (attractive)**: unexpected. They delight when present, but their absence doesn't disappoint.
  - **Indifferent**: customers don't care either way.
  - **Reverse**: some customers prefer not to have them.
- Usually researched with a **Kano survey** (functional and dysfunctional questions).
- Categories **shift over time**: today's delighters become tomorrow's basics.

#### Model answer
"The Kano model helps you understand **how different features affect customer satisfaction**, which is useful because not all features are equal.

**The main categories**, with a hotel as an example:
- **Basic needs**: a clean room, working Wi-Fi. If they're missing, guests are angry. If present, guests don't notice them.
- **Performance needs**: room size, Wi-Fi speed. The better they are, the happier guests are.
- **Delighters**: a handwritten welcome note, a free upgrade. Unexpected, and they create strong positive feelings. Guests don't miss them if absent.
- **Indifferent**: features most guests don't care about, like a fax machine.

**How I use it:**
1. **Make sure basics are covered first.** No amount of delight compensates for a broken basic. In a banking app, logging in reliably and seeing an accurate balance are basics.
2. **Invest steadily in performance features** that drive competitive advantage, like speed of payments or quality of insights.
3. **Add selective delighters** to differentiate and create word-of-mouth, e.g. Monzo's instant notifications with merchant logos were a delighter when they launched.
4. **Avoid indifferent features**, even if a few people request them.

**Researching it.** A **Kano survey** asks two questions per feature:
- *Functional*: 'How would you feel if the product had this feature?'
- *Dysfunctional*: 'How would you feel if it didn't?'

Answer options range from 'I like it' to 'I dislike it'. The combination places each feature into a category. I'd survey a representative sample of target users, analysing results by segment.

**Example.** For an invoicing app, a Kano survey might show:
- Basic: accurate invoice calculations, PDF download.
- Performance: speed of creating an invoice, number of payment options.
- Delighter: automatic reminders that get people paid faster.
- Indifferent: custom font choices.

This would shift investment away from design customisation toward reminders and payment options.

**Remember:** categories shift over time. Mobile apps were once delighters for banks; now they're basic. I'd revisit the analysis regularly."

#### Another worked example: using Kano in a roadmap discussion
"Stakeholders wanted to add five 'wow' features to a new product. A quick Kano survey showed two basic needs were poorly delivered: slow loading and unreliable sync. We prioritised fixing those first. Satisfaction scores rose more from fixing basics than the delighters would likely have achieved, and then we added one delighter that research showed would genuinely stand out."

#### Kano categories
| Category | If present | If absent | Strategy |
|---|---|---|---|
| Basic | Neutral | Very dissatisfied | Must get right first |
| Performance | More satisfied the better it is | Dissatisfied | Invest to compete |
| Delighter | Very satisfied | Neutral | Differentiate selectively |
| Indifferent | Neutral | Neutral | Avoid investing |
| Reverse | Dissatisfied | Satisfied | Don't build, or make optional |

#### A third worked example: Kano for a B2B product
"For a team-scheduling tool, a Kano survey across 300 customers showed:
- **Basic**: reliable calendar sync, accurate time zones.
- **Performance**: speed of finding meeting slots, number of integrations.
- **Delighter**: automatically suggesting the best meeting time for attendees across time zones.
- **Indifferent**: custom colour themes.
- **Reverse (for some)**: automatic meeting reminders by SMS, which some users found intrusive.

Decisions: fix time-zone bugs first (a basic need generating complaints), invest in integrations, build the smart-suggestion delighter next, make SMS reminders opt-in, and drop custom themes from the roadmap."

#### Combining Kano with other frameworks
- Use **Kano** to understand *how* features affect satisfaction.
- Use **RICE or value/effort** to compare *cost and reach*.
- Use **strategy** to decide which performance features to compete on.

#### Step-by-step framework
1. **List candidate features.**
2. **Research** with a Kano survey (functional and dysfunctional questions).
3. **Categorise** by segment.
4. **Prioritise**: basics first, then performance, then selected delighters.
5. **Revisit** over time.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Names the model, can't explain it | Explains categories with clear examples |
| Prioritises delighters first | Basics first, then performance, then delighters |
| Assumes categories | Researches with a Kano survey |
| Static view | Knows categories shift over time |

#### Useful phrases
- "No amount of delight compensates for a broken basic."
- "Performance features are where we compete; delighters are where we stand out."
- "Today's delighter becomes tomorrow's basic expectation."
- "A Kano survey asks how users feel with and without each feature."

#### Common pitfalls
- **Confusing categories**, or not giving examples.
- **Investing in delighters** while basics are broken.
- **Treating categories as permanent.**
- **Ignoring segment differences**: one group's delighter may be another's basic.

#### Follow-ups to expect (with sample answers)
- **"What are the limitations of Kano?"**
  "Surveys take effort, results vary by segment, and it doesn't account for cost or effort, so I'd combine it with frameworks like RICE."
- **"How does Kano relate to competition?"**
  "Features competitors all offer tend to become basics. Differentiation comes from performance and delighters."
- **"Give an example of a delighter becoming basic."**
  "Free next-day delivery in e-commerce, or contactless payments in banking."

- **"How many respondents do you need for a Kano survey?"**
  "Enough to see clear patterns per segment, often a few dozen per segment at minimum; more for confident results."
- **"What if a feature lands in different categories for different segments?"**
  "That's useful: it may be basic for one segment and a delighter for another, which informs packaging and targeting."

#### What senior interviewers look for
- Using Kano to shape **product strategy and positioning**.
- Combining it with **effort and value** frameworks.
- **Segment-level** analysis.

#### Practise it
1. Classify ten features of a product you use into Kano categories.
2. Write the functional and dysfunctional survey questions for two features.
3. Explain the model **out loud in 3 minutes** with your own example.

## How do you build a business case or estimate a feature's ROI?
- id: po-prioritisation-10
- round: PRIORITIZATION_ROADMAP
- difficulty: hard
- levels:
- tags: business case, ROI, financial reasoning, investment

### Prompt
How would you build a business case for a significant product investment? How do you estimate the return on investment?

### Answer
#### What the interviewer is really testing
- **Business and financial reasoning.**
- Whether you can **estimate value** credibly with assumptions and ranges.
- Whether you include **all costs**, not just development.
- Whether you **communicate uncertainty** honestly and propose ways to reduce it.

#### Key points
- **ROI** = (benefit − cost) ÷ cost. Also consider **payback period** (how long until benefits cover costs).
- **Benefits**: increased revenue (new customers, conversion, upgrades), retained revenue (reduced churn), cost savings (support, operations), risk reduction.
- **Costs**: development (people × time), design, infrastructure, third-party fees, maintenance, support, go-to-market, and **opportunity cost**.
- Use **explicit assumptions** and **scenarios** (pessimistic, expected, optimistic).
- Identify the **key assumptions** that drive the result, and how to **test** them.
- Work with **finance** to use their standards.

#### Model answer
"I'd build it in five steps, keeping it simple and transparent about assumptions.

Say we're considering **automatic payment reminders** for our invoicing product.

**1. Define the benefits.**
- **Reduced churn**: customers who struggle with late payments churn more. If reminders reduce churn in that group from 3% to 2.5% a month:
  - 10,000 affected customers × 0.5% fewer churning a month × £15 a month × 12 months ≈ **£108k of retained revenue in year one** (simplified; it compounds as retained customers keep paying).
- **Upgrades**: if reminders are in a Pro plan and 4% of 50,000 customers upgrade at +£8 a month: 2,000 × £8 × 12 ≈ **£192k a year**.
- **Support savings**: fewer tickets about chasing payments, e.g. 300 a month × £5 ≈ **£18k a year**.

**2. Estimate the costs.**
- **Development**: 3 engineers + 1 designer for 8 weeks ≈ 32 person-weeks. At a loaded cost of about £2,000 per person-week, ≈ **£64k**.
- **Running costs**: email sending, maybe £500 a month ≈ **£6k a year**.
- **Maintenance**: about 10% of build cost a year ≈ **£6k**.
- **Launch**: marketing and support training, ≈ **£10k**.
- **Total year one** ≈ **£86k**.

**3. Calculate ROI and payback.**
- Year-one benefits ≈ £318k (expected scenario); costs ≈ £86k.
- ROI ≈ (318 − 86) ÷ 86 ≈ **2.7×**.
- Payback in roughly **3–4 months** after launch.

**4. Add scenarios and identify key assumptions.**
- **Pessimistic**: 1.5% upgrade, no churn effect → benefit ≈ £90k. Still roughly break-even in year one.
- **Optimistic**: 6% upgrade, larger churn effect.
- The **key assumption** is the upgrade rate. I'd test it before building fully, e.g. a fake-door upgrade prompt or a pricing survey.

**5. Consider opportunity cost and strategy.**
- What else could the team do in those 8 weeks? I'd compare the expected return with the next best option.
- Strategic value: reminders support our positioning ('get paid faster'), which is harder to quantify but matters.

**Presenting it:** one page with the recommendation, benefits and costs, scenarios, key assumptions and how we'll validate them, and success metrics we'll track after launch. I'd review it with finance to make sure the numbers follow company conventions.

Business cases are never precise. Their value is in making assumptions explicit, so we can debate and test them."

#### Another worked example: a cost-saving investment
"Automating a manual onboarding check done by operations:
- **Current cost**: 6 people × 50% of their time ≈ 3 full-time equivalents ≈ £120k a year.
- **Automation** could handle 70% of cases → saving ≈ £84k a year.
- **Cost**: 12 weeks of 2 engineers ≈ £48k, plus £5k a year in maintenance.
- **Payback** ≈ 7 months; also faster onboarding for customers (a conversion benefit not counted).
- **Key assumption**: the 70% automation rate, so we'd test it on historical cases first."

#### Business case template
| Section | Content |
|---|---|
| Recommendation | What we propose, in one sentence |
| Problem and opportunity | Why it matters |
| Benefits | Revenue, retention, savings, risk reduction (with assumptions) |
| Costs | Build, run, maintain, launch, opportunity cost |
| ROI and payback | Expected, pessimistic and optimistic scenarios |
| Key assumptions | What drives the result; how we'll test it |
| Risks | What could go wrong |
| Success metrics | How we'll measure after launch |

#### Step-by-step framework
1. **Define benefits** with explicit assumptions.
2. **Estimate all costs**, including maintenance and opportunity cost.
3. **Calculate ROI and payback.**
4. **Run scenarios** and find key assumptions.
5. **Plan to test** key assumptions.
6. **Present concisely**, and align with finance.
7. **Track actual results** after launch.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It'll bring in lots of revenue." | Quantified benefits with assumptions |
| Development cost only | Includes running, maintenance, launch and opportunity cost |
| One precise number | Scenarios and ranges |
| Hidden assumptions | Key assumptions stated and tested |
| Never checked after launch | Tracks actual results |

#### Useful phrases
- "The key assumption driving this is the upgrade rate, so I'd test it first."
- "Even in the pessimistic scenario, it roughly breaks even in year one."
- "Building it isn't the only cost. We should include maintenance and opportunity cost."
- "Business cases aren't precise, but they make our assumptions explicit."

#### Common pitfalls
- **Overly optimistic** assumptions.
- **Ignoring ongoing costs** and opportunity cost.
- **False precision** (exact numbers that hide uncertainty).
- **Not testing key assumptions.**
- **Never comparing** forecast with actual results.

#### Follow-ups to expect (with sample answers)
- **"How do you estimate something you've never done before?"**
  "Use comparable features, industry benchmarks and small experiments, show wide ranges, and focus on testing the most uncertain assumption."
- **"What if finance challenges your numbers?"**
  "Welcome it. Walk through the assumptions together, adjust where they have better data, and agree what we'll measure."
- **"How do you value strategic benefits?"**
  "Describe them qualitatively alongside the numbers, and where possible use proxies, like the impact on win rates or positioning."

#### What senior interviewers look for
- **Financial fluency**: ROI, payback, unit economics.
- **Portfolio thinking**: comparing investments across teams.
- **Accountability**: comparing forecasts with outcomes and improving estimates.

#### Practise it
1. Build a one-page business case for a feature in a product you know, with three scenarios.
2. Identify the single most important assumption and design a test for it.
3. Present it **out loud in 4 minutes** to an imaginary finance director.

## A big customer wants something that doesn't fit the product vision
- id: po-prioritisation-11
- round: PRIORITIZATION_ROADMAP
- difficulty: hard
- levels:
- tags: B2B, customer requests, vision, trade-offs

### Prompt
Your largest customer, worth 15% of revenue, is demanding a feature that doesn't fit your product vision and would only benefit them. What do you do?

### Answer
#### What the interviewer is really testing
- Balancing **short-term revenue** with **long-term product health**.
- Your ability to find **creative solutions** to the customer's underlying need.
- **Commercial awareness** and stakeholder management (sales, account management, leadership).
- Whether you consider **risks** on both sides: losing the customer versus building a "custom product".

#### Key points
- **Understand the underlying need**: often there's a way to meet it that fits the product.
- **Assess the real risk**: is the customer truly likely to leave? What's the impact?
- **Consider options**: a generalised version that helps others too, configuration, integration or API, professional services, a workaround, or a clear no.
- Watch for **"custom product" risk**: one-off features add complexity and maintenance forever.
- **Involve leadership and sales**: a revenue-critical decision deserves an informed, shared choice.
- **Communicate honestly** with the customer.

#### Model answer
"This is a genuine dilemma, and I'd treat it as a business decision rather than a pure product decision.

**1. Understand the underlying need.** I'd meet the customer with the account manager and ask what they're trying to achieve. Say they want a custom **approval workflow** with seven levels and unique rules matching their internal hierarchy. The underlying need might be: 'Our finance policy requires approvals over certain amounts, and we need an audit trail for compliance.'

**2. Look for options that fit the product:**
- **Generalise it**: could a configurable approval feature (e.g. approval rules by amount, with an audit log) meet their need *and* help other customers? If several mid-sized and large customers have similar needs, this might fit the vision after all.
- **Integration or API**: could they connect our product to their own workflow tool through an API?
- **Professional services**: a paid custom integration delivered outside the core product.
- **Workaround**: existing features plus a process change.

**3. Assess the risk and value:**
- How likely are they really to leave? Is this a negotiating position, or a dealbreaker?
- What would it cost to build and maintain, and what would it displace?
- What precedent does it set: will other large customers expect custom features too?

**4. Involve leadership.** With 15% of revenue at stake, I'd bring a clear recommendation to leadership and sales: the customer's need, the options, the costs, the risks, and my recommendation. For example: 'Build configurable approval rules (6 weeks), which meets their compliance need and is requested by 12 other accounts. Don't build the custom seven-level hierarchy.'

**5. Communicate honestly with the customer.** Together with the account manager, explain what we will do, why, and when, and how it meets their actual need. Customers often respect a clear, reasoned answer more than a vague promise.

**If no fit exists**, the company may decide to build it anyway for commercial reasons. Then I'd push to build it in an isolated, configurable way to limit the impact on the core product, and agree how we'll support it long-term."

#### Another worked example: saying no and keeping the customer
"A major client wanted a dedicated custom version of our dashboard.
- We offered instead: an export API plus a template for their BI tool, delivered in 2 weeks.
- The client's analytics team built exactly what they wanted on top of it.
- The client renewed, and the API was later used by 30 other customers."

#### Options for large-customer requests
| Option | When it fits | Risk |
|---|---|---|
| Generalise into a product feature | Others have similar needs | Takes longer |
| API / integration | Customer can build on top | Requires technical capability |
| Professional services | One-off, paid work | Maintenance outside the core |
| Workaround | Need can be met with existing features | May feel second-best |
| Build custom | Strategic account; no alternative | Complexity and precedent |
| Decline | Doesn't fit; low churn risk | Possible relationship strain |

#### Step-by-step framework
1. **Understand the underlying need.**
2. **Explore options** that fit the product.
3. **Assess risk, cost and precedent.**
4. **Recommend** to leadership with data.
5. **Communicate honestly** with the customer.
6. **If building custom**, isolate it and plan long-term support.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "They're 15% of revenue, so build it." | Weighs revenue against long-term product health |
| "It doesn't fit the vision; no." | Finds creative ways to meet the underlying need |
| Decides alone | Involves leadership and sales in a commercial decision |
| Ignores precedent | Considers what it signals to other customers |

#### Useful phrases
- "What are they actually trying to achieve?"
- "Could we solve this in a way that helps other customers too?"
- "With this much revenue at stake, it should be an informed leadership decision."
- "Here's what we will do, why, and how it meets your need."

#### Common pitfalls
- **Automatically building** whatever big customers ask for, which turns the product into custom software.
- **Refusing without exploring** alternatives.
- **Ignoring the commercial reality.**
- **Making the decision alone.**
- **Vague promises** to the customer.

#### Follow-ups to expect (with sample answers)
- **"What if leadership overrules you and builds it?"**
  "Accept the decision, build it in the most isolated and configurable way possible, and document the maintenance cost so future decisions are informed."
- **"How do you avoid this situation?"**
  "Have a clear product strategy and ideal customer profile, shared with sales, and engage key customers in roadmap discussions early."
- **"What's an ideal customer profile?"**
  "A description of the customers we're best placed to serve, which guides sales targeting and product decisions."

#### What senior interviewers look for
- **Commercial judgement** balanced with product strategy.
- **Strategic partnerships** with key accounts.
- Influencing **sales and leadership** behaviour around custom requests.

#### Practise it
1. Invent a demanding large-customer request in a product you know.
2. Write the underlying need, three alternative options, and your recommendation.
3. Present it **out loud in 4 minutes** as if to the CEO and Head of Sales.

## Innovation and big bets versus incremental improvements
- id: po-prioritisation-12
- round: PRIORITIZATION_ROADMAP
- difficulty: hard
- levels:
- tags: innovation, portfolio, big bets, strategy

### Prompt
How do you balance investing in bold new ideas against incremental improvements to the existing product?

### Answer
#### What the interviewer is really testing
- **Portfolio thinking**: managing risk across different types of investment.
- Whether you can **justify and manage** uncertain bets.
- How you keep the **core product healthy** while exploring the future.
- How you **decide when to stop** a bet.

#### Key points
- Incremental improvements: **lower risk, predictable returns**, keep the core competitive.
- Big bets: **higher risk, potentially large returns**, create future growth.
- Use a **portfolio approach**, e.g. a rough split like **70/20/10** (core / adjacent / transformational). This idea is associated with Google's approach and the innovation ambition matrix.
- Manage big bets with **staged investment**: small experiments first, more funding as evidence grows.
- Define **kill criteria** in advance.
- Protect bets from being **starved** by urgent core work.

#### Model answer
"I think of it as managing a portfolio, like investments: most of our effort should go into reliable returns, but some should go into bets that could create significant future growth.

**1. Understand the two types:**
- **Incremental improvements**: optimising onboarding, fixing pain points, performance. Lower risk, reliable impact, and they keep the core product competitive.
- **Big bets**: new products, new markets, new technologies (e.g. an AI assistant). High uncertainty, but potentially transformative.

**2. Agree a rough split** with leadership, based on our situation. A common starting point is:
- **~70%** core improvements.
- **~20%** adjacent opportunities (extending the product to related needs or segments).
- **~10%** transformational bets.

A struggling product might put more into the core; a mature product facing disruption might invest more in bets.

**3. Manage big bets differently:**
- **Start small**: a small team, a time-boxed discovery phase, cheap experiments.
- **Staged funding**: invest more only when evidence passes agreed milestones (problem validated → solution validated → early traction).
- **Kill criteria in advance**: e.g. 'If after 8 weeks fewer than 10% of beta users use it weekly, we stop.'
- **Different metrics**: early on, learning and engagement signals rather than revenue.

**4. Protect the bets.** Urgent core work constantly threatens to absorb innovation capacity. I'd make the allocation explicit and visible, so it isn't quietly eroded.

**5. Keep the core healthy.** A neglected core loses customers. Bets shouldn't come at the cost of basic quality and key improvements.

**Example.** For an invoicing product, our portfolio might be:
- **Core (70%)**: faster invoice creation, payment reliability, mobile improvements.
- **Adjacent (20%)**: expense tracking for the same customers.
- **Bet (10%)**: an AI cash-flow forecasting assistant, with two engineers and a designer for one quarter, with milestones and kill criteria.

After the first milestone, if beta users find the forecasts useful and return weekly, we expand the team. If not, we stop and reinvest the capacity, sharing what we learned."

#### Another worked example: a bet that was stopped
"A team explored a marketplace connecting small businesses with accountants. After 10 weeks of experiments:
- Demand from businesses was decent, but accountants weren't interested in the leads.
- Kill criteria (a minimum number of matched pairs per week) weren't met.
- We stopped, published the learnings internally, and reused the research to improve our accountant collaboration features, which did perform well."

#### Portfolio view
| Type | Example | Risk | Return | Share (illustrative) |
|---|---|---|---|---|
| Core | Improve onboarding | Low | Predictable | ~70% |
| Adjacent | New feature for an existing segment | Medium | Moderate | ~20% |
| Transformational | New product or technology | High | Potentially large | ~10% |

#### A third worked example: protecting a bet from being starved
"We allocated two engineers to explore an AI-assisted invoice-matching feature for one quarter. Within three weeks, urgent bug work had pulled both engineers back to the core team.
- **I made the trade-off visible**: showed leadership that the bet had received about 20% of its planned capacity.
- **Agreed a fix**: the two engineers were removed from the on-call rotation for the quarter, and the core team took on a slightly smaller roadmap.
- **Result**: the bet reached its first milestone (85% matching accuracy on historical data) by the end of the quarter, and was funded for a beta."

#### How to pitch a big bet
- **Problem and opportunity size.**
- **Why now** (market change, new technology, customer shift).
- **Small first stage** with clear learning goals.
- **Milestones and kill criteria.**
- **What it costs**, including what the core team won't do.

#### Step-by-step framework
1. **Classify** work into core, adjacent and transformational.
2. **Agree a split** suited to the company's situation.
3. **Manage bets** with small teams, staged funding and kill criteria.
4. **Protect** the allocation.
5. **Keep the core healthy.**
6. **Review** the portfolio regularly.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We focus on what customers ask for." | Balances incremental and strategic bets |
| "We should always innovate." | Keeps the core healthy |
| Funds bets fully up front | Staged investment with milestones |
| Never stops a bet | Kill criteria agreed in advance |
| Innovation is whatever's left over | Explicit, protected allocation |

#### Useful phrases
- "I think of it as a portfolio: most effort on reliable improvements, some on bets."
- "We fund bets in stages, based on evidence."
- "We agree kill criteria before we start, so stopping isn't personal."
- "If we don't protect innovation time, urgent work will absorb it."

#### Common pitfalls
- **Only incremental work**, leaving the company vulnerable to disruption.
- **Chasing shiny bets** while the core degrades.
- **Over-investing early** in unproven ideas.
- **No kill criteria**, so bets continue indefinitely.

#### Follow-ups to expect (with sample answers)
- **"How do you measure a big bet early on?"**
  "Learning milestones: problem validated, solution validated, then engagement and retention among early users, before revenue."
- **"Who should work on bets?"**
  "A small, dedicated team, often with people comfortable with ambiguity, rather than spreading bets across busy core teams."
- **"How do you convince leadership to fund a bet?"**
  "Connect it to strategy, show the opportunity size, propose a small first stage with clear milestones, and limit downside risk."

- **"How do you report progress on a bet to leadership?"**
  "Against learning milestones: what we tested, what we learned, whether we've met the criteria for the next stage, and the decision we recommend."
- **"What happens to the team when a bet is stopped?"**
  "Celebrate the learning, share it widely, and move people to the next most valuable work. Stopping should never be seen as failure if criteria were agreed."

#### What senior interviewers look for
- **Portfolio management** across teams and products.
- **Innovation processes**: staged funding, kill criteria, learning culture.
- Aligning bets with **long-term strategy**.

#### Practise it
1. For a product you know, list two core improvements, one adjacent opportunity and one transformational bet.
2. For the bet, write three staged milestones and kill criteria.
3. Explain your portfolio **out loud in 4 minutes**.
