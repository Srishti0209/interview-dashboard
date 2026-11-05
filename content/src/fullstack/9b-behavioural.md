# Full Stack Engineer — Behavioural & Bar Raiser (continued)

## A time you simplified an over-engineered system
- id: fs-behavioural-05
- round: BEHAVIORAL_BAR_RAISER
- difficulty: medium
- levels:
- tags: behavioural, STAR, simplicity, technical debt, influence, architecture

### Prompt
Tell me about a time you made a system simpler, for example removing a layer, a service or a tool that was costing more than it was worth. How did you decide, how did you convince others, and what was the result?

### Answer
#### What the interviewer is really testing
- **Engineering judgement**: can you tell when complexity isn't paying for itself?
- **Evidence over opinion**: did you measure the cost before proposing a change?
- **Influence without ego**: did you persuade people (often the original authors) respectfully?
- **Safe execution**: did you remove things without breaking production?
- **Valuing simplicity**: do you understand that every moving part has an ongoing cost?

#### Key points
- Choose something **real and meaningful**: an extra microservice, a custom framework, a caching layer, an event bus, a state-management library, or a deployment tool that slowed the team down.
- Show **respect for the original decision**. It probably made sense at the time; circumstances changed.
- Quantify the **cost of the complexity**: incidents, time to ship features, onboarding time, cloud costs, on-call load.
- Describe **how you built agreement**: a short write-up, data, a prototype, and involving the people who built it.
- Explain a **safe migration**: run both in parallel, move traffic in steps, keep a rollback path.
- End with **measured results** and the principle you took away.

#### Model answer
"Here's a sample answer showing the structure. Replace the details with your own story.

**Situation.** At a marketplace start-up with eight engineers, our product catalogue was split across **four microservices**: products, pricing, inventory and search indexing, each with its own database and deployment, talking over a message queue. It had been designed two years earlier when the plan was to grow to several teams. That growth never happened. One team of five owned all four services.

**Task.** I was a senior engineer on that team. Shipping even simple catalogue features was slow, and I wanted to find out whether the architecture was the cause and, if so, fix it.

**Action.**
1. **Measured the cost.** I went through the last quarter's work. Of 14 catalogue features, 11 needed changes in at least three services, with coordinated deployments. Median lead time was 9 days, against 3 days for features elsewhere in the product. Six of our nine production incidents that quarter were caused by messages arriving out of order or being dropped between services. And new engineers took about three weeks before they could ship a catalogue change alone.
2. **Talked to the original authors first.** Two of the people who designed the services were still at the company, one now our CTO. I met them before writing anything, to understand the original reasons: they'd expected separate teams and very different scaling needs for search. We agreed that the team structure hadn't happened, and that search really did have different needs.
3. **Proposed a targeted simplification, not a rewrite.** My write-up proposed merging products, pricing and inventory into **one service with one database** (a modular monolith, with clear internal modules so we could split again if needed), while keeping search indexing separate because it truly had different load and failure patterns. The queue between the merged services would become plain function calls inside database transactions, which removed the ordering problems entirely.
4. **De-risked with a prototype.** I spent a week merging pricing into products on a branch, to estimate the real effort and find surprises. It went smoothly, which made the plan credible.
5. **Migrated in steps.** Over six weeks, alongside feature work: first moved pricing data into the products database with dual writes and a nightly comparison job; switched reads once the comparison showed no differences for a week; then did the same for inventory. Each step had a feature flag and a rollback plan. Finally we deleted two services, two databases and about 40 queue topics.

**Result.**
- Median lead time for catalogue features dropped from 9 days to 4.
- Catalogue incidents went from six in the quarter before to one in the two quarters after.
- We saved about £1,800 a month in infrastructure, and onboarding to the catalogue took about a week instead of three.
- The CTO used the write-up as a template for reviewing other services.

