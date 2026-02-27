# Story 8.2: Account Management Endpoints

**Status:** Draft

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

- [ ] Add repository methods to `repository/user.go` (AC: #1-#8)
  - [ ] `GetUserAuthProviders(userID)` — return all auth rows for user (AC: #1)
  - [ ] `LinkProvider(userID, provider, email, avatarURL)` — insert new auth row (AC: #2)
  - [ ] `GetAuthByProviderEmail(provider, email)` — check if provider email belongs to another user (AC: #3)
  - [ ] `UnlinkProvider(userID, provider)` — delete auth row (AC: #4)
  - [ ] `CountAuthMethods(userID)` — count auth rows for lockout check (AC: #5)
  - [ ] `HasPassword(userID)` — check if "local" auth row with password exists (AC: #6, #8)
  - [ ] `SetPassword(userID, hashedPassword)` — create "local" auth row (AC: #6)
  - [ ] `UpdatePassword(userID, hashedPassword)` — update existing password hash (AC: #7)
  - [ ] `GetPasswordHash(userID)` — get hash for verification (AC: #7)
- [ ] Create `handlers/account.go` with request/response structs (AC: #1-#8)
  - [ ] `GetLinkedProviders` — list all providers (AC: #1)
  - [ ] `LinkProvider` — validate + insert, check for cross-user conflict (AC: #2, #3)
  - [ ] `UnlinkProvider` — validate lockout protection + delete (AC: #4, #5)
  - [ ] `SetPassword` — validate no existing password + hash + create (AC: #6, #8)
  - [ ] `ChangePassword` — verify current + hash new + update (AC: #7)
- [ ] Create `routes/account.go` — authenticated route group (AC: #1-#8)
  - [ ] `GET /api/account/providers` → `GetLinkedProviders`
  - [ ] `POST /api/account/link-provider` → `LinkProvider`
  - [ ] `DELETE /api/account/providers/:provider` → `UnlinkProvider`
  - [ ] `POST /api/account/set-password` → `SetPassword`
  - [ ] `PUT /api/account/change-password` → `ChangePassword`
- [ ] Register account routes in main router setup
- [ ] Create `handlers/account_test.go` with table-driven tests (AC: #9)
  - [ ] Test GetLinkedProviders: returns correct provider list
  - [ ] Test LinkProvider: happy path, duplicate provider, cross-user conflict
  - [ ] Test UnlinkProvider: happy path, lockout protection (last method)
  - [ ] Test SetPassword: happy path, password already exists error
  - [ ] Test ChangePassword: happy path, wrong current password
  - [ ] Test all endpoints: unauthenticated request returns 401
- [ ] Add repository tests for new methods in `repository/user_test.go` (AC: #9)

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
