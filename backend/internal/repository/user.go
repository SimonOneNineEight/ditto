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
	defer tx.Rollback()

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
        SELECT id, user_id, password_hash, auth_provider, avatar_url,
            refresh_token, refresh_token_expires_at, created_at, updated_at
        FROM users_auth
        WHERE user_id = $1
    `

	err := r.db.Get(userAuth, query, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return userAuth, nil
}

func (r *UserRepository) UpdateRefreshToken(userID uuid.UUID, refreshToken string, expiresAt time.Time) error {
	query := `
        UPDATE users_auth
        SET refresh_token = $1, refresh_token_expires_at = $2, updated_at = $3
        WHERE user_id = $4
    `

	_, err := r.db.Exec(query, refreshToken, expiresAt, time.Now(), userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	return nil
}

func (r *UserRepository) ValidateRefreshToken(userID uuid.UUID, refreshToken string) (bool, error) {
	var count int
	query := `
        SELECT COUNT(*)
        FROM users_auth
        WHERE user_id = $1 AND refresh_token = $2 AND refresh_token_expires_at > $3
    `
	err := r.db.Get(&count, query, userID, refreshToken, time.Now())
	if err != nil {
		return false, errors.ConvertError(err)
	}
	return count > 0, nil
}

func (r *UserRepository) ClearRefreshToken(userID uuid.UUID) error {
	query := `
        UPDATE users_auth
        SET refresh_token = NULL, refresh_token_expires_at = NULL, updated_at = $1
        WHERE user_id = $2
    `

	_, err := r.db.Exec(query, time.Now(), userID)
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
	defer tx.Rollback()

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

func (r *UserRepository) CreateOrUpdateOAuthUser(email, name, provider, avatarURL string) (*models.User, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, errors.NewDatabaseError("failed to begin transaction", err)
	}

	defer tx.Rollback()

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

		authUpdateQuery := `
            INSERT INTO users_auth (id, user_id, auth_provider, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id)
            DO UPDATE SET auth_provider = $3, avatar_url = $4, updated_at = $6
        `

		_, err = tx.Exec(authUpdateQuery, uuid.New(), user.ID, provider, avatarURL, time.Now(), time.Now())
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

		userQuery := `
            INSERT INTO users (id, email, name, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
        `

		_, err = tx.Exec(userQuery, user.ID, user.Email, user.Name, user.CreatedAt, user.UpdatedAt)
		if err != nil {
			return nil, errors.ConvertError(err)
		}

		authQuery := `
            INSERT INTO users_auth (id, user_id, auth_provider, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
        `

		_, err = tx.Exec(authQuery, uuid.New(), userID, provider, avatarURL, time.Now(), time.Now())
	}

	if err != nil {
		return nil, errors.ConvertError(err)
	}

	if err = tx.Commit(); err != nil {
		return nil, errors.ConvertError(err)
	}

	return user, nil
}
