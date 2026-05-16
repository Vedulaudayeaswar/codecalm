package telemetry

import "time"

// OrderType models the trading actions produced by simulated bots.
type OrderType string

const (
	OrderBuy    OrderType = "BUY"
	OrderSell   OrderType = "SELL"
	OrderCancel OrderType = "CANCEL"
)

// BotEvent is the durable telemetry record streamed through Kafka.
type BotEvent struct {
	BotID      int       `json:"botId"`
	OrderType  OrderType `json:"orderType"`
	Target     string    `json:"target"`
	StatusCode int       `json:"statusCode"`
	LatencyMS  float64   `json:"latencyMs"`
	Success    bool      `json:"success"`
	Error      string    `json:"error,omitempty"`
	Timestamp  time.Time `json:"timestamp"`
}

// LiveMetrics is the normalized payload stored in Redis and sent to dashboards.
type LiveMetrics struct {
	TPS        float64   `json:"tps"`
	P50        float64   `json:"p50"`
	P90        float64   `json:"p90"`
	P99        float64   `json:"p99"`
	ActiveBots int       `json:"activeBots"`
	Failures   int64     `json:"failures"`
	Successes  int64     `json:"successes"`
	ErrorRate  float64   `json:"errorRate"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
