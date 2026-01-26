package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/pkg/database"
	"ditto-backend/pkg/errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type FileRepository struct {
	db *sqlx.DB
}

func NewFileRepository(database *database.Database) *FileRepository {
	return &FileRepository{
		db: database.DB,
	}
}

func (r *FileRepository) CreateFile(file *models.File) (*models.File, error) {
	file.ID = uuid.New()
	file.CreatedAt = time.Now()
	file.UpdatedAt = time.Now()
	file.UploadedAt = time.Now()

	query := `
		INSERT INTO files (
			id, user_id, application_id, interview_id, file_name, file_type,
			file_size, s3_key, uploaded_at, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := r.db.Exec(query, file.ID, file.UserID, file.ApplicationID, file.InterviewID, file.FileName, file.FileType, file.FileSize, file.S3Key, file.UploadedAt, file.CreatedAt, file.UpdatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return file, nil
}

func (r *FileRepository) GetUserFiles(userID uuid.UUID, applicationID, interviewID *uuid.UUID) ([]*models.File, error) {
	query := `
		SELECT id, user_id, application_id, interview_id, file_name, 
				file_type, file_size, s3_key, uploaded_at, created_at, updated_at
		FROM files
		WHERE user_id = $1
		AND deleted_at IS NULL
	`

	args := []interface{}{userID}
	argIndex := 2

	if applicationID != nil {
		query += fmt.Sprintf(" AND application_id = $%d", argIndex)
		args = append(args, *applicationID)
		argIndex++
	}

	if interviewID != nil {
		query += fmt.Sprintf(" AND interview_id = $%d", argIndex)
		args = append(args, *interviewID)
		argIndex++
	}

	query += ` ORDER BY uploaded_at DESC`

	var files []*models.File
	err := r.db.Select(&files, query, args...)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return files, nil
}

func (r *FileRepository) SoftDeleteFile(fileID, userID uuid.UUID) error {
	query := `
		UPDATE files
		SET deleted_at = $1, updated_at = $1
		WHERE id = $2
		AND user_id = $3
		AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, time.Now(), fileID, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return errors.New(errors.ErrorNotFound, "file not found")
	}

	return nil
}

func (r *FileRepository) GetUserStorageUsage(userID uuid.UUID) (int64, error) {
	query := `
		SELECT COALESCE(SUM(file_size),0)
		FROM files
		WHERE user_id = $1
		AND deleted_at IS NULL
	`

	var totalBytes int64
	err := r.db.Get(&totalBytes, query, userID)
	if err != nil {
		return 0, errors.ConvertError(err)
	}

	return totalBytes, nil
}

func (r *FileRepository) GetUserFileCount(userID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM files
		WHERE user_id = $1
		AND deleted_at IS NULL
	`

	var count int
	err := r.db.Get(&count, query, userID)
	if err != nil {
		return 0, errors.ConvertError(err)
	}

	return count, nil
}

func (r *FileRepository) GetFileByID(fileID, userID uuid.UUID) (*models.File, error) {
	query := `
		SELECT id, user_id, application_id, interview_id, file_name, 
				file_type, file_size, s3_key, uploaded_at, created_at, updated_at
		FROM files
		WHERE user_id = $1
		AND id = $2
		AND deleted_at IS NULL
	`

	file := &models.File{}
	err := r.db.Get(file, query, userID, fileID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return file, nil
}

func (r *FileRepository) BeginTx() (*sqlx.Tx, error) {
	return r.db.Beginx()
}

func (r *FileRepository) CreateFileTx(tx *sqlx.Tx, file *models.File) (*models.File, error) {
	file.ID = uuid.New()
	file.CreatedAt = time.Now()
	file.UpdatedAt = time.Now()
	file.UploadedAt = time.Now()

	query := `
		INSERT INTO files (
			id, user_id, application_id, interview_id, file_name, file_type,
			file_size, s3_key, uploaded_at, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := tx.Exec(query, file.ID, file.UserID, file.ApplicationID, file.InterviewID, file.FileName, file.FileType, file.FileSize, file.S3Key, file.UploadedAt, file.CreatedAt, file.UpdatedAt)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return file, nil
}

func (r *FileRepository) SoftDeleteFileTx(tx *sqlx.Tx, fileID, userID uuid.UUID) error {
	query := `
		UPDATE files
		SET deleted_at = $1, updated_at = $1
		WHERE id = $2
		AND user_id = $3
		AND deleted_at IS NULL
	`

	result, err := tx.Exec(query, time.Now(), fileID, userID)
	if err != nil {
		return errors.ConvertError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.ConvertError(err)
	}

	if rowsAffected == 0 {
		return errors.New(errors.ErrorNotFound, "file not found")
	}

	return nil
}

type FileWithDetails struct {
	models.File
	ApplicationCompany *string `db:"application_company" json:"application_company,omitempty"`
	ApplicationTitle   *string `db:"application_title" json:"application_title,omitempty"`
}

func (r *FileRepository) GetUserFilesWithDetails(userID uuid.UUID, sortBy string) ([]*FileWithDetails, error) {
	query := `
		SELECT f.id, f.user_id, f.application_id, f.interview_id, f.file_name,
				f.file_type, f.file_size, f.s3_key, f.uploaded_at, f.created_at, f.updated_at,
				c.name as application_company,
				j.title as application_title
		FROM files f
		LEFT JOIN applications a ON f.application_id = a.id AND a.deleted_at IS NULL
		LEFT JOIN jobs j ON a.job_id = j.id AND j.deleted_at IS NULL
		LEFT JOIN companies c ON j.company_id = c.id AND c.deleted_at IS NULL
		WHERE f.user_id = $1
		AND f.deleted_at IS NULL
	`

	switch sortBy {
	case "file_name":
		query += " ORDER BY f.file_name ASC"
	case "uploaded_at":
		query += " ORDER BY f.uploaded_at DESC"
	default:
		query += " ORDER BY f.file_size DESC"
	}

	var files []*FileWithDetails
	err := r.db.Select(&files, query, userID)
	if err != nil {
		return nil, errors.ConvertError(err)
	}

	return files, nil
}
