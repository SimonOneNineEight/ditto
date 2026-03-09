# ditto - Epic 10 Breakdown

**Date:** 2026-03-04
**Project Level:** 1 (Coherent Feature)

---

## Epic 10: Security & Access Hardening

**Slug:** security-hardening

### Goal

Secure document access with proper permission checks and implement a password reset flow with email verification, so users' data is protected and they can recover account access.

### Scope

**Included:**
- Audit and harden document/file API authorization
- Ensure presigned S3 URLs are properly scoped and time-limited
- Add API-level permission middleware for document routes
- Build email sending infrastructure (SMTP integration)
- Implement forgot password flow with secure token + expiry
- Email verification step before allowing password reset
- Frontend forgot password / reset password pages

**Excluded:**
- Email verification on registration (separate concern)
- Two-factor authentication (2FA)
- Role-based access control (RBAC) beyond owner-only
- File sharing between users
- Email notifications for other events (interview reminders, etc.)

### Success Criteria

1. No user can access, download, or delete another user's documents via API — verified by security tests
2. Presigned S3 URLs expire after a reasonable window (e.g., 15 minutes)
3. A user who forgot their password can request a reset link via email
4. Reset tokens expire after 1 hour and are single-use
5. Email is sent successfully via configured SMTP provider
6. Password reset requires email verification (link click) before allowing new password entry

### Dependencies

- Epic 8 (auth-multiprovider) — password and auth infrastructure
- Existing file upload/download handlers and S3 integration
- SMTP provider credentials (to be configured as environment variables)

---

## Story Map - Epic 10

```
Epic 10: Security & Access Hardening
├── Story 10.1: Audit & Harden Document Access Permissions (3 points)
│   Dependencies: None (foundational)
│   Deliverable: Verified document authorization, security tests
│
└── Story 10.2: Password Reset with Email Verification (8 points)
    Dependencies: None (can run parallel to 10.1)
    Deliverable: Email infra, forgot password flow, reset pages
```

**Dependency Validation:** ✅ No inter-story dependencies

---

## Stories - Epic 10

### Story 10.1: Audit & Harden Document Access Permissions

**Status:** pending

As a user,
I want my documents to be accessible only to me,
So that my sensitive job search files (resumes, offer letters, etc.) remain private.

**Acceptance Criteria:**

AC #1: Given a user is authenticated, when they request a document belonging to another user by manipulating the file ID in the URL, then the API returns 403 Forbidden
AC #2: Given a user requests a presigned download URL, when the URL is generated, then it expires after 15 minutes
AC #3: Given a user requests a presigned upload URL, when the URL is generated, then it is scoped to the user's S3 key prefix only
AC #4: Given the file API endpoints, when tested with automated security tests, then all IDOR (Insecure Direct Object Reference) vectors are covered
AC #5: Given the file deletion endpoint, when a user attempts to delete another user's file, then the API returns 403 Forbidden and the file remains intact

**Edge Cases:**
- Expired presigned URL → S3 returns 403, frontend shows "link expired, please retry"
- Soft-deleted file access attempt → return 404
- File ID that doesn't exist → return 404 (not 403, to avoid enumeration)

**Tasks / Subtasks:**

