# Epic Technical Specification: Polish, Performance & Production Readiness

Date: 2026-02-10
Author: Simon
Epic ID: 6
Status: Final

---

## Overview

Epic 6 delivers the final polish, performance optimization, and production readiness required to make ditto a reliable, fast, secure, and accessible application. Building on the complete feature set established in Epics 1-5 (applications, interviews, assessments, dashboard/timeline, search/export), this epic focuses on meeting all non-functional requirements (NFRs) from the PRD to ensure ditto is ready for production deployment.

**Value Proposition:** Users experience a professional-grade application that loads quickly, works on all devices (mobile/tablet/desktop), protects their data with industry-standard security, handles errors gracefully, provides clear feedback, and is accessible to users with diverse abilities.

**Key Capabilities:**
- Performance optimization for page load (<2s) and API response times (<500ms p90)
- Security hardening with input validation, XSS prevention, CSRF protection
- Responsive design across mobile (320px), tablet (768px), and desktop (1280px+)
- Accessibility improvements (keyboard navigation, screen reader support, WCAG AA)
- Error handling with user-friendly messages and visual feedback
- Form validation with consistent client/server validation
- File upload progress with cancellation support
- Session management with automatic token refresh
- Testing infrastructure with unit and integration tests
- Documentation for API, database schema, and setup

## Objectives and Scope

### In Scope

- **Story 6.1: Performance Optimization** - Database indexes, query optimization, caching, code splitting, lazy loading
- **Story 6.2: Security Hardening** - Input validation, XSS prevention (DOMPurify/bluemonday), CSRF protection, HTTPS enforcement
- **Story 6.3: Responsive Design** - Mobile/tablet/desktop layouts, touch targets, simplified mobile forms
- **Story 6.4: Accessibility Improvements** - Keyboard navigation, semantic HTML, ARIA labels, color contrast, focus management
- **Story 6.5: Error Handling** - Toast notifications, user-friendly messages, loading states, auto-save status
- **Story 6.6: Form Validation** - Zod schemas, inline validation, required field markers, server-side validation
- **Story 6.7: File Upload Performance** - Progress bars, cancellation, estimated time, retry on failure
- **Story 6.8: Session Management** - Automatic token refresh, session persistence, graceful expiration handling
- **Story 6.9: Testing Infrastructure** - Backend unit tests (>70%), integration tests, frontend component tests
- **Story 6.10: Documentation** - README, API docs, database schema, setup instructions

### Out of Scope

- Advanced performance monitoring (APM tools like Datadog/New Relic - deferred to post-MVP)
- Comprehensive E2E testing (Playwright/Cypress - deferred)
- Security penetration testing (manual audit sufficient for MVP)
- WCAG AAA compliance (AA is target)
- Native mobile apps (responsive web only)
- Advanced caching layers (Redis - PostgreSQL caching sufficient)
- Load testing infrastructure (manual testing sufficient for MVP scale)

### Dependencies on Prior Work

| Dependency | Source | Required For |
|------------|--------|--------------|
| All CRUD endpoints | Epics 1-5 | Stories 6.1, 6.5, 6.6 |
| Rich text editors (TipTap) | Epic 2 | Story 6.2 (XSS), 6.6 (validation) |
| File upload system | Epic 1, 2, 3 | Story 6.7 |
| Authentication system | Existing | Story 6.8 |
| All UI components | Epics 1-5 | Stories 6.3, 6.4, 6.5 |
| Search infrastructure | Epic 5 | Story 6.1 (performance) |

## System Architecture Alignment

Epic 6 aligns with the existing architecture as defined in `docs/architecture.md`. This epic enhances existing components rather than creating new feature modules.

### Backend Enhancements

| Component | Changes | Story |
|-----------|---------|-------|
| All handlers | Add structured error responses, logging | 6.5 |
| All repositories | Add query optimization, indexes | 6.1 |
| Middleware | Add CSRF protection, rate limiting | 6.2 |
| Auth handler | Token refresh endpoint enhancement | 6.8 |
| File handler | Progress tracking, chunked uploads | 6.7 |

### Frontend Enhancements

