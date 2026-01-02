# Ditto Backend Architecture

**Generated:** 2025-11-08
**Part:** Backend
**Framework:** Go 1.23 + Gin
**Database:** PostgreSQL 15
**Status:** Production Ready (100% Complete)

---

## Executive Summary

The Ditto backend is a production-ready Go REST API built with the Gin framework, serving as the data and business logic layer for a job application tracking system. It implements a clean layered architecture with JWT authentication, comprehensive CRUD operations, and external API integration for company data enrichment.

**Key Capabilities:**
- RESTful API with 30+ endpoints
- JWT authentication with refresh tokens
- Multi-provider OAuth support (GitHub, Google, LinkedIn)
- PostgreSQL database with automated migrations
- Soft deletes and audit trails
- Company data enrichment (Clearout API)
- User-scoped data security
- Docker-ready with automated setup

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Language** | Go | 1.23+ | Primary language |
| **Framework** | Gin | 1.10.1 | HTTP router & middleware |
| **Database** | PostgreSQL | 15 | Primary data store |
| **ORM/Query** | sqlx | 1.4.0 | SQL toolkit |
| **Migrations** | golang-migrate | 4.18.3 | Schema versioning |
| **Authentication** | golang-jwt/jwt | 5.2.2 | JWT handling |
| **Security** | bcrypt | (golang.org/x/crypto) | Password hashing |
| **Validation** | go-playground/validator | 10.26.0 | Input validation |
| **Testing** | testify | 1.10.0 | Assertions |

---

## Architecture Pattern

**Layered Architecture** (Request → Handler → Repository → Database)

```
┌─────────────────────────────────────────┐
│         HTTP Request (Client)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          Middleware Layer               │
│  - CORS                                 │
│  - Error Handler                        │
│  - JWT Authentication (protected routes)│
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          Handler Layer                  │
│  (internal/handlers/)                   │
│  - Parse & validate request             │
│  - Call repository methods              │
│  - Format & return response             │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Repository Layer                │
│  (internal/repository/)                 │
│  - Database queries (sqlx)              │
│  - Transaction management               │
│  - Data mapping                         │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        PostgreSQL Database              │
│  - Tables with relationships            │
│  - Triggers for timestamps              │
│  - Indexes for performance              │
└─────────────────────────────────────────┘
```

---

## Project Structure

```
backend/
├── cmd/server/            # Application entry point
│   └── main.go           # Bootstrap (routing, middleware, server)
│
├── internal/             # Private application code
│   ├── auth/            # JWT & password utilities
│   ├── config/          # Configuration management
│   ├── constants/       # Error codes, defaults
│   ├── handlers/        # HTTP request handlers (4 files)
│   ├── middleware/      # Auth & error middleware
│   ├── models/          # Data structures (Go structs)
│   ├── repository/      # Database access layer (4 files)
│   ├── routes/          # Route registration (4 files)
│   ├── testutil/        # Test helpers & fixtures
│   └── utils/           # App state management
│
├── migrations/          # Database schema versioning
│   ├── 000001_initial_schema.up.sql
│   ├── 000001_initial_schema.down.sql
│   └── 000002_add_users_auth_user_id_unique.up.sql
│
└── pkg/                 # Shared packages
    ├── database/        # DB connection utilities
    ├── errors/          # Custom error types
    └── response/        # HTTP response helpers
```

---

## Database Architecture

### Schema Overview

**Total Tables:** 11 core tables
**Relationships:** Foreign keys with cascade rules
**Special Features:** Soft deletes, auto-timestamps, triggers

#### Core Entities

```
users                    # User accounts
├── users_auth          # OAuth + password authentication
├── user_roles          # User permissions
└── user_jobs           # User's tracked jobs

companies                # Job posting companies
└── jobs                # Job listings
    └── job_skills      # Required skills for jobs

applications            # Job applications
├── application_status  # Workflow states (Applied, Interview, etc.)
└── interviews          # Interview records

skills                   # Skill taxonomy
└── skill_categories    # Skill grouping

user_skills             # User's skill profile
```

#### Data Model Highlights

1. **User Authentication:**
   - Hybrid model: OAuth (`users_auth.provider`) + credentials (`users_auth.password_hash`)
   - Supports GitHub, Google, LinkedIn OAuth
   - Unique constraint on `users_auth.user_id` (one auth record per user)

