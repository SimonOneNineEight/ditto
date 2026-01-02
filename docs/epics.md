# ditto - Epic Breakdown

**Author:** Simon
**Date:** 2025-11-09
**Project Level:** 2 (Medium Complexity Brownfield)
**Target Scale:** Personal Use → Multi-User SaaS

---

## Overview

This document provides the complete epic and story breakdown for ditto, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

### Epic Structure Overview

**6 Epics** organized for incremental value delivery:

1. **Enhanced Application Management** - Complete the application tracking foundation with smart URL extraction
2. **Deep Interview Management** - Core differentiator enabling comprehensive interview lifecycle management
3. **Technical Assessment Tracking** - Prevent missed deadlines and track take-home projects
4. **Workflow Automation & Timeline** - At-a-glance visibility and automation
5. **Search, Discovery & Data Management** - Find anything instantly and trust data safety
6. **Polish, Performance & Production Readiness** - Reliable, fast, and delightful UX

**Sequencing Strategy:**
- **Phase 1:** Epics 1-2 (Foundation + Core Differentiator)
- **Phase 2:** Epics 3-4 (Value Expansion + Workflow)
- **Phase 3:** Epics 5-6 (Scale + Polish)

---

## Epic 1: Enhanced Application Management

**Goal:** Complete the application tracking foundation with smart URL extraction and document management, building on existing brownfield infrastructure to enable application capture in under 30 seconds and cross-device access.

**Value Proposition:** Users can capture job applications in under 30 seconds using URL extraction, store resumes/cover letters centrally, and access everything from any device.

---

### Story 1.1: Job URL Information Extraction Service

**Implements:** FR-1.2 (Create Application - URL Extraction)

As a job seeker,
I want to paste a job posting URL and have ditto automatically extract job details,
So that I can add applications in under 30 seconds without manual data entry.

**Acceptance Criteria:**

**Given** a valid job posting URL from supported platforms (LinkedIn, Indeed, Glassdoor, AngelList)
**When** I paste the URL into the application form
**Then** ditto extracts and auto-fills: job title, company name, job description, and requirements within 10 seconds

**And** if extraction fails or times out, I see a clear error message and can proceed with manual entry

**And** extracted data is cached for 24 hours to avoid re-scraping the same URL

**And** rate limiting prevents abuse (30 URLs per day per user)

**Prerequisites:** None (first story establishes new capability)

**Technical Notes:**
- Backend: Create `/api/jobs/extract-url` endpoint (Go + Gin)
- Implement web scraper with 10-second timeout
- Support HTML parsing for LinkedIn, Indeed, Glassdoor, AngelList job pages
- Store scraped data in cache (Redis or PostgreSQL with TTL)
- Return structured JSON: `{title, company, description, requirements, source_url}`
- Handle CORS and rate limiting
- Frontend: Add URL input field to application form with loading state

---

### Story 1.2: Cloud File Storage Infrastructure

**Implements:** FR-1.7 (Resume and Document Storage)

As a job seeker,
I want to upload and store my resumes and cover letters on ditto's infrastructure,
So that I can access my documents from any device without managing local files.

**Acceptance Criteria:**

**Given** I am viewing an application detail page
**When** I upload a resume or cover letter (PDF, DOCX, TXT, up to 5MB)
**Then** the file is securely stored in S3-compatible cloud storage with a unique identifier

**And** the file is linked to my application record in the database

**And** I can download the file from any device after logging in

**And** I can replace or delete uploaded files

**And** total storage is limited to 100MB per user with clear feedback when approaching limit

**Prerequisites:** None (infrastructure foundation)

**Technical Notes:**
- Backend: Implement S3-compatible storage client (AWS S3 or MinIO)
- Create database table: `files` (id, user_id, application_id, file_name, file_type, file_size, s3_key, uploaded_at)
- API endpoints:
  - `POST /api/files/upload` (multipart form data)
  - `GET /api/files/:id` (authenticated download with signed URL)
  - `DELETE /api/files/:id` (soft delete)
- Validate file type and size server-side
- Generate unique S3 keys (prevent collisions and guessing)
- Track per-user storage quota
- Frontend: File upload component with drag-drop, progress indicator, file list display

---

### Story 1.3: Application Form Integration with URL Extraction

**Implements:** FR-1.2 (Create Application - URL Extraction), FR-1.1 (Create Application - Manual Entry)

As a job seeker,
I want the application creation form to seamlessly integrate URL extraction with manual entry,
So that I can choose the fastest method for each application.

**Acceptance Criteria:**

**Given** I open the "Add Application" form
**When** I choose to paste a job URL
**Then** the form shows a URL input field with an "Extract" button

**And** clicking "Extract" triggers the extraction service and shows a loading state

**And** upon success, extracted data auto-fills the form fields (editable before saving)

**And** upon failure, I can manually fill in the fields without losing any entered data

**And** I can also skip URL extraction entirely and manually enter all fields from the start

**Prerequisites:** Story 1.1 (URL extraction service must exist)

