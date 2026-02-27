# Ditto - Technical Specification: Multi-Provider Auth & Rate Limit Tuning

**Author:** Simon
**Date:** 2026-02-26
**Project Level:** 1
**Change Type:** Feature Enhancement + Infrastructure Improvement
**Development Context:** Brownfield — active production application in Phase 3 implementation

---

## Context

### Available Documents

- `docs/index.md` — Master documentation index with full architecture, API contracts, DB schema
- `docs/architecture-backend.md` — Go/Gin backend architecture and patterns
- `docs/architecture-frontend.md` — Next.js frontend architecture and auth flow
- `docs/api-contracts-backend.md` — All 82 REST endpoints with request/response schemas
- `docs/database-schema.md` — All tables, indexes, migration history

### Project Stack

**Frontend:**
| Component | Version |
|-----------|---------|
| Next.js | 14.2.15 |
| React | 18.x |
| TypeScript | 5.x |
| Tailwind CSS | 4.1.10 |
| next-auth | 5.0.0-beta.29 |
| react-hook-form | 7.54.2 |
| zod | 3.24.2 |
| Jest | 30.2.0 |
| @testing-library/react | 16.3.2 |

**Backend:**
| Component | Version |
|-----------|---------|
| Go | 1.24.0 |
| Gin | 1.10.1 |
| sqlx | 1.4.0 |
| golang-jwt | 5.2.2 |
| validator | 10.26.0 |
| testify | 1.10.0 |
| PostgreSQL | 15 |
| golang-migrate | 4.18.3 |

**Package Manager:** pnpm

### Existing Codebase Structure

**Auth System (current — the problem):**
- `users` table: id, name, email (UNIQUE), timestamps, soft delete
- `users_auth` table: id, user_id (**UNIQUE** — one-to-one), password_hash (nullable), auth_provider, avatar_url, refresh_token, timestamps
- OAuth flow: NextAuth → POST `/api/oauth` → `CreateOrUpdateOAuthUser()` → overwrites provider on same email
- Supported providers: GitHub, Google, LinkedIn (backend only — no frontend button for LinkedIn)
- Rate limiting: IP-based, 10 req/min on all auth endpoints (login, register, refresh, OAuth)

**Backend Architecture:** Handler → Repository → Model pattern
- Handlers: struct-based with `NewXHandler(appState)` constructor injection
- Repositories: struct-based with `NewXRepository(db)` constructor, raw SQL via sqlx
- Routes: grouped by domain in `internal/routes/`, middleware applied per group
- Tests: table-driven tests using testify

**Frontend Architecture:** Next.js App Router
- Pages: `src/app/(auth)/`, `src/app/(main)/` route groups
- Components: shadcn/ui + Radix UI primitives
- Services: API client layer in `src/services/` (axios-based)
- Auth: next-auth 5 beta with JWT strategy

---

## The Change

### Problem Statement

Two interrelated authentication issues limit Ditto's usability and production readiness:

1. **Single auth record per user** — The `users_auth` table has a `UNIQUE(user_id)` constraint enforcing one-to-one. When a user logs in with a different OAuth provider (same email), the existing auth record is overwritten — destroying the previous provider link and potentially the password hash. Users cannot use multiple login methods for the same account.

2. **Aggressive IP-based rate limiting on auth endpoints** — All auth endpoints (login, register, refresh token, OAuth) share a single 10 requests/minute/IP limit. The OAuth callback, token refresh, and login all compete in the same bucket. Users behind shared IPs (offices, VPNs, NAT) can cascade into lockouts where rate limiting prevents both re-authentication and token refresh.

### Proposed Solution

- Convert `users_auth` from one-to-one to one-to-many (one user, multiple auth records — one per provider)
- Auto-link accounts by verified email on OAuth login (matching what GitHub, Google, Notion, and other major platforms do)
- Add a dedicated `POST /api/account/link-provider` endpoint for linking additional providers from account settings
- Add account settings UI: linked providers section (link/unlink), set/change password
- Implement lockout protection: cannot remove last auth method
- Add LinkedIn OAuth button to frontend (backend already supports it)
- Tune rate limits with separate tiers and higher auth limits

