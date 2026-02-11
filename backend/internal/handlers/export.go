package handlers

import (
	"ditto-backend/internal/repository"
	s3service "ditto-backend/internal/services/s3"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ExportHandler struct {
	applicationRepo            *repository.ApplicationRepository
	interviewRepo              *repository.InterviewRepository
	interviewQuestionRepo      *repository.InterviewQuestionRepository
	interviewNoteRepo          *repository.InterviewNoteRepository
	interviewerRepo            *repository.InterviewerRepository
	assessmentRepo             *repository.AssessmentRepository
	assessmentSubmissionRepo   *repository.AssessmentSubmissionRepository
	fileRepo                   *repository.FileRepository
	userRepo                   *repository.UserRepository
	s3Service                  *s3service.S3Service
}

func NewExportHandler(appState *utils.AppState, s3Service *s3service.S3Service) *ExportHandler {
	return &ExportHandler{
		applicationRepo:          repository.NewApplicationRepository(appState.DB),
		interviewRepo:            repository.NewInterviewRepository(appState.DB),
		interviewQuestionRepo:    repository.NewInterviewQuestionRepository(appState.DB),
		interviewNoteRepo:        repository.NewInterviewNoteRepository(appState.DB),
		interviewerRepo:          repository.NewInterviewerRepository(appState.DB),
		assessmentRepo:           repository.NewAssessmentRepository(appState.DB),
		assessmentSubmissionRepo: repository.NewAssessmentSubmissionRepository(appState.DB),
		fileRepo:                 repository.NewFileRepository(appState.DB),
		userRepo:                 repository.NewUserRepository(appState.DB),
		s3Service:                s3Service,
	}
}

// GET /api/export/applications
func (h *ExportHandler) ExportApplications(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	filters := parseExportFilters(c)

	applications, err := h.applicationRepo.GetApplicationsWithDetails(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	filename := fmt.Sprintf("applications_%s.csv", time.Now().Format("2006-01-02"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	header := []string{"Company", "Job Title", "Status", "Application Date", "Description", "Notes"}
	if err := writer.Write(header); err != nil {
		HandleError(c, errors.New(errors.ErrorInternalServer, "failed to write CSV header"))
		return
	}

	for _, app := range applications {
		companyName := ""
		if app.Company != nil {
			companyName = app.Company.Name
		}

		jobTitle := ""
		description := ""
		if app.Job != nil {
			jobTitle = app.Job.Title
			description = app.Job.JobDescription
		}

		statusName := ""
		if app.Status != nil {
			statusName = app.Status.Name
		}

		notes := ""
		if app.Notes != nil {
			notes = *app.Notes
		}

		row := []string{
			companyName,
			jobTitle,
			statusName,
			app.AppliedAt.Format("2006-01-02"),
			description,
			notes,
		}

		if err := writer.Write(row); err != nil {
			HandleError(c, errors.New(errors.ErrorInternalServer, "failed to write CSV row"))
			return
		}
	}
}

// GET /api/export/interviews
func (h *ExportHandler) ExportInterviews(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	filters := parseExportFilters(c)

	applications, err := h.applicationRepo.GetApplicationsWithDetails(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	filename := fmt.Sprintf("interviews_%s.csv", time.Now().Format("2006-01-02"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	header := []string{"Company", "Job Title", "Round Number", "Interview Type", "Scheduled Date", "Questions", "Answers", "Feedback"}
	if err := writer.Write(header); err != nil {
		HandleError(c, errors.New(errors.ErrorInternalServer, "failed to write CSV header"))
		return
	}

	for _, app := range applications {
		interviews, err := h.interviewRepo.GetInterviewsByApplicationID(app.ID, userID)
		if err != nil {
			continue
		}

		companyName := ""
		if app.Company != nil {
			companyName = app.Company.Name
		}

		jobTitle := ""
		if app.Job != nil {
			jobTitle = app.Job.Title
		}

		for _, interview := range interviews {
			questions, err := h.interviewQuestionRepo.GetInterviewQuestionByInterviewID(interview.ID)
			if err != nil {
				questions = nil
			}

			var questionTexts []string
			var answerTexts []string
			for _, q := range questions {
				questionTexts = append(questionTexts, q.QuestionText)
				if q.AnswerText != nil {
					answerTexts = append(answerTexts, *q.AnswerText)
				} else {
					answerTexts = append(answerTexts, "")
				}
			}

			questionsJSON, _ := json.Marshal(questionTexts)
			answersJSON, _ := json.Marshal(answerTexts)

			feedback := ""
			if interview.WentWell != nil && interview.CouldImprove != nil {
				feedback = fmt.Sprintf("Went well: %s | Could improve: %s", *interview.WentWell, *interview.CouldImprove)
			} else if interview.WentWell != nil {
				feedback = fmt.Sprintf("Went well: %s", *interview.WentWell)
			} else if interview.CouldImprove != nil {
				feedback = fmt.Sprintf("Could improve: %s", *interview.CouldImprove)
			}

			row := []string{
				companyName,
				jobTitle,
				strconv.Itoa(interview.RoundNumber),
				interview.InterviewType,
				interview.ScheduledDate.Format("2006-01-02"),
				string(questionsJSON),
				string(answersJSON),
				feedback,
			}

			if err := writer.Write(row); err != nil {
				HandleError(c, errors.New(errors.ErrorInternalServer, "failed to write CSV row"))
				return
			}
		}
	}
}

func parseExportFilters(c *gin.Context) *repository.ApplicationFilters {
	filters := &repository.ApplicationFilters{
		Limit:  10000,
		Offset: 0,
	}

	filters.JobTitle = c.Query("job_title")
	filters.CompanyName = c.Query("company_name")

	if statusIDsStr := c.Query("status_ids"); statusIDsStr != "" {
		statusStrs := strings.Split(statusIDsStr, ",")
		var statusIDs []uuid.UUID
		for _, s := range statusStrs {
			s = strings.TrimSpace(s)
			if s == "" {
				continue
			}
			if id, err := uuid.Parse(s); err == nil {
				statusIDs = append(statusIDs, id)
			}
		}
		if len(statusIDs) > 0 {
			filters.StatusIDs = statusIDs
		}
	}

	if hasInterviewsStr := c.Query("has_interviews"); hasInterviewsStr != "" {
		if hasInterviews, err := strconv.ParseBool(hasInterviewsStr); err == nil {
			filters.HasInterviews = &hasInterviews
		}
	}

	if hasAssessmentsStr := c.Query("has_assessments"); hasAssessmentsStr != "" {
		if hasAssessments, err := strconv.ParseBool(hasAssessmentsStr); err == nil {
			filters.HasAssessments = &hasAssessments
		}
	}

	if dateFromStr := c.Query("date_from"); dateFromStr != "" {
		if dateFrom, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			filters.DateFrom = &dateFrom
		}
	}

	if dateToStr := c.Query("date_to"); dateToStr != "" {
		if dateTo, err := time.Parse("2006-01-02", dateToStr); err == nil {
			filters.DateTo = &dateTo
		}
	}

	if sortBy := c.Query("sort_by"); sortBy != "" {
		validSortColumns := map[string]bool{
			"company": true, "position": true, "status": true,
			"applied_at": true, "location": true, "updated_at": true, "job_type": true,
		}
		if validSortColumns[sortBy] {
			filters.SortBy = sortBy
		}
	}

	if sortOrder := c.Query("sort_order"); sortOrder == "asc" || sortOrder == "desc" {
		filters.SortOrder = sortOrder
	}

	return filters
}

type FullBackupExport struct {
	ExportDate   string                    `json:"export_date"`
	User         FullBackupUser            `json:"user"`
	Applications []FullBackupApplication   `json:"applications"`
	Interviews   []FullBackupInterview     `json:"interviews"`
	Assessments  []FullBackupAssessment    `json:"assessments"`
}

type FullBackupUser struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
}

type FullBackupApplication struct {
	ID              string            `json:"id"`
	Company         string            `json:"company"`
	JobTitle        string            `json:"job_title"`
	Status          string            `json:"status"`
	ApplicationDate string            `json:"application_date"`
	Description     string            `json:"description"`
	Notes           string            `json:"notes"`
	Location        string            `json:"location,omitempty"`
	JobType         string            `json:"job_type,omitempty"`
	SourceURL       string            `json:"source_url,omitempty"`
	Files           []FullBackupFile  `json:"files,omitempty"`
}

type FullBackupInterview struct {
	ID              string                   `json:"id"`
	ApplicationID   string                   `json:"application_id"`
	Company         string                   `json:"company"`
	JobTitle        string                   `json:"job_title"`
	RoundNumber     int                      `json:"round_number"`
	InterviewType   string                   `json:"interview_type"`
	ScheduledDate   string                   `json:"scheduled_date"`
	ScheduledTime   string                   `json:"scheduled_time,omitempty"`
	DurationMinutes int                      `json:"duration_minutes,omitempty"`
	Outcome         string                   `json:"outcome,omitempty"`
	OverallFeeling  string                   `json:"overall_feeling,omitempty"`
	WentWell        string                   `json:"went_well,omitempty"`
	CouldImprove    string                   `json:"could_improve,omitempty"`
	ConfidenceLevel int                      `json:"confidence_level,omitempty"`
	Interviewers    []FullBackupInterviewer  `json:"interviewers,omitempty"`
	Questions       []FullBackupQuestion     `json:"questions,omitempty"`
	Notes           []FullBackupNote         `json:"notes,omitempty"`
	Files           []FullBackupFile         `json:"files,omitempty"`
}

type FullBackupInterviewer struct {
	Name string `json:"name"`
	Role string `json:"role,omitempty"`
}

type FullBackupQuestion struct {
	Question string `json:"question"`
	Answer   string `json:"answer,omitempty"`
	Order    int    `json:"order"`
}

type FullBackupNote struct {
	NoteType string `json:"note_type"`
	Content  string `json:"content"`
}

type FullBackupAssessment struct {
	ID             string                     `json:"id"`
	ApplicationID  string                     `json:"application_id"`
	Company        string                     `json:"company"`
	JobTitle       string                     `json:"job_title"`
	Title          string                     `json:"title"`
	AssessmentType string                     `json:"assessment_type"`
	DueDate        string                     `json:"due_date"`
	Status         string                     `json:"status"`
	Instructions   string                     `json:"instructions,omitempty"`
	Requirements   string                     `json:"requirements,omitempty"`
	Submissions    []FullBackupSubmission     `json:"submissions,omitempty"`
}

type FullBackupSubmission struct {
	SubmissionType string `json:"submission_type"`
	GithubURL      string `json:"github_url,omitempty"`
	Notes          string `json:"notes,omitempty"`
	SubmittedAt    string `json:"submitted_at"`
	File           *FullBackupFile `json:"file,omitempty"`
}

type FullBackupFile struct {
	ID          string `json:"id"`
	FileName    string `json:"file_name"`
	FileType    string `json:"file_type"`
	FileSize    int64  `json:"file_size"`
	DownloadURL string `json:"download_url"`
}

func (h *ExportHandler) ExportFull(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	ctx := c.Request.Context()

	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	filters := &repository.ApplicationFilters{Limit: 10000, Offset: 0}
	applications, err := h.applicationRepo.GetApplicationsWithDetails(userID, filters)
	if err != nil {
		HandleError(c, err)
		return
	}

	appDetailsMap := make(map[uuid.UUID]*repository.ApplicationWithDetails)
	for _, app := range applications {
		appDetailsMap[app.ID] = app
	}

	allFiles, err := h.fileRepo.GetUserFiles(userID, nil, nil)
	if err != nil {
		HandleError(c, err)
		return
	}

	filesByApp := make(map[uuid.UUID][]*FullBackupFile)
	filesByInterview := make(map[uuid.UUID][]*FullBackupFile)
	filesByID := make(map[uuid.UUID]*FullBackupFile)

	for _, f := range allFiles {
		downloadURL, _ := h.s3Service.GeneratePresignedGetURL(ctx, f.S3Key)
		backupFile := &FullBackupFile{
			ID:          f.ID.String(),
			FileName:    f.FileName,
			FileType:    f.FileType,
			FileSize:    f.FileSize,
			DownloadURL: downloadURL,
		}
		filesByID[f.ID] = backupFile

		if f.InterviewID != nil {
			filesByInterview[*f.InterviewID] = append(filesByInterview[*f.InterviewID], backupFile)
		} else {
			filesByApp[f.ApplicationID] = append(filesByApp[f.ApplicationID], backupFile)
		}
	}

	var exportApps []FullBackupApplication
	for _, app := range applications {
		companyName := ""
		if app.Company != nil {
			companyName = app.Company.Name
		}
		jobTitle := ""
		description := ""
		location := ""
		jobType := ""
		sourceURL := ""
		if app.Job != nil {
			jobTitle = app.Job.Title
			description = app.Job.JobDescription
			location = app.Job.Location
			jobType = app.Job.JobType
			if app.Job.SourceURL != nil {
				sourceURL = *app.Job.SourceURL
			}
		}
		statusName := ""
		if app.Status != nil {
			statusName = app.Status.Name
		}
		notes := ""
		if app.Notes != nil {
			notes = *app.Notes
		}

		exportApp := FullBackupApplication{
			ID:              app.ID.String(),
			Company:         companyName,
			JobTitle:        jobTitle,
			Status:          statusName,
			ApplicationDate: app.AppliedAt.Format("2006-01-02"),
			Description:     description,
			Notes:           notes,
			Location:        location,
			JobType:         jobType,
			SourceURL:       sourceURL,
			Files:           make([]FullBackupFile, 0),
		}

		if files, ok := filesByApp[app.ID]; ok {
			for _, f := range files {
				exportApp.Files = append(exportApp.Files, *f)
			}
		}

		exportApps = append(exportApps, exportApp)
	}

	interviews, err := h.interviewRepo.GetInterviewsByUser(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	var exportInterviews []FullBackupInterview
	for _, interview := range interviews {
		appDetails := appDetailsMap[interview.ApplicationID]
		companyName := ""
		jobTitle := ""
		if appDetails != nil {
			if appDetails.Company != nil {
				companyName = appDetails.Company.Name
			}
			if appDetails.Job != nil {
				jobTitle = appDetails.Job.Title
			}
		}

		exportInterview := FullBackupInterview{
			ID:            interview.ID.String(),
			ApplicationID: interview.ApplicationID.String(),
			Company:       companyName,
			JobTitle:      jobTitle,
			RoundNumber:   interview.RoundNumber,
			InterviewType: interview.InterviewType,
			ScheduledDate: interview.ScheduledDate.Format("2006-01-02"),
			Interviewers:  make([]FullBackupInterviewer, 0),
			Questions:     make([]FullBackupQuestion, 0),
			Notes:         make([]FullBackupNote, 0),
			Files:         make([]FullBackupFile, 0),
		}

		if interview.ScheduledTime != nil {
			exportInterview.ScheduledTime = *interview.ScheduledTime
		}
		if interview.DurationMinutes != nil {
			exportInterview.DurationMinutes = *interview.DurationMinutes
		}
		if interview.Outcome != nil {
			exportInterview.Outcome = *interview.Outcome
		}
		if interview.OverallFeeling != nil {
			exportInterview.OverallFeeling = *interview.OverallFeeling
		}
		if interview.WentWell != nil {
			exportInterview.WentWell = *interview.WentWell
		}
		if interview.CouldImprove != nil {
			exportInterview.CouldImprove = *interview.CouldImprove
		}
		if interview.ConfidenceLevel != nil {
			exportInterview.ConfidenceLevel = *interview.ConfidenceLevel
		}

		interviewers, _ := h.interviewerRepo.GetInterviewerByInterview(interview.ID)
		for _, i := range interviewers {
			role := ""
			if i.Role != nil {
				role = *i.Role
			}
			exportInterview.Interviewers = append(exportInterview.Interviewers, FullBackupInterviewer{
				Name: i.Name,
				Role: role,
			})
		}

		questions, _ := h.interviewQuestionRepo.GetInterviewQuestionByInterviewID(interview.ID)
		for _, q := range questions {
			answer := ""
			if q.AnswerText != nil {
				answer = *q.AnswerText
			}
			exportInterview.Questions = append(exportInterview.Questions, FullBackupQuestion{
				Question: q.QuestionText,
				Answer:   answer,
				Order:    q.Order,
			})
		}

		notes, _ := h.interviewNoteRepo.GetInterviewNotesByInterviewID(interview.ID)
		for _, n := range notes {
			content := ""
			if n.Content != nil {
				content = *n.Content
			}
			exportInterview.Notes = append(exportInterview.Notes, FullBackupNote{
				NoteType: n.NoteType,
				Content:  content,
			})
		}

		if files, ok := filesByInterview[interview.ID]; ok {
			for _, f := range files {
				exportInterview.Files = append(exportInterview.Files, *f)
			}
		}

		exportInterviews = append(exportInterviews, exportInterview)
	}

	assessmentsWithContext, err := h.assessmentRepo.ListByUserID(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	var exportAssessments []FullBackupAssessment
	for _, assessment := range assessmentsWithContext {
		exportAssessment := FullBackupAssessment{
			ID:             assessment.ID.String(),
			ApplicationID:  assessment.ApplicationID.String(),
			Company:        assessment.CompanyName,
			JobTitle:       assessment.JobTitle,
			Title:          assessment.Title,
			AssessmentType: assessment.AssessmentType,
			DueDate:        assessment.DueDate,
			Status:         assessment.Status,
			Submissions:    make([]FullBackupSubmission, 0),
		}
		if assessment.Instructions != nil {
			exportAssessment.Instructions = *assessment.Instructions
		}
		if assessment.Requirements != nil {
			exportAssessment.Requirements = *assessment.Requirements
		}

		submissions, _ := h.assessmentSubmissionRepo.ListByAssessmentID(assessment.ID)
		for _, s := range submissions {
			exportSub := FullBackupSubmission{
				SubmissionType: s.SubmissionType,
				SubmittedAt:    s.SubmittedAt.Format(time.RFC3339),
			}
			if s.GithubURL != nil {
				exportSub.GithubURL = *s.GithubURL
			}
			if s.Notes != nil {
				exportSub.Notes = *s.Notes
			}
			if s.FileID != nil {
				if file, ok := filesByID[*s.FileID]; ok {
					exportSub.File = file
				}
			}
			exportAssessment.Submissions = append(exportAssessment.Submissions, exportSub)
		}

		exportAssessments = append(exportAssessments, exportAssessment)
	}

	export := FullBackupExport{
		ExportDate: time.Now().Format(time.RFC3339),
		User: FullBackupUser{
			ID:        user.ID.String(),
			Email:     user.Email,
			Name:      user.Name,
			CreatedAt: user.CreatedAt.Format(time.RFC3339),
		},
		Applications: exportApps,
		Interviews:   exportInterviews,
		Assessments:  exportAssessments,
	}

	filename := fmt.Sprintf("ditto-backup-%s.json", time.Now().Format("2006-01-02"))
	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	jsonData, err := json.MarshalIndent(export, "", "  ")
	if err != nil {
		HandleError(c, errors.New(errors.ErrorInternalServer, "failed to generate JSON export"))
		return
	}

	c.Data(200, "application/json", jsonData)
}
