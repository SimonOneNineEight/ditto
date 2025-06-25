package db

import (
	"ditto-backend/internal/config"
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type Database struct {
	*sqlx.DB
}

func NewConnection() (*Database, error) {
	cfg := config.GetDatabaseConfig()

	db, err := sqlx.Connect("Postgres", cfg.ConnectionString())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.Unsafe().SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Successfully connected to database")
	return &Database{db}, nil
}

func (d *Database) Close() error {
	return d.DB.Close()
}

func (d *Database) IsConnectionValid() bool {
	return d.Ping() == nil
}
