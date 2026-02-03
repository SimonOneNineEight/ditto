# Story 0.1: Design System Update

Status: in-progress

## Story

As a user,
I want the application to have a polished, consistent dark theme UI,
So that the experience feels professional and matches the intended design vision.

## Background

This is a focused design sprint between Epic 2 and Epic 3 to update the application's visual design based on the complete redesign in `ditto-design.pen`. The design file contains 92 reusable components and 25 screen designs covering all existing pages plus Epic 3 screens.

**Design Reference:** `ditto-design.pen` (root of repository)

## Acceptance Criteria

### Given the design system in ditto-design.pen

**AC-1**: Color Palette Updated
- **When** I view any page in the application
- **Then** the color scheme matches the dark theme from the design file
- **And** CSS variables/tokens are updated in `globals.css` or Tailwind config
- **And** all pages use the new color tokens consistently

**AC-2**: Typography Updated
- **When** I view text throughout the application
- **Then** font sizes, weights, and line heights match the design file
- **And** heading hierarchy (H1-H3) is consistent across pages

**AC-3**: Core Components Updated
- **When** I interact with buttons, inputs, badges, cards
- **Then** they match the styling in the design file components:
  - Buttons: Primary, Secondary, Ghost, Destructive variants
  - Inputs: Default, Hover, Focus, Empty states
  - Badges: All status and type variants (Applied, Interview, Phone, Technical, etc.)
  - Cards: Basic, Bordered, Stat variants
- **And** hover/focus states match the design

**AC-4**: Sidebar Navigation Updated
- **When** I view the sidebar navigation
- **Then** it matches the design file (NavItem Default/Active/Hover, SidebarUser)
- **And** active state highlighting works correctly

**AC-5**: Table Styling Updated
- **When** I view data tables (Applications, Interviews)
- **Then** table headers, rows, and hover states match the design file
- **And** pagination styling is consistent

**AC-6**: Form Elements Updated
- **When** I interact with forms
- **Then** selects, textareas, checkboxes, toggles, date inputs match the design
- **And** dropzone/file upload styling matches

**AC-7**: Feedback Components Updated
- **When** I see toasts, alerts, modals, tooltips
- **Then** they match the design file styling
- **And** empty states match the EmptyState component design

**AC-8**: Pages Visually Match Design
- **When** I navigate to each main page
- **Then** the layout and styling closely matches the design file:
  - Dashboard
  - Applications (list, detail, new, empty)
  - Interviews (list, detail, empty)
  - Files (list, empty, near limit)
  - Settings

## Tasks / Subtasks

### Design Token Updates

