# Ditto Accessibility Standards

**Created:** 2026-02-05
**Author:** Dana (QA Engineer)
**Standard:** WCAG 2.1 Level AA
**Stack:** Next.js 14, React, shadcn/ui (Radix primitives), Tailwind CSS

---

## Overview

This document defines accessibility standards for the ditto application. All new UI code must follow these guidelines. Existing code should be updated incrementally as files are touched.

**Goal:** WCAG 2.1 Level AA compliance for all user-facing features.

**Key Principle:** Use semantic HTML first. ARIA is a last resort for bridging gaps that native elements cannot solve.

---

## Quick Reference Checklist

Use this checklist for every UI story:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus order is logical (follows visual flow)
- [ ] Focus indicators are visible (never hidden)
- [ ] Color is not the only indicator of status/state
- [ ] Text contrast is 4.5:1 minimum (3:1 for large text)
- [ ] UI component contrast is 3:1 minimum
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Modals trap focus and return focus on close
- [ ] Icon-only buttons have accessible names

---

## Color Contrast Requirements

| Element Type | Minimum Ratio | Example |
|--------------|---------------|---------|
| Normal text (< 18pt) | 4.5:1 | Body text, labels |
| Large text (18pt+ or 14pt bold) | 3:1 | Headings |
| UI components | 3:1 | Borders, icons, badges |
| Focus indicators | 3:1 | Focus rings |

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Browser DevTools accessibility panel

