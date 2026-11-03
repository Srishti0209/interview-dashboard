# Backend Engineer — Architecture & Tech Leadership

## Writing a technical design document / RFC
- id: be-arch-01
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels: senior, staff
- tags: design doc, RFC, technical writing, decision making

### Prompt
How do you write a good technical design document (or RFC)? What sections do you include, and how do you run the review process so it leads to a decision?

### Answer
#### What the interviewer is really testing
- Treating design docs as tools for **thinking, alignment and decision-making**, not bureaucracy.
- A clear **structure**: problem, goals/non-goals, options, trade-offs, decision, risks, rollout.
- **Audience awareness**: writing for reviewers with different concerns.
- Running a **review process** that converges: right reviewers, timeboxes, decision owner, recording outcomes.

#### Key points
- Write a design doc when a change is **costly to reverse**, crosses teams, affects reliability/security/data, or has real alternatives.
- Core sections: **context/problem**, **goals and non-goals**, **requirements** (functional and non-functional), **proposed design**, **alternatives considered** with trade-offs, **risks and mitigations**, **rollout and migration plan**, **observability and testing**, **security/privacy**, **cost**, **open questions**.
- Lead with a short **summary and recommendation**; make the decision explicit.
- **Diagrams** and concrete examples (APIs, schemas, sequences) beat prose.
- Review: share early drafts with a few people, then wider; set a **deadline**; name a **decision owner** (DACI/RACI); resolve comments; record the decision (ADR).
- Keep the doc **concise**; length should match risk.

#### Model answer
"A design doc is a tool to **think clearly, get the right feedback early, and record why we made a decision**. Changing a design on paper is far cheaper than changing it in production.

**When to write one:** for changes that are hard to reverse (data models, public APIs, new infrastructure), cross-team impacts, significant reliability/security/privacy implications, or where reasonable people would choose differently. Small, reversible changes just need a good PR description.

**Structure I use:**
1. **Title, author, status, reviewers, decision owner, date.**
2. **Summary (TL;DR)**: 3–5 sentences: problem, proposed solution, key trade-off, what I need from readers. Many readers stop here, so it must stand alone.
3. **Context and problem**: why now? Data showing the problem (e.g. 'checkout p99 is 2.4 s; 40% of time is spent in synchronous inventory calls; this costs ~X in conversion').
4. **Goals and non-goals**: explicit non-goals prevent scope creep and endless debate ('we will not migrate historical orders in this phase').
5. **Requirements**: functional, plus non-functional targets: latency, throughput, availability, consistency, data retention, compliance.
6. **Proposed design**:
   - Architecture diagram; data flow; key components and responsibilities.
   - API contracts and data schemas (concrete examples).
   - Sequence diagrams for main flows and failure cases.
   - How it handles failures, scaling, consistency.
7. **Alternatives considered**: two or three realistic options with honest pros/cons and why not chosen. 'Do nothing' is often one. This section builds trust and prevents relitigating later.
8. **Risks and mitigations**: technical, operational, organisational.
9. **Security and privacy**: data handled, authorisation, threat considerations.
10. **Observability and testing**: metrics, alerts, SLOs, test strategy.
11. **Rollout and migration**: phases, feature flags, backfills, rollback plan, success metrics.
12. **Cost**: infrastructure and engineering effort estimate.
13. **Open questions**: what I'm unsure about; where I want input.

**Writing tips:**
- **Lead with the recommendation**; don't make readers wait until page eight.
- Be **concrete**: example payloads, numbers, diagrams.
- Make trade-offs explicit: 'We choose eventual consistency for inventory counts on product pages (up to 5 s stale) in exchange for removing synchronous calls from checkout.'
- Size the doc to the risk: a two-page doc for a medium change, longer for a platform shift.

**Running the review:**
1. **Pre-socialise**: before the formal review, talk to key stakeholders (the team owning a dependency, security, SRE) to surface objections early. Nobody should be surprised in the review meeting.
2. **Early draft to a small group** for direction ('is this the right problem and approach?') before polishing details.
3. **Wider review with a deadline**: e.g. comments open for one week; reviewers listed by area (security reviewer, database reviewer).
4. **Review meeting** (optional) focused on unresolved disagreements, not reading the doc aloud. Many teams spend the first 10 minutes reading silently, then discuss.
5. **Name a decision owner** (often the tech lead or architect) who decides when consensus isn't reached; 'disagree and commit' after concerns are heard.
6. **Resolve every comment**: accepted, rejected with reason, or deferred to an open question.
7. **Record the decision** at the top (status: approved; decision summary) and in an **ADR** log so future engineers know why.
8. **Keep it alive**: update for significant changes during implementation, or note deviations.

**Common failure modes I avoid:** docs written after the code (rubber stamp), docs with only one option, endless review without a decision owner, 30-page docs nobody reads, and decisions made in meetings that never get recorded."

#### Another worked example: a design doc that changed the plan
"I wrote a design doc proposing a new Kafka-based event pipeline to replace polling between our orders and fulfilment services. Pre-socialising with the platform team revealed they were about to deprecate our Kafka cluster in favour of a managed service; the security review flagged PII in event payloads. Updating the doc before implementation (managed service, events carrying IDs rather than personal data) saved a likely re-architecture months later. The 'alternatives considered' section also captured why we rejected a simpler webhook approach, which stopped the same debate recurring a quarter later."

#### A third worked example: breaking a stalemate
"Two senior engineers had argued for weeks in Slack about PostgreSQL versus DynamoDB for a new service. I proposed a short design doc comparing both against agreed requirements (query patterns, consistency needs, operational experience, cost at projected scale), with a decision owner and a one-week deadline. Writing requirements down showed that our query patterns needed ad-hoc filtering and transactions across entities, favouring PostgreSQL. The DynamoDB advocate agreed the criteria were fair, and we moved on."

#### Variations you might be asked
- "What's an ADR?": an Architecture Decision Record: a short document capturing one decision, its context, options and consequences, stored with the code.
- "How do you get people to actually read your doc?": a clear summary, targeted asks per reviewer, reasonable length, and pre-socialising with key people.
- "What if the review drags on?": set deadlines, escalate to the decision owner, separate blocking concerns from preferences, and defer non-critical questions.

#### Step-by-step framework
1. **Decide if a doc is warranted.**
2. **Write summary, problem, goals/non-goals.**
3. **Propose design with concrete details.**
4. **Compare alternatives honestly.**
5. **Cover risks, security, observability, rollout, cost.**
6. **Run a timeboxed review with a decision owner; record the decision.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Describes only the chosen solution | Alternatives with honest trade-offs |
| No goals/non-goals | Explicit scope boundaries |
| Wall of text | Summary, diagrams, examples |
| Endless review | Deadline, decision owner, ADR |
| Ignores rollout | Migration, flags, rollback, success metrics |

#### Useful phrases
- "The summary should let a busy reader understand the decision in 30 seconds."
- "Non-goals are as important as goals."
- "I pre-socialise so nobody is surprised in the review."
- "The decision and its reasons get recorded, so we don't relitigate it."

#### Common pitfalls
- **Writing after implementation.**
- **One-option docs.**
- **No decision owner.**
- **Over-long docs.**

#### Follow-ups to expect (with sample answers)
- **"How do you handle strong disagreement in comments?"**
  "Move to a conversation, clarify the criteria we're optimising for, and let the decision owner decide after hearing concerns."
- **"How much detail is enough?"**
  "Enough that reviewers can evaluate risks and an engineer could implement it without major unanswered questions; no more."
- **"Who should review?"**
  "Owners of affected systems, someone from security/SRE for relevant changes, and at least one engineer who'll implement it."

#### What senior interviewers look for
- **Clear thinking and writing.**
- **Driving decisions** across teams.
- **Honest trade-off analysis.**

