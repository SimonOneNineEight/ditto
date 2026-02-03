# Story 2.12: Interview Performance Self-Assessment

Status: done

## Story

As a job seeker,
I want to add my own performance assessment after each interview,
So that I can track how I felt I did and identify patterns over time.

## Acceptance Criteria

### Given I am viewing an interview detail page

**AC-1**: Self-Assessment Section Display
- **When** I view the interview detail page
- **Then** I see a "Self-Assessment" collapsible section
- **And** the section is collapsed by default for new interviews
- **And** the section shows a summary indicator if already filled (e.g., "Good - 4/5")

**AC-2**: Overall Feeling Selection
- **When** I expand the Self-Assessment section
- **Then** I see an "Overall Feeling" dropdown with options: Excellent, Good, Okay, Poor
- **And** selecting a value updates the UI immediately
- **And** the selection persists after page refresh

**AC-3**: What Went Well Field
- **When** I view the Self-Assessment section
- **Then** I see a "What went well?" textarea
- **And** I can type freely with no character limit
- **And** content auto-saves after 30 seconds of inactivity
- **And** a "Saving..." / "Saved" indicator shows during/after save

**AC-4**: Areas for Improvement Field
- **When** I view the Self-Assessment section
- **Then** I see a "What could improve?" textarea
- **And** I can type freely with no character limit
- **And** content auto-saves after 30 seconds of inactivity

**AC-5**: Confidence Level Slider
- **When** I view the Self-Assessment section
- **Then** I see a "Confidence Level" slider from 1-5
- **And** the slider shows labels: 1 (Low) to 5 (High)
- **And** selecting a value updates the UI immediately
- **And** the selection persists after page refresh

**AC-6**: Backend PUT Endpoint
- **When** I update any self-assessment field
- **Then** `PUT /api/interviews/:id` accepts: overall_feeling, went_well, could_improve, confidence_level
- **And** partial updates are supported (only changed fields)
- **And** 200 OK is returned with updated interview
- **And** validation ensures confidence_level is 1-5 if provided
- **And** validation ensures overall_feeling is valid enum value if provided

### Edge Cases

- Self-assessment is entirely optional (can skip completely)
- Can update individual fields without filling all fields
- Empty textarea values stored as null, not empty strings
- Auto-save only triggers if content actually changed

## Tasks / Subtasks

### Backend Development

