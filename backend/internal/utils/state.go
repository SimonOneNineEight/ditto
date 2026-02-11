package utils

import (
	"ditto-backend/internal/services"
	"ditto-backend/pkg/database"
	"path/filepath"
)

type AppState struct {
	DB        *database.Database
	Sanitizer *services.SanitizerService
}

func NewAppState() (*AppState, error) {
	db, err := database.NewConnection()
	if err != nil {
		return nil, err
	}

	migrationsPath := filepath.Join("migrations")
	if err := database.RunMigrations(db.DB, migrationsPath); err != nil {
		return nil, err
	}

	return &AppState{
		DB:        db,
		Sanitizer: services.NewSanitizerService(),
	}, nil
}

func (s *AppState) Close() error {
	return s.DB.Close()
}