2. **Soft Deletes:**
   - Tables: `users`, `companies`, `jobs`, `applications`, `interviews`
   - Pattern: `deleted_at` timestamp (NULL = active)
   - Queries automatically filter `WHERE deleted_at IS NULL`

3. **Automatic Timestamps:**
   - All tables have `created_at`, `updated_at`
   - Database triggers auto-update on INSERT/UPDATE
   - Cascading triggers (e.g., updating `user_jobs` updates parent `jobs`)

4. **Company Enrichment:**
   - `companies.last_enriched_at` tracks API data freshness
   - External API integration via Clearout
   - Stores `logo_url`, `website`, `domain` from enrichment

**Full schema:** See `docs/database-schema.md`

---

## API Design

### Endpoint Organization

| Resource | Endpoints | Authentication |
|----------|-----------|----------------|
| **Auth** | 5 | Mixed (public + protected) |
| **Companies** | 8 | Mixed |
| **Jobs** | 7 | All protected |
| **Applications** | 10 | All protected |

### Key Patterns

1. **RESTful Design:**
   - `GET /resource` - List
   - `GET /resource/:id` - Get single
   - `POST /resource` - Create
   - `PUT /resource/:id` - Full update
   - `PATCH /resource/:id` - Partial update
   - `DELETE /resource/:id` - Soft delete

2. **Pagination:**
   - Query params: `page`, `limit`, `offset`
   - Response includes: `total`, `has_more`

3. **Filtering:**
   - Query params for search: `search`, `job_type`, `location`
   - Date ranges: `date_from`, `date_to`
   - Boolean filters: `is_expired`, `offer_received`

4. **Response Format:**
   ```json
   {
     "success": true,
     "data": {...},
     "error": null
   }
   ```

**Full API reference:** See `docs/api-contracts-backend.md`

---

## Authentication & Security

### JWT Authentication

**Flow:**
1. User registers/logs in → Receive access token + refresh token
2. Client stores tokens (NextAuth manages this)
3. Access token attached to requests: `Authorization: Bearer <token>`
4. Token expires → Use refresh token to get new access token

**Implementation:**
- **Package:** `internal/auth/jwt.go`
- **Access Token TTL:** 15 minutes (default)
- **Refresh Token TTL:** 7 days (stored in `users_auth.refresh_token`)
- **Middleware:** `internal/middleware/auth.go` validates JWT on protected routes

### Password Security

- **Hashing:** bcrypt (cost: 10)
- **Storage:** `users_auth.password_hash` (nullable for OAuth users)
- **Package:** `internal/auth/hash.go`

### OAuth Integration

**Supported Providers:**
- GitHub
- Google
- LinkedIn

**Endpoint:** `POST /api/oauth`
**Handler:** `internal/handlers/auth.go:OAuthLogin()`

**Flow:**
1. Frontend (NextAuth) authenticates with provider
2. Provider returns user info (email, name, avatar)
3. Frontend calls `/api/oauth` with provider data
4. Backend creates/finds user, returns JWT tokens

### User-Scoped Security

All data operations are user-scoped:

```go
// Example: Jobs query automatically filters by user
SELECT * FROM user_jobs
WHERE user_id = $1 AND deleted_at IS NULL
```

- **Middleware extracts user ID** from JWT
- **Repositories filter by user ID** automatically
- **Prevents unauthorized access** to other users' data

---

## Data Architecture

### Repository Pattern

**Responsibilities:**
- Database queries
- Transaction management
- Error handling
- Data mapping

**Example:** `internal/repository/job.go`

```go
type JobRepository struct {
    DB *sqlx.DB
}

func (r *JobRepository) GetUserJobs(userID string, filters JobFilters) ([]Job, error) {
    query := `SELECT * FROM user_jobs
              WHERE user_id = $1 AND deleted_at IS NULL`
    // Add filters dynamically
    // Execute query
    // Return results
}
```

### External API Integration

**Clearout API** - Company data enrichment

- **Package:** `internal/handlers/company.go:enrichCompanyData()`
- **Trigger:** Company autocomplete, create operations
- **Data:** Logo URLs, website, domain, company metadata
- **Caching:** Stores enriched data in `companies` table
- **Rate Limiting:** Consider implementing

---

## Component Overview

### Entry Point

