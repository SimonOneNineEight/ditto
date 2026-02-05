CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    application_id UUID NOT NULL REFERENCES applications(id),
    assessment_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    instructions TEXT,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    submission_type VARCHAR(50) NOT NULL,
    github_url VARCHAR(500),
    file_id UUID REFERENCES files(id),
    notes TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_assessments_user_id ON assessments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_application_id ON assessments(application_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_due_date ON assessments(due_date);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessment_submissions_assessment_id ON assessment_submissions(assessment_id) WHERE deleted_at IS NULL;

CREATE TRIGGER update_assessments_timestamp
    BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
