# Ditto Documentation

## Developer Reference

Start here if you're working on the codebase.

| Document | Description |
|----------|-------------|
| [Architecture Overview](architecture.md) | System design, project structure, naming conventions, ADRs |
| [Backend Architecture](architecture-backend.md) | Go/Gin layers, middleware, error handling, testing patterns |
| [Frontend Architecture](architecture-frontend.md) | Next.js App Router, components, state management, auth flow |
| [Frontend Components](frontend-components.md) | UI component structure and shadcn/ui patterns |
| [API Contracts](api-contracts-backend.md) | All 82 REST endpoints with request/response schemas |
| [Database Schema](database-schema.md) | All tables, indexes, FTS infrastructure, migration history |
| [Development Guide](development-guide.md) | Local setup, Docker, testing, database management |
| [Deployment Guide](deployment-guide.md) | Production deployment, Docker, Nginx, monitoring |

## Design & Standards

| Document | Description |
|----------|-------------|
| [Design System Principles](design-system-principles.md) | Color palette, typography, component patterns |
| [Accessibility Standards](accessibility-standards.md) | WCAG compliance, keyboard navigation, ARIA |
| [RWD Validation Checklist](rwd-validation-checklist.md) | Responsive design breakpoints and validation |
| [Integration Architecture](integration-architecture.md) | Frontend-backend communication, auth flow, CORS |

## Planning & BMAD Workflow

Project management artifacts from the [BMad Method](../bmad/) workflow live in [`planning/`](planning/). They track requirements, epics, stories, and sprint progress.

| Document | Description |
|----------|-------------|
| [PRD](planning/PRD.md) | Product requirements document |
| [Epics](planning/epics.md) | All 6 epics with story breakdown |
| [Backlog](planning/backlog.md) | Feature backlog and priorities |
| [Sprint Status](planning/sprint-status.yaml) | Current sprint tracking (story statuses) |
| [Domain Context](planning/domain-context.md) | Domain research and analysis |
| [FR Traceability Matrix](planning/fr-traceability-matrix.md) | Requirements traceability |
| Tech Specs | [Epic 1](planning/tech-spec-epic-1.md) / [2](planning/tech-spec-epic-2.md) / [3](planning/tech-spec-epic-3.md) / [4](planning/tech-spec-epic-4.md) / [5](planning/tech-spec-epic-5.md) / [6](planning/tech-spec-epic-6.md) |
| [stories/](planning/stories/) | Individual story files with tasks and acceptance criteria |
| [retrospectives/](planning/retrospectives/) | Epic retrospective notes |
| [research/](planning/research/) | Market and domain research |
