# Ditto - Architecture Document

## Executive Summary

This architecture document defines the technical decisions and implementation patterns for completing the ditto MVP. Ditto is a brownfield web application (Go 1.23 backend + Next.js 14 frontend) that provides comprehensive job search management with deep interview lifecycle tracking as its core differentiator.

The architecture extends existing infrastructure with 5 new feature areas: enhanced application management (URL extraction, S3 file storage), deep interview management (rich text notes, multi-round context), technical assessment tracking, workflow automation (dashboard, timeline, notifications), and search/export capabilities. All decisions prioritize consistency across 47 stories and 6 epics to prevent AI agent conflicts during implementation.

**Key Architectural Approach:**
- **Brownfield Extension:** Build on proven Go + PostgreSQL + Next.js foundation
- **Consistency-First:** Standardized patterns prevent agent conflicts
- **Novel Pattern:** Multi-round interview context sidebar (unique differentiator)
- **Production-Ready:** All decisions meet NFRs (performance, security, scalability)

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **File Storage** | AWS S3 | Latest | 1, 2, 3 | Cheap (~$0.02/month), reliable, scalable, zero maintenance |
| **S3 SDK (Backend)** | AWS SDK Go v2 | Latest | 1, 2, 3 | Official AWS SDK for Go |
| **S3 SDK (Frontend)** | @aws-sdk/client-s3 | 3.927.0+ | 1, 2, 3 | Presigned URL generation, official AWS SDK |
| **Rich Text Editor** | TipTap | 3.0+ | 2, 3 | Headless, customizable, WYSIWYG + Markdown shortcuts, shadcn/ui compatible |
| **HTML Sanitization** | DOMPurify (Frontend), bluemonday (Backend) | 3.3.0+ / Latest | 2, 3 | Industry-standard XSS protection, defense in depth |
| **Content Storage Format** | Sanitized HTML | N/A | 2, 3 | Best for rich formatting, widely supported |
| **Database Schema** | Normalized tables (5 new migrations) | N/A | All | Consistent with existing pattern, clean separation |
| **Search** | PostgreSQL Full-Text Search | Built-in | 5 | Sufficient for MVP scale (1000+ records), GIN indexes |
| **Auto-Save** | Custom React hook, 30s debounce | N/A | 2, 3, 4 | Simple, effective, matches PRD requirement |
| **Pagination** | Offset-based (`?page=1&per_page=20`) | N/A | All | Standard pattern, consistent with existing endpoints |
| **Dates/Times** | ISO 8601 (API), UTC (Database) | N/A | All | Standard format, timezone-agnostic storage |
| **Soft Deletes** | `deleted_at` column on all tables | N/A | All | Existing pattern, data recovery capability |
| **Notification System** | In-app only (database-backed) | N/A | 4 | Browser push deferred to post-MVP, sufficient for MVP |
| **Testing** | Unit (repository) + Integration (handlers) | N/A | 6 | Consistent with existing test strategy |

---

## Project Structure

