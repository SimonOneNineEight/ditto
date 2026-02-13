# Story 6.3: Responsive Design - Mobile and Tablet Support

Status: drafted

## Story

As a user,
I want ditto to work well on my phone and tablet,
so that I can access my job search data from any device.

## Acceptance Criteria

1. **Full device range support** - Application functional on screen widths from 375px (mobile) to 3840px (4K desktop) (NFR-4.2, design baseline)
2. **Mobile layout (375-767px)** - MobileHeader with hamburger menu, FAB for create actions, bottom sheets for filters/sort, full-screen modals, readable text without horizontal scrolling
3. **Tablet layout (768-1439px)** - TabletHeader (same pattern as mobile with more spacing), NO sidebar, centered dialog modals, inline filter controls
4. **Desktop layout (1440px+)** - Full sidebar navigation, multi-column layouts, rich toolbars, side-by-side views
5. **Touch targets** - Minimum 44x44px on mobile (WCAG AA compliance)
6. **Mobile-friendly forms** - Forms easy to fill on mobile (proper input types, auto-focus management)
7. **Rich text editor mobile** - TipTap editor works on mobile with simplified toolbar
8. **Modal responsiveness** - Full-screen modals on mobile, centered overlay dialogs on tablet/desktop

## Tasks / Subtasks

- [x] Task 1: Audit Current Responsive State and Plan Breakpoints (AC: 1, 2, 3, 4)
  - [x] 1.1 Test all main pages at 375px, 768px, 1440px widths using Chrome DevTools
  - [x] 1.2 Document current breakage points (horizontal scroll, overlapping elements, unreadable text)
  - [x] 1.3 Define Tailwind breakpoint strategy aligned to design: mobile (375px base), md (768px tablet), lg (1440px desktop)
  - [x] 1.4 Create responsive design checklist for each page

- [x] Task 2: Create ResponsiveHeader and NavSheet Components (AC: 2, 3, 4, 5)
  - [x] 2.1 Create `useBreakpoint` hook returning `'mobile' | 'tablet' | 'desktop'` based on: mobile (<768px), tablet (768-1439px), desktop (1440px+)
  - [x] 2.2 Create `ResponsiveHeader` component that renders appropriate variant based on breakpoint:
    - Mobile (<768px): hamburger, "Ditto" logo (Suez One 20px), notification bell + avatar, padding 16px
    - Tablet (768-1439px): hamburger, "Ditto" logo (Suez One 22px), notification bell + avatar, padding 24px
  - [x] 2.3 Create `NavSheet` component for slide-out navigation: 260px on mobile, 280px on tablet
  - [x] 2.4 NavSheet contents: Ditto logo + close button (X icon), SearchTrigger, nav items (Dashboard, Applications, Interviews, Timeline, Files)
  - [x] 2.5 Implement close on: navigation item click, close button click, overlay/backdrop click
  - [x] 2.6 Hide Sidebar entirely below lg breakpoint (`hidden lg:flex` on Sidebar wrapper)
  - [x] 2.7 Update app layout: show `ResponsiveHeader` on mobile/tablet (`lg:hidden`), show Sidebar on desktop (`hidden lg:flex`)
  - [x] 2.8 Avatar tap triggers `UserDropdown` (component BmHs8) - position anchored to avatar on mobile (full-width - 32px), on tablet (180px width, right-aligned)

- [x] Task 3: Responsive Dashboard Page (AC: 1, 2, 3, 4)
  - [x] 3.1 Convert dashboard stats grid to responsive: 1 col mobile, 2 col tablet, 4 col desktop
  - [x] 3.2 Stack quick actions vertically on mobile, horizontally on desktop
  - [x] 3.3 Make upcoming items widget full width on mobile, sidebar width on desktop
  - [x] 3.4 Test dashboard at all breakpoints

