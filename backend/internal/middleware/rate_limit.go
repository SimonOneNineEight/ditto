package middleware

import (
	"ditto-backend/internal/repository"
	"ditto-backend/pkg/database"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// IP-based rate limiting for unauthenticated endpoints (login, register, etc.)

type ipRateLimitEntry struct {
	count     int
	windowEnd time.Time
}

type ipRateLimiter struct {
	entries map[string]*ipRateLimitEntry
	mu      sync.RWMutex
	limit   int
	window  time.Duration
}

var authIPRateLimiter = &ipRateLimiter{
	entries: make(map[string]*ipRateLimitEntry),
	limit:   10,
	window:  1 * time.Minute,
}

func init() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			authIPRateLimiter.cleanup()
		}
	}()
}

func (rl *ipRateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	for key, entry := range rl.entries {
		if now.After(entry.windowEnd) {
			delete(rl.entries, key)
		}
	}
}

func (rl *ipRateLimiter) isAllowed(key string) (bool, int, time.Time) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	entry, exists := rl.entries[key]

	if !exists || now.After(entry.windowEnd) {
		rl.entries[key] = &ipRateLimitEntry{
			count:     1,
			windowEnd: now.Add(rl.window),
		}
		return true, rl.limit - 1, now.Add(rl.window)
	}

	if entry.count >= rl.limit {
		return false, 0, entry.windowEnd
	}

	entry.count++
	return true, rl.limit - entry.count, entry.windowEnd
}

// RateLimitAuthIP applies IP-based rate limiting to unauthenticated auth endpoints.
func RateLimitAuthIP() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		allowed, remaining, resetTime := authIPRateLimiter.isAllowed(clientIP)

		c.Header("X-RateLimit-Limit", "10")
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))

		if !allowed {
			retryAfter := int(time.Until(resetTime).Seconds())
			if retryAfter < 0 {
				retryAfter = 0
			}
			c.Header("Retry-After", strconv.Itoa(retryAfter))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please try again later.",
				"code":  "RATE_LIMIT",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// User-based rate limiting for authenticated endpoints

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
