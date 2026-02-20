# Story 2.7: Rich Text Notes - Preparation Area

Status: ready-for-dev

## Story

As a job seeker,
I want a flexible rich text area to write company research, practice answers, and general preparation notes,
So that I can keep all my prep materials in one place without rigid structure.

## Acceptance Criteria

### Given I am viewing an interview detail page

**AC-1**: Notes Section Display
- **When** the page loads
- **Then** I see a "Notes" section with expandable note types: Preparation, Company Research, Feedback, Reflection, General
- **And** each note type shows a preview or "Add notes..." placeholder if empty

**AC-2**: Rich Text Editor with Markdown Support
- **When** I click on a note section to edit
- **Then** a rich text editor opens with formatting toolbar: bold, italic, underline, strikethrough, bullet list, numbered list, headings (H1-H3), links, blockquote
- **And** the editor supports keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic, etc.)
- **And** the editor supports markdown input shortcuts (typing `**text**` converts to bold, `## ` converts to H2, `- ` creates bullet list, etc.)

**AC-3**: Formatting Functionality
- **When** I select text and click a formatting button
- **Then** the selected text is formatted accordingly
- **And** formatting is visible immediately in the editor
- **And** I can toggle formatting off by clicking the button again

**AC-4**: Link Support
- **When** I click the link button
- **Then** a dialog appears to enter URL
- **And** the selected text becomes a clickable link
- **And** links open in a new tab when clicked

**AC-5**: Paste from External Sources
- **When** I paste content from Word, Google Docs, or websites
- **Then** basic formatting is preserved (bold, italic, lists) and converted to markdown
- **And** unsafe content (scripts, styles) is stripped during conversion
- **And** excessive formatting is cleaned up to clean markdown

**AC-6**: Auto-Save with 30-Second Debounce
- **When** I stop typing for 30 seconds
- **Then** content auto-saves with visual "Saving..." indicator
- **And** after save completes, indicator shows "Saved" with timestamp
- **And** if save fails, indicator shows "Save failed - Retry" with retry button

**AC-7**: Save/Update Note
- **When** I click "Save" or trigger auto-save
- **Then** the note content is saved to the database as markdown
- **And** I see a success toast notification
- **And** the note appears in the interview detail with formatted preview (markdown rendered)

**AC-8**: Multiple Note Types
- **When** I add notes to different sections (Preparation, Feedback, etc.)
- **Then** each note type is stored separately
- **And** I can have one note per type per interview
- **And** all notes are loaded when viewing interview details

### Edge Cases

- Empty notes should not be saved (skip API call)
- Notes content is limited to 50KB per note type
- Markdown storage is inherently safe; backend validates no raw HTML injection
- Network errors during save should queue retry with visual feedback
- Editor should handle large content without lag (<50KB)
- Placeholder text disappears when editor is focused

## Tasks / Subtasks

### Backend Development

