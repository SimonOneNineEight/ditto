package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type JobHandler struct {
	jobRepo     *repository.JobRepository
	companyRepo *repository.CompanyRepository
	validator   *validator.Validate
}

func NewJobHandler(appState *utils.AppState) *JobHandler {
	return &JobHandler{
		jobRepo:     repository.NewJobRepository(appState.DB),
		companyRepo: repository.NewCompanyRepository(appState.DB),
		validator:   validator.New(),
	}
}

type CreateJobRequest struct {
	CompanyID      *uuid.UUID `json:"company_id"`
	CompanyName    *string    `json:"company_name,omitempty"`
	Title          string     `json:"title" validate:"required,min=1,max=255"`
	JobDescription string     `json:"job_description" validate:"required,min=1"`
	Location       string     `json:"location" validate:"required,min=1"`
	JobType        string     `json:"job_type" validate:"required,max=50"`
	MinSalary      *float64   `json:"min_salary,omitempty"`
	MaxSalary      *float64   `json:"max_salary,omitempty"`
	Currency       *string    `json:"currency,omitempty"`
}

type UpdateJobRequest struct {
	Title          *string  `json:"title,omitempty" validate:"omitempty,min=1,max=255"`
	JobDescription *string  `json:"job_description,omitempty" validate:"omitempty,min=1"`
	Location       *string  `json:"location,omitempty" validate:"omitempty,min=1"`
	JobType        *string  `json:"job_type,omitempty" validate:"omitempty,max=50"`
	MinSalary      *float64 `json:"min_salary,omitempty"`
	MaxSalary      *float64 `json:"max_salary,omitempty"`
	Currency       *string  `json:"currency,omitempty"`
	IsExpired      *bool    `json:"is_expired,omitempty"`
}

type JobFiltersRequest struct {
	Search    string `form:"search"`
	JobType   string `form:"job_type"`
	Location  string `form:"location"`
	MinSalary string `form:"min_salary"`
	MaxSalary string `form:"max_salary"`
	IsExpired string `form:"is_expired"`
	CompanyID string `form:"company_id"`
	Page      string `form:"page"`
	Limit     string `form:"limit"`
}

// GET /api/jobs
func (h *JobHandler) GetJobs(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	filters, page, limit, err := h.parseJobFilters(c)
	if err != nil {
		HandleError(c, err)
		return
	}

	jobs, err := h.jobRepo.GetJobsByUser(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	totalCount, err := h.jobRepo.GetJobCount(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"jobs":        jobs,
		"total_count": totalCount,
		"page":        page,
		"limit":       limit,
		"total_pages": (totalCount + limit - 1) / limit,
	})
}

// POST /api/jobs
func (h *JobHandler) CreateJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	var company *models.Company
	var err error

	if req.CompanyID != nil {
		company, err = h.companyRepo.GetCompanyByID(*req.CompanyID)
	} else if req.CompanyName != nil && *req.CompanyName != "" {
		company, err = h.companyRepo.GetOrCreateCompany(*req.CompanyName, nil)
	} else {
		HandleError(c, errors.New(errors.ErrorBadRequest, "either company_id or company_name is required"))
		return
	}

	if err != nil {
		HandleError(c, err)
		return
	}

	job := &models.Job{
		CompanyID:      company.ID,
		Title:          req.Title,
		JobDescription: req.JobDescription,
		Location:       req.Location,
		JobType:        req.JobType,
		MinSalary:      req.MinSalary,
		MaxSalary:      req.MaxSalary,
		Currency:       req.Currency,
	}

	createdJob, err := h.jobRepo.CreateJob(userID, job)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, createdJob)
}

// GET /api/jobs/:id
func (h *JobHandler) GetJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "invalid job ID"))
		return
	}

	job, err := h.jobRepo.GetJobByID(jobID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, job)
}

