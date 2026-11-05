# Product Owner — Product Sense

## How would you improve a product you use every day?
- id: po-product-sense-01
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: product improvement, user empathy, framework

### Prompt
Pick a product you use every day. How would you improve it? Walk me through your thinking, not just the idea.

### Answer
#### What the interviewer is really testing
- Whether you think **from users and goals to solutions**, or jump straight to features.
- Whether you can **structure an open-ended problem** out loud, under time pressure.
- Your **product judgement**: can you prioritise, define success and spot risks?
- Your communication: can the interviewer follow your reasoning easily?

The idea itself matters much less than how you got there. A modest idea reached through clear reasoning beats a brilliant idea pulled out of the air.

#### Key points
- Pick a product you **genuinely use and know well**, with a clear core purpose (e.g. Spotify, Google Maps, WhatsApp, a banking app, Duolingo). Avoid products so niche the interviewer can't follow.
- **Say your structure up front** ("I'll start with the goal, pick a user group, find their pain points, prioritise one, propose a solution and define how we'd measure it"). This makes you easy to follow.
- Always **state assumptions** when you don't know something ("I'll assume the company cares most about retention").
- Narrow down: **one user segment, one problem, one solution**, done well.
- End with **metrics and risks**. This is what separates product people from people with opinions.

#### Model answer
"I'll use **Spotify**, since I use it every day. Let me lay out how I'll approach it: I'll clarify the goal, pick a user segment, look at their pain points, choose one to focus on, propose a solution with a small first version, and then cover how we'd measure success and what could go wrong.

**1. Goal.** For a subscription business like Spotify, the most important things are usually **retention** and **listening time**, because engaged users renew and recommend it. I'll assume the goal is to increase weekly listening time without hurting retention.

**2. Users.** Spotify has several distinct groups:
- *Casual background listeners*, who put on a playlist while working or cooking.
- *Music enthusiasts*, who actively discover new artists and build playlists.
- *Podcast listeners*.
- *Families* on shared plans, with very different tastes in one account.

I'll focus on **casual background listeners**. They're the largest group, and they're the most at risk of switching to a free or bundled alternative like YouTube Music or Apple Music, because they're not emotionally attached to their library.

**3. Pain points for casual listeners.** From my own use and from what friends complain about:
1. **Repetition**: generated playlists keep returning to the same 50 songs, so the music gets stale.
2. **Effort to start**: when I'm busy, it takes too many taps to get something suitable playing.
3. **Context mismatch**: an upbeat workout song plays during a quiet dinner.

**4. Prioritise.** I'll compare them on reach (how many users), severity (how much it hurts listening time) and fit with Spotify's strengths:
- Repetition affects nearly every casual listener, directly causes skipping and stopping, and Spotify has the best recommendation data in the industry, so it's a strong fit.
- Effort to start is real, but partly solved by widgets and voice assistants.
- Context mismatch is important but harder to solve well.

So I'd focus on **repetition**.

**5. Solution.** I'd explore three ideas:
- A **'familiar ↔ fresh' slider** on generated playlists, letting the user choose how much new music they want.
- **Automatic resting**: if I skip a song several times in a week, it's rested for a month.
- A weekly **'fresh mix'** made only of songs I haven't heard in the last 90 days.

For a first version, I'd pick **automatic resting**. It needs no new interface, it's easy to A/B test, and it targets the exact behaviour (skipping) that signals the problem. The slider could come later if resting works.

**6. Metrics.**
- **Primary:** weekly listening minutes per casual listener in the test group compared with control.
- **Supporting:** skip rate on generated playlists, sessions per week, 30-day retention.
- **Guardrail:** the 'save' rate shouldn't drop, since that would mean we're replacing songs people love with songs they don't.

**7. Risks.**
- We might rest songs people skip for situational reasons (wrong moment, not wrong song). I'd exclude songs that are saved or manually replayed.
- More variety means more royalties spread across more artists. The finance team would want to understand any impact on payouts.

If the test showed a meaningful lift in listening time, I'd roll it out and then test the slider as a next step for users who want more control."

#### Another worked example: a B2B product (Slack)
"For Slack, the goal I'd assume is **team retention and expansion**, since revenue comes from companies paying per seat.

- **User segment:** new employees joining a company that already uses Slack.
- **Pain point:** they're added to 40 channels on day one and feel overwhelmed. They miss important messages in the noise, or mute everything and miss what matters.
- **Solution:** a 'getting started' view for the first two weeks that highlights the 5 channels most relevant to the person's team, a daily digest of important messages, and a gentle prompt to leave inactive channels.
- **Metrics:** new-user weekly active rate at day 30, messages sent in the first two weeks, and the share of new users who mute more than half their channels (we want this to drop). Guardrail: no drop in overall workspace activity.

Notice the structure is identical to the Spotify answer. Only the context changes. That's the point: a good framework transfers to any product."

#### Step-by-step framework
1. **Pick the product** and give a one-line description of what it's for.
2. **Clarify the goal**: engagement, retention, revenue or acquisition. State your assumption.
3. **Segment the users** into 3–4 groups and **choose one**, explaining why.
4. **List 3 pain points** for that group, based on real behaviour.
5. **Prioritise** one, using reach × severity × strategic fit.
6. **Brainstorm 2–3 solutions**, then pick one and define a **small first version**.
7. **Define metrics**: one primary, a few supporting, at least one guardrail.
8. **Name the risks** and what you'd do next if it works.

Aim for about **8–10 minutes** in total, unless the interviewer wants to go deeper on one part.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd add dark mode and better recommendations." | Starts with the goal and a specific user group before any idea |
| Tries to fix everything for everyone | Focuses on one segment and one problem, with a reason |
| "Users would like it" | Grounds pain points in observed behaviour (skipping, muting) |
| No measurement | One primary metric, supporting metrics and a guardrail |
| Ignores downsides | Names risks and how to mitigate them |
| Rambles without structure | States the structure up front and signposts each step |

