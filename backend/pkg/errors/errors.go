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
	Details []string  `json:"-"`
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

	ErrorTimeout             ErrorCode = "TIMEOUT_ERROR"
	ErrorParsingFailed       ErrorCode = "PARSING_FAILED"
	ErrorNetworkFailure      ErrorCode = "NETWORK_FAILURE"
	ErrorUnsupportedPlatform ErrorCode = "UNSUPPORTED_PLATFORM"
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
	case ErrorValidationFailed, ErrorBadRequest, ErrorUnsupportedPlatform:
		return http.StatusBadRequest
	case ErrorTimeout:
		return http.StatusRequestTimeout
	case ErrorParsingFailed:
		return http.StatusUnprocessableEntity
	case ErrorNetworkFailure:
		return http.StatusBadGateway

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

func New(code ErrorCode, message string, details ...string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  code.HTTPStatus(),
		Details: details,
	}
}

func Wrap(code ErrorCode, message string, cause error, details ...string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  code.HTTPStatus(),
		Cause:   cause,
		Details: details,
	}
}

func NewInvalidCredentials() *AppError {
	return New(ErrorInvalidCredentials, "Invalid credentials")
}

func NewUnauthorized() *AppError {
	return New(ErrorUnauthorized, "Unauthorized")
}

func NewDatabaseError(message string, cause error) *AppError {
	return Wrap(ErrorDatabaseError, message, cause)
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

func IsTimeoutError(err error) bool {
	if err == nil {
		return false
	}

	type timeoutError interface {
		Timeout() bool
	}

	if e, ok := err.(timeoutError); ok {
		return e.Timeout()
	}

	return false
}

func NewTimeoutError(message string) *AppError {
	return New(ErrorTimeout, message)
}

func NewNetworkError(message string, cause error) *AppError {
	return Wrap(ErrorNetworkFailure, message, cause)
}

func NewParsingError(message string) *AppError {
	return New(ErrorParsingFailed, message)
}

func NewUnsupportedPlatform(platform string) *AppError {
	return New(ErrorUnsupportedPlatform,
		fmt.Sprintf("Platform '%s' is not supported. Supported platforms: LinkedIn, Indeed, Glassdoor, AngelList", platform))
}
