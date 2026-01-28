# Story 2.8: File Uploads for Interview Prep Documents

Status: drafted

## Story

As a job seeker,
I want to upload prep documents (PDFs, Word docs, TXT files) to an interview,
so that I can attach existing research, job descriptions, or study materials directly to my interview preparation.

## Acceptance Criteria

### Given I am viewing an interview detail page

**AC-1**: Upload Document Button
- **When** I look at the interview detail sections
- **Then** I see a "Documents" section (collapsible, consistent with Interviewers/Questions/Notes sections)
- **And** inside it I see an "Upload Document" area with drag-and-drop support
- **And** the upload area shows accepted formats: PDF, DOCX, TXT up to 5MB

**AC-2**: File Selection and Upload
- **When** I click the upload area or drag a file onto it
- **Then** a file picker opens (click) or the file is accepted (drag-drop)
- **And** only PDF, DOCX, TXT files up to 5MB are accepted
- **And** invalid files show an error message (wrong type or too large)

**AC-3**: Upload Progress and Confirmation
- **When** I select a valid file
- **Then** I see a progress bar showing upload percentage
- **And** after upload completes, the file is confirmed and linked to this interview
- **And** a success toast notification appears
- **And** the file appears in the documents list below the upload area

**AC-4**: Document List Display
- **When** uploaded files exist for this interview
- **Then** they appear as a list showing: file name, file size, and file type icon
- **And** each file has download and delete action buttons (visible on hover)
- **And** files are sorted by upload date (newest first)

**AC-5**: File Download
- **When** I click the download button on a file
- **Then** the file downloads via a presigned S3 URL in a new tab

**AC-6**: File Deletion with Confirmation
- **When** I click the delete button on a file
- **Then** a confirmation dialog appears asking "Delete this file?"
- **And** confirming deletes the file (soft delete)
- **And** the file disappears from the list
- **And** a success toast shows "File deleted"

**AC-7**: Storage Quota Enforcement
- **When** I try to upload a file that would exceed my 100MB storage quota
- **Then** the upload is rejected with an error message about the storage limit
- **And** I am not charged for the failed upload

### Edge Cases

- Empty files (0 bytes) are rejected before upload
- Upload can be cancelled during progress (cancel button visible)
- Network errors during upload show retry-friendly error message
- Files are linked to both the interview AND its parent application (application_id required by schema)
- Multiple files can be uploaded to the same interview (no limit on count)

## Tasks / Subtasks

### Backend Development