#### Useful phrases
- "Before I jump into ideas, let me clarify what we're trying to achieve."
- "I'll assume the main goal is retention. Let me know if you'd like me to optimise for something else."
- "I'm going to focus on this group because…"
- "Of these three pain points, I'd prioritise the first because it has the widest reach and the clearest link to our goal."
- "For a first version, I'd keep it small so we can test it quickly."
- "To know if this worked, I'd look at… and I'd make sure we don't hurt…"

#### Common pitfalls
- **Jumping straight to a feature** without a user or goal.
- **Solving for everyone**, which produces vague answers.
- **No prioritisation**: listing 10 ideas without choosing one.
- **Only vanity metrics** (downloads, page views) or no metrics at all.
- **Picking a product you don't really use**: the first follow-up question exposes it.
- **Proposing something unrealistic** for the company (e.g. "Spotify should make its own music").

#### Follow-ups to expect (with sample answers)
- **"How would you validate this before building it?"**
  "I'd start with existing data: how often do casual listeners skip the same song repeatedly? Then a few user interviews about why they skip. If the signal is strong, an A/B test on a small percentage of users is cheap, because automatic resting needs no new interface."
- **"What if the A/B test shows no change?"**
  "First I'd check the test had enough users to detect a realistic effect, and whether resting actually triggered for many people. Then I'd look at segments: it may help heavy users but not light ones. If it truly does nothing, I'd stop and revisit the other pain points."
- **"How would this affect artists?"**
  "More variety spreads plays across more songs, which could help smaller artists but slightly reduce plays for the biggest hits. I'd involve the partnerships team early."
- **"What would you do if you were PO here tomorrow?"**
  "Spend the first weeks listening: data, user research, the team and stakeholders. Then validate whether repetition is really as big a problem as I believe."

#### What senior interviewers look for
- Linking the improvement to **company strategy** ("Spotify is investing heavily in personalisation, so this builds on a core advantage").
- **Second-order effects**: royalty costs, artist relationships, impact on other features.
- **Sequencing**: what ships first, how you'd learn from it, and what comes next.
- **Trade-off clarity**: what you're deliberately *not* doing and why.

