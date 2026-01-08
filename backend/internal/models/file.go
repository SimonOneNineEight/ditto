package models

import (
	"time"

	"github.com/google/uuid"
)

type File struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	UserID        uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	ApplicationID uuid.UUID  `json:"application_id" db:"application_id" validate:"required"`
	InterviewID   *uuid.UUID `json:"interview_id,omitempty" db:"interview_id"`
	FileName      string     `json:"file_name" db:"file_name" validate:"required,max=255"`
	FileType      string     `json:"file_type" db:"file_type" validate:"required,max=50"`
	FileSize      int64      `json:"file_size" db:"file_size" validate:"required,min=1"`
	S3Key         string     `json:"s3_key" db:"s3_key" validate:"required,max=500"`
	UploadedAt    time.Time  `json:"uploaded_at" db:"uploaded_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt     *time.Time `json:"-" db:"deleted_at"`
}

func (f *File) IsDeleted() bool {
	return f.DeletedAt != nil
}

func (f *File) BelongsToInterview() bool {
	return f.InterviewID != nil
}