**File:** `cmd/server/main.go:23`

Responsibilities:
1. Load environment variables (`.env`)
2. Initialize database connection
3. Set up Gin router
4. Configure CORS middleware
5. Register error handler
6. Register all routes (auth, companies, jobs, applications)
7. Start HTTP server

### Handlers

**Location:** `internal/handlers/`

| File | Endpoints | Purpose |
|------|-----------|---------|
| `auth.go` | 5 | User registration, login, logout, OAuth, profile |
| `company.go` | 8 | Company CRUD, search, autocomplete, select |
| `job.go` | 7 | Job CRUD, filtering, with-details |
| `application.go` | 10 | Application CRUD, status updates, statistics |

### Repositories

**Location:** `internal/repository/`

| File | Methods | Purpose |
|------|---------|---------|
| `user.go` | 6+ | User CRUD, authentication queries |
| `company.go` | 8+ | Company management, search logic |
| `job.go` | 10+ | Job management, filtering, user-scoped queries |
| `application.go` | 12+ | Application tracking, statistics, status workflow |

### Models

**Location:** `internal/models/`

Defines Go structs with:
- JSON tags for API serialization
- Database tags for sqlx mapping
- Validation tags for go-playground/validator

Example:
```go
type Job struct {
    ID             string    `json:"id" db:"id"`
    CompanyID      string    `json:"company_id" db:"company_id" validate:"required"`
    Title          string    `json:"title" db:"title" validate:"required,min=1,max=255"`
    JobDescription string    `json:"job_description" db:"job_description" validate:"required"`
    Location       string    `json:"location" db:"location" validate:"required"`
    JobType        string    `json:"job_type" db:"job_type" validate:"required,max=50"`
    MinSalary      *int      `json:"min_salary,omitempty" db:"min_salary"`
    MaxSalary      *int      `json:"max_salary,omitempty" db:"max_salary"`
    Currency       string    `json:"currency,omitempty" db:"currency"`
    IsExpired      bool      `json:"is_expired" db:"is_expired"`
    CreatedAt      time.Time `json:"created_at" db:"created_at"`
    UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
    DeletedAt      *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}
```

---

## Error Handling

### Error System

**Package:** `pkg/errors/`

Custom error types with codes:

```go
type ErrorCode string

const (
    ErrorBadRequest       ErrorCode = "ERROR_BAD_REQUEST"
    ErrorUnauthorized     ErrorCode = "ERROR_UNAUTHORIZED"
    ErrorNotFound         ErrorCode = "ERROR_NOT_FOUND"
    ErrorConflict         ErrorCode = "ERROR_CONFLICT"
    ErrorValidationFailed ErrorCode = "ERROR_VALIDATION_FAILED"
    // ... more codes
)
```

### Error Middleware

**File:** `internal/middleware/error.go`

- Catches panics
- Converts errors to HTTP status codes
- Formats consistent error responses
- Logs errors with context

**Response Format:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

## Testing Strategy

### Unit Tests

**Coverage:** Repository layer
**Files:** `internal/repository/*_test.go`

**Test Database:**
- Name: `ditto_test`
- User: `ditto_test_user`
- Auto-setup & migration in `internal/testutil/`

**Test Patterns:**
- Setup: Create test database, run migrations
- Each test: Clean state (transactions or truncate)
- Fixtures: `testutil.CreateTestUser()`, `testutil.CreateTestCompany()`
- Teardown: Close connections

**Example Test:**
```go
func TestCreateJob(t *testing.T) {
    db := testutil.SetupTestDB(t)
    defer testutil.TeardownTestDB(t, db)

    user := testutil.CreateTestUser(t, db)
    company := testutil.CreateTestCompany(t, db)

    repo := repository.NewJobRepository(db)
    job, err := repo.CreateJob(user.ID, jobData)

    assert.NoError(t, err)
    assert.NotEmpty(t, job.ID)
}
```

### Integration Tests

**File:** `test_api.sh`

- Tests complete API workflows
- Uses curl for HTTP requests
- Validates response codes and JSON
- Tests: Registration, login, JWT refresh, CRUD operations

**Run:** `./test_api.sh`

---

## Development Workflow

### Local Development

```bash
# With Docker Compose (recommended)
docker-compose up -d

# Or manual
export DATABASE_URL="postgres://..."
go run cmd/server/main.go

# With hot reload
air
```

