package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	AccessTokenTTL  = 24 * time.Hour
	RefreshTokenTTL = 7 * 24 * time.Hour
)

type Claims struct {
	UserID uuid.UUID
	Email  string
	jwt.RegisteredClaims
}

func GenerateToken(userID uuid.UUID, email string) (string, error) {
	return generateTokenWithTTL(userID, email, AccessTokenTTL)
}

func GenerateRefreshToken(userID uuid.UUID, email string) (string, error) {
	return generateTokenWithTTL(userID, email, RefreshTokenTTL)
}

func generateTokenWithTTL(userID uuid.UUID, email string, ttl time.Duration) (string, error) {
	secret := os.Getenv("JWT_SECRET")

	if secret == "" {
		return "", errors.New("JWT_SECRET not set")
	}

	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString string) (*Claims, error) {
	secret := os.Getenv("JWT_SECRET")

	if secret == "" {
		return nil, errors.New("JWT_SECRET not set")
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
