package metrics

import (
	"context"
	"encoding/json"

	"codecalm/codetest/internal/telemetry"
	"github.com/go-redis/redis/v8"
)

type RedisSink struct {
	client  *redis.Client
	channel string
	key     string
}

func NewRedisSink(addr, password, channel, key string) *RedisSink {
	return &RedisSink{
		client:  redis.NewClient(&redis.Options{Addr: addr, Password: password}),
		channel: channel,
		key:     key,
	}
}

func (s *RedisSink) Publish(ctx context.Context, metrics telemetry.LiveMetrics) error {
	body, err := json.Marshal(metrics)
	if err != nil {
		return err
	}
	if err := s.client.Set(ctx, s.key, body, 0).Err(); err != nil {
		return err
	}
	return s.client.Publish(ctx, s.channel, body).Err()
}

func (s *RedisSink) Close() error {
	return s.client.Close()
}
