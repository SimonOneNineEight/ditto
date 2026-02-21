# ditto - Technical Specification

**Author:** Simon
**Date:** 2026-02-20
**Project Level:** 1 (Coherent Feature — Multiple Related Infrastructure Changes)
**Change Type:** Infrastructure & Deployment
**Development Context:** Brownfield — MVP feature-complete, production deployment pending

---

## Context

### Available Documents

| Document | Location | Key Insights |
|----------|----------|--------------|
| PRD | docs/planning/PRD.md | Complete MVP requirements, NFR-7 defines deployment/monitoring/backup requirements |
| Epics | docs/planning/epics.md | 6 epics (47 stories) — all complete |
| Sprint Status | docs/planning/sprint-status.yaml | All stories through Epic 6 marked done |
| Epic 6 Retrospective | docs/planning/retrospectives/epic-6-retro-2026-02-20.md | Decision: Epic 7 for CI/CD + deployment. Platform comparison table. Action items. |

### Project Stack

**Backend (Go):**
- Go 1.24.0 (toolchain go1.24.4)
- Gin v1.10.1 (HTTP framework)
- PostgreSQL 15 (via sqlx v1.4.0, lib/pq v1.10.9)
- golang-migrate v4.18.3 (database migrations)
- AWS S3 SDK v2 (file storage)
- golang-jwt/jwt v5.2.2 (authentication)
- go-playground/validator v10.26.0 (input validation)
- bluemonday v1.0.27 (HTML sanitization)
- gin-contrib/gzip v1.2.3 (compression)
- gin-contrib/cors v1.7.6 (CORS)
- testify v1.10.0 (testing)

**Frontend (Next.js):**
- Next.js 14.2.15
- React 18 + TypeScript 5
- Radix UI / shadcn/ui component library
- TipTap v3.17.1 (rich text editor)
- react-hook-form v7.54.2 + zod v3.24.2 (forms/validation)
- axios v1.7.9 (HTTP client)
- @tanstack/react-table v8.20.5
- Jest 30.2.0 + React Testing Library v16.3.2 (testing)
- Tailwind CSS 4.x + tailwindcss-animate
- pnpm (package manager)

**Scrape Service (Python):**
- Python 3.12 + FastAPI (uvicorn)
- Port 8082

**Current Dev Infrastructure:**
- Docker Compose: PostgreSQL 15, Go backend (dev mode), scrape-service
- Frontend runs standalone via `pnpm run dev` on port 8080
- Backend on port 8081
- No production Dockerfiles (only Dockerfile.dev for backend, dev CMD for frontend)

### Existing Codebase Structure

**Backend (Go — layered architecture):**
- `cmd/server/main.go` — entry point
- `internal/` — application logic (handlers, repositories, middleware)
- `pkg/` — shared packages (errors, etc.)
- `migrations/` — PostgreSQL migrations (golang-migrate)
- `scripts/` — utility scripts
- `Dockerfile.dev` — development-only container

**Frontend (Next.js — pages/components):**
- Standard Next.js 14 project structure
- `Dockerfile` — dev-only (runs `pnpm run dev`)

**Services:**
- `services/scrape-service/` — Python FastAPI URL scraper

**Docker Compose (docker-compose.yml):**
- 3 services: db (postgres:15), backend (Go), network bridge
- Frontend NOT in compose (runs standalone)
- Scrape service NOT in compose currently
- Dev secrets hardcoded in compose environment
- Volume mounts for hot-reload development

---

## The Change

### Problem Statement

Ditto's MVP is feature-complete across 6 epics (47 stories) with excellent performance (LCP ~125ms, API p90 <5ms), comprehensive security (defense-in-depth), WCAG AA accessibility, and verified documentation. However, the application cannot be used by anyone because **no production infrastructure exists**. There are no production container images, no CI/CD pipeline, no deployment platform, no real file storage, no database backup strategy, and no HTTPS configuration. This has been deferred across two consecutive epics and is now the single remaining gate to launch.

The application is intended for **multi-user** use — not just Simon's personal tool — which requires proper infrastructure: real HTTPS, secure secrets management, reliable uptime, real S3-compatible file storage, and automated database backups.

