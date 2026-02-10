package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type ApplicationRepository struct {
	db              *sqlx.DB
	statusListCache []*models.ApplicationStatus
	statusMapCache  map[string]uuid.UUID
	statusCacheTime time.Time
	statusCacheMu   sync.RWMutex
}

type ApplicationFilters struct {
	JobTitle       string
	CompanyName    string
	StatusID       *uuid.UUID
	StatusIDs      []uuid.UUID
	OfferReceived  *bool
	JobID          *uuid.UUID
	CompanyID      *uuid.UUID
	DateFrom       *time.Time
	DateTo         *time.Time
	HasInterviews  *bool
	HasAssessments *bool
	SortBy         string
	SortOrder      string
	Limit          int
	Offset         int
}

type ApplicationWithDetails struct {
	models.Application
	Job     *models.Job               `json:"job,omitempty"`
	Company *models.Company           `json:"company,omitempty"`
	Status  *models.ApplicationStatus `json:"status,omitempty"`
}

func NewApplicationRepository(database *database.Database) *ApplicationRepository {
	return &ApplicationRepository{
		db: database.DB,
	}
}

func (r *ApplicationRepository) CreateApplication(userID uuid.UUID, application *models.Application) (*models.Application, error) {
	application.ID = uuid.New()
	application.UserID = userID
	application.CreatedAt = time.Now()
	application.UpdatedAt = time.Now()

	query := `
        INSERT INTO applications (
            id, user_id, job_id, application_status_id, applied_at, 
            offer_received, attempt_number, notes, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `

	_, err := r.db.Exec(query, application.ID, application.UserID, application.JobID,
		application.ApplicationStatusID, application.AppliedAt, application.OfferReceived,
		application.AttemptNumber, application.Notes, application.CreatedAt, application.UpdatedAt,
	)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return application, nil
}

