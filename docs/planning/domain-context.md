# Job Search Domain Context

**Purpose:** Document domain-specific knowledge, patterns, and requirements for the job search management space to inform architectural and implementation decisions.

**Date:** 2025-11-10
**Domain:** Career Tools / Job Search Management
**Project:** ditto MVP

---

## Domain Overview

### What is Job Search Management?

Job search management refers to the process, tools, and workflows job seekers use to organize, track, and optimize their job hunting activities from initial job discovery through offer acceptance or rejection.

**Core Activities:**
1. Job discovery and research
2. Application submission and tracking
3. Interview preparation and management
4. Technical assessment completion
5. Offer negotiation and decision-making

**Pain Points:**
- Context fragmentation across tools (spreadsheets, notes apps, email)
- Interview detail loss between rounds
- Deadline tracking for assessments
- Lack of continuous preparation visibility
- Manual data entry overhead

---

## Job Search Workflow Patterns

### Standard Job Search Lifecycle

```
1. DISCOVERY
   ├─ Browse job boards (LinkedIn, Indeed, Glassdoor, etc.)
   ├─ Network referrals
   ├─ Company career pages
   └─ Recruiter outreach

2. RESEARCH
   ├─ Company background
   ├─ Role requirements
   ├─ Salary expectations
   └─ Interview process insights (Glassdoor, Blind)

3. APPLICATION
   ├─ Tailor resume for role
   ├─ Write cover letter (if required)
   ├─ Submit application
   └─ Save job posting details

4. TRACKING
   ├─ Status updates (Applied → Screening → Interview → Offer/Rejected)
   ├─ Follow-up reminders
   └─ Application count monitoring

5. INTERVIEW PROCESS (MULTI-ROUND)
   ├─ Round 1: Phone Screen (recruiter, 30 min)
   ├─ Round 2: Technical Screen (1 hour, coding/design)
   ├─ Round 3: Team Interviews (2-4 interviews, 3-6 hours)
   ├─ Round 4: Final Round (leadership, culture fit)
   └─ Offer Discussion

6. TECHNICAL ASSESSMENTS
   ├─ Take-home projects (2-7 days)
   ├─ Live coding challenges (45-90 min)
   ├─ System design exercises (45-60 min)
   └─ Case studies (business/product roles)

7. DECISION
   ├─ Offer evaluation
   ├─ Negotiation
   ├─ Acceptance or rejection
   └─ Lessons learned documentation
```

---

## Interview Process Deep Dive

### Typical Interview Round Structure

#### Round 1: Recruiter Screen (Phone/Video)
- **Duration:** 20-30 minutes
- **Participants:** 1 recruiter
- **Focus:** Role fit, salary expectations, availability
- **Preparation Needs:** Company research, elevator pitch, questions about role
- **Common Questions:**
  - "Tell me about yourself"
  - "Why this role/company?"
  - "Salary expectations?"
  - "Availability for interviews?"

#### Round 2: Technical Screen
- **Duration:** 45-90 minutes
- **Participants:** 1-2 engineers
- **Focus:** Coding ability, problem-solving, communication
- **Preparation Needs:** LeetCode practice, system design basics
- **Common Formats:**
  - Live coding (HackerRank, CoderPad)
  - System design (whiteboard, Excalidraw)
  - Debugging exercise
  - Code review

#### Round 3: On-site / Virtual On-site
- **Duration:** 3-6 hours (half-day to full-day)
- **Participants:** 4-6 interviewers (engineers, managers, cross-functional)
- **Focus:** Deep technical skills, cultural fit, collaboration
- **Preparation Needs:**
  - Review Round 1-2 feedback
  - Prepare behavioral examples (STAR method)
  - Practice advanced coding/design problems
  - Research company culture and values
- **Common Interview Types:**
  - Technical deep-dive (2-3 interviews)
  - Behavioral / leadership (1-2 interviews)
  - System design (1 interview)
  - Manager/director conversation (1 interview)

