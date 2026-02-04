package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ApplicationHandler struct {
	applicationRepo *repository.ApplicationRepository
	companyRepo     *repository.CompanyRepository
	jobRepo         *repository.JobRepository
}

type UpdateApplicationStatusReq struct {
	ApplicationStatusID uuid.UUID `json:"application_status_id" binding:"required"`
}

type QuickCreateApplicationReq struct {
	CompanyName string `json:"company_name" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Location    string `json:"location"`
	JobType     string `json:"job_type" binding:"omitempty,oneof=full-time part-time contract internship"`
	SourceURL   string `json:"source_url" binding:"omitempty,url,max=2048"`
	Platform    string `json:"platform" binding:"omitempty,max=50"`
	Notes       string `json:"notes" binding:"max=10000"`
}

func NewApplicationHandler(appState *utils.AppState) *ApplicationHandler {
	return &ApplicationHandler{
		applicationRepo: repository.NewApplicationRepository(appState.DB),
		companyRepo:     repository.NewCompanyRepository(appState.DB),
		jobRepo:         repository.NewJobRepository(appState.DB),
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

func (h *ApplicationHandler) QuickCreateApplication(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req QuickCreateApplicationReq
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "company_name and title are required"))
		return
	}

	company, err := h.companyRepo.GetOrCreateCompany(req.CompanyName, nil)
	if err != nil {
		HandleError(c, err)
		return
	}

	job := &models.Job{
		CompanyID:      company.ID,
		Title:          req.Title,
		JobDescription: req.Description,
		Location:       req.Location,
		JobType:        req.JobType,
	}

	if req.SourceURL != "" {
		job.SourceURL = &req.SourceURL
	}

	if req.Platform != "" {
		job.Platform = &req.Platform
	}

	createdJob, err := h.jobRepo.CreateJob(userID, job)
	if err != nil {
		HandleError(c, err)
		return
	}

	appliedStatusID, err := h.applicationRepo.GetApplicationStatusIDByName("Applied")
	if err != nil {
		HandleError(c, errors.New(errors.ErrorInternalServer, err.Error()))
		return
	}

	application := &models.Application{
		JobID:               createdJob.ID,
		ApplicationStatusID: appliedStatusID,
		AppliedAt:           time.Now(),
		AttemptNumber:       1,
	}

	if req.Notes != "" {
		application.Notes = &req.Notes
	}

	createdApplication, err := h.applicationRepo.CreateApplication(userID, application)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"application": createdApplication,
		"job":         createdJob,
		"company":     company,
	})
}

// PUT /api/application/:id
func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	applicationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid application ID"))
		return
	}

	var req QuickCreateApplicationReq
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
		return
	}

	// Get existing application to find its job_id
	existingApp, err := h.applicationRepo.GetApplicationByID(applicationID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Update or create company
	company, err := h.companyRepo.GetOrCreateCompany(req.CompanyName, nil)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Update the job
	jobUpdates := map[string]any{
		"company_id":      company.ID,
		"title":           req.Title,
		"job_description": req.Description,
		"location":        req.Location,
		"job_type":        req.JobType,
	}
	if req.SourceURL != "" {
		jobUpdates["source_url"] = req.SourceURL
	}
	if req.Platform != "" {
		jobUpdates["platform"] = req.Platform
	}

	_, err = h.jobRepo.UpdateJob(existingApp.JobID, userID, jobUpdates)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Update application-level fields (notes)
	appUpdates := map[string]any{}
	if req.Notes != "" {
		appUpdates["notes"] = req.Notes
	}

	if len(appUpdates) > 0 {
		_, err = h.applicationRepo.UpdateApplication(applicationID, userID, appUpdates)
		if err != nil {
			HandleError(c, err)
			return
		}
	}

	// Return updated application with details
	response.Success(c, gin.H{
		"id": applicationID,
	})
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

	// Parse sort params
	if sortBy := c.Query("sort_by"); sortBy != "" {
		// Validate sort column
		validSortColumns := map[string]bool{
			"company": true, "position": true, "status": true,
			"applied_at": true, "location": true,
		}
		if validSortColumns[sortBy] {
			filters.SortBy = sortBy
		}
	}

	if sortOrder := c.Query("sort_order"); sortOrder == "asc" || sortOrder == "desc" {
		filters.SortOrder = sortOrder
	}

	return filters
}
