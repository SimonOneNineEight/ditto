# Ditto - Annotated Source Tree

**Generated:** 2025-11-08
**Repository Type:** Multi-part (Backend + Frontend)
**Architecture:** Microservices-style separation

---

## Project Root

```
ditto/
├── backend/                 # Go API backend (Port 8081)
├── frontend/                # Next.js web application (Port 8080)
├── services/                # Additional services (if any)
├── docker-compose.yml       # Development environment orchestration
├── .github/                 # CI/CD workflows (if configured)
├── bmad/                    # BMad methodology files (project planning)
├── docs/                    # Generated documentation (this folder)
└── README.md                # Project overview and setup guide
```

---

## Backend Structure (Go + Gin)

**Root:** `/backend`
**Framework:** Go 1.23 + Gin
**Pattern:** Layered Architecture (Handler → Repository → Database)

```
backend/
│
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
│                            # - Initializes Gin router
│                            # - Sets up CORS middleware
│                            # - Registers all API routes
│                            # - Starts HTTP server on port 8081
│
├── internal/                # Private application code
│   │
│   ├── auth/               # Authentication utilities
│   │                       # - JWT token generation/validation
│   │                       # - Password hashing (bcrypt)
│   │
│   ├── config/             # Configuration management
│   │                       # - Environment variable parsing
│   │                       # - App configuration structs
│   │
│   ├── constants/          # Application constants
│   │                       # - Error codes
│   │                       # - Default values
│   │
│   ├── handlers/           # HTTP request handlers
│   │   ├── auth.go         # Authentication endpoints
│   │   ├── company.go      # Company CRUD + autocomplete
│   │   ├── job.go          # Job management
│   │   └── application.go  # Application tracking
│   │                       # Pattern: Parse request → Validate → Call repository → Return response
│   │
│   ├── middleware/         # HTTP middleware
│   │   ├── auth.go         # JWT authentication middleware
│   │   └── error.go        # Global error handler
│   │                       # Applied to protected routes
│   │
│   ├── models/             # Data structures
│   │   ├── user.go         # User, UserAuth models
│   │   ├── company.go      # Company model
│   │   ├── job.go          # Job, UserJob models
│   │   ├── application.go  # Application, Interview models
│   │   └── skill.go        # Skill, SkillCategory models
│   │                       # Includes JSON tags and validation rules
│   │
│   ├── repository/         # Database access layer
│   │   ├── user.go         # User CRUD + authentication queries
│   │   ├── company.go      # Company CRUD + search
│   │   ├── job.go          # Job CRUD + filtering
│   │   └── application.go  # Application CRUD + status management
│   │                       # Pattern: SQL queries using sqlx
│   │                       # Handles soft deletes, user-scoped queries
│   │
│   ├── routes/             # Route registration
│   │   ├── auth.go         # Auth routes (login, register, logout, etc.)
│   │   ├── company.go      # Company routes
│   │   ├── job.go          # Job routes
│   │   └── application.go  # Application routes
│   │                       # Wires handlers with middleware
│   │
│   ├── testutil/           # Test utilities
│   │                       # - Test database setup
│   │                       # - Fixture generators
│   │                       # - Helper functions
│   │
│   └── utils/              # Utility functions
│       └── app_state.go    # Application state management
│                           # - Database connection
│                           # - Shared dependencies
│
├── migrations/             # Database migrations
│   ├── 000001_initial_schema.up.sql
│   ├── 000001_initial_schema.down.sql
│   ├── 000002_add_users_auth_user_id_unique.up.sql
│   └── 000002_add_users_auth_user_id_unique.down.sql
│                           # Managed by golang-migrate
│                           # Contains DDL for tables, indexes, triggers
│
├── pkg/                    # Shared/reusable packages
│   ├── database/           # Database connection utilities
│   ├── errors/             # Custom error types
│   │                       # - ErrorCode enum
│   │                       # - Error conversion utilities
│   └── response/           # HTTP response helpers
│                           # - Success/error response formatting
│
├── go.mod                  # Go module definition
├── go.sum                  # Dependency checksums
├── Dockerfile.dev          # Development Docker image
├── docker-entrypoint.sh    # Container startup script (runs migrations)
├── .air.toml               # Hot reload configuration (Air)
├── test_api.sh             # API testing script
├── run_tests.sh            # Unit test runner
└── README.md               # Backend-specific documentation
```

