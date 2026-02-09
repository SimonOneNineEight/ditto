package handlers

import (
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TimelineHandler struct {
	timelineRepo *repository.TimelineRepository
}

func NewTimelineHandler(appState *utils.AppState) *TimelineHandler {
	return &TimelineHandler{
		timelineRepo: repository.NewTimelineRepository(appState.DB),
	}
}

// GET /api/timeline
func (h *TimelineHandler) GetTimelineItems(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	filters := repository.TimelineFilters{
		Type:    c.DefaultQuery("type", "all"),
		Range:   c.DefaultQuery("range", "all"),
		Page:    1,
		PerPage: 20,
	}

	if filters.Type != "all" && filters.Type != "interviews" && filters.Type != "assessments" {
		filters.Type = "all"
	}

	if filters.Range != "all" && filters.Range != "today" && filters.Range != "week" && filters.Range != "month" {
		filters.Range = "all"
	}

	if pageParam := c.Query("page"); pageParam != "" {
		if parsed, err := strconv.Atoi(pageParam); err == nil && parsed > 0 {
			filters.Page = parsed
		}
	}

	if perPageParam := c.Query("per_page"); perPageParam != "" {
		if parsed, err := strconv.Atoi(perPageParam); err == nil && parsed > 0 && parsed <= 100 {
			filters.PerPage = parsed
		}
	}

	result, err := h.timelineRepo.GetTimelineItems(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, result)
}
