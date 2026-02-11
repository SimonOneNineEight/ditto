package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/repository"
	s3service "ditto-backend/internal/services/s3"
	"ditto-backend/internal/utils"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterFileRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	fileRepo := repository.NewFileRepository(appState.DB)

	s3Config := s3service.Config{
		Region:          getEnv("AWS_REGION", "us-east-1"),
		Bucket:          getEnv("AWS_S3_BUCKET", ""),
		AccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		SecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		Endpoint:        getEnv("AWS_ENDPOINT", ""),
		URLExpiry:       15 * time.Minute,
	}

	s3Service, err := s3service.NewS3Service(s3Config)
	if err != nil {
		log.Fatalf("Failed to initialize S3 service: %v", err)
	}

	rateLimiter := middleware.NewRateLimiter(appState.DB)

	fileHandler := handlers.NewFileHandler(fileRepo, s3Service)

	files := apiGroup.Group("/files")
	files.Use(middleware.AuthMiddleware())
	files.Use(middleware.CSRFMiddleware())
	{
		files.GET("", fileHandler.ListFiles)
		files.POST("/presigned-upload", rateLimiter.Middleware("file_upload", 50), fileHandler.GetPresignedUploadURL)
		files.POST("/confirm-upload", fileHandler.ConfirmUpload)
		files.GET("/:id", fileHandler.GetFile)
		files.DELETE("/:id", fileHandler.DeleteFile)
		files.PUT("/:id/replace", fileHandler.ReplaceFile)
		files.POST("/:id/confirm-replace", fileHandler.ConfirmReplace)
	}

	users := apiGroup.Group("/users")
	users.Use(middleware.AuthMiddleware())
	{
		users.GET("/storage-stats", fileHandler.GetStorageStats)
		users.GET("/files", fileHandler.ListUserFilesWithDetails)
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	return value
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	seconds, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}

	return time.Duration(seconds) * time.Second
}