**Our dark theme:** Verify contrast against `$--background` (#09090b) for all foreground colors.

---

## Status Indicators

**Rule:** Never rely on color alone to convey meaning (WCAG 1.4.1).

### Current Issue

Our status badges (not_started, in_progress, submitted, passed, failed) use color coding:
- Gray = not_started
- Blue = in_progress
- Yellow = submitted
- Green = passed
- Red = failed

**Problem:** Users who cannot distinguish colors miss the status.

### Required Fix

Add text labels visible to all users OR icons with alt text:

```tsx
// BAD - color only
<Badge className="bg-green-500" />

// GOOD - color + text
<Badge className="bg-green-500">Passed</Badge>

// GOOD - color + icon with sr-only text
<Badge className="bg-green-500">
  <CheckIcon aria-hidden="true" />
  <span className="sr-only">Passed</span>
</Badge>
```

### Countdown Timer Urgency

Our urgency colors (red=overdue, orange=soon, green=safe) must include text:
- "Overdue" or "Due yesterday" (not just red color)
- "Due tomorrow" or "2 days left" (not just orange color)
- "5 days left" (not just green color)

**Current implementation is compliant** - countdown badges show text like "Overdue", "Tomorrow", "In 3 days".

---

## Keyboard Navigation

### Requirements

1. **All interactive elements must be focusable** via Tab key
2. **Focus order must be logical** - follows visual reading order (top-to-bottom, left-to-right)
3. **Focus indicators must be visible** - never use `outline: none` without replacement
4. **No keyboard traps** - users must be able to navigate away from any element

### Focus Indicator Styling

```css
/* Default Tailwind focus ring - USE THIS */
focus:ring-2 focus:ring-ring focus:ring-offset-2

/* NEVER do this */
outline: none; /* removes focus indicator entirely */
```

### Keyboard Shortcuts for Components

| Component | Key | Action |
|-----------|-----|--------|
| Button | Enter, Space | Activate |
| Link | Enter | Navigate |
| Dropdown/Select | Enter, Space | Open |
| Dropdown options | Arrow Up/Down | Navigate |
| Dropdown option | Enter | Select |
| Modal | Escape | Close |
| Checkbox | Space | Toggle |
| Radio | Arrow keys | Change selection |

**shadcn/ui note:** Radix primitives handle most keyboard interactions automatically. Don't override them.

---

## Form Accessibility

### Labels

Every form input MUST have an associated label:

```tsx
// GOOD - explicit label association
<Label htmlFor="title">Title</Label>
<Input id="title" name="title" />

// GOOD - aria-label for visually hidden labels
<Input aria-label="Search applications" placeholder="Search..." />

// BAD - no label association
<Input placeholder="Title" />  // placeholder is NOT a label
```

### Required Fields

```tsx
// Mark required fields with aria-required
<Input id="title" aria-required="true" />

// Visual indicator should also exist
<Label htmlFor="title">
  Title <span className="text-destructive">*</span>
</Label>
```

### Error Messages

```tsx
// Associate error message with input
<Input
  id="title"
  aria-invalid={!!error}
  aria-describedby={error ? "title-error" : undefined}
/>
{error && (
  <p id="title-error" className="text-destructive text-sm" role="alert">
    {error}
  </p>
)}
```

The `role="alert"` ensures screen readers announce the error immediately.

### Form Validation Pattern

```tsx
// On submit, move focus to first error field
const onSubmit = async (data) => {
  const result = await validate(data);
  if (result.errors) {
    // Focus first error field
    const firstErrorField = Object.keys(result.errors)[0];
    document.getElementById(firstErrorField)?.focus();
  }
};
```

---

## Buttons

### Accessible Names

Every button needs an accessible name:

```tsx
// GOOD - text content provides name
<Button>Save Assessment</Button>

// GOOD - aria-label for icon-only buttons
<Button aria-label="Delete assessment">
  <TrashIcon aria-hidden="true" />
</Button>

// BAD - no accessible name
<Button>
  <TrashIcon />
</Button>
```

### Toggle Buttons

For buttons that toggle state (like status selects):

```tsx
<Button
  aria-pressed={isActive}
  onClick={() => setIsActive(!isActive)}
>
  {isActive ? 'Active' : 'Inactive'}
</Button>
```

### Disabled Buttons

```tsx
// Use both disabled and aria-disabled for maximum compatibility
<Button disabled aria-disabled="true">
  Submitting...
</Button>
```

---

## Dropdowns and Selects

shadcn/ui Select (built on Radix) handles most accessibility automatically:

- `role="combobox"` on trigger
- `role="listbox"` on content
- `role="option"` on items
- `aria-expanded` state management
- Keyboard navigation (arrows, enter, escape)

### Custom Dropdown Checklist

If building a custom dropdown:

- [ ] Trigger has `aria-haspopup="listbox"` or `aria-haspopup="menu"`
- [ ] Trigger has `aria-expanded` reflecting open state
- [ ] Trigger has `aria-controls` pointing to dropdown ID
- [ ] Dropdown has appropriate role (`listbox`, `menu`)
- [ ] Options have `role="option"` or `role="menuitem"`
- [ ] Selected option has `aria-selected="true"`
- [ ] Arrow keys navigate options
- [ ] Enter/Space select option
- [ ] Escape closes dropdown
- [ ] Focus returns to trigger on close

---

## Modals and Dialogs

shadcn/ui Dialog (built on Radix) handles most accessibility automatically.

### Required Behavior

1. **Focus trap** - Tab cycles within modal only
2. **Focus on open** - Focus moves to first focusable element or dialog title
3. **Focus on close** - Focus returns to trigger element
4. **Escape closes** - Pressing Escape dismisses the modal
5. **Background inert** - Content behind modal is not accessible

### ARIA Requirements

```tsx
<Dialog>
  <DialogContent
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogTitle id="dialog-title">Create Assessment</DialogTitle>
    <DialogDescription id="dialog-description">
      Fill out the form to create a new assessment.
    </DialogDescription>
    {/* form content */}
  </DialogContent>
</Dialog>
```

### Delete Confirmation Pattern

```tsx
<AlertDialog>
  <AlertDialogContent role="alertdialog">
    <AlertDialogTitle>Delete Assessment?</AlertDialogTitle>
    <AlertDialogDescription>
      This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Use `alertdialog` role for destructive confirmations - screen readers announce it more urgently.

---

## Tables

### Basic Table Structure

```tsx
<table>
  <caption className="sr-only">Application list</caption>
  <thead>
    <tr>
      <th scope="col">Company</th>
      <th scope="col">Position</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Google</td>
      <td>Software Engineer</td>
      <td>Interview</td>
    </tr>
  </tbody>
</table>
```

### Sortable Columns

```tsx
<th scope="col">
  <button
    aria-sort={sortDirection} // "ascending", "descending", or "none"
    onClick={handleSort}
  >
    Due Date
    <SortIcon aria-hidden="true" />
  </button>
</th>
```

---

## Loading States

### Skeleton Loaders

```tsx
// Mark loading regions
<div aria-busy="true" aria-label="Loading assessments">
  <Skeleton className="h-24 w-full" />
  <Skeleton className="h-24 w-full" />
</div>
```

### Buttons with Loading State

```tsx
<Button disabled aria-disabled="true">
  {isLoading ? (
    <>
      <Spinner aria-hidden="true" />
      <span>Saving...</span>
    </>
  ) : (
    'Save'
  )}
</Button>
```

---

## Images and Icons

### Decorative Icons

Icons that are purely decorative should be hidden from screen readers:

```tsx
<CalendarIcon aria-hidden="true" />
```

### Meaningful Icons

Icons that convey information need accessible text:

```tsx
// Option 1: aria-label on clickable element
<Button aria-label="View calendar">
  <CalendarIcon aria-hidden="true" />
</Button>

// Option 2: sr-only text
<span>
  <CalendarIcon aria-hidden="true" />
  <span className="sr-only">Calendar</span>
</span>
```

### Status Icons

When icons indicate status:

```tsx
// Icon + visible text (preferred)
<span className="flex items-center gap-2">
  <CheckCircleIcon aria-hidden="true" className="text-green-500" />
  <span>Passed</span>
</span>

// Icon with sr-only text (when space is limited)
<CheckCircleIcon aria-label="Status: Passed" className="text-green-500" />
```

---

## Live Regions and Announcements

### Toast Notifications

Our sonner toasts should announce to screen readers:

```tsx
// sonner handles this, but verify role="status" or role="alert"
toast.success("Assessment created"); // role="status"
toast.error("Failed to save");       // role="alert"
```

### Dynamic Content Updates

When content updates without page navigation:

```tsx
// Announce to screen readers
<div aria-live="polite" aria-atomic="true">
  Showing {count} assessments
</div>
```

- `aria-live="polite"` - waits for user to finish current task
- `aria-live="assertive"` - interrupts immediately (use sparingly)

---

## Testing Checklist

### Manual Testing (Required)

1. **Keyboard-only navigation**
   - Tab through entire page
   - Can you reach all interactive elements?
   - Can you activate all buttons/links?
   - Is focus order logical?
   - Are focus indicators visible?

2. **Screen reader testing** (at least one)
   - macOS: VoiceOver (Cmd + F5)
   - Windows: NVDA (free) or JAWS
   - Test: Can you understand the page structure?
   - Test: Are form labels announced?
   - Test: Are errors announced?
   - Test: Are status changes announced?

3. **Color/contrast**
   - Use browser DevTools accessibility panel
   - Check contrast ratios
   - Verify info isn't conveyed by color alone

### Automated Testing (Recommended)

```bash
# Add to CI pipeline (Epic 6)
pnpm add -D @axe-core/react

# Or use browser extension
# - axe DevTools (Chrome/Firefox)
# - WAVE (Chrome/Firefox)
```

---

## Story Acceptance Criteria Template

Add this section to every UI story:

```markdown
### Accessibility (AC-A)
- **When** using keyboard navigation
- **Then** all interactive elements are focusable and operable
- **And** focus order follows visual layout
- **And** focus indicators are visible
- **When** using a screen reader
- **Then** all content and controls are announced correctly
- **And** form labels are associated with inputs
- **And** errors are announced when they occur
- **When** viewing status indicators
- **Then** meaning is conveyed through text/icons, not color alone
```

---

## Ditto-Specific Patterns

### Assessment Status Badge

```tsx
// Accessible status badge with color + text
<Badge className={STATUS_COLORS[status]}>
  {STATUS_LABELS[status]}
</Badge>

// STATUS_LABELS maps status to readable text
const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  passed: 'Passed',
  failed: 'Failed',
};
```

### Countdown Timer

```tsx
// Current implementation is accessible - shows text
<span className={urgencyColor}>
  {countdownText} {/* "Overdue", "Tomorrow", "In 3 days" */}
</span>
```

### Quick Status Update Dropdown

```tsx
// AssessmentStatusSelect - ensure it has accessible name
<AssessmentStatusSelect
  value={status}
  onChange={handleChange}
  aria-label={`Status for ${assessmentTitle}`}
/>
```

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [React Accessibility Docs](https://legacy.reactjs.org/docs/accessibility.html)
- [MDN ARIA Reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes)
- [Deque Accessible Buttons](https://www.deque.com/blog/accessible-aria-buttons/)
- [A11Y Collective - ARIA in HTML](https://www.a11y-collective.com/blog/aria-in-html/)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-02-05 | Initial version created | Dana (QA Engineer) |
