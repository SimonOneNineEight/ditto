-- Rollback: Remove full-text search vectors

-- 1. Drop triggers
DROP TRIGGER IF EXISTS applications_search_update ON applications;
DROP TRIGGER IF EXISTS interview_notes_search_update ON interview_notes;
DROP TRIGGER IF EXISTS interview_questions_search_update ON interview_questions;
DROP TRIGGER IF EXISTS assessments_search_update ON assessments;

-- 2. Drop trigger functions
DROP FUNCTION IF EXISTS applications_search_vector_update();
DROP FUNCTION IF EXISTS interview_notes_search_vector_update();
DROP FUNCTION IF EXISTS interview_questions_search_vector_update();
DROP FUNCTION IF EXISTS assessments_search_vector_update();

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_applications_search;
DROP INDEX IF EXISTS idx_interview_notes_search;
DROP INDEX IF EXISTS idx_interview_questions_search;
DROP INDEX IF EXISTS idx_assessments_search;

-- 4. Drop columns
ALTER TABLE applications DROP COLUMN IF EXISTS search_vector;
ALTER TABLE interview_notes DROP COLUMN IF EXISTS search_vector;
ALTER TABLE interview_questions DROP COLUMN IF EXISTS search_vector;
ALTER TABLE assessments DROP COLUMN IF EXISTS search_vector;
