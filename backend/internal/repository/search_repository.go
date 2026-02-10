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

type SearchRepository struct {
	db *sqlx.DB
}

func NewSearchRepository(database *database.Database) *SearchRepository {
	return &SearchRepository{
		db: database.DB,
	}
}

type searchResultRow struct {
	ID          uuid.UUID `db:"id"`
	ItemType    string    `db:"item_type"`
	Title       string    `db:"title"`
	Snippet     string    `db:"snippet"`
	CompanyName string    `db:"company_name"`
	Rank        float64   `db:"rank"`
	UpdatedAt   string    `db:"updated_at"`
}

func (r *SearchRepository) Search(userID uuid.UUID, query string, limit int) (*models.GroupedSearchResponse, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	response := &models.GroupedSearchResponse{
		Applications: []models.SearchResult{},
		Interviews:   []models.SearchResult{},
		Assessments:  []models.SearchResult{},
		Notes:        []models.SearchResult{},
		Query:        query,
	}

	applications, err := r.searchApplications(userID, query, limit)
	if err != nil {
		return nil, err
	}
	response.Applications = applications

	interviews, err := r.searchInterviews(userID, query, limit)
	if err != nil {
		return nil, err
	}
	response.Interviews = interviews

	assessments, err := r.searchAssessments(userID, query, limit)
	if err != nil {
		return nil, err
	}
	response.Assessments = assessments

	notes, err := r.searchNotes(userID, query, limit)
	if err != nil {
		return nil, err
	}
	response.Notes = notes

	response.TotalCount = len(applications) + len(interviews) + len(assessments) + len(notes)

	return response, nil
}

func (r *SearchRepository) searchApplications(userID uuid.UUID, query string, limit int) ([]models.SearchResult, error) {
	sqlQuery := `
		WITH search_query AS (
			SELECT websearch_to_tsquery('english', $2) AS q
		)
		SELECT
			a.id,
			'application' as item_type,
			j.title || ' at ' || c.name as title,
			COALESCE(
				ts_headline('english',
					COALESCE(j.title, '') || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(a.notes, ''),
					sq.q,
					'MaxWords=20, MinWords=10, StartSel=<b>, StopSel=</b>'
				),
				''
			) as snippet,
			c.name as company_name,
			ts_rank(
				setweight(to_tsvector('english', COALESCE(c.name, '')), 'A') ||
				setweight(to_tsvector('english', COALESCE(j.title, '')), 'B') ||
				COALESCE(a.search_vector, ''::tsvector),
				sq.q
			) as rank,
			a.updated_at::text as updated_at
		FROM applications a
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		CROSS JOIN search_query sq
		WHERE a.user_id = $1
			AND a.deleted_at IS NULL
			AND (
				(
					setweight(to_tsvector('english', COALESCE(c.name, '')), 'A') ||
					setweight(to_tsvector('english', COALESCE(j.title, '')), 'B') ||
					COALESCE(a.search_vector, ''::tsvector)
				) @@ sq.q
			)
		ORDER BY rank DESC
		LIMIT $3
	`

	var rows []searchResultRow
	err := r.db.Select(&rows, sqlQuery, userID, query, limit)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return convertRowsToResults(rows, "application")
}

func (r *SearchRepository) searchInterviews(userID uuid.UUID, query string, limit int) ([]models.SearchResult, error) {
	sqlQuery := `
		WITH search_query AS (
			SELECT websearch_to_tsquery('english', $2) AS q
		)
		SELECT
			i.id,
			'interview' as item_type,
			CASE
				WHEN i.round_number > 1 THEN 'Round ' || i.round_number || ' - ' || INITCAP(REPLACE(i.interview_type, '_', ' '))
				ELSE INITCAP(REPLACE(i.interview_type, '_', ' '))
			END || ' at ' || c.name as title,
			'' as snippet,
			c.name as company_name,
			1.0 as rank,
			i.updated_at::text as updated_at
		FROM interviews i
		JOIN applications a ON i.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		CROSS JOIN search_query sq
		WHERE i.user_id = $1
			AND i.deleted_at IS NULL
			AND a.deleted_at IS NULL
			AND (
				to_tsvector('english', COALESCE(c.name, '')) ||
				to_tsvector('english', COALESCE(j.title, ''))
			) @@ sq.q
		ORDER BY i.scheduled_date DESC
		LIMIT $3
	`

	var rows []searchResultRow
	err := r.db.Select(&rows, sqlQuery, userID, query, limit)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return convertRowsToResults(rows, "interview")
}