**What I learned.** Complexity is often a bet on a future that didn't happen. The way to undo it is with data and respect, not 'this was a bad design'. And simplifying selectively, keeping the one boundary that still earned its place, made the proposal much easier to accept."

#### Another worked example: a frontend simplification
"Here's a sample answer showing the structure. Replace the details with your own story.

Our React app used a heavy global state library for everything, including server data, with about 120 action types and a lot of hand-written caching and loading-state code. After measuring that 70% of the store was really cached API data, I proposed moving server data to a data-fetching library with built-in caching and keeping a small store only for true UI state. I migrated one feature as a pilot and shared the before-and-after code with the team. Over two months we removed about 6,000 lines, and a class of 'stale data after save' bugs disappeared."

#### Step-by-step framework
1. **Situation**: the system and how it came to be complex.
2. **Cost**: measured pain (lead time, incidents, cost, onboarding).
3. **Original context**: why it was built that way; talk to the authors.
4. **Proposal**: a targeted simplification, keeping what still earns its place.
5. **Proof**: a prototype or pilot.
6. **Migration**: stepwise, reversible, verified.
7. **Result and principle.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "The old design was bad" | Explains why it made sense then and what changed |
| Opinion-based ("it felt complex") | Measured cost: lead time, incidents, money |
| Big rewrite | Targeted, stepwise simplification |
| Bypassed the original authors | Involved them early |
| Removed everything | Kept the boundary that still had value |
| Big-bang switch-over | Dual writes, comparison, flags, rollback |

#### Useful phrases
- "It was a reasonable bet at the time; the assumptions changed."
- "The complexity was costing us X in lead time and Y in incidents."
- "I spoke to the people who built it before proposing anything."
- "I kept search separate because it still had genuinely different needs."
- "Every step was reversible until we deleted the old services."

#### Common pitfalls
- **Disrespecting past decisions** or colleagues.
- **Simplifying for taste**, without evidence of real cost.
- **Replacing one complex system with another** (your favourite new tool).
- **Unsafe migrations** that risk data.
- **Ignoring the people side**: the original authors may feel criticised.

#### Follow-ups to expect (with sample answers)
- **"Isn't a monolith a step backwards?"**
  "Not for one team. Services make sense when independent teams need to deploy independently, or parts have very different scaling needs. We had neither, except for search, which we kept separate."
- **"How did you avoid ending up with a tangled monolith?"**
  "Clear internal modules with defined interfaces, a lint rule against importing another module's internals, and module ownership in code review."
- **"What if the CTO had disagreed?"**
  "I'd have asked what evidence would change their mind, and perhaps proposed a smaller pilot so we could compare. The decision was theirs to make; my job was to make the costs visible."
- **"When would you add complexity back?"**
  "When a measured need appears, for example a second team or a component with very different scaling needs."

#### What senior interviewers look for
- **Systems thinking**: seeing complexity as an ongoing cost.
- **Influence**: changing direction through evidence and relationships.
- **Execution safety** in migrations.
- **Humility**: no villain in the story.

#### Practise it
1. Think of a layer, service or tool you removed or simplified, and write down its measured cost.
2. Write a sentence explaining why it originally made sense.
3. Describe your migration steps and how each one was reversible.
4. Prepare an answer for "when would complexity have been justified?"

## Working with designers and product managers
- id: fs-behavioural-06
- round: BEHAVIORAL_BAR_RAISER
- difficulty: medium
- levels:
- tags: behavioural, STAR, collaboration, product, design, disagreement, stakeholders

### Prompt
Tell me about how you work with designers and product managers. Give an example of a time you disagreed with a design or product decision. How did you handle it, and what happened?

### Answer
#### What the interviewer is really testing
- **Collaboration**: do you treat product and design as partners, not ticket-writers?
- **Product sense**: can you engage with the user problem, not just the implementation?
- **Disagreeing well**: do you challenge with evidence and alternatives, then commit to the decision?
- **Communication of technical constraints** in language non-engineers understand.
- **Early involvement**: do you shape work before it reaches the build stage?

