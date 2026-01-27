DROP TRIGGER IF EXISTS update_interview_questions_timestamp ON interview_questions;
DROP TRIGGER IF EXISTS update_interview_notes_timestamp ON interview_notes;

DROP INDEX IF EXISTS idx_interviewers_interview_id;
DROP INDEX IF EXISTS idx_interview_questions_interview_id;
DROP INDEX IF EXISTS idx_interview_notes_interview_id;
DROP INDEX IF EXISTS idx_interview_notes_unique_type;

-- Drop child tables (interviews table is in 000001)
DROP TABLE IF EXISTS interview_notes;
DROP TABLE IF EXISTS interview_questions;
DROP TABLE IF EXISTS interviewers;
