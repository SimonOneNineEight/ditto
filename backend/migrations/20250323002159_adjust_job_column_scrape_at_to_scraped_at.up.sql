-- Add up migration script here
ALTER TABLE jobs
RENAME COLUMN scrape_at TO scraped_at;
