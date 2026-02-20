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
	"ditto-backend/internal/services"
	"ditto-backend/internal/testutil"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

type interviewTestContext struct {
	router        *gin.Engine
	userID        uuid.UUID
	applicationID uuid.UUID
	db            *testutil.TestDatabase
}

func setupInterviewHandlerTest(t *testing.T) *interviewTestContext {
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
	handler := NewInterviewHandler(appState)

	userRepo := repository.NewUserRepository(db.Database)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	testUser, err := userRepo.CreateUser("interviewtest@example.com", "Interview Test User", string(hashedPassword))
	require.NoError(t, err)

	companyRepo := repository.NewCompanyRepository(db.Database)
	jobRepo := repository.NewJobRepository(db.Database)
	appRepo := repository.NewApplicationRepository(db.Database)

	testCompany := testutil.CreateTestCompany("Interview Test Co", "interviewtest.com")
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

	router.POST("/api/interviews", handler.CreateInterview)
	router.GET("/api/interviews", handler.ListInterviews)
	router.GET("/api/interviews/:id", handler.GetInterviewByID)
	router.GET("/api/interviews/:id/details", handler.GetInterviewWithDetails)
	router.PUT("/api/interviews/:id", handler.UpdateInterview)
	router.DELETE("/api/interviews/:id", handler.DeleteInterview)

	return &interviewTestContext{
		router:        router,
		userID:        testUser.ID,
		applicationID: createdApp.ID,
		db:            db,
	}
}

func createInterviewViaAPI(t *testing.T, tc *interviewTestContext, interviewType string) map[string]interface{} {
	payload := map[string]interface{}{
		"application_id": tc.applicationID.String(),
		"interview_type": interviewType,
		"scheduled_date": time.Now().AddDate(0, 0, 7).Format("2006-01-02"),
	}
	jsonPayload, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/interviews", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	tc.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	data := resp["data"].(map[string]interface{})
	return data["interview"].(map[string]interface{})
}

