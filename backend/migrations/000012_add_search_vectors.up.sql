-- Migration: Add full-text search vectors to searchable tables
-- Uses PostgreSQL built-in FTS with tsvector, GIN indexes, and auto-update triggers

-- 1. Add search_vector columns to applications table
ALTER TABLE applications ADD COLUMN search_vector tsvector;

-- 2. Add search_vector columns to interview_notes table
ALTER TABLE interview_notes ADD COLUMN search_vector tsvector;

-- 3. Add search_vector columns to interview_questions table
ALTER TABLE interview_questions ADD COLUMN search_vector tsvector;

-- 4. Add search_vector columns to assessments table
ALTER TABLE assessments ADD COLUMN search_vector tsvector;

-- 5. Create GIN indexes for fast full-text search
CREATE INDEX idx_applications_search ON applications USING GIN(search_vector);
CREATE INDEX idx_interview_notes_search ON interview_notes USING GIN(search_vector);
CREATE INDEX idx_interview_questions_search ON interview_questions USING GIN(search_vector);
CREATE INDEX idx_assessments_search ON assessments USING GIN(search_vector);

-- 6. Create trigger function for applications
-- Weights: A = company_name (via job), B = job_title (via job), C = notes
CREATE OR REPLACE FUNCTION applications_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', coalesce(NEW.notes, ''));
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_search_update
    BEFORE INSERT OR UPDATE OF notes ON applications
    FOR EACH ROW EXECUTE FUNCTION applications_search_vector_update();

-- 7. Create trigger function for interview_notes
CREATE OR REPLACE FUNCTION interview_notes_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER interview_notes_search_update
    BEFORE INSERT OR UPDATE OF content ON interview_notes
    FOR EACH ROW EXECUTE FUNCTION interview_notes_search_vector_update();

-- 8. Create trigger function for interview_questions
-- Weights: A = question_text, B = answer_text
CREATE OR REPLACE FUNCTION interview_questions_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.question_text, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.answer_text, '')), 'B');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER interview_questions_search_update
    BEFORE INSERT OR UPDATE OF question_text, answer_text ON interview_questions
    FOR EACH ROW EXECUTE FUNCTION interview_questions_search_vector_update();

-- 9. Create trigger function for assessments
-- Weights: A = title, B = instructions
CREATE OR REPLACE FUNCTION assessments_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.instructions, '')), 'B');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessments_search_update
    BEFORE INSERT OR UPDATE OF title, instructions ON assessments
    FOR EACH ROW EXECUTE FUNCTION assessments_search_vector_update();

-- 10. Backfill existing data
UPDATE applications SET search_vector = to_tsvector('english', coalesce(notes, ''))
WHERE search_vector IS NULL;

UPDATE interview_notes SET search_vector = to_tsvector('english', coalesce(content, ''))
WHERE search_vector IS NULL;

UPDATE interview_questions SET search_vector =
    setweight(to_tsvector('english', coalesce(question_text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(answer_text, '')), 'B')
WHERE search_vector IS NULL;

UPDATE assessments SET search_vector =
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(instructions, '')), 'B')
WHERE search_vector IS NULL;