### Scope

**In Scope:**

- Database migration: drop `UNIQUE(user_id)` on `users_auth`, add `UNIQUE(user_id, auth_provider)`
- Backend: refactor `CreateOrUpdateOAuthUser()` to insert new auth rows instead of overwriting
- Backend: new endpoints — list providers, link provider, unlink provider, set password
- Backend: move refresh token storage out of `users_auth` (since a user now has multiple auth rows)
- Backend: rate limit tuning — higher limits for auth endpoints, separate refresh token bucket
- Frontend: LinkedIn OAuth button on login/register pages
- Frontend: Account settings page — linked providers section with link/unlink
- Frontend: Account settings — set password (for OAuth-only users) and change password
- Lockout protection: cannot unlink last provider without a password, cannot remove password without at least one provider
- Tests for all new endpoints and edge cases

**Out of Scope:**

- Social login merge conflict UI (auto-link by verified email is sufficient)
- Account deletion flow
- Two-factor authentication (2FA)
- Session management / "sign out all devices"
- Email verification flow for credential-registered users
- OAuth token storage / accessing provider APIs on behalf of user

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/migrations/000015_multi_provider_auth.up.sql` | CREATE | Drop `UNIQUE(user_id)`, add `UNIQUE(user_id, auth_provider)`, migrate refresh token |
| `backend/migrations/000015_multi_provider_auth.down.sql` | CREATE | Rollback migration |
| `backend/internal/models/user.go` | MODIFY | Add `UserAuthProvider` struct for provider listing, update `UserAuth` struct |
| `backend/internal/repository/user.go` | MODIFY | Refactor `CreateOrUpdateOAuthUser()` to multi-provider, add `GetUserAuthProviders()`, `LinkProvider()`, `UnlinkProvider()`, `SetPassword()`, `HasPassword()` |
| `backend/internal/handlers/auth.go` | MODIFY | Update `OAuthLogin` to work with multi-provider auth rows |
| `backend/internal/handlers/account.go` | CREATE | New handler: `GetLinkedProviders`, `LinkProvider`, `UnlinkProvider`, `SetPassword`, `ChangePassword` |
| `backend/internal/routes/account.go` | CREATE | New route group: `GET /api/account/providers`, `POST /api/account/link-provider`, `DELETE /api/account/providers/:provider`, `POST /api/account/set-password`, `PUT /api/account/change-password` |
| `backend/internal/middleware/rate_limit.go` | MODIFY | Increase auth IP limit, add separate rate limiter for refresh token |
| `backend/internal/routes/auth.go` | MODIFY | Move refresh token to separate rate limit bucket |
| `frontend/src/app/(auth)/components/oauth-buttons.tsx` | MODIFY | Add LinkedIn button |
| `frontend/src/app/(main)/account/page.tsx` | MODIFY | Add linked providers section, set/change password section |
| `frontend/src/components/account/linked-providers.tsx` | CREATE | Linked providers component with link/unlink buttons |
| `frontend/src/components/account/password-section.tsx` | CREATE | Set password (OAuth-only) / change password component |
| `frontend/src/services/account-service.ts` | CREATE | API client for account endpoints |
| `backend/internal/handlers/account_test.go` | CREATE | Tests for all account endpoints |
| `backend/internal/repository/user_test.go` | MODIFY | Add tests for multi-provider repository methods |
| `backend/internal/handlers/auth_test.go` | MODIFY | Update OAuth tests for multi-provider behavior |

### Technical Approach

**Database Migration (000015):**

```sql
-- Step 1: Drop the one-to-one constraint
ALTER TABLE users_auth DROP CONSTRAINT users_auth_user_id_unique;

