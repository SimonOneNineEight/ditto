# Ditto - Development Guide

**Generated:** 2025-11-08
**Status:** Production Ready
**Environment:** Docker Compose (Recommended)

---

## Prerequisites

### Required

| Tool | Version | Purpose |
|------|---------|---------|
| **Docker** | Latest | Container runtime |
| **Docker Compose** | 3.8+ | Multi-container orchestration |

### Optional (for local development without Docker)

| Tool | Version | Purpose |
|------|---------|---------|
| **Go** | 1.23+ | Backend development |
| **Node.js** | 18+ | Frontend development |
| **pnpm** | Latest | Frontend package manager |
| **PostgreSQL** | 15+ | Database |
| **golang-migrate** | Latest | Database migrations |

---

## Quick Start (Docker - Recommended)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/ditto.git
cd ditto
```

### 2. Environment Setup

```bash
# Create environment file (optional, has sensible defaults)
cp .env.example .env

# Edit .env if needed (for production or custom config)
nano .env
```

### 3. Start Development Environment

```bash
# Start all services (PostgreSQL + Backend API)
docker-compose up -d

# View backend logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f db
```

### 4. Start Frontend (separate terminal)

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 5. Access Application

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8081
- **API Health Check:** http://localhost:8081/health
- **Database:** localhost:5432

---

## Manual Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Install Go dependencies
go mod download

# Set up environment variables
export DATABASE_URL="postgres://user:password@localhost/ditto_dev?sslmode=disable"
export JWT_SECRET="your-secret-key-change-in-production"
export JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"
export PORT="8081"

# Create database
createdb ditto_dev

# Run migrations
migrate -path migrations -database $DATABASE_URL up

# Start backend server
go run cmd/server/main.go

# OR use Air for hot reload
air
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Set up environment variables
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXTAUTH_URL=http://localhost:8080
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
EOF

# Start development server
pnpm dev

# OR build for production
pnpm build
pnpm start
```

---

## Development Workflow

### Backend Development

#### Hot Reload with Air

```bash
cd backend

# Start with hot reload (auto-restarts on code changes)
air

# Air configuration in .air.toml
```

#### Code Quality

```bash
# Format code
go fmt ./...

# Run linter
go vet ./...

# Check for common issues
golangci-lint run
```

#### Build

```bash
# Build for production
go build -o bin/server cmd/server/main.go

# Run production build
./bin/server
```

### Frontend Development

#### Development Server

```bash
cd frontend

# Start dev server (port 8080)
pnpm dev

# Start on different port
pnpm dev -p 3000
```

#### Code Quality

```bash
# Run ESLint
pnpm lint

# Format code with Prettier
pnpm format

# Type check
pnpm type-check
```

#### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm start

# Analyze bundle size
pnpm build --analyze
```

---

## Testing

### Backend Tests

#### Unit Tests (Repository Layer)

```bash
cd backend

# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run with verbose output
go test -v ./...

# Run specific package
go test ./internal/repository -v

# Run with coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

#### Test Database Setup

Tests use a separate test database:
- **Database:** `ditto_test`
- **User:** `ditto_test_user`
- **Auto-setup:** Tests automatically create and migrate DB
- **Isolation:** Each test runs with clean state

#### API Integration Tests

```bash
cd backend

# Run comprehensive API test suite
./test_api.sh

# Tests covered:
# - Health check
# - User registration
# - Login/logout
# - JWT token refresh
# - Company CRUD
# - Company autocomplete
# - Protected endpoints
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

---

## Database Management

### Migrations

#### Create New Migration

```bash
cd backend

# Create migration files
migrate create -ext sql -dir migrations -seq migration_name

# This creates:
# - migrations/NNNNNN_migration_name.up.sql
# - migrations/NNNNNN_migration_name.down.sql
```

#### Run Migrations

```bash
# Migrate up
migrate -path migrations -database $DATABASE_URL up

# Migrate down (rollback last migration)
migrate -path migrations -database $DATABASE_URL down 1

# Check migration version
migrate -path migrations -database $DATABASE_URL version

