# Ditto Backend API Reference

**Base URL:** `http://localhost:8081`
**Framework:** Go / Gin
**Authentication:** JWT Bearer token

---

## Response Envelope

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "warnings": ["optional warning messages"]
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "error": "Human-readable message",
    "code": "ERROR_CODE",
    "details": ["optional extra info"],
    "field_errors": { "field": "message" }
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `EMAIL_ALREADY_EXISTS` | 409 | Email taken during registration |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `VALIDATION_FAILED` | 400 | Request body validation failed |
| `BAD_REQUEST` | 400 | Malformed request |
| `NOT_FOUND` | 404 | Resource not found |
| `USER_NOT_FOUND` | 404 | User not found |
| `JOB_NOT_FOUND` | 404 | Job not found |
| `FORBIDDEN` | 403 | Access denied |
| `CONFLICT` | 409 | Duplicate resource |
| `QUOTA_EXCEEDED` | 403 | Storage or rate limit exceeded |
| `EXPIRED` | 410 | Resource expired |
| `TIMEOUT_ERROR` | 408 | Request timeout |
| `PARSING_FAILED` | 422 | Could not parse content |
| `NETWORK_FAILURE` | 502 | Upstream network error |
| `UNSUPPORTED_PLATFORM` | 400 | Unsupported job platform |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database error |

---

## Authentication

Protected endpoints require:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via register, login, OAuth, or refresh endpoints.

---

## Auth Endpoints