#### Practise it
1. Write a two-page design doc for a feature you've built, with alternatives and rollout.
2. Write a 5-sentence summary for a complex technical decision.
3. Describe how you'd run a review with a deadline and decision owner, out loud.

## Driving consensus on a contentious technical decision
- id: be-arch-02
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels: senior, staff
- tags: consensus, decision making, influence, conflict, leadership

### Prompt
Tell me about a time you had to drive a decision where engineers strongly disagreed (e.g. on a technology choice or architecture). How did you reach a decision and keep the team aligned?

### Answer
#### What the interviewer is really testing
- **Influence without authority**: facilitating rather than dictating.
- Making disagreements productive: shared **criteria**, **data**, prototypes.
- Knowing when consensus isn't possible and using **clear decision ownership** and "disagree and commit".
- Preserving **relationships** and team morale after the decision.

#### Key points
- Separate **people from positions**; understand each side's underlying concerns (operational risk, familiarity, speed, long-term cost).
- Agree on **decision criteria and their weights first**, before debating options.
- Gather **evidence**: benchmarks, spikes/prototypes, prior incidents, cost estimates, expert input.
- Consider **reversibility**: one-way doors deserve more rigour; two-way doors should be decided quickly.
- Make the **decision process explicit**: who decides, by when, how input is gathered.
- After deciding: **record the decision and dissent**, disagree and commit, define **revisit triggers**.
- Follow up on relationships; give credit to people whose ideas weren't chosen.

#### Model answer
"I'll answer with a STAR story, then the principles I use.

**Situation.** Our team was building a new event-driven fulfilment system. Half the team wanted Kafka (event replay, high throughput, industry standard); the other half wanted to stay with RabbitMQ, which we already operated (simpler, team experience, fewer moving parts). Discussions in Slack and standups had gone on for three weeks, getting heated, and the project was stalled.

**Task.** As the tech lead for the project, I needed to get to a decision the team could commit to, quickly and without damaging relationships.

**Action.**
1. **Reset the conversation.** I acknowledged both sides had strong points and proposed a structured process with a deadline: decision in 10 days, with our engineering manager and me as decision owners if we couldn't reach consensus. Making the process explicit reduced tension immediately.
2. **Understand underlying concerns.** I spoke one-on-one with the strongest advocates. The Kafka side cared about **replaying events** for rebuilding projections and future analytics. The RabbitMQ side was worried about **operational burden**: one of them had been on call during a painful Kafka incident at a previous company.
3. **Agree criteria first.** In a 45-minute session we listed and weighted criteria before discussing options: requirement for event replay (high), expected throughput (moderate: ~2k msg/s), operational burden and on-call risk (high), team experience (medium), cost (medium), ecosystem/integrations (low). Doing this first shifted the debate from 'my tool vs yours' to 'what do we need'.
4. **Gather evidence.** Two engineers (one from each side) spent three days on a **spike**: a managed Kafka service (removing most operational concerns) versus our RabbitMQ setup with a replay workaround (storing events in a table). They measured replay effort, operational tasks and cost.
5. **Write it up.** I wrote a short decision doc scoring options against the agreed criteria, including the spike results and the dissenting views verbatim.
6. **Decide.** The managed Kafka option met the replay requirement natively and addressed the operational concern; the cost difference was modest. Most of the team agreed; one engineer still preferred RabbitMQ. We decided on managed Kafka, recorded his concerns, and agreed a **revisit trigger**: if operational incidents attributable to Kafka exceeded two per quarter, we'd reassess.
7. **Follow through.** I asked the engineer who had argued for RabbitMQ to lead the operational runbooks and alerting, since he understood the risks best. That gave his concerns real influence.

**Result.** We made the decision in 8 days after three weeks of stalemate. The system launched on schedule two months later; we used replay twice in the first quarter to rebuild projections after bugs. The engineer who'd dissented later said the process felt fair, and his runbooks prevented at least one incident.

**Principles I use generally:**
- **Criteria before options**: disagreements often come from optimising for different things.
- **Evidence over opinion**: spikes, benchmarks, data from our own systems.
- **Reversibility determines rigour**: for a two-way door (a library choice inside one service), decide quickly and move on; for a one-way door (primary database, public API), invest more.
- **Explicit decision ownership**: consensus is ideal but not required; endless debate is worse than a reasonable decision.
- **Disagree and commit**: everyone's concerns are heard and recorded; then we execute fully.
- **Protect relationships**: credit contributions, involve dissenters in mitigating the risks they raised."

#### Another worked example: when I was on the losing side
"I argued for GraphQL for a new mobile API; our architect preferred REST with a BFF. After the criteria-based discussion, the decision went to REST, mainly due to caching and team experience. I committed fully, helped design the BFF, and later documented where we'd felt the pain of over-fetching, which informed a targeted solution (sparse fieldsets) a year later. Being a good 'disagree and commit' participant matters as much as leading the process."

#### A third worked example: a fast decision on a reversible choice
"Two engineers debated for a day between two HTTP client libraries for one internal service. I pointed out it was easily reversible (wrapped behind our own interface), so we picked the one already used elsewhere and timeboxed reconsideration to 'if we hit a real limitation'. We never revisited it."

#### Variations you might be asked
- "What if your manager overrules a decision you think is wrong?": share concerns with evidence privately, ask what I'm missing, and if the decision stands, commit while proposing ways to detect if it's going wrong.
- "How do you handle someone who keeps reopening decided issues?": acknowledge their concern, point to the recorded decision and revisit triggers, and discuss privately if it continues.
- "What if the disagreement is between two teams?": align on shared goals, escalate to a common leader if needed with a clear write-up of options, and avoid deciding for another team's system unilaterally.

#### Step-by-step framework
1. **Make the process explicit** (owner, deadline).
2. **Understand underlying concerns.**
3. **Agree criteria and weights.**
4. **Gather evidence** (spikes, data).
5. **Decide, record dissent, set revisit triggers.**
6. **Follow through** and protect relationships.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I convinced them I was right" | Facilitated a fair process |
| Opinions only | Criteria, spikes, evidence |
| Debate without end | Deadline and decision owner |
| Ignores dissent | Records dissent, involves dissenters |
| No follow-up | Revisit triggers, measurable outcomes |

#### Useful phrases
- "Before comparing options, let's agree what we're optimising for."
- "Is this a one-way door or a two-way door?"
- "We'll record the concerns and agree what would make us revisit."
- "I'd rather have a good decision this week than a perfect one in two months."

#### Common pitfalls
- **Deciding by seniority or volume.**
- **Seeking unanimous agreement** forever.
- **Not recording reasons.**
- **Leaving dissenters feeling unheard.**

#### Follow-ups to expect (with sample answers)
- **"What if the data doesn't clearly favour one option?"**
  "Then either option is probably acceptable; choose based on team familiarity or reversibility, decide quickly, and move on."
- **"How do you make sure quieter engineers are heard?"**
  "Written input before meetings, one-on-ones, and explicitly inviting their views."
- **"What did you learn from this?"**
  "That most technical disagreements are really about different priorities, so agreeing criteria first resolves much of the conflict."

#### What senior interviewers look for
- **Facilitation and influence.**
- **Pragmatic decision-making.**
- **Emotional intelligence** and relationship care.

#### Practise it
1. Prepare your own STAR story of a contentious decision with criteria and outcome.
2. Write a decision matrix for a technology choice you know.
3. Explain one-way vs two-way doors, out loud.

## Leading a large migration
- id: be-arch-03
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels: staff
- tags: migration, planning, risk management, cross-team, strangler fig

### Prompt
You're asked to lead a migration that touches many teams, for example moving all services from a self-hosted database cluster to a managed cloud database, or from a monolith to services. How do you plan and execute it?

