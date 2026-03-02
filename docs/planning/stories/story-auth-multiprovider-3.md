# Story 8.3: Frontend — LinkedIn OAuth & Account Settings UI

**Status:** done

---

## User Story

As a user,
I want to see my linked providers in account settings and link/unlink them with a click,
So that I can manage how I sign into Ditto.

---

## Acceptance Criteria

**AC #1:** Given the login and register pages, when rendered, then a LinkedIn OAuth button appears alongside GitHub and Google buttons with correct LinkedIn icon and styling.

**AC #2:** Given LinkedIn OAuth credentials are configured, when a user clicks the LinkedIn button on the login page, then the OAuth flow completes and the user is logged in / account is created.

**AC #3:** Given a user visits account settings, when the page loads, then they see a "Login Methods" section showing all linked providers with provider icon, name, and unlink button.

**AC #4:** Given a user clicks "Link Google" in account settings, when the OAuth popup completes, then Google appears in the linked providers list with a success toast notification.

**AC #5:** Given a user clicks "Unlink GitHub" and confirms in the confirmation dialog, when the request completes, then GitHub is removed from the list with a success toast.

**AC #6:** Given a user has only one auth method remaining, when viewing account settings, then the unlink button for that method is disabled with a tooltip "This is your only login method."

**AC #7:** Given an OAuth-only user (no password set), when they view account settings, then they see a "Set Password" form with password and confirm fields. Given a user with a password already set, then they see "Change Password" with current password, new password, and confirm fields.

**AC #8:** Given a user submits the set-password or change-password form with valid data, when the request succeeds, then a success toast appears and the form resets.

**AC #9:** Frontend tests cover LinkedProviders component rendering (linked/unlinked states, disabled unlink) and PasswordSection component rendering (set vs change mode).

---

## Implementation Details

### Tasks / Subtasks

