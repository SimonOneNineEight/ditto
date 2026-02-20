# Ditto Backend Architecture

**Updated:** 2026-02-20
**Framework:** Go 1.24.0 (toolchain 1.24.4) + Gin 1.10.1
**Database:** PostgreSQL 15
**Status:** Production Ready

---

## Executive Summary

The Ditto backend is a Go REST API built with the Gin framework, serving as the data and business logic layer for a job application tracking system. It implements a layered architecture (Handler -> Repository -> Database) with JWT authentication, CSRF protection, rate limiting, file management via S3, job URL extraction with platform-specific parsers, a notification scheduler, full-text search, and data export.

**Key metrics:**
- 82 API endpoints across 16 route groups
- 23 database tables with 13 migrations
- 18 handler files, 17 repository files, 10 model files
- 7 middleware components
- 20 structured error codes

---

## Technology Stack

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| Language | Go | 1.24.0 | Primary language |
| Framework | gin-gonic/gin | 1.10.1 | HTTP router and middleware |
| Database | PostgreSQL | 15 | Primary data store |
| SQL Toolkit | jmoiron/sqlx | 1.4.0 | Named queries, struct scanning |
| Migrations | golang-migrate/v4 | 4.18.3 | Schema versioning (13 migrations) |
| JWT | golang-jwt/jwt/v5 | 5.2.2 | Token generation and validation |
| Validation | go-playground/validator/v10 | 10.26.0 | Struct tag-based input validation |
| Sanitization | microcosm-cc/bluemonday | 1.0.27 | HTML sanitization |
| HTML Parsing | PuerkitoBio/goquery | 1.11.0 | Job URL extraction DOM parsing |
| S3 | aws-sdk-go-v2 | 1.41.0 | File storage (presigned uploads) |
| UUID | google/uuid | 1.6.0 | ID generation |
| Env | joho/godotenv | 1.5.1 | Environment variable loading |
| Compression | gin-contrib/gzip | 1.2.3 | Response compression |
| CORS | gin-contrib/cors | 1.7.6 | Cross-origin configuration |
| Password | golang.org/x/crypto | - | bcrypt hashing |
| Testing | stretchr/testify | 1.10.0 | Assertions and test suites |
| Postgres Driver | lib/pq | 1.10.9 | PostgreSQL driver |

---

## Architecture Pattern

**Layered Architecture:** Request -> Middleware -> Handler -> Repository -> Database

```
+------------------------------------------+
|          HTTP Request (Client)           |
+-------------------+----------------------+
                    |
+-------------------v----------------------+
|           Middleware Layer                |
|  SecurityHeaders -> Gzip ->              |
|  SlowRequestLogger -> CORS ->            |
|  ErrorHandler                            |
|  (per-route: Auth, CSRF, RateLimit)      |
+-------------------+----------------------+
                    |
+-------------------v----------------------+
|           Handler Layer                  |
|  (internal/handlers/)                    |
|  Parse request, validate input,          |
|  call repository, format response        |
+-------------------+----------------------+
                    |
+-------------------v----------------------+
|          Repository Layer                |
|  (internal/repository/)                  |
|  SQL queries via sqlx, transactions,     |
|  data mapping                            |
+-------------------+----------------------+
                    |
+-------------------v----------------------+
|        PostgreSQL Database               |
|  23 tables, triggers, GIN indexes,       |
|  full-text search vectors                |
+------------------------------------------+
```

---

## Project Structure