func TestInterviewHandler(t *testing.T) {
	tc := setupInterviewHandlerTest(t)

	t.Run("ListInterviewsEmpty", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/interviews", nil)
		tc.router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.True(t, resp["success"].(bool))

		data := resp["data"].(map[string]interface{})
		// nil slice serializes as JSON null
		if data["interviews"] != nil {
			interviews := data["interviews"].([]interface{})
			assert.Len(t, interviews, 0)
		}
	})

	t.Run("CreateInterview", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			scheduledTime := "14:00"
			duration := 60
			payload := map[string]interface{}{
				"application_id":   tc.applicationID.String(),
				"interview_type":   "technical",
				"scheduled_date":   "2025-06-15",
				"scheduled_time":   scheduledTime,
				"duration_minutes": duration,
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/interviews", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			interview := data["interview"].(map[string]interface{})
			assert.Equal(t, tc.applicationID.String(), interview["application_id"])
			assert.Equal(t, "technical", interview["interview_type"])
			assert.NotEmpty(t, interview["id"])
		})

		t.Run("MissingApplicationID", func(t *testing.T) {
			payload := map[string]interface{}{
				"interview_type": "technical",
				"scheduled_date": "2025-06-15",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/interviews", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.False(t, resp["success"].(bool))
		})

		t.Run("InvalidInterviewType", func(t *testing.T) {
			payload := map[string]interface{}{
				"application_id": tc.applicationID.String(),
				"interview_type": "invalid_type",
				"scheduled_date": "2025-06-15",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/interviews", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.False(t, resp["success"].(bool))
		})

		t.Run("InvalidDateFormat", func(t *testing.T) {
			payload := map[string]interface{}{
				"application_id": tc.applicationID.String(),
				"interview_type": "technical",
				"scheduled_date": "15/06/2025",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/interviews", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.False(t, resp["success"].(bool))
		})

		t.Run("NonexistentApplication", func(t *testing.T) {
			payload := map[string]interface{}{
				"application_id": uuid.New().String(),
				"interview_type": "technical",
				"scheduled_date": "2025-06-15",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/interviews", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.False(t, resp["success"].(bool))
		})

		t.Run("MissingScheduledDate", func(t *testing.T) {
			payload := map[string]interface{}{
				"application_id": tc.applicationID.String(),
				"interview_type": "technical",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/interviews", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})

		t.Run("AutoIncrementRoundNumber", func(t *testing.T) {
			first := createInterviewViaAPI(t, tc, "phone_screen")
			second := createInterviewViaAPI(t, tc, "behavioral")

			firstRound := first["round_number"].(float64)
			secondRound := second["round_number"].(float64)
			assert.Equal(t, firstRound+1, secondRound)
		})
	})

	t.Run("ListInterviews", func(t *testing.T) {
		t.Run("ReturnsInterviews", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			interviews := data["interviews"].([]interface{})
			assert.NotEmpty(t, interviews)
		})

		t.Run("WithPagination", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews?page=1&limit=2", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)

			data := resp["data"].(map[string]interface{})
			interviews := data["interviews"].([]interface{})
			assert.LessOrEqual(t, len(interviews), 2)

			meta := data["meta"].(map[string]interface{})
			assert.Equal(t, float64(1), meta["page"])
			assert.Equal(t, float64(2), meta["limit"])
			assert.NotZero(t, meta["total_items"])
			assert.NotZero(t, meta["total_pages"])
		})

		t.Run("WithFilterUpcoming", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews?filter=upcoming", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))
		})
	})

	t.Run("GetInterviewByID", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "panel")
			interviewID := created["id"].(string)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews/"+interviewID, nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			interview := data["interview"].(map[string]interface{})
			assert.Equal(t, interviewID, interview["id"])
			assert.Equal(t, "panel", interview["interview_type"])

			application := data["application"].(map[string]interface{})
			assert.Equal(t, "Interview Test Co", application["company_name"])
			assert.Equal(t, "Software Engineer", application["job_title"])
		})

		t.Run("NotFound", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews/"+uuid.New().String(), nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.False(t, resp["success"].(bool))
		})

		t.Run("InvalidID", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews/not-a-uuid", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.False(t, resp["success"].(bool))
		})
	})

	t.Run("UpdateInterview", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "phone_screen")
			interviewID := created["id"].(string)

			newDate := "2025-07-20"
			newTime := "10:00"
			newDuration := 90
			newType := "technical"
			newOutcome := "passed"
			newFeeling := "good"
			newWentWell := "Great technical discussion"
			newCouldImprove := "Could have explained algorithms better"
			newConfidence := 4

			payload := map[string]interface{}{
				"scheduled_date":   newDate,
				"scheduled_time":   newTime,
				"duration_minutes": newDuration,
				"interview_type":   newType,
				"outcome":          newOutcome,
				"overall_feeling":  newFeeling,
				"went_well":        newWentWell,
				"could_improve":    newCouldImprove,
				"confidence_level": newConfidence,
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/interviews/"+interviewID, bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			interview := data["interview"].(map[string]interface{})
			assert.Equal(t, "technical", interview["interview_type"])
			assert.Equal(t, newTime, interview["scheduled_time"])
			assert.Equal(t, float64(newDuration), interview["duration_minutes"])
			assert.Equal(t, newOutcome, interview["outcome"])
			assert.Equal(t, newFeeling, interview["overall_feeling"])
			assert.Equal(t, float64(newConfidence), interview["confidence_level"])
		})

		t.Run("PartialUpdate", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "phone_screen")
			interviewID := created["id"].(string)

			payload := map[string]interface{}{
				"outcome": "passed",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/interviews/"+interviewID, bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})
			interview := data["interview"].(map[string]interface{})
			assert.Equal(t, "passed", interview["outcome"])
			assert.Equal(t, "phone_screen", interview["interview_type"])
		})

		t.Run("InvalidID", func(t *testing.T) {
			payload := map[string]interface{}{
				"outcome": "passed",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/interviews/not-a-uuid", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})

		t.Run("NotFound", func(t *testing.T) {
			payload := map[string]interface{}{
				"outcome": "passed",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/interviews/"+uuid.New().String(), bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})

		t.Run("InvalidInterviewType", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "phone_screen")
			interviewID := created["id"].(string)

			payload := map[string]interface{}{
				"interview_type": "invalid_type",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/interviews/"+interviewID, bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})

		t.Run("InvalidOverallFeeling", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "phone_screen")
			interviewID := created["id"].(string)

			payload := map[string]interface{}{
				"overall_feeling": "terrible",
			}
			jsonPayload, _ := json.Marshal(payload)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/interviews/"+interviewID, bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	})

	t.Run("DeleteInterview", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "onsite")
			interviewID := created["id"].(string)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/api/interviews/"+interviewID, nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNoContent, w.Code)

			w = httptest.NewRecorder()
			req, _ = http.NewRequest("GET", "/api/interviews/"+interviewID, nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})

		t.Run("NotFound", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/api/interviews/"+uuid.New().String(), nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})

		t.Run("InvalidID", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/api/interviews/not-a-uuid", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})

		t.Run("AlreadyDeleted", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "other")
			interviewID := created["id"].(string)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/api/interviews/"+interviewID, nil)
			tc.router.ServeHTTP(w, req)
			assert.Equal(t, http.StatusNoContent, w.Code)

			w = httptest.NewRecorder()
			req, _ = http.NewRequest("DELETE", "/api/interviews/"+interviewID, nil)
			tc.router.ServeHTTP(w, req)
			assert.Equal(t, http.StatusNotFound, w.Code)
		})
	})

	t.Run("GetInterviewWithDetails", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "technical")
			interviewID := created["id"].(string)
			parsedInterviewID, err := uuid.Parse(interviewID)
			require.NoError(t, err)

			interviewerRepo := repository.NewInterviewerRepository(tc.db.Database)
			_, err = interviewerRepo.CreateInterviewer(&models.Interviewer{
				InterviewID: parsedInterviewID,
				Name:        "Jane Smith",
				Role:        testutil.StringPtr("Engineering Manager"),
			})
			require.NoError(t, err)

			questionRepo := repository.NewInterviewQuestionRepository(tc.db.Database)
			_, err = questionRepo.CreateInterviewQuestion(&models.InterviewQuestion{
				InterviewID:  parsedInterviewID,
				QuestionText: "Describe your experience with Go",
				Order:        0,
			})
			require.NoError(t, err)

			noteRepo := repository.NewInterviewNoteRepository(tc.db.Database)
			feedbackContent := "Candidate showed strong technical skills"
			_, err = noteRepo.CreateInterviewNote(&models.InterviewNote{
				InterviewID: parsedInterviewID,
				NoteType:    "feedback",
				Content:     &feedbackContent,
			})
			require.NoError(t, err)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews/"+interviewID+"/details", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})

			interview := data["interview"].(map[string]interface{})
			assert.Equal(t, interviewID, interview["id"])

			application := data["application"].(map[string]interface{})
			assert.Equal(t, "Interview Test Co", application["company_name"])
			assert.Equal(t, "Software Engineer", application["job_title"])

			interviewers := data["interviewers"].([]interface{})
			assert.Len(t, interviewers, 1)
			interviewer := interviewers[0].(map[string]interface{})
			assert.Equal(t, "Jane Smith", interviewer["name"])

			questions := data["questions"].([]interface{})
			assert.Len(t, questions, 1)
			question := questions[0].(map[string]interface{})
			assert.Equal(t, "Describe your experience with Go", question["question_text"])

			notes := data["notes"].([]interface{})
			assert.Len(t, notes, 1)
			note := notes[0].(map[string]interface{})
			assert.Equal(t, "feedback", note["note_type"])
			assert.Equal(t, feedbackContent, note["content"])
		})

		t.Run("EmptyDetails", func(t *testing.T) {
			created := createInterviewViaAPI(t, tc, "behavioral")
			interviewID := created["id"].(string)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews/"+interviewID+"/details", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			require.NoError(t, err)
			assert.True(t, resp["success"].(bool))

			data := resp["data"].(map[string]interface{})

			interviewers := data["interviewers"].([]interface{})
			assert.Len(t, interviewers, 0)

			questions := data["questions"].([]interface{})
			assert.Len(t, questions, 0)

			notes := data["notes"].([]interface{})
			assert.Len(t, notes, 0)
		})

		t.Run("NotFound", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews/"+uuid.New().String()+"/details", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)
		})

		t.Run("InvalidID", func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/interviews/not-a-uuid/details", nil)
			tc.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	})
}

