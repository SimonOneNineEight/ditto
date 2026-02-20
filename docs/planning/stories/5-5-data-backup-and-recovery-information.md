# Story 5.5: Data Backup and Recovery Information

Status: done

## Story

As a job seeker using ditto,
I want to know my data is backed up and understand how to recover it,
so that I have peace of mind that my job search data won't be lost.

## Acceptance Criteria

1. **Backup policy display** - In settings, show backup policy: "Your data is automatically backed up daily"
2. **Last backup timestamp** - Show last backup timestamp (if available from system)
3. **Full data export (JSON)** - Full data export includes: applications, interviews, assessments, notes, file URLs
4. **Data retention policy** - Data retention policy visible: "Data is retained indefinitely while your account is active"
5. **Account deletion option** - Account deletion option with multi-step confirmation
6. **Account deletion cascade** - Account deletion cascades to all user data (soft delete)

## Tasks / Subtasks

- [x] Task 1: Create Data Backup Info Section in Settings (AC: 1, 2, 4)
  - [x] 1.1 Add "Data & Privacy" section to settings page with Card component
  - [x] 1.2 Display backup policy text: "Your data is automatically backed up daily at 2:00 AM UTC"
  - [x] 1.3 Display data retention policy text: "Your data is retained indefinitely while your account is active"
  - [x] 1.4 Merged Data Export and Data & Privacy into single card per design

- [x] Task 2: Create Full JSON Export Backend Endpoint (AC: 3)
  - [x] 2.1 Create `GET /api/export/full` endpoint in `backend/internal/handlers/export.go`
  - [x] 2.2 Query all user data: applications, interviews (with questions, notes, interviewers), assessments (with submissions)
  - [x] 2.3 Include file metadata with signed download URLs (15-min expiry)
  - [x] 2.4 Structure JSON with clear sections: `{user, applications, interviews, assessments}`
  - [x] 2.5 Set response headers: `Content-Type: application/json`, `Content-Disposition: attachment; filename=ditto-backup-{date}.json`
  - [x] 2.6 Add to export routes in `backend/internal/routes/export.go`

- [x] Task 3: Add Full Backup Button to Settings UI (AC: 3)
  - [x] 3.1 Add "Download Full Backup (JSON)" button in Data & Privacy section
  - [x] 3.2 Extend `exportService.ts` with `exportFullBackup()` method
  - [x] 3.3 Handle JSON blob download similar to CSV export pattern
  - [x] 3.4 Show loading state and success toast on completion

- [x] Task 4: Create Account Deletion Backend Endpoint (AC: 5, 6)
  - [x] 4.1 Create `DELETE /api/users/account` endpoint in `backend/internal/handlers/auth.go`
  - [x] 4.2 Implement soft delete cascade: set `deleted_at` on users, applications, interviews, assessments, files, notifications
  - [x] 4.3 Use database transaction to ensure atomicity
  - [x] 4.4 Hard delete users_auth and notification_preferences (no soft delete needed)
  - [x] 4.5 Return 200 with success message
  - [x] 4.6 Register route with auth middleware

- [x] Task 5: Create Account Deletion UI with Multi-Step Confirmation (AC: 5)
  - [x] 5.1 Add "Danger Zone" section at bottom of settings with red border styling
  - [x] 5.2 Add "Delete Account" button with destructive variant
  - [x] 5.3 Create `DeleteAccountDialog` component with multi-step confirmation:
    - Step 1: Warning text explaining what will be deleted
    - Step 2: Type confirmation phrase "DELETE MY ACCOUNT"
    - Step 3: Final confirmation button
  - [x] 5.4 Call `DELETE /api/users/account` on final confirmation
  - [x] 5.5 On success, clear auth state and redirect to login with message "Account deleted successfully"

- [x] Task 6: Testing (AC: 1, 2, 3, 4, 5, 6)
  - [x] 6.1 Manual test: Verify backup policy and retention info displayed in settings
  - [x] 6.2 Manual test: Download full JSON backup, verify structure includes all data types
  - [x] 6.3 Manual test: Verify file URLs in JSON backup are valid signed URLs
  - [x] 6.4 Manual test: Account deletion multi-step flow works correctly
  - [x] 6.5 Manual test: After account deletion, user is logged out and cannot log back in
  - [x] 6.6 Manual test: Verify all user data is soft-deleted (check database)

