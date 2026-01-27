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

type InterviewRepository struct {
	db *sqlx.DB
}

func NewInterviewRepository(database *database.Database) *InterviewRepository {
	return &InterviewRepository{
		db: database.DB,
	}
}

func (r *InterviewRepository) CreateInterview(interview *models.Interview) (*models.Interview, error) {
	interview.ID = uuid.New()
	interview.CreatedAt = time.Now()
	interview.UpdatedAt = time.Now()

	nextRoundNumber, err := r.GetNextRoundNumber(interview.ApplicationID)
	if err != nil {
		return nil, err
	}

	interview.RoundNumber = nextRoundNumber

	query := `
		INSERT INTO interviews (
			id, user_id, application_id, round_number, scheduled_date, scheduled_time,
			duration_minutes, outcome, overall_feeling, went_well, could_improve,
			confidence_level, interview_type, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err = r.db.Exec(query, interview.ID, interview.UserID,
		interview.ApplicationID, interview.RoundNumber, interview.ScheduledDate, interview.ScheduledTime,
		interview.DurationMinutes, interview.Outcome, interview.OverallFeeling, interview.WentWell,
		interview.CouldImprove, interview.ConfidenceLevel, interview.InterviewType, interview.CreatedAt,
		interview.UpdatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interview, nil
}

func (r *InterviewRepository) GetNextRoundNumber(applicationID uuid.UUID) (int, error) {
	query := `
        SELECT COALESCE(MAX(round_number), 0) + 1
        FROM interviews
        WHERE application_id = $1 AND deleted_at IS NULL
    `

	var nextRound int
	err := r.db.Get(&nextRound, query, applicationID)
	if err != nil {
		return 0, errors.ConvertError(err)
	}

	return nextRound, nil
}

func (r *InterviewRepository) GetInterviewByID(id, userID uuid.UUID) (*models.Interview, error) {
	query := `
		SELECT 
			id, user_id, application_id, round_number, scheduled_date, scheduled_time,
			duration_minutes, outcome, overall_feeling, went_well, could_improve,
			confidence_level, interview_type, created_at, updated_at
		FROM interviews
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
	`

	interview := &models.Interview{}
	err := r.db.Get(interview, query, id, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interview, nil
}

func (r *InterviewRepository) UpdateInterview(interviewID, userID uuid.UUID, updates map[string]any) (*models.Interview, error) {
	if len(updates) == 0 {
		return r.GetInterviewByID(interviewID, userID)
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

	args = append(args, interviewID, userID)

	query := fmt.Sprintf(`
		UPDATE interviews
		SET %s
        WHERE id = $%d AND user_id = $%d AND deleted_at IS NULL
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
		return nil, errors.New(errors.ErrorNotFound, "interview not found or owned by other user")
	}

	return r.GetInterviewByID(interviewID, userID)
}

func (r *InterviewRepository) SoftDeleteInterview(interviewID, userID uuid.UUID) error {
	query := `
		UPDATE interviews
		SET deleted_at = $1, updated_at = $1
		WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, time.Now(), interviewID, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowAffected == 0 {
		return errors.New(errors.ErrorNotFound, "interview not found or owned by other user")
	}

	return nil
}

func (r *InterviewRepository) GetInterviewsByApplicationID(applicationID, userID uuid.UUID) ([]*models.Interview, error) {
	query := `
		SELECT 
			id, user_id, application_id, round_number, scheduled_date, scheduled_time,
			duration_minutes, outcome, overall_feeling, went_well, could_improve,
			confidence_level, interview_type, created_at, updated_at
		FROM interviews
		WHERE application_id = $1 AND user_id = $2 AND deleted_at IS NULL
	`

	var interviews []*models.Interview
	err := r.db.Select(&interviews, query, applicationID, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interviews, nil
}

func (r *InterviewRepository) GetInterviewsByUser(userID uuid.UUID) ([]*models.Interview, error) {
	query := `
		SELECT 
			id, user_id, application_id, round_number, scheduled_date, scheduled_time,
			duration_minutes, outcome, overall_feeling, went_well, could_improve,
			confidence_level, interview_type, created_at, updated_at
		FROM interviews
		WHERE user_id = $1 AND deleted_at IS NULL
	`

	var interviews []*models.Interview
	err := r.db.Select(&interviews, query, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interviews, nil
}
