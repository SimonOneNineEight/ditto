# Ditto - Architecture Document

## Overview

Ditto is a job search management web application built with a Go backend and Next.js frontend. It provides application tracking, multi-round interview management with contextual history, technical assessment tracking, workflow automation (dashboard, timeline, notifications), and search/export capabilities.

**Stack:** Go 1.24 + PostgreSQL 15 + Next.js 14 + AWS S3

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Go | 1.24.0 | Language |
| Gin | 1.10.1 | HTTP framework |
| sqlx | 1.4.0 | Database queries |
| golang-jwt/jwt/v5 | 5.2.2 | JWT authentication |
| bluemonday | 1.0.27 | HTML sanitization |
| aws-sdk-go-v2 | 1.41.0 | S3 file storage |
| golang-migrate/v4 | 4.18.3 | Database migrations |
| testify | 1.10.0 | Test assertions |
| goquery | 1.11.0 | HTML parsing (URL extraction) |
| gin-contrib/cors | 1.7.6 | CORS middleware |
| gin-contrib/gzip | 1.2.3 | Response compression |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2.15 | Framework (App Router) |
| React | ^18 | UI library |
| TypeScript | ^5 | Language |
| next-auth | 5.0.0-beta.29 | Authentication (OAuth) |
| Tailwind CSS | ^4.1.10 | Styling |
| shadcn/ui + Radix UI | Various | Component library (33 components) |
| TipTap | ^3.17.1 | Rich text editor |
| DOMPurify | ^3.3.1 | HTML sanitization |
| React Hook Form | ^7.54.2 | Form handling |
| Zod | ^3.24.2 | Schema validation |
| Axios | ^1.7.9 | HTTP client |
| date-fns | ^4.1.0 | Date formatting |
| Jest | ^30.2.0 | Testing |
| pnpm | - | Package manager |

### Infrastructure

| Component | Details |
|-----------|---------|
| Database | PostgreSQL 15 |
| File Storage | AWS S3 (presigned URLs) |
| Containers | Docker Compose |
| Backend port | 8081 |
| Frontend port | 8080 |

---

## Project Structure

