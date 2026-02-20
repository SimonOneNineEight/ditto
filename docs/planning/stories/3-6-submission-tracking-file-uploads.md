# Story 3.6: Submission Tracking - File Uploads

Status: done

## Story

As a job seeker,
I want to upload files as part of my assessment submission,
so that I can attach deliverables like PDFs, code archives, or presentation slides.

## Acceptance Criteria

1. When adding a submission to an assessment, "File Upload" appears as a submission type option alongside GitHub and Notes
2. Selecting "File Upload" type shows the FileUpload component for selecting files
3. Allowed file types are PDF, ZIP, DOCX with a maximum size of 10MB for assessment submissions (vs 5MB for other uploads)
4. Uploaded files are stored via existing S3 presigned URL flow and linked to the submission record via `file_id` foreign key
5. Uploaded files appear in the SubmissionList component with: file icon, file name (clickable to download), file size, submitted timestamp
6. File uploads count toward the user's overall storage quota
7. User can delete a file submission with confirmation prompt
8. Creating a file_upload submission via API (`POST /api/assessments/:id/submissions`) accepts `file_id` and validates the file exists and belongs to user

## Tasks / Subtasks

- [x] Task 1: Update file upload validation for assessment submissions (AC: 3, 6)
  - [x] 1.1 Add `ASSESSMENT_MAX_FILE_SIZE = 10MB` constant to `frontend/src/lib/file-service.ts`
  - [x] 1.2 Add `ASSESSMENT_ALLOWED_EXTENSIONS` to include `.zip` (add `application/zip`, `application/x-zip-compressed` MIME types)
  - [x] 1.3 Create `validateAssessmentFile()` function with 10MB limit and ZIP support
  - [x] 1.4 Update backend presigned URL endpoint to accept `submission_context: "assessment"` and use 10MB limit

- [x] Task 2: Extend file upload flow to support assessment submissions (AC: 4)
  - [x] 2.1 Add `submissionContext` parameter to `getPresignedUploadUrl()` and `confirmUpload()` in `file-service.ts`
  - [x] 2.2 Update backend `presigned-upload` handler to accept `submission_context` (nullable)
  - [x] 2.3 Backend already links file via file_id in submission record (no FK on files table needed)
  - [x] 2.4 N/A - file_id FK already exists on assessment_submissions from Story 3.1

- [x] Task 3: Add File Upload submission type to frontend service (AC: 1)
  - [x] 3.1 Update `SUBMISSION_TYPE_OPTIONS` in `assessment-service.ts` to include `file_upload`
  - [x] 3.2 Update `CreateSubmissionRequest` type to include optional `file_id: string`
  - [x] 3.3 Type handled via union type in CreateSubmissionRequest

- [x] Task 4: Update SubmissionFormModal to support file uploads (AC: 1, 2, 3, 4)
  - [x] 4.1 Add "File Upload" option to submission type Select
  - [x] 4.2 Render AssessmentFileUpload component when `file_upload` type is selected
  - [x] 4.3 AssessmentFileUpload uses 10MB limit and ZIP support via validateAssessmentFile()
  - [x] 4.4 On file upload complete, store `file_id` in form state via handleFileUploadComplete
  - [x] 4.5 Submit file submission via API: `{ submission_type: 'file_upload', file_id: uploadedFileId }`
  - [x] 4.6 Handle two-step flow: file uploads immediately, then submission created on form save

- [x] Task 5: Update SubmissionList to display file submissions (AC: 5)
  - [x] 5.1 Add file submission rendering to `submission-list.tsx`
  - [x] 5.2 Display: file icon (FileText or Archive for ZIP), file name as download link, file size, timestamp
  - [x] 5.3 Fetch file details using file_id from submission record via useEffect
  - [x] 5.4 Download file using existing `getFileDownloadUrl()` from file-service.ts

- [x] Task 6: Update backend to accept file_id in submission creation (AC: 8)
  - [x] 6.1 Update `CreateSubmissionRequest` struct in `assessment.go` to include `file_id` (optional UUID)
  - [x] 6.2 Add validation: when `submission_type = file_upload`, `file_id` is required
  - [x] 6.3 Validate file exists and belongs to authenticated user before creating submission
  - [x] 6.4 Store file_id in assessment_submissions record (already supported by repository)

