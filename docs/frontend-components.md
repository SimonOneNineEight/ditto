# Ditto Frontend Component Structure

**Last updated:** 2026-02-20

**Framework:** Next.js 14 with App Router
**UI Library:** shadcn/ui + Radix UI
**Styling:** Tailwind CSS
**Authentication:** NextAuth.js
**Form Handling:** react-hook-form + zod with @hookform/resolvers
**Data Tables:** @tanstack/react-table v8
**Rich Text:** TipTap ^3.17.1
**Toasts:** sonner ^2.0.7
**Icons:** lucide-react + @icons-pack/react-simple-icons
**Dates:** date-fns ^4.1.0
**Sanitization:** dompurify ^3.3.1

---

## Table of Contents

1. [Route Structure](#route-structure)
2. [shadcn/ui Components](#shadcnui-components)
3. [Custom Components](#custom-components)
4. [Hooks](#hooks)
5. [Lib and Utilities](#lib-and-utilities)
6. [Schemas](#schemas)
7. [Types](#types)
8. [Providers and Layout Hierarchy](#providers-and-layout-hierarchy)
9. [Key Patterns](#key-patterns)

---

## Route Structure

### App Router Hierarchy

```
src/app/
├── layout.tsx                              # Root layout with AuthProvider
├── globals.css
├── fonts/
│
├── (auth)/                                 # Public authentication routes
│   ├── login/
│   │   ├── page.tsx
│   │   └── __tests__/
│   ├── register/
│   │   └── page.tsx
│   └── components/
│       ├── auth-styles.ts
│       ├── market-banner.tsx
│       └── oauth-buttons.tsx
│
├── (app)/                                  # Protected app routes
│   ├── layout.tsx
│   │
│   ├── dashboard/
│   │   ├── RecentApplications
│   │   ├── UpcomingWidget
│   │   └── UpcomingItemCard
│   │
│   ├── applications/
│   │   ├── page.tsx
│   │   ├── application-filters.tsx
│   │   ├── application-table/
│   │   │   ├── columns.tsx
│   │   │   └── table.tsx
│   │   ├── [id]/
│   │   │   ├── page.tsx                    # Application detail
│   │   │   └── edit/
│   │   │       └── page.tsx                # Application edit
│   │   ├── [id]/assessments/
│   │   │   ├── page.tsx                    # Assessment list
│   │   │   └── [assessmentId]/
│   │   │       └── page.tsx                # Assessment detail
│   │   └── new/
│   │       ├── add-application-form.tsx    # With company autocomplete
│   │       ├── url-import.tsx
│   │       └── __tests__/
│   │
│   ├── interviews/
│   │   ├── page.tsx
│   │   ├── interview-table/
│   │   ├── past-interviews/
│   │   │   ├── list component
│   │   │   └── row component
│   │   └── [id]/
│   │       └── page.tsx                    # Interview detail
│   │
│   ├── files/                              # File management
│   │
│   ├── timeline/
│   │   └── components/
│   │       ├── TimelineFilters
│   │       ├── TimelineItem
│   │       ├── TimelineDateGroup
│   │       └── useTimelineFilters hook
│   │
│   ├── settings/
│   │   └── page.tsx
│   │
│   └── design-system/
│       └── page.tsx                        # Component showcase
│
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts
```

### Route Groups

- **(auth)** -- Public routes: login, register. Centered layout without sidebar.
- **(app)** -- Protected routes requiring authentication. Full layout with sidebar, navbar, and theme provider.

---

## shadcn/ui Components

32 components in `src/components/ui/`:

| Component | Component | Component | Component |
|-----------|-----------|-----------|-----------|
| accordion | alert-dialog | avatar | badge |
| breadcrumb | button | calendar | card |
| collapsible | command | date-picker | delete-confirm-dialog |
| dialog | drawer | dropdown-menu | fab |
| form | input | label | popover |
| progress | select | separator | sheet |
| sidebar | skeleton | sonner | switch |
| table | textarea | time-picker | toggle |
| tooltip | | | |

---

## Custom Components

All located under `src/components/`.

### application-selector/

Dialog for selecting applications (used in contexts where a user must pick an application to associate with).

### applications/

- `MobileAppCard` -- Card layout for applications on mobile viewports.

### assessment-form/

- Assessment creation and edit modal.
- Includes `__tests__/` directory.

### assessment-list/

Assessment display and management components.

### assessment-status-select/

Status dropdown for assessments.

### auth-guard.tsx

Route protection wrapper. Prevents unauthenticated access to protected pages.

### auto-save-indicator/

Visual indicator showing auto-save state.

### export-dialog/

- `ExportDialog` -- Supports CSV and JSON export.

### file-upload/

Complete file upload system:

| File | Purpose |
|------|---------|
| file-upload.tsx | Main upload component |
| file-item.tsx | Individual file display |
| file-list.tsx | File listing |
| documents-section.tsx | Documents section wrapper |
| upload-progress.tsx | Upload progress indicator |
| index.ts | Barrel export |

### global-search/

Global search component for searching across the application.

### interview-detail/

Comprehensive interview management with many sub-components:

| File | Purpose |
|------|---------|
| add-interviewer-form.tsx | Form to add interviewers |
| add-question-form.tsx | Form to add questions |
| add-round-dialog.tsx | Dialog for adding interview rounds |
| documents-card.tsx | Attached documents display |
| interviewers-section.tsx | Interviewers section layout |
| interviewers-card.tsx | Individual interviewer card |
| questions-section.tsx | Questions section layout |
| questions-card.tsx | Individual question card |
| interview-rounds-panel.tsx | Round management panel |
| interview-rounds-strip.tsx | Round navigation strip |
| notes-section.tsx | Notes section |
| feedback-section.tsx | Feedback section |
| self-assessment-section.tsx | Self-assessment section layout |
| self-assessment-card.tsx | Self-assessment card |
| collapsible-section.tsx | Reusable collapsible section |
| details-card.tsx | Interview details card |
| interview-detail-card.tsx | Main interview detail card |

### interview-form/

- Interview creation and edit modal.
- Includes `__tests__/` directory.

### interview-list/

| File | Purpose |
|------|---------|
| interview-card-list.tsx | Card-based interview list |
| interview-list-item.tsx | Individual interview list item |
| filter-bar.tsx | Interview filter bar |
| needs-feedback-section.tsx | Section highlighting interviews needing feedback |

### job-table/

| File | Purpose |
|------|---------|
| job-table.tsx | Main job table component |
| columns.tsx | TanStack table column definitions |
| apply-status-dropdown.tsx | Application status dropdown |
| scrape-button.tsx | Job scraping trigger |

### layout/

| File | Purpose |
|------|---------|
| ResponsiveHeader.tsx | Header that adapts to viewport size |
| NavSheet.tsx | Navigation sheet for mobile |
| UserAvatar.tsx | User avatar display component |

### layout-wrapper/

Main layout wrapper for page content.

### loading-skeleton/

Skeleton loading state components for content placeholders.

### navbar/

Navigation bar with dark mode toggle and user controls.

### notification-center/

| File | Purpose |
|------|---------|
| NotificationBell.tsx | Bell icon with unread indicator |
| NotificationCenter.tsx | Main notification management |
| NotificationDropdown.tsx | Dropdown listing notifications |
| NotificationItem.tsx | Individual notification display |
| NotificationPreferences.tsx | Notification settings |

### page-header/

Reusable page header component.

### rich-text-editor.tsx

TipTap-based rich text editor.

### settings/

- `DeleteAccountDialog.tsx` -- Account deletion confirmation dialog.

### sidebar/

Navigation sidebar with `nav-user.tsx` user menu.

### stat-card/

Statistics display card for dashboard metrics.

### storage-quota/

- Storage quota widget.
- `user-files-list.tsx` -- List of user-uploaded files.

### submission-form/

- Assessment submission modal.
- `assessment-file-upload.tsx` -- File upload specific to assessment submissions.

### submission-list/

Submission results display.

### Standalone Components

| File | Purpose |
|------|---------|
| network-status-monitor.tsx | Network connectivity indicator |
| error-boundary.tsx | React error boundary |
| theme-provider.tsx | Theme context provider (next-themes wrapper) |
| index.tsx | Component barrel exports |

### Tests

- `__tests__/` -- Shared component tests at the components root level.
- `error-boundary.tsx` has co-located tests in `__tests__/`.

---

## Hooks

Located in `src/hooks/`:

| Hook | Purpose |
|------|---------|
| useAutoSave.ts | Auto-save form data |
| useFileUpload.ts | File upload state and logic |
| useNotifications.ts | Notification polling and management |
| use-breakpoint.ts | Responsive breakpoint detection |
| use-click-outside.ts | Detect clicks outside an element |
| use-compact-layout.ts | Compact layout state |
| use-mobile.ts | Mobile viewport detection |
| index.ts | Barrel export |

---

## Lib and Utilities

Located in `src/lib/`:

| File | Purpose |
|------|---------|
| axios.ts | Configured Axios instance with interceptors |
| constants.ts | Application constants |
| errors.ts | Error handling utilities |
| file-service.ts | File upload/download service |
| sanitizer.ts | HTML sanitization (DOMPurify) |
| utils.ts | General utility functions |
| `__tests__/` | Lib unit tests |

---

## Schemas

Located in `src/lib/schemas/`:

Zod validation schemas used with react-hook-form.

| Schema | Purpose |
|--------|---------|
| application.ts | Application form validation |
| assessment.ts | Assessment form validation |
| interview.ts | Interview form validation |
| interviewer.ts | Interviewer form validation |
| question.ts | Question form validation |
| submission.ts | Submission form validation |
| index.ts | Barrel export |
| `__tests__/` | Schema unit tests |

---

## Types

Located in `src/types/`:

| Type File | Purpose |
|-----------|---------|
| auth-type.ts | Authentication types |
| job-type.ts | Job/application types |
| notification.ts | Notification types |
| timeline.ts | Timeline event types |
| upcoming.ts | Upcoming items types |
| search.ts | Search result types |
| index.ts | Barrel export |

---

## Providers and Layout Hierarchy

### Provider Nesting Order

```
html
└── body
    └── AuthProvider (NextAuth SessionProvider)
        └── RootLayout
            └── (app) or (auth) routes
                └── ThemeProvider (next-themes)
                    └── SidebarProvider (shadcn/ui)
                        ├── AppSidebar
                        └── SidebarInset
                            ├── Navbar
                            └── LayoutWrapper
                                └── Page content
```

### Providers

Located in `src/providers/`:

| Provider | File | Purpose |
|----------|------|---------|
| AuthProvider | auth-provider.tsx | Wraps NextAuth SessionProvider for session management |

### Context Providers

| Provider | Source | Scope |
|----------|--------|-------|
| AuthProvider (SessionProvider) | NextAuth.js | Global (root layout) |
| ThemeProvider | next-themes | (app) and (auth) layouts |
| SidebarProvider | shadcn/ui | (app) layout only |

---

## Key Patterns

**Form handling:** react-hook-form + zod schemas via @hookform/resolvers. Schemas are centralized in `src/lib/schemas/`.

**Data tables:** @tanstack/react-table v8 with column definitions co-located alongside their table components.

**Rich text editing:** TipTap ^3.17.1 via a single `rich-text-editor.tsx` component.

**Toast notifications:** sonner ^2.0.7 (shadcn/ui sonner wrapper).

**Icons:** lucide-react for general UI icons, @icons-pack/react-simple-icons for brand icons (Google, GitHub).

**Date handling:** date-fns ^4.1.0 for formatting and manipulation.

**HTML sanitization:** dompurify ^3.3.1 via `src/lib/sanitizer.ts`.

**File uploads:** Dedicated hook (`useFileUpload`) and service (`file-service.ts`) with progress tracking via `upload-progress.tsx`.

**Authentication:** NextAuth.js with OAuth (Google, GitHub) and credentials providers. Auth state accessed via `useSession()` hook. Route protection via `auth-guard.tsx`.

**Barrel exports:** Components, hooks, schemas, and types all use `index.ts` barrel files for clean imports.

**Client/server boundaries:** Interactive components use `'use client'` directives. Server components are the default for pages and layouts where possible.
