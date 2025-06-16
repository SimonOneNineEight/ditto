-- Add down migration script here
DROP TRIGGER IF EXISTS update_user_job_timestamp ON user_jobs;
DROP TRIGGER IF EXISTS update_scraped_job_timestamp ON scraped_jobs;
DROP FUNCTION IF EXISTS update_parent_job_timestamp;

DROP INDEX IF EXISTS idx_user_jobs_user_id;
DROP INDEX IF EXISTS idx_scraped_jobs_scraper_batch_id;
DROP INDEX IF EXISTS idx_jobs_source_type;
DROP INDEX IF EXISTS idx_scraped_jobs_scraper_source;
DROP INDEX IF EXISTS idx_scraped_jobs_external_id;

DROP TABLE IF EXISTS user_jobs;
DROP TABLE IF EXISTS scraped_jobs;

ALTER TABLE jobs
    ADD COLUMN job_posting_id TEXT,
    ADD COLUMN job_source TEXT,
    ADD COLUMN scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DROP COLUMN IF EXISTS source_type;

DROP TYPE IF EXISTS job_source_type;
