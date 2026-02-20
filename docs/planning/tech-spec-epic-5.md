# Epic Technical Specification: Search, Discovery & Data Management

Date: 2026-02-09
Author: Simon
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 delivers search and data management capabilities that enable users to find anything instantly as their data grows and trust that their data is safe, backed up, and exportable. Building on the foundation established in Epics 1-4 (applications, interviews, assessments, dashboard/timeline), this epic adds a powerful PostgreSQL-based full-text search infrastructure, advanced filtering, CSV/JSON export, and data backup visibility.

**Value Proposition:** Users can quickly locate applications, interviews, or notes through powerful search, filter large datasets efficiently, and have confidence their job search data is protected and portable.

**Key Capabilities:**
- Global search backend with PostgreSQL full-text search (tsvector/tsquery)
- Global search UI with grouped results and keyboard navigation
- Advanced application filtering with multi-select, date ranges, and sorting
- Data export to CSV (applications, interviews) and full JSON backup
- Data backup visibility and account deletion

## Objectives and Scope

### In Scope

- **Story 5.1: Global Search Backend** - PostgreSQL FTS with tsvector columns, GIN indexes, triggers for auto-update, `/api/search` endpoint
- **Story 5.2: Global Search UI** - Navbar search bar with Command component, grouped results, keyboard navigation, debounced input
- **Story 5.3: Advanced Application Filtering** - Multi-select status, date range, company search, sorting options, URL persistence
- **Story 5.4: Data Export** - CSV export for applications and interviews, respect current filters, download or generate link
- **Story 5.5: Data Backup and Recovery** - Backup policy display, full JSON export, account deletion with cascade

### Out of Scope

- Elasticsearch or external search services (PostgreSQL FTS sufficient for MVP scale)
- Email delivery of exports (download-only for MVP)
- Saved filter presets (mentioned as optional in PRD)
- Advanced fuzzy matching (pg_trgm deferred unless needed)
- Full data recovery UI (admin-only, not user-facing)

### Dependencies on Prior Work

| Dependency | Source | Required For |
|------------|--------|--------------|
| Applications CRUD | Epic 1 | Stories 5.1, 5.3, 5.4 |
| Interviews/Notes CRUD | Epic 2 | Stories 5.1, 5.4 |
| Assessments CRUD | Epic 3 | Stories 5.1, 5.4 |
| Navbar component | Existing | Story 5.2 (search bar integration) |
| shadcn/ui Command component | Existing | Story 5.2 |

---

## System Architecture Alignment

Epic 5 aligns with the existing architecture as defined in `docs/architecture.md`:

### Backend Components (New)

| Component | File | Purpose |
|-----------|------|---------|
| Search Handler | `internal/handlers/search_handler.go` | Global search endpoint |
| Search Repository | `internal/repository/search_repository.go` | FTS query logic |
| Export Handler | `internal/handlers/export_handler.go` | CSV/JSON export |

### Frontend Components (New)

| Component | Path | Purpose |
|-----------|------|---------|
| GlobalSearch | `components/shared/GlobalSearch/` | Navbar search with Command |
| AdvancedFilters | `app/(app)/applications/components/` | Enhanced filter controls |
| ExportDialog | `app/(app)/settings/components/` | Export options UI |
| DataBackupCard | `app/(app)/settings/components/` | Backup info and account deletion |

### Database Changes (Migration 000010)

```sql
-- Add tsvector columns for full-text search
ALTER TABLE applications ADD COLUMN search_vector tsvector;
ALTER TABLE interview_notes ADD COLUMN search_vector tsvector;
ALTER TABLE interview_questions ADD COLUMN search_vector tsvector;
ALTER TABLE assessments ADD COLUMN search_vector tsvector;

-- GIN indexes for search performance
CREATE INDEX idx_applications_search ON applications USING GIN(search_vector);
CREATE INDEX idx_interview_notes_search ON interview_notes USING GIN(search_vector);
CREATE INDEX idx_interview_questions_search ON interview_questions USING GIN(search_vector);
CREATE INDEX idx_assessments_search ON assessments USING GIN(search_vector);

-- Triggers for auto-updating search vectors
-- (detailed in Story 5.1)
```

---

## Detailed Design

### Services and Modules

| Service | Responsibility | Inputs | Outputs |
|---------|----------------|--------|---------|
| SearchService | Execute FTS queries across entities | Query string, filters | Grouped search results |
| ExportService | Generate CSV/JSON from user data | User ID, export type, filters | File content stream |

### Data Models and Contracts

**Search Result Types:**