| Component | Changes | Story |
|-----------|---------|-------|
| All pages | Responsive layouts, loading skeletons | 6.3, 6.5 |
| All forms | Zod validation, inline errors | 6.6 |
| All components | Keyboard navigation, ARIA labels | 6.4 |
| FileUpload | Progress bar, cancel, retry | 6.7 |
| RichTextEditor | Input sanitization | 6.2 |
| Navbar/Sidebar | Mobile responsive nav | 6.3 |

### Database Optimizations (Migration 000011)

```sql
-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_user_date ON applications(user_id, application_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_interviews_user_date ON interviews(user_id, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessments_user_due ON assessments(user_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC) WHERE deleted_at IS NULL;

-- Composite indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_applications_compound ON applications(user_id, status, application_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_user_entity ON files(user_id, application_id, interview_id) WHERE deleted_at IS NULL;
```

### New Infrastructure Components

| Component | Purpose | Story |
|-----------|---------|-------|
| `middleware/csrf.go` | CSRF token validation | 6.2 |
| `middleware/security_headers.go` | CSP, X-Frame-Options headers | 6.2 |
| `lib/hooks/useFormValidation.ts` | Reusable validation hook | 6.6 |
| `components/shared/LoadingSkeleton/` | Skeleton loading states | 6.5 |
| `components/shared/ErrorBoundary/` | React error boundaries | 6.5 |

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Story |
|----------------|----------------|-------|
| **Performance Optimization** | | |
| Query Optimizer | Add indexes, optimize JOINs, add query hints | 6.1 |
| Response Cache | Cache dashboard stats (5 min TTL) | 6.1 |
| Code Splitter | Next.js route-based splitting, lazy load TipTap | 6.1 |
| **Security Layer** | | |
| Input Validator | Go validator tags, Zod schemas | 6.2, 6.6 |
| HTML Sanitizer | bluemonday (backend), DOMPurify (frontend) | 6.2 |
| CSRF Middleware | Token generation and validation | 6.2 |
| Security Headers | CSP, X-Frame-Options, X-Content-Type-Options | 6.2 |
| **UI Enhancement** | | |
| Responsive Layout | Tailwind breakpoints, mobile nav, touch targets | 6.3 |
| Accessibility Layer | ARIA, focus management, skip links | 6.4 |
| Toast System | Success/error notifications (sonner) | 6.5 |
| Loading States | Skeletons, spinners, disabled states | 6.5 |
| **Form System** | | |
| Validation Engine | Zod schemas, react-hook-form integration | 6.6 |
| Error Display | Inline errors, form-level errors | 6.6 |
| **File System** | | |
| Upload Manager | Progress tracking, cancellation, retry | 6.7 |
| **Auth System** | | |
| Token Refresh | Automatic refresh before expiry | 6.8 |
| Session Persistence | Cross-tab synchronization | 6.8 |
| **Quality Assurance** | | |
| Test Runner | Go test, Jest, React Testing Library | 6.9 |
| Documentation Generator | Markdown API docs, schema docs | 6.10 |

### Data Models and Contracts

**Error Response Schema (Standardized):**

```go
// Backend: internal/models/error.go
type ErrorResponse struct {
    Error   string                 `json:"error"`
    Code    string                 `json:"code"`
    Details map[string]interface{} `json:"details,omitempty"`
}

// Error codes
const (
    ErrValidation     = "VALIDATION_ERROR"
    ErrUnauthorized   = "UNAUTHORIZED"
    ErrForbidden      = "FORBIDDEN"
    ErrNotFound       = "NOT_FOUND"
    ErrInternal       = "INTERNAL_ERROR"
    ErrRateLimit      = "RATE_LIMIT"
    ErrCSRF           = "CSRF_ERROR"
)
```

```typescript
// Frontend: src/types/error.ts
interface ErrorResponse {
    error: string;
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_ERROR' | 'RATE_LIMIT' | 'CSRF_ERROR';
    details?: Record<string, string>;
}
```

**Validation Schema Example (Zod):**

```typescript
// Frontend: src/lib/schemas/application.ts
import { z } from 'zod';

export const applicationSchema = z.object({
    company_name: z.string().min(1, 'Company name is required').max(255),
    job_title: z.string().min(1, 'Job title is required').max(255),
    status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']),
    application_date: z.string().optional(),
    job_url: z.string().url('Invalid URL format').optional().or(z.literal('')),
    description: z.string().max(10000).optional(),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
```

