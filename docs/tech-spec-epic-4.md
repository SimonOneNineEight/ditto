# Epic 4 Technical Specification: Workflow Automation & Timeline

**Epic:** Workflow Automation & Timeline
**Created:** 2026-02-05
**Status:** Draft
**Stories:** 4.1 - 4.6 (6 stories)

---

## Design File Reference

**Design File:** `ditto-design.pen`

### Relevant Screens

| Screen | Frame ID | Description |
|--------|----------|-------------|
| Dashboard | `yRtnW` | Main dashboard with stats, upcoming items, quick actions |
| Application Detail - Full Timeline | `e8NYm` | Timeline view with full event list |
| Notification Settings | `NGiup` | Notification preferences with toggles |

### Key Design Components

| Component | ID | Usage |
|-----------|-----|-------|
| Card/Stat | `QBiyZ` | Total Applications stat card |
| Card/StatActive | `Gv7b0` | Active applications stat card |
| Card/StatInterviews | `GUztO` | Interviews count stat card |
| Card/StatOffers | `Lyy6W` | Offers stat card (accent color) |
| Toggle/On | `Mr7Yy` | Notification preference toggle |
| Toggle/Off | `TpmJo` | Notification preference toggle (off) |
| Link/Default | `lWWFK` | "View all" links |

---

## Overview

Epic 4 delivers workflow automation and visibility features that provide users with at-a-glance insight into their job search activities. This epic transforms ditto from a data entry tool into a command center that surfaces what needs attention, prevents missed deadlines, protects user work with auto-save, and reduces cognitive load through automated reminders.

**Value Proposition:** Users get a dashboard showing what needs attention, a timeline preventing missed deadlines, automatic reminders, and auto-save protecting their work - making ditto feel reliable and effortless.

**Key Capabilities:**
- Dashboard with application statistics and quick actions
- Upcoming items widget showing next events (interviews + assessments)
- Auto-save infrastructure protecting rich text content
- In-app notification center with configurable preferences
- Enhanced timeline with filters and date ranges

---

## Objectives and Scope

### In Scope

- **Dashboard Statistics (Story 4.1):** Application count by status, total/active/interviews/offers statistics
- **Dashboard Quick Actions (Story 4.2):** "+ Interview" and "+ Application" buttons
- **Upcoming Items Widget (Story 4.3):** Next 4 events with filter chips and urgency indicators
- **Auto-Save Infrastructure (Story 4.4):** `useAutoSave` hook with 30s debounce, visual save status indicator
- **Notification Center (Story 4.5):** In-app notifications with bell icon, configurable reminder preferences
- **Timeline Enhancements (Story 4.6):** Type filters (All/Interviews/Assessments), time range filters, date grouping

### Out of Scope

- Browser push notifications (deferred to post-MVP per ADR-006)
- Email notifications (deferred to post-MVP)
- Calendar sync (Google Calendar, Outlook) - deferred to Tier 4
- Keyboard shortcuts for quick actions (optional enhancement, not required)
- Mobile native notification support

### Dependencies on Prior Work

| Dependency | Source | Required For |
|------------|--------|--------------|
| `listAllAssessments()` API | Story 3.7 | Story 4.3 (Upcoming Widget) |
| Assessment timeline integration | Story 3.7 | Story 4.3, 4.6 |
| `getCountdownInfo()` helper | Story 3.3 | Story 4.3 (countdown display) |
| Countdown/urgency patterns | Stories 3.3, 3.8 | Story 4.3, 4.6 |
| Rich text editors (TipTap) | Story 2.7 | Story 4.4 |
| Interview API endpoints | Epic 2 | Stories 4.1, 4.3, 4.6 |
| Assessment API endpoints | Epic 3 | Stories 4.1, 4.3, 4.6 |

---

## System Architecture Alignment

Epic 4 aligns with the existing architecture as defined in `docs/architecture.md`:

### Backend Components (New)

| Component | File | Purpose |
|-----------|------|---------|
| Dashboard Handler | `internal/handlers/dashboard_handler.go` | Dashboard stats and upcoming items |
| Timeline Handler | `internal/handlers/timeline_handler.go` | Enhanced timeline with filters |
| Notification Handler | `internal/handlers/notification_handler.go` | Notification CRUD and preferences |
| Notification Service | `internal/services/notification_service.go` | Notification trigger logic |
| Notification Repository | `internal/repository/notification_repository.go` | Database operations |

### Frontend Components (New)

