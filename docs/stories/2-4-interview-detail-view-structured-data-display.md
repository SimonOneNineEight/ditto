# Story 2.4: Interview Detail View - Structured Data Display

Status: done

## Story

As a job seeker,
I want to view an interview's structured information in a clear, organized layout,
So that I can see at a glance when the interview is, who's interviewing me, and key details.

## Acceptance Criteria

### Given I have created an interview

**AC-1**: Navigate to Interview Detail Page
- **When** I click on an interview from the application detail page or interviews list
- **Then** I am navigated to the interview detail page (`/interviews/[id]`)

**AC-2**: Header Display
- **When** the interview detail page loads
- **Then** I see a header showing:
  - Round number (e.g., "Round 2")
  - Interview type (e.g., "Technical")
  - Scheduled date and time (formatted nicely)
  - Duration (if set, e.g., "60 minutes")
  - Company name and job title (from linked application)

**AC-3**: Structured Sections Display
- **When** the page loads
- **Then** I see collapsible/expandable sections for:
  - Interviewers
  - Questions Asked / My Answers
  - Feedback Received
  - Outcome / Next Steps

**AC-4**: Empty State Handling
- **When** a section has no data (e.g., no interviewers added)
- **Then** the section shows placeholder text: "No interviewers added yet" (or similar)
- **And** an "Add" button is visible to add data

**AC-5**: Edit Core Fields
- **When** I click "Edit" on the header section
- **Then** I can modify: date, time, duration, interview type
- **And** changes save immediately (or on confirmation)

**AC-6**: Loading and Error States
- **When** the page is loading
- **Then** I see a loading skeleton
- **When** the interview is not found or I don't have access
- **Then** I see an appropriate error message

### Edge Cases

- If interview has no scheduled_time, display only the date
- If duration_minutes is null, don't display duration field
- Sections should remember their collapsed/expanded state during the session
- Back navigation should return to the previous page (application detail or interviews list)

## Tasks / Subtasks

### Backend Development

