package repository

import (
	"database/sql"
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type InterviewNoteRepository struct {
	db *sqlx.DB
}

func NewInterviewNoteRepository(database *database.Database) *InterviewNoteRepository {
	return &InterviewNoteRepository{
		db: database.DB,
	}
}

func (r *InterviewNoteRepository) CreateInterviewNote(interviewNote *models.InterviewNote) (*models.InterviewNote, error) {
	interviewNote.ID = uuid.New()
	interviewNote.CreatedAt = time.Now()
	interviewNote.UpdatedAt = time.Now()

	query := `
		INSERT INTO interview_notes (
			id, interview_id, note_type, content, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.db.Exec(query, interviewNote.ID, interviewNote.InterviewID,
		interviewNote.NoteType, interviewNote.Content,
		interviewNote.CreatedAt, interviewNote.UpdatedAt,
	)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interviewNote, nil
}

func (r *InterviewNoteRepository) GetInterviewNoteByID(interviewNoteID uuid.UUID) (*models.InterviewNote, error) {
	query := `
		SELECT id, interview_id, note_type, content, created_at, updated_at
		FROM interview_notes
		WHERE id = $1 AND deleted_at IS NULL
	`

	interviewNote := models.InterviewNote{}
	err := r.db.Get(&interviewNote, query, interviewNoteID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &interviewNote, nil
}

func (r *InterviewNoteRepository) UpdateInterviewNote(interviewNoteID uuid.UUID, updates map[string]any) (*models.InterviewNote, error) {
	if len(updates) == 0 {
		return r.GetInterviewNoteByID(interviewNoteID)
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

	args = append(args, interviewNoteID)

	query := fmt.Sprintf(`
		UPDATE interview_notes
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
		return nil, errors.New(errors.ErrorNotFound, "interview note not found")
	}

	return r.GetInterviewNoteByID(interviewNoteID)
}

func (r *InterviewNoteRepository) GetInterviewNotesByInterviewID(interviewID uuid.UUID) ([]*models.InterviewNote, error) {
	query := `
		SELECT id, interview_id, note_type, content, created_at, updated_at
		FROM interview_notes
		WHERE interview_id = $1 AND deleted_at IS NULL
	`

	var interviewNotes []*models.InterviewNote
	err := r.db.Select(&interviewNotes, query, interviewID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return interviewNotes, nil
}

func (r *InterviewNoteRepository) SoftDeleteInterviewNote(interviewNoteID uuid.UUID) error {
	query := `
		UPDATE interview_notes
		SET deleted_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, time.Now(), interviewNoteID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowAffected == 0 {
		return errors.New(errors.ErrorNotFound, "interview note not found")
	}

	return nil
}

func (r *InterviewNoteRepository) GetNoteByInterviewAndType(interviewID uuid.UUID, noteType string) (*models.InterviewNote, error) {
	query := `
		SELECT id, interview_id, note_type, content, created_at, updated_at
		FROM interview_notes
		WHERE interview_id = $1 AND note_type = $2 AND deleted_at IS NULL
	`

	var interviewNote models.InterviewNote
	err := r.db.Get(&interviewNote, query, interviewID, noteType)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, errors.ConvertError(err)
	}

	return &interviewNote, nil
}
