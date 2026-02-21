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

func TestApplicationRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("apptest@example.com", "App Test User", string(hashedPassword))
	require.NoError(t, err)

	testUser2, err := userRepo.CreateUser("apptest2@example.com", "App Test User 2", string(hashedPassword))
	require.NoError(t, err)

	testCompany := testutil.CreateTestCompany("App Test Co", "apptestco.com")
	createdCompany, err := companyRepo.CreateCompany(testCompany)
	require.NoError(t, err)

	testJob := testutil.CreateTestJob(createdCompany.ID, "Software Engineer", "Build things")
	createdJob, err := jobRepo.CreateJob(testUser.ID, testJob)
	require.NoError(t, err)

	var statusID uuid.UUID
	err = db.Get(&statusID, "SELECT id FROM application_status LIMIT 1")
	require.NoError(t, err)

	t.Run("CreateApplication", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			notes := "Excited about this role"
			app := &models.Application{
				JobID:               createdJob.ID,
				ApplicationStatusID: statusID,
				OfferReceived:       false,
				AttemptNumber:       1,
				Notes:               &notes,
			}

			created, err := applicationRepo.CreateApplication(testUser.ID, app)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.NotEqual(t, uuid.Nil, created.ID)
			assert.Equal(t, testUser.ID, created.UserID)
			assert.Equal(t, createdJob.ID, created.JobID)
			assert.Equal(t, statusID, created.ApplicationStatusID)
			assert.False(t, created.OfferReceived)
			assert.Equal(t, 1, created.AttemptNumber)
			assert.Equal(t, &notes, created.Notes)
			assert.False(t, created.CreatedAt.IsZero())
			assert.False(t, created.UpdatedAt.IsZero())
		})
	})

	createdApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
	createdApp, err = applicationRepo.CreateApplication(testUser.ID, createdApp)
	require.NoError(t, err)

	createdApp2 := testutil.CreateTestApplication(testUser2.ID, createdJob.ID, statusID)
	_, err = applicationRepo.CreateApplication(testUser2.ID, createdApp2)
	require.NoError(t, err)

	t.Run("GetApplicationByID", func(t *testing.T) {
		t.Run("Found", func(t *testing.T) {
			retrieved, err := applicationRepo.GetApplicationByID(createdApp.ID, testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, retrieved)
			assert.Equal(t, createdApp.ID, retrieved.ID)
			assert.Equal(t, testUser.ID, retrieved.UserID)
			assert.Equal(t, createdJob.ID, retrieved.JobID)
		})

		t.Run("NotFound", func(t *testing.T) {
			retrieved, err := applicationRepo.GetApplicationByID(uuid.New(), testUser.ID)

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			retrieved, err := applicationRepo.GetApplicationByID(createdApp.ID, testUser2.ID)

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})
	})

	t.Run("UpdateApplication", func(t *testing.T) {
		t.Run("PartialUpdate", func(t *testing.T) {
			updates := map[string]any{
				"offer_received": true,
				"attempt_number": 2,
			}

			updated, err := applicationRepo.UpdateApplication(createdApp.ID, testUser.ID, updates)

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.True(t, updated.OfferReceived)
			assert.Equal(t, 2, updated.AttemptNumber)
			assert.Equal(t, createdApp.JobID, updated.JobID)
		})

		t.Run("EmptyUpdates", func(t *testing.T) {
			updated, err := applicationRepo.UpdateApplication(createdApp.ID, testUser.ID, map[string]any{})

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.Equal(t, createdApp.ID, updated.ID)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			updates := map[string]any{"offer_received": true}

			updated, err := applicationRepo.UpdateApplication(createdApp.ID, testUser2.ID, updates)

			require.Error(t, err)
			assert.Nil(t, updated)
		})
	})

	t.Run("SoftDeleteApplication", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			toDelete := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
			toDelete, err := applicationRepo.CreateApplication(testUser.ID, toDelete)
			require.NoError(t, err)

			err = applicationRepo.SoftDeleteApplication(toDelete.ID, testUser.ID)
			require.NoError(t, err)

			retrieved, err := applicationRepo.GetApplicationByID(toDelete.ID, testUser.ID)
			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			toDelete := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
			toDelete, err := applicationRepo.CreateApplication(testUser.ID, toDelete)
			require.NoError(t, err)

			err = applicationRepo.SoftDeleteApplication(toDelete.ID, testUser2.ID)
			require.Error(t, err)

			retrieved, err := applicationRepo.GetApplicationByID(toDelete.ID, testUser.ID)
			require.NoError(t, err)
			assert.NotNil(t, retrieved)
		})

		t.Run("NotFound", func(t *testing.T) {
			err := applicationRepo.SoftDeleteApplication(uuid.New(), testUser.ID)
			require.Error(t, err)
		})
	})

	t.Run("GetApplicationsByUser", func(t *testing.T) {
		t.Run("ReturnsResults", func(t *testing.T) {
			filters := &ApplicationFilters{Limit: 50, Offset: 0}
			apps, err := applicationRepo.GetApplicationsByUser(testUser.ID, filters)

			require.NoError(t, err)
			assert.NotEmpty(t, apps)

			for _, a := range apps {
				assert.Equal(t, testUser.ID, a.UserID)
			}
		})

		t.Run("RespectsUserScoping", func(t *testing.T) {
			filtersUser1 := &ApplicationFilters{Limit: 50, Offset: 0}
			appsUser1, err := applicationRepo.GetApplicationsByUser(testUser.ID, filtersUser1)
			require.NoError(t, err)

			filtersUser2 := &ApplicationFilters{Limit: 50, Offset: 0}
			appsUser2, err := applicationRepo.GetApplicationsByUser(testUser2.ID, filtersUser2)
			require.NoError(t, err)

			for _, a := range appsUser1 {
				assert.Equal(t, testUser.ID, a.UserID)
			}
			for _, a := range appsUser2 {
				assert.Equal(t, testUser2.ID, a.UserID)
			}
		})

		t.Run("PaginationLimit", func(t *testing.T) {
			filters := &ApplicationFilters{Limit: 1, Offset: 0}
			apps, err := applicationRepo.GetApplicationsByUser(testUser.ID, filters)

			require.NoError(t, err)
			assert.LessOrEqual(t, len(apps), 1)
		})

		t.Run("PaginationOffset", func(t *testing.T) {
			allFilters := &ApplicationFilters{Limit: 50, Offset: 0}
			allApps, err := applicationRepo.GetApplicationsByUser(testUser.ID, allFilters)
			require.NoError(t, err)

			if len(allApps) > 1 {
				offsetFilters := &ApplicationFilters{Limit: 50, Offset: 1}
				offsetApps, err := applicationRepo.GetApplicationsByUser(testUser.ID, offsetFilters)
				require.NoError(t, err)

				assert.Equal(t, len(allApps)-1, len(offsetApps))
			}
		})

		t.Run("EmptyForNewUser", func(t *testing.T) {
			newUser, err := userRepo.CreateUser("noappuser@example.com", "No Apps", string(hashedPassword))
			require.NoError(t, err)

			filters := &ApplicationFilters{Limit: 50, Offset: 0}
			apps, err := applicationRepo.GetApplicationsByUser(newUser.ID, filters)

			require.NoError(t, err)
			assert.Empty(t, apps)
		})
	})

	t.Run("GetApplicationCount", func(t *testing.T) {
		t.Run("ReturnsCorrectCount", func(t *testing.T) {
			filters := &ApplicationFilters{Limit: 50, Offset: 0}
			apps, err := applicationRepo.GetApplicationsByUser(testUser.ID, filters)
			require.NoError(t, err)

			count, err := applicationRepo.GetApplicationCount(testUser.ID, nil)

			require.NoError(t, err)
			assert.Equal(t, len(apps), count)
		})

		t.Run("ZeroForNewUser", func(t *testing.T) {
			newUser, err := userRepo.CreateUser("countuser@example.com", "Count User", string(hashedPassword))
			require.NoError(t, err)

			count, err := applicationRepo.GetApplicationCount(newUser.ID, nil)

			require.NoError(t, err)
			assert.Equal(t, 0, count)
		})
	})

	t.Run("GetApplicationsByStatus", func(t *testing.T) {
		t.Run("ReturnsStatusCounts", func(t *testing.T) {
			statusCounts, err := applicationRepo.GetApplicationsByStatus(testUser.ID)

			require.NoError(t, err)
			assert.NotEmpty(t, statusCounts)

			totalFromStatus := 0
			for _, count := range statusCounts {
				assert.Greater(t, count, 0)
				totalFromStatus += count
			}

			totalCount, err := applicationRepo.GetApplicationCount(testUser.ID, nil)
			require.NoError(t, err)
			assert.Equal(t, totalCount, totalFromStatus)
		})

		t.Run("EmptyForNewUser", func(t *testing.T) {
			newUser, err := userRepo.CreateUser("statususer@example.com", "Status User", string(hashedPassword))
			require.NoError(t, err)

			statusCounts, err := applicationRepo.GetApplicationsByStatus(newUser.ID)

			require.NoError(t, err)
			assert.Empty(t, statusCounts)
		})
	})

	t.Run("GetApplicationStatuses", func(t *testing.T) {
		t.Run("ReturnsAllStatuses", func(t *testing.T) {
			statuses, err := applicationRepo.GetApplicationStatuses()

			require.NoError(t, err)
			assert.Len(t, statuses, 5)

			for _, s := range statuses {
				assert.NotEqual(t, uuid.Nil, s.ID)
				assert.NotEmpty(t, s.Name)
				assert.False(t, s.CreatedAt.IsZero())
			}
		})
	})

	t.Run("GetApplicationsWithDetails", func(t *testing.T) {
		t.Run("ReturnsResults", func(t *testing.T) {
			filters := &ApplicationFilters{Limit: 50, Offset: 0}
			apps, err := applicationRepo.GetApplicationsWithDetails(testUser.ID, filters)

			require.NoError(t, err)
			assert.NotEmpty(t, apps)
			for _, a := range apps {
				assert.Equal(t, testUser.ID, a.UserID)
				assert.NotNil(t, a.Company)
				assert.NotNil(t, a.Job)
				assert.NotNil(t, a.Status)
			}
		})

		t.Run("EmptyForNewUser", func(t *testing.T) {
			newUser, err := userRepo.CreateUser("detailsuser@example.com", "Details User", string(hashedPassword))
			require.NoError(t, err)

			filters := &ApplicationFilters{Limit: 50, Offset: 0}
			apps, err := applicationRepo.GetApplicationsWithDetails(newUser.ID, filters)

			require.NoError(t, err)
			assert.Empty(t, apps)
		})
	})

	t.Run("GetApplicationByIDWithDetails", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			app, err := applicationRepo.GetApplicationByIDWithDetails(createdApp.ID, testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, app)
			assert.Equal(t, createdApp.ID, app.ID)
			assert.NotNil(t, app.Company)
			assert.NotNil(t, app.Job)
		})

		t.Run("NotFound", func(t *testing.T) {
			app, err := applicationRepo.GetApplicationByIDWithDetails(uuid.New(), testUser.ID)

			require.Error(t, err)
			assert.Nil(t, app)
		})
	})

	t.Run("GetRecentApplications", func(t *testing.T) {
		t.Run("ReturnsResults", func(t *testing.T) {
			apps, err := applicationRepo.GetRecentApplications(testUser.ID, 5)

			require.NoError(t, err)
			assert.NotEmpty(t, apps)
			assert.LessOrEqual(t, len(apps), 5)
		})

		t.Run("EmptyForNewUser", func(t *testing.T) {
			newUser, err := userRepo.CreateUser("recentuser@example.com", "Recent User", string(hashedPassword))
			require.NoError(t, err)

			apps, err := applicationRepo.GetRecentApplications(newUser.ID, 5)

			require.NoError(t, err)
			assert.Empty(t, apps)
		})
	})

	t.Run("GetApplicationStatusIDByName", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			id, err := applicationRepo.GetApplicationStatusIDByName("Applied")

			require.NoError(t, err)
			assert.NotEqual(t, uuid.Nil, id)
		})

		t.Run("NotFound", func(t *testing.T) {
			_, err := applicationRepo.GetApplicationStatusIDByName("NonexistentStatus")

			require.Error(t, err)
		})
	})

	t.Run("GetApplicationStatusCached", func(t *testing.T) {
		t.Run("ReturnsStatuses", func(t *testing.T) {
			statuses, err := applicationRepo.GetApplicationStatusCached()

			require.NoError(t, err)
			assert.Len(t, statuses, 5)
		})

		t.Run("ReturnsCachedOnSecondCall", func(t *testing.T) {
			statuses1, err := applicationRepo.GetApplicationStatusCached()
			require.NoError(t, err)

			statuses2, err := applicationRepo.GetApplicationStatusCached()
			require.NoError(t, err)

			assert.Equal(t, len(statuses1), len(statuses2))
		})
	})

	t.Run("InvalidateStatusCache", func(t *testing.T) {
		_, _ = applicationRepo.GetApplicationStatusCached()
		applicationRepo.InvalidateStatusCache()

		statuses, err := applicationRepo.GetApplicationStatusCached()
		require.NoError(t, err)
		assert.Len(t, statuses, 5)
	})

	t.Run("UpdateApplicationStatus", func(t *testing.T) {
		statuses, err := applicationRepo.GetApplicationStatuses()
		require.NoError(t, err)
		require.GreaterOrEqual(t, len(statuses), 2)

		var differentStatusID uuid.UUID
		for _, s := range statuses {
			if s.ID != statusID {
				differentStatusID = s.ID
				break
			}
		}
		require.NotEqual(t, uuid.Nil, differentStatusID)

		t.Run("Success", func(t *testing.T) {
			statusApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
			statusApp, err := applicationRepo.CreateApplication(testUser.ID, statusApp)
			require.NoError(t, err)

			err = applicationRepo.UpdateApplicationStatus(statusApp.ID, testUser.ID, differentStatusID)
			require.NoError(t, err)

			retrieved, err := applicationRepo.GetApplicationByID(statusApp.ID, testUser.ID)
			require.NoError(t, err)
			assert.Equal(t, differentStatusID, retrieved.ApplicationStatusID)
		})

		t.Run("WrongUserID", func(t *testing.T) {
			statusApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
			statusApp, err := applicationRepo.CreateApplication(testUser.ID, statusApp)
			require.NoError(t, err)

			err = applicationRepo.UpdateApplicationStatus(statusApp.ID, testUser2.ID, differentStatusID)
			require.Error(t, err)

			retrieved, err := applicationRepo.GetApplicationByID(statusApp.ID, testUser.ID)
			require.NoError(t, err)
			assert.Equal(t, statusID, retrieved.ApplicationStatusID)
		})
	})
}