### Answer
#### What the interviewer is really testing
- **Program-level thinking**: scope, phases, dependencies, stakeholders.
- **Risk management**: incremental migration, dual-running, rollback, verification.
- **Making migrations easy for other teams**: tooling, documentation, paved paths, support.
- **Driving to completion**: tracking, incentives, deadlines, and the **long tail**.

#### Key points
- Start with **why**: business case, success metrics, and what happens if we don't migrate; get **leadership sponsorship**.
- **Inventory** everything affected (services, data, dependencies, owners); classify by complexity and risk.
- **Pilot** with one or two representative services; learn and build tooling.
- Make migration **cheap for teams**: automation, libraries, playbooks, office hours, sometimes the platform team doing the work.
- **Incremental, reversible steps**: dual-write/CDC, shadow reads, verification, cutover, rollback plan.
- **Communication and tracking**: public dashboard of progress, regular updates, clear deadlines.
- **Long tail**: deal with the last 10–20% deliberately (dedicated help, deprecation deadlines, escalation).
- **Finish**: decommission the old system; celebrate; retrospective.

#### Model answer
"I'll use the example of migrating 40 services from a self-hosted PostgreSQL cluster to a managed cloud database. Migrations like this fail less from technical problems than from loss of momentum, unclear ownership and a long tail that never finishes, so I plan for both.

**1. Establish why and get sponsorship.**
- Business case: the self-hosted cluster costs ~2 engineers' time in operations, had 4 incidents last year, and is on a PostgreSQL version reaching end of life. Managed service gives automated backups, failover, upgrades.
- Success metrics: all services migrated by Q3, zero data loss, downtime per service under 5 minutes, old cluster decommissioned, operational toil reduced.
- **Executive sponsor** who'll help prioritise the work across teams: migrations compete with feature work, and without sponsorship they stall.

**2. Inventory and plan.**
- List every database, its owning team, size, write rate, extensions used, connection patterns, downtime tolerance, and dependencies (reports, ETL jobs reading directly).
- Classify into waves: **simple** (small, low-traffic, tolerant of brief downtime), **medium**, **complex** (large, high write rate, critical like payments).
- Identify **blockers** early: unsupported extensions, superuser-dependent features, hard-coded hostnames, cross-database queries.
- Write a **design doc** with the migration approach, rollback plan, and timeline; review with SRE, security and team leads.

**3. Pilot.**
- Migrate one or two representative services with their teams. Measure effort, find surprises (e.g. a connection pooler config, a cron job connecting directly), and refine the playbook.

**4. Make it easy for teams (paved road).**
- **Tooling**: scripts or a self-service pipeline to provision the managed database with standard config, set up logical replication/CDC from old to new, run verification checks (row counts, checksums), and perform cutover.
- **Playbook** with step-by-step instructions, checklists and rollback steps.
- **Office hours and a support channel**; a migration 'buddy' from the platform team for complex services.
- For teams with little capacity, the platform team **does the migration for them** with their review.

**5. Migration mechanics per service (incremental and reversible):**
1. Provision target; apply schema.
2. **Replicate** data continuously from old to new (logical replication or CDC tool like AWS DMS/Debezium).
3. **Verify**: row counts, checksums per table, sampled comparisons; monitor replication lag.
4. Optionally **shadow reads**: read from both and compare in the application for critical services.
5. **Cutover** during a low-traffic window: briefly stop writes (or put the app in read-only mode), wait for replication to catch up, switch connection config (via feature flag or config change), resume.
6. **Rollback plan**: keep reverse replication or the old database intact for a defined period; switching back is a config change.
7. **Monitor** error rates, latency, query plans after cutover (new database version may plan queries differently).
8. Decommission the old database after a soak period.

**6. Communication and tracking.**
- A **public dashboard** showing each service's status (not started, in progress, migrated, decommissioned) and wave.
- Fortnightly updates to stakeholders and leadership: progress, risks, help needed.
- Clear **deadlines** agreed with team leads and sponsor, including the date the old cluster will be shut down.
- Celebrate milestones (first wave complete, 50%).

**7. The long tail.**
- The last 10–20% are always the hardest: low-priority teams, legacy services without owners, odd dependencies.
- Approaches: dedicated help for each remaining service, escalation via the sponsor, deprecation warnings and **brownouts** on the old system (e.g. read-only windows announced in advance), and sometimes decommissioning unused services instead of migrating them.
- Don't declare victory until the **old system is turned off**: running both indefinitely costs more than either.

**8. Close out.**
- Decommission, update documentation, retrospective on what to reuse for future migrations, and recognise the teams involved."

#### Another worked example: monolith to services
"For a monolith decomposition, I led a two-year strangler-fig migration. We prioritised extracting domains with clear boundaries and high change frequency (checkout, notifications) and explicitly decided to leave some stable parts in the monolith. Each extraction followed a template: define API, route via gateway, dual-write/sync data with CDC, migrate reads, migrate writes, delete monolith code. A quarterly scorecard showed deploy frequency and incident rates per domain, which kept leadership support when the work felt slow."

#### A third worked example: a migration that stalled
"A previous attempt at the same database migration had stalled at 60% for a year: teams were asked to migrate 'when they had time', with no tooling and no deadline. Restarting it, we added the self-service tooling (reducing per-service effort from two weeks to two days), a sponsor-backed deadline, and the platform team migrating the long tail itself. We finished the remaining 40% in one quarter."

#### Variations you might be asked
- "How do you handle a team that refuses to prioritise the migration?": understand their constraints, reduce their effort (do it for them), show the cost of not migrating, and escalate via the sponsor if needed.
- "How do you migrate with zero downtime for a critical database?": continuous replication, dual writes or CDC, shadow reads, a near-instant cutover with read-only mode of seconds, and fast rollback.
- "How do you estimate a migration?": pilot measurements per complexity class multiplied across the inventory, plus a buffer for the long tail.

#### Step-by-step framework
1. **Why, success metrics, sponsorship.**
2. **Inventory and classify** into waves.
3. **Pilot** and refine.
4. **Paved road**: tooling, playbooks, support.
5. **Incremental, verified, reversible cutovers.**
6. **Track publicly, tackle the long tail, decommission.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Technical plan only | Sponsorship, communication, tracking |
| "Teams migrate when they can" | Tooling, support, deadlines |
| Big-bang cutover | Replication, verification, rollback |
| Stops at 80% | Plans for the long tail; decommissions |
| No metrics | Success metrics and progress dashboard |

#### Useful phrases
- "Migrations fail from lost momentum more often than technical problems."
- "The cheaper we make it for each team, the faster it goes."
- "Every cutover has a tested rollback path."
- "It's not done until the old system is turned off."

#### Common pitfalls
- **No sponsor** to prioritise across teams.
- **Underestimating the long tail.**
- **Skipping verification.**
- **Running old and new forever.**

#### Follow-ups to expect (with sample answers)
- **"How do you keep stakeholders informed without overwhelming them?"**
  "A dashboard for detail, a short fortnightly update with progress, risks and asks, and escalation only when needed."
- **"What would you do if a cutover caused issues?"**
  "Roll back immediately via config, investigate with the team, fix, and update the playbook before continuing."
- **"How do you measure success after the migration?"**
  "Against the original metrics: decommissioned system, reduced toil and incidents, cost, and team feedback."

#### What senior interviewers look for
- **Program leadership** across teams.
- **Risk-managed execution.**
- **Driving to completion.**

#### Practise it
1. Prepare a STAR story about a migration you led or contributed to.
2. Draft a migration plan outline (waves, tooling, rollback) for a system you know.
3. Explain how you'd handle the long tail, out loud.

## Technical debt strategy
- id: be-arch-04
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels: senior, staff
- tags: technical debt, prioritisation, refactoring, stakeholder management

### Prompt
How do you manage technical debt on a team? How do you decide what to fix, and how do you get product and leadership to invest in it?

