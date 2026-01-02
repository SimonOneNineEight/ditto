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
	logger *log.Logger
}

func newLinkedInParser(logger *log.Logger) Parser {
	return &linkedInParser{logger: logger}
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
	body, err := fetchURL(ctx, guestJobURL, header, p.logger)
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

	data := &ExtractedJobData{
		Title:   cleanText(doc.Find(".top-card-layout__title").First().Text()),
		Company: cleanText(doc.Find(".top-card-layout__card a.topcard__org-name-link").First().Text()),

		Location:    cleanText(doc.Find(".top-card-layout__card .topcard__flavor--bullet").First().Text()),
		Description: extractDescription(descriptionHTML),
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

// extractDescription converts HTML description to formatted text with preserved paragraphs
func extractDescription(htmlContent string) string {
	// Replace <br> and <br/> tags with newlines
	htmlContent = regexp.MustCompile(`<br\s*/?>` ).ReplaceAllString(htmlContent, "\n")

	// Replace closing list items with newlines
	htmlContent = regexp.MustCompile(`</li>`).ReplaceAllString(htmlContent, "\n")

	// Replace closing paragraphs and divs with double newlines
	htmlContent = regexp.MustCompile(`</(p|div)>`).ReplaceAllString(htmlContent, "\n\n")

	// Parse the modified HTML to extract text
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		// If parsing fails, just strip basic HTML tags
		htmlContent = regexp.MustCompile(`<[^>]*>`).ReplaceAllString(htmlContent, "")
	} else {
		htmlContent = doc.Text()
	}

	// Clean and normalize the text
	text := strings.TrimSpace(htmlContent)
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = regexp.MustCompile(`[^\S\n]+`).ReplaceAllString(text, " ")
	text = regexp.MustCompile(`\n{3,}`).ReplaceAllString(text, "\n\n")

	return text
}