-- Step 2: Add one-per-provider constraint
ALTER TABLE users_auth ADD CONSTRAINT users_auth_user_provider_unique
  UNIQUE (user_id, auth_provider);

-- Step 3: Create a dedicated refresh token table
-- (refresh tokens are per-user, not per-provider)
CREATE TABLE user_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_refresh_tokens_user_unique UNIQUE (user_id)
);

-- Step 4: Migrate existing refresh tokens
INSERT INTO user_refresh_tokens (user_id, refresh_token, expires_at)
SELECT user_id, refresh_token, refresh_token_expires_at
FROM users_auth
WHERE refresh_token IS NOT NULL;

-- Step 5: Drop refresh token columns from users_auth
ALTER TABLE users_auth DROP COLUMN refresh_token;
ALTER TABLE users_auth DROP COLUMN refresh_token_expires_at;
```

Refresh tokens move to a dedicated table because they are per-user (one active session), not per-provider. A user logging in via GitHub or Google still gets the same refresh token for their session.

**OAuth Login Flow (refactored `CreateOrUpdateOAuthUser`):**

```
POST /api/oauth { provider, email, name, avatar_url }
  → Look up user by email
  → If user exists:
      → Check if auth row exists for (user_id, provider)
      → If yes: update avatar_url, update user name → login
      → If no: INSERT new auth row for this provider → login (auto-link)
  → If user doesn't exist:
      → Create user + auth row → signup
  → Generate access + refresh tokens
  → Upsert refresh token in user_refresh_tokens table
  → Return tokens + user
```

**Link Provider Flow (new endpoint):**

```
POST /api/account/link-provider { provider, email, name, avatar_url }
  (requires JWT auth — user must be logged in)
  → Verify authenticated user_id from JWT
  → Check: does this (provider, email) combo belong to a DIFFERENT user?
      → Yes: return 409 "This {provider} account is already linked to another Ditto account"
      → No: continue
  → Check: does user already have this provider linked?
      → Yes: return 409 "Provider already linked"
      → No: INSERT new users_auth row
  → Return updated provider list
```

**Unlink Provider Flow:**

```
DELETE /api/account/providers/:provider
  (requires JWT auth)
  → Count user's total auth methods (providers + has_password)
  → If count <= 1: return 400 "Cannot remove your only login method"
  → DELETE users_auth row for (user_id, provider)
  → Return updated provider list
```

**Set Password Flow (for OAuth-only users):**

```
POST /api/account/set-password { password }
  (requires JWT auth)
  → Check: does user have a "local" auth row with password_hash set?
      → Yes: return 400 "Password already set. Use change-password instead."
      → No: continue
  → Hash password with bcrypt
  → Upsert users_auth row with auth_provider="local", password_hash=hash
  → Return success
```

**Change Password Flow:**

```
PUT /api/account/change-password { current_password, new_password }
  (requires JWT auth)
  → Verify current_password against stored hash
  → Hash new_password, update password_hash
  → Return success
