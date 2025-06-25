package utils

import (
	"ditto-backend/internal/db"
)

type AppState struct {
	DB *db.Database
}

func NewAppState() (*AppState, error) {
	database, err := db.NewConnection()
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
