package response

import (
	"ditto-backend/pkg/errors"

	"github.com/gin-gonic/gin"
)

type ApiResponse struct {
	Success    bool        `json:"success"`
	StatusCode int         `json:"status_code"`
	Data       interface{} `json:"data,omitempty"`
	Error      *string     `json:"error,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, ApiResponse{
		Success:    true,
		StatusCode: 200,
		Data:       data,
	})
}

func SuccessWithStatus(c *gin.Context, status int, data interface{}) {
	c.JSON(200, ApiResponse{
		Success:    true,
		StatusCode: status,
		Data:       data,
	})
}

func Error(c *gin.Context, error *errors.AppError) {
	c.JSON(error.Status, ApiResponse{
		Success:    false,
		StatusCode: error.Status,
		Error:      &error.Message,
	})
}

func ErrorFromString(c *gin.Context, status int, message string) {
	c.JSON(status, ApiResponse{
		Success:    false,
		StatusCode: status,
		Error:      &message,
	})
}