**File Upload Progress:**

```typescript
// Frontend: src/types/file.ts
interface UploadProgress {
    fileId: string;
    fileName: string;
    progress: number;        // 0-100
    status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
    error?: string;
    bytesUploaded: number;
    totalBytes: number;
    estimatedTimeRemaining?: number;  // seconds
}
```

### APIs and Interfaces

**No new endpoints** - Epic 6 enhances existing endpoints with:

| Enhancement | Affected Endpoints | Story |
|-------------|-------------------|-------|
| Structured error responses | All endpoints | 6.5 |
| CSRF token validation | All POST/PUT/DELETE | 6.2 |
| Rate limiting headers | All endpoints | 6.2 |
| Pagination metadata | List endpoints | 6.1 |
| Validation error details | Create/Update endpoints | 6.6 |

**Enhanced Response Headers:**

```
X-CSRF-Token: <token>           // CSRF protection
X-RateLimit-Limit: 100          // Requests per minute
X-RateLimit-Remaining: 95       // Remaining requests
X-RateLimit-Reset: 1707580800   // Reset timestamp
Content-Security-Policy: ...    // XSS protection
X-Frame-Options: DENY           // Clickjacking protection
X-Content-Type-Options: nosniff // MIME sniffing protection
```

**Token Refresh Endpoint (Enhancement):**

```
POST /api/auth/refresh
Request Headers:
  Authorization: Bearer <refresh_token>

Response (200 OK):
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 86400
}

Response (401 Unauthorized):
{
    "error": "Refresh token expired",
    "code": "UNAUTHORIZED"
}
```

### Workflows and Sequencing

**Performance Optimization Flow (Story 6.1):**

1. Audit current performance (Lighthouse, Chrome DevTools)
2. Add database indexes (migration 000011)
3. Optimize slow queries (N+1 fixes, proper JOINs)
4. Add response caching for dashboard stats
5. Implement code splitting and lazy loading
6. Add loading skeletons
7. Verify targets: dashboard <2s, API <500ms p90

**Security Hardening Flow (Story 6.2):**

1. Add CSRF middleware to backend
2. Generate CSRF token on login, include in responses
3. Validate CSRF token on all state-changing requests
4. Add security headers middleware
5. Verify XSS sanitization (bluemonday, DOMPurify)
6. Add Content-Security-Policy header
7. Verify HTTPS enforcement in production

**Form Validation Flow (Story 6.6):**

1. Define Zod schema for each form
2. Integrate with react-hook-form
3. Show inline errors on blur/change
4. Mark required fields with asterisk
5. Disable submit when invalid
6. Validate server-side (Go validator)
7. Return field-specific errors in response

**Token Refresh Flow (Story 6.8):**

```
1. User activity triggers API call
2. Check: Is access_token expiring in <5 min?
   └─ No: Proceed with request
   └─ Yes: Call /api/auth/refresh first
3. On refresh success:
   └─ Store new tokens
   └─ Retry original request
4. On refresh failure (401):
   └─ Clear tokens
   └─ Redirect to login
   └─ Show: "Session expired. Please log in again."
```

**File Upload with Progress Flow (Story 6.7):**

```
1. User selects file
2. Validate: type (whitelist), size (<5MB/<10MB)
3. Request presigned URL from backend
4. Start upload to S3 with progress tracking
5. Show progress bar with percentage
6. Show estimated time remaining
7. On cancel: Abort request, cleanup
8. On failure: Show retry button
9. On success: Confirm with backend, refresh file list
```

## Non-Functional Requirements

### Performance

| Metric | Target | PRD Reference | Story |
|--------|--------|---------------|-------|
| Dashboard load | < 2 seconds | NFR-1.1 | 6.1 |
| Main views load | < 2 seconds | NFR-1.1 | 6.1 |
| Initial auth check | < 3 seconds | NFR-1.1 | 6.1 |
| API response (p90) | < 500ms | NFR-1.2 | 6.1 |
| API response (p99) | < 2 seconds | NFR-1.2 | 6.1 |
| Auto-save latency | < 1 second | NFR-1.3 | 6.5 |
| Search response | < 1 second | NFR-1.4 | 6.1 |
| File upload (5MB) | < 10 seconds | NFR-1.5 | 6.7 |

