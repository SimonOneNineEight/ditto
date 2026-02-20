# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story's `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
| ---- | ----- | ---- | ---- | -------- | ----- | ------ | ----- |
| 2026-01-19 | 1-3 | 1 | TechDebt | Low | TBD | Open | Frontend tests deferred (Task 9-10): URLImport, form validation, extraction flow. Target: Story 6-9 |
| 2026-01-22 | 1-4 | 1 | Bug | Low | TBD | Open | Upload cancel doesn't abort XHR — in-flight request continues in background. Add AbortController. Target: Story 6-7 |
| 2026-01-22 | 1-4 | 1 | Enhancement | Low | TBD | Open | No retry-from-error for file upload — user must re-select file after failure. Preserve file ref on error. Target: Story 6-7 |
| 2026-01-22 | 1-4 | 1 | Enhancement | Low | TBD | Open | AC-4 partial: Add dedicated "Replace" button to FileItem for single-action file replacement. Target: Story 6-7 |
| 2026-02-04 | 3-6 | 3 | TechDebt | Low | TBD | Open | Orphaned files cleanup: Assessment file uploads create file records immediately, but if user cancels before saving submission, files remain orphaned. Add periodic cleanup job for files not linked to any submission/interview after X days. Target: Epic 6 |
| 2026-02-09 | 5-1 | 5 | Bug | Low | TBD | Closed | UpdatedAt field not populated in search results - convertRowsToResults doesn't parse updated_at string to time.Time. File: search_repository.go:286-299. FIXED same day. |
| 2026-02-09 | 5-3 | 5 | TechDebt | Med | TBD | Closed | getApplication(id) fetches ALL applications (limit=1000) to find one by ID instead of using dedicated endpoint. FIXED: Added GET /api/applications/:id/with-details endpoint. |
| 2026-02-18 | 6.6 | 6 | Bug | Med | TBD | Closed | Submission form notes field missing inline error display when submission_type='notes'. FIXED: Added aria attrs + error <p> block. |
| 2026-02-18 | 6.6 | 6 | TechDebt | Low | TBD | Closed | Missing aria-required on assessment_type and submission_type SelectTriggers. FIXED: Added aria-required="true". |
| 2026-02-18 | 6.6 | 6 | TechDebt | Low | TBD | Closed | Backend formatValidationFieldErrors uses PascalCase field names in messages. FIXED: Added humanizeFieldName() for readable messages. |
| 2026-02-19 | 6.9 | 6 | Bug | High | TBD | Closed | AC 3 not met: No RTL component tests for login, application, interview, assessment forms. FIXED: 4 RTL tests added (page.test.tsx, add-application-form.test.tsx, interview-form-modal.test.tsx, assessment-form-modal.test.tsx). |
| 2026-02-19 | 6.9 | 6 | TechDebt | Med | TBD | Closed | Repository test coverage at 34.2% vs >70% goal. FIXED: Coverage increased to 72.2% via 5 new test files + 3 expanded. |
| 2026-02-19 | 6.9 | 6 | TechDebt | Low | TBD | Open | Pre-existing test failures: TestRateLimitRepository (auth credentials), TestFileHandler_ConfirmUpload (no S3 mock). Track for resolution. |
| 2026-02-20 | 6.9 | 6 | TechDebt | Low | TBD | Open | React `act()` console warnings in interview-form-modal.test.tsx and assessment-form-modal.test.tsx caused by react-hook-form async state updates. Tests pass but warnings are noisy. Wrap async updates in `waitFor` or suppress in jest.setup.ts. |
