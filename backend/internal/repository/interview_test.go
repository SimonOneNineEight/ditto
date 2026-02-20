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

func TestInterviewRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	interviewRepo := NewInterviewRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("interviewtest@example.com", "Interview Test User", string(hashedPassword))
	require.NoError(t, err)

	testUser2, err := userRepo.CreateUser("interviewtest2@example.com", "Interview Test User 2", string(hashedPassword))
	require.NoError(t, err)

	testCompany := testutil.CreateTestCompany("Interview Co", "interviewco.com")
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

	testApp2 := testutil.CreateTestApplication(testUser2.ID, createdJob.ID, statusID)
	createdApp2, err := applicationRepo.CreateApplication(testUser2.ID, testApp2)
	require.NoError(t, err)

	futureDate := time.Now().AddDate(0, 0, 7)
	futureDate2 := time.Now().AddDate(0, 0, 14)

	t.Run("CreateInterview", func(t *testing.T) {
		t.Run("FirstInterviewAutoAssignsRound1", func(t *testing.T) {
			scheduledTime := "10:00"
			duration := 60
			interview := &models.Interview{
				UserID:          testUser.ID,
				ApplicationID:   createdApp.ID,
				ScheduledDate:   futureDate,
				ScheduledTime:   &scheduledTime,
				DurationMinutes: &duration,
				InterviewType:   models.InterviewTypePhoneScreen,
			}

			created, err := interviewRepo.CreateInterview(interview)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.NotEqual(t, uuid.Nil, created.ID)
			assert.Equal(t, 1, created.RoundNumber)
			assert.Equal(t, models.InterviewTypePhoneScreen, created.InterviewType)
			assert.Equal(t, &scheduledTime, created.ScheduledTime)
			assert.Equal(t, &duration, created.DurationMinutes)
			assert.False(t, created.CreatedAt.IsZero())
			assert.False(t, created.UpdatedAt.IsZero())
		})

		t.Run("SecondInterviewAutoIncrementsToRound2", func(t *testing.T) {
			interview := &models.Interview{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				ScheduledDate: futureDate2,
				InterviewType: models.InterviewTypeTechnical,
			}

			created, err := interviewRepo.CreateInterview(interview)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.Equal(t, 2, created.RoundNumber)
			assert.Equal(t, models.InterviewTypeTechnical, created.InterviewType)
		})

		t.Run("WithOptionalFields", func(t *testing.T) {
			outcome := "passed"
			feeling := "confident"
			wentWell := "Technical questions were clear"
			couldImprove := "System design explanation"
			confidence := 4

			interview := &models.Interview{
				UserID:          testUser.ID,
				ApplicationID:   createdApp.ID,
				ScheduledDate:   futureDate,
				InterviewType:   models.InterviewTypeBehavioral,
				Outcome:         &outcome,
				OverallFeeling:  &feeling,
				WentWell:        &wentWell,
				CouldImprove:    &couldImprove,
				ConfidenceLevel: &confidence,
			}

			created, err := interviewRepo.CreateInterview(interview)

			require.NoError(t, err)
			assert.Equal(t, 3, created.RoundNumber)
			assert.Equal(t, &outcome, created.Outcome)
			assert.Equal(t, &feeling, created.OverallFeeling)
			assert.Equal(t, &wentWell, created.WentWell)
			assert.Equal(t, &couldImprove, created.CouldImprove)
			assert.Equal(t, &confidence, created.ConfidenceLevel)
		})
	})

	t.Run("GetNextRoundNumber", func(t *testing.T) {
		t.Run("ReturnsCorrectValueAfterCreates", func(t *testing.T) {
			nextRound, err := interviewRepo.GetNextRoundNumber(createdApp.ID)

			require.NoError(t, err)
			assert.Equal(t, 4, nextRound)
		})

		t.Run("Returns1ForNewApplication", func(t *testing.T) {
			freshApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
			createdFreshApp, err := applicationRepo.CreateApplication(testUser.ID, freshApp)
			require.NoError(t, err)

			nextRound, err := interviewRepo.GetNextRoundNumber(createdFreshApp.ID)

			require.NoError(t, err)
			assert.Equal(t, 1, nextRound)
		})
	})

	t.Run("GetInterviewByID", func(t *testing.T) {
		interview := &models.Interview{
			UserID:        testUser.ID,
			ApplicationID: createdApp.ID,
			ScheduledDate: futureDate,
			InterviewType: models.InterviewTypePanel,
		}
		created, err := interviewRepo.CreateInterview(interview)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			retrieved, err := interviewRepo.GetInterviewByID(created.ID, testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, retrieved)
			assert.Equal(t, created.ID, retrieved.ID)
			assert.Equal(t, models.InterviewTypePanel, retrieved.InterviewType)
			assert.Equal(t, created.RoundNumber, retrieved.RoundNumber)
		})

		t.Run("NotFound", func(t *testing.T) {
			retrieved, err := interviewRepo.GetInterviewByID(uuid.New(), testUser.ID)

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			retrieved, err := interviewRepo.GetInterviewByID(created.ID, testUser2.ID)

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})
	})

	t.Run("UpdateInterview", func(t *testing.T) {
		interview := &models.Interview{
			UserID:        testUser.ID,
			ApplicationID: createdApp.ID,
			ScheduledDate: futureDate,
			InterviewType: models.InterviewTypeOnsite,
		}
		created, err := interviewRepo.CreateInterview(interview)
		require.NoError(t, err)

		t.Run("PartialUpdate", func(t *testing.T) {
			updates := map[string]any{
				"outcome":         "passed",
				"overall_feeling": "positive",
			}

			updated, err := interviewRepo.UpdateInterview(created.ID, testUser.ID, updates)

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.Equal(t, "passed", *updated.Outcome)
			assert.Equal(t, "positive", *updated.OverallFeeling)
			assert.Equal(t, models.InterviewTypeOnsite, updated.InterviewType)
		})

		t.Run("UpdateMultipleFields", func(t *testing.T) {
			updates := map[string]any{
				"went_well":        "Explained architecture clearly",
				"could_improve":    "Time management on coding tasks",
				"confidence_level": 4,
			}

			updated, err := interviewRepo.UpdateInterview(created.ID, testUser.ID, updates)

			require.NoError(t, err)
			assert.Equal(t, "Explained architecture clearly", *updated.WentWell)
			assert.Equal(t, "Time management on coding tasks", *updated.CouldImprove)
			assert.Equal(t, 4, *updated.ConfidenceLevel)
		})

		t.Run("EmptyUpdates", func(t *testing.T) {
			updated, err := interviewRepo.UpdateInterview(created.ID, testUser.ID, map[string]any{})

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.Equal(t, "passed", *updated.Outcome)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			updates := map[string]any{"outcome": "hacked"}

			updated, err := interviewRepo.UpdateInterview(created.ID, testUser2.ID, updates)

			require.Error(t, err)
			assert.Nil(t, updated)
		})
	})

	t.Run("GetInterviewsByApplicationID", func(t *testing.T) {
		t.Run("ReturnsListForCorrectUser", func(t *testing.T) {
			interviews, err := interviewRepo.GetInterviewsByApplicationID(createdApp.ID, testUser.ID)

			require.NoError(t, err)
			assert.NotEmpty(t, interviews)

			for _, iv := range interviews {
				assert.Equal(t, testUser.ID, iv.UserID)
				assert.Equal(t, createdApp.ID, iv.ApplicationID)
			}
		})

		t.Run("EmptyForWrongUser", func(t *testing.T) {
			interviews, err := interviewRepo.GetInterviewsByApplicationID(createdApp.ID, testUser2.ID)

			require.NoError(t, err)
			assert.Empty(t, interviews)
		})
	})

	t.Run("GetInterviewsByUser", func(t *testing.T) {
		t.Run("ReturnsAllUserInterviews", func(t *testing.T) {
			interviews, err := interviewRepo.GetInterviewsByUser(testUser.ID)

			require.NoError(t, err)
			assert.NotEmpty(t, interviews)

			for _, iv := range interviews {
				assert.Equal(t, testUser.ID, iv.UserID)
			}
		})

		t.Run("EmptyForUserWithNoInterviews", func(t *testing.T) {
			freshUser, err := userRepo.CreateUser("nointerview@example.com", "No Interviews", string(hashedPassword))
			require.NoError(t, err)

			interviews, err := interviewRepo.GetInterviewsByUser(freshUser.ID)

			require.NoError(t, err)
			assert.Empty(t, interviews)
		})
	})

	t.Run("GetAllRoundsSummary", func(t *testing.T) {
		t.Run("ReturnsSortedSummaries", func(t *testing.T) {
			summaries, err := interviewRepo.GetAllRoundsSummary(createdApp.ID, testUser.ID)

			require.NoError(t, err)
			assert.NotEmpty(t, summaries)

			for i := 0; i < len(summaries)-1; i++ {
				assert.Less(t, summaries[i].RoundNumber, summaries[i+1].RoundNumber)
			}
		})

		t.Run("EmptyForNoRounds", func(t *testing.T) {
			summaries, err := interviewRepo.GetAllRoundsSummary(createdApp2.ID, testUser2.ID)

			require.NoError(t, err)
			assert.Empty(t, summaries)
		})

		t.Run("WrongUser", func(t *testing.T) {
			summaries, err := interviewRepo.GetAllRoundsSummary(createdApp.ID, testUser2.ID)

			require.NoError(t, err)
			assert.Empty(t, summaries)
		})
	})

	t.Run("SoftDeleteInterview", func(t *testing.T) {
		interview := &models.Interview{
			UserID:        testUser.ID,
			ApplicationID: createdApp.ID,
			ScheduledDate: futureDate,
			InterviewType: models.InterviewTypeOther,
		}
		created, err := interviewRepo.CreateInterview(interview)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			err := interviewRepo.SoftDeleteInterview(created.ID, testUser.ID)
			require.NoError(t, err)

			retrieved, err := interviewRepo.GetInterviewByID(created.ID, testUser.ID)
			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			iv := &models.Interview{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				ScheduledDate: futureDate,
				InterviewType: models.InterviewTypeTechnical,
			}
			created2, err := interviewRepo.CreateInterview(iv)
			require.NoError(t, err)

			err = interviewRepo.SoftDeleteInterview(created2.ID, testUser2.ID)
			require.Error(t, err)

			retrieved, err := interviewRepo.GetInterviewByID(created2.ID, testUser.ID)
			require.NoError(t, err)
			assert.NotNil(t, retrieved)
		})

		t.Run("NotFound", func(t *testing.T) {
			err := interviewRepo.SoftDeleteInterview(uuid.New(), testUser.ID)
			require.Error(t, err)
		})
	})

	t.Run("ExcludesSoftDeleted", func(t *testing.T) {
		isolatedApp := testutil.CreateTestApplication(testUser2.ID, createdJob.ID, statusID)
		createdIsolatedApp, err := applicationRepo.CreateApplication(testUser2.ID, isolatedApp)
		require.NoError(t, err)

		iv1 := &models.Interview{
			UserID:        testUser2.ID,
			ApplicationID: createdIsolatedApp.ID,
			ScheduledDate: futureDate,
			InterviewType: models.InterviewTypePhoneScreen,
		}
		createdIv1, err := interviewRepo.CreateInterview(iv1)
		require.NoError(t, err)

		iv2 := &models.Interview{
			UserID:        testUser2.ID,
			ApplicationID: createdIsolatedApp.ID,
			ScheduledDate: futureDate2,
			InterviewType: models.InterviewTypeTechnical,
		}
		_, err = interviewRepo.CreateInterview(iv2)
		require.NoError(t, err)

		listBefore, err := interviewRepo.GetInterviewsByApplicationID(createdIsolatedApp.ID, testUser2.ID)
		require.NoError(t, err)
		countBefore := len(listBefore)
		assert.Equal(t, 2, countBefore)

		err = interviewRepo.SoftDeleteInterview(createdIv1.ID, testUser2.ID)
		require.NoError(t, err)

		listAfter, err := interviewRepo.GetInterviewsByApplicationID(createdIsolatedApp.ID, testUser2.ID)
		require.NoError(t, err)
		assert.Equal(t, countBefore-1, len(listAfter))

		userInterviews, err := interviewRepo.GetInterviewsByUser(testUser2.ID)
		require.NoError(t, err)
		for _, iv := range userInterviews {
			assert.NotEqual(t, createdIv1.ID, iv.ID)
		}

		summaries, err := interviewRepo.GetAllRoundsSummary(createdIsolatedApp.ID, testUser2.ID)
		require.NoError(t, err)
		for _, s := range summaries {
			assert.NotEqual(t, createdIv1.ID, s.ID)
		}

		nextRound, err := interviewRepo.GetNextRoundNumber(createdIsolatedApp.ID)
		require.NoError(t, err)
		assert.Equal(t, 3, nextRound)
	})
}