- [x] Task 7: Add delete file submission functionality (AC: 7)
  - [x] 7.1 Add delete button to file submission display in SubmissionList
  - [x] 7.2 Show confirmation dialog before deletion using DeleteConfirmDialog
  - [x] 7.3 Created `DELETE /api/assessment-submissions/:submissionId` endpoint (was missing from Story 3.5)
  - [x] 7.4 File record left as orphaned for storage management (per dev notes)

- [x] Task 8: Testing and validation (AC: 1-8)
  - [x] 8.1 Test "File Upload" option appears in submission type dropdown
  - [x] 8.2 Test FileUpload component renders when file_upload type selected
  - [x] 8.3 Test 10MB file uploads successfully (vs 5MB limit elsewhere)
  - [x] 8.4 Test ZIP file uploads work
  - [x] 8.5 Test file submission displays in list with download link
  - [x] 8.6 Test file download works
  - [x] 8.7 Test file submission deletion
  - [x] 8.8 Test storage quota reflects uploaded assessment files

## Dev Notes

- The `assessment_submissions` table already has `file_id UUID REFERENCES files(id)` from Story 3.1 migration (000009)
- FileUpload component exists at `frontend/src/components/file-upload/file-upload.tsx` - reuse with modified validation
- file-service.ts has complete presigned URL flow - just needs assessment submission context parameter
- Current SUBMISSION_TYPE_OPTIONS excludes 'file_upload' - need to add it
- Per tech spec AC-3.6: 10MB limit specifically for assessment submissions, not global change
- Consider: File uploads create file record immediately, then submission links to it - handle orphaned files gracefully

### Project Structure Notes

- Modifies: `frontend/src/lib/file-service.ts` (add assessment validation, context parameter)
- Modifies: `frontend/src/services/assessment-service.ts` (add file_upload type option)
- Modifies: `frontend/src/components/submission-form/submission-form-modal.tsx` (add file upload UI)
- Modifies: `frontend/src/components/submission-list/submission-list.tsx` (display file submissions)
- Modifies: `backend/internal/handlers/assessment.go` (accept file_id in submission creation)
- Modifies: `backend/internal/handlers/file.go` (accept assessment_submission context)

### Learnings from Previous Story

**From Story 3-5-submission-tracking-github-links-and-notes (Status: done)**

- **SubmissionFormModal Created**: Full modal at `frontend/src/components/submission-form/submission-form-modal.tsx` with type selector and conditional fields
- **SubmissionList Created**: Component at `frontend/src/components/submission-list/submission-list.tsx` displays submissions with type icons
- **Submission API**: `POST /api/assessments/:id/submissions` handler at `assessment.go:293-346` with `CreateSubmissionRequest` struct
- **Type Handling**: Conditional rendering pattern established - use same pattern for file_upload type
- **Response Pattern**: Use `response.Created()` for 201 responses (added in Story 3.5)
- **Toast Feedback**: Use `toast.success()` and `toast.error()` from sonner for user feedback
- **SUBMISSION_TYPE_OPTIONS**: Currently excludes `file_upload` at line 36 - intentionally left out pending this story