```
ditto/
├── backend/                              # Go 1.24 Backend
│   ├── cmd/server/
│   │   └── main.go                       # Entry point, middleware chain, route registration
│   ├── internal/
│   │   ├── auth/
│   │   │   ├── hashing.go               # Password hashing (bcrypt)
│   │   │   └── jwt.go                   # JWT generation/validation
│   │   ├── handlers/
│   │   │   ├── application.go           # Application CRUD
│   │   │   ├── assessment.go            # Assessment CRUD
│   │   │   ├── auth.go                  # Login, register, token refresh
│   │   │   ├── company.go               # Company CRUD
│   │   │   ├── dashboard_handler.go     # Dashboard stats, upcoming events
│   │   │   ├── export.go               # CSV/JSON data export
│   │   │   ├── extract.go              # URL extraction (job postings)
│   │   │   ├── file.go                 # File upload/download (S3)
│   │   │   ├── helpers.go              # Shared handler utilities
│   │   │   ├── interview.go            # Interview CRUD
│   │   │   ├── interview_note.go       # Rich text notes
│   │   │   ├── interview_question.go   # Q&A tracking
│   │   │   ├── interviewer.go          # Interviewer management
│   │   │   ├── job.go                  # Job CRUD
│   │   │   ├── notification_handler.go # Notification list, read, preferences
│   │   │   ├── search_handler.go       # Full-text search
│   │   │   ├── timeline_handler.go     # Timeline view
│   │   │   └── user.go                 # User profile
│   │   ├── middleware/
│   │   │   ├── auth.go                 # JWT auth guard
│   │   │   ├── csrf.go                 # CSRF protection
│   │   │   ├── error.go               # Error recovery/formatting
│   │   │   ├── rate_limit.go           # Per-user rate limiting
│   │   │   ├── security_headers.go     # CSP, X-Frame-Options, HSTS
│   │   │   └── slow_request.go         # Slow request logging
│   │   ├── models/
│   │   │   ├── application.go
│   │   │   ├── assessment.go
│   │   │   ├── company.go
│   │   │   ├── file.go
│   │   │   ├── interview.go
│   │   │   ├── job.go
│   │   │   ├── notification.go
│   │   │   ├── rate_limit.go
│   │   │   ├── search.go
│   │   │   └── user.go
│   │   ├── repository/
│   │   │   ├── application.go
│   │   │   ├── assessment.go
│   │   │   ├── assessment_submission.go
│   │   │   ├── companies.go
│   │   │   ├── dashboard_repository.go
│   │   │   ├── file.go
│   │   │   ├── interview.go
│   │   │   ├── interview_note.go
│   │   │   ├── interview_question.go
│   │   │   ├── interviewer.go
│   │   │   ├── job.go
│   │   │   ├── notification_preferences_repository.go
│   │   │   ├── notification_repository.go
│   │   │   ├── rate_limit.go
│   │   │   ├── search_repository.go
│   │   │   ├── timeline_repository.go
│   │   │   └── user.go
│   │   ├── routes/
│   │   │   ├── application.go
│   │   │   ├── assessment.go
│   │   │   ├── auth.go
│   │   │   ├── company.go
│   │   │   ├── dashboard.go
│   │   │   ├── export.go
│   │   │   ├── extract.go
│   │   │   ├── file.go
│   │   │   ├── interview.go
│   │   │   ├── interview_note.go
│   │   │   ├── interview_question.go
│   │   │   ├── interviewer.go
│   │   │   ├── job.go
│   │   │   ├── notification.go
│   │   │   ├── search.go
│   │   │   └── timeline.go
│   │   ├── services/
│   │   │   ├── notification_scheduler.go   # Periodic notification generation
│   │   │   ├── notification_service.go     # Notification creation logic
│   │   │   ├── sanitizer_service.go        # HTML sanitization (bluemonday)
│   │   │   ├── s3/
│   │   │   │   └── service.go              # S3 presigned URL generation
│   │   │   └── urlextractor/
│   │   │       ├── extractor.go            # URL extraction orchestrator
│   │   │       ├── models.go               # Extracted job data model
│   │   │       ├── parser.go               # Parser interface
│   │   │       ├── parser_angellist.go
│   │   │       ├── parser_generic.go
│   │   │       ├── parser_glassdoor.go
│   │   │       ├── parser_indeed.go
│   │   │       ├── parser_linkedin.go
│   │   │       └── sanitize.go             # Input sanitization for extraction
│   │   ├── testutil/
│   │   │   ├── database.go                # Test DB setup/teardown
│   │   │   └── fixtures.go               # Test data factories
│   │   └── utils/
│   │       └── state.go                   # Application state (DB, config)
│   ├── migrations/                        # 13 migrations (golang-migrate)
│   │   ├── 000001_initial_schema
│   │   ├── 000002_add_users_auth_user_id_unique
│   │   ├── 000003_create_rate_limits
│   │   ├── 000004_create_file_system
│   │   ├── 000005_add_job_source_fields
│   │   ├── 000006_fix_application_status_unique
│   │   ├── 000007_create_interview_system
│   │   ├── 000008_add_interviewers_updated_at
│   │   ├── 000009_create_assessment_system
│   │   ├── 000010_update_assessment_status_reviewed_to_passed_failed
│   │   ├── 000011_create_notification_system
│   │   ├── 000012_add_search_vectors
│   │   └── 000013_add_performance_indexes
│   └── pkg/
│       ├── database/
│       │   ├── connection.go              # DB connection pool
│       │   └── migrations.go              # Migration runner
│       ├── errors/
│       │   ├── errors.go                  # AppError type, error codes
│       │   └── convert.go                 # Error conversion helpers
│       └── response/
│           └── response.go                # Standardized API response envelope
│
├── frontend/                              # Next.js 14 (App Router)
│   └── src/
│       ├── app/
│       │   ├── (auth)/                    # Public auth routes
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   └── components/            # OAuth buttons, market banner
│       │   ├── (app)/                     # Protected routes
│       │   │   ├── page.tsx               # Dashboard (home)
│       │   │   ├── applications/
│       │   │   │   ├── page.tsx           # Application list
│       │   │   │   ├── new/page.tsx       # New application (manual + URL import)
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx       # Application detail
│       │   │   │       ├── edit/page.tsx
│       │   │   │       └── assessments/[assessmentId]/page.tsx
│       │   │   ├── interviews/
│       │   │   │   ├── page.tsx           # Interview list
│       │   │   │   └── [id]/page.tsx      # Interview detail with context
│       │   │   ├── timeline/page.tsx
│       │   │   ├── files/page.tsx         # File management
│       │   │   ├── settings/page.tsx
│       │   │   └── design-system/page.tsx
│       │   └── api/auth/[...nextauth]/route.ts
│       ├── auth.ts                        # NextAuth v5 configuration
│       ├── components/
│       │   ├── ui/                        # 33 shadcn/ui components
│       │   ├── application-selector/
│       │   ├── applications/
│       │   ├── assessment-form/
│       │   ├── assessment-list/
│       │   ├── assessment-status-select/
│       │   ├── auto-save-indicator/
│       │   ├── export-dialog/
│       │   ├── file-upload/
│       │   ├── global-search/
│       │   ├── interview-detail/
│       │   ├── interview-form/
│       │   ├── interview-list/
│       │   ├── job-table/
│       │   ├── layout/
│       │   ├── layout-wrapper/
│       │   ├── loading-skeleton/
│       │   ├── navbar/
│       │   ├── notification-center/
│       │   ├── page-header/
│       │   ├── settings/
│       │   ├── sidebar/
│       │   ├── stat-card/
│       │   ├── storage-quota/
│       │   ├── submission-form/
│       │   ├── submission-list/
│       │   ├── error-boundary.tsx
│       │   ├── network-status-monitor.tsx
│       │   └── rich-text-editor.tsx        # TipTap wrapper
│       ├── hooks/
│       │   ├── useAutoSave.ts
│       │   ├── useFileUpload.ts
│       │   ├── useNotifications.ts
│       │   ├── use-breakpoint.ts
│       │   ├── use-click-outside.ts
│       │   ├── use-compact-layout.ts
│       │   ├── use-mobile.ts
│       │   └── index.ts
│       ├── lib/
│       │   ├── axios.ts                   # Axios instance with interceptors
│       │   ├── constants.ts
│       │   ├── errors.ts                  # Frontend error types
│       │   ├── file-service.ts            # File upload/download API calls
│       │   ├── sanitizer.ts               # DOMPurify wrapper
│       │   ├── utils.ts                   # cn() and shared utilities
│       │   └── schemas/                   # 7 Zod validation schemas
│       │       ├── application.ts
│       │       ├── assessment.ts
│       │       ├── interview.ts
│       │       ├── interviewer.ts
│       │       ├── question.ts
│       │       ├── submission.ts
│       │       └── index.ts
│       ├── providers/
│       │   └── auth-provider.tsx           # Session provider wrapper
│       └── types/
│           ├── auth-type.ts
│           ├── job-type.ts
│           ├── notification.ts
│           ├── search.ts
│           ├── timeline.ts
│           ├── upcoming.ts
│           └── index.ts
│
├── docs/
├── docker-compose.yml
└── CLAUDE.md
```

