package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"log"
)

type glassdoorParser struct {
	logger *log.Logger
}

func newGlassdoorParser(logger *log.Logger) Parser {
	return &glassdoorParser{logger: logger}
}

func (p *glassdoorParser) FetchAndParse(ctx context.Context, url string) (*ExtractedJobData, []string, error) {
	// TODO: Implement Glassdoor parsing
	return nil, nil, errors.New(errors.ErrorInternalServer, "Glassdoor parser not yet implemented")
}
