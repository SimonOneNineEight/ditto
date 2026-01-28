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

type InterviewQuestionRepository struct {
	db *sqlx.DB
}

func NewInterviewQuestionRepository(database *database.Database) *InterviewQuestionRepository {
	return &InterviewQuestionRepository{
		db: database.DB,
	}
}

// GetNextOrder returns the next order value for questions in an interview
func (r *InterviewQuestionRepository) GetNextOrder(interviewID uuid.UUID) (int, error) {
	var maxOrder *int
	query := `
		SELECT MAX("order") FROM interview_questions
		WHERE interview_id = $1 AND deleted_at IS NULL
	`
	err := r.db.Get(&maxOrder, query, interviewID)
	if err != nil {
		return 0, errors.ConvertError(err)
	}
	if maxOrder == nil {
		return 0, nil
	}
	return *maxOrder + 1, nil
}

func (r *InterviewQuestionRepository) CreateInterviewQuestion(interviewQuestion *models.InterviewQuestion) (*models.InterviewQuestion, error) {
	interviewQuestion.ID = uuid.New()
	interviewQuestion.CreatedAt = time.Now()
	interviewQuestion.UpdatedAt = time.Now()

	query := `
		INSERT INTO interview_questions (
			id, interview_id, question_text, answer_text, "order", created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := r.db.Exec(query, interviewQuestion.ID, interviewQuestion.InterviewID,
		interviewQuestion.QuestionText, interviewQuestion.AnswerText, interviewQuestion.Order,
		interviewQuestion.CreatedAt, interviewQuestion.UpdatedAt,
	)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interviewQuestion, nil
}

// CreateInterviewQuestions creates multiple questions in bulk
func (r *InterviewQuestionRepository) CreateInterviewQuestions(questions []*models.InterviewQuestion) ([]*models.InterviewQuestion, error) {
	if len(questions) == 0 {
		return questions, nil
	}

	// Get starting order for bulk insert
	nextOrder, err := r.GetNextOrder(questions[0].InterviewID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	for i, q := range questions {
		q.ID = uuid.New()
		q.CreatedAt = now
		q.UpdatedAt = now
		if q.Order == 0 {
			q.Order = nextOrder + i
		}
	}

	query := `
		INSERT INTO interview_questions (
			id, interview_id, question_text, answer_text, "order", created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	for _, q := range questions {
		_, err := r.db.Exec(
			query,
			q.ID, q.InterviewID, q.QuestionText, q.AnswerText,
			q.Order, q.CreatedAt, q.UpdatedAt,
		)
		if err != nil {
			return nil, errors.ConvertError(err)
		}
	}

	return questions, nil
}

func (r *InterviewQuestionRepository) GetInterviewQuestionByID(interviewQuestionID uuid.UUID) (*models.InterviewQuestion, error) {
	query := `
		SELECT id, interview_id, question_text, answer_text, "order", created_at, updated_at
		FROM interview_questions
		WHERE id = $1 AND deleted_at IS NULL
	`

	interviewQuestion := models.InterviewQuestion{}
	err := r.db.Get(&interviewQuestion, query, interviewQuestionID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &interviewQuestion, nil
}

func (r *InterviewQuestionRepository) UpdateInterviewQuestion(interviewQuestionID uuid.UUID, updates map[string]any) (*models.InterviewQuestion, error) {
	if len(updates) == 0 {
		return r.GetInterviewQuestionByID(interviewQuestionID)
	}

	setParts := []string{}
	args := []any{}
	argIndex := 1

	for field, value := range updates {
		// Handle reserved word "order" by quoting it
		if field == "order" {
			setParts = append(setParts, fmt.Sprintf(`"%s" = $%d`, field, argIndex))
		} else {
			setParts = append(setParts, fmt.Sprintf("%s = $%d", field, argIndex))
		}
		args = append(args, value)
		argIndex++
	}

	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	args = append(args, interviewQuestionID)

	query := fmt.Sprintf(`
		UPDATE interview_questions
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
		return nil, errors.New(errors.ErrorNotFound, "interview question not found")
	}

	return r.GetInterviewQuestionByID(interviewQuestionID)
}

func (r *InterviewQuestionRepository) GetInterviewQuestionByInterviewID(interviewID uuid.UUID) ([]*models.InterviewQuestion, error) {
	query := `
		SELECT id, interview_id, question_text, answer_text, "order", created_at, updated_at
		FROM interview_questions
		WHERE interview_id = $1 AND deleted_at IS NULL
		ORDER BY "order" ASC
	`

	var interviewQuestions []*models.InterviewQuestion
	err := r.db.Select(&interviewQuestions, query, interviewID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interviewQuestions, nil
}

func (r *InterviewQuestionRepository) SoftDeleteInterviewQuestion(interviewQuestionID uuid.UUID) error {
	query := `
		UPDATE interview_questions
		SET deleted_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, time.Now(), interviewQuestionID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowAffected == 0 {
		return errors.New(errors.ErrorNotFound, "interview question not found")
	}

	return nil
}

// ReorderQuestions updates the order of questions based on the provided question IDs array
func (r *InterviewQuestionRepository) ReorderQuestions(interviewID uuid.UUID, questionIDs []uuid.UUID) ([]*models.InterviewQuestion, error) {
	now := time.Now()

	// Update order for each question based on its position in the array
	for i, qID := range questionIDs {
		query := `
			UPDATE interview_questions
			SET "order" = $1, updated_at = $2
			WHERE id = $3 AND interview_id = $4 AND deleted_at IS NULL
		`

		result, err := r.db.Exec(query, i, now, qID, interviewID)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		if rowsAffected == 0 {
			return nil, errors.New(errors.ErrorBadRequest, fmt.Sprintf("question %s not found or does not belong to this interview", qID))
		}
	}

	return r.GetInterviewQuestionByInterviewID(interviewID)
}
