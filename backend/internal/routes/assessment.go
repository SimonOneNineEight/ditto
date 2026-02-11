package routes

import (
	"ditto-backend/internal/handlers"
	"ditto-backend/internal/middleware"
	"ditto-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func RegisterAssessmentRoutes(apiGroup *gin.RouterGroup, appState *utils.AppState) {
	assessmentHandler := handlers.NewAssessmentHandler(appState)

	assessments := apiGroup.Group("/assessments")
	assessments.Use(middleware.AuthMiddleware())
	assessments.Use(middleware.CSRFMiddleware())
	{
		assessments.POST("", assessmentHandler.CreateAssessment)
		assessments.GET("", assessmentHandler.ListAssessments)
		assessments.GET("/:id", assessmentHandler.GetAssessment)
		assessments.GET("/:id/details", assessmentHandler.GetAssessmentDetails)
		assessments.PUT("/:id", assessmentHandler.UpdateAssessment)
		assessments.PATCH("/:id/status", assessmentHandler.UpdateStatus)
		assessments.DELETE("/:id", assessmentHandler.DeleteAssessment)
		assessments.POST("/:id/submissions", assessmentHandler.CreateSubmission)
	}

	submissions := apiGroup.Group("/assessment-submissions")
	submissions.Use(middleware.AuthMiddleware())
	submissions.Use(middleware.CSRFMiddleware())
	{
		submissions.DELETE("/:submissionId", assessmentHandler.DeleteSubmission)
	}
}