### Answer
#### What the interviewer is really testing
- A nuanced view: debt is sometimes **deliberate and rational**, not just "bad code".
- **Making debt visible** and **quantifying its cost** in business terms.
- **Prioritisation** frameworks (impact × frequency, interest rate).
- Practical **investment models** (continuous allocation, debt tied to features, dedicated projects) and stakeholder communication.

#### Key points
- Technical debt = the **future cost** of shortcuts or outdated decisions; like financial debt, it has **principal** (effort to fix) and **interest** (ongoing cost: slower delivery, incidents, onboarding pain).
- Types: **deliberate** (shipped fast knowingly), **accidental** (learned better later), **bit rot** (dependencies, platforms ageing), **architectural** debt (wrong boundaries).
- **Visibility:** a debt register with impact, affected areas, cost estimates; link incidents and slowdowns to debt.
- **Prioritise** by interest: fix debt in areas that change often or cause incidents; ignore debt in stable, rarely touched code.
- **Quantify** in business terms: lead time, incidents, engineering hours lost, risk (security, EOL software).
- **Investment models:** a fixed percentage (e.g. 15–20%) per sprint, **debt work bundled with related features**, dedicated projects for big items, "boy scout rule".
- Prevent unnecessary new debt: design reviews, definition of done, explicit decisions when taking debt deliberately.

#### Model answer
"I treat technical debt like financial debt: sometimes worth taking on deliberately (to hit a market window), but it has to be tracked and the **interest** managed, or it compounds until the team slows to a crawl.

**1. Make it visible.**
- Keep a **debt register** (a board or tagged tickets): what the debt is, where it lives, its symptoms, estimated effort, and its 'interest' (how it hurts us).
- Collect evidence continuously: incidents linked to fragile components, PRs that took 3× longer because of a module, onboarding friction, flaky tests, outdated dependencies with CVEs.
- When we take on debt deliberately, we record it at the time with a planned payback point.

**2. Prioritise by interest, not by ugliness.**
- Ugly code that nobody touches and that works can stay ugly.
- Debt in **hot spots** (code that changes frequently and causes bugs) has the highest interest. Tools help: git churn analysis combined with bug/incident counts identifies modules that are both frequently changed and error-prone.
- I score items roughly on:
  - **Impact**: delivery slowdown, incident risk, security/compliance risk, cost.
  - **Frequency**: how often we pay the interest (every sprint vs once a year).
  - **Effort** to fix, and whether it can be done incrementally.
  - **Urgency**: deadlines like end-of-life runtimes or vendor deprecations.
- High-impact, frequent, incrementally fixable items go first.

**3. Communicate in business terms.**
Product and leadership don't fund 'cleaner code'; they fund outcomes:
- 'Every pricing change currently takes ~2 weeks and causes an incident roughly every other release. Refactoring the pricing module (~4 weeks) would cut changes to ~3 days and remove the main source of checkout incidents. We plan 6 pricing changes next half: payback in about one quarter.'
- 'Our runtime reaches end of life in March; after that we get no security patches, which our enterprise contracts require.'
- Use metrics they already care about: lead time, change failure rate, incident counts, on-call load, customer-facing bugs.

**4. Choose an investment model.**
- **Continuous allocation**: a standing ~15–20% of capacity for debt and engineering health, owned by the team. Keeps things from rotting and avoids negotiating every item.
- **Bundle with features**: when a feature touches a debt-heavy area, include the refactor in the estimate ('make the change easy, then make the easy change'). This is often the most effective, because the value is immediate.
- **Dedicated projects** for large architectural debt (e.g. splitting a database, migrating a framework), with a design doc, milestones and success metrics like any project.
- **Boy scout rule**: leave code a bit better than you found it in everyday work.

**5. Prevent unnecessary new debt.**
- Design reviews for significant changes; definition of done includes tests, observability and docs.
- When we choose to take a shortcut, we make it explicit: ticket created, owner, payback trigger ('before we onboard the second enterprise customer').

**6. Track progress.**
- Show improvements: lead time in the refactored area, fewer incidents, faster onboarding. Reporting wins builds trust for future investment."

#### Another worked example: making the case with data
"Our team's lead time for changes had grown from 2 days to 9 days over a year. I analysed six months of PRs and incidents: 60% of the delay and 5 of 8 incidents involved a shared 'order state' module with no tests and tangled responsibilities. I proposed a 5-week incremental refactor bundled with the upcoming returns feature, with metrics to track. Product agreed because the returns feature itself would have taken an estimated 3 extra weeks without it. Afterwards, lead time in that area dropped to 3 days and incidents fell to one in the next six months."

#### A third worked example: debt we chose to keep
"A legacy reporting module used an outdated ORM and was painful to read, and engineers wanted to rewrite it. But it changed once a year and had no incidents. We documented it, added a few characterisation tests, and explicitly decided not to invest. That freed capacity for a hot-spot module that was costing us every sprint."

#### Variations you might be asked
- "When is taking on technical debt the right call?": when speed has real business value (validating a market, meeting a contractual deadline) and the debt is recorded with a payback plan.
- "How do you handle a team that wants to rewrite everything?": refocus on interest, pick the highest-value hot spots, prefer incremental refactors over rewrites.
- "How do you measure technical debt?": indirectly, via lead time, change failure rate, incident attribution, churn × complexity hot spots, dependency age and CVEs, and developer surveys.

#### Step-by-step framework
1. **Define** debt as principal + interest.
2. **Make it visible** with a register and evidence.
3. **Prioritise by interest** (hot spots, risk, urgency).
4. **Communicate** in business outcomes and payback.
5. **Invest** via allocation, bundling, projects.
6. **Prevent and track** results.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "All debt is bad; fix it all" | Debt can be rational; manage interest |
| Prioritises by code ugliness | Prioritises by impact and frequency |
| "We need time for refactoring" | Business case with metrics and payback |
| Big rewrite projects | Incremental, bundled with features |
| No follow-up | Tracks results to build trust |

#### Useful phrases
- "Ugly code that never changes isn't expensive debt."
- "Let's fix the debt in the area the next three features touch."
- "Here's the payback: four weeks of work saves roughly two weeks per change."
- "When we take a shortcut on purpose, we write down when we'll pay it back."

#### Common pitfalls
- **Invisible debt** that leadership never hears about.
- **Rewrite fever.**
- **Asking for time without outcomes.**
- **Never allocating capacity** until a crisis.

#### Follow-ups to expect (with sample answers)
- **"How do you protect the 20% allocation when deadlines loom?"**
  "Agree it upfront with product, show its outcomes regularly, and flex temporarily with an explicit plan to recover it."
- **"How do you find hot spots?"**
  "Combine git change frequency per file with complexity metrics and bug/incident links; the overlap shows where debt costs most."
- **"Who decides what debt to fix?"**
  "The engineering team proposes and prioritises, aligned with product on trade-offs; the tech lead owns the overall health."

#### What senior interviewers look for
- **Business-aligned engineering judgement.**
- **Influence** with product and leadership.
- **Sustained team health.**

#### Practise it
1. List the top five debt items in a system you know and score them by impact and frequency.
2. Write a one-paragraph business case for fixing one of them.
3. Explain debt principal and interest, out loud.

## Designing a multi-tenant system
- id: be-arch-05
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels: staff
- tags: multi-tenancy, SaaS, isolation, noisy neighbour, data partitioning

### Prompt
Design the architecture for a B2B SaaS product serving thousands of tenants, from small businesses to large enterprises. How do you handle data isolation, noisy neighbours, customisation and enterprise requirements?

