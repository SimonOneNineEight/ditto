# Ditto Frontend Architecture

## Executive Summary

The Ditto frontend is a Next.js 14 application providing a job tracking and management interface. Built with the App Router, shadcn/ui components, and NextAuth v5, the application covers authentication, job applications, interview tracking, file management, assessments, notifications, timeline activity, and global search.

The frontend is organized around two route groups: `(app)` for authenticated features and `(auth)` for public authentication pages. It uses TypeScript for type safety, Zod schemas for form validation, React Hook Form for form state, Tailwind CSS v4 for styling, and axios with CSRF protection, retry logic, and token refresh for API communication.

**Key Metrics:**
- Framework: Next.js 14.2.15 (App Router)
- Package Manager: pnpm
- UI Components: 32 shadcn/ui components
- Custom Hooks: 8
- Zod Schemas: 7
- Type Definitions: 7 files
- Authentication: NextAuth v5 (beta.29) with GitHub, Google, Credentials
- Testing: Jest + React Testing Library
- Styling: Tailwind CSS v4 + shadcn theming
- Frontend Port: 8080

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 14.2.15 | Server-side rendering, App Router, API routes |
| **Runtime** | React | ^18 | Component framework and hooks |
| **Language** | TypeScript | ^5 | Type-safe development |
| **Auth** | NextAuth | 5.0.0-beta.29 | Multi-provider authentication (Credentials, GitHub, Google) |
| **UI Library** | shadcn/ui | Latest | Pre-built, accessible component system |
| **UI Primitives** | Radix UI | Latest | Unstyled, accessible components |
| **Styling** | Tailwind CSS | ^4.1.10 | Utility-first CSS framework |
| **Theme Management** | next-themes | Latest | Dark/light mode support |
| **HTTP Client** | axios | ^1.7.9 | API requests with interceptors, CSRF, retry |
| **Form State** | react-hook-form | ^7.54.2 | Efficient form state management |
| **Form Validation** | Zod | ^3.24.2 | Runtime schema validation |
| **Form Resolvers** | @hookform/resolvers | Latest | Bridge between react-hook-form and Zod |
| **Data Tables** | @tanstack/react-table | ^8.20.5 | Headless table library |
| **Icons** | lucide-react | ^0.452.0 | React icon library |
| **Toast** | sonner | ^2.0.7 | Toast notifications |
| **Rich Text** | @tiptap/* | ^3.17.1 | Rich text editor |
| **Dates** | date-fns | ^4.1.0 | Date formatting and manipulation |
| **Markdown** | react-markdown | ^10.1.0 | Markdown rendering |
| **Sanitization** | dompurify | ^3.3.1 | HTML sanitization |
| **UI Utilities** | class-variance-authority | ^0.7.0 | Type-safe CSS class composition |
| **CSS Utilities** | clsx, tailwind-merge | ^2.1.1 | Class composition and merging |
| **Drawers** | vaul | Latest | Drawer component library |
| **Testing** | Jest + React Testing Library | Latest | Unit and component testing |

---

## Architecture Pattern

### Next.js App Router Overview

The application uses Next.js 14's App Router (directory-based routing in `/src/app`), which provides:
- **Server-Side Rendering (SSR)**: Default for all pages unless marked with `'use client'`
- **Server Components**: Request-level caching and data fetching
- **Client Components**: Interactive features, hooks, event listeners
- **Hybrid Rendering**: Mix of server and client components as needed

```
Ditto Frontend Architecture

+-------------------------------------------------------------+
|                     Request Middleware                        |
|               (Auth validation, route protection)            |
+-----------------------------+-------------------------------+
                              |
                  +-----------+-----------+
                  |                       |
            +-----v------+         +-----v------+
            |   (auth)   |         |   (app)    |
            |   Routes   |         |   Routes   |
            +-----+------+         +-----+------+
                  |                       |
            +-----v------+   +-----------v--------------------------+
            | /login     |   | /                  (dashboard)       |
            | /register  |   | /applications      (CRUD + detail)  |
            +------------+   | /interviews        (CRUD + detail)  |
                             | /files             (file manager)    |
                             | /timeline          (activity feed)   |
                             | /settings          (user prefs)      |
                             | /design-system     (component demo)  |
                             +--------------------------------------+
                  |                       |
                  +---+---+---+-----------+
                      |   |   |
                +-----v-+ | +-v-----------+
                | Auth  | | | Components  |
                | Token | | | + Hooks     |
                +-------+ | +-------------+
                      +---v----+
                      | Form   |
                      | State  |
                      +---+----+
                          |
                  +-------v-----------+
                  | Axios API Client  |
                  | (CSRF, Retry,     |
                  |  Token Refresh)   |
                  +-------+-----------+
                          |
                  +-------v-----------+
                  | Backend API       |
                  | (JWT + OAuth)     |
                  +-------------------+
```

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (app)/                         # Authenticated routes
│   │   │   ├── layout.tsx                 # Shared layout (sidebar, header)
│   │   │   ├── page.tsx                   # Dashboard
│   │   │   ├── applications/
│   │   │   │   ├── page.tsx               # Applications list
│   │   │   │   ├── new/                   # Add application (autocomplete, URL import)
│   │   │   │   │   ├── add-application-form.tsx
│   │   │   │   │   ├── url-import.tsx
│   │   │   │   │   └── __tests__/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx           # Application detail
│   │   │   │       ├── edit/              # Edit application
│   │   │   │       └── assessments/
│   │   │   │           └── [assessmentId]/
│   │   │   │               └── page.tsx   # Assessment detail
│   │   │   ├── interviews/
│   │   │   │   ├── page.tsx               # Interviews list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx           # Interview detail
│   │   │   │   ├── interview-table/
│   │   │   │   └── past-interviews/
│   │   │   ├── files/                     # File management
│   │   │   ├── timeline/                  # Activity timeline with filters
│   │   │   ├── settings/                  # User settings
│   │   │   └── design-system/             # UI component showcase
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                 # Auth page layout
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── __tests__/
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── components/
│   │   │       ├── auth-styles.ts
│   │   │       ├── market-banner.tsx
│   │   │       └── oauth-buttons.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts           # NextAuth API routes
│   │   ├── layout.tsx                     # Root layout
│   │   ├── fonts/
│   │   └── globals.css
│   │
│   ├── auth.ts                            # NextAuth configuration
│   ├── middleware.ts                       # Route protection middleware
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui components (32 total)
│   │   ├── application-selector/          # Dialog for selecting applications
│   │   ├── applications/                  # MobileAppCard
│   │   ├── assessment-form/               # Assessment modal + tests
│   │   ├── assessment-list/               # Assessment display
│   │   ├── assessment-status-select/      # Status dropdown
│   │   ├── auto-save-indicator/           # Visual auto-save indicator
│   │   ├── export-dialog/                 # Export to CSV/JSON
│   │   ├── file-upload/                   # Upload with progress tracking
│   │   ├── global-search/                 # Global search
│   │   ├── interview-detail/              # Full interview detail suite
│   │   ├── interview-form/                # Interview modal + tests
│   │   ├── interview-list/                # Cards, list items, filter bar
│   │   ├── job-table/                     # Table, columns, status, scrape
│   │   ├── layout/                        # ResponsiveHeader, NavSheet, UserAvatar
│   │   ├── layout-wrapper/                # Main wrapper
│   │   ├── loading-skeleton/              # Loading states
│   │   ├── navbar/                        # Navigation
│   │   ├── notification-center/           # Bell, dropdown, preferences
│   │   ├── page-header/                   # Reusable page header
│   │   ├── settings/                      # DeleteAccountDialog
│   │   ├── sidebar/                       # Navigation sidebar + user menu
│   │   ├── stat-card/                     # Stats display
│   │   ├── storage-quota/                 # Quota widget + file list
│   │   ├── submission-form/               # Assessment submission modal
│   │   ├── submission-list/               # Submission results
│   │   ├── __tests__/                     # Shared component tests
│   │   ├── auth-guard.tsx                 # Route protection
│   │   ├── error-boundary.tsx             # Error boundary
│   │   ├── network-status-monitor.tsx     # Network indicator
│   │   ├── rich-text-editor.tsx           # TipTap editor
│   │   └── theme-provider.tsx             # Theme context
│   │
│   ├── hooks/
│   │   ├── useAutoSave.ts
│   │   ├── useFileUpload.ts
│   │   ├── useNotifications.ts
│   │   ├── use-breakpoint.ts
│   │   ├── use-click-outside.ts
│   │   ├── use-compact-layout.ts
│   │   ├── use-mobile.ts
│   │   └── index.ts
│   │
│   ├── lib/
│   │   ├── axios.ts                       # Axios instance (CSRF, retry, refresh)
│   │   ├── constants.ts                   # App-wide constants
│   │   ├── errors.ts                      # Error code mapping
│   │   ├── file-service.ts                # File upload/download service
│   │   ├── sanitizer.ts                   # HTML sanitization
│   │   ├── utils.ts                       # Helper utilities
│   │   ├── schemas/                       # Zod validation schemas (7)
│   │   │   ├── application.ts
│   │   │   ├── assessment.ts
│   │   │   ├── interview.ts
│   │   │   ├── interviewer.ts
│   │   │   ├── question.ts
│   │   │   ├── submission.ts
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   └── __tests__/                     # Lib unit tests
│   │
│   ├── providers/
│   │   └── auth-provider.tsx              # SessionProvider wrapper
│   │
│   └── types/                             # TypeScript type definitions (7 files)
│       ├── auth-type.ts
│       ├── job-type.ts
│       ├── notification.ts
│       ├── timeline.ts
│       ├── upcoming.ts
│       ├── search.ts
│       └── index.ts
│
├── __mocks__/                             # Jest mocks
├── jest.config.ts                         # Jest configuration
├── jest.setup.ts                          # Jest setup
├── package.json
├── tsconfig.json
├── next.config.mjs
├── components.json                        # shadcn/ui config
└── .prettierrc.json
```

---

## App Router Organization

### Route Groups

#### `(auth)` Route Group
- **Purpose**: Public authentication routes
- **Authentication**: None required
- **Layout**: Auth-specific layout with marketing banner
- **Routes**:
  - `/login` -- Credential and OAuth login
  - `/register` -- User registration
- **Middleware**: Redirects authenticated users to dashboard
- **Components**: `auth-styles.ts`, `market-banner.tsx`, `oauth-buttons.tsx`

#### `(app)` Route Group
- **Purpose**: Protected application routes (require authentication)
- **Authentication**: Mandatory via NextAuth
- **Layout**: Full dashboard layout (sidebar + responsive header)
- **Routes**:
  - `/` -- Dashboard with RecentApplications, UpcomingWidget, UpcomingItemCard
  - `/applications` -- Applications list
  - `/applications/new` -- Add application (company autocomplete, URL import)
  - `/applications/[id]` -- Application detail
  - `/applications/[id]/edit` -- Edit application
  - `/applications/[id]/assessments/[assessmentId]` -- Assessment detail
  - `/interviews` -- Interviews list with filter bar, needs-feedback section
  - `/interviews/[id]` -- Interview detail (rounds, questions, interviewers, notes, feedback, self-assessment, documents)
  - `/files` -- File management
  - `/timeline` -- Activity timeline with filters
  - `/settings` -- User settings with delete account
  - `/design-system` -- UI component showcase
- **Middleware Protection**: All routes require valid session

---

## Component Architecture

### shadcn/ui Components (32 Total)

| Component | Usage |
|-----------|-------|
| **accordion** | Collapsible sections |
| **alert-dialog** | Destructive action confirmation |
| **avatar** | User profile pictures |
| **badge** | Status indicators, tags |
| **breadcrumb** | Page navigation breadcrumbs |
| **button** | Primary CTA, form submissions, actions |
| **calendar** | Date selection |
| **card** | Content containers, layout blocks |
| **collapsible** | Toggle-able content |
| **command** | Command palette / autocomplete |
| **date-picker** | Date input with calendar |
| **delete-confirm-dialog** | Delete confirmation |
| **dialog** | Modal dialogs |
| **drawer** | Mobile-friendly slide-up panels |
| **dropdown-menu** | User actions, navigation menus |
| **fab** | Floating action button |
| **form** | Form wrapper with react-hook-form integration |
| **input** | Text input fields |
| **label** | Form labels |
| **popover** | Contextual floating content |
| **progress** | Progress bars |
| **select** | Dropdown selection |
| **separator** | Visual dividers |
| **sheet** | Slide-out panels |
| **sidebar** | Main navigation sidebar |
| **skeleton** | Loading placeholders |
| **sonner** | Toast notification provider |
| **switch** | Toggle switches |
| **table** | Data display with TanStack Table |
| **textarea** | Multi-line text input |
| **time-picker** | Time selection |
| **toggle** | Toggle buttons |
| **tooltip** | Contextual help text |

### Custom Component Groups

#### Interview Detail Suite (`interview-detail/`)
A comprehensive set of components for the interview detail page:
- `add-interviewer-form` -- Add interviewers to rounds
- `add-question-form` -- Add questions to rounds
- `add-round-dialog` -- Create interview rounds
- `collapsible-section` -- Reusable collapsible wrapper
- `details-card` -- Interview metadata
- `documents-card` -- Attached documents
- `feedback-section` -- Interview feedback
- `interview-detail-card` -- Main detail layout
- `interview-rounds-panel` -- Round management panel
- `interview-rounds-strip` -- Round navigation strip
- `interviewers-section` / `interviewers-card` -- Interviewer management
- `notes-section` -- Interview notes
- `questions-section` / `questions-card` -- Question management
- `self-assessment-section` / `self-assessment-card` -- Self-assessment tracking

#### Interview List (`interview-list/`)
- `interview-card-list` -- Card-based interview display
- `interview-list-item` -- Individual list items
- `filter-bar` -- Filtering controls
- `needs-feedback-section` -- Outstanding feedback section

#### File Upload (`file-upload/`)
- `file-upload.tsx` -- Main upload component with drag-and-drop
- `file-item.tsx` -- Individual file display
- `file-list.tsx` -- File listing
- `documents-section.tsx` -- Documents area
- `upload-progress.tsx` -- Upload progress indicator

#### Notification Center (`notification-center/`)
- `NotificationBell` -- Header bell icon with unread count
- `NotificationCenter` -- Full notification view
- `NotificationDropdown` -- Quick notification dropdown
- `NotificationItem` -- Individual notification
- `NotificationPreferences` -- Notification settings

#### Other Component Groups
- `application-selector/` -- Dialog for selecting applications
- `applications/` -- MobileAppCard for responsive views
- `assessment-form/` -- Assessment creation modal (with tests)
- `assessment-list/` -- Assessment display
- `assessment-status-select/` -- Status dropdown
- `auto-save-indicator/` -- Visual auto-save feedback
- `export-dialog/` -- Export data to CSV/JSON
- `global-search/` -- Application-wide search
- `job-table/` -- Job table with columns, status dropdown, scrape button
- `layout/` -- ResponsiveHeader, NavSheet, UserAvatar
- `loading-skeleton/` -- Loading state skeletons
- `page-header/` -- Reusable page header
- `settings/` -- DeleteAccountDialog
- `sidebar/` -- Navigation sidebar with user menu (nav-user)
- `stat-card/` -- Dashboard statistics display
- `storage-quota/` -- Storage quota widget and user file list
- `submission-form/` -- Assessment submission with file upload
- `submission-list/` -- Submission results display

#### Standalone Components
- `auth-guard.tsx` -- Route protection wrapper
- `error-boundary.tsx` -- React error boundary (with tests)
- `network-status-monitor.tsx` -- Network connectivity indicator
- `rich-text-editor.tsx` -- TipTap-based rich text editor
- `theme-provider.tsx` -- Dark/light theme context

---

## Custom Hooks (8)

| Hook | Purpose |
|------|---------|
| `useAutoSave` | Automatic form saving with debounce |
| `useFileUpload` | File upload with progress tracking, abort, retry, multi-stage flow |
| `useNotifications` | Notification polling (60s), unread count, mark read |
| `use-breakpoint` | Responsive breakpoint detection |
| `use-click-outside` | Detect clicks outside a ref |
| `use-compact-layout` | Layout density preferences |
| `use-mobile` | Mobile viewport detection |

### useFileUpload Detail

Manages the full file upload lifecycle:
- **Progress tracking**: percent, bytes transferred, upload speed, ETA
- **Abort/cancel**: Cancel in-progress uploads
- **Retry**: Retry failed uploads
- **Multi-stage flow**: Presigned URL -> S3 upload -> confirm with backend
- **States**: `idle`, `uploading`, `confirming`, `completed`, `failed`, `cancelled`

---

## Authentication

### NextAuth v5 Configuration

File: `src/auth.ts`

Three provider strategies:

1. **Credentials Provider** -- Email + password login against backend `/api/login`
2. **GitHub OAuth** -- Social login via GitHub
3. **Google OAuth** -- Social login via Google

OAuth flows call `/api/oauth` on the backend to sync user data and return tokens.

### Token Management

- Access token TTL: 24 hours
- Token refresh: Automatic with 5-minute buffer before expiry
- JWT callback stores `access_token`, `refresh_token`, and `backendUserId`
- Session callback exposes tokens to the client

### Session Provider

File: `src/providers/auth-provider.tsx`

- Wraps entire application with NextAuth `SessionProvider`
- `refetchOnWindowFocus` enabled
- Polls for session updates every 4 minutes

### Authentication Flow

```
User Login Request
|
+-- Via Credentials
|   +-- Email + Password -> signIn('credentials')
|   +-- Backend validates, returns access_token + refresh_token
|   +-- NextAuth stores in JWT
|
+-- Via OAuth (GitHub/Google)
    +-- Redirects to provider
    +-- Provider returns authorization code
    +-- NextAuth exchanges for tokens
    +-- signIn callback: POST /api/oauth with provider + user data
    +-- Backend creates/updates user, returns tokens
    +-- NextAuth stores in JWT
         |
         v
    JWT Callback
    +-- Stores access_token, refresh_token, backendUserId
    +-- Checks token expiry (5-min buffer)
    +-- Refreshes if needed
    +-- Session Callback
        +-- Makes tokens available in session
        +-- Injects into axios interceptors
             |
             v
        API Requests (with CSRF + retry)
```

### Protected Routes

Routes under `(app)` are protected by middleware. Unauthenticated users are redirected to `/login`.

---

## API Client

### Axios Configuration

File: `src/lib/axios.ts`

```typescript
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});
```

### CSRF Protection

Mutating requests (POST, PUT, PATCH, DELETE) include an `X-CSRF-Token` header.

### Retry Logic

- Maximum 3 retries
- Exponential backoff
- Triggers on 5xx responses and network failures

### 401 Token Refresh

When a request returns 401:
1. Queues all subsequent failed requests
2. Attempts token refresh
3. Replays queued requests with new token
4. Signs out if refresh fails

### 403 CSRF Handling

Automatically re-fetches CSRF token and retries on 403 responses caused by CSRF validation failure.

### Toast Notifications

Validation errors (422) trigger toast notifications via sonner. Callers can suppress toasts by setting `_suppressToast` on the request config.

---

## Error Handling

### Error Boundary

File: `src/components/error-boundary.tsx`

React error boundary that catches unhandled component errors and displays a fallback UI. Includes tests.

### Error Code Mapping

File: `src/lib/errors.ts`

Maps backend error codes to user-friendly messages.

**Functions:**
- `getErrorMessage(error)` -- Extract user-friendly message
- `getErrorDetails(error)` -- Get detailed error info
- `isValidationError(error)` -- Check if validation error
- `getFieldErrors(error)` -- Extract per-field validation errors

**Handled error codes:**
`VALIDATION_FAILED`, `BAD_REQUEST`, `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `FORBIDDEN`, `NOT_FOUND`, `USER_NOT_FOUND`, `CONFLICT`, `EMAIL_ALREADY_EXISTS`, `QUOTA_EXCEEDED`, `INTERNAL_SERVER_ERROR`, `DATABASE_ERROR`, `TIMEOUT_ERROR`, `NETWORK_FAILURE`

### Network Status Monitor

File: `src/components/network-status-monitor.tsx`

Displays a visual indicator when the browser loses network connectivity.

---

## File Service

File: `src/lib/file-service.ts`

### Size Limits
- General uploads: 5 MB max
- Assessment uploads: 10 MB max

### Allowed File Types
- General: PDF, DOCX, TXT
- Assessments: PDF, DOCX, TXT, ZIP

### Functions
- `getPresignedUploadUrl(metadata)` -- Get S3 presigned URL
- `uploadToS3(url, file, onProgress)` -- XHR upload with progress callback
- `confirmUpload(fileId)` -- Confirm upload with backend
- `listFiles()` -- List user's files
- `getFileDownloadUrl(fileId)` -- Get download URL
- `deleteFile(fileId)` -- Delete a file
- `getStorageStats()` -- Get usage statistics
- `validateFile(file)` -- Validate against general limits
- `validateAssessmentFile(file)` -- Validate against assessment limits
- `formatFileSize(bytes)` -- Human-readable file size

---

## Validation Schemas

File: `src/lib/schemas/`

Seven Zod schemas with corresponding TypeScript types:

| Schema | File | Purpose |
|--------|------|---------|
| Application | `application.ts` | Application form validation |
| Assessment | `assessment.ts` | Assessment form validation |
| Interview | `interview.ts` | Interview form validation |
| Interviewer | `interviewer.ts` | Interviewer form validation |
| Question | `question.ts` | Question form validation |
| Submission | `submission.ts` | Submission form validation |

All schemas are re-exported from `index.ts`. Tests live in `__tests__/`.

---

## Type Definitions

File: `src/types/`

| File | Purpose |
|------|---------|
| `auth-type.ts` | Auth types, NextAuth module augmentation |
| `job-type.ts` | Job/application types |
| `notification.ts` | Notification types |
| `timeline.ts` | Timeline event types |
| `upcoming.ts` | Upcoming items types |
| `search.ts` | Search result types |
| `index.ts` | Re-exports |

---

## State Management

The application uses a minimal state management approach:

### Session State (NextAuth)
```typescript
const { data: session, status } = useSession();
// session.user: { id, email, name, image }
// session.accessToken: JWT token for API calls
// status: 'loading' | 'authenticated' | 'unauthenticated'
```

### Local Component State
- `useState` for form inputs, UI toggles, loading states
- `useEffect` for side effects, data fetching
- `useContext` for theme (next-themes)

### Form State (react-hook-form + Zod)
- `useForm` with `zodResolver` for validated form management
- Form values tracked in form instance, not component state
- Per-field validation errors from Zod schemas

### Theme State (next-themes)
- ThemeProvider wraps app for dark/light mode
- Persists preference in localStorage

---

## Styling Architecture

### Tailwind CSS v4

- Utility-first CSS framework
- CSS variables for theming in `globals.css`
- Dark mode via `dark` class on `<html>`
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`

### Component Styling

shadcn/ui components use:
1. **Tailwind classes** for primary styling
2. **CSS variables** for dynamic theming
3. **CVA (class-variance-authority)** for variant composition
4. **clsx + tailwind-merge** for conditional class merging

### Responsive Design

- Tailwind responsive prefixes throughout
- `use-mobile` hook for programmatic mobile detection
- `use-breakpoint` hook for arbitrary breakpoint detection
- `use-compact-layout` hook for density preferences
- Mobile-specific components (MobileAppCard, NavSheet, drawer variants)

---

## Testing

### Configuration

- **Runner**: Jest (`jest.config.ts`)
- **Library**: React Testing Library
- **Setup**: `jest.setup.ts`
- **Mocks**: `__mocks__/` directory

### Running Tests

```bash
cd frontend
pnpm test
```

### Test Coverage

Tests exist for:
- Login page (`src/app/(auth)/login/__tests__/`)
- Error boundary (`src/components/__tests__/`)
- Assessment form (`src/components/assessment-form/__tests__/`)
- Interview form (`src/components/interview-form/__tests__/`)
- Add application form (`src/app/(app)/applications/new/__tests__/`)
- Error utilities (`src/lib/__tests__/`)
- Utility functions (`src/lib/__tests__/`)
- Validation schemas (`src/lib/schemas/__tests__/`)

---

## Development Workflow

### Getting Started

```bash
cd frontend

# Install dependencies
pnpm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8081" > .env.local

# Run development server
pnpm run dev

# Open http://localhost:8080
```

### Development Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `pnpm run dev` | Start dev server on port 8080 |
| `build` | `pnpm run build` | Production build |
| `start` | `pnpm start` | Start production server |
| `lint` | `pnpm run lint` | Run ESLint |
| `test` | `pnpm test` | Run Jest tests |

### Environment Variables

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes | `http://localhost:8081` |

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Set in `.env.local` (not committed).

### Git Workflow

1. Create feature branch from `main`
2. Make changes with automatic formatting (Prettier)
3. Run linting: `pnpm run lint`
4. Run tests: `pnpm test`
5. Commit with clear messages
6. Push and create Pull Request

---

## Key Files Reference

### Authentication and Setup

| File | Purpose |
|------|---------|
| `src/auth.ts` | NextAuth configuration (providers, callbacks, token refresh) |
| `src/middleware.ts` | Route protection middleware |
| `src/providers/auth-provider.tsx` | SessionProvider wrapper (4-min polling) |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API routes |

### API and Services

| File | Purpose |
|------|---------|
| `src/lib/axios.ts` | Axios instance with CSRF, retry, token refresh |
| `src/lib/errors.ts` | Error code to message mapping |
| `src/lib/file-service.ts` | File upload/download with S3 presigned URLs |
| `src/lib/sanitizer.ts` | HTML sanitization |
| `src/lib/constants.ts` | Application constants |
| `src/lib/utils.ts` | Helper utilities |

### Validation

| File | Purpose |
|------|---------|
| `src/lib/schemas/application.ts` | Application form schema |
| `src/lib/schemas/assessment.ts` | Assessment form schema |
| `src/lib/schemas/interview.ts` | Interview form schema |
| `src/lib/schemas/interviewer.ts` | Interviewer form schema |
| `src/lib/schemas/question.ts` | Question form schema |
| `src/lib/schemas/submission.ts` | Submission form schema |

### Configuration

| File | Purpose |
|------|---------|
| `package.json` | Dependencies (pnpm) |
| `tsconfig.json` | TypeScript strict mode, path aliases |
| `components.json` | shadcn/ui configuration |
| `next.config.mjs` | Next.js configuration |
| `jest.config.ts` | Jest test configuration |

---

## Architectural Decisions

### Why Next.js 14 App Router?
Modern, recommended routing system with server-side rendering by default, unified layouts and middleware, and built-in API routes. Tradeoff: steeper learning curve, but better long-term maintainability.

### Why shadcn/ui?
Unstyled, fully customizable components built on Radix UI primitives. Copy-paste model keeps components in the repo (not node_modules). Full Tailwind CSS integration. Tradeoff: must maintain components yourself, but full control.

### Why Tailwind CSS v4?
Utility-first approach enables rapid development with small bundle sizes. Works seamlessly with shadcn/ui and provides a consistent spacing/sizing system.

### Why NextAuth v5?
Official Next.js auth solution with multi-provider support (credentials, OAuth), built-in session management, and JWT support. Still in beta, but the most integrated option for Next.js.

### Why axios over fetch?
Request/response interceptors enable clean token injection, CSRF handling, retry logic, and centralized error handling without boilerplate. Tradeoff: additional dependency, but significantly cleaner API client code.

### Why react-hook-form + Zod?
react-hook-form provides minimal re-renders and good performance. Zod provides runtime schema validation with TypeScript type inference. Combined via `@hookform/resolvers` for validated form handling.

### Why sonner for toasts?
Lightweight toast library that integrates well with shadcn/ui. Used for validation errors, success messages, and network status feedback.

### Why TipTap for rich text?
Extensible, headless rich text editor based on ProseMirror. Used for interview notes and feedback where markdown-style editing is needed.

---

## Known Limitations and Future Improvements

### Current Limitations

1. **No Image Optimization**: Using native `<img>` tags without Next.js `<Image>` component
2. **No Offline Support**: No service workers or offline caching
3. **No PWA Features**: Not installable as a standalone app
4. **No E2E Tests**: Unit and component tests exist, but no Playwright or Cypress

### Potential Improvements

1. **E2E Testing**: Add Playwright or Cypress for end-to-end testing
2. **Image Optimization**: Convert to Next.js `<Image>` component for lazy loading
3. **Performance Monitoring**: Add Sentry or similar for error tracking and analytics
4. **Accessibility Audit**: Continuous auditing with Axe DevTools

---

**Document Generated**: 2026-02-20
**Frontend Location**: `/home/simon198/work/personal/ditto/frontend`
**Framework Version**: Next.js 14.2.15
**Package Manager**: pnpm
