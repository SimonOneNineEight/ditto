# Story 2.1: Interview Database Schema and API Foundation

Status: done

## Story

As a developer,
I want a robust database schema and API layer for interview management,
So that interview data is properly structured and accessible for all interview features.

## Acceptance Criteria

### Given the existing PostgreSQL database

**AC-1**: Interviews Table Creation
- **When** the migration runs
- **Then** a new `interviews` table is created with fields:
  - id (UUID, primary key)
  - user_id (UUID, foreign key to users)
  - application_id (UUID, foreign key to applications)
  - round_number (INT, auto-incremented per application)
  - interview_type (VARCHAR, enum: phone_screen, technical, behavioral, panel, onsite, other)
  - scheduled_date (DATE, required)
  - scheduled_time (TIME, optional)
  - duration_minutes (INT, optional)
  - outcome (TEXT, optional)
  - overall_feeling (VARCHAR, enum: excellent, good, okay, poor)
  - went_well (TEXT, optional)
  - could_improve (TEXT, optional)
  - confidence_level (INT, 1-5)
  - created_at, updated_at, deleted_at (TIMESTAMP)

**AC-2**: Interviewers Table Creation
- **When** the migration runs
- **Then** a new `interviewers` table is created with:
  - id (UUID, primary key)
  - interview_id (UUID, foreign key to interviews)
  - name (VARCHAR, required)
  - role (VARCHAR, optional)
  - created_at, deleted_at (TIMESTAMP)

**AC-3**: Interview Questions Table Creation
- **When** the migration runs
- **Then** a new `interview_questions` table is created with:
  - id (UUID, primary key)
  - interview_id (UUID, foreign key to interviews)
  - question_text (TEXT, required)
  - answer_text (TEXT, optional)
  - order (INT, for reordering)
  - created_at, updated_at, deleted_at (TIMESTAMP)

**AC-4**: Interview Notes Table Creation
- **When** the migration runs
- **Then** a new `interview_notes` table is created with:
  - id (UUID, primary key)
  - interview_id (UUID, foreign key to interviews)
  - note_type (VARCHAR, enum: preparation, company_research, feedback, reflection, general)
  - content (TEXT, sanitized HTML, max 50KB)
  - created_at, updated_at, deleted_at (TIMESTAMP)
- **And** a unique constraint on (interview_id, note_type) prevents duplicate note types

**AC-5**: Foreign Key Constraints
- **When** an interview is deleted
- **Then** related interviewers, questions, and notes are cascade deleted
- **And** interviews cannot reference non-existent applications
- **And** interviews cannot reference non-existent users

**AC-6**: Index Creation
- **When** the migration runs
- **Then** partial indexes are created for query performance:
  - `idx_interviews_user_id` on user_id WHERE deleted_at IS NULL
  - `idx_interviews_application_id` on application_id WHERE deleted_at IS NULL
  - `idx_interviews_scheduled_date` on scheduled_date WHERE deleted_at IS NULL
  - `idx_interviews_unique_round` unique on (application_id, round_number) WHERE deleted_at IS NULL
  - `idx_interviewers_interview_id` on interview_id WHERE deleted_at IS NULL
  - `idx_interview_questions_interview_id` on interview_id WHERE deleted_at IS NULL
  - `idx_interview_notes_interview_id` on interview_id WHERE deleted_at IS NULL

**AC-7**: Down Migration
- **When** the down migration runs
- **Then** all four tables are dropped in correct order (notes → questions → interviewers → interviews)
- **And** all indexes are dropped

### Edge Cases
- Running migration on existing database: Should not affect existing tables
- Re-running migration: Should be idempotent (IF NOT EXISTS patterns)
- Application deleted with interviews: Cascade delete removes all interview data

## Tasks / Subtasks

### Database Development

