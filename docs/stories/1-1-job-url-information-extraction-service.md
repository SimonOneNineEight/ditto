# Story 1.1: Job URL Information Extraction Service

Status: ready-for-dev

## Story

As a job seeker,
I want to paste a job posting URL and have the job details automatically extracted,
so that I can save time on manual data entry and quickly capture opportunities.

## Acceptance Criteria

### Given a user has a job posting URL
**When** they provide the URL to the extraction service
**Then** the system should:

1. **AC-1**: Accept URLs from supported platforms (LinkedIn, Indeed, Glassdoor, AngelList)
2. **AC-2**: Extract job title, company name, location, and job description within 10 seconds
3. **AC-3**: Return structured JSON data with extracted fields
4. **AC-4**: Handle extraction failures gracefully with clear error messages
5. **AC-5**: Return partial data if some fields cannot be extracted
6. **AC-6**: Validate URL format before attempting extraction
7. **AC-7**: Implement timeout protection (10-second hard limit per PRD NFR-1.2)

### Edge Cases
- Invalid URL format → Return 400 error with "Invalid URL format" message
- Unsupported platform → Return 400 error listing supported platforms
- Network timeout → Return 408 error with "Request timeout" message
- Parsing failure → Return 200 with partial data and warnings array

## Tasks / Subtasks

### Backend Development

