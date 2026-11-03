# Product Owner — Technical Fluency

## Explain an API to a non-technical person, and why it matters to a Product Owner
- id: po-technical-01
- round: TECHNICAL_FLUENCY
- difficulty: easy
- levels:
- tags: APIs, integrations, technical communication

### Prompt
How would you explain what an API is to someone non-technical? And why does understanding APIs matter for a Product Owner?

### Answer
#### What the interviewer is really testing
- Whether you understand a **core technical concept** well enough to explain it simply.
- Your **communication skills**: can you translate technical ideas for business stakeholders?
- Whether you see the **product implications** of APIs (integrations, partnerships, platform strategy).
- Whether you can have **credible conversations with engineers** about integration work.

#### Key points
- **API** stands for **Application Programming Interface**: a defined way for one piece of software to ask another for data or to perform an action.
- A good analogy: a **waiter in a restaurant**, or an **electrical socket** (a standard interface; you don't need to know how the power station works).
- Key ideas to know: **request and response**, **endpoints**, **authentication** (API keys, OAuth), **rate limits**, **versioning**, **webhooks**, **documentation**.
- Why it matters to a PO: **integrations** with partners, **mobile and web apps** talking to the backend, **third-party services** (payments, maps, email), **platform products** where the API itself is the product, and **dependencies and risks**.

#### Model answer
"I'd explain it with a restaurant analogy.

When you're in a restaurant, you don't walk into the kitchen and cook your own food. You look at the **menu**, tell the **waiter** what you want, the waiter takes your order to the kitchen, and brings back your meal. You don't need to know how the kitchen works. You just need to know what's on the menu and how to order.

An **API** is like that waiter. It's an agreed way for one piece of software to ask another for something:
- The **menu** is the API documentation: what you can ask for and how.
- The **order** is the request: e.g. 'give me the weather for London'.
- The **meal** is the response: e.g. 'London: 14°C, light rain'.

For example, when a travel app shows you the weather at your destination, it probably isn't measuring the weather itself. It asks a weather service's API and displays the answer. When you pay in an online shop, the shop sends your payment details to a payment provider like Stripe through its API, and gets back 'payment approved' or 'declined'.

**Why it matters to a Product Owner:**
1. **Our own apps depend on APIs.** Our mobile app and website usually talk to our backend through APIs. When I write a story for a new screen, the team often needs a new or changed API, and that affects effort and sequencing. For example, the backend API must be ready before the app can use it.
2. **Integrations create value.** Customers often want our product to connect with tools they already use, like Salesforce, Slack or accounting software. Each integration is a product decision: who's it for, how much will it be used, and what does it cost to build and maintain?
3. **Third-party dependencies are risks.** If we rely on an external API for payments or maps, I need to understand costs (often per request), rate limits, reliability, and what happens if it goes down.
4. **APIs can be the product.** For some companies, like Stripe or Twilio, the API *is* what customers buy. Then the 'users' are developers, and documentation, consistency and reliability are the user experience.
5. **Changing APIs affects others.** If we change an API that partners use, we can break their products. That's why APIs are versioned and changes are announced well in advance.

So I don't need to write API code, but I do need to understand what our APIs do, who depends on them, and the trade-offs, so I can make good decisions and talk credibly with engineers and partners."

#### Another worked example: a product decision involving APIs
"Say customers of our invoicing product keep asking for an integration with their accounting software.
- **Questions I'd ask**: how many customers use each accounting tool? Does the accounting tool have a good public API? Does it charge for API access? What data should flow (invoices, payments, customers), and in which direction?
- **With engineering**: what's the effort for the first integration, and can we build it in a way that makes the second and third integrations cheaper?
- **Risks**: the partner may change its API or its rate limits. We need monitoring and a plan for when the connection fails (e.g. retry, and notify the customer).
- **Decision**: build the integration for the most-used accounting tool first, measure adoption and retention impact, then decide on the next."

#### Key API terms
| Term | Plain-English meaning |
|---|---|
| Endpoint | A specific "address" you send requests to, e.g. `/invoices` |
| Request / response | What you ask for, and what you get back |
| Authentication | Proving who you are, e.g. with an API key or OAuth login |
| Rate limit | How many requests you're allowed per minute or hour |
| Versioning | Keeping old versions working when the API changes |
| Webhook | The other system calls *you* when something happens ("payment received") |
| REST / JSON | A common style of API and a common data format |
| SDK | A ready-made toolkit that makes an API easier to use |

#### Step-by-step framework for explaining technical concepts
1. **Start with an everyday analogy.**
2. **Map the analogy** to the real concept.
3. **Give a real product example** the listener will recognise.
4. **Explain why it matters** to them or the business.
5. **Check understanding**, and avoid jargon.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It's an interface for applications to communicate via HTTP requests." (jargon) | A simple analogy and familiar examples |
| Only a definition | Explains why it matters for product decisions |
| Ignores risks | Mentions costs, rate limits, reliability and versioning |
| No real examples | Uses examples like payments, weather and integrations |

#### Useful phrases
- "Think of it like a waiter in a restaurant…"
- "You don't need to know how the kitchen works, just what's on the menu."
- "For us as a product, this matters because…"
- "Before committing to that integration, I'd want to understand the partner's API, its costs and its limits."

#### Common pitfalls
- **Using jargon** when asked to explain simply.
- **Not connecting the concept to product decisions.**
- **Overclaiming technical depth** you don't have (interviewers may probe).
- **Ignoring dependencies and risks** of third-party APIs.

#### Follow-ups to expect (with sample answers)
- **"What's a webhook?"**
  "Instead of us asking repeatedly 'has the payment arrived yet?', the payment provider calls us automatically when it happens, like a delivery company texting you when your parcel arrives."
- **"How would you write a story involving an API change?"**
  "Focus on the user outcome, include the data that needs to be exposed or changed, error cases (what if the API is down?), performance expectations, and whether other teams or partners depend on it."
- **"What would you do if a partner deprecated an API we depend on?"**
  "Assess the impact and deadline with engineering, prioritise the migration based on that deadline, and communicate with any customers affected."

#### What senior interviewers look for
- Understanding **platform and API strategy**: when to open APIs to partners, and the business model around them.
- Awareness of **developer experience** when developers are the users.
- Managing **ecosystem risks**: dependencies, versioning and partner relationships.

#### Practise it
1. Explain an API **out loud in 60 seconds** to a friend who isn't technical, using your own analogy.
2. List three APIs your current (or a familiar) product depends on, and one risk for each.
3. Practise answering "Why should a PO understand APIs?" in under 90 seconds.

## What happens when you type a URL and press Enter?
- id: po-technical-02
- round: TECHNICAL_FLUENCY
- difficulty: medium
- levels:
- tags: web fundamentals, architecture, performance

### Prompt
At a high level, what happens when you type a website address into your browser and press Enter? Why might a Product Owner need to understand this?

### Answer
#### What the interviewer is really testing
- Basic understanding of **how web products work**: browser, server, database, network.
- Whether you can explain a **technical process step by step** at the right level.
- Whether you connect it to **product concerns**: performance, reliability, security and cost.
- Your comfort discussing **architecture** with engineers.

#### Key points
- The main steps: **DNS lookup → connection (with HTTPS encryption) → request → server processing (often with a database) → response → the browser renders the page → more requests for images, scripts and data**.
- Key components: **browser (client)**, **DNS**, **servers**, **databases**, **CDN** (content delivery network), **APIs**.
- Product relevance: **page speed** affects conversion and SEO; **reliability** and **security** affect trust; **caching and CDNs** affect speed and cost; **mobile networks** affect experience.

#### Model answer
"At a high level, it works like this.

**1. Finding the address (DNS).** Computers find each other using numerical IP addresses, not names. So the browser asks the **Domain Name System (DNS)**, essentially the internet's phone book, to translate 'www.example.com' into an IP address. This is often cached, so repeat visits are faster.

**2. Connecting securely.** The browser connects to the server at that address. With **HTTPS**, it also sets up encryption, so nobody in between can read or tamper with the data. That's what the padlock in the address bar means.

**3. Sending the request.** The browser sends a request: 'please send me the homepage', along with information like the browser type, language and any cookies (e.g. showing you're logged in).

**4. The server does its work.** The server (or often a set of servers behind a **load balancer** that spreads traffic) handles the request. It may:
- Check who you are (authentication).
- Fetch data from a **database**, e.g. your account details or product listings.
- Call **other services or APIs**, e.g. recommendations or prices.
- Build the response.

**5. Sending the response.** The server sends back the page, usually HTML plus links to other files: styling (CSS), code (JavaScript) and images. Static files like images are often served from a **CDN**, servers close to the user around the world, which makes them load faster.

**6. Rendering the page.** The browser builds the page and shows it. Modern web apps often load a basic page first, then use JavaScript to request more data from APIs and fill in the content.

**Why this matters to a Product Owner:**
- **Speed affects business results.** Each step adds time. Research from companies like Google and Amazon has repeatedly shown that slower pages reduce conversion and engagement. Knowing where time goes (slow database queries, large images, too many requests) helps me prioritise performance work and understand trade-offs.
- **Reliability.** If a database or a third-party service is slow or down, the whole page may fail. Understanding the chain helps me ask the right questions about fallbacks and monitoring.
- **Security and trust.** HTTPS, authentication and protecting personal data are non-negotiable, especially in finance or health.
- **Cost.** Every request uses servers and bandwidth. Caching and CDNs reduce costs as traffic grows.
- **Mobile users.** On slower mobile networks, every extra request and large file hurts, so I'd push for lightweight pages where users are often on mobile."

#### Another worked example: using this knowledge in a real decision
"Our product page took 6 seconds to load on mobile, and conversion on mobile was much lower than on desktop. Because I understood the request chain, I could ask useful questions:
- How large are the images, and are they served from a CDN in the right size for mobile?
- How many separate requests does the page make?
- Are any slow third-party scripts (chat widgets, analytics) blocking the page?

Engineering found that oversized images and two third-party scripts accounted for most of the delay. We prioritised fixing them, load time dropped to about 2.5 seconds, and mobile conversion improved by 11%."

#### The journey at a glance
| Step | What happens | Product impact |
|---|---|---|
| DNS lookup | Name → IP address | Usually fast; cached |
| Secure connection | HTTPS encryption set up | Security and trust |
| Request | Browser asks for the page | Cookies identify logged-in users |
| Server processing | Logic, database, other services | Biggest source of slowness and failures |
| Response | HTML, CSS, JS, images | Size affects speed, especially on mobile |
| CDN | Static files from nearby servers | Faster loading, lower cost |
| Rendering | Browser displays the page | Perceived speed and experience |

#### Step-by-step framework
1. **Walk through the steps** in order, in plain language.
2. **Name the components** (browser, DNS, server, database, CDN).
3. **Connect each part to a product concern** (speed, reliability, security, cost).
4. **Give a real example** of using this knowledge.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "The website loads." | Clear sequence of steps |
| Deep networking jargon with no purpose | Right level of detail for a product role |
| No product connection | Links each step to speed, reliability, security or cost |
| No example | A real example of improving performance |

#### Useful phrases
- "At a high level, the browser finds the server, asks for the page, and the server builds a response, often using a database."
- "Each step adds time, which is why performance matters for conversion."
- "I'd ask engineering where the time is going: server, network or the page itself?"
- "Understanding this helps me prioritise performance and reliability work."

#### Common pitfalls
- **Going too deep** into networking protocols, losing the interviewer.
- **Going too shallow** ("the internet sends it").
- **Not explaining why it matters** for the product.
- **Pretending to know details** you don't. It's fine to say "at a high level".

#### Follow-ups to expect (with sample answers)
- **"What's a CDN?"**
  "A network of servers around the world that store copies of files like images, so users download them from somewhere nearby, which is faster and reduces load on our main servers."
- **"What's caching?"**
  "Storing a copy of something so it can be returned quickly next time without redoing the work, like keeping frequently used items on your desk instead of fetching them from storage."
- **"How would you prioritise performance work?"**
  "Measure first (page load times, and their link to conversion), find the biggest causes, estimate the business impact of improving them, and compare that with other work."

#### What senior interviewers look for
- Using technical understanding to **ask better questions** and make better trade-offs.
- Setting **performance and reliability targets** (e.g. load time, uptime) as product requirements.
- Understanding how **architecture choices** affect cost and scalability.

#### Practise it
1. Draw the journey from typing a URL to seeing a page on paper, with six boxes.
2. Next to each box, write one way it could make the product slow or unreliable.
3. Explain it **out loud in 3 minutes** to a non-technical friend.

## How do you make decisions on technical topics you don't fully understand?
- id: po-technical-03
- round: TECHNICAL_FLUENCY
- difficulty: medium
- levels:
- tags: technical decisions, engineering partnership, trade-offs

### Prompt
Engineers present you with a technical decision, for example choosing between two architectures, and ask for your input. You don't fully understand the technical details. What do you do?

### Answer
#### What the interviewer is really testing
- **Humility and honesty**: do you admit what you don't know?
- Whether you know **which part of the decision is yours**: the business and user trade-offs, not the technical design.
- Your ability to **ask good questions** that surface trade-offs.
- **Trust and partnership** with engineering.

#### Key points
- Be honest about what you don't know, and **don't fake it**.
- Separate the decision into **technical aspects** (engineers lead) and **product and business aspects** (you lead or contribute).
- Ask about **trade-offs in terms you can evaluate**: time to deliver, cost, risk, user impact, flexibility for future needs.
- Provide **context** engineers may lack: roadmap, scale expectations, deadlines, customer needs.
- **Trust the team's expertise**, and make sure the decision and reasoning are documented.

#### Model answer
"I'd be honest that I don't understand every technical detail, and focus on the part of the decision where I add value: the business and user trade-offs.

**1. Ask the team to explain the options in terms of outcomes.** For example: 'For each option, what does it mean for time to deliver, running cost, reliability, and our ability to build future features?'

Say the team is choosing between:
- **Option A**: extend our existing system. Faster now, about 3 weeks, but it gets harder to change as we grow.
- **Option B**: build a new separate service. Slower now, about 7 weeks, but more scalable and easier to change later.

**2. Ask good questions:**
- 'What would make us regret each option in a year?'
- 'How hard would it be to switch later if we choose A now?'
- 'What's the risk of each? What could go wrong during the build?'
- 'How does each affect users, e.g. speed or reliability?'
- 'What does each cost to run as usage grows?'

**3. Provide context the team may not have:**
- 'We expect usage to grow five times next year because of the new partnership.'
- 'There's a hard deadline for the first client in six weeks.'
- 'The roadmap includes international expansion, which means multiple currencies.'

This context often decides it. For example, if we have a hard deadline in six weeks *and* expect five times growth next year, a reasonable path might be Option A now, with time planned to move to Option B after the deadline.

**4. Let engineers lead the technical decision.** If it's purely technical (e.g. which database library to use), I trust the team. I'm involved when the decision affects **time, cost, risk or users**.

**5. Make sure it's documented.** I'd ask the team to write a short **decision record**: options considered, the choice, and why. It helps future team members understand the reasoning, and it's useful if we revisit the decision.

**6. Keep learning.** Afterwards, I'd ask an engineer to walk me through the parts I didn't understand, so I'm better equipped next time."

#### Another worked example: build versus buy for search
"Engineers asked whether to build search ourselves or use a hosted search service.
- **Technical details** (indexing, ranking algorithms) were beyond me, so I asked about outcomes.
- **Answers**: the hosted service could be live in 2 weeks with good relevance, but costs grow with usage. Building ourselves would take about 3 months, with lower running cost at scale but ongoing maintenance.
- **My context**: search was important for conversion, we needed it before peak season in 6 weeks, and our usage projections meant the hosted service would cost a moderate amount per month for at least a year.
- **Decision**: use the hosted service now, monitor cost against usage, and revisit if costs pass an agreed threshold."

#### Who decides what
| Aspect | Who leads | Your role as PO |
|---|---|---|
| Technical design and tools | Engineers | Ask questions; trust expertise |
| Time to deliver | Shared | Provide deadlines and priorities |
| User impact | PO | Represent users' needs |
| Cost and business risk | PO with stakeholders | Weigh trade-offs |
| Future flexibility | Shared | Share roadmap and growth plans |

#### Step-by-step framework
1. **Admit what you don't know.**
2. **Ask for options in outcome terms** (time, cost, risk, users, flexibility).
3. **Ask probing questions** ("what would we regret?").
4. **Share business context.**
5. **Decide together**, with engineers leading the technical parts.
6. **Document** the decision.
7. **Learn** from it.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Pretends to understand | Honest about knowledge gaps |
| "Engineering decides; not my business." | Contributes business and user trade-offs |
| Overrides engineers on technical matters | Trusts engineers on technical design |
| No context shared | Provides deadlines, growth and roadmap context |
| No record kept | Ensures a decision record is written |

#### Useful phrases
- "I don't fully understand the technical detail. Can you explain what each option means for time, cost and risk?"
- "What would make us regret this decision in a year?"
- "Here's some context that might help: we expect usage to grow five times next year."
- "On the technical design, I trust your judgement. My concern is the user impact and the deadline."
- "Let's write down what we decided and why."

#### Common pitfalls
- **Faking understanding**, which damages trust when exposed.
- **Abdicating completely** ("whatever you think"), even when it affects the product.
- **Overriding engineers** on technical questions.
- **Not sharing important business context.**

#### Follow-ups to expect (with sample answers)
- **"What if engineers disagree among themselves?"**
  "I'd ask each to explain their option in outcome terms, make sure the business context is clear to everyone, and if needed, ask the tech lead or architect to make the final technical call."
- **"How do you build technical understanding?"**
  "Ask engineers to explain things after decisions, read the team's documentation, join architecture discussions, and take short courses on basics like APIs and databases."
- **"What's an architecture decision record?"**
  "A short document capturing a significant technical decision: the context, the options, the decision and the consequences."

#### What senior interviewers look for
- Comfort operating at the **boundary of technical and business** decisions.
- Influencing **platform and architecture** strategy with business context.
- Building a culture of **documented decisions** and mutual trust.

#### Practise it
1. Think of a technical decision you've seen (or imagine: "rebuild the app in a new framework or keep the current one?").
2. Write five questions you'd ask to understand the trade-offs in business terms.
3. Write the business context you'd share.
4. Practise explaining your approach **out loud in 3 minutes**.

## How do you handle non-functional requirements like performance, security and scalability?
- id: po-technical-04
- round: TECHNICAL_FLUENCY
- difficulty: medium
- levels:
- tags: non-functional requirements, performance, security, scalability

### Prompt
How do you make sure non-functional requirements, such as performance, security, reliability and scalability, are handled in your product?

### Answer
#### What the interviewer is really testing
- Whether you understand that **"how well" a product works** is as important as "what" it does.
- Whether you make non-functional requirements **explicit and measurable**.
- Whether you **prioritise** them alongside features.
- Your partnership with **engineering, security and operations**.

#### Key points
- **Functional requirements**: what the product does ("users can reset their password").
- **Non-functional requirements (NFRs)**: how well it does it: **performance, security, reliability (availability), scalability, accessibility, privacy, usability, maintainability**.
- Make NFRs **specific and measurable** (e.g. "95% of pages load in under 2 seconds").
- Capture them in **acceptance criteria**, the **Definition of Done**, and **service level objectives (SLOs)**.
- Prioritise them using **business impact and risk**.

#### Model answer
"I treat non-functional requirements as product requirements, because users experience them directly. A slow, insecure or unreliable product fails, however good its features are.

**1. Make them explicit and measurable.** Vague goals like 'fast' or 'secure' can't be tested. I work with engineering to turn them into targets, for example:
- **Performance**: '95% of product pages load in under 2 seconds on a 4G mobile connection.'
- **Reliability**: 'The checkout is available 99.9% of the time each month' (about 43 minutes of downtime allowed).
- **Scalability**: 'The system handles 5 times our current peak traffic during Black Friday without slowing down.'
- **Security**: 'All personal data is encrypted, and all access is logged.'
- **Accessibility**: 'All new screens meet WCAG 2.2 AA.'

**2. Put them in the right places:**
- **Definition of Done**: standards that apply to every story, e.g. security review for anything handling personal data, accessibility checks, performance budgets.
- **Acceptance criteria**: specific to a story, e.g. 'search results return in under 500 milliseconds for 95% of queries.'
- **Service level objectives (SLOs)**: ongoing targets that operations and engineering monitor, with alerts when they're at risk.

**3. Prioritise them with business impact.** NFR work competes with features, so I frame it in business terms:
- 'Pages that load in 4 seconds instead of 2 lose a meaningful share of mobile conversions.'
- 'Peak season brings five times normal traffic; if checkout fails for an hour, we lose around £X in orders.'
- 'A data breach would mean regulatory fines, loss of trust and reputational damage.'

**4. Work with specialists.** I involve **security** early for features handling sensitive data, **operations / site reliability engineers** for availability targets, and **accessibility specialists** or audits where needed.

**5. Monitor and act.** I keep NFR metrics on the team's dashboard (load times, error rates, uptime) and review them regularly. If we're getting close to missing a target, it goes into the backlog with priority.

**Example.** Before a big seasonal campaign, I worked with the tech lead to run **load tests** at five times normal traffic. They showed the product-search service would slow down badly. We prioritised a caching improvement over two smaller features, and on the day, traffic peaked at four times normal with no slowdown."

#### Another worked example: security and privacy in a new feature
"For a feature letting users upload identity documents:
- **Security**: documents encrypted when stored and transferred, access restricted to specific staff roles, all access logged.
- **Privacy**: documents deleted automatically after verification is complete, in line with data minimisation under GDPR.
- **Reliability**: if the verification provider is down, users can save progress and are notified when it's back.
- **Acceptance criteria and the Definition of Done** included a security review and a privacy impact assessment before release."

#### Common non-functional requirements
| NFR | Example target | Why it matters |
|---|---|---|
| Performance | 95% of pages load < 2s | Conversion, engagement, SEO |
| Reliability | 99.9% monthly uptime | Trust, revenue |
| Scalability | Handle 5× peak traffic | Growth, seasonal peaks |
| Security | Encryption, access control, logging | Data protection, compliance |
| Privacy | Data minimisation, consent | GDPR, trust |
| Accessibility | WCAG 2.2 AA | Inclusion, legal requirements |
| Maintainability | Test coverage, documentation | Speed of future change |

#### Step-by-step framework
1. **Identify** the NFRs that matter most for this product.
2. **Make them measurable** with engineering.
3. **Embed them** in the Definition of Done, acceptance criteria and SLOs.
4. **Prioritise** with business impact.
5. **Involve specialists** early.
6. **Monitor** and act when targets are at risk.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Engineering handles that." | Treats NFRs as product requirements |
| "It should be fast and secure." | Specific, measurable targets |
| Thought about only before launch | Built into the Definition of Done and monitored continuously |
| No business framing | Explains NFRs in terms of revenue, risk and trust |
| No specialists involved | Brings in security, operations and accessibility experts |

#### Useful phrases
- "Users experience performance and reliability directly, so I treat them as product requirements."
- "Let's make this measurable: what load time are we aiming for, and for what share of users?"
- "This goes in our Definition of Done, so it applies to every story."
- "If checkout goes down at peak, we lose around £X an hour, which is why I'm prioritising this."

#### Common pitfalls
- **Ignoring NFRs** until something breaks.
- **Vague, untestable requirements.**
- **Treating them as "engineering's job"** only.
- **Not prioritising them** against features, so they never get done.
- **Involving security too late.**

#### Follow-ups to expect (with sample answers)
- **"What does 99.9% availability mean in practice?"**
  "About 43 minutes of downtime a month. 99.99% is about 4 minutes, which is much more expensive to achieve, so the target should match the business need."
- **"What's a performance budget?"**
  "An agreed limit, like 'the page must stay under 2 seconds and under a certain total file size', that new features must not exceed."
- **"How do you prioritise accessibility?"**
  "It's part of the Definition of Done for new work. For existing gaps, I prioritise by how many users are affected and by legal risk."

#### What senior interviewers look for
- Setting **SLOs** and **error budgets** with engineering and operations.
- **Risk management** for security and privacy at the organisation level.
- Balancing **cost and reliability** (e.g. not over-engineering 99.99% when 99.9% suffices).

#### Practise it
1. For a product you know, write measurable targets for five NFRs.
2. For each, write one sentence explaining its business impact.
3. Practise explaining **out loud in 3 minutes** how you'd make sure they're delivered.

## What is CI/CD, and why does it matter to a Product Owner?
- id: po-technical-05
- round: TECHNICAL_FLUENCY
- difficulty: easy
- levels:
- tags: CI/CD, release process, DevOps, delivery speed

### Prompt
What do continuous integration and continuous delivery (CI/CD) mean, and why should a Product Owner care?

### Answer
#### What the interviewer is really testing
- Basic understanding of **modern software delivery**.
- Whether you see the **product benefits**: faster feedback, smaller and safer releases, quicker fixes.
- Whether you'd **support investment** in delivery capability.
- How delivery practices affect **planning and experimentation**.

#### Key points
- **Continuous integration (CI)**: developers merge code changes frequently (often daily), and automated **builds and tests** run on every change to catch problems early.
- **Continuous delivery (CD)**: code is always in a releasable state, and releasing to production is a **quick, low-risk, mostly automated** step.
- **Continuous deployment**: every change that passes the automated tests goes to production automatically.
- Related practices: **automated testing**, **feature flags**, **staged rollouts**, **monitoring**, **quick rollback**.
- Product benefits: **faster feedback**, **smaller and safer releases**, **faster fixes**, **easier experimentation**.

#### Model answer
"**Continuous integration** means developers merge their code into a shared codebase frequently, often several times a day. Every time they do, an automated system builds the software and runs tests. If something breaks, the team knows within minutes, while the change is still fresh, instead of discovering problems weeks later when everything is combined.

**Continuous delivery** means the software is always in a state where it *could* be released, and releasing is a quick, mostly automated, low-risk step, rather than a big event that takes days of manual work. Some teams go further to **continuous deployment**, where every change that passes all the tests goes live automatically.

**Why it matters to me as a Product Owner:**
1. **Faster feedback from users.** If we can release small changes daily instead of every two months, we learn whether something works much sooner, and can adjust before investing more.
2. **Smaller, safer releases.** A release with one small change is easy to test and easy to fix or roll back. A release with three months of changes is risky, and if something breaks, it's hard to find the cause.
3. **Faster fixes.** When a customer-facing bug appears, we can fix and release it in hours, not wait for the next release window.
4. **Experimentation.** Combined with **feature flags**, we can release features turned off, switch them on for a small group, run A/B tests, and turn them off instantly if there's a problem.
5. **Predictability.** Releases stop being stressful events that slip, so planning becomes more reliable.

**Feature flags** are especially useful for me: they separate **deploying** code (putting it on production servers) from **releasing** a feature (making it visible to users). That means I can decide when a feature goes live, for whom, and coordinate with marketing, without blocking engineering.

So I'd support investment in CI/CD, automated tests and monitoring. It might look like 'engineering work', but it directly speeds up how quickly we can deliver and learn."

#### Another worked example: before and after
"In a previous team, we released every six weeks. Releases took a full day of manual testing, often slipped, and when bugs reached production we had to wait for an emergency release.

We invested about two sprints in automated tests, a CI pipeline and feature flags. Afterwards:
- We released several times a week.
- Release day stopped being an event.
- A pricing bug discovered on a Monday morning was fixed and live by lunchtime.
- We started running A/B tests on onboarding, which led to a 14% improvement in activation over a quarter.

As PO, I measured the impact using the **DORA metrics**: deployment frequency, lead time for changes, change failure rate and time to restore service."

#### Key terms
| Term | Meaning | Product benefit |
|---|---|---|
| Continuous integration | Frequent merges with automated tests | Problems caught early |
| Continuous delivery | Always releasable; easy releases | Release when the business wants |
| Continuous deployment | Every passing change goes live | Fastest feedback |
| Feature flags | Turn features on/off without releasing code | Control rollout; quick switch-off |
| Staged rollout | Release to 1% → 10% → 100% | Limit the impact of problems |
| Rollback | Return to the previous version | Fast recovery |
| DORA metrics | Four delivery performance measures | Track delivery health |

#### Step-by-step framework
1. **Define CI** in simple terms.
2. **Define CD** (and continuous deployment).
3. **Explain the product benefits.**
4. **Mention feature flags** and staged rollouts.
5. **Show you'd support investment**, with an example.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It's a DevOps thing engineers do." | Explains it simply and links it to product benefits |
| Confuses CI and CD | Clearly distinguishes them |
| No mention of feature flags | Explains how flags separate deploy from release |
| No example | Shows a before-and-after with impact |

#### Useful phrases
- "CI catches problems within minutes instead of weeks."
- "Small, frequent releases are safer than big, rare ones."
- "Feature flags separate deploying code from releasing a feature."
- "Investing in delivery capability speeds up everything we do afterwards."

#### Common pitfalls
- **Treating it as purely engineering's concern.**
- **Confusing CI with CD.**
- **Not seeing the link** to experimentation and learning.
- **Refusing time for automated testing** and pipeline work.

#### Follow-ups to expect (with sample answers)
- **"What's the difference between deploying and releasing?"**
  "Deploying puts code onto production servers. Releasing makes the feature visible to users. Feature flags let us deploy without releasing."
- **"What are the risks of feature flags?"**
  "Too many old flags make the code complex and confusing. We should remove flags once a feature is fully released."
- **"How would you convince stakeholders to invest in CI/CD?"**
  "Show the cost of the current process (time spent on manual releases, bugs reaching customers, slow fixes), and the expected benefits in faster delivery and fewer incidents."

#### What senior interviewers look for
- Using **DORA metrics** to track and improve delivery performance.
- Championing **engineering excellence** as a business enabler.
- Using **progressive delivery** (flags, staged rollouts, experiments) as part of the product strategy.

#### Practise it
1. Explain CI/CD **out loud in 90 seconds**, using a simple analogy (e.g. checking each brick as you build a wall versus inspecting the whole wall at the end).
2. Describe how feature flags would help you launch a feature that needs to coincide with a marketing campaign.
3. List the four DORA metrics and what each tells you.

## Monolith versus microservices from a product perspective
- id: po-technical-06
- round: TECHNICAL_FLUENCY
- difficulty: hard
- levels: senior
- tags: architecture, microservices, scalability, team structure

### Prompt
Your engineering team wants to break the monolith into microservices. As a Product Owner, how do you think about this, and what questions would you ask?

### Answer
#### What the interviewer is really testing
- Whether you understand **architecture trade-offs** at a high level.
- Whether you can **evaluate a large technical investment** in business terms.
- Your awareness of how architecture affects **team structure, delivery speed and risk**.
- Your ability to **sequence** big technical work alongside product delivery.

#### Key points
- **Monolith**: the whole application is built and deployed as one unit. Simpler to start and run, but can become slow to change as it grows and as more teams work on it.
- **Microservices**: the application is split into small, independently deployable services, each owning one area (e.g. payments, search, user accounts).
- **Benefits of microservices**: teams can work and release independently, parts scale separately, and failures can be isolated.
- **Costs**: much more operational complexity (networking, monitoring, data consistency), the need for strong engineering practices, and a large migration effort.
- Microservices aren't automatically better. The right choice depends on **team size, product complexity and scale**.
- Prefer **incremental migration** (e.g. the **strangler fig pattern**) over a big-bang rewrite.

#### Model answer
"I'd approach this as a significant investment decision. It could be the right move, but I'd want to understand the problem it solves and how we'd do it without stopping product delivery.

**1. Understand the problem.** I'd ask the team: what pain are we trying to fix? Common reasons:
- **Slow delivery**: 'Six teams work in one codebase, releases need coordination, and a change in one area breaks another.'
- **Scaling**: 'Search needs ten times more capacity than the rest at peak, but we have to scale everything together.'
- **Reliability**: 'A bug in reporting can bring down checkout.'

If the pain is real and measurable, that's a strong signal. If the main reason is 'microservices are modern', I'd push back. A well-structured monolith (sometimes called a modular monolith) is often the better choice for smaller teams.

**2. Ask about trade-offs:**
- 'What new complexity does this add (monitoring, testing across services, data consistency), and do we have the skills and tools for it?'
- 'How long will the migration take, and how much of our capacity will it use?'
- 'What's the risk of breaking things during the migration?'
- 'How will we measure whether it worked?'

**3. Push for incremental migration.** Rather than a big-bang rewrite, I'd support the **strangler fig pattern**: gradually move one area at a time into a new service, routing traffic to it, until the old part can be removed. Each step delivers value and reduces risk.

**4. Prioritise which part to move first.** I'd look for an area where:
- The pain is greatest (e.g. search, which needs independent scaling, or payments, which needs high reliability and frequent releases).
- The boundary is clear.
- The product roadmap has upcoming work, so we can combine migration with feature delivery.

**5. Agree how to balance it with product work.** For example, one team spends 50% of its time on migration for two quarters, while other teams continue feature work. I'd communicate the plan and the expected benefits to stakeholders, so they understand why some features are slower in the meantime.

**6. Measure success.** Agree measures upfront, e.g. deployment frequency for the migrated area, lead time for changes, incidents, and infrastructure cost. Then review after each step.

**My role** isn't to decide the architecture. It's to make sure the investment solves a real business problem, is sequenced sensibly with the roadmap, and is explained clearly to stakeholders."

#### Another worked example: when not to do it
"A startup with one team of six engineers wanted to move to microservices because 'that's how big companies do it'. When we discussed it:
- Releases were already daily, and the team rarely blocked each other.
- Scale wasn't an issue yet.
- The migration would have taken about four months, with no new features.

We agreed to instead **modularise the monolith** (clear internal boundaries) and revisit once the team grew past three teams or a specific scaling need appeared. Product delivery continued, and the codebase stayed manageable."

#### Monolith versus microservices
| | Monolith | Microservices |
|---|---|---|
| Simplicity | Simpler to build, test and run | More complex: many moving parts |
| Team independence | Teams share one codebase and release | Teams own and release services independently |
| Scaling | Scale everything together | Scale parts separately |
| Failure isolation | One bug can affect everything | Failures can be contained |
| Best for | Small teams, early products | Larger organisations, complex domains, high scale |
| Risk | Slows down as it grows | Operational complexity; costly migration |

#### Step-by-step framework
1. **Understand the problem** being solved, with evidence.
2. **Assess trade-offs**: complexity, skills, cost, time.
3. **Prefer incremental migration** (strangler fig).
4. **Choose where to start**: biggest pain, clearest boundary, roadmap overlap.
5. **Balance with product work** and communicate the plan.
6. **Measure success** after each step.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Microservices are better, let's do it." | Asks what problem it solves |
| "That's engineering's decision." | Evaluates it as a business investment |
| Supports a big-bang rewrite | Pushes for incremental migration |
| Ignores the roadmap | Sequences migration alongside product work |
| No success measures | Agrees measures upfront |

#### Useful phrases
- "What problem are we solving, and how will we know it worked?"
- "Microservices bring their own complexity. Do we have the tools and skills for it?"
- "Could we migrate one area at a time, rather than rewriting everything?"
- "Let's start with the area where the pain is greatest and the boundary is clearest."
- "I'll explain to stakeholders why some features will be slower while we do this."

#### Common pitfalls
- **Assuming microservices are always better.**
- **Supporting a big-bang rewrite**, which often takes much longer than planned.
- **Not linking the work to business outcomes.**
- **Stopping all product work** during migration.
- **No measures of success.**

#### Follow-ups to expect (with sample answers)
- **"What's the strangler fig pattern?"**
  "Gradually replacing parts of an old system by building new services around it and redirecting traffic piece by piece, until the old part can be removed. It's named after a plant that slowly grows around a tree."
- **"How does architecture relate to team structure?"**
  "Conway's law says systems tend to mirror the communication structure of the organisation. Microservices work best when each team owns clear services end to end."
- **"How would you explain the migration to stakeholders?"**
  "In business terms: today, releases need coordination across six teams and a bug in one area can take down checkout. After migration, teams can release independently, and checkout is protected. Here's the plan, the cost, and what we expect to gain."

#### What senior interviewers look for
- Understanding the link between **architecture, team structure and delivery speed**.
- Making **large technical investment decisions** with business rigour.
- Leading **long-term platform roadmaps** alongside product roadmaps.

#### Practise it
1. Explain the difference between a monolith and microservices **in 60 seconds**, using an analogy (e.g. one big restaurant kitchen versus a food hall of separate stalls).
2. List five questions you'd ask before agreeing to a migration.
3. Write how you'd explain a two-quarter migration plan to a sceptical executive.

## How do data privacy and GDPR affect your product decisions?
- id: po-technical-07
- round: TECHNICAL_FLUENCY
- difficulty: medium
- levels:
- tags: privacy, GDPR, compliance, data protection

### Prompt
How do data privacy and regulations like GDPR affect the way you build products? Give examples of decisions you'd make differently because of them.

### Answer
#### What the interviewer is really testing
- Awareness of **data protection principles** and regulations.
- Whether you build privacy in **from the start** (privacy by design).
- How you balance **business goals** (personalisation, analytics) with **users' rights**.
- Whether you know **when to involve** legal and data protection experts.

#### Key points
- **GDPR** (General Data Protection Regulation) applies to personal data of people in the EU, and the UK has its own version (UK GDPR).
- Key principles: **lawfulness, fairness and transparency**; **purpose limitation**; **data minimisation**; **accuracy**; **storage limitation**; **security**; **accountability**.
- A **lawful basis** is needed to process personal data, e.g. **consent**, **contract**, **legal obligation** or **legitimate interests**.
- Users have **rights**: access, correction, deletion ("right to be forgotten"), portability, objection.
- **Privacy by design**, and **data protection impact assessments (DPIAs)** for high-risk processing.
- Work closely with the **Data Protection Officer (DPO)** and legal team. You're not expected to be a lawyer.

#### Model answer
"Privacy affects product decisions from the very beginning, not just at the end. I'm not a lawyer, so I work closely with our legal team and Data Protection Officer, but I build privacy into how we design features.

**Principles I apply:**
1. **Collect only what we need (data minimisation).** Before adding a field to a form, I ask: what will we use this for? If we can't answer, we don't collect it. For example, we removed date of birth from a sign-up form when we realised we only needed to confirm users were over 18. A simple checkbox, plus verification at a later step for regulated products, was enough.
2. **Be clear about purpose.** If we collect an email address for receipts, we can't automatically use it for marketing. Marketing needs separate consent.
3. **Have a lawful basis.** For example, processing an order uses 'contract'; optional marketing uses 'consent'; fraud prevention may use 'legitimate interests'. Legal helps confirm the right basis.
4. **Make consent real.** Consent must be freely given, specific and easy to withdraw. No pre-ticked boxes, and declining should be as easy as accepting, for example on cookie banners.
5. **Don't keep data forever (storage limitation).** We define how long we keep data and delete it automatically, e.g. deleting uploaded identity documents once verification is complete.
6. **Respect user rights.** Users can request their data, correct it or have it deleted. I make sure we have processes (and ideally self-service features) for this.
7. **Security.** Encryption, access controls and logging for personal data.

**How it changes decisions:**
- **Analytics**: we avoid sending personal data (like emails) to analytics tools, use pseudonymous identifiers, and respect cookie consent choices, which affects how complete our data is.
- **Personalisation**: we're transparent about why users see recommendations, and offer controls.
- **New vendors**: before using a third-party service that processes personal data, we check where data is stored, sign a data processing agreement, and assess risk.
- **High-risk features** (e.g. processing health data, large-scale profiling): we run a **data protection impact assessment** before building.

**Example.** For a feature using customers' transaction data to give spending insights, we involved the DPO at the discovery stage. As a result, we processed the data within our own systems rather than sending it to a third-party AI service, made the feature opt-in with a clear explanation, and let users delete their insights history. It added about a week of work, but avoided legal risk and actually increased trust: 68% of users who saw the explanation opted in."

#### Another worked example: an analytics trade-off
"Marketing wanted to track every user's full journey across our site and partner sites to improve ad targeting.
- **Concern**: this would require consent for tracking cookies, and many users decline. Cross-site tracking also raises significant privacy concerns.
- **Options**: (1) ask for consent and accept lower coverage; (2) use aggregated, privacy-friendly measurement; (3) rely on first-party data from logged-in users who have agreed.
- **Decision** (with legal and marketing): a combination of consented tracking and aggregated measurement. We lost some precision, but stayed compliant and kept customer trust."

#### GDPR principles in practice
| Principle | Product question to ask |
|---|---|
| Lawfulness and transparency | Do users understand what we do with their data, and do we have a lawful basis? |
| Purpose limitation | Are we using data only for the purpose we collected it for? |
| Data minimisation | Do we really need this field? |
| Accuracy | Can users correct their data? |
| Storage limitation | When will we delete it? |
| Security | Is it encrypted and access-controlled? |
| Accountability | Have we documented our decisions (e.g. a DPIA)? |

#### Step-by-step framework
1. **Identify personal data** the feature uses.
2. **Confirm the purpose and lawful basis** (with legal).
3. **Minimise**: collect only what's needed.
4. **Design consent and transparency** into the experience.
5. **Define retention and deletion.**
6. **Ensure security and vendor checks.**
7. **Run a DPIA** for high-risk processing.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Legal handles compliance." | Builds privacy into product design from the start |
| Collects data "just in case" | Applies data minimisation |
| Pre-ticked consent boxes | Real, specific, easy-to-withdraw consent |
| Keeps data forever | Defines retention and automatic deletion |
| Generic answer | Specific examples of decisions that changed |

#### Useful phrases
- "Before adding this field, what will we use it for?"
- "I'd involve the DPO at the discovery stage, not just before launch."
- "Consent needs to be as easy to decline as to accept."
- "We'll delete this data automatically once it's no longer needed."
- "Building privacy in actually increased trust and opt-in rates."

#### Common pitfalls
- **Treating privacy as a final checkbox** before launch.
- **Collecting data without a clear purpose.**
- **Dark patterns** in consent (making "accept" big and "decline" hidden).
- **Sending personal data to third-party tools** without checks.
- **Claiming legal expertise** you don't have.

#### Follow-ups to expect (with sample answers)
- **"What is a DPIA?"**
  "A data protection impact assessment: a structured review of the privacy risks of a new processing activity, required by GDPR when processing is likely to be high risk, such as large-scale use of sensitive data."
- **"What's the difference between anonymised and pseudonymised data?"**
  "Anonymised data can't be linked back to a person, so it's no longer personal data. Pseudonymised data replaces identifiers (e.g. with an ID) but can still be linked back with extra information, so it's still personal data."
- **"How would you handle a 'delete my data' request?"**
  "Have a defined process to find and delete the person's data across systems (including backups where feasible) within the legal time limit, with exceptions where we must keep data by law, such as financial records."

#### What senior interviewers look for
- **Privacy as a product strategy** and a trust advantage.
- Working with **legal, security and data teams** to set organisation-wide standards.
- Handling **trade-offs** between data-driven goals and privacy confidently.

#### Practise it
1. Take a sign-up form from a product you use and list every field. For each, write its purpose and whether it's really needed.
2. Write a privacy checklist (6–8 questions) you'd use for any new feature.
3. Explain **out loud in 3 minutes** how privacy would shape a personalisation feature.

## How would you approach building a product feature that uses AI?
- id: po-technical-08
- round: TECHNICAL_FLUENCY
- difficulty: hard
- levels:
- tags: AI, machine learning, LLMs, product risk

### Prompt
Your company wants to add an AI-powered feature, for example an assistant that answers customer questions. How would you approach it as a Product Owner?

### Answer
#### What the interviewer is really testing
- Whether you start from a **real user problem**, not "we need AI".
- Understanding of how AI products **differ** from traditional software: probabilistic outputs, errors, data needs, evaluation.
- Awareness of **risks**: accuracy, hallucinations, bias, privacy, cost, safety.
- How you **measure quality** and **iterate** on an AI feature.

#### Key points
- **Start with the problem**: what user need does AI solve better than other approaches?
- AI outputs are **probabilistic**: they can be wrong, inconsistent or made up ("hallucinations"). Design for errors.
- **Evaluation** is central: define what "good" looks like and test against real examples before and after launch.
- **Human in the loop** where mistakes are costly.
- **Data, privacy and security** considerations.
- **Cost and latency**: AI calls can be slow and expensive at scale.
- **Start narrow**, measure and expand.

#### Model answer
"I'd approach it like any product, starting from the problem, but with extra attention to quality, risk and evaluation, because AI behaves differently from traditional software.

**1. Start with the problem and the goal.** Why do we want an AI assistant? Say our support team receives 20,000 questions a month, 60% of which are about the same 30 topics (delivery times, returns, account access), and customers wait an average of 6 hours for a reply. The goal: **answer common questions instantly and accurately, and free agents for complex cases**.

I'd also ask whether AI is the best solution. Better help articles or improved order-status pages might solve part of the problem more cheaply.

**2. Define a narrow first scope.** Instead of 'answer anything', start with the top 10 topics, using our own help content and the customer's order information. Out of scope: refunds above a threshold, complaints, legal or sensitive topics. These go to a human.

**3. Define what 'good' looks like (evaluation).** Before launch, I'd work with the team to build a **test set**: a few hundred real customer questions with correct answers. We measure:
- **Accuracy**: is the answer correct and based on our policies?
- **Groundedness**: is it supported by our content, or did the AI make something up?
- **Helpfulness and tone.**
- **Safety**: does it refuse appropriately and hand over sensitive topics?

We'd set a quality bar, e.g. at least 90% accurate on the test set with zero harmful answers, before showing it to customers.

**4. Design for errors and trust:**
- Show sources ('Based on our Returns policy') so customers can check.
- Make it **easy to reach a human** at any point.
- Let users rate answers (thumbs up or down) for continuous feedback.
- Be transparent that they're talking to an AI.

**5. Address risks:**
- **Hallucinations**: base answers on our own approved content (often called retrieval-augmented generation), and tell the model to say 'I don't know' rather than guess.
- **Privacy**: only use the minimum customer data needed, check where the AI provider processes data, and don't use customer data to train external models without proper agreements.
- **Security**: protect against users trying to manipulate the assistant into revealing information or taking unintended actions.
- **Bias and fairness**: check answers are consistent across different customer groups.
- **Cost and speed**: estimate cost per conversation and response time, and set budgets and limits.

**6. Launch gradually and measure.** Start with a small percentage of customers, or just in one channel. Metrics:
- **Resolution rate**: questions resolved without a human.
- **Customer satisfaction** with AI answers versus human answers.
- **Escalation rate**, and why people escalate.
- **Accuracy** from ongoing reviews of samples of conversations.
- **Guardrails**: complaints, incorrect refunds, and repeat contacts (customers coming back because the answer didn't help).

**7. Iterate.** Review failed conversations weekly, improve content and instructions, expand topics as quality is proven, and keep re-running the test set after every change, because a fix in one place can break another."

#### Another worked example: AI for internal users
"For an AI feature that drafts summaries of customer calls for sales reps:
- **Problem**: reps spend 20 minutes per call writing notes.
- **Human in the loop**: reps review and edit summaries before saving, so errors are caught.
- **Evaluation**: compare AI summaries with rep-written notes on a sample, scoring completeness and accuracy.
- **Metrics**: time saved per call, the share of summaries saved with minor edits, rep satisfaction.
- **Risk**: call recordings contain personal data, so consent, data retention and provider agreements are essential."

#### How AI features differ from traditional features
| Traditional software | AI features |
|---|---|
| Same input → same output | Outputs can vary and can be wrong |
| Tested with fixed test cases | Evaluated with test sets and quality scores |
| Errors are bugs | Some error rate is expected; design for it |
| Cost mostly fixed | Cost can grow with every request |
| Behaviour changes only when code changes | Behaviour can change with models, data or prompts |

#### Step-by-step framework
1. **Problem first**: is AI the right solution?
2. **Narrow scope** with clear boundaries.
3. **Define quality** with a test set and a bar for launch.
4. **Design for errors**: sources, human handover, feedback.
5. **Manage risks**: hallucination, privacy, security, bias, cost.
6. **Launch gradually** with clear metrics and guardrails.
7. **Iterate** using real conversations and repeated evaluation.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "We'd add ChatGPT to the app." | Starts from a specific user problem and goal |
| Assumes AI is always right | Designs for errors and human handover |
| No quality measurement | Builds a test set with a quality bar |
| Ignores privacy and cost | Addresses privacy, security, bias and cost |
| Launches to everyone | Launches narrowly and expands as quality is proven |

#### Useful phrases
- "What problem are we solving, and is AI the best way to solve it?"
- "We'd start with a narrow scope and expand as we prove quality."
- "Before launch, we'd evaluate it against a test set of real questions."
- "The assistant should say 'I don't know' rather than guess."
- "Customers should always be able to reach a human easily."

#### Common pitfalls
- **"AI for AI's sake"** without a clear problem.
- **No evaluation**, so quality is judged by a few demos.
- **Ignoring hallucinations** and failure modes.
- **Overlooking privacy** when sending data to AI providers.
- **Underestimating cost** at scale.
- **Too broad a scope** at launch.

#### Follow-ups to expect (with sample answers)
- **"What's a hallucination?"**
  "When an AI model produces information that sounds confident but is incorrect or made up. We reduce it by grounding answers in our own content and testing carefully."
- **"How would you decide whether quality is good enough to launch?"**
  "Agree a bar in advance on a representative test set (e.g. 90%+ accurate, no harmful answers), compare it with the current experience (e.g. 6-hour waits), and start with a small rollout to confirm real-world quality."
- **"Build our own model or use an existing one?"**
  "Usually start with an existing model through an API, because it's faster and cheaper to validate the idea. Consider custom approaches only if there's a clear need, such as cost at scale, specialised quality or data control."

#### What senior interviewers look for
- An **AI product strategy** tied to business goals, not hype.
- Building **evaluation and governance** processes across the organisation.
- **Responsible AI**: fairness, transparency and safety as product requirements.
- Understanding of **cost, latency and vendor** trade-offs.

#### Practise it
1. Pick a product you know and identify one problem AI could genuinely solve, and one where it would be a bad fit.
2. For the good fit, write: narrow scope, 3 quality measures, 3 risks with mitigations, and 3 launch metrics.
3. Explain your approach **out loud in 5 minutes**.