#### Round 4: Final / Leadership Round (If applicable)
- **Duration:** 30-60 minutes
- **Participants:** VP, Director, or C-level
- **Focus:** Strategic thinking, culture alignment, long-term potential
- **Preparation Needs:** Company vision, strategic questions, career goals

### Key Interview Management Insights

**Why Context Between Rounds Matters:**
1. **Feedback Incorporation** - Round 2 interviewer may reference Round 1 discussion
2. **Avoiding Repetition** - Don't repeat same stories/answers across rounds
3. **Demonstrating Growth** - Show you've researched based on previous round insights
4. **Building Relationships** - Reference previous interviewers to show engagement
5. **Consistency** - Align answers across rounds (salary expectations, availability, etc.)

**Common Context Loss Problems:**
- Forgetting interviewer names between rounds
- Re-answering same question differently (inconsistency red flag)
- Missing feedback from previous rounds
- Losing track of questions you asked vs should ask
- Forgetting company-specific research notes

**The "Magic Moment" in Job Search:**
> When preparing for Round 2, seeing Round 1 notes instantly - questions asked, how you answered, interviewer feedback, company research - all in one place, allows you to prepare strategically rather than starting from scratch.

---

## Technical Assessment Patterns

### Assessment Types

#### 1. Take-Home Projects
- **Timeline:** 2-7 days (varies by company)
- **Complexity:** Build a mini-application, implement algorithm, solve business problem
- **Deliverables:**
  - GitHub repository with code
  - README with setup instructions
  - Tests (unit, integration)
  - Documentation
- **Evaluation Criteria:**
  - Code quality and organization
  - Problem-solving approach
  - Communication (README clarity)
  - Testing coverage
  - Time management (did they over-engineer?)

**Example:** "Build a task management API with authentication, CRUD operations, and tests."

#### 2. Live Coding
- **Duration:** 45-90 minutes
- **Platform:** HackerRank, CoderPad, Google Docs, Zoom screen share
- **Types:**
  - Algorithm problems (LeetCode-style)
  - Debugging exercises
  - Refactoring challenges
- **Evaluation:** Problem-solving process, communication, code clarity, testing

#### 3. System Design
- **Duration:** 45-60 minutes
- **Scope:** Design scalable systems (e.g., "Design Twitter", "Design URL shortener")
- **Evaluation:**
  - High-level architecture
  - Scalability considerations
  - Trade-off discussions
  - Communication and collaboration

#### 4. Case Studies (Non-Technical Roles)
- **Duration:** 2-5 days
- **Types:** Product strategy, business analysis, market research
- **Deliverables:** Presentation, written report, data analysis
- **Evaluation:** Strategic thinking, data-driven decisions, communication

### Assessment Management Needs

**Critical Tracking Requirements:**
1. **Deadline Visibility** - Countdown to due date, urgency indicators
2. **Submission Tracking** - What was submitted, when, where (GitHub link, file upload)
3. **Instructions Preservation** - Original requirements, constraints, evaluation criteria
4. **Notes During Work** - Challenges encountered, decisions made, learnings
5. **Post-Submission Follow-up** - Feedback received, outcome

**Deadline Pressure Patterns:**
- **Green Zone** (>3 days): Planning and research
- **Yellow Zone** (1-3 days): Active implementation
- **Red Zone** (<1 day or overdue): Urgent completion or follow-up needed

---

## Job Search Tools Landscape

### Competitor Analysis

#### Huntr (400k+ users)
- **Strength:** Visual Kanban board, Chrome extension for quick capture
- **Weakness:** Interview management is shallow (dates only, no content)
- **Gap:** No multi-round context, no prep material storage

#### Teal
- **Strength:** LinkedIn integration, resume optimization
- **Weakness:** Interview tracking is basic (datetime + notes field)
- **Gap:** No structured interview data, no assessment tracking

#### Simplify
- **Strength:** Fast autofill for applications, clean UI
- **Weakness:** Minimal interview features beyond scheduling
- **Gap:** No deep interview management, no assessment tracking

