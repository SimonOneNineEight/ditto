package database

import (
	"ditto-backend/internal/config"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type Database struct {
	*sqlx.DB
}

func NewConnection() (*Database, error) {
	var connectionString string
	
	// Check if DATABASE_URL is set (used in Docker and production)
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		connectionString = dbURL
	} else {
		// Fall back to individual environment variables
		cfg := config.GetDatabaseConfig()
		connectionString = cfg.ConnectionString()
	}

	db, err := sqlx.Connect("postgres", connectionString)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	db.SetMaxOpenConns(getEnvInt("DB_MAX_OPEN_CONNS", 25))
	db.SetMaxIdleConns(getEnvInt("DB_MAX_IDLE_CONNS", 5))
	db.SetConnMaxLifetime(time.Duration(getEnvInt("DB_CONN_MAX_LIFETIME_MIN", 5)) * time.Minute)

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

func getEnvInt(key string, defaultValue int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return defaultValue
}
