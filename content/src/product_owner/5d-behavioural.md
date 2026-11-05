# Product Owner — Behavioural (continued)

## Tell me about a time you handled a production incident or crisis
- id: po-behavioural-19
- round: BEHAVIORAL_BAR_RAISER
- difficulty: medium
- levels:
- tags: incidents, crisis management, communication, STAR

### Prompt
Tell me about a time something went seriously wrong in production. What was your role, and how did you handle it?

### Answer
#### What the interviewer is really testing
- **Composure** under pressure.
- Understanding of the **PO's role** in an incident (customer impact, communication, decisions), not just engineering's.
- **Clear communication** to stakeholders and customers.
- **Learning**: blameless post-mortems and prevention.

#### Key points
- In an incident, engineers usually lead the **technical fix**. The PO's role: **assess customer and business impact**, **make product decisions** (e.g. disable a feature, roll back), **coordinate communication**, **protect the team** from distraction.
- Communicate **early, honestly and regularly**.
- After the incident, run a **blameless post-mortem** and follow through on actions.

#### Model answer
"**Situation.** At a food delivery company, a release on a Friday evening caused about 15% of card payments to fail, during our busiest period.

**Task.** As PO for checkout, I needed to help limit the impact on customers and the business, and coordinate communication while engineers worked on the fix.

**Action.**
- **Joined the incident call immediately** with the on-call engineers and tech lead.
- **Assessed impact**: with the data analyst, estimated around 1,200 failed orders per hour and identified that the failures affected one card type on the new checkout flow.
- **Made a quick product decision**: rather than waiting for a fix, I agreed with the tech lead to **turn off the new checkout flow using a feature flag**, reverting customers to the previous version within 10 minutes.
- **Coordinated communication**:
  - Updated leadership and customer support every 30 minutes.
  - Gave support a short script for affected customers.
  - Agreed with marketing to send an apology and a small voucher to customers whose orders failed.
- **Protected the engineers** from interruptions so they could focus on root cause.
- **Led follow-up**: we held a blameless post-mortem on Monday.

**Result.**
- Payment success returned to normal within 15 minutes of the decision.
- Around 3,000 affected customers received an apology and voucher, and complaints were lower than we feared.
- Post-mortem actions: automated tests for each card type, a rule against major releases on Friday evenings, and an alert for payment failure rates by card type.
- Lesson: having a quick switch-off option (feature flags) and a clear communication plan makes a huge difference in a crisis."

#### Another worked example: a data issue
"**Situation.** A bug showed some users incorrect account balances.
**Action.** I worked with engineering to hide the balance widget immediately, coordinated a clear in-app message, and prioritised the fix and a full check of affected accounts.
**Result.** No incorrect transactions occurred, trust was maintained through transparent communication, and we added data-validation checks."

#### A third example: a third-party outage
"**Situation.** Our email provider had a major outage, so customers didn't receive invoices or password resets for several hours.
**Action.** With the tech lead, we switched critical emails (password resets) to a backup provider within an hour, posted a status update in the app, and briefed support with a script. Afterwards, we set up automatic failover for critical emails.
**Result.** Password resets recovered quickly, complaints were limited, and the next provider outage months later caused no customer impact."

#### Make it your own
- Pick an incident where **you had a clear role**: decisions, communication, coordination.
- Show **calm, structured actions** and **regular communication**.
- Highlight the **post-mortem** and **prevention** steps.
- Avoid blaming individuals.

#### The 30-second version
"A Friday-evening release caused about 15% of card payments to fail during our busiest time. While engineers investigated, I assessed the impact with our analyst and agreed with the tech lead to switch off the new checkout with a feature flag, which restored payments within 15 minutes. I updated leadership and support every 30 minutes, arranged apologies and vouchers for affected customers, and led a blameless post-mortem that added tests, alerts and a no-Friday-release rule."

Practise saying this calmly; interviewers are listening for composure as much as content.

