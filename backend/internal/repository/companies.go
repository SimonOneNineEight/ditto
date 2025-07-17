package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type CompanyRepository struct {
	db *sqlx.DB
}

type CompanyWithJobCount struct {
	models.Company
	JobCount int `json:"job_count"`
}

func NewCompanyRepository(database *database.Database) *CompanyRepository {
	return &CompanyRepository{
		db: database.DB,
	}
}

func (r *CompanyRepository) CreateCompany(company *models.Company) (*models.Company, error) {
	company.ID = uuid.New()
	company.CreatedAt = time.Now()
	company.UpdatedAt = time.Now()

	query := `
        INSERT INTO companies (id, name, description, website, logo_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `

	_, err := r.db.Exec(query, company.ID, company.Name, company.Description, company.Website, company.LogoURL, company.CreatedAt, company.UpdatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return company, nil
}

func (r *CompanyRepository) GetCompanyByID(companyID uuid.UUID) (*models.Company, error) {
	company := &models.Company{}

	query := `
        SELECT id, name, description, website, logo_url, created_at, updated_at
        FROM companies
        WHERE id = $1 AND deleted_at IS NULL
    `

	err := r.db.Get(company, query, companyID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return company, nil
}

func (r *CompanyRepository) GetCompanyByName(name string) (*models.Company, error) {
	company := &models.Company{}

	query := `
        SELECT id, name, description, website, logo_url, created_at, updated_at
        FROM companies
        WHERE name = $1 AND deleted_at IS NULL
    `

	err := r.db.Get(company, query, name)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return company, nil
}

func (r *CompanyRepository) UpdateCompany(companyID uuid.UUID, updates map[string]any) (*models.Company, error) {
	if len(updates) == 0 {
		return r.GetCompanyByID(companyID)
	}

	setParts := []string{}
	args := []any{}
	argIndex := 1

	for field, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s = $%d", field, argIndex))
		args = append(args, value)
		argIndex++
	}

	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	args = append(args, companyID)

	query := fmt.Sprintf(
		`
            UPDATE companies
            SET %s
            WHERE id = $%d AND deleted_at IS NULL
        `, strings.Join(setParts, ", "), argIndex)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	rowAffected, err := result.RowsAffected()
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	if rowAffected == 0 {
		return nil, errors.New(errors.ErrorNotFound, "company not found")
	}

	return r.GetCompanyByID(companyID)
}

func (r *CompanyRepository) GetCompaniesWithJobCount(limit, offset int) ([]*CompanyWithJobCount, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
        SELECT c.id, c.name, c.description, c.website, c.logo_url, c.created_at, c.updated_at,
            COALESCE(job_counts.job_count, 0) as job_count
        FROM companies c
        LEFT JOIN (
            SELECT company_id, COUNT(*) as job_count
            FROM jobs
            WHERE deleted_at IS NULL
            GROUP BY company_id
        ) job_counts ON c.id = job_counts.company_id
        WHERE c.deleted_at IS NULL
        ORDER BY job_counts.job_count DESC, c.name ASC
        LIMIT $1
        OFFSET $2
    `

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, errors.ConvertError(err)
	}
	defer rows.Close()

	var companies []*CompanyWithJobCount
	for rows.Next() {
		var company models.Company
		var jobCount int

		err := rows.Scan(
			&company.ID, &company.Name, &company.Description, &company.Website, &company.LogoURL, &company.CreatedAt, &company.UpdatedAt, &jobCount,
		)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		companies = append(companies, &CompanyWithJobCount{
			Company:  company,
			JobCount: jobCount,
		})
	}

	return companies, nil
}

func (r *CompanyRepository) SearchCompaniesByName(name string, limit, offset int) ([]*models.Company, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
        SELECT id, name, description, website, logo_url, created_at, updated_at
        FROM companies
        WHERE name ILIKE $1 AND deleted_at IS NULL
        ORDER BY name ASC
        LIMIT $2 
        OFFSET $3
    `

	var companies []*models.Company
	err := r.db.Select(&companies, query, "%"+name+"%", limit, offset)
	if err != nil {
		return nil, errors.ConvertError(err)
	}
	return companies, nil
}

func (r *CompanyRepository) SoftDeleteCompany(companyID uuid.UUID) error {
	query := `
        UPDATE companies
        SET deleted_at = $1, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
    `
	result, err := r.db.Exec(query, time.Now(), companyID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return errors.New(errors.ErrorNotFound, "company not found")
	}

	return nil
}

func (r *CompanyRepository) GetOrCreateCompany(name string, enrichmentData *models.CompanyEnrichmentData) (*models.Company, error) {
	existing, err := r.FindCompanyByNameFuzzy(name)
	if err == nil && existing != nil {
		return existing, nil
	}

	company := &models.Company{
		Name:      strings.TrimSpace(name),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if enrichmentData != nil {
		if enrichmentData.Domain != "" {
			company.Domain = &enrichmentData.Domain
		}

		if enrichmentData.LogoURL != "" {
			company.LogoURL = &enrichmentData.LogoURL
		}

		if enrichmentData.Website != "" {
			company.Website = &enrichmentData.Website
		}

		now := time.Now()
		company.LastEnrichedAt = &now
	}

	createdCompany, err := r.CreateCompany(company)
	if err != nil {
		return nil, err
	}

	if enrichmentData == nil {
		go r.EnrichCompanyAsync(createdCompany.ID, name)
	}

	return createdCompany, nil
}

func (r *CompanyRepository) FindCompanyByNameFuzzy(name string) (*models.Company, error) {
	query := `
        SELECT id, name, description, website, logo_url, domain, last_enriched_at, opencorp_id, created_at, updated_at
        FROM companies
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        AND deleted_at IS NULL
        LIMIT 1
    `

	company := &models.Company{}
	err := r.db.Get(company, query, strings.TrimSpace(name))
	if err == nil {
		return company, nil
	}

	domainQuery := `
        SELECT id, name, description, website, logo_url, domain, last_enriched_at, opencorp_id, created_at, updated_at
        FROM companies
        WHERE domain IS NOT NULL
        AND domain = (
            SELECT domain
            FROM companies
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
            LIMIT 1
        )
        AND deleted_at IS NULL
        LIMIT 1
    `

	err = r.db.Get(company, domainQuery, strings.TrimSpace(name))
	if err == nil {
		return company, nil
	}

	return nil, errors.ConvertError(err)
}

func (r *CompanyRepository) AutocompleteCompanies(input string, limit int) ([]*models.CompanySuggestion, error) {
	if limit < 0 {
		limit = 10
	}

	query := `
        SELECT id, name, domain, logo_url, website
        FROM companies
        WHERE (name ILIKE $1 OR domain ILIKE $1)
        AND deleted_at IS NULL
        ORDER BY
            CASE WHEN LOWER(name) = LOWER($2) THEN 1 ELSE 2 END,
            length(name),
            name,
        LIMIT $3
    `

	searchTerm := "%" + strings.TrimSpace(input) + "%"
	exactTerm := strings.TrimSpace(input)

	rows, err := r.db.Query(query, searchTerm, exactTerm, limit)
	if err != nil {
		return nil, errors.ConvertError(err)
	}
	defer rows.Close()

	var suggestions []*models.CompanySuggestion
	for rows.Next() {
		var id uuid.UUID
		var name string
		var domain, logoURL, website *string

		err := rows.Scan(&id, &name, &domain, &logoURL, &website)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		suggestions = append(suggestions, &models.CompanySuggestion{
			ID:      &id,
			Name:    name,
			Domain:  domain,
			LogoURL: logoURL,
			Website: website,
			Source:  "Saved",
		})
	}

	return suggestions, nil
}

func (r *CompanyRepository) EnrichCompanyAsync(companyID uuid.UUID, name string) {
	enrichmentData, err := r.fetchEnrichmentData(name)
	if err != nil {
		log.Printf("Failed to enrich company %s: %v", name, err)
		return
	}

	updates := map[string]any{
		"last_enriched_at": time.Now(),
	}

	if enrichmentData.Domain != "" {
		updates["domain"] = enrichmentData.Domain
	}

	if enrichmentData.LogoURL != "" {
		updates["logo_url"] = enrichmentData.LogoURL
	}

	if enrichmentData.Website != "" {
		updates["website"] = enrichmentData.Website
	}

	_, err = r.UpdateCompany(companyID, updates)
	if err != nil {
		log.Printf("Failed to update enriched company %s: %v", name, err)
	}
}

func (r *CompanyRepository) fetchEnrichmentData(name string) (*models.CompanyEnrichmentData, error) {
	client := &http.Client{Timeout: 5 * time.Second}

	clearoutURL := fmt.Sprintf("https://api.clearout.io/public/companies/autocomplete?query=%s",
		url.QueryEscape(name))

	response, err := client.Get(clearoutURL)
	if err != nil {
		return nil, err
	}

	defer response.Body.Close()

	var clearoutResponse struct {
		Data []struct {
			Name    string `json:"name"`
			Domain  string `json:"domain"`
			LogoURL string `json:"logo"`
			Website string `json:"website"`
		} `json:"data"`
	}

	if err := json.NewDecoder(response.Body).Decode(&clearoutResponse); err != nil {
		return nil, err
	}

	trimmedName := strings.TrimSpace(name)

	for _, item := range clearoutResponse.Data {
		if strings.EqualFold(strings.TrimSpace(item.Name), trimmedName) {
			return &models.CompanyEnrichmentData{
				Domain:   item.Domain,
				LogoURL:  item.LogoURL,
				Website:  item.Website,
				Verified: true,
			}, nil
		}
	}

	if len(clearoutResponse.Data) > 0 {
		item := clearoutResponse.Data[0]
		return &models.CompanyEnrichmentData{
			Domain:   item.Domain,
			LogoURL:  item.LogoURL,
			Website:  item.Website,
			Verified: false,
		}, nil
	}

	return nil, fmt.Errorf("no enrichment data found")
}

func (c *CompanyRepository) FetchExternalSuggestions(input string, limit int) ([]*models.CompanySuggestion, error) {
	client := &http.Client{Timeout: 3 * time.Second}

	clearoutURL := fmt.Sprintf("https://api.clearout.io/public/companies/autocomplete?query=%s",
		url.QueryEscape(input))

	resp, err := client.Get(clearoutURL)
	if err != nil {
		return []*models.CompanySuggestion{}, nil
	}
	defer resp.Body.Close()

	var clearoutResponse struct {
		Data []struct {
			Name    string `json:"name"`
			Domain  string `json:"domain"`
			LogoURL string `json:"logo"`
			Website string `json:"website"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&clearoutResponse); err != nil {
		return []*models.CompanySuggestion{}, nil
	}

	var suggestions []*models.CompanySuggestion

	for i, item := range clearoutResponse.Data {
		if i >= limit {
			break
		}

		suggestion := &models.CompanySuggestion{
			ID:     nil,
			Name:   item.Name,
			Source: "suggestion",
		}

		if item.Domain != "" {
			suggestion.Domain = &item.Domain
		}
		if item.LogoURL != "" {
			suggestion.LogoURL = &item.LogoURL
		}
		if item.Website != "" {
			suggestion.Website = &item.Website
		}

		suggestions = append(suggestions, suggestion)

	}
	return suggestions, nil
}
