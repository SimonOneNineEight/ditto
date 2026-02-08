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

func TestCalculateCountdown(t *testing.T) {
	today := time.Date(2026, 2, 6, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name            string
		dueDate         time.Time
		expectedUrgency string
		expectedText    string
		expectedDays    int
	}{
		{
			name:            "Overdue by 1 day",
			dueDate:         time.Date(2026, 2, 5, 0, 0, 0, 0, time.UTC),
			expectedUrgency: UrgencyOverdue,
			expectedText:    "1 day overdue",
			expectedDays:    -1,
		},
		{
			name:            "Overdue by 3 days",
			dueDate:         time.Date(2026, 2, 3, 0, 0, 0, 0, time.UTC),
			expectedUrgency: UrgencyOverdue,
			expectedText:    "3 days overdue",
			expectedDays:    -3,
		},
		{
			name:            "Due today",
			dueDate:         time.Date(2026, 2, 6, 0, 0, 0, 0, time.UTC),
			expectedUrgency: UrgencyToday,
			expectedText:    "Today",
			expectedDays:    0,
		},
		{
			name:            "Due tomorrow (upcoming)",
			dueDate:         time.Date(2026, 2, 7, 0, 0, 0, 0, time.UTC),
			expectedUrgency: UrgencyUpcoming,
			expectedText:    "Tomorrow",
			expectedDays:    1,
		},
		{
			name:            "Due in 2 days (upcoming)",
			dueDate:         time.Date(2026, 2, 8, 0, 0, 0, 0, time.UTC),
			expectedUrgency: UrgencyUpcoming,
			expectedText:    "In 2 days",
			expectedDays:    2,
		},
		{
			name:            "Due in 3 days (upcoming)",
			dueDate:         time.Date(2026, 2, 9, 0, 0, 0, 0, time.UTC),
			expectedUrgency: UrgencyUpcoming,
			expectedText:    "In 3 days",
			expectedDays:    3,
		},
		{
			name:            "Due in 4 days (scheduled)",
			dueDate:         time.Date(2026, 2, 10, 0, 0, 0, 0, time.UTC),
			expectedUrgency: UrgencyScheduled,
			expectedText:    "In 4 days",
			expectedDays:    4,
		},
		{
			name:            "Due in 10 days (scheduled)",
			dueDate:         time.Date(2026, 2, 16, 0, 0, 0, 0, time.UTC),
			expectedUrgency: UrgencyScheduled,
			expectedText:    "In 10 days",
			expectedDays:    10,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			countdown := CalculateCountdown(tt.dueDate, today)

			assert.Equal(t, tt.expectedUrgency, countdown.Urgency)
			assert.Equal(t, tt.expectedText, countdown.Text)
			assert.Equal(t, tt.expectedDays, countdown.DaysUntil)
		})
	}
}

func TestDashboardRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	dashboardRepo := NewDashboardRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	uniqueID := uuid.New().String()[:8]
	testUser, err := userRepo.CreateUser("dashboard-"+uniqueID+"@example.com", "Dashboard Test User", string(hashedPassword))
	require.NoError(t, err)

	testUser2, err := userRepo.CreateUser("dashboard2-"+uniqueID+"@example.com", "Dashboard Test User 2", string(hashedPassword))
	require.NoError(t, err)

	testCompany := testutil.CreateTestCompany("Dashboard Co", "dashboardco.com")
	createdCompany, err := companyRepo.CreateCompany(testCompany)
	require.NoError(t, err)

	testJob := testutil.CreateTestJob(createdCompany.ID, "Engineer", "Description")
	createdJob, err := jobRepo.CreateJob(testUser.ID, testJob)
	require.NoError(t, err)

	// Get all status IDs
	var appliedStatusID, savedStatusID, interviewStatusID, offerStatusID, rejectedStatusID uuid.UUID
	err = db.Get(&appliedStatusID, "SELECT id FROM application_status WHERE name = 'Applied' LIMIT 1")
	require.NoError(t, err, "Applied status should exist")
	err = db.Get(&savedStatusID, "SELECT id FROM application_status WHERE name = 'Saved' LIMIT 1")
	require.NoError(t, err, "Saved status should exist")
	err = db.Get(&interviewStatusID, "SELECT id FROM application_status WHERE name = 'Interview' LIMIT 1")
	require.NoError(t, err, "Interview status should exist")
	err = db.Get(&offerStatusID, "SELECT id FROM application_status WHERE name = 'Offer' LIMIT 1")
	require.NoError(t, err, "Offer status should exist")
	err = db.Get(&rejectedStatusID, "SELECT id FROM application_status WHERE name = 'Rejected' LIMIT 1")
	require.NoError(t, err, "Rejected status should exist")

	t.Run("GetStats", func(t *testing.T) {
		t.Run("ReturnsZerosForUserWithNoApplications", func(t *testing.T) {
			stats, err := dashboardRepo.GetStats(testUser2.ID)

			require.NoError(t, err)
			require.NotNil(t, stats)
			assert.Equal(t, 0, stats.TotalApplications)
			assert.Equal(t, 0, stats.ActiveApplications)
			assert.Equal(t, 0, stats.InterviewCount)
			assert.Equal(t, 0, stats.OfferCount)
			assert.Equal(t, 0, stats.StatusCounts["saved"])
			assert.Equal(t, 0, stats.StatusCounts["applied"])
			assert.Equal(t, 0, stats.StatusCounts["interview"])
			assert.Equal(t, 0, stats.StatusCounts["offer"])
			assert.Equal(t, 0, stats.StatusCounts["rejected"])
			assert.False(t, stats.UpdatedAt.IsZero())
		})

		t.Run("ReturnsCorrectCountsForUserWithMultipleStatuses", func(t *testing.T) {
			// Create applications with different statuses
			// 2 saved, 3 applied, 1 interview, 1 offer, 1 rejected
			for i := 0; i < 2; i++ {
				app := &models.Application{
					UserID:              testUser.ID,
					JobID:               createdJob.ID,
					ApplicationStatusID: savedStatusID,
					AppliedAt:           time.Now(),
					AttemptNumber:       1,
				}
				_, err := applicationRepo.CreateApplication(testUser.ID, app)
				require.NoError(t, err)
			}

			for i := 0; i < 3; i++ {
				app := &models.Application{
					UserID:              testUser.ID,
					JobID:               createdJob.ID,
					ApplicationStatusID: appliedStatusID,
					AppliedAt:           time.Now(),
					AttemptNumber:       1,
				}
				_, err := applicationRepo.CreateApplication(testUser.ID, app)
				require.NoError(t, err)
			}

			interviewApp := &models.Application{
				UserID:              testUser.ID,
				JobID:               createdJob.ID,
				ApplicationStatusID: interviewStatusID,
				AppliedAt:           time.Now(),
				AttemptNumber:       1,
			}
			_, err := applicationRepo.CreateApplication(testUser.ID, interviewApp)
			require.NoError(t, err)

			offerApp := &models.Application{
				UserID:              testUser.ID,
				JobID:               createdJob.ID,
				ApplicationStatusID: offerStatusID,
				AppliedAt:           time.Now(),
				AttemptNumber:       1,
			}
			_, err = applicationRepo.CreateApplication(testUser.ID, offerApp)
			require.NoError(t, err)

			rejectedApp := &models.Application{
				UserID:              testUser.ID,
				JobID:               createdJob.ID,
				ApplicationStatusID: rejectedStatusID,
				AppliedAt:           time.Now(),
				AttemptNumber:       1,
			}
			_, err = applicationRepo.CreateApplication(testUser.ID, rejectedApp)
			require.NoError(t, err)

			// Invalidate cache to force fresh query
			dashboardRepo.InvalidateCache(testUser.ID)

			stats, err := dashboardRepo.GetStats(testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, stats)
			assert.Equal(t, 8, stats.TotalApplications)
			assert.Equal(t, 6, stats.ActiveApplications) // saved(2) + applied(3) + interview(1)
			assert.Equal(t, 1, stats.InterviewCount)
			assert.Equal(t, 1, stats.OfferCount)
			assert.Equal(t, 2, stats.StatusCounts["saved"])
			assert.Equal(t, 3, stats.StatusCounts["applied"])
			assert.Equal(t, 1, stats.StatusCounts["interview"])
			assert.Equal(t, 1, stats.StatusCounts["offer"])
			assert.Equal(t, 1, stats.StatusCounts["rejected"])
		})

		t.Run("DoesNotIncludeSoftDeletedApplications", func(t *testing.T) {
			// Get current count
			dashboardRepo.InvalidateCache(testUser.ID)
			statsBefore, err := dashboardRepo.GetStats(testUser.ID)
			require.NoError(t, err)
			countBefore := statsBefore.TotalApplications

			// Create and soft-delete an application
			appToDelete := &models.Application{
				UserID:              testUser.ID,
				JobID:               createdJob.ID,
				ApplicationStatusID: appliedStatusID,
				AppliedAt:           time.Now(),
				AttemptNumber:       1,
			}
			created, err := applicationRepo.CreateApplication(testUser.ID, appToDelete)
			require.NoError(t, err)

			err = applicationRepo.SoftDeleteApplication(created.ID, testUser.ID)
			require.NoError(t, err)

			dashboardRepo.InvalidateCache(testUser.ID)
			statsAfter, err := dashboardRepo.GetStats(testUser.ID)

			require.NoError(t, err)
			assert.Equal(t, countBefore, statsAfter.TotalApplications)
		})

		t.Run("DoesNotIncludeOtherUsersApplications", func(t *testing.T) {
			// Create application for user2
			appForUser2 := &models.Application{
				UserID:              testUser2.ID,
				JobID:               createdJob.ID,
				ApplicationStatusID: appliedStatusID,
				AppliedAt:           time.Now(),
				AttemptNumber:       1,
			}
			_, err := applicationRepo.CreateApplication(testUser2.ID, appForUser2)
			require.NoError(t, err)

			// User2 should only have 1 application
			dashboardRepo.InvalidateCache(testUser2.ID)
			stats, err := dashboardRepo.GetStats(testUser2.ID)

			require.NoError(t, err)
			assert.Equal(t, 1, stats.TotalApplications)
		})
	})

	t.Run("GetUpcomingItems", func(t *testing.T) {
		interviewRepo := NewInterviewRepository(db.Database)
		assessmentRepo := NewAssessmentRepository(db.Database)

		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

		// Create fresh application for upcoming items tests
		upcomingApp := &models.Application{
			UserID:              testUser.ID,
			JobID:               createdJob.ID,
			ApplicationStatusID: appliedStatusID,
			AppliedAt:           time.Now(),
			AttemptNumber:       1,
		}
		createdApp, err := applicationRepo.CreateApplication(testUser.ID, upcomingApp)
		require.NoError(t, err)

		t.Run("ReturnsEmptyArrayWhenNoUpcomingItems", func(t *testing.T) {
			items, err := dashboardRepo.GetUpcomingItems(testUser2.ID, 4, "all")

			require.NoError(t, err)
			assert.NotNil(t, items)
			assert.Len(t, items, 0)
		})

		t.Run("ReturnsInterviewsWithCorrectDetails", func(t *testing.T) {
			interview := testutil.CreateTestInterview(testUser.ID, createdApp.ID, today.AddDate(0, 0, 5), models.InterviewTypeTechnical)
			_, err := interviewRepo.CreateInterview(interview)
			require.NoError(t, err)

			items, err := dashboardRepo.GetUpcomingItems(testUser.ID, 10, "interviews")

			require.NoError(t, err)
			require.Greater(t, len(items), 0)

			found := false
			for _, item := range items {
				if item.ID == interview.ID {
					found = true
					assert.Equal(t, "interview", item.Type)
					assert.Contains(t, item.Title, "Technical")
					assert.Equal(t, "Dashboard Co", item.CompanyName)
					assert.Equal(t, "Engineer", item.JobTitle)
					assert.Equal(t, UrgencyScheduled, item.Countdown.Urgency)
					assert.GreaterOrEqual(t, item.Countdown.DaysUntil, 4)
					assert.Contains(t, item.Link, "/interviews/")
					break
				}
			}
			assert.True(t, found, "Interview should be in results")
		})

		t.Run("ReturnsAssessmentsWithCorrectDetails", func(t *testing.T) {
			assessment := testutil.CreateTestAssessment(testUser.ID, createdApp.ID, today.AddDate(0, 0, 2).Format("2006-01-02"), models.AssessmentStatusInProgress)
			_, err := assessmentRepo.CreateAssessment(assessment)
			require.NoError(t, err)

			items, err := dashboardRepo.GetUpcomingItems(testUser.ID, 10, "assessments")

			require.NoError(t, err)
			require.Greater(t, len(items), 0)

			found := false
			for _, item := range items {
				if item.ID == assessment.ID {
					found = true
					assert.Equal(t, "assessment", item.Type)
					assert.Equal(t, "Take-Home Project", item.Title)
					assert.Equal(t, "Dashboard Co", item.CompanyName)
					assert.Equal(t, "Engineer", item.JobTitle)
					assert.Equal(t, UrgencyUpcoming, item.Countdown.Urgency)
					assert.Contains(t, item.Link, "/assessments/")
					break
				}
			}
			assert.True(t, found, "Assessment should be in results")
		})

		t.Run("ExcludesSubmittedAssessments", func(t *testing.T) {
			submittedAssessment := testutil.CreateTestAssessment(testUser.ID, createdApp.ID, today.AddDate(0, 0, 3).Format("2006-01-02"), models.AssessmentStatusSubmitted)
			_, err := assessmentRepo.CreateAssessment(submittedAssessment)
			require.NoError(t, err)

			items, err := dashboardRepo.GetUpcomingItems(testUser.ID, 10, "assessments")

			require.NoError(t, err)
			for _, item := range items {
				assert.NotEqual(t, submittedAssessment.ID, item.ID, "Submitted assessment should not appear")
			}
		})

		t.Run("SortsOverdueItemsFirst", func(t *testing.T) {
			// Create overdue interview
			overdueInterview := testutil.CreateTestInterview(testUser.ID, createdApp.ID, today.AddDate(0, 0, -2), models.InterviewTypePhoneScreen)
			_, err := interviewRepo.CreateInterview(overdueInterview)
			require.NoError(t, err)

			// Create future interview
			futureInterview := testutil.CreateTestInterview(testUser.ID, createdApp.ID, today.AddDate(0, 0, 5), models.InterviewTypeBehavioral)
			_, err = interviewRepo.CreateInterview(futureInterview)
			require.NoError(t, err)

			items, err := dashboardRepo.GetUpcomingItems(testUser.ID, 10, "all")

			require.NoError(t, err)
			require.Greater(t, len(items), 1)

			// Find overdue item - should be near the beginning
			overdueIdx := -1
			futureIdx := -1
			for i, item := range items {
				if item.ID == overdueInterview.ID {
					overdueIdx = i
				}
				if item.ID == futureInterview.ID {
					futureIdx = i
				}
			}

			if overdueIdx >= 0 && futureIdx >= 0 {
				assert.Less(t, overdueIdx, futureIdx, "Overdue items should appear before future items")
			}
		})

		t.Run("RespectsLimitParameter", func(t *testing.T) {
			items, err := dashboardRepo.GetUpcomingItems(testUser.ID, 2, "all")

			require.NoError(t, err)
			assert.LessOrEqual(t, len(items), 2)
		})

		t.Run("FiltersInterviewsOnly", func(t *testing.T) {
			items, err := dashboardRepo.GetUpcomingItems(testUser.ID, 10, "interviews")

			require.NoError(t, err)
			for _, item := range items {
				assert.Equal(t, "interview", item.Type)
			}
		})

		t.Run("FiltersAssessmentsOnly", func(t *testing.T) {
			items, err := dashboardRepo.GetUpcomingItems(testUser.ID, 10, "assessments")

			require.NoError(t, err)
			for _, item := range items {
				assert.Equal(t, "assessment", item.Type)
			}
		})

		t.Run("DoesNotIncludeOtherUsersItems", func(t *testing.T) {
			// Create application for user2
			user2App := &models.Application{
				UserID:              testUser2.ID,
				JobID:               createdJob.ID,
				ApplicationStatusID: appliedStatusID,
				AppliedAt:           time.Now(),
				AttemptNumber:       1,
			}
			createdUser2App, err := applicationRepo.CreateApplication(testUser2.ID, user2App)
			require.NoError(t, err)

			// Create interview for user2
			user2Interview := testutil.CreateTestInterview(testUser2.ID, createdUser2App.ID, today.AddDate(0, 0, 1), models.InterviewTypeTechnical)
			_, err = interviewRepo.CreateInterview(user2Interview)
			require.NoError(t, err)

			// Query for user1 - should not see user2's interview
			items, err := dashboardRepo.GetUpcomingItems(testUser.ID, 10, "all")

			require.NoError(t, err)
			for _, item := range items {
				assert.NotEqual(t, user2Interview.ID, item.ID)
			}
		})
	})

	t.Run("Caching", func(t *testing.T) {
		t.Run("ReturnsCachedResultWithin5Minutes", func(t *testing.T) {
			dashboardRepo.InvalidateCache(testUser.ID)

			// First call - hits database
			stats1, err := dashboardRepo.GetStats(testUser.ID)
			require.NoError(t, err)

			// Create another application
			newApp := &models.Application{
				UserID:              testUser.ID,
				JobID:               createdJob.ID,
				ApplicationStatusID: appliedStatusID,
				AppliedAt:           time.Now(),
				AttemptNumber:       1,
			}
			_, err = applicationRepo.CreateApplication(testUser.ID, newApp)
			require.NoError(t, err)

			// Second call - should return cached result (same count)
			stats2, err := dashboardRepo.GetStats(testUser.ID)
			require.NoError(t, err)
			assert.Equal(t, stats1.TotalApplications, stats2.TotalApplications)
		})

		t.Run("InvalidateCacheForcesRefresh", func(t *testing.T) {
			dashboardRepo.InvalidateCache(testUser.ID)
			stats1, err := dashboardRepo.GetStats(testUser.ID)
			require.NoError(t, err)

			// Create another application
			newApp := &models.Application{
				UserID:              testUser.ID,
				JobID:               createdJob.ID,
				ApplicationStatusID: appliedStatusID,
				AppliedAt:           time.Now(),
				AttemptNumber:       1,
			}
			_, err = applicationRepo.CreateApplication(testUser.ID, newApp)
			require.NoError(t, err)

			// Invalidate cache
			dashboardRepo.InvalidateCache(testUser.ID)

			// Now should get updated count
			stats2, err := dashboardRepo.GetStats(testUser.ID)
			require.NoError(t, err)
			assert.Equal(t, stats1.TotalApplications+1, stats2.TotalApplications)
		})
	})
}
