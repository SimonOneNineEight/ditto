-- Child tables for interview system (interviews table is in 000001)

CREATE TABLE interviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews (id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    "order" INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE interview_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews (id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_interviewers_interview_id ON interviewers(interview_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_questions_interview_id ON interview_questions(interview_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_notes_interview_id ON interview_notes(interview_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_interview_notes_unique_type ON interview_notes(interview_id, note_type) WHERE deleted_at IS NULL;

-- Triggers
CREATE TRIGGER update_interview_questions_timestamp
    BEFORE UPDATE ON interview_questions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_interview_notes_timestamp
    BEFORE UPDATE ON interview_notes
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