#### Step-by-step framework (STAR)
| Part | Include |
|---|---|
| Situation | The incident and its impact |
| Task | Your role as PO |
| Action | Impact assessment, product decisions, communication, protecting the team, post-mortem |
| Result | Recovery, customer outcome, prevention |

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Engineering fixed it." | Clear PO role in impact, decisions and communication |
| Panicked or blamed | Calm, structured response |
| No communication plan | Regular updates to leadership, support, customers |
| Fixed and forgot | Blameless post-mortem and prevention |

#### Useful phrases
- "I focused on customer impact and communication while engineers fixed the root cause."
- "We turned the feature off with a flag within 10 minutes."
- "I updated stakeholders every 30 minutes."
- "We ran a blameless post-mortem and added preventive tests and alerts."

#### Common pitfalls
- **No clear personal role.**
- **Blaming individuals.**
- **Poor communication.**
- **No follow-up actions.**

#### Follow-ups to expect (with sample answers)
- **"What's a blameless post-mortem?"**
  "A review focused on what happened and how systems and processes can improve, rather than who made a mistake, so people share information openly."
- **"When would you roll back versus fix forward?"**
  "Roll back when impact is high and the cause is the release; fix forward only if the fix is quick and low-risk."
- **"How do you communicate with customers during incidents?"**
  "Honestly and simply: what's affected, what we're doing, and when we'll update next, without technical jargon."

- **"What would you put in an incident communication to customers?"**
  "What's affected, what we're doing, any workaround, and when we'll update next, in plain language."
- **"How do you prepare for incidents before they happen?"**
  "Feature flags, monitoring and alerts, runbooks, clear on-call roles, and communication templates."

#### What senior interviewers look for
- **Incident leadership** and organisational learning.
- Building **resilience** (flags, monitoring, release practices).
- **Customer trust** under pressure.

#### Practise it
1. **Find your story**: an incident, outage or serious bug you were involved in.
2. Write your role, the decisions you made, and the preventive actions.
3. Practise **out loud in under 3 minutes**.

## Tell me about a time you worked with a difficult team member
- id: po-behavioural-20
- round: BEHAVIORAL_BAR_RAISER
- difficulty: medium
- levels:
- tags: teamwork, conflict, collaboration, STAR

### Prompt
Tell me about a time you worked with a team member who was difficult to work with. How did you handle it?

### Answer
#### What the interviewer is really testing
- **Interpersonal skills** and professionalism.
- Whether you **address issues directly** and respectfully.
- **Empathy**: understanding the other person's perspective.
- Whether the working relationship **improved**.

#### Key points
- Describe **behaviours**, not personality ("they often missed refinement sessions", not "they were lazy").
- Talk to them **privately and early**.
- **Seek to understand** their perspective.
- Agree **practical changes** together.
- Involve their **manager** only if direct conversation doesn't work.
- Show the **outcome**.

#### Model answer
"**Situation.** A senior engineer on my team often dismissed user stories in refinement as 'unclear' or 'pointless', sometimes in a way that discouraged others from speaking. Refinement sessions became tense, and the team's estimates were often delayed.

**Task.** As PO, I needed productive refinement and a team where everyone felt able to contribute, without damaging my relationship with a very experienced engineer.

**Action.**
- **Talked privately**: I asked for a one-to-one coffee and said, 'I've noticed refinement has felt tense recently, and I'd like to understand how it looks from your side.'
- **Listened**: they explained they felt stories arrived too late and too detailed, with no room for engineering input, and that they'd raised it before without change. Some of their frustration was justified.
- **Owned my part**: I acknowledged I'd been bringing finished solutions.
- **Agreed changes together**:
  - I'd share draft stories two days before refinement, framed around problems.
  - They'd add technical questions in comments beforehand.
  - In sessions, we'd focus on solutions together.
- **Gave them a bigger role**: asked them to lead technical discovery for an upcoming feature, using their expertise.
- **Followed up** after two weeks to check how it was going.

**Result.**
- Refinement became much more productive; sessions were shorter and estimates more reliable.
- Their technical discovery identified a simpler architecture that saved about three weeks.
- Other team members started contributing more in refinement.
- Lesson: difficult behaviour often has a legitimate frustration behind it; addressing it directly and owning my part made the difference."