```
ditto/
├── backend/                           # Go 1.23 Backend
│   ├── cmd/
│   │   └── server/
│   │       └── main.go               # ✅ Existing: Entry point
│   ├── internal/
│   │   ├── handlers/
│   │   │   ├── auth.go               # ✅ Existing
│   │   │   ├── company.go            # ✅ Existing
│   │   │   ├── job.go                # ✅ Existing
│   │   │   ├── application.go        # ✅ Existing + Enhanced (URL extraction)
│   │   │   ├── interview.go          # 🆕 Epic 2: Interview CRUD
│   │   │   ├── interviewer.go        # 🆕 Epic 2: Interviewer management
│   │   │   ├── interview_question.go # 🆕 Epic 2: Questions/answers
│   │   │   ├── interview_note.go     # 🆕 Epic 2: Rich text notes
│   │   │   ├── assessment.go         # 🆕 Epic 3: Assessment CRUD
│   │   │   ├── assessment_submission.go # 🆕 Epic 3: Submission tracking
│   │   │   ├── file.go               # 🆕 Epic 1: File upload (S3)
│   │   │   ├── timeline.go           # 🆕 Epic 4: Timeline view
│   │   │   ├── dashboard.go          # 🆕 Epic 4: Dashboard stats
│   │   │   ├── notification.go       # 🆕 Epic 4: Notifications
│   │   │   ├── search.go             # 🆕 Epic 5: Global search
│   │   │   └── export.go             # 🆕 Epic 5: Data export
│   │   ├── repository/
│   │   │   ├── user_repository.go           # ✅ Existing
│   │   │   ├── company_repository.go        # ✅ Existing
│   │   │   ├── job_repository.go            # ✅ Existing
│   │   │   ├── application_repository.go    # ✅ Existing
│   │   │   ├── interview_repository.go      # 🆕 Epic 2
│   │   │   ├── interviewer_repository.go    # 🆕 Epic 2
│   │   │   ├── interview_question_repository.go # 🆕 Epic 2
│   │   │   ├── interview_note_repository.go # 🆕 Epic 2
│   │   │   ├── assessment_repository.go     # 🆕 Epic 3
│   │   │   ├── assessment_submission_repository.go # 🆕 Epic 3
│   │   │   ├── file_repository.go           # 🆕 Epic 1
│   │   │   ├── notification_repository.go   # 🆕 Epic 4
│   │   │   └── search_repository.go         # 🆕 Epic 5
│   │   ├── models/
│   │   │   ├── user.go, company.go, job.go, application.go  # ✅ Existing
│   │   │   ├── interview.go, interviewer.go, interview_question.go, interview_note.go  # 🆕 Epic 2
│   │   │   ├── assessment.go, assessment_submission.go  # 🆕 Epic 3
│   │   │   ├── file.go               # 🆕 Epic 1
│   │   │   ├── notification.go       # 🆕 Epic 4
│   │   │   └── search_result.go      # 🆕 Epic 5
│   │   ├── middleware/
│   │   │   ├── auth.go, error.go, cors.go  # ✅ Existing
│   │   ├── routes/
│   │   │   ├── routes.go             # ✅ Existing: Route registration
│   │   │   ├── interview_routes.go   # 🆕 Epic 2
│   │   │   ├── assessment_routes.go  # 🆕 Epic 3
│   │   │   ├── file_routes.go        # 🆕 Epic 1
│   │   │   └── search_routes.go      # 🆕 Epic 5
│   │   └── services/
│   │       ├── s3_service.go         # 🆕 Epic 1: S3 presigned URLs
│   │       ├── sanitizer_service.go  # 🆕 Epic 2: HTML sanitization (bluemonday)
│   │       └── notification_service.go # 🆕 Epic 4: Notification triggers
│   ├── migrations/
│   │   ├── 000001-000004_*.up.sql    # ✅ Existing tables
│   │   ├── 000005_create_interview_system.up.sql      # 🆕 Epic 2 (interviews, interviewers, interview_questions, interview_notes)
│   │   ├── 000006_create_assessment_system.up.sql     # 🆕 Epic 3 (assessments, assessment_submissions)
│   │   ├── 000007_create_file_system.up.sql           # 🆕 Epic 1 (files)
│   │   ├── 000008_create_notification_system.up.sql   # 🆕 Epic 4 (notifications, user_notification_preferences)
│   │   └── 000009_add_search_indexes.up.sql           # 🆕 Epic 5 (GIN indexes for FTS)
│   └── pkg/                          # Shared packages
│
├── frontend/                          # Next.js 14 Frontend
│   └── src/
│       ├── app/
│       │   ├── (auth)/               # ✅ Existing: Public auth routes
│       │   ├── (app)/                # ✅ Protected routes
│       │   │   ├── dashboard/        # 🆕 Epic 4
│       │   │   │   └── page.tsx
│       │   │   ├── applications/     # ✅ Existing + Enhanced
│       │   │   │   ├── page.tsx      # Enhanced: filters, search
│       │   │   │   └── [id]/page.tsx # Enhanced: show interviews/assessments
│       │   │   ├── interviews/       # 🆕 Epic 2
│       │   │   │   ├── page.tsx      # Interview list/timeline
│       │   │   │   ├── [id]/page.tsx # Interview detail with rich text
│       │   │   │   └── components/
│       │   │   │       ├── InterviewForm.tsx
│       │   │   │       ├── InterviewDetail.tsx
│       │   │   │       ├── InterviewerList.tsx
│       │   │   │       ├── QuestionsList.tsx
│       │   │   │       ├── RichTextEditor.tsx  # TipTap wrapper
│       │   │   │       ├── PreviousRoundsPanel.tsx
│       │   │   │       └── ContextSidebar.tsx
│       │   │   ├── assessments/      # 🆕 Epic 3
│       │   │   │   ├── page.tsx
│       │   │   │   ├── [id]/page.tsx
│       │   │   │   └── components/
│       │   │   ├── timeline/         # 🆕 Epic 4
│       │   │   │   └── page.tsx
│       │   │   ├── search/           # 🆕 Epic 5
│       │   │   │   └── page.tsx
│       │   │   └── settings/         # Enhanced
│       │   └── api/
│       │       └── auth/             # ✅ Existing: NextAuth
│       ├── components/
│       │   ├── Navbar/               # ✅ Existing + Enhanced (notification bell, search)
│       │   ├── Sidebar/              # ✅ Existing + Enhanced (new nav items)
│       │   ├── shared/               # 🆕 Shared components
│       │   │   ├── RichTextEditor/   # TipTap wrapper
│       │   │   ├── FileUpload/       # S3 upload component
│       │   │   ├── AutoSaveIndicator/
│       │   │   ├── NotificationCenter/
│       │   │   └── GlobalSearch/
│       │   └── ui/                   # ✅ shadcn/ui components (15 existing)
│       ├── lib/
│       │   ├── axios.ts, auth.ts     # ✅ Existing
│       │   ├── s3.ts                 # 🆕 S3 client utilities
│       │   ├── sanitizer.ts          # 🆕 DOMPurify wrapper
│       │   └── hooks/
│       │       ├── useAutoSave.ts    # 🆕 Auto-save hook
│       │       ├── useFileUpload.ts  # 🆕 File upload hook
│       │       └── useNotifications.ts # 🆕 Notifications hook
│       ├── services/
│       │   ├── applicationService.ts, jobService.ts  # ✅ Existing
│       │   ├── interviewService.ts   # 🆕 Epic 2
│       │   ├── assessmentService.ts  # 🆕 Epic 3
│       │   ├── fileService.ts        # 🆕 Epic 1
│       │   ├── timelineService.ts    # 🆕 Epic 4
│       │   ├── dashboardService.ts   # 🆕 Epic 4
│       │   ├── notificationService.ts # 🆕 Epic 4
│       │   └── searchService.ts      # 🆕 Epic 5
│       ├── types/
│       │   ├── application.ts, job.ts  # ✅ Existing
│       │   ├── interview.ts          # 🆕 Epic 2
│       │   ├── assessment.ts         # 🆕 Epic 3
│       │   ├── file.ts               # 🆕 Epic 1
│       │   ├── notification.ts       # 🆕 Epic 4
│       │   └── search.ts             # 🆕 Epic 5
│       └── styles/
│           └── globals.css           # ✅ Existing: Tailwind
│
├── docs/                              # ✅ Existing documentation
│   ├── PRD.md
│   ├── epics.md
│   ├── architecture.md               # 🆕 This document
│   └── ... (brownfield docs)
│
└── docker-compose.yml                 # ✅ Existing
```

