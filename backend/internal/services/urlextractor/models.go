// Package urlextractor provides job posting URL extraction services.
// It supports LinkedIn, Indeed, Glassdoor, and AngelList platforms.
package urlextractor

// ExtractRequest represents the request payload for URL extraction.
type ExtractRequest struct {
	URL string `json:"url" binding:"required"`
}

// ExtractedJobData represents the structured data extracted from a job posting URL.
type ExtractedJobData struct {
	Title       string `json:"title"`
	Company     string `json:"company"`
	Location    string `json:"location"`
	Description string `json:"description"`
	Platform    string `json:"platform"` // "linkedin" | "indeed" | "glassdoor" | "angellist"
}
