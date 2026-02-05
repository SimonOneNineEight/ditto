# Epic 3 Retrospective: Technical Assessment Tracking

**Date:** 2026-02-05
**Facilitator:** Bob (Scrum Master)
**Participants:** Simon (Project Lead), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer), Elena (Junior Dev)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| **Epic Name** | Technical Assessment Tracking |
| **Stories Completed** | 8/8 (100%) |
| **Duration** | 2026-02-04 to 2026-02-05 |
| **Production Incidents** | 0 |
| **Blockers Encountered** | 1 (minor webpack cache issue) |
| **Technical Debt Items** | 3 |
| **Repository Tests Added** | 20+ |

**Stories Delivered:**
1. Story 3.1: Assessment Database Schema and API Foundation
2. Story 3.2: Create Assessment API and Basic CRUD
3. Story 3.3: Assessment Creation and Detail UI
4. Story 3.4: Assessment Status Management and Workflow
5. Story 3.5: Submission Tracking - GitHub Links and Notes
6. Story 3.6: Submission Tracking - File Uploads
7. Story 3.7: Assessment Deadline Integration with Timeline
8. Story 3.8: Assessment List View in Application Detail

**Business Outcomes:**
- Complete assessment tracking with submission support (GitHub links, notes, file uploads)
- Status workflow from not_started through passed/failed
- Timeline integration showing assessment deadlines alongside interviews
- Countdown timers with urgency color coding (overdue, due soon, normal)
- `listAllAssessments()` API ready for Epic 4 dashboard integration

---

## What Went Well

### 1. Design System Update Sprint Paid Off

The focused design sprint (Story 0.1) before Epic 3 was a strategic win. Building assessment UI with consistent styling from day one meant zero visual rework. When Story 3.8 needed card layout adjustments, we had the design file as clear reference.

**Evidence:** Story 3.8 debug log notes "Redesigned AssessmentList card layout to match ditto-design.pen"

### 2. Design File Reference Streamlined Decisions

The team consistently referred to `ditto-design.pen` during implementation, reducing debate about visual details. When "reviewed" status didn't match the design's "passed/failed" model, it was caught early and migrated cleanly.

**Evidence:** Story 3.8 included database migration `000010_update_assessment_status_reviewed_to_passed_failed`

### 3. Repository Test Coverage Achieved

Commitment from Epic 2 retro was honored - 20+ repository tests written for the assessment system. Tests caught bugs before code review.

**Evidence:** All 8 stories have repository tests, Story 3.7 added `ListByUserID` test

### 4. Story-to-Story Knowledge Transfer

"Learnings from Previous Story" sections in each story file effectively captured cross-story knowledge. Patterns discovered in early stories (field allowlists, DueDate formatting, countdown colors) were applied consistently in later stories.

**Evidence:** Story 3.3 Dev Notes reference Story 3.2's DueDate formatting advisory

### 5. Clean Code Reviews

All 8 stories approved on first review round with only LOW severity findings. No HIGH or MEDIUM issues across the entire epic.

**Evidence:** All Senior Developer Review sections show "APPROVE" outcome

### 6. Reusable Patterns Established

| Pattern | Created In | Reused In |
|---------|------------|-----------|
| `getCountdownInfo()` helper | Story 3.3 | Stories 3.7, 3.8 |
| `AssessmentStatusSelect` component | Story 3.4 | Story 3.8 |
| Optimistic UI with rollback | Story 3.4 | Stories 3.5, 3.6, 3.8 |
| Card `inset` variant | Story 3.8 | Available for Epic 4 |
| Select `badge` variant | Story 3.8 | Available for Epic 4 |

---

## What Could Improve

### 1. Accessibility ACs Still Not Added (Priority: HIGH)

**Issue:** Epic 2 action item #2 ("Add Accessibility AC to every UI story") was not implemented. No Epic 3 story has explicit accessibility acceptance criteria.

**Impact:** Accessibility gaps accumulating. Screen reader support untested. Color-only status indicators.

