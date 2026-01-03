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
			name:    "Glassdoor (disabled)",
			url:     "https://www.glassdoor.com/job/123",
			want:    "",
			wantErr: true,
			errMsg:  "not supported",
		},
		{
			name:    "Wellfound (disabled)",
			url:     "https://wellfound.com/jobs/123",
			want:    "",
			wantErr: true,
			errMsg:  "not supported",
		},
		{
			name:    "AngelList domain (disabled)",
			url:     "https://angel.co/jobs/123",
			want:    "",
			wantErr: true,
			errMsg:  "not supported",
		},
		{
			name:    "unsupported platform",
			url:     "https://www.monster.com/jobs/123",
			want:    "",
			wantErr: true,
			errMsg:  "not supported",
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

func TestExtractor_Extract_UnsupportedPlatform(t *testing.T) {
	logger := log.New(io.Discard, "", 0)
	e := New(logger)

	tests := []struct {
		name string
		url  string
	}{
		{"Glassdoor", "https://www.glassdoor.com/job/123"},
		{"Wellfound", "https://wellfound.com/jobs/123"},
		{"Monster", "https://www.monster.com/jobs/123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := e.Extract(context.Background(), tt.url)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "not supported")
		})
	}
}