- [ ] **Task 1**: Audit current document authorization (AC: #1, #4, #5)
  - [ ] 1.1: Review all file handler endpoints for user_id scoping
  - [ ] 1.2: Review S3 presigned URL generation for key scoping
  - [ ] 1.3: Document any gaps found

- [ ] **Task 2**: Harden authorization if gaps found (AC: #1, #3, #5)
  - [ ] 2.1: Ensure every file query includes `WHERE user_id = ?` at the repository layer
  - [ ] 2.2: Validate that S3 keys include user ID prefix to prevent cross-user access
  - [ ] 2.3: Add middleware or handler-level checks where missing

- [ ] **Task 3**: Enforce presigned URL expiry (AC: #2)
  - [ ] 3.1: Review current presigned URL TTL configuration
  - [ ] 3.2: Set download presigned URLs to 15-minute expiry
  - [ ] 3.3: Set upload presigned URLs to 15-minute expiry

- [ ] **Task 4**: Write security tests (AC: #4)
  - [ ] 4.1: Test cross-user file access attempt (expect 403)
  - [ ] 4.2: Test cross-user file deletion attempt (expect 403)
  - [ ] 4.3: Test presigned URL generation scoping
  - [ ] 4.4: Test non-existent file access (expect 404)

**Technical Notes:**
- Current file queries already include `WHERE user_id = ?` at repository layer — but need to verify no handler bypasses this
- File model requires `ApplicationID` (NOT NULL) and `UserID` — both should be checked
- Presigned URL generation is in the file handler — check `time.Duration` param
- S3 keys should follow pattern `users/{user_id}/files/{file_id}/{filename}`

**Estimated Effort:** 3 points (2-3 days)

---

### Story 10.2: Password Reset with Email Verification

**Status:** pending

As a user who forgot my password,
I want to receive a reset link via email,
So that I can securely regain access to my account.

**Acceptance Criteria:**

AC #1: Given a user clicks "Forgot Password," when they enter their email and submit, then the system sends a password reset email to that address (if an account exists)
AC #2: Given no account exists for the submitted email, when the request is made, then the API returns the same success response (no email enumeration)
AC #3: Given a reset email is sent, when the user clicks the link, then they are taken to a "Set New Password" page with the token pre-filled
AC #4: Given a valid reset token, when the user submits a new password, then the password is updated and all existing sessions are invalidated
AC #5: Given a reset token, when it is older than 1 hour or has already been used, then the API returns an error and the user must request a new link
AC #6: Given the email infrastructure, when configured with SMTP credentials via environment variables, then emails are sent reliably with proper from address and formatting

**Edge Cases:**
- User requests multiple reset links → only the most recent token is valid
- User tries to reset while logged in via OAuth → allow it (they may want to add a password)
- SMTP server unavailable → log error, return 500 to user with "try again later" message
- Token brute-force attempt → rate limit reset token validation endpoint (e.g., 5 attempts per 15 minutes)

**Tasks / Subtasks:**

- [ ] **Task 1**: Build email sending infrastructure (AC: #6)
  - [ ] 1.1: Add SMTP configuration to environment variables (host, port, user, password, from address)
  - [ ] 1.2: Create `internal/services/email` package with a `Sender` interface
  - [ ] 1.3: Implement SMTP sender
  - [ ] 1.4: Create HTML email template for password reset
  - [ ] 1.5: Add email service to dependency injection

- [ ] **Task 2**: Implement reset token storage (AC: #5)
  - [ ] 2.1: Create migration adding `password_reset_tokens` table (token_hash, user_id, expires_at, used_at, created_at)
  - [ ] 2.2: Create token repository with create, validate, and invalidate methods
  - [ ] 2.3: Store hashed tokens (SHA-256), not plaintext
  - [ ] 2.4: Invalidate previous tokens when a new one is generated

- [ ] **Task 3**: Implement forgot password API (AC: #1, #2)
  - [ ] 3.1: Create `POST /api/forgot-password` endpoint
  - [ ] 3.2: Look up user by email, generate secure random token, store hash
  - [ ] 3.3: Send reset email with link containing plaintext token
  - [ ] 3.4: Return identical response regardless of whether email exists
  - [ ] 3.5: Rate limit: max 3 reset requests per email per hour

- [ ] **Task 4**: Implement reset password API (AC: #3, #4, #5)
  - [ ] 4.1: Create `POST /api/reset-password` endpoint (accepts token + new password)
  - [ ] 4.2: Validate token exists, is not expired, and has not been used
  - [ ] 4.3: Update user's password hash
  - [ ] 4.4: Mark token as used
  - [ ] 4.5: Invalidate all existing refresh tokens for the user
  - [ ] 4.6: Rate limit: max 5 validation attempts per IP per 15 minutes

- [ ] **Task 5**: Build frontend pages (AC: #1, #3)
  - [ ] 5.1: Create "Forgot Password" page with email input form
  - [ ] 5.2: Create "Check Your Email" confirmation page
  - [ ] 5.3: Create "Reset Password" page (new password + confirm)
  - [ ] 5.4: Create "Password Reset Success" page with login link
  - [ ] 5.5: Add "Forgot Password?" link to login page
  - [ ] 5.6: Handle expired/invalid token errors gracefully

- [ ] **Task 6**: Write tests (AC: #1-#5)
  - [ ] 6.1: Backend unit tests for token generation, validation, expiry
  - [ ] 6.2: Backend integration tests for forgot/reset endpoints
  - [ ] 6.3: Test email enumeration protection
  - [ ] 6.4: Test token expiry and single-use enforcement
  - [ ] 6.5: Frontend component tests for reset pages

**Technical Notes:**
- No email infrastructure currently exists in the codebase — this is a greenfield addition
- `users_auth` table stores `password_hash` as nullable text — no token columns exist yet
- Tokens should be cryptographically random (32 bytes, base64url encoded) and stored as SHA-256 hashes
- Consider using a service like Resend, SendGrid, or direct SMTP — keep it behind an interface for swappability
- Rate limiting infrastructure exists from Epic 8 — reuse the same pattern

**Estimated Effort:** 8 points (5-7 days)

---

## Implementation Timeline - Epic 10

**Total Story Points:** 11

**Estimated Timeline:** 1.5-2 weeks (7-10 days)

| Story | Points | Dependencies | Phase |
|-------|--------|-------------|-------|
| 10.1: Document Access Permissions | 3 | None | Audit & Harden |
| 10.2: Password Reset + Email | 8 | None | Build & Integrate |

**Note:** Story 10.1 is a quick security audit that can be done first or in parallel with 10.2. Story 10.2 is the heavier lift due to the greenfield email infrastructure.
