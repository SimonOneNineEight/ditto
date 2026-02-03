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

// InterviewWithApplicationInfo holds interview data along with related application info
type InterviewWithApplicationInfo struct {
	models.Interview
	CompanyName string `json:"company_name" db:"company_name"`
	JobTitle    string `json:"job_title" db:"job_title"`
}

func (r *InterviewRepository) GetInterviewWithApplicationInfo(interviewID, userID uuid.UUID) (*InterviewWithApplicationInfo, error) {
	query := `
		SELECT
			i.id, i.user_id, i.application_id, i.round_number, i.scheduled_date, i.scheduled_time,
			i.duration_minutes, i.outcome, i.overall_feeling, i.went_well, i.could_improve,
			i.confidence_level, i.interview_type, i.created_at, i.updated_at,
			c.name as company_name, j.title as job_title
		FROM interviews i
		JOIN applications a ON i.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		WHERE i.id = $1 AND i.user_id = $2 AND i.deleted_at IS NULL AND a.deleted_at IS NULL
	`

	result := &InterviewWithApplicationInfo{}
	err := r.db.Get(result, query, interviewID, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return result, nil
}

// InterviewListItem holds interview data for list display with application info
type InterviewListItem struct {
	models.Interview
	CompanyName string `json:"company_name" db:"company_name"`
	JobTitle    string `json:"job_title" db:"job_title"`
}

// InterviewListFilter holds filter parameters for interview listing
type InterviewListFilter struct {
	Upcoming bool   // Filter to future interviews only (scheduled_date >= today)
	Range    string // Time range filter: today, week, month, all
	Filter   string // Simple filter: all, upcoming, past
	Page     int    // Page number (1-based)
	Limit    int    // Items per page
}

func (r *InterviewRepository) GetInterviewsWithApplicationInfo(userID uuid.UUID, filter *InterviewListFilter) ([]*InterviewListItem, int, error) {
	// Build base query
	baseQuery := `
		FROM interviews i
		JOIN applications a ON i.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		WHERE i.user_id = $1 AND i.deleted_at IS NULL AND a.deleted_at IS NULL
	`

	args := []any{userID}
	argIndex := 2

	// Add filter conditions
	if filter != nil {
		// Handle simple filter (all, upcoming, past) - takes precedence
		switch filter.Filter {
		case "upcoming":
			baseQuery += fmt.Sprintf(" AND i.scheduled_date >= $%d", argIndex)
			args = append(args, time.Now().Format("2006-01-02"))
			argIndex++
		case "past":
			baseQuery += fmt.Sprintf(" AND i.scheduled_date < $%d", argIndex)
			args = append(args, time.Now().Format("2006-01-02"))
			argIndex++
		case "all":
			// No additional filtering
		default:
			// Fall back to legacy filters if no simple filter specified
			if filter.Upcoming {
				baseQuery += fmt.Sprintf(" AND i.scheduled_date >= $%d", argIndex)
				args = append(args, time.Now().Format("2006-01-02"))
				argIndex++
			}

			switch filter.Range {
			case "today":
				baseQuery += fmt.Sprintf(" AND i.scheduled_date = $%d", argIndex)
				args = append(args, time.Now().Format("2006-01-02"))
				argIndex++
			case "week":
				baseQuery += fmt.Sprintf(" AND i.scheduled_date >= $%d AND i.scheduled_date <= $%d", argIndex, argIndex+1)
				args = append(args, time.Now().Format("2006-01-02"))
				args = append(args, time.Now().AddDate(0, 0, 7).Format("2006-01-02"))
				argIndex += 2
			case "month":
				baseQuery += fmt.Sprintf(" AND i.scheduled_date >= $%d AND i.scheduled_date <= $%d", argIndex, argIndex+1)
				args = append(args, time.Now().Format("2006-01-02"))
				args = append(args, time.Now().AddDate(0, 1, 0).Format("2006-01-02"))
				argIndex += 2
			}
		}
	}

	// Get total count
	countQuery := "SELECT COUNT(*) " + baseQuery
	var totalCount int
	err := r.db.Get(&totalCount, countQuery, args...)
	if err != nil {
		return nil, 0, errors.ConvertError(err)
	}

	// Build select query with ordering (ASC for soonest first)
	selectQuery := `
		SELECT
			i.id, i.user_id, i.application_id, i.round_number, i.scheduled_date, i.scheduled_time,
			i.duration_minutes, i.outcome, i.overall_feeling, i.went_well, i.could_improve,
			i.confidence_level, i.interview_type, i.created_at, i.updated_at,
			c.name as company_name, j.title as job_title
	` + baseQuery + `
		ORDER BY i.scheduled_date ASC, COALESCE(i.scheduled_time, '00:00:00') ASC
	`

	// Add pagination if specified
	if filter != nil && filter.Limit > 0 {
		offset := 0
		if filter.Page > 1 {
			offset = (filter.Page - 1) * filter.Limit
		}
		selectQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
		args = append(args, filter.Limit, offset)
	}

	var interviews []*InterviewListItem
	err = r.db.Select(&interviews, selectQuery, args...)
	if err != nil {
		return nil, 0, errors.ConvertError(err)
	}

	return interviews, totalCount, nil
}

type PreviousRoundSummary struct {
	ID               uuid.UUID            `json:"id" db:"id"`
	RoundNumber      int                  `json:"round_number" db:"round_number"`
	InterviewType    string               `json:"interview_type" db:"interview_type"`
	ScheduledDate    string               `json:"scheduled_date" db:"scheduled_date"`
	Interviewers     []InterviewerSummary `json:"interviewers"`
	QuestionsPreview string               `json:"questions_preview"`
	FeedbackPreview  string               `json:"feedback_preview"`
}

type InterviewerSummary struct {
	Name string  `json:"name"`
	Role *string `json:"role,omitempty"`
}

func (r *InterviewRepository) GetAllRoundsSummary(applicationID uuid.UUID, userID uuid.UUID) ([]*PreviousRoundSummary, error) {
	query := `
		SELECT id, round_number, interview_type, scheduled_date
		FROM interviews
		WHERE application_id = $1 AND user_id = $2 AND deleted_at IS NULL
		ORDER BY round_number ASC
	`

	type interviewRow struct {
		ID            uuid.UUID `db:"id"`
		RoundNumber   int       `db:"round_number"`
		InterviewType string    `db:"interview_type"`
		ScheduledDate time.Time `db:"scheduled_date"`
	}

	var rows []interviewRow
	err := r.db.Select(&rows, query, applicationID, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	summaries := make([]*PreviousRoundSummary, 0, len(rows))
	for _, row := range rows {
		summary := &PreviousRoundSummary{
			ID:            row.ID,
			RoundNumber:   row.RoundNumber,
			InterviewType: row.InterviewType,
			ScheduledDate: row.ScheduledDate.Format("2006-01-02"),
			Interviewers:  []InterviewerSummary{},
		}
		summaries = append(summaries, summary)
	}

	return summaries, nil
}
