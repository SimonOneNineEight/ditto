# Story 8.1: Multi-Provider Auth Backend & Rate Limit Tuning

**Status:** done

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

- [x] Create migration `000015_multi_provider_auth.up.sql` (AC: #1, #2, #4)
  - [x] Drop `UNIQUE(user_id)` constraint on `users_auth`
  - [x] Add `UNIQUE(user_id, auth_provider)` composite constraint
  - [x] Create `user_refresh_tokens` table with `UNIQUE(user_id)`
  - [x] Migrate existing refresh tokens from `users_auth` to `user_refresh_tokens`
  - [x] Drop `refresh_token` and `refresh_token_expires_at` columns from `users_auth`
- [x] Create down migration `000015_multi_provider_auth.down.sql` (AC: #4)
- [x] Update `UserAuth` model in `models/user.go` — remove refresh token fields (AC: #4)
- [x] Create `UserRefreshToken` model in `models/user.go` (AC: #4)
- [x] Refactor `CreateOrUpdateOAuthUser()` in `repository/user.go` (AC: #1, #2, #3)
  - [x] Look up user by email
  - [x] If user exists: check if auth row for this provider exists
    - [x] If auth row exists: update avatar_url and name (no duplicate)
    - [x] If no auth row: INSERT new auth row (auto-link)
  - [x] If user doesn't exist: create user + auth row (signup)
- [x] Add `UpsertRefreshToken()` to user repository — insert/update in `user_refresh_tokens` (AC: #4)
- [x] Add `GetRefreshToken()` to user repository — read from `user_refresh_tokens` (AC: #4)
- [x] Update `RefreshToken` handler in `handlers/auth.go` to use new table (AC: #4)
- [x] Update `Login` handler — query `users_auth WHERE auth_provider = 'local'` for password check (AC: #1)
- [x] Update `OAuthLogin` handler to work with refactored repository method (AC: #1, #2, #3)
- [x] Increase `authIPRateLimiter` limit from 10 to 20 in `middleware/rate_limit.go` (AC: #5)
- [x] Create `refreshIPRateLimiter` with limit 30 in `middleware/rate_limit.go` (AC: #5)
- [x] Create `RateLimitRefreshIP()` middleware function (AC: #5)
- [x] Move refresh token route to separate rate limit group in `routes/auth.go` (AC: #5)
- [x] Update existing auth tests in `handlers/auth_test.go` for multi-provider (AC: #6)
- [x] Add new tests: multi-provider login, auto-link by email, no-duplicate on re-login (AC: #6)
- [x] Add tests for refresh token with new table (AC: #6)
- [x] Add tests for separate rate limit buckets (AC: #5, #6)

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

Claude Opus 4.6

### Debug Log References

- Implemented migration 000015 to transform `users_auth` from one-to-one to one-to-many (per-provider)
- Extracted refresh tokens to dedicated `user_refresh_tokens` table with UPSERT semantics
- Refactored `CreateOrUpdateOAuthUser()` to check-and-insert per provider instead of ON CONFLICT overwrite
- Added `GetUserAuthByProvider()` for provider-specific auth lookups (used by Login handler)
- Extracted common IP rate limit middleware logic into `rateLimitIPMiddleware()` shared by both auth and refresh limiters
- Updated testutil schema to match new DB structure (all test packages affected)

### Completion Notes

All 18 tasks completed. Key changes:
- DB migration: `UNIQUE(user_id)` → `UNIQUE(user_id, auth_provider)`, new `user_refresh_tokens` table
- Repository: `CreateOrUpdateOAuthUser()` now inserts separate auth rows per provider; refresh token methods use new table
- Handlers: `Login` queries by `auth_provider='local'`; `RefreshToken` uses `user_refresh_tokens`
- Rate limits: auth 10→20/min, refresh gets own 30/min bucket
- Tests: 3 new multi-provider handler tests, 3 new rate limit tests, updated all existing tests

### Files Modified

- `backend/migrations/000015_multi_provider_auth.up.sql` (new)
- `backend/migrations/000015_multi_provider_auth.down.sql` (new)
- `backend/internal/models/user.go` (modified)
- `backend/internal/repository/user.go` (modified)
- `backend/internal/handlers/auth.go` (modified)
- `backend/internal/middleware/rate_limit.go` (modified)
- `backend/internal/routes/auth.go` (modified)
- `backend/internal/handlers/auth_test.go` (modified)
- `backend/internal/repository/user_test.go` (modified)
- `backend/internal/middleware/rate_limit_test.go` (modified)
- `backend/internal/testutil/database.go` (modified)

### Test Results

All backend tests pass (except pre-existing S3 integration test which requires AWS credentials):
- `internal/handlers`: PASS (68.7s)
- `internal/middleware`: PASS (5.9s)
- `internal/repository`: PASS (23.1s)
- `internal/services`: PASS
- `internal/services/urlextractor`: PASS

### Change Log

- 2026-02-26: Implemented multi-provider auth backend, refresh token table extraction, and rate limit tuning (Story 8.1)
- 2026-02-26: Senior Developer Review notes appended

---

## Senior Developer Review (AI)

### Reviewer
Simon

### Date
2026-02-26

### Outcome
**APPROVE** — All acceptance criteria fully implemented with evidence. All tasks verified complete. No HIGH or MEDIUM severity findings.

### Summary
Clean, well-structured implementation of multi-provider auth backend. Migration correctly transforms `users_auth` from one-to-one to one-to-many (per-provider) and extracts refresh tokens to dedicated table. Repository refactored with check-and-insert pattern. Rate limits tuned with independent buckets. Comprehensive test coverage added.

### Key Findings

No HIGH or MEDIUM severity findings.

**LOW severity (advisory):**
- Race condition in `CreateOrUpdateOAuthUser` — `GetUserByEmail` reads outside transaction. Mitigated by DB UNIQUE constraints. Pre-existing pattern.
- IP rate limiter response format doesn't wrap in `{"success": false}` like user-based limiter. Pre-existing inconsistency.
- Down migration dedup could fail if two auth rows have identical `created_at`. Extremely unlikely edge case, rollback-only.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1 | Register+OAuth auto-links, password preserved | IMPLEMENTED | `repository/user.go:291-373`, `handlers/auth.go:145`, `auth_test.go:798-829` |
| 2 | GitHub+Google same email = both auth rows | IMPLEMENTED | `repository/user.go:318-335`, `auth_test.go:768-796` |
| 3 | Re-login same provider updates, no duplicate | IMPLEMENTED | `repository/user.go:326-330`, `auth_test.go:831-853` |
| 4 | Refresh token from user_refresh_tokens table | IMPLEMENTED | `000015_up.sql:11-28`, `repository/user.go:141-183`, `handlers/auth.go:228` |
| 5 | Auth 20/min, refresh 30/min separate buckets | IMPLEMENTED | `middleware/rate_limit.go:29-39`, `routes/auth.go:14-26`, `rate_limit_test.go:140-175` |
| 6 | All tests pass + new multi-provider tests | IMPLEMENTED | 9 new test cases across 3 test files |

**Summary: 6 of 6 acceptance criteria fully implemented.**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Migration 000015 (up + subtasks) | [x] | VERIFIED | File with all 5 DDL steps |
| Down migration | [x] | VERIFIED | File with 6 rollback steps |
| Update UserAuth model | [x] | VERIFIED | `models/user.go:22-30` |
| Create UserRefreshToken model | [x] | VERIFIED | `models/user.go:32-38` |
| Refactor CreateOrUpdateOAuthUser | [x] | VERIFIED | `repository/user.go:291-373` |
| UpsertRefreshToken + GetRefreshToken | [x] | VERIFIED | `repository/user.go:141-183` |
| Update RefreshToken handler | [x] | VERIFIED | `handlers/auth.go:209-262` |
| Update Login handler | [x] | VERIFIED | `handlers/auth.go:145` |
| Update OAuthLogin handler | [x] | VERIFIED | `handlers/auth.go:280-335` |
| Auth rate limit 10→20 | [x] | VERIFIED | `middleware/rate_limit.go:31` |
| Refresh rate limiter at 30 | [x] | VERIFIED | `middleware/rate_limit.go:35-39` |
| RateLimitRefreshIP() middleware | [x] | VERIFIED | `middleware/rate_limit.go:119-121` |
| Separate refresh route group | [x] | VERIFIED | `routes/auth.go:22-26` |
| Update existing auth tests | [x] | VERIFIED | Schema updated in testutil |
| New multi-provider tests | [x] | VERIFIED | `auth_test.go:768-853` |
| Refresh token tests | [x] | VERIFIED | `user_test.go:157-231` |
| Rate limit bucket tests | [x] | VERIFIED | `rate_limit_test.go:97-175` |

**Summary: 18 of 18 completed tasks verified. 0 questionable. 0 false completions.**

### Test Coverage and Gaps

All ACs have corresponding tests:
- AC #1, #2, #3: Handler-level integration tests (`MultiProvider_AutoLinkByEmail`, `MultiProvider_RegisterThenOAuth`, `SameProvider_NoDoublication`) + repository unit tests
- AC #4: Refresh token lifecycle tests (create, validate, expire, clear, rotate)
- AC #5: IP rate limit tests (allows, blocks at limit, independent buckets)
- AC #6: All 9 new tests added, existing tests updated for new schema

No significant test gaps identified.

### Architectural Alignment

Implementation follows the established patterns:
- Handler → Repository → Model layering respected
- Struct-based handlers with `NewXHandler(appState)` constructor
- Raw SQL via sqlx with parameterized queries
- Table-driven tests with testify assertions
- Rate limiting via middleware applied at route group level
- Extracted `rateLimitIPMiddleware()` reduces duplication

### Security Notes

No security issues found:
- All queries use parameterized placeholders (no SQL injection risk)
- Login scoped to `auth_provider='local'` (no auth bypass via OAuth rows)
- Sensitive fields tagged `json:"-"` (password_hash, refresh_token)
- Refresh token rotation via UPSERT prevents reuse
- Rate limiting applied per route group

### Best-Practices and References

- Go transaction pattern with `defer tx.Rollback()` correctly used
- PostgreSQL UPSERT via `ON CONFLICT ... DO UPDATE` for refresh tokens
- Composite unique constraint `(user_id, auth_provider)` is the standard pattern for multi-provider auth

### Action Items

**Advisory Notes:**
- Note: IP rate limiter response format inconsistency with user-based limiter is pre-existing — consider aligning in a future polish story
- Note: Down migration dedup could theoretically fail with identical timestamps — acceptable risk for rollback scenario
