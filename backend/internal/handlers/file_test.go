package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/testutil"
	s3service "ditto-backend/internal/services/s3"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func setupFileHandlerTest(t *testing.T) (*gin.Engine, *repository.FileRepository, uuid.UUID, uuid.UUID, *s3service.S3Service) {
	gin.SetMode(gin.TestMode)

	// Setup test database
	db := testutil.NewTestDatabase(t)
	t.Cleanup(func() {
		db.Close(t)
	})
	db.RunMigrations(t)

	// Create test user
	userRepo := repository.NewUserRepository(db.Database)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	testUser, err := userRepo.CreateUser("filehandlertest@example.com", "File Handler Test", string(hashedPassword))
	require.NoError(t, err)

	// Create test company and job
	companyRepo := repository.NewCompanyRepository(db.Database)
	jobRepo := repository.NewJobRepository(db.Database)
	appRepo := repository.NewApplicationRepository(db.Database)

	testCompany := testutil.CreateTestCompany("Test Company", "test.com")
	createdCompany, err := companyRepo.CreateCompany(testCompany)
	require.NoError(t, err)

	testJob := testutil.CreateTestJob(createdCompany.ID, "Test Job", "Description")
	createdJob, err := jobRepo.CreateJob(testUser.ID, testJob)
	require.NoError(t, err)

	// Get status ID
	var statusID uuid.UUID
	err = db.Get(&statusID, "SELECT id FROM application_status LIMIT 1")
	require.NoError(t, err)

	// Create test application
	testApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
	createdApp, err := appRepo.CreateApplication(testUser.ID, testApp)
	require.NoError(t, err)

	// Setup handler with LocalStack S3
	fileRepo := repository.NewFileRepository(db.Database)

	// Configure S3 for LocalStack
	s3Cfg := s3service.Config{
		Region:          "us-east-1",
		Bucket:          "ditto-files-local",
		AccessKeyID:     "test",
		SecretAccessKey: "test",
		URLExpiry:       15 * time.Minute,
		Endpoint:        "http://localhost:4566",
	}
	s3Svc, err := s3service.NewS3Service(s3Cfg)
	require.NoError(t, err)

	handler := NewFileHandler(fileRepo, s3Svc)

	// Setup router
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", testUser.ID)
		c.Next()
	})

	router.POST("/api/files/presigned-upload", handler.GetPresignedUploadURL)
	router.POST("/api/files/confirm-upload", handler.ConfirmUpload)
	router.GET("/api/files/:id", handler.GetFile)
	router.DELETE("/api/files/:id", handler.DeleteFile)
	router.GET("/api/users/storage-stats", handler.GetStorageStats)

	return router, fileRepo, testUser.ID, createdApp.ID, s3Svc
}

