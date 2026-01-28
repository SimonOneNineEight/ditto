package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type InterviewerRepository struct {
	db *sqlx.DB
}

func NewInterviewerRepository(database *database.Database) *InterviewerRepository {
	return &InterviewerRepository{
		db: database.DB,
	}
}

func (r *InterviewerRepository) CreateInterviewer(interviewer *models.Interviewer) (*models.Interviewer, error) {
	interviewer.ID = uuid.New()
	interviewer.CreatedAt = time.Now()
	interviewer.UpdatedAt = time.Now()

	query := `
		INSERT INTO interviewers (
			id, interview_id, name, role, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.db.Exec(
		query,
		interviewer.ID, interviewer.InterviewID, interviewer.Name, interviewer.Role,
		interviewer.CreatedAt, interviewer.UpdatedAt,
	)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interviewer, nil
}

func (r *InterviewerRepository) GetInterviewerByInterview(interviewID uuid.UUID) ([]*models.Interviewer, error) {
	query := `
		SELECT id, interview_id, name, role, created_at, updated_at
		FROM interviewers
		WHERE interview_id = $1 AND deleted_at IS NULL
	`

	var interviewers []*models.Interviewer
	err := r.db.Select(&interviewers, query, interviewID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interviewers, nil
}

func (r *InterviewerRepository) GetInterviewerByID(interviewerID uuid.UUID) (*models.Interviewer, error) {
	query := `
		SELECT id, interview_id, name, role, created_at, updated_at
		FROM interviewers
		WHERE id = $1 AND deleted_at IS NULL
	`

	var interviewer models.Interviewer
	err := r.db.Get(&interviewer, query, interviewerID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &interviewer, nil
}

func (r *InterviewerRepository) UpdateInterviewer(interviewerID uuid.UUID, updates map[string]any) (*models.Interviewer, error) {
	if len(updates) == 0 {
		return r.GetInterviewerByID(interviewerID)
	}

	query := "UPDATE interviewers SET "
	args := make([]any, 0)
	i := 1

	for key, value := range updates {
		if i > 1 {
			query += ", "
		}
		query += fmt.Sprintf("%s = $%d", key, i)
		args = append(args, value)
		i++
	}

	query += fmt.Sprintf(" WHERE id = $%d AND deleted_at IS NULL", i)
	args = append(args, interviewerID)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return nil, errors.New(errors.ErrorNotFound, "interviewer not found")
	}

	return r.GetInterviewerByID(interviewerID)
}

func (r *InterviewerRepository) SoftDeleteInterviewer(interviewerID uuid.UUID) error {
	query := `
		UPDATE interviewers
		SET deleted_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, time.Now(), interviewerID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowAffected == 0 {
		return errors.New(errors.ErrorNotFound, "interviewer not found or owned by other user")
	}

	return nil
}
