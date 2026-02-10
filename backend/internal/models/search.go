package models

import (
	"time"

	"github.com/google/uuid"
)

type SearchResult struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Type        string    `json:"type" db:"item_type"`
	Title       string    `json:"title" db:"title"`
	Snippet     string    `json:"snippet" db:"snippet"`
	CompanyName string    `json:"company_name,omitempty" db:"company_name"`
	Rank        float64   `json:"rank" db:"rank"`
	Link        string    `json:"link"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type GroupedSearchResponse struct {
	Applications []SearchResult `json:"applications"`
	Interviews   []SearchResult `json:"interviews"`
	Assessments  []SearchResult `json:"assessments"`
	Notes        []SearchResult `json:"notes"`
	TotalCount   int            `json:"total_count"`
	Query        string         `json:"query"`
}
