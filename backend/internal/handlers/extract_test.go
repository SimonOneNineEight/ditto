package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"ditto-backend/internal/services/urlextractor"
	"ditto-backend/pkg/errors"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// mockExtractor is a mock implementation of the Extractor interface for testing
type mockExtractor struct {
	extractFunc func(ctx context.Context, urlStr string) (*urlextractor.ExtractedJobData, []string, error)
}

func (m *mockExtractor) Extract(ctx context.Context, urlStr string) (*urlextractor.ExtractedJobData, []string, error) {
	return m.extractFunc(ctx, urlStr)
}

func TestExtractHandler_ExtractJobURL_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockData := &urlextractor.ExtractedJobData{
		Title:       "Software Engineer",
		Company:     "Tech Company",
		Location:    "San Francisco, CA",
		Description: "Great job opportunity",
		Platform:    "linkedin",
	}

	handler := &ExtractHandler{
		extractor: &mockExtractor{
			extractFunc: func(ctx context.Context, urlStr string) (*urlextractor.ExtractedJobData, []string, error) {
				return mockData, nil, nil
			},
		},
		logger: log.New(io.Discard, "", 0),
	}

	router := gin.New()
	router.POST("/extract", handler.ExtractJobURL)

	payload := map[string]string{
		"url": "https://www.linkedin.com/jobs/view/123",
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/extract", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.True(t, response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(t, "Software Engineer", data["title"])
	assert.Equal(t, "Tech Company", data["company"])
	assert.Equal(t, "San Francisco, CA", data["location"])
	assert.Equal(t, "linkedin", data["platform"])
}

func TestExtractHandler_ExtractJobURL_WithWarnings(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockData := &urlextractor.ExtractedJobData{
		Title:       "Software Engineer",
		Company:     "Tech Company",
		Location:    "",
		Description: "Great job opportunity",
		Platform:    "indeed",
	}
	warnings := []string{"Could not extract location"}

	handler := &ExtractHandler{
		extractor: &mockExtractor{
			extractFunc: func(ctx context.Context, urlStr string) (*urlextractor.ExtractedJobData, []string, error) {
				return mockData, warnings, nil
			},
		},
		logger: log.New(io.Discard, "", 0),
	}

	router := gin.New()
	router.POST("/extract", handler.ExtractJobURL)

	payload := map[string]string{
		"url": "https://www.indeed.com/viewjob?jk=123",
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/extract", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.True(t, response["success"].(bool))
	assert.Contains(t, response, "warnings")
	warningsArray := response["warnings"].([]interface{})
	assert.Equal(t, 1, len(warningsArray))
	assert.Equal(t, "Could not extract location", warningsArray[0])
}

func TestExtractHandler_ExtractJobURL_InvalidRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewExtractHandler(log.New(io.Discard, "", 0))

	router := gin.New()
	router.POST("/extract", handler.ExtractJobURL)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/extract", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.False(t, response["success"].(bool))
	assert.Contains(t, response, "error")
}

func TestExtractHandler_ExtractJobURL_UnsupportedPlatform(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := &ExtractHandler{
		extractor: &mockExtractor{
			extractFunc: func(ctx context.Context, urlStr string) (*urlextractor.ExtractedJobData, []string, error) {
				return nil, nil, errors.NewUnsupportedPlatform("monster.com")
			},
		},
		logger: log.New(io.Discard, "", 0),
	}

	router := gin.New()
	router.POST("/extract", handler.ExtractJobURL)

	payload := map[string]string{
		"url": "https://www.monster.com/jobs/123",
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/extract", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.False(t, response["success"].(bool))
	errorData := response["error"].(map[string]interface{})
	assert.Contains(t, errorData["error"], "not supported")
}

func TestExtractHandler_ExtractJobURL_EmptyURL(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewExtractHandler(log.New(io.Discard, "", 0))

	router := gin.New()
	router.POST("/extract", handler.ExtractJobURL)

	payload := map[string]string{
		"url": "",
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/extract", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.False(t, response["success"].(bool))
}