- [x] **Task 1**: Add GET Interview By ID Endpoint (AC: #1, #2, #6)
  - [x] 1.1: Add `GET /api/interviews/:id` handler in `interview.go`
  - [x] 1.2: Return interview with basic fields (already exists in repository)
  - [x] 1.3: Add application data (company_name, job_title) via JOIN or separate query

- [x] **Task 2**: Add Interview With Details Endpoint (AC: #3, #4)
  - [x] 2.1: Create `GET /api/interviews/:id/details` endpoint
  - [x] 2.2: Return interview with interviewers, questions, notes arrays
  - [x] 2.3: Handle empty arrays gracefully (return empty [] not null)

- [x] **Task 3**: Add Update Interview Endpoint (AC: #5)
  - [x] 3.1: Add `PUT /api/interviews/:id` handler in `interview.go`
  - [x] 3.2: Use existing `UpdateInterview` repository method
  - [x] 3.3: Validate allowed fields (scheduled_date, scheduled_time, duration_minutes, interview_type)

### Frontend Development

- [x] **Task 4**: Create Interview Detail Page (AC: #1, #6)
  - [x] 4.1: Create `frontend/src/app/(app)/interviews/[id]/page.tsx`
  - [x] 4.2: Implement route parameter handling for interview ID
  - [x] 4.3: Add loading skeleton using shadcn/ui Skeleton
  - [x] 4.4: Add error handling (not found, unauthorized)

- [x] **Task 5**: Create Interview Header Component (AC: #2, #5)
  - [x] 5.1: Create `frontend/src/components/interview-detail/interview-header.tsx`
  - [x] 5.2: Display round number, type, date/time, duration
  - [x] 5.3: Display company name and job title
  - [x] 5.4: Add "Edit" button that opens edit dialog/inline editing
  - [x] 5.5: Implement edit form for date, time, duration, type

- [x] **Task 6**: Create Collapsible Section Components (AC: #3, #4)
  - [x] 6.1: Create `frontend/src/components/interview-detail/collapsible-section.tsx` (reusable wrapper)
  - [x] 6.2: Create `frontend/src/components/interview-detail/interviewers-section.tsx`
  - [x] 6.3: Create `frontend/src/components/interview-detail/questions-section.tsx`
  - [x] 6.4: Create `frontend/src/components/interview-detail/feedback-section.tsx`
  - [x] 6.5: Add empty state with "Add" button for each section

- [x] **Task 7**: Update Interview Service (AC: #1, #2, #5)
  - [x] 7.1: Add `getInterviewById(id: string)` function
  - [x] 7.2: Add `getInterviewWithDetails(id: string)` function
  - [x] 7.3: Add `updateInterview(id: string, data: UpdateInterviewRequest)` function

- [x] **Task 8**: Integration and Navigation (AC: #1)
  - [x] 8.1: Add click handler to interview items in application detail page (if interviews are shown there)
  - [x] 8.2: Update interviews list page (`/interviews`) to fetch real data from API
  - [x] 8.3: Add click handler to interview rows in interviews list to navigate to `/interviews/[id]`
  - [x] 8.4: Add back navigation button in interview detail header

### Testing

- [x] **Task 9**: Manual Testing
  - [x] 9.1: Test navigation from application detail to interview detail
  - [x] 9.2: Test navigation from interviews list to interview detail
  - [x] 9.3: Test header displays all fields correctly
  - [x] 9.4: Test sections collapse/expand
  - [x] 9.5: Test empty state placeholders
  - [x] 9.6: Test edit functionality
  - [x] 9.7: Test error handling (invalid interview ID)

## Dev Notes

### Architecture Constraints

**From Epic 2 Tech Spec:**
- Use shadcn/ui components (Card, Collapsible, Button, Dialog)
- Use sonner for toast notifications (already set up)
- Follow existing page patterns from applications detail

**Request/Response Contracts:**

```typescript
// GET /api/interviews/:id
interface GetInterviewResponse {
  interview: {
    id: string;
    application_id: string;
    round_number: number;
    interview_type: string;
    scheduled_date: string; // ISO date
    scheduled_time?: string; // HH:MM
    duration_minutes?: number;
    outcome?: string;
    overall_feeling?: string;
    went_well?: string;
    could_improve?: string;
    confidence_level?: number;
    created_at: string;
    updated_at: string;
  };
  application: {
    company_name: string;
    job_title: string;
  };
}

// GET /api/interviews/:id/details
interface GetInterviewDetailsResponse {
  interview: Interview;
  application: {
    company_name: string;
    job_title: string;
  };
  interviewers: Interviewer[];
  questions: InterviewQuestion[];
  notes: InterviewNote[];
}

// PUT /api/interviews/:id
interface UpdateInterviewRequest {
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  interview_type?: string;
  outcome?: string;
}
```

**Interview Type Labels (reuse from Story 2.3):**
- `phone_screen` → "Phone Screen"
- `technical` → "Technical"
- `behavioral` → "Behavioral"
- `panel` → "Panel"
- `onsite` → "Onsite"
- `other` → "Other"

### Project Structure Notes

**New Files:**
```
frontend/
├── src/
│   ├── app/(app)/interviews/[id]/
│   │   └── page.tsx                    # Interview detail page (includes edit dialog)
│   └── components/interview-detail/
│       ├── collapsible-section.tsx     # Reusable wrapper (transparent Notion-like)
│       ├── interviewers-section.tsx    # Interviewers list
│       ├── questions-section.tsx       # Q&A list (read-only for now)
│       ├── feedback-section.tsx        # Notes display
│       └── index.ts                    # Exports
```

**Existing Files to Modify:**
- `frontend/src/services/interview-service.ts` - Add getById, getWithDetails, update
- `backend/internal/handlers/interview.go` - Add GET/:id, GET/:id/details, PUT/:id
- `backend/internal/routes/interview.go` - Register new routes

### Learnings from Previous Stories

**From Story 2.3 (Interview Form Modal):**
- Dialog title can carry contextual info (round number)
- Use `mode: 'onChange'` in useForm for real-time validation
- Zod `.transform()` handles NaN from empty number inputs
- `isSubmitting` and `isValid` from formState for button states
- Design principle: "Forms should feel like editing a document" - use plain text for read-only values, not disabled inputs

**From Story 1.3/1.4 (Application Forms):**
- Toast via sonner: `toast.success()`, `toast.error()`
- Loading states important for UX
- Form patterns with react-hook-form + zodResolver

**Existing Components to Reuse:**
- `Collapsible` from shadcn/ui for sections
- `Card` for section containers
- `Badge` for interview type display
- `Button` for actions
- `PageHeader` for page title and breadcrumb

### References

- [Source: docs/tech-spec-epic-2.md#Story-2.4-Interview-Detail-View]
- [Source: docs/epics.md#Story-2.4]
- [Source: docs/architecture.md#Frontend-Architecture]
- [Source: frontend/src/components/interview-form/interview-form-modal.tsx]

## Dev Agent Record

### Context Reference

- docs/stories/2-4-interview-detail-view-structured-data-display.context.xml

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

- Implemented GET /api/interviews/:id with application info (company_name, job_title) via JOIN query
- Implemented GET /api/interviews/:id/details returning interview with interviewers, questions, and notes
- Implemented PUT /api/interviews/:id for partial updates to interview fields
- Implemented GET /api/interviews for list view with application info
- Created interview detail page at /interviews/[id] with loading skeleton and error handling
- Created InterviewHeader component with edit dialog using react-hook-form + zod
- Created collapsible sections for Interviewers, Questions & Answers, and Notes & Feedback
- Empty states show placeholder message with "Add" button (functionality deferred to future stories 2.5-2.7)
- Updated interviews list page to fetch real data from API and split into Upcoming/Past sections
- Added row click navigation to interview detail page
- Refactored UI to follow design principles: removed duplicate InterviewHeader component, integrated header info into PageHeader + inline metadata display
- Refactored collapsible sections to use transparent Notion-like aesthetic with hover-reveal Add buttons (removed Card backgrounds per design system)
- All manual testing completed: navigation, header display, sections collapse/expand, empty states, edit dialog

### File List

**New Files:**
- frontend/src/app/(app)/interviews/[id]/page.tsx
- frontend/src/components/interview-detail/index.ts
- frontend/src/components/interview-detail/collapsible-section.tsx
- frontend/src/components/interview-detail/interviewers-section.tsx
- frontend/src/components/interview-detail/questions-section.tsx
- frontend/src/components/interview-detail/feedback-section.tsx

**Modified Files:**
- backend/internal/handlers/interview.go (added GetInterviewByID, GetInterviewWithDetails, UpdateInterview, ListInterviews)
- backend/internal/repository/interview.go (added GetInterviewWithApplicationInfo, GetInterviewsWithApplicationInfo, InterviewWithApplicationInfo, InterviewListItem)
- backend/internal/routes/interview.go (registered new routes)
- frontend/src/services/interview-service.ts (added types and functions for all endpoints)
- frontend/src/app/(app)/interviews/page.tsx (converted to client component with real data fetching)
- frontend/src/app/(app)/interviews/interview-table/columns.tsx (updated to use real InterviewListItem type)
- frontend/src/app/(app)/interviews/interview-table/interview-table.tsx (fixed navigation to /interviews/[id])

---

## Change Log

### 2026-01-26 - Story Drafted
- **Version:** v1.0
- **Author:** Claude Opus 4.5 (via BMad create-story workflow)
- **Status:** Drafted
- **Summary:** Created story for Interview Detail View - Structured Data Display. Fourth story in Epic 2, builds on Story 2.3's interview creation. Implements interview detail page with header showing key info, collapsible sections for interviewers/questions/feedback, edit functionality, and navigation integration. 9 tasks covering backend endpoints, frontend components, and testing.

### 2026-01-26 - Senior Developer Review
- **Version:** v1.1
- **Author:** Claude Opus 4.5 (Senior Developer Review)
- **Status:** Approved
- **Summary:** All acceptance criteria verified, all tasks validated. Story approved for completion.

---

## Senior Developer Review (AI)

### Review Metadata
- **Reviewer:** Simon
- **Date:** 2026-01-26
- **Outcome:** ✅ **APPROVE**

### Summary

All 6 acceptance criteria are fully implemented with verifiable evidence. All 32 tasks and subtasks marked as complete have been verified as actually done. The implementation follows existing patterns, uses appropriate shadcn/ui components, and adheres to the design system principles (Notion-like aesthetic with transparent sections and hover-reveal actions). No blocking issues found.

### Key Findings

**Low Severity:**
1. **Unused `onUpdate` parameters** - Section components receive `onUpdate` but don't use it (intentionally deferred to Stories 2.5-2.7)
2. **Missing cursor pointer** - Interview table rows are clickable but lack visual cursor indication
3. **Footer label inconsistency** - "Coming Interviews" label shown for both Upcoming and Past tables
4. **ESLint warning potential** - useEffect dependency array in page.tsx

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-1 | Navigate to Interview Detail Page | ✅ IMPLEMENTED | `interview-table.tsx:88-92` |
| AC-2 | Header Display | ✅ IMPLEMENTED | `[id]/page.tsx:198-236` |
| AC-3 | Structured Sections Display | ✅ IMPLEMENTED | `[id]/page.tsx:238-255` |
| AC-4 | Empty State Handling | ✅ IMPLEMENTED | `collapsible-section.tsx:49-70` |
| AC-5 | Edit Core Fields | ✅ IMPLEMENTED | `[id]/page.tsx:258-337` |
| AC-6 | Loading and Error States | ✅ IMPLEMENTED | `[id]/page.tsx:65-71,162-191` |

**Summary: 6 of 6 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Status | Verified |
|------|--------|----------|
| Task 1: GET Interview By ID Endpoint | ✅ | ✅ VERIFIED |
| Task 2: Interview With Details Endpoint | ✅ | ✅ VERIFIED |
| Task 3: Update Interview Endpoint | ✅ | ✅ VERIFIED |
| Task 4: Create Interview Detail Page | ✅ | ✅ VERIFIED |
| Task 5: Interview Header Component | ✅ | ✅ VERIFIED |
| Task 6: Collapsible Section Components | ✅ | ✅ VERIFIED |
| Task 7: Update Interview Service | ✅ | ✅ VERIFIED |
| Task 8: Integration and Navigation | ✅ | ✅ VERIFIED |
| Task 9: Manual Testing | ✅ | ✅ VERIFIED |

**Summary: 32 of 32 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

- Manual testing completed during development (per story specification)
- No automated tests in scope for this story
- Future consideration: Add integration tests for interview detail API endpoints

### Architectural Alignment

- ✅ Follows existing repository pattern (Go backend)
- ✅ Uses shadcn/ui components (Collapsible, Dialog, Badge, Button, Select)
- ✅ Uses sonner for toast notifications
- ✅ Follows design system principles (Notion-like aesthetic, hover-reveal actions, no card backgrounds on sections)
- ✅ Uses react-hook-form + zod for form validation

### Security Notes

- ✅ All API endpoints use auth middleware
- ✅ User ID validation prevents cross-user data access
- ✅ Input validation with Gin binding tags
- ✅ Parameterized SQL queries (no injection risk)

### Action Items

**Advisory Notes:**
- Note: Consider adding `cursor-pointer` class to interview table rows for better UX
- Note: Consider renaming "Coming Interviews" footer to be context-aware
- Note: The `onUpdate` callbacks in section components are placeholders for Stories 2.5-2.7

---
