# Story 6.10: Documentation - API, Database Schema, and Setup

Status: review

## Story

As a developer or future contributor,
I want clear, up-to-date documentation for the codebase,
so that I can understand how to set up, use, and extend ditto.

## Acceptance Criteria

1. **Root README with project overview and setup** — A root-level `README.md` includes: project overview, tech stack summary (Go 1.23+/Gin, Next.js 14/React 18, PostgreSQL 15, AWS S3), local dev setup instructions (backend + frontend + database), required environment variables with descriptions, and how to run tests (`go test ./...` and `pnpm test`) (NFR-5.2)
2. **API endpoints documented with request/response schemas** — `docs/api-contracts-backend.md` is updated to reflect the current state of all API endpoints (auth, applications, interviews, assessments, files, timeline, dashboard, notifications, search, export) with HTTP method, path, auth requirements, request body schema, response schema, and error codes
3. **Database schema documented with current tables** — `docs/database-schema.md` is updated to include all current tables: original schema tables plus interviews, interviewers, interview_questions, interview_notes, assessments, assessment_submissions, files, notifications, user_notification_preferences, and all FTS/performance indexes added through Epics 1-6
4. **Setup instructions enable <30 minute onboarding** — Documentation provides step-by-step instructions covering: prerequisites (Go, Node.js, PostgreSQL, pnpm, AWS credentials), cloning, dependency installation, environment configuration, database migration, seeding (if applicable), starting backend (port 8081) and frontend (port 8080), and verification that the app is running
5. **All documentation lives in `/docs` folder** — API docs, database schema, architecture docs, and setup guide are located in the `/docs` folder; root README links to detailed docs in `/docs`

## Tasks / Subtasks

- [x] Task 1: Create root-level README.md (AC: 1, 4, 5)
  - [x] 1.1 Write project overview section (what ditto is, key features: application tracking, interview management, assessment tracking, dashboard/timeline, search/export)
  - [x] 1.2 Write tech stack summary table (backend, frontend, database, storage, testing)
  - [x] 1.3 Write prerequisites section (Go 1.23+, Node.js 18+, PostgreSQL 15+, pnpm, AWS S3 credentials)
  - [x] 1.4 Write quick start / local development setup instructions (backend on 8081, frontend on 8080)
  - [x] 1.5 Write environment variables section with descriptions for both backend and frontend `.env` files
  - [x] 1.6 Write "Running Tests" section (`go test ./...` for backend, `pnpm test` for frontend)
  - [x] 1.7 Add links to detailed documentation in `/docs` folder
  - [x] 1.8 Verify a new developer can follow instructions and run the project (walkthrough test)

- [x] Task 2: Update API endpoint documentation (AC: 2, 5)
  - [x] 2.1 Audit current `docs/api-contracts-backend.md` against actual codebase routes
  - [x] 2.2 Document all auth endpoints (register, login, logout, refresh, OAuth, getMe, deleteAccount)
  - [x] 2.3 Document application endpoints (CRUD, quick-create, status update, stats, recent, statuses)
  - [x] 2.4 Document interview endpoints (CRUD, with-details, interviewers, questions, notes)
  - [x] 2.5 Document assessment endpoints (CRUD, status update, submissions with file/github/notes)
  - [x] 2.6 Document file endpoints (presigned URL, confirm upload, get, delete, storage stats)
  - [x] 2.7 Document timeline, dashboard, notification, search, and export endpoints
  - [x] 2.8 Include request/response JSON schemas and error response codes for each endpoint

- [x] Task 3: Update database schema documentation (AC: 3, 5)
  - [x] 3.1 Audit current `docs/database-schema.md` against actual migration files
  - [x] 3.2 Add all tables introduced in Epics 2-5 (interviews, interviewers, interview_questions, interview_notes, assessments, assessment_submissions, files, notifications, user_notification_preferences)
  - [x] 3.3 Document self-assessment fields added to interviews table (overall_feeling, went_well, could_improve, confidence_level)
  - [x] 3.4 Document FTS infrastructure (search_vector columns, GIN indexes, tsvector triggers)
  - [x] 3.5 Document performance indexes added in Epic 6 (composite indexes on user_id+status, user_id+date, etc.)
  - [x] 3.6 Update entity relationship diagram to include all current tables
  - [x] 3.7 Document migration history (all migrations from 000001 through current)

