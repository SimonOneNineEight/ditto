package middleware

import (
	"ditto-backend/internal/testutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Tests for IP-based rate limiting (unauthenticated endpoints)

func TestRateLimitAuthIP_AllowsRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	router.POST("/login", RateLimitAuthIP(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("POST", "/login", nil)
	req.RemoteAddr = "192.168.1.100:12345"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "10", w.Header().Get("X-RateLimit-Limit"))
	assert.NotEmpty(t, w.Header().Get("X-RateLimit-Remaining"))
	assert.NotEmpty(t, w.Header().Get("X-RateLimit-Reset"))
}

func TestRateLimitAuthIP_BlocksAfterLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	router.POST("/login", RateLimitAuthIP(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	testIP := "10.0.0.1:12345"

	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("POST", "/login", nil)
		req.RemoteAddr = testIP
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	req := httptest.NewRequest("POST", "/login", nil)
	req.RemoteAddr = testIP
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
	assert.Contains(t, w.Body.String(), "Too many requests")
	assert.Contains(t, w.Body.String(), "RATE_LIMIT")
	assert.NotEmpty(t, w.Header().Get("Retry-After"))
}

func TestRateLimitAuthIP_DifferentIPsIndependent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	router.POST("/login", RateLimitAuthIP(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	ip1 := "172.16.0.1:12345"
	ip2 := "172.16.0.2:12345"

	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("POST", "/login", nil)
		req.RemoteAddr = ip1
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	req := httptest.NewRequest("POST", "/login", nil)
	req.RemoteAddr = ip1
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusTooManyRequests, w.Code)

	req = httptest.NewRequest("POST", "/login", nil)
	req.RemoteAddr = ip2
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

// Tests for user-based rate limiting (authenticated endpoints)

func setupTestRouter(t *testing.T) (*gin.Engine, *testutil.TestDatabase) {
	gin.SetMode(gin.TestMode)
	db := testutil.NewTestDatabase(t)
	db.RunMigrations(t)

	// Create rate_limits table if not exists (matches migration 000003)
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS rate_limits (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			resource VARCHAR(100) NOT NULL,
			request_count INT NOT NULL DEFAULT 0,
			window_start TIMESTAMP NOT NULL,
			window_end TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	require.NoError(t, err)

	// Create indexes
	_, _ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_rate_limits_user_resource_window ON rate_limits(user_id, resource, window_start, window_end)`)
	_, _ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end)`)

	router := gin.New()
	return router, db
}

func createTestUser(t *testing.T, db *testutil.TestDatabase, email string) uuid.UUID {
	userID := uuid.New()
	_, err := db.Exec(`
		INSERT INTO users (id, name, email, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id
		RETURNING id
	`, userID, "Test User", email)
	require.NoError(t, err)
	return userID
}

func cleanupTestRateLimits(t *testing.T, db *testutil.TestDatabase, userID uuid.UUID) {
	_, err := db.Exec("DELETE FROM rate_limits WHERE user_id = $1", userID)
	require.NoError(t, err)
}

func cleanupTestUser(t *testing.T, db *testutil.TestDatabase, userID uuid.UUID) {
	_, err := db.Exec("DELETE FROM users WHERE id = $1", userID)
	require.NoError(t, err)
}

func TestRateLimiter_Middleware_NoAuth(t *testing.T) {
	router, db := setupTestRouter(t)
	defer db.Close(t)

	limiter := NewRateLimiter(db.Database)

	router.GET("/test", limiter.Middleware("test_resource", 10), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "User not authenticated")
}

func TestRateLimiter_Middleware_Success(t *testing.T) {
	router, db := setupTestRouter(t)
	defer db.Close(t)

	userID := createTestUser(t, db, "middleware_test_success@example.com")
	defer cleanupTestRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	limiter := NewRateLimiter(db.Database)

	router.GET("/test", func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	}, limiter.Middleware("test_resource", 10), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "10", w.Header().Get("X-RateLimit-Limit"))
	assert.Equal(t, "9", w.Header().Get("X-RateLimit-Remaining"))
}

func TestRateLimiter_Middleware_LimitExceeded(t *testing.T) {
	router, db := setupTestRouter(t)
	defer db.Close(t)

	userID := createTestUser(t, db, "middleware_test_limit@example.com")
	defer cleanupTestRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	limiter := NewRateLimiter(db.Database)

	router.GET("/test", func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	}, limiter.Middleware("test_resource", 3), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Make requests up to the limit
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// This one should be rate limited
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
	assert.Contains(t, w.Body.String(), "Rate limit exceeded")
	assert.Contains(t, w.Body.String(), "RATE_LIMIT_EXCEEDED")
	assert.NotEmpty(t, w.Header().Get("Retry-After"))
	assert.NotEmpty(t, w.Header().Get("X-RateLimit-Reset"))
}

func TestRateLimiter_Middleware_MultipleUsers(t *testing.T) {
	router, db := setupTestRouter(t)
	defer db.Close(t)

	userID1 := createTestUser(t, db, "middleware_test_user1@example.com")
	userID2 := createTestUser(t, db, "middleware_test_user2@example.com")
	defer cleanupTestRateLimits(t, db, userID1)
	defer cleanupTestRateLimits(t, db, userID2)
	defer cleanupTestUser(t, db, userID1)
	defer cleanupTestUser(t, db, userID2)

	limiter := NewRateLimiter(db.Database)

	// Middleware that allows setting user_id via header for testing
	router.GET("/test", func(c *gin.Context) {
		userIDStr := c.GetHeader("X-Test-User-ID")
		if userIDStr != "" {
			userID, _ := uuid.Parse(userIDStr)
			c.Set("user_id", userID)
		}
		c.Next()
	}, limiter.Middleware("test_resource", 2), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// User 1 makes requests
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("X-Test-User-ID", userID1.String())
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// User 1 is now rate limited
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Test-User-ID", userID1.String())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusTooManyRequests, w.Code)

	// User 2 should still be allowed
	req = httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Test-User-ID", userID2.String())
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRateLimiter_Middleware_DifferentResources(t *testing.T) {
	router, db := setupTestRouter(t)
	defer db.Close(t)

	userID := createTestUser(t, db, "middleware_test_resources@example.com")
	defer cleanupTestRateLimits(t, db, userID)
	defer cleanupTestUser(t, db, userID)

	limiter := NewRateLimiter(db.Database)

	router.GET("/resource1", func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	}, limiter.Middleware("resource1", 2), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	router.GET("/resource2", func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	}, limiter.Middleware("resource2", 2), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Exhaust resource1
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest("GET", "/resource1", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// Resource1 should be limited
	req := httptest.NewRequest("GET", "/resource1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusTooManyRequests, w.Code)

	// Resource2 should still work
	req = httptest.NewRequest("GET", "/resource2", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}
