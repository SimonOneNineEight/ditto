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

		valid, err := repo.ValidateRefreshToken(user.ID, token)
		require.NoError(t, err)
		assert.True(t, valid)
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

	t.Run("GetUserAuthProviders", func(t *testing.T) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		require.NoError(t, err)
		user, err := repo.CreateUser("providers@example.com", "Providers User", string(hashedPassword))
		require.NoError(t, err)

		providers, err := repo.GetUserAuthProviders(user.ID)
		require.NoError(t, err)
		require.Len(t, providers, 1)
		assert.Equal(t, "local", providers[0].AuthProvider)

		err = repo.LinkProvider(user.ID, "github", "github@example.com", "https://avatar.png")
		require.NoError(t, err)

		providers, err = repo.GetUserAuthProviders(user.ID)
		require.NoError(t, err)
		assert.Len(t, providers, 2)
	})

	t.Run("LinkProvider", func(t *testing.T) {
		user, err := repo.CreateOrUpdateOAuthUser("linkprov@example.com", "Link User", "google", "")
		require.NoError(t, err)

		err = repo.LinkProvider(user.ID, "github", "gh@example.com", "https://gh-avatar.png")
		require.NoError(t, err)

		auth, err := repo.GetUserAuthByProvider(user.ID, "github")
		require.NoError(t, err)
		assert.Equal(t, "github", auth.AuthProvider)
		require.NotNil(t, auth.ProviderEmail)
		assert.Equal(t, "gh@example.com", *auth.ProviderEmail)
		require.NotNil(t, auth.AvatarURL)
		assert.Equal(t, "https://gh-avatar.png", *auth.AvatarURL)

		// Duplicate should fail with unique constraint
		err = repo.LinkProvider(user.ID, "github", "gh@example.com", "")
		require.Error(t, err)
	})

	t.Run("GetAuthByProviderEmail", func(t *testing.T) {
		user, err := repo.CreateOrUpdateOAuthUser("authbyemail@example.com", "Auth Email User", "github", "")
		require.NoError(t, err)

		found, err := repo.GetAuthByProviderEmail("github", "authbyemail@example.com")
		require.NoError(t, err)
		assert.Equal(t, user.ID, found.UserID)
		assert.Equal(t, "github", found.AuthProvider)

		// Non-existent combination
		_, err = repo.GetAuthByProviderEmail("google", "authbyemail@example.com")
		require.Error(t, err)

		_, err = repo.GetAuthByProviderEmail("github", "nonexistent@example.com")
		require.Error(t, err)
	})

	t.Run("UnlinkProvider", func(t *testing.T) {
		user, err := repo.CreateOrUpdateOAuthUser("unlink@example.com", "Unlink User", "github", "")
		require.NoError(t, err)

		err = repo.LinkProvider(user.ID, "google", "google@example.com", "")
		require.NoError(t, err)

		err = repo.UnlinkProvider(user.ID, "google")
		require.NoError(t, err)

		_, err = repo.GetUserAuthByProvider(user.ID, "google")
		require.Error(t, err)

		// Unlinking non-existent provider returns not found
		err = repo.UnlinkProvider(user.ID, "linkedin")
		require.Error(t, err)
	})

	t.Run("CountAuthMethods", func(t *testing.T) {
		user, err := repo.CreateOrUpdateOAuthUser("countauth@example.com", "Count User", "github", "")
		require.NoError(t, err)

		count, err := repo.CountAuthMethods(user.ID)
		require.NoError(t, err)
		assert.Equal(t, 1, count)

		err = repo.LinkProvider(user.ID, "google", "google@example.com", "")
		require.NoError(t, err)

		count, err = repo.CountAuthMethods(user.ID)
		require.NoError(t, err)
		assert.Equal(t, 2, count)
	})

	t.Run("HasPassword", func(t *testing.T) {
		// OAuth user has no password
		oauthUser, err := repo.CreateOrUpdateOAuthUser("haspass-oauth@example.com", "OAuth User", "github", "")
		require.NoError(t, err)

		has, err := repo.HasPassword(oauthUser.ID)
		require.NoError(t, err)
		assert.False(t, has)

		// Local user has password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		require.NoError(t, err)
		localUser, err := repo.CreateUser("haspass-local@example.com", "Local User", string(hashedPassword))
		require.NoError(t, err)

		has, err = repo.HasPassword(localUser.ID)
		require.NoError(t, err)
		assert.True(t, has)
	})

	t.Run("SetPassword", func(t *testing.T) {
		user, err := repo.CreateOrUpdateOAuthUser("setpass@example.com", "Set Pass User", "github", "")
		require.NoError(t, err)

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("newpass123"), bcrypt.DefaultCost)
		require.NoError(t, err)

		err = repo.SetPassword(user.ID, string(hashedPassword))
		require.NoError(t, err)

		has, err := repo.HasPassword(user.ID)
		require.NoError(t, err)
		assert.True(t, has)

		hash, err := repo.GetPasswordHash(user.ID)
		require.NoError(t, err)
		err = bcrypt.CompareHashAndPassword([]byte(hash), []byte("newpass123"))
		require.NoError(t, err)
	})

	t.Run("UpdatePassword", func(t *testing.T) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("oldpass"), bcrypt.DefaultCost)
		require.NoError(t, err)
		user, err := repo.CreateUser("updatepass@example.com", "Update Pass", string(hashedPassword))
		require.NoError(t, err)

		newHash, err := bcrypt.GenerateFromPassword([]byte("newpass"), bcrypt.DefaultCost)
		require.NoError(t, err)

		err = repo.UpdatePassword(user.ID, string(newHash))
		require.NoError(t, err)

		hash, err := repo.GetPasswordHash(user.ID)
		require.NoError(t, err)
		err = bcrypt.CompareHashAndPassword([]byte(hash), []byte("newpass"))
		require.NoError(t, err)

		// Update for non-existent user returns error
		err = repo.UpdatePassword(uuid.New(), string(newHash))
		require.Error(t, err)
	})

	t.Run("GetPasswordHash", func(t *testing.T) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("hashtest"), bcrypt.DefaultCost)
		require.NoError(t, err)
		user, err := repo.CreateUser("gethash@example.com", "Hash User", string(hashedPassword))
		require.NoError(t, err)

		hash, err := repo.GetPasswordHash(user.ID)
		require.NoError(t, err)
		err = bcrypt.CompareHashAndPassword([]byte(hash), []byte("hashtest"))
		require.NoError(t, err)

		// OAuth user has no password hash
		oauthUser, err := repo.CreateOrUpdateOAuthUser("gethash-oauth@example.com", "OAuth User", "github", "")
		require.NoError(t, err)
		_, err = repo.GetPasswordHash(oauthUser.ID)
		require.Error(t, err)
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

			auth, err := repo.GetUserAuthByProvider(user.ID, "github")
			require.NoError(t, err)
			assert.Equal(t, "github", auth.AuthProvider)
			require.NotNil(t, auth.AvatarURL)
			assert.Equal(t, "https://avatar.url/pic.png", *auth.AvatarURL)
		})

		t.Run("AddSecondProvider", func(t *testing.T) {
			user, err := repo.CreateOrUpdateOAuthUser(
				"oauth-new@example.com", "Updated Name", "google", "https://new-avatar.url/pic.png",
			)

			require.NoError(t, err)
			require.NotNil(t, user)
			assert.Equal(t, "oauth-new@example.com", user.Email)

			githubAuth, err := repo.GetUserAuthByProvider(user.ID, "github")
			require.NoError(t, err)
			assert.Equal(t, "github", githubAuth.AuthProvider)

			googleAuth, err := repo.GetUserAuthByProvider(user.ID, "google")
			require.NoError(t, err)
			assert.Equal(t, "google", googleAuth.AuthProvider)
			require.NotNil(t, googleAuth.AvatarURL)
			assert.Equal(t, "https://new-avatar.url/pic.png", *googleAuth.AvatarURL)
		})

		t.Run("SameProviderUpdatesNotDuplicates", func(t *testing.T) {
			user, err := repo.CreateOrUpdateOAuthUser(
				"oauth-new@example.com", "Name Again", "github", "https://updated-avatar.url/pic.png",
			)

			require.NoError(t, err)
			require.NotNil(t, user)

			auth, err := repo.GetUserAuthByProvider(user.ID, "github")
			require.NoError(t, err)
			require.NotNil(t, auth.AvatarURL)
			assert.Equal(t, "https://updated-avatar.url/pic.png", *auth.AvatarURL)
		})
	})
}