| Component | Path | Purpose |
|-----------|------|---------|
| Dashboard Page | `app/(app)/dashboard/page.tsx` | Main dashboard view |
| NotificationCenter | `components/shared/NotificationCenter/` | Bell icon dropdown |
| AutoSaveIndicator | `components/shared/AutoSaveIndicator/` | "Saving..." / "Saved" indicator |
| UpcomingWidget | `app/(app)/dashboard/components/` | Next events display |
| useAutoSave | `lib/hooks/useAutoSave.ts` | Auto-save custom hook |
| useNotifications | `lib/hooks/useNotifications.ts` | Notification polling hook |

### Database Tables (New)

From Migration 000008 (already defined in architecture):

```sql
-- notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- interview_reminder, assessment_deadline, system_alert
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- user_notification_preferences table
CREATE TABLE user_notification_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id),
    interview_24h BOOLEAN DEFAULT TRUE,
    interview_1h BOOLEAN DEFAULT TRUE,
    assessment_3d BOOLEAN DEFAULT TRUE,
    assessment_1d BOOLEAN DEFAULT TRUE,
    assessment_1h BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Detailed Design

### Story 4.1: Dashboard Statistics and Overview

**Design Reference:** Dashboard frame `yRtnW` → StatsRow `5PoVy`

**Design Specifications from `ditto-design.pen`:**

The dashboard displays **4 stat cards** in a horizontal row:

| Card | Component | Label | Icon | Sample Value |
|------|-----------|-------|------|--------------|
| 1 | `Card/Stat` (`QBiyZ`) | "Total Applications" | briefcase | 142 |
| 2 | `Card/StatActive` (`Gv7b0`) | "Active" | trending-up | 28 |
| 3 | `Card/StatInterviews` (`GUztO`) | "Interviews" | calendar | 12 |
| 4 | `Card/StatOffers` (`Lyy6W`) | "Offers" | trophy | 3 (accent color) |

**Card Styling:**
- Corner radius: 8px
- Padding: 20px
- Border: 1px `$--border`
- Background: transparent
- Label: 13px, `$--muted-foreground`, font-weight 500
- Value: 32px, `$--foreground`, font-weight 600
- Offers value uses `$--accent` color

**Backend:**

```go
// GET /api/dashboard/stats
type DashboardStatsResponse struct {
    TotalApplications  int     `json:"total_applications"`
    ActiveApplications int     `json:"active_applications"` // saved + applied + interview
    InterviewCount     int     `json:"interview_count"`     // scheduled interviews
    OfferCount         int     `json:"offer_count"`
    StatusCounts       map[string]int `json:"status_counts"` // for future breakdown
    UpdatedAt          time.Time `json:"updated_at"`
}
```

**Caching:** Cache stats for 5 minutes to reduce DB queries. Invalidate on application create/update/delete.

**Performance:** Dashboard must load within 2 seconds (NFR-1.1).

---

### Story 4.2: Dashboard Quick Actions

**Design Reference:** Dashboard frame `yRtnW` → PageHeader → ButtonGroup `iHaRK`

**Design Specifications from `ditto-design.pen`:**

Two primary action buttons in the page header:

| Button | Text | Icon | Styling |
|--------|------|------|---------|
| Interview | "+ Interview" | plus (16px) | Primary blue, padding 8/16, corner radius 4 |
| Application | "+ Application" | plus (16px) | Primary blue, padding 8/16, corner radius 4 |

**Layout:**
- Button group with 12px gap
- Located in page header right side
- Both buttons use `$--primary` fill with `$--primary-foreground` text

**Frontend Implementation:**

```tsx
<div className="flex gap-3">
  <Button onClick={() => setShowInterviewFlow(true)}>
    <Plus className="mr-2 h-4 w-4" /> Interview
  </Button>
  <Button onClick={() => setShowAppModal(true)}>
    <Plus className="mr-2 h-4 w-4" /> Application
  </Button>