```go
// SearchResult represents a single search hit
type SearchResult struct {
    ID          int64   `json:"id"`
    Type        string  `json:"type"`        // application, interview, assessment, note
    Title       string  `json:"title"`       // Primary display text
    Snippet     string  `json:"snippet"`     // Highlighted match context
    CompanyName string  `json:"company_name,omitempty"`
    Rank        float64 `json:"rank"`        // Relevance score
    Link        string  `json:"link"`        // Navigation URL
    UpdatedAt   string  `json:"updated_at"`
}

// GroupedSearchResponse groups results by type
type GroupedSearchResponse struct {
    Applications []SearchResult `json:"applications"`
    Interviews   []SearchResult `json:"interviews"`
    Assessments  []SearchResult `json:"assessments"`
    Notes        []SearchResult `json:"notes"`
    TotalCount   int            `json:"total_count"`
    Query        string         `json:"query"`
}
```

**TypeScript Types:**

```typescript
interface SearchResult {
    id: number;
    type: 'application' | 'interview' | 'assessment' | 'note';
    title: string;
    snippet: string;
    companyName?: string;
    rank: number;
    link: string;
    updatedAt: string;
}

interface GroupedSearchResponse {
    applications: SearchResult[];
    interviews: SearchResult[];
    assessments: SearchResult[];
    notes: SearchResult[];
    totalCount: number;
    query: string;
}
```

### APIs and Interfaces

**Search Endpoint:**

