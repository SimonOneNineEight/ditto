package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterSearchRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	searchHandler := handlers.NewSearchHandler(appState)

	search := apiGroup.Group("/search")
	search.Use(middleware.AuthMiddleware())
	{
		search.GET("", searchHandler.GetSearch)
	}
}