func (r *ApplicationRepository) GetApplicationByID(applicationID, userID uuid.UUID) (*models.Application, error) {
	query := `
        SELECT id, user_id, job_id, application_status_id, applied_at, offer_received, attempt_number, notes, created_at, updated_at
        FROM applications
        WHERE id = $1 
        AND user_id = $2
        AND deleted_at IS NULL
    `

	application := &models.Application{}

	err := r.db.Get(application, query, applicationID, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return application, nil
}

func (r *ApplicationRepository) UpdateApplication(applicationID, userID uuid.UUID, updates map[string]any) (*models.Application, error) {
	if len(updates) == 0 {
		return r.GetApplicationByID(applicationID, userID)
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

	args = append(args, applicationID)
	args = append(args, userID)

	query := fmt.Sprintf(`
            UPDATE applications
            SET %s
            WHERE id = $%d 
            AND user_id = $%d
            AND deleted_at IS NULL
        `, strings.Join(setParts, ", "), argIndex, argIndex+1)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return nil, errors.New(errors.ErrorNotFound, "application not found")
	}

	return r.GetApplicationByID(applicationID, userID)
}

func (r *ApplicationRepository) SoftDeleteApplication(applicationID, userID uuid.UUID) error {
	query := `
        UPDATE applications
        SET deleted_at = $1, updated_at = $1
        WHERE id = $2
        AND user_id = $3
        AND deleted_at IS NULL
    `

	result, err := r.db.Exec(query, time.Now(), applicationID, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return errors.New(errors.ErrorNotFound, "application not found")
	}

	return nil
}

func (r *ApplicationRepository) GetApplicationsByUser(userID uuid.UUID, filters *ApplicationFilters) ([]*models.Application, error) {
	baseQuery := `
        SELECT a.id, a.user_id, a.job_id, a.application_status_id, a.applied_at, a.offer_received, a.attempt_number, a.notes, a.created_at, a.updated_at
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
    `
	query, args, argIndex := r.buildFilterQuery(filters, baseQuery, userID)

	query += r.buildOrderByClause(filters)
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, filters.Limit, filters.Offset)

	var applications []*models.Application
	err := r.db.Select(&applications, query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return applications, nil
}

func (r *ApplicationRepository) GetApplicationsWithDetails(userID uuid.UUID, filters *ApplicationFilters) ([]*ApplicationWithDetails, error) {
	baseQuery := `
        SELECT a.id, a.user_id, a.job_id, a.application_status_id, a.applied_at, a.offer_received, a.attempt_number, a.notes, a.created_at, a.updated_at,
            j.id as "job.id", j.company_id as "job.company_id", j.title as "job.title", j.job_description as "job.job_description", j.location as "job.location",
            j.job_type as "job.job_type", j.source_url as "job.source_url", j.platform as "job.platform",
            j.min_salary as "job.min_salary", j.max_salary as "job.max_salary",
            j.currency as "job.currency", j.is_expired as "job.is_expired", j.created_at as "job.created_at", j.updated_at as "job.updated_at",
            c.id as "company.id", c.name as "company.name", c.description as "company.description", c.website as "company.website",
            c.logo_url as "company.logo_url", c.created_at as "company.created_at", c.updated_at as "company.updated_at",
            ast.id as "application_status.id", ast.name as "application_status.name", ast.created_at as "application_status.created_at", ast.updated_at as "application_status.updated_at"
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN application_status ast ON a.application_status_id = ast.id
    `
	query, args, argIndex := r.buildFilterQuery(filters, baseQuery, userID)

	query += r.buildOrderByClause(filters)
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, filters.Limit, filters.Offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	defer rows.Close()

	var applicationsWithDetails []*ApplicationWithDetails
	for rows.Next() {
		var application models.Application
		var job models.Job
		var company models.Company
		var applicationStatus models.ApplicationStatus

		err := rows.Scan(
			&application.ID, &application.UserID, &application.JobID, &application.ApplicationStatusID, &application.AppliedAt, &application.OfferReceived, &application.AttemptNumber, &application.Notes, &application.CreatedAt, &application.UpdatedAt,
			&job.ID, &job.CompanyID, &job.Title, &job.JobDescription,
			&job.Location, &job.JobType, &job.SourceURL, &job.Platform, &job.MinSalary, &job.MaxSalary, &job.Currency,
			&job.IsExpired, &job.CreatedAt, &job.UpdatedAt,
			&company.ID, &company.Name, &company.Description, &company.Website,
			&company.LogoURL, &company.CreatedAt, &company.UpdatedAt,
			&applicationStatus.ID, &applicationStatus.Name, &applicationStatus.CreatedAt, &applicationStatus.UpdatedAt,
		)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		applicationsWithDetails = append(applicationsWithDetails, &ApplicationWithDetails{
			Application: application,
			Job:         &job,
			Company:     &company,
			Status:      &applicationStatus,
		})
	}

	return applicationsWithDetails, nil
}

func (r *ApplicationRepository) GetApplicationByIDWithDetails(applicationID, userID uuid.UUID) (*ApplicationWithDetails, error) {
	query := `
        SELECT a.id, a.user_id, a.job_id, a.application_status_id, a.applied_at, a.offer_received, a.attempt_number, a.notes, a.created_at, a.updated_at,
            j.id as "job.id", j.company_id as "job.company_id", j.title as "job.title", j.job_description as "job.job_description", j.location as "job.location",
            j.job_type as "job.job_type", j.source_url as "job.source_url", j.platform as "job.platform",
            j.min_salary as "job.min_salary", j.max_salary as "job.max_salary",
            j.currency as "job.currency", j.is_expired as "job.is_expired", j.created_at as "job.created_at", j.updated_at as "job.updated_at",
            c.id as "company.id", c.name as "company.name", c.description as "company.description", c.website as "company.website",
            c.logo_url as "company.logo_url", c.created_at as "company.created_at", c.updated_at as "company.updated_at",
            ast.id as "application_status.id", ast.name as "application_status.name", ast.created_at as "application_status.created_at", ast.updated_at as "application_status.updated_at"
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN application_status ast ON a.application_status_id = ast.id
        WHERE a.id = $1
        AND a.user_id = $2
        AND a.deleted_at IS NULL
    `

	var application models.Application
	var job models.Job
	var company models.Company
	var applicationStatus models.ApplicationStatus

	row := r.db.QueryRow(query, applicationID, userID)
	err := row.Scan(
		&application.ID, &application.UserID, &application.JobID, &application.ApplicationStatusID, &application.AppliedAt, &application.OfferReceived, &application.AttemptNumber, &application.Notes, &application.CreatedAt, &application.UpdatedAt,
		&job.ID, &job.CompanyID, &job.Title, &job.JobDescription,
		&job.Location, &job.JobType, &job.SourceURL, &job.Platform, &job.MinSalary, &job.MaxSalary, &job.Currency,
		&job.IsExpired, &job.CreatedAt, &job.UpdatedAt,
		&company.ID, &company.Name, &company.Description, &company.Website,
		&company.LogoURL, &company.CreatedAt, &company.UpdatedAt,
		&applicationStatus.ID, &applicationStatus.Name, &applicationStatus.CreatedAt, &applicationStatus.UpdatedAt,
	)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &ApplicationWithDetails{
		Application: application,
		Job:         &job,
		Company:     &company,
		Status:      &applicationStatus,
	}, nil
}

func (r *ApplicationRepository) GetApplicationCount(userID uuid.UUID, filters *ApplicationFilters) (int, error) {
	baseQuery := `
        SELECT COUNT(*)
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
    `

	query, args, _ := r.buildFilterQuery(filters, baseQuery, userID)

	var count int
	err := r.db.Get(&count, query, args...)
	if err != nil {
		return 0, errors.ConvertError(err)
	}

	return count, nil
}

func (r *ApplicationRepository) GetApplicationsByStatus(userID uuid.UUID) (map[string]int, error) {
	query := `
        SELECT ast.name, COUNT(*) as count
        FROM applications a
        INNER JOIN application_status ast ON a.application_status_id = ast.id
        WHERE a.user_id = $1 AND a.deleted_at IS NULL
        GROUP BY ast.id, ast.name
        ORDER BY count DESC
    `

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}
	defer rows.Close()

	statusCounts := make(map[string]int)

	for rows.Next() {
		var statusName string
		var count int

		err := rows.Scan(&statusName, &count)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		statusCounts[statusName] = count
	}

	return statusCounts, nil
}

