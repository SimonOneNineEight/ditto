package repository

import (
	"database/sql"
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type NotificationPreferencesRepository struct {
	db *sqlx.DB
}

func NewNotificationPreferencesRepository(database *database.Database) *NotificationPreferencesRepository {
	return &NotificationPreferencesRepository{
		db: database.DB,
	}
}

func (r *NotificationPreferencesRepository) GetByUserID(userID uuid.UUID) (*models.UserNotificationPreferences, error) {
	query := `
		SELECT user_id, interview_24h, interview_1h, assessment_3d, assessment_1d, assessment_1h, created_at, updated_at
		FROM user_notification_preferences
		WHERE user_id = $1
	`

	var prefs models.UserNotificationPreferences
	err := r.db.Get(&prefs, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.DefaultNotificationPreferences(userID), nil
		}
		return nil, errors.ConvertError(err)
	}

	return &prefs, nil
}

func (r *NotificationPreferencesRepository) Upsert(prefs *models.UserNotificationPreferences) (*models.UserNotificationPreferences, error) {
	query := `
		INSERT INTO user_notification_preferences (user_id, interview_24h, interview_1h, assessment_3d, assessment_1d, assessment_1h)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			interview_24h = EXCLUDED.interview_24h,
			interview_1h = EXCLUDED.interview_1h,
			assessment_3d = EXCLUDED.assessment_3d,
			assessment_1d = EXCLUDED.assessment_1d,
			assessment_1h = EXCLUDED.assessment_1h,
			updated_at = NOW()
		RETURNING user_id, interview_24h, interview_1h, assessment_3d, assessment_1d, assessment_1h, created_at, updated_at
	`

	var result models.UserNotificationPreferences
	err := r.db.Get(&result, query,
		prefs.UserID,
		prefs.Interview24h,
		prefs.Interview1h,
		prefs.Assessment3d,
		prefs.Assessment1d,
		prefs.Assessment1h,
	)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &result, nil
}
