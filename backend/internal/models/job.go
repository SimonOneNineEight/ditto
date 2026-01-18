package models

import (
	"time"

	"github.com/google/uuid"
)

type Job struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	CompanyID      uuid.UUID  `json:"company_id" db:"company_id"`
	Title          string     `json:"title" db:"title" validate:"required,min=1,max=255"`
	JobDescription string     `json:"job_description" db:"job_description" validate:"required,min=1"`
	Location       string     `json:"location" db:"location" validate:"required,min=1"`
	JobType        string     `json:"job_type" db:"job_type" validate:"max=50"`
	SourceURL      *string    `json:"source_url,omitempty" db:"source_url"`
	Platform       *string    `json:"platform,omitempty" db:"platform"`
	MinSalary      *float64   `json:"min_salary,omitempty" db:"min_salary"`
	MaxSalary      *float64   `json:"max_salary,omitempty" db:"max_salary"`
	Currency       *string    `json:"currency,omitempty" db:"currency"`
	IsExpired      bool       `json:"is_expired" db:"is_expired"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt      *time.Time `json:"-" db:"deleted_at"`
}

type UserJob struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

func (j *Job) IsDeleted() bool {
	return j.DeletedAt != nil
}

func (j *Job) HasSalaryRange() bool {
	return j.MinSalary != nil || j.MaxSalary != nil
}
