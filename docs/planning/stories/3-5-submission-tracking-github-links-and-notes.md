# Story 3.5: Submission Tracking - GitHub Links and Notes

Status: done

## Story

As a job seeker,
I want to record my assessment submission with GitHub links or notes,
so that I have a record of what I submitted and when.

## Acceptance Criteria

1. Clicking "Add Submission" button on assessment detail page opens a submission form modal
2. Submission form has type selector with options: GitHub, Notes (File type deferred to Story 3.6)
3. When GitHub type selected, form shows URL input field with format validation (must be valid URL)
4. When Notes type selected, form shows textarea for detailed submission description
5. Clicking "Save Submission" creates a submission record via `POST /api/assessments/:id/submissions` with automatic timestamp
6. Created submission appears in assessment detail view showing: type icon, GitHub link (clickable, opens in new tab), notes content, submitted timestamp
7. Multiple submissions can be added to the same assessment (e.g., multiple iterations or revisions)
8. Submission list displays chronologically (newest first)
9. When "Submitted" status is selected via AssessmentStatusSelect, the submission form modal opens automatically (integrates with Story 3.4's `onSubmittedSelect` callback)

## Tasks / Subtasks

- [x] Task 1: Create submission API endpoints (AC: 5, 6, 7)
  - [x] 1.1 Create `POST /api/assessments/:id/submissions` endpoint in `backend/internal/handlers/assessment.go`
  - [x] 1.2 Add `CreateSubmissionRequest` struct with validation: `submission_type` (required, oneof=github,notes), `github_url` (optional), `notes` (optional)
  - [x] 1.3 Implement handler logic: validate assessment ownership, create submission with `submitted_at` timestamp
  - [x] 1.4 Register route in `backend/internal/routes/assessment.go`
  - [x] 1.5 Add `CreateSubmission` method to assessment_submission repository (already existed - verified and used)

- [x] Task 2: Create frontend submission service functions (AC: 5)
  - [x] 2.1 Add `AssessmentSubmission` type to `frontend/src/services/assessment-service.ts` (already exists - verified)
  - [x] 2.2 Add `createSubmission(assessmentId: string, data: CreateSubmissionRequest)` function
  - [x] 2.3 Add `CreateSubmissionRequest` type: `{ submission_type: SubmissionType; github_url?: string; notes?: string }`
  - [x] 2.4 Add `SUBMISSION_TYPE_OPTIONS` constant for dropdown

- [x] Task 3: Create SubmissionForm component (AC: 1, 2, 3, 4, 5)
  - [x] 3.1 Create `frontend/src/components/submission-form/submission-form-modal.tsx`
  - [x] 3.2 Use shadcn Dialog for modal wrapper
  - [x] 3.3 Add submission type Select (GitHub, Notes options)
  - [x] 3.4 Conditional rendering: show URL input when GitHub selected, textarea when Notes selected
  - [x] 3.5 Add URL validation (client-side) - must start with http:// or https://
  - [x] 3.6 Add form submission handler calling `createSubmission`
  - [x] 3.7 Create barrel export `frontend/src/components/submission-form/index.ts`

- [x] Task 4: Create SubmissionList component (AC: 6, 7, 8)
  - [x] 4.1 Create `frontend/src/components/submission-list/submission-list.tsx`
  - [x] 4.2 Display submissions as cards with: type icon (GitHub/Notes), content, timestamp
  - [x] 4.3 GitHub submissions: render clickable link that opens in new tab
  - [x] 4.4 Notes submissions: render text content (with truncation and expand)
  - [x] 4.5 Sort chronologically (newest first) - handled by backend ORDER BY submitted_at DESC
  - [x] 4.6 Create barrel export `frontend/src/components/submission-list/index.ts`

- [x] Task 5: Integrate submission UI into assessment detail page (AC: 1, 6, 9)
  - [x] 5.1 Add "Add Submission" button to assessment detail page
  - [x] 5.2 Add state for modal open/close: `isSubmissionModalOpen`
  - [x] 5.3 Wire `onSubmittedSelect` callback from AssessmentStatusSelect to open submission modal
  - [x] 5.4 Fetch submissions when loading assessment (via `GET /api/assessments/:id/details`)
  - [x] 5.5 Render SubmissionList component showing all submissions
  - [x] 5.6 Refresh submission list after successful submission creation (optimistic update)

- [x] Task 6: Add GET endpoint for assessment with submissions (AC: 6)
  - [x] 6.1 Create `GET /api/assessments/:id/details` endpoint returning assessment with submissions array
  - [x] 6.2 Add `GetAssessmentWithSubmissions` repository method (used existing ListByAssessmentID from submission repo)
  - [x] 6.3 Add `getAssessmentDetails(id: string)` service function returning `AssessmentWithSubmissions`

- [x] Task 7: Testing and validation (AC: 1-9)
  - [x] 7.1 Test "Add Submission" button opens modal
  - [x] 7.2 Test GitHub type shows URL input, Notes type shows textarea
  - [x] 7.3 Test URL validation rejects invalid URLs
  - [x] 7.4 Test successful submission creates record and appears in list
  - [x] 7.5 Test multiple submissions can be added
  - [x] 7.6 Test "Submitted" status change triggers submission modal
  - [x] 7.7 Test GitHub links open in new tab

## Dev Notes

- Backend `assessment_submissions` table already exists from Story 3.1 migration
- `SubmissionType` already defined in `assessment-service.ts` as `'github' | 'file_upload' | 'notes'`
- File upload type is OUT OF SCOPE for this story - deferred to Story 3.6
- Use existing shadcn Dialog, Select, Input, Textarea components
- Follow optimistic update pattern: show submission immediately, revert on error
- GitHub URL validation: client-side format check only (don't verify repo exists per tech-spec assumption A3)

### Project Structure Notes

- New components: `frontend/src/components/submission-form/`, `frontend/src/components/submission-list/`
- Modifies: `frontend/src/app/(app)/applications/[id]/assessments/[assessmentId]/page.tsx`
- Modifies: `backend/internal/handlers/assessment.go` (add submission endpoints)
- Modifies: `backend/internal/routes/assessment.go` (register new routes)
- New repository: `backend/internal/repository/assessment_submission.go` (may already exist partially)

### Learnings from Previous Story

**From Story 3-4-assessment-status-management-and-workflow (Status: done)**

- **Callback Ready**: `onSubmittedSelect` callback is already wired in `page.tsx:94-99` - sets `showSubmissionPrompt` state to true
- **State Available**: `showSubmissionPrompt` state at `page.tsx:54` ready to trigger modal
- **TODO Comment**: `page.tsx:95` has TODO comment pointing to this story for implementation
- **Patterns**: Optimistic UI updates with error rollback pattern established
- **Toast**: Use `toast.success()` and `toast.error()` from sonner for feedback

[Source: stories/3-4-assessment-status-management-and-workflow.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-3.md#AC-3.5] - Acceptance criteria for submission tracking
- [Source: docs/tech-spec-epic-3.md#Submission Endpoints] - API design lines 226-231
- [Source: docs/tech-spec-epic-3.md#Status Transition Flow] - Workflow lines 262-267
- [Source: docs/epics.md#Story 3.5] - Story definition lines 819-852
- [Source: frontend/src/services/assessment-service.ts] - Existing types and service layer

## Dev Agent Record

### Context Reference

- `docs/stories/3-5-submission-tracking-github-links-and-notes.context.xml`

### Agent Model Used

Claude Opus 4.5

### Debug Log References

**2026-02-04 - Implementation Plan**
- Task 1: Add CreateSubmission handler to assessment.go with request validation (oneof=github,notes), inject submission repo, call existing CreateSubmission method
- Task 2: Add createSubmission service function and SUBMISSION_TYPE_OPTIONS constant to assessment-service.ts
- Task 3: Create SubmissionFormModal component using shadcn Dialog/Select/Input/Textarea with conditional rendering
- Task 4: Create SubmissionList component with type icons, clickable GitHub links, expandable notes
- Task 5: Integrate into assessment detail page - wire showSubmissionPrompt state to modal, fetch submissions
- Task 6: Add GetAssessmentDetails endpoint returning assessment + submissions
- Task 7: Manual testing of all ACs

### Completion Notes List

- Implemented full submission tracking feature for GitHub links and notes
- Backend: Added CreateSubmission and GetAssessmentDetails handlers with validation
- Frontend: Created SubmissionFormModal with conditional fields based on type selection
- Frontend: Created SubmissionList with expandable notes and clickable GitHub links
- Integrated into assessment detail page with "Add Submission" button and automatic modal trigger on "Submitted" status
- Added response.Created function to backend response package for 201 status codes
- Fixed bug in response.SuccessWithStatus where status parameter was ignored

### File List

**New Files:**
- frontend/src/components/submission-form/submission-form-modal.tsx
- frontend/src/components/submission-form/index.ts
- frontend/src/components/submission-list/submission-list.tsx
- frontend/src/components/submission-list/index.ts

**Modified Files:**
- backend/internal/handlers/assessment.go (added CreateSubmission, GetAssessmentDetails handlers, CreateSubmissionRequest struct, injected submission repo)
- backend/internal/routes/assessment.go (registered POST /:id/submissions and GET /:id/details routes)
- backend/pkg/response/response.go (added Created function, fixed SuccessWithStatus bug)
- frontend/src/services/assessment-service.ts (added SUBMISSION_TYPE_OPTIONS, CreateSubmissionRequest, AssessmentWithSubmissions, createSubmission, getAssessmentDetails)
- frontend/src/app/(app)/applications/[id]/assessments/[assessmentId]/page.tsx (integrated SubmissionFormModal, SubmissionList, wired onSubmittedSelect)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-04 | Senior Developer Review notes appended | Simon |

---

## Senior Developer Review (AI)

### Reviewer
Simon

### Date
2026-02-04

### Outcome
**APPROVE**

All acceptance criteria implemented, all tasks verified complete, no blocking issues. Two LOW severity validation gaps were identified and fixed during review.

### Summary
Story 3.5 implements submission tracking for GitHub links and notes on assessments. The implementation follows established patterns, includes proper validation on both client and server, and integrates smoothly with the existing assessment detail page. The "Submitted" status trigger for opening the submission modal works correctly.

### Key Findings

**Resolved During Review:**
- [Low] Added notes validation when notes type selected (frontend Zod schema)
- [Low] Added backend validation requiring notes content for notes submissions

No remaining findings.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1 | "Add Submission" button opens modal | IMPLEMENTED | `page.tsx:261-267, 276-281` |
| 2 | Type selector with GitHub, Notes options | IMPLEMENTED | `submission-form-modal.tsx:144-156`, `assessment-service.ts:35-41` |
| 3 | GitHub type shows URL input with validation | IMPLEMENTED | `submission-form-modal.tsx:164-187, 43-57` |
| 4 | Notes type shows textarea | IMPLEMENTED | `submission-form-modal.tsx:189-207` |
| 5 | Save creates submission via POST with timestamp | IMPLEMENTED | `assessment.go:293-346`, `assessment_submission.go:23-44` |
| 6 | Submission displays type icon, link, notes, timestamp | IMPLEMENTED | `submission-list.tsx:15-93` |
| 7 | Multiple submissions per assessment | IMPLEMENTED | `assessment_submission.go:46-63`, `page.tsx:101-103` |
| 8 | List sorted newest first | IMPLEMENTED | `assessment_submission.go:53` - ORDER BY submitted_at DESC |
| 9 | "Submitted" status triggers modal | IMPLEMENTED | `page.tsx:97-99, 208-213` |

**Summary: 9 of 9 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Subtasks | Verified |
|------|----------|----------|
| Task 1: Create submission API endpoints | 5/5 | ✅ |
| Task 2: Create frontend service functions | 4/4 | ✅ |
| Task 3: Create SubmissionForm component | 7/7 | ✅ |
| Task 4: Create SubmissionList component | 6/6 | ✅ |
| Task 5: Integrate into assessment detail | 6/6 | ✅ |
| Task 6: Add GET details endpoint | 3/3 | ✅ |
| Task 7: Testing and validation | 7/7 | ✅ |

**Summary: 31 of 31 completed tasks verified, 0 falsely marked complete**

### Test Coverage and Gaps
- Manual testing performed via dev server (per project standards)
- No automated tests added (acceptable per standards, consider for Epic 6)

### Architectural Alignment
- ✅ Repository pattern with sqlx
- ✅ Handler pattern matches existing code
- ✅ Component structure follows conventions
- ✅ Client + server validation
- ✅ Optimistic UI updates with error rollback

### Security Notes
- ✅ URL validation on client and server
- ✅ Assessment ownership validated before submission creation
- ✅ Parameterized queries prevent SQL injection
- ✅ Notes rendered safely (no dangerouslySetInnerHTML)

### Action Items
None - all issues resolved during review.
