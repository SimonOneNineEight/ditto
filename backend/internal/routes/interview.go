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
	}
}
