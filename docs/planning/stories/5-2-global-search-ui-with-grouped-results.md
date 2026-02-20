# Story 5.2: Global Search UI with Grouped Results

Status: done

## Story

As a job seeker with growing data,
I want to search across all my data from one search bar,
so that I can quickly find applications, interviews, or notes without remembering where I stored them.

## Acceptance Criteria

1. **Search bar accessible from navbar on all pages** - Global search input visible in navigation header across all authenticated routes
2. **After 3+ characters, results appear within 1 second** - Debounced input (300ms) triggers API call, results displayed quickly
3. **Results grouped by type: Applications, Interviews, Assessments, Notes** - Grouped sections with headers in dropdown/popover
4. **Each result shows: title/company, snippet of matching text, last updated date** - Match highlighting preserved from backend snippets
5. **Clicking result navigates to detail page** - Applications → /applications/:id, Interviews → /interviews/:id, Assessments → /assessments/:id, Notes → Interview detail page
6. **If no results: "No results found for '{query}'. Try different keywords."** - Empty state with helpful message
7. **Keyboard navigation: arrow keys to navigate, Enter to select** - Full keyboard accessibility using Command component

## Tasks / Subtasks

- [x] Task 1: Create Search Types and Service (AC: 2, 3, 4)
  - [x] 1.1 Create `frontend/src/types/search.ts` with SearchResult and GroupedSearchResponse types matching backend
  - [x] 1.2 Create `frontend/src/services/searchService.ts` with search method calling GET /api/search
  - [x] 1.3 Add proper error handling and empty response handling

- [x] Task 2: Build GlobalSearch Component (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] 2.1 Create `frontend/src/components/shared/GlobalSearch/GlobalSearch.tsx`
  - [x] 2.2 Use shadcn/ui Command component (CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem)
  - [x] 2.3 Implement search input with 300ms debounce using custom hook or lodash.debounce
  - [x] 2.4 Add minimum 3 character validation before triggering search
  - [x] 2.5 Show loading state while search is in progress
  - [x] 2.6 Display grouped results with section headers (Applications, Interviews, Assessments, Notes)
  - [x] 2.7 Render each result with title, snippet (dangerouslySetInnerHTML with DOMPurify), and date
  - [x] 2.8 Implement keyboard navigation (arrow keys, Enter) via Command component
  - [x] 2.9 Add empty state message for no results
  - [x] 2.10 Handle click/Enter to navigate to detail page using Next.js router

- [x] Task 3: Integrate GlobalSearch into Navbar (AC: 1)
  - [x] 3.1 Add GlobalSearch component to `frontend/src/components/Navbar/` or equivalent header component
  - [x] 3.2 Add keyboard shortcut trigger (Cmd/Ctrl + K) to open search dialog
  - [x] 3.3 Style search icon/button to match existing navbar design
  - [x] 3.4 Ensure responsive behavior on mobile (may use smaller search icon)

- [x] Task 4: Implement Snippet Rendering with Sanitization (AC: 4)
  - [x] 4.1 Install DOMPurify if not present: `npm install dompurify @types/dompurify`
  - [x] 4.2 Create sanitizer utility in `frontend/src/lib/sanitizer.ts`
  - [x] 4.3 Sanitize snippet HTML before rendering with dangerouslySetInnerHTML
  - [x] 4.4 Style highlighted text (bold tags from ts_headline) appropriately

- [x] Task 5: Testing and Edge Cases (AC: 2, 5, 6)
  - [x] 5.1 Manual test: Type 3+ characters, verify results appear within 1 second
  - [x] 5.2 Manual test: Type <3 characters, verify no API call made
  - [x] 5.3 Manual test: Search with no matches, verify empty state message
  - [x] 5.4 Manual test: Click result, verify navigation to correct detail page
  - [x] 5.5 Manual test: Keyboard navigation (arrows, Enter, Escape to close)
  - [x] 5.6 Manual test: Search bar visible on dashboard, applications, interviews, assessments pages
  - [x] 5.7 Test debounce behavior (rapid typing should only trigger one API call)

## Dev Notes

### Architecture Alignment

- **Frontend Pattern**: Component in `components/shared/GlobalSearch/` following existing structure
- **UI Library**: shadcn/ui Command component (based on cmdk) for accessible dropdown with keyboard navigation
- **State Management**: Local component state, no global state needed for search
- **API Integration**: Use existing axios client pattern from searchService

