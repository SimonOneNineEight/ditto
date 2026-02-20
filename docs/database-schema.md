# Ditto Database Schema

**Database:** PostgreSQL 15+
**Query Library:** sqlx (Go)
**Migrations:** golang-migrate (`backend/migrations/`)

---

## Overview

All tables use UUID primary keys (`gen_random_uuid()`). Audit columns (`created_at`, `updated_at`) are present on all tables with automatic trigger-based `updated_at` management. User-facing tables support soft deletes via nullable `deleted_at` columns.

---

## Tables

### users

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| name | TEXT | NOT NULL | |
| email | TEXT | NOT NULL, UNIQUE | |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:** `idx_users_email (email)`, `idx_users_deleted_at (deleted_at)`

---

### users_auth

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| user_id | UUID | FK → users(id), UNIQUE | |
| password_hash | TEXT | | NULL |
| auth_provider | TEXT | NOT NULL | |
| avatar_url | TEXT | | NULL |
| refresh_token | TEXT | | NULL |
| refresh_token_expires_at | TIMESTAMP | | NULL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |

**Indexes:** `idx_users_auth_user_id (user_id)`

Supports local (password) and OAuth (GitHub, Google) authentication. The UNIQUE constraint on `user_id` ensures one auth record per user.

---

### companies

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL, UNIQUE | |
| description | TEXT | | NULL |
| website | VARCHAR(255) | | NULL |
| logo_url | TEXT | | NULL |
| domain | VARCHAR(255) | | NULL |
| opencorp_id | VARCHAR(255) | | NULL |
| last_enriched_at | TIMESTAMP | | NULL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:** `idx_companies_name (name)`, `idx_companies_deleted_at (deleted_at)`, `idx_companies_domain (domain) WHERE deleted_at IS NULL`, `idx_companies_name_lower (LOWER(name)) WHERE deleted_at IS NULL`

---

### jobs

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| company_id | UUID | FK → companies(id), NOT NULL | |
| title | TEXT | NOT NULL | |
| job_description | TEXT | NOT NULL | |
| location | TEXT | NOT NULL | |
| job_type | TEXT | | |
| source_url | VARCHAR(2048) | | NULL |
| platform | VARCHAR(50) | | NULL |
| min_salary | NUMERIC | | NULL |
| max_salary | NUMERIC | | NULL |
| currency | TEXT | | NULL |
| is_expired | BOOLEAN | NOT NULL | false |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:** `idx_jobs_company_id (company_id)`, `idx_jobs_deleted_at (deleted_at)`, `idx_jobs_platform (platform) WHERE deleted_at IS NULL`

`source_url` and `platform` added in migration 000005 to support job URL extraction.

---

### application_status

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| name | TEXT | NOT NULL, UNIQUE | |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |

Lookup table for application workflow statuses (Applied, Interviewing, Rejected, Accepted, Saved, etc.).

---

### applications

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| user_id | UUID | FK → users(id) | |
| job_id | UUID | FK → jobs(id) | |
| application_status_id | UUID | FK → application_status(id) | |
| applied_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| offer_received | BOOLEAN | NOT NULL | false |
| attempt_number | INT | NOT NULL, CHECK >= 1 | 1 |
| notes | TEXT | | NULL |
| search_vector | tsvector | | NULL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:**
- `idx_applications_user_id (user_id)`
- `idx_applications_job_id (job_id)`
- `idx_applications_status_id (application_status_id)`
- `idx_applications_deleted_at (deleted_at)`
- `idx_applications_search USING GIN(search_vector)` — FTS
- `idx_applications_user_status (user_id, application_status_id) WHERE deleted_at IS NULL` — performance
- `idx_applications_user_date (user_id, applied_at DESC) WHERE deleted_at IS NULL` — performance
- `idx_applications_compound (user_id, application_status_id, applied_at) WHERE deleted_at IS NULL` — performance

**FTS Trigger:** `applications_search_update` updates `search_vector` from `notes` on INSERT/UPDATE.

---

