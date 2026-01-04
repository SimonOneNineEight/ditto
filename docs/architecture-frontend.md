# Ditto Frontend Architecture

## Executive Summary

The Ditto frontend is a modern, production-ready Next.js 14 application that provides a job tracking and management interface for users. Built with Next.js App Router, shadcn/ui components, and comprehensive authentication via NextAuth v5, the application demonstrates best practices in server and client component architecture, state management, and secure API integration.

The frontend is organized around two primary route groups: `(app)` for authenticated features and `(auth)` for public authentication pages. It leverages TypeScript for type safety, Zod for schema validation, React Hook Form for form management, and Tailwind CSS for styling. Token-based authentication is seamlessly integrated with a backend API, supporting both credential-based login and OAuth providers (GitHub, Google).

**Key Metrics:**
- Framework: Next.js 14 (App Router)
- Total Frontend Code: ~4,937 lines of TypeScript/React
- UI Components: 15 shadcn/ui components
- Authentication: NextAuth v5 (beta.29)
- Type Safety: Full TypeScript coverage
- Styling: Tailwind CSS v4 + shadcn theming

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 14.2.15 | Server-side rendering, App Router, API routes |
| **Runtime** | React | 18 | Component framework and hooks |
| **Language** | TypeScript | 5 | Type-safe development |
| **Auth** | NextAuth | 5.0.0-beta.29 | Multi-provider authentication (credentials, GitHub, Google) |
| **UI Library** | shadcn/ui | Latest | Pre-built, accessible component system |
| **UI Primitives** | Radix UI | Latest (v1.x) | Unstyled, accessible components |
| **Styling** | Tailwind CSS | 4.1.10 | Utility-first CSS framework |
| **Theme Management** | next-themes | 0.3.0 | Dark/light mode support |
| **HTTP Client** | axios | 1.7.9 | API requests with interceptors |
| **Form State** | react-hook-form | 7.54.2 | Efficient form state management |
| **Form Validation** | Zod | 3.24.2 | Runtime schema validation |
| **Form Resolvers** | @hookform/resolvers | 4.1.2 | Bridge between react-hook-form and Zod |
| **Icons** | lucide-react | 0.452.0 | React icon library |
| **Icons (Brands)** | @icons-pack/react-simple-icons | 13.6.0 | Brand SVG icons (GitHub, Google, etc.) |
| **Data Tables** | @tanstack/react-table | 8.20.5 | Headless table library |
| **UI Utilities** | class-variance-authority | 0.7.0 | Type-safe CSS class composition |
| **CSS Utilities** | clsx, tailwind-merge | 2.1.1, 2.5.3 | Class composition and merging |
| **Animations** | tailwindcss-animate | 1.0.7 | Animation utilities |
| **Drawers** | vaul | 1.1.2 | Drawer component library |
| **Colors** | randomcolor | 0.6.2 | Random color generation |
| **Linting** | ESLint | 8 | Code quality |
| **Formatting** | Prettier | 3.5.2 | Code formatting |

---

## Architecture Pattern

### Next.js App Router Overview

The application uses Next.js 14's App Router (directory-based routing in `/src/app`), which provides:
- **Server-Side Rendering (SSR)**: Default for all pages unless marked with 'use client'
- **Server Components**: Request-level caching and data fetching
- **Client Components**: Interactive features, hooks, event listeners
- **Hybrid Rendering**: Mix of server and client components as needed

