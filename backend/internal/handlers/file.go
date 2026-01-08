package handlers

import (
	"context"
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"time"

	s3service "ditto-backend/internal/services/s3"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	MaxFileSize        = 5 * 1024 * 1024   // 5MB
	MaxStoragePerUser  = 100 * 1024 * 1024 // 100MB
	PresignedURLExpiry = 15 * time.Minute
)

var allowedFileTypes = map[string]bool{
	"application/pdf": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, // DOCX
	"text/plain": true, // TXT
}

type FileHandler struct {
	fileRepo  *repository.FileRepository
	s3Service *s3service.S3Service
}

func NewFileHandler(fileRepo *repository.FileRepository, s3Service *s3service.S3Service) *FileHandler {
	return &FileHandler{
		fileRepo:  fileRepo,
		s3Service: s3Service,
	}
}

type PresignedUploadRequest struct {
	FileName      string     `json:"file_name" binding:"required"`
	FileType      string     `json:"file_type" binding:"required"`
	FileSize      int64      `json:"file_size" binding:"required"`
	ApplicationID uuid.UUID  `json:"application_id" binding:"required"`
	InterviewID   *uuid.UUID `json:"interview_id,omitempty"`
}

type PresignedUploadResponse struct {
	PresignedURL string `json:"presigned_url"`
	S3Key        string `json:"s3_key"`
	ExpiresIn    int    `json:"expires_in"`
}

type ConfirmUploadRequest struct {
	S3Key         string     `json:"s3_key" binding:"required"`
	FileName      string     `json:"file_name" binding:"required"`
	FileType      string     `json:"file_type" binding:"required"`
	FileSize      int64      `json:"file_size" binding:"required"`
	ApplicationID uuid.UUID  `json:"application_id" binding:"required"`
	InterviewID   *uuid.UUID `json:"interview_id,omitempty"`
}

type FileResponse struct {
	ID         uuid.UUID `json:"id"`
	FileName   string    `json:"file_name"`
	FileType   string    `json:"file_type"`
	FileSize   int64     `json:"file_size"`
	S3Key      string    `json:"s3_key"`
	UploadedAt time.Time `json:"uploaded_at"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type StorageStatsResponse struct {
	UsedBytes       int64 `json:"used_bytes"`
	TotalBytes      int64 `json:"total_bytes"`
	FileCount       int   `json:"file_count"`
	UsagePercentage int   `json:"usage_percentage"`
	Warning         bool  `json:"warning"`
	LimitReached    bool  `json:"limit_reached"`
}

// POST /api/files/presigned-upload
func (h *FileHandler) GetPresignedUploadURL(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req PresignedUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "invalid request body", err.Error()))
		return
	}

	if !allowedFileTypes[req.FileType] {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "unsupported file type. Allowed: PDF, DOCX, TXT"))
		return
	}

	if req.FileSize > MaxFileSize {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "file exceeds 5MB limit"))
		return
	}

	usedBytes, err := h.fileRepo.GetUserStorageUsage(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	if usedBytes+req.FileSize > MaxStoragePerUser {
		HandleError(c, errors.New(errors.ErrorQuotaExceeded, "storage limit reached. Please delete old files"))
		return
	}

	s3Key := s3service.GenerateS3Key(userID, req.FileName)

	ctx := context.Background()
	presignedURL, err := h.s3Service.GeneratePresignedPutURL(ctx, s3Key, req.FileType)
	if err != nil {
		HandleError(c, errors.Wrap(errors.ErrorInternalServer, "failed to generate upload URL", err))
		return
	}

	response.Success(c, PresignedUploadResponse{
		PresignedURL: presignedURL,
		S3Key:        s3Key,
		ExpiresIn:    int(PresignedURLExpiry.Seconds()),
	})
}

func (h *FileHandler) ConfirmUpload(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req ConfirmUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.New(errors.ErrorValidationFailed, "invalid request body", err.Error()))
		return
	}

	ctx := context.Background()
	exists, err := h.s3Service.HeadObject(ctx, req.S3Key)
	if err != nil {
		HandleError(c, errors.Wrap(errors.ErrorInternalServer, "failed to verify file upload", err))
		return
	}

	if !exists {
		HandleError(c, errors.New(errors.ErrorBadRequest, "file not found in storage. Upload may have failed"))
		return
	}

	file := &models.File{
		UserID:        userID,
		ApplicationID: req.ApplicationID,
		InterviewID:   req.InterviewID,
		FileName:      req.FileName,
		FileType:      req.FileType,
		FileSize:      req.FileSize,
		S3Key:         req.S3Key,
	}

	createdFile, err := h.fileRepo.CreateFile(file)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, FileResponse{
		ID:         createdFile.ID,
		FileName:   createdFile.FileName,
		FileType:   createdFile.FileType,
		FileSize:   createdFile.FileSize,
		S3Key:      createdFile.S3Key,
		UploadedAt: createdFile.UploadedAt,
		CreatedAt:  createdFile.CreatedAt,
		UpdatedAt:  createdFile.UpdatedAt,
	})
}

// GET /api/files/:id
func (h *FileHandler) GetFile(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid file ID"))
		return
	}

	file, err := h.fileRepo.GetFileByID(fileID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	ctx := context.Background()
	downloadURL, err := h.s3Service.GeneratePresignedGetURL(ctx, file.S3Key)
	if err != nil {
		HandleError(c, errors.Wrap(errors.ErrorInternalServer, "failed to generate download URL", err))
		return
	}

	response.Success(c, gin.H{
		"presigned_url": downloadURL,
		"expires_in":    int(PresignedURLExpiry.Seconds()),
		"file_name":     file.FileName,
		"file_size":     file.FileSize,
		"file_type":     file.FileType,
	})
}

// DELETE /api/files/:id
func (h *FileHandler) DeleteFile(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		HandleError(c, errors.New(errors.ErrorBadRequest, "invalid file ID"))
		return
	}

	file, err := h.fileRepo.GetFileByID(fileID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	err = h.fileRepo.SoftDeleteFile(fileID, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	ctx := context.Background()
	_ = h.s3Service.DeleteObject(ctx, file.S3Key)

	response.Success(c, gin.H{
		"message": "file deleted successfully",
	})
}

// GET /api/users/storage-stats
func (h *FileHandler) GetStorageStats(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	usedBytes, err := h.fileRepo.GetUserStorageUsage(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	fileCount, err := h.fileRepo.GetUserFileCount(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	usagePercentage := int((float64(usedBytes) / float64(MaxStoragePerUser)) * 100)
	if usagePercentage > 100 {
		usagePercentage = 100
	}

	response.Success(c, StorageStatsResponse{
		UsedBytes:       usedBytes,
		TotalBytes:      MaxStoragePerUser,
		FileCount:       fileCount,
		UsagePercentage: usagePercentage,
		Warning:         usagePercentage > 90,
		LimitReached:    usedBytes >= MaxStoragePerUser,
	})
}
