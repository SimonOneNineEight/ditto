package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterApplicationRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	applicationRepo := repository.NewApplicationRepository(appState.DB)
	applicationHandler := handlers.NewApplicationHandler(applicationRepo)

	applications := apiGroup.Group("/applications")
	applications.Use(middleware.AuthMiddleware())
	{
		applications.GET("", applicationHandler.GetApplications)
		applications.POST("", applicationHandler.CreateApplication)
		applications.GET("/with-details",
			applicationHandler.GetApplicationsWithDetails)
		applications.GET("/stats", applicationHandler.GetApplicationStats)
		applications.GET("/recent", applicationHandler.GetRecentApplications)
		applications.GET("/:id", applicationHandler.GetApplication)
		applications.PUT("/:id", applicationHandler.UpdateApplication)
		applications.PATCH("/:id/status",
			applicationHandler.UpdateApplicationStatus)
		applications.DELETE("/:id", applicationHandler.DeleteApplication)
	}

	apiGroup.GET("/application-statuses",
		applicationHandler.GetApplicationStatuses)
}
