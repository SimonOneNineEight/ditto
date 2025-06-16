-- Add up migration script here
CREATE TYPE job_source_type AS ENUM('user_entered', 'scraped');

ALTER TABLE jobs
    ADD COLUMN source_type job_source_type NOT NULL DEFAULT 'user_entered',
    DROP COLUMN IF EXISTS job_posting_id,
    DROP COLUMN IF EXISTS job_source,
    DROP COLUMN IF EXISTS scraped_at;

CREATE TABLE user_jobs (
    id UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scraped_jobs (
    id UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    scraper_source TEXT NOT NULL,
    scraper_batch_id UUID,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_jobs_user_id ON user_jobs(user_id);
CREATE INDEX idx_scraped_jobs_scraper_batch_id ON scraped_jobs(scraper_batch_id);
CREATE INDEX idx_jobs_source_type ON jobs(source_type);
CREATE INDEX idx_scraped_jobs_scraper_source ON scraped_jobs(scraper_source);
CREATE INDEX idx_scraped_jobs_external_id ON scraped_jobs(external_id);

CREATE OR REPLACE FUNCTION update_parent_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_job_timestamp
AFTER UPDATE ON user_jobs
FOR EACH ROW
EXECUTE FUNCTION update_parent_job_timestamp();

CREATE TRIGGER update_scraped_job_timestamp
AFTER UPDATE ON scraped_jobs
FOR EACH ROW
EXECUTE FUNCTION update_parent_job_timestamp();
