package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	Email     string     `json:"email" db:"email" validate:"required,email"`
	Name      string     `json:"name" db:"name" validate:"required,min=1,max=100"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"-" db:"deleted_at"`
}

func (u *User) IsDeleted() bool {
	return u.DeletedAt != nil
}

type UserAuth struct {
	ID           uuid.UUID `json:"id" db:"id"`
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	PasswordHash *string   `json:"-" db:"password_hash"`
	AuthProvider  string  `json:"auth_provider" db:"auth_provider"`
	ProviderEmail *string `json:"provider_email,omitempty" db:"provider_email"`
	AvatarURL     *string `json:"avatar_url,omitempty" db:"avatar_url"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type UserRefreshToken struct {
	ID           uuid.UUID `json:"id" db:"id"`
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	RefreshToken string    `json:"-" db:"refresh_token"`
	ExpiresAt    time.Time `json:"-" db:"expires_at"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}