#### Careerflow
- **Strength:** Custom labels, LinkedIn scraping
- **Weakness:** Surface-level interview tracking
- **Gap:** No round-by-round context, no technical assessment module

### Market Gap (ditto's Opportunity)

**What Competitors Answer:**
- ✅ "When is your interview?"
- ✅ "What's your application status?"
- ✅ "How many applications have you sent?"

**What Competitors DON'T Answer:**
- ❌ "What happened in your last interview?"
- ❌ "How should I prepare for the next round?"
- ❌ "What questions were asked and how did I answer?"
- ❌ "When is my technical assessment due and where is my submission?"

**ditto's Differentiation:**
> First platform where interview content management is as robust as application tracking.

---

## User Personas

### Primary Persona: Active Job Seeker (Simon's Profile)

**Demographics:**
- Age: 25-40
- Experience: Mid-level to senior professionals
- Industry: Tech, but applicable broadly
- Employment Status: Employed but seeking, or recently unemployed

**Behaviors:**
- Manages 5-20 active applications simultaneously
- Interviews with 3-7 companies concurrently
- Multi-round interview processes (2-5 rounds per company)
- Technical assessments (1-3 take-home projects active)
- Uses multiple tools: Spreadsheet + Notion + Calendar + Email

**Pain Points:**
1. **Context Switching Overhead**
   - "Where did I write those Round 1 notes?"
   - "Which Excel tab has this company?"
   - "Did I save that feedback in Notion or Google Docs?"

2. **Cognitive Load During Stress**
   - Job searching is already stressful
   - Remembering which tool has what information adds mental burden
   - Fear of missing deadlines or forgetting interview details

3. **Preparation Inefficiency**
   - Searching through fragmented notes to prepare for Round 2
   - Re-reading job descriptions scattered across browser tabs
   - Losing track of which questions were asked

**Goals:**
- Single source of truth for entire job search
- Seamless context between interview rounds
- Never miss a deadline or forget interview details
- Reduce cognitive overhead during stressful period

**Success Metrics:**
- Uses ONLY ditto for job search (no Excel, Notion, or spreadsheets)
- Feels confident and prepared for every interview
- Never misses an assessment deadline
- Can recall all interview details instantly

---

## Domain-Specific Business Rules

### Application Status Pipeline

**Standard Statuses:**
```
Saved → Applied → Interview → Offer → Rejected
         ↓           ↓           ↓
    (also possible: Ghosted, Withdrawn)
```

**Status Definitions:**
- **Saved:** Job found, considering applying (researching company)
- **Applied:** Application submitted, awaiting response
- **Interview:** At least one interview scheduled or completed
- **Offer:** Offer extended (negotiating or evaluating)
- **Rejected:** Application/interview rejected OR offer declined by candidate
- **Withdrawn:** Candidate withdrew before completing process
- **Ghosted:** No response after application/interview (common, frustrating)