### Answer
#### What the interviewer is really testing
- Knowing the **tenancy models** (shared everything, schema-per-tenant, database-per-tenant, cell/silo) and their trade-offs.
- **Isolation**: security (no data leaks), performance (noisy neighbours), and operational (blast radius).
- **Tenant-aware design** throughout: identity, routing, rate limits, observability, billing.
- Handling **enterprise needs**: dedicated infrastructure, data residency, SSO, compliance, custom configuration without forks.

#### Key points
- **Pooled (shared DB, tenant_id column):** cheapest, simplest to operate at scale; isolation enforced in code/RLS; noisy neighbour risk.
- **Schema-per-tenant:** better logical separation; migrations across thousands of schemas get painful.
- **Database-per-tenant (silo):** strongest isolation, per-tenant backup/restore and residency; higher cost and operational overhead.
- **Hybrid / tiered:** pooled for small tenants, dedicated for large/regulated ones; **cell-based architecture** (groups of tenants per cell) to bound blast radius.
- **Tenant context** everywhere: derived from auth, propagated through services, enforced in data access (RLS), logs/metrics tagged by tenant.
- **Noisy neighbours:** per-tenant rate limits and quotas, fair queuing, separate worker pools, moving heavy tenants to dedicated resources.
- **Customisation via configuration** (feature flags, settings, custom fields, workflows), never per-tenant code forks.
- Enterprise: SSO/SAML/SCIM, audit logs, data residency, encryption with customer-managed keys, SLAs.

#### Model answer
"I'd start by clarifying: number of tenants and size distribution (often a long tail of small tenants and a few huge ones), regulatory requirements (data residency, HIPAA/SOC 2), expected enterprise demands (dedicated infrastructure, custom SLAs), and team size. Then decide the tenancy model, and design tenant-awareness into every layer.

**1. Tenancy model: tiered hybrid.**
| Model | Isolation | Cost per tenant | Ops complexity | Good for |
|---|---|---|---|---|
| Pooled (shared tables + tenant_id) | Logical (code/RLS) | Lowest | Low | Long tail of small tenants |
| Schema per tenant | Moderate | Medium | High at large counts | Hundreds of mid-size tenants |
| Database per tenant | Strong | High | High (automation needed) | Large/regulated tenants |
| Dedicated cell/stack | Strongest | Highest | Highest | Top enterprise, residency |

My default: **pooled** for most tenants, with the ability to place large or regulated tenants in **dedicated databases or cells**. This requires the code to be identical across deployment models; only routing and configuration differ.

**2. Cell-based architecture.**
- Group tenants into **cells**: each cell is a full, independent copy of the stack (services + databases) serving a subset of tenants (e.g. 500 small tenants, or one enterprise).
- A thin **routing layer** maps tenant → cell (a tenant directory service), at the edge.
- Benefits: **bounded blast radius** (an incident or bad deploy affects one cell), horizontal scaling by adding cells, progressive rollout cell by cell, placement for data residency (EU cells in EU regions).
- Costs: more infrastructure; cross-cell operations (global search, admin views) need special handling; tenant migration between cells must be tooled.

**3. Data isolation (security).**
- Tenant ID comes from the **authenticated identity** (token claims), never from request parameters.
- **Enforce in the data layer**: repositories require tenant context; PostgreSQL **row-level security** as a backstop; composite primary keys or indexes starting with `tenant_id`.
- Caches keyed with tenant ID; search indexes filtered by tenant (or per-tenant indexes for large tenants); object storage paths prefixed by tenant with policy enforcement.
- Automated **cross-tenant tests**: every endpoint tested to ensure tenant A can't access tenant B.
- Optional per-tenant encryption keys (envelope encryption), including **customer-managed keys** for enterprises.

**4. Noisy neighbours (performance isolation).**
- **Per-tenant rate limits and quotas** at the API gateway, by plan tier.
- **Fair scheduling** for background jobs: per-tenant queues or weighted fair queuing so one tenant's 1M-row import doesn't block everyone's emails.
- **Resource limits on expensive operations**: query timeouts, export size limits, pagination.
- **Per-tenant observability**: request rate, latency, DB time, storage per tenant to spot heavy tenants early.
- **Move heavy tenants** to dedicated resources or their own cell when they outgrow shared ones.

**5. Customisation without forks.**
- Configuration-driven behaviour: feature flags per tenant/plan, settings, custom fields (JSONB with validation or EAV for search), configurable workflows and webhooks.
- Extension points (APIs, webhooks, integrations) rather than custom code paths.
- **Never** maintain per-customer branches; every tenant runs the same version (possibly staggered rollout).

**6. Operations and lifecycle.**
- **Tenant provisioning** automated (directory entry, cell placement, defaults, encryption keys).
- **Migrations** that work across pooled and dedicated databases (run per database with orchestration and progress tracking).
- **Tenant data export and deletion** (offboarding, GDPR).
- **Per-tenant backup/restore** is easy in silo models; for pooled models, design tooling to restore a single tenant's data from backups.
- **Metering and billing**: usage events per tenant (API calls, storage, seats).

**7. Enterprise requirements.**
- **SSO** (SAML/OIDC) and **SCIM** user provisioning; role mapping from identity provider groups.
- **Audit logs** per tenant, exportable.
- **Data residency**: place tenants in regional cells; ensure backups, logs and analytics respect residency.
- **Compliance**: SOC 2/ISO controls, pen tests, DPAs.
- **SLAs** per tier, potentially dedicated capacity."

#### Another worked example: a noisy neighbour incident
"A large tenant ran a bulk import of 5 million records on Monday morning. It shared the job queue and database with 3,000 small tenants, whose emails and reports were delayed by two hours, and API latency doubled. Fixes: per-tenant fair queuing for jobs, a cap on concurrent jobs per tenant, batch sizes with throttling, and moving that tenant to a dedicated database in its own cell, all without code changes because routing was configuration-driven."

#### A third worked example: a cross-tenant data leak prevented
"A new reporting endpoint used a raw SQL query and forgot the tenant filter. Because the table had PostgreSQL row-level security tied to a session variable set from the token, the query returned only the current tenant's rows; the bug surfaced in a cross-tenant test returning fewer rows than expected rather than as a data leak. Defence in depth turned a potential breach into a minor bug."

#### Variations you might be asked
- "How do you migrate a tenant from pooled to dedicated?": copy their data (filtered by tenant ID) to the new database with replication/CDC, verify, briefly freeze writes, switch the directory entry, then delete from the pool.
- "How do you handle global features like cross-tenant analytics?": a separate analytics pipeline aggregating anonymised or permitted data, not queries across production cells.
- "What's the hardest part of database-per-tenant at scale?": migrations and connection management across thousands of databases, needing strong automation.

#### Step-by-step framework
1. **Clarify** tenant distribution and compliance needs.
2. **Choose tenancy model** (tiered hybrid) and cells.
3. **Enforce data isolation** in identity, data layer, caches, storage.
4. **Manage noisy neighbours** with limits, fair queuing, placement.
5. **Customise via configuration.**
6. **Operations and enterprise features** (provisioning, migrations, SSO, residency, audit).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| One model for everyone | Tiered hybrid with cells |
| Tenant ID from request | From auth, enforced with RLS |
| Ignores noisy neighbours | Quotas, fair queuing, placement |
| Per-customer code branches | Configuration and extension points |
| No enterprise view | SSO, audit, residency, CMK |

#### Useful phrases
- "Same code everywhere; only routing and configuration differ by tenant."
- "Cells bound the blast radius of incidents and deploys."
- "Tenant isolation is enforced in the data layer, not left to each developer."
- "Heavy tenants get moved, not everyone slowed down."

#### Common pitfalls
- **Missing tenant filters.**
- **Per-tenant forks.**
- **Shared queues without fairness.**
- **Choosing silo-per-tenant without automation.**

#### Follow-ups to expect (with sample answers)
- **"How do you roll out releases safely across tenants?"**
  "Deploy cell by cell, starting with internal and low-risk cells, with automated canary analysis per cell."
