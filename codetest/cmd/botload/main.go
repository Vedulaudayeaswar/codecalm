package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"codecalm/codetest/internal/bot"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type benchmarkRequest struct {
	Target   string `json:"target"`
	BotCount int    `json:"botCount"`
	Duration string `json:"duration"`
}

func main() {
	publisher := bot.NewKafkaPublisher(strings.Split(env("KAFKA_BROKERS", "localhost:9092"), ","), env("KAFKA_TOPIC", "bot-events"))
	defer publisher.Close()

	if env("BOTLOAD_MODE", "server") == "server" {
		runServer(publisher)
		return
	}

	duration, _ := time.ParseDuration(env("DURATION", "30s"))
	count, _ := strconv.Atoi(env("BOT_COUNT", "100"))

	summary := bot.Run(context.Background(), bot.Config{
		Target:    env("TARGET_URL", "http://localhost:8080/orders"),
		BotCount:  count,
		Duration:  duration,
		Publisher: publisher,
	})

	out, _ := json.MarshalIndent(summary, "", "  ")
	log.Println(string(out))
}

func runServer(publisher bot.EventPublisher) {
	router := gin.Default()
	router.Use(cors.Default())
	router.POST("/benchmark/start", func(c *gin.Context) {
		var req benchmarkRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid benchmark request"})
			return
		}
		if req.Target == "" {
			req.Target = env("TARGET_URL", "http://localhost:8080/orders")
		}
		if req.BotCount <= 0 {
			req.BotCount = 100
		}
		duration, err := time.ParseDuration(req.Duration)
		if err != nil || duration <= 0 {
			duration = 30 * time.Second
		}

		go bot.Run(context.Background(), bot.Config{
			Target:    req.Target,
			BotCount:  req.BotCount,
			Duration:  duration,
			Publisher: publisher,
		})
		c.JSON(http.StatusAccepted, gin.H{"started": true, "botCount": req.BotCount, "target": req.Target, "duration": duration.String()})
	})
	router.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })
	_ = router.Run(":" + env("PORT", "8082"))
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
