package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type JobRepository struct {
	db *sqlx.DB
}

type JobFilters struct {
	Search    string
	JobType   string
	Location  string
	MinSalary *float64
	MaxSalary *float64
	IsExpired *bool
	CompanyID *uuid.UUID
	Limit     int
	Offset    int
}

type JobWithCompany struct {
	models.Job
	Company *models.Company `json:"company,omitempty"`
}

func NewJobRepository(database *database.Database) *JobRepository {
	return &JobRepository{
		db: database.DB,
	}
}

func (r *JobRepository) CreateJob(userID uuid.UUID, job *models.Job) (*models.Job, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, errors.ConvertError(err)
	}
	defer tx.Rollback()

	job.ID = uuid.New()
	job.CreatedAt = time.Now()
	job.UpdatedAt = time.Now()
	job.IsExpired = false

	query := `
        INSERT INTO jobs (id, company_id, title, job_description, location, job_type, min_salary, max_salary, currency, is_expired, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `

	_, err = tx.Exec(query, job.ID, job.CompanyID, job.Title, job.JobDescription, job.Location, job.JobType, job.MinSalary, job.MaxSalary, job.Currency, job.IsExpired, job.CreatedAt, job.UpdatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	userJobID := uuid.New()
	userJobQuery := `
        INSERT INTO user_jobs(id, user_id, job_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
    `
	_, err = tx.Exec(userJobQuery, userJobID, userID, job.ID, time.Now(), time.Now())
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	if err = tx.Commit(); err != nil {
		return nil, errors.ConvertError(err)
	}

	return job, nil
}