### Backend Key Directories

| Directory | Purpose | Entry Point |
|-----------|---------|-------------|
| `cmd/server/` | Application bootstrap | `main.go:23` |
| `internal/handlers/` | API endpoint logic | Called by routes |
| `internal/repository/` | Database operations | Called by handlers |
| `internal/middleware/` | Request processing | Applied in routes |
| `migrations/` | Database schema | Auto-run on startup |
| `pkg/` | Reusable utilities | Imported throughout |

---

## Frontend Structure (Next.js 14)

**Root:** `/frontend`
**Framework:** Next.js 14 (App Router) + React 18
**Pattern:** Component-Based Architecture with App Router

```
frontend/
│
├── src/
│   │
│   ├── app/                # Next.js App Router (routes)
│   │   │
│   │   ├── (app)/          # Protected app routes (authenticated users)
│   │   │   ├── layout.tsx  # App layout with sidebar
│   │   │   ├── page.tsx    # Dashboard (/)
│   │   │   │
│   │   │   ├── applications/
│   │   │   │   ├── page.tsx           # Applications list page
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx       # Application detail page
│   │   │   │   └── application-table/ # Application table components
│   │   │   │       ├── columns.tsx    # TanStack Table column defs
│   │   │   │       └── data-table.tsx # Table component
│   │   │   │
│   │   │   ├── design-system/
│   │   │   │   └── page.tsx           # UI component showcase
│   │   │   │
│   │   │   └── interviews/
│   │   │       ├── page.tsx           # Interviews page
│   │   │       ├── interview-table/   # Interview table
│   │   │       └── past-interviews/   # Past interview display
│   │   │
│   │   ├── (auth)/         # Public auth routes
│   │   │   ├── layout.tsx  # Auth layout (centered, no sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx  # Login page (NextAuth)
│   │   │   ├── register/
│   │   │   │   └── page.tsx  # Register page
│   │   │   └── components/
│   │   │       └── ...       # Auth-specific components
│   │   │
│   │   ├── api/            # API routes (server-side)
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts  # NextAuth configuration
│   │   │
│   │   ├── fonts/          # Font files
│   │   ├── layout.tsx      # Root layout (providers, metadata)
│   │   ├── globals.css     # Global Tailwind styles
│   │   └── page.tsx        # Root redirect page
│   │
│   ├── components/         # Reusable components
│   │   │
│   │   ├── ui/             # shadcn/ui components (15 total)
│   │   │   ├── accordion.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   │
│   │   ├── Navbar/         # Navigation bar
│   │   │   ├── index.tsx
│   │   │   └── user-nav-control/  # User dropdown menu
│   │   │
│   │   ├── Sidebar/        # Application sidebar
│   │   │   ├── app-sidebar.tsx    # Main sidebar component
│   │   │   ├── nav-user.tsx       # User profile in sidebar
│   │   │   └── sidebar-trigger-button.tsx
│   │   │
│   │   ├── job-table/      # Job listings table
│   │   │   ├── columns.tsx
│   │   │   ├── data-table.tsx
│   │   │   └── data-table-toolbar.tsx
│   │   │
│   │   ├── layout-wrapper/ # App layout wrapper
│   │   │   └── index.tsx
│   │   │
│   │   └── theme-provider.tsx  # Dark/light theme management
│   │
│   ├── lib/                # Utility libraries
│   │   ├── axios.ts        # Configured axios instance (API client)
│   │   │                   # - Base URL configuration
│   │   │                   # - Request/response interceptors
│   │   │                   # - JWT token injection
│   │   ├── utils.ts        # Utility functions (cn, etc.)
│   │   └── auth.ts         # NextAuth configuration
│   │
│   ├── hooks/              # Custom React hooks
│   │   └── ...             # Reusable state/logic hooks
│   │
│   ├── providers/          # React context providers
│   │   └── ...             # App-level providers
│   │
│   ├── services/           # API service layer
│   │   ├── api.ts          # API client functions
│   │   │                   # - Jobs API calls
│   │   │                   # - Applications API calls
│   │   │                   # - Companies API calls
│   │   └── ...
│   │
│   └── types/              # TypeScript type definitions
│       ├── index.ts        # Shared types
│       ├── job.ts          # Job-related types
│       ├── application.ts  # Application-related types
│       └── ...
│
├── public/                 # Static assets
│   ├── images/
│   ├── icons/
│   └── ...
│
├── package.json            # NPM dependencies & scripts
├── pnpm-lock.yaml          # PNPM lock file
├── tsconfig.json           # TypeScript configuration
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.mjs      # PostCSS configuration
├── components.json         # shadcn/ui configuration
├── Dockerfile              # Production Docker image
└── README.md               # Frontend-specific docs
```

