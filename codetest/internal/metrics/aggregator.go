package metrics

import (
	"context"
	"encoding/json"
	"math"
	"sort"
	"sync"
	"time"

	"codecalm/codetest/internal/telemetry"
	"github.com/segmentio/kafka-go"
)

type Sink interface {
	Publish(context.Context, telemetry.LiveMetrics) error
}

type Aggregator struct {
	mu         sync.Mutex
	window     []telemetry.BotEvent
	activeBots map[int]time.Time
	windowSize time.Duration
	sink       Sink
}

func NewAggregator(windowSize time.Duration, sink Sink) *Aggregator {
	return &Aggregator{
		windowSize: windowSize,
		sink:       sink,
		activeBots: make(map[int]time.Time),
	}
}

func (a *Aggregator) Add(event telemetry.BotEvent) telemetry.LiveMetrics {
	a.mu.Lock()
	defer a.mu.Unlock()

	now := time.Now().UTC()
	a.window = append(a.window, event)
	a.activeBots[event.BotID] = now

	cutoff := now.Add(-a.windowSize)
	filtered := a.window[:0]
	for _, item := range a.window {
		if item.Timestamp.After(cutoff) {
			filtered = append(filtered, item)
		}
	}
	a.window = filtered

	for botID, seen := range a.activeBots {
		if seen.Before(cutoff) {
			delete(a.activeBots, botID)
		}
	}

	return calculate(a.window, len(a.activeBots), a.windowSize)
}

func (a *Aggregator) ConsumeKafka(ctx context.Context, brokers []string, topic, groupID string) error {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  groupID,
		MinBytes: 1,
		MaxBytes: 10e6,
	})
	defer reader.Close()

	for {
		msg, err := reader.ReadMessage(ctx)
		if err != nil {
			return err
		}
		var event telemetry.BotEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			continue
		}
		metrics := a.Add(event)
		if a.sink != nil {
			_ = a.sink.Publish(ctx, metrics)
		}
	}
}

func calculate(events []telemetry.BotEvent, activeBots int, window time.Duration) telemetry.LiveMetrics {
	latencies := make([]float64, 0, len(events))
	var failures, successes int64
	for _, event := range events {
		latencies = append(latencies, event.LatencyMS)
		if event.Success {
			successes++
		} else {
			failures++
		}
	}
	sort.Float64s(latencies)

	total := successes + failures
	errorRate := 0.0
	if total > 0 {
		errorRate = float64(failures) / float64(total)
	}

	return telemetry.LiveMetrics{
		TPS:        float64(total) / math.Max(window.Seconds(), 1),
		P50:        percentile(latencies, 0.50),
		P90:        percentile(latencies, 0.90),
		P99:        percentile(latencies, 0.99),
		ActiveBots: activeBots,
		Failures:   failures,
		Successes:  successes,
		ErrorRate:  errorRate,
		UpdatedAt:  time.Now().UTC(),
	}
}

func percentile(values []float64, p float64) float64 {
	if len(values) == 0 {
		return 0
	}
	idx := int(math.Ceil(p*float64(len(values)))) - 1
	if idx < 0 {
		idx = 0
	}
	if idx >= len(values) {
		idx = len(values) - 1
	}
	return values[idx]
}