- [x] Task 4: Responsive Application List Page (AC: 1, 2, 3, 4)
  - [x] 4.1 Convert ApplicationTable to card layout on mobile (< md), table on tablet+
  - [x] 4.2 Create `MobileAppCard` component for mobile list view (matches design oVPUj)
  - [x] 4.3 Mobile filters: Simplified to compact search on mobile (full bottom sheets deferred to Task 14)
  - [x] 4.4 Tablet filters: Inline filter controls available on tablet+
  - [x] 4.5 Hide less important columns on tablet, show all on desktop
  - [x] 4.6 Ensure horizontal scrolling avoided at all widths

- [ ] Task 5: Responsive Application Detail Page (AC: 1, 2, 3, 4)
  - [ ] 5.1 Stack application info sections vertically on mobile
  - [ ] 5.2 File list displays as compact cards on mobile
  - [ ] 5.3 Interview and assessment lists stack vertically on mobile
  - [ ] 5.4 Action buttons remain compact/inline on mobile (not full-width per design)

- [ ] Task 6: Responsive Interview Detail Page (AC: 1, 2, 3, 4, 7)
  - [ ] 6.1 Convert 70/30 desktop grid to stacked layout on mobile
  - [ ] 6.2 Replace context sidebar with horizontal scrollable `PrevRoundsStrip` for previous round badges (not tabs)
  - [ ] 6.3 Simplify rich text editor toolbar on mobile (essential formatting only)
  - [ ] 6.4 Collapse question sections by default on mobile to reduce scroll
  - [ ] 6.5 Ensure interviewer list is readable on mobile

- [ ] Task 7: Responsive Assessment Detail Page (AC: 1, 2, 3, 4, 8)
  - [ ] 7.1 Stack assessment info vertically on mobile
  - [ ] 7.2 Submission form full width on mobile
  - [ ] 7.3 Status dropdown accessible on mobile (minimum touch target)
  - [ ] 7.4 Add Submission modal: full-screen on mobile, centered dialog on tablet/desktop

- [ ] Task 8: Responsive Timeline Page (AC: 1, 2, 3)
  - [ ] 8.1 Timeline items full width cards on mobile
  - [ ] 8.2 Filter controls stack vertically on mobile
  - [ ] 8.3 Date grouping headers sticky on mobile for context

- [ ] Task 9: Responsive Form Components (AC: 5, 6)
  - [ ] 9.1 Add `inputMode` attribute to inputs (numeric, email, tel, url)
  - [ ] 9.2 Add `autoComplete` attributes for better mobile keyboard support
  - [ ] 9.3 Verify existing input components meet 44px touch target; adjust if needed
  - [ ] 9.4 Add focus trap and auto-focus management for modals on mobile
  - [ ] 9.5 Ensure date pickers work on mobile (touch-friendly)

- [ ] Task 10: Responsive Rich Text Editor (TipTap) (AC: 7)
  - [ ] 10.1 Create responsive toolbar: full options desktop, essential mobile
  - [ ] 10.2 Essential mobile toolbar: bold, italic, list, link only
  - [ ] 10.3 Add overflow menu for additional formatting on mobile
  - [ ] 10.4 Increase editor content area min-height on mobile
  - [ ] 10.5 Test paste and link insertion on mobile browsers

- [ ] Task 11: Touch Target Audit and Fix (AC: 5)
  - [ ] 11.1 Audit all buttons, links, and interactive elements for 44x44px minimum
  - [ ] 11.2 Increase icon button sizes on mobile (`size="lg"` variant for mobile)
  - [ ] 11.3 Add padding to clickable table rows on mobile
  - [ ] 11.4 Ensure dropdown items have adequate touch spacing

- [ ] Task 12: Global Search Responsive (AC: 2, 3)
  - [ ] 12.1 Full-screen search overlay on mobile (modal style)
  - [ ] 12.2 Search input auto-focused when opened on mobile
  - [ ] 12.3 Results grouped with collapsible sections on mobile
  - [ ] 12.4 Close button easily accessible (top right, 44x44px)

