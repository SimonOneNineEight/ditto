package main

import (
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/routes"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/response"
	"log"
	"os"

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
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
