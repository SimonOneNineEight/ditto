package urlextractor

import (
	"context"
	"io"
	"log"
	"testing"
)

func TestGenericParser_JSONLD_FullData(t *testing.T) {
	html := `
		<!DOCTYPE html>
		<html>
		<head>
			<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "JobPosting",
				"title": "Senior Software Engineer",
				"description": "<p>Build amazing products</p>",
				"hiringOrganization": {
					"@type": "Organization",
					"name": "Tech Corp"
				},
				"jobLocation": {
					"@type": "Place",
					"address": {
						"@type": "PostalAddress",
						"addressLocality": "San Francisco",
						"addressRegion": "CA"
					}
				}
			}
			</script>
		</head>
		<body></body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, warnings, err := parser.FetchAndParse(context.Background(), "https://example.com/job/123")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if data.Title != "Senior Software Engineer" {
		t.Errorf("Expected title 'Senior Software Engineer', got: %s", data.Title)
	}

	if data.Company != "Tech Corp" {
		t.Errorf("Expected company 'Tech Corp', got: %s", data.Company)
	}

	if data.Location != "San Francisco, CA" {
		t.Errorf("Expected location 'San Francisco, CA', got: %s", data.Location)
	}

	if data.Description != "Build amazing products" {
		t.Errorf("Expected description 'Build amazing products', got: %s", data.Description)
	}

	if data.Platform != "generic" {
		t.Errorf("Expected platform 'generic', got: %s", data.Platform)
	}

	if len(warnings) != 0 {
		t.Errorf("Expected no warnings, got: %v", warnings)
	}
}

func TestGenericParser_JSONLD_PartialData(t *testing.T) {
	html := `
		<!DOCTYPE html>
		<html>
		<head>
			<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "JobPosting",
				"title": "Product Manager",
				"hiringOrganization": {
					"@type": "Organization",
					"name": "Startup Inc"
				}
			}
			</script>
		</head>
		<body></body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, warnings, err := parser.FetchAndParse(context.Background(), "https://example.com/job/456")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if data.Title != "Product Manager" {
		t.Errorf("Expected title 'Product Manager', got: %s", data.Title)
	}

	if data.Company != "Startup Inc" {
		t.Errorf("Expected company 'Startup Inc', got: %s", data.Company)
	}

	// Should have warnings for missing fields
	if len(warnings) != 2 {
		t.Errorf("Expected 2 warnings, got %d: %v", len(warnings), warnings)
	}

	expectedWarnings := map[string]bool{
		"Could not extract location":        true,
		"Could not extract job description": true,
	}

	for _, warning := range warnings {
		if !expectedWarnings[warning] {
			t.Errorf("Unexpected warning: %s", warning)
		}
	}
}

func TestGenericParser_JSONLD_ArrayLocation(t *testing.T) {
	html := `
		<!DOCTYPE html>
		<html>
		<head>
			<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "JobPosting",
				"title": "Data Scientist",
				"description": "Work with data",
				"hiringOrganization": {
					"@type": "Organization",
					"name": "Data Corp"
				},
				"jobLocation": [
					{
						"@type": "Place",
						"address": {
							"@type": "PostalAddress",
							"addressLocality": "New York",
							"addressRegion": "NY"
						}
					},
					{
						"@type": "Place",
						"address": {
							"@type": "PostalAddress",
							"addressLocality": "Boston",
							"addressRegion": "MA"
						}
					}
				]
			}
			</script>
		</head>
		<body></body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, warnings, err := parser.FetchAndParse(context.Background(), "https://example.com/job/789")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Should extract first location from array
	if data.Location != "New York, NY" {
		t.Errorf("Expected location 'New York, NY', got: %s", data.Location)
	}

	if len(warnings) != 0 {
		t.Errorf("Expected no warnings, got: %v", warnings)
	}
}

func TestGenericParser_HTMLFallback_Success(t *testing.T) {
	html := `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Job at Company</title>
		</head>
		<body>
			<h1 class="job-title">Backend Developer</h1>
			<span class="company-name">Web Solutions Ltd</span>
			<div class="location">Remote</div>
			<div class="job-description">
				<p>We are looking for a backend developer</p>
				<ul><li>Build APIs</li></ul>
			</div>
		</body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, warnings, err := parser.FetchAndParse(context.Background(), "https://example.com/careers/backend")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if data.Title != "Backend Developer" {
		t.Errorf("Expected title 'Backend Developer', got: %s", data.Title)
	}

	if data.Company != "Web Solutions Ltd" {
		t.Errorf("Expected company 'Web Solutions Ltd', got: %s", data.Company)
	}

	if data.Location != "Remote" {
		t.Errorf("Expected location 'Remote', got: %s", data.Location)
	}

	if !contains(data.Description, "looking for a backend developer") {
		t.Errorf("Expected description to contain job details, got: %s", data.Description)
	}

	if len(warnings) != 0 {
		t.Errorf("Expected no warnings, got: %v", warnings)
	}
}