- [x] Task 13: FAB (Floating Action Button) Pattern for Mobile (AC: 2)
  - [x] 13.1 Create reusable `FAB` component: 52x52px, primary background, plus icon, corner radius 26px, drop shadow (blur 12px, offset y:4)
  - [x] 13.2 Add FAB to Dashboard (mobile only) for quick add - expandable with Application/Interview options on tap
  - [x] 13.3 Add FAB to Applications list (mobile only) for new application
  - [x] 13.4 Add FAB to Interviews list (mobile only) for new interview
  - [x] 13.5 Position FAB bottom-right (right: 16px, bottom: 68px from screen edge, above safe area)
  - [x] 13.6 Hide FAB on tablet/desktop where inline buttons exist

- [ ] Task 14: Bottom Sheet Components for Mobile (AC: 2)
  - [ ] 14.1 Create reusable `BottomSheet` component (or extend Sheet with bottom variant)
  - [ ] 14.2 Implement `FilterSheet` for mobile filter options
  - [ ] 14.3 Implement `SortSheet` for mobile sort options
  - [ ] 14.4 Ensure bottom sheets have proper drag-to-dismiss and backdrop

- [ ] Task 15: Modal Responsiveness Strategy (AC: 8)
  - [ ] 15.1 Create responsive modal wrapper that switches between full-screen (mobile) and centered dialog (tablet+)
  - [ ] 15.2 Update all existing modals to use responsive pattern
  - [ ] 15.3 Full-screen mobile modals: header with close button, scrollable content, sticky footer actions
  - [ ] 15.4 Centered tablet modals: standard dialog with max-width constraint

- [ ] Task 16: Responsive Files Page (AC: 1, 2, 3)
  - [ ] 16.1 Files list as cards on mobile, table on tablet+
  - [ ] 16.2 Near-limit storage warning state responsive styling
  - [ ] 16.3 File upload button accessible on mobile (consider FAB or header action)

- [ ] Task 17: Responsive Settings Page (AC: 1, 2, 3)
  - [ ] 17.1 Settings sections stack vertically on mobile
  - [ ] 17.2 Form controls full-width on mobile
  - [ ] 17.3 Navigation between settings sections on mobile (tabs or accordion)

- [ ] Task 18: Empty States for Mobile/Tablet (AC: 2, 3)
  - [ ] 18.1 Create responsive empty states for Dashboard (no recent applications)
  - [ ] 18.2 Create responsive empty states for Applications list
  - [ ] 18.3 Create responsive empty states for Interviews list
  - [ ] 18.4 Create responsive empty states for Files page
  - [ ] 18.5 Empty states include icon, title, description, and CTA button matching design

- [ ] Task 19: Notification Dropdown Responsive (AC: 2, 3)
  - [ ] 19.1 Notification bell tap shows dropdown overlay on mobile (full-width minus padding)
  - [ ] 19.2 Notification bell tap shows dropdown overlay on tablet (360px width, positioned right)
  - [ ] 19.3 Dropdown has shadow effect and border, contains notification items

- [ ] Task 20: Visual Verification and Bug Fixes (AC: All)
  - [ ] 20.1 Test on actual mobile device (iOS Safari, Android Chrome)
  - [ ] 20.2 Test on tablet device or emulator (iPad Safari)
  - [ ] 20.3 Fix any horizontal scroll issues discovered
  - [ ] 20.4 Verify all text readable without zoom (16px minimum base)
  - [ ] 20.5 Run Lighthouse mobile audit and fix critical issues

## Dev Notes

### Architecture Alignment