```

**Rate Limit Tuning:**

| Endpoint Group | Current | New |
|----------------|---------|-----|
| Login, Register, OAuth | 10/min/IP | 20/min/IP |
| Refresh Token | 10/min/IP (shared with above) | 30/min/IP (separate limiter) |
| Account management (link/unlink/password) | N/A (new) | User-based, 20/min/user |

The refresh token endpoint gets its own bucket because it's called automatically by the frontend and should never block a user's session. 20/min for auth is generous enough for normal use while still blocking brute force.

### Existing Patterns to Follow

**Backend handler pattern** (from `handlers/auth.go`):
- Request structs with `json` and `validate` tags
- `ShouldBindJSON` for request parsing
- `validate.Struct` for validation
- Consistent error responses: `{"success": false, "error": {"error": "message", "code": "CODE"}}`
- Success responses: `{"success": true, "data": {...}}`

**Backend repository pattern** (from `repository/user.go`):
- Raw SQL with `sqlx.Get`, `sqlx.Select`, `sqlx.NamedExec`
- `db:"column"` tags on model structs
- Methods on pointer receivers: `func (r *UserRepository) Method(...)`

**Frontend service pattern** (from `services/auth-service.ts`):
- Axios-based API calls with typed responses
- Error handling via try/catch with typed error responses

**Frontend component pattern:**
- shadcn/ui components (Button, Card, Dialog, Input, Label)
- react-hook-form + zod for form validation
- sonner for toast notifications

### Integration Points

| Integration | Details |
|-------------|---------|
| `users_auth` table | Schema change — one-to-many, new unique constraint |
| `user_refresh_tokens` table | New table — replaces refresh token columns in users_auth |
| `POST /api/oauth` | Refactored — inserts new auth rows instead of overwriting |
| `POST /api/login` | Unchanged — already looks up by email + password |
| `POST /api/refresh_token` | Modified — reads from `user_refresh_tokens` table |
| NextAuth `signIn` callback | Modified for link flow — needs to distinguish login vs link |
| Account settings page | New sections added to existing page |
| OAuth buttons component | LinkedIn added, reused in account settings for linking |

---

## Development Context

### Relevant Existing Code

| File | Lines | Relevance |
|------|-------|-----------|
| `backend/internal/repository/user.go` | 269-344 | `CreateOrUpdateOAuthUser()` — primary refactor target |
| `backend/internal/handlers/auth.go` | 280-335 | `OAuthLogin` handler — update for multi-provider |
| `backend/internal/handlers/auth.go` | 52-57 | `OAuthRequest` struct — reuse for link-provider |
| `backend/internal/handlers/auth.go` | 169-225 | `Login` handler — reference for password verification pattern |
| `backend/internal/handlers/auth.go` | 227-278 | `RefreshToken` handler — update to use new table |
| `backend/internal/middleware/rate_limit.go` | 29-32 | `authIPRateLimiter` — increase limit, add second limiter |
| `backend/internal/routes/auth.go` | 14-22 | Rate limit group — separate refresh token |
| `backend/internal/models/user.go` | All | User and UserAuth structs — update and extend |
| `frontend/src/auth.ts` | 74-112 | NextAuth signIn callback — add link flow support |
| `frontend/src/app/(auth)/components/oauth-buttons.tsx` | All | OAuth buttons — add LinkedIn, reuse for account linking |
| `frontend/src/app/(main)/account/page.tsx` | All | Account page — add provider and password sections |
| `backend/migrations/000002_add_users_auth_user_id_unique.up.sql` | All | The constraint being replaced |

### Dependencies

**Framework/Libraries:**

No new dependencies required. All work uses existing packages:
- `golang.org/x/crypto` (bcrypt for password hashing — already in use)
- `github.com/go-playground/validator/v10` (validation — already in use)
- `next-auth` 5.0.0-beta.29 (OAuth — already configured)
- `@icons-pack/react-simple-icons` 13.6.0 (LinkedIn icon — already available)

**Internal Modules:**
- `backend/internal/handlers/` — new account handler
- `backend/internal/repository/` — extended user repository
- `backend/internal/routes/` — new account routes
- `backend/internal/middleware/` — rate limiter modifications
- `frontend/src/services/` — new account service
- `frontend/src/components/account/` — new UI components

### Configuration Changes

No new environment variables required. Existing OAuth credentials (`AUTH_GITHUB_ID`, `AUTH_GOOGLE_ID`, etc.) and auth configuration remain unchanged.

LinkedIn OAuth requires adding `AUTH_LINKEDIN_ID` and `AUTH_LINKEDIN_SECRET` to `.env` / `.env.example` files (both frontend and backend if applicable).

### Existing Conventions (Brownfield)

| Convention | Pattern | Conformance |
|------------|---------|-------------|
| Handler constructors | `NewXHandler(appState *utils.AppState)` | New `AccountHandler` follows same pattern |
| Route groups | Domain-based files in `internal/routes/` | New `account.go` route file |
| Request validation | `validate:"required"` tags + `validate.Struct()` | All new request structs follow this |
| Error responses | `{"success": false, "error": {"error": "msg", "code": "CODE"}}` | All new endpoints follow this |
| DB operations | Raw SQL via sqlx with named parameters | All new queries follow this |
| Test style | Table-driven tests with testify assertions | All new tests follow this |
| Frontend forms | react-hook-form + zod schemas | Password forms follow this |
| UI components | shadcn/ui primitives | Account settings uses existing component library |

### Test Framework & Standards

**Backend:**
- Framework: Go testing + testify v1.10.0
- Pattern: table-driven tests in `*_test.go` files
- DB tests: use `testutil` package for test database setup
- Command: `go test ./...`

**Frontend:**
- Framework: Jest 30.2.0 + React Testing Library 16.3.2
- Pattern: `__tests__/` directories or `.test.tsx` files
- Command: `pnpm test`

---

## Implementation Stack

No changes to the implementation stack. All work uses existing technologies:

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Go + Gin | 1.24.0 / 1.10.1 |
| Database | PostgreSQL | 15 |
| Migrations | golang-migrate | 4.18.3 |
| Frontend | Next.js + React | 14.2.15 / 18.x |
| Auth | next-auth | 5.0.0-beta.29 |
| Testing (BE) | testify | 1.10.0 |
| Testing (FE) | Jest + RTL | 30.2.0 / 16.3.2 |

---

## Technical Details

### Data Model Changes

**Before (one-to-one):**
```
users (1) ←→ (1) users_auth
  - user_id UNIQUE
  - password_hash, auth_provider, avatar_url, refresh_token all in one row