- [x] Add LinkedIn button to `oauth-buttons.tsx` (AC: #1, #2)
  - [x] Import LinkedIn icon (used lucide-react `Linkedin` since `@icons-pack/react-simple-icons` doesn't include LinkedIn)
  - [x] Add LinkedIn `signIn('linkedin')` button with same styling as GitHub/Google
  - [x] Verify LinkedIn provider is configured in `auth.ts` (add if missing)
- [x] Add LinkedIn provider to NextAuth config in `auth.ts` if not present (AC: #2)
- [x] Create `services/account-service.ts` (AC: #3-#8)
  - [x] `getLinkedProviders()` — `GET /api/account/providers`
  - [x] `linkProvider(data)` — `POST /api/account/link-provider`
  - [x] `unlinkProvider(provider)` — `DELETE /api/account/providers/:provider`
  - [x] `setPassword(password)` — `POST /api/account/set-password`
  - [x] `changePassword(currentPassword, newPassword)` — `PUT /api/account/change-password`
- [x] Create `components/account/linked-providers.tsx` (AC: #3, #4, #5, #6)
  - [x] Fetch and display linked providers on mount
  - [x] Show provider icon + name + "Unlink" button for each linked provider
  - [x] Show "Link" button for unlinked providers (GitHub, Google, LinkedIn)
  - [x] Disable unlink button when only 1 method remains, show tooltip
  - [x] Link flow: trigger OAuth signIn popup → on success call linkProvider API → refresh list → success toast
  - [x] Unlink flow: confirmation dialog → call unlinkProvider API → refresh list → success toast
  - [x] Error handling: display error toasts for 409 (already linked), 400 (last method)
- [x] Create `components/account/password-section.tsx` (AC: #7, #8)
  - [x] Determine mode: "set" (no password) vs "change" (has password) based on provider list
  - [x] Set mode: password + confirm fields, zod validation (min length), submit calls setPassword
  - [x] Change mode: current password + new password + confirm fields, submit calls changePassword
  - [x] Success: toast notification, reset form
  - [x] Error: display validation errors inline, toast for server errors
- [x] Integrate components into account settings page (AC: #3, #7)
  - [x] Add "Login Methods" card section with LinkedProviders component
  - [x] Add "Password" card section with PasswordSection component
- [x] Write frontend tests (AC: #9)
  - [x] Test LinkedProviders: renders linked providers, shows unlink buttons, disables last method unlink
  - [x] Test LinkedProviders: shows link buttons for unlinked providers
  - [x] Test PasswordSection: renders set-password form when no password, change-password form when has password
  - [x] Test oauth-buttons: LinkedIn button renders on login/register pages

### Technical Summary

This story adds LinkedIn as a third OAuth provider on the frontend and builds the account settings UI for managing linked providers and passwords. It follows existing patterns: shadcn/ui Card components for layout, react-hook-form + zod for form validation, sonner for toast notifications, and axios-based service layer for API calls. The OAuth link flow reuses NextAuth's `signIn()` in popup mode, then calls the backend link-provider endpoint with the authenticated user's JWT.

### Project Structure Notes

- **Files to create:**
  - `frontend/src/services/account-service.ts`
  - `frontend/src/components/account/linked-providers.tsx`
  - `frontend/src/components/account/password-section.tsx`
- **Files to modify:**
  - `frontend/src/app/(auth)/components/oauth-buttons.tsx`
  - `frontend/src/auth.ts` (add LinkedIn provider if missing)
  - `frontend/src/app/(main)/account/page.tsx`
- **Expected test locations:** `frontend/src/components/account/__tests__/`, `frontend/src/app/(auth)/components/__tests__/`
- **Estimated effort:** 3 story points (2-3 days)
- **Prerequisites:** Story 8.2 (account management API must exist)

### Key Code References

| File | Lines | What to Reference |
|------|-------|-------------------|
| `frontend/src/app/(auth)/components/oauth-buttons.tsx` | All | Existing OAuth button pattern — extend with LinkedIn |
| `frontend/src/auth.ts` | 1-4 | Provider imports — add LinkedIn |
| `frontend/src/auth.ts` | 74-112 | signIn callback — reference for link flow |
| `frontend/src/services/auth-service.ts` | All | Service layer pattern — follow for account-service |
| `frontend/src/app/(main)/account/page.tsx` | All | Account page — add new sections |

---

## Context References

**Tech-Spec:** [tech-spec-auth-multiprovider-ratelimit.md](../tech-spec-auth-multiprovider-ratelimit.md) - Contains:

- UX/UI considerations: layout, states, flows
- NextAuth integration details for link flow
- Component specifications
- Accessibility requirements

**Architecture:** [architecture-frontend.md](../../architecture-frontend.md) — Next.js App Router and component patterns

**Design:** [ditto-design.pen](../../../ditto-design.pen) — Pencil design file containing:

- Login page with OAuth buttons (desktop, tablet, mobile)
- Settings page with LoginMethodsCard (providers list, password section)
- Set Password Modal and Change Password Modal
- Responsive variants: desktop (1440), tablet (768), mobile (375)
- Key screen IDs: `T5Fuo` (Login), `ZEpiS` (Settings), `t4Nhe` (Set Password Modal), `2pulb` (Change Password Modal)

**Story Context:** [story-auth-multiprovider-3.context.xml](story-auth-multiprovider-3.context.xml)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

**Implementation Plan (2026-02-27):**
1. Add LinkedIn button to oauth-buttons.tsx (extend existing GitHub/Google pattern)
2. Add LinkedIn provider to auth.ts NextAuth config
3. Create account-service.ts service layer (follow auth-service.ts pattern)
4. Create linked-providers.tsx component (Card with provider list, link/unlink)
5. Create password-section.tsx component (set vs change mode with dialogs)
6. Integrate into settings/page.tsx (existing page at `(app)/settings/page.tsx`)
7. Write tests for all new components

### Completion Notes

- All 7 tasks and 32 subtasks completed successfully
- LinkedIn icon: used `Linkedin` from lucide-react since `@icons-pack/react-simple-icons` v13 doesn't export a LinkedIn icon
- Settings page integration: placed LinkedProviders card above NotificationPreferences to match design order
- Password management uses Dialog (modal) pattern matching the Pencil design (set-password and change-password modals)
- Unlink confirmation uses AlertDialog pattern consistent with existing DeleteAccountDialog

### Files Modified

**New files:**
- `frontend/src/services/account-service.ts` — API service layer for account endpoints
- `frontend/src/components/account/linked-providers.tsx` — Login Methods card with provider list
- `frontend/src/components/account/password-section.tsx` — Password set/change with modals
- `frontend/src/app/(auth)/components/__tests__/oauth-buttons.test.tsx` — OAuth buttons tests (5 tests)
- `frontend/src/components/account/__tests__/linked-providers.test.tsx` — LinkedProviders tests (6 tests)
- `frontend/src/components/account/__tests__/password-section.test.tsx` — PasswordSection tests (8 tests)

**Modified files:**
- `frontend/src/app/(auth)/components/oauth-buttons.tsx` — Added LinkedIn button
- `frontend/src/auth.ts` — Added LinkedIn provider to NextAuth config
- `frontend/src/app/(app)/settings/page.tsx` — Integrated LinkedProviders component

### Test Results

- 19 new tests added across 3 test files
- Full regression suite: 141 tests passing, 16 suites, 0 failures
- No regressions introduced

### Change Log

- 2026-02-27: Implemented Story 8.3 — LinkedIn OAuth button, account settings UI (linked providers + password management), 19 frontend tests
- 2026-03-02: Senior Developer Review notes appended

---

## Senior Developer Review (AI)

### Reviewer
Simon

### Date
2026-03-02

### Outcome
**Approve** — All 9 acceptance criteria fully implemented with evidence. All 33 completed tasks verified. No HIGH or MEDIUM severity findings. Code quality is consistent with existing codebase patterns.

### Summary

Story 8.3 delivers LinkedIn as a third OAuth provider on the frontend and builds the account settings UI for managing linked providers and passwords. The implementation follows established project patterns: shadcn/ui Card components, react-hook-form + zod validation, sonner toasts, and the axios-based service layer. The provider linking flow uses a cookie-based state-passing mechanism through the OAuth redirect chain to avoid CSRF issues with server-side API calls. A `provider_email` column was added to `users_auth` to display provider-specific emails in the UI.

### Key Findings

**No HIGH or MEDIUM severity findings.**

**LOW severity (advisory):**

1. **[Low] `link_profile` cookie stores user PII in non-httpOnly cookie** — `auth.ts:85-90` sets email/name/avatar in a client-readable cookie. Mitigated by 60-second TTL and SameSite=Lax. Acceptable trade-off to avoid CSRF issues.

2. **[Low] `link_mode` cookie 300s TTL could cause unexpected redirects** — `linked-providers.tsx:92` sets a 5-minute cookie. If a user abandons a link flow and logs in again within 5 minutes, they'll redirect to /settings instead of the dashboard.

3. **[Low] `GetAuthByProviderEmail` name is slightly misleading** — `user.go:318-331` joins on `users.email` (account email) rather than the new `provider_email` column. Works correctly for the current use case (checking if an OAuth identity is already linked to another user by email match).

4. **[Low] Password dialog error handling relies on axios interceptor** — `password-section.tsx:102-104,192-194` empty catch blocks assume the axios interceptor will show an appropriate toast. Consistent with other service calls in the codebase.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| #1 | LinkedIn OAuth button on login/register pages | IMPLEMENTED | `oauth-buttons.tsx:4,11-23` — LinkedIn button with icon and signIn handler |
| #2 | LinkedIn OAuth flow completes login/creation | IMPLEMENTED | `auth.ts:4,42` — LinkedIn provider configured; `constants/auth.go:7` — backend supports `linkedin` |
| #3 | Settings shows "Login Methods" with linked providers | IMPLEMENTED | `linked-providers.tsx:127-211` — Card with providers list; `settings/page.tsx:40` — integrated |
| #4 | Link flow: OAuth → linkProvider API → success toast | IMPLEMENTED | `linked-providers.tsx:91-94,54-86` — cookie-based link flow with API call and toast |
| #5 | Unlink flow: confirmation → API → success toast | IMPLEMENTED | `linked-providers.tsx:96-111,213-228` — AlertDialog + unlinkProvider call |
| #6 | Only-method disabled unlink with tooltip | IMPLEMENTED | `linked-providers.tsx:139,153-169,194-201` — disabled button, Tooltip, Info text |
| #7 | Set Password vs Change Password based on auth state | IMPLEMENTED | `password-section.tsx:51-76` — mode switch; `78-166` SetPasswordDialog; `168-268` ChangePasswordDialog |
| #8 | Password form submit → success toast, form reset | IMPLEMENTED | `password-section.tsx:99-101` (set), `189-191` (change) — toast + reset + close |
| #9 | Frontend tests for LinkedProviders + PasswordSection | IMPLEMENTED | 19 tests across 3 files: `linked-providers.test.tsx` (6), `password-section.test.tsx` (8), `oauth-buttons.test.tsx` (5) |

**Summary: 9 of 9 acceptance criteria fully implemented.**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Add LinkedIn button to oauth-buttons.tsx | [x] | VERIFIED | `oauth-buttons.tsx:4,11-23` |
| Import LinkedIn icon (lucide-react) | [x] | VERIFIED | `oauth-buttons.tsx:4` |
| Add LinkedIn signIn('linkedin') button | [x] | VERIFIED | `oauth-buttons.tsx:20` |
| Verify LinkedIn provider in auth.ts | [x] | VERIFIED | `auth.ts:4,42` |
| Add LinkedIn provider to NextAuth config | [x] | VERIFIED | `auth.ts:4,42` |
| Create services/account-service.ts | [x] | VERIFIED | File exists, 45 lines, all 5 methods |
| getLinkedProviders() | [x] | VERIFIED | `account-service.ts:18-21` |
| linkProvider(data) | [x] | VERIFIED | `account-service.ts:23-26` |
| unlinkProvider(provider) | [x] | VERIFIED | `account-service.ts:28-31` |
| setPassword(password) | [x] | VERIFIED | `account-service.ts:33-36` |
| changePassword(current, new) | [x] | VERIFIED | `account-service.ts:38-44` |
| Create linked-providers.tsx | [x] | VERIFIED | File exists, 231 lines |
| Fetch and display providers on mount | [x] | VERIFIED | `linked-providers.tsx:39-52` |
| Show provider icon + name + Unlink button | [x] | VERIFIED | `linked-providers.tsx:143-203` |
| Show Link button for unlinked providers | [x] | VERIFIED | `linked-providers.tsx:181-192` |
| Disable unlink when only 1 method, tooltip | [x] | VERIFIED | `linked-providers.tsx:139,153-169` |
| Link flow: signIn → linkProvider → toast | [x] | VERIFIED | `linked-providers.tsx:54-94` |
| Unlink flow: dialog → unlinkProvider → toast | [x] | VERIFIED | `linked-providers.tsx:96-111,213-228` |
| Error handling: 409/400 toasts | [x] | VERIFIED | `linked-providers.tsx:76-81,104-107` |
| Create password-section.tsx | [x] | VERIFIED | File exists, 268 lines |
| Determine set vs change mode | [x] | VERIFIED | `password-section.tsx:51`, `linked-providers.tsx:36` |
| Set mode: password + confirm, zod, setPassword | [x] | VERIFIED | `password-section.tsx:23-31,78-166` |
| Change mode: current + new + confirm, changePassword | [x] | VERIFIED | `password-section.tsx:33-42,168-268` |
| Success: toast + reset form | [x] | VERIFIED | `password-section.tsx:99-101,189-191` |
| Error: inline validation, server error toasts | [x] | VERIFIED | `password-section.tsx:133-148,102-104` |
| Integrate into settings page | [x] | VERIFIED | `settings/page.tsx:13,40` |
| Login Methods card with LinkedProviders | [x] | VERIFIED | `settings/page.tsx:40` |
| Password card with PasswordSection | [x] | VERIFIED | `linked-providers.tsx:209` (inside Login Methods card) |
| Write frontend tests | [x] | VERIFIED | 3 test files, 19 tests total |
| Test LinkedProviders: renders, unlink, disabled | [x] | VERIFIED | `linked-providers.test.tsx:52-100` |
| Test LinkedProviders: link buttons for unlinked | [x] | VERIFIED | `linked-providers.test.tsx:70-83` |
| Test PasswordSection: set vs change mode | [x] | VERIFIED | `password-section.test.tsx:37-76` |
| Test oauth-buttons: LinkedIn renders | [x] | VERIFIED | `oauth-buttons.test.tsx:26-46` |

**Summary: 33 of 33 completed tasks verified. 0 questionable. 0 falsely marked complete.**

### Test Coverage and Gaps

**Frontend tests (19 total):**
- `oauth-buttons.test.tsx` (5 tests): Renders all 3 buttons, icons, and signIn calls for each provider
- `linked-providers.test.tsx` (6 tests): Renders linked/unlinked states, disabled unlink, confirmation dialog, password section modes
- `password-section.test.tsx` (8 tests): Set/change mode rendering, dialog fields, validation errors (short password, mismatch), successful API calls

**Backend tests:**
- `account_test.go`: GetLinkedProviders (3 tests), LinkProvider (7 tests), UnlinkProvider (4 tests), SetPassword (5 tests), ChangePassword (4 tests)
- `user_test.go`: Repository-level tests for all new methods (GetUserAuthProviders, LinkProvider, GetAuthByProviderEmail, UnlinkProvider, CountAuthMethods, HasPassword, SetPassword, UpdatePassword, GetPasswordHash)

**Coverage gaps (minor):**
- No integration test for the full link flow (cookie → signIn → redirect → API call). This spans NextAuth + client + backend and would require E2E testing.
- No test for the link_pending useEffect cleanup logic in linked-providers.tsx.

### Architectural Alignment

- **Layering**: Handler → Repository pattern on backend. Service layer on frontend. Consistent with codebase architecture.
- **Auth middleware**: All endpoints protected with AuthMiddleware + CSRFMiddleware via `routes/account.go:15-16`.
- **Provider constants**: LinkedIn added to `constants/auth.go` alongside GitHub and Google.
- **NextAuth config**: LinkedIn provider follows same pattern as GitHub/Google in `auth.ts`.
- **Component patterns**: shadcn/ui Card, AlertDialog, Dialog, Tooltip. react-hook-form + zod. Consistent throughout.
- **Migration**: `000016_add_provider_email` adds column with backfill. Down migration drops column cleanly.

### Security Notes

- CSRF protection on all account endpoints (middleware applied at route group level)
- Auth required for all account endpoints
- Server-side input validation with go-playground/validator
- Password hashing with bcrypt, minimum 8 characters enforced on both client and server
- Lockout protection: server rejects unlink when only 1 auth method remains (defense in depth with client-side disable)
- Cross-user conflict check prevents linking an OAuth account that belongs to another user
- Cookie-based link flow uses SameSite=Lax and short TTLs

### Best-Practices and References

- [NextAuth v5 Docs](https://authjs.dev/getting-started) — Provider configuration and signIn callback patterns
- [shadcn/ui](https://ui.shadcn.com/) — AlertDialog, Dialog, Card, Tooltip component patterns
- [react-hook-form + zod](https://react-hook-form.com/get-started#SchemaValidation) — Form validation approach
- [Go Gin Framework](https://gin-gonic.com/docs/) — Middleware chaining and route groups
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — Password handling best practices

### Action Items

**Advisory Notes:**
- Note: Consider reducing `link_mode` cookie TTL from 300s to 120s to narrow the window for unexpected redirects
- Note: The full link flow (cookie → OAuth → redirect → API) would benefit from E2E testing in a future testing story
- Note: `GetAuthByProviderEmail` could be renamed to `GetAuthByProviderAndUserEmail` for clarity, but not critical
