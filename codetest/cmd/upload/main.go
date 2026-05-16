package main

import (
	"os"
	"time"

	"codecalm/codetest/internal/upload"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	handler := upload.Handler{
		BaseDir: env("SUBMISSIONS_DIR", "submissions"),
		Runner: upload.DockerRunner{
			MemoryLimit: env("RUN_MEMORY", "256m"),
			CPULimit:    env("RUN_CPUS", "0.5"),
			Timeout:     15 * time.Second,
		},
	}
	handler.Register(router)

	_ = router.Run(":" + env("PORT", "8081"))
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
