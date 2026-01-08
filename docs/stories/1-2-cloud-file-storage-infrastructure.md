# Story 1.2: Cloud File Storage Infrastructure

Status: ready-for-dev

## Story

As a job seeker,
I want to upload and store my resumes and cover letters on ditto's infrastructure,
so that I can access my documents from any device without managing local files.

## Acceptance Criteria

### Given I am viewing an application detail page

**AC-1**: File Upload Support
- **When** I upload a resume or cover letter (PDF, DOCX, TXT, up to 5MB)
- **Then** the file is securely stored in S3-compatible cloud storage with a unique identifier

**AC-2**: Database Linking
- **When** a file is uploaded
- **Then** the file is linked to my application record in the database with proper foreign keys

**AC-3**: Cross-Device Access
- **When** I download a file from any device after logging in
- **Then** the file downloads correctly with proper authentication and access control

**AC-4**: File Replacement
- **When** I replace an uploaded file
- **Then** the old file is soft-deleted and the new file takes its place

**AC-5**: File Deletion
- **When** I delete an uploaded file
- **Then** the file is soft-deleted from the database and S3 with proper cleanup

**AC-6**: Storage Quota Enforcement
- **When** I approach or reach the 100MB per-user limit
- **Then** I receive clear feedback about my storage usage and uploads are blocked at the limit

### Edge Cases
- File size >5MB → Return 400 error "File exceeds 5MB limit"
- Unsupported file type (not PDF/DOCX/TXT) → Return 400 error "Unsupported file type"
- Storage quota exceeded → Return 403 error "Storage limit reached. Please delete old files."
- S3 upload fails → Return 500 error with retry guidance
- Invalid presigned URL (expired) → Return 410 error "Upload link expired. Please try again."

## Tasks / Subtasks

### Backend Development

