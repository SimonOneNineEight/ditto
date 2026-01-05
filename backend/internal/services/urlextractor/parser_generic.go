package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"encoding/json"
	"log"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// genericParser is a fallback parser that attempts to extract job data
// from any job posting URL using common HTML patterns and JSON-LD schema.
type genericParser struct {
	logger  *log.Logger
	fetcher HTTPFetcher
}

func newGenericParser(logger *log.Logger, fetcher HTTPFetcher) Parser {
	return &genericParser{
		logger:  logger,
		fetcher: fetcher,
	}
}

type jobPostingSchema struct {
	Context     string `json:"@context"`
	Type        string `json:"@type"`
	Title       string `json:"title"`
	Description string `json:"description"`
	HiringOrg   struct {
		Type string `json:"@type"`
		Name string `json:"name"`
	} `json:"hiringOrganization"`
	JobLocation interface{} `json:"jobLocation"` // Can be object or array
}

func (p *genericParser) FetchAndParse(ctx context.Context, url string) (*ExtractedJobData, []string, error) {
	p.logger.Printf("Using generic parser for: %s", url)

	body, err := p.fetcher.FetchURL(ctx, url, nil)
	if err != nil {
		return nil, nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, nil, errors.Wrap(errors.ErrorParsingFailed, "Failed to parse HTML response", err)
	}

	// Try JSON-LD schema first (most reliable)
	data, warnings, err := p.extractFromJSONLD(doc)
	if err == nil && data != nil {
		p.logger.Printf("Successfully extracted job data from JSON-LD schema")
		return data, warnings, nil
	}

	p.logger.Printf("JSON-LD extraction failed, falling back to HTML heuristics: %v", err)

	// Fall back to HTML heuristics
	return p.extractFromHTML(doc)
}

func (p *genericParser) extractFromJSONLD(doc *goquery.Document) (*ExtractedJobData, []string, error) {
	var jobData *ExtractedJobData
	var warnings []string

	doc.Find("script[type='application/ld+json']").Each(func(i int, s *goquery.Selection) {
		if jobData != nil {
			return // Already found valid data
		}

		jsonText := s.Text()
		var schema jobPostingSchema

		if err := json.Unmarshal([]byte(jsonText), &schema); err != nil {
			return // Try next script tag
		}

		if schema.Type != "JobPosting" {
			return // Not a job posting schema
		}

		// Extract location from jobLocation field
		location := extractLocation(schema.JobLocation)

		jobData = &ExtractedJobData{
			Title:       cleanText(schema.Title),
			Company:     cleanText(schema.HiringOrg.Name),
			Location:    cleanText(location),
			Description: extractDescription(sanitizeHTML(schema.Description)),
			Platform:    "generic",
		}
	})

	if jobData == nil {
		return nil, nil, errors.New(errors.ErrorParsingFailed, "No JobPosting schema found")
	}

	// Collect warnings for missing fields
	if jobData.Title == "" {
		warnings = append(warnings, "Could not extract job title")
	}
	if jobData.Company == "" {
		warnings = append(warnings, "Could not extract company name")
	}
	if jobData.Location == "" {
		warnings = append(warnings, "Could not extract location")
	}
	if jobData.Description == "" {
		warnings = append(warnings, "Could not extract job description")
	}

	// Must have at least title or company
	if jobData.Title == "" && jobData.Company == "" {
		return nil, nil, errors.New(errors.ErrorParsingFailed, "Failed to extract minimal job data from JSON-LD")
	}

	return jobData, warnings, nil
}