</div>
```

**"Log Interview" Flow:**
1. Click button → Open application selector dialog
2. Select application from list (or search)
3. Navigate to interview creation form for selected application

---

### Story 4.3: Upcoming Items Widget

**Design Reference:** Dashboard frame `yRtnW` → UpcomingSection `y2upp`

**IMPORTANT: Design File vs Story Spec Discrepancy**

| Aspect | Story Spec | Design File |
|--------|------------|-------------|
| Item count | "Next 5 events" | **4 items** shown |
| Filter chips | Not mentioned | **Present:** All / Interviews / Assessments |

**Decision Required:** Escalate to Simon before implementation. Design file shows 4 items with filter chips.

**Design Specifications from `ditto-design.pen`:**

**Header Section (`YHrpm`):**
- Title: "Upcoming" (18px, font-weight 600, `$--foreground`)
- Filter chips with 16px gap:
  - "All" - Active state: `$--primary` fill, `$--primary-foreground` text
  - "Interviews" - Inactive: transparent, `$--border` stroke, `$--muted-foreground` text
  - "Assessments" - Inactive: transparent, `$--border` stroke, `$--muted-foreground` text
- Chips: corner radius 999 (pill), padding 6/12

**Upcoming Items (4 levels of urgency):**

| Item | Name | Icon | Border Color | Badge Color | Badge Text | Example |
|------|------|------|--------------|-------------|------------|---------|
| Overdue | `item1_overdue` | code | `#7f1d1d` (dark red) | `#7f1d1d` bg, `#fca5a5` text | "Overdue" | Assessment: Stripe - Take Home Project |
| Tomorrow | `item2_dueSoon` | calendar | `$--secondary` | `$--secondary-muted` bg, `$--secondary` text | "Tomorrow" | Interview: Google - Technical Round 2 |
| Soon (3 days) | `item4_warning` | code | `$--accent` | `$--accent-muted` bg, `$--accent` text | "In 3 days" | Assessment: Amazon - System Design |
| Normal (5+ days) | `item3_normal` | calendar | `$--border` | `$--muted` bg, `$--foreground` text | "In 5 days" | Interview: Meta - HR Screening |

**Item Card Structure:**
- Container: card fill, 16px padding, 8px corner radius, 1px border (color varies by urgency)
- Icon wrapper: 40x40px, 8px corner radius, centered icon (20px)
- Info section: vertical stack (4px gap)
  - Row 1: Type badge + Company name
  - Title: 14px, font-weight 600
  - Date: 12px, font-weight 500 (color varies by urgency)
- Countdown badge: pill shape (999 radius), 6/12 padding

**Backend:**

```go
// GET /api/dashboard/upcoming?limit=4
type UpcomingItem struct {
    ID          int64         `json:"id"`
    Type        string        `json:"type"`        // "interview" or "assessment"
    Title       string        `json:"title"`       // "Round 2 - Technical" or assessment title
    CompanyName string        `json:"company_name"`
    JobTitle    string        `json:"job_title"`
    DueDate     time.Time     `json:"due_date"`    // scheduled_date or due_date
    Countdown   CountdownInfo `json:"countdown"`
    Link        string        `json:"link"`        // /interviews/:id or /assessments/:id
}

type CountdownInfo struct {
    Text      string `json:"text"`       // "Overdue", "Tomorrow", "In 3 days"
    Urgency   string `json:"urgency"`    // "overdue", "tomorrow", "soon", "normal"
    DaysUntil int    `json:"days_until"`
}
```

**Urgency Calculation:**

| Urgency | Condition | CSS Classes |
|---------|-----------|-------------|
| `overdue` | days < 0 | `border-red-900 bg-red-900/20 text-red-300` |
| `tomorrow` | days == 0 or 1 | `border-secondary bg-secondary/20 text-secondary` |
| `soon` | days 2-3 | `border-accent bg-accent/20 text-accent` |
| `normal` | days > 3 | `border-border bg-muted text-foreground` |

---

### Story 4.4: Auto-Save Infrastructure

**Custom Hook:**

```typescript
// src/lib/hooks/useAutoSave.ts
export const useAutoSave = <T>(
    data: T,
    saveFunction: (data: T) => Promise<void>,
    options = {
        debounceMs: 30000, // 30 seconds per PRD
        enabled: true
    }
) => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const previousDataRef = useRef<T>(data);

    const debouncedSave = useMemo(
        () => debounce(async (newData: T) => {
            setStatus('saving');
            try {
                await saveFunction(newData);
                setStatus('saved');
                setLastSaved(new Date());
            } catch (error) {
                setStatus('error');
            }
        }, options.debounceMs),
        [saveFunction, options.debounceMs]
    );

    useEffect(() => {
        if (options.enabled && !isEqual(data, previousDataRef.current)) {
            debouncedSave(data);
            previousDataRef.current = data;
        }
    }, [data, options.enabled]);

    const retry = () => debouncedSave(data);

    return { status, lastSaved, retry };
};
```

**Save Status Indicator:**

```typescript
export const AutoSaveIndicator = ({ status, lastSaved, onRetry }: Props) => {
    return (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
            {status === 'saving' && <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>}
            {status === 'saved' && <><Check className="h-4 w-4" /> Saved</>}
            {status === 'error' && (
                <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Save failed
                    <Button variant="link" size="sm" onClick={onRetry}>Retry</Button>
                </>
            )}
        </div>
    );
};
```

