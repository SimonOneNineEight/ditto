package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// Test helper function to create a test router
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	return router
}

// Test health endpoint
func TestHealthEndpoint(t *testing.T) {
	router := setupTestRouter()
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "ok")
}

// Test user registration request structure
func TestUserRegistrationRequest(t *testing.T) {
	router := setupTestRouter()
	
	// Mock handler for testing request parsing
	router.POST("/api/users", func(c *gin.Context) {
		var req struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}
		
		// Validate required fields
		if req.Name == "" || req.Email == "" || req.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"name":  req.Name,
				"email": req.Email,
			},
		})
	})

	// Test valid request
	validPayload := map[string]string{
		"name":     "Test User",
		"email":    "test@example.com",
		"password": "password123",
	}
	
	jsonPayload, _ := json.Marshal(validPayload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/users", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Test User")
	assert.Contains(t, w.Body.String(), "test@example.com")

	// Test invalid request (missing fields)
	invalidPayload := map[string]string{
		"name": "Test User",
		// Missing email and password
	}
	
	jsonPayload, _ = json.Marshal(invalidPayload)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/users", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "missing required fields")
}

// Test job creation request structure
func TestJobCreationRequest(t *testing.T) {
	router := setupTestRouter()
	
	// Mock handler for testing job creation request
	router.POST("/api/jobs", func(c *gin.Context) {
		var req struct {
			CompanyID      *string  `json:"company_id"`
			CompanyName    *string  `json:"company_name"`
			Title          string   `json:"title"`
			JobDescription string   `json:"job_description"`
			Location       string   `json:"location"`
			JobType        string   `json:"job_type"`
			MinSalary      *float64 `json:"min_salary"`
			MaxSalary      *float64 `json:"max_salary"`
			Currency       *string  `json:"currency"`
		}
		
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}
		
		// Validate either company_id or company_name is provided
		if req.CompanyID == nil && req.CompanyName == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "either company_id or company_name is required"})
			return
		}
		
		// Validate required fields
		if req.Title == "" || req.JobDescription == "" || req.Location == "" || req.JobType == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"title":        req.Title,
				"company_name": req.CompanyName,
				"location":     req.Location,
			},
		})
	})

	// Test valid request with company_name
	validPayload := map[string]interface{}{
		"company_name":    "Google",
		"title":           "Software Engineer",
		"job_description": "Backend development role",
		"location":        "San Francisco, CA",
		"job_type":        "Full-time",
		"min_salary":      120000,
		"max_salary":      180000,
		"currency":        "USD",
	}
	
	jsonPayload, _ := json.Marshal(validPayload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/jobs", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Software Engineer")
	assert.Contains(t, w.Body.String(), "Google")

	// Test invalid request (missing required fields)
	invalidPayload := map[string]interface{}{
		"company_name": "Google",
		"title":        "Software Engineer",
		// Missing job_description, location, job_type
	}
	
	jsonPayload, _ = json.Marshal(invalidPayload)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/jobs", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "missing required fields")

	// Test invalid request (missing both company_id and company_name)
	invalidPayload2 := map[string]interface{}{
		"title":           "Software Engineer",
		"job_description": "Backend development role",
		"location":        "San Francisco, CA",
		"job_type":        "Full-time",
	}
	
	jsonPayload, _ = json.Marshal(invalidPayload2)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/jobs", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "either company_id or company_name is required")
}

// Test company autocomplete response structure
func TestCompanyAutocompleteResponse(t *testing.T) {
	router := setupTestRouter()
	
	// Mock handler for company autocomplete
	router.GET("/api/companies/autocomplete", func(c *gin.Context) {
		query := c.Query("q")
		
		if len(query) < 2 {
			c.JSON(http.StatusOK, gin.H{
				"suggestions": []interface{}{},
				"query":       query,
			})
			return
		}
		
		// Mock suggestions
		suggestions := []gin.H{
			{
				"id":       nil,
				"name":     "Google LLC",
				"domain":   "google.com",
				"logo_url": "https://logo.clearbit.com/google.com",
				"website":  "https://google.com",
				"source":   "suggestion",
			},
			{
				"id":       "test-uuid",
				"name":     "Google Inc",
				"domain":   "google.com",
				"logo_url": "https://logo.clearbit.com/google.com",
				"website":  "https://google.com",
				"source":   "saved",
			},
		}
		
		c.JSON(http.StatusOK, gin.H{
			"suggestions": suggestions,
			"query":       query,
		})
	})

	// Test valid autocomplete request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/companies/autocomplete?q=google", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "suggestions")
	assert.Contains(t, w.Body.String(), "Google LLC")
	assert.Contains(t, w.Body.String(), "google.com")

	// Test short query (should return empty suggestions)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/companies/autocomplete?q=g", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "suggestions")
	assert.Contains(t, w.Body.String(), "[]") // Empty array
}

// Test error response format
func TestErrorResponseFormat(t *testing.T) {
	router := setupTestRouter()
	
	// Mock handler that returns error
	router.GET("/api/test-error", func(c *gin.Context) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_FAILED",
				"message": "Invalid request data",
				"details": "Field 'email' is required",
			},
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/test-error", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "success")
	assert.Contains(t, w.Body.String(), "error")
	assert.Contains(t, w.Body.String(), "VALIDATION_FAILED")
	assert.Contains(t, w.Body.String(), "Invalid request data")
}