func TestFileHandler_GetPresignedUploadURL(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		router, _, _, appID, _ := setupFileHandlerTest(t)

		payload := map[string]interface{}{
			"file_name":      "resume.pdf",
			"file_type":      "application/pdf",
			"file_size":      1024000,
			"application_id": appID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/files/presigned-upload", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))

		data := response["data"].(map[string]interface{})
		assert.NotEmpty(t, data["presigned_url"])
		assert.NotEmpty(t, data["s3_key"])
		assert.Equal(t, float64(900), data["expires_in"])
	})

	t.Run("UnsupportedFileType", func(t *testing.T) {
		router, _, _, appID, _ := setupFileHandlerTest(t)

		payload := map[string]interface{}{
			"file_name":      "virus.exe",
			"file_type":      "application/x-msdownload",
			"file_size":      1024000,
			"application_id": appID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/files/presigned-upload", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.False(t, response["success"].(bool))
	})

	t.Run("FileTooLarge", func(t *testing.T) {
		router, _, _, appID, _ := setupFileHandlerTest(t)

		payload := map[string]interface{}{
			"file_name":      "huge.pdf",
			"file_type":      "application/pdf",
			"file_size":      10 * 1024 * 1024, // 10MB
			"application_id": appID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/files/presigned-upload", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("MissingApplicationID", func(t *testing.T) {
		router, _, _, _, _ := setupFileHandlerTest(t)

		payload := map[string]interface{}{
			"file_name": "resume.pdf",
			"file_type": "application/pdf",
			"file_size": 1024000,
			// application_id missing
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/files/presigned-upload", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestFileHandler_ConfirmUpload(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test - requires LocalStack")
	}

	t.Run("FileNotInS3", func(t *testing.T) {
		router, _, userID, appID, _ := setupFileHandlerTest(t)

		// Use a non-existent S3 key
		s3Key := s3service.GenerateS3Key(userID, "nonexistent.pdf")

		payload := map[string]interface{}{
			"s3_key":         s3Key,
			"file_name":      "resume.pdf",
			"file_type":      "application/pdf",
			"file_size":      1024000,
			"application_id": appID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/files/confirm-upload", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestFileHandler_GetFile(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		router, fileRepo, userID, appID, _ := setupFileHandlerTest(t)

		// Create a file first
		file := &models.File{
			UserID:        userID,
			ApplicationID: appID,
			FileName:      "test.pdf",
			FileType:      "application/pdf",
			FileSize:      1024,
			S3Key:         s3service.GenerateS3Key(userID, "test.pdf"),
		}
		createdFile, err := fileRepo.CreateFile(file)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/files/"+createdFile.ID.String(), nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))

		data := response["data"].(map[string]interface{})
		assert.NotEmpty(t, data["presigned_url"])
		assert.Equal(t, "test.pdf", data["file_name"])
	})

	t.Run("NotFound", func(t *testing.T) {
		router, _, _, _, _ := setupFileHandlerTest(t)

		nonExistentID := uuid.New()

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/files/"+nonExistentID.String(), nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestFileHandler_DeleteFile(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		router, fileRepo, userID, appID, _ := setupFileHandlerTest(t)

		// Create a file first
		file := &models.File{
			UserID:        userID,
			ApplicationID: appID,
			FileName:      "to_delete.pdf",
			FileType:      "application/pdf",
			FileSize:      2048,
			S3Key:         s3service.GenerateS3Key(userID, "to_delete.pdf"),
		}
		createdFile, err := fileRepo.CreateFile(file)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/files/"+createdFile.ID.String(), nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))

		// Verify file is soft-deleted
		deletedFile, err := fileRepo.GetFileByID(createdFile.ID, userID)
		assert.Error(t, err)
		assert.Nil(t, deletedFile)
	})

	t.Run("NotFound", func(t *testing.T) {
		router, _, _, _, _ := setupFileHandlerTest(t)

		nonExistentID := uuid.New()

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/files/"+nonExistentID.String(), nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestFileHandler_GetStorageStats(t *testing.T) {
	t.Run("EmptyStorage", func(t *testing.T) {
		router, _, _, _, _ := setupFileHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/users/storage-stats", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))

		data := response["data"].(map[string]interface{})
		assert.Equal(t, float64(0), data["used_bytes"])
		assert.Equal(t, float64(104857600), data["total_bytes"]) // 100MB
		assert.Equal(t, float64(0), data["file_count"])
		assert.Equal(t, float64(0), data["usage_percentage"])
		assert.False(t, data["warning"].(bool))
		assert.False(t, data["limit_reached"].(bool))
	})

	t.Run("WithFiles", func(t *testing.T) {
		router, fileRepo, userID, appID, _ := setupFileHandlerTest(t)

		// Create a file
		file := &models.File{
			UserID:        userID,
			ApplicationID: appID,
			FileName:      "test.pdf",
			FileType:      "application/pdf",
			FileSize:      5000000, // 5MB
			S3Key:         s3service.GenerateS3Key(userID, "test.pdf"),
		}
		_, err := fileRepo.CreateFile(file)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/users/storage-stats", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))

		data := response["data"].(map[string]interface{})
		assert.Equal(t, float64(5000000), data["used_bytes"])
		assert.Equal(t, float64(1), data["file_count"])
		assert.Equal(t, float64(4), data["usage_percentage"]) // 5MB / 100MB = 4%
		assert.False(t, data["warning"].(bool))
		assert.False(t, data["limit_reached"].(bool))
	})
}
