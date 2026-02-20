package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
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
	"golang.org/x/crypto/bcrypt"
)

type applicationTestContext struct {
	router   *gin.Engine
	userID   uuid.UUID
	jobID    uuid.UUID
	statusID uuid.UUID
	appID    uuid.UUID
}

func setupApplicationHandlerTest(t *testing.T) *applicationTestContext {
	gin.SetMode(gin.TestMode)

	db := testutil.NewTestDatabase(t)
	t.Cleanup(func() {
		db.Close(t)
	})
	db.RunMigrations(t)

	appState := &utils.AppState{
		DB:        db.Database,
		Sanitizer: services.NewSanitizerService(),
	}

	handler := NewApplicationHandler(appState)

	userRepo := repository.NewUserRepository(db.Database)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	testUser, err := userRepo.CreateUser("apphandlertest@example.com", "App Handler Test", string(hashedPassword))
	require.NoError(t, err)

	companyRepo := repository.NewCompanyRepository(db.Database)
	jobRepo := repository.NewJobRepository(db.Database)
	appRepo := repository.NewApplicationRepository(db.Database)

	testCompany := testutil.CreateTestCompany("Test Company", "testcompany.com")
	createdCompany, err := companyRepo.CreateCompany(testCompany)
	require.NoError(t, err)

	testJob := testutil.CreateTestJob(createdCompany.ID, "Test Job", "Test Description")
	createdJob, err := jobRepo.CreateJob(testUser.ID, testJob)
	require.NoError(t, err)

	var statusID uuid.UUID
	err = db.Get(&statusID, "SELECT id FROM application_status LIMIT 1")
	require.NoError(t, err)

	testApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
	createdApp, err := appRepo.CreateApplication(testUser.ID, testApp)
	require.NoError(t, err)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", testUser.ID)
		c.Next()
	})

	router.POST("/api/applications/quick-create", handler.QuickCreateApplication)
	router.GET("/api/applications/stats", handler.GetApplicationStats)
	router.GET("/api/applications/recent", handler.GetRecentApplications)
	router.GET("/api/application-statuses", handler.GetApplicationStatuses)
	router.GET("/api/applications", handler.GetApplications)
	router.POST("/api/applications", handler.CreateApplication)
	router.GET("/api/applications/:id", handler.GetApplication)
	router.PUT("/api/applications/:id", handler.UpdateApplication)
	router.PATCH("/api/applications/:id/status", handler.UpdateApplicationStatus)
	router.DELETE("/api/applications/:id", handler.DeleteApplication)

	return &applicationTestContext{
		router:   router,
		userID:   testUser.ID,
		jobID:    createdJob.ID,
		statusID: statusID,
		appID:    createdApp.ID,
	}
}

func TestApplicationHandler_QuickCreateApplication(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"company_name": "Quick Create Corp",
			"title":        "Software Engineer",
			"description":  "Building great products",
			"location":     "Remote",
			"job_type":     "full-time",
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/applications/quick-create", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotNil(t, data["application"])
		assert.NotNil(t, data["job"])
		assert.NotNil(t, data["company"])

		company := data["company"].(map[string]interface{})
		assert.Equal(t, "Quick Create Corp", company["name"])

		job := data["job"].(map[string]interface{})
		assert.Equal(t, "Software Engineer", job["title"])
	})

	t.Run("MissingCompanyName", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"title": "Software Engineer",
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/applications/quick-create", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("MissingTitle", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"company_name": "Some Corp",
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/applications/quick-create", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})
}

func TestApplicationHandler_GetApplications(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications", nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		applications := data["applications"].([]interface{})
		assert.GreaterOrEqual(t, len(applications), 1)
		assert.NotNil(t, data["total"])
		assert.NotNil(t, data["page"])
		assert.NotNil(t, data["limit"])
	})

	t.Run("WithPagination", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications?page=1&limit=5", nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, float64(1), data["page"])
		assert.Equal(t, float64(5), data["limit"])
	})

	t.Run("EmptyForNewUser", func(t *testing.T) {
		gin.SetMode(gin.TestMode)

		db := testutil.NewTestDatabase(t)
		t.Cleanup(func() { db.Close(t) })
		db.RunMigrations(t)

		appState := &utils.AppState{
			DB:        db.Database,
			Sanitizer: services.NewSanitizerService(),
		}
		handler := NewApplicationHandler(appState)

		userRepo := repository.NewUserRepository(db.Database)
		hashedPw, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		newUser, err := userRepo.CreateUser("emptyuser@example.com", "Empty User", string(hashedPw))
		require.NoError(t, err)

		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("user_id", newUser.ID)
			c.Next()
		})
		router.GET("/api/applications", handler.GetApplications)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, float64(0), data["total"])
	})
}

func TestApplicationHandler_GetApplication(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications/"+tc.appID.String(), nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, tc.appID.String(), data["id"])
	})

	t.Run("NotFound", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications/"+uuid.New().String(), nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("InvalidID", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications/not-a-uuid", nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})
}

func TestApplicationHandler_CreateApplication(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"job_id":                tc.jobID.String(),
			"application_status_id": tc.statusID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/applications", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotEmpty(t, data["id"])
		assert.Equal(t, tc.jobID.String(), data["job_id"])
	})

	t.Run("MissingJobID", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"application_status_id": tc.statusID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/applications", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})

	t.Run("MissingStatusID", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"job_id": tc.jobID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/applications", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})
}

func TestApplicationHandler_UpdateApplicationStatus(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"application_status_id": tc.statusID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PATCH", fmt.Sprintf("/api/applications/%s/status", tc.appID), bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, tc.appID.String(), data["id"])
	})

	t.Run("InvalidID", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"application_status_id": tc.statusID.String(),
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PATCH", "/api/applications/not-a-uuid/status", bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})
}

func TestApplicationHandler_DeleteApplication(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/applications/"+tc.appID.String(), nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, "Application deleted successfully", data["message"])
	})

	t.Run("NotFound", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/api/applications/"+uuid.New().String(), nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})
}

func TestApplicationHandler_GetApplicationStatuses(t *testing.T) {
	t.Run("ReturnsStatuses", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/application-statuses", nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		statuses := data["statuses"].([]interface{})
		assert.GreaterOrEqual(t, len(statuses), 1)
	})
}

func TestApplicationHandler_GetApplicationStats(t *testing.T) {
	t.Run("ReturnsStats", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications/stats", nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.NotNil(t, data["status_counts"])
	})
}

func TestApplicationHandler_GetRecentApplications(t *testing.T) {
	t.Run("ReturnsRecent", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications/recent", nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		applications := data["applications"].([]interface{})
		assert.GreaterOrEqual(t, len(applications), 1)
	})

	t.Run("RespectsLimitParam", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/applications/recent?limit=1", nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		applications := data["applications"].([]interface{})
		assert.LessOrEqual(t, len(applications), 1)
	})
}

func TestApplicationHandler_UpdateApplication(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"company_name": "Updated Corp",
			"title":        "Updated Title",
			"description":  "Updated description",
			"location":     "New York",
			"job_type":     "part-time",
			"notes":        "Updated notes",
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/applications/"+tc.appID.String(), bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		assert.Equal(t, tc.appID.String(), data["id"])
	})

	t.Run("NotFound", func(t *testing.T) {
		tc := setupApplicationHandlerTest(t)

		payload := map[string]interface{}{
			"company_name": "Updated Corp",
			"title":        "Updated Title",
		}
		jsonPayload, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/applications/"+uuid.New().String(), bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.False(t, resp["success"].(bool))
	})
}
