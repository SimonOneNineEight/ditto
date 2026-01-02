package response

import (
	"ditto-backend/pkg/errors"

	"github.com/gin-gonic/gin"
)

type ApiResponse struct {
	Success  bool         `json:"success"`
	Data     interface{}  `json:"data,omitempty"`
	Warnings []string     `json:"warnings,omitempty"`
	Error    *ErrorDetail `json:"error,omitempty"`
}

type ErrorDetail struct {
	Message string   `json:"error"`
	Code    string   `json:"code"`
	Details []string `json:"details,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, ApiResponse{
		Success: true,
		Data:    data,
	})
}

func SuccessWithStatus(c *gin.Context, status int, data interface{}) {
	c.JSON(200, ApiResponse{
		Success: true,
		Data:    data,
	})
}

func Error(c *gin.Context, error *errors.AppError) {
	c.JSON(error.Status, ApiResponse{
		Success: false,
		Error: &ErrorDetail{
			Message: error.Message,
			Code:    string(error.Code),
			Details: error.Details,
		},
	})
}

func ErrorFromString(c *gin.Context, status int, message string) {
	c.JSON(status, ApiResponse{
		Success: false,
		Error: &ErrorDetail{
			Message: message,
			Code:    "ERROR",
			Details: nil,
		},
	})
}

func SuccessWithWarnings(c *gin.Context, data interface{}, warnings []string) {
	c.JSON(200, ApiResponse{
		Success:  true,
		Data:     data,
		Warnings: warnings,
	})
}
