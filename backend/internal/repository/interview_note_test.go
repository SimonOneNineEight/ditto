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

func TestInterviewNoteRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	interviewRepo := NewInterviewRepository(db.Database)
	noteRepo := NewInterviewNoteRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("notetest@example.com", "Note Test User", string(hashedPassword))
	require.NoError(t, err)

	testCompany := testutil.CreateTestCompany("Note Co", "noteco.com")
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

	t.Run("CreateInterviewNote", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			content := "Research the company values and mission"
			note := &models.InterviewNote{
				InterviewID: createdInterview.ID,
				NoteType:    models.NoteTypePreparation,
				Content:     &content,
			}

			created, err := noteRepo.CreateInterviewNote(note)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.NotEqual(t, uuid.Nil, created.ID)
			assert.Equal(t, createdInterview.ID, created.InterviewID)
			assert.Equal(t, models.NoteTypePreparation, created.NoteType)
			assert.Equal(t, &content, created.Content)
			assert.False(t, created.CreatedAt.IsZero())
		})

		t.Run("WithoutContent", func(t *testing.T) {
			note := &models.InterviewNote{
				InterviewID: createdInterview.ID,
				NoteType:    models.NoteTypeGeneral,
			}

			created, err := noteRepo.CreateInterviewNote(note)

			require.NoError(t, err)
			assert.Nil(t, created.Content)
		})
	})

	t.Run("GetInterviewNoteByID", func(t *testing.T) {
		content := "Test note for GetByID"
		note := &models.InterviewNote{
			InterviewID: createdInterview.ID,
			NoteType:    models.NoteTypeFeedback,
			Content:     &content,
		}
		created, err := noteRepo.CreateInterviewNote(note)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			retrieved, err := noteRepo.GetInterviewNoteByID(created.ID)

			require.NoError(t, err)
			require.NotNil(t, retrieved)
			assert.Equal(t, created.ID, retrieved.ID)
			assert.Equal(t, models.NoteTypeFeedback, retrieved.NoteType)
		})

		t.Run("NotFound", func(t *testing.T) {
			retrieved, err := noteRepo.GetInterviewNoteByID(uuid.New())

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})
	})

	t.Run("UpdateInterviewNote", func(t *testing.T) {
		content := "Original content"
		note := &models.InterviewNote{
			InterviewID: createdInterview.ID,
			NoteType:    models.NoteTypeReflection,
			Content:     &content,
		}
		created, err := noteRepo.CreateInterviewNote(note)
		require.NoError(t, err)

		t.Run("UpdateContent", func(t *testing.T) {
			updates := map[string]any{
				"content": "Updated reflection content",
			}

			updated, err := noteRepo.UpdateInterviewNote(created.ID, updates)

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.Equal(t, "Updated reflection content", *updated.Content)
		})

		t.Run("EmptyUpdates", func(t *testing.T) {
			updated, err := noteRepo.UpdateInterviewNote(created.ID, map[string]any{})

			require.NoError(t, err)
			require.NotNil(t, updated)
		})

		t.Run("NotFound", func(t *testing.T) {
			updates := map[string]any{"content": "Ghost"}

			updated, err := noteRepo.UpdateInterviewNote(uuid.New(), updates)

			require.Error(t, err)
			assert.Nil(t, updated)
		})
	})

	t.Run("GetInterviewNotesByInterviewID", func(t *testing.T) {
		t.Run("ReturnsAllNotes", func(t *testing.T) {
			notes, err := noteRepo.GetInterviewNotesByInterviewID(createdInterview.ID)

			require.NoError(t, err)
			assert.NotEmpty(t, notes)
			for _, n := range notes {
				assert.Equal(t, createdInterview.ID, n.InterviewID)
			}
		})

		t.Run("EmptyForNoNotes", func(t *testing.T) {
			iv := &models.Interview{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				ScheduledDate: futureDate,
				InterviewType: models.InterviewTypeBehavioral,
			}
			emptyIv, err := interviewRepo.CreateInterview(iv)
			require.NoError(t, err)

			notes, err := noteRepo.GetInterviewNotesByInterviewID(emptyIv.ID)

			require.NoError(t, err)
			assert.Empty(t, notes)
		})
	})

	t.Run("SoftDeleteInterviewNote", func(t *testing.T) {
		content := "Delete me"
		note := &models.InterviewNote{
			InterviewID: createdInterview.ID,
			NoteType:    models.NoteTypeGeneral,
			Content:     &content,
		}
		created, err := noteRepo.CreateInterviewNote(note)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			err := noteRepo.SoftDeleteInterviewNote(created.ID)
			require.NoError(t, err)

			retrieved, err := noteRepo.GetInterviewNoteByID(created.ID)
			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("NotFound", func(t *testing.T) {
			err := noteRepo.SoftDeleteInterviewNote(uuid.New())
			require.Error(t, err)
		})
	})

	t.Run("GetNoteByInterviewAndType", func(t *testing.T) {
		iv := &models.Interview{
			UserID:        testUser.ID,
			ApplicationID: createdApp.ID,
			ScheduledDate: futureDate,
			InterviewType: models.InterviewTypePanel,
		}
		isolatedIv, err := interviewRepo.CreateInterview(iv)
		require.NoError(t, err)

		content := "Company research notes"
		note := &models.InterviewNote{
			InterviewID: isolatedIv.ID,
			NoteType:    models.NoteTypeCompanyResearch,
			Content:     &content,
		}
		_, err = noteRepo.CreateInterviewNote(note)
		require.NoError(t, err)

		t.Run("Found", func(t *testing.T) {
			found, err := noteRepo.GetNoteByInterviewAndType(isolatedIv.ID, models.NoteTypeCompanyResearch)

			require.NoError(t, err)
			require.NotNil(t, found)
			assert.Equal(t, models.NoteTypeCompanyResearch, found.NoteType)
			assert.Equal(t, "Company research notes", *found.Content)
		})

		t.Run("NotFoundReturnsNil", func(t *testing.T) {
			found, err := noteRepo.GetNoteByInterviewAndType(isolatedIv.ID, models.NoteTypeFeedback)

			require.NoError(t, err)
			assert.Nil(t, found)
		})
	})

	t.Run("ExcludesDeletedFromList", func(t *testing.T) {
		iv := &models.Interview{
			UserID:        testUser.ID,
			ApplicationID: createdApp.ID,
			ScheduledDate: futureDate,
			InterviewType: models.InterviewTypeOnsite,
		}
		isolatedIv, err := interviewRepo.CreateInterview(iv)
		require.NoError(t, err)

		c1 := "Note 1"
		n1 := &models.InterviewNote{InterviewID: isolatedIv.ID, NoteType: models.NoteTypePreparation, Content: &c1}
		created1, err := noteRepo.CreateInterviewNote(n1)
		require.NoError(t, err)

		c2 := "Note 2"
		n2 := &models.InterviewNote{InterviewID: isolatedIv.ID, NoteType: models.NoteTypeFeedback, Content: &c2}
		_, err = noteRepo.CreateInterviewNote(n2)
		require.NoError(t, err)

		notesBefore, err := noteRepo.GetInterviewNotesByInterviewID(isolatedIv.ID)
		require.NoError(t, err)
		assert.Equal(t, 2, len(notesBefore))

		err = noteRepo.SoftDeleteInterviewNote(created1.ID)
		require.NoError(t, err)

		notesAfter, err := noteRepo.GetInterviewNotesByInterviewID(isolatedIv.ID)
		require.NoError(t, err)
		assert.Equal(t, 1, len(notesAfter))
		assert.Equal(t, models.NoteTypeFeedback, notesAfter[0].NoteType)
	})
}
