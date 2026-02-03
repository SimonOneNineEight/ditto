# Epic 2 Retrospective: Deep Interview Management

**Date:** 2026-02-02
**Facilitator:** Bob (Scrum Master)
**Participants:** Simon (Project Lead), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| **Epic Name** | Deep Interview Management |
| **Stories Completed** | 12/12 (100%) |
| **Duration** | 2026-01-26 to 2026-02-02 |
| **Production Incidents** | 0 |

**Stories Delivered:**
1. Story 2.1: Interview Database Schema and API Foundation
2. Story 2.2: Create Interview Round Basic API
3. Story 2.3: Interview Form UI Quick Capture
4. Story 2.4: Interview Detail View Structured Data Display
5. Story 2.5: Add Interviewers to Interview
6. Story 2.6: Questions and Answers Dynamic List Management
7. Story 2.7: Rich Text Notes Preparation Area
8. Story 2.8: File Uploads for Interview Prep Documents
9. Story 2.9: Multi-Round Context Previous Rounds Display
10. Story 2.10: Interview List and Timeline View
11. Story 2.11: Update and Delete Interview Operations
12. Story 2.12: Interview Performance Self-Assessment

**Business Outcomes:**
- Complete interview tracking with multi-round support
- Rich preparation tools: notes, Q&A, file uploads, interviewers
- Self-assessment for performance tracking across interviews
- Timeline view for visualizing interview schedule
- "Magic moment" delivered: Round 2 prep shows Round 1 context instantly

---

## What Went Well

### 1. Architectural Patterns Scaled Beautifully

- **Repository/Handler/Route pattern** established in Epic 1 extended seamlessly to 4 new domain entities (interviews, interviewers, questions, notes)
- **Soft delete pattern** with `deleted_at IS NULL` became consistent across all queries. When Story 2-10 revealed interviews from deleted applications appearing, the fix was surgical—one WHERE clause addition per query
- **Presigned URL pattern from Epic 1** reused in Story 2-8 with zero additional S3 infrastructure changes

### 2. Reusable Component Library Expanded

| Component | Created In | Reused In |
|-----------|------------|-----------|
| `CollapsibleSection` | Story 2.4 | Stories 2.5, 2.6, 2.7, 2.8, 2.12 |
| `DeleteConfirmDialog` | Story 2.11 | 5 files across applications, interviews, questions, interviewers, files |
| `InterviewRoundsPanel` | Story 2.9 | Interview detail page multi-round context |
| `SelfAssessmentSection` | Story 2.12 | Standalone with auto-save pattern |
| `NeedsFeedbackSection` | Story 2.10 | Interview list page |

### 3. Auto-Save Pattern Standardized

The 30-second debounce for text fields + immediate save for selects/buttons pattern was established in Story 2-7 (notes) and applied consistently to Stories 2-6 (Q&A) and 2-12 (self-assessment). This became a reliable template:

```typescript
// Auto-save pattern (30s debounce for text, immediate for selects/buttons)
useEffect(() => {
  if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
  autoSaveTimerRef.current = setTimeout(() => performAutoSave(), 30000);
  return () => clearTimeout(autoSaveTimerRef.current);
}, [textContent]);
```

### 4. Scope Stayed Tight

- Story 2-8 leveraged Epic 1's S3 infrastructure—no wheel reinvention
- Story 2-12 was initially spec'd with slider, but button row was simpler and matched design
- Story 2-9 was redesigned mid-implementation per user feedback (Previous Rounds → All Rounds) without scope creep
- Modal-based edit (Story 2-11) was kept when discovered it already worked, rather than forcing inline editing

### 5. Story Documentation Quality Improved

- Completion notes included specific file:line references (e.g., `handlers/interview.go:177`)
- File lists in Dev Agent Record section made code review verification faster
- Dev Notes sections surfaced architectural constraints from tech spec
- Learnings from Previous Story sections captured cross-story knowledge effectively

---

## What Could Improve

### 1. Contract-First TDD Not Adopted (Priority: HIGH)

**Issue:** Action item #1 from Epic 1 was not implemented. API contracts are documented in dev notes, but no tests are written before implementation.

**Impact:** Runtime errors still possible when frontend/backend expectations diverge.