#### Key points
- Start with **how you normally work**: involved early in discovery, reviewing designs before they're final, sharing technical constraints and opportunities, demoing work in progress.
- For the disagreement, show you **understood their goal first**. Most disagreements are about *how*, not *what*.
- Bring **evidence and options**: data, a quick prototype, an estimate of cost, and at least one alternative that meets their goal.
- Explain technical constraints in **user and business terms** ("this adds two weeks and makes the page slower on mobile") rather than jargon.
- Show you can **disagree and commit**: if the decision goes against you, you build it well.
- Mention the **relationship afterwards**: you worked better together, or changed a process.

#### Model answer
"Here's a sample answer showing the structure. Replace the details with your own story.

**How I usually work.** I try to get involved at the problem stage, not the build stage. On my current team I join the product manager's discovery sessions every other week, review design drafts while they're still rough, and share early: 'this part is expensive, this other part is nearly free'. I demo half-built features to design every few days so we catch problems while they're cheap to fix.

**Situation.** At a travel booking company, our designer and product manager proposed a redesign of the search results page with **live price updates**: prices would refresh every few seconds while users browsed, to show that availability was changing and create urgency.

**Task.** I was the full stack engineer leading the build. I had concerns about cost, performance and whether it would actually help users, and I needed to raise them without just saying no.

**Action.**
1. **Understood the goal.** I asked the product manager what problem live prices would solve. The real issue was that about 12% of users who clicked a hotel saw a different price on the next page, because cached prices had gone stale. That caused frustration and drop-off. Live updates were one possible solution.
2. **Quantified the costs.** Live updates for every result would mean around 50 supplier price checks per user session instead of a handful, roughly tripling our supplier API costs, which were billed per request. It would also make the page jump around as prices changed, which our designer agreed could hurt usability and accessibility.
3. **Proposed alternatives that met the goal.** I suggested refreshing prices **only for the results visible on screen**, only when they were older than five minutes, and doing a **fresh price check when the user clicked** a result, showing a clear message if the price had changed. I built a rough prototype in two days so the designer could see how it felt.
4. **Tested instead of arguing.** The product manager still believed live updates might increase urgency and conversion. Rather than debate, we agreed to an A/B test: the full live version on a small slice of traffic against my approach.
5. **Committed to the test fully.** I built both versions properly, including the live one I'd argued against, so the test was fair.

**Result.**
- My approach reduced price mismatches from 12% to under 2% and increased booking conversion by 3.5%.
- The live-update version increased conversion by about the same amount, but at three times the supplier cost, and accessibility testing found the moving prices confusing with screen readers. The product manager chose the cheaper approach.
- Afterwards the product manager asked me to join planning for the next two quarters' roadmap, and we made 'engineering cost and constraints' a standard section in product briefs.

**What I learned.** Asking 'what problem are we solving?' turned a disagreement about a feature into a shared problem. And proposing a test, then building both sides properly, kept the relationship strong whichever way the result went."

#### Another worked example: when you lost the argument
"Here's a sample answer showing the structure. Replace the details with your own story.

A designer wanted a custom date picker instead of the browser's native one on our mobile booking form. I argued that native pickers were more accessible and quicker to build. The designer showed research that our users made frequent errors with the native picker for date ranges. We agreed on a custom picker for ranges only, with a strict accessibility checklist I wrote. It took longer, but date errors fell by 40%. I'd been right about the cost but wrong about the value, and I said so in our retrospective."

#### Step-by-step framework
1. **Your normal way of working**: early involvement, regular demos, sharing constraints.
2. **Situation**: the proposal and why you had concerns.
3. **Understand the goal**: the user or business problem behind the request.
4. **Evidence**: cost, performance, user impact, in plain language.
5. **Alternatives**: options that meet the same goal.
6. **Resolution**: test, decide together, or defer to the owner.
7. **Commit**: build the chosen option well.
8. **Result and relationship**: outcome and what changed in how you work together.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Product asked for something silly" | Assumes good intent, seeks the underlying goal |
| Says no to the request | Offers alternatives that meet the goal |
| Technical jargon | Costs explained in user and business terms |
| Wins the argument, damages the relationship | Resolves with data, relationship stronger |
| Builds the losing option half-heartedly | Builds whatever is chosen properly |
| Only involved at build time | Involved from discovery |