#### Another worked example: a disengaged designer
"**Situation.** A designer missed deadlines and seemed disengaged.
**Action.** In a private conversation, I learned they were spread across three teams. I worked with their manager to clarify priorities and protect time for our work.
**Result.** Designs arrived on time, and their engagement improved noticeably."

#### A third example: a stakeholder-facing colleague
"**Situation.** A fellow PO on a neighbouring team often promised our team's work to their stakeholders without checking with me.
**Action.** I spoke to them privately, explaining the impact on our commitments, and learned they felt pressured by their leadership. We agreed a fortnightly sync to align roadmaps and a rule to check before promising cross-team work.
**Result.** Surprises stopped, our roadmaps aligned better, and we later co-led a joint initiative successfully."

#### Make it your own
- Describe the **behaviour**, not the person.
- Show you **talked privately and early**, and **listened**.
- Include **your part** in the situation.
- Show **agreed changes** and a **better outcome**.

#### The 30-second version
"A senior engineer often dismissed stories in refinement in a way that discouraged others. I spoke to them privately and learned they felt stories arrived too late and too detailed, which was partly my fault. We agreed I'd share problem-focused drafts two days early, they'd add questions beforehand, and I asked them to lead technical discovery on the next feature. Refinement became shorter and more productive, and their discovery found a simpler architecture that saved about three weeks."

Keep the short version free of negative labels; describe behaviour and outcomes only.

#### Step-by-step framework (STAR)
| Part | Include |
|---|---|
| Situation | The behaviour and its impact (objectively) |
| Task | What you needed |
| Action | Private conversation, listening, owning your part, agreed changes, follow-up |
| Result | Improved relationship and outcomes |

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "They had a bad attitude." | Describes behaviour objectively |
| Went to their manager first | Spoke to them directly first |
| Blamed them entirely | Owned their own part |
| No change | Clear improvement |

#### Useful phrases
- "I'd like to understand how it looks from your side."
- "Some of their frustration was justified, and I owned my part."
- "We agreed practical changes together."
- "I followed up after two weeks."

#### Common pitfalls
- **Labelling the person.**
- **Avoiding the conversation.**
- **Escalating immediately.**
- **No resolution.**

#### Follow-ups to expect (with sample answers)
- **"What if they hadn't changed?"**
  "I'd have involved their manager, focusing on specific behaviours and impact, and kept supporting the rest of the team."
- **"How do you give difficult feedback?"**
  "Privately, specifically, about behaviour and impact, with curiosity about their view."
- **"How do you make sure quieter team members are heard?"**
  "Share materials in advance, invite input directly, use written comments, and set norms for discussions."

- **"How do you work with someone you don't get along with?"**
  "Focus on shared goals, keep communication professional and clear, and look for areas where we can collaborate well."
- **"What if the behaviour affects the whole team?"**
  "Address it promptly with the person, and involve their manager if it continues, while making sure the team feels supported."

#### What senior interviewers look for
- **Mature conflict resolution.**
- **Psychological safety** for the whole team.
- **Turning friction into collaboration.**

#### Practise it
1. **Find your story**: a colleague you had friction with.
2. Write their perspective, your part, and what changed.
3. Practise **out loud in under 3 minutes**, without negative labels.

## What are your strengths and weaknesses?
- id: po-behavioural-21
- round: BEHAVIORAL_BAR_RAISER
- difficulty: easy
- levels:
- tags: self-awareness, strengths, weaknesses, interview basics

### Prompt
What are your greatest strengths as a Product Owner? And what's a weakness you're working on?

### Answer
#### What the interviewer is really testing
- **Self-awareness**: do you know yourself honestly?
- **Relevance**: are your strengths important for this role?
- **Growth**: are you actively improving on weaknesses?
- **Authenticity**, not rehearsed clichés.

