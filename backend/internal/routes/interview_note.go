package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterInterviewNoteRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	noteHandler := handlers.NewInterviewNoteHandler(appState)

	interviews := apiGroup.Group("/interviews")
	interviews.Use(middleware.AuthMiddleware())
	interviews.Use(middleware.CSRFMiddleware())
	{
		interviews.POST("/:id/notes", noteHandler.CreateOrUpdateNote)
	}
}
