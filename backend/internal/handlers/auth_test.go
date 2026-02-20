package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"ditto-backend/internal/auth"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/services"
	"ditto-backend/internal/testutil"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type authTestEnv struct {
	router   *gin.Engine
	userRepo *repository.UserRepository
}

type authTestEnvProtected struct {
	router     *gin.Engine
	userRepo   *repository.UserRepository
	testUserID uuid.UUID
}

func newAuthTestEnv(t *testing.T) *authTestEnv {
	t.Setenv("JWT_SECRET", "test-secret-key-for-testing")

	gin.SetMode(gin.TestMode)
	db := testutil.NewTestDatabase(t)
	t.Cleanup(func() { db.Close(t) })
	db.RunMigrations(t)

	_, err := db.Exec("ALTER TABLE users_auth ADD CONSTRAINT users_auth_user_id_unique UNIQUE (user_id)")
	require.NoError(t, err)

	sanitizer := services.NewSanitizerService()
	appState := &utils.AppState{
		DB:        db.Database,
		Sanitizer: sanitizer,
	}
	handler := NewAuthHandler(appState)
	userRepo := repository.NewUserRepository(db.Database)

	router := gin.New()

	router.POST("/api/users", handler.Register)
	router.POST("/api/login", handler.Login)
	router.POST("/api/refresh_token", handler.RefreshToken)
	router.POST("/api/oauth", handler.OAuthLogin)

	return &authTestEnv{router: router, userRepo: userRepo}
}

func newAuthTestEnvProtected(t *testing.T) *authTestEnvProtected {
	t.Setenv("JWT_SECRET", "test-secret-key-for-testing")

	gin.SetMode(gin.TestMode)
	db := testutil.NewTestDatabase(t)
	t.Cleanup(func() { db.Close(t) })
	db.RunMigrations(t)

	_, err := db.Exec("ALTER TABLE users_auth ADD CONSTRAINT users_auth_user_id_unique UNIQUE (user_id)")
	require.NoError(t, err)

	sanitizer := services.NewSanitizerService()
	appState := &utils.AppState{
		DB:        db.Database,
		Sanitizer: sanitizer,
	}
	handler := NewAuthHandler(appState)
	userRepo := repository.NewUserRepository(db.Database)

	testUser, err := userRepo.CreateUser("protected@example.com", "Protected User", mustHashPassword(t, "password123"))
	require.NoError(t, err)

	router := gin.New()

	router.POST("/api/users", handler.Register)
	router.POST("/api/login", handler.Login)
	router.POST("/api/refresh_token", handler.RefreshToken)
	router.POST("/api/oauth", handler.OAuthLogin)

	protected := router.Group("/api")
	protected.Use(func(c *gin.Context) {
		c.Set("user_id", testUser.ID)
		c.Next()
	})
	protected.POST("/logout", handler.Logout)
	protected.GET("/me", handler.GetMe)
	protected.DELETE("/users/account", handler.DeleteAccount)

	return &authTestEnvProtected{
		router:     router,
		userRepo:   userRepo,
		testUserID: testUser.ID,
	}
}

func mustHashPassword(t *testing.T, password string) string {
	t.Helper()
	hash, err := auth.HashPassword(password)
	require.NoError(t, err)
	return hash
}

func parseResponse(t *testing.T, w *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)
	return resp
}

func jsonBody(t *testing.T, payload interface{}) *bytes.Buffer {
	t.Helper()
	data, err := json.Marshal(payload)
	require.NoError(t, err)
	return bytes.NewBuffer(data)
}

func postJSON(router *gin.Engine, path string, body *bytes.Buffer) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", path, body)
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	return w
}

