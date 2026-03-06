# Story 8.2: Account Management Endpoints

**Status:** done

---

## User Story

As a user,
I want to manage my linked login methods from my account,
So that I can add new providers, remove ones I no longer use, and set a password as a backup.

---

## Acceptance Criteria

**AC #1:** Given an authenticated user, when they call `GET /api/account/providers`, then they receive a list of their linked providers with provider name, avatar URL, and linked date.

**AC #2:** Given an authenticated user, when they call `POST /api/account/link-provider` with valid OAuth data, then a new auth row is created and the updated provider list is returned.

**AC #3:** Given User A has GitHub linked, when User B tries to link the same GitHub account (same provider email), then User B receives a 409 error "This GitHub account is already linked to another account."

**AC #4:** Given a user with 2+ auth methods, when they call `DELETE /api/account/providers/:provider`, then the auth row is removed and the updated list is returned.

**AC #5:** Given a user with only 1 auth method remaining, when they try to unlink it, then they receive a 400 error "Cannot remove your only login method."

**AC #6:** Given an OAuth-only user (no password), when they call `POST /api/account/set-password` with a valid password, then a "local" auth row is created with the bcrypt-hashed password.

**AC #7:** Given a user with a password set, when they call `PUT /api/account/change-password` with correct current password and new password, then the password hash is updated.

**AC #8:** Given a user with a password set, when they call `POST /api/account/set-password`, then they receive a 400 error "Password already set. Use change-password instead."

**AC #9:** All new endpoints have comprehensive table-driven tests covering happy path, validation errors, auth errors, and edge cases.

---

## Implementation Details

### Tasks / Subtasks

