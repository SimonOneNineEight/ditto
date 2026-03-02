package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(database *database.Database) *UserRepository {
	return &UserRepository{
		db: database.DB,
	}
}

func (r *UserRepository) CreateUser(email, name, passwordHash string) (*models.User, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, errors.NewDatabaseError("failed to begin transaction", err)
	}
	defer tx.Rollback() //nolint:errcheck

	userID := uuid.New()
	user := &models.User{
		ID:        userID,
		Email:     email,
		Name:      name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	query := `
        INSERT INTO users (id, email, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
    `
	_, err = tx.Exec(query, user.ID, user.Email, user.Name, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	userAuth := &models.UserAuth{
		ID:           uuid.New(),
		UserID:       userID,
		PasswordHash: &passwordHash,
		AuthProvider: "local",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	authQuery := `
        INSERT INTO users_auth(id, user_id, password_hash, auth_provider, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
    `

	_, err = tx.Exec(authQuery, userAuth.ID, userAuth.UserID, userAuth.PasswordHash, userAuth.AuthProvider, userAuth.CreatedAt, userAuth.UpdatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	if err = tx.Commit(); err != nil {
		return nil, errors.ConvertError(err)
	}

	return user, nil
}

func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}

	query := `
        SELECT id, email, name, created_at, updated_at 
        FROM users
        WHERE email = $1 AND deleted_at IS NULL
    `
	err := r.db.Get(user, query, email)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return user, nil
}

func (r *UserRepository) GetUserByID(id uuid.UUID) (*models.User, error) {
	user := &models.User{}

	query := `
        SELECT id, email, name, created_at, updated_at 
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
    `
	err := r.db.Get(user, query, id)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return user, nil
}

func (r *UserRepository) GetUserAuth(userID uuid.UUID) (*models.UserAuth, error) {
	userAuth := &models.UserAuth{}

	query := `
        SELECT id, user_id, password_hash, auth_provider, avatar_url, created_at, updated_at
        FROM users_auth
        WHERE user_id = $1
        LIMIT 1
    `

	err := r.db.Get(userAuth, query, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return userAuth, nil
}

func (r *UserRepository) GetUserAuthByProvider(userID uuid.UUID, provider string) (*models.UserAuth, error) {
	userAuth := &models.UserAuth{}

	query := `
        SELECT id, user_id, password_hash, auth_provider, provider_email, avatar_url, created_at, updated_at
        FROM users_auth
        WHERE user_id = $1 AND auth_provider = $2
    `

	err := r.db.Get(userAuth, query, userID, provider)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return userAuth, nil
}

func (r *UserRepository) UpdateRefreshToken(userID uuid.UUID, refreshToken string, expiresAt time.Time) error {
	query := `
        INSERT INTO user_refresh_tokens (id, user_id, refresh_token, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id)
        DO UPDATE SET refresh_token = $3, expires_at = $4, created_at = $5
    `

	_, err := r.db.Exec(query, uuid.New(), userID, refreshToken, expiresAt, time.Now())
	if err != nil {
		return errors.ConvertError(err)
	}

	return nil
}

func (r *UserRepository) ValidateRefreshToken(userID uuid.UUID, refreshToken string) (bool, error) {
	var count int
	query := `
        SELECT COUNT(*)
        FROM user_refresh_tokens
        WHERE user_id = $1 AND refresh_token = $2 AND expires_at > $3
    `
	err := r.db.Get(&count, query, userID, refreshToken, time.Now())
	if err != nil {
		return false, errors.ConvertError(err)
	}
	return count > 0, nil
}

func (r *UserRepository) ClearRefreshToken(userID uuid.UUID) error {
	query := `
        DELETE FROM user_refresh_tokens
        WHERE user_id = $1
    `

	_, err := r.db.Exec(query, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	return nil
}

func (r *UserRepository) SoftDeleteUser(userID uuid.UUID) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return errors.NewDatabaseError("failed to begin transaction", err)
	}
	defer tx.Rollback() //nolint:errcheck

	now := time.Now()

	_, err = tx.Exec("DELETE FROM notifications WHERE user_id = $1", userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete notifications", err)
	}

	_, err = tx.Exec("DELETE FROM user_notification_preferences WHERE user_id = $1", userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete notification preferences", err)
	}

	_, err = tx.Exec(`
		UPDATE assessment_submissions SET deleted_at = $1
		WHERE assessment_id IN (SELECT id FROM assessments WHERE user_id = $2)
		AND deleted_at IS NULL`, now, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete assessment submissions", err)
	}

	_, err = tx.Exec("UPDATE assessments SET deleted_at = $1 WHERE user_id = $2 AND deleted_at IS NULL", now, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete assessments", err)
	}

	_, err = tx.Exec(`
		UPDATE interview_questions SET deleted_at = $1
		WHERE interview_id IN (SELECT id FROM interviews WHERE user_id = $2)
		AND deleted_at IS NULL`, now, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete interview questions", err)
	}

	_, err = tx.Exec(`
		UPDATE interview_notes SET deleted_at = $1
		WHERE interview_id IN (SELECT id FROM interviews WHERE user_id = $2)
		AND deleted_at IS NULL`, now, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete interview notes", err)
	}

	_, err = tx.Exec(`
		UPDATE interviewers SET deleted_at = $1
		WHERE interview_id IN (SELECT id FROM interviews WHERE user_id = $2)
		AND deleted_at IS NULL`, now, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete interviewers", err)
	}

	_, err = tx.Exec("UPDATE interviews SET deleted_at = $1 WHERE user_id = $2 AND deleted_at IS NULL", now, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete interviews", err)
	}

	_, err = tx.Exec("UPDATE files SET deleted_at = $1 WHERE user_id = $2 AND deleted_at IS NULL", now, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete files", err)
	}

	_, err = tx.Exec("UPDATE applications SET deleted_at = $1 WHERE user_id = $2 AND deleted_at IS NULL", now, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete applications", err)
	}

	_, err = tx.Exec("DELETE FROM user_refresh_tokens WHERE user_id = $1", userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete refresh tokens", err)
	}

	_, err = tx.Exec("DELETE FROM users_auth WHERE user_id = $1", userID)
	if err != nil {
		return errors.NewDatabaseError("failed to delete user auth", err)
	}

	result, err := tx.Exec(`
		UPDATE users
		SET deleted_at = $1, updated_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`, now, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return errors.New(errors.ErrorNotFound, "user not found")
	}

	if err = tx.Commit(); err != nil {
		return errors.ConvertError(err)
	}

	return nil
}

func (r *UserRepository) GetUserAuthProviders(userID uuid.UUID) ([]models.UserAuth, error) {
	var providers []models.UserAuth
	query := `
		SELECT id, user_id, password_hash, auth_provider, provider_email, avatar_url, created_at, updated_at
		FROM users_auth
		WHERE user_id = $1
		ORDER BY created_at ASC
	`
	err := r.db.Select(&providers, query, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}
	return providers, nil
}

func (r *UserRepository) LinkProvider(userID uuid.UUID, provider, email, avatarURL string) error {
	query := `
		INSERT INTO users_auth (id, user_id, auth_provider, provider_email, avatar_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(query, uuid.New(), userID, provider, email, avatarURL, time.Now(), time.Now())
	if err != nil {
		return errors.ConvertError(err)
	}
	return nil
}

func (r *UserRepository) GetAuthByProviderEmail(provider, email string) (*models.UserAuth, error) {
	userAuth := &models.UserAuth{}
	query := `
		SELECT ua.id, ua.user_id, ua.password_hash, ua.auth_provider, ua.provider_email, ua.avatar_url, ua.created_at, ua.updated_at
		FROM users_auth ua
		JOIN users u ON ua.user_id = u.id
		WHERE ua.auth_provider = $1 AND u.email = $2 AND u.deleted_at IS NULL
	`
	err := r.db.Get(userAuth, query, provider, email)
	if err != nil {
		return nil, errors.ConvertError(err)
	}
	return userAuth, nil
}

func (r *UserRepository) UnlinkProvider(userID uuid.UUID, provider string) error {
	result, err := r.db.Exec(
		"DELETE FROM users_auth WHERE user_id = $1 AND auth_provider = $2",
		userID, provider,
	)
	if err != nil {
		return errors.ConvertError(err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}
	if rows == 0 {
		return errors.New(errors.ErrorNotFound, "provider not found")
	}
	return nil
}

func (r *UserRepository) CountAuthMethods(userID uuid.UUID) (int, error) {
	var count int
	err := r.db.Get(&count, "SELECT COUNT(*) FROM users_auth WHERE user_id = $1", userID)
	if err != nil {
		return 0, errors.ConvertError(err)
	}
	return count, nil
}

func (r *UserRepository) HasPassword(userID uuid.UUID) (bool, error) {
	var count int
	query := `
		SELECT COUNT(*) FROM users_auth
		WHERE user_id = $1 AND auth_provider = 'local' AND password_hash IS NOT NULL
	`
	err := r.db.Get(&count, query, userID)
	if err != nil {
		return false, errors.ConvertError(err)
	}
	return count > 0, nil
}

func (r *UserRepository) SetPassword(userID uuid.UUID, hashedPassword string) error {
	query := `
		INSERT INTO users_auth (id, user_id, auth_provider, password_hash, created_at, updated_at)
		VALUES ($1, $2, 'local', $3, $4, $5)
	`
	_, err := r.db.Exec(query, uuid.New(), userID, hashedPassword, time.Now(), time.Now())
	if err != nil {
		return errors.ConvertError(err)
	}
	return nil
}

func (r *UserRepository) UpdatePassword(userID uuid.UUID, hashedPassword string) error {
	result, err := r.db.Exec(
		"UPDATE users_auth SET password_hash = $1, updated_at = $2 WHERE user_id = $3 AND auth_provider = 'local'",
		hashedPassword, time.Now(), userID,
	)
	if err != nil {
		return errors.ConvertError(err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}
	if rows == 0 {
		return errors.New(errors.ErrorNotFound, "no password to update")
	}
	return nil
}

func (r *UserRepository) GetPasswordHash(userID uuid.UUID) (string, error) {
	var hash string
	query := `
		SELECT password_hash FROM users_auth
		WHERE user_id = $1 AND auth_provider = 'local' AND password_hash IS NOT NULL
	`
	err := r.db.Get(&hash, query, userID)
	if err != nil {
		return "", errors.ConvertError(err)
	}
	return hash, nil
}

func (r *UserRepository) CreateOrUpdateOAuthUser(email, name, provider, avatarURL string) (*models.User, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, errors.NewDatabaseError("failed to begin transaction", err)
	}

	defer tx.Rollback() //nolint:errcheck

	existingUser, err := r.GetUserByEmail(email)
	if err != nil && !errors.IsNotFoundError(err) {
		return nil, err
	}

	var user *models.User

	if existingUser != nil {
		user = existingUser
		updateQuery := `
            UPDATE users SET name = $1, updated_at = $2
            WHERE email = $3 AND deleted_at IS NULL
        `

		_, err = tx.Exec(updateQuery, name, time.Now(), email)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		var existingAuthCount int
		err = tx.Get(&existingAuthCount,
			"SELECT COUNT(*) FROM users_auth WHERE user_id = $1 AND auth_provider = $2",
			user.ID, provider)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		if existingAuthCount > 0 {
			_, err = tx.Exec(`
                UPDATE users_auth SET provider_email = $1, avatar_url = $2, updated_at = $3
                WHERE user_id = $4 AND auth_provider = $5
            `, email, avatarURL, time.Now(), user.ID, provider)
		} else {
			_, err = tx.Exec(`
                INSERT INTO users_auth (id, user_id, auth_provider, provider_email, avatar_url, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, uuid.New(), user.ID, provider, email, avatarURL, time.Now(), time.Now())
		}

		if err != nil {
			return nil, errors.ConvertError(err)
		}
	} else {
		userID := uuid.New()
		user = &models.User{
			ID:        userID,
			Email:     email,
			Name:      name,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		_, err = tx.Exec(`
            INSERT INTO users (id, email, name, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
        `, user.ID, user.Email, user.Name, user.CreatedAt, user.UpdatedAt)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		_, err = tx.Exec(`
            INSERT INTO users_auth (id, user_id, auth_provider, provider_email, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, uuid.New(), userID, provider, email, avatarURL, time.Now(), time.Now())
		if err != nil {
			return nil, errors.ConvertError(err)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, errors.ConvertError(err)
	}

	return user, nil
}
