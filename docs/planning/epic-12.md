# ditto - Epic 12 Breakdown

**Date:** 2026-03-04
**Project Level:** 1 (Coherent Feature)

---

## Epic 12: Data Extraction & Developer Experience

**Slug:** extraction-dx

### Goal

Improve the quality of extracted job data by preserving HTML formatting in job descriptions, and add Swagger/OpenAPI documentation to the backend API for maintainability and potential future integrations.

### Scope

**Included:**
- Modify job extraction service to capture and store job descriptions as HTML
- Render HTML job descriptions safely in the frontend
- Generate Swagger/OpenAPI spec from Go backend code
- Serve interactive Swagger UI at a documentation endpoint
- Document all existing API endpoints with annotations

**Excluded:**
- New extraction sources or platforms
- API versioning changes
- Public API access (Swagger is for internal/developer use)
- Extraction accuracy improvements beyond HTML preservation

### Success Criteria

1. Extracted job descriptions retain their original HTML formatting (headings, lists, bold, links)
2. HTML descriptions render correctly and safely (sanitized) in the frontend
3. Swagger UI is accessible at `/api/docs` (or similar) and documents all endpoints
4. Every API endpoint has request/response schemas, parameter descriptions, and example values in Swagger
5. Existing plain-text descriptions continue to display correctly (backward compatible)

### Dependencies

- Existing scrape-service / URL extraction infrastructure
- Existing Go Gin backend with all API routes defined
- No blocking dependencies on other epics

---

## Story Map - Epic 12

```
Epic 12: Data Extraction & Developer Experience
├── Story 12.1: Extract & Render Job Descriptions as HTML (5 points)
│   Dependencies: None
│   Deliverable: HTML extraction, safe storage, sanitized rendering
│
└── Story 12.2: Add Swagger/OpenAPI Documentation to Backend (5 points)
    Dependencies: None (can run parallel)
    Deliverable: Annotated endpoints, Swagger UI, generated spec
```

**Dependency Validation:** ✅ No inter-story dependencies — both can be worked in parallel

---

## Stories - Epic 12

### Story 12.1: Extract & Render Job Descriptions as HTML

**Status:** pending

As a job seeker,
I want extracted job descriptions to keep their original formatting,
So that I can read them clearly with proper headings, lists, and emphasis — just like on the original job posting.

**Acceptance Criteria:**

AC #1: Given a job URL is submitted for extraction, when the scrape service processes it, then the job description is captured as sanitized HTML (not stripped to plain text)
AC #2: Given a job description is stored as HTML, when displayed in the application detail view, then it renders with proper formatting (headings, lists, bold, italic, links)
AC #3: Given HTML job description content, when rendered in the frontend, then it is sanitized to prevent XSS (no script tags, event handlers, or dangerous attributes)
AC #4: Given an existing application with a plain-text job description, when displayed, then it continues to render correctly (backward compatible — display as-is with line breaks preserved)
AC #5: Given the job description field, when stored in the database, then it accepts HTML content up to the existing column size limit

**Edge Cases:**
- Job posting has malformed HTML → sanitize and render best-effort
- Job posting has inline CSS/styles → strip styles, keep semantic HTML only
- Extremely long HTML content → truncate with "show more" toggle in UI
- Job posting uses images in description → strip images (text-only extraction)

**Tasks / Subtasks:**

