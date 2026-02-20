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

func TestInterviewerRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	interviewRepo := NewInterviewRepository(db.Database)
	interviewerRepo := NewInterviewerRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("interviewertest@example.com", "Interviewer Test User", string(hashedPassword))
	require.NoError(t, err)

	testCompany := testutil.CreateTestCompany("Interviewer Co", "interviewerco.com")
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

	t.Run("CreateInterviewer", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			role := "Engineering Manager"
			interviewer := &models.Interviewer{
				InterviewID: createdInterview.ID,
				Name:        "Jane Smith",
				Role:        &role,
			}

			created, err := interviewerRepo.CreateInterviewer(interviewer)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.NotEqual(t, uuid.Nil, created.ID)
			assert.Equal(t, createdInterview.ID, created.InterviewID)
			assert.Equal(t, "Jane Smith", created.Name)
			assert.Equal(t, &role, created.Role)
			assert.False(t, created.CreatedAt.IsZero())
		})

		t.Run("WithoutRole", func(t *testing.T) {
			interviewer := &models.Interviewer{
				InterviewID: createdInterview.ID,
				Name:        "John Doe",
			}

			created, err := interviewerRepo.CreateInterviewer(interviewer)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.Equal(t, "John Doe", created.Name)
			assert.Nil(t, created.Role)
		})
	})

	t.Run("GetInterviewerByInterview", func(t *testing.T) {
		t.Run("ReturnsAllForInterview", func(t *testing.T) {
			interviewers, err := interviewerRepo.GetInterviewerByInterview(createdInterview.ID)

			require.NoError(t, err)
			assert.GreaterOrEqual(t, len(interviewers), 2)
			for _, iv := range interviewers {
				assert.Equal(t, createdInterview.ID, iv.InterviewID)
			}
		})

		t.Run("EmptyForNoInterviewers", func(t *testing.T) {
			iv2 := &models.Interview{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				ScheduledDate: futureDate,
				InterviewType: models.InterviewTypeBehavioral,
			}
			emptyInterview, err := interviewRepo.CreateInterview(iv2)
			require.NoError(t, err)

			interviewers, err := interviewerRepo.GetInterviewerByInterview(emptyInterview.ID)

			require.NoError(t, err)
			assert.Empty(t, interviewers)
		})
	})

	t.Run("GetInterviewerByID", func(t *testing.T) {
		interviewer := &models.Interviewer{
			InterviewID: createdInterview.ID,
			Name:        "Get By ID Test",
		}
		created, err := interviewerRepo.CreateInterviewer(interviewer)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			retrieved, err := interviewerRepo.GetInterviewerByID(created.ID)

			require.NoError(t, err)
			require.NotNil(t, retrieved)
			assert.Equal(t, created.ID, retrieved.ID)
			assert.Equal(t, "Get By ID Test", retrieved.Name)
		})

		t.Run("NotFound", func(t *testing.T) {
			retrieved, err := interviewerRepo.GetInterviewerByID(uuid.New())

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})
	})

	t.Run("UpdateInterviewer", func(t *testing.T) {
		role := "Senior Engineer"
		interviewer := &models.Interviewer{
			InterviewID: createdInterview.ID,
			Name:        "Update Test",
			Role:        &role,
		}
		created, err := interviewerRepo.CreateInterviewer(interviewer)
		require.NoError(t, err)

		t.Run("PartialUpdate", func(t *testing.T) {
			updates := map[string]any{
				"name": "Updated Name",
			}

			updated, err := interviewerRepo.UpdateInterviewer(created.ID, updates)

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.Equal(t, "Updated Name", updated.Name)
		})

		t.Run("EmptyUpdates", func(t *testing.T) {
			updated, err := interviewerRepo.UpdateInterviewer(created.ID, map[string]any{})

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.Equal(t, "Updated Name", updated.Name)
		})

		t.Run("NotFound", func(t *testing.T) {
			updates := map[string]any{"name": "Ghost"}

			updated, err := interviewerRepo.UpdateInterviewer(uuid.New(), updates)

			require.Error(t, err)
			assert.Nil(t, updated)
		})
	})

	t.Run("SoftDeleteInterviewer", func(t *testing.T) {
		interviewer := &models.Interviewer{
			InterviewID: createdInterview.ID,
			Name:        "Delete Me",
		}
		created, err := interviewerRepo.CreateInterviewer(interviewer)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			err := interviewerRepo.SoftDeleteInterviewer(created.ID)
			require.NoError(t, err)

			retrieved, err := interviewerRepo.GetInterviewerByID(created.ID)
			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("NotFound", func(t *testing.T) {
			err := interviewerRepo.SoftDeleteInterviewer(uuid.New())
			require.Error(t, err)
		})

		t.Run("AlreadyDeleted", func(t *testing.T) {
			err := interviewerRepo.SoftDeleteInterviewer(created.ID)
			require.Error(t, err)
		})
	})

	t.Run("ExcludesDeletedFromList", func(t *testing.T) {
		iv3 := &models.Interview{
			UserID:        testUser.ID,
			ApplicationID: createdApp.ID,
			ScheduledDate: futureDate,
			InterviewType: models.InterviewTypePanel,
		}
		isolatedInterview, err := interviewRepo.CreateInterview(iv3)
		require.NoError(t, err)

		iwr1 := &models.Interviewer{InterviewID: isolatedInterview.ID, Name: "Person A"}
		created1, err := interviewerRepo.CreateInterviewer(iwr1)
		require.NoError(t, err)

		iwr2 := &models.Interviewer{InterviewID: isolatedInterview.ID, Name: "Person B"}
		_, err = interviewerRepo.CreateInterviewer(iwr2)
		require.NoError(t, err)

		listBefore, err := interviewerRepo.GetInterviewerByInterview(isolatedInterview.ID)
		require.NoError(t, err)
		assert.Equal(t, 2, len(listBefore))

		err = interviewerRepo.SoftDeleteInterviewer(created1.ID)
		require.NoError(t, err)

		listAfter, err := interviewerRepo.GetInterviewerByInterview(isolatedInterview.ID)
		require.NoError(t, err)
		assert.Equal(t, 1, len(listAfter))
		assert.Equal(t, "Person B", listAfter[0].Name)
	})
}