- [ ] **Task 1**: Create URL extraction service infrastructure (AC: #1, #2, #6)
  - [ ] 1.1: Create `internal/services/url_extractor` package
  - [ ] 1.2: Define `ExtractRequest` and `ExtractResponse` structs
  - [ ] 1.3: Implement URL validation (format check, protocol validation)
  - [ ] 1.4: Create platform detector (identify LinkedIn/Indeed/Glassdoor/AngelList from URL)

- [ ] **Task 2**: Implement platform-specific parsers (AC: #2, #3)
  - [ ] 2.1: Create `LinkedInParser` with HTML selector mappings
  - [ ] 2.2: Create `IndeedParser` with HTML selector mappings
  - [ ] 2.3: Create `GlassdoorParser` with HTML selector mappings
  - [ ] 2.4: Create `AngelListParser` with HTML selector mappings
  - [ ] 2.5: Implement generic fallback parser (extract title, meta tags)

- [ ] **Task 3**: Build HTTP client with timeout controls (AC: #7)
  - [ ] 3.1: Configure Go HTTP client with 10-second timeout
  - [ ] 3.2: Implement retry logic (max 2 retries with exponential backoff)
  - [ ] 3.3: Add User-Agent header to prevent bot blocking

- [ ] **Task 4**: Create extraction API endpoint (AC: #3, #4, #5)
  - [ ] 4.1: Create `POST /api/v1/extract/job-url` handler
  - [ ] 4.2: Implement request validation middleware
  - [ ] 4.3: Wire service to handler with error mapping
  - [ ] 4.4: Return structured JSON response with extracted fields + warnings

- [ ] **Task 5**: Error handling and logging (AC: #4)
  - [ ] 5.1: Implement error types (ValidationError, TimeoutError, ParsingError)
  - [ ] 5.2: Add structured logging for extraction attempts (platform, duration, success)
  - [ ] 5.3: Return user-friendly error messages per PRD NFR-3.3

### Testing

- [ ] **Task 6**: Unit tests for extraction service (AC: All)
  - [ ] 6.1: Test URL validation (valid/invalid formats)
  - [ ] 6.2: Test platform detection logic
  - [ ] 6.3: Test each platform parser with mock HTML
  - [ ] 6.4: Test fallback parser behavior
  - [ ] 6.5: Test timeout handling
  - [ ] 6.6: Test partial data extraction scenarios

- [ ] **Task 7**: Integration tests for API endpoint (AC: All)
  - [ ] 7.1: Test successful extraction from all 4 platforms (using test fixtures)
  - [ ] 7.2: Test error cases (invalid URL, unsupported platform, timeout)
  - [ ] 7.3: Test response format validation
  - [ ] 7.4: Test API response times (<500ms per NFR-1.2)

## Dev Notes

### Architecture Constraints

**From Architecture Document:**
- **Technology Stack**: Go 1.23 backend with existing Gin framework [Source: docs/architecture.md#Technology-Stack]
- **Error Handling Pattern**: Use standardized error format `{error, code, details}` [Source: docs/architecture.md#Error-Handling]
- **API Versioning**: All endpoints under `/api/v1/` prefix [Source: docs/architecture.md#API-Structure]
- **Logging**: Use structured logging (logrus/zap) with JSON output [Source: docs/architecture.md#Logging]

**Performance Requirements:**
- API response time target: <500ms (90th percentile) [Source: docs/PRD.md#NFR-1.2]
- Extraction timeout: 10 seconds hard limit [Source: docs/PRD.md#FR-1.2]

**Rate Limiting (from solutioning-gate-check):**
- Implement rate limiting: 30 URL extractions per user per day [Source: docs/PRD.md#NFR-2.5]
- Return 429 Too Many Requests with Retry-After header when limit exceeded

### Project Structure Notes

**Expected File Locations** (per brownfield Go project structure):
```
backend/
├── internal/
│   ├── services/
│   │   └── url_extractor/
│   │       ├── extractor.go          # Main service interface
│   │       ├── parsers/
│   │       │   ├── linkedin.go
│   │       │   ├── indeed.go
│   │       │   ├── glassdoor.go
│   │       │   ├── angellist.go
│   │       │   └── fallback.go        # Generic HTML parser
│   │       └── models.go              # Request/Response structs
│   ├── handlers/
│   │   └── extract_handler.go         # HTTP handler for /api/v1/extract/job-url
│   └── middleware/
│       └── rate_limit.go              # Rate limiting middleware (if not exists)
└── tests/
    └── integration/
        └── extract_test.go            # Integration tests
```

**Naming Conventions:**
- Handlers: `{Feature}Handler` (e.g., `ExtractHandler`)
- Services: `{Feature}Service` (e.g., `URLExtractorService`)
- Models: Use clear struct names (e.g., `ExtractJobURLRequest`, `ExtractJobURLResponse`)

### Implementation Guidance

**Web Scraping Strategy:**
1. **HTTP Client**: Use standard `net/http` with `http.Client{Timeout: 10 * time.Second}`
2. **HTML Parsing**: Use `golang.org/x/net/html` or `github.com/PuerkitoBio/goquery`
3. **Selectors**: CSS selectors for each platform (document in code comments)
4. **Fallback**: Generic parser extracts `<title>`, `<meta name="description">`, OpenGraph tags

**Error Handling Pattern:**
```go
type ErrorResponse struct {
    Error   string   `json:"error"`
    Code    string   `json:"code"`
    Details []string `json:"details,omitempty"`
}
```

**Response Format:**
```go
type ExtractJobURLResponse struct {
    Success   bool              `json:"success"`
    Data      *ExtractedJobData `json:"data,omitempty"`
    Warnings  []string          `json:"warnings,omitempty"`
    Error     *ErrorResponse    `json:"error,omitempty"`
}

type ExtractedJobData struct {
    Title       string `json:"title"`
    Company     string `json:"company"`
    Location    string `json:"location"`
    Description string `json:"description"`
    Platform    string `json:"platform"` // "linkedin" | "indeed" | "glassdoor" | "angellist"
}
```

### Testing Standards

**Unit Test Coverage Target:** 70%+ per NFR-5.3 [Source: docs/PRD.md]

**Test Data:**
- Create mock HTML fixtures for each platform in `testdata/html/`
- Use table-driven tests for parser validation
- Test both happy paths and error scenarios

**Integration Tests:**
- Mock external HTTP calls (do not hit live job sites)
- Test full request/response cycle through Gin handler
- Validate JSON response structure

### Recommended Approach (from solutioning-gate-check)

**From Medium Priority Observation M3:**
- Implement generic HTML parser as fallback [Source: docs/implementation-readiness-report-2025-12-30.md#M3]
- Add monitoring for extraction failure rates (structured logging)
- Consider headless browser (Puppeteer/Playwright) for JavaScript-heavy sites (post-MVP)

### References

- **PRD**: Functional Requirement FR-1.2 (URL Extraction) [Source: docs/PRD.md#FR-1.2]
- **Architecture**: ADR-009 (if exists for scraping approach) or general API patterns [Source: docs/architecture.md]
- **Performance NFR**: NFR-1.2 (API <500ms), NFR-1.4 (extraction <10s) [Source: docs/PRD.md#Non-Functional-Requirements]
- **Error Handling**: NFR-3.3 (user-friendly messages) [Source: docs/PRD.md#NFR-3.3]
- **Rate Limiting**: NFR-2.5 (30 URLs/day) [Source: docs/PRD.md#NFR-2.5]
- **Solutioning Gate Check**: Medium Priority Observations [Source: docs/implementation-readiness-report-2025-12-30.md]

## Dev Agent Record

### Context Reference

- `docs/stories/1-1-job-url-information-extraction-service.context.xml`

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes List

<!-- Will be populated during dev-story execution -->

### File List

<!-- Will be populated during dev-story execution -->