func TestAuthRegister(t *testing.T) {
	env := newAuthTestEnv(t)

	t.Run("Success", func(t *testing.T) {
		payload := map[string]string{
			"email":    "newuser@example.com",
			"name":     "New User",
			"password": "securepass123",
		}

		w := postJSON(env.router, "/api/users", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotEmpty(t, data["access_token"])
		assert.NotEmpty(t, data["refresh_token"])
		assert.Equal(t, float64(auth.AccessTokenTTL.Seconds()), data["expires_in"])

		user := data["user"].(map[string]interface{})
		assert.Equal(t, "newuser@example.com", user["email"])
		assert.Equal(t, "New User", user["name"])
		assert.NotEmpty(t, user["id"])
	})

	t.Run("DuplicateEmail", func(t *testing.T) {
		payload := map[string]string{
			"email":    "dupe@example.com",
			"name":     "First User",
			"password": "password123",
		}

		w := postJSON(env.router, "/api/users", jsonBody(t, payload))
		require.Equal(t, http.StatusOK, w.Code)

		w = postJSON(env.router, "/api/users", jsonBody(t, payload))
		assert.Equal(t, http.StatusConflict, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("MissingFields", func(t *testing.T) {
		tests := []struct {
			name    string
			payload map[string]string
		}{
			{
				name:    "missing email",
				payload: map[string]string{"name": "User", "password": "pass123"},
			},
			{
				name:    "missing name",
				payload: map[string]string{"email": "miss@b.com", "password": "pass123"},
			},
			{
				name:    "missing password",
				payload: map[string]string{"email": "miss2@b.com", "name": "User"},
			},
			{
				name:    "empty body",
				payload: map[string]string{},
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				w := postJSON(env.router, "/api/users", jsonBody(t, tc.payload))
				assert.Equal(t, http.StatusBadRequest, w.Code)

				resp := parseResponse(t, w)
				assert.False(t, resp["success"].(bool))
			})
		}
	})

	t.Run("InvalidEmail", func(t *testing.T) {
		payload := map[string]string{
			"email":    "not-an-email",
			"name":     "User",
			"password": "password123",
		}

		w := postJSON(env.router, "/api/users", jsonBody(t, payload))
		assert.Equal(t, http.StatusBadRequest, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("TokensAreValidJWTs", func(t *testing.T) {
		payload := map[string]string{
			"email":    "jwt@example.com",
			"name":     "JWT User",
			"password": "password123",
		}

		w := postJSON(env.router, "/api/users", jsonBody(t, payload))
		require.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		data := resp["data"].(map[string]interface{})

		accessToken := data["access_token"].(string)
		claims, err := auth.ValidateToken(accessToken)
		require.NoError(t, err)
		assert.Equal(t, "jwt@example.com", claims.Email)
		assert.NotEqual(t, uuid.Nil, claims.UserID)

		refreshToken := data["refresh_token"].(string)
		refreshClaims, err := auth.ValidateToken(refreshToken)
		require.NoError(t, err)
		assert.Equal(t, "jwt@example.com", refreshClaims.Email)
	})
}

func TestAuthLogin(t *testing.T) {
	env := newAuthTestEnv(t)

	_, err := env.userRepo.CreateUser("login@example.com", "Login User", mustHashPassword(t, "correctpass"))
	require.NoError(t, err)

	_, err = env.userRepo.CreateUser("wrong@example.com", "Wrong Pass", mustHashPassword(t, "rightpass"))
	require.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		payload := map[string]string{
			"email":    "login@example.com",
			"password": "correctpass",
		}

		w := postJSON(env.router, "/api/login", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotEmpty(t, data["access_token"])
		assert.NotEmpty(t, data["refresh_token"])
		assert.Equal(t, float64(auth.AccessTokenTTL.Seconds()), data["expires_in"])

		user := data["user"].(map[string]interface{})
		assert.Equal(t, "login@example.com", user["email"])
		assert.Equal(t, "Login User", user["name"])
	})

	t.Run("WrongPassword", func(t *testing.T) {
		payload := map[string]string{
			"email":    "wrong@example.com",
			"password": "wrongpass",
		}

		w := postJSON(env.router, "/api/login", jsonBody(t, payload))
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("NonExistentEmail", func(t *testing.T) {
		payload := map[string]string{
			"email":    "nobody@example.com",
			"password": "somepass",
		}

		w := postJSON(env.router, "/api/login", jsonBody(t, payload))
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("MissingFields", func(t *testing.T) {
		tests := []struct {
			name    string
			payload map[string]string
		}{
			{
				name:    "missing email",
				payload: map[string]string{"password": "pass123"},
			},
			{
				name:    "missing password",
				payload: map[string]string{"email": "a@b.com"},
			},
			{
				name:    "empty body",
				payload: map[string]string{},
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				w := postJSON(env.router, "/api/login", jsonBody(t, tc.payload))
				assert.Equal(t, http.StatusBadRequest, w.Code)

				resp := parseResponse(t, w)
				assert.False(t, resp["success"].(bool))
			})
		}
	})

	t.Run("InvalidEmailFormat", func(t *testing.T) {
		payload := map[string]string{
			"email":    "invalid-email",
			"password": "password123",
		}

		w := postJSON(env.router, "/api/login", jsonBody(t, payload))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("RegisterThenLogin", func(t *testing.T) {
		regPayload := map[string]string{
			"email":    "flow@example.com",
			"name":     "Flow User",
			"password": "flowpass123",
		}

		w := postJSON(env.router, "/api/users", jsonBody(t, regPayload))
		require.Equal(t, http.StatusOK, w.Code)

		loginPayload := map[string]string{
			"email":    "flow@example.com",
			"password": "flowpass123",
		}

		w = postJSON(env.router, "/api/login", jsonBody(t, loginPayload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotEmpty(t, data["access_token"])
		assert.NotEmpty(t, data["refresh_token"])
	})
}

func TestAuthLogout(t *testing.T) {
	env := newAuthTestEnvProtected(t)

	t.Run("Success", func(t *testing.T) {
		refreshToken, err := auth.GenerateRefreshToken(env.testUserID, "protected@example.com")
		require.NoError(t, err)
		err = env.userRepo.UpdateRefreshToken(env.testUserID, refreshToken, time.Now().Add(auth.RefreshTokenTTL))
		require.NoError(t, err)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/logout", nil)
		env.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, "logged out successfully", data["message"])

		valid, err := env.userRepo.ValidateRefreshToken(env.testUserID, refreshToken)
		require.NoError(t, err)
		assert.False(t, valid)
	})
}

func TestAuthRefreshToken(t *testing.T) {
	env := newAuthTestEnv(t)

	t.Run("Success", func(t *testing.T) {
		user, err := env.userRepo.CreateUser("refresh@example.com", "Refresh User", mustHashPassword(t, "password123"))
		require.NoError(t, err)

		refreshToken, err := auth.GenerateRefreshToken(user.ID, user.Email)
		require.NoError(t, err)
		err = env.userRepo.UpdateRefreshToken(user.ID, refreshToken, time.Now().Add(auth.RefreshTokenTTL))
		require.NoError(t, err)

		payload := map[string]string{
			"refresh_token": refreshToken,
		}

		w := postJSON(env.router, "/api/refresh_token", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotEmpty(t, data["access_token"])
		assert.NotEmpty(t, data["refresh_token"])
		assert.Equal(t, float64(auth.AccessTokenTTL.Seconds()), data["expires_in"])

		newAccessToken := data["access_token"].(string)
		claims, err := auth.ValidateToken(newAccessToken)
		require.NoError(t, err)
		assert.Equal(t, user.Email, claims.Email)
		assert.Equal(t, user.ID, claims.UserID)
	})

	t.Run("InvalidToken", func(t *testing.T) {
		payload := map[string]string{
			"refresh_token": "invalid.token.string",
		}

		w := postJSON(env.router, "/api/refresh_token", jsonBody(t, payload))
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("TokenNotInDB", func(t *testing.T) {
		user, err := env.userRepo.CreateUser("stale@example.com", "Stale User", mustHashPassword(t, "password123"))
		require.NoError(t, err)

		refreshToken, err := auth.GenerateRefreshToken(user.ID, user.Email)
		require.NoError(t, err)

		payload := map[string]string{
			"refresh_token": refreshToken,
		}

		w := postJSON(env.router, "/api/refresh_token", jsonBody(t, payload))
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("MissingField", func(t *testing.T) {
		w := postJSON(env.router, "/api/refresh_token", jsonBody(t, map[string]string{}))
		assert.Equal(t, http.StatusBadRequest, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("NewTokenFromRefreshIsUsable", func(t *testing.T) {
		user, err := env.userRepo.CreateUser("rotate@example.com", "Rotate User", mustHashPassword(t, "password123"))
		require.NoError(t, err)

		oldRefreshToken, err := auth.GenerateRefreshToken(user.ID, user.Email)
		require.NoError(t, err)
		err = env.userRepo.UpdateRefreshToken(user.ID, oldRefreshToken, time.Now().Add(auth.RefreshTokenTTL))
		require.NoError(t, err)

		payload := map[string]string{"refresh_token": oldRefreshToken}
		w := postJSON(env.router, "/api/refresh_token", jsonBody(t, payload))
		require.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		data := resp["data"].(map[string]interface{})
		newRefreshToken := data["refresh_token"].(string)

		newPayload := map[string]string{"refresh_token": newRefreshToken}
		w = postJSON(env.router, "/api/refresh_token", jsonBody(t, newPayload))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("RegisterThenRefresh", func(t *testing.T) {
		regPayload := map[string]string{
			"email":    "regrefresh@example.com",
			"name":     "Reg Refresh",
			"password": "password123",
		}

		w := postJSON(env.router, "/api/users", jsonBody(t, regPayload))
		require.Equal(t, http.StatusOK, w.Code)

		regResp := parseResponse(t, w)
		regData := regResp["data"].(map[string]interface{})
		refreshToken := regData["refresh_token"].(string)

		refreshPayload := map[string]string{
			"refresh_token": refreshToken,
		}

		w = postJSON(env.router, "/api/refresh_token", jsonBody(t, refreshPayload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotEmpty(t, data["access_token"])
		assert.NotEmpty(t, data["refresh_token"])
	})
}

func TestAuthGetMe(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		env := newAuthTestEnvProtected(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/me", nil)
		env.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, env.testUserID.String(), data["id"])
		assert.Equal(t, "protected@example.com", data["email"])
		assert.Equal(t, "Protected User", data["name"])
	})

	t.Run("NoAuthContext", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "test-secret-key-for-testing")

		gin.SetMode(gin.TestMode)
		db := testutil.NewTestDatabase(t)
		t.Cleanup(func() { db.Close(t) })
		db.RunMigrations(t)

		sanitizer := services.NewSanitizerService()
		appState := &utils.AppState{
			DB:        db.Database,
			Sanitizer: sanitizer,
		}
		handler := NewAuthHandler(appState)

		router := gin.New()
		router.GET("/api/me", handler.GetMe)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/me", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})
}

func TestAuthDeleteAccount(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		env := newAuthTestEnvProtected(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/users/account", nil)
		env.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, "account deleted successfully", data["message"])

		_, err := env.userRepo.GetUserByID(env.testUserID)
		assert.Error(t, err)
	})

	t.Run("NoAuthContext", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "test-secret-key-for-testing")

		gin.SetMode(gin.TestMode)
		db := testutil.NewTestDatabase(t)
		t.Cleanup(func() { db.Close(t) })
		db.RunMigrations(t)

		sanitizer := services.NewSanitizerService()
		appState := &utils.AppState{
			DB:        db.Database,
			Sanitizer: sanitizer,
		}
		handler := NewAuthHandler(appState)

		router := gin.New()
		router.DELETE("/api/users/account", handler.DeleteAccount)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/users/account", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestAuthOAuthLogin(t *testing.T) {
	env := newAuthTestEnv(t)

	t.Run("NewUser", func(t *testing.T) {
		avatarURL := "https://github.com/avatar.png"
		payload := map[string]interface{}{
			"provider":   "github",
			"email":      "oauth@example.com",
			"name":       "OAuth User",
			"avatar_url": avatarURL,
		}

		w := postJSON(env.router, "/api/oauth", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotEmpty(t, data["access_token"])
		assert.NotEmpty(t, data["refresh_token"])
		assert.Equal(t, float64(auth.AccessTokenTTL.Seconds()), data["expires_in"])

		user := data["user"].(map[string]interface{})
		assert.Equal(t, "oauth@example.com", user["email"])
		assert.Equal(t, "OAuth User", user["name"])
	})

	t.Run("ExistingUser", func(t *testing.T) {
		payload := map[string]interface{}{
			"provider": "github",
			"email":    "existing-oauth@example.com",
			"name":     "First Name",
		}
		w := postJSON(env.router, "/api/oauth", jsonBody(t, payload))
		require.Equal(t, http.StatusOK, w.Code)

		payload["name"] = "Updated Name"
		w = postJSON(env.router, "/api/oauth", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotEmpty(t, data["access_token"])
	})

	t.Run("GoogleProvider", func(t *testing.T) {
		payload := map[string]interface{}{
			"provider": "google",
			"email":    "google@example.com",
			"name":     "Google User",
		}

		w := postJSON(env.router, "/api/oauth", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))
	})

	t.Run("LinkedinProvider", func(t *testing.T) {
		payload := map[string]interface{}{
			"provider": "linkedin",
			"email":    "linkedin@example.com",
			"name":     "LinkedIn User",
		}

		w := postJSON(env.router, "/api/oauth", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))
	})

	t.Run("InvalidProvider", func(t *testing.T) {
		payload := map[string]interface{}{
			"provider": "invalid_provider",
			"email":    "bad@example.com",
			"name":     "Bad Provider",
		}

		w := postJSON(env.router, "/api/oauth", jsonBody(t, payload))
		assert.Equal(t, http.StatusBadRequest, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("MissingFields", func(t *testing.T) {
		tests := []struct {
			name    string
			payload map[string]interface{}
		}{
			{
				name:    "missing provider",
				payload: map[string]interface{}{"email": "miss1@b.com", "name": "User"},
			},
			{
				name:    "missing email",
				payload: map[string]interface{}{"provider": "github", "name": "User"},
			},
			{
				name:    "missing name",
				payload: map[string]interface{}{"provider": "github", "email": "miss2@b.com"},
			},
			{
				name:    "empty body",
				payload: map[string]interface{}{},
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				w := postJSON(env.router, "/api/oauth", jsonBody(t, tc.payload))
				assert.Equal(t, http.StatusBadRequest, w.Code)

				resp := parseResponse(t, w)
				assert.False(t, resp["success"].(bool))
			})
		}
	})

	t.Run("InvalidEmail", func(t *testing.T) {
		payload := map[string]interface{}{
			"provider": "github",
			"email":    "not-valid",
			"name":     "User",
		}

		w := postJSON(env.router, "/api/oauth", jsonBody(t, payload))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("WithoutAvatarURL", func(t *testing.T) {
		payload := map[string]interface{}{
			"provider": "github",
			"email":    "noavatar@example.com",
			"name":     "No Avatar",
		}

		w := postJSON(env.router, "/api/oauth", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))
	})
}
