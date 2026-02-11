package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterCompanyRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	companyHandler := handlers.NewCompanyHandler(appState)

	companies := apiGroup.Group("/companies")
	{
		companies.GET("", companyHandler.GetCompanies)
		companies.GET("/autocomplete", companyHandler.AutocompleteCompanies)
		companies.GET("/search", companyHandler.SearchCompanies)
		companies.GET("/:id", companyHandler.GetCompany)

		companies.POST("/select", middleware.AuthMiddleware(), middleware.CSRFMiddleware(), companyHandler.SelectOrCreateCompany)
		companies.POST("", middleware.AuthMiddleware(), middleware.CSRFMiddleware(), companyHandler.CreateCompany)

		companies.PUT("/:id", middleware.AuthMiddleware(), middleware.CSRFMiddleware(), companyHandler.UpdateCompany)

		companies.DELETE("/:id", middleware.AuthMiddleware(), middleware.CSRFMiddleware(), companyHandler.DeleteCompany)
	}
}
