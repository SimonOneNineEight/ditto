# Epic 1 Retrospective: Enhanced Application Management

**Date:** 2026-01-25
**Facilitator:** Bob (Scrum Master)
**Participants:** Simon (Project Lead), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| **Epic Name** | Enhanced Application Management |
| **Stories Completed** | 6/6 (100%) |
| **Duration** | 2026-01-20 to 2026-01-25 |
| **Production Incidents** | 0 |

**Stories Delivered:**
1. Story 1.1: Job URL Information Extraction Service
2. Story 1.2: Cloud File Storage Infrastructure
3. Story 1.3: Application Form Integration with URL Extraction
4. Story 1.4: Resume and Cover Letter Upload UI
5. Story 1.5: Enhanced Application List with Filtering
6. Story 1.6: Storage Quota Management and Visibility

**Business Outcomes:**
- Users can capture job applications via URL extraction in under 30 seconds
- Cloud file storage with 100MB quota per user
- Application filtering with URL-based persistence
- Storage quota visibility with warning thresholds

---

## What Went Well

### 1. Architectural Decisions
- **Presigned URL pattern for S3** eliminated AWS SDK dependency on frontend. Clean upload flow: get presigned URL → upload to S3 → confirm to backend.
- **Generic fallback parser using JSON-LD** expanded job site coverage beyond the 4 originally planned platforms.
- **Backend filtering already implemented** - Story 1.5 required zero backend changes.

### 2. Code Quality
- **Code reviews caught real issues** before production:
  - Story 1.1: Rate limiting, retry logic, HTML sanitization (6 MEDIUM findings fixed)
  - Story 1.2: Context propagation issue (`context.Background()` → `c.Request.Context()`)
  - Story 1.4: 6/7 ACs passing, clear documentation of partial AC-4
- **Test coverage established** - 70%+ on URL extraction service after improvements

### 3. Patterns Established
- Service layer pattern: `application-service.ts`, `storage-service.ts`, `file-service.ts`
- URL-based filter persistence with `useSearchParams` + `router.replace`
- Debounced inputs (300ms) for API efficiency
- Delete confirmation dialog pattern with AlertDialog
- date-fns standardization for all date formatting

### 4. Documentation
- Design system principles documented (`design-system-principles.md`)
- Enabled self-correction when Story 1.6 used wrong color tokens

---

## What Could Improve

### 1. Design Consistency (Priority: HIGH)
**Issue:** Multiple design iterations required due to:
- Not following design principle doc (e.g., `bg-orange-500` instead of `bg-secondary`)
- Not testing all viewports proactively
- Layout alignment mismatches (Files page not centered like Applications)

**Impact:** Story 1.6 required 3-4 iterations to match existing patterns

**Evidence:**
- Story 1.6: Storage widget had `max-w-md` constraint breaking layout
- Story 1.6: Empty state centered while widget left-aligned

### 2. API Contract Mismatches (Priority: HIGH)
**Issue:** Frontend expected different response structure than backend provided

**Impact:** Runtime error in Story 1.5: `statuses.map is not a function`

**Root Cause:** Backend returned `{data: {statuses: []}}` but frontend expected `{data: []}`

### 3. Story Documentation Gaps (Priority: MEDIUM)
**Issue:** Story 1.2 tasks not marked complete in story file (DoD violation)

**Impact:** Unclear completion status, potential confusion for future reference

### 4. Scope Creep (Priority: LOW)
**Issue:** Story 1.5 added sorting, edit/delete actions beyond story scope

**Impact:** Positive in this case (useful features), but undocumented expansion

### 5. Technical Debt Accumulating (Priority: MEDIUM)
**Issue:** Frontend tests consistently deferred to Epic 6

**Items:**
- Story 1.4: XHR abort on cancel not implemented
- Story 1.4: Retry mechanism for failed uploads not implemented
- All stories: Component tests deferred

---

## Action Items for Epic 2

### Process Changes

| # | Action | Description | Owner |
|---|--------|-------------|-------|
| 1 | **Contract-First TDD** | Write API response shape tests before implementing service functions | Dev Team |
| 2 | **Design Validation Checklist** | Before marking UI complete: check design tokens, test viewports (320px, 768px, 1280px+), compare to reference pages | Dev Team |
| 3 | **Browser Testing Required** | Test on actual browser before marking UI work complete | Dev Team |
| 4 | **Story File Hygiene** | Mark task checkboxes as work progresses | Dev Team |
| 5 | **Scope Documentation** | Flag any scope additions in story completion notes | Dev Team |

### Design Validation Checklist (New)

Before marking any UI task complete:
- [ ] Read `design-system-principles.md` - using correct color tokens?
- [ ] Mobile viewport (320px) - no horizontal scroll, readable text
- [ ] Tablet viewport (768px) - appropriate layout
- [ ] Desktop viewport (1280px+) - matches similar pages
- [ ] Layout alignment - centered where other pages are centered
- [ ] Take screenshot and compare to reference page

### Contract-First TDD Pattern (New)

Before implementing any API service function:
```typescript
test('GET /api/interviews returns expected shape', async () => {
  const response = await api.get('/interviews?application_id=xxx');

  expect(response.data).toHaveProperty('interviews');
  expect(Array.isArray(response.data.interviews)).toBe(true);
});
```

---

## Lessons Learned (Carry Forward to Epic 2)

| Lesson | Source | Application |
|--------|--------|-------------|
| Presigned URLs eliminate frontend SDK need | Story 1.2 | Story 2.8 (interview file uploads) |
| URL-based state persistence pattern | Story 1.5 | Story 2.10 (timeline filters) |
| Service files go in `src/services/` | Story 1.5, 1.6 | All Epic 2 services |
| Compact single-row widgets match filter bars | Story 1.6 | Interview detail page widgets |
| date-fns for all date formatting | Story 1.6 | All Epic 2 date displays |
| Native HTML5 drag-drop simpler than libraries | Story 1.4 | Any future drag-drop needs |
| XHR (not axios) for upload progress tracking | Story 1.4 | Story 2.8 file uploads |

---

## Epic 2 Readiness Assessment

### Dependencies Satisfied
- [x] File storage infrastructure (Story 1.2) - needed for Story 2.8
- [x] Application foundation - needed for interview linking
- [x] Design system documented - needed for consistent UI
- [x] Service layer patterns established

### Technical Prerequisites for Epic 2
- [ ] Database migrations for interviews, interviewers, questions, notes tables
- [ ] Rich text editor selection (TipTap/Slate/Quill)
- [ ] Auto-save infrastructure design

### Risk Areas
1. **Rich text editor complexity** - Story 2.7 requires formatting, paste handling, auto-save
2. **Multi-round context display** - Story 2.9 loads multiple interviews with all related data
3. **12 stories (vs 6 in Epic 1)** - Larger scope, more opportunity for design drift

---

## Retrospective Meta

**What worked about this retro:**
- Story records provided concrete evidence for discussion
- Team perspectives surfaced root causes
- Action items are specific and actionable

**Format:** BMad Retrospective Workflow v1.0
**Duration:** ~30 minutes
**Next Retrospective:** After Epic 2 completion

---

_This retrospective was facilitated using the BMad Method retrospective workflow._
