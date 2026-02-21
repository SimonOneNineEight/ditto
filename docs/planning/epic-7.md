# ditto - Epic 7 Breakdown

**Date:** 2026-02-20
**Project Level:** 1 (Coherent Feature)

---

## Epic 7: CI/CD Pipeline & Production Deployment

**Slug:** prod-deploy

### Goal

Take Ditto from "runs on localhost" to "deployed and accessible on the internet" so that users can access the application via a real domain with HTTPS, backed by automated CI/CD, database backups, and production-grade infrastructure — all within a <$10/month budget.

### Scope

**Included:**
- Production-optimized Docker images for all 3 services (backend, frontend, scrape-service)
- Environment variable externalization and secrets management
- Deployment platform evaluation and decision
- GitHub Actions CI/CD pipeline (lint, test, build, deploy)
- DNS configuration and automatic HTTPS via Caddy + Let's Encrypt
- Automated daily PostgreSQL backups with 7-day retention
- Production S3-compatible file storage (replacing LocalStack)
- First production deployment with smoke testing

**Excluded:**
- Horizontal scaling, load balancing, Kubernetes
- CDN, advanced monitoring/alerting (Datadog, Sentry)
- Blue-green or canary deployments
- Email delivery, log aggregation services

### Success Criteria

1. Ditto is accessible at the production domain over HTTPS with a valid TLS certificate
2. Pushing to `main` branch triggers automated lint → test → build → deploy pipeline
3. All existing tests (72% backend coverage, 122 frontend tests) pass in CI on every PR
4. Database is backed up daily with verified restore capability
5. File uploads are stored in production S3-compatible storage (not LocalStack)
6. Total monthly infrastructure cost is <$10
7. OAuth login (GitHub, Google) works with production callback URLs

### Dependencies

- All 6 prior epics complete (47 stories done)
- GitHub repository with existing test suites
- Domain name (already owned)
- GitHub, Google OAuth app credentials (already exist, need production callback URLs)

---

## Story Map - Epic 7

```
Epic 7: CI/CD Pipeline & Production Deployment
├── Story 7.1: Production Container Images & Platform Decision (5 points)
│   Dependencies: None (foundational)
│   Deliverable: Production Dockerfiles, docker-compose.prod.yml, platform chosen
│
├── Story 7.2: CI/CD Pipeline & Automated Deployment (3 points)
│   Dependencies: Story 7.1 (needs production Dockerfiles)
│   Deliverable: GitHub Actions CI + CD pipelines, smoke tests
│
└── Story 7.3: Production Launch — DNS, HTTPS, Backup & Storage (5 points)
    Dependencies: Story 7.2 (needs CI/CD to deploy)
    Deliverable: Live production site, backups, real S3, HTTPS
```

**Dependency Validation:** ✅ Valid sequence — no forward dependencies

---

## Stories - Epic 7

### Story 7.1: Production Container Images & Platform Decision

As a developer,
I want production-optimized Docker images and a chosen deployment platform,
So that Ditto can be deployed to a production environment reliably and efficiently.

**Acceptance Criteria:**

AC #1: Given production Dockerfiles exist, when built, then backend image is <50MB, frontend image is <200MB, scrape-service image is <200MB
AC #2: Given docker-compose.prod.yml exists, when `docker compose -f docker-compose.prod.yml up` runs locally, then all services start, communicate, and health checks pass
AC #3: Given .env.example files exist, then every required environment variable is documented with description and example value
AC #4: Given a deployment platform evaluation is completed, then a decision is documented with rationale aligned to budget (<$10/mo) and US region requirement

**Prerequisites:** None (foundational story)

**Technical Notes:** Multi-stage Docker builds, Caddy reverse proxy, `output: 'standalone'` for Next.js, configurable CORS origins. See [tech-spec.md](./tech-spec.md) §Implementation Details.

**Estimated Effort:** 5 points (3-5 days)

---

### Story 7.2: CI/CD Pipeline & Automated Deployment

As a developer,
I want automated testing and deployment on every push,
So that code changes are validated and deployed without manual intervention.

**Acceptance Criteria:**

AC #1: Given code is pushed to a PR, when CI runs, then Go lint, Go tests, frontend lint, and frontend tests all execute and report pass/fail results
AC #2: Given code is merged to main, when deploy workflow runs, then production images are built, pushed to GHCR, and deployed to the production host
AC #3: Given deployment completes, when smoke tests run, then /health returns 200, frontend loads, and HTTPS is valid
AC #4: Given CI or deployment fails, then the failure is visible in GitHub Actions with clear error output

**Prerequisites:** Story 7.1 (production Dockerfiles and platform must exist)

**Technical Notes:** GitHub Actions with PostgreSQL service container for tests, GHCR for image storage, SSH-based deployment. See [tech-spec.md](./tech-spec.md) §CI/CD Pipeline Design.

**Estimated Effort:** 3 points (2-3 days)

---

### Story 7.3: Production Launch — DNS, HTTPS, Backup & Storage

As a user,
I want to access Ditto at a real domain with HTTPS, knowing my data is backed up and files are stored reliably,
So that I can use Ditto as my primary job search tool with confidence.

**Acceptance Criteria:**

AC #1: Given DNS is configured, when users visit the domain, then they see Ditto over HTTPS with a valid TLS certificate
AC #2: Given production is running, when a file is uploaded, then it is stored in production S3-compatible storage (not LocalStack)
AC #3: Given the backup cron job runs, then a compressed database dump is uploaded to S3 with correct naming and timestamps
AC #4: Given a backup exists, when restore script runs against a fresh database, then all data is recovered correctly
AC #5: Given OAuth is configured with production callback URLs, when users click GitHub/Google login, then the OAuth flow completes successfully

**Prerequisites:** Story 7.2 (CI/CD pipeline must exist to deploy)

**Technical Notes:** Caddy auto-HTTPS via Let's Encrypt, Cloudflare R2 (or chosen S3-compatible service), pg_dump cron backup, OAuth callback URL update. See [tech-spec.md](./tech-spec.md) §Technical Details.

**Estimated Effort:** 5 points (3-5 days)

---

## Implementation Timeline - Epic 7

**Total Story Points:** 13

**Estimated Timeline:** 1.5-2 weeks (8-13 days)

| Story | Points | Dependencies | Phase |
|-------|--------|-------------|-------|
| 7.1: Production Images & Platform | 5 | None | Containerize |
| 7.2: CI/CD Pipeline | 3 | 7.1 | Automate |
| 7.3: Production Launch | 5 | 7.2 | Launch |

---

## Tech-Spec Reference

See [tech-spec.md](./tech-spec.md) for complete technical implementation details including:
- Architecture diagram
- Multi-stage Dockerfile strategy
- CI/CD pipeline design
- Backup strategy
- Platform comparison matrices
- Security considerations
- Rollback procedures
