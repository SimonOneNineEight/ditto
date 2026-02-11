package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const SlowRequestThresholdMs = 500

func SlowRequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		duration := time.Since(start)
		durationMs := duration.Milliseconds()

		if durationMs > SlowRequestThresholdMs {
			userID := "anonymous"
			if id, exists := c.Get("user_id"); exists {
				if uid, ok := id.(uuid.UUID); ok {
					userID = uid.String()
				}
			}

			log.Printf("[WARN] slow_request user_id=%s method=%s path=%s status=%d duration_ms=%d",
				userID,
				c.Request.Method,
				c.Request.URL.Path,
				c.Writer.Status(),
				durationMs,
			)
		}
	}
}
