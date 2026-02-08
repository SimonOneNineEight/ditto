package handlers

import (
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DashboardHandler struct {
	dashboardRepo *repository.DashboardRepository
}

func NewDashboardHandler(appState *utils.AppState) *DashboardHandler {
	return &DashboardHandler{
		dashboardRepo: repository.NewDashboardRepository(appState.DB),
	}
}

// GET /api/dashboard/stats
func (h *DashboardHandler) GetStats(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	stats, err := h.dashboardRepo.GetStats(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, stats)
}

// GET /api/dashboard/upcoming
func (h *DashboardHandler) GetUpcomingItems(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	limit := 4
	if limitParam := c.Query("limit"); limitParam != "" {
		if parsed, err := strconv.Atoi(limitParam); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	itemType := c.DefaultQuery("type", "all")
	if itemType != "all" && itemType != "interviews" && itemType != "assessments" {
		itemType = "all"
	}

	items, err := h.dashboardRepo.GetUpcomingItems(userID, limit, itemType)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, items)
}