```
backend/
|-- cmd/server/
|   +-- main.go                          # Entry point: middleware, routes, scheduler
|
|-- internal/
|   |-- auth/                            # JWT and password utilities
|   |   |-- jwt.go                       # Token generation/validation (24h access, 7d refresh)
|   |   +-- hashing.go                   # bcrypt password hashing
|   |
|   |-- handlers/                        # HTTP request handlers (18 files)
|   |   |-- application.go              assessment.go       auth.go
|   |   |-- company.go                  dashboard_handler.go export.go
|   |   |-- extract.go                  file.go             helpers.go
|   |   |-- interview.go               interview_note.go   interview_question.go
|   |   |-- interviewer.go             job.go              notification_handler.go
|   |   |-- search_handler.go          timeline_handler.go user.go
|   |   +-- *_test.go (7 test files)
|   |
|   |-- middleware/                      # Request pipeline (7 files)
|   |   |-- auth.go                     # JWT validation, extracts user_id
|   |   |-- csrf.go                     # CSRF token generation/validation
|   |   |-- error.go                    # Global error handler with categorized logging
|   |   |-- rate_limit.go              # IP-based and user-based rate limiting
|   |   |-- security_headers.go        # CSP, HSTS, X-Frame-Options
|   |   +-- slow_request.go            # Logs requests >500ms
|   |
|   |-- models/                          # Data structures (10 files)
|   |   |-- application.go  assessment.go  company.go  file.go  interview.go
|   |   +-- job.go  notification.go  rate_limit.go  search.go  user.go
|   |
|   |-- repository/                      # Database access (17 files)
|   |   |-- application.go             assessment.go          assessment_submission.go
|   |   |-- companies.go               dashboard_repository.go file.go
|   |   |-- interview.go               interview_note.go      interview_question.go
|   |   |-- interviewer.go             job.go                 notification_preferences_repository.go
|   |   |-- notification_repository.go  rate_limit.go         search_repository.go
|   |   |-- timeline_repository.go     user.go
|   |   +-- *_test.go (test files for most repositories)
|   |
|   |-- routes/                          # Route registration (16 files)
|   |   |-- application.go  assessment.go  auth.go        company.go
|   |   |-- dashboard.go    export.go      extract.go     file.go
|   |   |-- interview.go    interview_note.go  interview_question.go  interviewer.go
|   |   +-- job.go          notification.go    search.go    timeline.go
|   |
|   |-- services/                        # Business logic services
|   |   |-- notification_scheduler.go   # Background job, 15-minute interval
|   |   |-- notification_service.go     # Notification creation logic
|   |   |-- sanitizer_service.go        # HTML input sanitization (+ test)
|   |   |-- s3/
|   |   |   +-- service.go              # S3 presigned URL generation (+ test)
|   |   +-- urlextractor/               # Job URL extraction package
|   |       |-- extractor.go            # Main extraction orchestrator (+ test)
|   |       |-- models.go               # Extracted job data structures
|   |       |-- parser.go               # Parser interface and registry
|   |       |-- sanitize.go             # Input sanitization (+ test)
|   |       |-- parser_linkedin.go      # LinkedIn parser (+ test)
|   |       |-- parser_indeed.go        # Indeed parser (+ test)
|   |       |-- parser_glassdoor.go     # Glassdoor parser
|   |       |-- parser_angellist.go     # AngelList parser
|   |       +-- parser_generic.go       # Generic fallback parser (+ test)
|   |
|   |-- testutil/                        # Test infrastructure
|   |   |-- database.go                 # SetupTestDB, TeardownTestDB
|   |   +-- fixtures.go                 # CreateTestUser, CreateTestCompany, etc.
|   |
|   +-- utils/
|       +-- state.go                     # AppState (DB connection, sanitizer)
|
|-- migrations/                          # 13 migration pairs (.up.sql / .down.sql)
|   |-- 000001_initial_schema
|   |-- 000002_add_users_auth_user_id_unique
|   |-- 000003_create_rate_limits
|   |-- 000004_create_file_system
|   |-- 000005_add_job_source_fields
|   |-- 000006_fix_application_status_unique
|   |-- 000007_create_interview_system
|   |-- 000008_add_interviewers_updated_at
|   |-- 000009_create_assessment_system
|   |-- 000010_update_assessment_status_reviewed_to_passed_failed
|   |-- 000011_create_notification_system
|   |-- 000012_add_search_vectors
|   +-- 000013_add_performance_indexes
|
+-- pkg/                                 # Shared packages
    |-- database/
    |   |-- connection.go               # PostgreSQL connection via sqlx
    |   +-- migrations.go               # golang-migrate runner
    |-- errors/
    |   |-- errors.go                   # AppError type, 20 error codes
    |   +-- convert.go                  # Converts DB/validation errors to AppError
    +-- response/
        +-- response.go                 # ApiResponse, ErrorDetail, helper functions
```

