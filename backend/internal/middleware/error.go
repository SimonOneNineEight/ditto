package middleware

import (
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"log/slog"

	"github.com/gin-gonic/gin"
)

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			appErr := errors.ConvertError(err)

			logError(c, appErr)

			if !c.Writer.Written() {
				response.Error(c, appErr)
			}
		}
	}
}

func logError(c *gin.Context, err *errors.AppError) {
	attrs := []slog.Attr{
		slog.String("error_code", string(err.Code)),
		slog.String("error_category", err.Code.Category()),
		slog.String("message", err.Message),
		slog.Int("status", err.Status),
		slog.String("method", c.Request.Method),
		slog.String("path", c.Request.URL.Path),
		slog.String("user_agent", c.Request.UserAgent()),
	}

	if userID, exists := c.Get("user_id"); exists {
		attrs = append(attrs, slog.String("user_id", userID.(string)))
	}

	if err.Cause != nil {
		attrs = append(attrs, slog.String("cause", err.Cause.Error()))
	}

	switch err.Code.Category() {
	case "auth", "validation":
		slog.LogAttrs(c.Request.Context(), slog.LevelWarn, "Client error", attrs...)
	case "not_found":
		slog.LogAttrs(c.Request.Context(), slog.LevelInfo, "Resourse not found", attrs...)
	default:
		slog.LogAttrs(c.Request.Context(), slog.LevelError, "Server error", attrs...)
	}
}
