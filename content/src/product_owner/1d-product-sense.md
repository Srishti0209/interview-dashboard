# Product Owner — Product Sense (continued)

## How do you make a product accessible and inclusive?
- id: po-product-sense-21
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: accessibility, inclusive design, WCAG

### Prompt
How do you make sure your product is accessible and inclusive? How do you prioritise accessibility work?

### Answer
#### What the interviewer is really testing
- Whether you treat accessibility as a **core quality**, not an afterthought.
- Basic knowledge of **standards** (WCAG) and **legal requirements**.
- Practical ways to **build it into the process**.
- How you **prioritise** existing accessibility gaps.

#### Key points
- **Accessibility** means people with disabilities (visual, hearing, motor, cognitive) can use the product. **Inclusive design** goes wider: different ages, languages, abilities, devices, connection speeds and situations.
- Large numbers of people have a disability, and **everyone benefits**: captions help in noisy places, clear language helps non-native speakers, large tap targets help on the move.
- The main standard is **WCAG** (Web Content Accessibility Guidelines), currently 2.2, usually targeting level **AA**. Its principles: **Perceivable, Operable, Understandable, Robust (POUR)**.
- Legal requirements exist in many places (e.g. the UK Equality Act, the European Accessibility Act, the ADA in the US).
- Build it into the **Definition of Done**, **design system**, **testing** and **research**.

#### Model answer
"I treat accessibility as part of product quality: if some people can't use the product, it isn't finished. It's also a legal requirement in many markets, and it usually improves the experience for everyone.

**How I build it in:**
1. **Standards**: we target **WCAG 2.2 level AA** for all new work.
2. **Definition of Done**: every user-facing story includes accessibility checks: keyboard navigation, screen-reader labels, colour contrast, text resizing, focus order, and clear error messages.
3. **Design system**: accessible components (buttons, forms, modals) built once and reused, so every team benefits automatically.
4. **Design reviews**: we check contrast, text size, touch target size, and that information isn't conveyed by colour alone.
5. **Testing**: automated tools catch some issues (e.g. missing labels, low contrast), but not all. We add manual testing with keyboard and screen readers (VoiceOver, NVDA), and ideally **research with disabled users**.
6. **Content**: plain language, clear headings, captions for videos, descriptive link text.

