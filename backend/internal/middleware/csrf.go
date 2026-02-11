package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	csrfTokenHeader = "X-CSRF-Token"
	csrfTokenLength = 32
	csrfTokenExpiry = 24 * time.Hour
)

type csrfToken struct {
	token     string
	userID    uuid.UUID
	expiresAt time.Time
}

type csrfStore struct {
	tokens map[string]csrfToken
	mu     sync.RWMutex
}

var store = &csrfStore{
	tokens: make(map[string]csrfToken),
}

func generateCSRFToken() (string, error) {
	b := make([]byte, csrfTokenLength)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (s *csrfStore) set(token string, userID uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tokens[token] = csrfToken{
		token:     token,
		userID:    userID,
		expiresAt: time.Now().Add(csrfTokenExpiry),
	}
}

func (s *csrfStore) validate(token string, userID uuid.UUID) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	stored, exists := s.tokens[token]
	if !exists {
		return false
	}

	if time.Now().After(stored.expiresAt) {
		return false
	}

	return stored.userID == userID
}

func (s *csrfStore) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for token, data := range s.tokens {
		if now.After(data.expiresAt) {
			delete(s.tokens, token)
		}
	}
}

func init() {
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		for range ticker.C {
			store.cleanup()
		}
	}()
}

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method

		if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
			userIDVal, exists := c.Get("user_id")
			if exists {
				if userID, ok := userIDVal.(uuid.UUID); ok {
					token, err := generateCSRFToken()
					if err == nil {
						store.set(token, userID)
						c.Header(csrfTokenHeader, token)
					}
				}
			}
			c.Next()
			return
		}

		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.Next()
			return
		}

		userID, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.Next()
			return
		}

		token := c.GetHeader(csrfTokenHeader)
		if token == "" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Missing CSRF token",
				"code":  "CSRF_ERROR",
			})
			c.Abort()
			return
		}

		if !store.validate(token, userID) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Invalid CSRF token",
				"code":  "CSRF_ERROR",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
