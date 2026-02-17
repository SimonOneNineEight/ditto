package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/services"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxPreviewLength = 200

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
	OverallFeeling  *string `json:"overall_feeling" binding:"omitempty,oneof=excellent good okay poor"`
	WentWell        *string `json:"went_well"`
	CouldImprove    *string `json:"could_improve"`
	ConfidenceLevel *int    `json:"confidence_level" binding:"omitempty,min=1,max=5"`
}

type InterviewHandler struct {
	interviewRepo         *repository.InterviewRepository
	applicationRepo       *repository.ApplicationRepository
	interviewerRepo       *repository.InterviewerRepository
	interviewQuestionRepo *repository.InterviewQuestionRepository
	interviewNoteRepo     *repository.InterviewNoteRepository
	dashboardRepo         *repository.DashboardRepository
	sanitizer             *services.SanitizerService
}

func NewInterviewHandler(appState *utils.AppState) *InterviewHandler {
	return &InterviewHandler{
		interviewRepo:         repository.NewInterviewRepository(appState.DB),
		applicationRepo:       repository.NewApplicationRepository(appState.DB),
		interviewerRepo:       repository.NewInterviewerRepository(appState.DB),
		interviewQuestionRepo: repository.NewInterviewQuestionRepository(appState.DB),
		interviewNoteRepo:     repository.NewInterviewNoteRepository(appState.DB),
		dashboardRepo:         repository.NewDashboardRepository(appState.DB),
		sanitizer:             appState.Sanitizer,
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

	h.dashboardRepo.InvalidateCache(userID)
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

	if req.OverallFeeling != nil {
		updates["overall_feeling"] = *req.OverallFeeling
	}

	if req.WentWell != nil {
		if *req.WentWell == "" {
			updates["went_well"] = nil
		} else {
			updates["went_well"] = h.sanitizer.SanitizeHTML(*req.WentWell)
		}
	}

	if req.CouldImprove != nil {
		if *req.CouldImprove == "" {
			updates["could_improve"] = nil
		} else {
			updates["could_improve"] = h.sanitizer.SanitizeHTML(*req.CouldImprove)
		}
	}

	if req.ConfidenceLevel != nil {
		updates["confidence_level"] = *req.ConfidenceLevel
	}

	updatedInterview, err := h.interviewRepo.UpdateInterview(interviewID, userID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	h.dashboardRepo.InvalidateCache(userID)
	response.Success(c, gin.H{
		"interview": updatedInterview,
	})
}

func (h *InterviewHandler) ListInterviews(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	filter := &repository.InterviewListFilter{}

	if filterStr := c.Query("filter"); filterStr != "" {
		switch filterStr {
		case "all", "upcoming", "past":
			filter.Filter = filterStr
		}
	}

	if upcomingStr := c.Query("upcoming"); upcomingStr == "true" {
		filter.Upcoming = true
	}

	if rangeStr := c.Query("range"); rangeStr != "" {
		switch rangeStr {
		case "today", "week", "month", "all":
			filter.Range = rangeStr
		}
	}

	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filter.Page = page
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 && limit <= 100 {
			filter.Limit = limit
		}
	}

	interviews, totalCount, err := h.interviewRepo.GetInterviewsWithApplicationInfo(userID, filter)
	if err != nil {
		HandleError(c, err)
		return
	}

	resp := gin.H{
		"interviews": interviews,
	}

	// Include pagination meta if requested
	if filter.Limit > 0 {
		totalPages := (totalCount + filter.Limit - 1) / filter.Limit
		currentPage := filter.Page
		if currentPage < 1 {
			currentPage = 1
		}
		resp["meta"] = gin.H{
			"page":        currentPage,
			"limit":       filter.Limit,
			"total_items": totalCount,
			"total_pages": totalPages,
		}
	}

	response.Success(c, resp)
}

func (h *InterviewHandler) GetInterviewWithContext(c *gin.Context) {
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

	interviewers, err := h.interviewerRepo.GetInterviewerByInterview(interviewID)
	if err != nil {
		HandleError(c, err)
		return
	}
	if interviewers == nil {
		interviewers = []*models.Interviewer{}
	}

	questions, err := h.interviewQuestionRepo.GetInterviewQuestionByInterviewID(interviewID)
	if err != nil {
		HandleError(c, err)
		return
	}
	if questions == nil {
		questions = []*models.InterviewQuestion{}
	}

	notes, err := h.interviewNoteRepo.GetInterviewNotesByInterviewID(interviewID)
	if err != nil {
		HandleError(c, err)
		return
	}
	if notes == nil {
		notes = []*models.InterviewNote{}
	}

	allRounds, err := h.interviewRepo.GetAllRoundsSummary(
		interviewWithInfo.ApplicationID, userID,
	)
	if err != nil {
		HandleError(c, err)
		return
	}

	for _, round := range allRounds {
		roundInterviewers, err := h.interviewerRepo.GetInterviewerByInterview(round.ID)
		if err != nil {
			HandleError(c, err)
			return
		}
		for _, iv := range roundInterviewers {
			round.Interviewers = append(round.Interviewers, repository.InterviewerSummary{
				Name: iv.Name,
				Role: iv.Role,
			})
		}

		roundQuestions, err := h.interviewQuestionRepo.GetInterviewQuestionByInterviewID(round.ID)
		if err != nil {
			HandleError(c, err)
			return
		}
		round.QuestionsPreview = buildQuestionsPreview(roundQuestions)

		roundNotes, err := h.interviewNoteRepo.GetInterviewNotesByInterviewID(round.ID)
		if err != nil {
			HandleError(c, err)
			return
		}
		round.FeedbackPreview = buildFeedbackPreview(roundNotes)
	}

	response.Success(c, gin.H{
		"current_interview": gin.H{
			"interview": interviewWithInfo.Interview,
			"application": gin.H{
				"company_name": interviewWithInfo.CompanyName,
				"job_title":    interviewWithInfo.JobTitle,
			},
			"interviewers": interviewers,
			"questions":    questions,
			"notes":        notes,
		},
		"all_rounds": allRounds,
		"application": gin.H{
			"company_name": interviewWithInfo.CompanyName,
			"job_title":    interviewWithInfo.JobTitle,
		},
	})
}

func buildQuestionsPreview(questions []*models.InterviewQuestion) string {
	if len(questions) == 0 {
		return ""
	}

	var preview string
	for _, q := range questions {
		if preview != "" {
			preview += " | "
		}
		preview += q.QuestionText
		if len(preview) > maxPreviewLength {
			return preview[:maxPreviewLength-3] + "..."
		}
	}
	return preview
}

func buildFeedbackPreview(notes []*models.InterviewNote) string {
	for _, n := range notes {
		if n.NoteType == "feedback" && n.Content != nil && *n.Content != "" {
			content := *n.Content
			if len(content) > maxPreviewLength {
				return content[:maxPreviewLength-3] + "..."
			}
			return content
		}
	}
	return ""
}

func (h *InterviewHandler) DeleteInterview(c *gin.Context) {
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

	interviewers, _ := h.interviewerRepo.GetInterviewerByInterview(interviewID)
	for _, interviewer := range interviewers {
		_ = h.interviewerRepo.SoftDeleteInterviewer(interviewer.ID)
	}

	questions, _ := h.interviewQuestionRepo.GetInterviewQuestionByInterviewID(interviewID)
	for _, question := range questions {
		_ = h.interviewQuestionRepo.SoftDeleteInterviewQuestion(question.ID)
	}

	notes, _ := h.interviewNoteRepo.GetInterviewNotesByInterviewID(interviewID)
	for _, note := range notes {
		_ = h.interviewNoteRepo.SoftDeleteInterviewNote(note.ID)
	}

	err = h.interviewRepo.SoftDeleteInterview(interviewID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	h.dashboardRepo.InvalidateCache(userID)
	response.NoContent(c)
}
