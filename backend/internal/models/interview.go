package models

import (
	"time"

	"github.com/google/uuid"
)

// Interview represents an interview for a job application
type Interview struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	ApplicationID uuid.UUID  `json:"application_id" db:"application_id" validate:"required"`
	Date          time.Time  `json:"date" db:"date" validate:"required"`
	InterviewType string     `json:"interview_type" db:"interview_type" validate:"required,max=50"`
	QuestionAsked *string    `json:"question_asked,omitempty" db:"question_asked"`
	Notes         *string    `json:"notes,omitempty" db:"notes"`
	Feedback      *string    `json:"feedback,omitempty" db:"feedback"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt     *time.Time `json:"-" db:"deleted_at"`
}

// IsDeleted checks if the interview is soft deleted
func (i *Interview) IsDeleted() bool {
	return i.DeletedAt != nil
}

// HasFeedback checks if interview has feedback
func (i *Interview) HasFeedback() bool {
	return i.Feedback != nil && *i.Feedback != ""
}

// HasQuestions checks if interview has recorded questions
func (i *Interview) HasQuestions() bool {
	return i.QuestionAsked != nil && *i.QuestionAsked != ""
}
