# Story 7.2: CI/CD Pipeline & Automated Deployment

Status: ready-for-dev

## Story

As a developer,
I want automated testing and deployment on every push,
so that code changes are validated and deployed without manual intervention.

## Acceptance Criteria

1. **AC #1: CI pipeline runs on PRs** — Given code is pushed to a PR, when CI runs, then Go lint, Go tests, frontend lint, and frontend tests all execute and report pass/fail results.

2. **AC #2: CD pipeline deploys on merge to main** — Given code is merged to main, when the deploy workflow runs, then production images are built, pushed to GHCR, and deployed to the production host.

3. **AC #3: Smoke tests verify deployment** — Given deployment completes, when smoke tests run, then `/health` returns 200, frontend loads, and HTTPS is valid.

4. **AC #4: Failures are visible** — Given CI or deployment fails, then the failure is visible in GitHub Actions with clear error output.

## Tasks / Subtasks

- [x] **Create `.github/workflows/ci.yml`** (AC: #1, #4)
  - [x] Configure trigger: `pull_request` and `push` to any branch
  - [x] Job: `backend-lint` — checkout, setup Go 1.24, run `golangci-lint`
  - [x] Job: `backend-test` — checkout, setup Go 1.24, start PostgreSQL 15 service container, run migrations, run `go test ./... -race -cover`
  - [x] Job: `frontend-lint` — checkout, setup Node 20, install pnpm, install deps, run `pnpm lint`
  - [x] Job: `frontend-test` — checkout, setup Node 20, install pnpm, install deps, run `pnpm test --ci`
  - [x] All jobs run in parallel for speed
  - [x] Ensure clear error output on failure (AC: #4)

- [x] **Create `.github/workflows/deploy.yml`** (AC: #2, #3, #4)
  - [x] Configure trigger: `push` to `main` branch only
  - [x] Job: `build-and-push` — build production Docker images, push to GHCR (`ghcr.io/simon198/ditto-*`)
  - [x] Job: `deploy` — SSH into Hetzner production host, pull latest images, run `docker compose -f docker-compose.prod.yml up -d`
  - [x] Configure `deploy` to depend on `build-and-push`
  - [x] Store SSH key, host IP, and env vars as GitHub Actions secrets

- [x] **Create `scripts/smoke-test.sh`** (AC: #3)
  - [x] Test `GET /health` returns HTTP 200 with `{"status": "ok"}`
  - [x] Test frontend loads (HTTP 200 on `/`)
  - [x] Test HTTPS certificate is valid
  - [x] Exit non-zero on any failure for CI visibility (AC: #4)

- [x] **Configure GitHub Actions secrets** (AC: #2)
  - [x] Document required secrets: `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `GHCR_TOKEN` (or use `GITHUB_TOKEN`)
  - [x] Document any env vars needed for CI test database

- [ ] **Test CI pipeline on a PR** (AC: #1)
  - [ ] Create a test branch, push, verify all CI jobs run and pass
  - [ ] Verify failure output is clear when a test fails (AC: #4)

- [ ] **Test deploy pipeline** (AC: #2, #3)
  - [ ] Merge to main, verify images are built and pushed to GHCR
  - [ ] Verify SSH deployment runs and smoke tests pass

## Dev Notes

### Architecture and Technical Approach

**CI/CD Design (from tech-spec):**
Two separate GitHub Actions workflows with clear separation of concerns:

- **ci.yml** runs on every PR and push — 5 parallel jobs: `backend-lint`, `backend-test`, `frontend-lint`, `frontend-test`, `docker-build`. Backend tests require a PostgreSQL 15 service container.
- **deploy.yml** runs only on push to main — 2 sequential jobs: `build-and-push` (images to GHCR), then `deploy` (SSH pull + compose up).

**Key patterns:**
- GitHub Container Registry (GHCR) for Docker image storage — free for public repos
- SSH-based deployment to Hetzner Cloud CX22 (Ashburn, VA) — decided in Story 7.1
- Existing health check endpoint: `GET /health` → `{"status": "ok"}` [Source: backend/cmd/server/main.go:50]
- Backend runs migrations at startup via `NewAppState()` — no separate migration step needed in CD
- All secrets stored as GitHub Actions secrets, never in repo

**Test infrastructure:**
- Backend: Go test + testify, `go test ./... -race -cover` (72% repo coverage)
- Frontend: Jest 30.2.0 + RTL, `pnpm test -- --ci` (122 tests, 13 suites)
- Package manager is **pnpm** (pinned version in Dockerfile per Story 7.1 review)

**Docker images (from Story 7.1):**
- Backend: multi-stage `golang:1.24-alpine` → `alpine:3.20` (29.7MB)
- Frontend: multi-stage `node:20-alpine`, standalone output (159MB)
- Scrape-service archived — not included in production stack

### Learnings from Previous Story

**From Story 7-1-production-container-images-and-platform-decision (Status: done)**

- **Platform Decision**: Hetzner Cloud CX22 (Ashburn, VA) at ~$5/mo — deploy via Docker Compose over SSH
- **Production Dockerfiles Created**: `backend/Dockerfile` and `frontend/Dockerfile` (production multi-stage builds) — use these as build targets in CI
- **Production Compose**: `docker-compose.prod.yml` with 4 services (db, backend, frontend, caddy) — this is the compose file for CD deployment
- **Caddyfile Created**: Routes `/api/*` and `/health` → backend:8081, `/` → frontend:3000 — automatic HTTPS via Let's Encrypt
- **Environment Files**: `.env.example`, `backend/.env.example`, `frontend/.env.example` — reference for required secrets in GitHub Actions
- **Scope Change**: Scrape-service archived and excluded from production — do not build or deploy it
- **Image Sizes**: Backend 29.7MB, Frontend 159MB — both within targets
- **CORS**: Now configurable via `CORS_ORIGINS` env var with whitespace trimming (review fix applied)
- **pnpm Version**: Pinned in frontend Dockerfile (review fix applied) — CI should match
- **Advisory**: Dev docker-compose.yml:18 references stale `./backend_go/migrations` path — pre-existing, not in scope

[Source: stories/7-1-production-container-images-and-platform-decision.md#Dev-Agent-Record]

### Project Structure Notes

- **Files to create:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `scripts/smoke-test.sh`
- **Files to reference (not modify):** `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.prod.yml`, `Caddyfile`, `.env.example` files
- **Expected test locations:** No new unit/integration tests — CI runs all existing tests; smoke test is a shell script
- **Prerequisites:** Story 7.1 complete (production Dockerfiles and docker-compose.prod.yml exist)

### References

- [Source: docs/planning/tech-spec.md#CI/CD Pipeline Design] — Complete CI/CD pipeline design with job structure, triggers, and deployment steps
- [Source: docs/planning/epic-7.md#Story 7.2] — Story definition with acceptance criteria and technical notes
- [Source: docs/planning/stories/7-1-production-container-images-and-platform-decision.md#Completion Notes] — Platform decision (Hetzner), image sizes, scope changes
- [Source: docs/planning/stories/7-1-production-container-images-and-platform-decision.md#Senior Developer Review] — All review items resolved; advisory notes on DATABASE_URL sslmode and pool tuning
- [Source: docs/database-schema.md] — Full database schema for migration context in CI

## Dev Agent Record

### Context Reference

- `docs/planning/stories/7-2-cicd-pipeline-and-automated-deployment.context.xml`

### Agent Model Used

Claude Opus 4.6

### Debug Log References

**Implementation Plan (2026-02-21):**
- Create ci.yml with 5 parallel jobs: backend-lint (golangci-lint), backend-test (PostgreSQL 15 service container), frontend-lint, frontend-test, docker-build
- Create deploy.yml with 2 jobs: build-and-push (GHCR images), deploy (SSH + docker compose)
- Create smoke-test.sh: health check, frontend load, HTTPS cert validation
- Add `image:` directives to docker-compose.prod.yml for GHCR pull support (required for `docker compose pull`)
- Frontend NEXT_PUBLIC_API_URL handled via .env.production created in deploy workflow (no Dockerfile modification)
- Tasks 5-6 (pipeline testing) require manual GitHub verification after push

### Completion Notes List

- Created ci.yml with 5 parallel jobs: backend-lint (golangci-lint), backend-test (PostgreSQL 15 service container), frontend-lint, frontend-test, docker-build. Uses concurrency groups to cancel in-progress runs.
- Created deploy.yml with 2 sequential jobs: build-and-push (GHCR with latest + SHA tags), deploy (SSH + docker compose pull/up). Creates `.env.production` inline to bake NEXT_PUBLIC_API_URL into the frontend build.
- Created smoke-test.sh: validates /health endpoint, frontend load, and HTTPS cert. Exits non-zero on any failure.
- Added `image:` directives to docker-compose.prod.yml for backend and frontend services, enabling `docker compose pull` for CD. Build directives kept for local use.
- Fixed `pnpm test -- --ci` → `pnpm test --ci` (the extra `--` caused Jest to treat `--ci` as a file pattern).

**GitHub Actions Secrets Required:**

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | SSH private key for Hetzner production host |
| `SSH_HOST` | Production host IP address or hostname |
| `SSH_USER` | SSH username on the production host |
| `DEPLOY_DOMAIN` | Production domain (e.g., `ditto.example.com`) |

`GITHUB_TOKEN` is automatic — used for GHCR authentication during build-and-push. No separate `GHCR_TOKEN` needed.

**CI test database:** No secrets required. PostgreSQL 15 service container configured directly in ci.yml with hardcoded test credentials matching `backend/internal/testutil/database.go` defaults (`ditto_test_user`/`test_password`/`ditto_test`).

### File List

| Action | Path |
|--------|------|
| Added | `.github/workflows/ci.yml` |
| Added | `.github/workflows/deploy.yml` |
| Added | `scripts/smoke-test.sh` |
| Modified | `docker-compose.prod.yml` |

## Change Log

| Date | Change |
|------|--------|
| 2026-02-20 | Story drafted from epic-7.md and tech-spec.md |
| 2026-02-21 | Implemented CI/CD pipelines, smoke test script, and GHCR image references |