### interviews

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| user_id | UUID | FK → users(id) ON DELETE CASCADE, NOT NULL | |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE, NOT NULL | |
| round_number | INT | NOT NULL | |
| interview_type | VARCHAR(60) | NOT NULL | |
| scheduled_date | DATE | NOT NULL | |
| scheduled_time | TIME | | NULL |
| duration_minutes | INT | | NULL |
| outcome | TEXT | | NULL |
| overall_feeling | VARCHAR(20) | | NULL |
| went_well | TEXT | | NULL |
| could_improve | TEXT | | NULL |
| confidence_level | INT | CHECK (1-5) | NULL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:**
- `idx_interviews_user_id (user_id) WHERE deleted_at IS NULL`
- `idx_interviews_application_id (application_id) WHERE deleted_at IS NULL`
- `idx_interviews_scheduled_date (scheduled_date) WHERE deleted_at IS NULL`
- `idx_interviews_unique_round (application_id, round_number) WHERE deleted_at IS NULL` — UNIQUE

Self-assessment fields (`overall_feeling`, `went_well`, `could_improve`, `confidence_level`) track post-interview reflection. Valid `overall_feeling` values: excellent, good, okay, poor. Valid `interview_type` values: phone_screen, technical, behavioral, panel, onsite, other.

---

### interviewers

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| interview_id | UUID | FK → interviews(id) ON DELETE CASCADE, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | |
| role | VARCHAR(255) | | NULL |
| created_at | TIMESTAMP | | NOW() |
| updated_at | TIMESTAMP | | NOW() |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:** `idx_interviewers_interview_id (interview_id) WHERE deleted_at IS NULL`

---

### interview_questions

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| interview_id | UUID | FK → interviews(id) ON DELETE CASCADE, NOT NULL | |
| question_text | TEXT | NOT NULL | |
| answer_text | TEXT | | NULL |
| order | INT | NOT NULL | 0 |
| search_vector | tsvector | | NULL |
| created_at | TIMESTAMP | | NOW() |
| updated_at | TIMESTAMP | | NOW() |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:**
- `idx_interview_questions_interview_id (interview_id) WHERE deleted_at IS NULL`
- `idx_interview_questions_search USING GIN(search_vector)` — FTS

**FTS Trigger:** `interview_questions_search_update` updates `search_vector` with weighted columns: `question_text` (A), `answer_text` (B).

---

### interview_notes

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| interview_id | UUID | FK → interviews(id) ON DELETE CASCADE, NOT NULL | |
| note_type | VARCHAR(50) | NOT NULL | |
| content | TEXT | | NULL |
| search_vector | tsvector | | NULL |
| created_at | TIMESTAMP | | NOW() |
| updated_at | TIMESTAMP | | NOW() |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:**
- `idx_interview_notes_interview_id (interview_id) WHERE deleted_at IS NULL`
- `idx_interview_notes_unique_type (interview_id, note_type) WHERE deleted_at IS NULL` — UNIQUE
- `idx_interview_notes_search USING GIN(search_vector)` — FTS

**FTS Trigger:** `interview_notes_search_update` updates `search_vector` from `content`.

Valid `note_type` values: preparation, company_research, feedback, reflection, general. The unique index ensures one note per type per interview (upsert behavior).

---

### assessments

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| user_id | UUID | FK → users(id), NOT NULL | |
| application_id | UUID | FK → applications(id), NOT NULL | |
| assessment_type | VARCHAR(50) | NOT NULL | |
| title | VARCHAR(255) | NOT NULL | |
| due_date | DATE | NOT NULL | |
| status | VARCHAR(50) | NOT NULL | 'not_started' |
| instructions | TEXT | | NULL |
| requirements | TEXT | | NULL |
| search_vector | tsvector | | NULL |
| created_at | TIMESTAMP | | NOW() |
| updated_at | TIMESTAMP | | NOW() |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:**
- `idx_assessments_user_id (user_id) WHERE deleted_at IS NULL`
- `idx_assessments_application_id (application_id) WHERE deleted_at IS NULL`
- `idx_assessments_due_date (due_date)`
- `idx_assessments_status (status)`
- `idx_assessments_search USING GIN(search_vector)` — FTS
- `idx_assessments_user_due (user_id, due_date) WHERE deleted_at IS NULL` — performance

