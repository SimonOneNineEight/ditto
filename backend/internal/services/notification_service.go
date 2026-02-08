package services

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/pkg/database"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type NotificationService struct {
	notificationRepo *repository.NotificationRepository
	preferencesRepo  *repository.NotificationPreferencesRepository
}

func NewNotificationService(database *database.Database) *NotificationService {
	return &NotificationService{
		notificationRepo: repository.NewNotificationRepository(database),
		preferencesRepo:  repository.NewNotificationPreferencesRepository(database),
	}
}

type InterviewInfo struct {
	ID            uuid.UUID
	UserID        uuid.UUID
	ApplicationID uuid.UUID
	InterviewType string
	RoundNumber   int
	ScheduledDate time.Time
	CompanyName   string
	JobTitle      string
}

type AssessmentInfo struct {
	ID            uuid.UUID
	UserID        uuid.UUID
	ApplicationID uuid.UUID
	Title         string
	DueDate       time.Time
	CompanyName   string
	JobTitle      string
}

const (
	ReminderType24h = "24h"
	ReminderType1h  = "1h"
	ReminderType3d  = "3d"
	ReminderType1d  = "1d"
)

func (s *NotificationService) CreateInterviewReminder(interview *InterviewInfo, reminderType string) (*models.Notification, error) {
	prefs, err := s.preferencesRepo.GetByUserID(interview.UserID)
	if err != nil {
		return nil, err
	}

	switch reminderType {
	case ReminderType24h:
		if !prefs.Interview24h {
			return nil, nil
		}
	case ReminderType1h:
		if !prefs.Interview1h {
			return nil, nil
		}
	default:
		return nil, fmt.Errorf("invalid reminder type: %s", reminderType)
	}

	var timeText string
	if reminderType == ReminderType24h {
		timeText = "tomorrow"
	} else {
		timeText = "in 1 hour"
	}

	title := fmt.Sprintf("Interview %s", timeText)
	message := fmt.Sprintf("%s interview at %s for %s", interview.InterviewType, interview.CompanyName, interview.JobTitle)
	link := fmt.Sprintf("/interviews/%s#%s", interview.ID.String(), reminderType)

	notification := &models.Notification{
		UserID:  interview.UserID,
		Type:    models.NotificationTypeInterviewReminder,
		Title:   title,
		Message: message,
		Link:    &link,
		Read:    false,
	}

	return s.notificationRepo.Create(notification)
}

func (s *NotificationService) CreateAssessmentReminder(assessment *AssessmentInfo, reminderType string) (*models.Notification, error) {
	prefs, err := s.preferencesRepo.GetByUserID(assessment.UserID)
	if err != nil {
		return nil, err
	}

	switch reminderType {
	case ReminderType3d:
		if !prefs.Assessment3d {
			return nil, nil
		}
	case ReminderType1d:
		if !prefs.Assessment1d {
			return nil, nil
		}
	case ReminderType1h:
		if !prefs.Assessment1h {
			return nil, nil
		}
	default:
		return nil, fmt.Errorf("invalid reminder type: %s", reminderType)
	}

	var timeText string
	switch reminderType {
	case ReminderType3d:
		timeText = "due in 3 days"
	case ReminderType1d:
		timeText = "due tomorrow"
	case ReminderType1h:
		timeText = "due in 1 hour"
	}

	title := fmt.Sprintf("Assessment %s", timeText)
	message := fmt.Sprintf("%s for %s at %s", assessment.Title, assessment.JobTitle, assessment.CompanyName)
	link := fmt.Sprintf("/applications/%s/assessments/%s#%s", assessment.ApplicationID.String(), assessment.ID.String(), reminderType)

	notification := &models.Notification{
		UserID:  assessment.UserID,
		Type:    models.NotificationTypeAssessmentDeadline,
		Title:   title,
		Message: message,
		Link:    &link,
		Read:    false,
	}

	return s.notificationRepo.Create(notification)
}

func (s *NotificationService) CreateSystemAlert(userID uuid.UUID, title, message string, link *string) (*models.Notification, error) {
	notification := &models.Notification{
		UserID:  userID,
		Type:    models.NotificationTypeSystemAlert,
		Title:   title,
		Message: message,
		Link:    link,
		Read:    false,
	}

	return s.notificationRepo.Create(notification)
}
