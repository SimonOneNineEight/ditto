package handlers

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
)

type CreateAssessmentRequest struct {
	ApplicationID  uuid.UUID `json:"application_id" binding:"required"`
	AssessmentType string    `json:"assessment_type" binding:"required,oneof=take_home_project live_coding system_design data_structures case_study other"`
	Title          string    `json:"title" binding:"required,max=255"`
	DueDate        string    `json:"due_date" binding:"required"`
	Instructions   *string   `json:"instructions"`
	Requirements   *string   `json:"requirements"`
}

type UpdateAssessmentRequest struct {
	Title          *string `json:"title" binding:"omitempty,max=255"`
	AssessmentType *string `json:"assessment_type" binding:"omitempty,oneof=take_home_project live_coding system_design data_structures case_study other"`
	DueDate        *string `json:"due_date"`
	Status         *string `json:"status" binding:"omitempty,oneof=not_started in_progress submitted passed failed"`
	Instructions   *string `json:"instructions"`
	Requirements   *string `json:"requirements"`
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=not_started in_progress submitted passed failed"`
}

type CreateSubmissionRequest struct {
	SubmissionType string     `json:"submission_type" binding:"required,oneof=github file_upload notes"`
	GithubURL      *string    `json:"github_url"`
	FileID         *uuid.UUID `json:"file_id"`
	Notes          *string    `json:"notes"`
}

type AssessmentHandler struct {
	assessmentRepo  *repository.AssessmentRepository
	submissionRepo  *repository.AssessmentSubmissionRepository
	applicationRepo *repository.ApplicationRepository
	fileRepo        *repository.FileRepository
	dashboardRepo   *repository.DashboardRepository
}

func NewAssessmentHandler(appState *utils.AppState) *AssessmentHandler {
	return &AssessmentHandler{
		assessmentRepo:  repository.NewAssessmentRepository(appState.DB),
		submissionRepo:  repository.NewAssessmentSubmissionRepository(appState.DB),
		applicationRepo: repository.NewApplicationRepository(appState.DB),
		fileRepo:        repository.NewFileRepository(appState.DB),
		dashboardRepo:   repository.NewDashboardRepository(appState.DB),
	}
}

// formatDueDate formats a DueDate string from the database (e.g. "2026-05-01T00:00:00Z")
// to YYYY-MM-DD format for API responses.
func formatDueDate(assessment *models.Assessment) {
	if len(assessment.DueDate) > 10 {
		assessment.DueDate = assessment.DueDate[:10]
	}
}

func formatDueDates(assessments []*models.Assessment) {
	for _, a := range assessments {
		formatDueDate(a)
	}
}

func (h *AssessmentHandler) CreateAssessment(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req CreateAssessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	// Validate due_date format
	_, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid due date format, use YYYY-MM-DD"))
		return
	}

	// Verify user owns the application
	_, err = h.applicationRepo.GetApplicationByID(req.ApplicationID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	assessment := &models.Assessment{
		UserID:         userID,
		ApplicationID:  req.ApplicationID,
		AssessmentType: req.AssessmentType,
		Title:          req.Title,
		DueDate:        req.DueDate,
		Instructions:   req.Instructions,
		Requirements:   req.Requirements,
	}

	createdAssessment, err := h.assessmentRepo.CreateAssessment(assessment)
	if err != nil {
		HandleError(c, err)
		return
	}

	h.dashboardRepo.InvalidateCache(userID)
	formatDueDate(createdAssessment)

	response.Success(c, gin.H{
		"assessment": createdAssessment,
	})
}

func (h *AssessmentHandler) GetAssessment(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	assessmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid assessment ID"))
		return
	}

	assessment, err := h.assessmentRepo.GetAssessmentByID(assessmentID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	formatDueDate(assessment)

	response.Success(c, gin.H{
		"assessment": assessment,
	})
}

