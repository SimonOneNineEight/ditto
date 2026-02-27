# Ditto - Epic Breakdown: Multi-Provider Auth

**Date:** 2026-02-26
**Project Level:** 1

---

## Epic 8: Multi-Provider Authentication & Account Security

**Slug:** auth-multiprovider

### Goal

Enable users to link multiple login methods (GitHub, Google, LinkedIn, email/password) to a single account, manage their linked providers from account settings, and experience reliable authentication without hitting rate limits during normal usage.

### Scope

- Database schema: one-to-many `users_auth`, dedicated refresh token table
- Backend: multi-provider OAuth login, account management endpoints (link/unlink/password)
- Frontend: LinkedIn OAuth button, account settings linked providers UI, set/change password
- Rate limit tuning: separate buckets, higher auth limits
- Lockout protection: cannot remove last auth method

### Success Criteria

- Users can log in with any linked provider and reach the same account
- Users can link/unlink providers from account settings
- OAuth-only users can set a password as an additional login method
- Last auth method cannot be removed (lockout protection)
- Rate limiting no longer blocks normal OAuth flows or token refresh
- LinkedIn OAuth works end-to-end (login, register, link)

### Dependencies

- Existing auth system (users, users_auth tables, OAuth handlers)
- LinkedIn OAuth app credentials (AUTH_LINKEDIN_ID, AUTH_LINKEDIN_SECRET)
- No external service dependencies beyond existing OAuth providers

---

## Story Map - Epic 8

```
Epic 8: Multi-Provider Authentication & Account Security
│
├── Story 8.1: Multi-Provider Auth Backend & Rate Limit Tuning (5 points)
│   Dependencies: None (foundational)
│   Deliverable: Schema migrated, OAuth works with multiple providers, rate limits tuned
│
├── Story 8.2: Account Management Endpoints (3 points)
│   Dependencies: Story 8.1 (requires multi-provider schema)
│   Deliverable: Link/unlink providers, set/change password, lockout protection
│
└── Story 8.3: Frontend — LinkedIn OAuth & Account Settings UI (3 points)
    Dependencies: Story 8.2 (requires account management API)
    Deliverable: LinkedIn button, linked providers UI, password management UI
```

---

## Stories - Epic 8

### Story 8.1: Multi-Provider Auth Backend & Rate Limit Tuning

As a user,
I want to log in with any of my OAuth providers and reach the same account,
So that I don't end up with duplicate accounts or lose access to my data.

**Acceptance Criteria:**

AC #1: Given a user registered with email/password, when they log in with GitHub OAuth (same email), then a new `users_auth` row is created for GitHub AND the existing password auth row is preserved.

AC #2: Given a user who previously logged in with GitHub, when they log in with Google (same email), then both GitHub and Google auth rows exist for the same user.

AC #3: Given a user re-logs in with the same OAuth provider, when the callback hits the backend, then the existing auth row is updated (avatar, name) — no duplicate row is created.

AC #4: Given the refresh token endpoint is called, when the user has a valid refresh token, then it reads from the `user_refresh_tokens` table (not `users_auth`).

AC #5: Given the rate limit on auth endpoints, when a user makes 20 requests within 1 minute, then the 21st is rejected with 429 — and refresh token has its own separate 30/min bucket.

AC #6: All existing auth tests pass with updated multi-provider behavior. New tests cover multi-provider scenarios.

**Prerequisites:** None (foundational story)

**Technical Notes:** Migration 000015. Refresh tokens move to dedicated table. Rate limit changes in middleware.

**Estimated Effort:** 5 points (3-4 days)

---

### Story 8.2: Account Management Endpoints

As a user,
I want to manage my linked login methods from my account,
So that I can add new providers, remove ones I no longer use, and set a password as a backup.

**Acceptance Criteria:**

AC #1: Given an authenticated user, when they call `GET /api/account/providers`, then they receive a list of their linked providers with provider name and avatar URL.

AC #2: Given an authenticated user, when they call `POST /api/account/link-provider` with valid OAuth data, then a new auth row is created and the updated provider list is returned.

AC #3: Given User A has GitHub linked, when User B tries to link the same GitHub account (same provider email), then User B receives a 409 error "This GitHub account is already linked to another account."

AC #4: Given a user with 2+ auth methods, when they call `DELETE /api/account/providers/:provider`, then the auth row is removed and the updated list is returned.

AC #5: Given a user with only 1 auth method remaining, when they try to unlink it, then they receive a 400 error "Cannot remove your only login method."

AC #6: Given an OAuth-only user (no password), when they call `POST /api/account/set-password`, then a "local" auth row is created with the hashed password.

AC #7: Given a user with a password set, when they call `PUT /api/account/change-password` with correct current password, then the password hash is updated.

AC #8: All new endpoints have comprehensive table-driven tests covering happy path and error cases.

**Prerequisites:** Story 8.1 (multi-provider schema must be in place)

**Technical Notes:** New `handlers/account.go` and `routes/account.go`. Follows existing handler/route patterns.

**Estimated Effort:** 3 points (2-3 days)

---

### Story 8.3: Frontend — LinkedIn OAuth & Account Settings UI

As a user,
I want to see my linked providers in account settings and link/unlink them with a click,
So that I can manage how I sign into Ditto.

**Acceptance Criteria:**

AC #1: Given the login and register pages, when rendered, then a LinkedIn OAuth button appears alongside GitHub and Google buttons.

AC #2: Given LinkedIn OAuth credentials are configured, when a user clicks the LinkedIn button, then the OAuth flow completes and the user is logged in / registered.

AC #3: Given a user visits account settings, when the page loads, then they see a "Login Methods" section showing all linked providers with icons and unlink buttons.

AC #4: Given a user clicks "Link Google" in account settings, when the OAuth flow completes, then Google appears in the linked providers list with a success toast.

AC #5: Given a user clicks "Unlink GitHub" and confirms, when the request completes, then GitHub is removed from the list with a success toast.

AC #6: Given a user has only one auth method, when viewing account settings, then the unlink button for that method is disabled with a tooltip explaining why.

AC #7: Given an OAuth-only user, when they view account settings, then they see a "Set Password" form. Given a user with a password, then they see a "Change Password" form instead.

AC #8: Frontend tests cover LinkedProviders and PasswordSection components rendering and state management.

**Prerequisites:** Story 8.2 (account management API must exist)

**Technical Notes:** Reuse `oauth-buttons.tsx` pattern for LinkedIn. New components in `components/account/`. Uses existing shadcn/ui, react-hook-form, zod, sonner patterns.

**Estimated Effort:** 3 points (2-3 days)

---

## Implementation Timeline - Epic 8

**Total Story Points:** 11
**Estimated Timeline:** 1-2 sprints (~7-10 days)

**Implementation Sequence:**

1. **Story 8.1** → Database migration + backend core refactor (no forward dependencies)
2. **Story 8.2** → Account management endpoints (depends on 8.1 schema)
3. **Story 8.3** → Frontend UI and LinkedIn button (depends on 8.2 API)

**Dependency Validation:** ✅ Valid sequence — strict backend-first ordering, no forward dependencies.

---

## Tech-Spec Reference

See [tech-spec-auth-multiprovider-ratelimit.md](tech-spec-auth-multiprovider-ratelimit.md) for complete technical implementation details.
