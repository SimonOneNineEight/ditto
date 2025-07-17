package utils

import (
	"ditto-backend/pkg/database"
	"path/filepath"
)

type AppState struct {
	DB *database.Database
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
		DB: db,
	}, nil
}

func (s *AppState) Close() error {
	return s.DB.Close()
}
