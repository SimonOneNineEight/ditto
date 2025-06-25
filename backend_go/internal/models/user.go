package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID
	Email     string
	FirstName string
	LastName  string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}

type UserAuth struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	PasswordHash string
	AvatarURL    *string

	RefreshToken          *string
	RefreshTokenExpiresAt *time.Time
	CreatedAt             time.Time
	UpdatedAt             time.Time
}
