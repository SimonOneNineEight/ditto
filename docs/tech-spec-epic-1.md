# Epic Technical Specification: Enhanced Application Management

Date: 2026-01-05
Author: Simon
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 completes the application tracking foundation with smart URL extraction and document management capabilities. Building on the existing brownfield infrastructure (Go + PostgreSQL + Next.js), this epic enables users to capture job applications in under 30 seconds using automated URL extraction and store resumes/cover letters centrally for cross-device access.

The epic introduces two key infrastructure components: (1) a web scraping service that extracts job details from major job boards (LinkedIn, Indeed, Glassdoor, AngelList) with intelligent caching and rate limiting, and (2) an S3-based file storage system that stores user documents with quota management. These capabilities directly address the PRD goal of eliminating manual data entry friction while maintaining data portability across devices.

## Objectives and Scope

**In Scope:**
- ✅ Job URL extraction service with support for 4 major job boards (LinkedIn, Indeed, Glassdoor, AngelList)
- ✅ S3-compatible file storage infrastructure for resumes and cover letters
- ✅ Application form integration with URL extraction and manual entry fallback
- ✅ File upload/download UI with progress tracking
- ✅ Enhanced application list filtering (status, company, date range)
- ✅ Storage quota management with usage visibility (100MB per user)

**Out of Scope (Post-MVP):**
- ❌ Additional job boards beyond the initial 4 platforms
- ❌ AI-powered resume optimization
- ❌ Chrome extension for one-click capture
- ❌ Automated application status updates via email parsing
- ❌ Advanced search features (full-text search deferred to Epic 5)

**Success Metrics:**
- Application creation time reduced from 2-3 minutes (manual) to <30 seconds (URL extraction)
- File upload success rate >95% for files <5MB
- Storage quota warnings trigger at 90MB usage
- Zero data loss for uploaded files

## System Architecture Alignment

This epic extends the existing **brownfield architecture**:

**Backend (Go 1.23 + Gin):**
- New handler: `internal/handlers/file.go` - File upload/download/delete operations
- New service: `internal/services/s3_service.go` - S3 presigned URL generation
- Enhanced handler: `internal/handlers/application.go` - Add `/api/jobs/extract-url` endpoint
- New repository: `internal/repository/file_repository.go` - File metadata CRUD
- New migration: `000007_create_file_system.up.sql` - `files` table

**Frontend (Next.js 14 + React + shadcn/ui):**
- New component: `src/components/shared/FileUpload/` - Reusable file upload with S3 integration
- Enhanced component: `src/app/(app)/applications/` - Application form with URL extraction
- New service: `src/services/fileService.ts` - File API client
- New utility: `src/lib/s3.ts` - S3 client configuration

**Database (PostgreSQL 15):**
- New table: `files` (id, user_id, application_id, file_name, file_type, file_size, s3_key, uploaded_at, deleted_at)
- Enhanced table: `applications` - No schema changes, but URL extraction populates existing fields

**External Integration:**
- **AWS S3:** File storage with presigned URLs for direct client uploads (no credentials on frontend)
- **Job Boards:** HTTP scraping with 10-second timeout, 24-hour cache, 30 URLs/day rate limit

**Architectural Constraints:**
- Maintain consistency with existing repository pattern (GORM/sqlx)
- Use existing authentication (JWT tokens via middleware)
- Follow existing error handling patterns (`{error, code, details}` JSON format)
- Respect soft-delete pattern (`deleted_at` column)

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|---------------|----------------|--------|---------|-------|
| **URL Extraction Service** | Scrapes job boards and extracts structured data | Job URL (string) | `{title, company, description, requirements, source_url}` or error | Backend Handler |
| **S3 Service** | Generates presigned URLs for uploads/downloads | File metadata (name, type, size) | Presigned URL (string, expires in 15 min) | Backend Service |
| **File Repository** | CRUD operations for file metadata | File object | Database record | Backend Repository |
| **File Upload Component** | Handles client-side uploads to S3 with progress tracking | File object, presigned URL | Upload success/fail status | Frontend Component |
| **Storage Quota Service** | Calculates and enforces per-user storage limits | user_id | `{used_bytes, total_bytes, file_count}` | Backend Handler |
| **Application Form** | Integrated URL extraction + manual entry UI | User input (URL or manual fields) | Saved application record | Frontend Component |

### Data Models and Contracts

