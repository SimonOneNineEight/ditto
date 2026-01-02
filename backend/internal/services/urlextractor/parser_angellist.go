package urlextractor

import (
	"context"
	"ditto-backend/pkg/errors"
	"log"
)

type angelListParser struct {
	logger *log.Logger
}

func newAngelListParser(logger *log.Logger) Parser {
	return &angelListParser{logger: logger}
}

func (p *angelListParser) FetchAndParse(ctx context.Context, url string) (*ExtractedJobData, []string, error) {
	// TODO: Implement AngelList/Wellfound parsing
	return nil, nil, errors.New(errors.ErrorInternalServer, "AngelList parser not yet implemented")
}
