-- Remove unique constraint on name
ALTER TABLE application_status DROP CONSTRAINT IF EXISTS application_status_name_unique;