#### File Entity (`files` table)

```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE, -- Future: Epic 2
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- e.g., 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    file_size BIGINT NOT NULL, -- bytes
    s3_key VARCHAR(500) NOT NULL UNIQUE, -- S3 object key
    uploaded_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL, -- soft delete
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_user_id ON files(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_application_id ON files(application_id) WHERE deleted_at IS NULL;
```

**Field Descriptions:**
- `s3_key`: Unique identifier in S3 bucket, format: `{user_id}/{uuid}.{extension}`
- `file_type`: MIME type for validation and download headers
- `file_size`: Tracked for quota enforcement (100MB per user)
- `application_id` and `interview_id`: Nullable FK for flexible associations

#### URL Extraction Response Contract

```json
{
  "success": true,
  "data": {
    "title": "Senior Software Engineer",
    "company": "Acme Corp",
    "description": "<p>Full job description HTML...</p>",
    "requirements": "<p>Required skills...</p>",
    "source_url": "https://www.linkedin.com/jobs/view/123456"
  },
  "cached": true,
  "cached_until": "2026-01-06T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Extraction timeout after 10 seconds",
  "code": "EXTRACTION_TIMEOUT",
  "details": {
    "url": "https://example.com/job/123",
    "platform": "unknown"
  }
}
```

#### Storage Stats Contract

```json
{
  "used_bytes": 47185920,
  "total_bytes": 104857600,
  "file_count": 12,
  "usage_percentage": 45,
  "warning": false,
  "limit_reached": false
}
```

### APIs and Interfaces

#### File Upload Endpoint

```
POST /api/files/upload
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

Request Body:
- file: binary data (max 5MB)
- application_id: UUID (optional)
- interview_id: UUID (optional, Epic 2)

Response (201 Created):
{
  "id": "uuid",
  "file_name": "resume.pdf",
  "file_type": "application/pdf",
  "file_size": 245760,
  "s3_key": "user-123/abc-def.pdf",
  "download_url": "/api/files/{id}",
  "uploaded_at": "2026-01-05T10:30:00Z"
}

Error Responses:
- 400: File too large (>5MB)
- 400: Invalid file type (not PDF/DOCX/TXT)
- 403: Storage quota exceeded
- 413: Payload too large
- 500: S3 upload failed
```

#### File Download Endpoint

```
GET /api/files/:id
Authorization: Bearer {jwt_token}

Response (200 OK):
{
  "presigned_url": "https://s3.amazonaws.com/bucket/...",
  "expires_in": 900,
  "file_name": "resume.pdf"
}

Frontend behavior: Redirect to presigned_url or trigger download

Error Responses:
- 404: File not found
- 403: Unauthorized (file belongs to another user)
- 410: File deleted
```

#### Job URL Extraction Endpoint

```
POST /api/jobs/extract-url
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request Body:
{
  "url": "https://www.linkedin.com/jobs/view/123456"
}

Response (200 OK): See "URL Extraction Response Contract" above

Error Responses:
- 400: Invalid URL format
- 429: Rate limit exceeded (30/day)
- 504: Extraction timeout (>10 seconds)
- 422: Unsupported platform
```

#### Storage Stats Endpoint

```
GET /api/users/storage-stats
Authorization: Bearer {jwt_token}

Response (200 OK): See "Storage Stats Contract" above
```

### Workflows and Sequencing

#### Story 1.1-1.3: Application Creation with URL Extraction

```
User → Frontend: Clicks "Add Application"
Frontend → User: Displays form with "Paste URL" tab active

User → Frontend: Pastes job URL + clicks "Extract"
Frontend → Backend: POST /api/jobs/extract-url {url}
Backend → Job Board: HTTP GET (with timeout=10s)
Job Board → Backend: HTML response
Backend → Backend: Parse HTML, extract fields, cache for 24h
Backend → Frontend: JSON {title, company, description, requirements}
Frontend → Frontend: Auto-fill form fields (user can edit)
User → Frontend: Reviews + edits + clicks "Save"
Frontend → Backend: POST /api/applications {company, title, ...}
Backend → Database: INSERT INTO applications
Backend → Frontend: 201 Created {application_id}
Frontend → User: Navigate to application detail page
```

**Fallback Flow (Extraction Fails):**
```
Backend → Frontend: 504 Timeout or 422 Unsupported Platform
Frontend → User: Show error toast + keep form open
User → Frontend: Manually fills in fields
User → Frontend: Clicks "Save"
→ Continues with normal save flow
```

