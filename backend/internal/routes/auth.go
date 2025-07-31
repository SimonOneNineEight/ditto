package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	authHandler := handlers.NewAuthHandler(appState)

	// Public auth endpoints
	apiGroup.POST("/users", authHandler.Register)             // POST /api/users
	apiGroup.POST("/login", authHandler.Login)                // POST /api/login
	apiGroup.POST("/refresh_token", authHandler.RefreshToken) // POST /api/refresh_token
	apiGroup.POST("/oauth", authHandler.OAuthLogin)

	// Protected auth endpoints
	protected := apiGroup.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.POST("/logout", authHandler.Logout) // POST /api/logout
		protected.GET("/me", authHandler.GetMe)       // GET /api/me
	}
}
