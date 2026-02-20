# Epic Technical Specification: Technical Assessment Tracking

Date: 2026-02-04
Author: Simon
Epic ID: 3
Status: Draft

---

## Overview

**Design Reference:** [ditto-design.pen](../ditto-design.pen) - Contains Assessment components and screen designs.

Epic 3 delivers technical assessment tracking capabilities to ditto, ensuring that take-home projects, coding challenges, and other assessments never fall through the cracks. Job seekers frequently receive technical assessments with tight deadlines - missing one means losing an opportunity entirely. This epic addresses PRD requirement FR-3 (Technical Assessment Tracking) by providing deadline visibility, organized submission tracking, and timeline integration.

Building on Epic 2's interview management infrastructure and Epic 1's file storage, this epic follows identical backend patterns (Go handlers, sqlx repositories, Gin routes) and frontend patterns (React components, shadcn/ui, service layer). The assessment system mirrors the interview system's architecture while adding deadline-aware features like countdown timers, status workflows, and multi-type submission tracking (GitHub links, file uploads, notes).

## Objectives and Scope

**In Scope:**
- Database schema for assessments and assessment submissions (2 new tables, migration 000009)
- Full CRUD API for assessment management with filtering by application
- Assessment creation form (type, title, due date, instructions, requirements)
- Assessment detail view with deadline countdown, status badge, and submission tracking
- Assessment status workflow: Not Started → In Progress → Submitted → Reviewed
- Submission tracking with three types: GitHub links, file uploads, and rich text notes
- File uploads for assessment deliverables (reuse Epic 1 S3 infrastructure, 10MB limit)
- Assessment deadline integration with the existing timeline view (Story 2.10)
- Assessment list view within application detail page
- Quick status updates without navigation

**Out of Scope (Post-MVP):**
- AI-powered assessment solution suggestions
- Code execution/testing environment
- Assessment templates or boilerplate generators
- Peer review / collaborative assessment work
- Assessment difficulty rating or analytics
- Browser-based IDE integration
- Status history tracking (deferred to Epic 6 polish)

## System Architecture Alignment

This epic implements the **Assessment System** defined in the architecture document (Migration 000006 in the original plan, renumbered to 000009 based on actual migration state).

**Backend (Go 1.23 + Gin + sqlx):**
- New handlers: `assessment.go`, `assessment_submission.go`
- New repositories: `assessment_repository.go`, `assessment_submission_repository.go`
- New models: `assessment.go` (Assessment, AssessmentSubmission structs)
- New routes: `assessment_routes.go`
- New migration: `000009_create_assessment_system.up.sql` (2 tables + indexes)
- Enhanced: `file.go` handler - add `assessment_submission_id` FK support
- Enhanced: `timeline.go` handler - include assessments in timeline queries

**Frontend (Next.js 14 + React + shadcn/ui):**
- New pages: `app/(app)/applications/[id]/assessments/` (nested under application)
- New components:
  - `assessment-form/assessment-form-modal.tsx` - Create/edit assessment modal
  - `assessment-detail/assessment-detail-page.tsx` - Full detail with countdown
  - `assessment-detail/assessment-status-select.tsx` - Status workflow dropdown
  - `assessment-detail/submission-form.tsx` - Multi-type submission creation
  - `assessment-detail/submission-list.tsx` - Display submissions chronologically
  - `assessment-list/assessment-list.tsx` - Assessment cards within application detail
- New service: `assessment-service.ts` (types + API functions)
- Enhanced: Timeline view to render assessment items alongside interviews

**Database (PostgreSQL 15):**
- `assessments` - Core records: type, title, due_date, status, instructions, requirements
- `assessment_submissions` - Submission records: type (github/file/notes), URLs, file refs, timestamps

**Architectural Constraints:**
- Follow existing repository pattern (sqlx, UUID PKs, soft deletes, dynamic updates)
- Use existing auth middleware (JWT validation, user_id extraction from context)
- Use existing error format: `{error, code, details}` with custom error codes
- Reuse existing file upload infrastructure (S3 presigned URLs, files table)
- Assessment types and statuses stored as VARCHAR with Go validation tags
- All queries scoped to authenticated user_id

## Detailed Design

### Services and Modules