---

## API Architecture

### Middleware Chain

Middleware is applied in this order in `main.go`:

1. **SecurityHeaders** -- CSP, X-Frame-Options, X-Content-Type-Options, HSTS (production)
2. **Gzip** -- Response compression
3. **SlowRequestLogger** -- Logs requests exceeding threshold
4. **CORS** -- Origins: `localhost:8080`, `8082`, `3000`; allows `X-CSRF-Token` header
5. **ErrorHandler** -- Panic recovery, error formatting

Route-level middleware (applied per route group):
- **Auth** -- JWT validation, extracts user ID from token
- **CSRF** -- Token validation on state-changing requests
- **RateLimit** -- Per-user rate limiting (database-backed)

### Route Groups

All 16 route groups are registered under `/api`:

| Route Group | Prefix | Key Endpoints |
|-------------|--------|---------------|
| Auth | `/auth` | Login, register, refresh, me |
| Application | `/applications` | CRUD, list with filters |
| Company | `/companies` | CRUD |
| Job | `/jobs` | CRUD |
| Extract | `/extract` | URL extraction (LinkedIn, Indeed, Glassdoor, AngelList, generic) |
| File | `/files` | Presigned URL, confirm upload, download, delete, user files |
| Interview | `/interviews` | CRUD, list with filters |
| Interviewer | `/interviewers` | CRUD (nested under interviews) |
| InterviewQuestion | `/interview-questions` | CRUD (nested under interviews) |
| InterviewNote | `/interview-notes` | CRUD (nested under interviews) |
| Assessment | `/assessments` | CRUD, status update, submissions |
| Dashboard | `/dashboard` | Stats, upcoming events |
| Notification | `/notifications` | List, mark read, preferences |
| Timeline | `/timeline` | Merged interview + assessment timeline |
| Search | `/search` | Full-text search across entities |
| Export | `/export` | CSV/JSON data export |

