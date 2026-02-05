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

type AssessmentRepository struct {
	db *sqlx.DB
}

func NewAssessmentRepository(database *database.Database) *AssessmentRepository {
	return &AssessmentRepository{
		db: database.DB,
	}
}

func (r *AssessmentRepository) CreateAssessment(assessment *models.Assessment) (*models.Assessment, error) {
	assessment.ID = uuid.New()
	assessment.CreatedAt = time.Now()
	assessment.UpdatedAt = time.Now()

	if assessment.Status == "" {
		assessment.Status = models.AssessmentStatusNotStarted
	}

	query := `
		INSERT INTO assessments (
			id, user_id, application_id, assessment_type, title, due_date,
			status, instructions, requirements, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := r.db.Exec(query, assessment.ID, assessment.UserID,
		assessment.ApplicationID, assessment.AssessmentType, assessment.Title,
		assessment.DueDate, assessment.Status, assessment.Instructions,
		assessment.Requirements, assessment.CreatedAt, assessment.UpdatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return assessment, nil
}

func (r *AssessmentRepository) GetAssessmentByID(id, userID uuid.UUID) (*models.Assessment, error) {
	query := `
		SELECT
			id, user_id, application_id, assessment_type, title, due_date,
			status, instructions, requirements, created_at, updated_at
		FROM assessments
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
	`

	assessment := &models.Assessment{}
	err := r.db.Get(assessment, query, id, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return assessment, nil
}

func (r *AssessmentRepository) ListByApplicationID(applicationID, userID uuid.UUID) ([]*models.Assessment, error) {
	query := `
		SELECT
			id, user_id, application_id, assessment_type, title, due_date,
			status, instructions, requirements, created_at, updated_at
		FROM assessments
		WHERE application_id = $1 AND user_id = $2 AND deleted_at IS NULL
		ORDER BY due_date ASC
	`

	var assessments []*models.Assessment
	err := r.db.Select(&assessments, query, applicationID, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return assessments, nil
}

// AssessmentWithContext includes application context for dashboard/timeline display
type AssessmentWithContext struct {
	models.Assessment
	CompanyName string `json:"company_name" db:"company_name"`
	JobTitle    string `json:"job_title" db:"job_title"`
}

// ListByUserID returns all assessments for a user with application context (company_name, job_title)
func (r *AssessmentRepository) ListByUserID(userID uuid.UUID) ([]*AssessmentWithContext, error) {
	query := `
		SELECT
			ass.id, ass.user_id, ass.application_id, ass.assessment_type, ass.title, ass.due_date,
			ass.status, ass.instructions, ass.requirements, ass.created_at, ass.updated_at,
			c.name as company_name, j.title as job_title
		FROM assessments ass
		JOIN applications a ON ass.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		WHERE ass.user_id = $1 AND ass.deleted_at IS NULL AND a.deleted_at IS NULL
		ORDER BY ass.due_date ASC
	`

	var assessments []*AssessmentWithContext
	err := r.db.Select(&assessments, query, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return assessments, nil
}

func (r *AssessmentRepository) UpdateAssessment(id, userID uuid.UUID, updates map[string]any) (*models.Assessment, error) {
	if len(updates) == 0 {
		return r.GetAssessmentByID(id, userID)
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

	args = append(args, id, userID)

	query := fmt.Sprintf(`
		UPDATE assessments
		SET %s
		WHERE id = $%d AND user_id = $%d AND deleted_at IS NULL
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
		return nil, errors.New(errors.ErrorNotFound, "assessment not found or owned by other user")
	}

	return r.GetAssessmentByID(id, userID)
}

func (r *AssessmentRepository) SoftDeleteAssessment(id, userID uuid.UUID) error {
	now := time.Now()

	// Cascade soft-delete to submissions first
	_, err := r.db.Exec(`
		UPDATE assessment_submissions
		SET deleted_at = $1
		WHERE assessment_id = $2 AND deleted_at IS NULL
	`, now, id)
	if err != nil {
		return errors.ConvertError(err)
	}

	query := `
		UPDATE assessments
		SET deleted_at = $1, updated_at = $1
		WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, now, id, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return errors.New(errors.ErrorNotFound, "assessment not found or owned by other user")
	}

	return nil
}