# Force version (if stuck)
migrate -path migrations -database $DATABASE_URL force VERSION
```

#### Docker Migrations

Migrations run automatically on container startup via `docker-entrypoint.sh`.

### Database Access

```bash
# Connect to Docker PostgreSQL
docker exec -it ditto-postgres psql -U ditto_user -d ditto_dev

# Connect to local PostgreSQL
psql -U ditto_user -d ditto_dev

# View tables
\dt

# Describe table
\d users

# View indexes
\di

# Exit
\q
```

### Database Backup

```bash
# Backup
docker exec ditto-postgres pg_dump -U ditto_user ditto_dev > backup.sql

# Restore
docker exec -i ditto-postgres psql -U ditto_user ditto_dev < backup.sql
```

---

## Docker Commands

### Basic Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f db

# Rebuild containers
docker-compose up -d --build

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v
```

### Container Management

```bash
# List running containers
docker ps

# Execute command in container
docker exec -it ditto-backend /bin/sh
docker exec -it ditto-postgres psql -U ditto_user

# View container resource usage
docker stats

# Prune unused containers/images
docker system prune
```

---

## Environment Variables

### Backend (.env or docker-compose.yml)

```bash
# Database
DATABASE_URL=postgres://user:password@host:port/database?sslmode=disable

# JWT Secrets (CHANGE IN PRODUCTION)
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server
PORT=8081
GIN_MODE=debug  # debug | release

# External APIs (Optional)
CLEAROUT_API_KEY=your-clearout-api-key
```

### Frontend (.env.local)

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8081

# NextAuth
NEXTAUTH_URL=http://localhost:8080
NEXTAUTH_SECRET=your-nextauth-secret-here

# OAuth Providers (if using)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
```

---

## Ports Reference

| Service | Port | Protocol |
|---------|------|----------|
| Frontend (dev) | 8080 | HTTP |
| Backend API | 8081 | HTTP |
| PostgreSQL | 5432 | PostgreSQL |

---

## Common Issues & Troubleshooting

### Backend Issues

#### Port Already in Use

```bash
# Find process using port 8081
lsof -i :8081

# Kill process
kill -9 <PID>
```

#### Migration Failed

```bash
# Check current version
migrate -path migrations -database $DATABASE_URL version

# Force to version
migrate -path migrations -database $DATABASE_URL force <VERSION>

# Retry migration
migrate -path migrations -database $DATABASE_URL up
```

#### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Frontend Issues

#### Dependencies Installation Failed

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Build Failed

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
pnpm build
```

#### Port Already in Use

```bash
# Kill process on port 8080
lsof -i :8080
kill -9 <PID>

# Or use different port
pnpm dev -p 3000
```

---

## Code Style & Conventions

### Backend (Go)

- **Formatting:** `go fmt` (automatic)
- **Linting:** `go vet` + `golangci-lint`
- **Naming:**
  - Exported: `PascalCase`
  - Unexported: `camelCase`
  - Packages: `lowercase`
- **Error Handling:** Always check errors, use custom error types
- **Comments:** Document exported functions

### Frontend (TypeScript/React)

- **Formatting:** Prettier (configured)
- **Linting:** ESLint + TypeScript
- **Naming:**
  - Components: `PascalCase`
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `kebab-case` or `PascalCase` for components
- **Imports:** Absolute paths with `@/` alias
- **Components:** Functional components with hooks

---

## Performance Tips

### Backend

- Use connection pooling (configured in `pkg/database`)
- Index foreign keys and frequently queried columns
- Use prepared statements (sqlx handles this)
- Implement pagination for large datasets
- Cache static data (application statuses)

### Frontend

- Use Next.js Image component for images
- Implement code splitting with dynamic imports
- Use React.memo() for expensive components
- Debounce search inputs
- Implement infinite scroll for long lists

---

## Next Steps

1. **Read Architecture Docs:** `docs/architecture-*.md`
2. **Review API Contracts:** `docs/api-contracts-backend.md`
3. **Understand Database Schema:** `docs/database-schema.md`
4. **Explore Components:** `docs/ui-component-inventory.md`

---

**Last Updated:** 2025-11-08
**Maintained By:** Ditto Development Team
