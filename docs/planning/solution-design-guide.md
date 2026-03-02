# Ditto - IBM SkillsBuild Solution Design Guide

## Slide 1: Cover
- **Team Name**: [Your team name]
- **Team Leader**: [Your name]

## Slide 3: Team Members
- [Fill in your team members, roles, emails]

---

# Empathy Map: The Active Job Seeker

**User**: Any active job seeker managing multiple applications

### SAYS
1. "I can't remember what I told them in the last round"
2. "I applied to like 50 places and I'm losing track"
3. "I have so many versions of my resume and cover letter, I don't know which one I sent to which company"
4. "The job posting got taken down and now I can't even review what the role was about"
5. "I need to prep for my interview tomorrow but I don't even know where to start"
6. "I got rejected again but I have no idea why"
7. "I keep getting asked the same behavioral questions but my answers never feel polished"
8. "I Google the same company interview questions every time instead of building on what I already learned"

### DOES
1. Maintains a messy Google Sheet / Excel with dozens of rows tracking applications
2. Writes interview notes in random Google Docs, Notion pages, or on paper
3. Opens 5+ tabs before each interview (LinkedIn, Glassdoor, company site, notes, calendar)
4. Scrambles before Round 2 to piece together what happened in Round 1
5. Copy-pastes job descriptions into personal notes before the posting disappears
6. Saves multiple resume/cover letter files with names like `resume_v3_final_FINAL.pdf`
7. Searches old emails and calendar invites to reconstruct interview history
8. Does generic Google searches like "Amazon behavioral interview questions" instead of preparing based on their own past data

### THINKS
1. "There has to be a better way to organize all this"
2. "Am I making the same mistakes in every interview?"
3. "If I could just see what worked before, I'd feel more confident"
4. "If I can learn how other people organize their applications"
5. "I'm putting in so much effort but I have nothing to show for it"
6. "What if I'm not preparing for the right things?"
7. "I wish I had a coach or someone to review my approach"
8. "If I could have a more tailored resume for each job, I'd probably get more callbacks"

### FEELS
1. **Overwhelmed** — juggling 10+ applications at different stages with no clear system
2. **Anxious** — before interviews because preparation feels incomplete and scattered
3. **Frustrated** — when they can't find their notes or remember what happened last round
4. **Regretful** — after interviews when they realize they forgot to mention something important
5. **Discouraged** — after rejections with no understanding of what went wrong or how to improve
6. **Lonely** — the job search feels like a solo grind with no guidance or feedback
7. **Inadequate** — seeing others land offers while they're still stuck in the cycle
8. **Exhausted** — the mental load of tracking everything manually on top of their daily life

### Key Clusters / Patterns
- **Context loss**: (Says 1, 4) + (Does 4, 7) + (Thinks 2, 3) + (Feels 3) — users constantly lose and reconstruct information
- **Tool sprawl**: (Says 2, 3) + (Does 1, 2, 3, 6) + (Thinks 1) + (Feels 1, 8) — too many disconnected tools creating cognitive overload
- **No feedback loop**: (Says 6, 7, 8) + (Does 8) + (Thinks 2, 5, 6) + (Feels 5, 7) — no way to learn and improve across interviews
- **Desire for guidance**: (Says 5, 7) + (Thinks 4, 7, 8) + (Feels 2, 6) — wanting personalized help but not having it

---

# As-Is Scenario Map

### Phases
| Trigger | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---------|---------|---------|---------|---------|---------|
| "I need a job" | Prepare & Discover | Tailor & Apply | Wait & Track | Assess & Interview | Outcome & Reflect |

### Doing

**Trigger:** Decides to start job searching. New grads: no framework, start from zero.

**Prepare & Discover:**
- Reflects on best experiences
- Writes bullet points, seeks templates
- Asks friends for resume examples
- Gets feedback, iterates on drafts
- Browses LinkedIn, Indeed, Glassdoor
- Reads job descriptions to understand market

