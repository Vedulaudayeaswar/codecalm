package main

import (
	"context"
	"os"

	"codecalm/codetest/internal/ws"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	hub := ws.NewHub(env("REDIS_ADDR", "localhost:6379"), env("REDIS_PASSWORD", ""), env("REDIS_CHANNEL", "codetest.metrics"))
	hub.Key = env("REDIS_METRICS_KEY", "codetest:live")
	go hub.Run(context.Background())

	router := gin.Default()
	router.Use(cors.Default())
	router.GET("/ws/metrics", hub.Handle)
	router.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })
	_ = router.Run(":" + env("PORT", "8084"))
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
