# Product Owner — Product Sense (continued)

## How do you work with UX designers?
- id: po-product-sense-14
- round: PRODUCT_SENSE
- difficulty: easy
- levels:
- tags: design collaboration, UX, product trio

### Prompt
How do you work with UX and product designers? What does a good partnership look like, and how do you handle disagreements about design?

### Answer
#### What the interviewer is really testing
- Whether you see designers as **partners in discovery**, not people who "make it look nice".
- Whether you understand the **product trio** (PO, designer, tech lead) working together.
- How you **give feedback** on design without dictating solutions.
- How you **resolve disagreements** with evidence rather than opinion.

#### Key points
- Involve designers **from the problem stage**, not after the solution is decided.
- Work as a **product trio**: PO (value and viability), designer (usability and desirability), tech lead (feasibility). Teresa Torres popularised this term in *Continuous Discovery Habits*.
- Share **problems, goals, constraints and data**, then let designers explore solutions.
- Give feedback on **whether the design solves the problem**, not on personal taste.
- Resolve disagreements with **user testing and data**, not seniority.
- Respect design **research and craft**: accessibility, consistency, design systems.

#### Model answer
"I see designers as **partners in figuring out what to build**, not people who make my ideas look good. The best results I've had came from working closely together from the very start.

**1. Involve them early.** When we start on a new problem, the designer joins me in discovery: customer interviews, reviewing data, mapping the current journey. If the designer only sees a finished requirement, we lose their biggest strength, which is understanding users and exploring alternatives.

**2. Work as a trio.** I work closely with the designer and the tech lead:
- I bring the **customer problem, business goals, data and constraints**.
- The designer brings **user understanding, interaction design and research skills**.
- The tech lead brings **feasibility and technical options**.

We look at ideas together early, which avoids designs that are lovely but impossible to build, or technically easy but confusing for users.

**3. Frame problems, not solutions.** Instead of 'add a button here', I'd say: 'New users don't realise they can import contacts, so they type them manually and give up. Only 12% import contacts. Our goal is 40%.' The designer might come up with something much better than my button.

**4. Give good feedback.** When reviewing designs, I focus on:
- Does it **solve the problem** we agreed?
- Does it work for our **key personas and edge cases** (errors, empty states, accessibility)?
- Is it **feasible** in our timeframe?