func (r *SearchRepository) searchAssessments(userID uuid.UUID, query string, limit int) ([]models.SearchResult, error) {
	sqlQuery := `
		WITH search_query AS (
			SELECT websearch_to_tsquery('english', $2) AS q
		)
		SELECT
			ass.id,
			'assessment' as item_type,
			ass.title || ' at ' || c.name as title,
			COALESCE(
				ts_headline('english',
					COALESCE(ass.title, '') || ' ' || COALESCE(ass.instructions, ''),
					sq.q,
					'MaxWords=20, MinWords=10, StartSel=<b>, StopSel=</b>'
				),
				''
			) as snippet,
			c.name as company_name,
			ts_rank(ass.search_vector, sq.q) as rank,
			ass.updated_at::text as updated_at
		FROM assessments ass
		JOIN applications a ON ass.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		CROSS JOIN search_query sq
		WHERE ass.user_id = $1
			AND ass.deleted_at IS NULL
			AND a.deleted_at IS NULL
			AND ass.search_vector @@ sq.q
		ORDER BY rank DESC
		LIMIT $3
	`

	var rows []searchResultRow
	err := r.db.Select(&rows, sqlQuery, userID, query, limit)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return convertRowsToResults(rows, "assessment")
}

func (r *SearchRepository) searchNotes(userID uuid.UUID, query string, limit int) ([]models.SearchResult, error) {
	sqlQuery := `
		WITH search_query AS (
			SELECT websearch_to_tsquery('english', $2) AS q
		)
		SELECT
			in_notes.id,
			'note' as item_type,
			INITCAP(REPLACE(in_notes.note_type, '_', ' ')) || ' Note - ' || c.name as title,
			COALESCE(
				ts_headline('english',
					COALESCE(in_notes.content, ''),
					sq.q,
					'MaxWords=20, MinWords=10, StartSel=<b>, StopSel=</b>'
				),
				''
			) as snippet,
			c.name as company_name,
			ts_rank(in_notes.search_vector, sq.q) as rank,
			in_notes.updated_at::text as updated_at
		FROM interview_notes in_notes
		JOIN interviews i ON in_notes.interview_id = i.id
		JOIN applications a ON i.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		CROSS JOIN search_query sq
		WHERE i.user_id = $1
			AND in_notes.deleted_at IS NULL
			AND i.deleted_at IS NULL
			AND a.deleted_at IS NULL
			AND in_notes.search_vector @@ sq.q

		UNION ALL

		SELECT
			iq.id,
			'question' as item_type,
			'Interview Question - ' || c.name as title,
			COALESCE(
				ts_headline('english',
					COALESCE(iq.question_text, '') || ' ' || COALESCE(iq.answer_text, ''),
					sq.q,
					'MaxWords=20, MinWords=10, StartSel=<b>, StopSel=</b>'
				),
				''
			) as snippet,
			c.name as company_name,
			ts_rank(iq.search_vector, sq.q) as rank,
			iq.updated_at::text as updated_at
		FROM interview_questions iq
		JOIN interviews i ON iq.interview_id = i.id
		JOIN applications a ON i.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		CROSS JOIN search_query sq
		WHERE i.user_id = $1
			AND iq.deleted_at IS NULL
			AND i.deleted_at IS NULL
			AND a.deleted_at IS NULL
			AND iq.search_vector @@ sq.q

		ORDER BY rank DESC
		LIMIT $3
	`

	var rows []searchResultRow
	err := r.db.Select(&rows, sqlQuery, userID, query, limit)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return convertRowsToResults(rows, "note")
}

func convertRowsToResults(rows []searchResultRow, resultType string) ([]models.SearchResult, error) {
	results := make([]models.SearchResult, len(rows))
	for i, row := range rows {
		updatedAt, _ := time.Parse(time.RFC3339, row.UpdatedAt)
		if updatedAt.IsZero() {
			updatedAt, _ = time.Parse("2006-01-02 15:04:05.999999", row.UpdatedAt)
		}
		results[i] = models.SearchResult{
			ID:          row.ID,
			Type:        row.ItemType,
			Title:       row.Title,
			Snippet:     row.Snippet,
			CompanyName: row.CompanyName,
			Rank:        row.Rank,
			Link:        buildSearchLink(row.ItemType, row.ID),
			UpdatedAt:   updatedAt,
		}
	}
	return results, nil
}

func buildSearchLink(itemType string, id uuid.UUID) string {
	switch itemType {
	case "application":
		return fmt.Sprintf("/applications/%s", id.String())
	case "interview":
		return fmt.Sprintf("/interviews/%s", id.String())
	case "assessment":
		return fmt.Sprintf("/assessments/%s", id.String())
	case "note", "question":
		return fmt.Sprintf("/notes/%s", id.String())
	default:
		return ""
	}
}
