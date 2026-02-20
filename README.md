# Ditto

A job application tracking system that helps you manage applications, interviews, technical assessments, and preparation materials in one place.

## Features

- **Application Management** — Track job applications with status workflow, company details, and file attachments (resume, cover letter)
- **Interview Tracking** — Log interview rounds with interviewers, questions, notes, and self-assessments
- **Technical Assessments** — Track coding challenges and take-home assignments with submissions (GitHub links, file uploads, notes)
- **Dashboard & Timeline** — Overview statistics, upcoming events, and chronological activity view
- **Search & Export** — Full-text search across all entities, CSV export for applications and interviews
- **Notifications** — In-app notification center with configurable preferences
- **File Storage** — S3-backed file uploads with storage quota management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Go 1.23+ / Gin |
| Frontend | Next.js 14 / React 18 / TypeScript |
| Database | PostgreSQL 15+ |
| File Storage | AWS S3 |
| Auth | JWT + NextAuth v5 (GitHub, Google OAuth) |
| Styling | Tailwind CSS v4 / shadcn/ui |
| Testing | Go `testify` / Jest + React Testing Library |

## Prerequisites

- [Go](https://go.dev/) 1.23+
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/) 15+
- [golang-migrate](https://github.com/golang-migrate/migrate) CLI
- AWS S3 bucket (or [LocalStack](https://localstack.cloud/) for local dev)

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd ditto

# Backend
cd backend
go mod download

# Frontend
cd ../frontend
pnpm install
```

### 2. Set up PostgreSQL

Create development and test databases:

```bash
createdb ditto_dev
createdb ditto_test
```

Or use Docker:

```bash
docker-compose up -d db
```

### 3. Configure environment variables

**Backend** — create `backend/.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=ditto_user
DB_PASSWORD=ditto_password
DB_NAME=ditto_dev
DB_SSLMODE=disable

# Test database
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_USER=ditto_user
TEST_DB_PASSWORD=ditto_password
TEST_DB_NAME=ditto_test

# Auth
JWT_SECRET=your-jwt-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production

# Server
PORT=8081

# File storage (S3 or LocalStack)
AWS_REGION=us-east-1
AWS_S3_BUCKET=ditto-files-local
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ENDPOINT=http://localhost:4566   # LocalStack endpoint; omit for real S3
```

**Frontend** — create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8081

AUTH_SECRET=generate-with-npx-auth-secret
NEXTAUTH_URL=http://localhost:8080

# OAuth providers (optional)
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 4. Run database migrations

```bash
cd backend
migrate -path migrations -database "postgres://ditto_user:ditto_password@localhost:5432/ditto_dev?sslmode=disable" up
```

### 5. Start the application

```bash
# Terminal 1 — Backend (port 8081)
cd backend
go run cmd/server/main.go

# Terminal 2 — Frontend (port 8080)
cd frontend
pnpm dev
```

Open http://localhost:8080 to access the application.

### 6. Verify

```bash
# Health check
curl http://localhost:8081/health
# → {"data":{"status":"ok"}}
```

## Running Tests

### Backend

```bash
cd backend

# Run all tests
go test ./...

# Run with sequential execution (required when running handler + repo tests together)
go test -p 1 ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./internal/repository -v
go test ./internal/handlers -v
```

### Frontend

```bash
cd frontend

# Run all tests
pnpm test

# Run in watch mode
pnpm test -- --watch
```

## Project Structure

```
ditto/
├── backend/
│   ├── cmd/server/          # Application entrypoint
│   ├── internal/
│   │   ├── handlers/        # HTTP request handlers
│   │   ├── middleware/       # Auth, error handling, security
│   │   ├── models/          # Data structures
│   │   ├── repository/      # Database operations
│   │   ├── routes/          # Route registration
│   │   ├── services/        # Business logic (S3, notifications)
│   │   └── testutil/        # Test helpers and fixtures
│   ├── migrations/          # SQL migration files
│   └── pkg/                 # Shared packages (errors, response)
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities, API client, schemas
│   │   ├── providers/       # Context providers
│   │   └── types/           # TypeScript type definitions
│   └── __mocks__/           # Jest mocks
├── docs/                    # Detailed documentation
│   ├── api-contracts-backend.md
│   ├── architecture.md
│   ├── architecture-backend.md
│   ├── architecture-frontend.md
│   ├── database-schema.md
│   ├── deployment-guide.md
│   └── development-guide.md
└── docker-compose.yml
```

## Documentation

Detailed documentation lives in the [`/docs`](docs/) folder:

- [Architecture Overview](docs/architecture.md)
- [Backend Architecture](docs/architecture-backend.md)
- [Frontend Architecture](docs/architecture-frontend.md)
- [API Contracts](docs/api-contracts-backend.md)
- [Database Schema](docs/database-schema.md)
- [Development Guide](docs/development-guide.md)
- [Deployment Guide](docs/deployment-guide.md)

## License

MIT