#### Useful phrases
- "What problem are we trying to solve for the user?"
- "Here's what that would cost, and here's an option that gets most of the value for less."
- "Could we test both rather than debate it?"
- "It's your call; here's the trade-off as I see it."
- "I was wrong about…, and I said so afterwards."

#### Common pitfalls
- **Engineer-versus-product framing**, or making the PM or designer look foolish.
- **Disagreeing without alternatives.**
- **Refusing to commit** once a decision is made.
- **Being too agreeable**: never raising concerns until it's too late.
- **No outcome**: the story ends at the disagreement.

#### Follow-ups to expect (with sample answers)
- **"What if they'd chosen live updates despite the cost?"**
  "I'd have made sure the cost was understood and recorded, then built it well, with monitoring on supplier spend so we could revisit it with real numbers."
- **"How do you push back on a deadline from product?"**
  "I show the scope that fits the date and the scope that doesn't, and let them choose. Fixed date, flexible scope is usually the answer."
- **"How do you handle a designer's spec that's technically hard?"**
  "Talk early, ask which parts matter most to them, and suggest cheaper ways to get the same effect. Often a small change in the design saves days."
- **"How do you keep design and engineering aligned during the build?"**
  "Frequent demos, a shared component library, and the designer reviewing the real thing in staging before release."

#### What senior interviewers look for
- **Partnership**: engineers as contributors to product decisions.
- **Product and business sense** in technical discussions.
- **Constructive disagreement** and genuine commitment.
- **Process improvements** that outlast the single story.

#### Practise it
1. Describe your normal working rhythm with product and design in three sentences.
2. Write a disagreement story with the goal, your evidence, your alternative and the outcome.
3. Prepare a second story where the decision went against you and you committed.
4. Practise explaining a technical cost in one sentence a non-engineer would understand.

## A production issue you debugged across the stack
- id: fs-behavioural-07
- round: BEHAVIORAL_BAR_RAISER
- difficulty: medium
- levels:
- tags: behavioural, STAR, debugging, incident, observability, on-call

### Prompt
Tell me about a production issue you debugged that crossed the frontend, backend and infrastructure. How did you find the cause, how did you handle the incident, and what changed afterwards?

### Answer
#### What the interviewer is really testing
- **Systematic debugging**: hypotheses, evidence and narrowing down, not guessing.
- **Cross-stack understanding**: can you follow a problem from the browser to the database and back?
- **Incident handling**: mitigating user impact first, communicating clearly, staying calm.
- **Root cause versus symptom**: did you fix the underlying cause?
- **Learning and prevention**: blameless review, monitoring, tests, process changes.

#### Key points
- Pick an incident where the cause was **not where it first appeared**. Those make the best cross-stack stories.
- Show the **order of priorities**: stop the bleeding (mitigate), then find the root cause, then prevent it happening again.
- Describe **how you narrowed it down**: which data you looked at (browser network logs, error tracking, server logs, traces, database metrics), what you ruled out and why.
- Mention **communication**: status updates to support and stakeholders, clear ownership.
- Give **numbers**: users affected, duration, time to mitigate.
- End with the **post-incident review** and concrete preventive actions.

#### Model answer
"Here's a sample answer showing the structure. Replace the details with your own story.

**Situation.** At an e-learning company, during the first week of a new term, support started getting reports that students were being **logged out in the middle of quizzes**, losing their answers. It affected roughly 8% of quiz sessions, at our busiest time of year.

**Task.** I was on call and took the incident as lead. My goals were to stop students losing work as fast as possible, then find and fix the cause.