func TestGenericParser_HTMLFallback_PartialData(t *testing.T) {
	html := `
		<!DOCTYPE html>
		<html>
		<head></head>
		<body>
			<h1 id="job-title">DevOps Engineer</h1>
			<article>
				<p>Manage infrastructure and deployments</p>
			</article>
		</body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, warnings, err := parser.FetchAndParse(context.Background(), "https://example.com/job")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if data.Title != "DevOps Engineer" {
		t.Errorf("Expected title 'DevOps Engineer', got: %s", data.Title)
	}

	if !contains(data.Description, "infrastructure") {
		t.Errorf("Expected description to contain 'infrastructure', got: %s", data.Description)
	}

	// Should have warnings for missing company and location
	if len(warnings) < 2 {
		t.Errorf("Expected at least 2 warnings, got %d: %v", len(warnings), warnings)
	}
}

func TestGenericParser_NoJobPosting_Fails(t *testing.T) {
	html := `
		<!DOCTYPE html>
		<html>
		<head>
			<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "Article",
				"headline": "Not a job posting"
			}
			</script>
		</head>
		<body>
			<p>This is just an article</p>
		</body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, warnings, err := parser.FetchAndParse(context.Background(), "https://example.com/article")

	if err == nil {
		t.Fatal("Expected error when no job data found, got nil")
	}

	if data != nil {
		t.Errorf("Expected nil data on error, got: %+v", data)
	}

	if len(warnings) != 0 {
		t.Errorf("Expected no warnings on error, got: %v", warnings)
	}
}

func TestGenericParser_XSSSanitization(t *testing.T) {
	// Test HTML sanitization in HTML fallback mode
	html := `
		<!DOCTYPE html>
		<html>
		<head></head>
		<body>
			<h1 class="job-title">Security Engineer</h1>
			<span class="company-name">Secure Corp</span>
			<div class="job-description">
				<p>Secure systems and protect data</p>
				<script>alert('xss')</script>
				<iframe src='bad.com'></iframe>
			</div>
		</body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, _, err := parser.FetchAndParse(context.Background(), "https://example.com/job/sec")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Should sanitize XSS attempts
	if contains(data.Description, "<script>") {
		t.Error("Expected script tags to be removed")
	}

	if contains(data.Description, "<iframe>") {
		t.Error("Expected iframe tags to be removed")
	}

	if !contains(data.Description, "Secure systems") {
		t.Error("Expected safe content to be preserved")
	}
}

func TestGenericParser_MetaTagFallback(t *testing.T) {
	html := `
		<!DOCTYPE html>
		<html>
		<head>
			<meta property="og:title" content="UX Designer Position" />
			<meta property="og:site_name" content="Design Studio" />
		</head>
		<body>
			<div class="job-description">Create beautiful interfaces</div>
		</body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, warnings, err := parser.FetchAndParse(context.Background(), "https://example.com/design-job")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if data.Title != "UX Designer Position" {
		t.Errorf("Expected title from og:title meta tag, got: %s", data.Title)
	}

	if data.Company != "Design Studio" {
		t.Errorf("Expected company from og:site_name meta tag, got: %s", data.Company)
	}

	// Should have warning for missing location
	if len(warnings) < 1 {
		t.Errorf("Expected at least 1 warning, got %d: %v", len(warnings), warnings)
	}
}

func TestGenericParser_MinimalDataRequired(t *testing.T) {
	html := `
		<!DOCTYPE html>
		<html>
		<head>
			<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "JobPosting",
				"hiringOrganization": {
					"@type": "Organization",
					"name": "Minimal Corp"
				}
			}
			</script>
		</head>
		<body></body>
		</html>
	`

	fetcher := &mockHTTPFetcher{response: []byte(html)}
	logger := log.New(io.Discard, "", 0)
	parser := newGenericParser(logger, fetcher)

	data, warnings, err := parser.FetchAndParse(context.Background(), "https://example.com/job")

	// Should succeed with just company name
	if err != nil {
		t.Fatalf("Expected no error with company only, got: %v", err)
	}

	if data.Company != "Minimal Corp" {
		t.Errorf("Expected company 'Minimal Corp', got: %s", data.Company)
	}

	// Should have warnings for missing fields
	if len(warnings) != 3 {
		t.Errorf("Expected 3 warnings, got %d: %v", len(warnings), warnings)
	}
}

// Helper function for string contains check
func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && (s == substr || len(s) >= len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || containsHelper(s, substr)))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
