package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"ditto-backend/internal/repository"
	"ditto-backend/internal/services"
	"ditto-backend/internal/testutil"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type accountTestEnv struct {
	router     *gin.Engine
	userRepo   *repository.UserRepository
	testUserID uuid.UUID
	appState   *utils.AppState
}

func newAccountTestEnv(t *testing.T) *accountTestEnv {
	t.Setenv("JWT_SECRET", "test-secret-key-for-testing")

	gin.SetMode(gin.TestMode)
	db := testutil.NewTestDatabase(t)
	t.Cleanup(func() { db.Close(t) })
	db.RunMigrations(t)

	appState := &utils.AppState{
		DB:        db.Database,
		Sanitizer: services.NewSanitizerService(),
	}
	accountHandler := NewAccountHandler(appState)
	userRepo := repository.NewUserRepository(db.Database)

	testUser, err := userRepo.CreateUser("account@example.com", "Account User", mustHashPassword(t, "password123"))
	require.NoError(t, err)

	router := gin.New()

	protected := router.Group("/api/account")
	protected.Use(func(c *gin.Context) {
		c.Set("user_id", testUser.ID)
		c.Next()
	})
	protected.GET("/providers", accountHandler.GetLinkedProviders)
	protected.POST("/link-provider", accountHandler.LinkProvider)
	protected.DELETE("/providers/:provider", accountHandler.UnlinkProvider)
	protected.POST("/set-password", accountHandler.SetPassword)
	protected.PUT("/change-password", accountHandler.ChangePassword)

	unauth := router.Group("/api/unauth")
	unauth.GET("/providers", accountHandler.GetLinkedProviders)
	unauth.POST("/link-provider", accountHandler.LinkProvider)
	unauth.DELETE("/providers/:provider", accountHandler.UnlinkProvider)
	unauth.POST("/set-password", accountHandler.SetPassword)
	unauth.PUT("/change-password", accountHandler.ChangePassword)

	return &accountTestEnv{
		router:     router,
		userRepo:   userRepo,
		testUserID: testUser.ID,
		appState:   appState,
	}
}

func newAccountTestEnvForUser(t *testing.T, env *accountTestEnv, userID uuid.UUID) *gin.Engine {
	accountHandler := NewAccountHandler(env.appState)
	router := gin.New()
	protected := router.Group("/api/account")
	protected.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})
	protected.GET("/providers", accountHandler.GetLinkedProviders)
	protected.POST("/link-provider", accountHandler.LinkProvider)
	protected.DELETE("/providers/:provider", accountHandler.UnlinkProvider)
	protected.POST("/set-password", accountHandler.SetPassword)
	protected.PUT("/change-password", accountHandler.ChangePassword)
	return router
}

func deleteJSON(router *gin.Engine, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", path, nil)
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	return w
}

func putJSON(router *gin.Engine, path string, body *bytes.Buffer) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", path, body)
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	return w
}

func getJSON(router *gin.Engine, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", path, nil)
	router.ServeHTTP(w, req)
	return w
}

