package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	s3service "ditto-backend/internal/services/s3"
	"ditto-backend/internal/utils"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterExportRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	s3Config := s3service.Config{
		Region:          getExportEnv("AWS_REGION", "us-east-1"),
		Bucket:          getExportEnv("AWS_S3_BUCKET", ""),
		AccessKeyID:     getExportEnv("AWS_ACCESS_KEY_ID", ""),
		SecretAccessKey: getExportEnv("AWS_SECRET_ACCESS_KEY", ""),
		Endpoint:        getExportEnv("AWS_ENDPOINT", ""),
		URLExpiry:       15 * time.Minute,
	}

	s3Service, err := s3service.NewS3Service(s3Config)
	if err != nil {
		log.Fatalf("Failed to initialize S3 service for export: %v", err)
	}

	exportHandler := handlers.NewExportHandler(appState, s3Service)

	export := apiGroup.Group("/export")
	export.Use(middleware.AuthMiddleware())
	export.Use(middleware.CSRFMiddleware())
	{
		export.GET("/applications", exportHandler.ExportApplications)
		export.GET("/interviews", exportHandler.ExportInterviews)
		export.GET("/full", exportHandler.ExportFull)
	}
}

func getExportEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
