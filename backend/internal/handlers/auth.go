package handlers

import (
	"ditto-backend/internal/auth"
	"ditto-backend/internal/models"
	"ditto-backend/internal/repository"
	"ditto-backend/internal/utils"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type AuthHandler struct {
	userRepo  *repository.UserRepository
	validator *validator.Validate
}

func NewAuthHandler(appState *utils.AppState) *AuthHandler {
	return &AuthHandler{
		userRepo:  repository.NewUserRepository(appState.DB),
		validator: validator.New(),
	}
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name" validate:"required,min=1,max=50"`
	Password string `json:"password" validate:"required,min=1"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=1"`
}

type AuthResponse struct {
	User         *models.User `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	existingUser, err := h.userRepo.GetUserByEmail(req.Email)

	if err != nil && !IsNotFoundError(err) {
		HandleError(c, err)
		return
	}

	if existingUser != nil {
		HandleError(c, errors.New(errors.ErrorConflict, "user already exists"))
		return
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		HandleErrorWithMessage(c, err, "failed to hash password")
		return
	}

	user, err := h.userRepo.CreateUser(req.Email, req.Name, hashedPassword)
	if err != nil {
		HandleError(c, err)
		return
	}

	accessToken, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		HandleErrorWithMessage(c, err, "failed to generate access token")
		return
	}

	refreshToken, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		HandleErrorWithMessage(c, err, "failed to generate refresh token")
		return
	}

	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	if err := h.userRepo.UpdateRefreshToken(user.ID, refreshToken, expiresAt); err != nil {
		HandleError(c, err)
		return
	}

	authResponse := &AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}

	response.Success(c, authResponse)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	user, err := h.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		if IsNotFoundError(err) {
			HandleError(c, errors.New(errors.ErrorInvalidCredentials, "invalid credentials"))
			return
		}
		HandleError(c, err)
		return
	}

	userAuth, err := h.userRepo.GetUserAuth(user.ID)
	if err != nil {
		if IsNotFoundError(err) {
			HandleError(c, errors.New(errors.ErrorInvalidCredentials, "invalid credentials"))
			return
		}
		HandleError(c, err)
		return
	}

	if userAuth.PasswordHash == nil {
		HandleError(c, errors.New(errors.ErrorInvalidCredentials, "invalid credentials"))
		return
	}

	if err := auth.CheckPassword(*userAuth.PasswordHash, req.Password); err != nil {
		HandleError(c, errors.New(errors.ErrorInvalidCredentials, "invalid credentials"))
		return
	}

	accessToken, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		HandleErrorWithMessage(c, err, "failed to generate access token")
		return
	}

	refreshToken, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		HandleErrorWithMessage(c, err, "failed to generate refresh token")
		return
	}

	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	if err := h.userRepo.UpdateRefreshToken(user.ID, refreshToken, expiresAt); err != nil {
		HandleError(c, err)
		return
	}

	authResponse := &AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}

	response.Success(c, authResponse)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userID, exists := c.Get("user_id")

	if !exists {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "user not authenticated"))
		return
	}

	if err := h.userRepo.ClearRefreshToken(userID.(uuid.UUID)); err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "logged out successfully"})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, err)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		HandleError(c, err)
		return
	}

	claims, err := auth.ValidateToken(req.RefreshToken)
	if err != nil {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "invalid refresh token"))
		return
	}

	valid, err := h.userRepo.ValidateRefreshToken(claims.UserID, req.RefreshToken)
	if err != nil {
		HandleError(c, err)
		return
	}

	if !valid {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "invalid refresh token"))
		return
	}

	accessToken, err := auth.GenerateToken(claims.UserID, claims.Email)
	if err != nil {
		HandleErrorWithMessage(c, err, "failed to generate access token")
		return
	}

	response.Success(c, gin.H{
		"access_token": accessToken,
	})
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		HandleError(c, errors.New(errors.ErrorUnauthorized, "user not authenticated"))
		return
	}

	user, err := h.userRepo.GetUserByID(userID.(uuid.UUID))
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, user)
}