```

**After (one-to-many):**
```
users (1) ←→ (many) users_auth
  - UNIQUE(user_id, auth_provider)
  - Each row = one login method
  - Row with auth_provider="local" holds password_hash
  - Rows with auth_provider="github"/"google"/"linkedin" hold avatar_url

users (1) ←→ (1) user_refresh_tokens
  - Per-user session token, independent of provider
```

**Example: user with all methods linked:**
```
users: { id: "abc", email: "simon@example.com", name: "Simon" }

users_auth:
  { user_id: "abc", auth_provider: "local",    password_hash: "$2a$...", avatar_url: null }
  { user_id: "abc", auth_provider: "github",   password_hash: null,     avatar_url: "https://github.com/..." }
  { user_id: "abc", auth_provider: "google",   password_hash: null,     avatar_url: "https://lh3.google..." }
  { user_id: "abc", auth_provider: "linkedin", password_hash: null,     avatar_url: "https://media.linkedin..." }

user_refresh_tokens:
  { user_id: "abc", refresh_token: "...", expires_at: "..." }
```

### Lockout Protection Logic

Before any unlink or password removal, count remaining auth methods:

```go
func (r *UserRepository) CountAuthMethods(userID uuid.UUID) (int, error) {
    var count int
    err := r.db.Get(&count,
        "SELECT COUNT(*) FROM users_auth WHERE user_id = $1", userID)
    return count, err
}
```

Rules:
- `UnlinkProvider`: requires `CountAuthMethods() > 1`
- `SetPassword`: always allowed (adds a method, never removes)
- `ChangePassword`: requires current password verification
- There is no "remove password" endpoint — users can only change it

### Avatar URL Resolution

With multiple providers, the user may have multiple avatar URLs. Resolution order:
1. Use avatar from the provider the user most recently logged in with
2. Fallback: first non-null avatar_url in users_auth rows

This is handled in the `CreateOrUpdateOAuthUser` / login flow — store the "active" avatar on the user session, not on the user record.

### NextAuth Integration for Link Flow

The link flow uses a separate API call from account settings, not the standard NextAuth `signIn()` flow:

1. Account settings page has "Link GitHub/Google/LinkedIn" buttons
2. Clicking triggers `signIn('github', { redirect: false })` to get the OAuth token/code
3. On success, frontend calls `POST /api/account/link-provider` with the provider info and JWT auth header
4. Backend links the provider to the authenticated user

For the standard login flow, NextAuth's existing `signIn` callback continues to call `POST /api/oauth` which now handles multi-provider correctly.

### Rate Limit Implementation Changes

**File: `backend/internal/middleware/rate_limit.go`**

Add a second IP rate limiter:

```go
var authIPRateLimiter = &ipRateLimiter{
    entries: make(map[string]*ipRateLimitEntry),
    limit:   20,       // was 10
    window:  1 * time.Minute,
}

