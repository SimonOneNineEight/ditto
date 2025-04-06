-- Add up migration script here
-- Add deleted_at column to main business entities
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE jobs ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE companies ADD COLUMN deleted_at TIMESTAMP NULL; 
ALTER TABLE applications ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE interviews ADD COLUMN deleted_at TIMESTAMP NULL;

-- Add indexes for performance
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_jobs_deleted_at ON jobs(deleted_at);
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at);
CREATE INDEX idx_applications_deleted_at ON applications(deleted_at);
CREATE INDEX idx_interviews_deleted_at ON interviews(deleted_at);
