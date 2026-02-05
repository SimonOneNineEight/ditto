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