var refreshIPRateLimiter = &ipRateLimiter{
    entries: make(map[string]*ipRateLimitEntry),
    limit:   30,
    window:  1 * time.Minute,
}
```

**File: `backend/internal/routes/auth.go`**

Separate the refresh token into its own group:

```go
rateLimited := auth.Group("/", middleware.RateLimitAuthIP())
{
    rateLimited.POST("/users", authHandler.Register)
    rateLimited.POST("/login", authHandler.Login)
    rateLimited.POST("/oauth", authHandler.OAuthLogin)
}

refreshLimited := auth.Group("/", middleware.RateLimitRefreshIP())
{
    refreshLimited.POST("/refresh_token", authHandler.RefreshToken)
}
```

---

## Development Setup

No changes to development setup. Existing workflow:

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

LinkedIn OAuth testing requires `AUTH_LINKEDIN_ID` and `AUTH_LINKEDIN_SECRET` in the frontend `.env.local` file.

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/multi-provider-auth`
2. Verify dev environment running
3. Review existing auth code: `backend/internal/repository/user.go:269-344`, `backend/internal/handlers/auth.go:280-335`
4. Review current `users_auth` schema and constraint

### Implementation Steps

**Phase 1: Database & Backend Core (Story 1)**

1. Create migration `000015_multi_provider_auth` — drop unique constraint, add composite unique, create `user_refresh_tokens` table, migrate data
2. Update `UserAuth` model — remove refresh token fields
3. Create `UserRefreshToken` model
4. Refactor `CreateOrUpdateOAuthUser()` — insert new auth rows per provider instead of overwriting
5. Update `RefreshToken` handler and repository — read/write from `user_refresh_tokens`
6. Update `Login` handler — query users_auth where `auth_provider = 'local'` for password verification
7. Update rate limit values and add separate refresh limiter
8. Write tests for all refactored repository methods and handlers

**Phase 2: Account Management Endpoints (Story 2)**

1. Create `handlers/account.go` — `GetLinkedProviders`, `LinkProvider`, `UnlinkProvider`, `SetPassword`, `ChangePassword`
2. Create `routes/account.go` — authenticated route group with endpoints
3. Add repository methods: `GetUserAuthProviders()`, `LinkProvider()`, `UnlinkProvider()`, `SetPassword()`, `HasPassword()`, `CountAuthMethods()`
4. Implement lockout protection in unlink logic
5. Write comprehensive tests — link, unlink, lockout prevention, duplicate provider, cross-user conflict

**Phase 3: Frontend (Story 3)**

1. Add LinkedIn button to `oauth-buttons.tsx` (login + register pages)
2. Create `services/account-service.ts` — API client for account endpoints
3. Create `components/account/linked-providers.tsx` — list providers with link/unlink
4. Create `components/account/password-section.tsx` — set password (if none) / change password form
5. Integrate components into account settings page
6. Handle OAuth link flow: signIn popup → link-provider API call
7. Add toast notifications for success/error states
8. Write frontend tests for new components

### Testing Strategy

