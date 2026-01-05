package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// HTTPFetcher is an interface for fetching URLs with custom headers
type HTTPFetcher interface {
	FetchURL(ctx context.Context, url string, headers map[string]string) ([]byte, error)
}

// httpFetcher is the real HTTP implementation
type httpFetcher struct {
	logger *log.Logger
}

func newHTTPFetcher(logger *log.Logger) HTTPFetcher {
	return &httpFetcher{logger: logger}
}

func (f *httpFetcher) FetchURL(ctx context.Context, url string, headers map[string]string) ([]byte, error) {
	return fetchURL(ctx, url, headers, f.logger)
}

// Parser extracts job data from a URL.
// Each platform handles its own fetching and parsing logic.
type Parser interface {
	FetchAndParse(ctx context.Context, url string) (*ExtractedJobData, []string, error)
}

// newAllParsers creates all platform-specific parsers.
func newAllParsers(logger *log.Logger) map[string]Parser {
	fetcher := newHTTPFetcher(logger)
	parsers := map[string]Parser{
		PlatformLinkedIn: newLinkedInParser(logger, fetcher),
		PlatformIndeed:   newIndeedParser(logger, fetcher),
		PlatformGeneric:  newGenericParser(logger, fetcher),
		// Glassdoor removed due to aggressive anti-scraping (403 blocking)
		// PlatformGlassdoor: newGlassdoorParser(logger, fetcher),
		// Wellfound removed due to Cloudflare protection (403 blocking)
		// PlatformAngelList: newAngelListParser(logger, fetcher),
	}

	return parsers
}

func fetchURL(ctx context.Context, url string, headers map[string]string, logger *log.Logger) ([]byte, error) {
	maxRetries := 2
	baseDelay := 500 * time.Millisecond

	var lastErr error
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			delay := baseDelay * time.Duration(1<<uint(attempt-1))
			logger.Printf("Retry attempt %d/%d after %v", attempt+1, maxRetries+1, delay)
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return nil, errors.Wrap(errors.ErrorNetworkFailure, "Request cancelled", ctx.Err())
			}
		}
		body, err := fetchURLOnce(ctx, url, headers, logger)
		if err == nil {
			if attempt > 0 {
				logger.Printf("Request succeeded on attempt %d/%d", attempt+1, maxRetries+1)
			}

			return body, nil
		}

		lastErr = err

		if !shouldRetry(err) {
			logger.Printf("Request failed with non-retryable error: %v", err)
			return nil, err
		}

		logger.Printf("Request failed (attempt %d/%d): %v", attempt+1, maxRetries+1, err)
	}

	return nil, errors.Wrap(errors.ErrorNetworkFailure, "Max retries exceeded", lastErr)
}

func fetchURLOnce(ctx context.Context, url string, headers map[string]string, logger *log.Logger) ([]byte, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, errors.Wrap(errors.ErrorInternalServer, "Failed to create request", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	res, err := client.Do(req)
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded || errors.IsTimeoutError(err) {
			return nil, errors.NewTimeoutError("Request timed out after 10 seconds")
		}
		return nil, errors.Wrap(errors.ErrorNetworkFailure, "Failed to fetch URL", err,
			"The job site may be temporarily unavailable")
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		logger.Printf("HTTP request returned status %d", res.StatusCode)
		if res.StatusCode == 404 {
			return nil, errors.New(errors.ErrorNotFound, "Job posting not found")
		}

		if res.StatusCode >= 500 {
			return nil, errors.New(errors.ErrorNetworkFailure, fmt.Sprintf("HTTP %d: Server error", res.StatusCode))
		}

		return nil, errors.New(errors.ErrorNetworkFailure, fmt.Sprintf("HTTP %d: Failed to fetch job posting", res.StatusCode))
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, errors.Wrap(errors.ErrorNetworkFailure, "Failed to read response body", err)
	}

	logger.Printf("Successfully fetched %d bytes", len(body))

	return body, nil
}

func shouldRetry(err error) bool {
	appErr, ok := err.(*errors.AppError)
	if !ok {
		return true
	}
	switch appErr.Code {
	case errors.ErrorNotFound, errors.ErrorValidationFailed:
		return false
	case errors.ErrorNetworkFailure, errors.ErrorTimeout:
		return true
	default:
		return false
	}
}
