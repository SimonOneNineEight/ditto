package repository

import (
	"ditto-backend/pkg/database"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestDB(t *testing.T) *database.Database {
	db, err := database.NewConnection()
	require.NoError(t, err)
	return db
}

func createTestUser(t *testing.T, db *database.Database) uuid.UUID {
	userID := uuid.New()
	_, err := db.Exec(`
		INSERT INTO users (id, name, email, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		ON CONFLICT (email) DO UPDATE SET id = users.id
		RETURNING id
	`, userID, "Test User", "rate_limit_test@example.com")
	require.NoError(t, err)
	return userID
}

func cleanupRateLimits(t *testing.T, db *database.Database, userID uuid.UUID) {
	_, err := db.Exec("DELETE FROM rate_limits WHERE user_id = $1", userID)
	require.NoError(t, err)
}

func cleanupTestUser(t *testing.T, db *database.Database, userID uuid.UUID) {
	_, err := db.Exec("DELETE FROM users WHERE id = $1", userID)
	require.NoError(t, err)
}

func TestRateLimitRepository_CreateRateLimit(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewRateLimitRepository(db)
	userID := createTestUser(t, db)
	defer cleanupRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	rateLimit, err := repo.CreateRateLimit(userID, "test_resource", 1)

	assert.NoError(t, err)
	assert.NotNil(t, rateLimit)
	assert.Equal(t, userID, rateLimit.UserID)
	assert.Equal(t, "test_resource", rateLimit.Resource)
	assert.Equal(t, 1, rateLimit.RequestCount)
	assert.True(t, rateLimit.WindowEnd.After(rateLimit.WindowStart))
	assert.Equal(t, 24*time.Hour, rateLimit.WindowEnd.Sub(rateLimit.WindowStart))
}

func TestRateLimitRepository_CheckAndIncrement_NewUser(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewRateLimitRepository(db)
	userID := createTestUser(t, db)
	defer cleanupRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	allowed, remaining, err := repo.CheckAndIncrement(userID, "url_extraction", 30)

	assert.NoError(t, err)
	assert.True(t, allowed)
	assert.Equal(t, 29, remaining)
}

func TestRateLimitRepository_CheckAndIncrement_ExistingUser(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewRateLimitRepository(db)
	userID := createTestUser(t, db)
	defer cleanupRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	// Create initial rate limit
	_, err := repo.CreateRateLimit(userID, "url_extraction", 5)
	require.NoError(t, err)

	// Increment
	allowed, remaining, err := repo.CheckAndIncrement(userID, "url_extraction", 30)

	assert.NoError(t, err)
	assert.True(t, allowed)
	assert.Equal(t, 24, remaining) // 30 - (5 + 1) = 24
}

func TestRateLimitRepository_CheckAndIncrement_LimitExceeded(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewRateLimitRepository(db)
	userID := createTestUser(t, db)
	defer cleanupRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	// Create rate limit at the limit
	_, err := repo.CreateRateLimit(userID, "url_extraction", 30)
	require.NoError(t, err)

	// Try to increment
	allowed, remaining, err := repo.CheckAndIncrement(userID, "url_extraction", 30)

	assert.NoError(t, err)
	assert.False(t, allowed)
	assert.Equal(t, 0, remaining)
}

func TestRateLimitRepository_GetCurrentUsage_NoRecords(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewRateLimitRepository(db)
	userID := createTestUser(t, db)
	defer cleanupTestUser(t, db, userID)

	used, remaining, resetAt, err := repo.GetCurrentUsage(userID, "url_extraction", 30)

	assert.NoError(t, err)
	assert.Equal(t, 0, used)
	assert.Equal(t, 30, remaining)
	assert.True(t, resetAt.IsZero())
}

func TestRateLimitRepository_GetCurrentUsage_WithRecords(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewRateLimitRepository(db)
	userID := createTestUser(t, db)
	defer cleanupRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	// Create rate limit with 10 requests
	rateLimit, err := repo.CreateRateLimit(userID, "url_extraction", 10)
	require.NoError(t, err)

	used, remaining, resetAt, err := repo.GetCurrentUsage(userID, "url_extraction", 30)

	assert.NoError(t, err)
	assert.Equal(t, 10, used)
	assert.Equal(t, 20, remaining)
	assert.False(t, resetAt.IsZero())
	// Times should be within 24 hours (just checking it's set correctly)
	assert.WithinDuration(t, rateLimit.WindowEnd, resetAt, 25*time.Hour)
}

func TestRateLimitRepository_GetCurrentUsage_LimitExceeded(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewRateLimitRepository(db)
	userID := createTestUser(t, db)
	defer cleanupRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	// Create rate limit over the limit
	_, err := repo.CreateRateLimit(userID, "url_extraction", 35)
	require.NoError(t, err)

	used, remaining, _, err := repo.GetCurrentUsage(userID, "url_extraction", 30)

	assert.NoError(t, err)
	assert.Equal(t, 35, used)
	assert.Equal(t, 0, remaining) // Should cap at 0, not go negative
}

func TestRateLimitRepository_MultipleResources(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := NewRateLimitRepository(db)
	userID := createTestUser(t, db)
	defer cleanupRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	// Create limits for different resources
	allowed1, _, err := repo.CheckAndIncrement(userID, "url_extraction", 30)
	require.NoError(t, err)
	assert.True(t, allowed1)

	allowed2, _, err := repo.CheckAndIncrement(userID, "api_general", 100)
	require.NoError(t, err)
	assert.True(t, allowed2)

	// Verify they're tracked separately
	used1, _, _, err := repo.GetCurrentUsage(userID, "url_extraction", 30)
	require.NoError(t, err)
	assert.Equal(t, 1, used1)

	used2, _, _, err := repo.GetCurrentUsage(userID, "api_general", 100)
	require.NoError(t, err)
	assert.Equal(t, 1, used2)
}