---

## Database Architecture

### Schema Overview

**Total Tables:** 23
**Migrations:** 13
**Features:** Soft deletes, auto-timestamps via triggers, full-text search vectors with GIN indexes, event trigger for automatic timestamp triggers on new tables

### Table Inventory

**Core entities (migration 000001):**

| Table | Purpose |
|-------|---------|
| `users` | User accounts (soft delete) |
| `users_auth` | OAuth + password authentication, refresh tokens |
| `roles` | Permission definitions |
| `user_roles` | User-role junction |
| `companies` | Company profiles with enrichment tracking |
| `jobs` | Job listings |
| `user_jobs` | User-job ownership junction |
| `applications` | Job applications (soft delete) |
| `application_status` | Workflow states (Applied, Interview, etc.) |
| `interviews` | Interview records (soft delete) |
| `skills` | Skill taxonomy |
| `skill_categories` | Skill grouping |
| `job_skills` | Job-skill junction |
| `user_skills` | User skill profile with proficiency |

**Added by subsequent migrations:**

| Table | Migration | Purpose |
|-------|-----------|---------|
| `rate_limits` | 000003 | Per-user rate limit tracking by resource |
| `files` | 000004 | S3 file metadata (soft delete) |
| `interviewers` | 000007 | Interview panel members |
| `interview_questions` | 000007 | Interview Q&A with ordering |
| `interview_notes` | 000007 | Typed notes per interview (unique per type) |
| `assessments` | 000009 | Take-home assignments and assessments |
| `assessment_submissions` | 000009 | Submission records (GitHub URLs, files) |
| `notifications` | 000011 | User notifications with read tracking |
| `user_notification_preferences` | 000011 | Per-user notification settings |

### Data Model Highlights

**User Authentication:**
- Hybrid model: OAuth (`users_auth.auth_provider`) + credentials (`users_auth.password_hash`)
- Supports GitHub, Google, LinkedIn OAuth
- Unique constraint on `users_auth.user_id`
- Refresh token stored in `users_auth.refresh_token` with expiry

**Soft Deletes:**
- Tables: `users`, `companies`, `jobs`, `applications`, `interviews`, `files`, `interviewers`, `interview_questions`, `interview_notes`, `assessments`, `assessment_submissions`
- Pattern: `deleted_at` timestamp (NULL = active)
- Partial indexes filter on `WHERE deleted_at IS NULL` for query performance

**Automatic Timestamps:**
- All tables have `created_at`, `updated_at`
- Database trigger function `update_timestamp()` auto-updates on UPDATE
- Event trigger `add_timestamp_trigger_event` auto-adds timestamp triggers to new tables
- Cascading trigger updates parent `jobs` when `user_jobs` changes

**Full-Text Search (migration 000012):**
- `tsvector` columns on `applications`, `interview_notes`, `interview_questions`, `assessments`
- GIN indexes for fast search
- Weighted search: question text (A) > answer text (B), assessment title (A) > instructions (B)
- Auto-update triggers maintain search vectors on INSERT/UPDATE

---

## API Design

### Endpoint Summary (82 total)

| Route Group | Path Prefix | Endpoints | Auth | CSRF |
|-------------|-------------|-----------|------|------|
| Applications | `/applications` | 12 | Yes (mixed) | Yes |
| Assessments | `/assessments` | 8 | Yes | Yes |
| Assessment Submissions | `/assessment-submissions` | 1 | Yes | Yes |
| Auth | mixed paths | 7 | Mixed | Mixed |
| Companies | `/companies` | 8 | Mixed | Mixed |
| Dashboard | `/dashboard` | 2 | Yes | Yes |
| Export | `/export` | 3 | Yes | Yes |
| Extract | `/extract-job-url` | 1 | Yes | Yes |
| Files | `/files` | 7 | Yes | Yes |
| User File/Storage | `/users` | 2 | Yes | No |
| User Notifications | `/users` | 2 | Yes | Yes |
| Interviews | `/interviews` | 7 | Yes | Yes |
| Interview Notes | `/interviews/:id/notes` | 1 | Yes | Yes |
| Interview Questions | `/interviews` + `/interview-questions` | 4 | Yes | Yes |
| Interviewers | `/interviews` + `/interviewers` | 3 | Yes | Yes |
| Jobs | `/jobs` | 7 | Yes | Yes |
| Notifications | `/notifications` | 4 | Yes | Yes |
| Search | `/search` | 1 | Yes | Yes |
| Timeline | `/timeline` | 1 | Yes | Yes |
| Health | `/health` | 1 | No | No |

