package bot

import (
	"bytes"
	"context"
	"encoding/json"
	"math/rand"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"codecalm/codetest/internal/telemetry"
)

type Config struct {
	Target     string
	BotCount   int
	Duration   time.Duration
	Publisher  EventPublisher
	HTTPClient *http.Client
}

type Summary struct {
	Requests  int64   `json:"requests"`
	Successes int64   `json:"successes"`
	Failures  int64   `json:"failures"`
	TPS       float64 `json:"tps"`
	AvgMS     float64 `json:"avgMs"`
}

// Run starts a fixed worker pool. Each goroutine represents a trading bot that
// produces randomized BUY, SELL, and CANCEL requests until the context ends.
func Run(ctx context.Context, cfg Config) Summary {
	if cfg.BotCount <= 0 {
		cfg.BotCount = 100
	}
	if cfg.Duration <= 0 {
		cfg.Duration = 30 * time.Second
	}
	if cfg.Publisher == nil {
		cfg.Publisher = NoopPublisher{}
	}
	if cfg.HTTPClient == nil {
		cfg.HTTPClient = &http.Client{Timeout: 3 * time.Second}
	}

	runCtx, cancel := context.WithTimeout(ctx, cfg.Duration)
	defer cancel()

	var requests, successes, failures int64
	var totalLatency int64
	var wg sync.WaitGroup
	start := time.Now()

	for botID := 1; botID <= cfg.BotCount; botID++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			source := rand.New(rand.NewSource(time.Now().UnixNano() + int64(id)))
			for {
				select {
				case <-runCtx.Done():
					return
				default:
				}

				event := executeOrder(runCtx, cfg.HTTPClient, cfg.Target, id, source)
				atomic.AddInt64(&requests, 1)
				atomic.AddInt64(&totalLatency, int64(event.LatencyMS*1000))
				if event.Success {
					atomic.AddInt64(&successes, 1)
				} else {
					atomic.AddInt64(&failures, 1)
				}
				_ = cfg.Publisher.Publish(runCtx, event)
				time.Sleep(time.Duration(source.Intn(45)) * time.Millisecond)
			}
		}(botID)
	}

	wg.Wait()
	elapsed := time.Since(start).Seconds()
	count := atomic.LoadInt64(&requests)
	avg := 0.0
	if count > 0 {
		avg = float64(atomic.LoadInt64(&totalLatency)) / float64(count) / 1000
	}

	return Summary{
		Requests:  count,
		Successes: atomic.LoadInt64(&successes),
		Failures:  atomic.LoadInt64(&failures),
		TPS:       float64(count) / elapsed,
		AvgMS:     avg,
	}
}

func executeOrder(ctx context.Context, client *http.Client, target string, botID int, source *rand.Rand) telemetry.BotEvent {
	orderTypes := []telemetry.OrderType{telemetry.OrderBuy, telemetry.OrderSell, telemetry.OrderCancel}
	orderType := orderTypes[source.Intn(len(orderTypes))]
	payload := map[string]any{
		"botId":     botID,
		"orderType": orderType,
		"symbol":    []string{"BTC-USDT", "ETH-USDT", "SOL-USDT"}[source.Intn(3)],
		"quantity":  1 + source.Intn(10),
		"price":     100 + source.Intn(50000),
	}
	body, _ := json.Marshal(payload)

	start := time.Now()
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, target, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	latency := float64(time.Since(start).Microseconds()) / 1000

	event := telemetry.BotEvent{
		BotID:     botID,
		OrderType: orderType,
		Target:    target,
		LatencyMS: latency,
		Success:   err == nil && resp != nil && resp.StatusCode >= 200 && resp.StatusCode < 400,
		Timestamp: time.Now().UTC(),
	}
	if resp != nil {
		event.StatusCode = resp.StatusCode
		_ = resp.Body.Close()
	}
	if err != nil {
		event.Error = err.Error()
	}
	return event
}
