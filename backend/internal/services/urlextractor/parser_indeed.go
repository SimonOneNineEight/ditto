package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"log"
)

type indeedParser struct {
	logger *log.Logger
}

func newIndeedParser(logger *log.Logger) Parser {
	return &indeedParser{logger: logger}
}

func (p *indeedParser) FetchAndParse(ctx context.Context, url string) (*ExtractedJobData, []string, error) {
	// TODO: Implement Indeed API parsing
	return nil, nil, errors.New(errors.ErrorInternalServer, "Indeed parser not yet implemented")
}