### Route Details

**Applications** [Auth + CSRF]:
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `GET /api/applications/with-details` - List with joined job/company data
- `GET /api/applications/stats` - Application statistics
- `GET /api/applications/recent` - Recent applications
- `GET /api/applications/:id` - Get single application
- `GET /api/applications/:id/with-details` - Get with joined data
- `PUT /api/applications/:id` - Update application
- `PATCH /api/applications/:id/status` - Update status only
- `DELETE /api/applications/:id` - Soft delete
- `POST /api/applications/quick-create` - Create with minimal input
- `GET /api/application-statuses` - List statuses (public)

**Auth** [Rate Limited for public, Auth+CSRF for protected]:
- `POST /api/users` - Register (rate limited)
- `POST /api/login` - Login (rate limited)
- `POST /api/refresh_token` - Refresh JWT (rate limited)
- `POST /api/oauth` - OAuth login (rate limited)
- `POST /api/logout` - Logout (authenticated)
- `GET /api/me` - Get current user (authenticated)
- `DELETE /api/users/account` - Delete account (authenticated)

**Interviews** [Auth + CSRF]:
- `POST /api/interviews` - Create interview
- `GET /api/interviews` - List interviews
- `GET /api/interviews/:id` - Get interview
- `GET /api/interviews/:id/details` - Get with child records
- `GET /api/interviews/:id/with-context` - Get with application/job context
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Soft delete
- `POST /api/interviews/:id/notes` - Create or update note
- `POST /api/interviews/:id/questions` - Add question
- `PATCH /api/interviews/:id/questions/reorder` - Reorder questions
- `POST /api/interviews/:id/interviewers` - Add interviewer

**Files** [Auth + CSRF]:
- `GET /api/files` - List files
- `POST /api/files/presigned-upload` - Get S3 upload URL (rate limited: 50/window)
- `POST /api/files/confirm-upload` - Confirm upload completion
- `GET /api/files/:id` - Get file metadata
- `DELETE /api/files/:id` - Delete file
- `PUT /api/files/:id/replace` - Replace file
- `POST /api/files/:id/confirm-replace` - Confirm replacement

**Jobs** [Auth + CSRF]:
- `GET /api/jobs` - List jobs
- `GET /api/jobs/with-details` - List with company data
- `GET /api/jobs/:id` - Get job
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Full update
- `PATCH /api/jobs/:id` - Partial update
- `DELETE /api/jobs/:id` - Soft delete

### Response Format

```go
type ApiResponse struct {
    Success  bool         `json:"success"`
    Data     interface{}  `json:"data,omitempty"`
    Warnings []string     `json:"warnings,omitempty"`
    Error    *ErrorDetail `json:"error,omitempty"`
}

type ErrorDetail struct {
    Message     string            `json:"error"`
    Code        string            `json:"code"`
    Details     []string          `json:"details,omitempty"`
    FieldErrors map[string]string `json:"field_errors,omitempty"`
}
```

Success response:
```json
{
  "success": true,
  "data": { ... }
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "error": "Human-readable message",
    "code": "BAD_REQUEST",
    "details": ["optional detail"],
    "field_errors": { "email": "Email must be a valid email" }
  }
}
```

Success with warnings:
```json
{
  "success": true,
  "data": { ... },
  "warnings": ["Some non-critical issue"]
}
```

---

## Authentication and Security

### JWT Authentication

**Flow:**
1. User registers or logs in -> receives access token + refresh token
2. Client stores tokens (NextAuth manages this on the frontend)
3. Access token sent as `Authorization: Bearer <token>`
4. Token expires -> use refresh token to get new pair

