package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterNotificationRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	notificationHandler := handlers.NewNotificationHandler(appState)

	notifications := apiGroup.Group("/notifications")
	notifications.Use(middleware.AuthMiddleware())
	{
		notifications.GET("", notificationHandler.ListNotifications)
		notifications.GET("/count", notificationHandler.GetUnreadCount)
		notifications.PATCH("/:id/read", notificationHandler.MarkAsRead)
		notifications.PATCH("/mark-all-read", notificationHandler.MarkAllAsRead)
	}

	users := apiGroup.Group("/users")
	users.Use(middleware.AuthMiddleware())
	{
		users.GET("/notification-preferences", notificationHandler.GetPreferences)
		users.PUT("/notification-preferences", notificationHandler.UpdatePreferences)
	}
}
