# Epic Technical Specification: Deep Interview Management

Date: 2026-01-25
Author: Simon
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 delivers the core differentiator of ditto: comprehensive interview lifecycle management. While competitors track *when* interviews happen, ditto tracks *what* happens in them and *how* to prepare for the next round. This epic enables users to capture interview details (interviewers, questions, answers, feedback), maintain rich text preparation notes with auto-save, and seamlessly access context from previous rounds when preparing for subsequent interviews.

The "magic moment" is when preparing for Round 2: users open ditto and instantly see Round 1 notes - questions asked, how they answered, interviewer feedback, company research - all in context, ready to inform the next conversation. This eliminates the "Excel + Notion" fragmentation that plagues existing job search workflows.

This epic builds on Epic 1's file storage infrastructure (Story 2.8 reuses S3 upload patterns) and establishes foundational UI patterns (rich text editing, auto-save) that Epic 3 (Technical Assessment Tracking) will reuse.

## Objectives and Scope

**In Scope:**
- Database schema for interviews, interviewers, questions, and notes (4 new tables)
- Full CRUD API for interview management with round auto-increment
- Interview creation form with quick capture UX (minimal friction)
- Interview detail view with structured data sections (interviewers, questions, feedback)
- Rich text editor (TipTap) for preparation notes with auto-save (30s debounce)
- Multi-round context sidebar showing previous rounds on current interview page
- File uploads for interview prep documents (leveraging Epic 1 infrastructure)
- Interview list/timeline view with upcoming interviews across applications
- Performance self-assessment section (optional, self-reflection)

**Out of Scope (Post-MVP):**
- Calendar sync (Google Calendar, Outlook)
- AI-powered interview preparation suggestions
- Mock interview practice
- Video recording of practice sessions
- Interview analytics and pattern recognition
- Collaborative interview prep (sharing with mentors)

**Success Metrics:**
- Interview context accessible in <2 clicks from any point
- Previous rounds visible when editing current round (zero navigation)
- Auto-save triggers every 30s with visual feedback
- All 12 stories deliver testable, demonstrable functionality

## System Architecture Alignment

This epic implements the **Multi-Round Interview Context Pattern** defined in the architecture document (ADR-004), which is ditto's core differentiator.

**Backend (Go 1.23 + Gin):**
- New handlers: `interview.go`, `interviewer.go`, `interview_question.go`, `interview_note.go`
- New services: `sanitizer_service.go` (bluemonday HTML sanitization)
- New repositories: `interview_repository.go`, `interviewer_repository.go`, `interview_question_repository.go`, `interview_note_repository.go`
- New migration: `000005_create_interview_system.up.sql` (4 tables)
- Enhanced handler: `file.go` - Add `interview_id` support

**Frontend (Next.js 14 + React + shadcn/ui):**
- New pages: `app/(app)/interviews/page.tsx`, `app/(app)/interviews/[id]/page.tsx`
- New components:
  - `InterviewForm.tsx` - Quick capture form
  - `InterviewDetail.tsx` - Main detail view with context sidebar
  - `InterviewerList.tsx` - Add/edit/remove interviewers
  - `QuestionsList.tsx` - Dynamic Q&A list with reordering
  - `RichTextEditor.tsx` - TipTap wrapper with auto-save
  - `PreviousRoundsPanel.tsx` - Context sidebar (read-only)
  - `AutoSaveIndicator.tsx` - Visual save status
- New hooks: `useAutoSave.ts` (30s debounced save)
- New service: `interviewService.ts`

**Database (PostgreSQL 15):**
- `interviews` - Core interview records with round_number, type, date/time
- `interviewers` - Names and roles linked to interviews
- `interview_questions` - Questions asked with user's answers
- `interview_notes` - Rich text notes by type (prep, research, feedback, reflection)