**Tailor & Apply:**
- Adjusts resume keywords per job
- Reorders bullet points for relevance
- Writes/tweaks cover letter
- Submits through portals
- Saves a copy... somewhere

**Wait & Track:**
- Checks email constantly
- Tries to remember which companies applied to
- Updates spreadsheet (if they have one)
- Continues applying while waiting
- Follows up with recruiters

**Assess & Interview:**
- Googles "[company] interview questions"
- Crams night before
- Re-reads job description again and again
- Tries to recall previous rounds from memory
- Texts friends to express feeling after it

**Outcome & Reflect:**
- Receives offer or rejection
- Reviews recording if they have one (assumption to validate)
- If rejected: moves on, rarely gets feedback
- Mentally bookmarks good answers
- Goes back to Phase 1 and repeats

### Thinking

**Trigger:** "Where do I even start?"

**Prepare & Discover:**
- "How do I make this stand out?"
- "What do companies want right now?"
- "Am I qualified for this?"

**Tailor & Apply:**
- "Is this tailored enough?"
- "Which version did I send to other company?"
- "Should I write a cover letter, or tailor one?"

**Wait & Track:**
- "Did they even see my application?"
- "How many applications have I sent, and how many will I need to send?"
- "Should I follow up or is that annoying?"

**Assess & Interview:**
- "Did I already tell them this story last round?"
- "I should have written down what happened"
- "Is this assessment worth my time?"
- "That answer went well — need to remember it"

**Outcome & Reflect:**
- "Why did I get rejected? They never tell you"
- "I need to do better but I don't know what to change"
- "I nailed that question — I should reuse that answer"

### Feeling

**Trigger:** Hopeful but uncertain

**Prepare & Discover:** Self-doubting, overwhelmed by competition, excited when finding good match

**Tailor & Apply:** Tedious, uncertain if tailoring is enough, rushed

**Wait & Track:** Impatient, anxious, disorganized, discouraged

**Assess & Interview:** Nervous, underprepared, proud when nailing an answer, regretful after

**Outcome & Reflect:** Relieved (offer) / Defeated (rejection), exhausted, no closure

### Friction Markers
1. **Wait & Track × Feeling** — Pain: everything falls apart at scale → Ditto's unified tracking
2. **Assess & Interview × Thinking** — Pain: context loss between rounds → Ditto's multi-round context sidebar
3. **Outcome & Reflect × Thinking** — Pain: no feedback loop → Ditto's AI learning/coaching
- **Bright spot**: Prepare & Discover × Feeling — "Excited when finding good match"
- **Assumption to validate**: Outcome & Reflect × Doing — "Reviews recording if they have one"

---

# PART 1: Opportunity Framing (Week 1-2)

---

## Slide 5: Industry Problem Context

### Industry Challenge Statement
Job seekers applying to dozens of positions simultaneously have no unified system to manage the full interview lifecycle. Critical information — questions asked, answers given, preparation notes, resumes submitted — is scattered across spreadsheets, docs, and memory. This fragmentation leaves candidates underprepared for each round, unable to learn from past interviews, and repeating the same mistakes across applications. New graduates face an even steeper challenge: they enter the job market with no framework, no templates, and no guidance on how to structure their search.

### Why This Problem Matters
- **Economic consequences**: The average job search takes 3-6 months. Each month without an offer costs thousands in lost income. Poor preparation from fragmented workflows directly extends search duration. For new grads, a slow start compounds over years in lower starting salaries and missed opportunities.
- **Scale of impact**: ~6.5 million people are actively job searching in the US at any given time. ~4 million students graduate from US universities each year, most entering the job market for the first time with no structured process. Globally, youth unemployment (ages 15-24) sits at ~13%.
- **Strategic relevance**: Recruitment tech ($3B+ market) is almost entirely employer-focused (ATS, sourcing, screening). Job seeker tools stop at discovery (LinkedIn, Indeed) or basic tracking (Huntr, Teal). No tool combines lifecycle management + onboarding guidance + AI coaching.
- **Who's under pressure**: Job seekers in competitive markets, new grads with no playbook, university career centers supporting thousands with no scalable tooling, workforce development programs helping people enter/re-enter the workforce.