func (h *AssessmentHandler) ListAssessments(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	applicationIDStr := c.Query("application_id")

	// If application_id is provided, filter by application
	if applicationIDStr != "" {
		applicationID, err := uuid.Parse(applicationIDStr)
		if err != nil {
			HandleError(c, errors.New(errors.ErrorBadRequest, "invalid application_id"))
			return
		}

		assessments, err := h.assessmentRepo.ListByApplicationID(applicationID, userID)
		if err != nil {
			HandleError(c, err)
			return
		}

		if assessments == nil {
			assessments = []*models.Assessment{}
		}

		formatDueDates(assessments)

		response.Success(c, gin.H{
			"assessments": assessments,
		})
		return
	}

	// No application_id - return all user assessments with context
	assessments, err := h.assessmentRepo.ListByUserID(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	if assessments == nil {
		assessments = []*repository.AssessmentWithContext{}
	}

	// Format due dates
	for _, a := range assessments {
		if len(a.DueDate) > 10 {
			a.DueDate = a.DueDate[:10]
		}
	}

	response.Success(c, gin.H{
		"assessments": assessments,
	})
}

func (h *AssessmentHandler) UpdateAssessment(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	assessmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid assessment ID"))
		return
	}

	var req UpdateAssessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	// Build updates map using field allowlist only
	updates := make(map[string]any)

	if req.Title != nil {
		updates["title"] = *req.Title
	}

	if req.AssessmentType != nil {
		updates["assessment_type"] = *req.AssessmentType
	}

	if req.DueDate != nil {
		// Validate date format
		if _, err := time.Parse("2006-01-02", *req.DueDate); err != nil {
			HandleError(c, errors.New(errors.ErrorBadRequest, "invalid due date format, use YYYY-MM-DD"))
			return
		}
		updates["due_date"] = *req.DueDate
	}

	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if req.Instructions != nil {
		if *req.Instructions == "" {
			updates["instructions"] = nil
		} else {
			updates["instructions"] = *req.Instructions
		}
	}

	if req.Requirements != nil {
		if *req.Requirements == "" {
			updates["requirements"] = nil
		} else {
			updates["requirements"] = *req.Requirements
		}
	}

	updatedAssessment, err := h.assessmentRepo.UpdateAssessment(assessmentID, userID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	h.dashboardRepo.InvalidateCache(userID)
	formatDueDate(updatedAssessment)

	response.Success(c, gin.H{
		"assessment": updatedAssessment,
	})
}

func (h *AssessmentHandler) DeleteAssessment(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	assessmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid assessment ID"))
		return
	}

	err = h.assessmentRepo.SoftDeleteAssessment(assessmentID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	h.dashboardRepo.InvalidateCache(userID)
	response.NoContent(c)
}

func (h *AssessmentHandler) UpdateStatus(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	assessmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid assessment ID"))
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	// Normalize status value
	status := strings.TrimSpace(req.Status)

	updates := map[string]any{
		"status": status,
	}

	updatedAssessment, err := h.assessmentRepo.UpdateAssessment(assessmentID, userID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	h.dashboardRepo.InvalidateCache(userID)
	formatDueDate(updatedAssessment)

	response.Success(c, gin.H{
		"assessment": updatedAssessment,
	})
}

func (h *AssessmentHandler) CreateSubmission(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	assessmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid assessment ID"))
		return
	}

	var req CreateSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	if req.SubmissionType == "github" && (req.GithubURL == nil || *req.GithubURL == "") {
		HandleError(c, errors.New(errors.ErrorBadRequest, "github_url is required for github submissions"))
		return
	}

	if req.SubmissionType == "file_upload" && req.FileID == nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "file_id is required for file_upload submissions"))
		return
	}

	if req.SubmissionType == "notes" && (req.Notes == nil || *req.Notes == "") {
		HandleError(c, errors.New(errors.ErrorBadRequest, "notes is required for notes submissions"))
		return
	}

	if req.GithubURL != nil && *req.GithubURL != "" {
		url := *req.GithubURL
		if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
			HandleError(c, errors.New(errors.ErrorBadRequest, "github_url must start with http:// or https://"))
			return
		}
	}

	_, err = h.assessmentRepo.GetAssessmentByID(assessmentID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	if req.SubmissionType == "file_upload" && req.FileID != nil {
		_, err := h.fileRepo.GetFileByID(*req.FileID, userID)
		if err != nil {
			HandleError(c, errors.New(errors.ErrorBadRequest, "file not found or does not belong to user"))
			return
		}
	}

	submission := &models.AssessmentSubmission{
		AssessmentID:   assessmentID,
		SubmissionType: req.SubmissionType,
		GithubURL:      req.GithubURL,
		FileID:         req.FileID,
		Notes:          req.Notes,
	}

	createdSubmission, err := h.submissionRepo.CreateSubmission(submission)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Created(c, gin.H{
		"submission": createdSubmission,
	})
}

func (h *AssessmentHandler) DeleteSubmission(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	submissionID, err := uuid.Parse(c.Param("submissionId"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid submission ID"))
		return
	}

	submission, err := h.submissionRepo.GetSubmissionByID(submissionID)
	if err != nil {
		HandleError(c, err)
		return
	}

	_, err = h.assessmentRepo.GetAssessmentByID(submission.AssessmentID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	err = h.submissionRepo.SoftDeleteSubmission(submissionID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.NoContent(c)
}

func (h *AssessmentHandler) GetAssessmentDetails(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	assessmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid assessment ID"))
		return
	}

	assessment, err := h.assessmentRepo.GetAssessmentByID(assessmentID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	submissions, err := h.submissionRepo.ListByAssessmentID(assessmentID)
	if err != nil {
		HandleError(c, err)
		return
	}

	if submissions == nil {
		submissions = []*models.AssessmentSubmission{}
	}

	formatDueDate(assessment)

	response.Success(c, gin.H{
		"assessment":  assessment,
		"submissions": submissions,
	})
}