func (r *JobRepository) GetJobsByUser(userID uuid.UUID, filters *JobFilters) ([]*models.Job, error) {
	if filters == nil {
		filters = &JobFilters{
			Limit:  50,
			Offset: 0,
		}
	}

	if filters.Limit <= 0 {
		filters.Limit = 50
	}

	query := `
        SELECT j.id, j.company_id, j.title, j.job_description, j.location, j.job_type,
            j.min_salary, j.max_salary, j.currency, j.is_expired, j.created_at, j.updated_at
        FROM jobs j
        INNER JOIN user_jobs uj ON j.id = uj.job_id
        WHERE uj.user_id = $1 AND j.deleted_at IS NULL
    `

	args := []any{userID}
	argIndex := 2

	if filters.Search != "" {
		query += fmt.Sprintf(" AND (j.title ILIKE $%d OR j.job_description ILIKE $%d OR j.location ILIKE $%d)", argIndex, argIndex, argIndex)
		args = append(args, "%"+filters.Search+"%")
		argIndex++
	}

	if filters.JobType != "" {
		query += fmt.Sprintf(" AND j.job_type = $%d", argIndex)
		args = append(args, filters.JobType)
		argIndex++
	}

	if filters.Location != "" {
		query += fmt.Sprintf(" AND j.location ILIKE $%d", argIndex)
		args = append(args, "%"+filters.Location+"%")
		argIndex++
	}

	if filters.MinSalary != nil {
		query += fmt.Sprintf(" AND j.min_salary >= $%d", argIndex)
		args = append(args, filters.MinSalary)
		argIndex++
	}

	if filters.MaxSalary != nil {
		query += fmt.Sprintf(" AND j.max_salary <= $%d", argIndex)
		args = append(args, filters.MaxSalary)
		argIndex++
	}

	if filters.IsExpired != nil {
		query += fmt.Sprintf(" AND j.is_expired = $%d", argIndex)
		args = append(args, filters.IsExpired)
		argIndex++
	}
	if filters.CompanyID != nil {
		query += fmt.Sprintf(" AND j.company_id = $%d", argIndex)
		args = append(args, filters.CompanyID)
		argIndex++
	}

	query += " ORDER BY j.created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, filters.Limit, filters.Offset)

	var jobs []*models.Job
	err := r.db.Select(&jobs, query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return jobs, nil
}

func (r *JobRepository) GetJobByID(jobID, userID uuid.UUID) (*models.Job, error) {
	job := &models.Job{}
	query := `
        SELECT j.id, j.company_id, j.title, j.job_description, j.location,
            j.job_type, j.min_salary, j.max_salary, j.currency, j.is_expired, j.created_at, j.updated_at
        FROM jobs j
        INNER JOIN user_jobs uj ON j.id = uj.job_id
        WHERE j.id = $1 AND uj.user_id = $2 AND j.deleted_at IS NULL
    `

	err := r.db.Get(job, query, jobID, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return job, nil
}

func (r *JobRepository) GetJobsWithCompany(userID uuid.UUID, filters *JobFilters) ([]*JobWithCompany, error) {
	if filters == nil {
		filters = &JobFilters{
			Limit:  50,
			Offset: 0,
		}
	}

	if filters.Limit <= 0 {
		filters.Limit = 50
	}

	query := `
        SELECT j.id, j.company_id, j.title, j.job_description, j.location,
            j.job_type, j.min_salary, j.max_salary, j.currency, j.is_expired, j.created_at, j.updated_at,
            c.id as "company.id", c.name as "company.name", c.description as "company.description", c.website as "company.website",
            c.logo_url as "company.logo_url", c.created_at as "company.created_at", c.updated_at as "company.updated_at",
        FROM jobs j
        INNER JOIN user_jobs uj ON j.id = uj.job_id
        INNER JOIN companies c ON j.company_id = c.id
        WHERE uj.user_id = $1 AND j.deleted_at IS NULL AND c.deleted_at IS NULL
        ORDER BY j.created_at DESC
        LIMIT $2
        OFFSET $3
    `
	rows, err := r.db.Query(query, userID, filters.Limit, filters.Offset)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	defer rows.Close()

	var jobsWithCompany []*JobWithCompany
	for rows.Next() {
		var job models.Job
		var company models.Company

		err := rows.Scan(
			&job.ID, &job.CompanyID, &job.Title, &job.JobDescription,
			&job.Location, &job.JobType, &job.MinSalary, &job.MaxSalary, &job.Currency,
			&job.IsExpired, &job.CreatedAt, &job.UpdatedAt,
			&company.ID, &company.Name, &company.Description, &company.Website,
			&company.LogoURL, &company.CreatedAt, &company.UpdatedAt,
		)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		jobsWithCompany = append(jobsWithCompany, &JobWithCompany{
			Job:     job,
			Company: &company,
		})
	}

	return jobsWithCompany, nil
}

func (r *JobRepository) UpdateJob(jobID, userID uuid.UUID, updates map[string]any) (*models.Job, error) {
	if len(updates) == 0 {
		return r.GetJobByID(jobID, userID)
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

	args = append(args, jobID, userID)

	query := fmt.Sprintf(`
        UPDATE jobs
        SET %s
        FROM user_jobs uj
        WHERE jobs.id = uj.job_id AND jobs.id = $%d AND uj.user_id = $%d AND jobs.deleted_at IS NULL
        `, strings.Join(setParts, ", "), argIndex, argIndex+1)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	rowAffected, err := result.RowsAffected()
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	if rowAffected == 0 {
		return nil, errors.New(errors.ErrorNotFound, "job not found or not owned by user")
	}

	return r.GetJobByID(jobID, userID)
}

func (r *JobRepository) SoftDeleteJob(jobID, userID uuid.UUID) error {
	query := `
        UPDATE jobs
        SET deleted_at = $1, updated_at = $1
        FROM user_jobs uj
        WHERE jobs.id = uj.job_id AND jobs.id = $2 AND uj.user_id = $3 AND jobs.deleted_at IS NULL
    `
	result, err := r.db.Exec(query, time.Now(), jobID, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowAffected == 0 {
		return errors.New(errors.ErrorNotFound, "job not found or not owned by user")
	}

	return nil
}

func (r *JobRepository) GetJobCount(userID uuid.UUID, filters *JobFilters) (int, error) {
	query := `
        SELECT COUNT(*)
        FROM jobs j
        INNER JOIN user_jobs uj ON j.id = uj.job_id
        WHERE uj.user_id = $1 AND j.deleted_at IS NULL
    `

	args := []any{userID}
	argIndex := 2

	if filters != nil && filters.Search != "" {
		query += fmt.Sprintf(" AND (j.title ILIKE $%d OR j.job_description ILIKE $%d OR j.location ILIKE $%d)", argIndex, argIndex, argIndex)
		args = append(args, "%"+filters.Search+"%")
		argIndex++
	}

	if filters.JobType != "" {
		query += fmt.Sprintf(" AND j.job_type = $%d", argIndex)
		args = append(args, filters.JobType)
		argIndex++
	}

	if filters.Location != "" {
		query += fmt.Sprintf(" AND j.location ILIKE $%d", argIndex)
		args = append(args, filters.Location)
		argIndex++
	}

	if filters.MinSalary != nil {
		query += fmt.Sprintf(" AND j.min_salary >= $%d", argIndex)
		args = append(args, filters.MinSalary)
		argIndex++
	}

	if filters.MaxSalary != nil {
		query += fmt.Sprintf(" AND j.max_salary <= $%d", argIndex)
		args = append(args, filters.MaxSalary)
		argIndex++
	}

	if filters.IsExpired != nil {
		query += fmt.Sprintf(" AND j.is_expired = $%d", argIndex)
		args = append(args, filters.IsExpired)
		argIndex++
	}
	if filters.CompanyID != nil {
		query += fmt.Sprintf(" AND j.company_id = $%d", argIndex)
		args = append(args, filters.CompanyID)
		argIndex++
	}

	var count int

	err := r.db.Get(&count, query, args...)
	if err != nil {
		return 0, errors.ConvertError(err)
	}

	return count, nil
}
