package repository

import (
	"ditto-backend/internal/testutil"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestUserRepository(t *testing.T) {
	// Setup test database
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	repo := NewUserRepository(db.Database)

	t.Run("CreateUser", func(t *testing.T) {
		// Create a user with hashed password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		require.NoError(t, err)

		user, err := repo.CreateUser("test@example.com", "Test User", string(hashedPassword))
		require.NoError(t, err)
		require.NotNil(t, user)
		require.Equal(t, "test@example.com", user.Email)
		require.Equal(t, "Test User", user.Name)
		require.NotZero(t, user.ID)
		require.False(t, user.CreatedAt.IsZero())
		require.False(t, user.UpdatedAt.IsZero())
	})

	t.Run("GetUserByEmail", func(t *testing.T) {
		// Create a user first
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password456"), bcrypt.DefaultCost)
		require.NoError(t, err)

		createdUser, err := repo.CreateUser("find@example.com", "Find User", string(hashedPassword))
		require.NoError(t, err)

		// Find the user by email
		foundUser, err := repo.GetUserByEmail("find@example.com")
		require.NoError(t, err)
		require.NotNil(t, foundUser)
		require.Equal(t, createdUser.ID, foundUser.ID)
		require.Equal(t, createdUser.Email, foundUser.Email)
		require.Equal(t, createdUser.Name, foundUser.Name)
	})

	t.Run("GetUserByEmail_NotFound", func(t *testing.T) {
		// Try to find non-existent user
		user, err := repo.GetUserByEmail("nonexistent@example.com")
		require.Error(t, err)
		require.Nil(t, user)
	})

	t.Run("GetUserByID", func(t *testing.T) {
		// Create a user first
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password789"), bcrypt.DefaultCost)
		require.NoError(t, err)

		createdUser, err := repo.CreateUser("findbyid@example.com", "Find By ID", string(hashedPassword))
		require.NoError(t, err)

		// Find the user by ID
		foundUser, err := repo.GetUserByID(createdUser.ID)
		require.NoError(t, err)
		require.NotNil(t, foundUser)
		require.Equal(t, createdUser.ID, foundUser.ID)
		require.Equal(t, createdUser.Email, foundUser.Email)
		require.Equal(t, createdUser.Name, foundUser.Name)
	})

	t.Run("GetUserByID_NotFound", func(t *testing.T) {
		// Try to find non-existent user
		nonExistentID := uuid.New()
		user, err := repo.GetUserByID(nonExistentID)
		require.Error(t, err)
		require.Nil(t, user)
	})

	t.Run("GetUserAuth", func(t *testing.T) {
		// Create a user first
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("authtest123"), bcrypt.DefaultCost)
		require.NoError(t, err)

		user, err := repo.CreateUser("auth@example.com", "Auth User", string(hashedPassword))
		require.NoError(t, err)

		// Get user auth
		auth, err := repo.GetUserAuth(user.ID)
		require.NoError(t, err)
		require.NotNil(t, auth)
		require.Equal(t, user.ID, auth.UserID)
		require.Equal(t, "local", auth.AuthProvider)
		require.NotNil(t, auth.PasswordHash)

		// Verify password hash
		err = bcrypt.CompareHashAndPassword([]byte(*auth.PasswordHash), []byte("authtest123"))
		require.NoError(t, err, "Password hash should be valid")
	})

	t.Run("CreateUser_DuplicateEmail", func(t *testing.T) {
		// Create first user
		hashedPassword1, err := bcrypt.GenerateFromPassword([]byte("password1"), bcrypt.DefaultCost)
		require.NoError(t, err)

		_, err = repo.CreateUser("duplicate@example.com", "User One", string(hashedPassword1))
		require.NoError(t, err)

		// Try to create second user with same email
		hashedPassword2, err := bcrypt.GenerateFromPassword([]byte("password2"), bcrypt.DefaultCost)
		require.NoError(t, err)

		_, err = repo.CreateUser("duplicate@example.com", "User Two", string(hashedPassword2))
		require.Error(t, err, "Should fail due to duplicate email")
	})

	t.Run("Integration_UserFlow", func(t *testing.T) {
		// Test complete user registration and authentication flow
		email := "flow@example.com"
		name := "Flow User"
		password := "flowpassword123"

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		require.NoError(t, err)

		// Create user
		user, err := repo.CreateUser(email, name, string(hashedPassword))
		require.NoError(t, err)
		require.NotNil(t, user)

		// Verify user can be found by email
		foundUser, err := repo.GetUserByEmail(email)
		require.NoError(t, err)
		require.Equal(t, user.ID, foundUser.ID)

		// Verify user can be found by ID
		foundUserByID, err := repo.GetUserByID(user.ID)
		require.NoError(t, err)
		require.Equal(t, user.ID, foundUserByID.ID)

		// Verify authentication data
		auth, err := repo.GetUserAuth(user.ID)
		require.NoError(t, err)
		require.Equal(t, user.ID, auth.UserID)

		// Verify password
		err = bcrypt.CompareHashAndPassword([]byte(*auth.PasswordHash), []byte(password))
		require.NoError(t, err)
	})
}