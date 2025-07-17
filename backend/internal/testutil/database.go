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
	// Read migration file
	migrationSQL := `
		-- Create basic tables for testing
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name TEXT NOT NULL,
			email TEXT UNIQUE NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP NULL
		);

		CREATE TABLE IF NOT EXISTS users_auth (
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

		CREATE TABLE IF NOT EXISTS companies (
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

		CREATE TABLE IF NOT EXISTS jobs (
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

		CREATE TABLE IF NOT EXISTS user_jobs (
			id UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS application_status (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS applications (
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

		-- Insert test application statuses
		INSERT INTO application_status (name) VALUES 
			('Applied'),
			('Interview Scheduled'),
			('Rejected'),
			('Offer Received')
		ON CONFLICT DO NOTHING;
	`

	_, err := td.Exec(migrationSQL)
	if err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}
}

// Truncate truncates all tables for clean test state
func (td *TestDatabase) Truncate(t *testing.T) {
	tables := []string{
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
			t.Fatalf("Failed to truncate table %s: %v", table, err)
		}
	}
}