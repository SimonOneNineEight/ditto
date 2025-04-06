-- Add down migration script here

-- Drop indexes
DROP INDEX IF EXISTS idx_users_deleted_at;
DROP INDEX IF EXISTS idx_jobs_deleted_at;
DROP INDEX IF EXISTS idx_companies_deleted_at;
DROP INDEX IF EXISTS idx_applications_deleted_at;
DROP INDEX IF EXISTS idx_interviews_deleted_at;

-- Remove deleted_at columns
ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE jobs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE companies DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE applications DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE interviews DROP COLUMN IF EXISTS deleted_at;
