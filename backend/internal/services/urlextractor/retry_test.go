package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFetchURL_SuccessFirstAttempt(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("test response"))
	}))
	defer server.Close()

	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	ctx := context.Background()

	body, err := fetchURL(ctx, server.URL, nil, logger)

	assert.NoError(t, err)
	assert.Equal(t, "test response", string(body))
}

func TestFetchURL_SuccessAfterRetry(t *testing.T) {
	attemptCount := atomic.Int32{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count := attemptCount.Add(1)
		if count == 1 {
			// First attempt fails with 503
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		// Second attempt succeeds
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("success after retry"))
	}))
	defer server.Close()

	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	ctx := context.Background()

	start := time.Now()
	body, err := fetchURL(ctx, server.URL, nil, logger)
	duration := time.Since(start)

	assert.NoError(t, err)
	assert.Equal(t, "success after retry", string(body))
	assert.Equal(t, int32(2), attemptCount.Load())
	// Should have waited ~500ms for retry
	assert.GreaterOrEqual(t, duration, 400*time.Millisecond)
}

func TestFetchURL_NoRetryOn404(t *testing.T) {
	attemptCount := atomic.Int32{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attemptCount.Add(1)
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	ctx := context.Background()

	body, err := fetchURL(ctx, server.URL, nil, logger)

	assert.Error(t, err)
	assert.Nil(t, body)
	assert.Equal(t, int32(1), attemptCount.Load()) // Should only attempt once
	assert.Contains(t, err.Error(), "Job posting not found")
}

func TestFetchURL_MaxRetriesExceeded(t *testing.T) {
	attemptCount := atomic.Int32{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attemptCount.Add(1)
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	ctx := context.Background()

	start := time.Now()
	body, err := fetchURL(ctx, server.URL, nil, logger)
	duration := time.Since(start)

	assert.Error(t, err)
	assert.Nil(t, body)
	assert.Equal(t, int32(3), attemptCount.Load()) // 1 initial + 2 retries
	assert.Contains(t, err.Error(), "Max retries exceeded")
	// Should have waited 500ms + 1s = 1.5s total
	assert.GreaterOrEqual(t, duration, 1400*time.Millisecond)
}

func TestFetchURL_ContextCancellation(t *testing.T) {
	attemptCount := atomic.Int32{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count := attemptCount.Add(1)
		if count == 1 {
			// First attempt fails
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		// Should not reach here due to cancellation
		t.Fatal("Should not attempt second request after cancellation")
	}))
	defer server.Close()

	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	ctx, cancel := context.WithCancel(context.Background())

	// Cancel context after first attempt
	go func() {
		time.Sleep(200 * time.Millisecond)
		cancel()
	}()

	body, err := fetchURL(ctx, server.URL, nil, logger)

	assert.Error(t, err)
	assert.Nil(t, body)
	assert.Equal(t, int32(1), attemptCount.Load()) // Only first attempt
	assert.Contains(t, err.Error(), "Request cancelled")
}

func TestShouldRetry(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected bool
	}{
		{
			name:     "Network failure should retry",
			err:      errors.New(errors.ErrorNetworkFailure, "Connection failed"),
			expected: true,
		},
		{
			name:     "Timeout should retry",
			err:      errors.NewTimeoutError("Request timed out"),
			expected: true,
		},
		{
			name:     "Not found should not retry",
			err:      errors.New(errors.ErrorNotFound, "Job not found"),
			expected: false,
		},
		{
			name:     "Validation error should not retry",
			err:      errors.New(errors.ErrorValidationFailed, "Invalid URL"),
			expected: false,
		},
		{
			name:     "Unknown error should retry",
			err:      assert.AnError,
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := shouldRetry(tt.err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestFetchURL_ExponentialBackoff(t *testing.T) {
	attemptCount := atomic.Int32{}
	attemptTimes := make([]time.Time, 0, 3)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attemptCount.Add(1)
		attemptTimes = append(attemptTimes, time.Now())
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	ctx := context.Background()

	_, err := fetchURL(ctx, server.URL, nil, logger)

	require.Error(t, err)
	require.Equal(t, int32(3), attemptCount.Load())
	require.Len(t, attemptTimes, 3)

	// Check backoff timing
	// First retry should be ~500ms after first attempt
	delay1 := attemptTimes[1].Sub(attemptTimes[0])
	assert.GreaterOrEqual(t, delay1, 400*time.Millisecond)
	assert.LessOrEqual(t, delay1, 700*time.Millisecond)

	// Second retry should be ~1s after second attempt
	delay2 := attemptTimes[2].Sub(attemptTimes[1])
	assert.GreaterOrEqual(t, delay2, 900*time.Millisecond)
	assert.LessOrEqual(t, delay2, 1200*time.Millisecond)
}
