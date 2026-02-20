# FR Traceability Matrix - ditto MVP

**Purpose:** Maps all Functional Requirements (FRs) and Non-Functional Requirements (NFRs) to implementing stories in the epic breakdown.

**Date:** 2025-11-10
**Last Updated:** Post-validation improvements

---

## Complete Story → FR Mapping

### Epic 1: Enhanced Application Management

| Story | Implements | Description |
|-------|------------|-------------|
| Story 1.1 | FR-1.2 | Job URL Information Extraction Service |
| Story 1.2 | FR-1.7 | Cloud File Storage Infrastructure |
| Story 1.3 | FR-1.2, FR-1.1 | Application Form Integration with URL Extraction |
| Story 1.4 | FR-1.7 | Resume and Cover Letter Upload UI |
| Story 1.5 | FR-1.3, FR-1.4, FR-5.2 | Enhanced Application List with Filtering |
| Story 1.6 | FR-1.7 | Storage Quota Management and Visibility |

### Epic 2: Deep Interview Management

| Story | Implements | Description |
|-------|------------|-------------|
| Story 2.1 | FR-2 (Foundation) | Interview Database Schema and API Foundation |
| Story 2.2 | FR-2.1 | Create Interview Round - Basic API |
| Story 2.3 | FR-2.1 | Interview Form UI - Quick Capture |
| Story 2.4 | FR-2.5 | Interview Detail View - Structured Data Display |
| Story 2.5 | FR-2.2 | Add Interviewers to Interview |
| Story 2.6 | FR-2.2 | Questions and Answers - Dynamic List Management |
| Story 2.7 | FR-2.3 | Rich Text Notes - Preparation Area |
| Story 2.8 | FR-2.3 | File Uploads for Interview Prep Documents |
| Story 2.9 | FR-2.4 | Multi-Round Context - Previous Rounds Display |
| Story 2.10 | FR-2.5, FR-4.2 | Interview List and Timeline View |
| Story 2.11 | FR-2.6, FR-2.7 | Update and Delete Interview Operations |
| Story 2.12 | FR-2.2 | Interview Performance Self-Assessment |

### Epic 3: Technical Assessment Tracking

| Story | Implements | Description |
|-------|------------|-------------|
| Story 3.1 | FR-3 (Foundation) | Assessment Database Schema and API Foundation |
| Story 3.2 | FR-3.1, FR-3.7 | Create Assessment API and Basic CRUD |
| Story 3.3 | FR-3.1 | Assessment Creation and Detail UI |
| Story 3.4 | FR-3.2 | Assessment Status Management and Workflow |
| Story 3.5 | FR-3.4 | Submission Tracking - GitHub Links and Notes |
| Story 3.6 | FR-3.4 | Submission Tracking - File Uploads |
| Story 3.7 | FR-3.6, FR-4.2 | Assessment Deadline Integration with Timeline |
| Story 3.8 | FR-3.6 | Assessment List View in Application Detail |

### Epic 4: Workflow Automation & Timeline

| Story | Implements | Description |
|-------|------------|-------------|
| Story 4.1 | FR-4.1 | Dashboard Statistics and Overview |
| Story 4.2 | FR-4.1 | Dashboard Quick Actions |
| Story 4.3 | FR-4.2 | Upcoming Items Widget - Next 5 Events |
| Story 4.4 | FR-6.5 | Auto-Save Infrastructure for Rich Text Content |
| Story 4.5 | FR-4.2 | In-App Notification Center with Configurable Preferences |
| Story 4.6 | FR-4.2 | Timeline View Enhancements - Filters and Date Ranges |

**Note:** Story 4.5 originally covered browser push notifications but was deferred to post-MVP. Current Story 4.5 focuses on in-app notifications only.

### Epic 5: Search, Discovery & Data Management

| Story | Implements | Description |
|-------|------------|-------------|
| Story 5.1 | FR-5.1 (Foundation) | Global Search - Backend Infrastructure |
| Story 5.2 | FR-5.1 | Global Search UI with Grouped Results |
| Story 5.3 | FR-5.2 | Advanced Application Filtering and Sorting |
| Story 5.4 | FR-6.4 | Data Export - Applications and Interviews to CSV |
| Story 5.5 | FR-6.4 | Data Backup and Recovery Information |

### Epic 6: Polish, Performance & Production Readiness

| Story | Implements | Description |
|-------|------------|-------------|
| Story 6.1 | NFR-1 | Performance Optimization - Page Load and API Response Times |
| Story 6.2 | NFR-2 | Security Hardening - Input Validation and XSS Prevention |
| Story 6.3 | NFR-4.2 | Responsive Design - Mobile and Tablet Support |
| Story 6.4 | NFR-4.3 | Accessibility Improvements - Keyboard Navigation and Screen Readers |
| Story 6.5 | NFR-3.3, NFR-4.4 | Error Handling and User Feedback |
| Story 6.6 | NFR-2.3 | Form Validation and User Input Quality |
| Story 6.7 | NFR-1.5 | File Upload Performance and Progress |
| Story 6.8 | NFR-2.1, NFR-2.4, FR-6.3 | Session Management and Token Refresh |
| Story 6.9 | NFR-5.3 | Testing Infrastructure - Unit and Integration Tests |
| Story 6.10 | NFR-5.2 | Documentation - API, Database Schema, and Setup |

---

## Reverse Mapping: FR/NFR → Stories

### Functional Requirements Coverage

