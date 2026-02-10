# PostgreSQL Full-Text Search Research Spike

## Overview

PostgreSQL provides built-in full-text search (FTS) capabilities that can handle the search requirements for Ditto without requiring external services like Elasticsearch.

## Core Concepts

### Data Types

- **`tsvector`**: Stores preprocessed document text as sorted list of distinct lexemes (normalized words)
- **`tsquery`**: Represents search query with boolean operators (AND `&`, OR `|`, NOT `!`, phrase `<->`)

### Key Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `to_tsvector(config, text)` | Convert text to tsvector | `to_tsvector('english', 'Quick brown fox')` |
| `to_tsquery(config, query)` | Convert to tsquery (strict syntax) | `to_tsquery('english', 'quick & fox')` |
| `plainto_tsquery(config, query)` | Convert plain text to tsquery | `plainto_tsquery('english', 'quick fox')` → AND |
| `websearch_to_tsquery(config, query)` | Google-like search syntax | `websearch_to_tsquery('english', '"quick fox" -lazy')` |
| `ts_rank(vector, query)` | Relevance score (0-1) | `ts_rank(search_vector, query)` |
| `ts_headline(config, text, query)` | Highlighted snippets | Shows matches in context |

### Match Operator

```sql
-- The @@ operator checks if tsvector matches tsquery
SELECT * FROM documents WHERE search_vector @@ to_tsquery('english', 'search & term');
```

## Implementation Strategy for Ditto

### 1. Add Search Columns to Tables

```sql
-- Add tsvector column to searchable tables
ALTER TABLE candidates ADD COLUMN search_vector tsvector;
ALTER TABLE jobs ADD COLUMN search_vector tsvector;
ALTER TABLE companies ADD COLUMN search_vector tsvector;
```

### 2. Create GIN Indexes

```sql
-- GIN indexes are optimized for full-text search
CREATE INDEX idx_candidates_search ON candidates USING GIN(search_vector);
CREATE INDEX idx_jobs_search ON jobs USING GIN(search_vector);
CREATE INDEX idx_companies_search ON companies USING GIN(search_vector);
```

### 3. Populate Search Vectors

```sql
-- Combine multiple fields with weights (A=highest, D=lowest)
UPDATE candidates SET search_vector =
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(headline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(notes, '')), 'C');
```

### 4. Auto-Update with Triggers

```sql
-- Function to update search vector
CREATE OR REPLACE FUNCTION candidates_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.headline, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger to auto-update on INSERT or UPDATE
CREATE TRIGGER candidates_search_update
    BEFORE INSERT OR UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION candidates_search_vector_update();
```

### 5. Search Query Example

```sql
-- Global search across multiple tables with relevance ranking
WITH search_results AS (
    SELECT
        'candidate' as type,
        id,
        name as title,
        ts_rank(search_vector, query) as rank,
        ts_headline('english', name || ' ' || coalesce(headline, ''), query) as snippet
    FROM candidates, websearch_to_tsquery('english', $1) query
    WHERE search_vector @@ query

    UNION ALL

    SELECT
        'job' as type,
        id,
        title,
        ts_rank(search_vector, query) as rank,
        ts_headline('english', title || ' ' || coalesce(description, ''), query) as snippet
    FROM jobs, websearch_to_tsquery('english', $1) query
    WHERE search_vector @@ query
)
SELECT * FROM search_results
ORDER BY rank DESC
LIMIT 20;
```

## Searchable Entities in Ditto

| Entity | Searchable Fields | Weight |
|--------|-------------------|--------|
| Candidates | name, email, headline, notes, skills | A, B, B, C, B |
| Jobs | title, description, requirements | A, B, C |
| Companies | name, description | A, B |
| Interviews | notes, feedback | C, B |
| Assessments | title, instructions | A, B |

## Performance Considerations

1. **GIN vs GiST indexes**: Use GIN for static data, GiST for frequently updated data. GIN is faster for reads.

2. **Partial indexes**: If searching within tenant/company scope:
   ```sql
   CREATE INDEX idx_candidates_search_company ON candidates
   USING GIN(search_vector) WHERE company_id = $1;
   ```

3. **Query optimization**: Use `websearch_to_tsquery` for user-facing search (handles typos better)

4. **Materialized views**: For cross-table search, consider materialized view refreshed periodically

## Migration Plan

1. Add `search_vector` columns (nullable initially)
2. Create GIN indexes
3. Create update triggers
4. Backfill existing data
5. Make columns NOT NULL

## Estimated Complexity

- **Database changes**: 1 migration file
- **Backend changes**: New search service, repository methods
- **API**: Single `/api/search` endpoint with filters

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| PostgreSQL FTS | Built-in, no extra infra, good for <1M records | Limited fuzzy matching |
| Elasticsearch | Best for large scale, fuzzy search | Extra infra, sync complexity |
| Meilisearch | Simple API, typo tolerance | Extra service to maintain |
| pg_trgm extension | Good for fuzzy/partial matches | Less sophisticated ranking |

## Recommendation

Use PostgreSQL FTS for initial implementation. It covers 90% of use cases without additional infrastructure. Add `pg_trgm` extension for partial matching if needed. Consider Elasticsearch only if search volume exceeds millions of records.

## References

- [PostgreSQL Full Text Search Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [Neon: PostgreSQL Full-Text Search](https://neon.tech/postgresql/postgresql-full-text-search)