---

## Epic to Architecture Mapping

| Epic | Backend Components | Frontend Components | Database Tables | Stories |
|------|-------------------|---------------------|-----------------|---------|
| **Epic 1: Enhanced Application Management** | `file_handler.go`, `s3_service.go`, `file_repository.go` | `FileUpload/`, `fileService.ts`, `s3.ts` | `files` | 1.1-1.6 |
| **Epic 2: Deep Interview Management** | `interview_handler.go`, `interviewer_handler.go`, `interview_question_handler.go`, `interview_note_handler.go`, `sanitizer_service.go` | `app/(app)/interviews/`, `RichTextEditor/`, `interviewService.ts`, `useAutoSave.ts` | `interviews`, `interviewers`, `interview_questions`, `interview_notes` | 2.1-2.12 |
| **Epic 3: Technical Assessment Tracking** | `assessment_handler.go`, `assessment_submission_handler.go` | `app/(app)/assessments/`, `assessmentService.ts` | `assessments`, `assessment_submissions` | 3.1-3.8 |
| **Epic 4: Workflow Automation & Timeline** | `dashboard_handler.go`, `timeline_handler.go`, `notification_handler.go`, `notification_service.go` | `app/(app)/dashboard/`, `app/(app)/timeline/`, `NotificationCenter/`, `dashboardService.ts`, `timelineService.ts` | `notifications`, `user_notification_preferences` | 4.1-4.6 |
| **Epic 5: Search, Discovery & Data Management** | `search_handler.go`, `export_handler.go`, `search_repository.go` | `GlobalSearch/`, `searchService.ts` | GIN indexes (no new tables) | 5.1-5.5 |
| **Epic 6: Polish, Performance & Production Readiness** | All handlers (optimization), testing infrastructure | All components (responsive, accessible), testing infrastructure | Performance indexes | 6.1-6.10 |

---

## Technology Stack Details

### Core Technologies

**Backend:**
- **Language:** Go 1.23
- **Web Framework:** Gin (existing)
- **Database:** PostgreSQL 15
- **ORM/Query:** GORM or sqlx (existing pattern)
- **Authentication:** JWT tokens (existing)
- **HTML Sanitization:** bluemonday (latest)
- **AWS SDK:** AWS SDK Go v2 (latest)

**Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Runtime:** React 18
- **Language:** TypeScript
- **UI Library:** shadcn/ui (15 existing components) + Radix UI
- **Styling:** Tailwind CSS
- **Rich Text:** TipTap 3.0+
- **HTML Sanitization:** DOMPurify 3.3.0+
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios (existing)
- **Authentication:** NextAuth v5 (existing)
- **AWS SDK:** @aws-sdk/client-s3 v3.927.0+

**Database:**
- **RDBMS:** PostgreSQL 15
- **Migrations:** golang-migrate
- **Search:** PostgreSQL Full-Text Search (GIN indexes)

**Infrastructure:**
- **File Storage:** AWS S3
- **Deployment:** Docker Compose (development), production TBD
- **Environment:** Docker containers

### Integration Points

**Frontend ↔ Backend:**
- Protocol: REST over HTTPS
- Authentication: JWT in Authorization header
- Format: JSON request/response
- Error Format: `{error: string, code: string, details?: object}`
- Date Format: ISO 8601 strings