| Module | Layer | Responsibility | Inputs | Outputs |
|--------|-------|---------------|--------|---------|
| `assessment.go` (handler) | Handler | Parse/validate assessment requests, delegate to repository | HTTP requests (JSON body, path params, query params) | JSON responses with assessment data |
| `assessment_submission.go` (handler) | Handler | Parse/validate submission requests, manage submission lifecycle | HTTP requests with submission data | JSON responses with submission data |
| `assessment_repository.go` | Repository | Assessment CRUD queries, filtering, pagination | Go structs, UUIDs, filter params | Assessment models, error |
| `assessment_submission_repository.go` | Repository | Submission CRUD queries, list by assessment | Go structs, UUIDs | Submission models, error |
| `assessment-service.ts` | Frontend Service | API client for assessment endpoints | TypeScript params | Promise<Assessment/Submission> |
| `assessment-form-modal.tsx` | Frontend Component | Assessment creation/editing UI | Props (applicationId, onSuccess) | Form submission → API call |
| `assessment-detail-page.tsx` | Frontend Component | Assessment detail with countdown, submissions | Route params (assessmentId) | Rendered assessment detail |
| `assessment-list.tsx` | Frontend Component | List assessments for an application | Props (applicationId) | Rendered card list |

### Data Models and Contracts

**Migration 000009: Assessment System**

```sql
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    application_id UUID NOT NULL REFERENCES applications(id),
    assessment_type VARCHAR(50) NOT NULL,
    -- Values: take_home_project, live_coding, system_design, data_structures, case_study, other
    title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    -- Values: not_started, in_progress, submitted, reviewed
    instructions TEXT,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    submission_type VARCHAR(50) NOT NULL,
    -- Values: github, file_upload, notes
    github_url VARCHAR(500),
    file_id UUID REFERENCES files(id),
    notes TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_assessments_user_id ON assessments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_application_id ON assessments(application_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_due_date ON assessments(due_date);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessment_submissions_assessment_id ON assessment_submissions(assessment_id) WHERE deleted_at IS NULL;
```

**Go Models:**

```go
type Assessment struct {
    ID             uuid.UUID  `json:"id" db:"id"`
    UserID         uuid.UUID  `json:"user_id" db:"user_id"`
    ApplicationID  uuid.UUID  `json:"application_id" db:"application_id"`
    AssessmentType string     `json:"assessment_type" db:"assessment_type"`
    Title          string     `json:"title" db:"title"`
    DueDate        string     `json:"due_date" db:"due_date"`
    Status         string     `json:"status" db:"status"`
    Instructions   *string    `json:"instructions" db:"instructions"`
    Requirements   *string    `json:"requirements" db:"requirements"`
    CreatedAt      time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
    DeletedAt      *time.Time `json:"-" db:"deleted_at"`
}

type AssessmentSubmission struct {
    ID             uuid.UUID  `json:"id" db:"id"`
    AssessmentID   uuid.UUID  `json:"assessment_id" db:"assessment_id"`
    SubmissionType string     `json:"submission_type" db:"submission_type"`
    GithubURL      *string    `json:"github_url" db:"github_url"`
    FileID         *uuid.UUID `json:"file_id" db:"file_id"`
    Notes          *string    `json:"notes" db:"notes"`
    SubmittedAt    time.Time  `json:"submitted_at" db:"submitted_at"`
    CreatedAt      time.Time  `json:"created_at" db:"created_at"`
    DeletedAt      *time.Time `json:"-" db:"deleted_at"`
}
```

**TypeScript Types:**

```typescript
export type AssessmentType = 'take_home_project' | 'live_coding' | 'system_design'
    | 'data_structures' | 'case_study' | 'other';

export type AssessmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'reviewed';

export type SubmissionType = 'github' | 'file_upload' | 'notes';

export interface Assessment {
    id: string;
    user_id: string;
    application_id: string;
    assessment_type: AssessmentType;
    title: string;
    due_date: string;
    status: AssessmentStatus;
    instructions?: string;
    requirements?: string;
    created_at: string;
    updated_at: string;
}

export interface AssessmentSubmission {
    id: string;
    assessment_id: string;
    submission_type: SubmissionType;
    github_url?: string;
    file_id?: string;
    notes?: string;
    submitted_at: string;
    created_at: string;
}

export interface AssessmentWithApplication extends Assessment {
    company_name: string;
    job_title: string;
}

export interface AssessmentWithSubmissions extends Assessment {
    submissions: AssessmentSubmission[];
}
```

### APIs and Interfaces

