package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
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

	// Normalize URL to proper job detail format
	normalizedURL, err := normalizeIndeedURL(url)
	if err != nil {
		return nil, nil, err
	}

	if normalizedURL != url {
		p.logger.Printf("Normalized Indeed URL from %s to %s", url, normalizedURL)
	}

	header := map[string]string{
		"Referer": "https://www.indeed.com/",
	}

	body, err := fetchURL(ctx, normalizedURL, header, p.logger)
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
	var jobData *ExtractedJobData
	var warnings []string

	doc.Find("script[type='application/ld+json']").Each(func(i int, s *goquery.Selection) {
		if jobData != nil {
			return
		}
		jsonText := s.Text()
		var schema indeedJobSchema
		if err := json.Unmarshal([]byte(jsonText), &schema); err != nil {
			return
		}
		if schema.Type != "JobPosting" {
			return
		}

		location := strings.TrimSpace(schema.JobLocation.Address.AddressLocality)

		if region := strings.TrimSpace(schema.JobLocation.Address.AddressRegion); region != "" {
			if location != "" {
				location += ", " + region
			} else {
				location = region
			}
		}

		jobData = &ExtractedJobData{
			Title:       cleanText(schema.Title),
			Company:     cleanText(schema.HiringOrg.Name),
			Location:    cleanText(location),
			Description: extractDescription(schema.Description),
			Platform:    "indeed",
		}
	})

	if jobData == nil {
		return nil, nil, fmt.Errorf("no JobPosting schema found")
	}

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

	if jobData.Title == "" && jobData.Company == "" {
		return nil, nil, errors.New(errors.ErrorParsingFailed, "Failed to extract job data from Indeed JSON-LD", "The job posting may have been removed or the schema format changed")
	}

	return jobData, warnings, nil
}

func (p *indeedParser) extractFromHTML(doc *goquery.Document) (*ExtractedJobData, []string, error) {
	p.logger.Println("Extracting Indeed job data from HTML selectors")

	title := doc.Find("h1.jobsearch-JobInfoHeader-title, h2.jobTitle").First().Text()
	company := doc.Find(".jobsearch-InlineCompanyRating-companyHeader a, .jobsearch-CompanyInfoContainer a").First().Text()
	location := doc.Find(".jobsearch-JobInfoHeader-subtitle div").First().Text()

	descriptionHTML, _ := doc.Find("#jobDescriptionText, .jobsearch-jobDescriptionText").First().Html()

	data := &ExtractedJobData{
		Title:       cleanText(title),
		Company:     cleanText(company),
		Location:    cleanText(location),
		Description: extractDescription(descriptionHTML),
		Platform:    "indeed",
	}

	var warnings []string

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

	if data.Title == "" && data.Company == "" {
		return nil, nil, errors.New(errors.ErrorParsingFailed,
			"Failed to extract job data from Indeed HTML",
			"The job posting may have been removed or the HTML structure changed")
	}

	p.logger.Printf("Successfully extracted Indeed job data from HTML with %d warnings", len(warnings))

	return data, warnings, nil
}

func normalizeIndeedURL(rawURL string) (string, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", errors.New(errors.ErrorValidationFailed, "Invalid Indeed URL format", err.Error())
	}

	jobID := u.Query().Get("jk")
	if jobID == "" {
		jobID = u.Query().Get("vjk")
	}

	if jobID == "" {
		return "", errors.New(errors.ErrorValidationFailed,
			"Could not find job ID in Indeed URL",
			"URL must contain either jk= or vjk= parameter")
	}

	return fmt.Sprintf("https://www.indeed.com/viewjob?jk=%s", jobID), nil
}
