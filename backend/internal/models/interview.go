package models

import (
	"time"

	"github.com/google/uuid"
)

const (
	InterviewTypePhoneScreen = "phone_screen"
	InterviewTypeTechnical   = "technical"
	InterviewTypeBehavioral  = "behavioral"
	InterviewTypePanel       = "panel"
	InterviewTypeOnsite      = "onsite"
	InterviewTypeOther       = "other"
)

const (
	NoteTypePreparation     = "preparation"
	NoteTypeCompanyResearch = "company_research"
	NoteTypeFeedback        = "feedback"
	NoteTypeReflection      = "reflection"
	NoteTypeGeneral         = "general"
)

type Interview struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	UserID          uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	ApplicationID   uuid.UUID  `json:"application_id" db:"application_id" validate:"required"`
	RoundNumber     int        `json:"round_number" db:"round_number"`
	ScheduledTime   *string    `json:"scheduled_time,omitempty" db:"scheduled_time"`
	ScheduledDate   time.Time  `json:"scheduled_date" db:"scheduled_date"`
	DurationMinutes *int       `json:"duration_minutes,omitempty" db:"duration_minutes"`
	Outcome         *string    `json:"outcome,omitempty" db:"outcome"`
	OverallFeeling  *string    `json:"overall_feeling,omitempty" db:"overall_feeling"`
	WentWell        *string    `json:"went_well,omitempty" db:"went_well"`
	CouldImprove    *string    `json:"could_improve,omitempty" db:"could_improve"`
	ConfidenceLevel *int       `json:"confidence_level,omitempty" db:"confidence_level"`
	InterviewType   string     `json:"interview_type" db:"interview_type" validate:"required,max=50"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt       *time.Time `json:"-" db:"deleted_at"`
}

// IsDeleted checks if the interview is soft deleted
func (i *Interview) IsDeleted() bool {
	return i.DeletedAt != nil
}

type Interviewer struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	InterviewID uuid.UUID  `json:"interview_id" db:"interview_id" validate:"required"`
	Name        string     `json:"name" db:"name"`
	Role        *string    `json:"role,omitempty" db:"role"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time `json:"-" db:"deleted_at"`
}

type InterviewQuestion struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	InterviewID  uuid.UUID  `json:"interview_id" db:"interview_id" validate:"required"`
	QuestionText string     `json:"question_text" db:"question_text"`
	AnswerText   *string    `json:"answer_text,omitempty" db:"answer_text"`
	Order        int        `json:"order" db:"order"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"-" db:"deleted_at"`
}

func (q *InterviewQuestion) IsDeleted() bool {
	return q.DeletedAt != nil
}

type InterviewNote struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	InterviewID uuid.UUID  `json:"interview_id" db:"interview_id" validate:"required"`
	NoteType    string     `json:"note_type" db:"note_type"`
	Content     *string    `json:"content,omitempty" db:"content"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time `json:"-" db:"deleted_at"`
}

func (n *InterviewNote) IsDeleted() bool {
	return n.DeletedAt != nil
}

type InterviewWithDetails struct {
	Interview
	Interviewers       []Interviewer       `json:"interviewers"`
	InterviewQuestions []InterviewQuestion `json:"interview_questions"`
	InterviewNotes     []InterviewNote     `json:"interview_notes"`
}