- [ ] **Task 1**: Create Note Handler (AC: #7, #8)
  - [ ] 1.1: Create `backend/internal/handlers/interview_note.go`
  - [ ] 1.2: Implement `CreateOrUpdateNote` handler for `POST /api/interviews/:id/notes`
  - [ ] 1.3: Validate note_type is valid enum (preparation, company_research, feedback, reflection, general)
  - [ ] 1.4: Validate interview exists and belongs to user
  - [ ] 1.5: Implement upsert logic (create if not exists, update if exists for same note_type)

- [ ] **Task 2**: Markdown Validation Service (AC: #5, #7)
  - [ ] 2.1: Create `backend/internal/services/markdown_service.go`
  - [ ] 2.2: Validate content is plain text/markdown (reject raw HTML tags)
  - [ ] 2.3: Enforce 50KB max content size
  - [ ] 2.4: Optionally normalize markdown (trim whitespace, consistent line endings)

- [ ] **Task 3**: Note Repository (AC: #7, #8)
  - [ ] 3.1: Create `backend/internal/repository/interview_note.go` (if not exists)
  - [ ] 3.2: Implement `CreateInterviewNote`, `UpdateInterviewNote`, `GetNoteByInterviewAndType`
  - [ ] 3.3: Implement `GetNotesByInterview` for loading all notes

- [ ] **Task 4**: Register Note Routes
  - [ ] 4.1: Create `backend/internal/routes/interview_note.go`
  - [ ] 4.2: Register route: POST /api/interviews/:id/notes
  - [ ] 4.3: Apply auth middleware

### Frontend Development

- [ ] **Task 5**: Install TipTap and Markdown Dependencies
  - [ ] 5.1: Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`
  - [ ] 5.2: Install `@tiptap/pm` for markdown serialization (prosemirror-markdown)
  - [ ] 5.3: Install `react-markdown` + `remark-gfm` for rendering markdown in preview mode
  - [ ] 5.4: Create TypeScript types for TipTap if needed

- [ ] **Task 6**: Create RichTextEditor Component (AC: #2, #3, #4)
  - [ ] 6.1: Create `frontend/src/components/shared/rich-text-editor.tsx`
  - [ ] 6.2: Initialize TipTap with StarterKit, Link, Underline, Placeholder extensions
  - [ ] 6.3: Enable markdown input shortcuts (StarterKit includes these by default: `**bold**`, `## heading`, `- list`, etc.)
  - [ ] 6.4: Create formatting toolbar with shadcn/ui Toggle buttons
  - [ ] 6.5: Implement keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
  - [ ] 6.6: Add link dialog for URL input
  - [ ] 6.7: Convert pasted HTML content to markdown-compatible format (strip unsafe tags)
  - [ ] 6.8: Accept `value` (markdown), `onChange` (returns markdown), `placeholder` props
  - [ ] 6.9: Implement markdown serialization on output using prosemirror-markdown

- [ ] **Task 7**: Create useAutoSave Hook Enhancement (AC: #6)
  - [ ] 7.1: Create/enhance `frontend/src/lib/hooks/useAutoSave.ts`
  - [ ] 7.2: Implement 30-second debounce timer
  - [ ] 7.3: Track save status: 'idle' | 'saving' | 'saved' | 'error'
  - [ ] 7.4: Support retry on error
  - [ ] 7.5: Only save if content changed since last save (hash comparison)

- [ ] **Task 8**: Update Interview Service (AC: #7, #8)
  - [ ] 8.1: Add `createOrUpdateNote(interviewId, noteType, content)` function
  - [ ] 8.2: Handle sanitization errors from backend

- [ ] **Task 9**: Create NotesSection Component (AC: #1, #7, #8)
  - [ ] 9.1: Create `frontend/src/components/interview-detail/notes-section.tsx`
  - [ ] 9.2: Display note types as collapsible sections (Preparation, Company Research, Feedback, Reflection, General)
  - [ ] 9.3: Show preview text or placeholder for each note type
  - [ ] 9.4: Integrate RichTextEditor when section is expanded/editing
  - [ ] 9.5: Integrate useAutoSave hook with 30s debounce
  - [ ] 9.6: Show auto-save status indicator ("Saving...", "Saved", "Save failed - Retry")
  - [ ] 9.7: Call `onUpdate` callback after successful save

- [ ] **Task 10**: Integrate NotesSection into Interview Detail Page
  - [ ] 10.1: Add NotesSection to interview detail page
  - [ ] 10.2: Pass notes data and onUpdate callback
  - [ ] 10.3: Load notes from `getInterviewWithDetails` response

### Testing

- [ ] **Task 11**: Manual Testing
  - [ ] 11.1: Test rich text formatting via toolbar (bold, italic, lists, headings)
  - [ ] 11.2: Test markdown input shortcuts (`**bold**`, `## heading`, `- list`)
  - [ ] 11.3: Test link insertion and clicking
  - [ ] 11.4: Test paste from Word/Google Docs (converts to markdown)
  - [ ] 11.5: Test 30-second auto-save triggers
  - [ ] 11.6: Test save status indicators
  - [ ] 11.7: Test multiple note types (one per type)
  - [ ] 11.8: Test raw HTML rejection (paste `<script>` tags → stripped)
  - [ ] 11.9: Test content size limit (50KB)
  - [ ] 11.10: Test error handling on save failure
  - [ ] 11.11: Test markdown preview rendering

## Dev Notes

### Architecture Constraints

**From Epic 2 Tech Spec (modified for markdown storage):**
- Use TipTap 3.0+ for rich text editing (headless, customizable, shadcn/ui compatible)
- Enable markdown input shortcuts in TipTap (StarterKit default behavior)
- Serialize editor content to markdown for storage using prosemirror-markdown
- Backend validates markdown (rejects raw HTML, enforces size limit)
- Store content as markdown (max 50KB per note) - inherently safer than HTML
- Render markdown to HTML on frontend using react-markdown + remark-gfm
- Auto-save with 30s debounce per PRD requirement
- Note types enum: preparation, company_research, feedback, reflection, general

**API Contract:**

```typescript
// POST /api/interviews/:id/notes (upsert)
interface CreateOrUpdateNoteRequest {
  note_type: 'preparation' | 'company_research' | 'feedback' | 'reflection' | 'general';
  content: string;  // Markdown content, validated server-side
}

// Response format
interface InterviewNoteResponse {
  id: string;
  interview_id: string;
  note_type: string;
  content: string;  // Markdown
  created_at: string;
  updated_at: string;
}
```

**Database Schema (from tech-spec-epic-2.md):**

```sql
CREATE TABLE interview_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL, -- preparation, company_research, feedback, reflection, general
    content TEXT, -- Markdown (max 50KB)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_interview_notes_interview_id ON interview_notes(interview_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_interview_notes_unique_type ON interview_notes(interview_id, note_type) WHERE deleted_at IS NULL;
```

### Project Structure Notes

**New Files:**
```
backend/
├── internal/
│   ├── handlers/interview_note.go       # Note CRUD handler
│   ├── repository/interview_note.go     # Note repository
│   ├── routes/interview_note.go         # Route registration
│   └── services/markdown_service.go     # Markdown validation service

frontend/
├── src/
│   ├── components/
│   │   ├── shared/rich-text-editor.tsx  # TipTap wrapper component (markdown I/O)
│   │   └── interview-detail/
│   │       └── notes-section.tsx        # Notes section with CRUD
│   └── lib/hooks/useAutoSave.ts         # Auto-save hook
```

**Existing Files to Modify:**
- `backend/cmd/server/main.go` - Register note routes
- `frontend/src/services/interview-service.ts` - Add note CRUD functions
- `frontend/src/app/(app)/interviews/[id]/page.tsx` - Ensure NotesSection integration
- `frontend/package.json` - Add TipTap, prosemirror-markdown, react-markdown dependencies

### Learnings from Previous Story

**From Story 2-6-questions-and-answers-dynamic-list-management (Status: done)**

- **Auto-save Pattern**: Use `useCallback` + `useRef` for debounce timer. Reset timer on content change. Track last saved content to avoid unnecessary saves.
- **Handler Pattern**: `backend/internal/handlers/interview_question.go` shows ownership validation through interview → user chain. Apply same pattern for notes.
- **Repository Pattern**: `backend/internal/repository/interview_question.go` shows CRUD with soft delete. For notes, add upsert logic (unique constraint on interview_id + note_type).
- **Route Registration**: `backend/internal/routes/interview_question.go` pattern. Apply auth middleware.
- **Service Functions**: `frontend/src/services/interview-service.ts` has established patterns. Follow for notes.
- **CollapsibleSection**: Use existing `CollapsibleSection` component for note type organization.
- **Toast Notifications**: Use sonner for success/error feedback.
- **Status Indicator**: Questions section shows "Saving..."/"Saved" - extend pattern for notes.
- **Database table exists**: `interview_notes` table created in migration 000005 (interview system). No new migration needed.

[Source: stories/2-6-questions-and-answers-dynamic-list-management.md#Dev-Agent-Record]

### References

- [Source: docs/design-system-principles.md] - UI/UX design principles
- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts#Note-Entity]
- [Source: docs/tech-spec-epic-2.md#APIs-and-Interfaces#Note-Endpoints]
- [Source: docs/tech-spec-epic-2.md#Detailed-Design#Services-and-Modules (Sanitizer Service, RichTextEditor)]
- [Source: docs/epics.md#Story-2.7]
- [Source: docs/architecture.md#Technology-Stack-Details (TipTap, react-markdown)]
- [Source: backend/internal/handlers/interview_question.go] - Handler pattern
- [Source: frontend/src/components/interview-detail/questions-section.tsx] - Auto-save pattern

## Dev Agent Record

### Context Reference

- `docs/stories/2-7-rich-text-notes-preparation-area.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List

---

## Change Log

### 2026-01-27 - Updated to Markdown Storage
- **Version:** v1.1
- **Author:** Claude Opus 4.5 (Dev Agent)
- **Status:** Drafted
- **Summary:** Changed storage format from sanitized HTML to markdown. Benefits: cleaner storage, simpler validation (no bluemonday/DOMPurify needed), inherently safer, supports markdown input shortcuts (`**bold**`, `## heading`). Updated Task 2 (markdown validation service), Task 5 (dependencies), Task 6 (markdown I/O), Task 11 (testing). Added react-markdown for rendering, prosemirror-markdown for serialization.

### 2026-01-27 - Story Drafted
- **Version:** v1.0
- **Author:** Claude Opus 4.5 (via BMad create-story workflow)
- **Status:** Drafted
- **Summary:** Created story for Rich Text Notes - Preparation Area. Seventh story in Epic 2, introduces TipTap rich text editor with 30s auto-save. Backend note handler with upsert logic and HTML sanitization (bluemonday). Frontend RichTextEditor component (TipTap wrapper), NotesSection with multiple note types, useAutoSave hook. 11 tasks covering backend sanitization service, frontend TipTap integration, and manual testing. Uses existing interview_notes table from migration 000005.

---
