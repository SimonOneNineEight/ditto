package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/testutil"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestAssessmentRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	assessmentRepo := NewAssessmentRepository(db.Database)
	submissionRepo := NewAssessmentSubmissionRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("assesstest@example.com", "Assessment Test User", string(hashedPassword))
	require.NoError(t, err)

	testUser2, err := userRepo.CreateUser("assesstest2@example.com", "Assessment Test User 2", string(hashedPassword))
	require.NoError(t, err)

	testCompany := testutil.CreateTestCompany("Assessment Co", "assessco.com")
	createdCompany, err := companyRepo.CreateCompany(testCompany)
	require.NoError(t, err)

	testJob := testutil.CreateTestJob(createdCompany.ID, "Engineer", "Description")
	createdJob, err := jobRepo.CreateJob(testUser.ID, testJob)
	require.NoError(t, err)

	var statusID uuid.UUID
	err = db.Get(&statusID, "SELECT id FROM application_status LIMIT 1")
	require.NoError(t, err)

	testApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
	createdApp, err := applicationRepo.CreateApplication(testUser.ID, testApp)
	require.NoError(t, err)

	testApp2 := testutil.CreateTestApplication(testUser2.ID, createdJob.ID, statusID)
	_, err = applicationRepo.CreateApplication(testUser2.ID, testApp2)
	require.NoError(t, err)

	t.Run("CreateAssessment", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			instructions := "Build a REST API"
			assessment := &models.Assessment{
				UserID:         testUser.ID,
				ApplicationID:  createdApp.ID,
				AssessmentType: models.AssessmentTypeTakeHomeProject,
				Title:          "Take Home Project",
				DueDate:        "2026-03-01",
				Instructions:   &instructions,
			}

			created, err := assessmentRepo.CreateAssessment(assessment)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.NotEqual(t, uuid.Nil, created.ID)
			assert.Equal(t, "Take Home Project", created.Title)
			assert.Equal(t, models.AssessmentStatusNotStarted, created.Status)
			assert.Equal(t, &instructions, created.Instructions)
			assert.False(t, created.CreatedAt.IsZero())
			assert.False(t, created.UpdatedAt.IsZero())
		})

		t.Run("WithExplicitStatus", func(t *testing.T) {
			assessment := &models.Assessment{
				UserID:         testUser.ID,
				ApplicationID:  createdApp.ID,
				AssessmentType: models.AssessmentTypeLiveCoding,
				Title:          "Live Coding Session",
				DueDate:        "2026-03-05",
				Status:         models.AssessmentStatusInProgress,
			}

			created, err := assessmentRepo.CreateAssessment(assessment)

			require.NoError(t, err)
			assert.Equal(t, models.AssessmentStatusInProgress, created.Status)
		})
	})

	t.Run("GetAssessmentByID", func(t *testing.T) {
		assessment := &models.Assessment{
			UserID:         testUser.ID,
			ApplicationID:  createdApp.ID,
			AssessmentType: models.AssessmentTypeSystemDesign,
			Title:          "System Design Exercise",
			DueDate:        "2026-03-10",
		}
		created, err := assessmentRepo.CreateAssessment(assessment)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			retrieved, err := assessmentRepo.GetAssessmentByID(created.ID, testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, retrieved)
			assert.Equal(t, created.ID, retrieved.ID)
			assert.Equal(t, "System Design Exercise", retrieved.Title)
		})

		t.Run("NotFound", func(t *testing.T) {
			retrieved, err := assessmentRepo.GetAssessmentByID(uuid.New(), testUser.ID)

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			retrieved, err := assessmentRepo.GetAssessmentByID(created.ID, testUser2.ID)

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})
	})

	t.Run("ListByApplicationID", func(t *testing.T) {
		// Create assessments with different due dates to test sorting
		assessment1 := &models.Assessment{
			UserID:         testUser.ID,
			ApplicationID:  createdApp.ID,
			AssessmentType: models.AssessmentTypeDataStructures,
			Title:          "DS Assessment (later)",
			DueDate:        "2026-04-15",
		}
		_, err := assessmentRepo.CreateAssessment(assessment1)
		require.NoError(t, err)

		assessment2 := &models.Assessment{
			UserID:         testUser.ID,
			ApplicationID:  createdApp.ID,
			AssessmentType: models.AssessmentTypeCaseStudy,
			Title:          "Case Study (earlier)",
			DueDate:        "2026-04-01",
		}
		_, err = assessmentRepo.CreateAssessment(assessment2)
		require.NoError(t, err)

		t.Run("SortedByDueDateAsc", func(t *testing.T) {
			list, err := assessmentRepo.ListByApplicationID(createdApp.ID, testUser.ID)

			require.NoError(t, err)
			assert.GreaterOrEqual(t, len(list), 2)

			// Verify ascending due_date order
			for i := 0; i < len(list)-1; i++ {
				assert.LessOrEqual(t, list[i].DueDate, list[i+1].DueDate)
			}
		})

		t.Run("EmptyForOtherUser", func(t *testing.T) {
			list, err := assessmentRepo.ListByApplicationID(createdApp.ID, testUser2.ID)

			require.NoError(t, err)
			assert.Empty(t, list)
		})
	})

	t.Run("ListByUserID", func(t *testing.T) {
		list, err := assessmentRepo.ListByUserID(testUser.ID)

		require.NoError(t, err)
		assert.NotEmpty(t, list)

		for _, a := range list {
			assert.Equal(t, testUser.ID, a.UserID)
			assert.NotEmpty(t, a.CompanyName)
			assert.NotEmpty(t, a.JobTitle)
		}

		t.Run("EmptyForOtherUser", func(t *testing.T) {
			otherUser, err := userRepo.CreateUser("listbyuser@test.com", "List Test", string(hashedPassword))
			require.NoError(t, err)

			list, err := assessmentRepo.ListByUserID(otherUser.ID)
			require.NoError(t, err)
			assert.Empty(t, list)
		})
	})

	t.Run("UpdateAssessment", func(t *testing.T) {
		assessment := &models.Assessment{
			UserID:         testUser.ID,
			ApplicationID:  createdApp.ID,
			AssessmentType: models.AssessmentTypeOther,
			Title:          "Original Title",
			DueDate:        "2026-05-01",
		}
		created, err := assessmentRepo.CreateAssessment(assessment)
		require.NoError(t, err)

		t.Run("PartialUpdate", func(t *testing.T) {
			updates := map[string]any{
				"title":  "Updated Title",
				"status": models.AssessmentStatusSubmitted,
			}

			updated, err := assessmentRepo.UpdateAssessment(created.ID, testUser.ID, updates)

			require.NoError(t, err)
			assert.Equal(t, "Updated Title", updated.Title)
			assert.Equal(t, models.AssessmentStatusSubmitted, updated.Status)
			assert.Contains(t, updated.DueDate, "2026-05-01") // unchanged, DB returns full timestamp format
		})

		t.Run("EmptyUpdates", func(t *testing.T) {
			updated, err := assessmentRepo.UpdateAssessment(created.ID, testUser.ID, map[string]any{})

			require.NoError(t, err)
			assert.Equal(t, "Updated Title", updated.Title)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			updates := map[string]any{"title": "Hacked"}

			updated, err := assessmentRepo.UpdateAssessment(created.ID, testUser2.ID, updates)

			require.Error(t, err)
			assert.Nil(t, updated)
		})
	})

	t.Run("SoftDeleteAssessment", func(t *testing.T) {
		assessment := &models.Assessment{
			UserID:         testUser.ID,
			ApplicationID:  createdApp.ID,
			AssessmentType: models.AssessmentTypeTakeHomeProject,
			Title:          "To Delete",
			DueDate:        "2026-06-01",
		}
		created, err := assessmentRepo.CreateAssessment(assessment)
		require.NoError(t, err)

		// Create a submission linked to this assessment
		submission := &models.AssessmentSubmission{
			AssessmentID:   created.ID,
			SubmissionType: models.SubmissionTypeNotes,
			Notes:          testutil.StringPtr("Some notes"),
		}
		_, err = submissionRepo.CreateSubmission(submission)
		require.NoError(t, err)

		t.Run("CascadesToSubmissions", func(t *testing.T) {
			err := assessmentRepo.SoftDeleteAssessment(created.ID, testUser.ID)
			require.NoError(t, err)

			// Assessment should not be retrievable
			retrieved, err := assessmentRepo.GetAssessmentByID(created.ID, testUser.ID)
			require.Error(t, err)
			assert.Nil(t, retrieved)

			// Submissions should also be soft-deleted
			submissions, err := submissionRepo.ListByAssessmentID(created.ID)
			require.NoError(t, err)
			assert.Empty(t, submissions)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			assessment2 := &models.Assessment{
				UserID:         testUser.ID,
				ApplicationID:  createdApp.ID,
				AssessmentType: models.AssessmentTypeLiveCoding,
				Title:          "Cannot Delete",
				DueDate:        "2026-06-15",
			}
			created2, err := assessmentRepo.CreateAssessment(assessment2)
			require.NoError(t, err)

			err = assessmentRepo.SoftDeleteAssessment(created2.ID, testUser2.ID)
			require.Error(t, err)

			// Should still exist for correct user
			retrieved, err := assessmentRepo.GetAssessmentByID(created2.ID, testUser.ID)
			require.NoError(t, err)
			assert.NotNil(t, retrieved)
		})

		t.Run("NotFound", func(t *testing.T) {
			err := assessmentRepo.SoftDeleteAssessment(uuid.New(), testUser.ID)
			require.Error(t, err)
		})
	})

	t.Run("ExcludesSoftDeleted", func(t *testing.T) {
		// Use a separate application to isolate this test
		isolatedApp := testutil.CreateTestApplication(testUser2.ID, createdJob.ID, statusID)
		createdIsolatedApp, err := applicationRepo.CreateApplication(testUser2.ID, isolatedApp)
		require.NoError(t, err)

		assessment := &models.Assessment{
			UserID:         testUser2.ID,
			ApplicationID:  createdIsolatedApp.ID,
			AssessmentType: models.AssessmentTypeTakeHomeProject,
			Title:          "Will Be Deleted",
			DueDate:        "2026-07-01",
		}
		created, err := assessmentRepo.CreateAssessment(assessment)
		require.NoError(t, err)

		listBefore, err := assessmentRepo.ListByApplicationID(createdIsolatedApp.ID, testUser2.ID)
		require.NoError(t, err)
		countBefore := len(listBefore)

		err = assessmentRepo.SoftDeleteAssessment(created.ID, testUser2.ID)
		require.NoError(t, err)

		listAfter, err := assessmentRepo.ListByApplicationID(createdIsolatedApp.ID, testUser2.ID)
		require.NoError(t, err)

		assert.Equal(t, countBefore-1, len(listAfter))
	})

	t.Run("SubmissionRepository", func(t *testing.T) {
		assessment := &models.Assessment{
			UserID:         testUser.ID,
			ApplicationID:  createdApp.ID,
			AssessmentType: models.AssessmentTypeTakeHomeProject,
			Title:          "Submission Test Assessment",
			DueDate:        "2026-08-01",
		}
		createdAssessment, err := assessmentRepo.CreateAssessment(assessment)
		require.NoError(t, err)

		t.Run("CreateGithubSubmission", func(t *testing.T) {
			url := "https://github.com/user/repo"
			submission := &models.AssessmentSubmission{
				AssessmentID:   createdAssessment.ID,
				SubmissionType: models.SubmissionTypeGithub,
				GithubURL:      &url,
			}

			created, err := submissionRepo.CreateSubmission(submission)

			require.NoError(t, err)
			assert.NotEqual(t, uuid.Nil, created.ID)
			assert.Equal(t, models.SubmissionTypeGithub, created.SubmissionType)
			assert.Equal(t, &url, created.GithubURL)
			assert.False(t, created.SubmittedAt.IsZero())
		})

		t.Run("CreateNotesSubmission", func(t *testing.T) {
			notes := "Completed all requirements"
			submission := &models.AssessmentSubmission{
				AssessmentID:   createdAssessment.ID,
				SubmissionType: models.SubmissionTypeNotes,
				Notes:          &notes,
			}

			created, err := submissionRepo.CreateSubmission(submission)

			require.NoError(t, err)
			assert.Equal(t, models.SubmissionTypeNotes, created.SubmissionType)
			assert.Equal(t, &notes, created.Notes)
		})

		t.Run("ListByAssessmentID_SortedBySubmittedAtDesc", func(t *testing.T) {
			list, err := submissionRepo.ListByAssessmentID(createdAssessment.ID)

			require.NoError(t, err)
			assert.GreaterOrEqual(t, len(list), 2)

			// Verify descending submitted_at order
			for i := 0; i < len(list)-1; i++ {
				assert.True(t, list[i].SubmittedAt.After(list[i+1].SubmittedAt) || list[i].SubmittedAt.Equal(list[i+1].SubmittedAt))
			}
		})

		t.Run("SoftDeleteSubmission", func(t *testing.T) {
			submission := &models.AssessmentSubmission{
				AssessmentID:   createdAssessment.ID,
				SubmissionType: models.SubmissionTypeNotes,
				Notes:          testutil.StringPtr("To delete"),
			}
			created, err := submissionRepo.CreateSubmission(submission)
			require.NoError(t, err)

			listBefore, err := submissionRepo.ListByAssessmentID(createdAssessment.ID)
			require.NoError(t, err)

			err = submissionRepo.SoftDeleteSubmission(created.ID)
			require.NoError(t, err)

			listAfter, err := submissionRepo.ListByAssessmentID(createdAssessment.ID)
			require.NoError(t, err)

			assert.Equal(t, len(listBefore)-1, len(listAfter))
		})

		t.Run("SoftDeleteSubmission_NotFound", func(t *testing.T) {
			err := submissionRepo.SoftDeleteSubmission(uuid.New())
			require.Error(t, err)
		})
	})
}