```
Ditto Frontend Architecture

┌─────────────────────────────────────────────────────────┐
│                    Request Middleware                     │
│              (Auth validation, route protection)          │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐          ┌─────▼──┐
    │ (auth) │          │  (app) │
    │ Routes │          │ Routes │
    └────┬───┘          └────┬──┘
         │                   │
    ┌────▼─────┐        ┌────▼────────────────┐
    │ /login   │        │ /applications       │
    │ /register│        │ /interviews         │
    └──────────┘        │ /design-system      │
                        └─────────────────────┘
        │                   │
        ├──────┬────────────┤
        │      │            │
    ┌───▼──┐ ┌─▼───┐ ┌──────▼──────┐
    │ auth │ │Form │ │ Data Tables  │
    │Token │ │State│ │ & Components │
    └──────┘ └─────┘ └──────────────┘
        │      │            │
        └──┬───┴────────┬───┘
           │            │
      ┌────▼────────────▼────┐
      │  Axios API Client     │
      │  (Interceptors)       │
      └──────────┬────────────┘
           │     │
      ┌────▼─────▼─────┐
      │ Backend API     │
      │ (JWT + OAuth)   │
      └─────────────────┘
```

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router root
│   │   ├── (app)/                    # Authenticated routes (route group)
│   │   │   ├── layout.tsx            # Shared layout (sidebar, navbar)
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── applications/         # Job applications feature
│   │   │   │   ├── page.tsx          # Applications list
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx      # Application detail
│   │   │   │   │   └── job-description.tsx
│   │   │   │   └── application-table/
│   │   │   │       ├── application-table.tsx
│   │   │   │       └── columns.tsx
│   │   │   ├── interviews/           # Interview tracking
│   │   │   │   ├── page.tsx          # Interviews list
│   │   │   │   └── past-interviews/  # Interview history
│   │   │   └── design-system/        # UI component showcase
│   │   ├── (auth)/                   # Public auth routes (route group)
│   │   │   ├── layout.tsx            # Auth page layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── components/
│   │   │       ├── oauth-buttons.tsx
│   │   │       └── market-banner.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts      # NextAuth API routes
│   │   ├── layout.tsx                # Root layout
│   │   ├── fonts/                    # Local fonts
│   │   │   ├── GeistVF.woff
│   │   │   └── GeistMonoVF.woff
│   │   └── globals.css               # Global styles
│   │
│   ├── auth.ts                       # NextAuth configuration
│   ├── middleware.ts                 # Route protection middleware
│   │
│   ├── components/                   # Reusable components
│   │   ├── ui/                       # shadcn/ui components (15 total)
│   │   │   ├── accordion.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx
│   │   │   └── tooltip.tsx
│   │   ├── Navbar/
│   │   │   ├── navbar.tsx
│   │   │   ├── dark-mode-dropdown.tsx
│   │   │   └── user-nav-control/
│   │   │       └── user-nav-control.tsx
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx           # Main sidebar
│   │   │   ├── nav-user.tsx          # User profile section
│   │   │   └── sidebar-trigger-button.tsx
│   │   ├── job-table/                # Job management table
│   │   │   ├── job-table.tsx
│   │   │   ├── columns.tsx
│   │   │   ├── apply-status-dropdown.tsx
│   │   │   └── scrape-button.tsx
│   │   ├── layout-wrapper/           # Layout container
│   │   ├── theme-provider.tsx        # Theme context
│   │   ├── index.tsx                 # Component exports
│   │   ├── button-demo.tsx
│   │   ├── color-palette-demo.tsx
│   │   └── typography-demo.tsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-mobile.ts             # Mobile breakpoint detection
│   │   └── use-compact-layout.ts     # Layout preferences
│   │
│   ├── lib/                          # Utility functions
│   │   ├── axios.ts                  # Axios instance + interceptors
│   │   └── utils.ts                  # Helper utilities
│   │
│   ├── services/                     # Business logic / API layer
│   │   ├── auth-service.ts           # Authentication API calls
│   │   └── job-service.ts            # Job management API calls
│   │
│   ├── providers/                    # Context providers
│   │   └── auth-provider.tsx         # NextAuth SessionProvider
│   │
│   └── types/                        # TypeScript type definitions
│       └── auth-type.ts              # Auth-related types
│
├── public/                           # Static assets
│   ├── favicon.svg
│   └── ...
│
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind configuration
├── next.config.mjs                   # Next.js configuration
├── components.json                   # shadcn/ui config
├── .eslintrc.json                    # ESLint config
└── .prettierrc.json                  # Prettier config
```

---

## App Router Organization

### Route Groups: Separation of Concerns

The application uses **route groups** (directories wrapped in parentheses) to organize routes without affecting the URL structure:

#### `(auth)` Route Group
- **Purpose**: Public authentication routes
- **Authentication**: None required
- **Layout**: Auth-specific layout with marketing banner
- **Routes**:
  - `/login` - Credential and OAuth login
  - `/register` - User registration
- **Middleware**: Redirects authenticated users to dashboard
- **Components**: `oauth-buttons.tsx`, `market-banner.tsx`

#### `(app)` Route Group
- **Purpose**: Protected application routes (require authentication)
- **Authentication**: Mandatory via NextAuth
- **Layout**: Full dashboard layout (sidebar + navbar)
- **Routes**:
  - `/` - Dashboard (main page)
  - `/applications` - Job applications list and detail views
  - `/interviews` - Interview tracking and history
  - `/design-system` - UI component showcase
- **Components**: Sidebar, Navbar, Data tables
- **Middleware Protection**: All routes require valid session

### Middleware Configuration

File: `src/middleware.ts`

```typescript
export { auth as middleware } from '@/auth';

