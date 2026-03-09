# ditto - Epic 11 Breakdown

**Date:** 2026-03-04
**Project Level:** 1 (Coherent Feature)

---

## Epic 11: UX Polish & File Management

**Slug:** ux-polish

### Goal

Improve the user experience across the file management page, light theme, and application detail layout, and introduce a "Needs Feedback" system so users are prompted to follow up on stale applications.

### Scope

**Included:**
- Redesign file page to better explain its purpose and show document context (linked application/interview)
- Add contextual info to document cards (e.g., which application or interview a file belongs to)
- Reduce spacing between title and info on application page file cards
- Audit and fix color contrast/readability issues in light theme
- Design and implement "Needs Feedback" logic with clear triggering rules
- Display "Needs Feedback" indicators on dashboard and application list

**Excluded:**
- Dark theme changes (focus on light scheme only)
- File management features (sharing, bulk operations, new file types)
- Push notifications or email alerts for feedback reminders
- Complete file page redesign (iterative improvement only)

### Success Criteria

1. File page clearly communicates its purpose with contextual information on every document card
2. Application page file card spacing is visually tighter and consistent
3. All light theme colors pass WCAG AA contrast ratio (4.5:1 for text, 3:1 for large text)
4. "Needs Feedback" logic triggers based on defined rules and surfaces in the UI
5. Users can see at a glance which applications need follow-up action

### Dependencies

- Epic 9 complete (status fixes needed for accurate "Needs Feedback" logic)
- Current file page and document card components
- Current light theme CSS/Tailwind configuration

---

## Story Map - Epic 11

```
Epic 11: UX Polish & File Management
├── Story 11.1: Improve File Page UX & Document Card Context (5 points)
│   Dependencies: None
│   Deliverable: Enhanced file page, contextual document cards, tighter spacing
│
├── Story 11.2: Light Theme Color Audit & Fix (3 points)
│   Dependencies: None (can run parallel)
│   Deliverable: Fixed contrast issues, consistent light theme
│
└── Story 11.3: Implement "Needs Feedback" Logic (5 points)
    Dependencies: Epic 9 (accurate statuses required)
    Deliverable: Feedback triggers, UI indicators, dashboard integration
```

**Dependency Validation:** ✅ Stories 11.1 and 11.2 are independent. Story 11.3 depends on Epic 9 for accurate status data.

---

## Stories - Epic 11

### Story 11.1: Improve File Page UX & Document Card Context

**Status:** pending

As a job seeker,
I want the file page to clearly show what each document relates to and have a clean layout,
So that I can quickly find and manage my job search documents.

**Acceptance Criteria:**

AC #1: Given a user navigates to the file page, when the page loads, then a brief description or empty state explains the page's purpose (e.g., "All documents uploaded across your applications and interviews")
AC #2: Given a document card on the file page, when displayed, then it shows the linked application name (company + job title) and interview round (if applicable)
AC #3: Given a document card on the application detail page, when displayed, then the spacing between the file title and metadata is visually reduced (consistent with design system spacing)
AC #4: Given the file page has documents, when the user views them, then documents are grouped or filterable by application
AC #5: Given a document has no linked interview, when displayed, then only the application context is shown (no empty interview field)

**Edge Cases:**
- File linked to a deleted application → show "(Deleted Application)" label
- File page with zero documents → show empty state with upload guidance
- Long company/job title → truncate with ellipsis

**Tasks / Subtasks:**

