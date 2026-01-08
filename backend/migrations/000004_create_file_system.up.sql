CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE, -- 'url_extraction', 'api_general', etc
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    file_name VARCHAR(256) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(500) NOT NULL UNIQUE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_files_user_id ON files(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_application_id ON files(application_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_interview_id ON files(interview_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_deleted_at ON files(deleted_at);
CREATE INDEX idx_files_s3_key ON files(s3_key) WHERE deleted_at IS NULL;

CREATE TRIGGER update_files_timestamp
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
