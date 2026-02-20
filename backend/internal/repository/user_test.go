package repository

import (
	"ditto-backend/internal/testutil"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
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

	t.Run("UpdateRefreshToken", func(t *testing.T) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		require.NoError(t, err)
		user, err := repo.CreateUser("refresh@example.com", "Refresh User", string(hashedPassword))
		require.NoError(t, err)

		token := "test-refresh-token-123"
		expiresAt := time.Now().Add(24 * time.Hour)

		err = repo.UpdateRefreshToken(user.ID, token, expiresAt)
		require.NoError(t, err)

		auth, err := repo.GetUserAuth(user.ID)
		require.NoError(t, err)
		require.NotNil(t, auth.RefreshToken)
		assert.Equal(t, token, *auth.RefreshToken)
	})

	t.Run("ValidateRefreshToken", func(t *testing.T) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		require.NoError(t, err)
		user, err := repo.CreateUser("validate@example.com", "Validate User", string(hashedPassword))
		require.NoError(t, err)

		token := "valid-refresh-token"
		expiresAt := time.Now().Add(24 * time.Hour)
		err = repo.UpdateRefreshToken(user.ID, token, expiresAt)
		require.NoError(t, err)

		t.Run("ValidToken", func(t *testing.T) {
			valid, err := repo.ValidateRefreshToken(user.ID, token)
			require.NoError(t, err)
			assert.True(t, valid)
		})

		t.Run("InvalidToken", func(t *testing.T) {
			valid, err := repo.ValidateRefreshToken(user.ID, "wrong-token")
			require.NoError(t, err)
			assert.False(t, valid)
		})

		t.Run("ExpiredToken", func(t *testing.T) {
			expiredToken := "expired-token"
			pastExpiry := time.Now().Add(-1 * time.Hour)
			err = repo.UpdateRefreshToken(user.ID, expiredToken, pastExpiry)
			require.NoError(t, err)

			valid, err := repo.ValidateRefreshToken(user.ID, expiredToken)
			require.NoError(t, err)
			assert.False(t, valid)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			valid, err := repo.ValidateRefreshToken(uuid.New(), token)
			require.NoError(t, err)
			assert.False(t, valid)
		})
	})

	t.Run("ClearRefreshToken", func(t *testing.T) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		require.NoError(t, err)
		user, err := repo.CreateUser("clear@example.com", "Clear User", string(hashedPassword))
		require.NoError(t, err)

		token := "clear-me-token"
		err = repo.UpdateRefreshToken(user.ID, token, time.Now().Add(24*time.Hour))
		require.NoError(t, err)

		err = repo.ClearRefreshToken(user.ID)
		require.NoError(t, err)

		valid, err := repo.ValidateRefreshToken(user.ID, token)
		require.NoError(t, err)
		assert.False(t, valid)

		auth, err := repo.GetUserAuth(user.ID)
		require.NoError(t, err)
		assert.Nil(t, auth.RefreshToken)
	})

	t.Run("SoftDeleteUser", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
			require.NoError(t, err)
			user, err := repo.CreateUser("softdelete@example.com", "Delete User", string(hashedPassword))
			require.NoError(t, err)

			err = repo.SoftDeleteUser(user.ID)
			require.NoError(t, err)

			_, err = repo.GetUserByID(user.ID)
			require.Error(t, err)

			_, err = repo.GetUserByEmail("softdelete@example.com")
			require.Error(t, err)
		})

		t.Run("NotFound", func(t *testing.T) {
			err := repo.SoftDeleteUser(uuid.New())
			require.Error(t, err)
		})

		t.Run("CascadesRelatedData", func(t *testing.T) {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
			require.NoError(t, err)
			user, err := repo.CreateUser("cascade@example.com", "Cascade User", string(hashedPassword))
			require.NoError(t, err)

			companyRepo := NewCompanyRepository(db.Database)
			jobRepo := NewJobRepository(db.Database)
			applicationRepo := NewApplicationRepository(db.Database)
			interviewRepo := NewInterviewRepository(db.Database)

			company := testutil.CreateTestCompany("Cascade Co", "cascadeco.com")
			createdCompany, err := companyRepo.CreateCompany(company)
			require.NoError(t, err)

			job := testutil.CreateTestJob(createdCompany.ID, "Engineer", "Build")
			createdJob, err := jobRepo.CreateJob(user.ID, job)
			require.NoError(t, err)

			var statusID uuid.UUID
			err = db.Get(&statusID, "SELECT id FROM application_status LIMIT 1")
			require.NoError(t, err)

			app := testutil.CreateTestApplication(user.ID, createdJob.ID, statusID)
			createdApp, err := applicationRepo.CreateApplication(user.ID, app)
			require.NoError(t, err)

			iv := testutil.CreateTestInterview(user.ID, createdApp.ID, time.Now().AddDate(0, 0, 7), "technical")
			_, err = interviewRepo.CreateInterview(iv)
			require.NoError(t, err)

			err = repo.SoftDeleteUser(user.ID)
			require.NoError(t, err)

			apps, err := applicationRepo.GetApplicationsByUser(user.ID, &ApplicationFilters{Limit: 50})
			require.NoError(t, err)
			assert.Empty(t, apps)

			interviews, err := interviewRepo.GetInterviewsByUser(user.ID)
			require.NoError(t, err)
			assert.Empty(t, interviews)
		})
	})

	t.Run("CreateOrUpdateOAuthUser", func(t *testing.T) {
		t.Run("CreateNewOAuthUser", func(t *testing.T) {
			user, err := repo.CreateOrUpdateOAuthUser(
				"oauth-new@example.com", "OAuth New", "github", "https://avatar.url/pic.png",
			)

			require.NoError(t, err)
			require.NotNil(t, user)
			assert.Equal(t, "oauth-new@example.com", user.Email)
			assert.Equal(t, "OAuth New", user.Name)

			auth, err := repo.GetUserAuth(user.ID)
			require.NoError(t, err)
			assert.Equal(t, "github", auth.AuthProvider)
			require.NotNil(t, auth.AvatarURL)
			assert.Equal(t, "https://avatar.url/pic.png", *auth.AvatarURL)
		})

		t.Run("UpdateExistingUser", func(t *testing.T) {
			user, err := repo.CreateOrUpdateOAuthUser(
				"oauth-new@example.com", "Updated Name", "google", "https://new-avatar.url/pic.png",
			)

			require.NoError(t, err)
			require.NotNil(t, user)
			assert.Equal(t, "oauth-new@example.com", user.Email)

			auth, err := repo.GetUserAuth(user.ID)
			require.NoError(t, err)
			assert.Equal(t, "google", auth.AuthProvider)
			require.NotNil(t, auth.AvatarURL)
			assert.Equal(t, "https://new-avatar.url/pic.png", *auth.AvatarURL)
		})
	})
}