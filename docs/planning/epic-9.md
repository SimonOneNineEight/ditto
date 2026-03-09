# ditto - Epic 9 Breakdown

**Date:** 2026-03-04
**Project Level:** 1 (Coherent Feature)

---

## Epic 9: Bug Fixes & Core Workflow Stability

**Slug:** workflow-stability

### Goal

Fix broken application status transitions, interview tracking, and session expiry redirect so the core job search workflow functions correctly, the dashboard displays accurate data, and users can seamlessly re-authenticate after logout.

### Scope

**Included:**
- Fix application status transition bug (statuses can't be changed)
- Add "Draft" status to the application status workflow
- Fix dashboard interview count to reflect actual interview records
- Auto-set application status to "Interview" when an interview is created
- Display interview status/outcome on application views (not just scheduled date)
- Add a proper status field to the interview model
- Fix session expiry redirect so users land on a clean login page and can re-authenticate
- Add missing error display on application form fields and a general form error banner

**Excluded:**
- New application statuses beyond Draft (e.g., Withdrawn)
- Dashboard redesign or new dashboard widgets
- Interview scheduling/calendar integrations
- Notification triggers on status changes

### Success Criteria

1. Users can transition application status between all valid states via the UI
2. "Draft" status is available and is the default when creating a new application
3. Dashboard interview count matches the actual number of interview records, not just applications with "Interview" status
4. Creating an interview automatically sets the parent application status to "Interview" (if currently in an earlier state)
5. Interview cards/rows display status (scheduled, completed, cancelled) alongside the date
6. After session expiry, users are redirected to a clean login page and can log back in without issues
7. Application form shows inline error messages on all fields when create/update fails
8. All existing tests pass with new status logic

### Dependencies

- Epic 8 (auth-multiprovider) complete or in parallel (no conflicts)
- Current application_status table with seed data
- Current interview model and dashboard repository

---

## Story Map - Epic 9

```
Epic 9: Bug Fixes & Core Workflow Stability
├── Story 9.1: Fix Application Status Transitions & Add Draft Status (5 points)
│   Dependencies: None (foundational)
│   Deliverable: Working status transitions, Draft status added
│
├── Story 9.2: Fix Interview Status Tracking & Dashboard Display (5 points)
│   Dependencies: None (can run parallel to 9.1)
│   Deliverable: Accurate dashboard counts, interview status field, auto-status on interview creation
│
├── Story 9.3: Fix Session Expiry Redirect & Re-authentication (2 points)
│   Dependencies: None (can run parallel)
│   Deliverable: Clean login page redirect after session expiry, working re-login
│
└── Story 9.4: Add Missing Error Display on Application Form (2 points)
    Dependencies: None (can run parallel)
    Deliverable: Inline errors on all form fields, general error banner for non-field errors
```

**Dependency Validation:** ✅ No inter-story dependencies — all four can be worked in parallel

---

## Stories - Epic 9

### Story 9.1: Fix Application Status Transitions & Add Draft Status

**Status:** pending

As a job seeker,
I want to change my application status and start applications as "Draft,"
So that I can accurately track where each application stands in my workflow.

**Acceptance Criteria:**

AC #1: Given an application exists, when the user selects a new status from the status dropdown, then the status updates successfully and persists across page refreshes
AC #2: Given the application_status table, when the system starts, then a "Draft" status exists alongside Saved, Applied, Interview, Offer, and Rejected
AC #3: Given a user creates a new application, when they don't explicitly set a status, then it defaults to "Draft"
AC #4: Given an application with status "Draft," when the user views the application list, then "Draft" is displayed with appropriate styling (distinct color/badge)
AC #5: Given the status transition bug, when investigated, then the root cause is identified and documented in the PR description

**Edge Cases:**
- Attempting to change status while another request is in-flight → prevent double-submission
- Status change on a deleted/archived application → return appropriate error

**Tasks / Subtasks:**

- [ ] **Task 1**: Investigate and fix application status transition bug (AC: #1, #5)
  - [ ] 1.1: Reproduce the status change failure — identify if it's a frontend state issue, API error, or DB constraint
  - [ ] 1.2: Fix the root cause
  - [ ] 1.3: Add/update tests covering status transitions

- [ ] **Task 2**: Add Draft status (AC: #2, #3, #4)
  - [ ] 2.1: Create database migration to insert "Draft" into application_status table
  - [ ] 2.2: Update backend to use "Draft" as default status for new applications
  - [ ] 2.3: Update frontend status dropdown, badge colors, and filter options to include Draft
  - [ ] 2.4: Update dashboard status counts to include Draft in the breakdown

**Technical Notes:**
- Application statuses live in the `application_status` DB table with a UNIQUE constraint on name (migration 000006)
- Dashboard `fetchStats` hardcodes status keys in `statusCounts` map — needs updating for "Draft"
- Frontend status components need a new color/badge variant for Draft

**Estimated Effort:** 5 points (3-4 days)

---

### Story 9.2: Fix Interview Status Tracking & Dashboard Display

**Status:** pending

As a job seeker,
I want the dashboard to accurately count my interviews and see each interview's status,
So that I have a reliable overview of my job search activity.

**Acceptance Criteria:**

AC #1: Given the dashboard stats endpoint, when interview count is returned, then it reflects the actual number of interview records from the interviews table (not just applications with "Interview" status)
AC #2: Given a user creates a new interview for an application, when the interview is saved, then the parent application's status is automatically set to "Interview" (if currently Draft, Saved, or Applied)
AC #3: Given an interview exists, when displayed in the application detail view, then it shows a status indicator (scheduled, completed, cancelled) alongside the date
AC #4: Given the interview model, when an interview's scheduled date is in the past and no outcome is recorded, then it displays as "Awaiting Outcome"
AC #5: Given the interview model, when an outcome is recorded, then the interview displays as "Completed" with the outcome value

**Edge Cases:**
- Application already at "Offer" status when new interview created → don't downgrade to "Interview"
- Interview with no scheduled date → display status based on outcome only
- Multiple interviews for same application → each has independent status

**Tasks / Subtasks:**

- [ ] **Task 1**: Add status field to interview model (AC: #3, #4, #5)
  - [ ] 1.1: Create migration adding `status` column to interviews table (enum: scheduled, completed, cancelled, default: scheduled)
  - [ ] 1.2: Update Interview model struct and CRUD operations
  - [ ] 1.3: Add logic to derive display status: if status=scheduled and date is past and outcome is null → "Awaiting Outcome"; if outcome is set → "Completed"
  - [ ] 1.4: Update interview API responses to include status

- [ ] **Task 2**: Fix dashboard interview count (AC: #1)
  - [ ] 2.1: Update `dashboard_repository.go` to query `COUNT(*)` from `interviews` table instead of counting applications with "Interview" status
  - [ ] 2.2: Update `DashboardStats` struct if needed
  - [ ] 2.3: Update frontend dashboard card to reflect accurate count
  - [ ] 2.4: Update/add tests for dashboard stats

- [ ] **Task 3**: Auto-set application status on interview creation (AC: #2)
  - [ ] 3.1: In interview creation handler/service, check parent application status
  - [ ] 3.2: If status is Draft/Saved/Applied, update to "Interview"
  - [ ] 3.3: Don't downgrade from Offer or later statuses
  - [ ] 3.4: Add tests for auto-status transition logic

- [ ] **Task 4**: Update frontend interview display (AC: #3, #4, #5)
  - [ ] 4.1: Update interview cards/rows to show status badge alongside date
  - [ ] 4.2: Add color coding for interview statuses (scheduled=blue, completed=green, cancelled=gray, awaiting outcome=amber)
  - [ ] 4.3: Update interview list/detail views

**Technical Notes:**
- Current `InterviewCount` in dashboard is `statusCounts["interview"]` — count of applications, not interviews
- Interview model currently has only a nullable free-text `Outcome` field, no formal status
- Dashboard stats are cached 5 minutes per user — cache invalidation may be needed on interview CRUD
- The `GetUpcomingItems` query already joins interviews to applications correctly — reuse that pattern

**Estimated Effort:** 5 points (3-5 days)

---

### Story 9.3: Fix Session Expiry Redirect & Re-authentication

**Status:** pending

As a user whose session has expired,
I want to be redirected to a clean login page,
So that I can log back in without encountering errors or stale URL parameters.

**Acceptance Criteria:**

AC #1: Given a user's session expires (RefreshTokenError), when they are redirected to the login page, then the URL is clean (`/login` or `/login?error=SessionExpired`) with no CSRF tokens or other NextAuth params in the URL
AC #2: Given a user lands on the login page after session expiry, when they enter valid credentials and submit, then they are logged in successfully and redirected to the app
AC #3: Given a user lands on the login page after session expiry, when they use an OAuth provider (GitHub/Google/LinkedIn), then the OAuth flow completes successfully
AC #4: Given the session expiry message, when displayed on the login page, then it shows "Your session has expired. Please sign in again." and clears after the user interacts with the form

**Edge Cases:**
- Multiple tabs open when session expires → each tab redirects independently without conflicts
- User manually navigates to `/login` while already logged in → normal behavior, no stale params
- Browser back button after signout → should not restore authenticated state

**Tasks / Subtasks:**

- [ ] **Task 1**: Fix signOut redirect flow (AC: #1, #2, #3)
  - [ ] 1.1: Investigate how NextAuth `signOut()` constructs the redirect URL — identify where CSRF/extra params get appended
  - [ ] 1.2: In `auth-guard.tsx`, update the `signOut` call to ensure a clean redirect to `/login?error=SessionExpired`
  - [ ] 1.3: In `axios.ts` interceptor, update the `signOut` calls (lines 59 and 137) to use the same clean redirect pattern
  - [ ] 1.4: Consider using `signOut({ redirect: false })` followed by a manual `window.location.href = '/login'` to bypass NextAuth's redirect chain

- [ ] **Task 2**: Verify login page handles session-expired state cleanly (AC: #2, #4)
  - [ ] 2.1: Ensure `login/page.tsx` reads `error=SessionExpired` param and displays the message
  - [ ] 2.2: Clear the error message and URL params after form interaction or successful login
  - [ ] 2.3: Verify that `callbackUrl` param (if present) redirects the user back to their previous page after re-login

- [ ] **Task 3**: Test re-authentication flows (AC: #1, #2, #3)
  - [ ] 3.1: Test credentials login after session expiry
  - [ ] 3.2: Test OAuth login after session expiry
  - [ ] 3.3: Test that no stale tokens/cookies interfere with re-authentication

**Technical Notes:**
- There are 3 places that call `signOut()`: `auth-guard.tsx` (line 15), `axios.ts` (lines 59 and 106/137)
- `auth-guard.tsx` passes `callbackUrl: /login?error=SessionExpired&callbackUrl=...` — NextAuth may add its own params on top
- The likely fix is `signOut({ redirect: false })` + manual `router.push('/login?error=SessionExpired')` or `window.location.href`
- NextAuth v5's signOut flow goes through `/api/auth/signout` which may append a `csrfToken` param on redirect
- The `axios.ts` interceptor at line 59 already uses a simple `callbackUrl: '/login'` — but it fires during request interception which may cause race conditions

**Estimated Effort:** 2 points (1-2 days)

---

### Story 9.4: Add Missing Error Display on Application Form

**Status:** pending

As a user creating or editing an application,
I want to see clear error messages when something goes wrong,
So that I know what to fix instead of the form silently failing.

**Acceptance Criteria:**

AC #1: Given the application form, when a backend validation error is returned with field-level errors, then every affected field displays its error message inline — including location, jobType, minSalary, maxSalary, description, notes, and platform (currently only company, position, and sourceUrl show errors)
AC #2: Given the application form, when a non-validation error occurs (500, network failure, etc.), then a visible error banner or alert is displayed at the top or bottom of the form summarizing the failure
AC #3: Given a validation error without field-level mappings (e.g., a general 422), then a form-level error message is displayed (not silently swallowed)
AC #4: Given an error is displayed, when the user corrects the input and resubmits, then the error clears

**Edge Cases:**
- Backend returns field name that doesn't map to a form field → show as general form error
- Multiple field errors at once → all affected fields show their respective errors
- Network timeout during submit → show "Connection issue" message, don't leave form in limbo

**Tasks / Subtasks:**

- [ ] **Task 1**: Wire up error display on all form fields (AC: #1, #4)
  - [ ] 1.1: Add `error={errors.location?.message}` to location FormField
  - [ ] 1.2: Add error display to jobType Select (wrap with error message below)
  - [ ] 1.3: Add error display to minSalary and maxSalary inputs
  - [ ] 1.4: Add error display to description RichTextEditor wrapper
  - [ ] 1.5: Add error display to notes RichTextEditor wrapper
  - [ ] 1.6: Add error display to platform Select

- [ ] **Task 2**: Add general form error banner (AC: #2, #3)
  - [ ] 2.1: Add a `formError` state to the form component
  - [ ] 2.2: In the `catch` block, add an `else` branch for non-validation errors that sets `formError` with a user-friendly message
  - [ ] 2.3: Handle validation errors without `field_errors` by setting `formError`
  - [ ] 2.4: Render an alert/banner component (e.g., destructive Alert from shadcn) showing `formError`
  - [ ] 2.5: Clear `formError` on next submit attempt

- [ ] **Task 3**: Write tests (AC: #1, #2, #3)
  - [ ] 3.1: Test that field-level errors render on all fields
  - [ ] 3.2: Test that a 500 error shows the form error banner
  - [ ] 3.3: Test that errors clear on resubmit

**Technical Notes:**
- Currently only 3 of 9 fields wire up the `error` prop: `company`, `position`, `sourceUrl`
- The `catch` block in `onSubmit` (line 224-233) only handles `isValidationError` — no `else` branch for other errors
- The axios interceptor does show a toast for non-validation errors, but a toast alone is easy to miss — an inline form banner is more reliable
- The `FormField` component already supports an `error` prop — just needs to be passed through
- For Select and RichTextEditor wrappers, add a `<p className="text-destructive text-sm mt-1">` below the component

**Estimated Effort:** 2 points (1-2 days)

---

## Implementation Timeline - Epic 9

**Total Story Points:** 14

**Estimated Timeline:** 1.5-2 weeks (7-10 days)

| Story | Points | Dependencies | Phase |
|-------|--------|-------------|-------|
| 9.1: Fix Status Transitions & Draft | 5 | None | Fix & Extend |
| 9.2: Interview Status & Dashboard | 5 | None | Fix & Extend |
| 9.3: Session Expiry Redirect | 2 | None | Bug Fix |
| 9.4: Application Form Error Display | 2 | None | Bug Fix |

**Note:** All four stories can be worked in parallel as they touch different areas of the codebase.