- **"How do you price and meter usage?"**
  "Emit usage events per tenant (seats, API calls, storage) to a metering pipeline feeding billing, with limits enforced by plan."
- **"How do you give support staff access safely?"**
  "Audited, time-limited impersonation with tenant consent where required, and least-privilege support roles."

#### What senior interviewers look for
- **Architectural range** across isolation models.
- **Operational and business awareness.**
- **Defence in depth** for tenant isolation.

#### Practise it
1. Draw a cell-based multi-tenant architecture with a tenant directory.
2. Write an RLS policy and explain how the tenant context is set per request.
3. Explain how you'd handle a noisy neighbour, out loud.

## Build vs buy for infrastructure
- id: be-arch-06
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels: senior, staff
- tags: build vs buy, vendor selection, total cost of ownership, strategy

### Prompt
Your team needs a capability like feature flags, search, authentication or a workflow engine. How do you decide whether to build it, use open source, or buy a managed service?

### Answer
#### What the interviewer is really testing
- Thinking in terms of **core vs context** (differentiation) and **total cost of ownership**.
- A structured **evaluation process**: requirements, options, criteria, proof of concept.
- Awareness of **risks**: vendor lock-in, security/compliance, pricing changes, operational burden of self-hosting.
- **Reversibility**: abstractions and exit strategies.

#### Key points
- Build what **differentiates** your product; buy or adopt what's **commodity** (auth, email delivery, observability, feature flags) unless there's a strong reason.
- Options: **build in-house**, **self-host open source**, **managed open source** (cloud-hosted), **SaaS vendor**.
- **TCO** includes engineering time to build, operate, upgrade, secure and support, on-call burden, opportunity cost, not just licence fees.
- Criteria: requirements fit, cost at scale, time to value, operational burden, security/compliance (data residency, SOC 2), reliability/SLA, integration, vendor viability, lock-in and exit cost, team skills.
- **Proof of concept** with real use cases; check references.
- Reduce lock-in with **thin abstractions** and data export; revisit decisions as scale changes.

#### Model answer
"**Start with differentiation.** Is this capability part of what makes our product better than competitors? If we're a payments company, our ledger and risk engine are core: build. Authentication, email delivery, feature flags or log management are rarely differentiating for most companies: buying lets our engineers focus on what customers pay us for.

**Understand requirements first:** functional needs, scale (now and in 2–3 years), latency, availability, compliance (data residency, certifications), integration with our stack, and must-haves vs nice-to-haves. Many build-vs-buy debates are really unclear requirements.

**Options spectrum:**
| Option | Pros | Cons |
|---|---|---|
| Build in-house | Exact fit, full control, no vendor fees | Slow, ongoing maintenance, opportunity cost, bus factor |
| Self-hosted open source | Control, no licence cost, community | Operations, upgrades, security patching, scaling expertise |
| Managed open source (cloud) | Less ops, standard APIs, portable-ish | Cost, some limits, cloud lock-in |
| SaaS vendor | Fastest time to value, expert-run, features | Fees grow with scale, lock-in, data leaving our boundary, vendor risk |

**Total cost of ownership (3-year view):**
- **Build:** initial engineering (e.g. 2 engineers × 4 months), plus ongoing maintenance (often 20–30% of an engineer forever), on-call, security reviews, documentation and onboarding, and the **opportunity cost** of features not built.
- **Self-hosted OSS:** infrastructure, operations time, upgrades, incident risk, expertise.
- **Buy:** subscription at projected scale (watch pricing tiers based on seats, events or MAUs), integration effort, vendor management, exit cost.
Engineers often underestimate build costs and overestimate vendor costs; I make the numbers explicit.

**Evaluation process:**
1. Write requirements and weighted criteria (fit, cost, time to value, ops burden, security/compliance, reliability, integration, vendor viability, exit cost).
2. Shortlist 2–3 options including at least one build/OSS and one buy.
3. **Proof of concept** (1–2 weeks) on real use cases: integrate with a real service, test performance, check SDK quality and docs.
4. Security and legal review: data processed, certifications, DPA, data residency, SSO/audit support.
5. Reference calls with similar customers; check vendor financial health and roadmap.
6. Decision doc with the scoring and the recommendation.

**Managing lock-in:**
- Use **thin internal abstractions** where swapping is plausible (e.g. our own `FeatureFlags` interface over the vendor SDK; OpenTelemetry for observability instead of vendor-specific agents).
- Ensure **data export** is possible; keep critical data copies where appropriate.
- Don't over-abstract: a lowest-common-denominator wrapper can lose the vendor's best features; abstract only the parts we'd realistically swap.
- Negotiate contract terms: price caps, exit assistance, SLAs.

**Revisit at scale changes:** a SaaS that's cheap at 1M events/month might cost more than a team at 10B events/month; conversely, a home-grown system might become a maintenance burden as needs grow. I'd set review points (e.g. annually or at cost thresholds).

**Example decision:** For feature flags, building a basic on/off flag system looks like two weeks of work, but production needs percentage rollouts, targeting rules, audit logs, SDKs for multiple languages, low-latency evaluation, and a UI for product managers. A vendor or a mature open-source option (e.g. Unleash, OpenFeature-compatible) delivers that immediately. Unless flags were core to our business or vendors couldn't meet a compliance requirement, I'd buy or adopt."

#### Another worked example: building search was the right call
"An e-commerce company evaluated a search SaaS versus building on OpenSearch. At their catalogue size (50M products) and query volume, the SaaS quote was $900k/year, and ranking customisation was core to their conversion. They chose managed OpenSearch with a dedicated search team of three, because relevance tuning was a differentiator and the cost difference funded the team. A smaller company with 50k products would rightly choose the SaaS."

#### A third worked example: an in-house auth system that became a burden
"A startup built its own authentication early on. Three years later it needed SSO/SAML, SCIM provisioning, MFA, and SOC 2 controls for enterprise customers: an estimated 6 engineer-months, plus ongoing security risk. They migrated to a managed identity provider over a quarter, using an abstraction layer around session handling and a phased user migration (lazy password migration on next login)."

#### Variations you might be asked
- "What if the vendor goes out of business?": evaluate vendor health upfront, keep data export and abstractions, and have an exit plan documented.
- "When should you never buy?": when the capability is your core differentiator, or when data/compliance constraints make external processing unacceptable.
- "How do you convince engineers who want to build?": compare TCO honestly, emphasise opportunity cost, and offer interesting work on the differentiating parts.

#### Step-by-step framework
1. **Core or context?**
2. **Clarify requirements** and scale.
3. **List options** across the spectrum.
4. **Compare TCO and criteria**; run a PoC.
5. **Security, legal, vendor diligence.**
6. **Decide, limit lock-in, set review points.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Building is cheaper; no licence fees" | Full TCO including maintenance and opportunity cost |
| "Always buy" | Builds differentiating capabilities |
| No evaluation | Criteria, PoC, references |
| Ignores lock-in | Thin abstractions, data export, contracts |
| One-time decision | Revisits at scale changes |

#### Useful phrases
- "Build what differentiates us; buy what doesn't."
- "The licence fee is visible; the maintenance cost of building isn't."
- "I'd abstract only what we'd realistically swap."
- "Let's revisit when we hit ten times the volume."

#### Common pitfalls
- **Underestimating ongoing maintenance.**
- **Over-abstracting vendors.**
- **Skipping security/compliance review.**
- **Ignoring pricing at future scale.**

#### Follow-ups to expect (with sample answers)
- **"How do you compare costs fairly?"**
  "Model three years at projected scale, include fully loaded engineering costs for build/operate, and include integration and exit costs for buying."
- **"What makes a good proof of concept?"**
  "Real use cases, real data volumes, integration with one production-like service, and explicit pass/fail criteria."