**FTS Trigger:** `assessments_search_update` updates `search_vector` with weighted columns: `title` (A), `instructions` (B).

Valid `assessment_type` values: take_home_project, live_coding, system_design, data_structures, case_study, other. Valid `status` values: not_started, in_progress, submitted, passed, failed.

---

### assessment_submissions

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| assessment_id | UUID | FK → assessments(id), NOT NULL | |
| submission_type | VARCHAR(50) | NOT NULL | |
| github_url | VARCHAR(500) | | NULL |
| file_id | UUID | FK → files(id) | NULL |
| notes | TEXT | | NULL |
| submitted_at | TIMESTAMP | | NOW() |
| created_at | TIMESTAMP | | NOW() |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:** `idx_assessment_submissions_assessment_id (assessment_id) WHERE deleted_at IS NULL`

Valid `submission_type` values: github, file_upload, notes.

---

### files

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| user_id | UUID | FK → users(id) ON DELETE CASCADE, NOT NULL | |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE, NOT NULL | |
| interview_id | UUID | FK → interviews(id) ON DELETE CASCADE | NULL |
| file_name | VARCHAR(256) | NOT NULL | |
| file_type | VARCHAR(50) | NOT NULL | |
| file_size | BIGINT | NOT NULL | |
| s3_key | VARCHAR(500) | NOT NULL, UNIQUE | |
| uploaded_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:**
- `idx_files_user_id (user_id) WHERE deleted_at IS NULL`
- `idx_files_application_id (application_id) WHERE deleted_at IS NULL`
- `idx_files_interview_id (interview_id) WHERE deleted_at IS NULL`
- `idx_files_deleted_at (deleted_at)`
- `idx_files_s3_key (s3_key) WHERE deleted_at IS NULL`
- `idx_files_user_entities (user_id, application_id, interview_id) WHERE deleted_at IS NULL` — performance

Storage quota: 100MB per user. Allowed types: PDF, DOCX, TXT, PNG, JPG (+ ZIP for assessment context). Size limits: 5MB general, 10MB assessment.

---

### rate_limits

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| user_id | UUID | FK → users(id) ON DELETE CASCADE, NOT NULL | |
| resource | VARCHAR(100) | NOT NULL | |
| request_count | INT | NOT NULL | 0 |
| window_start | TIMESTAMP | NOT NULL | |
| window_end | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |

**Indexes:** `idx_rate_limits_user_resource_window (user_id, resource, window_start, window_end)`, `idx_rate_limits_window_end (window_end)`

---

### notifications

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| user_id | UUID | FK → users(id), NOT NULL | |
| type | VARCHAR(50) | NOT NULL | |
| title | VARCHAR(255) | NOT NULL | |
| message | TEXT | NOT NULL | |
| link | VARCHAR(500) | | NULL |
| read | BOOLEAN | | FALSE |
| created_at | TIMESTAMP | | NOW() |
| deleted_at | TIMESTAMP | | NULL |

**Indexes:**
- `idx_notifications_user_id (user_id) WHERE deleted_at IS NULL`
- `idx_notifications_read (user_id, read) WHERE deleted_at IS NULL`
- `idx_notifications_created_at (created_at DESC)`
- `idx_notifications_user_unread_date (user_id, read, created_at DESC) WHERE deleted_at IS NULL` — performance

---

### user_notification_preferences

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| user_id | UUID | PK, FK → users(id) | |
| interview_24h | BOOLEAN | | TRUE |
| interview_1h | BOOLEAN | | TRUE |
| assessment_3d | BOOLEAN | | TRUE |
| assessment_1d | BOOLEAN | | TRUE |
| assessment_1h | BOOLEAN | | FALSE |
| created_at | TIMESTAMP | | NOW() |
| updated_at | TIMESTAMP | | NOW() |

---

## Junction Tables

### user_roles
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| role_id | UUID | FK → roles(id) ON DELETE CASCADE |
| created_at | TIMESTAMP | |