### Implementation Details

**Command Component Usage:**
```typescript
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
```

**Debounce Pattern:**
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    if (query.length >= 3) {
      searchService.search(query, 10).then(setResults);
    }
  }, 300),
  []
);
```

**Snippet Rendering with DOMPurify:**
```typescript
import DOMPurify from 'dompurify';

<span
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(result.snippet)
  }}
/>
```

**Navigation Mapping:**
| Result Type | Navigation Path |
|-------------|-----------------|
| application | /applications/{id} |
| interview | /interviews/{id} |
| assessment | /assessments/{id} |
| note | /interviews/{interview_id} (linked via interview) |

### Project Structure Notes

**Creates:**
- `frontend/src/types/search.ts`
- `frontend/src/services/searchService.ts`
- `frontend/src/components/shared/GlobalSearch/GlobalSearch.tsx`
- `frontend/src/components/shared/GlobalSearch/index.ts`
- `frontend/src/lib/sanitizer.ts`

**Modifies:**
- Navbar component (add GlobalSearch)

### Learnings from Previous Story

**From Story 5-1-global-search-backend-infrastructure (Status: done)**

- **Search API Available**: `GET /api/search?q={query}&limit={limit}` endpoint ready for consumption
- **Response Format**: GroupedSearchResponse with applications, interviews, assessments, notes arrays, plus total_count and query fields
- **Snippet Format**: Snippets contain HTML with `<b>` tags from ts_headline - must sanitize before rendering
- **Minimum Query Length**: Backend returns empty response for queries <3 characters - frontend should prevent unnecessary calls
- **Limit Handling**: Default limit 10, max 50 per entity type - use limit=10 for search dropdown
- **Link Field**: Each SearchResult includes a `link` field (e.g., "/applications/123") - use directly for navigation
- **UpdatedAt Fixed**: UpdatedAt field now correctly populated (was fixed during story 5-1)
- **Performance**: Search executes in 0.15ms, well within 1 second requirement

**Files to Reference:**
- `backend/internal/models/search.go` - SearchResult and GroupedSearchResponse struct definitions
- `backend/internal/handlers/search_handler.go` - API parameter handling
- `backend/internal/repository/search_repository.go` - Query structure and result format

[Source: stories/5-1-global-search-backend-infrastructure.md#Dev-Agent-Record]

### API Response Format Reference

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

### TypeScript Types to Create

```typescript
// frontend/src/types/search.ts
export interface SearchResult {
  id: number;
  type: 'application' | 'interview' | 'assessment' | 'note';
  title: string;
  snippet: string;
  company_name?: string;
  rank: number;
  link: string;
  updated_at: string;
}

