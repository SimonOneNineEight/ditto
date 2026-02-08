package services

import (
	"context"
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/pkg/database"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type NotificationScheduler struct {
	db               *sqlx.DB
	notificationRepo *repository.NotificationRepository
	notificationSvc  *NotificationService
	ticker           *time.Ticker
	done             chan bool
}

func NewNotificationScheduler(database *database.Database) *NotificationScheduler {
	return &NotificationScheduler{
		db:               database.DB,
		notificationRepo: repository.NewNotificationRepository(database),
		notificationSvc:  NewNotificationService(database),
		done:             make(chan bool),
	}
}

func (s *NotificationScheduler) Start(interval time.Duration) {
	s.ticker = time.NewTicker(interval)
	go func() {
		s.processReminders()
		for {
			select {
			case <-s.done:
				return
			case <-s.ticker.C:
				s.processReminders()
			}
		}
	}()
	log.Printf("Notification scheduler started with %v interval", interval)
}

func (s *NotificationScheduler) Stop() {
	if s.ticker != nil {
		s.ticker.Stop()
	}
	s.done <- true
	log.Println("Notification scheduler stopped")
}

func (s *NotificationScheduler) processReminders() {
	ctx := context.Background()

	if err := s.processInterviewReminders(ctx); err != nil {
		log.Printf("Error processing interview reminders: %v", err)
	}

	if err := s.processAssessmentReminders(ctx); err != nil {
		log.Printf("Error processing assessment reminders: %v", err)
	}
}

type upcomingInterview struct {
	ID            uuid.UUID `db:"id"`
	UserID        uuid.UUID `db:"user_id"`
	ApplicationID uuid.UUID `db:"application_id"`
	InterviewType string    `db:"interview_type"`
	RoundNumber   int       `db:"round_number"`
	ScheduledDate time.Time `db:"scheduled_date"`
	ScheduledTime *string   `db:"scheduled_time"`
	CompanyName   string    `db:"company_name"`
	JobTitle      string    `db:"job_title"`
}

func (s *NotificationScheduler) processInterviewReminders(ctx context.Context) error {
	now := time.Now()

	interviews24h, err := s.getInterviewsInWindow(now.Add(23*time.Hour), now.Add(25*time.Hour))
	if err != nil {
		return fmt.Errorf("fetching 24h interviews: %w", err)
	}

	for _, interview := range interviews24h {
		if err := s.createInterviewReminderIfNeeded(&interview, ReminderType24h); err != nil {
			log.Printf("Error creating 24h reminder for interview %s: %v", interview.ID, err)
		}
	}

	interviews1h, err := s.getInterviewsInWindow(now.Add(30*time.Minute), now.Add(90*time.Minute))
	if err != nil {
		return fmt.Errorf("fetching 1h interviews: %w", err)
	}

	for _, interview := range interviews1h {
		if err := s.createInterviewReminderIfNeeded(&interview, ReminderType1h); err != nil {
			log.Printf("Error creating 1h reminder for interview %s: %v", interview.ID, err)
		}
	}

	return nil
}

func (s *NotificationScheduler) getInterviewsInWindow(from, to time.Time) ([]upcomingInterview, error) {
	query := `
		SELECT
			i.id, i.user_id, i.application_id, i.interview_type, i.round_number,
			i.scheduled_date, i.scheduled_time,
			c.name as company_name, j.title as job_title
		FROM interviews i
		JOIN applications a ON i.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		WHERE i.deleted_at IS NULL
			AND a.deleted_at IS NULL
			AND (i.scheduled_date + COALESCE(i.scheduled_time, '09:00:00'::time)) BETWEEN $1 AND $2
	`

	var interviews []upcomingInterview
	err := s.db.Select(&interviews, query, from, to)
	if err != nil {
		return nil, err
	}

	return interviews, nil
}

