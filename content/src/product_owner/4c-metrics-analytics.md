# Product Owner — Metrics & Analytics (continued)

## Correlation versus causation
- id: po-metrics-13
- round: METRICS_ANALYTICS
- difficulty: medium
- levels:
- tags: causation, correlation, data analysis, experiments

### Prompt
A stakeholder shows you data: users who use feature X retain twice as well, so they want to force every new user through feature X. How do you respond?

### Answer
#### What the interviewer is really testing
- Whether you understand the difference between **correlation** and **causation**.
- Whether you can spot **selection bias** and **confounding factors**.
- Whether you know how to **establish causation** (experiments).
- How you **challenge a stakeholder** constructively, without dismissing their insight.

#### Key points
- **Correlation**: two things move together. **Causation**: one actually causes the other.
- Users who adopt a feature are often **already more engaged or motivated**: that's **selection bias**. They might retain better regardless of the feature.
- **Confounding factors**: a third factor causes both (e.g. company size drives both feature usage and retention).
- **Reverse causation**: retained users discover more features over time, rather than the feature causing retention.
- To establish causation: **randomised experiments (A/B tests)**. When those aren't possible: **natural experiments**, **staggered rollouts**, **matched comparisons**, and controlling for known factors. All of these are weaker than a proper randomised test.
- Treat correlations as **promising hypotheses**, not conclusions.

#### Model answer
"I'd start by acknowledging it's an interesting finding and worth exploring, but I'd explain that it doesn't yet show that feature X **causes** better retention.

**Why the correlation might be misleading:**
1. **Selection bias.** The users who choose to use feature X might already be more motivated or engaged. They'd probably retain better anyway. For example, in an invoicing app, users who set up **automatic payment reminders** might be busier businesses with more invoices, who retain better for that reason.
2. **Confounding factors.** A third factor could drive both. Larger businesses might use reminders more *and* retain better because invoicing is more central to their work.
3. **Reverse causation.** People who stay longer have more time to discover and use features. Retention might cause feature usage, not the other way round.

**What forcing it on everyone could do.** If the feature isn't actually the cause, forcing every new user through it adds friction to onboarding, which could **reduce** activation. And users who don't need it might find it confusing.