## Dev Notes

### Architecture Alignment

- **Backend Pattern**: Extend existing `export.go` handler for JSON export, new endpoint for account deletion
- **Frontend Pattern**: Extend settings page with new sections, shared dialog component pattern
- **Database Pattern**: Soft delete cascade using transactions
- **API Pattern**: Follow existing REST patterns (`/api/export/full`, `DELETE /api/users/account`)

### Implementation Details

**Full JSON Export Structure:**
```json
{
  "export_date": "2026-02-10T12:00:00Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "applications": [
    {
      "id": "uuid",
      "company": "...",
      "job_title": "...",
      "status": "...",
      "application_date": "...",
      "description": "...",
      "notes": "...",
      "files": [{"id": "...", "name": "...", "download_url": "..."}]
    }
  ],
  "interviews": [
    {
      "id": "uuid",
      "application_id": "uuid",
      "round_number": 1,
      "interview_type": "...",
      "scheduled_date": "...",
      "interviewers": [...],
      "questions": [...],
      "notes": [...],
      "files": [...]
    }
  ],
  "assessments": [
    {
      "id": "uuid",
      "application_id": "uuid",
      "title": "...",
      "status": "...",
      "submissions": [...]
    }
  ]
}
```

**Account Deletion Cascade Order:**
1. Notifications
2. User notification preferences
3. Files (soft delete, S3 cleanup deferred)
4. Assessment submissions
5. Assessments
6. Interview questions
7. Interview notes
8. Interviewers
9. Interviews
10. Applications
11. User (soft delete)

**Multi-Step Confirmation Dialog:**
| Step | Content |
|------|---------|
| 1 | Warning: "This will permanently delete all your data including applications, interviews, assessments, and uploaded files. This action cannot be undone." |
| 2 | Input: Type "DELETE MY ACCOUNT" to confirm |
| 3 | Button: "Permanently Delete Account" (disabled until phrase typed correctly) |

### Project Structure Notes

**Creates:**
- `frontend/src/components/settings/DeleteAccountDialog.tsx` - Multi-step deletion dialog

**Modifies:**
- `backend/internal/handlers/export.go` - Add full JSON export endpoint
- `backend/internal/routes/export.go` - Register full export route
- `backend/internal/handlers/user.go` or new `account.go` - Account deletion endpoint
- `frontend/src/app/(app)/settings/page.tsx` - Add Data & Privacy section, Danger Zone
- `frontend/src/services/exportService.ts` - Add `exportFullBackup()` method

### Learnings from Previous Story

**From Story 5-4-data-export-applications-and-interviews-to-csv (Status: done)**

- **Export Handler Pattern**: `backend/internal/handlers/export.go` already has streaming export structure - extend for JSON
- **Export Routes Pattern**: `backend/internal/routes/export.go` registers export routes separately
- **exportService Pattern**: `frontend/src/services/exportService.ts` handles blob downloads with programmatic links
- **Settings Integration**: Data Export section already exists in settings - add Data & Privacy section nearby
- **Response Headers**: Use same pattern: `Content-Disposition: attachment; filename=...`
- **Error Handling**: Toast notifications for success/error feedback

**Files to Reference:**
- `backend/internal/handlers/export.go` - Export patterns, response headers
- `backend/internal/routes/export.go` - Route registration
- `frontend/src/services/exportService.ts` - Blob download pattern
- `frontend/src/app/(app)/settings/page.tsx` - Settings page structure
- `frontend/src/components/shared/ExportDialog/ExportDialog.tsx` - Dialog patterns

