# Story 3.7: Assessment Deadline Integration with Timeline

Status: review

## Story

As a job seeker,
I want to see upcoming assessment deadlines in my timeline view,
so that I never miss a due date.

## Acceptance Criteria

1. Backend API supports listing all user assessments with application context (company_name, job_title) for dashboard integration
2. Application detail page timeline shows assessments alongside interviews, sorted chronologically
3. Each assessment in the application timeline shows: title, due date, countdown timer, and status
4. Overdue assessments (due_date in the past) are highlighted with red styling
5. Assessments due within 3 days are highlighted with orange/yellow styling to indicate urgency
6. Clicking an assessment in the timeline navigates to its detail page

## Tasks / Subtasks

- [x] Task 1: Add backend endpoint to list all user assessments with context (AC: 1)
  - [x] 1.1 Add `ListByUserID` method to assessment repository with JOIN to applications/jobs/companies
  - [x] 1.2 Update `GET /api/assessments` handler to work without application_id (returns all user assessments)
  - [x] 1.3 Return assessment data with company_name and job_title for dashboard use

- [x] Task 2: Update frontend assessment service (AC: 1)
  - [x] 2.1 Add `AssessmentWithContext` type including company_name and job_title
  - [x] 2.2 Add `listAllAssessments()` function that calls endpoint without application_id
  - [x] 2.3 Keep existing `listAssessments(applicationId)` for application-specific queries

- [x] Task 3: Update application detail page timeline to include assessments (AC: 2, 3, 6)
  - [x] 3.1 Update `buildTimeline()` function to accept assessments parameter
  - [x] 3.2 Add assessment events to timeline with "Assessment: {title}" format
  - [x] 3.3 Make assessment timeline items clickable to navigate to detail page

- [x] Task 4: Add urgency styling to application timeline (AC: 4, 5)
  - [x] 4.1 Add countdown calculation for assessments ("Due in X days", "Overdue")
  - [x] 4.2 Style overdue assessments with red dot and text
  - [x] 4.3 Style assessments due within 3 days with orange dot and text

- [x] Task 5: Testing and validation (AC: 1-6)
  - [x] 5.1 Test API returns all user assessments with application context
  - [x] 5.2 Test application timeline shows assessments alongside interviews
  - [x] 5.3 Test urgency styling appears correctly
  - [x] 5.4 Test clicking assessment navigates to detail page

## Dev Notes

- This story focuses on: (1) backend API for listing all assessments, (2) application detail page timeline integration
- Dashboard "Upcoming" widget UI is Epic 4's responsibility (Story 4-3: Upcoming items widget)
- Epic 4 will consume the `listAllAssessments()` API added in this story
- Use existing countdown calculation patterns from assessment detail page (Story 3.3)
- Assessment status badges follow same styling as assessment detail: gray (not_started), blue (in_progress), green (submitted), purple (reviewed)

### Project Structure Notes

- Modifies: `backend/internal/repository/assessment.go` (add ListByUserID method with application context)
- Modifies: `backend/internal/handlers/assessment.go` (update ListAssessments to work without application_id)
- Modifies: `frontend/src/services/assessment-service.ts` (add AssessmentWithContext type and listAllAssessments function)
- Modifies: `frontend/src/app/(app)/applications/[id]/page.tsx` (update buildTimeline to include assessments)

### Learnings from Previous Story

**From Story 3-6-submission-tracking-file-uploads (Status: done)**

- **AssessmentFileUpload Created**: Component at `frontend/src/components/submission-form/assessment-file-upload.tsx` with 10MB limit
- **DELETE Endpoint Added**: `DELETE /api/assessment-submissions/:submissionId` endpoint at `routes/assessment.go:27-31`
- **File Details Fetching**: SubmissionList fetches file details via `file_id` - similar pattern can be used for timeline enrichment
- **Type Handling**: SUBMISSION_TYPE_OPTIONS pattern at `assessment-service.ts:39` - use similar pattern for timeline type filter
- **Backend Validation**: File ownership validated before submission creation at `assessment.go:340-345` - maintain auth patterns
- **Response Patterns**: Use `response.Created()` for 201, standard JSON for 200 responses

