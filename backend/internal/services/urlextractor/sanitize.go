package urlextractor

import (
	"github.com/microcosm-cc/bluemonday"
)

func sanitizeHTML(html string) string {
	policy := bluemonday.UGCPolicy()
	policy.AllowAttrs("class").OnElements("div", "span")
	policy.AllowAttrs("type").OnElements("ul", "ol")

	return policy.Sanitize(html)
}