func (s *NotificationScheduler) createInterviewReminderIfNeeded(interview *upcomingInterview, reminderType string) error {
	link := fmt.Sprintf("/interviews/%s#%s", interview.ID.String(), reminderType)

	exists, err := s.notificationRepo.ExistsByLink(interview.UserID, link)
	if err != nil {
		return err
	}

	if exists {
		return nil
	}

	info := &InterviewInfo{
		ID:            interview.ID,
		UserID:        interview.UserID,
		ApplicationID: interview.ApplicationID,
		InterviewType: interview.InterviewType,
		RoundNumber:   interview.RoundNumber,
		ScheduledDate: interview.ScheduledDate,
		CompanyName:   interview.CompanyName,
		JobTitle:      interview.JobTitle,
	}

	_, err = s.notificationSvc.CreateInterviewReminder(info, reminderType)
	return err
}

type upcomingAssessment struct {
	ID            uuid.UUID `db:"id"`
	UserID        uuid.UUID `db:"user_id"`
	ApplicationID uuid.UUID `db:"application_id"`
	Title         string    `db:"title"`
	DueDate       time.Time `db:"due_date"`
	CompanyName   string    `db:"company_name"`
	JobTitle      string    `db:"job_title"`
}

func (s *NotificationScheduler) processAssessmentReminders(ctx context.Context) error {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	assessments3d, err := s.getAssessmentsDueOn(today.AddDate(0, 0, 3))
	if err != nil {
		return fmt.Errorf("fetching 3d assessments: %w", err)
	}

	for _, assessment := range assessments3d {
		if err := s.createAssessmentReminderIfNeeded(&assessment, ReminderType3d); err != nil {
			log.Printf("Error creating 3d reminder for assessment %s: %v", assessment.ID, err)
		}
	}

	assessments1d, err := s.getAssessmentsDueOn(today.AddDate(0, 0, 1))
	if err != nil {
		return fmt.Errorf("fetching 1d assessments: %w", err)
	}

	for _, assessment := range assessments1d {
		if err := s.createAssessmentReminderIfNeeded(&assessment, ReminderType1d); err != nil {
			log.Printf("Error creating 1d reminder for assessment %s: %v", assessment.ID, err)
		}
	}

	assessments1h, err := s.getAssessmentsDueOn(today)
	if err != nil {
		return fmt.Errorf("fetching 1h assessments: %w", err)
	}

	for _, assessment := range assessments1h {
		if err := s.createAssessmentReminderIfNeeded(&assessment, ReminderType1h); err != nil {
			log.Printf("Error creating 1h reminder for assessment %s: %v", assessment.ID, err)
		}
	}

	return nil
}

func (s *NotificationScheduler) getAssessmentsDueOn(date time.Time) ([]upcomingAssessment, error) {
	query := `
		SELECT
			ass.id, ass.user_id, ass.application_id, ass.title, ass.due_date,
			c.name as company_name, j.title as job_title
		FROM assessments ass
		JOIN applications a ON ass.application_id = a.id
		JOIN jobs j ON a.job_id = j.id
		JOIN companies c ON j.company_id = c.id
		WHERE ass.deleted_at IS NULL
			AND a.deleted_at IS NULL
			AND ass.status != $1
			AND ass.due_date = $2::date
	`

	var assessments []upcomingAssessment
	err := s.db.Select(&assessments, query, models.AssessmentStatusSubmitted, date)
	if err != nil {
		return nil, err
	}

	return assessments, nil
}

func (s *NotificationScheduler) createAssessmentReminderIfNeeded(assessment *upcomingAssessment, reminderType string) error {
	link := fmt.Sprintf("/applications/%s/assessments/%s#%s", assessment.ApplicationID.String(), assessment.ID.String(), reminderType)

	exists, err := s.notificationRepo.ExistsByLink(assessment.UserID, link)
	if err != nil {
		return err
	}

	if exists {
		return nil
	}

	info := &AssessmentInfo{
		ID:            assessment.ID,
		UserID:        assessment.UserID,
		ApplicationID: assessment.ApplicationID,
		Title:         assessment.Title,
		DueDate:       assessment.DueDate,
		CompanyName:   assessment.CompanyName,
		JobTitle:      assessment.JobTitle,
	}

	_, err = s.notificationSvc.CreateAssessmentReminder(info, reminderType)
	return err
}
