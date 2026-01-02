# ditto - Product Requirements Document

**Author:** Simon
**Date:** 2025-11-08
**Version:** 1.0

---

## Executive Summary

Ditto is a web-based job search management platform that addresses a critical gap in the market: comprehensive interview lifecycle management. While existing tools like Huntr, Teal, and Simplify excel at application tracking and basic scheduling, they force job seekers to use Excel spreadsheets and Notion pages to manage the most important phase of their search - the interviews themselves.

Ditto replaces the fragmented workflow of "tracker for dates + Excel/Notion for content" with a unified platform where everything lives in one place. Users can track applications, manage deep interview context (questions asked, answers given, feedback received), monitor technical assessments with deadlines, and maintain continuous preparation materials across multiple interview rounds.

Built initially to solve the creator's own job search pain during active employment searching, ditto aims to become the single source of truth - eliminating the cognitive overhead of juggling multiple tools during an already stressful process.

### What Makes This Special

**The magic moment**: When preparing for Round 2, you open ditto and instantly see your Round 1 notes - the questions they asked, how you answered, the interviewer's feedback, your company research - all in context, ready to inform your next conversation. No searching through Notion pages, no digging through Excel tabs, no wondering "where did I put those notes?" Everything you need flows seamlessly from one interview round to the next.

This is what existing job trackers completely miss. They answer "when is your interview?" but not "what happened in your interview?" or "how should you prepare for the next round?" Ditto answers all three.

---

## Project Classification

**Technical Type:** Web Application (SaaS)
**Domain:** Productivity / Career Tools
**Complexity:** Medium
**Field Type:** Brownfield (existing Go backend + Next.js frontend infrastructure)

This is a brownfield web application with established technical foundations:
- **Backend**: Go 1.23 + Gin framework + PostgreSQL database with 11 tables
- **Frontend**: Next.js 14 + React 18 + TypeScript with shadcn/ui components
- **Authentication**: JWT + NextAuth v5 with OAuth (GitHub, Google)
- **Deployment**: Docker Compose ready

The PRD focuses on completing the MVP feature set by adding deep interview management, technical assessment tracking, and workflow automation to the existing application tracking foundation.

---

## Success Criteria

**Primary Success Indicator:**
Ditto becomes the single source of truth for Simon's complete job search workflow - never needing Excel, Notion, or any other tool when managing applications or preparing for interviews.

**User Behavior Success Signals:**

1. **Elimination of Tool Switching**
   - All interview preparation materials, questions, and feedback captured exclusively in ditto
   - Zero instances of "where did I save that?" when preparing for interviews
   - Complete job search context accessible from any device without external documents

2. **Interview Preparation Efficiency**
   - Seamless context flow between interview rounds (Round 1 notes immediately accessible for Round 2 prep)
   - Preparation time reduced through centralized company research and interview history
   - Never miss interviewer names, feedback, or questions from previous rounds

3. **Workflow Completeness**
   - URL extraction feature saves measurable time vs manual application entry
   - Technical assessments tracked with clear visibility of deadlines and submission status
   - Timeline view prevents missed interviews, deadlines, or follow-ups

4. **Cognitive Load Reduction**
   - Only one tool to open when thinking about job search
   - Mental model simplified from "tracker + spreadsheet + notes" to just "ditto"
   - Context is preserved, not scattered across tools

**MVP Validation Criteria:**

The MVP succeeds when Simon can conduct an entire multi-round interview process (from application to offer/rejection) using ONLY ditto:
- ✅ Application entered (manually or via URL)
- ✅ Company research and prep materials stored
- ✅ Each interview round documented with questions, answers, feedback
- ✅ Technical assessments tracked with deadlines and submissions
- ✅ Next round preparation informed by previous round context
- ✅ Final outcome recorded with lessons learned

### Business Metrics

**Initial Phase (Personal Use):**
- Success is purely functional: Does it solve Simon's pain completely?
- No user acquisition metrics needed for MVP

**Future Growth Indicators (Post-MVP):**
- Daily active usage during job search periods
- Average applications managed per user
- Interview-to-offer conversion tracking
- User retention through complete job search lifecycle
- Time saved vs traditional multi-tool workflow

---

## Product Scope

### MVP - Minimum Viable Product

The MVP delivers a complete job search management solution with four core capabilities:

#### 1. Application Tracking (Foundation)

**Manual Entry:**
- Company name, job title, application status, application date
- Status pipeline: Saved → Applied → Interview → Offer → Rejected
- Resume and cover letter upload (stored on ditto infrastructure for cross-device access)

**Smart URL Extraction:**
- Paste job posting URL → automatic extraction of job details
- Auto-fill: job title, company name, description, requirements
- Eliminates manual data entry for common job boards

**Application Management:**
- View all applications in table/list format
- Filter by status, company, date range
- Quick status updates and application notes

#### 2. Deep Interview Management (Core Differentiator)

**Hybrid Structured + Flexible Approach:**