**Optimization Strategies:**

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| Database indexes | Composite indexes on user_id + status/date | Query time 50-80% reduction |
| Query optimization | Fix N+1 queries with JOINs/preloading | Reduce DB round trips |
| Response caching | Dashboard stats cache (5 min TTL) | Reduce repeated calculations |
| Code splitting | Next.js automatic route splitting | Smaller initial bundle |
| Lazy loading | TipTap editor, heavy components | Faster initial render |
| Loading skeletons | Shimmer placeholders | Better perceived performance |
| GZIP compression | Enable on all API responses | 60-80% response size reduction |
| Image optimization | Next.js Image component | Automatic WebP, lazy load |

### Security

| Requirement | Implementation | PRD Reference | Story |
|-------------|----------------|---------------|-------|
| Input validation | Client (Zod) + Server (Go validator) | NFR-2.3 | 6.2, 6.6 |
| XSS prevention | DOMPurify (frontend), bluemonday (backend) | NFR-2.3 | 6.2 |
| SQL injection | Parameterized queries (existing) | NFR-2.3 | 6.2 |
| CSRF protection | Token-based validation on state changes | NFR-2.4 | 6.2 |
| File upload validation | MIME whitelist, size limits | NFR-2.3 | 6.2, 6.7 |
| HTTPS enforcement | TLS 1.2+, HTTP→HTTPS redirect | NFR-2.2 | 6.2 |
| Security headers | CSP, X-Frame-Options, X-Content-Type-Options | NFR-2.2 | 6.2 |
| Session security | 24h timeout, token rotation | NFR-2.4 | 6.8 |
| Password security | bcrypt (cost 10+) - existing | NFR-2.1 | - |

**Security Headers Configuration:**

```go
// middleware/security_headers.go
func SecurityHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'")
        c.Header("X-Frame-Options", "DENY")
        c.Header("X-Content-Type-Options", "nosniff")
        c.Header("X-XSS-Protection", "1; mode=block")
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        c.Next()
    }
}
```

### Reliability/Availability

| Requirement | Implementation | PRD Reference | Story |
|-------------|----------------|---------------|-------|
| Uptime target | 99% (MVP) | NFR-3.1 | - |
| Data durability | Zero data loss for committed writes | NFR-3.2 | - |
| Database backups | Daily, 7-day retention | NFR-3.2 | - |
| Error handling | Graceful degradation, user-friendly messages | NFR-3.3 | 6.5 |
| Auto-save reliability | Retry on failure, local backup | NFR-3.4 | 6.5 |

**Error Handling Strategy:**

| Error Type | User Message | Backend Action | Story |
|------------|--------------|----------------|-------|
| Validation error | Specific field errors | Return 400 with details | 6.5, 6.6 |
| Auth error | "Session expired. Please log in." | Return 401, log event | 6.5, 6.8 |
| Permission error | "You don't have access to this resource." | Return 403, log event | 6.5 |
| Not found | "The requested item was not found." | Return 404 | 6.5 |
| Server error | "Something went wrong. Please try again." | Return 500, log full error | 6.5 |
| Network error | "Connection lost. Changes will sync when reconnected." | Retry with backoff | 6.5 |
| Auto-save failure | "Save failed - retry" with button | Log error, offer retry | 6.5 |

### Observability

| Signal | Implementation | Story |
|--------|----------------|-------|
| Slow query logging | Log queries > 500ms with context | 6.1 |
| Error logging | Structured logs with user_id, endpoint, stack | 6.5 |
| API metrics | Request count, latency, error rate | 6.1 |
| Auth events | Login, logout, token refresh, failures | 6.8 |
| File upload metrics | Upload count, size, duration, failures | 6.7 |

**Logging Format:**

