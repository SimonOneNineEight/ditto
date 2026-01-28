package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterInterviewerRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	interviewerHandler := handlers.NewInterviewerHandler(appState)

	// Nested route under interviews for creation
	interviews := apiGroup.Group("/interviews")
	interviews.Use(middleware.AuthMiddleware())
	{
		interviews.POST("/:id/interviewers", interviewerHandler.CreateInterviewer)
	}

	// Direct routes for update/delete
	interviewers := apiGroup.Group("/interviewers")
	interviewers.Use(middleware.AuthMiddleware())
	{
		interviewers.PUT("/:id", interviewerHandler.UpdateInterviewer)
		interviewers.DELETE("/:id", interviewerHandler.DeleteInterviewer)
	}
}