- [ ] **Task 1**: Create file storage database schema (AC: #1, #2)
  - [ ] 1.1: Create migration `000007_create_file_system.up.sql`
  - [ ] 1.2: Define `files` table with fields: id, user_id, application_id, interview_id (nullable), file_name, file_type, file_size, s3_key, uploaded_at, deleted_at, created_at, updated_at
  - [ ] 1.3: Add indexes on user_id, application_id for query performance
  - [ ] 1.4: Add foreign key constraints with CASCADE on user deletion

- [ ] **Task 2**: Create file model and repository (AC: #1, #2, #5)
  - [ ] 2.1: Define `File` struct in `internal/models/file.go`
  - [ ] 2.2: Create `FileRepository` interface with CRUD operations
  - [ ] 2.3: Implement repository with GORM/sqlx
  - [ ] 2.4: Add soft delete functionality
  - [ ] 2.5: Add storage quota calculation method (sum file_size by user_id)

- [ ] **Task 3**: Configure AWS S3 client (AC: #1, #3)
  - [ ] 3.1: Add AWS SDK Go v2 dependencies to `go.mod`
  - [ ] 3.2: Create `internal/services/s3_service.go`
  - [ ] 3.3: Initialize S3 client with credentials from environment variables
  - [ ] 3.4: Configure bucket name and region from env vars
  - [ ] 3.5: Add connection validation on startup

- [ ] **Task 4**: Implement presigned URL generation (AC: #1, #3)
  - [ ] 4.1: Create `GeneratePresignedPutURL(fileName, fileType string)` method for uploads
  - [ ] 4.2: Create `GeneratePresignedGetURL(s3Key string)` method for downloads
  - [ ] 4.3: Set URL expiry to 15 minutes (900 seconds)
  - [ ] 4.4: Generate unique S3 keys using pattern: `{user_id}/{uuid}.{extension}`
  - [ ] 4.5: Add error handling for AWS SDK failures

- [ ] **Task 5**: Create file upload API endpoint (AC: #1, #2, #6)
  - [ ] 5.1: Create `POST /api/files/presigned-upload` handler
  - [ ] 5.2: Accept query params: file_name, file_type, application_id (optional)
  - [ ] 5.3: Validate file type (whitelist: PDF, DOCX, TXT MIME types)
  - [ ] 5.4: Validate file size <5MB (client-provided, double-check on confirm)
  - [ ] 5.5: Check user storage quota before issuing presigned URL
  - [ ] 5.6: Return presigned URL, s3_key, and expires_in

- [ ] **Task 6**: Create file upload confirmation endpoint (AC: #2)
  - [ ] 6.1: Create `POST /api/files/confirm-upload` handler
  - [ ] 6.2: Accept request body: s3_key, file_name, file_type, file_size, application_id
  - [ ] 6.3: Verify file exists in S3 (HEAD request)
  - [ ] 6.4: Create file record in database
  - [ ] 6.5: Return file metadata including download URL

- [ ] **Task 7**: Create file download endpoint (AC: #3)
  - [ ] 7.1: Create `GET /api/files/:id` handler
  - [ ] 7.2: Fetch file record from database
  - [ ] 7.3: Verify user owns the file (403 if unauthorized)
  - [ ] 7.4: Generate presigned GET URL from S3
  - [ ] 7.5: Return presigned URL with expiry time

- [ ] **Task 8**: Create file deletion endpoint (AC: #5)
  - [ ] 8.1: Create `DELETE /api/files/:id` handler
  - [ ] 8.2: Verify user owns the file
  - [ ] 8.3: Soft delete file record (set deleted_at)
  - [ ] 8.4: Update user storage quota (subtract file_size)
  - [ ] 8.5: Schedule S3 object deletion (background job or immediate)

- [ ] **Task 9**: Create storage quota endpoint (AC: #6)
  - [ ] 9.1: Create `GET /api/users/storage-stats` handler
  - [ ] 9.2: Query sum of file_size for current user (WHERE deleted_at IS NULL)
  - [ ] 9.3: Calculate usage percentage (used / 100MB)
  - [ ] 9.4: Return JSON: {used_bytes, total_bytes, file_count, usage_percentage, warning, limit_reached}
  - [ ] 9.5: Set warning=true when usage >90%

- [ ] **Task 10**: API route registration (AC: All)
  - [ ] 10.1: Create `internal/routes/file_routes.go`
  - [ ] 10.2: Register all file endpoints under /api group
  - [ ] 10.3: Apply authentication middleware to all routes
  - [ ] 10.4: Apply CORS middleware

### Testing

- [ ] **Task 11**: Unit tests for file repository (AC: All)
  - [ ] 11.1: Test file creation with valid data
  - [ ] 11.2: Test file retrieval by ID and user_id
  - [ ] 11.3: Test soft delete functionality
  - [ ] 11.4: Test storage quota calculation (sum file_size)
  - [ ] 11.5: Test query performance with indexes

- [ ] **Task 12**: Unit tests for S3 service (AC: #1, #3)
  - [ ] 12.1: Test presigned PUT URL generation
  - [ ] 12.2: Test presigned GET URL generation
  - [ ] 12.3: Test URL expiry validation
  - [ ] 12.4: Test S3 key uniqueness
  - [ ] 12.5: Mock AWS SDK calls

- [ ] **Task 13**: Integration tests for file upload flow (AC: #1, #2, #6)
  - [ ] 13.1: Test full upload flow: presigned URL → mock S3 upload → confirm
  - [ ] 13.2: Test file type validation (accept PDF/DOCX/TXT, reject others)
  - [ ] 13.3: Test file size validation (>5MB rejected)
  - [ ] 13.4: Test storage quota enforcement (reject at 100MB)
  - [ ] 13.5: Test authentication requirement

- [ ] **Task 14**: Integration tests for file download and delete (AC: #3, #4, #5)
  - [ ] 14.1: Test file download with valid auth
  - [ ] 14.2: Test download with invalid auth (403)
  - [ ] 14.3: Test file not found (404)
  - [ ] 14.4: Test file deletion updates storage quota
  - [ ] 14.5: Test soft delete preserves record

## Dev Notes

### Architecture Constraints

**From Epic 1 Tech Spec:**
- **File Storage**: AWS S3 with presigned URLs (no credentials on frontend) [Source: docs/tech-spec-epic-1.md#Dependencies]
- **S3 SDK**: AWS SDK Go v2 (latest) [Source: docs/tech-spec-epic-1.md#Backend-Dependencies]
- **Database Pattern**: Repository layer with GORM/sqlx [Source: docs/tech-spec-epic-1.md#System-Architecture-Alignment]
- **Soft Deletes**: All tables use `deleted_at` column [Source: docs/architecture.md#Database-Patterns]

**From Architecture Document:**
- **Error Format**: Standardized `{error, code, details}` JSON [Source: docs/architecture.md#Error-Handling]
- **API Structure**: `/api/` prefix with authentication middleware [Source: docs/architecture.md#API-Structure]
- **Security**: HTTPS only, JWT authentication [Source: docs/architecture.md#Security]

**Performance Requirements:**
- File upload within 10 seconds for 5MB files (NFR-1.5) [Source: docs/PRD.md#NFR-1.5]
- API response <500ms for presigned URL generation (NFR-1.2) [Source: docs/PRD.md#NFR-1.2]
- Storage quota query <200ms (Epic 1 specific) [Source: docs/tech-spec-epic-1.md#Performance]

**Security Requirements:**
- File type validation (whitelist: PDF, DOCX, TXT) [Source: docs/tech-spec-epic-1.md#Security]
- S3 bucket private, presigned URLs only (NFR-2.2) [Source: docs/tech-spec-epic-1.md#Security]
- No AWS credentials exposed to frontend [Source: docs/tech-spec-epic-1.md#Security]
- Presigned URLs expire after 15 minutes [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces]

### Learnings from Previous Story

**From Story 1-1-job-url-information-extraction-service (Status: done)**

- **New Service Created**: URL extraction service at `backend/internal/services/urlextractor/` - pattern to follow for S3 service
- **Repository Pattern**: File repository should follow same structure as existing repositories (`backend/internal/repository/`)
- **Error Handling**: Use `pkg/errors` and `pkg/response` packages for standardized error responses - already established pattern
- **Testing Setup**: Integration tests at `backend/tests/integration/` - follow established test structure
- **Middleware Pattern**: Rate limiting middleware created at `internal/middleware/rate_limit.go` - reuse for file uploads if needed
- **Security Best Practice**: HTML sanitization using bluemonday - consider file validation similarly rigorous
- **HTTP Retry Logic**: Implemented with exponential backoff in Story 1.1 - may be applicable for S3 operations
- **Structured Logging**: Platform/duration/success tracking - apply same pattern for file operations

**Key Interfaces/Services to REUSE**:
- `pkg/errors.ErrorResponse` - Use for file upload errors
- `pkg/response.SuccessResponse` - Use for successful file operations
- `internal/middleware/auth.go` - Apply to all file routes
- Testing patterns from `backend/internal/services/urlextractor/*_test.go` - Follow table-driven test style

**Architectural Consistency**:
- Story 1.1 established service layer pattern - create S3Service similarly
- Handler → Service → Repository layering confirmed working
- Context propagation for timeouts demonstrated - apply to S3 operations

[Source: docs/stories/1-1-job-url-information-extraction-service.md#Dev-Agent-Record]
[Source: docs/stories/1-1-job-url-information-extraction-service.md#Senior-Developer-Review]

### Project Structure Notes

**Expected File Locations** (per brownfield Go project structure):
```
backend/
├── internal/
│   ├── models/
│   │   └── file.go              # File model struct
│   ├── repository/
│   │   └── file_repository.go   # File CRUD operations
│   ├── services/
│   │   └── s3_service.go        # AWS S3 presigned URL service
│   ├── handlers/
│   │   └── file.go              # HTTP handlers for file operations
│   ├── routes/
│   │   └── file_routes.go       # Route registration
│   └── middleware/
│       └── auth.go              # Existing: Authentication (reuse)
├── migrations/
│   └── 000007_create_file_system.up.sql  # Database schema
└── tests/
    └── integration/
        └── file_test.go         # Integration tests

frontend/
├── src/
│   ├── services/
│   │   └── fileService.ts       # API client (Story 1.4)
│   ├── components/shared/
│   │   └── FileUpload/          # Upload component (Story 1.4)
│   ├── lib/
│   │   └── s3.ts                # S3 client utilities (Story 1.4)
│   └── types/
│       └── file.ts              # TypeScript interfaces (Story 1.4)
```

**Database Schema** (from Tech Spec):
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(500) NOT NULL UNIQUE,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_user_id ON files(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_application_id ON files(application_id) WHERE deleted_at IS NULL;
```

### Implementation Guidance

**AWS S3 Configuration** (from Tech Spec):
```go
// Environment variables required:
// AWS_REGION=us-east-1
// AWS_S3_BUCKET=ditto-files-production
// AWS_ACCESS_KEY_ID=xxxxx
// AWS_SECRET_ACCESS_KEY=xxxxx
// AWS_S3_PRESIGNED_URL_EXPIRY=900  // 15 minutes

// S3 Service initialization:
import (
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/aws/aws-sdk-go-v2/aws"
)

type S3Service struct {
    client *s3.Client
    bucket string
}

// Presigned URL generation for PUT (upload)
func (s *S3Service) GeneratePresignedPutURL(s3Key string, contentType string, expiry time.Duration) (string, error) {
    // Use s3.NewPresignClient with PutObjectInput
}

// Presigned URL generation for GET (download)
func (s *S3Service) GeneratePresignedGetURL(s3Key string, expiry time.Duration) (string, error) {
    // Use s3.NewPresignClient with GetObjectInput
}
```

**File Type Validation**:
```go
var allowedFileTypes = map[string]bool{
    "application/pdf": true,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, // DOCX
    "text/plain": true, // TXT
}

func validateFileType(mimeType string) error {
    if !allowedFileTypes[mimeType] {
        return errors.New("unsupported file type")
    }
    return nil
}
```

**Storage Quota Enforcement**:
```go
const MaxStoragePerUser = 104857600 // 100MB in bytes

func (r *FileRepository) GetUserStorageUsed(userID uuid.UUID) (int64, error) {
    var totalBytes int64
    err := r.db.Model(&File{}).
        Where("user_id = ? AND deleted_at IS NULL", userID).
        Select("COALESCE(SUM(file_size), 0)").
        Scan(&totalBytes).Error
    return totalBytes, err
}
```

**API Response Formats** (from Tech Spec):
```go
// Presigned upload response
type PresignedUploadResponse struct {
    PresignedURL string `json:"presigned_url"`
    S3Key        string `json:"s3_key"`
    ExpiresIn    int    `json:"expires_in"` // seconds
}

// File metadata response
type FileResponse struct {
    ID          string    `json:"id"`
    FileName    string    `json:"file_name"`
    FileType    string    `json:"file_type"`
    FileSize    int64     `json:"file_size"`
    S3Key       string    `json:"s3_key"`
    DownloadURL string    `json:"download_url"` // API endpoint
    UploadedAt  time.Time `json:"uploaded_at"`
}

// Storage stats response
type StorageStatsResponse struct {
    UsedBytes       int64  `json:"used_bytes"`
    TotalBytes      int64  `json:"total_bytes"`
    FileCount       int    `json:"file_count"`
    UsagePercentage int    `json:"usage_percentage"`
    Warning         bool   `json:"warning"`          // true when >90%
    LimitReached    bool   `json:"limit_reached"`    // true when at 100MB
}
```

### Testing Standards

**Unit Test Coverage Target:** 70%+ per NFR-5.3 [Source: docs/PRD.md#Non-Functional-Requirements]

**Test Patterns** (from Story 1.1):
- Use table-driven tests for validation logic
- Mock AWS SDK calls using interfaces
- Test error paths and edge cases
- Follow existing test structure in `backend/tests/`

**Integration Test Strategy**:
- Mock S3 uploads (don't hit real AWS in tests)
- Use test database with transaction rollback
- Test full request/response cycle through Gin handlers
- Validate JSON response structure and status codes

**S3 Mock Strategy**:
```go
// Create interface for testability
type S3ClientInterface interface {
    GeneratePresignedPutURL(s3Key string, contentType string, expiry time.Duration) (string, error)
    GeneratePresignedGetURL(s3Key string, expiry time.Duration) (string, error)
    HeadObject(s3Key string) (bool, error)
}

// Mock implementation for tests
type MockS3Client struct {
    // Mock responses
}
```

### Security Considerations

**From Epic 1 Tech Spec Security Section**:
1. **S3 Bucket Configuration**: Private bucket, no public access
2. **Presigned URL Security**: 15-minute expiry prevents URL sharing
3. **File Type Whitelist**: Only PDF, DOCX, TXT to prevent executable uploads
4. **Authentication**: All endpoints require JWT authentication
5. **Authorization**: Users can only access their own files (user_id check)
6. **Input Validation**: File size, type, and quota enforcement server-side
7. **S3 Key Format**: UUID-based to prevent guessing (`{user_id}/{uuid}.{ext}`)

**XSS Prevention**:
- File downloads via presigned URLs (not served through API)
- No file content parsing or display in this story
- Content-Type header controlled by S3

### References

- **Epic 1 Tech Spec**: Complete technical specification [Source: docs/tech-spec-epic-1.md]
- **PRD**: Functional Requirement FR-1.7 (Resume and Document Storage) [Source: docs/PRD.md#FR-1.7]
- **Architecture**: S3 Integration Pattern [Source: docs/architecture.md#File-Storage]
- **Performance NFR**: NFR-1.5 (File Upload <10s for 5MB) [Source: docs/PRD.md#NFR-1.5]
- **Security NFR**: NFR-2.3 (Input Validation) [Source: docs/PRD.md#NFR-2.3]
- **Dependency Docs**: AWS SDK Go v2 [Source: docs/tech-spec-epic-1.md#Backend-Dependencies]
- **Story 1.1**: URL Extraction Service (patterns to follow) [Source: docs/stories/1-1-job-url-information-extraction-service.md]

## Dev Agent Record

### Context Reference

- `docs/stories/1-2-cloud-file-storage-infrastructure.context.xml`

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes List

<!-- Will be populated during dev-story execution -->

### File List

<!-- Will be populated during dev-story execution -->