### POST /api/users
Register a new user. **Public, rate-limited.**

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": { "id": "uuid", "email": "string", "name": "string", "created_at": "timestamp", "updated_at": "timestamp" },
  "access_token": "jwt",
  "refresh_token": "jwt",
  "expires_in": 900
}
```

### POST /api/login
Authenticate with credentials. **Public, rate-limited.**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response (200):** Same as register.

### POST /api/refresh_token
Refresh access token. **Public, rate-limited.**

**Request:**
```json
{
  "refresh_token": "jwt"
}
```

**Response (200):**
```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "expires_in": 900
}
```

### POST /api/oauth
OAuth login (GitHub, Google). **Public, rate-limited.**

**Request:**
```json
{
  "provider": "google",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response (200):** Same as register.

### POST /api/logout
Log out and clear refresh token. **Protected.**

**Response (200):**
```json
{ "message": "logged out successfully" }
```

### GET /api/me
Get current user profile. **Protected.**

**Response (200):**
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### DELETE /api/users/account
Delete user account and all data. **Protected.**

**Response (200):**
```json
{ "message": "account deleted successfully" }
```

---

## Application Endpoints

### GET /api/applications
List applications with filtering and sorting. **Protected.**

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 50 | Max 100 |
| `page` | int | 1 | Page number |
| `job_title` | string | | Filter by job title |
| `company_name` | string | | Filter by company name |
| `status_id` | uuid | | Single status filter |
| `status_ids` | string | | Comma-separated status UUIDs |
| `has_interviews` | bool | | Has interviews |
| `has_assessments` | bool | | Has assessments |
| `offer_received` | bool | | Has offer |
| `date_from` | YYYY-MM-DD | | Applied after |
| `date_to` | YYYY-MM-DD | | Applied before |
| `sort_by` | string | | company, position, status, applied_at, location, updated_at, job_type |
| `sort_order` | string | | asc, desc |

**Response (200):**
```json
{
  "applications": [...],
  "total": 20,
  "page": 1,
  "limit": 50,
  "has_more": false
}
```

### GET /api/applications/with-details
List applications with job/company/status details. **Protected.** Same query params as above.

**Response (200):**
```json
{
  "applications": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "application_status_id": "uuid",
      "applied_at": "timestamp",
      "notes": "string",
      "job": { "id": "uuid", "title": "string", "location": "string", "job_type": "string", "source_url": "string" },
      "company": { "id": "uuid", "name": "string" },
      "status": { "id": "uuid", "name": "string" }
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 50,
  "has_more": false
}
```

### GET /api/applications/:id
Get single application. **Protected.**

### GET /api/applications/:id/with-details
Get application with job/company/status. **Protected.**

### POST /api/applications
Create application. **Protected.**

**Request:**
```json
{
  "job_id": "uuid",
  "application_status_id": "uuid",
  "applied_at": "2025-01-01T00:00:00Z",
  "attempt_number": 1,
  "notes": "string"
}
```

**Response (201):** Application object.

### POST /api/applications/quick-create
Create application with inline job and company. **Protected.**

**Request:**
```json
{
  "company_name": "string (required)",
  "title": "string (required)",
  "description": "string",
  "location": "string",
  "job_type": "full-time|part-time|contract|internship",
  "source_url": "string (URL, max 2048)",
  "platform": "string (max 50)",
  "notes": "string",
  "min_salary": 0,
  "max_salary": 0
}
```

**Response (201):**
```json
{
  "application": {...},
  "job": {...},
  "company": {...}
}
```

### PUT /api/applications/:id
Update application. **Protected.**

### PATCH /api/applications/:id/status
Update application status. **Protected.**

**Request:**
```json
{ "application_status_id": "uuid" }
```

### DELETE /api/applications/:id
Delete application. **Protected.**

### GET /api/applications/stats
Application count by status. **Protected.**

**Response (200):**
```json
{ "status_counts": { "status_id": 5 } }
```

### GET /api/applications/recent
Recent applications. **Protected.**

| Param | Type | Default |
|-------|------|---------|
| `limit` | int | 10 |

### GET /api/application-statuses
List available statuses. **Public.**

**Response (200):**
```json
{
  "statuses": [
    { "id": "uuid", "name": "Applied", "color": "string", "order": 1 }
  ]
}
```

---

## Interview Endpoints

### POST /api/interviews
Create interview round. **Protected.**

**Request:**
```json
{
  "application_id": "uuid (required)",
  "interview_type": "phone_screen|technical|behavioral|panel|onsite|other (required)",
  "scheduled_date": "YYYY-MM-DD (required)",
  "scheduled_time": "string",
  "duration_minutes": 60
}
```

**Response (201):**
```json
{
  "interview": {
    "id": "uuid",
    "application_id": "uuid",
    "scheduled_date": "timestamp",
    "scheduled_time": "string",
    "interview_type": "string",
    "duration_minutes": 60,
    "round_number": 1,
    "outcome": "string",
    "overall_feeling": "string",
    "went_well": "string",
    "could_improve": "string",
    "confidence_level": 4,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### GET /api/interviews
List interviews. **Protected.**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filter` | string | all | all, upcoming, past |
| `upcoming` | bool | false | Only upcoming |
| `range` | string | | today, week, month, all |
| `page` | int | 1 | |
| `limit` | int | 50 | Max 100 |

**Response (200):**
```json
{
  "interviews": [...],
  "meta": { "page": 1, "limit": 50, "total_items": 10, "total_pages": 1 }
}
```

### GET /api/interviews/:id
Get interview. **Protected.**

### GET /api/interviews/:id/details
Get interview with interviewers, questions, and notes. **Protected.**

**Response (200):**
```json
{
  "interview": {...},
  "application": { "company_name": "string", "job_title": "string" },
  "interviewers": [{ "id": "uuid", "name": "string", "role": "string" }],
  "questions": [{ "id": "uuid", "question_text": "string", "answer_text": "string", "order": 1 }],
  "notes": [{ "id": "uuid", "note_type": "string", "content": "string" }]
}
```

### GET /api/interviews/:id/with-context
Get interview with all rounds for context. **Protected.**

**Response (200):**
```json
{
  "current_interview": { /* same as /details */ },
  "all_rounds": [
    {
      "id": "uuid",
      "round_number": 1,
      "interview_type": "string",
      "scheduled_date": "timestamp",
      "interviewers": [{ "name": "string", "role": "string" }],
      "questions_preview": "string",
      "feedback_preview": "string"
    }
  ],
  "application": { "company_name": "string", "job_title": "string" }
}
```

### PUT /api/interviews/:id
Update interview. **Protected.**

**Request:**
```json
{
  "scheduled_date": "YYYY-MM-DD",
  "scheduled_time": "string",
  "duration_minutes": 60,
  "interview_type": "phone_screen|technical|behavioral|panel|onsite|other",
  "outcome": "string",
  "overall_feeling": "excellent|good|okay|poor",
  "went_well": "string",
  "could_improve": "string",
  "confidence_level": 4
}
```

### DELETE /api/interviews/:id
Delete interview. **Protected.** Response: 204 No Content.

---

## Interviewer Endpoints

### POST /api/interviews/:id/interviewers
Add interviewers. Supports single or bulk. **Protected.**

**Request (single):**
```json
{ "name": "string", "role": "string" }
```

**Request (bulk):**
```json
{
  "interviewers": [
    { "name": "string", "role": "string" }
  ]
}
```

### PUT /api/interviewers/:id
Update interviewer. **Protected.**

### DELETE /api/interviewers/:id
Delete interviewer. **Protected.**

---

## Interview Question Endpoints

### POST /api/interviews/:id/questions
Add questions. Supports single or bulk. **Protected.**

**Request (single):**
```json
{ "question_text": "string", "answer_text": "string" }
```

**Request (bulk):**
```json
{
  "questions": [
    { "question_text": "string", "answer_text": "string" }
  ]
}
```

### PUT /api/interview-questions/:id
Update question. **Protected.**

### DELETE /api/interview-questions/:id
Delete question. **Protected.**

### PATCH /api/interviews/:id/questions/reorder
Reorder questions. **Protected.**

**Request:**
```json
{ "question_ids": ["uuid", "uuid"] }
```

---

## Interview Note Endpoints

### POST /api/interviews/:id/notes
Create or update note (upserts by note_type). **Protected.**

**Request:**
```json
{
  "note_type": "preparation|company_research|feedback|reflection|general (required)",
  "content": "string (max 50KB)"
}
```

**Response (200):**
```json
{
  "interviewNote": {
    "id": "uuid",
    "interview_id": "uuid",
    "note_type": "string",
    "content": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

---

## Assessment Endpoints

### POST /api/assessments
Create assessment. **Protected.**

**Request:**
```json
{
  "application_id": "uuid (required)",
  "assessment_type": "take_home_project|live_coding|system_design|data_structures|case_study|other (required)",
  "title": "string (required, max 255)",
  "due_date": "YYYY-MM-DD (required)",
  "instructions": "string",
  "requirements": "string"
}
```

**Response (201):**
```json
{
  "assessment": {
    "id": "uuid",
    "application_id": "uuid",
    "assessment_type": "string",
    "title": "string",
    "due_date": "YYYY-MM-DD",
    "status": "not_started",
    "instructions": "string",
    "requirements": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### GET /api/assessments
List assessments. **Protected.**

| Param | Type | Description |
|-------|------|-------------|
| `application_id` | uuid | Filter by application |

**Response (200):**
```json
{
  "assessments": [
    {
      "id": "uuid",
      "application_id": "uuid",
      "company_name": "string",
      "job_title": "string",
      "title": "string",
      "assessment_type": "string",
      "due_date": "YYYY-MM-DD",
      "status": "string"
    }
  ]
}
```

### GET /api/assessments/:id
Get assessment. **Protected.**

### GET /api/assessments/:id/details
Get assessment with submissions. **Protected.**

**Response (200):**
```json
{
  "assessment": {...},
  "submissions": [
    {
      "id": "uuid",
      "assessment_id": "uuid",
      "submission_type": "github|file_upload|notes",
      "github_url": "string",
      "file_id": "uuid",
      "notes": "string",
      "submitted_at": "timestamp"
    }
  ]
}
```

### PUT /api/assessments/:id
Update assessment. **Protected.**

### PATCH /api/assessments/:id/status
Update assessment status. **Protected.**

**Request:**
```json
{ "status": "not_started|in_progress|submitted|passed|failed" }
```

### DELETE /api/assessments/:id
Delete assessment. **Protected.** Response: 204 No Content.

### POST /api/assessments/:id/submissions
Create submission. **Protected.**

**Request:**
```json
{
  "submission_type": "github|file_upload|notes (required)",
  "github_url": "string (required if github)",
  "file_id": "uuid (required if file_upload)",
  "notes": "string (required if notes)"
}
```

**Response (201):** Submission object.

### DELETE /api/assessment-submissions/:submissionId
Delete submission. **Protected.** Response: 204 No Content.

---

## File Endpoints

### GET /api/files
List files. **Protected.**

| Param | Type | Description |
|-------|------|-------------|
| `application_id` | uuid | Filter by application |
| `interview_id` | uuid | Filter by interview |

### POST /api/files/presigned-upload
Get presigned S3 upload URL. **Protected. Rate-limited: 50/day.**

**Request:**
```json
{
  "file_name": "string (required)",
  "file_type": "string (MIME type, required)",
  "file_size": 1024,
  "application_id": "uuid (required)",
  "interview_id": "uuid (optional)",
  "submission_context": "assessment (optional, increases size limit to 10MB)"
}
```

**Allowed file types:** `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`, `image/png`, `image/jpeg`. Assessment context also allows: `application/zip`, `application/x-zip-compressed`.

**Size limits:** 5MB (general), 10MB (assessment context).

**Response (200):**
```json
{
  "presigned_url": "string",
  "s3_key": "string",
  "expires_in": 900
}
```

### POST /api/files/confirm-upload
Confirm upload after S3 upload completes. **Protected.**

**Request:**
```json
{
  "s3_key": "string (required)",
  "file_name": "string (required)",
  "file_type": "string (required)",
  "file_size": 1024,
  "application_id": "uuid (required)",
  "interview_id": "uuid (optional)"
}
```

**Response (200):** File object.

### GET /api/files/:id
Get presigned download URL. **Protected.**

**Response (200):**
```json
{
  "presigned_url": "string",
  "expires_in": 900,
  "file_name": "string",
  "file_size": 1024,
  "file_type": "string"
}
```

### DELETE /api/files/:id
Delete file from S3 and database. **Protected.**

### PUT /api/files/:id/replace
Get presigned URL for file replacement. **Protected.** Same request/response as presigned-upload.

### POST /api/files/:id/confirm-replace
Confirm file replacement. **Protected.** Same request/response as confirm-upload.

### GET /api/users/storage-stats
Get user storage quota. **Protected.**

**Response (200):**
```json
{
  "used_bytes": 5242880,
  "total_bytes": 104857600,
  "file_count": 3,
  "usage_percentage": 5,
  "warning": false,
  "limit_reached": false
}
```

Storage quota: 100MB per user. Warning at 90%.

### GET /api/users/files
List user files with application context. **Protected.**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `sort_by` | string | file_size | Sort field |

**Response (200):**
```json
{
  "files": [
    {
      "id": "uuid",
      "file_name": "string",
      "file_type": "string",
      "file_size": 1024,
      "application_id": "uuid",
      "uploaded_at": "timestamp",
      "application_company": "string",
      "application_title": "string"
    }
  ]
}
```

---

## Company Endpoints

### GET /api/companies
List companies with pagination. **Public.**

| Param | Type | Default |
|-------|------|---------|
| `limit` | int | 50 |
| `offset` | int | 0 |

### GET /api/companies/autocomplete
Company name autocomplete. **Public.**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (min 2 chars) |

**Response (200):**
```json
{
  "suggestions": [
    { "id": "uuid", "name": "string", "website": "string", "logo_url": "string", "domain": "string" }
  ],
  "query": "string"
}
```

### GET /api/companies/search
Search companies by name. **Public.**

| Param | Type | Default |
|-------|------|---------|
| `name` | string | required |
| `limit` | int | 50 |
| `offset` | int | 0 |

### GET /api/companies/:id
Get company. **Public.**

### POST /api/companies/select
Select or create company. **Protected.**

**Request:**
```json
{
  "company_id": "uuid (optional)",
  "company_name": "string",
  "domain": "string",
  "logo_url": "string",
  "website": "string"
}
```

### POST /api/companies
Create company. **Protected.**

### PUT /api/companies/:id
Update company. **Protected.**

### DELETE /api/companies/:id
Delete company. **Protected.**

---

## Job Endpoints

### GET /api/jobs
List user's jobs with filtering. **Protected.**

| Param | Type | Default |
|-------|------|---------|
| `search` | string | |
| `job_type` | string | |
| `location` | string | |
| `min_salary` | float | |
| `max_salary` | float | |
| `is_expired` | bool | |
| `company_id` | uuid | |
| `page` | int | 1 |
| `limit` | int | 50 |

**Response (200):**
```json
{
  "jobs": [...],
  "total_count": 15,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

### GET /api/jobs/with-details
List jobs with company details. **Protected.**

### GET /api/jobs/:id
Get job. **Protected.**

### POST /api/jobs
Create job. **Protected.**

**Request:**
```json
{
  "company_id": "uuid (or company_name)",
  "company_name": "string (or company_id)",
  "title": "string (required, max 255)",
  "job_description": "string (required)",
  "location": "string (required)",
  "job_type": "string (required, max 50)",
  "min_salary": 0,
  "max_salary": 0,
  "currency": "string"
}
```

### PUT /api/jobs/:id
Full update. **Protected.**

### PATCH /api/jobs/:id
Partial update. **Protected.**

### DELETE /api/jobs/:id
Delete job. **Protected.**

---

## Extract Endpoints

### POST /api/extract-job-url
Extract job information from URL. **Protected. Rate-limited: 30/day.**

**Request:**
```json
{ "url": "https://example.com/job/123" }
```

**Response (200):**
```json
{
  "job_title": "string",
  "company_name": "string",
  "location": "string",
  "job_type": "string",
  "salary_min": 0,
  "salary_max": 0,
  "job_description": "string",
  "extracted_at": "timestamp"
}
```

Warnings may be included if extraction is partial.

---

## Dashboard Endpoints

### GET /api/dashboard/stats
Dashboard statistics. **Protected.**

**Response (200):**
```json
{
  "applications_count": 20,
  "interviews_count": 8,
  "assessments_count": 3,
  "completed_applications": 5,
  "pending_interviews": 2,
  "pending_assessments": 1
}
```

### GET /api/dashboard/upcoming
Upcoming interviews and assessments. **Protected.**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 4 | Max items |
| `type` | string | all | all, interviews, assessments |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "type": "interview|assessment",
    "title": "string",
    "scheduled_date": "timestamp",
    "company_name": "string",
    "application_id": "uuid"
  }
]
```

---

## Notification Endpoints

### GET /api/notifications
List notifications. **Protected.**

| Param | Type | Default |
|-------|------|---------|
| `read` | bool | |
| `limit` | int | 20 |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "string",
    "message": "string",
    "type": "string",
    "read": false,
    "created_at": "timestamp",
    "read_at": "timestamp"
  }
]
```

### GET /api/notifications/count
Unread notification count. **Protected.**

**Response (200):**
```json
{ "unread_count": 3 }
```

### PATCH /api/notifications/:id/read
Mark notification as read. **Protected.**

### PATCH /api/notifications/mark-all-read
Mark all as read. **Protected.**

**Response (200):**
```json
{ "marked_count": 5 }
```

### GET /api/users/notification-preferences
Get notification preferences. **Protected.**

**Response (200):**
```json
{
  "user_id": "uuid",
  "interview_24h": true,
  "interview_1h": true,
  "assessment_3d": true,
  "assessment_1d": true,
  "assessment_1h": false,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### PUT /api/users/notification-preferences
Update notification preferences. **Protected.**

**Request:**
```json
{
  "interview_24h": true,
  "interview_1h": true,
  "assessment_3d": true,
  "assessment_1d": true,
  "assessment_1h": false
}
```

---

## Timeline Endpoints

### GET /api/timeline
Chronological timeline of events. **Protected.**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | all | all, interviews, assessments |
| `range` | string | all | all, today, week, month |
| `page` | int | 1 | |
| `per_page` | int | 20 | Max 100 |

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "interview|assessment|application",
      "title": "string",
      "date": "timestamp",
      "company_name": "string",
      "status": "string"
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 20
}
```

---

## Search Endpoints

### GET /api/search
Full-text search across all entities. **Protected.**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Search query (min 3 chars) |
| `limit` | int | 10 | Max 50 |

**Response (200):**
```json
{
  "applications": [{ "id": "uuid", "type": "application", "title": "string", "company_name": "string", "excerpt": "string" }],
  "interviews": [{ "id": "uuid", "type": "interview", "title": "string", "company_name": "string", "excerpt": "string" }],
  "assessments": [{ "id": "uuid", "type": "assessment", "title": "string", "company_name": "string", "excerpt": "string" }],
  "notes": [{ "id": "uuid", "type": "note", "title": "string", "company_name": "string", "excerpt": "string" }],
  "total_count": 15,
  "query": "string"
}
```

---

## Export Endpoints

### GET /api/export/applications
Export applications as CSV. **Protected.**

Accepts same query params as application list for filtering. Response is a CSV file download with headers: Company, Job Title, Status, Application Date, Description, Notes.

### GET /api/export/interviews
Export interviews as CSV. **Protected.**

Response is a CSV file download with headers: Company, Job Title, Round Number, Interview Type, Scheduled Date, Questions, Answers, Feedback.

### GET /api/export/full
Export full backup as JSON. **Protected.**

**Response (200):**
```json
{
  "export_date": "RFC3339 timestamp",
  "user": { "id": "uuid", "email": "string", "name": "string", "created_at": "timestamp" },
  "applications": [...],
  "interviews": [...],
  "assessments": [...]
}
```

---

## Health Check

### GET /health
Health check endpoint. **Public. Not under /api prefix.**

**Response (200):**
```json
{ "status": "ok" }
```

---

## Endpoint Summary

| Domain | Endpoints | Auth |
|--------|-----------|------|
| Auth | 7 | Mixed |
| Applications | 12 | Protected |
| Interviews | 7 | Protected |
| Interviewers | 3 | Protected |
| Interview Questions | 4 | Protected |
| Interview Notes | 1 | Protected |
| Assessments | 9 | Protected |
| Files | 9 | Protected |
| Companies | 8 | Mixed |
| Jobs | 7 | Protected |
| Extract | 1 | Protected |
| Dashboard | 2 | Protected |
| Notifications | 6 | Protected |
| Timeline | 1 | Protected |
| Search | 1 | Protected |
| Export | 3 | Protected |
| Health | 1 | Public |
| **Total** | **82** | |

**Rate-limited endpoints:** Auth (register, login, refresh, OAuth), file presigned-upload (50/day), extract-job-url (30/day).
