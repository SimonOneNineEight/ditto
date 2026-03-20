package testutil

import (
	"ditto-backend/pkg/database"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
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

// migrationsPath returns the absolute path to the migrations directory
func migrationsPath() string {
	_, filename, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(filename), "..", "..", "migrations")
}

// RunMigrations drops all tables and runs the real migration files
func (td *TestDatabase) RunMigrations(t *testing.T) {
	// Drop everything so migrations run from scratch
	_, err := td.Exec(`
		DROP SCHEMA public CASCADE;
		CREATE SCHEMA public;
		GRANT ALL ON SCHEMA public TO CURRENT_USER;
	`)
	if err != nil {
		t.Fatalf("Failed to reset schema: %v", err)
	}

	if err := database.RunMigrations(td.DB, migrationsPath()); err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}
}

// Truncate truncates all tables for clean test state
func (td *TestDatabase) Truncate(t *testing.T) {
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
		"user_refresh_tokens",
		"users_auth",
		"users",
	}

	for _, table := range tables {
		_, err := td.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			t.Logf("Warning: could not truncate table %s: %v", table, err)
		}
	}
}
