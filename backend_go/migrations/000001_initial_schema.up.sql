-- Initial schema for Ditto backend
-- This represents the final state after all Rust backend migrations

-- Core database schema (no scraping features)

-- Core tables
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE users_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    password_hash TEXT NULL,
    auth_provider TEXT NOT NULL,
    avatar_url TEXT NULL,
    refresh_token TEXT NULL,
    refresh_token_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    website VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE skill_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category_id UUID REFERENCES skill_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE application_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    title TEXT NOT NULL,
    job_description TEXT NOT NULL,
    location TEXT NOT NULL,
    job_type TEXT NOT NULL,
    min_salary NUMERIC,
    max_salary NUMERIC,
    currency TEXT,
    is_expired BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE user_jobs (
    id UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    job_id UUID REFERENCES jobs(id),
    application_status_id UUID REFERENCES application_status(id),
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    offer_received BOOLEAN NOT NULL DEFAULT false,
    attempt_number INT NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id),
    date TIMESTAMP NOT NULL,
    interview_type TEXT NOT NULL,
    question_asked TEXT,
    notes TEXT,
    feedback TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Junction tables for many-to-many relationships
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE job_skills (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE user_skills (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_auth_user_id ON users_auth(user_id);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_deleted_at ON jobs(deleted_at);
CREATE INDEX idx_user_jobs_user_id ON user_jobs(user_id);
CREATE INDEX idx_user_jobs_job_id ON user_jobs(job_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status_id ON applications(application_status_id);
CREATE INDEX idx_applications_deleted_at ON applications(deleted_at);
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_interviews_deleted_at ON interviews(deleted_at);

-- Function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updated_at
CREATE TRIGGER update_roles_timestamp BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_users_auth_timestamp BEFORE UPDATE ON users_auth FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_companies_timestamp BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_skill_categories_timestamp BEFORE UPDATE ON skill_categories FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_skills_timestamp BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_application_status_timestamp BEFORE UPDATE ON application_status FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_jobs_timestamp BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_user_jobs_timestamp BEFORE UPDATE ON user_jobs FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_applications_timestamp BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_interviews_timestamp BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Triggers to update parent job timestamps when child records change
CREATE OR REPLACE FUNCTION update_parent_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_from_user_jobs AFTER INSERT OR UPDATE OR DELETE ON user_jobs FOR EACH ROW EXECUTE FUNCTION update_parent_job_timestamp();

-- Event trigger for automatic timestamp triggers on new tables
CREATE OR REPLACE FUNCTION add_timestamp_trigger()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE'
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = obj.object_identity 
            AND column_name = 'updated_at'
        ) THEN
            EXECUTE format('CREATE TRIGGER update_%I_timestamp BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_timestamp()', 
                          obj.object_identity, obj.object_identity);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER add_timestamp_trigger_event ON ddl_command_end WHEN TAG IN ('CREATE TABLE') EXECUTE FUNCTION add_timestamp_trigger();
