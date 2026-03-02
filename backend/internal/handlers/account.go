package handlers

import (
	"ditto-backend/internal/auth"
	"ditto-backend/internal/constants"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type AccountHandler struct {
	userRepo  *repository.UserRepository
	validator *validator.Validate
}

func NewAccountHandler(appState *utils.AppState) *AccountHandler {
	return &AccountHandler{
		userRepo:  repository.NewUserRepository(appState.DB),
		validator: validator.New(),
	}
}

type ProviderResponse struct {
	AuthProvider  string  `json:"auth_provider"`
	ProviderEmail *string `json:"provider_email,omitempty"`
	AvatarURL     *string `json:"avatar_url,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

type LinkProviderRequest struct {
	Provider  string  `json:"provider" validate:"required"`
	Email     string  `json:"email" validate:"required,email"`
	Name      string  `json:"name" validate:"required,min=1,max=100"`
	AvatarURL *string `json:"avatar_url,omitempty"`
}

type SetPasswordRequest struct {
	Password string `json:"password" validate:"required,min=8"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required,min=1"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

func (h *AccountHandler) GetLinkedProviders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "user not authenticated"))
		return
	}

	providers, err := h.userRepo.GetUserAuthProviders(userID.(uuid.UUID))
	if err != nil {
		HandleError(c, err)
		return
	}

	result := make([]ProviderResponse, len(providers))
	for i, p := range providers {
		result[i] = ProviderResponse{
			AuthProvider:  p.AuthProvider,
			ProviderEmail: p.ProviderEmail,
			AvatarURL:     p.AvatarURL,
			CreatedAt:     p.CreatedAt.Format(time.RFC3339),
		}
	}

	response.Success(c, result)
}

func (h *AccountHandler) LinkProvider(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "user not authenticated"))
		return
	}

	var req LinkProviderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	if !constants.IsValidOAuthProvider(req.Provider) || req.Provider == constants.AuthProviderLocal {
		HandleError(c, errors.New(errors.ErrorBadRequest, "unsupported OAuth provider"))
		return
	}

	existingAuth, err := h.userRepo.GetAuthByProviderEmail(req.Provider, req.Email)
	if err != nil && !errors.IsNotFoundError(err) {
		HandleError(c, err)
		return
	}
	if existingAuth != nil && existingAuth.UserID != userID.(uuid.UUID) {
		HandleError(c, errors.New(errors.ErrorConflict, "This "+req.Provider+" account is already linked to another account."))
		return
	}

	alreadyLinked, err := h.userRepo.GetUserAuthByProvider(userID.(uuid.UUID), req.Provider)
	if err != nil && !errors.IsNotFoundError(err) {
		HandleError(c, err)
		return
	}
	if alreadyLinked != nil {
		HandleError(c, errors.New(errors.ErrorConflict, "Provider already linked."))
		return
	}

	avatarURL := ""
	if req.AvatarURL != nil {
		avatarURL = *req.AvatarURL
	}

	if err := h.userRepo.LinkProvider(userID.(uuid.UUID), req.Provider, req.Email, avatarURL); err != nil {
		HandleError(c, err)
		return
	}

	providers, err := h.userRepo.GetUserAuthProviders(userID.(uuid.UUID))
	if err != nil {
		HandleError(c, err)
		return
	}

	result := make([]ProviderResponse, len(providers))
	for i, p := range providers {
		result[i] = ProviderResponse{
			AuthProvider:  p.AuthProvider,
			ProviderEmail: p.ProviderEmail,
			AvatarURL:     p.AvatarURL,
			CreatedAt:     p.CreatedAt.Format(time.RFC3339),
		}
	}

	response.Success(c, result)
}

func (h *AccountHandler) UnlinkProvider(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "user not authenticated"))
		return
	}

	provider := c.Param("provider")
	if provider == "" {
		HandleError(c, errors.New(errors.ErrorBadRequest, "provider is required"))
		return
	}

	count, err := h.userRepo.CountAuthMethods(userID.(uuid.UUID))
	if err != nil {
		HandleError(c, err)
		return
	}
	if count <= 1 {
		HandleError(c, errors.New(errors.ErrorBadRequest, "Cannot remove your only login method."))
		return
	}

	if err := h.userRepo.UnlinkProvider(userID.(uuid.UUID), provider); err != nil {
		HandleError(c, err)
		return
	}

	providers, err := h.userRepo.GetUserAuthProviders(userID.(uuid.UUID))
	if err != nil {
		HandleError(c, err)
		return
	}

	result := make([]ProviderResponse, len(providers))
	for i, p := range providers {
		result[i] = ProviderResponse{
			AuthProvider:  p.AuthProvider,
			ProviderEmail: p.ProviderEmail,
			AvatarURL:     p.AvatarURL,
			CreatedAt:     p.CreatedAt.Format(time.RFC3339),
		}
	}

	response.Success(c, result)
}

func (h *AccountHandler) SetPassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "user not authenticated"))
		return
	}

	var req SetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}
	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	hasPass, err := h.userRepo.HasPassword(userID.(uuid.UUID))
	if err != nil {
		HandleError(c, err)
		return
	}
	if hasPass {
		HandleError(c, errors.New(errors.ErrorBadRequest, "Password already set. Use change-password instead."))
		return
	}

	hashed, err := auth.HashPassword(req.Password)
	if err != nil {
		HandleErrorWithMessage(c, err, "failed to hash password")
		return
	}

	if err := h.userRepo.SetPassword(userID.(uuid.UUID), hashed); err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "password set successfully"})
}

func (h *AccountHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "user not authenticated"))
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}
	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	currentHash, err := h.userRepo.GetPasswordHash(userID.(uuid.UUID))
	if err != nil {
		if errors.IsNotFoundError(err) {
			HandleError(c, errors.New(errors.ErrorBadRequest, "no password set"))
			return
		}
		HandleError(c, err)
		return
	}

	if err := auth.CheckPassword(currentHash, req.CurrentPassword); err != nil {
		HandleError(c, errors.New(errors.ErrorInvalidCredentials, "current password is incorrect"))
		return
	}

	hashed, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		HandleErrorWithMessage(c, err, "failed to hash password")
		return
	}

	if err := h.userRepo.UpdatePassword(userID.(uuid.UUID), hashed); err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "password changed successfully"})
}
