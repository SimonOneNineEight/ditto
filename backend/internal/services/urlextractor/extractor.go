package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	PlatformLinkedIn  = "linkedin"
	PlatformIndeed    = "indeed"
	PlatformGlassdoor = "glassdoor"
	PlatformAngelList = "angellist"
)

type Extractor interface {
	Extract(ctx context.Context, urlStr string) (*ExtractedJobData, []string, error)
}

type extractor struct {
	httpClient *http.Client
	parsers    map[string]Parser
	logger     *log.Logger
}

func New(logger *log.Logger) Extractor {
	httpClient := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:       10,
			IdleConnTimeout:    30 * time.Second,
			DisableCompression: false,
		},
	}

	return &extractor{
		httpClient: httpClient,
		parsers:    newAllParsers(logger),
		logger:     logger,
	}
}

func validateURL(urlStr string) error {
	if urlStr == "" {
		return errors.New(errors.ErrorValidationFailed, "URL is required")
	}

	parsed, err := url.Parse(urlStr)
	if err != nil {
		return errors.New(errors.ErrorValidationFailed, "Invalid URL format", err.Error())
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return errors.New(errors.ErrorValidationFailed, "URL must use http or https protocol")
	}

	if parsed.Host == "" {
		return errors.New(errors.ErrorValidationFailed, "URL must have a valid host")
	}

	return nil
}

func detectPlatform(urlStr string) (string, error) {
	parsed, _ := url.Parse(urlStr)
	host := strings.ToLower(parsed.Host)

	host = strings.TrimPrefix(host, "www.")

	switch {
	case strings.Contains(host, "linkedin.com"):
		return PlatformLinkedIn, nil
	case strings.Contains(host, "indeed.com"):
		return PlatformIndeed, nil
	case strings.Contains(host, "angel.co") || strings.Contains(host, "wellfound.com"):
		return PlatformAngelList, nil
	// Glassdoor removed due to aggressive anti-scraping (403 blocking)
	// case strings.Contains(host, "glassdoor.com"):
	//	return PlatformGlassdoor, nil
	default:
		return "", errors.NewUnsupportedPlatform(host)
	}
}

func (e *extractor) Extract(ctx context.Context, urlStr string) (*ExtractedJobData, []string, error) {
	if err := validateURL(urlStr); err != nil {
		e.logger.Printf("URL validation failed: %v", err)
		return nil, nil, err
	}

	platform, err := detectPlatform(urlStr)
	if err != nil {
		e.logger.Printf("Platform detection failed for URL %s: %v", urlStr, err)
		return nil, nil, err
	}

	var data *ExtractedJobData
	var warnings []string

	if apiParser, exists := e.parsers[platform]; exists {
		e.logger.Printf("Using API parser for %s", platform)
		data, warnings, err = apiParser.FetchAndParse(ctx, urlStr)
	} else {
		return nil, nil, errors.New(errors.ErrorInternalServer, "No parser available for platform")
	}

	if err != nil {
		e.logger.Printf("Parsing failed: %v", err)
		return nil, nil, err
	}

	data.Platform = platform

	if len(warnings) > 0 {
		e.logger.Printf("Extraction completed with warnings: %v", warnings)
	} else {
		e.logger.Printf("Extraction completed successfully")
	}

	return data, warnings, nil
}
