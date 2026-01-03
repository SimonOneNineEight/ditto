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

// Parser extracts job data from a URL.
// Each platform handles its own fetching and parsing logic.
type Parser interface {
	FetchAndParse(ctx context.Context, url string) (*ExtractedJobData, []string, error)
}

// newAllParsers creates all platform-specific parsers.
func newAllParsers(logger *log.Logger) map[string]Parser {
	parsers := map[string]Parser{
		PlatformLinkedIn:  newLinkedInParser(logger),
		PlatformIndeed:    newIndeedParser(logger),
		// Glassdoor removed due to aggressive anti-scraping (403 blocking)
		// PlatformGlassdoor: newGlassdoorParser(logger),
		PlatformAngelList: newAngelListParser(logger),
	}

	return parsers
}

func fetchURL(ctx context.Context, url string, headers map[string]string, logger *log.Logger) ([]byte, error) {
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

		return nil, errors.New(errors.ErrorNetworkFailure, fmt.Sprintf("HTTP %d: Failed to fetch job posting", res.StatusCode))
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, errors.Wrap(errors.ErrorNetworkFailure, "Failed to read response body", err)
	}

	logger.Printf("Successfully fetched %d bytes", len(body))

	return body, nil
}
