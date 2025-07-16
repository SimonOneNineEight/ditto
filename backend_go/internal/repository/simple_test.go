package repository

import (
	"ditto-backend/internal/testutil"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestUserRepositoryBasics(t *testing.T) {
	// Setup test database
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	t.Run("user creation and retrieval", func(t *testing.T) {
		repo := NewUserRepository(db.Database)
		
		// Create a user with hashed password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		require.NoError(t, err)
		
		user, err := repo.CreateUser("test@example.com", "Test User", string(hashedPassword))
		require.NoError(t, err)
		require.NotNil(t, user)
		require.Equal(t, "test@example.com", user.Email)
		require.Equal(t, "Test User", user.Name)
		
		// Find the user by email
		foundUser, err := repo.GetUserByEmail("test@example.com")
		require.NoError(t, err)
		require.NotNil(t, foundUser)
		require.Equal(t, user.ID, foundUser.ID)
		require.Equal(t, user.Email, foundUser.Email)
		require.Equal(t, user.Name, foundUser.Name)
		
		// Find the user by ID
		foundUserByID, err := repo.GetUserByID(user.ID)
		require.NoError(t, err)
		require.NotNil(t, foundUserByID)
		require.Equal(t, user.ID, foundUserByID.ID)
		require.Equal(t, user.Email, foundUserByID.Email)
		require.Equal(t, user.Name, foundUserByID.Name)
		
		// Get user auth
		auth, err := repo.GetUserAuth(user.ID)
		require.NoError(t, err)
		require.NotNil(t, auth)
		require.Equal(t, user.ID, auth.UserID)
		require.Equal(t, "local", auth.AuthProvider)
		require.NotNil(t, auth.PasswordHash)
		
		// Verify password hash can be used with bcrypt
		err = bcrypt.CompareHashAndPassword([]byte(*auth.PasswordHash), []byte("password123"))
		require.NoError(t, err, "Password hash should be valid")
	})
}