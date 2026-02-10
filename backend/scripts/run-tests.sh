#!/bin/bash

# Test database configuration
export TEST_DB_HOST=localhost
export TEST_DB_PORT=5432
export TEST_DB_USER=ditto_user
export TEST_DB_PASSWORD=ditto_password
export TEST_DB_NAME=ditto_test

# Also set production DB vars for tests that use database.NewConnection()
export DB_HOST=$TEST_DB_HOST
export DB_PORT=$TEST_DB_PORT
export DB_USER=$TEST_DB_USER
export DB_PASSWORD=$TEST_DB_PASSWORD
export DB_NAME=$TEST_DB_NAME
export DB_SSLMODE=disable

# Run tests
go test "$@"
