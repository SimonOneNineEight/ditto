package models

import (
	"time"

	"github.com/google/uuid"
)

type RateLimit struct {
	ID           uuid.UUID `json:"id" db:"id"`
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	Resource     string    `json:"resource" db:"resource"`
	RequestCount int       `json:"request_count" db:"request_count"`
	WindowStart  time.Time `json:"window_start" db:"window_start"`
	WindowEnd    time.Time `json:"window_end" db:"window_end"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}
