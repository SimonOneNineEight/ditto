package middleware

import (
	"ditto-backend/internal/auth"
	"ditto-backend/internal/handlers"
	"ditto-backend/pkg/errors"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			handlers.HandleError(c, errors.New(errors.ErrorUnauthorized, "authorization header required"))
			c.Abort()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			handlers.HandleError(c, errors.New(errors.ErrorUnauthorized, "invalid authorization header format"))
			c.Abort()
			return
		}

		tokenString := tokenParts[1]
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			handlers.HandleError(c, errors.New(errors.ErrorUnauthorized, "invalid token"))
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Next()
	}
}
