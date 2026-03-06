package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	authHandler := handlers.NewAuthHandler(appState)

	rateLimited := apiGroup.Group("")
	rateLimited.Use(middleware.RateLimitAuthIP())
	{
		rateLimited.POST("/users", authHandler.Register)
		rateLimited.POST("/login", authHandler.Login)
		rateLimited.POST("/oauth", authHandler.OAuthLogin)
	}

	refreshLimited := apiGroup.Group("")
	refreshLimited.Use(middleware.RateLimitRefreshIP())
	{
		refreshLimited.POST("/refresh_token", authHandler.RefreshToken)
	}

	protected := apiGroup.Group("")
	protected.Use(middleware.AuthMiddleware())
	protected.Use(middleware.CSRFMiddleware())
	{
		protected.POST("/logout", authHandler.Logout)
		protected.GET("/me", authHandler.GetMe)
		protected.DELETE("/users/account", authHandler.DeleteAccount)
	}
}
