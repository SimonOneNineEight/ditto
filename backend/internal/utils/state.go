package utils

import (
	"ditto-backend/pkg/database"
)

type AppState struct {
	DB *database.Database
}

func NewAppState() (*AppState, error) {
	database, err := database.NewConnection()
	if err != nil {
		return nil, err
	}

	return &AppState{
		DB: database,
	}, nil
}

func (s *AppState) Close() error {
	return s.DB.Close()
}
