package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterDashboardRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	dashboardHandler := handlers.NewDashboardHandler(appState)

	dashboard := apiGroup.Group("/dashboard")
	dashboard.Use(middleware.AuthMiddleware())
	dashboard.Use(middleware.CSRFMiddleware())
	{
		dashboard.GET("/stats", dashboardHandler.GetStats)
		dashboard.GET("/upcoming", dashboardHandler.GetUpcomingItems)
	}
}
