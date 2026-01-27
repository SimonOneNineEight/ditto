# Story 2.3: Interview Form UI - Quick Capture

Status: done

## Story

As a job seeker,
I want a streamlined form to quickly capture initial interview details,
So that I can create the interview record with minimal friction right after scheduling.

## Acceptance Criteria

### Given I am viewing an application detail page

**AC-1**: Add Interview Action
- **When** I click "Add Interview Round" button
- **Then** a modal or dedicated page opens with an interview creation form

**AC-2**: Form Fields Display
- **When** the form opens
- **Then** I see the following fields:
  - Round number (auto-calculated, displayed read-only)
  - Interview type (dropdown with options: Phone Screen, Technical, Behavioral, Panel, Onsite, Other)
  - Scheduled date (date picker, required)
  - Scheduled time (time input, optional)
  - Duration in minutes (number input, optional)

**AC-3**: Successful Submission
- **When** I fill in required fields and click "Create Interview"
- **Then** the interview is created via POST /api/interviews
- **And** a success toast notification is shown
- **And** I am navigated to the interview detail page (or back to application detail page with interview visible)

**AC-4**: Validation Feedback
- **When** I try to submit without required fields (interview_type, scheduled_date)
- **Then** validation errors are shown inline on the form
- **And** the submit button remains disabled until errors are resolved

**AC-5**: Loading State
- **When** I click submit and the API call is in progress
- **Then** the submit button shows a loading state (e.g., "Creating...")
- **And** the form inputs are disabled during submission

**AC-6**: Error Handling
- **When** the API returns an error
- **Then** an error toast notification is shown with a helpful message
- **And** the form remains open so the user can retry

### Edge Cases
- Round number should display "Round 1" for first interview, "Round 2" for second, etc.
- Date picker should default to today's date
- Time input should support 24-hour or AM/PM format based on locale

## Tasks / Subtasks

### Frontend Development

