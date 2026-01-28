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

type CreateQuestionRequest struct {
	QuestionText string  `json:"question_text" binding:"required"`
	AnswerText   *string `json:"answer_text"`
}

type CreateQuestionsRequest struct {
	Questions []CreateQuestionRequest `json:"questions" binding:"required,min=1,dive"`
}

type UpdateQuestionRequest struct {
	QuestionText *string `json:"question_text"`
	AnswerText   *string `json:"answer_text"`
}

type ReorderQuestionsRequest struct {
	QuestionIDs []string `json:"question_ids" binding:"required,min=1"`
}

type InterviewQuestionHandler struct {
	questionRepo  *repository.InterviewQuestionRepository
	interviewRepo *repository.InterviewRepository
}

func NewInterviewQuestionHandler(appState *utils.AppState) *InterviewQuestionHandler {
	return &InterviewQuestionHandler{
		questionRepo:  repository.NewInterviewQuestionRepository(appState.DB),
		interviewRepo: repository.NewInterviewRepository(appState.DB),
	}
}

// CreateQuestionUnifiedRequest handles both single and bulk creation
type CreateQuestionUnifiedRequest struct {
	// For single creation
	QuestionText *string `json:"question_text"`
	AnswerText   *string `json:"answer_text"`
	// For bulk creation
	Questions []CreateQuestionRequest `json:"questions"`
}

// CreateQuestion handles POST /api/interviews/:id/questions
// Supports both single question and bulk creation
func (h *InterviewQuestionHandler) CreateQuestion(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviewIDStr := c.Param("id")
	interviewID, err := uuid.Parse(interviewIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid interview ID"))
		return
	}

	// Verify interview exists and belongs to user
	_, err = h.interviewRepo.GetInterviewByID(interviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Parse unified request
	var req CreateQuestionUnifiedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	// Check if it's a bulk request
	if len(req.Questions) > 0 {
		questions := make([]*models.InterviewQuestion, 0, len(req.Questions))
		for _, item := range req.Questions {
			if item.QuestionText == "" {
				HandleError(c, errors.New(errors.ErrorBadRequest, "question_text is required for all questions"))
				return
			}
			question := &models.InterviewQuestion{
				InterviewID:  interviewID,
				QuestionText: item.QuestionText,
				AnswerText:   item.AnswerText,
			}
			questions = append(questions, question)
		}
		created, err := h.questionRepo.CreateInterviewQuestions(questions)
		if err != nil {
			HandleError(c, err)
			return
		}
		response.Success(c, gin.H{
			"questions": created,
		})
		return
	}

	// Single question creation
	if req.QuestionText == nil || *req.QuestionText == "" {
		HandleError(c, errors.New(errors.ErrorBadRequest, "question_text is required"))
		return
	}

	question := &models.InterviewQuestion{
		InterviewID:  interviewID,
		QuestionText: *req.QuestionText,
		AnswerText:   req.AnswerText,
	}

	created, err := h.questionRepo.CreateInterviewQuestion(question)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"question": created,
	})
}

// UpdateQuestion handles PUT /api/interview-questions/:id
func (h *InterviewQuestionHandler) UpdateQuestion(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	questionIDStr := c.Param("id")
	questionID, err := uuid.Parse(questionIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid question ID"))
		return
	}

	// Get question and verify ownership
	question, err := h.questionRepo.GetInterviewQuestionByID(questionID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Verify interview belongs to user
	_, err = h.interviewRepo.GetInterviewByID(question.InterviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	var req UpdateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	updates := make(map[string]any)
	if req.QuestionText != nil {
		if *req.QuestionText == "" {
			HandleError(c, errors.New(errors.ErrorBadRequest, "question_text cannot be empty"))
			return
		}
		updates["question_text"] = *req.QuestionText
	}
	if req.AnswerText != nil {
		updates["answer_text"] = *req.AnswerText
	}

	if len(updates) == 0 {
		HandleError(c, errors.New(errors.ErrorBadRequest, "no fields to update"))
		return
	}

	updated, err := h.questionRepo.UpdateInterviewQuestion(questionID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"question": updated,
	})
}

// DeleteQuestion handles DELETE /api/interview-questions/:id
func (h *InterviewQuestionHandler) DeleteQuestion(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	questionIDStr := c.Param("id")
	questionID, err := uuid.Parse(questionIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid question ID"))
		return
	}

	// Get question and verify ownership
	question, err := h.questionRepo.GetInterviewQuestionByID(questionID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Verify interview belongs to user
	_, err = h.interviewRepo.GetInterviewByID(question.InterviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	err = h.questionRepo.SoftDeleteInterviewQuestion(questionID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"message": "question deleted successfully",
	})
}

// ReorderQuestions handles PATCH /api/interviews/:id/questions/reorder
func (h *InterviewQuestionHandler) ReorderQuestions(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	interviewIDStr := c.Param("id")
	interviewID, err := uuid.Parse(interviewIDStr)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid interview ID"))
		return
	}

	// Verify interview exists and belongs to user
	_, err = h.interviewRepo.GetInterviewByID(interviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	var req ReorderQuestionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	// Parse question IDs
	questionIDs := make([]uuid.UUID, 0, len(req.QuestionIDs))
	for _, idStr := range req.QuestionIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			HandleError(c, errors.New(errors.ErrorBadRequest, "invalid question ID: "+idStr))
			return
		}
		questionIDs = append(questionIDs, id)
	}

	questions, err := h.questionRepo.ReorderQuestions(interviewID, questionIDs)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"questions": questions,
	})
}
