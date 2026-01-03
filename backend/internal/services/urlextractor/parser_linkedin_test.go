package urlextractor

import (
	"context"
	"io"
	"log"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockHTTPFetcher is a mock implementation of HTTPFetcher for testing
type mockHTTPFetcher struct {
	response []byte
	err      error
}

func (m *mockHTTPFetcher) FetchURL(ctx context.Context, url string, headers map[string]string) ([]byte, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.response, nil
}

func TestLinkedInParser_ExtractJobID(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		want    string
		wantErr bool
	}{
		{
			name:    "job view URL",
			url:     "https://www.linkedin.com/jobs/view/4095728488",
			want:    "4095728488",
			wantErr: false,
		},
		{
			name:    "search result URL with currentJobId",
			url:     "https://www.linkedin.com/jobs/search/?currentJobId=1234567890",
			want:    "1234567890",
			wantErr: false,
		},
		{
			name:    "invalid URL without job ID",
			url:     "https://www.linkedin.com/jobs/search",
			want:    "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := extractLinkedInJobID(tt.url)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.want, got)
			}
		})
	}
}

func TestLinkedInParser_FetchAndParse(t *testing.T) {
	logger := log.New(io.Discard, "", 0)

	fixtureData, err := os.ReadFile("testdata/linkedin_sample.html")
	require.NoError(t, err, "Failed to read LinkedIn fixture")

	mockFetcher := &mockHTTPFetcher{
		response: fixtureData,
	}

	parser := newLinkedInParser(logger, mockFetcher)
	data, warnings, err := parser.FetchAndParse(context.Background(), "https://www.linkedin.com/jobs/view/4095728488")

	require.NoError(t, err)
	assert.NotNil(t, data)
	assert.Equal(t, "linkedin", data.Platform)
	assert.NotEmpty(t, data.Title, "Title should not be empty")
	assert.NotEmpty(t, data.Company, "Company should not be empty")
	assert.NotEmpty(t, data.Location, "Location should not be empty")
	assert.NotEmpty(t, data.Description, "Description should not be empty")
	assert.Empty(t, warnings, "Should have no warnings for valid job data")
}

func TestLinkedInParser_MissingFields(t *testing.T) {
	logger := log.New(io.Discard, "", 0)

	minimalHTML := `
		<html>
			<div class="show-more-less-html__markup"></div>
		</html>
	`

	mockFetcher := &mockHTTPFetcher{
		response: []byte(minimalHTML),
	}

	parser := newLinkedInParser(logger, mockFetcher)
	data, warnings, err := parser.FetchAndParse(context.Background(), "https://www.linkedin.com/jobs/view/1234567890")

	assert.Error(t, err, "Should error when both title and company are missing")
	assert.Nil(t, data)
	assert.Nil(t, warnings)
}

func TestCleanText(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "trim whitespace",
			input: "  Software Engineer  ",
			want:  "Software Engineer",
		},
		{
			name:  "collapse multiple spaces",
			input: "Software    Engineer",
			want:  "Software Engineer",
		},
		{
			name:  "mixed whitespace",
			input: "  Software\t\n  Engineer  ",
			want:  "Software Engineer",
		},
		{
			name:  "empty string",
			input: "",
			want:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cleanText(tt.input)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestExtractDescription(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "preserve paragraphs",
			input: "<p>First paragraph</p><p>Second paragraph</p>",
			want:  "First paragraph\n\nSecond paragraph",
		},
		{
			name:  "convert br tags",
			input: "Line 1<br>Line 2<br/>Line 3",
			want:  "Line 1\nLine 2\nLine 3",
		},
		{
			name:  "convert list items",
			input: "<ul><li>Item 1</li><li>Item 2</li></ul>",
			want:  "Item 1\nItem 2",
		},
		{
			name:  "strip HTML tags",
			input: "<strong>Bold</strong> and <em>italic</em> text",
			want:  "Bold and italic text",
		},
		{
			name:  "collapse excessive newlines",
			input: "<p>Para 1</p><br><br><br><p>Para 2</p>",
			want:  "Para 1\n\nPara 2",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractDescription(tt.input)
			assert.Equal(t, strings.TrimSpace(tt.want), strings.TrimSpace(got))
		})
	}
}
