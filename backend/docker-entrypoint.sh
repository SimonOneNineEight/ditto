#!/bin/bash

# Docker entrypoint script for Go backend
set -e

echo "Starting Ditto Go Backend..."

# Wait for database to be ready
echo "Waiting for database connection..."
until pg_isready -h db -p 5432 -U ditto_user -d ditto_dev; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
if migrate -path migrations -database "$DATABASE_URL" up; then
  echo "Migrations completed successfully"
else
  echo "Migration failed, but continuing..."
fi

# Check if we're in development mode
if [[ "$GIN_MODE" == "debug" ]]; then
  echo "Starting in development mode..."
  
  # Install dependencies if go.mod changed
  go mod download
  
  # Start with go run for development
  exec go run cmd/server/main.go
else
  echo "Starting in production mode..."
  
  # Build if binary doesn't exist
  if [[ ! -f "bin/server" ]]; then
    echo "Building application..."
    go build -o bin/server cmd/server/main.go
  fi
  
  # Start the server
  exec ./bin/server
fi