**Backend tests (priority):**
- Multi-provider OAuth login: first login creates user+auth, second provider creates additional auth row
- Same provider re-login: updates existing auth row (avatar, name), doesn't create duplicate
- Link provider: authenticated user adds new provider
- Link conflict: provider email belongs to different user → 409
- Unlink provider: removes auth row, returns updated list
- Unlink lockout: last auth method → 400 error
- Set password: OAuth-only user sets password → creates "local" auth row
- Change password: verifies current password, updates hash
- Refresh token: works with new `user_refresh_tokens` table
- Rate limits: verify separate buckets for auth vs refresh

**Frontend tests:**
- LinkedProviders component renders providers with correct link/unlink states
- PasswordSection shows "Set password" for OAuth-only users, "Change password" for users with password
- Unlink button disabled when only one auth method remains
- LinkedIn button renders on login/register pages

### Acceptance Criteria

1. Given a user registered with email/password, when they log in with GitHub OAuth (same email), then a new `users_auth` row is created for GitHub AND the password auth row is preserved
2. Given a user logged in via GitHub, when they visit account settings, then they see GitHub listed as a linked provider
3. Given a user with only GitHub linked, when they click "Unlink GitHub", then they see an error "Cannot remove your only login method"
4. Given a user with GitHub linked, when they set a password from account settings, then they can subsequently log in with email/password
5. Given a user with both password and GitHub linked, when they unlink GitHub, then it succeeds and they can still log in with password
6. Given a user is logged in, when they click "Link Google" in account settings, then the OAuth flow completes and Google appears in their linked providers
7. Given User A has GitHub linked, when User B tries to link the same GitHub account, then User B sees "This GitHub account is already linked to another account"
8. Given the refresh token endpoint, when called rapidly, then it uses a separate rate limit bucket (30/min) from login/register (20/min)
9. Given LinkedIn OAuth credentials are configured, when a user clicks the LinkedIn button on the login page, then OAuth login completes successfully

---

## Developer Resources

### File Paths Reference

**New files:**
- `backend/migrations/000015_multi_provider_auth.up.sql`
- `backend/migrations/000015_multi_provider_auth.down.sql`
- `backend/internal/handlers/account.go`
- `backend/internal/handlers/account_test.go`
- `backend/internal/routes/account.go`
- `frontend/src/services/account-service.ts`
- `frontend/src/components/account/linked-providers.tsx`
- `frontend/src/components/account/password-section.tsx`

**Modified files:**
- `backend/internal/models/user.go`
- `backend/internal/repository/user.go`
- `backend/internal/repository/user_test.go`
- `backend/internal/handlers/auth.go`
- `backend/internal/handlers/auth_test.go`
- `backend/internal/middleware/rate_limit.go`
- `backend/internal/routes/auth.go`
- `frontend/src/auth.ts`
- `frontend/src/app/(auth)/components/oauth-buttons.tsx`
- `frontend/src/app/(main)/account/page.tsx`

### Key Code Locations

| Location | Purpose |
|----------|---------|
| `backend/internal/repository/user.go:269-344` | `CreateOrUpdateOAuthUser()` — primary refactor target |
| `backend/internal/handlers/auth.go:280-335` | `OAuthLogin` handler |
| `backend/internal/handlers/auth.go:227-278` | `RefreshToken` handler — update for new table |
| `backend/internal/handlers/auth.go:169-225` | `Login` handler — password verification reference |
| `backend/internal/middleware/rate_limit.go:29-32` | `authIPRateLimiter` config |
| `backend/internal/routes/auth.go:14-22` | Auth route group with rate limiting |
| `backend/internal/constants/auth.go` | Valid provider constants |
| `frontend/src/auth.ts:74-112` | NextAuth signIn callback |
| `frontend/src/app/(auth)/components/oauth-buttons.tsx` | OAuth buttons |
| `frontend/src/app/(main)/account/page.tsx` | Account settings page |

### Testing Locations

