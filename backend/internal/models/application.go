package models

import (
	"time"

	"github.com/google/uuid"
)

type ApplicationStatus struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Name      string    `json:"name" db:"name" validation:"required,min=1,max=50"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Application struct {
	ID                  uuid.UUID  `json:"id" db:"id"`
	UserID              uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	JobID               uuid.UUID  `json:"job_id" db:"job_id" validate:"required"`
	ApplicationStatusID uuid.UUID  `json:"application_status_id" db:"application_status_id" validate:"required"`
	AppliedAt           time.Time  `json:"applied_at" db:"applied_at"`
	OfferReceived       bool       `json:"offer_received" db:"offer_received"`
	AttemptNumber       int        `json:"attempt_number" db:"attempt_number" validate:"min=1"`
	Notes               *string    `json:"notes,omitempty" db:"notes"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt           *time.Time `json:"-" db:"deleted_at"`
}

func (a *Application) IsDeleted() bool {
	return a.DeletedAt != nil
}

func (a *Application) HasNote() bool {
	return a.Notes != nil
}
