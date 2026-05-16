package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"codecalm/codetest/internal/metrics"
)

func main() {
	sink := metrics.NewRedisSink(env("REDIS_ADDR", "localhost:6379"), env("REDIS_PASSWORD", ""), env("REDIS_CHANNEL", "codetest.metrics"), env("REDIS_METRICS_KEY", "codetest:live"))
	defer sink.Close()

	aggregator := metrics.NewAggregator(10*time.Second, sink)
	log.Println("metrics aggregator consuming Kafka telemetry")

	for {
		if err := aggregator.ConsumeKafka(context.Background(), strings.Split(env("KAFKA_BROKERS", "localhost:9092"), ","), env("KAFKA_TOPIC", "bot-events"), env("KAFKA_GROUP", "metrics-aggregator")); err != nil {
			log.Printf("metrics consumer disconnected: %v; retrying in 3s", err)
			time.Sleep(3 * time.Second)
		}
	}
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
