# Product Owner — Metrics & Analytics

## How do you define success metrics for a new feature?
- id: po-metrics-01
- round: METRICS_ANALYTICS
- difficulty: medium
- levels:
- tags: success metrics, guardrails, north star, measurement

### Prompt
You're about to launch a new "saved items" feature in an e-commerce app. How do you decide how to measure whether it's successful?

### Answer
#### What the interviewer is really testing
- Whether you start from the **goal and hypothesis**, not from whatever is easy to measure.
- Whether you know the difference between **adoption**, **engagement** and **business outcomes**.
- Whether you think about **unintended consequences** (guardrails).
- Whether you plan **measurement before launch**, including how you'll attribute impact.

#### Key points
- Start with **why** you're building it, and write a clear **hypothesis**.
- Define:
  - A **primary metric**: the outcome that tells you if the feature succeeded.
  - **Supporting metrics**: adoption and engagement, which help explain why the primary moved (or didn't).
  - **Guardrail metrics**: things that must not get worse.
- Set **targets** and a **measurement plan** (tracking events, A/B test, timeframe) **before** launch.
- Combine **quantitative** and **qualitative** signals.

#### Model answer
"I'd start from why we're building it.

**Hypothesis.** 'Many shoppers browse but aren't ready to buy yet. If they can save items, they'll come back later and buy more, increasing purchase frequency.'

**Primary metric**, the outcome we care about:
- **Purchase frequency per active customer** (orders per customer per month) in the group that has the feature, compared with a control group.
- A more direct supporting measure: the **share of saved items purchased within 30 days**.

**Supporting metrics**, to explain the result:
- **Adoption**: % of weekly active users who save at least one item.
- **Engagement**: average items saved per user, and how often the saved list is opened.
- **Return visits**: % of users who save an item and come back within 7 days.
- **Conversion from the saved list**: % of saved-list visits that end in a purchase.

**Guardrail metrics**, things that must not get worse:
- **Overall conversion rate.** We don't want 'save for later' to replace 'buy now' for people who would have bought immediately.
- **Average order value.**
- **Page performance**: the save button shouldn't slow down product pages.

**Measurement plan:**
- **Tracking events** implemented and tested before launch: `item_saved`, `item_unsaved`, `saved_list_viewed`, `saved_item_added_to_basket`, `saved_item_purchased`.
- **A/B test**: e.g. 50% of users get the feature for 4 weeks. Shopping is affected by seasons, paydays and promotions, so a control group is the only reliable way to attribute impact.
- **Success criteria agreed in advance**, e.g. '+3% purchase frequency in the treatment group, with no drop in overall conversion or order value'.
- **Checkpoints**: a technical check after a few days (is tracking working, any bugs?), and a decision review once the test ends.

**Qualitative signals.** App reviews, support tickets and a few user interviews: numbers tell you *what* happened, rarely *why*.

If the result is positive, I'd roll it out and look at next steps, like **price-drop alerts** on saved items, which could increase conversion further."

#### Another worked example: a B2B feature
"For a **'scheduled reports'** feature in an analytics product (users get reports emailed automatically):
- **Hypothesis**: customers who receive regular reports see the product's value more often, so they're less likely to cancel.
- **Primary**: 90-day retention of accounts that set up a scheduled report, compared with similar accounts that don't (or an A/B test of feature visibility).
- **Supporting**: % of accounts setting up at least one schedule, email open rate, clicks from the email into the product.
- **Guardrails**: unsubscribe rate, spam complaints, support tickets about report errors.
- **Watch out**: accounts that set up reports may already be more engaged (selection bias), which is why a controlled comparison matters."

#### Types of metrics
| Type | Question it answers | Example |
|---|---|---|
| Adoption | Are people using it? | % of active users who saved an item |
| Engagement | How much do they use it? | Saves per user, list views per week |
| Outcome (primary) | Did it achieve the goal? | Purchase frequency |
| Guardrail | Did we break anything? | Overall conversion, order value |
| Quality | Is it working well? | Error rate, load time |
| Qualitative | Why? | Reviews, interviews, support tickets |

#### Step-by-step framework
1. **State the goal and hypothesis.**
2. **Choose the primary metric** that reflects the outcome.
3. **Add supporting metrics** for adoption and engagement.
4. **Add guardrails** for unintended consequences.
5. **Set targets and success criteria** in advance.
6. **Plan tracking and attribution** (A/B test or comparison).
7. **Review** at agreed checkpoints, including qualitative feedback.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We'd track how many people use it." | Defines an outcome metric linked to the goal |
| No guardrails | Includes guardrails such as overall conversion |
| Decides metrics after launch | Agrees metrics and success criteria before launch |
| No control group | Uses an A/B test to attribute impact |
| Numbers only | Adds qualitative feedback to understand why |

#### Useful phrases
- "Let me start with the hypothesis: why do we believe this feature will help?"
- "Adoption tells us people use it. The primary metric tells us whether it achieves the goal."
- "As a guardrail, I'd watch overall conversion, to make sure we're not just delaying purchases."
- "We'd agree the success criteria before launch, so we can't reinterpret the results afterwards."

#### Common pitfalls
- **Only measuring adoption** ("20% of users used it") without the business outcome.
- **No guardrails**, which hides harm to other metrics.
- **Defining metrics after launch**, which makes cherry-picking tempting.
- **No control group**, so a seasonal effect gets credited to the feature.
- **Tracking not tested** before launch, so there's no data when you need it.

#### Follow-ups to expect (with sample answers)
- **"What if adoption is high but purchases don't change?"**
  "Then people use it as a bookmark, not a step toward buying. I'd look at what happens to saved items, and test nudges like price-drop or low-stock alerts."
- **"How long would you wait before judging success?"**
  "Long enough to capture the typical time between saving and buying (e.g. 30 days) and to reach the sample size needed for statistical significance."
- **"What if you can't run an A/B test?"**
  "I'd use a before-and-after comparison with careful controls, e.g. comparing against the same period last year, or a staggered rollout by region, and treat the results with more caution."

#### What senior interviewers look for
- Linking feature metrics to the **product's North Star** and company goals.
- Considering **long-term effects** (retention, lifetime value), not just immediate conversion.
- Building **measurement habits** across the team, e.g. every feature has a hypothesis and metrics in its brief.

#### Practise it
1. Choose three features from apps you use (e.g. Instagram's "close friends", Spotify's "Blend", Amazon's "Subscribe & Save").
2. For each, write a hypothesis, primary metric, two supporting metrics and one guardrail.
3. Explain one **out loud in 3 minutes**, including how you'd attribute impact.

## A key metric dropped 15% week-over-week — how do you investigate?
- id: po-metrics-02
- round: METRICS_ANALYTICS
- difficulty: hard
- levels:
- tags: root cause analysis, metrics, diagnosis, data

### Prompt
You come in on Monday and see that daily orders dropped 15% compared with the previous week. How do you investigate?

### Answer
#### What the interviewer is really testing
- **Structured thinking** under pressure: do you investigate systematically or guess?
- Whether you **check the data first** before chasing a business problem.
- Your ability to **break a metric down** (funnel decomposition and segmentation).
- **Communication**: keeping stakeholders informed during the investigation.
- Whether you **prevent recurrence**.

#### Key points
- Work from the **most likely and easiest-to-check** causes to the more complex ones.
- **Is it real?** Check data quality and tracking first.
- **Is it external?** Seasonality, holidays, competitors, outages.
- **Did we change something?** Releases, experiments, pricing, marketing.
- **Segment and decompose** to locate the drop.
- **Communicate early** and **set up monitoring** afterwards.

#### Model answer
"I'd work through it in layers.

**1. Is the data right?**
- Has tracking broken? I'd compare analytics with another source, e.g. orders in the payments system or the order database.
- Did a dashboard definition, filter or data pipeline change?
- Is the data complete? Sometimes Monday's dashboard simply hasn't finished processing the weekend.

If the order database shows normal volumes, it's a **tracking issue**, not a business problem, and I'd ask the data team to fix the pipeline.

**2. Is there an obvious external explanation?**
- **Seasonality**: was last week unusual (a holiday, payday, a big sale)? I'd compare with the same week last year.
- **External events**: competitor promotions, news, weather (food delivery rises when it rains), sporting events.
- **Marketing**: did a campaign end, or did ad spend drop?

**3. Did something change on our side?**
- Recent **releases** on any platform.
- New **A/B tests** or feature flags.
- **Incidents**: a payment provider outage, slow pages, an app crash.
- **Pricing, fees or delivery changes.**

**4. Segment to locate the drop:**
- **Platform**: iOS, Android, web.
- **Geography**: country or city.
- **Customer type**: new or returning.
- **Acquisition channel**: organic, paid, referral, email.

**5. Decompose the metric.** Orders = **traffic × conversion rate**. And conversion can be broken into funnel steps: product view → add to basket → checkout → payment success.

**Example.** Suppose:
- Traffic is flat.
- Conversion fell from 4.0% to 3.4%.
- The drop is only on **iOS**.
- It started on **Thursday**, when we released a new iOS version.
- The funnel shows the drop is at **payment**: more payment failures.

That points strongly to a bug in the new iOS payment flow. I'd confirm with the engineering team (error logs, crash reports) and reproduce it.

**6. Act and communicate.**
- **Communicate early**: as soon as I see the drop, I'd send a short message: 'Orders are down 15% week on week. We're investigating; first update by 11am.' Then regular updates.
- **Fix or roll back**: if the release is the cause and the impact is significant, roll back or hotfix immediately, then investigate fully.
- **Estimate the impact**: lost orders and revenue, affected customers.
- **Post-mortem**: what happened, why we didn't catch it sooner, and what we'll change, written without blame.
- **Prevent**: add alerts on key metrics by platform (e.g. alert if payment success on any platform drops more than 5% in an hour), and add the payment flow to automated release testing."

#### Another worked example: when it's not a bug
"Imagine the same investigation finds no technical cause. Instead:
- The drop is only in **London**.
- It's mostly **new customers** from paid social ads.
- A competitor launched a big '50% off your first order' campaign in London last week.

This is a **market change**, not a bug. The response is different: assess whether to respond with our own promotion (and its cost), focus on retaining existing customers, and monitor whether the drop recovers when the competitor's campaign ends."

#### Investigation checklist
| Layer | Questions | Example checks |
|---|---|---|
| 1. Data quality | Is the data correct and complete? | Compare with another source; check pipelines |
| 2. External factors | Seasonality, events, competitors? | Year-on-year comparison; market news |
| 3. Internal changes | Releases, tests, incidents, pricing? | Release log; incident reports; experiment list |
| 4. Segmentation | Where is the drop? | Platform, region, customer type, channel |
| 5. Decomposition | Which part of the metric? | Traffic × conversion; funnel steps |
| 6. Root cause | Why? | Logs, recordings, user feedback |
| 7. Act and prevent | Fix, communicate, monitor | Roll back; post-mortem; alerts |

#### Step-by-step framework
1. **Validate the data.**
2. **Check external factors.**
3. **Check internal changes.**
4. **Segment** the drop.
5. **Decompose** the metric.
6. **Find and confirm** the root cause.
7. **Fix, communicate and prevent.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It must be the new release." | Investigates systematically before concluding |
| Doesn't check the data | Validates data quality first |
| Looks at the overall number only | Segments and decomposes to locate the drop |
| Investigates silently | Communicates early with regular updates |
| Fixes it and moves on | Runs a post-mortem and adds monitoring |

#### Useful phrases
- "First, I want to confirm this is real and not a tracking issue."
- "Let me break orders down into traffic and conversion to see where the change is."
- "The drop is only on iOS and started with Thursday's release, so that's my leading hypothesis."
- "Here's a quick update: we've narrowed it down, and expect a fix by this afternoon."
- "To catch this faster next time, I'd add an alert on payment success by platform."

#### Common pitfalls
- **Jumping to conclusions** based on the first idea.
- **Not checking data quality** first, wasting hours on a tracking bug.
- **Investigating silently** while leadership worries.
- **Fixing the problem but not preventing recurrence.**
- **Ignoring external factors** like seasonality.

#### Follow-ups to expect (with sample answers)
- **"What if you can't find a single cause?"**
  "It may be a combination of small factors, or a genuine market shift. I'd look at trends over a longer period, speak to customers, and monitor leading indicators while testing hypotheses."
- **"How do you decide between rolling back and fixing forward?"**
  "If the impact is significant and the release is the likely cause, roll back first to stop the damage, then investigate. Fix forward only if the fix is small, well understood and quick."
- **"Who would you involve?"**
  "Data or analytics for validation, engineering for releases and logs, marketing for campaigns, customer support for complaints, and leadership for updates."

#### What senior interviewers look for
- Calm, structured leadership **under pressure**.
- Fluency with **funnel decomposition** and segmentation.
- **Organisation-level prevention**: alerting, release guardrails, experiment governance.
- Clear, regular **stakeholder communication**.

#### Practise it
1. Pick a metric from a product you know (daily active users, sign-ups, orders).
2. Imagine it dropped 20% and write one possible cause for each of the seven layers above.
3. Practise walking through the investigation **out loud in 6 minutes**, including the update you'd send to leadership.

## How would you design and run an A/B test?
- id: po-metrics-03
- round: METRICS_ANALYTICS
- difficulty: hard
- levels:
- tags: A/B testing, experimentation, statistics

### Prompt
You want to test a new checkout design. How would you set up the A/B test, and what are the common mistakes to avoid?

### Answer
#### What the interviewer is really testing
- Whether you understand **experiment design**: hypothesis, metrics, sample size, randomisation.
- Whether you know the **common statistical mistakes** (peeking, multiple comparisons, underpowered tests).
- Whether you can **interpret results** sensibly, including flat or surprising results.
- Practical judgement about **when not to A/B test**.

#### Key points
- Start with a clear **hypothesis** and **one primary metric**, decided before the test.
- Calculate the **sample size** and **duration** in advance, based on the minimum effect worth detecting.
- **Randomise at the user level** and check that the split is correct (no sample ratio mismatch).
- Run for **full weekly cycles**, and **don't stop early** because results look good.
- Check **guardrails**, and treat segment findings as **hypotheses**, not conclusions.
- Consider **statistical significance** and **practical significance**.

#### Model answer
"I'd go through it step by step.

**1. Hypothesis.** 'Reducing checkout from three pages to one will reduce drop-off, increasing checkout completion by at least 2 percentage points.'

**2. Metrics:**
- **Primary**: checkout completion rate (completed orders ÷ checkouts started).
- **Guardrails**: average order value, payment errors, refund rate, page load time, customer support contacts about checkout.

**3. Sample size and duration.**
- Baseline completion: 60%.
- **Minimum detectable effect (MDE)**: +2 percentage points. That's the smallest improvement worth acting on.
- **Significance level** of 5% (95% confidence) and **statistical power** of 80%.

Putting these into a sample size calculator tells me roughly how many users I need in each group, typically thousands per variant for an effect this size. If we get 5,000 checkouts a day, I can work out how many days that takes. I'd always run for **at least one or two full weeks** to cover weekday and weekend behaviour, even if the sample size is reached sooner.

**4. Set-up:**
- **Randomise at the user level**, not the session level, so returning users always see the same version.
- Usually a **50/50 split**. For a risky change, I'd start with a small percentage (e.g. 5–10%) to check nothing breaks, then increase.
- **Sample ratio check**: if the split ends up 52/48 instead of 50/50 with large numbers, something's wrong with assignment or tracking, and the results can't be trusted.
- **Test tracking** in both variants before starting.
- **Avoid overlapping tests** on the same page, or make sure the experimentation platform handles them.

**5. During the test:**
- Monitor for **bugs** and **guardrail breaches**, e.g. if payment errors spike, stop immediately.
- **Don't stop early** just because results look significant after three days. Checking repeatedly and stopping when it looks good (called **'peeking'**) greatly increases the chance of a false positive.

**6. Analyse:**
- Is the difference **statistically significant**? Is it **practically significant**, big enough to matter for the business?
- Look at the **confidence interval**, not just the p-value. '+2.3 points, with a 95% interval of +0.8 to +3.8' is much more informative than 'significant'.
- Check **guardrails**.
- Look at key **segments** (mobile versus desktop, new versus returning), but treat surprising segment results as hypotheses for future tests, because testing many segments increases false positives.
- Watch for **novelty effects**: users sometimes engage with something just because it's new. If possible, check whether the effect holds over time.

**7. Decide and document:**
- **Ship** if the primary metric improved meaningfully without harming guardrails.
- **Iterate** if results are mixed.
- **Stop** if there's no improvement or there's harm.
- Write up the results, including failures, in a shared experiment log, so the company learns."

#### Another worked example: a flat result
"Suppose the new checkout shows +0.4 points, not significant, with a confidence interval of −0.9 to +1.7.
- This **doesn't prove** the new design has no effect. It means any effect is probably smaller than about 1.7 points.
- I'd check: was the test powered for 2 points? Did both variants work correctly? Are there big differences by platform?
- If mobile users improved a lot but desktop users got worse, that's a **hypothesis** for a follow-up test, not a conclusion.
- Decision: keep the old design (or the new one if it's cheaper to maintain), and focus on other checkout improvements with bigger potential."

#### Common experiment mistakes
| Mistake | Why it's a problem | How to avoid it |
|---|---|---|
| Peeking and stopping early | Inflates false positives | Pre-define the sample size; use sequential testing if needed |
| Underpowered test | Misses real effects | Calculate the sample size up front |
| Many metrics, pick the winner | Finds "significant" noise | One primary metric, defined in advance |
| Sample ratio mismatch | Broken randomisation | Check the split; investigate any mismatch |
| Session-level randomisation | Users see both versions | Randomise by user |
| Ignoring novelty effects | Short-lived lift | Run longer; check trends over time |
| Unusual periods | Results don't generalise | Avoid or account for sales and holidays |

#### Step-by-step framework
1. **Hypothesis** with an expected effect.
2. **Primary metric and guardrails.**
3. **Sample size and duration** (MDE, significance, power).
4. **Set-up**: user-level randomisation, tracking, ratio checks.
5. **Run**: monitor for bugs; don't peek and stop.
6. **Analyse**: significance, confidence intervals, guardrails, segments.
7. **Decide and document.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Split traffic and see which wins." | Defines a hypothesis, metrics and sample size first |
| Stops when it looks significant | Runs to the planned sample size and full weeks |
| Declares victory on any significant metric | One primary metric, chosen in advance |
| Ignores guardrails | Checks guardrails and stops if they're breached |
| "Flat means it doesn't work." | Interprets confidence intervals and power properly |

#### Useful phrases
- "Before running it, I'd calculate the sample size based on the smallest effect worth detecting."
- "We'd randomise at the user level, so nobody sees both versions."
- "I wouldn't stop the test early just because it looks good. That inflates false positives."
- "The confidence interval tells us the likely range of the effect, which is more useful than just 'significant'."
- "That segment result is interesting, but I'd treat it as a hypothesis for a follow-up test."

#### Common pitfalls
- **Stopping the test early.**
- **Testing many metrics** and choosing whichever is significant.
- **Too small a sample** to detect a realistic effect.
- **Overlapping tests** without considering interactions.
- **Ignoring sample ratio mismatch.**
- **Running tests during unusual periods** (e.g. Black Friday) and generalising.

#### Follow-ups to expect (with sample answers)
- **"When would you not A/B test?"**
  "When traffic is too low to reach a reliable result, for legally required changes, for obvious bug fixes, or when the cost of building two versions is too high. Then I'd use qualitative research, a staged rollout or before-and-after analysis."
- **"What's statistical power?"**
  "The probability of detecting an effect if it really exists. 80% power means a 20% chance of missing a real effect of the size we planned for."
- **"How do you explain results to non-technical stakeholders?"**
  "In plain terms: 'The new checkout increased completed orders by about 2%, which is worth roughly £X a month. We're confident it's a real effect, and it didn't hurt order value.'"

#### What senior interviewers look for
- Understanding **power, errors and confidence intervals** without getting lost in maths.
- Building an **experimentation culture**: shared tooling, pre-registered hypotheses, an experiment log.
- Knowing **when experimentation isn't the right tool**.

#### Practise it
1. Design an A/B test for a change in a product you use (e.g. a new sign-up page, a different pricing page).
2. Write the hypothesis, primary metric, three guardrails, MDE, and a duration estimate.
3. Write how you'd interpret three outcomes: a clear win, a flat result and a guardrail breach.
4. Explain it **out loud in 5 minutes** as if to a non-technical stakeholder.

## Choose a North Star metric for a product
- id: po-metrics-04
- round: METRICS_ANALYTICS
- difficulty: medium
- levels:
- tags: north star, metrics strategy, input metrics

### Prompt
What would you choose as the North Star metric for a food delivery app like Deliveroo, and why?

### Answer
#### What the interviewer is really testing
- Whether you understand what a **North Star metric** is and what makes a good one.
- Whether you can think about **customer value and business value** together.
- Whether you consider **all sides** of a marketplace.
- Whether you can break it down into **input metrics** teams can act on.

#### Key points
- A **North Star metric** is the single metric that best captures the **core value customers get** from the product, and that **predicts long-term business success**.
- A good North Star is:
  - Tied to **customer value**.
  - A **leading indicator** of revenue, not revenue itself.
  - **Measurable** and understandable by everyone.
  - **Influenceable** by teams through their work.
- Break it into **input metrics** that individual teams can own.
- Add **guardrails** so teams don't optimise it in harmful ways.

#### Model answer
"For a food delivery marketplace, I'd choose **weekly successful orders**: orders delivered on time, correct, and not refunded or complained about.

**Why this metric:**
- **Customer value**: a successful order means someone got the food they wanted, as expected. Counting only *successful* orders, rather than all orders placed, keeps us honest about quality.
- **All sides of the marketplace**: customers get their food, restaurants earn revenue, and riders get paid. One metric reflects value for all three.
- **Leading indicator of revenue**: commission and delivery fees grow with good orders, and good experiences drive repeat orders.
- **Weekly** fits ordering frequency: daily is too noisy, monthly too slow to act on.

**Alternatives I considered:**
- **Gross merchandise value (GMV)**: important for the business, but it can grow through higher prices or bigger baskets without more customer value.
- **Monthly active users**: shows people opened the app, not that they got value.
- **Orders per active customer**: good for engagement, but ignores growth in new customers.
- **Revenue**: an output. Too far removed from what most teams can influence directly.

**Input metrics.** The North Star breaks down into drivers that teams can own:
- **Acquisition**: new customers placing a first order.
- **Retention**: % of customers ordering again within 30 days.
- **Frequency**: orders per retained customer per week.
- **Selection**: number of available restaurants within delivery range, and cuisine variety.
- **Delivery experience**: on-time rate, average delivery time, order accuracy.
- **Conversion**: % of app sessions that end in an order.

**Guardrails:**
- **Restaurant economics**: restaurant margins and partner churn.
- **Rider earnings** per hour.
- **Unit economics**: contribution margin per order, promotion spend.

We don't want to grow orders by burning money on discounts, or by squeezing restaurants and riders."

#### Another worked example: a B2B collaboration tool
"For a team collaboration product like Slack or Notion, a good North Star might be **weekly active teams**: teams where at least 3 members collaborated (sent messages or edited shared pages) in a week.
- **Why teams, not users**: the value is in collaboration. One person using it alone isn't the core value, and companies pay per team or seat.
- **Inputs**: team activation (first team project created), invitations accepted, cross-team usage, integrations connected.
- **Guardrails**: notification overload (users muting everything), support tickets, performance."

#### North Star examples
| Product | Possible North Star | Why |
|---|---|---|
| Food delivery | Weekly successful orders | Value for customers, restaurants and riders |
| Spotify | Time spent listening (by engaged users) | Core value is listening |
| Airbnb | Nights booked | Value for guests and hosts |
| Slack | Weekly active teams | Value is team collaboration |
| Duolingo | Daily active learners | Habit and learning |
| Banking app | Primary-account customers | Main relationship with the bank |

#### Step-by-step framework
1. **Identify the core value** the product delivers to customers.
2. **Propose a metric** that captures it, and the right time period.
3. **Check the criteria**: customer value, leading indicator, measurable, influenceable.
4. **Compare alternatives** and explain why you rejected them.
5. **Break it into input metrics** teams can own.
6. **Add guardrails** against harmful optimisation.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Revenue." | A metric reflecting customer value that predicts revenue |
| "Downloads." | Avoids vanity metrics |
| Only the customer side | Considers all sides of the marketplace |
| No input metrics | Breaks it down into team-level drivers |
| No guardrails | Adds guardrails for partner and unit economics |

#### Useful phrases
- "The best North Star captures the moment customers get value."
- "I'd count only successful orders, because a late or wrong order isn't value."
- "Revenue is an output. It follows from this metric, but teams can't steer it directly."
- "Each team would own one or two of these input metrics."
- "Guardrails make sure we don't grow the North Star in unhealthy ways."

#### Common pitfalls
- **Choosing revenue** as the North Star.
- **Choosing a vanity metric** like downloads or registered users.
- **No input metrics**, so teams don't know how to contribute.
- **Ignoring other sides** of a marketplace.
- **No guardrails**, so the metric can be gamed.

#### Follow-ups to expect (with sample answers)
- **"How would you choose a North Star for Netflix?"**
  "Hours of satisfied viewing among paying members, perhaps excluding content abandoned in the first few minutes, because it reflects the value members get and predicts retention."
- **"Can a North Star be harmful?"**
  "Yes, if optimised blindly. For example, maximising time spent can encourage addictive design. That's why guardrails and good judgement matter."
- **"How often should it change?"**
  "Rarely, typically only when the product strategy or business model changes significantly."

#### What senior interviewers look for
- Understanding **metric trees**: how the North Star breaks down into input metrics and OKRs.
- **Aligning multiple teams** around shared metrics without creating perverse incentives.
- Connecting the North Star to **company strategy**.

#### Practise it
1. Choose North Star metrics for three products (one marketplace, one subscription, one B2B tool).
2. For each, write the reason, two rejected alternatives, four input metrics and two guardrails.
3. Explain one **out loud in 3 minutes**.

## What's the difference between leading and lagging indicators, and how do you use OKRs?
- id: po-metrics-05
- round: METRICS_ANALYTICS
- difficulty: easy
- levels:
- tags: OKRs, leading indicators, lagging indicators, vanity metrics

### Prompt
Explain leading versus lagging indicators, and how you'd use OKRs to set goals for your team. What makes a metric a "vanity metric"?

### Answer
#### What the interviewer is really testing
- Understanding of **metric types** and how to use them for decisions.
- Practical experience of **OKRs**: writing good ones, using them well.
- Whether you can distinguish **actionable metrics** from **vanity metrics**.

#### Key points
- **Lagging indicators** measure results after the fact (revenue, churn, NPS). Important, but slow and hard to act on directly.
- **Leading indicators** predict future results and can be influenced now (activation, weekly engagement).
- **OKRs** = **Objectives and Key Results**:
  - **Objective**: qualitative, inspiring, what you want to achieve.
  - **Key Results**: 2–4 measurable **outcomes** that show you've achieved it, not tasks.
- **Vanity metrics** look good but don't help decisions (total sign-ups ever, page views).
- **Actionable metrics** are rates, ratios and cohorts that change when the product changes.

#### Model answer
"**Leading versus lagging.**
- A **lagging indicator** tells you what has already happened, like quarterly revenue, annual churn or customer satisfaction scores. By the time it moves, it's too late to change that result.
- A **leading indicator** moves earlier and predicts the lagging one. For example, in a language-learning app, we might find that users who complete **3 lessons in their first week** are much more likely to still be subscribed after 3 months. So 'week-one completion of 3+ lessons' is a leading indicator for retention.

Teams should mostly steer by **leading indicators**, because they can influence them week to week, and confirm success with **lagging indicators**.

**OKRs.** I write OKRs with the team each quarter, linked to company goals. For example:

> **Objective:** Make new learners successful in their first week.
> - **KR1:** Increase week-one activation (3+ lessons completed) from 32% to 45%.
> - **KR2:** Reduce time from sign-up to first lesson from 6 minutes to under 2 minutes.
> - **KR3:** Improve 30-day retention of new subscribers from 55% to 62%.

Notice:
- The **objective** is inspiring and clear about direction.
- The **key results** are measurable **outcomes**, not tasks like 'launch new onboarding'.
- KR1 and KR2 are **leading**; KR3 is **lagging**.
- The roadmap items (new onboarding, a placement test, reminder notifications) are our **bets** on how to move these key results.

**Using OKRs well:**
- Keep them **few**: 1–3 objectives per team, 2–4 key results each.
- **Review progress** every couple of weeks, not just at the end of the quarter.
- Make them **ambitious**: in many companies, achieving about 70% of a stretch target is considered good.
- **Don't tie them to individual performance reviews**, which encourages setting easy targets or gaming.

**Vanity metrics** are numbers that only go up and don't inform decisions: total registered users, total downloads, total page views. They feel good in a presentation but don't tell you whether users are getting value. I prefer **actionable** metrics:
- Rates: activation rate, conversion rate.
- Cohorts: retention of users who joined in March versus April.
- Ratios: weekly active users ÷ monthly active users (stickiness)."

#### Another worked example: OKRs for a B2B product
"> **Objective:** Become the easiest invoicing tool for small businesses to start using.
> - **KR1:** Reduce median time to first invoice sent from 3 days to under 1 day.
> - **KR2:** Increase trial-to-paid conversion from 18% to 25%.
> - **KR3:** Reduce onboarding-related support tickets by 40%.

Possible bets: automatic import of customer details, invoice templates by industry, an onboarding checklist. If we're halfway through the quarter and KR1 isn't moving, we change the bets, not the key results."

#### Leading versus lagging examples
| Product | Leading indicator | Lagging indicator |
|---|---|---|
| Subscription app | Week-one activation | 3-month retention, revenue |
| E-commerce | Add-to-basket rate, return visits | Monthly revenue |
| B2B SaaS | Weekly active users per account | Renewal rate |
| Customer support | First-response time | Customer satisfaction score |

#### Good versus bad key results
| Bad key result | Why | Better key result |
|---|---|---|
| "Launch new onboarding" | A task, not an outcome | "Increase activation from 32% to 45%" |
| "Improve engagement" | Not measurable | "Increase weekly active users from 40% to 50% of monthly users" |
| "Get 1 million downloads" | Vanity metric | "Increase 30-day retention from 20% to 28%" |

#### Step-by-step framework
1. **Start from company goals** and the product strategy.
2. **Write 1–3 objectives**: inspiring and qualitative.
3. **Add 2–4 key results** per objective: measurable outcomes, mixing leading and lagging.
4. **Identify bets** (roadmap items) to move the key results.
5. **Review regularly** and adjust bets.
6. **Grade at the end** of the quarter and learn.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Key results are tasks | Key results are measurable outcomes |
| 5 objectives with 5 KRs each | A few focused OKRs |
| Only lagging metrics | Mixes leading indicators to steer with lagging ones to confirm |
| Reports vanity metrics | Uses actionable rates, ratios and cohorts |
| OKRs tied to bonuses | OKRs used for focus and learning |

#### Useful phrases
- "Leading indicators help us steer; lagging indicators confirm we got there."
- "A key result should describe an outcome, not a task."
- "The roadmap items are our bets on how to move the key results."
- "If we're not moving the key result, we change the bets, not the target."
- "Total downloads is a vanity metric. I'd look at retention by cohort instead."

#### Common pitfalls
- **Key results that are tasks** ("launch feature X").
- **Too many OKRs**, which leads to no focus.
- **Tying OKRs to individual performance**, which encourages gaming.
- **Setting and forgetting**: only looking at OKRs at the end of the quarter.
- **Reporting vanity metrics** to leadership.

#### Follow-ups to expect (with sample answers)
- **"How do you find a good leading indicator?"**
  "Look at early user behaviours and see which ones correlate most strongly with long-term retention (cohort analysis). Then test whether increasing that behaviour actually improves retention, because correlation isn't causation."
- **"What if you're missing your key results mid-quarter?"**
  "Diagnose why, adjust the bets, and communicate early. I wouldn't lower the targets mid-quarter unless the situation has fundamentally changed."
- **"How do OKRs relate to the roadmap?"**
  "OKRs define the outcomes we're aiming for. The roadmap lists the bets we're making to achieve them."

#### What senior interviewers look for
- **Cascading OKRs** across teams without creating silos.
- Choosing leading indicators **backed by data**.
- Using OKRs for **focus and autonomy**, not reporting overhead.

#### Practise it
1. Write one objective and three key results for a product you know, with at least one leading and one lagging KR.
2. List three bets you'd make to achieve them.
3. Turn three vanity metrics from that product into actionable metrics.
4. Explain your OKRs **out loud in 3 minutes**.

## Your feature launched, but the metrics didn't move — what next?
- id: po-metrics-06
- round: METRICS_ANALYTICS
- difficulty: medium
- levels:
- tags: post-launch, iteration, learning, sunk cost

### Prompt
You launched a feature the team spent a whole quarter on. After a month, the target metric hasn't moved. What do you do?

### Answer
#### What the interviewer is really testing
- **Intellectual honesty**: do you face results objectively?
- **Diagnostic thinking**: can you find where the chain from feature to outcome breaks?
- Whether you avoid the **sunk-cost fallacy**.
- Whether you **learn and share** lessons, and improve your process.

#### Key points
- Avoid both extremes: don't **declare victory** anyway, and don't **kill it immediately**.
- **Check the measurement** and whether enough time has passed.
- Diagnose the chain: **awareness → adoption → continued usage → outcome**. Where does it break?
- Get **qualitative insight**.
- Decide: **improve discoverability**, **iterate the experience**, or **stop**, based on evidence.
- Avoid the **sunk-cost fallacy**: past effort is gone, so decide on future value.
- **Share the learning** openly.

#### Model answer
"I'd work through it step by step.

**1. Check the measurement.**
- Is tracking working correctly?
- Was the target realistic, and has enough time passed? Some features, especially retention features, take more than a month to show impact.
- Are we comparing against the right baseline, e.g. a control group or the same period last year?

**2. Diagnose the chain.** A feature affects a metric only if people find it, try it, keep using it, and their behaviour changes. So I'd look at each step:
- **Awareness and adoption**: do users discover and try it? If only 3% of users have found it, the problem is discoverability, not the feature.
- **Continued usage**: do people who try it keep using it? If most try once and never return, the experience or the value isn't there.
- **Outcome**: do regular users show better results on the target metric? If they do, the feature works but not enough people use it. If they don't, our hypothesis was wrong.

**Example.** We launched a **'budget planner'** to improve 90-day retention in a personal finance app.
- Adoption: only 6% of active users tried it. It was hidden in a menu.
- Continued usage: 45% of those who tried it used it weekly, which is good.
- Outcome: weekly planner users had 90-day retention 12 points higher than similar non-users.

This tells me the feature probably works for people who use it, but very few find it. The fix is **discoverability**, not a rebuild.

**3. Get qualitative insight.** I'd talk to users who tried it and users who didn't, and watch session recordings. In the example, interviews might reveal that people didn't know the feature existed, or didn't understand what 'planner' meant.

**4. Decide:**
- **Low adoption, good outcome for users** → invest in discoverability: onboarding prompts, better placement, clear naming, emails to relevant users.
- **Good adoption, poor continued usage** → iterate on the experience.
- **Good usage, no outcome** → the hypothesis was wrong. Stop investing, and consider simplifying or removing the feature to avoid maintenance cost and clutter.

I'd **time-box** the next step, e.g. two sprints of discoverability work with a clear success criterion ('adoption above 20% and a measurable retention effect in an A/B test'), before deciding whether to continue.

**5. Share the learning.** I'd present the results openly to stakeholders and the team: what we expected, what happened, what we learned and what we'll do next. That builds trust and makes it easier to stop things that aren't working.

**6. Improve the process.** I'd ask: what could we have tested more cheaply before investing a whole quarter? Next time, I'd validate demand and discoverability earlier, and release in smaller slices with checkpoints."

#### Another worked example: when the right answer is to stop
"A team built a social feed in a B2B tool, hoping it would increase engagement.
- Adoption was high at first (it was on the home screen), but usage dropped to almost nothing after two weeks.
- Interviews showed users saw it as noise: they came to the product to get work done, not to socialise.
- Decision: remove the feed, keep the one part users valued (notifications about colleagues' updates to shared projects), and share the learning that our users value focus over social features.

The quarter wasn't wasted. It produced a clear insight that shaped the next year's roadmap."

#### Diagnosis table
| Finding | Likely cause | Next step |
|---|---|---|
| Few people find or try it | Discoverability | Placement, onboarding, naming, communication |
| People try it but don't return | Experience or value | Research and iterate on the experience |
| Regular use, but no impact on the metric | Wrong hypothesis | Stop; simplify or remove |
| Impact only in one segment | Fit for a specific group | Target that segment |
| Too early to tell | Time lag | Wait, with interim leading indicators |

#### Step-by-step framework
1. **Check measurement** and timing.
2. **Diagnose** awareness → adoption → continued usage → outcome.
3. **Get qualitative insight.**
4. **Decide**: discoverability, iteration or stop.
5. **Time-box** the next step with success criteria.
6. **Share** the learning.
7. **Improve** the discovery process.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Changes the success metric to look good | Faces the result honestly |
| "Users don't get it yet; let's wait." | Diagnoses where the chain breaks |
| Keeps investing because of the effort spent | Avoids the sunk-cost fallacy |
| Kills it immediately | Decides based on evidence and time-boxes next steps |
| Keeps the learning private | Shares learning openly and improves the process |

#### Useful phrases
- "Let's look at where the chain breaks: are people finding it, using it, and does it change their behaviour?"
- "The effort we've spent is gone. The question is whether more investment is worth it."
- "Users who adopted it did show better retention, so the problem looks like discoverability."
- "We'll give it two more sprints with a clear success criterion, then decide."
- "Here's what we learned, and how we'll validate earlier next time."

#### Common pitfalls
- **Moving the goalposts** to make the feature look successful.
- **The sunk-cost fallacy**: continuing because of effort already invested.
- **Blaming users** ("they just don't get it").
- **Confusing correlation with causation**: engaged users may be more likely to use the feature anyway.
- **Not learning** how to validate earlier.

#### Follow-ups to expect (with sample answers)
- **"How do you remove a feature some users love?"**
  "Understand who uses it and why, communicate early, offer alternatives or a migration path, and phase it out gradually while monitoring feedback."
- **"How do you know the effect isn't just selection bias?"**
  "Users who adopt a feature are often more engaged already. That's why I'd confirm with an A/B test, e.g. promoting the feature to a random half of users, before concluding it causes better retention."
- **"How would you avoid this next time?"**
  "Validate the riskiest assumptions earlier (demand, discoverability), release a thin slice to a beta group first, and set checkpoints to decide whether to continue."

#### What senior interviewers look for
- **Intellectual honesty** and a **learning culture**: making it safe to call a failed bet.
- **Sharing learnings** across teams and the organisation.
- **Improving the discovery process** so fewer large bets fail.

#### Practise it
1. Think of a feature (yours or a well-known one) that didn't succeed.
2. Write what you'd expect to see at each step of the chain, and which step likely broke.
3. Write a decision (discoverability, iterate, or stop) with a time-boxed success criterion.
4. Practise presenting the result **out loud in 4 minutes**, as if to the stakeholder who championed the feature.
