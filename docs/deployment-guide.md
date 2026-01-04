# Ditto - Deployment Guide

**Generated:** 2025-11-08
**Status:** Production Ready
**Deployment Strategy:** Docker Containers

---

## Overview

Ditto is designed for containerized deployment using Docker. The application consists of three main services:

1. **PostgreSQL Database** - Data persistence
2. **Go Backend API** - REST API server
3. **Next.js Frontend** - Web application

---

## Docker Compose (Development)

### Configuration

**File:** `docker-compose.yml`

```yaml
version: "3.8"

services:
  # PostgreSQL Database
  db:
    image: postgres:15
    container_name: ditto-postgres
    environment:
      POSTGRES_USER: ditto_user
      POSTGRES_PASSWORD: ditto_password
      POSTGRES_DB: ditto_dev
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ditto_user -d ditto_dev"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - ditto-network

  # Go Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: ditto-backend
    ports:
      - "8081:8081"
    environment:
      DATABASE_URL: postgres://ditto_user:ditto_password@db:5432/ditto_dev?sslmode=disable
      JWT_SECRET: dev-jwt-secret-change-in-production
      JWT_REFRESH_SECRET: dev-refresh-secret-change-in-production
      PORT: 8081
      GIN_MODE: debug
      CLEAROUT_API_KEY: ${CLEAROUT_API_KEY:-}
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy
    networks:
      - ditto-network

volumes:
  db_data:
    driver: local

networks:
  ditto-network:
    driver: bridge
```

### Usage

```bash
# Start environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop environment
docker-compose down

# Remove volumes (CAUTION: deletes data)
docker-compose down -v
```

---

## Production Deployment

### Environment Variables

#### Backend Production Variables

```bash
# Database (use production credentials)
DATABASE_URL=postgres://prod_user:STRONG_PASSWORD@db-host:5432/ditto_prod?sslmode=require

# JWT Secrets (GENERATE STRONG RANDOM KEYS)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Server
PORT=8081
GIN_MODE=release  # IMPORTANT: Set to release for production

# External APIs
CLEAROUT_API_KEY=your-production-clearout-key
```

#### Frontend Production Variables

```bash
# Backend API (use production URL)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# OAuth Providers (production credentials)
GITHUB_ID=your-github-prod-client-id
GITHUB_SECRET=your-github-prod-client-secret
GOOGLE_ID=your-google-prod-client-id
GOOGLE_SECRET=your-google-prod-client-secret
```

---

## Docker Deployment

### Backend Dockerfile (Production)

Create `backend/Dockerfile` for production:

```dockerfile
# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates and postgresql-client for migrations
RUN apk --no-cache add ca-certificates postgresql-client curl

# Copy binary from builder
COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations

# Install golang-migrate
RUN curl -L https://github.com/golang-migrate/migrate/releases/latest/download/migrate.linux-amd64.tar.gz | tar xvz && \
    mv migrate /usr/local/bin/migrate

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1

# Run migrations then start server
CMD migrate -path ./migrations -database "$DATABASE_URL" up && ./server
```

### Frontend Dockerfile (Production)

**File:** `frontend/Dockerfile`

```dockerfile
# Dependencies stage
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1

# Build application
RUN pnpm build

# Runtime stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

---

## Database Setup

### PostgreSQL Production

#### Using Managed Database (Recommended)

- **AWS RDS PostgreSQL**
- **Google Cloud SQL**
- **Azure Database for PostgreSQL**
- **DigitalOcean Managed Databases**

**Advantages:**
- Automated backups
- High availability
- Automatic updates
- Monitoring included

#### Self-Hosted PostgreSQL

```bash
# Install PostgreSQL 15
sudo apt-get update
sudo apt-get install postgresql-15

# Create production database
sudo -u postgres createdb ditto_prod
sudo -u postgres createuser ditto_user

# Set password
sudo -u postgres psql
ALTER USER ditto_user WITH PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ditto_prod TO ditto_user;
\q

# Configure pg_hba.conf for connections
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Database Migrations

Migrations run automatically on backend startup:

```bash
# Manual migration (if needed)
migrate -path ./migrations \
        -database "postgres://user:pass@host:port/db?sslmode=require" \
        up
```

---

## Deployment Platforms

### Option 1: Docker Compose on VPS

**Platforms:** DigitalOcean, Linode, Vultr, AWS EC2