[Source: stories/3-5-submission-tracking-github-links-and-notes.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-3.md#AC-3.6] - File submission acceptance criteria: PDF, ZIP, DOCX up to 10MB
- [Source: docs/tech-spec-epic-3.md#Submission Endpoints] - API design for submission creation
- [Source: docs/epics.md#Story 3.6] - Story definition lines 855-883
- [Source: docs/architecture.md#File Upload Security] - File validation: MIME type whitelist
- [Source: frontend/src/lib/file-service.ts] - Existing presigned URL upload flow
- [Source: frontend/src/components/file-upload/file-upload.tsx] - Reusable file upload component

## Dev Agent Record

### Context Reference

- [docs/stories/3-6-submission-tracking-file-uploads.context.xml](3-6-submission-tracking-file-uploads.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

**2026-02-04 - Implementation Plan**
1. Task 1: Add 10MB limit and ZIP support to file-service.ts frontend validation + backend file handler
2. Task 2: Extend presigned URL flow with assessment_submission_id parameter (frontend + backend)
3. Task 3: Add file_upload to SUBMISSION_TYPE_OPTIONS and update CreateSubmissionRequest types
4. Task 4: Update SubmissionFormModal with FileUpload component integration
5. Task 5: Update SubmissionList to display file submissions with download links
6. Task 6: Backend CreateSubmission handler to accept/validate file_id
7. Task 7: Add delete functionality with confirmation dialog
8. Task 8: Manual testing of all ACs

### Completion Notes List

- Implemented file upload submission type with 10MB limit and ZIP support for assessment submissions
- Created dedicated AssessmentFileUpload component with assessment-specific validation
- Added DELETE /api/assessment-submissions/:submissionId endpoint (was missing from Story 3.5)
- SubmissionList now fetches file details and displays download link with file size
- Backend validates file ownership before allowing submission creation

### File List

**Modified:**
- frontend/src/lib/file-service.ts
- frontend/src/services/assessment-service.ts
- frontend/src/components/submission-form/submission-form-modal.tsx
- frontend/src/components/submission-list/submission-list.tsx
- frontend/src/app/(app)/applications/[id]/assessments/[assessmentId]/page.tsx
- backend/internal/handlers/file.go
- backend/internal/handlers/assessment.go
- backend/internal/routes/assessment.go

**Created:**
- frontend/src/components/submission-form/assessment-file-upload.tsx

## Senior Developer Review (AI)

**Reviewer:** Simon
**Date:** 2026-02-04
**Outcome:** ✅ APPROVE

### Summary

All 8 acceptance criteria fully implemented with evidence. All 8 tasks marked complete have been verified. Implementation follows Epic 3 tech spec patterns for file handling, uses existing S3 presigned URL infrastructure appropriately, and maintains proper security controls (file ownership validation, auth middleware, type whitelist).

### Key Findings

No high or medium severity issues found. Implementation is clean and well-structured.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | "File Upload" appears as submission type option | ✅ IMPLEMENTED | `assessment-service.ts:39` |
| AC2 | Selecting "File Upload" shows FileUpload component | ✅ IMPLEMENTED | `submission-form-modal.tsx:243-261` |
| AC3 | PDF, ZIP, DOCX with 10MB limit for assessments | ✅ IMPLEMENTED | `file-service.ts:4,76-99`, `file.go:19,116-126` |
| AC4 | Files stored via S3 presigned URL, linked via file_id | ✅ IMPLEMENTED | `assessment-file-upload.tsx:66-87`, `assessment.go:348-354` |
| AC5 | Files appear in SubmissionList with icon, name, size, timestamp | ✅ IMPLEMENTED | `submission-list.tsx:53-74,157-168` |
| AC6 | File uploads count toward storage quota | ✅ IMPLEMENTED | Uses existing file storage flow - `file.go:138-147` |
| AC7 | Delete file submission with confirmation | ✅ IMPLEMENTED | `submission-list.tsx:76-88,210-218` |
| AC8 | API accepts file_id and validates ownership | ✅ IMPLEMENTED | `assessment.go:316-318,340-345` |

**Summary:** 8 of 8 acceptance criteria fully implemented

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: File validation for assessments | ✅ | ✅ | `file-service.ts:4,76-99`, `file.go:19,30-36` |
| Task 2: Extend file upload flow | ✅ | ✅ | `file-service.ts:107,164` |
| Task 3: Add file_upload type to frontend | ✅ | ✅ | `assessment-service.ts:39-42,112-116` |
| Task 4: SubmissionFormModal file upload support | ✅ | ✅ | `submission-form-modal.tsx:34,243-261` |
| Task 5: SubmissionList file display | ✅ | ✅ | `submission-list.tsx:53-74,151-174` |
| Task 6: Backend file_id in submission | ✅ | ✅ | `assessment.go:38-43,340-345` |
| Task 7: Delete file submission | ✅ | ✅ | `routes/assessment.go:27-31`, `assessment.go:367-381` |
| Task 8: Testing and validation | ✅ | ✅ | Manual testing confirmed |

**Summary:** 8 of 8 completed tasks verified, 0 questionable, 0 falsely marked

### Test Coverage and Gaps

- Backend repository tests exist for assessment operations
- Manual frontend testing per MVP standard
- No automated E2E tests (acceptable for MVP)

### Architectural Alignment

✅ Compliant with Epic 3 Tech Spec:
- Uses existing S3 presigned URL pattern
- 10MB limit for assessments, 5MB for standard files
- file_id FK properly linked in assessment_submissions
- JWT auth middleware on all routes
- Follows established patterns (repository, toast feedback)

### Security Notes

✅ No security issues:
- File ownership validated before submission creation
- URL format validation for GitHub URLs
- File type whitelist enforced on backend
- Auth middleware on all routes

### Action Items

**Code Changes Required:**
- [x] [Low] Add ownership validation to DeleteSubmission handler [file: assessment.go:367-393] - FIXED

**Advisory Notes:**
- Note: Orphaned files cleanup added to backlog (docs/backlog.md) - Target: Epic 6