**Action.**
1. **Mitigated first.** Before understanding the cause, I shipped a small frontend change that saved quiz answers to local storage every few seconds and restored them after re-login. It went out within two hours, so even if logouts continued, students stopped losing answers. I posted updates to the support channel every 30 minutes.
2. **Gathered evidence across the stack.** In the browser, our error tracking showed requests failing with 401 (unauthorised) responses, which triggered our logout logic. On the server, the 401s came from the token refresh endpoint, which was rejecting **valid refresh tokens**. Timing was the key clue: failures clustered at peak load and were much worse for students with several tabs open.
3. **Formed and tested hypotheses.**
   - Expired tokens? No: the tokens in the failing requests were well within their lifetime.
   - A bad deploy? No: the last auth change was three weeks earlier, and failures started only with the term's load.
   - A race condition? This fitted the multi-tab clue. We used **refresh token rotation**: each refresh issued a new refresh token and invalidated the old one. With two tabs, both would try to refresh at almost the same moment; the first succeeded, and the second presented the now-invalid token, which our security logic treated as possible theft and **revoked the whole session**.
4. **Explained why load mattered.** At peak, our auth database was slow, so refreshes took up to two seconds instead of 50 milliseconds. That widened the window for tabs to collide. Our database metrics confirmed the slowdown: a missing index on the sessions table, which only hurt once the table grew at the start of term.
5. **Fixed the root causes at each layer.**
   - **Frontend**: tabs now coordinated refreshes through a shared lock (using the browser's BroadcastChannel), so only one tab refreshed and the others used the new token.
   - **Backend**: we added a short grace period (about 30 seconds) during which the previous refresh token still worked once, which is a common pattern for rotation, while keeping theft detection for older tokens.
   - **Database**: we added the missing index (created concurrently to avoid locking), bringing refresh time back to 40 milliseconds at peak.
6. **Verified.** We reproduced the bug in staging with a script that opened several tabs under artificial database latency, confirmed each fix independently, then released them over two days.

**Result.**
- Answer loss stopped within two hours of the incident starting; logouts dropped from 8% of sessions to under 0.1% after the fixes.
- In the blameless review, we added alerts on the 401 rate and refresh latency, a load test for auth before each term, and a multi-tab scenario in our end-to-end tests.
- The auto-save turned out to be valuable on its own: it now recovers work after browser crashes too.

**What I learned.** The symptom appeared in the frontend, the trigger was in the backend's security logic, and the amplifier was in the database. Following the evidence rather than assuming the layer I knew best found all three. And mitigating user harm before root-causing was the right call: it bought us calm time to investigate properly."

#### Another worked example: a shorter incident
"Here's a sample answer showing the structure. Replace the details with your own story.

After a release, images on our product pages loaded slowly for users in Asia only. The frontend looked fine, and our servers showed normal latency. Comparing response headers from different regions showed a cache-control header had changed in the release, so our CDN stopped caching images and every request went back to our servers in Europe. I rolled back the header within 20 minutes, then added a CDN cache-hit-rate alert and a test that checks caching headers on key asset types."

#### Step-by-step framework
1. **Situation**: the symptom, who was affected, and how badly.
2. **Your role**: incident lead, responder, or investigator.
3. **Mitigate**: the quickest way to reduce user harm.
4. **Gather evidence** at each layer: browser, API, infrastructure, database.
5. **Hypotheses**: what you tested and ruled out.
6. **Root cause**: including any amplifying factors.
7. **Fixes** at each layer, verified.
8. **Review and prevention**: alerts, tests, process.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We found the bug and fixed it" | Clear hypotheses, evidence and ruled-out causes |
| Debugs while users keep suffering | Mitigates first, then root-causes |
| Stops at the first cause found | Finds trigger and amplifier |
| Fixes one layer only | Fixes at each layer that contributed |
| No communication | Regular updates to support and stakeholders |
| No follow-up | Blameless review, alerts, tests |

#### Useful phrases
- "My first priority was stopping users losing work."
- "The clue that broke it open was…"
- "I ruled that out because…"
- "The trigger was X, but Y made it much worse under load."
- "In the blameless review we agreed three actions…"

#### Common pitfalls
- **Blaming people or other teams.** Keep it blameless.
- **Hero narrative** that ignores teammates' help.
- **Too technical without structure**: the interviewer gets lost.
- **No mitigation step.**
- **No prevention**: the same incident could happen again.

#### Follow-ups to expect (with sample answers)
- **"Why not just turn off refresh token rotation?"**
  "It protects against stolen tokens, so removing it would trade a reliability bug for a security weakness. A grace period plus tab coordination fixed the bug and kept the protection."
- **"How did you communicate during the incident?"**
  "A single incident channel, updates every 30 minutes with impact, current theory and next steps, and a short summary for support to share with students."
- **"What monitoring would have caught it earlier?"**
  "An alert on the rate of 401s from the refresh endpoint and on refresh latency. Both now exist."
- **"What would you do differently?"**
  "Load test authentication before peak periods. We tested features but not the auth system under term-start load."

#### What senior interviewers look for
- **Calm, structured incident leadership.**
- **Depth across layers** and comfort with unfamiliar parts.
- **Prioritising users** over curiosity.
- **Systemic fixes** and a learning culture.

#### Practise it
1. Pick an incident where the cause was in a different layer from the symptom.
2. Write down the timeline: detection, mitigation, root cause, fixes, review.
3. List the hypotheses you ruled out and the evidence for each.
4. Add the numbers: users affected, time to mitigate, before and after.
5. Prepare the "what would you do differently?" answer.

## Questions to ask your interviewer (full stack edition)
- id: fs-behavioural-08
- round: BEHAVIORAL_BAR_RAISER
- difficulty: easy
- levels:
- tags: behavioural, questions to ask, closing, culture, evaluating the company

### Prompt
At the end of the interview you're asked, "Do you have any questions for us?" What would you ask as a full stack engineer, and why?

### Answer
#### What the interviewer is really testing
- **Genuine interest**: have you thought about this team and product specifically?
- **Priorities**: your questions reveal what you care about (ownership, quality, growth, users).
- **Seniority**: senior candidates ask about decision-making, technical direction and how work flows across teams.
- **Judgement and preparation**: thoughtful questions show you researched the company.
- **Two-way evaluation**: good interviewers respect candidates who assess them too.

#### Key points
- **Always ask something.** "No, I think you covered everything" signals low interest.
- Prepare **five or six questions** and ask **two or three**, choosing based on what's already been covered.
- **Tailor questions to the interviewer**: an engineer can tell you about code and on-call; a manager about growth and priorities; a product manager about how decisions are made.
- For full stack roles, ask about **how ownership works across the stack**: do engineers own features end to end, or are there hidden frontend/backend hand-offs?
- Ask about **real practice, not policy**: "Tell me about the last time…" gets more honest answers than "Do you value…?"
- Avoid questions answered on the website, and leave salary and holiday questions for the recruiter.
- **Listen and follow up** on the answer. A short follow-up shows you're engaged.

#### Model answer
"Here's a sample answer showing the structure. Replace the details with your own story.

Here's how I'd use the time, with my reasons:

**About the work and ownership**
1. 'Can you walk me through how a recent feature went from idea to production? Who was involved at each stage?' This shows me whether full stack engineers really own features end to end, or whether there are hand-offs between frontend, backend and platform teams.
2. 'How much of a typical engineer's time goes to frontend versus backend versus infrastructure work?' Full stack roles vary a lot; this tells me whether the role matches the title.

**About technical quality**
3. 'What part of the codebase are you least proud of, and is there a plan for it?' An honest answer tells me about technical debt and whether the team is allowed time to address it.
4. 'How do you deploy, and how long does it take for a merged change to reach production?' Deployment speed is a strong signal of engineering health.

**About decisions and culture**
5. 'Tell me about a recent technical disagreement on the team. How was it resolved?' This shows how decisions really get made.
6. 'What happens when something breaks in production at 2am? What does on-call look like?' This shows me how the team treats reliability and people's time.

**About success in the role**
7. 'What would success look like for this role after six months?' It makes expectations concrete and shows I'm thinking about delivering.
8. 'What's the biggest challenge the team will face this year?' It helps me understand where I could contribute most.

**About the interviewer**
9. 'What made you join, and what's kept you here?' People usually answer this honestly, and it builds rapport.

In a 45-minute interview I'd usually have time for two or three, so I'd pick based on who I'm talking to: 1, 3 and 5 with an engineer; 7, 8 and 2 with a hiring manager."

#### Another worked example: questions by interviewer type
"Here's a sample answer showing the structure. Replace the details with your own story.

- **With a fellow engineer**: 'What did you work on last week?', 'How long does code review usually take?', 'What do you wish you'd known in your first month?'
- **With the hiring manager**: 'How do you decide what the team works on each quarter?', 'How do engineers here grow towards staff level?', 'What's the team's biggest risk right now?'
- **With a product manager or designer**: 'How early are engineers involved in product decisions?', 'Can you tell me about a time engineering changed the direction of a feature?'
- **With a senior leader**: 'What would make this product succeed or fail over the next two years?', 'How does engineering influence company strategy?'"

#### Step-by-step framework
1. **Research** the company, product and, if possible, your interviewers.
2. **Prepare** five or six questions across work, quality, culture and success.
3. **Choose** two or three in the moment, skipping anything already covered.
4. **Ask open questions**, ideally about recent real examples.
5. **Listen and follow up** with one short question.
6. **Close** with a brief thank-you and, if natural, a one-sentence summary of why you're interested.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "No questions, you covered everything" | Two or three thoughtful questions |
| Questions answered on the website | Questions based on research and the conversation |
| "Do you value work-life balance?" | "What does on-call look like in practice?" |
| Salary and perks with an engineer | Compensation saved for the recruiter |
| Same questions for everyone | Tailored to the interviewer's role |
| Asks and moves on | Listens and follows up |

#### Useful phrases
- "Can you walk me through the last time…?"
- "What does that look like day to day?"
- "That's interesting. How did the team decide that?"
- "What would make someone really successful in this role?"
- "Thanks, that's helped me understand… and it's a big part of why I'm excited about the role."

#### Common pitfalls
- **No questions**, or only generic ones.
- **Questions that sound negative** in tone ("Why is your app so slow?"). Rephrase as curiosity.
- **Asking about salary, holidays or remote work** with every interviewer instead of the recruiter.
- **Running over time**: watch the clock and keep it brief.
- **Not listening**: asking the next question without engaging with the answer.

#### Follow-ups to expect (with sample answers)
- **"Is there anything that would stop you accepting an offer?"**
  "I'd want to be sure engineers here own features end to end; from what you've said, it sounds like they do. Otherwise I'm very interested."
- **"Which of our products interests you most?"**
  Answer with something specific you've used or researched.
- **"Any concerns about the role from what you've heard?"**
  "Only a question about on-call load. Could you tell me how often each engineer is on call?" Raising a concern calmly shows maturity.

#### What senior interviewers look for
- **Questions about how decisions are made**, technical direction and cross-team work.
- **Evaluation of engineering health**: deployment, debt, incidents.
- **Interest in impact**: what success looks like and where help is most needed.
- **Confidence**: treating the interview as a two-way conversation.

#### Practise it
1. Write eight questions across ownership, quality, culture and success.
2. Mark which two or three you'd ask an engineer, a manager and a product manager.
3. For your next interview, add one question specific to that company's product.
4. After each interview, note which questions got the most useful answers, and refine your list.
