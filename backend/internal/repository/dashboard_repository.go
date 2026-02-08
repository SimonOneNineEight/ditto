package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type DashboardRepository struct {
	db         *sqlx.DB
	statsCache map[uuid.UUID]*cachedStats
	cacheMu    sync.RWMutex
}

type cachedStats struct {
	stats     *DashboardStats
	expiresAt time.Time
}

type DashboardStats struct {
	TotalApplications  int            `json:"total_applications"`
	ActiveApplications int            `json:"active_applications"`
	InterviewCount     int            `json:"interview_count"`
	OfferCount         int            `json:"offer_count"`
	StatusCounts       map[string]int `json:"status_counts"`
	UpdatedAt          time.Time      `json:"updated_at"`
}

func NewDashboardRepository(database *database.Database) *DashboardRepository {
	return &DashboardRepository{
		db:         database.DB,
		statsCache: make(map[uuid.UUID]*cachedStats),
	}
}

func (r *DashboardRepository) GetStats(userID uuid.UUID) (*DashboardStats, error) {
	r.cacheMu.RLock()
	if cached, ok := r.statsCache[userID]; ok && time.Now().Before(cached.expiresAt) {
		r.cacheMu.RUnlock()
		return cached.stats, nil
	}
	r.cacheMu.RUnlock()

	r.cacheMu.Lock()
	defer r.cacheMu.Unlock()

	if cached, ok := r.statsCache[userID]; ok && time.Now().Before(cached.expiresAt) {
		return cached.stats, nil
	}

	stats, err := r.fetchStats(userID)
	if err != nil {
		return nil, err
	}

	r.statsCache[userID] = &cachedStats{
		stats:     stats,
		expiresAt: time.Now().Add(5 * time.Minute),
	}

	return stats, nil
}

