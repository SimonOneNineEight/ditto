# Ditto Backend API Reference

**Generated:** 2025-11-08
**Base URL:** `/api`
**Framework:** Go + Gin
**Authentication:** JWT (Bearer token)

---

## Overview

The Ditto backend provides a comprehensive REST API for managing job applications, built with Go and Gin framework. The API follows a layered architecture with handlers, repositories, and models. All endpoints (except authentication) are protected with JWT authentication middleware.

---

## Authentication Endpoints

### Register User
**`POST /api/users`** (Public)

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "access_token": "jwt_token",
  "refresh_token": "jwt_token"
}
```

---

### Login
**`POST /api/login`** (Public)

Authenticate with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": { "id": "uuid", "email": "...", "name": "..." },
  "access_token": "jwt_token",
  "refresh_token": "jwt_token"
}
```

---

### OAuth Login
**`POST /api/oauth`** (Public)

Authenticate via OAuth provider (GitHub, Google, LinkedIn).

**Request:**
```json
{
  "provider": "google",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

---

### Refresh Token
**`POST /api/refresh_token`** (Public)

Generate new access token.

**Request:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "access_token": "new_jwt_token"
}
```

---

### Get Current User
**`GET /api/me`** (Protected)

Get authenticated user's profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

### Logout
**`POST /api/logout`** (Protected)

Clear refresh token and log out.

---

## Companies Endpoints

### List Companies
**`GET /api/companies`** (Public)

Get all companies with pagination.

**Query Params:**
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "companies": [...],
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```

---

### Get Company
**`GET /api/companies/:id`** (Public)

Get company details by ID.

---

### Search Companies
**`GET /api/companies/search?name=query`** (Public)

Search companies by name.

---

### Autocomplete Companies
**`GET /api/companies/autocomplete?q=input`** (Public)

Get company suggestions (min 2 chars). Combines local DB + external API.

**Response:**
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "name": "Tech Corp",
      "domain": "techcorp.com",
      "logo_url": "https://...",
      "source": "local"
    }
  ],
  "query": "tech"
}
```

---

### Create Company
**`POST /api/companies`** (Protected)

Create new company.

---

### Select or Create Company
**`POST /api/companies/select`** (Protected)

Select existing or create new company with enrichment.

**Request:**
```json
{
  "company_id": "uuid_or_null",
  "company_name": "Tech Corp",
  "domain": "techcorp.com",
  "logo_url": "https://..."
}
```

---

### Update Company
**`PUT /api/companies/:id`** (Protected)

Update company information.

---

### Delete Company
**`DELETE /api/companies/:id`** (Protected)

Soft delete a company.

---

## Jobs Endpoints

### List Jobs
**`GET /api/jobs`** (Protected)

List user's jobs with filters.

**Query Params:**
- `search` - Search in title/description
- `job_type` - Filter by type
- `location` - Filter by location
- `min_salary`, `max_salary` - Salary range
- `is_expired` - Filter expired jobs (true/false)
- `company_id` - Filter by company
- `page`, `limit` - Pagination

**Response:**
```json
{
  "jobs": [...],
  "total_count": 15,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

---

### List Jobs with Company Details
**`GET /api/jobs/with-details`** (Protected)

List jobs with full company information.

---

### Get Job
**`GET /api/jobs/:id`** (Protected)

Get job details by ID.

---

### Create Job
**`POST /api/jobs`** (Protected)

Create new job.

**Request:**
```json
{
  "company_id": "uuid",
  "company_name": "Tech Corp",
  "title": "Senior Backend Engineer",
  "job_description": "We are hiring...",
  "location": "San Francisco, CA",
  "job_type": "Full-time",
  "min_salary": 120000,
  "max_salary": 180000,
  "currency": "USD"
}
```

---

### Update Job
**`PUT /api/jobs/:id`** (Protected)

Replace all job fields.

---

### Patch Job
**`PATCH /api/jobs/:id`** (Protected)

Partially update job (only specified fields).

---

### Delete Job
**`DELETE /api/jobs/:id`** (Protected)

Soft delete a job.

---

## Applications Endpoints

### List Applications
**`GET /api/applications`** (Protected)

List user's applications with filters.

**Query Params:**
- `job_title`, `company_name` - Filter by text
- `job_id`, `companyID`, `status_id` - Filter by IDs
- `offer_received` - Filter by offer status (true/false)
- `date_from`, `date_to` - Date range (YYYY-MM-DD)
- `page`, `limit` - Pagination

**Response:**
```json
{
  "applications": [...],
  "total": 20,
  "page": 1,
  "has_more": false
}
```

---

### List Applications with Details
**`GET /api/applications/with-details`** (Protected)

List applications with job and company info.

**Response:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "job": { "id": "uuid", "title": "..." },
      "company": { "id": "uuid", "name": "...", "logo_url": "..." },
      "status": { "id": "uuid", "name": "Applied" }
    }
  ]
}
```

---

### Get Application
**`GET /api/applications/:id`** (Protected)

Get application details by ID.

---

### Create Application
**`POST /api/applications`** (Protected)

Create new application.

**Request:**
```json
{
  "job_id": "uuid",
  "application_status_id": "uuid",
  "applied_at": "2025-11-08T00:00:00Z",
  "offer_received": false,
  "attempt_number": 1,
  "notes": "Excited about this opportunity"
}
```

---

### Update Application
**`PUT /api/applications/:id`** (Protected)

Update application information.

---

### Update Application Status
**`PATCH /api/applications/:id/status`** (Protected)

Update application status only.

**Request:**
```json
{
  "application_status_id": "uuid"
}
```

---

### Delete Application
**`DELETE /api/applications/:id`** (Protected)

Soft delete an application.

---

### Get Statistics
**`GET /api/applications/stats`** (Protected)

Get application count by status.

**Response:**
```json
{
  "status_counts": {
    "uuid_status_1": 5,
    "uuid_status_2": 3
  }
}
```

---

### Get Recent Applications
**`GET /api/applications/recent?limit=10`** (Protected)

Get most recent applications.

---

### Get Application Statuses
**`GET /api/application-statuses`** (Public, Cached)

Get all available status options.

**Response:**
```json
{
  "statuses": [
    { "id": "uuid", "name": "Applied" },
    { "id": "uuid", "name": "Interview Scheduled" },
    { "id": "uuid", "name": "Offer Received" }
  ]
}
```

---

## Error Responses

All endpoints use consistent error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

**Common Error Codes:**
- `ErrorBadRequest` (400) - Invalid request data
- `ErrorUnauthorized` (401) - Missing/invalid authentication
- `ErrorNotFound` (404) - Resource not found
- `ErrorConflict` (409) - Resource already exists
- `ErrorValidationFailed` (400) - Validation error

---

## Authentication

Protected endpoints require JWT token:

```
Authorization: Bearer <jwt_token>
```

Obtain tokens via:
- `POST /api/users` (Register)
- `POST /api/login` (Login)
- `POST /api/oauth` (OAuth)
- `POST /api/refresh_token` (Refresh)

---

## Summary

| Resource | Endpoints |
|----------|-----------|
| Authentication | 5 endpoints |
| Companies | 8 endpoints |
| Jobs | 7 endpoints |
| Applications | 10 endpoints |

**Total:** 30+ REST API endpoints

**Key Features:**
- JWT authentication with refresh tokens
- User-scoped data access
- Soft deletes (data preservation)
- Advanced filtering & pagination
- Company data enrichment (Clearout API)
- Application status workflow