export const config = {
    matcher: [
        '/applications/:path*',
        '/interviews/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
    ],
};
```

**Behavior**:
- Protects all routes under `/applications` and `/interviews`
- Excludes API routes, Next.js internals, static files, and auth routes
- Redirects unauthenticated users to login page

---

## Component Architecture

### shadcn/ui Components (15 Total)

The application uses shadcn/ui, which provides unstyled, accessible components built on Radix UI primitives. These are fully customizable with Tailwind CSS.

#### Core UI Components

| Component | Radix Primitive | Usage |
|-----------|----------------|-------|
| **Button** | N/A (custom) | Primary CTA, form submissions, actions |
| **Card** | N/A (custom) | Content containers, layout blocks |
| **Input** | N/A (custom) | Text input fields, form inputs |
| **Badge** | N/A (custom) | Status indicators, tags |
| **Avatar** | Avatar (Radix) | User profile pictures |
| **Separator** | Separator (Radix) | Visual dividers |
| **Tooltip** | Tooltip (Radix) | Contextual help text |
| **Dropdown Menu** | DropdownMenu (Radix) | User actions, navigation |
| **Sheet** | Dialog (Radix) | Slide-out navigation panels |
| **Drawer** | Dialog (Radix) | Mobile-friendly sheet drawer |
| **Dialog** | Dialog (Radix) | Modal dialogs (not yet used, available) |
| **Accordion** | Accordion (Radix) | Collapsible sections |
| **Collapsible** | Collapsible (Radix) | Toggle-able content |
| **Sidebar** | N/A (custom composition) | Main navigation sidebar |
| **Skeleton** | N/A (custom) | Loading placeholders |
| **Table** | N/A (headless) | Data display with TanStack Table |

### Component Composition Pattern

```
Custom Page/Feature Component
├── shadcn/ui Wrapper Components (Card, Button, etc.)
├── Feature-Specific Components (job-table, application-detail)
├── Business Logic / Hooks (useSession, custom hooks)
└── Service Integration (api calls)
```

**Example: Application Table**

```
ApplicationTable (Feature Component)
├── Card (shadcn/ui)
│   ├── TanStack Table + Table (shadcn/ui)
│   │   ├── Columns (with Badge, Dropdown Menu)
│   │   └── Rows
│   └── Button (shadcn/ui)
└── API Integration (jobService)
```

### Custom Components

#### Navigation Components
- **Navbar**: Conditional rendering based on auth status
- **Sidebar**: Main navigation with user profile section
- **SidebarProvider/SidebarInset**: Sidebar layout system

#### Feature Components
- **JobTable**: Paginated, sortable job listings
- **ApplicationTable**: Application status tracking
- **InterviewTable**: Interview management
- **OAuthButtons**: Multi-provider OAuth login buttons
- **MarketBanner**: Marketing content on auth pages

#### Layout Components
- **LayoutWrapper**: Consistent page container padding
- **ThemeProvider**: Dark/light mode management

---

## Authentication Flow

### NextAuth v5 Integration

File: `src/auth.ts`

NextAuth is configured as the primary authentication system with three provider strategies:

#### 1. Credentials Provider (Email + Password)
- Local authentication with backend JWT system
- Calls `/api/login` endpoint to validate credentials
- Returns access and refresh tokens from backend

#### 2. OAuth Providers
- **GitHub**: Social login via GitHub
- **Google**: Social login via Google
- Redirects to `/api/oauth` endpoint for backend sync

#### 3. Callback Chain

```
signIn Callback
│
├─ OAuth Flow
│  ├─ Provider returns user data
│  ├─ POST /api/oauth (backend sync)
│  ├─ Backend creates/updates user
│  └─ Returns access_token, refresh_token, user.id
│
└─ Credentials Flow
   └─ Direct backend login