#### Key points
- **Strengths**: choose 2–3 that matter for the role, each backed by a **specific example** with impact.
- **Weakness**: choose a **real** one that isn't critical to the core role, explain its **impact**, and describe **concrete steps** you're taking, with evidence of progress.
- Avoid **disguised strengths** ("I'm a perfectionist", "I work too hard").
- Keep it **concise**: about 2 minutes total.

#### Model answer
"**Strengths:**

1. **Turning customer insight into clear priorities.** I make a habit of talking to customers every week and combining what I hear with data. For example, interviews and support data led me to prioritise a simple payment-reminder feature over a complex reporting request, which reduced average days to payment by about 5 for customers who used it.

2. **Building strong partnerships with engineering.** I involve engineers early in discovery and frame problems rather than solutions. In my last team, that led to a simpler architecture that saved about three weeks on a major feature, and engineers rated their involvement in decisions much higher in our team survey.

3. **Clear communication with stakeholders.** I share short, regular updates and bring trade-offs with data, which reduced surprise escalations significantly after I introduced a fortnightly update and stakeholder review.

**Weakness:**

Earlier in my career, I found it hard to **say no quickly**. I'd spend too long trying to accommodate stakeholder requests, which sometimes overloaded the team and delayed clear decisions.

**What I've done about it:**
- I introduced a simple **intake process** and agreed **prioritisation criteria** with stakeholders, so decisions are grounded in shared goals rather than personal negotiation.
- I practise giving a clear answer within a few days, with a reason and an alternative.
- I ask my manager for feedback on how I handle stakeholder requests.

It's much better now. Stakeholders tell me they appreciate clear answers, and the team has fewer mid-sprint disruptions. But I still keep an eye on it, especially with very senior stakeholders."

#### Another worked example: a different weakness
"**Weakness:** I used to go too deep into details myself, e.g. writing very detailed specifications.
**Steps:** I now focus on the problem and acceptance criteria, and trust designers and engineers with solutions. I timebox my own detailed analysis.
**Evidence:** the team proposes more solutions, and I have more time for discovery and strategy."

#### Choosing strengths and weaknesses
| Good strength examples | Good weakness examples | Avoid |
|---|---|---|
| Customer insight | Saying no quickly | "I'm a perfectionist" |
| Data-driven prioritisation | Over-detailing specifications | "I work too hard" |
| Engineering partnership | Public speaking to large groups | Weaknesses critical to the role (e.g. "I don't like talking to customers") |
| Stakeholder communication | Delegating | No weakness at all |

#### A third example: strengths framed for a senior role
"For a senior PO role, I'd emphasise:
- **Strategic thinking**: 'I defined a product strategy that shifted our focus to small businesses, which grew active customers by 40% over a year.'
- **Influence**: 'I aligned four teams and two directors around a shared roadmap.'
- **Developing others**: 'I mentored two junior POs, one of whom has since been promoted.'

Weakness example for a senior role: 'I sometimes take on too much myself instead of delegating. I've started deliberately delegating ownership of initiatives to junior POs, with regular check-ins, and it's freed my time for strategy.'"

#### Make it your own
- Look at the **job description** and pick strengths that match its main requirements.
- For each strength, prepare **one story with a number**.
- Choose a weakness you're **genuinely improving**, with **evidence** of progress.
- Practise until it sounds **natural**, not memorised.

#### Step-by-step framework
1. **2–3 strengths**, each with an example and impact.
2. **One real weakness**, with its impact.
3. **Concrete steps** you're taking.
4. **Evidence** of progress.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "I'm hard-working and a team player." | Specific, role-relevant strengths with examples |
| "I'm a perfectionist." | Real weakness with impact |
| No improvement plan | Concrete actions and evidence of progress |
| Very long answer | About 2 minutes |

#### Useful phrases
- "One of my strengths is… For example…"
- "A weakness I've been working on is…"
- "What I've done about it is…"
- "It's much better now, but I still keep an eye on it."

#### Common pitfalls
- **Disguised strengths** as weaknesses.
- **Generic strengths** without examples.
- **Critical weaknesses** for the role.
- **No evidence** of improvement.

