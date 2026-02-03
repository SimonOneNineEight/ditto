package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterInterviewRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	interviewHandler := handlers.NewInterviewHandler(appState)

	interviews := apiGroup.Group("/interviews")
	interviews.Use(middleware.AuthMiddleware())
	{
		interviews.POST("", interviewHandler.CreateInterview)
		interviews.GET("", interviewHandler.ListInterviews)
		interviews.GET("/:id", interviewHandler.GetInterviewByID)
		interviews.GET("/:id/details", interviewHandler.GetInterviewWithDetails)
		interviews.GET("/:id/with-context", interviewHandler.GetInterviewWithContext)
		interviews.PUT("/:id", interviewHandler.UpdateInterview)
		interviews.DELETE("/:id", interviewHandler.DeleteInterview)
	}
}
