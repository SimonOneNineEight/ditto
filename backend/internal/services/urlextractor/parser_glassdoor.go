package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type glassdoorParser struct {
	logger  *log.Logger
	fetcher HTTPFetcher
}

func newGlassdoorParser(logger *log.Logger, fetcher HTTPFetcher) Parser {
	return &glassdoorParser{
		logger:  logger,
		fetcher: fetcher,
	}
}

type glassdoorJobSchema struct {
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

func (p *glassdoorParser) FetchAndParse(ctx context.Context, jobURL string) (*ExtractedJobData, []string, error) {
	p.logger.Printf("Fetching Glassdoor job: %s", jobURL)

	body, err := p.fetcher.FetchURL(ctx, jobURL, map[string]string{
		"Referer": "https://www.glassdoor.com/",
	})
	if err != nil {
		return nil, nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, nil, errors.Wrap(errors.ErrorParsingFailed, "Failed to parse Glassdoor HTML response", err)
	}

	data, warnings, err := p.extractFromJSONLD(doc)
	if err == nil && data != nil {
		p.logger.Printf("Successfully extracted Glassdoor job data from JSON-LD")
		return data, warnings, nil
	}

	p.logger.Printf("JSON-LD extraction failed, falling back to HTML parsing: %v", err)
	return p.extractFromHTML(doc)
}

func (p *glassdoorParser) extractFromJSONLD(doc *goquery.Document) (*ExtractedJobData, []string, error) {
	var jobData *ExtractedJobData
	var warnings []string

	doc.Find("script[type='application/ld+json']").Each(func(i int, s *goquery.Selection) {
		if jobData != nil {
			return
		}

		jsonText := s.Text()
		var schema glassdoorJobSchema
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
			Platform:    "glassdoor",
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
		return nil, nil, errors.New(errors.ErrorParsingFailed,
			"Failed to extract job data from Glassdoor JSON-LD",
			"The job posting may have been removed or the schema format changed")
	}

	return jobData, warnings, nil
}

func (p *glassdoorParser) extractFromHTML(doc *goquery.Document) (*ExtractedJobData, []string, error) {
	p.logger.Println("Extracting Glassdoor job data from HTML selectors")

	title := doc.Find("a[data-test='job-link'] > span, h1[data-test='job-title'], .JobDetails_jobTitle__Rw_gn").First().Text()
	company := doc.Find("[data-test='employer-short-name'], .EmployerProfile_employerName__Xemli, .css-87uc0g").First().Text()
	location := doc.Find("[data-test='employer-location'], .JobDetails_location__mSg5h, .css-1v5elnn").First().Text()
	descriptionHTML, _ := doc.Find("[data-test='job-description'], .JobDetails_jobDescription__uW_fK, .desc").First().Html()

	data := &ExtractedJobData{
		Title:       cleanText(title),
		Company:     cleanText(company),
		Location:    cleanText(location),
		Description: extractDescription(descriptionHTML),
		Platform:    "glassdoor",
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
			"Failed to extract job data from Glassdoor HTML",
			"The job posting may have been removed, require login, or the HTML structure changed",
			"Glassdoor has aggressive anti-scraping measures that may block requests")
	}

	p.logger.Printf("Successfully extracted Glassdoor job data from HTML with %d warnings", len(warnings))

	return data, warnings, nil
}