#### Story 1.2 + 1.4: File Upload to S3

```
User → Frontend: Clicks "Upload Resume" on application page
Frontend → User: Opens file picker (accept=".pdf,.docx,.txt")
User → Frontend: Selects resume.pdf (2.3 MB)

Frontend → Backend: GET /api/files/presigned-upload?file_name=resume.pdf&file_type=application/pdf&application_id={id}
Backend → AWS S3: GeneratePresignedPutURL (15 min expiry)
AWS S3 → Backend: Presigned URL string
Backend → Frontend: {presigned_url, s3_key, expires_in}

Frontend → AWS S3: PUT {presigned_url} (binary data, track progress with axios)
AWS S3 → Frontend: 200 OK

Frontend → Backend: POST /api/files/confirm-upload {s3_key, file_name, file_type, file_size, application_id}
Backend → Database: INSERT INTO files
Backend → Frontend: 201 Created {file_id, download_url}
Frontend → User: Show success toast + file appears in list
```

**Error Handling:**
- **File too large:** Frontend validates <5MB before upload, backend double-checks
- **Quota exceeded:** Backend checks before issuing presigned URL, returns 403
- **S3 upload fails:** Frontend shows retry button, doesn't confirm to backend
- **Network interruption:** Frontend detects via progress stall, shows "Retry" option

## Non-Functional Requirements

### Performance

**NFR-1.1: Page Load Time**
- Application list page loads in <2 seconds (existing + enhanced filters)
- Application detail page with uploaded files loads in <2 seconds
- Rationale: Users should not wait to see their applications

**NFR-1.4: Search Performance**
- Application filtering (status, company, date) returns results in <500ms for up to 1000 applications
- Uses database indexes on `status`, `company_name`, `application_date`
- Rationale: Instant feedback expected when filtering

**NFR-1.5: File Upload Performance**
- Files up to 5MB upload within 10 seconds on standard broadband (10 Mbps+)
- Progress indicator updates every 100ms
- Presigned URL generated in <200ms
- Rationale: Resumes are typically 100KB-2MB, must upload quickly

**Epic 1 Specific Targets:**
- URL extraction completes in <10 seconds (timeout enforced)
- Cache hit for duplicate URL: <50ms response time
- Storage stats calculation: <200ms (single SQL aggregate query)

### Security

**NFR-2.3: Input Validation**
- All user inputs validated on both client and server
- URL format validated with regex before scraping
- File type validated by MIME type (whitelist: PDF, DOCX, TXT)
- File size validated: <5MB (client) and server
- S3 keys use UUIDs to prevent guessing
- Rationale: Prevent malicious uploads and injection attacks

**NFR-2.2: Data Transmission**
- All API calls over HTTPS only (TLS 1.2+)
- Presigned S3 URLs expire after 15 minutes
- No AWS credentials exposed to frontend
- Rationale: Protect file uploads and metadata in transit

**Epic 1 Specific Security:**
- **Web Scraping Safety:** User-Agent headers, respect robots.txt, timeout enforced
- **S3 Bucket Security:** Private bucket, presigned URLs only, no public access
- **File Storage:** No executable file types allowed (PDF, DOCX, TXT only)
- **Rate Limiting:** 30 URL extractions per user per day (prevent scraping abuse)

### Reliability/Availability

**NFR-3.1: Uptime**
- Target 99% uptime for file storage and retrieval
- S3 provides 99.99% availability SLA
- Rationale: Users need reliable access to resumes for applications

**Epic 1 Specific Reliability:**
- **Graceful Degradation:** If S3 is unavailable, show cached file list but disable upload
- **Retry Logic:** Frontend retries failed S3 uploads up to 3 times with exponential backoff
- **Data Durability:** S3 provides 99.999999999% durability (11 nines)
- **Soft Deletes:** Files soft-deleted (`deleted_at`) to allow recovery within 30 days

### Observability

**Logging Requirements:**
- Log all file upload attempts (success/fail, file size, user_id)
- Log all URL extraction attempts (URL, platform detected, success/fail, duration)
- Log storage quota warnings (user_id, used_bytes, triggered_at)
- Log S3 errors with correlation IDs for debugging

