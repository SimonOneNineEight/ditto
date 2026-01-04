# Ditto Frontend UI Component Structure Documentation

**Framework:** Next.js 14 with App Router
**UI Library:** shadcn/ui + Radix UI
**Styling:** Tailwind CSS
**Authentication:** NextAuth.js
**Form Handling:** React Hook Form + Zod validation
**Data Tables:** TanStack React Table (v8)
**Icons:** Lucide React + Simple Icons

---

## Table of Contents

1. [Route Structure](#route-structure)
2. [Component Architecture](#component-architecture)
3. [shadcn/ui Components Inventory](#shadcnui-components-inventory)
4. [Custom Components by Category](#custom-components-by-category)
5. [Layout and Providers](#layout-and-providers)
6. [Component Dependencies](#component-dependencies)

---

## Route Structure

### App Router Hierarchy

```
src/app/
├── layout.tsx                          # Root layout with AuthProvider
├── globals.css
├── fonts/
│   ├── GeistVF.woff
│   └── GeistMonoVF.woff
├── (app)/                              # Authenticated app routes group
│   ├── layout.tsx                      # App layout with sidebar, navbar, theme
│   ├── page.tsx                        # Dashboard (/) - home page
│   ├── applications/                   # Job applications section
│   │   ├── page.tsx                    # Applications list view
│   │   ├── [id]/                       # Dynamic application detail route
│   │   │   ├── page.tsx                # Application detail page
│   │   │   └── job-description.tsx     # Job description component (not exported)
│   │   └── application-table/
│   │       ├── index.ts                # Barrel export
│   │       ├── application-table.tsx   # Data table for applications
│   │       └── columns.tsx             # TanStack table column definitions
│   ├── interviews/                     # Interview tracking section
│   │   ├── page.tsx                    # Interviews page
│   │   ├── interview-table/
│   │   │   ├── index.ts                # Barrel export
│   │   │   ├── interview-table.tsx     # Data table for upcoming interviews
│   │   │   └── columns.tsx             # TanStack table column definitions
│   │   └── past-interviews/
│   │       ├── index.ts                # Barrel export
│   │       ├── past-interviews.tsx     # Accordion-based past interviews section
│   │       ├── interview-row.tsx       # Table for past interview rows
│   │       └── interview-row-column.tsx # Column definitions for past interviews
│   └── design-system/
│       └── page.tsx                    # Design system demo page
│
├── (auth)/                             # Authentication routes group
│   ├── layout.tsx                      # Auth layout (centered, no sidebar)
│   ├── login/
│   │   └── page.tsx                    # Login page with OAuth + credentials form
│   ├── register/
│   │   └── page.tsx                    # Registration page
│   └── components/
│       ├── market-banner.tsx           # Marketing banner for auth pages
│       └── oauth-buttons.tsx           # OAuth provider buttons (Google, GitHub)
│
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts                # NextAuth.js configuration endpoint
```

### Route Groups Explained

- **`(app)`** - Protected routes requiring authentication
  - Contains sidebar navigation, navbar, theme provider
  - Uses SidebarProvider for layout management

- **`(auth)`** - Public authentication routes
  - Centered layout without sidebar
  - Minimal header with branding
  - Marketing-focused design

---

## Component Architecture

### Component Organization Structure

```
src/components/
├── ui/                           # shadcn/ui components (15 total)
│   ├── accordion.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── collapsible.tsx
│   ├── drawer.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── sidebar.tsx
│   ├── skeleton.tsx
│   ├── table.tsx
│   └── tooltip.tsx
│
├── Navbar/                      # Top navigation component
│   ├── index.ts                 # Barrel export
│   ├── navbar.tsx               # Main navbar (shows auth buttons when logged out)
│   ├── dark-mode-dropdown.tsx   # Dark mode toggle (currently unused)
│   └── user-nav-control/
│       ├── index.ts             # Barrel export
│       └── user-nav-control.tsx # Login/Register buttons
│
├── Sidebar/                     # Main navigation sidebar
│   ├── index.ts                 # Barrel export
│   ├── Sidebar.tsx              # Main sidebar component with navigation
│   ├── sidebar-trigger-button.tsx # Mobile sidebar toggle button
│   └── nav-user.tsx             # User dropdown menu in sidebar footer
│
├── job-table/                   # (Legacy) Job table components
│   ├── index.ts                 # Barrel export
│   ├── job-table.tsx            # Main job table component
│   ├── columns.tsx              # Column definitions for job table
│   ├── scrape-button.tsx        # Button to scrape jobs
│   └── apply-status-dropdown.tsx # Dropdown for application status
│
├── layout-wrapper/              # Page layout wrapper
│   ├── index.ts                 # Barrel export
│   └── layout-wrapper.tsx       # Wraps page content with header and spacing
│
├── index.tsx                    # Main component barrel exports
├── theme-provider.tsx           # NextThemesProvider wrapper (dark mode)
│
├── typography-demo.tsx          # Demo component (unused)
├── button-demo.tsx              # Demo component (unused)
└── color-palette-demo.tsx       # Demo component (unused)
```

---

## shadcn/ui Components Inventory

### Foundation Components (15 total)

| Component | Location | Purpose | Key Features |
|-----------|----------|---------|--------------|
| **Accordion** | `src/components/ui/accordion.tsx` | Collapsible content sections | Radix UI based, multiple open support |
| **Avatar** | `src/components/ui/avatar.tsx` | User profile images | Fallback text support |
| **Badge** | `src/components/ui/badge.tsx` | Status/tag labels | Multiple variants (default, secondary, outline) |
| **Button** | `src/components/ui/button.tsx` | Interactive actions | Multiple sizes (sm, md, lg, full) and variants |
| **Card** | `src/components/ui/card.tsx` | Content containers | CardContent, CardFooter, CardHeader sub-components |
| **Collapsible** | `src/components/ui/collapsible.tsx` | Expandable sections | Radix UI based |
| **Drawer** | `src/components/ui/drawer.tsx` | Slide-out panel (mobile) | Responsive behavior |
| **Dropdown Menu** | `src/components/ui/dropdown-menu.tsx` | Context menus | Radix UI based, multiple menu items |
| **Input** | `src/components/ui/input.tsx` | Form text inputs | Standard HTML input with Tailwind styling |
| **Separator** | `src/components/ui/separator.tsx` | Visual divider | Horizontal/vertical support |
| **Sheet** | `src/components/ui/sheet.tsx` | Side panel (alternative to drawer) | Used in sidebar implementation |
| **Sidebar** | `src/components/ui/sidebar.tsx` | Navigation sidebar | Context-based, mobile responsive, collapsible |
| **Skeleton** | `src/components/ui/skeleton.tsx` | Loading placeholder | Gray placeholder animation |
| **Table** | `src/components/ui/table.tsx` | Data table structure | TableHeader, TableBody, TableRow, etc. |
| **Tooltip** | `src/components/ui/tooltip.tsx` | Hover information | Radix UI based |

### Component Usage Patterns

**Most Used Components:**
- `Button` - Auth buttons, table actions, form submissions
- `Card` - Login/register forms, data containers
- `Table` - Data display (applications, interviews, jobs)
- `Avatar` - User profile display
- `Badge` - Status indicators, tags
- `Accordion` - Past interviews collapsible sections
- `Dropdown Menu` - User menu, status changes

---

## Custom Components by Category

### Layout Components

#### `src/components/layout-wrapper/layout-wrapper.tsx`
- **Purpose:** Wraps page content with consistent styling and header
- **Props:** `children: React.ReactNode`
- **Key Features:**
  - Responsive layout grid
  - Dynamic page titles based on route (Dashboard, Applications, Interviews)
  - Motivational tagline display
  - Sidebar trigger button (mobile)
  - Uses pathname hook to determine current page

#### `src/components/Sidebar/Sidebar.tsx` (AppSidebar)
- **Purpose:** Main navigation sidebar for app routes
- **Key Features:**
  - Uses shadcn/ui Sidebar components
  - Mobile/desktop responsive (right side on mobile, left on desktop)
  - Navigation items: Dashboard, Applications, Interviews
  - Active route highlighting
  - Collapsible on mobile
  - User menu in footer
  - Suez One font for branding
- **Child Components:** NavUser
- **Hook Usage:** `useSidebar`, `usePathname`

#### `src/app/(app)/layout.tsx`
- **Purpose:** Root layout for authenticated app routes
- **Structure:**
  - ThemeProvider (next-themes)
  - SidebarProvider context
  - AppSidebar component
  - SidebarInset wrapper
  - Navbar component
  - LayoutWrapper wrapper
  - Child routes injected
- **Fonts:** Geist Sans, Geist Mono (local fonts)

---

### Navigation Components

#### `src/components/Navbar/navbar.tsx`
- **Purpose:** Top navigation bar
- **Logic:** Shows authentication buttons only when user is unauthenticated
- **Child Components:** UserNavControl
- **Hook Usage:** `useSession` (NextAuth)

#### `src/components/Navbar/user-nav-control/user-nav-control.tsx`
- **Purpose:** Login/Register button controls
- **Features:**
  - Two buttons: Login and Register
  - Links to auth routes
  - Responsive button sizing
- **Type:** Simple functional component

#### `src/components/Sidebar/nav-user.tsx` (NavUser)
- **Purpose:** User profile dropdown in sidebar footer
- **Features:**
  - Avatar with initials fallback
  - User name and email display
  - Account menu item
  - Sign out functionality
  - Responsive positioning (bottom on mobile, right on desktop)
- **Sub-Components:**
  - Avatar (shadcn/ui)
  - DropdownMenu (shadcn/ui) with groups and separators
- **Hook Usage:** `useSession` (NextAuth), `useSidebar`

#### `src/components/Sidebar/sidebar-trigger-button.tsx`
- **Purpose:** Mobile sidebar toggle button
- **Features:** Menu icon button to open/close sidebar

---

### Data Table Components

#### `src/components/job-table/job-table.tsx`
- **Purpose:** Generic job listings table (legacy component)
- **Props:**
  - `columns: ColumnDef<JobTableRow, any>[]`
  - `data: JobTableRow[]`
- **Features:**
  - TanStack React Table v8 integration
  - Status change handling with async API calls
  - Scrape button for importing jobs
  - Table footer with total count
  - No-results empty state
- **Dependencies:** jobService, convertJobResponseToTableRow utility
- **Child Components:** ScrapeButton, Table (shadcn/ui)

#### `src/components/job-table/columns.tsx`
- **Purpose:** TanStack table column definitions for jobs
- **Columns Defined:**
  - ID
  - Company
  - Title
  - Location
  - Date (formatted)
  - Apply Status (with dropdown)
  - Job URL (clickable link)
- **Cell Components:** ApplyStatusDropdown, Button (shadcn/ui), Link (Next.js)

#### `src/components/job-table/apply-status-dropdown.tsx`
- **Purpose:** Dropdown for changing application status
- **Props:**
  - `id: string`
  - `status: string`
  - `onStatusChange?: (id: string, newStatus: string) => Promise<void>`
- **Type:** Client-side component with state management

#### `src/components/job-table/scrape-button.tsx`
- **Purpose:** Trigger job scraping functionality
- **Props:** `setJobs: React.Dispatch<React.SetStateAction<JobTableRow[]>>`

---

#### `src/app/(app)/applications/application-table/application-table.tsx`
- **Purpose:** Data table for job applications
- **Props:**
  - `columns: ColumnDef<Application>[]`
  - `data: Application[]`
- **Features:**
  - TanStack React Table integration
  - Click row to navigate to detail view
  - New Application button
  - Total applications footer
  - Empty state handling
- **Hook Usage:** `useRouter` (Next.js navigation)

#### `src/app/(app)/applications/application-table/columns.tsx`
- **Purpose:** Column definitions for applications table
- **Data Type:** `Application` interface
- **Columns:** Company, Position, Status, Location, Tags, etc.

---

#### `src/app/(app)/interviews/interview-table/interview-table.tsx`
- **Purpose:** Data table for upcoming interviews
- **Props:**
  - `columns: ColumnDef<Interview, any>[]`
  - `data: Interview[]`
- **Features:**
  - Scrollable table (responsive overflow handling)
  - Click row to navigate to application detail
  - New Interview button
  - Coming Interviews counter footer
- **Hook Usage:** `useRouter` (Next.js navigation)

#### `src/app/(app)/interviews/interview-table/columns.tsx`
- **Purpose:** Column definitions for interviews table
- **Data Type:** `Interview` interface with `ColumnMeta`
- **Features:** Custom className support per column for styling

---

### Interview Management Components

#### `src/app/(app)/interviews/past-interviews/past-interviews.tsx`
- **Purpose:** Display past interviews in accordion sections
- **Structure:**
  - Outer accordion: Company/Position level
  - Inner accordion: Apply Date level
  - Table: Individual interview rows
- **Child Components:** Accordion (shadcn/ui), PastInterviewRow
- **Data Structure:** Interviews grouped by company → position → apply date → interview details

#### `src/app/(app)/interviews/past-interviews/interview-row.tsx`
- **Purpose:** Table display for individual past interviews
- **Props:**
  - `columns: ColumnDef<PastInterview>[]`
  - `data: PastInterview[]`
  - `applicationId: string`
- **Features:** TanStack React Table with custom styling

#### `src/app/(app)/interviews/past-interviews/interview-row-column.tsx`
- **Purpose:** Column definitions for past interview rows

---

### Authentication Components

#### `src/app/(auth)/layout.tsx`
- **Purpose:** Layout for authentication pages
- **Features:**
  - Centered design
  - Grid layout with auto sizing
  - Branding header with Ditto logo
  - Theme provider support
- **Child Routes:** Login, Register

#### `src/app/(auth)/login/page.tsx`
- **Purpose:** Login page
- **Features:**
  - OAuth button integration (Google, GitHub)
  - Email/password form with Zod validation
  - Error display
  - Link to registration
  - Form validation with react-hook-form
- **Sub-Components:** OAuthButtons, MarketBanner, Card, Separator
- **Hook Usage:** `useForm` (React Hook Form), `useRouter`, `signIn` (NextAuth)

#### `src/app/(auth)/components/oauth-buttons.tsx`
- **Purpose:** OAuth provider buttons
- **Providers:** Google, GitHub
- **Button Props:**
  - `variant="outline"`
  - `size="full"`
  - Icon positioning: left-center
  - Simple Icons: SiGoogle, SiGithub
- **Click Handler:** `signIn()` with redirectTo '/'

#### `src/app/(auth)/components/market-banner.tsx`
- **Purpose:** Marketing/branding banner for auth pages
- **Props:** `children: React.ReactNode`
- **Used In:** Login and Register pages for brand messaging

---

### Application Detail Components

#### `src/app/(app)/applications/[id]/page.tsx`
- **Purpose:** Detailed application view
- **Features:**
  - Application header (position, company, apply date)
  - Application details section:
    - Status (Badge)
    - Location (Badge)
    - Tags (Badge collection)
    - Resume and Cover Letter links
  - Job description section
- **Icons Used:** ChartNoAxesColumn, MapPin, Tags, FileSpreadsheet, FileText (Lucide)
- **Child Components:** JobDescription, Badge
- **Layout:** Flex column with sections and spacing

#### `src/app/(app)/applications/[id]/job-description.tsx`
- **Purpose:** Display job description text
- **Props:** `jobDescription: string`

---

### Theme and Provider Components

#### `src/components/theme-provider.tsx`
- **Purpose:** Wrapper around NextThemesProvider
- **Features:**
  - Dark mode support
  - System theme detection
  - Theme context propagation
- **Props:** All NextThemesProvider props (attribute, defaultTheme, enableSystem, etc.)
- **Type:** Client component with 'use client' directive

---

### Demo/Unused Components

#### `src/components/Navbar/dark-mode-dropdown.tsx`
- **Status:** Commented out in navbar
- **Purpose:** Dark mode toggle dropdown
- **Note:** Not currently active

#### `src/components/typography-demo.tsx`
- **Status:** Demo/unused
- **Purpose:** Typography examples

#### `src/components/button-demo.tsx`
- **Status:** Demo/unused
- **Purpose:** Button variants showcase

#### `src/components/color-palette-demo.tsx`
- **Status:** Demo/unused
- **Purpose:** Color palette reference

---

## Layout and Providers

### Provider Hierarchy

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

### Context Providers Used

| Provider | Source | Purpose | Scope |
|----------|--------|---------|-------|
| `AuthProvider` | NextAuth.js `SessionProvider` | Session management, authentication | Global (root layout) |
| `ThemeProvider` | next-themes | Dark/light mode switching | (app) and (auth) layouts |
| `SidebarProvider` | shadcn/ui | Sidebar state management (open/closed, mobile) | (app) layout only |

### Key Hooks Available

- `useSession()` - NextAuth session info (auth pages, navbar, sidebar)
- `useRouter()` - Next.js navigation (table row clicks, form submissions)
- `usePathname()` - Current route path (sidebar active highlighting, layout wrapper)
- `useSidebar()` - Sidebar state (open/closed, mobile mode, toggle)

---

## Component Dependencies

### External Libraries

**UI & Styling:**
- `shadcn/ui` - Component library
- `@radix-ui/*` - Underlying accessible components
- `tailwindcss` - Utility-first styling
- `lucide-react` - Icon library
- `@icons-pack/react-simple-icons` - Additional icons (Google, GitHub)

**Authentication:**
- `next-auth` - Authentication framework
- OAuth providers: Google, GitHub, Credentials

**Forms & Validation:**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form resolvers
- `zod` - Schema validation

**Data Tables:**
- `@tanstack/react-table` - Headless table library (v8)

**Theming:**
- `next-themes` - Dark mode management

**Fonts:**
- `next/font` - Font optimization
  - Local: Geist Sans, Geist Mono
  - Google: Suez One

---

## Component Dependency Graph

### Critical Dependencies for Each Feature

**Authentication Flow:**
- NextAuth.js → OAuth Providers → OAuthButtons, LoginPage, NavUser
- react-hook-form + Zod → LoginPage, RegisterPage

**Navigation:**
- SidebarProvider → AppSidebar → NavUser
- usePathname → Sidebar active state
- useRouter → Table row navigation

**Data Display:**
- @tanstack/react-table → JobTable, ApplicationTable, InterviewTable
- shadcn/ui Table → Column rendering

**Styling:**
- Tailwind CSS → All components
- next-themes + ThemeProvider → Dark mode support

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Routes** | 9 route segments + 1 API route |
| **shadcn/ui Components** | 15 |
| **Custom Components** | 20+ |
| **Page Components** | 7 (Home, Applications list, Application detail, Interviews list, Design System, Login, Register) |
| **Layout Components** | 3 (Root, App, Auth) |
| **Data Tables** | 3 (Jobs, Applications, Interviews) |
| **Route Groups** | 2 ((app) protected, (auth) public) |
| **Authentication Methods** | 3 (Google OAuth, GitHub OAuth, Credentials) |

---

## File Export Strategy

The project uses **barrel exports** for better organization:

- `/components/ui/` - Direct imports from shadcn/ui components
- `/components/index.tsx` - Main exports: ThemeProvider, Navbar, JobTable, Sidebar
- `/components/Navbar/index.ts` - Navbar sub-exports
- `/components/Sidebar/index.ts` - Sidebar sub-exports
- `/components/layout-wrapper/index.ts` - LayoutWrapper export
- `/components/job-table/index.ts` - JobTable sub-exports
- `/(app)/applications/application-table/index.ts` - ApplicationTable export
- `/(app)/interviews/interview-table/index.ts` - InterviewTable export

This structure enables clean, organized imports across the application.

---

## Design Patterns Observed

1. **Compound Components:** Sidebar, Accordion, DropdownMenu, Table
2. **Render Props:** TanStack table column definitions
3. **Context Providers:** SidebarProvider, ThemeProvider, SessionProvider
4. **Page Layouts:** Route group segregation (app) vs (auth)
5. **Barrel Exports:** Organized sub-component exports
6. **Client/Server Boundaries:** Clear 'use client' directives on interactive components