**Assessment Endpoints:**

| Method | Path | Description | Request Body | Response | Status |
|--------|------|-------------|-------------|----------|--------|
| POST | `/api/assessments` | Create assessment | `{application_id, assessment_type, title, due_date, instructions?, requirements?}` | Assessment object | 201 |
| GET | `/api/assessments` | List assessments | Query: `application_id` (required), `status?` | `{data: Assessment[], total, page, per_page}` | 200 |
| GET | `/api/assessments/:id` | Get single assessment | - | Assessment object | 200 |
| GET | `/api/assessments/:id/details` | Get assessment with submissions | - | AssessmentWithSubmissions | 200 |
| PUT | `/api/assessments/:id` | Update assessment | Partial fields | Updated Assessment | 200 |
| PATCH | `/api/assessments/:id/status` | Update status only | `{status}` | Updated Assessment | 200 |
| DELETE | `/api/assessments/:id` | Soft delete | - | - | 204 |

**Submission Endpoints:**

| Method | Path | Description | Request Body | Response | Status |
|--------|------|-------------|-------------|----------|--------|
| POST | `/api/assessments/:id/submissions` | Add submission | `{submission_type, github_url?, file_id?, notes?}` | Submission object | 201 |
| DELETE | `/api/assessment-submissions/:id` | Delete submission | - | - | 204 |

**Timeline Enhancement:**

| Method | Path | Description | Change |
|--------|------|-------------|--------|
| GET | `/api/timeline` | Get timeline items | Add `type` query filter: `all`, `interviews`, `assessments`. Include assessments sorted by due_date alongside interviews sorted by scheduled_date. |

**Error Responses:**

```json
// 400 Bad Request (validation)
{"error": "Validation failed", "code": "VALIDATION_ERROR", "details": {"due_date": "Due date is required"}}

// 403 Forbidden (ownership)
{"error": "Not authorized to access this assessment", "code": "FORBIDDEN"}

// 404 Not Found
{"error": "Assessment not found", "code": "NOT_FOUND"}
```

### Workflows and Sequencing

**Assessment Creation Flow:**
1. User views application detail → clicks "Add Assessment"
2. Modal opens with form: type (dropdown), title, due date (picker), instructions, requirements
3. Frontend validates (title + due_date required) → POST `/api/assessments`
4. Backend validates user owns application → creates record → returns 201
5. Assessment appears in application's assessment list
6. User can click to view assessment detail page

**Status Transition Flow:**
1. Assessment created with `not_started` status
2. User selects "In Progress" from status dropdown → PATCH `/api/assessments/:id/status`
3. User completes work, selects "Submitted" → prompted to add submission details
4. Submission form appears: choose type (GitHub/File/Notes), fill fields → POST `/api/assessments/:id/submissions`
5. After reviewer feedback, user sets "Reviewed" status

**Timeline Integration Flow:**
1. Timeline view calls `GET /api/timeline` (enhanced to include assessments)
2. Backend queries both `interviews` (by scheduled_date) and `assessments` (by due_date)
3. Results merged and sorted chronologically
4. Frontend renders both types with distinct icons/colors (blue=interview, orange=assessment)
5. User can filter by type: All / Interviews Only / Assessments Only

## Non-Functional Requirements

### Performance

- Assessment list for an application loads in <500ms (indexed query on application_id)
- Assessment detail with submissions loads in <500ms (single query with JOIN or 2 sequential queries)
- Timeline view with assessments loads in <1s (merged query, indexed on due_date + scheduled_date)
- Status updates complete in <300ms (single row update)
- Assessment creation completes in <500ms

### Security

- All assessment endpoints require JWT authentication (existing auth middleware)
- All queries scoped to authenticated user_id - backend validates user owns the application before any assessment operation
- GitHub URL input validated for URL format (both client and server)
- Instructions and requirements fields are plain text (no HTML/XSS risk)
- If rich text is added later, bluemonday sanitization must be applied
- File uploads for submissions go through existing S3 presigned URL flow with ownership validation

### Reliability/Availability

- Assessment data follows existing soft delete pattern - no permanent data loss
- Cascade soft delete: deleting an assessment soft-deletes its submissions
- File references in submissions are nullable FK - file deletion doesn't cascade to submission records
- All write operations use transactions where multiple tables are affected

### Observability