### Adding New Endpoint

1. **Define Model** - `internal/models/new_model.go`
2. **Create Repository** - `internal/repository/new_repository.go`
3. **Create Handler** - `internal/handlers/new_handler.go`
4. **Register Route** - `internal/routes/new_routes.go`
5. **Test** - `internal/repository/new_repository_test.go`
6. **Update API docs** - `docs/api-contracts-backend.md`

### Database Migration

```bash
# Create migration
migrate create -ext sql -dir migrations -seq add_new_table

# Edit .up.sql and .down.sql files

# Apply migration
migrate -path migrations -database $DATABASE_URL up
```

---

## Deployment Architecture

### Docker

**Image:** `backend/Dockerfile.dev` (development) / `Dockerfile` (production)

**Container:**
- Runs golang-migrate on startup (automatic migrations)
- Starts Go binary
- Health check endpoint: `/health`
- Port: 8081

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret

**Optional:**
- `PORT` - Server port (default: 8081)
- `GIN_MODE` - `debug` or `release`
- `CLEAROUT_API_KEY` - Company enrichment API

---

## Performance Considerations

### Database Optimization

1. **Indexes:**
   - Foreign keys indexed
   - Search fields indexed (e.g., `companies.name`, case-insensitive)
   - Soft delete queries use partial index

2. **Connection Pooling:**
   - Managed by `sqlx`
   - Default pool size: Auto-configured

3. **Query Patterns:**
   - Prepared statements (sqlx handles)
   - Batch operations where applicable
   - Pagination for large datasets

### Application Performance

- **Stateless design** - Horizontal scaling ready
- **Middleware caching** - Application statuses cached
- **Gin framework** - High-performance router
- **Compiled binary** - Fast startup, low overhead

---

## Architectural Decisions

### Why Go?

- **Migrated from Rust** - Go offers simpler syntax, faster development
- **Performance** - Compiled language, efficient concurrency
- **Ecosystem** - Rich standard library, excellent tools
- **Deployment** - Single binary, easy to containerize

### Why Gin?

- **Performance** - One of the fastest Go frameworks
- **Middleware** - Built-in support for auth, CORS, etc.
- **Community** - Large ecosystem, well-documented

### Why sqlx over ORM?

- **Control** - Write optimized SQL directly
- **Transparency** - No hidden queries or N+1 problems
- **Performance** - No ORM overhead
- **Simplicity** - Easier to understand and debug

### Why Layered Architecture?

- **Separation of Concerns** - Clear boundaries between layers
- **Testability** - Easy to mock repositories
- **Maintainability** - Changes isolated to specific layers
- **Scalability** - Can extract layers to microservices if needed

---

## Future Enhancements

### Planned

- [ ] Job scraping feature (excluded from initial release)
- [ ] Document management (resume/cover letter storage)
- [ ] Analytics dashboard endpoints
- [ ] Email notifications
- [ ] Rate limiting middleware
- [ ] Redis caching layer

### Scalability

- **Horizontal Scaling:** Backend is stateless, add more instances
- **Database:** Read replicas for heavy read workloads
- **Caching:** Redis for frequently accessed data
- **CDN:** Static assets (if serving files)

---

## Security Notes

1. **JWT Secrets:** Must be strong, unique in production
2. **Database SSL:** Use `sslmode=require` in production
3. **CORS:** Restrict to production domains
4. **Input Validation:** All inputs validated before processing
5. **SQL Injection:** Prevented by parameterized queries (sqlx)
6. **Password Storage:** bcrypt with cost 10
7. **User Data:** All operations user-scoped

---

## Key Files Reference

| File | Line | Purpose |
|------|------|---------|
| `cmd/server/main.go` | 23 | Application entry point |
| `internal/routes/auth.go` | - | Auth route registration |
| `internal/handlers/auth.go` | - | Login, register, OAuth logic |
| `internal/middleware/auth.go` | - | JWT validation |
| `internal/repository/user.go` | - | User database operations |
| `pkg/errors/errors.go` | - | Custom error types |
| `migrations/000001_initial_schema.up.sql` | - | Database schema |

---

**Last Updated:** 2025-11-08
**Version:** 1.0 (Production)
**Migration History:** Rust → Go (100% complete, July 2025)