**Architectural Constraints:**
- Follow existing repository pattern (consistent with Epic 1)
- Use existing auth middleware (JWT validation)
- Use existing error format: `{error, code, details}`
- Implement soft deletes (`deleted_at` column)
- HTML sanitization on both backend (bluemonday) and frontend (DOMPurify)
- Auto-save debounced at 30 seconds per PRD requirement

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|---------------|----------------|--------|---------|-------|
| **Interview Handler** | CRUD operations for interviews | Interview data, user context | Interview records | Backend |
| **Interviewer Handler** | Manage interviewers per interview | Interviewer data | Interviewer records | Backend |
| **Question Handler** | Manage Q&A with ordering | Questions, answers, order | Question records | Backend |
| **Note Handler** | Rich text notes CRUD with sanitization | Note type, HTML content | Sanitized note records | Backend |
| **Sanitizer Service** | Sanitize HTML on write (XSS prevention) | Raw HTML | Safe HTML | Backend |
| **Interview Repository** | Database operations for interviews | SQL queries | Interview entities | Backend |
| **RichTextEditor** | TipTap wrapper with formatting toolbar | User input | HTML content | Frontend |
| **useAutoSave Hook** | Debounced auto-save with status tracking | Data, save function | Save status | Frontend |
| **InterviewDetail** | Main view with context sidebar | Interview ID | Full interview UI | Frontend |
| **PreviousRoundsPanel** | Read-only previous rounds display | Application interviews | Collapsible panels | Frontend |

### Data Models and Contracts

#### Interview Entity (`interviews` table)

```sql
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    interview_type VARCHAR(50) NOT NULL, -- phone_screen, technical, behavioral, panel, onsite, other
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    duration_minutes INT,
    outcome TEXT,
    overall_feeling VARCHAR(20), -- excellent, good, okay, poor (self-assessment)
    went_well TEXT, -- self-assessment
    could_improve TEXT, -- self-assessment
    confidence_level INT CHECK (confidence_level BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_interviews_user_id ON interviews(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interviews_application_id ON interviews(application_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interviews_scheduled_date ON interviews(scheduled_date) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_interviews_unique_round ON interviews(application_id, round_number) WHERE deleted_at IS NULL;
```

#### Interviewer Entity (`interviewers` table)

```sql
CREATE TABLE interviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_interviewers_interview_id ON interviewers(interview_id) WHERE deleted_at IS NULL;
```

#### Question Entity (`interview_questions` table)

```sql
CREATE TABLE interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    "order" INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_interview_questions_interview_id ON interview_questions(interview_id) WHERE deleted_at IS NULL;
```

#### Note Entity (`interview_notes` table)

```sql
CREATE TABLE interview_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL, -- preparation, company_research, feedback, reflection, general
    content TEXT, -- Sanitized HTML (max 50KB)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_interview_notes_interview_id ON interview_notes(interview_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_interview_notes_unique_type ON interview_notes(interview_id, note_type) WHERE deleted_at IS NULL;
```

#### TypeScript Types (Frontend)

```typescript
// Interview type enum
type InterviewType = 'phone_screen' | 'technical' | 'behavioral' | 'panel' | 'onsite' | 'other';

// Note type enum
type NoteType = 'preparation' | 'company_research' | 'feedback' | 'reflection' | 'general';

// Self-assessment feeling
type OverallFeeling = 'excellent' | 'good' | 'okay' | 'poor';

// Core interview interface
interface Interview {
  id: string;
  user_id: string;
  application_id: string;
  round_number: number;
  interview_type: InterviewType;
  scheduled_date: string; // ISO 8601 date
  scheduled_time?: string; // HH:MM format
  duration_minutes?: number;
  outcome?: string;
  overall_feeling?: OverallFeeling;
  went_well?: string;
  could_improve?: string;
  confidence_level?: number; // 1-5
  created_at: string;
  updated_at: string;
}

interface Interviewer {
  id: string;
  interview_id: string;
  name: string;
  role?: string;
}

interface InterviewQuestion {
  id: string;
  interview_id: string;
  question_text: string;
  answer_text?: string;
  order: number;
}

interface InterviewNote {
  id: string;
  interview_id: string;
  note_type: NoteType;
  content?: string; // Sanitized HTML
}

// Full interview with relations (for detail view)
interface InterviewWithDetails extends Interview {
  interviewers: Interviewer[];
  questions: InterviewQuestion[];
  notes: InterviewNote[];
}

// Context response for multi-round view
interface InterviewWithContext {
  current_interview: InterviewWithDetails;
  previous_rounds: PreviousRoundSummary[];
  company_research?: string; // Application-level research note
  application: {
    company_name: string;
    job_title: string;
  };
}

interface PreviousRoundSummary {
  id: string;
  round_number: number;
  interview_type: InterviewType;
  scheduled_date: string;
  interviewers: string[]; // Names only
  questions_preview: string[]; // First 3 questions
  feedback_summary?: string; // First 100 chars of feedback note
  question_count: number;
}
```