func (r *DashboardRepository) fetchStats(userID uuid.UUID) (*DashboardStats, error) {
	query := `
		SELECT
			LOWER(ast.name) as status_name,
			COUNT(*) as count
		FROM applications a
		INNER JOIN application_status ast ON a.application_status_id = ast.id
		WHERE a.user_id = $1 AND a.deleted_at IS NULL
		GROUP BY ast.id, ast.name
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}
	defer rows.Close()

	statusCounts := map[string]int{
		"saved":     0,
		"applied":   0,
		"interview": 0,
		"offer":     0,
		"rejected":  0,
	}
	total := 0

	for rows.Next() {
		var statusName string
		var count int

		if err := rows.Scan(&statusName, &count); err != nil {
			return nil, errors.ConvertError(err)
		}

		statusCounts[strings.ToLower(statusName)] = count
		total += count
	}

	if err := rows.Err(); err != nil {
		return nil, errors.ConvertError(err)
	}

	active := statusCounts["saved"] + statusCounts["applied"] + statusCounts["interview"]

	return &DashboardStats{
		TotalApplications:  total,
		ActiveApplications: active,
		InterviewCount:     statusCounts["interview"],
		OfferCount:         statusCounts["offer"],
		StatusCounts:       statusCounts,
		UpdatedAt:          time.Now(),
	}, nil
}

func (r *DashboardRepository) InvalidateCache(userID uuid.UUID) {
	r.cacheMu.Lock()
	defer r.cacheMu.Unlock()
	delete(r.statsCache, userID)
}

const (
	UrgencyOverdue   = "overdue"
	UrgencyToday     = "today"
	UrgencyUpcoming  = "upcoming"
	UrgencyScheduled = "scheduled"
)

// UpcomingItem represents an interview or assessment with countdown info
type UpcomingItem struct {
	ID            uuid.UUID     `json:"id" db:"id"`
	Type          string        `json:"type" db:"item_type"`
	Title         string        `json:"title" db:"title"`
	CompanyName   string        `json:"company_name" db:"company_name"`
	JobTitle      string        `json:"job_title" db:"job_title"`
	DueDate       time.Time     `json:"due_date" db:"due_date"`
	ApplicationID uuid.UUID     `json:"application_id" db:"application_id"`
	Countdown     CountdownInfo `json:"countdown"`
	Link          string        `json:"link"`
}

type CountdownInfo struct {
	Text      string `json:"text"`
	Urgency   string `json:"urgency"`
	DaysUntil int    `json:"days_until"`
}

type upcomingItemRow struct {
	ID            uuid.UUID `db:"id"`
	ItemType      string    `db:"item_type"`
	Title         string    `db:"title"`
	CompanyName   string    `db:"company_name"`
	JobTitle      string    `db:"job_title"`
	DueDate       time.Time `db:"due_date"`
	ApplicationID uuid.UUID `db:"application_id"`
}

// GetUpcomingItems returns upcoming interviews and assessments for a user
func (r *DashboardRepository) GetUpcomingItems(userID uuid.UUID, limit int, itemType string) ([]UpcomingItem, error) {
	if limit <= 0 {
		limit = 4
	}

	var query string
	var args []any

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

	switch itemType {
	case "interviews":
		query = fmt.Sprintf(`
			WITH items AS (%s)
			SELECT * FROM items
			ORDER BY
				CASE WHEN due_date < CURRENT_DATE THEN 0 ELSE 1 END,
				CASE WHEN due_date < CURRENT_DATE THEN due_date END ASC,
				due_date ASC
			LIMIT $2
		`, baseInterviewQuery)
		args = []any{userID, limit}

	case "assessments":
		query = fmt.Sprintf(`
			WITH items AS (%s)
			SELECT * FROM items
			ORDER BY
				CASE WHEN due_date < CURRENT_DATE THEN 0 ELSE 1 END,
				CASE WHEN due_date < CURRENT_DATE THEN due_date END ASC,
				due_date ASC
			LIMIT $3
		`, baseAssessmentQuery)
		args = []any{userID, models.AssessmentStatusSubmitted, limit}

	default: // "all" or empty
		query = fmt.Sprintf(`
			WITH items AS (
				%s
				UNION ALL
				%s
			)
			SELECT * FROM items
			ORDER BY
				CASE WHEN due_date < CURRENT_DATE THEN 0 ELSE 1 END,
				CASE WHEN due_date < CURRENT_DATE THEN due_date END ASC,
				due_date ASC
			LIMIT $3
		`, baseInterviewQuery, baseAssessmentQuery)
		args = []any{userID, models.AssessmentStatusSubmitted, limit}
	}

	var rows []upcomingItemRow
	err := r.db.Select(&rows, query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	items := make([]UpcomingItem, len(rows))
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	for i, row := range rows {
		countdown := calculateCountdown(row.DueDate, today)
		link := buildItemLink(row.ItemType, row.ID, row.ApplicationID)

		items[i] = UpcomingItem{
			ID:            row.ID,
			Type:          row.ItemType,
			Title:         row.Title,
			CompanyName:   row.CompanyName,
			JobTitle:      row.JobTitle,
			DueDate:       row.DueDate,
			ApplicationID: row.ApplicationID,
			Countdown:     countdown,
			Link:          link,
		}
	}

	return items, nil
}

// CalculateCountdown computes countdown info for a given due date (exported for testing)
func CalculateCountdown(dueDate time.Time, today time.Time) CountdownInfo {
	return calculateCountdown(dueDate, today)
}

func calculateCountdown(dueDate time.Time, today time.Time) CountdownInfo {
	dueDay := time.Date(dueDate.Year(), dueDate.Month(), dueDate.Day(), 0, 0, 0, 0, dueDate.Location())
	daysUntil := int(dueDay.Sub(today).Hours() / 24)

	var text string
	var urgency string

	switch {
	case daysUntil < 0:
		urgency = UrgencyOverdue
		if daysUntil == -1 {
			text = "1 day overdue"
		} else {
			text = fmt.Sprintf("%d days overdue", -daysUntil)
		}
	case daysUntil == 0:
		urgency = UrgencyToday
		text = "Today"
	case daysUntil <= 3:
		urgency = UrgencyUpcoming
		if daysUntil == 1 {
			text = "Tomorrow"
		} else {
			text = fmt.Sprintf("In %d days", daysUntil)
		}
	default:
		urgency = UrgencyScheduled
		text = fmt.Sprintf("In %d days", daysUntil)
	}

	return CountdownInfo{
		Text:      text,
		Urgency:   urgency,
		DaysUntil: daysUntil,
	}
}

func buildItemLink(itemType string, id uuid.UUID, applicationID uuid.UUID) string {
	if itemType == "interview" {
		return fmt.Sprintf("/interviews/%s", id.String())
	}
	return fmt.Sprintf("/applications/%s/assessments/%s", applicationID.String(), id.String())
}