---

### Story 4.5: In-App Notification Center

**Design Reference:** NotificationsCard `NGiup`

**Design Specifications from `ditto-design.pen`:**

**Notification Preferences Card:**
- Title: "Notifications" (16px, font-weight 600)
- Settings list with toggle switches (16px gap between items)
- Each setting: label + description on left, toggle on right
- Toggle components: `Toggle/On` (`Mr7Yy`) and `Toggle/Off` (`TpmJo`)

**Backend API:**

```go
// GET /api/notifications?read=false&limit=20
// PATCH /api/notifications/:id/read
// PATCH /api/notifications/mark-all-read
// GET /api/users/notification-preferences
// PUT /api/users/notification-preferences
```

**Notification Types:**

| Type | Trigger | Timing |
|------|---------|--------|
| `interview_reminder_24h` | Upcoming interview | 24 hours before |
| `interview_reminder_1h` | Upcoming interview | 1 hour before |
| `assessment_deadline_3d` | Assessment due date | 3 days before |
| `assessment_deadline_1d` | Assessment due date | 1 day before |
| `assessment_deadline_1h` | Assessment due date | 1 hour before |

**Frontend Components:**

```
NotificationCenter/
├── NotificationBell.tsx       # Bell icon with unread count badge
├── NotificationDropdown.tsx   # Dropdown list of notifications
├── NotificationItem.tsx       # Individual notification row
└── NotificationPreferences.tsx # Settings toggles
```

---

### Story 4.6: Timeline View Enhancements

**Design Reference:** Application Detail - Full Timeline `e8NYm`

**Backend Enhancement:**

```go
// GET /api/timeline?type=all&range=week&page=1&per_page=20
type TimelineFilters struct {
    Type  string // all, interviews, assessments
    Range string // today, week, month, all
}

type TimelineItem struct {
    ID          int64         `json:"id"`
    Type        string        `json:"type"`
    Title       string        `json:"title"`
    CompanyName string        `json:"company_name"`
    DueDate     time.Time     `json:"due_date"`
    Countdown   CountdownInfo `json:"countdown"`
    DateGroup   string        `json:"date_group"` // today, tomorrow, this_week, later
}
```

**Filter Chips (same pattern as Upcoming Widget):**
- All (active) / Interviews / Assessments
- Time range: Today / This Week / This Month / All Upcoming

**Date Grouping:**

| Group | Criteria |
|-------|----------|
| Today | `date == today` |
| Tomorrow | `date == today + 1` |
| This Week | `date <= end_of_week` |
| Later | `date > end_of_week` |

---

## Non-Functional Requirements

| Requirement | Target | Story |
|-------------|--------|-------|
| Dashboard load time | < 2 seconds | 4.1 |
| API response time | 90% < 500ms | All |
| Auto-save completion | < 1 second | 4.4 |
| Notification polling | Every 60 seconds | 4.5 |
| Stats cache TTL | 5 minutes | 4.1 |

### Accessibility Requirements

Per `docs/accessibility-standards.md`, all UI stories must include:

- All interactive elements keyboard accessible (Tab, Enter, Escape)
- Focus order follows visual layout
- Focus indicators visible
- Status indicators convey meaning through text/icons, not color alone (urgency badges include text)
- Form labels associated with inputs
- Screen reader announces notifications

---

## API Endpoints Summary

| Endpoint | Method | Story | Description |
|----------|--------|-------|-------------|
| `/api/dashboard/stats` | GET | 4.1 | Application statistics |
| `/api/dashboard/upcoming` | GET | 4.3 | Next N events (default 4) |
| `/api/timeline` | GET | 4.6 | Enhanced timeline with filters |
| `/api/notifications` | GET | 4.5 | List notifications |
| `/api/notifications/:id/read` | PATCH | 4.5 | Mark as read |
| `/api/notifications/mark-all-read` | PATCH | 4.5 | Mark all read |
| `/api/users/notification-preferences` | GET | 4.5 | Get preferences |
| `/api/users/notification-preferences` | PUT | 4.5 | Update preferences |

---

## Acceptance Criteria Traceability

### Story 4.1: Dashboard Statistics

| AC | PRD Reference | Design Reference | Verification |
|----|---------------|------------------|--------------|
| 4 stat cards displayed | FR-4.1 | `5PoVy` StatsRow | Manual + API test |
| Total, Active, Interviews, Offers | FR-4.1 | `QBiyZ`, `Gv7b0`, `GUztO`, `Lyy6W` | Manual test |
| Load < 2 seconds | NFR-1.1 | - | Performance test |

### Story 4.2: Dashboard Quick Actions

