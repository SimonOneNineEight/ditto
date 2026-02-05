package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type AssessmentSubmissionRepository struct {
	db *sqlx.DB
}

func NewAssessmentSubmissionRepository(database *database.Database) *AssessmentSubmissionRepository {
	return &AssessmentSubmissionRepository{
		db: database.DB,
	}
}

func (r *AssessmentSubmissionRepository) CreateSubmission(submission *models.AssessmentSubmission) (*models.AssessmentSubmission, error) {
	submission.ID = uuid.New()
	submission.SubmittedAt = time.Now()
	submission.CreatedAt = time.Now()

	query := `
		INSERT INTO assessment_submissions (
			id, assessment_id, submission_type, github_url, file_id,
			notes, submitted_at, created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.Exec(query, submission.ID, submission.AssessmentID,
		submission.SubmissionType, submission.GithubURL, submission.FileID,
		submission.Notes, submission.SubmittedAt, submission.CreatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return submission, nil
}

func (r *AssessmentSubmissionRepository) ListByAssessmentID(assessmentID uuid.UUID) ([]*models.AssessmentSubmission, error) {
	query := `
		SELECT
			id, assessment_id, submission_type, github_url, file_id,
			notes, submitted_at, created_at
		FROM assessment_submissions
		WHERE assessment_id = $1 AND deleted_at IS NULL
		ORDER BY submitted_at DESC
	`

	var submissions []*models.AssessmentSubmission
	err := r.db.Select(&submissions, query, assessmentID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return submissions, nil
}

func (r *AssessmentSubmissionRepository) GetSubmissionByID(id uuid.UUID) (*models.AssessmentSubmission, error) {
	query := `
		SELECT
			id, assessment_id, submission_type, github_url, file_id,
			notes, submitted_at, created_at
		FROM assessment_submissions
		WHERE id = $1 AND deleted_at IS NULL
	`

	var submission models.AssessmentSubmission
	err := r.db.Get(&submission, query, id)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &submission, nil
}

func (r *AssessmentSubmissionRepository) SoftDeleteSubmission(id uuid.UUID) error {
	query := `
		UPDATE assessment_submissions
		SET deleted_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, time.Now(), id)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return errors.New(errors.ErrorNotFound, "assessment submission not found")
	}

	return nil
}
