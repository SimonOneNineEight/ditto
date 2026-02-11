package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterJobRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	jobHandler := handlers.NewJobHandler(appState)

	jobs := apiGroup.Group("/jobs")
	jobs.Use(middleware.AuthMiddleware())
	jobs.Use(middleware.CSRFMiddleware())
	{
		jobs.GET("", jobHandler.GetJobs)
		jobs.GET("/with-details", jobHandler.GetJobsWithDetails)
		jobs.GET("/:id", jobHandler.GetJob)

		jobs.POST("", jobHandler.CreateJob)

		jobs.PUT("/:id", jobHandler.UpdateJob)

		jobs.PATCH("/:id", jobHandler.PatchJob)

		jobs.DELETE("/:id", jobHandler.DeleteJob)
	}
}