**How I'd test it properly:**
- **A/B test**: randomly assign new users to two groups. One gets a prompt or guided setup encouraging feature X; the control doesn't. Because assignment is random, both groups have similar motivation and business size on average. If the treatment group retains better, we have much stronger evidence of causation.
- **Measure**: primary metric 30- or 60-day retention; secondary: adoption of feature X, onboarding completion; guardrail: activation rate (to check the prompt doesn't add damaging friction).

**If an A/B test isn't possible:**
- **Compare similar users** (matching on business size, invoice volume, sign-up channel) who did and didn't use the feature.
- Look for **natural experiments**, e.g. when the feature launched, did retention change for comparable cohorts?
- Treat conclusions as weaker evidence.

**How I'd say it to the stakeholder:**
> 'This is a really promising signal, and it might well be true. Before we force it on everyone, let's run a quick test where half of new users are encouraged to use it. If retention improves, we'll roll it out confidently. If not, we've avoided adding friction to onboarding.'

**Example result.** We ran exactly this test. The group encouraged to set up reminders did retain better, but by about 8%, not the 100% the raw correlation suggested. It was still worth rolling out as a prompt, but making it mandatory would have been unjustified, and the smaller effect reset expectations about its business impact."

#### Another worked example: a famous kind of trap
"A team noticed users who **connected a mobile app** were much more active and concluded pushing everyone to download the app would boost engagement. A test showed only a small effect: the most engaged users had simply been the ones who chose to download it. The real driver of engagement turned out to be receiving regular, useful notifications, which the team then focused on."

#### More examples of correlation without causation
| Observation | Possible hidden explanation |
|---|---|
| Users with profile photos retain better | More committed users add photos |
| Customers who contact support churn more | They had problems in the first place |
| Feature users spend more | Big spenders explore more features |
| Ice cream sales and sunburn rise together | Hot weather causes both |

#### Ways to establish causation (strongest to weakest)
| Method | Strength | Notes |
|---|---|---|
| Randomised A/B test | Strongest | Random assignment balances hidden factors |
| Staggered rollout | Strong | Compare regions or periods with and without |
| Natural experiment | Moderate | Use an external change as a comparison |
| Matched comparison | Moderate | Control for known factors only |
| Raw correlation | Weak | Hypothesis only |

#### Step-by-step framework
1. **Acknowledge** the finding.
2. **Explain alternatives**: selection bias, confounders, reverse causation.
3. **Highlight risks** of acting on correlation alone.
4. **Propose a test** (ideally randomised).
5. **Define metrics** and guardrails.
6. **Decide** based on the result.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Great, let's force it." | Recognises correlation isn't causation |
| "Correlation is meaningless." | Treats it as a promising hypothesis |
| No alternative explanations | Explains selection bias, confounders and reverse causation |
| No plan | Proposes an A/B test with metrics and guardrails |
| Dismisses the stakeholder | Responds constructively |

#### Useful phrases
- "That's a promising signal. Let's test whether the feature actually causes it."
- "Users who choose this feature may already be more engaged."
- "A randomised test balances hidden factors between the groups."
- "If it works, we'll roll it out with confidence."

#### Common pitfalls
- **Acting on correlations** without testing.
- **Dismissing data** instead of exploring it.
- **Ignoring selection bias** in "users who do X" analyses.
- **Forcing behaviour** that adds friction.

#### Follow-ups to expect (with sample answers)
- **"What if the test is inconclusive?"**
  "Check sample size and how many users actually adopted the feature in the treatment group. Consider a stronger intervention or a longer test before concluding."
- **"Can you ever act on correlation alone?"**
  "For low-risk, easily reversible changes, sometimes yes, while monitoring results. For big or risky changes, test first."
- **"What's a confounding variable?"**
  "A third factor that influences both things you're measuring, making them look related when one doesn't cause the other."

#### What senior interviewers look for
- **Statistical literacy** applied to business decisions.
- Building an **experimentation culture**.
- **Influencing stakeholders** with evidence rather than authority.

#### Practise it
1. Write three "users who do X retain better" claims from products you know, and list a hidden explanation for each.
2. Design an A/B test for one of them, with primary metric and guardrail.
3. Practise explaining correlation versus causation to a non-technical stakeholder **in 2 minutes**.

## What would you put on your product dashboard?
- id: po-metrics-14
- round: METRICS_ANALYTICS
- difficulty: medium
- levels:
- tags: dashboards, monitoring, metrics, reporting

### Prompt
If you were setting up a dashboard for your product, what would you include, and how would you use it?

### Answer
#### What the interviewer is really testing
- Whether you know **which metrics matter** and avoid clutter.
- Whether you structure metrics into a **hierarchy** (North Star → inputs → health).
- Whether the dashboard **drives action**, not just reporting.
- Awareness of **audience** and **cadence**.

#### Key points
- Start with the **North Star metric** and the team's **OKRs**.
- Include **input metrics** the team can influence (funnel stages, adoption, engagement).
- Include **health and guardrail** metrics: performance, errors, reliability, support volume.
- Include **segmentation** and **trends over time**, with targets or benchmarks.
- Keep it **focused**: if a metric never changes a decision, remove it.
- Different **audiences** need different views (team, leadership).
- Review on a **regular cadence**, with alerts for critical metrics.

#### Model answer
"I'd design the dashboard around decisions: every metric should help us notice something and act on it.

**Example: an invoicing product dashboard**

**1. North Star (top of the page):**
- **Weekly active businesses sending invoices**, with trend and target.

**2. Current OKR key results:**
- Median days to payment (target: from 34 to 28).
- % of active customers using payment reminders (target: 25%).

**3. Funnel and input metrics (AARRR):**
- **Acquisition**: sign-ups by channel.
- **Activation**: % of sign-ups sending a first invoice within 7 days.
- **Retention**: month-1 and month-3 retention by cohort.
- **Revenue**: trial-to-paid conversion, revenue per account, churn.
- **Referral**: invites sent, referral sign-ups.

**4. Feature adoption and engagement:**
- Adoption and usage of key features (reminders, payment links, mobile app).

**5. Health and guardrails:**
- **Reliability**: uptime, error rates, invoice email delivery rate.
- **Performance**: page load times.
- **Support**: tickets per 1,000 active users, top ticket themes.
- **Customer sentiment**: NPS or CSAT trend.

**Design principles:**
- **Trends over time**, not just today's number, with targets.
- **Segmentation**: by plan, platform, country, new versus existing.
- **Focus**: around 10–15 key metrics on the main view. Details in drill-downs.
- **Clear definitions**: everyone agrees what 'active' means.

**How I'd use it:**
- **Weekly** team review (15 minutes): what moved, why, and what we'll do.
- **Monthly** stakeholder update: OKR progress and key trends.
- **Alerts** for critical metrics (e.g. payment success drops, error spikes) so we don't wait for a weekly review.
- **After launches**: a feature-specific view to track adoption and impact.

**Example.** In a weekly review, we noticed the month-1 retention line for mobile sign-ups dropping. Drilling in revealed an issue with mobile onboarding introduced in a recent release. We fixed it within a week, before it affected many more cohorts."

#### Another worked example: a leadership dashboard
"For executives, I'd show a one-page view: North Star trend, OKR progress (on track / at risk), revenue and churn, and two or three key risks. Executives need direction and exceptions, not 40 charts."

#### Dashboard structure
| Section | Examples |
|---|---|
| North Star | Weekly active businesses sending invoices |
| OKR key results | Days to payment; reminder adoption |
| Funnel (AARRR) | Sign-ups, activation, retention, conversion |
| Feature adoption | Use of key features |
| Health and guardrails | Uptime, errors, load time, support volume, NPS |

#### A third worked example: a dashboard that drove a decision
"Our weekly dashboard included 'support tickets per 1,000 active users'. One week, it jumped from 8 to 14.
- **Drill-down**: most new tickets were about invoices failing to send on one email provider.
- **Action**: engineering fixed an issue with our email configuration within a day, and we added an alert for invoice delivery failures.
- **Lesson**: health metrics on the dashboard caught a problem that customers felt before our feature metrics showed anything."

#### Anti-patterns to avoid
- **Vanity walls**: big numbers that only go up.
- **Unowned metrics**: nobody responsible for investigating changes.
- **Dashboard sprawl**: many dashboards with conflicting definitions.
- **No targets**: numbers without context of what good looks like.

#### Step-by-step framework
1. **Start with the North Star** and OKRs.
2. **Add input and funnel metrics.**
3. **Add health and guardrails.**
4. **Show trends, targets and segments.**
5. **Keep it focused** and clearly defined.
6. **Set a review cadence** and alerts.
7. **Tailor views** to audiences.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| 50 charts of everything | Focused hierarchy of metrics |
| Vanity metrics (total users) | North Star, inputs and health |
| Snapshots only | Trends, targets and segments |
| Built and forgotten | Regular reviews and alerts |
| One view for all | Views tailored to team and leadership |

#### Useful phrases
- "Every metric on the dashboard should help us make a decision."
- "The North Star is at the top, with the inputs that drive it below."
- "We review it weekly as a team, and alerts catch urgent problems in between."
- "If a metric never changes what we do, it comes off the dashboard."

#### Common pitfalls
- **Too many metrics**, so nothing stands out.
- **Vanity metrics.**
- **Undefined or inconsistent definitions.**
- **No regular review**, so the dashboard is ignored.
- **No alerts** for critical issues.

#### Follow-ups to expect (with sample answers)
- **"What tools would you use?"**
  "Product analytics tools like Amplitude or Mixpanel for behaviour, BI tools like Looker or Tableau for business data, and monitoring tools for reliability. The tool matters less than clear definitions and regular use."
- **"How do you make sure the data is trustworthy?"**
  "Agreed definitions, data quality checks, comparing against source systems, and an owner for each metric."
- **"What if the team ignores the dashboard?"**
  "Build it into routines: a weekly review, sprint reviews and OKR check-ins, and make sure it answers questions the team actually cares about."

- **"How do you choose which 10–15 metrics to show?"**
  "Start from the North Star and current OKRs, add the inputs that drive them, add critical health metrics, and remove anything that hasn't informed a decision in the last few months."
- **"Who should own the dashboard?"**
  "The PO owns what's on it and how it's used; data or analytics teams help with definitions and data quality."

#### What senior interviewers look for
- **Metric hierarchies** across teams and products.
- **Data governance**: definitions, ownership, quality.
- Dashboards that drive **decisions and accountability**.

#### Practise it
1. Sketch a dashboard for a product you know: North Star, 2 OKR metrics, 5 funnel metrics, 4 health metrics.
2. Write one decision each metric could trigger.
3. Explain your dashboard **out loud in 3 minutes**.

## Estimation question: market sizing
- id: po-metrics-15
- round: METRICS_ANALYTICS
- difficulty: medium
- levels:
- tags: market sizing, estimation, guesstimate, TAM SAM SOM

### Prompt
Estimate the market size for a meal-planning app for families in the UK.

### Answer
#### What the interviewer is really testing
- **Structured thinking** under uncertainty.
- Whether you can **break a big question into estimable parts**.
- Comfort with **assumptions and rough numbers**.
- **Sense-checking** results and explaining the reasoning.

#### Key points
- There's **no single right answer**: the interviewer cares about your **approach**.
- **Clarify**: what exactly are we sizing (users, revenue, annual)? Which market?
- Choose **top-down** (start from a big population and narrow) or **bottom-up** (build up from units and prices), ideally both.
- Use **round numbers** and **state assumptions** clearly.
- Know **TAM / SAM / SOM**: total addressable market, serviceable available market, serviceable obtainable market.
- **Sense-check** the result and discuss what would change it.

#### Model answer
"Let me clarify first: I'll estimate the **annual revenue** opportunity for a **paid meal-planning app** for **families in the UK**. I'll use round numbers and state my assumptions as I go.

**Top-down approach:**
1. **UK population**: about 67 million.
2. **Households**: roughly 28 million.
3. **Households with children**: let's say about 30% → **~8.5 million** family households.
4. **Interested in meal planning**: families who cook regularly and want help planning. I'll assume about 40% → **~3.4 million**.
5. **Willing to pay for an app**: most will use free tools or nothing. I'll assume about 10% of interested families would consider paying → **~340,000** households.
6. **Price**: around £5 a month, or **£60 a year**.

**Serviceable market** ≈ 340,000 × £60 ≈ **£20 million a year**.

**TAM / SAM / SOM:**
- **TAM** (if every family household paid): 8.5 million × £60 ≈ **£510 million**. A theoretical ceiling.
- **SAM** (families interested and willing to pay): ≈ **£20 million**.
- **SOM** (what we could realistically capture in a few years, say 10–20% of SAM): ≈ **£2–4 million a year**.

**Bottom-up sense check:**
- Imagine we acquire users mainly through paid social and partnerships, reaching about 5,000 new paying families a month after a year, with 70% annual retention. After three years, that might be 100,000+ paying families at £60, around £6 million, broadly consistent with the upper end of SOM. It also tells me acquisition cost will be a key factor.

**What would change the estimate:**
- **Partnerships**: bundling with a supermarket could change pricing and reach dramatically (e.g. free for customers, with the supermarket paying).
- **Revenue model**: if the app earns commission on grocery orders instead of subscriptions, the market looks very different: UK family grocery spend is enormous, and even a small share of commission could be worth more than subscriptions.
- **Competition** from free recipe apps and supermarket tools.

**Conclusion:** as a standalone subscription app, the realistic opportunity is a few million pounds a year. The bigger opportunity might be a **grocery-commission or partnership model**, which I'd explore further."

#### Another worked example: a quick bottom-up estimate
"How many coffees are sold in London each day?
- London population ≈ 9 million; adults ≈ 7 million.
- Share who buy coffee out on a typical day ≈ 30% → 2.1 million.
- Average coffees per buyer ≈ 1.5 → ≈ **3 million**.
- Add commuters and tourists → **roughly 3–4 million a day**.
- Sense check: thousands of coffee shops × several hundred coffees each per day lands in a similar range."

#### TAM / SAM / SOM
| Term | Meaning | Example (meal planning) |
|---|---|---|
| TAM | Total addressable market | All UK family households × price ≈ £510m |
| SAM | Serviceable available market | Interested and willing to pay ≈ £20m |
| SOM | Serviceable obtainable market | Realistic share in a few years ≈ £2–4m |

#### Step-by-step framework
1. **Clarify** what's being sized.
2. **Choose an approach**: top-down, bottom-up, or both.
3. **Break it into steps** with clear assumptions.
4. **Use round numbers** and calculate.
5. **Define TAM / SAM / SOM** if relevant.
6. **Sense-check** with a second approach.
7. **Discuss** what would change the answer, and implications.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Guesses a number | Breaks the problem into logical steps |
| Hidden assumptions | States every assumption clearly |
| Precise-looking numbers | Round numbers and ranges |
| No sense check | Cross-checks with a second approach |
| Stops at the number | Discusses implications and alternative models |

#### Useful phrases
- "Let me clarify what we're sizing first."
- "I'll use round numbers and state my assumptions."
- "As a sense check, let me try it bottom-up."
- "The biggest uncertainty is the share willing to pay."
- "This suggests the bigger opportunity might be a different revenue model."

#### Common pitfalls
- **Not clarifying** the question.
- **Silent calculation**: the interviewer can't follow.
- **Over-precision.**
- **No sense check.**
- **Panicking** about not knowing exact figures. Reasonable assumptions are fine.

#### Follow-ups to expect (with sample answers)
- **"What's your least confident assumption?"**
  "The 10% willing to pay. I'd test it with a landing page and pricing survey."
- **"How would you size it differently for a B2B product?"**
  "Start from the number of target businesses, segment by size, and multiply by realistic contract values."
- **"What if the interviewer gives you a wrong number?"**
  "Use it if asked, or politely note your different assumption, explaining why. They're testing reasoning, not trivia."

#### What senior interviewers look for
- **Business judgement** about which model and market matter.
- **Linking sizing to strategy** (e.g. choosing a revenue model).
- Comfort presenting **uncertainty**.

#### Practise it
1. Estimate: "How many electric vehicle chargers does the UK need by 2030?" (top-down and bottom-up).
2. Estimate the market for a dog-walking app in your city, with TAM, SAM and SOM.
3. Practise each **out loud in 5 minutes**, explaining every step.

## Unit economics: CAC, LTV, churn and payback
- id: po-metrics-16
- round: METRICS_ANALYTICS
- difficulty: hard
- levels:
- tags: unit economics, CAC, LTV, churn, business model

### Prompt
Explain customer acquisition cost, lifetime value and payback period. Why should a Product Owner understand unit economics?

### Answer
#### What the interviewer is really testing
- **Business literacy**: do you understand how the product makes money sustainably?
- Ability to **calculate and interpret** key metrics.
- Understanding how **product decisions affect** unit economics.
- Whether you think beyond features to **business health**.

#### Key points
- **CAC (customer acquisition cost)**: total sales and marketing spend ÷ new customers acquired.
- **LTV (lifetime value)**: the gross profit a customer generates over their lifetime. A simple version: (average revenue per customer per month × gross margin) ÷ monthly churn rate.
- **Churn**: the share of customers who leave in a period. Lifetime ≈ 1 ÷ churn rate (e.g. 4% monthly churn ≈ 25 months).
- **LTV:CAC ratio**: a common rule of thumb is **3:1 or better** for a healthy subscription business.
- **CAC payback period**: months to recover CAC from gross profit (often targeted under about 12–18 months, depending on the business).
- Product drives unit economics: **activation, retention, pricing, expansion, referrals, cost to serve**.

#### Model answer
"Unit economics tell us whether we make money on each customer, and whether growth is sustainable.

**Key definitions, with an example subscription product:**
- **ARPA (average revenue per account)**: £20 a month.
- **Gross margin**: 80% (after hosting, payment fees and support costs) → £16 gross profit per month.
- **Monthly churn**: 4% → average lifetime ≈ 1 ÷ 0.04 = **25 months**.
- **LTV** ≈ £16 × 25 = **£400**.
- **CAC**: £200,000 a month on sales and marketing ÷ 1,000 new customers = **£200**.
- **LTV:CAC** = 400 ÷ 200 = **2:1**. Below the common 3:1 benchmark.
- **CAC payback** = £200 ÷ £16 a month ≈ **12.5 months**.

**What this tells us:** each customer is profitable over their lifetime, but not by a large margin, and it takes about a year to recover acquisition costs. Growth would require lots of cash up front.

**Why a Product Owner should care:** most of these levers are product levers.
- **Retention**: reducing churn from 4% to 3% raises lifetime to about 33 months and LTV to about £533, making LTV:CAC roughly 2.7:1.
- **Activation and conversion**: improving trial-to-paid conversion lowers CAC (more customers from the same spend).
- **Pricing and packaging**: higher ARPA through better plans or add-ons.
- **Expansion**: upsells and more seats increase revenue per customer over time.
- **Referrals and virality**: lower CAC through organic growth.
- **Cost to serve**: self-service features that reduce support costs improve gross margin.

**How it shapes decisions.** If our biggest weakness is churn, retention work may create more value than new acquisition features. When choosing between roadmap items, I can estimate their effect on these numbers.

**Example.** We found customers who used two key features in their first month churned at half the rate of others. Improving onboarding to drive that behaviour reduced overall churn from 4.2% to 3.5% over two quarters, raising estimated LTV by around 20%, which allowed marketing to spend more on acquisition profitably."

#### Another worked example: marketplace unit economics
"For a food delivery order:
- Average order: £25. Commission (say 25%) + delivery fee (£2.50) = £8.75 revenue.
- Costs: rider pay ≈ £4.50, payment fees ≈ £0.50, support and refunds ≈ £0.75 → **contribution margin ≈ £3 per order**.
- Product levers: increase order frequency, reduce refunds through better accuracy, improve batching (one rider, two orders) to reduce delivery cost per order.
- Unit economics per order can matter as much as per customer in marketplaces."

#### Unit economics cheat sheet
| Metric | Formula (simplified) | Example |
|---|---|---|
| CAC | Sales & marketing spend ÷ new customers | £200 |
| ARPA | Revenue ÷ accounts | £20/month |
| Gross margin | (Revenue − cost of service) ÷ revenue | 80% |
| Lifetime | 1 ÷ monthly churn | 25 months |
| LTV | ARPA × margin × lifetime | £400 |
| LTV:CAC | LTV ÷ CAC | 2:1 |
| Payback | CAC ÷ monthly gross profit per customer | ~12.5 months |

#### Step-by-step framework
1. **Define** CAC, LTV, churn and payback.
2. **Calculate** with an example.
3. **Interpret** against benchmarks.
4. **Link** product levers to each metric.
5. **Use** in prioritisation.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "LTV is how much customers pay." | Correct definitions including margin and churn |
| No numbers | Worked example with interpretation |
| "That's finance's job." | Shows how product drives each metric |
| No benchmarks | Mentions LTV:CAC and payback rules of thumb |

#### Useful phrases
- "Reducing churn from 4% to 3% increases lifetime value by about a third."
- "Our LTV:CAC is around 2:1, so improving retention or conversion is a priority."
- "Most unit economics levers are product levers."
- "Self-service features improve margin by reducing support costs."

#### Common pitfalls
- **Using revenue instead of gross profit** for LTV.
- **Ignoring churn's huge effect** on LTV.
- **Treating rules of thumb as laws**: benchmarks vary by business model.
- **Not connecting** unit economics to product decisions.

#### Follow-ups to expect (with sample answers)
- **"What's net revenue retention?"**
  "Revenue from an existing customer cohort after a period, including expansion, downgrades and churn. Above 100% means existing customers grow revenue even after churn."
- **"Why might LTV be misleading for a new product?"**
  "Little data on long-term churn, so lifetime estimates are uncertain. Use conservative assumptions and cohort data as it builds up."
- **"How would you reduce CAC?"**
  "Improve conversion through the funnel, invest in organic channels and referrals, and target the segments that convert best."

#### What senior interviewers look for
- **Financial fluency** in product strategy.
- Prioritising work by **economic impact**.
- Partnering with **finance and marketing** on growth.

#### Practise it
1. Calculate LTV, LTV:CAC and payback for: ARPA £30, margin 75%, monthly churn 5%, CAC £250. (Answers: LTV £450, ratio 1.8:1, payback ≈ 11 months.)
2. List three product changes that would improve the ratio.
3. Explain unit economics **out loud in 3 minutes**.

## Data-informed versus data-driven: when do you trust judgement?
- id: po-metrics-17
- round: METRICS_ANALYTICS
- difficulty: medium
- levels:
- tags: decision making, judgement, data-informed, intuition

### Prompt
Would you describe yourself as data-driven? When do you rely on data, and when do you rely on judgement or intuition?

### Answer
#### What the interviewer is really testing
- **Mature decision-making**: balancing evidence with judgement.
- Awareness of **data's limits**.
- Ability to make decisions **under uncertainty**.
- Whether you can explain **how** you combine inputs.

#### Key points
- **Data-driven**: decisions led by data. Risk: data can be incomplete, backward-looking, or measure the wrong thing.
- **Data-informed**: data is a key input, combined with **customer insight, strategy, experience and judgement**.
- Data is **strongest** for optimisation (incremental changes with measurable outcomes) and **weakest** for new, unprecedented or long-term bets.
- Use **judgement** when data is unavailable, ambiguous, or when values and strategy matter (e.g. ethics, brand).
- Be **explicit** about assumptions and **test** where possible.
- Match the **amount of evidence to the size and reversibility** of the decision (one-way versus two-way doors, a concept popularised by Amazon).

#### Model answer
"I'd describe myself as **data-informed**. Data is one of the most important inputs to my decisions, but not the only one.

**Where data leads:**
- **Optimisation**: improving conversion, onboarding, pricing pages. Clear metrics and A/B tests make data very reliable here.
- **Diagnosing problems**: funnels, cohorts and segments show where things go wrong.
- **Sizing opportunities**: how many users experience a problem.

**Where judgement plays a bigger role:**
- **New products or markets**: there's no historical data for something that doesn't exist yet. I rely more on customer research, market understanding and strategic judgement.
- **Long-term bets**: short-term metrics may not capture long-term value (e.g. investing in trust or brand).
- **Ethics and values**: data might show that a dark pattern increases conversion, but it's the wrong thing to do for customers and for long-term trust.
- **Ambiguous or conflicting data**: when metrics point in different directions, judgement weighs them against strategy.

**How I combine them:**
1. **Gather the best evidence available**: data, research, customer feedback, expert input.
2. **Be explicit about uncertainty** and assumptions.
3. **Match rigour to risk**: for **two-way-door** decisions (easily reversible), decide quickly and learn from results. For **one-way-door** decisions (hard to reverse, e.g. a platform rewrite or entering a market), invest more in evidence.
4. **Test where possible**, even with judgement-led decisions: small experiments reduce risk.
5. **Review outcomes** and learn: was my judgement right? This improves future judgement.

**Example.** Data showed that a confirmation step in our payment flow reduced completion by 3%. Purely data-driven, we'd remove it. But research and support data showed the step prevented costly mistakes (sending money to the wrong account) that damaged trust and created expensive support cases. We redesigned the step to be faster rather than removing it. Completion recovered most of the drop, and mistaken payments stayed low."

#### Another worked example: judgement without data
"When deciding whether to support a new country, there was no usage data. We combined market research, interviews with prospective customers, competitor analysis and a small waitlist test. Judgement filled the gaps, but we structured it with explicit assumptions and decision points."

#### When to lean on data versus judgement
| Situation | Lean on | Why |
|---|---|---|
| Optimising a funnel | Data | Clear metrics; testable |
| Diagnosing a metric drop | Data | Segmentation reveals causes |
| New product or market | Judgement + research | No historical data |
| Ethical choices | Values and judgement | Data can't decide what's right |
| Easily reversible decision | Speed + learning | Low cost of being wrong |
| Hard-to-reverse decision | More evidence | High cost of being wrong |

#### A third worked example: speed over certainty
"We wanted to test whether changing the wording on our upgrade button increased upgrades. A data analyst suggested a 4-week A/B test.
- **Assessment**: low risk, easily reversible, and we had other experiments queued.
- **Decision**: run a short test for one week with a pre-agreed decision rule, accepting a bit more uncertainty, because a wrong decision was cheap to reverse.
- **Result**: a clear improvement appeared; we shipped it and moved on, freeing the experiment slot for a higher-stakes pricing test where we did run a full, carefully powered experiment."

#### Questions to ask before a decision
- How **reversible** is it?
- What's the **cost of being wrong**?
- What **evidence** do we have, and how strong is it?
- What's the **cost of waiting** for more evidence?
- Do **values or ethics** come into it?

#### Step-by-step framework
1. **Gather evidence**: data, research, feedback, expertise.
2. **Assess quality and gaps** in the data.
3. **Match rigour to risk** and reversibility.
4. **Apply judgement** where data is limited or values matter.
5. **Test** to reduce uncertainty.
6. **Review outcomes** and learn.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I always follow the data." | Data-informed, recognising data's limits |
| "I trust my gut." | Judgement structured with evidence and tests |
| Same approach for all decisions | Rigour matched to risk and reversibility |
| No example | Example where data alone would have misled |

#### Useful phrases
- "I'm data-informed: data is a key input, but not the only one."
- "For reversible decisions, I move fast and learn; for irreversible ones, I invest more in evidence."
- "Data might show what increases conversion, but not whether it's the right thing to do."
- "Where data is missing, I make assumptions explicit and test them."

#### Common pitfalls
- **Blind faith in metrics**, including vanity or narrow ones.
- **Gut decisions** without evidence.
- **Analysis paralysis** waiting for perfect data.
- **Ignoring ethics** because a metric improves.

#### Follow-ups to expect (with sample answers)
- **"Tell me about a time data and intuition disagreed."**
  Have a STAR story ready, e.g. the confirmation step example.
- **"How do you make decisions with very little data?"**
  "Gather what qualitative evidence I can, make assumptions explicit, choose reversible first steps, and set checkpoints to learn quickly."
- **"What's a one-way versus two-way door?"**
  "A concept popularised by Amazon: two-way doors are reversible decisions you can make quickly; one-way doors are hard to reverse and deserve more care."

- **"How do you build good product intuition?"**
  "Spend time with customers, review the results of past decisions, study other products, and compare your predictions with actual outcomes."
- **"What do you do when your intuition and your team's disagree?"**
  "Discuss the reasoning openly, look for the cheapest way to get evidence, and if a decision is needed, make it and agree how we'll evaluate it."

#### What senior interviewers look for
- **Judgement** in ambiguous, high-stakes decisions.
- Building a **decision-making culture** that balances speed and rigour.
- **Ethical leadership** in product decisions.

#### Practise it
1. Prepare a story where data alone would have led to a poor decision.
2. List three decisions you'd treat as two-way doors and three as one-way doors.
3. Answer "Are you data-driven?" **out loud in 2 minutes**.