```

**JWT Callback**:
- Stores backend tokens (access_token, refresh_token) in JWT
- Preserves tokens across requests
- Makes tokens available in session object

**Session Callback**:
- Injects tokens into session object
- Frontend can access `session.accessToken` for API requests
- Enriches user ID with backend user ID

### Authentication Flow Diagram

```
User Login Request
│
├─ Via Credentials
│  ├─ Email + Password → signIn('credentials')
│  ├─ Credentials Provider authorizes with backend
│  ├─ Backend validates & returns tokens
│  └─ NextAuth stores in JWT
│
└─ Via OAuth (GitHub/Google)
   ├─ Redirects to provider
   ├─ Provider returns authorization code
   ├─ NextAuth exchanges for tokens
   ├─ signIn Callback triggers
   ├─ POST /api/oauth with provider + user data
   ├─ Backend creates/updates user, returns tokens
   └─ NextAuth stores in JWT
        │
        ▼
   JWT Callback
   ├─ Stores access_token, refresh_token, backendUserId
   └─ Session Callback
      ├─ Makes tokens available in session
      └─ Injects into axios interceptors
           │
           ▼
      API Requests
      ├─ axios interceptor extracts session
      ├─ Adds Bearer token to Authorization header
      └─ Backend validates token
```

### Session Management

**SessionProvider** (Root Layout):
- Wraps entire application in `src/providers/auth-provider.tsx`
- Makes `useSession()` hook available throughout app
- Refetches session periodically

**useSession() Hook**:
- Returns `session`, `status`, `data`
- Status: `"loading"`, `"authenticated"`, `"unauthenticated"`
- Automatically handles token refresh

### Protected Routes

Routes under `(app)` are protected by middleware. If unauthenticated:
- Middleware checks session validity
- Redirects to `/login` page
- Cleared session clears in browser

---

## State Management

The application uses a **minimal state management approach** leveraging React's built-in features:

### Session State (NextAuth)
```typescript
const { data: session, status } = useSession();
// session.user: { id, email, name, image }
// session.accessToken: JWT token for API calls
// status: 'loading' | 'authenticated' | 'unauthenticated'
```

### Local Component State (React Hooks)
- **useState**: For form inputs, UI toggles, loading states
- **useEffect**: For side effects, data fetching
- **useContext**: For theme context (next-themes)

### Form State (react-hook-form)
- **useForm**: Efficient form state management with minimal re-renders
- **Validation**: Integrated with Zod schema validation
- **Controlled Inputs**: Form values tracked in form instance, not component state

### Example: Login Form State

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
});
// register: bind input to form state
// handleSubmit: form submission with validation
// errors: validation error messages
```

### Theme State (next-themes)
- **ThemeProvider**: Wraps app to enable dark/light mode
- **useTheme()**: Access current theme and toggle function
- Persists theme preference in localStorage

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

**Base URL**:
- Production: Set via `NEXT_PUBLIC_API_URL` environment variable
- Development: Defaults to `http://localhost:8081`

### Request Interceptor

Automatically adds JWT bearer token to all requests:

```typescript
api.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
});
```

**Features**:
- Fetches current session from NextAuth
- Injects access token in Authorization header
- Runs before every request (transparent to caller)

### Response Interceptor

Centralized error handling:

```typescript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('Response Error:', error.response.data);
        } else if (error.request) {
            console.error('Request Error:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);
```

**Error Categories**:
- **Response Errors**: Server returned error (4xx, 5xx)
- **Request Errors**: Request never reached server
- **Configuration Errors**: Problem setting up the request

### API Services

Services abstract business logic from components. Each service encapsulates API calls for a feature domain.

#### authService (`src/services/auth-service.ts`)

```typescript
authService.register(name, email, password)     // POST /api/users
authService.login(email, password)              // POST /api/login
authService.refreshToken(refreshToken)         // POST /api/refresh_token
authService.getMe()                            // GET /api/me
```

#### jobService (`src/services/job-service.ts`)

