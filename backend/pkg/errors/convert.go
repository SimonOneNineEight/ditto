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
		return NewFieldValidationError(formatValidationFieldErrors(valErr))
	}

	return Wrap(ErrorUnexpected, "Something went wrong. Please try again.", err)
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

func formatValidationFieldErrors(errs validator.ValidationErrors) map[string]string {
	fieldErrors := make(map[string]string, len(errs))
	for _, err := range errs {
		field := toSnakeCase(err.Field())
		label := humanizeFieldName(field)
		switch err.Tag() {
		case "required":
			fieldErrors[field] = fmt.Sprintf("%s is required", label)
		case "email":
			fieldErrors[field] = fmt.Sprintf("%s must be a valid email", label)
		case "min":
			fieldErrors[field] = fmt.Sprintf("%s must be at least %s characters", label, err.Param())
		case "max":
			fieldErrors[field] = fmt.Sprintf("%s must be at most %s characters", label, err.Param())
		case "url":
			fieldErrors[field] = fmt.Sprintf("%s must be a valid URL", label)
		case "oneof":
			fieldErrors[field] = fmt.Sprintf("%s must be one of: %s", label, err.Param())
		default:
			fieldErrors[field] = fmt.Sprintf("%s is invalid", label)
		}
	}
	return fieldErrors
}

func humanizeFieldName(snakeCase string) string {
	humanized := strings.ReplaceAll(snakeCase, "_", " ")
	if len(humanized) > 0 {
		return strings.ToUpper(humanized[:1]) + humanized[1:]
	}
	return humanized
}

func toSnakeCase(s string) string {
	var result strings.Builder
	for i, r := range s {
		if r >= 'A' && r <= 'Z' {
			if i > 0 {
				result.WriteByte('_')
			}
			result.WriteRune(r + 32)
		} else {
			result.WriteRune(r)
		}
	}
	return result.String()
}
