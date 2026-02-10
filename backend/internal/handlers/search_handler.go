package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SearchHandler struct {
	searchRepo *repository.SearchRepository
}

func NewSearchHandler(appState *utils.AppState) *SearchHandler {
	return &SearchHandler{
		searchRepo: repository.NewSearchRepository(appState.DB),
	}
}

// GET /api/search?q={query}&limit={limit}
func (h *SearchHandler) GetSearch(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	query := c.Query("q")

	if len(query) < 3 {
		response.Success(c, &models.GroupedSearchResponse{
			Applications: []models.SearchResult{},
			Interviews:   []models.SearchResult{},
			Assessments:  []models.SearchResult{},
			Notes:        []models.SearchResult{},
			TotalCount:   0,
			Query:        query,
		})
		return
	}

	limit := 10
	if limitParam := c.Query("limit"); limitParam != "" {
		if parsed, err := strconv.Atoi(limitParam); err == nil && parsed > 0 {
			limit = parsed
			if limit > 50 {
				limit = 50
			}
		}
	}

	result, err := h.searchRepo.Search(userID, query, limit)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, result)
}
