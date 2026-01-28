-- Add updated_at column to interviewers table for consistency with other interview-related tables

ALTER TABLE interviewers
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Backfill existing rows with created_at value
UPDATE interviewers SET updated_at = created_at WHERE updated_at IS NULL;

-- Add trigger for auto-updating timestamp
CREATE TRIGGER update_interviewers_timestamp
    BEFORE UPDATE ON interviewers
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
