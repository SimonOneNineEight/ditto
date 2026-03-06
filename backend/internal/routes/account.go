package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterAccountRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	accountHandler := handlers.NewAccountHandler(appState)

	protected := apiGroup.Group("/account")
	protected.Use(middleware.AuthMiddleware())
	protected.Use(middleware.CSRFMiddleware())
	{
		protected.GET("/providers", accountHandler.GetLinkedProviders)
		protected.POST("/link-provider", accountHandler.LinkProvider)
		protected.DELETE("/providers/:provider", accountHandler.UnlinkProvider)
		protected.POST("/set-password", accountHandler.SetPassword)
		protected.PUT("/change-password", accountHandler.ChangePassword)
	}
}