#### Follow-ups to expect (with sample answers)
- **"What would your colleagues say about you?"**
  "Probably that I'm clear about priorities and easy to work with. Some would say I push for customer evidence before committing."
- **"What's a strength you'd like to develop further?"**
  "Strategic planning at a portfolio level, which I'm building by taking on quarterly planning for two teams."
- **"How do you get feedback?"**
  "Regular one-to-ones, retrospectives, and directly asking stakeholders what I could do better."

- **"What's a skill you want to develop in this role?"**
  "Choose something the role would genuinely help you grow, e.g. pricing strategy or leading discovery across multiple teams."
- **"How would your manager describe your biggest strength?"**
  Use real feedback you've received, ideally quoting it.

#### What senior interviewers look for
- **Deep self-awareness.**
- **Strengths aligned** with senior responsibilities (strategy, influence, leadership).
- **Ongoing development** habits.

#### Practise it
1. Write three strengths with one example each, relevant to the role.
2. Write one real weakness, its impact, steps you're taking and evidence of progress.
3. Practise **out loud in under 2 minutes**.

## Why are you leaving, and where do you see yourself in five years?
- id: po-behavioural-22
- round: BEHAVIORAL_BAR_RAISER
- difficulty: easy
- levels:
- tags: motivation, career goals, interview basics

### Prompt
Why are you looking to leave your current role? And where do you see yourself in five years?

### Answer
#### What the interviewer is really testing
- **Motivation**: are you moving *towards* something, not just away?
- **Professionalism**: no negativity about current or past employers.
- **Fit**: does the role match your goals?
- **Retention risk**: will you stay and grow here?

#### Key points
- **Why leaving**: frame positively around **growth, scope, mission or learning**. Be honest, but don't criticise your employer.
- **Five years**: show **ambition** aligned with this role and company (e.g. larger scope, senior product role, leading others), without sounding like you'll leave quickly.
- **Connect both** to this specific role.

#### Model answer
"**Why I'm looking to move:**
I've learned a lot in my current role. I've owned the customer portal for three years, launched self-service features that cut call volume by 35%, and built strong relationships with engineering and stakeholders. But the product is now quite mature, and most of the work is incremental optimisation.

I'm looking for a role with **broader scope and more product discovery**: shaping a product's direction, working closely with customers on new problems, and having more influence on strategy. That's exactly what attracts me to this role, because you're building new capabilities for small businesses and the PO here owns a whole customer journey.

**Where I see myself in five years:**
In five years, I'd like to be in a **senior product role**, owning a larger product area or leading a small group of product people, while staying close to customers and the team.

I'd hope to have:
- Delivered measurable impact on a product that customers love.
- Developed deeper skills in product strategy and discovery.
- Helped other product people grow, through mentoring or leading.

This role feels like a strong step in that direction, because of the scope, the focus on discovery, and the opportunity to grow with the company."

#### Another worked example: leaving after a short time
"If you've been in your current role a short time, be honest but positive:
> 'The role turned out to be more focused on project coordination than product ownership. I learned a lot about delivery, but I want to be closer to customers and product decisions, which is why this role appeals to me.'"

#### Good versus bad reasons
| Bad (avoid saying) | Good (positive framing) |
|---|---|
| "My manager is terrible." | "I'm looking for more ownership and influence." |
| "The company is a mess." | "I want to work on a product at an earlier, more exploratory stage." |
| "I'm bored." | "I'm looking for new challenges in discovery and strategy." |
| "Better pay." (only) | Focus on growth; discuss pay at the right stage |

#### A third example: a career change into product
"If you're moving into product from another role:
> 'I've spent five years in customer success, where I became the person who turned customer feedback into insights for the product team. I led an analysis that reshaped our onboarding and reduced early churn. I'm looking to move into product ownership full-time, because that's where I can have the biggest impact on customers. In five years, I'd like to be an experienced PO owning a significant product area, and this role is the ideal first step because it's so close to the customers I understand best.'"

#### Make it your own
- Write **two positive sentences** on why you're moving.
- Link your **five-year goal** to what this role offers.
- Avoid any **negative comments** about current or past employers.
- Practise until it takes **under 90 seconds**.

