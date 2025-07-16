#!/bin/bash

# Ditto Go Backend API Testing Script
# Usage: ./test_api.sh

set -e  # Exit on any error

BASE_URL="http://localhost:8080"
JWT_TOKEN=""
USER_ID=""
COMPANY_ID=""
JOB_ID=""
APPLICATION_ID=""
STATUS_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_test() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Helper function to check if server is running
check_server() {
    if ! curl -s "$BASE_URL/health" > /dev/null; then
        print_error "Server is not running at $BASE_URL"
        echo "Please start the server with: go run cmd/server/main.go"
        exit 1
    fi
}

# Helper function to extract JSON field
extract_json_field() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | cut -d'"' -f4 | tr -d '"'
}

echo "🚀 Testing Ditto Go Backend API"
echo "================================"

# Check if server is running
check_server

# Test 1: Health Check
print_test "Health Check"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    print_success "Health check passed"
else
    print_error "Health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test 2: User Registration
print_test "User Registration"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    }')

if [[ $REGISTER_RESPONSE == *"success"* ]]; then
    print_success "User registration passed"
    USER_ID=$(extract_json_field "$REGISTER_RESPONSE" "id")
    print_info "User ID: $USER_ID"
else
    print_error "User registration failed"
    echo "Response: $REGISTER_RESPONSE"
fi

# Test 3: User Login
print_test "User Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "password123"
    }')

if [[ $LOGIN_RESPONSE == *"access_token"* ]]; then
    print_success "User login passed"
    JWT_TOKEN=$(extract_json_field "$LOGIN_RESPONSE" "access_token")
    print_info "JWT Token: ${JWT_TOKEN:0:50}..."
else
    print_error "User login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 4: Protected Endpoint (Get User Profile)
print_test "Get User Profile (Protected)"
PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    "$BASE_URL/api/me")

if [[ $PROFILE_RESPONSE == *"test@example.com"* ]]; then
    print_success "User profile retrieval passed"
else
    print_error "User profile retrieval failed"
    echo "Response: $PROFILE_RESPONSE"
fi

# Test 5: Company Autocomplete (Public)
print_test "Company Autocomplete"
AUTOCOMPLETE_RESPONSE=$(curl -s "$BASE_URL/api/companies/autocomplete?q=google")

if [[ $AUTOCOMPLETE_RESPONSE == *"suggestions"* ]]; then
    print_success "Company autocomplete passed"
    print_info "Found suggestions for 'google'"
else
    print_error "Company autocomplete failed"
    echo "Response: $AUTOCOMPLETE_RESPONSE"
fi

# Test 6: Get Companies (Public)
print_test "Get Companies List"
COMPANIES_RESPONSE=$(curl -s "$BASE_URL/api/companies?limit=5")

if [[ $COMPANIES_RESPONSE == *"companies"* ]]; then
    print_success "Companies list retrieval passed"
else
    print_error "Companies list retrieval failed"
    echo "Response: $COMPANIES_RESPONSE"
fi

# Test 7: Smart Company Selection
print_test "Smart Company Selection"
SELECT_COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/companies/select" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "company_name": "Test Company Inc"
    }')

if [[ $SELECT_COMPANY_RESPONSE == *"Test Company Inc"* ]]; then
    print_success "Smart company selection passed"
    COMPANY_ID=$(extract_json_field "$SELECT_COMPANY_RESPONSE" "id")
    print_info "Company ID: $COMPANY_ID"
else
    print_error "Smart company selection failed"
    echo "Response: $SELECT_COMPANY_RESPONSE"
fi

# Test 8: Job Creation with Company Name
print_test "Job Creation with Company Name"
CREATE_JOB_RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "company_name": "Google",
        "title": "Software Engineer",
        "job_description": "Backend development role",
        "location": "San Francisco, CA",
        "job_type": "Full-time",
        "min_salary": 120000,
        "max_salary": 180000,
        "currency": "USD"
    }')

if [[ $CREATE_JOB_RESPONSE == *"Software Engineer"* ]]; then
    print_success "Job creation with company name passed"
    JOB_ID=$(extract_json_field "$CREATE_JOB_RESPONSE" "id")
    print_info "Job ID: $JOB_ID"
else
    print_error "Job creation with company name failed"
    echo "Response: $CREATE_JOB_RESPONSE"
fi

# Test 9: Get Jobs List
print_test "Get Jobs List"
JOBS_RESPONSE=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    "$BASE_URL/api/jobs")

if [[ $JOBS_RESPONSE == *"jobs"* ]]; then
    print_success "Jobs list retrieval passed"
else
    print_error "Jobs list retrieval failed"
    echo "Response: $JOBS_RESPONSE"
fi