// PUT /api/jobs/:id
func (h *JobHandler) UpdateJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "invalid job ID"))
		return
	}

	var req CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	_, err = h.companyRepo.GetCompanyByID(*req.CompanyID)
	if err != nil {
		if IsNotFoundError(err) {
			HandleError(c, errors.New(errors.ErrorNotFound, "company not found"))
			return
		}

		HandleError(c, err)
		return
	}

	updates := map[string]any{
		"company_id":      req.CompanyID,
		"title":           req.Title,
		"job_description": req.JobDescription,
		"location":        req.Location,
		"job_type":        req.JobType,
		"min_salary":      req.MinSalary,
		"max_salary":      req.MaxSalary,
		"currency":        req.Currency,
	}

	updatedJob, err := h.jobRepo.UpdateJob(jobID, userID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, updatedJob)
}

// PATCH /api/jobs/:id
func (h *JobHandler) PatchJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "invalid job ID"))
		return
	}

	var req UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	updates := make(map[string]any)

	if req.Title != nil {
		updates["title"] = *req.Title
	}

	if req.JobDescription != nil {
		updates["job_description"] = *req.JobDescription
	}

	if req.Location != nil {
		updates["location"] = *req.Location
	}

	if req.JobType != nil {
		updates["job_type"] = *req.JobType
	}

	if req.MinSalary != nil {
		updates["min_salary"] = *req.MinSalary
	}

	if req.MaxSalary != nil {
		updates["max_salary"] = *req.MaxSalary
	}

	if req.Currency != nil {
		updates["currency"] = *req.Currency
	}

	if req.IsExpired != nil {
		updates["is_expired"] = *req.IsExpired
	}

	if len(updates) == 0 {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "no fields to update"))
		return
	}

	updatedJob, err := h.jobRepo.UpdateJob(jobID, userID, updates)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, updatedJob)
}

// DELETE /api/jobs/:id
func (h *JobHandler) DeleteJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "invalid job ID"))
		return
	}

	err = h.jobRepo.SoftDeleteJob(jobID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "job deleted successfully"})
}

// GET /api/jobs/with-details
func (h *JobHandler) GetJobsWithDetails(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	filters, page, limit, err := h.parseJobFilters(c)
	if err != nil {
		HandleError(c, err)
		return
	}

	jobsWithDetails, err := h.jobRepo.GetJobsWithCompany(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"jobs": jobsWithDetails, "page": page, "limit": limit, "has_more": len(jobsWithDetails) == limit})
}

func (h *JobHandler) parseJobFilters(c *gin.Context) (*repository.JobFilters, int, int, error) {
	var filterReq JobFiltersRequest
	if err := c.ShouldBindQuery(&filterReq); err != nil {
		return nil, 0, 0, err
	}

	filters := &repository.JobFilters{
		Search:   filterReq.Search,
		JobType:  filterReq.JobType,
		Location: filterReq.Location,
	}

	if filterReq.MinSalary != "" {
		if minSalary, err := strconv.ParseFloat(filterReq.MinSalary, 64); err == nil {
			filters.MinSalary = &minSalary
		}
	}

	if filterReq.MaxSalary != "" {
		if maxSalary, err := strconv.ParseFloat(filterReq.MaxSalary, 64); err == nil {
			filters.MaxSalary = &maxSalary
		}
	}

	if filterReq.IsExpired != "" {
		if isExpired, err := strconv.ParseBool(filterReq.IsExpired); err == nil {
			filters.IsExpired = &isExpired
		}
	}

	if filterReq.CompanyID != "" {
		if companyID, err := uuid.Parse(filterReq.CompanyID); err == nil {
			filters.CompanyID = &companyID
		}
	}

	page := 1
	if filterReq.Page != "" {
		if p, err := strconv.Atoi(filterReq.Page); err == nil && p > 0 {
			page = p
		}
	}

	limit := 50
	if filterReq.Limit != "" {
		if l, err := strconv.Atoi(filterReq.Limit); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	filters.Limit = limit
	filters.Offset = (page - 1) * limit

	return filters, page, limit, nil
}
