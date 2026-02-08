package models

import (
	"time"

	"github.com/google/uuid"
)

const (
	NotificationTypeInterviewReminder  = "interview_reminder"
	NotificationTypeAssessmentDeadline = "assessment_deadline"
	NotificationTypeSystemAlert        = "system_alert"
)

type Notification struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Type      string     `json:"type" db:"type"`
	Title     string     `json:"title" db:"title"`
	Message   string     `json:"message" db:"message"`
	Link      *string    `json:"link,omitempty" db:"link"`
	Read      bool       `json:"read" db:"read"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	DeletedAt *time.Time `json:"-" db:"deleted_at"`
}

func (n *Notification) IsDeleted() bool {
	return n.DeletedAt != nil
}

type UserNotificationPreferences struct {
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	Interview24h bool      `json:"interview_24h" db:"interview_24h"`
	Interview1h  bool      `json:"interview_1h" db:"interview_1h"`
	Assessment3d bool      `json:"assessment_3d" db:"assessment_3d"`
	Assessment1d bool      `json:"assessment_1d" db:"assessment_1d"`
	Assessment1h bool      `json:"assessment_1h" db:"assessment_1h"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

func DefaultNotificationPreferences(userID uuid.UUID) *UserNotificationPreferences {
	return &UserNotificationPreferences{
		UserID:       userID,
		Interview24h: true,
		Interview1h:  true,
		Assessment3d: true,
		Assessment1d: true,
		Assessment1h: false,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}
