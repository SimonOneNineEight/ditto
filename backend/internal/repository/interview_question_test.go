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

func TestInterviewQuestionRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	interviewRepo := NewInterviewRepository(db.Database)
	questionRepo := NewInterviewQuestionRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("questiontest@example.com", "Question Test User", string(hashedPassword))
	require.NoError(t, err)

	testCompany := testutil.CreateTestCompany("Question Co", "questionco.com")
	createdCompany, err := companyRepo.CreateCompany(testCompany)
	require.NoError(t, err)

	testJob := testutil.CreateTestJob(createdCompany.ID, "Software Engineer", "Build things")
	createdJob, err := jobRepo.CreateJob(testUser.ID, testJob)
	require.NoError(t, err)

	var statusID uuid.UUID
	err = db.Get(&statusID, "SELECT id FROM application_status LIMIT 1")
	require.NoError(t, err)

	testApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
	createdApp, err := applicationRepo.CreateApplication(testUser.ID, testApp)
	require.NoError(t, err)

	futureDate := time.Now().AddDate(0, 0, 7)
	interview := &models.Interview{
		UserID:        testUser.ID,
		ApplicationID: createdApp.ID,
		ScheduledDate: futureDate,
		InterviewType: models.InterviewTypeTechnical,
	}
	createdInterview, err := interviewRepo.CreateInterview(interview)
	require.NoError(t, err)

	t.Run("GetNextOrder", func(t *testing.T) {
		t.Run("Returns0WhenNoQuestions", func(t *testing.T) {
			iv := &models.Interview{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				ScheduledDate: futureDate,
				InterviewType: models.InterviewTypeBehavioral,
			}
			emptyInterview, err := interviewRepo.CreateInterview(iv)
			require.NoError(t, err)

			nextOrder, err := questionRepo.GetNextOrder(emptyInterview.ID)

			require.NoError(t, err)
			assert.Equal(t, 0, nextOrder)
		})
	})

	t.Run("CreateInterviewQuestion", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			answer := "Use a hash map for O(1) lookup"
			q := &models.InterviewQuestion{
				InterviewID:  createdInterview.ID,
				QuestionText: "Describe a data structure for fast lookup",
				AnswerText:   &answer,
				Order:        0,
			}

			created, err := questionRepo.CreateInterviewQuestion(q)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.NotEqual(t, uuid.Nil, created.ID)
			assert.Equal(t, createdInterview.ID, created.InterviewID)
			assert.Equal(t, "Describe a data structure for fast lookup", created.QuestionText)
			assert.Equal(t, &answer, created.AnswerText)
			assert.False(t, created.CreatedAt.IsZero())
		})

		t.Run("WithoutAnswer", func(t *testing.T) {
			q := &models.InterviewQuestion{
				InterviewID:  createdInterview.ID,
				QuestionText: "What is your greatest strength?",
				Order:        1,
			}

			created, err := questionRepo.CreateInterviewQuestion(q)

			require.NoError(t, err)
			assert.Nil(t, created.AnswerText)
		})
	})

	t.Run("GetNextOrder_AfterCreation", func(t *testing.T) {
		nextOrder, err := questionRepo.GetNextOrder(createdInterview.ID)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, nextOrder, 2)
	})

	t.Run("CreateInterviewQuestions", func(t *testing.T) {
		t.Run("BulkSuccess", func(t *testing.T) {
			iv := &models.Interview{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				ScheduledDate: futureDate,
				InterviewType: models.InterviewTypePanel,
			}
			bulkInterview, err := interviewRepo.CreateInterview(iv)
			require.NoError(t, err)

			answer1 := "Answer 1"
			questions := []*models.InterviewQuestion{
				{InterviewID: bulkInterview.ID, QuestionText: "Q1", AnswerText: &answer1},
				{InterviewID: bulkInterview.ID, QuestionText: "Q2"},
				{InterviewID: bulkInterview.ID, QuestionText: "Q3"},
			}

			created, err := questionRepo.CreateInterviewQuestions(questions)

			require.NoError(t, err)
			assert.Len(t, created, 3)
			for i, q := range created {
				assert.NotEqual(t, uuid.Nil, q.ID)
				assert.Equal(t, i, q.Order)
			}
		})

		t.Run("EmptySlice", func(t *testing.T) {
			result, err := questionRepo.CreateInterviewQuestions([]*models.InterviewQuestion{})

			require.NoError(t, err)
			assert.Empty(t, result)
		})
	})

	t.Run("GetInterviewQuestionByID", func(t *testing.T) {
		q := &models.InterviewQuestion{
			InterviewID:  createdInterview.ID,
			QuestionText: "Find me by ID",
			Order:        10,
		}
		created, err := questionRepo.CreateInterviewQuestion(q)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			retrieved, err := questionRepo.GetInterviewQuestionByID(created.ID)

			require.NoError(t, err)
			require.NotNil(t, retrieved)
			assert.Equal(t, created.ID, retrieved.ID)
			assert.Equal(t, "Find me by ID", retrieved.QuestionText)
		})

		t.Run("NotFound", func(t *testing.T) {
			retrieved, err := questionRepo.GetInterviewQuestionByID(uuid.New())

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})
	})

	t.Run("UpdateInterviewQuestion", func(t *testing.T) {
		q := &models.InterviewQuestion{
			InterviewID:  createdInterview.ID,
			QuestionText: "Original question",
			Order:        20,
		}
		created, err := questionRepo.CreateInterviewQuestion(q)
		require.NoError(t, err)

		t.Run("UpdateText", func(t *testing.T) {
			updates := map[string]any{
				"question_text": "Updated question",
			}

			updated, err := questionRepo.UpdateInterviewQuestion(created.ID, updates)

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.Equal(t, "Updated question", updated.QuestionText)
		})

		t.Run("UpdateOrder", func(t *testing.T) {
			updates := map[string]any{
				"order": 99,
			}

			updated, err := questionRepo.UpdateInterviewQuestion(created.ID, updates)

			require.NoError(t, err)
			assert.Equal(t, 99, updated.Order)
		})

		t.Run("EmptyUpdates", func(t *testing.T) {
			updated, err := questionRepo.UpdateInterviewQuestion(created.ID, map[string]any{})

			require.NoError(t, err)
			require.NotNil(t, updated)
		})

		t.Run("NotFound", func(t *testing.T) {
			updates := map[string]any{"question_text": "Ghost"}

			updated, err := questionRepo.UpdateInterviewQuestion(uuid.New(), updates)

			require.Error(t, err)
			assert.Nil(t, updated)
		})
	})

	t.Run("GetInterviewQuestionByInterviewID", func(t *testing.T) {
		t.Run("ReturnsOrderedQuestions", func(t *testing.T) {
			questions, err := questionRepo.GetInterviewQuestionByInterviewID(createdInterview.ID)

			require.NoError(t, err)
			assert.NotEmpty(t, questions)

			for i := 0; i < len(questions)-1; i++ {
				assert.LessOrEqual(t, questions[i].Order, questions[i+1].Order)
			}
		})

		t.Run("EmptyForNoQuestions", func(t *testing.T) {
			iv := &models.Interview{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				ScheduledDate: futureDate,
				InterviewType: models.InterviewTypeOnsite,
			}
			emptyIv, err := interviewRepo.CreateInterview(iv)
			require.NoError(t, err)

			questions, err := questionRepo.GetInterviewQuestionByInterviewID(emptyIv.ID)

			require.NoError(t, err)
			assert.Empty(t, questions)
		})
	})

	t.Run("SoftDeleteInterviewQuestion", func(t *testing.T) {
		q := &models.InterviewQuestion{
			InterviewID:  createdInterview.ID,
			QuestionText: "Delete me",
			Order:        50,
		}
		created, err := questionRepo.CreateInterviewQuestion(q)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			err := questionRepo.SoftDeleteInterviewQuestion(created.ID)
			require.NoError(t, err)

			retrieved, err := questionRepo.GetInterviewQuestionByID(created.ID)
			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("NotFound", func(t *testing.T) {
			err := questionRepo.SoftDeleteInterviewQuestion(uuid.New())
			require.Error(t, err)
		})
	})

	t.Run("ReorderQuestions", func(t *testing.T) {
		iv := &models.Interview{
			UserID:        testUser.ID,
			ApplicationID: createdApp.ID,
			ScheduledDate: futureDate,
			InterviewType: models.InterviewTypeOther,
		}
		reorderInterview, err := interviewRepo.CreateInterview(iv)
		require.NoError(t, err)

		questions := []*models.InterviewQuestion{
			{InterviewID: reorderInterview.ID, QuestionText: "First"},
			{InterviewID: reorderInterview.ID, QuestionText: "Second"},
			{InterviewID: reorderInterview.ID, QuestionText: "Third"},
		}
		created, err := questionRepo.CreateInterviewQuestions(questions)
		require.NoError(t, err)
		require.Len(t, created, 3)

		t.Run("Success", func(t *testing.T) {
			// Reverse the order
			reversed := []uuid.UUID{created[2].ID, created[1].ID, created[0].ID}

			reordered, err := questionRepo.ReorderQuestions(reorderInterview.ID, reversed)

			require.NoError(t, err)
			require.Len(t, reordered, 3)
			assert.Equal(t, "Third", reordered[0].QuestionText)
			assert.Equal(t, 0, reordered[0].Order)
			assert.Equal(t, "Second", reordered[1].QuestionText)
			assert.Equal(t, 1, reordered[1].Order)
			assert.Equal(t, "First", reordered[2].QuestionText)
			assert.Equal(t, 2, reordered[2].Order)
		})

		t.Run("InvalidQuestionID", func(t *testing.T) {
			ids := []uuid.UUID{uuid.New()}

			result, err := questionRepo.ReorderQuestions(reorderInterview.ID, ids)

			require.Error(t, err)
			assert.Nil(t, result)
		})
	})
}