```go
// Structured logging example
log.Printf("[ERROR] user_id=%d endpoint=%s error=%v duration_ms=%d",
    userID, c.Request.URL.Path, err, duration.Milliseconds())

log.Printf("[WARN] slow_query user_id=%d query=%s duration_ms=%d",
    userID, queryName, duration.Milliseconds())

log.Printf("[INFO] auth_event user_id=%d event=%s ip=%s",
    userID, "token_refresh", c.ClientIP())
```

## Dependencies and Integrations

### Backend Dependencies (Go 1.24)

| Package | Version | Purpose | Story |
|---------|---------|---------|-------|
| `github.com/gin-gonic/gin` | v1.10.1 | Web framework | All |
| `github.com/go-playground/validator/v10` | v10.26.0 | Input validation | 6.2, 6.6 |
| `github.com/microcosm-cc/bluemonday` | v1.0.27 | HTML sanitization (XSS) | 6.2 |
| `github.com/golang-jwt/jwt/v5` | v5.2.2 | JWT handling | 6.8 |
| `github.com/jmoiron/sqlx` | v1.4.0 | Database queries | 6.1 |
| `github.com/lib/pq` | v1.10.9 | PostgreSQL driver | 6.1 |
| `github.com/stretchr/testify` | v1.10.0 | Testing assertions | 6.9 |
| `github.com/aws/aws-sdk-go-v2` | v1.41.0 | S3 file uploads | 6.7 |
| `golang.org/x/crypto` | v0.44.0 | Password hashing | 6.2 |

### Frontend Dependencies (Node 18+)

| Package | Version | Purpose | Story |
|---------|---------|---------|-------|
| `next` | 14.2.15 | React framework | All |
| `react` | ^18 | UI library | All |
| `typescript` | ^5 | Type safety | All |
| `zod` | ^3.24.2 | Schema validation | 6.6 |
| `react-hook-form` | ^7.54.2 | Form handling | 6.6 |
| `@hookform/resolvers` | ^4.1.2 | Zod integration | 6.6 |
| `dompurify` | ^3.3.1 | HTML sanitization (XSS) | 6.2 |
| `axios` | ^1.7.9 | HTTP client | 6.7, 6.8 |
| `sonner` | ^2.0.7 | Toast notifications | 6.5 |
| `tailwindcss` | ^4.1.10 | CSS framework | 6.3 |
| `@tiptap/react` | ^3.17.1 | Rich text editor | 6.2 |
| `lucide-react` | ^0.452.0 | Icons | 6.4 |
| `next-auth` | 5.0.0-beta.29 | Authentication | 6.8 |

### shadcn/ui Components (Existing)

| Component | Purpose | Story |
|-----------|---------|-------|
| Button | CTAs, actions | 6.3, 6.4, 6.5 |
| Dialog | Modals, confirmations | 6.5 |
| Toast (sonner) | Notifications | 6.5 |
| Form | Form structure | 6.6 |
| Input | Text fields | 6.6 |
| Select | Dropdowns | 6.6 |
| Skeleton | Loading states | 6.5 |
| Tooltip | Accessibility hints | 6.4 |

### External Services

| Service | Purpose | Story |
|---------|---------|-------|
| PostgreSQL 15+ | Database | 6.1 |
| AWS S3 | File storage | 6.7 |

### Dev Dependencies

| Package | Version | Purpose | Story |
|---------|---------|---------|-------|
| `eslint` | ^8 | Code linting | 6.9 |
| `prettier` | ^3.5.2 | Code formatting | 6.9 |
| `@types/react` | ^18 | TypeScript types | 6.9 |
| Jest (to add) | Latest | Frontend testing | 6.9 |
| React Testing Library (to add) | Latest | Component testing | 6.9 |

### New Dependencies to Add

| Package | Purpose | Story |
|---------|---------|-------|
| `@testing-library/react` | Component testing | 6.9 |
| `@testing-library/jest-dom` | DOM assertions | 6.9 |
| `jest` | Test runner | 6.9 |
| `jest-environment-jsdom` | Browser environment | 6.9 |

## Acceptance Criteria (Authoritative)

### Story 6.1: Performance Optimization