*Structured Data Capture:*
- Interview round number and type (phone screen, technical, behavioral, panel, on-site)
- Scheduled date, time, and duration
- Interviewer names and roles
- Questions asked (list format for easy reference)
- Your answers and performance self-assessment
- Feedback received from interviewers
- Interview outcome/next steps

*Flexible Preparation Area:*
- Rich text editor for company research notes
- Practice answers and preparation materials
- File upload support for existing prep documents (PDFs, Word docs, etc.)
- Link storage for relevant resources
- Cross-round context visibility (see Round 1 when preparing for Round 2)

**Multi-Round Context:**
- Timeline view showing all rounds for an application
- One-click navigation between rounds
- Persistent context: all previous rounds visible during new round prep
- Interview history tied to specific application

#### 3. Technical Assessment Tracking

**Integrated as Application Subsection:**
- Assessment type: take-home project, live coding, system design, data structures, case study
- Due date with countdown and reminders
- Instructions and requirements (rich text or file upload)
- Submission tracking:
  - GitHub repository links
  - File uploads for completed work
  - Notes on what was submitted and when
- Status: Not Started → In Progress → Submitted → Reviewed
- Feedback and results storage

#### 4. Basic Workflow Support

**Timeline & Calendar View:**
- Upcoming interviews and assessment deadlines in chronological order
- Today/This Week/This Month filtering
- Quick overview of active commitments

**Reminder System:**
- Interview reminders (24 hours, 1 hour before)
- Assessment deadline reminders
- Follow-up reminders after interviews
- Configurable reminder preferences

**Dashboard:**
- Application statistics by status
- Upcoming deadlines at-a-glance
- Quick actions (add application, log interview)

### Post-MVP Features (Explicitly Deferred)

**Tier 1 - Automation & Intelligence:**
- Chrome extension for one-click application capture
- AI resume optimization (keyword matching, ATS formatting)
- AI interview coach (answer review and improvement suggestions)
- Mock interview practice with common questions
- Smart matching (job fit scoring based on profile)

**Tier 2 - Advanced Analytics:**
- Application success rate metrics
- Time-to-offer tracking
- Pattern recognition (strengths/weaknesses across interviews)
- Performance insights and trend analysis
- Interview conversion funnel visualization

