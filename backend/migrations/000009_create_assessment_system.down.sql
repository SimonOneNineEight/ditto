DROP TRIGGER IF EXISTS update_assessments_timestamp ON assessments;

DROP INDEX IF EXISTS idx_assessment_submissions_assessment_id;
DROP INDEX IF EXISTS idx_assessments_status;
DROP INDEX IF EXISTS idx_assessments_due_date;
DROP INDEX IF EXISTS idx_assessments_application_id;
DROP INDEX IF EXISTS idx_assessments_user_id;

-- Drop child table first due to FK dependency on assessments
DROP TABLE IF EXISTS assessment_submissions;
DROP TABLE IF EXISTS assessments;