### API Response Format

All responses use a standardized envelope:

```go
type ApiResponse struct {
    Success  bool         `json:"success"`
    Data     interface{}  `json:"data,omitempty"`
    Warnings []string     `json:"warnings,omitempty"`
    Error    *ErrorDetail `json:"error,omitempty"`
}

type ErrorDetail struct {
    Message     string            `json:"error"`
    Code        string            `json:"code"`
    Details     []string          `json:"details,omitempty"`
    FieldErrors map[string]string `json:"field_errors,omitempty"`
}
```

Response helpers: `Success`, `SuccessWithStatus`, `Created`, `NoContent`, `Error`, `BadRequest`, `SuccessWithWarnings`, `ErrorFromString`.

### Error Codes

Error codes are defined as `ErrorCode` string constants in `pkg/errors/errors.go`:

| Code | HTTP Status | Category |
|------|-------------|----------|
| `INVALID_CREDENTIALS` | 401 | auth |
| `EMAIL_ALREADY_EXISTS` | 409 | auth |
| `UNAUTHORIZED` | 401 | auth |
| `ROLE_NOT_FOUND` | 404 | auth |
| `FORBIDDEN` | 403 | auth |
| `VALIDATION_FAILED` | 400 | validation |
| `BAD_REQUEST` | 400 | validation |
| `NOT_FOUND` | 404 | not_found |
| `USER_NOT_FOUND` | 404 | not_found |
| `JOB_NOT_FOUND` | 404 | not_found |
| `CONFLICT` | 409 | internal |
| `INTERNAL_SERVER_ERROR` | 500 | internal |
| `DATABASE_ERROR` | 500 | internal |
| `UNEXPECTED_ERROR` | 500 | internal |
| `TIMEOUT_ERROR` | 408 | internal |
| `PARSING_FAILED` | 422 | internal |
| `NETWORK_FAILURE` | 502 | internal |
| `UNSUPPORTED_PLATFORM` | 400 | validation |
| `QUOTA_EXCEEDED` | 403 | internal |
| `EXPIRED` | 410 | internal |

---

## Authentication

### Backend (JWT)

- **Access token TTL:** 24 hours
- **Refresh token TTL:** 7 days
- **Signing method:** HS256
- **Claims:** UserID (UUID), Email, standard registered claims
- **Middleware:** Extracts Bearer token from `Authorization` header, validates, injects user ID into context

### Frontend (NextAuth v5)

- **Provider:** Credentials-based (email/password) via NextAuth v5 beta
- **Session strategy:** JWT
- **Auth provider:** Wraps app in `SessionProvider` via `auth-provider.tsx`
- **Axios interceptor:** Attaches access token to all API requests; handles 401 by redirecting to login

---