- [ ] **Task 1**: Update scrape service extraction (AC: #1)
  - [ ] 1.1: Modify the scraping logic to capture the job description's inner HTML instead of `.textContent`
  - [ ] 1.2: Add server-side HTML sanitization (allowlist: p, h1-h6, ul, ol, li, strong, em, a, br, span)
  - [ ] 1.3: Strip inline styles, class attributes, and non-semantic markup
  - [ ] 1.4: Preserve the plain-text extraction as a fallback if HTML parsing fails

- [ ] **Task 2**: Update backend storage (AC: #5)
  - [ ] 2.1: Verify the `description` column in the jobs table can handle HTML content (text type, no length constraint issues)
  - [ ] 2.2: Add a `description_format` field or detection logic to distinguish HTML vs. plain-text content
  - [ ] 2.3: Update the job creation/update API to accept HTML descriptions

- [ ] **Task 3**: Update frontend rendering (AC: #2, #3, #4)
  - [ ] 3.1: Add a sanitized HTML renderer component (use DOMPurify or similar)
  - [ ] 3.2: Detect whether description is HTML or plain text and render accordingly
  - [ ] 3.3: Style the rendered HTML to match the application's design system
  - [ ] 3.4: Add "show more/less" toggle for long descriptions
  - [ ] 3.5: Ensure links in descriptions open in new tab with `rel="noopener noreferrer"`

- [ ] **Task 4**: Write tests (AC: #1-#4)
  - [ ] 4.1: Test HTML extraction from sample job pages
  - [ ] 4.2: Test sanitization strips dangerous content
  - [ ] 4.3: Test backward compatibility with plain-text descriptions
  - [ ] 4.4: Frontend rendering tests for HTML and plain-text modes

**Technical Notes:**
- Scrape service likely uses a headless browser or HTTP client — check how it currently extracts `.textContent` and switch to `.innerHTML`
- Server-side sanitization is critical — never trust HTML from external sources
- Consider using `bluemonday` (Go HTML sanitizer) on the backend and `DOMPurify` on the frontend for defense-in-depth
- The `description_format` field avoids guessing whether content is HTML by regex

**Estimated Effort:** 5 points (3-5 days)

---

### Story 12.2: Add Swagger/OpenAPI Documentation to Backend

**Status:** pending

As a developer,
I want the backend API to have interactive Swagger documentation,
So that I can explore endpoints, understand request/response schemas, and test API calls during development.

**Acceptance Criteria:**

AC #1: Given the backend is running, when a developer navigates to `/api/docs`, then Swagger UI loads with all API endpoints listed
AC #2: Given any API endpoint, when viewed in Swagger UI, then it shows the HTTP method, path, description, request parameters, request body schema, and response schemas
AC #3: Given the Swagger spec, when generated, then it includes authentication requirements (JWT Bearer token) on protected endpoints
AC #4: Given the Swagger UI, when a developer uses "Try it out," then they can make live requests to the local API
AC #5: Given the Go source code, when annotations are updated, then running `swag init` (or equivalent) regenerates the spec without manual editing

**Edge Cases:**
- Endpoint with multiple response codes → document all (200, 400, 401, 404, 500)
- File upload endpoints → document multipart/form-data handling
- Endpoints with query parameters vs. path parameters → distinguish clearly

**Tasks / Subtasks:**

- [ ] **Task 1**: Set up Swagger tooling (AC: #1, #5)
  - [ ] 1.1: Add `swaggo/swag` (or chosen Swagger library) as a dependency
  - [ ] 1.2: Add main API info annotation to the main Go file (title, version, base path, description)
  - [ ] 1.3: Set up `swag init` command and add to Makefile/build scripts
  - [ ] 1.4: Add Swagger UI middleware to Gin router at `/api/docs`

- [ ] **Task 2**: Annotate authentication endpoints (AC: #2, #3)
  - [ ] 2.1: Annotate login, register, OAuth, refresh token endpoints
  - [ ] 2.2: Define JWT security scheme
  - [ ] 2.3: Document request/response DTOs with example values

- [ ] **Task 3**: Annotate application & job endpoints (AC: #2)
  - [ ] 3.1: Annotate CRUD endpoints for applications
  - [ ] 3.2: Annotate CRUD endpoints for jobs
  - [ ] 3.3: Annotate status transition endpoints
  - [ ] 3.4: Document query parameters (pagination, filters, search)

- [ ] **Task 4**: Annotate interview & file endpoints (AC: #2)
  - [ ] 4.1: Annotate CRUD endpoints for interviews (including sub-resources: questions, notes, interviewers)
  - [ ] 4.2: Annotate file upload/download/delete endpoints
  - [ ] 4.3: Document presigned URL flow

- [ ] **Task 5**: Annotate remaining endpoints (AC: #2)
  - [ ] 5.1: Annotate dashboard endpoints
  - [ ] 5.2: Annotate account management endpoints
  - [ ] 5.3: Annotate notification endpoints
  - [ ] 5.4: Annotate assessment endpoints

- [ ] **Task 6**: Verify and test (AC: #1, #4)
  - [ ] 6.1: Run `swag init` and verify spec generates without errors
  - [ ] 6.2: Load Swagger UI and verify all endpoints appear
  - [ ] 6.3: Test "Try it out" with a few representative endpoints
  - [ ] 6.4: Add `swag init` to CI pipeline (optional, verify spec is up-to-date)

**Technical Notes:**
- `swaggo/swag` is the standard for Gin-based Go APIs — generates OpenAPI 2.0/3.0 from annotations
- Annotations are Go comments above handler functions — no separate spec file to maintain
- Swagger UI should be disabled in production or behind an auth check (dev-only)
- Consider generating the spec as part of the build and committing it to version control

**Estimated Effort:** 5 points (3-5 days)

---

## Implementation Timeline - Epic 12

**Total Story Points:** 10

**Estimated Timeline:** 1-1.5 weeks (6-10 days)

| Story | Points | Dependencies | Phase |
|-------|--------|-------------|-------|
| 12.1: HTML Job Description Extraction | 5 | None | Data Quality |
| 12.2: Swagger/OpenAPI Documentation | 5 | None | Developer Experience |

**Note:** Both stories are independent and can be worked in parallel. Story 12.2 is a good "cool-down" task between heavier feature work.
