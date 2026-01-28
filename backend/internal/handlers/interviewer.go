package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateInterviewerRequest struct {
	Name string  `json:"name" binding:"required"`
	Role *string `json:"role"`
}

type CreateInterviewersRequest struct {
	Interviewers []CreateInterviewerRequest `json:"interviewers" binding:"required,min=1,dive"`
}

type UpdateInterviewerRequest struct {
	Name *string `json:"name"`
	Role *string `json:"role"`
}

type InterviewerHandler struct {
	interviewerRepo *repository.InterviewerRepository
	interviewRepo   *repository.InterviewRepository
}

func NewInterviewerHandler(appState *utils.AppState) *InterviewerHandler {
	return &InterviewerHandler{
		interviewerRepo: repository.NewInterviewerRepository(appState.DB),
		interviewRepo:   repository.NewInterviewRepository(appState.DB),
	}
}

type CreateInterviewerUnifiedRequest struct {
	Name         *string                    `json:"name"`
	Role         *string                    `json:"role"`
	Interviewers []CreateInterviewerRequest `json:"interviewers"`
}

func (h *InterviewerHandler) CreateInterviewer(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviewIDStr := c.Param("id")
	interviewID, err := uuid.Parse(interviewIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid interview ID"))
		return
	}

	_, err = h.interviewRepo.GetInterviewByID(interviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Parse unified request
	var req CreateInterviewerUnifiedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	// Check if it's a bulk request
	if len(req.Interviewers) > 0 {
		createdInterviewers := make([]*models.Interviewer, 0, len(req.Interviewers))
		for _, item := range req.Interviewers {
			if item.Name == "" {
				HandleError(c, errors.New(errors.ErrorBadRequest, "name is required for all interviewers"))
				return
			}
			interviewer := &models.Interviewer{
				InterviewID: interviewID,
				Name:        item.Name,
				Role:        item.Role,
			}
			created, err := h.interviewerRepo.CreateInterviewer(interviewer)
			if err != nil {
				HandleError(c, err)
				return
			}
			createdInterviewers = append(createdInterviewers, created)
		}
		response.Success(c, gin.H{
			"interviewers": createdInterviewers,
		})
		return
	}

	// Single interviewer creation
	if req.Name == nil || *req.Name == "" {
		HandleError(c, errors.New(errors.ErrorBadRequest, "name is required"))
		return
	}

	interviewer := &models.Interviewer{
		InterviewID: interviewID,
		Name:        *req.Name,
		Role:        req.Role,
	}

	created, err := h.interviewerRepo.CreateInterviewer(interviewer)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"interviewer": created,
	})
}

// UpdateInterviewer handles PUT /api/interviewers/:id
func (h *InterviewerHandler) UpdateInterviewer(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviewerIDStr := c.Param("id")
	interviewerID, err := uuid.Parse(interviewerIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid interviewer ID"))
		return
	}

	// Get interviewer and verify ownership
	interviewer, err := h.interviewerRepo.GetInterviewerByID(interviewerID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Verify interview belongs to user
	_, err = h.interviewRepo.GetInterviewByID(interviewer.InterviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	var req UpdateInterviewerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	updates := make(map[string]any)
	if req.Name != nil {
		if *req.Name == "" {
			HandleError(c, errors.New(errors.ErrorBadRequest, "name cannot be empty"))
			return
		}
		updates["name"] = *req.Name
	}
	if req.Role != nil {
		updates["role"] = *req.Role
	}

	if len(updates) == 0 {
		HandleError(c, errors.New(errors.ErrorBadRequest, "no fields to update"))
		return
	}

	updated, err := h.interviewerRepo.UpdateInterviewer(interviewerID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"interviewer": updated,
	})
}

// DeleteInterviewer handles DELETE /api/interviewers/:id
func (h *InterviewerHandler) DeleteInterviewer(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviewerIDStr := c.Param("id")
	interviewerID, err := uuid.Parse(interviewerIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid interviewer ID"))
		return
	}

	// Get interviewer and verify ownership
	interviewer, err := h.interviewerRepo.GetInterviewerByID(interviewerID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Verify interview belongs to user
	_, err = h.interviewRepo.GetInterviewByID(interviewer.InterviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	err = h.interviewerRepo.SoftDeleteInterviewer(interviewerID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"message": "interviewer deleted successfully",
	})
}