### Frontend Key Directories

| Directory | Purpose | Pattern |
|-----------|---------|---------|
| `src/app/(app)/` | Protected routes | Requires auth (NextAuth session) |
| `src/app/(auth)/` | Public auth routes | Login/register pages |
| `src/components/ui/` | shadcn/ui primitives | Reusable UI components |
| `src/components/` | Custom components | Navbar, Sidebar, Tables |
| `src/lib/` | Utilities & config | axios, auth, utils |
| `src/services/` | API client layer | Backend API calls |

---

## Integration Points

### Backend → Database
- **Connection:** PostgreSQL via sqlx
- **Migrations:** Auto-run on container startup
- **Port:** 5432 (internal Docker network)

### Frontend → Backend
- **Protocol:** REST API over HTTP
- **Base URL:** `http://localhost:8081/api`
- **Authentication:** JWT tokens (managed by NextAuth)
- **CORS:** Configured for ports 8080, 8082, 3000

### Frontend Internal
- **NextAuth:** `/api/auth/[...nextauth]` handles OAuth + credentials
- **API Client:** `lib/axios.ts` with interceptors for token injection
- **State Management:** React hooks + NextAuth session

---

## Critical Folders Summary

### Backend Entry Points
1. **`cmd/server/main.go`** - Application bootstrap
2. **`internal/routes/*.go`** - API route registration
3. **`migrations/*.sql`** - Database schema

### Frontend Entry Points
1. **`src/app/layout.tsx`** - Root layout (providers)
2. **`src/app/(app)/layout.tsx`** - Authenticated app layout
3. **`src/app/api/auth/[...nextauth]/route.ts`** - Auth config
4. **`src/lib/axios.ts`** - API client setup

---

## Development Workflow Directories

### Backend Testing
- `backend/internal/repository/*_test.go` - Repository unit tests
- `backend/test_api.sh` - API integration tests
- `backend/run_tests.sh` - Test runner script

### Frontend Development
- `frontend/src/app/(app)/design-system/` - Component showcase
- `frontend/src/components/ui/` - shadcn/ui components

---

## Docker & Deployment

```
ditto/
├── docker-compose.yml        # Dev environment (db + backend)
├── backend/
│   ├── Dockerfile.dev        # Backend dev container
│   └── docker-entrypoint.sh  # Migration runner
└── frontend/
    └── Dockerfile            # Frontend production build
```

**Services:**
- `db` - PostgreSQL 15 (port 5432)
- `backend` - Go API (port 8081)
- Frontend runs separately (port 8080 via npm)

---

## Notes

- **Soft Deletes:** All main tables have `deleted_at` column
- **Auto Timestamps:** Triggers update `created_at`/`updated_at`
- **User Scoping:** All jobs/applications filtered by `user_id`
- **shadcn/ui:** 15 components installed via CLI
- **Route Groups:** `(app)` = protected, `(auth)` = public
- **Migration Strategy:** golang-migrate with versioned SQL files
