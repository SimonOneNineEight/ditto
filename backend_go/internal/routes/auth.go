package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.Engine, appState *utils.AppState) {
	authHandler := handlers.NewAuthHandler(appState)

	auth := r.Group("/api")
	{
		auth.POST("/users", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh_token", authHandler.RefreshToken)
	}

	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.POST("/logout", authHandler.Logout)
		protected.GET("/me", authHandler.GetMe)
	}
}
