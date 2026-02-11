package services

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewSanitizerService(t *testing.T) {
	s := NewSanitizerService()
	assert.NotNil(t, s)
	assert.NotNil(t, s.policy)
}

func TestSanitizeHTML_EmptyString(t *testing.T) {
	s := NewSanitizerService()
	result := s.SanitizeHTML("")
	assert.Equal(t, "", result)
}

func TestSanitizeHTML_ScriptRemoval(t *testing.T) {
	s := NewSanitizerService()

	tests := []struct {
		name  string
		input string
	}{
		{"basic script tag", `<script>alert('xss')</script>`},
		{"script with src", `<script src="evil.js"></script>`},
		{"event handler onclick", `<div onclick="alert('xss')">click me</div>`},
		{"event handler onerror", `<img src="x" onerror="alert('xss')">`},
		{"javascript url", `<a href="javascript:alert('xss')">click</a>`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := s.SanitizeHTML(tt.input)
			assert.NotContains(t, strings.ToLower(result), "script")
			assert.NotContains(t, strings.ToLower(result), "onclick")
			assert.NotContains(t, strings.ToLower(result), "onerror")
			assert.NotContains(t, strings.ToLower(result), "javascript:")
		})
	}
}

func TestSanitizeHTML_AllowedTags(t *testing.T) {
	s := NewSanitizerService()

	tests := []struct {
		name     string
		input    string
		contains string
	}{
		{"paragraph", "<p>Hello world</p>", "<p>"},
		{"bold", "<strong>bold text</strong>", "<strong>"},
		{"italic", "<em>italic text</em>", "<em>"},
		{"unordered list", "<ul><li>item</li></ul>", "<ul>"},
		{"ordered list", "<ol><li>item</li></ol>", "<ol>"},
		{"line break", "line1<br>line2", "<br>"},
		{"link", `<a href="https://example.com">link</a>`, "<a "},
		{"heading", "<h1>Title</h1>", "<h1>"},
		{"blockquote", "<blockquote>quote</blockquote>", "<blockquote>"},
		{"code", "<code>code</code>", "<code>"},
		{"pre", "<pre>preformatted</pre>", "<pre>"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := s.SanitizeHTML(tt.input)
			assert.Contains(t, result, tt.contains)
		})
	}
}

func TestSanitizeHTML_LinkAttributes(t *testing.T) {
	s := NewSanitizerService()

	input := `<a href="https://example.com">link</a>`
	result := s.SanitizeHTML(input)

	assert.Contains(t, result, `rel="nofollow"`)
	assert.Contains(t, result, `noreferrer`)
}

func TestSanitizeHTML_DisallowedTags(t *testing.T) {
	s := NewSanitizerService()

	tests := []struct {
		name        string
		input       string
		notContains string
	}{
		{"iframe", `<iframe src="https://evil.com"></iframe>`, "<iframe"},
		{"object", `<object data="evil.swf"></object>`, "<object"},
		{"embed", `<embed src="evil.swf">`, "<embed"},
		{"form", `<form action="/steal"><input></form>`, "<form"},
		{"style tag", `<style>body{display:none}</style>`, "<style"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := s.SanitizeHTML(tt.input)
			assert.NotContains(t, result, tt.notContains)
		})
	}
}

func TestSanitizeHTML_PreservesText(t *testing.T) {
	s := NewSanitizerService()

	input := `<p>Hello <strong>world</strong>, this is a <em>test</em>.</p>`
	result := s.SanitizeHTML(input)

	assert.Contains(t, result, "Hello")
	assert.Contains(t, result, "world")
	assert.Contains(t, result, "test")
}
