# Ditto: Your Job Application Assistant

Ditto is a modern web application designed to simplify and streamline the job application process. It provides intelligent job management, application tracking, and smart company selection with external API enrichment. With Ditto, you can reduce the repetitive work of managing job applications and focus on landing your dream job.

---

## Features

### Implemented

- **Smart Job Management**
  - Create and manage job listings with intelligent company selection
  - User-specific job tracking with full CRUD operations
  - Advanced filtering and pagination
- **Application Tracking**
  - Keep track of where you've applied, interview progress, and application outcomes
  - Status management with analytics and statistics
  - Timeline tracking and notes
- **Modern Authentication**
  - JWT-based authentication with refresh tokens
  - Secure user registration and login system

### Coming Soon

- **Document Storage and Management**
  - Save and manage customized resumes and cover letters for future applications

---

## Tech Stack

### Frontend

- **Next.js** (React-based framework for server-rendered and static websites)
- **TypeScript** (Type-safe development)
- **Tailwind CSS** (Utility-first CSS framework for styling)
- **shadcn/ui** (Modern component library)

### Backend

- **Go** (High-performance programming language)
- **Gin** (Web framework for building APIs in Go)
- **PostgreSQL** (Relational database for storing application and job data)
- **JWT** (JSON Web Token authentication)
- **sqlx** (SQL toolkit and query builder)

### External APIs

- **Clearout API** (Company data enrichment and validation)

### Deployment

- **Docker** (Containerization for consistent development and deployment)
- **Docker Compose** (Multi-container orchestration)

---

## Installation and Setup

### Prerequisites

- **Go 1.21+** (for backend development)
- **Node.js 18+** (for frontend development)
- **PostgreSQL 14+** (database)
- **Docker & Docker Compose** (recommended for easy setup)

### Option 1: Docker Setup (Recommended)

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/ditto.git
   cd ditto
   ```

2. **Environment Configuration**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your configuration
   # Basic setup works out of the box for development
   ```

3. **Start with Docker Compose**

   ```bash
   # Start all services (database + backend)
   docker-compose up -d

   # View logs
   docker-compose logs -f backend

   # Stop services
   docker-compose down
   ```

4. **Access the Application**
   - **Backend API**: http://localhost:8081
   - **Health Check**: http://localhost:8081/health
   - **API Documentation**: See backend/README.md

### Option 2: Manual Setup

1. **Setup the Backend**

   ```bash
   cd backend

   # Install Go dependencies
   go mod download

   # Set up environment variables
   export DATABASE_URL="postgres://user:password@localhost/ditto_dev?sslmode=disable"
   export JWT_SECRET="your-jwt-secret"
   export JWT_REFRESH_SECRET="your-refresh-secret"

   # Run database migrations
   migrate -path migrations -database $DATABASE_URL up

   # Start the backend server
   go run cmd/server/main.go
   ```

2. **Setup the Frontend**

   ```bash
   cd frontend

   # Install dependencies
   npm install

   # Set up environment variables
   echo "NEXT_PUBLIC_API_URL=http://localhost:8081" > .env.local

   # Start the development server
   npm run dev
   ```

---

## Project Structure

```
ditto/
├── backend/                 # Go backend (Gin + PostgreSQL)
│   ├── cmd/server/         # Application entrypoint
│   ├── internal/           # Core business logic
│   │   ├── handlers/       # HTTP request handlers
│   │   ├── middleware/     # Authentication, error handling
│   │   ├── models/         # Data structures
│   │   ├── repository/     # Database operations
│   │   └── routes/         # Route registration
│   ├── migrations/         # Database migrations
│   ├── pkg/               # Shared packages
│   └── test_api.sh        # API testing script
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # Reusable components
│   │   ├── lib/          # Utilities and configurations
│   │   └── services/     # API client services
│   └── package.json
├── docker-compose.yml   # Development environment
└── README.md            # This file
```

---

## Quick Start Guide

1. **Clone and Setup**

   ```bash
   git clone https://github.com/your-username/ditto.git
   cd ditto
   docker-compose up -d
   ```

2. **Create an Account**

   ```bash
   curl -X POST http://localhost:8081/api/users \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
   ```

3. **Login and Get Token**

   ```bash
   curl -X POST http://localhost:8081/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"password123"}'
   ```

4. **Create Your First Job**
   ```bash
   curl -X POST http://localhost:8081/api/jobs \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"company_name":"Google","title":"Software Engineer","job_description":"Backend development","location":"San Francisco","job_type":"Full-time"}'
   ```

---

## API Usage

The backend provides a comprehensive REST API for managing jobs, applications, and companies. Key endpoints include:

### Authentication

- `POST /api/users` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/me` - Get user profile

### Jobs (Protected)

- `GET /api/jobs` - List user's jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Companies

- `GET /api/companies/autocomplete?q=query` - Smart company search
- `POST /api/companies/select` - Create or select company

### Applications (Protected)

- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `PATCH /api/applications/:id/status` - Update status

For detailed API documentation, see [backend/README.md](backend/README.md).

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific test suite
go test ./internal/repository -v
```

### API Testing

```bash
cd backend

# Run comprehensive API tests
./test_api.sh
```

### Frontend Tests

```bash
cd frontend

# Run frontend tests
npm test

# Run with coverage
npm run test:coverage
```

---

## Development

### Backend Development

```bash
cd backend

# Run with hot reload (if using air)
air

# Format code
go fmt ./...

# Run linter
go vet ./...

# Build for production
go build -o bin/server cmd/server/main.go
```

### Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

---

## Roadmap

- [x] **Backend Migration** - Complete Go backend with full feature parity
- [x] **Authentication System** - JWT-based auth with refresh tokens
- [x] **Job Management** - CRUD operations with smart company selection
- [x] **Application Tracking** - Status management and analytics
- [x] **Company Intelligence** - External API enrichment and autocomplete
- [x] **Docker Development** - Complete containerized development environment
- [x] **Testing Infrastructure** - Comprehensive test suite
- [ ] **Document Management** - Storage for generated documents
- [ ] **Analytics Dashboard** - Application success metrics
- [ ] **Mobile App** - React Native mobile application
- [ ] **Email Notifications** - Application deadline reminders

---

## Contributing

We welcome contributions to Ditto! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Backend**: Follow Go best practices and include tests
- **Frontend**: Use TypeScript and follow React conventions
- **Database**: Include migrations for schema changes
- **Documentation**: Update README and API docs for new features

---

## License

Ditto is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

Ditto leverages modern web development tools and external APIs to deliver a seamless experience. Special thanks to:

- **Go Community** for the excellent ecosystem
- **Gin Framework** for the fast HTTP router
- **PostgreSQL** for reliable data storage
- **Clearout API** for company data enrichment
- **shadcn/ui** for beautiful UI components
- All open-source libraries that make this project possible

---

**Last Updated**: January 2025
