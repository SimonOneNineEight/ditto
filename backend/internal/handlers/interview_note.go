package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/services"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxNoteContentSize = 50000 // 50KB

type CreateOrUpdateNoteRequest struct {
	NoteType string  `json:"note_type" binding:"required,oneof=preparation company_research feedback reflection general"`
	Content  *string `json:"content"`
}

type InterviewNoteHandler struct {
	interviewNoteRepo *repository.InterviewNoteRepository
	interviewRepo     *repository.InterviewRepository
	sanitizer         *services.SanitizerService
}

func NewInterviewNoteHandler(appState *utils.AppState) *InterviewNoteHandler {
	return &InterviewNoteHandler{
		interviewNoteRepo: repository.NewInterviewNoteRepository(appState.DB),
		interviewRepo:     repository.NewInterviewRepository(appState.DB),
		sanitizer:         appState.Sanitizer,
	}
}

func (h *InterviewNoteHandler) CreateOrUpdateNote(c *gin.Context) {
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

	var req CreateOrUpdateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	if req.Content != nil && len(*req.Content) > maxNoteContentSize {
		HandleError(c, errors.New(errors.ErrorBadRequest, "content exceeds maximum size of 50KB"))
		return
	}

	if req.Content != nil && *req.Content != "" {
		sanitized := h.sanitizer.SanitizeHTML(*req.Content)
		req.Content = &sanitized
	}

	existingNote, err := h.interviewNoteRepo.GetNoteByInterviewAndType(interviewID, req.NoteType)
	if err != nil {
		HandleError(c, err)
		return
	}

	var newInterviewNote *models.InterviewNote
	if existingNote == nil {
		interviewNote := &models.InterviewNote{
			InterviewID: interviewID,
			NoteType:    req.NoteType,
			Content:     req.Content,
		}
		createdInterviewNote, err := h.interviewNoteRepo.CreateInterviewNote(interviewNote)
		if err != nil {
			HandleError(c, err)
			return
		}
		newInterviewNote = createdInterviewNote
	} else {
		updates := map[string]any{
			"content": req.Content,
		}
		updatedInterviewNote, err := h.interviewNoteRepo.UpdateInterviewNote(existingNote.ID, updates)
		if err != nil {
			HandleError(c, err)
			return
		}
		newInterviewNote = updatedInterviewNote
	}

	response.Success(c, gin.H{
		"interviewNote": newInterviewNote,
	})
}