- [ ] **Task 1**: Add context info to document cards (AC: #2, #5)
  - [ ] 1.1: Update file API response to include application name (company + job title) and interview round number
  - [ ] 1.2: Update document card component to display application context
  - [ ] 1.3: Conditionally show interview round only when present

- [ ] **Task 2**: Improve file page layout and purpose (AC: #1, #4)
  - [ ] 2.1: Add page header with descriptive text
  - [ ] 2.2: Add empty state component for zero-document case
  - [ ] 2.3: Add filter/group-by option for application name

- [ ] **Task 3**: Fix application page file card spacing (AC: #3)
  - [ ] 3.1: Identify current spacing values on application detail file cards
  - [ ] 3.2: Reduce gap between title and metadata to match design system
  - [ ] 3.3: Verify responsive behavior

**Technical Notes:**
- File model has `ApplicationID` (required) and `InterviewID` (optional) — backend can join to get application/interview context
- File API may need a new query or updated response DTO to include related entity names
- Consider a lightweight group-by on the frontend rather than separate API endpoints

**Estimated Effort:** 5 points (3-4 days)

---

### Story 11.2: Light Theme Color Audit & Fix

**Status:** pending

As a user using the light theme,
I want all UI elements to have proper contrast and readability,
So that I can comfortably use Ditto without straining my eyes.

**Acceptance Criteria:**

AC #1: Given the light theme is active, when all pages are reviewed, then text-on-background combinations meet WCAG AA contrast ratio (4.5:1 minimum)
AC #2: Given status badges and colored elements, when displayed in light theme, then they are distinguishable and readable
AC #3: Given interactive elements (buttons, links, inputs), when displayed in light theme, then they have clear visual affordance with adequate contrast
AC #4: Given the color audit findings, when fixes are applied, then a before/after comparison is documented in the PR

**Edge Cases:**
- Colors that work in dark theme but not light → need theme-specific values
- Semi-transparent overlays → check contrast against all possible backgrounds

**Tasks / Subtasks:**

- [ ] **Task 1**: Audit light theme colors (AC: #1, #2, #3)
  - [ ] 1.1: Systematically review each page in light theme
  - [ ] 1.2: Use contrast checking tool to identify failures
  - [ ] 1.3: Document all issues with screenshots and current/required contrast ratios

- [ ] **Task 2**: Fix color issues (AC: #1, #2, #3)
  - [ ] 2.1: Update Tailwind config or CSS variables for light theme
  - [ ] 2.2: Fix status badge colors for light theme readability
  - [ ] 2.3: Fix any low-contrast text, borders, or backgrounds
  - [ ] 2.4: Verify dark theme is not broken by changes

- [ ] **Task 3**: Document changes (AC: #4)
  - [ ] 3.1: Capture before/after screenshots for PR description

**Technical Notes:**
- Ditto uses Tailwind CSS — check for hardcoded colors vs. theme-aware classes
- Look for `text-gray-*` or `bg-*` classes that may not adapt to light/dark properly
- Use browser DevTools accessibility audit or a tool like axe for systematic checking

**Estimated Effort:** 3 points (2-3 days)

---

### Story 11.3: Implement "Needs Feedback" Logic

**Status:** pending

As a job seeker,
I want to be reminded when applications need follow-up,
So that I don't miss opportunities to check on my application status with employers.

**Acceptance Criteria:**

AC #1: Given an application with status "Applied," when more than 7 days have passed since the last status change, then it is flagged as "Needs Feedback"
AC #2: Given an application with status "Interview," when more than 3 days have passed since the most recent interview's scheduled date with no outcome recorded, then it is flagged as "Needs Feedback"
AC #3: Given the application list view, when an application is flagged, then a visible "Needs Feedback" badge or indicator is displayed
AC #4: Given the dashboard, when there are applications needing feedback, then a count or summary is shown (e.g., "3 applications need follow-up")
AC #5: Given a user updates an application's status or records an interview outcome, when the update is saved, then the "Needs Feedback" flag is cleared
AC #6: Given the "Needs Feedback" logic, when configured, then the thresholds (7 days, 3 days) are defined as constants that can be easily adjusted

**Edge Cases:**
- Application with status "Rejected" or "Offer" → never flagged
- Application with status "Draft" or "Saved" → never flagged (not yet submitted)
- Application just created with "Applied" status → not flagged until threshold passes
- User in different timezone → use UTC consistently

**Tasks / Subtasks:**

- [ ] **Task 1**: Define and implement feedback logic (AC: #1, #2, #6)
  - [ ] 1.1: Define feedback threshold constants in backend config
  - [ ] 1.2: Create a service/function that evaluates "needs feedback" per application
  - [ ] 1.3: For "Applied" status: check days since `updated_at` or status change timestamp
  - [ ] 1.4: For "Interview" status: check days since most recent interview's `scheduled_date` where outcome is null

- [ ] **Task 2**: Update API responses (AC: #3, #5)
  - [ ] 2.1: Add `needs_feedback` boolean field to application list/detail API responses
  - [ ] 2.2: Compute the flag at query time or in the service layer
  - [ ] 2.3: Ensure flag clears when status changes or outcome is recorded

- [ ] **Task 3**: Dashboard integration (AC: #4)
  - [ ] 3.1: Add "needs feedback" count to dashboard stats endpoint
  - [ ] 3.2: Display count on dashboard (e.g., as a new stat card or alert banner)

- [ ] **Task 4**: Frontend display (AC: #3)
  - [ ] 4.1: Add "Needs Feedback" badge component
  - [ ] 4.2: Display badge on application list items that are flagged
  - [ ] 4.3: Optionally add a filter for "Needs Feedback" applications

- [ ] **Task 5**: Write tests (AC: #1, #2, #5)
  - [ ] 5.1: Unit test feedback logic for each status + time threshold combination
  - [ ] 5.2: Test that flag clears on status update and outcome recording
  - [ ] 5.3: Test edge cases (Rejected, Offer, Draft — never flagged)

**Technical Notes:**
- This is computed state, not stored — calculate at query time based on timestamps and status
- Consider adding `status_changed_at` column if `updated_at` is unreliable (any update resets it)
- Dashboard stats cache (5-minute TTL) means feedback counts may be slightly stale — acceptable
- Depends on Epic 9 for accurate status values (especially Draft and proper Interview status)

**Estimated Effort:** 5 points (3-5 days)

---

## Implementation Timeline - Epic 11

**Total Story Points:** 13

**Estimated Timeline:** 1.5-2 weeks (8-12 days)

| Story | Points | Dependencies | Phase |
|-------|--------|-------------|-------|
| 11.1: File Page UX & Document Cards | 5 | None | UX Improvement |
| 11.2: Light Theme Color Audit | 3 | None | Visual Polish |
| 11.3: "Needs Feedback" Logic | 5 | Epic 9 | Feature Addition |

**Note:** Stories 11.1 and 11.2 can be worked in parallel. Story 11.3 should follow Epic 9 completion for accurate status data.
