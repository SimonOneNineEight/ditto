# Ditto - Project Documentation Index

**Generated:** 2025-11-08
**Project Type:** Multi-part (Backend + Frontend)
**Status:** Production Ready
**Purpose:** Job application tracking assistant

---

## 📋 Quick Reference

| Aspect | Details |
|--------|---------|
| **Repository Type** | Multi-part (separate client/server) |
| **Backend** | Go 1.23 + Gin + PostgreSQL |
| **Frontend** | Next.js 14 + React 18 + TypeScript |
| **Authentication** | JWT + NextAuth v5 (OAuth: GitHub, Google) |
| **Database** | PostgreSQL 15 (11 tables, soft deletes) |
| **API Endpoints** | 30+ RESTful endpoints |
| **UI Components** | 15 shadcn/ui components + Radix UI |
| **Deployment** | Docker Compose (development ready) |

---

## 🎯 Start Here

### For New Developers
1. **[Project Overview](#project-overview)** - Understand what Ditto does
2. **[Development Guide](./development-guide.md)** - Get your dev environment running
3. **[Architecture - Backend](./architecture-backend.md)** - Understand Go API structure
4. **[Architecture - Frontend](./architecture-frontend.md)** - Understand Next.js app structure

### For AI Agents / PRD Planning
1. **[This Index](#)** - Complete navigation
2. **[API Contracts](./api-contracts-backend.md)** - All backend endpoints
3. **[Database Schema](./database-schema.md)** - Complete data model
4. **[Integration Architecture](./integration-architecture.md)** - Frontend ↔ Backend communication

### For Brownfield Feature Planning
1. **[Backend Architecture](./architecture-backend.md)** - When adding API endpoints or backend logic
2. **[Frontend Architecture](./architecture-frontend.md)** - When adding UI features or components
3. **[Integration Architecture](./integration-architecture.md)** - When connecting frontend to backend
4. **[Source Tree](./source-tree-analysis.md)** - File organization reference

---

## 📂 Project Overview

### What is Ditto?

Ditto is a modern web application that simplifies job application tracking and management. Users can:

- Track job applications across multiple companies
- Manage interview schedules and feedback
- Monitor application status workflow
- Organize job postings with smart company selection
- Leverage external API enrichment for company data

### Technology Philosophy

- **Backend Migration:** Migrated from Rust → Go (100% complete, July 2025)
- **Production Ready:** Comprehensive testing, Docker ready
- **Modern Stack:** Latest stable versions (Go 1.23, Next.js 14, PostgreSQL 15)
- **Developer Experience:** Hot reload, comprehensive docs, automated setup

---

## 🏗️ Architecture Documentation

### [Backend Architecture](./architecture-backend.md)
**Go 1.23 + Gin + PostgreSQL**

Complete backend API documentation including:
- Layered architecture pattern (Handler → Repository → Database)
- JWT authentication with refresh tokens
- 30+ RESTful API endpoints
- Database design (11 tables with relationships)
- External API integration (Clearout for company data)
- Testing strategy (repository tests + integration tests)
- Deployment architecture

**Key Sections:**
- Technology Stack
- Architecture Pattern & Diagrams
- Project Structure
- Database Architecture
- API Design
- Authentication & Security
- Component Overview
- Error Handling
- Testing Strategy
- Performance Considerations
- Architectural Decisions

---

### [Frontend Architecture](./architecture-frontend.md)
**Next.js 14 + React 18 + TypeScript**

Complete frontend application documentation including:
- Next.js App Router architecture
- shadcn/ui component library (15 components)
- NextAuth v5 authentication
- State management strategies
- API client configuration
- Tailwind CSS theming

**Key Sections:**
- Technology Stack
- App Router Organization
- Component Architecture
- Authentication Flow
- State Management
- API Client Integration
- Styling Architecture
- Performance Optimizations
- Deployment Strategy

---

### [Integration Architecture](./integration-architecture.md)
**Frontend ↔ Backend Communication**

How the parts work together:
- REST API communication patterns
- Authentication flow (NextAuth + JWT)
- Token management (access + refresh)
- Data flow diagrams
- Error handling across layers
- CORS configuration
- Security considerations

**Key Sections:**
- Architecture Diagrams
- Data Flow Examples (Login, Protected API calls, Token refresh, OAuth)
- Integration Points
- API Response Standardization
- Environment Configuration
- Security Considerations
- Monitoring & Debugging

---

## 📊 Data & API Documentation

### [API Contracts - Backend](./api-contracts-backend.md)
**30+ RESTful Endpoints**

Complete API reference:

**Authentication (5 endpoints):**
- POST `/api/users` - Register
- POST `/api/login` - Login
- POST `/api/oauth` - OAuth login (GitHub, Google, LinkedIn)
- POST `/api/refresh_token` - Refresh JWT
- GET `/api/me` - Get user profile
- POST `/api/logout` - Logout

**Companies (8 endpoints):**
- GET `/api/companies` - List all
- GET `/api/companies/:id` - Get by ID
- GET `/api/companies/search` - Search by name
- GET `/api/companies/autocomplete` - Smart autocomplete
- POST `/api/companies` - Create
- POST `/api/companies/select` - Select or create with enrichment
- PUT `/api/companies/:id` - Update
- DELETE `/api/companies/:id` - Soft delete

**Jobs (7 endpoints):**
- GET `/api/jobs` - List user's jobs
- GET `/api/jobs/with-details` - Jobs with company info
- GET `/api/jobs/:id` - Get by ID
- POST `/api/jobs` - Create
- PUT `/api/jobs/:id` - Full update
- PATCH `/api/jobs/:id` - Partial update
- DELETE `/api/jobs/:id` - Soft delete

**Applications (10 endpoints):**
- GET `/api/applications` - List with filters
- GET `/api/applications/with-details` - With job/company info
- GET `/api/applications/:id` - Get by ID
- GET `/api/applications/stats` - Statistics by status
- GET `/api/applications/recent` - Recent applications
- POST `/api/applications` - Create
- PUT `/api/applications/:id` - Update
- PATCH `/api/applications/:id/status` - Update status only
- DELETE `/api/applications/:id` - Soft delete
- GET `/api/application-statuses` - Get all statuses

---

### [Database Schema](./database-schema.md)
**11 Tables with Full Relationships**

Complete data model documentation:

**Core Tables:**
- `users` - User accounts (soft deletes)
- `users_auth` - OAuth + password authentication
- `companies` - Job posting companies
- `jobs` - Job listings
- `applications` - Application tracking
- `interviews` - Interview records
- `skills` / `skill_categories` - Skill management

**Junction Tables:**
- `user_roles` - User permissions
- `user_jobs` - User's tracked jobs
- `job_skills` - Job skill requirements
- `user_skills` - User skill profiles

**Database Features:**
- Soft deletes (`deleted_at` column)
- Auto-timestamps (triggers)
- Foreign key constraints with cascade rules
- Performance indexes (17 total)
- Case-insensitive search indexes

**Entity Relationship Diagram** included.

---

## 🗂️ Project Structure

### [Source Tree Analysis](./source-tree-analysis.md)
**Annotated Directory Structure**

Complete file organization with annotations:

**Backend Structure:**
```
backend/
├── cmd/server/          # Application entry point
├── internal/            # Private application code
│   ├── handlers/       # HTTP request handlers
│   ├── repository/     # Database access layer
│   ├── middleware/     # Auth & error middleware
│   ├── models/         # Data structures
│   └── routes/         # Route registration
├── migrations/         # Database schema versioning
└── pkg/                # Shared packages
```

**Frontend Structure:**
```
frontend/
└── src/
    ├── app/            # Next.js App Router
    │   ├── (app)/     # Protected routes
    │   ├── (auth)/    # Public auth routes
    │   └── api/       # API routes (NextAuth)
    ├── components/     # Reusable components
    │   └── ui/        # shadcn/ui components
    ├── lib/           # Utilities (axios, auth)
    ├── services/      # API client layer
    └── types/         # TypeScript definitions
```

**Entry Points:**
- Backend: `cmd/server/main.go:23`
- Frontend: `src/app/layout.tsx`, `src/app/(app)/layout.tsx`

---

## 🛠️ Development & Deployment

### [Development Guide](./development-guide.md)
**Setup, Testing, Workflow**

Complete development documentation:

**Quick Start:**
- Prerequisites (Docker, Go, Node.js)
- Docker Compose setup (recommended)
- Manual setup (without Docker)
- Environment variables

**Development Workflow:**
- Backend: Hot reload with Air, code quality tools
- Frontend: Dev server, ESLint, Prettier, type checking
- Database: Migrations, backups, access

**Testing:**
- Backend unit tests (repository layer)
- Backend integration tests (`test_api.sh`)
- Frontend tests
- Test database setup

**Common Issues & Troubleshooting**

---

### [Deployment Guide](./deployment-guide.md)
**Docker, Production, Scaling**

Complete deployment documentation:

**Docker Deployment:**
- Docker Compose configuration
- Production Dockerfiles
- Environment variables
- Database setup (managed vs self-hosted)

**Deployment Platforms:**
- VPS with Docker Compose
- Kubernetes
- Cloud platforms (AWS, GCP, Azure)

**Production Considerations:**
- Nginx reverse proxy configuration
- Security checklist
- Monitoring & logging
- Backup strategy
- Scaling considerations

**CI/CD Pipeline Examples**

---

## 🔍 Additional Resources

### Existing Documentation

**Root README:**
- [README.md](../README.md) - Comprehensive project overview
  - Features (implemented & planned)
  - Tech stack summary
  - Quick start guide
  - API usage examples
  - Contributing guidelines

**Backend README:**
- [backend/README.md](../backend/README.md) - Backend-specific docs
  - API documentation table
  - Request/response examples
  - Development commands
  - Tech stack details

**Frontend README:**
- [frontend/README.md](../frontend/README.md) - Basic Next.js info
  - Getting started
  - Next.js documentation links

---

## 📦 Component Inventory

### shadcn/ui Components (15 total)

| Component | Location | Purpose |
|-----------|----------|---------|
| accordion | `src/components/ui/accordion.tsx` | Collapsible content sections |
| avatar | `src/components/ui/avatar.tsx` | User profile images |
| badge | `src/components/ui/badge.tsx` | Status indicators |
| button | `src/components/ui/button.tsx` | Interactive buttons |
| card | `src/components/ui/card.tsx` | Content containers |
| collapsible | `src/components/ui/collapsible.tsx` | Expandable sections |
| dialog | `src/components/ui/dialog.tsx` | Modal dialogs |
| dropdown-menu | `src/components/ui/dropdown-menu.tsx` | Action menus |
| input | `src/components/ui/input.tsx` | Form inputs |
| separator | `src/components/ui/separator.tsx` | Visual dividers |
| sidebar | `src/components/ui/sidebar.tsx` | Navigation sidebar |
| table | `src/components/ui/table.tsx` | Data tables |
| tooltip | `src/components/ui/tooltip.tsx` | Hover tooltips |
| ... | ... | ... |

### Custom Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Navbar | `src/components/Navbar/` | Top navigation bar |
| Sidebar | `src/components/Sidebar/` | App navigation sidebar |
| JobTable | `src/components/job-table/` | Job listings table |
| ApplicationTable | `src/app/(app)/applications/application-table/` | Applications table |
| InterviewTable | `src/app/(app)/interviews/interview-table/` | Interviews table |

---

## 🚀 Quick Navigation by Task

### Adding a New Backend Feature

1. **Define Model:** `internal/models/new_model.go`
2. **Create Repository:** `internal/repository/new_repository.go`
3. **Write Tests:** `internal/repository/new_repository_test.go`
4. **Create Handler:** `internal/handlers/new_handler.go`
5. **Register Routes:** `internal/routes/new_routes.go`
6. **Update Docs:** This index + `api-contracts-backend.md`

**Reference Files:**
- **API Design:** `api-contracts-backend.md`
- **Database Changes:** `database-schema.md` + create migration
- **Architecture Pattern:** `architecture-backend.md`

---

### Adding a New Frontend Feature

1. **Create Route/Page:** `src/app/(app)/feature/page.tsx`
2. **Create Components:** `src/components/feature/`
3. **Add API Service:** `src/services/featureService.ts`
4. **Define Types:** `src/types/feature.ts`
5. **Update Navigation:** Sidebar, Navbar as needed

**Reference Files:**
- **Component Patterns:** `architecture-frontend.md`
- **API Integration:** `integration-architecture.md`
- **UI Components:** shadcn/ui docs or `src/components/ui/`

---

### Modifying Authentication

1. **Backend:** `internal/handlers/auth.go`, `internal/middleware/auth.go`
2. **Frontend:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
3. **Integration:** Review `integration-architecture.md`

---

### Database Changes

1. **Create Migration:** `migrate create -ext sql -dir backend/migrations -seq description`
2. **Write SQL:** Edit `.up.sql` and `.down.sql`
3. **Update Models:** `internal/models/*.go`
4. **Update Repository:** `internal/repository/*.go`
5. **Update Docs:** `database-schema.md`

**Test Migration:**
```bash
migrate -path backend/migrations -database $DATABASE_URL up
```

---

## 📝 Documentation Standards

### File Naming

- **Architecture Docs:** `architecture-{part}.md`
- **Part-specific Docs:** `{feature}-{part}.md`
- **Integration Docs:** `integration-{topic}.md`
- **Guides:** `{purpose}-guide.md`

### Markdown Format

- Use GitHub-flavored Markdown
- Include tables for structured data
- Add code blocks with language tags
- Use diagrams (ASCII art or Mermaid)
- Include "Last Updated" date

### Cross-References

- Link to related documents
- Reference specific file locations with line numbers
- Provide "See also" sections

---

## 🔧 Workflow Status

This documentation was generated by the **BMad Method** brownfield documentation workflow:

- **Phase:** Prerequisites (Brownfield Documentation)
- **Status File:** `docs/bmm-workflow-status.yaml`
- **Next Step:** Product Brief → PRD → Architecture (for new features)

**To continue with BMad workflow:**
```bash
# Check workflow status
/workflow-status

# Next recommended step
# Use analyst agent for product brief or PM agent for PRD
```

---

## 📞 Support & Maintenance

### Getting Help

- **Documentation Issues:** Review this index, follow links
- **Development Setup:** See `development-guide.md`
- **Architecture Questions:** See part-specific architecture docs
- **API Questions:** See `api-contracts-backend.md`

### Contributing

See root [README.md](../README.md#contributing) for:
- Development guidelines
- PR process
- Code style conventions
- Testing requirements

---

## 🗺️ Document Map

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **index.md** (this file) | Navigation hub | Start here, find other docs |
| **architecture-backend.md** | Go API architecture | Backend development, API features |
| **architecture-frontend.md** | Next.js app architecture | Frontend development, UI features |
| **integration-architecture.md** | Frontend ↔ Backend | Full-stack features, auth changes |
| **api-contracts-backend.md** | API endpoint reference | Calling APIs, adding endpoints |
| **database-schema.md** | Data model reference | Database changes, understanding data |
| **source-tree-analysis.md** | File organization | Finding files, understanding structure |
| **development-guide.md** | Setup & workflow | First-time setup, daily development |
| **deployment-guide.md** | Production deployment | Deploying, scaling, ops |

---

## ✅ Documentation Completeness

### Generated Files (9)

- [x] index.md (this file)
- [x] architecture-backend.md
- [x] architecture-frontend.md
- [x] integration-architecture.md
- [x] api-contracts-backend.md
- [x] database-schema.md
- [x] source-tree-analysis.md
- [x] development-guide.md
- [x] deployment-guide.md

### Existing Files (3)

- [x] ../README.md (project root)
- [x] ../backend/README.md
- [x] ../frontend/README.md

### Coverage

- **Backend:** 100% (API, database, architecture, deployment)
- **Frontend:** 100% (components, routing, auth, architecture)
- **Integration:** 100% (API communication, auth flow, CORS)
- **Development:** 100% (setup, testing, workflow)
- **Deployment:** 100% (Docker, production, scaling)

---

**Last Updated:** 2025-11-08
**Documentation Version:** 1.0 (Initial Complete Set)
**Generated By:** BMad Method - Document Project Workflow

---

**Next Steps for Development:**

1. **Brownfield PRD:** Use this documentation as reference when planning new features
2. **Feature Development:** Follow architecture patterns documented here
3. **Onboarding:** New developers start with this index → development guide → architecture docs

**This documentation set provides complete reference for AI-assisted brownfield development.**
