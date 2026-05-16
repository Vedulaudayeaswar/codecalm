package bot

import (
	"context"
	"encoding/json"
	"time"

	"codecalm/codetest/internal/telemetry"
	"github.com/segmentio/kafka-go"
)

type EventPublisher interface {
	Publish(context.Context, telemetry.BotEvent) error
	Close() error
}

type KafkaPublisher struct {
	writer *kafka.Writer
}

func NewKafkaPublisher(brokers []string, topic string) *KafkaPublisher {
	return &KafkaPublisher{
		writer: &kafka.Writer{
			Addr:         kafka.TCP(brokers...),
			Topic:        topic,
			Balancer:     &kafka.LeastBytes{},
			RequiredAcks: kafka.RequireOne,
			Async:        false,
		},
	}
}

func (p *KafkaPublisher) Publish(ctx context.Context, event telemetry.BotEvent) error {
	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		lastErr = p.writer.WriteMessages(ctx, kafka.Message{
			Key:   []byte(time.Now().Format(time.RFC3339Nano)),
			Value: body,
		})
		if lastErr == nil {
			return nil
		}
		time.Sleep(time.Duration(attempt+1) * 150 * time.Millisecond)
	}
	return lastErr
}

func (p *KafkaPublisher) Close() error {
	return p.writer.Close()
}

type NoopPublisher struct{}

func (NoopPublisher) Publish(context.Context, telemetry.BotEvent) error { return nil }
func (NoopPublisher) Close() error                                      { return nil }