- **"How do you handle a vendor price increase?"**
  "Assess alternatives using the abstraction and exit plan, negotiate with usage data, and reconsider build/OSS if the economics changed."

#### What senior interviewers look for
- **Strategic, business-aware thinking.**
- **Structured evaluation.**
- **Risk awareness** with pragmatic mitigation.

#### Practise it
1. Do a build-vs-buy analysis for feature flags or authentication for a company you know.
2. Estimate 3-year TCO for building a simple internal tool versus a SaaS.
3. Explain core vs context, out loud.

## Mentoring and raising the bar on a team
- id: be-arch-07
- round: ARCHITECTURE_TECH_LEAD
- difficulty: medium
- levels: senior, staff
- tags: mentoring, coaching, engineering culture, standards, growth

### Prompt
How do you mentor engineers and raise the engineering bar on your team? Give examples of how you've helped someone grow and how you've improved team practices.

### Answer
#### What the interviewer is really testing
- **Coaching** skills: helping others grow rather than doing the work for them.
- **Multiplying impact** through practices, standards, documentation and tooling.
- **Adapting** to different people and levels.
- Concrete **examples and outcomes**.

#### Key points
- Mentoring starts with **understanding goals** and current level; set specific growth areas.
- **Coach, don't just tell**: ask questions, let people make decisions, review their reasoning; gradually increase **scope and autonomy** (stretch assignments).
- Techniques: pairing, design reviews, thoughtful code review comments, sharing context ("why" behind decisions), modelling behaviour, sponsoring (giving visible opportunities).
- Give **timely, specific feedback**, both positive and constructive.
- Raise the bar for the whole team through **practices**: review standards, design docs, testing norms, incident reviews, internal talks, documentation, automation (linting, CI checks).
- Measure: people's growth (promotions, ownership), team metrics (lead time, incidents), and engagement.

#### Model answer
"I think of my impact as a senior engineer partly as **multiplied through others**: helping individuals grow and making good practices the default for the whole team.

**Mentoring individuals.**
- **Start with their goals**: in a first conversation I ask what they want to get better at, what they enjoy, and where they feel stuck. We agree two or three concrete growth areas (e.g. 'design skills for medium-sized features', 'debugging production issues confidently').
- **Calibrate support to their level**:
  - For newer engineers: pairing, well-scoped tasks, detailed code review with explanations, and showing *how* I approach problems (thinking aloud while debugging).
  - For mid-level engineers: stretch assignments (owning a feature end to end, writing their first design doc), with me as a reviewer and sounding board rather than the decision-maker.
  - For senior engineers: sponsorship (putting them forward to lead cross-team initiatives), and feedback on influence and communication.
- **Coach with questions** rather than answers: 'What are the failure modes here?', 'How would you know if this broke in production?', 'What alternatives did you consider?' People retain what they figure out.
- **Let them own decisions**, even ones I'd make differently if the risk is acceptable; reviewing outcomes together teaches more than me deciding.
- **Feedback** that's timely, specific and balanced: 'Your incident update was clear and calm; next time include the customer impact upfront for stakeholders.'
- **Sponsorship**: give credit publicly, recommend them for visible work, and advocate for them in promotion discussions.

**Example (STAR).**
- *Situation:* A mid-level engineer on my team, Priya, was strong at implementation but avoided design discussions and wasn't progressing towards senior.
- *Task:* Help her build design and communication skills.
- *Action:* We agreed a goal of leading the design of our new notification preferences service. I shared design doc examples, reviewed her first draft focusing on questions rather than rewrites ('what happens if the email provider is down?'), had her present it at the design review with me in support, and gave feedback afterwards. Over the next quarter, I stepped back further: she ran the review and handled pushback herself.
- *Result:* The service launched on time with no major incidents; she led two more designs that year, began mentoring a junior engineer herself, and was promoted to senior within 12 months.

**Raising the bar for the team.**
- **Code review standards**: a team checklist covering correctness, security, migrations, idempotency and observability; labelling comments as blocking or nit; target turnaround times.
- **Design docs** for significant changes, with a lightweight template and a weekly design review slot open to everyone.
- **Blameless postmortems** with tracked actions, and reading recent incidents together, so lessons spread.
- **Testing norms**: integration tests with real databases, no sleeps in tests, every bug fix with a test.
- **Automation over policing**: formatters, linters, type checks, migration safety checks, dependency scanning in CI, so standards don't depend on reviewers remembering.
- **Knowledge sharing**: short internal tech talks, 'lunch and learn' sessions, rotating who presents; writing runbooks and onboarding docs.
- **Modelling behaviour**: I write clear PR descriptions, admit mistakes openly, and ask questions in public channels so others feel safe to.

**Example:** our change failure rate was around 20%, often due to risky migrations and missing tests. I introduced a migration checklist in the PR template, a CI check flagging locking DDL, and a monthly 'incident review club'. Six months later, change failure rate had dropped to about 8% and two engineers who had never written design docs were leading design reviews."

#### Another worked example: mentoring through on-call
"A junior engineer was anxious about joining on-call. We did three shadow shifts where I narrated my thinking during alerts, then three reverse-shadow shifts where they led and I supported. We wrote runbooks together for the alerts they found confusing. By their first solo shift they handled a database failover confidently, and their runbooks helped the next new joiner too."

#### A third worked example: when mentoring wasn't working
"I mentored an engineer who kept missing deadlines. My initial approach of more detailed task breakdowns didn't help. In a candid conversation I learned they were uncomfortable asking for help and spent days stuck. We agreed a '90-minute rule' (ask after 90 minutes stuck) and daily short check-ins for a month. Their delivery improved significantly; I learned to diagnose root causes before prescribing solutions."

#### Variations you might be asked
- "How do you mentor someone more senior in years but newer to the domain?": focus on domain context, treat it as a peer exchange, and learn from their experience in return.
- "How do you balance mentoring with your own delivery?": mentoring is part of the role's impact; I timebox it, combine it with real work (pairing on actual tasks), and make it visible in planning.
- "How do you raise standards without being seen as a gatekeeper?": involve the team in defining standards, automate them, explain the why, and lead by example.

#### Step-by-step framework
1. **Understand goals** and agree growth areas.
2. **Calibrate support** to level; coach with questions.
3. **Stretch assignments** with increasing autonomy.
4. **Feedback and sponsorship.**
5. **Team practices**: reviews, design docs, postmortems, tests.
6. **Automate standards** and measure outcomes.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I answer their questions" | Structured growth goals and coaching |
| Does the hard work for them | Stretch assignments with support |
| Generic examples | Specific stories with outcomes |
| Standards via policing | Team-defined standards plus automation |
| No measurement | Promotions, metrics, ownership growth |

#### Useful phrases
- "My impact multiplies when the people around me grow."
- "I ask questions that help them find the answer."
- "We automated the standard so nobody has to remember it."
- "I gave them the stage and stayed in the audience."

#### Common pitfalls
- **Taking over** when it gets hard.
- **Vague feedback.**
- **Gatekeeping** instead of teaching.
- **Neglecting quieter team members.**

#### Follow-ups to expect (with sample answers)
- **"How do you give difficult feedback?"**
  "Privately, promptly, with specific examples and impact, and with a focus on what to do differently; then follow up."
- **"How do you know mentoring is working?"**
  "The person takes on larger scope independently, needs less guidance over time, and starts helping others."
- **"How do you help a team adopt a new practice?"**
  "Explain the problem it solves, pilot it, gather feedback, adjust, and make it easy (templates, automation)."

#### What senior interviewers look for
- **Force multiplication.**
- **Empathy and adaptability.**
- **Tangible culture improvements.**