**Backend ↔ Database:**
- Pattern: Repository layer (existing)
- Queries: Parameterized (no SQL injection)
- Soft Deletes: `deleted_at` column on all tables
- Timestamps: `created_at`, `updated_at` with triggers

**Backend ↔ AWS S3:**
- Pattern: Presigned URLs for direct client uploads
- SDK: AWS SDK Go v2
- Security: Bucket private, presigned URLs expire
- Metadata: Tracked in `files` table

**Frontend ↔ AWS S3:**
- Pattern: Direct upload using presigned URLs
- No AWS credentials on frontend
- Progress tracking: axios onUploadProgress
- Confirmation: Backend endpoint after upload completes

---

## Novel Pattern Designs

### Multi-Round Interview Context Pattern

**Problem:** Users need to see all previous interview rounds while editing the current round, without navigation or context switching. This is ditto's "magic moment" - the core differentiator.

**Solution:** Context sidebar with single-call data loading

#### Component Architecture

```
InterviewDetailPage (Round 2)
├── Header (Round badge, date, timeline)
├── Main Content (Grid Layout)
│   ├── LEFT COLUMN (70%) - PRIMARY ACTION ZONE
│   │   ├── Interviewers Section (editable)
│   │   ├── Questions & Answers (editable)
│   │   ├── Preparation Notes (Rich text, auto-save)
│   │   ├── Feedback Section (rich text)
│   │   └── Self-Assessment (optional)
│   │
│   └── RIGHT COLUMN (30%) - CONTEXT ZONE (read-only)
│       ├── Company Research (application-level, persistent)
│       │   └── [Edit] button → navigates to application page
│       │
│       └── Previous Rounds (collapsible)
│           ├── Round 1 (collapsed by default)
│           │   ├── Date, Interviewers
│           │   ├── Key Questions (preview)
│           │   ├── Feedback Summary
│           │   └── [View Full Details] → navigates to Round 1
│           └── [Future rounds grayed out if scheduled]
│
└── Footer Actions (Save & Close, Mark Complete, Schedule Next Round)
```

#### Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Application    Round 2 of 3 - Technical      │
├────────────────────────────────┬────────────────────────┤
│                                │                        │
│  PRIMARY (70%) - LEFT          │  CONTEXT (30%) - RIGHT│
│  ✏️ EDIT CURRENT ROUND          │  👁️ VIEW CONTEXT       │
│                                │                        │
│  Interviewers: [+ Add]         │  📋 Company Research   │
│  Questions & Answers:          │  ┌──────────────────┐ │
│  Q1: [Type here...]            │  │ Mission: Build.. │ │
│  A1: [Rich text editor]        │  │ Tech: React, Go  │ │
│                                │  └──────────────────┘ │
│  Preparation Notes:            │                        │
│  [TipTap rich text editor]     │  📅 Previous Rounds    │
│  [Auto-save: Saved ✓]          │  ▼ Round 1 (Oct 15)   │
│                                │    Phone Screen        │
│  Feedback Received:            │    Alice (Recruiter)   │
│  [Rich text editor]            │    Q: Tell me...       │
│                                │    [View Full] →       │
│                                │                        │
└────────────────────────────────┴────────────────────────┘
```

#### Mobile Layout (320-767px)

```
┌────────────────────────┐
│ [Current] [Context]    │  ← Tab navigation
├────────────────────────┤
│                        │
│  Active tab content    │
│  (scrollable)          │
│                        │
│  Default: "Current"    │
│  Swipe: switch tabs    │
│                        │
└────────────────────────┘
```

#### API Design

**Single Endpoint for Context:**
```
GET /api/interviews/:id/with-context

Response:
{
  "current_interview": {
    "id": 456,
    "application_id": 123,
    "round_number": 2,
    "interview_type": "technical",
    "scheduled_date": "2025-10-20",
    "interviewers": [...],
    "questions": [...],
    "notes": [...]
  },
  "previous_rounds": [
    {
      "id": 123,
      "round_number": 1,
      "interview_type": "phone_screen",
      "scheduled_date": "2025-10-15",
      "interviewers": ["Alice (Recruiter)"],
      "questions_preview": ["Tell me about yourself...", "Why this company?"],
      "feedback_summary": "Strong communication",
      "question_count": 5
    }
  ],
  "company_research": {
    "content": "<p>Company mission...</p>",
    "last_updated": "2025-10-14"
  },
  "application": {
    "company_name": "Acme Corp",
    "job_title": "Senior Engineer"
  }
}
```

#### Benefits

✅ **Zero context switching** - Everything on one page
✅ **Read-optimized for previous rounds** - Collapsed by default, expand on demand
✅ **Write-optimized for current round** - Full editing capabilities on left
✅ **Persistent company research** - Accessible from all rounds
✅ **Temporal awareness** - "3 days after Round 1" calculated and displayed
✅ **Performance optimized** - Single API call with selective loading
✅ **Mobile-friendly** - Tabs instead of columns

---

## Implementation Patterns

### Naming Conventions

**API Endpoints:**
```
Pattern: /api/{resource}/{id?}/{action?}
✅ /api/interviews (plural)
✅ /api/interviews/:id
✅ /api/interviews/:id/with-context
❌ /api/interview (singular)
❌ /api/getInterviews
```

**Database Tables:**
```
Pattern: lowercase, plural, snake_case
✅ interviews
✅ interview_questions
❌ Interview
❌ interviewQuestion
```

**Database Columns:**
```
Pattern: snake_case
Foreign Keys: {table_singular}_id
✅ user_id, application_id, interview_type
❌ userId, interviewType
```

**Go Files & Code:**
```
Files: snake_case.go
✅ interview_handler.go
✅ interview_repository.go
❌ interviewHandler.go