func (r *ApplicationRepository) GetRecentApplications(userID uuid.UUID, limit int) ([]*ApplicationWithDetails, error) {
	query := `
        SELECT a.id, a.user_id, a.job_id, a.application_status_id, a.applied_at, a.offer_received, a.attempt_number, a.notes, a.created_at, a.updated_at,
            j.id as "job.id", j.company_id as "job.company_id", j.title as "job.title", j.job_description as "job.job_description", j.location as "job.location",
            j.job_type as "job.job_type", j.source_url as "job.source_url", j.platform as "job.platform",
            j.min_salary as "job.min_salary", j.max_salary as "job.max_salary",
            j.currency as "job.currency", j.is_expired as "job.is_expired", j.created_at as "job.created_at", j.updated_at as "job.updated_at",
            c.id as "company.id", c.name as "company.name", c.description as "company.description", c.website as "company.website",
            c.logo_url as "company.logo_url", c.created_at as "company.created_at", c.updated_at as "company.updated_at",
            ast.id as "application_status.id", ast.name as "application_status.name", ast.created_at as "application_status.created_at", ast.updated_at as "application_status.updated_at"
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN application_status ast ON a.application_status_id = ast.id
        WHERE a.user_id = $1
        AND a.deleted_at IS NULL
        ORDER BY a.created_at DESC
        LIMIT $2
    `

	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	defer rows.Close()

	var applicationsWithDetails []*ApplicationWithDetails
	for rows.Next() {
		var application models.Application
		var job models.Job
		var company models.Company
		var applicationStatus models.ApplicationStatus

		err := rows.Scan(
			&application.ID, &application.UserID, &application.JobID, &application.ApplicationStatusID, &application.AppliedAt, &application.OfferReceived, &application.AttemptNumber, &application.Notes, &application.CreatedAt, &application.UpdatedAt,
			&job.ID, &job.CompanyID, &job.Title, &job.JobDescription,
			&job.Location, &job.JobType, &job.SourceURL, &job.Platform, &job.MinSalary, &job.MaxSalary, &job.Currency,
			&job.IsExpired, &job.CreatedAt, &job.UpdatedAt,
			&company.ID, &company.Name, &company.Description, &company.Website,
			&company.LogoURL, &company.CreatedAt, &company.UpdatedAt,
			&applicationStatus.ID, &applicationStatus.Name, &applicationStatus.CreatedAt, &applicationStatus.UpdatedAt,
		)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		applicationsWithDetails = append(applicationsWithDetails, &ApplicationWithDetails{
			Application: application,
			Job:         &job,
			Company:     &company,
			Status:      &applicationStatus,
		})
	}

	return applicationsWithDetails, nil
}