### APIs and Interfaces

#### Interview CRUD Endpoints

```
POST   /api/interviews
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request:
{
  "application_id": "uuid",
  "interview_type": "technical",
  "scheduled_date": "2026-02-01",
  "scheduled_time": "14:00",
  "duration_minutes": 60
}

Response (201 Created):
{
  "id": "uuid",
  "application_id": "uuid",
  "round_number": 2,  // Auto-incremented
  "interview_type": "technical",
  "scheduled_date": "2026-02-01",
  "scheduled_time": "14:00",
  "duration_minutes": 60,
  "created_at": "2026-01-25T10:30:00Z",
  "updated_at": "2026-01-25T10:30:00Z"
}

Error Responses:
- 400: Missing required fields (application_id, interview_type, scheduled_date)
- 403: Application belongs to another user
- 404: Application not found
```

```
GET    /api/interviews
Authorization: Bearer {jwt_token}

Query Params:
- application_id: UUID (filter by application)
- upcoming: boolean (only future interviews)
- page: int (default: 1)
- limit: int (default: 20, max: 100)

Response (200 OK):
{
  "interviews": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total_items": 45,
    "total_pages": 3
  }
}
```

```
GET    /api/interviews/:id
Authorization: Bearer {jwt_token}

Response (200 OK):
{
  "id": "uuid",
  "application_id": "uuid",
  "round_number": 2,
  "interview_type": "technical",
  "scheduled_date": "2026-02-01",
  "scheduled_time": "14:00",
  "duration_minutes": 60,
  "outcome": "Positive, moving to final round",
  "interviewers": [
    {"id": "uuid", "name": "Alice Smith", "role": "Engineering Manager"}
  ],
  "questions": [
    {"id": "uuid", "question_text": "Describe your experience with...", "answer_text": "I have...", "order": 1}
  ],
  "notes": [
    {"id": "uuid", "note_type": "preparation", "content": "<p>...</p>"}
  ],
  "created_at": "2026-01-25T10:30:00Z",
  "updated_at": "2026-01-25T10:30:00Z"
}
```

```
GET    /api/interviews/:id/with-context
Authorization: Bearer {jwt_token}

Response (200 OK):
{
  "current_interview": { ... full interview with details ... },
  "previous_rounds": [
    {
      "id": "uuid",
      "round_number": 1,
      "interview_type": "phone_screen",
      "scheduled_date": "2026-01-20",
      "interviewers": ["Bob Johnson (Recruiter)"],
      "questions_preview": ["Tell me about yourself", "Why this company?"],
      "feedback_summary": "Strong communication skills...",
      "question_count": 5
    }
  ],
  "company_research": "<p>Company mission and culture notes...</p>",
  "application": {
    "company_name": "Acme Corp",
    "job_title": "Senior Engineer"
  }
}
```

```
PUT    /api/interviews/:id
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request (partial update allowed):
{
  "scheduled_date": "2026-02-02",
  "outcome": "Received offer!",
  "overall_feeling": "excellent",
  "confidence_level": 5
}

Response (200 OK):
{ ... updated interview ... }
```

```
DELETE /api/interviews/:id
Authorization: Bearer {jwt_token}

Response (204 No Content)

Note: Soft deletes interview and cascades to interviewers, questions, notes
```

#### Interviewer Endpoints

```
POST   /api/interviews/:id/interviewers
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request:
{
  "name": "Alice Smith",
  "role": "Engineering Manager"
}

Response (201 Created):
{
  "id": "uuid",
  "interview_id": "uuid",
  "name": "Alice Smith",
  "role": "Engineering Manager",
  "created_at": "2026-01-25T10:30:00Z"
}
```

```
PUT    /api/interviewers/:id
DELETE /api/interviewers/:id
```

#### Question Endpoints

