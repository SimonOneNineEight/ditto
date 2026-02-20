package repository

import (
	"ditto-backend/internal/testutil"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestRateLimitRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("rate_limit_test@example.com", "Rate Limit Test", string(hashedPassword))
	require.NoError(t, err)

	repo := NewRateLimitRepository(db.Database)

	t.Run("CreateRateLimit", func(t *testing.T) {
		rateLimit, err := repo.CreateRateLimit(testUser.ID, "test_resource", 1)

		assert.NoError(t, err)
		assert.NotNil(t, rateLimit)
		assert.Equal(t, testUser.ID, rateLimit.UserID)
		assert.Equal(t, "test_resource", rateLimit.Resource)
		assert.Equal(t, 1, rateLimit.RequestCount)
		assert.True(t, rateLimit.WindowEnd.After(rateLimit.WindowStart))
		assert.Equal(t, 24*time.Hour, rateLimit.WindowEnd.Sub(rateLimit.WindowStart))
	})

	t.Run("CheckAndIncrement_NewUser", func(t *testing.T) {
		allowed, remaining, err := repo.CheckAndIncrement(testUser.ID, "url_extraction", 30)

		assert.NoError(t, err)
		assert.True(t, allowed)
		assert.Equal(t, 29, remaining)
	})

	t.Run("CheckAndIncrement_ExistingUser", func(t *testing.T) {
		_, err := repo.CreateRateLimit(testUser.ID, "existing_resource", 5)
		require.NoError(t, err)

		allowed, remaining, err := repo.CheckAndIncrement(testUser.ID, "existing_resource", 30)

		assert.NoError(t, err)
		assert.True(t, allowed)
		assert.Equal(t, 24, remaining) // 30 - (5 + 1) = 24
	})

	t.Run("CheckAndIncrement_LimitExceeded", func(t *testing.T) {
		_, err := repo.CreateRateLimit(testUser.ID, "exceeded_resource", 30)
		require.NoError(t, err)

		allowed, remaining, err := repo.CheckAndIncrement(testUser.ID, "exceeded_resource", 30)

		assert.NoError(t, err)
		assert.False(t, allowed)
		assert.Equal(t, 0, remaining)
	})

	t.Run("GetCurrentUsage_NoRecords", func(t *testing.T) {
		used, remaining, resetAt, err := repo.GetCurrentUsage(testUser.ID, "unused_resource", 30)

		assert.NoError(t, err)
		assert.Equal(t, 0, used)
		assert.Equal(t, 30, remaining)
		assert.True(t, resetAt.IsZero())
	})

	t.Run("GetCurrentUsage_WithRecords", func(t *testing.T) {
		rateLimit, err := repo.CreateRateLimit(testUser.ID, "usage_resource", 10)
		require.NoError(t, err)

		used, remaining, resetAt, err := repo.GetCurrentUsage(testUser.ID, "usage_resource", 30)

		assert.NoError(t, err)
		assert.Equal(t, 10, used)
		assert.Equal(t, 20, remaining)
		assert.False(t, resetAt.IsZero())
		assert.WithinDuration(t, rateLimit.WindowEnd, resetAt, 25*time.Hour)
	})

	t.Run("GetCurrentUsage_LimitExceeded", func(t *testing.T) {
		_, err := repo.CreateRateLimit(testUser.ID, "over_limit_resource", 35)
		require.NoError(t, err)

		used, remaining, _, err := repo.GetCurrentUsage(testUser.ID, "over_limit_resource", 30)

		assert.NoError(t, err)
		assert.Equal(t, 35, used)
		assert.Equal(t, 0, remaining)
	})

	t.Run("MultipleResources", func(t *testing.T) {
		allowed1, _, err := repo.CheckAndIncrement(testUser.ID, "multi_resource_a", 30)
		require.NoError(t, err)
		assert.True(t, allowed1)

		allowed2, _, err := repo.CheckAndIncrement(testUser.ID, "multi_resource_b", 100)
		require.NoError(t, err)
		assert.True(t, allowed2)

		used1, _, _, err := repo.GetCurrentUsage(testUser.ID, "multi_resource_a", 30)
		require.NoError(t, err)
		assert.Equal(t, 1, used1)

		used2, _, _, err := repo.GetCurrentUsage(testUser.ID, "multi_resource_b", 100)
		require.NoError(t, err)
		assert.Equal(t, 1, used2)
	})
}
