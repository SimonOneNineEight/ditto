# Ditto Backend - Database Schema Documentation

**Database:** PostgreSQL
**ORM:** sqlx (Go)
**Last Updated:** 2025-11-08

---

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Authentication & Authorization](#authentication--authorization)
4. [Job Management](#job-management)
5. [Applications & Interviews](#applications--interviews)
6. [Skills & Categories](#skills--categories)
7. [Junction Tables](#junction-tables)
8. [Indexes](#indexes)
9. [Database Functions & Triggers](#database-functions--triggers)
10. [Relationships Diagram](#relationships-diagram)
11. [Special Features](#special-features)

---

## Overview

The Ditto database schema manages a job application tracking system with the following core domains:
- **User Management:** Users, authentication, authorization roles
- **Company Data:** Company information with enrichment capabilities
- **Job Listings:** Job postings with salary and skills requirements
- **Applications:** Job application tracking with status and notes
- **Interviews:** Interview records with feedback and questions
- **Skills:** Skill categorization and user/job skill associations

All tables use UUID primary keys and include audit timestamps (`created_at`, `updated_at`). Soft deletes are implemented via `deleted_at` nullable timestamp fields.

---

## Core Tables

### roles
Stores user roles for authorization and access control.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique role identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | - | Role name (e.g., 'admin', 'user') |
| description | TEXT | - | - | Human-readable role description |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |

**Triggers:** `update_roles_timestamp`

---

### users
Core user table storing basic user information.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique user identifier |
| name | TEXT | NOT NULL | - | User's full name (1-100 chars) |
| email | TEXT | NOT NULL, UNIQUE | - | User's email address |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |
| deleted_at | TIMESTAMP | NULL | NULL | Soft delete timestamp (NULL = active) |

**Indexes:**
- `idx_users_email` on (email)
- `idx_users_deleted_at` on (deleted_at)

**Triggers:** `update_users_timestamp`

**Special Features:**
- Soft deletes: Use `deleted_at IS NULL` in queries for active users
- Go model includes `IsDeleted()` method for convenience

---

### users_auth
Stores authentication credentials and OAuth provider information.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique auth record identifier |
| user_id | UUID | FOREIGN KEY → users(id), UNIQUE | - | Reference to user (one auth record per user) |
| password_hash | TEXT | NULL | NULL | Hashed password (NULL for OAuth users) |
| auth_provider | TEXT | NOT NULL | - | Auth provider (e.g., 'local', 'google', 'github', 'linkedin') |
| avatar_url | TEXT | NULL | NULL | User's profile avatar URL from OAuth provider |
| refresh_token | TEXT | NULL | NULL | OAuth refresh token (secure - marked as sensitive in Go) |
| refresh_token_expires_at | TIMESTAMP | NULL | NULL | Token expiration timestamp |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |

**Indexes:**
- `idx_users_auth_user_id` on (user_id)

**Triggers:** `update_users_auth_timestamp`

**Constraints:**
- Migration 000002 adds UNIQUE constraint on `user_id` to ensure each user has only one auth record

**Special Features:**
- Supports both local (password) and OAuth authentication
- Go model marks `PasswordHash`, `RefreshToken`, and `RefreshTokenExpiresAt` as sensitive (not exposed in JSON responses)

---

### companies
Stores company information with enrichment data capabilities.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique company identifier |
| name | VARCHAR(255) | NOT NULL, UNIQUE | - | Company name |
| description | TEXT | NULL | NULL | Company description |
| website | VARCHAR(255) | NULL | NULL | Company website URL |
| logo_url | TEXT | NULL | NULL | Company logo image URL |
| domain | VARCHAR(255) | NULL | NULL | Company domain (e.g., example.com) |
| opencorp_id | VARCHAR(255) | NULL | NULL | External OpenCorp ID for data enrichment |
| last_enriched_at | TIMESTAMP | NULL | NULL | Last time company data was enriched |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |
| deleted_at | TIMESTAMP | NULL | NULL | Soft delete timestamp |

**Indexes:**
- `idx_companies_name` on (name)
- `idx_companies_deleted_at` on (deleted_at)
- `idx_companies_domain` on (domain) WHERE deleted_at IS NULL (partial index)
- `idx_companies_name_lower` on (LOWER(name)) WHERE deleted_at IS NULL (partial index for case-insensitive search)

**Triggers:** `update_companies_timestamp`

**Special Features:**
- Soft deletes for data retention
- Enrichment tracking via `last_enriched_at`
- OpenCorp integration support
- Go model includes helper methods: `IsDeleted()`, `HasWebsite()`, `HasLogo()`

---

## Authentication & Authorization

### user_roles
Junction table mapping users to roles (many-to-many).

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| user_id | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, PRIMARY KEY | - | User identifier |
| role_id | UUID | FOREIGN KEY → roles(id) ON DELETE CASCADE, PRIMARY KEY | - | Role identifier |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |

**Primary Key:** Composite (user_id, role_id)

**Cascade Behavior:** Deleting a user automatically removes all their role assignments

---

## Job Management

### jobs
Job postings table with salary and type information.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique job identifier |
| company_id | UUID | FOREIGN KEY → companies(id), NOT NULL | - | Associated company |
| title | TEXT | NOT NULL | - | Job title (1-255 chars) |
| job_description | TEXT | NOT NULL | - | Full job description (required) |
| location | TEXT | NOT NULL | - | Job location (required) |
| job_type | TEXT | NOT NULL | - | Job type (max 50 chars, e.g., 'Full-time', 'Part-time') |
| min_salary | NUMERIC | NULL | NULL | Minimum salary (optional) |
| max_salary | NUMERIC | NULL | NULL | Maximum salary (optional) |
| currency | TEXT | NULL | NULL | Currency code (e.g., 'USD') |
| is_expired | BOOLEAN | NOT NULL | false | Job expiration status |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |
| deleted_at | TIMESTAMP | NULL | NULL | Soft delete timestamp |

**Indexes:**
- `idx_jobs_company_id` on (company_id)
- `idx_jobs_deleted_at` on (deleted_at)

**Triggers:**
- `update_jobs_timestamp`
- `update_job_from_user_jobs` (AFTER INSERT/UPDATE/DELETE on user_jobs)

**Special Features:**
- Soft deletes for data retention
- Salary range is optional (both fields can be NULL)
- Job expiration tracking via `is_expired` boolean
- Go model includes helper methods: `IsDeleted()`, `HasSalaryRange()`

---

### job_skills
Junction table mapping jobs to required skills (many-to-many).

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| job_id | UUID | FOREIGN KEY → jobs(id) ON DELETE CASCADE, PRIMARY KEY | - | Job identifier |
| skill_id | UUID | FOREIGN KEY → skills(id) ON DELETE CASCADE, PRIMARY KEY | - | Skill identifier |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |

**Primary Key:** Composite (job_id, skill_id)

**Cascade Behavior:** Deleting a job automatically removes its skill associations

---

### user_jobs
Junction table mapping users to jobs they've saved/bookmarked.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE | - | Job identifier (also serves as composite PK element) |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | - | User identifier |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |

**Indexes:**
- `idx_user_jobs_user_id` on (user_id)
- `idx_user_jobs_job_id` on (id)

**Triggers:**
- `update_user_jobs_timestamp`
- `update_job_from_user_jobs` (updates parent job's updated_at)

**Special Features:**
- Tracks which jobs users have saved/bookmarked
- Deleting a job cascades to remove user associations
- Parent job's `updated_at` is automatically updated when user jobs change

---

## Applications & Interviews

### application_status
Lookup table for job application statuses.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique status identifier |
| name | TEXT | NOT NULL | - | Status name (e.g., 'Applied', 'Interviewing', 'Rejected', 'Accepted') |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |

**Triggers:** `update_application_status_timestamp`

---

### applications
Job applications submitted by users.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique application identifier |
| user_id | UUID | REFERENCES users(id) | - | Applicant user (required in Go validation) |
| job_id | UUID | REFERENCES jobs(id) | - | Job applied to (required in Go validation) |
| application_status_id | UUID | REFERENCES application_status(id) | - | Current application status (required) |
| applied_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Application submission timestamp |
| offer_received | BOOLEAN | NOT NULL | false | Whether an offer was received |
| attempt_number | INT | NOT NULL, CHECK >= 1 | 1 | Number of application attempts (min value: 1) |
| notes | TEXT | NULL | NULL | User notes about the application |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |
| deleted_at | TIMESTAMP | NULL | NULL | Soft delete timestamp |

**Indexes:**
- `idx_applications_user_id` on (user_id)
- `idx_applications_job_id` on (job_id)
- `idx_applications_status_id` on (application_status_id)
- `idx_applications_deleted_at` on (deleted_at)

**Triggers:** `update_applications_timestamp`

**Special Features:**
- Soft deletes for historical tracking
- Tracks multiple application attempts via `attempt_number`
- Offers can be tracked via `offer_received` boolean
- Go model includes helper methods: `IsDeleted()`, `HasNote()`

---

### interviews
Interview records for job applications.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique interview identifier |
| application_id | UUID | REFERENCES applications(id) | - | Associated application (required) |
| date | TIMESTAMP | NOT NULL | - | Interview date/time (required) |
| interview_type | TEXT | NOT NULL | - | Interview type (max 50 chars, e.g., 'Phone', 'Video', 'In-person') |
| question_asked | TEXT | NULL | NULL | Questions asked during interview |
| notes | TEXT | NULL | NULL | General interview notes |
| feedback | TEXT | NULL | NULL | Interview feedback from interviewer/applicant |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |
| deleted_at | TIMESTAMP | NULL | NULL | Soft delete timestamp |

**Indexes:**
- `idx_interviews_application_id` on (application_id)
- `idx_interviews_deleted_at` on (deleted_at)

**Triggers:** `update_interviews_timestamp`

**Special Features:**
- Soft deletes for historical tracking
- Multiple optional fields for rich interview documentation
- Go model includes helper methods: `IsDeleted()`, `HasFeedback()`, `HasQuestions()`

---

## Skills & Categories

### skill_categories
Categories for organizing skills.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique category identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | - | Category name (e.g., 'Programming', 'Soft Skills') |
| description | TEXT | NULL | NULL | Category description |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |

**Triggers:** `update_skill_categories_timestamp`

---

### skills
Individual skills that can be associated with jobs and users.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | Unique skill identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | - | Skill name (e.g., 'Go', 'Python', 'Leadership') |
| category_id | UUID | REFERENCES skill_categories(id) ON DELETE SET NULL | - | Skill category (optional - NULL if category deleted) |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Last update timestamp (auto-managed by trigger) |

**Triggers:** `update_skills_timestamp`

**Special Features:**
- Orphaned skills remain if category is deleted (ON DELETE SET NULL)

---

## Junction Tables

### user_skills
Junction table mapping users to their skills with proficiency levels (many-to-many).

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| user_id | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, PRIMARY KEY | - | User identifier |
| skill_id | UUID | FOREIGN KEY → skills(id) ON DELETE CASCADE, PRIMARY KEY | - | Skill identifier |
| proficiency_level | INTEGER | CHECK (1-5) | - | Proficiency rating (1=Beginner, 5=Expert) |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Record creation timestamp |

**Primary Key:** Composite (user_id, skill_id)

**Constraints:**
- `CHECK (proficiency_level >= 1 AND proficiency_level <= 5)`

**Cascade Behavior:** Deleting a user or skill removes associated proficiency records

---

## Indexes

### All Indexes

| Index Name | Table | Columns | Type | Notes |
|------------|-------|---------|------|-------|
| idx_users_email | users | (email) | Standard | Used for login and duplicate prevention |
| idx_users_deleted_at | users | (deleted_at) | Standard | Filter for active users efficiently |
| idx_users_auth_user_id | users_auth | (user_id) | Standard | Foreign key lookup |
| idx_companies_name | companies | (name) | Standard | Company lookup |
| idx_companies_deleted_at | companies | (deleted_at) | Standard | Filter for active companies |
| idx_companies_domain | companies | (domain) | Partial | WHERE deleted_at IS NULL - domain lookup for enrichment |
| idx_companies_name_lower | companies | (LOWER(name)) | Partial | WHERE deleted_at IS NULL - case-insensitive company search |
| idx_jobs_company_id | jobs | (company_id) | Standard | Get jobs by company |
| idx_jobs_deleted_at | jobs | (deleted_at) | Standard | Filter for active jobs |
| idx_user_jobs_user_id | user_jobs | (user_id) | Standard | Get bookmarked jobs for a user |
| idx_user_jobs_job_id | user_jobs | (id) | Standard | Lookup single user_job |
| idx_applications_user_id | applications | (user_id) | Standard | Get user's applications |
| idx_applications_job_id | applications | (job_id) | Standard | Get applications for a job |
| idx_applications_status_id | applications | (application_status_id) | Standard | Filter by application status |
| idx_applications_deleted_at | applications | (deleted_at) | Standard | Filter for active applications |
| idx_interviews_application_id | interviews | (application_id) | Standard | Get interviews for an application |
| idx_interviews_deleted_at | interviews | (deleted_at) | Standard | Filter for active interviews |

---

## Database Functions & Triggers

### Automatic Timestamp Management

#### Function: `update_timestamp()`
Automatically updates `updated_at` column to current timestamp on row update.

```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Applied to Tables:**
- roles
- users
- users_auth
- companies
- skill_categories
- skills
- application_status
- jobs
- user_jobs
- applications
- interviews

#### Event: `add_timestamp_trigger_event`
Event trigger that automatically creates timestamp triggers for new tables (ensures consistent behavior).

```sql
CREATE EVENT TRIGGER add_timestamp_trigger_event
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION add_timestamp_trigger();
```

---

### Parent Table Update Trigger

#### Function: `update_parent_job_timestamp()`
Updates the parent job's `updated_at` timestamp when child `user_jobs` records are modified.

```sql
CREATE OR REPLACE FUNCTION update_parent_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**Applied to:** `user_jobs` (AFTER INSERT OR UPDATE OR DELETE)

**Purpose:** Maintains consistency by updating the job's modification time when users bookmark/unbookmark it

---

## Relationships Diagram

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION & AUTHORIZATION              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐         ┌──────────────┐        ┌────────┐        │
│  │  roles   │─────────│ user_roles   │────────│ users  │        │
│  └──────────┘         └──────────────┘        └───┬────┘        │
│                                                    │              │
│                                              ┌─────▼──────────┐  │
│                                              │  users_auth    │  │
│                                              │  (OAuth/Local) │  │
│                                              └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    JOB MANAGEMENT & APPLICATIONS                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐                                                    │
│  │companies │◄───────────┐                                      │
│  └─────┬────┘            │                                       │
│        │                 │                                       │
│        │ (1:M)           │                                       │
│        ▼                 │                                       │
│  ┌──────────┐            │                                       │
│  │  jobs    │            │                                       │
│  └──┬───┬───┘            │                                       │
│     │   │                │                                       │
│     │   └────┬───────────┼──────────────────┐                  │
│     │        │           │                  │                  │
│     │        │ (M:M)     │                  │                  │
│     │        ▼           │                  │                  │
│     │  ┌──────────────┐  │                  │                  │
│     │  │ job_skills   │  │                  │                  │
│     │  └──────────────┘  │                  │                  │
│     │        ▲           │                  │                  │
│     │        │           │                  │                  │
│     │    ┌───┴────┐      │                  │                  │
│     │    │ skills │      │                  │                  │
│     │    └────┬───┘      │                  │                  │
│     │         │          │                  │                  │
│     │    (M:M)│          │                  │                  │
│     │         ▼          │                  │                  │
│     │  ┌──────────────┐  │                  │                  │
│     │  │ user_skills  │◄─┼──────────────────┘                  │
│     │  └──────────────┘  │                                      │
│     │         ▲          │                                      │
│     │         │          │                                      │
│     │   ┌─────┴──────┐   │                                      │
│     │   │    users   │◄──┴──────────────────────────────┐      │
│     │   └─────┬──────┘                                  │      │
│     │         │                                         │      │
│     │         │ (1:M)                                   │      │
│     │         ▼                                         │      │
│     │  ┌──────────────┐     ┌──────────────────┐       │      │
│     │  │  user_jobs   │─────│ (bookmarks)      │       │      │
│     │  └──────────────┘     └──────────────────┘       │      │
│     │         ▲                                         │      │
│     │         │                                         │      │
│     └─────────┼─────────────┬──────────────────────────┘      │
│               │             │                                  │
│         (foreign key)   ┌────▼──────────┐                     │
│               │         │ applications  │                     │
│               │         └────┬──────────┘                     │
│               │              │                                │
│               │              ▼                                │
│               │      ┌──────────────────┐                    │
│               │      │ application_     │                    │
│               │      │ status           │                    │
│               │      └──────────────────┘                    │
│               │              ▲                               │
│               │              │                               │
│               └──────────────┼───────────────────────────────┘
│                              │                                │
│                    ┌─────────┴────────┐                      │
│                    │                  │                      │
│                    ▼                  │                      │
│              ┌──────────────┐        │                      │
│              │ interviews   │        │                      │
│              └──────────────┘        │                      │
│                                      │ (M:1)                │
└──────────────────────────────────────┼──────────────────────┘
                      ┌──────────────┬─┘
                      │ skill_       │
                      │ categories   │
                      └──────────────┘
```

### Relationship Summary

**User-centric Views:**
- `users` → `user_roles` → `roles` (authorization)
- `users` → `users_auth` (authentication)
- `users` → `user_jobs` → `jobs` (bookmarked jobs)
- `users` → `applications` → `jobs` (applied jobs)
- `users` → `applications` → `interviews` (interview history)
- `users` → `user_skills` → `skills` (user expertise)

**Job-centric Views:**
- `jobs` → `company_id` → `companies` (employer)
- `jobs` → `job_skills` → `skills` (requirements)
- `jobs` → `applications` → `interviews` (applicant pipeline)

**Application Pipeline:**
- `applications` → `application_status` (current stage)
- `applications` → `interviews` (interview records)

---

## Special Features

### Soft Deletes

Several tables implement soft deletes using a nullable `deleted_at` timestamp:
- `users`
- `companies`
- `jobs`
- `applications`
- `interviews`

**Pattern:** Query with `WHERE deleted_at IS NULL` to get active records. Go models include `IsDeleted()` helper methods.

**Benefits:**
- Data retention for compliance and auditing
- Ability to restore accidentally deleted records
- Historical analysis without data loss

---

### Automatic Timestamp Management

All tables include `created_at` and `updated_at` columns with automatic management:
- `created_at`: Set at INSERT time, never modified
- `updated_at`: Set at INSERT time, automatically updated on any row change via `update_timestamp()` trigger

**Implementation:** BEFORE UPDATE triggers execute the `update_timestamp()` function automatically.

---

### OAuth & Multiple Authentication Methods

The `users_auth` table supports multiple authentication strategies:
- **Local authentication:** Password-based with bcrypt hash
- **OAuth providers:** Google, GitHub, LinkedIn
- **Multi-provider support:** UNIQUE constraint on `user_id` ensures one auth method per user
- **Token management:** `refresh_token` and `refresh_token_expires_at` for session management

**Sensitive fields** (marked in Go):
- `password_hash` (not exposed in JSON)
- `refresh_token` (not exposed in JSON)
- `refresh_token_expires_at` (not exposed in JSON)

---

### Company Enrichment

The `companies` table tracks data enrichment from external sources:
- `opencorp_id`: External ID for third-party data
- `last_enriched_at`: Timestamp of last enrichment operation
- Enrichment fields: `domain`, `website`, `logo_url`, `description`

**Use Case:** Populate company details from OpenCorp or similar data providers on-demand.

---

### Job Application Tracking

The `applications` table provides comprehensive job application lifecycle tracking:
- `applied_at`: Original application timestamp
- `attempt_number`: Re-application counter (allows tracking multiple attempts at same company)
- `offer_received`: Boolean flag for quick filtering of successful applications
- `notes`: Custom user notes about the application
- `application_status_id`: Foreign key to `application_status` lookup table
- `deleted_at`: Soft delete for historical tracking

**Status Flow:** Applications progress through statuses in `application_status` table (e.g., Applied → Interviewing → Rejected/Accepted)

---

### Interview Documentation

The `interviews` table captures detailed interview information:
- `interview_type`: Categorize interviews (Phone, Video, In-person, etc.)
- `date`: Interview scheduled time
- `question_asked`: Questions asked by interviewer
- `notes`: General notes from either party
- `feedback`: Feedback from interviewer or personal assessment

**Helper Methods** (Go model):
- `HasFeedback()`: Check if feedback is recorded
- `HasQuestions()`: Check if questions are documented

---

### Skill Proficiency Levels

The `user_skills` junction table includes a proficiency level system:
- **Range:** 1-5 (enforced by CHECK constraint)
- **Mapping:** 1=Beginner, 2=Beginner-Intermediate, 3=Intermediate, 4=Advanced, 5=Expert
- **Validation:** Enforced at database level and Go model

---

### Parent-Child Timestamp Consistency

The `user_jobs` table demonstrates advanced trigger usage:
- When a user bookmarks/unbookmarks a job, the parent `jobs` record's `updated_at` is automatically updated
- Implemented via `update_parent_job_timestamp()` trigger
- Ensures job modification time reflects all related activities

---

## Migration History

### Migration 000001_initial_schema
Creates all core tables, indexes, and triggers described in this document.

### Migration 000002_add_users_auth_user_id_unique
Adds UNIQUE constraint on `users_auth.user_id` to enforce one-authentication-per-user pattern for OAuth support.

```sql
ALTER TABLE users_auth ADD CONSTRAINT users_auth_user_id_unique UNIQUE (user_id);
```

---

## Notes for Development

1. **Always use soft deletes** for user-facing data (users, companies, jobs, applications, interviews)
2. **Query active records** with `WHERE deleted_at IS NULL` or use model helper methods
3. **Timezone handling:** All timestamps are stored as TIMESTAMP WITHOUT TIME ZONE; assume UTC application-wide
4. **UUID generation:** Use PostgreSQL's `gen_random_uuid()` at database level
5. **Foreign key constraints** include CASCADE deletes on junction tables for referential integrity
6. **Indexes are designed** for common query patterns (lookups by ID, email, company, user, status)
7. **Partial indexes** on company name and domain filter out deleted records for query efficiency
8. **Event triggers** ensure new tables automatically get timestamp management (see `add_timestamp_trigger_event`)

---

## File References

- **Migrations:** `/home/simon198/work/personal/ditto/backend/migrations/`
  - `000001_initial_schema.up.sql` - Initial schema creation
  - `000001_initial_schema.down.sql` - Rollback
  - `000002_add_users_auth_user_id_unique.up.sql` - OAuth constraint addition
  - `000002_add_users_auth_user_id_unique.down.sql` - Rollback

- **Go Models:** `/home/simon198/work/personal/ditto/backend/internal/models/`
  - `user.go` - User and UserAuth structs
  - `company.go` - Company struct with enrichment data
  - `job.go` - Job and UserJob structs
  - `application.go` - Application and ApplicationStatus structs
  - `interview.go` - Interview struct

---

**Documentation generated:** 2025-11-08