- [x] Task 4: Validate and cross-reference documentation (AC: 4, 5)
  - [x] 4.1 Verify all environment variable names match actual `.env` files and code references
  - [x] 4.2 Verify API endpoint paths match actual route registrations in Go code
  - [x] 4.3 Verify database table/column names match actual migration SQL
  - [x] 4.4 Ensure root README links to `docs/architecture.md`, `docs/api-contracts-backend.md`, `docs/database-schema.md`, and other relevant docs
  - [x] 4.5 Confirm `pnpm` is documented as the package manager (not npm)

## Dev Notes

### Architecture Alignment

- **Existing Documentation**: The `docs/` folder already contains extensive documentation from the BMAD workflow: `architecture.md`, `architecture-backend.md`, `architecture-frontend.md`, `database-schema.md`, `api-contracts-backend.md`, `deployment-guide.md`, `development-guide.md`, `design-system-principles.md`. Much of this was generated pre-implementation and may be outdated relative to the current codebase state after 6 epics of development. [Source: docs/architecture.md]
- **No Root README**: The project lacks a root-level `README.md`. There are `backend/README.md` and `frontend/README.md` but no top-level entry point for new developers. [Source: project root]
- **Database Schema Gap**: `docs/database-schema.md` was generated on 2025-11-08 (before Epics 2-6 implementation). It only documents the original schema tables (users, users_auth, companies, jobs, applications, interviews, roles, skills, etc.) and does not include the 9+ new tables added through migrations 000003-000011+. [Source: docs/database-schema.md]
- **API Contracts**: `docs/api-contracts-backend.md` exists and may partially cover early endpoints, but needs updating to reflect 30+ new endpoints added across Epics 1-5 (interviews, assessments, files, timeline, dashboard, notifications, search, export). [Source: docs/api-contracts-backend.md]
- **Port Configuration**: Backend runs on port 8081, frontend runs on port 8080. Docker Compose and manual setup instructions must reflect these actual ports (some existing docs reference outdated port numbers). [Source: CLAUDE.md]
- **Package Manager**: Frontend uses `pnpm`, not `npm`. All documentation must use `pnpm` commands. [Source: CLAUDE.md, bmad/bmm/config.yaml]
- **Testing Commands**: Backend tests: `go test ./...` (use `-p 1` for handler tests to avoid PG concurrency issues). Frontend tests: `pnpm test` (runs Jest with 122 tests across 13 suites). [Source: stories/6-9-testing-infrastructure-unit-and-integration-tests.md]

### Implementation Approach

This is a documentation-only story. No application code changes are expected. The approach is:
1. **Audit existing docs** against actual codebase (routes, migrations, env vars)
2. **Create root README** as the primary entry point
3. **Update outdated docs** (database-schema.md, api-contracts-backend.md) to reflect current state
4. **Cross-reference** all documentation for consistency

**Source of Truth Priority:**
- Actual codebase (Go route registrations, migration SQL files) > existing documentation
- When docs contradict code, update docs to match code

### Project Structure Notes

- Root README should be at `/README.md` (project root)
- All detailed docs remain in `/docs/` folder
- API docs: `docs/api-contracts-backend.md`
- Database docs: `docs/database-schema.md`
- Architecture docs: `docs/architecture.md`, `docs/architecture-backend.md`, `docs/architecture-frontend.md`
- Setup/dev docs: `docs/development-guide.md`, `docs/deployment-guide.md`
- No new directories or services needed

### Learnings from Previous Story

**From Story 6-9-testing-infrastructure-unit-and-integration-tests (Status: done)**

- **Testing Infrastructure Complete**: Backend has 188+ repo tests (72% coverage) and 152+ handler tests. Frontend has 122 tests across 13 suites (Jest + RTL). Commands: `go test ./...` (backend), `pnpm test` (frontend). Document these in README.
- **Pre-existing Test Failures**: `TestRateLimitRepository_*` (DB auth issue) and `TestFileHandler_ConfirmUpload` (no S3 mock in test env) are known failures — document as known issues or exclude from "all tests should pass" claim.
- **PostgreSQL Concurrency**: Handler tests and repo tests must run with `go test -p 1` when both packages tested together — document this caveat.
- **Frontend Test Setup**: Jest configured with `@swc/jest` (automatic JSX runtime), `@/` path alias, CSS/asset mocks. RTL component tests colocated with components.
- **Test Dependencies**: Backend uses `testify` v1.10.0. Frontend devDependencies: jest, jest-environment-jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @swc/jest, @types/jest.
- **Review Finding**: Story File List paths in 6.9 were incorrect for RTL test locations — ensure documentation paths are verified against actual filesystem.