- Log assessment creation/deletion events: `[INFO] User %s created assessment %s for application %s`
- Log status transitions: `[INFO] Assessment %s status changed: %s → %s by user %s`
- Log slow queries (>500ms) on assessment endpoints
- Frontend error logging via console.error for failed API calls (consistent with existing pattern)

## Dependencies and Integrations

**Backend Dependencies (existing - no new packages):**
- `github.com/gin-gonic/gin` v1.10.1 - HTTP framework
- `github.com/jmoiron/sqlx` v1.4.0 - SQL toolkit
- `github.com/google/uuid` - UUID generation
- `github.com/lib/pq` - PostgreSQL driver
- `github.com/golang-migrate/migrate` v4.18.3 - Schema migrations

**Frontend Dependencies (existing - no new packages):**
- `next` 14.2.15 - Framework
- `react` 18 - UI library
- `axios` 1.7.9 - HTTP client
- `react-hook-form` 7.54.2 + `zod` 3.24.2 - Form validation
- `@radix-ui/react-*` - UI primitives (Select, Dialog, etc.)
- `lucide-react` 0.452.0 - Icons
- `sonner` - Toast notifications
- `date-fns` - Date formatting and countdown calculations

**Integration Points:**
- **Files table (Epic 1):** Assessment submissions reference `files.id` via nullable FK `file_id`
- **Applications table (existing):** Assessments reference `applications.id` via required FK
- **Timeline view (Epic 2, Story 2.10):** Enhanced to include assessment deadlines
- **File upload component (Epic 1):** Reused for submission file uploads with 10MB limit override

## Acceptance Criteria (Authoritative)

1. **AC-3.1:** Running migration 000009 creates `assessments` and `assessment_submissions` tables with all specified columns, constraints, and indexes. Down migration drops tables cleanly.

2. **AC-3.2a:** `POST /api/assessments` creates an assessment with required fields (application_id, assessment_type, title, due_date) and returns 201. Validation returns 400 with field-specific errors for missing required fields.

3. **AC-3.2b:** `GET /api/assessments?application_id=X` returns all non-deleted assessments for the application, sorted by due_date ascending. Returns empty array if none exist.

4. **AC-3.2c:** `PUT /api/assessments/:id` updates partial fields and returns updated record. `DELETE /api/assessments/:id` soft-deletes the assessment and its submissions.

5. **AC-3.3a:** Clicking "Add Assessment" on application detail opens a modal with fields: assessment type (dropdown), title (text), due date (date picker), instructions (textarea), requirements (textarea). Submitting creates the assessment and shows it in the list.

6. **AC-3.3b:** Assessment detail page shows: type badge, title, due date, countdown timer (color-coded: green >3 days, yellow 1-3 days, red <1 day or overdue), status badge, instructions, requirements.

7. **AC-3.4:** Status dropdown on assessment detail allows transitions: Not Started → In Progress → Submitted → Reviewed. Status updates immediately via PATCH endpoint. Badge color changes: gray (not_started), blue (in_progress), green (submitted), purple (reviewed).

8. **AC-3.5:** Clicking "Add Submission" shows form with type selector (GitHub/File/Notes). GitHub type shows URL input with format validation. Notes type shows textarea. Submissions display chronologically with type, content, and timestamp.

9. **AC-3.6:** File submission type allows uploading PDF, ZIP, DOCX up to 10MB. Uploaded files linked via `file_id` in submission. Files downloadable and deletable. Uploads count toward storage quota.

10. **AC-3.7:** Timeline view shows assessments alongside interviews, sorted chronologically. Assessments display: company name, type, title, due date, countdown, status. Overdue assessments highlighted in red. Filter supports: All / Interviews / Assessments.

11. **AC-3.8:** Application detail page shows "Assessments" section with all assessments as cards. Each card shows: type badge, title, due date, countdown, status badge. Quick status update via dropdown without leaving page. Empty state shows "No assessments yet" with "Add Assessment" CTA.

## Traceability Mapping

