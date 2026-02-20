package handlers

import (
	"bytes"
	"encoding/json"
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

type assessmentTestEnv struct {
	router *gin.Engine
	userID uuid.UUID
	appID  uuid.UUID
}

func setupAssessmentTestEnv(t *testing.T) *assessmentTestEnv {
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

	handler := NewAssessmentHandler(appState)

	userRepo := repository.NewUserRepository(db.Database)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	testUser, err := userRepo.CreateUser("assessmenttest@example.com", "Assessment Test User", string(hashedPassword))
	require.NoError(t, err)

	companyRepo := repository.NewCompanyRepository(db.Database)
	jobRepo := repository.NewJobRepository(db.Database)
	appRepo := repository.NewApplicationRepository(db.Database)

	testCompany := testutil.CreateTestCompany("Test Company", "testco.com")
	createdCompany, err := companyRepo.CreateCompany(testCompany)
	require.NoError(t, err)

	testJob := testutil.CreateTestJob(createdCompany.ID, "Software Engineer", "Build things")
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

	router.POST("/api/assessments", handler.CreateAssessment)
	router.GET("/api/assessments", handler.ListAssessments)
	router.GET("/api/assessments/:id", handler.GetAssessment)
	router.GET("/api/assessments/:id/details", handler.GetAssessmentDetails)
	router.PUT("/api/assessments/:id", handler.UpdateAssessment)
	router.PATCH("/api/assessments/:id/status", handler.UpdateStatus)
	router.DELETE("/api/assessments/:id", handler.DeleteAssessment)
	router.POST("/api/assessments/:id/submissions", handler.CreateSubmission)
	router.DELETE("/api/assessment-submissions/:submissionId", handler.DeleteSubmission)

	return &assessmentTestEnv{
		router: router,
		userID: testUser.ID,
		appID:  createdApp.ID,
	}
}

func (env *assessmentTestEnv) createAssessment(t *testing.T) map[string]interface{} {
	payload := map[string]interface{}{
		"application_id":  env.appID.String(),
		"assessment_type": "take_home_project",
		"title":           "Backend API Project",
		"due_date":        "2026-03-15",
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/assessments", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	env.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	data := resp["data"].(map[string]interface{})
	return data["assessment"].(map[string]interface{})
}

func (env *assessmentTestEnv) createSubmission(t *testing.T, assessmentID string) map[string]interface{} {
	payload := map[string]interface{}{
		"submission_type": "github",
		"github_url":     "https://github.com/user/repo",
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/assessments/"+assessmentID+"/submissions", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	env.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	data := resp["data"].(map[string]interface{})
	return data["submission"].(map[string]interface{})
}

func TestAssessmentHandler(t *testing.T) {
	env := setupAssessmentTestEnv(t)

	t.Run("CreateAssessment", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			payload := map[string]interface{}{
				"application_id":  env.appID.String(),
				"assessment_type": "take_home_project",
				"title":           "Backend API Project",
				"due_date":        "2026-03-15",
				"instructions":    "Build a REST API",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			assessment := data["assessment"].(map[string]interface{})
			assert.Equal(t, "Backend API Project", assessment["title"])
			assert.Equal(t, "take_home_project", assessment["assessment_type"])
			assert.Equal(t, "2026-03-15", assessment["due_date"])
			assert.Equal(t, "not_started", assessment["status"])
			assert.NotEmpty(t, assessment["id"])
		})

		t.Run("MissingTitle", func(t *testing.T) {
			payload := map[string]interface{}{
				"application_id":  env.appID.String(),
				"assessment_type": "take_home_project",
				"due_date":        "2026-03-15",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.False(t, resp["success"].(bool))
		})

		t.Run("InvalidType", func(t *testing.T) {
			payload := map[string]interface{}{
				"application_id":  env.appID.String(),
				"assessment_type": "invalid_type",
				"title":           "Some Assessment",
				"due_date":        "2026-03-15",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})

		t.Run("InvalidDueDate", func(t *testing.T) {
			payload := map[string]interface{}{
				"application_id":  env.appID.String(),
				"assessment_type": "take_home_project",
				"title":           "Some Assessment",
				"due_date":        "not-a-date",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	})

	t.Run("GetAssessment", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments/"+assessmentID, nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			assessment := data["assessment"].(map[string]interface{})
			assert.Equal(t, assessmentID, assessment["id"])
			assert.Equal(t, "Backend API Project", assessment["title"])
		})

		t.Run("NotFound", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments/"+uuid.New().String(), nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})

		t.Run("InvalidID", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments/not-a-uuid", nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	})

	t.Run("ListAssessments", func(t *testing.T) {
		t.Run("WithApplicationID", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments?application_id="+env.appID.String(), nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			assessments := data["assessments"].([]interface{})
			assert.GreaterOrEqual(t, len(assessments), 1)
		})

		t.Run("WithoutApplicationID", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments", nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			assessments := data["assessments"].([]interface{})
			assert.GreaterOrEqual(t, len(assessments), 1)

			first := assessments[0].(map[string]interface{})
			assert.Equal(t, "Test Company", first["company_name"])
			assert.Equal(t, "Software Engineer", first["job_title"])
		})

		t.Run("InvalidApplicationID", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments?application_id=not-a-uuid", nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	})

	t.Run("UpdateAssessment", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"title":        "Updated Title",
				"instructions": "New instructions",
				"due_date":     "2026-04-01",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/assessments/"+assessmentID, bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			assessment := data["assessment"].(map[string]interface{})
			assert.Equal(t, "Updated Title", assessment["title"])
			assert.Equal(t, "2026-04-01", assessment["due_date"])
		})

		t.Run("PartialUpdate", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"title": "Only Title Changed",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/assessments/"+assessmentID, bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)

			data := resp["data"].(map[string]interface{})
			assessment := data["assessment"].(map[string]interface{})
			assert.Equal(t, "Only Title Changed", assessment["title"])
			assert.Equal(t, "2026-03-15", assessment["due_date"])
			assert.Equal(t, "take_home_project", assessment["assessment_type"])
		})

		t.Run("NotFound", func(t *testing.T) {
			payload := map[string]interface{}{
				"title": "Nope",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/assessments/"+uuid.New().String(), bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})
	})

	t.Run("UpdateStatus", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"status": "in_progress",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PATCH", "/api/assessments/"+assessmentID+"/status", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			assessment := data["assessment"].(map[string]interface{})
			assert.Equal(t, "in_progress", assessment["status"])
		})

		t.Run("InvalidStatus", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"status": "bogus_status",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PATCH", "/api/assessments/"+assessmentID+"/status", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	})

	t.Run("DeleteAssessment", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/api/assessments/"+assessmentID, nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNoContent, w.Code)

			w = httptest.NewRecorder()
			req, _ = http.NewRequest("GET", "/api/assessments/"+assessmentID, nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})

		t.Run("NotFound", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/api/assessments/"+uuid.New().String(), nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})
	})

	t.Run("CreateSubmission", func(t *testing.T) {
		t.Run("GithubSubmission", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"submission_type": "github",
				"github_url":     "https://github.com/user/repo",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments/"+assessmentID+"/submissions", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusCreated, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			submission := data["submission"].(map[string]interface{})
			assert.Equal(t, "github", submission["submission_type"])
			assert.Equal(t, "https://github.com/user/repo", submission["github_url"])
		})

		t.Run("NotesSubmission", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"submission_type": "notes",
				"notes":           "Completed the project using Go and PostgreSQL.",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments/"+assessmentID+"/submissions", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusCreated, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)

			data := resp["data"].(map[string]interface{})
			submission := data["submission"].(map[string]interface{})
			assert.Equal(t, "notes", submission["submission_type"])
			assert.Contains(t, submission["notes"], "Go and PostgreSQL")
		})

		t.Run("MissingGithubURL", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"submission_type": "github",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments/"+assessmentID+"/submissions", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})

		t.Run("MissingNotes", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"submission_type": "notes",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments/"+assessmentID+"/submissions", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})

		t.Run("InvalidGithubURL", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			payload := map[string]interface{}{
				"submission_type": "github",
				"github_url":     "not-a-url",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/assessments/"+assessmentID+"/submissions", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	})

	t.Run("DeleteSubmission", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)
			submission := env.createSubmission(t, assessmentID)
			submissionID := submission["id"].(string)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/api/assessment-submissions/"+submissionID, nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNoContent, w.Code)
		})

		t.Run("NotFound", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/api/assessment-submissions/"+uuid.New().String(), nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})
	})

	t.Run("GetAssessmentDetails", func(t *testing.T) {
		t.Run("WithSubmissions", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)
			env.createSubmission(t, assessmentID)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments/"+assessmentID+"/details", nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			assessment := data["assessment"].(map[string]interface{})
			assert.Equal(t, assessmentID, assessment["id"])

			submissions := data["submissions"].([]interface{})
			assert.Len(t, submissions, 1)
		})

		t.Run("NoSubmissions", func(t *testing.T) {
			created := env.createAssessment(t)
			assessmentID := created["id"].(string)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments/"+assessmentID+"/details", nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)

			data := resp["data"].(map[string]interface{})
			submissions := data["submissions"].([]interface{})
			assert.Len(t, submissions, 0)
		})

		t.Run("NotFound", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/assessments/"+uuid.New().String()+"/details", nil)
			env.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})
	})
}
