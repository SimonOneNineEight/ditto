package urlextractor

import (
	"context"
	"io"
	"log"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateURL(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr bool
		errMsg  string
	}{
		{
			name:    "valid https URL",
			url:     "https://www.linkedin.com/jobs/view/123",
			wantErr: false,
		},
		{
			name:    "valid http URL",
			url:     "http://www.indeed.com/jobs",
			wantErr: false,
		},
		{
			name:    "empty URL",
			url:     "",
			wantErr: true,
			errMsg:  "required",
		},
		{
			name:    "invalid URL format",
			url:     "not-a-valid-url",
			wantErr: true,
		},
		{
			name:    "missing scheme",
			url:     "linkedin.com/jobs",
			wantErr: true,
		},
		{
			name:    "invalid scheme",
			url:     "ftp://linkedin.com/jobs",
			wantErr: true,
			errMsg:  "http or https",
		},
		{
			name:    "missing host",
			url:     "https://",
			wantErr: true,
			errMsg:  "valid host",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateURL(tt.url)
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestDetectPlatform(t *testing.T) {
	tests := []struct {
		name     string
		url      string
		want     string
		wantErr  bool
		errMsg   string
	}{
		{
			name:    "LinkedIn with www",
			url:     "https://www.linkedin.com/jobs/view/123",
			want:    PlatformLinkedIn,
			wantErr: false,
		},
		{
			name:    "LinkedIn without www",
			url:     "https://linkedin.com/jobs/view/123",
			want:    PlatformLinkedIn,
			wantErr: false,
		},
		{
			name:    "Indeed with www",
			url:     "https://www.indeed.com/viewjob?jk=123",
			want:    PlatformIndeed,
			wantErr: false,
		},
		{
			name:    "Indeed without www",
			url:     "https://indeed.com/viewjob?jk=123",
			want:    PlatformIndeed,
			wantErr: false,
		},
		{
			name:    "Glassdoor (uses generic parser)",
			url:     "https://www.glassdoor.com/job/123",
			want:    "generic",
			wantErr: false,
		},
		{
			name:    "Wellfound (uses generic parser)",
			url:     "https://wellfound.com/jobs/123",
			want:    "generic",
			wantErr: false,
		},
		{
			name:    "AngelList domain (uses generic parser)",
			url:     "https://angel.co/jobs/123",
			want:    "generic",
			wantErr: false,
		},
		{
			name:    "Greenhouse (uses generic parser)",
			url:     "https://boards.greenhouse.io/company/job",
			want:    "generic",
			wantErr: false,
		},
		{
			name:    "Lever (uses generic parser)",
			url:     "https://jobs.lever.co/company/job",
			want:    "generic",
			wantErr: false,
		},
		{
			name:    "Custom career page (uses generic parser)",
			url:     "https://www.company.com/careers/job/123",
			want:    "generic",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := detectPlatform(tt.url)
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.want, got)
			}
		})
	}
}

// TestExtractor_Extract_LinkedIn and TestExtractor_Extract_Indeed are covered by
// the parser-specific tests in parser_linkedin_test.go and parser_indeed_test.go

func TestExtractor_Extract_InvalidURL(t *testing.T) {
	logger := log.New(io.Discard, "", 0)
	e := New(logger)

	_, _, err := e.Extract(context.Background(), "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "required")

	_, _, err = e.Extract(context.Background(), "not-a-url")
	assert.Error(t, err)
}

// TestExtractor_Extract_UnsupportedPlatform removed - all platforms now supported via generic parser