**Evidence:** No API response shape tests in any Epic 2 story.

**Recommendation:** Epic 3 Story 3-1 (assessment database schema) is the perfect pilot—new domain, clean slate.

### 2. Accessibility Not Systematic (Priority: HIGH)

**Issue:** Accessibility issues caught ad-hoc during code review, not by explicit acceptance criteria.

**Evidence:**
- Story 2-12 code review noted confidence level buttons lack `aria-pressed`
- No stories had explicit accessibility ACs

**Recommendation:** Add "Accessibility" acceptance criteria section to Epic 3 stories.

### 3. No Automated Tests Written (Priority: MEDIUM)

**Issue:** Every story marked "Component tests deferred to Epic 6" but Epic 6 is polish/production-readiness—may be too late.

**Impact:** Regression risk increases with each story. Repository layer has no test coverage.

**Evidence:** All 12 story files defer testing to Epic 6.

**Recommendation:** Epic 3 repository layer should have test coverage before stories move to "done."

### 4. Design Validation Partially Followed (Priority: MEDIUM)

**Issue:** Epic 1 Action Item #2 (Design Validation Checklist) was only partially followed. Some stories noted viewport testing, but it wasn't systematic.

**Evidence:** Story 2.9 required redesign during implementation (previous rounds → all rounds panel).

**Recommendation:** Enforce design review checkpoint before implementation begins.

### 5. Story Files Getting Long (Priority: LOW)

**Issue:** Stories 2-10 and 2-11 have extensive completion notes sections (200+ lines).

**Impact:** Harder to quickly scan story status and requirements.

**Recommendation:** Consider moving detailed implementation logs to separate `.log.md` files.

---

## Action Items for Epic 3

### Process Changes

| # | Action | Description | Owner |
|---|--------|-------------|-------|
| 1 | **TDD Pilot on Story 3-1** | Write repository layer tests before implementing assessment schema | Dev Team |
| 2 | **Accessibility AC in Stories** | Add "Accessibility" section to every UI story with specific WCAG criteria | SM/PM |
| 3 | **Repository Test Coverage** | No story marked "done" without repository layer test for new endpoints | Dev Team |
| 4 | **Cross-Epic Dependency Tracking** | Story 3-7 depends on 2-10 timeline—document in context.xml | SM |
| 5 | **Design Review Gate** | Review design file before implementation, flag discrepancies early | Dev Team |

### Accessibility Acceptance Criteria Template (New)

For every UI story in Epic 3, include:

```markdown
### Accessibility (AC-A)
- **When** using keyboard navigation
- **Then** all interactive elements are focusable and operable
- **And** focus order is logical
- **And** button/toggle states use `aria-pressed` or `aria-expanded`
- **And** form inputs have associated labels
```

### Repository Test Pattern (New)

Before implementing any new repository method:

```go
func TestCreateAssessment(t *testing.T) {
    db := setupTestDB(t)
    repo := NewAssessmentRepository(db)

    assessment := &Assessment{
        ApplicationID: testAppID,
        Title:        "Take-home coding challenge",
        DueDate:      time.Now().Add(7 * 24 * time.Hour),
    }

    err := repo.Create(assessment)
    require.NoError(t, err)
    require.NotEmpty(t, assessment.ID)
}
```

---

## Epic 1 Action Items Follow-Through

| # | Action | Status | Evidence |
|---|--------|--------|----------|
| 1 | Contract-First TDD | :x: Not Addressed | No API tests written before implementation |
| 2 | Design Validation Checklist | :warning: Partial | Some stories noted viewport testing, not systematic |
| 3 | Browser Testing Required | :white_check_mark: Completed | Manual testing tasks included in all UI stories |
| 4 | Story File Hygiene | :white_check_mark: Completed | Tasks marked complete, completion notes detailed |
| 5 | Scope Documentation | :white_check_mark: Completed | Dev notes sections include scope decisions (e.g., 2-9 redesign) |

**Summary:** 3 of 5 action items fully addressed, 1 partial, 1 not addressed.

---

## Lessons Learned (Carry Forward to Epic 3)

