package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/testutil"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestNotificationPreferencesRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	prefsRepo := NewNotificationPreferencesRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("prefs@example.com", "Prefs User", string(hashedPassword))
	require.NoError(t, err)

	t.Run("GetByUserID", func(t *testing.T) {
		t.Run("ReturnsDefaultsWhenNoneExist", func(t *testing.T) {
			prefs, err := prefsRepo.GetByUserID(testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, prefs)
			assert.Equal(t, testUser.ID, prefs.UserID)
			assert.True(t, prefs.Interview24h)
			assert.True(t, prefs.Interview1h)
			assert.True(t, prefs.Assessment3d)
			assert.True(t, prefs.Assessment1d)
			assert.False(t, prefs.Assessment1h)
		})
	})

	t.Run("Upsert", func(t *testing.T) {
		t.Run("CreateNew", func(t *testing.T) {
			prefs := &models.UserNotificationPreferences{
				UserID:       testUser.ID,
				Interview24h: false,
				Interview1h:  true,
				Assessment3d: true,
				Assessment1d: false,
				Assessment1h: true,
			}

			result, err := prefsRepo.Upsert(prefs)

			require.NoError(t, err)
			require.NotNil(t, result)
			assert.Equal(t, testUser.ID, result.UserID)
			assert.False(t, result.Interview24h)
			assert.True(t, result.Interview1h)
			assert.True(t, result.Assessment3d)
			assert.False(t, result.Assessment1d)
			assert.True(t, result.Assessment1h)
		})

		t.Run("UpdateExisting", func(t *testing.T) {
			prefs := &models.UserNotificationPreferences{
				UserID:       testUser.ID,
				Interview24h: true,
				Interview1h:  false,
				Assessment3d: false,
				Assessment1d: true,
				Assessment1h: false,
			}

			result, err := prefsRepo.Upsert(prefs)

			require.NoError(t, err)
			assert.True(t, result.Interview24h)
			assert.False(t, result.Interview1h)
			assert.False(t, result.Assessment3d)
			assert.True(t, result.Assessment1d)
			assert.False(t, result.Assessment1h)
		})

		t.Run("GetByUserIDReturnsUpsertedValues", func(t *testing.T) {
			prefs, err := prefsRepo.GetByUserID(testUser.ID)

			require.NoError(t, err)
			assert.True(t, prefs.Interview24h)
			assert.False(t, prefs.Interview1h)
			assert.False(t, prefs.Assessment3d)
			assert.True(t, prefs.Assessment1d)
			assert.False(t, prefs.Assessment1h)
		})
	})
}
