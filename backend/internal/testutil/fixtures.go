package testutil

import (
	"ditto-backend/internal/models"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// CreateTestUser creates a test user with optional password
func CreateTestUser(email, name, password string) *models.User {
	user := &models.User{
		ID:        uuid.New(),
		Name:      name,
		Email:     email,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return user
}

// CreateTestUserAuth creates user auth for a user
func CreateTestUserAuth(userID uuid.UUID, password string) *models.UserAuth {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	hashStr := string(hash)
	
	return &models.UserAuth{
		ID:           uuid.New(),
		UserID:       userID,
		PasswordHash: &hashStr,
		AuthProvider: "local",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

// CreateTestUserWithAuth creates a user with auth in one step
func CreateTestUserWithAuth(email, name, password string) (*models.User, *models.UserAuth) {
	user := CreateTestUser(email, name, "")
	auth := CreateTestUserAuth(user.ID, password)
	return user, auth
}

// CreateTestCompany creates a test company
func CreateTestCompany(name, domain string) *models.Company {
	website := "https://" + domain
	return &models.Company{
		ID:        uuid.New(),
		Name:      name,
		Domain:    &domain,
		Website:   &website,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// CreateTestJob creates a test job
func CreateTestJob(companyID uuid.UUID, title, description string) *models.Job {
	return &models.Job{
		ID:             uuid.New(),
		CompanyID:      companyID,
		Title:          title,
		JobDescription: description,
		Location:       "Remote",
		JobType:        "Full-time",
		MinSalary:      Float64Ptr(80000),
		MaxSalary:      Float64Ptr(120000),
		Currency:       StringPtr("USD"),
		IsExpired:      false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
}

// CreateTestApplication creates a test application
func CreateTestApplication(userID, jobID, statusID uuid.UUID) *models.Application {
	return &models.Application{
		ID:                  uuid.New(),
		UserID:              userID,
		JobID:               jobID,
		ApplicationStatusID: statusID,
		AppliedAt:           time.Now(),
		OfferReceived:       false,
		AttemptNumber:       1,
		Notes:               StringPtr("Test application"),
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}
}

// CreateTestApplicationStatus creates a test application status
func CreateTestApplicationStatus(name string) *models.ApplicationStatus {
	return &models.ApplicationStatus{
		ID:        uuid.New(),
		Name:      name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// Helper functions for pointers
func StringPtr(s string) *string {
	return &s
}

func Float64Ptr(f float64) *float64 {
	return &f
}

func IntPtr(i int) *int {
	return &i
}

func BoolPtr(b bool) *bool {
	return &b
}

// Test data sets
var (
	// Test users
	TestUsers = []*models.User{
		CreateTestUser("john@example.com", "John Doe", ""),
		CreateTestUser("jane@example.com", "Jane Smith", ""),
		CreateTestUser("admin@example.com", "Admin User", ""),
	}

	// Test companies
	TestCompanies = []*models.Company{
		CreateTestCompany("Google", "google.com"),
		CreateTestCompany("Microsoft", "microsoft.com"),
		CreateTestCompany("Apple", "apple.com"),
	}

	// Test application statuses
	TestApplicationStatuses = []*models.ApplicationStatus{
		CreateTestApplicationStatus("Applied"),
		CreateTestApplicationStatus("Interview Scheduled"),
		CreateTestApplicationStatus("Rejected"),
		CreateTestApplicationStatus("Offer Received"),
	}
)