**Budget constraint:** <$10/month total infrastructure cost, serving users across the United States.

### Proposed Solution

Create a single focused epic (Epic 7) that takes Ditto from "runs on localhost" to "deployed and accessible on the internet" with automated CI/CD, production-grade configuration, database backups, and real file storage. The epic is structured as 3 stories that build on each other sequentially:

1. **Story 7.1: Production Dockerfiles, Environment Configuration & Platform Decision** — Create production-optimized container images for all services, externalize all configuration via environment variables, research and decide on deployment platform, and establish secrets management patterns.

2. **Story 7.2: CI/CD Pipeline & Automated Deployment** — Build a GitHub Actions pipeline that lints, tests, builds, and deploys on push to main. Includes automated database migration execution and deployment verification.

3. **Story 7.3: Production Launch — DNS, HTTPS, Backup & Monitoring** — Connect the domain, configure HTTPS/TLS, set up automated database backups, configure real S3-compatible file storage, and perform first production deployment with smoke testing.

### Scope

**In Scope:**

- Production-optimized multi-stage Dockerfiles for backend, frontend, and scrape-service
- Environment variable externalization and secrets management
- Deployment platform research, comparison, and decision
- GitHub Actions CI/CD pipeline (lint, test, build, deploy)
- Automated database migration execution in CI/CD
- DNS configuration and HTTPS/TLS setup
- Automated daily PostgreSQL backups with 7-day retention
- Production S3-compatible file storage setup (replacing LocalStack)
- Production environment variables (GIN_MODE=release, real JWT secrets, production DB)
- Basic health check endpoints and uptime monitoring
- First production deployment with smoke testing
- docker-compose.prod.yml for production orchestration

**Out of Scope:**

