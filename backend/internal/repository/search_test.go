package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/testutil"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestSearchRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	assessmentRepo := NewAssessmentRepository(db.Database)
	interviewRepo := NewInterviewRepository(db.Database)
	noteRepo := NewInterviewNoteRepository(db.Database)
	questionRepo := NewInterviewQuestionRepository(db.Database)
	searchRepo := NewSearchRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	userA, err := userRepo.CreateUser("search-usera@example.com", "Search User A", string(hashedPassword))
	require.NoError(t, err)

	userB, err := userRepo.CreateUser("search-userb@example.com", "Search User B", string(hashedPassword))
	require.NoError(t, err)

	companyA := testutil.CreateTestCompany("TechCorp Engineering", "techcorp-eng.com")
	createdCompanyA, err := companyRepo.CreateCompany(companyA)
	require.NoError(t, err)

	companyB := testutil.CreateTestCompany("Moonlight Analytics", "moonlight-analytics.com")
	createdCompanyB, err := companyRepo.CreateCompany(companyB)
	require.NoError(t, err)

	jobA := testutil.CreateTestJob(createdCompanyA.ID, "Senior Software Engineer", "Building distributed systems")
	createdJobA, err := jobRepo.CreateJob(userA.ID, jobA)
	require.NoError(t, err)

	jobB := testutil.CreateTestJob(createdCompanyB.ID, "Data Scientist", "Machine learning research")
	createdJobB, err := jobRepo.CreateJob(userB.ID, jobB)
	require.NoError(t, err)

	var statusID uuid.UUID
	err = db.Get(&statusID, "SELECT id FROM application_status LIMIT 1")
	require.NoError(t, err)

	appA := testutil.CreateTestApplication(userA.ID, createdJobA.ID, statusID)
	appA.Notes = testutil.StringPtr("Interested in their distributed computing platform and microservices architecture")
	createdAppA, err := applicationRepo.CreateApplication(userA.ID, appA)
	require.NoError(t, err)

	appB := testutil.CreateTestApplication(userB.ID, createdJobB.ID, statusID)
	appB.Notes = testutil.StringPtr("Excited about their machine learning pipeline")
	_, err = applicationRepo.CreateApplication(userB.ID, appB)
	require.NoError(t, err)

	assessmentA := &models.Assessment{
		UserID:         userA.ID,
		ApplicationID:  createdAppA.ID,
		AssessmentType: models.AssessmentTypeTakeHomeProject,
		Title:          "Distributed Systems Architecture Challenge",
		DueDate:        "2026-04-01",
		Instructions:   testutil.StringPtr("Design a fault tolerant message queue with replication"),
	}
	createdAssessmentA, err := assessmentRepo.CreateAssessment(assessmentA)
	require.NoError(t, err)
	require.NotNil(t, createdAssessmentA)

	interviewA := testutil.CreateTestInterview(userA.ID, createdAppA.ID, time.Now().AddDate(0, 0, 7), models.InterviewTypeTechnical)
	createdInterviewA, err := interviewRepo.CreateInterview(interviewA)
	require.NoError(t, err)

	noteA := &models.InterviewNote{
		InterviewID: createdInterviewA.ID,
		NoteType:    models.NoteTypePreparation,
		Content:     testutil.StringPtr("Review concurrency patterns and goroutine scheduling strategies"),
	}
	_, err = noteRepo.CreateInterviewNote(noteA)
	require.NoError(t, err)

	questionA := &models.InterviewQuestion{
		InterviewID:  createdInterviewA.ID,
		QuestionText: "Explain the difference between optimistic and pessimistic locking",
		AnswerText:   testutil.StringPtr("Optimistic locking uses version checks while pessimistic locking acquires exclusive access"),
		Order:        0,
	}
	_, err = questionRepo.CreateInterviewQuestion(questionA)
	require.NoError(t, err)

	t.Run("SearchApplicationsByCompanyName", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "TechCorp", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Applications)
		assert.Equal(t, "TechCorp", result.Query)

		found := false
		for _, app := range result.Applications {
			if app.ID == createdAppA.ID {
				found = true
				assert.Equal(t, "application", app.Type)
				assert.Contains(t, app.CompanyName, "TechCorp")
				assert.NotEmpty(t, app.Link)
				break
			}
		}
		assert.True(t, found, "expected to find application by company name")
	})

	t.Run("SearchApplicationsByJobTitle", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "Software Engineer", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Applications)

		found := false
		for _, app := range result.Applications {
			if app.ID == createdAppA.ID {
				found = true
				break
			}
		}
		assert.True(t, found, "expected to find application by job title")
	})

	t.Run("SearchApplicationsByNotes", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "microservices", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Applications)
	})

	t.Run("SearchAssessmentsByTitle", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "Distributed Systems", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Assessments)

		found := false
		for _, a := range result.Assessments {
			if a.ID == createdAssessmentA.ID {
				found = true
				assert.Equal(t, "assessment", a.Type)
				assert.NotEmpty(t, a.Link)
				break
			}
		}
		assert.True(t, found, "expected to find assessment by title")
	})

	t.Run("SearchAssessmentsByInstructions", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "replication", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Assessments)
	})

	t.Run("SearchInterviewsByCompanyName", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "TechCorp Engineering", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Interviews)

		found := false
		for _, iv := range result.Interviews {
			if iv.ID == createdInterviewA.ID {
				found = true
				assert.Equal(t, "interview", iv.Type)
				break
			}
		}
		assert.True(t, found, "expected to find interview by company name")
	})

	t.Run("SearchNotesByContent", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "concurrency", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Notes)
	})

	t.Run("SearchQuestionsByText", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "optimistic locking", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Notes, "questions appear in the Notes group")
	})

	t.Run("UserScopingPreventsAccessToOtherUsersData", func(t *testing.T) {
		result, err := searchRepo.Search(userB.ID, "TechCorp", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.Empty(t, result.Applications)
		assert.Empty(t, result.Interviews)
		assert.Empty(t, result.Assessments)
		assert.Empty(t, result.Notes)
		assert.Equal(t, 0, result.TotalCount)
	})

	t.Run("UserBCanFindOwnData", func(t *testing.T) {
		result, err := searchRepo.Search(userB.ID, "Moonlight", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotEmpty(t, result.Applications)
		assert.Greater(t, result.TotalCount, 0)
	})

	t.Run("NonMatchingQueryReturnsEmptyGroups", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "xyznonexistentquery", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.Empty(t, result.Applications)
		assert.Empty(t, result.Interviews)
		assert.Empty(t, result.Assessments)
		assert.Empty(t, result.Notes)
		assert.Equal(t, 0, result.TotalCount)
		assert.Equal(t, "xyznonexistentquery", result.Query)
	})

	t.Run("TotalCountReflectsAllMatches", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "TechCorp Engineering", 50)

		require.NoError(t, err)
		require.NotNil(t, result)

		expectedTotal := len(result.Applications) + len(result.Interviews) + len(result.Assessments) + len(result.Notes)
		assert.Equal(t, expectedTotal, result.TotalCount)
		assert.Greater(t, result.TotalCount, 0)
	})

	t.Run("LimitCapsAt50", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "TechCorp", 100)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.LessOrEqual(t, len(result.Applications), 50)
		assert.LessOrEqual(t, len(result.Interviews), 50)
		assert.LessOrEqual(t, len(result.Assessments), 50)
		assert.LessOrEqual(t, len(result.Notes), 50)
	})

	t.Run("LimitDefaultsTo10WhenZeroOrNegative", func(t *testing.T) {
		resultZero, err := searchRepo.Search(userA.ID, "TechCorp", 0)
		require.NoError(t, err)
		require.NotNil(t, resultZero)

		resultNeg, err := searchRepo.Search(userA.ID, "TechCorp", -5)
		require.NoError(t, err)
		require.NotNil(t, resultNeg)

		assert.LessOrEqual(t, len(resultZero.Applications), 10)
		assert.LessOrEqual(t, len(resultNeg.Applications), 10)
	})

	t.Run("ResponseIncludesQueryField", func(t *testing.T) {
		query := "Software Engineer"
		result, err := searchRepo.Search(userA.ID, query, 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.Equal(t, query, result.Query)
	})

	t.Run("EmptyGroupsAreInitializedNotNil", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "xyznotfound", 10)

		require.NoError(t, err)
		require.NotNil(t, result)
		assert.NotNil(t, result.Applications)
		assert.NotNil(t, result.Interviews)
		assert.NotNil(t, result.Assessments)
		assert.NotNil(t, result.Notes)
	})

	t.Run("SearchResultsContainValidLinks", func(t *testing.T) {
		result, err := searchRepo.Search(userA.ID, "TechCorp Engineering", 50)

		require.NoError(t, err)
		require.NotNil(t, result)

		for _, app := range result.Applications {
			assert.Contains(t, app.Link, "/applications/")
		}
		for _, iv := range result.Interviews {
			assert.Contains(t, iv.Link, "/interviews/")
		}
		for _, a := range result.Assessments {
			assert.Contains(t, a.Link, "/assessments/")
		}
		for _, n := range result.Notes {
			assert.Contains(t, n.Link, "/notes/")
		}
	})
}