**Technical Notes:**
- Frontend: Update ApplicationForm component (Next.js + React)
- Add toggle: "Paste URL" vs "Manual Entry"
- Integrate with `/api/jobs/extract-url` endpoint
- Handle loading, success, and error states with clear UI feedback
- Preserve form state during extraction (don't lose user input)
- Use optimistic UI updates for better UX

---

### Story 1.4: Resume and Cover Letter Upload UI

As a job seeker,
I want to upload resume and cover letter files directly from the application form,
So that I can keep track of which documents I sent to each company.

**Acceptance Criteria:**

**Given** I am creating or editing an application
**When** I click "Upload Resume" or "Upload Cover Letter"
**Then** a file picker opens allowing me to select PDF, DOCX, or TXT files

**And** selected files show upload progress and confirmation upon completion

**And** uploaded files appear as downloadable links in the application detail view

**And** I can replace an uploaded file by uploading a new one (old file is deleted)

**And** I can delete uploaded files with a confirmation prompt

**And** file size validation prevents uploads >5MB with clear error message

**Prerequisites:** Story 1.2 (file storage infrastructure must exist)

**Technical Notes:**
- Frontend: Create FileUpload component with drag-drop support
- Integrate with `/api/files/upload` endpoint
- Show upload progress bar (use axios or fetch with progress events)
- Display uploaded files with download and delete actions
- Handle errors gracefully (network issues, file size, unsupported types)
- Update application record to reference file IDs

---

### Story 1.5: Enhanced Application List with Filtering

As a job seeker,
I want to filter and search my applications by status, company, and date range,
So that I can quickly find specific applications without scrolling through a long list.

**Acceptance Criteria:**

**Given** I have multiple applications in my account
**When** I apply filters (status dropdown, date range picker, company search)
**Then** the application list updates to show only matching applications

**And** multiple filters work together (AND logic)

**And** I can clear all filters with one click to see the full list again

**And** filter state persists during the session (survives page refresh)

**And** the application count updates to reflect filtered results

**Prerequisites:** Existing application list view (brownfield)

**Technical Notes:**
- Frontend: Add filter controls above ApplicationTable component
- Implement client-side filtering for <100 applications, server-side for larger datasets
- Use URL query parameters to persist filter state
- Update existing `/api/applications` endpoint to accept filter params: `?status=Interview&company=Google&date_from=2025-01-01`
- Display active filters as removable chips
- Optimize database queries with indexes on status, company, application_date

---

### Story 1.6: Storage Quota Management and Visibility

As a job seeker,
I want to see how much storage I've used for uploaded files,
So that I can manage my quota and delete old files if needed.

**Acceptance Criteria:**

**Given** I have uploaded files to ditto
**When** I view my profile or settings page
**Then** I see a storage usage indicator showing used/total storage (e.g., "45 MB / 100 MB")

**And** the indicator updates in real-time after uploading or deleting files

**And** if I approach the limit (>90%), I see a warning message

**And** if I reach the limit, file uploads are blocked with a clear error: "Storage limit reached. Please delete old files."

**And** I can see a list of all my uploaded files sorted by size to identify large files

**Prerequisites:** Story 1.2 (file storage infrastructure)

**Technical Notes:**
- Backend: Add endpoint `GET /api/users/storage-stats` returning `{used_bytes, total_bytes, file_count}`
- Calculate total from `files` table grouped by user_id
- Frontend: Create StorageQuotaWidget component with progress bar
- Display in user profile/settings page
- Show file list with sizes for management
- Real-time updates after upload/delete operations

---

## Epic 2: Deep Interview Management (Core Differentiator)

**Goal:** Enable comprehensive interview lifecycle management from preparation through post-interview reflection, creating seamless context flow between rounds that makes ditto uniquely valuable.

**Value Proposition:** Users can capture everything that happens in interviews (questions, answers, feedback) and seamlessly access previous round context when preparing for the next round - eliminating the need for Excel/Notion during the most critical phase of job searching.

**The Magic Moment:** When preparing for Round 2, users open ditto and see Round 1 notes with zero additional clicks - questions asked, how they answered, interviewer feedback, company research - all visible on one page, ready to inform their next conversation.

---

### Story 2.1: Interview Database Schema and API Foundation

As a developer,
I want a robust database schema and API layer for interview management,
So that interview data is properly structured and accessible for all interview features.

**Acceptance Criteria:**

**Given** the existing PostgreSQL database
**When** the migration runs
**Then** a new `interviews` table is created with fields: id, user_id, application_id, round_number, interview_type, scheduled_date, scheduled_time, duration_minutes, outcome, created_at, updated_at, deleted_at

**And** a new `interviewers` table is created with: id, interview_id, name, role, created_at

**And** a new `interview_questions` table is created with: id, interview_id, question_text, answer_text, order, created_at

**And** a new `interview_notes` table is created with: id, interview_id, note_type (preparation/research/feedback/reflection), content (rich text), created_at, updated_at

**And** foreign key constraints ensure data integrity (interviews → applications, interviewers → interviews)

**And** indexes are created on: user_id, application_id, scheduled_date for query performance

**Prerequisites:** None (database foundation)

**Technical Notes:**
- Backend: Create migration file for interview schema
- Use soft deletes (deleted_at) for all tables
- Add auto-timestamps (created_at, updated_at)
- Interview types enum: phone_screen, technical, behavioral, panel, onsite, other
- Note types enum: preparation, company_research, feedback, reflection, general
- Ensure existing application workflow isn't impacted

---

### Story 2.2: Create Interview Round - Basic API

As a job seeker,
I want to create a new interview round for an application,
So that I can start tracking interview details.

**Acceptance Criteria:**

**Given** I have an existing application
**When** I submit a request to create an interview with: application_id, round_number, interview_type, scheduled_date, scheduled_time
**Then** a new interview record is created in the database

**And** round_number auto-increments based on existing interviews for that application (Round 1, 2, 3...)

**And** the API returns the created interview with ID and all fields

**And** validation ensures required fields are present (400 error if missing)

**And** validation ensures application belongs to the authenticated user (403 forbidden otherwise)

**And** default date is today if not specified

**Prerequisites:** Story 2.1 (database schema must exist)

**Technical Notes:**
- Backend: Create `POST /api/interviews` endpoint
- Repository layer: `CreateInterview(interview *Interview) error`
- Handler validates user owns the application
- Auto-calculate round_number: `SELECT MAX(round_number) FROM interviews WHERE application_id = ? AND deleted_at IS NULL`
- Return 201 Created with interview JSON
- Use transaction to ensure atomicity

---

### Story 2.3: Interview Form UI - Quick Capture

As a job seeker,
I want a streamlined form to quickly capture initial interview details,
So that I can create the interview record with minimal friction right after scheduling.

**Acceptance Criteria:**

**Given** I am viewing an application detail page
**When** I click "Add Interview Round"
**Then** a modal or dedicated page opens with an interview creation form

**And** the form shows: Round number (auto-filled), Interview type (dropdown), Date (date picker, defaults to today), Time (time picker), Duration (optional number input)

**And** clicking "Create Interview" saves the record and shows success confirmation

**And** upon success, I am navigated to the interview detail page to add more information

**And** validation prevents submission with missing required fields

**And** loading state shows during API call

**Prerequisites:** Story 2.2 (API endpoint must exist)

**Technical Notes:**
- Frontend: Create InterviewFormModal component (or dedicated page)
- Use shadcn/ui components: Dialog, DatePicker, Select, Input
- Integrate with `POST /api/interviews`
- Show optimistic UI update (interview appears immediately)
- Handle errors gracefully with toast notifications
- Round number is auto-calculated server-side, displayed read-only in form

---

### Story 2.4: Interview Detail View - Structured Data Display

As a job seeker,
I want to view an interview's structured information in a clear, organized layout,
So that I can see at a glance when the interview is, who's interviewing me, and key details.

**Acceptance Criteria:**

**Given** I have created an interview
**When** I navigate to the interview detail page
**Then** I see a header showing: Round number, Interview type, Scheduled date/time, Duration

**And** I see sections for: Interviewers, Questions Asked, My Answers, Feedback Received, Outcome/Next Steps

**And** each section is collapsible/expandable for focused reading

**And** empty sections show placeholder text: "No interviewers added yet" with an "Add" button

**And** I can click "Edit" to modify any structured field (date, type, duration)

**Prerequisites:** Story 2.2 (interview API), Story 2.3 (interview creation)

**Technical Notes:**
- Frontend: Create InterviewDetailPage component
- Fetch interview data: `GET /api/interviews/:id`
- Layout: Header with key info, tabbed or sectioned content below
- Use Accordion or Collapsible components for sections
- Inline editing for structured fields (date, type, duration)
- Lazy load questions/notes in separate API calls if needed for performance

---

### Story 2.5: Add Interviewers to Interview

As a job seeker,
I want to add interviewer names and roles to an interview,
So that I can remember who I spoke with and reference them in follow-ups.

**Acceptance Criteria:**

**Given** I am viewing an interview detail page
**When** I click "Add Interviewer" in the Interviewers section
**Then** input fields appear for: Name (required), Role (optional, e.g., "Engineering Manager")

**And** I can add multiple interviewers by clicking "Add Another"

**And** clicking "Save" creates interviewer records linked to this interview

**And** saved interviewers display as a list with edit and delete options

**And** I can edit an interviewer's name or role inline

**And** I can delete an interviewer with confirmation prompt

**Prerequisites:** Story 2.1 (database schema), Story 2.4 (interview detail view)

**Technical Notes:**
- Backend:
  - `POST /api/interviews/:id/interviewers` (create)
  - `PUT /api/interviewers/:id` (update)
  - `DELETE /api/interviewers/:id` (soft delete)
- Frontend: InterviewerList component with add/edit/delete
- Support bulk add (multiple interviewers in one save)
- Optimistic UI updates
- Validation: name required, role optional

---

### Story 2.6: Questions and Answers - Dynamic List Management

As a job seeker,
I want to add questions I was asked and how I answered them,
So that I can review my performance and prepare better for future rounds.

**Acceptance Criteria:**

**Given** I am viewing an interview detail page
**When** I click "Add Question" in the Questions section
**Then** a new question entry appears with: Question field (textarea), Answer field (textarea)

**And** I can add multiple questions by clicking "Add Another Question"

**And** questions are numbered automatically (Q1, Q2, Q3...)

**And** I can reorder questions via drag-and-drop or up/down arrows

**And** clicking "Save" persists all questions and answers to the database

**And** auto-save kicks in after 30 seconds of inactivity

**And** I can delete a question with confirmation

**Prerequisites:** Story 2.1 (database schema), Story 2.4 (interview detail view)

**Technical Notes:**
- Backend:
  - `POST /api/interviews/:id/questions` (bulk create/update)
  - `DELETE /api/interview-questions/:id` (soft delete)
  - Store order field for sorting
- Frontend: QuestionsList component
- Use textarea with auto-resize for question/answer fields
- Implement auto-save with debounce (30s)
- Drag-drop using react-beautiful-dnd or similar
- Show "Saving..." indicator during auto-save

---

### Story 2.7: Rich Text Notes - Preparation Area

As a job seeker,
I want a flexible rich text area to write company research, practice answers, and general preparation notes,
So that I can keep all my prep materials in one place without rigid structure.

**Acceptance Criteria:**

**Given** I am viewing an interview detail page
**When** I navigate to the "Preparation Notes" tab or section
**Then** I see a rich text editor with formatting options: bold, italic, lists, headers, links

**And** I can type and format content freely (like Google Docs or Notion)

**And** content auto-saves every 30 seconds with visual "Saving..." / "Saved" indicator

**And** I can add multiple note sections: "Company Research", "Practice Answers", "General Notes", "Feedback Received"

**And** pasting from Word or Google Docs preserves basic formatting

**And** content is stored as HTML in the database (sanitized to prevent XSS)

**Prerequisites:** Story 2.1 (database schema for interview_notes), Story 2.4 (interview detail view)

**Technical Notes:**
- Frontend: Integrate rich text editor (TipTap, Slate, or Quill)
- Multiple note sections, each with note_type enum
- Backend:
  - `POST /api/interviews/:id/notes` (create note)
  - `PUT /api/interview-notes/:id` (update note content)
  - Sanitize HTML server-side (use bluemonday or similar)
- Auto-save with 30s debounce
- Max content size: 50KB per note section
- Show visual diff or version indicator if content changes

---

### Story 2.8: File Uploads for Interview Prep Documents

As a job seeker,
I want to upload prep documents (PDFs, Word docs) to an interview,
So that I can attach existing research, job descriptions, or study materials.

**Acceptance Criteria:**

**Given** I am viewing an interview detail page
**When** I click "Upload Document" in the Preparation section
**Then** a file picker opens allowing PDF, DOCX, TXT files up to 5MB

**And** uploaded files are stored and linked to this specific interview

**And** uploaded files appear as downloadable links with file name and size

**And** I can delete uploaded files with confirmation

**And** file uploads count toward my overall storage quota

**Prerequisites:** Story 1.2 (file storage infrastructure), Story 2.4 (interview detail view)

**Technical Notes:**
- Backend: Reuse `/api/files/upload` endpoint, add interview_id parameter
- Update `files` table to support interview_id (nullable FK)
- Frontend: Reuse FileUpload component
- Display uploaded files in interview detail view
- Filter files by interview_id when loading interview details

---

### Story 2.9: Multi-Round Context - Previous Rounds Display

As a job seeker,
I want to see all previous interview rounds when viewing or editing a current round,
So that I can build continuous context and prepare effectively for the next stage.

**Acceptance Criteria:**

**Given** I am viewing an interview (Round 2 or higher) for an application
**When** the page loads
**Then** I see a sidebar or collapsible section showing all previous rounds for this application

**And** previous rounds display: round number, type, date, interviewer names

**And** I can click any previous round to expand and view: questions asked, my answers, feedback received, prep notes

**And** previous rounds are read-only (can't edit from this view, must navigate to that round's detail page)

**And** a timeline visualization shows days between rounds (e.g., "5 days after Round 1")

**And** company research notes from previous rounds are accessible

**Prerequisites:** Story 2.4 (interview detail view), Stories 2.5-2.8 (questions, notes, interviewers)

**Technical Notes:**
- Backend: `GET /api/interviews?application_id=X` returns all interviews sorted by round_number
- Frontend: PreviousRoundsPanel component in InterviewDetailPage
- Load all rounds for application on page load
- Display in collapsible Accordion
- Show timeline (calculate days between scheduled_date)
- Make previous rounds read-only with "View Full Details" link to that round's page
- Highlight current round in list

---

### Story 2.10: Interview List and Timeline View

As a job seeker,
I want to see all my upcoming interviews across all applications in chronological order,
So that I can prepare for what's coming next and never miss an interview.

**Acceptance Criteria:**

**Given** I have multiple interviews scheduled
**When** I navigate to the Timeline or Calendar view
**Then** I see all upcoming interviews sorted by date/time

**And** each interview shows: company name, job title, round number, interview type, date/time, days until interview

**And** overdue interviews (past date) are highlighted in red

**And** interviews today are highlighted in yellow/orange

**And** interviews in the next 7 days are highlighted in blue

**And** clicking an interview navigates to its detail page

**And** I can filter by: Today, This Week, This Month, All Upcoming

**Prerequisites:** Story 2.2 (interview API), Story 2.4 (interview detail view)

**Technical Notes:**
- Backend: `GET /api/timeline` or enhance `GET /api/interviews` with filters
- Return interviews with application details (JOIN)
- Frontend: TimelineView component
- Sort by scheduled_date ASC
- Color coding based on date proximity
- Support date range filters
- Show countdown (e.g., "in 3 days", "tomorrow", "in 2 hours")

---

### Story 2.11: Update and Delete Interview Operations

As a job seeker,
I want to edit interview details or delete an interview if plans change,
So that my records stay accurate.

**Acceptance Criteria:**

**Given** I am viewing an interview detail page
**When** I click "Edit" on any field (date, type, duration, outcome)
**Then** inline editing allows me to update the field

**And** changes save immediately on blur or Enter key

**And** validation prevents invalid data (e.g., date in the past for upcoming interviews shows warning but allows)

**And** I can click "Delete Interview" to soft-delete the entire interview

**And** deletion requires confirmation: "Are you sure? This will delete all questions, notes, and interviewers."

**And** deleted interviews are hidden from all views but recoverable from database

**Prerequisites:** Story 2.2 (interview API), Story 2.4 (interview detail view)

**Technical Notes:**
- Backend:
  - `PUT /api/interviews/:id` (update interview)
  - `DELETE /api/interviews/:id` (soft delete)
  - Cascade soft delete to interviewers, questions, notes (set deleted_at)
- Frontend: Inline editing for structured fields
- Confirmation dialog for delete
- Optimistic UI updates
- Handle errors gracefully (show toast, revert on failure)

---

### Story 2.12: Interview Performance Self-Assessment

As a job seeker,
I want to add my own performance assessment after each interview,
So that I can track how I felt I did and identify patterns over time.

**Acceptance Criteria:**

**Given** I am viewing an interview detail page
**When** I navigate to the "Self-Assessment" section
**Then** I see fields for: Overall feeling (dropdown: Excellent/Good/Okay/Poor), What went well (textarea), What could improve (textarea), Confidence level (1-5 scale)

**And** I can save my self-assessment independently from other interview data

**And** self-assessment is optional (can skip entirely)

**And** auto-save applies after 30 seconds of inactivity

**Prerequisites:** Story 2.1 (add fields to interviews table or create assessment table), Story 2.4 (interview detail view)

**Technical Notes:**
- Backend: Add fields to `interviews` table: overall_feeling (enum), went_well (text), could_improve (text), confidence_level (int 1-5)
- OR create separate `interview_assessments` table if more complex
- Frontend: SelfAssessmentForm component
- Use Select for feeling, Slider for confidence, Textarea for free text
- Auto-save with debounce
- Display in Interview detail view as collapsible section

---


## Epic 3: Technical Assessment Tracking

**Goal:** Prevent missed deadlines and track take-home projects from assignment through submission, ensuring technical assessments never fall through the cracks.

**Value Proposition:** Users can track all technical assessments with clear deadline visibility, organized submission tracking, and integration with the timeline view to prevent missed opportunities.

---

### Story 3.1: Assessment Database Schema and API Foundation

As a developer,
I want a robust database schema for technical assessments,
So that assessment data is properly structured and linked to applications.

**Acceptance Criteria:**

**Given** the existing PostgreSQL database
**When** the migration runs
**Then** a new `assessments` table is created with fields: id, user_id, application_id, assessment_type, title, due_date, status, instructions (text), requirements (text), created_at, updated_at, deleted_at

**And** a new `assessment_submissions` table is created with: id, assessment_id, submission_type (github/file/notes), github_url, file_id (FK to files table), notes (text), submitted_at, created_at

**And** foreign key constraints ensure data integrity (assessments → applications)

**And** indexes are created on: user_id, application_id, due_date, status for query performance

**And** assessment_type enum includes: take_home_project, live_coding, system_design, data_structures, case_study, other

**And** status enum includes: not_started, in_progress, submitted, reviewed

**Prerequisites:** None (database foundation)

**Technical Notes:**
- Backend: Create migration file for assessment schema
- Use soft deletes (deleted_at) for all tables
- Add auto-timestamps
- Store instructions as text (can be rich later)
- submission_type enum: github, file_upload, notes
- Ensure existing application workflow isn't impacted

---

### Story 3.2: Create Assessment API and Basic CRUD

As a job seeker,
I want to create and manage technical assessments for my applications,
So that I can track take-home projects and coding challenges.

**Acceptance Criteria:**

**Given** I have an existing application
**When** I create an assessment with: application_id, assessment_type, title, due_date, instructions
**Then** a new assessment record is created in the database

**And** the API returns the created assessment with ID and all fields

**And** validation ensures required fields are present (type, due_date minimum)

**And** validation ensures application belongs to the authenticated user

**And** I can retrieve all assessments for an application via `GET /api/assessments?application_id=X`

**And** I can update assessment details via `PUT /api/assessments/:id`

**And** I can delete (soft delete) an assessment via `DELETE /api/assessments/:id`

**Prerequisites:** Story 3.1 (database schema must exist)

**Technical Notes:**
- Backend: Create endpoints:
  - `POST /api/assessments` (create)
  - `GET /api/assessments?application_id=X` (list)
  - `GET /api/assessments/:id` (get one)
  - `PUT /api/assessments/:id` (update)
  - `DELETE /api/assessments/:id` (soft delete)
- Repository layer with standard CRUD operations
- Validate user owns application before creating assessment
- Return 201 Created, handle errors with proper status codes

---

### Story 3.3: Assessment Creation and Detail UI

As a job seeker,
I want a form to create assessments and a detail view to manage them,
So that I can easily add and track technical challenges.

**Acceptance Criteria:**

**Given** I am viewing an application detail page
**When** I click "Add Assessment"
**Then** a modal or form opens with fields: Assessment type (dropdown), Title, Due date (date picker), Instructions (textarea), Requirements (textarea)

**And** clicking "Create" saves the assessment and shows success confirmation

**And** the assessment appears in the application's assessment list

**And** clicking an assessment opens the assessment detail page showing: type, title, due date, countdown, status badge, instructions, requirements

**And** I can edit any field inline or via edit button

**And** countdown displays time remaining ("5 days left", "Due tomorrow", "Overdue by 2 days")

**Prerequisites:** Story 3.2 (API endpoints must exist)

**Technical Notes:**
- Frontend: Create AssessmentFormModal and AssessmentDetailPage components
- Use shadcn/ui components: Dialog, DatePicker, Select, Textarea
- Integrate with assessment API endpoints
- Countdown calculation from due_date to current date
- Color coding: green (>3 days), yellow (1-3 days), red (<1 day or overdue)
- Show status badge prominently

---

### Story 3.4: Assessment Status Management and Workflow

As a job seeker,
I want to update assessment status as I work through it,
So that I can track my progress from start to submission.

**Acceptance Criteria:**

**Given** I am viewing an assessment detail page
**When** I click the status dropdown
**Then** I can select: Not Started, In Progress, Submitted, Reviewed

**And** status updates immediately via `PATCH /api/assessments/:id/status`

**And** status badge color changes: gray (not started), blue (in progress), green (submitted), purple (reviewed)

**And** when I mark as "Submitted", I'm prompted to add submission details

**And** status history is tracked (optional: show when status changed)

**Prerequisites:** Story 3.2 (API), Story 3.3 (detail UI)

**Technical Notes:**
- Backend: Add `PATCH /api/assessments/:id/status` endpoint for quick status updates
- Frontend: Status dropdown with color-coded badges
- Trigger submission form when marking as "Submitted"
- Optimistic UI updates
- Optional: Track status changes in separate table for history

---

### Story 3.5: Submission Tracking - GitHub Links and Notes

As a job seeker,
I want to record my assessment submission with GitHub links or notes,
So that I have a record of what I submitted and when.

**Acceptance Criteria:**

**Given** I am viewing an assessment detail page
**When** I click "Add Submission" or mark status as "Submitted"
**Then** a submission form appears with fields: Submission type (GitHub/File/Notes), GitHub URL (if GitHub), Notes (textarea)

**And** clicking "Save Submission" creates a submission record with automatic timestamp

**And** submission appears in the assessment detail view with: type, GitHub link (clickable), notes, submitted timestamp

**And** I can add multiple submissions (e.g., multiple iterations or revisions)

**And** GitHub URL validation ensures it's a valid URL format

**And** notes support rich text for detailed submission descriptions

**Prerequisites:** Story 3.1 (database schema), Story 3.3 (detail UI)

**Technical Notes:**
- Backend:
  - `POST /api/assessments/:id/submissions` (create submission)
  - Auto-set submitted_at timestamp
- Frontend: SubmissionForm component
- Support multiple submission types
- Validate GitHub URL format client-side
- Display all submissions chronologically in detail view
- Link to GitHub repo (open in new tab)

---

### Story 3.6: Submission Tracking - File Uploads

As a job seeker,
I want to upload files as part of my assessment submission,
So that I can attach deliverables like PDFs, code archives, or presentation slides.

**Acceptance Criteria:**

**Given** I am adding a submission to an assessment
**When** I select "File Upload" as submission type
**Then** I can upload files (PDF, ZIP, DOCX, up to 10MB for assessments)

**And** uploaded files are stored and linked to the submission record

**And** uploaded files appear as downloadable links in the submission view

**And** file uploads count toward my overall storage quota

**And** I can delete uploaded submission files with confirmation

**Prerequisites:** Story 1.2 (file storage infrastructure), Story 3.5 (submission tracking)

**Technical Notes:**
- Backend: Reuse `/api/files/upload` endpoint, link via assessment_submissions.file_id
- Update file size limit to 10MB for assessment submissions (configurable)
- Frontend: Reuse FileUpload component
- Update `files` table to track assessment submission files
- Display in submission detail view

---

### Story 3.7: Assessment Deadline Integration with Timeline

As a job seeker,
I want to see upcoming assessment deadlines in my timeline view,
So that I never miss a due date.

**Acceptance Criteria:**

**Given** I have assessments with due dates
**When** I navigate to the Timeline view
**Then** I see assessments listed alongside interviews, sorted by date

**And** each assessment shows: company name, assessment type, title, due date, countdown, status

**And** overdue assessments are highlighted in red

**And** assessments due within 3 days are highlighted in orange

**And** clicking an assessment navigates to its detail page

**And** I can filter timeline to show only assessments or only interviews

**Prerequisites:** Story 2.10 (timeline view exists), Story 3.2 (assessment API)

**Technical Notes:**
- Backend: Update `GET /api/timeline` to include assessments
- JOIN assessments with applications to get company/job info
- Sort by due_date for assessments, scheduled_date for interviews
- Frontend: Update TimelineView to render both interviews and assessments
- Use different icons/colors to distinguish types
- Support filter: All / Interviews Only / Assessments Only

---

### Story 3.8: Assessment List View in Application Detail

As a job seeker,
I want to see all assessments for an application in one place,
So that I can track multiple coding challenges or assignments for the same job.

**Acceptance Criteria:**

**Given** I am viewing an application detail page
**When** the page loads
**Then** I see an "Assessments" section showing all assessments for this application

**And** each assessment displays: type badge, title, due date, countdown, status badge

**And** assessments are sorted by due date (earliest first)

**And** clicking an assessment navigates to its detail page

**And** I can quick-update status via dropdown without leaving application page

**And** "Add Assessment" button is prominently displayed

**Prerequisites:** Story 3.2 (API), Story 3.3 (detail UI)

**Technical Notes:**
- Frontend: Create AssessmentList component for ApplicationDetailPage
- Fetch assessments: `GET /api/assessments?application_id=X`
- Display as cards or list items with key info
- Inline status dropdown for quick updates
- Color-coded countdown and status badges
- Empty state: "No assessments yet" with CTA to add

---

## Epic 4: Workflow Automation & Timeline

**Goal:** Provide at-a-glance visibility into all job search activities and automate repetitive tasks to reduce cognitive load and prevent missed opportunities.

**Value Proposition:** Users get a command center dashboard showing what needs attention, a timeline preventing missed deadlines, automatic reminders, and auto-save protecting their work - making ditto feel reliable and effortless.

---

### Story 4.1: Dashboard Statistics and Overview

As a job seeker,
I want a dashboard showing my application statistics at a glance,
So that I can quickly understand my job search progress without digging through lists.

**Acceptance Criteria:**

**Given** I have applications in various statuses
**When** I navigate to the dashboard (home page)
**Then** I see application count by status: Saved (X), Applied (Y), Interview (Z), Offer (A), Rejected (B)

**And** I see statistics cards showing: Total applications, Active applications (Saved + Applied + Interview), Success rate (Offers / Total)

**And** I see a visual breakdown (chart or progress bars) of applications by status

**And** clicking any status card filters the application list to that status

**And** dashboard loads within 2 seconds

**Prerequisites:** Existing application data (brownfield)

**Technical Notes:**
- Backend: Create `GET /api/dashboard/stats` endpoint
- Query: `SELECT status, COUNT(*) FROM applications WHERE user_id = ? AND deleted_at IS NULL GROUP BY status`
- Calculate derived metrics: total, active, success_rate
- Frontend: Create Dashboard component with stat cards
- Use shadcn/ui Card components for stats
- Optional: Add simple chart (recharts or similar)
- Cache stats for 5 minutes to reduce DB queries

---

### Story 4.2: Dashboard Quick Actions

As a job seeker,
I want quick action buttons on my dashboard,
So that I can jump into common tasks without navigating through menus.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** the page loads
**Then** I see prominent quick action buttons: "Add Application", "Log Interview"

**And** clicking "Add Application" opens the application creation modal/form

**And** clicking "Log Interview" opens a dialog to select which application to add an interview to

**And** quick actions are visually prominent (primary CTAs)

**And** actions are accessible via keyboard shortcuts (optional enhancement)

**Prerequisites:** Existing application and interview creation flows

**Technical Notes:**
- Frontend: QuickActions component on dashboard
- Use shadcn/ui Button components with primary styling
- "Log Interview" flow: opens application selector → then interview form
- Position prominently at top of dashboard
- Optional: Add keyboard shortcuts (Cmd+N for new application, etc.)

---

### Story 4.3: Upcoming Items Widget - Next 5 Events

As a job seeker,
I want to see my next 5 upcoming interviews and assessment deadlines on the dashboard,
So that I always know what's coming next without opening the timeline.

**Acceptance Criteria:**

**Given** I have upcoming interviews and assessments
**When** I view the dashboard
**Then** I see an "Upcoming" widget showing the next 5 events (interviews + assessments) sorted chronologically

**And** each event shows: type icon, company name, event description, date/time, countdown

**And** overdue items appear first with red highlighting

**And** clicking an event navigates to its detail page

**And** if no upcoming events, show encouraging message: "No upcoming events - time to apply!"

**Prerequisites:** Story 2.10 (timeline API), Story 3.7 (assessment timeline integration)

**Technical Notes:**
- Backend: Enhance `GET /api/timeline` or create `GET /api/dashboard/upcoming?limit=5`
- Merge interviews and assessments, sort by date ASC, limit 5
- Frontend: UpcomingWidget component on dashboard
- Display as compact list with icons differentiating types
- Color code by urgency (red: overdue, orange: <3 days, blue: upcoming)
- Link to full timeline view

---

### Story 4.4: Auto-Save Infrastructure for Rich Text Content

As a job seeker,
I want all my notes and rich text content to auto-save,
So that I never lose work even if my browser crashes or I forget to click save.

**Acceptance Criteria:**

**Given** I am editing rich text content (interview notes, prep materials, assessment notes)
**When** I stop typing for 30 seconds
**Then** content automatically saves to the server

**And** a visual indicator shows "Saving..." during the save request

**And** the indicator changes to "Saved" with timestamp after successful save

**And** if save fails, indicator shows "Save failed - retry" with retry button

**And** auto-save only triggers if content has changed (no unnecessary saves)

**And** multiple rapid edits are debounced into a single save after 30s of inactivity

**Prerequisites:** Stories 2.7 (rich text notes), 3.5 (assessment notes)

**Technical Notes:**
- Frontend: Create useAutoSave hook with 30s debounce
- Track content changes via hash or dirty flag
- Show save status indicator component in editor toolbar
- Handle network errors gracefully (queue failed saves, retry)
- Use optimistic UI (assume save succeeds, revert on error)
- Store last saved timestamp in state
- Backend: Existing PUT endpoints for notes, ensure idempotent

---

### Story 4.5: In-App Notification Center with Configurable Preferences

As a job seeker,
I want an in-app notification center showing all my reminders and alerts with configurable preferences,
So that I can see important notifications even if browser notifications are disabled and control what reminders I receive.

**Acceptance Criteria:**

**Given** I have upcoming events or system notifications
**When** I click the notification bell icon in the navbar
**Then** a dropdown opens showing unread notifications

**And** notifications include: interview reminders, assessment deadlines, system alerts

**And** each notification shows: icon, message, timestamp, read/unread status

**And** clicking a notification marks it as read and navigates to relevant page

**And** I can mark all as read with one click

**And** notification count badge appears on bell icon when unread notifications exist

**And** in settings/preferences, I can configure: reminder timing (24h, 1h, 3d for assessments, custom), notification types to receive

**Prerequisites:** Story 2.10 (interview timeline), Story 3.7 (assessment timeline)

**Technical Notes:**
- Backend:
  - Create `notifications` table: id, user_id, type, title, message, link, read, created_at
  - Create `user_notification_preferences` table: user_id, interview_24h, interview_1h, assessment_3d, assessment_1d, assessment_1h
  - Endpoints:
    - `GET /api/notifications` (list, filter by read/unread)
    - `PATCH /api/notifications/:id/read` (mark as read)
    - `PATCH /api/notifications/mark-all-read`
    - `GET /api/users/notification-preferences`
    - `PUT /api/users/notification-preferences`
- Frontend:
  - NotificationCenter component in navbar
  - Use shadcn/ui DropdownMenu and Badge
  - NotificationPreferences component in user settings
  - Show unread count on bell icon
  - Auto-refresh every 60s or use polling

**Note:** Browser push notifications deferred to post-MVP. In-app notifications provide sufficient reminder functionality for MVP.

---

### Story 4.6: Timeline View Enhancements - Filters and Date Ranges

As a job seeker,
I want enhanced filtering and view options on the timeline,
So that I can focus on what's most relevant right now.

**Acceptance Criteria:**

**Given** I am viewing the timeline
**When** I apply filters
**Then** I can filter by: Type (All / Interviews / Assessments), Time range (Today / This Week / This Month / All Upcoming)

**And** events are color-coded: Interviews (blue), Assessments (orange), Overdue (red)

**And** events are sorted chronologically with date grouping (Today, Tomorrow, This Week, Later)

**And** filter selections persist across page refreshes (URL query params)

**And** clicking any event navigates to its detail page

**And** overdue items are highlighted in red at the top

**Prerequisites:** Story 2.10 (timeline exists), Story 3.7 (assessments in timeline)

**Technical Notes:**
- Frontend: Add filter controls above timeline
- Use URL query parameters: `?type=interviews&range=week`
- Group events by date buckets: Today, Tomorrow, This Week, Later
- Color coding via CSS classes based on type and due date
- Store filter state in URL for shareability
- Backend: Ensure `GET /api/timeline` supports type and date range filters
- Optimize queries with proper indexes

---

## Epic 4 Summary

**Total Stories:** 6 (reduced from 7 - browser push notifications deferred to post-MVP)

**Delivered Capabilities:**
- Dashboard with statistics and quick actions
- Auto-save infrastructure protecting user work
- In-app notification center with reminders
- Enhanced timeline with filters and date ranges

---

## Epic 5: Search, Discovery & Data Management

**Goal:** Enable users to find anything instantly as their data grows and trust that their data is safe, backed up, and exportable.

**Value Proposition:** Users can quickly locate applications, interviews, or notes through powerful search, filter large datasets efficiently, and have confidence their job search data is protected and portable.

---

### Story 5.1: Global Search - Backend Infrastructure

As a developer,
I want a robust search infrastructure that can query across multiple entities,
So that users can find anything quickly regardless of where it's stored.

**Acceptance Criteria:**

**Given** the existing database schema
**When** implementing search functionality
**Then** database indexes are created on searchable fields: applications.company, applications.job_title, interviews.questions, interview_notes.content

**And** a search endpoint `GET /api/search?q={query}` is created that queries across: applications (company, job_title, description), interviews (questions, answers), interview_notes (content), assessments (title, instructions)

**And** search uses full-text search or LIKE queries with proper indexing

**And** results are ranked by relevance (exact matches first, then partial)

**And** search supports minimum 3 characters to prevent performance issues

**And** results are limited to 50 per entity type, grouped by type

**And** search queries execute within 1 second for datasets up to 1000 records

**Prerequisites:** Existing database schema from Epics 1-3

**Technical Notes:**
- Backend: Create `GET /api/search` endpoint
- Use PostgreSQL full-text search (tsvector/tsquery) or ILIKE with indexes
- Query structure: UNION across tables, GROUP BY type
- Add GIN indexes on text columns for performance
- Return format: `{applications: [], interviews: [], assessments: [], notes: []}`
- Sanitize search query to prevent SQL injection
- Consider using ElasticSearch for future if dataset grows (post-MVP)

---

### Story 5.2: Global Search UI with Grouped Results

As a job seeker,
I want to search across all my data from one search bar,
So that I can quickly find applications, interviews, or notes without remembering where I stored them.

**Acceptance Criteria:**

**Given** I have data in applications, interviews, and assessments
**When** I enter a search query (minimum 3 characters) in the global search bar
**Then** I see results grouped by type: Applications, Interviews, Assessments, Notes

**And** each result shows: title/company, snippet of matching text, last updated date

**And** search results appear within 1 second

**And** I can click any result to navigate to that item's detail page

**And** if no results found, show helpful message: "No results found for '{query}'. Try different keywords."

**And** search bar is accessible from the navbar on all pages

**And** recent searches are saved locally (optional enhancement)

**Prerequisites:** Story 5.1 (search backend)

**Technical Notes:**
- Frontend: Create GlobalSearch component in navbar
- Use shadcn/ui Command or ComboBox component
- Debounce search input (300ms) to reduce API calls
- Display results in grouped sections with headers
- Highlight matching text in results (bold or yellow background)
- Show loading state while searching
- Clear button to reset search
- Keyboard navigation (arrow keys to navigate results, Enter to select)

---

### Story 5.3: Advanced Application Filtering and Sorting

As a job seeker,
I want advanced filtering and sorting options for my application list,
So that I can find specific applications when I have hundreds of entries.

**Acceptance Criteria:**

**Given** I have a large number of applications
**When** I apply filters on the application list page
**Then** I can filter by: Status (multi-select), Date range (from/to dates), Company (search/select), Has interviews (yes/no), Has assessments (yes/no)

**And** I can sort by: Date (newest/oldest), Company name (A-Z), Status, Last updated

**And** multiple filters combine with AND logic

**And** I can save filter presets: "Active Applications", "Need Follow-up", "This Month" (optional)

**And** filter state persists in URL for sharing and bookmarking

**And** I can clear all filters with one click

**And** filtered count shows: "Showing 15 of 127 applications"

**Prerequisites:** Story 1.5 (basic filtering exists), existing application list

**Technical Notes:**
- Frontend: Enhance ApplicationList filter controls
- Add filter chips showing active filters (removable)
- Use URL query parameters for state persistence
- Backend: Update `GET /api/applications` to support all filter params
- Optimize queries with proper indexes
- Add sort parameter: `?sort=date_desc` or `?sort=company_asc`
- Consider server-side filtering for >100 applications

---

### Story 5.4: Data Export - Applications and Interviews to CSV

As a job seeker,
I want to export my applications and interviews to CSV,
So that I can analyze my data in Excel or back it up externally.

**Acceptance Criteria:**

**Given** I have applications and interviews in my account
**When** I click "Export Data" in settings or from the application list
**Then** I can select what to export: Applications only, Interviews only, or Both

**And** export generates a CSV file with all relevant data

**And** for applications: includes company, job_title, status, application_date, description, notes

**And** for interviews: includes company, job_title, round_number, interview_type, scheduled_date, questions, answers, feedback

**And** CSV file downloads immediately (or via email for large exports)

**And** exported data respects current filters if exporting from filtered view

**And** export completes within 10 seconds for up to 1000 records

**Prerequisites:** Existing application and interview data

**Technical Notes:**
- Backend: Create `GET /api/export/applications` and `GET /api/export/interviews` endpoints
- Generate CSV server-side using CSV library
- Set proper headers: `Content-Type: text/csv`, `Content-Disposition: attachment`
- Flatten nested data (interviews → application relationship)
- For large datasets (>1000), consider async job with email notification
- Frontend: Export button in settings and application list toolbar
- Show progress indicator during export

---

### Story 5.5: Data Backup and Recovery Information

As a job seeker,
I want to know my data is backed up and understand how to recover it,
So that I have peace of mind that my job search data won't be lost.

**Acceptance Criteria:**

**Given** I am using ditto
**When** I navigate to settings or help section
**Then** I see information about data backup policy: "Your data is automatically backed up daily"

**And** I see last backup timestamp (if available)

**And** I can request a full data export (JSON format) containing all my data

**And** full export includes: applications, interviews, assessments, notes, uploaded files (as download links)

**And** I understand data retention policy: "Data is retained indefinitely while your account is active"

**And** I can delete my account and all data via settings (with confirmation)

**Prerequisites:** Story 5.4 (export functionality), existing backup infrastructure (NFR-3.2 in PRD)

**Technical Notes:**
- Backend:
  - Create `GET /api/export/full` endpoint returning JSON with all user data
  - Include file URLs with temporary signed access
  - Document backup policy (daily backups, 7-day retention from PRD NFR-3.2)
- Frontend:
  - Create DataBackup section in settings
  - Show last backup date (query from system or hardcode "daily at 2am UTC")
  - Add "Download Full Backup" button
  - Add "Delete Account" danger zone with multi-step confirmation
- Account deletion: Implement `DELETE /api/users/account` with cascading soft deletes

---

## Epic 6: Polish, Performance & Production Readiness

**Goal:** Ensure ditto is fast, secure, reliable, accessible, and delightful to use - meeting all non-functional requirements for production deployment.

**Value Proposition:** Users experience a professional-grade application that loads quickly, works on all devices, protects their data, handles errors gracefully, and feels polished in every interaction.

---

### Story 6.1: Performance Optimization - Page Load and API Response Times

As a user,
I want pages to load quickly and interactions to feel instant,
So that using ditto feels responsive and doesn't slow down my workflow.

**Acceptance Criteria:**

**Given** I am using ditto on standard broadband (10 Mbps+)
**When** I navigate to any page
**Then** the dashboard loads within 2 seconds (NFR-1.1)

**And** main views (application list, interview detail) load within 2 seconds

**And** 90% of API requests respond within 500ms (NFR-1.2)

**And** 99% of API requests respond within 2 seconds

**And** search results return within 1 second

**And** initial page load with auth check completes within 3 seconds

**Prerequisites:** All features from Epics 1-5 implemented

**Technical Notes:**
- Backend:
  - Add database indexes on frequently queried columns (user_id, application_id, scheduled_date, status)
  - Optimize N+1 queries with proper JOINs or eager loading
  - Add query performance monitoring (log slow queries >500ms)
  - Implement response caching for dashboard stats (5 min TTL)
  - Enable GZIP compression for API responses
- Frontend:
  - Code splitting by route (Next.js automatic)
  - Lazy load heavy components (rich text editor, calendar)
  - Optimize images (use Next.js Image component)
  - Implement pagination for large lists (>50 items)
  - Add loading skeletons for better perceived performance
- Measure: Use Lighthouse, Chrome DevTools Performance tab

---

### Story 6.2: Security Hardening - Input Validation and XSS Prevention

As a user,
I want my data and account to be secure from common web vulnerabilities,
So that I can trust ditto with my sensitive job search information.

**Acceptance Criteria:**

**Given** users can input text in various forms
**When** I submit data to the server
**Then** all user input is validated on both client and server side (NFR-2.3)

**And** rich text content is sanitized to prevent XSS attacks

**And** SQL injection is prevented via parameterized queries

**And** file uploads are validated for type (whitelist: PDF, DOCX, TXT, ZIP) and size (5MB default, 10MB for assessments)

**And** CSRF protection is enabled on all state-changing operations (NFR-2.4)

**And** all API calls are over HTTPS only (TLS 1.2+) (NFR-2.2)

**And** no unencrypted transmission of credentials or tokens

**Prerequisites:** Existing authentication system, rich text editors

**Technical Notes:**
- Backend:
  - Use Go's html.EscapeString for HTML output
  - Implement XSS sanitization library (bluemonday) for rich text
  - All database queries use parameterized statements (already in place with GORM/sqlx)
  - Add file upload MIME type validation server-side
  - Implement CSRF token middleware (Gin CSRF middleware)
  - Enforce HTTPS in production (redirect HTTP → HTTPS)
- Frontend:
  - Client-side validation with react-hook-form or zod
  - Sanitize rich text before rendering (DOMPurify)
  - Never use dangerouslySetInnerHTML without sanitization
  - Include CSRF token in forms
- Security headers: Set Content-Security-Policy, X-Frame-Options, X-Content-Type-Options

---

### Story 6.3: Responsive Design - Mobile and Tablet Support

As a user,
I want ditto to work well on my phone and tablet,
So that I can access my job search data from any device.

**Acceptance Criteria:**

**Given** I access ditto from different devices
**When** I use the application
**Then** it is functional on screen widths from 320px (mobile) to 3840px (4K desktop) (NFR-4.2)

**And** on mobile (320-767px): bottom navigation, simplified forms, essential features accessible, readable text without horizontal scrolling

**And** on tablet (768-1279px): collapsible sidebar or bottom nav, single column layouts, condensed toolbars

**And** on desktop (1280px+): full sidebar navigation, multi-column layouts, rich toolbars, side-by-side views

**And** touch targets are minimum 44x44px on mobile (WCAG AA compliance)

**And** forms are easy to fill on mobile (proper input types, auto-focus management)

**And** rich text editor works on mobile with simplified toolbar

**Prerequisites:** All UI components from Epics 1-5

**Technical Notes:**
- Frontend:
  - Use Tailwind CSS responsive breakpoints: sm, md, lg, xl
  - Test on real devices: iPhone, Android, iPad
  - Implement responsive navigation (mobile bottom nav, desktop sidebar)
  - Simplify forms on mobile (fewer fields per screen, step-by-step)
  - Use responsive tables (horizontal scroll or card layout on mobile)
  - Adjust rich text editor toolbar for mobile (essential formatting only)
  - Test touch interactions (tap, swipe, pinch-to-zoom disabled on forms)
- Design:
  - Mobile-first approach for critical flows
  - Ensure readable font sizes (16px minimum on mobile)
  - Adequate spacing for touch targets

---

### Story 6.4: Accessibility Improvements - Keyboard Navigation and Screen Readers

As a user with accessibility needs,
I want ditto to be usable with keyboard and screen readers,
So that I can access all features regardless of how I interact with the web.

**Acceptance Criteria:**

**Given** I use keyboard-only navigation or a screen reader
**When** I interact with ditto
**Then** all interactive elements are keyboard accessible (Tab, Enter, Escape) (NFR-4.3)

**And** semantic HTML is used (nav, main, article, button, etc.) for screen reader compatibility

**And** form labels and error messages are properly associated with inputs

**And** color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

**And** focus indicators are visible on all interactive elements

**And** skip navigation link allows jumping to main content

**And** ARIA labels are used where necessary (icon buttons, dynamic content)

**And** form validation errors are announced to screen readers

**Prerequisites:** All UI components from Epics 1-5

**Technical Notes:**
- Frontend:
  - Use semantic HTML5 elements
  - Add aria-label to icon-only buttons
  - Implement keyboard event handlers (onKeyDown for Enter/Escape)
  - Ensure focus management (trap focus in modals, restore after close)
  - Add skip link: "Skip to main content"
  - Use aria-live regions for dynamic updates (notifications, save status)
  - Ensure proper heading hierarchy (h1 → h2 → h3)
- Testing:
  - Test with keyboard only (no mouse)
  - Test with screen reader (NVDA, JAWS, VoiceOver)
  - Use axe DevTools or Lighthouse for accessibility audit
  - Check color contrast with WebAIM Contrast Checker
- shadcn/ui components already have good accessibility baseline

---

### Story 6.5: Error Handling and User Feedback

As a user,
I want clear feedback when things go wrong or succeed,
So that I always understand what's happening and can recover from errors.

**Acceptance Criteria:**

**Given** I interact with ditto
**When** an operation completes or fails
**Then** I see appropriate feedback: success toast for successful actions, error messages for failures

**And** error messages are user-friendly (no stack traces shown) (NFR-3.3)

**And** errors include actionable guidance ("Try again", "Contact support", specific validation errors)

**And** all errors are logged server-side for debugging

**And** loading states are shown for operations >500ms (NFR-4.4)

**And** disabled state is clear for unavailable actions

**And** auto-save shows "Saving..." → "Saved" → "Save failed" states

**And** network errors show: "Connection lost. Changes will sync when reconnected."

**Prerequisites:** All features from Epics 1-5

**Technical Notes:**
- Backend:
  - Structured error responses: `{error: "message", code: "ERROR_CODE"}`
  - Log all errors with context (user_id, endpoint, stack trace)
  - Return appropriate HTTP status codes (400, 401, 403, 404, 500)
  - Never expose sensitive info in error messages
- Frontend:
  - Use toast notifications (shadcn/ui Toast component)
  - Show loading spinners/skeletons for async operations
  - Implement error boundaries for React component errors
  - Retry logic for failed API calls (exponential backoff)
  - Display specific validation errors inline on forms
  - Use optimistic UI with rollback on error
- Error tracking: Consider integrating Sentry or similar (post-MVP)

---

### Story 6.6: Form Validation and User Input Quality

As a user,
I want clear validation feedback when filling out forms,
So that I can correct mistakes before submitting.

**Acceptance Criteria:**

**Given** I am filling out a form (application, interview, assessment)
**When** I enter invalid data
**Then** I see inline validation errors as I type or on blur

**And** required fields are clearly marked with asterisk or "Required" label

**And** validation errors are specific: "Email must be valid", "Date cannot be in the past", "Title required"

**And** I cannot submit a form with validation errors (submit button disabled or shows errors)

**And** successful submission shows confirmation message

**And** validation rules are consistent between client and server

**Prerequisites:** All forms from Epics 1-5

**Technical Notes:**
- Frontend:
  - Use react-hook-form with zod schema validation
  - Define validation schemas per form (required, min/max length, format)
  - Show errors inline below fields (red text)
  - Mark required fields visually
  - Disable submit button when form invalid
  - Clear validation state on input change
- Backend:
  - Validate all inputs server-side (never trust client)
  - Return 400 Bad Request with field-specific errors
  - Use Go validation library (go-playground/validator)
- Validation rules: email format, URL format, date ranges, string length, number ranges

---

### Story 6.7: File Upload Performance and Progress

As a user,
I want file uploads to be fast with clear progress indication,
So that I know my files are uploading and when they'll be done.

**Acceptance Criteria:**

**Given** I am uploading a file (resume, cover letter, prep document)
**When** the upload starts
**Then** I see a progress bar showing upload percentage

**And** files up to 5MB upload within 10 seconds on standard broadband (NFR-1.5)

**And** upload completes with success message and file appears in list

**And** if upload fails, I see clear error with retry option

**And** I can cancel an in-progress upload

**And** large files (>5MB for assessments) show estimated time remaining

**Prerequisites:** Story 1.2 (file storage), Story 2.8 (interview file uploads), Story 3.6 (assessment file uploads)

**Technical Notes:**
- Backend:
  - Stream file uploads (don't buffer entire file in memory)
  - Return progress if possible (chunked upload for large files)
  - Set proper timeouts (30s for 5MB, 60s for 10MB)
- Frontend:
  - Use XMLHttpRequest or axios with onUploadProgress callback
  - Display progress bar component
  - Show upload speed and estimated time
  - Implement cancel functionality (abort request)
  - Handle errors gracefully (network timeout, file too large)
- Optimization:
  - Client-side file size check before upload
  - Compress images before upload (optional)

---

### Story 6.8: Session Management and Token Refresh

As a user,
I want my session to stay active while I'm using ditto,
So that I don't get logged out unexpectedly while working.

**Acceptance Criteria:**

**Given** I am logged in and using ditto
**When** my JWT token approaches expiration
**Then** the token is automatically refreshed before it expires (NFR-2.1)

**And** sessions persist across browser tabs

**And** if my session expires (24 hours of inactivity), I'm redirected to login with message: "Session expired. Please log in again."

**And** after logging back in, I'm returned to the page I was on (optional)

**And** logout clears all tokens from client and server

**And** refresh tokens rotate on each use for security

**Prerequisites:** Story FR-6.3 (existing session management), existing auth system

**Technical Notes:**
- Backend:
  - JWT tokens expire after 24 hours (NFR-2.1)
  - Refresh tokens expire after 7 days
  - Implement token refresh endpoint: `POST /api/auth/refresh`
  - Rotate refresh tokens on each refresh
  - Invalidate old refresh tokens
- Frontend:
  - Check token expiration before API calls
  - Automatically call refresh endpoint if token expires in <5 minutes
  - Store tokens in httpOnly cookies or localStorage (cookies preferred for security)
  - Axios interceptor for automatic token refresh
  - Handle refresh failure → redirect to login
- Logout: Clear tokens client-side and invalidate server-side

---

### Story 6.9: Testing Infrastructure - Unit and Integration Tests

As a developer,
I want comprehensive test coverage for critical features,
So that we can confidently make changes without breaking existing functionality.

**Acceptance Criteria:**

**Given** the codebase
**When** tests are run
**Then** backend has unit tests for repository layer with >70% coverage goal (NFR-5.3)

**And** backend has integration tests for critical endpoints: auth, applications CRUD, interviews CRUD, assessments CRUD

**And** frontend has component tests for key user flows: login, create application, log interview, add assessment

**And** all tests pass before deployment

**And** CI/CD pipeline runs tests automatically on pull requests

**Prerequisites:** All features from Epics 1-5 implemented

**Technical Notes:**
- Backend:
  - Use Go testing framework (testing package)
  - Unit tests: test repository layer in isolation (mock DB)
  - Integration tests: test full HTTP handlers with test DB
  - Use testify for assertions and mocking
  - Table-driven tests for comprehensive coverage
  - Run tests: `go test ./...`
  - Coverage: `go test -cover ./...`
- Frontend:
  - Use Jest + React Testing Library
  - Test user interactions (click, type, submit)
  - Mock API calls (MSW or jest.mock)
  - Test critical flows end-to-end
  - Component tests for: forms, search, timeline
  - Run tests: `npm test`
- CI/CD: GitHub Actions or similar to run tests on PR

---

### Story 6.10: Documentation - API, Database Schema, and Setup

As a developer or future contributor,
I want clear documentation for the codebase,
So that I can understand how to set up, use, and extend ditto.

**Acceptance Criteria:**

**Given** the project repository
**When** I read the documentation
**Then** README includes: project overview, tech stack, setup instructions (local dev), environment variables, how to run tests

**And** API endpoints are documented with request/response schemas (NFR-5.2)

**And** database schema is documented (table descriptions, relationships, indexes)

**And** setup instructions allow a new developer to run the project in <30 minutes

**And** architecture decision records (ADRs) document key technical choices (optional)

**Prerequisites:** All features from Epics 1-5 implemented

**Technical Notes:**
- README.md:
  - Project description and features
  - Tech stack (Go, PostgreSQL, Next.js, etc.)
  - Prerequisites (Go 1.23+, Node 18+, PostgreSQL 15+)
  - Setup steps: clone, install deps, env vars, migrations, run
  - Development workflow (run backend, run frontend, tests)
  - Deployment instructions (Docker Compose)
- API Documentation:
  - Use Swagger/OpenAPI spec (optional) or Markdown doc
  - Document each endpoint: method, path, auth, request body, response, errors
  - Group by domain: Auth, Applications, Interviews, Assessments, etc.
- Database Schema:
  - Entity-relationship diagram (ERD) or Markdown tables
  - Document each table, column types, relationships, indexes
- Location: `/docs` folder or inline in code (comments)

---


---

## Epic Breakdown Summary

### Total Delivery

**6 Epics | 47 Stories** for ditto MVP

### Epic Overview

| Epic | Stories | Focus |
|------|---------|-------|
| **Epic 1:** Enhanced Application Management | 6 | URL extraction, file storage, filtering |
| **Epic 2:** Deep Interview Management | 12 | Core differentiator - comprehensive interview lifecycle |
| **Epic 3:** Technical Assessment Tracking | 8 | Deadline tracking and submission management |
| **Epic 4:** Workflow Automation & Timeline | 6 | Dashboard, reminders, auto-save, timeline (browser push deferred) |
| **Epic 5:** Search, Discovery & Data Management | 5 | Global search, filtering, export, backup |
| **Epic 6:** Polish, Performance & Production Readiness | 10 | NFRs - performance, security, responsive, accessibility |

### Implementation Sequencing

**Phase 1: Foundation + Core Differentiator (18 stories)**
- Epic 1: Enhanced Application Management (6 stories)
- Epic 2: Deep Interview Management (12 stories)

**Phase 2: Value Expansion + Workflow (14 stories)**
- Epic 3: Technical Assessment Tracking (8 stories)
- Epic 4: Workflow Automation & Timeline (6 stories)

**Phase 3: Scale + Polish (15 stories)**
- Epic 5: Search, Discovery & Data Management (5 stories)
- Epic 6: Polish, Performance & Production Readiness (10 stories)

### Coverage Validation

✅ **All Functional Requirements (FR-1 to FR-6) covered**
- FR-1: Application Management → Epic 1
- FR-2: Interview Management → Epic 2
- FR-3: Technical Assessment Tracking → Epic 3
- FR-4: Dashboard & Timeline → Epic 4
- FR-5: Search & Filtering → Epic 5
- FR-6: User Account & Data Management → Epics 4, 5, 6

✅ **All Non-Functional Requirements (NFR-1 to NFR-8) covered**
- NFR-1: Performance → Epic 6, Story 6.1
- NFR-2: Security → Epic 6, Stories 6.2, 6.8
- NFR-3: Reliability → Epic 6, Story 6.5
- NFR-4: Usability → Epic 6, Stories 6.3, 6.4
- NFR-5: Maintainability → Epic 6, Stories 6.9, 6.10
- NFR-6: Scalability → Epic 6, Story 6.1
- NFR-7: Deployment → Epic 6, Story 6.10
- NFR-8: Browser Support → Epic 6, Story 6.3

### Key Principles Applied

✅ **Vertical Slicing:** Each story delivers complete functionality across stack
✅ **No Forward Dependencies:** Stories only depend on previous work
✅ **Agent-Sized:** Stories scoped for 2-4 hour sessions with 200k context agents
✅ **BDD Acceptance Criteria:** Clear Given/When/Then format for all stories
✅ **Brownfield Integration:** Epic 1 builds on existing application tracking infrastructure
✅ **Value-Driven Sequencing:** Core differentiator (Epic 2) early in Phase 1

### Next Steps

1. ✅ **PRD validated** (epics coverage verified)
2. **Architecture Design** → Run: `/bmad:bmm:workflows:architecture`
3. **Solutioning Gate Check** → Run: `/bmad:bmm:workflows:solutioning-gate-check`
4. **Sprint Planning** → Run: `/bmad:bmm:workflows:sprint-planning`
5. **Story Implementation** → Begin Phase 1 development

---

_This epic breakdown was created through systematic decomposition of the ditto PRD, ensuring complete FR/NFR coverage with implementable, vertically-sliced stories optimized for AI-assisted development._

**Document Status:** ✅ Complete and ready for architecture design
**Last Updated:** 2025-11-09

