package main

import (
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/routes"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/response"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
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

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:8082", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
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
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