| Lesson | Source | Application |
|--------|--------|-------------|
| Auto-save: 30s debounce text, immediate for dropdowns | Stories 2-6, 2-7, 2-12 | Assessment notes/submission tracking |
| CollapsibleSection for dense detail pages | Story 2-4 | Assessment detail view |
| DeleteConfirmDialog for all destructive actions | Story 2-11 | Assessment deletion |
| Soft delete with `deleted_at IS NULL` everywhere | Story 2-10 fix | All assessment queries |
| TipTap + markdown storage for rich text | Story 2-7 | Assessment notes |
| URL-based filter persistence | Story 2-10 | Assessment list filters |
| Modal edit over inline for complex forms | Story 2-11 | Assessment edit |
| getSummary() helper for collapsed section headers | Story 2-12 | Assessment status badges |
| Gin binding validation tags (`oneof=`, `min=`, `max=`) | Story 2-12 | Assessment validation |
| Badge component with cva variants | Story 2-10 | Assessment status/type display |

---

## Epic 3 Readiness Assessment

### Dependencies Satisfied
- [x] Interview infrastructure (Epic 2) - assessments link to applications like interviews do
- [x] File storage (Epic 1 Story 1.2) - needed for Story 3.6 submission file uploads
- [x] Timeline view (Story 2.10) - needed for Story 3.7 deadline integration
- [x] Rich text editor pattern (Story 2.7) - needed for assessment notes
- [x] Soft delete pattern - applied consistently, ready for assessments

### Technical Prerequisites for Epic 3
- [ ] Database migrations for assessments, submissions tables
- [ ] Assessment status workflow design (draft -> active -> submitted -> graded)
- [ ] GitHub URL validation pattern for submission links

### Risk Areas
1. **Status workflow complexity** - Story 3.4 requires state machine for assessment lifecycle
2. **GitHub link validation** - Story 3.5 needs URL parsing and optional API validation
3. **Timeline integration** - Story 3.7 must integrate with existing timeline, not duplicate logic

### Cross-Epic Dependencies

| Epic 3 Story | Depends On | Notes |
|--------------|------------|-------|
| 3.6 | Story 1.2 (S3) | Reuse presigned URL pattern |
| 3.7 | Story 2.10 (Timeline) | Extend timeline, don't rebuild |
| 3.8 | Story 2.4 (Detail View) | Follow CollapsibleSection pattern |

---

## Key Decisions

### 1. Design System Update Sprint Before Epic 3

**Decision:** Implement a focused design sprint (Story 0.1) to update the UI to match the redesigned `ditto-design.pen` before starting Epic 3.

**Rationale:**
- Design file contains 92 components and 25 screens with polished dark theme
- Epic 3 assessment screens are already designed in the file
- Building Epic 3 with new design from day one avoids rework
- Existing pages get visual refresh through component updates

**Scope:** 1-2 days covering color tokens, typography, core components, and page-level styling updates.

**Tracking:** Story `0-1-design-system-update` added to sprint-status.yaml

### 2. First Production Deployment After Epic 4

**Decision:** Deploy to production after completing Epic 4 (Workflow Automation & Dashboard).

**Rationale:**
- Epic 1-4 = Complete MVP per PRD definition
- Epic 3 + 4 combined (14 stories) is smaller than Epic 1 + 2 (18 stories)
- Assessments and dashboard complete the core value proposition
- Epic 5-6 can iterate post-production with real user feedback

**Timeline:**
1. Design Update Sprint (Story 0.1)
2. Epic 3: Technical Assessment Tracking (8 stories)
3. Epic 4: Workflow Automation & Dashboard (6 stories)
4. 🚀 **First Production Deploy**
5. Epic 5-6: Post-production improvements

---

## Retrospective Meta

**What worked about this retro:**
- Story-by-story analysis provided concrete evidence
- Epic 1 action item tracking measured improvement
- Cross-epic dependency preview prepared Epic 3 context
- Reusable component inventory shows code quality gains
- Interactive discussion surfaced key strategic decisions (design sprint, production timeline)

**Format:** BMad Retrospective Workflow v1.0
**Duration:** ~45 minutes
**Next Retrospective:** After Epic 4 completion (pre-production review)

---

_This retrospective was facilitated using the BMad Method retrospective workflow._
