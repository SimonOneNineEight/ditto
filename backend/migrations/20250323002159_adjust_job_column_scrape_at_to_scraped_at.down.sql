
-- Add down migration script here
ALTER TABLE jobs
RENAME COLUMN scraped_at TO scrape_at;