**Configuration:**
- Access Token TTL: **24 hours**
- Refresh Token TTL: **7 days**
- Signing: HMAC-SHA256 (`jwt.SigningMethodHS256`)
- Claims: `UserID` (UUID), `Email`, standard registered claims

**Implementation:** `internal/auth/jwt.go`

### Password Security

- Algorithm: bcrypt (cost 10)
- Storage: `users_auth.password_hash` (nullable for OAuth-only users)
- Implementation: `internal/auth/hashing.go`

### OAuth Integration

**Providers:** GitHub, Google, LinkedIn

**Flow:**
1. Frontend (NextAuth) authenticates with provider
2. Provider returns user info (email, name, avatar)
3. Frontend calls `POST /api/oauth` with provider data
4. Backend creates or finds user, returns JWT tokens

### CSRF Protection

- Token generated on safe methods (GET, HEAD, OPTIONS) for authenticated users
- Validated on unsafe methods (POST, PUT, PATCH, DELETE)
- Header: `X-CSRF-Token`
- Token expiry: 24 hours
- In-memory store with hourly cleanup

### Rate Limiting

**IP-based** (unauthenticated endpoints):
- 10 requests per minute per IP
- Applied to: `/users`, `/login`, `/refresh_token`, `/oauth`
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**User-based** (authenticated endpoints, database-backed):
- URL extraction: 30 requests per 24 hours
- File upload presigned URLs: 50 requests per window
- Stored in `rate_limits` table
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

### Security Headers