[Source: stories/3-6-submission-tracking-file-uploads.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-3.md#AC-3.7] - Timeline integration acceptance criteria
- [Source: docs/tech-spec-epic-3.md#Timeline Enhancement] - GET /api/timeline type filter specification
- [Source: docs/epics.md#Story 3.7] - Story definition lines 886-917
- [Source: docs/architecture.md#Timeline & Dashboard Endpoints] - API design for timeline
- [Source: docs/stories/2-10-interview-list-and-timeline-view.md] - Existing timeline implementation patterns

## Dev Agent Record

### Context Reference

- docs/stories/3-7-assessment-deadline-integration-with-timeline.context.xml (generated 2026-02-04)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

**2026-02-04 - Scope Change:**
- Original plan: Create separate /timeline page with dedicated backend API
- Revised plan: Dashboard "Upcoming" widget (deferred to Epic 4) + app detail timeline
- This story: Backend API + application detail page timeline integration

**2026-02-04 - Implementation Plan:**
- Task 1: Add ListByUserID to assessment repository (with company_name, job_title JOIN)
- Task 2: Update handler to support listing all assessments (no application_id required)
- Task 3: Add listAllAssessments() to frontend service
- Task 4: Update application detail page buildTimeline() to include assessments
- Task 5: Add urgency styling (overdue=red, due soon=orange)

### Completion Notes List

- Backend: Added ListByUserID to assessment repository with JOIN to get company_name and job_title
- Backend: Updated ListAssessments handler to work without application_id, returning all user assessments with context
- Frontend: Added AssessmentWithContext type and listAllAssessments() function for Epic 4 dashboard
- Frontend: Updated application detail page timeline to show assessments with urgency styling (red=overdue, orange=due soon)
- Frontend: Timeline items are now clickable and navigate to detail pages
- Tests: Added ListByUserID test, all repository tests pass

### File List

- backend/internal/repository/assessment.go (added AssessmentWithContext type, ListByUserID method)
- backend/internal/handlers/assessment.go (updated ListAssessments to work without application_id)
- frontend/src/services/assessment-service.ts (added AssessmentWithContext type, listAllAssessments function)
- frontend/src/app/(app)/applications/[id]/page.tsx (updated buildTimeline to include assessments, added urgency styling)
- frontend/src/components/ui/badge.tsx (added assessment badge variants for future use)
- backend/internal/repository/assessment_test.go (added ListByUserID test)

## Change Log

- 2026-02-04: Scope changed from separate timeline page to Dashboard "Upcoming" section (better UX)
- 2026-02-04: Refined scope - Dashboard UI is Epic 4 (Story 4-3), this story provides API + app detail timeline
- 2026-02-04: Focus on: (1) backend API for all assessments with context, (2) application detail page timeline
- 2026-02-04: Senior Developer Review notes appended

---

## Senior Developer Review (AI)

### Reviewer
Simon

### Date
2026-02-04

### Outcome
**APPROVE** ✅

All acceptance criteria are fully implemented with evidence. All tasks marked complete have been verified through code inspection. The implementation follows existing architectural patterns and maintains proper security constraints.

### Summary

Story 3.7 successfully delivers assessment deadline integration with the application timeline. The backend API now supports listing all user assessments with application context (company_name, job_title), and the application detail page timeline displays assessments alongside interviews with proper urgency styling for overdue and due-soon items.

### Key Findings

**No issues found.** All implementation matches the acceptance criteria and task requirements.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | Backend API supports listing all user assessments with context | IMPLEMENTED | `backend/internal/repository/assessment.go:91-119` - AssessmentWithContext struct and ListByUserID method; `handlers/assessment.go:176-195` - handler branches on application_id |
| AC2 | Application detail page timeline shows assessments alongside interviews, sorted chronologically | IMPLEMENTED | `frontend/src/app/(app)/applications/[id]/page.tsx:53-107` - buildTimeline function combines and sorts |
| AC3 | Each assessment shows title, due date, countdown timer, and status | IMPLEMENTED | `page.tsx:80-98` - Timeline events include all required fields |
| AC4 | Overdue assessments highlighted with red styling | IMPLEMENTED | `page.tsx:84,109,423,427` - isOverdue flag, bg-red-500, text-red-400 |
| AC5 | Assessments due within 3 days highlighted with orange/yellow styling | IMPLEMENTED | `page.tsx:85,110,427` - isDueSoon flag, bg-orange-500, text-orange-400 |
| AC6 | Clicking assessment navigates to detail page | IMPLEMENTED | `page.tsx:96,438-444` - Link component with href to assessment detail |

**Summary: 6 of 6 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Status | Evidence |
|------|--------|----------|
| Task 1: Backend endpoint for all assessments with context | ✅ VERIFIED | ListByUserID method with JOIN, handler works without application_id |
| Task 2: Frontend assessment service | ✅ VERIFIED | AssessmentWithContext type, listAllAssessments() function added |
| Task 3: Application detail page timeline | ✅ VERIFIED | buildTimeline accepts assessments, "Assessment: {title}" format, clickable links |
| Task 4: Urgency styling | ✅ VERIFIED | Countdown calculation, red for overdue, orange for due-soon |
| Task 5: Testing and validation | ✅ VERIFIED | ListByUserID test at assessment_test.go:173-193 |

**Summary: 5 of 5 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- ✅ Backend unit test for `ListByUserID` added and passes
- ✅ Verifies CompanyName and JobTitle are populated
- ✅ Follows existing test patterns with test database
- Manual testing per story pattern for UI components (consistent with project testing strategy)

### Architectural Alignment

- ✅ Uses existing repository pattern (sqlx, UUID PKs, soft deletes)
- ✅ Handler follows existing error handling patterns
- ✅ All queries scoped to authenticated user_id
- ✅ Frontend service follows existing patterns
- ✅ Timeline integration reuses existing interview timeline patterns

### Security Notes

- ✅ User ID scoping maintained on ListByUserID query
- ✅ Application ownership validated in JOIN (deleted applications excluded)
- ✅ No direct user input in SQL queries (parameterized)

### Best-Practices and References

- Timeline countdown uses date-fns for calculations (consistent with project patterns)
- Assessment urgency logic: overdue = past due_date, due-soon = within 3 days
- Color coding follows design system: red for danger/overdue, orange for warning/urgent

### Action Items

**Code Changes Required:**
None - all acceptance criteria met.

**Advisory Notes:**
- Note: Consider adding E2E tests for timeline navigation in Epic 6 (Story 6.9)