---

## Slide 6: Who Is Experiencing the Problem?

### Primary User
Active job seekers managing multiple applications simultaneously. They apply to 10-50+ positions, go through multi-round interview processes (phone screens, technical rounds, behavioral, panel, onsite), and struggle to keep track of what happened where. They directly experience the pain of lost context, scattered notes, and no feedback loop to improve.

### User Environment
- **Digital**: LinkedIn, Indeed, Glassdoor for discovery; Google Sheets/Excel for tracking; Google Docs/Notion for notes; Gmail/Outlook for recruiter communication; Calendar apps for scheduling
- **Physical**: Home office, coffee shops, commuting (prep on mobile)
- **Tools/processes**: 4-6 disconnected tools stitched together manually. No single tool connects application data to interview notes to preparation materials.

### Secondary Stakeholders
- **New graduates / first-time job seekers** — need the same organization but also lack templates and guides to structure their search
- **University career centers** — advise hundreds of students but have no scalable way to track outcomes or provide structured tooling
- **Career coaches / mentors** — help candidates prepare but lack visibility into the full picture of their interview history
- **Recruiters / hiring managers** — indirectly benefit when candidates are well-prepared and responsive

---

## Slide 7: Core User Tension

### User Goal
Job seekers want to stay organized, well-prepared, and continuously improving throughout their entire job search — without it becoming a second full-time job.

### Current User Experience (As-Is Snapshot)

| Trigger | Stage 1 | Stage 2 | Stage 3 | Stage 4 | Stage 5 |
|---------|---------|---------|---------|---------|---------|
| "I need a job" | Prepare & Discover: build resume, browse job boards | Tailor & Apply: adjust resume per role, submit | Wait & Track: manage multiple apps, check for responses | Assess & Interview: assessments, multi-round interviews across companies | Outcome & Reflect: offer/rejection, cycle repeats |

### Key Pains / Frustrations
1. **Context loss between rounds**: Can't recall what they said, which resume they sent, or what the job posting required. Previous round context doesn't carry into next round preparation.
2. **Everything falls apart at scale**: Managing 10+ applications across spreadsheets, docs, email, and memory. Disorganization grows as volume increases.
3. **No feedback loop**: Rejections come with no explanation. No structured way to see patterns or improve. They go back to Phase 1 and repeat the same mistakes.

