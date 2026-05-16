package upload

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	BaseDir string
	Runner  DockerRunner
}

type UploadResponse struct {
	ID       string   `json:"id"`
	Language Language `json:"language"`
	Image    string   `json:"image"`
	Logs     string   `json:"logs"`
}

// Register mounts the upload API. Each submission is isolated under
// /submissions/{id} with its generated Dockerfile beside the uploaded source.
func (h Handler) Register(router *gin.Engine) {
	router.POST("/upload", h.Upload)
	router.GET("/submissions/:id/logs", h.Logs)
}

func (h Handler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing multipart field named file"})
		return
	}

	lang, err := DetectLanguage(file.Filename)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := randomID()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to allocate submission id"})
		return
	}

	base := h.BaseDir
	if base == "" {
		base = "submissions"
	}
	dir := filepath.Join(base, id)
	if err := os.MkdirAll(dir, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create submission directory"})
		return
	}

	sourceName := "main" + filepath.Ext(file.Filename)
	sourcePath := filepath.Join(dir, sourceName)
	if err := c.SaveUploadedFile(file, sourcePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store uploaded file"})
		return
	}

	dockerfile, err := DockerfileFor(lang, sourceName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := os.WriteFile(filepath.Join(dir, "Dockerfile"), []byte(dockerfile), 0640); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write Dockerfile"})
		return
	}

	result, err := h.Runner.BuildAndRun(context.Background(), id, dir)
	_ = os.WriteFile(filepath.Join(dir, "execution.log"), []byte(result.Logs), 0640)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"id": id, "language": lang, "image": result.Image, "logs": result.Logs, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, UploadResponse{ID: id, Language: lang, Image: result.Image, Logs: result.Logs})
}

func (h Handler) Logs(c *gin.Context) {
	base := h.BaseDir
	if base == "" {
		base = "submissions"
	}
	logPath := filepath.Join(base, filepath.Base(c.Param("id")), "execution.log")
	data, err := os.ReadFile(logPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "logs not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logs": string(data)})
}

func randomID() (string, error) {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}