- [ ] **Task 1**: Extend File Service Functions for Interview Context (AC: #2, #3, #7)
  - [ ] 1.1: Update `getPresignedUploadUrl` in `frontend/src/lib/file-service.ts` to accept optional `interviewId` parameter
  - [ ] 1.2: Update `confirmUpload` in `frontend/src/lib/file-service.ts` to accept optional `interviewId` parameter
  - [ ] 1.3: Pass `interview_id` to `POST /api/files/presigned-upload` and `POST /api/files/confirm-upload` when provided

> **Note:** The backend already fully supports `interview_id` in the presigned-upload, confirm-upload, list-files, and file CRUD endpoints. The `files` table has an `interview_id` nullable FK column, and the Go handler/repository code already processes it. No backend changes are needed.

### Frontend Development

- [ ] **Task 2**: Create DocumentsSection Component (AC: #1, #4)
  - [ ] 2.1: Create `frontend/src/components/interview-detail/documents-section.tsx`
  - [ ] 2.2: Use `CollapsibleSection` pattern (matching InterviewersSection, QuestionsSection, NoteSection)
  - [ ] 2.3: Display file count in section header (e.g., "Documents (3)")
  - [ ] 2.4: Embed `FileUpload` component for upload capability
  - [ ] 2.5: Embed `FileList` component for displaying uploaded files
  - [ ] 2.6: Load files on mount using `listFiles(applicationId, interviewId)`
  - [ ] 2.7: Handle upload completion by refreshing file list
  - [ ] 2.8: Handle file deletion by removing from local state

- [ ] **Task 3**: Update FileUpload Component for Interview Support (AC: #2, #3)
  - [ ] 3.1: Add `interviewId` optional prop to `FileUpload` component
  - [ ] 3.2: Pass `interview_id` to `getPresignedUploadUrl` when `interviewId` is provided
  - [ ] 3.3: Pass `interview_id` to `confirmUpload` when `interviewId` is provided

- [ ] **Task 4**: Update file-service.ts for Interview ID Support (AC: #2, #3)
  - [ ] 4.1: Add optional `interviewId` parameter to `getPresignedUploadUrl` function
  - [ ] 4.2: Include `interview_id` in presigned-upload request body when provided
  - [ ] 4.3: Add optional `interviewId` parameter to `confirmUpload` function
  - [ ] 4.4: Include `interview_id` in confirm-upload request body when provided

- [ ] **Task 5**: Integrate DocumentsSection into Interview Detail Page (AC: #1)
  - [ ] 5.1: Import `DocumentsSection` in `frontend/src/app/(app)/interviews/[id]/page.tsx`
  - [ ] 5.2: Add `DocumentsSection` to the interview detail page (after NoteSection)
  - [ ] 5.3: Pass `interviewId`, `applicationId` (from `data.interview.application_id`), and files data
  - [ ] 5.4: Export `DocumentsSection` from `frontend/src/components/interview-detail/index.ts`

- [ ] **Task 6**: Load Interview Files from API (AC: #4)
  - [ ] 6.1: Call `listFiles(applicationId, interviewId)` in DocumentsSection on mount
  - [ ] 6.2: Display loading skeleton while files load
  - [ ] 6.3: Handle empty state (no files uploaded yet)

### Testing

- [ ] **Task 7**: Manual Testing
  - [ ] 7.1: Test file upload via drag-and-drop on interview detail page
  - [ ] 7.2: Test file upload via file picker click
  - [ ] 7.3: Test upload progress bar displays correctly
  - [ ] 7.4: Test file appears in list after upload
  - [ ] 7.5: Test file download (opens presigned URL in new tab)
  - [ ] 7.6: Test file deletion with confirmation dialog
  - [ ] 7.7: Test rejection of invalid file types (e.g., .exe, .zip)
  - [ ] 7.8: Test rejection of oversized files (>5MB)
  - [ ] 7.9: Test storage quota enforcement (upload when near 100MB limit)
  - [ ] 7.10: Test empty file rejection (0 bytes)
  - [ ] 7.11: Test multiple file uploads to same interview
  - [ ] 7.12: Test upload cancellation during progress

## Dev Notes

### Architecture Constraints

**This story reuses existing Epic 1 file storage infrastructure.** The backend is already complete:
- `files` table has `interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE` (nullable FK)
- `backend/internal/handlers/file.go` already accepts `interview_id` in `PresignedUploadRequest` and `ConfirmUploadRequest`
- `backend/internal/repository/file.go` already supports `interviewID` filtering in `GetUserFiles`
- `GET /api/files?interview_id=<uuid>` already returns files filtered by interview
- `POST /api/files/presigned-upload` already accepts `interview_id` in request body
- `POST /api/files/confirm-upload` already accepts `interview_id` in request body

**Frontend changes needed:**
- `frontend/src/lib/file-service.ts` needs `interviewId` parameter added to `getPresignedUploadUrl` and `confirmUpload` functions
- `frontend/src/components/file-upload/file-upload.tsx` needs `interviewId` prop to pass through to service calls
- New `DocumentsSection` component wrapping existing `FileUpload` + `FileList` components
- Integration into interview detail page

**API Contracts (existing, already working):**

```typescript
// POST /api/files/presigned-upload
{
  file_name: string;
  file_type: string;
  file_size: number;
  application_id: string;  // required
  interview_id?: string;   // optional, links file to interview
}

// POST /api/files/confirm-upload
{
  s3_key: string;
  file_name: string;
  file_type: string;
  file_size: number;
  application_id: string;  // required
  interview_id?: string;   // optional
}

// GET /api/files?application_id=<uuid>&interview_id=<uuid>
// Returns FileRecord[]
```

**Database Schema (from migration 000004, already exists):**

```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    file_name VARCHAR(256) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(500) NOT NULL UNIQUE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

### Project Structure Notes

**New Files:**
```
frontend/
├── src/
│   └── components/
│       └── interview-detail/
│           └── documents-section.tsx  # New: Documents section with upload + list
```

**Existing Files to Modify:**
- `frontend/src/lib/file-service.ts` - Add `interviewId` parameter to `getPresignedUploadUrl` and `confirmUpload`
- `frontend/src/components/file-upload/file-upload.tsx` - Add `interviewId` prop
- `frontend/src/app/(app)/interviews/[id]/page.tsx` - Add DocumentsSection
- `frontend/src/components/interview-detail/index.ts` - Export DocumentsSection

**No backend changes needed** - the file infrastructure already supports interview_id fully.

### Learnings from Previous Story

**From Story 2-7-rich-text-notes-preparation-area (Status: ready-for-dev)**

- **CollapsibleSection Pattern**: Use existing `CollapsibleSection` component for consistent UI. Pass item count for header badge.
- **Component Export**: Add to `frontend/src/components/interview-detail/index.ts` barrel export.
- **Data Flow**: Interview detail page fetches all data, passes to child sections. Each section manages its own state for additions/deletions.
- **Toast Notifications**: Use sonner for success/error feedback (already imported in interview detail page).
- **Loading States**: Use Skeleton components for loading indicators.

**From Epic 1 (Stories 1.2, 1.4) - File Upload Infrastructure:**

- **Two-Phase Upload**: Uses presigned URLs pattern - (1) get presigned URL, (2) upload to S3 directly, (3) confirm upload to backend.
- **FileUpload Component**: Drag-and-drop + click-to-upload with progress bar. Already handles validation, progress, cancellation.
- **FileList + FileItem**: Display files with download/delete actions. Delete uses confirmation dialog.
- **file-service.ts**: All API functions exist (`listFiles`, `getFileDownloadUrl`, `deleteFile`, `validateFile`, `getPresignedUploadUrl`, `confirmUpload`). Only need to extend `getPresignedUploadUrl` and `confirmUpload` with `interviewId`.

### References

- [Source: docs/tech-spec-epic-2.md#Acceptance-Criteria (AC-2.10)]
- [Source: docs/tech-spec-epic-2.md#Dependencies-and-Integrations#Epic-1-Dependencies]
- [Source: docs/epics.md#Story-2.8]
- [Source: backend/migrations/000004_create_file_system.up.sql] - Files table with interview_id FK
- [Source: backend/internal/handlers/file.go] - File handler with interview_id support
- [Source: backend/internal/repository/file.go] - File repository with interview_id filtering
- [Source: frontend/src/lib/file-service.ts] - Frontend file service (needs interviewId extension)
- [Source: frontend/src/components/file-upload/file-upload.tsx] - Existing upload component
- [Source: frontend/src/components/file-upload/file-list.tsx] - Existing file list component
- [Source: frontend/src/components/file-upload/file-item.tsx] - Existing file item with download/delete

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List

---

## Change Log

### 2026-01-28 - Story Drafted
- **Version:** v1.0
- **Author:** Claude Opus 4.5 (via BMad create-story workflow)
- **Status:** Drafted
- **Summary:** Created story for File Uploads for Interview Prep Documents. Eighth story in Epic 2, leverages existing Epic 1 file storage infrastructure. No backend changes needed - the files table, handler, repository, and routes already support interview_id. Frontend needs: (1) extend file-service.ts with interviewId params, (2) add interviewId prop to FileUpload component, (3) new DocumentsSection component wrapping FileUpload + FileList, (4) integration into interview detail page. 7 tasks covering frontend extension, new component, and manual testing.
