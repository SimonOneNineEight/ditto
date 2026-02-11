-- Rollback: Remove performance indexes

DROP INDEX IF EXISTS idx_applications_user_status;
DROP INDEX IF EXISTS idx_applications_user_date;
DROP INDEX IF EXISTS idx_applications_compound;
DROP INDEX IF EXISTS idx_assessments_user_due;
DROP INDEX IF EXISTS idx_notifications_user_unread_date;
DROP INDEX IF EXISTS idx_files_user_entities;
