package urlextractor

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSanitizeHTML(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Removes script tags",
			input:    `<p>Job description</p><script>alert('xss')</script>`,
			expected: `<p>Job description</p>`,
		},
		{
			name:     "Removes event handlers",
			input:    `<p onclick="alert('xss')">Click me</p>`,
			expected: `<p>Click me</p>`,
		},
		{
			name:     "Removes javascript: URLs",
			input:    `<a href="javascript:alert('xss')">Click</a>`,
			expected: `Click`,
		},
		{
			name:     "Preserves safe HTML",
			input:    `<p>Job <strong>description</strong> with <a href="https://example.com">link</a></p>`,
			expected: `<p>Job <strong>description</strong> with <a href="https://example.com" rel="nofollow">link</a></p>`,
		},
		{
			name:     "Preserves lists",
			input:    `<ul><li>Item 1</li><li>Item 2</li></ul>`,
			expected: `<ul><li>Item 1</li><li>Item 2</li></ul>`,
		},
		{
			name:     "Removes iframe",
			input:    `<p>Description</p><iframe src="evil.com"></iframe>`,
			expected: `<p>Description</p>`,
		},
		{
			name:     "Empty input",
			input:    ``,
			expected: ``,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizeHTML(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}