| AC | PRD Reference | Design Reference | Verification |
|----|---------------|------------------|--------------|
| "+ Interview" button | FR-4.1 | `mPRtB` intBtn | Manual test |
| "+ Application" button | FR-4.1 | `OYIDm` appBtn | Manual test |
| Primary blue styling | - | Design system | Visual test |

### Story 4.3: Upcoming Items Widget

| AC | PRD Reference | Design Reference | Verification |
|----|---------------|------------------|--------------|
| Shows 4 upcoming events | FR-4.1 | `e9t81` itemsList | API + Manual test |
| Filter chips (All/Int/Assess) | - | `ALk58` filterChips | Manual test |
| 4-level urgency colors | FR-4.1 | `x26IZ`, `7nk4a`, `zLhhW`, `vJsvQ` | Visual test |
| Overdue items highlighted red | FR-4.1 | `#7f1d1d` border | Manual test |
| Click navigates to detail | FR-4.1 | - | Integration test |

### Story 4.4: Auto-Save Infrastructure

| AC | PRD Reference | Design Reference | Verification |
|----|---------------|------------------|--------------|
| Auto-save after 30s inactivity | FR-6.5 | - | Integration test |
| Visual status indicator | FR-6.5, NFR-4.4 | - | Manual test |
| Retry on failure | NFR-3.4 | - | Manual test |

### Story 4.5: Notification Center

| AC | PRD Reference | Design Reference | Verification |
|----|---------------|------------------|--------------|
| Notification preferences toggles | FR-4.1 | `NGiup` card with toggles | Manual test |
| Toggle on/off states | - | `Mr7Yy`, `TpmJo` | Visual test |

### Story 4.6: Timeline Enhancements

| AC | PRD Reference | Design Reference | Verification |
|----|---------------|------------------|--------------|
| Filter by type | FR-4.2 | Filter chips pattern | Manual test |
| Filter by time range | FR-4.2 | - | Manual test |
| Date grouping | FR-4.2 | - | Manual test |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Story 4.3 design discrepancy (4 vs 5 items) | Implementation delay | Escalate to Simon - design shows 4 items with filter chips |
| Notification timing edge cases | Missed or duplicate notifications | Idempotency check + comprehensive tests |
| Auto-save network failures | Data loss perception | Local storage backup, clear error UI |
| Dashboard performance with large datasets | Slow load times | Caching, pagination, query optimization |

---

## Open Questions

1. **Story 4.3 - Upcoming Widget:**
   - Story spec says "Next 5 events" but design file shows **4 items**
   - Design file has filter chips (All/Interviews/Assessments) **not in original spec**
   - **Recommendation:** Follow design file (4 items + filter chips)
   - **Action:** Confirm with Simon before implementation

2. **Notification Background Job:**
   - Run via cron, goroutine ticker, or external scheduler?
   - **Recommendation:** Simple goroutine ticker for MVP

---

## Test Strategy

### Unit Tests

| Component | Coverage Target |
|-----------|-----------------|
| `useAutoSave` hook | 90% |
| `getCountdownInfo` helper | 100% |
| Notification service logic | 80% |
| Dashboard stats calculation | 90% |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Dashboard stats API | Returns correct counts, handles empty data |
| Upcoming items API | Correct sort, limit, type filter |
| Notification CRUD | Create, read, mark as read, mark all |
| Timeline filters | Type filter, range filter, pagination |

---

## Implementation Order

1. **Story 4.1: Dashboard Statistics** - Foundation for dashboard
2. **Story 4.2: Dashboard Quick Actions** - Simple, depends on 4.1
3. **Story 4.4: Auto-Save Infrastructure** - Shared utility, needed early
4. **Story 4.3: Upcoming Items Widget** - After design clarification from Simon
5. **Story 4.6: Timeline Enhancements** - Builds on existing timeline
6. **Story 4.5: Notification Center** - Most complex, last

---

## Patterns to Reuse from Epic 3

| Pattern | Source | Application in Epic 4 |
|---------|--------|----------------------|
| `getCountdownInfo()` helper | Story 3.3 | Upcoming widget countdown |
| Optimistic UI + toast + rollback | Stories 3.4-3.8 | Notification mark as read |
| Card `inset` variant | Story 3.8 | Dashboard stat cards |
| Select `badge` variant | Story 3.8 | Timeline filters |
| 4-level urgency colors | Design file | Upcoming items, timeline |
| Filter chips pattern | Design file (`ALk58`) | Upcoming widget, timeline |

---

_Generated by Epic Tech Context Workflow_
_Date: 2026-02-05_
