package main

import (
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/routes"
	"ditto-backend/internal/services"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/response"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
}

func main() {
	appState, err := utils.NewAppState()
	if err != nil {
		log.Fatal("Failed to initialize app state: ", err)
	}

	defer appState.Close()

	r := gin.Default()

	r.Use(middleware.SecurityHeaders())
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	r.Use(middleware.SlowRequestLogger())
	corsOrigins := []string{"http://localhost:8080", "http://localhost:8082", "http://localhost:3000"}
	if origins := os.Getenv("CORS_ORIGINS"); origins != "" {
		parts := strings.Split(origins, ",")
		corsOrigins = make([]string, len(parts))
		for i, o := range parts {
			corsOrigins[i] = strings.TrimSpace(o)
		}
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-CSRF-Token"},
		ExposeHeaders:    []string{"Content-Length", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(middleware.ErrorHandler())

	r.GET("/health", func(c *gin.Context) {
		response.Success(c, gin.H{"status": "ok"})
	})

	apiGroup := r.Group("/api")
	{
		routes.RegisterAuthRoutes(apiGroup, appState)
		routes.RegisterApplicationRoutes(apiGroup, appState)
		routes.RegisterCompanyRoutes(apiGroup, appState)
		routes.RegisterJobRoutes(apiGroup, appState)
		routes.RegisterExtractRoutes(apiGroup, appState)
		routes.RegisterFileRoutes(apiGroup, appState)
		routes.RegisterInterviewRoutes(apiGroup, appState)
		routes.RegisterInterviewerRoutes(apiGroup, appState)
		routes.RegisterInterviewQuestionRoutes(apiGroup, appState)
		routes.RegisterInterviewNoteRoutes(apiGroup, appState)
		routes.RegisterAssessmentRoutes(apiGroup, appState)
		routes.RegisterDashboardRoutes(apiGroup, appState)
		routes.RegisterNotificationRoutes(apiGroup, appState)
		routes.RegisterTimelineRoutes(apiGroup, appState)
		routes.RegisterSearchRoutes(apiGroup, appState)
		routes.RegisterExportRoutes(apiGroup, appState)
	}

	scheduler := services.NewNotificationScheduler(appState.DB)
	scheduler.Start(15 * time.Minute)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down...")
		scheduler.Stop()
		os.Exit(0)
	}()

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
