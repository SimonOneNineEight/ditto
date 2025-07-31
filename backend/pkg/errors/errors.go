package errors

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	Status  int       `json:"-"`
	Cause   error     `json:"-"`
}

type ErrorCode string

const (
	ErrorInvalidCredentials ErrorCode = "INVALID_CREDENTIALS"
	ErrorEmailAlreadyExists ErrorCode = "EMAIL_ALREADY_EXISTS"
	ErrorUnauthorized       ErrorCode = "UNAUTHORIZED"
	ErrorRoleNotFound       ErrorCode = "ROLE_NOT_FOUND"

	ErrorValidationFailed ErrorCode = "VALIDATION_FAILED"
	ErrorBadRequest       ErrorCode = "BAD_REQUEST"

	ErrorNotFound     ErrorCode = "NOT_FOUND"
	ErrorUserNotFound ErrorCode = "USER_NOT_FOUND"
	ErrorJobNotFound  ErrorCode = "JOB_NOT_FOUND"

	ErrorConflict ErrorCode = "CONFLICT"

	ErrorInternalServer ErrorCode = "INTERNAL_SERVER_ERROR"
	ErrorDatabaseError  ErrorCode = "DATABASE_ERROR"
	ErrorUnexpected     ErrorCode = "UNEXPECTED_ERROR"
)

func (e *AppError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	}
	return e.Message
}

func (e *AppError) Is(target error) bool {
	if t, ok := target.(*AppError); ok {
		return e.Code == t.Code
	}
	return false
}

func (e *AppError) Unwrap() error {
	return e.Cause
}

func (code ErrorCode) HTTPStatus() int {
	switch code {
	case ErrorInvalidCredentials, ErrorUnauthorized:
		return http.StatusUnauthorized
	case ErrorEmailAlreadyExists, ErrorConflict:
		return http.StatusConflict
	case ErrorNotFound, ErrorUserNotFound, ErrorJobNotFound, ErrorRoleNotFound:
		return http.StatusNotFound
	case ErrorValidationFailed, ErrorBadRequest:
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}

func (code ErrorCode) Category() string {
	switch code {
	case ErrorInvalidCredentials, ErrorUnauthorized, ErrorEmailAlreadyExists, ErrorRoleNotFound:
		return "auth"
	case ErrorValidationFailed, ErrorBadRequest:
		return "validation"
	case ErrorNotFound, ErrorUserNotFound, ErrorJobNotFound:
		return "not_found"
	default:
		return "internal"
	}
}

func New(code ErrorCode, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  code.HTTPStatus(),
	}
}

func NewWithCause(code ErrorCode, message string, cause error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  code.HTTPStatus(),
		Cause:   cause,
	}
}

func NewInvalidCredentials() *AppError {
	return New(ErrorInvalidCredentials, "Invalid credentials")
}

func NewUnauthorized() *AppError {
	return New(ErrorUnauthorized, "Unauthorized")
}

func NewDatabaseError(message string, cause error) *AppError {
	return NewWithCause(ErrorDatabaseError, message, cause)
}

func NewUserNotFound(id string) *AppError {
	return New(ErrorUserNotFound, fmt.Sprintf("User id %s not found!", id))
}

func NewValidationError(message string) *AppError {
	return New(ErrorValidationFailed, message)
}

func IsNotFoundError(err error) bool {
	if err == nil {
		return false
	}

	appErr := ConvertError(err)
	return appErr.Code == ErrorNotFound || appErr.Code == ErrorUserNotFound
}