export interface GroupedSearchResponse {
  applications: SearchResult[];
  interviews: SearchResult[];
  assessments: SearchResult[];
  notes: SearchResult[];
  total_count: number;
  query: string;
}
```

### References

- [Source: docs/tech-spec-epic-5.md#Story 5.2] - Acceptance criteria and UI requirements
- [Source: docs/architecture.md#Frontend Components] - GlobalSearch path and naming
- [Source: docs/architecture.md#ADR-002] - HTML sanitization with DOMPurify
- [Source: docs/epics.md#Story 5.2] - Original story definition
- [Source: stories/5-1-global-search-backend-infrastructure.md] - Backend API implementation details

## Dev Agent Record

### Context Reference

- [Story Context XML](5-2-global-search-ui-with-grouped-results.context.xml)

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Task 1: Created TypeScript types matching backend SearchResult and GroupedSearchResponse
- Task 2: Built GlobalSearch component using shadcn/ui Command with Dialog, debounce, loading state, grouped results
- Task 3: Integrated into sidebar with Ctrl+K shortcut, styled to match design system
- Task 4: Used existing sanitizer.ts (DOMPurify already installed), styled bold highlights
- Task 5: Manual testing completed via Chrome automation - all ACs verified

### Completion Notes List

- Implemented global search UI matching ditto-design.pen design system
- Search trigger button in sidebar with ⌘K badge
- Command dialog with search input, grouped results, keyboard navigation
- Empty state with SearchX icon and helpful message
- Footer with contextual keyboard hints (esc/close, ↑↓/navigate, ↵/select)
- Responsive design works on mobile (dialog width adapts)
- All acceptance criteria verified through manual testing

### File List

**Created:**
- `frontend/src/types/search.ts` - SearchResult and GroupedSearchResponse types
- `frontend/src/services/searchService.ts` - Search API service with error handling
- `frontend/src/components/shared/GlobalSearch/GlobalSearch.tsx` - Main search component
- `frontend/src/components/shared/GlobalSearch/index.ts` - Export file

**Modified:**
- `frontend/src/types/index.ts` - Added search types export
- `frontend/src/components/sidebar/sidebar.tsx` - Added search trigger button and GlobalSearch integration

## Change Log

- 2026-02-09: Story drafted from tech-spec-epic-5.md with learnings from story 5-1
- 2026-02-09: Implementation complete - all tasks done, manual testing passed
- 2026-02-09: Senior Developer Review notes appended - APPROVED

## Senior Developer Review (AI)

### Reviewer
Simon

### Date
2026-02-09

### Outcome
✅ **APPROVE**

All 7 acceptance criteria are fully implemented with evidence. All 5 tasks and their subtasks are verified complete. The implementation follows the technical specification, uses proper security practices (DOMPurify sanitization), and aligns with the project architecture.

### Summary
Story 5.2 delivers a complete global search UI with keyboard navigation, grouped results, and proper XSS protection. The implementation uses shadcn/ui Command component with Dialog, 300ms debounce, and responsive design. Integration with the sidebar includes Ctrl/Cmd+K shortcut.

### Key Findings
No blocking issues found.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1 | Search bar accessible from sidebar on all pages | ✅ IMPLEMENTED | `sidebar.tsx:101-113` |
| 2 | After 3+ characters, results appear within 1 second with 300ms debounce | ✅ IMPLEMENTED | `GlobalSearch.tsx:55-77` |
| 3 | Results grouped by type: Applications, Interviews, Assessments, Notes | ✅ IMPLEMENTED | `GlobalSearch.tsx:127-180` |
| 4 | Each result shows title, snippet, last updated date | ✅ IMPLEMENTED | `GlobalSearch.tsx:100-125` |
| 5 | Clicking result navigates to detail page | ✅ IMPLEMENTED | `GlobalSearch.tsx:87-90` |
| 6 | Empty state message for no results | ✅ IMPLEMENTED | `GlobalSearch.tsx:162-172` |
| 7 | Keyboard navigation: arrow keys, Enter to select | ✅ IMPLEMENTED | Command component built-in |

**Summary: 7 of 7 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: Search Types and Service | [x] | ✅ VERIFIED | `types/search.ts`, `services/searchService.ts` |
| Task 2: GlobalSearch Component | [x] | ✅ VERIFIED | `GlobalSearch.tsx` (215 lines) |
| Task 3: Sidebar Integration | [x] | ✅ VERIFIED | `sidebar.tsx:64-141` |
| Task 4: Snippet Sanitization | [x] | ✅ VERIFIED | `lib/sanitizer.ts`, `GlobalSearch.tsx:117` |
| Task 5: Manual Testing | [x] | ✅ VERIFIED | All ACs tested via Chrome automation |

**Summary: 5 of 5 tasks verified complete, 0 questionable, 0 false completions**

### Test Coverage and Gaps
- Manual testing complete for all ACs
- Unit tests not in story scope (could be added in Epic 6)

### Architectural Alignment
- ✅ Component in `components/shared/GlobalSearch/` per architecture.md
- ✅ Uses shadcn/ui Command component as specified
- ✅ Service pattern matches existing services
- ✅ Tech-spec compliance verified

### Security Notes
- ✅ DOMPurify sanitization on search snippets (XSS prevention)
- ✅ No hardcoded credentials
- ✅ Safe navigation with trusted backend links

### Best-Practices and References
- [cmdk library](https://cmdk.paco.me/) - Command menu primitive
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML sanitization
- [shadcn/ui Command](https://ui.shadcn.com/docs/components/command) - Component docs

### Action Items

**Code Changes Required:**
- None required for approval

**Advisory Notes:**
- Note: Consider adding `import type { GroupedSearchResponse }` for clarity in searchService.ts
- Note: Unit tests for GlobalSearch component could be added in Epic 6
- Note: Sidebar useEffect dependency array could be reviewed if ESLint warnings arise
