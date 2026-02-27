# Story 8.3: Frontend — LinkedIn OAuth & Account Settings UI

**Status:** Draft

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

- [ ] Add LinkedIn button to `oauth-buttons.tsx` (AC: #1, #2)
  - [ ] Import LinkedIn icon from `@icons-pack/react-simple-icons`
  - [ ] Add LinkedIn `signIn('linkedin')` button with same styling as GitHub/Google
  - [ ] Verify LinkedIn provider is configured in `auth.ts` (add if missing)
- [ ] Add LinkedIn provider to NextAuth config in `auth.ts` if not present (AC: #2)
- [ ] Create `services/account-service.ts` (AC: #3-#8)
  - [ ] `getLinkedProviders()` — `GET /api/account/providers`
  - [ ] `linkProvider(data)` — `POST /api/account/link-provider`
  - [ ] `unlinkProvider(provider)` — `DELETE /api/account/providers/:provider`
  - [ ] `setPassword(password)` — `POST /api/account/set-password`
  - [ ] `changePassword(currentPassword, newPassword)` — `PUT /api/account/change-password`
- [ ] Create `components/account/linked-providers.tsx` (AC: #3, #4, #5, #6)
  - [ ] Fetch and display linked providers on mount
  - [ ] Show provider icon + name + "Unlink" button for each linked provider
  - [ ] Show "Link" button for unlinked providers (GitHub, Google, LinkedIn)
  - [ ] Disable unlink button when only 1 method remains, show tooltip
  - [ ] Link flow: trigger OAuth signIn popup → on success call linkProvider API → refresh list → success toast
  - [ ] Unlink flow: confirmation dialog → call unlinkProvider API → refresh list → success toast
  - [ ] Error handling: display error toasts for 409 (already linked), 400 (last method)
- [ ] Create `components/account/password-section.tsx` (AC: #7, #8)
  - [ ] Determine mode: "set" (no password) vs "change" (has password) based on provider list
  - [ ] Set mode: password + confirm fields, zod validation (min length), submit calls setPassword
  - [ ] Change mode: current password + new password + confirm fields, submit calls changePassword
  - [ ] Success: toast notification, reset form
  - [ ] Error: display validation errors inline, toast for server errors
- [ ] Integrate components into account settings page (AC: #3, #7)
  - [ ] Add "Login Methods" card section with LinkedProviders component
  - [ ] Add "Password" card section with PasswordSection component
- [ ] Write frontend tests (AC: #9)
  - [ ] Test LinkedProviders: renders linked providers, shows unlink buttons, disables last method unlink
  - [ ] Test LinkedProviders: shows link buttons for unlinked providers
  - [ ] Test PasswordSection: renders set-password form when no password, change-password form when has password
  - [ ] Test oauth-buttons: LinkedIn button renders on login/register pages

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
