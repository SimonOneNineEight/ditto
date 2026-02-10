#!/bin/bash
set -e

# Create test database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE ditto_test'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ditto_test')\gexec
    GRANT ALL PRIVILEGES ON DATABASE ditto_test TO ditto_user;
EOSQL

echo "Test database 'ditto_test' created successfully"