- [x] **Task 1**: Verify Existing Schema Fields (AC: #6)
  - [x] 1.1: Confirm `interviews` table has: overall_feeling, went_well, could_improve, confidence_level
  - [x] 1.2: Verify UpdateInterview handler accepts these fields
  - [x] 1.3: Add validation for confidence_level (1-5 range) if not present
  - [x] 1.4: Add validation for overall_feeling enum if not present

### Frontend Development

- [x] **Task 2**: Create Self-Assessment Form Component (AC: #1, #2, #3, #4, #5)
  - [x] 2.1: Create `SelfAssessmentSection` component in `components/interview-detail/`
  - [x] 2.2: Add to CollapsibleSection with "Self-Assessment" title
  - [x] 2.3: Implement overall_feeling Select dropdown
  - [x] 2.4: Implement went_well Textarea with auto-resize
  - [x] 2.5: Implement could_improve Textarea with auto-resize
  - [x] 2.6: Implement confidence_level Slider (1-5)

- [x] **Task 3**: Implement Auto-Save for Self-Assessment (AC: #3, #4)
  - [x] 3.1: Use existing auto-save pattern from notes section
  - [x] 3.2: Debounce at 30 seconds
  - [x] 3.3: Show "Saving..." / "Saved" indicator
  - [x] 3.4: Only trigger save if content changed
  - [x] 3.5: Handle save errors with toast notification

- [x] **Task 4**: Integrate with Interview Detail Page (AC: #1)
  - [x] 4.1: Add SelfAssessmentSection to interview detail page
  - [x] 4.2: Pass interview data (overall_feeling, went_well, could_improve, confidence_level)
  - [x] 4.3: Pass onUpdate callback to refresh interview after save
  - [x] 4.4: Position after existing note sections

- [x] **Task 5**: Add Summary Indicator (AC: #1)
  - [x] 5.1: Show summary in collapsed header if filled (e.g., "Good - 4/5")
  - [x] 5.2: Show empty state hint if not filled ("Rate your performance")

### Testing

- [x] **Task 6**: Manual Testing
  - [x] 6.1: Test overall feeling selection saves and persists
  - [x] 6.2: Test went_well textarea auto-saves
  - [x] 6.3: Test could_improve textarea auto-saves
  - [x] 6.4: Test confidence level slider saves and persists
  - [x] 6.5: Test partial updates (fill only some fields)
  - [x] 6.6: Verify auto-save indicator shows correctly
  - [x] 6.7: Test refresh preserves all values

## Dev Notes

### Architecture Constraints

**From Epic 2 Tech Spec:**
- Self-assessment fields already exist in `interviews` table: overall_feeling, went_well, could_improve, confidence_level
- overall_feeling enum: 'excellent', 'good', 'okay', 'poor'
- confidence_level: integer 1-5
- Use existing UpdateInterview handler and PUT /api/interviews/:id endpoint
- Auto-save debounced at 30 seconds (consistent with notes)
- Use toast notifications for success/error feedback

**API Contract (already exists):**

```typescript
// PUT /api/interviews/:id
interface UpdateInterviewRequest {
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  interview_type?: string;
  outcome?: string;
  overall_feeling?: 'excellent' | 'good' | 'okay' | 'poor';
  went_well?: string;
  could_improve?: string;
  confidence_level?: number; // 1-5
}
```

**Existing Code to Leverage:**
- `UpdateInterview` handler in `handlers/interview.go` - already supports these fields
- `updateInterview` in `interview-service.ts` - already implemented
- `CollapsibleSection` component pattern - use for self-assessment section
- Auto-save pattern from `NoteSection` component
- `Select`, `Textarea`, `Slider` from shadcn/ui

### Project Structure Notes

**Files to Create:**
```
frontend/
└── src/
    └── components/
        └── interview-detail/
            └── self-assessment-section.tsx  # NEW
```

**Files to Modify:**
```
frontend/
└── src/
    ├── app/(app)/interviews/[id]/page.tsx  # Add SelfAssessmentSection
    └── components/
        └── interview-detail/
            └── index.ts  # Export SelfAssessmentSection
```

### Learnings from Previous Story

**From Story 2-11-update-and-delete-interview-operations (Status: done)**

- **Reusable Component**: `DeleteConfirmDialog` created - use similar pattern for reusable components
- **Toast Notifications**: Continue using `sonner` for success/error feedback
- **CollapsibleSection**: Already has proper expand/collapse behavior - reuse for self-assessment
- **Auto-save Pattern**: Established in NoteSection - follow same 30s debounce pattern
- **API Pattern**: UpdateInterview handler accepts partial updates - same for self-assessment fields

[Source: stories/2-11-update-and-delete-interview-operations.md#Completion-Notes-List]

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] - Interview entity with self-assessment fields
- [Source: docs/tech-spec-epic-2.md#Acceptance-Criteria#AC-2.12] - Self-assessment acceptance criteria
- [Source: docs/epics.md#Story-2.12-Interview-Performance-Self-Assessment] - Story definition
- [Source: frontend/src/components/interview-detail/note-section.tsx] - Auto-save pattern reference
- [Source: frontend/src/services/interview-service.ts#updateInterview] - Existing update function
- [Source: ditto-design.pen] - Interview Detail and Self-Assessment UI design reference

## Dev Agent Record

### Context Reference

- [Story Context XML](2-12-interview-performance-self-assessment.context.xml)

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

- **Backend Validation Added**: Updated `UpdateInterviewRequest` struct in `handlers/interview.go` with validation tags for `overall_feeling` (oneof=excellent,good,okay,poor) and `confidence_level` (min=1,max=5)
- **Handler Updated**: Added self-assessment field handling in `UpdateInterview` handler with proper nil-to-null conversion for empty strings
- **Frontend Component Created**: New `SelfAssessmentSection` component with:
  - Overall Feeling Select dropdown (immediate save on change)
  - What went well/could improve Textareas (30-second debounce auto-save)
  - Confidence Level 1-5 button row (immediate save on click, shows label like "4 = Confident")
  - Auto-save status indicator (Saving.../Saved/Error)
- **Summary Indicator**: `getSelfAssessmentSummary()` helper generates collapsed header text (e.g., "Good - 4/5")
- **Integration Fix**: Removed `isEmpty`/`emptyState` props from CollapsibleSection wrapper so form always displays (unlike notes sections where you click "Add" first)
- **Design Compliance**: Confidence level uses button row per design file reference (not a slider as originally spec'd)

### File List

**Created:**
- `frontend/src/components/interview-detail/self-assessment-section.tsx`

**Modified:**
- `backend/internal/handlers/interview.go` - Added self-assessment fields to UpdateInterviewRequest with validation
- `frontend/src/services/interview-service.ts` - Added OverallFeeling type export
- `frontend/src/components/interview-detail/index.ts` - Added SelfAssessmentSection export
- `frontend/src/app/(app)/interviews/[id]/page.tsx` - Integrated SelfAssessmentSection with CollapsibleSection

---

## Change Log

### 2026-02-02 - Code Review Approved
- **Version:** v1.2
- **Author:** Claude Opus 4.5 (via BMad code-review workflow)
- **Status:** Done
- **Reviewer Decision:** APPROVED
- **Summary:** Senior Developer code review completed. All 6 acceptance criteria validated with file:line evidence. All 6 tasks verified complete. Code quality is good, follows established patterns (auto-save, CollapsibleSection, validation). Minor note: confidence level buttons could benefit from aria-pressed for accessibility (non-blocking). No critical issues found.

**AC Validation:**
- AC-1 (Section Display): ✅ `page.tsx:314-326`, `self-assessment-section.tsx:257-276`
- AC-2 (Overall Feeling): ✅ `self-assessment-section.tsx:25-30,177-196,130-142`
- AC-3 (Went Well): ✅ `self-assessment-section.tsx:198-209,113-127,161-174`
- AC-4 (Could Improve): ✅ `self-assessment-section.tsx:211-222,113-127`
- AC-5 (Confidence Level): ✅ `self-assessment-section.tsx:32-49,224-251,144-156`
- AC-6 (Backend PUT): ✅ `handlers/interview.go:26-36,224-246`

### 2026-02-02 - Story Implemented
- **Version:** v1.1
- **Author:** Claude Opus 4.5 (via BMad dev-story workflow)
- **Status:** Review
- **Summary:** Implemented Interview Performance Self-Assessment feature. Created SelfAssessmentSection component with Overall Feeling dropdown, What went well/could improve textareas with 30-second auto-save, and Confidence Level 1-5 button row with immediate save. Added backend validation for confidence_level (1-5) and overall_feeling enum. Integrated into interview detail page with summary indicator showing values like "Good - 4/5" in collapsed header. All manual tests passed: immediate saves work for dropdown/buttons, textareas follow established auto-save pattern, data persists after refresh.

### 2026-02-02 - Story Drafted
- **Version:** v1.0
- **Author:** Claude Opus 4.5 (via BMad create-story workflow)
- **Status:** Drafted
- **Summary:** Created story for Interview Performance Self-Assessment. Final story in Epic 2, enables users to rate their interview performance with overall feeling, what went well, areas for improvement, and confidence level. Self-assessment fields already exist in database and API - story focuses on frontend UI with auto-save functionality. 6 tasks covering backend verification, frontend component creation, auto-save integration, and manual testing.