func (p *genericParser) extractFromHTML(doc *goquery.Document) (*ExtractedJobData, []string, error) {
	p.logger.Println("Extracting job data using HTML heuristics")

	var warnings []string

	// Try common HTML patterns for title
	title := p.findBySelectors(doc, []string{
		"h1[class*='title']", "h1[class*='job']", "h1[id*='title']", "h1[id*='job']",
		"h2[class*='title']", "h2[class*='job']",
		"meta[property='og:title']", "title",
	})

	// Try common HTML patterns for company
	company := p.findBySelectors(doc, []string{
		"[class*='company']", "[id*='company']", "[data-*='company']",
		"a[class*='employer']", "span[class*='employer']",
		"meta[property='og:site_name']",
	})

	// Try common HTML patterns for location
	location := p.findBySelectors(doc, []string{
		"[class*='location']", "[id*='location']", "[data-*='location']",
		"[class*='city']", "[class*='address']",
	})

	// Try common HTML patterns for description
	descriptionHTML := p.findHTMLBySelectors(doc, []string{
		"[class*='description']", "[id*='description']",
		"[class*='job-details']", "[class*='job-content']",
		"article", "main",
	})

	data := &ExtractedJobData{
		Title:       cleanText(title),
		Company:     cleanText(company),
		Location:    cleanText(location),
		Description: extractDescription(sanitizeHTML(descriptionHTML)),
		Platform:    "generic",
	}

	// Collect warnings
	if data.Title == "" {
		warnings = append(warnings, "Could not extract job title")
	}
	if data.Company == "" {
		warnings = append(warnings, "Could not extract company name")
	}
	if data.Location == "" {
		warnings = append(warnings, "Could not extract location")
	}
	if data.Description == "" {
		warnings = append(warnings, "Could not extract job description")
	}

	// Must have at least title or company
	if data.Title == "" && data.Company == "" {
		return nil, nil, errors.New(errors.ErrorParsingFailed,
			"Failed to extract job data using HTML heuristics",
			"The page structure may not be compatible with generic parsing")
	}

	p.logger.Printf("Successfully extracted job data from HTML with %d warnings", len(warnings))

	return data, warnings, nil
}

// findBySelectors tries multiple CSS selectors and returns the first non-empty text
func (p *genericParser) findBySelectors(doc *goquery.Document, selectors []string) string {
	for _, selector := range selectors {
		text := ""

		// Handle meta tags differently
		if strings.HasPrefix(selector, "meta[") {
			if sel := doc.Find(selector).First(); sel.Length() > 0 {
				text, _ = sel.Attr("content")
			}
		} else {
			text = doc.Find(selector).First().Text()
		}

		text = strings.TrimSpace(text)
		if text != "" {
			p.logger.Printf("Found content with selector: %s", selector)
			return text
		}
	}

	return ""
}

// findHTMLBySelectors tries multiple CSS selectors and returns the first non-empty HTML
func (p *genericParser) findHTMLBySelectors(doc *goquery.Document, selectors []string) string {
	for _, selector := range selectors {
		if html, err := doc.Find(selector).First().Html(); err == nil && strings.TrimSpace(html) != "" {
			p.logger.Printf("Found HTML content with selector: %s", selector)
			return html
		}
	}

	return ""
}

// extractLocation handles both object and array formats for jobLocation in JSON-LD
func extractLocation(jobLocation interface{}) string {
	if jobLocation == nil {
		return ""
	}

	// Handle array of locations (take first)
	if locations, ok := jobLocation.([]interface{}); ok {
		if len(locations) > 0 {
			jobLocation = locations[0]
		} else {
			return ""
		}
	}

	// Handle location object
	if loc, ok := jobLocation.(map[string]interface{}); ok {
		var parts []string

		// Try to get address sub-object
		if address, ok := loc["address"].(map[string]interface{}); ok {
			if locality, ok := address["addressLocality"].(string); ok && locality != "" {
				parts = append(parts, locality)
			}
			if region, ok := address["addressRegion"].(string); ok && region != "" {
				parts = append(parts, region)
			}
			if country, ok := address["addressCountry"].(string); ok && country != "" {
				parts = append(parts, country)
			}
		}

		// Fallback to name field
		if len(parts) == 0 {
			if name, ok := loc["name"].(string); ok {
				return name
			}
		}

		return strings.Join(parts, ", ")
	}

	return ""
}