Structs: PascalCase
✅ type Interview struct { ... }
✅ func (h *InterviewHandler) CreateInterview(...)
```

**React/TypeScript Files & Code:**
```
Components: PascalCase.tsx
✅ InterviewForm.tsx
✅ RichTextEditor.tsx
❌ interview-form.tsx

Functions: camelCase
✅ const handleSubmit = () => { ... }
✅ export const useAutoSave = () => { ... }
```

### Structure Patterns

**Go Handler Pattern:**
```go
// internal/handlers/interview_handler.go
type InterviewHandler struct {
    interviewRepo repository.InterviewRepository
    // Dependencies injected via constructor
}

func NewInterviewHandler(repo repository.InterviewRepository) *InterviewHandler {
    return &InterviewHandler{interviewRepo: repo}
}

// CRUD order: Create, Get, List, Update, Delete
func (h *InterviewHandler) CreateInterview(c *gin.Context) { ... }
func (h *InterviewHandler) GetInterview(c *gin.Context) { ... }
func (h *InterviewHandler) ListInterviews(c *gin.Context) { ... }
func (h *InterviewHandler) UpdateInterview(c *gin.Context) { ... }
func (h *InterviewHandler) DeleteInterview(c *gin.Context) { ... }
// Special operations last
func (h *InterviewHandler) GetInterviewWithContext(c *gin.Context) { ... }
```

**React Component Pattern:**
```typescript
// 1. Imports
import { useState } from 'react';
import { useForm } from 'react-hook-form';

// 2. Types & Schemas
type InterviewFormData = { ... };

// 3. Props Interface
interface InterviewFormProps { ... }

// 4. Component
export const InterviewForm = (props: InterviewFormProps) => {
  // State
  const [isLoading, setIsLoading] = useState(false);

  // Hooks
  const { register, handleSubmit } = useForm<InterviewFormData>();

  // Handlers
  const onSubmit = async (data: InterviewFormData) => { ... };

  // Render
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
};
```

### Format Patterns

**API Request/Response:**
```json
// POST /api/interviews
Request:
{
  "application_id": 123,
  "round_number": 2,
  "interview_type": "technical",
  "scheduled_date": "2025-11-20"
}

Response (201 Created):
{
  "id": 456,
  "application_id": 123,
  "round_number": 2,
  "interview_type": "technical",
  "scheduled_date": "2025-11-20",
  "created_at": "2025-11-10T15:30:00Z",
  "updated_at": "2025-11-10T15:30:00Z"
}

Error (400 Bad Request):
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "scheduled_date": "Date is required"
  }
}
```

**Date/Time Format:**
```
Storage: DATE, TIME, TIMESTAMP (PostgreSQL)
API: ISO 8601 strings
  - Date: "2025-11-20"
  - DateTime: "2025-11-10T15:30:00Z" (UTC)
Display: Local timezone, formatted ("Nov 20, 2025", "2:00 PM")
```

**Enum Values:**
```
Database/API: snake_case
  - "phone_screen", "technical", "behavioral"
Go: const PhoneScreen = "phone_screen"
TypeScript: type InterviewType = 'phone_screen' | 'technical'
```

### Communication Patterns

**Frontend API Service:**
```typescript
// src/services/interviewService.ts
export const interviewService = {
  create: async (data: CreateInterviewDto): Promise<Interview> => {
    const response = await apiClient.post('/interviews', data);
    return response.data;
  },

  getById: async (id: number): Promise<Interview> => {
    const response = await apiClient.get(`/interviews/${id}`);
    return response.data;
  },

  getWithContext: async (id: number): Promise<InterviewWithContext> => {
    const response = await apiClient.get(`/interviews/${id}/with-context`);
    return response.data;
  },
};
```

**Error Handling:**
```typescript
// Frontend
try {
  const interview = await interviewService.create(data);
  toast.success('Interview created');
  router.push(`/interviews/${interview.id}`);
} catch (error) {
  if (axios.isAxiosError(error)) {
    toast.error(error.response?.data?.error || 'Failed to create');
  }
}