- Backend handler tests: `backend/internal/handlers/account_test.go` (new), `backend/internal/handlers/auth_test.go` (modified)
- Backend repository tests: `backend/internal/repository/user_test.go` (modified)
- Backend middleware tests: `backend/internal/middleware/rate_limit_test.go` (modified)
- Frontend component tests: alongside components in `__tests__/` directories

### Documentation to Update

- `docs/api-contracts-backend.md` — Add account management endpoints
- `docs/database-schema.md` — Update users_auth schema, add user_refresh_tokens table
- `frontend/.env.example` — Add LinkedIn OAuth credentials

---

## UX/UI Considerations

### Account Settings — Linked Providers Section

**Layout:**
- Card within existing account settings page
- Header: "Login Methods"
- List of providers, each showing: provider icon + name, linked email, link/unlink button
- "Set Password" or "Change Password" row at the bottom

**States:**
- Linked provider: shows provider icon, name, email, "Unlink" button
- Unlinked provider: shows provider icon, name, "Link" button
- Last remaining method: "Unlink" button is disabled with tooltip "This is your only login method"
- Password not set: shows "Set Password" button
- Password set: shows "Change Password" button

**Link flow UX:**
1. Click "Link GitHub" → OAuth popup opens
2. User authorizes on GitHub
3. Popup closes, provider appears in list with success toast
4. If error (e.g., already linked to another account): error toast with message

**Unlink flow UX:**
1. Click "Unlink Google" → confirmation dialog: "Remove Google login? You won't be able to sign in with Google anymore."
2. Confirm → provider removed from list, success toast
3. If last method → button disabled, no dialog

**Password section UX:**
- OAuth-only user sees: password input + confirm input + "Set Password" button
- User with password sees: current password input + new password input + confirm input + "Change Password" button

### Login/Register Pages

- Add LinkedIn button alongside existing GitHub and Google buttons
- Same styling and spacing as existing OAuth buttons
- Icon: LinkedIn logo from `@icons-pack/react-simple-icons`

---

## Testing Approach

**Backend test coverage targets:**
- All new account handler endpoints: 100% happy path + error cases
- Multi-provider repository methods: table-driven tests covering all combinations
- Lockout protection: explicit tests for every boundary condition
- Rate limit changes: verify separate buckets work independently
- Migration: verify data integrity (existing auth records preserved, refresh tokens migrated)

**Frontend test coverage:**
- LinkedProviders component: renders correct state per provider, handles link/unlink
- PasswordSection component: renders correct form based on password status
- OAuth buttons: LinkedIn button renders correctly

**Manual testing checklist:**
- Register with email → set up password → log in with password
- Log in with GitHub → verify account created → log out → log in with Google (same email) → verify same account, both providers listed
- From account settings: link Google → verify appears → unlink Google → verify removed
- Try to unlink last provider → verify blocked
- Set password as OAuth-only user → verify can log in with email/password
- Rapid login attempts → verify rate limit response with correct Retry-After header
- Rapid token refreshes → verify separate rate limit from login

---

## Deployment Strategy

### Deployment Steps

1. Deploy migration first — the schema change is backward-compatible (adding a composite unique after dropping simple unique)
2. Deploy backend with updated handlers and new endpoints
3. Deploy frontend with LinkedIn button and account settings UI
4. Configure LinkedIn OAuth credentials in production environment

### Rollback Plan

1. If migration causes issues: run down migration (`000015_multi_provider_auth.down.sql`)
   - Down migration recreates the unique constraint and moves refresh tokens back
2. If backend issues: revert to previous container image
3. If frontend issues: revert to previous container image

The migration is designed to be reversible — the down migration restores the original schema.

### Monitoring

- Watch for 429 responses on auth endpoints after rate limit changes — verify they're less frequent
- Monitor OAuth login success rates — should remain unchanged or improve
- Check for any errors on the new account endpoints
- Verify refresh token flow works correctly after table migration
