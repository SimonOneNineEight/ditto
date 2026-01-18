-- Remove source tracking fields from jobs table
DROP INDEX IF EXISTS idx_jobs_platform;
ALTER TABLE jobs DROP COLUMN IF EXISTS source_url;
ALTER TABLE jobs DROP COLUMN IF EXISTS platform;

-- Note: Not removing "Saved" status as it may have been used by applications
