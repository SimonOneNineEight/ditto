package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterTimelineRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	timelineHandler := handlers.NewTimelineHandler(appState)

	timeline := apiGroup.Group("/timeline")
	timeline.Use(middleware.AuthMiddleware())
	timeline.Use(middleware.CSRFMiddleware())
	{
		timeline.GET("", timelineHandler.GetTimelineItems)
	}
}