**Metrics to Track:**
- URL extraction success rate by platform (LinkedIn, Indeed, etc.)
- Average extraction time by platform
- File upload success rate by file type and size
- Storage quota utilization histogram
- Cache hit rate for URL extractions

**Tracing:**
- Trace file upload flow: presigned URL generation → S3 upload → confirmation
- Trace URL extraction flow: validation → HTTP request → parsing → caching

## Dependencies and Integrations

### Backend Dependencies

**From `backend/go.mod`:**
```go
require (
    github.com/gin-gonic/gin v1.10.0        // Existing: Web framework
    github.com/aws/aws-sdk-go-v2 v1.32.6    // New: AWS SDK core
    github.com/aws/aws-sdk-go-v2/config v1.28.6 // New: AWS config
    github.com/aws/aws-sdk-go-v2/service/s3 v1.71.0 // New: S3 client
    github.com/aws/aws-sdk-go-v2/credentials v1.17.47 // New: AWS credentials
    github.com/PuerkitoBio/goquery v1.10.1  // New: HTML parsing for URL extraction
    gorm.io/gorm v1.25.7                    // Existing: ORM
    github.com/google/uuid v1.6.0           // Existing: UUID generation
)
```

**New Dependencies Added:**
- `aws-sdk-go-v2/service/s3`: Official AWS SDK for S3 operations (presigned URLs, object management)
- `goquery`: jQuery-like HTML parsing for web scraping job boards

### Frontend Dependencies

**From `frontend/package.json`:**
```json
{
  "dependencies": {
    "next": "^14.2.0",                  // Existing
    "react": "^18.3.0",                 // Existing
    "@aws-sdk/client-s3": "^3.927.0",   // New: S3 client for presigned URL validation
    "axios": "^1.7.0",                  // Existing: HTTP client
    "@radix-ui/react-progress": "^1.1.1", // Existing: Progress bar (shadcn/ui)
    "react-dropzone": "^14.3.0"         // New: File drag-drop upload
  }
}
```

**New Dependencies Added:**
- `@aws-sdk/client-s3`: Used for S3 presigned URL operations (optional, mainly for validation)
- `react-dropzone`: Drag-and-drop file upload UI component

### External Services

| Service | Purpose | Authentication | Rate Limits | Fallback |
|---------|---------|----------------|-------------|----------|
| **AWS S3** | File storage for resumes/cover letters | IAM credentials (backend only) | 3500 PUT/s, 5500 GET/s per prefix | None (critical service) |
| **LinkedIn Jobs** | URL scraping for job details | None (public pages) | Unofficial: ~30 requests/hour, use caching | Manual entry |
| **Indeed** | URL scraping for job details | None (public pages) | Unofficial: ~30 requests/hour | Manual entry |
| **Glassdoor** | URL scraping for job details | None (public pages) | Unofficial: ~30 requests/hour | Manual entry |
| **AngelList** | URL scraping for job details | None (public pages) | Unofficial: ~30 requests/hour | Manual entry |

**Integration Notes:**
- **Job boards have no official API:** Scraping relies on HTML structure, may break with site updates
- **Caching strategy:** 24-hour cache reduces scraping load and improves reliability
- **Rate limiting:** 30 URLs/day per user prevents abuse and respects job board servers
- **User-Agent:** Set to "ditto/1.0 (Job Search Tracker)" for transparency

### Environment Variables (New)

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=ditto-files-production
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_PRESIGNED_URL_EXPIRY=900  # 15 minutes in seconds

# URL Extraction
URL_EXTRACTION_TIMEOUT=10        # seconds
URL_EXTRACTION_CACHE_TTL=86400   # 24 hours in seconds
URL_EXTRACTION_RATE_LIMIT=30     # per user per day