```
POST   /api/interviews/:id/questions
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request:
{
  "question_text": "Describe a challenging project...",
  "answer_text": "In my previous role...",
  "order": 1
}

Response (201 Created):
{ ... question record ... }
```

```
PUT    /api/interview-questions/:id
DELETE /api/interview-questions/:id
PATCH  /api/interviews/:id/questions/reorder
  Request: { "question_ids": ["uuid1", "uuid2", "uuid3"] }
```

#### Note Endpoints

```
POST   /api/interviews/:id/notes
PUT    /api/interview-notes/:id
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request:
{
  "note_type": "preparation",
  "content": "<p>Key topics to review:</p><ul><li>System design</li></ul>"
}

Response (200 OK or 201 Created):
{
  "id": "uuid",
  "interview_id": "uuid",
  "note_type": "preparation",
  "content": "<p>Key topics to review:</p><ul><li>System design</li></ul>",
  "updated_at": "2026-01-25T10:30:00Z"
}

Note: Content is sanitized with bluemonday on write
Max size: 50KB per note
```

### Workflows and Sequencing

#### Story 2.1-2.3: Create Interview Round

```
User → Frontend: Clicks "Add Interview Round" on application detail page
Frontend → User: Opens InterviewForm modal
  - Round number shown (auto-calculated, read-only)
  - Interview type dropdown (default: phone_screen)
  - Date picker (default: today)
  - Time picker (optional)
  - Duration input (optional)

User → Frontend: Fills required fields + clicks "Create"
Frontend → Backend: POST /api/interviews {application_id, type, date, time}
Backend → Backend: Calculate round_number = MAX(round_number) + 1 for application
Backend → Database: INSERT INTO interviews
Backend → Frontend: 201 Created {interview with round_number}
Frontend → User: Success toast + navigate to interview detail page
```

#### Story 2.4-2.7: Interview Detail with Rich Text

```
User → Frontend: Opens interview detail page (/interviews/:id)
Frontend → Backend: GET /api/interviews/:id/with-context
Backend → Database: Fetch interview + interviewers + questions + notes
Backend → Database: Fetch all interviews for same application (previous rounds)
Backend → Database: Fetch application company_research note (if exists)
Backend → Frontend: Full InterviewWithContext response

Frontend → User: Renders 70/30 layout
  - LEFT (70%): Editable sections (interviewers, questions, notes)
  - RIGHT (30%): Context sidebar (previous rounds, company research)

User → Frontend: Types in preparation notes
Frontend → Frontend: useAutoSave triggers after 30s inactivity
Frontend → Backend: PUT /api/interview-notes/:id {content: sanitized HTML}
Backend → Backend: Sanitize HTML with bluemonday
Backend → Database: UPDATE interview_notes
Backend → Frontend: 200 OK
Frontend → User: AutoSaveIndicator shows "Saved ✓"
```

#### Story 2.9: Multi-Round Context Display

```
When user views interview detail for Round 2+:

Frontend: Renders PreviousRoundsPanel in right sidebar
  - Each previous round is a collapsible section
  - Default: collapsed (show summary only)
  - Expand: shows questions, feedback preview
  - "View Full Details" link → navigates to that round's page

Data flow:
  - All previous rounds data loaded in single /with-context call
  - No additional API calls when expanding
  - Read-only (cannot edit previous rounds from current view)

Visual hierarchy:
  - Current round: Full editing controls
  - Previous rounds: Collapsed summaries
  - Company research: Accessible from all rounds
  - Timeline indicator: "5 days after Round 1"
```

## Non-Functional Requirements

### Performance

**NFR-2.1: Page Load Time**
- Interview detail page with context loads in <2 seconds
- Single API call (`/with-context`) returns all needed data
- Rationale: Users expect instant access to interview prep materials

**NFR-2.2: Auto-Save Performance**
- Auto-save triggers after 30 seconds of inactivity (debounced)
- Save operation completes in <1 second (non-blocking)
- UI indicator shows save status clearly: "Saving..." → "Saved ✓"
- Rationale: Protect user's work without interrupting typing

**NFR-2.3: Rich Text Editor Performance**
- TipTap editor initializes in <500ms
- No typing lag for documents up to 50KB
- Lazy-loaded to avoid blocking initial page render
- Rationale: Editor must feel responsive like Google Docs