```typescript
jobService.getAllJobs()                        // GET /jobs
jobService.handleStatusChange(id, status)      // PATCH /jobs/{id}/status
jobService.syncNewJobs()                       // GET /jobs/sync-new-jobs
```

**Service Pattern Benefits**:
- Separation of concerns (API logic separate from UI)
- Reusable across multiple components
- Centralized error handling
- Easier testing and mocking

### Type-Safe API Calls

Zod + TypeScript for runtime validation:

```typescript
export type LoginResponse = {
    access_token: string;
    refresh_token: string;
    user: UserResponse;
};

// In service:
const { data } = await api.post<LoginResponse>('/api/login', {});
```

---

## Styling Architecture

### Tailwind CSS v4

**Configuration**: `tailwind.config.ts`

- **CSS Variables**: Enabled for theming (`@/app/globals.css`)
- **Base Color**: Zinc (neutral grays)
- **Styling Approach**: Utility-first

### Global Styles

File: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS variables for theming */
/* --background, --foreground, --primary, --accent, etc. */
```

**CSS Variables**:
- Light mode: Default colors
- Dark mode: Override in `@media (prefers-color-scheme: dark)`
- Theme toggle: Controlled by next-themes (adds `dark` class to `<html>`)

### Component Styling

shadcn/ui components use:
1. **Tailwind Classes**: Primary styling
2. **CSS Variables**: Dynamic theming
3. **CVA (class-variance-authority)**: Variant composition

**Example Button Component**:
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-8",
      },
    },
  }
);
```

### Local Custom Styling

Components can combine:
- **Tailwind utilities**: `className="flex items-center gap-4"`
- **CSS modules**: Not used (Tailwind-first approach)
- **Inline styles**: Rarely (prefer Tailwind)

### shadcn/ui Customization

Components are copied to `src/components/ui/` and can be modified:
- Change default variant behavior
- Add new color schemes
- Adjust spacing/sizing
- Customize animations

### Responsive Design

Uses Tailwind breakpoints:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

Custom hook for mobile detection:
```typescript
const isMobile = useIsMobile(); // true if width < 768px
```

---

## Development Workflow

### Getting Started

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8081" > .env.local

# Run development server
npm run dev

# Open http://localhost:8080
```

### Development Scripts

```json
{
  "dev": "next dev -p 8080",      // Start dev server on port 8080
  "build": "next build",          // Production build
  "start": "next start",          // Start production server
  "lint": "next lint"             // Run ESLint
}
```

### Code Quality Tools

#### ESLint Configuration
File: `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

- Enforces Next.js best practices
- TypeScript type checking
- Unused variables, missing dependencies

#### Prettier Configuration
File: `.prettierrc.json`

- Automated code formatting
- 4-space indentation
- Consistent style across team

#### TypeScript Configuration
File: `tsconfig.json`

```typescript
{
  "compilerOptions": {
    "strict": true,                    // Strict type checking
    "moduleResolution": "bundler",     // Module resolution
    "paths": {
      "@/*": ["./src/*"]              // Path aliases
    }
  }
}
```

### Component Development

#### Creating a New Component

1. **Determine Type**:
   - If using shadcn primitive: `npx shadcn-ui@latest add [component]`
   - If custom: Create in `src/components/`

2. **Structure**:
   ```tsx
   'use client';  // If interactive

   import { ReactNode } from 'react';

   type ComponentProps = {
     children: ReactNode;
     className?: string;
   };

   export default function Component({ children, className }: ComponentProps) {
     return <div className={className}>{children}</div>;
   }
   ```

3. **Export**: Add to `src/components/index.tsx` for easy imports

#### Testing Components

No automated testing configured. Manual testing approach:
- Design system page at `/design-system` for UI component showcase
- Manual integration testing in browser
- Console logging for debugging

### Environment Variables

Supported variables:

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes | `http://localhost:8081` |

**Notes**:
- Must be prefixed with `NEXT_PUBLIC_` to be exposed to browser
- Set in `.env.local` (not committed)
- Used in `src/lib/axios.ts` and `src/auth.ts`

### Git Workflow

1. Create feature branch from `main`
2. Make changes with automatic formatting (Prettier)
3. Run linting: `npm run lint`
4. Commit with clear messages
5. Push to remote branch
6. Create Pull Request
7. Code review and merge

