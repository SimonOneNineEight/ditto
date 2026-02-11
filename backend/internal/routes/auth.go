package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	authHandler := handlers.NewAuthHandler(appState)

	// Public auth endpoints with IP-based rate limiting
	rateLimited := apiGroup.Group("")
	rateLimited.Use(middleware.RateLimitAuthIP())
	{
		rateLimited.POST("/users", authHandler.Register)             // POST /api/users
		rateLimited.POST("/login", authHandler.Login)                // POST /api/login
		rateLimited.POST("/refresh_token", authHandler.RefreshToken) // POST /api/refresh_token
		rateLimited.POST("/oauth", authHandler.OAuthLogin)
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
