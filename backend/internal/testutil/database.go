package testutil

import (
	"ditto-backend/pkg/database"
	"fmt"
	"os"
	"testing"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// TestDatabase wraps database for testing
type TestDatabase struct {
	*database.Database
	name string
}

// NewTestDatabase creates a new test database
func NewTestDatabase(t *testing.T) *TestDatabase {
	// Use test database configuration
	dbHost := getEnvOrDefault("TEST_DB_HOST", "localhost")
	dbPort := getEnvOrDefault("TEST_DB_PORT", "5432")
	dbUser := getEnvOrDefault("TEST_DB_USER", "ditto_test_user")
	dbPassword := getEnvOrDefault("TEST_DB_PASSWORD", "test_password")
	dbName := getEnvOrDefault("TEST_DB_NAME", "ditto_test")

	// Connect to test database
	testDBURL := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	testDB, err := sqlx.Connect("postgres", testDBURL)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	return &TestDatabase{
		Database: &database.Database{DB: testDB},
		name:     dbName,
	}
}

// Close closes the test database and cleans up
func (td *TestDatabase) Close(t *testing.T) {
	// Clean up test data by truncating tables
	td.Truncate(t)
	td.Database.Close()
}

// Helper function to get environment variable or default
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// RunMigrations runs database migrations on test database
func (td *TestDatabase) RunMigrations(t *testing.T) {
	// Drop and recreate all tables to ensure schema is up to date
	dropSQL := `
		DROP TABLE IF EXISTS rate_limits CASCADE;
		DROP TABLE IF EXISTS user_notification_preferences CASCADE;
		DROP TABLE IF EXISTS notifications CASCADE;
		DROP TABLE IF EXISTS assessment_submissions CASCADE;
		DROP TABLE IF EXISTS assessments CASCADE;
		DROP TABLE IF EXISTS interview_notes CASCADE;
		DROP TABLE IF EXISTS interview_questions CASCADE;
		DROP TABLE IF EXISTS interviewers CASCADE;
		DROP TABLE IF EXISTS interviews CASCADE;
		DROP TABLE IF EXISTS files CASCADE;
		DROP TABLE IF EXISTS applications CASCADE;
		DROP TABLE IF EXISTS application_status CASCADE;
		DROP TABLE IF EXISTS user_jobs CASCADE;
		DROP TABLE IF EXISTS jobs CASCADE;
		DROP TABLE IF EXISTS companies CASCADE;
		DROP TABLE IF EXISTS users_auth CASCADE;
		DROP TABLE IF EXISTS users CASCADE;
	`
	_, err := td.Exec(dropSQL)
	if err != nil {
		t.Fatalf("Failed to drop tables: %v", err)
	}

	migrationSQL := `
		-- Utility function for automatic timestamp updates
		CREATE OR REPLACE FUNCTION update_timestamp()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = CURRENT_TIMESTAMP;
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;

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
			user_id UUID UNIQUE REFERENCES users(id),
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
			domain VARCHAR(255),
			opencorp_id VARCHAR(255),
			last_enriched_at TIMESTAMP NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP NULL
		);

		CREATE TABLE jobs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			company_id UUID NOT NULL REFERENCES companies(id),
			title TEXT NOT NULL,
			job_description TEXT NOT NULL,
			location TEXT NOT NULL,
			job_type TEXT,
			source_url VARCHAR(2048),
			platform VARCHAR(50),
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

		CREATE TABLE application_status (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name TEXT NOT NULL,
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
			search_vector tsvector,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP NULL
		);

		CREATE TABLE files (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
			interview_id UUID,
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

		CREATE TABLE interviews (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id),
			application_id UUID NOT NULL REFERENCES applications(id),
			round_number INT NOT NULL DEFAULT 1,
			scheduled_date DATE NOT NULL,
			scheduled_time VARCHAR(10),
			duration_minutes INT,
			outcome VARCHAR(50),
			overall_feeling VARCHAR(50),
			went_well TEXT,
			could_improve TEXT,
			confidence_level INT,
			interview_type VARCHAR(50) NOT NULL,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			deleted_at TIMESTAMP
		);

		CREATE INDEX idx_interviews_user_id ON interviews(user_id) WHERE deleted_at IS NULL;
		CREATE INDEX idx_interviews_application_id ON interviews(application_id) WHERE deleted_at IS NULL;

		CREATE TABLE interviewers (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
			name VARCHAR(255) NOT NULL,
			role VARCHAR(255),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			deleted_at TIMESTAMP
		);

		CREATE TABLE interview_questions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
			question_text TEXT NOT NULL,
			answer_text TEXT,
			"order" INT NOT NULL DEFAULT 0,
			search_vector tsvector,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			deleted_at TIMESTAMP
		);

		CREATE TABLE interview_notes (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
			note_type VARCHAR(50) NOT NULL,
			content TEXT,
			search_vector tsvector,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			deleted_at TIMESTAMP
		);

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
			search_vector tsvector,
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

		CREATE TABLE rate_limits (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			resource VARCHAR(100) NOT NULL,
			request_count INT NOT NULL DEFAULT 0,
			window_start TIMESTAMP NOT NULL,
			window_end TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX idx_rate_limits_user_resource_window
			ON rate_limits(user_id, resource, window_start, window_end);
		CREATE INDEX idx_rate_limits_window_end ON rate_limits(window_end);

		CREATE TABLE notifications (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id),
			type VARCHAR(50) NOT NULL,
			title VARCHAR(255) NOT NULL,
			message TEXT NOT NULL,
			link VARCHAR(500),
			read BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT NOW(),
			deleted_at TIMESTAMP
		);

		CREATE TABLE user_notification_preferences (
			user_id UUID PRIMARY KEY REFERENCES users(id),
			interview_24h BOOLEAN DEFAULT TRUE,
			interview_1h BOOLEAN DEFAULT TRUE,
			assessment_3d BOOLEAN DEFAULT TRUE,
			assessment_1d BOOLEAN DEFAULT TRUE,
			assessment_1h BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		);

		-- Search vector trigger functions
		CREATE OR REPLACE FUNCTION applications_search_vector_update() RETURNS trigger AS $$
		BEGIN
			NEW.search_vector := to_tsvector('english', coalesce(NEW.notes, ''));
			RETURN NEW;
		END
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS applications_search_update ON applications;
		CREATE TRIGGER applications_search_update
			BEFORE INSERT OR UPDATE OF notes ON applications
			FOR EACH ROW EXECUTE FUNCTION applications_search_vector_update();

		CREATE OR REPLACE FUNCTION assessments_search_vector_update() RETURNS trigger AS $$
		BEGIN
			NEW.search_vector :=
				setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
				setweight(to_tsvector('english', coalesce(NEW.instructions, '')), 'B');
			RETURN NEW;
		END
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS assessments_search_update ON assessments;
		CREATE TRIGGER assessments_search_update
			BEFORE INSERT OR UPDATE OF title, instructions ON assessments
			FOR EACH ROW EXECUTE FUNCTION assessments_search_vector_update();

		CREATE OR REPLACE FUNCTION interview_notes_search_vector_update() RETURNS trigger AS $$
		BEGIN
			NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
			RETURN NEW;
		END
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS interview_notes_search_update ON interview_notes;
		CREATE TRIGGER interview_notes_search_update
			BEFORE INSERT OR UPDATE OF content ON interview_notes
			FOR EACH ROW EXECUTE FUNCTION interview_notes_search_vector_update();

		CREATE OR REPLACE FUNCTION interview_questions_search_vector_update() RETURNS trigger AS $$
		BEGIN
			NEW.search_vector :=
				setweight(to_tsvector('english', coalesce(NEW.question_text, '')), 'A') ||
				setweight(to_tsvector('english', coalesce(NEW.answer_text, '')), 'B');
			RETURN NEW;
		END
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS interview_questions_search_update ON interview_questions;
		CREATE TRIGGER interview_questions_search_update
			BEFORE INSERT OR UPDATE OF question_text, answer_text ON interview_questions
			FOR EACH ROW EXECUTE FUNCTION interview_questions_search_vector_update();

		-- Insert application statuses (system data, matches production)
		INSERT INTO application_status (name) VALUES
			('Saved'),
			('Applied'),
			('Interview'),
			('Offer'),
			('Rejected')
		ON CONFLICT DO NOTHING;
	`

	_, err = td.Exec(migrationSQL)
	if err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}
}

// Truncate truncates all tables for clean test state
func (td *TestDatabase) Truncate(t *testing.T) {
	// Drop rate_limits if it exists with wrong ownership (created by a different user)
	_, _ = td.Exec("DROP TABLE IF EXISTS rate_limits CASCADE")

	tables := []string{
		"rate_limits",
		"user_notification_preferences",
		"notifications",
		"assessment_submissions",
		"assessments",
		"interview_notes",
		"interview_questions",
		"interviewers",
		"interviews",
		"files",
		"applications",
		"user_jobs",
		"jobs",
		"companies",
		"users_auth",
		"users",
	}

	for _, table := range tables {
		_, err := td.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			// Skip tables with permission issues (e.g., created by different user)
			t.Logf("Warning: could not truncate table %s: %v", table, err)
		}
	}
}
