package handlers

import (
	"log/slog"
	"time"

	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func HandleError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	appErr := errors.ConvertError(err)
	logHandlerError(c, appErr)

	if isInternalError(appErr) {
		response.Error(c, errors.New(appErr.Code, "Something went wrong. Please try again."))
		return
	}
	response.Error(c, appErr)
}

func HandleErrorWithMessage(c *gin.Context, err error, message string) {
	if err == nil {
		return
	}

	appErr := errors.ConvertError(err)
	if appErr.Code == errors.ErrorUnexpected || isInternalError(appErr) {
		appErr = errors.Wrap(errors.ErrorInternalServer, "Something went wrong. Please try again.", err)
	}
	logHandlerError(c, appErr)
	response.Error(c, appErr)
}

func isInternalError(err *errors.AppError) bool {
	return err.Code == errors.ErrorInternalServer ||
		err.Code == errors.ErrorDatabaseError ||
		err.Code == errors.ErrorUnexpected
}

func logHandlerError(c *gin.Context, err *errors.AppError) {
	attrs := []slog.Attr{
		slog.String("error_code", string(err.Code)),
		slog.String("error_category", err.Code.Category()),
		slog.String("message", err.Message),
		slog.Int("status", err.Status),
		slog.String("method", c.Request.Method),
		slog.String("endpoint", c.Request.URL.Path),
	}

	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(uuid.UUID); ok {
			attrs = append(attrs, slog.String("user_id", uid.String()))
		}
	}

	if start, exists := c.Get("request_start"); exists {
		if t, ok := start.(time.Time); ok {
			attrs = append(attrs, slog.Int64("duration_ms", time.Since(t).Milliseconds()))
		}
	}

	if err.Cause != nil {
		attrs = append(attrs, slog.String("cause", err.Cause.Error()))
	}

	switch err.Code.Category() {
	case "auth", "validation":
		slog.LogAttrs(c.Request.Context(), slog.LevelWarn, "Client error", attrs...)
	case "not_found":
		slog.LogAttrs(c.Request.Context(), slog.LevelInfo, "Resource not found", attrs...)
	default:
		slog.LogAttrs(c.Request.Context(), slog.LevelError, "Server error", attrs...)
	}
}