## Data Architecture

### Database

- **RDBMS:** PostgreSQL 15
- **Query layer:** sqlx (parameterized queries only)
- **Migrations:** golang-migrate (13 migration files with up/down pairs)
- **Search:** PostgreSQL full-text search with GIN indexes and `tsvector` columns
- **Soft deletes:** `deleted_at` column on entity tables, filtered in queries
- **Timestamps:** `created_at`, `updated_at` on all tables

### Entity Relationships

```
users
  ├── applications
  │     ├── interviews
  │     │     ├── interviewers
  │     │     ├── interview_questions
  │     │     ├── interview_notes
  │     │     └── files (nullable FK)
  │     ├── assessments
  │     │     └── assessment_submissions
  │     │           └── files (nullable FK)
  │     └── files (nullable FK)
  ├── notifications
  └── user_notification_preferences
```

### Migration History

| Migration | Purpose |
|-----------|---------|
| 000001 | Initial schema (users, companies, jobs, applications) |
| 000002 | Add unique constraint on users.auth_user_id |
| 000003 | Rate limits table |
| 000004 | File system (files table) |
| 000005 | Job source fields (source_url, source_platform) |
| 000006 | Fix application status unique constraint |
| 000007 | Interview system (interviews, interviewers, interview_questions, interview_notes) |
| 000008 | Add updated_at to interviewers |
| 000009 | Assessment system (assessments, assessment_submissions) |
| 000010 | Rename assessment status "reviewed" to "passed"/"failed" |
| 000011 | Notification system (notifications, user_notification_preferences) |
| 000012 | Search vectors (tsvector columns, GIN indexes) |
| 000013 | Performance indexes |

---

## File Storage

- **Provider:** AWS S3 with presigned URLs
- **Upload flow:** Frontend requests presigned URL from backend, uploads directly to S3, then confirms upload via backend endpoint
- **Download:** Backend generates presigned download URLs, validates ownership
- **S3 service:** `internal/services/s3/service.go`
- **Security:** Bucket is private; presigned URLs expire; backend validates `file.user_id` matches authenticated user

---

## Frontend Architecture

### UI Components

33 shadcn/ui components: accordion, alert-dialog, avatar, badge, breadcrumb, button, calendar, card, collapsible, command, date-picker, delete-confirm-dialog, dialog, drawer, dropdown-menu, fab, form, input, label, popover, progress, select, separator, sheet, sidebar, skeleton, sonner, switch, table, textarea, time-picker, toggle, tooltip.

### Hooks

| Hook | Purpose |
|------|---------|
| `useAutoSave` | Debounced auto-save for rich text fields |
| `useFileUpload` | S3 upload with progress tracking |
| `useNotifications` | Notification polling and state |
| `use-breakpoint` | Responsive breakpoint detection |
| `use-click-outside` | Click-outside detection for dropdowns |
| `use-compact-layout` | Compact layout mode toggle |
| `use-mobile` | Mobile device detection |

### Validation

7 Zod schemas in `lib/schemas/`: application, assessment, interview, interviewer, question, submission, plus barrel index. Used with React Hook Form via `@hookform/resolvers`.

### Rich Text

TipTap ^3.17.1 with extensions: starter-kit, link, placeholder, underline. Single component at `components/rich-text-editor.tsx`. Content stored as sanitized HTML. DOMPurify sanitizes on render (frontend), bluemonday sanitizes on write (backend).

---

## Security

### Input Validation

- **Client:** React Hook Form + Zod schemas
- **Server:** Gin binding tags (`binding:"required"`) + custom validators
- **Both sides always validate**

### XSS Prevention

- **Backend:** bluemonday sanitizes HTML on POST/PUT (write-time)
- **Frontend:** DOMPurify sanitizes before rendering (defense in depth)

### SQL Injection Prevention

- Parameterized queries via sqlx; no string concatenation

### Security Headers

Set by `middleware/security_headers.go`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (restrictive policy with S3 connect-src)
- `Strict-Transport-Security` (production only)
- `Permissions-Policy` (disables geolocation, microphone, camera)