---

## Deployment Architecture

### Build Process

```bash
npm run build
```

1. **Next.js Compilation**:
   - Compiles TypeScript to JavaScript
   - Bundles and optimizes code
   - Generates `.next/` output directory

2. **Output Files**:
   - Server-side code: Compiled to Node.js-compatible format
   - Client-side code: Optimized JavaScript bundles
   - Static assets: Cached with fingerprints

3. **Build Artifacts**:
   - `.next/` directory: Ready for deployment
   - Size-optimized bundles
   - Source maps for debugging (production disabled)

### Deployment Target

Typically deployed to:
- **Vercel** (Next.js native platform) - Recommended
- **AWS (Amplify, EC2, ECS)**
- **Docker container**
- **Node.js server** (using `npm start`)

### Production Considerations

1. **Environment Variables**:
   - Set `NEXT_PUBLIC_API_URL` to production backend URL
   - Use environment file or deployment platform secrets

2. **Performance**:
   - Automatic code splitting
   - Image optimization
   - Font optimization (Geist fonts in `src/app/fonts/`)

3. **Security**:
   - HTTPS enforcement
   - CORS configuration on backend
   - Environment variables never in client code (unless NEXT_PUBLIC_)

4. **Monitoring**:
   - Deploy with analytics enabled
   - Monitor Core Web Vitals
   - Set up error tracking (Sentry, etc.)

### Vercel Deployment (Recommended)

```bash
# Connected to GitHub repository
# Automatic deployments on push to main
# Environment variables configured in Vercel dashboard
```

---

## Performance Considerations

### Server vs Client Components

**Server Components** (Default):
- Rendered on server
- Access backend directly
- No JavaScript sent to browser
- Better for sensitive data
- Use case: Pages, layouts, static content

**Client Components** (marked with 'use client'):
- Rendered in browser
- Can use React hooks
- Interactive features
- Use case: Forms, dropdowns, animations, user interaction

**Current Strategy**:
- Pages and layouts are server components when possible
- Interactive sections marked with 'use client'
- Lazy-loaded client boundaries for interactivity

### Code Splitting

Next.js automatically splits code per route:
- Each page loads only necessary JavaScript
- Shared components deduplicated
- Unused code excluded from bundles

### Image Optimization

Uses native `<img>` tags (static images):
- Not using Next.js `<Image>` component yet
- Opportunity for optimization: Add `<Image>` for lazy loading

### Font Optimization

Custom fonts loaded at build time:
- Geist Sans and Geist Mono from `/public/fonts/`
- System font stack fallback
- Preloaded via `localFont()`

### Caching Strategy

- **HTTP Caching**: Configured by deployment platform
- **Browser Caching**: Static assets cached long-term
- **Next.js Caching**: ISR (Incremental Static Regeneration) not used
- **Session Caching**: NextAuth caches sessions in memory

### Bundle Size

Approximate bundles (production):
- React + React DOM: ~45KB gzipped
- Next.js runtime: ~25KB gzipped
- Application code: ~100KB gzipped
- Total estimated: ~170KB gzipped

---

## Architectural Decisions

### Why Next.js 14 App Router?

**Decisions**:
- ✅ Modern, recommended routing system (vs Pages Router)
- ✅ Server-side rendering by default (better performance)
- ✅ Unified layouts and middleware
- ✅ Built-in API routes for auth endpoints
- ❌ Not using Pages Router (legacy approach)

**Tradeoff**: Steeper learning curve, but better long-term maintainability

### Why shadcn/ui?

**Decisions**:
- ✅ Unstyled, fully customizable components
- ✅ Built on Radix UI (accessible primitives)
- ✅ Copy-paste model (components in your repo, not node_modules)
- ✅ Tailwind CSS integration
- ❌ Not using Material-UI (heavier, opinionated)
- ❌ Not using Headless UI (fewer components)

**Tradeoff**: Must maintain components yourself, but full control

### Why Tailwind CSS?

**Decisions**:
- ✅ Utility-first, rapid development
- ✅ Small bundle size (~15KB gzipped)
- ✅ Works seamlessly with shadcn/ui
- ✅ Consistent spacing/sizing system
- ❌ Not using CSS-in-JS (Emotion, Styled Components)
- ❌ Not using CSS Modules