**Epic 2 Specific Targets:**
- Interview list loads in <1 second for 100+ interviews
- Context sidebar renders without layout shift
- Question reordering updates immediately (optimistic UI)

### Security

**NFR-2.4: XSS Prevention**
- All rich text content sanitized on backend (bluemonday)
- Frontend sanitizes before render (DOMPurify, defense in depth)
- Allowed HTML: p, br, strong, em, ul, ol, li, h1-h6, a (href only), blockquote
- Stripped: script, iframe, style, event handlers
- Rationale: User-generated HTML content is high-risk for XSS

**NFR-2.5: Authorization**
- All interview endpoints validate user_id from JWT
- Cannot view/edit interviews belonging to other users
- Application ownership verified on interview creation
- Rationale: Interview notes are sensitive personal data

**Epic 2 Specific Security:**
- Rich text content size limited to 50KB per note (prevent storage abuse)
- HTML sanitization logged for audit (content before/after if differs)
- Interviewer names not indexed for search (privacy)

### Reliability/Availability

**NFR-2.6: Data Durability**
- Auto-save prevents data loss during browser crashes
- Offline: Content preserved in local state until reconnection
- Failed saves retry automatically with exponential backoff
- Rationale: Interview notes are irreplaceable user work

**NFR-2.7: Soft Deletes**
- All entities use soft delete (`deleted_at` column)
- Cascade: Deleting interview soft-deletes related interviewers, questions, notes
- Recovery possible within 30 days (manual database query)
- Rationale: Prevent accidental permanent data loss

### Observability

**Logging Requirements:**
- Log interview CRUD operations (user_id, interview_id, action)
- Log auto-save events (success/failure, content size)
- Log HTML sanitization (if content modified)
- Log context sidebar load times (performance monitoring)

**Metrics to Track:**
- Interviews created per day
- Average questions per interview
- Auto-save success rate
- Rich text editor errors (render failures, sanitization issues)
- Context load time (p50, p95, p99)

**Tracing:**
- Trace interview detail flow: API call → database queries → response assembly
- Trace auto-save flow: debounce → API call → sanitization → database write

## Dependencies and Integrations

### Backend Dependencies

**From `backend/go.mod` (existing + new):**
```go
require (
    github.com/gin-gonic/gin v1.10.0        // Existing: Web framework
    gorm.io/gorm v1.25.7                    // Existing: ORM
    github.com/google/uuid v1.6.0           // Existing: UUID generation
    github.com/microcosm-cc/bluemonday v1.0.27 // New: HTML sanitization
)
```

**New Dependency:**
- `bluemonday`: Industry-standard HTML sanitizer for Go, prevents XSS attacks

### Frontend Dependencies