### CORS

Configured in `main.go`:
- **Allowed origins:** `http://localhost:8080`, `http://localhost:8082`, `http://localhost:3000`
- **Allowed headers:** Origin, Content-Type, Accept, Authorization, X-CSRF-Token
- **Credentials:** Allowed
- **Max age:** 12 hours

---

## Background Services

### Notification Scheduler

`services/notification_scheduler.go` runs on a 15-minute interval (started in `main.go`). Generates notifications for upcoming interviews and assessment deadlines. Stopped gracefully on SIGINT/SIGTERM.

---

## Development Environment

### Docker Compose

```yaml
services:
  db:       # postgres:15, port 5432
  backend:  # Go backend, port 8081
```

The frontend runs outside Docker via `pnpm dev` on port 8080.

### Setup

```bash
# Start database + backend
docker-compose up -d

# Frontend
cd frontend
pnpm install
pnpm dev    # http://localhost:8080

# Backend runs at http://localhost:8081
```

### Testing

```bash
# Backend
cd backend
go test ./...

# Frontend
cd frontend
pnpm test
```

---

## Architecture Decision Records (ADRs)

### ADR-001: AWS S3 for File Storage

**Decision:** Use AWS S3 for file storage instead of local filesystem or database BLOB storage.

**Rationale:**
- Cost: ~$0.02/month for 100 users @ 100MB each (negligible)
- Reliability: 99.99% durability built-in
- Scalability: Infinitely scalable without backend changes
- Performance: Direct client uploads reduce backend load
- Maintenance: Zero operational overhead

**Alternatives Considered:**
- Local filesystem: Harder to scale, backup complexity
- PostgreSQL BYTEA: Bad performance for 5MB files, bloats database
- MinIO: Extra container to manage, deferred for simplicity

---

### ADR-002: TipTap 3.0 for Rich Text Editing

**Decision:** Use TipTap 3.0 with WYSIWYG + Markdown shortcuts, store as sanitized HTML.

**Rationale:**
- Headless: Fully customizable to match shadcn/ui aesthetic
- Modern: Latest stable version, active community
- Flexibility: WYSIWYG for general users, Markdown shortcuts for power users
- TypeScript: First-class TypeScript support
- Auto-save: Easy integration with React hooks

**Alternatives Considered:**
- Lexical: More complex, heavier learning curve
- Quill: Older, less customizable
- Plain Markdown: Too limited for rich formatting needs

---

### ADR-003: PostgreSQL Full-Text Search for MVP

**Decision:** Use PostgreSQL built-in full-text search with GIN indexes instead of Elasticsearch.

**Rationale:**
- Scale: Sufficient for MVP (1000+ records)
- Zero infrastructure: No additional service to manage
- Existing stack: Already have PostgreSQL
- Migration path: Can switch to Elasticsearch if needed post-MVP

**When to migrate:** If search becomes slow (10k+ users) or need advanced features (fuzzy search, relevance scoring)

---

### ADR-004: Multi-Round Interview Context Sidebar

**Decision:** Context sidebar on right (70/30 split), single API call for data loading.

**Rationale:**
- UX: Left = primary action (editing), Right = reference (context)
- Performance: Single API call reduces latency
- Mobile: Tabs on mobile maintain pattern
- Differentiator: Novel pattern unique to ditto

**Implementation:** `GET /api/interviews/:id` returns current interview with related data. The interview detail page renders a two-column layout with editable content on the left and read-only context from previous rounds on the right.

---

### ADR-005: In-App Notifications Only for MVP

**Decision:** Implement in-app notifications (database-backed) only. Defer browser push notifications to post-MVP.

**Rationale:**
- Sufficient: In-app notifications meet MVP requirements
- Complexity: Browser push requires service workers, permissions, infrastructure
- Focus: Prioritize core features over notification delivery mechanism
- User behavior: Active users will see in-app notifications

**Migration path:** Add browser push post-MVP if user feedback indicates need.

---

_Date: 2026-02-20_