#### Practise it
1. Prepare one STAR story about mentoring someone and one about improving a team practice.
2. Write three coaching questions you'd ask during a design review.
3. Explain how you'd raise testing standards on a team, out loud.

## What does a staff engineer do? Influence across teams
- id: be-arch-08
- round: ARCHITECTURE_TECH_LEAD
- difficulty: hard
- levels: staff
- tags: staff engineer, influence, technical strategy, leadership, cross-team

### Prompt
What do you see as the role of a staff engineer? Give an example of how you've driven technical direction or solved a problem across multiple teams without direct authority.

### Answer
#### What the interviewer is really testing
- A clear model of the **staff role**: scope beyond one team, technical direction, multiplying others.
- **Influence without authority**: building alignment, writing, relationships.
- Choosing **the right problems** (high leverage) and seeing them through.
- **Concrete cross-team impact** with outcomes.

#### Key points
- Staff engineers operate at **scope larger than one team**: a group of teams, a domain, or the organisation.
- Common archetypes (Will Larson): **tech lead** (guiding a team's execution), **architect** (direction for a domain), **solver** (deep-diving hard problems), **right hand** (extending a leader's reach).
- Core activities: **setting technical direction** (strategy, vision docs), **identifying and solving high-leverage problems**, **aligning teams**, **raising the bar** (standards, reviews, mentoring senior engineers), **bridging** engineering and business.
- Influence through **writing** (design docs, strategy), **relationships**, **data**, **prototypes**, and **sponsorship** of others.
- Still technical: hands-on enough to stay credible (prototypes, critical reviews, debugging hard problems), but measured by **organisational outcomes**, not personal output.
- Knowing what **not** to do: avoid becoming a bottleneck, don't hoard interesting work.

#### Model answer
"**How I see the role.** A staff engineer is accountable for technical outcomes beyond a single team. Senior engineers make their team succeed; staff engineers make a group of teams or an organisation succeed technically. That means:
1. **Finding the most important technical problems** that no single team owns: cross-cutting reliability issues, architectural limits on growth, inconsistent practices, platform gaps.
2. **Setting technical direction**: writing strategy and vision documents that help teams make consistent decisions without needing me in every room.
3. **Aligning people**: getting multiple teams, product and leadership to agree on a path and commit resources.
4. **Raising the bar**: design reviews, standards, mentoring senior engineers, sponsoring others' growth.
5. **Staying technical**: prototyping, reviewing critical designs, diving into the hardest incidents, so my judgement stays grounded.
Success is measured by what the organisation achieves, not by the code I write personally. I also need to avoid becoming a bottleneck: the goal is to make good decisions happen without me.

**Example (STAR).**
*Situation:* At my last company, eight product teams each owned services that called each other synchronously. Incidents frequently cascaded: one slow service took down checkout. We had 14 SEV1/SEV2 incidents in two quarters, and each team had fixed its local symptoms differently (some with retries that made things worse). No team owned 'cross-service reliability'.

*Task:* As a staff engineer in the commerce group, I took on reducing cascading failures across teams, without managing any of them.

*Action:*
1. **Built the evidence.** I analysed postmortems from the last six months and traced call graphs from our tracing system. Findings: 9 of 14 incidents involved missing timeouts or aggressive retries; checkout depended synchronously on 11 services, 6 of which weren't needed to complete an order.
2. **Wrote a short strategy doc**: 'Resilient service communication'. It set clear principles (timeouts on every call, retry budgets, circuit breakers, async for non-critical dependencies, graceful degradation for checkout) and a target: checkout should succeed if any non-payment dependency fails.
3. **Built alignment before publishing.** I met each team's tech lead one-on-one, asked about their constraints, and incorporated their feedback; I reviewed it with the SRE lead and our VP Engineering, who agreed to include it in quarterly planning. By the time it was published, most leads had shaped it.
4. **Made the right thing easy.** With two engineers from the platform team, I built a shared client library with default timeouts, retry budgets with jitter, circuit breakers and standard metrics, plus dashboards per service showing dependency health. Adoption was a dependency upgrade and configuration, not a rewrite.
5. **Led by example on the hardest part.** I paired with the checkout team to redesign their flow: recommendations, loyalty points and email confirmation moved to async events; inventory got a cached fallback.
6. **Tracked and communicated.** A simple scorecard per team (timeouts configured, library adopted, chaos test passed) reviewed monthly with tech leads, and shared in engineering all-hands with credit to teams.

*Result:* Over two quarters, all eight teams adopted the library; cascading incidents dropped from 9 in the prior two quarters to 1. During a later outage of the loyalty service, checkout continued working with loyalty points applied afterwards. Two senior engineers who led adoption in their teams were later promoted, partly on that work. The strategy doc became the default reference in design reviews, so new services were built resilient from the start.

**What I learned:** influence comes from evidence, involving people early so the plan is partly theirs, and making the right path the easiest path. Writing was my biggest lever."

#### Another worked example: the 'solver' archetype
"A data corruption issue appeared intermittently across three services for months; each team believed it was another team's bug. I spent two weeks investigating across their codebases and found a race between a CDC pipeline and a backfill job writing the same rows. I proposed a fix touching two teams' code, paired with both to implement it, and wrote up the investigation so others could learn the debugging approach. The issue never recurred."

#### A third worked example: knowing what not to do
"Early in my staff role, I reviewed every design doc in the group and became a bottleneck: reviews waited a week for me. I set up a design review rotation with senior engineers from each team, wrote a review guide capturing what I looked for, and only joined high-risk reviews. Review turnaround dropped to two days, and the senior engineers grew in the process."

#### Variations you might be asked
- "How do you choose what to work on?": the intersection of high impact, nobody else owning it, and my strengths; aligned with organisational priorities and validated with leadership.
- "How do you stay technical?": prototypes, reviewing critical code, on-call participation, deep dives into hard incidents; but I avoid owning critical-path implementation that would block teams.
- "What's the difference between staff engineer and engineering manager?": managers are accountable for people and team delivery; staff engineers for technical direction and quality across teams; they partner closely.

#### Step-by-step framework
1. **Define the role**: scope, direction, alignment, bar-raising, staying technical.
2. **Pick a high-leverage cross-team problem.**
3. **Build evidence.**
4. **Write direction; align people early.**
5. **Make the right path easy** (tooling, defaults).
6. **Track outcomes, give credit, avoid bottlenecks.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "A very senior coder" | Accountable for cross-team technical outcomes |
| Influence by authority/title | Evidence, writing, relationships |
| Does all the work personally | Enables teams with tools and direction |
| No measurable outcome | Incident reductions, adoption, promotions |
| Becomes a bottleneck | Scales through others |

#### Useful phrases
- "My measure of success is what the organisation achieves, not my commit count."
- "I made the resilient path the default path."
- "By the time the doc was published, most tech leads had helped shape it."
- "I try to make good decisions happen without me in the room."

#### Common pitfalls
- **Ivory-tower architecture.**
- **Hero coding** instead of enabling.
- **Strategy without follow-through.**
- **Ignoring relationships.**

#### Follow-ups to expect (with sample answers)
- **"How do you handle a team that disagrees with your direction?"**
  "Understand their constraints, adapt where they're right, find a pilot that proves value, and escalate only as a last resort."
- **"How do you work with engineering managers?"**
  "As partners: they own people and delivery, I own technical direction; we align on priorities and staffing together."
- **"What would you do in your first 90 days as a staff engineer here?"**
  "Listen across teams, map systems and pain points, deliver a quick win, and propose a small number of high-leverage priorities with leadership."

#### What senior interviewers look for
- **Organisational impact.**
- **Influence and writing.**
- **Judgement about leverage.**

#### Practise it
1. Prepare a STAR story of cross-team influence with measurable outcomes.
2. Write a one-page technical strategy for a problem you know.
3. Explain the staff engineer archetypes and which fits you, out loud.
