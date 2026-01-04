package middleware

import (
	"ditto-backend/internal/repository"
	"ditto-backend/pkg/database"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RateLimiter struct {
	repo *repository.RateLimitRepository
}

func NewRateLimiter(db *database.Database) *RateLimiter {
	return &RateLimiter{
		repo: repository.NewRateLimitRepository(db),
	}
}

func (rl *RateLimiter) Middleware(resource string, limit int) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": map[string]any{
					"error": "User not authenticated",
					"code":  "UNAUTHORIZED",
				},
			})
			c.Abort()
			return
		}

		userID, ok := userIDInterface.(uuid.UUID)
		if !ok {
			userIDStr, ok := userIDInterface.(string)
			if !ok {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error": map[string]any{
						"error": "Invalid user ID format",
						"code":  "INTERNAL_SERVER_ERROR",
					},
				})
				c.Abort()
				return
			}

			var err error
			userID, err = uuid.Parse(userIDStr)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error": map[string]any{
						"error": "Invalid user ID format",
						"code":  "INTERNAL_SERVER_ERROR",
					},
				})
				c.Abort()
				return
			}
		}

		allowed, remaining, err := rl.repo.CheckAndIncrement(userID, resource, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error": map[string]any{
					"error": "Rate limit check failed",
					"code":  "INTERNAL_SERVER_ERROR",
				},
			})
			c.Abort()
			return
		}

		c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))

		if !allowed {
			used, _, resetAt, _ := rl.repo.GetCurrentUsage(userID, resource, limit)
			retryAfter := int(time.Until(resetAt).Seconds())
			if retryAfter < 0 {
				retryAfter = 0
			}
			c.Header("X-RateLimit-Reset", resetAt.Format(time.RFC3339))
			c.Header("Retry-After", strconv.Itoa(retryAfter))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": map[string]any{
					"error": "Rate limit exceeded. You have used " + strconv.Itoa(used) + " of " + strconv.Itoa(limit) + " allowed requests. Try again in " + strconv.Itoa(retryAfter) + " seconds.",
					"code":  "RATE_LIMIT_EXCEEDED",
				},
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