**Prioritising existing gaps.** For an existing product, I'd start with an **accessibility audit** (internal or external), then prioritise by:
- **Severity**: does it block a task completely (e.g. checkout can't be completed with a keyboard), or just make it harder?
- **Importance of the journey**: sign-up, payments and core tasks first.
- **Number of users affected.**
- **Legal risk.**

**Example.** An audit of our checkout found the payment form couldn't be completed with a screen reader because error messages weren't announced and two buttons had no labels. These were blockers on our most important journey, so we fixed them in the next sprint. We then added accessibility checks to the Definition of Done to stop similar issues recurring. Support contacts from customers using assistive technology dropped, and we avoided a potential legal complaint."

#### Another worked example: inclusive design beyond disability
"For a banking app used widely by older customers and people with limited data plans:
- **Larger default text** and the ability to increase it further.
- **Clear, jargon-free language** ('Money in' instead of 'Credits').
- A **lightweight mode** for slow connections.
- **Alternatives** to app-only processes, e.g. phone support for key tasks.
- Research included older users and people with low digital confidence."

#### WCAG principles (POUR)
| Principle | Meaning | Examples |
|---|---|---|
| Perceivable | Users can perceive content | Alt text, captions, sufficient contrast |
| Operable | Users can operate the interface | Keyboard access, enough time, no seizure-inducing flashes |
| Understandable | Content and interaction are clear | Plain language, predictable navigation, helpful errors |
| Robust | Works with assistive technologies | Proper code structure, screen-reader compatibility |

#### Step-by-step framework
1. **Set the standard** (WCAG 2.2 AA).
2. **Build it into** the Definition of Done and design system.
3. **Review designs** for accessibility.
4. **Test** automatically and manually, and include disabled users in research.
5. **Audit** existing products and **prioritise** by severity, journey, reach and risk.
6. **Prevent regressions** with ongoing checks.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We'll do accessibility later." | Built into every story via the Definition of Done |
| "Our users don't have disabilities." | Recognises many users do, and everyone benefits |
| Automated checks only | Automated plus manual plus real-user research |
| No standard | Targets WCAG 2.2 AA |
| No prioritisation | Prioritises by severity, journey, reach and legal risk |

#### Useful phrases
- "If some people can't use it, it isn't finished."
- "Accessibility checks are part of our Definition of Done."
- "We fix blockers on the most important journeys first."
- "Accessible design usually makes the product better for everyone."

#### Common pitfalls
- **Treating accessibility as optional** or a one-off project.
- **Relying only on automated tools.**
- **Ignoring cognitive accessibility** (clear language, simple flows).
- **Not including disabled users** in research.
- **Fixing issues once** without preventing new ones.

#### Follow-ups to expect (with sample answers)
- **"How do you convince stakeholders to invest in accessibility?"**
  "Legal requirements, the size of the audience affected, improved experience for everyone, and brand reputation. Then show it's cheaper to build in from the start than to fix later."
- **"What's alt text?"**
  "A text description of an image, read out by screen readers, so people who can't see the image understand its content or purpose."
- **"What's an accessibility overlay, and should we use one?"**
  "A third-party script claiming to fix accessibility automatically. They generally don't fix underlying problems and are widely criticised by disabled users. Fixing the product itself is the right approach."

#### What senior interviewers look for
- **Organisation-wide** accessibility standards and governance.
- Accessibility in the **design system** and engineering practices.
- **Inclusive design** as part of product strategy.

#### Practise it
1. Try using a product you know with only the keyboard for 10 minutes, and note problems.
2. Turn on a screen reader (VoiceOver or TalkBack) and try to complete one task.
3. Write five Definition of Done checks for accessibility, and explain your approach **out loud in 3 minutes**.

## How would you grow the user base of a product?
- id: po-product-sense-22
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: growth, acquisition, product-led growth, funnel

### Prompt
How would you grow the number of active users of our product?

### Answer
#### What the interviewer is really testing
- Whether you understand the **growth funnel** (acquisition, activation, retention, referral, revenue).
- Whether you diagnose **where growth is limited** before suggesting tactics.
- Knowledge of **growth levers**, including **product-led growth**.
- Whether you think about **sustainable** growth, not just acquisition.

#### Key points
- "Active users" depends on **acquisition, activation and retention**. Growth leaks if any part is weak.
- **Diagnose first**: where's the biggest constraint? Often it's activation or retention, not acquisition.
- **Growth levers**: product-led growth (the product drives acquisition), referrals and virality, content and SEO, partnerships, paid acquisition, improved onboarding, and retention features.
- Use the **AARRR** framework (Acquisition, Activation, Retention, Referral, Revenue).
- **Experiment**: run focused growth experiments and measure.

#### Model answer
"Before suggesting tactics, I'd diagnose where growth is actually limited, because adding more users at the top doesn't help if most of them leave.

**1. Understand the funnel.** For a collaboration tool:
- **Acquisition**: 50,000 sign-ups a month.
- **Activation**: only 30% create a project and invite someone in the first week.
- **Retention**: of activated users, 60% are still active after 3 months.
- **Referral**: active teams invite on average 2 new users.

Here the biggest leak is **activation**: 70% of sign-ups never get value. Improving activation from 30% to 40% would add far more active users than a 10% increase in sign-ups.

**2. Prioritise levers by stage:**
- **Activation**: simplify onboarding, templates to get started quickly, prompts to invite teammates, show value early.
- **Retention**: habit-forming features (notifications that matter, weekly summaries), integrations with tools teams already use, fixing reasons people leave.
- **Referral / virality**: make collaboration the core value, so inviting others is natural. Every shared project exposes new people to the product (product-led growth).
- **Acquisition**: SEO content around problems we solve, templates people can discover, partnerships and integrations, and paid channels only once activation and retention are strong.

**3. Run experiments.** Pick the top 2–3 hypotheses and test them, for example:
- 'Offering templates during onboarding will increase week-one activation from 30% to 36%.'
- 'Prompting users to invite a teammate after creating their first task will increase activation.'

**4. Measure the right thing.** I'd track **weekly active users** (or active teams), broken down into new, retained and resurrected (returning) users, so we know where growth comes from. Guardrails: retention of new cohorts, and quality of sign-ups (not just volume).

**5. Build a growth rhythm.** A regular cycle of hypotheses, experiments, results and learning, with a dashboard everyone sees.

**Example result.** Templates in onboarding raised week-one activation from 30% to 37%. Combined with an invite prompt, active teams grew about 18% over the quarter, without increasing marketing spend."

#### Another worked example: a consumer marketplace
"For a second-hand clothing marketplace:
- **Constraint**: plenty of buyers, but not enough listings in popular categories (a supply problem).
- **Levers**: make listing an item take under a minute (photo-based auto-fill), prompt buyers to sell items they no longer wear, and give sellers visibility boosts for their first listings.
- **Metric**: weekly active buyers and sellers, plus the share of searches that return relevant results.
- **Insight**: in marketplaces, growth often depends on balancing both sides."

#### Growth levers by funnel stage
| Stage | Example levers |
|---|---|
| Acquisition | SEO, content, partnerships, integrations, paid ads, app store optimisation |
| Activation | Simpler onboarding, templates, faster time to value |
| Retention | Habit loops, notifications, integrations, fixing churn reasons |
| Referral | Collaboration features, sharing, referral incentives |
| Revenue | Pricing, upgrades, expansion |

#### Step-by-step framework
1. **Map the funnel** with real numbers.
2. **Find the biggest constraint.**
3. **Choose levers** for that stage.
4. **Run experiments** with clear hypotheses.
5. **Measure** active users by new, retained and returning.
6. **Repeat** in a regular growth cycle.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Spend more on marketing." | Diagnoses the funnel first |
| Focuses only on acquisition | Recognises activation and retention often matter more |
| Long list of tactics | Prioritised levers for the biggest constraint |
| No measurement | Experiments with hypotheses and metrics |
| Short-term spikes | Sustainable, compounding growth |

#### Useful phrases
- "Before adding more users at the top, let's check where we're losing them."
- "Improving activation from 30% to 40% beats a 10% increase in sign-ups."
- "The best growth comes from the product itself: every shared project brings in new users."
- "We'll run a few focused experiments and double down on what works."

#### Common pitfalls
- **Jumping to acquisition tactics** without diagnosing.
- **Ignoring retention** (a "leaky bucket").
- **Vanity metrics** like total sign-ups.
- **Too many experiments at once**, with no learning.
- **Growth that hurts quality**, e.g. spammy invite prompts.

#### Follow-ups to expect (with sample answers)
- **"What's product-led growth?"**
  "A strategy where the product itself drives acquisition, conversion and expansion, e.g. through free tiers, easy self-serve onboarding and collaboration features that spread to new users."
- **"How do you measure virality?"**
  "The viral coefficient: the average number of new users each user brings in. Above 1 means growth compounds on its own, though that's rare."
- **"What if acquisition costs are rising?"**
  "Focus on activation and retention (which make each acquired user more valuable), invest in organic channels, and check whether we're targeting the right audience."

#### What senior interviewers look for
- Building a **growth model** and connecting it to company goals.
- Understanding **unit economics** (CAC, LTV) and sustainable growth.
- Setting up **growth teams and experimentation** processes.

#### Practise it
1. Map the AARRR funnel for a product you use, estimating numbers where needed.
2. Identify the biggest constraint and three experiments to address it.
3. Explain your growth plan **out loud in 5 minutes**.

## How would you improve retention?
- id: po-product-sense-23
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: retention, churn, engagement, habit

### Prompt
Retention for our product has been declining. How would you go about improving it?

### Answer
#### What the interviewer is really testing
- Whether you **diagnose** retention problems using **cohorts and segments**.
- Whether you understand **why** users leave, combining data and research.
- Knowledge of **retention levers**: activation, habit, value, re-engagement.
- Whether you **measure** improvement properly.

#### Key points
- **Define retention** for your product (e.g. % of users active in week 4 after sign-up).
- Use **cohort analysis** to see whether newer cohorts retain worse than older ones, and **when** users drop off.
- **Segment**: which users retain well, and which don't? What do retained users do differently?
- Find the **"aha moment"** or habit that predicts retention.
- **Talk to churned users.**
- Levers: **better activation**, **delivering core value**, **habit formation**, **re-engagement**, **fixing pain points**, **switching costs** (integrations, data).

#### Model answer
"I'd start by understanding exactly who's leaving, when and why, before choosing solutions.

**1. Define retention.** For a language-learning app, I'd define it as **the % of new users still completing at least one lesson a week, 4 and 12 weeks after sign-up**.

**2. Cohort analysis.** I'd plot retention curves by sign-up month. Key questions:
- Are **newer cohorts** retaining worse than older ones? That points to a recent change: a new acquisition channel, a product change, or market changes.
- **When** do most users drop off? If the curve falls sharply in week one, it's an activation problem. If it declines steadily after week 4, it's a value or habit problem.
- Does the curve **flatten** at some point? A flat tail means a core group finds lasting value.

**3. Segment and find what predicts retention.** I'd compare retained and churned users:
- Acquisition channel, device, goal chosen at onboarding.
- **Early behaviours**: e.g. users who complete 3 lessons in week one and set a daily reminder might retain 3 times better.

That gives us an **activation target**: get more new users to those behaviours.

**4. Understand why.** I'd interview churned users, review cancellation surveys and look at support themes. Common reasons: lost motivation, too difficult or too easy, no visible progress, life got busy.

**5. Choose levers based on the diagnosis:**
- **Early drop-off** → improve onboarding and activation: personalised starting level, a quick first win, set up a daily reminder.
- **Steady decline** → strengthen habit and value: streaks (with forgiveness for missed days), visible progress, content matched to goals, social features like friends or leagues.
- **Re-engagement**: well-timed, helpful reminders, and 'welcome back' flows that make returning easy rather than embarrassing.
- **Pain points**: fix issues that frustrate users (e.g. repetitive content, bugs).

**6. Experiment and measure.** For each change, run an A/B test with **week-4 retention** as the primary metric, plus leading indicators like week-one lesson completion. Guardrails: notification opt-outs, app uninstalls.

**Example.** Cohorts showed newer users dropping sharply in week one. Users who set a daily goal and reminder during onboarding retained much better. We made goal-setting part of onboarding and added a gentle evening reminder. Week-4 retention for new users rose from 22% to 27%."

#### Another worked example: B2B retention
"For a B2B analytics product, accounts churned at renewal:
- **Cohorts and segments**: churned accounts had few active users and hadn't connected their main data source.
- **Interviews**: champions left the company, and nobody else saw the value.
- **Levers**: onboarding that connects data sources early, multi-user adoption (invite colleagues), regular value reports to decision-makers, and customer success check-ins for accounts with low usage before renewal.
- **Result**: renewal rate improved for accounts that went through the new onboarding."

#### Retention diagnosis
| Pattern | Likely cause | Lever |
|---|---|---|
| Sharp drop in first days | Poor activation | Onboarding, quick wins |
| Steady decline after weeks | Weak habit or value | Progress, habit loops, content |
| Newer cohorts worse | Recent change | Investigate channels, releases |
| One segment churns more | Poor fit or unmet need | Targeted improvements or better targeting |
| Churn at renewal (B2B) | Value not visible; low adoption | Adoption, value reporting, success outreach |

#### Step-by-step framework
1. **Define retention** for the product.
2. **Cohort analysis**: when and which cohorts drop off.
3. **Segment** and find behaviours that predict retention.
4. **Research** why users leave.
5. **Choose levers** matching the diagnosis.
6. **Experiment** and measure with cohorts.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Send more notifications." | Diagnoses with cohorts and segments first |
| One overall retention number | Retention curves by cohort and segment |
| Guesses reasons | Interviews churned users |
| Generic tactics | Levers matched to the specific drop-off pattern |
| No experiments | A/B tests with cohort retention metrics |

#### Useful phrases
- "Let's look at retention curves by cohort to see when users drop off."
- "Users who do X in their first week retain three times better, so that's our activation target."
- "A sharp early drop is an activation problem; a steady decline is a value or habit problem."
- "We'd measure success with week-4 retention of new cohorts."

#### Common pitfalls
- **Jumping to tactics** like notifications or discounts.
- **Looking at overall retention only**, which hides cohort differences.
- **Confusing correlation with causation** in "aha moment" analysis without testing.
- **Spamming users**, which harms long-term retention.
- **Ignoring churned-user research.**

#### Follow-ups to expect (with sample answers)
- **"What's a good retention rate?"**
  "It depends heavily on the product type and usage frequency. Compare with your own trends, similar products where benchmarks exist, and look for a curve that flattens rather than declining to zero."
- **"How do you find the aha moment?"**
  "Compare early behaviours of retained and churned users, find those most strongly linked to retention, then test whether encouraging them improves retention."
- **"Are discounts a good retention tool?"**
  "Sometimes, at the moment of cancellation, but they don't fix underlying value problems and can attract deal-seekers. I'd use them carefully alongside product improvements."

#### What senior interviewers look for
- Using **cohort analysis** and **retention curves** fluently.
- Connecting retention to **lifetime value** and growth strategy.
- Cross-functional retention work with **customer success and marketing**.

#### Practise it
1. Sketch two retention curves: one with a sharp early drop and one with a steady decline. Write what each suggests.
2. For a product you use, list three behaviours you think predict retention.
3. Explain your approach to improving retention **out loud in 5 minutes**.

## Should we enter a new market or launch a new product line?
- id: po-product-sense-24
- round: PRODUCT_SENSE
- difficulty: hard
- levels: senior
- tags: strategy, market entry, expansion, business case

### Prompt
Leadership is considering expanding into a new market (for example a new country or customer segment). How would you evaluate whether it's a good idea?

### Answer
#### What the interviewer is really testing
- **Strategic thinking** at a business level.
- Your ability to evaluate **market attractiveness** and **company fit**.
- **Risk assessment** and building a structured **business case**.
- Whether you propose a way to **test before committing** fully.

#### Key points
- Evaluate **market attractiveness**: size, growth, competition, customer needs, willingness to pay.
- Evaluate **company fit and ability to win**: strengths, product fit, required changes, brand.
- Consider **requirements and costs**: localisation, regulation, partnerships, operations, go-to-market.
- Weigh **risks** and **opportunity cost** (what you're not doing).
- **Test cheaply** first: research, pilots, partnerships.
- Define **success criteria** and decision points.

#### Model answer
"I'd evaluate it with a structured approach: is the market attractive, can we win there, what would it take, and how can we test it before committing fully?

Say our UK invoicing product is considering **expanding to Germany**.

**1. Market attractiveness:**
- **Size and growth**: how many small businesses and freelancers are there? How fast is the segment growing?
- **Customer needs**: are the problems we solve (late payments, admin) as important there? Are there local differences, e.g. e-invoicing requirements or cultural attitudes to payment?
- **Competition**: who are the local and international players, and how satisfied are customers?
- **Willingness to pay**: typical spending on similar tools.

**2. Our ability to win:**
- What are our **strengths** (simplicity, mobile experience, integrations), and do they matter to German customers?
- **Product fit**: what needs to change? Language, local tax rules, e-invoicing standards, payment methods, accounting integrations.
- **Brand and trust**: we're unknown there, so how will we build credibility?

**3. Requirements and costs:**
- **Localisation**: translation, local formats, legal terms.
- **Regulation and compliance**: tax rules, invoicing laws, data protection.
- **Go-to-market**: marketing, partnerships (e.g. with local accountants), possibly local staff and support in German.
- **Ongoing costs**: maintaining two country versions, support, compliance updates.

**4. Risks and opportunity cost:**
- **Risks**: slower adoption than expected, regulatory complexity, strong local competitors.
- **Opportunity cost**: the same investment could grow our UK market share or build features for existing customers. What's the expected return of each?

**5. Business case.** A simple model over 3 years: target customers, expected conversion and pricing, revenue, investment, and break-even point, with best, expected and worst cases.

**6. Test before committing:**
- **Research**: interviews with 15–20 German small businesses and accountants.
- **Landing page and waitlist** in German, with targeted ads, to measure interest and cost per sign-up.
- **Pilot**: a limited beta with core features localised, perhaps through a partnership with an accounting firm.
- **Decision points**: e.g. 'If we reach 500 waitlist sign-ups at an acceptable acquisition cost and beta users retain at similar rates to the UK, we'll invest in full launch.'

**My recommendation would come with evidence**: a clear view on attractiveness, fit, cost and risk, and a staged plan that limits investment until the key assumptions are proven."

#### Another worked example: a new customer segment
"A product serving small businesses considers moving **up-market to mid-sized companies**:
- **Attractiveness**: higher revenue per customer, longer contracts.
- **Fit**: requires permissions, audit logs, single sign-on, integrations and sales-led selling. That's a big change from self-serve.
- **Risk**: product complexity could hurt small-business customers.
- **Test**: interview 10 mid-sized prospects, sell to 5 design partners with a dedicated team, and measure sales cycle length and deal size.
- **Decision**: proceed with a separate 'Business' tier only if design partners convert at target prices."

#### Evaluation framework
| Area | Key questions |
|---|---|
| Market attractiveness | Size, growth, needs, competition, willingness to pay |
| Ability to win | Strengths, differentiation, product fit, brand |
| Requirements | Localisation, regulation, go-to-market, operations |
| Economics | Investment, revenue, break-even, scenarios |
| Risks and opportunity cost | What could fail; what we give up |
| Testing plan | Research, waitlist, pilot, decision points |

#### Step-by-step framework
1. **Assess attractiveness.**
2. **Assess ability to win.**
3. **List requirements and costs.**
4. **Weigh risks and opportunity cost.**
5. **Build a business case** with scenarios.
6. **Design staged tests** with decision points.
7. **Recommend** with evidence.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Germany is big, so yes." | Evaluates attractiveness and ability to win |
| Ignores localisation and regulation | Lists requirements and ongoing costs |
| No opportunity cost | Compares with alternative investments |
| All-or-nothing launch | Staged tests with decision points |
| Opinion-based | Business case with scenarios |

#### Useful phrases
- "The question isn't just whether the market is attractive, but whether we can win there."
- "Let's compare this with the return on investing the same amount in our core market."
- "I'd test demand with a waitlist and a pilot before committing fully."
- "Here are the decision points that would trigger full investment."

#### Common pitfalls
- **Overestimating market size** ("1% of a huge market").
- **Ignoring localisation, regulation and go-to-market costs.**
- **Ignoring opportunity cost.**
- **Big-bang expansion** without testing.
- **Assuming what works at home works everywhere.**

#### Follow-ups to expect (with sample answers)
- **"How would you size the market?"**
  "Top-down (total businesses × share in our segment × likely adoption) and bottom-up (realistic customers we can reach per channel × conversion). If the two estimates are far apart, I'd dig into why."
- **"How do you decide between countries?"**
  "Score candidate markets on size, fit, regulatory complexity, competition and language, then test the top one or two."
- **"What would make you stop?"**
  "Missing agreed decision points: e.g. acquisition costs far above our model, or retention well below our home market."

#### What senior interviewers look for
- **Business strategy** thinking and financial reasoning.
- **Staged investment** with clear decision points.
- Working with **leadership, finance, legal and commercial** teams.

#### Practise it
1. Pick a product you know and a new market it could enter.
2. Write two or three bullets for each area of the evaluation framework.
3. Design a 3-step test plan with decision points, and present it **out loud in 6 minutes**.

## How do you retire (sunset) a feature?
- id: po-product-sense-25
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: sunsetting, deprecation, product hygiene, communication

### Prompt
How do you decide to remove a feature from your product, and how do you do it without upsetting customers?

### Answer
#### What the interviewer is really testing
- Whether you understand that **removing features is part of good product management**.
- Your **decision-making** with data (usage, cost, strategy).
- Your **empathy and communication** with affected users.
- Your **planning** of a safe, staged removal.

#### Key points
- Every feature has ongoing **costs**: maintenance, complexity, support, slower development, a more confusing product.
- Reasons to remove: **low usage**, **high cost**, **doesn't fit strategy**, **better alternative exists**, **security or compliance risk**.
- **Understand who uses it and why** before deciding.
- **Communicate early and clearly**, offer **alternatives or migration**, and give **enough notice**.
- **Phase it out** (hide from new users → read-only → removal), and **monitor** feedback.

#### Model answer
"Removing features is an important part of product management. Every feature we keep has ongoing costs, even if nobody uses it: maintenance, bugs, support, testing, and a more complicated product for everyone else.

**1. Decide with evidence.** I'd look at:
- **Usage**: how many users use it, how often, and which segments? E.g. our legacy 'PDF report builder' used by 2% of accounts monthly.
- **Cost**: engineering time on maintenance and bugs, infrastructure, support tickets, and how it slows down other work.
- **Strategy**: does it fit where we're taking the product?
- **Alternatives**: is there a better way to meet the same need, e.g. our newer dashboard export?

**2. Understand the users who rely on it.** Even a small group can include important customers. I'd talk to some of them: what do they use it for, and would the alternative work? This can reveal gaps we need to fill first.

**3. Plan the removal:**
- **Stage 1**: stop showing it to **new users**.
- **Stage 2**: **announce** the change to existing users with plenty of notice (e.g. 90 days for B2B), explaining why and what the alternative is.
- **Stage 3**: help users **migrate**: guides, tools to move their data, and personal outreach to high-value customers.
- **Stage 4**: make it **read-only**, or show reminders as the date approaches.
- **Stage 5**: **remove** it and clean up the code.

**4. Communicate well:**
- Be honest about **why**: 'so we can focus on improving exports, which most of you use.'
- Show the **benefit** to them: a better alternative, a simpler product.
- Give **clear dates** and **help**.
- Brief **support and account managers** in advance.

**5. Monitor.** Track support contacts, complaints, churn among affected users, and adoption of the alternative. Be ready to extend timelines for customers who need more time.

**Example.** We retired the old PDF report builder after improving dashboard exports to cover the most common report types. Of 300 affected accounts, 85% moved to the new exports within the notice period. We helped the largest 20 accounts personally, and churn among affected accounts was no higher than normal. Removing the old code also cut our test suite run time noticeably."

#### Another worked example: removing a feature for compliance
"A legacy feature stored customer documents in a way that didn't meet new security standards.
- **Decision**: required, not optional.
- **Plan**: a shorter timeline, with a secure replacement built first, automatic migration where possible, and clear communication explaining the security reason.
- **Lesson**: even with a fixed reason, empathy and support during the change matter."

#### Feature retirement checklist
| Step | Key actions |
|---|---|
| Evidence | Usage, cost, strategy, alternatives |
| Users | Talk to those affected; find gaps |
| Plan | Hide → announce → migrate → read-only → remove |
| Communicate | Why, benefit, dates, help |
| Internal | Brief support, sales, account managers |
| Monitor | Complaints, churn, alternative adoption |
| Clean up | Remove code, docs and dependencies |

#### Step-by-step framework
1. **Evidence**: usage, cost, strategy, alternatives.
2. **Understand affected users.**
3. **Staged plan** with enough notice.
4. **Clear, empathetic communication.**
5. **Migration help.**
6. **Monitor and adjust.**
7. **Clean up** fully.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Just remove it if few people use it." | Considers who uses it and why |
| Removes it overnight | Staged removal with notice |
| No alternative offered | Migration path and help |
| Support not informed | Internal teams briefed in advance |
| Doesn't measure impact | Monitors churn and feedback |

#### Useful phrases
- "Every feature has ongoing costs, even unused ones."
- "Before deciding, I'd talk to the people who rely on it."
- "We'll give plenty of notice and help everyone move to the alternative."
- "Removing it lets us focus on what most customers use."

#### Common pitfalls
- **Never removing anything**, leading to a bloated product.
- **Removing features abruptly.**
- **Ignoring high-value customers** who rely on it.
- **Poor communication** that feels like a loss without explanation.
- **Not cleaning up** the code afterwards.

#### Follow-ups to expect (with sample answers)
- **"What if a big customer refuses?"**
  "Understand their specific needs, see if the alternative can be adapted, offer extra time or support, and make a commercial decision if necessary, but avoid indefinitely maintaining a feature for one customer."
- **"How much notice should you give?"**
  "It depends on how critical the feature is. Weeks for minor consumer features, months for business-critical B2B features or APIs."
- **"How do you prevent features becoming unused in the first place?"**
  "Validate demand before building, measure adoption after launch, and review low-usage features regularly."

#### What senior interviewers look for
- **Product hygiene** as an ongoing practice.
- Balancing **customer impact and long-term product health**.
- Clear **communication strategies** for difficult changes.

#### Practise it
1. Identify a feature in a product you know that you'd remove, and write the evidence you'd need.
2. Write the announcement message (under 150 words) to affected users.
3. Explain your plan **out loud in 4 minutes**.

## How do you approach a take-home product case study?
- id: po-product-sense-26
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: case study, take-home, presentation, interview preparation

### Prompt
Many Product Owner interviews include a take-home case study or a presentation exercise. How would you approach one?

### Answer
#### What the interviewer is really testing
- Your **end-to-end product thinking** on a realistic problem.
- **Structure and clarity**: can you present a convincing, logical story?
- **Prioritisation** and **trade-offs** under time constraints.
- How you handle **questions and challenges** on your work.

#### Key points
- **Read the brief carefully**: what exactly are they asking for, and how will it be assessed?
- **Clarify** if anything is unclear, and **state assumptions** clearly.
- Follow a **clear structure**: problem → users → insights → prioritised opportunities → solution → MVP → metrics → roadmap → risks.
- **Focus beats breadth**: go deep on one or two ideas.
- **Time-box** your work (respect the suggested time).
- Make it **visual and concise**: slides or a short document.
- **Practise presenting** and prepare for challenging questions.

#### Model answer
"I'd approach it in five stages.

**1. Understand the brief (and ask questions).**
- What's the exact task? E.g. 'Our food delivery app has declining repeat orders among students. Propose how to improve it, in a 20-minute presentation.'
- How much time should it take? If they say 4 hours, I respect that. Going far over can look like poor prioritisation.
- I'd email any clarifying questions, e.g. available data, constraints, audience. If I can't get answers, I state my assumptions explicitly in the presentation.

**2. Research and gather insight.**
- Use the product (or similar products) myself.
- Read reviews and public information.
- If possible, talk to a few people in the target group (e.g. two or three students) for quick insights. This makes the case much stronger.
- Use any data provided, and analyse it carefully.

**3. Structure the thinking.** A strong structure:
1. **Context and goal**: the problem and why it matters (with numbers).
2. **Users**: who they are, and their key needs or jobs.
3. **Insights**: what I learned from data and research.
4. **Opportunities**: 3–5 options, and how I prioritised them (e.g. impact, confidence, effort).
5. **Proposed solution**: the top one or two ideas in detail.
6. **MVP and validation**: what we'd build first, and how we'd test it.
7. **Metrics**: primary, supporting and guardrails.
8. **Roadmap**: Now / Next / Later.
9. **Risks and open questions.**

**4. Create a clear presentation.**
- **10–12 slides** for a 20-minute slot, with one key message per slide.
- Lead with the **recommendation** early (executive summary), then support it.
- Use simple **visuals**: a funnel, a user journey, a prioritisation matrix, wireframe sketches.
- Avoid dense text.

**5. Practise and prepare for questions.**
- Rehearse with a timer, leaving at least 5–10 minutes for questions.
- Anticipate challenges: 'Why not option B?', 'What if the test fails?', 'How would engineering feel about this?', 'What would you cut if you had half the time?'
- When challenged, stay open: 'That's a good point. If that's true, I'd adjust by…'

**During the presentation**, I'd show my reasoning, not just conclusions, and be honest about assumptions and limitations. Interviewers care more about **how you think** than about having the 'right' answer."

#### Another worked example: a live case exercise
"Some interviews give a case **live**, e.g. 'You have 30 minutes to plan, then present.'
- Spend the first 5 minutes clarifying the goal and constraints.
- Use a simple structure on a whiteboard or paper: problem, users, options, choice, MVP, metrics.
- Talk through your reasoning out loud.
- Pick one option and go deep rather than covering everything superficially."

#### Case study structure
| Section | Purpose |
|---|---|
| Executive summary | Your recommendation up front |
| Context and goal | Why this matters |
| Users and insights | Evidence-based understanding |
| Opportunities and prioritisation | Show judgement |
| Solution and MVP | Concrete proposal |
| Metrics | How you'll know it worked |
| Roadmap | What comes next |
| Risks and assumptions | Honesty and maturity |

#### Step-by-step framework
1. **Understand the brief** and assessment criteria; ask questions.
2. **Research**: use the product, read reviews, talk to users.
3. **Structure** your thinking.
4. **Focus** on one or two ideas in depth.
5. **Create** a clear, visual presentation.
6. **Rehearse** and prepare for questions.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| 40 dense slides | 10–12 clear slides with one message each |
| Ten shallow ideas | One or two ideas in depth, with reasoning |
| Hidden assumptions | Assumptions stated clearly |
| No metrics | Metrics and validation plan |
| Defensive when challenged | Open, adapts thinking |

#### Useful phrases
- "My recommendation is… and here's how I got there."
- "I made a few assumptions, which I'll call out as I go."
- "I prioritised this option because it has the highest expected impact for the effort."
- "If that assumption turned out to be wrong, I'd adjust by…"

#### Common pitfalls
- **Not answering the actual question** in the brief.
- **Spending far too long**, or far too little.
- **Too many ideas**, none developed.
- **Solution first**, without problem and users.
- **Running out of time** in the presentation.
- **Getting defensive** during questions.

#### Follow-ups to expect (with sample answers)
- **"What would you do with half the time or team?"**
  "Focus on the MVP of the top idea, drop the secondary idea, and use a manual or concierge version to test demand."
- **"Why not option B?"**
  "It has potential, but lower confidence and higher effort. I'd revisit it if the MVP results showed the main idea didn't work."
- **"How would you work with engineering on this?"**
  "Involve them early to validate feasibility, explore cheaper technical approaches, and estimate effort before committing to the roadmap."

#### What senior interviewers look for
- **Strategic framing** and business impact.
- **Executive communication**: clear recommendation, concise story.
- **Handling challenge** with confidence and openness.

#### Practise it
1. Practise with a sample brief: "A meditation app wants to increase the share of free users who convert to paid. Propose a strategy in 15 minutes."
2. Spend a maximum of 3 hours, and create no more than 10 slides.
3. Present it to a friend and ask them to challenge you with three tough questions.
