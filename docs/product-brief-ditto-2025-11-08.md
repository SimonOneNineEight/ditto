# Product Brief: ditto

**Date:** 2025-11-08
**Author:** Simon
**Context:** Personal project solving a real pain point

---

## Executive Summary

ditto is a web-based job search management platform that solves a critical gap in the market: deep interview management. While existing tools like Huntr, Teal, and Simplify excel at application tracking and basic interview scheduling, they leave job seekers using Excel spreadsheets and Notion pages to manage the most important phase of their job search - the interviews themselves.

ditto's core differentiator is comprehensive interview lifecycle management. Beyond tracking dates, ditto captures what happens inside interviews: questions asked, answers given, interviewer feedback, company research, and preparation materials. For multi-round interviews, it builds continuous context so users can review Round 1 notes when preparing for Round 2. Technical assessments - a critical component missing from existing trackers - are tracked with deadlines, instructions, and submission links.

The MVP focuses on four core capabilities: (1) application tracking with URL-based job information extraction, (2) hybrid structured/flexible interview management, (3) technical assessment tracking, and (4) basic workflow support with reminders. The platform is web-first for universal accessibility and will store resumes/documents on ditto's infrastructure for seamless cross-device access.

Built initially to solve the creator's own job search pain, ditto aims to become the single source of truth for job seekers - eliminating the need to juggle multiple tools during an already stressful process. Success means users only open ditto when thinking about their job search, with everything they need in one place.

---

## Core Vision

### Problem Statement

Job seekers currently lack a centralized platform to manage the complete job search lifecycle - from initial application through the interview stages. While various tools exist for tracking applications (Huntr, Teal, Simplify), they only handle the surface level of interview management - tracking dates and reminders. They completely miss the deep work that happens during interviews: the questions asked, the answers given, the interviewer feedback, company research, and preparation materials. This forces job seekers to resort to scattered Excel spreadsheets and Notion pages to manage the most critical phase of their job search, creating fragmentation exactly when they need focus and clarity the most.

### Proposed Solution

ditto is an all-in-one platform designed specifically for job seekers to manage everything related to their job search journey. Unlike existing application trackers that only track interview dates, ditto goes deep into interview management - capturing what was asked in each round, storing preparation documents, tracking interviewer feedback, managing company research notes, and building a comprehensive context for each opportunity. It replaces the fragmented workflow of using a tracker for dates + Excel/Notion for actual interview content with a single, cohesive platform.

### Why Existing Solutions Fall Short

Current job application trackers (Huntr, Teal, Simplify, Careerflow) focus heavily on the application phase - autofilling forms, tracking statuses, optimizing resumes for ATS. When it comes to interviews, they only offer basic calendar/reminder functionality. They answer "when is your interview?" but not "what happened in your interview?" or "how should you prepare for the next round?"

This creates a critical gap: job seekers still need Excel spreadsheets or Notion pages to track:
- Questions asked in each interview round
- Their answers and how they performed
- Interviewer names, roles, and feedback
- Company research and preparation materials
- Technical assessments or take-home projects
- Context from Round 1 to inform Round 2 preparation

The result is a fragmented workflow where the tracking tool handles the "easy" part (dates) but the "hard" part (interview content and preparation) lives in separate tools, creating cognitive overhead during the most stressful phase of job searching.

---

## Target Users

### Primary Users

Job seekers actively searching for employment who need to manage multiple applications and interview stages simultaneously. This includes the creator (Simon) who is currently experiencing this pain firsthand, as well as anyone navigating the complexity of modern job searches where keeping track of applications, company research, interview schedules, and follow-ups becomes overwhelming.

### User Journey

The core user flow that defines ditto's value:

1. **Application Entry**: User pastes a job posting URL → ditto extracts job details and auto-fills the application form → user uploads tailored resume/cover letter
2. **Status Updates**: As the application progresses, user moves it through the pipeline (Applied → Interview → Offer/Rejected)
3. **Interview Preparation**: When an interview is scheduled, user creates an interview record → adds prep notes, company research, and practice materials in one place
4. **Interview Execution**: After the interview, user captures what was asked, how they answered, interviewer feedback → builds context for next rounds
5. **Technical Assessments**: User tracks take-home projects with deadlines, instructions, and submission links
6. **Continuous Context**: For multi-round interviews, user reviews previous round notes to prepare for the next stage

The "magic moment" is the seamless flow from adding an application to managing every detail of the interview process without ever needing to open Excel, Notion, or scattered documents.

---

## MVP Scope

### Core Features