[Source: stories/6-9-testing-infrastructure-unit-and-integration-tests.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-6.md#Story 6.10] — Authoritative acceptance criteria for documentation
- [Source: docs/epics.md#Story 6.10] — Original story definition with technical notes
- [Source: docs/architecture.md] — Main architecture document (may need updates)
- [Source: docs/architecture-backend.md] — Backend architecture reference
- [Source: docs/architecture-frontend.md] — Frontend architecture reference
- [Source: docs/database-schema.md] — Current database schema doc (pre-Epic 2, needs update)
- [Source: docs/api-contracts-backend.md] — Current API contracts doc (needs update)
- [Source: docs/development-guide.md] — Existing development setup guide
- [Source: docs/deployment-guide.md] — Existing deployment guide
- [Source: CLAUDE.md] — Project conventions (ports, package manager, test credentials)
- [Source: stories/6-9-testing-infrastructure-unit-and-integration-tests.md] — Previous story with testing infrastructure details

## Dev Agent Record

### Context Reference

- docs/stories/6-10-documentation-api-database-schema-and-setup.context.xml

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Audited existing README.md: found npm references, outdated Go/PostgreSQL versions, missing features from Epics 2-6, "Coming Soon" section for already-implemented features
- Read all 16 route files, 10 handler files, 13 migration files, response/error packages for source-of-truth data
- Cross-referenced env vars in code (os.Getenv calls) against .env files and README documentation
- Verified all 7 doc links in README point to existing files in /docs/

### Completion Notes List

- **README.md**: Rewrote from scratch with accurate project overview (7 features), tech stack table, prerequisites (Go 1.23+, Node.js 18+, PostgreSQL 15+, pnpm, golang-migrate, S3), 6-step quickstart guide, full env var documentation for both backend and frontend, test commands with -p 1 caveat, project structure tree, and links to 7 docs in /docs folder. All pnpm, zero npm references.
- **docs/api-contracts-backend.md**: Complete rewrite documenting 82 endpoints across 16 domains. Each endpoint includes HTTP method, path, auth requirements, request body schema (with types/validation), response schema (with JSON examples), query parameters, and error codes. Documented the ApiResponse envelope, all 18 error codes with HTTP status mappings, and rate limits (auth IP-based, file upload 50/day, extract 30/day).
- **docs/database-schema.md**: Complete rewrite documenting all 20+ tables from 13 migrations. Includes rate_limits, files, interviewers, interview_questions, interview_notes, assessments, assessment_submissions, notifications, user_notification_preferences. Documented self-assessment fields, FTS infrastructure (4 tsvector columns with GIN indexes and triggers), performance indexes (6 composite indexes from migration 000013), entity relationship diagram, and full migration history.
- **Validation**: Cross-referenced all env vars against code, all API paths against route registrations, all table/column names against migration SQL. Confirmed pnpm usage throughout and verified all README doc links.

### File List

- README.md (modified) — Rewrote root README with accurate project documentation
- docs/api-contracts-backend.md (modified) — Complete API reference for 82 endpoints
- docs/database-schema.md (modified) — Complete schema documentation for all tables from 13 migrations
- docs/sprint-status.yaml (modified) — Story status: ready-for-dev → in-progress → review
- docs/stories/6-10-documentation-api-database-schema-and-setup.md (modified) — Story task checkboxes, dev agent record, file list, change log

## Change Log

- 2026-02-20: Story drafted from tech-spec-epic-6.md, epics.md, architecture docs, database-schema.md, api-contracts-backend.md, and previous story 6-9 learnings
- 2026-02-20: Implementation complete — rewrote README.md, api-contracts-backend.md, and database-schema.md from source-of-truth codebase analysis