- [x] **Task 1**: Update Color Tokens (AC: #1)
  - [x] 1.1: Extract color values from design file
  - [x] 1.2: Update CSS variables in `globals.css` or Tailwind config
  - [x] 1.3: Update shadcn theme colors if needed
  - [x] 1.4: Verify dark theme is applied globally

- [x] **Task 2**: Update Typography Tokens (AC: #2)
  - [x] 2.1: Extract font sizes, weights, line heights from design file
  - [x] 2.2: Update Tailwind typography config
  - [x] 2.3: Verify heading styles across pages

### Component Updates

- [x] **Task 3**: Update Button Components (AC: #3)
  - [x] 3.1: Update Primary, Secondary, Ghost, Destructive variants
  - [x] 3.2: Verify hover/focus states

- [x] **Task 4**: Update Input Components (AC: #3, #6)
  - [x] 4.1: Update Input, Select, Textarea, DateInput styling
  - [x] 4.2: Update Checkbox, Radio, Toggle styling
  - [x] 4.3: Update Dropzone styling

- [x] **Task 5**: Update Badge Components (AC: #3)
  - [x] 5.1: Update all badge variants to match design
  - [x] 5.2: Ensure consistent usage across pages

- [x] **Task 6**: Update Card Components (AC: #3)
  - [x] 6.1: Update Card/Basic, Card/Bordered styling
  - [x] 6.2: Update Card/Stat variants for dashboard

- [x] **Task 7**: Update Navigation Components (AC: #4)
  - [x] 7.1: Update Sidebar styling
  - [x] 7.2: Update NavItem Default/Active/Hover states
  - [x] 7.3: Update SidebarUser component

- [x] **Task 8**: Update Table Components (AC: #5)
  - [x] 8.1: Update Table/Header, Table/Row, Table/RowHover styling
  - [x] 8.2: Update Table/Pagination styling

- [x] **Task 9**: Update Feedback Components (AC: #7)
  - [x] 9.1: Update Toast/Default, Toast/Success, Toast/Error
  - [x] 9.2: Update Alert variants
  - [x] 9.3: Update Modal/Dialog styling
  - [x] 9.4: Update EmptyState component

### Page-Level Updates

- [ ] **Task 10**: Update Dashboard Page (AC: #8) - SKIPPED (placeholder page)
  - [ ] 10.1: Implement stat cards layout
  - [ ] 10.2: Implement Upcoming Interviews widget
  - [ ] 10.3: Implement Upcoming Deadlines widget (prep for Epic 3)
  - [ ] 10.4: Implement Recent Applications section

- [x] **Task 11**: Update Applications Pages (AC: #8)
  - [x] 11.1: Update Applications list page styling
  - [x] 11.2: Update Application Detail page styling
  - [x] 11.3: Update New Application form styling
  - [x] 11.4: Update empty state

- [x] **Task 12**: Update Interviews Pages (AC: #8)
  - [x] 12.1: Update Interviews list page styling
  - [x] 12.2: Update Interview Detail page styling
  - [x] 12.3: Update modal dialogs styling
  - [x] 12.4: Update empty state

- [x] **Task 13**: Update Files Page (AC: #8)
  - [x] 13.1: Update Files list styling
  - [x] 13.2: Update storage quota widget styling
  - [x] 13.3: Update empty and near-limit states

- [ ] **Task 14**: Update Settings Page (AC: #8) - SKIPPED (placeholder page)
  - [ ] 14.1: Update Settings page styling
  - [ ] 14.2: Update user dropdown styling

### Verification

- [ ] **Task 15**: Visual Verification
  - [ ] 15.1: Compare each page to design file screenshot
  - [ ] 15.2: Verify responsive behavior (mobile, tablet, desktop)
  - [ ] 15.3: Verify all interactive states (hover, focus, active)
  - [ ] 15.4: Cross-browser check (Chrome, Firefox, Safari)

## Dev Notes

### Architecture Constraints

- Use existing shadcn/ui component structure - update styling, don't rebuild
- Maintain all existing functionality - this is visual only
- Design file (`ditto-design.pen`) is the source of truth
- Use Pencil MCP tools to extract exact values from design file

### Design File Reference

**Components (92 total):** See `get_editor_state` output for full list including:
- Buttons: `1fbnY`, `7Zygg`, `m9A9A`, `1nAFr`
- Inputs: `Zv7Kv`, `DtmGy`, `ZXk9L`, `AWLcV`
- Badges: `8ZC3n`, `anixq`, `32a5T`, `acnBM`, etc.
- Cards: `8045W`, `n9uSP`, `QBiyZ`

**Screens (25 total):**
- Auth: Login (`T5Fuo`), Register (`3eIiO`)
- Dashboard: `yRtnW`
- Applications: `oVbzN`, `NgvlO`, `2sru6`, `Kl5bQ`
- Interviews: `dpfAo`, `lPXYu`, `J9A6r`, + modals
- Files: `Sulfb`, `dw09T`, `nkJrO`
- Settings: `ZEpiS`, `X0iY9`

### Workflow

1. Use `mcp__pencil__batch_get` to read component properties
2. Use `mcp__pencil__get_screenshot` to compare visually
3. Update CSS/components to match
4. Verify with screenshots

### References

- [Design File: ditto-design.pen](../ditto-design.pen)
- [Design System Principles](../design-system-principles.md)
- [Epic 2 Retrospective](../retrospectives/epic-2-retrospective.md) - Decision to do design update before Epic 3

## Dev Agent Record

### Context Reference

- Story does not require context.xml - design file is the reference

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List

---

## Change Log

### 2026-02-02 - Story Created
- **Version:** v1.0
- **Author:** Claude Opus 4.5 (via Epic 2 Retrospective)
- **Status:** Backlog
- **Summary:** Created Design System Update story as a focused sprint between Epic 2 and Epic 3. Covers updating all visual styling to match the redesigned UI in ditto-design.pen. 15 tasks covering tokens, components, pages, and verification.