- Horizontal scaling or load balancing (single-instance sufficient for initial multi-user load)
- CDN configuration (premature optimization for current scale)
- Advanced monitoring/alerting (Datadog, Sentry, etc.) — revisit post-launch based on need
- Blue-green or canary deployment strategies
- Kubernetes or container orchestration beyond Docker Compose
- Email delivery (no transactional email in MVP)
- Log aggregation services (server logs sufficient initially)
- Automated SSL certificate management beyond initial setup
- Custom error pages or maintenance mode pages
- Performance load testing infrastructure

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/Dockerfile` | CREATE | Production multi-stage Dockerfile (build + minimal runtime) |
| `backend/Dockerfile.dev` | KEEP | Existing dev Dockerfile unchanged |
| `frontend/Dockerfile` | MODIFY | Replace dev-only Dockerfile with production multi-stage build |
| `frontend/Dockerfile.dev` | CREATE | Move current dev Dockerfile content here |
| `services/scrape-service/Dockerfile` | MODIFY | Add multi-stage build, health check, non-root user |
| `docker-compose.yml` | KEEP | Existing dev compose unchanged |
| `docker-compose.prod.yml` | CREATE | Production compose with all services, Caddy reverse proxy, proper networking |
| `Caddyfile` | CREATE | Reverse proxy config with automatic HTTPS |
| `.env.example` | CREATE | Template with all required environment variables documented |
| `backend/.env.example` | CREATE | Backend-specific env var template |
| `frontend/.env.example` | CREATE | Frontend-specific env var template |
| `.github/workflows/ci.yml` | CREATE | CI pipeline: lint, test on all PRs and pushes |
| `.github/workflows/deploy.yml` | CREATE | CD pipeline: build, push images, deploy on push to main |
| `scripts/backup-db.sh` | CREATE | PostgreSQL backup script with S3 upload and 7-day retention |
| `scripts/restore-db.sh` | CREATE | Database restore script |
| `scripts/smoke-test.sh` | CREATE | Post-deployment verification script |
| `backend/cmd/server/main.go` | MODIFY | Update CORS to accept production domain, improve graceful shutdown |
| `backend/internal/config/database.go` | MODIFY | Add connection pool tuning for production (max open/idle conns, timeouts) |

### Technical Approach

**Production Dockerfiles — Multi-Stage Builds:**

All Dockerfiles use multi-stage builds to minimize image size and attack surface:

- **Backend (Go):** Build stage compiles static binary with CGO_DISABLED=1. Runtime stage uses `alpine:3.20` (~5MB base) with only the binary, migrations, and `golang-migrate` CLI. Runs as non-root user. Final image ~20-30MB.
- **Frontend (Next.js):** Build stage runs `pnpm build` to produce Next.js standalone output. Runtime stage uses `node:20-alpine` with only the standalone build output. Final image ~100-150MB.
- **Scrape Service (Python):** Build stage installs dependencies. Runtime stage uses `python:3.12-slim` with only installed packages and app code. Runs as non-root user.

**Reverse Proxy — Caddy:**

Caddy serves as the single entry point for all traffic:
- Automatic HTTPS via Let's Encrypt (zero-config TLS)
- Reverse proxies to backend (:8081), frontend (:3000 in production), and scrape-service (:8082)
- Handles GZIP compression at the edge
- Adds security headers
- Static file serving for Next.js assets
- Budget-friendly: free, open-source, single binary

**CI/CD — GitHub Actions:**

Two workflows:
1. **ci.yml** — Runs on every PR and push: Go lint (`golangci-lint`), Go tests, frontend lint (`next lint`), frontend tests (`pnpm test`), Docker build verification
2. **deploy.yml** — Runs on push to main only: builds production Docker images, pushes to GitHub Container Registry (GHCR), SSHs into production server, pulls new images, runs migrations, restarts services via `docker compose`

**Database Backups — pg_dump + S3:**

Daily cron job on the production host:
- `pg_dump` compressed with gzip
- Upload to S3-compatible storage (same bucket, `/backups/` prefix)
- Delete backups older than 7 days
- Log backup success/failure

**Platform Decision Framework:**

Story 7.1 includes a structured evaluation of deployment platforms. The tech-spec provides evaluation criteria and a comparison matrix, but the final decision is made during story execution with user input.

**Evaluation criteria (weighted):**
1. Monthly cost (must be <$10 total) — weight: HIGH
2. Setup complexity — weight: MEDIUM
3. PostgreSQL availability (managed vs self-hosted) — weight: MEDIUM
4. Backup ease — weight: MEDIUM
5. SSH/debugging access — weight: LOW
6. US region availability — weight: REQUIRED

**Candidate platforms (from Epic 6 retro):**

| Platform | Est. Cost | PostgreSQL | Backup | Setup | US Region |
|----------|-----------|------------|--------|-------|-----------|
| Hetzner Cloud (Ashburn) | ~$5-7/mo (CX22: 2vCPU, 4GB) | Self-managed in Docker | pg_dump + S3 cron | Medium (SSH + Docker) | Ashburn, VA |
| Fly.io | ~$0-7/mo (free tier + Postgres) | Fly Postgres ($0 dev, $7 prod) | Fly snapshots | Low-Medium (flyctl) | Multiple US |
| Railway | ~$5-10/mo (hobby plan) | Built-in ($5/mo) | Automatic | Low (git push) | US-West |
| Render | ~$0-7/mo (free web + $7 DB) | Managed ($7/mo) | Automatic | Low (git push) | Oregon |

**S3-Compatible File Storage:**

The backend already uses AWS S3 SDK v2 — any S3-compatible service works without code changes. Options evaluated during Story 7.3:

| Service | Free Tier | Cost After | Egress |
|---------|-----------|------------|--------|
| Cloudflare R2 | 10GB storage, 1M requests | $0.015/GB | Free |
| Backblaze B2 | 10GB storage | $0.005/GB | $0.01/GB |
| AWS S3 | 5GB (12 months) | $0.023/GB | $0.09/GB |
| MinIO (self-hosted) | Unlimited (uses host disk) | $0 (host disk) | N/A |

Cloudflare R2 is the strongest candidate: free egress, generous free tier, S3-compatible API, and well within budget.

### Existing Patterns to Follow

**Backend (Go) conventions — MUST conform:**
- Layered architecture: handler → service → repository → database
- `os.Getenv()` with `getEnv(key, default)` helper for configuration
- `godotenv.Load()` at startup (graceful failure if no .env file — production uses real env vars)
- `DATABASE_URL` takes precedence over individual DB_* variables
- `GIN_MODE` already controls HSTS header behavior in `security_headers.go`
- Graceful shutdown via signal handling (SIGINT, SIGTERM) already implemented in main.go
- Health check endpoint already exists: `GET /health` → `{"status": "ok"}`

**Frontend (Next.js) conventions:**
- `NEXT_PUBLIC_API_URL` env var for backend URL
- `AUTH_SECRET` and `NEXTAUTH_URL` for auth configuration
- pnpm as package manager (not npm)
- `next lint` for linting, `pnpm test` for Jest

**Docker conventions:**
- Alpine-based images for minimal size
- PostgreSQL healthcheck pattern already established in docker-compose.yml
- `docker-entrypoint.sh` pattern for backend startup (wait for DB → run migrations → start server)

### Integration Points

| Integration | Current (Dev) | Production Target |
|-------------|---------------|-------------------|
| PostgreSQL | Docker container on localhost:5432 | Docker container on production host (same compose) or managed service |
| File Storage (S3) | LocalStack on localhost | Cloudflare R2 or equivalent S3-compatible service |
| Frontend → Backend | localhost:8081 | Caddy reverse proxy: `/api/*` → backend:8081 |
| Frontend → Auth | localhost:8080 (NextAuth) | Production domain with HTTPS |
| OAuth (GitHub, Google) | Localhost callback URLs | Production domain callback URLs |
| DNS | None | Domain → production host IP |
| TLS/HTTPS | None | Caddy automatic Let's Encrypt |
| Scrape Service | localhost:8082 | Internal Docker network (not publicly exposed) |

**Critical integration change:** OAuth callback URLs (GitHub, Google) must be updated to point to the production domain. This is a manual step in each OAuth provider's developer console.

---

## Development Context

### Relevant Existing Code

| File | Relevance |
|------|-----------|
| `backend/cmd/server/main.go` | Entry point — CORS origins need production domain added, health check already exists |
| `backend/internal/config/database.go` | `DATABASE_URL` handling and `getEnv()` helper — pattern to follow for all env vars |
| `backend/internal/middleware/security_headers.go` | Already checks `GIN_MODE=release` for HSTS — production-aware |
| `backend/internal/services/s3_service.go` | AWS S3 SDK usage — reads `AWS_*` env vars, works with any S3-compatible endpoint |
| `backend/internal/utils/state.go` | AppState initialization — creates DB connection, runs migrations on startup |
| `backend/docker-entrypoint.sh` | Dev startup script — wait for DB, migrate, start — pattern to adapt for production |
| `docker-compose.yml` | Dev compose — reference for production compose structure |
| `backend/Dockerfile.dev` | Dev Dockerfile — reference for build patterns |
| `frontend/Dockerfile` | Dev Dockerfile — needs production replacement |

### Dependencies

**Framework/Libraries (no new dependencies required):**

All infrastructure work uses existing dependencies. No new Go modules, npm packages, or Python packages needed.

- Docker (existing)
- Docker Compose (existing)
- GitHub Actions (new — no local dependency)
- Caddy (new — Docker image `caddy:2-alpine`)
- golang-migrate CLI (existing — already in Dockerfile.dev)

**Internal Modules:**
- `backend/internal/config/` — configuration pattern to extend
- `backend/internal/middleware/security_headers.go` — already production-aware
- `backend/pkg/database/` — DB connection and migration runner

### Configuration Changes

**New environment variables required for production:**

```
# Production Database
DATABASE_URL=postgres://user:password@db:5432/ditto_prod?sslmode=require

# Production JWT (generate strong random secrets)
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>

# Production Server
PORT=8081
GIN_MODE=release

# Production S3 (Cloudflare R2 or equivalent)
AWS_REGION=auto
AWS_S3_BUCKET=ditto-files
AWS_ACCESS_KEY_ID=<r2-access-key>
AWS_SECRET_ACCESS_KEY=<r2-secret-key>
AWS_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Production Frontend
NEXT_PUBLIC_API_URL=https://yourdomain.com
AUTH_SECRET=<64-char-random-string>
NEXTAUTH_URL=https://yourdomain.com

# OAuth (update callback URLs in provider consoles)
AUTH_GITHUB_ID=<production-github-oauth-id>
AUTH_GITHUB_SECRET=<production-github-oauth-secret>
AUTH_GOOGLE_ID=<production-google-oauth-id>
AUTH_GOOGLE_SECRET=<production-google-oauth-secret>

# Backup
BACKUP_S3_BUCKET=ditto-backups
BACKUP_RETENTION_DAYS=7
```

**CORS update in main.go:**
Add production domain to allowed origins list alongside existing localhost entries.

### Existing Conventions (Brownfield)

| Convention | Current Pattern | Production Conformance |
|------------|----------------|----------------------|
| Env vars | `os.Getenv()` + `getEnv(key, default)` via godotenv | Same pattern — godotenv skips gracefully when no .env file exists |
| DB connection | `DATABASE_URL` env var (full connection string) | Same pattern — set in production compose environment |
| Migrations | Run on startup via `pkg/database` | Same — backend entrypoint runs migrations before serving |
| Health checks | `GET /health` → `{"status": "ok"}` | Existing endpoint used by Docker healthcheck and monitoring |
| Security headers | HSTS enabled when `GIN_MODE=release` | Already production-aware — no changes needed |
| File storage | AWS S3 SDK v2 with `AWS_*` env vars | Point env vars at production S3-compatible endpoint |
| Graceful shutdown | SIGINT/SIGTERM handling in main.go | Already implemented — Docker stop sends SIGTERM |

### Test Framework & Standards

**Backend (Go):**
- Test framework: Go testing package + testify v1.10.0
- Test command: `go test ./...`
- Coverage: `go test -cover ./...` (72% repository coverage achieved)
- Test DB: separate `ditto_test` database
- Pattern: table-driven tests, testutil package for DB helpers

**Frontend (Next.js):**
- Test framework: Jest 30.2.0 + React Testing Library v16.3.2
- Test command: `pnpm test`
- 122 tests across 13 suites
- SWC for fast test compilation

**CI pipeline must run both test suites and fail the build on any failure.**

---

## Implementation Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Container Runtime | Docker | Latest | Container execution |
| Container Orchestration | Docker Compose | v2 | Multi-service orchestration |
| Reverse Proxy | Caddy | 2.x (Alpine image) | HTTPS, routing, compression |
| CI/CD | GitHub Actions | N/A | Automated testing and deployment |
| Container Registry | GitHub Container Registry (GHCR) | N/A | Docker image storage (free for public repos) |
| Database Backup | pg_dump + cron | PostgreSQL 15 client | Daily compressed backups |
| File Storage | S3-compatible (decision in Story 7.3) | AWS SDK v2 compatible | Production file storage |
| TLS Certificates | Let's Encrypt (via Caddy) | N/A | Automatic HTTPS |
| DNS | Provider TBD (decision in Story 7.3) | N/A | Domain → IP resolution |

---

## Technical Details

### Production Docker Architecture

```
                    ┌─────────────────────────┐
                    │      Internet / DNS      │
                    └────────────┬────────────┘
                                 │ :443 (HTTPS)
                    ┌────────────▼────────────┐
                    │    Caddy (reverse proxy) │
                    │  - Auto HTTPS/TLS       │
                    │  - Route: / → frontend   │
                    │  - Route: /api → backend │
                    └──┬─────────┬─────────┬──┘
                       │         │         │
            ┌──────────▼──┐ ┌───▼───────┐ │
            │  Frontend   │ │  Backend  │ │
            │  Next.js    │ │  Go/Gin   │ │
            │  :3000      │ │  :8081    │ │
            └─────────────┘ └───┬───┬───┘ │
                                │   │     │
                         ┌──────▼┐ ┌▼─────▼────────┐
                         │  DB   │ │ Scrape Service │
                         │ PG 15 │ │ Python/FastAPI │
                         │ :5432 │ │ :8082          │
                         └───────┘ └────────────────┘
```

All services run on a single Docker Compose host. Caddy is the only publicly exposed port (:443). All internal services communicate via Docker network.

### Multi-Stage Dockerfile Strategy

**Backend (Go) — target ~25MB image:**
```
Stage 1 (build): golang:1.24-alpine
  → Copy source, download deps, compile static binary
  → CGO_ENABLED=0 for fully static build
  → Copy golang-migrate binary

Stage 2 (runtime): alpine:3.20
  → Copy binary + migrations + migrate CLI only
  → Add non-root user
  → HEALTHCHECK using /health endpoint
  → ENTRYPOINT: run migrations then start server
```

**Frontend (Next.js) — target ~150MB image:**
```
Stage 1 (deps): node:20-alpine
  → Install pnpm, copy package files, install deps

Stage 2 (build): node:20-alpine
  → Copy source + deps, run `next build`
  → Use `output: 'standalone'` in next.config.mjs

Stage 3 (runtime): node:20-alpine
  → Copy standalone output only
  → Add non-root user
  → CMD: node server.js
```

**Next.js standalone output** requires adding `output: 'standalone'` to `next.config.mjs`. This produces a self-contained server that doesn't need `node_modules` at runtime, significantly reducing image size.

### CI/CD Pipeline Design

**ci.yml (every PR and push):**
```
Trigger: pull_request, push to any branch

Jobs (parallel):
├── backend-lint:
│   └── golangci-lint run
├── backend-test:
│   ├── Start PostgreSQL service container
│   ├── Run migrations
│   └── go test ./... -race -cover
├── frontend-lint:
│   └── pnpm lint
├── frontend-test:
│   └── pnpm test -- --ci
└── docker-build:
    ├── Build backend image (verify it compiles)
    ├── Build frontend image
    └── Build scrape-service image
```

**deploy.yml (push to main only):**
```
Trigger: push to main (after CI passes)

Jobs (sequential):
1. build-and-push:
   ├── Build all 3 production images
   └── Push to GHCR (ghcr.io/simon198/ditto-*)

2. deploy:
   ├── SSH into production host
   ├── Pull latest images
   ├── docker compose -f docker-compose.prod.yml up -d
   └── Run smoke test (scripts/smoke-test.sh)
```

### Backup Strategy

**Daily automated backup:**
- Cron job on production host at 02:00 UTC
- `pg_dump --format=custom --compress=9` for maximum compression
- Upload to S3-compatible storage: `s3://ditto-backups/db/ditto-YYYY-MM-DD.dump`
- Delete backups older than 7 days
- Log to stdout (captured by Docker logs)

**Restore procedure (documented in scripts/restore-db.sh):**
1. Download backup from S3
2. Stop backend service
3. `pg_restore --clean --if-exists` into database
4. Restart backend service

### Security Considerations

- All secrets stored as GitHub Actions secrets (for CI/CD) and as env vars on the production host (not in compose files or repo)
- Docker images run as non-root users
- Only Caddy port (443/80) exposed to internet; all other services on internal Docker network
- PostgreSQL not exposed externally
- Production JWT secrets are 64+ character random strings (not the dev defaults)
- Caddy handles TLS termination — backend receives plain HTTP internally
- CORS restricted to production domain only (plus localhost for dev)

---

## Development Setup

Existing development setup is **unchanged** — all Epic 7 work creates new files alongside existing dev configuration.

**Local development (unchanged):**
```bash
# Start database
docker compose up -d db

# Start backend
cd backend && go run cmd/server/main.go

# Start frontend
cd frontend && pnpm run dev

# Run tests
cd backend && go test ./...
cd frontend && pnpm test
```

**Testing production builds locally (new):**
```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Run production stack locally (uses .env file)
docker compose -f docker-compose.prod.yml up

# Verify at https://localhost (Caddy with self-signed cert locally)
```

---

## Implementation Guide

### Setup Steps

1. Create a feature branch: `git checkout -b epic-7/cicd-deployment`
2. Verify dev environment is working: `docker compose up -d db` + backend + frontend
3. Review existing Dockerfiles and docker-compose.yml
4. Review backend env var reading patterns in `internal/config/database.go`

### Implementation Steps

**Story 7.1: Production Dockerfiles & Environment Configuration**

1. Create `backend/Dockerfile` — production multi-stage build
2. Add `output: 'standalone'` to `frontend/next.config.mjs`
3. Replace `frontend/Dockerfile` with production multi-stage build, move current content to `frontend/Dockerfile.dev`
4. Update `services/scrape-service/Dockerfile` with multi-stage build, non-root user, health check
5. Create `docker-compose.prod.yml` with all services + Caddy
6. Create `Caddyfile` with reverse proxy configuration
7. Create `.env.example`, `backend/.env.example`, `frontend/.env.example`
8. Update `backend/cmd/server/main.go` — add production domain to CORS allowed origins (configurable via `CORS_ORIGINS` env var)
9. Update `backend/internal/config/database.go` — add connection pool settings for production
10. Evaluate deployment platforms, document decision with rationale
11. Verify all production images build and compose stack starts locally

**Story 7.2: CI/CD Pipeline**

1. Create `.github/workflows/ci.yml` — lint + test on PRs
2. Create `.github/workflows/deploy.yml` — build, push to GHCR, deploy via SSH
3. Configure GitHub Actions secrets (SSH key, production host, env vars)
4. Create `scripts/smoke-test.sh` — verify /health, frontend loads, API responds
5. Test CI pipeline on a PR
6. Test deploy pipeline with push to main (to staging or production)

**Story 7.3: Production Launch**

1. Provision production host on chosen platform
2. Install Docker + Docker Compose on host
3. Configure DNS — point domain A record to host IP
4. Set up Cloudflare R2 (or chosen S3 service) — create bucket, get credentials
5. Configure all production environment variables on host
6. Update OAuth callback URLs (GitHub, Google) to production domain
7. Create `scripts/backup-db.sh` and `scripts/restore-db.sh`
8. Set up cron job for daily backups
9. First production deployment via CI/CD pipeline
10. Run smoke tests, verify HTTPS, verify OAuth flows
11. Test backup and restore procedure

### Testing Strategy

**CI Pipeline Testing:**
- All existing backend tests (72% coverage, 35+ handler tests) run in CI
- All existing frontend tests (122 tests, 13 suites) run in CI
- Docker build verification ensures images compile

**Production Verification:**
- `scripts/smoke-test.sh` validates:
  - `GET /health` returns 200 with `{"status": "ok"}`
  - Frontend loads (200 on `/`)
  - API responds to authenticated request
  - HTTPS certificate is valid
  - OAuth login flow redirects correctly

**Backup Verification:**
- Manual test: run backup script, verify file in S3
- Manual test: restore from backup to fresh database, verify data integrity

### Acceptance Criteria

**Story 7.1:**
- Given production Dockerfiles exist, when built, then backend image is <50MB, frontend image is <200MB, scrape-service image is <200MB
- Given docker-compose.prod.yml exists, when `docker compose -f docker-compose.prod.yml up` runs, then all services start and communicate correctly
- Given .env.example files exist, then every required environment variable is documented with description and example value
- Given a deployment platform evaluation is completed, then a decision is documented with rationale aligned to budget (<$10/mo) and requirements

**Story 7.2:**
- Given code is pushed to a PR, when CI runs, then Go lint, Go tests, frontend lint, and frontend tests all execute and report results
- Given code is merged to main, when deploy workflow runs, then production images are built, pushed to GHCR, and deployed to production host
- Given deployment completes, when smoke tests run, then all health checks pass

**Story 7.3:**
- Given DNS is configured, when users visit the domain, then they see Ditto over HTTPS with valid TLS certificate
- Given production is running, when a file is uploaded, then it is stored in the production S3-compatible service (not LocalStack)
- Given the backup cron job runs, then a compressed database dump is uploaded to S3 with correct naming
- Given a backup exists, when restore script runs against a fresh database, then all data is recovered correctly
- Given OAuth is configured, when users click GitHub/Google login, then OAuth flow completes successfully with production callback URLs

---

## Developer Resources

### File Paths Reference

**New files to create:**
- `backend/Dockerfile`
- `frontend/Dockerfile.dev`
- `docker-compose.prod.yml`
- `Caddyfile`
- `.env.example`
- `backend/.env.example`
- `frontend/.env.example`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `scripts/backup-db.sh`
- `scripts/restore-db.sh`
- `scripts/smoke-test.sh`

**Files to modify:**
- `frontend/Dockerfile` (replace with production build)
- `frontend/next.config.mjs` (add `output: 'standalone'`)
- `backend/cmd/server/main.go` (configurable CORS origins)
- `backend/internal/config/database.go` (connection pool tuning)

### Key Code Locations

| Location | Purpose |
|----------|---------|
| `backend/cmd/server/main.go:50` | Existing `/health` endpoint |
| `backend/cmd/server/main.go:55-65` | CORS configuration (needs production domain) |
| `backend/internal/config/database.go` | `getEnv()` helper, `DATABASE_URL` handling |
| `backend/internal/middleware/security_headers.go` | `GIN_MODE=release` detection for HSTS |
| `backend/internal/services/s3_service.go` | S3 client initialization (uses `AWS_*` env vars) |
| `backend/internal/utils/state.go` | AppState init — DB connection + migration runner |
| `backend/docker-entrypoint.sh` | Dev startup script (wait for DB → migrate → start) |

### Testing Locations

- Backend tests: `backend/internal/handlers/*_test.go`, `backend/internal/repository/*_test.go`
- Frontend tests: `frontend/src/**/__tests__/`, `frontend/src/**/*.test.{ts,tsx}`
- Smoke tests: `scripts/smoke-test.sh` (new)

### Documentation to Update

- `README.md` — Add production deployment section (how to deploy, env vars, backup/restore)
- `backend/.env.example` — Document all backend env vars
- `frontend/.env.example` — Document all frontend env vars

---

## UX/UI Considerations

No UI/UX impact — this is a backend/infrastructure epic. No user-facing components are created or modified. The user experience is unchanged; users simply access Ditto via a real domain with HTTPS instead of localhost.

---

## Testing Approach

**Conform to existing test standards:**
- Backend: Go test + testify, table-driven tests, `_test.go` suffix, `go test ./...`
- Frontend: Jest + RTL, `.test.ts`/`.test.tsx` suffix, `pnpm test`

**Test strategy for Epic 7:**

No new unit or integration tests are written in this epic. Instead:
- CI pipeline runs ALL existing tests automatically on every PR/push
- Smoke test script provides production deployment verification
- Backup/restore procedure is tested manually with documented steps

**Coverage:**
- Existing coverage maintained (72% backend, 122 frontend tests)
- CI fails if any existing test fails — prevents regressions during infrastructure changes

---

## Deployment Strategy

### Deployment Steps

1. Developer pushes to `main` branch
2. GitHub Actions `deploy.yml` triggers automatically
3. CI tests pass (prerequisite — deploy job depends on CI job)
4. Production Docker images built and pushed to GHCR
5. SSH into production host
6. Pull latest images from GHCR
7. `docker compose -f docker-compose.prod.yml up -d` (rolling restart)
8. Backend entrypoint runs database migrations automatically
9. Smoke test script runs to verify deployment
10. If smoke test fails, alert in GitHub Actions output

### Rollback Plan

1. SSH into production host
2. `docker compose -f docker-compose.prod.yml down`
3. Pull previous image tags: `docker pull ghcr.io/simon198/ditto-backend:<previous-sha>`
4. Update compose to use previous image tags
5. `docker compose -f docker-compose.prod.yml up -d`
6. Verify rollback successful via smoke tests

**Database rollback:** If a migration causes issues, use `golang-migrate` down command:
```bash
docker exec ditto-backend migrate -path /app/migrations -database "$DATABASE_URL" down 1
```

### Monitoring

**Basic monitoring (sufficient for launch):**
- Caddy access logs (request volume, error rates)
- Docker container health checks (restart on failure)
- `GET /health` endpoint for external uptime monitoring (use free tier of UptimeRobot or similar)
- Docker logs for all services: `docker compose -f docker-compose.prod.yml logs -f`
- Backup cron job logs success/failure to stdout (captured in Docker logs)
