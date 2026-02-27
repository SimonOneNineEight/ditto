# Story 8.1: Multi-Provider Auth Backend & Rate Limit Tuning

**Status:** ready-for-dev

---

## User Story

As a user,
I want to log in with any of my OAuth providers and reach the same account,
So that I don't end up with duplicate accounts or lose access to my data.

---

## Acceptance Criteria

**AC #1:** Given a user registered with email/password, when they log in with GitHub OAuth (same email), then a new `users_auth` row is created for GitHub AND the existing password auth row is preserved.

**AC #2:** Given a user who previously logged in with GitHub, when they log in with Google (same email), then both GitHub and Google auth rows exist for the same user.

**AC #3:** Given a user re-logs in with the same OAuth provider, when the callback hits the backend, then the existing auth row is updated (avatar, name) — no duplicate row is created.

**AC #4:** Given the refresh token endpoint is called, when the user has a valid refresh token, then it reads from the `user_refresh_tokens` table (not `users_auth`).

**AC #5:** Given the rate limit on auth endpoints, when a user makes 20 requests within 1 minute, then the 21st is rejected with 429 — and refresh token has its own separate 30/min bucket.

**AC #6:** All existing auth tests pass with updated multi-provider behavior. New tests cover multi-provider scenarios.

---

## Implementation Details

### Tasks / Subtasks

- [ ] Create migration `000015_multi_provider_auth.up.sql` (AC: #1, #2, #4)
  - [ ] Drop `UNIQUE(user_id)` constraint on `users_auth`
  - [ ] Add `UNIQUE(user_id, auth_provider)` composite constraint
  - [ ] Create `user_refresh_tokens` table with `UNIQUE(user_id)`
  - [ ] Migrate existing refresh tokens from `users_auth` to `user_refresh_tokens`
  - [ ] Drop `refresh_token` and `refresh_token_expires_at` columns from `users_auth`
- [ ] Create down migration `000015_multi_provider_auth.down.sql` (AC: #4)
- [ ] Update `UserAuth` model in `models/user.go` — remove refresh token fields (AC: #4)
- [ ] Create `UserRefreshToken` model in `models/user.go` (AC: #4)
- [ ] Refactor `CreateOrUpdateOAuthUser()` in `repository/user.go` (AC: #1, #2, #3)
  - [ ] Look up user by email
  - [ ] If user exists: check if auth row for this provider exists
    - [ ] If auth row exists: update avatar_url and name (no duplicate)
    - [ ] If no auth row: INSERT new auth row (auto-link)
  - [ ] If user doesn't exist: create user + auth row (signup)
- [ ] Add `UpsertRefreshToken()` to user repository — insert/update in `user_refresh_tokens` (AC: #4)
- [ ] Add `GetRefreshToken()` to user repository — read from `user_refresh_tokens` (AC: #4)
- [ ] Update `RefreshToken` handler in `handlers/auth.go` to use new table (AC: #4)
- [ ] Update `Login` handler — query `users_auth WHERE auth_provider = 'local'` for password check (AC: #1)
- [ ] Update `OAuthLogin` handler to work with refactored repository method (AC: #1, #2, #3)
- [ ] Increase `authIPRateLimiter` limit from 10 to 20 in `middleware/rate_limit.go` (AC: #5)
- [ ] Create `refreshIPRateLimiter` with limit 30 in `middleware/rate_limit.go` (AC: #5)
- [ ] Create `RateLimitRefreshIP()` middleware function (AC: #5)
- [ ] Move refresh token route to separate rate limit group in `routes/auth.go` (AC: #5)
- [ ] Update existing auth tests in `handlers/auth_test.go` for multi-provider (AC: #6)
- [ ] Add new tests: multi-provider login, auto-link by email, no-duplicate on re-login (AC: #6)
- [ ] Add tests for refresh token with new table (AC: #6)
- [ ] Add tests for separate rate limit buckets (AC: #5, #6)

### Technical Summary

This story performs the foundational schema and backend changes to support multi-provider authentication. The key migration drops the one-to-one `UNIQUE(user_id)` constraint on `users_auth` and replaces it with a one-per-provider `UNIQUE(user_id, auth_provider)` constraint. Refresh tokens are extracted to a dedicated `user_refresh_tokens` table since they are per-user, not per-provider.

The `CreateOrUpdateOAuthUser()` function is refactored from overwrite-on-match to insert-new-row-per-provider. Rate limits are tuned: auth endpoints get 20/min/IP (was 10), and refresh token gets its own 30/min/IP bucket.

### Project Structure Notes

- **Files to modify:**
  - `backend/internal/models/user.go`
  - `backend/internal/repository/user.go`
  - `backend/internal/handlers/auth.go`
  - `backend/internal/middleware/rate_limit.go`
  - `backend/internal/routes/auth.go`
  - `backend/internal/handlers/auth_test.go`
  - `backend/internal/repository/user_test.go`
  - `backend/internal/middleware/rate_limit_test.go`
- **Files to create:**
  - `backend/migrations/000015_multi_provider_auth.up.sql`
  - `backend/migrations/000015_multi_provider_auth.down.sql`
- **Expected test locations:** `backend/internal/handlers/auth_test.go`, `backend/internal/repository/user_test.go`, `backend/internal/middleware/rate_limit_test.go`
- **Estimated effort:** 5 story points (3-4 days)
- **Prerequisites:** None

### Key Code References

| File | Lines | What to Reference |
|------|-------|-------------------|
| `backend/internal/repository/user.go` | 269-344 | `CreateOrUpdateOAuthUser()` — primary refactor target |
| `backend/internal/handlers/auth.go` | 280-335 | `OAuthLogin` handler |
| `backend/internal/handlers/auth.go` | 227-278 | `RefreshToken` handler — update for new table |
| `backend/internal/handlers/auth.go` | 169-225 | `Login` handler — password verification pattern |
| `backend/internal/middleware/rate_limit.go` | 29-32 | `authIPRateLimiter` — increase limit |
| `backend/internal/routes/auth.go` | 14-22 | Auth route group — separate refresh |
| `backend/internal/models/user.go` | All | UserAuth struct — remove refresh fields |
| `backend/migrations/000002_add_users_auth_user_id_unique.up.sql` | All | The constraint being replaced |

---

## Context References

**Tech-Spec:** [tech-spec-auth-multiprovider-ratelimit.md](../tech-spec-auth-multiprovider-ratelimit.md) - Primary context document containing:

- Database migration SQL (complete DDL)
- Refactored OAuth login flow (pseudocode)
- Rate limit configuration changes
- Data model before/after diagrams
- All integration points

**Architecture:** [architecture-backend.md](../../architecture-backend.md) — Backend layered architecture patterns

---

## Dev Agent Record

### Context Reference

- `docs/planning/stories/story-auth-multiprovider-1.context.xml`

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