**From `frontend/package.json` (existing + new):**
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "axios": "^1.7.0",
    "@tiptap/react": "^3.0.0",           // New: Rich text editor core
    "@tiptap/starter-kit": "^3.0.0",     // New: Basic formatting extensions
    "@tiptap/extension-link": "^3.0.0",  // New: Link support
    "@tiptap/extension-placeholder": "^3.0.0", // New: Placeholder text
    "dompurify": "^3.3.0",               // New: Frontend HTML sanitization
    "date-fns": "^4.1.0"                 // Existing (from Epic 1): Date formatting
  }
}
```

**New Dependencies:**
- `@tiptap/*`: Headless rich text editor, customizable for shadcn/ui integration
- `dompurify`: Client-side HTML sanitization (defense in depth)

### Epic 1 Dependencies

Epic 2 builds on Epic 1 infrastructure:
- **Story 2.8 (File Uploads):** Reuses S3 upload flow from Story 1.2/1.4
- **Files table:** Already supports `interview_id` foreign key
- **File service:** Existing `fileService.ts` extended for interview context

### Environment Variables

No new environment variables required. Epic 2 uses:
- Existing database connection (PostgreSQL)
- Existing JWT authentication
- Existing S3 configuration (for Story 2.8 file uploads)

## Acceptance Criteria (Authoritative)

**AC-2.1: Create Interview Round**
- Given an application exists
- When user creates interview with type and date
- Then interview is saved with auto-incremented round_number

**AC-2.2: View Interview List**
- Given user has interviews scheduled
- When viewing interview list
- Then all interviews shown with company, round, type, date, countdown

**AC-2.3: Interview Quick Capture**
- Given user clicks "Add Interview"
- When filling minimal fields (type, date)
- Then interview created with defaults, navigates to detail page

**AC-2.4: Interview Detail View**
- Given interview exists
- When viewing detail page
- Then sections displayed: header, interviewers, questions, notes, assessment

**AC-2.5: Add Interviewers**
- Given viewing interview detail
- When adding interviewer with name and role
- Then interviewer saved and appears in list

**AC-2.6: Add Questions/Answers**
- Given viewing interview detail
- When adding question with answer
- Then Q&A saved and numbered (Q1, Q2, Q3...)

**AC-2.7: Rich Text Notes**
- Given viewing interview detail
- When typing in preparation notes
- Then formatting available (bold, italic, lists, links)

**AC-2.8: Auto-Save**
- Given editing any text content
- When 30 seconds pass without typing
- Then content auto-saves with visual indicator

**AC-2.9: Multi-Round Context**
- Given interview is Round 2+
- When viewing detail page
- Then previous rounds visible in sidebar (collapsible)

**AC-2.10: File Upload**
- Given viewing interview detail
- When uploading prep document
- Then file stored and linked to interview

**AC-2.11: Update/Delete Interview**
- Given viewing interview detail
- When updating fields or deleting interview
- Then changes persist, delete requires confirmation

**AC-2.12: Self-Assessment**
- Given interview completed
- When filling self-assessment (feeling, what went well, improvement areas)
- Then assessment saved with interview

## Traceability Mapping

| AC # | Spec Section(s) | Component(s)/API(s) | Test Idea |
|------|----------------|---------------------|-----------|
| AC-2.1 | APIs (POST /interviews) | InterviewHandler.CreateInterview | Integration: create interview, verify round auto-increment |
| AC-2.2 | APIs (GET /interviews) | InterviewList page | Component: render list, verify sorting by date |
| AC-2.3 | Workflows (Create Interview) | InterviewForm modal | E2E: open form, fill minimal fields, verify navigation |
| AC-2.4 | Data Models, APIs (/with-context) | InterviewDetail page | Integration: fetch interview, verify all sections render |
| AC-2.5 | APIs (POST /interviewers) | InterviewerList component | Unit: add interviewer, verify list updates |
| AC-2.6 | APIs (POST /questions) | QuestionsList component | Unit: add question, verify numbering |
| AC-2.7 | Services (TipTap) | RichTextEditor component | Component: test formatting buttons work |
| AC-2.8 | Workflows (Auto-Save), Hooks | useAutoSave hook | Unit: debounce timing, save triggered after 30s |
| AC-2.9 | Novel Pattern (Context Sidebar) | PreviousRoundsPanel | Integration: verify previous rounds load, collapse/expand |
| AC-2.10 | Epic 1 (File Storage) | FileUpload + interview_id | Integration: upload file, verify linked to interview |
| AC-2.11 | APIs (PUT/DELETE) | InterviewDetail actions | E2E: edit field, delete interview, verify cascade |
| AC-2.12 | Data Models (self-assessment fields) | SelfAssessmentForm | Component: fill fields, verify save |

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: TipTap Learning Curve**
- **Description:** TipTap 3.0 is headless, requires custom UI integration
- **Impact:** Medium - Development time for rich text editor
- **Mitigation:**
  - Use TipTap starter-kit for common formatting
  - Style to match shadcn/ui (existing design patterns)
  - Reference existing TipTap + shadcn/ui community examples
- **Owner:** Frontend team

**RISK-2: Auto-Save Conflicts**
- **Description:** Multiple browser tabs editing same interview could cause conflicts
- **Impact:** Low - Personal use tool, unlikely scenario
- **Mitigation:**
  - Last-write-wins for MVP
  - Show "last updated" timestamp
  - Consider optimistic locking post-MVP if needed
- **Owner:** Backend team

**RISK-3: Context Load Performance**
- **Description:** Loading all previous rounds + notes in single call may be slow
- **Impact:** Medium - User experience degradation
- **Mitigation:**
  - Single optimized query with JOINs
  - Limit previous_rounds to summary data (questions_preview, feedback_summary)
  - Paginate if user has >10 rounds per application (edge case)
- **Owner:** Backend team

### Assumptions

**ASSUMPTION-1:** Users typically have <5 interview rounds per application
**ASSUMPTION-2:** Rich text notes are <50KB (typical use case)
**ASSUMPTION-3:** bluemonday default policy is sufficient for HTML sanitization
**ASSUMPTION-4:** Date/time stored separately (not combined timestamp)
**ASSUMPTION-5:** Interview type enum covers 95%+ of real interview formats

### Open Questions

**QUESTION-1:** Should company research notes be at application or interview level?
- **Answer:** Application level (shared across all rounds), but accessible from interview detail sidebar

**QUESTION-2:** Should question reordering be drag-drop or arrow buttons?
- **Answer:** Start with arrow buttons (simpler), add drag-drop post-MVP if requested

**QUESTION-3:** Should we track interviewer LinkedIn profiles?
- **Answer:** No, defer to post-MVP. Just name and role for MVP.

## Test Strategy Summary

### Unit Tests (Backend)

**Interview Repository Tests:**
- Create interview with valid data → success, round_number incremented
- Create interview for non-existent application → error
- Get interview with details → includes interviewers, questions, notes
- Soft delete interview → deleted_at set, related entities cascade

**Sanitizer Service Tests:**
- Sanitize clean HTML → unchanged
- Sanitize HTML with script tag → script removed
- Sanitize HTML with onclick → event handler removed
- Content >50KB → truncated or error

**Note Handler Tests:**
- Create note with valid content → sanitized and saved
- Update note → content sanitized, updated_at changed
- Get notes by interview → filtered by interview_id

### Integration Tests (Backend)

**Interview CRUD Flow:**
1. POST /api/interviews → 201 Created with round_number=1
2. GET /api/interviews/:id → full interview with empty relations
3. POST /api/interviews/:id/interviewers → 201 Created
4. POST /api/interviews/:id/questions → 201 Created
5. POST /api/interviews/:id/notes → 201 Created with sanitized content
6. GET /api/interviews/:id/with-context → includes previous rounds
7. DELETE /api/interviews/:id → 204, cascade verified

**Authorization Tests:**
1. Create interview for another user's application → 403
2. View another user's interview → 404 (hidden)
3. Update another user's interview → 403

### Component Tests (Frontend)

**RichTextEditor:**
- Render with initial content → content displayed
- Type text → content updates
- Click bold button → selection bolded
- Paste HTML → sanitized before display

**useAutoSave Hook:**
- Initial state → 'idle'
- Content changes → debounce starts
- 30s passes → save function called, status 'saving' → 'saved'
- Save fails → status 'error', retry available

**InterviewDetail:**
- Render with interview data → all sections displayed
- Expand previous round → questions visible
- Collapse previous round → summary only

### E2E Tests

**Story 2.1-2.4: Full Interview Creation and View**
1. Navigate to application detail
2. Click "Add Interview Round"
3. Fill type, date, time
4. Click "Create" → navigate to interview detail
5. Verify round_number, date displayed
6. Add interviewer → appears in list
7. Add question with answer → numbered correctly
8. Type in preparation notes → auto-save indicator shows "Saved"

**Story 2.9: Multi-Round Context**
1. Create application with 2 interviews (Round 1 done, Round 2 upcoming)
2. Navigate to Round 2 detail page
3. Verify Round 1 appears in context sidebar
4. Expand Round 1 → see questions preview
5. Click "View Full Details" → navigate to Round 1 page

### Testing Coverage Goal

- **Backend unit tests:** 70% coverage on repository and handler layers
- **Backend integration tests:** All 10 interview endpoints covered
- **Frontend component tests:** RichTextEditor, useAutoSave, InterviewDetail
- **E2E tests:** 2 critical flows (create interview, multi-round context)

### Testing Tools

- **Backend:** Go testing framework, testify assertions
- **Frontend:** Jest, React Testing Library, MSW for API mocking
- **E2E:** Playwright (consistent with Epic 1)