**PK:** (user_id, role_id)

### user_jobs
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, FK → jobs(id) ON DELETE CASCADE |
| user_id | UUID | FK → users(id) ON DELETE CASCADE, NOT NULL |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### job_skills
| Column | Type | Constraints |
|--------|------|-------------|
| job_id | UUID | FK → jobs(id) ON DELETE CASCADE |
| skill_id | UUID | FK → skills(id) ON DELETE CASCADE |
| created_at | TIMESTAMP | |

**PK:** (job_id, skill_id)

### user_skills
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| skill_id | UUID | FK → skills(id) ON DELETE CASCADE |
| proficiency_level | INTEGER | CHECK (1-5) |
| created_at | TIMESTAMP | |

**PK:** (user_id, skill_id)

---

## Lookup Tables

### roles
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(50) | NOT NULL, UNIQUE |
| description | TEXT | |

### skill_categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | |

### skills
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| category_id | UUID | FK → skill_categories(id) ON DELETE SET NULL |

---

## Full-Text Search Infrastructure

Added in migration 000012. Uses PostgreSQL tsvector columns with GIN indexes and automatic trigger-based updates.

| Table | Column | Source Fields | Weights |
|-------|--------|--------------|---------|
| applications | search_vector | notes | equal |
| interview_questions | search_vector | question_text (A), answer_text (B) | weighted |
| interview_notes | search_vector | content | equal |
| assessments | search_vector | title (A), instructions (B) | weighted |

Each table has a BEFORE INSERT OR UPDATE trigger that regenerates the tsvector when source fields change. Existing rows were backfilled when the migration ran.

---

## Entity Relationships

```
users ─────────────────────────────────────┐
  │                                         │
  ├──1:1──── users_auth                     │
  ├──M:M──── roles (via user_roles)         │
  ├──M:M──── skills (via user_skills)       │
  │                                         │
  ├──1:M──── applications ──1:M──── interviews ──1:M──── interviewers
  │              │                      │                 interview_questions
  │              │                      │                 interview_notes
  │              │                      │
  │              ├──1:M──── assessments ──1:M──── assessment_submissions
  │              │
  │              └──M:1──── application_status
  │
  ├──1:M──── files (linked to applications and optionally interviews)
  ├──1:M──── notifications
  ├──1:1──── user_notification_preferences
  ├──1:M──── rate_limits
  └──1:M──── user_jobs ──M:1──── jobs ──M:1──── companies
```

---

## Migration History

| # | Name | Description |
|---|------|-------------|
| 000001 | initial_schema | Core tables: users, users_auth, companies, jobs, applications, interviews, roles, skills, junction tables, triggers |
| 000002 | add_users_auth_user_id_unique | UNIQUE constraint on users_auth.user_id for OAuth support |
| 000003 | create_rate_limits | rate_limits table for API rate limiting |
| 000004 | create_file_system | files table for S3-backed file storage |
| 000005 | add_job_source_fields | source_url and platform columns on jobs, 'Saved' status |
| 000006 | fix_application_status_unique | UNIQUE constraint on application_status.name, deduplication |
| 000007 | create_interview_system | interviewers, interview_questions, interview_notes tables |
| 000008 | add_interviewers_updated_at | updated_at column on interviewers with trigger |
| 000009 | create_assessment_system | assessments and assessment_submissions tables |
| 000010 | update_assessment_status | Rename 'reviewed' status to 'passed' |
| 000011 | create_notification_system | notifications and user_notification_preferences tables |
| 000012 | add_search_vectors | tsvector columns, GIN indexes, and FTS triggers on 4 tables |
| 000013 | add_performance_indexes | Composite indexes on applications, assessments, notifications, files |

---

## Automatic Timestamp Management

The `update_timestamp()` function sets `updated_at = CURRENT_TIMESTAMP` on every UPDATE. Applied via BEFORE UPDATE triggers on all tables with `updated_at` columns. An event trigger (`add_timestamp_trigger_event`) automatically creates these triggers for newly created tables.