func (r *ApplicationRepository) UpdateApplicationStatus(applicationID, userID, application_status_id uuid.UUID) error {
	query := `
            UPDATE applications
            SET application_status_id = $1, updated_at = $2
            WHERE id = $3 
            AND user_id = $4
            AND deleted_at IS NULL
        `

	result, err := r.db.Exec(query, application_status_id, time.Now(), applicationID, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return errors.New(errors.ErrorNotFound, "application not found")
	}

	return nil
}

func (r *ApplicationRepository) GetApplicationStatuses() ([]*models.ApplicationStatus, error) {
	query := `
        SELECT id, name, created_at, updated_at
        FROM application_status
        ORDER BY name
    `

	var statuses []*models.ApplicationStatus
	err := r.db.Select(&statuses, query)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return statuses, nil
}

func (r *ApplicationRepository) GetApplicationStatusCached() ([]*models.ApplicationStatus, error) {
	r.statusCacheMu.RLock()
	if r.statusListCache != nil && time.Since(r.statusCacheTime) < 5*time.Minute {
		defer r.statusCacheMu.RUnlock()
		return r.statusListCache, nil
	}
	r.statusCacheMu.RUnlock()

	r.statusCacheMu.Lock()
	defer r.statusCacheMu.Unlock()

	// Double-check after acquiring write lock
	if r.statusListCache != nil && time.Since(r.statusCacheTime) < 5*time.Minute {
		return r.statusListCache, nil
	}

	statuses, err := r.GetApplicationStatuses()
	if err != nil {
		return nil, err
	}

	// Populate both caches
	r.statusListCache = statuses
	r.statusMapCache = make(map[string]uuid.UUID)
	for _, s := range statuses {
		r.statusMapCache[s.Name] = s.ID
	}
	r.statusCacheTime = time.Now()

	return statuses, nil
}

func (r *ApplicationRepository) GetApplicationStatusIDByName(name string) (uuid.UUID, error) {
	r.statusCacheMu.RLock()
	if r.statusMapCache != nil && time.Since(r.statusCacheTime) < 5*time.Minute {
		if id, ok := r.statusMapCache[name]; ok {
			r.statusCacheMu.RUnlock()
			return id, nil
		}
		r.statusCacheMu.RUnlock()
		return uuid.Nil, fmt.Errorf("status '%s' not found", name)
	}
	r.statusCacheMu.RUnlock()

	// Cache miss or expired - GetApplicationStatusCached will populate both caches
	_, err := r.GetApplicationStatusCached()
	if err != nil {
		return uuid.Nil, err
	}

	r.statusCacheMu.RLock()
	defer r.statusCacheMu.RUnlock()

	if id, ok := r.statusMapCache[name]; ok {
		return id, nil
	}

	return uuid.Nil, fmt.Errorf("status '%s' not found", name)
}

func (r *ApplicationRepository) InvalidateStatusCache() {
	r.statusCacheMu.Lock()
	defer r.statusCacheMu.Unlock()

	r.statusListCache = nil
	r.statusMapCache = nil
	r.statusCacheTime = time.Time{}
}