- **Tailwind CSS v4**: Use existing breakpoint system (sm:, md:, lg:, xl:, 2xl:)
- **shadcn/ui Components**: Already accessible, enhance with responsive variants
- **Sidebar Component**: Hidden below lg breakpoint (`hidden lg:flex`), full sidebar on desktop only
- **Sheet Component**: Use for mobile/tablet slide-out navigation (NavSheet)
- **Breakpoint Hooks**: Existing `useIsMobile` hook (768px) only distinguishes mobile vs not-mobile. **Create `useBreakpoint` hook** to distinguish all 3 layouts: mobile (<768px), tablet (768-1439px), desktop (1440px+)

### Implementation Approach

**Key Principle: Extend, Don't Duplicate**

Reuse existing components with responsive props/classes rather than creating separate mobile versions:

```tsx
// BAD: Creating separate components
<DesktopPageHeader />  // Don't do this
<MobilePageHeader />   // Don't do this

// GOOD: Single component with responsive behavior
<PageHeader
  title="Applications"
  action={<Button className="hidden md:flex">New Application</Button>}
/>
<FAB className="md:hidden" onClick={handleNew} /> // Mobile alternative
```

**Mobile-First CSS Pattern:**
```tsx
// Good: Mobile-first, enhance for larger screens
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/2">...</div>
  <div className="w-full md:w-1/2">...</div>
</div>

// Good: Hide on mobile, show on desktop
<Sidebar className="hidden lg:flex" />
<ResponsiveHeader className="lg:hidden" />
```

**Responsive Grid Pattern:**
```tsx
// Stats cards responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

**Touch Target Pattern:**
```tsx
// Minimum 44x44px touch targets
<Button className="h-11 w-11 p-0 md:h-9 md:w-auto md:px-4">
  <Icon className="h-5 w-5 md:hidden" />
  <span className="hidden md:inline">Action</span>
</Button>
```

**Mobile/Tablet Header Pattern:**
```tsx
// MobileHeader (< md) and TabletHeader (md to lg) share same pattern
<header className="flex items-center justify-between p-4 lg:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" className="h-11 w-11">
        <Menu className="h-6 w-6" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left">
      {/* Navigation items + search trigger, NO user section */}
    </SheetContent>
  </Sheet>
  <Logo /> {/* "Ditto" centered */}
  <div className="flex items-center gap-2">
    <NotificationBell />
    <UserAvatar />
  </div>
</header>
```

**FAB Pattern (Mobile Only):**
```tsx
// Floating action button for create actions
<FAB
  className="fixed bottom-6 right-6 md:hidden z-50"
  onClick={handleCreate}
>
  <Plus className="h-6 w-6" />
</FAB>
```

**Bottom Sheet Pattern (Mobile Filters) - Reuse Existing Logic:**
```tsx
// Reuse the same filter state and handlers from desktop
const { filters, setFilters, applyFilters } = useApplicationFilters();

// Mobile: Bottom sheet UI, same logic
<Button variant="outline" className="md:hidden" onClick={() => setFilterOpen(true)}>
  <Filter className="h-4 w-4 mr-2" /> Filters
</Button>
<FilterSheet
  open={filterOpen}
  onOpenChange={setFilterOpen}
  filters={filters}           // Same state
  onFiltersChange={setFilters} // Same handlers
  onApply={applyFilters}       // Same logic
/>

// Tablet: Inline filters, same logic
<div className="hidden md:flex lg:hidden gap-2">
  <FilterRow1 filters={filters} onChange={setFilters} />
  <FilterRow2 filters={filters} onChange={setFilters} />
</div>

// Desktop: Full filter bar, same logic
<div className="hidden lg:flex">
  <FullFilterBar filters={filters} onChange={setFilters} />
</div>
```

**Responsive Modal Pattern:**
```tsx
// Full-screen on mobile, centered dialog on tablet+
<ResponsiveModal open={open} onOpenChange={setOpen}>
  <ModalHeader>Add Submission</ModalHeader>
  <ModalContent>{/* Form */}</ModalContent>
  <ModalFooter>{/* Actions */}</ModalFooter>