// Backend
func (h *InterviewHandler) CreateInterview(c *gin.Context) {
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid data", "code": "VALIDATION_ERROR"})
        return
    }
    // ...
    c.JSON(201, interview)
}
```

### Lifecycle Patterns

**Auto-Save Pattern:**
```typescript
// src/lib/hooks/useAutoSave.ts
export const useAutoSave = <T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  options = { debounceMs: 30000 }
) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const debouncedSave = useRef(
    debounce(async (newData: T) => {
      setSaveStatus('saving');
      try {
        await saveFunction(newData);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, options.debounceMs)
  ).current;

  useEffect(() => {
    if (hasChanged(data)) {
      debouncedSave(data);
    }
  }, [data]);

  return { saveStatus };
};

// Usage
const { saveStatus } = useAutoSave(
  noteContent,
  (content) => interviewService.updateNote(id, content)
);
```

**File Upload Pattern:**
```typescript
// 1. Request presigned URL
const { upload_url, file_id } = await fileService.getPresignedUrl({
  file_name: file.name,
  file_type: file.type,
  file_size: file.size,
  entity_type: 'interview',
  entity_id: interviewId,
});

// 2. Upload directly to S3
await axios.put(upload_url, file, {
  headers: { 'Content-Type': file.type },
  onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total))
});

// 3. Confirm upload
await fileService.confirmUpload(file_id);
```

---

## Consistency Rules

### Error Handling

**Backend:**
```go
// Standardized error response
type ErrorResponse struct {
    Error   string                 `json:"error"`
    Code    string                 `json:"code"`
    Details map[string]interface{} `json:"details,omitempty"`
}

// HTTP status codes
// 400: Bad Request (validation)
// 401: Unauthorized (missing/invalid token)
// 403: Forbidden (insufficient permissions)
// 404: Not Found
// 500: Internal Server Error (logged, generic message)
```

**Frontend:**
```typescript
// Toast for action errors
toast.error('Failed to create interview');

// Inline for validation errors
<span className="text-red-500">{errors.scheduled_date?.message}</span>

// Error boundaries for component crashes
```

### Logging Strategy

**Backend:**
```go
// Structured logging with levels
log.Printf("[INFO] User %d created interview %d", userID, interviewID)
log.Printf("[ERROR] Failed to create interview: %v", err)
log.Printf("[WARN] Slow query: %s took %dms", query, duration)