1. Dashboard loads within 2 seconds on standard broadband (10 Mbps+)
2. Main views (application list, interview detail) load within 2 seconds
3. 90% of API requests respond within 500ms
4. 99% of API requests respond within 2 seconds
5. Search results return within 1 second
6. Initial page load with auth check completes within 3 seconds
7. Database indexes added on frequently queried columns (user_id, application_id, scheduled_date, status)
8. Dashboard stats cached for 5 minutes to reduce DB queries
9. Loading skeletons shown for operations >500ms

### Story 6.2: Security Hardening

1. All user input validated on client (Zod) and server (Go validator)
2. Rich text content sanitized with DOMPurify (frontend) and bluemonday (backend)
3. SQL injection prevented via parameterized queries (existing)
4. File uploads validated for type (PDF, DOCX, TXT, ZIP, PNG, JPG) and size (5MB/10MB)
5. CSRF protection enabled on all POST/PUT/DELETE operations
6. All API calls over HTTPS only (TLS 1.2+) in production
7. Security headers set: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options
8. No unencrypted transmission of credentials or tokens

### Story 6.3: Responsive Design

1. Application functional on screen widths from 320px (mobile) to 3840px (4K desktop)
2. Mobile (320-767px): bottom navigation, simplified forms, readable text without horizontal scroll
3. Tablet (768-1279px): collapsible sidebar or bottom nav, single column layouts
4. Desktop (1280px+): full sidebar navigation, multi-column layouts, rich toolbars
5. Touch targets minimum 44x44px on mobile (WCAG AA)
6. Forms easy to fill on mobile (proper input types, auto-focus)
7. Rich text editor works on mobile with simplified toolbar

### Story 6.4: Accessibility Improvements

1. All interactive elements keyboard accessible (Tab, Enter, Escape)
2. Semantic HTML used (nav, main, article, button)
3. Form labels and error messages properly associated with inputs
4. Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
5. Focus indicators visible on all interactive elements
6. Skip navigation link allows jumping to main content
7. ARIA labels on icon-only buttons and dynamic content
8. Form validation errors announced to screen readers

### Story 6.5: Error Handling and User Feedback

1. Success toast shown for successful actions
2. Error messages user-friendly (no stack traces)
3. Errors include actionable guidance ("Try again", specific validation errors)
4. All errors logged server-side with context
5. Loading states shown for operations >500ms
6. Disabled state clear for unavailable actions
7. Auto-save shows "Saving..." → "Saved" → "Save failed" states
8. Network errors show: "Connection lost. Changes will sync when reconnected."

### Story 6.6: Form Validation

1. Inline validation errors shown on blur or change
2. Required fields marked with asterisk or "Required" label
3. Validation errors specific: "Email must be valid", "Title required"
4. Submit button disabled when form invalid
5. Successful submission shows confirmation message
6. Validation rules consistent between client and server
7. Server returns 400 with field-specific error details

### Story 6.7: File Upload Performance

1. Progress bar shows upload percentage
2. Files up to 5MB upload within 10 seconds on standard broadband
3. Upload completes with success message and file appears in list
4. If upload fails, clear error with retry option shown
5. User can cancel an in-progress upload
6. Large files show estimated time remaining
7. Client-side file size check before upload

### Story 6.8: Session Management

1. Token automatically refreshed before expiration (check when <5 min remaining)
2. Sessions persist across browser tabs
3. On session expiration, redirect to login with: "Session expired. Please log in again."
4. Logout clears all tokens from client and server
5. Refresh tokens rotate on each use
6. JWT tokens expire after 24 hours
7. Refresh tokens expire after 7 days

### Story 6.9: Testing Infrastructure

1. Backend unit tests for repository layer with >70% coverage
2. Backend integration tests for critical endpoints: auth, applications, interviews, assessments
3. Frontend component tests for key flows: login, create application, log interview, add assessment
4. All tests pass before deployment
5. Tests runnable via single command: `go test ./...` and `npm test`

### Story 6.10: Documentation

1. README includes: project overview, tech stack, setup instructions, environment variables, how to run tests
2. API endpoints documented with request/response schemas
3. Database schema documented (table descriptions, relationships, indexes)
4. Setup instructions allow new developer to run project in <30 minutes
5. Documentation in `/docs` folder

## Traceability Mapping