#### The 30-second version
"I've learned a lot in my current role, launching self-service features that cut call volume by 35%. The product is now mature and the work is mostly optimisation, so I'm looking for broader scope and more discovery, which is exactly what this role offers. In five years, I'd like to own a larger product area or lead other product people, and this role is a strong step toward that."

This short version is often all you need for this question; keep it positive and focused on the future.

#### Step-by-step framework
1. **Acknowledge** what you've gained in your current role.
2. **Explain what you're looking for** (growth, scope, mission).
3. **Connect** it to this role.
4. **Five-year vision**: ambitious, realistic, aligned.
5. **Link back** to why this role is a good step.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Criticises current employer | Positive about what they've learned |
| Running away from something | Moving towards something specific |
| "I don't know" about the future | Clear, aligned career goals |
| Goals unrelated to the role | Goals connected to this role |

#### Useful phrases
- "I've learned a lot, and now I'm looking for…"
- "That's exactly what attracts me to this role."
- "In five years, I'd like to be…"
- "This role feels like a strong step in that direction."

#### Common pitfalls
- **Negativity** about employers or colleagues.
- **Vague** or unrelated career goals.
- **Sounding like a flight risk** ("I want to start my own company next year").
- **Over-sharing** personal reasons.

#### Follow-ups to expect (with sample answers)
- **"What would make you stay in a role long term?"**
  "Growing scope, meaningful impact on customers, strong colleagues, and continued learning."
- **"Are you interviewing elsewhere?"**
  "Yes, with a few companies, but this role stands out because of…"
- **"What if you don't get promoted here in five years?"**
  "What matters most is growing scope and impact. If I'm growing and delivering value, titles follow."

- **"What would make you leave this role?"**
  "If I stopped learning or having impact. That's why the scope and growth here appeal to me."
- **"Why now?"**
  "I've achieved what I set out to do in my current role, and I'm ready for broader scope."

#### What senior interviewers look for
- **Clear career direction.**
- **Alignment** between personal goals and the company's needs.
- **Maturity** and professionalism.

#### Practise it
1. Write your reason for leaving in two positive sentences.
2. Write your five-year goal in two sentences, linked to this role.
3. Practise both **out loud in under 90 seconds**.

## What questions do you have for us?
- id: po-behavioural-23
- round: BEHAVIORAL_BAR_RAISER
- difficulty: easy
- levels:
- tags: questions for interviewer, research, interview basics

### Prompt
At the end of the interview, the interviewer asks: "Do you have any questions for us?" What should you ask?

### Answer
#### What the interviewer is really testing
- **Genuine interest** and preparation.
- **Product thinking**: do your questions reveal how you think?
- Whether you're **evaluating fit** thoughtfully, not just trying to get any job.

#### Key points
- **Always ask questions**: "No, you've covered everything" signals low interest.
- Prepare **5–8 questions** and choose 2–3 based on the conversation.
- Tailor questions to the **interviewer's role** (hiring manager, engineer, designer, executive).
- Focus on: **product and strategy**, **how the team works**, **success in the role**, **challenges**, **culture**.
- Avoid questions easily answered by their website, and leave **salary and benefits** for later stages or the recruiter.

#### Model answer
"I'd always have a few thoughtful questions ready, and tailor them to who I'm speaking with.

**About the role and success:**
- 'What would success look like for this role in the first six months?'
- 'What's the biggest challenge the person in this role will face?'
- 'How are product decisions made here, and how much autonomy does the PO have?'

**About product and strategy:**
- 'What are the most important goals for the product over the next year?'
- 'Where do you see the biggest opportunity, and the biggest risk, for the product?'
- 'How do you balance new features with improving the existing product?'

**About how the team works:**
- 'How does the product team work with engineering and design day to day?'
- 'How often do product people talk to customers?'
- 'How are priorities set, and how do you handle requests from sales or leadership?'

**About culture and growth:**
- 'What do you enjoy most about working here?'
- 'How do you support the growth of product people?'
- 'Can you tell me about a recent product decision that didn't go as planned, and what the team learned?'

