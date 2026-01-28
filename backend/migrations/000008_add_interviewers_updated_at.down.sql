-- Remove updated_at column and trigger from interviewers table

DROP TRIGGER IF EXISTS update_interviewers_timestamp ON interviewers;

ALTER TABLE interviewers
DROP COLUMN IF EXISTS updated_at;
