package models

import (
	"time"

	"github.com/google/uuid"
)

type Company struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Description *string    `json:"description,omitempty" db:"description"`
	Website     *string    `json:"website,omitempty" db:"website"`
	LogoURL     *string    `json:"logo_url,omitempty" db:"logo_url"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time `json:"-" db:"deleted_at"`
}

func (c *Company) IsDeleted() bool {
	return c.DeletedAt != nil
}

func (c *Company) HasWebsite() bool {
	return c.Website != nil && *c.Website != ""
}

func (c *Company) HasLogo() bool {
	return c.LogoURL != nil && *c.LogoURL != ""
}
