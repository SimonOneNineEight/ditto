package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"fmt"
	"log"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type linkedInParser struct {
	logger  *log.Logger
	fetcher HTTPFetcher
}

func newLinkedInParser(logger *log.Logger, fetcher HTTPFetcher) Parser {
	return &linkedInParser{
		logger:  logger,
		fetcher: fetcher,
	}
}

func (p *linkedInParser) FetchAndParse(ctx context.Context, jobURL string) (*ExtractedJobData, []string, error) {
	jobID, err := extractLinkedInJobID(jobURL)
	if err != nil {
		return nil, nil, errors.New(errors.ErrorValidationFailed, "Invalid LinkedIn job URL format", err.Error())
	}

	p.logger.Printf("Extracted LinkedIn job ID: %s", jobID)

	guestJobURL := fmt.Sprintf("https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/%s", jobID)

	header := map[string]string{
		"Referer": "https://www.linkedin.com/jobs/search",
	}
	body, err := p.fetcher.FetchURL(ctx, guestJobURL, header)
	if err != nil {
		return nil, nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, nil, errors.Wrap(errors.ErrorParsingFailed, "Failed to parse LinkedIn HTML response",
			err)
	}

	// Extract description with preserved HTML structure
	descriptionHTML, _ := doc.Find(".show-more-less-html__markup").First().Html()
	descriptionHTML = sanitizeHTML(descriptionHTML)

	// Extract job type from criteria list
	jobType := ""
	doc.Find(".description__job-criteria-item").Each(func(i int, s *goquery.Selection) {
		header := cleanText(s.Find(".description__job-criteria-subheader").Text())
		if strings.Contains(strings.ToLower(header), "employment type") {
			jobType = normalizeJobType(cleanText(s.Find(".description__job-criteria-text").Text()))
		}
	})

	data := &ExtractedJobData{
		Title:       cleanText(doc.Find(".top-card-layout__title").First().Text()),
		Company:     cleanText(doc.Find(".top-card-layout__card a.topcard__org-name-link").First().Text()),
		Location:    cleanText(doc.Find(".top-card-layout__card .topcard__flavor--bullet").First().Text()),
		Description: extractDescription(descriptionHTML),
		JobType:     jobType,
		Platform:    "linkedin",
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
			"Failed to extract job data from LinkedIn HTML",
			"The job posting may have been removed or the HTML structure changed")
	}

	p.logger.Printf("Successfully extracted LinkedIn job data with %d warnings", len(warnings))

	return data, warnings, nil
}

func extractLinkedInJobID(url string) (string, error) {
	reJob := regexp.MustCompile(`/jobs/view/(\d+)`)
	if matches := reJob.FindStringSubmatch(url); len(matches) >= 2 {
		return matches[1], nil
	}

	reSearch := regexp.MustCompile(`[?&]currentJobId=(\d+)`)

	if matches := reSearch.FindStringSubmatch(url); len(matches) >= 2 {
		return matches[1], nil
	}

	return "", fmt.Errorf("could not extract job ID from URL")
}

func cleanText(text string) string {
	text = strings.TrimSpace(text)
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")
	return text
}

// normalizeJobType converts various job type strings to our standard format
func normalizeJobType(jobType string) string {
	lower := strings.ToLower(jobType)
	switch {
	case strings.Contains(lower, "full-time") || strings.Contains(lower, "full time"):
		return "full-time"
	case strings.Contains(lower, "part-time") || strings.Contains(lower, "part time"):
		return "part-time"
	case strings.Contains(lower, "contract"):
		return "contract"
	case strings.Contains(lower, "internship") || strings.Contains(lower, "intern"):
		return "internship"
	default:
		return ""
	}
}

func extractDescription(htmlContent string) string {
	htmlContent = regexp.MustCompile(`<br\s*/?>`).ReplaceAllString(htmlContent, "\n")
	htmlContent = regexp.MustCompile(`</li>`).ReplaceAllString(htmlContent, "\n")
	htmlContent = regexp.MustCompile(`</(p|div)>`).ReplaceAllString(htmlContent, "\n\n")

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		htmlContent = regexp.MustCompile(`<[^>]*>`).ReplaceAllString(htmlContent, "")
	} else {
		htmlContent = doc.Text()
	}

	text := strings.TrimSpace(htmlContent)
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = regexp.MustCompile(`[^\S\n]+`).ReplaceAllString(text, " ")
	text = regexp.MustCompile(`\n{3,}`).ReplaceAllString(text, "\n\n")

	return text
}
