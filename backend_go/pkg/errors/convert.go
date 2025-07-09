package errors

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/lib/pq"
)

func ConvertError(err error) *AppError {
	if err == nil {
		return nil
	}

	if appErr, ok := err.(*AppError); ok {
		return appErr
	}

	if err == sql.ErrNoRows {
		return New(ErrorNotFound, "Database record not found")
	}

	if pqErr, ok := err.(*pq.Error); ok {
		return convertPQError(pqErr)
	}

	if valErr, ok := err.(validator.ValidationErrors); ok {
		return NewValidationError(formatValidationErrors(valErr))
	}

	return New(ErrorUnexpected, err.Error())
}

func convertPQError(pqErr *pq.Error) *AppError {
	switch pqErr.Code {
	case "23505":
		if strings.Contains(pqErr.Detail, "email") {
			return New(ErrorEmailAlreadyExists, "Email already exists")
		}
		return New(ErrorConflict, "Resource already exists")
	case "23503":
		return New(ErrorBadRequest, "Invalid reference")

	case "23502":
		return New(ErrorBadRequest, "Required field is missing")
	default:
		return NewDatabaseError("Database error occurred", pqErr)
	}
}

func formatValidationErrors(errs validator.ValidationErrors) string {
	var messages []string

	for _, err := range errs {
		switch err.Tag() {
		case "required":
			messages = append(messages, fmt.Sprintf("%s is required", err.Field()))
		case "email":
			messages = append(messages, fmt.Sprintf("%s must be a valid email", err.Field()))
		case "min":
			messages = append(messages, fmt.Sprintf("%s must be at least %s characters", err.Field(), err.Param()))
		case "max":
			messages = append(messages, fmt.Sprintf("%s must be at most %s characters", err.Field(), err.Param()))

		default:
			messages = append(messages, fmt.Sprintf("%s is invalid", err.Field()))
		}
	}
	return strings.Join(messages, ", ")
}