I try not to give feedback based on personal taste ('I don't like blue'). If something feels wrong, I explain *why* in user terms.

**5. Resolve disagreements with evidence.** If we disagree, say I think a simpler flow is enough and the designer wants a richer guided experience, we agree how to test it: a quick **usability test** with 5 users on both versions, or an A/B test after launch. Evidence settles it, not seniority.

**6. Protect design time.** I make sure designers have time for research and exploration, plan design work a sprint or two ahead of development, and respect the design system for consistency."

#### Another worked example: a disagreement
"A designer wanted to redesign our whole settings area, while I needed a quick fix for one confusing setting that was generating 300 support tickets a month.
- I acknowledged the settings area genuinely was messy.
- We agreed to fix the confusing setting first (a two-day change), measure the ticket reduction, and use the result plus a short usability study to build the case for the wider redesign.
- Tickets about that setting dropped 70%, and the redesign was prioritised for the next quarter with evidence behind it."

#### Who brings what in the product trio
| Role | Focus | Key question |
|---|---|---|
| Product Owner | Value and viability | Is it worth building, for users and the business? |
| Designer | Usability and desirability | Can users understand and enjoy it? |
| Tech lead | Feasibility | Can we build it well, in time, at reasonable cost? |

#### Step-by-step framework
1. **Involve designers from the problem stage.**
2. **Work as a trio** with the tech lead.
3. **Share problems, goals, data and constraints.**
4. **Give feedback** on outcomes, not taste.
5. **Resolve disagreements** with testing.
6. **Plan and protect** design time.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I tell the designer what I need and they design it." | Involves designers in discovery from the start |
| Feedback on taste | Feedback on whether it solves the problem |
| Disagreements decided by the PO | Disagreements settled with user evidence |
| Designers work in the same sprint as developers | Design works ahead, with time for research |

#### Useful phrases
- "Here's the problem and the goal. I'd love to see what options you come up with."
- "Does this design solve the problem we agreed on?"
- "Rather than debating it, let's test both with five users."
- "Have we covered empty states, errors and accessibility?"

#### Common pitfalls
- **Handing designers finished solutions** to "make pretty".
- **Personal-taste feedback.**
- **Not involving designers in research.**
- **No time for design** ahead of development.
- **Ignoring the design system**, creating inconsistency.

#### Follow-ups to expect (with sample answers)
- **"What if the designer's ideal solution takes too long?"**
  "Agree a first version that solves the core problem well, with the fuller design planned as a follow-up, and use data from the first version to justify it."
- **"How do you work with designers when there's no researcher?"**
  "We share research responsibilities: the designer leads usability testing, I lead problem interviews and data analysis, and we synthesise together."
- **"What's a design system?"**
  "A shared library of reusable components, patterns and guidelines, so products look and behave consistently and teams build faster."

#### What senior interviewers look for
- Building **strong trio partnerships** across teams.
- Championing **research and design quality** at the organisation level.
- Balancing **design ambition with delivery**.

#### Practise it
1. Rewrite three feature requests you've seen as problem statements with goals, ready to share with a designer.
2. Prepare a story about a design disagreement and how it was resolved.
3. Explain your approach **out loud in 3 minutes**.

## How do you collect and act on customer feedback at scale?
- id: po-product-sense-15
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: customer feedback, voice of customer, prioritisation

### Prompt
Your product has thousands of customers giving feedback through support, sales, reviews and surveys. How do you collect it, make sense of it and decide what to act on?

### Answer
#### What the interviewer is really testing
- Whether you have a **system** for feedback, not just reacting to whoever is loudest.
- Whether you can **synthesise** large volumes into themes.
- Whether you weigh feedback **against goals and data**, rather than building every request.
- Whether you **close the loop** with customers and internal teams.

#### Key points
- **Centralise** feedback from all sources (support, sales, reviews, surveys, interviews, community) in one place.
- **Tag and categorise** by theme, product area, customer segment and value.
- Look for **patterns and underlying problems**, not individual feature requests.
- **Weigh** feedback by segment, revenue, frequency and alignment with strategy.
- Combine with **behavioural data** (what people do, not just what they say).
- **Close the loop**: tell customers and internal teams what happened.

#### Model answer
"I'd set up a simple, repeatable system with five parts.

**1. Centralise it.** Feedback arrives everywhere: support tickets, sales call notes, app store reviews, NPS surveys, user interviews, community forums, social media. I'd bring it into one place, e.g. a feedback tool like Productboard, or even a well-structured spreadsheet or database, with integrations from the support desk and CRM where possible.

**2. Tag and categorise it.** Each piece of feedback gets tagged with:
- **Theme** (e.g. 'payment reminders', 'mobile performance').
- **Product area.**
- **Customer segment and value** (plan, size, revenue).
- **Source and date.**

Where volume is high, I'd use AI-assisted tagging or analysis tools to group feedback into themes, then check samples manually.

**3. Look for underlying problems.** Customers often suggest solutions ('add a CSV export'). I look for the problem behind them ('I need to share data with my accountant'). Grouping requests by problem often reveals one big opportunity behind many different requests.

**4. Weigh and prioritise.** Not all feedback is equal. I consider:
- **Frequency**: how many customers mention it.
- **Segment**: does it come from our target customers, or from a segment we're not focused on?
- **Revenue and churn risk**: is it linked to cancellations or lost deals?
- **Strategic fit**: does it align with our goals?
- **Behavioural evidence**: does usage data confirm the problem?

For example, 'mobile app crashes' might come from 400 customers and correlate with lower retention, while 'dark mode' comes from 600 but shows no link to retention. The crash issue is more important, despite fewer mentions.

**5. Close the loop:**
- **Internally**: a monthly 'voice of the customer' summary for the team and stakeholders, showing top themes, trends and what we're doing about them.
- **Externally**: when we ship something customers asked for, we tell them (release notes, emails to people who requested it). Customers who feel heard are more loyal, even if most requests aren't built.

**Regular rhythm.** I review feedback themes weekly with the designer, and use the monthly summary in roadmap discussions."

#### Another worked example: B2B sales feedback
"Sales kept saying 'we lose deals because we don't have feature X'. I asked them to log every lost deal with the reason and deal value for one quarter.
- Feature X was mentioned in 6 lost deals, worth about £90k in total.
- 'Integration with tool Y' was mentioned in 14 lost deals, worth about £340k, but hadn't been raised as loudly.
- We prioritised the integration, and win rates in that segment improved the following quarter."

#### Feedback sources and their strengths
| Source | Strength | Watch out for |
|---|---|---|
| Support tickets | High volume, real problems | Skewed toward bugs and frustrations |
| Sales notes | Reveals deal blockers | Can overstate one-off requests |
| App reviews | Public, unfiltered | Extreme opinions over-represented |
| Surveys / NPS | Quantifiable at scale | Shallow without follow-up |
| Interviews | Deep understanding | Small samples |
| Usage data | What people actually do | Doesn't explain why |

#### Step-by-step framework
1. **Centralise** all feedback sources.
2. **Tag** by theme, area, segment, value and source.
3. **Find underlying problems** behind requests.
4. **Weigh** by frequency, segment, revenue, strategy and behaviour.
5. **Act** through the normal prioritisation process.
6. **Close the loop** internally and externally.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We build what customers ask for most." | Weighs feedback by segment, value and strategy |
| Feedback scattered across tools | Centralised and tagged |
| Takes feature requests literally | Finds underlying problems |
| Feedback only, no data | Combines feedback with behavioural data |
| Customers never hear back | Closes the loop |

#### Useful phrases
- "Many different requests often point to one underlying problem."
- "I weigh feedback by who it comes from and how it connects to our goals."
- "Does our usage data confirm what customers are telling us?"
- "We tell customers when we've built something they asked for."

#### Common pitfalls
- **Building by vote count** without considering segment or strategy.
- **Letting the loudest customer** or salesperson set the roadmap.
- **Taking requests literally.**
- **No central system**, so feedback is lost.
- **Never closing the loop.**

#### Follow-ups to expect (with sample answers)
- **"How do you handle a public feature-request board where everyone votes?"**
  "Use it as one input. Votes show interest but are biased toward vocal users. I combine them with segment and usage data, and explain publicly how we prioritise."
- **"What if support and sales say opposite things?"**
  "They see different customers. Support sees existing users' pain, sales sees prospects' needs. I weigh both against our strategy and goals."
- **"How often do you review feedback?"**
  "Themes weekly with the team, a monthly summary for stakeholders, and quarterly in roadmap planning."

#### What senior interviewers look for
- Building **organisation-wide feedback systems**.
- Turning feedback into **strategic insight**, not a request queue.
- Aligning **sales, support and product** around shared customer understanding.

#### Practise it
1. Read 50 reviews of a product you know and tag them by theme.
2. Identify the top three underlying problems, and which customer segment each affects.
3. Write a one-page "voice of the customer" summary, and present it **out loud in 3 minutes**.

## A competitor just launched the feature you were planning — what do you do?
- id: po-product-sense-16
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: competition, strategy, differentiation

### Prompt
You were about to start building a major feature, and a competitor just launched something very similar. What do you do?

### Answer
#### What the interviewer is really testing
- Whether you **react calmly and strategically** or panic.
- Whether you focus on **your customers** rather than copying competitors.
- Your ability to **learn from a competitor's launch**.
- Whether you think about **differentiation**.

#### Key points
- **Don't panic, and don't automatically copy or abandon.**
- **Learn**: study their version, customer reactions and gaps.
- **Revisit your own evidence**: does the customer problem still matter to *your* users?
- Decide: **build as planned**, **differentiate**, **accelerate**, or **deprioritise**.
- Focus on **your strategy and strengths**, not feature parity.
- **Communicate** with stakeholders and sales to avoid knee-jerk reactions.

#### Model answer
"First, I wouldn't panic. A competitor launching something similar often **validates** that the problem is real, and it gives us free information.

**1. Learn from their launch:**
- Sign up and use their feature in depth.
- Read customer reactions: reviews, social media, forums, and what our sales team hears.
- Look for **gaps**: what's missing, confusing or poorly executed? Who is it really for?

**2. Revisit our own evidence:**
- Is the problem still important to *our* customers? Do we have data showing demand (requests, churn reasons, research)?
- Are our customers likely to switch because of this? I'd check with sales and customer success whether anyone has mentioned it.

**3. Decide on a response.** Options:
- **Build as planned**, if our research shows a strong need and our approach is better for our users.
- **Differentiate**: use what we learned to solve the problem better or for a different segment. For example, if their version is complex and aimed at large businesses, we could focus on simplicity for small businesses.
- **Accelerate**, if there's a real risk of losing customers. Ship a focused first version sooner.
- **Deprioritise**, if it turns out our customers don't care much, or the competitor's move is a distraction from our strategy.

**Example.** Suppose we planned **automated expense categorisation** in our finance app, and a competitor launched it first. After testing it, I find it's accurate for common merchants but poor for small local businesses, and reviews complain users can't correct mistakes easily. Our research shows our users care most about accuracy and control. So we'd differentiate: launch with an easy correction flow that learns from each correction, and market it around 'categorisation that learns how *you* work.'

**4. Communicate.** I'd brief stakeholders and sales on the competitor's feature, our analysis and our plan, so we don't get pulled into reactive 'copy them now' requests. I'd also give sales talking points.

**5. Keep perspective.** Customers rarely switch because of one feature. They switch when a product consistently solves their problems better. Our strategy should be based on our customers and strengths, not on matching every competitor move."

#### Another worked example: deciding not to follow
"A competitor launched a social feed in their banking app. Stakeholders asked whether we should do the same.
- Our research showed customers valued privacy and simplicity.
- Reviews of the competitor's feed were mixed, with privacy concerns.
- We chose not to follow, and instead invested in faster, simpler payments. Our app rating improved while the competitor later reduced the feed's prominence."

#### Response options
| Option | When | Risk |
|---|---|---|
| Build as planned | Strong evidence; better approach | Seen as copying if not differentiated |
| Differentiate | Clear gaps in their version | Requires real insight |
| Accelerate | Real churn or deal risk | Rushed quality |
| Deprioritise | Customers don't care; off-strategy | Missing a real shift |

#### A third worked example: accelerating in response
"A competitor launched instant payouts for sellers on their marketplace, and within a month several of our high-volume sellers asked about it, with two threatening to leave.
- **Assessment**: payout speed was a performance feature for high-volume sellers, so the churn risk was real.
- **Decision**: accelerate. We shipped a limited version (instant payouts for sellers above a volume threshold, for a small fee) in six weeks, instead of the planned two quarters.
- **Differentiation**: we added a clear earnings dashboard, which the competitor lacked.
- **Result**: none of the high-volume sellers left, and 30% of eligible sellers used instant payouts within two months, creating a new revenue stream."

#### How to analyse a competitor's feature quickly
- **Use it** yourself, end to end.
- **Read reviews** and social posts in the first weeks after launch.
- **Ask sales and support** what customers mention.
- **Note gaps**: who it serves poorly, what's missing, what's confusing.
- **Check pricing and positioning**: how do they talk about it?

#### Step-by-step framework
1. **Stay calm**; see it as information.
2. **Study** their feature and customer reactions.
3. **Revisit** your customer evidence.
4. **Choose**: build, differentiate, accelerate or deprioritise.
5. **Communicate** the analysis and plan.
6. **Keep focus** on your strategy.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We need to copy it immediately." | Analyses calmly and decides strategically |
| "Cancel our plans." | Revisits evidence before deciding |
| Ignores the competitor | Learns from their launch |
| Feature parity mindset | Focus on differentiation and customers |
| No communication | Briefs stakeholders and sales |

#### Useful phrases
- "This validates that the problem is real, and gives us free research."
- "What do our customers need, and where does their version fall short?"
- "Customers rarely switch because of one feature."
- "We'll differentiate by…"

#### Common pitfalls
- **Panic copying**, without understanding customers.
- **Abandoning a good plan** because someone got there first.
- **Ignoring competitors entirely.**
- **Chasing feature parity** instead of strategy.

#### Follow-ups to expect (with sample answers)
- **"How do you track competitors?"**
  "A regular light-touch review: their release notes, reviews, pricing pages, and what sales and support hear. I share a short summary monthly."
- **"What if the CEO wants to copy it?"**
  "Share the analysis: what customers say, where their version falls short, and our differentiated plan, with a timeline."
- **"When is copying the right move?"**
  "When a feature has become a basic expectation in the market and lacking it loses deals or customers. Then we match it efficiently and differentiate elsewhere."

- **"How do you avoid overreacting to every competitor launch?"**
  "Have a clear strategy and target customer, track competitors calmly, and act only when evidence shows customer impact or a shift in expectations."
- **"How would you respond if sales says 'we're losing deals because of this'?"**
  "Ask for specifics (which deals, how much, how often it's the deciding factor), validate with lost-deal data, then decide based on the scale of impact."

#### What senior interviewers look for
- **Strategic positioning** and differentiation.
- **Calm leadership** that prevents reactive roadmaps.
- Understanding of **competitive dynamics** and basic expectations versus differentiators (Kano).

#### Practise it
1. Pick two competing products you know, and compare how each solves one problem.
2. Write a differentiation strategy for the weaker one.
3. Explain **out loud in 3 minutes** how you'd respond if the stronger one launched a new feature.

## How would you price a new product or feature?
- id: po-product-sense-17
- round: PRODUCT_SENSE
- difficulty: hard
- levels:
- tags: pricing, monetisation, business model

### Prompt
We're launching a new premium feature. How would you decide how to price it?

### Answer
#### What the interviewer is really testing
- Whether you understand the main **pricing approaches** and their trade-offs.
- Whether you start from **customer value** and willingness to pay.
- Your **business acumen**: costs, margins, positioning, packaging.
- Whether you **test and iterate** on pricing.

#### Key points
- Three main approaches:
  - **Cost-plus**: cost plus a margin. Simple, but ignores value.
  - **Competitor-based**: price relative to alternatives.
  - **Value-based**: price based on the value customers get. Usually the best basis.
- Decide **how to package** it: add-on, new tier, usage-based, bundle.
- Research **willingness to pay**: interviews, surveys (e.g. Van Westendorp), experiments.
- Consider **positioning**, **costs**, **cannibalisation** of existing plans, and **existing customers**.
- **Test** and iterate. Pricing is rarely right first time.
- Work with **finance, sales and marketing**.

#### Model answer
"I'd base pricing on the value customers get, informed by costs and alternatives, and test it before fully committing.

Say we're adding **automated payment reminders and late-fee collection** to an invoicing product.

**1. Understand the value.**
- How much does it save or earn customers? If it reduces average days to payment from 35 to 25, what's that worth to a small business in cash flow and time saved chasing?
- Which segments get the most value? Businesses with many invoices and frequent late payers get more.

**2. Know the costs and alternatives.**
- **Costs**: what does each reminder or payment cost us (email, SMS, payment processing)? This sets our floor.
- **Alternatives**: what do customers do today (chase manually, use a debt collection service)? What do competitors charge for similar features?

**3. Choose a packaging model:**
- **Add-on**: a monthly fee on top of existing plans.
- **Higher tier**: include it in a 'Pro' plan with other premium features.
- **Usage-based**: e.g. per reminder, or a percentage of late fees collected.

For small businesses, I'd lean toward including it in a **Pro tier**, because it's simple to understand and encourages upgrades. A usage-based option might suit businesses with very variable volumes.

**4. Research willingness to pay:**
- **Interviews** with target customers about how they value faster payment.
- **Pricing surveys**, e.g. the **Van Westendorp** method: asking at what price it would seem too cheap, a bargain, getting expensive, and too expensive, to find an acceptable range.
- **Experiments**: test different price points for new customers on the pricing page, or offer the upgrade at different prices to different groups (being careful about fairness and legal rules).

**5. Consider wider effects:**
- **Cannibalisation**: will customers downgrade or switch plans?
- **Existing customers**: grandfather them, or give them a trial period.
- **Positioning**: does the price fit our brand (simple and affordable versus premium)?
- **Sales**: is it easy for sales and support to explain?

**6. Launch, measure and iterate.** Metrics: upgrade rate, revenue per customer, churn after upgrade, and feature usage among paying customers. Review after a quarter and adjust.

For example, the result might be: a Pro tier at £8 more per month than the standard plan, including reminders and late-fee collection, with a 30-day free trial for existing customers."

#### Another worked example: usage-based pricing
"For an API product sending SMS messages:
- **Value** scales with usage, and costs (SMS carrier fees) scale too.
- **Model**: pay per message with volume discounts, plus a monthly minimum for business plans.
- **Considerations**: predictable bills matter to customers, so we'd add spending alerts and caps.
- **Metrics**: revenue per customer, gross margin per message, churn due to bill shock."

#### Pricing approaches
| Approach | How | Pros | Cons |
|---|---|---|---|
| Cost-plus | Cost + margin | Simple; covers costs | Ignores value; leaves money on the table |
| Competitor-based | Relative to rivals | Market-aligned | Copies others' mistakes; ignores your value |
| Value-based | Based on customer value | Captures value; aligns with customers | Needs research |
| Freemium | Free basic, paid premium | Wide adoption | Conversion can be low |
| Usage-based | Pay per use | Scales with value | Unpredictable bills |
| Tiered | Good / better / best plans | Serves different segments | Complexity if too many tiers |

#### Step-by-step framework
1. **Understand customer value** by segment.
2. **Know costs** (floor) and **alternatives** (reference points).
3. **Choose packaging**: add-on, tier, usage, bundle.
4. **Research willingness to pay**.
5. **Consider wider effects**: cannibalisation, existing customers, positioning.
6. **Launch, measure, iterate.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Look at what competitors charge." | Starts from customer value, using competitors as reference |
| Cost-plus only | Uses costs as a floor, not the basis |
| Picks a number | Researches willingness to pay and tests |
| Ignores existing customers | Plans for existing customers and cannibalisation |
| Sets and forgets | Measures and iterates |

#### Useful phrases
- "I'd start from the value customers get: what does faster payment mean for them?"
- "Costs set the floor; value sets the ceiling."
- "Packaging matters as much as the price itself."
- "We'd test price points before rolling out widely."

#### Common pitfalls
- **Cost-plus pricing** that ignores value.
- **Copying competitors** without considering your positioning.
- **Not researching** willingness to pay.
- **Too many plans and options**, which confuse customers.
- **Upsetting existing customers** with sudden changes.

#### Follow-ups to expect (with sample answers)
- **"How would you handle existing customers when raising prices?"**
  "Communicate early and clearly, explain the added value, give notice, and consider grandfathering or a transition period, especially for loyal customers."
- **"Freemium or free trial?"**
  "Freemium suits products with network effects or low cost to serve, where free users spread the product. Free trials suit products whose value is clear quickly but expensive to serve indefinitely."
- **"What's price anchoring?"**
  "Showing a higher-priced option to make the middle option seem better value. It's common in three-tier pricing pages."

#### What senior interviewers look for
- Pricing as **strategy**: positioning, segmentation, growth.
- Partnering with **finance and sales** on monetisation.
- Understanding of **unit economics** and long-term revenue impact.

#### Practise it
1. Pick a feature from a product you use and estimate the value it gives a typical customer.
2. Propose a price and packaging model, with reasoning.
3. Design a simple test to validate it, and explain your approach **out loud in 5 minutes**.

## Build, buy or partner?
- id: po-product-sense-18
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: build vs buy, vendors, partnerships, strategy

### Prompt
Your product needs a new capability, for example identity verification. How do you decide whether to build it yourselves, buy a third-party solution or partner with another company?

### Answer
#### What the interviewer is really testing
- **Strategic thinking**: what's core to your competitive advantage?
- Your ability to compare options on **cost, time, risk, control and quality**.
- Awareness of **total cost of ownership** and vendor risks.
- How you **evaluate vendors** and involve engineering, legal and security.

#### Key points
- **Build** when the capability is **core to your differentiation**, or no good solution exists.
- **Buy** when it's **commodity** (not a differentiator), and good solutions exist.
- **Partner** when another company brings capabilities, customers or distribution you can't easily get.
- Compare: **time to market**, **total cost of ownership** (not just build cost), **quality and expertise**, **control and flexibility**, **risk** (vendor lock-in, compliance, reliability), **strategic value**.
- Evaluate vendors on **features, reliability, security, compliance, pricing, support and exit options**.

#### Model answer
"My first question would be: **is this capability part of how we win?**

For **identity verification** in a fintech app, it's essential, but for most companies it's not their differentiator. Customers choose us for our product, not because we verify identity in a special way. Specialist providers also bring expertise in fraud, document types and regulation that would take us years to build.

**Comparing the options:**
- **Build**:
  - Full control and no per-check fees.
  - But months or years to build well, ongoing maintenance, keeping up with fraud techniques and regulations across countries, and specialist hiring.
- **Buy** (a verification provider):
  - Live in weeks, proven accuracy, regulatory expertise, coverage of many document types and countries.
  - But per-check costs, less control over the experience, and dependency on the vendor.
- **Partner**: e.g. with a bank or identity network that already verifies customers, if one exists in our market and offers commercial or customer benefits.

**Total cost of ownership.** Building isn't just the initial development. It's maintenance, infrastructure, compliance updates, fraud monitoring and people. Buying is per-check fees plus integration and vendor management. I'd compare over 3 years, at expected volumes.

**Decision for identity verification**: in most cases, **buy**. Then I'd run a careful **vendor evaluation**:
- **Accuracy and pass rates** (how many genuine customers pass first time).
- **Coverage**: countries and document types we need.
- **User experience**: speed, mobile flow, accessibility, customisation.
- **Reliability and support**: uptime commitments, response times.
- **Security and compliance**: certifications, data storage location, GDPR.
- **Pricing** at our expected volumes, and contract terms.
- **Exit options**: can we switch providers if needed, and how hard is it?

I'd involve engineering (integration effort), security, legal and compliance in the evaluation, and run a **pilot** with one or two vendors before committing.

**When I'd build instead**: if verification were our core product, if volumes made vendor costs very high and we had the expertise, or if no vendor met our requirements."

#### Another worked example: when to build
"A logistics company considered buying a route-optimisation tool. But efficient routing was **core to their competitive advantage**: it determined delivery cost and speed, and they had unique data about their network. Generic tools couldn't use that data well. They built a custom solution, starting with a vendor tool for most routes while building their own for the highest-volume regions, then gradually replaced it."

#### Build versus buy versus partner
| Factor | Build | Buy | Partner |
|---|---|---|---|
| Strategic differentiation | Best when core | Best when commodity | When it extends your reach |
| Time to market | Slow | Fast | Medium |
| Upfront cost | High | Low | Varies |
| Ongoing cost | Maintenance, people | Fees | Revenue share or fees |
| Control | Full | Limited | Shared |
| Risk | Delivery and skills | Vendor lock-in, outages | Dependence on partner's priorities |

#### Step-by-step framework
1. **Is it core** to your competitive advantage?
2. **Compare** time, total cost, quality, control, risk.
3. **Calculate total cost of ownership** over 3+ years.
4. **Evaluate vendors or partners** against clear criteria.
5. **Involve** engineering, security, legal and finance.
6. **Pilot** before committing, and plan your exit options.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Building is cheaper long-term." | Calculates total cost of ownership, including maintenance |
| "Always buy; it's faster." | Asks whether the capability is a differentiator |
| No vendor criteria | Clear evaluation criteria and a pilot |
| Ignores lock-in | Considers exit options and vendor risk |

#### Useful phrases
- "Is this part of how we win, or a necessary capability?"
- "Building it isn't just the initial cost. There's ongoing maintenance and compliance."
- "I'd compare total cost of ownership over three years at our expected volumes."
- "Before committing, we'd pilot with one or two vendors."

#### Common pitfalls
- **Underestimating build and maintenance costs.**
- **Building commodity capabilities** out of pride ("not invented here").
- **Ignoring vendor lock-in** and exit costs.
- **Choosing vendors only on price.**
- **Not involving security and legal.**

#### Follow-ups to expect (with sample answers)
- **"How do you reduce vendor lock-in?"**
  "Isolate the vendor behind our own internal interface, keep our own copy of important data where allowed, and check contract terms for data export and termination."
- **"What if the vendor has an outage?"**
  "Plan fallbacks: a secondary vendor for critical capabilities, a manual process, or a graceful message to users with a retry."
- **"How do you evaluate a partnership?"**
  "Strategic fit, mutual value, customer overlap, technical integration, commercial terms, and alignment of priorities."

#### What senior interviewers look for
- Clarity on **core versus context** (what differentiates versus what's necessary).
- **Vendor and partnership strategy** across the organisation.
- **Financial rigour** in total cost of ownership.

#### Practise it
1. For a product you know, list five capabilities and classify each as core or commodity.
2. For one commodity capability, write vendor evaluation criteria.
3. Explain a build-versus-buy decision **out loud in 4 minutes**.

## How would you launch a new product (go-to-market)?
- id: po-product-sense-19
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: go-to-market, launch, cross-functional

### Prompt
Your team has built a new feature that's ready to launch. How do you plan and run the launch?

### Answer
#### What the interviewer is really testing
- Whether you see a launch as more than **"deploying the code"**.
- **Cross-functional coordination**: marketing, sales, support, operations, legal.
- **Risk management**: staged rollouts, monitoring, rollback plans.
- Whether you **measure** launch success and follow through after launch.

#### Key points
- Launch planning starts **weeks before** release.
- **Define goals and audience** for the launch.
- Choose a **launch tier** based on importance (e.g. major, medium, minor), which determines effort.
- **Prepare internal teams**: support, sales, marketing, operations.
- **Staged rollout** with monitoring and a rollback plan.
- **Communicate** to customers through the right channels.
- **Measure** adoption and outcomes, and **iterate**.

#### Model answer
"I'd treat the launch as a project in its own right, starting a few weeks before release.

Say we're launching **automatic payment reminders** in our invoicing product.

**1. Define launch goals and audience.**
- **Goal**: 25% of active customers enable reminders within 60 days, with average days to payment reduced for those customers.
- **Audience**: all customers, with focus on those who invoice frequently and have late-paying clients.

**2. Decide the launch tier.** Not every launch needs the same effort:
- **Tier 1 (major)**: big features or new products: press, campaigns, events.
- **Tier 2 (medium)**: significant features: email, in-app announcements, blog post, sales enablement.
- **Tier 3 (minor)**: small improvements: release notes only.

Reminders would be **Tier 2**.

**3. Prepare internal teams (2–4 weeks before):**
- **Support**: training, help articles, FAQs, known limitations, how to escalate issues.
- **Sales and customer success**: talking points, demos, which customers to tell first.
- **Marketing**: messaging focused on the customer benefit ('Get paid faster, without awkward chasing'), emails, blog post, in-app announcement.
- **Legal and compliance**: approve reminder wording and any late-fee rules.
- **Operations**: capacity for any increase in support contacts or payments.

**4. Roll out safely:**
- Release behind a **feature flag**: internal users first, then a **beta group** (e.g. 5% of customers), then everyone.
- **Monitor**: errors, email delivery rates, support tickets, unsubscribes from recipients.
- **Rollback plan**: we can turn the feature off instantly if something goes wrong.
- **Go/no-go checklist** before each stage.

**5. Communicate to customers:**
- **In-app**: a message where users create invoices, with a one-click setup.
- **Email** to frequent invoicers.
- **Help centre** article and short video.
- **Release notes.**

**6. Measure and follow through:**
- Track **adoption** (enablement rate), **usage**, and **outcomes** (days to payment), plus guardrails (unsubscribes, complaints).
- **Collect feedback** in the first weeks (in-app survey, support themes).
- Review at **2 weeks** (any problems?) and **60 days** (did we hit the goal?).
- **Iterate**: improve onboarding to the feature if adoption is low.
- **Share results** with the team and celebrate.

A good launch is the start of the feature's life, not the end of the project."

#### Another worked example: a B2B launch with sales
"For an enterprise reporting module:
- **Early access**: 10 design-partner customers used it for 6 weeks before launch, giving feedback and case studies.
- **Sales enablement**: training sessions, a demo environment, pricing guidance and objection handling.
- **Launch**: announced at a customer webinar, with case studies from design partners.
- **Measurement**: pipeline influenced, adoption among existing enterprise accounts, and expansion revenue."

#### Launch checklist
| Area | Key items |
|---|---|
| Goals | Adoption and outcome targets; audience |
| Tier | Major / medium / minor |
| Support | Training, help articles, FAQs, escalation |
| Sales & success | Talking points, demos, target customers |
| Marketing | Messaging, channels, timing |
| Legal & compliance | Approvals |
| Technical | Feature flags, staged rollout, monitoring, rollback |
| After launch | Metrics, feedback, review dates, iteration |

#### Step-by-step framework
1. **Goals and audience.**
2. **Launch tier.**
3. **Prepare internal teams.**
4. **Staged rollout** with monitoring and rollback.
5. **Customer communication.**
6. **Measure, gather feedback, iterate.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We deploy it and tell customers." | Plans weeks ahead with all functions |
| Support finds out from customers | Support trained before launch |
| Launches to everyone at once | Staged rollout with monitoring and rollback |
| No success measures | Clear adoption and outcome goals |
| Moves on after launch | Reviews results and iterates |

#### Useful phrases
- "The launch starts weeks before the release date."
- "Support should never learn about a feature from customers."
- "We'll release behind a feature flag and expand in stages."
- "A launch is the start of the feature's life, not the end."

#### Common pitfalls
- **Treating launch as deployment only.**
- **Unprepared support and sales teams.**
- **Big-bang launches** without monitoring.
- **Messaging about features, not benefits.**
- **Not measuring** after launch.

#### Follow-ups to expect (with sample answers)
- **"Who owns the launch?"**
  "Usually the PO coordinates it with product marketing, with clear owners for each area. In larger companies, product marketing may lead go-to-market."
- **"What if adoption is low after launch?"**
  "Diagnose: are people aware of it, do they understand the value, is setup too hard? Then improve onboarding, messaging or placement."
- **"How do you decide launch timing?"**
  "Avoid busy periods for customers and support, align with marketing calendars, and make sure the team is available to respond after launch (e.g. not on a Friday afternoon)."

#### What senior interviewers look for
- **Go-to-market strategy** for major launches and new products.
- Strong **partnership with product marketing and sales**.
- **Launch processes** reusable across teams.

#### Practise it
1. Pick a feature and plan its launch using the checklist above.
2. Write the customer message (one sentence focused on the benefit).
3. Explain your launch plan **out loud in 4 minutes**.

## How do you write a product brief or one-pager?
- id: po-product-sense-20
- round: PRODUCT_SENSE
- difficulty: easy
- levels:
- tags: product brief, PRD, documentation, alignment

### Prompt
How do you document a new initiative before the team starts building it? What goes into a good product brief?

### Answer
#### What the interviewer is really testing
- Whether you can **communicate clearly in writing**.
- Whether your documents focus on **problems, goals and evidence**, not just features.
- Whether documentation **aligns people** and supports decisions.
- Whether you keep documents **lightweight and alive**, not heavy specifications.

#### Key points
- A **product brief** (or one-pager, or lightweight PRD) explains **why, what and how we'll measure success** before work starts.
- Core sections: **problem, evidence, users, goals and metrics, scope (in and out), solution ideas, risks and open questions, timeline and stakeholders**.
- Keep it **short** (one to two pages) and readable.
- **Collaborate** on it with design and engineering; it's a living document.
- Use it to **align stakeholders** and **make decisions**.

#### Model answer
"I write a short product brief, usually one to two pages, before significant work starts. Its purpose is to make sure everyone understands **why we're doing this, what success looks like, and what's in and out of scope**.

**What goes into it**, using payment reminders as an example:

1. **Problem**: 'Small business customers struggle with late payments. On average, invoices are paid 35 days after issue, versus 30-day terms. Chasing payments is time-consuming and uncomfortable.'
2. **Evidence**: data (days to payment, support tickets mentioning late payment), research (6 of 8 interviewed customers chase manually by text and find it awkward), and churn reasons.
3. **Target users**: sole traders and small businesses sending 5+ invoices a month.
4. **Goals and metrics**:
   - Primary: reduce average days to payment by 5 days for customers using reminders.
   - Supporting: 25% of active customers enable reminders within 60 days.
   - Guardrails: recipient unsubscribe rate below 1%, no increase in complaints.
5. **Scope**:
   - **In**: automatic email reminders on a default schedule, editable wording, on/off per invoice, a 'pay now' link.
   - **Out (for now)**: SMS reminders, late fees, custom schedules per client.
6. **Solution ideas**: early concepts or designs, if any. The team will explore further.
7. **Risks and open questions**: Will users worry about damaging client relationships? Email deliverability? Legal review of wording?
8. **Dependencies and stakeholders**: legal (wording), support (training), marketing (launch).
9. **Timeline and milestones**: discovery done by X, beta by Y, launch by Z.
10. **Decisions log**: key decisions and why, added as we go.

**How I use it:**
- I draft it, then review it with the designer and tech lead, who add risks, options and estimates.
- I share it with stakeholders for feedback and alignment before committing.
- It becomes the **reference point** during development: when new requests arrive, we check them against the goals and scope.
- I keep it **updated**: scope changes, decisions and results after launch.

**Why short?** People actually read short documents. Detail lives in user stories, designs and technical notes linked from the brief."

#### Another worked example: Amazon-style press release
"Some companies use a **'working backwards'** approach (popularised by Amazon): writing a short press release and FAQ as if the product has already launched. For reminders, the headline might be: 'Small businesses now get paid 5 days faster with automatic payment reminders.' Writing it forces clarity about the customer benefit before building anything, and the FAQ surfaces tough questions early (pricing, risks, edge cases)."

#### Product brief template
| Section | Key question |
|---|---|
| Problem | What problem are we solving, for whom? |
| Evidence | How do we know it's real and important? |
| Users | Who exactly is this for? |
| Goals and metrics | How will we measure success? |
| Scope | What's in, and what's explicitly out? |
| Solution ideas | What options are we exploring? |
| Risks and questions | What could go wrong; what don't we know? |
| Dependencies | Who else is involved? |
| Timeline | Key milestones |
| Decisions log | What did we decide, and why? |

#### Step-by-step framework
1. **Start with the problem and evidence.**
2. **Define users, goals and metrics.**
3. **Set scope**, including what's out.
4. **List risks and open questions.**
5. **Collaborate** with design and engineering.
6. **Align stakeholders.**
7. **Keep it updated.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| A 20-page specification | A focused one- to two-page brief |
| Starts with features | Starts with problem and evidence |
| No metrics | Clear goals, metrics and guardrails |
| No "out of scope" section | Explicit in and out of scope |
| Written once, never updated | Living document with a decisions log |

#### Useful phrases
- "The brief explains why we're doing this and how we'll know it worked."
- "I always include what's out of scope. It prevents a lot of confusion later."
- "I draft it, then shape it with design and engineering."
- "When new requests come in, we check them against the brief."

#### Common pitfalls
- **Long, unread specifications.**
- **Jumping to features** without the problem.
- **No measurable goals.**
- **Writing alone**, without design and engineering input.
- **Letting it go out of date.**

#### Follow-ups to expect (with sample answers)
- **"How is a brief different from user stories?"**
  "The brief explains the why and the overall scope. User stories break the work into small, buildable pieces."
- **"Do you always write one?"**
  "For significant initiatives, yes. For small improvements, a well-written story is enough."
- **"How do you get stakeholders to read it?"**
  "Keep it short, put the summary at the top, and walk key stakeholders through it in a short meeting."

#### What senior interviewers look for
- **Writing as a leadership tool** for alignment across teams.
- Strategy documents and **working-backwards** methods for bigger bets.
- A culture of **documented decisions**.

#### Practise it
1. Write a one-page brief for a feature in a product you know, using the template.
2. Ask a friend to read it and explain the goal back to you. If they can't, simplify it.
3. Present it **out loud in 3 minutes**.