| AC | Spec Section | Component(s) / API(s) | Test Idea |
|----|-------------|----------------------|-----------|
| AC-3.1 | Data Models | migration 000009, `assessments` + `assessment_submissions` tables | Run migration up/down, verify table structure, constraints, indexes |
| AC-3.2a | APIs - POST | `assessment.go` handler, `assessment_repository.go` | POST with valid/invalid data, verify 201/400 responses |
| AC-3.2b | APIs - GET list | `assessment.go` handler, repository ListByApplicationID | GET with application_id, verify sort order, empty results |
| AC-3.2c | APIs - PUT, DELETE | `assessment.go` handler, repository Update/SoftDelete | PUT partial fields, DELETE verify soft delete + cascade |
| AC-3.3a | Workflows - Creation | `assessment-form-modal.tsx`, `assessment-service.ts` | Open modal, fill form, submit, verify assessment appears in list |
| AC-3.3b | Workflows - Detail | `assessment-detail-page.tsx` | Navigate to detail, verify all fields render, countdown colors |
| AC-3.4 | Workflows - Status | `assessment-status-select.tsx`, PATCH endpoint | Click each status transition, verify badge color changes |
| AC-3.5 | APIs - Submissions | `submission-form.tsx`, POST submissions endpoint | Create GitHub/Notes submissions, verify display |
| AC-3.6 | Dependencies - Files | FileUpload component, files table FK | Upload 10MB file, verify linked to submission, download works |
| AC-3.7 | Workflows - Timeline | Timeline page, GET `/api/timeline` enhanced | View timeline with assessments, filter by type, verify sort order |
| AC-3.8 | Frontend - List | `assessment-list.tsx` in application detail | View application with assessments, quick status update, empty state |

## Risks, Assumptions, Open Questions

**Risks:**
- **R1 (Low):** Timeline query performance with two entity types merged. *Mitigation:* Both tables have date indexes. For MVP scale (<1000 records), simple UNION query is sufficient. Monitor query time.
- **R2 (Low):** File upload size increase to 10MB for assessments may affect upload UX on slow connections. *Mitigation:* Progress bar already implemented in FileUpload component. Consider showing estimated time for larger files.
- **R3 (Medium):** Assessment status transitions are not enforced in backend (any status can be set). *Mitigation:* For MVP, trust the UI to present valid transitions. Add server-side state machine validation in Epic 6 if needed.

**Assumptions:**
- **A1:** The next available migration number is 000009 (verified: latest existing is 000008).
- **A2:** Assessment detail is accessed from within an application context (no standalone assessment routes needed at this stage).
- **A3:** GitHub URL validation is format-only (valid URL structure), not a live check that the repo exists.
- **A4:** File upload limit of 10MB for assessments is configurable on the backend presigned URL generation (the existing 5MB limit for general files remains unchanged).
- **A5:** The existing Timeline view (from Story 2.10) renders items as a list - assessments will follow the same visual pattern with different icon/color.

**Open Questions:**
- **Q1:** Should assessment deadlines trigger in-app notifications? *Recommendation:* Defer to Epic 4 (Story 4.5 - Notification Center). For now, the timeline countdown provides visibility.
- **Q2:** Should we allow editing submissions after creation? *Recommendation:* No for MVP - users can delete and recreate. Simplifies the data model and prevents confusion about "which version was submitted."

## Test Strategy Summary

**Backend Unit Tests (Repository Layer):**
- Test `CreateAssessment` with valid/invalid data
- Test `GetAssessmentByID` with ownership validation (should fail for wrong user)
- Test `ListAssessmentsByApplicationID` with sorting and filtering
- Test `UpdateAssessment` with partial field updates
- Test `SoftDeleteAssessment` cascading to submissions
- Test `CreateSubmission` for each submission type
- Test `DeleteSubmission` soft delete
- Use existing test utilities (`testutil.CreateTestUser`, `testutil.SetupTestDB`)

**Backend Integration Tests (Handler Layer):**
- Test full HTTP request/response cycle for each endpoint
- Test authentication (401 for missing token, 403 for wrong user)
- Test validation (400 with specific field errors)
- Test pagination and filtering query params

**Frontend Component Tests (Manual for MVP):**
- Assessment form modal: open, fill, submit, verify success toast and list update
- Assessment detail page: verify countdown colors at different time thresholds
- Status dropdown: verify transitions and badge color changes
- Submission form: test each type (GitHub, file, notes)
- Timeline view: verify assessments appear alongside interviews with correct sorting
- Application detail: verify assessment list section with empty state

**Critical Path Tests:**
1. Create application → Add assessment → View in list → Open detail → Add submission → View in timeline
2. Assessment with overdue deadline → verify red highlighting in both detail and timeline views
3. File upload submission → verify file appears, downloadable, counts toward quota
4. Delete assessment → verify soft delete cascades to submissions, removed from views
