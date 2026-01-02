package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func RegisterExtractRoutes(apiGroup *gin.RouterGroup) {
	logger := log.New(os.Stdout, "[EXTRACT] ", log.LstdFlags)
	extractHandler := handlers.NewExtractHandler(logger)

	apiGroup.POST("/extract-job-url", middleware.AuthMiddleware(), extractHandler.ExtractJobURL)
}
