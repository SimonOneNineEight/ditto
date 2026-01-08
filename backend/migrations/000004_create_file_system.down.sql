DROP TRIGGER IF EXISTS update_files_timestamp ON files;
DROP INDEX IF EXISTS idx_files_s3_key;
DROP INDEX IF EXISTS idx_files_deleted_at;
DROP INDEX IF EXISTS idx_files_interview_id;
DROP INDEX IF EXISTS idx_files_application_id;
DROP INDEX IF EXISTS idx_files_user_id;
DROP TABLE IF EXISTS files;
