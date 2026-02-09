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

type TimelineRepository struct {
	db *sqlx.DB
}

func NewTimelineRepository(database *database.Database) *TimelineRepository {
	return &TimelineRepository{
		db: database.DB,
	}
}

const (
	DateGroupOverdue   = "overdue"
	DateGroupToday     = "today"
	DateGroupTomorrow  = "tomorrow"
	DateGroupThisWeek  = "this_week"
	DateGroupLater     = "later"
)

type TimelineFilters struct {
	Type    string // "all", "interviews", "assessments"
	Range   string // "today", "week", "month", "all"
	Page    int
	PerPage int
}

type TimelineItem struct {
	ID            uuid.UUID     `json:"id" db:"id"`
	Type          string        `json:"type" db:"item_type"`
	Title         string        `json:"title" db:"title"`
	CompanyName   string        `json:"company_name" db:"company_name"`
	JobTitle      string        `json:"job_title" db:"job_title"`
	DueDate       time.Time     `json:"due_date" db:"due_date"`
	ApplicationID uuid.UUID     `json:"application_id" db:"application_id"`
	Countdown     CountdownInfo `json:"countdown"`
	DateGroup     string        `json:"date_group"`
	Link          string        `json:"link"`
}

type TimelineResponse struct {
	Items []TimelineItem `json:"items"`
	Meta  PaginationMeta `json:"meta"`
}

type PaginationMeta struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
}

type timelineItemRow struct {
	ID            uuid.UUID `db:"id"`
	ItemType      string    `db:"item_type"`
	Title         string    `db:"title"`
	CompanyName   string    `db:"company_name"`
	JobTitle      string    `db:"job_title"`
	DueDate       time.Time `db:"due_date"`
	ApplicationID uuid.UUID `db:"application_id"`
}