// Never log sensitive data (passwords, tokens, PII)
```

### Date/Time Handling

- **Storage:** UTC timestamps in PostgreSQL
- **API:** ISO 8601 format (`2025-11-10T15:30:00Z`)
- **Display:** User's local timezone (browser handles conversion)
- **Library:** Native `time` (Go), `Intl.DateTimeFormat` or `date-fns` (JS)

### Authentication Pattern

- **JWT access tokens:** 24-hour expiration
- **Refresh tokens:** Rotation on use
- **Middleware:** All protected routes use existing auth middleware
- **File access:** Presigned S3 URLs tied to user_id, backend validates ownership

### Pagination

```
Pattern: Offset-based
Query: ?page=1&per_page=20 (default: page=1, per_page=20, max: 100)
Response Meta:
{
  "meta": {
    "page": 1,
    "per_page": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

### Soft Deletes

- **Pattern:** `deleted_at` column on all entity tables
- **Queries:** Always filter `WHERE deleted_at IS NULL`
- **Cascade:** Soft delete related records (delete interview → soft delete questions, notes)

### Auto-Timestamps

- **Pattern:** `created_at`, `updated_at` on all tables
- **Mechanism:** Database triggers (existing pattern)

### Validation

- **Client:** React Hook Form + Zod (UX + basic validation)
- **Server:** Go struct tags + custom validators (security)
- **Rule:** Always validate on both client AND server

### Rich Text Sanitization

- **Backend:** bluemonday on POST/PUT (write-time sanitization)
- **Frontend:** DOMPurify before rendering (defense in depth)
- **Storage:** Sanitized HTML in database
- **Max Size:** 50KB per note field

---

## Data Architecture

### Database Schema (New Tables)

**Migration 000005: Interview System**
```sql
CREATE TABLE interviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    application_id BIGINT NOT NULL REFERENCES applications(id),
    round_number INT NOT NULL,
    interview_type VARCHAR(50) NOT NULL, -- phone_screen, technical, behavioral, panel, onsite, other
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    duration_minutes INT,
    outcome TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE interviewers (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL REFERENCES interviews(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE interview_questions (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL REFERENCES interviews(id),
    question_text TEXT NOT NULL,
    answer_text TEXT,
    "order" INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE interview_notes (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL REFERENCES interviews(id),
    note_type VARCHAR(50) NOT NULL, -- preparation, company_research, feedback, reflection, general
    content TEXT, -- Sanitized HTML
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_interviews_user_id ON interviews(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interviews_application_id ON interviews(application_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interviews_scheduled_date ON interviews(scheduled_date);
```

**Migration 000006: Assessment System**
```sql
CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    application_id BIGINT NOT NULL REFERENCES applications(id),
    assessment_type VARCHAR(50) NOT NULL, -- take_home_project, live_coding, system_design, data_structures, case_study, other
    title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started', -- not_started, in_progress, submitted, reviewed
    instructions TEXT,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE assessment_submissions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id),
    submission_type VARCHAR(50) NOT NULL, -- github, file_upload, notes
    github_url VARCHAR(500),
    file_id BIGINT REFERENCES files(id),
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
```

**Migration 000007: File System**
```sql
CREATE TABLE files (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    application_id BIGINT REFERENCES applications(id),
    interview_id BIGINT REFERENCES interviews(id),
    assessment_submission_id BIGINT REFERENCES assessment_submissions(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- bytes
    s3_key VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, uploaded, failed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_files_user_id ON files(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_application_id ON files(application_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_interview_id ON files(interview_id) WHERE deleted_at IS NULL;
```

**Migration 000008: Notification System**
```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- interview_reminder, assessment_deadline, system_alert
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE user_notification_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id),
    interview_24h BOOLEAN DEFAULT TRUE,
    interview_1h BOOLEAN DEFAULT TRUE,
    assessment_3d BOOLEAN DEFAULT TRUE,
    assessment_1d BOOLEAN DEFAULT TRUE,
    assessment_1h BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_read ON notifications(read);
```

**Migration 000009: Search Indexes**
```sql
-- Add GIN indexes for full-text search
CREATE INDEX idx_applications_company_gin ON applications USING GIN(to_tsvector('english', company_name));
CREATE INDEX idx_applications_title_gin ON applications USING GIN(to_tsvector('english', job_title));
CREATE INDEX idx_interview_questions_text_gin ON interview_questions USING GIN(to_tsvector('english', question_text));
CREATE INDEX idx_interview_notes_content_gin ON interview_notes USING GIN(to_tsvector('english', content));
```

### Entity Relationships

```
users (existing)
  ├── applications (existing)
  │     ├── interviews (new)
  │     │     ├── interviewers (new)
  │     │     ├── interview_questions (new)
  │     │     ├── interview_notes (new)
  │     │     └── files (new, nullable FK)
  │     ├── assessments (new)
  │     │     └── assessment_submissions (new)
  │     │           └── files (new, nullable FK)
  │     └── files (new, nullable FK)
  └── notifications (new)
  └── user_notification_preferences (new)
```

---

## API Contracts

### New Endpoints

**Interview Endpoints:**
```
POST   /api/interviews                    Create interview
GET    /api/interviews                    List interviews (with filters)
GET    /api/interviews/:id                Get interview by ID
GET    /api/interviews/:id/with-context   Get interview with previous rounds + company research
PUT    /api/interviews/:id                Update interview
DELETE /api/interviews/:id                Soft delete interview

POST   /api/interviews/:id/interviewers   Add interviewer
PUT    /api/interviewers/:id              Update interviewer
DELETE /api/interviewers/:id              Delete interviewer

POST   /api/interviews/:id/questions      Add question
PUT    /api/interview-questions/:id       Update question
DELETE /api/interview-questions/:id       Delete question

POST   /api/interviews/:id/notes          Add/update note
PUT    /api/interview-notes/:id           Update note
DELETE /api/interview-notes/:id           Delete note
```

**Assessment Endpoints:**
```
POST   /api/assessments                   Create assessment
GET    /api/assessments                   List assessments (with filters)
GET    /api/assessments/:id               Get assessment by ID
PUT    /api/assessments/:id               Update assessment
PATCH  /api/assessments/:id/status        Update status only
DELETE /api/assessments/:id               Soft delete assessment

POST   /api/assessments/:id/submissions   Add submission
```

**File Endpoints:**
```
POST   /api/files/presigned-url           Get presigned S3 URL + create file record
PUT    /api/files/:id/confirm             Confirm upload completed
GET    /api/files/:id                     Get file metadata (+ generate download URL)
DELETE /api/files/:id                     Soft delete file
```

**Timeline & Dashboard Endpoints:**
```
GET    /api/timeline                      Get upcoming interviews + assessments (merged, sorted)
GET    /api/dashboard/stats               Get application statistics
GET    /api/dashboard/upcoming            Get next 5 events
```

**Notification Endpoints:**
```
GET    /api/notifications                 List notifications (filter: read/unread)
PATCH  /api/notifications/:id/read        Mark as read
PATCH  /api/notifications/mark-all-read   Mark all as read
GET    /api/users/notification-preferences Get preferences
PUT    /api/users/notification-preferences Update preferences
```

**Search & Export Endpoints:**
```
GET    /api/search                        Global search (query param: ?q=keyword)
GET    /api/export/applications           Export applications to CSV
GET    /api/export/interviews             Export interviews to CSV
GET    /api/export/full                   Export all data to JSON
```

---

## Security Architecture

### Authentication & Authorization

- **JWT Tokens:** 24-hour expiration, refresh token rotation
- **OAuth:** GitHub, Google via NextAuth v5 (existing)
- **Authorization:** All queries filter by `user_id` from JWT
- **File Access:** Presigned S3 URLs validated against user_id ownership

### Input Validation

- **Client:** React Hook Form + Zod schemas
- **Server:** Go struct tags (`binding:"required"`) + custom validators
- **Rule:** Validate on both client (UX) and server (security)

### XSS Prevention

- **Backend:** bluemonday sanitizes HTML on write (POST/PUT)
- **Frontend:** DOMPurify sanitizes HTML before rendering
- **Defense in Depth:** Double sanitization prevents bypass

### SQL Injection Prevention

- **Method:** Parameterized queries only (GORM/sqlx)
- **Rule:** Never concatenate user input into SQL strings

### File Upload Security

- **Validation:** MIME type whitelist (PDF, DOCX, TXT, ZIP, PNG, JPG)
- **Size Limits:** 5MB default, 10MB for assessments
- **S3 Bucket:** Private (not public), presigned URLs expire
- **Ownership:** Backend validates file.user_id === authenticated_user.id

### HTTPS & Transport

- **TLS:** 1.2+ enforced in production
- **Redirect:** HTTP → HTTPS automatic
- **Headers:** Set Content-Security-Policy, X-Frame-Options, X-Content-Type-Options

---

## Performance Considerations

### Target Metrics (NFRs)

- **Dashboard load:** <2 seconds
- **API response:** 90% <500ms, 99% <2s
- **Auto-save:** <1 second (non-blocking)
- **Search:** <1 second for 1000+ records
- **File upload:** 5MB in <10s on 10 Mbps connection

### Optimization Strategies

**Database:**
- Indexes on all foreign keys, date columns, status enums
- GIN indexes for full-text search
- Pagination for large result sets (max 100 per page)
- Query optimization: JOINs instead of N+1 queries

**Backend:**
- Response caching for dashboard stats (5 min TTL)
- GZIP compression for API responses
- Slow query logging (>500ms)

**Frontend:**
- Code splitting by route (Next.js automatic)
- Lazy loading for TipTap editor (heavy component)
- Optimistic UI updates (assume success, rollback on error)
- Loading skeletons for better perceived performance
- Image optimization with Next.js Image component

**File Storage:**
- Direct client → S3 uploads (bypass backend)
- Presigned URLs reduce backend load
- Progress tracking for UX

---

## Deployment Architecture

### Development (Docker Compose)

```yaml
services:
  postgres:
    image: postgres:15
    ports: ["5432:5432"]

  backend:
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [postgres]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Production (TBD)

- **Backend:** VPS with Docker, or cloud platform (AWS, GCP, Azure)
- **Frontend:** Vercel (Next.js optimized) or Netlify
- **Database:** Managed PostgreSQL (AWS RDS, DigitalOcean Managed DB)
- **Storage:** AWS S3
- **Monitoring:** Basic logging (expand post-MVP)
- **Backups:** Daily database backups (7-day retention)

---

## Development Environment

### Prerequisites

- Docker & Docker Compose (recommended)
- Go 1.23+
- Node.js 18+
- PostgreSQL 15+ (if not using Docker)
- AWS account (for S3)

### Setup Commands

```bash
# Clone repository
git clone <repository-url>
cd ditto

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your AWS credentials and database config

# Start with Docker Compose (recommended)
docker-compose up -d

# Backend runs on http://localhost:8080
# Frontend runs on http://localhost:3000

# Run migrations
docker-compose exec backend migrate -path /migrations -database $DATABASE_URL up

# Run tests
docker-compose exec backend go test ./...
docker-compose exec frontend npm test
```

### Manual Setup (without Docker)

```bash
# Backend
cd backend
go mod download
migrate -path migrations -database "postgresql://..." up
go run cmd/server/main.go

# Frontend
cd frontend
npm install
npm run dev
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

**Implementation:** `GET /api/interviews/:id/with-context` returns current + previous rounds + company research in one response.

---

### ADR-005: Consolidated Migrations for New Feature Systems

**Decision:** Group related tables into feature system migrations (5 migrations instead of 9 individual table migrations).

**Rationale:**
- Clarity: Logical grouping by feature (interview system, assessment system)
- Atomic: All related tables created together
- Maintainability: Fewer migration files to track
- Rollback: Rarely need to rollback individual tables

**Pattern:**
- 000005_create_interview_system.up.sql (4 tables)
- 000006_create_assessment_system.up.sql (2 tables)
- 000007_create_file_system.up.sql (1 table)
- 000008_create_notification_system.up.sql (2 tables)
- 000009_add_search_indexes.up.sql (GIN indexes)

---

### ADR-006: In-App Notifications Only for MVP

**Decision:** Implement in-app notifications (database-backed) only. Defer browser push notifications to post-MVP.

**Rationale:**
- Sufficient: In-app notifications meet MVP requirements
- Complexity: Browser push requires service workers, permissions, infrastructure
- Focus: Prioritize core features over notification delivery mechanism
- User behavior: Active users will see in-app notifications

**Migration path:** Add browser push post-MVP if user feedback indicates need.

---

_Generated by BMAD Decision Architecture Workflow v1.3_
_Date: 2025-11-10_
_For: Simon_