**1. Application Tracking**
- Manual application entry (company name, job title, status, application date)
- URL-based job information extraction: users paste a job posting URL, and ditto automatically extracts and autofills relevant fields (job title, company, description, requirements)
- Status pipeline tracking (Saved → Applied → Interview → Offer → Rejected)
- Resume and cover letter upload and storage (stored on ditto's infrastructure for seamless cross-device access)

**2. Deep Interview Management** (Core Differentiator)

Interview tracking with hybrid structured + flexible approach:

*Structured Data Capture:*
- Interview round number and type (phone screen, technical, behavioral, panel, etc.)
- Date, time, and duration
- Interviewer names and roles
- Questions asked (list format for easy review)
- Performance notes and your answers
- Feedback received from interviewers

*Flexible Preparation Area:*
- Rich text notes area for company research, practice answers, and preparation materials
- File upload support for existing prep documents
- Links to relevant resources

**3. Technical Assessment Tracking**

Integrated as a subsection of each application:
- Assessment type (take-home project, live coding, system design, etc.)
- Due date with reminders
- Instructions and requirements (text or file upload)
- Submission tracking (GitHub links, uploaded files, or notes on what was submitted)
- Status tracking (Not started, In progress, Submitted)

**4. Basic Workflow Support**
- Timeline view of upcoming interviews and assessment deadlines
- Simple reminder system for follow-ups and deadlines

### Out of Scope for MVP

Features explicitly deferred to post-MVP releases:
- Chrome extension or auto-fill functionality (manual entry and URL extraction sufficient for MVP)
- AI-powered features (resume optimization, answer suggestions, smart matching)
- Analytics dashboard (application success rates, time-to-offer metrics)
- Collaboration features (sharing with mentors or career coaches)
- Advanced automation or integrations with job boards

### MVP Success Criteria

The MVP will be considered successful when:
- Simon (creator) can manage his complete job search workflow in ditto without needing Excel or Notion
- All interview preparation materials, questions, and feedback are captured in one place
- The URL extraction feature saves measurable time compared to manual data entry
- Technical assessments are tracked with clear visibility of deadlines and submission status
- ditto becomes the ONLY tool Simon opens when thinking about job applications or interviews

### Future Vision

Post-MVP features for long-term roadmap:

**Tier 1 - High Impact:**
- Smart resume and cover letter optimization: automatically adjust wording to match job keywords while preserving original document formatting
- AI interview coach: review and improve interview answers with personalized feedback
- Mock interview practice: simulate interview scenarios with common questions for the target role

**Tier 2 - Advanced Intelligence:**
- Pattern recognition analytics: identify strengths and weaknesses across multiple interviews ("You excel at technical questions but struggle with behavioral scenarios")
- Performance insights: track improvement over time and suggest focus areas

**Tier 3 - Community Features:**
- Anonymized question database: learn from questions other users encountered at similar companies/roles
- Benchmarking: compare your interview performance and success rates against similar job seekers

---

## Market Context

**Current Landscape:**

The job application tracker market is dominated by several established players:
- **Huntr** (400,000+ users): Visual Kanban boards, AI resume tools, browser extension. Strong on application tracking but interview features are basic (scheduling/reminders only). Users cite cluttered UI and expensive premium tier as pain points.
- **Teal**: Comprehensive LinkedIn integration, resume builder, analytics dashboard. Interview management limited to scheduling and follow-up reminders. Users report confusing UI and weak AI capabilities.
- **Simplify**: Fast autofill and one-click application saving. Optimized for high-volume applications but minimal interview depth.
- **Careerflow**: Custom labels, status tracking, stores recruiter details. Again, interview features are surface-level.

**Market Gap:**

Despite 50%+ of job seekers still using spreadsheets for interview management and 32% missing opportunities due to poor organization, no existing tool addresses the deep interview management need. All major players answer "when is your interview?" but none answer "what happened in your interview?" or "how do I prepare for the next round?"

**ditto's Positioning:**

ditto enters the market not as another application tracker, but as the first interview-centric job search platform. While competitors race to add AI resume optimization and application automation, ditto focuses on the phase that actually determines outcomes: the interview process. This creates a complementary positioning - users could potentially use Simplify for fast applications and ditto for interview excellence, or ditto can replace the entire stack with its all-in-one approach.

**Target Market:**
Initially targeting tech job seekers who face multi-round technical interviews, take-home assessments, and need to manage complex interview preparation. This segment already uses sophisticated tools (GitHub, Notion, spreadsheets) and will appreciate purpose-built interview management.

---

## Technical Preferences

**Platform:** Web-based application for universal accessibility across devices

**Why Web-First:**
- Accessible from any device without installation
- Easier to build and iterate on compared to native mobile apps
- Cross-platform compatibility (desktop, tablet, mobile browsers)
- Centralized data storage and synchronization

**Mobile Considerations:**
- Responsive design to ensure usability on mobile browsers
- Ability to quickly review interview notes and prep materials on-the-go
- Future consideration: Progressive Web App (PWA) for offline access and app-like experience

---

## Success Metrics

**Primary Success Indicator:**
ditto becomes the single source of truth for all job application and interview management - users should only need to open ditto when thinking about their job search, eliminating the need for spreadsheets, Notion pages, or scattered documents.

**User Behavior Metrics:**
- Time saved on application entry (URL extraction vs manual entry)
- Reduction in context-switching between tools
- Interview preparation time efficiency (centralized prep vs scattered notes)

**Validation Signals:**
- Can complete entire job search workflow without external tools
- Successfully prepare for multi-round interviews using only ditto's context
- Never miss interview deadlines or forget what was discussed in previous rounds

---

_This Product Brief captures the vision and requirements for ditto._

_It was created through collaborative discovery and reflects the unique needs of this Personal project solving a real pain point project._

_Next: Use the PRD workflow to create detailed product requirements from this brief._
