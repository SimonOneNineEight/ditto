package handlers

import (
	"ditto-backend/internal/services/urlextractor"
	"ditto-backend/pkg/errors"
	"ditto-backend/pkg/response"
	"log"

	"github.com/gin-gonic/gin"
)

type ExtractHandler struct {
	extractor urlextractor.Extractor
	logger    *log.Logger
}

func NewExtractHandler(logger *log.Logger) *ExtractHandler {
	return &ExtractHandler{
		extractor: urlextractor.New(logger),
		logger:    logger,
	}
}

func (h *ExtractHandler) ExtractJobURL(c *gin.Context) {
	var req urlextractor.ExtractRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.NewValidationError("Invalid request body"))
		return
	}

	data, warnings, err := h.extractor.Extract(c.Request.Context(), req.URL)
	if err != nil {
		appErr := errors.ConvertError(err)
		response.Error(c, appErr)
		return
	}

	if len(warnings) > 0 {
		response.SuccessWithWarnings(c, data, warnings)
	} else {
		response.Success(c, data)
	}
}