```
GET /api/search?q={query}&limit=50
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query (min 3 chars) |
| limit | int | No | Max results per type (default 10, max 50) |

**Response (200 OK):**
```json
{
    "applications": [
        {
            "id": 123,
            "type": "application",
            "title": "Senior Engineer at Google",
            "snippet": "...looking for a <b>Senior Engineer</b> with...",
            "company_name": "Google",
            "rank": 0.85,
            "link": "/applications/123",
            "updated_at": "2026-02-08T10:30:00Z"
        }
    ],
    "interviews": [...],
    "assessments": [...],
    "notes": [...],
    "total_count": 24,
    "query": "senior engineer"
}
```

**Export Endpoints:**

```
GET /api/export/applications?format=csv
GET /api/export/interviews?format=csv
GET /api/export/full?format=json
```

| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | csv or json |
| status | string | Filter by status (optional) |
| from | date | Filter by date range (optional) |
| to | date | Filter by date range (optional) |

### Workflows and Sequencing

**Search Flow:**

1. User types in search bar (navbar)
2. Frontend debounces input (300ms)
3. After 3+ characters, call `/api/search?q=...`
4. Backend executes FTS query across tables
5. Results grouped by type, ranked by relevance
6. Frontend displays grouped results with highlighting
7. User clicks result → navigate to detail page

**Export Flow:**

1. User goes to Settings → Data Export
2. Selects export type (Applications CSV, Interviews CSV, Full Backup JSON)
3. Optionally applies filters
4. Click "Export" → triggers download
5. Backend streams file as response
6. Browser downloads file

---

## Non-Functional Requirements

### Performance

| Metric | Target | Story |
|--------|--------|-------|
| Search response time | < 1 second for 1000+ records (NFR-1.4) | 5.1 |
| Export generation | < 10 seconds for 1000 records | 5.4 |
| UI debounce | 300ms | 5.2 |

**Optimization Strategies:**
- GIN indexes on tsvector columns
- Limit results per type (default 10)
- Streaming response for large exports
- Query uses `websearch_to_tsquery` for robustness

### Security

- All endpoints require authentication
- User can only search/export their own data (`WHERE user_id = ?`)
- HTML snippets sanitized before display
- Export files not stored on server (streamed directly)
- Account deletion requires confirmation and cascades properly

### Reliability/Availability

- Search gracefully handles empty queries (return empty)
- Export handles large datasets via streaming
- Account deletion uses transaction with rollback on failure

### Observability

- Log slow search queries (> 500ms)
- Track export request metrics
- Log account deletion events for audit

---

## Dependencies and Integrations

### Internal Dependencies

| Package/Module | Version | Purpose |
|----------------|---------|---------|
| PostgreSQL | 15+ | Full-text search (built-in) |
| encoding/csv | stdlib | CSV generation |
| encoding/json | stdlib | JSON export |

### External Dependencies

None - using PostgreSQL built-in FTS per ADR-003.

---

## Acceptance Criteria (Authoritative)

### Story 5.1: Global Search Backend

1. Database indexes created on searchable fields: applications.company_name, applications.job_title, interview_notes.content, interview_questions.question_text, assessments.title
2. Search endpoint `GET /api/search?q={query}` queries across applications, interviews, interview_notes, assessments
3. Search uses PostgreSQL full-text search with proper indexing (GIN indexes, tsvector columns)
4. Results ranked by relevance (exact matches first, then partial)
5. Minimum 3 characters required to search
6. Results limited to 50 per entity type, grouped by type
7. Search queries execute within 1 second for datasets up to 1000 records

### Story 5.2: Global Search UI

1. Search bar accessible from navbar on all pages
2. After 3+ characters, results appear within 1 second
3. Results grouped by type: Applications, Interviews, Assessments, Notes
4. Each result shows: title/company, snippet of matching text, last updated date
5. Clicking result navigates to detail page
6. If no results: "No results found for '{query}'. Try different keywords."
7. Keyboard navigation: arrow keys to navigate, Enter to select

### Story 5.3: Advanced Application Filtering

1. Filter by: Status (multi-select), Date range (from/to), Company (search/select), Has interviews (yes/no), Has assessments (yes/no)
2. Sort by: Date (newest/oldest), Company name (A-Z/Z-A), Status, Last updated
3. Multiple filters combine with AND logic
4. Filter state persists in URL for sharing/bookmarking
5. "Clear all filters" button
6. Display: "Showing 15 of 127 applications"

### Story 5.4: Data Export

1. From settings or application list, click "Export Data"
2. Select: Applications only, Interviews only, or Both
3. Export generates CSV with relevant fields
4. Applications CSV: company, job_title, status, application_date, description, notes
5. Interviews CSV: company, job_title, round_number, interview_type, scheduled_date, questions, answers, feedback
6. Export respects current filters if from filtered view
7. Export completes within 10 seconds for up to 1000 records

### Story 5.5: Data Backup and Recovery

1. In settings, show backup policy: "Your data is automatically backed up daily"
2. Show last backup timestamp (if available from system)
3. Full data export (JSON) includes: applications, interviews, assessments, notes, file URLs
4. Data retention policy visible: "Data is retained indefinitely while your account is active"
5. Account deletion option with multi-step confirmation
6. Account deletion cascades to all user data (soft delete)

---

## Traceability Mapping

| AC | PRD Reference | Spec Section | Component | Test |
|----|---------------|--------------|-----------|------|
| 5.1.1-7 | FR-5.1 | Story 5.1 | search_handler, search_repository | Integration |
| 5.2.1-7 | FR-5.1 | Story 5.2 | GlobalSearch component | E2E |
| 5.3.1-6 | FR-5.2 | Story 5.3 | AdvancedFilters | Integration |
| 5.4.1-7 | FR-6.4 | Story 5.4 | ExportHandler, ExportDialog | Integration |
| 5.5.1-6 | NFR-3.2 | Story 5.5 | DataBackupCard, delete endpoint | Integration |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| FTS performance with large notes | Slow search | Limit content indexed, add `LIMIT` to queries |
| Large export file size | Memory issues | Use streaming response, don't buffer |
| Account deletion incomplete | Data remnants | Use transaction, verify cascade |

### Assumptions

- PostgreSQL FTS sufficient for MVP scale (< 10k records per user)
- Users prefer download over email for exports
- Daily backup frequency acceptable for MVP

### Open Questions

1. **Question:** Should search include file contents (PDFs, docs)?
   - **Answer:** No - out of scope for MVP. Search metadata only.

2. **Question:** Saved filter presets - implement in Epic 5?
   - **Answer:** Optional per PRD. Defer unless time permits.

---

## Test Strategy Summary

### Unit Tests

| Component | Coverage Target |
|-----------|-----------------|
| Search query building | 90% |
| CSV generation | 90% |
| Filter URL parsing | 85% |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Search API | Empty query, short query, valid query, no results, many results |
| Export API | Applications CSV, Interviews CSV, Full JSON, with filters |
| Account deletion | Confirm cascade, verify soft delete |

### Performance Tests

| Test | Target |
|------|--------|
| Search with 1000 applications | < 1 second |
| Export 1000 applications | < 10 seconds |

---

## Implementation Order

1. **Story 5.1: Global Search Backend** - Foundation for search
2. **Story 5.2: Global Search UI** - Depends on 5.1
3. **Story 5.3: Advanced Application Filtering** - Independent, can parallel with 5.2
4. **Story 5.4: Data Export** - Independent
5. **Story 5.5: Data Backup and Recovery** - Last, includes destructive action

---

## Patterns to Reuse

| Pattern | Source | Application in Epic 5 |
|---------|--------|----------------------|
| Command component (shadcn/ui) | Existing | Global search dropdown |
| URL query params for state | Story 1.5 | Advanced filters |
| Streaming download | Standard | Export endpoints |
| Multi-step confirmation | Story 2.11 (delete interview) | Account deletion |
| Toast notifications | All epics | Export success/failure |

---

_Generated by Epic Tech Context Workflow_
_Date: 2026-02-09_
