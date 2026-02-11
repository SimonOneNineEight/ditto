package services

import "github.com/microcosm-cc/bluemonday"

type SanitizerService struct {
	policy *bluemonday.Policy
}

func NewSanitizerService() *SanitizerService {
	p := bluemonday.UGCPolicy()

	p.AllowRelativeURLs(false)
	p.RequireNoFollowOnLinks(true)
	p.RequireNoReferrerOnLinks(true)
	p.AddTargetBlankToFullyQualifiedLinks(true)

	return &SanitizerService{policy: p}
}

func (s *SanitizerService) SanitizeHTML(input string) string {
	if input == "" {
		return input
	}
	return s.policy.Sanitize(input)
}
