# Ditto Backend - Go API

A modern Go backend for the Ditto job application assistant, built with Gin framework and PostgreSQL.

## Features

- **Modern Architecture**: Clean REST API with hybrid company selection system
- **Smart Company Input**: Single-input UX with external API enrichment (Clearout)
- **Authentication**: JWT-based auth with refresh tokens
- **Database**: PostgreSQL with soft deletes, triggers, and optimized indexes
- **External APIs**: Company data enrichment and validation
- **Comprehensive CRUD**: Jobs, Applications, Companies with full management

## Quick Start

```bash
# Install dependencies
go mod download

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
migrate -path migrations -database "postgres://..." up

# Start server
go run cmd/server/main.go

# Health check
curl http://localhost:8081/health
```

## API Documentation

**Base URL**: `http://localhost:8081/api`

### Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

| Method | Endpoint         | Auth | Description       |
| ------ | ---------------- | ---- | ----------------- |
| `POST` | `/users`         | ❌   | Register new user |
| `POST` | `/login`         | ❌   | User login        |
| `POST` | `/refresh_token` | ❌   | Refresh JWT token |
| `POST` | `/logout`        | ✅   | User logout       |
| `GET`  | `/me`            | ✅   | Get user profile  |

### Companies

| Method   | Endpoint                          | Auth | Description                      |
| -------- | --------------------------------- | ---- | -------------------------------- |
| `GET`    | `/companies`                      | ❌   | List companies with job counts   |
| `GET`    | `/companies/autocomplete?q=query` | ❌   | Smart company autocomplete       |
| `GET`    | `/companies/search?name=query`    | ❌   | Search companies by name         |
| `GET`    | `/companies/:id`                  | ❌   | Get company details              |
| `POST`   | `/companies/select`               | ✅   | Smart company selection/creation |
| `POST`   | `/companies`                      | ✅   | Create company                   |
| `PUT`    | `/companies/:id`                  | ✅   | Update company                   |
| `DELETE` | `/companies/:id`                  | ✅   | Soft delete company              |

### Jobs (All Protected)

| Method   | Endpoint             | Description                                         |
| -------- | -------------------- | --------------------------------------------------- |
| `GET`    | `/jobs`              | List user's jobs with filtering & pagination        |
| `POST`   | `/jobs`              | Create job (accepts `company_name` OR `company_id`) |
| `GET`    | `/jobs/with-details` | Jobs with company details                           |
| `GET`    | `/jobs/:id`          | Get specific job                                    |
| `PUT`    | `/jobs/:id`          | Update job                                          |
| `PATCH`  | `/jobs/:id`          | Partial update job                                  |
| `DELETE` | `/jobs/:id`          | Soft delete job                                     |

### Applications (All Protected)

| Method   | Endpoint                        | Description                             |
| -------- | ------------------------------- | --------------------------------------- |
| `GET`    | `/applications`                 | List user's applications with filtering |
| `POST`   | `/applications`                 | Create application                      |
| `GET`    | `/applications/with-details`    | Applications with job/company details   |
| `GET`    | `/applications/stats`           | Application statistics by status        |
| `GET`    | `/applications/recent?limit=10` | Recent applications (last 7 days)       |
| `GET`    | `/applications/:id`             | Get specific application                |
| `PUT`    | `/applications/:id`             | Update application                      |
| `PATCH`  | `/applications/:id/status`      | Update application status               |
| `DELETE` | `/applications/:id`             | Soft delete application                 |

### Application Statuses

| Method | Endpoint                | Auth | Description                            |
| ------ | ----------------------- | ---- | -------------------------------------- |
| `GET`  | `/application-statuses` | ❌   | Get all available application statuses |

## Request Examples

### Register User

```bash
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Login

```bash
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

# Response includes access_token and refresh_token
```

### Create Job (Modern Single-Input Approach)

```bash
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "company_name": "Google",  # System will auto-create/find company
  "title": "Software Engineer",
  "job_description": "Backend development role",
  "location": "San Francisco, CA",
  "job_type": "Full-time",
  "min_salary": 120000,
  "max_salary": 180000,
  "currency": "USD"
}
```

### Company Autocomplete (Smart UX)

```bash
GET /api/companies/autocomplete?q=goog

# Response:
{
  "suggestions": [
    {
      "id": null,
      "name": "Google LLC",
      "domain": "google.com",
      "logo_url": "https://logo.clearbit.com/google.com",
      "website": "https://google.com",
      "source": "suggestion"
    },
    {
      "id": "uuid-here",
      "name": "Google Inc",
      "domain": "google.com",
      "logo_url": "...",
      "source": "saved"
    }
  ],
  "query": "goog"
}
```

### Create Application

```bash
POST /api/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "job_id": "job-uuid-here",
  "application_status_id": "status-uuid-here",
  "applied_at": "2025-01-15T10:00:00Z",
  "attempt_number": 1,
  "notes": "Applied through company website"
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Success"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid request data",
    "details": "Field 'email' is required"
  }
}
```

## Key Features

### 🏢 Hybrid Company System

- **Single Input UX**: Users just type company names
- **Smart Autocomplete**: Local database + external API suggestions
- **Auto-Enrichment**: Company logos, domains, websites from Clearout API
- **Deduplication**: Prevents duplicate companies by name/domain matching

### 🔐 Security

- JWT authentication with refresh tokens
- User-scoped data access (users only see their own jobs/applications)
- Input validation and sanitization
- SQL injection prevention

### 📊 Advanced Features

- **Soft Deletes**: Data preservation with recovery capability
- **Pagination**: Efficient data loading with offset/limit
- **Filtering**: Advanced search across jobs and applications
- **Analytics**: Application statistics and dashboard data
- **External APIs**: Company data enrichment from public sources

### 🗄️ Database Design

- PostgreSQL with optimized indexes
- Automatic timestamp triggers
- Foreign key constraints with cascade rules
- Soft delete support across all tables

## Project Structure

```
backend/
├── cmd/server/           # Application entrypoint
├── internal/
│   ├── handlers/         # HTTP request handlers
│   ├── middleware/       # Authentication, error handling
│   ├── models/          # Data structures
│   ├── repository/      # Database operations
│   ├── routes/          # Route registration
│   └── utils/           # Utilities and app state
├── migrations/          # Database migrations
├── pkg/
│   ├── database/        # Database connection
│   ├── errors/          # Error handling system
│   └── response/        # HTTP response helpers
└── README.md           # This file
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:password@localhost/ditto_dev?sslmode=disable

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server
PORT=8081
```

## Development

```bash
# Run with hot reload (if using air)
air

# Run tests
go test ./...

# Format code
go fmt ./...

# Check for issues
go vet ./...

# Build for production
go build -o bin/server cmd/server/main.go
```

## Tech Stack

- **Framework**: Gin (HTTP router)
- **Database**: PostgreSQL with sqlx
- **Authentication**: JWT with golang-jwt
- **Validation**: go-playground/validator
- **External APIs**: Clearout (company data)
- **Migration**: golang-migrate
- **UUID**: google/uuid

---

**Status**: ✅ Production Ready (100% feature complete)  
**Last Updated**: July 2025

