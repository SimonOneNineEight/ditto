package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterInterviewQuestionRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	questionHandler := handlers.NewInterviewQuestionHandler(appState)

	// Nested routes under interviews for creation and reorder
	interviews := apiGroup.Group("/interviews")
	interviews.Use(middleware.AuthMiddleware())
	{
		interviews.POST("/:id/questions", questionHandler.CreateQuestion)
		interviews.PATCH("/:id/questions/reorder", questionHandler.ReorderQuestions)
	}

	// Direct routes for update/delete
	questions := apiGroup.Group("/interview-questions")
	questions.Use(middleware.AuthMiddleware())
	{
		questions.PUT("/:id", questionHandler.UpdateQuestion)
		questions.DELETE("/:id", questionHandler.DeleteQuestion)
	}
}
