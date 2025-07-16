package handlers

import (
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

func HandleError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	appErr := errors.ConvertError(err)
	response.Error(c, appErr)
}

func HandleErrorWithMessage(c *gin.Context, err error, message string) {
	if err == nil {
		return
	}

	appErr := errors.ConvertError(err)
	if appErr.Code == errors.ErrorUnexpected {
		appErr = errors.NewWithCause(errors.ErrorInternalServer, message, err)
	}
	response.Error(c, appErr)
}

func IsNotFoundError(err error) bool {
	if err == nil {
		return false
	}

	appErr := errors.ConvertError(err)
	return appErr.Code == errors.ErrorNotFound || appErr.Code == errors.ErrorUserNotFound
}