Applied globally via `middleware/security_headers.go`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy` with restrictive defaults
- `Strict-Transport-Security` in production mode

### CORS Configuration

- **Origins:** `localhost:8080`, `localhost:8082`, `localhost:3000`
- **Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Request Headers:** Origin, Content-Type, Accept, Authorization, X-CSRF-Token
- **Exposed Headers:** Content-Length, X-CSRF-Token
- **Credentials:** true
- **Max Age:** 12 hours

### User-Scoped Security

All data operations are user-scoped:
- Middleware extracts `user_id` from JWT and sets it on the Gin context
- Repositories filter all queries by `user_id`
- No endpoint allows access to another user's data

---

## Error Handling

### Error System

**Package:** `pkg/errors/`

The `AppError` type carries a structured error code, HTTP status, optional cause, detail strings, and field-level validation errors:

```go
type AppError struct {
    Code        ErrorCode         `json:"code"`
    Message     string            `json:"message"`
    Status      int               `json:"-"`
    Cause       error             `json:"-"`
    Details     []string          `json:"-"`
    FieldErrors map[string]string `json:"-"`
}
```

### Error Codes (20 total)

| Code | HTTP Status | Category |
|------|-------------|----------|
| `INVALID_CREDENTIALS` | 401 | auth |
| `EMAIL_ALREADY_EXISTS` | 409 | auth |
| `UNAUTHORIZED` | 401 | auth |
| `ROLE_NOT_FOUND` | 404 | auth |
| `FORBIDDEN` | 403 | auth |
| `VALIDATION_FAILED` | 400 | validation |
| `BAD_REQUEST` | 400 | validation |
| `NOT_FOUND` | 404 | not_found |
| `USER_NOT_FOUND` | 404 | not_found |
| `JOB_NOT_FOUND` | 404 | not_found |
| `CONFLICT` | 409 | internal |
| `INTERNAL_SERVER_ERROR` | 500 | internal |
| `DATABASE_ERROR` | 500 | internal |
| `UNEXPECTED_ERROR` | 500 | internal |
| `TIMEOUT_ERROR` | 408 | internal |
| `PARSING_FAILED` | 422 | internal |
| `NETWORK_FAILURE` | 502 | internal |
| `UNSUPPORTED_PLATFORM` | 400 | internal |
| `QUOTA_EXCEEDED` | 403 | internal |
| `EXPIRED` | 410 | internal |

### Error Conversion

`pkg/errors/convert.go` automatically converts:
- `sql.ErrNoRows` -> `NOT_FOUND`
- `pq.Error` unique violation (23505) -> `EMAIL_ALREADY_EXISTS` or `CONFLICT`
- `pq.Error` FK violation (23503) -> `BAD_REQUEST`
- `pq.Error` NOT NULL violation (23502) -> `BAD_REQUEST`
- `validator.ValidationErrors` -> `VALIDATION_FAILED` with per-field messages
- Unknown errors -> `UNEXPECTED_ERROR`

### Error Middleware

`middleware/error.go` processes errors after handler execution:
- Converts any error to `AppError` via `ConvertError`
- Logs with structured attributes: error code, category, status, method, path, user agent, user ID, cause
- Log levels by category: `auth`/`validation` -> WARN, `not_found` -> INFO, others -> ERROR

---

## Services

### Notification Scheduler

**File:** `internal/services/notification_scheduler.go`

Background goroutine that runs every 15 minutes to generate notifications for upcoming interviews and assessment deadlines based on user preferences.

### Notification Service

**File:** `internal/services/notification_service.go`

Creates notification records in the database.

### Sanitizer Service

**File:** `internal/services/sanitizer_service.go`

Uses bluemonday to sanitize HTML input. Injected into AppState and available to all handlers.

### S3 Service

**File:** `internal/services/s3/service.go`

Generates presigned URLs for direct client-to-S3 uploads. Supports upload, download, replace, and delete operations. URL expiry: 15 minutes.

### URL Extractor

**Package:** `internal/services/urlextractor/`

Extracts structured job data from job posting URLs. Architecture:
- `extractor.go` - Orchestrates HTTP fetch and parser selection
- `parser.go` - Parser interface and platform detection
- Platform-specific parsers: LinkedIn, Indeed, Glassdoor, AngelList
- `parser_generic.go` - Fallback parser using Open Graph and meta tags
- `sanitize.go` - Input sanitization for extracted data
- Comprehensive test coverage

---

## Middleware Pipeline

**Global middleware** (applied in order in `main.go`):

1. `SecurityHeaders()` - Security response headers
2. `gzip.Gzip(gzip.DefaultCompression)` - Response compression
3. `SlowRequestLogger()` - Logs requests exceeding 500ms
4. `cors.New(...)` - CORS configuration
5. `ErrorHandler()` - Catches and formats errors after handler execution

**Per-route middleware** (applied via route registration):

- `AuthMiddleware()` - Validates JWT, extracts user_id and email into context
- `CSRFMiddleware()` - Generates tokens on safe methods, validates on unsafe methods
- `RateLimitAuthIP()` - IP-based rate limiting for public auth endpoints
- `RateLimiter.Middleware(resource, limit)` - User-based rate limiting for specific operations

---

## Startup Sequence

`cmd/server/main.go`:

1. Load `.env` via godotenv
2. Initialize `AppState`: connect to PostgreSQL, run pending migrations, create sanitizer
3. Create Gin router with default middleware (logger, recovery)
4. Register global middleware chain
5. Register `/health` endpoint
6. Register 16 route groups under `/api`
7. Start notification scheduler (15-minute interval)
8. Listen for SIGINT/SIGTERM in a goroutine for graceful shutdown
9. Start HTTP server on port 8081 (configurable via `PORT` env var)

---

## Testing

### Repository Tests

Test files exist for most repository files. They use the testutil package:
- `testutil.SetupTestDB(t)` - Creates a test database and runs migrations
- `testutil.CreateTestUser(t, db)`, `testutil.CreateTestCompany(t, db)`, etc. - Fixture creation

### Handler Tests

Test files: `auth_test.go`, `application_test.go`, `assessment_test.go`, `interview_test.go`, `file_test.go`, `extract_test.go`, `handlers_test.go`

### Service Tests

Test files for: `sanitizer_service_test.go`, `s3/service_test.go`, and multiple URL extractor tests (`extractor_test.go`, `parser_linkedin_test.go`, `parser_indeed_test.go`, `parser_generic_test.go`, `sanitize_test.go`, `retry_test.go`)

### Running Tests

```bash
go test -p 1 ./...
```

The `-p 1` flag is required for sequential execution since tests share a test database.

---

## Development Workflow

### Local Development

```bash
# Start the backend
cd backend
go run cmd/server/main.go

