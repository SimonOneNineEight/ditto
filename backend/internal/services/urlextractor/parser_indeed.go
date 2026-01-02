package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"log"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type indeedParser struct {
	logger *log.Logger
}

func newIndeedParser(logger *log.Logger) Parser {
	return &indeedParser{logger: logger}
}

type indeedJobSchema struct {
	Type        string `json:"@type"`
	Title       string `json:"title"`
	Description string `json:"description"`
	HiringOrg   struct {
		Name string `json:"name"`
	} `json:"hiringOrganization"`
	JobLocation struct {
		Address struct {
			AddressLocality string `json:"addressLocality"`
			AddressRegion   string `json:"addressRegion"`
		} `json:"address"`
	} `json:"jobLocation"`
}

func (p *indeedParser) FetchAndParse(ctx context.Context, url string) (*ExtractedJobData, []string, error) {
	p.logger.Printf("Fetching Indeed job: %s", url)

	header := map[string]string{
		"Referer": "https://www.indeed.com/",
	}

	body, err := fetchURL(ctx, url, header, p.logger)
	if err != nil {
		return nil, nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, nil, errors.Wrap(errors.ErrorParsingFailed, "Failed to parse Indeed HTML response",
			err)
	}

	// Try JSON-LD first (most reliable)
	data, warnings, err := p.extractFromJSONLD(doc)
	if err == nil && data != nil {
		p.logger.Printf("Successfully extracted Indeed job data from JSON-LD")
		return data, warnings, nil
	}

	p.logger.Printf("JSON-LD extraction failed, falling back to HTML parsing: %v", err)

	// Fall back to HTML parsing
	return p.extractFromHTML(doc)
}

func (p *indeedParser) extractFromJSONLD(doc *goquery.Document) (*ExtractedJobData, []string, error) {
}
