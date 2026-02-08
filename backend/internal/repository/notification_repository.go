package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type NotificationRepository struct {
	db *sqlx.DB
}

func NewNotificationRepository(database *database.Database) *NotificationRepository {
	return &NotificationRepository{
		db: database.DB,
	}
}

func (r *NotificationRepository) ListByUserID(userID uuid.UUID, readFilter *bool, limit int) ([]models.Notification, error) {
	if limit <= 0 {
		limit = 20
	}

	query := `
		SELECT id, user_id, type, title, message, link, read, created_at, deleted_at
		FROM notifications
		WHERE user_id = $1 AND deleted_at IS NULL
	`
	args := []any{userID}

	if readFilter != nil {
		query += " AND read = $2"
		args = append(args, *readFilter)
		query += " ORDER BY created_at DESC LIMIT $3"
		args = append(args, limit)
	} else {
		query += " ORDER BY created_at DESC LIMIT $2"
		args = append(args, limit)
	}

	var notifications []models.Notification
	err := r.db.Select(&notifications, query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	if notifications == nil {
		notifications = []models.Notification{}
	}

	return notifications, nil
}

func (r *NotificationRepository) GetUnreadCount(userID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false AND deleted_at IS NULL`

	err := r.db.Get(&count, query, userID)
	if err != nil {
		return 0, errors.ConvertError(err)
	}

	return count, nil
}

func (r *NotificationRepository) MarkAsRead(id uuid.UUID, userID uuid.UUID) (*models.Notification, error) {
	query := `
		UPDATE notifications
		SET read = true
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
		RETURNING id, user_id, type, title, message, link, read, created_at, deleted_at
	`

	var notification models.Notification
	err := r.db.Get(&notification, query, id, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &notification, nil
}

func (r *NotificationRepository) MarkAllAsRead(userID uuid.UUID) (int, error) {
	query := `
		UPDATE notifications
		SET read = true
		WHERE user_id = $1 AND read = false AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, userID)
	if err != nil {
		return 0, errors.ConvertError(err)
	}

	count, err := result.RowsAffected()
	if err != nil {
		return 0, errors.ConvertError(err)
	}

	return int(count), nil
}

func (r *NotificationRepository) Create(notification *models.Notification) (*models.Notification, error) {
	query := `
		INSERT INTO notifications (user_id, type, title, message, link, read)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, type, title, message, link, read, created_at, deleted_at
	`

	var created models.Notification
	err := r.db.Get(&created, query,
		notification.UserID,
		notification.Type,
		notification.Title,
		notification.Message,
		notification.Link,
		notification.Read,
	)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &created, nil
}

func (r *NotificationRepository) GetByID(id uuid.UUID, userID uuid.UUID) (*models.Notification, error) {
	query := `
		SELECT id, user_id, type, title, message, link, read, created_at, deleted_at
		FROM notifications
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
	`

	var notification models.Notification
	err := r.db.Get(&notification, query, id, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &notification, nil
}

func (r *NotificationRepository) ExistsByLink(userID uuid.UUID, link string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM notifications
			WHERE user_id = $1 AND link = $2 AND deleted_at IS NULL
		)
	`

	var exists bool
	err := r.db.Get(&exists, query, userID, link)
	if err != nil {
		return false, errors.ConvertError(err)
	}

	return exists, nil
}
