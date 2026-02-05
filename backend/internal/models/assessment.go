package models

import (
	"time"

	"github.com/google/uuid"
)

const (
	AssessmentTypeTakeHomeProject = "take_home_project"
	AssessmentTypeLiveCoding      = "live_coding"
	AssessmentTypeSystemDesign    = "system_design"
	AssessmentTypeDataStructures  = "data_structures"
	AssessmentTypeCaseStudy       = "case_study"
	AssessmentTypeOther           = "other"
)

const (
	AssessmentStatusNotStarted = "not_started"
	AssessmentStatusInProgress = "in_progress"
	AssessmentStatusSubmitted  = "submitted"
	AssessmentStatusPassed     = "passed"
	AssessmentStatusFailed     = "failed"
)

const (
	SubmissionTypeGithub     = "github"
	SubmissionTypeFileUpload = "file_upload"
	SubmissionTypeNotes      = "notes"
)

type Assessment struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	UserID         uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	ApplicationID  uuid.UUID  `json:"application_id" db:"application_id" validate:"required"`
	AssessmentType string     `json:"assessment_type" db:"assessment_type" validate:"required,max=50"`
	Title          string     `json:"title" db:"title" validate:"required,max=255"`
	DueDate        string     `json:"due_date" db:"due_date" validate:"required"`
	Status         string     `json:"status" db:"status"`
	Instructions   *string    `json:"instructions,omitempty" db:"instructions"`
	Requirements   *string    `json:"requirements,omitempty" db:"requirements"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt      *time.Time `json:"-" db:"deleted_at"`
}

func (a *Assessment) IsDeleted() bool {
	return a.DeletedAt != nil
}

type AssessmentSubmission struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	AssessmentID   uuid.UUID  `json:"assessment_id" db:"assessment_id" validate:"required"`
	SubmissionType string     `json:"submission_type" db:"submission_type" validate:"required,max=50"`
	GithubURL      *string    `json:"github_url,omitempty" db:"github_url"`
	FileID         *uuid.UUID `json:"file_id,omitempty" db:"file_id"`
	Notes          *string    `json:"notes,omitempty" db:"notes"`
	SubmittedAt    time.Time  `json:"submitted_at" db:"submitted_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	DeletedAt      *time.Time `json:"-" db:"deleted_at"`
}

func (s *AssessmentSubmission) IsDeleted() bool {
	return s.DeletedAt != nil
}
