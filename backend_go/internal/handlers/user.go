package handlers

import (
	"github.com/gin-gonic/gin"
)

type UserHandler struct{}

func (h *UserHandler) GetUser(c *gin.Context) {
	id := c.Param("id")
}