**Tradeoff**: Longer class names in JSX, but better performance

### Why NextAuth v5?

**Decisions**:
- ✅ Official Next.js auth solution
- ✅ Multi-provider support (credentials, OAuth)
- ✅ Session management built-in
- ✅ JWT and database session options
- ❌ Not using Auth0 (heavier, paid)
- ❌ Not using Firebase Auth (vendor lock-in)

**Tradeoff**: Still in beta, API changes possible

### Why axios Over fetch?

**Decisions**:
- ✅ Request/response interceptors (DRY token injection)
- ✅ Request cancellation
- ✅ Request timeout
- ✅ Automatic JSON transformation
- ❌ Not using fetch (more boilerplate)

**Tradeoff**: Additional dependency, but much cleaner code

### Why react-hook-form + Zod?

**Decisions**:
- ✅ react-hook-form: Minimal re-renders, good performance
- ✅ Zod: Runtime schema validation with TypeScript types
- ✅ Integration via @hookform/resolvers
- ❌ Not using Formik (heavier)
- ❌ Not using raw useState (verbose, error-prone)

**Tradeoff**: Learning curve, but professional form handling

---

## Key Files Reference

### Authentication & Setup

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/auth.ts` | NextAuth configuration | `handlers`, `signIn`, `signOut`, `auth` |
| `src/middleware.ts` | Route protection | Middleware config, route matchers |
| `src/providers/auth-provider.tsx` | SessionProvider wrapper | AuthProvider component |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth API routes | GET, POST handlers |

### Services & API

| File | Purpose | Key Functions |
|------|---------|----------------|
| `src/lib/axios.ts` | Axios instance | `api` (axios client) |
| `src/services/auth-service.ts` | Auth API calls | `register()`, `login()`, `getMe()` |
| `src/services/job-service.ts` | Job API calls | `getAllJobs()`, `handleStatusChange()` |

### Layout & Components

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/app/layout.tsx` | Root layout | RootLayout |
| `src/app/(app)/layout.tsx` | App layout | AppLayout (with sidebar/navbar) |
| `src/app/(auth)/layout.tsx` | Auth layout | AuthLayout |
| `src/components/Navbar/navbar.tsx` | Top navigation | Navbar |
| `src/components/Sidebar/Sidebar.tsx` | Main sidebar | AppSidebar |
| `src/components/theme-provider.tsx` | Theme context | ThemeProvider |

### Configuration

| File | Purpose | Key Settings |
|------|---------|--------------|
| `package.json` | Dependencies | All npm packages |
| `tsconfig.json` | TypeScript | Strict mode, path aliases |
| `components.json` | shadcn/ui config | Component aliases, Tailwind paths |
| `next.config.mjs` | Next.js config | Currently empty (default config) |
| `tailwind.config.ts` | Tailwind config | Colors, fonts, animations |

### Types

| File | Purpose | Key Types |
|------|---------|-----------|
| `src/types/auth-type.ts` | Auth types | `LoginResponse`, `UserResponse`, NextAuth module augmentation |

---

## Development Patterns & Best Practices

### Component Organization

**Pattern: Feature + UI Separation**

```
Feature: Job Applications
├── Feature Components
│   ├── ApplicationTable.tsx
│   ├── ApplicationDetail.tsx
│   └── columns.tsx (table columns)
├── UI Components (shadcn/ui)
│   ├── Card
│   ├── Button
│   └── Badge
└── Service Integration
    └── jobService.getAllJobs()
```

### Naming Conventions

- **Components**: PascalCase (React components)
- **Hooks**: camelCase, start with `use` (custom hooks)
- **Services**: camelCase (functions/objects)
- **Types**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**:
  - Components: PascalCase (`Navbar.tsx`)
  - Utilities: camelCase (`utils.ts`)
  - Index exports: `index.ts` for re-exports

### Import Organization

```typescript
// 1. External libraries
import React from 'react';
import { useSession } from 'next-auth/react';

// 2. Internal components
import { Button, Card } from '@/components/ui';
import Navbar from '@/components/Navbar';

// 3. Services and utilities
import { jobService } from '@/services';
import { cn } from '@/lib/utils';

// 4. Types
import type { JobResponse } from '@/types';
```