### Where Friction Occurs
- Between Tailor & Apply and Wait & Track (resume version chaos, losing track of what was sent where)
- Between Assess & Interview rounds (previous round context doesn't flow into next round prep — the critical gap)
- Between Outcome and restarting the cycle (no learning transfers to the next attempt)

---

## Slide 8: Why Current Solutions Fail

### Key Insight — Why the Problem Exists
Existing tools treat job searching as a **status tracking problem** when it's actually a **knowledge management problem**. Each interview generates valuable insights — questions asked, answers given, feedback received — but no tool captures and connects this information across rounds and applications.

What makes it hard to solve:
- The data is unstructured — interview notes, prep materials, recordings, and feedback live in different formats across different tools
- The knowledge is personal — what works for one candidate in one interview context doesn't generalize easily
- The connections matter — a Round 2 answer only makes sense in the context of what was said in Round 1, which resume was sent, and what the job required

Why "more automation" or "better UI" won't solve it:
- Auto-fill tools (Simplify) speed up applying but don't help you prepare or learn
- Better Kanban boards (Huntr/Teal) organize the pipeline but don't capture what happens inside each interview
- You need a different data model — one that links applications, interviews, questions, answers, and prep materials into a connected system that learns over time

### Existing Tools / Processes Used Today

| Tool | What they do well | Where they break down |
|------|-------------------|---------------------|
| **Simplify / Jobright** | Auto-fill applications, save time on mass applying | Only solves the apply step. No tracking after submission, no interview support. |
| **LinkedIn / Indeed** | Job discovery, networking, huge database | Once you apply, you're on your own. Job postings disappear. |
| **Notion / Spreadsheets** | Flexible, free, customizable | Not purpose-built. No connection between data. Breaks at scale. |
| **Huntr / Teal** | Clean status tracking, Kanban boards | Shallow — can log interview date but not questions, answers, or context. |

---

## Slide 9: Early AI Opportunity Hypothesis

### Why Agentic AI?

Two AI agents, one platform:

**1. AI Resume Agent** — helps before you apply
- Analyzes job description and your base resume
- Suggests keyword adjustments, bullet point reordering, skill highlights
- Generates tailored versions for each application
- Tracks which version was sent where

**2. AI Interview Coach** — helps before, during, and after interviews
- **Before**: Generates personalized prep based on past interviews, the role, and company patterns
- **During**: Summarizes interview recordings into structured notes
- **After**: Analyzes what went well/badly, identifies patterns across interviews, suggests what to improve

The resume agent feeds into the interview coach — the tailored resume informs what the coach helps you prepare for.

### High-Level Hypothesis

"An intelligent system could help job seekers **submit stronger, tailored applications for every role** — because today candidates manually adjust resumes for each posting, resulting in generic applications that fail to pass ATS filters or highlight relevant experience."

"An intelligent system could help job seekers **prepare smarter and learn from every interview** — because today candidates rely on scattered notes and generic searches, with no way to connect past performance to future preparation."

---

## Slide 10: Checkpoint Week 2

### Checklist
- [x] The problem is specific and human-centered (experienced by real people)
- [x] The user and user experience is clear
- [x] The pain-points are solvable and non-obvious
- [x] There is a clear and valuable opportunity for Agentic AI to offer a better solution and experience

### Open Questions & Assumptions

#### What We Don't Know Yet
1. How many interview questions/patterns can we realistically collect to make AI recommendations valuable?
2. Do job seekers trust AI-generated preparation advice, or do they prefer to prepare manually?
3. What's the minimum amount of interview data needed before AI insights become useful (cold start problem)?
4. Do most people actually record their interviews? (flagged in As-Is Scenario Map)

#### Assumptions We Are Making
- Job seekers are willing to input structured data about their interviews (questions, answers, feedback) in exchange for better preparation support
- Interview patterns are somewhat predictable by company/role/round type, making AI recommendations feasible
- Users want an all-in-one tool rather than integrating AI into their existing fragmented workflow
- AI can meaningfully tailor resumes beyond simple keyword matching

#### Validation Research
- [ ] Survey 10-15 active job seekers about their current interview preparation workflow and pain points
- [ ] Analyze whether interview question patterns exist by company/role (desk research on Glassdoor, Blind, etc.)
- [ ] Test willingness to input structured interview data with a prototype or mock workflow
- [ ] Validate whether users record interviews and would want AI to summarize them

---

# PART 2: User-Centric Solution (Week 3) — TO DO

---

## Slide 12: Target Core User
*[To be completed in Week 3]*

## Slide 13: Solution Concept
*[To be completed in Week 3]*

## Slide 14: Innovation Intent
*[To be completed in Week 3]*

---

# PART 3: Solution Blueprint (Week 4-5) — TO DO

---

## Slide 17: AI Agent Architecture
*[To be completed in Week 4-5]*

## Slide 18: AI Agent Workflow
*[To be completed in Week 4-5]*

## Slide 19: Tools & Integrations
*[To be completed in Week 4-5]*

## Slide 20: Intelligence & Reasoning Design
*[To be completed in Week 4-5]*

## Slide 21: Governance & Ethics
*[To be completed in Week 5]*

## Slide 22: Scope & Limitations of MVP
*[To be completed in Week 5]*