**Status Transition Rules:**
- Can move backward (e.g., Interview → Applied if rounds restart)
- "Rejected" is terminal (can't transition out)
- "Offer" can go to "Rejected" (if candidate declines)

### Interview Round Numbering

**Standard Pattern:**
- Round 1, Round 2, Round 3, ... Round N
- Auto-increment based on scheduled date
- Allows out-of-order scheduling (Round 3 scheduled before Round 2 completes)

**Special Cases:**
- Some companies use "Phone Screen", "Technical", "On-site" instead of numbers
- Support both numeric and named rounds (map to numbers internally)

### Assessment Deadlines

**Time-Sensitive Nature:**
- Hard deadlines (company-specified)
- Negotiable deadlines (if candidate requests extension)
- Missing deadline often = automatic rejection

**Submission Finality:**
- Once submitted, cannot modify (immutable record)
- Late submissions rarely accepted
- Clear timestamp of submission critical

---

## Regulatory & Compliance Considerations

### Data Privacy

**Personal Information in ditto:**
- Resume/cover letter (may contain PII: name, address, phone, email)
- Interview notes (may contain interviewer names, company details)
- Salary expectations and offer details
- Assessment submissions (code, documents)

**Privacy Requirements:**
- User owns all data
- Data accessible only by account owner
- HTTPS for all data transmission
- Encrypted storage for uploaded files
- No sharing of data with third parties (especially competitors or recruiters)

**GDPR/CCPA Compliance (Future):**
- Right to download all data (export functionality)
- Right to delete account and all data
- Transparency in data usage

### Intellectual Property

**Assessment Submissions:**
- Candidate retains IP rights to take-home project code
- Companies may claim ownership after submission (varies)
- ditto does NOT claim ownership - just provides storage

**Resume/Cover Letter:**
- User-created content, user retains all rights
- ditto provides storage and access, no ownership claim

---

## Integration Points & External Systems

### Job Boards (URL Extraction)
- LinkedIn Jobs
- Indeed
- Glassdoor
- AngelList (Wellfound)
- Company career pages

**Integration Needs:**
- Web scraping (no official APIs for most)
- Respect robots.txt and rate limiting
- Cache extracted data (reduce redundant scraping)

### Calendar Systems (Future)
- Google Calendar
- Outlook Calendar
- Apple Calendar

**Integration Needs:**
- OAuth for calendar access
- Sync interview dates bidirectionally
- Reminders via calendar notifications

### Communication Tools (Future)
- Email (Gmail, Outlook)
- Slack (for recruiter coordination)

**Integration Needs:**
- Email parsing for interview invitations
- Auto-detection of interview details
- Link interview to application

---

## Technical Constraints & Considerations

### Scale Expectations (MVP)

**User Base:**
- Initial: 1 user (Simon)
- First 6 months: 10-50 users (friends, beta testers)
- Post-MVP growth: 100-1,000 users

**Data Volume Per User:**
- 50-200 applications per job search cycle (3-6 months)
- 5-20 interviews per search cycle
- 2-5 technical assessments per search cycle
- 10-50 MB uploaded files per user

**Performance Targets:**
- Dashboard load: <2 seconds
- Search results: <1 second
- File uploads (5MB): <10 seconds
- API responses: <500ms (90th percentile)

### Infrastructure

**Brownfield Constraints:**
- Existing Go backend (1.23)
- PostgreSQL database (15)
- Next.js frontend (14)
- Docker Compose deployment

**New Infrastructure Needs:**
- S3-compatible file storage (MinIO or AWS S3)
- Redis (optional, for caching extractions)
- Background job processor (for URL extraction, notifications)

---

## Common Edge Cases

### Application Edge Cases

1. **Same Company, Multiple Roles**
   - User applies to 3 different roles at Google
   - Need to track as separate applications
   - Link together for context (shared company research)

2. **Role Changes During Process**
   - Applied for "Software Engineer" but interviewed for "Senior Software Engineer"
   - Track original role but note change

3. **Referrals**
   - Application via employee referral
   - Track referrer name for follow-up

### Interview Edge Cases

1. **Out-of-Order Rounds**
   - Round 3 scheduled before Round 2 due to interviewer availability
   - Allow non-sequential round creation

2. **Panel Interviews**
   - 4 interviewers in one session
   - Support multiple interviewers per interview

3. **Interview Cancellations**
   - Company cancels interview
   - Keep record but mark as cancelled (not deleted)

4. **Reschedules**
   - Interview rescheduled 3 times
   - Track history of date changes (optional)

### Assessment Edge Cases

1. **Multiple Submissions**
   - Candidate submits v1, then improved v2 before deadline
   - Track all submissions chronologically

2. **Deadline Extensions**
   - Company grants 3-day extension
   - Update due date, note extension in timeline

3. **Partial Completion**
   - Ran out of time, submitted incomplete work
   - Still track submission for reference

---

## Success Patterns from User Research

### What Makes Job Search Tools "Sticky"

**Data Fidelity:**
- Users trust tool that never loses data
- Auto-save is critical (never lose interview notes)
- Cross-device sync is expected

**Cognitive Load Reduction:**
- "Single source of truth" mindset
- Eliminate tool-switching during workflow
- Context is preserved, not scattered

**Deadline Awareness:**
- Clear visibility of what's coming next
- Proactive reminders (not reactive panic)
- Color-coded urgency (green/yellow/red zones)

**Preparation Confidence:**
- Easy access to previous round context
- Research notes always at hand
- Feeling prepared = feeling confident = better interviews

---

## Lessons from Existing User Behaviors

### Current Workaround Patterns

**Spreadsheet + Notion Combo:**
- **Spreadsheet:** Application tracking (status, dates, companies)
- **Notion:** Interview notes (long-form content, rich text)
- **Problem:** Context split across tools, manual sync overhead

**Google Docs per Company:**
- One doc per company with all research, interviews, notes
- **Problem:** Scattered across Google Drive, hard to get overview

**Email as Archive:**
- Forward all interview invitations to self
- Search email when preparing
- **Problem:** Mixed with non-job emails, hard to search

**Calendar + Reminders:**
- Add interviews to calendar manually
- Set reminder 1 day before
- **Problem:** No context in calendar event, just datetime

### What Users Want (But Don't Have)

1. **Unified Timeline**
   - See all interviews and deadlines across all applications in one view
   - Filter by date range (this week, this month)

2. **Context Preservation**
   - Round 1 notes visible when preparing for Round 2
   - No digging through old documents

3. **Automatic Capture**
   - Paste job URL → details extracted
   - Low manual entry overhead

4. **Trust & Reliability**
   - Auto-save (never lose notes)
   - Always accessible (cross-device)
   - Data export (portability)

---

## Domain Terminology

| Term | Definition |
|------|------------|
| **Application** | A job posting the user has saved or applied to |
| **Round** | A single interview session (phone screen, technical, on-site) |
| **Assessment** | Take-home project, live coding, or case study assignment |
| **Pipeline** | Sequence of statuses an application moves through |
| **On-site** | In-person or virtual full-day interview (3-6 hours) |
| **Panel** | Interview with multiple interviewers simultaneously |
| **Ghosting** | Company stops responding after application/interview |
| **Offer** | Formal job offer extended by company |
| **Recruiter Screen** | Initial call with recruiter (Round 1 typically) |
| **Technical Screen** | Coding/design interview (often Round 2) |
| **Behavioral Interview** | Questions about past experiences (STAR method) |
| **System Design** | Architectural interview (whiteboard/diagram) |
| **Take-Home** | Assignment completed on candidate's own time |
| **Submission** | Deliverable sent to company (assessment completed) |

---

## Key Domain Insights for Architecture

### What the Architecture Team Should Know

1. **Multi-Round Context is THE Differentiator**
   - This is not a nice-to-have feature
   - It's the core value proposition that distinguishes ditto
   - Design data models and UI to optimize for round-to-round visibility

2. **Deadlines are Critical, Errors are Catastrophic**
   - Missing an assessment deadline = losing an opportunity
   - Notification system reliability is non-negotiable
   - Countdown visibility should be omnipresent

3. **Data Loss is Unacceptable**
   - Job search is stressful; losing notes compounds stress exponentially
   - Auto-save must be reliable (30s debounce, retry on failure)
   - Backup and export capabilities build trust

4. **Tool Consolidation is the Goal**
   - Users want to close Excel and Notion
   - Every feature should ask: "Does this reduce tool-switching?"
   - Avoid feature bloat that fragments UX

5. **Performance = Trust**
   - Slow tools get abandoned during high-stress periods
   - 2-second dashboard load isn't just an NFR, it's a trust signal
   - Fast search = confident preparation

6. **Manual Entry Fallback Always**
   - URL extraction is great, but manual entry must work perfectly
   - Automated features enhance, but never block core workflows

---

**Document Status:** ✅ Complete
**Audience:** Architecture team, backend/frontend developers, UX designer
**Next Steps:** Reference during architecture design decisions
**Maintained By:** Product Manager (John)