### Error Handling

**Pattern: Service-level with UI feedback**

```typescript
try {
    const response = await jobService.getAllJobs();
} catch (error) {
    console.error('Error fetching jobs:', error);
    setError('Failed to load jobs');
    // Show error toast/alert to user
}
```

### Loading States

**Pattern: Conditional rendering with status**

```typescript
const [loading, setLoading] = useState(false);

if (loading) return <Skeleton />;
if (error) return <ErrorMessage />;
return <Content />;
```

### Async Operations

**Pattern: useEffect + async function**

```typescript
useEffect(() => {
    const fetchData = async () => {
        try {
            const data = await jobService.getAllJobs();
            setJobs(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };
    fetchData();
}, []);
```

---

## Known Limitations & Future Improvements

### Current Limitations

1. **No Automated Testing**: No unit, integration, or E2E tests configured
2. **No Error Boundaries**: Unhandled errors crash the entire app
3. **No Loading Skeletons**: Basic loading states (no shimmer effects)
4. **No Toast Notifications**: Error/success messages show as console logs
5. **No Image Optimization**: Using native `<img>` tags without optimization
6. **No Offline Support**: No service workers or offline caching
7. **No PWA Features**: Not installable as app
8. **Token Refresh**: Not implemented in axios (relies on NextAuth refresh)

### Recommended Improvements

1. **Add Testing**:
   - Jest + React Testing Library for unit tests
   - Playwright or Cypress for E2E tests

2. **Improve Error Handling**:
   - Error boundaries for component-level error catching
   - Global error page component
   - User-facing error messages with toast notifications

3. **Performance**:
   - Convert to `<Image>` component
   - Add code splitting for large features
   - Implement dynamic imports for modal dialogs

4. **Auth Improvements**:
   - Token refresh interceptor
   - Login expiration warning
   - Session persistence across page reloads

5. **Monitoring**:
   - Sentry for error tracking
   - Analytics for user behavior
   - Performance monitoring

6. **Accessibility**:
   - Audit with Axe DevTools
   - Keyboard navigation for all components
   - ARIA labels and semantic HTML

---

## Troubleshooting & Debug Guide

### Common Issues

#### 1. "auth is not exported from @/auth"
- **Cause**: NextAuth not properly configured
- **Fix**: Check `src/auth.ts` exports `{ handlers, signIn, signOut, auth }`

#### 2. Session always returns `null` in client components
- **Cause**: Component not wrapped in `SessionProvider`
- **Fix**: Ensure `AuthProvider` wraps entire app in root layout

#### 3. Authorization header not sent to API
- **Cause**: Axios interceptor not running
- **Fix**: Check session exists and `getSession()` returns token

#### 4. OAuth login redirects to login page after callback
- **Cause**: Backend `/api/oauth` endpoint failed
- **Fix**: Check backend logs, ensure `NEXT_PUBLIC_API_URL` correct

#### 5. Tailwind styles not applying
- **Cause**: CSS not imported globally
- **Fix**: Check `globals.css` imported in root layout

### Debug Techniques

1. **Console Logging**:
   ```typescript
   const { data: session } = useSession();
   console.log('Current session:', session);
   ```

2. **Network Tab**:
   - Open DevTools → Network tab
   - Check API requests for Authorization header
   - Verify response status codes

3. **Application Tab**:
   - Check cookies for NextAuth tokens
   - Verify localStorage for theme preference

4. **React DevTools**:
   - Inspect component props and state
   - View hook state changes

---

## Summary

The Ditto frontend demonstrates modern Next.js best practices with:

- **Clean Architecture**: Separation of routes, components, services
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Authentication**: NextAuth with multi-provider support and JWT tokens
- **Component Library**: shadcn/ui + Radix UI for accessible components
- **Styling**: Tailwind CSS with dark/light theme support
- **State Management**: React hooks + NextAuth session
- **API Integration**: Axios with request/response interceptors
- **Developer Experience**: ESLint, Prettier, TypeScript strict mode

The codebase is production-ready, maintainable, and follows industry best practices for modern web application development with Next.js.

---

**Document Generated**: 2024
**Frontend Location**: `/home/simon198/work/personal/ditto/frontend`
**Framework Version**: Next.js 14.2.15