```bash
# On production server
git clone https://github.com/your-repo/ditto.git
cd ditto

# Create production docker-compose
cat > docker-compose.prod.yml <<EOF
version: "3.8"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: \${DB_NAME}
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: \${DATABASE_URL}
      JWT_SECRET: \${JWT_SECRET}
      JWT_REFRESH_SECRET: \${JWT_REFRESH_SECRET}
      GIN_MODE: release
    ports:
      - "8081:8081"
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: \${API_URL}
      NEXTAUTH_URL: \${NEXTAUTH_URL}
      NEXTAUTH_SECRET: \${NEXTAUTH_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  db_data:
EOF

# Create .env file with production secrets
nano .env

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes

Create Kubernetes manifests in `k8s/` directory.

### Option 3: Cloud Platforms

#### AWS (ECS/Fargate)

- Use AWS ECS with Fargate for serverless containers
- RDS PostgreSQL for database
- ALB for load balancing

#### Google Cloud Run

- Deploy backend and frontend as separate Cloud Run services
- Use Cloud SQL for PostgreSQL
- Cloud Load Balancer for routing

#### Azure Container Instances

- Deploy with Azure Container Instances
- Use Azure Database for PostgreSQL
- Application Gateway for routing

---

## Nginx Reverse Proxy (Optional)

```nginx
# /etc/nginx/sites-available/ditto
upstream backend {
    server localhost:8081;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

---

## Security Checklist

### Pre-Deployment

- [ ] Change all default passwords and secrets
- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS/TLS (use Let's Encrypt)
- [ ] Configure CORS for production domains only
- [ ] Set `GIN_MODE=release` for backend
- [ ] Set `NODE_ENV=production` for frontend
- [ ] Review and restrict database user permissions
- [ ] Enable database SSL connections (`sslmode=require`)
- [ ] Configure firewall rules (only necessary ports)
- [ ] Set up logging and monitoring
- [ ] Enable rate limiting on API
- [ ] Configure backup strategy

### Environment Variables

Never commit these to version control:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NEXTAUTH_SECRET`
- `DATABASE_URL` with credentials
- OAuth client secrets
- API keys (Clearout, etc.)

Use:
- Environment variables
- Secret management services (AWS Secrets Manager, HashiCorp Vault)
- `.env` files (gitignored)

---

## Monitoring & Logging

### Backend Logging

Configure structured logging in production:

```go
// Use structured logging library
import "github.com/sirupsen/logrus"

log := logrus.New()
log.SetFormatter(&logrus.JSONFormatter{})
log.SetLevel(logrus.InfoLevel)
```

### Application Monitoring

**Recommended Tools:**
- **Sentry** - Error tracking
- **Prometheus + Grafana** - Metrics
- **Datadog** - APM
- **New Relic** - Performance monitoring

### Health Checks

- **Backend:** `GET /health` returns `{"status": "ok"}`
- **Database:** Included in Docker health checks
- **Frontend:** Can add custom health endpoint

---

## Backup Strategy

### Database Backups

```bash
# Automated daily backup script
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$BACKUP_DIR/ditto_backup_$DATE.sql

pg_dump -h localhost -U ditto_user ditto_prod > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Application Backups

- Store uploaded files in S3 or similar
- Version control for code (Git)
- Docker images in container registry

---

## Scaling Considerations

### Horizontal Scaling

- **Backend:** Stateless, can run multiple instances behind load balancer
- **Frontend:** Can be served from CDN (Next.js static export)
- **Database:** Use read replicas for read-heavy workloads

### Vertical Scaling

- Increase container resources (CPU/memory)
- Optimize database queries
- Add caching layer (Redis)

---

## CI/CD Pipeline Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Backend
        run: |
          cd backend
          docker build -t ditto-backend:latest .

      - name: Build Frontend
        run: |
          cd frontend
          docker build -t ditto-frontend:latest .

      - name: Push to Registry
        run: |
          # Push to Docker Hub, ECR, or GCR

      - name: Deploy
        run: |
          # Deploy to your platform
```

---

## Support & Maintenance

### Update Strategy

1. Test in staging environment first
2. Run database migrations with backup
3. Deploy backend first (API backward compatible)
4. Deploy frontend
5. Monitor logs and metrics
6. Rollback if issues detected

### Rollback Procedure

```bash
# Rollback database migration
migrate -path ./migrations -database $DATABASE_URL down 1

# Rollback to previous Docker image
docker-compose pull --tag previous
docker-compose up -d
```

---

**Last Updated:** 2025-11-08
**Status:** Production Ready