#### Practise it
1. Pick **three products** you use daily: one consumer app, one work tool, one physical or service product (e.g. a supermarket's self-checkout).
2. For each, set a timer for **10 minutes** and walk through the framework **out loud**, ideally recording yourself.
3. Play it back and check:
   - Did I state the goal and an assumption?
   - Did I pick one user group and explain why?
   - Did I prioritise one pain point explicitly?
   - Did I define a small first version?
   - Did I give a primary metric, supporting metrics and a guardrail?
   - Did I mention at least one risk?
4. Repeat until you can do it without notes, then practise with a friend who asks follow-up questions.

## Design a product for a specific user group
- id: po-product-sense-02
- round: PRODUCT_SENSE
- difficulty: hard
- levels:
- tags: product design, user research, MVP

### Prompt
Design a grocery-shopping product for elderly people living alone. How would you approach it?

### Answer
#### What the interviewer is really testing
- Whether you **start from users and their needs**, not from features or technology.
- **Empathy** for people who are different from you.
- Whether you can **narrow a broad brief** into a focused, testable first version.
- Awareness of **practical constraints**: accessibility, trust, safety and business viability.

#### Key points
- Begin with **clarifying questions**: who is building this, what's the business goal, where are the users, and what does "elderly" mean here?
- **Segment** the user group. "Elderly people" covers very different needs and abilities.
- Identify **problems before solutions**, and prioritise them.
- End with a focused **MVP**, a **validation plan** with real users, and **metrics**.
- Show **inclusive design** thinking (large text, simple flows, alternatives to apps).

#### Model answer
"Let me start with a few clarifying questions, because they change the answer a lot.
- *Who's building it?* An existing supermarket, a startup or a charity? I'll assume an **existing UK supermarket chain** that already does home delivery and wants to serve older customers better.
- *What's the business goal?* I'll assume it's to grow loyal, repeat customers in this segment, while living up to the brand's community values.
- *Who exactly are the users?* I'll define them as people aged 70+, living alone, managing their own shopping.

**1. Understand the users.** I'd break this group into segments with different needs:
- **Independent but less mobile**: comfortable with a phone, but carrying heavy bags or travelling to the store is hard.
- **Low digital confidence**: may own a smartphone or tablet but find apps confusing and worry about making mistakes or being scammed.
- **Supported**: a family member or carer helps them, often remotely.

I'll focus on the first two. They're the majority, and current grocery apps (designed for young, busy shoppers) serve them poorly.

**2. Their problems.** From research I'd want to run, and what's commonly reported:
1. **Apps are overwhelming**: small text, too many choices, promotions everywhere, hidden menus.
2. **Rebuilding the same basket every week** is tedious. Most of them buy very similar items each time.
3. **Delivery anxiety**: confusing slot booking, worry about missing the driver, and heavy bags left at the door.
4. **Fear of mistakes**: ordering 12 bottles of milk instead of 1, or entering card details somewhere unsafe.
5. **Isolation**: shopping is sometimes their main social contact, so a purely digital service could make loneliness worse.

**3. Prioritise.** The biggest barrier to them using a service at all is **complexity and anxiety** (problems 1, 3 and 4). Repetition (2) is the biggest everyday frustration once they're using it. So my MVP should make the whole thing feel simple and safe.

**4. Solution ideas:**
- **'My usual shop'**: a one-tap way to repeat the regular basket, with easy swaps and a clear total.
- **Simple mode**: large, high-contrast text, a maximum of 3–4 options per screen, no promotional clutter, and a confirmation step that reads the order back in plain language.
- **A fixed weekly delivery slot**, the same day and time every week, with a phone call or text 30 minutes before arrival, and drivers who carry bags into the kitchen.
- **Phone ordering**: a friendly number to call, backed by the same system, for people who'd rather talk.
- **Trusted helper**: a family member can review or adjust orders remotely.

**5. MVP.** I'd start with **'My usual shop' plus a fixed weekly delivery slot with a reminder call**, inside a simplified mode of the existing app. That tackles the biggest everyday friction and the delivery anxiety, without building a new app or a call centre. Phone ordering and trusted helpers would be next if the MVP shows demand.

**6. Validate before and during building:**
- **Interviews and observation** with 8–10 older shoppers, ideally recruited through community centres or a charity like Age UK. I'd watch them use the current app and note exactly where they struggle.
- **Paper or clickable prototypes** tested with the same group, because they'll reveal confusing language and layout quickly.
- A **pilot** with 100–200 existing customers over 70 in one region.

**7. Metrics:**
- **Primary:** weekly repeat-order rate among pilot users.
- **Supporting:** time to complete an order, the share of orders placed using 'My usual shop', delivery success rate (no missed deliveries), and a simple satisfaction rating after each delivery.
- **Guardrails:** support calls per order shouldn't rise, and complaints about incorrect orders should stay low.

**8. Risks:**
- **Scams and safeguarding**: older customers are often targeted by fraud. I'd never ask for card details over the phone or by text, and the call centre would follow safeguarding procedures.
- **Cost of service**: carrying bags inside and reminder calls cost money, so I'd model whether higher loyalty and order frequency cover it."

#### Another worked example: a different brief
**"Design a fitness product for busy new parents."** The same approach applies:
- **Clarify**: an app, a gym service or a wearable? I'll assume an app.
- **Segment**: parents of newborns (little sleep, unpredictable time) versus parents of toddlers (slightly more routine), and postnatal recovery needs versus general fitness.
- **Problems**: no predictable free time, guilt about taking time for themselves, physical recovery after birth, low energy.
- **MVP**: 10-minute workouts that can be paused at any moment, can be done with a baby nearby, and include a postnatal-safe track reviewed by physiotherapists.
- **Metrics**: workouts completed per week, 4-week retention. Guardrail: injury-related feedback.

The structure stays the same: **clarify → segment → problems → prioritise → MVP → validate → metrics → risks**.

#### Step-by-step framework
1. **Clarify** who's building it, the business goal and the user definition.
2. **Segment** the users and pick 1–2 segments, with reasons.
3. **List problems** (aim for 4–5) grounded in real behaviour.
4. **Prioritise**: which problem most blocks adoption or causes the most pain?
5. **Generate solutions**, then choose a focused **MVP**.
6. **Plan validation** with real users before heavy investment.
7. **Define metrics**: primary, supporting and guardrails.
8. **Cover risks**: ethical, safety, operational and financial.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd build an app with big buttons." | Starts by understanding who the users are and what problems they have |
| Treats "elderly people" as one group | Segments them by ability, confidence and support |
| Lists 15 features | Picks a focused MVP and explains why |
| Designs for yourself | Plans research with real older users |
| Ignores safety | Considers scams, safeguarding and vulnerable users |
| No business view | Considers cost of service and whether loyalty pays for it |

#### Useful phrases
- "Can I ask a few clarifying questions first? The answer depends a lot on who's building this."
- "'Elderly people' covers very different needs, so let me break that down."
- "I'd want to validate this with real users before committing engineering time."
- "For the first version I'd deliberately leave out X, because…"
- "Because these users may be vulnerable, I'd build in safeguards such as…"

#### Common pitfalls
- **Designing for yourself**: assuming older users behave like you.
- **No clarifying questions**, so the answer goes in a direction the interviewer didn't intend.
- **A long feature list** with no prioritisation or MVP.
- **Ignoring accessibility** (text size, contrast, cognitive load, hearing and vision).
- **Forgetting non-digital options**: some users will never be comfortable with an app.
- **No validation plan**.

#### Follow-ups to expect (with sample answers)
- **"How would you recruit users for research?"**
  "Partner with charities like Age UK, community centres and GP surgeries, plus existing customers over 70 who opt in. I'd make sessions in-person and comfortable, and pay people for their time."
- **"You only have one engineer for a quarter. What do you build?"**
  "'My usual shop' within the existing app. It reuses order history, so it's mostly front-end work, and it delivers the biggest everyday value."
- **"What would make you stop the project?"**
  "If after the pilot, repeat orders don't improve compared with similar customers, or if the cost of service per order is far above what the extra loyalty brings in."
- **"How do you design for someone with poor eyesight?"**
  "Large default text that can go larger, high contrast, no information conveyed only by colour, clear labels instead of icons alone, and support for the phone's own accessibility features."

#### What senior interviewers look for
- **Business viability**: cost to serve, customer lifetime value and how this fits the company's strategy.
- **Inclusive design** as a principle, not an afterthought.
- **Ethics and safeguarding** for vulnerable users.
- A clear **validation and rollout plan**: research → prototype → pilot → scale.

#### Practise it
1. Practise with these briefs, **15 minutes each**, out loud:
   - "Design a banking product for teenagers."
   - "Design a product to help people find volunteering opportunities."
   - "Design a car-sharing product for a small rural town."
2. For each, check:
   - Did I ask 2–3 clarifying questions?
   - Did I segment the users and choose one segment?
   - Did I list problems before solutions?
   - Did I define a focused MVP?
   - Did I explain how I'd validate it with real users?
   - Did I cover metrics and at least one ethical or practical risk?

## Users are dropping off during onboarding — what do you do?
- id: po-product-sense-03
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: onboarding, activation, funnel analysis, diagnosis

### Prompt
Our data shows that 60% of new users drop off before finishing onboarding. How would you investigate and fix this?

### Answer
#### What the interviewer is really testing
- Whether you **diagnose before you prescribe**, or jump to a fix.
- Your comfort with **data** (funnels, segmentation) and with **qualitative research**.
- Whether you understand the difference between **completing onboarding** and **becoming an active user**.
- Your ability to turn findings into **testable experiments**.

#### Key points
- **Question the number first**: is 60% actually bad for this kind of product? Is the data right?
- **Break the funnel down step by step** to find *where* people leave.
- **Segment** to find *who* leaves (platform, channel, country, device).
- Use **qualitative research** to understand *why*.
- **Fix and test**, measuring activation and retention, not just completion.

#### Model answer
"I'd work through this in four stages: confirm the problem, find where and who, understand why, then fix and test.

**1. Confirm the problem.**
- **Is the data right?** I'd check that tracking fires correctly on every onboarding step and every platform. A broken event on Android can make it look like everyone drops at step 3.
- **Is 60% actually bad?** For many consumer apps, 40–60% onboarding completion is normal. For a product where users have already paid, it would be alarming. I'd look at how the rate has changed over time and compare with industry benchmarks where available.
- **When did it start?** If completion suddenly fell from 55% to 40% two weeks ago, I'd look at what changed then: a release, a marketing campaign, a new market.

**2. Find where and who.**
- **Step-by-step funnel.** Let's say onboarding has five steps: sign up → verify email → set up profile → connect bank account → first action. If the funnel shows 90% → 70% → 65% → 30% → 25%, the big cliff is **connecting a bank account**. That's where to focus.
- **Segments:**
  - *Platform*: iOS, Android, web. A cliff on one platform only suggests a bug or design issue there.
  - *Acquisition channel*: users from paid social ads might drop at 80%, while referrals drop at 30%. That suggests the ads attract the wrong people or promise something different from the product.
  - *Country, device and app version.*

**3. Understand why.**
- **Session recordings** (e.g. Hotjar, FullStory, or the mobile equivalents) of users who abandon at the cliff. You often see confusion immediately: people hunting for a button, re-reading text, or bouncing at an error.
- **Short exit survey** when users leave at that step: one question, "What stopped you from continuing?", with a few options and a free-text box.
- **5–8 user interviews** with people who started but didn't finish.
- **Technical checks**: error rates, loading times, third-party failures (e.g. the bank-connection provider timing out).

**4. Fix and test.** Common root causes and fixes:
- **Asking too much too early** → defer non-essential steps (progressive profiling). Let users do something valuable before asking for effort.
- **Unclear value** → show what they'll get before asking for commitment, e.g. a preview of insights from a demo account before connecting a real bank.
- **Trust concerns** → at the bank-connection step, explain clearly why it's needed, that it's read-only, and that it's regulated and secure.
- **Technical friction** → better error messages, retry options and alternatives (e.g. manual entry if bank connection fails).
- **Wrong users** → work with marketing so ads match what the product actually does.

I'd run **A/B tests** on the top one or two hypotheses. The key metrics:
- **Onboarding completion rate**, the immediate measure.
- **Activation**: did users reach the moment where they get real value (e.g. saw their first spending insight)?
- **Week-1 and week-4 retention**: making onboarding easier is pointless if people churn a few days later.

**Example result.** Suppose session recordings show people abandoning at bank connection because they don't trust it. We test a version that explains the security clearly and lets users explore a demo first. Completion at that step rises from 46% to 61%, and week-4 retention is unchanged, which tells us we're bringing in genuinely interested users, not just pushing people through."

#### Another worked example: a B2B SaaS product
"In a project-management tool, imagine trial accounts drop off before inviting their team.
- **Funnel**: sign up → create first project → invite teammates → teammates active. The cliff is at *invite teammates* (only 25% invite anyone).
- **Why**: interviews show trial users don't want to invite colleagues until they're sure the tool is good, because it's socially risky to recommend a tool that turns out to be bad.
- **Fix**: let users experience team features with a realistic demo project and sample teammates first, and give them a ready-made message to send that explains why they're inviting people.
- **Metrics**: share of trials that invite at least 2 teammates, trial-to-paid conversion. Guardrail: support tickets about confusion with demo data."

#### Step-by-step framework
1. **Validate the data** and the benchmark.
2. **Funnel analysis**: find the cliff.
3. **Segmentation**: platform, channel, country, version.
4. **Qualitative research**: recordings, surveys, interviews.
5. **Hypotheses**: why are people leaving?
6. **Experiments**: test the top hypotheses.
7. **Measure** completion, activation and retention.
8. **Monitor**: set up dashboards and alerts so you catch problems early.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd simplify the onboarding." | Finds exactly where and why users drop off first |
| Treats 60% as one number | Breaks it down by step and segment |
| Only looks at data | Combines data with recordings and interviews |
| Optimises completion only | Measures activation and retention too |
| Removes steps without thinking | Checks whether steps exist for legal or fraud reasons |

#### Useful phrases
- "Before fixing anything, I'd want to know exactly where in the flow people leave."
- "The data tells us *where* people drop off. Research tells us *why*."
- "Completion isn't the real goal. Activation and retention are."
- "I'd check with compliance before removing that step, since it may be a legal requirement."

#### Common pitfalls
- **Jumping straight to solutions** ("make the form shorter").
- **Not segmenting**: different user groups often behave very differently.
- **Optimising completion at the expense of quality**: pushing uninterested users through just moves the drop-off to later.
- **Removing steps that exist for regulatory or fraud reasons** without involving compliance.
- **Not checking for bugs and tracking errors** first.

#### Follow-ups to expect (with sample answers)
- **"What if there isn't one obvious cliff?"**
  "Then the issue is probably overall effort or unclear value. I'd test a shorter flow that gets users to a valuable moment faster, and look at the experience as a whole rather than one step."
- **"How long would you run the A/B test?"**
  "Long enough to reach the sample size I calculated in advance, and at least one full week to cover weekday and weekend behaviour. If retention is a key metric, I'd keep monitoring for several weeks after."
- **"What is the activation moment for our product?"**
  "I'd look for the early action most strongly linked to long-term retention. For example, users who connect a bank and view one insight in week one may be three times more likely to still be active after 3 months. I'd confirm it with data."
- **"How would you prioritise between fixes?"**
  "By expected impact on activation multiplied by confidence, divided by effort, starting with the cheapest high-impact change."

#### What senior interviewers look for
- Clear understanding of **activation versus completion**.
- **Cross-functional** work: data analysts, design, engineering, compliance, marketing.
- Turning a one-off investigation into a **repeatable system**: an onboarding dashboard, alerts and regular reviews.
- Understanding that **acquisition quality** and onboarding are linked.

#### Practise it
1. Draw the onboarding funnel for an app you use (e.g. a bank, Duolingo, a food-delivery app). List each step.
2. For each step, write down **two reasons** a user might leave and **how you'd confirm** each (data, recording, survey).
3. Practise explaining the full investigation **out loud in 8 minutes**.
4. Checklist:
   - Did I question the data and the benchmark?
   - Did I find the step and segment?
   - Did I use qualitative research?
   - Did I propose experiments?
   - Did I measure activation and retention, not just completion?

## How do you validate a new feature idea before building it?
- id: po-product-sense-04
- round: PRODUCT_SENSE
- difficulty: medium
- levels:
- tags: discovery, validation, experimentation, lean

### Prompt
Someone in leadership has an idea for a big new feature. How do you figure out whether it's worth building before committing the team?

### Answer
#### What the interviewer is really testing
- Whether you understand **product discovery**: reducing risk before spending engineering time.
- Whether you can work **constructively with senior stakeholders**, without blindly agreeing or blocking them.
- Your toolkit of **validation methods** and when to use each.
- Whether you set **success criteria before** you see results.

#### Key points
- Treat the idea as a **hypothesis**, not a decision.
- Understand the **problem behind the idea** first.
- Use the **four product risks** (from Marty Cagan's *Inspired*):
  - **Value**: will customers want it?
  - **Usability**: can they figure out how to use it?
  - **Feasibility**: can we build it with our technology, time and skills?
  - **Viability**: does it work for the business (legal, financial, brand)?
- **Test the riskiest assumption first**, with the cheapest method that gives a reliable answer.
- Agree **success criteria in advance** and share results openly.

#### Model answer
"I'd treat it as a hypothesis we can test, so the conversation with leadership becomes 'let's find out together' rather than yes or no.

**1. Understand the problem behind the idea.** I'd meet the leader and ask: what prompted this? Who is it for? What would success look like in six months? For example, if the CEO wants a **budgeting tool in our banking app**, the reason might be that competitors have one, or that customers are moving their salaries to other banks. Knowing the real goal (e.g. 'become customers' main bank') opens up other solutions too.

**2. List the assumptions.** For the budgeting tool:
- **Value**: customers want to budget inside their banking app, rather than in spreadsheets or separate apps.
- **Usability**: they'll understand and maintain budget categories.
- **Feasibility**: we can categorise transactions accurately enough.
- **Viability**: it increases salary deposits or reduces churn enough to justify building and maintaining it.

**3. Identify the riskiest.** Here, I'd say value and feasibility are the biggest unknowns. If customers don't care or categorisation is poor, nothing else matters.

**4. Test cheaply:**
- **Existing data**: how many customers already export transactions? What do app reviews and support tickets say about budgeting?
- **Customer interviews**: 6–10 conversations about how they currently manage money. I'd ask about past behaviour ('Tell me about the last time you tried to save for something'), not hypothetical questions ('Would you use a budgeting tool?').
- **Fake-door test**: add a 'Budgets (coming soon)' entry in the app for a small percentage of users. Measure how many tap it and how many join a waitlist.
- **Prototype test**: a clickable Figma prototype tested with 5 customers to check whether they understand it.
- **Technical spike**: an engineer spends 2–3 days testing how accurately we can categorise a sample of real transactions.

**5. Set success criteria before testing.** For example:
- At least 6% of users who see the fake door tap it, and at least 30% of those join the waitlist.
- At least 4 out of 5 prototype testers complete the main task without help.
- Categorisation accuracy is at least 85% on the sample.

**6. Decide and share.** After about two weeks, I'd present the results to leadership with a clear recommendation:
- **Build**: the signals are strong, so here's the MVP scope and plan.
- **Pivot**: there's interest, but in a different form (e.g. customers want automatic savings pots rather than budgets).
- **Stop**: the evidence doesn't support it, and here's what we learned.

This approach respects the leader's idea, protects the team from building something nobody uses, and keeps the decision grounded in evidence."

#### Another worked example: a B2B context
"A sales director wants an **AI-powered proposal generator** in our CRM.
- **Problem behind it**: sales reps spend 4–5 hours a week writing proposals.
- **Riskiest assumptions**: reps trust AI-written proposals enough to send them (value), and output quality is good enough (feasibility).
- **Cheap tests**:
  - A 'concierge' test: for two weeks, a person generates proposals for five reps using existing AI tools. Do reps use and send them, and how much do they edit?
  - Measure time saved and the share of proposals sent with minimal edits.
- **Success criteria**: reps send at least 60% of generated proposals with light edits, saving at least 2 hours a week.
- **Result**: if met, build an integrated MVP. If reps rewrite everything, the problem may be templates and content, not writing."

#### Validation methods: when to use which
| Method | Tests mainly | Cost | Best when |
|---|---|---|---|
| Existing data analysis | Value | Very low | You have usage, support or review data |
| Customer interviews | Value, problem | Low | Early, to understand the problem |
| Surveys | Value (at scale) | Low | Measuring how widespread a problem is |
| Fake-door test | Value (demand) | Low | Testing real interest with real users |
| Prototype test | Usability | Low–medium | Before building the interface |
| Concierge / Wizard of Oz | Value, viability | Medium | Testing the full experience manually |
| Technical spike | Feasibility | Medium | Technical uncertainty is high |
| Pilot / beta | All four | High | Final validation before full rollout |

#### Step-by-step framework
1. **Understand the goal and problem** behind the idea.
2. **List assumptions** across the four risks.
3. **Rank by risk**: which, if wrong, kills the idea?
4. **Pick the cheapest reliable test** for each top risk.
5. **Set success criteria** before running tests.
6. **Run the tests** in a short time-box (1–3 weeks).
7. **Decide**: build, pivot or stop, and share the evidence.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd ask customers if they want it." | Observes behaviour and past actions, not hypothetical opinions |
| Treats the leader's idea as an order | Treats it as a hypothesis and explores the problem behind it |
| Tests the easiest thing | Tests the riskiest assumption first |
| Decides success after seeing results | Agrees success criteria in advance |
| Discovery drags on for months | Time-boxes validation to a few weeks |

#### Useful phrases
- "I'd love to understand what's behind this idea. What are we hoping it achieves?"
- "Let's treat it as a hypothesis and find out within two weeks whether it holds up."
- "The riskiest assumption here is…, so I'd test that first."
- "Before we run the test, let's agree what result would convince us to build it."
- "The evidence suggests a slightly different direction: here's what customers actually told us."

#### Common pitfalls
- **Asking customers "Would you use this?"** People are bad at predicting their own behaviour and tend to be polite.
- **Testing the easiest assumption** instead of the riskiest.
- **No success criteria**, so any result can be spun as positive.
- **Using validation to block leadership**, which damages trust.
- **Endless discovery** with no decision.

#### Follow-ups to expect (with sample answers)
- **"What if leadership insists on building it anyway?"**
  "I'd make the risks clear, then propose the smallest version that tests the idea in production, with agreed metrics and a review date. Then I'd execute it fully and report back honestly."
- **"How do you avoid analysis paralysis?"**
  "Time-box discovery, and match effort to risk. Small, reversible changes can often just be shipped and measured, so heavy validation is for big, expensive or hard-to-reverse bets."
- **"How many interviews are enough?"**
  "Usually 5–8 per user segment reveal the main patterns. When you stop hearing new things, you have enough for that question."

#### What senior interviewers look for
- **Continuous discovery**: regular weekly contact with customers, not one-off research projects.
- **Managing senior stakeholders** constructively and building trust with evidence.
- **Proportionality**: knowing when *not* to validate.
- Coaching the **team** to run discovery themselves (engineers and designers joining interviews).

#### Practise it
1. Pick three feature ideas (e.g. "a social feed in a banking app", "offline mode for a note-taking app", "a loyalty programme for a coffee chain").
2. For each, write:
   - The problem behind it.
   - One assumption for each of the four risks.
   - The riskiest assumption.
   - The cheapest test for it, with a numeric success criterion.
3. Practise explaining one end-to-end **out loud in 7 minutes**.

## Tell me about a product you admire and why
- id: po-product-sense-05
- round: PRODUCT_SENSE
- difficulty: easy
- levels:
- tags: product taste, analysis, communication

### Prompt
What's a product you really admire? Why is it good, and what would you change about it?

### Answer
#### What the interviewer is really testing
- **Product taste**: can you recognise good product decisions and explain *why* they work?
- Depth of thinking: going beyond "it's easy to use" to user problems, design choices and the business model.
- **Critical thinking**: can you see trade-offs and weaknesses in a product you like?
- Passion and curiosity about products in general.

#### Key points
- Choose a product you **genuinely use and know deeply**. You'll be asked follow-up questions.
- A slightly less obvious choice (not just "the iPhone" or "Google") shows curiosity, but a popular product is fine if your analysis is sharp.
- Cover: **the problem it solves → what it does brilliantly and why → small design details → business model → one improvement with metrics**.
- Prepare **two products** in advance (one consumer, one work-related or B2B) in case the interviewer asks for a different type.

#### Model answer
"I really admire **Monzo**, the UK digital bank.

**The problem it solved.** Traditional banks made it hard to understand your own money. Statements were days behind, merchant names were cryptic codes like 'TFL*TRAVEL CH', and doing anything (freezing a card, sending money abroad) involved phone queues or branch visits. Many people felt anxious and out of control.

**What it does brilliantly, and why it matters:**
1. **Instant, clear notifications** for every payment, with the merchant's real name and logo. This turned 'checking my balance' from a source of anxiety into reassurance, and it built daily engagement for free.
2. **Pots**: you can separate money for bills, savings or a holiday, with rules like 'round up every purchase'. Budgeting becomes visual and automatic, without spreadsheets.
3. **Designed for stressful moments**: one-tap card freezing when you lose your card, clear fees when you travel, and in-app chat with real people. They obviously thought hard about the moments when customers are most worried.
4. **Transparency**: they publicly shared their roadmap and asked customers for feedback in a community forum in the early days, which built trust and loyalty.

**Small details that show deep thinking.** Splitting a bill with friends directly from a transaction. Showing where you spent money on a map. Gambling blocks that you can turn on yourself, with a delay before turning them off. That last one shows real care for vulnerable customers.

**Business model.** The distinctive coral card was a talking point that drove word-of-mouth growth, keeping acquisition costs low. Monzo makes money from card interchange fees, lending, premium subscriptions and business accounts, monetising the most engaged customers.

**What I'd change.** As Monzo has added more products (investments, pensions, loans, insurance), the app has become more crowded. A new customer opening it can feel overwhelmed. I'd explore a **personalised home screen** that adapts to life stage: a student sees budgeting and bill-splitting first, while someone who just moved home sees savings goals and bills. I'd test it with new users and measure:
- Activation: new users setting up at least one Pot in their first month.
- Feature discovery: use of relevant features within 30 days.
- Guardrail: no drop in satisfaction among long-time users, who may dislike changes to a layout they know."

#### Another worked example: a B2B product (Figma)
"I admire **Figma**.
- **Problem**: design files lived on individual computers, were emailed around, and developers and product managers struggled to see the latest version.
- **What it does brilliantly**: it runs in the browser, so anyone can open a link with no installation. Real-time collaboration (seeing others' cursors) made design a team activity, and developer handoff became simpler.
- **Business model**: free for individuals, paid for teams. Every shared link exposed new people to Figma, so growth was built into the product.
- **What I'd change**: large files become slow, and enterprise customers struggle to keep design systems consistent across many teams. I'd invest in performance and design-system governance, measuring load times and how often teams use approved components."

#### Step-by-step framework
1. **One-line description** of the product and who it's for.
2. **The problem** it solved, and what life was like before.
3. **2–3 things it does brilliantly**, each with the user impact.
4. **A small detail** that shows deep product thinking.
5. **Business model and growth**: how it makes money and spreads.
6. **One improvement**, with who it's for, what it is and how you'd measure it.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It's really easy to use and looks nice." | Explains which user problem it solves and why the design works |
| Lists features | Explains the impact of each feature on users |
| Only praise | Includes a thoughtful criticism and improvement |
| No business view | Covers business model and growth |
| A product they rarely use | A product they know deeply and can discuss in detail |

#### Useful phrases
- "What I find clever about this is…"
- "Before this product, people had to… which was painful because…"
- "This small detail shows they really understand their users."
- "The trade-off they've made is… which works for most users, but not for…"
- "If I were the PO, I'd explore… and I'd measure success by…"

#### Common pitfalls
- **Only describing features** without explaining why they matter.
- **Choosing a product you don't use**: follow-up questions expose it immediately.
- **No criticism**: every product has weaknesses, and spotting them shows maturity.
- **Talking for too long**: keep it to about 3–5 minutes unless asked for more.

#### Follow-ups to expect (with sample answers)
- **"How would you measure whether your change worked?"**
  "An A/B test with new users: activation in the first 30 days as the primary metric, feature discovery as supporting, satisfaction of existing users as the guardrail."
- **"Who are their competitors, and how should they respond?"**
  "Starling, Revolut and the traditional banks' improving apps. Monzo should keep its lead in experience and trust, and grow lending and premium products carefully, without making the app cluttered."
- **"What would you do in your first 90 days as PO for this product?"**
  "Learn: data, customers, the team, and current goals. Find the biggest opportunities, then agree a focused plan with stakeholders."
- **"What's a product you dislike?"**
  Have a balanced answer ready: explain the user problem it fails to solve, without being dismissive of the people who built it.

#### What senior interviewers look for
- Insight into **strategy and trade-offs**: why the company made its choices given its constraints (regulation, costs, competition).
- Understanding of **competitive advantage**: what makes the product hard to copy.
- A view on **where the product should go next**, and the risks of getting there.

#### Practise it
1. Prepare **two products**: one consumer, one B2B or work tool.
2. For each, write one sentence for every step of the framework above.
3. Practise saying it **out loud in 4 minutes**.
4. Ask a friend to challenge you with "Why?" after every claim. If you can answer three levels of "why", you're ready.

## How would you define a product vision and strategy?
- id: po-product-sense-06
- round: PRODUCT_SENSE
- difficulty: hard
- levels: senior
- tags: vision, strategy, leadership, alignment

### Prompt
You've just joined as a Senior Product Owner for a product that has no clear direction. How would you create a product vision and strategy, and get people behind it?

### Answer
#### What the interviewer is really testing
- Whether you understand the difference between **vision, strategy and roadmap**.
- Whether you **gather evidence** before forming a view, or impose your own ideas.
- **Leadership without authority**: getting buy-in from leadership, stakeholders and the team.
- Your ability to make **hard trade-offs**. A strategy is as much about what you won't do.

#### Key points
- **Vision**: the future you're creating for customers (3–5 years), short and inspiring.
- **Strategy**: how you'll get there and win, the few big bets and the explicit trade-offs.
- **Roadmap and OKRs**: the near-term plan and measurable outcomes.
- **Listen first**: customers, data, stakeholders, the team and company strategy.
- **Co-create and socialise**: vision is adopted, not announced.
- **Revisit regularly**: strategy is a hypothesis that new evidence can change.

#### Model answer
"I'd approach it in three phases over roughly my first 6–8 weeks: listen and learn, draft, then align and launch.

**Phase 1: Listen and learn (weeks 1–3).**
- **Stakeholder interviews**: I'd meet leadership, sales, marketing, support, operations and engineering leads, and ask them all the same questions: what's working, what isn't, what do customers complain about, and what would success look like in two years? Asking everyone the same questions makes patterns and disagreements easy to see.
- **Customer research**: at least 10–15 conversations, including happy customers, unhappy customers and people who left. I'd also review support tickets, reviews and sales notes from lost deals.
- **Data**: usage trends, retention by segment, revenue by customer type, which features are used and which aren't.
- **Market**: competitors, trends and where the market is heading.
- **Company strategy**: what leadership needs from this product (growth, profit, retention or entering a new market), so the product vision supports the business.

**Phase 2: Draft the vision and strategy (weeks 3–5).**
Imagine a **B2B invoicing product for small businesses**, and that I found customers love the product once set up, but setup takes 3 weeks and many churn before then. Meanwhile, the team has been building large features for enterprise clients that few customers use.

- **Vision** (where we're going):
  > "Every small business owner can get paid on time and understand their cash flow in under five minutes a week."

  It's customer-centred, ambitious and memorable, and it doesn't mention features.

- **Strategy**, using Richard Rumelt's 'kernel' from *Good Strategy Bad Strategy*:
  - **Diagnosis** (the core challenge): "We lose most customers before they see value, because setup is slow and manual. And we've been spreading effort across small business and enterprise."
  - **Guiding policy** (our approach): "We'll win on **time-to-value for small businesses**. We'll focus entirely on making setup fast and automated, and pause enterprise-specific work."
  - **Coherent actions**: automated bank and accounting integrations, an onboarding assistant, and templates for common business types. Stop custom enterprise reporting.

- **Outcomes**:
  - North Star metric: number of small businesses sending at least 5 invoices a month.
  - OKRs for the next two quarters, e.g. reduce median setup time from 21 days to 3 days, and improve 90-day retention from 62% to 75%.

- **What we're not doing**: enterprise features, new markets, and a mobile app rewrite. Stating this explicitly is what makes it a real strategy.

**Phase 3: Align and launch (weeks 5–8).**
- **Pre-wire**: share the draft one-to-one with key stakeholders before any big meeting. People support what they've helped shape, and nobody should be surprised in a group setting.
- **Team workshop**: walk the team through the evidence and the draft, and ask them to challenge it. Engineers and designers often spot risks and opportunities I missed, and they leave owning the strategy.
- **Leadership review**: present the evidence, the vision, the strategy and the trade-offs, especially what we'll stop doing and what that means for any stakeholders affected (e.g. enterprise sales).
- **Turn it into a roadmap**: Now / Next / Later, with each item linked to a strategic pillar and an outcome.
- **Repeat it constantly**: in sprint reviews, planning, all-hands and stakeholder updates. Over-communicate, because a vision only works if people remember it and use it to make decisions.

**After launch.** I'd review progress against the OKRs monthly, and revisit the strategy quarterly. If evidence shows our diagnosis was wrong (e.g. setup gets faster but retention doesn't improve), we adapt."

#### Another worked example: a consumer product
"For a **fitness app** with declining engagement:
- **Diagnosis**: users start strong but drop off after 3 weeks, because workouts feel generic and motivation fades.
- **Vision**: 'Everyone has a coach that adapts to their life and keeps them going.'
- **Guiding policy**: win on **personalisation and habit-building**, not on having the largest workout library.
- **Coherent actions**: adaptive plans that change based on progress and schedule, streaks and gentle accountability, short workouts for busy days. Stop expanding the content library for now.
- **North Star**: weekly active users completing 3+ workouts. OKR: improve week-8 retention from 18% to 28%."

#### Vision versus strategy versus roadmap
| | Vision | Strategy | Roadmap / OKRs |
|---|---|---|---|
| Question | Where are we going? | How will we win? | What are we doing next? |
| Timeframe | 3–5 years | 1–2 years | 1–4 quarters |
| Format | One inspiring sentence | Diagnosis, policy, actions, trade-offs | Themes, outcomes, priorities |
| Changes | Rarely | When evidence changes | Regularly |

#### Step-by-step framework
1. **Listen**: stakeholders, customers, data, market, company goals.
2. **Diagnose** the core challenge.
3. **Write the vision**: customer-centred, short, inspiring.
4. **Define the strategy**: guiding policy, coherent actions, explicit "not doing".
5. **Set outcomes**: North Star and OKRs.
6. **Align**: one-to-ones, team workshop, leadership review.
7. **Translate** into a roadmap.
8. **Communicate** constantly and **revisit** regularly.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'd write a vision and present it." | Gathers evidence and co-creates the vision with others |
| Vision is a feature list | Vision describes the future for customers |
| Says yes to everything | States clearly what the team won't do |
| No metrics | Links strategy to a North Star metric and OKRs |
| One-off presentation | Ongoing communication and quarterly review |

#### Useful phrases
- "I'd spend my first few weeks listening before forming a view."
- "The diagnosis is the most important part. A strategy built on the wrong diagnosis fails no matter how well it's executed."
- "Just as important as what we'll do is what we'll stop doing."
- "I'd share drafts one-to-one first, so nobody is surprised in a big meeting."
- "This strategy is a hypothesis, and we'll review it every quarter against the evidence."

#### Common pitfalls
- **Writing the vision alone** and "unveiling" it, which earns no buy-in.
- **A vision that's really a feature list** ("build integrations and a mobile app").
- **No trade-offs**: a strategy that says yes to everything isn't a strategy.
- **Ignoring company strategy**: a product vision must support the business's goals.
- **Not connecting it to metrics**, so nobody knows whether it's working.
- **Communicating it once** and assuming everyone remembers.

#### Follow-ups to expect (with sample answers)
- **"What if leadership disagrees with your diagnosis?"**
  "I'd go back to the evidence with them: customer quotes, retention data, churn reasons. If we still disagree, I'd propose a time-boxed experiment to test both views, rather than arguing opinions."
- **"How do you handle stakeholders who lose out, like enterprise sales here?"**
  "Speak to them early and privately, explain the evidence and the reasoning, acknowledge the impact on them, and agree how existing enterprise customers will be supported. Often there's a clear point at which we'd revisit, e.g. once the small-business goals are met."
- **"How do you keep the team connected to the vision day to day?"**
  "Every roadmap item and sprint goal links to a strategic pillar, we review the North Star in sprint reviews, and I explain decisions using the strategy, e.g. 'we're not doing this because it doesn't help time-to-value'."
- **"How is product vision different from company mission?"**
  "The mission is why the company exists. The product vision is the specific future this product creates for its customers, in support of that mission."

#### What senior interviewers look for
- **Influence without authority**, at leadership level.
- **Comfort with ambiguity**: forming a clear view from incomplete information.
- **Courage to make trade-offs** and say no to good ideas that don't fit.
- **Organisational awareness**: who needs to be involved, and in what order.
- A strategy that is **measurable and revisited**, not a one-off document.

#### Practise it
1. Pick a product you know well (your current product, or a well-known app).
2. Write:
   - A one-sentence vision.
   - A diagnosis of its biggest challenge.
   - A guiding policy and three coherent actions.
   - Three things you'd stop doing.
   - A North Star metric and two OKRs.
3. Present it **out loud in 6–8 minutes**, then answer: "Why this and not something else?"
4. Bonus: practise how you'd explain the "stop doing" list to a stakeholder who loses out.