func (r *ApplicationRepository) buildOrderByClause(filters *ApplicationFilters) string {
	// Map of allowed sort columns to their SQL expressions
	sortColumns := map[string]string{
		"company":    "c.name",
		"position":   "j.title",
		"status":     "ast.name",
		"applied_at": "a.applied_at",
		"location":   "j.location",
		"updated_at": "a.updated_at",
		"job_type":   "j.job_type",
	}

	sortOrder := "DESC"
	if filters.SortOrder == "asc" {
		sortOrder = "ASC"
	}

	if column, ok := sortColumns[filters.SortBy]; ok {
		return fmt.Sprintf(" ORDER BY %s %s NULLS LAST", column, sortOrder)
	}

	// Default sort: newest applications first
	return " ORDER BY a.applied_at DESC"
}

func (r *ApplicationRepository) buildFilterQuery(filters *ApplicationFilters, baseQuery string, userID uuid.UUID) (string, []any, int) {
	if filters == nil {
		filters = &ApplicationFilters{
			Limit:  50,
			Offset: 0,
		}
	}

	if filters.Limit <= 0 {
		filters.Limit = 50
	}

	query := baseQuery + " WHERE a.user_id = $1 AND a.deleted_at IS NULL"

	args := []any{userID}
	argIndex := 2

	if filters.JobID != nil {
		query += fmt.Sprintf(" AND a.job_id = $%d", argIndex)
		args = append(args, filters.JobID)
		argIndex++
	}

	if filters.JobTitle != "" && filters.JobID == nil {
		query += fmt.Sprintf(" AND j.title ILIKE $%d", argIndex)
		args = append(args, "%"+filters.JobTitle+"%")
		argIndex++
	}

	if filters.CompanyID != nil {
		query += fmt.Sprintf(" AND c.id = $%d", argIndex)
		args = append(args, filters.CompanyID)
		argIndex++
	}

	if filters.CompanyName != "" && filters.CompanyID == nil {
		query += fmt.Sprintf(" AND c.name ILIKE $%d", argIndex)
		args = append(args, "%"+filters.CompanyName+"%")
		argIndex++
	}

	if filters.DateFrom != nil {
		query += fmt.Sprintf(" AND applied_at >= $%d", argIndex)
		args = append(args, filters.DateFrom)
		argIndex++
	}

	if filters.DateTo != nil {
		query += fmt.Sprintf(" AND applied_at <= $%d", argIndex)
		args = append(args, filters.DateTo)
		argIndex++
	}

	if filters.OfferReceived != nil {
		query += fmt.Sprintf(" AND offer_received = $%d", argIndex)
		args = append(args, filters.OfferReceived)
		argIndex++
	}

	if filters.StatusID != nil {
		query += fmt.Sprintf(" AND application_status_id = $%d", argIndex)
		args = append(args, filters.StatusID)
		argIndex++
	}

	if len(filters.StatusIDs) > 0 {
		query += fmt.Sprintf(" AND application_status_id = ANY($%d)", argIndex)
		args = append(args, pq.Array(filters.StatusIDs))
		argIndex++
	}

	if filters.HasInterviews != nil {
		if *filters.HasInterviews {
			query += " AND EXISTS (SELECT 1 FROM interviews i WHERE i.application_id = a.id AND i.deleted_at IS NULL)"
		} else {
			query += " AND NOT EXISTS (SELECT 1 FROM interviews i WHERE i.application_id = a.id AND i.deleted_at IS NULL)"
		}
	}

	if filters.HasAssessments != nil {
		if *filters.HasAssessments {
			query += " AND EXISTS (SELECT 1 FROM assessments asmt WHERE asmt.application_id = a.id AND asmt.deleted_at IS NULL)"
		} else {
			query += " AND NOT EXISTS (SELECT 1 FROM assessments asmt WHERE asmt.application_id = a.id AND asmt.deleted_at IS NULL)"
		}
	}

	return query, args, argIndex
}
