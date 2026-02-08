package handlers

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	notificationRepo *repository.NotificationRepository
	preferencesRepo  *repository.NotificationPreferencesRepository
}

func NewNotificationHandler(appState *utils.AppState) *NotificationHandler {
	return &NotificationHandler{
		notificationRepo: repository.NewNotificationRepository(appState.DB),
		preferencesRepo:  repository.NewNotificationPreferencesRepository(appState.DB),
	}
}

func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var readFilter *bool
	if readParam := c.Query("read"); readParam != "" {
		read := readParam == "true"
		readFilter = &read
	}

	limit := 20
	if limitParam := c.Query("limit"); limitParam != "" {
		if parsed, err := strconv.Atoi(limitParam); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	notifications, err := h.notificationRepo.ListByUserID(userID, readFilter, limit)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, notifications)
}

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	count, err := h.notificationRepo.GetUnreadCount(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"unread_count": count})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		response.BadRequest(c, "Invalid notification ID")
		return
	}

	notification, err := h.notificationRepo.MarkAsRead(id, userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, notification)
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	count, err := h.notificationRepo.MarkAllAsRead(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"marked_count": count})
}

func (h *NotificationHandler) GetPreferences(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	prefs, err := h.preferencesRepo.GetByUserID(userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, prefs)
}

type UpdatePreferencesRequest struct {
	Interview24h bool `json:"interview_24h"`
	Interview1h  bool `json:"interview_1h"`
	Assessment3d bool `json:"assessment_3d"`
	Assessment1d bool `json:"assessment_1d"`
	Assessment1h bool `json:"assessment_1h"`
}

func (h *NotificationHandler) UpdatePreferences(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body")
		return
	}

	prefs := &models.UserNotificationPreferences{
		UserID:       userID,
		Interview24h: req.Interview24h,
		Interview1h:  req.Interview1h,
		Assessment3d: req.Assessment3d,
		Assessment1d: req.Assessment1d,
		Assessment1h: req.Assessment1h,
	}

	result, err := h.preferencesRepo.Upsert(prefs)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, result)
}
