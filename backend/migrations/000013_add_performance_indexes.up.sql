-- Migration: Add performance indexes for common query patterns
-- Optimizes dashboard, list, and upcoming items queries

-- Composite index for application list filtering by status
-- Used by: application list with status filter, dashboard stats
CREATE INDEX IF NOT EXISTS idx_applications_user_status
    ON applications(user_id, application_status_id)
    WHERE deleted_at IS NULL;

-- Composite index for application list sorted by date
-- Used by: application list default sort
CREATE INDEX IF NOT EXISTS idx_applications_user_date
    ON applications(user_id, applied_at DESC)
    WHERE deleted_at IS NULL;

-- Compound index for dashboard stats aggregation
-- Covers status filtering + date range queries
CREATE INDEX IF NOT EXISTS idx_applications_compound
    ON applications(user_id, application_status_id, applied_at)
    WHERE deleted_at IS NULL;

-- Index for assessment upcoming items query
-- Used by: dashboard upcoming widget
CREATE INDEX IF NOT EXISTS idx_assessments_user_due
    ON assessments(user_id, due_date)
    WHERE deleted_at IS NULL;

-- Optimized notification query index
-- Replaces less efficient idx_notifications_read with better column order
-- Used by: notification bell, unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_date
    ON notifications(user_id, read, created_at DESC)
    WHERE deleted_at IS NULL;

-- Composite index for files lookup by user and related entities
-- Used by: file list views on applications/interviews
CREATE INDEX IF NOT EXISTS idx_files_user_entities
    ON files(user_id, application_id, interview_id)
    WHERE deleted_at IS NULL;
