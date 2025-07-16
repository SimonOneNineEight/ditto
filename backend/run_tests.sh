#!/bin/bash

# Ditto Backend Test Runner
# This script runs all tests for the Ditto Go backend

echo "🧪 Running Ditto Backend Tests"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL test database is available
echo -e "${YELLOW}Checking test database connection...${NC}"
if PGPASSWORD=test_password psql -h localhost -U ditto_test_user -d ditto_test -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Test database connection successful${NC}"
else
    echo -e "${RED}✗ Test database connection failed${NC}"
    echo "Please ensure:"
    echo "  1. PostgreSQL is running"
    echo "  2. Test database 'ditto_test' exists"
    echo "  3. Test user 'ditto_test_user' has permissions"
    echo ""
    echo "To set up the test database:"
    echo "  psql -d postgres -c \"CREATE DATABASE ditto_test;\""
    echo "  psql -d postgres -c \"CREATE USER ditto_test_user WITH PASSWORD 'test_password';\""
    echo "  psql -d postgres -c \"GRANT ALL PRIVILEGES ON DATABASE ditto_test TO ditto_test_user;\""
    echo "  psql -d ditto_test -c \"GRANT ALL ON SCHEMA public TO ditto_test_user;\""
    exit 1
fi

echo ""
echo -e "${YELLOW}Running repository tests...${NC}"
if go test ./internal/repository -v; then
    echo -e "${GREEN}✓ Repository tests passed${NC}"
else
    echo -e "${RED}✗ Repository tests failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Running all tests...${NC}"
if go test ./... -v; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
echo "Test coverage includes:"
echo "  - User repository (CRUD, authentication)"
echo "  - Company repository (CRUD, search, external API)"
echo "  - Job repository (CRUD, filtering, user-scoped)"
echo "  - Database transactions and error handling"
echo "  - Data validation and security"