# Storage Quotas
STORAGE_QUOTA_PER_USER=104857600 # 100MB in bytes
STORAGE_WARNING_THRESHOLD=0.9    # 90%
```

## Acceptance Criteria (Authoritative)

**AC-1.1: URL Extraction Success**
- Given a valid LinkedIn/Indeed/Glassdoor/AngelList job URL
- When user pastes URL and clicks "Extract"
- Then job title, company, description, and requirements are auto-filled within 10 seconds

**AC-1.2: URL Extraction Failure Handling**
- Given an invalid or unsupported URL
- When extraction fails or times out
- Then user sees error message and can proceed with manual entry without data loss

**AC-1.3: URL Extraction Caching**
- Given a URL that was extracted within the last 24 hours
- When the same URL is extracted again
- Then cached data is returned instantly (<50ms)

**AC-1.4: Rate Limiting**
- Given a user has extracted 30 URLs today
- When attempting to extract the 31st URL
- Then request is rejected with 429 status and clear error message

**AC-1.5: File Upload Success**
- Given a PDF/DOCX/TXT file <5MB
- When user uploads the file to an application
- Then file is stored in S3 and downloadable from any device

**AC-1.6: File Upload Validation**
- Given a file >5MB or wrong type
- When user attempts upload
- Then upload is rejected with clear error before S3 upload

**AC-1.7: Storage Quota Enforcement**
- Given a user has used 95MB of 100MB quota
- When attempting to upload a 10MB file
- Then upload is blocked with error: "Storage limit reached"

**AC-1.8: Storage Quota Visibility**
- Given a user has uploaded files
- When viewing settings page
- Then storage usage shows "X MB / 100 MB" with visual progress bar

**AC-1.9: File Download**
- Given a user has uploaded a resume
- When clicking download link
- Then file downloads with correct filename and content

**AC-1.10: File Deletion**
- Given a user has uploaded files
- When deleting a file
- Then file is soft-deleted and storage quota updates immediately

**AC-1.11: Application Filtering**
- Given multiple applications with different statuses
- When applying status filter "Interview"
- Then only applications in "Interview" status are displayed

**AC-1.12: Multi-Filter Combination**
- Given filters: status=Interview, company=Google, date_from=2026-01-01
- When all filters applied
- Then only matching applications shown (AND logic)

## Traceability Mapping

| AC # | Spec Section(s) | Component(s)/API(s) | Test Idea |
|------|----------------|---------------------|-----------|
| AC-1.1 | APIs (URL Extraction) | `POST /api/jobs/extract-url`, URL extraction service | Integration test: mock job board HTML, verify parsing |
| AC-1.2 | Workflows (Fallback Flow) | Frontend form state preservation | E2E test: trigger timeout, verify form retains data |
| AC-1.3 | Data Models (Cache) | Redis or PostgreSQL cache table | Unit test: verify cache hit returns <50ms |
| AC-1.4 | Security (Rate Limiting) | Middleware rate limit check | Integration test: send 31 requests, verify 429 on last |
| AC-1.5 | Workflows (File Upload) | S3 service, `POST /api/files/upload` | Integration test: upload file, verify S3 object exists |
| AC-1.6 | Security (Validation) | File upload handler validation | Unit test: submit 10MB file, verify 400 error |
| AC-1.7 | Dependencies (Storage Quotas) | `GET /api/users/storage-stats`, quota check | Integration test: set user at 95MB, attempt 10MB upload |
| AC-1.8 | Frontend Components | StorageQuotaWidget | Component test: render with mock data, verify UI |
| AC-1.9 | APIs (File Download) | `GET /api/files/:id`, S3 presigned URL | Integration test: download file, verify content matches |
| AC-1.10 | Data Models (Soft Delete) | File repository soft delete | Unit test: delete file, verify `deleted_at` set, quota updated |
| AC-1.11 | APIs (Application Filtering) | `GET /api/applications?status=X` | Integration test: filter by status, verify results |
| AC-1.12 | Workflows (Multi-Filter) | Application list frontend logic | E2E test: apply 3 filters, verify AND logic |

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: Job Board Scraping Fragility**
- **Description:** Job boards frequently change HTML structure, breaking scraper
- **Impact:** High - URL extraction fails for users
- **Mitigation:**
  - Implement robust CSS selectors and fallback strategies
  - 24-hour cache reduces scraping frequency
  - Manual entry always available as fallback
  - Monitor extraction success rate by platform, alert on drop
- **Owner:** Backend team

**RISK-2: S3 Cost Overrun**
- **Description:** Users upload many large files, S3 costs exceed budget
- **Impact:** Medium - Operational cost
- **Mitigation:**
  - Enforce 100MB per-user quota
  - Monitor aggregate storage monthly
  - S3 Standard tier is $0.023/GB/month (~$0.02/user at 100MB)
  - 1000 users = $23/month (acceptable for MVP)
- **Owner:** Product + Backend

**RISK-3: Rate Limiting Too Restrictive**
- **Description:** 30 URLs/day may frustrate heavy users during job search
- **Impact:** Low - User friction
- **Mitigation:**
  - Monitor rate limit hit rate
  - Increase to 50/day if <5% of users hit limit
  - Cache extends effective limit (repeat URLs don't count)
- **Owner:** Product

### Assumptions

**ASSUMPTION-1:** AWS S3 is accessible and reliable (99.99% SLA)
**ASSUMPTION-2:** Job boards allow scraping for personal use (no legal restriction)
**ASSUMPTION-3:** Users primarily apply to <30 jobs per day (rate limit sufficient)
**ASSUMPTION-4:** Resume files are typically <2MB (5MB limit sufficient)
**ASSUMPTION-5:** Existing application table schema supports all extracted fields

### Open Questions

**QUESTION-1:** Should we support video resume uploads (MP4)?
- **Answer:** No, defer to post-MVP (Epic 1 scope: PDF, DOCX, TXT only)

**QUESTION-2:** Should we validate resume content (e.g., detect blank PDFs)?
- **Answer:** No, basic MIME type validation sufficient for MVP

**QUESTION-3:** What happens to uploaded files when user deletes account?
- **Answer:** Cascade delete from `files` table, S3 objects deleted via cron job (defer to Epic 6)

## Test Strategy Summary

### Unit Tests (Backend)

**File Repository Tests:**
- Create file record with valid data → success
- Create file with duplicate s3_key → error
- Soft delete file → `deleted_at` set, visible in queries with `WHERE deleted_at IS NULL`
- Calculate storage quota → sum file_size grouped by user_id

**URL Extraction Service Tests:**
- Parse LinkedIn HTML → extract title, company, description
- Parse Indeed HTML → extract fields
- Timeout after 10 seconds → return error
- Cache hit for duplicate URL → return cached data

**S3 Service Tests:**
- Generate presigned PUT URL → valid URL with 15 min expiry
- Generate presigned GET URL → valid download URL

### Integration Tests (Backend)

**File Upload Flow:**
1. POST /api/files/presigned-upload → receive presigned URL
2. Mock S3 upload success
3. POST /api/files/confirm-upload → file record created
4. GET /api/files/:id → presigned download URL returned
5. DELETE /api/files/:id → file soft-deleted

**URL Extraction Flow:**
1. POST /api/jobs/extract-url with valid URL → 200 OK with data
2. POST same URL within 24h → 200 OK from cache (<50ms)
3. POST unsupported URL → 422 Unprocessable Entity
4. POST 31st URL in a day → 429 Too Many Requests

**Storage Quota:**
1. Upload files totaling 95MB → success
2. Attempt 10MB upload → 403 Forbidden (quota exceeded)
3. Delete 10MB file → quota updated, new upload succeeds

### Component Tests (Frontend)

**FileUpload Component:**
- Drag and drop PDF file → upload progress shown
- Upload completes → success message, file appears in list
- Upload fails → error toast, retry button shown
- File size >5MB → validation error before upload

**Application Form:**
- Paste URL + click Extract → loading state shown
- Extraction succeeds → form fields auto-filled
- Extraction fails → error shown, form still editable
- Toggle to manual entry → URL field hidden

### E2E Tests

**Story 1.1-1.3: Full Application Creation Flow**
1. User opens "Add Application" form
2. Pastes LinkedIn job URL
3. Clicks "Extract" → sees loading spinner
4. Job title, company auto-fill within 10 seconds
5. User edits description
6. Clicks "Save" → navigates to application detail page
7. Verify application exists in database

**Story 1.2 + 1.4: File Upload Flow**
1. User opens application detail page
2. Clicks "Upload Resume"
3. Selects PDF file (2MB)
4. Progress bar reaches 100%
5. File appears in uploaded files list
6. Click download → file downloads correctly
7. Click delete → confirmation prompt → file removed

### Testing Coverage Goal

- **Backend unit tests:** 70% code coverage on repository and service layers
- **Backend integration tests:** All Epic 1 endpoints covered
- **Frontend component tests:** FileUpload, Application Form
- **E2E tests:** 2 critical user flows (URL extraction + file upload)

### Testing Tools

- **Backend:** Go testing framework, testify assertions, mock S3 SDK
- **Frontend:** Jest, React Testing Library, MSW for API mocking
- **E2E:** Playwright or Cypress (defer to Epic 6 for full suite)