- [x] **Task 1**: Create migration file `000007_create_interview_system.up.sql` (AC: #1-#6)
  - [x] 1.1: Create `interviews` table with all required columns and constraints (modified in 000001)
  - [x] 1.2: Create `interviewers` table with foreign key to interviews
  - [x] 1.3: Create `interview_questions` table with order column
  - [x] 1.4: Create `interview_notes` table with unique constraint on (interview_id, note_type)
  - [x] 1.5: Create all partial indexes for query performance
  - [x] 1.6: Create unique constraint for round_number per application

- [x] **Task 2**: Create down migration `000007_create_interview_system.down.sql` (AC: #7)
  - [x] 2.1: Drop tables in correct dependency order
  - [x] 2.2: Verify clean rollback

### Backend Development

- [x] **Task 3**: Create Go models for interview entities
  - [x] 3.1: Create `backend/internal/models/interview.go` with Interview struct
  - [x] 3.2: Add Interviewer, InterviewQuestion, InterviewNote structs
  - [x] 3.3: Add InterviewWithDetails composite struct for API responses
  - [x] 3.4: Add type constants for interview_type and note_type enums

- [x] **Task 4**: Create interview repository
  - [x] 4.1: Create `backend/internal/repository/interview.go`
  - [x] 4.2: Implement Create, GetByID, Update, Delete methods
  - [x] 4.3: Implement GetByApplicationID (list interviews for an application)
  - [x] 4.4: Implement GetByUserID (date filtering deferred to Story 2.10)
  - [x] 4.5: Implement GetNextRoundNumber (SELECT MAX(round_number) + 1)

- [x] **Task 5**: Create related entity repositories
  - [x] 5.1: Create `backend/internal/repository/interviewer.go`
  - [x] 5.2: Create `backend/internal/repository/interview_question.go`
  - [x] 5.3: Create `backend/internal/repository/interview_note.go`
  - [x] 5.4: Each with basic CRUD operations

### Testing

- [x] **Task 6**: Run and verify migration
  - [x] 6.1: Run up migration against local database
  - [x] 6.2: Verify all tables created with correct structure
  - [x] 6.3: Verify indexes exist with `\di` in psql
  - [x] 6.4: Verify foreign key constraints work
  - [x] 6.5: Run down migration and verify clean state
  - [x] 6.6: Run up migration again to confirm idempotency

## Dev Notes

### Architecture Constraints

**From Epic 2 Tech Spec:**
- Follow existing repository pattern from Epic 1
- Use soft deletes (`deleted_at` column) for all tables
- Use partial indexes (WHERE deleted_at IS NULL) for query performance
- Interview round_number auto-increments per application
- Rich text content stored as sanitized HTML (max 50KB per note)

**Database Schema (from tech spec):**

```sql
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    interview_type VARCHAR(50) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    duration_minutes INT,
    outcome TEXT,
    overall_feeling VARCHAR(20),
    went_well TEXT,
    could_improve TEXT,
    confidence_level INT CHECK (confidence_level BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE interviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    "order" INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE interview_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Interview Type Enum Values:**
- `phone_screen` - Initial phone screening
- `technical` - Technical assessment interview
- `behavioral` - Behavioral/culture fit interview
- `panel` - Panel interview with multiple interviewers
- `onsite` - Full onsite interview day
- `other` - Other interview types

**Note Type Enum Values:**
- `preparation` - Pre-interview preparation notes
- `company_research` - Research about the company
- `feedback` - Post-interview feedback from interviewers
- `reflection` - Self-reflection after interview
- `general` - General notes

### Project Structure Notes

**New Files:**
```
backend/
├── internal/
│   ├── models/
│   │   └── interview.go          # Interview, Interviewer, Question, Note structs
│   └── repository/
│       ├── interview.go          # Interview CRUD + query methods
│       ├── interviewer.go        # Interviewer CRUD
│       ├── interview_question.go # Question CRUD with ordering
│       └── interview_note.go     # Note CRUD
└── migrations/
    ├── 000007_create_interview_system.up.sql
    └── 000007_create_interview_system.down.sql
```

### Learnings from Previous Story

**From Story 1.6 (Status: done)**

- **Soft Delete Pattern**: Use `deleted_at IS NULL` in all queries and partial indexes
- **Repository Pattern**: Follow same structure as `file.go` - interface + implementation
- **Migration Naming**: Sequential numbering (000005 follows existing migrations)
- **Index Strategy**: Partial indexes for soft delete performance
- **Model Organization**: Keep related structs in same file (Interview + related types)

[Source: stories/1-6-storage-quota-management-and-visibility.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts]
- [Source: docs/tech-spec-epic-2.md#Interview-Entity]
- [Source: docs/epics.md#Story-2.1]
- [Source: docs/architecture.md#Database-Architecture]

## Dev Agent Record

### Context Reference

- [docs/stories/2-1-interview-database-schema-and-api-foundation.context.xml](2-1-interview-database-schema-and-api-foundation.context.xml)

### Agent Model Used

### Debug Log References

### Completion Notes List

- Modified `000001_initial_schema.up.sql` to expand interviews table with full schema (original had only basic fields)
- `000007_create_interview_system.up.sql` creates child tables only (interviewers, interview_questions, interview_notes)
- Used partial indexes with `WHERE deleted_at IS NULL` for query performance
- Interview `round_number` auto-increments per application via `GetNextRoundNumber` query
- Date filtering for `GetInterviewsByUser` deferred to Story 2.10 (YAGNI)
- All repositories follow existing patterns from Epic 1

### File List

- `backend/migrations/000001_initial_schema.up.sql` (modified - expanded interviews table)
- `backend/migrations/000007_create_interview_system.up.sql` (new)
- `backend/migrations/000007_create_interview_system.down.sql` (new)
- `backend/internal/models/interview.go` (new)
- `backend/internal/repository/interview.go` (new)
- `backend/internal/repository/interviewer.go` (new)
- `backend/internal/repository/interview_question.go` (new)
- `backend/internal/repository/interview_note.go` (new)

---

## Change Log

### 2026-01-26 - Story Completed
- **Version:** v1.1
- **Author:** Pair programming session
- **Status:** Done
- **Summary:** Completed all migrations, models, and repositories. Modified 000001 migration to expand interviews table (already existed). Created 000007 for child tables. All 4 repositories implemented with full CRUD. Build verified.

### 2026-01-25 - Story Drafted
- **Version:** v1.0
- **Author:** Claude Opus 4.5 (via BMad create-story workflow)
- **Status:** Drafted
- **Summary:** Created story for Interview Database Schema and API Foundation. First story in Epic 2, establishes database foundation for interview management. Creates 4 tables (interviews, interviewers, interview_questions, interview_notes) with proper indexes, constraints, and soft delete support. 6 tasks covering migration files, Go models, and repositories.