**Evidence:** Zero accessibility ACs across all 8 story files.

**Decision:** Option B adopted - incremental fixes during Epic 4, accessibility standards doc created before Epic 4 starts, no new accessibility debt from this point forward.

### 2. TDD Not Fully Adopted (Priority: MEDIUM)

**Issue:** Tests were written after implementation, not before. This is test-after, not test-driven development.

**Impact:** Lost design benefits of TDD, though regression prevention value retained.

**Evidence:** Story 3.1 tests written after repository implementation.

**Decision:** Adopt hybrid approach - TDD for core domain logic (repositories, services), test-after for integration layers (handlers, UI).

### 3. Missing Endpoint Discovered Late (Priority: LOW)

**Issue:** Story 3.5 was supposed to handle submissions, but DELETE endpoint for submissions was missing. Discovered in Story 3.6.

**Impact:** Minor scope creep in Story 3.6.

**Evidence:** Story 3.6 Task 7.3 notes "Created DELETE /api/assessment-submissions/:submissionId endpoint (was missing from Story 3.5)"

### 4. Design File / Story Spec Conflict Process Unclear

**Issue:** Story 4.3 specifies "Next 5 events" but design file shows 4 items with filter chips not mentioned in spec.

**Impact:** Potential for implementation to diverge from either source.

**Decision:** Escalate design conflicts to Simon for decision. Design file is not auto-authoritative.

---

## Epic 2 Action Items Follow-Through

| # | Action | Status | Evidence |
|---|--------|--------|----------|
| 1 | TDD Pilot on Story 3-1 | :warning: Partial | 20+ tests written, but test-after not test-first |
| 2 | Accessibility AC in Stories | :x: Not Done | No accessibility ACs in any Epic 3 story |
| 3 | Repository Test Coverage | :white_check_mark: Done | 20+ tests, no story marked done without tests |
| 4 | Cross-Epic Dependency Tracking | :white_check_mark: Done | Story 3.7 depends on 2.10 documented |
| 5 | Design Review Gate | :white_check_mark: Done | Design System Update sprint, Story 3.8 design alignment |

**Summary:** 3 of 5 fully done, 1 partial, 1 not done.

---

## Lessons Learned (Carry Forward to Epic 4)

| Lesson | Source | Application |
|--------|--------|-------------|
| Design file reference speeds decisions | All Epic 3 stories | Continue for Epic 4 |
| `getCountdownInfo()` for date urgency display | Story 3.3 | Dashboard upcoming widget |
| Optimistic UI + toast error + rollback pattern | Stories 3.4-3.8 | All Epic 4 interactive features |
| Card `inset` variant for nested cards | Story 3.8 | Dashboard stat cards |
| Select `badge` variant for inline dropdowns | Story 3.8 | Dashboard filters |
| 4-level urgency colors (overdue/tomorrow/soon/normal) | Design file | Dashboard upcoming items |
| Filter chips pattern (All/Type1/Type2) | Design file | Dashboard upcoming section |
| `AssessmentWithContext` type for dashboard data | Story 3.7 | Story 4.3 directly |
| Field allowlist pattern prevents SQL injection | Story 3.2 | Any update handlers |
| Soft delete with `deleted_at IS NULL` everywhere | Story 3.7 | All new queries |

---

## Action Items for Epic 4

### Process Changes

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | **Create Accessibility Standards doc** - ARIA patterns, focus management, color contrast rules | Dana | **DONE** - `docs/accessibility-standards.md` |
| 2 | **Add Accessibility ACs to all Epic 4 UI stories** - Use template from standards doc | Alice/Bob | Before each story starts |
| 3 | **Update Story 4-3** to match design file - filter chips, 4-level urgency colors, 4 items | Bob | Before Epic 4 starts |
| 4 | **Adopt hybrid TDD approach** - TDD for repositories/services, test-after for handlers/UI | Dev Team | Ongoing |
| 5 | **Fix accessibility incrementally** - Address gaps as we touch files in Epic 4 | Dev Team | During Epic 4 |

