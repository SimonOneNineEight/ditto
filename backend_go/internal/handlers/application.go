package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ApplicationHandler struct {
	applicationRepo *repository.ApplicationRepository
}

type UpdateApplicationStatusReq struct {
	ApplicationStatusID uuid.UUID `json:"application_status_id" binding:"required"`
}

func NewApplicationHandler(applicationRepo *repository.ApplicationRepository) *ApplicationHandler {
	return &ApplicationHandler{
		applicationRepo: applicationRepo,
	}
}

// GET /api/application
func (h *ApplicationHandler) GetApplications(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	filters := parseApplicationFilters(c)

	applications, err := h.applicationRepo.GetApplicationsByUser(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	total, err := h.applicationRepo.GetApplicationCount(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"applications": applications,
		"total":        total,
		"page":         filters.Offset/filters.Limit + 1,
		"limit":        filters.Limit,
		"has_more":     total > (filters.Offset + filters.Limit),
	})
}

// GET /api/applications/with-details
func (h *ApplicationHandler) GetApplicationsWithDetails(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	filters := parseApplicationFilters(c)

	applications, err := h.applicationRepo.GetApplicationsWithDetails(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	total, err := h.applicationRepo.GetApplicationCount(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"applications": applications,
		"total":        total,
		"page":         filters.Offset/filters.Limit + 1,
		"limit":        filters.Limit,
		"has_more":     total > (filters.Offset + filters.Limit),
	})
}

// GET /api/applications/:id
func (h *ApplicationHandler) GetApplication(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	applicationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid application ID"))
		return
	}

	application, err := h.applicationRepo.GetApplicationByID(applicationID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, application)
}

// POST /api/application
func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var application models.Application
	if err := c.ShouldBindJSON(&application); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	if application.JobID == uuid.Nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "job_id is required"))
		return
	}

	if application.ApplicationStatusID == uuid.Nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "application_status_id is required"))
		return
	}

	if application.AppliedAt.IsZero() {
		application.AppliedAt = time.Now()
	}

	if application.AttemptNumber == 0 {
		application.AttemptNumber = 1
	}

	createdApplication, err := h.applicationRepo.CreateApplication(userID, &application)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, createdApplication)
}

// PUT /api/application/:id
func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	applicationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid application ID"))
		return
	}

	var updates map[string]any
	if err := c.ShouldBindJSON(&updates); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	// Remove fields that shouldn't be updated directly
	delete(updates, "id")
	delete(updates, "user_id")
	delete(updates, "created_at")
	delete(updates, "updated_at")
	delete(updates, "deleted_at")

	updatedApplication, err := h.applicationRepo.UpdateApplication(applicationID, userID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, updatedApplication)
}

// PATCH /api/applications/:id/status
func (h *ApplicationHandler) UpdateApplicationStatus(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	applicationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid application ID"))
		return
	}

	var request UpdateApplicationStatusReq
	if err := c.ShouldBindJSON(&request); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest,
			"application_status_id is required"))
		return
	}

	err = h.applicationRepo.UpdateApplicationStatus(applicationID, userID,
		request.ApplicationStatusID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Return updated application
	application, err := h.applicationRepo.GetApplicationByID(applicationID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, application)
}

// DELETE /api/applications/:id
func (h *ApplicationHandler) DeleteApplication(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	applicationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid application ID"))
		return
	}

	err = h.applicationRepo.SoftDeleteApplication(applicationID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "Application deleted successfully"})
}

// GET /api/applications/stats
func (h *ApplicationHandler) GetApplicationStats(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	statusCounts, err := h.applicationRepo.GetApplicationsByStatus(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"status_counts": statusCounts,
	})
}

// GET /api/applications/recent
func (h *ApplicationHandler) GetRecentApplications(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	if limit > 100 {
		limit = 100
	}

	applications, err := h.applicationRepo.GetRecentApplications(userID, limit)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"applications": applications,
	})
}

// GET /api/application-statuses
func (h *ApplicationHandler) GetApplicationStatuses(c *gin.Context) {
	statuses, err := h.applicationRepo.GetApplicationStatusCached()
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"statuses": statuses,
	})
}

func parseApplicationFilters(c *gin.Context) *repository.ApplicationFilters {
	filters := &repository.ApplicationFilters{
		Limit:  50,
		Offset: 0,
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			if limit > 100 {
				limit = 100
			}
			filters.Limit = limit
		}
	}

	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filters.Offset = (page - 1) * filters.Limit
		}
	}

	filters.JobTitle = c.Query("job_title")
	filters.CompanyName = c.Query("company_name")

	if jobIDStr := c.Query("job_id"); jobIDStr != "" {
		if jobID, err := uuid.Parse(jobIDStr); err == nil {
			filters.JobID = &jobID
		}
	}

	if companyIDStr := c.Query("companyID"); companyIDStr != "" {
		if companyID, err := uuid.Parse(companyIDStr); err == nil {
			filters.CompanyID = &companyID
		}
	}

	if statusIDStr := c.Query("status_id"); statusIDStr != "" {
		if statusID, err := uuid.Parse(statusIDStr); err == nil {
			filters.StatusID = &statusID
		}
	}

	if offerReceivedStr := c.Query("offer_received"); offerReceivedStr != "" {
		if offerReceived, err := strconv.ParseBool(offerReceivedStr); err == nil {
			filters.OfferReceived = &offerReceived
		}
	}

	if dateFromStr := c.Query("date_from"); dateFromStr != "" {
		if dateFrom, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			filters.DateFrom = &dateFrom
		}
	}

	if dateToStr := c.Query("date_to"); dateToStr != "" {
		if dateTo, err := time.Parse("2006-01-02", dateToStr); err == nil {
			filters.DateTo = &dateTo
		}
	}

	return filters
}