</ResponsiveModal>
```

### Breakpoint Reference (Design-Aligned)

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Base (mobile) | 375-767px | Single column, MobileHeader, hamburger nav, FAB for create actions, bottom sheets for filters, full-screen modals |
| md (tablet) | 768-1439px | TabletHeader (same as mobile pattern), NO sidebar, inline filter rows, centered dialog modals |
| lg (desktop) | 1440px+ | Full Sidebar, multi-column layouts, rich toolbars, inline modals |

**Design baseline**: 375px mobile, 768px tablet, 1440px desktop (per ditto-design.pen)

### Key Components to Modify

| Component | Location | Changes |
|-----------|----------|---------|
| Sidebar | `src/components/Sidebar/Sidebar.tsx` | Add `hidden lg:flex` wrapper (hidden on mobile AND tablet) |
| ApplicationTable | `src/app/(app)/applications/application-table/` | Card layout < md |
| InterviewDetail | `src/app/(app)/interviews/[id]/page.tsx` | PrevRoundsStrip for previous rounds < lg |
| Dashboard | `src/app/(app)/dashboard/page.tsx` | Responsive grid + FAB on mobile |
| RichTextEditor | `src/components/shared/RichTextEditor/` | Conditional toolbar |
| GlobalSearch | `src/components/shared/GlobalSearch/` | Full-screen on mobile |

### Responsive Component Strategy

**Principle**: Reuse existing desktop components with responsive variants rather than creating separate mobile/tablet components. Use Tailwind responsive classes and conditional rendering.

| Existing Component | Responsive Approach |
|-------------------|---------------------|
| `PageHeader` | Add responsive props: hide button on mobile (FAB replaces it), adjust text sizes |
| `Modal/Default` | Create responsive wrapper: full-screen on mobile, centered dialog on tablet+ |
| `EmptyState/Default` | Already responsive, just ensure proper width constraints |
| `Dropdown/Default` | Works as-is, ensure touch targets meet 44px minimum |
| `SearchTrigger` | Hide keyboard shortcut badge on mobile, full-width in nav sheet |
| `Breadcrumb/Default` | Truncate middle items on mobile, show full on tablet+ |

### New Components to Create

| Component | Location | Purpose |
|-----------|----------|---------|
| ResponsiveHeader | `src/components/layout/ResponsiveHeader.tsx` | Single component that renders MobileHeader (<768px) or TabletHeader (768-1439px) based on breakpoint |
| NavSheet | `src/components/layout/NavSheet.tsx` | Slide-out navigation for mobile/tablet (reuses existing NavItem components) |
| FAB | `src/components/ui/fab.tsx` | Floating action button for mobile create actions |
| BottomSheet | `src/components/ui/bottom-sheet.tsx` | Bottom sheet base component (extends Sheet with bottom variant) |
| FilterSheet | `src/components/shared/FilterSheet.tsx` | Mobile filter bottom sheet (reuses existing filter controls) |
| SortSheet | `src/components/shared/SortSheet.tsx` | Mobile sort bottom sheet (reuses existing sort controls) |
| MobileAppCard | `src/components/applications/MobileAppCard.tsx` | Card layout for mobile application list (reuses Badge, status components) |
| PrevRoundsStrip | `src/components/interviews/PrevRoundsStrip.tsx` | Horizontal scrollable previous rounds (reuses existing round badge components) |
| ResponsiveModal | `src/components/ui/responsive-modal.tsx` | Wrapper that switches between full-screen (mobile) and Dialog (tablet+) |

### Project Structure Notes

**Creates:**
- `frontend/src/hooks/use-breakpoint.ts` - Breakpoint hook returning `'mobile' | 'tablet' | 'desktop'` for 3-layout distinction
- `frontend/src/components/layout/ResponsiveHeader.tsx` - Unified responsive header (renders mobile or tablet variant based on breakpoint)
- `frontend/src/components/layout/NavSheet.tsx` - Slide-out navigation sheet (260px mobile, 280px tablet)
- `frontend/src/components/ui/fab.tsx` - Floating action button (52x52px, primary, shadow)
- `frontend/src/components/ui/bottom-sheet.tsx` - Bottom sheet base component
- `frontend/src/components/ui/responsive-modal.tsx` - Responsive modal wrapper
- `frontend/src/components/shared/FilterSheet.tsx` - Mobile filter bottom sheet (reuses existing filter state/logic)
- `frontend/src/components/shared/SortSheet.tsx` - Mobile sort bottom sheet (reuses existing sort state/logic)
- `frontend/src/components/applications/MobileAppCard.tsx` - Mobile application card (reuses Badge components)
- `frontend/src/components/interviews/PrevRoundsStrip.tsx` - Horizontal scrollable previous rounds

**Modifies (add responsive classes, NOT new components):**
- `frontend/src/components/Sidebar/Sidebar.tsx` - Add `hidden lg:flex` wrapper
- `frontend/src/app/(app)/layout.tsx` - Add ResponsiveHeader for mobile/tablet, keep Sidebar for desktop
- `frontend/src/app/(app)/dashboard/page.tsx` - Add responsive grid classes + FAB on mobile
- `frontend/src/app/(app)/applications/page.tsx` - Conditional card/table + FAB + bottom sheets (mobile only)
- `frontend/src/app/(app)/applications/[id]/page.tsx` - Add responsive stacking classes
- `frontend/src/app/(app)/interviews/page.tsx` - Add FAB for mobile
- `frontend/src/app/(app)/interviews/[id]/page.tsx` - Add PrevRoundsStrip, responsive stacking
- `frontend/src/app/(app)/timeline/page.tsx` - Add responsive classes for full-width cards
- `frontend/src/app/(app)/files/page.tsx` - Add responsive classes
- `frontend/src/app/(app)/settings/page.tsx` - Add responsive classes
- `frontend/src/components/shared/RichTextEditor/*.tsx` - Conditional toolbar (use `useIsMobile` hook)
- `frontend/src/components/shared/PageHeader.tsx` - Add responsive props for button visibility
- `frontend/src/components/ui/dialog.tsx` - Extend to support full-screen mobile variant
- Various form components - Add `inputMode`, `autoComplete`, ensure 44px touch targets

### Learnings from Previous Story

**From Story 6-2-security-hardening-input-validation-and-xss-prevention (Status: done)**

- **Middleware Pattern**: Security headers registered in `main.go:37` - use same structure for any global CSS/meta changes
- **Frontend Utility Pattern**: Created `sanitizer.ts` in `frontend/src/lib/` - follow same pattern for responsive utilities if needed
- **Component Modification Pattern**: Multiple components updated systematically (all route files for CSRF) - apply same thoroughness for responsive classes
- **Axios Interceptors**: Added CSRF token handling - ensure responsive changes don't break CSRF token flow
- **Build Verification**: Run `npm run build` after changes to catch any TypeScript errors

**Files to Reference:**
- `frontend/src/hooks/use-mobile.ts` - Existing mobile detection hook (768px threshold) - **extend or create `useBreakpoint` for 3-layout support**
- `frontend/src/components/Sidebar/Sidebar.tsx` - Current sidebar implementation (will add `hidden lg:flex`)
- `frontend/src/app/(app)/layout.tsx` - App layout with sidebar integration
- `frontend/src/components/ui/sheet.tsx` - Sheet component for mobile nav
- `frontend/tailwind.config.ts` - Tailwind breakpoint configuration

[Source: stories/6-2-security-hardening-input-validation-and-xss-prevention.md#Dev-Agent-Record]

### References

- [Source: ditto-design.pen] - Comprehensive RWD designs: MobileHeader, TabletHeader, MobileAppCard, FAB, FilterSheet, SortSheet, PrevRoundsStrip, responsive modals
- [Source: docs/tech-spec-epic-6.md#Story 6.3] - Acceptance criteria, responsive requirements
- [Source: docs/tech-spec-epic-6.md#Responsive Design] - NFR-4.2 requirements
- [Source: docs/epics.md#Story 6.3] - Original story definition
- [Source: docs/architecture.md#Mobile Layout] - Mobile layout pattern
- [Source: docs/architecture-frontend.md#Responsive Design] - Tailwind breakpoints

## Dev Agent Record

### Context Reference

- [Story Context XML](./6-3-responsive-design-mobile-and-tablet-support.context.xml) - Generated 2026-02-12

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

**Task 1 Audit (2026-02-12):**
- Current `useIsMobile` uses 1024px breakpoint - misaligned with design (768px)
- Dashboard stats use `flex gap-6` - not responsive
- Sidebar uses Tailwind `lg:` (1024px) - should map to 1440px for desktop-only
- No 3-layout hook exists; need `useBreakpoint` returning mobile/tablet/desktop
- Design components identified: MobileHeader (DyFFG), TabletHeader (okgm5), FAB (lQD2W), NavSheet (260px mobile/280px tablet)
- Breakpoint strategy: base=mobile(<768), md:=tablet(768-1439), lg:=desktop(1440+)

### Completion Notes List

### File List

## Change Log

- 2026-02-12: Generated story context XML with documentation, code artifacts, dependencies, constraints, interfaces, and test ideas
- 2026-02-12: Fixed stale items and consolidated tasks based on review feedback:
  - Fixed Architecture Alignment: removed stale "collapsed state" reference, sidebar is now hidden/shown only
  - Added `useBreakpoint` hook requirement for 3-layout distinction (mobile/tablet/desktop)
  - Merged Task 2 (MobileHeader) and Task 3 (TabletHeader/NavSheet) into unified Task 2 for ResponsiveHeader + NavSheet
  - Added subtask 2.8 for UserDropdown triggered by avatar tap with responsive positioning
  - Renumbered all subsequent tasks (now 20 tasks total instead of 21)
  - Updated Files to Reference to note `useBreakpoint` hook creation
- 2026-02-12: Refined to emphasize component reuse strategy based on ditto-design.pen analysis:
  - Added "Responsive Component Strategy" section - reuse existing components with responsive variants
  - Renamed MobileHeader/TabletHeader to unified `ResponsiveHeader` component
  - Added `NavSheet` component (260px mobile, 280px tablet) with explicit contents
  - Added `ResponsiveModal` wrapper component for modal responsiveness
  - Updated FAB specs: 52x52px, corner radius 26px, shadow blur 12px
  - Added Task 19: Empty states for all pages (Dashboard, Applications, Interviews, Files)
  - Added Task 20: Notification dropdown responsive behavior
  - Updated implementation patterns to show state/logic reuse between mobile and desktop
  - Clarified that FilterSheet/SortSheet reuse existing filter state and handlers
  - Updated Project Structure Notes to distinguish creates vs modifies (add responsive classes)
- 2026-02-12: Updated based on comprehensive RWD designs in ditto-design.pen:
  - Changed minimum width from 320px to 375px (design baseline)
  - Removed collapsible sidebar concept for tablet; replaced with TabletHeader pattern
  - Added FAB pattern for mobile create actions (Dashboard, Applications, Interviews)
  - Added bottom sheet pattern for mobile filters/sort (FilterSheet, SortSheet)
  - Added modal responsiveness strategy (full-screen mobile, centered tablet)
  - Updated interview detail to use PrevRoundsStrip instead of tabs
  - Changed mobile action buttons from full-width to compact/inline
  - Added new tasks: FAB (14), Bottom Sheets (15), Modal Strategy (16), Files Page (17), Settings Page (18)
  - Updated breakpoint reference to match design: 375px/768px/1440px
- 2026-02-10: Story drafted from tech-spec-epic-6.md with learnings from story 6-2
