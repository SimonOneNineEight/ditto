package urlextractor

import (
	"context"
	"io"
	"log"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNormalizeIndeedURL(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{
			name:    "search result URL with vjk parameter",
			input:   "https://www.indeed.com/jobs?q=software+engineer&l=Greenville,+SC&vjk=0db8a5f21010e5ec",
			want:    "https://www.indeed.com/viewjob?jk=0db8a5f21010e5ec",
			wantErr: false,
		},
		{
			name:    "direct job URL with jk parameter",
			input:   "https://www.indeed.com/viewjob?jk=0db8a5f21010e5ec",
			want:    "https://www.indeed.com/viewjob?jk=0db8a5f21010e5ec",
			wantErr: false,
		},
		{
			name:    "job URL with additional parameters",
			input:   "https://www.indeed.com/viewjob?jk=abc123&from=serp&vjs=3",
			want:    "https://www.indeed.com/viewjob?jk=abc123",
			wantErr: false,
		},
		{
			name:    "URL without job ID",
			input:   "https://www.indeed.com/jobs?q=software+engineer",
			want:    "",
			wantErr: true,
		},
		{
			name:    "invalid URL",
			input:   "not-a-url",
			want:    "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := normalizeIndeedURL(tt.input)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.want, got)
			}
		})
	}
}

func TestIndeedParser_FetchAndParse(t *testing.T) {
	logger := log.New(io.Discard, "", 0)

	fixtureData, err := os.ReadFile("testdata/indeed_sample.html")
	require.NoError(t, err, "Failed to read Indeed fixture")

	mockFetcher := &mockHTTPFetcher{
		response: fixtureData,
	}

	parser := newIndeedParser(logger, mockFetcher)
	data, warnings, err := parser.FetchAndParse(context.Background(), "https://www.indeed.com/viewjob?jk=0db8a5f21010e5ec")

	require.NoError(t, err)
	assert.NotNil(t, data)
	assert.Equal(t, "indeed", data.Platform)
	assert.NotEmpty(t, data.Title, "Title should not be empty")
	assert.NotEmpty(t, data.Company, "Company should not be empty")
	assert.NotEmpty(t, data.Description, "Description should not be empty")
	assert.Empty(t, warnings, "Should have no warnings for valid job data")
}

func TestIndeedParser_MissingJobID(t *testing.T) {
	logger := log.New(io.Discard, "", 0)
	mockFetcher := &mockHTTPFetcher{}
	parser := newIndeedParser(logger, mockFetcher)

	_, _, err := parser.FetchAndParse(context.Background(), "https://www.indeed.com/jobs?q=software")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "job ID", "Error should mention missing job ID")
}
