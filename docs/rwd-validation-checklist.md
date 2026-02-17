# RWD Validation Checklist

## Breakpoints to Test

| Device | Width | How to Test |
|--------|-------|-------------|
| Mobile | 375px | Chrome DevTools → iPhone SE/12 |
| Tablet | 768px | Chrome DevTools → iPad |
| Desktop | 1280px+ | Normal browser window |

---

## 1. Authentication Pages

### Login Page (`/login`)
- [ ] Form layout stacks properly on mobile
- [ ] Input fields have proper touch targets (44px min)
- [ ] OAuth buttons are full width on mobile
- [ ] Session expired message displays correctly
- [ ] Keyboard doesn't obscure inputs on mobile

### Register Page (`/register`)
- [ ] Form layout stacks properly on mobile
- [ ] All 4 fields visible and accessible
- [ ] OAuth buttons work on mobile

---

## 2. Main Layout

### Sidebar
- [ ] Hidden on mobile/tablet (< 1024px)
- [ ] ResponsiveHeader shows on mobile instead
- [ ] NavSheet opens from hamburger menu
- [ ] NavSheet closes on link click
- [ ] User avatar menu works in NavSheet

### Navbar
- [ ] Global search adapts to screen size
- [ ] Notification dropdown positions correctly
- [ ] Action buttons visible/accessible

---

## 3. Dashboard Page (`/`)

- [ ] Stats cards grid: 2x2 on mobile/tablet, 4x1 on desktop
- [ ] Upcoming widget scrolls horizontally on mobile
- [ ] Recent applications list readable on mobile
- [ ] FAB appears on mobile for quick actions
- [ ] "View all" links are touch-friendly

---

## 4. Applications Pages

### List Page (`/applications`)
- [ ] Table view on desktop
- [ ] Card view on mobile (MobileAppCard)
- [ ] Filter button shows on mobile (bottom sheet)
- [ ] Filter bottom sheet opens/closes properly
- [ ] Sort options work in bottom sheet
- [ ] Status filter toggles work
- [ ] Pagination works on mobile
- [ ] "Add Application" button accessible

### Detail Page (`/applications/[id]`)
- [ ] Layout stacks vertically on mobile
- [ ] All sections collapsible and readable
- [ ] Action buttons accessible
- [ ] Back navigation works

### Add/Edit Form (`/applications/new`)
- [ ] Form fields stack on mobile
- [ ] Date pickers work on mobile
- [ ] Select dropdowns position correctly
- [ ] Submit button full width on mobile

### Assessment Page (`/applications/[id]/assessments/[id]`)
- [ ] Layout adapts to mobile
- [ ] Rich text editor usable on mobile
- [ ] Action buttons accessible

---

## 5. Interviews Pages

### List Page (`/interviews`)
- [ ] Table view on desktop
- [ ] Card view on mobile (InterviewCardList)
- [ ] Filter/sort accessible on mobile
- [ ] "Needs Feedback" section responsive
- [ ] FAB for quick add on mobile

### Detail Page (`/interviews/[id]`)
- [ ] Rounds strip scrolls horizontally on mobile
- [ ] Detail cards stack vertically
- [ ] Each card section works:
  - [ ] Details card
  - [ ] Interviewers card (add/remove works)
  - [ ] Questions card (add/edit/delete works)
  - [ ] Self-assessment card (confidence buttons touch-friendly)
  - [ ] Notes card (rich text editor works)
  - [ ] Documents card

### Interview Form Modal
- [ ] Opens as full-screen on mobile
- [ ] All fields accessible
- [ ] Date/time pickers work
- [ ] Close button visible
- [ ] Submit button accessible

---

## 6. Timeline Page (`/timeline`)

- [ ] Filters adapt to mobile
- [ ] Timeline items readable on mobile
- [ ] Date groups display correctly
- [ ] Action buttons on items accessible

---

## 7. Settings Page (`/settings`)

- [ ] All sections stack on mobile
- [ ] Form inputs full width
- [ ] Toggle switches touch-friendly
- [ ] Delete account button accessible

---

## 8. Modals & Dialogs (Test on Mobile)

| Modal | Location | Check |
|-------|----------|-------|
| Interview Form | Interviews page | [ ] Full-screen on mobile |
| Assessment Form | Application detail | [ ] Full-screen on mobile |
| Application Selector | Interview form | [ ] Bottom sheet behavior |
| Export Dialog | Applications/Interviews | [ ] Adapts to mobile |
| Global Search | Navbar (Cmd+K) | [ ] Full-screen on mobile |
| Notification Dropdown | Navbar | [ ] Positions correctly |
| Confirmation Dialogs | Various | [ ] Centered, readable |

---

## 9. Interactive Components

### Buttons
- [ ] All buttons have 44px min touch target
- [ ] Icon-only buttons have tooltips on desktop
- [ ] Hover states only on desktop (not mobile)

### Dropdowns/Selects
- [ ] Open in correct direction
- [ ] Options scrollable if many
- [ ] Touch-friendly option height

### Forms
- [ ] Labels visible
- [ ] Error messages display correctly
- [ ] Keyboard navigation works

### Tables
- [ ] Horizontal scroll on mobile OR switch to card view

---

## 10. Edge Cases

- [ ] Rotate device (portrait ↔ landscape)
- [ ] Very long text/names truncate properly
- [ ] Empty states display correctly on mobile
- [ ] Loading states work on mobile
- [ ] Error states readable on mobile

---

## Testing Process

1. **Open Chrome DevTools** (F12)
2. **Toggle device toolbar** (Ctrl+Shift+M)
3. **Test each breakpoint** for every page
4. **Interact with every button/modal**
5. **Note any issues** with screenshots

---

## Issues Found

| Page | Component | Issue | Status |
|------|-----------|-------|--------|
| | | | |

---

## Sign-off

- [ ] Mobile (375px) - All checks passed
- [ ] Tablet (768px) - All checks passed
- [ ] Desktop (1280px+) - All checks passed

**Tested by:** _______________
**Date:** _______________
