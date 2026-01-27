package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateInterviewRequest struct {
	ApplicationID   uuid.UUID `json:"application_id" binding:"required"`
	InterviewType   string    `json:"interview_type" binding:"required,oneof=phone_screen technical behavioral panel onsite other"`
	ScheduledDate   string    `json:"scheduled_date" binding:"required"`
	ScheduledTime   *string   `json:"scheduled_time"`
	DurationMinutes *int      `json:"duration_minutes"`
}

type UpdateInterviewRequest struct {
	ScheduledDate   *string `json:"scheduled_date"`
	ScheduledTime   *string `json:"scheduled_time"`
	DurationMinutes *int    `json:"duration_minutes"`
	InterviewType   *string `json:"interview_type" binding:"omitempty,oneof=phone_screen technical behavioral panel onsite other"`
	Outcome         *string `json:"outcome"`
}

type InterviewHandler struct {
	interviewRepo         *repository.InterviewRepository
	applicationRepo       *repository.ApplicationRepository
	interviewerRepo       *repository.InterviewerRepository
	interviewQuestionRepo *repository.InterviewQuestionRepository
	interviewNoteRepo     *repository.InterviewNoteRepository
}

func NewInterviewHandler(appState *utils.AppState) *InterviewHandler {
	return &InterviewHandler{
		interviewRepo:         repository.NewInterviewRepository(appState.DB),
		applicationRepo:       repository.NewApplicationRepository(appState.DB),
		interviewerRepo:       repository.NewInterviewerRepository(*appState.DB),
		interviewQuestionRepo: repository.NewInterviewQuestionRepository(*appState.DB),
		interviewNoteRepo:     repository.NewInterviewNoteRepository(*appState.DB),
	}
}

func (h *InterviewHandler) CreateInterview(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req CreateInterviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	_, err := h.applicationRepo.GetApplicationByID(req.ApplicationID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	scheduledDate, err := time.Parse("2006-01-02", req.ScheduledDate)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid scheduled date format, use YYYY-MM-DD"))
		return
	}

	interview := &models.Interview{
		UserID:          userID,
		ApplicationID:   req.ApplicationID,
		ScheduledDate:   scheduledDate,
		ScheduledTime:   req.ScheduledTime,
		InterviewType:   req.InterviewType,
		DurationMinutes: req.DurationMinutes,
	}

	createdInterview, err := h.interviewRepo.CreateInterview(interview)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"interview": createdInterview,
	})
}

func (h *InterviewHandler) GetInterviewByID(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviewIDStr := c.Param("id")
	interviewID, err := uuid.Parse(interviewIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid interview ID"))
		return
	}

	interviewWithInfo, err := h.interviewRepo.GetInterviewWithApplicationInfo(interviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"interview": interviewWithInfo.Interview,
		"application": gin.H{
			"company_name": interviewWithInfo.CompanyName,
			"job_title":    interviewWithInfo.JobTitle,
		},
	})
}

func (h *InterviewHandler) GetInterviewWithDetails(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviewIDStr := c.Param("id")
	interviewID, err := uuid.Parse(interviewIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid interview ID"))
		return
	}

	// Get interview with application info
	interviewWithInfo, err := h.interviewRepo.GetInterviewWithApplicationInfo(interviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Get interviewers
	interviewers, err := h.interviewerRepo.GetInterviewerByInterview(interviewID)
	if err != nil {
		HandleError(c, err)
		return
	}
	if interviewers == nil {
		interviewers = []*models.Interviewer{}
	}

	// Get questions
	questions, err := h.interviewQuestionRepo.GetInterviewQuestionByInterviewID(interviewID)
	if err != nil {
		HandleError(c, err)
		return
	}
	if questions == nil {
		questions = []*models.InterviewQuestion{}
	}

	// Get notes
	notes, err := h.interviewNoteRepo.GetInterviewNotesByInterviewID(interviewID)
	if err != nil {
		HandleError(c, err)
		return
	}
	if notes == nil {
		notes = []*models.InterviewNote{}
	}

	response.Success(c, gin.H{
		"interview": interviewWithInfo.Interview,
		"application": gin.H{
			"company_name": interviewWithInfo.CompanyName,
			"job_title":    interviewWithInfo.JobTitle,
		},
		"interviewers": interviewers,
		"questions":    questions,
		"notes":        notes,
	})
}

func (h *InterviewHandler) UpdateInterview(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviewIDStr := c.Param("id")
	interviewID, err := uuid.Parse(interviewIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid interview ID"))
		return
	}

	var req UpdateInterviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	updates := make(map[string]any)

	if req.ScheduledDate != nil {
		scheduledDate, err := time.Parse("2006-01-02", *req.ScheduledDate)
		if err != nil {
			HandleError(c, errors.New(errors.ErrorBadRequest, "invalid scheduled date format, use YYYY-MM-DD"))
			return
		}
		updates["scheduled_date"] = scheduledDate
	}

	if req.ScheduledTime != nil {
		updates["scheduled_time"] = *req.ScheduledTime
	}

	if req.DurationMinutes != nil {
		updates["duration_minutes"] = *req.DurationMinutes
	}

	if req.InterviewType != nil {
		updates["interview_type"] = *req.InterviewType
	}

	if req.Outcome != nil {
		updates["outcome"] = *req.Outcome
	}

	updatedInterview, err := h.interviewRepo.UpdateInterview(interviewID, userID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"interview": updatedInterview,
	})
}

func (h *InterviewHandler) ListInterviews(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviews, err := h.interviewRepo.GetInterviewsWithApplicationInfo(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"interviews": interviews,
	})
}
