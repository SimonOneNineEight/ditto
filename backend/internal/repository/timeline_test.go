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

func TestTimelineRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	interviewRepo := NewInterviewRepository(db.Database)
	assessmentRepo := NewAssessmentRepository(db.Database)
	timelineRepo := NewTimelineRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("timeline@example.com", "Timeline User", string(hashedPassword))
	require.NoError(t, err)

	testCompany := testutil.CreateTestCompany("Timeline Co", "timelineco.com")
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

	// Create interview scheduled for tomorrow
	tomorrow := time.Now().AddDate(0, 0, 1)
	interview := &models.Interview{
		UserID:        testUser.ID,
		ApplicationID: createdApp.ID,
		ScheduledDate: tomorrow,
		InterviewType: models.InterviewTypeTechnical,
	}
	_, err = interviewRepo.CreateInterview(interview)
	require.NoError(t, err)

	// Create assessment due in 3 days
	dueDate := time.Now().AddDate(0, 0, 3).Format("2006-01-02")
	assessment := testutil.CreateTestAssessment(testUser.ID, createdApp.ID, dueDate, "not_started")
	_, err = assessmentRepo.CreateAssessment(assessment)
	require.NoError(t, err)

	t.Run("GetTimelineItems", func(t *testing.T) {
		t.Run("AllTypes", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type:    "all",
				Range:   "all",
				Page:    1,
				PerPage: 20,
			})

			require.NoError(t, err)
			require.NotNil(t, resp)
			assert.GreaterOrEqual(t, len(resp.Items), 2)
			assert.Equal(t, 1, resp.Meta.Page)
			assert.Equal(t, 20, resp.Meta.PerPage)
		})

		t.Run("InterviewsOnly", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type:    "interviews",
				Range:   "all",
				Page:    1,
				PerPage: 20,
			})

			require.NoError(t, err)
			for _, item := range resp.Items {
				assert.Equal(t, "interview", item.Type)
			}
		})

		t.Run("AssessmentsOnly", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type:    "assessments",
				Range:   "all",
				Page:    1,
				PerPage: 20,
			})

			require.NoError(t, err)
			for _, item := range resp.Items {
				assert.Equal(t, "assessment", item.Type)
			}
		})

		t.Run("DefaultPageAndPerPage", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type: "all",
			})

			require.NoError(t, err)
			assert.Equal(t, 1, resp.Meta.Page)
			assert.Equal(t, 20, resp.Meta.PerPage)
		})

		t.Run("WeekRange", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type:    "all",
				Range:   "week",
				Page:    1,
				PerPage: 20,
			})

			require.NoError(t, err)
			require.NotNil(t, resp)
		})

		t.Run("MonthRange", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type:    "all",
				Range:   "month",
				Page:    1,
				PerPage: 20,
			})

			require.NoError(t, err)
			require.NotNil(t, resp)
		})

		t.Run("TodayRange", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type:    "all",
				Range:   "today",
				Page:    1,
				PerPage: 20,
			})

			require.NoError(t, err)
			require.NotNil(t, resp)
		})

		t.Run("EmptyForNewUser", func(t *testing.T) {
			newUser, err := userRepo.CreateUser("empty-timeline@example.com", "Empty User", string(hashedPassword))
			require.NoError(t, err)

			resp, err := timelineRepo.GetTimelineItems(newUser.ID, TimelineFilters{
				Type:    "all",
				Range:   "all",
				Page:    1,
				PerPage: 20,
			})

			require.NoError(t, err)
			assert.Empty(t, resp.Items)
			assert.Equal(t, 0, resp.Meta.TotalItems)
		})

		t.Run("ItemsHaveCorrectFields", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type:    "all",
				Range:   "all",
				Page:    1,
				PerPage: 20,
			})

			require.NoError(t, err)
			for _, item := range resp.Items {
				assert.NotEqual(t, uuid.Nil, item.ID)
				assert.NotEmpty(t, item.Type)
				assert.NotEmpty(t, item.Title)
				assert.NotEmpty(t, item.CompanyName)
				assert.NotEmpty(t, item.Link)
				assert.NotEmpty(t, item.DateGroup)
			}
		})

		t.Run("Pagination", func(t *testing.T) {
			resp, err := timelineRepo.GetTimelineItems(testUser.ID, TimelineFilters{
				Type:    "all",
				Range:   "all",
				Page:    1,
				PerPage: 1,
			})

			require.NoError(t, err)
			assert.LessOrEqual(t, len(resp.Items), 1)
			assert.GreaterOrEqual(t, resp.Meta.TotalPages, 1)
		})
	})
}