### Process Rules

| Rule | Description |
|------|-------------|
| **Escalate design conflicts to Simon** | When design file differs from story spec, ask Simon which to follow before proceeding |
| **Accessibility gate** | No UI story marked "done" without accessibility review |
| **Test coverage maintained** | Repository tests required before "done" (continuing from Epic 3) |

### Accessibility Standards Template (For Epic 4 Stories)

```markdown
### Accessibility (AC-A)
- **When** using keyboard navigation
- **Then** all interactive elements are focusable and operable
- **And** focus order is logical
- **And** button/toggle states use `aria-pressed` or `aria-expanded`
- **And** form inputs have associated labels
- **And** status indicators do not rely solely on color
```

### Accessibility Remediation Estimate

| Scope | Effort | Notes |
|-------|--------|-------|
| Fix existing gaps (Option B - incremental) | +1-2 hours per Epic 4 story | As we touch files |
| Remaining gaps after Epic 4 | ~2-3 days | Addressed in Epic 6 |

---

## Epic 4 Readiness Assessment

### Dependencies Satisfied
- [x] `listAllAssessments()` API with context (Story 3.7) - needed for Story 4.3
- [x] Assessment timeline integration (Story 3.7) - pattern for dashboard
- [x] Countdown/urgency patterns (Stories 3.3, 3.8) - reusable for dashboard
- [x] Status colors and badges (Story 3.8) - design system ready
- [x] Filter chips pattern (design file) - ready for implementation

### Technical Prerequisites for Epic 4
- [ ] Update Story 4-3 to match design file
- [ ] Create Accessibility Standards doc
- [ ] Add accessibility ACs to Epic 4 stories

### Risk Areas
1. **Story 4.5 (Notification Center)** - Most complex, may need scope reduction or splitting
2. **Accessibility catch-up** - Adding to each story increases scope slightly

### Cross-Epic Dependencies

| Epic 4 Story | Depends On | Status |
|--------------|------------|--------|
| 4.3 (Upcoming Widget) | Story 3.7 `listAllAssessments()` | Ready |
| 4.4 (Auto-Save) | Epic 2 auto-save pattern | Ready |
| 4.1-4.2 (Dashboard) | Design file Dashboard screen | Ready |

---

## Key Decisions

### 1. Accessibility Approach: Option B (Incremental)

**Decision:** Fix accessibility incrementally during Epic 4, create standards doc to prevent new debt, accept partial gaps in first deployment.

**Rationale:**
- Doesn't delay Epic 4 / first deployment
- Stops the bleeding (no new debt)
- Existing gaps (~3-4 days to fix now) addressed over time
- Full remediation in Epic 6 if needed

### 2. TDD Approach: Hybrid Model

**Decision:** TDD for core domain logic (repositories, services), test-after for integration layers (handlers, UI).

**Rationale:**
- Pure TDD was not realistically adopted
- Hybrid matches what team actually does well
- Repository layer is where bugs hurt most - deserves TDD rigor
- Integration layers benefit from tests but don't need test-first design

### 3. Design Conflict Resolution: Escalate to Simon

**Decision:** When design file differs from story spec, ask Simon which to follow.

**Rationale:**
- Simon is the only human stakeholder
- Sometimes story spec is intentionally simpler for MVP
- Sometimes design file has issues discovered during implementation
- Human judgment needed for these trade-offs

---

## Retrospective Meta

**What worked about this retro:**
- Story-by-story analysis provided concrete evidence
- Epic 2 action item tracking showed improvement patterns
- Design file analysis caught Story 4-3 discrepancy before implementation
- Concrete effort estimates for accessibility options enabled informed decision
- Clear process rules established (not just aspirations)

**Format:** BMad Retrospective Workflow v1.0
**Duration:** ~30 minutes
**Next Retrospective:** After Epic 4 completion (pre-production review)

---

_This retrospective was facilitated using the BMad Method retrospective workflow._