| AC ID | PRD Reference | Spec Section | Component | Test Type |
|-------|---------------|--------------|-----------|-----------|
| 6.1.1-3 | NFR-1.1, NFR-1.2 | Performance | All pages, handlers | Performance |
| 6.1.4-6 | NFR-1.2, NFR-1.4 | Performance | API handlers, search | Performance |
| 6.1.7-9 | NFR-1.1 | Database Optimization | Migration 000011, skeletons | Integration |
| 6.2.1-2 | NFR-2.3 | Security | validators, sanitizers | Unit |
| 6.2.3-4 | NFR-2.3 | Security | file_handler, repositories | Unit |
| 6.2.5-8 | NFR-2.4, NFR-2.2 | Security | csrf middleware, headers | Integration |
| 6.3.1-4 | NFR-4.2 | Responsive | All components | Manual/Visual |
| 6.3.5-7 | NFR-4.2 | Responsive | Forms, RichTextEditor | Manual/Visual |
| 6.4.1-4 | NFR-4.3 | Accessibility | All components | Accessibility audit |
| 6.4.5-8 | NFR-4.3 | Accessibility | Focus, ARIA, errors | Accessibility audit |
| 6.5.1-4 | NFR-3.3, NFR-4.4 | Error Handling | Toast, handlers | Integration |
| 6.5.5-8 | NFR-4.4, NFR-3.4 | Error Handling | Loading states, auto-save | Component |
| 6.6.1-4 | NFR-2.3 | Form Validation | All forms | Component |
| 6.6.5-7 | NFR-2.3 | Form Validation | Forms, handlers | Integration |
| 6.7.1-4 | NFR-1.5 | File Upload | FileUpload component | Integration |
| 6.7.5-7 | NFR-1.5 | File Upload | Upload manager | Component |
| 6.8.1-3 | NFR-2.1 | Session | Auth, axios interceptor | Integration |
| 6.8.4-7 | NFR-2.1, NFR-2.4 | Session | Auth handler | Unit |
| 6.9.1-2 | NFR-5.3 | Testing | Backend tests | - |
| 6.9.3-5 | NFR-5.3 | Testing | Frontend tests | - |
| 6.10.1-5 | NFR-5.2 | Documentation | Markdown files | Manual review |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance targets not met on initial implementation | Medium | Medium | Profile before/after, iterate on hot paths, use Lighthouse CI |
| CSRF implementation breaks existing flows | High | Low | Test all forms manually, add integration tests first |
| Accessibility audit reveals major issues | Medium | Medium | Use axe DevTools during development, prioritize critical paths |
| Mobile responsive breaks on specific devices | Medium | Medium | Test on real devices (iPhone, Android), use BrowserStack if needed |
| Token refresh race conditions | High | Low | Implement request queue, mutex on refresh |
| Test coverage goal (70%) difficult to reach | Low | Medium | Prioritize critical paths, use table-driven tests |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| PostgreSQL indexes sufficient for MVP scale | < 10k records per user, proven in similar apps |
| bluemonday + DOMPurify double sanitization prevents XSS | Defense in depth, industry standard approach |
| WCAG AA sufficient for MVP | AAA is aspirational, AA covers legal requirements |
| Manual accessibility testing acceptable | Automated tools catch 30-50% of issues, manual review for rest |
| 70% backend coverage is achievable target | Focus on repository layer, critical handlers |
| Existing auth system is secure | JWT + bcrypt implemented correctly in earlier work |

### Open Questions

| Question | Status | Resolution |
|----------|--------|------------|
| Should we add rate limiting beyond basic protection? | **Resolved** | Basic rate limiting (100 req/min) sufficient for MVP, revisit post-launch |
| CSP policy strictness level? | **Resolved** | Start with moderate policy, tighten based on monitoring |
| Which accessibility testing tool to use? | **Resolved** | axe DevTools (free) + manual keyboard testing |
| Should we add E2E tests (Playwright/Cypress)? | **Resolved** | Deferred to post-MVP, component tests sufficient for now |
| Mobile-first or desktop-first approach? | **Resolved** | Desktop-first (primary use case), ensure mobile works |

## Test Strategy Summary

### Unit Tests