[Source: stories/5-4-data-export-applications-and-interviews-to-csv.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-5.md#Story 5.5] - Acceptance criteria and requirements
- [Source: docs/epics.md#Story 5.5] - Original story definition
- [Source: docs/architecture.md#Database Schema] - Soft delete patterns
- [Source: docs/architecture.md#Security Architecture] - Auth and deletion patterns
- [Source: stories/5-4-data-export-applications-and-interviews-to-csv.md] - Previous story export patterns

## Dev Agent Record

### Context Reference

- docs/stories/5-5-data-backup-and-recovery-information.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

**2026-02-10: Implementation Plan**
- Task 1: Frontend-only - Add Data & Privacy section to settings page with backup policy and retention info using existing Card component
- Task 2: Backend - Create full JSON export endpoint in export.go with comprehensive user data, leverage existing repositories
- Task 3: Frontend - Add download button for JSON backup in settings, extend exportService.ts
- Task 4: Backend - Create account deletion endpoint using database transaction for cascade soft delete
- Task 5: Frontend - Create DeleteAccountDialog with multi-step confirmation, add Danger Zone section
- Task 6: Manual testing of all features

### Completion Notes List

- Merged Data Export and Data & Privacy cards into single unified card per design spec
- Full JSON export includes: user info, applications with files, interviews with questions/notes/interviewers/files, assessments with submissions
- Account deletion uses database transaction for atomic cascade delete across 11 tables
- DeleteAccountDialog implements 3-step confirmation flow with phrase verification
- AC2 (last backup timestamp) deferred - would require infrastructure to track actual backup timestamps

### File List

**Created:**
- `frontend/src/components/settings/DeleteAccountDialog.tsx`

**Modified:**
- `backend/internal/handlers/export.go` - Added full JSON export types and ExportFull handler
- `backend/internal/routes/export.go` - Added /full route with S3 service injection
- `backend/internal/handlers/auth.go` - Added DeleteAccount handler
- `backend/internal/routes/auth.go` - Added DELETE /users/account route
- `backend/internal/repository/user.go` - Added SoftDeleteUser with transaction cascade
- `frontend/src/app/(app)/settings/page.tsx` - Unified Data & Privacy card, Danger Zone
- `frontend/src/services/exportService.ts` - Added exportFullBackup function

## Change Log

- 2026-02-10: Story drafted from tech-spec-epic-5.md with learnings from story 5-4

## Senior Developer Review (AI)

**Reviewer:** Simon
**Date:** 2026-02-10
**Outcome:** ✅ APPROVE

### Acceptance Criteria Validation

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| 1 | Backup policy display | ✅ Pass | "Your data is automatically backed up daily at 2:00 AM UTC" displayed in Data & Privacy section |
| 2 | Last backup timestamp | ⏸️ Deferred | Would require infrastructure to track actual backup timestamps - documented in completion notes |
| 3 | Full data export (JSON) | ✅ Pass | Export includes user, applications, interviews (with questions/notes/interviewers), assessments (with submissions), and file URLs |
| 4 | Data retention policy | ✅ Pass | "Your data is retained indefinitely while your account is active" displayed |
| 5 | Account deletion option | ✅ Pass | Multi-step confirmation dialog with phrase verification implemented |
| 6 | Account deletion cascade | ✅ Pass | Soft delete cascade across 11 tables using database transaction |

### Task Validation

| Task | Description | Status |
|------|-------------|--------|
| 1 | Data Backup Info Section in Settings | ✅ Complete (4/4 subtasks) |
| 2 | Full JSON Export Backend Endpoint | ✅ Complete (6/6 subtasks) |
| 3 | Full Backup Button to Settings UI | ✅ Complete (4/4 subtasks) |
| 4 | Account Deletion Backend Endpoint | ✅ Complete (6/6 subtasks) |
| 5 | Account Deletion UI with Multi-Step Confirmation | ✅ Complete (5/5 subtasks) |
| 6 | Manual Testing | ✅ Complete (6/6 subtasks) |

### Code Quality Assessment

**Backend:**
- Repository pattern properly followed with transaction-based cascade delete
- Subqueries used correctly for tables without direct user_id (assessment_submissions, interview_questions, interview_notes, interviewers)
- Error handling consistent with existing patterns
- Routes registered with appropriate middleware

**Frontend:**
- Components follow existing patterns (Card, Button, Dialog from shadcn/ui)
- DeleteAccountDialog implements proper 3-step confirmation flow
- Export service extends existing blob download pattern
- Toast notifications for user feedback

### Issues Found

None blocking. AC2 (last backup timestamp) appropriately deferred as it requires infrastructure beyond story scope.

### Recommendation

Story is ready for completion. All implemented features work correctly and follow established patterns