**Tailoring by interviewer:**
- **Engineer**: 'How involved are engineers in discovery?' or 'What does a great PO do for your team?'
- **Designer**: 'How early are designers involved in new initiatives?'
- **Executive**: 'How does this product contribute to the company's strategy?'

**Closing question** (optional and confident):
- 'Is there anything about my background that makes you hesitant, which I could clarify?' This gives you a chance to address concerns directly.

**Example.** Asking 'What would success look like in six months?' often reveals the real priorities. In one interview, the answer was 'stabilise delivery and rebuild trust with sales', which told me a lot about the challenges and let me connect my experience directly."

#### Another worked example: questions that show product thinking
"After an interviewer mentioned retention challenges, I asked: 'Which customer segments retain best, and what do you think they get that others don't?' It led to a great discussion and showed I was already thinking about their product."

#### Good versus weak questions
| Weak question | Better question |
|---|---|
| "What does your company do?" | "What are the biggest product goals for the next year?" |
| "What's the salary?" (early stages) | "What would success look like in six months?" |
| "How much holiday do I get?" | "How do you support product people's growth?" |
| "No questions." | 2–3 tailored, thoughtful questions |

#### A third example: questions for a scale-up versus a corporate
"**At a fast-growing scale-up**, I might ask:
- 'What will change about the product team as the company grows over the next year?'
- 'How do you balance speed with quality and technical health?'

**At a large corporate**, I might ask:
- 'How much autonomy do product teams have in deciding what to build?'
- 'How do product teams work with risk, legal and compliance?'

**At an early-stage startup**, I might ask:
- 'How do you decide what to build when there's limited data?'
- 'What's the runway, and what are the key milestones for the next 12 months?'

Tailoring questions to the company stage shows you understand the realities of the role."

#### Make it your own
- Research the company **stage, product and recent news** before the interview.
- Prepare **two questions per interviewer type** (hiring manager, engineer, designer, executive).
- Listen during the interview and **adapt** your questions to what you've heard.
- Note the answers: they help you **decide** whether the role suits you.

#### Step-by-step framework
1. **Prepare 5–8 questions** in advance across categories.
2. **Listen** during the interview and adapt.
3. **Tailor** to the interviewer's role.
4. **Ask 2–3**, and follow up on interesting answers.
5. **Optionally**, ask about any hesitations.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "No, I think you've covered everything." | Asks 2–3 thoughtful questions |
| Questions answered on the website | Questions showing research and product thinking |
| Same questions for everyone | Tailored to each interviewer |
| Focus on perks | Focus on role, product, team and growth |

#### Useful phrases
- "What would success look like for this role in the first six months?"
- "How do product, design and engineering work together day to day?"
- "Where do you see the biggest opportunity for the product?"
- "Is there anything about my background I could clarify?"

#### Common pitfalls
- **Not asking any questions.**
- **Generic questions** answered on the website.
- **Salary-first questions** in early stages.
- **Too many questions** when time is short.

#### Follow-ups to expect (with sample answers)
- **"Why did you ask that?"**
  "Because understanding how decisions are made tells me how I can add the most value."
- **"What's most important to you in your next role?"**
  "Ownership, closeness to customers, and a strong partnership with engineering and design."
- **"Do you have any concerns about the role?"**
  Answer honestly and constructively if you have one, e.g. clarifying scope or team structure.

- **"What's one question you wish candidates asked?"**
  Interviewers often value questions about how success is measured and how the team handles challenges, which show maturity.
- **"How many questions should you ask?"**
  "Usually two or three, depending on time. Quality matters more than quantity."

#### What senior interviewers look for
- **Strategic questions** about the business, organisation and product direction.
- **Evaluating fit** as a peer, not just a candidate.
- **Insight** into challenges they'd face.

#### Practise it
1. Write 8 questions across the four categories above.
2. Choose the 3 best for a hiring manager, an engineer and an executive.
3. Practise asking them naturally, and follow up on answers.