func (r *TimelineRepository) GetTimelineItems(userID uuid.UUID, filters TimelineFilters) (*TimelineResponse, error) {
	if filters.Page <= 0 {
		filters.Page = 1
	}
	if filters.PerPage <= 0 {
		filters.PerPage = 20
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	interviewRangeCondition := buildRangeCondition(filters.Range, today, "i.scheduled_date")
	assessmentRangeCondition := buildRangeCondition(filters.Range, today, "ass.due_date")

	baseInterviewQuery := `
		SELECT
			i.id,
			'interview' as item_type,
			CASE
				WHEN i.round_number > 1 THEN 'Round ' || i.round_number || ' - ' || INITCAP(REPLACE(i.interview_type, '_', ' '))
				ELSE INITCAP(REPLACE(i.interview_type, '_', ' '))
			END as title,
			c.name as company_name,
			j.title as job_title,
			i.scheduled_date as due_date,
			i.application_id
		FROM interviews i
		JOIN applications a ON i.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		WHERE i.user_id = $1
			AND i.deleted_at IS NULL
			AND a.deleted_at IS NULL
	`

	baseAssessmentQuery := `
		SELECT
			ass.id,
			'assessment' as item_type,
			ass.title,
			c.name as company_name,
			j.title as job_title,
			ass.due_date::timestamp as due_date,
			ass.application_id
		FROM assessments ass
		JOIN applications a ON ass.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		WHERE ass.user_id = $1
			AND ass.deleted_at IS NULL
			AND a.deleted_at IS NULL
			AND ass.status != $2
	`

	var query string
	var countQuery string
	var args []any
	var countArgs []any

	offset := (filters.Page - 1) * filters.PerPage

	switch filters.Type {
	case "interviews":
		query = fmt.Sprintf(`
			WITH items AS (%s %s)
			SELECT * FROM items
			ORDER BY
				CASE WHEN due_date < CURRENT_DATE THEN 0 ELSE 1 END,
				CASE WHEN due_date < CURRENT_DATE THEN due_date END ASC,
				due_date ASC
			LIMIT $2 OFFSET $3
		`, baseInterviewQuery, interviewRangeCondition)
		countQuery = fmt.Sprintf(`
			WITH items AS (%s %s)
			SELECT COUNT(*) FROM items
		`, baseInterviewQuery, interviewRangeCondition)
		args = []any{userID, filters.PerPage, offset}
		countArgs = []any{userID}

	case "assessments":
		query = fmt.Sprintf(`
			WITH items AS (%s %s)
			SELECT * FROM items
			ORDER BY
				CASE WHEN due_date < CURRENT_DATE THEN 0 ELSE 1 END,
				CASE WHEN due_date < CURRENT_DATE THEN due_date END ASC,
				due_date ASC
			LIMIT $3 OFFSET $4
		`, baseAssessmentQuery, assessmentRangeCondition)
		countQuery = fmt.Sprintf(`
			WITH items AS (%s %s)
			SELECT COUNT(*) FROM items
		`, baseAssessmentQuery, assessmentRangeCondition)
		args = []any{userID, models.AssessmentStatusSubmitted, filters.PerPage, offset}
		countArgs = []any{userID, models.AssessmentStatusSubmitted}

	default: // "all"
		query = fmt.Sprintf(`
			WITH items AS (
				%s %s
				UNION ALL
				%s %s
			)
			SELECT * FROM items
			ORDER BY
				CASE WHEN due_date < CURRENT_DATE THEN 0 ELSE 1 END,
				CASE WHEN due_date < CURRENT_DATE THEN due_date END ASC,
				due_date ASC
			LIMIT $3 OFFSET $4
		`, baseInterviewQuery, interviewRangeCondition, baseAssessmentQuery, assessmentRangeCondition)
		countQuery = fmt.Sprintf(`
			WITH items AS (
				%s %s
				UNION ALL
				%s %s
			)
			SELECT COUNT(*) FROM items
		`, baseInterviewQuery, interviewRangeCondition, baseAssessmentQuery, assessmentRangeCondition)
		args = []any{userID, models.AssessmentStatusSubmitted, filters.PerPage, offset}
		countArgs = []any{userID, models.AssessmentStatusSubmitted}
	}

	var totalCount int
	err := r.db.Get(&totalCount, countQuery, countArgs...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	var rows []timelineItemRow
	err = r.db.Select(&rows, query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	items := make([]TimelineItem, len(rows))

	for i, row := range rows {
		countdown := calculateCountdown(row.DueDate, today)
		dateGroup := calculateDateGroup(row.DueDate, today)
		link := buildItemLink(row.ItemType, row.ID, row.ApplicationID)

		items[i] = TimelineItem{
			ID:            row.ID,
			Type:          row.ItemType,
			Title:         row.Title,
			CompanyName:   row.CompanyName,
			JobTitle:      row.JobTitle,
			DueDate:       row.DueDate,
			ApplicationID: row.ApplicationID,
			Countdown:     countdown,
			DateGroup:     dateGroup,
			Link:          link,
		}
	}

	totalPages := totalCount / filters.PerPage
	if totalCount%filters.PerPage > 0 {
		totalPages++
	}

	return &TimelineResponse{
		Items: items,
		Meta: PaginationMeta{
			Page:       filters.Page,
			PerPage:    filters.PerPage,
			TotalItems: totalCount,
			TotalPages: totalPages,
		},
	}, nil
}

func buildRangeCondition(rangeFilter string, today time.Time, columnName string) string {
	switch rangeFilter {
	case "today":
		tomorrow := today.Add(24 * time.Hour)
		return fmt.Sprintf("AND %s < '%s'::timestamp", columnName, tomorrow.Format("2006-01-02"))
	case "week":
		endOfWeek := today.Add(7 * 24 * time.Hour)
		return fmt.Sprintf("AND %s < '%s'::timestamp", columnName, endOfWeek.Format("2006-01-02"))
	case "month":
		endOfMonth := today.Add(30 * 24 * time.Hour)
		return fmt.Sprintf("AND %s < '%s'::timestamp", columnName, endOfMonth.Format("2006-01-02"))
	default: // "all"
		return ""
	}
}

func calculateDateGroup(dueDate time.Time, today time.Time) string {
	dueDay := time.Date(dueDate.Year(), dueDate.Month(), dueDate.Day(), 0, 0, 0, 0, dueDate.Location())
	daysUntil := int(dueDay.Sub(today).Hours() / 24)

	switch {
	case daysUntil < 0:
		return DateGroupOverdue
	case daysUntil == 0:
		return DateGroupToday
	case daysUntil == 1:
		return DateGroupTomorrow
	case daysUntil <= 7:
		return DateGroupThisWeek
	default:
		return DateGroupLater
	}
}
