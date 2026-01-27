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

type InterviewHandler struct {
	interviewRepo   *repository.InterviewRepository
	applicationRepo *repository.ApplicationRepository
}

func NewInterviewHandler(appState *utils.AppState) *InterviewHandler {
	return &InterviewHandler{
		interviewRepo:   repository.NewInterviewRepository(appState.DB),
		applicationRepo: repository.NewApplicationRepository(appState.DB),
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