- [ ] **Task 1**: Create Interview Form Modal Component (AC: #1, #2)
  - [ ] 1.1: Create `frontend/src/components/interview-form/interview-form-modal.tsx`
  - [ ] 1.2: Add Dialog/Modal wrapper using shadcn/ui Dialog
  - [ ] 1.3: Create form layout with all required fields
  - [ ] 1.4: Use react-hook-form with zod validation schema

- [ ] **Task 2**: Implement Form Fields (AC: #2)
  - [ ] 2.1: Add interview type Select dropdown with enum options
  - [ ] 2.2: Add date picker for scheduled_date (use shadcn/ui DatePicker or native input)
  - [ ] 2.3: Add time input for scheduled_time (optional)
  - [ ] 2.4: Add number input for duration_minutes (optional)
  - [ ] 2.5: Display round_number as read-only (fetched from API or calculated)

- [ ] **Task 3**: Form Submission and API Integration (AC: #3, #5, #6)
  - [ ] 3.1: Create interview service function in `frontend/src/services/interview-service.ts`
  - [ ] 3.2: Implement form submission handler calling POST /api/interviews
  - [ ] 3.3: Handle success: show toast, navigate to interview detail or close modal
  - [ ] 3.4: Handle error: show error toast, keep form open
  - [ ] 3.5: Implement loading state with disabled inputs

- [ ] **Task 4**: Validation and UX Polish (AC: #4)
  - [ ] 4.1: Add zod schema for interview form validation
  - [ ] 4.2: Show inline validation errors for required fields
  - [ ] 4.3: Disable submit button when form is invalid
  - [ ] 4.4: Default date picker to today's date

- [ ] **Task 5**: Integration with Application Detail Page (AC: #1)
  - [ ] 5.1: Add "Add Interview Round" button to application detail page
  - [ ] 5.2: Wire up button to open InterviewFormModal
  - [ ] 5.3: Pass application_id to the form
  - [ ] 5.4: Refresh interview list after successful creation (if displaying on same page)

### Testing

- [ ] **Task 6**: Manual Testing
  - [ ] 6.1: Test modal opens from application detail page
  - [ ] 6.2: Test form validation (missing required fields)
  - [ ] 6.3: Test successful interview creation
  - [ ] 6.4: Test error handling (simulate API failure)
  - [ ] 6.5: Verify toast notifications appear correctly

## Dev Notes

### Architecture Constraints

**From Epic 2 Tech Spec:**
- Use shadcn/ui components (Dialog, Select, Input, Button)
- Use react-hook-form with zod for form handling
- Use sonner for toast notifications (already set up in codebase)
- Follow existing form patterns from `add-application-form.tsx`

**Request/Response Contract:**

```typescript
// POST /api/interviews
interface CreateInterviewRequest {
  application_id: string; // UUID
  interview_type: 'phone_screen' | 'technical' | 'behavioral' | 'panel' | 'onsite' | 'other';
  scheduled_date: string; // ISO 8601 date: 'YYYY-MM-DD'
  scheduled_time?: string; // HH:MM format, optional
  duration_minutes?: number; // optional
}

// Response: Interview model with round_number populated
interface CreateInterviewResponse {
  interview: {
    id: string;
    application_id: string;
    round_number: number;
    interview_type: string;
    scheduled_date: string;
    scheduled_time?: string;
    duration_minutes?: number;
    created_at: string;
    updated_at: string;
  }
}
```

**Interview Type Enum (display labels):**
- `phone_screen` → "Phone Screen"
- `technical` → "Technical"
- `behavioral` → "Behavioral"
- `panel` → "Panel"
- `onsite` → "Onsite"
- `other` → "Other"

### Project Structure Notes

**New Files:**
```
frontend/
├── src/
│   ├── components/
│   │   └── interview-form/
│   │       ├── interview-form-modal.tsx    # Modal wrapper + form
│   │       └── index.ts                    # Export
│   └── services/
│       └── interview-service.ts            # API calls for interviews
```

**Existing Files to Modify:**
- `frontend/src/app/(app)/applications/[id]/page.tsx` - Add "Add Interview Round" button

### Learnings from Previous Stories

**From Story 2.2 (Status: done)**

- **API Ready**: `POST /api/interviews` endpoint is fully implemented and tested
- **Backend Returns**: Interview object with `round_number` auto-calculated
- **Validation**: Backend validates `interview_type` with `oneof` constraint
- **Date Format**: Use `YYYY-MM-DD` format for `scheduled_date`
- **Auth**: JWT required via Authorization header (handled by axios interceptor)

**From Story 1.3 (Add Application Form):**
- Use `react-hook-form` with `zodResolver` for validation
- Use `Controller` for Select components
- Toast notifications via `sonner` (`toast.success`, `toast.error`)
- Form patterns: `FormField` component for consistent styling
- Loading state: `isSubmitting` from useForm

[Source: stories/2-2-create-interview-round-basic-api.md#Dev-Notes]
[Source: frontend/src/app/(app)/applications/new/add-application-form.tsx]

### References

- [Source: docs/tech-spec-epic-2.md#Story-2.1-2.3-Create-Interview-Round]
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing]
- [Source: docs/epics.md#Story-2.3]
- [Source: docs/architecture.md#Frontend-Architecture]

## Dev Agent Record

### Context Reference

- docs/stories/2-3-interview-form-ui-quick-capture.context.xml

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

---

## Change Log

### 2026-01-26 - Story Drafted
- **Version:** v1.0
- **Author:** Claude Opus 4.5 (via BMad create-story workflow)
- **Status:** Drafted
- **Summary:** Created story for Interview Form UI - Quick Capture. Third story in Epic 2, builds on Story 2.2's API endpoint. Implements interview creation modal with form fields for type, date, time, and duration. 6 tasks covering component creation, API integration, validation, and testing.

---
