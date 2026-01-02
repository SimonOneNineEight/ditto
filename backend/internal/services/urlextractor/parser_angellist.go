package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"encoding/json"
	"log"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type angelListParser struct {
	logger *log.Logger
}

func newAngelListParser(logger *log.Logger) Parser {
	return &angelListParser{logger: logger}
}

func (p *angelListParser) FetchAndParse(ctx context.Context, jobURL string) (*ExtractedJobData, []string, error) {
	p.logger.Printf("Fetching Wellfound job: %s", jobURL)

	body, err := fetchURL(ctx, jobURL, map[string]string{
		"Referer": "https://wellfound.com/",
	}, p.logger)
	if err != nil {
		return nil, nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, nil, errors.Wrap(errors.ErrorParsingFailed, "Failed to parse Wellfound HTML response", err)
	}

	data, warnings, err := p.extractFromNextData(doc)
	if err != nil {
		return nil, nil, err
	}

	p.logger.Printf("Successfully extracted Wellfound job data")
	return data, warnings, nil
}

func (p *angelListParser) extractFromNextData(doc *goquery.Document) (*ExtractedJobData, []string, error) {
	var warnings []string

	nextDataScript := doc.Find("script#__NEXT_DATA__").First().Text()
	if nextDataScript == "" {
		return nil, nil, errors.New(errors.ErrorParsingFailed,
			"Failed to find __NEXT_DATA__ script tag",
			"Wellfound page structure may have changed")
	}

	var nextData map[string]interface{}
	if err := json.Unmarshal([]byte(nextDataScript), &nextData); err != nil {
		return nil, nil, errors.Wrap(errors.ErrorParsingFailed, "Failed to parse __NEXT_DATA__ JSON", err)
	}

	props, ok := nextData["props"].(map[string]interface{})
	if !ok {
		return nil, nil, errors.New(errors.ErrorParsingFailed, "Invalid __NEXT_DATA__ structure: missing props")
	}

	pageProps, ok := props["pageProps"].(map[string]interface{})
	if !ok {
		return nil, nil, errors.New(errors.ErrorParsingFailed, "Invalid __NEXT_DATA__ structure: missing pageProps")
	}

	apolloState, ok := pageProps["apolloState"].(map[string]interface{})
	if !ok {
		return nil, nil, errors.New(errors.ErrorParsingFailed, "Invalid __NEXT_DATA__ structure: missing apolloState")
	}

	title, company, location, description := p.extractJobFromApolloState(apolloState)

	data := &ExtractedJobData{
		Title:       cleanText(title),
		Company:     cleanText(company),
		Location:    cleanText(location),
		Description: extractDescription(description),
		Platform:    "wellfound",
	}

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
			"Failed to extract job data from Wellfound",
			"The job posting may have been removed or the data structure changed")
	}

	return data, warnings, nil
}

func (p *angelListParser) extractJobFromApolloState(apolloState map[string]interface{}) (title, company, location, description string) {
	for key, value := range apolloState {
		obj, ok := value.(map[string]interface{})
		if !ok {
			continue
		}

		typename, _ := obj["__typename"].(string)

		if typename == "JobListing" || typename == "JobPost" || strings.Contains(key, "JobListing") {
			if t, ok := obj["title"].(string); ok {
				title = t
			}
			if d, ok := obj["description"].(string); ok {
				description = d
			}
			if l, ok := obj["locationNames"].([]interface{}); ok && len(l) > 0 {
				if loc, ok := l[0].(string); ok {
					location = loc
				}
			}
		}

		if typename == "Startup" || typename == "Company" || strings.Contains(key, "Startup") {
			if c, ok := obj["name"].(string); ok && company == "" {
				company = c
			}
		}
	}

	return
}
