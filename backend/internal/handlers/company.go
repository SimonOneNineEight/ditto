package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CompanyHandler struct {
	companyRepo *repository.CompanyRepository
}

func NewCompanyHandler(appState *utils.AppState) *CompanyHandler {
	return &CompanyHandler{
		companyRepo: repository.NewCompanyRepository(appState.DB),
	}
}

// GET /api/companies
func (h *CompanyHandler) GetCompanies(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}

	if limit > 100 {
		limit = 100
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	companies, err := h.companyRepo.GetCompaniesWithJobCount(limit, offset)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"companies": companies,
		"limit":     limit,
		"offset":    offset,
		"has_more":  len(companies) == limit,
	})
}

// GET /api/companies/autocomplete?q=input
func (h *CompanyHandler) AutocompleteCompanies(c *gin.Context) {
	input := strings.TrimSpace(c.Query("q"))
    if len(input) < 2 {
        response.Success(c, gin.H{"suggestions": []*models.CompanySuggestion{}})
        return
    }

    limit := 10

    localSuggestions, err := h.companyRepo.AutocompleteCompanies(input, limit)
    if err != nil {
        HandleError(c, err)
        return
    }

    suggestions := make([]*models.CompanySuggestion, 0, limit)
    suggestions = append(suggestions, localSuggestions...)

    remainingLimit := limit - len(suggestions)

    if remainingLimit > 0 {
        externalSuggestions, err := h.companyRepo.FetchExternalSuggestions(input, remainingLimit)
        if err == nil {
            suggestions = append(suggestions, externalSuggestions...)
        }
    }

    response.Success(c, gin.H{
        "suggestions": suggestions,
        "query":       input,
    })
}

// POST /api/companies/select
func (h *CompanyHandler) SelectOrCreateCompany(c *gin.Context) {
    var request struct {
        CompanyID *uuid.UUID `json:"company_id"`
        CompanyName string `json:"company_name"`
        Domain *string `json:"domain"`
        LogoURL *string `json:"logo_url"`
        Website *string `json:"website"`
    }

    if err := c.ShouldBindJSON(&request); err != nil {
        HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request"))
        return
    }

    var company *models.Company
    var err error 

    if request.CompanyID != nil {
        company, err = h.companyRepo.GetCompanyByID(*request.CompanyID)
    } else if request.CompanyName != "" {
        var enrichmentData *models.CompanyEnrichmentData

        if request.Domain != nil || request.LogoURL != nil || request.Website != nil {
            enrichmentData = &models.CompanyEnrichmentData{}
            if request.Domain != nil {
                enrichmentData.Domain = *request.Domain
            }
            if request.LogoURL != nil {
                enrichmentData.LogoURL = *request.LogoURL
            }
            if request.Website != nil {
                enrichmentData.Website = *request.Website
            }
        }

        company, err = h.companyRepo.GetOrCreateCompany(request.CompanyName, enrichmentData)
    } else {
        HandleError(c, errors.New(errors.ErrorBadRequest, "company_id or company_name required"))
        return
    }

    if err != nil {
        HandleError(c, err)
        return
    }

    response.Success(c, company)
}

// GET /companies/:id
func (h *CompanyHandler) GetCompany(c *gin.Context) {
    companyID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        HandleError(c, errors.New(errors.ErrorBadRequest, "invalid company ID"))
        return
    }
    
    company, err := h.companyRepo.GetCompanyByID(companyID)
    if err != nil {
        HandleError(c, err)
        return
    }
    
    response.Success(c, company)
}

// GET /companies/search
func (h *CompanyHandler) SearchCompanies(c *gin.Context) {
    name := c.Query("name")
    if name == "" {
        HandleError(c, errors.New(errors.ErrorBadRequest, "name query parameter is required"))
        return
    }
    
    limitStr := c.DefaultQuery("limit", "50")
    offsetStr := c.DefaultQuery("offset", "0")
    
    limit, err := strconv.Atoi(limitStr)
    if err != nil || limit <= 0 {
        limit = 50
    }
    if limit > 100 {
        limit = 100
    }
    
    offset, err := strconv.Atoi(offsetStr)
    if err != nil || offset < 0 {
        offset = 0
    }
    
    companies, err := h.companyRepo.SearchCompaniesByName(name, limit, offset)
    if err != nil {
        HandleError(c, err)
        return
    }
    
    response.Success(c, gin.H{
        "companies": companies,
        "query":     name,
        "limit":     limit,
        "offset":    offset,
        "has_more":  len(companies) == limit,
    })
}

// POST /companies
func (h *CompanyHandler) CreateCompany(c *gin.Context) {
    var company models.Company
    if err := c.ShouldBindJSON(&company); err != nil {
        HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
        return
    }
    
    // Validate required fields
    if company.Name == "" {
        HandleError(c, errors.New(errors.ErrorBadRequest, "company name is required"))
        return
    }
    
    createdCompany, err := h.companyRepo.CreateCompany(&company)
    if err != nil {
        HandleError(c, err)
        return
    }
    
    response.Success(c, createdCompany)
}

// PUT /companies/:id
func (h *CompanyHandler) UpdateCompany(c *gin.Context) {
    companyID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        HandleError(c, errors.New(errors.ErrorBadRequest, "invalid company ID"))
        return
    }
    
    var updates map[string]interface{}
    if err := c.ShouldBindJSON(&updates); err != nil {
        HandleError(c, errors.New(errors.ErrorBadRequest, "invalid request body"))
        return
    }
    
    // Remove fields that shouldn't be updated directly
    delete(updates, "id")
    delete(updates, "created_at")
    delete(updates, "updated_at")
    delete(updates, "deleted_at")
    delete(updates, "last_enriched_at")
    delete(updates, "opencorp_id")
    
    if len(updates) == 0 {
        HandleError(c, errors.New(errors.ErrorBadRequest, "no fields to update"))
        return
    }
    
    updatedCompany, err := h.companyRepo.UpdateCompany(companyID, updates)
    if err != nil {
        HandleError(c, err)
        return
    }
    
    response.Success(c, updatedCompany)
}

// DELETE /companies/:id
func (h *CompanyHandler) DeleteCompany(c *gin.Context) {
    companyID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        HandleError(c, errors.New(errors.ErrorBadRequest, "invalid company ID"))
        return
    }
    
    err = h.companyRepo.SoftDeleteCompany(companyID)
    if err != nil {
        HandleError(c, err)
        return
    }
    
    response.Success(c, gin.H{"message": "Company deleted successfully"})
}