**Tier 3 - Collaboration & Community:**
- Share applications with mentors or career coaches
- Anonymized question database (learn from others' interviews)
- Benchmarking against similar job seekers
- Collaborative preparation notes
- Referral tracking

**Tier 4 - Advanced Integrations:**
- Job board integrations (LinkedIn, Indeed, etc.)
- Calendar sync (Google Calendar, Outlook)
- Email integration for automatic status updates
- ATS integration for application submission
- CRM-style automation workflows

### MVP Boundaries (What's NOT Included)

To maintain focus and ship quickly, the MVP explicitly excludes:

❌ Social features or public profiles
❌ Advanced search or filtering beyond basic queries
❌ Mobile native apps (web-responsive only)
❌ Offline functionality
❌ API access for third-party integrations
❌ Custom fields or workflow customization
❌ Team/collaborative features
❌ Payment/subscription system (free to use initially)
❌ Gamification or achievement systems
❌ Salary negotiation tools or offer comparison

---

## Web Application Specific Requirements

### Platform & Browser Support

**Primary Platform:** Web-based responsive application

**Browser Compatibility:**
- Chrome/Edge (Chromium) - Latest 2 versions
- Firefox - Latest 2 versions
- Safari - Latest 2 versions (macOS/iOS)
- Mobile browsers (responsive design, not native apps)

**Responsive Breakpoints:**
- Desktop: 1280px+ (primary experience)
- Tablet: 768px - 1279px (optimized layout)
- Mobile: 320px - 767px (responsive, essential features accessible)

**Why Web-First:**
- Universal accessibility across devices without installation
- Faster iteration and deployment vs native apps
- Cross-platform compatibility built-in
- Centralized data storage and synchronization
- Lower development and maintenance overhead for MVP

**Progressive Enhancement:**
- Core functionality works on all modern browsers
- Enhanced features (drag-drop, rich text) for capable browsers
- Graceful degradation for older browsers (display warning but basic functionality works)

### Data Storage & Synchronization

**File Storage:**
- User-uploaded resumes, cover letters, and documents stored on ditto infrastructure
- Cloud storage (S3-compatible) for reliability and cross-device access
- File size limits: 5MB per file, 100MB total per user (MVP)
- Supported formats: PDF, DOCX, TXT, PNG, JPG

**Data Sync Requirements:**
- Real-time sync across browser sessions
- Changes reflected immediately on all active sessions
- Auto-save for all content (draft protection)
- Conflict resolution for simultaneous edits

### Authentication & Session Management

**Authentication Methods:**
- Email/password (existing)
- OAuth 2.0: GitHub, Google (existing)
- JWT token-based authentication (existing)
- Refresh token rotation for security (existing)

**Session Handling:**
- Persistent sessions across browser tabs
- Auto-refresh tokens before expiration
- Graceful handling of expired sessions (redirect to login)
- "Remember me" option for extended sessions

### URL Handling & Web Scraping

**Job URL Extraction:**
- Support major job boards: LinkedIn, Indeed, Glassdoor, AngelList, etc.
- Fallback to generic scraping for unknown sites
- Error handling for blocked/inaccessible URLs
- Manual override if extraction fails

**URL Processing:**
- Client-side URL validation before submission
- Server-side scraping with timeout (10 seconds max)
- Rate limiting to prevent abuse: 30 URLs per day per user
- Caching of scraped data (24 hours) to avoid re-scraping

### Rich Text Editing

**Editor Requirements:**
- WYSIWYG editor for interview notes and preparation materials
- Formatting: bold, italic, lists, headers, links
- Markdown support (optional, for power users)
- Auto-save every 30 seconds
- Paste from Word/Google Docs with formatting preservation

**Content Storage:**
- HTML storage in database
- Sanitization to prevent XSS attacks
- Maximum content size: 50KB per note section

### Notification System

**In-App Notifications:**
- Browser notification API for reminders (with permission)
- In-app notification center for all alerts
- Notification preferences per category

**Reminder Types:**
- Interview reminders (24h, 1h before)
- Assessment deadlines (3 days, 1 day, 1 hour)
- Follow-up reminders (customizable)

**Delivery:**
- Browser push notifications (if permission granted)
- In-app banner/toast notifications
- Email fallback for critical reminders (post-MVP)

### API Architecture

**RESTful API (Existing):**
- 30+ endpoints already implemented
- JSON request/response format
- Versioned API (v1)
- Rate limiting: 100 requests/minute per user

**New Endpoints Required (for MVP completion):**

| Endpoint | Method | Description | Request Params | Auth Required |
|----------|--------|-------------|----------------|---------------|
| **Interview Management** |||||
| `/api/interviews` | POST | Create interview | application_id, round_number, interview_type, scheduled_date | Yes |
| `/api/interviews` | GET | List interviews for application | ?application_id=X | Yes |
| `/api/interviews/:id` | GET | Get interview details | id (path param) | Yes |
| `/api/interviews/:id` | PUT | Update interview | id (path param), updated fields | Yes |
| `/api/interviews/:id` | DELETE | Soft delete interview | id (path param) | Yes |
| **Technical Assessments** |||||
| `/api/assessments` | POST | Create assessment | application_id, assessment_type, title, due_date | Yes |
| `/api/assessments` | GET | List assessments | ?application_id=X | Yes |
| `/api/assessments/:id` | GET | Get assessment details | id (path param) | Yes |
| `/api/assessments/:id` | PUT | Update assessment | id (path param), updated fields | Yes |
| `/api/assessments/:id/status` | PATCH | Update status only | id (path param), status | Yes |
| `/api/assessments/:id` | DELETE | Soft delete | id (path param) | Yes |
| **Timeline & Dashboard** |||||
| `/api/timeline` | GET | Upcoming interviews and deadlines | ?type=all\|interviews\|assessments, ?range=today\|week\|month | Yes |
| `/api/dashboard/stats` | GET | Dashboard statistics | None | Yes |
| `/api/dashboard/upcoming` | GET | Next 5 events | ?limit=5 | Yes |
| **URL Extraction** |||||
| `/api/jobs/extract-url` | POST | Extract job info from URL | url (body) | Yes |
| **File Upload** |||||
| `/api/files/upload` | POST | Upload file (resume, document) | file (multipart), application_id or interview_id | Yes |
| `/api/files/:id` | GET | Download file | id (path param) | Yes |
| `/api/files/:id` | DELETE | Delete file | id (path param) | Yes |

### Progressive Web App (Future Consideration)

**Post-MVP Enhancement:**
- Service worker for offline caching
- App manifest for "Add to Home Screen"
- Offline mode for viewing cached data
- Background sync for offline changes

**MVP Approach:**
- Standard web app without PWA features
- Requires internet connection
- Focus on core functionality over offline capability

---

## User Experience Principles

### Design Philosophy

**Calm and Focused:**
Ditto should feel like a reliable workspace, not another source of stress. The UI reduces cognitive load during an already stressful job search process.

**Context Over Chrome:**
Information architecture prioritizes showing relevant context at decision points. Less chrome, more content. When preparing for Round 2, Round 1 notes are immediately visible - no extra clicks.

**Progressive Disclosure:**
Start simple, reveal complexity only when needed. Basic application entry is straightforward, but power users can dive deep into structured interview data.

**Forgiving and Flexible:**
Auto-save everywhere. No data loss. Mix structured data (interview dates, interviewer names) with freeform content (notes, research) seamlessly.

### Visual Personality

**Professional but Approachable:**
- Clean, modern interface with plenty of whitespace
- Professional color palette (not playful or overly colorful)
- Typography that's easy to scan (clear hierarchy, readable sizes)
- Subtle animations that feel responsive, not distracting

**Design References:**
- Linear (clean, focused task management)
- Notion (flexible content, but simpler)
- Traditional job trackers (familiar patterns) but better executed

### Key User Flows

#### 1. Adding an Application (Quick Path)

**Goal:** Capture a new application in under 30 seconds

**Flow:**
1. Click "Add Application" (prominent CTA on dashboard)
2. Paste job URL → auto-extraction loads fields
3. Review/edit auto-filled data (company, title, description)
4. Upload tailored resume (optional, can do later)
5. Click "Save" → application appears in pipeline

**UX Considerations:**
- URL extraction provides instant feedback (loading state → success/fail)
- Manual fallback if URL fails (don't block user)
- Save creates record; subsequent edits auto-save

#### 2. Logging an Interview (Core Experience)

**Goal:** Capture interview details while fresh in memory

**Flow:**
1. From application detail page → "Add Interview Round"
2. **Quick capture** (minimal friction):
   - Round number (auto-incremented: Round 1, 2, 3...)
   - Interview type (dropdown: phone screen, technical, behavioral, etc.)
   - Date/time picker
   - Interviewer name(s)
3. Click "Create" to save initial record
4. **Detailed notes** (flexible area, auto-saves):
   - Questions asked (list format, add/remove items)
   - Your answers (rich text)
   - Feedback received (rich text)
   - Overall impression
5. Auto-save every 30 seconds while editing
6. "Done" → Returns to application view showing all rounds

**UX Considerations:**
- Default to "today" for date (most interviews logged same day)
- Rich text should feel like Google Docs (familiar, not overwhelming)
- Questions list is additive (click "Add Question" to capture each one)
- Previous rounds visible in sidebar during entry (context preservation)
- Visual "Saving..." / "Saved" indicator in corner

#### 3. Preparing for Next Round (The Magic Moment)

**Goal:** Seamless context flow from previous rounds

**Flow:**
1. From dashboard or timeline → Click upcoming interview
2. **Interview detail view automatically shows:**
   - Current round details at top
   - Previous rounds in collapsible sections below
   - All company research and prep notes accessible
3. User reviews Round 1 notes, feedback, questions
4. Adds new prep notes for Round 2 in dedicated section (auto-saves)
5. Marks as "prepared" or sets reminder

**UX Considerations:**
- Previous round context is ALWAYS visible, never buried
- One-click expand/collapse for each previous round
- Company research notes persist across all rounds
- Timeline context: "3 days since Round 1" shown prominently

#### 4. Managing Technical Assessments

**Goal:** Track take-home projects without missing deadlines

**Flow:**
1. From application → "Add Assessment"
2. Assessment type, due date, instructions (text or file)
3. Assessment card shows:
   - Countdown to deadline (color-coded: green → yellow → red)
   - Status badge (Not Started → In Progress → Submitted)
   - Quick actions (mark submitted, add notes)
4. Submission tracking (GitHub link or file upload)
5. Notes auto-save while editing

**UX Considerations:**
- Deadline is ALWAYS visible (persistent countdown)
- Visual urgency increases as deadline approaches
- Submissions are immutable (logged for reference)

### Critical Interactions

**Auto-save for Content:**
- All rich text notes and preparation materials auto-save every 30 seconds
- Visual indicator when saving ("Saved" / "Saving..." in corner)
- Debounced saves (wait for 30s of inactivity to avoid excessive writes)
- Never lose work, even if browser crashes

**Inline Editing:**
- Click to edit fields directly (application title, status, etc.)
- Save on blur or Enter key
- Cancel on Escape
- Optimistic UI updates

**Status Pipeline Visualization:**
- Kanban-style or list view toggle
- Drag-drop to update status (if Kanban)
- Click status badge for quick dropdown update (if list)
- Filter by status with visual indicators

**Timeline/Calendar:**
- Chronological view of interviews and deadlines
- Today's date highlighted
- Click any item to view/edit details
- Color coding: interviews (blue), assessments (orange), follow-ups (gray)

**Search & Filter:**
- Global search across applications, companies, notes
- Filter by status, date range, company
- Saved filters for common views ("Active Applications", "This Month's Interviews")

### Responsive Behavior

**Desktop (1280px+):**
- Full sidebar navigation
- Multi-column layouts where appropriate
- Rich text editor with full toolbar
- Side-by-side views (application details + interview rounds)

**Tablet (768-1279px):**
- Collapsible sidebar or bottom nav
- Single column with sections
- Rich text with condensed toolbar
- Stack views vertically

**Mobile (320-767px):**
- Bottom navigation bar
- Simplified forms (fewer fields visible at once)
- Rich text with minimal toolbar (essential formatting only)
- Focus on read access and quick updates (full data entry better on desktop)

---

## Functional Requirements

_Note: These requirements define the MVP scope. Post-MVP features are listed separately in the Product Scope section._

### FR-1: Application Management

**FR-1.1: Create Application (Manual Entry)**
- User can create new application with required fields: company name, job title
- Optional fields: job description, requirements, application date, status
- Default status: "Saved"
- System assigns unique application ID
- Acceptance: Application appears in user's application list immediately

**FR-1.2: Create Application (URL Extraction)**
- User can paste job posting URL into URL field
- System extracts: job title, company name, job description, requirements
- Extraction timeout: 10 seconds maximum
- On failure: Show error, allow manual entry
- Support: LinkedIn, Indeed, Glassdoor, AngelList (minimum)
- Rate limit: 30 URLs per day per user
- Cache scraped data for 24 hours
- Acceptance: Extracted data auto-fills form fields within 10 seconds

**FR-1.3: View Applications**
- User can view all their applications in list/table format
- Display: company, job title, status, application date
- Support sorting by: date, company, status
- Support filtering by: status, date range
- Acceptance: All user's applications displayed with correct data

**FR-1.4: Update Application**
- User can edit any application field inline or via edit form
- Changes save immediately on blur/Enter (inline) or via Save button (form)
- Status updates via dropdown or drag-drop (Kanban view)
- Acceptance: Changes persist and reflect immediately in UI

**FR-1.5: Delete Application**
- User can soft-delete application
- Deleted applications hidden from default view
- Acceptance: Deleted application no longer appears in main list

**FR-1.6: Application Status Pipeline**
- Supported statuses: Saved → Applied → Interview → Offer → Rejected
- User can move applications between statuses
- Visual pipeline representation (Kanban board or status badges)
- Acceptance: Status changes reflect immediately, applications grouped correctly

**FR-1.7: Resume and Document Storage**
- User can upload resume/cover letter per application (PDF, DOCX, TXT)
- File size limit: 5MB per file
- Total storage limit: 100MB per user
- Files stored on ditto infrastructure (S3-compatible)
- User can download uploaded files
- User can replace/delete uploaded files
- Acceptance: Uploaded files accessible from any device, downloads correctly

### FR-2: Interview Management (Core Differentiator)

**FR-2.1: Create Interview Round**
- User can add interview round to an application
- Required fields: round number, date/time, interview type
- Interview types: Phone Screen, Technical, Behavioral, Panel, On-site, Other
- Round number auto-increments (Round 1, 2, 3...)
- Default date: today
- Acceptance: Interview created and linked to application

**FR-2.2: Structured Interview Data Capture**
- User can record for each interview:
  - Interviewer names and roles (list, add/remove)
  - Interview duration
  - Questions asked (list format, add/remove items)
  - User's answers (rich text)
  - Performance self-assessment (rich text)
  - Feedback received (rich text)
  - Interview outcome/next steps (text)
- All fields optional (flexible capture)
- Auto-save every 30 seconds for text fields
- Acceptance: Data persists correctly, retrievable on reload

**FR-2.3: Interview Preparation Area**
- User can add preparation materials per interview:
  - Company research notes (rich text)
  - Practice answers (rich text)
  - Relevant links (URL list)
  - Document uploads (prep materials, job descriptions)
- Prep area accessible when creating interview and during updates
- Auto-save for all text content
- Acceptance: Prep materials accessible when viewing interview

**FR-2.4: Multi-Round Context Display**
- When viewing an interview, display all previous rounds for that application
- Previous rounds shown in collapsible sections below current round
- User can expand/collapse each previous round
- Display timeline: days/hours between rounds
- Acceptance: All rounds visible on single page, easy navigation between rounds

**FR-2.5: View Interviews**
- User can view all interviews for an application in chronological order
- User can view all upcoming interviews across applications (timeline view)
- Display: round number, type, date, interviewer names
- Click to view full interview details
- Acceptance: Interviews displayed correctly, navigation works

**FR-2.6: Update Interview**
- User can edit any interview field
- Auto-save for rich text content (30s debounce)
- Manual save for structured fields (date, type, etc.)
- Acceptance: Changes persist correctly

**FR-2.7: Delete Interview**
- User can soft-delete interview round
- Confirmation required before deletion
- Acceptance: Interview removed from display

### FR-3: Technical Assessment Tracking

**FR-3.1: Create Assessment**
- User can add technical assessment to an application
- Required fields: assessment type, due date
- Assessment types: Take-home Project, Live Coding, System Design, Data Structures, Case Study, Other
- Optional fields: instructions (rich text or file upload), requirements
- Acceptance: Assessment created and linked to application

**FR-3.2: Assessment Status Management**
- Supported statuses: Not Started → In Progress → Submitted → Reviewed
- User can update status via dropdown
- Status badge displays current state
- Acceptance: Status updates persist and display correctly

**FR-3.3: Deadline Tracking**
- Display countdown to due date (days/hours remaining)
- Visual urgency: green (>3 days), yellow (1-3 days), red (<1 day or overdue)
- Sort assessments by deadline
- Acceptance: Countdown accurate, color coding correct

**FR-3.4: Submission Tracking**
- User can record submission details:
  - GitHub repository link
  - File upload (submitted work)
  - Submission notes (rich text)
  - Submission timestamp (auto-recorded)
- Acceptance: Submission data persists, timestamp accurate

**FR-3.5: Assessment Notes**
- User can add notes during assessment (approach, challenges, learnings)
- Rich text editor with auto-save
- Notes accessible from assessment detail view
- Acceptance: Notes persist correctly

**FR-3.6: View Assessments**
- User can view all assessments for an application
- User can view all upcoming assessments across applications (timeline)
- Display: type, due date, status, countdown
- Acceptance: Assessments displayed with correct data

**FR-3.7: Update/Delete Assessment**
- User can edit assessment details
- User can soft-delete assessment
- Acceptance: Updates persist, deletions work correctly

### FR-4: Dashboard & Timeline

**FR-4.1: Dashboard Overview**
- Display application statistics by status (count per status)
- Display upcoming items at-a-glance (next 5 interviews/assessments)
- Quick action buttons: Add Application, Log Interview
- Acceptance: Dashboard loads within 2 seconds, data accurate

**FR-4.2: Timeline/Calendar View**
- Display all upcoming interviews and assessment deadlines chronologically
- Filter by: Today, This Week, This Month, All Upcoming
- Color coding: Interviews (blue), Assessments (orange)
- Click any item to view/edit details
- Highlight overdue items in red
- Acceptance: All future events displayed in correct order, filters work

### FR-5: Search & Filtering

**FR-5.1: Global Search**
- User can search across: applications, companies, job titles, interview notes
- Search by keyword (minimum 3 characters)
- Results grouped by type (applications, interviews, assessments)
- Click result to navigate to detail
- Acceptance: Search returns relevant results within 1 second

**FR-5.2: Application Filtering**
- Filter applications by: status, date range
- Multiple filters combinable (AND logic)
- Clear filters option
- Acceptance: Filters work correctly, results accurate

### FR-6: User Account & Data Management

**FR-6.1: User Authentication** (Existing - Already Implemented)
- User can register with email/password
- User can register via OAuth: GitHub, Google
- User can login with email/password or OAuth
- JWT token-based authentication with refresh tokens
- User can logout
- Acceptance: Auth flows work correctly

**FR-6.2: User Profile**
- User can view/edit profile: name, email
- User can change password (if email/password account)
- Acceptance: Profile updates persist

**FR-6.3: Session Management** (Existing - Already Implemented)
- Sessions persist across browser tabs
- Auto-refresh tokens before expiration
- Redirect to login on session expiration
- Acceptance: Sessions work seamlessly

**FR-6.4: Cross-Device Data Sync**
- All user data accessible from any device after login
- Changes on one device reflect on other devices (after reload/refetch)
- Acceptance: Data consistent across devices

**FR-6.5: Auto-Save**
- Rich text content auto-saves every 30 seconds (debounced)
- Visual indicator: "Saving..." → "Saved"
- Auto-save applies to: interview notes, prep materials, assessment notes, company research
- Only saves if content changed (no unnecessary writes)
- Acceptance: Content never lost, saves work correctly

---

## Non-Functional Requirements

_These requirements define quality attributes for the MVP._

### NFR-1: Performance

**NFR-1.1: Page Load Time**
- Dashboard and main views load within 2 seconds on standard broadband (10 Mbps+)
- Initial page load (with auth check) completes within 3 seconds
- Rationale: Users should not wait to access their job search data

**NFR-1.2: API Response Time**
- 90% of API requests respond within 500ms
- 99% of API requests respond within 2 seconds
- Rationale: Maintain responsive UI, prevent user frustration

**NFR-1.3: Auto-Save Performance**
- Auto-save triggers max every 30 seconds (debounced)
- Auto-save completes within 1 second (non-blocking to user)
- UI indicator shows save state clearly
- Rationale: Protect user data without impacting typing experience

**NFR-1.4: Search Performance**
- Search results return within 1 second for datasets up to 1000 applications
- Rationale: Instant search feedback expected by users

**NFR-1.5: File Upload Performance**
- Files up to 5MB upload within 10 seconds on standard broadband
- Progress indicator shown during upload
- Rationale: Resume uploads should be quick and provide feedback

### NFR-2: Security

**NFR-2.1: Authentication Security**
- JWT tokens expire after 24 hours
- Refresh tokens rotate on each use
- Passwords hashed with bcrypt (cost factor 10+)
- OAuth flows follow industry standards (OpenID Connect)
- Rationale: Protect user accounts from unauthorized access

**NFR-2.2: Data Privacy**
- All API calls over HTTPS only (TLS 1.2+)
- No unencrypted transmission of credentials or tokens
- User data isolated per account (no cross-user data leakage)
- Rationale: Job search data is sensitive; must be private

**NFR-2.3: Input Validation & Sanitization**
- All user input validated on client and server
- Rich text content sanitized to prevent XSS attacks
- SQL injection prevention via parameterized queries
- File uploads validated for type and size
- Rationale: Prevent common web vulnerabilities

**NFR-2.4: Session Security**
- Logout clears all tokens (client and server)
- Session timeout after 24 hours of inactivity
- CSRF protection on state-changing operations
- Rationale: Prevent session hijacking and unauthorized actions

**NFR-2.5: File Storage Security**
- Uploaded files accessible only by file owner
- Unique file identifiers prevent guessing URLs
- File downloads require authentication
- Rationale: Resume/documents contain PII and must be protected

### NFR-3: Reliability

**NFR-3.1: Availability**
- Target: 99% uptime for MVP (allows ~7 hours downtime/month)
- Planned maintenance communicated in advance
- Rationale: Personal use tool, not mission-critical 24/7 service

**NFR-3.2: Data Durability**
- Zero acceptable data loss for committed writes
- Database backups daily (retained 7 days minimum)
- File storage (S3) has 99.99% durability built-in
- Rationale: User's job search data is irreplaceable

**NFR-3.3: Error Handling**
- All errors logged server-side for debugging
- User-friendly error messages (no stack traces shown)
- Graceful degradation when services unavailable
- Rationale: Errors will happen; handle them gracefully

**NFR-3.4: Auto-Save Reliability**
- Auto-save failures retry once automatically
- User notified if save fails after retry
- Unsaved changes preserved in local storage as backup
- Rationale: Auto-save is critical feature; must be reliable

### NFR-4: Usability

**NFR-4.1: Browser Compatibility**
- Full support for Chrome/Edge (Chromium) latest 2 versions
- Full support for Firefox latest 2 versions
- Full support for Safari latest 2 versions
- Graceful degradation for older browsers (warning shown)
- Rationale: Cover 95%+ of users with modern browsers

**NFR-4.2: Responsive Design**
- Functional on screen widths from 320px (mobile) to 3840px (4K desktop)
- Touch targets minimum 44x44px on mobile (WCAG AA)
- Text readable without horizontal scrolling
- Rationale: Users access from multiple devices

**NFR-4.3: Accessibility (Basic)**
- Semantic HTML for screen reader compatibility
- Keyboard navigation for all interactive elements
- Color contrast meets WCAG AA standards (4.5:1 for text)
- Form labels and error messages properly associated
- Rationale: Basic accessibility benefits all users, required for professional tool

**NFR-4.4: Visual Feedback**
- Loading states shown for operations >500ms
- Success/error feedback for user actions (toast notifications)
- Auto-save indicator always visible
- Disabled state clear for unavailable actions
- Rationale: Users should always know system state

### NFR-5: Maintainability

**NFR-5.1: Code Quality**
- Backend: Go with standard formatting (gofmt), linting (golangci-lint)
- Frontend: TypeScript with strict mode, ESLint, Prettier
- No critical security vulnerabilities in dependencies
- Rationale: Clean code easier to maintain and debug

**NFR-5.2: Documentation**
- API endpoints documented (request/response schemas)
- Database schema documented
- README with setup instructions
- Rationale: Enable future development and onboarding

**NFR-5.3: Testing**
- Backend: Unit tests for repository layer (>70% coverage goal)
- Backend: Integration tests for critical endpoints
- Frontend: Component tests for key user flows
- Rationale: Tests prevent regressions, enable confident changes

### NFR-6: Scalability (MVP Constraints)

**NFR-6.1: Single-User Performance**
- System handles 1 user with 1000+ applications without degradation
- Database queries optimized with indexes
- Rationale: Build for personal use now, scale later if needed

**NFR-6.2: Concurrent Users**
- Support 10-50 concurrent users (MVP estimate)
- No optimization for thousands of users required yet
- Rationale: Initial rollout limited; premature optimization avoided

**NFR-6.3: Data Volume**
- System handles 100MB files per user
- No limits on number of applications/interviews per user
- Database queries remain performant with expected data volumes
- Rationale: Personal use won't hit extreme scale

### NFR-7: Deployment & Operations

**NFR-7.1: Deployment**
- Docker Compose setup for easy deployment
- Environment variables for configuration (no hardcoded secrets)
- Single-command deployment process
- Rationale: Simple deployment for MVP, iterate on infrastructure later

**NFR-7.2: Monitoring (Basic)**
- Server logs collected and searchable
- Database connection health checks
- API error rates tracked
- Rationale: Minimal monitoring to debug issues

**NFR-7.3: Backup & Recovery**
- Automated daily database backups
- File storage backups via S3 versioning
- Recovery tested quarterly
- Rationale: Protect against data loss

### NFR-8: Browser & Device Support Matrix

| Device Type | Primary Support | Notes |
|-------------|----------------|-------|
| Desktop (1280px+) | ✅ Full | Primary development target |
| Tablet (768-1279px) | ✅ Full | Responsive layout |
| Mobile (320-767px) | ⚠️ Core features | Simplified UI, read-focused |
| Chrome/Edge | ✅ Latest 2 | Primary browsers |
| Firefox | ✅ Latest 2 | Full support |
| Safari | ✅ Latest 2 | Full support |
| Mobile Safari (iOS) | ⚠️ Core features | Touch-optimized |
| Chrome Mobile (Android) | ⚠️ Core features | Touch-optimized |

---

## Implementation Planning

### Epic Breakdown Required

This PRD defines the complete MVP scope. The next step is to decompose these requirements into implementable epics and stories sized for development agents with 200k context limits.

**Recommended Next Steps:**

1. **Epic & Story Breakdown** - Run: `/bmad:bmm:workflows:create-epics-and-stories`
   - Break down functional requirements into themed epics
   - Create bite-sized stories per epic (testable, implementable units)
   - Establish dependencies and sequencing

2. **Architecture Document** - Run: `/bmad:bmm:workflows:create-architecture`
   - Define technical architecture for new features (interviews, assessments)
   - Document integration with existing brownfield system
   - Make key technical decisions (rich text editor, file storage, etc.)

3. **Solutioning Gate Check** - Run: `/bmad:bmm:workflows:solutioning-gate-check`
   - Validate PRD + Architecture alignment
   - Ensure no gaps or contradictions before implementation

4. **Sprint Planning** - Run: `/bmad:bmm:workflows:sprint-planning`
   - Create sprint plan from stories
   - Begin implementation phase

---

## References

### Input Documents

- **Product Brief**: docs/product-brief-ditto-2025-11-08.md
- **Brownfield Documentation**: docs/index.md (complete project documentation)
  - Backend Architecture: docs/architecture-backend.md
  - Frontend Architecture: docs/architecture-frontend.md
  - Integration Architecture: docs/integration-architecture.md
  - API Contracts: docs/api-contracts-backend.md
  - Database Schema: docs/database-schema.md

### Market Context

**Competitive Landscape:**
- Huntr (400k+ users) - Visual Kanban, basic interview scheduling only
- Teal - LinkedIn integration, limited interview depth
- Simplify - Fast autofill, minimal interview features
- Careerflow - Custom labels, surface-level interviews

**Market Gap:**
Despite 50%+ of job seekers using spreadsheets for interview management, no existing tool provides comprehensive interview lifecycle management. All competitors answer "when is your interview?" but not "what happened?" or "how to prepare for next round?"

---

## Technical Foundation (Existing Infrastructure)

### Backend (Go + PostgreSQL)
- **Stack**: Go 1.23, Gin framework, PostgreSQL 15
- **Architecture**: Layered (Handler → Repository → Database)
- **Auth**: JWT + refresh tokens, OAuth (GitHub, Google)
- **API**: 30+ RESTful endpoints already implemented
- **Database**: 11 tables with soft deletes, auto-timestamps
- **Deployment**: Docker Compose ready

### Frontend (Next.js + React)
- **Stack**: Next.js 14, React 18, TypeScript
- **UI**: shadcn/ui (15 components), Tailwind CSS
- **Auth**: NextAuth v5 integrated
- **Components**: Navbar, Sidebar, JobTable, ApplicationTable

### What Needs to Be Built
This PRD focuses on completing the MVP by adding:
- Deep interview management (database tables, API endpoints, UI)
- Technical assessment tracking (database tables, API endpoints, UI)
- Rich text editing capabilities
- File upload system for documents
- Dashboard and timeline views
- Auto-save functionality
- URL extraction for job postings

---

## Success Metrics Recap

**Primary Success**: Simon completes entire job search workflow in ditto without external tools

**Key Indicators**:
- ✅ Zero use of Excel/Notion for interview content
- ✅ All interview prep, questions, feedback in ditto
- ✅ Seamless Round 1 → Round 2 context flow
- ✅ No missed deadlines or forgotten interview details
- ✅ Ditto is ONLY tool opened for job search activities

---

## Product Magic Summary

**The essence of ditto**: When preparing for Round 2, you open ditto and instantly see your Round 1 notes - questions asked, how you answered, interviewer feedback, company research - all in context. No searching through Notion, no Excel tabs, no "where did I put that?" Everything flows seamlessly from one interview round to the next.

This is the magic that existing job trackers completely miss. They track *when* interviews happen, but not *what* happens in them. Ditto is the first platform where interview content management is as robust as application tracking.

---

_This PRD was created through collaborative discovery between Simon and the BMad Product Manager agent, based on real pain points experienced during active job searching. It captures both the strategic vision and tactical requirements needed to build ditto's MVP._

**Document Status**: Ready for epic breakdown and architecture design
**Next Workflow**: `/bmad:bmm:workflows:create-epics-and-stories` or `/bmad:bmm:workflows:create-architecture`