# Or with Docker Compose
docker-compose up -d
```

### Adding a New Feature

1. **Migration** - `migrate create -ext sql -dir migrations -seq add_new_table`
2. **Model** - `internal/models/new_model.go`
3. **Repository** - `internal/repository/new_repository.go`
4. **Handler** - `internal/handlers/new_handler.go`
5. **Routes** - `internal/routes/new_routes.go`
6. **Register** - Add `routes.RegisterNewRoutes(apiGroup, appState)` in `main.go`
7. **Test** - Add repository and handler tests

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Token signing secret

**S3/File storage:**
- `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `AWS_ENDPOINT` (for S3-compatible services like MinIO)

**Optional:**
- `PORT` - Server port (default: 8081)
- `GIN_MODE` - `debug` or `release`

---

## Performance

### Database Optimization

- Foreign keys indexed
- Partial indexes on `deleted_at IS NULL` for soft-deleted tables
- Case-insensitive index on `companies.name` (`LOWER(name)`)
- GIN indexes on `tsvector` columns for full-text search
- Unique partial indexes for business constraints (e.g., one interview per round per application)
- Performance indexes added in migration 000013

### Application Performance

- Gzip compression on all responses
- Slow request logging (>500ms threshold) for identifying bottlenecks
- Stateless design allows horizontal scaling
- Connection pooling managed by sqlx
- Compiled binary with low overhead

---

## Architectural Decisions

### Why Go?

- Migrated from Rust for simpler syntax and faster development velocity
- Compiled language with efficient concurrency primitives
- Single binary deployment
- Rich standard library reduces external dependencies

### Why Gin?

- High-performance HTTP router
- Built-in middleware support (recovery, logging)
- Large ecosystem for auth, CORS, compression
- Familiar API for developers coming from Express/Fiber

### Why sqlx over ORM?

- Direct SQL control avoids hidden queries and N+1 problems
- Transparent query behavior simplifies debugging
- Struct scanning provides enough convenience without ORM overhead
- Named parameters and `IN` clause expansion cover common patterns

### Why Layered Architecture?

- Clear separation: handlers own HTTP concerns, repositories own SQL
- Testability: repositories can be tested against a real database, handlers can be tested with HTTP
- Maintainability: changes to query logic stay in repositories, changes to request handling stay in handlers

---

## Future Enhancements

- Redis caching layer for frequently accessed data
- Horizontal scaling with multiple backend instances behind a load balancer
- Database read replicas for heavy read workloads
- Production CORS domain configuration
- Email-based notification delivery

---

## Security Checklist

1. **JWT secrets** must be strong and unique in production
2. **Database SSL** should use `sslmode=require` in production
3. **CORS origins** must be restricted to production domains
4. **All inputs validated** via go-playground/validator struct tags
5. **HTML sanitized** via bluemonday before storage
6. **SQL injection prevented** by parameterized queries (sqlx)
7. **Passwords stored** as bcrypt hashes (cost 10)
8. **All data operations** user-scoped via JWT user_id
9. **CSRF tokens** required for all state-changing operations
10. **Rate limiting** on authentication and resource-intensive endpoints
11. **Security headers** applied globally (CSP, HSTS, X-Frame-Options)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `cmd/server/main.go` | Application entry point, middleware and route registration |
| `internal/auth/jwt.go` | JWT token generation and validation (24h access, 7d refresh) |
| `internal/auth/hashing.go` | bcrypt password hashing |
| `internal/middleware/auth.go` | JWT validation middleware |
| `internal/middleware/csrf.go` | CSRF token middleware |
| `internal/middleware/rate_limit.go` | IP-based and user-based rate limiting |
| `internal/middleware/error.go` | Global error handler with structured logging |
| `internal/utils/state.go` | AppState initialization (DB, migrations, sanitizer) |
| `pkg/errors/errors.go` | AppError type and 20 error code definitions |
| `pkg/errors/convert.go` | Automatic error conversion (DB, validation, unknown) |
| `pkg/response/response.go` | ApiResponse struct and helper functions |
| `pkg/database/connection.go` | PostgreSQL connection via sqlx |
| `pkg/database/migrations.go` | golang-migrate runner |
| `migrations/000001_initial_schema.up.sql` | Base database schema (14 tables) |