func TestGetLinkedProviders(t *testing.T) {
	env := newAccountTestEnv(t)

	t.Run("ReturnsProviderList", func(t *testing.T) {
		w := getJSON(env.router, "/api/account/providers")
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].([]interface{})
		require.Len(t, data, 1)

		provider := data[0].(map[string]interface{})
		assert.Equal(t, "local", provider["auth_provider"])
		assert.NotEmpty(t, provider["created_at"])
	})

	t.Run("MultipleProviders", func(t *testing.T) {
		err := env.userRepo.LinkProvider(env.testUserID, "github", "github@example.com", "https://avatar.png")
		require.NoError(t, err)

		w := getJSON(env.router, "/api/account/providers")
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		data := resp["data"].([]interface{})
		assert.Len(t, data, 2)
	})

	t.Run("Unauthenticated", func(t *testing.T) {
		w := getJSON(env.router, "/api/unauth/providers")
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestLinkProvider(t *testing.T) {
	t.Run("HappyPath", func(t *testing.T) {
		env := newAccountTestEnv(t)

		avatarURL := "https://github.com/avatar.png"
		payload := map[string]interface{}{
			"provider":   "github",
			"email":      "account@example.com",
			"name":       "Account User",
			"avatar_url": avatarURL,
		}

		w := postJSON(env.router, "/api/account/link-provider", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].([]interface{})
		assert.Len(t, data, 2)

		providers := make(map[string]bool)
		for _, p := range data {
			prov := p.(map[string]interface{})
			providers[prov["auth_provider"].(string)] = true
		}
		assert.True(t, providers["local"])
		assert.True(t, providers["github"])
	})

	t.Run("DuplicateProvider", func(t *testing.T) {
		env := newAccountTestEnv(t)

		err := env.userRepo.LinkProvider(env.testUserID, "github", "github@example.com", "")
		require.NoError(t, err)

		payload := map[string]interface{}{
			"provider": "github",
			"email":    "account@example.com",
			"name":     "Account User",
		}

		w := postJSON(env.router, "/api/account/link-provider", jsonBody(t, payload))
		assert.Equal(t, http.StatusConflict, w.Code)

		resp := parseResponse(t, w)
		errDetail := resp["error"].(map[string]interface{})
		assert.Contains(t, errDetail["error"], "Provider already linked")
	})

	t.Run("CrossUserConflict", func(t *testing.T) {
		env := newAccountTestEnv(t)

		otherUser, err := env.userRepo.CreateUser("other@example.com", "Other User", mustHashPassword(t, "password123"))
		require.NoError(t, err)
		err = env.userRepo.LinkProvider(otherUser.ID, "github", "other@example.com", "")
		require.NoError(t, err)

		payload := map[string]interface{}{
			"provider": "github",
			"email":    "other@example.com",
			"name":     "Other User",
		}

		w := postJSON(env.router, "/api/account/link-provider", jsonBody(t, payload))
		assert.Equal(t, http.StatusConflict, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
		errDetail := resp["error"].(map[string]interface{})
		assert.Contains(t, errDetail["error"], "already linked to another account")
	})

	t.Run("InvalidProvider", func(t *testing.T) {
		env := newAccountTestEnv(t)

		payload := map[string]interface{}{
			"provider": "invalid_provider",
			"email":    "account@example.com",
			"name":     "Account User",
		}

		w := postJSON(env.router, "/api/account/link-provider", jsonBody(t, payload))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("LocalProviderRejected", func(t *testing.T) {
		env := newAccountTestEnv(t)

		payload := map[string]interface{}{
			"provider": "local",
			"email":    "account@example.com",
			"name":     "Account User",
		}

		w := postJSON(env.router, "/api/account/link-provider", jsonBody(t, payload))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("MissingFields", func(t *testing.T) {
		env := newAccountTestEnv(t)

		tests := []struct {
			name    string
			payload map[string]interface{}
		}{
			{
				name:    "missing provider",
				payload: map[string]interface{}{"email": "a@b.com", "name": "User"},
			},
			{
				name:    "missing email",
				payload: map[string]interface{}{"provider": "github", "name": "User"},
			},
			{
				name:    "missing name",
				payload: map[string]interface{}{"provider": "github", "email": "a@b.com"},
			},
			{
				name:    "empty body",
				payload: map[string]interface{}{},
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				w := postJSON(env.router, "/api/account/link-provider", jsonBody(t, tc.payload))
				assert.Equal(t, http.StatusBadRequest, w.Code)
			})
		}
	})

	t.Run("Unauthenticated", func(t *testing.T) {
		env := newAccountTestEnv(t)

		payload := map[string]interface{}{
			"provider": "github",
			"email":    "a@b.com",
			"name":     "User",
		}

		w := postJSON(env.router, "/api/unauth/link-provider", jsonBody(t, payload))
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestUnlinkProvider(t *testing.T) {
	t.Run("HappyPath", func(t *testing.T) {
		env := newAccountTestEnv(t)

		err := env.userRepo.LinkProvider(env.testUserID, "github", "github@example.com", "https://avatar.png")
		require.NoError(t, err)

		w := deleteJSON(env.router, "/api/account/providers/github")
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].([]interface{})
		assert.Len(t, data, 1)
		assert.Equal(t, "local", data[0].(map[string]interface{})["auth_provider"])
	})

	t.Run("LockoutProtection", func(t *testing.T) {
		env := newAccountTestEnv(t)

		w := deleteJSON(env.router, "/api/account/providers/local")
		assert.Equal(t, http.StatusBadRequest, w.Code)

		resp := parseResponse(t, w)
		errDetail := resp["error"].(map[string]interface{})
		assert.Contains(t, errDetail["error"], "Cannot remove your only login method")
	})

	t.Run("NonExistentProvider", func(t *testing.T) {
		env := newAccountTestEnv(t)

		err := env.userRepo.LinkProvider(env.testUserID, "github", "github@example.com", "")
		require.NoError(t, err)

		w := deleteJSON(env.router, "/api/account/providers/google")
		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("Unauthenticated", func(t *testing.T) {
		env := newAccountTestEnv(t)

		w := deleteJSON(env.router, "/api/unauth/providers/github")
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestSetPassword(t *testing.T) {
	t.Run("HappyPath", func(t *testing.T) {
		env := newAccountTestEnv(t)

		oauthUser, err := env.userRepo.CreateOrUpdateOAuthUser("oauth-only@example.com", "OAuth Only", "github", "https://avatar.png")
		require.NoError(t, err)

		router := newAccountTestEnvForUser(t, env, oauthUser.ID)

		payload := map[string]string{"password": "newpassword123"}
		w := postJSON(router, "/api/account/set-password", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		hasPass, err := env.userRepo.HasPassword(oauthUser.ID)
		require.NoError(t, err)
		assert.True(t, hasPass)
	})

	t.Run("PasswordAlreadySet", func(t *testing.T) {
		env := newAccountTestEnv(t)

		payload := map[string]string{"password": "anotherpass"}
		w := postJSON(env.router, "/api/account/set-password", jsonBody(t, payload))
		assert.Equal(t, http.StatusBadRequest, w.Code)

		resp := parseResponse(t, w)
		errDetail := resp["error"].(map[string]interface{})
		assert.Contains(t, errDetail["error"], "Password already set")
	})

	t.Run("MissingPassword", func(t *testing.T) {
		env := newAccountTestEnv(t)

		w := postJSON(env.router, "/api/account/set-password", jsonBody(t, map[string]string{}))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("PasswordTooShort", func(t *testing.T) {
		env := newAccountTestEnv(t)

		oauthUser, err := env.userRepo.CreateOrUpdateOAuthUser("shortpw@example.com", "Short PW", "github", "")
		require.NoError(t, err)

		router := newAccountTestEnvForUser(t, env, oauthUser.ID)

		payload := map[string]string{"password": "short"}
		w := postJSON(router, "/api/account/set-password", jsonBody(t, payload))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Unauthenticated", func(t *testing.T) {
		env := newAccountTestEnv(t)

		payload := map[string]string{"password": "password123"}
		w := postJSON(env.router, "/api/unauth/set-password", jsonBody(t, payload))
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestChangePassword(t *testing.T) {
	t.Run("HappyPath", func(t *testing.T) {
		env := newAccountTestEnv(t)

		payload := map[string]string{
			"current_password": "password123",
			"new_password":     "newpassword456",
		}

		w := putJSON(env.router, "/api/account/change-password", jsonBody(t, payload))
		assert.Equal(t, http.StatusOK, w.Code)

		resp := parseResponse(t, w)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, "password changed successfully", data["message"])
	})

	t.Run("WrongCurrentPassword", func(t *testing.T) {
		env := newAccountTestEnv(t)

		payload := map[string]string{
			"current_password": "wrongpassword",
			"new_password":     "newpassword456",
		}

		w := putJSON(env.router, "/api/account/change-password", jsonBody(t, payload))
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		resp := parseResponse(t, w)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("MissingFields", func(t *testing.T) {
		env := newAccountTestEnv(t)

		tests := []struct {
			name    string
			payload map[string]string
		}{
			{
				name:    "missing current_password",
				payload: map[string]string{"new_password": "newpass123"},
			},
			{
				name:    "missing new_password",
				payload: map[string]string{"current_password": "oldpass"},
			},
			{
				name:    "empty body",
				payload: map[string]string{},
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				w := putJSON(env.router, "/api/account/change-password", jsonBody(t, tc.payload))
				assert.Equal(t, http.StatusBadRequest, w.Code)
			})
		}
	})

	t.Run("Unauthenticated", func(t *testing.T) {
		env := newAccountTestEnv(t)

		payload := map[string]string{
			"current_password": "password123",
			"new_password":     "newpass123",
		}

		w := putJSON(env.router, "/api/unauth/change-password", jsonBody(t, payload))
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}