| Component | Coverage Target | Framework | Story |
|-----------|-----------------|-----------|-------|
| Repository layer (Go) | 70%+ | Go testing + testify | 6.9 |
| Validation schemas (Zod) | 90% | Jest | 6.9 |
| Utility functions | 80% | Jest | 6.9 |
| Custom hooks (useAutoSave, etc.) | 80% | React Testing Library | 6.9 |

### Integration Tests

| Flow | Test Cases | Story |
|------|------------|-------|
| Auth endpoints | Login, logout, refresh, invalid token | 6.9 |
| Applications CRUD | Create, read, update, delete, list with filters | 6.9 |
| Interviews CRUD | Create with application, update, delete, list | 6.9 |
| Assessments CRUD | Create, status updates, submissions | 6.9 |
| File upload | Presigned URL, confirm, download, delete | 6.9 |
| Search | Empty query, valid query, no results | 6.9 |

### Component Tests

| Component | Test Cases | Story |
|-----------|------------|-------|
| Login form | Valid submit, validation errors, loading state | 6.9 |
| Application form | Create, edit, validation, URL extraction | 6.9 |
| Interview form | Create, add interviewers, questions | 6.9 |
| FileUpload | Select file, progress, cancel, error | 6.9 |
| Toast notifications | Success, error, dismiss | 6.9 |
| Loading skeletons | Render correctly | 6.9 |

### Accessibility Tests

| Test Type | Tool | Coverage | Story |
|-----------|------|----------|-------|
| Automated audit | axe DevTools | All pages | 6.4 |
| Keyboard navigation | Manual | All interactive elements | 6.4 |
| Screen reader | Manual (VoiceOver/NVDA) | Critical flows | 6.4 |
| Color contrast | WebAIM Contrast Checker | All text | 6.4 |

### Performance Tests

| Test | Target | Method | Story |
|------|--------|--------|-------|
| Dashboard load | < 2s | Lighthouse CI | 6.1 |
| API response time | p90 < 500ms | Backend logging | 6.1 |
| Search performance | < 1s with 1000 records | Load test script | 6.1 |
| File upload (5MB) | < 10s | Manual test | 6.7 |

### Test Commands

```bash
# Backend tests
cd backend
go test ./... -v -cover

# Frontend tests
cd frontend
npm test

# Accessibility audit (manual)
# 1. Install axe DevTools browser extension
# 2. Run on each page
# 3. Fix critical/serious issues
```

## Implementation Order

1. **Story 6.1: Performance Optimization** - Foundation for responsive UX
2. **Story 6.2: Security Hardening** - Critical for production
3. **Story 6.5: Error Handling** - Improves debugging for remaining stories
4. **Story 6.6: Form Validation** - Builds on 6.2, 6.5
5. **Story 6.3: Responsive Design** - Visual polish
6. **Story 6.4: Accessibility** - Builds on 6.3
7. **Story 6.7: File Upload Performance** - Standalone enhancement
8. **Story 6.8: Session Management** - Auth improvements
9. **Story 6.9: Testing Infrastructure** - Quality assurance
10. **Story 6.10: Documentation** - Final wrap-up

---

## Post-Review Follow-ups

- **Story 6.6**: [Med] Submission form notes field missing inline error display when submission_type='notes' — add `aria-invalid`, `aria-describedby`, and error message block (`submission-form-modal.tsx:231-251`)
- **Story 6.6**: [Low] Missing `aria-required="true"` on assessment_type and submission_type SelectTriggers (`assessment-form-modal.tsx:119`, `submission-form-modal.tsx:155`)
- **Story 6.6**: [Low] Backend `formatValidationFieldErrors()` uses PascalCase field names in error messages — consider humanizing (`convert.go:59`)
- **Story 6.8**: [Resolved] All 3 low-severity review items addressed: logout failure logging, server-provided expires_in on all auth endpoints, filtered error logging in token refresh (2026-02-19)

- **Story 6.9**: [Resolved] All review items addressed: 4 RTL component tests added (login, application, interview, assessment forms), repository coverage increased to 72.2% (2026-02-20)
- **Story 6.9**: [Low] Pre-existing test failures (TestRateLimitRepository, TestFileHandler_ConfirmUpload) should be resolved or properly mocked.

---

_Generated by Epic Tech Context Workflow_
_Date: 2026-02-10_