**FR-1: Application Management**
- FR-1.1 (Create Application - Manual): Story 1.3
- FR-1.2 (Create Application - URL Extraction): Story 1.1, 1.3
- FR-1.3 (View Applications): Story 1.5
- FR-1.4 (Update Application): Story 1.5
- FR-1.5 (Delete Application): Existing brownfield functionality
- FR-1.6 (Application Status Pipeline): Existing brownfield functionality
- FR-1.7 (Resume and Document Storage): Story 1.2, 1.4, 1.6

**FR-2: Interview Management**
- FR-2.1 (Create Interview Round): Story 2.2, 2.3
- FR-2.2 (Structured Interview Data Capture): Story 2.5, 2.6, 2.12
- FR-2.3 (Interview Preparation Area): Story 2.7, 2.8
- FR-2.4 (Multi-Round Context Display): Story 2.9
- FR-2.5 (View Interviews): Story 2.4, 2.10
- FR-2.6 (Update Interview): Story 2.11
- FR-2.7 (Delete Interview): Story 2.11

**FR-3: Technical Assessment Tracking**
- FR-3.1 (Create Assessment): Story 3.2, 3.3
- FR-3.2 (Assessment Status Management): Story 3.4
- FR-3.3 (Deadline Tracking): Story 3.7
- FR-3.4 (Submission Tracking): Story 3.5, 3.6
- FR-3.5 (Assessment Notes): Story 3.3 (included in detail UI)
- FR-3.6 (View Assessments): Story 3.7, 3.8
- FR-3.7 (Update/Delete Assessment): Story 3.2

**FR-4: Dashboard & Timeline**
- FR-4.1 (Dashboard Overview): Story 4.1, 4.2
- FR-4.2 (Timeline/Calendar View): Story 2.10, 3.7, 4.3, 4.5, 4.6

**FR-5: Search & Filtering**
- FR-5.1 (Global Search): Story 5.1, 5.2
- FR-5.2 (Application Filtering): Story 1.5, 5.3

**FR-6: User Account & Data Management**
- FR-6.1 (User Authentication): Existing brownfield functionality
- FR-6.2 (User Profile): Existing brownfield functionality
- FR-6.3 (Session Management): Existing + Story 6.8
- FR-6.4 (Cross-Device Data Sync): Story 5.4, 5.5
- FR-6.5 (Auto-Save): Story 4.4

### Non-Functional Requirements Coverage

**NFR-1: Performance**
- NFR-1.1 (Page Load Time): Story 6.1
- NFR-1.2 (API Response Time): Story 6.1
- NFR-1.3 (Auto-Save Performance): Story 4.4, 6.1
- NFR-1.4 (Search Performance): Story 5.1, 6.1
- NFR-1.5 (File Upload Performance): Story 6.7

**NFR-2: Security**
- NFR-2.1 (Authentication Security): Existing + Story 6.8
- NFR-2.2 (Data Privacy): Story 6.2
- NFR-2.3 (Input Validation & Sanitization): Story 6.2, 6.6
- NFR-2.4 (Session Security): Story 6.8
- NFR-2.5 (File Storage Security): Story 1.2, 6.2

**NFR-3: Reliability**
- NFR-3.1 (Availability): Infrastructure (deployment)
- NFR-3.2 (Data Durability): Story 5.5 (backup documentation)
- NFR-3.3 (Error Handling): Story 6.5
- NFR-3.4 (Auto-Save Reliability): Story 4.4

**NFR-4: Usability**
- NFR-4.1 (Browser Compatibility): Story 6.3
- NFR-4.2 (Responsive Design): Story 6.3
- NFR-4.3 (Accessibility): Story 6.4
- NFR-4.4 (Visual Feedback): Story 6.5

**NFR-5: Maintainability**
- NFR-5.1 (Code Quality): Story 6.9 (testing), 6.10 (documentation)
- NFR-5.2 (Documentation): Story 6.10
- NFR-5.3 (Testing): Story 6.9

**NFR-6: Scalability**
- NFR-6.1 (Single-User Performance): Story 6.1
- NFR-6.2 (Concurrent Users): Story 6.1 (performance optimization)
- NFR-6.3 (Data Volume): Story 6.1

**NFR-7: Deployment & Operations**
- NFR-7.1 (Deployment): Story 6.10 (documentation)
- NFR-7.2 (Monitoring): Story 6.5 (error logging)
- NFR-7.3 (Backup & Recovery): Story 5.5

**NFR-8: Browser & Device Support**
- Covered by: Story 6.3 (responsive design), Story 6.4 (accessibility)

---

## Coverage Summary

**Total FRs:** 24 sub-requirements
**Total NFRs:** 8 major categories (28 sub-requirements)
**Total Stories:** 47

**Coverage Status:**
- ✅ All FRs covered by at least one story
- ✅ All NFRs covered by at least one story
- ✅ No orphaned requirements
- ✅ No orphaned stories

**Verification:**
- Every story maps to at least one FR or NFR
- Every FR/NFR maps to at least one story
- Complete bidirectional traceability established

---

## Usage Notes

**For Development:**
- Reference this matrix when implementing stories to understand which requirements are being fulfilled
- Use for validation during code review: "Does this PR satisfy the referenced FR/NFR?"

**For Testing:**
- Create test cases based on FR/NFR specifications
- Use story acceptance criteria as test scenarios
- Verify complete FR coverage through story completion

**For Validation:**
- Validate PRD changes don't orphan existing stories
- Validate new stories map to documented requirements
- Use for solutioning gate check validation

---

**Document Status:** ✅ Complete
**Last Validation:** 2025-11-10
**Next Review:** After architecture phase or when requirements change