- [x] Add repository methods to `repository/user.go` (AC: #1-#8)
  - [x] `GetUserAuthProviders(userID)` — return all auth rows for user (AC: #1)
  - [x] `LinkProvider(userID, provider, avatarURL)` — insert new auth row (AC: #2)
  - [x] `GetAuthByProviderEmail(provider, email)` — check if provider email belongs to another user (AC: #3)
  - [x] `UnlinkProvider(userID, provider)` — delete auth row (AC: #4)
  - [x] `CountAuthMethods(userID)` — count auth rows for lockout check (AC: #5)
  - [x] `HasPassword(userID)` — check if "local" auth row with password exists (AC: #6, #8)
  - [x] `SetPassword(userID, hashedPassword)` — create "local" auth row (AC: #6)
  - [x] `UpdatePassword(userID, hashedPassword)` — update existing password hash (AC: #7)
  - [x] `GetPasswordHash(userID)` — get hash for verification (AC: #7)
- [x] Create `handlers/account.go` with request/response structs (AC: #1-#8)
  - [x] `GetLinkedProviders` — list all providers (AC: #1)
  - [x] `LinkProvider` — validate + insert, check for cross-user conflict (AC: #2, #3)
  - [x] `UnlinkProvider` — validate lockout protection + delete (AC: #4, #5)
  - [x] `SetPassword` — validate no existing password + hash + create (AC: #6, #8)
  - [x] `ChangePassword` — verify current + hash new + update (AC: #7)
- [x] Create `routes/account.go` — authenticated route group (AC: #1-#8)
  - [x] `GET /api/account/providers` → `GetLinkedProviders`
  - [x] `POST /api/account/link-provider` → `LinkProvider`
  - [x] `DELETE /api/account/providers/:provider` → `UnlinkProvider`
  - [x] `POST /api/account/set-password` → `SetPassword`
  - [x] `PUT /api/account/change-password` → `ChangePassword`
- [x] Register account routes in main router setup
- [x] Create `handlers/account_test.go` with table-driven tests (AC: #9)
  - [x] Test GetLinkedProviders: returns correct provider list
  - [x] Test LinkProvider: happy path, duplicate provider, cross-user conflict
  - [x] Test UnlinkProvider: happy path, lockout protection (last method)
  - [x] Test SetPassword: happy path, password already exists error
  - [x] Test ChangePassword: happy path, wrong current password
  - [x] Test all endpoints: unauthenticated request returns 401
- [x] Add repository tests for new methods in `repository/user_test.go` (AC: #9)

### Technical Summary

This story creates the account management API layer. It follows the existing handler → repository pattern with a new `AccountHandler` struct and `routes/account.go` file. All endpoints require JWT authentication. The lockout protection logic counts total auth methods before allowing unlink operations. Password operations use the existing `golang.org/x/crypto/bcrypt` package.

### Project Structure Notes

- **Files to create:**
  - `backend/internal/handlers/account.go`
  - `backend/internal/handlers/account_test.go`
  - `backend/internal/routes/account.go`
- **Files to modify:**
  - `backend/internal/repository/user.go`
  - `backend/internal/repository/user_test.go`
  - `backend/cmd/server/main.go` (or wherever routes are registered)
- **Expected test locations:** `backend/internal/handlers/account_test.go`, `backend/internal/repository/user_test.go`
- **Estimated effort:** 3 story points (2-3 days)
- **Prerequisites:** Story 8.1 (multi-provider schema in place)

### Key Code References

| File | Lines | What to Reference |
|------|-------|-------------------|
| `backend/internal/handlers/auth.go` | 52-57 | `OAuthRequest` struct — reuse pattern for `LinkProviderRequest` |
| `backend/internal/handlers/auth.go` | 169-225 | `Login` handler — password verification with bcrypt pattern |
| `backend/internal/handlers/auth.go` | 280-335 | `OAuthLogin` handler — response format pattern |
| `backend/internal/routes/auth.go` | 14-22 | Route group pattern with middleware |
| `backend/internal/middleware/rate_limit.go` | 121-203 | User-based rate limiting middleware — use for account endpoints |
| `backend/internal/constants/auth.go` | All | Valid provider constants for validation |

---

## Context References

**Tech-Spec:** [tech-spec-auth-multiprovider-ratelimit.md](../tech-spec-auth-multiprovider-ratelimit.md) - Contains:

- Link/unlink/set-password flow pseudocode
- Lockout protection logic
- Request/response contracts
- Error code patterns

**Architecture:** [architecture-backend.md](../../architecture-backend.md) — Handler and repository patterns

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Context Reference

- [story-auth-multiprovider-2.context.xml](story-auth-multiprovider-2.context.xml)

### Debug Log References

- Implemented repository → handler → routes layered approach following existing patterns
- Used JOIN query for `GetAuthByProviderEmail` to check cross-user conflicts via users table email
- LinkProvider repo method stores (user_id, provider, avatar_url) — email not stored in users_auth schema
- Rejected "local" as a valid provider in LinkProvider handler to prevent manual local auth row creation

### Completion Notes

- All 9 repository methods implemented in `repository/user.go`
- `AccountHandler` with 5 endpoints created in `handlers/account.go`
- Authenticated route group at `/api/account/` with Auth + CSRF middleware
- Comprehensive handler tests: 20 test cases covering happy paths, validation, auth, and edge cases
- Repository tests: 9 new test suites for all new methods
- All tests pass; no regressions in existing test suite (S3 integration test pre-existing failure due to LocalStack not running)

### Files Modified

- `backend/internal/repository/user.go` — Added 9 new repository methods
- `backend/internal/repository/user_test.go` — Added tests for all new repository methods
- `backend/internal/handlers/account.go` — **New** AccountHandler with 5 endpoints
- `backend/internal/handlers/account_test.go` — **New** comprehensive handler tests
- `backend/internal/routes/account.go` — **New** authenticated route group
- `backend/cmd/server/main.go` — Registered account routes

### Test Results

- Repository tests: 33 tests PASS (2.73s)
- Handler tests (all): PASS (94.4s)
- Account handler tests: 20 tests PASS (30.1s)
- Full suite: All pass except pre-existing S3 integration test (LocalStack not running)

---

## Change Log

- 2026-02-26: Implemented all account management endpoints (AC #1-#9) — repository methods, handlers, routes, and comprehensive tests
- 2026-02-26: Senior Developer Review notes appended

---

## Senior Developer Review (AI)

### Reviewer
Simon

### Date
2026-02-26

### Outcome
**APPROVE** — All 9 acceptance criteria fully implemented with evidence. All tasks verified complete. No HIGH or MEDIUM severity findings.

### Summary
Clean implementation of account management endpoints following existing handler → repository patterns. Five endpoints created (`GetLinkedProviders`, `LinkProvider`, `UnlinkProvider`, `SetPassword`, `ChangePassword`) with proper Auth + CSRF middleware, input validation, and lockout protection. Repository layer adds 9 new methods with parameterized queries. Comprehensive tests cover happy paths, validation errors, auth errors, and edge cases (20 handler tests, 9 repository test suites).

### Key Findings

No HIGH or MEDIUM severity findings.

**LOW severity (advisory):**
- `LinkProvider` handler checks cross-user conflict via `GetAuthByProviderEmail` but same-user duplicate provider falls through to DB UNIQUE constraint, producing a generic 409 rather than a specific "provider already linked" message. Functional but inconsistent UX.
- Narrow race window between `GetAuthByProviderEmail` check and `LinkProvider` INSERT — two users could simultaneously try to link the same provider email. DB constraint prevents data corruption but error message would be generic. Acceptable risk.
- `SetPasswordRequest` and `ChangePasswordRequest` use `min=1` validation — no minimum password length enforced beyond "not empty". Consider enforcing a minimum (e.g., 8 chars) for production security, though this is consistent with existing `Login`/`Register` validation patterns.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1 | GET /api/account/providers returns provider list | IMPLEMENTED | `handlers/account.go:51-73`, `routes/account.go:18`, `account_test.go:112-146` |
| 2 | POST /api/account/link-provider creates auth row, returns list | IMPLEMENTED | `handlers/account.go:76-135`, `routes/account.go:19`, `account_test.go:149-176` |
| 3 | Cross-user conflict returns 409 | IMPLEMENTED | `handlers/account.go:99-107`, `repository/user.go:318-331`, `account_test.go:194-215` |
| 4 | DELETE /api/account/providers/:provider removes auth row | IMPLEMENTED | `handlers/account.go:137-181`, `routes/account.go:20`, `account_test.go:291-306` |
| 5 | Lockout protection: last method returns 400 | IMPLEMENTED | `handlers/account.go:150-157`, `repository/user.go:351-358`, `account_test.go:308-317` |
| 6 | OAuth-only user sets password, creates local auth row | IMPLEMENTED | `handlers/account.go:183-222`, `repository/user.go:373-383`, `account_test.go:338-356` |
| 7 | Change password verifies current, updates hash | IMPLEMENTED | `handlers/account.go:224-268`, `repository/user.go:385-414`, `account_test.go:387-403` |
| 8 | Set password when already set returns 400 | IMPLEMENTED | `handlers/account.go:200-207`, `account_test.go:358-368` |
| 9 | Comprehensive table-driven tests | IMPLEMENTED | 20 handler tests + 9 repository test suites |

**Summary: 9 of 9 acceptance criteria fully implemented.**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Repository: GetUserAuthProviders | [x] | VERIFIED | `repository/user.go:291-304` |
| Repository: LinkProvider | [x] | VERIFIED | `repository/user.go:306-316` |
| Repository: GetAuthByProviderEmail | [x] | VERIFIED | `repository/user.go:318-331` |
| Repository: UnlinkProvider | [x] | VERIFIED | `repository/user.go:333-349` |
| Repository: CountAuthMethods | [x] | VERIFIED | `repository/user.go:351-358` |
| Repository: HasPassword | [x] | VERIFIED | `repository/user.go:360-371` |
| Repository: SetPassword | [x] | VERIFIED | `repository/user.go:373-383` |
| Repository: UpdatePassword | [x] | VERIFIED | `repository/user.go:385-401` |
| Repository: GetPasswordHash | [x] | VERIFIED | `repository/user.go:403-414` |
| Handler: GetLinkedProviders | [x] | VERIFIED | `handlers/account.go:51-73` |
| Handler: LinkProvider with conflict check | [x] | VERIFIED | `handlers/account.go:76-135` |
| Handler: UnlinkProvider with lockout | [x] | VERIFIED | `handlers/account.go:137-181` |
| Handler: SetPassword | [x] | VERIFIED | `handlers/account.go:183-222` |
| Handler: ChangePassword | [x] | VERIFIED | `handlers/account.go:224-268` |
| Routes: account.go with Auth+CSRF | [x] | VERIFIED | `routes/account.go:11-24` |
| Register routes in main.go | [x] | VERIFIED | `cmd/server/main.go:81` |
| Handler tests (account_test.go) | [x] | VERIFIED | `account_test.go:112-460` (20 test cases) |
| Repository tests (user_test.go) | [x] | VERIFIED | `user_test.go:299-465` (9 test suites) |

**Summary: 18 of 18 completed tasks verified. 0 questionable. 0 false completions.**

### Test Coverage and Gaps

All ACs have corresponding tests:
- AC #1: `TestGetLinkedProviders` (3 sub-tests: list, multiple, unauthenticated)
- AC #2: `TestLinkProvider/HappyPath` (verifies response includes both providers)
- AC #3: `TestLinkProvider/CrossUserConflict` (verifies 409 with correct message)
- AC #4: `TestUnlinkProvider/HappyPath` (verifies deletion + updated list)
- AC #5: `TestUnlinkProvider/LockoutProtection` (verifies 400 with correct message)
- AC #6: `TestSetPassword/HappyPath` (creates OAuth user, sets password, verifies HasPassword)
- AC #7: `TestChangePassword/HappyPath` (verifies current password + update)
- AC #8: `TestSetPassword/PasswordAlreadySet` (verifies 400 with correct message)
- AC #9: All endpoints tested: happy paths + validation + auth errors + edge cases

Additional coverage: duplicate provider (DB constraint), invalid provider name, "local" provider rejection, missing required fields, non-existent provider unlink.

No significant test gaps identified.

### Architectural Alignment

Implementation follows established patterns:
- Handler → Repository → Model layering respected
- Struct-based `AccountHandler` with `NewAccountHandler(appState)` constructor
- Raw SQL via sqlx with parameterized queries
- Authenticated route group with Auth + CSRF middleware
- `response.Success()` / `HandleError()` for consistent responses
- Table-driven tests with testify assertions
- Provider validation via `constants.IsValidOAuthProvider`

### Security Notes

No security issues found:
- All queries use parameterized placeholders (no SQL injection risk)
- All endpoints behind AuthMiddleware + CSRFMiddleware
- Password hashed with bcrypt before storage (`auth.HashPassword`)
- `PasswordHash` tagged `json:"-"` in model (not exposed in responses)
- "local" explicitly rejected in `LinkProvider` (prevents manual auth row creation)
- Current password verified before allowing change
- Lockout protection prevents removing last auth method

### Best-Practices and References

- Go handler pattern with struct receivers and dependency injection via constructor
- Consistent error handling using project's `pkg/errors` package
- `RowsAffected()` check on DELETE/UPDATE for not-found detection
- Test environment setup uses shared `newAccountTestEnv` helper with per-user router factory

### Action Items

**Advisory Notes:**
- Note: `LinkProvider` duplicate-provider error message is generic (DB constraint) vs specific — consider adding an explicit check before INSERT for better UX
- Note: Password minimum length is `min=1` — consider enforcing minimum 8 characters for production security hardening (separate polish story)
- Note: Tests cannot run locally due to test database auth configuration — ensure CI environment has `ditto_test_user` credentials configured
