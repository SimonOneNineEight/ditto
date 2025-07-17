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