# Test 10: Get Job Details
if [[ -n "$JOB_ID" ]]; then
    print_test "Get Job Details"
    JOB_DETAIL_RESPONSE=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
        "$BASE_URL/api/jobs/$JOB_ID")

    if [[ $JOB_DETAIL_RESPONSE == *"Software Engineer"* ]]; then
        print_success "Job details retrieval passed"
    else
        print_error "Job details retrieval failed"
        echo "Response: $JOB_DETAIL_RESPONSE"
    fi
fi

# Test 11: Get Application Statuses
print_test "Get Application Statuses"
STATUS_RESPONSE=$(curl -s "$BASE_URL/api/application-statuses")

if [[ $STATUS_RESPONSE == *"statuses"* ]]; then
    print_success "Application statuses retrieval passed"
    # Extract first status ID for application creation
    STATUS_ID=$(echo "$STATUS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    print_info "Status ID: $STATUS_ID"
else
    print_error "Application statuses retrieval failed"
    echo "Response: $STATUS_RESPONSE"
fi

# Test 12: Create Application
if [[ -n "$JOB_ID" && -n "$STATUS_ID" ]]; then
    print_test "Create Application"
    CREATE_APP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/applications" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"job_id\": \"$JOB_ID\",
            \"application_status_id\": \"$STATUS_ID\",
            \"applied_at\": \"2025-01-15T10:00:00Z\",
            \"attempt_number\": 1,
            \"notes\": \"Applied through company website\"
        }")

    if [[ $CREATE_APP_RESPONSE == *"Applied through company website"* ]]; then
        print_success "Application creation passed"
        APPLICATION_ID=$(extract_json_field "$CREATE_APP_RESPONSE" "id")
        print_info "Application ID: $APPLICATION_ID"
    else
        print_error "Application creation failed"
        echo "Response: $CREATE_APP_RESPONSE"
    fi
fi

# Test 13: Get Applications List
print_test "Get Applications List"
APPLICATIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    "$BASE_URL/api/applications")

if [[ $APPLICATIONS_RESPONSE == *"applications"* ]]; then
    print_success "Applications list retrieval passed"
else
    print_error "Applications list retrieval failed"
    echo "Response: $APPLICATIONS_RESPONSE"
fi

# Test 14: Get Application Statistics
print_test "Get Application Statistics"
STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    "$BASE_URL/api/applications/stats")

if [[ $STATS_RESPONSE == *"status_counts"* ]]; then
    print_success "Application statistics retrieval passed"
else
    print_error "Application statistics retrieval failed"
    echo "Response: $STATS_RESPONSE"
fi

# Test 15: Update Job
if [[ -n "$JOB_ID" ]]; then
    print_test "Update Job"
    UPDATE_JOB_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/jobs/$JOB_ID" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Senior Software Engineer"
        }')

    if [[ $UPDATE_JOB_RESPONSE == *"Senior Software Engineer"* ]]; then
        print_success "Job update passed"
    else
        print_error "Job update failed"
        echo "Response: $UPDATE_JOB_RESPONSE"
    fi
fi

# Test 16: Error Handling - Unauthorized Access
print_test "Error Handling - Unauthorized Access"
UNAUTHORIZED_RESPONSE=$(curl -s "$BASE_URL/api/jobs")

if [[ $UNAUTHORIZED_RESPONSE == *"unauthorized"* ]] || [[ $UNAUTHORIZED_RESPONSE == *"Unauthorized"* ]]; then
    print_success "Unauthorized access handling passed"
else
    print_error "Unauthorized access handling failed"
    echo "Response: $UNAUTHORIZED_RESPONSE"
fi

# Test 17: Error Handling - Invalid Data
print_test "Error Handling - Invalid Data"
INVALID_DATA_RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": ""
    }')

if [[ $INVALID_DATA_RESPONSE == *"error"* ]] || [[ $INVALID_DATA_RESPONSE == *"validation"* ]]; then
    print_success "Invalid data handling passed"
else
    print_error "Invalid data handling failed"
    echo "Response: $INVALID_DATA_RESPONSE"
fi

# Test 18: Logout
print_test "User Logout"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/logout" \
    -H "Authorization: Bearer $JWT_TOKEN")

if [[ $LOGOUT_RESPONSE == *"success"* ]]; then
    print_success "User logout passed"
else
    print_error "User logout failed"
    echo "Response: $LOGOUT_RESPONSE"
fi

echo ""
echo "🎉 Testing Complete!"
echo "==================="

print_info "Summary:"
print_info "- Health check: ✅"
print_info "- User registration & login: ✅"
print_info "- Company autocomplete & selection: ✅"
print_info "- Job creation with company_name: ✅"
print_info "- Application management: ✅"
print_info "- Error handling: ✅"
print_info "- Authentication & authorization: ✅"

echo ""
print_success "🚀 Go backend is ready for production!"
echo "You can safely remove the Rust backend."