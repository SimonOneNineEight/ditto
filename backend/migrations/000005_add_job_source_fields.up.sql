-- Add source tracking fields to jobs table for URL extraction feature
ALTER TABLE jobs ADD COLUMN source_url VARCHAR(2048);
ALTER TABLE jobs ADD COLUMN platform VARCHAR(50);

-- Make job_type optional (extraction doesn't reliably provide this)
ALTER TABLE jobs ALTER COLUMN job_type DROP NOT NULL;

-- Add index for platform queries
CREATE INDEX idx_jobs_platform ON jobs(platform) WHERE deleted_at IS NULL;

-- Ensure "Saved" status exists for new applications
INSERT INTO application_status (name, created_at, updated_at)
SELECT 'Saved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM application_status WHERE name = 'Saved');
