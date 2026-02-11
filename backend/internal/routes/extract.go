package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func RegisterExtractRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	logger := log.New(os.Stdout, "[EXTRACT] ", log.LstdFlags)
	extractHandler := handlers.NewExtractHandler(logger)

	// Create rate limiter with database dependency
	rateLimiter := middleware.NewRateLimiter(appState.DB)

	apiGroup.POST("/extract-job-url",
		middleware.AuthMiddleware(),
		middleware.CSRFMiddleware(),
		rateLimiter.Middleware("url_extraction", 30), // 30 requests per 24 hours
		extractHandler.ExtractJobURL)
}
