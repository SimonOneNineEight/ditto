package repository

import (
	"database/sql"
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type RateLimitRepository struct {
	db *sqlx.DB
}

func NewRateLimitRepository(database *database.Database) *RateLimitRepository {
	return &RateLimitRepository{
		db: database.DB,
	}
}

func (r *RateLimitRepository) CreateRateLimit(userId uuid.UUID, resource string, initialCount int) (*models.RateLimit, error) {
	id := uuid.New()
	windowStart := time.Now()
	windowEnd := windowStart.Add(24 * time.Hour)
	createdAt := time.Now()
	updatedAt := time.Now()

	query := `
		INSERT INTO rate_limits (
			id, user_id, resource, request_count, window_start, window_end, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.Exec(query, id, userId, resource, initialCount, windowStart, windowEnd, createdAt, updatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return &models.RateLimit{
		ID:           id,
		UserID:       userId,
		Resource:     resource,
		RequestCount: initialCount,
		WindowStart:  windowStart,
		WindowEnd:    windowEnd,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}, nil
}

func (r *RateLimitRepository) CheckAndIncrement(userId uuid.UUID, resource string, limit int) (bool, int, error) {
	now := time.Now()

	var rateLimit models.RateLimit

	query := `
		SELECT * FROM rate_limits
		WHERE user_id = $1 AND resource = $2 AND window_end > $3
		ORDER BY created_at DESC LIMIT 1
	`

	err := r.db.Get(&rateLimit, query, userId, resource, now)
	if err == sql.ErrNoRows {
		_, err := r.CreateRateLimit(userId, resource, 1)
		if err != nil {
			return false, 0, err
		}

		return true, limit - 1, nil
	}

	if err != nil {
		return false, 0, errors.ConvertError(err)
	}

	if rateLimit.RequestCount >= limit {
		return false, 0, nil
	}

	updateQuery := `
		UPDATE rate_limits
		SET request_count = request_count + 1, updated_at = $1
		WHERE id = $2
	`

	_, err = r.db.Exec(updateQuery, time.Now(), rateLimit.ID)
	if err != nil {
		return false, 0, errors.ConvertError(err)
	}

	remaining := limit - (rateLimit.RequestCount + 1)
	return true, remaining, nil
}

func (r *RateLimitRepository) CleanupExpiredWindows() error {
	cutoff := time.Now().Add(-30 * 24 * time.Hour)

	query := `DELETE FROM rate_limits WHERE window_end < $1`
	_, err := r.db.Exec(query, cutoff)
	if err != nil {
		return errors.ConvertError(err)
	}

	return nil
}

func (r *RateLimitRepository) GetCurrentUsage(userId uuid.UUID, resource string, limit int) (used int, remaining int, resetAt time.Time, err error) {
	now := time.Now()

	var rateLimit models.RateLimit
	query := `
		SELECT * FROM rate_limits
		WHERE user_id = $1 AND resource = $2 AND window_end > $3
		ORDER BY created_at DESC LIMIT 1
	`

	err = r.db.Get(&rateLimit, query, userId, resource, now)
	if err == sql.ErrNoRows {
		return 0, limit, time.Time{}, nil
	}

	if err != nil {
		return 0, 0, time.Time{}, errors.ConvertError(err)
	}

	used = rateLimit.RequestCount
	remaining = limit - used
	if remaining < 0 {
		remaining = 0
	}

	return used, remaining, rateLimit.WindowEnd, nil
}
